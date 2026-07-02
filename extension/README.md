# Application Tracker Capture (browser extension)

A Chrome/Edge (Manifest V3) extension that automatically saves jobs you apply
to on **LinkedIn** (Easy Apply) and **Indeed** into your Application Tracker.
It also has a popup for saving the currently viewed job manually.

## How it works

- Content scripts on `linkedin.com/jobs/*` and `*.indeed.com/*` watch for the
  "application sent/submitted" confirmation and scrape the job title, company,
  and location (with `document.title` as a fallback).
- External applications ("Apply" on LinkedIn / "Apply on company site" on
  Indeed) redirect to the company's own site, which shows no confirmation the
  extension can see — so those are captured when you click the apply button,
  with a note saying so. If you end up not applying, delete the entry in the
  tracker.
- The background service worker POSTs the job to
  `/api/extension/applications` on your tracker, using the session cookies
  from your normal browser login — no separate API key.
- Duplicates (same company + role on the same day) are skipped server-side,
  and the extension also debounces repeated detections locally.
- The toolbar badge flashes `✓` (saved), `=` (duplicate), or `!` (failed).
  The popup shows the last capture result and a prefilled manual-save form.

## Install (unpacked)

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
