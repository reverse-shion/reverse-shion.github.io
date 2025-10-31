/* /sw.js — 画像と音声だけキャッシュ（超軽量） */
const C='revshion-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==C&&caches.delete(k))))); });
self.addEventListener('fetch',e=>{
  const url=e.request.url;
  if (/\.(png|jpg|jpeg|webp|svg|mp3|ogg|mp4|webm)$/i.test(url)) {
    e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{ c.put(e.request,res.clone()); return res; }))));
  }
});
