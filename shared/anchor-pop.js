/*@3.ANPJ.1*/
;(function () {
  'use strict';

  var SETTLE = [0, 120, 300, 600, 1000];

  function rtl() {
    return (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
  }

  /*@3.ANPJ.2*/
  /*@3.ANPJ.3*/
  function place(el, btn, fb) {
    if (!el) return false;
    var br = btn ? btn.getBoundingClientRect() : null;
    if (!br || (!br.width && !br.height)) {
      if (el.style.top) return true;
      var r = fb ? fb.getBoundingClientRect() : null;
      if (!r || (!r.width && !r.height)) return false;
      br = { top: r.top, bottom: r.top, left: r.left, right: r.right,
             width: 0, height: 0 };
    }
    var w = el.offsetWidth || 256;
    var pad = 8;
    var room = Math.max(pad, window.innerWidth - w - pad);
    el.style.top = Math.max(pad, br.bottom + 6) + 'px';
    if (rtl()) {
      el.style.right = Math.min(room, Math.max(pad, window.innerWidth - br.right)) + 'px';
      el.style.left = 'auto';
    } else {
      el.style.left = Math.min(room, Math.max(pad, br.left)) + 'px';
      el.style.right = 'auto';
    }
    var pr = el.getBoundingClientRect();
    if (!br.width) { el.style.setProperty('--tip', '-99px'); return true; }
    var tip = (br.left + br.width / 2) - pr.left;
    el.style.setProperty('--tip',
      Math.max(14, Math.min(Math.max(28, pr.width) - 14, tip)) + 'px');
    return true;
  }

  function settle(el, btn, fb) {
    SETTLE.forEach(function (ms) {
      setTimeout(function () {
        if (el && el.parentNode) place(el, btn, fb);
      }, ms);
    });
    var on = function () { if (el && el.parentNode) place(el, btn, fb); };
    document.addEventListener('transitionend', on, true);
    window.addEventListener('resize', on);
    return function () {
      document.removeEventListener('transitionend', on, true);
      window.removeEventListener('resize', on);
    };
  }

  function watch(el, opts) {
    var o = opts || {};
    var shut = o.close || function () {};
    var held = false;
    var t = 0;
    var left = Number(o.ttl) || 0;
    var from = 0;

    /*@3.ANPJ.4*/
    function stop() { if (t) { clearTimeout(t); t = 0; } }
    function tick() {
      stop();
      if (!(left > 0) || held) return;
      from = Date.now();
      t = setTimeout(function () { go('ttl'); }, left);
    }
    function hold() {
      held = true;
      if (t) { left = Math.max(1200, left - (Date.now() - from)); }
      stop();
    }
    function free() { held = false; tick(); }

    var key = function (e) {
      if (e.key !== 'Escape') return;
      if (o.locked && o.locked()) return;
      e.stopPropagation();
      go('esc');
    };
    var out = function (e) {
      if (!el.parentNode) return;
      if (el.contains(e.target)) return;
      if (o.skip && o.skip(e.target)) return;
      if (o.locked && o.locked()) return;
      go('out');
    };

    var dead = false;
    function go(why) {
      if (dead) return;
      off();
      shut(why);
    }
    function off() {
      if (dead) return;
      dead = true;
      stop();
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('pointerdown', out, true);
      el.removeEventListener('pointerenter', hold);
      el.removeEventListener('focusin', hold);
      el.removeEventListener('pointerleave', free);
      el.removeEventListener('focusout', free);
    }

    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', out, true);
    el.addEventListener('pointerenter', hold);
    el.addEventListener('focusin', hold);
    el.addEventListener('pointerleave', free);
    el.addEventListener('focusout', free);
    tick();

    return { off: off, hold: hold, free: free,
             ttl: function (ms) { left = Number(ms) || 0; held = false; tick(); } };
  }

  window.GardenPop = { place: place, settle: settle, watch: watch };
})();
