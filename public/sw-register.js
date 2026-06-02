// Capture beforeinstallprompt as early as possible — before React hydrates.
// The event can fire during page load before any useEffect runs, so we stash
// it on window and let the React hook read it on mount.
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch(function (e) { console.error("SW registration failed:", e); });
}
