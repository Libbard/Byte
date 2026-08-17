/* عاملُ إبطالٍ — نسخةُ الاختبار انتهت في 2026-08-17.
   يمحو خزائنَ هذه النسخة ويشطب نفسَه، فلا يبقى كاشٌ يخدم صفحاتٍ ميّتة. */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (k) { return k.indexOf('stage-') === 0 || k.indexOf('base-') === 0; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (cs) { cs.forEach(function (c) { c.navigate(c.url); }); })
      .catch(function () {})
  );
});
