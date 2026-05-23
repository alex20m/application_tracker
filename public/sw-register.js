if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch(function (e) { console.error("SW registration failed:", e); });
}
