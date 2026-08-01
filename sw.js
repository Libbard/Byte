 
importScripts('shared/reminders-db.js');

var CACHE_NAME = 'byte-v46';  
var _OLD_CACHE_NOTE_22 = 'byte-v45';  
var _OLD_CACHE_NOTE_21 = 'byte-v44';
var _OLD_CACHE_NOTE_20 = 'byte-v43';  
var _OLD_CACHE_NOTE_19 = 'byte-v42';  
var _OLD_CACHE_NOTE_18 = 'byte-v41';  
var _OLD_CACHE_NOTE = 'byte-v40';  
var PRECACHE_URLS = [
  'shared/garden.css',
  'shared/skin.css',
  'shared/garden.js',
  'shared/garden-data.js',
   
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
