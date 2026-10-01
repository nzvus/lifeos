/**
 * public/sw.js — the service worker (ADR-0019: installable now, offline
 * later). It never caches user data:
 *   - pages: always from the network; without a network, the offline page
 *   - /_next/static/*: cache first (hashed file names: they never change)
 *   - everything else (data, server actions, the API): untouched
 * Bump VERSION when this file's caching changes.
 */
const VERSION = "v1";
const SHELL = `lifeos-shell-${VERSION}`;
const STATIC = "lifeos-static";
const OFFLINE = "/offline";
const MAX_STATIC = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll([OFFLINE, "/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) {
          await cache.put(req, res.clone());
          // Old deploys' files pile up: keep the newest MAX_STATIC.
          const keys = await cache.keys();
          await Promise.all(keys.slice(0, -MAX_STATIC).map((k) => cache.delete(k)));
        }
        return res;
      }),
    );
  }
});
