/* Service worker : PDF et bibliothèque d'aperçu en cache (aperçu et téléchargement instantanés à la 2e fois) */
const V="archive-sujets-n24";
const SHELL=["./","index.html","sujets.js","sujets-ajouts.js","manifest.webmanifest","documents.json"];
const ok=r=>r&&(r.ok||r.type==="opaque");
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET"||r.headers.has("range"))return;
  const u=new URL(r.url),cdn=u.hostname==="cdnjs.cloudflare.com",pdf=u.pathname.endsWith(".pdf");
  const put=res=>{if(ok(res)){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res};
  if(pdf||cdn){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(put)));return}
  if(u.origin===location.origin){e.respondWith(fetch(r).then(put).catch(()=>caches.match(r)))}
});
