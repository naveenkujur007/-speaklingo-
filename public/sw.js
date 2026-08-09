// LinguaBot Service Worker
// Provides basic offline support: caches the app shell so the installed
// PWA opens instantly even without network. Dynamic API calls still go
// to the network (with a network-first strategy so fresh data is always
// preferred when online).

const CACHE_VERSION = "linguabot-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
];

// Install: pre-cache the app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {
        // Skip failing assets so install doesn't break.
      })
  );
});

// Activate: clean up old caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - For navigation requests (HTML pages): network-first, fall back to cached shell.
// - For static assets (same-origin): stale-while-revalidate.
// - For API calls (/api/*): network-only (always fresh).
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Skip non-GET requests.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Don't intercept cross-origin requests (analytics, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // API calls: always go to network.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, fall back to cached "/".
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/")))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
