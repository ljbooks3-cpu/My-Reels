const CACHE='my-reels-v21-stable';
const ASSETS=['./','./index.html','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
    if(r.ok&&new URL(e.request.url).origin===location.origin)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));
    return r;
  }).catch(()=>caches.match(e.request)));
});
