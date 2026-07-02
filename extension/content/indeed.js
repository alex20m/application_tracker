// Captures job details on Indeed and detects submitted applications.
// The apply flow moves from www.indeed.com to smartapply.indeed.com (a
// different origin), so job details are forwarded to the background worker
// as "job-context" and merged there if the post-apply page scrape is thin.
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
  const RESEND_COOLDOWN_MS = 60000;

  let lastSentKey = "";
  let lastSentAt = 0;
  let throttleTimer = null;

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

  function isPostApplyPage() {
    if (/post-?apply/i.test(location.pathname)) return true;
    const heading = document.querySelector("h1, h2");
    return Boolean(heading && CONFIRMATION_PATTERN.test(heading.textContent || ""));
  }

  function reportSubmission(extraNotes) {
    // The post-apply page may not repeat the job details; the background
    // worker fills in missing fields from the last "job-context" message.
    let job = scrapeJob();
    if (extraNotes) job = Object.assign({}, job, { notes: extraNotes });

    const key = JobInfo.jobKey(job) + "@" + location.pathname;
    const now = Date.now();
    if (key === lastSentKey && now - lastSentAt < RESEND_COOLDOWN_MS) return;
    lastSentKey = key;
    lastSentAt = now;

    chrome.runtime.sendMessage({ type: "application-submitted", job }).catch(function () {});
  }

  function checkPage() {
    rememberJob();
    if (isPostApplyPage()) reportSubmission();
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

  // "Apply on company site" leaves Indeed with no confirmation page, so the
  // click is the capture signal. Indeed-hosted applies (Smart Apply) are
  // handled by the post-apply detection above instead.
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

      reportSubmission("Auto-captured when opening the company's application page from Indeed.");
    },
    true
  );

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message && message.type === "get-job-info") {
      sendResponse({ job: scrapeJob() });
    }
  });
})();
