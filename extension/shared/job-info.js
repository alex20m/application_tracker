// Shared helpers for scraping and normalizing job data.
// Loaded as a classic script before each content script (MV3 content scripts
// cannot use ES modules); the CommonJS guard exists only for unit tests.
(function (root) {
  "use strict";

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function firstText(selectors, scope) {
    const doc = scope || document;
    for (const selector of selectors) {
      let el = null;
      try {
        el = doc.querySelector(selector);
      } catch {
        continue;
      }
      const text = cleanText(el && el.textContent);
      if (text) return text;
    }
    return "";
  }

  function truncate(value, max) {
    const text = cleanText(value);
    return text.length > max ? text.slice(0, max) : text;
  }

  function normalizeJob(raw) {
    const job = raw || {};
    return {
      company: truncate(job.company, 200),
      role: truncate(job.role, 200),
      location: truncate(job.location, 200),
      source: truncate(job.source, 200),
      notes: truncate(job.notes, 5000),
    };
  }

  function isCompleteJob(job) {
    return Boolean(job && cleanText(job.company) && cleanText(job.role));
  }

  function jobKey(job) {
    return (
      cleanText(job && job.company).toLowerCase() +
      "::" +
      cleanText(job && job.role).toLowerCase()
    );
  }

  // Fallback when page selectors fail: "(2) Software Engineer | Acme | LinkedIn"
  // becomes { role: "Software Engineer", company: "Acme" }.
  function parseTitleParts(title, siteName) {
    const site = cleanText(siteName).toLowerCase();
    const parts = cleanText(title)
      .replace(/^\(\d+\)\s*/, "")
      .split(/\s[|–—-]\s/)
      .map(cleanText)
      .filter(function (part) {
        return part && part.toLowerCase().indexOf(site) === -1;
      });
    return { role: parts[0] || "", company: parts[1] || "" };
  }

  // Accessible name of a control: aria-label plus visible text.
  function elementLabel(el) {
    if (!el) return "";
    return cleanText((el.getAttribute("aria-label") || "") + " " + (el.textContent || ""));
  }

  // Nearest ancestor whose text matches `pattern`. Job boards render the same
  // prompt as a modal, an inline card, or a list item, so this works from the
  // clicked button outward instead of assuming a dialog wrapper. maxTextLength
  // keeps it from matching a page-sized container that merely contains the
  // phrase somewhere else.
  function findAncestorMatching(el, pattern, maxDepth, maxTextLength) {
    let node = el;
    for (let depth = 0; node && depth < maxDepth; depth += 1) {
      const text = node.textContent || "";
      if (text.length <= maxTextLength && pattern.test(text)) return node;
      node = node.parentElement;
    }
    return null;
  }

  const api = {
    cleanText: cleanText,
    firstText: firstText,
    truncate: truncate,
    normalizeJob: normalizeJob,
    isCompleteJob: isCompleteJob,
    jobKey: jobKey,
    parseTitleParts: parseTitleParts,
    elementLabel: elementLabel,
    findAncestorMatching: findAncestorMatching,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.JobInfo = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
