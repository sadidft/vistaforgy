/* Vista Forgy — service worker sederhana: cache-first, offline penuh */
var CACHE = 'vista-forgy-v1-6-6';
var ASSETS = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
  './js/rng.js', './js/engine.js', './js/generators-core.js', './js/generators-mid.js',
  './js/generators-adv.js', './js/generators-t3.js', './js/generators-t4.js', './js/tables.js', './js/content.js', './js/scheduler.js', './js/progression.js',
  './js/storage.js', './js/crypto.js', './js/audio.js', './js/koa.js', './js/topo3d.js', './assets/vista-192.png', './assets/vista-512.png',
  './js/ui-core.js', './js/ui-screens.js', './js/ui-runner.js', './js/app.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (err) {} });
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
