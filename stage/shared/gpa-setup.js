/*@3.GPSJ.1*/
(function () {
  'use strict';

  var PROF = 'student_profile', ARCH = 'semester_archive',
      SEM = 'my_semester', PLANK = 'gpa_plan', DRAFT = 'gpa_setup_draft';
  /*@3.GPSJ.2*/
  var PL_KEY = 'sx_plans', PL_VER = 3, PL_TTL = 30 * 24 * 3600 * 1000;
  var GPA_SCALE = { 'A+': 4, 'A': 3.75, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 };
  var GRADES = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'TR'];
  var PREP_RE = /^[A-Za-z]+0/;
  var MAX_LEVEL = 12;                 /*@3.GPSJ.3*/
  var CAP_REG = 18, CAP_SUM = 9;
  var FULL_SUPPORT = 'bachelor-of-computer-science';

  var PLANS = null, W = null, MOVING = null;

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
  function levelNameIn(n, lang) {
    if (n === 'x' || n === null || isNaN(n)) return lang === 'ar' ? 'مواد خارج الخطة' : 'Outside the plan';
    if (n === 0) return lang === 'ar' ? 'السنة التحضيرية' : 'Preparatory year';
    return lang === 'ar' ? ('المستوى ' + (LV_AR[n] || n)) : ('Level ' + n);
  }
  function levelName(n) { return levelNameIn(n, isAr() ? 'ar' : 'en'); }

  /*@3.GPSJ.18*/
  var PRE = null;                       /*@3.GPSJ.19*/
  function prereqOf(code) {
    if (PRE && PRE[code]) return (PRE[code] || []).map(function (r) { return r.c; }).filter(Boolean);
    var c = courseBy(code);
    return c ? fPre(c) : [];
  }
  function prereqMet(code, passed) {
    var pre = prereqOf(code);
    if (!pre.length) return true;       /*@3.GPSJ.20*/
    return pre.every(function (x) { return !!passed[x]; });
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
             levels: {}, curLevel: '', term: guessTerm(), cur: [] };
  }
  function saveDraft() { writeJSON(DRAFT, W); }

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
    (readJSON(ARCH, []) || []).forEach(function (a) {
      (a.courses || []).forEach(function (c) {
        if (!c || !c.code) return;
        var lv = (a.level != null) ? a.level : null;
        if (lv === null) { var pc = courseBy(c.code); lv = pc ? planLevel(pc) : null; }
        if (lv === null) lv = 'x';
        (d.levels[lv] = d.levels[lv] || []).push({ code: c.code, grade: c.grade || '' });
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

  function open(step) {
    loadPlans(function () {
      var draft = readJSON(DRAFT, null);
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
    W = null;
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
    ov.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('.gs-card[draggable]');
      if (!card) return;
      MOVING = card.getAttribute('data-code');
      try { e.dataTransfer.setData('text/plain', MOVING); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
      card.classList.add('is-moving');
    });
    ov.addEventListener('dragover', function (e) {
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (!z || !MOVING) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
      z.classList.add('is-drop');
    });
    ov.addEventListener('dragleave', function (e) {
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (z) z.classList.remove('is-drop');
    });
    ov.addEventListener('drop', function (e) {
      var z = e.target.closest && e.target.closest('[data-drop]');
      if (!z || !MOVING) return;
      e.preventDefault();
      moveTo(MOVING, z.getAttribute('data-drop'));
      MOVING = null; saveDraft(); paint();
    });
    ov.addEventListener('dragend', function () { MOVING = null; paint(); });
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

  /*@3.GPSJ.45*/
  function levelFromYear(y) {
    y = parseInt(y, 10); if (!y) return null;
    var now = new Date(), m = now.getMonth();
    var acad = (m >= 7) ? now.getFullYear() : now.getFullYear() - 1;   /*@3.GPSJ.46*/
    var elapsed = acad - y;
    if (elapsed < 0) return null;
    if (elapsed === 0) return 0;                                        /*@3.GPSJ.47*/
    var lv = 3 + (elapsed - 1) * 2;
    if (m >= 0 && m <= 4) lv += 1;                                      /*@3.GPSJ.48*/
    return Math.max(0, Math.min(lv, MAX_LEVEL));
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
    var x = W.levels.x;
    if (!x || !x.length || !courses().length) return;
    var rest = [];
    x.forEach(function (e) {
      var c = courseBy(e.code), lv = c ? planLevel(c) : null;
      if (lv === null) { rest.push(e); return; }
      (W.levels[lv] = W.levels[lv] || []).push(e);
    });
    if (rest.length) W.levels.x = rest; else delete W.levels.x;
    saveDraft();
  }

  function levelsInUse() {
    var s = {};
    courses().forEach(function (c) { var lv = planLevel(c); if (lv !== null) s[lv] = true; });
    Object.keys(W.levels).forEach(function (k) { if (k !== 'x') s[k] = true; });
    var arr = Object.keys(s).map(Number).filter(function (n) { return !isNaN(n); });
    var maxPlan = Math.max.apply(null, arr.concat([0]));
    for (var i = 0; i <= Math.min(MAX_LEVEL, Math.max(maxPlan, 8)); i++) if (i !== 1 && i !== 2) s[i] = true;
    s[0] = true;
    var out = Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
    if ((W.levels.x || []).length) out.push('x');   /*@3.GPSJ.52*/
    return out;
  }
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
  function gradeBtn(code, val) {
    return '<button type="button" class="gs-gr-btn' + (val ? ' is-set' : '') +
      '" data-gs="grade" data-v="' + esc(code) + '" data-tone="' + gTone(val) + '"' +
      ' aria-haspopup="listbox" aria-label="' + esc(L('تقدير ' + code, 'Grade for ' + code)) + '">' +
      '<span>' + esc(val || '—') + '</span><i class="fa-solid fa-chevron-down"></i></button>';
  }
  function closeGrade() { var p = $('#gs-gpop'); if (p) p.remove(); }
  function openGrade(btn, code) {
    closeGrade();
    var en = entryOf(code), cur = (en && en.grade) || '';
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
      var lv = planLevel(c); if (lv === null) lv = 'x';
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

      h += '<div class="gs-lv' + (MOVING ? ' is-target' : '') + '" data-lv="' + lv + '" data-drop="' + lv + '">' +
        '<button type="button" class="gs-lv-h" data-gs="drop-here" data-v="' + lv + '">' +
          '<span class="gs-lv-n">' + esc(levelName(lv)) + '</span>' +
          (cr ? '<span class="gs-lv-cr">' + cr + esc(L(' ساعة', ' cr')) + '</span>' : '<span class="gs-lv-cr"></span>') +
          (lv === 0 ? '<span class="gs-lv-fix">' + esc(L('موادها ثابتة', 'fixed')) + '</span>' : '') +
          (MOVING ? '<span class="gs-drop-hint">' + esc(L('انقله هنا', 'drop here')) + '</span>' : '') +
        '</button><div class="gs-cards">';

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
            '<span class="gs-card-ch">' + (fCh(c) ? fCh(c) + esc(L(' ساعة', ' cr')) : '') + '</span>' +
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
        '<input class="gs-inp" id="gs-lv" type="number" min="1" max="' + MAX_LEVEL + '" value="' + esc(W.curLevel) + '" placeholder="6">' +
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

    var lang = progLang(), dirAttr = ' dir="' + (lang === 'ar' ? 'rtl' : 'ltr') + '"';
    h += '<div class="gs-elig">' + elig.map(function (c) {
      var cc = fCode(c), on = W.cur.indexOf(cc) > -1;
      /*@3.GPSJ.64*/
      return '<div class="gs-card gs-card--tap' + (on ? ' is-on' : '') + '"' +
          ' role="button" tabindex="0" aria-pressed="' + on + '" data-gs="cur" data-v="' + esc(cc) + '">' +
        '<div class="gs-card-main">' +
          '<span class="gs-tick-box"><i class="fa-solid fa-check"></i></span>' +
          '<span class="gs-card-code">' + esc(cc) + '</span>' +
          '<span class="gs-card-name"' + dirAttr + '>' + esc(cTitle(c)) + '</span>' +
        '</div>' +
        '<div class="gs-card-foot">' +
          '<span class="gs-card-ch">' + (fCh(c) ? fCh(c) + esc(L(' ساعة', ' cr')) : '') + '</span>' +
          '<em class="gs-card-from gs-card-lv">' + esc(levelName(planLevel(c))) + '</em>' +
        '</div></div>';
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
              '<em class="gs-card-from gs-card-lv">' + esc(L('يلزم ', 'needs ') + prereqOf(bc).join('، ')) + '</em>' +
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
    if (!W.levels[from].length) delete W.levels[from];
    (W.levels[lv] = W.levels[lv] || []).push(e);
  }

  /*@3.GPSJ.84*/
  function onClick(e) {
    /*@3.GPSJ.85*/
    if (e.target === e.currentTarget) { e.stopPropagation(); close(true); return; }
    if (!e.target.closest('[data-gs="grade"]')) closeGrade();
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
    if (a === 'drop-here') {
      if (MOVING) { moveTo(MOVING, v); claimRecord(); saveDraft(); MOVING = null; paint(); }
      return;
    }
    if (a === 'tick') {
      claimRecord();
      var lv = b.getAttribute('data-lv'), at = takenAt(v);
      if (at !== null) {
        W.levels[at] = W.levels[at].filter(function (x) { return x.code !== v; });
        if (!W.levels[at].length) delete W.levels[at];
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
    if (W.curLevel) { p.level = String(W.curLevel); p.levels = [String(W.curLevel)]; }
    /*@3.GPSJ.94*/
    var passed = passedMap();
    p.passed_extra = Object.keys(passed);
    writeJSON(PROF, p);

    /*@3.GPSJ.95*/
    var arch = (readJSON(ARCH, []) || []).filter(function (a) {
      return a && a.id && String(a.id).indexOf('gpa_L') !== 0 && a.id !== 'onb_prior';
    });
    Object.keys(W.levels).sort(function (a, b) { return (+a) - (+b); }).forEach(function (lv) {
      if (!W.levels[lv].length) return;
      arch.push({
        id: 'gpa_L' + lv, level: (lv === 'x' ? null : +lv), name: levelName(+lv),
        name_ar: levelNameIn(+lv, 'ar'), name_en: levelNameIn(+lv, 'en'),
        courses: W.levels[lv].map(function (x) {
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

  /*@3.GPSJ.106*/
  window.GardenSetup = { open: open, close: close };
  /*@3.GPSJ.107*/
  window.Onboarding = window.Onboarding || {};
  window.Onboarding.open = function () {
    if (/hub\/gpa\.html/.test(location.pathname)) open();
    else location.href = (/\/hub\//.test(location.pathname) ? 'gpa.html' : 'hub/gpa.html') + '#setup';
  };

  /*@3.GPSJ.108*/
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('#gs-gpop')) { closeGrade(); return; }
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
