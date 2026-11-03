// Service worker: cachuje jen shell (nikdy ntfy). Síť má přednost, cache je záloha pro offline.
const CACHE = "kancelar-shell-v1";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const THREE = "https://unpkg.com/three@0.160.0/build/three.module.js";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.hostname.endsWith("ntfy.sh")) return; // ntfy nikdy nezasahovat
  const own = u.origin === self.location.origin;
  if (!own && r.url !== THREE) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
