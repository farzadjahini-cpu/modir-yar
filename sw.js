const CACHE="hamyar-v1";
const ASSETS=["./","./index.html","./css/app.css","./js/jalali.js","./js/db.js","./js/auth.js","./js/ui.js","./js/views.js","./js/app.js","./data/seed.json","./manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
