/* VITA service worker — caches the app shell for offline use. */
var CACHE = "vita-v86";
var ASSETS = [
  "index.html",
  "app.html",
  "manifest.json",
  "css/base.css",
  "css/app.css",
  "css/landing.css",
  "js/i18n.js",
  "js/ui.js",
  "js/state.js",
  "js/data.js",
  "js/chat-engine.js",
  "js/api.js",
  "js/features.js",
  "js/rep-counter.js",
  "js/auth.js",
  "js/screens-onboarding.js",
  "js/screens-analysis.js",
  "js/screens-tabs.js",
  "js/screens-wellness.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache best-effort; don't fail install if one asset 404s
      return Promise.all(ASSETS.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // never cache the AI proxy
  if (url.pathname.indexOf("/api/") === 0) return;
  // same-origin only
  if (url.origin !== self.location.origin) return;

  // network-first for HTML (fresh app), cache fallback offline
  if (req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") >= 0) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("app.html"); }); })
    );
    return;
  }

  // cache-first for static assets
  e.respondWith(
    caches.match(req).then(function (m) {
      return m || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return m; });
    })
  );
});

/* notification click → focus the app */
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) { if ("focus" in list[i]) return list[i].focus(); }
      if (self.clients.openWindow) return self.clients.openWindow("app.html");
    })
  );
});
