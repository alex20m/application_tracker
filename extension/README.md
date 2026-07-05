# Application Tracker Capture (browser extension)

A Chrome/Edge (Manifest V3) extension that saves a job application to your
Application Tracker in one click, from a small popup form.

## How it works

- Click the extension's toolbar icon to open the popup.
- Fill in Company, Role, Location, and Source yourself.
- Click **Save application** to send it to the tracker.
- The background service worker POSTs the job to
  `/api/extension/applications` on your tracker, using the session cookies
  from your normal browser login — no separate API key.
- Duplicates (same company + role on the same day) are skipped server-side.

Nothing is read from the page and nothing is sent unless you click Save.

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

Then click the toolbar icon while looking at a job posting, fill in the
fields, and click **Save application**.
