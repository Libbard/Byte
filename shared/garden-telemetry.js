/*@3.GATJ.1*/
; (function () {
  'use strict';
  if (window.GardenTelemetry) return;

  var V = 1;
  var FLUSH_MS = 20000;
  var JITTER = 0.25;
  var IDLE_MS = 60000;
  var GAP_MS = 30 * 60 * 1000;
  var MAX_BATCH = 60;
  var MAX_SESSION = 200;
  var MAX_QUEUE_CHARS = 24000;
  var VAL_CHARS = 64;
  var MAX_KEYS = 8;

  var K_DID = 'gt_did';
  var K_SID = 'gt_sid';
  var K_SEEN = 'gt_seen';
  var K_OWN = 'gt_own';
  var K_Q = 'gt_q';
  var K_LAST = 'gt_last';
  var K_N = 'gt_n';

  /*@3.GATJ.2*/
  var CATALOG = {
    s_start: 1, p_view: 1, p_leave: 1,
    nav_click: 1, search: 1, lang_switch: 1, theme_switch: 1,
    sem_edit: 1, sem_rollover: 1,
    sched_print: 1, sched_edit: 1,
    gpa_forecast: 1,
    sect_search: 1, sect_watch: 1, sect_add: 1,
    ics_link: 1, notif_enable: 1, notif_open: 1,
    rate_course: 1, rate_faculty: 1,
    quiz_start: 1, quiz_submit: 1,
    card_flip: 1,
    ai_open: 1, ai_answer: 1, ai_followup: 1, ai_explain_feedback: 1,
    lab_open: 1, lab_run: 1, lab_error: 1,
    js_error: 1, perf: 1, api_fail: 1, rage_click: 1,
    dropped: 1, queue_replay: 1
  };

  /*@3.GATJ.3*/
  var BOT_RE = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|gtmetrix|ahrefs|semrush|facebookexternalhit|whatsapp|telegram|preview|monitor|curl|wget|python-requests/i;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }

  function rid() {
    var a = new Uint8Array(16);
    try { crypto.getRandomValues(a); }
    catch (e) { for (var i = 0; i < 16; i++) a[i] = (Math.random() * 256) | 0; }
    var s = '';
    for (var j = 0; j < 16; j++) s += (a[j] + 0x100).toString(16).slice(1);
    return s;
  }

  /*@3.GATJ.4*/
  function endpoint() {
    var E = window.GardenEndpoints;
    return (E && typeof E.telemetry === 'string') ? E.telemetry : null;
  }

  /*@3.GATJ.5*/
  function enabled() {
    var F = window.GardenFlags;
    if (F && typeof F.get === 'function' && F.get('telemetry.enabled') === false) return false;
    return true;
  }

  /*@3.GATJ.6*/
  if (navigator.webdriver) return;
  if (BOT_RE.test(navigator.userAgent || '')) return;
  if (document.visibilityState === 'prerender') return;

  var own = ls(K_OWN) === '1' ? 1 : 0;
  /*@3.GATJ.7*/
  try {
    var tag = new URLSearchParams(location.search).get('__gt');
    if (tag === 'own') { lsSet(K_OWN, '1'); own = 1; }
    else if (tag === 'off') { lsDel(K_OWN); own = 0; }
  } catch (e) { }

  var did = ls(K_DID);
  if (!did || did.length !== 32) { did = rid(); lsSet(K_DID, did); }

  /*@3.GATJ.8*/
  var now = Date.now();
  var seen = Number(ls(K_SEEN)) || 0;
  var sid = ls(K_SID);
  var fresh = false;
  if (!sid || !seen || (now - seen) > GAP_MS) { sid = rid(); fresh = true; lsSet(K_N, '0'); }
  lsSet(K_SID, sid);
  lsSet(K_SEEN, String(now));

  var sent = Number(ls(K_N)) || 0;


  /*@3.GATJ.9*/
  function cleanPath() {
    var p = location.pathname || '/';
    return p.length > 160 ? p.slice(0, 160) : p;
  }

  function platform() {
    var u = navigator.userAgent || '';
    if (/android/i.test(u)) return 'android';
    if (/iphone|ipad|ipod/i.test(u)) return 'ios';
    if (/windows/i.test(u)) return 'win';
    if (/mac os/i.test(u)) return 'mac';
    if (/linux/i.test(u)) return 'linux';
    return 'other';
  }

  function refHost() {
    try {
      if (!document.referrer) return '';
      var h = new URL(document.referrer).hostname;
      return h === location.hostname ? '' : h.slice(0, 60);
    } catch (e) { return ''; }
  }

  function utm() {
    var o = {};
    try {
      var q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        var v = q.get(k);
        if (v) o[k.slice(4, 5) + ''] = String(v).slice(0, 40);
      });
    } catch (e) { }
    return o;
  }

  function head() {
    var h = document.documentElement;
    var d = {
      pf: platform(),
      vw: window.innerWidth || 0,
      vh: window.innerHeight || 0,
      dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      lg: h.getAttribute('lang') || '',
      th: h.getAttribute('data-theme') || '',
      pwa: (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? 1 : 0
    };
    try { d.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
    return d;
  }


  var q = [];
  var dropped = 0;
  var dead = false;

  /*@3.GATJ.10*/
  function clean(p) {
    var o = {}, n = 0;
    if (!p || typeof p !== 'object') return o;
    for (var k in p) {
      if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
      if (n >= MAX_KEYS) break;
      var v = p[k];
      if (v === null || v === undefined) continue;
      if (typeof v === 'number') { o[k] = isFinite(v) ? Math.round(v * 1000) / 1000 : 0; n++; }
      else if (typeof v === 'boolean') { o[k] = v ? 1 : 0; n++; }
      /*@3.GATJ.25*/
      else if (Array.isArray(v)) {
        var a = [], lim = Math.min(v.length, 60);
        for (var i = 0; i < lim; i++) a.push(typeof v[i] === 'number' ? v[i] : 0);
        o[k] = a; n++;
      }
      else { o[k] = String(v).slice(0, VAL_CHARS); n++; }
    }
    return o;
  }

  /*@3.GATJ.21*/
  var GA_ID = 'G-HGTK36LR0M';
  var LOCAL = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(location.hostname);

  function gaBoot() {
    if (LOCAL || typeof window.gtag === 'function') return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    (document.head || document.documentElement).appendChild(g);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  /*@3.GATJ.22*/
  var MIRROR = {
    quiz_submit: 1, sect_search: 1,
    ai_open: 1, ai_answer: 1, ai_explain_feedback: 1,
    rate_course: 1, rate_faculty: 1,
    sect_watch: 1, ics_link: 1, notif_enable: 1,
    sched_print: 1, lab_open: 1
  };

  /*@3.GATJ.26*/
  var GA_MAP = {
    quiz_submit: { s: 's', k: 'quiz_kind', sc: 'score', t: 'q_total', pct: 'score_pct' },
    sect_search: { len: 'query_len' },
    ai_open: { s: 's', m: 'm', ctype: 'ctype', intent: 'intent' },
    ai_answer: { ms: 'ai_ms', ch: 'ai_chars', err: 'ai_error' },
    /*@3.GATJ.27*/
    ai_explain_feedback: {
      vote: 'vote', s: 's', m: 'm',
      intent: 'intent', turns: 'turns', ctype: 'ctype'
    },
    rate_course: { s: 's', has_grade: 'has_grade' },
    rate_faculty: {},
    sect_watch: { kind: 'watch_kind', off: 'watch_off' },
    ics_link: {},
    notif_enable: {},
    sched_print: { ok: 'print_ok', why: 'fail_why' },
    lab_open: { id: 'lab_id', why: 'entry_why' }
  };

  function mirror(name, p) {
    if (LOCAL || !MIRROR[name] || typeof window.gtag !== 'function') return;
    var map = GA_MAP[name] || {}, out = {};
    for (var k in p) {
      if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
      if (!map[k] || Array.isArray(p[k])) continue;
      out[map[k]] = p[k];
    }
    try { window.gtag('event', name, out); } catch (e) { }
  }

  function ev(name, params, ts) {
    if (dead || !CATALOG[name] || !enabled()) return;
    if (sent >= MAX_SESSION) { dropped++; return; }
    if (q.length >= MAX_BATCH) { flush(false); }
    var p = clean(params);
    q.push({ n: name, t: ts || Date.now(), p: p });
    mirror(name, p);
    sent++;
    lsSet(K_N, String(sent));
    lsSet(K_SEEN, String(Date.now()));
  }

  function envelope(list) {
    return { v: V, did: did, sid: sid, own: own, at: Date.now(), d: head(), e: list };
  }

  /*@3.GATJ.11*/
  function stash(body) {
    var prev = ls(K_Q) || '';
    var next = prev ? prev + '\n' + body : body;
    if (next.length > MAX_QUEUE_CHARS) next = body.slice(0, MAX_QUEUE_CHARS);
    lsSet(K_Q, next);
  }

  /*@3.GATJ.12*/
  function post(body, beacon) {
    var url = endpoint();
    if (!url) { lsSet(K_LAST, body.slice(0, MAX_QUEUE_CHARS)); return true; }
    var blob;
    try { blob = new Blob([body], { type: 'text/plain;charset=UTF-8' }); } catch (e) { blob = body; }
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(url, blob)) return true; } catch (e) { }
    }
    try {
      fetch(url, { method: 'POST', body: blob, keepalive: true, mode: 'cors', credentials: 'omit' })
        .catch(function () { stash(body); });
      return true;
    } catch (e) { return false; }
  }

  function flush(beacon) {
    if (dead || !q.length) return;
    if (dropped) { q.push({ n: 'dropped', t: Date.now(), p: { c: dropped } }); dropped = 0; }
    var list = q; q = [];
    var body;
    try { body = JSON.stringify(envelope(list)); } catch (e) { return; }
    if (!post(body, !!beacon)) stash(body);
  }

  /*@3.GATJ.13*/
  function replay() {
    var pend = ls(K_Q);
    if (!pend) return;
    lsDel(K_Q);
    var lines = pend.split('\n');
    for (var i = 0; i < lines.length && i < 4; i++) {
      if (lines[i]) post(lines[i], false);
    }
    ev('queue_replay', { c: lines.length });
  }


  var attn = 0;
  var lastAct = Date.now();
  var maxScroll = 0;

  /*@3.GATJ.14*/
  function tick() {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastAct > IDLE_MS) return;
    attn += 1000;
  }

  function act() { lastAct = Date.now(); }

  function scrollDepth() {
    var doc = document.documentElement;
    var h = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
    if (!h) return 0;
    var d = Math.round(((window.scrollY || doc.scrollTop || 0) + window.innerHeight) / h * 100);
    return Math.max(0, Math.min(100, d));
  }


  var perf = {};
  var perfSent = false;

  var PERF_MAX_MS = 60000;

  /*@3.GATJ.38*/
  function clock() {
    return (typeof performance !== 'undefined' && performance &&
            typeof performance.now === 'function') ? performance.now() : 0;
  }

  /*@3.GATJ.32*/
  var firstHidden = (document.visibilityState === 'hidden') ? 0 : Infinity;
  (function () {
    function mark() {
      if (firstHidden === Infinity && document.visibilityState === 'hidden') {
        firstHidden = clock();
      }
    }
    document.addEventListener('visibilitychange', mark, true);
    window.addEventListener('pagehide', mark, true);
  })();

  function watchPerf() {
    if (typeof PerformanceObserver !== 'function') return;
    try {
      new PerformanceObserver(function (l) {
        var e = l.getEntries();
        /*@3.GATJ.33*/
        for (var i = e.length - 1; i >= 0; i--) {
          if (e[i].startTime < firstHidden && e[i].startTime <= PERF_MAX_MS) {
            perf.lcp = Math.round(e[i].startTime);
            break;
          }
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) { }
    /*@3.GATJ.34*/
    try {
      var sum = 0, first = 0, last = 0;
      new PerformanceObserver(function (l) {
        l.getEntries().forEach(function (x) {
          if (x.hadRecentInput) return;
          if (sum && x.startTime - first < 5000 && x.startTime - last < 1000) {
            sum += x.value;
          } else {
            sum = x.value; first = x.startTime;
          }
          last = x.startTime;
          var v = Math.round(sum * 1000);
          if (!perf.cls || v > perf.cls) perf.cls = v;
        });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) { }
    /*@3.GATJ.15*/
    try {
      new PerformanceObserver(function (l) {
        l.getEntries().forEach(function (x) {
          if (!perf.inp || x.duration > perf.inp) perf.inp = Math.round(x.duration);
        });
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch (e) { }
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      /*@3.GATJ.37*/
      if (nav && nav.responseStart > 0 && nav.responseStart <= PERF_MAX_MS) {
        perf.ttfb = Math.round(nav.responseStart);
      }
    } catch (e) { }
  }

  /*@3.GATJ.16*/
  function shortErr(m) {
    return String(m || '').replace(/https?:\/\/\S+/g, '·').slice(0, 120);
  }

  /*@3.GATJ.28*/
  function frameOf(stack) {
    var lines = String(stack || '').split('\n');
    for (var i = 0; i < lines.length && i < 6; i++) {
      var m = /([^\/\s()]+\.js)[^:]*:(\d+):\d+/.exec(lines[i]);
      if (m) return { f: m[1], l: Number(m[2]) || 0 };
    }
    return null;
  }

  /*@3.GATJ.29*/
  function assetName(el) {
    var u = el && (el.src || el.href);
    if (!u) return '';
    u = String(u).split('?')[0].split('#')[0];
    var host = '', path = u;
    var m = /^https?:\/\/([^\/]+)(\/.*)?$/.exec(u);
    if (m) { host = m[1]; path = m[2] || ''; }
    var leaf = path.split('/').filter(Boolean).pop() || host;
    return host && host !== location.host ? host + '/' + leaf : leaf;
  }

  function watchErrors() {
    window.addEventListener('error', function (e) {
      var m = e && e.message;
      if (!m || /^script error/i.test(m)) return;
      ev('js_error', {
        m: shortErr(m),
        f: shortErr((e.filename || '').split('/').pop()),
        l: e.lineno || 0
      });
    });
    /*@3.GATJ.30*/
    window.addEventListener('error', function (e) {
      var el = e && e.target;
      if (!el || el === window || e.message) return;
      var tag = el.tagName;
      if (tag !== 'SCRIPT' && tag !== 'LINK' && tag !== 'IMG') return;
      var n = assetName(el);
      if (!n) return;
      ev('js_error', { m: 'asset load failed: ' + n.slice(0, 90), f: tag.toLowerCase(), l: 0 });
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      /*@3.GATJ.31*/
      var at = frameOf(r && r.stack);
      ev('js_error', {
        m: shortErr(r && (r.message || r)),
        f: at ? at.f : 'promise',
        l: at ? at.l : 0
      });
    });
  }

  /*@3.GATJ.17*/
  var clicks = [];
  function watchRage(e) {
    var t = Date.now();
    clicks.push({ t: t, x: e.clientX, y: e.clientY });
    while (clicks.length && t - clicks[0].t > 900) clicks.shift();
    if (clicks.length < 4) return;
    var a = clicks[0], far = false;
    for (var i = 1; i < clicks.length; i++) {
      if (Math.abs(clicks[i].x - a.x) > 45 || Math.abs(clicks[i].y - a.y) > 45) { far = true; break; }
    }
    if (far) return;
    clicks = [];
    var el = e.target && e.target.closest ? e.target.closest('button,a,[role=button],input') : null;
    ev('rage_click', { c: 4, el: el ? (el.id || el.tagName.toLowerCase()) : 'page' });
  }


  function watchNav() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(href)) return;
      var to;
      try { to = new URL(a.href); } catch (err) { return; }
      ev('nav_click', {
        to: to.hostname === location.hostname ? to.pathname.slice(0, 120) : to.hostname.slice(0, 60),
        ext: to.hostname === location.hostname ? 0 : 1
      });
    }, true);
  }


  var timer = null, flusher = null;

  /*@3.GATJ.18*/
  function schedule() {
    clearTimeout(flusher);
    var d = FLUSH_MS * (1 + (Math.random() * 2 - 1) * JITTER);
    flusher = setTimeout(function () { flush(false); schedule(); }, d);
  }

  /*@3.GATJ.19*/
  function stop() {
    dead = true;
    clearInterval(timer); clearTimeout(flusher);
    q = [];
    lsDel(K_Q); lsDel(K_LAST);
  }

  function leave() {
    ev('p_leave', { a: Math.round(attn / 1000), sd: Math.max(maxScroll, scrollDepth()) });
    /*@3.GATJ.35*/
    if (!perfSent && (perf.lcp || perf.inp || perf.cls || perf.ttfb)) {
      perfSent = true;
      /*@3.GATJ.36*/
      perf.pv = 2;
      if (firstHidden === 0) perf.bg = 1;
      ev('perf', perf);
    }
    flush(true);
  }

  function boot() {
    if (!enabled()) return;

    gaBoot();
    /*@3.GATJ.23*/
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('set', 'user_properties', { traffic_type: own ? 'internal' : 'student' });
      } catch (e) { }
    }

    watchPerf();
    watchErrors();
    watchNav();

    if (fresh) ev('s_start', Object.assign({ r: refHost() }, utm()));
    ev('p_view', {
      u: cleanPath(),
      s: document.documentElement.getAttribute('data-subject') || '',
      m: document.documentElement.getAttribute('data-module') || ''
    });

    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (n) {
      window.addEventListener(n, act, { passive: true, capture: true });
    });
    window.addEventListener('scroll', function () {
      act();
      var d = scrollDepth();
      if (d > maxScroll) maxScroll = d;
    }, { passive: true });
    window.addEventListener('click', watchRage, true);

    timer = setInterval(tick, 1000);
    schedule();

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') leave(); else act();
    });
    window.addEventListener('pagehide', leave);

    /*@3.GATJ.24*/
    var pending = window.__gtq || [];
    window.GardenEv = ev;
    window.__gtq = null;
    for (var i = 0; i < pending.length; i++) ev(pending[i][0], pending[i][1], pending[i][2]);

    replay();

    var F = window.GardenFlags;
    if (F && typeof F.on === 'function') {
      F.on(function (all, changed) {
        if (changed.indexOf('telemetry.enabled') >= 0 && all['telemetry.enabled'] === false) stop();
      });
    }
  }

  window.GardenTelemetry = {
    ev: ev,
    flush: function () { flush(false); },
    names: function () { return Object.keys(CATALOG); },
    who: function () { return { did: did, sid: sid, own: own, attn: Math.round(attn / 1000) }; }
  };

  /*@3.GATJ.20*/
  if (window.GardenEndpoints) boot();
  else {
    var s = document.currentScript;
    var root = (s && s.src) ? s.src.replace(/shared\/garden-telemetry\.js(\?.*)?$/, '') : '';
    var el = document.createElement('script');
    el.src = root + 'shared/endpoints.js';
    el.onload = boot;
    el.onerror = boot;
    (document.head || document.documentElement).appendChild(el);
  }
})();
