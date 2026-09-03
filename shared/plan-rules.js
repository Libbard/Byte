/*@3.PLRJ.1*/
(function () {
  'use strict';

  var PL_KEY = 'sx_plans', PL_VER = 6, PL_TTL = 30 * 24 * 3600 * 1000;
  var RU_KEY = 'sx_rules', RU_VER = 1, RU_TTL = 14 * 24 * 3600 * 1000;
  var MAX_LEVEL = 12, FULL_MASK = (1 << MAX_LEVEL) - 1;
  var PREP_RE = /^[A-Za-z]+0/;

  var PLANS = null, RULES = null, TERM = null;
  var loadingPlans = false, loadingRules = false;
  var planWait = [], ruleWait = [];

  function api() {
    return (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  }
  function readJSON(k) {
    try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  function plansFromCache() {
    var v = readJSON(PL_KEY);
    if (!v || !v.d || v.v !== PL_VER) return null;
    return Array.isArray(v.d) ? v.d : (v.d.programs || null);
  }
  function plansAge() {
    var v = readJSON(PL_KEY);
    return v && v.t ? Date.now() - v.t : Infinity;
  }

  function loadPlans(cb) {
    PLANS = PLANS || plansFromCache();
    if (PLANS && plansAge() < PL_TTL) { cb(PLANS); return; }
    if (!api()) { cb(PLANS); return; }
    planWait.push(cb);
    if (loadingPlans) return;
    loadingPlans = true;
    fetch(api() + '/v1/plans?r=' + PL_VER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.programs) {
          PLANS = d.programs;
          writeJSON(PL_KEY, { t: Date.now(), v: PL_VER, d: d });
        }
      })
      .catch(function () {})
      .then(function () {
        loadingPlans = false;
        var q = planWait; planWait = [];
        q.forEach(function (f) { try { f(PLANS); } catch (e) {} });
      });
  }

  function programs() { return PLANS || plansFromCache() || []; }
  function program(slug) {
    var ps = programs();
    for (var i = 0; i < ps.length; i++) if (ps[i].slug === slug) return ps[i];
    return null;
  }
  function courses(slug) { var p = program(slug); return (p && p.courses) || []; }

  function fCode(c) { return c && (c.c != null ? c.c : c.code); }
  function fCh(c) { var v = c && (c.h != null ? c.h : c.ch); return v == null ? 0 : (+v || 0); }
  function fPrep(c) { return !!c && (c.pr === true || PREP_RE.test(String(fCode(c) || ''))); }
  function fPre(c) { return (c && (c.p || c.prereq)) || []; }
  function planLevel(c) {
    if (!c) return null;
    if (fPrep(c)) return 0;
    var lv = parseInt(c.l != null ? c.l : c.level, 10);
    return isNaN(lv) ? null : lv;
  }

  var _byCode = {};
  function courseBy(slug, code) {
    if (!code) return null;
    var ix = _byCode[slug || ''];
    if (!ix) {
      ix = _byCode[slug || ''] = {};
      courses(slug).forEach(function (c) { var k = fCode(c); if (k) ix[k] = c; });
    }
    return ix[code] || null;
  }
  function dropIndex() { _byCode = {}; }

  /*@3.PLRJ.5*/
  function levelSpan(slug) {
    var cs = courses(slug), lo = null, hi = null, prep = false;
    cs.forEach(function (c) {
      if (fPrep(c)) { prep = true; return; }
      var lv = planLevel(c);
      if (lv === null || lv <= 0) return;
      if (lo === null || lv < lo) lo = lv;
      if (hi === null || lv > hi) hi = lv;
    });
    if (lo === null) return { lo: 1, hi: 8, prep: false, known: false };
    return { lo: lo, hi: hi, prep: prep, known: true };
  }

  function rulesFromCache() {
    var v = readJSON(RU_KEY);
    if (!v || v.v !== RU_VER || !v.lv) return null;
    return v;
  }
  function rulesAge() {
    var v = readJSON(RU_KEY);
    return v && v.t ? Date.now() - v.t : Infinity;
  }

  function numLevels(list) {
    var out = 0;
    (list || []).forEach(function (v) {
      var s = String(v == null ? '' : v).trim();
      if (!/^\d{1,2}$/.test(s)) return;
      var n = parseInt(s, 10);
      if (n >= 1 && n <= MAX_LEVEL) out |= (1 << (n - 1));
    });
    return out;
  }

  /*@3.PLRJ.2*/
  /*@3.PLRJ.3*/
  function buildIndex(term, sections) {
    var allow = {}, known = {};
    (sections || []).forEach(function (s) {
      var code = s && s.c, rq = s && s.rq;
      if (!code || rq == null) return;
      known[code] = 1;
      var must = numLevels(rq.cl);
      var deny = numLevels((rq.x || {}).cl);
      var m = (must || FULL_MASK) & ~deny;
      allow[code] = (allow[code] || 0) | m;
    });
    var lv = {}, kn = [];
    Object.keys(known).forEach(function (code) {
      kn.push(code);
      var m = allow[code] || 0;
      if (m && m !== FULL_MASK) lv[code] = m;
    });
    kn.sort();
    return { v: RU_VER, t: Date.now(), term: String(term || ''), lv: lv, kn: kn.join(','), pre: {} };
  }

  function absorbCatalog(term, sections) {
    if (!sections || !sections.length) return null;
    var built = buildIndex(term, sections);
    var old = rulesFromCache();
    if (old && old.pre && old.term === built.term) built.pre = old.pre;
    RULES = built; TERM = built.term;
    writeJSON(RU_KEY, built);
    return built;
  }

  function absorbPrereqs(term, prereqs) {
    var r = RULES || rulesFromCache() || { v: RU_VER, t: Date.now(), term: String(term || ''), lv: {}, kn: '' };
    if (String(r.term || '') !== String(term || '')) { r.lv = r.lv || {}; r.kn = r.kn || ''; r.term = String(term || ''); }
    r.pre = prereqs || {};
    r.t = Date.now();
    RULES = r; TERM = r.term;
    writeJSON(RU_KEY, r);
    return r;
  }

  function liveTerm(cb) {
    if (TERM) { cb(TERM); return; }
    var r = rulesFromCache();
    if (r && r.term) { TERM = r.term; cb(TERM); return; }
    if (!api()) { cb(null); return; }
    fetch(api() + '/v1/terms')
      .then(function (r2) { return r2.ok ? r2.json() : null; })
      .then(function (d) {
        var ts = (d && d.terms) || [];
        var best = null;
        ts.forEach(function (t) {
          if (!/^\d{6}$/.test(String(t.term || ''))) return;
          if (!best || String(t.term) > String(best)) best = String(t.term);
        });
        TERM = best; cb(best);
      })
      .catch(function () { cb(null); });
  }

  /*@3.PLRJ.4*/
  function loadRules(cb) {
    RULES = RULES || rulesFromCache();
    var fresh = RULES && rulesAge() < RU_TTL && RULES.kn && RULES.pre;
    if (fresh) { cb(RULES); return; }
    if (!api()) { cb(RULES); return; }
    ruleWait.push(cb);
    if (loadingRules) return;
    loadingRules = true;
    liveTerm(function (term) {
      if (!term) { finish(); return; }
      var needCat = !(RULES && RULES.kn && RULES.term === term && rulesAge() < RU_TTL);
      var jobs = [];
      if (needCat) {
        jobs.push(fetch(api() + '/v1/catalog/' + term + '.json')
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { if (d && d.sections) absorbCatalog(term, d.sections); })
          .catch(function () {}));
      }
      jobs.push(fetch(api() + '/v1/prereqs/' + term + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.prereqs) absorbPrereqs(term, d.prereqs); })
        .catch(function () {}));
      Promise.all(jobs).then(finish, finish);
    });
    function finish() {
      loadingRules = false;
      RULES = RULES || rulesFromCache();
      var q = ruleWait; ruleWait = [];
      q.forEach(function (f) { try { f(RULES); } catch (e) {} });
    }
  }

  function rules() { return RULES || (RULES = rulesFromCache()); }

  function restrictionsKnown() {
    var r = rules();
    return !!(r && r.kn);
  }
  function courseKnown(code) {
    var r = rules();
    if (!r || !r.kn) return false;
    if (!r._kn) {
      r._kn = {};
      String(r.kn).split(',').forEach(function (c) { if (c) r._kn[c] = 1; });
    }
    return !!r._kn[code];
  }

  function levelAllows(code, lv) {
    var n = parseInt(lv, 10);
    if (!n || n < 1 || n > MAX_LEVEL) return null;
    if (!courseKnown(code)) return null;
    var r = rules(), m = r && r.lv && r.lv[code];
    if (!m) return true;
    return !!(m & (1 << (n - 1)));
  }
  function levelWindow(code) {
    var r = rules();
    var m = r && r.lv && r.lv[code];
    if (!m) return null;
    var out = [];
    for (var i = 1; i <= MAX_LEVEL; i++) if (m & (1 << (i - 1))) out.push(i);
    return out;
  }

  /*@3.PLRJ.6*/
  function levelNote(code, span) {
    var w = levelWindow(code);
    if (!w) return null;
    var lo = (span && span.known) ? span.lo : 1;
    var hi = (span && span.known) ? span.hi : MAX_LEVEL;
    var inSpan = w.filter(function (n) { return n >= lo && n <= hi; });
    if (!inSpan.length) return { list: w, min: w[0], tail: false };
    var min = inSpan[0];
    var tail = inSpan.length === (hi - min + 1);
    return { list: inSpan, min: min, tail: tail };
  }

  function bannerGroups(code) {
    var r = rules();
    var rows = r && r.pre && r.pre[code];
    if (!rows) return null;
    if (!rows.length) return [];
    var groups = [], cur = null;
    rows.forEach(function (x) {
      var c = x && x.c;
      if (!c) return;
      if (cur && /^or$/i.test(String(x.op || ''))) { cur.push(c); return; }
      cur = [c]; groups.push(cur);
    });
    return groups;
  }

  function prereq(slug, code) {
    var b = bannerGroups(code);
    if (b) return { groups: b, src: 'banner' };
    var c = courseBy(slug, code);
    var p = fPre(c);
    if (p && p.length) {
      return { groups: p.map(function (x) { return [x]; }), src: 'plan' };
    }
    return { groups: [], src: c ? 'plan' : 'none' };
  }

  function prereqMissing(slug, code, passed) {
    var g = prereq(slug, code).groups;
    var out = [];
    g.forEach(function (grp) {
      var ok = grp.some(function (x) { return !!(passed && passed[x]); });
      if (!ok) out.push(grp);
    });
    return out;
  }

  function check(o) {
    o = o || {};
    var code = o.code, out = [];
    if (!code) return out;
    var miss = prereqMissing(o.slug, code, o.passed || {});
    if (miss.length) out.push({ k: 'pre', groups: miss });
    if (o.level != null && o.level !== '') {
      var ok = levelAllows(code, o.level);
      if (ok === false) out.push({ k: 'level', code: code, allowed: levelWindow(code), at: parseInt(o.level, 10) });
    }
    return out;
  }

  window.GardenPlanRules = {
    MAX_LEVEL: MAX_LEVEL,
    loadPlans: loadPlans,
    loadRules: loadRules,
    programs: programs,
    program: program,
    courses: courses,
    courseBy: courseBy,
    dropIndex: dropIndex,
    fCode: fCode,
    fCh: fCh,
    fPrep: fPrep,
    planLevel: planLevel,
    levelSpan: levelSpan,
    absorbCatalog: absorbCatalog,
    absorbPrereqs: absorbPrereqs,
    restrictionsKnown: restrictionsKnown,
    courseKnown: courseKnown,
    levelAllows: levelAllows,
    levelWindow: levelWindow,
    levelNote: levelNote,
    prereq: prereq,
    prereqMissing: prereqMissing,
    check: check
  };
})();
