/*@3.REBJ.1*/
;(function () {
  'use strict';

  /*@3.REBJ.2*/
  if (window.Reminders) return;

  var STAMP_LS = 'garden_reminders_boot';
  var MIN_GAP = 6 * 60 * 60 * 1000;

  /*@3.REBJ.3*/
  var sc = document.currentScript;
  var ROOT = (sc && sc.src)
    ? sc.src.replace(/shared\/reminders-boot\.js(\?.*)?$/, '')
    : (location.origin + '/');

  var s = null;
  try { s = JSON.parse(localStorage.getItem('garden_reminders') || 'null'); } catch (e) { return; }
  if (!s || !s.enabled) return;

  /*@3.REBJ.4*/
  var granted = ('Notification' in window) && Notification.permission === 'granted';
  if (!granted) {
    var g = document.createElement('script');
    g.src = ROOT + 'shared/notify-guard.js';
    g.async = true;
    document.head.appendChild(g);
    return;
  }

  var last = 0;
  try { last = parseInt(localStorage.getItem(STAMP_LS), 10) || 0; } catch (e) {}
  if (Date.now() - last < MIN_GAP) return;

  /*@3.REBJ.5*/
  try { localStorage.setItem(STAMP_LS, String(Date.now())); } catch (e) {}

  function css(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + href;
    document.head.appendChild(l);
  }

  function js(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement('script');
      el.src = ROOT + src;
      el.async = false;          /*@3.REBJ.6*/
      el.onload = res;
      el.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(el);
    });
  }

  /*@3.REBJ.7*/
  function boot() {
    css('shared/reminders.css');   /*@3.REBJ.8*/
    ['shared/endpoints.js',
     'shared/reminders-db.js',
     'shared/garden-data.js',
     'shared/push-client.js',
     'shared/reminders.js'
    ].reduce(function (chain, src) {
      return chain.then(function () { return js(src); });
    }, Promise.resolve()).catch(function () {
      /*@3.REBJ.9*/
      try { localStorage.removeItem(STAMP_LS); } catch (e) {}
    });
  }

  /*@3.REBJ.10*/
  if (window.requestIdleCallback) {
    requestIdleCallback(boot, { timeout: 8000 });
  } else {
    setTimeout(boot, 2500);
  }
})();
