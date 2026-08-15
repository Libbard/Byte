/*@3.FIRJ.1*/
(function () {
  'use strict';

  var STATE = 'onboarding_state';
  /*@3.FIRJ.2*/
  var V = 3;
  var CSS = ['shared/gpa.css', 'shared/gpa-setup.css'];
  var JS = 'shared/gpa-setup.js';

  /*@3.FIRJ.3*/
  var self = document.currentScript;
  var BASE = (self && self.src) ? self.src.replace(/shared\/first-run\.js.*$/, '') : '';

  function readJSON(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
    catch (e) { return d; }
  }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function len(x) { return (x && x.length) || 0; }

  /*@3.FIRJ.4*/
  function hasData() {
    /*@3.FIRJ.5*/
    try {
      var st0 = readJSON(STATE, null);
      var mid = st0 && st0.wizard_open;
      if (!mid && localStorage.getItem('garden_sync_key')) return true;
    } catch (e) {}
    var p = readJSON('student_profile', null);
    if (p && (p.program || p.major || p.level || len(p.levels) || p.name || p.name_ar)) return true;
    var s = readJSON('my_semester', null);
    if (s && len(s.courses)) return true;
    var a = readJSON('semester_archive', null);
    if (len(a)) return true;
    var g = readJSON('gpa_plan', null);
    if (g && len(g.semesters)) return true;
    var w = readJSON('weekly_schedule', null);
    if (w && (len(w.sessions) || len(w.exams))) return true;
    return false;
  }

  function seal(field) {
    var st = readJSON(STATE, null) || { completed_v: 0, seen_v: 0, step: 0, data: {} };
    st[field] = V;
    if (field === 'completed_v') st.seen_v = V;
    writeJSON(STATE, st);
  }

  /*@3.FIRJ.6*/
  function shouldRun() {
    var st = readJSON(STATE, null);
    if (st && ((st.completed_v || 0) >= V || (st.seen_v || 0) >= V)) return false;

    /*@3.FIRJ.7*/
    var done = st && (st.completed_v || 0) > 0;
    if (done) {
      var hasKey = false;
      try { hasKey = !!localStorage.getItem('garden_sync_key'); } catch (e) {}
      /*@3.FIRJ.8*/
      if (hasKey) return 'notify';
      return 'sync';
    }

    /*@3.FIRJ.9*/
    if (hasData()) { seal('completed_v'); return false; }
    return true;
  }

  /*@3.FIRJ.10*/
  function loadCSS(href, cb) {
    if (document.querySelector('link[data-fr="' + href + '"]')) { cb(); return; }
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = BASE + href;
    l.setAttribute('data-fr', href);
    /*@3.FIRJ.11*/
    l.onload = cb; l.onerror = cb;
    document.head.appendChild(l);
  }
  function loadJS(src, cb) {
    if (window.GardenSetup) { cb(); return; }
    var s = document.createElement('script');
    s.src = BASE + src;
    s.onload = cb; s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  var loading = false;
  function launch() {
    if (loading) return;
    if (window.GardenSetup) { open(); return; }
    loading = true;
    var left = CSS.length;
    CSS.forEach(function (h) {
      loadCSS(h, function () {
        if (--left) return;
        /*@3.FIRJ.12*/
        loadJS(JS, function () { loading = false; open(); });
      });
    });
  }

  var openAt = null;
  function open() {
    if (!window.GardenSetup || !window.GardenSetup.open) return;
    watchClose();
    window.GardenSetup.open(openAt);
  }

  /*@3.FIRJ.13*/
  function watchClose() {
    if (!window.MutationObserver || !document.body) return;
    var appeared = false;
    var mo = new MutationObserver(function () {
      if (document.getElementById('gs-overlay')) { appeared = true; return; }
      if (!appeared) return;
      mo.disconnect();
      seal('seen_v');
    });
    mo.observe(document.body, { childList: true });
  }

  /*@3.FIRJ.14*/
  function isHome() { return /(^|\/)(index\.html)?$/.test(location.pathname); }

  function boot() {
    if (!isHome()) return;
    /*@3.FIRJ.15*/
    if (/#setup/.test(location.hash)) { launch(); return; }
    var r = shouldRun();
    if (!r) return;
    /*@3.FIRJ.16*/
    openAt = (typeof r === 'string') ? r : null;
    /*@3.FIRJ.17*/
    setTimeout(launch, 450);
  }

  window.addEventListener('hashchange', function () {
    if (isHome() && /#setup/.test(location.hash)) launch();
  });

  /*@3.FIRJ.18*/
  function completed() {
    var st = readJSON(STATE, null);
    return !!(st && (st.completed_v || 0) > 0);
  }
  function isAr() {
    try { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function labelEntries() {
    var done = completed();
    var ar = done ? 'معالج الإعداد' : 'أكمل ملفك';
    var en = done ? 'Setup wizard' : 'Finish your profile';
    var ico = done ? 'fa-wand-magic-sparkles' : 'fa-seedling';
    Array.prototype.forEach.call(document.querySelectorAll('[data-wizard-entry]'), function (a) {
      var s = a.querySelector('[data-ar]');
      if (s) {
        s.setAttribute('data-ar', ar);
        s.setAttribute('data-en', en);
        s.textContent = isAr() ? ar : en;
      }
      var i = a.querySelector('i.fa-solid');
      if (i) i.className = 'fa-solid ' + ico;
      /*@3.FIRJ.19*/
      a.classList.toggle('set-btn--primary', !done);
    });
  }
  function wireLabels() {
    labelEntries();
    document.addEventListener('garden:languageChanged', labelEntries);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); wireLabels(); });
  } else { boot(); wireLabels(); }

  window.GardenFirstRun = {
    launch: launch, shouldRun: shouldRun, hasData: hasData,
    completed: completed, relabel: labelEntries
  };
})();
