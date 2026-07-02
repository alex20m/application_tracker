// Options page: stores the tracker URL and requests host permission for it,
// which lets the background worker send authenticated requests to the app.
"use strict";

const DEFAULT_APP_URL = "http://localhost:3000";

const input = document.getElementById("app-url");
const statusEl = document.getElementById("status");

function showStatus(text, ok) {
  statusEl.textContent = text;
  statusEl.className = ok ? "ok" : "error";
  statusEl.hidden = false;
}

async function init() {
  const { appUrl } = await chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });
  input.value = appUrl;
}

document.getElementById("save").addEventListener("click", async function () {
  let origin;
  try {
    const url = new URL(input.value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad protocol");
    origin = url.origin;
  } catch {
    showStatus("Please enter a valid http(s) URL.", false);
    return;
  }

  const granted = await chrome.permissions
    .request({ origins: [origin + "/*"] })
    .catch(function () {
      return false;
    });
  if (!granted) {
    showStatus("Permission was not granted, so the extension cannot reach the tracker.", false);
    return;
  }

  await chrome.storage.sync.set({ appUrl: origin });
  showStatus("Saved. The extension will save applications to " + origin + ".", true);
});

init();
