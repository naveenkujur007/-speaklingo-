// SpeakLingo Service Worker v2 — Aggressive Auto-Update
// Cache version bumped to v2 to invalidate all previous caches.
// Strategy: network-first for HTML, stale-while-revalidate for assets.
// On every launch, browser checks for new SW — installs immediately, activates
// on next navigation. Users get latest version without manual refresh.

const CACHE_VERSION = "speaklingo-v2";
const APP_VERSION = "2.0.0"; // bump on every release
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-384.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/favicon-16.png",
];

// Install: pre-cache app shell, force skip waiting for instant update.
self.addEventListener("install", (event) => {
  console.log("[SW] Installing version", APP_VERSION);
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Force activate new SW immediately
      .catch(() => {})
  );
});

// Activate: clean up ALL old caches + claim all clients immediately.
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version", APP_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => {
              console.log("[SW] Deleting old cache:", k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim()) // Take control of all open tabs
      .then(() =>
        // Notify all open tabs that a new version is active
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              version: APP_VERSION,
            });
          });
        })
      )
  );
});

// Listen for messages from the page (e.g., "SKIP_WAITING" or "GET_VERSION")
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "GET_VERSION") {
    event.source.postMessage({ type: "SW_VERSION", version: APP_VERSION });
  }
});

// Fetch: network-first for navigations (instant updates), SWR for assets.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // Never cache API responses

  // Navigations (HTML pages): network-first, fall back to cache.
  // This ensures users always get the latest HTML when online.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((m) => m || caches.match("/"))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images): stale-while-revalidate.
  // Returns cached immediately, fetches new in background for next visit.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Periodic background sync for installed PWAs (where supported)
self.addEventListener("sync", (event) => {
  if (event.tag === "speaklingo-sync") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
    );
  }
});
