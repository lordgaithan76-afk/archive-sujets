const C="archive-sujets-v3";
const CORE=["./","index.html","sujets.js","manifest.webmanifest","icon-192.png","icon-512.png","documents.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const q=e.request;
  if(q.method!=="GET"||q.headers.has("range")||/\.pdf(\?|$)/i.test(q.url)||!q.url.startsWith(self.location.origin))return;
  e.respondWith(fetch(q).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(q,c))}return r}).catch(()=>caches.match(q).then(r=>r||(q.mode==="navigate"?caches.match("index.html"):Response.error()))));
});
