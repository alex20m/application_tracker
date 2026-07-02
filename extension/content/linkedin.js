// Detects LinkedIn Easy Apply submissions and reports them to the background
// service worker. LinkedIn's DOM changes often, so every selector list is
// ordered from most to least specific and document.title is the last resort.
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

  const CONFIRMATION_PATTERN =
    /application (was )?sent|application submitted|your application was sent/i;

  const THROTTLE_MS = 500;
  const RESEND_COOLDOWN_MS = 60000;

  let lastSeenJob = null;
  let lastSentKey = "";
  let lastSentAt = 0;
  let throttleTimer = null;

  function scrapeJob() {
    const fallback = JobInfo.parseTitleParts(document.title, "LinkedIn");
    return JobInfo.normalizeJob({
      role: JobInfo.firstText(TITLE_SELECTORS) || fallback.role,
      company: JobInfo.firstText(COMPANY_SELECTORS) || fallback.company,
      location: JobInfo.firstText(LOCATION_SELECTORS),
      source: "LinkedIn",
    });
  }

  // The job top card disappears behind the Easy Apply modal, so the details
  // must be captured while browsing, before the confirmation appears.
  function rememberJob() {
    const job = scrapeJob();
    if (JobInfo.isCompleteJob(job)) {
      lastSeenJob = job;
      chrome.runtime.sendMessage({ type: "job-context", job }).catch(function () {});
    }
  }

  function reportSubmission(extraNotes) {
    let job = lastSeenJob && JobInfo.isCompleteJob(lastSeenJob) ? lastSeenJob : scrapeJob();
    if (extraNotes) job = Object.assign({}, job, { notes: extraNotes });

    const key = JobInfo.jobKey(job);
    const now = Date.now();
    if (key === lastSentKey && now - lastSentAt < RESEND_COOLDOWN_MS) return;
    lastSentKey = key;
    lastSentAt = now;

    chrome.runtime.sendMessage({ type: "application-submitted", job }).catch(function () {});
  }

  function checkPage() {
    rememberJob();

    const dialogs = document.querySelectorAll('[role="dialog"], .artdeco-modal');
    for (const dialog of dialogs) {
      if (CONFIRMATION_PATTERN.test(dialog.textContent || "")) {
        reportSubmission();
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

  // Non-Easy-Apply jobs open the company's own site and LinkedIn never shows
  // a confirmation, so the click on the Apply button is the capture signal.
  // Easy Apply clicks are skipped here; the confirmation modal handles them.
  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      if (!target || !target.closest) return;
      const button = target.closest(
        ".jobs-apply-button, button[data-live-test-job-apply-button]"
      );
      if (!button) return;

      rememberJob();

      const label = JobInfo.cleanText(
        (button.getAttribute("aria-label") || "") + " " + (button.textContent || "")
      );
      if (/easy apply/i.test(label)) return;

      reportSubmission("Auto-captured when opening the company's application page from LinkedIn.");
    },
    true
  );

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message && message.type === "get-job-info") {
      sendResponse({ job: scrapeJob() });
    }
  });
})();
