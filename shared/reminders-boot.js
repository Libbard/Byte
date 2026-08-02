 
;(function () {
  'use strict';

   
  if (window.Reminders) return;

  var STAMP_LS = 'garden_reminders_boot';
  var MIN_GAP = 6 * 60 * 60 * 1000;

  var s = null;
  try { s = JSON.parse(localStorage.getItem('garden_reminders') || 'null'); } catch (e) { return; }
  if (!s || !s.enabled) return;

   
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  var last = 0;
  try { last = parseInt(localStorage.getItem(STAMP_LS), 10) || 0; } catch (e) {}
  if (Date.now() - last < MIN_GAP) return;

   
  try { localStorage.setItem(STAMP_LS, String(Date.now())); } catch (e) {}

   
  var sc = document.currentScript;
  var ROOT = (sc && sc.src)
    ? sc.src.replace(/shared\/reminders-boot\.js(\?.*)?$/, '')
    : (location.origin + '/');

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
      el.async = false;          
      el.onload = res;
      el.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(el);
    });
  }

   
  function boot() {
    css('shared/reminders.css');   
    ['shared/endpoints.js',
     'shared/reminders-db.js',
     'shared/garden-data.js',
     'shared/push-client.js',
     'shared/reminders.js'
    ].reduce(function (chain, src) {
      return chain.then(function () { return js(src); });
    }, Promise.resolve()).catch(function () {
       
      try { localStorage.removeItem(STAMP_LS); } catch (e) {}
    });
  }

   
  if (window.requestIdleCallback) {
    requestIdleCallback(boot, { timeout: 8000 });
  } else {
    setTimeout(boot, 2500);
  }
})();
