/*@0.SWJ.1*/
importScripts('shared/reminders-db.js');

var CACHE_NAME = 'stage-1634a41a-garden-1.0.0.49'; /*@0.SWJ.2*/
/*@0.SWJ.3*/ /*@0.SWJ.4*/ /*@0.SWJ.5*/ /*@0.SWJ.6*/ /*@0.SWJ.7*/ /*@0.SWJ.8*/ /*@0.SWJ.9*/ /*@0.SWJ.10*/ /*@0.SWJ.11*/ /*@0.SWJ.12*/ /*@0.SWJ.13*/ /*@0.SWJ.14*/ /*@0.SWJ.15*/ /*@0.SWJ.16*/ /*@0.SWJ.17*/ /*@0.SWJ.18*/ /*@0.SWJ.19*/ /*@0.SWJ.20*/ /*@0.SWJ.21*/ /*@0.SWJ.22*/ /*@0.SWJ.23*/ /*@0.SWJ.24*/ /*@0.SWJ.25*/ /*@0.SWJ.26*/ /*@0.SWJ.27*/ /*@0.SWJ.28*/ /*@0.SWJ.29*/ /*@0.SWJ.30*/ /*@0.SWJ.31*/ /*@0.SWJ.32*/ /*@0.SWJ.33*/ /*@0.SWJ.34*/ /*@0.SWJ.35*/ /*@0.SWJ.36*/ /*@0.SWJ.37*/ /*@0.SWJ.38*/ /*@0.SWJ.39*/ /*@0.SWJ.40*/ /*@0.SWJ.41*/ /*@0.SWJ.42*/
var PRECACHE_URLS = [
  'shared/garden.css',
  'shared/skin.css',
  'shared/garden.js',
  'shared/garden-data.js',
  /*@0.SWJ.108*/
  'shared/garden-telemetry.js',
  /*@0.SWJ.43*/
  'shared/bilingual-name.js',
  /*@0.SWJ.44*/
  'shared/reminders-boot.js',
  /*@0.SWJ.45*/
  'shared/ics-boot.js',
  /*@0.SWJ.46*/
  'shared/courses_catalog.json',
  /*@0.SWJ.47*/
  'shared/data/curriculum_index.json',
  /*@0.SWJ.48*/
  'shared/garden-header.css',
  'shared/garden-header.js',
  'shared/dashboard.css',
  'shared/dashboard.js',
  
  
  'shared/course-hub.css',
  'shared/course-hub.js',
  /*@0.SWJ.49*/
  'shared/semester.css',
  'shared/semester.js',
  /*@0.SWJ.50*/
  'shared/course.css',
  'shared/course.js',
  'shared/instructor-picker.css',
  'shared/instructor-picker.js',
  /*@0.SWJ.51*/
  'shared/course-color.css',
  'shared/course-color.js',
  /*@0.SWJ.52*/
  'shared/subject-tint.js',
  /*@0.SWJ.53*/
  'shared/module-theme.js',
  /*@0.SWJ.54*/
  'shared/due-cards.css',
  'shared/due-cards.js',
  /*@0.SWJ.55*/
  'shared/qr.js',
  /*@0.SWJ.56*/
  'shared/sync-panel.js',
  'shared/sync-panel.css',
  'shared/hub.css',
  'shared/hub.js',
  'shared/gpa.css',
  'shared/gpa.js',
  /*@0.SWJ.57*/
  'shared/first-run.js',
  'shared/gpa-setup.css',
  'shared/gpa-setup.js',
  /*@0.SWJ.58*/
  'hub/settings.html',
  'shared/settings.css',
  'shared/settings.js',
  /*@0.SWJ.59*/
  'shared/reminders-panel.js',
  'shared/gpa-forecast.js',
  /*@0.SWJ.60*/
  'hub/labs.html',
  'shared/labs-hub.css',
  'shared/labs-hub.js',
  'shared/labs-v2/registry.json',
  'labs/programming-languages.html',
  'shared/labs-v2/lab-programming-languages.css',
  'shared/labs-v2/lab-programming-languages.js',
  'shared/labs-v2/lab-pl-syntax.js',
  'shared/labs-v2/lab-pl-inspect.js',
  'shared/labs-v2/lab-pl-marie.js',
  'shared/labs-v2/lab-pl-store.js',
  'shared/labs-v2/lab-pl-io.js',
  'shared/labs-v2/pl-lib/index.json',
  /*@0.SWJ.61*/
  'shared/select.css',
  'shared/select.js',
  'shared/schedule.css',
  'shared/schedule.js',
  /*@0.SWJ.62*/
  'shared/schedule-plan.css',
  'shared/schedule-plan.js',
  'shared/schedule-print.js',
  /*@0.SWJ.63*/
  'shared/sections.css',
  'shared/sections.js',
  'shared/sx-link.js',
  /*@0.SWJ.64*/
  'shared/faculty.css',
  'shared/faculty.js',
  /*@0.SWJ.65*/
  'shared/faculty-panel.js',
  /*@0.SWJ.66*/
  'shared/surface.css',
  'shared/course-rate.js',
  'shared/course-rate.css',
  'shared/course-rate-view.js',
  'shared/course-rate-view.css',
  'hub/ratings.html',
  'shared/my-ratings.js',
  'shared/my-ratings.css',
  'shared/schedule-motivation.js',
  /*@0.SWJ.67*/
  'shared/legacy-data.js',
  'shared/bottom-nav.css',
  'shared/bottom-nav.js',
  'shared/export-png.js',
  'shared/sw-register.js',
  'shared/search.js',
  /*@0.SWJ.68*/
  'shared/endpoints.js',
  'shared/push-client.js',
  /*@0.SWJ.69*/
  'shared/watch-client.js',
  'shared/reminders-db.js',
  'shared/reminders.js',
  'shared/reminders-ui.js',
  'shared/reminders.css',
  /*@0.SWJ.70*/
  'shared/notifications.js',
  'shared/notifications.css',
  /*@0.SWJ.71*/
  'shared/notify-guard.js',
  'shared/notify-guard.css',
  'shared/data/courses_catalog.json',
  /*@0.SWJ.72*/
  'shared/vendor/confetti/confetti.browser.min.js',
  'shared/vendor/fontawesome/css/all.min.css',
  'shared/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  'shared/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  'shared/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  'shared/icons/logo-mark.svg',
  'shared/icons/favicon-32.png',
  'shared/icons/apple-touch-icon.png',
  'tour.html',
  'shared/tour.css',
  'shared/tour.js',
  'shared/data/tour-features.json',
  'shared/tour-media/diagram.webp',
  'shared/tour-media/flashcards.webp',
  'shared/tour-media/gpa-levels.png',
  'shared/tour-media/labs.webp',
  'shared/tour-media/lesson.webp',
  'shared/tour-media/levels.webp',
  'shared/tour-media/schedule.webp',
  'shared/tour-media/semester.webp',
  'shared/vendor/fonts/tour/alexandria-arabic.woff2',
  'shared/vendor/fonts/tour/alexandria-latin.woff2',
  'shared/vendor/fonts/tour/dm-mono-latin.woff2',
  'shared/vendor/fonts/garden/garden-core.css',
  'shared/vendor/fonts/garden/cairo-arabic-400-900.woff2',
  'shared/vendor/fonts/garden/cairo-latin-400-900.woff2',
  'shared/vendor/fonts/garden/inter-latin-400-900.woff2',
  'shared/vendor/fonts/garden/jetbrains-mono-latin-400-800.woff2',
  'manifest.json',
  /*@0.SWJ.73*/
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      /*@0.SWJ.74*/
      return Promise.all(PRECACHE_URLS.map(function(url) {
        /*@0.SWJ.75*/
        return cache.add(new Request(url, { cache: 'reload' }))
                    .catch(function() { /*@0.SWJ.76*/ });
      }));
    })
  );
  /*@0.SWJ.77*/
});

/*@0.SWJ.78*/
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) { return name.indexOf('stage-') === 0 && name !== CACHE_NAME; })
                  .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

/*@0.SWJ.79*/

function swTx(ar, en, lang) { return (lang || 'ar') === 'ar' ? ar : en; }

/*@0.SWJ.80*/
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
    /*@0.SWJ.81*/
    data: { id: item.id, kind: item.kind, url: item.url,
            eventAt: item.eventAt, fireAt: item.fireAt, root: root },
    actions: actions
  };
}

function tellClients(msg) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (list) { list.forEach(function (c) { c.postMessage(msg); }); });
}

/*@0.SWJ.82*/
self.addEventListener('push', function (event) {
  /*@0.SWJ.83*/
  var payload = null;
  try { payload = event.data ? event.data.json() : null; } catch (e) { payload = null; }
  event.waitUntil(
    (payload && payload.r && payload.r.length)
      ? showFromPayload(payload).catch(function () { return handleWake(); })
      : handleWake()
  );
});

/*@0.SWJ.84*/
function showFromPayload(p) {
  var now = Date.now();
  return Promise.all([
    self.ReminderDB.getMeta('lang'),
    self.ReminderDB.getMeta('snooze'),
    self.ReminderDB.getMeta('root')
  ]).then(function (m) {
    var lang = m[0] || 'ar';
    var snoozeOpts = m[1];
    var root = m[2] || '/';

    var items = p.r.slice(0, 3).map(function (r) {
      return {
        id: String(r.i || ('push:' + now)),
        title: String(r.t || ''),
        body: String(r.b || ''),
        /*@0.SWJ.85*/
        url: String(r.u || 'index.html').replace(/^\/+/, '').replace(/[:\\]/g, ''),
        fireAt: Number(r.a) || now,
        eventAt: Number(r.a) || now
      };
    }).filter(function (i) { return i.title; });

    if (!items.length) return Promise.reject(new Error('empty-payload'));

    return Promise.all(items.map(function (item) {
      return self.registration
        .showNotification(item.title, rebuildOptions(item, lang, snoozeOpts, root))
        .then(function () { return self.ReminderDB.markFired(item.id, 'push-payload'); })
        .catch(function () {});
    })).then(function () {
      var extra = (p.n || items.length) - items.length;
      if (extra <= 0) return;
      return self.registration.showNotification(
        swTx('و' + extra + ' تنبيهاً آخر', extra + ' more reminders', lang),
        {
          body: swTx('افتح الحديقة لعرضها', 'Open the Garden to view them', lang),
          tag: 'rem-more', renotify: false,
          icon: root + 'shared/icons/icon-192.png',
          badge: root + 'shared/icons/favicon-32.png',
          dir: lang === 'ar' ? 'rtl' : 'ltr', lang: lang,
          data: { id: 'rem-more', url: 'index.html', root: root, fireAt: now }
        }
      );
    }).then(function () { return tellClients({ type: 'reminder-pushed' }); });
  });
}

/*@0.SWJ.86*/
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(resubscribe(event));
});

function resubscribe(event) {
  return self.ReminderDB.getMeta('push').then(function (m) {
    if (!m || !m.endpoint || !m.vault || !m.device || !m.key) return null;

    /*@0.SWJ.87*/
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
  }).catch(function () { /*@0.SWJ.88*/ });
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
  var GRACE = 10 * 60 * 1000;   /*@0.SWJ.89*/
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

    /*@0.SWJ.90*/
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
      /*@0.SWJ.91*/
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
    /*@0.SWJ.92*/
    return fallbackNotice('ar', '/', [], now);
  });
}

/*@0.SWJ.93*/
function fallbackNotice(lang, root, queue, now) {
  var next = (queue || []).filter(function (i) { return i && i.fireAt > now; })
    .sort(function (a, b) { return a.fireAt - b.fireAt; })[0];
  return self.registration.showNotification(
    swTx('الحديقة الرقمية', 'Digital Garden', lang),
    {
      /*@0.SWJ.94*/
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

  /*@0.SWJ.95*/
  if (action.indexOf('snooze:') === 0) {
    var mins = parseInt(action.split(':')[1]) || 10;
    event.waitUntil(
      Promise.all([
        self.ReminderDB.getItem(data.id),
        self.ReminderDB.getMeta('lang'),
        self.ReminderDB.getMeta('snooze')
      ]).then(function (r) {
        var item = r[0], lang = r[1] || 'ar', snoozeOpts = r[2];

        /*@0.SWJ.96*/
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
          /*@0.SWJ.97*/
          if ('showTrigger' in Notification.prototype) {
            try { opts.showTrigger = new TimestampTrigger(item.fireAt); }
            catch (e) { /*@0.SWJ.98*/ }
          }
          return self.registration.showNotification(item.title, opts).catch(function () {});
        }).then(function () {
          return tellClients({ type: 'reminder-snoozed', id: item.id, minutes: mins, fireAt: item.fireAt });
        });
      }).catch(function () {})
    );
    return;
  }

  /*@0.SWJ.99*/
  if (action === 'done') {
    event.waitUntil(
      self.ReminderDB.markFired(data.id, 'done')
        .then(function () { return tellClients({ type: 'reminder-done', id: data.id }); })
        .catch(function () {})
    );
    return;
  }

  /*@0.SWJ.100*/
  var target = root + (data.url || 'index.html');
  event.waitUntil(
    Promise.all([
      self.ReminderDB.markFired(data.id, 'opened').catch(function () {}),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    ]).then(function (r) {
      var list = r[1] || [];
      /*@0.SWJ.101*/
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

/*@0.SWJ.102*/
self.addEventListener('notificationclose', function (event) {
  var data = event.notification.data || {};
  if (!data.id) return;
  event.waitUntil(self.ReminderDB.markFired(data.id, 'dismissed').catch(function () {}));
});

/*@0.SWJ.103*/
self.addEventListener('fetch', function(event) {
  /*@0.SWJ.104*/
  if (event.request.method !== 'GET') return;

  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }
  /*@0.SWJ.105*/
  if (url.origin !== self.location.origin) return;
  /*@0.SWJ.106*/
  if (url.pathname.indexOf('/v1/') === 0) return;

  /*@0.SWJ.107*/
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
