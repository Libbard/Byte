/*@3.GADJ.1*/

;(function () {
  'use strict';

  /*@3.GADJ.2*/
  var thisScript = document.currentScript;
  var ROOT = (thisScript && thisScript.src)
    ? thisScript.src.replace(/shared\/garden-data\.js(\?.*)?$/, '')
    : '';

  var LS = {
    semester: 'my_semester',
    archive: 'semester_archive',
    grades: 'gpa_grades',
    schedule: 'weekly_schedule',
    tasks: 'my_tasks',
    gpaPlan: 'gpa_plan',
    notes: 'quick_notes',
    profile: 'student_profile',
    prefs: 'dashboard_prefs'
  };

  /*@3.GADJ.3*/
  var GPA_SCALE = {
    'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.00,
    'C+': 2.50, 'C': 2.00, 'D+': 1.50, 'D': 1.00, 'F': 0.00
  };
  var TR_GRADE = 'TR';

  var DAYS_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  /*@3.GADJ.4*/

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }

  function todayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function todayDayName(d) {
    return DAYS_ORDER[(d || new Date()).getDay()];
  }

  /*@3.GADJ.5*/

  var _catalog = null;      /*@3.GADJ.6*/
  var _catalogArr = [];
  var _readyPromise = null;

  function ready() {
    if (_readyPromise) return _readyPromise;
    _readyPromise = fetch(ROOT + 'shared/data/courses_catalog.json')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        _catalogArr = j.courses || [];
        _catalog = {};
        _catalogArr.forEach(function (c) { if (c && c.code) _catalog[c.code] = c; });
        return true;
      })
      .catch(function () {
        _catalog = {};       /*@3.GADJ.7*/
        _catalogArr = [];
        return false;
      });
    return _readyPromise;
  }

  function catalog() { return _catalog || {}; }
  function catalogList() { return _catalogArr.slice(); }
  function courseInfo(code) { return (_catalog || {})[code] || null; }

  /*@3.GADJ.8*/
  function moduleCount(code) {
    var info = courseInfo(code);
    return (info && typeof info.modules === 'number') ? info.modules : 13;
  }

  function isRealCourse(code) {
    return !!code &&
           String(code).indexOf('__CUSTOM_') !== 0 &&
           String(code).indexOf('__MANUAL_') !== 0;
  }

  /*@3.GADJ.9*/

  var COLOR_DEF = '#a78bfa';

  /*@3.GADJ.10*/
  var PALETTE = [
    { hex: '#a78bfa', ar: 'بنفسجي',   en: 'Violet' },
    { hex: '#8b5cf6', ar: 'أرجواني',  en: 'Purple' },
    { hex: '#4f46e5', ar: 'نيليّ',     en: 'Indigo' },
    { hex: '#3b82f6', ar: 'أزرق',     en: 'Blue' },
    { hex: '#0891b2', ar: 'أزرق داكن', en: 'Deep blue' },
    { hex: '#06b6d4', ar: 'سماويّ',    en: 'Cyan' },
    { hex: '#14b8a6', ar: 'فيروزيّ',   en: 'Teal' },
    { hex: '#10b981', ar: 'أخضر',     en: 'Green' },
    { hex: '#22c55e', ar: 'أخضر فاتح', en: 'Light green' },
    { hex: '#eab308', ar: 'ذهبيّ',     en: 'Gold' },
    { hex: '#f59e0b', ar: 'كهرمانيّ',  en: 'Amber' },
    { hex: '#f97316', ar: 'برتقاليّ',  en: 'Orange' },
    { hex: '#ef4444', ar: 'أحمر',     en: 'Red' },
    { hex: '#f43f5e', ar: 'ورديّ',     en: 'Rose' },
    { hex: '#e11d6a', ar: 'توتيّ',     en: 'Magenta' },
    { hex: '#64748b', ar: 'رماديّ',    en: 'Slate' }
  ];

  /*@3.GADJ.11*/
  var PALETTE_SKIN = [
    { hex: '#81a1c1', ar: 'فولاذيّ',     en: 'Steel' },
    { hex: '#7aa2f7', ar: 'سماويّ ناعم', en: 'Periwinkle' },
    { hex: '#56b6c2', ar: 'مَوْجيّ',      en: 'Wave' },
    { hex: '#2aa198', ar: 'فيروزٌ عميق', en: 'Deep teal' },
    { hex: '#859900', ar: 'زيتونيّ',     en: 'Olive' },
    { hex: '#fe8019', ar: 'نار',         en: 'Ember' },
    { hex: '#cb4b16', ar: 'نحاسيّ',      en: 'Copper' },
    { hex: '#d3869b', ar: 'وردٌ ترابيّ', en: 'Dusty rose' },
    { hex: '#c678dd', ar: 'أرجوانُ السحلب', en: 'Orchid' },
    { hex: '#bb9af7', ar: 'خُزاميّ',     en: 'Lavender' }
  ];

  /*@3.GADJ.12*/
  function normHex(v) {
    var s = String(v == null ? '' : v).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : '';
  }

  /*@3.GADJ.13*/
  var _styleRaw = null, _styleMap = {};
  function styleMap() {
    var raw = '';
    try { raw = localStorage.getItem(LS.prefs) || ''; } catch (e) { return {}; }
    if (raw !== _styleRaw) {
      _styleRaw = raw;
      var p = null;
      try { p = JSON.parse(raw || 'null'); } catch (e) {}
      _styleMap = (p && p.courseStyle && typeof p.courseStyle === 'object') ? p.courseStyle : {};
    }
    return _styleMap;
  }

  /*@3.GADJ.14*/
  function courseColor(code, entry) {
    var mine = normHex((styleMap()[code] || {}).color);
    if (mine) return mine;
    var info = courseInfo(code);
    return (info && info.brand_color) ||
           (entry && entry.brand_color) ||
           COLOR_DEF;
  }

  /*@3.GADJ.15*/
  function courseColorSource(code, entry) {
    if (normHex((styleMap()[code] || {}).color)) return 'custom';
    var info = courseInfo(code);
    if (info && info.brand_color) return 'catalog';
    return (entry && entry.brand_color) ? 'catalog' : 'default';
  }

  /*@3.GADJ.16*/
  function courseColorBase(code, entry) {
    var info = courseInfo(code);
    return (info && info.brand_color) || (entry && entry.brand_color) || COLOR_DEF;
  }

  /*@3.GADJ.17*/
  function setCourseColor(code, hex) {
    if (!code) return COLOR_DEF;
    var v = normHex(hex);
    var p = readJSON(LS.prefs, null);
    if (!p || typeof p !== 'object') p = {};
    if (!p.courseStyle || typeof p.courseStyle !== 'object') p.courseStyle = {};
    var cur = p.courseStyle[code];
    if (!cur || typeof cur !== 'object') cur = p.courseStyle[code] = {};
    if (v) cur.color = v; else delete cur.color;
    /*@3.GADJ.18*/
    if (!cur.color && !cur.icon) delete p.courseStyle[code];
    try { localStorage.setItem(LS.prefs, JSON.stringify(p)); } catch (e) {}
    _styleRaw = null;                       /*@3.GADJ.19*/
    var now = courseColor(code);
    try {
      document.dispatchEvent(new CustomEvent('garden:courseColorChanged', {
        detail: { code: code, color: now, custom: !!v }
      }));
    } catch (e) {}
    return now;
  }

  /*@3.GADJ.20*/

  /*@3.GADJ.21*/
  function moduleCards(code, moduleNum) {
    var raw;
    try { raw = localStorage.getItem('garden_' + code + '_m' + moduleNum + '_fc'); }
    catch (e) { return []; }
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return [];
      return Object.values(data).filter(function (c) {
        return c && typeof c === 'object';
      });
    } catch (e) { return []; }
  }

  /*@3.GADJ.22*/
  function courseStats(code) {
    var total = moduleCount(code);
    var out = { mastered: 0, due: 0, quizzesDone: 0, totalQuizzes: total, hasData: false };
    if (!isRealCourse(code)) { out.totalQuizzes = 0; return out; }
    var now = Date.now();
    /*@3.GADJ.23*/
    var logged = {};
    quizLog(code).forEach(function (a) { logged[a.k] = 1; });
    for (var m = 1; m <= total; m++) {
      moduleCards(code, m).forEach(function (card) {
        out.hasData = true;
        if (card.interval && card.interval >= 21) out.mastered++;
        if (card.nextReview && card.nextReview <= now) out.due++;
      });
      try {
        if (localStorage.getItem('garden_' + code + '_m' + m + '_quiz') !== null || logged[String(m)]) {
          out.quizzesDone++;
        }
      } catch (e) {}
    }
    return out;
  }

  /*@3.GADJ.24*/

  var LEGACY_QUIZ_TOTAL = 10;      /*@3.GADJ.25*/

  /*@3.GADJ.26*/
  var PERCENT_SCALE = [
    [95, 'A+'], [90, 'A'], [85, 'B+'], [80, 'B'],
    [75, 'C+'], [70, 'C'], [65, 'D+'], [60, 'D'], [0, 'F']
  ];
  var PASS_RATIO = 0.60;           /*@3.GADJ.27*/

  function gradeOfPercent(p) {
    var v = Math.round(Math.max(0, Math.min(100, Number(p) || 0)));
    for (var i = 0; i < PERCENT_SCALE.length; i++) {
      if (v >= PERCENT_SCALE[i][0]) return PERCENT_SCALE[i][1];
    }
    return 'F';
  }

  function quizLog(code) {
    if (!isRealCourse(code)) return [];
    try {
      var raw = localStorage.getItem('garden_' + String(code).toUpperCase() + '_quizlog');
      var v = raw ? JSON.parse(raw) : null;
      return Array.isArray(v) ? v.filter(function (x) {
        return x && x.t > 0 && isFinite(x.s) && x.k != null;
      }).sort(function (a, b) { return (a.at || 0) - (b.at || 0); }) : [];
    } catch (e) { return []; }
  }

  /*@3.GADJ.28*/
  function attemptsScore(list) {
    var num = 0, den = 0;
    for (var i = 0; i < list.length; i++) {
      var w = Math.pow(0.5, list.length - 1 - i);
      num += w * (list[i].s / list[i].t);
      den += w;
    }
    return den ? num / den : 0;
  }

  /*@3.GADJ.29*/
  var W_MODULE = 1, W_MID = 2.5, W_FINAL = 3, W_CARDS = 2;

  function quizEvidence(code) {
    var out = { rows: [], weight: 0, attempts: 0, hasLog: false,
                modules: moduleCount(code), covered: 0 };
    if (!isRealCourse(code)) return out;
    /*@3.GADJ.30*/
    code = String(code).toUpperCase();

    var log = quizLog(code);
    out.hasLog = log.length > 0;
    var byKind = {};
    log.forEach(function (a) {
      (byKind[a.k] = byKind[a.k] || []).push(a);
    });

    function push(kind, weight) {
      var list = byKind[kind];
      var legacy = false, best = null, q = null, first = null, last = null, n = 0, at = null;

      if (list && list.length) {
        n = list.length;
        q = attemptsScore(list);
        best = Math.max.apply(null, list.map(function (a) { return a.s / a.t; }));
        first = list[0].s / list[0].t;
        last = list[n - 1].s / list[n - 1].t;
        at = list[n - 1].at || null;
      } else {
        /*@3.GADJ.31*/
        var raw = null;
        try {
          raw = (kind === 'midterm' || kind === 'final')
            ? localStorage.getItem(code + '_' + kind + '_score')
            : localStorage.getItem('garden_' + code + '_m' + kind + '_quiz');
        } catch (e) {}
        if (raw == null || raw === '') return;
        var s, t;
        if (String(raw).indexOf('/') >= 0) {
          var parts = String(raw).split('/');
          s = parseFloat(parts[0]); t = parseFloat(parts[1]);
        } else { s = parseFloat(raw); t = LEGACY_QUIZ_TOTAL; }
        if (!isFinite(s) || !isFinite(t) || t <= 0) return;
        legacy = true; n = 1;
        q = best = first = last = Math.max(0, Math.min(1, s / t));
      }

      out.rows.push({
        kind: kind, weight: weight, legacy: legacy, attempts: n,
        score: q, best: best, first: first, last: last, at: at,
        trend: (n > 1) ? (last - first) : null
      });
      out.weight += weight;
      out.attempts += n;
      if (kind !== 'midterm' && kind !== 'final') out.covered++;
    }

    for (var m = 1; m <= out.modules; m++) push(String(m), W_MODULE);
    push('midterm', W_MID);
    push('final', W_FINAL);

    /*@3.GADJ.32*/
    var totalCards = 0, mastered = 0;
    for (var k = 1; k <= out.modules; k++) {
      moduleCards(code, k).forEach(function (c) {
        totalCards++;
        if (c.interval && c.interval >= 21) mastered++;
      });
    }
    if (totalCards >= 10) {
      out.rows.push({
        kind: 'cards', weight: W_CARDS, legacy: false, attempts: 0,
        score: mastered / totalCards, best: mastered / totalCards,
        first: null, last: null, at: null, trend: null,
        cards: { total: totalCards, mastered: mastered }
      });
      out.weight += W_CARDS;
    }
    return out;
  }

  /*@3.GADJ.33*/
  function _phi(z) { return 1 / (1 + Math.exp(-1.702 * z)); }

  /*@3.GADJ.34*/
  var PRIOR_W = 1.5;               /*@3.GADJ.35*/

  function coursePrediction(code) {
    var ev = quizEvidence(code);
    var out = {
      state: 'none', level: null, lo: null, hi: null, pass: null,
      grade: null, threshold: PASS_RATIO, trend: null,
      attempts: ev.attempts, weight: ev.weight, covered: ev.covered,
      modules: ev.modules, coverage: ev.modules ? ev.covered / ev.modules : 0,
      rows: ev.rows, hasLog: ev.hasLog, legacyOnly: false
    };
    if (!ev.rows.length) return out;

    out.legacyOnly = ev.rows.every(function (r) { return r.legacy || r.kind === 'cards'; });

    var num = PRIOR_W * PASS_RATIO, den = PRIOR_W;
    ev.rows.forEach(function (r) { num += r.weight * r.score; den += r.weight; });
    var level = num / den;

    /*@3.GADJ.36*/
    var half = Math.max(0.04, Math.min(0.30, 0.55 / Math.sqrt(den)));

    out.level = level;
    out.lo = Math.max(0, level - half);
    out.hi = Math.min(1, level + half);
    out.grade = gradeOfPercent(level * 100);
    /*@3.GADJ.37*/
    out.pass = _phi((level - PASS_RATIO) / Math.max(0.02, half / 1.28));

    var td = ev.rows.filter(function (r) { return r.trend != null; });
    if (td.length) {
      out.trend = td.reduce(function (s, r) { return s + r.trend; }, 0) / td.length;
    }

    /*@3.GADJ.38*/
    out.state = (ev.weight >= 3) ? 'ready' : 'thin';
    return out;
  }

  /*@3.GADJ.39*/
  function dueList(code, modules) {
    if (!isRealCourse(code)) return [];
    var now = Date.now();
    var nums = [];
    if (modules && modules.length) {
      modules.forEach(function (m) {
        var n = parseInt(String(m).replace(/^M/i, ''), 10);
        if (!isNaN(n) && nums.indexOf(n) === -1) nums.push(n);
      });
    } else {
      for (var i = 1; i <= moduleCount(code); i++) nums.push(i);
    }
    var out = [];
    nums.forEach(function (n) {
      var raw;
      try { raw = localStorage.getItem('garden_' + code + '_m' + n + '_fc'); }
      catch (e) { return; }
      if (!raw) return;
      var data;
      try { data = JSON.parse(raw); } catch (e) { return; }
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach(function (k) {
        var st = data[k];
        if (!st || typeof st !== 'object') return;
        if (!st.nextReview || st.nextReview > now) return;
        out.push({ code: code, module: n, idx: k, state: st, due: st.nextReview });
      });
    });
    return out;
  }

  /*@3.GADJ.40*/
  function dueCards(code, modules) { return dueList(code, modules).length; }

  /*@3.GADJ.41*/
  function courseIsActive(code) {
    var sem = semester();
    if (!sem || !sem.courses || !isRealCourse(code)) return false;
    for (var i = 0; i < sem.courses.length; i++) {
      var c = sem.courses[i];
      if (c && String(c.code) === String(code)) return !courseDone(c);
    }
    return false;
  }

  function dueListForSemester() {
    var sem = semester();
    if (!sem || !sem.courses) return [];
    var out = [];
    sem.courses.forEach(function (c) {
      if (!c || !isRealCourse(c.code) || courseDone(c)) return;
      dueList(c.code).forEach(function (r) { out.push(r); });
    });
    /*@3.GADJ.42*/
    out.sort(function (a, b) { return a.due - b.due; });
    return out;
  }

  /*@3.GADJ.43*/
  function dueForSemester() { return dueListForSemester().length; }

  /*@3.GADJ.44*/

  function semester() { return readJSON(LS.semester, null); }
  function archive() { return readJSON(LS.archive, []); }

  /*@3.GADJ.45*/

  /*@3.GADJ.46*/
  function finalExamDate(code) {
    var banner = null, any = null;
    (scheduleRaw().exams || []).forEach(function (e) {
      if (!e || e.course_code !== code || !e.date) return;
      if (e.exam_type !== 'final') return;
      var d = String(e.date);
      if (!any || d > any) any = d;
      if (e.sx_crn && (!banner || d > banner)) banner = d;
    });
    return banner || any;
  }

  function courseDone(entry) {
    if (!entry) return false;
    if (entry.done_manual === true || entry.done_manual === false) return entry.done_manual;
    var fin = finalExamDate(entry.code);
    if (fin) {
      var d = daysUntil(fin);
      if (d !== null && d < 0) return true;
    }
    return false;
  }

  /*@3.GADJ.47*/
  function coursePercent(entry) {
    if (!entry) return 0;
    if (courseDone(entry)) return 100;
    if (entry.custom || !isRealCourse(entry.code)) return 0;
    var st = courseStats(entry.code);
    return st.totalQuizzes ? Math.round((st.quizzesDone / st.totalQuizzes) * 100) : 0;
  }

  function semesterProgress() {
    var sem = semester();
    var out = { exists: false, name: '', total: 0, done: 0, credits: 0, pct: 0, due: 0, courses: [] };
    if (!sem || !sem.courses || !sem.courses.length) return out;

    out.exists = true;
    /*@3.GADJ.48*/
    out.name = dispName(sem) || '';
    out.total = sem.courses.length;
    out.done = sem.courses.filter(function (c) { return c && courseDone(c); }).length;

    var sumPct = 0;
    sem.courses.forEach(function (c) {
      if (!c) return;
      var info = courseInfo(c.code);
      var pct = coursePercent(c);
      var due = (isRealCourse(c.code) && !courseDone(c)) ? dueCards(c.code) : 0;
      sumPct += pct;
      out.credits += (info && info.credits) || c.credits || 3;
      out.due += due;
      out.courses.push({
        code: c.code,
        name_ar: (info && info.name_ar) || c.name_ar || c.name_en || c.name || c.code,
        name_en: (info && info.name_en) || c.name_en || c.name_ar || c.name || c.code,
        credits: (info && info.credits) || c.credits || 3,
        path: info && info.path,
        completed: courseDone(c),
        custom: !!c.custom,
        /*@3.GADJ.49*/
        color: courseColor(c.code, c),
        /*@3.GADJ.50*/
        desc_ar: (info && info.desc_ar) || '',
        desc_en: (info && info.desc_en) || '',
        pct: pct,
        due: due
      });
    });
    out.pct = out.total ? Math.round(sumPct / out.total) : 0;
    return out;
  }

  /*@3.GADJ.51*/

  /*@3.GADJ.52*/
  function gpaSummary() {
    var g = readJSON(LS.grades, null);
    var out = { exists: false, cgpa: 0, credits: 0, graded: 0, scale: 4, earnedCredits: 0, trCredits: 0 };
    if (!g || !g.semesters || !g.semesters.length) return out;
    var points = 0, credits = 0, graded = 0, earned = 0, tr = 0;
    g.semesters.forEach(function (sem) {
      (sem.courses || []).forEach(function (c) {
        if (!c || !c.grade) return;
        if (c.grade === TR_GRADE) {
          /*@3.GADJ.53*/
          tr += c.credits || 0;
          earned += c.credits || 0;
          return;
        }
        if (GPA_SCALE[c.grade] === undefined) return;
        points += GPA_SCALE[c.grade] * c.credits;
        credits += c.credits;
        graded++;
        if (c.grade !== 'F') earned += c.credits || 0;   /*@3.GADJ.54*/
      });
    });
    out.exists = credits > 0 || tr > 0;
    out.credits = credits;              /*@3.GADJ.55*/
    out.graded = graded;
    out.trCredits = tr;
    out.earnedCredits = earned;         /*@3.GADJ.56*/
    out.cgpa = credits > 0 ? points / credits : 0;
    return out;
  }

  /*@3.GADJ.57*/
  function gradeCourseInfo(c) {
    if (c.custom || !isRealCourse(c.code)) {
      return { name_ar: c.name_ar || c.name_en || c.name || 'مادة مخصصة',
               name_en: c.name_en || c.name_ar || c.name || 'Custom Course',
               credits: c.credits || 3 };
    }
    var info = courseInfo(c.code);
    if (info) {
      return { name_ar: info.name_ar || c.code, name_en: info.name_en || c.code,
               /*@3.GADJ.58*/
               credits: (c.credits != null) ? c.credits : ((info.credits != null) ? info.credits : 3) };
    }
    return { name_ar: c.name_ar || c.name_en || c.name || c.code,
             name_en: c.name_en || c.name_ar || c.name || c.code, credits: c.credits || 3 };
  }

  /*@3.GADJ.59*/
  function rebuildGrades() {
    /*@3.GADJ.60*/
    if (_catalog === null) { ready().then(rebuildGrades); return false; }
    var g = readJSON(LS.grades, null) || { semesters: [], updated_at: null };
    if (!Array.isArray(g.semesters)) g.semesters = [];
    var arch = archive() || [];
    var before = JSON.stringify(g.semesters);

    var ids = {};
    arch.forEach(function (a) { if (a && a.id) ids[a.id] = true; });
    /*@3.GADJ.61*/
    if (localStorage.getItem(LS.archive) !== null) {
      g.semesters = g.semesters.filter(function (s) { return s.is_current || !!ids[s.id]; });
    }

    arch.forEach(function (a) {
      if (!a || !a.id) return;
      var courses = (a.courses || []).map(function (c) {
        var info = gradeCourseInfo(c);
        return { code: c.code, name_ar: info.name_ar, name_en: info.name_en,
                 credits: info.credits, grade: c.grade || null,
                 points: c.grade ? (GPA_SCALE[c.grade] || 0) : null };
      });
      var ex = g.semesters.filter(function (s) { return s.id === a.id; })[0];
      if (ex) { ex.name = a.name; ex.courses = courses; ex.is_current = false; }
      else { g.semesters.push({ id: a.id, name: a.name, courses: courses, is_current: false }); }
    });

    if (JSON.stringify(g.semesters) === before) return false;
    g.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS.grades, JSON.stringify(g)); } catch (e) { return false; }
    try {
      document.dispatchEvent(new CustomEvent('garden:gradesChanged', { detail: { source: 'archive' } }));
    } catch (e) {}
    return true;
  }

  /*@3.GADJ.62*/
  function dispName(obj) {
    if (!obj) return '';
    var ar = (localStorage.getItem('garden_lang') || 'ar') === 'ar';
    if (ar) return obj.name || obj.name_ar || obj.name_en || '';
    return obj.name_en || obj.name || obj.name_ar || '';
  }

  function completedCourses() {
    var out = {};
    (archive() || []).forEach(function (sem) {
      (sem && sem.courses || []).forEach(function (c) {
        if (!c || !c.code || !c.grade) return;
        if (c.grade === 'F') return;
        out[c.code] = { grade: c.grade, semester: sem.name || '', semester_id: sem.id };
      });
    });
    return out;
  }

  /*@3.GADJ.63*/
  function gpaTimeline() {
    var g = readJSON(LS.grades, null);
    var out = [];
    if (!g || !g.semesters) return out;
    var points = 0, credits = 0;
    g.semesters.forEach(function (sem) {
      var sp = 0, sc = 0;
      (sem.courses || []).forEach(function (c) {
        if (c && c.grade && GPA_SCALE[c.grade] !== undefined) {
          sp += GPA_SCALE[c.grade] * c.credits;
          sc += c.credits;
        }
      });
      if (!sc) return;               /*@3.GADJ.64*/
      points += sp; credits += sc;
      out.push({
        id: sem.id, name: dispName(sem) || '',
        kind: sem.is_current ? 'current' : 'past',
        semGPA: sp / sc, cumGPA: points / credits,
        credits: sc, totalCredits: credits, totalPoints: points
      });
    });
    return out;
  }

  /*@3.GADJ.65*/

  /*@3.GADJ.66*/
  function todaySchedule(date) {
    var d = date || new Date();
    var day = todayDayName(d);
    var ds = todayStr(d);
    var s = readJSON(LS.schedule, null);
    var out = { exists: false, day: day, lectures: [], exams: [], blocks: [], count: 0 };
    if (!s) return out;
    out.exists = true;

    out.lectures = (s.lectures || []).filter(function (l) {
      return l && l.day === day && l.recurring;
    });
    out.exams = (s.exams || []).filter(function (e) { return e && e.date === ds; });
    out.blocks = (s.study_blocks || []).filter(function (b) { return b && b.day === day; });
    out.count = out.lectures.length + out.exams.length + out.blocks.length;
    return out;
  }

  /*@3.GADJ.67*/

  function writeSchedule(s) {
    s.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS.schedule, JSON.stringify(s)); return true; }
    catch (e) { return false; }
  }

  function scheduleRaw() {
    var s = readJSON(LS.schedule, null);
    if (!s) {
      /*@3.GADJ.68*/
      s = {
        version: 1,
        settings: {
          active_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
          day_start_hour: 15, day_end_hour: 22, slot_duration_minutes: 30,
          reminder_lead: 0, term_start_date: '', term_type: 'normal', semester_end_date: '',
          focus_periods: { midterm: { start: '', end: '' }, final: { start: '', end: '' } },
          onboarded: false
        },
        lectures: [], study_blocks: [], exams: [], week_overrides: {}
      };
    }
    if (!Array.isArray(s.exams)) s.exams = [];
    return s;
  }

  function courseExams(code) {
    return scheduleRaw().exams
      .filter(function (e) { return e && e.course_code === code; })
      .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  }

  /*@3.GADJ.69*/
  function upsertExam(ex) {
    if (!ex || !ex.course_code || !ex.date) return null;
    var s = scheduleRaw();
    var rec = {
      id: ex.id || ('exam_' + Date.now()),
      course_code: ex.course_code,
      date: ex.date,
      start_time: ex.start_time || '15:00',
      end_time: ex.end_time || '',
      exam_type: ex.exam_type || 'exam',
      room: ex.room || '',
      notes: ex.notes || ''
    };
    var i = s.exams.findIndex(function (e) { return e && e.id === rec.id; });
    if (i > -1) s.exams[i] = rec; else s.exams.push(rec);
    writeSchedule(s);
    return rec;
  }

  function deleteExam(id) {
    var s = scheduleRaw();
    var n = s.exams.length;
    s.exams = s.exams.filter(function (e) { return e && e.id !== id; });
    if (s.exams.length !== n) writeSchedule(s);
    return s.exams.length !== n;
  }

  /*@3.GADJ.70*/
  function courseTraces(code, wipe) {
    var out = { lectures: 0, study: 0, exams: 0, tasks: 0, archived: 0, pending: 0, plans: 0 };
    if (!code) return out;
    var FIELDS = [['lectures', 'lectures'], ['study_blocks', 'study'], ['exams', 'exams']];
    var s = scheduleRaw(), dirty = false;

    FIELDS.forEach(function (f) {
      var list = s[f[0]] || [];
      var keep = list.filter(function (x) { return !x || x.course_code !== code; });
      out[f[1]] = list.length - keep.length;
      if (out[f[1]] && wipe) { s[f[0]] = keep; dirty = true; }
    });

    var bucket = s.archived && s.archived[code];
    if (bucket) {
      FIELDS.forEach(function (f) { out.archived += (bucket[f[0]] || []).length; });
      if (out.archived && wipe) { delete s.archived[code]; dirty = true; }
    }

    if (s.sx_pending && Array.isArray(s.sx_pending.courses)) {
      var pc = s.sx_pending.courses.filter(function (c) { return !c || c.code !== code; });
      out.pending = s.sx_pending.courses.length - pc.length;
      if (out.pending && wipe) { s.sx_pending.courses = pc; dirty = true; }
    }

    /*@3.GADJ.71*/
    var ints = s.intensive;
    if (ints && typeof ints === 'object') {
      Object.keys(ints.plans || {}).forEach(function (tab) {
        var p = ints.plans[tab];
        if (!p || typeof p !== 'object') return;
        if (Array.isArray(p.courses)) {
          var kc = p.courses.filter(function (c) { return c !== code; });
          out.plans += p.courses.length - kc.length;
          if (kc.length !== p.courses.length && wipe) { p.courses = kc; dirty = true; }
        }
        if (Array.isArray(p.sessions)) {
          var ks = p.sessions.filter(function (x) { return !x || x.course !== code; });
          out.plans += p.sessions.length - ks.length;
          if (ks.length !== p.sessions.length && wipe) { p.sessions = ks; dirty = true; }
        }
        ['exam_dates', 'modules'].forEach(function (k) {
          if (p[k] && typeof p[k] === 'object' && p[k][code] !== undefined) {
            out.plans++;
            if (wipe) { delete p[k][code]; dirty = true; }
          }
        });
      });
      var ms = ints.module_status;
      if (ms && typeof ms === 'object') {
        Object.keys(ms).forEach(function (k) {
          if (k.indexOf(code + '_') !== 0) return;
          out.plans++;
          if (wipe) { delete ms[k]; dirty = true; }
        });
      }
    }

    if (dirty) writeSchedule(s);

    var tl = tasks();
    var tk = tl.filter(function (t) { return !t || t.course !== code; });
    out.tasks = tl.length - tk.length;
    if (out.tasks && wipe) writeTasks(tk);

    return out;
  }

  function removeCourseTraces(code) { return courseTraces(code, true); }

  /*@3.GADJ.72*/
  function courseLearning(code, wipe) {
    var out = { cards: 0, quizzes: 0, attempts: 0, keys: 0 };
    if (!code) return out;
    var CODE = String(code);
    var pre = 'garden_' + CODE + '_m';       /*@3.GADJ.73*/
    var logK = 'garden_' + CODE.toUpperCase() + '_quizlog';
    var kill = [], keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    } catch (e) { return out; }

    keys.forEach(function (k) {
      if (!k) return;
      if (k.indexOf(pre) === 0 && /_m\d+_fc$/.test(k)) {
        var d = readJSON(k, null);
        if (d && typeof d === 'object') out.cards += Object.keys(d).length;
        kill.push(k); return;
      }
      if (k.indexOf(pre) === 0 && /_m\d+_quiz$/.test(k)) { out.quizzes++; kill.push(k); return; }
      if (k === logK) {
        var l = readJSON(k, null);
        if (Array.isArray(l)) out.attempts += l.length;
        kill.push(k); return;
      }
      /*@3.GADJ.74*/
      if (k === CODE + '_midterm_score' || k === CODE + '_final_score') { out.quizzes++; kill.push(k); }
    });

    out.keys = kill.length;
    if (!wipe || !out.keys) return out;
    kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    /*@3.GADJ.75*/
    try {
      document.dispatchEvent(new CustomEvent('garden:cardsReviewed', {
        detail: { code: CODE, reset: true }
      }));
    } catch (e) {}
    return out;
  }

  function resetCourseLearning(code) { return courseLearning(code, true); }

  /*@3.GADJ.76*/

  var RAMP = [
    [2.00, [352, 66, 56]],   /*@3.GADJ.77*/
    [2.50, [  8, 74, 57]],   /*@3.GADJ.78*/
    [2.90, [ 26, 82, 55]],   /*@3.GADJ.79*/
    [3.20, [ 40, 76, 52]],   /*@3.GADJ.80*/
    [3.26, [ 44, 30, 49]],   /*@3.GADJ.81*/
    [3.33, [120, 22, 45]],   /*@3.GADJ.82*/
    [3.50, [128, 32, 44]],   /*@3.GADJ.83*/
    [3.75, [150, 44, 42]],   /*@3.GADJ.84*/
    [4.00, [164, 56, 40]]    /*@3.GADJ.85*/
  ];

  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return 'rgb(' + Math.round((r + m) * 255) + ',' + Math.round((g + m) * 255) + ',' + Math.round((b + m) * 255) + ')';
  }

  function lerpHue(a, b, t) {
    var d = ((b - a + 540) % 360) - 180;     /*@3.GADJ.86*/
    return a + d * t;
  }

  function qualityColor(v) {
    if (!(v > -Infinity)) return 'var(--text-muted)';
    if (v <= RAMP[0][0]) return hsl2rgb.apply(null, RAMP[0][1]);
    var last = RAMP[RAMP.length - 1];
    if (v >= last[0]) return hsl2rgb.apply(null, last[1]);
    for (var i = 0; i < RAMP.length - 1; i++) {
      var a = RAMP[i], b = RAMP[i + 1];
      if (v >= a[0] && v <= b[0]) {
        var t = (v - a[0]) / (b[0] - a[0]);
        return hsl2rgb(lerpHue(a[1][0], b[1][0], t),
                       a[1][1] + (b[1][1] - a[1][1]) * t,
                       a[1][2] + (b[1][2] - a[1][2]) * t);
      }
    }
    return hsl2rgb.apply(null, last[1]);
  }

  /*@3.GADJ.87*/
  function qualityColor01(p) {
    var v = Math.max(0, Math.min(1, Number(p) || 0));
    return qualityColor(RAMP[0][0] + v * (RAMP[RAMP.length - 1][0] - RAMP[0][0]));
  }

  /*@3.GADJ.88*/

  var DEFAULT_MODULES = 13;

  function pendingSections() {
    var s = scheduleRaw();
    var p = s && s.sx_pending;
    if (!p || !Array.isArray(p.courses)) return [];
    var sem = semester();
    var have = (sem && sem.courses ? sem.courses : [])
      .filter(Boolean).map(function (c) { return c.code; });
    return p.courses.filter(function (c) {
      return c && c.code && have.indexOf(c.code) === -1;
    });
  }

  /*@3.GADJ.89*/
  function semEntryFromPending(c) {
    var e = {
      code: c.code,
      added_at: new Date().toISOString(),
      completed: false, completed_at: null, grade: null,
      from_sections: true
    };
    if (!courseInfo(c.code)) {
      e.custom = true;
      e.external = true;
      e.name_ar = c.title || c.code;
      e.name_en = c.title || c.code;
      e.credits = Number(c.ch) || 3;
      e.icon = 'fa-solid fa-book';
      e.brand_color = '#64748b';
      e.modules = [];
      for (var i = 1; i <= DEFAULT_MODULES; i++) {
        e.modules.push({ id: 'm' + i, title: 'الوحدة ' + i, title_en: 'Module ' + i });
      }
    }
    return e;
  }

  function writeSemester(sem) {
    sem.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS.semester, JSON.stringify(sem)); } catch (e) { return false; }
    try { localStorage.setItem('__syncT_' + LS.semester, String(Date.now())); } catch (e) {}
    return true;
  }

  /*@3.GADJ.90*/
  function adoptPending(codes) {
    return ready().then(function () {
      var list = pendingSections();
      if (codes && codes.length) {
        list = list.filter(function (c) { return codes.indexOf(c.code) !== -1; });
      }
      var s = scheduleRaw();
      if (!list.length) {
        if (s.sx_pending) { delete s.sx_pending; writeSchedule(s); }
        return { added: [], semester: semester() };
      }

      var sem = semester();
      if (!sem || typeof sem !== 'object') {
        var ar = (localStorage.getItem('garden_lang') || 'ar') === 'ar';
        sem = {
          id: 'sem_' + Date.now(),
          name: ar ? 'فصلي' : 'My term',
          name_ar: 'فصلي', name_en: 'My term',
          courses: [], is_active: false, is_pinned: false, was_activated: false,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        };
      }
      if (!Array.isArray(sem.courses)) sem.courses = [];
      if (!s.archived || typeof s.archived !== 'object') s.archived = {};

      var added = [];
      list.forEach(function (c) {
        if (sem.courses.some(function (x) { return x && x.code === c.code; })) return;
        sem.courses.push(semEntryFromPending(c));
        added.push(c.code);
        /*@3.GADJ.91*/
        var b = s.archived[c.code];
        if (b) {
          ['lectures', 'study_blocks', 'exams'].forEach(function (k) {
            s[k] = (s[k] || []).concat(b[k] || []);
          });
          delete s.archived[c.code];
        }
      });

      writeSemester(sem);
      /*@3.GADJ.92*/
      if (s.sx_pending && Array.isArray(s.sx_pending.courses)) {
        var rest = s.sx_pending.courses.filter(function (c) {
          return c && added.indexOf(c.code) === -1;
        });
        if (rest.length) s.sx_pending.courses = rest; else delete s.sx_pending;
      }
      writeSchedule(s);
      try { rebuildGrades(); } catch (e) {}
      return { added: added, semester: sem };
    });
  }

  /*@3.GADJ.93*/

  function metaKey(code) { return 'course_meta_' + code; }

  function courseMeta(code) {
    var m = readJSON(metaKey(code), null) || {};
    if (!Array.isArray(m.instructors)) m.instructors = [];
    if (!Array.isArray(m.links)) m.links = [];
    if (!Array.isArray(m.dates)) m.dates = [];   /*@3.GADJ.94*/
    if (!Array.isArray(m.notes)) m.notes = [];
    return m;
  }

  function saveCourseMeta(code, meta) {
    meta.updated_at = Date.now();
    try { localStorage.setItem(metaKey(code), JSON.stringify(meta)); return true; }
    catch (e) { return false; }
  }

  /*@3.GADJ.95*/
  function toggleCourseDate(code, id) {
    var m = courseMeta(code);
    var d = m.dates.filter(function (x) { return x && x.id === id; })[0];
    if (!d) return null;
    d.done = !d.done;
    saveCourseMeta(code, m);
    return d;
  }

  /*@3.GADJ.96*/

  /*@3.GADJ.97*/
  function _weekIdOf(d) {
    var dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
    var week1 = new Date(dt.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((dt - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return dt.getFullYear() + '-W' + (weekNum < 10 ? '0' + weekNum : String(weekNum));
  }

  /*@3.GADJ.98*/
  function todaySessions(level, date) {
    var out = { exists: false, todayTotal: 0, todayDone: 0, total: 0, done: 0, pct: 0 };
    var t = todaySchedule(date);
    if (!t.exists) return out;
    out.exists = true;

    var d = date || new Date();
    var s = readJSON(LS.schedule, null) || {};
    var wid = _weekIdOf(d);
    var ov = (s.week_overrides && s.week_overrides[wid]) || {};
    var completed = ov.completed_events || [];

    var all = t.lectures.concat(t.blocks);
    all.forEach(function (ev) {
      if (ev && completed.indexOf(ev.id) !== -1) out.todayDone++;
    });
    t.exams.forEach(function (ex) {
      if (ex && ex.completed_at) out.todayDone++;
    });

    out.todayTotal = t.count;
    out.total = out.todayTotal;
    out.done = out.todayDone;
    out.pct = out.todayTotal ? Math.round((out.todayDone / out.todayTotal) * 100) : 0;
    return out;
  }

  /*@3.GADJ.99*/

  function profile() { return readJSON(LS.profile, { name: '', level: '', target_gpa: null }); }
  function quickNotes() { return readJSON(LS.notes, []); }
  function prefs() { return readJSON(LS.prefs, null); }

  /*@3.GADJ.100*/

  function tasks() {
    var t = readJSON(LS.tasks, []);
    return Array.isArray(t) ? t.filter(Boolean) : [];
  }

  function writeTasks(list) {
    try { localStorage.setItem(LS.tasks, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

  /*@3.GADJ.101*/
  function upsertTask(task) {
    var list = tasks();
    var rec = {
      id: task.id || ('task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
      course: task.course || null,
      title: String(task.title || '').trim(),
      type: task.type || 'other',
      due: task.due || '',
      done: !!task.done,
      note: task.note || '',
      created_at: task.created_at || Date.now()
    };
    var i = list.findIndex(function (x) { return x.id === rec.id; });
    if (i > -1) list[i] = rec; else list.push(rec);
    writeTasks(list);
    return rec;
  }

  function deleteTask(id) {
    var list = tasks();
    var n = list.length;
    writeTasks(list.filter(function (x) { return x.id !== id; }));
    return n !== tasks().length;
  }

  function toggleTask(id) {
    var list = tasks();
    var t = list.find(function (x) { return x.id === id; });
    if (!t) return null;
    t.done = !t.done;
    writeTasks(list);
    return t;
  }

  /*@3.GADJ.102*/
  function writeNotes(list) {
    try { localStorage.setItem(LS.notes, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function upsertNote(note) {
    var list = quickNotes();
    if (!Array.isArray(list)) list = [];
    var i = note.id ? list.findIndex(function (x) { return x && x.id === note.id; }) : -1;
    var base = (i > -1) ? list[i] : {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      created_at: Date.now(), archived: false
    };
    if (note.title !== undefined) base.title = String(note.title || '').trim();
    if (note.body !== undefined) base.body = String(note.body || '');
    if (note.remind_at !== undefined) base.remind_at = note.remind_at || '';
    if (note.archived !== undefined) base.archived = !!note.archived;
    base.updated_at = Date.now();
    if (i > -1) list[i] = base; else list.push(base);
    writeNotes(list);
    return base;
  }
  function setNoteReminder(id, remindAt) {
    var list = quickNotes();
    var n = list.find(function (x) { return x && x.id === id; });
    if (!n) return null;
    n.remind_at = remindAt || '';
    n.updated_at = Date.now();
    writeNotes(list);
    return n;
  }

  /*@3.GADJ.103*/
  var NOTES_BACKUP = 'quick_notes_premigration';

  /*@3.GADJ.104*/
  function noteToTaskFields(n) {
    var body = String(n.body || '').trim();
    var title = String(n.title || '').trim();
    if (!title) {
      title = body.split('\n')[0].trim();
      if (title.length > 80) title = title.slice(0, 79) + '…';
    }
    return {
      /*@3.GADJ.105*/
      id: 'task_note_' + n.id,
      course: n.course || null,
      title: title,
      type: 'other',
      due: n.remind_at || '',
      done: false,
      note: body,
      created_at: n.created_at || Date.now()
    };
  }

  /*@3.GADJ.106*/
  function convertNoteToTask(note) {
    if (!note || !note.remind_at) return null;
    var f = noteToTaskFields(note);
    var prev = tasks().filter(function (t) { return t.id === f.id; })[0];
    /*@3.GADJ.107*/
    var rec = prev || upsertTask(f);
    if (note.id) {
      writeNotes(quickNotes().filter(function (x) { return x && x.id !== note.id; }));
    }
    return rec;
  }

  /*@3.GADJ.108*/
  function migrateTimedNotes() {
    var list = quickNotes();
    if (!Array.isArray(list) || !list.length) return 0;
    var timed = list.filter(function (n) { return n && n.remind_at && !n.archived; });
    if (!timed.length) return 0;
    /*@3.GADJ.109*/
    try {
      if (!localStorage.getItem(NOTES_BACKUP)) {
        localStorage.setItem(NOTES_BACKUP, JSON.stringify({ at: Date.now(), notes: list }));
      }
    } catch (e) {}
    var n = 0;
    timed.forEach(function (note) { if (convertNoteToTask(note)) n++; });
    return n;
  }

  /*@3.GADJ.110*/

  function gpaPlan() {
    var p = readJSON(LS.gpaPlan, null);
    if (!p || !Array.isArray(p.semesters)) p = { semesters: [] };
    return p;
  }

  function saveGpaPlan(plan) {
    try { localStorage.setItem(LS.gpaPlan, JSON.stringify(plan)); return true; }
    catch (e) { return false; }
  }

  /*@3.GADJ.111*/
  function gpaForecast(overrideGrade) {
    var tl = gpaTimeline();
    var last = tl.length ? tl[tl.length - 1] : null;
    var points = last ? last.totalPoints : 0;
    var credits = last ? last.totalCredits : 0;

    var out = { start: { points: points, credits: credits, cgpa: credits ? points / credits : 0 },
                semesters: [], plannedCredits: 0, final: 0 };

    gpaPlan().semesters.forEach(function (sem) {
      var sp = 0, sc = 0;
      (sem.courses || []).forEach(function (c) {
        if (!c) return;
        var gr = overrideGrade || c.grade;
        if (!gr || GPA_SCALE[gr] === undefined) return;
        sp += GPA_SCALE[gr] * (c.credits || 0);
        sc += (c.credits || 0);
      });
      points += sp; credits += sc;
      out.plannedCredits += sc;
      out.semesters.push({
        id: sem.id, name: dispName(sem) || '',
        semGPA: sc ? sp / sc : 0, cumGPA: credits ? points / credits : 0,
        credits: sc, graded: sc > 0
      });
    });
    out.final = credits ? points / credits : 0;
    return out;
  }

  /*@3.GADJ.112*/
  function gpaTarget(target, remainingCredits) {
    var tl = gpaTimeline();
    var last = tl.length ? tl[tl.length - 1] : null;
    var points = last ? last.totalPoints : 0;
    var credits = last ? last.totalCredits : 0;
    var rem = remainingCredits || 0;
    var max = GPA_SCALE['A+'];

    if (rem <= 0) {
      return { possible: false, reason: 'no-remaining', current: credits ? points / credits : 0 };
    }
    var total = credits + rem;
    var needed = (target * total - points) / rem;
    return {
      possible: true,
      needed: needed,
      feasible: needed <= max + 1e-9 && needed >= 0,
      maxAchievable: (points + max * rem) / total,
      minAchievable: points / total,
      current: credits ? points / credits : 0,
      remainingCredits: rem,
      totalCredits: total
    };
  }

  /*@3.GADJ.113*/
  function allDeadlines() {
    var out = tasks().map(function (t) {
      return {
        id: t.id, source: 'task', editable: true,
        course: t.course || null, title: t.title, type: t.type,
        due: t.due, done: !!t.done, note: t.note || ''
      };
    });

    /*@3.GADJ.114*/
    var sem = semester();
    var codes = (sem && sem.courses ? sem.courses : [])
      .filter(Boolean).map(function (c) { return c.code; });

    codes.forEach(function (code) {
      courseMeta(code).dates.forEach(function (d) {
        if (!d || !d.date) return;
        out.push({
          id: d.id, source: 'course', editable: false,
          course: code, title: d.title || '', type: d.type || 'assignment',
          due: d.date + (d.time ? 'T' + d.time : ''), done: !!d.done, note: d.note || ''
        });
      });
    });

    /*@3.GADJ.115*/
    (scheduleRaw().exams || []).forEach(function (e) {
      if (!e || !e.date) return;
      if (codes.length && codes.indexOf(e.course_code) === -1) return;
      var due = e.date + (e.start_time ? 'T' + e.start_time : '');
      var d = daysUntil(due);
      out.push({
        id: e.id, source: 'exam', editable: false,
        course: e.course_code || null, title: '', type: e.exam_type || 'exam',
        due: due, done: (d !== null && d < 0),
        note: e.room || ''
      });
    });

    /*@3.GADJ.116*/

    out.sort(function (a, b) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return String(a.due).localeCompare(String(b.due));
    });
    return out;
  }

  /*@3.GADJ.117*/
  function daysUntil(due, now) {
    if (!due) return null;
    var d = new Date(due);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    var base = now ? new Date(now) : new Date();
    base.setHours(0, 0, 0, 0);
    return Math.round((d - base) / 86400000);
  }

  /*@3.GADJ.118*/
  function majorExamWave(win, now) {
    var w = (typeof win === 'number') ? win : 21;
    var all = allDeadlines().filter(function (d) {
      return d.source === 'exam' && (d.type === 'midterm' || d.type === 'final');
    });
    if (!all.length) return null;

    var soon = all.filter(function (d) {
      var n = daysUntil(d.due, now);
      return n !== null && n >= 0;
    });
    if (!soon.length) return null;              /*@3.GADJ.119*/

    var first = soon[0];                        /*@3.GADJ.120*/
    var days = daysUntil(first.due, now);
    if (days > w) return null;                  /*@3.GADJ.121*/

    var kind = first.type;
    var rest = soon.filter(function (d) { return d.type === kind; });
    var total = all.filter(function (d) { return d.type === kind; }).length;
    var last = rest[rest.length - 1];
    return {
      kind: kind, days: days,
      count: rest.length, total: total,
      course: first.course || '',
      due: first.due,
      from: String(first.due).slice(0, 10),
      to: String(last.due).slice(0, 10)
    };
  }

  /*@3.GADJ.122*/
  function tasksDueSoon(now) {
    return allDeadlines().filter(function (t) {
      if (t.done) return false;
      var d = daysUntil(t.due, now);
      return d !== null && d <= 1;
    }).length;
  }

  /*@3.GADJ.123*/

  window.GardenData = {
    ready: ready,
    KEYS: LS,
    GPA_SCALE: GPA_SCALE,
    DAYS_ORDER: DAYS_ORDER,

    catalog: catalog,
    catalogList: catalogList,
    courseInfo: courseInfo,
    moduleCount: moduleCount,
    isRealCourse: isRealCourse,

    COLOR_PALETTE: PALETTE,
    COLOR_PALETTE_SKIN: PALETTE_SKIN,
    COLOR_DEFAULT: COLOR_DEF,
    normHex: normHex,
    courseColor: courseColor,
    courseColorBase: courseColorBase,
    courseColorSource: courseColorSource,
    setCourseColor: setCourseColor,

    moduleCards: moduleCards,
    courseStats: courseStats,
    dueCards: dueCards,
    dueList: dueList,
    courseIsActive: courseIsActive,
    dueListForSemester: dueListForSemester,
    dueForSemester: dueForSemester,

    quizLog: quizLog,
    quizEvidence: quizEvidence,
    coursePrediction: coursePrediction,
    gradeOfPercent: gradeOfPercent,
    PERCENT_SCALE: PERCENT_SCALE,
    PASS_RATIO: PASS_RATIO,

    semester: semester,
    archive: archive,
    courseDone: courseDone,
    finalExamDate: finalExamDate,
    coursePercent: coursePercent,
    semesterProgress: semesterProgress,

    gpaSummary: gpaSummary,
    rebuildGrades: rebuildGrades,
    completedCourses: completedCourses,
    dispName: dispName,
    todaySchedule: todaySchedule,
    todaySessions: todaySessions,

    scheduleRaw: scheduleRaw,
    courseExams: courseExams,
    upsertExam: upsertExam,
    deleteExam: deleteExam,
    courseTraces: courseTraces,
    removeCourseTraces: removeCourseTraces,
    courseLearning: courseLearning,
    resetCourseLearning: resetCourseLearning,

    pendingSections: pendingSections,
    adoptPending: adoptPending,

    qualityColor: qualityColor,
    qualityColor01: qualityColor01,
    QUALITY_RAMP: RAMP,

    courseMeta: courseMeta,
    saveCourseMeta: saveCourseMeta,
    toggleCourseDate: toggleCourseDate,

    profile: profile,
    quickNotes: quickNotes,
    upsertNote: upsertNote,
    setNoteReminder: setNoteReminder,
    convertNoteToTask: convertNoteToTask,
    migrateTimedNotes: migrateTimedNotes,
    prefs: prefs,

    tasks: tasks,
    upsertTask: upsertTask,
    deleteTask: deleteTask,
    toggleTask: toggleTask,
    allDeadlines: allDeadlines,
    majorExamWave: majorExamWave,
    daysUntil: daysUntil,
    tasksDueSoon: tasksDueSoon,

    gpaTimeline: gpaTimeline,
    gpaPlan: gpaPlan,
    saveGpaPlan: saveGpaPlan,
    gpaForecast: gpaForecast,
    gpaTarget: gpaTarget,

    todayStr: todayStr,
    todayDayName: todayDayName
  };

  /*@3.GADJ.124*/
  ready().then(rebuildGrades);

  /*@3.GADJ.125*/
  try { migrateTimedNotes(); } catch (e) {}

  /*@3.GADJ.126*/
  window.addEventListener('garden:syncCompleted', function () {
    try {
      if (migrateTimedNotes() > 0) {
        window.dispatchEvent(new CustomEvent('garden:notesMigrated'));
      }
    } catch (e) {}
  });
})();
