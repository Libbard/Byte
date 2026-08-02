 
importScripts('shared/reminders-db.js');

var CACHE_NAME = 'byte-v54';
var PRECACHE_URLS = [
  'shared/garden.css',
  'shared/skin.css',
  'shared/garden.js',
  'shared/garden-data.js',
   
  'shared/reminders-boot.js',
   
  'shared/courses_catalog.json',
   
  'shared/data/curriculum_index.json',
   
  'shared/garden-header.css',
  'shared/garden-header.js',
  'shared/dashboard.css',
  'shared/dashboard.js',
  'shared/onboarding.css',
  'shared/onboarding.js',
  'shared/course-hub.css',
  'shared/course-hub.js',
  'shared/hub.css',
  'shared/hub.js',
  'shared/gpa.css',
  'shared/gpa.js',
  'shared/gpa-forecast.js',
  'shared/schedule.css',
  'shared/schedule.js',
   
  'shared/schedule-plan.css',
  'shared/schedule-plan.js',
  'shared/schedule-print.js',
  'shared/schedule-motivation.js',
  'shared/bottom-nav.css',
  'shared/bottom-nav.js',
  'shared/export-png.js',
  'shared/sw-register.js',
  'shared/search.js',
   
  'shared/endpoints.js',
  'shared/push-client.js',
  'shared/reminders-db.js',
  'shared/reminders.js',
  'shared/reminders-ui.js',
  'shared/reminders.css',
  'shared/data/courses_catalog.json',
   
  'shared/vendor/fontawesome/css/all.min.css',
  'shared/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  'shared/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  'shared/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  'shared/icons/logo-mark.svg',
  'shared/icons/favicon-32.png',
  'shared/icons/apple-touch-icon.png',
  'manifest.json',
   
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      
      return Promise.all(PRECACHE_URLS.map(function(url) {
         
        return cache.add(new Request(url, { cache: 'reload' }))
                    .catch(function() {   });
      }));
    })
  );
   
});

 
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) { return name !== CACHE_NAME; })
                  .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

 

function swTx(ar, en, lang) { return (lang || 'ar') === 'ar' ? ar : en; }

 
function rebuildOptions(item, lang, snoozeOpts, root) {
  var actions = [];
  var snz = (snoozeOpts || [10, 60]).slice(0, 1);
  snz.forEach(function (min) {
    actions.push({
      action: 'snooze:' + min,
      title: min >= 60 ? swTx('غفوة ساعة', 'Snooze 1h', lang)
                       : swTx('غفوة ' + min + ' د', 'Snooze ' + min + 'm', lang)
    });
  });
  actions.push({ action: 'done', title: swTx('تم', 'Done', lang) });

  var again = swTx(' · مؤجَّل', ' · snoozed', lang);
  return {
    body: (item.body || '') + (item.snoozeCount ? again : ''),
    tag: item.id,
    renotify: true,
    icon: (root || '/') + 'shared/icons/icon-192.png',
    badge: (root || '/') + 'shared/icons/favicon-32.png',
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    lang: lang,
    timestamp: item.eventAt || item.fireAt,
     
    data: { id: item.id, kind: item.kind, url: item.url,
            eventAt: item.eventAt, fireAt: item.fireAt, root: root },
    actions: actions
  };
}

function tellClients(msg) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (list) { list.forEach(function (c) { c.postMessage(msg); }); });
}

 
self.addEventListener('push', function (event) {
  event.waitUntil(handleWake());
});

 
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(resubscribe(event));
});

function resubscribe(event) {
  return self.ReminderDB.getMeta('push').then(function (m) {
    if (!m || !m.endpoint || !m.vault || !m.device || !m.key) return null;

     
    var ready = (event && event.newSubscription)
      ? Promise.resolve(event.newSubscription)
      : self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: swB64ToU8(m.key)
        });

    return ready.then(function (sub) {
      var j = sub.toJSON();
      return fetch(String(m.endpoint).replace(/\/+$/, '') + '/v1/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_id: m.vault,
          device_id: m.device,
          subscription: { endpoint: j.endpoint, keys: j.keys }
        })
      });
    });
  }).catch(function () {   });
}

function swB64ToU8(b64) {
  var pad = '='.repeat((4 - (b64.length % 4)) % 4);
  var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  var out = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function handleWake() {
  var now = Date.now();
  var GRACE = 10 * 60 * 1000;   
  var lang = 'ar', snoozeOpts = null, root = null;

  return Promise.all([
    self.ReminderDB.getMeta('lang'),
    self.ReminderDB.getMeta('snooze'),
    self.ReminderDB.getMeta('root'),
    self.ReminderDB.getQueue(),
    self.ReminderDB.firedMap()
  ]).then(function (r) {
    lang = r[0] || 'ar';
    snoozeOpts = r[1];
    root = r[2] || '/';
    var queue = r[3] || [];
    var fired = r[4] || {};

     
    var due = queue.filter(function (i) {
      return i && typeof i.fireAt === 'number'
        && i.fireAt <= now && i.fireAt > now - GRACE
        && !fired[i.id];
    }).sort(function (a, b) { return a.fireAt - b.fireAt; });

    if (!due.length) return fallbackNotice(lang, root, queue, now);

    return Promise.all(due.slice(0, 3).map(function (item) {
      return self.registration
        .showNotification(item.title, rebuildOptions(item, lang, snoozeOpts, root))
        .then(function () { return self.ReminderDB.markFired(item.id, 'push'); })
        .catch(function () {});
    })).then(function () {
       
      if (due.length > 3) {
        var n = due.length - 3;
        return self.registration.showNotification(
          swTx('و' + n + ' تنبيهاً آخر', n + ' more reminders', lang),
          {
            body: swTx('افتح الحديقة لعرضها', 'Open the Garden to view them', lang),
            tag: 'rem-more', renotify: false,
            icon: root + 'shared/icons/icon-192.png',
            badge: root + 'shared/icons/favicon-32.png',
            dir: lang === 'ar' ? 'rtl' : 'ltr', lang: lang,
            data: { id: 'rem-more', url: 'index.html', root: root, fireAt: now }
          }
        ).then(function () {
          return Promise.all(due.slice(3).map(function (i) {
            return self.ReminderDB.markFired(i.id, 'push-collapsed');
          }));
        });
      }
    }).then(function () { return tellClients({ type: 'reminder-pushed' }); });
  }).catch(function () {
     
    return fallbackNotice('ar', '/', [], now);
  });
}

 
function fallbackNotice(lang, root, queue, now) {
  var next = (queue || []).filter(function (i) { return i && i.fireAt > now; })
    .sort(function (a, b) { return a.fireAt - b.fireAt; })[0];
  return self.registration.showNotification(
    swTx('الحديقة الرقمية', 'Digital Garden', lang),
    {
       
      body: next
        ? swTx('استيقظ الموقع بنجاح ✓ — افتح الحديقة لتحديث تنبيهاتك.',
               'Woke up successfully ✓ — open the Garden to refresh your reminders.', lang)
        : swTx('استيقظ الموقع بنجاح ✓ — لا تنبيه مستحقّ على هذا الجهاز الآن.',
               'Woke up successfully ✓ — nothing due on this device right now.', lang),
      tag: 'rem-wake', renotify: true,
      icon: (root || '/') + 'shared/icons/icon-192.png',
      badge: (root || '/') + 'shared/icons/favicon-32.png',
      dir: lang === 'ar' ? 'rtl' : 'ltr', lang: lang,
      data: { id: 'rem-wake', url: 'index.html', root: root, fireAt: now }
    }
  ).catch(function () {});
}

self.addEventListener('notificationclick', function (event) {
  var notif = event.notification;
  var data = notif.data || {};
  var action = event.action || '';
  notif.close();

  var root = data.root || '/';

   
  if (action.indexOf('snooze:') === 0) {
    var mins = parseInt(action.split(':')[1]) || 10;
    event.waitUntil(
      Promise.all([
        self.ReminderDB.getItem(data.id),
        self.ReminderDB.getMeta('lang'),
        self.ReminderDB.getMeta('snooze')
      ]).then(function (r) {
        var item = r[0], lang = r[1] || 'ar', snoozeOpts = r[2];

         
        if (!item) {
          item = {
            id: data.id, kind: data.kind, url: data.url, eventAt: data.eventAt,
            title: notif.title, body: '', snoozeCount: 0
          };
        }
        item.fireAt = Date.now() + mins * 60000;
        item.snoozedTo = item.fireAt;
        item.snoozeCount = (item.snoozeCount || 0) + 1;

        return self.ReminderDB.putItem(item).then(function () {
          var opts = rebuildOptions(item, lang, snoozeOpts, root);
           
          if ('showTrigger' in Notification.prototype) {
            try { opts.showTrigger = new TimestampTrigger(item.fireAt); }
            catch (e) {   }
          }
          return self.registration.showNotification(item.title, opts).catch(function () {});
        }).then(function () {
          return tellClients({ type: 'reminder-snoozed', id: item.id, minutes: mins, fireAt: item.fireAt });
        });
      }).catch(function () {})
    );
    return;
  }

   
  if (action === 'done') {
    event.waitUntil(
      self.ReminderDB.markFired(data.id, 'done')
        .then(function () { return tellClients({ type: 'reminder-done', id: data.id }); })
        .catch(function () {})
    );
    return;
  }

   
  var target = root + (data.url || 'index.html');
  event.waitUntil(
    Promise.all([
      self.ReminderDB.markFired(data.id, 'opened').catch(function () {}),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    ]).then(function (r) {
      var list = r[1] || [];
       
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          c.postMessage({ type: 'reminder-open', id: data.id, url: data.url });
          return c.focus().then(function (cc) {
            if (cc && cc.navigate && cc.url !== target) return cc.navigate(target).catch(function () {});
          });
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }).catch(function () {})
  );
});

 
self.addEventListener('notificationclose', function (event) {
  var data = event.notification.data || {};
  if (!data.id) return;
  event.waitUntil(self.ReminderDB.markFired(data.id, 'dismissed').catch(function () {}));
});

self.addEventListener('fetch', function(event) {
  
  if (event.request.method !== 'GET') return;

  
  var url = event.request.url;
  if (url.includes('firestore') || url.includes('googleapis') ||
      url.includes('workers.dev') || url.includes('google-analytics') ||
      url.includes('googletagmanager')) return;

  
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cachedResponse) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(function() { return cachedResponse; });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
