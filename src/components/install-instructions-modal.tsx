"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
      className="inline-block align-middle text-accent-strong"
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
      className="inline-block align-middle text-accent-strong"
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
      <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-accent-soft text-accent-strong text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <p className="text-sm text-ink-2 leading-relaxed">
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
        <span className="font-medium text-ink">
          Add to Home Screen
        </span>{" "}
        <PlusIcon />.
      </Step>
      <Step number={3}>
        Tap{" "}
        <span className="font-medium text-ink">
          Add
        </span>{" "}
        in the top-right corner.
      </Step>
      <p className="text-xs text-ink-3 mt-2">
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
        <span className="font-medium text-ink">
          File
        </span>
        .
      </Step>
      <Step number={2}>
        Click{" "}
        <span className="font-medium text-ink">
          Add to Dock…
        </span>
        .
      </Step>
      <Step number={3}>
        Click{" "}
        <span className="font-medium text-ink">
          Add
        </span>{" "}
        to confirm.
      </Step>
      <p className="text-xs text-ink-3 mt-2">
        Requires <strong>Safari 17 or later</strong> on macOS Sonoma or newer.
      </p>
    </div>
  );
}

function ChromeDesktopSteps() {
  return (
    <div className="space-y-4">
      <Step number={1}>
        Look for the{" "}
        <span className="font-medium text-ink">
          install icon
        </span>{" "}
        at the right end of the address bar — it looks like a monitor with a
        small down-arrow (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="inline-block align-middle text-accent-strong"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <path d="M12 7v6M9 10l3 3 3-3" />
        </svg>
        ). Click it, then click{" "}
        <span className="font-medium text-ink">
          Install
        </span>
        .
      </Step>
      <Step number={2}>
        Don&apos;t see the icon? Click the{" "}
        <span className="font-medium text-ink">
          three-dot menu
        </span>{" "}
        (⋮) in the top-right corner, then choose{" "}
        <span className="font-medium text-ink">
          Save and share → Install AppTrack
        </span>
        .
      </Step>
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="space-y-4">
      <Step number={1}>
        Tap the{" "}
        <span className="font-medium text-ink">
          three-dot menu
        </span>{" "}
        (⋮) in the top-right corner of Chrome.
      </Step>
      <Step number={2}>
        Tap{" "}
        <span className="font-medium text-ink">
          Add to Home screen
        </span>
        , then tap{" "}
        <span className="font-medium text-ink">
          Add
        </span>
        .
      </Step>
    </div>
  );
}

function FallbackSteps() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Use your browser&apos;s built-in install or &ldquo;Add to Home
        Screen&rdquo; option — usually found in the browser menu (
        <span className="font-medium">⋮</span> or{" "}
        <span className="font-medium">⋯</span>).
      </p>
    </div>
  );
}

export function InstallInstructionsModal({ platform, onClose }: Props) {
  // useSyncExternalStore gives false on the server (getServerSnapshot) and true
  // on the client (getSnapshot), so we can safely portal to document.body only
  // after hydration — without a setState-in-effect lint violation.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
        : platform === "android"
          ? "Add to Home Screen"
          : "Install AppTrack";

  const overlay = (
    <div className="fixed inset-0 z-50 flex items-center mobile:items-end justify-center p-4">
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
        className="relative z-10 w-full max-w-sm rounded-3xl bg-surface shadow-panel p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex cursor-pointer items-center justify-center min-h-9 min-w-9 rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
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
        {platform === "desktop-chromium" && <ChromeDesktopSteps />}
        {platform === "android" && <AndroidSteps />}
        {platform === "other" && <FallbackSteps />}

        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-full border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          Got it
        </button>
      </div>
    </div>
  );

  // Portal to document.body so `fixed` positioning works relative to the
  // viewport — not relative to any `backdrop-filter` ancestor (e.g. the
  // sticky header), which would confine the modal to the header's bounding box.
  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
