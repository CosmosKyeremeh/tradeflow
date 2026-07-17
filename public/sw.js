// Deliberately does no caching. TradeFlow's data (shipments, duty
// calculations, client records) is live business data -- serving a stale
// cached response would be actively wrong, not a graceful offline fallback.
// This service worker exists purely to satisfy the installability
// criteria Android/Chrome checks for "Add to Home Screen": a registered
// worker with a fetch handler, even one that just lets every request pass
// through to the network untouched.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: falls through to normal network handling.
});
