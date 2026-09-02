/*@3.GPAJ.1*/
(function () {
  'use strict';

  /*@3.GPAJ.2*/
  var CATALOG_PATH = '../shared/data/courses_catalog.json';
  var LS_SEMESTER = 'my_semester';
  var LS_ARCHIVE  = 'semester_archive';
  var LS_GRADES   = 'gpa_grades';
  var LS_REC_ORD  = 'gpa_record_order';

  var GPA_SCALE = {
    'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.00,
    'C+': 2.50, 'C': 2.00, 'D+': 1.50, 'D': 1.00, 'F': 0.00
  };
  var GRADE_OPTIONS = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'TR'];
  var PREP_RE = /^[A-Za-z]+0/;          /*@3.GPAJ.3*/

  /*@3.GPAJ.4*/
  var gradesData = null, semester = null, archive = [];
  var catalogMap = {}, catalogArr = [];
  var whatIf = {}, pickerQ = '', scenario = '', editingId = null;
  var _chartDrawn = false, programCredits = 132;
  /*@3.GPAJ.109*/
  var PL_VER = 6;

  /*@3.GPAJ.105*/
  function progCredits() {
    /*@3.GPAJ.106*/
    if (programCredits !== 132) return programCredits;
    try {
      var prof = JSON.parse(localStorage.getItem('student_profile') || 'null');
      var slug = prof && prof.program;
      if (!slug) return programCredits;
      var v = JSON.parse(localStorage.getItem('sx_plans') || 'null');
      /*@3.GPAJ.108*/
      if (!v || v.v !== PL_VER) return programCredits;
      var progs = v.d && (Array.isArray(v.d) ? v.d : v.d.programs);
      if (!progs) return programCredits;
      for (var i = 0; i < progs.length; i++) {
        if (progs[i].slug !== slug) continue;
        /*@3.GPAJ.107*/
        if (progs[i].ch > 60) { programCredits = Math.round(progs[i].ch); return programCredits; }
        var n = 0;
        (progs[i].courses || []).forEach(function (c) {
          if (c.k === 'track' || (c.tr && c.tr.length)) return;
          var h = (c.h != null ? c.h : c.ch);
          n += (h == null ? 0 : +h) || 0;
        });
        /*@3.GPAJ.110*/
        if (n >= 24) programCredits = Math.round(n);
        return programCredits;
      }
    } catch (e) {}
    return programCredits;
  }

  /*@3.GPAJ.5*/
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function crWord(n) {
    return (window.Garden && window.Garden.smartCount)
      ? window.Garden.smartCount(n, ['ساعة', 'ساعتان', 'ساعات'], ['credit', 'credits'])
      : n + ' ' + (isAr() ? 'ساعة' : 'credits');
  }
  /*@3.GPAJ.103*/
  function toast(msg, ms) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('is-on'); }, ms || 2200);
  }

  /*@3.GPAJ.6*/
  var _slug;
  function mySlug() {
    if (_slug !== undefined) return _slug;
    try {
      var p = JSON.parse(localStorage.getItem('student_profile') || 'null');
      _slug = (p && p.program) || '';
    } catch (e) { _slug = ''; }
    return _slug;
  }
  function planInfo(code) {
    var R = window.GardenPlanRules, s = mySlug();
    if (!R || !s || !R.courseBy(s, code)) return null;
    return { name_ar: R.courseTitle(s, code, 'ar') || code,
             name_en: R.courseTitle(s, code, 'en') || code,
             credits: R.courseCh(s, code) || 3 };
  }

  /*@3.GPAJ.116*/
  function coursePool() {
    var R = window.GardenPlanRules, s = mySlug(), ar = isAr();
    var seen = {}, out = [];
    function add(code, nm) {
      if (!code || seen[code]) return;
      seen[code] = 1;
      out.push({ code: code, name: nm || code });
    }
    /*@3.GPAJ.117*/
    (archive || []).forEach(function (a) {
      ((a && a.courses) || []).forEach(function (c) {
        if (!c || !c.code) return;
        var i = getCourseInfo(c);
        add(c.code, ar ? i.name_ar : i.name_en);
      });
    });
    if (R && s) {
      R.courses(s).forEach(function (c) {
        var code = R.fCode(c);
        add(code, R.courseTitle(s, code, ar ? 'ar' : 'en'));
      });
    }
    /*@3.GPAJ.118*/
    catalogArr.forEach(function (c) {
      if (!c || !c.code) return;
      if (R && s && R.inProgram(s, c.code) === false) return;
      add(c.code, (ar ? c.name_ar : c.name_en) || c.code);
    });
    out.sort(function (x, y) { return x.code < y.code ? -1 : (x.code > y.code ? 1 : 0); });
    return out;
  }

  function getCourseInfo(sc) {
    if (sc.custom) {
      return { name_ar: sc.name_ar || sc.name_en || 'مادة مخصصة',
               name_en: sc.name_en || sc.name_ar || 'Custom Course',
               credits: sc.credits || 3 };
    }
    var info = catalogMap[sc.code];
    if (info) {
      return { name_ar: info.name_ar || sc.code, name_en: info.name_en || sc.code,
               credits: (sc.credits != null) ? sc.credits : ((info.credits != null) ? info.credits : 3) };
    }
    if (sc.name_ar || sc.name_en) {
      return { name_ar: sc.name_ar || sc.name_en, name_en: sc.name_en || sc.name_ar,
               credits: sc.credits || 3 };
    }
    var pl = planInfo(sc.code);
    if (pl) {
      return { name_ar: pl.name_ar, name_en: pl.name_en,
               credits: (sc.credits != null) ? sc.credits : pl.credits };
    }
    return { name_ar: sc.code, name_en: sc.code, credits: sc.credits || 3 };
  }

  function currentSemesterId() {
    if (!semester) return null;
    return semester.id || ('sem_legacy_' + (semester.name || 'current'));
  }

  function syncCurrentSemester() {
    if (!semester || !semester.courses || semester.courses.length === 0) return;
    var semId = currentSemesterId();
    var gs = gradesData.semesters.find(function (s) { return s.id === semId; });
    if (!gs) { gs = { id: semId, name: semester.name, courses: [], is_current: true }; gradesData.semesters.push(gs); }
    gs.is_current = true;
    gs.name = semester.name; gs.name_ar = semester.name_ar;
    gs.name_en = semester.name_en; gs.level = semester.level;
    gs.summer = !!semester.summer;

    semester.courses.forEach(function (sc) {
      var info = getCourseInfo(sc);
      var ex = gs.courses.find(function (gc) { return gc.code === sc.code; });
      if (!ex) {
        gs.courses.push({ code: sc.code, name_ar: info.name_ar, name_en: info.name_en,
                          credits: info.credits, grade: sc.grade || null,
                          points: sc.grade ? (GPA_SCALE[sc.grade] || 0) : null });
      } else {
        ex.name_ar = info.name_ar; ex.name_en = info.name_en; ex.credits = info.credits;
        if (sc.grade && !ex.grade) { ex.grade = sc.grade; ex.points = GPA_SCALE[sc.grade] || 0; }
      }
    });
    var live = {};
    semester.courses.forEach(function (c) { live[c.code] = true; });
    gs.courses = gs.courses.filter(function (gc) {
      if (String(gc.code).indexOf('__MANUAL_') === 0) return true;
      return !!live[gc.code];
    });
    saveGrades();
  }

  function normalizeCurrentFlag() {
    var cur = currentSemesterId(), changed = false;
    gradesData.semesters.forEach(function (s) {
      var should = (cur !== null && s.id === cur);
      if (!!s.is_current !== should) { s.is_current = should; changed = true; }
    });
    if (changed) saveGrades();
  }

  function syncArchivedSemesters() {
    var ids = {};
    (archive || []).forEach(function (a) { ids[a.id] = true; });
    /*@3.GPAJ.7*/
    if (localStorage.getItem(LS_ARCHIVE) !== null) {
      gradesData.semesters = gradesData.semesters.filter(function (s) {
        if (s.is_current) return true;
        return !!ids[s.id];
      });
    }
    (archive || []).forEach(function (a) {
      var courses = (a.courses || []).map(function (c) {
        var info = getCourseInfo(c);
        return { code: c.code, name_ar: info.name_ar, name_en: info.name_en,
                 credits: info.credits, grade: c.grade || null,
                 points: c.grade ? (GPA_SCALE[c.grade] || 0) : null };
      });
      /*@3.GPAJ.8*/
      var meta = { name: a.name, name_ar: a.name_ar, name_en: a.name_en, level: a.level };
      var ex = gradesData.semesters.find(function (s) { return s.id === a.id; });
      if (ex) { Object.assign(ex, meta); ex.courses = courses; ex.is_current = false; }
      else { gradesData.semesters.push(Object.assign({ id: a.id, courses: courses, is_current: false }, meta)); }
    });
    saveGrades();
  }

  function saveGrades() {
    gradesData.updated_at = new Date().toISOString();
    localStorage.setItem(LS_GRADES, JSON.stringify(gradesData));
  }

  /*@3.GPAJ.9*/
  function gpaOf(courses, useWhatIf) {
    var p = 0, c = 0;
    (courses || []).forEach(function (x) {
      var g = x.grade || (useWhatIf ? whatIf[x.code] : null);
      if (g && GPA_SCALE[g] !== undefined) { p += GPA_SCALE[g] * x.credits; c += x.credits; }
    });
    return c > 0 ? p / c : 0;
  }
  function allCourses() {
    return gradesData.semesters.reduce(function (a, s) { return a.concat(s.courses || []); }, []);
  }
  function cumulative(useWhatIf) { return gpaOf(allCourses(), useWhatIf); }

  /*@3.GPAJ.10*/
  function isPrep(code) { return PREP_RE.test(String(code || '')); }
  function levelOf(code) {
    if (isPrep(code)) return 0;
    var info = catalogMap[code];
    var m = info && /^L(\d+)$/.exec(String(info.level || ''));
    return m ? parseInt(m[1], 10) : null;
  }
  /*@3.GPAJ.11*/
  var LV_AR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
               'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
  function levelName(n) {
    if (n === 0) return L('السنة التحضيرية', 'Preparatory year');
    if (n === null || n === undefined) return L('مواد عامة', 'General courses');
    return isAr() ? ('المستوى ' + (LV_AR[n] || n)) : ('Level ' + n);
  }
  /*@3.GPAJ.12*/
  function termName(s, i) {
    if (s.renamed && s.name) return s.name;
    if (s.summer) return L('فصل صيفيّ' + (s.short ? ' ' + s.short : ''),
                           'Summer term' + (s.short ? ' ' + s.short : ''));
    if (s.level != null) return levelName(s.level);
    return s.name || L('فصل مخطّط ' + (i + 1), 'Planned term ' + (i + 1));
  }
  /*@3.GPAJ.13*/
  function archName(a) {
    if (!a) return '';
    var b = isAr() ? a.name_ar : a.name_en;
    if (b) return b;
    if (a.level != null) return levelName(a.level);
    return a.name || a.id;
  }
  /*@3.GPAJ.14*/
  function archiveRanks() {
    var list = (archive || []).filter(function (a) { return a && a.id; }).slice();
    list.sort(function (x, y) {
      return String(x.archived_at || '').localeCompare(String(y.archived_at || ''));
    });
    function fixed(a) {
      if (a.after != null && a.after !== '' && !isNaN(+a.after)) return +a.after + 0.5;
      if (!a.summer && a.level != null && a.level !== '' && !isNaN(+a.level)) return +a.level;
      return null;
    }
    var out = {}, i, r;
    for (i = 0; i < list.length; i++) out[list[i].id] = fixed(list[i]);
    for (r = null, i = 0; i < list.length; i++) {
      if (out[list[i].id] != null) { r = out[list[i].id]; continue; }
      if (r != null) out[list[i].id] = r + 0.5;
    }
    for (r = null, i = list.length - 1; i >= 0; i--) {
      if (out[list[i].id] != null) { r = out[list[i].id]; continue; }
      if (r != null) out[list[i].id] = r - 0.5;
    }
    return out;
  }

  function archivedByLevel() {
    /*@3.GPAJ.15*/
    /*@3.GPAJ.100*/
    var meta = {};
    (archive || []).forEach(function (a) { if (a && a.id) meta[a.id] = a; });
    var rank = archiveRanks();

    var buckets = {};
    gradesData.semesters.filter(function (s) { return !s.is_current; }).forEach(function (s) {
      var a = meta[s.id] || {};
      var own = !!meta[s.id] || !!a.summer || !!s.summer || a.level != null;
      if (own) {
        var key = 'sem:' + s.id;
        var lvA = (a.level != null && a.level !== '') ? +a.level : null;
        if (lvA !== null && isNaN(lvA)) lvA = null;
        buckets[key] = {
          lv: lvA,
          summer: !!(a.summer || s.summer),
          sort: (rank[s.id] != null) ? rank[s.id] : (lvA != null ? lvA : null),
          name: archName(a.id ? a : s) || semName(s),
          at: a.archived_at || '',
          courses: (s.courses || []).slice()
        };
        return;
      }
      (s.courses || []).forEach(function (c) {
        var lv = levelOf(c.code);
        var key = (lv === null) ? 'x' : String(lv);
        (buckets[key] = buckets[key] || { lv: lv, courses: [] }).courses.push(c);
      });
    });
    return buckets;
  }

  /*@3.GPAJ.101*/
  function readRecOrder() {
    try { var v = JSON.parse(localStorage.getItem(LS_REC_ORD) || 'null'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveRecOrder(a) {
    try { localStorage.setItem(LS_REC_ORD, JSON.stringify(a)); } catch (e) {}
  }
  /*@3.GPAJ.113*/
  function bucketRank(b) {
    if (b.sort != null) return b.sort;
    return b.lv == null ? 99 : b.lv;
  }
  function naturalOrder(buckets) {
    return Object.keys(buckets).sort(function (a, b) {
      var la = bucketRank(buckets[a]), lb = bucketRank(buckets[b]);
      if (la !== lb) return la - lb;
      return String(buckets[a].at || '').localeCompare(String(buckets[b].at || ''));
    });
  }
  /*@3.GPAJ.111*/
  function bucketOrder(buckets) {
    var base = naturalOrder(buckets);
    var rank = {}; readRecOrder().forEach(function (k, i) { rank[k] = i; });
    var slots = [], picked = [];
    base.forEach(function (k, i) { if (rank[k] !== undefined) { slots.push(i); picked.push(k); } });
    if (picked.length < 2) return base;
    picked.sort(function (a, b) { return rank[a] - rank[b]; });
    var out = base.slice();
    slots.forEach(function (pos, i) { out[pos] = picked[i]; });
    return out;
  }

  function bucketName(b) {
    if (b.name) return b.name;
    if (b.summer) return L('فصل صيفيّ', 'Summer term');
    return levelName(b.lv);
  }

  /*@3.GPAJ.16*/
  function currentSem() { return gradesData.semesters.find(function (s) { return s.is_current; }); }
  /*@3.GPAJ.17*/
  function semName(s) {
    if (!s) return '';
    if (s.summer) return L('فصل صيفيّ', 'Summer term');
    var b = isAr() ? s.name_ar : s.name_en;
    if (b) return b;
    if (s.level != null) return levelName(s.level);
    return s.name || '';
  }

  function render() {
    $$('[data-ar]').forEach(function (el) {
      var t = isAr() ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if (t) el.textContent = t;
    });
    $$('[data-ar-placeholder]').forEach(function (el) {
      var t = el.getAttribute('data-' + (isAr() ? 'ar' : 'en') + '-placeholder');
      if (t != null) el.placeholder = t;
    });

    var cur = currentSem();
    var has = allCourses().length > 0;
    $('#state-empty').hidden = has;
    $('#state-full').hidden = !has;
    if (!has) return;

    renderHero();
    renderRows(cur);
    renderRecord();
    renderPlan();
    renderChart();
    renderTarget();
    renderHonour();
  }

  function bandOf(g) {
    if (g >= 3.75) return { k: 'ok', ar: 'ممتاز مرتفع', en: 'Excellent (high)', i: 'fa-award' };
    if (g >= 3.50) return { k: 'ok', ar: 'ممتاز', en: 'Excellent', i: 'fa-award' };
    if (g >= 2.75) return { k: 'mid', ar: 'جيّد جداً', en: 'Very good', i: 'fa-circle-check' };
    if (g >= 2.00) return { k: 'warn', ar: 'جيّد', en: 'Good', i: 'fa-circle-exclamation' };
    return { k: 'danger', ar: 'تحت الحدّ', en: 'Below threshold', i: 'fa-triangle-exclamation' };
  }
  function ringDash(el, r, v) {
    /*@3.GPAJ.18*/
    var c = 2 * Math.PI * r;
    el.style.strokeDasharray = c;
    el.style.strokeDashoffset = c - Math.min(v / 4, 1) * c;
  }
  /*@3.GPAJ.19*/
  function arcPath(cx, cy, r, frac) {
    frac = Math.max(0, Math.min(1, frac));
    if (frac <= 0) return '';
    if (frac >= 1) frac = 0.9999;
    var a = frac * 2 * Math.PI;
    return 'M' + (cx + r) + ' ' + cy +
           'A' + r + ' ' + r + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' +
           (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
  }

  function renderHero() {
    var cum = cumulative(false);
    $('#cum-gpa').textContent = cum.toFixed(2);
    var arc = $('#ring-arc');
    ringDash(arc, 65, cum);
    /*@3.GPAJ.20*/
    arc.style.stroke = rampColor(cum);

    var on = Object.keys(whatIf).length > 0, ghost = $('#ring-ghost');
    ghost.style.display = on ? '' : 'none';
    if (on) {
      var wi = cumulative(true);
      ghost.setAttribute('d', arcPath(80, 80, 53, wi / 4));
      ghost.style.stroke = rampColor(wi);
    }
    /*@3.GPAJ.21*/
    var dl = $('#ring-wi');
    if (dl) {
      dl.hidden = !on;
      if (on) { dl.textContent = cumulative(true).toFixed(2); dl.style.color = rampColor(cumulative(true)); }
    }

    var b = bandOf(cum), badge = $('#cum-band');
    badge.setAttribute('data-band', b.k);
    badge.innerHTML = '<i class="fa-solid ' + b.i + '"></i><span>' + esc(L(b.ar, b.en)) + '</span>';

    var earned = 0, pts = 0, graded = 0, total = 0;
    allCourses().forEach(function (c) {
      total++;
      if (c.grade) { earned += c.credits; graded++; }
      if (c.grade && GPA_SCALE[c.grade] !== undefined) pts += GPA_SCALE[c.grade] * c.credits;
    });
    $('#m-credits').textContent = earned;
    var pc = progCredits();
    $('#m-credits-of').textContent = ' / ' + pc;
    $('#m-credits-bar').style.width = Math.min(earned / pc * 100, 100) + '%';
    /*@3.GPAJ.22*/
    $('#m-points').textContent = pts.toFixed(2);
    $('#m-points-of').textContent = ' / ' + (earned * 4).toFixed(0);
    /*@3.GPAJ.23*/
    $('#m-points-bar').style.width = Math.min(cum / 4 * 100, 100) + '%';
    $('#m-points-bar').style.background = rampColor(cum);
    $('#m-graded').textContent = graded;
    $('#m-graded-of').textContent = ' / ' + total;
    $('#m-graded-bar').style.width = (total ? graded / total * 100 : 0) + '%';
  }

  function tone(g) {
    if (!g || g === 'TR') return '';
    if (g === 'A+' || g === 'A') return 'ok';
    if (g === 'B+' || g === 'B') return 'mid';
    if (g === 'F') return 'danger';
    return 'warn';
  }
  /*@3.GPAJ.24*/
  function gradeWord(g) {
    var m = { 'A+': ['ممتاز مرتفع', 'Exceptional'], 'A': ['ممتاز', 'Excellent'],
              'B+': ['جيد جداً مرتفع', 'Superior'], 'B': ['جيد جداً', 'Very good'],
              'C+': ['جيد مرتفع', 'Above average'], 'C': ['جيد', 'Good'],
              'D+': ['مقبول مرتفع', 'High pass'], 'D': ['مقبول', 'Pass'],
              'F': ['راسب', 'Fail'], 'TR': ['معادَلة — بلا نقاط', 'Transferred — no points'],
              '': ['بلا تقدير بعد', 'Not graded yet'] };
    return m[g] ? L(m[g][0], m[g][1]) : '';
  }
  /*@3.GPAJ.25*/
  function pickBtn(kind, key, val, label, extra) {
    /*@3.GPAJ.26*/
    var isGrade = (kind !== 'plcr');
    return '<button type="button" class="gp-pick-btn' + (extra ? ' ' + extra : '') +
      (val ? ' is-set' : '') + '" data-menu="' + kind + '" data-key="' + esc(key) + '"' +
      ' data-tone="' + (isGrade ? tone(val) : '') + '" aria-haspopup="listbox"' +
      ' aria-label="' + esc(L('اختر', 'Choose')) + '">' +
      '<span>' + esc(label != null ? label : (val || '—')) + '</span>' +
      '<i class="fa-solid fa-chevron-down"></i></button>';
  }
  /*@3.GPAJ.27*/
  function normQ(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/\s+/g, ' ').trim();
  }

  /*@3.GPAJ.28*/
  var menuKey = null;
  function closeMenu() {
    if (menuKey) { document.removeEventListener('keydown', menuKey, true); menuKey = null; }
    var m = $('#gp-menu'); if (m) m.remove();
  }
  /*@3.GPAJ.29*/
  function openMenu(btn, items, onPick, opts) {
    closeMenu();
    opts = opts || {};
    var m = document.createElement('div');
    m.id = 'gp-menu';
    m.className = 'gp-menu' + (opts.search ? ' gp-menu--search' : '') + (opts.wide ? ' gp-menu--wide' : '');
    /*@3.GPAJ.30*/
    var sheet = !!opts.search && window.innerWidth <= 640;
    if (sheet) m.classList.add('gp-menu--sheet');
    m.innerHTML =
      (opts.search ? '<div class="gp-menu-head"><i class="fa-solid fa-magnifying-glass"></i>' +
        '<input type="text" class="gp-menu-q" id="gp-menu-q" autocomplete="off" spellcheck="false"' +
        ' placeholder="' + esc(opts.search === true ? L('ابحث…', 'Search…') : opts.search) + '"' +
        ' aria-label="' + esc(L('ابحث', 'Search')) + '"></div>' : '') +
      '<div class="gp-menu-list" role="listbox"></div>';
    document.body.appendChild(m);

    var list = $('.gp-menu-list', m), shown = items, ai = -1;
    function hay(it) { return it._h || (it._h = normQ(it.k + ' ' + (it.d || ''))); }
    function draw() {
      if (!shown.length) {
        list.innerHTML = '<div class="gp-menu-none">' + esc(L('لا نتائج', 'No results')) + '</div>';
        ai = -1; return;
      }
      list.innerHTML = shown.map(function (it, i) {
        return '<button type="button" class="gp-menu-opt' + (it.on ? ' is-on' : '') +
          '" data-v="' + esc(it.v) + '" data-i="' + i + '" data-tone="' + esc(it.tone || '') + '"' +
          ' role="option" aria-selected="' + !!it.on + '">' +
          '<b>' + esc(it.k) + '</b>' + (it.d ? '<span>' + esc(it.d) + '</span>' : '') + '</button>';
      }).join('');
      var sel = shown.findIndex ? shown.findIndex(function (it) { return it.on; }) : -1;
      setActive(sel > -1 ? sel : 0, false);
    }
    function setActive(i, scroll) {
      var opt = $$('.gp-menu-opt', list);
      if (!opt.length) { ai = -1; return; }
      ai = Math.max(0, Math.min(opt.length - 1, i));
      opt.forEach(function (o, k) { o.classList.toggle('is-active', k === ai); });
      if (scroll !== false) opt[ai].scrollIntoView({ block: 'nearest' });
    }
    function pick(v) { closeMenu(); onPick(v); }
    draw();

    if (!sheet) {
      /*@3.GPAJ.31*/
      var r = btn.getBoundingClientRect(), pw = m.offsetWidth, ph = m.offsetHeight;
      var top = r.bottom + 6;
      if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
      m.style.top = top + 'px';
      m.style.left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8) + 'px';
    }

    m.addEventListener('click', function (e) {
      var o = e.target.closest('[data-v]'); if (!o) return;
      pick(o.getAttribute('data-v'));
    });
    var q = $('.gp-menu-q', m);
    menuKey = function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeMenu(); btn.focus(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(ai + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(ai - 1); return; }
      /*@3.GPAJ.32*/
      if ((e.key === 'Home' || e.key === 'End') && document.activeElement !== q) {
        e.preventDefault(); setActive(e.key === 'Home' ? 0 : 1e9); return;
      }
      if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        var cur = $$('.gp-menu-opt', list)[ai];
        if (cur) pick(cur.getAttribute('data-v'));
      }
    };
    document.addEventListener('keydown', menuKey, true);
    if (q) {
      q.addEventListener('input', function () {
        var terms = normQ(q.value).split(' ').filter(Boolean);
        shown = !terms.length ? items : items.filter(function (it) {
          var h = hay(it);
          return terms.every(function (t) { return h.indexOf(t) > -1; });
        });
        draw();
      });
      setTimeout(function () { q.focus(); }, 20);
    }
  }
  function gradeItems(cur, withEmpty, emptyLabel) {
    return (withEmpty ? GRADE_OPTIONS : GRADE_OPTIONS.filter(Boolean)).map(function (g) {
      return { v: g, k: g || (emptyLabel || '—'), d: gradeWord(g), tone: tone(g), on: (cur || '') === g };
    });
  }

  function renderRows(cur) {
    var host = $('#rows');
    $$('.gp-row', host).forEach(function (n) { n.remove(); });
    $('#cur-title').textContent = semName(cur) || L('الفصل الحالي', 'Current semester');

    var tCr = 0, tPts = 0, anyUngraded = false;
    ((cur && cur.courses) || []).forEach(function (c) {
      tCr += c.credits;
      var hasPts = c.grade && GPA_SCALE[c.grade] !== undefined;
      if (hasPts) tPts += GPA_SCALE[c.grade] * c.credits;
      if (!c.grade) anyUngraded = true;

      var name = isAr() ? c.name_ar : c.name_en;
      var pts = hasPts ? (GPA_SCALE[c.grade] * c.credits).toFixed(2) : '—';
      var tip = c.grade === 'TR' ? L('مادة معادَلة — ساعاتٌ مكتسبةٌ بلا نقاط', 'Transferred — credits earned, no points')
              : !c.grade ? L('بلا تقدير بعد', 'Not graded yet') : '';

      var cell = '<div class="gp-grade' + (c.grade ? '' : ' has-wi') + '">' +
        '<span class="gp-dot" data-tone="' + tone(c.grade) + '"></span>' +
        pickBtn('cur', c.code, c.grade || '', c.grade || '—');
      if (!c.grade) {
        var wi = whatIf[c.code] || '';
        /*@3.GPAJ.33*/
        cell += pickBtn('wi', c.code, wi, wi || L('لو…', 'If…'), 'gp-pick-btn--wi');
      }
      cell += '</div>';

      var row = document.createElement('div');
      row.className = 'gp-row' + (c.grade ? '' : ' is-ungraded');
      row.innerHTML =
        '<span class="gp-code">' + esc(c.code) + '</span>' +
        '<span class="gp-row-name" title="' + esc(name) + '">' + esc(name) + '</span>' +
        '<span class="gp-row-cr">' + c.credits + '</span>' + cell +
        '<span class="gp-row-pts"' + (hasPts ? '' : ' data-tone="muted"') +
          (tip ? ' title="' + esc(tip) + '"' : '') + '>' + esc(pts) + '</span>' +
        '<button class="gp-ico gp-ico--danger" data-del="' + esc(c.code) + '" aria-label="' +
          esc(L('حذف ' + name, 'Remove ' + name)) + '"><i class="fa-solid fa-trash-can"></i></button>';
      host.appendChild(row);
    });

    $('#t-credits').textContent = tCr;
    $('#t-points').textContent = tPts.toFixed(2);
    var sg = gpaOf((cur && cur.courses) || [], false);
    $('#sem-gpa').textContent = sg > 0 ? sg.toFixed(2) : '—';

    var strip = $('#wi-strip');
    strip.hidden = !anyUngraded;
    if (anyUngraded) {
      var set = Object.keys(whatIf).length > 0, v = $('#wi-gpa');
      var wiv = set ? cumulative(true) : 0;
      v.textContent = set ? wiv.toFixed(2) : '—';
      v.setAttribute('data-empty', set ? '0' : '1');
      /*@3.GPAJ.34*/
      v.style.color = set ? rampColor(wiv) : '';
      /*@3.GPAJ.35*/
      var dl = $('#wi-delta');
      if (dl) {
        var diff = wiv - cumulative(false);
        dl.hidden = !set;
        if (set) {
          dl.textContent = (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(2);
          dl.style.color = rampColor(wiv);
        }
      }
    }
  }

  function gpaTone(g) { return g >= 3.75 ? 'ok' : g >= 3.25 ? '' : 'warn'; }

  function renderRecord() {
    var buckets = archivedByLevel();
    var keys = Object.keys(buckets);
    var html = '';

    if (!keys.length) {
      html += '<div class="gp-recall">' +
        '<i class="fa-solid fa-wand-magic-sparkles gp-recall-ico"></i>' +
        '<div class="gp-recall-txt"><b>' + esc(L('درست قبل اليوم؟', 'Studied before today?')) + '</b>' +
          esc(L('المعالج يعرض مواد كل مستوى — أشِّر ما أتممته وضع تقديره، فيُحسب معدّل المستوى ويظهر هنا.',
                'The wizard lists each level\'s courses — tick what you completed and set its grade; the level GPA appears here.')) +
        '</div>' +
        '<button class="gp-btn gp-btn--primary gp-btn--sm" data-act="wizard">' +
          '<i class="fa-solid fa-wand-magic-sparkles"></i><span>' + esc(L('افتح المعالج', 'Open wizard')) + '</span></button>' +
      '</div>';
    }

    /*@3.GPAJ.104*/
    var order = bucketOrder(buckets), lastB = order.length - 1;
    if (order.length > 1) {
      html += '<p class="gp-rec-lead">' + esc(L(
        'رتّبْ سجلَّك كما وقع فعلاً — بالسهمين. والمعدّلُ لا يتغيّر بالترتيب، لكنّ المنحنى والتسلسلَ يتبعانه.',
        'Order your record the way it actually happened — with the arrows. The GPA does not change; the curve and the sequence follow it.')) + '</p>';
    }
    order.forEach(function (key, bi) {
      var b = buckets[key]; if (!b) return;
      var g = gpaOf(b.courses, false);
      var cr = b.courses.reduce(function (a, c) { return a + c.credits; }, 0);
      var isPrepBlock = (b.lv === 0);
      var trCr = b.courses.filter(function (c) { return c.grade === 'TR'; })
                          .reduce(function (a, c) { return a + c.credits; }, 0);

      /*@3.GPAJ.36*/
      html += '<div class="gp-acc"><div class="gp-acc-top">' +
        '<button class="gp-acc-head" type="button" aria-expanded="false">' +
          '<span>' + esc(bucketName(b)) + '</span>' +
          '<span class="gp-acc-sum">' + b.courses.length + esc(L(' مواد · ', ' courses · ')) +
            '<span class="gp-num">' + cr + '</span>' + esc(L(' ساعة', ' cr')) + '</span>' +
          '<span class="gp-acc-gpa" data-tone="' + gpaTone(g) + '">' + g.toFixed(2) + '</span>' +
          '<i class="fa-solid fa-chevron-down gp-acc-caret"></i>' +
        '</button>' +
        (order.length > 1 ? '<span class="gp-acc-ord">' +
          '<button class="gp-ico" data-rec-mv="' + esc(key) + ',-1"' + (bi === 0 ? ' disabled' : '') +
            ' aria-label="' + esc(L('قدّم ' + bucketName(b), 'Move ' + bucketName(b) + ' earlier')) +
            '"><i class="fa-solid fa-arrow-up"></i></button>' +
          '<button class="gp-ico" data-rec-mv="' + esc(key) + ',1"' + (bi === lastB ? ' disabled' : '') +
            ' aria-label="' + esc(L('أخّر ' + bucketName(b), 'Move ' + bucketName(b) + ' later')) +
            '"><i class="fa-solid fa-arrow-down"></i></button>' +
        '</span>' : '') +
        '</div><div class="gp-acc-body">' +
        b.courses.map(function (c) {
          var isTR = c.grade === 'TR';
          return '<div class="gp-rec-row' + (isTR ? ' is-tr' : '') + '">' +
            '<span class="gp-code">' + esc(c.code) + '</span>' +
            '<span class="gp-rec-name">' + esc(isAr() ? c.name_ar : c.name_en) + '</span>' +
            '<span class="gp-row-cr">' + c.credits + '</span>' +
            /*@3.GPAJ.37*/
            pickBtn('rec', c.code, c.grade || '', c.grade || '—', 'gp-rec-g') + '</div>';
        }).join('') +
        (isPrepBlock && trCr ? '<p class="gp-acc-empty">' + esc(L(
            'الإنجليزيُّ يُسجَّل TR: ' + crWord(trCr) + ' مكتسبةٌ بلا نقاط، فلا تدخل المعدل.',
            'English is recorded as TR: ' + crWord(trCr) + ' earned without points, so they never enter the GPA.')) + '</p>' : '') +
        '</div></div>';
    });

    /*@3.GPAJ.38*/
    var editable = (archive || []).filter(function (a) { return a && a.id; });
    /*@3.GPAJ.119*/
    if (window.GardenSetup && GardenSetup.openArchive) {
      html += '<div class="gp-rec-edit"><span class="gp-eyebrow">' +
        esc(L('فصولُك المؤرشفة', 'Your archived terms')) + '</span>' +
        '<button class="gp-btn gp-btn--primary gp-btn--sm" data-act="archwiz">' +
          '<i class="fa-solid fa-wand-magic-sparkles"></i><span>' +
          esc(L('افتح معالج الفصول المؤرشفة', 'Open the archived-terms wizard')) + '</span></button>' +
        '<span class="gp-hint-inline">' + esc(L(
          'ترتيبٌ وسحبُ موادَّ بين الفصول ومستوًى واسمٌ وتقدير — بمفردات معالج الفصول المخطّطة نفسِها.',
          'Reorder, drag courses between terms, set level, name and grade — in the same vocabulary as the planner.')) + '</span>' +
      '</div>';
    }
    if (editable.length) {
      html += '<div class="gp-rec-edit"><span class="gp-eyebrow">' +
        esc(L('تعديل سجلٍّ واحد', 'Edit a single record')) + '</span>' +
        editable.map(function (a) {
          return '<button class="gp-btn gp-btn--sm" data-edit="' + esc(a.id) + '">' +
            '<i class="fa-solid fa-pen"></i><span>' + esc(archName(a)) + '</span></button>';
        }).join('') + '</div>';
    }

    $('#record').innerHTML = html;
  }

  /*@3.GPAJ.39*/
  function renderHonour() {
    var all = allCourses();
    var failed = all.filter(function (c) { return c.grade === 'F'; });
    var now = cumulative(false);
    var s = seriesData(), end = s.length ? s[s.length - 1].gpa : now;
    var disq = failed.length > 0;
    var codes = failed.map(function (c) { return c.code; }).join(isAr() ? '، ' : ', ');

    $('#hon-basis').textContent = L('الآن ' + now.toFixed(2) + ' · متوقّع ' + end.toFixed(2),
                                    'now ' + now.toFixed(2) + ' · forecast ' + end.toFixed(2));

    var tiers = [
      { k: 1, ar: 'مرتبة الشرف الأولى', en: 'First honours', lo: 3.75, hi: 4.001 },
      { k: 2, ar: 'مرتبة الشرف الثانية', en: 'Second honours', lo: 3.25, hi: 3.75 }
    ];
    $('#honor').innerHTML = tiers.map(function (t) {
      var inNow = now >= t.lo && now < t.hi, inEnd = end >= t.lo && end < t.hi;
      var state, icon, txt, note;
      if (disq) {
        state = 'lost'; icon = 'fa-circle-xmark'; txt = L('غير مستحقّة', 'Not eligible');
        note = L('رسوبٌ في ' + codes + ' — والشرطُ ألّا يرسب الطالب في أيِّ مقرّرٍ درسه.',
                 'A fail in ' + codes + ' — eligibility requires no failed course at all.');
      } else if (inNow) {
        state = 'now'; icon = 'fa-circle-check'; txt = L('أنت فيها الآن', 'You are in it now');
        note = inEnd ? L('وتوقّعك يبقيك فيها.', 'And your forecast keeps you there.')
                     : L('لكنّ توقّعك يخرجك منها.', 'But your forecast drops you out of it.');
      } else if (inEnd) {
        state = 'reach'; icon = 'fa-arrow-trend-up'; txt = L('في المتناول', 'Within reach');
        note = L('توقّعك ' + end.toFixed(2) + ' يبلغها.', 'Your forecast of ' + end.toFixed(2) + ' reaches it.');
      } else if (end < t.lo) {
        state = 'reach'; icon = 'fa-arrow-trend-up';
        var gap = (t.lo - end).toFixed(2);
        txt = L('يفصلك ' + gap, gap + ' away');
        note = L('ارفع توقّعك ' + gap + ' نقطةً لتبلغها.', 'Raise your forecast by ' + gap + ' to reach it.');
      } else {
        state = 'lost'; icon = 'fa-circle-minus'; txt = L('تجاوزتها', 'Above it');
        note = L('معدّلك فوق نطاقها — انظر المرتبة الأعلى.', 'Your GPA is above this range.');
      }
      return '<div class="gp-hon" data-state="' + state + '">' +
        '<div class="gp-hon-head"><span class="gp-hon-name">' + esc(L(t.ar, t.en)) + '</span>' +
        '<span class="gp-hon-range">' + t.lo.toFixed(2) + ' – ' + (t.k === 1 ? '4.00' : '3.74') + '</span></div>' +
        '<div class="gp-hon-state"><i class="fa-solid ' + icon + '"></i><span>' + esc(txt) + '</span></div>' +
        '<div class="gp-hon-note">' + esc(note) + '</div></div>';
    }).join('');

    $('#hon-cond').innerHTML = [
      { ok: disq ? '0' : '1', ar: 'ألّا ترسب في أيِّ مقرّرٍ درسته هنا أو في جامعةٍ أخرى',
        en: 'No failed course here or at any other university',
        extra: disq ? L(' — رسوبٌ في ' + codes, ' — failed: ' + codes) : '' },
      { ok: '?', ar: 'أن تنهي متطلبات التخرّج خلال متوسط المدّة بين الحدّ الأدنى والأقصى للبقاء في الكلية',
        en: 'Finish within the average of the minimum and maximum residence period', extra: '' },
      { ok: '?', ar: 'أن تدرس في الجامعة السعودية الإلكترونية ما لا يقلّ عن ٦٠٪ من متطلبات التخرّج',
        en: 'Study at least 60% of graduation requirements at SEU', extra: '' }
    ].map(function (c) {
      var ic = c.ok === '1' ? 'fa-circle-check' : c.ok === '0' ? 'fa-circle-xmark' : 'fa-circle-question';
      return '<li data-ok="' + c.ok + '"><i class="fa-solid ' + ic + '"></i><span>' +
             esc(L(c.ar, c.en) + c.extra) + '</span></li>';
    }).join('');
  }

  /*@3.GPAJ.40*/
  function plan() {
    return (window.GardenData && GardenData.gpaPlan) ? GardenData.gpaPlan() : { semesters: [] };
  }
  function savePlan(p) {
    if (window.GardenData && GardenData.saveGpaPlan) GardenData.saveGpaPlan(p);
  }
  /*@3.GPAJ.112*/
  function seriesData() {
    var out = [], pts = 0, cr = 0;
    /*@3.GPAJ.41*/
    var buckets = archivedByLevel();
    var steps = bucketOrder(buckets).map(function (k) {
      return { label: bucketName(buckets[k]), courses: buckets[k].courses || [], live: false };
    });
    gradesData.semesters.filter(function (s) { return s.is_current; }).forEach(function (s) {
      steps.push({ label: semName(s), courses: s.courses || [], live: true });
    });
    steps.forEach(function (st) {
      var sp = 0, sc = 0;
      st.courses.forEach(function (c) {
        var g = c.grade || (st.live ? whatIf[c.code] : null);
        if (g && GPA_SCALE[g] !== undefined) { sp += GPA_SCALE[g] * c.credits; sc += c.credits; }
      });
      if (!sc) return;
      pts += sp; cr += sc;
      out.push({ label: st.label, gpa: pts / cr, plan: false });
    });
    plan().semesters.forEach(function (s, si) {
      (s.courses || []).forEach(function (c) {
        var g = scenario || c.grade;
        if (g && GPA_SCALE[g] !== undefined) { pts += GPA_SCALE[g] * (c.credits || 3); cr += (c.credits || 3); }
      });
      out.push({ label: termName(s, si), gpa: cr ? pts / cr : 0, plan: true, summer: !!s.summer });
    });
    return out;
  }
  function recordedCount() {
    return seriesData().filter(function (p) { return !p.plan; }).length;
  }

  /*@3.GPAJ.42*/
  function capOf(s, isLast) {
    return s && s.summer ? (isLast ? 12 : 9) : (isLast ? 21 : 18);
  }
  /*@3.GPAJ.43*/
  function scriptDir(s) { return /[؀-ۿ]/.test(String(s || '')) ? 'rtl' : 'ltr'; }

  /*@3.GPAJ.44*/
  function termDir(s) {
    var names = (s.courses || []).map(function (c) { return String(c.name || ''); });
    if (!names.length) return isAr() ? 'rtl' : 'ltr';
    var ar = names.filter(function (t) { return /[؀-ۿ]/.test(t); }).length;
    return (ar / names.length >= 0.5) ? 'rtl' : 'ltr';
  }
  var MIN_REG_CR = 11;                 /*@3.GPAJ.45*/

  /*@3.GPAJ.46*/
  var _planOpen = {}, _planFocus = null;
  function readPlanOpen() {
    var st = {};
    $$('#plan-list .gp-sem').forEach(function (el, i) {
      st[i] = !el.classList.contains('is-folded');
    });
    return st;
  }
  function renderPlan(keepOpen) {
    if (keepOpen !== false) {
      var live = readPlanOpen();
      if (Object.keys(live).length) _planOpen = live;
    }
    if (_planFocus !== null) { _planOpen = {}; _planOpen[_planFocus] = true; _planFocus = null; }
    var p = plan(), last = p.semesters.length - 1;
    $('#plan-list').innerHTML = p.semesters.map(function (s, si) {
      var openNow = !!_planOpen[si];
      var cr = (s.courses || []).reduce(function (a, c) { return a + (c.credits || 3); }, 0);
      var cap = capOf(s, si === last), over = cr > cap;
      var thin = !s.summer && cr > 0 && cr < MIN_REG_CR;
      var n = (s.courses || []).length, tdir = termDir(s);
      /*@3.GPAJ.47*/
      return '<div class="gp-sem' + (openNow ? '' : ' is-folded') + (s.summer ? ' is-summer' : '') + '" data-sem-i="' + si + '">' +
        /*@3.GPAJ.48*/
        '<div class="gp-sem-head" data-sem-toggle="' + si + '">' +
          '<button class="gp-sem-fold" data-sem-fold="' + si + '" aria-expanded="' + openNow + '" aria-label="' +
            esc(L('فتح الفصل', 'Open term')) + '"><i class="fa-solid fa-chevron-down"></i></button>' +
          (s.summer ? '<i class="fa-solid fa-sun gp-sem-sun" title="' + esc(L('فصل صيفيّ', 'Summer term')) + '"></i>' : '') +
          '<input class="gp-sem-name gp-mq" data-sem="' + si + '" value="' + esc(termName(s, si)) +
            '" placeholder="' + esc(L('اسم الفصل', 'Term name')) + '" aria-label="' + esc(L('اسم الفصل', 'Term name')) + '">' +
          '<span class="gp-sem-gpa' + (over ? ' is-over' : '') + '" title="' +
            esc(L('السقف ' + cap + ' ساعة' + (si === last ? ' (فصل التخرّج)' : ''),
                  'Cap ' + cap + ' credits' + (si === last ? ' (final term)' : ''))) + '">' +
            /*@3.GPAJ.49*/
            '<span class="gp-num">' + cr + '/' + cap + '</span>' +
            esc(L(' ساعة · ', ' cr · ')) + '<span class="gp-num">' + n + '</span>' + esc(L(' مواد', '')) +
          '</span>' +
          /*@3.GPAJ.50*/
          '<button class="gp-ico gp-sem-mv" data-sem-mv="' + si + ',-1"' +
            (si === 0 ? ' disabled' : '') + ' title="' + esc(L('قدّمه', 'Move earlier')) +
            '" aria-label="' + esc(L('قدّم ' + termName(s, si), 'Move ' + termName(s, si) + ' earlier')) +
            '"><i class="fa-solid fa-arrow-up"></i></button>' +
          '<button class="gp-ico gp-sem-mv" data-sem-mv="' + si + ',1"' +
            (si === last ? ' disabled' : '') + ' title="' + esc(L('أخّره', 'Move later')) +
            '" aria-label="' + esc(L('أخّر ' + termName(s, si), 'Move ' + termName(s, si) + ' later')) +
            '"><i class="fa-solid fa-arrow-down"></i></button>' +
          '<button class="gp-ico gp-ico--danger" data-del-sem="' + si + '" aria-label="' + esc(L('حذف الفصل', 'Delete term')) + '"><i class="fa-solid fa-trash-can"></i></button>' +
        '</div>' +
        '<div class="gp-sem-body" dir="' + tdir + '">' +
        (over ? '<p class="gp-sem-warn"><i class="fa-solid fa-triangle-exclamation"></i>' +
          esc(L('تجاوزتَ سقفَ الفصل: ' + cr + ' ساعةً والسقف ' + cap + '. لك أن تُبقيه إن كنت تعرف حالتك، أو تُقدّم مادةً/تؤخّرها بالسهمين.',
                'Over the term cap: ' + cr + ' credits against ' + cap + '. Keep it if you know your case, or shift a course with the arrows.')) + '</p>' : '') +
        /*@3.GPAJ.51*/
        (thin ? '<p class="gp-sem-warn is-soft"><i class="fa-solid fa-circle-info"></i>' +
          esc(L('دون الحدّ الأدنى للمستوى: ' + cr + ' ساعةً والحدّ ' + MIN_REG_CR + '.',
                'Below the level minimum: ' + cr + ' credits against ' + MIN_REG_CR + '.')) + '</p>' : '') +
        (s.courses || []).map(function (c, ci) {
          return '<div class="gp-pl-row">' +
            /*@3.GPAJ.52*/
            '<span class="gp-code">' + esc(c.code || '') + '</span>' +
            '<input class="gp-inp gp-mq" data-pl-name="' + si + ',' + ci + '" value="' + esc(c.name || '') +
              '" placeholder="' + esc(L('اسم المادة', 'Course name')) + '" aria-label="' + esc(L('اسم المادة', 'Course name')) + '">' +
            pickBtn('plcr', si + ',' + ci, String(c.credits || 3), String(c.credits || 3), 'gp-pick-btn--cr') +
            pickBtn('plg', si + ',' + ci, (scenario || c.grade || ''), (scenario || c.grade || '—'),
                    scenario ? 'is-locked' : '') +
            /*@3.GPAJ.53*/
            '<button class="gp-ico" data-pl-move="' + si + ',' + ci + ',-1"' + (si === 0 ? ' disabled' : '') +
              ' title="' + esc(L('قدّمها للفصل السابق', 'Pull to previous term')) +
              '" aria-label="' + esc(L('قدّم ' + (c.name || ''), 'Pull ' + (c.name || ''))) + '"><i class="fa-solid fa-angles-up"></i></button>' +
            '<button class="gp-ico" data-pl-move="' + si + ',' + ci + ',1"' + (si === last ? ' disabled' : '') +
              ' title="' + esc(L('أجّلها للفصل التالي', 'Defer to next term')) +
              '" aria-label="' + esc(L('أجّل ' + (c.name || ''), 'Defer ' + (c.name || ''))) + '"><i class="fa-solid fa-angles-down"></i></button>' +
            '<button class="gp-ico gp-ico--danger" data-del-pl="' + si + ',' + ci + '" aria-label="' + esc(L('حذف', 'Delete')) + '"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>';
        }).join('') +
        '<button class="gp-cta" data-add-pl="' + si + '"><i class="fa-solid fa-plus"></i><span>' +
          esc(L('مادة مخطّطة', 'Planned course')) + '</span></button>' +
        '</div>' +
      '</div>';
    }).join('') || ('<p class="gp-acc-empty">' + esc(L(
        'لا فصول مخطّطة بعد — أضف فصلاً وقدّر درجاته لترى مسارك حتى التخرّج.',
        'No planned terms yet — add one and estimate its grades to see your path to graduation.')) + '</p>');
    /*@3.GPAJ.54*/
    syncMarquee();
  }


  /*@3.GPAJ.55*/
  function predictFromRecord() {
    var pts = 0, cr = 0, recent = [];
    var sems = gradesData.semesters.slice();
    sems.forEach(function (sm) {
      (sm.courses || []).forEach(function (c) {
        if (c.grade && GPA_SCALE[c.grade] !== undefined) {
          pts += GPA_SCALE[c.grade] * c.credits; cr += c.credits;
          recent.push(GPA_SCALE[c.grade]);
        }
      });
    });
    if (!cr) { toast(L('لا سجلَّ بعدُ نتوقّع منه', 'No record to predict from yet')); return; }

    var avg = pts / cr;
    /*@3.GPAJ.56*/
    var tail = recent.slice(-8);
    if (tail.length) {
      var tAvg = tail.reduce(function (a, b) { return a + b; }, 0) / tail.length;
      avg = avg * 0.6 + tAvg * 0.4;
    }
    var scale = Object.keys(GPA_SCALE).sort(function (a, b) { return GPA_SCALE[b] - GPA_SCALE[a]; });
    function near(v) {
      var best = scale[0], bd = Infinity;
      scale.forEach(function (g) { var d = Math.abs(GPA_SCALE[g] - v); if (d < bd) { bd = d; best = g; } });
      return best;
    }
    /*@3.GPAJ.57*/
    var sd = 0;
    if (recent.length > 1) {
      var m = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      sd = Math.sqrt(recent.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / recent.length);
    }
    var pl = plan(), i = 0;
    pl.semesters.forEach(function (sm) {
      (sm.courses || []).forEach(function (c) {
        var wobble = sd ? ((i % 3) - 1) * Math.min(sd, 0.5) : 0;   /*@3.GPAJ.58*/
        c.grade = near(Math.max(0, Math.min(4, avg + wobble)));
        i++;
      });
    });
    savePlan(pl);
    scenario = '';
    $$('[data-scen]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-scen') === ''); });
    renderPlan(); renderChart(); renderTarget(); renderHonour();
    toast(L('مُلئت الخطة على أداء ' + avg.toFixed(2), 'Filled from your ' + avg.toFixed(2) + ' performance'));
  }

  /*@3.GPAJ.59*/
  var MQ_WPM = 70, MQ_HOLD_START = 3.0, MQ_HOLD_END = .7;
  var MQ_V_MIN = 30, MQ_V_MAX = 85, MQ_PX_PER_WORD = 44;
  var _ruler = null;
  /*@3.GPAJ.60*/
  function textWidth(el) {
    if (!_ruler) {
      _ruler = document.createElement('span');
      _ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;top:-9999px;left:-9999px';
      document.body.appendChild(_ruler);
    }
    var cs = getComputedStyle(el);
    _ruler.style.font = cs.font || (cs.fontWeight + ' ' + cs.fontSize + '/' + cs.lineHeight + ' ' + cs.fontFamily);
    _ruler.style.letterSpacing = cs.letterSpacing;
    _ruler.textContent = (el.value !== undefined ? el.value : el.textContent) || '';
    return _ruler.getBoundingClientRect().width;
  }
  function syncMarquee() {
    var host = $('#plan-list'); if (!host) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var list = [];
    $$('.gp-mq', host).forEach(function (t) {
      t.classList.remove('is-mq');
      t.style.removeProperty('--mq-x'); t.style.removeProperty('--mq-dur');
      if (reduce || t === document.activeElement) return;    /*@3.GPAJ.61*/
      var box = t.clientWidth - (parseFloat(getComputedStyle(t).paddingInlineStart) || 0)
                              - (parseFloat(getComputedStyle(t).paddingInlineEnd) || 0);
      if (box <= 0) return;                                  /*@3.GPAJ.62*/
      var w = textWidth(t), over = w - box;
      if (over <= 2) return;
      var str = (t.value !== undefined ? t.value : t.textContent || '').trim();
      list.push({ t: t, over: over, w: w, words: str ? str.split(/\s+/).length : 0 });
    });
    if (!list.length) return;
    var maxOver = 0, px = 0, words = 0;
    list.forEach(function (o) { if (o.over > maxOver) maxOver = o.over; px += o.w; words += o.words; });
    /*@3.GPAJ.63*/
    var v = Math.max(MQ_V_MIN, Math.min(MQ_V_MAX, MQ_WPM / 60 * (words ? px / words : MQ_PX_PER_WORD)));
    var travel = maxOver / v, dur = MQ_HOLD_START + travel + MQ_HOLD_END;
    /*@3.GPAJ.64*/
    var st = document.getElementById('gp-mq-kf');
    if (!st) { st = document.createElement('style'); st.id = 'gp-mq-kf'; document.head.appendChild(st); }
    var css = '@keyframes gpMarquee{0%,' + (MQ_HOLD_START / dur * 100).toFixed(2) +
              '%{text-indent:0}' + ((MQ_HOLD_START + travel) / dur * 100).toFixed(2) +
              '%,100%{text-indent:var(--mq-x,0)}}';
    if (st.textContent !== css) st.textContent = css;
    list.forEach(function (o) {
      /*@3.GPAJ.65*/
      o.t.style.setProperty('--mq-x', (-o.over) + 'px');
      o.t.style.setProperty('--mq-dur', dur.toFixed(2) + 's');
      o.t.classList.add('is-mq');
    });
  }

  function renderTarget() {
    var want = parseFloat($('#target-inp').value) || 0;
    var s = seriesData(), end = s.length ? s[s.length - 1].gpa : 0;
    var box = $('#target-out');

    var curPts = 0, curCr = 0;
    allCourses().forEach(function (c) {
      if (c.grade && GPA_SCALE[c.grade] !== undefined) { curPts += GPA_SCALE[c.grade] * c.credits; curCr += c.credits; }
    });
    var planCr = 0;
    plan().semesters.forEach(function (sm) {
      (sm.courses || []).forEach(function (c) { planCr += (c.credits || 3); });
    });

    if (!planCr) {
      box.setAttribute('data-kind', '');
      box.innerHTML = '<i class="fa-solid fa-circle-info"></i><div>' +
        esc(L('أضف فصلاً مخطّطاً بمواده لنحسب ما تحتاجه.', 'Add a planned term with its courses so we can compute what you need.')) + '</div>';
      return;
    }
    var need = (want * (curCr + planCr) - curPts) / planCr;
    var kind, icon, html;
    if (need <= 0) {
      kind = 'ok'; icon = 'fa-circle-check';
      html = L('هدفك <b>' + want.toFixed(2) + '</b> مضمونٌ بما سجّلته فعلاً.',
               'Your target <b>' + want.toFixed(2) + '</b> is already secured by what you have recorded.');
    } else if (need <= 4.001) {
      kind = need > 3.75 ? '' : 'ok'; icon = need > 3.75 ? 'fa-circle-exclamation' : 'fa-circle-check';
      html = L('لتتخرّج بمعدل <b>' + want.toFixed(2) + '</b> تحتاج معدّلاً قدره <b>' + need.toFixed(2) +
                 '</b> في الساعات الـ' + planCr + ' الباقية. توقّعك الحالي <b>' + end.toFixed(2) + '</b>.',
               'To graduate with <b>' + want.toFixed(2) + '</b> you need <b>' + need.toFixed(2) +
                 '</b> across the remaining ' + planCr + ' credits. Your current forecast is <b>' + end.toFixed(2) + '</b>.');
    } else {
      kind = 'bad'; icon = 'fa-triangle-exclamation';
      html = L('هدف <b>' + want.toFixed(2) + '</b> لا يُبلَغ بالساعات المخطّطة (' + planCr +
                 ') — يلزمه <b>' + need.toFixed(2) + '</b> وهو فوق 4.00. أضف فصلاً مخطّطاً أو اخفض الهدف.',
               'A target of <b>' + want.toFixed(2) + '</b> is unreachable within ' + planCr +
                 ' planned credits — it needs <b>' + need.toFixed(2) + '</b>, above 4.00.');
    }
    box.setAttribute('data-kind', kind);
    box.innerHTML = '<i class="fa-solid ' + icon + '"></i><div>' + html + '</div>';
  }

  /*@3.GPAJ.66*/
  function rampColor(v) {
    return (window.GardenData && GardenData.qualityColor)
      ? GardenData.qualityColor(v)
      : 'var(--text-muted)';
  }

  function smoothPath(pts) {
    if (pts.length < 2) return pts.length ? 'M' + pts[0].x + ' ' + pts[0].y : '';
    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1), k = 0.9 / 6;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      d += 'C' + (p1.x + (p2.x - p0.x) * k).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) * k).toFixed(1) +
           ' ' + (p2.x - (p3.x - p1.x) * k).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) * k).toFixed(1) +
           ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }
  /*@3.GPAJ.67*/
  function shortLabel(p) {
    var s = (p && p.label !== undefined) ? p.label : p;
    if (p && p.summer) return L('صيفي', 'Sum');
    if (s === 'السنة التحضيرية' || s === 'Preparatory year') return L('تحضيري', 'Prep');
    if (s === 'مواد خارج الخطة' || s === 'Outside the plan') return L('خارج', 'Other');
    if (s === 'فصل صيفيّ' || s === 'Summer term') return L('صيفي', 'Sum');
    var order = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع',
                 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
    for (var i = 0; i < order.length; i++) if (String(s).indexOf(order[i]) > -1) return isAr() ? ('م' + (i + 1)) : ('L' + (i + 1));
    var m = String(s).match(/\d+/);
    if (m) return isAr() ? ('م' + m[0]) : ('L' + m[0]);
    return String(s).length > 8 ? String(s).slice(0, 7) + '…' : String(s);
  }

  function renderChart() {
    var svg = $('#chart'); if (!svg || !svg.parentElement) return;
    var W = Math.max(300, Math.round(svg.parentElement.getBoundingClientRect().width));
    if (W < 60) return;                                  /*@3.GPAJ.68*/
    var narrow = W < 560;
    var H = W < 420 ? 224 : narrow ? 262 : 310;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W); svg.setAttribute('height', H);

    var d = seriesData(), rtl = isAr(), split = Math.max(0, recordedCount() - 1);
    if (!d.length) { svg.innerHTML = ''; return; }

    var vals = d.map(function (p) { return p.gpa; });
    var dmin = Math.min.apply(null, vals), dmax = Math.max.apply(null, vals);
    [3.75, 3.25].forEach(function (t) {
      if (t <= dmax + .12 && t >= dmin - .12) { dmin = Math.min(dmin, t); dmax = Math.max(dmax, t); }
    });
    var pad = Math.max(.05, (dmax - dmin) * .22);
    var lo = Math.max(0, Math.floor((dmin - pad) * 20) / 20);
    var hi = Math.min(4, Math.ceil((dmax + pad) * 20) / 20);
    if (hi - lo < .35) { var mid = (hi + lo) / 2; lo = Math.max(0, mid - .175); hi = Math.min(4, mid + .175); }

    var step = [.05, .1, .25, .5, 1].filter(function (s) { return (hi - lo) / s <= 5; })[0] || 1;
    var ticks = [];
    for (var tv = Math.ceil(lo / step) * step; tv <= hi + 1e-9; tv += step) ticks.push(+tv.toFixed(2));

    var NUM = narrow ? 46 : 86, END = narrow ? 22 : 26, PT = 34, PB = 40;
    var PL = rtl ? END : NUM, PR = rtl ? NUM : END;
    var innerW = W - PL - PR, innerH = H - PT - PB;
    var x = function (i) { var t = d.length < 2 ? .5 : i / (d.length - 1); return PL + innerW * (rtl ? 1 - t : t); };
    var y = function (v) { return PT + innerH * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)); };
    var axX = rtl ? W - PR + 10 : PL - 10, axA = rtl ? 'start' : 'end';
    var honour = {}; honour[3.75] = L('شرفٌ أولى', 'First hon.'); honour[3.25] = L('شرفٌ ثانية', 'Second hon.');
    var outside = [];

    var pts0 = d.map(function (p, i) { return { x: x(i), y: y(p.gpa), v: p.gpa }; });
    var gx0 = pts0[0].x, gx1 = pts0[pts0.length - 1].x, gspan = (gx1 - gx0) || 1;
    var stops = pts0.map(function (p) {
      return { o: Math.max(0, Math.min(1, (p.x - gx0) / gspan)), c: rampColor(p.v) };
    }).sort(function (a, b) { return a.o - b.o; });

    var g = '<defs><linearGradient id="gpLine" gradientUnits="userSpaceOnUse" x1="' + gx0.toFixed(1) +
      '" y1="0" x2="' + gx1.toFixed(1) + '" y2="0">' +
      stops.map(function (s) { return '<stop offset="' + (s.o * 100).toFixed(1) + '%" stop-color="' + s.c + '"/>'; }).join('') +
      '</linearGradient><clipPath id="gpClip"><rect x="' + PL + '" y="' + (PT - 14) +
      '" width="' + innerW + '" height="' + (innerH + 14) + '"/></clipPath></defs>';

    /*@3.GPAJ.69*/
    var honHit = {};
    Object.keys(honour).forEach(function (k) { var v = +k; if (v >= lo && v <= hi) honHit[v.toFixed(2)] = true; });
    ticks.forEach(function (v) {
      g += '<line x1="' + PL + '" y1="' + y(v) + '" x2="' + (W - PR) + '" y2="' + y(v) +
           '" stroke="var(--border-color)" stroke-width="1" opacity=".32"/>';
      if (honHit[v.toFixed(2)] && !narrow) return;
      g += '<text class="t-axis" x="' + axX + '" y="' + (y(v) + 4) + '" text-anchor="' + axA + '">' + v.toFixed(2) + '</text>';
    });
    Object.keys(honour).forEach(function (k) {
      var v = +k;
      if (v < lo || v > hi) { outside.push(honour[k] + ' ' + v.toFixed(2) + (v < lo ? ' ↓' : ' ↑')); return; }
      g += '<line x1="' + PL + '" y1="' + y(v) + '" x2="' + (W - PR) + '" y2="' + y(v) +
           '" stroke="var(--st-ok)" stroke-width="1.25" stroke-dasharray="4 5" opacity=".5"/>';
      if (narrow) return;
      g += '<circle cx="' + (rtl ? axX + 4 : axX - 4) + '" cy="' + (y(v) - 9) + '" r="3" fill="var(--st-ok)" opacity=".95"/>' +
           '<text class="t-pill" x="' + (rtl ? axX + 12 : axX - 12) + '" y="' + (y(v) - 5) +
           '" text-anchor="' + axA + '">' + esc(honour[k]) + '</text>' +
           '<text class="t-pill-v" x="' + (rtl ? axX + 12 : axX - 12) + '" y="' + (y(v) + 9) +
           '" text-anchor="' + axA + '">' + v.toFixed(2) + '</text>';
    });

    var pts = pts0, recPts = pts.slice(0, split + 1), fcPts = pts.slice(split);
    g += '<g clip-path="url(#gpClip)">';
    if (fcPts.length > 1) {
      g += '<path d="' + smoothPath(fcPts) + '" fill="none" stroke="url(#gpLine)" stroke-width="2" ' +
           'stroke-dasharray="4 5" stroke-linejoin="round" stroke-linecap="round" opacity=".5"/>';
    }
    if (recPts.length > 1) {
      g += '<path d="' + smoothPath(recPts) + '" fill="none" stroke="url(#gpLine)" stroke-width="3" ' +
           'stroke-linejoin="round" stroke-linecap="round" class="gp-line-rec"/>';
    }
    g += '</g>';

    if (fcPts.length > 1) {
      g += '<line x1="' + pts[split].x.toFixed(1) + '" y1="' + (pts[split].y + 12).toFixed(1) +
           '" x2="' + pts[split].x.toFixed(1) + '" y2="' + (H - PB) +
           '" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="2 3"/>' +
           '<text class="t-now" x="' + pts[split].x.toFixed(1) + '" y="' + (H - PB - 8) +
           '" text-anchor="middle">' + esc(L('الآن', 'NOW')) + '</text>';
    }
    d.forEach(function (p, i) {
      if (i === split) return;
      g += '<circle cx="' + pts[i].x.toFixed(1) + '" cy="' + pts[i].y.toFixed(1) +
           '" r="3.5" fill="var(--bg-card)" stroke="' + rampColor(p.gpa) + '" stroke-width="2"' +
           (p.plan ? ' opacity=".55"' : '') + '/>';
    });
    g += '<circle cx="' + pts[split].x.toFixed(1) + '" cy="' + pts[split].y.toFixed(1) +
         '" r="5.5" fill="' + rampColor(d[split].gpa) + '" stroke="var(--bg-card)" stroke-width="2.5"/>';

    var lastI = d.length - 1;
    [[split, 'var(--text-primary)'], [lastI, rampColor(d[lastI].gpa)]].forEach(function (pair) {
      var i = pair[0]; if (i === split && lastI === split && i !== split) return;
      if (i !== split && i === split) return;
      var above = pts[i].y > PT + 26;
      g += '<text class="t-val" x="' + pts[i].x.toFixed(1) + '" y="' + (pts[i].y + (above ? -14 : 22)).toFixed(1) +
           '" text-anchor="middle" fill="' + pair[1] + '">' + d[i].gpa.toFixed(2) + '</text>';
    });
    d.forEach(function (p, i) {
      g += '<text class="t-x' + (i === split ? ' is-now' : '') + '" x="' + pts[i].x.toFixed(1) +
           '" y="' + (H - 14) + '" text-anchor="middle">' + esc(shortLabel(p)) + '</text>';
    });

    g += '<g id="gp-hover" opacity="0" pointer-events="none">' +
      '<line id="gp-hv-line" y1="' + PT + '" y2="' + (H - PB) + '" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<circle id="gp-hv-dot" r="6" fill="var(--bg-card)" stroke="var(--text-muted)" stroke-width="3"/>' +
      '<g><rect id="gp-hv-bg" rx="8" height="27" fill="var(--bg-elevated)" stroke="var(--border-color)"/>' +
      '<text id="gp-hv-tx" class="t-hv" text-anchor="middle" dy="17.5"/></g></g>' +
      '<rect id="gp-hit" x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent" style="cursor:crosshair"/>';

    svg.innerHTML = '<title>' + esc(L('منحنى المعدل التراكمي', 'Cumulative GPA curve')) + '</title>' + g;

    /*@3.GPAJ.70*/
    $$('.t-val, .t-x', svg).forEach(function (t) {
      var b = t.getBBox(), nx = +t.getAttribute('x');
      if (b.x < 3) t.setAttribute('x', nx + (3 - b.x));
      else if (b.x + b.width > W - 3) t.setAttribute('x', nx - (b.x + b.width - (W - 3)));
    });

    var outEl = $('#hon-out');
    if (outEl) { outEl.textContent = outside.join(' · '); outEl.hidden = !outside.length; }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var line = svg.querySelector('.gp-line-rec');
    if (!_chartDrawn && !reduce && line) {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)';
      line.style.strokeDashoffset = '0';
      _chartDrawn = true;
    }
    bindHover(svg, d, pts, W, PT);
  }

  function bindHover(svg, d, pts, W, PT) {
    var hit = svg.querySelector('#gp-hit'), grp = svg.querySelector('#gp-hover');
    if (!hit) return;
    function at(ev) {
      var r = svg.getBoundingClientRect();
      var px = (ev.clientX - r.left) * (W / r.width);
      var best = 0, bd = Infinity;
      pts.forEach(function (p, i) { var dd = Math.abs(p.x - px); if (dd < bd) { bd = dd; best = i; } });
      var p = pts[best], v = d[best];
      svg.querySelector('#gp-hv-line').setAttribute('x1', p.x);
      svg.querySelector('#gp-hv-line').setAttribute('x2', p.x);
      var dot = svg.querySelector('#gp-hv-dot');
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      dot.setAttribute('stroke', rampColor(v.gpa));
      var tx = svg.querySelector('#gp-hv-tx'), bg = svg.querySelector('#gp-hv-bg');
      tx.textContent = v.label + ' · ' + v.gpa.toFixed(2);
      var w = Math.max(86, tx.getComputedTextLength() + 24);
      var cx = Math.min(Math.max(p.x, w / 2 + 4), W - w / 2 - 4);
      var top = Math.max(4, p.y - 38);
      bg.setAttribute('x', cx - w / 2); bg.setAttribute('y', top); bg.setAttribute('width', w);
      tx.setAttribute('x', cx); tx.setAttribute('y', top);
      grp.setAttribute('opacity', '1');
    }
    hit.addEventListener('mousemove', at);
    hit.addEventListener('mouseleave', function () { grp.setAttribute('opacity', '0'); });
    hit.addEventListener('touchstart', function (e) { at(e.touches[0]); }, { passive: true });
    hit.addEventListener('touchmove', function (e) { at(e.touches[0]); }, { passive: true });
  }

  /*@3.GPAJ.71*/
  function renderPicker() {
    var list = $('#pick-list'); if (!list) return;
    var cur = currentSem();
    var inCur = {}; ((cur && cur.courses) || []).forEach(function (c) { inCur[c.code] = true; });
    var inSem = {}; ((semester && semester.courses) || []).forEach(function (c) { inSem[c.code] = true; });

    var q = pickerQ.trim().toLowerCase();
    var items = catalogArr.filter(function (c) {
      if (inCur[c.code]) return false;
      if (!q) return true;
      return (c.code || '').toLowerCase().indexOf(q) > -1 ||
             (c.name_ar || '').toLowerCase().indexOf(q) > -1 ||
             (c.name_en || '').toLowerCase().indexOf(q) > -1;
    });
    var active = items.filter(function (c) { return inSem[c.code]; });
    var rest = items.filter(function (c) { return !inSem[c.code]; });

    function row(c, isActive) {
      var name = isAr() ? c.name_ar : c.name_en;
      var lvl = isAr() ? (c.level_name_ar || c.level) : (c.level_name_en || c.level);
      return '<button class="gp-pick-item" data-add="' + esc(c.code) + '">' +
        '<span class="gp-code">' + esc(c.code) + '</span>' +
        '<span class="gp-pick-info"><span class="gp-pick-name">' + esc(name) + '</span>' +
        '<span class="gp-pick-meta">' + (lvl ? esc(lvl) + ' · ' : '') + esc(crWord(c.credits != null ? c.credits : 3)) + '</span></span>' +
        (isActive ? '<span class="gp-badge" data-kind="on">' + esc(L('في فصلي', 'In my term')) + '</span>' : '') +
      '</button>';
    }
    var html = '';
    if (active.length) html += '<div class="gp-pick-lbl">' + esc(L('مواد فصلي', 'My term')) + '</div>' + active.map(function (c) { return row(c, true); }).join('');
    if (rest.length) html += '<div class="gp-pick-lbl">' + esc(L('كل المواد', 'All courses')) + '</div>' + rest.map(function (c) { return row(c, false); }).join('');
    if (!html) html = '<div class="gp-empty gp-empty--inline"><i class="fa-solid fa-magnifying-glass"></i><p>' + esc(L('لا نتائج', 'No results')) + '</p></div>';
    list.innerHTML = html;
  }

  function addCatalogCourse(code) {
    var info = catalogMap[code]; if (!info) return;
    if (!semester) {
      semester = { id: 'sem_' + Date.now(), name: isAr() ? 'فصلي' : 'My Semester', courses: [],
                   is_active: true, is_pinned: false, was_activated: false,
                   created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }
    if (!semester.courses.some(function (c) { return c.code === code; })) {
      semester.courses.push({ code: code, added_at: new Date().toISOString(), completed: false, completed_at: null, grade: null });
      semester.updated_at = new Date().toISOString();
      localStorage.setItem(LS_SEMESTER, JSON.stringify(semester));
    }
    syncCurrentSemester(); normalizeCurrentFlag();
    renderPicker(); render();
    toast(L('أُضيفت المادة', 'Course added'));
  }

  function addManualCourse() {
    var name = ($('#manual-name').value || '').trim();
    var credits = parseInt($('#manual-credits').value, 10) || 3;
    if (!name) return;
    var cur = currentSem();
    if (!cur) {
      cur = { id: 'sem_' + Date.now(), name: isAr() ? 'فصلي' : 'My Semester', courses: [], is_current: true };
      gradesData.semesters.push(cur);
    }
    cur.courses.push({ code: '__MANUAL_' + Date.now(), name_ar: name, name_en: name,
                       credits: credits, grade: null, points: null });
    saveGrades();
    $('#manual-name').value = ''; $('#manual-credits').value = '3';
    $('#modal-manual').hidden = true;
    render(); toast(L('أُضيفت المادة', 'Course added'));
  }

  function onGradeChange(code, g) {
    var cur = currentSem(); if (!cur) return;
    var c = cur.courses.find(function (x) { return x.code === code; }); if (!c) return;
    c.grade = g || null;
    c.points = g ? (GPA_SCALE[g] || 0) : null;
    saveGrades();
    if (semester && semester.courses) {
      var sc = semester.courses.find(function (x) { return x.code === code; });
      if (sc) {
        sc.grade = g || null;
        if (g) { sc.completed = true; sc.completed_at = sc.completed_at || new Date().toISOString(); }
        semester.updated_at = new Date().toISOString();
        localStorage.setItem(LS_SEMESTER, JSON.stringify(semester));
      }
    }
    if (g && whatIf[code]) delete whatIf[code];
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }
    render();
  }

  function removeCourse(code) {
    if (!confirm(L('حذف هذه المادة من الحاسبة؟', 'Remove this course from the calculator?'))) return;
    var cur = currentSem(); if (!cur) return;
    cur.courses = cur.courses.filter(function (c) { return c.code !== code; });
    saveGrades(); delete whatIf[code];
    render(); toast(L('حُذفت المادة', 'Course removed'));
  }

  /*@3.GPAJ.72*/
  function findArchive(id) {
    for (var i = 0; i < archive.length; i++) if (archive[i] && archive[i].id === id) return archive[i];
    return null;
  }
  function openEditor(id) {
    var a = findArchive(id); if (!a) return;
    editingId = id;
    $('#ed-name').value = a.name || '';
    $('#ed-rows').innerHTML = (a.courses || []).map(function (c) {
      var info = getCourseInfo(c);
      return '<div class="gp-ed-row" data-code="' + esc(c.code) + '" data-grade="' + esc(c.grade || '') + '">' +
        '<span class="gp-ed-name"><span class="gp-code">' + esc(c.code) + '</span>' +
          '<span>' + esc(isAr() ? info.name_ar : info.name_en) + '</span></span>' +
        '<input type="number" class="gp-ed-cr" min="0" max="12" value="' + info.credits + '" aria-label="' + esc(L('الساعات', 'Credits')) + '">' +
        pickBtn('ed', c.code, c.grade || '', c.grade || '—') +
        '<button class="gp-ico gp-ico--danger" data-ed-del aria-label="' + esc(L('حذف', 'Delete')) + '"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>';
    }).join('');
    $('#modal-edit').hidden = false;
  }
  function addEditorRow(code) {
    if (!code || $('#ed-rows .gp-ed-row[data-code="' + code + '"]')) return;
    var info = getCourseInfo({ code: code });
    $('#ed-rows').insertAdjacentHTML('beforeend',
      '<div class="gp-ed-row" data-code="' + esc(code) + '" data-grade="">' +
      '<span class="gp-ed-name"><span class="gp-code">' + esc(code) + '</span><span>' +
        esc(isAr() ? info.name_ar : info.name_en) + '</span></span>' +
      '<input type="number" class="gp-ed-cr" min="0" max="12" value="' + info.credits + '" aria-label="' + esc(L('الساعات', 'Credits')) + '">' +
      pickBtn('ed', code, '', '—') +
      '<button class="gp-ico gp-ico--danger" data-ed-del aria-label="' + esc(L('حذف', 'Delete')) + '"><i class="fa-solid fa-xmark"></i></button></div>');
    var row = $('#ed-rows .gp-ed-row[data-code="' + code + '"]');
    if (row) row.scrollIntoView({ block: 'nearest' });
  }
  function saveEditor() {
    var a = findArchive(editingId); if (!a) { $('#modal-edit').hidden = true; return; }
    var nm = ($('#ed-name').value || '').trim();
    /*@3.GPAJ.114*/
    if (nm && nm !== archName(a)) { a.name = nm; a.name_ar = nm; a.name_en = nm; }
    var was = {};
    (a.courses || []).forEach(function (c) { if (c && c.code) was[c.code] = c; });
    /*@3.GPAJ.115*/
    a.courses = $$('#ed-rows .gp-ed-row').map(function (row) {
      var code = row.getAttribute('data-code');
      var grade = row.getAttribute('data-grade') || null;
      var cr = parseInt($('.gp-ed-cr', row).value, 10);
      var e = was[code] || { code: code };
      e.grade = grade;
      var info = catalogMap[code];
      var cc = info && info.credits != null ? info.credits : null;
      if (!isNaN(cr) && (cc == null || cr !== cc)) e.credits = cr;
      else if (!isNaN(cr) && cc != null && cr === cc) delete e.credits;
      return e;
    });
    if (!a.courses.length) archive = archive.filter(function (x) { return x && x.id !== editingId; });
    localStorage.setItem(LS_ARCHIVE, JSON.stringify(archive));
    syncArchivedSemesters();
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }
    gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || '{"semesters":[]}');
    normalizeCurrentFlag();
    $('#modal-edit').hidden = true; editingId = null;
    render(); toast(L('حُفظ السجل', 'Record saved'));
  }
  function deleteRecord() {
    if (!editingId) return;
    if (!confirm(L('حذف هذا السجل بكل مواده؟', 'Delete this record and all its courses?'))) return;
    archive = archive.filter(function (x) { return x && x.id !== editingId; });
    localStorage.setItem(LS_ARCHIVE, JSON.stringify(archive));
    syncArchivedSemesters();
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }
    gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || '{"semesters":[]}');
    normalizeCurrentFlag();
    $('#modal-edit').hidden = true; editingId = null;
    render(); toast(L('حُذف السجل', 'Record deleted'));
  }

  /*@3.GPAJ.73*/
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  /*@3.GPAJ.74*/
  function ringSVG(size, v) {
    var r = size / 2 - 9, cx = size / 2, cy = size / 2;
    var track = cssVar('--bg-elevated', '#1e2230'), col = rampColor(v);
    var f = isAr() ? 'Cairo, sans-serif' : 'Inter, sans-serif';
    var txt = cssVar('--text-primary', '#e6e9f0'), muted = cssVar('--text-muted', '#94a3b8');
    return '<svg data-font width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size +
      '" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="9"/>' +
      '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">' +
        '<path d="' + arcPath(cx, cy, r, v / 4) + '" fill="none" stroke="' + col +
        '" stroke-width="9" stroke-linecap="round"/></g>' +
      '<text x="' + cx + '" y="' + (cy + 3) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" ' +
        'font-size="30" font-weight="700" fill="' + col + '">' + v.toFixed(2) + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle" font-family="' + f +
        '" font-size="10" font-weight="700" fill="' + muted + '">' + esc(L('من 4.00', 'of 4.00')) + '</text>' +
      '</svg>';
  }

  function miniChart(w, h) {
    var d = seriesData(); if (d.length < 2) return '';
    var muted = cssVar('--text-muted', '#94a3b8'), line = cssVar('--border-color', '#334155');
    var card = cssVar('--bg-card', '#161922'), txt = cssVar('--text-secondary', '#c3c9d6');
    var split = Math.max(0, recordedCount() - 1), rtl = isAr();
    var f = rtl ? 'Cairo, sans-serif' : 'Inter, sans-serif';
    var vals = d.map(function (p) { return p.gpa; });
    var lo = Math.max(0, Math.min.apply(null, vals) - .18);
    var hi = Math.min(4, Math.max.apply(null, vals) + .18);
    if (hi - lo < .4) { var mid = (hi + lo) / 2; lo = Math.max(0, mid - .2); hi = Math.min(4, mid + .2); }
    /*@3.GPAJ.75*/
    var NUM = 34, END = 12, PT = 12, PB = 24;
    var PL = rtl ? END : NUM, PR = rtl ? NUM : END;
    var iw = w - PL - PR, ih = h - PT - PB;
    var x = function (i) { var t = i / (d.length - 1); return PL + iw * (rtl ? 1 - t : t); };
    var y = function (v) { return PT + ih * (1 - (v - lo) / (hi - lo)); };
    var pts = d.map(function (p, i) { return { x: x(i), y: y(p.gpa), v: p.gpa }; });
    var axX = rtl ? w - PR + 6 : PL - 6, axA = rtl ? 'start' : 'end';

    var g = '';
    /*@3.GPAJ.76*/
    [lo, (lo + hi) / 2, hi].forEach(function (t) {
      g += '<line x1="' + PL + '" y1="' + y(t).toFixed(1) + '" x2="' + (w - PR) + '" y2="' + y(t).toFixed(1) +
           '" stroke="' + line + '" stroke-width="1" opacity=".45"/>' +
           '<text x="' + axX + '" y="' + (y(t) + 3.5).toFixed(1) + '" text-anchor="' + axA +
           '" font-family="JetBrains Mono, monospace" font-size="9" fill="' + muted + '">' + t.toFixed(2) + '</text>';
    });
    /*@3.GPAJ.77*/
    [[3.75, L('شرف أولى', '1st hon.')], [3.25, L('شرف ثانية', '2nd hon.')]].forEach(function (t) {
      if (t[0] < lo || t[0] > hi) return;
      g += '<line x1="' + PL + '" y1="' + y(t[0]).toFixed(1) + '" x2="' + (w - PR) + '" y2="' + y(t[0]).toFixed(1) +
           '" stroke="' + cssVar('--st-ok', '#22c55e') + '" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>' +
           '<text x="' + (rtl ? PL + 4 : w - PR - 4) + '" y="' + (y(t[0]) - 4).toFixed(1) +
           '" text-anchor="' + (rtl ? 'start' : 'end') + '" font-family="' + f +
           '" font-size="8.5" font-weight="700" fill="' + cssVar('--st-ok', '#22c55e') + '">' + esc(t[1]) + '</text>';
    });
    /*@3.GPAJ.78*/
    for (var i = 1; i < pts.length; i++) {
      g += '<path d="M' + pts[i-1].x.toFixed(1) + ' ' + pts[i-1].y.toFixed(1) + 'L' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) +
        '" fill="none" stroke="' + rampColor(d[i].gpa) + '" stroke-width="2.4" stroke-linecap="round"' +
        (i > split ? ' stroke-dasharray="4 4" opacity=".62"' : '') + '/>';
    }
    pts.forEach(function (p, i) {
      g += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (i === split ? 4 : 2.6) +
           '" fill="' + (i === split ? rampColor(p.v) : card) + '" stroke="' + rampColor(p.v) + '" stroke-width="' +
           (i === split ? 2 : 1.6) + '"' + (i > split ? ' opacity=".7"' : '') + '/>';
    });
    /*@3.GPAJ.79*/
    if (split < pts.length - 1) {
      g += '<line x1="' + pts[split].x.toFixed(1) + '" y1="' + (PT + 8) + '" x2="' + pts[split].x.toFixed(1) +
           '" y2="' + (h - PB) + '" stroke="' + muted + '" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/>' +
           '<text x="' + pts[split].x.toFixed(1) + '" y="' + (PT + 3) + '" text-anchor="middle" font-family="' + f +
           '" font-size="8.5" font-weight="800" fill="' + muted + '">' + esc(L('الآن', 'NOW')) + '</text>';
    }
    /*@3.GPAJ.80*/
    var every = Math.max(1, Math.ceil(d.length / 7));
    d.forEach(function (p, i) {
      if (i !== 0 && i !== d.length - 1 && i !== split && i % every) return;
      if (Math.abs(pts[i].x - pts[split].x) < 14 && i !== split) return;
      g += '<text x="' + pts[i].x.toFixed(1) + '" y="' + (h - 4) + '" text-anchor="middle" font-family="' + f +
           '" font-size="8.5" fill="' + muted + '">' + esc(shortLabel(p)) + '</text>';
    });
    /*@3.GPAJ.81*/
    return '<svg data-font width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
  }

  function buildExportCard() {
    var cum = cumulative(false), b = bandOf(cum);
    var s = seriesData(), end = s.length ? s[s.length - 1].gpa : cum;
    var earned = 0, graded = 0, total = 0, pts = 0;
    allCourses().forEach(function (c) {
      total++;
      if (c.grade) { earned += c.credits; graded++; }
      if (c.grade && GPA_SCALE[c.grade] !== undefined) pts += GPA_SCALE[c.grade] * c.credits;
    });
    var planCr = 0;
    plan().semesters.forEach(function (sm) { (sm.courses || []).forEach(function (c) { planCr += (c.credits || 3); }); });
    /*@3.GPAJ.82*/
    var failed = allCourses().some(function (c) { return c.grade === 'F'; });
    var hon, honKind;
    if (failed) { honKind = 'off'; hon = L('مرتبة الشرف خارج المتناول — رسوبٌ في السجل', 'Honours out of reach — a fail on record'); }
    else if (end >= 3.75) { honKind = 'gold'; hon = L('مرتبة الشرف الأولى في متناول يدك — واصِل!', 'First honours are within your reach — keep going!'); }
    else if (end >= 3.25) { honKind = 'ok';   hon = L('مرتبة الشرف الثانية في متناول يدك — واصِل!', 'Second honours are within your reach — keep going!'); }
    else { honKind = 'off'; hon = L('دون نطاق مرتبة الشرف', 'Below the honours range'); }

    /*@3.GPAJ.83*/
    function ratio(a, bb) { return isAr() ? (a + ' من ' + bb) : (a + ' / ' + bb); }

    var box = document.createElement('div');
    box.className = 'gp-xcard';
    box.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    /*@3.GPAJ.84*/
    var LOGO =
      '<svg class="gp-xc-logo" viewBox="0 0 100 100" aria-hidden="true">' +
        '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M50 88 V64" stroke="#10b981" stroke-width="8"/>' +
          '<path d="M50 64 L22 42 M50 64 L78 42 M50 64 V34" stroke="#a78bfa" stroke-width="7"/>' +
        '</g>' +
        '<circle cx="50" cy="64" r="12" fill="#a78bfa"/>' +
        '<circle cx="22" cy="42" r="9" fill="#a78bfa"/>' +
        '<circle cx="78" cy="42" r="9" fill="#a78bfa"/>' +
        '<circle cx="50" cy="26" r="14" fill="#10b981"/>' +
      '</svg>';
    var MONTH_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var now = new Date();
    /*@3.GPAJ.85*/
    var dateTxt = isAr()
      ? (now.getDate() + ' ' + MONTH_AR[now.getMonth()] + ' ' + now.getFullYear())
      : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);

    box.innerHTML =
      '<div class="gp-xc-top">' +
        '<div><div class="gp-xc-title">' + esc(L('المعدل الدراسي', 'Grade Point Average')) + '</div>' +
        '<div class="gp-xc-sub">' + esc(L('الجامعة السعودية الإلكترونية', 'Saudi Electronic University')) + '</div></div>' +
      '</div>' +
      '<div class="gp-xc-hero">' +
        '<div class="gp-xc-now">' + ringSVG(126, cum) +
          '<div class="gp-xc-band" style="color:' + rampColor(cum) + '">' + esc(L(b.ar, b.en)) + '</div>' +
        '</div>' +
        '<div class="gp-xc-stats">' +
          [[L('ساعات مجتازة', 'Credits earned'), ratio(earned, progCredits())],
           [L('نقاط', 'Points'), ratio(Math.round(pts), earned * 4)],
           [L('مواد مقدّرة', 'Graded courses'), ratio(graded, total)]].map(function (r) {
            return '<div class="gp-xc-stat"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
          }).join('') +
        '</div>' +
      '</div>' +
      /*@3.GPAJ.86*/
      '<div class="gp-xc-fc">' +
        '<div class="gp-xc-fc-h"><span>' + esc(L('حتى التخرّج', 'To graduation')) + '</span>' +
          '<b style="color:' + rampColor(end) + '">' + end.toFixed(2) + '</b></div>' +
        miniChart(576, 124) +
      '</div>' +
      '<div class="gp-xc-hon" data-kind="' + honKind + '">' +
        (honKind === 'gold' ? '<i class="fa-solid fa-award"></i>'
         : honKind === 'ok' ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '') +
        '<span>' + esc(hon) + '</span></div>' +
      /*@3.GPAJ.87*/
      '<div class="gp-xc-foot">' + LOGO +
        '<span class="gp-xc-brand">' + esc(L('الحديقة الرقمية', 'The Digital Garden')) + '</span>' +
        '<span class="gp-xc-date">' + esc(dateTxt) + '</span>' +
      '</div>';
    document.body.appendChild(box);
    return box;
  }

  function runExport(kind) {
    if (!window.Export) { toast(L('التصدير غير متاح', 'Export unavailable')); return; }
    if (!allCourses().length) { toast(L('لا بيانات لتصديرها', 'Nothing to export yet')); return; }
    var card = buildExportCard();
    var fname = (isAr() ? 'المعدل_' : 'GPA_') + new Date().toISOString().slice(0, 10);
    var done = function () { if (card.parentNode) card.parentNode.removeChild(card); };
    var p = (kind === 'pdf')
      ? window.Export.toPDF(card, fname + '.pdf', { orientation: 'landscape' })
      : window.Export.toPNG(card, fname + '.png', {});
    Promise.resolve(p).then(done, function (e) {
      done(); console.error('[gpa export]', e);
      toast(L('تعذّر التصدير', 'Export failed'));
    });
  }

  /*@3.GPAJ.88*/
  function onMenuBtn(btn) {
    var kind = btn.getAttribute('data-menu'), key = btn.getAttribute('data-key');
    if (kind === 'cur') {
      var c0 = (currentSem() || { courses: [] }).courses.find(function (x) { return x.code === key; });
      return openMenu(btn, gradeItems(c0 && c0.grade, true), function (v) { onGradeChange(key, v); });
    }
    if (kind === 'wi') {
      return openMenu(btn, gradeItems(whatIf[key], true, L('لو…', 'If…')), function (v) {
        if (v) whatIf[key] = v; else delete whatIf[key];
        renderHero(); renderRows(currentSem()); renderChart(); renderHonour();
      });
    }
    if (kind === 'rec') {
      var g0 = null;
      (archive || []).forEach(function (a) {
        (a.courses || []).forEach(function (c) { if (c && c.code === key) g0 = c.grade; });
      });
      return openMenu(btn, gradeItems(g0, true), function (v) { setArchiveGrade(key, v || null); });
    }
    if (kind === 'plg') {
      if (scenario) { toast(L('أنت في سيناريو — اختر «خطّتي» لتعديل المواد', 'Scenario mode — pick “My plan” to edit')); return; }
      var ix = key.split(','), pl0 = plan(), cc = pl0.semesters[+ix[0]].courses[+ix[1]];
      return openMenu(btn, gradeItems(cc.grade, false), function (v) {
        cc.grade = v; savePlan(pl0); renderPlan(); renderChart(); renderTarget(); renderHonour();
      });
    }
    if (kind === 'plcr') {
      var ix2 = key.split(','), pl1 = plan(), c2 = pl1.semesters[+ix2[0]].courses[+ix2[1]];
      return openMenu(btn, [1,2,3,4,5,6].map(function (n) {
        return { v: String(n), k: String(n), d: crWord(n), on: (c2.credits || 3) === n };
      }), function (v) {
        c2.credits = parseInt(v, 10) || 3;
        savePlan(pl1); renderPlan(); renderChart(); renderTarget(); renderHonour();
      });
    }
    /*@3.GPAJ.89*/
    if (kind === 'edadd') {
      var have = {};
      $$('#ed-rows .gp-ed-row').forEach(function (r) { have[r.getAttribute('data-code')] = true; });
      var pool = coursePool().filter(function (c) { return !have[c.code]; }).map(function (c) {
        return { v: c.code, k: c.code, d: c.name };
      });
      if (!pool.length) { toast(L('كلُّ ما نعرفه مضافٌ هنا', 'Everything we know is already here')); return; }
      return openMenu(btn, pool, addEditorRow,
        { search: L('ابحث برمز المادة أو باسمها…', 'Search by code or name…'), wide: true });
    }
    if (kind === 'ed') {
      var row = btn.closest('.gp-ed-row');
      return openMenu(btn, gradeItems(row.getAttribute('data-grade'), true), function (v) {
        row.setAttribute('data-grade', v);
        btn.setAttribute('data-tone', tone(v));
        btn.classList.toggle('is-set', !!v);
        btn.querySelector('span').textContent = v || '—';
      });
    }
  }
  /*@3.GPAJ.90*/
  function setArchiveGrade(code, g) {
    var hit = false;
    (archive || []).forEach(function (a) {
      (a.courses || []).forEach(function (c) { if (c && c.code === code) { c.grade = g; hit = true; } });
    });
    if (!hit) return;
    localStorage.setItem(LS_ARCHIVE, JSON.stringify(archive));
    syncArchivedSemesters();
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (_) {} }
    gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || '{"semesters":[]}');
    normalizeCurrentFlag();
    render(); toast(L('حُدّثت الدرجة', 'Grade updated'));
  }

  function bindEvents() {
    document.addEventListener('input', function (e) {
      if (e.target.id === 'target-inp') renderTarget();
      if (e.target.id === 'pick-search') { pickerQ = e.target.value || ''; renderPicker(); }
      if (e.target.hasAttribute('data-sem') || e.target.hasAttribute('data-pl-name')) {
        var p = plan();
        if (e.target.hasAttribute('data-sem')) p.semesters[+e.target.getAttribute('data-sem')].name = e.target.value;
        else {
          var ix = e.target.getAttribute('data-pl-name').split(',');
          p.semesters[+ix[0]].courses[+ix[1]].name = e.target.value;
        }
        savePlan(p);
      }
    });

    document.addEventListener('click', function (e) {
      var el;
      /*@3.GPAJ.91*/
      if (!e.target.closest('[data-menu]') && !e.target.closest('#gp-menu')) closeMenu();
      if ((el = e.target.closest('[data-menu]'))) { onMenuBtn(el); return; }
      if ((el = e.target.closest('[data-fold]'))) {
        var card = el.closest('.gp-card'), folded = card.classList.toggle('is-folded');
        el.setAttribute('aria-expanded', !folded);
        if (!folded) renderChart();
        return;
      }
      if ((el = e.target.closest('[data-rec-mv]'))) {
        var rm = el.getAttribute('data-rec-mv').split(',');
        var ord = bucketOrder(archivedByLevel());
        var at = ord.indexOf(rm[0]), dst = at + (+rm[1]);
        if (at < 0 || dst < 0 || dst >= ord.length) return;
        ord.splice(dst, 0, ord.splice(at, 1)[0]);
        saveRecOrder(ord);
        renderRecord(); renderChart(); return;
      }
      if ((el = e.target.closest('.gp-acc-head')) && !el.hasAttribute('data-act')) {
        var acc = el.closest('.gp-acc'), open = acc.classList.toggle('is-open');
        el.setAttribute('aria-expanded', open); return;
      }
      if ((el = e.target.closest('[data-sem-fold]'))) {
        var sem = el.closest('.gp-sem'), fold = sem.classList.toggle('is-folded');
        el.setAttribute('aria-expanded', !fold); return;
      }
      /*@3.GPAJ.92*/
      if ((el = e.target.closest('[data-sem-toggle]')) && !e.target.closest('input, button, select')) {
        var sem2 = el.closest('.gp-sem'), f2 = sem2.classList.toggle('is-folded');
        var fb = sem2.querySelector('[data-sem-fold]'); if (fb) fb.setAttribute('aria-expanded', !f2);
        return;
      }
      /*@3.GPAJ.93*/
      if ((el = e.target.closest('[data-sem-mv]'))) {
        var mv = el.getAttribute('data-sem-mv').split(','), pm = plan();
        var from = +mv[0], to = from + (+mv[1]);
        if (to < 0 || to >= pm.semesters.length) return;
        var moved = pm.semesters.splice(from, 1)[0];
        pm.semesters.splice(to, 0, moved);
        savePlan(pm); renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      /*@3.GPAJ.94*/
      if ((el = e.target.closest('[data-pl-move]'))) {
        var nx = el.getAttribute('data-pl-move').split(','), pn = plan();
        var si = +nx[0], ci = +nx[1], to = si + (+nx[2]);
        if (to < 0 || to >= pn.semesters.length) return;
        var course = pn.semesters[si].courses.splice(ci, 1)[0];
        var dst = pn.semesters[to];
        dst.courses = dst.courses || []; dst.courses.push(course);
        savePlan(pn);
        _planFocus = to;                 /*@3.GPAJ.95*/
        renderPlan(); renderChart(); renderTarget(); renderHonour();
        toast(L('نُقلت إلى ' + termName(dst, to), 'Moved to ' + termName(dst, to))); return;
      }
      if ((el = e.target.closest('[data-act="predict"]'))) { predictFromRecord(); return; }
      if ((el = e.target.closest('[data-scen]'))) {
        scenario = el.getAttribute('data-scen');
        $$('[data-scen]').forEach(function (b) { b.classList.toggle('is-on', b === el); });
        renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      if ((el = e.target.closest('[data-del]'))) { removeCourse(el.getAttribute('data-del')); return; }
      if ((el = e.target.closest('[data-act="wi-clear"]'))) { whatIf = {}; render(); return; }
      if ((el = e.target.closest('[data-act="add"]'))) {
        pickerQ = ''; $('#pick-search').value = ''; renderPicker();
        $('#modal-add').hidden = false; $('#pick-search').focus(); return;
      }
      if ((el = e.target.closest('[data-add]'))) { $('#modal-add').hidden = true; addCatalogCourse(el.getAttribute('data-add')); return; }
      if ((el = e.target.closest('[data-act="manual"]'))) { $('#modal-add').hidden = true; $('#modal-manual').hidden = false; return; }
      if ((el = e.target.closest('[data-act="manual-confirm"]'))) { addManualCourse(); return; }
      if ((el = e.target.closest('[data-edit]'))) { openEditor(el.getAttribute('data-edit')); return; }
      if ((el = e.target.closest('[data-ed-del]'))) { el.closest('.gp-ed-row').remove(); return; }
      if ((el = e.target.closest('[data-act="ed-save"]'))) { saveEditor(); return; }
      if ((el = e.target.closest('[data-act="ed-delete"]'))) { deleteRecord(); return; }
      /*@3.GPAJ.96*/
      if ((el = e.target.closest('[data-act="close"]')) || e.target.classList.contains('gp-overlay')) {
        $$('.gp-overlay:not(.gs-overlay)').forEach(function (o) { o.hidden = true; }); return;
      }
      if ((el = e.target.closest('[data-act="planner"]'))) {
        if (window.GardenSetup && GardenSetup.openPlanner) GardenSetup.openPlanner();
        else toast(L('المعالج غير متاح', 'Wizard unavailable'));
        return;
      }
      if ((el = e.target.closest('[data-act="archwiz"]'))) {
        if (window.GardenSetup && GardenSetup.openArchive) GardenSetup.openArchive();
        else toast(L('المعالج غير متاح', 'Wizard unavailable'));
        return;
      }
      if ((el = e.target.closest('[data-act="wizard"]'))) {
        if (window.Onboarding && window.Onboarding.open) window.Onboarding.open();
        else toast(L('المعالج غير متاح', 'Wizard unavailable'));
        return;
      }
      if ((el = e.target.closest('[data-del-sem]'))) {
        var p = plan(); p.semesters.splice(+el.getAttribute('data-del-sem'), 1);
        savePlan(p); renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      if ((el = e.target.closest('[data-del-pl]'))) {
        var ix = el.getAttribute('data-del-pl').split(','), p2 = plan();
        p2.semesters[+ix[0]].courses.splice(+ix[1], 1);
        savePlan(p2); renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      if ((el = e.target.closest('[data-add-pl]'))) {
        var p3 = plan(); p3.semesters[+el.getAttribute('data-add-pl')].courses.push(
          { name: L('مادة جديدة', 'New course'), credits: 3, grade: 'B+' });
        savePlan(p3); renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      if ((el = e.target.closest('[data-act="add-sem"]'))) {
        var p4 = plan();
        p4.semesters.push({ name: L('فصل مخطّط', 'Planned term'),
                            courses: [{ name: L('مادة', 'Course'), credits: 3, grade: 'B+' }] });
        savePlan(p4); renderPlan(); renderChart(); renderTarget(); renderHonour(); return;
      }
      if ((el = e.target.closest('[data-act="png"]'))) { runExport('png'); return; }
      if ((el = e.target.closest('[data-act="pdf"]'))) { runExport('pdf'); return; }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $$('.gp-overlay:not(.gs-overlay)').forEach(function (o) { o.hidden = true; });
    });

    var rz = null;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { renderChart(); syncMarquee(); }, 160);
    });
    /*@3.GPAJ.97*/
    document.addEventListener('focusin', function (e) {
      if (e.target.classList && e.target.classList.contains('gp-mq')) e.target.classList.remove('is-mq');
    });
    document.addEventListener('focusout', function (e) {
      if (e.target.classList && e.target.classList.contains('gp-mq')) setTimeout(syncMarquee, 60);
    });
  }

  /*@3.GPAJ.98*/
  function init() {
    fetch(CATALOG_PATH).then(function (r) { return r.json(); }).then(function (j) {
      catalogArr = j.courses || [];
      catalogArr.forEach(function (c) { catalogMap[c.code] = c; });
    }).catch(function (e) {
      console.error('[gpa] courses_catalog.json fetch failed:', e);
    }).then(function () {
      semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null');
      archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');
      gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || 'null');
      if (!gradesData) gradesData = { semesters: [], updated_at: new Date().toISOString() };

      /*@3.GPAJ.102*/
      var fixed = null;
      try {
        if (window.GardenData && GardenData.dedupeArchive) fixed = GardenData.dedupeArchive();
      } catch (e) { fixed = null; }
      if (fixed && fixed.removed) archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');

      syncCurrentSemester();
      normalizeCurrentFlag();
      syncArchivedSemesters();

      render();
      bindEvents();
      if (fixed && fixed.removed) {
        toast(L('صُحِّح سجلُّك: حُذفت ' + fixed.removed + ' مادّةً مكرّرة' +
                  (fixed.lifted ? ' ونُقلت ' + fixed.lifted + ' درجة' : '') + '.',
                'Record repaired: ' + fixed.removed + ' duplicate course' +
                  (fixed.removed > 1 ? 's' : '') + ' removed' +
                  (fixed.lifted ? ', ' + fixed.lifted + ' grade(s) carried over' : '') + '.'), 9000);
      }

      document.addEventListener('garden:languageChanged', render);
      document.addEventListener('garden:planChanged', function () {
        renderPlan(false); renderChart(); renderTarget(); renderHonour();
      });
      document.addEventListener('garden:gradesChanged', function () {
        archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');
        gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || 'null') || gradesData;
        render();
      });
      /*@3.GPAJ.99*/
      document.addEventListener('garden:onboardingDone', function () {
        semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null');
        archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');
        gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || 'null') || gradesData;
        syncCurrentSemester(); normalizeCurrentFlag(); syncArchivedSemesters();
        render();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
