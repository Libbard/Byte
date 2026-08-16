/*@3.REMJ.1*/
;(function () {
  'use strict';

  var LS_KEY = 'garden_reminders';
  var TICK_MS = 30 * 1000;
  var HORIZON_DAYS = 14;      /*@3.REMJ.2*/
  var MAX_QUEUE = 200;
  var MAX_PREVIEW = 8;        /*@3.REMJ.3*/
  var MAX_TRIGGERS = 30;      /*@3.REMJ.4*/
  var GRACE_MS = 5 * 60 * 1000; /*@3.REMJ.5*/

  var DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  /*@3.REMJ.6*/
  function lang() {
    return document.documentElement.getAttribute('lang')
      || localStorage.getItem('garden_lang') || 'ar';
  }
  function tx(ar, en) { return lang() === 'ar' ? ar : en; }

  /*@3.REMJ.7*/

  function defaults() {
    return {
      enabled: false,
      channels: {
        lectures: true,     /*@3.REMJ.8*/
        exams: true,        /*@3.REMJ.9*/
        tasks: true,        /*@3.REMJ.10*/
        review: false       /*@3.REMJ.11*/
      },
      /*@3.REMJ.12*/
      lead: {
        lectures: 15,
        exams: 1440,        /*@3.REMJ.13*/
        tasks: 720          /*@3.REMJ.14*/
      },
      reviewTime: '20:00',
      quiet: { on: false, from: '00:00', to: '07:00' },
      snooze: [10, 60],     /*@3.REMJ.15*/
      lastCatchUp: 0
    };
  }

  function deepMerge(base, over) {
    if (!over || typeof over !== 'object') return base;
    Object.keys(over).forEach(function (k) {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        deepMerge(base[k], over[k]);
      } else if (over[k] !== undefined && over[k] !== null) {
        base[k] = over[k];
      }
    });
    return base;
  }

  var settings = null;

  function load() {
    if (settings) return settings;
    settings = defaults();
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) deepMerge(settings, JSON.parse(raw));
    } catch (e) { /*@3.REMJ.16*/ }

    /*@3.REMJ.17*/
    try {
      var raws = localStorage.getItem('weekly_schedule');
      var sch = raws ? JSON.parse(raws) : null;
      var legacy = sch && sch.settings ? sch.settings.reminder_lead : null;
      if (legacy && !localStorage.getItem(LS_KEY)) settings.lead.lectures = parseInt(legacy) || 15;
    } catch (e) { /*@3.REMJ.18*/ }

    return settings;
  }

  function save(patch) {
    load();
    if (patch) deepMerge(settings, patch);
    try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch (e) {}

    /*@3.REMJ.19*/
    try {
      var raws = localStorage.getItem('weekly_schedule');
      if (raws) {
        var sch = JSON.parse(raws);
        if (sch && sch.settings) {
          sch.settings.reminder_lead = settings.lead.lectures;
          localStorage.setItem('weekly_schedule', JSON.stringify(sch));
        }
      }
    } catch (e) {}

    if (self.ReminderDB) {
      ReminderDB.setMeta('lang', lang());
      ReminderDB.setMeta('snooze', settings.snooze);
      /*@3.REMJ.20*/
      ReminderDB.setMeta('root', rootPath());
    }
    return sync();
  }

  /*@3.REMJ.21*/

  function capability() {
    var hasAPI = ('Notification' in self);
    var hasSW = ('serviceWorker' in navigator);
    var hasTrigger = hasAPI && ('showTrigger' in Notification.prototype);
    var standalone = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || navigator.standalone === true;
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    /*@3.REMJ.22*/
    var hasPush = hasSW && ('PushManager' in self)
      && !!(self.GardenPush && GardenPush.supported());

    return {
      supported: hasAPI && hasSW,
      permission: hasAPI ? Notification.permission : 'unsupported',
      /*@3.REMJ.23*/
      background: hasTrigger || hasPush,
      push: hasPush,
      trigger: hasTrigger,
      installed: standalone,
      iOS: iOS,
      /*@3.REMJ.24*/
      needsInstall: iOS && !standalone,
      maxActions: hasAPI && Notification.maxActions ? Notification.maxActions : 2
    };
  }

  /*@3.REMJ.25*/

  function requestPermission() {
    var cap = capability();
    if (!cap.supported) return Promise.resolve('unsupported');
    if (cap.needsInstall) return Promise.resolve('needs-install');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    /*@3.REMJ.26*/
    try {
      var r = Notification.requestPermission();
      return (r && r.then ? r : new Promise(function (res) { Notification.requestPermission(res); }));
    } catch (e) {
      return Promise.resolve('denied');
    }
  }

  /*@3.REMJ.27*/

  function parseHM(hm) {
    var p = String(hm || '').split(':');
    return { h: parseInt(p[0]) || 0, m: parseInt(p[1]) || 0 };
  }

  /*@3.REMJ.28*/
  function toLocalTime(due) {
    if (!due) return null;
    var s = String(due);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!m) return null;
    var hasTime = m[4] !== undefined;
    var d = new Date(+m[1], +m[2] - 1, +m[3], hasTime ? +m[4] : 23, hasTime ? +m[5] : 59, 0, 0);
    return { ms: d.getTime(), allDay: !hasTime };
  }

  function stamp(ms) {
    var d = new Date(ms);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
      + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function fmtWhen(ms) {
    var d = new Date(ms);
    var opts = { weekday: 'long', hour: 'numeric', minute: '2-digit' };
    try {
      return d.toLocaleString(lang() === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', opts);
    } catch (e) { return d.toLocaleString(); }
  }

  /*@3.REMJ.29*/
  function applyQuiet(ms) {
    var s = load();
    if (!s.quiet.on) return ms;
    var from = parseHM(s.quiet.from), to = parseHM(s.quiet.to);
    var d = new Date(ms);
    var mins = d.getHours() * 60 + d.getMinutes();
    var f = from.h * 60 + from.m, t = to.h * 60 + to.m;
    var inside = (f <= t) ? (mins >= f && mins < t) : (mins >= f || mins < t);
    if (!inside) return ms;
    var end = new Date(ms);
    end.setHours(to.h, to.m, 0, 0);
    if (end.getTime() <= ms) end.setDate(end.getDate() + 1);
    return end.getTime();
  }

  /*@3.REMJ.30*/

  function scheduleRaw() {
    try { return JSON.parse(localStorage.getItem('weekly_schedule')) || {}; }
    catch (e) { return {}; }
  }

  function courseName(code) {
    if (!code) return '';
    try {
      if (window.GardenData && GardenData.dispName) return GardenData.dispName(code) || code;
    } catch (e) {}
    return code;
  }

  /*@3.REMJ.31*/
  var TYPE_LABEL = {
    assignment: ['تسليم', 'Assignment'],
    hw: ['واجب', 'Homework'],
    reading: ['قراءة', 'Reading'],
    quiz: ['كويز', 'Quiz'],
    exam: ['اختبار', 'Exam'],
    midterm: ['اختبار منتصف الفصل', 'Midterm'],
    final: ['الاختبار النهائي', 'Final exam'],
    project: ['مشروع', 'Project'],
    discussion: ['مناقشة', 'Discussion'],
    note: ['تذكير', 'Reminder'],
    other: ['مهمة', 'Task'],
    task: ['مهمة', 'Task']
  };

  function typeLabel(t) {
    var e = TYPE_LABEL[t];
    return e ? tx(e[0], e[1]) : tx('موعد', 'Deadline');
  }

  /*@3.REMJ.32*/
  function lectureOccurrences(now, horizon) {
    var s = load();
    var sch = scheduleRaw();
    var lecs = sch.lectures || [];
    if (!lecs.length) return [];

    var endMs = Infinity;
    var endStr = sch.settings && sch.settings.semester_end_date;
    if (endStr) {
      var e = toLocalTime(endStr);
      if (e) endMs = e.ms;
    }

    var out = [];
    lecs.forEach(function (l) {
      if (!l || !l.day || !l.start_time) return;
      var dayIdx = DAYS_ORDER.indexOf(l.day);
      if (dayIdx < 0) return;
      var hm = parseHM(l.start_time);

      for (var i = 0; i <= HORIZON_DAYS; i++) {
        var d = new Date(now);
        d.setDate(d.getDate() + i);
        if (d.getDay() !== dayIdx) continue;
        d.setHours(hm.h, hm.m, 0, 0);
        var startMs = d.getTime();
        if (startMs > endMs) continue;
        var fireAt = startMs - (s.lead.lectures || 0) * 60000;
        /*@3.REMJ.33*/
        if (fireAt > horizon) continue;

        var cname = courseName(l.course_code);
        var where = l.attendance === 'in_person' && l.room
          ? tx(' · قاعة ', ' · Room ') + l.room
          : (l.attendance === 'in_person' ? '' : tx(' · عن بُعد', ' · Online'));

        out.push({
          id: 'lec:' + (l.id || l.course_code + l.day + l.start_time) + ':' + stamp(startMs),
          kind: 'lectures',
          title: tx('محاضرة ', 'Lecture · ') + cname,
          body: tx('تبدأ ', 'Starts ') + fmtWhen(startMs) + where,
          fireAt: applyQuiet(fireAt),
          eventAt: startMs,
          url: 'hub/schedule.html',
          course: l.course_code || null
        });
      }
    });
    return out;
  }

  /*@3.REMJ.34*/
  function deadlineReminders(now, horizon) {
    var s = load();
    if (!window.GardenData || !GardenData.allDeadlines) return [];
    var list = [];
    try { list = GardenData.allDeadlines() || []; } catch (e) { return []; }

    var out = [];
    list.forEach(function (t) {
      if (!t || t.done || !t.due) return;

      var channel = (t.source === 'exam' || t.type === 'exam' || t.type === 'midterm' || t.type === 'final')
        ? 'exams' : 'tasks';
      if (!s.channels[channel]) return;

      var when = toLocalTime(t.due);
      if (!when) return;

      /*@3.REMJ.35*/
      var eventMs = when.ms;
      if (when.allDay) {
        var d = new Date(eventMs); d.setHours(8, 0, 0, 0);
        eventMs = d.getTime();
      }

      var leadMin = (channel === 'exams') ? s.lead.exams : s.lead.tasks;
      var fireAt = eventMs - (leadMin || 0) * 60000;
      if (fireAt > horizon) return;   /*@3.REMJ.36*/

      var cname = t.course ? courseName(t.course) : '';
      var head = typeLabel(t.type) + (cname ? tx(' · ', ' · ') + cname : '');
      var titleTxt = (t.title || '').trim();

      out.push({
        id: 'dl:' + t.source + ':' + t.id + ':' + stamp(eventMs),
        kind: channel,
        title: titleTxt ? (head + ' — ' + titleTxt) : head,
        body: tx('الموعد ', 'Due ') + fmtWhen(eventMs),
        fireAt: applyQuiet(fireAt),
        eventAt: eventMs,
        url: 'index.html#tasks',
        course: t.course || null
      });
    });
    return out;
  }

  /*@3.REMJ.37*/
  function reviewReminders(now, horizon) {
    var s = load();
    if (!s.channels.review) return [];
    var hm = parseHM(s.reviewTime);
    var out = [];
    for (var i = 0; i <= HORIZON_DAYS; i++) {
      var d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(hm.h, hm.m, 0, 0);
      var ms = d.getTime();
      if (ms < now - GRACE_MS || ms > horizon) continue;
      out.push({
        id: 'rev:' + stamp(ms),
        kind: 'review',
        title: tx('وقت المراجعة 🌱', 'Review time 🌱'),
        body: tx('افتح بطاقاتك المستحقة اليوم', 'Open your cards due today'),
        fireAt: applyQuiet(ms),
        eventAt: ms,
        url: 'hub/index.html',
        checkDue: true    /*@3.REMJ.38*/
      });
    }
    return out;
  }

  /*@3.REMJ.39*/
  function clampFire(item) {
    var now = Date.now();
    if (item.fireAt >= now - GRACE_MS) return item;   /*@3.REMJ.40*/
    if (item.eventAt > now) {                          /*@3.REMJ.41*/
      item.fireAt = now;
      item.late = true;
      return item;
    }
    return null;                                       /*@3.REMJ.42*/
  }

  function buildQueue() {
    var s = load();
    var now = Date.now();
    var horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;
    var out = [];

    if (s.channels.lectures) out = out.concat(lectureOccurrences(now, horizon));
    out = out.concat(deadlineReminders(now, horizon));
    out = out.concat(reviewReminders(now, horizon));

    out = out.map(clampFire).filter(Boolean);

    /*@3.REMJ.43*/

    out.sort(function (a, b) { return a.fireAt - b.fireAt; });
    return out.slice(0, MAX_QUEUE);
  }

  /*@3.REMJ.44*/

  /*@3.REMJ.45*/
  var SW_WAIT_MS = 5000;

  function swReady() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no-sw'));
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('sw-timeout')); }, SW_WAIT_MS);
      })
    ]);
  }

  function dueCardsCount() {
    try {
      if (window.GardenData && GardenData.dueForSemester) return GardenData.dueForSemester() || 0;
    } catch (e) {}
    return 0;
  }

  function notifOptions(item) {
    var s = load();
    var cap = capability();
    var actions = [];
    var snz = (s.snooze || [10, 60]).slice(0, Math.max(0, (cap.maxActions || 2) - 1));
    snz.forEach(function (min) {
      actions.push({
        action: 'snooze:' + min,
        title: min >= 60
          ? tx('غفوة ساعة', 'Snooze 1h')
          : tx('غفوة ' + min + ' د', 'Snooze ' + min + 'm')
      });
    });
    if (actions.length < (cap.maxActions || 2)) {
      actions.push({ action: 'done', title: tx('تم', 'Done') });
    }

    return {
      body: item.body || '',
      tag: item.id,                 /*@3.REMJ.46*/
      renotify: true,
      icon: rootPath() + 'shared/icons/icon-192.png',
      badge: rootPath() + 'shared/icons/favicon-32.png',
      dir: lang() === 'ar' ? 'rtl' : 'ltr',
      lang: lang(),
      timestamp: item.eventAt || item.fireAt,
      requireInteraction: item.kind === 'exams',
      data: {
        id: item.id, kind: item.kind, url: item.url || 'index.html',
        eventAt: item.eventAt, fireAt: item.fireAt, root: rootPath()
      },
      actions: actions
    };
  }

  /*@3.REMJ.47*/
  var ROOT = (function () {
    var sc = document.currentScript;
    if (sc && sc.src) {
      var r = sc.src.replace(/shared\/reminders\.js(\?.*)?$/, '');
      if (r !== sc.src) return r;
    }
    return location.origin + '/';
  })();
  function rootPath() { return ROOT; }

  function fireNow(item) {
    if (item.checkDue && dueCardsCount() === 0) {
      return ReminderDB.markFired(item.id, 'skipped-empty');
    }
    return swReady().then(function (reg) {
      return reg.showNotification(item.title, notifOptions(item));
    }).then(function () {
      /*@3.REMJ.48*/
      return ReminderDB.markFired(item.id, 'fired', { title: item.title, body: item.body });
    }).catch(function () {});
  }

  /*@3.REMJ.49*/
  function armTriggers(items) {
    var cap = capability();
    if (!cap.background || cap.permission !== 'granted') return Promise.resolve(0);

    return swReady().then(function (reg) {
      /*@3.REMJ.50*/
      return reg.getNotifications({ includeTriggered: true }).then(function (existing) {
        existing.forEach(function (n) {
          var d = n.data;
          if (d && d.id && typeof d.fireAt === 'number' && d.fireAt > Date.now()) n.close();
        });
        var arm = items.filter(function (i) { return i.fireAt > Date.now(); })
                       .slice(0, MAX_TRIGGERS);
        return Promise.all(arm.map(function (item) {
          var opt = notifOptions(item);
          try { opt.showTrigger = new TimestampTrigger(item.fireAt); }
          catch (e) { return Promise.resolve(); }
          return reg.showNotification(item.title, opt).catch(function () {});
        })).then(function () { return arm.length; });
      });
    }).catch(function () { return 0; });
  }

  /*@3.REMJ.51*/
  var tickTimer = null;
  var lastSig = null;

  /*@3.REMJ.52*/
  function signature(items) {
    return items.map(function (i) {
      return i.id + '@' + (i.late ? 'late' : i.fireAt);
    }).join('|');
  }

  /*@3.REMJ.53*/
  function refreshQueue() {
    if (!window.GardenData || !GardenData.allDeadlines) return Promise.resolve(false);
    var items = buildQueue();
    var sig = signature(items);
    if (sig === lastSig) return Promise.resolve(false);
    /*@3.REMJ.54*/
    return ReminderDB.replaceQueue(items).then(function () {
      lastSig = sig;
      /*@3.REMJ.55*/
      if (self.GardenPush && load().enabled) {
        try { GardenPush.syncWakes(items); } catch (e) {}
      }
      return true;
    }).catch(function (e) {
      lastSig = null;                 /*@3.REMJ.56*/
      throw e;
    });
  }

  /*@3.REMJ.57*/
  var MAX_PER_TICK = 3;

  function fireDue() {
    var now = Date.now();
    return Promise.all([ReminderDB.getQueue(), ReminderDB.firedMap()]).then(function (r) {
      var q = r[0] || [], fired = r[1] || {};
      /*@3.REMJ.58*/
      var due = q.filter(function (i) {
        return i.fireAt <= now && i.fireAt > now - 60 * 60 * 1000 && !fired[i.id];
      }).sort(function (a, b) {
        return (a.eventAt || a.fireAt) - (b.eventAt || b.fireAt);   /*@3.REMJ.59*/
      }).slice(0, MAX_PER_TICK);

      return Promise.all(due.map(fireNow));
    }).catch(function () {});
  }

  function tick() {
    var s = load();
    if (!s.enabled || capability().permission !== 'granted') return Promise.resolve();
    return refreshQueue().then(function (changed) {
      if (!changed) return null;
      return ReminderDB.getQueue().then(armTriggers);
    }).then(fireDue).catch(function () {});
  }

  function startTicking() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, TICK_MS);
  }

  /*@3.REMJ.60*/
  function catchUp() {
    var s = load();
    if (!s.enabled) return Promise.resolve([]);
    var now = Date.now();
    return Promise.all([ReminderDB.getQueue(), ReminderDB.firedMap()]).then(function (r) {
      var q = r[0], fired = r[1];
      var missed = q.filter(function (i) {
        return i.fireAt < now - GRACE_MS && !fired[i.id]
          && i.eventAt > now - 24 * 60 * 60 * 1000;   /*@3.REMJ.61*/
      });
      if (missed.length) showMissedToast(missed);
      return missed;
    }).catch(function () { return []; });
  }

  /*@3.REMJ.62*/

  var syncing = null;

  function sync() {
    var s = load();
    if (!self.ReminderDB) return Promise.resolve();

    if (!s.enabled || capability().permission !== 'granted') {
      /*@3.REMJ.63*/
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      lastSig = null;                 /*@3.REMJ.64*/
      if (!s.enabled && self.GardenPush) { try { GardenPush.unsubscribe(); } catch (e) {} }
      /*@3.REMJ.65*/
      return ReminderDB.clearAll()
        .then(clearArmed)
        .then(function () { emit('reminders:synced'); });
    }

    if (syncing) return syncing;

    /*@3.REMJ.66*/
    if (!window.GardenData || !GardenData.allDeadlines) {
      return ReminderDB.getQueue()
        .then(function (q) { return armTriggers(q); })
        .then(function () { startTicking(); return fireDue(); })
        .catch(function () {});
    }

    lastSig = null;                    /*@3.REMJ.67*/
    if (self.GardenPush) { try { GardenPush.subscribe(); } catch (e) {} }
    syncing = refreshQueue()
      .then(function () { return ReminderDB.getQueue(); })
      .then(function (q) { return armTriggers(q); })
      .then(function () { startTicking(); return fireDue(); })
      .then(function () { emit('reminders:synced'); })
      .catch(function () {})
      .then(function () { syncing = null; });
    return syncing;
  }

  function clearArmed() {
    return swReady().then(function (reg) {
      /*@3.REMJ.68*/
      return reg.getNotifications({ includeTriggered: true }).then(function (list) {
        list.forEach(function (n) {
          var d = n.data;
          if (d && typeof d.fireAt === 'number' && d.fireAt > Date.now()) n.close();
        });
      });
    }).catch(function () {});
  }

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail || null })); } catch (e) {}
  }

  /*@3.REMJ.69*/

  function snooze(id, minutes) {
    return ReminderDB.getItem(id).then(function (item) {
      if (!item) return null;
      item.fireAt = Date.now() + minutes * 60000;
      item.snoozedTo = item.fireAt;
      item.snoozeCount = (item.snoozeCount || 0) + 1;
      return ReminderDB.putItem(item).then(function () {
        return armTriggers([item]).then(function () { return item; });
      });
    }).catch(function () { return null; });
  }

  /*@3.REMJ.70*/

  function test() {
    return requestPermission().then(function (p) {
      if (p !== 'granted') return p;
      return swReady().then(function (reg) {
        return reg.showNotification(tx('تجربة تنبيه 🌱', 'Test notification 🌱'), notifOptions({
          id: 'test:' + Date.now(),
          kind: 'test',
          body: tx('هكذا سيصلك التنبيه — جرّب زر الغفوة.', 'This is how reminders look — try the snooze button.'),
          fireAt: Date.now(), eventAt: Date.now(), url: 'index.html'
        })).then(function () { return 'granted'; });
      });
    });
  }

  /*@3.REMJ.71*/

  /*@3.REMJ.72*/
  function missedPhraseAr(n) {
    if (n === 1) return 'فاتك تنبيه واحد';
    if (n === 2) return 'فاتك تنبيهان';
    if (n <= 10) return 'فاتتك ' + n + ' تنبيهات';
    return 'فاتك ' + n + ' تنبيهاً';
  }

  function showMissedToast(missed) {
    if (document.getElementById('rem-missed')) return;
    var n = missed.length;
    var el = document.createElement('div');
    el.id = 'rem-missed';
    el.className = 'rem-toast';
    el.setAttribute('role', 'status');

    var txt = document.createElement('span');
    txt.className = 'rem-toast-text';
    /*@3.REMJ.73*/
    txt.textContent = tx(missedPhraseAr(n), 'You missed ' + n + ' reminder' + (n === 1 ? '' : 's'));

    var go = document.createElement('button');
    go.className = 'rem-toast-btn';
    go.textContent = tx('عرض', 'View');
    go.addEventListener('click', function () {
      location.href = ROOT + 'index.html#tasks';
    });

    var close = document.createElement('button');
    close.className = 'rem-toast-close';
    close.setAttribute('aria-label', tx('إغلاق', 'Dismiss'));
    close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    close.addEventListener('click', function () {
      missed.forEach(function (m) { ReminderDB.markFired(m.id, 'missed-ack'); });
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 260);
    });

    el.appendChild(txt); el.appendChild(go); el.appendChild(close);
    document.body.appendChild(el);
    void el.offsetWidth;          /*@3.REMJ.74*/
    el.classList.add('show');
  }

  /*@3.REMJ.75*/

  /*@3.REMJ.76*/
  function previewList(limit) {
    var now = Date.now();
    try {
      return buildQueue()
        .filter(function (i) { return i.fireAt >= now; })
        .slice(0, limit || MAX_PREVIEW);
    } catch (e) { return []; }
  }

  function upcoming(limit) {
    var s = load();
    var live = (s.enabled && capability().permission === 'granted');
    if (!live) return Promise.resolve(previewList(limit));

    return ReminderDB.getQueue().then(function (q) {
      var now = Date.now();
      var out = q.filter(function (i) { return i.fireAt >= now; })
                 .sort(function (a, b) { return a.fireAt - b.fireAt; });
      /*@3.REMJ.77*/
      if (!out.length) return previewList(limit);
      return out.slice(0, limit || MAX_PREVIEW);
    }).catch(function () { return previewList(limit); });
  }

  /*@3.REMJ.78*/
  function refresh() {
    var s = load();
    if (s.enabled && capability().permission === 'granted') return sync();
    lastSig = null;                   /*@3.REMJ.79*/
    return Promise.resolve().then(function () { emit('reminders:synced'); });
  }

  /*@3.REMJ.80*/
  function diagnose() {
    var s = load();
    var cap = capability();
    var built = 0, err = null;
    try { built = buildQueue().length; } catch (e) { err = String(e); }
    var reason = 'ok';
    if (!cap.supported) reason = 'unsupported';
    else if (cap.needsInstall) reason = 'needs-install';
    else if (cap.permission === 'denied') reason = 'denied';
    else if (cap.permission !== 'granted') reason = 'not-granted';
    else if (!s.enabled) reason = 'disabled';
    else if (!built) reason = 'no-events';
    return {
      reason: reason,
      enabled: !!s.enabled,
      permission: cap.permission,
      background: !!cap.background,
      built: built,
      buildError: err,
      hasData: !!(window.GardenData && GardenData.allDeadlines)
    };
  }

  /*@3.REMJ.81*/

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'reminder-snoozed') {
        emit('reminders:snoozed', d);
        sync();
      } else if (d.type === 'reminder-open') {
        emit('reminders:open', d);
      } else if (d.type === 'reminder-done') {
        sync();
      }
    });
  }

  /*@3.REMJ.82*/

  function init() {
    load();
    if (!self.ReminderDB) return;
    ReminderDB.setMeta('lang', lang());
    ReminderDB.setMeta('snooze', settings.snooze);
    ReminderDB.setMeta('root', rootPath());

    if (!settings.enabled) return;

    /*@3.REMJ.83*/
    sync().then(catchUp);
  }

  /*@3.REMJ.84*/
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && load().enabled) sync().then(catchUp);
  });
  /*@3.REMJ.85*/
  ['garden:semesterActivated', 'garden:onboardingDone', 'garden:gradesChanged'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (load().enabled) sync(); });
  });
  window.addEventListener('garden:syncCompleted', function () { if (load().enabled) sync(); });

  /*@3.REMJ.86*/
  window.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (['weekly_schedule', 'my_tasks', 'quick_notes', 'my_semester'].indexOf(e.key) === -1) return;
    if (load().enabled) sync();
  });
  document.addEventListener('garden:languageChanged', function () {
    if (load().enabled) sync();
    if (self.ReminderDB) ReminderDB.setMeta('lang', lang());
  });

  window.Reminders = {
    settings: load,
    save: save,
    capability: capability,
    requestPermission: requestPermission,
    sync: sync,
    refresh: refresh,     /*@3.REMJ.87*/
    diagnose: diagnose,
    tick: tick,
    catchUp: catchUp,
    upcoming: upcoming,
    snooze: snooze,
    test: test,
    buildQueue: buildQueue,
    fmtWhen: fmtWhen
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
