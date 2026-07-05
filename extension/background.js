// Background service worker: saves a manually-submitted application to the
// tracker using the user's existing web-app session cookies. The tracker URL
// is configured on the options page (host permission is requested there,
// which lets these fetches bypass CORS and send cookies).
"use strict";

const DEFAULT_APP_URL = "http://localhost:3000";
const API_PATH = "/api/extension/applications";

async function getAppUrl() {
  const { appUrl } = await chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });
  return String(appUrl).replace(/\/+$/, "");
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

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || !message.type) return undefined;

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
