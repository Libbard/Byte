self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var scope = self.registration.scope;
    try {
      var names = await caches.keys();
      for (var i = 0; i < names.length; i++) {
        if (names[i].indexOf('byte-') === 0) { await caches.delete(names[i]); continue; }
        var cache = await caches.open(names[i]);
        var reqs = await cache.keys();
        for (var j = 0; j < reqs.length; j++) {
          if (reqs[j].url.indexOf(scope) === 0) await cache.delete(reqs[j]);
        }
      }
    } catch (e) {}

    try { await self.registration.unregister(); } catch (e) {}

    try {
      var clients = await self.clients.matchAll({ type: 'window' });
      for (var k = 0; k < clients.length; k++) {
        try { await clients[k].navigate(clients[k].url); } catch (e) {}
      }
    } catch (e) {}
  })());
});
