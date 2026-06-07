"use client";

import { useState, useEffect } from "react";
import { detectPlatform, isStandalone } from "@/lib/install";
import { InstallInstructionsModal } from "@/components/install-instructions-modal";
import { BTN_GHOST, BTN_PRIMARY, CARD, TEXT_H3 } from "@/lib/ui";

type Props = {
  variant: "chip" | "card" | "icon";
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
  const [showModal, setShowModal] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [platform] = useState(detectPlatform);
  const [standalone] = useState(isStandalone);

  useEffect(() => {
    const onInstalled = () => setHidden(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (standalone || hidden) return null;

  const handleClick = async () => {
    const event = window.__pwaInstallPrompt;
    if (event) {
      try {
        await event.prompt();
        const { outcome } = await event.userChoice;
        window.__pwaInstallPrompt = undefined;
        if (outcome === "accepted") {
          setHidden(true);
          return;
        }
      } catch {
        // event already consumed or unavailable — fall through to modal
      }
    }
    setShowModal(true);
  };

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install AppTrack"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
        >
          <DownloadIcon />
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

  if (variant === "chip") {
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

  return (
    <>
      <div className={CARD}>
        <h2 className={`${TEXT_H3} mb-1`}>Install App</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add AppTrack to your device for quick access — works like a native
          app, no App Store required.
        </p>
        <button
          type="button"
          onClick={handleClick}
          className={`${BTN_PRIMARY} flex items-center gap-2`}
        >
          <DownloadIcon />
          Install AppTrack
        </button>
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
