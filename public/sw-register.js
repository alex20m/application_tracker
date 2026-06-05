// Capture beforeinstallprompt as early as possible — before React hydrates.
// install-app-button.tsx reads window.__pwaInstallPrompt on click to trigger
// the native install dialog. This is best-effort; the button is always visible
// regardless of whether the event fires.
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch(function (e) { console.error("SW registration failed:", e); });
}
