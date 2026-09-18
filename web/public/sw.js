/**
 * Minimal service worker for PWA installability (Chrome) and safe updates.
 * Do not intercept fetches: respondWith(fetch(request)) rejects behind Azure
 * Front Door and turns navigations (e.g. /auth/login) into Failed to fetch.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", () => {
  // Pass-through. Chrome still requires a fetch listener for installability.
})
