// Detects LinkedIn applications and reports them to the background service
// worker. Easy Apply is detected via LinkedIn's "application sent"
// modal/toast. External applications (plain "Apply", which opens the
// company's site) are never saved from the click alone: LinkedIn's own
// "Did you finish applying?" prompt — or this extension's prompt when that
// one doesn't appear — must be answered first. In every path a confirmation
// with a preview of the captured fields is shown before anything is stored.
//
// The script is injected on all of linkedin.com (not just /jobs/*): LinkedIn
// is a single-page app, so navigating Feed → Jobs never triggers a page load
// and a /jobs/*-scoped script would simply not exist on the jobs page. The
// "Did you finish applying?" card also shows up outside /jobs/* (e.g. on the
// My Jobs page), rendered variously as a modal, an inline card, or a list
// row — which is why Yes/No clicks are matched by walking up from the button
// to any container with that text, rather than assuming a dialog wrapper.
// LinkedIn's DOM changes often, so every selector list is ordered from most
// to least specific and document.title is the last resort.
(function () {
  "use strict";

  const TITLE_SELECTORS = [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    ".jobs-details-top-card__job-title",
    "h1.t-24",
  ];

  const COMPANY_SELECTORS = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
  ];

  const LOCATION_SELECTORS = [
    ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
  ];

  const APPLY_BUTTON_SELECTOR = [
    ".jobs-apply-button",
    "button[data-live-test-job-apply-button]",
    "#jobs-apply-button-id",
    'button[aria-label^="Apply to"]',
    'button[aria-label^="Easy Apply to"]',
  ].join(", ");

  const CONFIRMATION_PATTERN =
    /application (was )?sent|application submitted|your application was sent/i;
  // LinkedIn phrases this prompt as "Did you apply?" or "Did you finish
  // applying?" depending on the flow.
  const DID_APPLY_PATTERN = /did you (finish )?apply/i;

  const THROTTLE_MS = 500;
  const REPEAT_COOLDOWN_MS = 60000;
  const PENDING_TTL_MS = 45 * 60 * 1000;
  const RETURN_PROMPT_DELAY_MS = 1500;
  const ANCESTOR_MAX_DEPTH = 12;
  const ANCESTOR_MAX_TEXT = 1500;

  const EXTERNAL_NOTE = "Applied via the company's site (captured from LinkedIn).";

  let lastSeenJob = null;
  let lastSentKey = "";
  let lastSentAt = 0;
  let lastOfferedKey = "";
  let lastOfferedAt = 0;
  let throttleTimer = null;

  // Job whose external "Apply" button was clicked, awaiting confirmation.
  let pendingExternalJob = null;
  let pendingExternalAt = 0;

  function scrapeJob() {
    const fallback = JobInfo.parseTitleParts(document.title, "LinkedIn");
    return JobInfo.normalizeJob({
      role: JobInfo.firstText(TITLE_SELECTORS) || fallback.role,
      company: JobInfo.firstText(COMPANY_SELECTORS) || fallback.company,
      location: JobInfo.firstText(LOCATION_SELECTORS),
      source: "LinkedIn",
    });
  }

  function bestKnownJob() {
    const job = scrapeJob();
    if (JobInfo.isCompleteJob(job)) return job;
    return lastSeenJob;
  }

  // The job top card disappears behind the Easy Apply modal, so the details
  // must be captured while browsing, before any confirmation appears.
  function rememberJob() {
    const job = scrapeJob();
    if (JobInfo.isCompleteJob(job)) {
      lastSeenJob = job;
      chrome.runtime.sendMessage({ type: "job-context", job }).catch(function () {});
    }
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

  // The "Did you finish applying?" card on the My Jobs page carries the job
  // inside a standard entity lockup; on job pages the card may not.
  function extractJobFromCard(container) {
    return JobInfo.normalizeJob({
      role: JobInfo.firstText(
        ['a[href*="/jobs/view/"]', ".artdeco-entity-lockup__title"],
        container
      ),
      company: JobInfo.firstText([".artdeco-entity-lockup__subtitle"], container),
      location: "",
      source: "LinkedIn",
    });
  }

  // Yes was clicked on a "Did you finish applying?" prompt: figure out which
  // job it was about, preferring the one whose Apply button we saw clicked.
  async function resolveExternalJob(container) {
    const pending = getPendingExternal();
    if (pending) return pending;

    const fromCard = container ? extractJobFromCard(container) : null;
    if (fromCard && JobInfo.isCompleteJob(fromCard)) return fromCard;

    const known = bestKnownJob();
    if (known && JobInfo.isCompleteJob(known)) return known;

    // Last resort: the most recent job any tab forwarded to the background.
    const reply = await chrome.runtime
      .sendMessage({ type: "get-job-context" })
      .catch(function () {
        return null;
      });
    return reply && reply.job ? reply.job : null;
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

  function findDidApplyContainer(el) {
    const bounded = JobInfo.findAncestorMatching(
      el,
      DID_APPLY_PATTERN,
      ANCESTOR_MAX_DEPTH,
      ANCESTOR_MAX_TEXT
    );
    if (bounded) return bounded;

    // Modals can exceed the text cap; fall back to an explicit dialog check.
    const dialog = el.closest('[role="dialog"], .artdeco-modal');
    if (dialog && DID_APPLY_PATTERN.test(dialog.textContent || "")) return dialog;
    return null;
  }

  function nativeDidApplyPromptPresent() {
    const candidates = document.querySelectorAll(
      '[role="dialog"], .artdeco-modal, [class*="post-apply"], [data-test-post-apply]'
    );
    for (const candidate of candidates) {
      if (DID_APPLY_PATTERN.test(candidate.textContent || "")) return true;
    }
    return false;
  }

  function checkPage() {
    rememberJob();

    // Easy Apply confirmation: shown as a modal or, in some flows, a toast.
    const confirmations = document.querySelectorAll(
      '[role="dialog"], .artdeco-modal, .artdeco-toast-item, [role="alert"]'
    );
    for (const el of confirmations) {
      if (CONFIRMATION_PATTERN.test(el.textContent || "")) {
        askToSave(lastSeenJob || scrapeJob());
        break;
      }
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

  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      if (!target || !target.closest) return;

      // Answering "Did you finish applying?" (modal, inline card, or My Jobs
      // row): Yes leads to the save-to-tracker confirmation, No drops the
      // pending job.
      const answerButton = target.closest("button");
      if (answerButton) {
        const answer = JobInfo.elementLabel(answerButton);
        const isYes = /^yes\b/i.test(answer);
        const isNo = /^no\b/i.test(answer);
        if (isYes || isNo) {
          const container = findDidApplyContainer(answerButton);
          if (container) {
            if (isYes) {
              resolveExternalJob(container).then(function (job) {
                if (job) askToSave(Object.assign({}, job, { notes: EXTERNAL_NOTE }));
              });
            } else {
              ConfirmPrompt.hide();
            }
            clearPendingExternal();
            return;
          }
        }
      }

      // External "Apply" button: only mark the job as pending — the user may
      // just be opening the company page to look. Easy Apply clicks are left
      // to the confirmation-modal detection.
      const applyButton = target.closest(APPLY_BUTTON_SELECTOR);
      if (!applyButton) return;

      rememberJob();

      if (/easy apply/i.test(JobInfo.elementLabel(applyButton))) return;

      const job = bestKnownJob();
      if (job) {
        pendingExternalJob = job;
        pendingExternalAt = Date.now();
      }
    },
    true
  );

  // Returning to the LinkedIn tab after an external apply click: if LinkedIn
  // doesn't show its own "Did you finish applying?" prompt, ask with ours.
  function maybePromptOnReturn() {
    if (document.visibilityState !== "visible") return;
    if (!getPendingExternal()) return;

    setTimeout(function () {
      const job = getPendingExternal();
      if (!job) return;
      if (nativeDidApplyPromptPresent()) return; // LinkedIn's prompt takes precedence
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
