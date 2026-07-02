// Captures job details on Indeed and detects submitted applications.
// The apply flow moves from www.indeed.com to smartapply.indeed.com (a
// different origin), so job details are forwarded to the background worker
// as "job-context" and fetched back when the post-apply page scrape is thin.
// Nothing is stored without the user answering a confirmation prompt that
// previews the captured fields; "Apply on company site" clicks additionally
// require answering "Did you apply?" after returning to the tab.
(function () {
  "use strict";

  const TITLE_SELECTORS = [
    "h1.jobsearch-JobInfoHeader-title",
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '[data-testid="simpler-jobTitle"]',
    ".ia-JobHeader-title",
    'h2[data-testid="viewJobTitle"]',
  ];

  const COMPANY_SELECTORS = [
    '[data-testid="inlineHeader-companyName"]',
    '[data-company-name="true"]',
    '[data-testid="viewJobCompanyName"]',
    ".jobsearch-InlineCompanyRating div",
    ".ia-JobHeader-information span",
  ];

  const LOCATION_SELECTORS = [
    '[data-testid="inlineHeader-companyLocation"]',
    '[data-testid="viewJobCompanyLocation"]',
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
  ];

  const CONFIRMATION_PATTERN =
    /application (has been |was )?submitted|you('|’)ve applied|application complete/i;

  const THROTTLE_MS = 500;
  const REPEAT_COOLDOWN_MS = 60000;
  const PENDING_TTL_MS = 45 * 60 * 1000;
  const RETURN_PROMPT_DELAY_MS = 1500;

  const EXTERNAL_NOTE = "Applied via the company's site (captured from Indeed).";

  let lastSentKey = "";
  let lastSentAt = 0;
  let lastOfferedKey = "";
  let lastOfferedAt = 0;
  let throttleTimer = null;

  // Job whose "Apply on company site" link was clicked, awaiting confirmation.
  let pendingExternalJob = null;
  let pendingExternalAt = 0;

  function scrapeJob() {
    const fallback = JobInfo.parseTitleParts(document.title, "Indeed");
    return JobInfo.normalizeJob({
      role: JobInfo.firstText(TITLE_SELECTORS) || fallback.role,
      company: JobInfo.firstText(COMPANY_SELECTORS) || fallback.company,
      location: JobInfo.firstText(LOCATION_SELECTORS),
      source: "Indeed",
    });
  }

  function rememberJob() {
    const job = scrapeJob();
    if (JobInfo.isCompleteJob(job)) {
      chrome.runtime.sendMessage({ type: "job-context", job }).catch(function () {});
    }
  }

  // The post-apply page may not repeat the job details; fill missing fields
  // from the job context stored in the background worker.
  async function resolveJob() {
    const job = scrapeJob();
    if (JobInfo.isCompleteJob(job)) return job;

    const reply = await chrome.runtime
      .sendMessage({ type: "get-job-context" })
      .catch(function () {
        return null;
      });
    if (!reply || !reply.job) return job;

    const merged = Object.assign({}, reply.job);
    for (const [field, value] of Object.entries(job)) {
      if (value) merged[field] = value;
    }
    return JobInfo.normalizeJob(merged);
  }

  function getPendingExternal() {
    if (pendingExternalJob && Date.now() - pendingExternalAt < PENDING_TTL_MS) {
      return pendingExternalJob;
    }
    return null;
  }

  function clearPendingExternal() {
    pendingExternalJob = null;
  }

  function submitToTracker(job) {
    const key = JobInfo.jobKey(job);
    const now = Date.now();
    if (key === lastSentKey && now - lastSentAt < REPEAT_COOLDOWN_MS) return;
    lastSentKey = key;
    lastSentAt = now;

    chrome.runtime.sendMessage({ type: "application-submitted", job }).catch(function () {});
  }

  // Final gate before anything is stored: shows exactly what would be saved.
  // The cooldown stops the mutation observer from re-opening a prompt the
  // user just answered or dismissed.
  function askToSave(job, title, yesLabel) {
    if (!JobInfo.isCompleteJob(job)) return;

    const key = JobInfo.jobKey(job);
    const now = Date.now();
    if (key === lastOfferedKey && now - lastOfferedAt < REPEAT_COOLDOWN_MS) return;
    lastOfferedKey = key;
    lastOfferedAt = now;

    ConfirmPrompt.show(
      {
        title: title || "Save to your tracker?",
        job,
        yesLabel: yesLabel || "Save",
        noLabel: title ? "No" : "Don't save",
      },
      function () {
        submitToTracker(job);
      },
      function () {}
    );
  }

  function isPostApplyPage() {
    if (/post-?apply/i.test(location.pathname)) return true;
    const heading = document.querySelector("h1, h2");
    return Boolean(heading && CONFIRMATION_PATTERN.test(heading.textContent || ""));
  }

  function checkPage() {
    rememberJob();
    if (isPostApplyPage()) {
      resolveJob().then(function (job) {
        askToSave(job);
      });
    }
  }

  const observer = new MutationObserver(function () {
    if (throttleTimer) return;
    throttleTimer = setTimeout(function () {
      throttleTimer = null;
      checkPage();
    }, THROTTLE_MS);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  checkPage();

  // "Apply on company site" leaves Indeed with no confirmation page. Only
  // mark the job as pending — the user may just be opening the page to look;
  // they confirm after returning to this tab.
  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      if (!target || !target.closest) return;
      const control = target.closest("a, button");
      if (!control) return;

      const label = JobInfo.cleanText(
        (control.getAttribute("aria-label") || "") + " " + (control.textContent || "")
      );
      if (!/apply on company (web)?site|apply now on company/i.test(label)) return;

      const job = scrapeJob();
      if (JobInfo.isCompleteJob(job)) {
        pendingExternalJob = job;
        pendingExternalAt = Date.now();
      }
    },
    true
  );

  function maybePromptOnReturn() {
    if (document.visibilityState !== "visible") return;
    if (!getPendingExternal()) return;

    setTimeout(function () {
      const job = getPendingExternal();
      if (!job) return;
      clearPendingExternal();
      askToSave(Object.assign({}, job, { notes: EXTERNAL_NOTE }), "Did you apply?", "Yes, save it");
    }, RETURN_PROMPT_DELAY_MS);
  }

  document.addEventListener("visibilitychange", maybePromptOnReturn);
  window.addEventListener("focus", maybePromptOnReturn);

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message && message.type === "get-job-info") {
      sendResponse({ job: scrapeJob() });
    }
  });
})();
