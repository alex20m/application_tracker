"use client";

import { useState } from "react";
import { useInstallPrompt } from "@/lib/install";
import { InstallInstructionsModal } from "@/components/install-instructions-modal";
import { BTN_GHOST, BTN_PRIMARY, CARD, TEXT_H3 } from "@/lib/ui";

type Props = {
  variant: "chip" | "card";
};

function DownloadIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function InstallAppButton({ variant }: Props) {
  const { canPrompt, platform, standalone, promptInstall } = useInstallPrompt();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (standalone || dismissed) return null;

  const needsInstructions = platform === "ios" || platform === "safari-macos";
  const isUnsupported = !canPrompt && !needsInstructions;

  const handleClick = async () => {
    if (needsInstructions) {
      setShowModal(true);
      return;
    }
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === "accepted") setDismissed(true);
    }
  };

  if (variant === "chip") {
    // Don't render the chip on unsupported browsers — no useful action
    if (isUnsupported) return null;
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`${BTN_GHOST} gap-1.5`}
          title="Install AppTrack"
        >
          <DownloadIcon />
          <span>Install</span>
        </button>
        {showModal && (
          <InstallInstructionsModal
            platform={platform}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // card variant — always show on settings page, even for unsupported browsers
  return (
    <>
      <div className={CARD}>
        <h2 className={`${TEXT_H3} mb-1`}>Install App</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add AppTrack to your device for quick access — works like a native
          app, no App Store required.
        </p>
        {isUnsupported ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your browser doesn&apos;t support one-click install. Bookmark this
            page for quick access, or open it in Chrome (Android/desktop) or
            Safari (iPhone/iPad/Mac).
          </p>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className={`${BTN_PRIMARY} flex items-center gap-2`}
          >
            <DownloadIcon />
            {needsInstructions ? "How to install" : "Install AppTrack"}
          </button>
        )}
      </div>
      {showModal && (
        <InstallInstructionsModal
          platform={platform}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
