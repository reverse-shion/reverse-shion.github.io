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

const CACHE = 'rs-v1';
const ASSETS = [
  '/', '/assets/css/style.css',
  '/assets/og.jpg', '/assets/hero-poster.jpg',
  '/assets/favicon.png', '/assets/favicon.svg',
  '/assets/icon-180.png', '/assets/icon-192.png', '/assets/icon-512.png'
];

// ★ install：静的だけ先読み（動画/音声は入れない）
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// ★ activate：古いキャッシュ掃除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ★ fetch：静的＝キャッシュ優先、ページ＝ネット優先
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || e.request.headers.get('accept')?.includes('text/html');
  const isStatic = ['style', 'image', 'font', 'script'].includes(e.request.destination);

  // 動画・音声は素通し
  if (['video','audio'].includes(e.request.destination)) return;

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/')))
    );
  } else if (isStatic) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      }))
    );
  }
});
