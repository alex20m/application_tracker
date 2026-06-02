"use client";

import { useState, useEffect } from "react";

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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export interface InstallPromptState {
  canPrompt: boolean;
  platform: Platform;
  standalone: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unsupported">;
}

export function useInstallPrompt(): InstallPromptState {
  // Lazy initializer: if beforeinstallprompt already fired before React
  // hydrated, sw-register.js stashes it on window.__pwaInstallPrompt.
  // Reading it here at mount time means we never miss the event due to
  // the useEffect/paint timing race.
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => {
      if (typeof window === "undefined") return null;
      const early = window.__pwaInstallPrompt ?? null;
      if (early) window.__pwaInstallPrompt = undefined;
      return early;
    });
  const [installed, setInstalled] = useState(false);
  const [platform] = useState<Platform>(detectPlatform);
  const [standalone] = useState<boolean>(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<
    "accepted" | "dismissed" | "unsupported"
  > => {
    if (!deferredPrompt) return "unsupported";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  };

  return {
    canPrompt: !!deferredPrompt && !installed,
    platform,
    standalone,
    promptInstall,
  };
}
