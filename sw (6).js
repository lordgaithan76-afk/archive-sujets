/* Service worker Archive.Sujets : le site s'ouvre instantanément et sans connexion.
   - pages, listes et scripts : servis tout de suite depuis la mémoire, puis mis à jour en arrière-plan
   - PDF, images et bibliothèque d'aperçu : gardés dès qu'ils ont été ouverts une fois (aperçu et téléchargement instantanés ensuite) */
const SHELL="archive-shell-n34", FICHIERS="archive-fichiers";
const PRE=["./","index.html","bientot.html","bientot.js","mentions-legales.html","sujets.js","sujets-ajouts.js","manifest.webmanifest","documents.json"];
const ok=r=>r&&(r.ok||r.type==="opaque");
self.addEventListener("install",e=>{e.waitUntil(caches.open(SHELL).then(c=>Promise.allSettled(PRE.map(u=>c.add(new Request(u,{cache:"reload"}))))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==SHELL&&x!==FICHIERS).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||r.headers.has("range"))return;
  const u=new URL(r.url);
  const lourd=/\.(pdf|png|jpe?g|webp|svg|woff2?)$/i.test(u.pathname)||u.hostname==="cdnjs.cloudflare.com";
  if(lourd){
    /* cache d'abord : instantané et disponible hors connexion une fois ouvert */
    e.respondWith(caches.open(FICHIERS).then(async c=>{
      const h=await c.match(r);if(h)return h;
      try{const x=await fetch(r);if(ok(x))c.put(r,x.clone());return x}catch(err){return Response.error()}
    }));
    return;
  }
  if(u.origin!==location.origin||u.pathname.endsWith("version.json"))return; /* version.json : jamais en mémoire */
  /* pages et données : mémoire d'abord (en ignorant ?source=pwa), mise à jour en arrière-plan */
  e.respondWith(caches.open(SHELL).then(async c=>{
    const h=await c.match(r,{ignoreSearch:true});
    const net=fetch(r,{cache:"no-cache"}).then(x=>{if(ok(x))c.put(r,x.clone());return x});
    if(h){e.waitUntil(net.catch(()=>{}));return h}
    try{return await net}catch(err){
      return (await c.match("./",{ignoreSearch:true}))||new Response("Hors connexion",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    }
  }));
});
