/* Archive.Sujets : service worker v2 (installation, lecture hors connexion, ouverture rapide) */
const V = 'as-v2';
const PDFS = 'as-pdf-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'offline.html'];
const MAX_PDF = 25;
const LISTE_MS = 4000; /* attente maximale du réseau pour documents.json */

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

function secours(r) {
  if (r.mode === 'navigate') {
    return caches.match('index.html').then((i) => i || caches.match('offline.html'))
      .then((m) => m || new Response('Hors connexion', { status: 503 }));
  }
  return Promise.resolve(new Response('', { status: 504, statusText: 'Hors connexion' }));
}

/* Réponse immédiate depuis la mémoire si elle existe, mise à jour en arrière-plan */
function rapide(e, r) {
  return caches.open(V).then((c) =>
    c.match(r, { ignoreSearch: true }).then((m) => {
      const reseau = fetch(r)
        .then((res) => {
          if (res.ok && res.status === 200) c.put(r, res.clone());
          return res;
        })
        .catch(() => null);
      if (m) { e.waitUntil(reseau); return m; }
      return reseau.then((res) => res || secours(r));
    })
  );
}

/* Réseau d'abord ; si le réseau est trop lent ou absent, on prend la copie gardée */
function reseauDabord(r, store, delai) {
  return new Promise((resolve) => {
    let fini = false;
    const copie = () => caches.match(r, { ignoreSearch: true });
    const t = delai
      ? setTimeout(() => {
          copie().then((m) => { if (m && !fini) { fini = true; resolve(m); } });
        }, delai)
      : null;
    fetch(r)
      .then((res) => {
        if (res.ok && res.status === 200) {
          const cp = res.clone();
          caches.open(store).then((c) => c.put(r, cp)).then(() => store === PDFS && trim(PDFS, MAX_PDF));
        }
        if (!fini) { fini = true; clearTimeout(t); resolve(res); }
      })
      .catch(() => {
        if (fini) return;
        clearTimeout(t);
        copie().then((m) => { fini = true; resolve(m || secours(r)); });
      });
  });
}

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  const p = u.pathname.toLowerCase();

  if (p.endsWith('.pdf')) {
    e.respondWith(reseauDabord(r, PDFS, 0));
  } else if (p.endsWith('documents.json')) {
    e.respondWith(reseauDabord(r, V, LISTE_MS));
  } else {
    e.respondWith(rapide(e, r));
  }
});
