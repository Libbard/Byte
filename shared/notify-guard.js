/*@3.NOGJ.1*/
;(function () {
  'use strict';

  var MUTE = 'garden_notify_break_muted';   /*@3.NOGJ.2*/
  var SEEN = 'garden_notify_break_seen';    /*@3.NOGJ.3*/
  var DAY = 24 * 60 * 60 * 1000;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function isAr() {
    return (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') !== 0;
  }
  function L(ar, en) { return isAr() ? ar : en; }

  /*@3.NOGJ.4*/

  function diagnose() {
    var s = null;
    try { s = JSON.parse(ls('garden_reminders') || 'null'); } catch (e) { return null; }
    if (!s || !s.enabled) return null;                    /*@3.NOGJ.5*/
    if (!('Notification' in window)) {
      return { code: 'unsupported', fixable: false, ev: 'Notification: unsupported',
        ar: 'هذا المتصفّحُ لا يدعم الإشعاراتِ أصلاً، فما فعّلتَه لا يصل إليك.',
        en: 'This browser does not support notifications, so what you enabled cannot reach you.' };
    }
    var p = Notification.permission;
    if (p === 'denied') {
      return { code: 'denied', fixable: false, ev: 'permission: denied',
        ar: 'أوقف المتصفّحُ إشعاراتِ الموقع. لا يُعاد الإذنُ من داخل الصفحة — افتح قفلَ العنوان في شريط المتصفّح ثم اسمح بالإشعارات.',
        en: 'The browser blocked notifications for this site. A page cannot restore that — open the padlock in the address bar and allow notifications.' };
    }
    if (p === 'default') {
      return { code: 'unasked', fixable: true, ev: 'permission: default',
        ar: 'التنبيهاتُ مفعَّلةٌ في إعداداتك، لكنّ إذنَ المتصفّح لم يُمنح — فلا يصلك شيء.',
        en: 'Reminders are on in your settings, but the browser permission was never granted — so nothing arrives.' };
    }
    return null;
  }

  /*@3.NOGJ.6*/

  /*@3.NOGJ.7*/
  var BASE = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared\/notify-guard\.js(\?.*)?$/, '') : '';
  })();

  function sheet(cb) {
    if (document.querySelector('link[data-ng-css]')) { cb(); return; }
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = BASE + 'shared/notify-guard.css';
    l.setAttribute('data-ng-css', '');
    /*@3.NOGJ.8*/
    l.onload = cb; l.onerror = cb;
    document.head.appendChild(l);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function show(d) {
    if (document.getElementById('ng-dlg')) return;
    sheet(function () { build(d); });
  }

  function build(d) {
    if (document.getElementById('ng-dlg')) return;
    /*@3.NOGJ.9*/
    var dlg = document.createElement('dialog');
    dlg.id = 'ng-dlg';
    dlg.className = 'ng';
    dlg.setAttribute('aria-labelledby', 'ng-t');
    dlg.innerHTML =
      '<div class="ng-box">' +
        '<div class="ng-head">' +
          '<span class="ng-ic"><i class="fa-solid fa-bell-slash" aria-hidden="true"></i></span>' +
          '<div class="ng-ht">' +
            '<h2 id="ng-t">' + esc(L('تنبيهاتُك توقّفت', 'Your reminders stopped')) + '</h2>' +
            '<p>' + esc(L('فعّلتَها من قبل، ولم تعد تصل', 'You turned them on before — they no longer arrive')) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="ng-verdict">' +
          '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
          '<p>' + esc(L(d.ar, d.en)) + '</p>' +
        '</div>' +
        /*@3.NOGJ.10*/
        '<div class="ng-ev"><span class="ng-chip">' +
          esc(L('ما قِيس', 'measured')) + ' <b>' + esc(d.ev) + '</b></span></div>' +
        '<div class="ng-act">' +
          '<button type="button" class="ng-b is-quiet" data-ng="mute">' +
            '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>' +
            esc(L('لا تُظهرها ثانيةً', 'Don’t show again')) + '</button>' +
          (d.fixable
            ? '<button type="button" class="ng-b" data-ng="later">' +
                esc(L('ليس الآن', 'Not now')) + '</button>' +
              '<button type="button" class="ng-b is-primary" data-ng="fix">' +
                '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
                esc(L('أعِد التفعيل', 'Re-enable')) + '</button>'
            /*@3.NOGJ.11*/
            : '<button type="button" class="ng-b is-primary" data-ng="later">' +
                esc(L('فهمت', 'Got it')) + '</button>') +
        '</div>' +
      '</div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ng]') : null;
      if (!b) return;
      var a = b.getAttribute('data-ng');
      if (a === 'mute') set(MUTE, d.code);
      if (a === 'fix') {
        /*@3.NOGJ.12*/
        try {
          Notification.requestPermission().then(function (p) {
            if (p === 'granted') { try { localStorage.removeItem(MUTE); } catch (e2) {} }
          });
        } catch (e3) {}
      }
      dlg.close();
      setTimeout(function () { if (dlg.parentNode) dlg.parentNode.removeChild(dlg); }, 0);
    });

    set(SEEN, String(Date.now()));
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /*@3.NOGJ.13*/

  function boot() {
    var d = diagnose();
    if (!d) return;
    if (ls(MUTE) === d.code) return;                     /*@3.NOGJ.14*/
    var last = parseInt(ls(SEEN), 10) || 0;
    if (Date.now() - last < DAY) return;
    /*@3.NOGJ.15*/
    setTimeout(function () { show(d); }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /*@3.NOGJ.16*/
  var DEMO = {
    denied: { code: 'denied', fixable: false, ev: 'permission: denied',
      ar: 'أوقف المتصفّحُ إشعاراتِ الموقع. لا يُعاد الإذنُ من داخل الصفحة — افتح قفلَ العنوان في شريط المتصفّح ثم اسمح بالإشعارات.',
      en: 'The browser blocked notifications for this site. A page cannot restore that — open the padlock in the address bar and allow notifications.' },
    unasked: { code: 'unasked', fixable: true, ev: 'permission: default',
      ar: 'التنبيهاتُ مفعَّلةٌ في إعداداتك، لكنّ إذنَ المتصفّح لم يُمنح — فلا يصلك شيء.',
      en: 'Reminders are on in your settings, but the browser permission was never granted — so nothing arrives.' },
    unsupported: { code: 'unsupported', fixable: false, ev: 'Notification: unsupported',
      ar: 'هذا المتصفّحُ لا يدعم الإشعاراتِ أصلاً، فما فعّلتَه لا يصل إليك.',
      en: 'This browser does not support notifications, so what you enabled cannot reach you.' }
  };

  window.GardenNotifyGuard = {
    diagnose: diagnose,
    show: show,
    demo: function (code) {
      var d = DEMO[code] || diagnose() || DEMO.denied;
      var old = document.getElementById('ng-dlg');
      if (old) { try { old.close(); } catch (e) {} old.remove(); }
      show(d);
      return d.code;
    },
    /*@3.NOGJ.17*/
    reset: function () {
      try { localStorage.removeItem(MUTE); localStorage.removeItem(SEEN); } catch (e) {}
      return 'ok';
    }
  };
})();
