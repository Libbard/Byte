/*@3.GPSJ.1*/
(function () {
  'use strict';

  var PROF = 'student_profile', ARCH = 'semester_archive',
      SEM = 'my_semester', PLANK = 'gpa_plan', DRAFT = 'gpa_setup_draft';
  /*@3.GPSJ.2*/
  var PL_KEY = 'sx_plans', PL_VER = 6, PL_TTL = 30 * 24 * 3600 * 1000;
  var GPA_SCALE = { 'A+': 4, 'A': 3.75, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 };
  var GRADES = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'TR'];
  var PREP_RE = /^[A-Za-z]+0/;
  var MAX_LEVEL = 12;                 /*@3.GPSJ.3*/
  var CAP_REG = 18, CAP_SUM = 9;
  var FULL_SUPPORT = 'bachelor-of-computer-science';

  var PLANS = null, W = null, MOVING = null, MODE = 'setup';

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(a, e) { return isAr() ? a : e; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function readJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  /*@3.GPSJ.4*/
  var STATE = 'onboarding_state';
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /*@3.GPSJ.5*/
  function plansFromCache() {
    try {
      var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null');
      if (!v || !v.d || v.v !== PL_VER) return null;
      if (Array.isArray(v.d)) return v.d;
      return v.d.programs || null;
    } catch (e) { return null; }
  }
  function cacheAge() {
    try { var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null'); return v ? Date.now() - v.t : Infinity; }
    catch (e) { return Infinity; }
  }
  function loadPlans(cb) {
    PLANS = PLANS || plansFromCache();
    var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
    if (!API || (PLANS && cacheAge() < PL_TTL)) return cb(!!PLANS);
    /*@3.GPSJ.6*/
    fetch(API + '/v1/plans?r=' + PL_VER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.programs) {
          PLANS = d.programs;
          try { localStorage.setItem(PL_KEY, JSON.stringify({ t: Date.now(), v: PL_VER, d: d })); } catch (e) {}
        }
        cb(!!PLANS);
      })
      .catch(function () { cb(!!PLANS); });
  }
  function program() {
    /*@3.GPSJ.7*/
    if (!PLANS || !W || !W.program) return null;
    for (var i = 0; i < PLANS.length; i++) if (PLANS[i].slug === W.program) return PLANS[i];
    return null;
  }
  /*@3.GPSJ.8*/
  function fCode(c)  { return c.c != null ? c.c : c.code; }
  function fCh(c)    { var v = (c.h != null ? c.h : c.ch); return v == null ? 0 : v; }
  function fLevel(c) { return parseInt(c.l != null ? c.l : c.level, 10); }
  function fPrep(c)  { return c.pr === true || PREP_RE.test(String(fCode(c) || '')); }
  /*@3.GPSJ.9*/
  function fPre(c)   { return c.p || c.prereq || []; }

  function courses() { var p = program(); return (p && p.courses) || []; }
  function courseBy(code) {
    var cs = courses();
    for (var i = 0; i < cs.length; i++) if (fCode(cs[i]) === code) return cs[i];
    return null;
  }
  function cTitle(c) {
    var ar = (c.ta != null ? c.ta : c.title_ar), en = (c.t != null ? c.t : c.title);
    var t = (progLang() === 'ar') ? (ar || en) : (en || ar);
    /*@3.GPSJ.10*/
    return t || L('مادة خارج الخطة', 'Course outside the plan');
  }
  function isPrep(code) { var c = courseBy(code); return c ? fPrep(c) : PREP_RE.test(String(code || '')); }
  /*@3.GPSJ.11*/
  function planLevel(c) { var lv = fLevel(c); return fPrep(c) ? 0 : (isNaN(lv) ? null : lv); }


  /*@3.GPSJ.12*/
  function degreeOf(p) {
    var t = (p.name_ar || '') + ' ' + (p.slug || '') + ' ' + (p.name_en || '');
    if (/ماجستير|master/i.test(t)) return L('ماجستير', 'Master');
    if (/دبلوم|diploma/i.test(t)) return L('دبلوم', 'Diploma');
    return '';
  }
  function progLabel(p) {
    var n = isAr() ? (p.name_ar || p.name_en || p.slug) : (p.name_en || p.name_ar || p.slug);
    n = String(n)
      .replace(/^\s*برنامج\s+/, '')
      .replace(/^\s*(البكالوريوس|البكالوريس|بكالوريوس(\s+العلوم)?)\s+(في\s+)?/, '')
      .replace(/^\s*(الماجستير|ماجستير)\s+(في\s+)?/, '')
      .replace(/^\s*(Bachelor|Master)(\s+of|\s+in)?(\s+Science)?(\s+in)?\s+/i, '')
      .replace(/\s*Program\s*$/i, '')
      .replace(/^\s*-\s*/, '').trim();
    /*@3.GPSJ.13*/
    n = n.split(/\s+[-–—]\s+/).pop().trim()
         .replace(/^\s*تخصّ?ص\s+/, '')
         .replace(/^\s*Major\s+in\s+/i, '').trim();
    return n || p.slug;
  }

  /*@3.GPSJ.14*/
  var _langCache = {};
  function progLang() {
    var p = program(); if (!p) return isAr() ? 'ar' : 'en';
    if (_langCache[p.slug]) return _langCache[p.slug];
    var cs = p.courses || [], ar = 0;
    cs.forEach(function (c) { if (/[\u0600-\u06FF]/.test(String(c.ta != null ? c.ta : c.title_ar || ''))) ar++; });
    return (_langCache[p.slug] = (cs.length && ar / cs.length >= 0.5) ? 'ar' : 'en');
  }

  /*@3.GPSJ.15*/
  function tracksOf() {
    var p = program(); if (!p || !p.tracks) return [];
    var byKey = {};
    Object.keys(p.tracks).forEach(function (name) {
      var codes = p.tracks[name];
      var sig = Array.isArray(codes) ? codes.slice().sort().join('|') : name;
      var isArName = /[\u0600-\u06FF]/.test(name);
      var e = byKey[sig] || (byKey[sig] = { sig: sig, ar: '', en: '', codes: Array.isArray(codes) ? codes : [] });
      if (isArName) e.ar = e.ar || name; else e.en = e.en || name;
    });
    return Object.keys(byKey).map(function (k) {
      var e = byKey[k];
      e.label = isAr() ? (e.ar || e.en) : (e.en || e.ar);
      e.id = e.en || e.ar;                 /*@3.GPSJ.16*/
      return e;
    });
  }

  /*@3.GPSJ.17*/
  var LV_AR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
               'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
  /*@3.GPSJ.121*/
  function summerAfter(k) {
    var m = /^s(\d+)$/.exec(String(k == null ? '' : k));
    return m ? parseInt(m[1], 10) : null;
  }
  function lvRank(k) {
    var sa = summerAfter(k);
    if (sa !== null) return sa + 0.5;
    if (k === 'u') return 90;
    if (k === 'x') return 91;
    var n = parseInt(k, 10);
    return isNaN(n) ? 92 : n;
  }
  function levelNameIn(n, lang) {
    var sa = summerAfter(n);
    if (sa !== null) {
      return lang === 'ar' ? ('فصل صيفيّ بعد ' + levelNameIn(sa, 'ar'))
                           : ('Summer term after level ' + sa);
    }
    if (n === 'u') return lang === 'ar' ? 'بلا مستوىً معلن' : 'Level not stated';
    if (n === 'x' || n === null || isNaN(n)) return lang === 'ar' ? 'مواد خارج الخطة' : 'Outside the plan';
    n = +n;
    if (n === 0) return lang === 'ar' ? 'السنة التحضيرية' : 'Preparatory year';
    return lang === 'ar' ? ('المستوى ' + (LV_AR[n] || n)) : ('Level ' + n);
  }
  function levelName(n) { return levelNameIn(n, isAr() ? 'ar' : 'en'); }

  /*@3.GPSJ.18*/
  var RULES_AT = '';
  /*@3.GPSJ.123*/
  function rulesReady(after) {
    var R = window.GardenPlanRules;
    if (!R) return;
    if (RULES_AT === 'ok' || RULES_AT === 'busy') return;
    RULES_AT = 'busy';
    R.loadRules(function (ru) {
      RULES_AT = (ru && ru.kn) ? 'ok' : 'fail';
      if (typeof after === 'function') setTimeout(after, 0);
    });
  }
  /*@3.GPSJ.19*/
  function preGroups(code) {
    var R = window.GardenPlanRules;
    if (R) return R.prereq(W && W.program, code).groups;
    var c = courseBy(code);
    return fPre(c).map(function (x) { return [x]; });
  }
  function prereqOf(code) {
    var flat = [];
    preGroups(code).forEach(function (g) { flat.push(g.join(isAr() ? ' أو ' : ' or ')); });
    return flat;
  }
  function prereqMet(code, passed) {
    var g = preGroups(code);
    if (!g.length) return true;         /*@3.GPSJ.20*/
    return g.every(function (grp) {
      return grp.some(function (x) { return !!passed[x]; });
    });
  }
  /*@3.GPSJ.124*/
  function levelBlocks(code) {
    var R = window.GardenPlanRules;
    if (!R || !W || !W.curLevel) return null;
    if (R.levelAllows(code, W.curLevel) !== false) return null;
    var n = R.levelNote(code, spanOf());
    if (!n) return '';
    if (n.tail) {
      return L('بانر لا يفتحها قبل ' + levelName(n.min) + ' وأنت في المستوى ' + W.curLevel + ' — لك أن تختارها، ولك أن تعرف.',
               'Banner does not open it before level ' + n.min + ' and you are in level ' + W.curLevel +
                 ' — you may still pick it, but now you know.');
    }
    return L('بانر يقصرها على ' + n.list.map(levelName).join('، ') + ' وأنت في المستوى ' + W.curLevel + '.',
             'Banner limits it to levels ' + n.list.join(', ') + ' and you are in level ' + W.curLevel + '.');
  }
  function passedMap() {
    var m = {};
    Object.keys(W.levels).forEach(function (lv) {
      W.levels[lv].forEach(function (x) { m[x.code] = x.grade || true; });
    });
    return m;
  }

  /*@3.GPSJ.21*/
  function guessTerm() { var m = new Date().getMonth(); return (m >= 5 && m <= 7) ? 'summer' : 'regular'; }

  /*@3.GPSJ.22*/
  function blank() {
    return { step: 0, name_ar: '', name_en: '', start_year: '',
             college_key: '', program: '', plan_version: '', track: '',
             levels: {}, curLevel: '', term: guessTerm(), cur: [], planAsk: {} };
  }
  /*@3.GPSJ.120*/
  function recSig() {
    var a = (readJSON(ARCH, []) || []).map(function (x) {
      return String((x && x.id) || '') + ':' +
        ((x && x.courses) || []).map(function (c) {
          return String((c && c.code) || '') + '=' + String((c && c.grade) || '');
        }).sort().join(',');
    }).sort().join('|');
    var sem = readJSON(SEM, null);
    var c = ((sem && sem.courses) || []).map(function (x) { return String((x && x.code) || ''); }).sort().join(',');
    return a + '#' + c;
  }
  function saveDraft() { W.sig = recSig(); writeJSON(DRAFT, W); }

  /*@3.GPSJ.23*/
  function importExisting() {
    var p = readJSON(PROF, {}) || {};
    var d = blank();
    d.name_ar = p.name_ar || p.name || '';
    d.name_en = p.name_en || '';
    d.start_year = p.start_year || '';
    d.college_key = p.college_key || '';
    d.program = p.program || '';
    d.plan_version = p.plan_version || '';
    /*@3.GPSJ.24*/
    if (p.level) d.curLevel = String(parseInt(p.level, 10) || '');
    if (!d.curLevel && d.start_year) {
      var g0 = levelFromYear(d.start_year);
      if (g0 !== null) d.curLevel = String(g0);
    }
    /*@3.GPSJ.25*/
    W = d;

    /*@3.GPSJ.26*/
    /*@3.GPSJ.109*/
    (readJSON(ARCH, []) || []).forEach(function (a) {
      var own = !a || !a.id || String(a.id).indexOf('gpa_L') === 0 || a.id === 'onb_prior';
      (a.courses || []).forEach(function (c) {
        if (!c || !c.code) return;
        var lv = (a.level != null) ? a.level : null;
        if (lv === null) { var pc = courseBy(c.code); lv = pc ? planLevel(pc) : null; }
        if (lv === null) lv = 'x';
        (d.levels[lv] = d.levels[lv] || []).push({
          code: c.code, grade: c.grade || '',
          /*@3.GPSJ.110*/
          from: own ? '' : a.id
        });
      });
    });
    var sem = readJSON(SEM, null);
    if (sem && sem.courses) d.cur = sem.courses.map(function (c) { return c.code; }).filter(Boolean);
    /*@3.GPSJ.27*/
    (p.passed_extra || []).forEach(function (code) {
      var already = Object.keys(d.levels).some(function (lv) {
        return d.levels[lv].some(function (x) { return x.code === code; });
      });
      if (already) return;
      var pc = courseBy(code), lv = pc ? planLevel(pc) : 'x';
      (d.levels[lv] = d.levels[lv] || []).push({ code: code, grade: '' });
    });
    return d;
  }
  function hasAnything(d) {
    return !!(d.program || d.name_ar || d.cur.length || Object.keys(d.levels).length);
  }

  /*@3.GPSJ.28*/
  var STEPS = ['welcome', 'import', 'you', 'major', 'record', 'current', 'sync', 'notify', 'done'];
  var YEAR_FLOOR = 2018;              /*@3.GPSJ.29*/
  var oldYears = false, planErr = false;

  var CARRY = ['name_ar', 'name_en', 'start_year', 'college_key', 'program',
               'plan_version', 'track', 'curLevel', 'term'];
  var refreshed = false;
  function open(step) {
    loadPlans(function () {
      var draft = readJSON(DRAFT, null);
      _autoAt = null; _autoOwned = false;
      refreshed = false;
      if (draft && draft.sig !== recSig()) {
        var keep = draft;
        importExisting();
        W.step = keep.step || 0;
        CARRY.forEach(function (k) { if (keep[k]) W[k] = keep[k]; });
        W.planAsk = keep.planAsk || {};
        refreshed = true;
        saveDraft();
        draft = W;
      }
      W = draft || importExisting();
      if (!draft) W.step = 0;   /*@3.GPSJ.30*/
      if (typeof step === 'string') { var k = STEPS.indexOf(step); if (k >= 0) W.step = k; }
      else if (step != null) W.step = step;
      mount(); paint();
    });
  }
  function close(keepDraft) {
    if (!keepDraft) localStorage.removeItem(DRAFT);
    closeGrade();
    var ov = $('#gs-overlay'); if (ov) ov.remove();
    W = null; MODE = 'setup';
  }

  function mount() {
    /*@3.GPSJ.31*/
    var stale = $('#gs-overlay');
    if (stale) { if (!stale.hidden) return; stale.remove(); }
    var ov = document.createElement('div');
    ov.id = 'gs-overlay'; ov.className = 'gp-overlay gs-overlay';
    ov.innerHTML =
      '<div class="gs-box" role="dialog" aria-modal="true" aria-labelledby="gs-title">' +
        '<div class="gs-head">' +
          '<h3 id="gs-title" class="gs-title"></h3>' +
          '<button class="gp-ico" data-gs="close" aria-label="' + esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="gs-steps" id="gs-steps"></div>' +
        '<div class="gs-body" id="gs-body"></div>' +
        '<div class="gs-foot">' +
          '<span class="gs-why" id="gs-why" hidden></span>' +
          '<button class="gp-btn" data-gs="back"><i class="fa-solid fa-arrow-right"></i><span>' + esc(L('السابق', 'Back')) + '</span></button>' +
          '<span class="gs-foot-sp"></span>' +
          '<button class="gp-btn gp-btn--primary" data-gs="next"><span>' + esc(L('التالي', 'Next')) + '</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', onClick);
    ov.addEventListener('change', onChange);
    ov.addEventListener('input', onInput);
    /*@3.GPSJ.32*/
    ov.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var b = e.target.closest && e.target.closest('.gs-card--tap');
      if (!b) return;
      e.preventDefault(); b.click();
    });
    /*@3.GPSJ.33*/
    $('#gs-body').addEventListener('scroll', closeGrade, { passive: true });
    /*@3.GPSJ.34*/
    /*@3.GPSJ.153*/
    ov.addEventListener('pointerdown', plPointerDown);
    ov.addEventListener('dragstart', function (e) {
      if (MODE === 'planner') { e.preventDefault(); return; }
      var card = e.target.closest && e.target.closest('.gs-card[draggable]');
      if (!card) return;
      MOVING = card.getAttribute('data-code');
      try { e.dataTransfer.setData('text/plain', MOVING); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
      card.classList.add('is-moving');
    });
    ov.addEventListener('dragover', function (e) {
      if (MODE === 'planner') return;
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (!z || !MOVING) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
      z.classList.add('is-drop');
    });
    ov.addEventListener('dragleave', function (e) {
      if (MODE === 'planner') return;
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (z) z.classList.remove('is-drop');
    });
    ov.addEventListener('drop', function (e) {
      if (MODE === 'planner') return;
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (!z || !MOVING) return;
      e.preventDefault();
      moveTo(MOVING, z.getAttribute('data-drop'));
      MOVING = null; saveDraft(); paint();
    });
    ov.addEventListener('dragend', function () {
      if (MODE === 'planner') return;
      MOVING = null; paint();
    });
  }

  /*@3.GPSJ.35*/
  function paintSteps() {
    /*@3.GPSJ.36*/
    var LABEL = {
      welcome: L('الحديقة', 'Garden'), import: L('استيرادٌ', 'Import'),
      you: L('أنت', 'You'), major: L('تخصّصك', 'Major'),
      record: L('سجلّك', 'Record'), current: L('فصلك', 'Term'),
      sync: L('حفظُ عملك', 'Keep safe'), notify: L('التنبيهات', 'Alerts')
    };
    var names = STEPS.filter(function (k) { return k !== 'done'; })
                     .map(function (k) { return LABEL[k] || k; });
    $('#gs-steps').innerHTML = names.map(function (n, i) {
      var cls = i === W.step ? ' is-now' : (i < W.step ? ' is-done' : '');
      /*@3.GPSJ.37*/
      return '<button type="button" class="gs-step' + cls + '" data-gs="goto" data-v="' + i + '"' +
        (i === W.step ? ' aria-current="step"' : '') + '>' +
        '<i class="fa-solid fa-check gs-step-tick" aria-hidden="true"></i>' + esc(n) + '</button>';
    }).join('');
  }

  function paint() {
    var name = STEPS[W.step];
    paintSteps();
    var titles = {
      welcome: L('أهلاً بك في الحديقة الرقمية', 'Welcome to the Digital Garden'),
      import: L('وجدنا لك بياناتٍ سابقة', 'We found your existing data'),
      you: L('من أنت؟', 'Who are you?'),
      major: L('تخصّصك وخطتك', 'Your major and plan'),
      record: L('ما الذي أتممته؟', 'What have you completed?'),
      current: L('فصلك الحالي', 'Your current term'),
      sync: L('احفظ عملك', 'Keep your work safe'),
      notify: L('تنبيهاتُك', 'Your reminders'),
      done: L('تمّ', 'Done')
    };
    $('#gs-title').textContent = titles[name];
    $('#gs-body').innerHTML = ({
      welcome: bodyWelcome, import: bodyImport, you: bodyYou, major: bodyMajor, sync: bodySync,
      notify: bodyNotify,
      record: bodyRecord, current: bodyCurrent, done: bodyDone
    })[name]();
    if (name === 'sync') mountSync();
    if (name === 'notify') wireNotify();
    $('[data-gs="back"]').style.visibility = (W.step === 0 || name === 'done') ? 'hidden' : '';
    var nb = $('[data-gs="next"]'), next = $('[data-gs="next"] span');
    next.textContent = (name === 'welcome') ? L('لنبدأ', 'Let’s start')
                     : (name === 'current') ? L('احفظ وأنهِ', 'Save & finish')
                     : (name === 'done') ? L('إغلاق', 'Close') : L('التالي', 'Next');
    /*@3.GPSJ.38*/
    var block = (name === 'major' && !W.program)
      ? (planErr ? L('تعذّر جلب الخطط — أعد المحاولة أو تابع بلا برنامج',
                     'Plans unavailable — retry or continue without a programme')
                 : L('اختر برنامجك أولاً', 'Pick your programme first'))
      : '';
    nb.disabled = !!block;
    var why = $('#gs-why');
    if (why) { why.textContent = block; why.hidden = !block; }
    saveDraft();
  }


  /*@3.GPSJ.39*/
  var FEATURES = [
    { i: 'fa-layer-group', ar: 'كتالوج الشعب',
      d_ar: 'كلُّ شعب الجامعة بفروعها وأوقاتها — ومنها الممتلئةُ التي يُخفيها البانر.',
      en: 'Sections catalogue', d_en: 'Every section, including the full ones Banner hides.' },
    { i: 'fa-star', ar: 'تقييمات الأساتذة',
      d_ar: 'آراءُ الطلاب في أعضاء هيئة التدريس قبل أن تختار شعبتك.',
      en: 'Faculty ratings', d_en: 'What students say about instructors — before you pick.' },
    { i: 'fa-book-open', ar: 'مواد تفاعلية',
      d_ar: 'وحداتٌ وملخّصاتٌ واختباراتٌ وبطاقاتُ مراجعةٍ لمقرّراتك.',
      en: 'Interactive courses', d_en: 'Modules, summaries, quizzes and flashcards.' },
    { i: 'fa-chart-line', ar: 'المعدل والتوقّع',
      d_ar: 'معدّلك ومسارُك حتى التخرّج ومرتبةُ الشرف — وهي الصفحة التي أنت فيها.',
      en: 'GPA & forecast', d_en: 'Your GPA, path to graduation and honours — this very page.' },
    { i: 'fa-bell', ar: 'تنبيهات تصلك',
      d_ar: 'محاضراتُك واختباراتُك ومهامُّك — وفتحُ التسجيل وتوفّرُ الشعب.',
      en: 'Reminders that reach you', d_en: 'Lectures, exams, tasks — and when sections open up.' },
    { i: 'fa-rotate', ar: 'مزامنةٌ بين أجهزتك',
      d_ar: 'بمفتاحٍ واحد بلا حسابٍ ولا كلمة مرور.',
      en: 'Sync across devices', d_en: 'One key — no account, no password.' },
    /*@3.GPSJ.40*/
    { i: 'fa-flask', ar: 'المختبرات', partial: true,
      d_ar: 'تطبيقاتٌ تفاعليةٌ تُجرَّب فيها المفاهيم — الدوائرُ المنطقية ولغاتُ البرمجة تعملان الآن.',
      en: 'Labs', d_en: 'Hands-on apps for the concepts — logic circuits and programming languages are live.' },
    { i: 'fa-pen-nib', ar: 'ملاحظاتٌ متطوّرة', soon: true,
      d_ar: 'تظليلٌ على المحتوى وربطٌ بالمواد — ورسمٌ باليد على الشاشة.',
      en: 'Advanced notes', d_en: 'Highlight, link to courses — and draw by hand.' }
  ];
  function bodyWelcome() {
    return '<p class="gs-lead">' + esc(L(
      'الحديقةُ الرقمية منصّةٌ يبنيها طالبٌ لطلاب الجامعة السعودية الإلكترونية. هذه جولةٌ في دقيقة، ثم نُعِدّ ملفَّك.',
      'The Digital Garden is a platform built by a student for SEU students. A one-minute tour, then we set up your profile.')) + '</p>' +
      '<div class="gs-feats">' + FEATURES.map(function (f) {
        /*@3.GPSJ.41*/
        var tag = f.soon ? '<em class="gs-soon">' + esc(L('قريباً', 'soon')) + '</em>'
                : f.partial ? '<em class="gs-soon gs-soon--part">' + esc(L('أُطلق جزئياً', 'partly live')) + '</em>'
                : '';
        return '<div class="gs-feat' + (f.soon ? ' is-soon' : '') + '">' +
          '<i class="fa-solid ' + f.i + '" aria-hidden="true"></i>' +
          '<span class="gs-feat-h"><b>' + esc(L(f.ar, f.en)) + '</b>' + tag + '</span>' +
          '<span class="gs-feat-d">' + esc(L(f.d_ar, f.d_en)) + '</span></div>';
      }).join('') + '</div>';
  }

  /*@3.GPSJ.42*/
  function bodyImport() {
    var lv = Object.keys(W.levels).length;
    var n = 0; Object.keys(W.levels).forEach(function (k) { n += W.levels[k].length; });
    var p = program();
    var rows = [
      p ? [L('تخصّصك', 'Major'), isAr() ? (p.name_ar || p.name_en) : p.name_en] : null,
      lv ? [L('سجلّك', 'Record'), n + L(' مادة في ', ' courses across ') + lv + L(' مستوى', ' levels')] : null,
      W.cur.length ? [L('فصلك الحالي', 'Current term'), W.cur.length + L(' مادة', ' courses')] : null,
      W.name_ar || W.name_en ? [L('اسمك', 'Name'), W.name_ar || W.name_en] : null
    ].filter(Boolean);
    return '<p class="gs-lead">' + esc(L(
      'استوردنا ما سجّلته في الموقع من قبل — راجعه وصحّحه، ولا تبدأ من الصفر.',
      'We imported what you already have on the site — review and correct it instead of starting over.')) + '</p>' +
      '<div class="gs-import">' + rows.map(function (r) {
        return '<div class="gs-import-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      }).join('') + '</div>' +
      '<button class="gp-cta" data-gs="fresh"><i class="fa-solid fa-rotate-left"></i><span>' +
        esc(L('تجاهل وابدأ من جديد', 'Ignore and start fresh')) + '</span></button>';
  }

  /*@3.GPSJ.43*/
  function bodyYou() {
    var Y = new Date().getFullYear(), h = '';
    h += '<div class="gs-field"><label class="gs-lbl">' + esc(L('اسمك', 'Your name')) + '</label>' +
      '<div class="gs-two">' +
        '<input class="gs-inp" id="gs-name-ar" value="' + esc(W.name_ar) + '" placeholder="' + esc(L('بالعربية', 'Arabic')) + '">' +
        '<input class="gs-inp" id="gs-name-en" dir="ltr" value="' + esc(W.name_en) + '" placeholder="' + esc(L('بالإنجليزية', 'English')) + '">' +
      '</div><p class="gs-hint">' + esc(L(
        'يكفي أن تملأ أحدهما — والفارغُ يأخذ نصَّ الآخر عند الحفظ، فلا يبقى اسمُك خالياً في لغةٍ من اللغتين.',
        'Filling one is enough — the empty one copies the other on save, so your name is never blank in either language.')) + '</p></div>';

    /*@3.GPSJ.44*/
    h += '<div class="gs-field"><label class="gs-lbl">' + esc(L('سنة بدء دراستك الجامعية', 'The year you started university')) + '</label><div class="gs-chips">';
    for (var y = Y; y >= YEAR_FLOOR; y--) {
      h += '<button class="gp-chip' + (String(W.start_year) === String(y) ? ' is-on' : '') +
        '" data-gs="year" data-v="' + y + '">' + y + '</button>';
    }
    if (!oldYears) {
      h += '<button class="gp-chip gs-more" data-gs="older">' + esc(L('أقدم…', 'Older…')) + '</button>';
    } else {
      for (var o = YEAR_FLOOR - 1; o >= YEAR_FLOOR - 10; o--) {
        h += '<button class="gp-chip' + (String(W.start_year) === String(o) ? ' is-on' : '') +
          '" data-gs="year" data-v="' + o + '">' + o + '</button>';
      }
    }
    h += '</div>';

    var g = W.start_year ? levelFromYear(W.start_year) : null;
    if (g !== null) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-wand-magic-sparkles"></i><div>' +
        esc(L('على السَّير المعتاد تكون الآن في ' + levelName(g) + ' — نضعه اقتراحاً مبدئياً، وتصحّحه في خطوة «فصلك». ' +
              'فالحذفُ والتأجيلُ والمعادلةُ تُزيح الطالبَ عن الجدول.',
              'On the usual pace you would now be in ' + levelName(g) + ' — we use it as a starting guess you correct later. ' +
              'Dropping, deferring or transferring shifts anyone off the schedule.')) + '</div></div>';
    }
    return h + '</div>';
  }

  function spanOf() {
    var R = window.GardenPlanRules;
    if (R && W && W.program) return R.levelSpan(W.program);
    return { lo: 1, hi: 8, prep: false, known: false };
  }
  function topLevel() {
    var sp = spanOf();
    return sp.known ? Math.max(sp.hi, 1) : MAX_LEVEL;
  }

  /*@3.GPSJ.45*/
  function levelFromYear(y) {
    y = parseInt(y, 10); if (!y) return null;
    var now = new Date(), m = now.getMonth();
    var acad = (m >= 7) ? now.getFullYear() : now.getFullYear() - 1;   /*@3.GPSJ.46*/
    var elapsed = acad - y;
    if (elapsed < 0) return null;
    var sp = spanOf(), spring = (m >= 0 && m <= 4) ? 1 : 0;
    var lv;
    if (sp.known && !sp.prep) {
      lv = sp.lo + elapsed * 2 + spring;
    } else {
      if (elapsed === 0) return 0;                                      /*@3.GPSJ.47*/
      lv = 3 + (elapsed - 1) * 2 + spring;                              /*@3.GPSJ.48*/
    }
    var hi = sp.known ? sp.hi : MAX_LEVEL;
    return Math.max(sp.known ? sp.lo : 0, Math.min(lv, hi));
  }

  /*@3.GPSJ.49*/
  function bodyMajor() {
    if (!PLANS) {
      planErr = true;
      return '<div class="gs-warn is-err"><i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>' +
        '<div class="gs-warn-t"><b>' +
          esc(L('لم تصل خططُ الجامعة', 'The university plans did not arrive')) + '</b>' +
        esc(L('الخططُ تُجلب من خادمنا، فلا تظهر بلا اتصال. تحقّق من شبكتك وأعد المحاولة — أو تابع بلا برنامج، ' +
              'فتُسجّل موادَّك يدوياً ويعمل معدّلُك كاملاً، وتختار برنامجك لاحقاً من الإعدادات.',
              'Plans are fetched from our server, so they cannot appear offline. Check your connection and retry — ' +
              'or continue without one: add courses manually, your GPA still works, and pick a programme later from Settings.')) +
        '<div class="gs-warn-a">' +
          '<button class="gp-btn gp-btn--primary" data-gs="retry">' +
            '<i class="fa-solid fa-rotate" aria-hidden="true"></i> ' + esc(L('أعد المحاولة', 'Retry')) + '</button>' +
          '<button class="gp-btn" data-gs="skip-prog">' + esc(L('تابع بلا برنامج', 'Continue without')) + '</button>' +
        '</div></div></div>';
    }
    planErr = false;
    var colleges = {};
    PLANS.forEach(function (pr) {
      var k = (isAr() ? (pr.college_ar || pr.college_en) : (pr.college_en || pr.college_ar)) || '—';
      (colleges[k] = colleges[k] || []).push(pr);
    });
    var h = '<div class="gs-field"><label class="gs-lbl">' + esc(L('تخصّصك', 'Your major')) + '</label>';
    Object.keys(colleges).forEach(function (col) {
      h += '<div class="gs-col-h">' + esc(col) + '</div><div class="gs-prog-grid">';
      colleges[col].forEach(function (pr) {
        /*@3.GPSJ.50*/
        var full = pr.slug === FULL_SUPPORT, deg = degreeOf(pr);
        var tag = full ? '<span class="gp-badge" data-kind="on">' + esc(L('مدعوم كاملاً', 'Full support')) + '</span>'
                : deg ? '<em class="gs-deg">' + esc(deg) + '</em>'
                : '';
        h += '<button class="gs-prog' + (W.program === pr.slug ? ' is-on' : '') + '" data-gs="prog" data-v="' + esc(pr.slug) + '">' +
          '<span class="gs-prog-n">' + esc(progLabel(pr)) + '</span>' +
          '<span class="gs-prog-meta">' +
            '<span class="gs-prog-tag">' + tag + '</span>' +
            '<span class="gs-prog-m">' + (pr.courses || []).length + esc(L(' مقرراً', ' courses')) + '</span>' +
          '</span>' +
        '</button>';
      });
      h += '</div>';
    });
    h += '</div>';

    var trs = tracksOf();
    if (trs.length) {
      h += '<div class="gs-field"><label class="gs-lbl">' + esc(L('مسارك (اختياريّ)', 'Your track (optional)')) + '</label><div class="gs-chips">' +
        '<button class="gp-chip' + (!W.track ? ' is-on' : '') + '" data-gs="track" data-v="">' + esc(L('بلا مسار', 'None')) + '</button>' +
        trs.map(function (t) {
          return '<button class="gp-chip' + (W.track === t.id ? ' is-on' : '') + '" data-gs="track" data-v="' + esc(t.id) + '">' +
            esc(t.label) + '</button>';
        }).join('') + '</div></div>';
    }
    return h;
  }

  /*@3.GPSJ.51*/
  function resolveUnknownLevels() {
    if (!courses().length) return;
    var moved = false;
    ['x', 'u'].forEach(function (bag) {
      var src = W.levels[bag];
      if (!src || !src.length) return;
      var rest = [];
      src.forEach(function (e) {
        var c = courseBy(e.code), lv = c ? planLevel(c) : null;
        /*@3.GPSJ.119*/
        var home = c ? (lv === null ? 'u' : lv) : 'x';
        if (String(home) === bag) { rest.push(e); return; }
        (W.levels[home] = W.levels[home] || []).push(e);
        moved = true;
      });
      if (rest.length) W.levels[bag] = rest; else delete W.levels[bag];
    });
    if (moved) saveDraft();
  }

  /*@3.GPSJ.118*/
  var KINDS = {
    elective:   ['اختياري', 'Elective'],
    internship: ['تدريب ميداني', 'Internship'],
    research:   ['مشروع بحث', 'Research project']
  };
  function kindName(c) {
    var k = KINDS[c.k || c.category];
    return k ? L(k[0], k[1]) : '';
  }
  /*@3.GPSJ.117*/
  function planHasUnlevelled() {
    return courses().some(function (c) { return planLevel(c) === null; });
  }
  /*@3.GPSJ.116*/
  function levelsInUse() {
    var s = {}, cs = courses();
    cs.forEach(function (c) { var lv = planLevel(c); if (lv !== null) s[lv] = true; });
    Object.keys(W.levels).forEach(function (k) {
      if (k === 'x' || k === 'u' || summerAfter(k) !== null) return;
      if (!isNaN(parseInt(k, 10))) s[k] = true;
    });
    var arr = Object.keys(s).map(Number).filter(function (n) { return !isNaN(n); });
    var maxPlan = Math.max.apply(null, arr.concat([0]));
    var span = cs.length ? maxPlan : 8;
    for (var i = 0; i <= Math.min(MAX_LEVEL, span); i++) if (i !== 1 && i !== 2) s[i] = true;
    if (!cs.length || cs.some(fPrep) || (W.levels[0] || []).length) s[0] = true;
    else delete s[0];
    var nums = Object.keys(s).map(Number).filter(function (n) { return !isNaN(n); })
                     .sort(function (a, b) { return a - b; });
    var out = [];
    nums.forEach(function (n) {
      out.push(n);
      if (hasBag('s' + n)) out.push('s' + n);
    });
    Object.keys(W.levels).forEach(function (k) {
      var sa = summerAfter(k);
      if (sa === null || out.indexOf(k) > -1) return;
      out.push(k);
    });
    if (planHasUnlevelled() || (W.levels.u || []).length) out.push('u');
    if ((W.levels.x || []).length) out.push('x');   /*@3.GPSJ.52*/
    return out;
  }
  function hasBag(k) { return Object.prototype.hasOwnProperty.call(W.levels, k); }
  function takenAt(code) {
    var found = null;
    Object.keys(W.levels).forEach(function (lv) {
      if (W.levels[lv].some(function (x) { return x.code === code; })) found = lv;
    });
    return found;
  }
  function entryOf(code) {
    var lv = takenAt(code); if (lv === null) return null;
    return W.levels[lv].filter(function (x) { return x.code === code; })[0];
  }

  /*@3.GPSJ.112*/
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^ISLAM/, 'ISLM'); }
  function planSig() {
    var cs = courses();
    if (!cs.length) return '';
    return (W.program || '') + '|' + cs.map(function (c) { return normCode(fCode(c)); }).sort().join(',');
  }
  function hasRecord() {
    return Object.keys(W.levels).some(function (k) { return (W.levels[k] || []).length; });
  }
  /*@3.GPSJ.113*/
  function recordCodes() {
    var m = {};
    Object.keys(W.levels).forEach(function (k) {
      (W.levels[k] || []).forEach(function (x) { m[normCode(x.code)] = 1; });
    });
    return m;
  }
  /*@3.GPSJ.115*/
  function newlyAdded() {
    var lv = parseInt(W.curLevel, 10);
    if (!lv || !courses().length || !hasRecord()) return [];
    var prof = readJSON(PROF, {}) || {};
    if (prof.plan_seen && prof.plan_seen === planSig()) return [];
    var have = recordCodes(), said = W.planAsk || {};
    return courses().filter(function (c) {
      var pl = planLevel(c);
      if (pl === null || pl >= lv) return false;
      var k = normCode(fCode(c));
      return !have[k] && !said[k];
    });
  }
  /*@3.GPSJ.114*/
  function sealPlanSeen() {
    var sig = planSig();
    if (!sig) return;
    var prof = readJSON(PROF, {}) || {};
    prof.plan_seen = sig;
    writeJSON(PROF, prof);
  }

  /*@3.GPSJ.53*/
  var _autoAt = null, _autoOwned = false;
  function autoTickBelow() {
    var lv = parseInt(W.curLevel, 10);
    if (!lv || !courses().length) return;      /*@3.GPSJ.54*/
    if (_autoAt === lv) return;
    var had = Object.keys(W.levels).some(function (k) { return (W.levels[k] || []).length; });
    if (had && !_autoOwned) { _autoAt = lv; return; }   /*@3.GPSJ.55*/
    W.levels = {};                                       /*@3.GPSJ.56*/
    courses().forEach(function (c) {
      var pl = planLevel(c);
      if (pl === null || pl >= lv) return;
      (W.levels[pl] = W.levels[pl] || []).push({ code: fCode(c), grade: '' });
    });
    _autoAt = lv; _autoOwned = true;
    saveDraft();
  }
  /*@3.GPSJ.57*/
  function claimRecord() { _autoOwned = false; }

  /*@3.GPSJ.58*/
  function gTone(g) {
    if (!g || g === 'TR') return '';
    if (g === 'A+' || g === 'A') return 'ok';
    if (g === 'B+' || g === 'B') return 'mid';
    if (g === 'F') return 'danger';
    return 'warn';
  }
  function gradeBtn(code, val, label) {
    var nm = label || code;
    return '<button type="button" class="gs-gr-btn' + (val ? ' is-set' : '') +
      '" data-gs="grade" data-v="' + esc(code) + '" data-tone="' + gTone(val) + '"' +
      ' aria-haspopup="listbox" aria-label="' + esc(L('تقدير ' + nm, 'Grade for ' + nm)) + '">' +
      '<span>' + esc(val || '—') + '</span><i class="fa-solid fa-chevron-down"></i></button>';
  }
  function closeGrade() { var p = $('#gs-gpop'); if (p) p.remove(); }
  function openGrade(btn, code) {
    closeGrade();
    var planned = String(code).indexOf('pl:') === 0;
    var en = planned ? null : entryOf(code);
    var cur = planned ? plGradeOf(code) : ((en && en.grade) || '');
    var pop = document.createElement('div');
    pop.id = 'gs-gpop'; pop.className = 'gs-gpop'; pop.setAttribute('role', 'listbox');
    pop.innerHTML = GRADES.map(function (g) {
      return '<button type="button" class="gs-gopt' + (g === cur ? ' is-on' : '') +
        '" data-g="' + g + '" data-tone="' + gTone(g) + '" role="option" aria-selected="' + (g === cur) + '">' +
        '<b>' + esc(g || '—') + '</b><span>' + esc(gradeWord(g)) + '</span></button>';
    }).join('');
    document.body.appendChild(pop);
    /*@3.GPSJ.59*/
    var r = btn.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var top = r.bottom + 6;
    if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    var left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
    pop.style.top = top + 'px'; pop.style.left = left + 'px';
    pop.addEventListener('click', function (ev) {
      var o = ev.target.closest('[data-g]'); if (!o) return;
      if (planned) { closeGrade(); plGradeSet(code, o.getAttribute('data-g')); return; }
      var e2 = entryOf(code);
      if (e2) { e2.grade = o.getAttribute('data-g'); claimRecord(); saveDraft(); }
      closeGrade(); paint();
    });
  }
  function gradeWord(g) {
    var m = { 'A+': ['ممتاز مرتفع', 'Exceptional'], 'A': ['ممتاز', 'Excellent'],
              'B+': ['جيد جداً مرتفع', 'Superior'], 'B': ['جيد جداً', 'Very good'],
              'C+': ['جيد مرتفع', 'Above average'], 'C': ['جيد', 'Good'],
              'D+': ['مقبول مرتفع', 'High pass'], 'D': ['مقبول', 'Pass'],
              'F': ['راسب', 'Fail'], 'TR': ['معادَلة', 'Transferred'],
              '': ['بلا تقدير بعد', 'Not graded yet'] };
    return L(m[g][0], m[g][1]);
  }

  function bodyRecord() {
    resolveUnknownLevels();
    autoTickBelow();
    var lvls = levelsInUse();
    var byLevel = {};
    courses().forEach(function (c) {
      var lv = planLevel(c); if (lv === null) lv = 'u';
      (byLevel[lv] = byLevel[lv] || []).push(c);
    });
    var noGrade = 0, ticked = 0;
    Object.keys(W.levels).forEach(function (k) {
      W.levels[k].forEach(function (x) { ticked++; if (!x.grade) noGrade++; });
    });

    var h = '<p class="gs-lead">' + esc(L(
      'أشِّر ما أتممته. الدرجةُ اختياريةٌ — ضعها متى شئت، والمعدلُ يُحسب ممّا له درجة.',
      'Tick what you completed. Grades are optional — add them whenever you like; the GPA uses what has a grade.')) + '</p>';
    if (!courses().length) {
      h += '<div class="gs-warn is-err"><i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>' +
        '<div class="gs-warn-t"><b>' +
          esc(L('لم تصل مقرراتُ خطتك', 'Your plan’s courses did not load')) + '</b>' +
        esc(L('لا مواد لنعرضها هنا حتى تصل الخطة. أعد المحاولة — أو تابع الآن وأضف موادَّك يدوياً من صفحة المعدل، ' +
              'ولن يضيع شيءٌ ممّا سجّلتَه قبلها.',
              'There is nothing to list until the plan arrives. Retry — or continue now and add courses manually from the GPA page; ' +
              'nothing you entered before is lost.')) +
        '<div class="gs-warn-a"><button class="gp-btn gp-btn--primary" data-gs="retry">' +
          '<i class="fa-solid fa-rotate" aria-hidden="true"></i> ' + esc(L('أعد المحاولة', 'Retry')) + '</button>' +
        '</div></div></div>';
      return h;
    }
    if (refreshed) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-rotate"></i><div>' +
        esc(L('تغيّر سجلُّك في صفحة المعدّل بعد آخر مرّةٍ فتحتَ المعالج، فأعدنا قراءتَه من مكانه — والمعروضُ هنا هو المحفوظ الآن.',
              'Your record changed on the GPA page since you last opened the wizard, so we re-read it — what you see here is what is stored now.')) +
        '</div></div>';
    }
    var fresh = newlyAdded();
    if (fresh.length) {
      h += '<div class="gs-warn gs-new" role="group" aria-label="' +
        esc(L('مواد أضيفت إلى خطتك', 'Courses added to your plan')) + '">' +
        '<i class="fa-solid fa-circle-plus" aria-hidden="true"></i><div class="gs-warn-t"><b>' +
        esc(L(fresh.length === 1
                ? 'أُضيفت مادّةٌ إلى خطتك — هل اجتزتها؟'
                : 'أُضيفت ' + fresh.length + ' مواد إلى خطتك — هل اجتزتها؟',
              fresh.length === 1
                ? 'One course was added to your plan — did you pass it?'
                : fresh.length + ' courses were added to your plan — did you pass them?')) + '</b>' +
        esc(L('صحّحنا خطةَ برنامجك، فظهرت موادُّ لم تكن معروضةً حين سجّلتَ مستوياتك. ' +
              'قل لنا حالَ كلٍّ منها — ولن يتغيّر معدّلُك حتى تجيب.',
              'We corrected your programme’s plan, so courses appeared that were not shown when you recorded your levels. ' +
              'Tell us about each — your GPA will not change until you answer.')) +
        '<div class="gs-new-list">';
      fresh.forEach(function (c) {
        var code = fCode(c), pl = planLevel(c);
        h += '<div class="gs-new-row">' +
          '<span class="gs-new-c"><b>' + esc(code) + '</b> ' +
            esc(cTitle(c)) + '</span>' +
          '<span class="gs-new-m">' + esc(levelName(pl)) + ' · ' + fCh(c) + esc(L(' ساعات', ' ch')) + '</span>' +
          '<span class="gs-new-b">' +
            '<button class="gp-btn gp-btn--primary" data-gs="new-yes" data-v="' + esc(code) + '" data-lv="' + pl + '">' +
              esc(L('اجتزتها', 'Passed')) + '</button>' +
            '<button class="gp-btn" data-gs="new-no" data-v="' + esc(code) + '">' +
              esc(L('لا', 'Not yet')) + '</button>' +
          '</span>' +
        '</div>';
      });
      h += '</div></div></div>';
    }
    if (noGrade) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-circle-info"></i><div>' +
        esc(L(noGrade + ' من ' + ticked + ' مادةً بلا درجة — معدّلك سيكون جزئياً حتى تضعها.',
              noGrade + ' of ' + ticked + ' courses have no grade — your GPA stays partial until you add them.')) + '</div></div>';
    }
    if (MOVING) {
      h += '<div class="gs-warn"><i class="fa-solid fa-arrows-up-down-left-right"></i><div>' +
        esc(L('اخترتَ ' + MOVING + ' للنقل — اضغط رأسَ المستوى الذي تريده، أو اسحب البطاقة إليه.',
              'You picked ' + MOVING + ' to move — tap the target level’s header, or drag the card there.')) +
        '</div></div>';
    }

    var lang = progLang(), dirAttr = ' dir="' + (lang === 'ar' ? 'rtl' : 'ltr') + '"';
    h += '<div class="gs-levels">';
    lvls.forEach(function (lv) {
      var planned = (byLevel[lv] || []);
      var extra = (W.levels[lv] || []).filter(function (x) {
        return !planned.some(function (c) { return fCode(c) === x.code; });
      });
      var cr = (W.levels[lv] || []).reduce(function (a, x) {
        var c = courseBy(x.code); return a + (c ? fCh(c) : 0);
      }, 0);
      var list = planned.concat(extra.map(function (x) { return courseBy(x.code) || { c: x.code, h: 0, l: lv }; }));

      var numeric = /^\d+$/.test(String(lv)) && +lv > 0;
      var hasSum = hasBag('s' + lv);
      h += '<div class="gs-lv' + (MOVING ? ' is-target' : '') +
             (summerAfter(lv) !== null ? ' is-summer' : '') + '" data-lv="' + lv + '" data-drop="' + lv + '">' +
        '<div class="gs-lv-top">' +
        '<button type="button" class="gs-lv-h" data-gs="drop-here" data-v="' + lv + '">' +
          '<span class="gs-lv-n">' + esc(levelName(lv)) + '</span>' +
          (cr ? '<span class="gs-lv-cr">' + cr + esc(L(' ساعة', ' cr')) + '</span>' : '<span class="gs-lv-cr"></span>') +
          (lv === 0 ? '<span class="gs-lv-fix">' + esc(L('موادها ثابتة', 'fixed')) + '</span>' : '') +
          (MOVING ? '<span class="gs-drop-hint">' + esc(L('انقله هنا', 'drop here')) + '</span>' : '') +
        '</button>' +
        (numeric && !hasSum ? '<button type="button" class="gp-ico gs-lv-add" data-gs="add-summer" data-v="' + lv + '"' +
          ' title="' + esc(L('فصل صيفيّ بعده', 'Summer term after it')) + '"' +
          ' aria-label="' + esc(L('أضف فصلاً صيفيّاً بعد ' + levelName(lv), 'Add a summer term after level ' + lv)) +
          '"><i class="fa-solid fa-sun"></i></button>' : '') +
        (summerAfter(lv) !== null && !(W.levels[lv] || []).length
          ? '<button type="button" class="gp-ico gp-ico--danger gs-lv-add" data-gs="del-summer" data-v="' + lv + '"' +
            ' aria-label="' + esc(L('احذف ' + levelName(lv), 'Delete ' + levelName(lv))) +
            '"><i class="fa-solid fa-trash-can"></i></button>' : '') +
        '</div><div class="gs-cards">';

      if (!list.length && summerAfter(lv) !== null) {
        h += '<p class="gs-hint gs-lv-hint">' + esc(L(
          'فصلٌ صيفيٌّ فارغ — انقل إليه مادّةً بزرِّ النقل أو بالسحب، أو احذفه.',
          'An empty summer term — move a course into it with the move button or by dragging, or delete it.')) + '</p>';
      }
      list.forEach(function (c) {
        var code = fCode(c), at = takenAt(code), on = at !== null;
        var here = String(at) === String(lv);
        if (on && !here) return;                       /*@3.GPSJ.60*/
        var e = on ? entryOf(code) : null;
        var fromElsewhere = on && here && planLevel(c) !== null && String(planLevel(c)) !== String(lv);
        var moving = MOVING === code;
        /*@3.GPSJ.61*/
        h += '<div class="gs-card gs-card--tap' + (on ? ' is-on' : '') + (moving ? ' is-moving' : '') + '"' +
             ' data-code="' + esc(code) + '" role="button" tabindex="0" aria-pressed="' + on + '"' +
             ' data-gs="tick" data-v="' + esc(code) + '" data-lv="' + lv + '"' +
             (on && lv !== 0 ? ' draggable="true"' : '') + '>' +
          '<div class="gs-card-main">' +
            '<span class="gs-tick-box"><i class="fa-solid fa-check"></i></span>' +
            '<span class="gs-card-code">' + esc(code) + '</span>' +
            '<span class="gs-card-name"' + dirAttr + '>' + esc(cTitle(c)) + '</span>' +
          '</div>' +
          '<div class="gs-card-foot">' +
            '<span class="gs-card-ch">' + (fCh(c) ? fCh(c) + esc(L(' ساعة', ' cr')) : '') +
              (lv === 'u' && kindName(c) ? '<em class="gs-card-kind">' + esc(kindName(c)) + '</em>' : '') +
            '</span>' +
            (fromElsewhere ? '<em class="gs-card-from">' + esc(L('من ', 'from ') + levelName(planLevel(c))) + '</em>' : '') +
            (on ? gradeBtn(code, (e && e.grade) || '') : '') +
            (on && lv !== 0 ? '<button type="button" class="gp-ico gs-card-move' + (moving ? ' is-on' : '') +
              '" data-gs="pick" data-v="' + esc(code) + '" title="' + esc(L('نقل إلى مستوى', 'Move to level')) +
              '" aria-label="' + esc(L('نقل إلى مستوى', 'Move to level')) + '"><i class="fa-solid fa-arrows-up-down-left-right"></i></button>' : '') +
          '</div></div>';
      });
      h += '</div></div>';
    });
    return h + '</div>';
  }

  /*@3.GPSJ.62*/
  function levelFromRecord() {
    var max = null;
    Object.keys(W.levels).forEach(function (k) {
      if (k === 'x' || !(W.levels[k] || []).length) return;
      var n = parseInt(k, 10);
      if (!isNaN(n) && (max === null || n > max)) max = n;
    });
    return (max === null) ? null : Math.min(max + 1, MAX_LEVEL);
  }
  function syncLevelWithRecord() {
    var fromRec = levelFromRecord();
    if (fromRec === null) return;
    var cur = parseInt(W.curLevel, 10) || 0;
    if (fromRec > cur) { W.curLevel = String(fromRec); saveDraft(); }
  }

  /*@3.GPSJ.63*/
  function bodyCurrent() {
    syncLevelWithRecord();
    rulesReady(function () { if (W && STEPS[W.step] === 'current') paint(); });
    var passed = passedMap();
    var elig = courses().filter(function (c) {
      return !passed[fCode(c)] && prereqMet(fCode(c), passed) && !fPrep(c);
    }).sort(function (a, b) { return (planLevel(a) || 99) - (planLevel(b) || 99); });
    var blocked = courses().filter(function (c) {
      return !passed[fCode(c)] && !prereqMet(fCode(c), passed) && !fPrep(c);
    });
    var sum = W.cur.reduce(function (n, code) { var c = courseBy(code); return n + (c ? fCh(c) : 0); }, 0);
    var cap = W.term === 'summer' ? CAP_SUM : CAP_REG;

    var h = '<div class="gs-two">' +
      '<div class="gs-field"><label class="gs-lbl" for="gs-lv">' + esc(L('رقم مستواك الحالي', 'Your current level')) + '</label>' +
        '<input class="gs-inp" id="gs-lv" type="number" min="1" max="' + topLevel() + '" value="' + esc(W.curLevel) + '" placeholder="' + topLevel() + '">' +
        '</div>' +
      '<div class="gs-field"><label class="gs-lbl">' + esc(L('نوع الفصل', 'Term type')) + '</label>' +
        '<div class="gs-chips">' +
          '<button class="gp-chip' + (W.term === 'regular' ? ' is-on' : '') + '" data-gs="term" data-v="regular">' + esc(L('عاديّ', 'Regular')) + '</button>' +
          '<button class="gp-chip' + (W.term === 'summer' ? ' is-on' : '') + '" data-gs="term" data-v="summer">' + esc(L('صيفيّ', 'Summer')) + '</button>' +
        '</div></div>' +
    '</div>';

    h += '<div class="gs-cap' + (sum > cap ? ' is-over' : '') + '"><b>' + sum + '</b> / ' + cap + esc(L(' ساعة', ' credits')) + '</div>';
    h += '<p class="gs-lead">' + esc(L(
      'ما يصحّ تسجيلُه الآن: غيرُ مجتاز ومتطلبُه متحقّق — بلا سقفٍ بالمستوى، فقد تسجّل مادةً من مستوًى لاحقٍ حقّقت متطلبها.',
      'What you may register now: not yet passed and prerequisites met — with no level cap, so a later-level course whose prerequisite you met is allowed.')) + '</p>';
    if (RULES_AT === 'busy') {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-cloud-arrow-down"></i><div>' +
        esc(L('نجلب قيودَ بانر… المتطلباتُ المعروضة الآن من خطّتك، وقيودُ المستوى تظهر حين تصل.',
              'Fetching Banner rules… prerequisites shown now come from your plan; level limits appear once they land.')) +
        '</div></div>';
    }
    var broke = W.cur.filter(function (code) {
      return !prereqMet(code, passed) || levelBlocks(code);
    });
    if (broke.length) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-triangle-exclamation"></i><div>' +
        esc(L('اخترتَ ' + broke.length + ' مادةً تخالف قيداً: ' + broke.join('، ') +
                '. نُبقيها لك — والقرارُ قرارك، ولكن البانرَ قد يرفض التسجيل.',
              'You picked ' + broke.length + ' course(s) against a rule: ' + broke.join(', ') +
                '. We keep them — the call is yours, but Banner may refuse the registration.')) +
        '</div></div>';
    }

    var lang = progLang(), dirAttr = ' dir="' + (lang === 'ar' ? 'rtl' : 'ltr') + '"';
    h += '<div class="gs-elig">' + elig.map(function (c) {
      var cc = fCode(c), on = W.cur.indexOf(cc) > -1;
      var win = levelBlocks(cc);
      /*@3.GPSJ.64*/
      return '<div class="gs-card gs-card--tap' + (on ? ' is-on' : '') + (win ? ' is-flag' : '') + '"' +
          ' role="button" tabindex="0" aria-pressed="' + on + '" data-gs="cur" data-v="' + esc(cc) + '">' +
        '<div class="gs-card-main">' +
          '<span class="gs-tick-box"><i class="fa-solid fa-check"></i></span>' +
          '<span class="gs-card-code">' + esc(cc) + '</span>' +
          '<span class="gs-card-name"' + dirAttr + '>' + esc(cTitle(c)) + '</span>' +
        '</div>' +
        '<div class="gs-card-foot">' +
          '<span class="gs-card-ch">' + (fCh(c) ? fCh(c) + esc(L(' ساعة', ' cr')) : '') + '</span>' +
          '<em class="gs-card-from gs-card-lv">' + esc(levelName(planLevel(c))) + '</em>' +
        '</div>' +
        (win ? '<div class="gs-flag"><i class="fa-solid fa-stairs"></i>' + esc(win) + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';

    /*@3.GPSJ.65*/
    if (blocked.length) {
      h += '<details class="gs-blocked"><summary>' +
        '<i class="fa-solid fa-lock"></i><span>' +
        esc(L('لم تحقّق متطلّبها بعد (' + blocked.length + ') — تُضاف استثناءً',
              'Prerequisites not met yet (' + blocked.length + ') — add by exception')) + '</span>' +
        '</summary>' +
        '<p class="gs-hint">' + esc(L(
          'متطلّبٌ سابقٌ لم يتحقّق — فتسجيلها يحتاج استثناءً.',
          'A prerequisite is unmet — registering it needs an exception.')) + '</p>' +
        '<div class="gs-elig">' + blocked.map(function (c) {
          var bc = fCode(c), bon = W.cur.indexOf(bc) > -1;
          return '<div class="gs-card gs-card--tap is-blocked' + (bon ? ' is-on' : '') + '"' +
              ' role="button" tabindex="0" aria-pressed="' + bon + '" data-gs="cur" data-v="' + esc(bc) + '">' +
            '<div class="gs-card-main">' +
              '<span class="gs-tick-box"><i class="fa-solid fa-check"></i></span>' +
              '<span class="gs-card-code">' + esc(bc) + '</span>' +
              '<span class="gs-card-name"' + dirAttr + '>' + esc(cTitle(c)) + '</span>' +
            '</div>' +
            '<div class="gs-card-foot">' +
              '<span class="gs-card-ch">' + (fCh(c) ? fCh(c) + esc(L(' ساعة', ' cr')) : '') + '</span>' +
              '<em class="gs-card-from gs-card-lv">' + esc(L('يلزم ', 'needs ') + prereqOf(bc).join(isAr() ? ' و' : ', ')) + '</em>' +
            '</div></div>';
        }).join('') + '</div></details>';
    }
    return h;
  }

  /*@3.GPSJ.66*/
  function bodyDone() {
    /*@3.GPSJ.67*/
    markWizardOpen(false);
    var n = 0, g = 0;
    Object.keys(W.levels).forEach(function (k) {
      W.levels[k].forEach(function (x) { n++; if (x.grade) g++; });
    });
    var pl = readJSON(PLANK, { semesters: [] });
    return '<div class="gs-done"><i class="fa-solid fa-circle-check"></i>' +
      '<p>' + esc(L('حُفظ كلُّ شيء. سجلُّك ' + n + ' مادةً منها ' + g + ' بدرجة، وبُنيت لك ' +
                    pl.semesters.length + ' فصولٍ مخطّطة لما تبقّى.',
                    'All saved. Your record has ' + n + ' courses (' + g + ' graded), and ' +
                    pl.semesters.length + ' planned terms were built for what remains.')) + '</p></div>';
  }

  /*@3.GPSJ.68*/
  var syPanel = null;

  function markWizardOpen(on) {
    try {
      var st = readJSON(STATE, null) || {};
      if (on) st.wizard_open = true; else delete st.wizard_open;
      writeJSON(STATE, st);
    } catch (e) {}
  }

  function bodySync() {
    markWizardOpen(true);
    return '<p class="gs-hint" id="gs-sy-lead">' + esc(L(
      'بقيت خطوةٌ واحدة: اربط عملَك بحسابٍ ليتبعك إلى جوّالك، ويعود إليك لو غيّرتَ الجهاز.',
      'One step left: link your work to an account so it follows you to your phone — and returns if you switch devices.')) +
      '</p><div id="gs-sy-host"></div>';
  }

  /*@3.GPSJ.69*/
  function mountSync() {
    var host = $('#gs-sy-host');
    if (!host) return;
    if (!window.GardenSyncPanel) {
      loadPanel(function () { mountSync(); });
      return;
    }
    if (syPanel && syPanel.destroy) syPanel.destroy();
    syPanel = window.GardenSyncPanel.mount(host, {
      allowSkip: true,
      /*@3.GPSJ.70*/
      onSkip: function () { W.step = STEPS.indexOf('notify'); paint(); },
    });
  }

  /*@3.GPSJ.71*/

  function notifyState() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;             /*@3.GPSJ.72*/
  }

  /*@3.GPSJ.73*/

  /*@3.GPSJ.74*/
  var NT_LEADS = {
    lectures: [5, 15, 30, 60],
    exams: [60, 720, 1440, 4320],
    tasks: [180, 720, 1440, 2880]
  };
  /*@3.GPSJ.75*/
  function arCount(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n <= 10) return n + ' ' + few;
    return n + ' ' + many;
  }
  function leadWord(min) {
    min = min | 0;
    if (min <= 0) return L('عند وقوعه', 'at the time');
    if (min < 60) return L(arCount(min, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة'), min + ' min');
    if (min < 1440) {
      var h = Math.round(min / 60);
      return L(arCount(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'), h + 'h');
    }
    var d = Math.round(min / 1440);
    return L(arCount(d, 'يوم', 'يومين', 'أيام', 'يوماً'), d + 'd');
  }

  function remSettings() {
    try { return (window.Reminders && Reminders.settings()) || null; } catch (e) { return null; }
  }

  var NT_CH = [
    ['lectures', 'fa-chalkboard', 'قبل محاضراتك', 'Before your lectures',
     'كلُّ محاضرةٍ في جدولك الأسبوعيّ — ومعها القاعةُ أو رابطُ البثّ.',
     'Every lecture in your weekly schedule — with the room or the stream.'],
    ['exams', 'fa-file-pen', 'قبل اختباراتك', 'Before your exams',
     'النصفيُّ والنهائيُّ والكويزات، من جدولك ومن بطاقات موادّك.',
     'Midterms, finals and quizzes — from your schedule and course cards.'],
    ['tasks', 'fa-list-check', 'قبل تسليم مهامّك', 'Before your tasks are due',
     'الواجباتُ والمشاريعُ وكلُّ ما له موعدٌ في قائمة مهامّك.',
     'Assignments, projects and anything with a due date.']
  ];

  function chCard(k, ico, ar, en, dar, den, ch, lead) {
    var on = ch[k] !== false;
    var cur = (lead && lead[k]) || 0;
    var chips = (NT_LEADS[k] || []).map(function (m) {
      return '<button type="button" class="gs-ntl' + (m === cur ? ' is-on' : '') +
        '" data-gs="nt-lead" data-v="' + k + ':' + m + '"' +
        ' aria-pressed="' + (m === cur ? 'true' : 'false') + '">' + esc(leadWord(m)) + '</button>';
    }).join('');
    return '<div class="gs-ntc' + (on ? ' is-on' : '') + '">' +
      '<button type="button" class="gs-ntc-h" data-gs="nt-ch" data-v="' + k + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="gs-tick-box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
        '<i class="fa-solid ' + ico + ' gs-ntc-i" aria-hidden="true"></i>' +
        '<span class="gs-ntc-t"><b>' + esc(L(ar, en)) + '</b>' +
          '<span>' + esc(L(dar, den)) + '</span></span>' +
      '</button>' +
      '<div class="gs-ntc-l">' +
        '<span class="gs-ntc-lb">' + esc(L('يصلك قبله بـ', 'Arrives')) + '</span>' + chips +
      '</div>' +
    '</div>';
  }

  function bodyNotify() {
    var st = notifyState();
    var rs = remSettings() || {};
    var ch = rs.channels || { lectures: true, exams: true, tasks: true };
    var lead = rs.lead || { lectures: 15, exams: 1440, tasks: 720 };

    /*@3.GPSJ.76*/
    var gate;
    if (st === 'granted') {
      gate = '<div class="gs-gate is-ok">' +
        '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
        '<div class="gs-gate-t"><b>' + esc(L('الإذنُ ممنوح', 'Permission granted')) + '</b>' +
          '<span>' + esc(L('تنبيهاتُك تصلك على هذا الجهاز — جرّبها الآن لترى شكلَها.',
                            'Alerts reach this device — send one now to see how it looks.')) + '</span></div>' +
        '<button type="button" class="gp-btn" data-gs="notify-test">' +
          '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> ' +
          esc(L('جرّب تنبيهاً', 'Send a test')) + '</button></div>';
    } else if (st === 'denied' || st === 'unsupported') {
      /*@3.GPSJ.77*/
      gate = '<div class="gs-gate is-warn">' +
        '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<div class="gs-gate-t"><b>' + esc(st === 'denied'
            ? L('المتصفّحُ يمنع الإشعارات', 'The browser blocks notifications')
            : L('هذا المتصفّحُ لا يدعم الإشعارات', 'This browser has no notifications')) + '</b>' +
          '<span>' + esc(st === 'denied'
            ? L('لا يُعاد الإذنُ من داخل الصفحة. افتح القفلَ في شريط العنوان ⇐ الإشعارات ⇐ سماح، ثم عُد.',
                'A page cannot restore that. Open the padlock in the address bar → Notifications → Allow, then come back.')
            : L('بقيّةُ الحديقة تعمل كما هي، وخياراتُك أدناه تُحفظ لجهازٍ يدعمها.',
                'The rest of the Garden works; your choices below are saved for a device that supports it.')) +
          '</span></div></div>';
    } else {
      gate = '<div class="gs-gate">' +
        '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
        '<div class="gs-gate-t"><b>' + esc(L('خطوةٌ واحدةٌ تفتح البابَ', 'One tap opens the door')) + '</b>' +
          '<span>' + esc(L('سيسألك المتصفّحُ إذناً — اقبله ليصلك التذكيرُ ولو كان الموقعُ مغلقاً.',
                            'The browser will ask for permission — allow it so reminders arrive even when the site is closed.')) +
          '</span></div>' +
        '<button type="button" class="gp-btn gp-btn--primary" data-gs="notify-on">' +
          '<i class="fa-solid fa-bell" aria-hidden="true"></i> ' +
          esc(L('فعّل التنبيهات', 'Turn reminders on')) + '</button></div>';
    }

    /*@3.GPSJ.78*/
    var cards = NT_CH.map(function (c) {
      return chCard(c[0], c[1], c[2], c[3], c[4], c[5], ch, lead);
    }).join('');

    /*@3.GPSJ.79*/
    var extra = '';
    var W = window.GardenWatch;
    if (W && W.state) {
      var watching = false;
      try {
        watching = W.has ? !!W.has('term', '*', '*')
                         : (W.state().watches || []).some(function (w) { return w.kind === 'term'; });
      } catch (e) {}
      extra += '<div class="gs-ntc' + (watching ? ' is-on' : '') + '">' +
        '<button type="button" class="gs-ntc-h" data-gs="nt-term" aria-pressed="' + (watching ? 'true' : 'false') + '">' +
          '<span class="gs-tick-box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
          '<i class="fa-solid fa-calendar-plus gs-ntc-i" aria-hidden="true"></i>' +
          '<span class="gs-ntc-t"><b>' + esc(L('نزولُ فصلٍ دراسيٍّ جديد', 'A new term opens')) + '</b>' +
            '<span>' + esc(L('نُنبّهك ساعةَ يفتح البانرُ فصلاً جديداً — قبل أن تمتلئ الشعبُ الجيدة.',
                              'We tell you the moment Banner opens a new term — before the good sections fill.')) +
            '</span></span></button></div>';
    }
    var I = window.GardenICS;
    if (I && I.state) {
      var ist = {};
      try { ist = I.state() || {}; } catch (e) {}
      var linkedIcs = !!ist.url;
      extra += '<div class="gs-ntc' + (linkedIcs ? ' is-on' : '') + '">' +
        '<span class="gs-ntc-h is-static">' +
          '<span class="gs-tick-box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
          '<i class="fa-solid fa-calendar-days gs-ntc-i" aria-hidden="true"></i>' +
          '<span class="gs-ntc-t"><b>' + esc(L('تقويمُ البلاك بورد', 'Your Blackboard calendar')) + '</b>' +
            '<span>' + esc(linkedIcs
              ? L('مربوطٌ — مواعيدُ البلاك بورد تدخل جدولك وتُنبّهك مع بقيّة مهامّك.',
                  'Linked — Blackboard dates enter your schedule and alert you with everything else.')
              : L('اربطه لتدخل تسليماتُ البلاك بورد جدولَك تلقائياً. الربطُ من إعدادات الجدول برابط التقويم.',
                  'Link it so Blackboard due dates flow into your schedule. Connect it from the schedule settings with your calendar link.')) +
            '</span></span></span>' +
        (linkedIcs ? '' : '<div class="gs-ntc-l"><a class="gs-ntl gs-ntl--go" href="' +
          (/\/hub\//.test(location.pathname) ? 'schedule.html' : 'hub/schedule.html') + '#ics">' +
          esc(L('افتح صفحةَ الربط', 'Open the link page')) + '</a></div>') +
      '</div>';
    }

    return '<div class="gs-nt">' +
      '<p class="gs-lead">' + esc(L(
        'الحديقةُ تُذكّرك بما يقع في جدولك **قبل** وقوعه: محاضرةٌ تبدأ، اختبارٌ يقترب، مهمّةٌ تُسلَّم. ' +
        'اختر ما يصلك ومتى يصلك — وكلُّ هذا يتبدّل لاحقاً من الإعدادات ← التنبيهات.',
        'The Garden reminds you of what is coming before it arrives: a lecture starting, an exam nearing, a task due. ' +
        'Pick what reaches you and when — all of it changeable later from Settings → Reminders.').replace(/\*\*/g, '')) + '</p>' +
      gate +
      '<div class="gs-ntg">' + cards + '</div>' +
      (extra ? '<p class="gs-nt-h">' + esc(L('وما وراء جدولك', 'Beyond your schedule')) + '</p>' +
               '<div class="gs-ntg">' + extra + '</div>' : '') +
    '</div>';
  }

  /*@3.GPSJ.80*/
  function wireNotify() {
    var b = $('[data-gs="notify-on"]');
    if (b) b.addEventListener('click', function () {
      b.disabled = true;
      var done = function () {
        /*@3.GPSJ.81*/
        if (notifyState() === 'granted') {
          try {
            var s = JSON.parse(localStorage.getItem('garden_reminders') || '{}');
            s.enabled = true;
            localStorage.setItem('garden_reminders', JSON.stringify(s));
          } catch (e) {}
          try { window.Reminders && Reminders.refresh && Reminders.refresh(); } catch (e) {}
        }
        paint();
      };
      try {
        var p = (window.Reminders && Reminders.requestPermission)
          ? Reminders.requestPermission() : Notification.requestPermission();
        if (p && p.then) p.then(done, done); else done();
      } catch (e) { done(); }
    });
    var t = $('[data-gs="notify-test"]');
    if (t) t.addEventListener('click', function () {
      t.disabled = true;
      var back = function () { t.disabled = false; };
      try {
        var q = window.Reminders && Reminders.test && Reminders.test();
        if (q && q.then) q.then(back, back); else back();
      } catch (e) { back(); }
    });
  }

  /*@3.GPSJ.82*/
  var PBASE = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared\/gpa-setup\.js(\?.*)?$/, '') : '';
  })();
  var panelLoading = false;
  function loadPanel(cb) {
    if (window.GardenSyncPanel) { cb(); return; }
    if (panelLoading) { setTimeout(function () { loadPanel(cb); }, 200); return; }
    panelLoading = true;
    var sc = document.createElement('script');
    sc.src = PBASE + 'shared/sync-panel.js';
    sc.onload = function () { panelLoading = false; cb(); };
    sc.onerror = function () { panelLoading = false; cb(); };
    document.head.appendChild(sc);
  }

  /*@3.GPSJ.83*/
  function openMove(code) {
    MOVING = code;
    var at = takenAt(code);
    var box = document.createElement('div');
    box.id = 'gs-move'; box.className = 'gp-overlay gs-move-ov';
    box.innerHTML = '<div class="gs-move-box" role="dialog" aria-modal="true">' +
      '<h4>' + esc(L('نقل ', 'Move ') + code + L(' إلى مستوى', ' to level')) + '</h4>' +
      '<div class="gs-chips">' + levelsInUse().filter(function (n) { return n !== 0; }).map(function (n) {
        return '<button class="gp-chip' + (String(at) === String(n) ? ' is-on' : '') +
          '" data-gs="move-to" data-v="' + n + '">' + esc(levelName(n)) + '</button>';
      }).join('') + '</div>' +
      '<button class="gp-btn" data-gs="move-cancel">' + esc(L('إلغاء', 'Cancel')) + '</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gs]');
      if (!b) { if (e.target === box) closeMove(); return; }
      var a = b.getAttribute('data-gs');
      if (a === 'move-cancel') return closeMove();
      if (a === 'move-to') { moveTo(MOVING, b.getAttribute('data-v')); closeMove(); paint(); }
    });
  }
  function closeMove() { var b = $('#gs-move'); if (b) b.remove(); MOVING = null; }

  function moveTo(code, lv) {
    var from = takenAt(code); if (from === null) return;
    var e = entryOf(code);
    W.levels[from] = W.levels[from].filter(function (x) { return x.code !== code; });
    /*@3.GPSJ.122*/
    if (!W.levels[from].length && summerAfter(from) === null) delete W.levels[from];
    (W.levels[lv] = W.levels[lv] || []).push(e);
  }

  /*@3.GPSJ.84*/
  function onClick(e) {
    /*@3.GPSJ.85*/
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      if (MODE === 'planner') plClose(); else close(true);
      return;
    }
    if (!e.target.closest('[data-gs="grade"]')) closeGrade();
    if (MODE === 'planner') { plClick(e); return; }
    var b = e.target.closest('[data-gs]'); if (!b) return;
    var a = b.getAttribute('data-gs'), v = b.getAttribute('data-v');
    if (a === 'close') { close(true); return; }
    if (a === 'fresh') { W = blank(); W.step = 1; paint(); return; }
    if (a === 'back') { if (W.step > 0) { W.step--; paint(); } return; }
    if (a === 'next') { next(); return; }
    if (a === 'prog') {
      W.program = v; W.plan_version = ''; W.track = '';
      resolveUnknownLevels();          /*@3.GPSJ.86*/
      paint(); return;
    }
    if (a === 'track') { W.track = v; paint(); return; }
    if (a === 'term') { W.term = v; paint(); return; }
    if (a === 'year') { W.start_year = v; if (!W.curLevel) { var g = levelFromYear(v); if (g !== null) W.curLevel = String(g); } paint(); return; }
    if (a === 'older') { oldYears = true; paint(); return; }
    if (a === 'goto') { W.step = Math.max(0, Math.min(+v, STEPS.length - 2)); paint(); return; }
    if (a === 'retry') { PLANS = null; planErr = false; loadPlans(function (ok) { planErr = !ok; paint(); }); return; }
    if (a === 'skip-prog') { W.step++; paint(); return; }
    /*@3.GPSJ.87*/
    if (a === 'nt-ch') {
      try {
        var cs = Reminders.settings().channels || {};
        var p = { channels: {} };
        p.channels[v] = !(cs[v] !== false);
        Reminders.save(p);
        Reminders.refresh && Reminders.refresh();
      } catch (e) {}
      paint();
      return;
    }
    /*@3.GPSJ.88*/
    if (a === 'nt-lead') {
      var pr = String(v || '').split(':'), k = pr[0], m = parseInt(pr[1], 10) || 0;
      try {
        var pl = { lead: {}, channels: {} };
        pl.lead[k] = m; pl.channels[k] = true;
        Reminders.save(pl);
        Reminders.refresh && Reminders.refresh();
      } catch (e) {}
      paint();
      return;
    }
    /*@3.GPSJ.89*/
    if (a === 'nt-term') {
      var Wc = window.GardenWatch;
      if (!Wc || !Wc.toggle) return;
      b.disabled = true;
      /*@3.GPSJ.90*/
      Promise.resolve(Wc.toggle('term', '*', '*'))
        .then(function () { paint(); })
        .catch(function () { b.disabled = false; });
      return;
    }
    if (a === 'pick') { MOVING = (MOVING === v) ? null : v; paint(); return; }
    if (a === 'grade') { openGrade(b, v); return; }
    if (a === 'del-summer') {
      if (!(W.levels[v] || []).length) delete W.levels[v];
      saveDraft(); paint(); return;
    }
    if (a === 'add-summer') {
      var sk = 's' + v;
      if (!(W.levels[sk] || []).length) {
        W.levels[sk] = W.levels[sk] || [];
        if (MOVING) { moveTo(MOVING, sk); MOVING = null; }
      }
      claimRecord(); saveDraft(); paint(); return;
    }
    if (a === 'drop-here') {
      if (MOVING) { moveTo(MOVING, v); claimRecord(); saveDraft(); MOVING = null; paint(); }
      return;
    }
    if (a === 'new-yes' || a === 'new-no') {
      claimRecord();
      if (a === 'new-yes') {
        var nlv = b.getAttribute('data-lv');
        (W.levels[nlv] = W.levels[nlv] || []).push({ code: v, grade: '' });
      } else {
        W.planAsk = W.planAsk || {};
        W.planAsk[normCode(v)] = 1;
      }
      saveDraft();
      if (!newlyAdded().length) sealPlanSeen();
      paint(); return;
    }
    if (a === 'tick') {
      claimRecord();
      var lv = b.getAttribute('data-lv'), at = takenAt(v);
      if (at !== null) {
        W.levels[at] = W.levels[at].filter(function (x) { return x.code !== v; });
        if (!W.levels[at].length && summerAfter(at) === null) delete W.levels[at];
      } else {
        (W.levels[lv] = W.levels[lv] || []).push({ code: v, grade: '' });
      }
      paint(); return;
    }
    if (a === 'cur') {
      var i = W.cur.indexOf(v);
      if (i > -1) W.cur.splice(i, 1); else W.cur.push(v);
      paint(); return;
    }
  }
  function onChange(e) {
    var s = e.target;
    if (s.classList && s.classList.contains('gs-c-g')) {
      var en = entryOf(s.getAttribute('data-v'));
      if (en) { en.grade = s.value; saveDraft(); }
      return;
    }
  }
  function onInput(e) {
    var s = e.target;
    if (MODE === 'planner') { plInput(e); return; }
    if (s.id === 'gs-name-ar') W.name_ar = s.value;
    else if (s.id === 'gs-name-en') W.name_en = s.value;
    else if (s.id === 'gs-lv') W.curLevel = s.value;
    else return;
    saveDraft();
  }

  function next() {
    var name = STEPS[W.step];
    /*@3.GPSJ.91*/
    autoTickBelow();
    /*@3.GPSJ.92*/
    if (name === 'welcome' && !hasAnything(W)) { W.step = STEPS.indexOf('you'); paint(); return; }
    if (name === 'done') { close(); location.reload(); return; }
    if (name === 'major' && !W.program) return;
    if (name === 'current') { save(); W.step = STEPS.indexOf('sync'); paint(); return; }
    if (name === 'sync') { W.step = STEPS.indexOf('notify'); paint(); return; }
    if (name === 'notify') { W.step = STEPS.indexOf('done'); paint(); return; }
    W.step++; paint();
  }

  /*@3.GPSJ.93*/
  function save() {
    autoTickBelow();
    var p = readJSON(PROF, {}) || {};
    var nameAr = W.name_ar || W.name_en, nameEn = W.name_en || W.name_ar;
    if (nameAr || nameEn) { p.name = nameAr; p.name_ar = nameAr; p.name_en = nameEn; }
    if (W.start_year) p.start_year = W.start_year;
    if (W.program) p.program = W.program;
    if (W.plan_version) p.plan_version = W.plan_version;
    if (W.track) p.track = W.track;
    if (W.curLevel) { p.level = String(W.curLevel); p.levels = [String(W.curLevel)]; }
    /*@3.GPSJ.94*/
    var passed = passedMap();
    p.passed_extra = Object.keys(passed);
    writeJSON(PROF, p);

    /*@3.GPSJ.95*/
    var arch = (readJSON(ARCH, []) || []).filter(function (a) {
      return a && a.id && String(a.id).indexOf('gpa_L') !== 0 && a.id !== 'onb_prior';
    });
    var ord = 0;
    Object.keys(W.levels).sort(function (a, b) { return lvRank(a) - lvRank(b); }).forEach(function (lv) {
      /*@3.GPSJ.111*/
      var mine = W.levels[lv].filter(function (x) { return !x.from; });
      if (!mine.length) return;
      var sa = summerAfter(lv);
      arch.push({
        id: 'gpa_L' + lv,
        level: (sa !== null || !/^\d+$/.test(String(lv))) ? null : +lv,
        summer: sa !== null, after: sa,
        ord: ord++,
        name: levelNameIn(lv, isAr() ? 'ar' : 'en'),
        name_ar: levelNameIn(lv, 'ar'), name_en: levelNameIn(lv, 'en'),
        courses: mine.map(function (x) {
          var c = courseBy(x.code), o = { code: x.code, grade: x.grade || null };
          if (c) o.credits = fCh(c);
          return o;
        })
      });
    });
    writeJSON(ARCH, arch);

    var sem = readJSON(SEM, null) || {};
    sem.id = sem.id || ('sem_' + Date.now());
    /*@3.GPSJ.96*/
    sem.level = +W.curLevel || 0;
    sem.summer = (W.term === 'summer');
    sem.name_ar = sem.summer ? 'فصل صيفيّ' : levelNameIn(sem.level, 'ar');
    sem.name_en = sem.summer ? 'Summer term' : levelNameIn(sem.level, 'en');
    sem.name = isAr() ? sem.name_ar : sem.name_en;
    sem.term = W.term;
    var was = {}; (sem.courses || []).forEach(function (c) { if (c && c.code) was[c.code] = c; });
    sem.courses = W.cur.map(function (code) {
      return was[code] || { code: code, added_at: new Date().toISOString(), completed: false, grade: null };
    });
    sem.updated_at = new Date().toISOString();
    writeJSON(SEM, sem);

    autoPlan();
    localStorage.removeItem(DRAFT);
    /*@3.GPSJ.97*/
    try { document.dispatchEvent(new CustomEvent('garden:gradesChanged')); } catch (e) {}
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }
  }

  /*@3.GPSJ.98*/
  function autoPlan() {
    var passed = passedMap();
    var taken = {}; W.cur.forEach(function (c) { taken[c] = true; });
    var rest = courses().filter(function (c) {
      var cc = fCode(c); return !passed[cc] && !taken[cc] && !fPrep(c);
    });
    if (!rest.length) { writeJSON(PLANK, { semesters: [] }); return; }

    var cur = parseInt(W.curLevel, 10) || 1;
    /*@3.GPSJ.99*/
    rest.sort(function (a, b) {
      var la = planLevel(a), lb = planLevel(b);
      return (la === null ? 99 : la) - (lb === null ? 99 : lb) ||
             String(fCode(a)).localeCompare(String(fCode(b)));
    });

    var maxPlan = rest.reduce(function (m, c) {
      var lv = planLevel(c); return (lv !== null && lv > m) ? lv : m;
    }, cur);

    /*@3.GPSJ.100*/
    var first = (W.term === 'summer') ? cur : cur + 1;
    var slots = [], lv;
    for (lv = first; lv <= maxPlan; lv++) {
      slots.push({ level: lv, summer: false, courses: [], cr: 0 });
      /*@3.GPSJ.101*/
      if ((lv - first + 1) % 2 === 0) slots.push({ level: lv, summer: true, courses: [], cr: 0 });
    }
    if (!slots.length) slots.push({ level: first, summer: false, courses: [], cr: 0 });

    var queue = rest.slice(), guard = 0;
    function place() {
      for (var i = 0; i < slots.length && queue.length; i++) {
        var s = slots[i], cap = s.summer ? CAP_SUM : CAP_REG;
        for (var j = 0; j < queue.length; j++) {
          var c = queue[j], lvc = planLevel(c), h = fCh(c) || 3;
          if (lvc !== null && lvc > s.level) continue;   /*@3.GPSJ.102*/
          if (s.cr + h > cap) continue;
          s.courses.push(c); s.cr += h; queue.splice(j, 1); j--;
        }
      }
    }
    place();
    /*@3.GPSJ.103*/
    while (queue.length && guard++ < 12) {
      var last = slots[slots.length - 1];
      var nlv = Math.min((last ? last.level : first) + 1, MAX_LEVEL);
      slots.push({ level: nlv, summer: false, courses: [], cr: 0 });
      if ((nlv - first + 1) % 2 === 0) slots.push({ level: nlv, summer: true, courses: [], cr: 0 });
      place();
    }

    /*@3.GPSJ.104*/
    var out = slots.filter(function (s) { return s.summer || s.courses.length; });
    var sN = 0;
    writeJSON(PLANK, {
      semesters: out.map(function (s) {
        return {
          level: s.level, summer: s.summer,
          /*@3.GPSJ.105*/
          name: s.summer ? L('صيفيُّ ' + levelName(s.level), 'Summer after ' + levelName(s.level))
                         : levelName(s.level),
          short: s.summer ? (++sN) : 0,
          courses: s.courses.map(function (c) {
            return { code: fCode(c), name: cTitle(c), credits: fCh(c) || 3, grade: 'B+' };
          })
        };
      })
    });
  }

  /*@3.GPSJ.125*/
  var PC = null, PQ = '', PMOVE = null, RULES_STATE = 'idle';

  function R() { return window.GardenPlanRules || null; }

  function plUid() {
    return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }
  var BOARD = 'plan';
  function onArch() { return BOARD === 'arch'; }
  function plKey() { return onArch() ? ARCH : PLANK; }

  function plRead() {
    var p, fresh;
    if (onArch()) {
      var list = readJSON(ARCH, null);
      fresh = !Array.isArray(list);
      p = { semesters: Array.isArray(list) ? list : [] };
    } else {
      p = readJSON(PLANK, null);
      fresh = !p || !Array.isArray(p.semesters);
      if (fresh) p = { semesters: [] };
    }
    var seen = {}, n = 0, uids = {};
    p.semesters.forEach(function (s) {
      s.courses = Array.isArray(s.courses) ? s.courses : [];
      if (!s.id || seen[s.id]) { s.id = 'pt' + (Date.now() % 1e7) + '_' + (n++); fresh = true; }
      seen[s.id] = 1;
      s.courses.forEach(function (c) {
        if (!c.uid || uids[c.uid]) { c.uid = plUid() + (n++); fresh = true; }
        uids[c.uid] = 1;
      });
    });
    /*@3.GPSJ.144*/
    if (fresh) plStore(p);
    return p;
  }
  /*@3.GPSJ.155*/
  function plStore(p) {
    if (!onArch()) { writeJSON(PLANK, p); return; }
    writeJSON(ARCH, p.semesters);
    try { localStorage.setItem('__syncT_semester_archive', String(Date.now())); } catch (e) {}
  }
  function plWrite(p) {
    plStore(p);
    plAfter();
  }
  /*@3.GPSJ.156*/
  function plAfter() {
    if (onArch()) {
      try { if (window.GardenData && GardenData.rebuildGrades) GardenData.rebuildGrades(); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent('garden:gradesChanged', { detail: { source: 'archive' } })); } catch (e) {}
      return;
    }
    try { document.dispatchEvent(new CustomEvent('garden:planChanged')); } catch (e) {}
  }

  /*@3.GPSJ.145*/
  var PSNAP = null, PUNDO = [];
  /*@3.GPSJ.157*/
  function plRaw(p) { return JSON.stringify(onArch() ? p.semesters : p); }
  function plMark(p) {
    try { PUNDO.push(plRaw(p)); } catch (e) { return; }
    if (PUNDO.length > 40) PUNDO.shift();
  }
  function plRestore(raw) {
    if (raw == null) return false;
    try { localStorage.setItem(plKey(), raw); } catch (e) { return false; }
    if (onArch()) { try { localStorage.setItem('__syncT_semester_archive', String(Date.now())); } catch (e) {} }
    plAfter();
    return true;
  }
  function plDirty() {
    if (PSNAP == null) return false;
    var now = null;
    try { now = localStorage.getItem(plKey()); } catch (e) { return false; }
    return String(now || '') !== String(PSNAP);
  }

  function plCtx() {
    var prof = readJSON(PROF, {}) || {};
    var passed = {}, curCodes = [];
    (readJSON(ARCH, []) || []).forEach(function (a) {
      (a && a.courses || []).forEach(function (c) { if (c && c.code) passed[c.code] = c.grade || true; });
    });
    (prof.passed_extra || []).forEach(function (c) { if (c) passed[c] = passed[c] || true; });
    var sem = readJSON(SEM, null);
    if (sem && sem.courses) curCodes = sem.courses.map(function (c) { return c && c.code; }).filter(Boolean);
    var lv = parseInt(prof.level, 10) || 0;
    return {
      slug: prof.program || '',
      level: lv,
      summer: !!(sem && sem.summer),
      passed: passed,
      cur: curCodes,
      span: R() ? R().levelSpan(prof.program || '') : { lo: 1, hi: 8, prep: false, known: false }
    };
  }

  function plTitle(c) {
    if (!c) return '';
    var ar = (c.ta != null ? c.ta : c.title_ar), en = (c.t != null ? c.t : c.title);
    return (isAr() ? (ar || en) : (en || ar)) || '';
  }
  function plCourse(code) { return R() ? R().courseBy(PC.slug, code) : null; }
  /*@3.GPSJ.163*/
  function plRowName(c) {
    if (!c) return '';
    if (onArch()) {
      var b = isAr() ? (c.name_ar || c.name_en) : (c.name_en || c.name_ar);
      if (b) return b;
      var t = plTitle(plCourse(c.code));
      if (t) return t;
      var i = null;
      try { i = (window.GardenData && GardenData.courseInfo) ? GardenData.courseInfo(c.code) : null; }
      catch (e) { i = null; }
      if (i) return (isAr() ? (i.name_ar || i.name_en) : (i.name_en || i.name_ar)) || c.code;
      return c.name || c.code || '';
    }
    return c.name || plName(c.code, '');
  }
  function plName(code, fallback) {
    var c = plCourse(code);
    return plTitle(c) || fallback || code || '';
  }

  /*@3.GPSJ.128*/
  function plTermName(s, i) {
    if (onArch()) {
      var b = isAr() ? (s.name_ar || s.name) : (s.name_en || s.name);
      if (b) return b;
      if (s.summer) return L('فصل صيفيّ', 'Summer term');
      if (s.level != null && s.level !== '') return levelName(s.level);
      return L('فصلٌ مؤرشف ' + (i + 1), 'Archived term ' + (i + 1));
    }
    if (s.renamed && s.name) return s.name;
    if (s.summer) return L('فصل صيفيّ', 'Summer term');
    if (s.level != null) return levelName(s.level);
    return s.name || L('فصل مخطّط ' + (i + 1), 'Planned term ' + (i + 1));
  }
  function plCap(s) { return s && s.summer ? CAP_SUM : CAP_REG; }
  function plCr(s) {
    return (s.courses || []).reduce(function (a, c) { return a + (+c.credits || 0); }, 0);
  }
  /*@3.GPSJ.165*/
  function plTermGpa(s) {
    var pts = 0, cr = 0;
    (s.courses || []).forEach(function (c) {
      if (!c || !c.grade || GPA_SCALE[c.grade] === undefined) return;
      var h = +c.credits || 0;
      pts += GPA_SCALE[c.grade] * h; cr += h;
    });
    return cr ? (pts / cr) : null;
  }
  function plUngraded(s) {
    return (s.courses || []).filter(function (c) { return c && !c.grade; }).length;
  }

  /*@3.GPSJ.126*/
  function plPassedBefore(p, upto) {
    var m = {};
    Object.keys(PC.passed).forEach(function (k) { m[k] = 1; });
    PC.cur.forEach(function (k) { m[k] = 1; });
    for (var i = 0; i < upto && i < p.semesters.length; i++) {
      (p.semesters[i].courses || []).forEach(function (c) { if (c && c.code) m[c.code] = 1; });
    }
    return m;
  }

  function plIssues(p, si, course) {
    /*@3.GPSJ.159*/
    if (onArch()) return [];
    if (!R() || !course || !course.code) return [];
    var s = p.semesters[si];
    return R().check({
      slug: PC.slug, code: course.code,
      passed: plPassedBefore(p, si),
      level: (s && s.level != null) ? s.level : null
    });
  }

  function plIssueText(v) {
    if (v.k === 'pre') return L('يلزمها قبلها: ' + plGroupWord(v.groups), 'Needs first: ' + plGroupWord(v.groups));
    if (v.k === 'level') return levelWord(v.code, v.at);
    return '';
  }
  function plGroupWord(groups) {
    return groups.map(function (g) { return g.join(isAr() ? ' أو ' : ' or '); })
                 .join(isAr() ? ' و' : ', ');
  }

  function levelWord(code, at) {
    var Rr = window.GardenPlanRules;
    var n = Rr && Rr.levelNote(code, PC ? PC.span : null);
    if (!n) return '';
    if (n.tail) {
      return L('بانر لا يفتحها قبل ' + levelName(n.min) + ' — وهذا الفصل عند المستوى ' + at + '.',
               'Banner does not open it before level ' + n.min + ' — this term sits at level ' + at + '.');
    }
    return L('بانر يقصرها على ' + n.list.map(levelName).join('، ') + ' — وهذا الفصل عند المستوى ' + at + '.',
             'Banner limits it to levels ' + n.list.join(', ') + ' — this term sits at level ' + at + '.');
  }

  /*@3.GPSJ.129*/
  function plGeneral(c) {
    if (!c) return false;
    var k = c.k || c.category;
    return k === 'university' || R().planLevel(c) === null;
  }

  /*@3.GPSJ.160*/
  function arPool(p) {
    var have = {};
    p.semesters.forEach(function (s) {
      (s.courses || []).forEach(function (c) { if (c && c.code) have[c.code] = 1; });
    });
    var seen = {}, out = [];
    function add(code, ar, en, ch, lv) {
      if (!code || have[code] || seen[code]) return;
      seen[code] = 1;
      out.push({ c: code, ta: ar || '', t: en || '', h: (+ch || 3), l: (lv == null ? '' : lv) });
    }
    if (R() && PC.slug) {
      R().courses(PC.slug).forEach(function (c) {
        var code = R().fCode(c);
        add(code, R().courseTitle(PC.slug, code, 'ar'), R().courseTitle(PC.slug, code, 'en'),
            R().fCh(c), R().planLevel(c));
      });
    }
    /*@3.GPSJ.161*/
    var cat = [];
    try { cat = (window.GardenData && GardenData.catalogList && GardenData.catalogList()) || []; }
    catch (e) { cat = []; }
    cat.forEach(function (c) {
      if (!c || !c.code) return;
      if (R() && PC.slug && R().inProgram(PC.slug, c.code) === false) return;
      var m = /^L(\d+)$/.exec(String(c.level || ''));
      add(c.code, c.name_ar, c.name_en, c.credits, m ? +m[1] : null);
    });
    var sem = readJSON(SEM, null);
    ((sem && sem.courses) || []).forEach(function (c) {
      if (c && c.code) add(c.code, c.name_ar, c.name_en, c.credits, null);
    });
    out.sort(function (a, b) {
      var la = (a.l === '' ? 99 : +a.l), lb = (b.l === '' ? 99 : +b.l);
      return la - lb || (a.c < b.c ? -1 : (a.c > b.c ? 1 : 0));
    });
    return out;
  }

  function plRemaining(p) {
    if (onArch()) return arPool(p);
    if (!R()) return [];
    var inPlan = {};
    p.semesters.forEach(function (s) {
      (s.courses || []).forEach(function (c) { if (c && c.code) inPlan[c.code] = 1; });
    });
    var cur = {}; PC.cur.forEach(function (c) { cur[c] = 1; });
    return R().courses(PC.slug).filter(function (c) {
      var code = R().fCode(c);
      if (!code) return false;
      if (R().fPrep(c)) return false;
      return !PC.passed[code] && !cur[code] && !inPlan[code];
    }).sort(function (a, b) {
      var la = R().planLevel(a), lb = R().planLevel(b);
      return (la === null ? 99 : la) - (lb === null ? 99 : lb) ||
             String(R().fCode(a)).localeCompare(String(R().fCode(b)));
    });
  }

  function plNextLevel(p) {
    var mx = null;
    p.semesters.forEach(function (s) {
      if (s.summer || s.level == null) return;
      var n = parseInt(s.level, 10);
      if (!isNaN(n) && (mx === null || n > mx)) mx = n;
    });
    if (mx === null) mx = Math.max(PC.level || 0, (PC.span && PC.span.lo ? PC.span.lo - 1 : 0));
    return Math.min(mx + 1, MAX_LEVEL);
  }

  function plLastLevel(p) {
    var lv = null;
    p.semesters.forEach(function (s) { if (!s.summer && s.level != null) lv = parseInt(s.level, 10); });
    return lv === null ? (PC.level || plNextLevel(p) - 1) : lv;
  }

  /*@3.GPSJ.175*/
  var PT = null, PSHEET = null, PSEL = {}, PGUARD = null, PAUTO = null;

  function plActive(p) {
    if (PT && plIndex(p, PT) >= 0) return PT;
    PT = p.semesters.length ? p.semesters[0].id : null;
    return PT;
  }
  function plGo(id) { PT = id; PGUARD = null; }
  function plOpenSheet(k, extra) {
    PSHEET = Object.assign({ k: k }, extra || {});
    if (k === 'pick') { PSEL = {}; PQ = ''; }
  }
  function plCloseSheet() { PSHEET = null; PSEL = {}; PAUTO = null; PQ = ''; }

  function plStrip(p) {
    var cur = plActive(p);
    var h = p.semesters.map(function (s, i) {
      var cr = plCr(s), cap = plCap(s);
      return '<button type="button" class="gpp-tab' + (s.id === cur ? ' is-now' : '') + (s.summer ? ' is-summer' : '') +
        '" data-gs="pl-go" data-v="' + esc(s.id) + '" data-pdrop="' + esc(s.id) + '" role="tab" aria-selected="' + (s.id === cur ? 'true' : 'false') + '">' +
        '<span class="gpp-tab-n">' + esc(plTermName(s, i)) + '</span>' +
        '<small class="gp-num">' + cr + (onArch() ? '' : '/' + cap) + '</small></button>';
    }).join('');
    h += '<button type="button" class="gpp-tab gpp-tab--add" data-gs="pl-newmenu" title="' +
      esc(L('فصلٌ جديد', 'New term')) + '"><span class="gpp-tab-n"><i class="fa-solid fa-plus" aria-hidden="true"></i> ' +
      esc(L('فصل', 'Term')) + '</span><small>&nbsp;</small></button>';
    if (p.semesters.length > 1) {
      h += '<button type="button" class="gp-ico gpp-tab-more" data-gs="pl-order" aria-label="' +
        esc(L('رتّب الفصول', 'Reorder terms')) + '" title="' + esc(L('رتّب الفصول', 'Reorder terms')) +
        '"><i class="fa-solid fa-arrow-down-1-9" aria-hidden="true"></i></button>';
    }
    return h;
  }

  function arHeadBar(p) {
    var nT = p.semesters.length, cr = 0, pts = 0, gcr = 0, noG = 0;
    p.semesters.forEach(function (s) {
      (s.courses || []).forEach(function (c) {
        var h = +c.credits || 0;
        cr += h;
        if (c.grade && GPA_SCALE[c.grade] !== undefined) { pts += GPA_SCALE[c.grade] * h; gcr += h; }
        else if (!c.grade) noG++;
      });
    });
    return '<div class="gpp-sum">' +
      '<span><b>' + nT + '</b>' + esc(L(nT === 1 ? ' فصلٌ مؤرشف' : ' فصولٌ مؤرشفة',
                                        nT === 1 ? ' archived term' : ' archived terms')) + '</span>' +
      '<span><b>' + cr + '</b>' + esc(L(' ساعة مكتسبة', cr === 1 ? ' credit earned' : ' credits earned')) + '</span>' +
      (gcr ? '<span><b>' + (pts / gcr).toFixed(2) + '</b>' + esc(L(' معدّلُ المؤرشف', ' archived GPA')) + '</span>' : '') +
      (noG ? '<span class="is-warn"><b>' + noG + '</b>' +
        esc(L(noG === 1 ? ' مادةٌ بلا تقدير' : ' مواد بلا تقدير',
              noG === 1 ? ' course ungraded' : ' ungraded')) + '</span>'
           : '<span class="is-done"><i class="fa-solid fa-circle-check"></i>' +
        esc(L(' كلُّ موادّك مقدَّرة', ' every course graded')) + '</span>') +
    '</div>';
  }

  function plHeadBar(p) {
    var rest = plRemaining(p);
    var restCr = rest.reduce(function (a, c) { return a + (R().fCh(c) || 3); }, 0);
    var planCr = p.semesters.reduce(function (a, s) { return a + plCr(s); }, 0);
    var nT = p.semesters.length;
    var h = '<div class="gpp-sum">' +
      '<span><b>' + nT + '</b>' + esc(L(' ' + arCount(nT, 'فصلٌ مخطّط', 'فصلان مخطّطان', 'فصولٍ مخطّطة', 'فصلاً مخطّطاً').replace(/^\d+\s/, ''),
                                        nT === 1 ? ' planned term' : ' planned terms')) + '</span>' +
      '<span><b>' + planCr + '</b>' + esc(L(' ساعة مجدولة', planCr === 1 ? ' credit scheduled' : ' credits scheduled')) + '</span>' +
      (rest.length
        ? '<span class="is-warn"><b>' + rest.length + '</b>' +
          esc(L(' مادة لم تُجدوَل (' + restCr + ' ساعة)',
                rest.length === 1 ? ' course unscheduled (' + restCr + ' cr)'
                                  : ' unscheduled (' + restCr + ' cr)')) + '</span>'
        : '<span class="is-done"><i class="fa-solid fa-circle-check"></i>' +
          esc(L(' لا مادةَ خارج الجدول', ' nothing left unscheduled')) + '</span>') +
    '</div>';
    if (RULES_STATE === 'loading') {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-cloud-arrow-down"></i><div>' +
        esc(L('نجلب قيودَ بانر (المتطلبات السابقة وقيود المستوى)… التنبيهات تظهر حين تصل.',
              'Fetching Banner rules (prerequisites and level limits)… warnings appear once they land.')) +
        '</div></div>';
    } else if (RULES_STATE === 'fail') {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-circle-info"></i><div>' +
        esc(L('لم تصل قيودُ بانر، فنحكم بالمتطلبات المكتوبة في خطتك وحدَها — وقيودُ المستوى لا تُفحص.',
              'Banner rules did not arrive, so we judge by your plan’s prerequisites alone — level limits are unchecked.')) +
        '</div></div>';
    }
    return h;
  }

  function plGeneralPending(p) {
    if (!R()) return 0;
    var n = plRemaining(p).filter(plGeneral).length;
    p.semesters.forEach(function (s) {
      if (s.summer) return;
      (s.courses || []).forEach(function (c) {
        if (c.code && plGeneral(plCourse(c.code))) n++;
      });
    });
    return n;
  }

  function plRow(p, s, si, c, ci) {
    var iss = plIssues(p, si, c);
    var free = !c.code;
    var label = c.code || c.name || '';
    var h = '<div class="gpp-row' + (iss.length ? ' is-bad' : '') + '" data-uid="' + esc(c.uid) + '">' +
      '<i class="fa-solid fa-grip-vertical gpp-grip" aria-hidden="true"></i>' +
      '<span class="gpp-row-m">' +
        (free ? '' : '<span class="gs-card-code">' + esc(c.code) + '</span>') +
        (free
          ? '<input class="gs-inp gpp-row-in" data-gs="pl-cname" data-v="' + esc(s.id) + ':' + ci + '"' +
            ' value="' + esc(c.name || '') + '" placeholder="' + esc(L('اسم المادة', 'Course name')) +
            '" aria-label="' + esc(L('اسم المادة', 'Course name')) + '">'
          : '<span class="gpp-row-n">' + esc(plRowName(c)) + '</span>') +
        (free ? '' : '<small class="gpp-row-chm">' + (+c.credits || 0) + esc(L(' ساعة', ' cr')) + '</small>') +
      '</span>' +
      (free
        ? '<input class="gs-inp gpp-row-cr" type="number" min="1" max="12" data-gs="pl-ccr" data-v="' +
          esc(s.id) + ':' + ci + '" value="' + (+c.credits || 3) + '" aria-label="' +
          esc(L('ساعات المادة', 'Course credits')) + '">'
        : '<span class="gpp-row-ch">' + (+c.credits || 0) + esc(L(' ساعة', ' cr')) + '</span>') +
      gradeBtn('pl:' + s.id + ':' + ci, c.grade || '', label) +
      '<span class="gpp-row-a">' +
        '<button type="button" class="gp-btn gp-btn--sm gpp-mv" data-gs="pl-move-open" data-v="' + esc(c.uid) + '"' +
          ' aria-label="' + esc(L('انقل ' + label + ' إلى فصلٍ آخر', 'Move ' + label + ' to another term')) + '">' +
          '<i class="fa-solid fa-arrows-up-down-left-right" aria-hidden="true"></i><span>' + esc(L('انقل', 'Move')) + '</span></button>' +
        '<button type="button" class="gp-btn gp-btn--sm gpp-rm" data-gs="pl-rm" data-v="' + esc(c.uid) + '"' +
          ' aria-label="' + esc(onArch() ? L('أزل ' + label + ' من سجلّك', 'Remove ' + label + ' from your record')
                                          : L('أعِد ' + label + ' إلى المتبقّي', 'Return ' + label + ' to the pool')) + '">' +
          '<span>' + esc(L('أزل', 'Remove')) + '</span></button>' +
        '<button type="button" class="gp-ico gpp-more" data-gs="pl-menu" data-v="' + esc(c.uid) + '"' +
          ' aria-label="' + esc(L('خيارات ' + label, 'Options for ' + label)) + '"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
      '</span>';
    if (iss.length) {
      h += '<div class="gpp-flags">' + iss.map(function (v) {
        return '<span class="gpp-flag" data-k="' + v.k + '"><i class="fa-solid ' +
          (v.k === 'level' ? 'fa-stairs' : 'fa-diagram-project') + '"></i>' + esc(plIssueText(v)) + '</span>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  function plTermPanel(p, s, si) {
    var cr = plCr(s), cap = plCap(s), over = cr > cap;
    var thin = !s.summer && cr > 0 && cr < 11;
    var bad = 0;
    (s.courses || []).forEach(function (c) { if (plIssues(p, si, c).length) bad++; });
    var name = plTermName(s, si), n = (s.courses || []).length;
    var pct = cap ? Math.min(100, Math.round(cr / cap * 100)) : 0;

    var h = '<div class="gpp-term' + (s.summer ? ' is-summer' : '') + '" data-pt="' + esc(s.id) + '">' +
      '<div class="gpp-th">' +
        '<i class="fa-solid ' + (s.summer ? 'fa-sun' : 'fa-layer-group') + ' gpp-sun" aria-hidden="true"></i>' +
        '<input class="gs-inp gpp-tname" data-gs="pl-name" data-v="' + esc(s.id) + '"' +
          ' value="' + esc(name) + '" placeholder="' + esc(L('اسم الفصل', 'Term name')) +
          '" aria-label="' + esc(L('اسم الفصل', 'Term name')) + '">' +
        '<span class="gs-chips gpp-kind">' +
          '<button type="button" class="gp-chip' + (!s.summer ? ' is-on' : '') + '" data-gs="pl-kind" data-v="' + esc(s.id) + ':r">' +
            esc(L('عاديّ', 'Regular')) + '</button>' +
          '<button type="button" class="gp-chip' + (s.summer ? ' is-on' : '') + '" data-gs="pl-kind" data-v="' + esc(s.id) + ':s">' +
            esc(L('صيفيّ', 'Summer')) + '</button>' +
        '</span>' +
        (s.summer && onArch()
          ? '<label class="gpp-lv">' + esc(L('بعد المستوى', 'After level')) +
            '<input class="gs-inp" type="number" min="0" max="' + MAX_LEVEL + '" data-gs="pl-after" data-v="' + esc(s.id) + '"' +
              ' value="' + (s.after == null ? '' : esc(s.after)) + '" placeholder="—"></label>'
          : '<label class="gpp-lv">' + esc(L('المستوى', 'Level')) +
            '<input class="gs-inp" type="number" min="1" max="' + MAX_LEVEL + '" data-gs="pl-lv" data-v="' + esc(s.id) + '"' +
              ' value="' + (s.level == null ? '' : esc(s.level)) + '" placeholder="—"></label>') +
        '<span class="gpp-cap' + (over ? ' is-over' : '') + '">' +
          (onArch()
            ? '<span class="gp-num">' + cr + '</span>' + esc(L(' ساعة', ' cr')) +
              (plTermGpa(s) === null ? '' : ' · <span class="gp-num">' + plTermGpa(s).toFixed(2) + '</span>')
            : '<span class="gpp-bar" aria-hidden="true"><i style="inline-size:' + pct + '%"></i></span>' +
              '<span class="gp-num">' + cr + '/' + cap + '</span>') +
        '</span>' +
        (onArch() && plUngraded(s)
          ? '<span class="gpp-badge" title="' + esc(L('بلا تقدير', 'ungraded')) + '">' +
            '<i class="fa-solid fa-circle-question"></i><span class="gp-num">' + plUngraded(s) + '</span></span>' : '') +
        (bad ? '<span class="gpp-badge" title="' + esc(L('تنبيهات', 'warnings')) + '">' +
            '<i class="fa-solid fa-triangle-exclamation"></i><span class="gp-num">' + bad + '</span></span>' : '') +
      '</div>';

    if (over && !onArch()) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-triangle-exclamation"></i><div>' +
        esc(L('تجاوزتَ سقفَ الفصل: ' + cr + ' ساعةً والسقفُ ' + cap + '. لك أن تُبقيه إن كنتَ تعرف حالتك.',
              'Over the term cap: ' + cr + ' credits against ' + cap + '. Keep it if you know your case.')) + '</div></div>';
    }
    if (thin && !onArch()) {
      h += '<div class="gs-warn is-soft"><i class="fa-solid fa-circle-info"></i><div>' +
        esc(L('دون الحدِّ الأدنى للفصل النظاميّ: ' + cr + ' ساعةً والحدُّ ١١.',
              'Below the regular-term minimum: ' + cr + ' credits against 11.')) + '</div></div>';
    }

    h += '<div class="gpp-rows">' +
      (s.courses || []).map(function (c, ci) { return plRow(p, s, si, c, ci); }).join('') + '</div>';
    if (!n) {
      h += '<p class="gs-hint gpp-empty">' + esc(onArch()
        ? L('فصلٌ فارغ — أضِف إليه ما درستَه فيه.', 'Empty term — add what you studied in it.')
        : L('فصلٌ فارغ — أضِف إليه من المتبقّي، أو اسحب إليه بطاقةً من فصلٍ آخر.',
            'Empty term — add from what remains, or drag a card here from another term.')) + '</p>';
    }

    h += '<div class="gpp-term-f">' +
      '<button type="button" class="gpp-cta" data-gs="pl-pick-open" data-v="' + esc(s.id) + '">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>' + esc(L('أضِف موادَّ إلى هذا الفصل', 'Add courses to this term')) + '</span>' +
        (onArch() ? '' : '<small>' + esc(L('— مستواك أوّلاً، ثمّ الباقي', '— your level first, then the rest')) + '</small>') +
      '</button>' +
      '<div class="gpp-term-a">' +
        (onArch() ? '' :
          '<button type="button" class="gp-btn gp-btn--sm" data-gs="pl-fill" data-v="' + esc(s.id) + '">' +
          '<i class="fa-solid fa-wand-magic-sparkles"></i><span>' + esc(L('املأه ممّا تبقّى', 'Fill from remaining')) + '</span></button>') +
        '<span class="gs-foot-sp"></span>' +
        '<button type="button" class="gp-btn gp-btn--sm" data-gs="pl-clear" data-v="' + esc(s.id) + '"' + (n ? '' : ' disabled') + '>' +
          '<i class="fa-solid fa-broom"></i><span>' + esc(L('فرّغ الفصل', 'Empty the term')) + '</span></button>' +
        '<button type="button" class="gp-btn gp-btn--sm gp-btn--danger" data-gs="pl-del" data-v="' + esc(s.id) + '">' +
          '<i class="fa-solid fa-trash-can"></i><span>' + esc(L('احذف الفصل', 'Delete the term')) + '</span></button>' +
      '</div>' +
    '</div>';

    if (PGUARD === s.id) {
      h += '<div class="gpp-guard" role="alert">' +
        '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<span>' + esc(onArch()
          ? L('تحذف «' + name + '» بـ' + plCW(n) + ' ودرجاتِها — و«تراجع» يبقى متاحاً بعد الحذف.',
              'This deletes “' + name + '” with ' + plCW(n) + ' and their grades — Undo stays available afterwards.')
          : L('تحذف «' + name + '» وتعود ' + plCW(n) + ' إلى المتبقّي — و«تراجع» يبقى متاحاً بعد الحذف.',
              'This deletes “' + name + '” and returns ' + plCW(n) + ' to the pool — Undo stays available afterwards.')) + '</span>' +
        '<button type="button" class="gp-btn gp-btn--sm" data-gs="pl-guard-off">' + esc(L('أبقِه', 'Keep it')) + '</button>' +
        '<button type="button" class="gp-btn gp-btn--sm gp-btn--danger" data-gs="pl-del-yes" data-v="' + esc(s.id) + '">' +
          '<i class="fa-solid fa-trash-can"></i><span>' + esc(L('احذف', 'Delete')) + '</span></button>' +
      '</div>';
    }
    return h + '</div>';
  }

  function plReady(code) {
    if (!R()) return null;
    var m = {};
    Object.keys(PC.passed).forEach(function (k) { m[k] = 1; });
    PC.cur.forEach(function (k) { m[k] = 1; });
    var miss = R().prereqMissing(PC.slug, code, m);
    return miss.length ? miss : null;
  }

  function normPl(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ').trim();
  }

  /*@3.GPSJ.176*/
  function plPickItems(p) {
    if (onArch()) {
      return arPool(p).map(function (c) {
        return { c: c.c, n: (isAr() ? (c.ta || c.t) : (c.t || c.ta)) || c.c, h: +c.h || 3,
                 l: (c.l === '' ? null : +c.l), miss: null };
      });
    }
    if (!R()) return [];
    return plRemaining(p).map(function (c) {
      var code = R().fCode(c);
      return { c: code, n: plTitle(c) || code, h: R().fCh(c) || 3, l: R().planLevel(c),
               miss: plReady(code), gen: plGeneral(c) };
    });
  }

  function plPickGroups(p, s) {
    var all = plPickItems(p), q = normPl(PQ);
    if (q) {
      return [{ t: L('نتائج البحث', 'Search results'),
                items: all.filter(function (x) { return normPl(x.c + ' ' + x.n).indexOf(q) > -1; }) }];
    }
    var lv = (s.level == null || s.level === '') ? null : +s.level;
    var g1 = [], g2 = [], g3 = [];
    all.forEach(function (x) {
      if (s.summer && !onArch() ? x.gen : (lv !== null && x.l === lv)) g1.push(x);
      else if (x.miss) g3.push(x);
      else g2.push(x);
    });
    var out = [];
    if (g1.length) {
      out.push({ t: s.summer && !onArch() ? L('موادُّ عامّةٌ تناسب الصيفيّ', 'General courses that suit a summer term')
                                            : L('من مستواك', 'From your level'),
                 n: g1.length, sub: (s.summer || onArch()) ? '' : L('الخطّة تضعها في ' + levelName(lv), 'The plan puts them in ' + levelName(lv)),
                 items: g1 });
    }
    if (g2.length) {
      out.push({ t: onArch() ? L('من مستوياتٍ أخرى', 'From other levels')
                             : L('تستطيع تقديمَها', 'You can take these'),
                 n: g2.length, sub: onArch() ? '' : L('متطلّبها متحقّق', 'prerequisites met'), items: g2 });
    }
    if (g3.length) out.push({ t: L('ليست بعد', 'Not yet'), n: g3.length, sub: '', items: g3, dim: true });
    return out;
  }

  function plPickList(p, s) {
    var groups = plPickGroups(p, s), shown = 0, total = 0;
    var h = groups.map(function (g) {
      if (!g.items.length) return '';
      var items = g.items.slice(0, Math.max(0, 240 - shown));
      shown += items.length; total += g.items.length;
      return '<div class="gpp-grp"><span>' + esc(g.t) + '</span>' +
        (g.n ? '<b class="gp-num">' + g.n + '</b>' : '') +
        (g.sub ? '<em>— ' + esc(g.sub) + '</em>' : '') + '</div>' +
        '<div class="gpp-pick' + (g.dim ? ' is-dim' : '') + '">' + items.map(function (x) {
          var on = !!PSEL[x.c];
          return '<button type="button" class="gpp-pk' + (on ? ' is-on' : '') + '" data-gs="pl-sel" data-v="' + esc(x.c) + '"' +
            ' role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '">' +
            '<span class="gpp-pk-box" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' +
            '<span class="gpp-row-m"><span class="gs-card-code">' + esc(x.c) + '</span><span class="gpp-row-n">' + esc(x.n) + '</span></span>' +
            '<span class="gpp-row-ch">' + x.h + esc(L(' ساعة', ' cr')) + '</span>' +
            (x.l === null || x.l === undefined ? '' : '<em class="gpp-pk-lv">' + esc(levelName(x.l)) + '</em>') +
            (x.miss ? '<span class="gpp-flag" data-k="wait"><i class="fa-solid fa-hourglass-half"></i>' +
                      esc(L('بعد ' + plGroupWord(x.miss), 'After ' + plGroupWord(x.miss))) + '</span>' : '') +
          '</button>';
        }).join('') + '</div>';
    }).join('');
    if (!total) {
      h += '<p class="gs-hint">' + esc(PQ
        ? L('لا نتيجة — وإن كانت مادّةً لا نعرفها فأضِفها بزرِّ «مادة خارج الخطة».',
            'Nothing matches — if we do not know the course, add it with “Course outside the plan”.')
        : (onArch() ? L('لا مادّةَ متاحةً للإضافة.', 'Nothing available to add.')
                    : L('كلُّ ما تبقّى من خطتك مجدولٌ في فصولك.', 'Everything your plan still owes you is scheduled.'))) + '</p>';
    } else if (total > shown) {
      h += '<p class="gs-hint">' + esc(L('نعرض ' + shown + ' من ' + total + ' — ضيّقْ بحثَك.',
                                         'Showing ' + shown + ' of ' + total + ' — narrow your search.')) + '</p>';
    }
    return h;
  }

  function plPickFoot(p, s) {
    var sel = Object.keys(PSEL), items = plPickItems(p), hrs = 0;
    items.forEach(function (x) { if (PSEL[x.c]) hrs += x.h; });
    var n = sel.length;
    return '<button type="button" class="gp-btn gp-btn--primary" data-gs="pl-pick-add" data-v="' + esc(s.id) + '"' + (n ? '' : ' disabled') + '>' +
      '<i class="fa-solid fa-check"></i><span>' + esc(n
        ? L('أضِف ' + (n === 1 ? 'مادّةً واحدة' : (n === 2 ? 'مادّتين' : plCW(n))) + ' (' + hrs + ' ساعة)', 'Add ' + plCW(n) + ' (' + hrs + ' cr)')
        : L('حدّد ما تريد إضافته', 'Pick what to add')) + '</span></button>' +
      '<button type="button" class="gp-btn" data-gs="pl-free" data-v="' + esc(s.id) + '">' +
        '<i class="fa-solid fa-plus"></i><span>' + esc(L('مادة خارج الخطة', 'Course outside the plan')) + '</span></button>' +
      '<span class="gs-foot-sp"></span>' +
      '<button type="button" class="gp-btn" data-gs="pl-sheet-x">' + esc(L('إلغاء', 'Cancel')) + '</button>';
  }

  function plMoveNote(p, at, s, si) {
    if (onArch()) return '';
    var q = JSON.parse(JSON.stringify(p));
    var moved = q.semesters[at.si].courses.splice(at.ci, 1)[0];
    var ti = plIndex(q, s.id);
    q.semesters[ti].courses.push(moved);
    var iss = plIssues(q, ti, moved);
    if (iss.length) return '<em class="gpp-mv-note is-warn">' + esc(plIssueText(iss[0])) + '</em>';
    var lv = R() && at.c.code ? R().planLevel(plCourse(at.c.code)) : null;
    if (lv !== null && lv !== undefined && !s.summer && String(s.level) === String(lv)) {
      return '<em class="gpp-mv-note is-ok">' + esc(L('مستواها في الخطّة', 'its plan level')) + '</em>';
    }
    return '';
  }

  function plSheetHtml(p) {
    if (!PSHEET) return '';
    var k = PSHEET.k, cur = plActive(p), s = cur ? p.semesters[plIndex(p, cur)] : null;
    var title = '', body = '', foot = '', extra = '', cls = '';

    if (k === 'new') {
      title = L('فصلٌ جديد', 'New term');
      var nl = plNextLevel(p), ll = plLastLevel(p);
      body = '<div class="gpp-opts">' +
        '<button type="button" class="gpp-opt" data-gs="pl-new" data-v="r"><i class="fa-solid fa-layer-group"></i><span><b>' +
          esc(L('فصل عاديّ', 'Regular term')) + '</b><small>' + esc(levelName(nl)) + '</small></span></button>' +
        '<button type="button" class="gpp-opt" data-gs="pl-new" data-v="s"><i class="fa-solid fa-sun"></i><span><b>' +
          esc(L('فصل صيفيّ', 'Summer term')) + '</b><small>' + esc(onArch()
            ? L('بعد ' + levelName(ll), 'after ' + levelName(ll))
            : L('ليس مستوًى — يجلس بين مستويين ولا يرفع رقمَك', 'not a level — sits between two and never raises your number')) +
          '</small></span></button>' +
      '</div>';
      cls = ' gpp-sheet--sm';
    } else if (k === 'pick' && s) {
      var selH = 0; plPickItems(p).forEach(function (x) { if (PSEL[x.c]) selH += x.h; });
      title = L('أضِف إلى ' + plTermName(s, plIndex(p, s.id)), 'Add to ' + plTermName(s, plIndex(p, s.id)));
      extra = onArch() ? '' : '<span class="gpp-sh-cap"><span class="gp-num">' + plCr(s) + '/' + plCap(s) + '</span>' +
        (selH ? ' → <span class="gp-num">' + (plCr(s) + selH) + '/' + plCap(s) + '</span>' : '') + '</span>';
      body = '<div class="gpp-pick-q"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input class="gs-inp" id="gpp-pq" value="' + esc(PQ) + '" placeholder="' +
          esc(L('ابحث برمزٍ أو اسم', 'Search by code or name')) + '" aria-label="' + esc(L('بحث', 'Search')) + '"></div>' +
        '<div id="gpp-pick-list">' + plPickList(p, s) + '</div>';
      foot = plPickFoot(p, s);
    } else if (k === 'move' || k === 'menu') {
      var at = plFind(p, PSHEET.uid);
      if (!at) return '';
      var lbl = at.c.code || at.c.name || '';
      title = (k === 'menu' ? '' : L('انقل ', 'Move ')) + lbl + (at.c.code ? ' · ' + plRowName(at.c) : '');
      if (k === 'menu') {
        body = '<div class="gpp-opts">' +
          '<button type="button" class="gpp-opt" data-gs="pl-move-open" data-v="' + esc(at.c.uid) + '"><i class="fa-solid fa-arrows-up-down-left-right"></i><span><b>' +
            esc(L('انقل إلى فصلٍ آخر…', 'Move to another term…')) + '</b></span></button>' +
          '<button type="button" class="gpp-opt is-danger" data-gs="pl-rm" data-v="' + esc(at.c.uid) + '"><i class="fa-solid fa-xmark"></i><span><b>' +
            esc(onArch() ? L('أزل من سجلّك', 'Remove from your record') : L('أعِد إلى المتبقّي', 'Return to the pool')) + '</b></span></button>' +
        '</div>';
        cls = ' gpp-sheet--sm';
      } else {
        body = '<div class="gpp-opts">' + p.semesters.map(function (t, i) {
          var here = i === at.si;
          return '<button type="button" class="gpp-opt' + (here ? ' is-here' : '') + (t.summer ? ' is-summer' : '') +
            '" data-gs="pl-move-to" data-v="' + esc(at.c.uid) + ':' + esc(t.id) + '"' + (here ? ' disabled' : '') + '>' +
            '<i class="fa-solid ' + (t.summer ? 'fa-sun' : 'fa-layer-group') + '"></i>' +
            '<span><b>' + esc(plTermName(t, i)) + '</b>' +
              (here ? '<small>' + esc(L('الحاليّ', 'current')) + '</small>' : plMoveNote(p, at, t, i)) + '</span>' +
            '<small class="gp-num">' + plCr(t) + (onArch() ? '' : '/' + plCap(t)) + '</small></button>';
        }).join('') +
          '<button type="button" class="gpp-opt is-new" data-gs="pl-move-new" data-v="' + esc(at.c.uid) + ':r"><i class="fa-solid fa-plus"></i><span><b>' +
            esc(L('فصلٌ عاديٌّ جديد', 'A new regular term')) + '</b><small>' + esc(levelName(plNextLevel(p))) + '</small></span></button>' +
          '<button type="button" class="gpp-opt is-new" data-gs="pl-move-new" data-v="' + esc(at.c.uid) + ':s"><i class="fa-solid fa-sun"></i><span><b>' +
            esc(L('فصلٌ صيفيٌّ جديد', 'A new summer term')) + '</b></span></button>' +
          '<button type="button" class="gpp-opt is-danger" data-gs="pl-rm" data-v="' + esc(at.c.uid) + '"><i class="fa-solid fa-xmark"></i><span><b>' +
            esc(onArch() ? L('أزلها من سجلّك', 'Remove it from your record') : L('أعِدها إلى المتبقّي', 'Return it to the pool')) + '</b></span></button>' +
        '</div>';
      }
    } else if (k === 'order') {
      title = L('رتّب الفصول', 'Reorder terms');
      body = '<div class="gpp-opts gpp-order">' + p.semesters.map(function (t, i) {
        return '<div class="gpp-opt is-row' + (t.summer ? ' is-summer' : '') + '">' +
          '<b class="gp-num gpp-ord-n">' + (i + 1) + '</b>' +
          '<i class="fa-solid ' + (t.summer ? 'fa-sun' : 'fa-layer-group') + '"></i>' +
          '<span><b>' + esc(plTermName(t, i)) + '</b><small class="gp-num">' + plCr(t) + (onArch() ? '' : '/' + plCap(t)) +
            esc(L(' ساعة', ' cr')) + '</small></span>' +
          '<span class="gpp-ord-a">' +
            '<button type="button" class="gp-ico" data-gs="pl-up" data-v="' + esc(t.id) + '"' + (i === 0 ? ' disabled' : '') +
              ' aria-label="' + esc(L('قدّم ' + plTermName(t, i), 'Move ' + plTermName(t, i) + ' earlier')) + '"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button type="button" class="gp-ico" data-gs="pl-down" data-v="' + esc(t.id) + '"' + (i === p.semesters.length - 1 ? ' disabled' : '') +
              ' aria-label="' + esc(L('أخّر ' + plTermName(t, i), 'Move ' + plTermName(t, i) + ' later')) + '"><i class="fa-solid fa-arrow-down"></i></button>' +
          '</span></div>';
      }).join('') + '</div>';
      foot = (onArch()
        ? '<button type="button" class="gp-btn" data-gs="pl-auto-open" data-v="chrono"><i class="fa-solid fa-arrow-down-1-9"></i><span>' +
          esc(L('رتّب زمنيّاً (معاينة)', 'Sort chronologically (preview)')) + '</span></button>' : '') +
        '<span class="gs-foot-sp"></span>' +
        '<button type="button" class="gp-btn gp-btn--primary" data-gs="pl-sheet-x">' + esc(L('تمّ', 'Done')) + '</button>';
    } else if (k === 'auto' && PAUTO) {
      title = onArch() ? L('ترتيبٌ زمنيّ', 'Chronological order') : L('اقتراحُ ترتيبٍ لما تبقّى', 'A suggested arrangement');
      var on = PAUTO.changes.filter(function (c) { return c.on; }).length;
      body = '<p class="gs-lead">' + esc(onArch()
        ? L('لا يتغيّر شيءٌ حتى تضغط «طبّق». العاديُّ برقمه، والصيفيُّ بعد المستوى المكتوب فيه.',
            'Nothing changes until you press Apply. Regular terms by level; each summer term after the level set on it.')
        : L('لا يتغيّر شيءٌ حتى تضغط «طبّق». ألغِ التحديدَ عن أيِّ سطرٍ لا تريده — والباقي يُطبَّق كما هو.',
            'Nothing changes until you press Apply. Untick any line you do not want — the rest applies as shown.')) + '</p>';
      if (!onArch()) {
        body += '<div class="gs-chips gpp-auto-m">' + [
          ['byplan', 'fa-list-check', L('حسب مستوى الخطة', 'By plan level')],
          ['fill', 'fa-wand-magic-sparkles', L('املأ حتى السقف', 'Fill to the cap')],
          ['summer', 'fa-sun', L('العامّةُ في الصيفيّ', 'General into summer')]
        ].map(function (m) {
          return '<button type="button" class="gp-chip' + (PAUTO.mode === m[0] ? ' is-on' : '') + '" data-gs="pl-auto-open" data-v="' + m[0] + '">' +
            '<i class="fa-solid ' + m[1] + '"></i> ' + esc(m[2]) + '</button>';
        }).join('') + '</div>';
      }
      if (PAUTO.mode === 'chrono') {
        body += '<div class="gpp-opts gpp-order">' + PAUTO.order.map(function (id, i) {
          var t = p.semesters[plIndex(p, id)], was = plIndex(p, id);
          return '<div class="gpp-opt is-row' + (t.summer ? ' is-summer' : '') + '"><b class="gp-num gpp-ord-n">' + (i + 1) + '</b>' +
            '<i class="fa-solid ' + (t.summer ? 'fa-sun' : 'fa-layer-group') + '"></i>' +
            '<span><b>' + esc(plTermName(t, was)) + '</b>' +
            (was !== i ? '<small>' + esc(L('كان في الموضع ' + (was + 1), 'was at position ' + (was + 1))) + '</small>' : '') +
            '</span></div>';
        }).join('') + '</div>';
        foot = '<button type="button" class="gp-btn gp-btn--primary" data-gs="pl-auto-apply"' + (PAUTO.moved ? '' : ' disabled') + '>' +
          '<i class="fa-solid fa-check"></i><span>' + esc(PAUTO.moved ? L('طبّق الترتيب', 'Apply this order') : L('مرتّبٌ سلفاً', 'Already in order')) + '</span></button>';
      } else {
        if (!PAUTO.changes.length) {
          body += '<div class="gs-warn is-soft"><i class="fa-solid fa-circle-info"></i><div>' + esc(PAUTO.empty ||
            L('لا شيءَ يقترحه هذا الخيار الآن.', 'This option has nothing to suggest right now.')) + '</div></div>';
        } else {
          body += '<div class="gpp-diffs"><div class="gpp-grp"><span>' + esc(L(PAUTO.changes.length + ' تغييراً مقترحاً', PAUTO.changes.length + ' suggested changes')) + '</span></div>' +
            PAUTO.changes.map(function (c, i) {
              return '<button type="button" class="gpp-diff' + (c.on ? ' is-on' : '') + '" data-gs="pl-auto-tog" data-v="' + i + '" role="checkbox" aria-checked="' + (c.on ? 'true' : 'false') + '">' +
                '<span class="gpp-pk-box" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' +
                '<span class="gpp-diff-m"><span><span class="gs-card-code">' + esc(c.code) + '</span> ' + esc(c.name) + '</span>' +
                  (c.note ? '<span class="gpp-flag" data-k="' + c.noteK + '"><i class="fa-solid ' + (c.noteK === 'level' ? 'fa-stairs' : 'fa-diagram-project') + '"></i>' + esc(c.note) + '</span>' : '') + '</span>' +
                '<span class="gpp-diff-w"><em>' + esc(c.fromName) + '</em><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><b>' + esc(c.toName) + '</b></span>' +
              '</button>';
            }).join('') + '</div>';
          body += '<p class="gs-hint">' + esc(L('بعد التطبيق: ', 'After applying: ') + PAUTO.after.join(' · ') +
            L(' — و«تراجع» يعيدها دفعةً واحدة.', ' — and Undo reverts them all at once.')) + '</p>';
        }
        foot = '<button type="button" class="gp-btn gp-btn--primary" data-gs="pl-auto-apply"' + (on ? '' : ' disabled') + '>' +
          '<i class="fa-solid fa-check"></i><span>' + esc(on ? L('طبّق ' + on + (on === 1 ? ' تغييراً' : (on === 2 ? ' تغييرين' : (on <= 10 ? ' تغييرات' : ' تغييراً'))), 'Apply ' + on + (on === 1 ? ' change' : ' changes'))
                                                                 : L('لا شيءَ محدَّد', 'Nothing selected')) + '</span></button>';
      }
      foot += '<span class="gs-foot-sp"></span><button type="button" class="gp-btn" data-gs="pl-sheet-x">' + esc(L('ألغِ', 'Cancel')) + '</button>';
    } else return '';

    return '<div class="gpp-sheet-ov" data-gs="pl-sheet-x">' +
      '<div class="gpp-sheet' + cls + '" role="dialog" aria-modal="true" aria-labelledby="gpp-sheet-t">' +
        '<div class="gpp-sheet-h"><h4 id="gpp-sheet-t">' + esc(title) + '</h4>' + extra +
          '<button type="button" class="gp-ico" data-gs="pl-sheet-x" aria-label="' + esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></div>' +
        '<div class="gpp-sheet-b">' + body + '</div>' +
        (foot ? '<div class="gpp-sheet-f">' + foot + '</div>' : '') +
      '</div></div>';
  }

  /*@3.GPSJ.177*/
  function plAutoCompute(p, mode) {
    var q = JSON.parse(JSON.stringify(p));
    var before = {}, names = {};
    p.semesters.forEach(function (t, i) {
      names[t.id] = plTermName(t, i);
      (t.courses || []).forEach(function (c) { before[c.uid] = t.id; });
    });
    var out = { mode: mode, changes: [], newTerms: [], order: [], moved: false, after: [], empty: '' };
    if (mode === 'chrono') {
      arSortLevel(q);
      out.order = q.semesters.map(function (t) { return t.id; });
      out.moved = out.order.join('|') !== p.semesters.map(function (t) { return t.id; }).join('|');
      return out;
    }
    if (mode === 'byplan') plByPlan(q);
    else if (mode === 'summer') plGeneralToSummer(q);
    else plAutoPlan(q);
    q.semesters.forEach(function (t, i) {
      if (plIndex(p, t.id) < 0) {
        var meta = JSON.parse(JSON.stringify(t)); meta.courses = [];
        out.newTerms.push(meta);
        names[t.id] = plTermName(t, i);
      }
      (t.courses || []).forEach(function (c) {
        var from = before[c.uid];
        if (from === t.id) return;
        var iss = plIssues(q, i, c);
        out.changes.push({
          uid: from ? c.uid : null, code: c.code || '', name: plRowName(c),
          fromId: from || null, fromName: from ? names[from] : L('المتبقّي', 'the pool'),
          toId: t.id, toName: names[t.id], on: true,
          note: iss.length ? plIssueText(iss[0]) : '', noteK: iss.length ? iss[0].k : ''
        });
      });
    });
    out.after = q.semesters.map(function (t, i) {
      return plTermName(t, i) + ' ' + plCr(t) + '/' + plCap(t);
    });
    if (!out.changes.length) {
      out.empty = mode === 'summer'
        ? L('لا مادّةَ عامّةً تنتظر.', 'No general course is pending.')
        : L('لا شيءَ متبقٍّ ليُوزَّع.', 'Nothing left to place.');
    }
    return out;
  }

  function plAutoApply(p) {
    if (!PAUTO) return 0;
    if (PAUTO.mode === 'chrono') {
      if (!PAUTO.moved) return 0;
      arSortLevel(p); return 1;
    }
    var n = 0;
    PAUTO.changes.forEach(function (c) {
      if (!c.on) return;
      if (plIndex(p, c.toId) < 0) {
        var meta = PAUTO.newTerms.filter(function (t) { return t.id === c.toId; })[0];
        if (!meta) return;
        p.semesters.push(JSON.parse(JSON.stringify(meta)));
      }
      if (c.uid) {
        var at = plFind(p, c.uid);
        if (!at) return;
        var moved = p.semesters[at.si].courses.splice(at.ci, 1)[0];
        p.semesters[plIndex(p, c.toId)].courses.push(moved); n++;
      } else if (plAdd(p, c.code, c.toId)) n++;
    });
    if (PAUTO.mode === 'byplan') plOrder(p);
    return n;
  }

  function plPaint() {
    var p = plRead();
    var body = $('#gs-body');
    if (!body) return;
    var ttl = $('#gs-title');
    if (ttl) {
      ttl.textContent = onArch() ? L('معالج الفصول المؤرشفة', 'Archived terms')
                                 : L('معالج الفصول المخطّطة', 'Planned terms');
    }
    var done = $('[data-gs="close"] span');
    if (done) done.textContent = L('تمّ', 'Done');
    var rev = $('#gs-overlay [data-gs="pl-revert"]');
    if (rev) {
      var dirty = plDirty();
      rev.style.display = dirty ? '' : 'none';
      var rs = rev.querySelector('span');
      if (rs) rs.textContent = L('ألغِ تغييراتي', 'Discard my changes');
    }
    var ub = $('#gs-overlay .gs-foot [data-gs="pl-undo"]');
    if (ub) { ub.disabled = !PUNDO.length; var us = ub.querySelector('span'); if (us) us.textContent = L('تراجع', 'Undo'); }
    var ab = $('#gs-overlay .gs-foot [data-gs="pl-auto-open"]');
    if (ab) {
      var rest = onArch() ? 0 : plRemaining(p).length;
      ab.style.display = onArch() ? 'none' : '';
      ab.disabled = !rest;
      var as = ab.querySelector('span'); if (as) as.textContent = L('اقترح ترتيباً', 'Suggest an arrangement');
    }

    var strip = $('#gpp-strip');
    if (strip) {
      strip.innerHTML = plStrip(p);
      strip.hidden = false;
      var now = strip.querySelector('.gpp-tab.is-now');
      if (now && now.scrollIntoView) { try { now.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
    }

    var cur = plActive(p), si = cur ? plIndex(p, cur) : -1;
    var h = '<p class="gs-lead">' + esc(onArch()
      ? L('هذه فصولُك التي مضت — فصلٌ واحدٌ أمامك، والباقي في الشريط أعلاه. وما تكتبه هنا هو سجلُّك في صفحة المعدّل.',
          'These are the terms you have finished — one term at a time, the rest in the strip above. What you write here is your record on the GPA page.')
      : L('هذه فصولُك القادمة — فصلٌ واحدٌ أمامك، والباقي في الشريط أعلاه. ونقول لك متى خالفتَ متطلّباً أو قيدَ مستوًى، ولا نمنعك.',
          'These are your terms to come — one term at a time, the rest in the strip above. We flag a broken prerequisite or level limit, and never block you.')) + '</p>' +
      (onArch() ? arHeadBar(p) : plHeadBar(p));
    if (si >= 0) h += plTermPanel(p, p.semesters[si], si);
    else {
      h += '<div class="gpp-none"><i class="fa-solid fa-layer-group" aria-hidden="true"></i><p>' +
        esc(onArch() ? L('لا فصلَ مؤرشفاً بعد.', 'No archived term yet.')
                     : L('لا فصلَ مخطّطاً بعد.', 'No planned term yet.')) + '</p>' +
        '<div class="gs-chips">' +
          '<button type="button" class="gp-btn" data-gs="pl-new" data-v="r"><i class="fa-solid fa-plus"></i><span>' + esc(L('فصل عاديّ', 'Regular term')) + '</span></button>' +
          '<button type="button" class="gp-btn" data-gs="pl-new" data-v="s"><i class="fa-solid fa-sun"></i><span>' + esc(L('فصل صيفيّ', 'Summer term')) + '</span></button>' +
          (onArch() || !plRemaining(p).length ? '' :
            '<button type="button" class="gp-btn" data-gs="pl-auto-open" data-v="fill"><i class="fa-solid fa-wand-magic-sparkles"></i><span>' +
            esc(L('اقترح فصولاً لما تبقّى', 'Suggest terms for what remains')) + '</span></button>') +
        '</div></div>';
    }
    var sheet = $('#gs-overlay .gpp-sheet-ov');
    var focusQ = sheet && document.activeElement && document.activeElement.id === 'gpp-pq';
    body.innerHTML = h;
    if (sheet) sheet.remove();
    if (PSHEET) {
      var ov = $('#gs-overlay');
      var sh = plSheetHtml(p);
      if (sh && ov) {
        ov.insertAdjacentHTML('beforeend', sh);
        if (focusQ) { var q2 = $('#gpp-pq'); if (q2) { q2.focus(); q2.selectionStart = q2.selectionEnd = q2.value.length; } }
      } else PSHEET = null;
    }
  }

  /*@3.GPSJ.178*/
  function plPaintPickList() {
    var p = plRead(), cur = plActive(p);
    if (!cur) return;
    var s = p.semesters[plIndex(p, cur)];
    var list = $('#gpp-pick-list'); if (list) list.innerHTML = plPickList(p, s);
    var f = $('#gs-overlay .gpp-sheet-f'); if (f) f.innerHTML = plPickFoot(p, s);
    var cap = $('#gs-overlay .gpp-sh-cap');
    if (cap && !onArch()) {
      var selH = 0; plPickItems(p).forEach(function (x) { if (PSEL[x.c]) selH += x.h; });
      cap.innerHTML = '<span class="gp-num">' + plCr(s) + '/' + plCap(s) + '</span>' +
        (selH ? ' → <span class="gp-num">' + (plCr(s) + selH) + '/' + plCap(s) + '</span>' : '');
    }
  }

  function plIndex(p, id) {
    for (var i = 0; i < p.semesters.length; i++) if (p.semesters[i].id === id) return i;
    return -1;
  }
  function plFind(p, uid) {
    for (var i = 0; i < p.semesters.length; i++) {
      var cs = p.semesters[i].courses || [];
      for (var j = 0; j < cs.length; j++) if (cs[j].uid === uid) return { si: i, ci: j, c: cs[j] };
    }
    return null;
  }

  function plAdd(p, code, termId) {
    var i = plIndex(p, termId);
    if (i < 0) return false;
    if (onArch()) {
      var e = null;
      arPool(p).forEach(function (x) { if (x.c === code) e = x; });
      var row = { uid: plUid(), code: code, grade: null, credits: (e && +e.h) || 3 };
      if (!knownCode(code)) {
        row.name_ar = (e && (e.ta || e.t)) || code;
        row.name_en = (e && (e.t || e.ta)) || code;
        row.custom = true;
      }
      p.semesters[i].courses.push(row);
      return true;
    }
    var c = plCourse(code);
    p.semesters[i].courses.push({
      uid: plUid(), code: code, name: plTitle(c) || code,
      credits: (c ? R().fCh(c) : 0) || 3, grade: 'B+'
    });
    return true;
  }
  function knownCode(code) {
    if (R() && PC.slug && R().courseBy(PC.slug, code)) return true;
    try { return !!(window.GardenData && GardenData.courseInfo && GardenData.courseInfo(code)); }
    catch (e) { return false; }
  }

  function plDrop(p, token, dest) {
    if (!token) return false;
    if (token.from === 'pool') {
      if (dest === 'pool') return false;
      return plAdd(p, token.code, dest);
    }
    var at = plFind(p, token.uid);
    if (!at) return false;
    if (dest !== 'pool' && p.semesters[at.si].id === dest) return false;
    var moved = p.semesters[at.si].courses.splice(at.ci, 1)[0];
    if (dest === 'pool') return true;
    var i = plIndex(p, dest);
    if (i < 0) { p.semesters[at.si].courses.splice(at.ci, 0, moved); return false; }
    p.semesters[i].courses.push(moved);
    return true;
  }

  function plNewTerm(p, summer, level) {
    var lv = (level != null) ? level : (summer ? plLastLevel(p) : plNextLevel(p));
    var id = 'pt' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    if (onArch()) {
      var nm = summer ? L('فصل صيفيّ', 'Summer term') : levelName(lv);
      var t2 = {
        id: 'arc' + id, level: summer ? null : lv, summer: !!summer,
        after: summer ? lv : undefined,
        term: summer ? 'summer' : 'regular',
        name: nm, name_ar: summer ? 'فصل صيفيّ' : levelNameIn(lv, 'ar'),
        name_en: summer ? 'Summer term' : levelNameIn(lv, 'en'),
        courses: [], archived_at: new Date().toISOString()
      };
      if (t2.after === undefined) delete t2.after;
      p.semesters.push(t2);
      return t2;
    }
    var t = { id: id, level: lv, summer: !!summer, courses: [] };
    p.semesters.push(t);
    return t;
  }
  function arSortLevel(p) {
    /*@3.GPSJ.180*/
    var list = p.semesters.slice();
    list.sort(function (x, y) { return String(x.archived_at || '').localeCompare(String(y.archived_at || '')); });
    function fixed(s) {
      if (s.summer) {
        var af = (s.after == null || s.after === '') ? null : +s.after;
        return (af == null || isNaN(af)) ? null : af + 0.5;
      }
      var lv = (s.level == null || s.level === '') ? null : +s.level;
      return (lv == null || isNaN(lv)) ? null : lv;
    }
    var rank = {}, i, r;
    for (i = 0; i < list.length; i++) rank[list[i].id] = fixed(list[i]);
    for (r = null, i = 0; i < list.length; i++) {
      if (rank[list[i].id] != null) { r = rank[list[i].id]; continue; }
      if (r != null) rank[list[i].id] = r + 0.5;
    }
    for (r = null, i = list.length - 1; i >= 0; i--) {
      if (rank[list[i].id] != null) { r = rank[list[i].id]; continue; }
      if (r != null) rank[list[i].id] = r - 0.5;
    }
    p.semesters.forEach(function (s, k) { s._i = k; });
    p.semesters.sort(function (x, y) {
      var rx = rank[x.id] == null ? 99 : rank[x.id], ry = rank[y.id] == null ? 99 : rank[y.id];
      return rx - ry || x._i - y._i;
    });
    p.semesters.forEach(function (s) { delete s._i; });
  }

  function plTermFor(p, level, summer) {
    for (var i = 0; i < p.semesters.length; i++) {
      var s = p.semesters[i];
      if (!!s.summer === !!summer && String(s.level) === String(level)) return s;
    }
    return plNewTerm(p, summer, level);
  }
  function plOrder(p) {
    p.semesters.sort(function (a, b) {
      var la = (a.level == null) ? 99 : +a.level, lb = (b.level == null) ? 99 : +b.level;
      if (la !== lb) return la - lb;
      return (a.summer ? 1 : 0) - (b.summer ? 1 : 0);
    });
  }

  function plUndo() {
    if (!PUNDO.length) return false;
    plRestore(PUNDO.pop());
    PGUARD = null;
    plPaint();
    plToast(L('رجعت خطوةً.', 'Stepped back.'));
    return true;
  }

  function plClick(e) {
    var b = e.target.closest && e.target.closest('[data-gs]');
    if (!b) return false;
    var a = b.getAttribute('data-gs'), v = b.getAttribute('data-v') || '';
    if (a.indexOf('pl-') !== 0 && a !== 'close' && a !== 'grade') return false;

    if (a === 'close') { plClose(); return true; }
    if (a === 'grade') { openGrade(b, v); return true; }
    if (a === 'pl-sheet-x') {
      /*@3.GPSJ.179*/
      if (b.classList.contains('gpp-sheet-ov') && e.target !== b) return true;
      plCloseSheet(); plPaint(); return true;
    }

    var p = plRead(), ix, si, n, at, t, name;
    if (PL_MUT[a]) plMark(p);
    if (a === 'pl-undo') { plUndo(); return true; }
    if (a === 'pl-revert') {
      if (!plDirty()) { plToast(L('لا تغييرَ لإلغائه.', 'Nothing to discard.')); return true; }
      plRestore(PSNAP); PUNDO = []; PGUARD = null; plCloseSheet();
      plPaint();
      plToast(onArch()
        ? L('رجع سجلُّك كما كان حين فتحتَ المعالج.', 'Your record is back to how it was when you opened this.')
        : L('رجعت خطّتُك كما كانت حين فتحتَ المعالج.', 'Your plan is back to how it was when you opened this.'));
      return true;
    }
    if (a === 'pl-go') { plGo(v); plPaint(); return true; }
    if (a === 'pl-newmenu') { plOpenSheet('new'); plPaint(); return true; }
    if (a === 'pl-order') { plOpenSheet('order'); plPaint(); return true; }
    if (a === 'pl-new') {
      t = plNewTerm(p, v === 's'); plWrite(p); plGo(t.id); plCloseSheet(); plPaint();
      return true;
    }
    if (a === 'pl-del') {
      ix = plIndex(p, v); if (ix < 0) return true;
      n = (p.semesters[ix].courses || []).length;
      if (n) { PUNDO.pop(); PGUARD = v; plPaint(); return true; }
      name = plTermName(p.semesters[ix], ix);
      p.semesters.splice(ix, 1); plWrite(p);
      plGo(p.semesters.length ? p.semesters[Math.max(0, ix - 1)].id : null); plPaint();
      plToast(L('حُذف «' + name + '» (كان فارغاً).', 'Deleted “' + name + '” (it was empty).'), true);
      return true;
    }
    if (a === 'pl-guard-off') { PGUARD = null; plPaint(); return true; }
    if (a === 'pl-del-yes') {
      ix = plIndex(p, v); if (ix < 0) return true;
      n = (p.semesters[ix].courses || []).length; name = plTermName(p.semesters[ix], ix);
      PGUARD = null;
      p.semesters.splice(ix, 1); plWrite(p);
      plGo(p.semesters.length ? p.semesters[Math.max(0, ix - 1)].id : null); plPaint();
      plToast(onArch()
        ? L('حُذف «' + name + '» و' + plCW(n) + ' معه.', 'Deleted “' + name + '” with ' + plCW(n) + '.')
        : L('حُذف «' + name + '» ورجعت ' + plCW(n) + ' إلى المتبقّي.', 'Deleted “' + name + '” — ' + plCW(n) + ' returned to the pool.'), true);
      return true;
    }
    if (a === 'pl-up' || a === 'pl-down') {
      ix = plIndex(p, v); if (ix < 0) return true;
      var to = ix + (a === 'pl-up' ? -1 : 1);
      if (to < 0 || to >= p.semesters.length) { PUNDO.pop(); return true; }
      p.semesters.splice(to, 0, p.semesters.splice(ix, 1)[0]);
      plWrite(p); plPaint(); return true;
    }
    if (a === 'pl-kind') {
      var pr = v.split(':'); ix = plIndex(p, pr[0]); if (ix < 0) return true;
      p.semesters[ix].summer = (pr[1] === 's');
      plWrite(p); plPaint(); return true;
    }
    if (a === 'pl-rm') {
      at = plFind(p, v); if (!at) { PUNDO.pop(); return true; }
      var lbl = at.c.code || at.c.name || '';
      name = plTermName(p.semesters[at.si], at.si);
      p.semesters[at.si].courses.splice(at.ci, 1);
      plCloseSheet(); plWrite(p); plPaint();
      plToast(onArch()
        ? L('أُزيلت ' + lbl + ' من «' + name + '».', 'Removed ' + lbl + ' from “' + name + '”.')
        : L('أُعيدت ' + lbl + ' إلى المتبقّي.', lbl + ' returned to the pool.'), true);
      return true;
    }
    if (a === 'pl-menu') { plOpenSheet('menu', { uid: v }); plPaint(); return true; }
    if (a === 'pl-move-open') { plOpenSheet('move', { uid: v }); plPaint(); return true; }
    if (a === 'pl-move-to' || a === 'pl-move-new') {
      var mv = v.split(':'); at = plFind(p, mv[0]);
      if (!at) { PUNDO.pop(); plCloseSheet(); plPaint(); return true; }
      var dest = (a === 'pl-move-new') ? plNewTerm(p, mv[1] === 's').id : mv[1];
      if (!plDrop(p, { from: 'term', uid: mv[0] }, dest)) { PUNDO.pop(); plCloseSheet(); plPaint(); return true; }
      ix = plIndex(p, dest);
      plCloseSheet(); plWrite(p); plPaint();
      plToast(L('نُقلت ' + (at.c.code || at.c.name || '') + ' إلى «' + plTermName(p.semesters[ix], ix) + '».',
                'Moved ' + (at.c.code || at.c.name || '') + ' to “' + plTermName(p.semesters[ix], ix) + '”.'), true);
      return true;
    }
    if (a === 'pl-pick-open') { plGo(v); plOpenSheet('pick'); plPaint(); return true; }
    if (a === 'pl-sel') {
      if (PSEL[v]) delete PSEL[v]; else PSEL[v] = 1;
      plPaintPickList(); return true;
    }
    if (a === 'pl-pick-add') {
      ix = plIndex(p, v);
      var codes = Object.keys(PSEL);
      if (ix < 0 || !codes.length) { PUNDO.pop(); return true; }
      n = 0; codes.forEach(function (c) { if (plAdd(p, c, v)) n++; });
      name = plTermName(p.semesters[ix], ix);
      plCloseSheet(); plWrite(p); plPaint();
      plToast(L('أُضيفت ' + plCW(n) + ' إلى «' + name + '».', plCW(n) + ' added to “' + name + '”.'), true);
      return true;
    }
    if (a === 'pl-free') {
      ix = plIndex(p, v); if (ix < 0) { PUNDO.pop(); return true; }
      var fn = L('مادة خارج الخطة', 'Course outside the plan');
      var row = { uid: plUid(), code: '', name: fn, credits: 3, grade: onArch() ? null : 'B+' };
      if (onArch()) { row.custom = true; row.name_ar = fn; row.name_en = fn; }
      p.semesters[ix].courses.push(row);
      plCloseSheet(); plWrite(p); plPaint();
      var fin = $('#gs-body .gpp-row:last-child .gpp-row-in'); if (fin) { fin.focus(); fin.select(); }
      return true;
    }
    if (a === 'pl-fill') {
      ix = plIndex(p, v); if (ix < 0) return true;
      n = plFillTerm(p, p.semesters[ix]);
      if (!n) { PUNDO.pop(); plToast(L('لا مادةَ تناسب هذا الفصل ضمن سقفه.', 'Nothing from the remainder fits this term.')); return true; }
      plWrite(p); plPaint();
      plToast(L('أُضيفت ' + plCW(n) + ' حتى سقف الفصل.', plCW(n) + ' added up to the cap.'), true);
      return true;
    }
    if (a === 'pl-clear') {
      ix = plIndex(p, v); if (ix < 0) return true;
      n = (p.semesters[ix].courses || []).length;
      if (!n) { PUNDO.pop(); return true; }
      p.semesters[ix].courses = [];
      plWrite(p); plPaint();
      plToast(onArch()
        ? L('أُزيلت ' + plCW(n) + ' من هذا الفصل.', plCW(n) + ' removed from this term.')
        : L('رجعت ' + plCW(n) + ' إلى المتبقّي.', plCW(n) + ' returned to the pool.'), true);
      return true;
    }
    if (a === 'pl-auto-open') {
      var mode = v || (onArch() ? 'chrono' : 'byplan');
      PAUTO = plAutoCompute(p, mode);
      PSHEET = { k: 'auto' }; plPaint(); return true;
    }
    if (a === 'pl-auto-tog') {
      if (PAUTO && PAUTO.changes[+v]) PAUTO.changes[+v].on = !PAUTO.changes[+v].on;
      plPaint(); return true;
    }
    if (a === 'pl-auto-apply') {
      n = plAutoApply(p);
      if (!n) { PUNDO.pop(); plCloseSheet(); plPaint(); return true; }
      var chrono = PAUTO && PAUTO.mode === 'chrono';
      plCloseSheet(); plWrite(p); plPaint();
      plToast(chrono ? L('رُتّبت فصولُك زمنيّاً.', 'Terms sorted chronologically.')
                     : L('طُبّق ' + n + (n === 1 ? ' تغييرٌ' : (n === 2 ? ' تغييران' : (n <= 10 ? ' تغييرات' : ' تغييراً'))) + '.',
                         'Applied ' + n + (n === 1 ? ' change.' : ' changes.')), true);
      return true;
    }
    return false;
  }

  function plCW(n) {
    return L(arCount(n, 'مادّةٌ واحدة', 'مادّتان', 'مواد', 'مادّةً'),
             n === 1 ? '1 course' : n + ' courses');
  }

  /*@3.GPSJ.148*/
  var PL_MUT = { 'pl-new': 1, 'pl-del': 1, 'pl-del-yes': 1, 'pl-up': 1, 'pl-down': 1, 'pl-kind': 1,
                 'pl-rm': 1, 'pl-move-to': 1, 'pl-move-new': 1, 'pl-pick-add': 1, 'pl-fill': 1,
                 'pl-clear': 1, 'pl-free': 1, 'pl-auto-apply': 1 };

  function plToken(p, v) {
    if (String(v).indexOf('pool:') === 0) {
      var code = String(v).slice(5);
      return { key: 'p:' + code, from: 'pool', code: code, label: code };
    }
    var at = plFind(p, v);
    if (!at) return null;
    return { key: 'c:' + v, from: 'term', uid: v, label: at.c.code || at.c.name || '' };
  }

  /*@3.GPSJ.137*/
  function plFillTerm(p, s) {
    var cap = plCap(s), have = plCr(s), n = 0;
    plRemaining(p).forEach(function (c) {
      var h = R().fCh(c) || 3;
      if (have + h > cap) return;
      var lv = R().planLevel(c);
      if (lv !== null && s.level != null && lv > s.level) return;
      plAdd(p, R().fCode(c), s.id); have += h; n++;
    });
    return n;
  }

  function plAutoPlan(p) {
    var rest = plRemaining(p);
    if (!rest.length) return 0;
    var placed = 0, guard = 0;
    while (plRemaining(p).length && guard++ < 24) {
      var moved = 0;
      for (var i = 0; i < p.semesters.length; i++) moved += plFillTerm(p, p.semesters[i]);
      placed += moved;
      if (!plRemaining(p).length) break;
      if (!moved) {
        var lvl = plNextLevel(p);
        plNewTerm(p, false, lvl);
        if (plNextLevel(p) - 1 >= MAX_LEVEL && !moved && guard > 12) break;
      }
    }
    return placed;
  }

  /*@3.GPSJ.138*/
  function plByPlan(p) {
    var rest = plRemaining(p), n = 0;
    if (!rest.length) return 0;
    rest.forEach(function (c) {
      var lv = R().planLevel(c);
      if (lv === null) lv = plNextLevel(p);
      var t = plTermFor(p, lv, false);
      plAdd(p, R().fCode(c), t.id); n++;
    });
    plOrder(p);
    return n;
  }

  function plGeneralToSummer(p) {
    /*@3.GPSJ.141*/
    var pool = plRemaining(p).filter(plGeneral).map(function (c) {
      return { uid: plUid(), code: R().fCode(c), name: plTitle(c) || R().fCode(c),
               credits: R().fCh(c) || 3, grade: 'B+' };
    });
    var pull = [];
    p.semesters.forEach(function (s) {
      if (s.summer) return;
      s.courses = (s.courses || []).filter(function (c) {
        if (!c.code || !plGeneral(plCourse(c.code))) return true;
        pull.push(c); return false;
      });
    });
    var all = pull.concat(pool);
    if (!all.length) return 0;
    var n = 0, t = null;
    all.forEach(function (c) {
      var h = +c.credits || 3;
      if (!t || plCr(t) + h > CAP_SUM) {
        t = null;
        for (var i = 0; i < p.semesters.length; i++) {
          if (p.semesters[i].summer && plCr(p.semesters[i]) + h <= CAP_SUM) { t = p.semesters[i]; break; }
        }
        if (!t) t = plNewTerm(p, true, plLastLevel(p));
      }
      t.courses.push(c); n++;
    });
    return n;
  }

  function plInput(e) {
    var s = e.target, a = s.getAttribute && s.getAttribute('data-gs');
    if (s.id === 'gpp-pq') { PQ = s.value || ''; plPaintPickList(); return true; }
    if (a === 'pl-cname' || a === 'pl-ccr') {
      var pr = String(s.getAttribute('data-v')).split(':');
      var pc = plRead(), pi = plIndex(pc, pr[0]);
      if (pi < 0) return true;
      var cc = pc.semesters[pi].courses[+pr[1]];
      if (!cc) return true;
      if (a === 'pl-cname') {
        cc.name = s.value;
        /*@3.GPSJ.174*/
        if (onArch()) { cc.name_ar = s.value; cc.name_en = s.value; }
      } else cc.credits = Math.max(1, Math.min(12, parseInt(s.value, 10) || 3));
      plWrite(pc);
      clearTimeout(plInput._t);
      plInput._t = setTimeout(plPaint, 500);
      return true;
    }
    if (a !== 'pl-name' && a !== 'pl-lv' && a !== 'pl-after') return false;
    var p = plRead(), ix = plIndex(p, s.getAttribute('data-v'));
    if (ix < 0) return true;
    if (a === 'pl-name') {
      p.semesters[ix].name = s.value;
      p.semesters[ix].renamed = !!s.value;
      /*@3.GPSJ.158*/
      if (onArch()) { p.semesters[ix].name_ar = s.value; p.semesters[ix].name_en = s.value; }
      plWrite(p);
      return true;
    }
    if (a === 'pl-after') {
      var an = parseInt(s.value, 10);
      p.semesters[ix].after = (isNaN(an) || an < 0) ? null : Math.min(an, MAX_LEVEL);
      plWrite(p);
      clearTimeout(plInput._t);
      plInput._t = setTimeout(plPaint, 400);
      return true;
    }
    var nn = parseInt(s.value, 10);
    p.semesters[ix].level = (isNaN(nn) || nn < 1) ? null : Math.min(nn, MAX_LEVEL);
    plWrite(p);
    clearTimeout(plInput._t);
    plInput._t = setTimeout(plPaint, 400);
    return true;
  }

  function plGradeOf(key) {
    var pr = String(key).split(':');
    var p = plRead(), ix = plIndex(p, pr[1]);
    if (ix < 0) return '';
    var c = p.semesters[ix].courses[+pr[2]];
    return (c && c.grade) || '';
  }
  function plGradeSet(key, g) {
    var pr = String(key).split(':');
    var p = plRead(), ix = plIndex(p, pr[1]);
    if (ix < 0) return;
    var c = p.semesters[ix].courses[+pr[2]];
    if (!c) return;
    c.grade = g;
    plWrite(p); plPaint();
  }

  function plPointerCancelQuiet() {
    if (!PDRAG) return;
    if (PDRAG.ghost && PDRAG.ghost.parentNode) PDRAG.ghost.parentNode.removeChild(PDRAG.ghost);
    PDRAG = null; PMOVE = null;
  }

  function plToast(msg, undo) {
    var t = $('#gs-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'gs-toast'; t.className = 'gpp-toast';
      t.setAttribute('role', 'status');
      t.addEventListener('click', function (e) {
        if (!e.target.closest('.gpp-toast-b')) return;
        t.classList.remove('is-on'); clearTimeout(t._h);
        plUndo();
      });
      document.body.appendChild(t);
    }
    t.innerHTML = '<span></span>' + (undo && PUNDO.length
      ? '<button type="button" class="gpp-toast-b">' + esc(L('تراجع', 'Undo')) + '</button>' : '');
    t.firstChild.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('is-on'); }, undo ? 5200 : 2400);
  }

  /*@3.GPSJ.139*/
  var PDRAG = null;

  function plCardAt(t) {
    return t && t.closest ? t.closest('.gpp-row[data-uid], .gs-card[data-uid], .gs-card[data-code]') : null;
  }
  function plZoneAt(x, y) {
    var el = document.elementFromPoint(x, y);
    return (el && el.closest) ? el.closest('[data-pdrop]') : null;
  }
  function plLit(z) {
    $$('#gs-overlay [data-pdrop].is-drop').forEach(function (n) {
      if (n !== z) n.classList.remove('is-drop');
    });
    if (z) z.classList.add('is-drop');
  }

  /*@3.GPSJ.150*/
  function plPointerDown(e) {
    if (MODE !== 'planner' || PDRAG) return;
    if (e.button != null && e.button > 0) return;
    var card = plCardAt(e.target);
    if (!card || !card.closest('#gs-overlay')) return;
    if (e.target.closest('button, input, select, textarea, a, .gs-gr-btn')) return;
    var grip = !!e.target.closest('.gpp-grip');
    /*@3.GPSJ.151*/
    if (e.pointerType && e.pointerType !== 'mouse' && !grip) return;
    var p = plRead();
    var v = card.hasAttribute('data-uid') ? card.getAttribute('data-uid')
                                          : 'pool:' + card.getAttribute('data-code');
    var tok = plToken(p, v);
    if (!tok) return;
    PDRAG = { tok: tok, card: card, x0: e.clientX, y0: e.clientY, on: false, id: e.pointerId, ghost: null };
    try { card.setPointerCapture(e.pointerId); } catch (_) {}
  }

  function plPointerMove(e) {
    if (!PDRAG || (PDRAG.id != null && e.pointerId !== PDRAG.id)) return;
    var dx = e.clientX - PDRAG.x0, dy = e.clientY - PDRAG.y0;
    if (!PDRAG.on) {
      if (dx * dx + dy * dy < 64) return;      /*@3.GPSJ.152*/
      PDRAG.on = true;
      PMOVE = PDRAG.tok;
      var r = PDRAG.card.getBoundingClientRect();
      var g = PDRAG.card.cloneNode(true);
      g.className += ' gpp-ghost';
      g.style.inlineSize = r.width + 'px';
      g.style.insetBlockStart = r.top + 'px';
      g.style.insetInlineStart = '0';
      g.style.left = r.left + 'px';
      document.body.appendChild(g);
      PDRAG.ghost = g;
      PDRAG.gx = e.clientX - r.left; PDRAG.gy = e.clientY - r.top;
      PDRAG.card.classList.add('is-moving');
      $$('#gs-overlay [data-pdrop]').forEach(function (n) { n.classList.add('is-target'); });
    }
    e.preventDefault();
    if (PDRAG.ghost) {
      PDRAG.ghost.style.left = (e.clientX - PDRAG.gx) + 'px';
      PDRAG.ghost.style.top = (e.clientY - PDRAG.gy) + 'px';
    }
    plLit(plZoneAt(e.clientX, e.clientY));
  }

  function plPointerUp(e) {
    if (!PDRAG || (PDRAG.id != null && e.pointerId !== PDRAG.id)) return;
    var d = PDRAG; PDRAG = null;
    if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    if (!d.on) { PMOVE = null; return; }
    var z = plZoneAt(e.clientX, e.clientY);
    PMOVE = null;
    if (!z) { plPaint(); return; }
    var p = plRead(), was = JSON.stringify(p);
    if (plDrop(p, d.tok, z.getAttribute('data-pdrop'))) { plMark(JSON.parse(was)); plWrite(p); }
    plPaint();
  }

  function plPointerCancel() {
    if (!PDRAG) return;
    if (PDRAG.ghost && PDRAG.ghost.parentNode) PDRAG.ghost.parentNode.removeChild(PDRAG.ghost);
    PDRAG = null; PMOVE = null;
    plPaint();
  }

  function plClose() {
    plPointerCancelQuiet();
    closeGrade();
    var ov = $('#gs-overlay'); if (ov) ov.remove();
    var t = $('#gs-toast'); if (t) t.remove();
    PMOVE = null; PUNDO = []; PSNAP = null;
    PT = null; PSHEET = null; PSEL = {}; PGUARD = null; PAUTO = null;
    MODE = 'setup'; BOARD = 'plan';
  }

  /*@3.GPSJ.172*/
  function openArchive() {
    if ($('#gs-overlay')) return;
    BOARD = 'arch';
    openPlanner();
  }

  function openPlanner() {
    if ($('#gs-overlay')) { BOARD = 'plan'; return; }
    MODE = 'planner';
    PC = plCtx(); PQ = ''; PMOVE = null; PUNDO = [];
    PT = null; PSHEET = null; PSEL = {}; PGUARD = null; PAUTO = null;
    /*@3.GPSJ.149*/
    plRead();
    try { PSNAP = localStorage.getItem(plKey()); } catch (e) { PSNAP = null; }
    mount();
    var box = $('#gs-overlay .gs-box'); if (box) box.classList.add('gpp-box');
    var st = $('#gs-steps'); if (st) st.hidden = true;
    var bodyEl = $('#gs-body');
    if (bodyEl && !$('#gpp-strip')) {
      var strip = document.createElement('div');
      strip.id = 'gpp-strip'; strip.className = 'gpp-strip'; strip.setAttribute('role', 'tablist');
      bodyEl.parentNode.insertBefore(strip, bodyEl);
    }
    var foot = $('#gs-overlay .gs-foot');
    if (foot) {
      foot.innerHTML =
        '<button class="gp-btn gp-btn--primary" data-gs="close"><i class="fa-solid fa-check"></i><span>' + esc(L('تمّ', 'Done')) + '</span></button>' +
        '<button class="gp-btn" data-gs="pl-undo" disabled><i class="fa-solid fa-rotate-left"></i><span>' + esc(L('تراجع', 'Undo')) + '</span></button>' +
        '<button class="gp-btn" data-gs="pl-revert" style="display:none"><i class="fa-solid fa-arrow-rotate-left"></i><span>' + esc(L('ألغِ تغييراتي', 'Discard my changes')) + '</span></button>' +
        '<span class="gs-foot-sp"></span>' +
        '<button class="gp-btn" data-gs="pl-auto-open"><i class="fa-solid fa-wand-magic-sparkles"></i><span>' + esc(L('اقترح ترتيباً', 'Suggest an arrangement')) + '</span></button>';
    }
    if (!R()) { plPaint(); return; }
    R().loadPlans(function () {
      R().dropIndex(); PC = plCtx();
      plPaint();
      RULES_STATE = 'loading'; plPaint();
      R().loadRules(function (ru) {
        RULES_STATE = (ru && ru.kn) ? 'ok' : 'fail';
        if (MODE === 'planner' && $('#gs-overlay')) plPaint();
      });
    });
  }

  /*@3.GPSJ.106*/
  window.GardenSetup = { open: open, close: close, openPlanner: openPlanner, openArchive: openArchive };
  /*@3.GPSJ.107*/
  window.Onboarding = window.Onboarding || {};
  window.Onboarding.open = function () {
    if (/hub\/gpa\.html/.test(location.pathname)) open();
    else location.href = (/\/hub\//.test(location.pathname) ? 'gpa.html' : 'hub/gpa.html') + '#setup';
  };

  /*@3.GPSJ.154*/
  document.addEventListener('pointermove', plPointerMove, { passive: false });
  document.addEventListener('pointerup', plPointerUp);
  document.addEventListener('pointercancel', plPointerCancel);

  document.addEventListener('garden:languageChanged', function () {
    if (!$('#gs-overlay')) return;
    if (MODE === 'planner') { PC = plCtx(); plPaint(); }
    else if (W) paint();
  });

  /*@3.GPSJ.108*/
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('#gs-gpop')) { closeGrade(); return; }
    if (MODE === 'planner') {
      if (PSHEET) { plCloseSheet(); plPaint(); return; }
      if ($('#gs-overlay')) plClose(); return;
    }
    if ($('#gs-move')) { closeMove(); if (W) paint(); return; }
    if ($('#gs-overlay')) close(true);
  });

  window.addEventListener('hashchange', function () {
    if (/#setup/.test(location.hash) && !document.getElementById('gs-overlay')) open();
  });
  if (/#setup/.test(location.hash) && /hub\/gpa\.html/.test(location.pathname)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { open(); });
    else open();
  }
})();
