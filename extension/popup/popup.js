// Popup: shows sign-in status and lets the user fill out and save an
// application to the tracker.
"use strict";

const authStatus = document.getElementById("auth-status");
const form = document.getElementById("save-form");
const saveButton = document.getElementById("save-button");
const resultEl = document.getElementById("result");

function showResult(text, ok) {
  resultEl.textContent = text;
  resultEl.className = ok ? "ok" : "error";
  resultEl.hidden = false;
}

async function initAuth() {
  const status = await chrome.runtime.sendMessage({ type: "check-auth" }).catch(function () {
    return null;
  });

  if (status && status.authenticated) {
    authStatus.textContent = "Signed in" + (status.email ? " as " + status.email : "");
  } else if (status && status.error) {
    authStatus.textContent = status.error;
  } else {
    authStatus.textContent = "Not signed in. Open the tracker and log in first.";
  }

  const appUrl = status && status.appUrl ? status.appUrl : "";
  const openTracker = document.getElementById("open-tracker");
  if (appUrl) openTracker.href = appUrl + "/applications";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  saveButton.disabled = true;

  const job = {
    company: document.getElementById("company").value,
    role: document.getElementById("role").value,
    location: document.getElementById("location").value,
    source: document.getElementById("source").value,
  };

  const result = await chrome.runtime
    .sendMessage({ type: "save-application", job })
    .catch(function () {
      return { ok: false, error: "Something went wrong." };
    });

  saveButton.disabled = false;
  if (result && result.ok) {
    showResult(result.duplicate ? "Already saved today — skipped." : "Saved to your tracker.", true);
  } else {
    showResult((result && result.error) || "Could not save the application.", false);
  }
});

document.getElementById("open-options").addEventListener("click", function (event) {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

initAuth();
