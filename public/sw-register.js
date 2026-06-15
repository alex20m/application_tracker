// Capture beforeinstallprompt as early as possible — before React hydrates.
// After storing the event, dispatch "pwa-install-available" so components that
// mounted before this event fires can still react. install-app-button.tsx listens
// for both the native event (fires after hydration) and the custom one (fires
// before/during hydration). This is best-effort; the button is always visible
// and falls back to the platform instructions modal when the prompt is unavailable.
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  // Notify already-mounted React components.
  window.dispatchEvent(new Event("pwa-install-available"));
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch(function (e) { console.error("SW registration failed:", e); });
}
