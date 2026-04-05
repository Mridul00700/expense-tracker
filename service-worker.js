const CACHE_NAME = "expense-app-v1";

// ⚠️ If using GitHub Pages, update BASE_PATH
// Example: "/expense-tracker/"
const BASE_PATH = "/expense-tracker";

// Files to cache
const ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/style.css`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/db.js`,
  `${BASE_PATH}/manifest.json`
];

// INSTALL → cache assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // activate immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ACTIVATE → clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim(); // take control immediately
});

// FETCH → serve from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // fallback (optional)
          return caches.match(`${BASE_PATH}/index.html`);
        })
      );
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});