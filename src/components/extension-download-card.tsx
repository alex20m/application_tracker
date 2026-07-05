import { BTN_PRIMARY_LINK, CARD, TEXT_H2 } from "@/lib/ui";
import { ROUTES } from "@/lib/env";

export function ExtensionDownloadCard() {
  return (
    <div className={CARD}>
      <h2 className={`${TEXT_H2} mb-1`}>Browser Extension</h2>
      <p className="text-[13px] text-ink-2 mb-4 max-w-md">
        Click the extension icon while looking at a job posting, fill in the
        details, and save it straight into the tracker. The download comes
        preconfigured for this site, so there is nothing to set up inside the
        extension.
      </p>
      <a href={ROUTES.extensionDownload} className={BTN_PRIMARY_LINK} download>
        Download extension
      </a>
      <details className="mt-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-ink">
          How to install (Chrome, Edge, Brave)
        </summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] text-ink-2">
          <li>
            Unzip the downloaded file (double-click it on Mac, or right-click →
            Extract All on Windows).
          </li>
          <li>
            Type <code>chrome://extensions</code> into the address bar and press
            Enter.
          </li>
          <li>Turn on the Developer mode toggle (top-right corner).</li>
          <li>
            Click Load unpacked and select the unzipped
            application-tracker-extension folder.
          </li>
          <li>
            Done — stay signed in to this site in the same browser, then click
            the extension icon on any job posting to fill out and save an
            application.
          </li>
        </ol>
      </details>
    </div>
  );
}
