/* 善玄精舍通告編輯 — offline cache */
const CACHE = "shanxuan-notice-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./lunar.js",
  "./manifest.webmanifest",
  "./img-000.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/TW-Kai-98_1.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && new URL(req.url).origin === self.location.origin) {
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
