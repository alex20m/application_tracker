"use client";

export type Platform =
  | "android"
  | "ios"
  | "desktop-chromium"
  | "safari-macos"
  | "other";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isMac = /Macintosh/.test(ua);
  const isChromium = /Chrome/.test(ua) || /Edg/.test(ua);

  if (isIOS) return "ios";
  if (isAndroid) return "android";
  if (isMac && isSafari) return "safari-macos";
  if (isChromium) return "desktop-chromium";
  return "other";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS sets this property
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}
