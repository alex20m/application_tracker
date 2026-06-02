"use client";

import { useEffect } from "react";
import type { Platform } from "@/lib/install";

type Props = {
  platform: Platform;
  onClose: () => void;
};

function IosShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block align-middle text-indigo-500"
    >
      <path d="M12 2v12M8 6l4-4 4 4" />
      <path d="M20 13v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block align-middle text-indigo-500"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function IosSteps() {
  return (
    <div className="space-y-4">
      <Step number={1}>
        Tap the <IosShareIcon /> <strong>Share</strong> button in the Safari
        toolbar (at the bottom on iPhone, top on iPad).
      </Step>
      <Step number={2}>
        Scroll down and tap{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Add to Home Screen
        </span>{" "}
        <PlusIcon />.
      </Step>
      <Step number={3}>
        Tap{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Add
        </span>{" "}
        in the top-right corner.
      </Step>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Only available in <strong>Safari</strong>. If you&apos;re using Chrome
        or another browser, open this page in Safari first.
      </p>
    </div>
  );
}

function SafariMacSteps() {
  return (
    <div className="space-y-4">
      <Step number={1}>
        In the Safari menu bar, click{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          File
        </span>
        .
      </Step>
      <Step number={2}>
        Click{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Add to Dock…
        </span>
        .
      </Step>
      <Step number={3}>
        Click{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Add
        </span>{" "}
        to confirm.
      </Step>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Requires <strong>Safari 17 or later</strong> on macOS Sonoma or newer.
      </p>
    </div>
  );
}

function FallbackSteps() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Use your browser&apos;s built-in install or &ldquo;Add to Home
        Screen&rdquo; option — usually found in the browser menu (
        <span className="font-medium">⋮</span> or{" "}
        <span className="font-medium">⋯</span>).
      </p>
    </div>
  );
}

export function InstallInstructionsModal({ platform, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title =
    platform === "ios"
      ? "Add to Home Screen"
      : platform === "safari-macos"
        ? "Add to Dock"
        : "Install AppTrack";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center min-h-9 min-w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3L13 13M13 3L3 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {platform === "ios" && <IosSteps />}
        {platform === "safari-macos" && <SafariMacSteps />}
        {platform !== "ios" && platform !== "safari-macos" && <FallbackSteps />}

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
