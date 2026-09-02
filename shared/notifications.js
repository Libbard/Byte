/*@3.NOTJ.1*/
(function () {
  'use strict';

  var HOSTS = [];          /*@3.NOTJ.2*/
  var TAB = 'log';         /*@3.NOTJ.3*/
  var CACHE = { log: null, at: 0, push: null, pushAt: 0 };
  var BUSY = false;
  var PBUSY = false;
  var LAST_PERM = null;

  /*@3.NOTJ.4*/

  function isAr() {
    return (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') !== 0;
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function api() {
    var e = window.GardenEndpoints;
    return e && e.sync ? String(e.sync).replace(/\/+$/, '') : '';
  }
  /*@3.NOTJ.50*/
  var VAULT_RE = /^v[0-9a-f]{32}$/;

  function vaultId() {
    try {
      if (window.GardenSync && GardenSync.vaultDocId) {
        return Promise.resolve(GardenSync.vaultDocId()).then(function (v) {
          return VAULT_RE.test(String(v || '')) ? String(v) : '';
        }, function () { return ''; });
      }
      var k = (window.GardenSync && GardenSync.getKey && GardenSync.getKey()) || '';
      return Promise.resolve(VAULT_RE.test(k) ? k : '');
    } catch (e) { return Promise.resolve(''); }
  }

  /*@3.NOTJ.5*/
  var LOC = 'ar-SA-u-ca-gregory-nu-latn';
  function when(ms) {
    var t = typeof ms === 'number' ? ms : Date.parse(ms);
    if (!t || isNaN(t)) return '';
    var d = new Date(t), now = Date.now();
    var diff = Math.round((now - t) / 60000);          /*@3.NOTJ.6*/
    if (diff < 1) return L('الآن', 'now');
    if (diff < 60) return L('قبل ' + diff + ' د', diff + 'm ago');
    if (diff < 1440) return L('قبل ' + Math.round(diff / 60) + ' س', Math.round(diff / 60) + 'h ago');
    var opt = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opt.year = 'numeric';
    return d.toLocaleDateString(isAr() ? LOC : 'en-GB', opt) +
           ' · ' + d.toLocaleTimeString(isAr() ? LOC : 'en-GB',
                                        { hour: 'numeric', minute: '2-digit' });
  }
  function ahead(ms) {
    var t = typeof ms === 'number' ? ms : Date.parse(ms);
    if (!t || isNaN(t)) return '';
    var m = Math.round((t - Date.now()) / 60000);
    if (m <= 0) return L('حان', 'due');
    if (m < 60) return L('بعد ' + m + ' د', 'in ' + m + 'm');
    if (m < 1440) return L('بعد ' + Math.round(m / 60) + ' س', 'in ' + Math.round(m / 60) + 'h');
    return L('بعد ' + Math.round(m / 1440) + ' يوم', 'in ' + Math.round(m / 1440) + 'd');
  }

  function srcTag(src) {
    var ar = src === 'server' ? 'من الخادم' : 'من جهازك';
    var en = src === 'server' ? 'server' : 'this device';
    var ic = src === 'server' ? 'fa-cloud' : 'fa-mobile-screen';
    return '<span class="nt-chip" data-src="' + src + '">' +
           '<i class="fa-solid ' + ic + '" aria-hidden="true"></i>' + esc(L(ar, en)) + '</span>';
  }
  function timeChip(at) {
    var w = when(at);
    return w ? '<span class="nt-chip is-time">' + esc(w) + '</span>' : '';
  }

  /*@3.NOTJ.7*/

  /*@3.NOTJ.8*/
  function fromWatch() {
    var W = window.GardenWatch;
    if (!W || !W.ready || !W.ready()) return Promise.resolve([]);
    var go = W.load ? W.load() : Promise.resolve();
    return Promise.resolve(go).then(function () {
      var S = W.state ? W.state() : {};
      return (S.alerts || []).map(function (a) {
        return {
          id: 'w:' + (a.id || a.ev_key || a.at),
          title: a.title || L('تنبيهُ شعبة', 'Section alert'),
          body: a.body || '',
          at: a.at, src: 'server', unread: !a.seen,
          icon: a.kind === 'term' ? 'fa-calendar-plus'
              : a.kind === 'seat' ? 'fa-chair' : 'fa-layer-group',
          tone: a.kind === 'term' ? 'ok' : ''
        };
      });
    }).catch(function () { return []; });
  }

  /*@3.NOTJ.9*/
  function fromIcs() {
    var base = api();
    if (!base) return Promise.resolve([]);
    return vaultId().then(function (vid) {
      if (!vid) return [];
      var SY = window.GardenSync;
      return fetch(base + '/v1/ics/sent?vault_id=' + encodeURIComponent(vid) + '&limit=60',
                   { headers: (SY && SY.vaultHeaders) ? SY.vaultHeaders(vid) : {} })
      .then(function (r) { return r.ok ? r.json() : { sent: [] }; })
      .then(function (j) {
        return (j.sent || []).map(function (x) {
          return {
            id: 'i:' + x.id,
            title: x.title || L('تنبيهُ تقويم', 'Calendar reminder'),
            body: x.body || (x.title ? '' : L('أُرسل قبل تسجيل العنوان', 'sent before titles were logged')),
            at: x.at, src: 'server', unread: false,
            icon: 'fa-calendar-day', tone: ''
          };
        });
      })
      .catch(function () { return []; });
    });
  }

  /*@3.NOTJ.10*/
  function fromDevice() {
    var DB = window.ReminderDB;
    if (!DB || !DB.firedList) return Promise.resolve([]);
    return DB.firedList().then(function (list) {
      return (list || []).filter(function (r) { return r && r.how === 'fired'; })
        .map(function (r) {
          return {
            id: 'd:' + r.id,
            title: r.title || L('تذكيرٌ من جهازك', 'Device reminder'),
            body: r.body || (r.title ? '' : L('أُطلق قبل تسجيل العنوان', 'fired before titles were logged')),
            at: r.at, src: 'device', unread: false,
            icon: 'fa-mobile-screen', tone: ''
          };
        });
    }).catch(function () { return []; });
  }

  function loadLog() {
    return Promise.all([fromWatch(), fromIcs(), fromDevice()]).then(function (parts) {
      var all = parts[0].concat(parts[1], parts[2]);
      all.sort(function (a, b) {
        return (Date.parse(b.at) || b.at || 0) - (Date.parse(a.at) || a.at || 0);
      });
      return all.slice(0, 120);
    });
  }

  /*@3.NOTJ.11*/

  var SEEN_KEY = 'garden_notify_break_seen';

  function capability() {
    try { return window.Reminders ? Reminders.capability() : null; } catch (e) { return null; }
  }

  function breakage() {
    var R = window.Reminders;
    if (!R) return null;
    var s, cap;
    try { s = R.settings(); cap = R.capability(); } catch (e) { return null; }
    if (!s || !cap) return null;
    /*@3.NOTJ.12*/
    if (!s.enabled) return null;

    if (cap.needsInstall) {
      return { code: 'needs-install',
               ar: 'آيفون يمنح إذنَ الإشعارات للتطبيق المثبَّت وحدَه — ثبّتْه على شاشتك الرئيسية ثمّ فعّلْها من داخله.',
               en: 'iOS grants notification permission only to the installed app — add it to your Home Screen, then turn reminders on there.',
               fix: null };
    }
    if (cap.permission === 'denied') {
      return { code: 'denied',
               ar: 'أوقف المتصفّحُ إشعاراتِ الموقع — رُفض الإذن.',
               en: 'The browser blocked notifications for this site.',
               fix: 'perm' };
    }
    if (cap.permission === 'default') {
      return { code: 'unasked',
               ar: 'التنبيهاتُ مفعَّلةٌ عندك لكنّ إذنَ المتصفّح لم يُمنح بعد.',
               en: 'Reminders are on, but the browser permission was never granted.',
               fix: 'perm' };
    }
    if (!cap.supported) {
      return { code: 'unsupported',
               ar: 'هذا المتصفّحُ لا يدعم الإشعارات.',
               en: 'This browser does not support notifications.',
               fix: null };
    }
    return null;
  }

  function breakSeen(code) {
    try { return localStorage.getItem(SEEN_KEY) === code; } catch (e) { return false; }
  }
  function muteBreak(code) {
    try { localStorage.setItem(SEEN_KEY, code); } catch (e) {}
  }

  /*@3.NOTJ.13*/

  function permState(code) {
    if (code === 'needs-install') {
      return { tone: 'warn', ico: 'fa-arrow-up-from-bracket',
        t: L('آيفون يطلب تثبيتَ التطبيق أوّلاً', 'iPhone needs the app installed first'),
        sub: L('من زرِّ المشاركة اختَرْ «إضافة إلى الشاشة الرئيسية»، ثمّ افتحِ التطبيقَ المثبَّت وفعِّلِ التنبيهاتِ من داخله — إذنُ الإشعارات في آيفون منفصلٌ لكلِّ تطبيق.',
               'Use Share then Add to Home Screen, open the installed app, and turn reminders on there. iOS grants notification permission per installed app.') };
    }
    if (code === 'denied') {
      return { tone: 'danger', ico: 'fa-bell-slash',
        t: L('أوقف المتصفّحُ إشعاراتِ الموقع', 'The browser blocked notifications'),
        sub: L('لا يُعاد الإذنُ من داخل الصفحة — افتحِ الإعداداتِ ثمّ الإشعارات ثمّ الحديقة الرقمية، واسمحْ بها.',
               'A page cannot restore that. Open Settings, then Notifications, then Digital Garden, and allow them.') };
    }
    if (code === 'unsupported') {
      return { tone: 'danger', ico: 'fa-ban',
        t: L('هذا المتصفّحُ لا يدعم الإشعارات', 'This browser does not support notifications'),
        sub: L('جرّبْ متصفّحاً آخرَ، أو ثبّتِ التطبيقَ على شاشتك الرئيسية.',
               'Try another browser, or install the app to your home screen.') };
    }
    /*@3.NOTJ.55*/
    return { tone: 'warn', ico: 'fa-bell-slash',
      t: L('لم يُمنح الإذنُ بعد', 'Permission was not granted'),
      sub: L('لم تُحفظ التنبيهاتُ مفعَّلة — فلا يصلك شيء. اضغطْ لتُسأل مرّةً أخرى.',
             'Reminders were not switched on, so nothing will arrive. Tap to be asked again.'),
      act: 'enable', label: L('اسمحْ بالإشعارات', 'Allow notifications') };
  }

  /*@3.NOTJ.14*/
  function ctaHtml() {
    var R = window.Reminders, s = null, cap = capability();
    try { s = R ? R.settings() : null; } catch (e) {}
    var b = breakage();
    var tone, ico, t, sub, act = '';

    if (LAST_PERM && LAST_PERM !== 'granted') {
      var ps = permState(LAST_PERM);
      tone = ps.tone; ico = ps.ico; t = ps.t; sub = ps.sub;
      act = ps.act
        ? '<button type="button" class="nt-btn is-primary" data-act="' + ps.act + '">' +
          '<i class="fa-solid fa-bell" aria-hidden="true"></i>' + esc(ps.label) + '</button>'
        : '';
    } else if (b) {
      tone = 'danger'; ico = 'fa-bell-slash';
      t = L('تنبيهاتُك متوقّفة', 'Your reminders are off');
      sub = L(b.ar, b.en);
      if (b.fix === 'perm') {
        act = '<button type="button" class="nt-btn is-primary" data-act="enable">' +
              '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
              esc(L('أعِد التفعيل', 'Re-enable')) + '</button>';
      }
    } else if (!s || !s.enabled) {
      tone = ''; ico = 'fa-bell-slash';
      t = L('التنبيهاتُ مطفأة', 'Reminders are off');
      sub = L('شغّلها ليصلك تذكيرٌ قبل محاضراتك واختباراتك ومهامّك.',
              'Turn them on to get reminded before lectures, exams and tasks.');
      act = '<button type="button" class="nt-btn is-primary" data-act="enable">' +
            '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
            esc(L('شغّل التنبيهات', 'Turn on')) + '</button>';
    } else {
      var bg = cap && cap.background;
      tone = bg ? 'ok' : 'warn'; ico = 'fa-bell';
      t = L('التنبيهاتُ تعمل', 'Reminders are on');
      sub = bg
        ? L('تصلك ولو كان الموقعُ مغلقاً.', 'They reach you even when the site is closed.')
        /*@3.NOTJ.15*/
        : L('تصلك حين يكون الموقعُ مفتوحاً فقط — الدفعُ غيرُ مفعَّلٍ على هذا الجهاز.',
            'They only arrive while the site is open — push is not active on this device.');
      act = '<button type="button" class="nt-btn" data-act="test">' +
            '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i>' +
            esc(L('جرّب تنبيهاً', 'Send a test')) + '</button>';
    }

    return '<div class="nt-cta"' + (tone ? ' data-tone="' + tone + '"' : '') + '>' +
      '<span class="nt-cta-ic"><i class="fa-solid ' + ico + '" aria-hidden="true"></i></span>' +
      '<div class="nt-cta-t"><b>' + esc(t) + '</b><span>' + esc(sub) + '</span></div>' +
      (act ? '<div class="nt-cta-a">' + act + '</div>' : '') +
    '</div>';
  }

  /*@3.NOTJ.16*/
  function statsHtml() {
    var W = window.GardenWatch, R = window.Reminders;
    var S = (W && W.state) ? W.state() : {};
    var ws = S.watches || [];
    var on = ws.length, armed = 0;
    ws.forEach(function (w) { if (w.armed) armed++; });
    var s = null;
    try { s = R ? R.settings() : null; } catch (e) {}
    if (s && s.enabled && s.channels) {
      Object.keys(s.channels).forEach(function (k) { if (s.channels[k]) on++; });
    }
    var got = CACHE.log ? CACHE.log.length : 0;
    var last = (CACHE.log && CACHE.log.length) ? CACHE.log[0].at : 0;

    /*@3.NOTJ.17*/
    var h = '<span>' + esc(L('مفعَّل', 'active')) + ' <b' + (on ? ' data-t="ok"' : '') + '>' + on + '</b></span>' +
            '<span>' + esc(L('في الانتظار', 'pending')) + ' <b' + (armed ? ' data-t="warn"' : '') + '>' + armed + '</b></span>' +
            '<span>' + esc(L('وصلك', 'received')) + ' <b>' + got + '</b></span>';
    if (last) {
      h += '<span class="nt-last"><i class="fa-solid fa-clock" aria-hidden="true"></i> ' +
           esc(L('آخرُ تنبيه ', 'last ') + when(last)) + '</span>';
    }
    return '<div class="nt-stats">' + h + '</div>';
  }

  function rowHtml(r) {
    return '<article class="nt-row' + (r.unread ? ' is-unread' : '') + '"' +
        (r.tone ? ' data-tone="' + r.tone + '"' : '') + '>' +
      '<span class="nt-ic"><i class="fa-solid ' + esc(r.icon || 'fa-bell') + '" aria-hidden="true"></i></span>' +
      '<div class="nt-txt">' +
        '<p class="nt-t">' + esc(r.title) + '</p>' +
        (r.body ? '<p class="nt-b">' + esc(r.body) + '</p>' : '') +
        '<div class="nt-m">' + srcTag(r.src) + timeChip(r.at) +
          (r.extra || '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function emptyHtml(ico, msg) {
    return '<div class="nt-empty"><i class="fa-solid ' + ico + '" aria-hidden="true"></i>' +
           '<p>' + esc(msg) + '</p></div>';
  }

  function logHtml() {
    if (!CACHE.log) return '<div class="nt-skel"></div><div class="nt-skel"></div><div class="nt-skel"></div>';
    if (!CACHE.log.length) {
      return emptyHtml('fa-inbox', L(
        'لم يصلك تنبيهٌ بعد. ولا يُعرض هنا إلا ما يشهد بإرساله الخادمُ أو جهازُك — فالفراغُ يعني «لم يُرسَل» لا «لم يُسجَّل».',
        'Nothing yet. Only alerts the server or this device confirm sending appear here.'));
    }
    var unread = 0;
    CACHE.log.forEach(function (r) { if (r.unread) unread++; });
    var head = unread
      ? '<div class="nt-bar"><span>' + esc(L(unread + ' لم تُقرأ', unread + ' unread')) + '</span>' +
        '<button type="button" class="nt-btn" data-act="seen">' +
        '<i class="fa-solid fa-check-double" aria-hidden="true"></i>' +
        esc(L('علّمها كلَّها مقروءة', 'Mark all read')) + '</button></div>'
      : '';
    /*@3.NOTJ.18*/
    return head + CACHE.log.map(rowHtml).join('') +
      '<p class="nt-note">' + esc(L(
        'كلُّ سطرٍ هو نصُّ التنبيه كما وصلك — بلغته يومَ أُرسل، لا بلغة الشاشة الآن. ' +
        'وسجلُّ الخادم يُحفظ ٦٠ يوماً ثم يُمسح، وسجلُّ الجهاز يعيش على هذا الجهاز وحدَه.',
        'Each line is the alert exactly as it reached you — in the language it was sent, not the language on screen now. ' +
        'Server history is kept for 60 days; device history lives only on this device.')) + '</p>';
  }

  /*@3.NOTJ.19*/
  function registeredHtml() {
    var out = [], W = window.GardenWatch, R = window.Reminders;
    var S = (W && W.state) ? W.state() : {};
    var ws = S.watches || [];

    var KIND = {
      term:    ['متابعةُ الفصول الجديدة', 'New-term watch', 'fa-calendar-plus'],
      seat:    ['انتظارُ مقعد', 'Seat watch', 'fa-chair'],
      course:  ['انتظارُ نزول شعبة', 'Section-opening watch', 'fa-layer-group'],
      changes: ['تغيّراتُ شعبتك', 'Section changes', 'fa-arrows-rotate']
    };
    ws.forEach(function (w) {
      var k = KIND[w.kind] || [w.kind, w.kind, 'fa-bell'];
      var target = w.kind === 'term' ? L('أيُّ فصلٍ ينزل', 'any new term') : w.target;
      /*@3.NOTJ.20*/
      out.push(rowHtml({
        id: 'r:' + w.kind + w.target, title: L(k[0], k[1]),
        body: String(target), at: w.created_at, src: 'server',
        icon: k[2], tone: w.armed ? 'ok' : 'mute',
        extra: '<button type="button" class="nt-drop" data-drop="' +
          esc(w.kind + '|' + w.term + '|' + w.target) + '" title="' +
          esc(L('أوقف المتابعة', 'Stop watching')) + '" aria-label="' +
          esc(L('أوقف المتابعة', 'Stop watching')) + '">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
          esc(L('أوقفها', 'Stop')) + '</button>'
      }));
    });

    var s = null;
    try { s = R ? R.settings() : null; } catch (e) {}
    if (s && s.enabled) {
      var CH = {
        lectures: ['قبل المحاضرة', 'Before lectures', 'fa-chalkboard'],
        exams:    ['قبل الاختبار', 'Before exams', 'fa-file-pen'],
        tasks:    ['المهامُّ والمواعيد', 'Tasks and due dates', 'fa-list-check'],
        review:   ['نداءُ المراجعة اليوميّ', 'Daily review call', 'fa-repeat']
      };
      Object.keys(CH).forEach(function (k) {
        if (!s.channels || !s.channels[k]) return;
        var lead = s.lead && s.lead[k];
        out.push(rowHtml({
          id: 'c:' + k, title: L(CH[k][0], CH[k][1]),
          body: lead ? L('قبلها بـ' + leadWord(lead), leadWord(lead) + ' before') : '',
          at: 0, src: 'device', icon: CH[k][2], tone: 'ok'
        }));
      });
    }

    if (!out.length) {
      return emptyHtml('fa-bell-slash', L(
        'لا تنبيهَ مفعَّلٌ الآن. شغّل ما تريده من لسان «الخيارات».',
        'Nothing is switched on. Enable what you want from the Options tab.'));
    }
    return out.join('');
  }

  function leadWord(min) {
    if (min >= 1440) { var d = Math.round(min / 1440); return L(d === 1 ? 'يوم' : d + ' أيام', d + 'd'); }
    if (min >= 60) { var h = Math.round(min / 60); return L(h === 1 ? 'ساعة' : h + ' ساعات', h + 'h'); }
    return L(min + ' دقيقة', min + 'm');
  }

  /*@3.NOTJ.21*/
  function pendingHtml(list) {
    var out = [], W = window.GardenWatch;
    var S = (W && W.state) ? W.state() : {};
    (S.watches || []).forEach(function (w) {
      if (!w.armed) return;
      var t = w.kind === 'term'
            ? [L('ينتظر نزولَ فصلٍ جديد', 'Waiting for a new term'), L('أيُّ فصلٍ ينزل', 'any new term'), 'fa-calendar-plus']
        : w.kind === 'seat'
            ? [L('ينتظر تحرُّرَ مقعد', 'Waiting for a seat'), String(w.target), 'fa-chair']
        : w.kind === 'course'
            ? [L('ينتظر نزولَ شعبة', 'Waiting for a section'), String(w.target), 'fa-layer-group']
            : [L('يراقب تغيّراتِ شعبتك', 'Watching your section'), String(w.target), 'fa-arrows-rotate'];
      out.push(rowHtml({ id: 'p:' + w.kind + w.target, title: t[0], body: t[1],
                         at: 0, src: 'server', icon: t[2], tone: 'warn' }));
    });

    (list || []).forEach(function (i) {
      out.push('<article class="nt-row" data-tone="mute">' +
        '<span class="nt-ic"><i class="fa-solid fa-clock" aria-hidden="true"></i></span>' +
        '<div class="nt-txt"><p class="nt-t">' + esc(i.title || L('تذكير', 'Reminder')) + '</p>' +
        (i.body ? '<p class="nt-b">' + esc(i.body) + '</p>' : '') +
        '<div class="nt-m">' + srcTag('device') +
        '<span class="nt-chip is-time">' + esc(ahead(i.fireAt)) + '</span></div></div></article>');
    });

    if (!out.length) {
      return emptyHtml('fa-hourglass-half', L(
        'لا شيءَ في الانتظار. متابعاتُ الشعب والفصول تظهر هنا ما دامت مسلَّحة، ومعها تذكيراتُ جهازك المجدولة.',
        'Nothing is pending. Armed section and term watches appear here with your scheduled device reminders.'));
    }
    return out.join('');
  }

  /*@3.NOTJ.22*/
  function optRow(key, title, sub, on, disabled, extra) {
    return '<div class="nt-opt' + (on ? '' : ' is-off') + '">' +
      '<div class="nt-opt-t"><div class="nt-opt-n">' + esc(title) + '</div>' +
      (sub ? '<div class="nt-opt-h">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="nt-opt-c">' + (extra || '') +
        '<button type="button" class="nt-sw" role="switch" data-opt="' + esc(key) + '"' +
        ' aria-checked="' + (on ? 'true' : 'false') + '"' + (disabled ? ' disabled' : '') +
        ' aria-label="' + esc(title) + '"></button>' +
      '</div></div>';
  }

  /*@3.NOTJ.23*/
  var LEADS = [0, 15, 30, 60, 180, 720, 1440, 10080];
  function leadOpts(cur) {
    var seen = false;
    var h = LEADS.map(function (m) {
      if (m === cur) seen = true;
      return '<option value="' + m + '"' + (m === cur ? ' selected' : '') + '>' +
             esc(m === 0 ? L('في وقتها', 'on time') : leadWord(m)) + '</option>';
    }).join('');
    /*@3.NOTJ.24*/
    if (!seen && cur > 0) h += '<option value="' + cur + '" selected>' + esc(leadWord(cur)) + '</option>';
    return h;
  }
  function leadSel(k, v) {
    return '<select class="nt-sel" data-lead="' + k + '" aria-label="' +
           esc(L('المهلة', 'Lead time')) + '">' + leadOpts(v | 0) + '</select>';
  }
  function timeIn(k, v) {
    return '<input class="nt-time" type="time" value="' + esc(v || '') + '" data-time="' + k + '">';
  }

  function chainRow(state, title, sub, val) {
    var tone = state === 'ok' ? 'ok' : state === 'bad' ? 'danger'
             : state === 'warn' ? 'warn' : 'mute';
    var ico = state === 'ok' ? 'fa-check' : state === 'bad' ? 'fa-xmark'
            : state === 'warn' ? 'fa-exclamation' : 'fa-question';
    return '<div class="nt-chain" data-tone="' + tone + '">' +
      '<span class="nt-chain-d"><i class="fa-solid ' + ico + '" aria-hidden="true"></i></span>' +
      '<div class="nt-chain-t"><b>' + esc(title) + '</b>' +
      (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' +
      (val ? '<span class="nt-chain-v">' + esc(val) + '</span>' : '') +
      '</div>';
  }

  /*@3.NOTJ.56*/
  function silenceText(code) {
    return code === 'channel-off'
        ? L('قناةُ المحاضرات مطفأةٌ في خياراتك أدناه.', 'The lectures channel is off in your options below.')
      : code === 'term'
        ? L('تواريخُ الفصل في جدولك لا تشمل الأيامَ القادمة.', 'Your term dates do not cover the coming days.')
      : code === 'focus'
        ? L('أسبوعُ اختباراتٍ يخفي المحاضرات — أظهِرْها من الجدول.', 'An exam week hides lectures. Show them from the schedule.')
      : code === 'range'
        ? L('تواريخُ بدء محاضراتك أو انتهائها لا تشمل الأيامَ القادمة.', 'The start or end dates on your lectures do not cover the coming days.')
      : code === 'cancelled'
        ? L('محاضراتُ الأسبوع مؤشَّرٌ عليها ملغاة.', 'This weeks lectures are marked cancelled.')
      : code === 'no-lectures'
        ? L('لا محاضرةَ في جدولك بعد.', 'No lectures in your schedule yet.')
      : code === 'done-or-past'
        ? L('محاضراتُك القادمةُ مؤشَّرٌ عليها «أُتمّت».', 'Your upcoming lectures are all marked done.')
      : '';
  }

  /*@3.NOTJ.57*/
  var KIND_ICO = { apple: 'fa-mobile-screen', google: 'fa-desktop',
                   mozilla: 'fa-desktop', microsoft: 'fa-desktop',
                   other: 'fa-circle-question' };
  function kindName(k) {
    return k === 'apple' ? L('آبل · آيفون أو سفاري', 'Apple, iPhone or Safari')
      : k === 'google' ? L('قوقل · كروم أو أندرويد', 'Google, Chrome or Android')
      : k === 'mozilla' ? L('فايرفوكس', 'Firefox')
      : k === 'microsoft' ? L('إيدج', 'Edge')
      : L('متصفّحٌ آخر', 'Another browser');
  }
  function deviceRow(x) {
    var stale = x.last_ok_at && (Date.now() - x.last_ok_at > 7 * 86400000);
    var tone = x.fail_count >= 3 ? 'danger'
             : x.self ? 'ok'
             : (!x.last_ok_at || stale) ? 'warn' : 'mute';
    return '<div class="nt-dev" data-tone="' + tone + '">' +
      '<span class="nt-dev-ic"><i class="fa-solid ' + (KIND_ICO[x.kind] || KIND_ICO.other) + '" aria-hidden="true"></i></span>' +
      '<div class="nt-dev-t"><b>' + esc(kindName(x.kind) + (x.ua ? ' · ' + x.ua : '')) + '</b>' +
      '<span>' + esc((x.last_ok_at
          ? L('آخرُ تسليمٍ نجح ', 'last delivery ') + when(x.last_ok_at)
          : L('لم يُسلَّم إليه شيءٌ بعد', 'nothing delivered yet')) +
        (x.fail_count ? ' · ' + L('إخفاقات: ', 'failures: ') + x.fail_count : '')) + '</span></div>' +
      (x.self ? '<span class="nt-chip">' + esc(L('هذا الجهاز', 'this device')) + '</span>' : '') +
      '</div>';
  }

  /*@3.NOTJ.60*/
  var VERDICT = null;
  function verdictHtml() {
    var v = VERDICT;
    if (!v) return '';
    var h = '';
    if (v.state === 'sending') {
      h = chainRow('unknown', L('أُرسلت التجربة — ننتظر جهازَك', 'Test sent — waiting for your device'),
        L('حتى دقيقتين: المؤقّتُ يدقّ كلَّ دقيقة، ثمّ يشهد جهازُك أنه عرض.',
          'Up to two minutes: the timer fires every minute, then your device reports it showed it.'), '');
    } else if (v.state === 'shown') {
      h = chainRow('ok', L('وصل جهازَك وعُرض ✓', 'Reached your device and was shown ✓'),
        L('إن لم تره على الشاشة فالسببُ في إعدادات إشعارات جهازك: التسليمُ الفوريّ لا الملخّصُ المجدول، وشاشةُ القفل، ووضعُ التركيز.',
          'If you did not see it on screen, the cause is in your device notification settings: immediate delivery rather than scheduled summary, lock screen, and focus modes.'), '');
    } else if (v.state === 'accepted') {
      h = chainRow('warn', L('قبلته خدمةُ الدفع ولم يعرضه جهازُك', 'The push service accepted it, but your device did not show it'),
        L('على آيفون: تأكّدْ أن التطبيقَ مفتوحٌ من الشاشة الرئيسية لا من سفاري، وأن إشعاراتِه «مسموحة» و«تسليمٌ فوريّ». وعلى أندرويد: لا تكن الحديقةُ في قائمة «تقييد البطارية».',
          'On iPhone: make sure the app is opened from the Home Screen, not Safari, and its notifications are allowed with immediate delivery. On Android: make sure the Garden is not battery-restricted.'), '');
    } else if (v.state === 'silent') {
      h = chainRow('bad', L('لم يصل جهازَك خلال دقيقتين', 'Nothing reached your device within two minutes'),
        L('تأكّدْ من اتّصالك، ثمّ أطفئِ التنبيهاتِ وأعِد تفعيلَها — يُعاد الاشتراكُ من جديد. وإن تكرّر فأخبرنا.',
          'Check your connection, then turn reminders off and on again to re-subscribe. If it keeps happening, tell us.'), '');
    } else if (v.state === 'rate') {
      h = chainRow('warn', L('تجاوزتَ حدَّ التجربة (٥ في الساعة)', 'You hit the test limit (5 per hour)'),
        L('ليس عطلاً — انتظر قليلاً.', 'Not a fault. Wait a little.'), '');
    } else if (v.state === 'fail') {
      h = chainRow('bad', L('لم تُرسَل التجربة', 'The test was not sent'), v.reason || '', '');
    }
    return h ? '<div class="nt-health nt-verdict">' + h + '</div>' : '';
  }

  /*@3.NOTJ.52*/
  function healthHtml() {
    var R = window.Reminders, PU = window.GardenPush;
    if (!R || !R.diagnose) return '';
    var d = null;
    try { d = R.diagnose(); } catch (e) { return ''; }
    if (!d.enabled) return '';

    var h = '<p class="nt-sec-t">' + esc(L('سلسلةُ تنبيهاتك', 'Your reminder chain')) + '</p>';
    var by = d.byKind || {};
    var parts = [];
    if (by.lectures) parts.push(by.lectures + ' ' + L('محاضرة', 'lectures'));
    if (by.exams) parts.push(by.exams + ' ' + L('اختبار', 'exams'));
    if (by.tasks) parts.push(by.tasks + ' ' + L('مهمّة', 'tasks'));
    if (by.study) parts.push(by.study + ' ' + L('مذاكرة', 'study'));
    if (by.events) parts.push(by.events + ' ' + L('موعد', 'events'));
    var sil = d.lectureSilence ? silenceText(d.lectureSilence) : '';
    h += chainRow(d.built ? (sil ? 'warn' : 'ok') : 'bad',
      L('جهازُك بنى الطابور', 'Your device built the queue'),
      sil || parts.join(' · ') || L('لا شيءَ مستحقٌّ خلال أربعة أسابيع.', 'Nothing due within four weeks.'),
      String(d.built));

    if (!PU || !PU.supported || !PU.supported()) {
      h += chainRow('bad', L('رُفعت إلى الخادم', 'Uploaded to the server'),
        L('الدفعُ غيرُ مدعومٍ هنا — التنبيهاتُ تصلك والموقعُ مفتوحٌ فقط.',
          'Push is not available here. Reminders arrive only while the site is open.'), '');
      return '<div class="nt-health">' + h + '</div>';
    }
    var p = CACHE.push;
    if (!p) {
      h += '<div class="nt-skel"></div><div class="nt-skel"></div>';
      return '<div class="nt-health">' + h + '</div>';
    }
    if (!p.ok) {
      h += chainRow('warn', L('رُفعت إلى الخادم', 'Uploaded to the server'),
        L('لم يُجب الخادمُ الآن — أعِدِ الفتحَ بعد قليل.',
          'The server did not answer just now. Try again shortly.'), '');
      return '<div class="nt-health">' + h + '</div>';
    }

    h += chainRow(p.reminders_pending ? 'ok' : (d.built ? 'warn' : 'mute'),
      L('رُفعت إلى الخادم', 'Uploaded to the server'),
      p.reminders_uploading_devices
        ? (p.reminders_uploading_devices + ' ' + L('جهازٌ يرفع طابورَه', 'device(s) uploading'))
        : L('لم يرفع أيُّ جهازٍ طابورَه بعد.', 'No device has uploaded its queue yet.'),
      String(p.reminders_pending || 0));

    var nxt = p.next_reminder_at ? ahead(p.next_reminder_at) : '';
    var fresh = (p.cron_last_run_ago_sec != null && p.cron_last_run_ago_sec < 600 && !p.cron_last_error);
    h += chainRow(fresh ? 'ok' : 'warn',
      L('المؤقّتُ يُطلق في موعده', 'The timer fires on time'),
      (p.reminders_sent_24h
        ? L('أُرسل في يوم: ', 'sent in 24h: ') + p.reminders_sent_24h
        : L('لم يُرسَل شيءٌ في يوم.', 'nothing sent in 24h.')) +
      (nxt ? ' · ' + L('التالي ', 'next ') + nxt : ''),
      String(p.reminders_sent_24h || 0));

    var list = p.devices_list || [];
    var mine = null;
    list.forEach(function (x) { if (x.self) mine = x; });
    h += chainRow(!p.devices ? 'bad' : (!mine ? 'warn' : (mine.last_ok_at ? 'ok' : 'warn')),
      L('خدمةُ الدفع تقبل', 'The push service accepts'),
      !p.devices
        ? L('لا جهازَ مشترِكٌ في خزنتك.', 'No device is subscribed to your vault.')
        : !mine
          ? L('هذا الجهازُ ليس منها — فعّلِ التنبيهاتِ عليه.', 'This device is not one of them. Turn reminders on here.')
          : mine.last_ok_at
            ? L('آخرُ تسليمٍ نجح ', 'last successful delivery ') + when(mine.last_ok_at)
            : L('لم يُسلَّم إليه شيءٌ بعد.', 'Nothing delivered to it yet.'),
      String(p.devices || 0));

    /*@3.NOTJ.58*/ /*@3.NOTJ.59*/
    var shownAt = mine && mine.last_shown_at;
    var okAt = mine && mine.last_ok_at;
    var ackLag = (okAt && (!shownAt || shownAt < okAt - 600000) && (Date.now() - okAt) > 600000);
    h += chainRow(shownAt ? 'ok' : (ackLag ? 'warn' : 'unknown'),
      L('جهازُك يعرضه', 'Your device shows it'),
      shownAt
        ? L('آخرُ تنبيهٍ عرضه هذا الجهازُ ', 'Last reminder this device showed ') + when(shownAt)
        : ackLag
          ? L('قبلته خدمةُ الدفع ولم يشهد جهازُك أنه عرضه. إن كان تطبيقُك محدَّثاً فراجعْ إعداداتِ إشعاراته — التسليمَ الفوريّ لا الملخّصَ المجدول، ووضعَ التركيز.',
              'The push service accepted it, but this device never reported showing it. If your app is up to date, check its notification settings: immediate delivery rather than scheduled summary, and focus modes.')
          : L('لم يُسلَّم إلى هذا الجهاز شيءٌ بعدُ — جرّبْ «كلُّ أجهزتي» أدناه وسنخبرك بما وقع.',
              'Nothing has been delivered to this device yet. Try “All my devices” below and we will tell you what happened.'),
      shownAt ? '' : '');
    var tail = p.queue_tail_at ? Math.round((p.queue_tail_at - Date.now()) / 86400000) : null;
    if (tail !== null && tail <= 3) {
      h += chainRow(tail <= 0 ? 'bad' : 'warn',
        L('الطابورُ يوشك أن يجفّ', 'Your queue is about to run dry'),
        L('آخرُ تنبيهٍ مرفوعٍ بعد ' + (tail <= 0 ? 'أقلَّ من يوم' : tail + (tail === 1 ? ' يوم' : ' أيام')) + ' — فتحُ الحديقة يجدّده تلقائيّاً، وسنذكّرك بذلك على جهازك.',
          'The last uploaded reminder is ' + (tail <= 0 ? 'less than a day' : tail + (tail === 1 ? ' day' : ' days')) + ' away. Opening the Garden refreshes it automatically, and we will remind you on your device.'),
        '');
    }

    if (list.length) {
      h += '<p class="nt-sec-t">' + esc(L('الأجهزةُ التي تصلها تنبيهاتك', 'Devices your reminders reach')) + '</p>';
      list.forEach(function (x) { h += deviceRow(x); });
    }
    return '<div class="nt-health">' + h + '</div>';
  }

  function optionsHtml() {
    var R = window.Reminders, s = null;
    try { s = R ? R.settings() : null; } catch (e) {}
    if (!s) return emptyHtml('fa-triangle-exclamation', L('محرّكُ التنبيهات غيرُ محمَّلٍ في هذه الصفحة.', 'The reminders engine is not loaded on this page.'));
    var off = !s.enabled;

    var h = healthHtml() +
      '<p class="nt-sec-t">' + esc(L('ما الذي يُنبَّه عنه', 'What you get reminded of')) + '</p>' +
      optRow('enabled', L('التنبيهاتُ المحلية', 'Device reminders'),
             L('تذكيرٌ قبل المحاضرة والاختبار والمهمّة.', 'Reminders before lectures, exams and tasks.'),
             !!s.enabled, false) +
      optRow('ch.lectures', L('قبل المحاضرة', 'Before lectures'), '',
             !!(s.channels && s.channels.lectures), off, leadSel('lectures', s.lead.lectures)) +
      optRow('ch.exams', L('قبل الاختبار', 'Before exams'), '',
             !!(s.channels && s.channels.exams), off, leadSel('exams', s.lead.exams)) +
      optRow('ch.tasks', L('المهامُّ والمواعيد', 'Tasks and due dates'), '',
             !!(s.channels && s.channels.tasks), off, leadSel('tasks', s.lead.tasks)) +
      /*@3.NOTJ.51*/
      optRow('ch.study', L('قبل المذاكرة وجلسات الخطّة', 'Before study and plan sessions'), '',
             !!(s.channels && s.channels.study), off, leadSel('study', s.lead.study)) +
      optRow('ch.events', L('قبل الأحداث العامّة', 'Before events'), '',
             !!(s.channels && s.channels.events), off, leadSel('events', s.lead.events)) +
      optRow('ch.review', L('نداءُ المراجعة اليوميّ', 'Daily review call'),
             L('نداءٌ واحدٌ كلَّ يومٍ لمراجعة بطاقاتك المستحقّة.',
               'One call a day to review your due cards.'),
             !!(s.channels && s.channels.review), off, timeIn('reviewTime', s.reviewTime));

    /*@3.NOTJ.25*/
    h += '<p class="nt-sec-t">' + esc(L('متى تصل', 'When they arrive')) + '</p>' +
      optRow('quiet', L('الهدوءُ الليليّ', 'Quiet hours'),
             L('يُؤجَّل ما يقع في هذه الساعات إلى بعدها.',
               'Anything falling in these hours is held until after.'),
             !!(s.quiet && s.quiet.on), off,
             timeIn('quiet.from', s.quiet.from) + '<span class="nt-dash">—</span>' + timeIn('quiet.to', s.quiet.to));

    /*@3.NOTJ.26*/
    var sn = (s.snooze || []).join(',');
    h += '<div class="nt-opt' + (off ? ' is-off' : '') + '">' +
      '<div class="nt-opt-t"><div class="nt-opt-n">' + esc(L('أزرارُ الغفوة على الإشعار', 'Snooze buttons on the alert')) + '</div>' +
      '<div class="nt-opt-h">' + esc(L('يظهران في الإشعار نفسِه لتأجيله بضغطة.',
        'They appear on the notification itself to postpone it with one tap.')) + '</div></div>' +
      '<div class="nt-opt-c"><select class="nt-sel" data-snooze aria-label="' + esc(L('الغفوة', 'Snooze')) + '">' +
        ['10,60', '5,30', '15,120', '30,1440'].map(function (v) {
          var p = v.split(',');
          return '<option value="' + v + '"' + (v === sn ? ' selected' : '') + '>' +
                 esc(leadWord(+p[0]) + ' · ' + leadWord(+p[1])) + '</option>';
        }).join('') + '</select></div></div>';

    /*@3.NOTJ.27*/
    var P = window.GardenPush;
    if (P && P.supported && P.supported()) {
      h += '<p class="nt-sec-t">' + esc(L('هذا الجهاز', 'This device')) + '</p>' +
        '<div class="nt-opt"><div class="nt-opt-t">' +
        '<div class="nt-opt-n">' + esc(L('تجربةٌ حقيقية', 'A real test')) + '</div>' +
        '<div class="nt-opt-h">' + esc(L(
          '«على هذا الجهاز» يفحص الإذنَ وحدَه. و«على كلِّ أجهزتي» يمرّ بالسلسلة كاملةً ويوقظ كلَّ جهازٍ فعّلتَه — أغلق الموقعَ في جوّالك ثم اضغطه من الحاسب.',
          '“This device” checks the permission only. “All my devices” walks the whole chain and wakes every device you enabled.')) + '</div></div>' +
        '<div class="nt-opt-c">' +
          '<button type="button" class="nt-btn" data-act="test"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i>' +
            esc(L('هذا الجهاز', 'This device')) + '</button>' +
          '<button type="button" class="nt-btn" data-act="test-all"><i class="fa-solid fa-tower-broadcast" aria-hidden="true"></i>' +
            esc(L('كلُّ أجهزتي', 'All my devices')) + '</button>' +
        '</div></div>' +
        verdictHtml();
    }

    /*@3.NOTJ.28*/
    var W = window.GardenWatch;
    var I = window.GardenICS;
    if ((W && W.ready && W.ready()) || (I && I.state)) {
      h += '<p class="nt-sec-t">' + esc(L('من الخادم', 'From the server')) + '</p>';
    }
    if (W && W.ready && W.ready()) {
      var on = !!(W.has && W.has('term', '*', '*'));
      h += optRow('term', L('نزولُ فصلٍ دراسيٍّ جديد', 'A new term is published'),
             L('يصلك أوّلَ ما يظهر فصلٌ في بانر.', 'You are told the moment a term appears in Banner.'),
             on, false);
    }

    /*@3.NOTJ.29*/
    if (I && I.state) {
      var st = I.state();
      var linked = !!(st && st.url);
      /*@3.NOTJ.30*/
      var days = [0, 1, 2, 3, 5, 7, 14].map(function (d) {
        var ar = d === 0 ? 'يومَ الموعد'
               : d === 1 ? 'قبلها بيوم'
               : d === 2 ? 'قبلها بيومين'
               : (d <= 10 ? 'قبلها بـ' + d + ' أيام' : 'قبلها بـ' + d + ' يوماً');
        var en = d === 0 ? 'on the day' : (d === 1 ? '1 day before' : d + ' days before');
        return '<option value="' + d + '"' + (d === (st.lead_days | 0) ? ' selected' : '') + '>' +
          esc(L(ar, en)) + '</option>';
      }).join('');
      h += optRow('ics', L('تقويمُ البلاك بورد', 'Blackboard calendar'),
        linked
          ? L('يستطلع الخادمُ تقويمَك ويذكّرك بمواعيده — ولا يكتب في جدولك شيئاً.',
              'The server polls your calendar and reminds you — it never writes to your schedule.')
          : L('لم تربط تقويمَك بعد — يُربط من إعدادات الجدول.',
              'No calendar linked yet — link it from schedule settings.'),
        !!(st && st.on_server), !linked,
        linked ? '<select class="nt-sel" data-ics-lead aria-label="' + esc(L('مهلةُ التقويم', 'Calendar lead')) + '">' + days + '</select>' : '');
    }

    h += '<p class="nt-note">' + esc(L(
      'مفاتيحُ هذه الصفحة تكتب في المحرّكات نفسِها التي تكتب فيها صفحاتُ الجدول والشعب — لا نسخةَ ثانية.',
      'These switches write to the same engines the schedule and sections pages use — no second copy.')) + '</p>';
    return h;
  }

  /*@3.NOTJ.31*/

  /*@3.NOTJ.32*/
  function helpHtml() {
    if (!window.RemindersPanel || !RemindersPanel.html) {
      return emptyHtml('fa-life-ring', L(
        'دليلُ الأعطال غيرُ محمَّلٍ في هذه الصفحة.',
        'The troubleshooting guide is not loaded on this page.'));
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = RemindersPanel.html;
    var t = tmp.querySelector('#rem-tshoot');
    if (!t) return emptyHtml('fa-life-ring', L('لا دليلَ متاح.', 'No guide available.'));
    /*@3.NOTJ.33*/
    t.setAttribute('open', '');
    t.removeAttribute('id');            /*@3.NOTJ.34*/
    return t.outerHTML;
  }

  /*@3.NOTJ.35*/
  var TABS = [
    ['log', 'السجلّ', 'History', 'fa-clock-rotate-left', 'info'],
    ['reg', 'المسجَّل', 'Active', 'fa-bell', 'ok'],
    ['pend', 'المنتظَر', 'Pending', 'fa-hourglass-half', 'warn'],
    ['opt', 'الخيارات', 'Options', 'fa-sliders', ''],
    ['help', 'المساعدة', 'Help', 'fa-life-ring', '']
  ];

  function shell(pending) {
    var counts = {
      log: CACHE.log ? CACHE.log.length : 0,
      reg: 0, pend: 0, opt: 0
    };
    var tabs = TABS.map(function (t) {
      var n = counts[t[0]];
      return '<button type="button" class="nt-tab" role="tab" data-tab="' + t[0] + '"' +
        (t[4] ? ' data-t="' + t[4] + '"' : '') +
        ' aria-selected="' + (TAB === t[0] ? 'true' : 'false') + '">' +
        '<i class="fa-solid ' + t[3] + '" aria-hidden="true"></i>' +
        '<span data-ar="' + esc(t[1]) + '" data-en="' + esc(t[2]) + '">' + esc(L(t[1], t[2])) + '</span>' +
        (n ? '<span class="nt-tab-n">' + n + '</span>' : '') + '</button>';
    }).join('');

    var body = TAB === 'log' ? logHtml()
             : TAB === 'reg' ? registeredHtml()
             : TAB === 'pend' ? pendingHtml(pending)
             : TAB === 'help' ? helpHtml()
             : optionsHtml();

    return ctaHtml() + statsHtml() +
      '<div class="nt-tabs" role="tablist">' + tabs + '</div>' +
      '<div class="nt-panel" role="tabpanel">' + body + '</div>';
  }

  /*@3.NOTJ.36*/

  function paint(host, pending) {
    host.innerHTML = shell(pending);
    /*@3.NOTJ.37*/
    try { if (window.Garden && Garden.localize) Garden.localize(host); } catch (e) {}
    /*@3.NOTJ.38*/
    host.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { TAB = b.getAttribute('data-tab'); refresh(); });
    });
    host.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { act(b.getAttribute('data-act')); });
    });
    host.querySelectorAll('[data-opt]').forEach(function (b) {
      b.addEventListener('click', function () { toggleOpt(b.getAttribute('data-opt')); });
    });
    host.querySelectorAll('[data-lead]').forEach(function (i) {
      i.addEventListener('change', function () {
        var p = { lead: {} };
        p.lead[i.getAttribute('data-lead')] = Math.max(0, parseInt(i.value, 10) || 0);
        save(p);
      });
    });
    /*@3.NOTJ.39*/
    host.querySelectorAll('[data-time]').forEach(function (i) {
      i.addEventListener('change', function () {
        var k = i.getAttribute('data-time'), v = i.value;
        if (!v) return;                       /*@3.NOTJ.40*/
        save(k.indexOf('quiet.') === 0 ? { quiet: (k === 'quiet.from' ? { from: v } : { to: v }) }
                                       : { reviewTime: v });
      });
    });
    host.querySelectorAll('[data-snooze]').forEach(function (i) {
      i.addEventListener('change', function () {
        save({ snooze: i.value.split(',').map(Number) });
      });
    });
    host.querySelectorAll('[data-ics-lead]').forEach(function (i) {
      i.addEventListener('change', function () {
        var I = window.GardenICS;
        if (!I || !I.setLead) return;
        I.setLead(parseInt(i.value, 10) || 0);
        /*@3.NOTJ.41*/
        if (I.state().on_server && I.register) I.register().then(refresh); else refresh();
      });
    });
    /*@3.NOTJ.42*/
    host.querySelectorAll('[data-drop]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-drop').split('|');
        var W = window.GardenWatch;
        if (!W || !W.toggle) return;
        b.disabled = true;
        W.toggle(p[0], p[1], p[2]).then(function () { CACHE.log = null; refresh(); });
      });
    });
    /*@3.NOTJ.43*/
    if (window.GardenSelect && GardenSelect.enhance) {
      try { GardenSelect.enhance(host); } catch (e) {}
    }
  }

  function save(patch) {
    try { Reminders.save(patch); Reminders.refresh && Reminders.refresh(); } catch (e) {}
    refresh();
  }

  function act(what) {
    if (what === 'enable') {
      if (!window.Reminders) return;
      /*@3.NOTJ.53*/
      Reminders.requestPermission().then(function (p) {
        LAST_PERM = p;
        if (p === 'granted') {
          LAST_PERM = null;
          Reminders.save({ enabled: true });
          try { muteBreak(''); } catch (e) {}
          Reminders.refresh && Reminders.refresh();
          CACHE.push = null;
        }
        refresh();
      });
    } else if (what === 'test') {
      try { Reminders.test(); } catch (e) {}
    } else if (what === 'test-all') {
      /*@3.NOTJ.44*/
      var P = window.GardenPush;
      if (!P || !P.serverTest) return;
      if (VERDICT && VERDICT.state === 'sending') return;
      note(L('جارٍ الإيقاظ…', 'Waking your devices…'));
      VERDICT = { state: 'sending' };
      HOSTS.forEach(function (x) { paint(x, []); });
      P.serverTest().then(function (r) {
        if (r && r.ok) {
          note(L('أُرسل إلى ' + (r.devices || 0) + ' جهاز — ننتظر شهادةَ جهازك.',
                 'Sent to ' + (r.devices || 0) + ' device(s) — waiting for your device to report.'));
          /*@3.NOTJ.61*/
          var since = r.fireAt || Date.now();
          var wait = P.awaitShown ? P.awaitShown(since) : Promise.resolve({ verdict: 'silent' });
          wait.then(function (v) {
            VERDICT = { state: (v && v.verdict) || 'silent' };
            CACHE.push = null;
            HOSTS.forEach(function (x) { paint(x, []); });
            refresh();
          });
        } else if (r && (r.reason === 'rate_limited' || r.reason === 'test_rate_limited')) {
          VERDICT = { state: 'rate' };
          HOSTS.forEach(function (x) { paint(x, []); });
        } else {
          VERDICT = { state: 'fail', reason: (r && r.reason) || L('غير معروف', 'unknown') };
          HOSTS.forEach(function (x) { paint(x, []); });
        }
      });
    } else if (what === 'seen') {
      var W = window.GardenWatch;
      if (W && W.markSeen) W.markSeen().then(function () { CACHE.log = null; refresh(); });
    }
  }

  /*@3.NOTJ.45*/
  function note(msg) {
    if (window.Garden && Garden.toast) { try { Garden.toast(msg); return; } catch (e) {} }
    var el = document.querySelector('.nt-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'nt-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.classList.remove('is-on'); }, 4200);
  }

  function toggleOpt(key) {
    var R = window.Reminders;
    if (key === 'term') {
      var W = window.GardenWatch;
      if (!W || !W.toggle) return;
      W.toggle('term', '*', '*').then(refresh);
      return;
    }
    if (key === 'ics') {
      var I = window.GardenICS;
      if (!I) return;
      var st = I.state();
      var go = st.on_server ? (I.unregister ? I.unregister() : Promise.resolve())
                            : (I.register ? I.register() : Promise.resolve());
      Promise.resolve(go).then(refresh);
      return;
    }
    if (!R) return;
    var s = R.settings();
    if (key === 'enabled') {
      if (!s.enabled) { act('enable'); return; }
      R.save({ enabled: false });
    } else if (key === 'quiet') {
      R.save({ quiet: { on: !(s.quiet && s.quiet.on) } });
    } else if (key.indexOf('ch.') === 0) {
      var k = key.slice(3), p = { channels: {} };
      p.channels[k] = !(s.channels && s.channels[k]);
      R.save(p);
    }
    try { R.refresh && R.refresh(); } catch (e) {}
    refresh();
  }

  /*@3.NOTJ.46*/

  function refresh() {
    if (!HOSTS.length) return;
    /*@3.NOTJ.54*/
    if (TAB === 'opt' && !PBUSY && window.GardenPush && GardenPush.status &&
        GardenPush.supported && GardenPush.supported() &&
        (!CACHE.push || Date.now() - CACHE.pushAt > 60000)) {
      PBUSY = true;
      var done = function (r) {
        CACHE.push = (r && typeof r === 'object') ? r : { ok: false };
        CACHE.pushAt = Date.now();
        PBUSY = false;
        HOSTS.forEach(function (x) { paint(x, []); });
      };
      GardenPush.status().then(done, function () { done(null); });
    }
    var needLog = TAB === 'log' && (!CACHE.log || Date.now() - CACHE.at > 60000);
    var pendP = TAB === 'pend' && window.Reminders
      ? Reminders.upcoming(20).catch(function () { return []; })
      : Promise.resolve([]);

    if (needLog && !BUSY) {
      BUSY = true;
      HOSTS.forEach(function (h) { paint(h, []); });      /*@3.NOTJ.47*/
      loadLog().then(function (rows) {
        CACHE.log = rows; CACHE.at = Date.now(); BUSY = false;
        HOSTS.forEach(function (h) { paint(h, []); });
      }, function () { CACHE.log = []; BUSY = false; HOSTS.forEach(function (h) { paint(h, []); }); });
      return;
    }
    pendP.then(function (list) { HOSTS.forEach(function (h) { paint(h, list); }); });
  }

  function mount(target) {
    var el = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!el || HOSTS.indexOf(el) >= 0) return null;
    el.classList.add('nt');
    HOSTS.push(el);
    refresh();
    return el;
  }

  /*@3.NOTJ.48*/
  ['garden:languageChanged', 'garden:syncCompleted'].forEach(function (ev) {
    document.addEventListener(ev, function () { CACHE.log = null; refresh(); });
  });
  if (window.GardenWatch && GardenWatch.on) {
    GardenWatch.on(function () { CACHE.log = null; refresh(); });
  }

  /*@3.NOTJ.49*/
  function autoMount() {
    var h = document.getElementById('nt-host');
    if (h) mount(h);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  window.GardenNotify = {
    mount: mount,
    refresh: function () { CACHE.log = null; refresh(); },
    breakage: breakage,
    breakSeen: breakSeen,
    muteBreak: muteBreak
  };
})();
