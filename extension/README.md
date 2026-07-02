# Application Tracker Capture (browser extension)

A Chrome/Edge (Manifest V3) extension that captures jobs you apply to on
**LinkedIn** and **Indeed** and saves them into your Application Tracker.
It also has a popup for saving the currently viewed job manually.

## How it works

- Content scripts on `linkedin.com/jobs/*` and `*.indeed.com/*` watch for the
  "application sent/submitted" confirmation and scrape the job title, company,
  and location (with `document.title` as a fallback).
- Nothing is saved silently: every capture shows a small **"Save to your
  tracker?"** prompt in the corner of the page, previewing exactly the fields
  that would be saved (company, role, location, source). Saving only happens
  when you confirm.
- External applications ("Apply" on LinkedIn / "Apply on company site" on
  Indeed) redirect to the company's own site, so clicking apply alone never
  saves anything — you might just be looking. Instead, the job is marked as
  pending: if LinkedIn shows its own "Did you apply?" dialog, answering
  **Yes** leads to the save prompt (answering No discards it); otherwise the
  extension asks "Did you apply?" itself when you return to the tab.
- The background service worker POSTs the job to
  `/api/extension/applications` on your tracker, using the session cookies
  from your normal browser login — no separate API key.
- Duplicates (same company + role on the same day) are skipped server-side,
  and the extension also debounces repeated detections locally.
- The toolbar badge flashes `✓` (saved), `=` (duplicate), or `!` (failed).
  The popup shows the last capture result and a prefilled manual-save form.

## Install (from the app — recommended)

Open the tracker's **Settings** page and click **Download extension**. The
zip it serves is preconfigured for that deployment (host permission + app
URL baked in), so after unzipping you only need:

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select the unzipped folder.
3. Sign in to the tracker in the same browser.

## Install (from the repo)

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select this `extension/` directory.
3. Click the extension's **Settings** (or right-click → Options) and enter
   your tracker URL (e.g. `https://your-tracker.vercel.app` or
   `http://localhost:3000`), then accept the permission prompt.
4. Sign in to the tracker in the same browser.

Then apply to a job on LinkedIn (Easy Apply) or Indeed — it appears in your
tracker under **Applied** with the source set to LinkedIn/Indeed.

## Notes

- Job boards change their DOM frequently. Selectors are best-effort with
  multiple fallbacks; if auto-capture misses, the popup's manual save is
  prefilled from the current page.
- Only LinkedIn/Indeed pages are scraped; nothing else is read or sent.
