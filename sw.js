self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys
        .filter(function (k) { return k.indexOf('garden-') !== 0; })
        .map(function (k) { return caches.delete(k); }));
    } catch (e) {}

    try { await self.registration.unregister(); } catch (e) {}

    try {
      var clients = await self.clients.matchAll({ type: 'window' });
      for (var i = 0; i < clients.length; i++) {
        try { await clients[i].navigate(clients[i].url); } catch (e) {}
      }
    } catch (e) {}
  })());
});
