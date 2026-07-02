// Detects LinkedIn applications and reports them to the background service
// worker. Easy Apply is detected via LinkedIn's "application sent" modal.
// External applications (plain "Apply", which opens the company's site) are
// never saved from the click alone: LinkedIn's own "Did you apply?" dialog —
// or this extension's prompt when that dialog doesn't appear — must be
// answered first. In every path a confirmation with a preview of the
// captured fields is shown before anything is stored.
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

  const CONFIRMATION_PATTERN =
    /application (was )?sent|application submitted|your application was sent/i;
  // LinkedIn phrases this dialog as "Did you apply?" or "Did you finish
  // applying?" depending on the flow.
  const DID_APPLY_PATTERN = /did you (finish )?apply/i;

  const THROTTLE_MS = 500;
  const REPEAT_COOLDOWN_MS = 60000;
  const PENDING_TTL_MS = 45 * 60 * 1000;
  const RETURN_PROMPT_DELAY_MS = 1500;

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

  function nativeDidApplyDialog() {
    const dialogs = document.querySelectorAll('[role="dialog"], .artdeco-modal');
    for (const dialog of dialogs) {
      if (DID_APPLY_PATTERN.test(dialog.textContent || "")) return dialog;
    }
    return null;
  }

  function checkPage() {
    rememberJob();

    const dialogs = document.querySelectorAll('[role="dialog"], .artdeco-modal');
    for (const dialog of dialogs) {
      if (CONFIRMATION_PATTERN.test(dialog.textContent || "")) {
        // Easy Apply confirmed by LinkedIn itself — still ask before saving.
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

      // Answering LinkedIn's own "Did you apply?" dialog: Yes leads to the
      // save-to-tracker confirmation, No drops the pending job.
      const dialog = target.closest('[role="dialog"], .artdeco-modal');
      if (dialog && DID_APPLY_PATTERN.test(dialog.textContent || "")) {
        const button = target.closest("button");
        if (!button) return;
        const label = JobInfo.cleanText(
          (button.getAttribute("aria-label") || "") + " " + (button.textContent || "")
        );
        if (/^yes\b/i.test(label)) {
          const job = getPendingExternal() || bestKnownJob();
          clearPendingExternal();
          if (job) askToSave(Object.assign({}, job, { notes: EXTERNAL_NOTE }));
        } else if (/^no\b/i.test(label)) {
          clearPendingExternal();
          ConfirmPrompt.hide();
        }
        return;
      }

      // External "Apply" button: only mark the job as pending — the user may
      // just be opening the company page to look. Easy Apply clicks are left
      // to the confirmation-modal detection.
      const applyButton = target.closest(
        ".jobs-apply-button, button[data-live-test-job-apply-button]"
      );
      if (!applyButton) return;

      rememberJob();

      const label = JobInfo.cleanText(
        (applyButton.getAttribute("aria-label") || "") + " " + (applyButton.textContent || "")
      );
      if (/easy apply/i.test(label)) return;

      const job = bestKnownJob();
      if (job) {
        pendingExternalJob = job;
        pendingExternalAt = Date.now();
      }
    },
    true
  );

  // Returning to the LinkedIn tab after an external apply click: if LinkedIn
  // doesn't show its own "Did you apply?" dialog, ask with our prompt.
  function maybePromptOnReturn() {
    if (document.visibilityState !== "visible") return;
    if (!getPendingExternal()) return;

    setTimeout(function () {
      const job = getPendingExternal();
      if (!job) return;
      if (nativeDidApplyDialog()) return; // LinkedIn's dialog takes precedence
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
