/*@3.SECJ.1*/
(function () {
  'use strict';

  var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DAYS = { saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
               tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس',
               friday: 'الجمعة' };
  var DAYS_EN = { saturday: 'Sat', sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
                  wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };

  /*@3.SECJ.3*/
  var PREP_RE = /^[A-Za-z]+0/;
  function isPrep(s) { return PREP_RE.test(s.c || ''); }
  /*@3.SECJ.4*/
  var PREP_CODE = /^[A-Z]+00\d$/;

  /*@3.SECJ.5*/
  var AR_RE = /[؀-ۿݐ-ݿ]/;
  function hasAr(s) { return AR_RE.test(String(s || '')); }

  /*@3.SECJ.6*/
  function isJunk(s) { return (s.s || '') === 'TEST'; }

  var PREF_KEY = 'sx_prefs';
  var state = {
    term: null, all: [], view: [], shown: 0, PAGE: 60,
    q: '', cities: [], subjects: [],
    gender: 'all', status: 'all', mode: 'all', sort: 'code', prep: 'off',
    mine: 'off', terms: null,
    /*@3.SECJ.7*/
    college: '', major: '', grp: 'off', days: 'all',
    /*@3.SECJ.8*/
    only: 'off',
    /*@3.SECJ.9*/
    dir: '',
    /*@3.SECJ.10*/
    fresh: 0, phase: ''
  };

  /*@3.SECJ.11*/
  function pool() {
    var on = state.prep === 'on';
    /*@3.SECJ.12*/
    var direct = crnSet((state.q || '').trim());
    return state.all.filter(function (s) {
      if (isJunk(s)) return false;
      if (direct) return true;
      return on ? isPrep(s) : !isPrep(s);
    });
  }

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }

  /*@3.SECJ.13*/
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  /*@3.SECJ.14*/
  var _dec = document.createElement('textarea');
  function unent(s) { _dec.innerHTML = String(s == null ? '' : s); return _dec.value; }

  /*@3.SECJ.15*/
  function hhmm(s) {
    if (!s || String(s).length < 3) return '';
    s = String(s);
    var h = parseInt(s.slice(0, s.length - 2), 10), m = s.slice(-2);
    var ap = h < 12 ? t('ص', 'AM') : t('م', 'PM');
    return (h % 12 || 12) + ':' + m + ' ' + ap;
  }
  function dayList(ds) {
    var map = isAr() ? DAYS : DAYS_EN;
    return (ds || []).map(function (d) { return map[d] || d; }).join('، ');
  }
  /*@3.SECJ.16*/
  function dayPat(s) {
    var d = {};
    /*@3.SECJ.17*/
    meetsOf(s, ['CLAS', 'VRTL']).forEach(function (m) {
      (m.days || []).forEach(function (x) { d[x] = 1; });
    });
    var has = function (x) { return !!d[x]; };
    if (has('thursday') && !has('sunday') && !has('monday') &&
        !has('tuesday') && !has('wednesday')) return 'thu';
    if (has('sunday') || has('tuesday')) {
      if (!has('monday') && !has('wednesday')) return 'sun_tue';
      return 'other';
    }
    if (has('monday') || has('wednesday')) return 'mon_wed';
    return Object.keys(d).length ? 'other' : '';
  }

  /*@3.SECJ.18*/
  function dt(s) {
    if (!s) return '';
    var p = String(s).split('/');
    return p.length === 3 ? p[1] + '/' + p[0] : s;
  }

  /*@3.SECJ.376*/
  var CITY_AR = window.GardenSXLink.CITY_AR;
  function campusOf(raw) { return window.GardenSXLink.campusOf(raw); }
  function campusLabel(raw) { return window.GardenSXLink.campusLabel(raw); }

  /*@3.SECJ.20*/
  function facNames(sec) {
    return (sec.f || []).map(function (p) { return (p && p.n) || p || ''; });
  }
  function meetsOf(sec, kinds) {
    return (sec.mg || []).filter(function (m) { return kinds.indexOf(m.type) >= 0; });
  }
  /*@3.SECJ.21*/
  function unlimited(max) { return !max || max >= 1000; }

  /*@3.SECJ.22*/
  function hours(v) {
    var n = parseFloat(v);
    if (!isFinite(n) || n <= 0) return '';
    var s = String(Math.round(n * 100) / 100);
    if (!isAr()) return s + ' cr';
    if (n === 1) return 'ساعة';
    if (n === 2) return 'ساعتان';
    return s + (n <= 10 ? ' ساعات' : ' ساعة');
  }

  /*@3.SECJ.23*/
  function setLbl(el, text) {
    if (!el) return;
    var tx = el.firstElementChild;
    if (!tx || tx.className !== 'sx-lbl-tx') {
      el.textContent = '';
      tx = document.createElement('span');
      tx.className = 'sx-lbl-tx';
      el.appendChild(tx);
    }
    if (tx.textContent !== text) tx.textContent = text;
  }

  /*@3.SECJ.24*/
  var MQ_WPM = 70, MQ_HOLD_START = 3.0, MQ_HOLD_END = 0.7;
  var MQ_V_MIN = 30, MQ_V_MAX = 85, MQ_PX_PER_WORD = 44;
  function syncLblMarquee() {
    var hosts = $$('.sx-ts-lbl, .sx-ms-lbl');
    hosts.forEach(function (h) {
      h.classList.remove('is-mq');
      h.style.removeProperty('--mq-x');
      h.style.removeProperty('--mq-dur');
    });
    if (!NARROW.matches) return;
    var list = [], maxOver = 0, px = 0, words = 0;
    hosts.forEach(function (h) {
      var tx = h.firstElementChild;
      if (!tx || !h.clientWidth) return;
      var over = tx.scrollWidth - h.clientWidth;
      if (over <= 2) return;
      var s = (tx.textContent || '').trim();
      var o = { h: h, over: over, w: tx.scrollWidth, words: s ? s.split(/\s+/).length : 1 };
      list.push(o);
      if (over > maxOver) maxOver = over;
      px += o.w; words += o.words;
    });
    if (!list.length) return;
    var pxPerWord = words ? (px / words) : MQ_PX_PER_WORD;
    var v = Math.max(MQ_V_MIN, Math.min(MQ_V_MAX, MQ_WPM / 60 * pxPerWord));
    var travel = maxOver / v;
    var dur = MQ_HOLD_START + travel + MQ_HOLD_END;
    /*@3.SECJ.25*/
    var st = document.getElementById('sx-mq-kf');
    if (!st) {
      st = document.createElement('style'); st.id = 'sx-mq-kf';
      document.head.appendChild(st);
    }
    var p1 = MQ_HOLD_START / dur * 100, p2 = (MQ_HOLD_START + travel) / dur * 100;
    var css = '@keyframes sxLblMq{0%,' + p1.toFixed(2) + '%{transform:translateX(0)}' +
              p2.toFixed(2) + '%,100%{transform:translateX(var(--mq-x,0))}}';
    if (st.textContent !== css) st.textContent = css;
    list.forEach(function (o) {
      var rtl = getComputedStyle(o.h).direction === 'rtl';
      o.h.style.setProperty('--mq-x', (rtl ? o.over : -o.over) + 'px');
      o.h.style.setProperty('--mq-dur', dur.toFixed(2) + 's');
      o.h.classList.add('is-mq');
    });
  }
  /*@3.SECJ.26*/
  function queueMarquee() {
    clearTimeout(queueMarquee._t);
    queueMarquee._t = setTimeout(function () {
      requestAnimationFrame(syncLblMarquee);
    }, 40);
  }

  function toast(msg, ms) {
    var el = $('#sx-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sx-toast'; el.className = 'sx-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () { el.classList.add('on'); });
    clearTimeout(toast._t);
    /*@3.SECJ.27*/
    toast._t = setTimeout(function () { el.classList.remove('on'); }, ms || 1600);
  }

  /*@3.SECJ.28*/
  function actionToast(msg, label, onAct, ms) {
    var el = $('#sx-atoast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sx-atoast'; el.className = 'sx-toast sx-atoast';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span></span><button type="button"></button>';
    $('span', el).textContent = msg;
    var b = $('button', el);
    b.textContent = label;
    clearTimeout(actionToast._t);
    function close() { el.classList.remove('on'); }
    b.onclick = function () { close(); if (onAct) onAct(); };
    requestAnimationFrame(function () { el.classList.add('on'); });
    actionToast._t = setTimeout(close, ms || 6000);
  }

  function askRemoveFromSchedule(crn) {
    actionToast(
      t('أُزيلت من المختارة — وما زالت في جدولك',
        'Removed from your picks — still in your schedule'),
      t('احذفها من الجدول', 'Remove from schedule'),
      function () {
        var n = schUnregister(crn);
        paintBasket();
        toast(n ? t('حُذفت من جدولك', 'Removed from your schedule')
                : t('لم يبقَ منها شيء', 'Nothing left to remove'));
      });
  }

  /*@3.SECJ.29*/
  function copyText(text, msg) {
    function ok() { toast(msg + ' ✓'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { fallback(text, ok); });
    } else { fallback(text, ok); }
  }
  function copy(text, btn) {
    function ok() {
      toast(t('نُسخ رقم الشعبة ✓', 'CRN copied ✓'));
      if (btn) { btn.classList.add('copied'); setTimeout(function () { btn.classList.remove('copied'); }, 1100); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { fallback(text, ok); });
    } else { fallback(text, ok); }
  }
  function fallback(text, ok) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); ok();
    } catch (e) { toast(t('تعذّر النسخ', 'Copy failed')); }
  }

  /*@3.SECJ.30*/
  function savePrefs() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({
        cities: state.cities, subjects: state.subjects, gender: state.gender,
        status: state.status, mode: state.mode, sort: state.sort,
        mine: state.mine, term: state.term,
        college: state.college, major: state.major, grp: state.grp, dir: state.dir,
        days: state.days
      }));
    } catch (e) { /*@3.SECJ.31*/ }
  }
  function loadPrefs() {
    try {
      var p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      if (Array.isArray(p.cities)) state.cities = p.cities;
      if (Array.isArray(p.subjects)) state.subjects = p.subjects;
      ['gender', 'status', 'mode', 'sort', 'mine', 'college', 'major', 'grp', 'dir', 'days'].forEach(function (k) {
        if (typeof p[k] === 'string') state[k] = p[k];
      });
      return p.term || null;
    } catch (e) { return null; }
  }

  /*@3.SECJ.32*/
  function loadTerm(term) {
    var grid = $('#sx-grid');
    grid.innerHTML = '<div class="sx-state"><i class="fa-solid fa-spinner fa-spin"></i>' +
      t('يُحمَّل الكتالوج…', 'Loading catalog…') + '</div>';
    return fetch(API + '/v1/catalog/' + term + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('catalog-' + r.status);
        return r.json();
      })
      .then(function (d) {
        state.term = term;
        state.all = d.sections || [];
        readFresh(term);
        GRAD = null;             /*@3.SECJ.33*/
        seedBasketFromSchedule();
        buildFilters();
        /*@3.SECJ.34*/
        if (profReady(loadProf()) && state.mine !== 'off') state.mine = 'on';
        paintMe();
        savePrefs();
        apply();
        /*@3.SECJ.35*/
        setTimeout(function () {
          try { schAnnounce(schReconcileRegistered()); } catch (e) {}
        }, 400);
      })
      .catch(function (e) {
        grid.innerHTML = '<div class="sx-state"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر تحميل الكتالوج', 'Could not load the catalog') +
          '<div style="font-size:.76rem;margin-top:.4rem">' + esc(e.message) + '</div></div>';
      });
  }

  /*@3.SECJ.36*/
  var OPTS = { city: [], subject: [] };

  function buildFilters() {
    var cityN = {}, subN = {};
    /*@3.SECJ.37*/
    pool().forEach(function (s) {
      var c = campusOf(s.cm).city;
      cityN[c] = (cityN[c] || 0) + 1;
      if (s.s) subN[s.s] = (subN[s.s] || 0) + 1;
    });
    OPTS.city = Object.keys(cityN).map(function (k) {
      return { v: k, ar: CITY_AR[k] || k, en: k, n: cityN[k] };
    }).sort(function (a, b) { return b.n - a.n; });
    OPTS.subject = Object.keys(subN).map(function (k) {
      return { v: k, ar: k, en: k, n: subN[k] };
    }).sort(function (a, b) { return a.v < b.v ? -1 : 1; });

    /*@3.SECJ.38*/
    state.cities   = state.cities.filter(function (v) { return cityN[v]; });
    state.subjects = state.subjects.filter(function (v) { return subN[v]; });

    ['city', 'subject'].forEach(paintMS);
    /*@3.SECJ.39*/
    paintPicks();
    queueMarquee();

    /*@3.SECJ.40*/
  }

  function selOf(key) { return key === 'city' ? state.cities : state.subjects; }

  /*@3.SECJ.41*/
  function msHost(key) { return $('#sx-ms-' + key); }

  /*@3.SECJ.42*/
  function markMS(key) { paintMSLabel(key); }

  function paintMSLabel(key) {
    var host = msHost(key);
    if (!host) return;
    if (window.GardenSelect) GardenSelect.sync(host);
    var gw = host.closest ? host.closest('.gs') : null;
    (gw || host).classList.toggle('is-filtering', selOf(key).length > 0);
  }

  function paintMS(key) {
    var host = msHost(key);
    if (!host) return;
    var sel = selOf(key), opts = OPTS[key], ar = isAr();
    host.innerHTML = opts.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (sel.indexOf(o.v) >= 0 ? ' selected' : '') +
        ' data-meta="' + o.n + '">' + esc(ar ? o.ar : o.en) + '</option>';
    }).join('');
    paintMSLabel(key);
  }

  /*@3.SECJ.43*/
  function modeOf(s) {
    var nC = meetsOf(s, ['CLAS']).length, nV = meetsOf(s, ['VRTL']).length;
    return nC && nV ? 'mix' : nC ? 'person' : 'remote';
  }

  /*@3.SECJ.44*/
  var CRN_SEP = /[\s,;\u060C\n\t]+/;
  var CRN_LIST = /^[0-9\s,;\u060C\n\t]+$/;
  function crnSet(q) {
    if (!q || !CRN_LIST.test(q)) return null;
    var parts = q.split(CRN_SEP).filter(function (x) { return /^\d{3,7}$/.test(x); });
    if (parts.length < 2) return null;          /*@3.SECJ.45*/
    var set = {};
    parts.forEach(function (x) { set[x] = 1; });
    return set;
  }

  function apply() {
    var q = normAr(state.q.trim());
    var qCrns = crnSet(state.q.trim());
    var cities = state.cities, subs = state.subjects;
    /*@3.SECJ.46*/
    var picked = null;
    if (state.only === 'on') {
      picked = {};
      basket().forEach(function (c) { picked[String(c)] = 1; });
    }
    state.view = (picked ? state.all : pool()).filter(function (s) {
      if (picked) return !!picked[String(s.crn)];      /*@3.SECJ.47*/
      if (!qCrns && !profFilter(s)) return false;
      var c = campusOf(s.cm);
      if (cities.length && cities.indexOf(c.city) < 0) return false;
      if (state.gender !== 'all' && c.g !== state.gender) return false;
      if (subs.length && subs.indexOf(s.s) < 0) return false;
      /*@3.SECJ.48*/
      if (state.major) { if (inProgram(state.major, s.c || '') === false) return false; }
      else if (state.college && !inCollege2(state.college, s.c || '')) return false;
      if (state.status === 'open' && !(s.a > 0)) return false;
      if (state.status === 'full' && s.a > 0) return false;
      if (state.status === 'gone' && !s.gone) return false;
      if (state.mode !== 'all' && modeOf(s) !== state.mode) return false;
      if (state.days !== 'all' && dayPat(s) !== state.days) return false;
      if (!q) return true;
      if (qCrns) return !!qCrns[String(s.crn)];
      return hayOf(s, c).indexOf(q) >= 0;
    });

    /*@3.SECJ.49*/
    var dir = sortDir() === 'asc' ? 1 : -1;
    if (state.sort === 'seats') {
      state.view = state.view.slice().sort(function (a, b) {
        return dir * ((a.a || 0) - (b.a || 0));
      });
    } else if (state.sort === 'full') {
      var pf = function (x) {
        if (unlimited(x.m)) return -1;
        return (x.m - Math.max(0, x.a || 0)) / x.m;
      };
      state.view = state.view.slice().sort(function (a, b) { return dir * (pf(a) - pf(b)); });
    } else if (state.sort === 'rating' && RATINGS) {
      /*@3.SECJ.50*/
      state.view = state.view.slice().sort(function (a, b) {
        var ra = rateRank(a), rb = rateRank(b);
        if (ra == null && rb == null) return 0;
        if (ra == null) return 1;
        if (rb == null) return -1;
        return dir * (ra - rb);
      });
    } else if (state.sort === 'code' && sortDir() === 'desc') {
      /*@3.SECJ.51*/
      state.view = state.view.slice().reverse();
    }

    finishApply();
  }

  function finishApply() {
    state.shown = 0;
    $('#sx-grid').innerHTML = '';
    render();
    paintCount();
    paintBasket();
    $('#sx-clear').hidden = !(state.cities.length || state.subjects.length ||
      state.gender !== 'all' || state.status !== 'all' || state.mode !== 'all' ||
      state.prep === 'on' || state.mine === 'on' || state.q ||
      state.college || state.major || state.days !== 'all' || state.only === 'on');
    savePrefs();
  }

  /*@3.SECJ.52*/

  /*@3.SECJ.53*/
  var CADENCE_S = { LIVE: 300, ARMED: 600, EMPTY: 1800, QUIET: 21600,
                    POST: 43200, ARCHIVE: 604800 };

  function readFresh(term) {
    var row = null;
    (state.terms || []).forEach(function (x) { if (x.term === term) row = x; });
    state.fresh = row && row.last_harvest ? (new Date(row.last_harvest).getTime() || 0) : 0;
    state.phase = (row && row.phase) || '';
  }

  /*@3.SECJ.54*/
  function arCount(n, one, two, few) {
    if (n === 1) return one;
    if (n === 2) return two;
    return (n >= 3 && n <= 10) ? (n + ' ' + few) : (n + ' ' + one);
  }
  /*@3.SECJ.55*/
  function cadenceWord() {
    var s = CADENCE_S[state.phase];
    if (!s) return '';
    if (s < 3600) {
      var m = Math.round(s / 60);
      return t('تُحدَّث كل ' + arCount(m, 'دقيقة', 'دقيقتين', 'دقائق'),
               'refreshes every ' + m + ' min');
    }
    if (s < 86400) {
      var h = Math.round(s / 3600);
      return t('تُحدَّث كل ' + arCount(h, 'ساعة', 'ساعتين', 'ساعات'),
               'refreshes every ' + h + (h === 1 ? ' hour' : ' hours'));
    }
    /*@3.SECJ.56*/
    var dd = Math.round(s / 86400);
    return t('تُحدَّث كل ' + (dd === 7 ? 'أسبوع' : arCount(dd, 'يوم', 'يومين', 'أيام')),
             'refreshes every ' + (dd === 7 ? 'week' : dd + ' days'));
  }

  /*@3.SECJ.57*/
  function stampWord(ms) {
    try {
      var d = new Date(ms), lc = isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
      return d.toLocaleTimeString(lc, { hour: 'numeric', minute: '2-digit' }) + ' · ' +
             d.toLocaleDateString(lc, { day: 'numeric', month: 'long' });
    } catch (e) { return ''; }
  }

  /*@3.SECJ.58*/
  function freshHtml() {
    if (!state.fresh) return '';
    var per = CADENCE_S[state.phase] || 0;
    var old = per ? (Date.now() - state.fresh) > per * 3000 : false;
    var cad = cadenceWord();
    return '<span class="sx-fresh' + (old ? ' is-old' : '') + '" title="' +
      esc(t('آخرُ قراءةٍ من بانر', 'Last read from Banner')) + '">' +
      '<i class="fa-solid fa-rotate" aria-hidden="true"></i>' +
      esc(t('حُدِّثت البيانات ', 'updated ') + stampWord(state.fresh) +
          (cad ? ' — ' + cad : '')) + '</span>';
  }

  function paintCount() {
    var open = 0, full = 0, gone = 0, taken = 0;
    state.view.forEach(function (s) {
      if (s.gone) gone++; else if (s.a > 0) open++; else full++;
      /*@3.SECJ.59*/
      if (unlimited(s.m)) return;
      taken += Math.max(0, s.m - Math.max(0, s.a == null ? 0 : s.a));
    });
    $('#sx-count').innerHTML =
      (state.prep === 'on'
        ? '<span class="sx-note"><i class="fa-solid fa-graduation-cap"></i>' +
          t('مواد السنة التحضيرية وحدها — شعبُها تُسجَّل تلقائياً',
            'Preparatory-year courses only — these are auto-enrolled') + '</span>'
        : '') +
      '<span><b>' + state.view.length + '</b> ' + t('شعبة', 'sections') + '</span>' +
      '<span style="color:#10b981"><b style="color:inherit">' + open + '</b> ' + t('بها مقاعد', 'open') + '</span>' +
      '<span style="color:#ef4444"><b style="color:inherit">' + full + '</b> ' + t('ممتلئة', 'full') + '</span>' +
      (gone ? '<span><b>' + gone + '</b> ' + t('غير معروضة', 'not listed') + '</span>' : '') +
      /*@3.SECJ.60*/
      '<span class="sx-total"><b>' + fmt(taken) + '</b> ' +
        t('مقعداً مسجَّلاً', 'seats taken') + '</span>' +
      freshHtml();
  }

  /*@3.SECJ.61*/
  function fmt(n) {
    try { return Number(n).toLocaleString('en-US'); }
    catch (e) { return String(n); }
  }

  function render() {
    var grid = $('#sx-grid');
    if (!state.view.length) {
      /*@3.SECJ.62*/
      var code = String(state.q || '').toUpperCase().replace(/\s+/g, '');
      var isCode = /^[A-Z]{2,6}[0-9]{1,4}[A-Z]?$/.test(code);
      var on = isCode && GW() && GW().has('course', state.term, code);
      grid.innerHTML = '<div class="sx-state"><i class="fa-solid fa-magnifying-glass"></i>' +
        t('لا شعب تطابق البحث', 'No sections match') +
        (isCode && GW() && GW().ready()
          ? '<div class="sx-empty-w">' +
              '<div>' + esc(t('لم تنزل شعبةٌ لـ' + code + ' في هذا الفصل بعد.',
                              'No section for ' + code + ' this term yet.')) + '</div>' +
              '<button class="sx-mini' + (on ? ' on' : '') + '" data-cwatch="' + esc(code) + '">' +
                '<i class="fa-solid fa-bell"></i>' +
                (on ? t('أنت تتابعها — إلغاء', 'Watching — stop')
                    : t('نبّهني إذا نزلت شعبة', 'Alert me when one appears')) +
              '</button></div>'
          : '') +
        '</div>';
      $('#sx-more').hidden = true;
      return;
    }
    if (state.grp === 'on') return renderGrouped(grid);
    var slice = state.view.slice(state.shown, state.shown + state.PAGE);
    grid.insertAdjacentHTML('beforeend', slice.map(card).join(''));
    state.shown += slice.length;
    $('#sx-more').hidden = state.shown >= state.view.length;
    $('#sx-more').textContent = t('عرض المزيد (' + (state.view.length - state.shown) + ')',
                                  'Show more (' + (state.view.length - state.shown) + ')');
    fillChips();
  }

  /*@3.SECJ.379*/
  function fillChips() {
    var V = window.GardenCourseView;
    if (!V) return;
    var slots = [].slice.call(document.querySelectorAll('.cv-slot[data-cv-code]'));
    if (!slots.length) return;
    var codes = {};
    slots.forEach(function (el) { codes[el.getAttribute('data-cv-code')] = 1; });
    V.brief(Object.keys(codes)).then(function (map) {
      slots.forEach(function (el) {
        /*@3.SECJ.380*/
        if (el.getAttribute('data-cv-done')) return;
        el.setAttribute('data-cv-done', '1');
        el.innerHTML = V.chip(el.getAttribute('data-cv-code'), map[el.getAttribute('data-cv-code')]);
      });
    });
  }

  /*@3.SECJ.63*/
  var openCourses = {};
  /*@3.SECJ.64*/
  var grpReturn = null;
  function closeGroup() {
    var op = $('.sx-grp.on');
    if (!op) return;
    op.classList.remove('on');
    openCourses = {};
    $('#sx-grid').classList.remove('has-open');
    var y = grpReturn; grpReturn = null;
    if (y == null) return;
    requestAnimationFrame(function () {
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  }
  function renderGrouped(grid) {
    var by = {}, order = [];
    state.view.forEach(function (s) {
      var k = s.c || '—';
      if (!by[k]) { by[k] = []; order.push(k); }
      by[k].push(s);
    });
    if (state.sort === 'code') order.sort();

    grid.innerHTML = order.map(function (code) {
      var list = by[code], open = 0, seats = 0, noCap = false, profs = {};
      list.forEach(function (s) {
        if (s.a > 0) open++;
        if (unlimited(s.m)) noCap = true; else seats += Math.max(0, s.a || 0);
        facNames(s).forEach(function (n) { if (n) profs[n] = 1; });
      });
      var np = Object.keys(profs).length;
      var isOn = !!openCourses[code];
      /*@3.SECJ.65*/
      var accent = !open ? '#ef4444' : (open <= 2 ? '#f59e0b' : '#10b981');
      return '<div class="sx-grp' + (isOn ? ' on' : '') + '" data-code="' + esc(code) +
        '" style="--gc:' + accent + '">' +
        '<button class="sx-grp-head" type="button">' +
          '<span class="sx-grp-top">' +
            '<span class="sx-grp-code">' + esc(code) + '</span>' +
            '<i class="fa-solid fa-chevron-down sx-grp-car"></i>' +
            '<i class="fa-solid fa-xmark sx-grp-x" title="' + t('إغلاق', 'Close') + '"></i>' +
          '</span>' +
          '<span class="sx-grp-t">' + esc(unent(list[0].t || '')) + '</span>' +
          '<span class="sx-grp-meta">' +
            '<span class="sx-grp-n"><b>' + list.length + '</b> ' + t('شعبة', 'sections') + '</span>' +
            '<span class="sx-grp-n' + (open ? ' ok' : ' no') + '"><b>' + open + '</b> ' +
              t('متاحة', 'open') + '</span>' +
            '<span class="sx-grp-n">' + (noCap ? t('بلا حدّ', 'unlimited')
              : '<b>' + seats + '</b> ' + t('مقعد', 'seats')) + '</span>' +
            (np ? '<span class="sx-grp-n"><b>' + np + '</b> ' + t('أستاذ', 'faculty') + '</span>' : '') +
            '<span class="cv-slot" data-cv-code="' + esc(code) + '"></span>' +
          '</span>' +
        '</button>' +
        '<div class="sx-grp-body">' + (isOn ? list.map(card).join('') : '') + '</div>' +
      '</div>';
    }).join('');
    $('#sx-more').hidden = true;
    state.shown = state.view.length;
    fillChips();
  }

  /*@3.SECJ.66*/
  function basket() {
    var p = loadProf();
    var b = p.picks;
    if (!b || b.term !== state.term) return [];
    return Array.isArray(b.crns) ? b.crns : [];
  }
  function inBasket(crn) { return basket().indexOf(String(crn)) >= 0; }

  /*@3.SECJ.67*/
  function seedBasketFromSchedule() {
    var reg = schRegistered();
    if (!Object.keys(reg).length) return;
    var here = {};
    state.all.forEach(function (s) { here[String(s.crn)] = 1; });
    var p = loadProf();
    var b = (p.picks && p.picks.term === state.term && Array.isArray(p.picks.crns))
      ? p.picks.crns.slice() : [];
    var add = 0;
    Object.keys(reg).forEach(function (c) {
      if (!here[c] || b.indexOf(c) >= 0) return;
      b.push(c); add++;
    });
    if (add) saveProf({ picks: { term: state.term, crns: b } });
  }
  function basketToggle(crn) {
    crn = String(crn);
    var list = basket(), i = list.indexOf(crn);
    /*@3.SECJ.68*/
    if (i < 0) {
      var byC = {};
      state.all.forEach(function (x) { byC[String(x.crn)] = x; });
      var me = byC[crn];
      var twin = me && list.filter(function (c) {
        return byC[c] && byC[c].c === me.c;
      })[0];
      if (twin) {
        actionToast(
          t('لديك شعبةٌ أخرى لـ' + me.c + ' (' + twin + ')',
            'You already have another ' + me.c + ' section (' + twin + ')'),
          t('استبدِلها بهذه', 'Replace it with this'),
          function () { basketToggle(twin); });
      } else {
        /*@3.SECJ.69*/
        var cls = findClashes(crn, list);
        if (cls.length) {
          var names = cls.map(function (x) { return x.other.c + ' (' + x.other.crn + ')'; });
          var cl = cls[0];
          actionToast(
            t('تعارضٌ مع ' + names.join(' و') + ' — ' +
                DAY_AR[cl.day] + ' ' + hhmmMin(cl.from) + '–' + hhmmMin(cl.to),
              'Clashes with ' + names.join(' & ') + ' — ' +
                DAY_EN[cl.day] + ' ' + hhmmMin(cl.from) + '–' + hhmmMin(cl.to)),
            cls.length > 1 ? t('أزِلها كلَّها', 'Remove them all')
                           : t('أزِل ' + cl.other.c, 'Remove ' + cl.other.c),
            function () {
              cls.forEach(function (x) { basketToggle(String(x.other.crn)); });
            }, 9000);
        }
      }
      /*@3.SECJ.70*/
      var meF = byC[crn];
      if (meF && !unlimited(meF.m) && !((meF.a || 0) > 0)) {
        toast(t('هذه الشعبة ممتلئة — ستحتاج رفعَ تذكرةٍ لمساعد التسجيل في ' +
                'الخدمات الذاتية لتسجيلها.',
                'This section is full — you will need to raise a ticket with the ' +
                'registration assistant in Self Service.'), 7000);
      }
    }
    /*@3.SECJ.71*/
    if (i >= 0 && schHas(crn)) {
      askRemoveFromSchedule(crn);
    }
    if (i >= 0) list.splice(i, 1); else list.push(crn);
    saveProf({ picks: { term: state.term, crns: list } });
    paintBasket();
    /*@3.SECJ.72*/
    $$('.sx-pick[data-pick="' + crn + '"]').forEach(function (b) {
      var on = list.indexOf(crn) >= 0;
      b.classList.toggle('on', on);
      b.innerHTML = '<i class="fa-solid fa-' + (on ? 'check' : 'plus') + '"></i>';
    });
  }
  function paintBasket() {
    var host = $('#sx-basket');
    if (!host) return;
    var list = basket();
    if (!list.length) { host.hidden = true; host.innerHTML = ''; return; }
    var byCrn = {};
    state.all.forEach(function (s) { byCrn[s.crn] = s; });
    var reg = schRegistered();
    var nReg = list.filter(function (c) { return reg[String(c)]; }).length;
    /*@3.SECJ.73*/
    var dup = {};
    list.forEach(function (c) { var x = byCrn[c]; if (x && x.c) dup[x.c] = (dup[x.c] || 0) + 1; });
    var dupCourses = Object.keys(dup).filter(function (k) { return dup[k] > 1; });
    /*@3.SECJ.74*/
    var cc = clashClusters(list), clash = cc.crns;
    /*@3.SECJ.75*/
    var fullList = list.filter(function (c) {
      var s = byCrn[c];
      return s && !unlimited(s.m) && !((s.a || 0) > 0);
    });
    var hours = 0, seen = {};
    list.forEach(function (c) {
      var s = byCrn[c];
      if (s && !seen[s.c]) { seen[s.c] = 1; hours += parseFloat(s.ch) || 0; }
    });
    host.hidden = false;
    host.innerHTML =
      '<div class="sx-bk-head">' +
        '<i class="fa-solid fa-clipboard-list"></i>' +
        '<b>' + t('الشعب المختارة', 'Selected sections') + '</b>' +
        '<span class="sx-bk-n">' + list.length + ' ' + t('شعبة', 'sections') +
          (hours ? ' · ' + hours + t(' ساعة', ' cr') : '') +
          (nReg ? ' · ' + t(nReg + ' في جدولك', nReg + ' in your schedule') : '') + '</span>' +
        /*@3.SECJ.76*/
        '<button class="sx-bk-go" id="sx-bk-add">' +
          '<i class="fa-solid fa-calendar-plus"></i>' +
          t('أضِف إلى جدولي', 'Add to my schedule') + '</button>' +
        '<button class="sx-bk-copy" id="sx-bk-copy">' +
          '<i class="fa-regular fa-copy"></i>' + t('نسخ الأرقام', 'Copy CRNs') + '</button>' +
        /*@3.SECJ.77*/
        '<button class="sx-bk-copy' + (state.only === 'on' ? ' on' : '') + '" id="sx-bk-only" title="' +
          t('اعرض الشعب المختارة وحدَها', 'Show only your picked sections') + '">' +
          '<i class="fa-solid fa-filter"></i>' +
          (state.only === 'on' ? t('الكل', 'All') : t('المختارة', 'Picked')) +
        '</button>' +
        /*@3.SECJ.78*/
        '<button class="sx-bk-copy is-danger" id="sx-bk-clear">' +
          '<i class="fa-solid fa-eraser"></i>' + t('امسح', 'Clear') + '</button>' +
      '</div>' +
      (dupCourses.length
        ? '<div class="sx-bk-warn"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('اخترتَ أكثرَ من شعبةٍ للمادة نفسِها: ', 'More than one section of the same course: ') +
          '<b>' + esc(dupCourses.join('، ')) + '</b>' +
          t(' — لا يمكن تسجيلُهما معاً في البانر.',
            ' — Banner will not let you register both.') + '</div>'
        : '') +
      cc.groups.map(function (g) {
        return '<div class="sx-bk-warn is-clash"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعارضٌ في الوقت — ', 'Time clash — ') +
          esc((isAr() ? DAY_AR : DAY_EN)[g.day] + ' ' + hhmmMin(g.from) + '–' + hhmmMin(g.to)) + ': ' +
          '<b>' + esc(g.codes.join('، ')) + '</b>' +
          t(' — ' + g.codes.length + ' محاضراتٍ في الوقت نفسِه.',
            ' — ' + g.codes.length + ' lectures at the same time.') + '</div>';
      }).join('') +
      (fullList.length
        ? '<div class="sx-bk-warn is-full"><i class="fa-solid fa-ticket"></i>' +
          '<b>' + esc(fullList.map(function (c) {
            return (byCrn[c] ? byCrn[c].c + ' ' : '') + c; }).join('، ')) + '</b>' +
          t(' — ممتلئة: لن يقبلها التسجيلُ الآليّ، وسبيلُها رفعُ تذكرةٍ ' +
            'لمساعد التسجيل في الخدمات الذاتية.',
            ' — full: self-registration will not accept it. Raise a ticket with the ' +
            'registration assistant in Self Service.') + '</div>'
        : '') +
      '<div class="sx-bk-list">' + list.map(function (c) {
        var s = byCrn[c];
        var on = !!reg[String(c)];
        /*@3.SECJ.79*/
        var bad = dup[s ? s.c : ''] > 1 || clash[String(c)];
        var isFull = fullList.indexOf(c) >= 0;
        return '<span class="sx-bk-i' + (on ? ' is-sch' : '') +
          (bad ? ' is-dup' : '') + '">' +
          '<button class="sx-bk-open" data-show="' + esc(c) + '" title="' +
            t('اعرض هذه الشعبة', 'Show this section') + '">' +
            (on ? '<i class="fa-solid fa-calendar-check sx-bk-on"></i>' : '') +
            (bad
              ? '<i class="fa-solid fa-triangle-exclamation sx-bk-dup" title="' +
                (clash[String(c)] ? t('تعارضٌ في الوقت', 'Time clash')
                                  : t('شعبتان لنفس المادة', 'Two sections of the same course')) +
                '"></i>' : '') +
            (isFull ? '<i class="fa-solid fa-ticket sx-bk-full" title="' +
                t('ممتلئة — تحتاج تذكرة', 'Full — needs a ticket') + '"></i>' : '') +
            '<b>' + esc(s ? (s.c || '') : '') + '</b><span>' + esc(c) + '</span>' +
          '</button>' +
          '<button class="sx-bk-x" data-pick="' + esc(c) + '" title="' +
            t('إزالة', 'Remove') + '"><i class="fa-solid fa-xmark"></i></button>' +
          '</span>';
      }).join('') + '</div>';
  }

  /*@3.SECJ.369*/
  function SXL() { return window.GardenSXLink; }

  /*@3.SECJ.370*/
  function secOf(crn) {
    var out = null;
    state.all.forEach(function (x) { if (String(x.crn) === String(crn)) out = x; });
    return out;
  }

  function schLoad(create) { return SXL().schLoad(create); }
  function schHas(crn) { return SXL().has(crn, secOf(crn)); }
  /*@3.SECJ.95*/
  function schReconcileRegistered() {
    if (!state.all || !state.all.length) return null;
    var reg = schRegistered();
    var crns = Object.keys(reg);
    if (!crns.length) return null;
    /*@3.SECJ.96*/
    var known = {};
    state.all.forEach(function (x) { known[String(x.crn)] = 1; });
    crns = crns.filter(function (c) { return known[c]; });
    if (!crns.length) return null;
    schRegister(crns);
    return schRegister.lastReport || null;
  }

  /*@3.SECJ.97*/
  function schAnnounce(rep) {
    if (!rep) return;
    var parts = [];
    if (rep.updated) parts.push(t('حُدِّث ' + rep.updated + ' موعداً من بانر',
                                  rep.updated + ' entr' + (rep.updated > 1 ? 'ies' : 'y') + ' updated from Banner'));
    if (rep.kept.length) parts.push(t(rep.kept.length + ' عدّلتَها بيدك وبانر يقول غيرَها',
                                      rep.kept.length + ' you edited — Banner differs'));
    if (!parts.length) return;
    var sig = 'sxrec:' + rep.updated + ':' + rep.kept.map(function (k) { return k.crn + k.why; }).join(',');
    try {
      if (sessionStorage.getItem('sx_rec_sig') === sig) return;
      sessionStorage.setItem('sx_rec_sig', sig);
    } catch (e) {}
    toast(parts.join(' · '));
  }

  function schRegistered() {
    var out = SXL().registered();
    /*@3.SECJ.99*/
    basket().forEach(function (c) {
      if (out[String(c)]) return;
      if (schHas(c)) out[String(c)] = 1;
    });
    return out;
  }

  /*@3.SECJ.371*/
  function schRegister(crns) {
    var secs = [];
    (crns || []).forEach(function (c) { var s = secOf(c); if (s) secs.push(s); });
    var r = SXL().register(secs);
    /*@3.SECJ.372*/
    schRegister.lastReport = r.report;
    /*@3.SECJ.373*/
    if (!r.saved) toast(t('تعذّر الحفظ — مساحةُ التخزين ممتلئة', 'Could not save — storage full'));
    return r.n;
  }

  /*@3.SECJ.115*/
  function schSlots(sec) {
    var out = [];
    (sec.mg || []).forEach(function (m) {
      if (m.type !== 'CLAS' && m.type !== 'VRTL') return;
      var a = parseInt(String(m.begin || '').slice(0, -2), 10) * 60 +
              parseInt(String(m.begin || '').slice(-2), 10);
      var b = parseInt(String(m.end || '').slice(0, -2), 10) * 60 +
              parseInt(String(m.end || '').slice(-2), 10);
      if (!isFinite(a) || !isFinite(b) || b <= a) return;
      (m.days || []).forEach(function (day) { out.push({ day: day, a: a, b: b }); });
    });
    return out;
  }
  var DAY_AR = { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء',
                 thursday:'الخميس', friday:'الجمعة', saturday:'السبت' };
  var DAY_EN = { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed',
                 thursday:'Thu', friday:'Fri', saturday:'Sat' };
  /*@3.SECJ.374*/
  function hhmmMin(min) {
    var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'م' : 'ص', h12 = h % 12 || 12;
    return isAr() ? (h12 + ':' + ('0' + m).slice(-2) + ' ' + ap)
                  : (h12 + ':' + ('0' + m).slice(-2) + (h >= 12 ? ' PM' : ' AM'));
  }
  /*@3.SECJ.116*/
  function findClash(crn, others) {
    var all = findClashes(crn, others);
    return all.length ? all[0] : null;
  }
  /*@3.SECJ.117*/
  function findClashes(crn, others) {
    var byCrn = {};
    state.all.forEach(function (x) { byCrn[String(x.crn)] = x; });
    var me = byCrn[String(crn)];
    if (!me) return [];
    var mine = schSlots(me), out = [];
    others.forEach(function (oc) {
      var o = byCrn[String(oc)];
      if (!o || String(o.crn) === String(crn)) return;
      if (o.c === me.c) return;                   /*@3.SECJ.118*/
      var his = schSlots(o), hit = null;
      mine.forEach(function (p) {
        his.forEach(function (q) {
          if (hit || p.day !== q.day) return;
          if (p.a < q.b && q.a < p.b) {
            hit = { other: o, day: p.day, from: Math.max(p.a, q.a), to: Math.min(p.b, q.b) };
          }
        });
      });
      if (hit) out.push(hit);
    });
    return out;
  }

  /*@3.SECJ.119*/
  function clashClusters(list) {
    var par = {}, edge = {};
    list.forEach(function (c) { par[String(c)] = String(c); });
    function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    function join(a, b) { a = find(a); b = find(b); if (a !== b) par[a] = b; }
    list.forEach(function (c) {
      findClashes(c, list).forEach(function (f) {
        var o = String(f.other.crn);
        if (par[o] === undefined) return;
        join(String(c), o);
        /*@3.SECJ.120*/
        var k = find(String(c));
        var e = edge[k] || (edge[k] = { day: f.day, from: f.from, to: f.to });
        if (f.from < e.from) e.from = f.from;
        if (f.to > e.to) e.to = f.to;
      });
    });
    var byRoot = {};
    list.forEach(function (c) {
      var r = find(String(c));
      if (!edge[r] && !edge[String(c)]) return;         /*@3.SECJ.121*/
      (byRoot[r] = byRoot[r] || []).push(String(c));
    });
    var byCrn = {};
    state.all.forEach(function (x) { byCrn[String(x.crn)] = x; });
    var out = [], flat = {};
    Object.keys(byRoot).forEach(function (r) {
      if (byRoot[r].length < 2) return;
      byRoot[r].forEach(function (c) { flat[c] = 1; });
      var e = edge[r] || {};
      out.push({
        crns: byRoot[r],
        codes: byRoot[r].map(function (c) { return byCrn[c] ? byCrn[c].c : c; }),
        day: e.day, from: e.from, to: e.to
      });
    });
    return { groups: out, crns: flat };
  }

  /*@3.SECJ.375*/
  function schUnregister(crn) { return SXL().unregister(crn, secOf(crn)); }

  /*@3.SECJ.125*/
  function showOneSection(crn) {
    crn = String(crn);
    state.q = crn;
    $('#sx-q').value = crn;
    state.mine = 'off'; state.status = 'all';
    state.grp = 'off';
    $$('.sx-chip--grp').forEach(function (c) { c.classList.remove('on'); });
    openCourses = {};
    paintMe(); paintPicks(); apply();
    var grid = $('#sx-grid');
    requestAnimationFrame(function () {
      var hdr = document.querySelector('.g-header');
      var off = hdr ? hdr.getBoundingClientRect().height : 0;
      var y = grid.getBoundingClientRect().top + window.scrollY - off - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  }

  /*@3.SECJ.126*/
  function slotClass(m) {
    var kind = m.type === 'CLAS'
      ? { c: 'cls', i: 'fa-building', tt: t('حضوري', 'On campus') }
      : { c: 'vrt', i: 'fa-wifi',     tt: t('عن بعد', 'Remote') };
    var room = m.type === 'CLAS' ? String(m.room || '').trim() : '';
    var bld = String(m.building || '').trim();
    var tip = kind.tt + (room ? ' · ' + (bld ? bld + ' — ' : '') + room : '');
    return '<div class="sx-slot sx-slot--' + kind.c + '" title="' + esc(tip) + '">' +
      '<i class="fa-solid ' + kind.i + '"></i><b>' + esc(dayList(m.days)) + '</b>' +
      '<span>' + esc(hhmm(m.begin)) + '–' + esc(hhmm(m.end)) + '</span>' +
      (room ? '<u class="sx-room">' + esc(room) + '</u>' : '') + '</div>';
  }
  /*@3.SECJ.377*/
  function examWord(v) {
    var x = SXL().examHM(v);
    if (!x) return '';
    return hhmmMin(parseInt(x.slice(0, 2), 10) * 60 + parseInt(x.slice(3), 10));
  }
  function slotExam(m, label) {
    if (!m) return '<div class="sx-slot sx-slot--ex sx-slot--none">' + esc(label) + ' —</div>';
    return '<div class="sx-slot sx-slot--ex"><i class="fa-solid fa-file-pen"></i>' +
      '<b>' + esc(label) + '</b><span>' + esc(dt(m.start_date)) +
      (m.begin ? ' · ' + esc(examWord(m.begin)) : '') + '</span></div>';
  }
  var EMPTY_SLOT = '<div class="sx-slot sx-slot--none">···</div>';

  /*@3.SECJ.127*/
  function bellKind(s) {
    return (s.a == null || s.a <= 0) ? 'seat' : 'changes';
  }
  function bellOn(s) {
    var W = window.GardenWatch;
    if (!W) return false;
    return W.has('seat', state.term, s.crn) || W.has('changes', state.term, s.crn);
  }
  function bellBtn(s) {
    if (!window.GardenWatch || !window.GardenWatch.ready()) return '';
    var k = bellKind(s), on = bellOn(s);
    var lbl = on ? t('أنت تتابع هذه الشعبة — اضغط للإلغاء',
                     'You are watching this section — click to stop')
                 : (k === 'seat'
                    ? t('نبّهني عند توفّر مقعد', 'Alert me when a seat opens')
                    : t('نبّهني بتغيّرات هذه الشعبة', 'Alert me when this section changes'));
    return '<button class="sx-bell' + (on ? ' on' : '') + '" data-bell="' + esc(s.crn) +
      '" data-bk="' + k + '" title="' + esc(lbl) + '" aria-pressed="' + (on ? 'true' : 'false') +
      '"><i class="fa-solid fa-bell"></i></button>';
  }

  function card(s) {
    var max = s.m || 0, avail = s.a == null ? 0 : s.a;
    var noCap = unlimited(max);
    var taken = noCap ? 0 : Math.max(0, max - Math.max(0, avail));
    var pct = noCap ? 0 : Math.min(100, Math.round(taken * 100 / max));
    var full = avail <= 0;

    var accent, glow;
    if (s.gone)        { accent = 'var(--text-muted)'; glow = 'transparent'; }
    else if (full)     { accent = '#ef4444'; glow = 'rgba(239,68,68,.10)'; }
    else if (avail <= 3) { accent = '#f59e0b'; glow = 'rgba(245,158,11,.10)'; }
    else               { accent = '#10b981'; glow = 'rgba(16,185,129,.09)'; }

    /*@3.SECJ.128*/
    var cls = meetsOf(s, ['CLAS', 'VRTL']);
    var slots = cls.map(slotClass);
    while (slots.length < 2 || slots.length % 2) slots.push(EMPTY_SLOT);
    slots.push(slotExam(meetsOf(s, ['MEXM'])[0], t('ميد', 'Mid')));
    slots.push(slotExam(meetsOf(s, ['FEXM'])[0], t('فاينل', 'Final')));

    var profs = (s.f || []).filter(function (p) { return p && (p.n || typeof p === 'string'); });
    /*@3.SECJ.406*/
    var profTx = profs.map(profName).join(' ');
    var profHtml = profs.length
      ? '<div class="sx-prof' + (hasAr(profTx) ? '' : ' ltr') + '"><i class="fa-solid fa-user"></i>' + profs.map(function (p) {
          var nm = esc(profName(p));
          /*@3.SECJ.129*/
          var a = '<button class="sx-prof-b" data-prof="' + esc((p && p.e) || '') +
            '" data-profn="' + esc((p && p.n) || p || '') + '" title="' +
            esc(t('اعرض تقييمه وبريده', 'Show their rating and email')) + '">' + nm + '</button>';
          /*@3.SECJ.130*/
          return a + rateChip(p);
        }).join('، ') + '</div>'
      : '<div class="sx-prof none"><i class="fa-solid fa-user-slash"></i>' +
        t('لم يُعيَّن أستاذ', 'No instructor assigned') + '</div>';

    var badges = '';
    if (s.gone) badges += '<span class="sx-badge sx-badge--gone">' + t('غير معروضة', 'Not listed') + '</span>';
    /*@3.SECJ.131*/
    var md = modeOf(s);
    badges += '<span class="sx-badge sx-badge--' +
      (md === 'mix' ? 'mix' : md === 'remote' ? 'remote' : 'campus') + '">' +
      (md === 'mix' ? t('مختلط', 'Hybrid') : md === 'remote' ? t('عن بعد', 'Remote') : t('حضوري', 'On campus')) +
      '</span>';
    if (s.cm) badges += '<span class="sx-badge sx-badge--campus">' + esc(campusLabel(s.cm)) + '</span>';
    if (s.ch) badges += '<span class="sx-badge sx-badge--campus">' + esc(hours(s.ch)) + '</span>';

    /*@3.SECJ.132*/
    var seats = noCap
      ? '<div class="sx-seats"><i class="fa-solid fa-infinity" style="color:var(--sx-accent);font-size:.8rem"></i>' +
        '<div class="sx-left" style="margin-inline-end:auto">' + t('سعة غير محدودة', 'Unlimited capacity') + '</div></div>'
      : '<div class="sx-seats">' +
          '<div class="sx-seats-n"><b>' + taken + '</b>/' + max + '</div>' +
          '<div class="sx-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="sx-left">' + (full
              ? t('لا مقاعد', 'full')
              : t('باقٍ ' + avail, avail + ' left')) + '</div>' +
        '</div>';

    var nameTx = unent(s.t || '');
    return '<article class="sx-card' + (s.gone ? ' is-gone' : '') +
      '" style="--sx-accent:' + accent + ';--sx-glow:' + glow + '">' +
      '<div class="sx-c-head">' +
        /*@3.SECJ.133*/
        '<button class="sx-pick' + (inBasket(s.crn) ? ' on' : '') +
          '" data-pick="' + esc(s.crn) + '" title="' +
          t('أضِف إلى الشعب المختارة', 'Add to my picks') + '">' +
          '<i class="fa-solid fa-' + (inBasket(s.crn) ? 'check' : 'plus') + '"></i></button>' +
        '<span class="sx-dot"></span>' +
        '<span class="sx-code">' + esc(s.c || '') + '</span>' +
        '<span class="cv-slot" data-cv-code="' + esc(s.c || '') + '"></span>' +
        (s.q && s.q !== '0' ? '<span class="sx-seq">' + t('شعبة ', 'Sec ') + esc(s.q) + '</span>' : '') +
        '<button class="sx-crn" data-copy="' + esc(s.crn) + '" title="' +
          t('اضغط لنسخ رقم الشعبة', 'Click to copy the CRN') + '">' +
          esc(s.crn) + '<i class="fa-regular fa-copy"></i></button>' +
        bellBtn(s) +
      '</div>' +
      '<div class="sx-name' + (hasAr(nameTx) ? '' : ' ltr') + '">' + esc(nameTx) + '</div>' +
      '<div class="sx-meta">' + badges + '</div>' +
      '<div class="sx-slots">' + slots.join('') + '</div>' +
      profHtml + seats +
      /*@3.SECJ.134*/
      '<div class="sx-c-acts">' +
        '<button class="sx-mini" data-hist="' + esc(s.crn) + '" title="' +
          t('تحديثات الشعبة', 'Section updates') + '">' +
          '<i class="fa-solid fa-clock-rotate-left"></i>' + t('التحديثات', 'Updates') +
        '</button>' +
        '<button class="sx-mini" data-fac="' + esc(s.c || '') + '" title="' +
          t('أساتذة المادة عبر الفصول', 'Instructors across terms') + '">' +
          '<i class="fa-solid fa-chalkboard-user"></i>' + t('الأساتذة', 'Faculty') +
        '</button>' +
        '<button class="sx-mini" data-reqs="' + esc(s.crn) + '" title="' +
          t('الشروط: من يحقّ له التسجيل والمواد المطلوبة قبلها',
            'Who may register, and required prior courses') + '">' +
          '<i class="fa-solid fa-list-check"></i>' + t('الشروط', 'Eligibility') +
        '</button>' +
      '</div>' +
    '</article>';
  }

  /*@3.SECJ.135*/
  function openModal(icon, title, sub) {
    $('#sx-modal').classList.add('on');
    $('#sx-modal-icon').className = 'fa-solid ' + icon;
    $('#sx-modal-title').textContent = title;
    var s = $('#sx-modal-sub');
    if (s) { s.textContent = sub || ''; s.hidden = !sub; }
    $('#sx-modal-body').innerHTML =
      '<div class="sx-state"><i class="fa-solid fa-spinner fa-spin"></i></div>';
  }
  function closeModal() { $('#sx-modal').classList.remove('on'); _open = null; }
  var _open = null;   /*@3.SECJ.136*/

  /*@3.SECJ.137*/
  var EV_AR = {
    seats: 'تغيّرت المقاعد', capacity: 'تغيّر سقف الشعبة',
    faculty: 'تغيّر الأستاذ', mode: 'تغيّرت طريقة الحضور',
    'class': 'تغيّر وقت المحاضرة', exam: 'تغيّر موعد اختبار',
    appeared: 'ظهرت في البانر', vanished: 'اختفت من البانر',
    returned: 'عادت للظهور', room: 'تغيّرت القاعة'
  };
  var EV_EN = {
    seats: 'Seats changed', capacity: 'Capacity changed', faculty: 'Instructor changed',
    mode: 'Delivery mode changed', 'class': 'Class time changed', exam: 'Exam moved',
    appeared: 'Appeared in Banner', vanished: 'Disappeared from Banner',
    returned: 'Reappeared', room: 'Room changed'
  };
  var VERDICT = {
    split:     { ar: 'قُسِّمت غالباً إلى شعبٍ أخرى', en: 'Likely split into other sections', cls: 'warn' },
    replaced:  { ar: 'استُبدلت بشعبةٍ أخرى غالباً',  en: 'Likely replaced by another section', cls: 'warn' },
    cancelled: { ar: 'أُلغيت غالباً',                en: 'Likely cancelled',  cls: 'bad'  },
    expanded:  { ar: 'وُسِّع سقفُها',                 en: 'Capacity expanded', cls: 'warn' },
    filled:    { ar: 'ممتلئة وما زالت قائمة',        en: 'Full but still listed', cls: '' },
    alive:     { ar: 'قائمةٌ وفيها مقاعد',           en: 'Listed with seats available', cls: '' }
  };

  /*@3.SECJ.138*/
  function watchRowsHtml(crn) {
    if (!GW() || !GW().ready()) return '';
    var s = null;
    state.all.forEach(function (x) { if (String(x.crn) === String(crn)) s = x; });
    var full = s && (s.a == null || s.a <= 0);
    var wSeat = GW().find('seat', state.term, crn);
    var wChg = GW().find('changes', state.term, crn);
    function row(kind, on, icon, ttl, sub) {
      return '<button class="sx-wrow' + (on ? ' on' : '') + '" data-wtog="' + kind +
        '" data-wcrn="' + esc(crn) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<i class="fa-solid ' + icon + '"></i>' +
        '<span><b>' + esc(ttl) + '</b><em>' + esc(sub) + '</em></span>' +
        '<i class="fa-solid fa-' + (on ? 'circle-check' : 'circle-plus') + ' sx-wrow-x"></i></button>';
    }
    return '<div class="sx-sec-h">' + t('التنبيهات', 'Alerts') + '</div>' +
      '<div class="sx-wrows">' +
      row('seat', !!wSeat, 'fa-chair',
          t('نبّهني عند توفّر مقعد', 'Alert me when a seat opens'),
          wSeat ? (wSeat.armed
              ? t('مفعّلة — بانتظار أول مقعد يتحرّر', 'Armed — waiting for the first free seat')
              : t('مفعّلة — الشعبة فيها مقاعد الآن، وسنسلّحها إذا امتلأت',
                  'Armed later — seats are open now; it re-arms when full'))
            : (full ? t('الشعبة ممتلئة الآن', 'The section is full now')
                    : t('فيها مقاعد الآن', 'Seats are available now'))) +
      row('changes', !!wChg, 'fa-bell',
          t('نبّهني بتغيّراتها', 'Alert me on changes'),
          t('الأستاذ · القاعة · مواعيد الاختبارات · وقت المحاضرة · الإلغاء',
            'Instructor · room · exam dates · class time · removal')) +
      '</div>' +
      (GW().synced() ? '' :
        '<div class="sx-wnote"><i class="fa-solid fa-circle-info"></i>' +
        esc(t('متابعاتُك محفوظةٌ على هذا الجهاز وحده. فعّل المزامنة لتظهر على أجهزتك كلها.',
              'Your watches live on this device only. Turn on sync to share them across devices.')) +
        '</div>');
  }

  function openHistory(crn) {
    _open = { kind: 'hist', arg: crn };
    openModal('fa-clock-rotate-left', t('تحديثات الشعبة ', 'Section updates ') + crn);
    fetch(API + '/v1/section/' + state.term + '/' + encodeURIComponent(crn) + '/history')
      .then(function (r) { if (!r.ok) throw new Error('h-' + r.status); return r.json(); })
      .then(function (d) { $('#sx-modal-body').innerHTML = watchRowsHtml(crn) + historyHtml(d); })
      .catch(function () {
        $('#sx-modal-body').innerHTML = '<div class="sx-state"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر جلب التحديثات', 'Could not load updates') + '</div>';
      });
  }

  function historyHtml(d) {
    var h = '', v = d.verdict, ar = isAr();
    if (v && VERDICT[v.verdict]) {
      var meta = VERDICT[v.verdict];
      h += '<div class="sx-verdict ' + meta.cls + '">' +
        '<i class="fa-solid fa-lightbulb" style="margin-top:.15rem"></i><div style="flex:1">' +
        '<div class="sx-verdict-t">' + esc(ar ? meta.ar : meta.en) + '</div>' +
        /*@3.SECJ.139*/
        '<div class="sx-verdict-c">' + t('درجة الثقة', 'Confidence') + ': ' +
          Math.round((v.confidence || 0) * 100) + (ar ? '٪' : '%') + '</div>';
      var ev = v.evidence || [];
      if (ev.length) {
        h += '<ul class="sx-ev">' + ev.map(function (e) {
          var line = esc(e.t || '');
          if (e['من'] != null) line += ' (' + esc(e['من']) + ' ← ' + esc(e['إلى']) + ')';
          return '<li>' + line + '</li>';
        }).join('') + '</ul>';
      }
      var su = v.successors || [];
      if (su.length) {
        h += '<div class="sx-verdict-c" style="margin-top:.5rem">' +
             t('الشعب التي قُسِّمت إليها غالباً:', 'Likely successor sections:') + '</div>' +
             '<div class="sx-succ">' + su.map(function (x) {
               return '<button data-hist="' + esc(x.crn) + '">' + esc(x.crn) + '</button>';
             }).join('') + '</div>';
      }
      h += '</div></div>';
    }

    var evs = d.events || [];
    h += '<div class="sx-sec-h">' + t('سجلّ التغييرات', 'Change log') + '</div>';
    if (!evs.length) {
      h += '<div class="sx-state" style="padding:1.5rem"><i class="fa-solid fa-check"></i>' +
           t('لا تغييرات مرصودة على هذه الشعبة', 'No changes recorded') + '</div>';
    } else {
      h += '<ul class="sx-tl">' + evs.map(function (e) {
        var lbl = (ar ? EV_AR : EV_EN)[e.kind] || e.kind;
        return '<li><span class="sx-tl-when">' + esc(when(e.at)) + '</span>' +
               '<span class="sx-tl-what"><b>' + esc(lbl) + '</b>' + detail(e) + '</span></li>';
      }).join('') + '</ul>';
    }
    return h;
  }

  function when(iso) {
    try {
      return new Date(iso).toLocaleDateString(isAr() ? 'ar-SA' : 'en-GB',
        { day: 'numeric', month: 'short' });
    } catch (e) { return ''; }
  }

  function detail(e) {
    var b = e.before, a = e.after;
    if (e.kind === 'seats' && a) return ' — ' + t('المتاح', 'available') + ': ' + esc(a.avail);
    if (e.kind === 'capacity' && a && b) return ' — ' + esc(b.max) + ' ← ' + esc(a.max);
    if (e.kind === 'faculty') {
      return ' — ' + esc(((b || []).join('، ') || t('بلا أستاذ', 'none'))) +
             ' ← ' + esc(((a || []).join('، ') || t('بلا أستاذ', 'none')));
    }
    if (e.kind === 'mode' && a) {
      return ' — ' + (a.in_person ? t('صارت حضورية', 'now on campus')
                                  : t('صارت عن بعد', 'now remote'));
    }
    /*@3.SECJ.140*/
    if (e.kind === 'room' && a) {
      var rr = [];
      var at = a.at || {};
      for (var k in at) if (at[k] && at[k].room) rr.push(at[k].room);
      var lbl = a.move === 'assigned' ? t('تعيّنت', 'assigned')
              : a.move === 'cleared'  ? t('رُفعت', 'cleared') : t('تبدّلت', 'changed');
      return ' — ' + lbl + (rr.length ? ': ' + esc(rr.join('، ')) : '');
    }
    return '';
  }

  /*@3.SECJ.141*/
  function GW() { return window.GardenWatch; }

  /*@3.SECJ.142*/
  function paintBells() {
    if (!GW()) return;
    $$('.sx-bell[data-bell]').forEach(function (b) {
      var crn = b.getAttribute('data-bell');
      var on = GW().has('seat', state.term, crn) || GW().has('changes', state.term, crn);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var badge = $('#sx-watch-n');
    if (badge) {
      var u = GW().unread(), n = GW().countFor(state.term);
      badge.textContent = u ? String(u) : (n ? String(n) : '');
      badge.hidden = !u && !n;
      badge.classList.toggle('alert', !!u);
    }
  }

  /*@3.SECJ.143*/
  function bellToggle(crn, kind) {
    if (!GW()) return;
    var was = GW().has('seat', state.term, crn) || GW().has('changes', state.term, crn);
    var k = was ? (GW().has('seat', state.term, crn) ? 'seat' : 'changes') : kind;
    GW().toggle(k, state.term, crn).then(function (r) {
      paintBells();
      if (r.error) {
        toast(r.error === 'limit'
          ? t('بلغتَ سقف المتابعات — احذف بعضها', 'Watch limit reached — remove some')
          : t('تعذّر حفظ المتابعة', 'Could not save the watch'), 2400);
        return;
      }
      if (!r.on) { toast(t('أُلغيت المتابعة', 'Watch removed')); return; }
      var msg = k === 'seat'
        ? t('سننبّهك أول ما يتحرّر مقعد', 'We will alert you the moment a seat opens')
        : t('سننبّهك بأي تغيير في هذه الشعبة', 'We will alert you on any change');
      pushNudge(msg);
    });
  }

  /*@3.SECJ.144*/
  function pushNudge(msg) {
    var P = window.GardenPush;
    var perm = (window.Notification && Notification.permission) || 'default';
    if (!P || !P.supported || !P.supported()) { toast(msg, 2600); return; }
    if (perm === 'granted') { toast(msg + ' ✓', 2600); return; }
    if (perm === 'denied') {
      toast(msg + t(' — لكن الإشعارات محجوبةٌ في المتصفح، فسترى التنبيه في الصفحة',
                    ' — but notifications are blocked; you will see it in the page'), 4200);
      return;
    }
    pushDialog(msg);
  }

  /*@3.SECJ.401*/
  function pushDialog(msg) {
    var hasVault = false;
    try {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      hasVault = !!(k && /^v[0-9a-f]{32}$/.test(k));
    } catch (e) {}

    var d = document.getElementById('sxPushDlg');
    if (!d) {
      d = document.createElement('dialog');
      d.className = 'gsf sx-pushdlg';
      d.id = 'sxPushDlg';
      document.body.appendChild(d);
    }
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x">' +
        '<button class="gsf-close" aria-label="' + esc(t('إغلاق', 'Close')) + '">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</form>' +
      '<div class="gsf-body">' +
        '<h2 class="sx-pd-t"><i class="fa-solid fa-bell" aria-hidden="true"></i>' +
          esc(t('لتصلك التنبيهات', 'To receive alerts')) + '</h2>' +
        '<p class="sx-pd-p">' + esc(msg) + '</p>' +
        '<p class="sx-pd-p">' + esc(t(
          'يحتاج المتصفّحُ إذنَك أوّلاً — ثمّ يصلك التنبيهُ والموقعُ مغلق.',
          'The browser needs your permission first — then alerts arrive even when the site is closed.')) + '</p>' +
        (hasVault ? '' :
          '<p class="sx-pd-warn"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>' + esc(t(
            'وبلا خزنةٍ يصل التنبيهُ إلى هذا المتصفّح وحدَه: الخادمُ لا يعرف أن جوّالك وحاسبك لك أنت حتى تربطهما بخزنةٍ واحدة. أكملِ الإعدادَ لتصلك على أجهزتك كلِّها.',
            'Without a vault, alerts reach this browser only: the server cannot tell that your phone and laptop are both yours until one vault links them. Finish setup to get alerts on all your devices.')) +
          '</span></p>') +
      '</div>' +
      '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="sx-pd-allow">' +
          esc(t('اسمحْ بالإشعارات', 'Allow notifications')) + '</button>' +
        (hasVault ? '' :
          '<button type="button" class="gsf-btn" data-a="sx-pd-setup">' +
            esc(t('أكملِ الإعداد', 'Finish setup')) + '</button>') +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="sx-pd-later">' +
          esc(t('لاحقاً', 'Later')) + '</button>' +
      '</div></div>';

    /*@3.SECJ.403*/
    if (d.__sxWired) { if (!d.open) d.showModal(); return; }
    d.__sxWired = 1;
    d.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sx-pd-later') { d.close(); return; }
      /*@3.SECJ.402*/
      if (a === 'sx-pd-setup') { d.close(); openAlertsStep(); return; }
      if (a === 'sx-pd-allow') {
        b.disabled = true;
        Notification.requestPermission().then(function (p) {
          b.disabled = false;
          if (p !== 'granted') { toast(t('لم يُمنح الإذن', 'Permission not granted')); return; }
          var P2 = window.GardenPush;
          if (!P2 || !P2.subscribe) { d.close(); return; }
          P2.subscribe().then(function (r) {
            d.close();
            toast(r && r.ok ? t('تمّ — ستصلك التنبيهات', 'Done — alerts will reach you')
                            : t('تعذّر التفعيل', 'Could not enable'), 2600);
          });
        }, function () { b.disabled = false; });
      }
    });

    if (!d.open) d.showModal();
  }

  function openAlertsStep() {
    openSetup();
    var p = loadProf();
    if (!profReady(p)) return;
    W.step = STEP_ALERTS;
    paintSetup();
  }

  /*@3.SECJ.145*/
  function courseWatchToggle(code) {
    if (!GW() || !code) return;
    GW().toggle('course', state.term, code).then(function (r) {
      render();
      if (r.error) {
        toast(r.error === 'unknown_course'
          ? t('لا نعرف هذا الرمز في الكتالوج', 'Unknown course code')
          : t('تعذّر حفظ المتابعة', 'Could not save the watch'), 2600);
        return;
      }
      if (!r.on) { toast(t('أُلغيت المتابعة', 'Watch removed')); return; }
      pushNudge(t('سننبّهك أول ما تنزل شعبة لـ' + code,
                  'We will alert you the moment a section for ' + code + ' appears'));
    });
  }

  /*@3.SECJ.146*/
  function openWatches() {
    _open = { kind: 'watch', arg: '' };
    openModal('fa-bell', t('متابعاتي', 'My watches'));
    if (!GW() || !GW().ready()) {
      $('#sx-modal-body').innerHTML = '<div class="sx-state">' +
        t('المتابعات غير متاحة الآن', 'Watches are unavailable') + '</div>';
      return;
    }
    GW().load(true).then(function () {
      $('#sx-modal-body').innerHTML = watchesHtml();
      GW().markSeen().then(paintBells);
    });
  }

  var WK_AR = { seat: 'مقعد', course: 'شعبة جديدة', changes: 'تغيّرات',
                term: 'فصلٌ جديد' };
  var WK_EN = { seat: 'Seat', course: 'New section', changes: 'Changes',
                term: 'New term' };

  function watchesHtml() {
    var S = GW().state(), ar = isAr();
    var h = '';

    var al = S.alerts || [];
    h += '<div class="sx-sec-h">' + t('التنبيهات', 'Alerts') + '</div>';
    if (!al.length) {
      h += '<div class="sx-state" style="padding:1.4rem"><i class="fa-solid fa-inbox"></i>' +
        t('لا تنبيهات بعد', 'No alerts yet') + '</div>';
    } else {
      h += '<ul class="sx-al">' + al.map(function (a) {
        /*@3.SECJ.147*/
        var st = a.pushed ? t('وصل إشعارُه', 'Notification sent')
               : a.push_err ? t('لم يُسلَّم الإشعار', 'Notification not delivered')
               : t('في الصفحة فقط', 'In-page only');
        return '<li class="sx-al-i' + (a.read ? '' : ' unread') + '">' +
          '<div class="sx-al-h"><b>' + esc(a.title) + '</b>' +
            '<span class="sx-al-t">' + esc(when(a.at)) + '</span></div>' +
          '<div class="sx-al-b">' + esc(a.body) + '</div>' +
          '<div class="sx-al-f"><span title="' + esc(a.push_err || '') + '">' + esc(st) + '</span>' +
            (a.crn ? '<button class="sx-al-go" data-hist="' + esc(a.crn) + '">' +
                     t('افتح الشعبة', 'Open section') + '</button>' : '') +
          '</div></li>';
      }).join('') + '</ul>';
    }

    var ws = S.watches || [];
    h += '<div class="sx-sec-h">' + t('ما أتابعه', 'What I watch') +
         ' (' + ws.length + ')</div>';
    if (!ws.length) {
      h += '<div class="sx-state" style="padding:1.4rem"><i class="fa-solid fa-bell-slash"></i>' +
        t('لا متابعات — اضغط الجرس على أي شعبة', 'None — press the bell on any section') +
        '</div>';
    } else {
      h += '<ul class="sx-wl">' + ws.map(function (w) {
        var armed = w.kind !== 'seat' || w.armed;
        return '<li class="sx-wl-i">' +
          '<span class="sx-wl-k">' + esc((ar ? WK_AR : WK_EN)[w.kind] || w.kind) + '</span>' +
          /*@3.SECJ.148*/
          '<span class="sx-wl-t">' + esc(w.kind === 'term'
              ? t('أيُّ فصلٍ ينزل', 'Any new term') : w.target) + '</span>' +
          (w.kind !== 'term' && w.term !== state.term
            ? '<span class="sx-wl-o">' + t('فصلٌ آخر', 'other term') + '</span>' : '') +
          (armed ? '' : '<span class="sx-wl-o">' + t('ساكنة', 'idle') + '</span>') +
          '<button class="sx-wl-x" data-wdel="' + esc(w.kind + '|' + w.term + '|' + w.target) +
            '" title="' + t('إلغاء المتابعة', 'Remove') + '">' +
            '<i class="fa-solid fa-xmark"></i></button></li>';
      }).join('') + '</ul>';
    }

    if (!GW().synced()) {
      h += '<div class="sx-wnote"><i class="fa-solid fa-circle-info"></i>' +
        esc(t('متابعاتُك محفوظةٌ على هذا الجهاز وحده. فعّل المزامنة لتظهر على أجهزتك كلها.',
              'Your watches live on this device only. Turn on sync to share them across devices.')) +
        '</div>';
    }
    return h;
  }

  /*@3.SECJ.149*/
  function openFaculty(course) {
    if (!course) return;
    _open = { kind: 'fac', arg: course };
    openModal('fa-chalkboard-user', t('أساتذة ', 'Instructors of ') + course);
    /*@3.SECJ.150*/
    var qs = state.gender !== 'all' ? '?g=' + encodeURIComponent(state.gender) : '';
    fetch(API + '/v1/course/' + encodeURIComponent(course) + '/faculty' + qs)
      .then(function (r) { if (!r.ok) throw new Error('f-' + r.status); return r.json(); })
      .then(function (d) {
        $('#sx-modal-body').innerHTML = facultyHtml(d);
        var q = $('#sx-fac-q');
        if (q) q.addEventListener('input', function () {
          var v = q.value.trim().toLowerCase();
          $$('.sx-fac').forEach(function (el) {
            el.hidden = !!v && el.dataset.nm.indexOf(v) < 0;
          });
        });
      })
      .catch(function () {
        $('#sx-modal-body').innerHTML = '<div class="sx-state"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر جلب قائمة الأساتذة', 'Could not load instructors') + '</div>';
      });
  }

  var GENDER_AR = { Males: 'شُعَب الطلاب', Females: 'شُعَب الطالبات' };
  var GENDER_EN = { Males: 'male sections', Females: 'female sections' };

  function facultyHtml(d) {
    var list = d.faculty || [];
    var g = d.gender || '';
    var scope = g
      ? t(' · ' + (GENDER_AR[g] || g) + ' فقط', ' · ' + (GENDER_EN[g] || g) + ' only')
      : '';

    if (!list.length) {
      return '<div class="sx-state"><i class="fa-solid fa-user-slash"></i>' +
        (g ? t('لا أساتذة لهذه المادة في ' + (GENDER_AR[g] || g),
               'No instructors for this course in ' + (GENDER_EN[g] || g))
           : t('لا أساتذة مسجّلين لهذه المادة في الأرشيف', 'No instructors recorded for this course')) +
        '</div>';
    }
    var terms = d.terms || {};
    var h = '<div class="sx-sec-h">' +
      t(list.length + ' أستاذاً · ' + d.rows + ' شعبة عبر الفصول',
        list.length + ' instructors · ' + d.rows + ' sections across terms') + esc(scope) + '</div>';
    /*@3.SECJ.151*/
    if (list.length > 8) {
      h += '<input class="sx-ms-find" id="sx-fac-q" style="margin-bottom:.7rem" type="text" ' +
           'placeholder="' + t('ابحث عن أستاذ…', 'Find an instructor…') + '">';
    }

    /*@3.SECJ.152*/
    h += list.map(function (f) {
      var rows = (f.t || []).map(function (r) {
        /*@3.SECJ.153*/
        var td = terms[r[0]] || r[0];
        /*@3.SECJ.154*/
        var seat = (r[3] == null || unlimited(r[3])) ? ''
          : ' · ' + Math.max(0, r[3] - Math.max(0, r[4] || 0)) + '/' + r[3];
        return '<div class="sx-fac-row">' +
          '<span class="cr">' + esc(r[1]) + '</span>' +
          '<span class="tm">' + esc(td) + '</span>' +
          '<span class="cp">' + esc(campusLabel(r[2])) + esc(seat) + '</span></div>';
      }).join('');
      var more = f.c > (f.t || []).length
        ? '<div class="sx-fac-more">' + t('و' + (f.c - f.t.length) + ' شعبة أقدم…',
                                          '+' + (f.c - f.t.length) + ' older sections…') + '</div>'
        : '';
      /*@3.SECJ.155*/
      var last = f.t && f.t[0] ? (terms[f.t[0][0]] || f.t[0][0]) : '';
      /*@3.SECJ.383*/
      var hay = String(f.n || '').toLowerCase() + ' ' + normAr(f.a || '') +
                ' ' + String(f.e || '').toLowerCase();
      return '<details class="sx-fac" data-nm="' + esc(hay) + '">' +
        '<summary class="sx-fac-h"><i class="fa-solid fa-user" style="color:#a78bfa"></i>' +
          '<div style="min-width:0"><div class="nm">' + esc(f.n) + '</div>' +
          '<div class="em">' + (f.a ? '<b class="sx-fac-ar">' + esc(f.a) + '</b> · ' : '') +
            esc(last) + '</div></div>' +
          '<span class="ct">' + f.c + ' ' + t('شعبة', 'sec') + '</span>' +
          /*@3.SECJ.384*/
          /*@3.SECJ.390*/
          rateChip({ n: f.n, e: f.e }) +
          '<i class="fa-solid fa-chevron-down sx-fac-car"></i></summary>' +
        (f.e ? '<div class="sx-fac-mail"><i class="fa-solid fa-envelope"></i>' +
               '<a href="mailto:' + esc(f.e) + '">' + esc(f.e) + '</a></div>' : '') +
        '<div class="sx-fac-rows">' + rows + '</div>' + more + '</details>';
    }).join('');
    return h;
  }

  /*@3.SECJ.156*/
  var CAT_AR = {
    Levels: 'المستوى', Campuses: 'الفرع', Colleges: 'الكلّية',
    Departments: 'القسم', Programs: 'البرنامج', Degrees: 'الدرجة',
    Concentrations: 'التخصّص الدقيق', Classes: 'السنة الدراسية',
    Majors: 'التخصّص', 'Fields of Study': 'مجال الدراسة',
    Cohorts: 'الدفعة', Attributes: 'السمات'
  };
  /*@3.SECJ.157*/
  var CAT_CORE = ['Levels', 'Campuses', 'Colleges', 'Programs', 'Departments'];
  function catLabel(c) { return isAr() ? (CAT_AR[c] || c) : c; }

  /*@3.SECJ.158*/
  var SUBJ_AR = {
    ACCT: 'محاسبة', ACT: 'محاسبة', ARB: 'لغة عربية', BIOL: 'تشريح وفسيولوجيا',
    CI: 'مناهج وطرق تدريس', COMM: 'مهارات الاتصال', CS: 'علوم الحاسب',
    CYS: 'الأمن السيبراني', DENG: 'لغة إنجليزية', DMED: 'إعلام إلكتروني',
    DMEM: 'تسويق رقمي', DMIT: 'إعلام رقمي — حاسب', DMLO: 'منطق',
    DMPS: 'علوم سياسية', DMSO: 'علم النفس الاجتماعي', DS: 'علوم البيانات',
    DTRA: 'ترجمة', ECN: 'اقتصاد', ECOM: 'تجارة إلكترونية', ECON: 'اقتصاد',
    ENG: 'لغة إنجليزية', FIN: 'تمويل', HCI: 'معلوماتية صحية',
    HCM: 'إدارة صحية', HQS: 'جودة الرعاية الصحية', ISLM: 'دراسات إسلامية',
    IT: 'تقنية المعلومات', LAW: 'قانون', MATH: 'رياضيات', MGT: 'إدارة',
    MIS: 'نظم المعلومات الإدارية', MKT: 'تسويق', MKY: 'تسويق',
    PHC: 'صحة عامة', RES: 'مهارات الكتابة والبحث', SCI: 'علوم',
    STAT: 'إحصاء', TRA: 'ترجمة'
  };
  function subjAr(code) { return SUBJ_AR[code] || ''; }

  function openReqs(crn) {
    _open = { kind: 'reqs', arg: crn };
    /*@3.SECJ.159*/
    var sec = null;
    for (var i = 0; i < state.all.length; i++) {
      if (String(state.all[i].crn) === String(crn)) { sec = state.all[i]; break; }
    }
    openModal('fa-list-check', t('شروط ', 'Eligibility · ') + (sec ? sec.c : '') +
              t(' · شعبة ', ' · CRN ') + crn,
              sec ? unent(sec.t || '') : '');
    fetch(API + '/v1/section/' + state.term + '/' + encodeURIComponent(crn) + '/reqs')
      .then(function (r) { if (!r.ok) throw new Error('r-' + r.status); return r.json(); })
      .then(function (d) { $('#sx-modal-body').innerHTML = reqsHtml(d); })
      .catch(function () {
        $('#sx-modal-body').innerHTML = '<div class="sx-state"><i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر جلب الشروط', 'Could not load requirements') + '</div>';
      });
  }

  /*@3.SECJ.160*/
  function reqLine(cat, items) {
    var vals = (items && items.length)
      ? items.map(function (x) {
          /*@3.SECJ.161*/
          var name = cat === 'Campuses' ? campusLabel(x.n) : (x.n || x.c);
          return '<span class="sx-req-i">' + esc(name) +
            (x.c && x.c !== x.n ? '<em>' + esc(x.c) + '</em>' : '') + '</span>';
        }).join('')
      : '<span class="sx-req-i is-none">—</span>';
    return '<div class="sx-req-line"><span class="cat">' + esc(catLabel(cat)) +
           '</span><div class="vals">' + vals + '</div></div>';
  }

  /*@3.SECJ.162*/
  function catOrder(obj) {
    var extra = Object.keys(obj).filter(function (k) { return CAT_CORE.indexOf(k) < 0; }).sort();
    return CAT_CORE.concat(extra);
  }

  function reqsHtml(d) {
    var h = '';

    /*@3.SECJ.163*/
    h += '<div class="sx-sec-h">' + t('المتطلبات السابقة', 'Prerequisites') + '</div>';
    var p = d.prereqs;
    if (!p) {
      /*@3.SECJ.164*/
      h += '<div class="sx-req-none">' + t('لم تُجلب بعدُ لهذه المادة — تُحصد تباعاً',
                                            'Not harvested yet for this course') + '</div>';
    } else if (!(p.rows || []).length && !p.text) {
      h += '<div class="sx-req-ok"><i class="fa-solid fa-check"></i>' +
           t('لا مواد مطلوبة قبلها', 'No prior course required') + '</div>';
    } else if (p.text) {
      h += '<div class="sx-req-none">' + esc(p.text) + '</div>';
    } else {
      /*@3.SECJ.165*/
      var groups = [], byS = {};
      p.rows.forEach(function (r) {
        var key = (String(r.code || '').match(/^[A-Za-z]+/) || [''])[0];
        if (!byS[key]) { byS[key] = { key: key, rows: [] }; groups.push(byS[key]); }
        byS[key].rows.push(r);
      });

      h += '<div class="sx-req-lead">' +
        t('يجب اجتياز هذه المتطلبات حسب نوع التخصّص:',
          'Required prior courses — by major:') + '</div>';

      h += '<div class="sx-req-rows">' + groups.map(function (g) {
        var ar = subjAr(g.key);
        var head = g.key && g.key.charAt(0) !== '#'
          ? '<span class="cat" title="' + esc(ar || g.key) + '">' + esc(g.key) + '</span>'
          : '<span class="cat"></span>';
        /*@3.SECJ.166*/
        var grades = g.rows.map(function (r) { return r.grade || ''; });
        var same = grades.every(function (x) { return x === grades[0]; });
        var vals = g.rows.map(function (r, i) {
          var name = r.code || ((r.subject || '') + ' ' + (r.number || '')).trim();
          var per = same ? '' : (r.grade ? '<em>' + esc(r.grade) + '</em>' : '');
          /*@3.SECJ.167*/
          var op = '';
          if (i) {
            var raw = String(r.op || '');
            op = '<span class="op">' + (isAr()
              ? (/and/i.test(raw) ? 'و' : /or/i.test(raw) ? 'أو' : esc(raw))
              : (raw || 'or')) + '</span>';
          }
          return op + '<b>' + esc(name) + per + '</b>';
        }).join('');
        var tail = g.rows[0].test
          ? esc(g.rows[0].test) + (g.rows[0].score ? ' ≥ ' + esc(g.rows[0].score) : '')
          : (same && grades[0]
              ? t('بتقدير ', 'grade ') + esc(grades[0]) + t(' فأعلى', '+')
              : '');
        return '<div class="sx-req-line pr">' + head + '<div class="vals">' + vals + '</div>' +
               (tail ? '<span class="ex">' + tail + '</span>' : '<span class="ex"></span>') +
               '</div>';
      }).join('') + '</div>';
    }

    /*@3.SECJ.168*/
    h += '<div class="sx-sec-h">' + t('من يحقّ له التسجيل', 'Who may register') + '</div>';
    var r0 = d.restrictions;
    if (!r0) {
      h += '<div class="sx-req-none">' + t('لم تُجلب بعدُ لهذه الشعبة — تُحصد تباعاً',
                                            'Not harvested yet for this section') + '</div>';
    } else {
      var must = r0.must || {}, cannot = r0.cannot || {};
      var ck = Object.keys(cannot);
      /*@3.SECJ.169*/
      h += '<div class="sx-req-g ok"><div class="sx-req-lead">' +
        '<i class="fa-solid fa-circle-check"></i>' +
        t('يجب أن تكون ضمن:', 'You must be in:') + '</div>' +
        catOrder(must).map(function (c) { return reqLine(c, must[c]); }).join('') +
        '</div>';
      /*@3.SECJ.170*/
      if (ck.length) {
        h += '<div class="sx-req-g bad"><div class="sx-req-lead">' +
          '<i class="fa-solid fa-circle-xmark"></i>' +
          t('ولا يصحّ إن كنت ضمن:', 'And you must NOT be in:') + '</div>' +
          ck.sort().map(function (c) { return reqLine(c, cannot[c]); }).join('') + '</div>';
      }
      /*@3.SECJ.171*/
      h += '<div class="sx-req-note"><i class="fa-solid fa-circle-info"></i>' +
        t('بانر ينبّه أن بعض القيود قد لا تنطبق على حالتك — والمرجع النهائي بوابة الجامعة.',
          'Banner notes that not all restrictions apply to every student — the university portal is final.') +
        '</div>';
    }
    return h;
  }

  /*@3.SECJ.172*/
  var PROF_KEY = 'student_profile';
  var TAX = null;                       /*@3.SECJ.173*/
  var TAX_KEY = 'sx_taxonomy';
  var TAX_TTL = 30 * 24 * 3600 * 1000;  /*@3.SECJ.174*/
  function taxCacheGet() {
    try {
      var v = JSON.parse(localStorage.getItem(TAX_KEY) || 'null');
      return (v && v.d) ? v.d : null;
    } catch (e) { return null; }
  }
  function taxCacheAge() {
    try {
      var v = JSON.parse(localStorage.getItem(TAX_KEY) || 'null');
      return v && v.t ? (Date.now() - v.t) : Infinity;
    } catch (e) { return Infinity; }
  }
  function taxCacheSet(d) {
    /*@3.SECJ.175*/
    try { localStorage.setItem(TAX_KEY, JSON.stringify({ t: Date.now(), d: d })); }
    catch (e) { /*@3.SECJ.176*/ }
  }

  /*@3.SECJ.177*/
  var PLANS = null;
  var PL_KEY = 'sx_plans';
  /*@3.SECJ.178*/
  var PL_VER = 3;
  var PL_TTL = 30 * 24 * 3600 * 1000;
  /*@3.SECJ.179*/
  var PL_ALT = null;                 /*@3.SECJ.180*/
  var PL_OLD = {};                   /*@3.SECJ.181*/
  function altVersionFor(slug) {
    if (!PL_ALT || !slug) return '';
    for (var v in PL_ALT) if (PL_ALT[v].indexOf(slug) >= 0) return v;
    return '';
  }
  /*@3.SECJ.182*/
  function myPlanVersion(p) {
    /*@3.SECJ.183*/
    if (!p && W.draft && $('#sx-setup') && $('#sx-setup').classList.contains('on')) {
      p = { plan_version: W.draft.plan_version, program: W.draft.program };
    }
    p = p || loadProf();
    var v = p.plan_version || '';
    if (!v || v === 'current') return '';
    return (PL_ALT && PL_ALT[v] && PL_ALT[v].indexOf(p.program) >= 0) ? v : '';
  }
  function fetchAlt(version, after) {
    if (!version || !API) { if (after) after(); return; }
    if (PL_OLD[version]) { if (after) after(); return; }
    var key = PL_KEY + '_' + version;
    try {
      var c = JSON.parse(localStorage.getItem(key) || 'null');
      if (c && c.v === PL_VER && (Date.now() - c.t) < PL_TTL) {
        PL_OLD[version] = c.d; if (after) after(); return;
      }
    } catch (e) { /*@3.SECJ.184*/ }
    fetch(API + '/v1/plans?v=' + encodeURIComponent(version) + '&r=' + PL_VER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.programs && d.programs.length) {
          PL_OLD[version] = d.programs;
          try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: PL_VER, d: d.programs })); }
          catch (e) { /*@3.SECJ.185*/ }
        }
        if (after) after();
      })
      .catch(function () { if (after) after(); });
  }
  function plCacheGet() {
    try {
      var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null');
      if (!v || !v.d || v.v !== PL_VER) return null;
      /*@3.SECJ.186*/
      if (Array.isArray(v.d)) return v.d;
      PL_ALT = v.d.alt || PL_ALT;
      return v.d.programs || null;
    } catch (e) { return null; }
  }
  function plCacheAge() {
    try {
      var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null');
      return (v && v.t && v.v === PL_VER) ? (Date.now() - v.t) : Infinity;
    } catch (e) { return Infinity; }
  }
  function plCacheSet(d) {
    try { localStorage.setItem(PL_KEY, JSON.stringify({ t: Date.now(), v: PL_VER, d: d })); }
    catch (e) { /*@3.SECJ.187*/ }
  }
  function fetchPlans(after) {
    if (!PLANS) PLANS = plCacheGet();
    if (!API || (PLANS && plCacheAge() < PL_TTL)) { if (after) after(); return; }
    /*@3.SECJ.188*/
    fetch(API + '/v1/plans?r=' + PL_VER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.programs && d.programs.length) {
          PLANS = d.programs; PL_ALT = d.alt || null;
          plCacheSet({ programs: d.programs, alt: d.alt || null });
          /*@3.SECJ.189*/
          AR_TITLE = null; HAY_GEN++;
          /*@3.SECJ.190*/
          fetchAlt(myPlanVersion(), function () { if (after) after(); });
        }
      })
      .catch(function () { /*@3.SECJ.191*/ });
  }
  function planOf(slug) {
    if (!slug) return null;
    /*@3.SECJ.192*/
    var v = myPlanVersion();
    if (v && PL_OLD[v]) {
      for (var j = 0; j < PL_OLD[v].length; j++) {
        if (PL_OLD[v][j].slug === slug) return PL_OLD[v][j];
      }
    }
    if (!PLANS) return null;
    for (var i = 0; i < PLANS.length; i++) if (PLANS[i].slug === slug) return PLANS[i];
    return null;
  }
  /*@3.SECJ.193*/
  function planIndex(slug) {
    var p = planOf(slug);
    if (!p) return null;
    if (!p._ix) {
      /*@3.SECJ.194*/
      var ix = {}, subs = {}, cnt = {};
      (p.courses || []).forEach(function (c) {
        ix[c.c] = c;
        var m = /^([A-Za-z]+)/.exec(c.c);
        if (!m) return;
        var s = m[1].toUpperCase();
        cnt[s] = (cnt[s] || 0) + 1;
      });
      for (var s2 in cnt) if (cnt[s2] > 1) subs[s2] = 1;
      p._ix = ix; p._subs = subs;
    }
    return p._ix;
  }
  function planLevel(slug, code) {
    var ix = planIndex(slug);
    var c = ix && ix[code];
    return (c && c.l) ? c.l : null;
  }
  /*@3.SECJ.195*/
  function trackName(list) {
    if (!list || !list.length) return '';
    var ar = null, en = null;
    list.forEach(function (x) { if (/[ء-ي]/.test(x)) ar = ar || x; else en = en || x; });
    var s = (isAr() ? (ar || en) : (en || ar)) || '';
    /*@3.SECJ.196*/
    return s.replace(/^[^\-–—]*[\-–—]\s*/, '')
            .replace(/\s*Track\s*$/i, '').replace(/^\s*مسارُ?\s+/, '').trim();
  }
  function planTracks(slug, code) {
    var ix = planIndex(slug);
    var c = ix && ix[code];
    return (c && c.tr) ? c.tr : null;
  }
  /*@3.SECJ.197*/
  function planSubjects(slug) {
    planIndex(slug);
    var p = planOf(slug);
    return (p && p._subs) || null;
  }

  /*@3.SECJ.198*/
  function normAr(s) {
    return String(s == null ? '' : s)
      .replace(/[ً-ْٰـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .toLowerCase().trim();
  }
  /*@3.SECJ.199*/
  var HAY_GEN = 1;
  function hayOf(s, c) {
    if (s._hg !== HAY_GEN) {
      s._h = normAr([s.crn, s.c, s.q, unent(s.t), arTitle(s.c),
                     facNames(s).join(' '), arProf(s), s.cm, c && c.ar].join(' '));
      s._hg = HAY_GEN;
    }
    return s._h;
  }

  /*@3.SECJ.200*/
  var AR_TITLE = null, AR_CAT = null;
  function arTitle(code) {
    if (!AR_TITLE) {
      if (!PLANS) return (AR_CAT && AR_CAT[code]) || '';
      AR_TITLE = {};
      PLANS.forEach(function (p) {
        (p.courses || []).forEach(function (c) {
          if (c.ta && !AR_TITLE[c.c]) AR_TITLE[c.c] = c.ta;
        });
      });
    }
    var a = AR_TITLE[code] || '', b = (AR_CAT && AR_CAT[code]) || '';
    return a && b && a !== b ? a + ' ' + b : (a || b);
  }
  function loadCourseNames() {
    fetch('../shared/courses_catalog.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        AR_CAT = {};
        Object.keys(d).forEach(function (k) {
          if (d[k] && d[k].name_ar) AR_CAT[k] = d[k].name_ar;
        });
        HAY_GEN++;
        if (state.all.length && state.q) apply();
      })
      .catch(function () { /*@3.SECJ.201*/ });
  }
  /*@3.SECJ.202*/
  /*@3.SECJ.391*/
  var DIRAR = null;
  function loadDirNames() {
    if (!window.GardenFaculty || !GardenFaculty.loadDir) return;
    GardenFaculty.loadDir(function (d) {
      if (!d || !d.people || !d.people.length) return;
      var byMail = {}, byName = {};
      /*@3.SECJ.404*/
      d.people.forEach(function (p) {
        if (!p.a) return;
        var rec = { a: p.a, s: p.s || 'ai' };
        if (p.e) byMail[String(p.e).toLowerCase()] = rec;
        var k = nameKey(p.n);
        if (k && !byName[k]) byName[k] = rec;
      });
      DIRAR = { byMail: byMail, byName: byName };
      HAY_GEN++;
      if (state.all.length) apply();
    });
  }
  function dirRecOf(p) {
    if (!DIRAR || !p) return null;
    if (p.e && DIRAR.byMail[String(p.e).toLowerCase()]) return DIRAR.byMail[String(p.e).toLowerCase()];
    var k = nameKey(p.n || p);
    return (k && DIRAR.byName[k]) || null;
  }
  function dirArOf(p) { var r = dirRecOf(p); return r ? r.a : ''; }

  /*@3.SECJ.405*/
  function profName(p) {
    var lat = (p && p.n) || p || '';
    var GF = window.GardenFaculty;
    if (!GF || !GF.pickName) return lat;
    var r = RATINGS ? rateOf(p) : null;
    if (r && r.name) {
      return GF.pickName({ ar: r.name, machine: !!r.mn, latin: r.en || lat });
    }
    var d = dirRecOf(p);
    return GF.pickName({ ar: d ? d.a : '', machine: !d || d.s === 'ai', latin: lat });
  }

  function arProf(s) {
    var out = [];
    (s.f || []).forEach(function (p) {
      var r = RATINGS ? rateOf(p) : null;
      if (r && r.name) out.push(r.name);
      /*@3.SECJ.393*/
      var a = dirArOf(p);
      if (a && out.indexOf(a) < 0) out.push(a);
    });
    return out.join(' ');
  }

  var OWNED = null;
  function ownedBy(code) {
    if (!OWNED) {
      OWNED = {};
      (PLANS || []).forEach(function (p) {
        (p.courses || []).forEach(function (c) {
          (OWNED[c.c] = OWNED[c.c] || {})[p.slug] = 1;
        });
      });
    }
    return OWNED[code] || null;
  }
  /*@3.SECJ.203*/
  function inCollege2(collegeKey, code) {
    var own = ownedBy(code);
    if (!own) return false;
    var ps = planProgramsIn(collegeKey);
    for (var i = 0; i < ps.length; i++) if (own[ps[i].slug]) return true;
    return false;
  }

  /*@3.SECJ.204*/
  var GRAD = null;
  function isGradCourse(code) {
    if (!GRAD) {
      GRAD = {};
      var no = {};
      (state.all || []).forEach(function (s) {
        var c = s.c; if (!c) return;
        var cl = s.rq && s.rq.cl;
        /*@3.SECJ.205*/
        if (!cl || !cl.length) return;
        if (cl.every(function (x) { return /^G/i.test(x); })) GRAD[c] = 1;
        else no[c] = 1;                 /*@3.SECJ.206*/
      });
      for (var k in no) delete GRAD[k];
    }
    return !!GRAD[code];
  }

  /*@3.SECJ.207*/
  function inProgram(slug, code) {
    var ix = planIndex(slug);
    if (!ix) return null;                       /*@3.SECJ.208*/
    if (ix[code]) return true;
    var own = ownedBy(code);
    if (own) return false;                      /*@3.SECJ.209*/
    if (isGradCourse(code)) return false;       /*@3.SECJ.210*/
    var m = /^([A-Za-z]+)/.exec(code || '');
    var subs = planSubjects(slug);
    return !!(m && subs && subs[m[1].toUpperCase()]);
  }

  /*@3.SECJ.211*/
  var STOP = { college: 1, and: 1, of: 1, the: 1, sc: 1, sciences: 1, science: 1, studies: 1 };
  function words(s) {
    return String(s || '').toLowerCase().replace(/[^a-z\s]/g, ' ')
      .split(/\s+/).filter(function (w) { return w.length > 2 && !STOP[w]; });
  }
  function bannerCollege(nameEn) {
    var want = words(nameEn), list = (TAX && TAX.Colleges) || [], best = null, bs = 0;
    if (!want.length) return '';
    for (var i = 0; i < list.length; i++) {
      var have = words(list[i].n), hit = 0;
      for (var j = 0; j < want.length; j++) if (have.indexOf(want[j]) >= 0) hit++;
      var sc = hit / want.length;
      if (sc > bs) { bs = sc; best = list[i].c; }
    }
    return bs >= 0.5 ? best : '';
  }
  /*@3.SECJ.212*/
  function progLabel(p) {
    var nm = (isAr() ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)) || p.slug;
    /*@3.SECJ.213*/
    var both = (p.name_ar || '') + ' ' + (p.name_en || '') + ' ' + p.slug;
    var grad = /ماجستير|master|^(em|ms|mba)-/i.test(both);
    nm = nm
      .replace(/^\s*برنامج\s+/, '')
      .replace(/^(البكالوريوس|البكالوريس|بكالوريوس\s+العلوم|بكالوريوس|الماجستير|ماجستير)\s*(في\s+)?/, '')
      .replace(/^(Bachelor|Master)(\s+Program)?(\s+of|\s+in)?\s+/i, '')
      .replace(/^(Science\s+in|العلوم\s+في)\s+/i, '')
      .trim();
    return nm + (grad ? t(' · ماجستير', ' · Master') : '');
  }

  /*@3.SECJ.214*/
  function planColleges() {
    if (!PLANS) return [];
    var seen = {}, out = [];
    PLANS.forEach(function (p) {
      var k = p.college_en || p.college_ar;
      if (!k) return;
      if (!seen[k]) {
        seen[k] = { key: k, ar: p.college_ar || k, en: p.college_en || k, n: 0 };
        out.push(seen[k]);
      }
      seen[k].n++;
    });
    return out.sort(function (a, b) { return b.n - a.n; });
  }
  function planProgramsIn(collegeKey) {
    if (!PLANS) return [];
    return PLANS.filter(function (p) {
      return !collegeKey || (p.college_en || p.college_ar) === collegeKey;
    });
  }

  function loadProf() {
    try { return JSON.parse(localStorage.getItem(PROF_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveProf(patch) {
    var p = loadProf();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) p[k] = patch[k];
    try { localStorage.setItem(PROF_KEY, JSON.stringify(p)); } catch (e) {}
    return p;
  }
  /*@3.SECJ.215*/
  function profReady(p) { return !!(p && (p.college || p.college_key) && p.gender); }

  /*@3.SECJ.216*/
  function passedSet(p) {
    var out = passedFromRecord();
    (p.passed_extra || []).forEach(function (c) { out[c] = 'me'; });
    return out;
  }

  /*@3.SECJ.217*/
  var LV_AR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
               'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
  function levelLabel(code, name) {
    var n = parseInt(code, 10);
    if (isFinite(n) && n >= 1 && n <= 10 && /^0?\d$/.test(String(code)))
      return isAr() ? ('المستوى ' + LV_AR[n]) : ('Level ' + n);
    return name || code;
  }
  function isStudyLevel(code) { return /^0?[1-9]$/.test(String(code)); }

  function taxName(cat, code) {
    var l = TAX && TAX[cat];
    if (l) for (var i = 0; i < l.length; i++) if (l[i].c === code) return l[i].n;
    return code;
  }

  /*@3.SECJ.218*/
  var PASS_FAIL = { F: 1, f: 1, W: 1, w: 1, IC: 1, DN: 1 };
  function passedFromRecord() {
    var out = {};
    function eat(courses) {
      (courses || []).forEach(function (c) {
        var code = String((c && c.code) || '').toUpperCase().replace(/\s+/g, '');
        if (!code) return;
        var g = (c && c.grade) || '';
        if (g && PASS_FAIL[g]) return;                 /*@3.SECJ.219*/
        out[code] = g || true;
      });
    }
    try {
      (JSON.parse(localStorage.getItem('semester_archive') || '[]') || [])
        .forEach(function (a) { eat(a && a.courses); });
    } catch (e) { /*@3.SECJ.220*/ }
    try {
      var g = JSON.parse(localStorage.getItem('gpa_grades') || 'null');
      ((g && g.semesters) || []).forEach(function (s) { if (s && !s.is_current) eat(s.courses); });
    } catch (e) { /*@3.SECJ.221*/ }
    return out;
  }

  /*@3.SECJ.222*/
  function courseIndex(filterFn, slug) {
    var m = {};
    state.all.forEach(function (s) {
      if (isJunk(s) || isPrep(s) || s.gone) return;
      if (filterFn && !filterFn(s)) return;
      var code = s.c; if (!code) return;
      var e = m[code];
      if (!e) {
        e = m[code] = { code: code, t: unent(s.t || ''), ch: parseFloat(s.ch) || 0,
                        lv: null, lvsrc: null, tr: null, n: 0 };
        var pl = slug ? planLevel(slug, code) : null;
        if (pl) { e.lv = pl; e.lvsrc = 'plan'; e.tr = planTracks(slug, code); }
      }
      e.n++;
      if (e.lvsrc === 'plan') return;             /*@3.SECJ.223*/
      var cl = s.rq && s.rq.cl;
      if (cl && cl.length) {
        var mn = Math.min.apply(null, cl.map(function (x) { return parseInt(x, 10); })
                                        .filter(function (x) { return x >= 1 && x <= 12; }));
        if (isFinite(mn) && (e.lv === null || mn < e.lv)) { e.lv = mn; e.lvsrc = 'banner'; }
      }
    });
    return m;
  }
  /*@3.SECJ.224*/
  function fullIndex(d) {
    var m = {}, ix = d.program ? planIndex(d.program) : null;
    if (ix) {
      for (var k in ix) {
        var c = ix[k];
        m[k] = { code: k, t: c.t || k, ch: c.h || 0, lv: c.l || null,
                 lvsrc: c.s || null, tr: c.tr || null, n: 0, off: true };
      }
    }
    /*@3.SECJ.225*/
    var live = courseIndex(myCourseFilter(d), d.program);
    for (var j in live) {
      var e = m[j];
      if (!e) { m[j] = live[j]; m[j].off = false; continue; }
      e.off = false; e.n = live[j].n;
      if (!e.ch) e.ch = live[j].ch;
      if (!e.lv) { e.lv = live[j].lv; e.lvsrc = live[j].lvsrc; }
    }
    return m;
  }

  /*@3.SECJ.226*/
  function myCourseFilter(d) {
    return function (s) {
      if (d.program) {
        var v = inProgram(d.program, s.c || '');
        if (v !== null) return v;
      }
      if (!s.rq) return false;                 /*@3.SECJ.227*/
      if (d.college && s.rq.co && s.rq.co.indexOf(d.college) < 0) return false;
      if (d.department && s.rq.dp && s.rq.dp.indexOf(d.department) < 0) return false;
      /*@3.SECJ.228*/
      return true;
    };
  }

  /*@3.SECJ.229*/
  function creditCap(grad) {
    var summer = false;
    var ts = state.terms || [];
    for (var i = 0; i < ts.length; i++) if (ts[i].term === state.term) {
      summer = /summer/i.test(ts[i].description || ''); break;
    }
    /*@3.SECJ.230*/
    if (summer) return { max: grad ? 12 : 9, min: 0, summer: true, grad: !!grad };
    return { max: grad ? 21 : 18, min: 11, summer: false, grad: !!grad };
  }

  /*@3.SECJ.231*/
  function prereqMet(code, passed) {
    var rows = (PRE && PRE[code]) || null;
    if (!rows || !rows.length) return true;             /*@3.SECJ.232*/
    var codes = rows.map(function (r) { return r.c; }).filter(Boolean);
    if (!codes.length) return true;                     /*@3.SECJ.233*/
    var anyAnd = rows.some(function (r) { return /and/i.test(r.op || ''); });
    return anyAnd
      ? codes.every(function (c) { return !!passed[c]; })
      : codes.some(function (c) { return !!passed[c]; });
  }
  var PRE = null;                                       /*@3.SECJ.234*/

  /*@3.SECJ.235*/
  var W = { step: 0, draft: null };
  var STEPS = [
    { ar: 'الكلّية', en: 'College' },
    { ar: 'التخصّص', en: 'Major' },
    { ar: 'الفرع', en: 'Campus' },
    { ar: 'المستوى', en: 'Level' },
    { ar: 'المجتاز', en: 'Completed' },
    { ar: 'خطة الفصل', en: 'This term' },
    /*@3.SECJ.394*/
    { ar: 'التنبيهات', en: 'Alerts' }
  ];
  var STEP_SAVE = 5;
  var STEP_ALERTS = 6;

  function openSetup() {
    var p = loadProf();
    /*@3.SECJ.236*/
    W.step = (p.sx_setup_at && profReady(p)) ? 3 : 0;
    W.draft = {
      college: p.college || '', department: p.department || '',
      college_key: p.college_key || '', program: p.program || '',
      plan_version: p.plan_version || '',
      watch: Array.isArray(p.watch) ? p.watch.slice() : [],
      campus_city: p.campus_city || '', gender: p.gender || '',
      levels: Array.isArray(p.levels) ? p.levels.slice() : [],
      only_my_level: !!p.only_my_level,
      grad: !!p.grad,
      /*@3.SECJ.237*/
      passed: (function () {
        var rec = passedFromRecord(), out = {};
        for (var k in rec) out[k] = 'rec';             /*@3.SECJ.238*/
        (p.passed_extra || []).forEach(function (c) { if (!out[c]) out[c] = 'me'; });
        return out;
      })(),
      plan: Array.isArray(p.plan) ? p.plan.slice() : []
    };
    $('#sx-setup').classList.add('on');
    if (!TAX) TAX = taxCacheGet();          /*@3.SECJ.239*/
    fetchPlans(function () { paintSetup(); });
    /*@3.SECJ.240*/
    if (!PRE && API && state.term) {
      fetch(API + '/v1/prereqs/' + state.term + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.prereqs) { PRE = d.prereqs; paintSetup(); } })
        .catch(function () { /*@3.SECJ.241*/ });
    }
    /*@3.SECJ.242*/
    if (API && (!TAX || taxCacheAge() > TAX_TTL)) {
      fetch(API + '/v1/taxonomy?term=' + encodeURIComponent(state.term || ''))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.taxonomy) { TAX = d.taxonomy; taxCacheSet(d.taxonomy); paintSetup(); }
        })
        .catch(function () { /*@3.SECJ.243*/ });
    }
    paintSetup();
  }
  function closeSetup() { $('#sx-setup').classList.remove('on'); }

  /*@3.SECJ.244*/
  function rqValues(key, filterFn) {
    var seen = {};
    state.all.forEach(function (s) {
      if (isJunk(s) || isPrep(s)) return;
      if (filterFn && !filterFn(s)) return;
      var a = s.rq && s.rq[key];
      if (a) a.forEach(function (v) { seen[v] = (seen[v] || 0) + 1; });
    });
    return Object.keys(seen).map(function (v) { return { c: v, n: seen[v] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }
  /*@3.SECJ.245*/
  function campusList() {
    var cities = {};
    state.all.forEach(function (s) {
      if (isJunk(s) || isPrep(s)) return;
      var c = campusOf(s.cm);
      if (c.g) cities[c.city] = (cities[c.city] || 0) + 1;
    });
    var seen = {}, out = [];
    Object.keys(CITY_AR).concat(Object.keys(cities)).forEach(function (c) {
      if (seen[c] || c === 'Undetermined' || /online/i.test(c)) return;
      seen[c] = 1;
      out.push({ c: c, n: cities[c] || 0 });
    });
    return out.sort(function (a, b) {
      return (b.n - a.n) ||
        (isAr() ? (CITY_AR[a.c] || a.c) : a.c)
          .localeCompare(isAr() ? (CITY_AR[b.c] || b.c) : b.c, isAr() ? 'ar' : 'en');
    });
  }
  function hasCampuses() { return campusList().length > 0; }
  function inCollege(s) {
    return !W.draft.college || (s.rq && s.rq.co && s.rq.co.indexOf(W.draft.college) >= 0);
  }

  /*@3.SECJ.246*/
  var ALT_NAMES = {
    '1440': { ar: '١٤٤٠/١٤٤١هـ — ٢٠١٩‑٢٠٢٠ وما قبلها', en: '1440/1441 AH — 2019-2020 and before' }
  };
  function ALT_LABEL(v, ar) {
    var n = ALT_NAMES[v];
    return n ? (ar ? n.ar : n.en) : v;
  }

  function genBtn(on, v, label) {
    return '<button class="sx-opt' + (on ? ' on' : '') + '" data-act="gen" data-v="' + esc(v) + '">' +
      '<span class="t">' + esc(label) + '</span></button>';
  }
  function optBtn(on, code, label, count, act) {
    return '<button class="sx-opt' + (on ? ' on' : '') + '" data-act="' + act +
      '" data-v="' + esc(code) + '">' +
      '<span class="t">' + esc(label) + '</span>' +
      (code ? '<span class="c">' + esc(code) + '</span>' : '') +
      (count != null ? '<span class="n">' + count + '</span>' : '') + '</button>';
  }

  function paintSetup() {
    var d = W.draft, h = '';
    /*@3.SECJ.247*/
    $('#sx-steps').innerHTML = STEPS.map(function (s, i) {
      return '<button type="button" class="sx-step' +
        (i === W.step ? ' on' : (i < W.step ? ' done' : '')) +
        '" data-step="' + i + '">' + t(s.ar, s.en) + '</button>';
    }).join('');
    $('#sx-setup-sub').textContent = t('الخطوة ', 'Step ') + (W.step + 1) + '/' + STEPS.length;

    if (W.step === 0) {
      /*@3.SECJ.248*/
      var pcols = planColleges();
      if (pcols.length) {
        /*@3.SECJ.249*/
        h = '<div class="sx-q">' + t('أي كلّية تدرس فيها؟', 'Which college are you in?') + '</div>' +
          '<div class="sx-opts col">' + pcols.map(function (x) {
            return '<button class="sx-opt' + (d.college_key === x.key ? ' on' : '') +
              '" data-act="colp" data-v="' + esc(x.key) + '">' +
              '<span class="t">' + esc(isAr() ? x.ar : x.en) + '</span>' +
              '<span class="n">' + x.n + '</span></button>';
          }).join('') + '</div>';
      } else {
        var cols = rqValues('co');            /*@3.SECJ.250*/
        h = '<div class="sx-q">' + t('أي كلّية تدرس فيها؟', 'Which college are you in?') + '</div>' +
          (cols.length
            ? '<div class="sx-opts">' + cols.map(function (x) {
                return optBtn(d.college === x.c, x.c, taxName('Colleges', x.c), x.n, 'col');
              }).join('') + '</div>'
            : '<div class="sx-req-none">' +
              t('لم تُحصد بيانات الأهلية لهذا الفصل بعد — جرّب فصلاً آخر أو أكمل لاحقاً.',
                'Eligibility data not harvested for this term yet.') + '</div>');
      }

    } else if (W.step === 1) {
      /*@3.SECJ.251*/
      var progs = planProgramsIn(d.college_key);
      if (progs.length) {
        /*@3.SECJ.252*/
        h = '<div class="sx-q">' + t('وما تخصّصك؟', 'And your major?') + '</div>' +
          '<div class="sx-opts col">' +
            '<button class="sx-opt' + (!d.program ? ' on' : '') +
              '" data-act="pgm" data-v="">' +
              '<span class="t">' + t('كل تخصّصات الكلّية', 'All majors in my college') +
              '</span></button>' +
            progs.map(function (p) {
              var lv = 0;
              (p.courses || []).forEach(function (c) { if (c.l) lv++; });
              return '<button class="sx-opt' + (d.program === p.slug ? ' on' : '') +
                '" data-act="pgm" data-v="' + esc(p.slug) + '">' +
                '<span class="t">' + esc(progLabel(p)) + '</span>' +
                (lv ? '<span class="n">' + lv + '</span>' : '') + '</button>';
            }).join('') + '</div>';
      } else {
        var deps = rqValues('dp', inCollege);   /*@3.SECJ.253*/
        h = '<div class="sx-q">' + t('وما تخصّصك؟', 'And your major?') + '</div>' +
          '<div class="sx-opts">' +
            optBtn(!d.department, '', t('كل تخصّصات الكلّية', 'All majors in my college'), null, 'dep') +
            deps.map(function (x) {
              return optBtn(d.department === x.c, x.c, taxName('Departments', x.c), x.n, 'dep');
            }).join('') + '</div>';
      }
      /*@3.SECJ.254*/
      h += '<div class="sx-hint">' + t('اختياريّ — واختيارُ «الكل» يعرض شعب كلّيتك كلَّها.',
                                        'Optional — “All” shows every section in your college.') + '</div>';

      /*@3.SECJ.255*/
      var altV = altVersionFor(d.program);
      if (altV) {
        h += '<label class="sx-switch"><input type="checkbox" id="sx-old-plan"' +
          (d.plan_version === altV ? ' checked' : '') + '><span><b>' +
          t('خطّتي هي الخطة القديمة (' + ALT_LABEL(altV, true) + ')',
            'I follow the old plan (' + ALT_LABEL(altV, false) + ')') + '</b><em>' +
          t('الافتراضيُّ الخطةُ الحالية. فعّلها إن كنتَ من دفعةٍ قديمة — فتُبنى ' +
            'مستوياتُك ومتطلباتُك على خطّتك أنت.',
            'Current plan by default. Turn this on if you started under the older plan — ' +
            'your levels and prerequisites will follow it.') + '</em></span></label>';
      }

    } else if (W.step === 2) {
      /*@3.SECJ.256*/
      var list = campusList();
      h = '<div class="sx-q">' + t('أنت طالب أم طالبة؟', 'Are you male or female?') + '</div>' +
        '<div class="sx-opts row">' +
          /*@3.SECJ.257*/
          genBtn(d.gender === 'Males', 'Males', t('طالب', 'Male')) +
          genBtn(d.gender === 'Females', 'Females', t('طالبة', 'Female')) +
        '</div>' +
        '<div class="sx-q" style="margin-top:1rem">' + t('وأي فرع حضوريّ؟', 'Which campus?') + '</div>' +
        (list.length
          ? '<div class="sx-opts">' + list.map(function (o) {
              /*@3.SECJ.258*/
              return '<button class="sx-opt' + (d.campus_city === o.c ? ' on' : '') +
                '" data-act="cty" data-v="' + esc(o.c) + '">' +
                '<span class="t">' + esc(isAr() ? (CITY_AR[o.c] || o.c) : o.c) + '</span>' +
                (o.n ? '<span class="n">' + o.n + '</span>' : '') + '</button>';
            }).join('') + '</div>'
          /*@3.SECJ.259*/
          : '<div class="sx-req-none">' +
            t('كلُّ شعب هذا الفصل «عن بعد» — فلا فرعَ حضوريٌّ يُختار.',
              'Every section this term is remote — no campus to pick.') + '</div>');

    } else if (W.step === 4) {
      /*@3.SECJ.260*/
      var idx = fullIndex(d);
      var codes = Object.keys(idx).sort();
      var myLv = d.levels.length ? Math.min.apply(null, d.levels.map(Number)) : 0;
      /*@3.SECJ.261*/
      var byLv = {};
      codes.forEach(function (c) {
        var L = PREP_CODE.test(c) ? 'P' : (idx[c].lv || 0);
        (byLv[L] = byLv[L] || []).push(c);
      });
      /*@3.SECJ.262*/
      if (!d._prefilled) {
        d._prefilled = true;
        codes.forEach(function (c) {
          /*@3.SECJ.263*/
          if (d.plan.indexOf(c) >= 0) return;
          if (!d.passed[c] && myLv && idx[c].lv && idx[c].lv < myLv) d.passed[c] = 'lv';
        });
      }
      var nRec = 0, nBelow = 0;
      codes.forEach(function (c) {
        if (d.passed[c] === 'rec') nRec++;
        else if (d.passed[c] === 'lv') nBelow++;
      });
      /*@3.SECJ.264*/
      h = '<div class="sx-q">' + t('ما الذي اجتزتَه؟', 'What have you completed?') + '</div>' +
        '<div class="sx-hint" style="margin:0 0 .8rem">' +
          t('خطةُ تخصّصك كاملةً (' + codes.length + ' مادة). عُلِّم <b>' + nRec +
            '</b> من سجلّك عندنا، و<b>' + nBelow + '</b> افتراضاً لأنها دون مستواك — صحّحها كما تشاء.',
            'Your full plan (' + codes.length + ' courses). <b>' + nRec +
            '</b> from your record, <b>' + nBelow + '</b> assumed (below your level).') +
          '</div>' +
        /*@3.SECJ.265*/
        Object.keys(byLv).sort(function (a, b) {
          return (a === 'P' ? -1 : Number(a) || 99) - (b === 'P' ? -1 : Number(b) || 99);
        }).map(function (L) {
          return '<div class="sx-ts-yr"><span>' +
            /*@3.SECJ.266*/
            (L === 'P' ? t('السنة التحضيرية', 'Preparatory year')
              : !Number(L) ? t('بلا مستوىً معلن', 'Level not stated')
              : levelLabel(String(Number(L)), '')) +
            '</span></div>' +
            '<div class="sx-cl">' + byLv[L].map(function (c) {
              var st = d.passed[c];
              return '<button type="button" class="sx-cl-i' + (st ? ' on' : '') +
                '" data-act="pass" data-v="' + esc(c) + '">' +
                '<span class="sx-box"><i class="fa-solid fa-check"></i></span>' +
                '<b>' + esc(c) + '</b><span class="t">' + esc(idx[c].t) + '</span>' +
                (st === 'rec' ? '<em class="rec">' + t('سجلّك', 'record') + '</em>' : '') +
                '</button>';
            }).join('') + '</div>';
        }).join('');

    } else if (W.step === 5) {
      /*@3.SECJ.267*/
      var ix = fullIndex(d);
      var eligible = Object.keys(ix).filter(function (c) {
        return !d.passed[c] && prereqMet(c, d.passed);
      }).sort(function (a, b) { return (ix[a].lv || 99) - (ix[b].lv || 99) || (a < b ? -1 : 1); });
      var open = eligible.filter(function (c) { return !ix[c].off; });
      /*@3.SECJ.268*/
      var later = eligible.filter(function (c) { return ix[c].off; });
      var blocked = Object.keys(ix).filter(function (c) {
        return !d.passed[c] && !ix[c].off && !prereqMet(c, d.passed);
      });
      var cap = creditCap(d.grad);
      var sum = d.plan.reduce(function (n, c) { return n + (ix[c] ? ix[c].ch : 0); }, 0);
      var over = sum > cap.max, under = cap.min && sum > 0 && sum < cap.min;
      h = '<div class="sx-q">' + t('ما تنوي تسجيله هذا الفصل؟', 'What will you register this term?') + '</div>' +
        '<div class="sx-cap' + (over ? ' over' : under ? ' under' : '') + '">' +
          '<b>' + sum + '</b> / ' + cap.max + ' ' + t('ساعة', 'credits') +
          '<span>' + (cap.summer ? t('الفصل الصيفي', 'Summer term') : t('فصل نظاميّ', 'Regular term')) +
            (cap.min ? t(' · الأدنى ' + cap.min, ' · min ' + cap.min) : '') +
            (cap.grad ? t(' · خريج', ' · graduating') : '') + '</span>' +
          (over || under ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '') +
        '</div>' +
        (under ? '<div class="sx-hint">' +
          t('أقلُّ من الحدّ الأدنى للفصل النظاميّ (' + cap.min + ' ساعة).',
            'Below the regular-term minimum (' + cap.min + ' credits).') + '</div>' : '') +
        '<label class="sx-switch" style="margin:.6rem 0"><input type="checkbox" id="sx-grad"' +
          (d.grad ? ' checked' : '') + '><span><b>' +
          t('أنا في فصل التخرّج', 'This is my graduating term') + '</b><em>' +
          t('ترفع الجامعةُ السقف إلى ٢١ ساعة (و١٢ في الصيفي) للخريجين وحدهم.',
            'The cap rises to 21 (12 in summer) for graduating students only.') + '</em></span></label>' +
        (open.length
          ? '<div class="sx-cl">' + open.map(function (c) {
              var on = d.plan.indexOf(c) >= 0;
              return '<button type="button" class="sx-cl-i' + (on ? ' on' : '') +
                '" data-act="plan" data-v="' + esc(c) + '">' +
                '<span class="sx-box"><i class="fa-solid fa-check"></i></span>' +
                '<b>' + esc(c) + '</b><span class="t">' + esc(ix[c].t) + '</span>' +
                /*@3.SECJ.269*/
                (ix[c].tr && ix[c].tr.length
                  ? '<em class="trk">' + esc(trackName(ix[c].tr)) + '</em>' : '') +
                '<em>' + (ix[c].ch || '؟') + t(' س', 'cr') + '</em></button>';
            }).join('') + '</div>'
          : '<div class="sx-req-none">' + t('لا مواد متاحة بهذه الشروط',
                                            'No eligible courses under these settings') + '</div>') +
        (later.length
          ? '<div class="sx-ts-yr" style="margin-top:1rem"><span>' +
              t('هذه المواد غير متاحة في هذا الفصل حتى الآن — اختر ما تريد ونُنبّهك فور توفّرها',
                'Not available this term yet — pick any and we’ll alert you when it opens') +
              '</span></div>' +
            '<div class="sx-cl">' + later.map(function (c) {
              var on = (d.watch || []).indexOf(c) >= 0;
              return '<button type="button" class="sx-cl-i off' + (on ? ' on' : '') +
                '" data-act="watch" data-v="' + esc(c) + '">' +
                '<span class="sx-box"><i class="fa-solid fa-bell"></i></span>' +
                '<b>' + esc(c) + '</b><span class="t">' + esc(ix[c].t) + '</span>' +
                '<em>' + (ix[c].ch || '؟') + t(' س', 'cr') + '</em></button>';
            }).join('') + '</div>'
          : '') +
        (blocked.length
          ? '<div class="sx-hint"><i class="fa-solid fa-lock"></i> ' +
            t(blocked.length + ' مادة متطلبُها غير متحقّق بعد: ',
              blocked.length + ' course(s) with unmet prerequisites: ') +
            '<b>' + esc(blocked.slice(0, 8).join('، ')) + '</b></div>'
          : '') +
        (PRE ? '' : '<div class="sx-hint">' +
          t('تُجلب المتطلبات… وقد تتغيّر القائمة بعد وصولها.',
            'Loading prerequisites… the list may change.') + '</div>');

    } else {
      /*@3.SECJ.270*/
      var pix = d.program ? planIndex(d.program) : null, lvs;
      if (pix) {
        var cnt = {};
        for (var pk in pix) if (pix[pk].l) {
          var kk = String(pix[pk].l);
          cnt[kk] = (cnt[kk] || 0) + 1;
          /*@3.SECJ.271*/
          if (pix[pk].pr && pix[pk].l === 1) cnt['2'] = (cnt['2'] || 0) + 1;
        }
        lvs = Object.keys(cnt).map(function (k) { return { c: k, n: cnt[k] }; });
      } else {
        lvs = rqValues('cl').filter(function (x) { return isStudyLevel(x.c); });
      }
      lvs.sort(function (a, b) { return parseInt(a.c, 10) - parseInt(b.c, 10); });
      h = '<div class="sx-q">' + t('ما مستواك الحالي؟', 'What is your current level?') + '</div>' +
        '<div class="sx-opts">' + lvs.map(function (x) {
          /*@3.SECJ.272*/
          return '<button class="sx-opt' + (d.levels.indexOf(x.c) >= 0 ? ' on' : '') +
            '" data-act="lvl" data-v="' + esc(x.c) + '">' +
            '<span class="t">' + esc(levelLabel(x.c, taxName('Classes', x.c))) + '</span>' +
            '<span class="n">' + x.n + '</span></button>';
        }).join('') + '</div>' +
        '<div class="sx-hint">' + t('يمكنك اختيار أكثر من مستوى إن كنت تسجّل خارج الخطة.',
                                    'Pick more than one if you register off-plan.') + '</div>' +
        /*@3.SECJ.273*/
        '<label class="sx-switch"><input type="checkbox" id="sx-only-lv"' +
          (d.only_my_level ? ' checked' : '') + '>' +
          '<span><b>' + t('أظهر شعب مستواي فقط', 'Show only my level’s sections') + '</b>' +
          '<em>' + t('مطفأة افتراضياً — إن أطفأتها رأيت كل شعب كلّيتك.',
                     'Off by default — leave it off to see your whole college.') + '</em></span></label>';
    }
    /*@3.SECJ.397*/
    if (W.step === STEP_ALERTS) h = alertsHtml();
    $('#sx-setup-body').innerHTML = h;
    if (W.step === STEP_ALERTS) paintAlerts();
    $('#sx-back').hidden = W.step === 0;
    /*@3.SECJ.400*/
    $('#sx-next').textContent = W.step === STEP_ALERTS ? t('تمّ', 'Done')
      : W.step === STEP_SAVE ? t('حفظ', 'Save') : t('التالي', 'Next');
    /*@3.SECJ.274*/
    var ok = W.step === 0 ? !!(d.college || d.college_key)
           : W.step === 2 ? !!(d.gender && (d.campus_city || !hasCampuses())) : true;
    $('#sx-next').disabled = !ok;
  }

  /*@3.SECJ.395*/
  function alertsHtml() {
    return '<div class="sx-q">' + t('تنبيهات المقاعد — كيف تصلك؟', 'Seat alerts — how do they reach you?') + '</div>' +
      '<div class="sx-alerts">' +
        '<div class="sx-acard" id="sx-a-sync">' +
          '<div class="sx-acard-h">' +
            '<i class="fa-solid fa-cloud" aria-hidden="true"></i>' +
            '<b>' + t('خزنتُك', 'Your vault') + '</b>' +
            '<span class="sx-astate" id="sx-a-sync-s">—</span>' +
          '</div>' +
          '<p class="sx-ahint">' + t(
            'مفتاحٌ واحدٌ يربط أجهزتك ببياناتك — بلا حساب ولا كلمة مرور. وبه يصل التنبيهُ إلى كلِّ أجهزتك لا إلى هذا المتصفّح وحدَه.',
            'One key links your devices to your data — no account, no password. With it, alerts reach every device of yours, not just this browser.') + '</p>' +
          '<button type="button" class="sx-mini sx-a-btn" id="sx-a-sync-go"></button>' +
        '</div>' +
        '<div class="sx-acard" id="sx-a-push">' +
          '<div class="sx-acard-h">' +
            '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
            '<b>' + t('إذنُ الإشعارات', 'Notification permission') + '</b>' +
            '<span class="sx-astate" id="sx-a-push-s">—</span>' +
          '</div>' +
          '<p class="sx-ahint" id="sx-a-push-h"></p>' +
          '<button type="button" class="sx-mini sx-a-btn" id="sx-a-push-go"></button>' +
        '</div>' +
      '</div>' +
      '<div class="sx-hint">' + t(
        'كلاهما اختياريّ — تتابع الشعبَ بدونهما وتفتح الصفحةَ لترى المقاعد.',
        'Both are optional — you can still watch sections and check seats by opening the page.') + '</div>';
  }

  function pushPerm() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  function paintAlerts() {
    var hasVault = false;
    try {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      hasVault = !!(k && /^v[0-9a-f]{32}$/.test(k));
    } catch (e) {}
    var ss = $('#sx-a-sync-s'), sb = $('#sx-a-sync-go');
    if (ss) {
      ss.textContent = hasVault ? t('مفعّلة', 'On') : t('غير مفعّلة', 'Off');
      ss.className = 'sx-astate ' + (hasVault ? 'is-ok' : 'is-off');
    }
    if (sb) {
      sb.textContent = hasVault ? t('إدارةُ الأجهزة', 'Manage devices') : t('أنشئ خزنة', 'Create a vault');
      sb.disabled = !(window.GardenSyncPanel && GardenSyncPanel.openModal);
    }

    var perm = pushPerm(), ps = $('#sx-a-push-s'), pb = $('#sx-a-push-go'), ph = $('#sx-a-push-h');
    var canPush = !!(window.GardenPush && GardenPush.supported && GardenPush.supported());
    if (ps) {
      ps.textContent = perm === 'granted' ? t('مسموح', 'Allowed')
        : perm === 'denied' ? t('محجوب', 'Blocked')
        : perm === 'unsupported' ? t('غير مدعوم', 'Unsupported') : t('لم يُطلب', 'Not asked');
      ps.className = 'sx-astate ' + (perm === 'granted' ? 'is-ok' : perm === 'denied' ? 'is-bad' : 'is-off');
    }
    if (ph) {
      ph.textContent = perm === 'denied'
        ? t('أوقف المتصفّحُ إشعاراتِ الموقع، ولا يُعاد الإذنُ من داخل الصفحة — افتح قفلَ العنوان في شريط المتصفّح ثم اسمح بالإشعارات.',
            'The browser blocked notifications for this site. A page cannot restore that — open the padlock in the address bar and allow notifications.')
        : perm === 'unsupported' || !canPush
        ? t('هذا المتصفّحُ لا يدعم الإشعاراتِ الدفعيّة. تبقى المتابعةُ تعمل، وتُقرأ عند فتح الصفحة.',
            'This browser does not support push. Watching still works — read your alerts when you open the page.')
        : hasVault
        ? t('يصلك التنبيهُ على كلِّ أجهزةِ خزنتك.', 'Alerts reach every device on your vault.')
        : t('بلا خزنةٍ يصل التنبيهُ إلى هذا المتصفّح وحدَه.',
            'Without a vault, alerts reach this browser only.');
    }
    if (pb) {
      pb.hidden = perm === 'granted' || perm === 'denied' || perm === 'unsupported' || !canPush;
      pb.textContent = t('اسمحْ بالإشعارات', 'Allow notifications');
    }
  }

  function askPush() {
    if (!('Notification' in window)) { paintAlerts(); return; }
    Notification.requestPermission().then(function () {
      if (window.GardenPush && GardenPush.subscribe) {
        GardenPush.subscribe().then(function () { paintAlerts(); }, function () { paintAlerts(); });
      } else paintAlerts();
    }, function () { paintAlerts(); });
  }

  function setupNext() {
    /*@3.SECJ.275*/
    if (W.step === 3) {
      var only = $('#sx-only-lv');
      if (only) W.draft.only_my_level = !!only.checked;
    }
    /*@3.SECJ.398*/
    if (W.step === STEP_ALERTS) { closeSetup(); return; }
    if (W.step === STEP_SAVE) {
      /*@3.SECJ.276*/
      var extra = Object.keys(W.draft.passed).filter(function (c) {
        return W.draft.passed[c] === 'me';
      });
      saveProf({
        college: W.draft.college, department: W.draft.department,
        /*@3.SECJ.277*/
        college_key: W.draft.college_key, program: W.draft.program,
        /*@3.SECJ.278*/
        plan_version: W.draft.plan_version || '',
        campus_city: W.draft.campus_city, gender: W.draft.gender,
        levels: W.draft.levels, only_my_level: W.draft.only_my_level,
        grad: W.draft.grad, passed_extra: extra, plan: W.draft.plan,
        watch: W.draft.watch || [],
        /*@3.SECJ.279*/
        level: loadProf().level || (W.draft.levels[0] ? String(parseInt(W.draft.levels[0], 10)) : ''),
        sx_setup_at: Date.now()
      });
      state.mine = 'on';
      paintMe(); apply();
      /*@3.SECJ.280*/
      if (GW() && GW().ready()) {
        GW().syncCourses(state.term, W.draft.watch || []).then(paintBells);
      }
      toast(t('حُفظ ملفّك — وسيصل إلى أجهزتك الأخرى', 'Saved — syncing to your devices'));
      /*@3.SECJ.399*/
      W.step = STEP_ALERTS; paintSetup();
      return;
    }
    W.step++; paintSetup();
  }

  /*@3.SECJ.281*/
  function paintMe() {
    var p = loadProf(), me = $('#sx-me'), cta = $('#sx-cta');
    if (!profReady(p)) {
      /*@3.SECJ.282*/
      var off = sessionStorage.getItem('sx_cta_off') === '1';
      cta.hidden = off;
      /*@3.SECJ.283*/
      me.hidden = !off;
      if (off) {
        me.innerHTML =
          '<button class="sx-me-chip sx-me-go" id="sx-me-edit">' +
            '<i class="fa-solid fa-user-gear"></i>' + t('أعدّ ملفّك', 'Set up profile') +
          '</button>' +
          '<span class="sx-me-txt">' +
            t('كل الشعب معروضةٌ الآن — والإعدادُ مرةً واحدةً يُصفّيها لك في كل جهاز.',
              'Showing every section — set up once and they filter themselves on every device.') +
          '</span>';
      }
      return;
    }
    cta.hidden = true; me.hidden = false;
    /*@3.SECJ.284*/
    if (p.program && !planOf(p.program) && !paintMe._w) {
      paintMe._w = 1;
      fetchPlans(function () { paintMe._w = 0; paintMe(); });
    }
    /*@3.SECJ.285*/
    var prog = planOf(p.program);
    var full = [
      prog ? (isAr() ? (prog.college_ar || prog.college_en) : (prog.college_en || prog.college_ar))
           : (p.college ? taxName('Colleges', p.college) : p.college_key),
      prog ? progLabel(prog) : (p.department ? taxName('Departments', p.department) : ''),
      (CITY_AR[p.campus_city] || p.campus_city),
      (isAr() ? (p.gender === 'Males' ? 'طلاب' : 'طالبات') : p.gender)
    ].filter(Boolean).join(' · ');

    var bits = [];
    if (p.plan && p.plan.length) {
      bits.push(t('خطة الفصل: ' + p.plan.length + ' مادة',
                  p.plan.length + ' planned course' + (p.plan.length > 1 ? 's' : '')));
    }
    if (p.watch && p.watch.length) {
      bits.push(t('بانتظار النزول: ' + p.watch.length, p.watch.length + ' awaited'));
    }
    if (p.only_my_level && p.levels && p.levels.length) {
      bits.push(p.levels.map(function (c) { return levelLabel(c, ''); }).join('، '));
    }
    /*@3.SECJ.286*/
    var mv = myPlanVersion(p);
    if (mv) bits.push(t('خطة ' + ALT_LABEL(mv, true), ALT_LABEL(mv, false) + ' plan'));
    /*@3.SECJ.287*/
    if (!bits.length) bits.push(prog ? progLabel(prog) : full);

    me.innerHTML =
      '<button class="sx-me-chip' + (state.mine === 'on' ? ' on' : '') + '" id="sx-me-toggle">' +
        '<i class="fa-solid fa-user-check"></i>' +
        (state.mine === 'on' ? t('مخصّص لي', 'Personalized') : t('عرض الكل', 'Showing all')) +
      '</button>' +
      '<span class="sx-me-txt" title="' + esc(full) + '">' + esc(bits.join(' · ')) + '</span>' +
      '<button class="sx-me-edit" id="sx-me-edit"><i class="fa-solid fa-pen"></i>' +
        '<span>' + t('تعديل', 'Edit') + '</span></button>';
  }

  /*@3.SECJ.288*/
  function profFilter(s) {
    if (state.mine !== 'on') return true;
    var p = loadProf();
    if (!profReady(p)) return true;
    var c = campusOf(s.cm);
    /*@3.SECJ.289*/
    if (c.g !== p.gender) return false;
    /*@3.SECJ.290*/
    if (p.campus_city && c.city !== p.campus_city && c.city !== 'Online') return false;
    /*@3.SECJ.291*/
    var plan = Array.isArray(p.plan) ? p.plan : [];
    var watch = Array.isArray(p.watch) ? p.watch : [];
    if (plan.length || watch.length) {
      return plan.indexOf(s.c) >= 0 || watch.indexOf(s.c) >= 0;
    }
    if (passedSet(p)[s.c]) return false;           /*@3.SECJ.292*/
    if (p.program) {
      var v = inProgram(p.program, s.c || '');
      if (v !== null) return v;
    }
    if (!s.rq) return true;                       /*@3.SECJ.293*/
    if (p.college && s.rq.co && s.rq.co.indexOf(p.college) < 0) return false;
    if (p.department && s.rq.dp && s.rq.dp.indexOf(p.department) < 0) return false;
    /*@3.SECJ.294*/
    if (p.only_my_level && p.levels && p.levels.length && s.rq.cl) {
      var hit = p.levels.some(function (l) { return s.rq.cl.indexOf(l) >= 0; });
      if (!hit) return false;
    }
    return true;
  }

  /*@3.SECJ.295*/
  var NARROW = window.matchMedia ? window.matchMedia('(max-width: 620px)') : { matches: false };
  /*@3.SECJ.296*/
  function closeAllPops() { if (window.GardenSelect) GardenSelect.closeAll(); }

  /*@3.SECJ.297*/
  function bind() {
    $('#sx-q').addEventListener('input', function (e) {
      state.q = e.target.value; clearTimeout(bind._t);
      bind._t = setTimeout(function () {
        apply();
        window.GardenEv('sect_search', { len: String(state.q || '').length });
      }, 180);
    });
    /*@3.SECJ.298*/
    $$('.gs-me:not([multiple])').forEach(function (host) {
      host.addEventListener('change', function () {
        var v = this.value;
        if (host.id === 'sx-sort') {
          state.sort = v; state.dir = '';       /*@3.SECJ.299*/
          paintSort(); queueMarquee(); apply();
        } else if (host.id === 'sx-college') {
          state.college = v; state.major = ''; paintCollegeMajor(); queueMarquee(); apply();
        } else if (host.id === 'sx-major') {
          state.major = v; paintCollegeMajor(); queueMarquee(); apply();
        } else if (PICK_BY_ID[host.id]) {
          var pk = PICK_BY_ID[host.id];
          state[pk] = v; pickPaint(pk); queueMarquee(); apply();
        } else {
          state.term = v; paintTermBtn(); queueMarquee(); loadTerm(v);
        }
      });
    });

    /*@3.SECJ.300*/
    var dirBtn = $('#sx-dir');
    if (dirBtn) dirBtn.addEventListener('click', function () {
      state.dir = sortDir() === 'asc' ? 'desc' : 'asc';
      paintSort(); queueMarquee(); apply();
    });

    $('#sx-more').addEventListener('click', render);
    /*@3.SECJ.301*/
    document.addEventListener('click', function (e) {
      var pk = e.target.closest('[data-pick]');
      if (pk) { e.stopPropagation(); basketToggle(pk.dataset.pick); return; }
      var sh = e.target.closest('[data-show]');
      if (sh) { e.stopPropagation(); showOneSection(sh.dataset.show); return; }
      if (e.target.closest('#sx-bk-add')) {
        var list = basket();
        var todo = list.filter(function (c) { return !schHas(c); });
        if (!todo.length) {
          toast(t('كلُّها في جدولك أصلاً', 'All of them are already in your schedule'));
          return;
        }
        var n = schRegister(todo);
        if (n) {
          paintBasket();
          toast(t('أُضيفت ' + n + ' شعبة إلى جدولك',
                  n + ' section' + (n > 1 ? 's' : '') + ' added to your schedule'));
        }
        return;
      }
      var cp = e.target.closest('#sx-bk-copy');
      if (cp) {
        var txt = basket().join(',');
        copyText(txt, t('نُسخت ' + basket().length + ' شعبة', basket().length + ' CRNs copied'));
        return;
      }
      if (e.target.closest('#sx-bk-only')) {
        state.only = state.only === 'on' ? 'off' : 'on';
        apply();
        return;
      }
      if (e.target.closest('#sx-bk-clear')) {
        /*@3.SECJ.302*/
        var all = basket();
        if (!all.length) return;
        var reg2 = schRegistered();
        var inSch = all.filter(function (c) { return reg2[String(c)]; });
        actionToast(
          t('ستُمسح ' + all.length + ' شعبةً من قائمتك',
            all.length + ' sections will be cleared from your list'),
          t('امسح', 'Clear'),
          function () {
            saveProf({ picks: { term: state.term, crns: [] } });
            state.only = 'off';
            paintBasket(); apply();
            if (!inSch.length) { toast(t('مُسحت القائمة', 'List cleared')); return; }
            actionToast(
              t('مُسحت — و' + inSch.length + ' منها ما زالت في جدولك',
                'Cleared — ' + inSch.length + ' of them are still in your schedule'),
              t('احذفها من الجدول', 'Remove from schedule'),
              function () {
                var n = 0;
                inSch.forEach(function (c) { n += schUnregister(c); });
                paintBasket();
                toast(n ? t('حُذفت من جدولك', 'Removed from your schedule')
                        : t('لم يبقَ منها شيء', 'Nothing left to remove'));
              }, 9000);
          }, 8000);
      }
    });
    /*@3.SECJ.303*/
    document.addEventListener('click', function (e) {
      if (state.grp !== 'on') return;
      if (e.target.closest('.sx-grp') || e.target.closest('.sx-modal') ||
          e.target.closest('#sx-setup') || e.target.closest('.sx-tools')) return;
      closeGroup();
    });
    /*@3.SECJ.304*/
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('.sx-modal.on') || $('#sx-setup.on')) return;
      closeGroup();
    });
    /*@3.SECJ.305*/
    $('#sx-grid').addEventListener('click', function (e) {
      var head = e.target.closest('.sx-grp-head');
      if (!head) return;
      var box = head.parentElement, code = box.dataset.code;
      var on = !box.classList.contains('on');
      /*@3.SECJ.306*/
      if (!on) { closeGroup(); return; }
      /*@3.SECJ.307*/
      if (grpReturn == null) grpReturn = window.scrollY;
      /*@3.SECJ.308*/
      openCourses = {};
      $$('.sx-grp.on').forEach(function (g) { g.classList.remove('on'); });
      $('#sx-grid').classList.toggle('has-open', on);
      if (on) {
        openCourses[code] = true;
        box.classList.add('on');
        var body = $('.sx-grp-body', box);
        if (!body.children.length) {
          body.innerHTML = state.view.filter(function (s) { return (s.c || '—') === code; })
            .map(card).join('');
        }
        /*@3.SECJ.309*/
        requestAnimationFrame(function () {
          var hdr = document.querySelector('.g-header');
          var off = hdr ? hdr.getBoundingClientRect().height : 0;
          var y = box.getBoundingClientRect().top + window.scrollY - off - 8;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        });
      }
    });
    $('#sx-clear').addEventListener('click', function () {
      state.cities = []; state.subjects = []; state.q = '';
      state.gender = 'all'; state.status = 'all'; state.mode = 'all'; state.days = 'all';
      state.prep = 'off';                    /*@3.SECJ.310*/
      state.mine = 'off'; paintMe();
      state.college = ''; state.major = ''; paintCollegeMajor();
      paintPicks(); queueMarquee();
      $('#sx-q').value = '';
      $$('.sx-chip').forEach(function (c) { c.classList.toggle('on', c.dataset.val === 'all'); });
      buildFilters(); paintMS('city'); paintMS('subject');
      apply();
    });

    $('#sx-cta-go').addEventListener('click', openSetup);
    $('#sx-cta-no').addEventListener('click', function () {
      sessionStorage.setItem('sx_cta_off', '1');
      paintMe();               /*@3.SECJ.311*/
    });
    $('#sx-setup-x').addEventListener('click', closeSetup);
    $('#sx-back').addEventListener('click', function () { if (W.step) { W.step--; paintSetup(); } });
    $('#sx-next').addEventListener('click', setupNext);
    $('#sx-steps').addEventListener('click', function (e) {
      var b = e.target.closest('.sx-step');
      if (!b) return;
      var i = parseInt(b.dataset.step, 10);
      /*@3.SECJ.312*/
      var d = W.draft;
      if (i > 0 && !(d.college || d.college_key)) return;
      if (i > 2 && !(d.gender && (d.campus_city || !hasCampuses()))) return;
      W.step = i; paintSetup();
    });
    $('#sx-setup-body').addEventListener('change', function (e) {
      if (e.target.id === 'sx-grad') { W.draft.grad = e.target.checked; paintSetup(); }
      if (e.target.id === 'sx-old-plan') {
        var av = altVersionFor(W.draft.program);
        W.draft.plan_version = e.target.checked ? av : '';
        /*@3.SECJ.313*/
        W.draft._prefilled = false;
        fetchAlt(W.draft.plan_version, function () { paintSetup(); });
        paintSetup();
      }
    });
    $('#sx-setup-body').addEventListener('click', function (e) {
      /*@3.SECJ.396*/
      if (e.target.closest('#sx-a-sync-go')) {
        if (window.GardenSyncPanel && GardenSyncPanel.openModal) {
          GardenSyncPanel.openModal({ onClose: paintAlerts });
          setTimeout(paintAlerts, 400);
        }
        return;
      }
      if (e.target.closest('#sx-a-push-go')) { askPush(); return; }
      var ci = e.target.closest('.sx-cl-i');
      if (ci) {
        var dv = ci.dataset.v, dd = W.draft;
        if (ci.dataset.act === 'pass') {
          if (dd.passed[dv]) delete dd.passed[dv]; else dd.passed[dv] = 'me';
        } else if (ci.dataset.act === 'watch') {
          dd.watch = dd.watch || [];
          var w = dd.watch.indexOf(dv);
          if (w >= 0) dd.watch.splice(w, 1); else dd.watch.push(dv);
        } else {
          var k = dd.plan.indexOf(dv);
          if (k >= 0) dd.plan.splice(k, 1); else dd.plan.push(dv);
        }
        paintSetup();
        return;
      }
      var b = e.target.closest('.sx-opt');
      if (!b) return;
      var v = b.dataset.v, act = b.dataset.act, d = W.draft;
      if (act === 'col') { if (d.college !== v) d.department = ''; d.college = v; }
      else if (act === 'dep') d.department = v;
      else if (act === 'colp') {
        if (d.college_key !== v) { d.program = ''; d._prefilled = false; }
        d.college_key = v;
        /*@3.SECJ.314*/
        var pc = planColleges().filter(function (x) { return x.key === v; })[0];
        d.college = bannerCollege(pc ? pc.en : v) || d.college;
      } else if (act === 'pgm') {
        if (d.program !== v) { d._prefilled = false; d.plan = []; }
        d.program = v;
        /*@3.SECJ.315*/
        if (d.plan_version && !altVersionFor(v)) d.plan_version = '';
      }
      else if (act === 'gen') d.gender = v;
      else if (act === 'cty') d.campus_city = v;
      else if (act === 'lvl') {
        var i = d.levels.indexOf(v);
        if (i >= 0) d.levels.splice(i, 1); else d.levels.push(v);
        d._prefilled = false;              /*@3.SECJ.316*/
      }
      paintSetup();
    });
    /*@3.SECJ.317*/
    $('#sx-me').addEventListener('click', function (e) {
      if (e.target.closest('#sx-me-edit')) { openSetup(); return; }
      if (e.target.closest('#sx-me-toggle')) {
        state.mine = state.mine === 'on' ? 'off' : 'on';
        savePrefs(); paintMe(); apply();
      }
    });

    $$('.sx-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var g = c.dataset.group;
        if (g === 'grp') {
          state.grp = state.grp === 'on' ? 'off' : 'on';
          c.classList.toggle('on', state.grp === 'on');
          openCourses = {};                 /*@3.SECJ.318*/
          apply();
          return;
        }
        if (g === 'prep') {
          /*@3.SECJ.319*/
          state.prep = state.prep === 'on' ? 'off' : 'on';
          c.classList.toggle('on', state.prep === 'on');
          /*@3.SECJ.320*/
          buildFilters(); apply();
          return;
        }
        $$('.sx-chip[data-group="' + g + '"]').forEach(function (x) { x.classList.toggle('on', x === c); });
        state[g] = c.dataset.val;
        apply();
      });
    });

    /*@3.SECJ.321*/
    $$('.gs-me[multiple]').forEach(function (host) {
      var key = host.dataset.key;
      host.addEventListener('change', function () {
        var picked = [];
        for (var i = 0; i < host.options.length; i++) {
          if (host.options[i].selected) picked.push(host.options[i].value);
        }
        if (key === 'city') state.cities = picked; else state.subjects = picked;
        markMS(key); queueMarquee(); apply();
      });
    });

    /*@3.SECJ.322*/
    document.addEventListener('click', function (e) {
      if (e.target.closest && (e.target.closest('.gs-pop') || e.target.closest('.gs'))) return;
      closeAllPops();
    });
    /*@3.SECJ.323*/
    /*@3.SECJ.378*/
    window.addEventListener('resize', function () { queueMarquee(); });

    /*@3.SECJ.324*/
    document.body.addEventListener('click', function (e) {
      /*@3.SECJ.325*/
      var pn = e.target.closest('[data-profrate]');
      if (pn) {
        /*@3.SECJ.385*/
        e.preventDefault();
        openProfRateNew(pn.getAttribute('data-profrate'), pn.getAttribute('data-profn'));
        return;
      }
      var pr = e.target.closest('[data-prof]');
      if (pr) {
        e.preventDefault();
        openProf(pr.getAttribute('data-prof'), pr.getAttribute('data-profn'));
        return;
      }
      /*@3.SECJ.386*/
      var rd = e.target.closest('[data-rate-dir]');
      if (rd && e.target.closest('#sx-modal')) {
        openProfRateNew('', rd.getAttribute('data-rate-dir'));
        return;
      }
      var rt = e.target.closest('[data-rate]');
      if (rt && e.target.closest('#sx-modal')) {
        var GF = window.GardenFaculty;
        var id = rt.getAttribute('data-rate');
        openProfRate(GF && GF.byId(id), id);
        return;
      }
      if (e.target.closest('#sx-modal') && e.target.closest('[data-copy]')) return;
      var cp = e.target.closest('[data-copy]');
      if (cp) { copy(cp.dataset.copy, cp); return; }

      /*@3.SECJ.326*/
      var bl = e.target.closest('[data-bell]');
      if (bl) { bellToggle(bl.getAttribute('data-bell'), bl.getAttribute('data-bk')); return; }
      var cw = e.target.closest('[data-cwatch]');
      if (cw) { courseWatchToggle(cw.getAttribute('data-cwatch')); return; }
      var wt = e.target.closest('[data-wtog]');
      if (wt) {
        var wc = wt.getAttribute('data-wcrn');
        GW().toggle(wt.getAttribute('data-wtog'), state.term, wc).then(function (r) {
          var box = $('#sx-modal-body');
          var old = $('.sx-wrows', box);
          if (old) {
            /*@3.SECJ.327*/
            var tmp = document.createElement('div');
            tmp.innerHTML = watchRowsHtml(wc);
            old.replaceWith($('.sx-wrows', tmp));
          }
          paintBells();
          if (r.error) toast(t('تعذّر حفظ المتابعة', 'Could not save the watch'), 2400);
          else if (r.on) pushNudge(t('سننبّهك', 'We will alert you'));
        });
        return;
      }
      var wd = e.target.closest('[data-wdel]');
      if (wd) {
        var p = wd.getAttribute('data-wdel').split('|');
        GW().toggle(p[0], p[1], p[2]).then(function () {
          $('#sx-modal-body').innerHTML = watchesHtml();
          paintBells();
        });
        return;
      }
      if (e.target.closest('#sx-watch')) { openWatches(); return; }
      var b = e.target.closest('[data-hist]');
      if (b) { openHistory(b.dataset.hist); return; }
      var f = e.target.closest('[data-fac]');
      if (f) { openFaculty(f.dataset.fac); return; }
      var q = e.target.closest('[data-reqs]');
      if (q) { openReqs(q.dataset.reqs); return; }
      if (e.target.closest('#sx-x') || e.target.id === 'sx-modal') closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(); closeSetup(); closeAllPops();
      }
      /*@3.SECJ.328*/
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) {
        e.preventDefault(); $('#sx-q').focus();
      }
    });

    /*@3.SECJ.329*/
    document.addEventListener('garden:languageChanged', function () {
      window.GardenSXLink.resetCampus();   /*@3.SECJ.330*/
      paintMS('city'); paintMS('subject'); paintMe();
      /*@3.SECJ.331*/
      if (state.terms) {
        $('#sx-term').innerHTML = termOptions(state.terms, state.term);
        paintTermBtn(); wireTermFoot();
      }
      paintSort(); paintPicks(); paintCollegeMajor(); queueMarquee();
      if ($('#sx-setup').classList.contains('on')) paintSetup();
      if (state.all.length) apply();
      if (_open) ({ fac: openFaculty, reqs: openReqs, hist: openHistory }[_open.kind])(_open.arg);
    });
  }

  /*@3.SECJ.332*/
  var TERM_AR = { First: 'الفصل الأول', Second: 'الفصل الثاني',
                  Third: 'الفصل الثالث', Summer: 'الفصل الصيفي' };
  var TERM_ORD = { First: 1, Second: 2, Third: 3, Summer: 4 };

  function parseTerm(x) {
    var d = String(x.description || '');
    /*@3.SECJ.333*/
    var m = d.match(/(First|Secon(?:d)?|Third|Summer)\s*Term\s*(\d{4})\s*-\s*(\d{4})/i);
    var dip = /diploma/i.test(d);
    if (m) {
      var kind = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      if (kind === 'Secon') kind = 'Second';
      return {
        year: m[2] + ' – ' + m[3], ord: (dip ? 10 : 0) + (TERM_ORD[kind] || 9),
        label: (isAr() ? TERM_AR[kind] : kind + ' Term') +
               (dip ? (isAr() ? ' · دبلوم' : ' · Diploma') : '')
      };
    }
    /*@3.SECJ.334*/
    var y = String(x.term || '').slice(0, 4);
    return {
      year: /^\d{4}$/.test(y) ? (y + ' – ' + (parseInt(y, 10) + 1)) : t('غير مصنّف', 'Unclassified'),
      ord: 99, label: d.replace(/\s*\(View Only\)\s*/i, '').trim() || x.term
    };
  }

  /*@3.SECJ.335*/
  function termOptions(ts, selected) {
    var order = [], groups = {};
    ts.forEach(function (x) {
      var p = parseTerm(x);
      if (!groups[p.year]) { groups[p.year] = []; order.push(p.year); }
      groups[p.year].push({ x: x, p: p });
    });
    /*@3.SECJ.336*/
    return order.map(function (yr) {
      var items = groups[yr].sort(function (a, b) { return a.p.ord - b.p.ord; });
      /*@3.SECJ.337*/
      return '<optgroup label="' + esc(yr) + '">' +
        items.map(function (o) {
          return '<option value="' + esc(o.x.term) + '"' +
            (o.x.term === selected ? ' selected' : '') +
            ' data-meta="' + esc(fmt(o.x.sections)) + '">' + esc(o.p.label) + '</option>';
        }).join('') + '</optgroup>';
    }).join('');
  }

  function termLabelOf(term) {
    var ts = state.terms || [];
    for (var i = 0; i < ts.length; i++) if (ts[i].term === term) {
      var p = parseTerm(ts[i]);
      return p.label + ' · ' + p.year;
    }
    return t('اختر فصلاً', 'Choose a term');
  }

  /*@3.SECJ.338*/
  var SORTS = [
    { v: 'code',  ar: 'رمز المادة',       en: 'Course code',    i: 'fa-hashtag' },
    { v: 'seats', ar: 'الأكثر مقاعداً',   en: 'Most seats',     i: 'fa-chair' },
    { v: 'full',  ar: 'الأقرب للامتلاء',  en: 'Closest to full', i: 'fa-fire' },
    { v: 'rating', ar: 'تقييم الأستاذ',   en: 'Instructor rating', i: 'fa-star',
      soon: true }
  ];
  /*@3.SECJ.339*/
  var RATINGS = null;                     /*@3.SECJ.340*/
  function loadRatings() {
    if (!API) return;
    GardenFetch('/v1/faculty/index.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.faculty) return;
        var byEmail = {}, byName = {};
        d.faculty.forEach(function (f) {
          if (f.e) byEmail[String(f.e).toLowerCase()] = f;
          if (f.ln) byName[nameKey(f.ln)] = f;
        });
        RATINGS = { byEmail: byEmail, byName: byName };
        HAY_GEN++;                       /*@3.SECJ.341*/
        paintSort();                     /*@3.SECJ.342*/
        if (state.all.length) apply();   /*@3.SECJ.343*/
      })
      .catch(function () { /*@3.SECJ.344*/ });
  }
  function nameKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  }
  function rateOf(p) {
    if (!RATINGS || !p) return null;
    if (p.e && RATINGS.byEmail[String(p.e).toLowerCase()]) return RATINGS.byEmail[String(p.e).toLowerCase()];
    var n = nameKey(p.n || p);
    return (n && RATINGS.byName[n]) || null;
  }
  /*@3.SECJ.345*/
  function rateRank(s) {
    var best = null;
    (s.f || []).forEach(function (p) {
      var r = rateOf(p);
      if (r && r.rk != null && (best === null || r.rk > best)) best = r.rk;
    });
    return best;
  }
  function rateChip(p) {
    var r = rateOf(p);
    /*@3.SECJ.389*/
    if (!RATINGS) return '';
    /*@3.SECJ.381*/
    if (!r || r.idx == null) {
      if (window.GardenFlags && !GardenFlags.get('ratings.faculty.enabled')) return '';
      var lbl = t('قيّم ' + ((p && p.n) || p || 'هذا الأستاذ'),
                  'Rate ' + ((p && p.n) || p || 'this instructor'));
      return '<button class="sx-rate sx-rate--add" data-profrate="' + esc((p && p.e) || '') +
        '" data-profn="' + esc((p && p.n) || p || '') +
        '" title="' + esc(lbl) + '" aria-label="' + esc(lbl) + '">' +
        '<i class="fa-solid fa-pen-to-square"></i></button>';
    }
    var col = r.idx >= 80 ? '#10b981' : r.idx >= 60 ? '#f59e0b' : r.idx >= 40 ? '#f97316' : '#ef4444';
    return '<button class="sx-rate' + (r.n < 3 ? ' is-small' : '') + '" style="color:' + col +
      '" data-prof="' + esc((p && p.e) || '') + '" data-profn="' + esc((p && p.n) || p || '') +
      '" title="' +
      esc(t('مؤشّر التقييم ' + r.idx + '٪ من ' + r.n + ' تقييماً — اضغط للتفاصيل',
            'Rating ' + r.idx + '% from ' + r.n + ' ratings — click for details')) + '">' +
      '<i class="fa-solid fa-star"></i>' + r.idx + '</button>';
  }

  /*@3.SECJ.346*/
  function openProf(email, bannerName) {
    var GF = window.GardenFaculty;
    if (!GF) return;
    openModal('fa-chalkboard-user', bannerName || t('الأستاذ', 'Instructor'));
    GF.load(function () {
      var f = (email && GF.byEmail(email)) || GF.byBannerName(bannerName);
      var box = $('#sx-modal-body');
      GF.wire($('#sx-modal'), { onSent: function () { closeModal(); } });
      _open = { kind: 'prof', arg: email || bannerName };
      if (f) {
        $('#sx-modal-title').textContent = GF.nameOf(f);
        box.innerHTML = GF.detailHtml(f, { base: '', full: 1 });
        return;
      }
      /*@3.SECJ.382*/
      box.innerHTML = '<div class="sx-state"><i class="fa-solid fa-spinner fa-spin"></i></div>';
      GF.loadDir(function () {
        var p = (email && GF.dirByEmail(email)) || GF.dirByName(bannerName);
        if (p) {
          $('#sx-modal-title').textContent = p.a || p.n;
          box.innerHTML = GF.dirDetailHtml(p, { base: '' });
          return;
        }
        /*@3.SECJ.347*/
        box.innerHTML =
          '<div class="fc-d-head"><i class="fa-solid fa-user-slash fc-empty-i"></i>' +
            '<div class="fc-d-h-t"><div class="fc-d-sub">' +
            t('لا تقييماتٍ لهذا الأستاذ بعد', 'No ratings for this instructor yet') +
            '</div></div></div>' +
          (email ? '<div class="fc-d-mail">' +
            '<button class="fc-go" data-copy="' + esc(email) + '">' +
              '<i class="fa-regular fa-copy"></i>' + t('انسخ البريد', 'Copy email') +
              '<span class="fc-go-n ltr">' + esc(email) + '</span></button>' +
            '<a class="fc-go" href="mailto:' + esc(email) + '">' +
              '<i class="fa-regular fa-envelope"></i>' + t('راسله', 'Email') + '</a></div>' : '') +
          '<div class="fc-d-acts"><button class="sx-primary fc-rate" data-rate="' +
            esc(bannerName || '') + '"><i class="fa-solid fa-pen-to-square"></i>' +
            t('كن أوّل من يقيّمه', 'Be the first to rate them') + '</button></div>';
      });
    });
  }

  /*@3.SECJ.387*/
  function openProfRateNew(email, bannerName) {
    var GF = window.GardenFaculty;
    if (!GF) return;
    openModal('fa-pen-to-square', t('قيّم الأستاذ', 'Rate the instructor'));
    $('#sx-modal-body').innerHTML =
      '<div class="sx-state"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    GF.load(function () {
      var f = (email && GF.byEmail(email)) || GF.byBannerName(bannerName);
      if (f) {
        openProfRate(f, bannerName);
        GF.wire($('#sx-modal'), { onSent: function () { closeModal(); } });
        return;
      }
      GF.loadDir(function () {
        var p = (email && GF.dirByEmail(email)) || GF.dirByName(bannerName);
        GF.resetVals();
        $('#sx-modal-body').innerHTML = GF.rateHtml(null, { dir: p });
        /*@3.SECJ.388*/
        if (!p && bannerName) {
          var w = $('#fc-r-who', $('#sx-modal'));
          if (w) w.value = bannerName;
        }
        GF.wire($('#sx-modal'), { onSent: function () { closeModal(); } });
      });
    });
  }

  function openProfRate(f, fallbackName) {
    var GF = window.GardenFaculty;
    GF.resetVals();
    $('#sx-modal-title').textContent = t('قيّم الأستاذ', 'Rate the instructor');
    $('#sx-modal-body').innerHTML = GF.rateHtml(f, {});
    if (!f && fallbackName) {
      var w = $('#fc-r-who', $('#sx-modal'));
      if (w) w.value = fallbackName;
    }
    GF.wire($('#sx-modal'), { onSent: function () { closeModal(); } });
  }
  /*@3.SECJ.348*/
  var DIR_DEFAULT = { code: 'asc', seats: 'desc', full: 'desc', rating: 'desc' };
  function sortDir() { return state.dir || DIR_DEFAULT[state.sort] || 'asc'; }
  /*@3.SECJ.349*/
  function paintSort() {
    var host = $('#sx-sort');
    var d = sortDir();
    host.innerHTML = SORTS.map(function (s) {
      var off = s.soon && !RATINGS;
      return '<option value="' + s.v + '"' + (state.sort === s.v ? ' selected' : '') +
        (off ? ' disabled data-meta="' + esc(t('قريباً', 'soon')) + '"' : '') +
        '>' + esc(t('ترتيب: ', 'Sort: ') + t(s.ar, s.en)) + '</option>';
    }).join('');
    var db = $('#sx-dir');
    if (db) {
      var asc = d === 'asc';
      db.innerHTML = '<i class="fa-solid ' +
        (asc ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') + '"></i>';
      db.setAttribute('aria-label', t(asc ? 'تصاعديّ' : 'تنازليّ', asc ? 'Ascending' : 'Descending'));
      db.title = db.getAttribute('aria-label');
      db.setAttribute('data-dir', d);
    }
  }
  function paintTermBtn() { if (window.GardenSelect) GardenSelect.sync($('#sx-term')); }

  /*@3.SECJ.350*/
  var TERM_WATCH = { kind: 'term', term: '*', target: '*' };

  function termWatchOn() {
    return !!(GW() && GW().has(TERM_WATCH.kind, TERM_WATCH.term, TERM_WATCH.target));
  }

  function termFootHtml() {
    var on = termWatchOn();
    return '<button type="button" class="gs-foot-b' + (on ? ' is-on' : '') +
      '" data-term-watch aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<i class="fa-solid fa-' + (on ? 'bell' : 'bell-slash') + '" aria-hidden="true"></i>' +
      '<span>' + esc(on
        ? t('سأنبّهك عند إضافة فصلٍ جديد', 'You’ll be alerted when a new term lands')
        : t('نبّهني عند إضافة فصلٍ جديد', 'Alert me when a new term lands')) + '</span></button>';
  }

  function wireTermFoot() {
    if (!window.GardenSelect || !GardenSelect.foot || !GW()) return;
    GardenSelect.foot('#sx-term', termFootHtml(), function (e) {
      if (!e.target.closest('[data-term-watch]')) return;
      GW().toggle(TERM_WATCH.kind, TERM_WATCH.term, TERM_WATCH.target).then(function (r) {
        /*@3.SECJ.351*/
        wireTermFoot();
        toast(r && r.ok
          ? (termWatchOn() ? t('تم — سيصلك خبرُ أوّلِ فصلٍ ينزل', 'Done — you’ll hear about the next term')
                           : t('أُلغيت المتابعة', 'Watch removed'))
          : t('تعذّر الحفظ — حاول ثانيةً', 'Could not save — try again'));
      });
    });
  }

  /*@3.SECJ.352*/
  var MODES = [
    { v: 'all',    ar: 'كل الطرق',      en: 'All methods',   i: 'fa-chalkboard-user' },
    { v: 'person', ar: 'حضوري كاملاً',   en: 'On campus',     i: 'fa-building' },
    { v: 'mix',    ar: 'مختلط',         en: 'Hybrid',        i: 'fa-shuffle' },
    { v: 'remote', ar: 'عن بعد كاملاً',  en: 'Fully remote',  i: 'fa-wifi' }
  ];
  var DAYPATS = [
    { v: 'all',     ar: 'كل الأيام',      en: 'All days',   i: 'fa-calendar-week' },
    { v: 'sun_tue', ar: 'أحد وثلاثاء',    en: 'Sun & Tue',  i: 'fa-calendar-day' },
    { v: 'mon_wed', ar: 'اثنين وأربعاء',  en: 'Mon & Wed',  i: 'fa-calendar-day' },
    { v: 'thu',     ar: 'الخميس وحده',    en: 'Thursday only', i: 'fa-calendar-day' },
    /*@3.SECJ.353*/
    { v: 'other',   ar: 'نمطٌ آخر',       en: 'Other pattern', i: 'fa-calendar-plus', hideIfEmpty: true }
  ];
  var GENDERS = [
    { v: 'all',     ar: 'كلا الجنسين', en: 'Both genders', i: 'fa-venus-mars' },
    { v: 'Males',   ar: 'شعب الطلاب',  en: 'Male sections',   i: 'fa-mars' },
    { v: 'Females', ar: 'شعب الطالبات', en: 'Female sections', i: 'fa-venus' }
  ];
  /*@3.SECJ.354*/
  var STATUSES = [
    { v: 'all',  ar: 'كل الشعب',    en: 'All sections', i: 'fa-layer-group' },
    { v: 'open', ar: 'بها مقاعد',   en: 'Open',         i: 'fa-circle-dot' },
    { v: 'full', ar: 'ممتلئة',      en: 'Full',         i: 'fa-circle' },
    { v: 'gone', ar: 'غير معروضة',  en: 'Not listed',   i: 'fa-circle-xmark', hideIfEmpty: true }
  ];
  var PICKS = {
    mode:   { id: 'sx-mode',   list: MODES,    of: modeOf },
    days:   { id: 'sx-days',   list: DAYPATS,  of: dayPat },
    gender: { id: 'sx-gender', list: GENDERS,  of: function (s) { return campusOf(s.cm).g || ''; } },
    status: { id: 'sx-status', list: STATUSES, of: function (s) { return s.gone ? 'gone' : (s.a > 0 ? 'open' : 'full'); } }
  };

  /*@3.SECJ.355*/
  function pickPaint(key) {
    var cfg = PICKS[key], host = $('#' + cfg.id);
    if (!host) return;
    var cnt = {};
    pool().forEach(function (s) { var v = cfg.of(s); cnt[v] = (cnt[v] || 0) + 1; });
    var shown = cfg.list.filter(function (o) { return !o.hideIfEmpty || cnt[o.v]; });
    /*@3.SECJ.356*/
    if (!shown.some(function (o) { return o.v === state[key]; })) state[key] = 'all';
    /*@3.SECJ.357*/
    host.innerHTML = shown.map(function (o) {
      return '<option value="' + o.v + '"' + (state[key] === o.v ? ' selected' : '') +
        (o.v === 'all' ? '' : ' data-meta="' + (cnt[o.v] || 0) + '"') +
        '>' + esc(t(o.ar, o.en)) + '</option>';
    }).join('');
    var gw = host.closest ? host.closest('.gs') : null;
    (gw || host).classList.toggle('is-filtering', state[key] !== 'all');
  }
  function paintPicks() { Object.keys(PICKS).forEach(pickPaint); }
  var PICK_BY_ID = {};
  Object.keys(PICKS).forEach(function (k) { PICK_BY_ID[PICKS[k].id] = k; });

  /*@3.SECJ.358*/
  function tsItem(on, v, label, count) {
    return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') +
      (count != null ? ' data-meta="' + count + '"' : '') + '>' + esc(label) + '</option>';
  }
  function paintCollegeMajor() {
    var ch = $('#sx-college'), mh = $('#sx-major');
    if (!ch || !mh) return;
    var cols = planColleges();
    ch.hidden = mh.hidden = !cols.length;
    if (!cols.length) return;

    ch.innerHTML =
      tsItem(!state.college, '', t('كل الكليات', 'All colleges'), null) +
      cols.map(function (c) {
        return tsItem(state.college === c.key, c.key, isAr() ? c.ar : c.en, c.n);
      }).join('');
    /*@3.SECJ.359*/
    (ch.closest('.gs') || ch).classList.toggle('is-filtering', !!state.college);

    /*@3.SECJ.360*/
    var progs = planProgramsIn(state.college);
    if (state.major && !progs.some(function (p) { return p.slug === state.major; })) state.major = '';
    mh.innerHTML =
      tsItem(!state.major, '', t('كل التخصصات', 'All majors'), null) +
      progs.map(function (p) {
        return tsItem(state.major === p.slug, p.slug, progLabel(p), null);
      }).join('');
    (mh.closest('.gs') || mh).classList.toggle('is-filtering', !!state.major);
  }

  function boot() {
    if (!API) {
      $('#sx-grid').innerHTML = '<div class="sx-state">' +
        t('خدمة الكتالوج غير مهيّأة', 'Catalog service not configured') + '</div>';
      return;
    }
    var savedTerm = loadPrefs();
    bind();
    /*@3.SECJ.361*/
    try {
      var qp = new URLSearchParams(location.search).get('q');
      if (qp) { state.q = qp; $('#sx-q').value = qp; }
    } catch (_) {}
    loadRatings();
    /*@3.SECJ.392*/
    if (window.requestIdleCallback) requestIdleCallback(loadDirNames, { timeout: 4000 });
    else setTimeout(loadDirNames, 1200);
    loadCourseNames();
    /*@3.SECJ.362*/
    if (GW() && GW().ready()) {
      GW().on(function () { paintBells(); });
      GW().load();
    }
    /*@3.SECJ.363*/
    $$('.sx-chip').forEach(function (c) {
      c.classList.toggle('on', state[c.dataset.group] === c.dataset.val);
    });
    paintSort(); paintPicks();
    /*@3.SECJ.364*/
    fetchPlans(function () { paintCollegeMajor(); apply(); });
    paintCollegeMajor();

    /*@3.SECJ.365*/
    GardenFetch('/v1/terms')
      .then(function (r) { return r.ok ? r.json() : { terms: [] }; })
      .then(function (d) {
        var ts = (d.terms || []).filter(function (x) { return x.sections > 0; });
        if (!ts.length) throw new Error('no-terms');

        /*@3.SECJ.366*/
        var ACTIVE = ['EMPTY', 'ARMED', 'LIVE', 'QUIET', 'POST'];
        var live = ts.filter(function (x) { return ACTIVE.indexOf(x.phase) >= 0; });
        var pick = (live.length ? live : ts).slice().sort(function (a, b) {
          return b.sections - a.sections;
        })[0];
        /*@3.SECJ.367*/
        if (savedTerm && ts.some(function (x) { return x.term === savedTerm; })) {
          pick = ts.filter(function (x) { return x.term === savedTerm; })[0];
        }

        state.terms = ts;                    /*@3.SECJ.368*/
        state.term = pick.term;
        $('#sx-term').innerHTML = termOptions(ts, pick.term);
        paintTermBtn(); paintSort(); wireTermFoot();
        return loadTerm(pick.term);
      })
      .catch(function () {
        $('#sx-grid').innerHTML = '<div class="sx-state">' +
          '<i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر جلب قائمة الفصول', 'Could not load terms') + '</div>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
