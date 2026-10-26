/* Archive.Sujets : service worker (installation + lecture hors connexion) */
const V = 'as-v1';
const PDFS = 'as-pdf-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'offline.html'];
const MAX_PDF = 25;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(V)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V && k !== PDFS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  const isPdf = u.pathname.toLowerCase().endsWith('.pdf');
  const store = isPdf ? PDFS : V;

  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok && res.status === 200) {
          const copy = res.clone();
          caches.open(store).then((c) => c.put(r, copy)).then(() => isPdf && trim(PDFS, MAX_PDF));
        }
        return res;
      })
      .catch(() =>
        caches.match(r, { ignoreSearch: true }).then((m) => {
          if (m) return m;
          if (r.mode === 'navigate') return caches.match('index.html').then((i) => i || caches.match('offline.html'));
          return new Response('', { status: 504, statusText: 'Hors connexion' });
        })
      )
  );
});
