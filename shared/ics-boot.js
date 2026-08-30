/*@3.ICBJ.1*/
;(function () {
  'use strict';

  var STAMP_LS = 'garden_ics_boot';
  var MIN_GAP = 6 * 60 * 60 * 1000;

  /*@3.ICBJ.2*/
  var s = null;
  try { s = JSON.parse(localStorage.getItem('garden_ics') || 'null'); } catch (e) { return; }
  if (!s || !s.url || s.auto === false) {
    /*@3.ICBJ.9*/
    if (!s || !s.url) {
      window.addEventListener('garden:syncCompleted', function again() {
        window.removeEventListener('garden:syncCompleted', again);
        var t = null;
        try { t = JSON.parse(localStorage.getItem('garden_ics') || 'null'); } catch (e) { return; }
        if (!t || !t.url || t.auto === false) return;
        try { localStorage.setItem(STAMP_LS, String(Date.now())); } catch (e) {}
        if (window.GardenICS) go(); else start();
      });
    }
    return;
  }

  var last = 0;
  try { last = parseInt(localStorage.getItem(STAMP_LS), 10) || 0; } catch (e) {}
  if (Date.now() - last < MIN_GAP) return;

  /*@3.ICBJ.3*/
  try { localStorage.setItem(STAMP_LS, String(Date.now())); } catch (e) {}

  function go() {
    if (window.GardenICS && GardenICS.bootSync) GardenICS.bootSync();
  }

  /*@3.ICBJ.4*/
  if (window.GardenICS) { go(); return; }

  /*@3.ICBJ.5*/
  var sc = document.currentScript;
  var ROOT = (sc && sc.src)
    ? sc.src.replace(/shared\/ics-boot\.js(\?.*)?$/, '')
    : (location.origin + '/');

  /*@3.ICBJ.6*/
  function load(src, then) {
    var el = document.createElement('script');
    el.src = ROOT + src;
    el.async = false;                /*@3.ICBJ.7*/
    el.onload = then || null;
    (document.head || document.documentElement).appendChild(el);
  }

  /*@3.ICBJ.8*/
  function start() {
    if (!window.GardenEndpoints) load('shared/endpoints.js');
    load('shared/ics-sync.js', go);
  }

  if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 8000 });
  else setTimeout(start, 4000);
})();
