/* ============================================================================
 * AURÆ · Smell Printer Prototype — sw.js (Service Worker)
 * Strategia: precache dell'app shell + cache-first per l'offline totale.
 * Percorsi RELATIVI: funziona anche in sottocartella (GitHub Pages project site).
 * ==========================================================================*/

const CACHE = "aurae-v2";

/* File dell'app shell (relativi alla posizione di sw.js). */
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/aromas.js",
  "./js/mixer.js",
  "./js/store.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

/* Installazione: precache dell'intero shell. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => { /* se un asset manca, non blocchiamo l'installazione */ })
  );
});

/* Attivazione: pulizia delle cache vecchie. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch: solo richieste GET same-origin. Cache-first con aggiornamento silenzioso. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nessuna dipendenza esterna: ignora cross-origin

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Ritorna la cache e prova ad aggiornarla in background (stale-while-revalidate).
        fetchAndCache(req).catch(() => {});
        return cached;
      }
      return fetchAndCache(req).catch(() => fallback(req));
    })
  );
});

function fetchAndCache(req) {
  return fetch(req).then((res) => {
    if (res && res.ok && res.type === "basic") {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
    }
    return res;
  });
}

/* Fallback offline: per le navigazioni, servi la home dell'app. */
function fallback(req) {
  if (req.mode === "navigate") return caches.match("./index.html");
  return new Response("", { status: 504, statusText: "Offline" });
}
