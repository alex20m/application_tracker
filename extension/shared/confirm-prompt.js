// Small injected yes/no prompt used for external applications ("Did you
// apply?") and for confirming a save to the tracker. Loaded as a classic
// script before the content scripts; the CommonJS guard is for unit tests.
(function (root) {
  "use strict";

  const CONTAINER_ID = "app-tracker-confirm-prompt";
  const AUTO_HIDE_MS = 2 * 60 * 1000;

  function hide() {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();
  }

  function isVisible() {
    return Boolean(document.getElementById(CONTAINER_ID));
  }

  function styleButton(button, primary) {
    button.style.cssText =
      "padding:6px 14px;border-radius:6px;font:600 13px system-ui,sans-serif;cursor:pointer;" +
      (primary
        ? "border:none;background:#111827;color:#fff;"
        : "border:1px solid #d1d5db;background:#fff;color:#111827;");
  }

  // Preview of exactly what would be saved to the tracker.
  function buildJobPreview(job) {
    const rows = [
      ["Company", job.company],
      ["Role", job.role],
      ["Location", job.location],
      ["Source", job.source],
    ].filter(function (row) {
      return row[1];
    });

    const list = document.createElement("dl");
    list.style.cssText =
      "display:grid;grid-template-columns:auto 1fr;gap:2px 10px;margin:0 0 10px;";

    for (const row of rows) {
      const term = document.createElement("dt");
      term.textContent = row[0];
      term.style.cssText = "color:#6b7280;margin:0;";
      const value = document.createElement("dd");
      value.textContent = row[1];
      value.style.cssText = "margin:0;font-weight:600;";
      list.appendChild(term);
      list.appendChild(value);
    }
    return list;
  }

  // show({ title, detail, job, yesLabel, noLabel }, onYes, onNo)
  // `job` renders a field-by-field preview of what would be saved.
  // Replaces any previous prompt; auto-dismisses (without callbacks) if the
  // user ignores it.
  function show(options, onYes, onNo) {
    hide();

    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.style.cssText =
      "position:fixed;top:16px;right:16px;z-index:2147483647;max-width:340px;" +
      "background:#fff;color:#111827;border:1px solid #d1d5db;border-radius:10px;" +
      "box-shadow:0 8px 24px rgba(0,0,0,0.18);padding:14px 16px;" +
      "font:13px/1.4 system-ui,-apple-system,sans-serif;";

    const title = document.createElement("div");
    title.textContent = options.title;
    title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:6px;";
    container.appendChild(title);

    if (options.detail) {
      const detail = document.createElement("div");
      detail.textContent = options.detail;
      detail.style.cssText = "color:#6b7280;margin-bottom:10px;";
      container.appendChild(detail);
    }

    if (options.job) {
      container.appendChild(buildJobPreview(options.job));
    }

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;";

    const yesButton = document.createElement("button");
    yesButton.type = "button";
    yesButton.textContent = options.yesLabel || "Yes";
    styleButton(yesButton, true);
    yesButton.addEventListener("click", function () {
      hide();
      if (onYes) onYes();
    });

    const noButton = document.createElement("button");
    noButton.type = "button";
    noButton.textContent = options.noLabel || "No";
    styleButton(noButton, false);
    noButton.addEventListener("click", function () {
      hide();
      if (onNo) onNo();
    });

    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    container.appendChild(actions);
    document.body.appendChild(container);

    setTimeout(function () {
      if (document.getElementById(CONTAINER_ID) === container) hide();
    }, AUTO_HIDE_MS);
  }

  const api = { show: show, hide: hide, isVisible: isVisible };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ConfirmPrompt = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
