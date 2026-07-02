// Background service worker: receives detections from content scripts and
// saves them to the tracker with the user's existing web-app session cookies.
// The tracker URL is configured on the options page (host permission is
// requested there, which lets these fetches bypass CORS and send cookies).
"use strict";

const DEFAULT_APP_URL = "http://localhost:3000";
const API_PATH = "/api/extension/applications";
const CONTEXT_TTL_MS = 30 * 60 * 1000;
const RECENT_SAVE_TTL_MS = 5 * 60 * 1000;
const BADGE_MS = 5000;

async function getAppUrl() {
  const { appUrl } = await chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });
  return String(appUrl).replace(/\/+$/, "");
}

function isFilled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function setJobContext(job) {
  await chrome.storage.session.set({ jobContext: { job, savedAt: Date.now() } });
}

async function getJobContext() {
  const { jobContext } = await chrome.storage.session.get("jobContext");
  if (jobContext && Date.now() - jobContext.savedAt < CONTEXT_TTL_MS) {
    return jobContext.job;
  }
  return null;
}

async function wasRecentlySaved(key) {
  const { recentSaves } = await chrome.storage.session.get({ recentSaves: {} });
  const savedAt = recentSaves[key];
  return typeof savedAt === "number" && Date.now() - savedAt < RECENT_SAVE_TTL_MS;
}

async function markSaved(key) {
  const { recentSaves } = await chrome.storage.session.get({ recentSaves: {} });
  const now = Date.now();
  for (const [existingKey, savedAt] of Object.entries(recentSaves)) {
    if (now - savedAt > RECENT_SAVE_TTL_MS) delete recentSaves[existingKey];
  }
  recentSaves[key] = now;
  await chrome.storage.session.set({ recentSaves });
}

function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(function () {
    chrome.action.setBadgeText({ text: "" });
  }, BADGE_MS);
}

async function setLastResult(result) {
  await chrome.storage.session.set({ lastResult: { ...result, at: Date.now() } });
}

async function saveApplication(job) {
  const appUrl = await getAppUrl();

  let response;
  try {
    response = await fetch(appUrl + API_PATH, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: job.company,
        role: job.role,
        location: job.location || "",
        source: job.source || "",
        notes: job.notes || "",
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the tracker. Check the app URL in the extension options.",
    };
  }

  if (response.status === 401) {
    return { ok: false, error: "Not signed in. Open the tracker and log in first." };
  }
  if (!response.ok) {
    return { ok: false, error: "The tracker rejected the application (" + response.status + ")." };
  }

  const data = await response.json().catch(function () {
    return {};
  });
  return { ok: true, duplicate: Boolean(data.duplicate), id: data.id };
}

async function checkAuth() {
  const appUrl = await getAppUrl();

  try {
    const response = await fetch(appUrl + API_PATH, {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 401) return { authenticated: false, appUrl };
    if (!response.ok) return { authenticated: false, appUrl, error: "HTTP " + response.status };
    const data = await response.json();
    return { authenticated: true, appUrl, email: data.email || null };
  } catch {
    return {
      authenticated: false,
      appUrl,
      error: "Could not reach the tracker. Set the app URL in the extension options.",
    };
  }
}

async function handleSubmission(job) {
  let merged = { ...job };

  if (!isFilled(merged.company) || !isFilled(merged.role)) {
    const context = await getJobContext();
    if (context) {
      merged = {
        ...context,
        ...Object.fromEntries(Object.entries(merged).filter(([, value]) => isFilled(value))),
      };
    }
  }

  if (!isFilled(merged.company) || !isFilled(merged.role)) {
    flashBadge("!", "#b91c1c");
    await setLastResult({ ok: false, error: "Couldn't read the job details.", job: merged });
    return;
  }

  const key = merged.company.trim().toLowerCase() + "::" + merged.role.trim().toLowerCase();
  if (await wasRecentlySaved(key)) return;

  const result = await saveApplication(merged);
  if (result.ok) {
    await markSaved(key);
    flashBadge(result.duplicate ? "=" : "✓", "#15803d");
  } else {
    flashBadge("!", "#b91c1c");
  }
  await setLastResult({ ...result, job: merged });
}

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || !message.type) return undefined;

  if (message.type === "job-context") {
    setJobContext(message.job);
    return undefined;
  }
  if (message.type === "application-submitted") {
    handleSubmission(message.job);
    return undefined;
  }
  if (message.type === "save-application") {
    saveApplication(message.job).then(sendResponse);
    return true;
  }
  if (message.type === "check-auth") {
    checkAuth().then(sendResponse);
    return true;
  }
  return undefined;
});
