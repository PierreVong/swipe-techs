// Offline support. App files: network first (so updates show up right away), cache as fallback.
// Google Fonts: cache first. A private question collection lives in IndexedDB and never passes through here.
const CACHE = "swipetechs-v5";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png",
  "css/app.css", "js/srs.js", "js/chill.js", "js/private.js", "js/app.js",
  "data/helpers.js", "data/accounting.js", "data/ev.js", "data/valuation.js", "data/dcf.js",
  "data/ma.js", "data/lbo.js", "data/modeling.js", "data/math.js",
  "data/chill/accounting.js", "data/chill/ev.js", "data/chill/valuation.js", "data/chill/dcf.js",
  "data/chill/ma.js", "data/chill/lbo.js", "data/chill/modeling.js",
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
    }));
  }
});
