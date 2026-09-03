/*@3.SCHJ.1*/
;(function () {
  'use strict';

  var LS_KEY = 'weekly_schedule';
  var LS_SEMESTER = 'my_semester';
  var CATALOG_PATH = '../shared/data/courses_catalog.json';

  /*@3.SCHJ.2*/
  var HOUR_PX_MIN = 44;      /*@3.SCHJ.3*/
  var HOUR_PX_MAX = 56;      /*@3.SCHJ.4*/
  var HOUR_PX_DEF = 56;      /*@3.SCHJ.5*/
  /*@3.SCHJ.293*/
  var HOUR_PX_STRETCH = 110;
  var HOUR_PX_COMFY = 64;
  var GAP_PX_MAX = 96;
  var PANEL_MIN_PX = 320;
  var stripH = 0;
  var GAP_PX = 34;           /*@3.SCHJ.6*/
  var LABEL_TAIL_PX = 8;     /*@3.SCHJ.7*/
  var GUT_PX = 66;
  var MIN_EMPTY_RUN = 2;
  var MIN_GAP_HOURS = 2;     /*@3.SCHJ.8*/
  var MIN_EV_PX = 22;        /*@3.SCHJ.9*/

  var axis = null;                 /*@3.SCHJ.10*/
  var expandedGaps = Object.create(null);  /*@3.SCHJ.11*/

  var DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var DAY_NAMES = {
    ar: { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' },
    en: { sunday:'Sunday', monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' }
  };
  var DAY_SHORT = {
    ar: { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' },
    en: { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }
  };
  /*@3.SCHJ.12*/
  var DAY_MIN = {
    ar: { sunday:'أحد', monday:'اثن', tuesday:'ثلا', wednesday:'أرب', thursday:'خمي', friday:'جمع', saturday:'سبت' },
    en: { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }
  };
  var MONTH_NAMES = {
    ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };

  /*@3.SCHJ.13*/
  var KIND_ICON = {
    lecture:   'fa-chalkboard-user',
    study:     'fa-book-open',
    exam:      'fa-file-pen',
    general:   'fa-bookmark',
    intensive: 'fa-bolt'
  };
  var LEC_FORM = { lecture: { ar:'محاضرة', en:'Lecture' }, lab: { ar:'معمل', en:'Lab' } };
  var ATTEND   = { in_person: { ar:'حضوري', en:'In-person' }, remote: { ar:'عن بُعد', en:'Remote' } };
  var STUDY_KIND = {
    study:  { ar:'مذاكرة', en:'Study' },
    review: { ar:'مراجعة', en:'Review' },
    custom: { ar:'أخرى',   en:'Other' }
  };
  var EXAM_KIND = {
    exam:    { ar:'اختبار', en:'Exam' },
    midterm: { ar:'نصفي',  en:'Midterm' },
    final:   { ar:'نهائي', en:'Final' },
    quiz:    { ar:'كويز',  en:'Quiz' }
  };
  /*@3.SCHJ.14*/
  var GEN_KIND = {
    task:  { ar:'مهمة', en:'Task' },
    event: { ar:'حدث',  en:'Event' }
  };

  /*@3.SCHJ.15*/
  var schedule = null;
  var semester = null;
  var catalog = null;

  var currentWeekStart = null;
  var currentMonthDate = null;
  var currentDayDate = null;
  var currentView = 'week';       /*@3.SCHJ.16*/
  var agendaOn = false;           /*@3.SCHJ.17*/
  var dayFocusFilter = false;     /*@3.SCHJ.18*/
  var editingEvent = null;
  var sheetEvent = null;
  var didAutoScroll = false;
  var nowTimer = null;

  /*@3.SCHJ.19*/
  var counters = { deadlines: 0, weekEvents: 0, renders: 0 };
  var pass = null;   /*@3.SCHJ.20*/

  /*@3.SCHJ.21*/
  var TP = (function () {
    function pad(n) { return String(n).padStart(2, '0'); }
    function mer(am) { return isAr() ? (am ? 'ص' : 'م') : (am ? 'AM' : 'PM'); }
    function to12(v) {
      var p = String(v || '15:00').split(':');
      var H = parseInt(p[0], 10) || 0, m = parseInt(p[1], 10) || 0;
      var h = H % 12; if (!h) h = 12;
      return { h: h, m: m, am: H < 12 };
    }
    function to24(h, m, isAM) {
      h = parseInt(h, 10) % 12;
      if (!isAM) h += 12;
      return pad(h) + ':' + pad(m);
    }
    function apply(tp, val) {
      var t = to12(val);
      tp.querySelector('.tp-h').value = t.h;
      tp.querySelector('.tp-m').value = t.m;
      tp.querySelector('.tp-mer').value = t.am ? 'am' : 'pm';
      /*@3.SCHJ.22*/
      if (window.GardenSelect) GardenSelect.sync(tp);
    }
    function sync(tp) {
      var hid = tp.querySelector('input[type=hidden]');
      hid.value = to24(tp.querySelector('.tp-h').value, tp.querySelector('.tp-m').value,
                       tp.querySelector('.tp-mer').value === 'am');
    }
    function build(root) {
      (root || document).querySelectorAll('.sch-timepick').forEach(function (tp) {
        var hs = tp.querySelector('.tp-h'), ms = tp.querySelector('.tp-m');
        var hid = tp.querySelector('input[type=hidden]');
        if (hs.dataset.built) { relabel(tp); return; }
        hs.dataset.built = '1';
        var i, o;
        for (i = 1; i <= 12; i++) { o = document.createElement('option'); o.value = i; o.textContent = i; hs.appendChild(o); }
        for (i = 0; i < 60; i++) { o = document.createElement('option'); o.value = i; o.textContent = pad(i); ms.appendChild(o); }
        /*@3.SCHJ.23*/
        relabel(tp);
        apply(tp, hid.value || '15:00');
        tp.addEventListener('change', function () { sync(tp); });
      });
    }
    /*@3.SCHJ.24*/
    function relabel(tp) {
      var sel = tp.querySelector('.tp-mer');
      if (!sel) return;
      var keep = sel.value;
      sel.innerHTML = '<option value="am">' + mer(true) + '</option><option value="pm">' + mer(false) + '</option>';
      if (keep) sel.value = keep;
    }
    function relabelAll() { document.querySelectorAll('.sch-timepick').forEach(relabel); }
    function set(id, val) { setEl(document.getElementById(id), val); }
    function setEl(hid, val) {
      if (!hid) return;
      hid.value = val;
      var tp = hid.closest('.sch-timepick');
      if (tp) apply(tp, val);
    }
    return { build: build, set: set, setEl: setEl, relabelAll: relabelAll };
  })();

  /*@3.SCHJ.25*/
  function defaultSchedule() {
    return {
      version: 3,
      settings: {
        /*@3.SCHJ.26*/
        active_days: DAYS_ORDER.slice(),
        day_start_hour: 15,          /*@3.SCHJ.27*/
        day_end_hour: 22,            /*@3.SCHJ.28*/
        slot_duration_minutes: 30,   /*@3.SCHJ.29*/
        reminder_lead: 0,
        term_start_date: '',
        term_type: 'normal',
        semester_end_date: '',
        /*@3.SCHJ.30*/
        term_auto: null,
        term_rejected: null,
        focus_periods: { midterm: { start:'', end:'' }, final: { start:'', end:'' } },
        onboarded: false,
        span_mode: 'study',          /*@3.SCHJ.31*/
        collapse_gaps: true,         /*@3.SCHJ.286*/
        agenda: false,
        course_filter: [],           /*@3.SCHJ.32*/
        legacy_notice_seen: false
      },
      lectures: [],
      study_blocks: [],
      exams: [],
      general_events: [],
      week_overrides: {},
      archived: {},
      intensive: { active: null, plans: {}, module_status: {}, updated_at: null },
      updated_at: new Date().toISOString()
    };
  }

  /*@3.SCHJ.33*/
  function migrateSchedule(s) {
    var d = defaultSchedule();
    if (!s || typeof s !== 'object') return d;

    var st = s.settings;
    if (!st || typeof st !== 'object') st = s.settings = {};
    Object.keys(d.settings).forEach(function (k) { if (st[k] === undefined) st[k] = d.settings[k]; });
    if (!Array.isArray(st.active_days) || !st.active_days.length) st.active_days = d.settings.active_days.slice();
    /*@3.SCHJ.34*/
    var MIGR_KEY = 'sch_days_v3';
    var migrated = false;
    try { migrated = localStorage.getItem(MIGR_KEY) === '1'; } catch (e) {}
    if (!migrated) {
      var LEGACY = 'sunday,monday,tuesday,wednesday,thursday';
      if (st.active_days.slice().sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); }).join(',') === LEGACY) {
        st.active_days = DAYS_ORDER.slice();
      }
      delete st.show_rest_days;
      s.version = 3;
      try { localStorage.setItem(MIGR_KEY, '1'); } catch (e) {}
      s.__needsSave = true;
    }
    if (!st.focus_periods || typeof st.focus_periods !== 'object') st.focus_periods = { midterm:{start:'',end:''}, final:{start:'',end:''} };
    if (!st.focus_periods.midterm) st.focus_periods.midterm = { start:'', end:'' };
    if (!st.focus_periods.final) st.focus_periods.final = { start:'', end:'' };
    if (typeof st.day_start_hour !== 'number' || st.day_start_hour < 0 || st.day_start_hour > 23) st.day_start_hour = d.settings.day_start_hour;
    if (typeof st.day_end_hour !== 'number' || st.day_end_hour < 1 || st.day_end_hour > 24 || st.day_end_hour <= st.day_start_hour) st.day_end_hour = d.settings.day_end_hour;
    if (!Array.isArray(st.course_filter)) st.course_filter = [];
    if (st.span_mode !== 'study' && st.span_mode !== 'full') st.span_mode = 'study';
    if (typeof st.collapse_gaps !== 'boolean') st.collapse_gaps = true;

    if (!Array.isArray(s.lectures)) s.lectures = [];
    if (!Array.isArray(s.study_blocks)) s.study_blocks = [];
    if (!Array.isArray(s.exams)) s.exams = [];
    if (!Array.isArray(s.general_events)) s.general_events = [];
    if (!s.week_overrides || typeof s.week_overrides !== 'object') s.week_overrides = {};
    if (!s.archived || typeof s.archived !== 'object') s.archived = {};
    if (!s.intensive || typeof s.intensive !== 'object') s.intensive = { active:null, plans:{}, module_status:{}, updated_at:null };
    if (!s.intensive.plans || typeof s.intensive.plans !== 'object') s.intensive.plans = {};
    if (!s.intensive.module_status || typeof s.intensive.module_status !== 'object') s.intensive.module_status = {};

    if (s.version !== 2) {
      /*@3.SCHJ.35*/
      s.lectures.forEach(function (l) {
        if (!l.kind) l.kind = (l.type === 'lab') ? 'lab' : 'lecture';
        if (!l.attendance) l.attendance = 'in_person';
        delete l.type;
      });
      /*@3.SCHJ.36*/
      s.study_blocks.forEach(function (b) {
        if (!b.kind) b.kind = (b.type === 'review' || b.type === 'flashcards') ? 'review' : 'study';
        if (b.kind === 'flashcards') b.kind = 'review';
        if (!b.custom_label) b.custom_label = '';
        delete b.type;
      });
      /*@3.SCHJ.37*/
      try {
        var oldSpan = localStorage.getItem('sch_span');
        if (oldSpan === 'full') st.span_mode = 'full';
        else if (oldSpan === 'study' || oldSpan === 'compact') st.span_mode = 'study';
        if (oldSpan) localStorage.removeItem('sch_span');
      } catch (e) {}
      s.version = 2;
    }
    /*@3.SCHJ.38*/
    s.lectures.forEach(function (l) { if (!l.kind) l.kind = 'lecture'; if (!l.attendance) l.attendance = 'in_person'; });
    s.study_blocks.forEach(function (b) { if (!b.kind) b.kind = 'study'; });

    if (!s.updated_at) s.updated_at = new Date().toISOString();
    return s;
  }

  function save() {
    schedule.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS_KEY, JSON.stringify(schedule)); } catch (e) {}
    window.GardenEv('sched_edit', { n: (schedule.entries || []).length });
    if (window.GardenScheduleRules) GardenScheduleRules.announce('schedule');
  }

  /*@3.SCHJ.39*/
  var semesterDirty = false;
  function saveSemester() {
    if (!semester) return false;
    semester.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS_SEMESTER, JSON.stringify(semester)); } catch (e) { return false; }
    try { localStorage.setItem('__syncT_' + LS_SEMESTER, String(Date.now())); } catch (e) {}
    return true;
  }

  /*@3.SCHJ.40*/
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(o) { return o ? (isAr() ? o.ar : o.en) : ''; }
  function escapeH(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }
  /*@3.SCHJ.41*/
  function fmtLocalDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseLocalDate(s) {
    var p = String(s).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function isSameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  /*@3.SCHJ.42*/
  function parseHM(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t == null ? '' : t).trim());
    if (!m) return null;
    var h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function minToHM24(min) {
    min = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  }
  function fmtTime12(v) {
    var p = String(v || '').split(':');
    var H = parseInt(p[0], 10);
    if (isNaN(H)) return v || '';
    var m = p[1] || '00';
    var suf = H < 12 ? (isAr() ? 'ص' : 'AM') : (isAr() ? 'م' : 'PM');
    var h = H % 12; if (!h) h = 12;
    return isAr() ? (h + ':' + m + ' ' + suf) : (h + ':' + m + ' ' + suf);
  }
  function fmtMin12(min) { return fmtTime12(minToHM24(min)); }
  function addMinutes(t, min) {
    var p = (t || '15:00').split(':');
    return minToHM24(parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10) + min);
  }

  function getWeekId(date) {
    var d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
  }
  function getWeekStartDate(date) {
    var d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());   /*@3.SCHJ.43*/
    return d;
  }

  /*@3.SCHJ.44*/
  function addMonthsStr(dateStr, n) {
    var d = parseLocalDate(dateStr);
    d.setMonth(d.getMonth() + n);
    return fmtLocalDate(d);
  }
  function detectTermType(dateStr) {
    var mo = parseInt(String(dateStr).split('-')[1], 10);
    return (mo >= 5 && mo <= 7) ? 'summer' : 'normal';
  }
  function computeTermEnd(startStr, type) {
    if (!startStr) return '';
    return addMonthsStr(startStr, type === 'summer' ? 3 : 4);
  }
  function studyWeekNumber(date) {
    var st = schedule.settings || {};
    if (!st.term_start_date) return null;
    var termStart = getWeekStartDate(parseLocalDate(st.term_start_date));
    var n = Math.round((getWeekStartDate(date) - termStart) / (7 * 86400000)) + 1;
    if (n < 1) return null;
    if (st.semester_end_date) {
      var endWk = getWeekStartDate(parseLocalDate(st.semester_end_date));
      var maxN = Math.round((endWk - termStart) / (7 * 86400000)) + 1;
      if (n > maxN) return null;
    }
    return n;
  }
  /*@3.SCHJ.45*/
  function inTermBounds(dateObj) {
    var st = schedule.settings || {};
    if (st.term_start_date && dateObj < parseLocalDate(st.term_start_date)) return false;
    if (st.semester_end_date && dateObj > parseLocalDate(st.semester_end_date)) return false;
    return true;
  }
  function syncTermRange() {
    var res = GardenData.syncTermRange(schedule, { save: false });
    if (res.changed) save();
    return res.conflict;
  }

  /*@3.SCHJ.233*/
  function bannerFocusRange() {
    var by = { midterm: [], final: [] };
    (schedule.exams || []).forEach(function (x) {
      if (!x || !x.sx_crn || !x.date) return;
      if (x.exam_type !== 'midterm' && x.exam_type !== 'final') return;
      by[x.exam_type].push(x.date);
    });
    var out = {};
    ['midterm', 'final'].forEach(function (k) {
      var ds = by[k].slice().sort();
      if (ds.length < 2) return;
      var a = parseLocalDate(ds[0]); a.setDate(a.getDate() - 1);
      var b = parseLocalDate(ds[ds.length - 1]); b.setDate(b.getDate() + 1);
      out[k] = { start: fmtLocalDate(a), end: fmtLocalDate(b) };
    });
    return out;
  }

  function focusIsManual(kind) {
    var st = schedule.settings || {};
    var cur = (st.focus_periods || {})[kind] || {};
    var auto = (st.focus_auto || {})[kind] || {};
    if (!cur.start && !cur.end) return false;
    return (cur.start || '') !== (auto.start || '') || (cur.end || '') !== (auto.end || '');
  }

  function syncFocusPeriods() {
    var r = bannerFocusRange();
    var kinds = Object.keys(r);
    if (!kinds.length) return null;
    var st = schedule.settings;
    if (!st.focus_periods) st.focus_periods = { midterm: {}, final: {} };
    var ask = {}, changed = false;

    kinds.forEach(function (k) {
      var want = r[k], cur = st.focus_periods[k] || {};
      if (focusIsManual(k)) {
        var rej = (st.focus_rejected || {})[k] || {};
        if ((rej.start || '') === want.start && (rej.end || '') === want.end) return;
        if (cur.start !== want.start || cur.end !== want.end) ask[k] = want;
        return;
      }
      if (cur.start !== want.start || cur.end !== want.end) {
        st.focus_periods[k] = { start: want.start, end: want.end };
        changed = true;
      }
    });

    if (changed || !st.focus_auto) {
      st.focus_auto = {};
      ['midterm', 'final'].forEach(function (k) {
        var v = st.focus_periods[k] || {};
        st.focus_auto[k] = { start: v.start || '', end: v.end || '' };
      });
      save();
    }
    return Object.keys(ask).length ? ask : null;
  }

  function weekFocus(weekStart) {
    var fp = (schedule.settings || {}).focus_periods || {};
    var s = getWeekStartDate(weekStart);
    var e = new Date(s); e.setDate(e.getDate() + 6);
    function overlaps(p) {
      if (!p || !p.start || !p.end) return false;
      return parseLocalDate(p.start) <= e && parseLocalDate(p.end) >= s;
    }
    if (overlaps(fp.midterm)) return { active: true, kind: 'midterm' };
    if (overlaps(fp.final)) return { active: true, kind: 'final' };
    return { active: false, kind: null };
  }

  /*@3.SCHJ.50*/
  function getCourseColor(code) {
    if (window.GardenData && GardenData.courseColor) {
      return GardenData.courseColor(code, semEntryOf(code));
    }
    if (!catalog || !catalog.courses) return '#a78bfa';
    var c = catalog.courses.filter(function (x) { return x.code === code; })[0];
    return c ? c.brand_color : '#a78bfa';
  }
  function semEntryOf(code) {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) {}
    var list = (sem && sem.courses) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].code === code) return list[i];
    }
    return null;
  }
  function courseShort(code) {
    if (!code) return '';
    if (String(code).indexOf('__CUSTOM_') === 0) {
      var sc = semester && semester.courses ? semester.courses.filter(function (c) { return c.code === code; })[0] : null;
      return sc ? (isAr() ? sc.name_ar : (sc.name_en || sc.name_ar)) : code;
    }
    return code;
  }
  function courseDisplayName(code) {
    if (!code) return '';
    if (String(code).indexOf('__CUSTOM_') === 0) return courseShort(code);
    var c = catalog && catalog.courses ? catalog.courses.filter(function (x) { return x.code === code; })[0] : null;
    return c ? (isAr() ? c.name_ar : c.name_en) : code;
  }
  function semesterCourses() { return (semester && semester.courses) ? semester.courses : []; }
  function activeCourseCodes() {
    return semesterCourses().map(function (c) { return c.code; });
  }
  /*@3.SCHJ.51*/
  function scheduleCourseCodes() {
    var seen = {}, out = [];
    activeCourseCodes().forEach(function (c) { if (!seen[c]) { seen[c] = 1; out.push(c); } });
    ['lectures','study_blocks','exams'].forEach(function (k) {
      (schedule[k] || []).forEach(function (e) {
        if (e.course_code && !seen[e.course_code]) { seen[e.course_code] = 1; out.push(e.course_code); }
      });
    });
    return out;
  }
  function isCourseHidden(code) {
    if (!code) return false;
    return (schedule.settings.course_filter || []).indexOf(code) !== -1;
  }

  /*@3.SCHJ.52*/
  function beginPass() { pass = { byDate: null, ov: {} }; }
  function endPass() { pass = null; }

  function overrideFor(weekId) {
    if (pass) {
      if (pass.ov[weekId] === undefined) pass.ov[weekId] = schedule.week_overrides[weekId] || {};
      return pass.ov[weekId];
    }
    return schedule.week_overrides[weekId] || {};
  }

  /*@3.SCHJ.53*/
  function deadlinesByDate() {
    if (pass && pass.byDate) return pass.byDate;
    var map = {};
    if (window.GardenData && window.GardenData.allDeadlines) {
      counters.deadlines++;
      var all = [];
      try { all = window.GardenData.allDeadlines() || []; } catch (e) { all = []; }
      all.forEach(function (d) {
        if (d.source === 'exam') return;      /*@3.SCHJ.54*/
        if (!d.due) return;
        var key = String(d.due).slice(0, 10);
        (map[key] = map[key] || []).push(d);
      });
    }
    if (pass) pass.byDate = map;
    return map;
  }

  function activePlan() {
    var it = schedule.intensive || {};
    return (it.active && it.plans && it.plans[it.active]) ? it.plans[it.active] : null;
  }

  /*@3.SCHJ.55*/
  function normalizeEvent(o) {
    o.color = o.course_code ? getCourseColor(o.course_code) : (o.color || '#a78bfa');
    if (o.start != null && o.end != null && o.end <= o.start) o.end = o.start + 30;
    return o;
  }

  /*@3.SCHJ.56*/
  function eventsOnDate(dateObj, opts) {
    opts = opts || {};
    counters.weekEvents++;
    var dstr = fmtLocalDate(dateObj);
    var dayName = DAYS_ORDER[dateObj.getDay()];
    var weekStart = getWeekStartDate(dateObj);
    var weekId = getWeekId(weekStart);
    var ov = overrideFor(weekId);
    var out = [];

    var withinTerm = inTermBounds(dateObj);
    var focus = weekFocus(weekStart);
    var lecturesHidden = focus.active && !ov.show_lectures;
    var cancelled = ov.cancelled_lectures || [];
    var doneIds = ov.completed_events || [];

    /*@3.SCHJ.57*/
    /*@3.SCHJ.232*/
    var RULES = window.GardenScheduleRules;
    if (withinTerm && !lecturesHidden) {
      schedule.lectures.forEach(function (l) {
        if (l.day !== dayName) return;
        if (cancelled.indexOf(l.id) !== -1) return;
        if (RULES && !RULES.lectureOn(l, dateObj).on) return;
        var s = parseHM(l.start_time);
        if (s === null) return;
        var e = parseHM(l.end_time);
        if (e === null || e <= s) e = s + (l.duration || 50);
        out.push(normalizeEvent({
          uid: 'lecture:' + l.id + ':' + dstr, id: l.id, src: 'lecture', kind: 'lecture',
          sub: l.kind || 'lecture', course_code: l.course_code,
          /*@3.SCHJ.58*/
          title: courseDisplayName(l.course_code), start: s, end: e, allDay: false,
          room: l.room || '', attendance: l.attendance || 'in_person',
          notes: l.notes || '', youtube: '', date: dstr, weekId: weekId,
          done: doneIds.indexOf(l.id) !== -1, recurring: true, raw: l
        }));
      });
    }

    /*@3.SCHJ.59*/
    schedule.study_blocks.forEach(function (b) {
      if (b.day !== dayName) return;
      var isRecurring = (b.week_id == null);
      if (isRecurring) {
        if (!withinTerm) return;
        if (b.excluded_weeks && b.excluded_weeks.indexOf(weekId) !== -1) return;
      } else if (b.week_id !== weekId) return;
      var s = parseHM(b.start_time);
      if (s === null) return;
      var mins = b.duration_minutes || 60;
      out.push(normalizeEvent({
        uid: 'study:' + b.id + ':' + dstr, id: b.id, src: 'study', kind: 'study',
        sub: b.kind || 'study', custom_label: b.custom_label || '',
        course_code: b.course_code, title: courseDisplayName(b.course_code),
        start: s, end: s + mins, allDay: false, room: '',
        notes: b.notes || '', youtube: b.youtube || '', date: dstr, weekId: weekId,
        done: doneIds.indexOf(b.id) !== -1, recurring: isRecurring, raw: b
      }));
    });

    /*@3.SCHJ.60*/
    (schedule.exams || []).forEach(function (x) {
      if (x.date !== dstr) return;
      /*@3.SCHJ.61*/
      var isAllDay = !!x.all_day && !x.start_time;
      var s = parseHM(x.start_time); if (s === null && !isAllDay) s = 15 * 60;
      var e = parseHM(x.end_time); if (!isAllDay && (e === null || e <= s)) e = s + 90;
      out.push(normalizeEvent({
        uid: 'exam:' + x.id, id: x.id, src: 'exam', kind: 'exam',
        sub: x.exam_type || 'exam', course_code: x.course_code,
        title: courseDisplayName(x.course_code),
        start: isAllDay ? null : s, end: isAllDay ? null : e, allDay: isAllDay,
        room: x.room || '', notes: x.notes || '', youtube: '', date: dstr, weekId: weekId,
        done: !!x.completed_at, recurring: false, raw: x
      }));
    });

    /*@3.SCHJ.62*/
    (schedule.general_events || []).forEach(function (g) {
      if (g.date !== dstr) return;
      var s = parseHM(g.start_time);
      out.push(normalizeEvent({
        uid: 'general:' + g.id, id: g.id, src: 'general', kind: 'general',
        sub: g.kind || 'event', course_code: g.course_code || '',
        title: g.title || L(GEN_KIND.event), start: s,
        end: (s === null ? null : s + (g.duration_minutes || 60)),
        allDay: (s === null), room: '', notes: g.notes || '', youtube: g.link || '',
        date: dstr, weekId: weekId, done: !!g.done, recurring: false, raw: g
      }));
    });

    /*@3.SCHJ.63*/
    var plan = activePlan();
    if (plan && plan.sessions) {
      /*@3.SCHJ.64*/
      var planEnd = '';
      Object.keys(plan.exam_dates || {}).forEach(function (c) {
        var xd = plan.exam_dates[c];
        if (xd && xd > planEnd) planEnd = xd;
      });
      plan.sessions.forEach(function (ss) {
        if (ss.date !== dstr) return;
        if (planEnd && ss.date > planEnd) return;
        var s = parseHM(ss.start_time);
        if (s === null) return;
        /*@3.SCHJ.65*/
        var mt = (window.GardenSchedulePlan && window.GardenSchedulePlan.moduleTitle)
          ? window.GardenSchedulePlan.moduleTitle(ss.course, ss.module) : '';
        out.push(normalizeEvent({
          uid: 'intensive:' + ss.id, id: ss.id, src: 'intensive', kind: 'intensive',
          sub: ss.kind || 'study', course_code: ss.course,
          title: mt || courseDisplayName(ss.course), module_title: mt,
          part: ss.part || 1, total_parts: ss.total_parts || 1, module: ss.module,
          start: s, end: s + (ss.minutes || 60), allDay: false, room: '',
          notes: ss.note || '', youtube: '', date: dstr, weekId: weekId,
          done: !!ss.done, recurring: false, raw: ss
        }));
      });
    }

    /*@3.SCHJ.66*/
    (deadlinesByDate()[dstr] || []).forEach(function (d) {
      var due = String(d.due || '');
      var hasTime = due.length > 10;
      var s = hasTime ? parseHM(due.slice(11, 16)) : null;
      out.push(normalizeEvent({
        uid: 'mirror:' + d.source + ':' + d.id, id: d.id, src: d.source, kind: 'general',
        sub: 'task', course_code: d.course || '',
        title: d.title || courseShort(d.course) || L(GEN_KIND.task),
        start: s, end: (s === null ? null : s + 60), allDay: (s === null),
        room: '', notes: d.note || '', youtube: '', date: dstr, weekId: weekId,
        done: !!d.done, editable: !!d.editable, recurring: false, raw: d
      }));
    });

    if (!opts.ignoreFilter) {
      out = out.filter(function (e) { return !isCourseHidden(e.course_code); });
    }
    out.sort(function (a, b) {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return (a.start || 0) - (b.start || 0);
    });
    return out;
  }

  function eventsForRange(fromDate, toDate, opts) {
    var out = [], d = new Date(fromDate);
    d.setHours(0,0,0,0);
    var end = new Date(toDate); end.setHours(0,0,0,0);
    while (d <= end) {
      out.push({ date: new Date(d), items: eventsOnDate(d, opts) });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  /*@3.SCHJ.67*/
  function isExpired(ev) {
    if (ev.start === null) return false;
    var d = parseLocalDate(ev.date);
    d.setMinutes(d.getMinutes() + (ev.end != null ? ev.end : ev.start + 60));
    return d.getTime() < Date.now();
  }
  function toggleDone(ev) {
    if (ev.src === 'exam') {
      var x = (schedule.exams || []).filter(function (e) { return e.id === ev.id; })[0];
      if (x) x.completed_at = x.completed_at ? null : new Date().toISOString();
      save();
    } else if (ev.src === 'general') {
      var g = (schedule.general_events || []).filter(function (e) { return e.id === ev.id; })[0];
      if (g) g.done = !g.done;
      save();
    } else if (ev.src === 'task') {
      if (window.GardenData && window.GardenData.toggleTask) window.GardenData.toggleTask(ev.id);
    } else if (ev.src === 'course') {
      /*@3.SCHJ.68*/
      if (window.GardenData && window.GardenData.toggleCourseDate) {
        window.GardenData.toggleCourseDate(ev.course_code, ev.id);
      }
    } else if (ev.src === 'intensive') {
      var p = activePlan();
      if (p) {
        var ss = p.sessions.filter(function (x) { return x.id === ev.id; })[0];
        if (ss) ss.done = !ss.done;
      }
      save();
    } else if (ev.src === 'lecture' || ev.src === 'study') {
      var ovv = schedule.week_overrides[ev.weekId] || (schedule.week_overrides[ev.weekId] = {});
      ovv.completed_events = ovv.completed_events || [];
      var i = ovv.completed_events.indexOf(ev.id);
      if (i === -1) ovv.completed_events.push(ev.id); else ovv.completed_events.splice(i, 1);
      save();
    }
    render();
  }

  /*@3.SCHJ.69*/
  function kindIcon(ev) { return KIND_ICON[ev.kind] || 'fa-bookmark'; }
  function subLabel(ev) {
    if (ev.kind === 'lecture') {
      var f = L(LEC_FORM[ev.sub] || LEC_FORM.lecture);
      var a = L(ATTEND[ev.attendance] || ATTEND.in_person);
      return f + ' · ' + a;
    }
    if (ev.kind === 'study') {
      if (ev.sub === 'custom' && ev.custom_label) return ev.custom_label;
      return L(STUDY_KIND[ev.sub] || STUDY_KIND.study);
    }
    if (ev.kind === 'exam') return L(EXAM_KIND[ev.sub] || EXAM_KIND.exam);
    if (ev.kind === 'intensive') {
      /*@3.SCHJ.70*/
      if (ev.sub === 'buffer') return (isAr() ? 'مراجعة ما قبل الاختبار' : 'Pre-exam review');
      var parts = [courseShort(ev.course_code)];
      if (ev.sub === 'spaced') parts.push(isAr() ? 'مراجعة متباعدة' : 'Spaced review');
      if (ev.module) parts.push((isAr() ? 'وحدة ' : 'M') + String(ev.module).replace(/^M/, ''));
      if (ev.total_parts > 1) {
        parts.push(isAr() ? ('الجلسة ' + ev.part + ' من ' + ev.total_parts)
                          : ('session ' + ev.part + ' of ' + ev.total_parts));
      }
      return parts.filter(Boolean).join(' · ');
    }
    return L(GEN_KIND[ev.sub] || GEN_KIND.event);
  }
  function evMeta(ev) {
    var parts = [subLabel(ev)];
    if (ev.room) parts.push(ev.room);
    return parts.filter(Boolean).join(' · ');
  }
  /*@3.SCHJ.71*/
  function evTitle(ev) {
    if (ev.kind === 'general') return ev.title || subLabel(ev);
    return ev.title || courseDisplayName(ev.course_code) || subLabel(ev);
  }
  /*@3.SCHJ.72*/
  function isCodeTitle(ev) {
    if (!ev.course_code) return false;
    return evTitle(ev) === courseShort(ev.course_code);
  }
  /*@3.SCHJ.73*/
  function codeCls(ev) { return isCodeTitle(ev) ? ' sch-code' : ''; }

  /*@3.SCHJ.74*/
  function createEventEl(ev, startH) {
    /*@3.SCHJ.75*/
    var top = axis.yFor(ev.start);
    /*@3.SCHJ.76*/
    var drawEnd = ev.end;
    if (ev.kind === 'lecture' && ev.start !== null && ev.end !== null) {
      var dur = ev.end - ev.start;
      if ((ev.end % 60) === 50 && (dur === 50 || dur === 110)) drawEnd = ev.end + 10;
    }
    var h = Math.max(MIN_EV_PX, axis.yFor(drawEnd) - top);
    var clipped = ev.start < axis.startH * 60;
    if (top < 0) { h += top; top = 0; clipped = true; }
    if (h < MIN_EV_PX) h = MIN_EV_PX;

    var cols = ev._cols || 1, col = ev._col || 0;
    var tier = (h < 34 || cols >= 3) ? 'xs' : (h < 62 ? 'sm' : 'md');
    var done = ev.done;
    var expired = !done && isExpired(ev);

    /*@3.SCHJ.77*/
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var isNow = !done && isSameDay(parseLocalDate(ev.date), now) &&
                nowMin >= ev.start && nowMin < ev.end;

    var el = document.createElement('div');
    el.className = 'sch-ev k-' + ev.kind + ' is-' + tier +
      (done ? ' is-done' : '') + (expired ? ' is-expired' : '') +
      (isNow ? ' is-now' : '') + (clipped ? ' is-clipped' : '');
    el.style.top = top + 'px';
    el.style.height = h + 'px';
    el.style.insetInlineStart = 'calc(' + (col * 100 / cols) + '% + 2px)';
    el.style.width = 'calc(' + (100 / cols) + '% - 4px)';
    el.style.setProperty('--event-color', ev.color);
    if (isNow) {
      var pct = Math.round((nowMin - ev.start) / Math.max(1, ev.end - ev.start) * 100);
      el.style.setProperty('--p', pct + '%');
      el.setAttribute('data-pct', pct);
    }

    var noteMark = (ev.notes || ev.youtube) ? '<span class="sch-ev-note"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i></span>' : '';
    var html = '<div class="sch-ev-head">' +
      '<i class="fa-solid ' + kindIcon(ev) + ' sch-ev-ico"></i>' +
      /*@3.SCHJ.78*/
      '<span class="sch-ev-title' + codeCls(ev) + '"><span class="sch-ev-tx">' +
      escapeH(evTitle(ev)) + '</span></span>' + noteMark + '</div>';
    /*@3.SCHJ.79*/
    if (tier !== 'xs') {
      html += '<div class="sch-ev-time"><span class="sch-ev-start">' + escapeH(fmtMin12(ev.start)) +
              '</span><span class="sch-ev-end"> – ' + escapeH(fmtMin12(ev.end)) + '</span></div>';
    }
    if (tier === 'md') html += '<div class="sch-ev-meta">' + escapeH(evMeta(ev)) + '</div>';
    html += '<button class="sch-ev-check' + (done ? ' is-done' : '') + '" type="button" aria-pressed="' + (done ? 'true' : 'false') +
            '" title="' + escapeH(done ? (isAr() ? 'إلغاء الإتمام' : 'Mark undone') : (isAr() ? 'إتمام' : 'Mark done')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></button>';
    el.innerHTML = html;

    el.querySelector('.sch-ev-check').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDone(ev);
    });
    el.setAttribute('data-uid', ev.uid);
    el.setAttribute('data-span', String(Math.max(5, (ev.end || 0) - (ev.start || 0))));
    if (canDragEv(ev)) el.setAttribute('data-drag', '1');
    EV_BY_UID[ev.uid] = ev;
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      /*@3.SCHJ.259*/
      if (el._sdrJust && Date.now() - el._sdrJust < 400) return;
      openSheet(ev);
    });
    return el;
  }

  /*@3.SCHJ.260*/
  var EV_BY_UID = {};

  function canDragEv(ev) {
    if (!ev || ev.allDay || ev.start == null) return false;
    if (ev.kind === 'intensive' || ev.src === 'intensive') return false;
    return ev.src === 'lecture' || ev.src === 'study' ||
           ev.src === 'exam' || ev.src === 'general';
  }

  function moveEvent(ev, dateStr, startMin) {
    var r = ev.raw;
    if (!r) return false;
    var span = Math.max(5, (ev.end || 0) - (ev.start || 0));
    var hm = function (m) {
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    };
    var d = parseLocalDate(dateStr);
    if (!d) return false;
    var dayName = DAYS_ORDER[d.getDay()];
    var sameDay = (ev.date === dateStr);
    if (sameDay && startMin === ev.start) return false;   /*@3.SCHJ.261*/

    if (ev.src === 'lecture') {
      r.day = dayName;
      r.start_time = hm(startMin);
      r.end_time = hm(startMin + span);
    } else if (ev.src === 'study') {
      if (r.week_id != null && !sameDay) r.week_id = getWeekId(getWeekStartDate(d));
      r.day = dayName;
      r.start_time = hm(startMin);
      r.duration_minutes = span;
    } else if (ev.src === 'exam') {
      r.date = dateStr;
      r.start_time = hm(startMin);
      r.end_time = hm(startMin + span);
      r.all_day = false;
    } else if (ev.src === 'general') {
      r.date = dateStr;
      r.start_time = hm(startMin);
      r.duration_minutes = span;
    } else return false;

    save();
    return true;
  }

  function dragWord(ev, dateStr) {
    if (!isAr()) {
      return (ev.recurring && ev.date !== dateStr)
        ? 'Moved every week to ' + dateStr : 'Moved';
    }
    return (ev.recurring && ev.date !== dateStr)
      ? 'نُقلت في كلِّ أسابيعها' : 'نُقلت';
  }

  /*@3.SCHJ.262*/
  var _sayT = null;
  function schSay(txt) {
    var el = document.getElementById('sch-say');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sch-say';
      el.className = 'sch-say';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = txt;
    el.classList.add('is-on');
    if (_sayT) clearTimeout(_sayT);
    _sayT = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  /*@3.SCHJ.264*/
  var _menuStop = null;
  function closeSchMenu() {
    var m = document.getElementById('sch-ctx');
    if (m) m.remove();
    if (_menuStop) { _menuStop(); _menuStop = null; }
  }

  function openSchMenu(o) {
    closeSchMenu();
    var ev = o.el ? EV_BY_UID[o.el.getAttribute('data-uid')] : null;
    var at = spotAt(o.x, o.y);
    var items = [];

    /*@3.SCHJ.271*/
    if (ev) {
      if (canDragEv(ev)) {
        items.push({ k: 'move', i: 'fa-up-down-left-right', ar: 'انقلْها بإصبعك', en: 'Move it' });
        items.push({ k: 'dur', i: 'fa-hourglass-half', ar: 'غيّرْ مدّتَها', en: 'Change duration' });
        items.push({ k: 'dup', i: 'fa-copy', ar: 'كرّرْها في يومٍ آخر', en: 'Repeat on another day' });
      }
      if (ev.recurring) {
        items.push({ k: 'endrec', i: 'fa-calendar-xmark',
                     ar: 'أنهِ تكرارَها من هنا', en: 'End repeat from here' });
      }
      if (ev.course_code && window.GardenData && GardenData.isRealCourse &&
          GardenData.isRealCourse(ev.course_code)) {
        items.push({ k: 'color', i: 'fa-palette', ar: 'لونُ المادّة', en: 'Course colour' });
        items.push({ k: 'course', i: 'fa-book-open', ar: 'افتحْ صفحةَ المادّة', en: 'Open the course' });
      }
    } else if (at) {
      /*@3.SCHJ.272*/
      if (CLIP_EV) {
        items.push({ k: 'paste', i: 'fa-paste',
                     ar: 'ألصقْ «' + evTitle(CLIP_EV) + '» هنا',
                     en: 'Paste “' + evTitle(CLIP_EV) + '” here' });
      }
      items.push({ k: 'onlyday', i: 'fa-calendar-day', ar: 'اعرضْ هذا اليومَ وحدَه', en: 'Show this day only' });
    }

    /*@3.SCHJ.287*/
    if (!ev) {
      if (items.length) items.push({ sep: true });
      displayItems().forEach(function (it) { items.push(it); });
    }
    if (!items.length) return;

    paintSchMenu(items, ev, at, o);
  }

  function displayItems() {
    var st = schedule.settings;
    var onGrid = (currentView !== 'month' && !agendaOn);
    var out = [];
    /*@3.SCHJ.290*/
    if (currentView === 'month' &&
        (currentMonthDate.getMonth() !== new Date().getMonth() ||
         currentMonthDate.getFullYear() !== new Date().getFullYear())) {
      out.push({ k: 'thismonth', i: 'fa-calendar-day',
                 ar: 'ارجعْ إلى الشهرِ الحاليّ', en: 'Back to this month' });
    }
    if (onGrid) {
      /*@3.SCHJ.311*/
      var sp = spanLabel();
      out.push({ k: 'span', i: sp.icon, ar: sp.ar, en: sp.en });
      var folded = st.collapse_gaps !== false;
      out.push({ k: 'gaps', i: folded ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center',
                 ar: folded ? 'أوقفْ اختصارَ الساعاتِ الفارغة' : 'اختصرِ الساعاتِ الفارغة',
                 en: folded ? 'Stop collapsing empty hours' : 'Collapse empty hours' });
    }
    out.push({ k: 'ics', i: 'fa-calendar-check',
               ar: 'الربطُ مع البلاك بورد', en: 'Link Blackboard' });
    out.push({ k: 'clean', i: 'fa-broom',
               ar: 'تنظيفُ الأحداث', en: 'Clean up events' });
    return out;
  }

  var CLIP_EV = null;      /*@3.SCHJ.273*/
  var DUR_MENU = [30, 50, 60, 90, 110, 120];

  function paintSchMenu(items, ev, at, o, head2) {
    var m = document.createElement('div');
    m.id = 'sch-ctx';
    m.className = 'sch-ctx';
    m.setAttribute('role', 'menu');
    var head = head2 || (ev ? evTitle(ev) + ' · ' + fmtMin12(ev.start)
      : at ? (DAY_NAMES[isAr() ? 'ar' : 'en'][DAYS_ORDER[parseLocalDate(at.date).getDay()]] +
              ' · ' + fmtMin12(at.min))
           : (isAr() ? 'عرضُ الجدول' : 'Schedule view'));
    m.innerHTML = '<div class="sch-ctx-h">' + escapeH(head) + '</div>' +
      items.map(function (it) {
        if (it.sep) return '<div class="sch-ctx-sep" role="separator"></div>';
        /*@3.SCHJ.291*/
        return '<button type="button" class="sch-ctx-i' + (it.danger ? ' is-danger' : '') +
          '" data-k="' + it.k + '"' + (it.tone ? ' style="--k:' + it.tone + '"' : '') +
          '><i class="fa-solid ' + it.i + '" aria-hidden="true"></i>' +
          '<span>' + escapeH(isAr() ? it.ar : it.en) + '</span></button>';
      }).join('') +
      '<button type="button" class="sch-ctx-i is-cancel" data-k="cancel">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i><span>' +
        escapeH(isAr() ? 'إلغاء' : 'Cancel') + '</span></button>';
    document.body.appendChild(m);

    /*@3.SCHJ.312*/
    var bn = document.querySelector('.bottom-nav');
    var bnH = (bn && getComputedStyle(bn).display !== 'none') ? bn.offsetHeight : 0;
    var lo = 8, hi = window.innerHeight - bnH - 8;
    var w = m.offsetWidth, h = m.offsetHeight;
    var lx = Math.max(8, Math.min(o.x - w / 2, window.innerWidth - w - 8));
    var ly = o.y + 12;
    if (ly + h > hi) ly = o.y - h - 12;
    if (ly < lo) ly = Math.max(lo, hi - h);
    m.style.left = lx + 'px';
    m.style.top = ly + 'px';
    requestAnimationFrame(function () { m.classList.add('is-on'); });

    function away(e) {
      if (m.contains(e.target)) return;
      document.removeEventListener('pointerdown', away, true);
      closeSchMenu();
    }
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', function esc(e) {
      if (e.key !== 'Escape') return;
      document.removeEventListener('keydown', esc, true);
      closeSchMenu();
    }, true);

    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      var k = b.getAttribute('data-k');
      document.removeEventListener('pointerdown', away, true);
      closeSchMenu();
      runSchMenu(k, ev, at, o);
    });
  }

  function spotAt(x, y) {
    var els = document.elementsFromPoint(x, y) || [];
    for (var i = 0; i < els.length; i++) {
      var c = els[i].closest ? els[i].closest('.sch-daycol') : null;
      if (!c) continue;
      var box = c.getBoundingClientRect();
      var min = Math.round(axis.minAt(Math.max(0, y - box.top)) / 5) * 5;
      return { date: c.getAttribute('data-date'), min: min };
    }
    return null;
  }

  function runSchMenu(k, ev, at, o) {
    if (k === 'cancel') return;

    if (k === 'gaps') {
      var fold = schedule.settings.collapse_gaps === false;
      schedule.settings.collapse_gaps = fold;
      expandedGaps = {};
      didAutoScroll = false;
      save(); render();
      schSay(fold ? (isAr() ? 'الساعاتُ الفارغةُ تُختصر' : 'Empty hours are collapsed')
                  : (isAr() ? 'اليومُ بمقياسٍ متّصل' : 'One continuous scale'));
      return;
    }
    if (k === 'span') { toggleSpan(); return; }
    if (k === 'thismonth') {
      currentMonthDate = new Date();
      render();
      schSay(isAr() ? 'الشهرُ الحاليّ' : 'This month');
      return;
    }
    if (k.indexOf('add-') === 0) {
      ({ 'add-lec': prepLectureModal, 'add-study': prepStudyModal,
         'add-exam': prepExamModal, 'add-gen': prepGeneralModal,
         'add-plan': function () {
           if (window.GardenSchedulePlan) GardenSchedulePlan.openWizard();
         } })[k]();
      return;
    }
    if (k === 'ics') { openEditor(); goEditorSec('ics'); return; }
    if (k === 'clean') { openPurge(); return; }

    /*@3.SCHJ.275*/
    if (k === 'move' && ev && o.el && window.GardenSchedDrag) {
      schSay(isAr() ? 'اضغطْ على الموضع الجديد — أو Escape للإلغاء'
                    : 'Tap the new spot — or press Escape to cancel');
      _menuStop = GardenSchedDrag.moveMode(dragCfg(), o.el, function (res) {
        _menuStop = null;
        if (!res) { schSay(isAr() ? 'أُلغي النقل' : 'Move cancelled'); return; }
        if (!moveEvent(ev, res.date, res.startMin)) { render(); return; }
        render();
        schSay(dragWord(ev, res.date));
      });
      return;
    }

    /*@3.SCHJ.276*/
    if (k === 'dur' && ev) {
      var cur = Math.max(5, (ev.end || 0) - (ev.start || 0));
      var list = DUR_MENU.map(function (n) {
        return { k: 'dur:' + n, i: n === cur ? 'fa-circle-dot' : 'fa-circle',
                 ar: n + ' دقيقة' + (n === cur ? ' (الآن)' : ''),
                 en: n + ' minutes' + (n === cur ? ' (now)' : '') };
      });
      paintSchMenu(list, ev, at, o, (isAr() ? 'مدّةُ ' : 'Duration · ') + evTitle(ev));
      return;
    }
    if (k.indexOf('dur:') === 0 && ev) {
      var mins = parseInt(k.slice(4), 10);
      if (setDuration(ev, mins)) {
        render();
        schSay(isAr() ? ('صارت ' + mins + ' دقيقة') : ('Now ' + mins + ' minutes'));
      }
      return;
    }

    /*@3.SCHJ.277*/
    if (k === 'dup' && ev && o.el && window.GardenSchedDrag) {
      CLIP_EV = ev;
      schSay(isAr() ? 'اضغطْ على الموضع الذي تريد نسخَها إليه'
                    : 'Tap where you want the copy');
      _menuStop = GardenSchedDrag.moveMode(dragCfg(), o.el, function (res) {
        _menuStop = null;
        if (!res) { schSay(isAr() ? 'أُلغي النسخ' : 'Copy cancelled'); return; }
        if (copyEvent(ev, res.date, res.startMin)) {
          render();
          schSay(isAr() ? 'نُسخت' : 'Copied');
        }
      });
      return;
    }
    if (k === 'paste' && at && CLIP_EV) {
      if (copyEvent(CLIP_EV, at.date, at.min)) {
        render();
        schSay(isAr() ? 'لُصقت' : 'Pasted');
      }
      return;
    }

    /*@3.SCHJ.278*/
    if (k === 'endrec' && ev) { endRecurrence(ev); return; }

    if (k === 'color' && ev) {
      /*@3.SCHJ.279*/
      if (window.GardenCourseColor) GardenCourseColor.open(ev.course_code);
      else schSay(isAr() ? 'منتقي الألوان غيرُ متاحٍ هنا' : 'The colour picker is unavailable here');
      return;
    }
    if (k === 'course' && ev && ev.course_code) {
      location.href = 'course.html?c=' + encodeURIComponent(ev.course_code);
      return;
    }
    if (k === 'onlyday' && at) {
      var dd = parseLocalDate(at.date);
      if (dd) { currentDayDate = dd; currentView = 'day'; render(); }
      return;
    }
  }

  /*@3.SCHJ.280*/
  function setDuration(ev, mins) {
    var r = ev.raw;
    if (!r || !(mins > 0)) return false;
    var hm = function (m) {
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    };
    if (ev.src === 'lecture' || ev.src === 'exam') r.end_time = hm(ev.start + mins);
    else if (ev.src === 'study' || ev.src === 'general') r.duration_minutes = mins;
    else return false;
    save();
    return true;
  }

  /*@3.SCHJ.281*/
  function copyEvent(ev, dateStr, startMin) {
    var r = ev.raw;
    if (!r) return false;
    var d = parseLocalDate(dateStr);
    if (!d) return false;
    var span = Math.max(5, (ev.end || 0) - (ev.start || 0));
    var hm = function (m) {
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    };
    var c = JSON.parse(JSON.stringify(r));
    c.id = ev.src + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    delete c.sx_crn; delete c.sx_slot; delete c.sx_snap;
    delete c.completed_at; delete c.done;
    if (ev.src === 'lecture') {
      c.day = DAYS_ORDER[d.getDay()];
      c.start_time = hm(startMin); c.end_time = hm(startMin + span);
      schedule.lectures.push(c);
    } else if (ev.src === 'study') {
      c.day = DAYS_ORDER[d.getDay()];
      c.start_time = hm(startMin); c.duration_minutes = span;
      if (c.week_id != null) c.week_id = getWeekId(getWeekStartDate(d));
      schedule.study_blocks.push(c);
    } else if (ev.src === 'exam') {
      c.date = dateStr; c.start_time = hm(startMin); c.end_time = hm(startMin + span);
      schedule.exams.push(c);
    } else if (ev.src === 'general') {
      c.date = dateStr; c.start_time = hm(startMin); c.duration_minutes = span;
      schedule.general_events.push(c);
    } else return false;
    save();
    return true;
  }

  /*@3.SCHJ.282*/
  function endRecurrence(ev) {
    var r = ev.raw;
    if (!r) return;
    var d = parseLocalDate(ev.date);
    if (!d) return;
    var prev = new Date(d); prev.setDate(prev.getDate() - 1);
    var to = fmtLocalDate(prev);
    if (ev.src === 'lecture' || ev.src === 'study') r.end_date = to;
    else return;
    save(); render();
    schSay(isAr() ? ('لن تتكرّر بعد ' + to) : ('Will not repeat after ' + to));
  }

  /*@3.SCHJ.283*/
  document.addEventListener('garden:courseColorChanged', function () {
    try { render(); } catch (e) {}
  });

  function fmtHM(min) {
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' +
           String(min % 60).padStart(2, '0');
  }

  /*@3.SCHJ.270*/
  function dragCfg() {
    var rng = effectiveRange();
    return {
      root: document.getElementById('grid-wrap'),
      colSel: '.sch-daycol',
      cardSel: '.sch-ev',
      snap: 5,
      startH: rng.startH,
      endH: rng.endH,
      minAt: function (y) { return axis.minAt(y); },
      yFor: function (m) { return axis.yFor(m); },
      spanOf: function (el) {
        var n = parseInt(el.getAttribute('data-span'), 10);
        return n > 0 ? n : null;
      },
      canDrag: function (el) { return el.getAttribute('data-drag') === '1'; },
      label: function (a, b) { return fmtMin12(a) + ' – ' + fmtMin12(b); },
    };
  }

  function wireDrag() {
    var wrap = document.getElementById('grid-wrap');
    if (!wrap || !window.GardenSchedDrag) return;
    var rng = effectiveRange();
    GardenSchedDrag.enable({
      root: wrap,
      onMenu: openSchMenu,
      colSel: '.sch-daycol',
      cardSel: '.sch-ev',
      snap: 5,
      startH: rng.startH,
      endH: rng.endH,
      /*@3.SCHJ.263*/
      minAt: function (y) { return axis.minAt(y); },
      yFor: function (m) { return axis.yFor(m); },
      spanOf: function (el) {
        var n = parseInt(el.getAttribute('data-span'), 10);
        return n > 0 ? n : null;
      },
      canDrag: function (el) { return el.getAttribute('data-drag') === '1'; },
      label: function (a, b) { return fmtMin12(a) + ' – ' + fmtMin12(b); },
      onDrop: function (o) {
        var ev = EV_BY_UID[o.el.getAttribute('data-uid')];
        o.el._sdrJust = Date.now();
        if (!ev) { render(); return; }
        if (!moveEvent(ev, o.date, o.startMin)) { render(); return; }
        render();
        schSay(dragWord(ev, o.date));
      },
    });
  }

  /*@3.SCHJ.80*/
  function computeOverlapColumns(list) {
    var evs = list.slice().sort(function (a, b) { return a.start - b.start || a.end - b.end; });
    var columns = [], cluster = [], clusterEnd = -1;
    function flush() {
      var n = 0;
      cluster.forEach(function (x) { n = Math.max(n, x._col + 1); });
      cluster.forEach(function (x) { x._cols = n; });
      cluster = []; columns = [];
    }
    evs.forEach(function (d) {
      if (cluster.length && d.start >= clusterEnd) flush();
      var placed = false;
      for (var i = 0; i < columns.length; i++) {
        if (columns[i] <= d.start) { columns[i] = d.end; d._col = i; placed = true; break; }
      }
      if (!placed) { d._col = columns.length; columns.push(d.end); }
      cluster.push(d);
      clusterEnd = Math.max(clusterEnd, d.end);
    });
    if (cluster.length) flush();
  }

  /*@3.SCHJ.81*/
  function effectiveRange() {
    var st = schedule.settings;
    if (st.span_mode === 'full') return { startH: 0, endH: 24 };
    return { startH: st.day_start_hour, endH: st.day_end_hour };
  }
  /*@3.SCHJ.310*/
  function spanLabel() {
    var full = schedule.settings.span_mode === 'full';
    return {
      full: full,
      icon: full ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center',
      ar: full ? 'صغّرِ الجدولَ إلى ساعاتِ الدراسة' : 'وسّعِ الجدولَ إلى اليومِ كامل',
      en: full ? 'Shrink to study hours' : 'Expand to the full day'
    };
  }

  /*@3.SCHJ.299*/
  function toggleSpan() {
    schedule.settings.span_mode = (schedule.settings.span_mode === 'study') ? 'full' : 'study';
    didAutoScroll = false;
    save(); render();
    schSay(schedule.settings.span_mode === 'full'
      ? (isAr() ? 'اليومُ كاملاً — من منتصفِ الليل إلى منتصفِه' : 'Full day — midnight to midnight')
      : (isAr() ? 'ساعاتُ الدراسةِ وحدَها' : 'Study hours only'));
  }

  /*@3.SCHJ.83*/
  function gapKey(from, to) { return from + '-' + to; }

  /*@3.SCHJ.296*/
  function busyMap(dates, startH, endH) {
    var hours = endH - startH;
    var busy = new Array(hours), i, k;
    for (i = 0; i < hours; i++) busy[i] = false;
    /*@3.SCHJ.84*/
    dates.forEach(function (d) {
      eventsOnDate(d).forEach(function (e) {
        if (e.allDay || e.start === null) return;
        var a = Math.max(startH * 60, e.start), b = Math.min(endH * 60, e.end);
        if (b <= a) return;
        for (var h = Math.floor(a / 60); h < Math.ceil(b / 60); h++) {
          if (h - startH >= 0 && h - startH < hours) busy[h - startH] = true;
        }
      });
    });
    /*@3.SCHJ.85*/
    if (hours > 0) { busy[0] = true; busy[hours - 1] = true; }
    var now = new Date();
    for (i = 0; i < dates.length; i++) {
      if (!isSameDay(dates[i], now)) continue;
      k = now.getHours() - startH;
      if (k >= 0 && k < hours) busy[k] = true;
      break;
    }
    return busy;
  }

  function emptyRuns(busy, startH) {
    var runs = [], i = 0;
    while (i < busy.length) {
      if (busy[i]) { i++; continue; }
      var j = i;
      while (j < busy.length && !busy[j]) j++;
      var f = startH + i, t = startH + j;
      if (j - i >= MIN_GAP_HOURS && !expandedGaps[gapKey(f, t)]) {
        runs.push({ key: gapKey(f, t), len: j - i });
      }
      i = j;
    }
    return runs;
  }

  function planFold(dates, startH, endH, budgetPx) {
    var hours = Math.max(1, endH - startH);
    if (schedule.settings.collapse_gaps === false) {
      return { set: null, shown: hours, folds: 0 };
    }
    var runs = emptyRuns(busyMap(dates, startH, endH), startH)
                 .sort(function (a, b) { return b.len - a.len; });
    var set = {}, shown = hours, n = 0;
    while (n < runs.length && (shown * HOUR_PX_MIN + n * GAP_PX) > budgetPx) {
      set[runs[n].key] = 1;
      shown -= runs[n].len;
      n++;
    }
    return { set: n ? set : null, shown: shown, folds: n };
  }

  function buildAxis(dates, startH, endH, hourPx, gapPx) {
    /*@3.SCHJ.302*/
    gapPx = gapPx || GAP_PX;
    var hours = endH - startH;
    var busy = busyMap(dates, startH, endH);
    var i;

    var segments = [], total = 0, run = 0;
    function pushHours(from, to) {
      if (to <= from) return;
      segments.push({ type: 'hours', from: from, to: to, top: total, px: (to - from) * hourPx });
      total += (to - from) * hourPx;
    }
    function pushGap(from, to) {
      segments.push({ type: 'gap', from: from, to: to, top: total, px: gapPx, key: gapKey(from, to) });
      total += gapPx;
    }

    /*@3.SCHJ.86*/
    var cursor = startH;
    i = 0;
    while (i < hours) {
      if (busy[i]) { i++; continue; }
      run = i;
      while (run < hours && !busy[run]) run++;
      var f = startH + i, t = startH + run;
      if (foldSet && foldSet[gapKey(f, t)] && !expandedGaps[gapKey(f, t)]) {
        pushHours(cursor, f);
        pushGap(f, t);
        cursor = t;
      }
      i = run;
    }
    pushHours(cursor, endH);

    function yFor(min) {
      for (var j = 0; j < segments.length; j++) {
        var s = segments[j];
        if (min < s.to * 60 || j === segments.length - 1) {
          var span = (s.to - s.from) * 60;
          var f = span ? (Math.min(Math.max(min, s.from * 60), s.to * 60) - s.from * 60) / span : 0;
          return s.top + f * s.px;
        }
      }
      return 0;
    }
    function minAt(y) {
      for (var j = 0; j < segments.length; j++) {
        var s = segments[j];
        if (y < s.top + s.px || j === segments.length - 1) {
          var f = s.px ? (y - s.top) / s.px : 0;
          return s.from * 60 + Math.min(Math.max(f, 0), 1) * (s.to - s.from) * 60;
        }
      }
      return startH * 60;
    }
    /*@3.SCHJ.87*/
    var shown = 0;
    segments.forEach(function (s) { if (s.type === 'hours') shown += (s.to - s.from); });

    return { segments: segments, totalH: total, hourPx: hourPx, startH: startH, endH: endH,
             shownHours: shown, yFor: yFor, minAt: minAt };
  }
  /*@3.SCHJ.88*/
  var foldSet = null;

  function computeHourPx(dates, startH, endH) {
    var wrap = document.getElementById('grid-wrap');
    if (!wrap) return HOUR_PX_DEF;

    var top = wrap.getBoundingClientRect().top;         /*@3.SCHJ.89*/
    var chrome = document.getElementById('head-row').offsetHeight +
                 (document.getElementById('allday-row').offsetHeight || 0);
    var bottomNav = document.querySelector('.bottom-nav');
    var navH = (bottomNav && getComputedStyle(bottomNav).display !== 'none') ? bottomNav.offsetHeight : 0;
    /*@3.SCHJ.90*/
    /*@3.SCHJ.304*/
    var strip = document.getElementById('day-strip');
    if (strip && getComputedStyle(strip).display !== 'none') stripH = strip.offsetHeight;
    var stripGap = (strip && getComputedStyle(strip).display !== 'none') ? 0 : stripH;
    var pad = parseFloat(getComputedStyle(document.querySelector('.sch-container')).paddingBottom) || 0;
    var reserve = Math.max(navH, pad) + 14;
    /*@3.SCHJ.91*/
    var box = window.innerHeight - top - reserve - stripGap;
    lastAvail = Math.max(PANEL_MIN_PX, box);
    /*@3.SCHJ.92*/
    var forHours = lastAvail - chrome - LABEL_TAIL_PX;

    var plan = planFold(dates, startH, endH, forHours);
    foldSet = plan.set;

    lastGapPx = GAP_PX;
    var px = Math.max(HOUR_PX_MIN, Math.min(HOUR_PX_COMFY,
               Math.floor((forHours - plan.folds * GAP_PX) / Math.max(1, plan.shown))));
    if (!plan.folds) {
      return Math.max(HOUR_PX_MIN, Math.min(HOUR_PX_STRETCH,
             Math.floor(forHours / Math.max(1, plan.shown))));
    }
    var slack = forHours - (plan.shown * px + plan.folds * GAP_PX);
    if (slack > 0) {
      lastGapPx = Math.min(GAP_PX_MAX, GAP_PX + Math.floor(slack / plan.folds));
      slack = forHours - (plan.shown * px + plan.folds * lastGapPx);
    }
    if (slack > 0) {
      px = Math.min(HOUR_PX_STRETCH,
           Math.floor((forHours - plan.folds * lastGapPx) / Math.max(1, plan.shown)));
    }
    return px;
  }
  var lastGapPx = GAP_PX;
  var lastAvail = 0;

  function gapLabel(hoursCount, fromH, toH) {
    var n = hoursCount, word;
    if (isAr()) {
      word = n === 1 ? 'ساعة فارغة' : n === 2 ? 'ساعتان فارغتان'
           : (n <= 10 ? n + ' ساعات فارغة' : n + ' ساعة فارغة');
      if (n === 1 || n === 2) word = (n === 1 ? 'ساعة فارغة' : 'ساعتان فارغتان');
    } else {
      word = n + (n === 1 ? ' hour free' : ' hours free');
    }
    return word + ' · ' + fmtMin12(fromH * 60) + ' – ' + fmtMin12(toH * 60);
  }

  /*@3.SCHJ.93*/
  function weekDays() {
    var ov = overrideFor(getWeekId(currentWeekStart));
    var days = (schedule.settings.active_days || []).slice();
    /*@3.SCHJ.94*/
    (ov.extra_days || []).forEach(function (d) { if (days.indexOf(d) === -1) days.push(d); });
    /*@3.SCHJ.95*/
    days.sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });
    return days.length ? days : DAYS_ORDER.slice();
  }

  /*@3.SCHJ.96*/
  var dayWinStart = null;

  function visibleCols() {
    var w = window.innerWidth;
    return w <= 640 ? 3 : (w <= 1024 ? 5 : 7);
  }
  function weekDateList() {
    return weekDays().map(function (d) {
      var dt = new Date(currentWeekStart);
      dt.setDate(dt.getDate() + DAYS_ORDER.indexOf(d));
      return dt;
    });
  }
  function windowDates() {
    var all = weekDateList();
    var n = Math.min(visibleCols(), all.length);
    if (n >= all.length) return { all: all, shown: all, start: 0, n: n, windowed: false };
    if (dayWinStart === null) {
      var idx = -1, now = new Date();
      all.forEach(function (d, i) { if (isSameDay(d, now)) idx = i; });
      if (idx === -1) idx = 0;
      dayWinStart = idx - Math.floor((n - 1) / 2);
    }
    dayWinStart = Math.max(0, Math.min(dayWinStart, all.length - n));
    return { all: all, shown: all.slice(dayWinStart, dayWinStart + n), start: dayWinStart, n: n, windowed: true };
  }
  /*@3.SCHJ.97*/
  function shiftDayWindow(delta) {
    var all = weekDateList();
    var n = Math.min(visibleCols(), all.length);
    if (n >= all.length) return;
    var next = (dayWinStart === null ? 0 : dayWinStart) + delta;
    if (next < 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      dayWinStart = null; didAutoScroll = false; render();
      dayWinStart = Math.max(0, weekDateList().length - n); render();
      return;
    }
    if (next > all.length - n) {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      dayWinStart = 0; didAutoScroll = false; render();
      return;
    }
    dayWinStart = next;
    render();
  }

  function renderDayStrip(info) {
    var strip = document.getElementById('day-strip');
    if (!strip) return;
    if (!info.windowed) { strip.style.display = 'none'; strip.innerHTML = ''; return; }
    strip.style.display = '';
    var lang = isAr() ? 'ar' : 'en';
    var now = new Date();
    strip.innerHTML = info.all.map(function (d, i) {
      var inWin = i >= info.start && i < info.start + info.n;
      var today = isSameDay(d, now);
      return '<button type="button" class="sch-strip-day' + (inWin ? ' is-in' : '') + (today ? ' is-today' : '') +
        '" data-i="' + i + '" title="' + escapeH(DAY_NAMES[lang][DAYS_ORDER[d.getDay()]]) + '">' +
        '<span class="sch-strip-dn">' + escapeH(DAY_MIN[lang][DAYS_ORDER[d.getDay()]]) + '</span>' +
        '<span class="sch-strip-num">' + d.getDate() + '</span></button>';
    }).join('');
    strip.querySelectorAll('.sch-strip-day').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-i'), 10);
        dayWinStart = i - Math.floor((info.n - 1) / 2);
        render();
      });
    });
  }

  /*@3.SCHJ.98*/
  function bindGridSwipe() {
    var body = document.getElementById('grid-body');
    if (!body || body.__swipeBound) return;
    body.__swipeBound = true;
    var x0 = 0, y0 = 0, active = false, fired = false;
    body.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      x0 = e.clientX; y0 = e.clientY; active = true; fired = false;
    });
    body.addEventListener('pointermove', function (e) {
      if (!active || fired) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dy) > 8) { active = false; return; }
      if (Math.abs(dx) < 12) return;
      fired = true; active = false;
      shiftDayWindow((dx > 0 ? -1 : 1) * (isAr() ? -1 : 1));
    });
    body.addEventListener('pointerup', function () { active = false; });
    body.addEventListener('pointercancel', function () { active = false; });
  }

  /*@3.SCHJ.99*/
  function durLabel(mins) {
    if (mins < 60) return mins + (isAr() ? ' د' : ' min');
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + (isAr() ? ' س' : 'h') + (m ? ' ' + m + (isAr() ? ' د' : 'm') : '');
  }
  /*@3.SCHJ.100*/
  var pulseLead = null, pulseAfter = null, pulseBound = false;
  function bindPulse() {
    if (pulseBound) return;
    var main = document.querySelector('#sch-pulse .sch-pulse-main');
    var next = document.getElementById('pulse-next');
    if (!main || !next) return;
    pulseBound = true;
    [[main, function () { return pulseLead; }], [next, function () { return pulseAfter; }]]
      .forEach(function (pair) {
        var el = pair[0], get = pair[1];
        el.addEventListener('click', function () { var e = get(); if (e) openSheet(e); });
        el.addEventListener('keydown', function (ev) {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          var e = get(); if (!e) return;
          ev.preventDefault(); openSheet(e);
        });
      });
  }
  /*@3.SCHJ.101*/
  function pulseHit(el, ev) {
    if (!el) return;
    el.classList.toggle('is-hit', !!ev);
    if (ev) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('title', isAr() ? 'افتح بطاقة الحدث' : 'Open event card');
    } else {
      el.removeAttribute('role'); el.removeAttribute('tabindex'); el.removeAttribute('title');
    }
  }

  /*@3.SCHJ.102*/
  function scopeDates() {
    var out = [], i;
    if (currentView === 'month') {
      var y = currentMonthDate.getFullYear(), m = currentMonthDate.getMonth();
      var last = new Date(y, m + 1, 0).getDate();
      for (i = 1; i <= last; i++) out.push(new Date(y, m, i));
    } else if (currentView === 'day') {
      out.push(new Date(currentDayDate));
    } else {
      for (i = 0; i < 7; i++) {
        var d = new Date(currentWeekStart); d.setDate(d.getDate() + i); out.push(d);
      }
    }
    return out;
  }

  function renderPulse(dates) {
    var box = document.getElementById('sch-pulse');
    if (!box) return;
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var current = null, upcoming = [], hours = 0, sessions = 0, exams = 0;

    dates.forEach(function (d) {
      var isToday = isSameDay(d, now);
      var future = d > new Date(now.getFullYear(), now.getMonth(), now.getDate());
      eventsOnDate(d).forEach(function (e) {
        if (e.allDay || e.start === null) return;
        sessions++;
        hours += (e.end - e.start) / 60;
        if (e.kind === 'exam') exams++;
        if (e.done) return;
        if (isToday && nowMin >= e.start && nowMin < e.end) current = { ev: e, date: d };
        else if (future || (isToday && e.start > nowMin)) upcoming.push({ ev: e, date: d, key: d.getTime() + e.start * 60000 });
      });
    });
    upcoming.sort(function (a, b) { return a.key - b.key; });

    var lead = current || upcoming[0] || null;
    var after = current ? upcoming[0] : upcoming[1];

    /*@3.SCHJ.103*/
    /*@3.SCHJ.292*/
    /*@3.SCHJ.303*/
    var today0 = new Date(); today0.setHours(0, 0, 0, 0);
    var offTerm = !inTermBounds(today0);
    box.style.display = '';
    box.classList.toggle('is-quiet', !sessions || offTerm);

    var kick = document.getElementById('pulse-kick');
    var title = document.getElementById('pulse-title');
    var sub = document.getElementById('pulse-sub');
    var barW = document.getElementById('pulse-bar-wrap');

    if (!lead || offTerm) {
      var st = quietState(dates, sessions);
      box.style.setProperty('--c', st.color);
      document.getElementById('pulse-orb').innerHTML = '<i class="fa-solid ' + st.icon + '"></i>';
      kick.textContent = st.kick;
      title.textContent = st.title;
      sub.innerHTML = st.sub;
      barW.hidden = true;
    }

    if (lead && !offTerm) {
      var e = lead.ev;
      box.style.setProperty('--c', e.color || '#a78bfa');
      document.getElementById('pulse-orb').innerHTML = '<i class="fa-solid ' + kindIcon(e) + '"></i>';
      kick.textContent = current ? (isAr() ? 'جارٍ الآن' : 'NOW') : (isAr() ? 'التالي' : 'NEXT');
      title.textContent = evTitle(e);
      var mins = current ? (e.end - nowMin)
               : Math.round((lead.date - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 60000 + e.start - nowMin);
      var when = current ? (isAr() ? 'بقي ' : 'left ') + durLabel(Math.max(0, mins))
                         : (isAr() ? 'يبدأ بعد ' : 'in ') + durLabel(Math.max(0, mins));
      var parts = ['<span>' + escapeH(fmtMin12(e.start) + ' – ' + fmtMin12(e.end)) + '</span>', '<b>' + escapeH(when) + '</b>'];
      if (e.room) parts.push('<span>' + escapeH(e.room) + '</span>');
      if (!isSameDay(lead.date, now)) parts.push('<span>' + escapeH(DAY_NAMES[isAr() ? 'ar' : 'en'][DAYS_ORDER[lead.date.getDay()]]) + '</span>');
      sub.innerHTML = parts.join('<span class="sep">·</span>');
      if (current) {
        barW.hidden = false;
        document.getElementById('pulse-bar').style.width =
          Math.round((nowMin - e.start) / Math.max(1, e.end - e.start) * 100) + '%';
      } else barW.hidden = true;
    }

    var pn = document.getElementById('pulse-next');
    if (offTerm) after = null;
    if (after) {
      pn.className = 'sch-pulse-next';
      pn.innerHTML = '<div class="sch-pn-kick">' + (isAr() ? 'التالي' : 'NEXT') + '</div>' +
        '<div class="sch-pn-row"><span class="sch-pn-rail" style="--c2:' + (after.ev.color || '#a78bfa') + '"></span>' +
        '<div class="sch-pn-txt"><div class="sch-pn-title">' + escapeH(evTitle(after.ev)) + '</div>' +
        '<div class="sch-pn-sub">' + escapeH(
          (isSameDay(after.date, now) ? (isAr() ? 'اليوم' : 'Today')
            : DAY_NAMES[isAr() ? 'ar' : 'en'][DAYS_ORDER[after.date.getDay()]]) +
          ' · ' + fmtMin12(after.ev.start)) + '</div></div></div>';
    } else {
      pn.className = 'sch-pulse-next is-empty';
      pn.innerHTML = '<div class="sch-pn-kick">' + (isAr() ? 'التالي' : 'NEXT') + '</div>' +
        '<div class="sch-pn-row"><div class="sch-pn-txt"><div class="sch-pn-title">' +
        (isAr() ? 'لا شيء بعده' : 'Nothing after') + '</div></div></div>';
    }

    /*@3.SCHJ.105*/
    pulseLead = (lead && !offTerm) ? lead.ev : null;
    pulseAfter = after ? after.ev : null;
    bindPulse();
    pulseHit(document.querySelector('#sch-pulse .sch-pulse-main'), pulseLead);
    pulseHit(document.getElementById('pulse-next'), pulseAfter);

    document.getElementById('pulse-stats').innerHTML =
      '<div class="sch-stat"><b>' + (Math.round(hours * 10) / 10) + '</b><span>' + (isAr() ? 'ساعة' : 'hours') + '</span></div>' +
      '<div class="sch-stat"><b>' + sessions + '</b><span>' + (isAr() ? 'حصة' : 'sessions') + '</span></div>' +
      (exams ? '<div class="sch-stat is-exam"><b>' + exams + '</b><span>' + (isAr() ? 'اختبار' : 'exams') + '</span></div>' : '');
  }

  function scheduleIsEmpty() {
    return !schedule.lectures.length && !schedule.study_blocks.length &&
           !schedule.exams.length && !schedule.general_events.length;
  }

  function nextAnywhere(fromDate, days) {
    var d = new Date(fromDate); d.setHours(0, 0, 0, 0);
    for (var i = 0; i < days; i++) {
      var list = eventsOnDate(d).filter(function (e) { return !e.done; });
      if (list.length) return { ev: list[0], date: new Date(d) };
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function quietState(dates, sessions) {
    var A = isAr();
    var line = function (x) { return '<span>' + escapeH(x) + '</span>'; };
    var scope = (currentView === 'day') ? 'day' : (currentView === 'month' ? 'month' : 'week');

    var ref = dates && dates.length ? dates[0] : new Date();
    var last = dates && dates.length ? dates[dates.length - 1] : ref;
    var anchor = new Date(); anchor.setHours(0, 0, 0, 0);
    var nxt = nextAnywhere(new Date(Math.max(anchor.getTime(), last.getTime())), 400);
    var when = nxt ? (DAY_NAMES[A ? 'ar' : 'en'][DAYS_ORDER[nxt.date.getDay()]] + ' · ' +
                      nxt.date.getDate() + ' ' + MONTH_NAMES[A ? 'ar' : 'en'][nxt.date.getMonth()]) : '';
    var nextLine = nxt ? line((A ? 'التالي: ' : 'Next: ') + evTitle(nxt.ev) + ' — ' + when) : null;

    if (!inTermBounds(anchor)) {
      var st0 = (schedule.settings || {}).term_start_date;
      var started = !st0 || anchor >= parseLocalDate(st0);
      if (started) {
        return { color: 'var(--text-muted)', icon: 'fa-flag-checkered',
                 kick: A ? 'طُويت الصفحة' : 'CHAPTER CLOSED',
                 title: A ? 'انتهى الفصل' : 'The term has ended',
                 sub: nextLine || line(A ? 'استرحْ — لا شيءَ مجدولٌ بعد اليوم'
                                         : 'Rest — nothing is scheduled from here') };
      }
      var s0 = st0 ? parseLocalDate(st0) : null;
      var startWord = s0 ? (DAY_NAMES[A ? 'ar' : 'en'][DAYS_ORDER[s0.getDay()]] + ' · ' +
                            s0.getDate() + ' ' + MONTH_NAMES[A ? 'ar' : 'en'][s0.getMonth()]) : '';
      return { color: 'var(--text-muted)', icon: 'fa-hourglass-start',
               kick: A ? 'على الأبواب' : 'ALMOST THERE',
               title: A ? 'لم يبدأِ الفصلُ بعد' : 'The term has not started',
               sub: s0 ? line((A ? 'يبدأ ' : 'Begins ') + startWord)
                       : (nextLine || line(A ? 'استعِدَّ على مهل' : 'Get set, no rush')) };
    }

    /*@3.SCHJ.305*/
    if (sessions) {
      var freeT = { day:   [A ? 'انتهى يومُك' : 'Your day is done',
                            A ? 'خُذْ نفَساً — لا شيءَ متبقٍّ' : 'Take a breath — nothing left'],
                    week:  [A ? 'أسبوعُك مكتمِل' : 'Your week is complete',
                            A ? 'كلُّ ما جُدول قد مضى' : 'Everything scheduled has passed'],
                    month: [A ? 'شهرٌ مضى كما خطّطتَ له' : 'A month went as you planned',
                            A ? 'لا شيءَ متبقٍّ فيه' : 'Nothing left in it'] }[scope];
      return { color: 'var(--st-ok, #10b981)', icon: 'fa-mug-hot',
               kick: A ? 'وقتٌ حرّ' : 'FREE',
               title: freeT[0], sub: nextLine || line(freeT[1]) };
    }

    if (scheduleIsEmpty()) {
      return { color: 'var(--st-accent, #a78bfa)', icon: 'fa-wand-magic-sparkles',
               kick: A ? 'ابدأْ من هنا' : 'START HERE',
               title: A ? 'جدولُك فارغ' : 'Your schedule is empty',
               sub: line(A ? 'اضغطْ على أيِّ فراغٍ في الشبكةِ لتضيفَ أوّلَ حدث'
                           : 'Tap any empty slot in the grid to add your first event') };
    }

    var blankT = { day:   A ? 'يومٌ بلا موعد'          : 'A day with nothing due',
                   week:  A ? 'أسبوعٌ خفيف'            : 'A light week',
                   month: A ? 'لا شيءَ في هذا الشهر'   : 'Nothing this month' }[scope];
    return { color: 'var(--text-muted)', icon: 'fa-calendar-day',
             kick: A ? 'صفحةٌ بيضاء' : 'BLANK PAGE',
             title: blankT,
             sub: nextLine || line(A ? 'ولا شيءَ بعده — أضِفْ حدثاً بالضغط على الشبكة'
                                     : 'And nothing after — add an event by tapping the grid') };
  }


  /*@3.SCHJ.106*/
  var introDone = false;
  function playIntro() {
    if (introDone) return;
    introDone = true;
    var c = document.querySelector('.sch-container');
    if (!c) return;
    c.classList.add('sch-anim');
    setTimeout(function () { c.classList.remove('sch-anim'); }, 2200);
  }

  function renderGrid(dates) {
    var wrap = document.getElementById('grid-wrap');
    /*@3.SCHJ.107*/
    wrap.style.display = '';
    var range = effectiveRange();
    var startH = range.startH, endH = range.endH;
    var activeDays = schedule.settings.active_days || [];
    var cols = GUT_PX + 'px repeat(' + dates.length + ', minmax(0,1fr))';

    /*@3.SCHJ.108*/
    var head = document.getElementById('head-row');
    head.style.gridTemplateColumns = cols;
    var sp = spanLabel();
    var spanTip = isAr() ? sp.ar : sp.en;
    var hh = '<div class="sch-head-gutter">' +
      '<button type="button" class="sch-span-corner" id="span-corner"' +
      ' aria-label="' + escapeH(spanTip) + '" title="' + escapeH(spanTip) + '"' +
      ' data-ar-title="' + escapeH(sp.ar) + '"' +
      ' data-en-title="' + escapeH(sp.en) + '">' +
      '<i class="fa-solid ' + sp.icon + '" aria-hidden="true"></i>' +
      '</button></div>';
    dates.forEach(function (d) {
      var nm = DAYS_ORDER[d.getDay()];
      var today = isSameDay(d, new Date());
      /*@3.SCHJ.109*/
      var busyMin = 0;
      eventsOnDate(d).forEach(function (e) {
        if (e.allDay || e.start === null) return;
        busyMin += Math.max(0, e.end - e.start);
      });
      var loadPct = Math.min(100, Math.round(busyMin / 300 * 100));
      hh += '<button class="sch-day-head' + (today ? ' today' : '') + (loadPct > 75 ? ' is-heavy' : '') +
            '" data-date="' + fmtLocalDate(d) + '" ' +
            'title="' + escapeH(isAr() ? 'عرض أجندة هذا اليوم' : 'Open this day\'s agenda') + '">' +
            escapeH(DAY_SHORT[isAr() ? 'ar' : 'en'][nm]) +
            '<span class="sch-dh-num">' + d.getDate() + '</span>' +
            '<span class="sch-dh-load"><i style="width:' + loadPct + '%"></i></span></button>';
    });
    head.innerHTML = hh;
    head.querySelectorAll('.sch-day-head').forEach(function (b) {
      b.addEventListener('click', function () { openDayAgenda(parseLocalDate(this.getAttribute('data-date'))); });
    });
    var sc = document.getElementById('span-corner');
    if (sc) sc.addEventListener('click', toggleSpan);

    /*@3.SCHJ.110*/
    var ad = document.getElementById('allday-row');
    ad.style.gridTemplateColumns = cols;
    var anyAllDay = false;
    var adh = '<div class="sch-allday-label">' + (isAr() ? 'طوال اليوم' : 'All-day') + '</div>';
    var allDayStore = {};
    dates.forEach(function (d) {
      var key = fmtLocalDate(d);
      var items = eventsOnDate(d).filter(function (e) { return e.allDay; });
      allDayStore[key] = items;
      /*@3.SCHJ.111*/
      adh += '<button class="sch-allday-cell" data-day="' + key + '" ' +
             'title="' + escapeH(isAr() ? 'مواعيد بلا وقت — افتح أجندة اليوم' : 'Untimed items — open the day agenda') + '">';
      items.slice(0, 8).forEach(function (e, i) {
        anyAllDay = true;
        var late = !e.done && parseLocalDate(e.date) < new Date(new Date().setHours(0,0,0,0));
        adh += '<span class="sch-adot' + (e.done ? ' is-done' : '') + (late ? ' is-late' : '') +
               '" style="--dot-color:' + e.color + '" data-d="' + key + '" data-i="' + i + '" ' +
               'title="' + escapeH(evTitle(e) + ' · ' + subLabel(e)) + '"></span>';
      });
      if (items.length > 8) adh += '<span class="sch-adot-more">+' + (items.length - 8) + '</span>';
      adh += '</button>';
    });
    ad.innerHTML = adh;
    ad.style.display = anyAllDay ? '' : 'none';
    ad.querySelectorAll('.sch-allday-cell').forEach(function (cell) {
      cell.addEventListener('click', function () { openDayAgenda(parseLocalDate(this.getAttribute('data-day'))); });
    });
    ad.querySelectorAll('.sch-adot').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var list = allDayStore[this.getAttribute('data-d')] || [];
        var it = list[parseInt(this.getAttribute('data-i'), 10)];
        if (it) openSheet(it);
      });
    });

    /*@3.SCHJ.112*/
    var body = document.getElementById('grid-body');
    body.style.gridTemplateColumns = cols;
    /*@3.SCHJ.306*/
    body.style.setProperty('--sch-gut', GUT_PX + 'px');
    body.innerHTML = '';

    /*@3.SCHJ.113*/
    axis = buildAxis(dates, startH, endH, computeHourPx(dates, startH, endH), lastGapPx);

    /*@3.SCHJ.295*/
    var innerAvail = lastAvail - document.getElementById('head-row').offsetHeight -
                     (anyAllDay ? ad.offsetHeight : 0) - LABEL_TAIL_PX;
    for (var pass = 0; pass < 3 && axis.totalH < innerAvail - 4; pass++) {
      var folds = axis.segments.filter(function (s) { return s.type === 'gap'; }).length;
      var shown = Math.max(1, axis.shownHours);
      var gp = lastGapPx, hp = axis.hourPx;
      var gpCap = Math.max(GAP_PX_MAX, Math.round(innerAvail * 0.42 / folds));
      if (folds && gp < gpCap) {
        gp = Math.min(gpCap, gp + Math.ceil((innerAvail - axis.totalH) / folds));
      }
      var left = innerAvail - folds * gp;
      hp = Math.max(hp, Math.min(HOUR_PX_STRETCH, Math.floor(left / shown)));
      if (hp === axis.hourPx && gp === lastGapPx) break;
      lastGapPx = gp;
      axis = buildAxis(dates, startH, endH, hp, gp);
    }
    var bodyH = axis.totalH;
    wrap.style.height = lastAvail + 'px';

    var gutter = document.createElement('div');
    gutter.className = 'sch-gutter';
    gutter.style.height = bodyH + 'px';
    /*@3.SCHJ.114*/
    var hours = [];
    axis.segments.forEach(function (s) {
      if (s.type !== 'hours') return;
      for (var h = s.from; h <= s.to; h++) hours.push(h);
    });
    var gh = '';
    hours.forEach(function (h, i) {
      var edge = i === 0 ? ' is-first' : (i === hours.length - 1 ? ' is-last' : '');
      gh += '<div class="sch-hour-label' + edge + '" style="top:' + axis.yFor(h * 60) + 'px">' +
            escapeH(fmtMin12(h % 24 * 60)) + '</div>';
    });
    gutter.innerHTML = gh;
    body.appendChild(gutter);

    /*@3.SCHJ.115*/
    var gapLayer = document.createElement('div');
    gapLayer.className = 'sch-gaplayer';
    gapLayer.style.height = bodyH + 'px';
    axis.segments.forEach(function (s) {
      if (s.type !== 'gap') return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sch-gapband';
      b.style.top = s.top + 'px';
      b.style.height = s.px + 'px';
      b.setAttribute('data-gap', s.key);
      b.innerHTML = '<i class="fa-solid fa-chevron-down"></i><span>' +
        escapeH(gapLabel(s.to - s.from, s.from, s.to)) + '</span>';
      b.title = isAr() ? 'اضغط لتوسيع هذه الفترة' : 'Tap to expand this range';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        expandedGaps[this.getAttribute('data-gap')] = true;
        render();
      });
      gapLayer.appendChild(b);
    });
    body.appendChild(gapLayer);

    dates.forEach(function (d, colIdx) {
      var nm = DAYS_ORDER[d.getDay()];
      var col = document.createElement('div');
      col.className = 'sch-daycol' + (activeDays.indexOf(nm) === -1 ? ' is-off' : '') +
        (isSameDay(d, new Date()) ? ' is-today' : '');
      col.style.setProperty('--i', colIdx);
      col.style.height = bodyH + 'px';
      col.setAttribute('data-date', fmtLocalDate(d));

      /*@3.SCHJ.116*/
      var lines = '';
      axis.segments.forEach(function (s) {
        if (s.type !== 'hours') return;
        for (var h = s.from; h <= s.to; h++) {
          lines += '<div class="sch-hourline" style="top:' + axis.yFor(h * 60) + 'px"></div>';
        }
      });
      /*@3.SCHJ.117*/
      var nowD = new Date();
      var veilTo = null;
      if (d < new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate())) veilTo = axis.totalH;
      else if (isSameDay(d, nowD)) veilTo = axis.yFor(nowD.getHours() * 60 + nowD.getMinutes());
      if (veilTo > 0) lines += '<div class="sch-pastveil" style="height:' + veilTo + 'px"></div>';
      col.innerHTML = lines;

      var all = eventsOnDate(d);
      var timed = all.filter(function (e) { return !e.allDay && e.start !== null; });
      var inRange = [], early = [], late = [];
      timed.forEach(function (e) {
        if (e.end <= startH * 60) early.push(e);
        else if (e.start >= endH * 60) late.push(e);
        else inRange.push(e);
      });
      computeOverlapColumns(inRange);
      inRange.forEach(function (e, evIdx) {
        var node = createEventEl(e, startH);
        node.style.setProperty('--i', colIdx);
        node.style.setProperty('--j', evIdx);
        col.appendChild(node);
      });

      /*@3.SCHJ.118*/
      [['early', early], ['late', late]].forEach(function (pair) {
        if (!pair[1].length) return;
        var box = document.createElement('div');
        box.className = 'sch-edge is-' + pair[0];
        pair[1].slice(0, 6).forEach(function (e) {
          var b = document.createElement('button');
          b.type = 'button';
          b.style.setProperty('--dot-color', e.color);
          b.title = fmtMin12(e.start) + ' · ' + evTitle(e) +
            ' — ' + (isAr() ? 'خارج المدى المعروض' : 'outside the shown range');
          b.addEventListener('click', function (clickEv) { clickEv.stopPropagation(); openSheet(e); });
          box.appendChild(b);
        });
        col.appendChild(box);
      });

      /*@3.SCHJ.119*/
      col.addEventListener('click', function (clickEv) {
        if (clickEv.target !== this) return;
        var rect = this.getBoundingClientRect();
        /*@3.SCHJ.120*/
        var mins = Math.round(axis.minAt(clickEv.clientY - rect.top) / 15) * 15;
        mins = Math.max(startH * 60, Math.min(endH * 60 - 30, mins));
        openAddModal(DAYS_ORDER[parseLocalDate(this.getAttribute('data-date')).getDay()],
                     minToHM24(mins), this.getAttribute('data-date'),
                     { x: clickEv.clientX, y: clickEv.clientY });
      });
      body.appendChild(col);
    });

    wrap.style.display = '';
    applyWidthTiers();
    drawNowLine(dates, startH, endH);
    autoScroll(dates, startH);
  }

  /*@3.SCHJ.121*/
  function applyWidthTiers() {
    var mq = [];
    document.querySelectorAll('#grid-body .sch-ev').forEach(function (el) {
      var w = el.getBoundingClientRect().width;
      el.classList.toggle('is-narrow', w < 104);
      el.classList.toggle('is-vnarrow', w < 62);
      var m = measureOverflow(el.querySelector('.sch-ev-title'));
      if (m) mq.push(m);
      /*@3.SCHJ.122*/
      el.querySelectorAll('.sch-ev-time, .sch-ev-meta').forEach(function (line) {
        line.classList.remove('is-hidden');
        if (line.scrollWidth > line.clientWidth + 1) line.classList.add('is-hidden');
      });
    });
    syncMarquee(mq);
  }

  /*@3.SCHJ.123*/
  var MQ_WPM = 70;               /*@3.SCHJ.124*/
  var MQ_HOLD_START = 3.0;       /*@3.SCHJ.125*/
  var MQ_HOLD_END = 0.7;         /*@3.SCHJ.126*/
  var MQ_V_MIN = 30, MQ_V_MAX = 85;   /*@3.SCHJ.127*/
  var MQ_PX_PER_WORD_FALLBACK = 44;

  /*@3.SCHJ.128*/
  function measureOverflow(t) {
    if (!t) return null;
    var tx = t.querySelector('.sch-ev-tx');
    if (!tx) return null;
    t.classList.remove('is-mq');
    t.style.removeProperty('--mq-x');
    t.style.removeProperty('--mq-dur');
    var over = t.scrollWidth - t.clientWidth;
    if (over <= 2 || !t.clientWidth) return null;  /*@3.SCHJ.129*/
    var s = (tx.textContent || '').trim();
    return { t: t, over: over, w: tx.getBoundingClientRect().width,
             words: s ? s.split(/\s+/).length : 0 };
  }

  /*@3.SCHJ.130*/
  function writeMarqueeFrames(p1, p2) {
    var st = document.getElementById('sch-mq-kf');
    if (!st) {
      st = document.createElement('style');
      st.id = 'sch-mq-kf';
      document.head.appendChild(st);          /*@3.SCHJ.131*/
    }
    var css = '@keyframes schMarquee{0%,' + p1.toFixed(2) + '%{transform:translateX(0)}' +
              p2.toFixed(2) + '%,100%{transform:translateX(var(--mq-x,0))}}';
    if (st.textContent !== css) st.textContent = css;
  }

  function syncMarquee(list) {
    if (!list.length) return;
    var maxOver = 0, px = 0, words = 0;
    list.forEach(function (o) {
      if (o.over > maxOver) maxOver = o.over;
      px += o.w; words += o.words;
    });
    /*@3.SCHJ.132*/
    var pxPerWord = words ? (px / words) : MQ_PX_PER_WORD_FALLBACK;
    var v = Math.max(MQ_V_MIN, Math.min(MQ_V_MAX, MQ_WPM / 60 * pxPerWord));
    /*@3.SCHJ.133*/
    var travel = maxOver / v;
    var dur = MQ_HOLD_START + travel + MQ_HOLD_END;
    writeMarqueeFrames(MQ_HOLD_START / dur * 100, (MQ_HOLD_START + travel) / dur * 100);
    list.forEach(function (o) {
      var rtl = getComputedStyle(o.t).direction === 'rtl';
      o.t.style.setProperty('--mq-x', (rtl ? o.over : -o.over) + 'px');
      o.t.style.setProperty('--mq-dur', dur.toFixed(2) + 's');
      o.t.classList.add('is-mq');
    });
    /*@3.SCHJ.134*/
    var t0 = null;
    list.forEach(function (o) {
      var tx = o.t.querySelector('.sch-ev-tx');
      var anims = tx.getAnimations ? tx.getAnimations() : [];
      anims.forEach(function (a) {
        if (t0 === null) t0 = a.startTime;
        if (t0 !== null) { try { a.startTime = t0; } catch (e) {} }
      });
    });
  }

  /*@3.SCHJ.135*/
  function drawNowLine(dates, startH, endH) {
    document.querySelectorAll('.sch-nowline, .sch-nowrail, .sch-nowchip').forEach(function (n) { n.remove(); });
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    if (mins < startH * 60 || mins > endH * 60) return;
    var y = axis.yFor(mins);

    var todayIdx = -1;
    dates.forEach(function (d, i) { if (isSameDay(d, now)) todayIdx = i; });

    /*@3.SCHJ.136*/
    var body = document.getElementById('grid-body');
    if (body) {
      var rail = document.createElement('div');
      rail.className = 'sch-nowrail';
      rail.style.top = y + 'px';
      /*@3.SCHJ.137*/
      var gut = body.querySelector('.sch-gutter');
      if (gut) rail.style.setProperty('--sch-dot-x', Math.round(gut.getBoundingClientRect().width) + 'px');
      body.appendChild(rail);
    }

    /*@3.SCHJ.138*/
    var gutter = document.querySelector('#grid-body .sch-gutter');
    if (gutter) {
      var chip = document.createElement('div');
      chip.className = 'sch-nowchip';
      chip.style.top = y + 'px';
      chip.textContent = fmtMin12(mins);
      gutter.appendChild(chip);
      /*@3.SCHJ.139*/
      var cb = chip.getBoundingClientRect();
      gutter.querySelectorAll('.sch-hour-label').forEach(function (lb) {
        var r = lb.getBoundingClientRect();
        lb.style.visibility = (r.bottom > cb.top - 2 && r.top < cb.bottom + 2) ? 'hidden' : '';
      });
    }

    /*@3.SCHJ.140*/
    if (todayIdx === -1) return;
    var col = document.querySelectorAll('#grid-body .sch-daycol')[todayIdx];
    if (!col) return;
    var line = document.createElement('div');
    line.className = 'sch-nowline';
    line.style.top = y + 'px';
    col.appendChild(line);
  }

  function autoScroll(dates, startH) {
    if (didAutoScroll) return;
    var wrap = document.getElementById('grid-wrap');
    if (!wrap) return;
    var target = null;
    dates.forEach(function (d) {
      eventsOnDate(d).forEach(function (e) {
        if (e.allDay || e.start === null) return;
        target = (target === null) ? e.start : Math.min(target, e.start);
      });
    });
    if (target === null) target = new Date().getHours() * 60;
    /*@3.SCHJ.141*/
    if (wrap.scrollHeight <= wrap.clientHeight + 1) { didAutoScroll = true; return; }
    wrap.scrollTop = Math.max(0, axis.yFor(target) - axis.hourPx);
    didAutoScroll = true;
  }

  /*@3.SCHJ.142*/
  var expandedAgRuns = Object.create(null);

  function agRunKey(a, b) { return fmtLocalDate(a) + '|' + fmtLocalDate(b); }

  function agRunLabel(n, from, to) {
    var mn = MONTH_NAMES[isAr() ? 'ar' : 'en'];
    var span = from.getMonth() === to.getMonth()
      ? from.getDate() + ' – ' + to.getDate() + ' ' + mn[to.getMonth()]
      : from.getDate() + ' ' + mn[from.getMonth()] + ' – ' + to.getDate() + ' ' + mn[to.getMonth()];
    var word;
    if (isAr()) {
      word = n === 2 ? 'يومان خاليان' : (n <= 10 ? n + ' أيّامٍ خالية' : n + ' يوماً خالياً');
    } else {
      word = n + ' empty days';
    }
    return { word: word, span: span };
  }

  function agDayHtml(row, scope, today) {
    var d = row.date, items = row.items;
    var isToday = row.today;
    var nm = DAYS_ORDER[d.getDay()];
    var dateTxt = d.getDate() + ' ' + MONTH_NAMES[isAr() ? 'ar' : 'en'][d.getMonth()];

    if (!items.length) {
      /*@3.SCHJ.143*/
      var short = (scope.type !== 'day');
      return '<div class="sch-ag-day is-empty' + (isToday ? ' is-today' : '') + '">' +
        '<div class="sch-ag-head">' +
        '<span class="sch-ag-dname">' +
          escapeH((short ? DAY_SHORT : DAY_NAMES)[isAr() ? 'ar' : 'en'][nm]) + '</span>' +
        '<span class="sch-ag-ddate">' + escapeH(dateTxt) + '</span>' +
        (isToday ? '<span class="sch-ag-today-badge">' + (isAr() ? 'اليوم' : 'Today') + '</span>' : '') +
        '<span class="sch-ag-count">' +
          (short ? '—' : (isAr() ? 'لا أحداث' : 'No events')) + '</span></div></div>';
    }

    var allDay = items.filter(function (e) { return e.allDay; });
    var timed = items.filter(function (e) { return !e.allDay; });
    var html = '<div class="sch-ag-day' + (isToday ? ' is-today' : '') + '">' +
      '<div class="sch-ag-head">' +
        '<span class="sch-ag-dname">' + escapeH(DAY_NAMES[isAr() ? 'ar' : 'en'][nm]) + '</span>' +
        '<span class="sch-ag-ddate">' + escapeH(dateTxt) + '</span>' +
        (isToday ? '<span class="sch-ag-today-badge">' + (isAr() ? 'اليوم' : 'Today') + '</span>' : '') +
        '<span class="sch-ag-count">' + items.length + '</span>' +
      '</div><div class="sch-ag-list">';
    if (allDay.length) {
      html += '<div class="sch-ag-group-label">' + (isAr() ? 'طوال اليوم' : 'All-day') + '</div>';
      allDay.forEach(function (e) { html += agendaItem(e); });
    }
    timed.forEach(function (e) { html += agendaItem(e); });
    return html + '</div></div>';
  }

  function buildAgendaHtml(scope) {
    var days = eventsForRange(scope.from, scope.to);
    var today = new Date();
    var html = '';
    var any = false;

    /*@3.SCHJ.307*/
    var rows = days.map(function (d) {
      var items = d.items;
      if (scope.course) items = items.filter(function (e) { return e.course_code === scope.course; });
      if (items.length) any = true;
      return { date: d.date, items: items, empty: !items.length, today: isSameDay(d.date, today) };
    });

    var i = 0;
    while (i < rows.length) {
      if (!rows[i].empty || scope.type === 'day' || rows[i].today) {
        html += agDayHtml(rows[i], scope, today);
        i++;
        continue;
      }
      /*@3.SCHJ.308*/
      var j = i;
      while (j < rows.length && rows[j].empty && !rows[j].today) j++;
      var n = j - i;
      var key = agRunKey(rows[i].date, rows[j - 1].date);
      if (n < MIN_EMPTY_RUN || expandedAgRuns[key]) {
        for (var k = i; k < j; k++) html += agDayHtml(rows[k], scope, today);
      } else {
        var lb = agRunLabel(n, rows[i].date, rows[j - 1].date);
        html += '<button type="button" class="sch-ag-gap" data-agrun="' + escapeH(key) + '" ' +
          'title="' + escapeH(isAr() ? 'اضغط لعرض هذه الأيّام' : 'Tap to show these days') + '">' +
          '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
          '<span>' + escapeH(lb.word) + '</span>' +
          '<em>' + escapeH(lb.span) + '</em></button>';
      }
      i = j;
    }

    if (!any && scope.type !== 'day') {
      html = '<div class="sch-ag-day"><div class="sch-ag-empty">' +
        (isAr() ? 'لا أحداث في هذا النطاق.' : 'No events in this range.') + '</div></div>';
    }
    return html;
  }

  function agendaItem(e) {
    var time = e.allDay ? (isAr() ? '—' : '—') : fmtMin12(e.start);
    return '<button class="sch-ag-item k-' + e.kind + (e.done ? ' is-done' : '') + '" ' +
      'style="--event-color:' + e.color + '" data-uid="' + escapeH(e.uid) + '" data-date="' + e.date + '">' +
      '<span class="sch-ag-time">' + escapeH(time) + '</span>' +
      '<i class="fa-solid ' + kindIcon(e) + ' sch-ag-ico"></i>' +
      '<span class="sch-ag-body">' +
        '<span class="sch-ag-title' + codeCls(e) + '">' + escapeH(evTitle(e)) + '</span>' +
        '<span class="sch-ag-sub">' + escapeH(evMeta(e) + (e.course_code && e.kind === 'general' ? ' · ' + courseShort(e.course_code) : '')) + '</span>' +
      '</span></button>';
  }

  function bindAgendaClicks(root) {
    root.querySelectorAll('.sch-ag-gap').forEach(function (b) {
      b.addEventListener('click', function () {
        expandedAgRuns[this.getAttribute('data-agrun')] = true;
        renderAgendaView();
      });
    });
    root.querySelectorAll('.sch-ag-item').forEach(function (b) {
      b.addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        var list = eventsOnDate(parseLocalDate(this.getAttribute('data-date')));
        var e = list.filter(function (x) { return x.uid === uid; })[0];
        if (e) openSheet(e);
      });
    });
  }

  function renderAgendaView() {
    var box = document.getElementById('agenda-wrap');
    var scope;
    if (currentView === 'day') scope = { type: 'day', from: currentDayDate, to: currentDayDate };
    else if (currentView === 'month') {
      var y = currentMonthDate.getFullYear(), m = currentMonthDate.getMonth();
      scope = { type: 'month', from: new Date(y, m, 1), to: new Date(y, m + 1, 0) };
    } else {
      var e = new Date(currentWeekStart); e.setDate(e.getDate() + 6);
      scope = { type: 'week', from: new Date(currentWeekStart), to: e };
    }
    box.innerHTML = '<div class="sch-agenda">' + buildAgendaHtml(scope) + '</div>';
    bindAgendaClicks(box);
    box.style.display = '';
  }

  /*@3.SCHJ.144*/
  var MONTH_LEGEND = [
    { cls:'is-exam',      ar:'اختبار',      en:'Exam' },
    { cls:'is-late',      ar:'متأخّر',      en:'Overdue' },
    { cls:'is-task',      ar:'واجب / مهمة', en:'Task' },
    { cls:'is-lecture',   ar:'محاضرة',      en:'Lecture' },
    { cls:'is-study',     ar:'مذاكرة',      en:'Study' },
    { cls:'is-intensive', ar:'خطة مكثّفة',  en:'Intensive' }
  ];

  function renderMonthView() {
    var lang = isAr() ? 'ar' : 'en';
    var year = currentMonthDate.getFullYear(), month = currentMonthDate.getMonth();
    document.getElementById('month-label').textContent = MONTH_NAMES[lang][month] + ' ' + year;

    var last = new Date(year, month + 1, 0);
    var startDow = new Date(year, month, 1).getDay();
    var grid = document.getElementById('month-grid');
    var html = '';
    DAYS_ORDER.forEach(function (d) {
      html += '<div class="sch-month-day-header">' + escapeH(DAY_SHORT[lang][d]) + '</div>';
    });
    for (var i = 0; i < startDow; i++) html += '<div class="sch-month-cell empty"></div>';

    var today = new Date();
    for (var dd = 1; dd <= last.getDate(); dd++) {
      var date = new Date(year, month, dd);
      var items = eventsOnDate(date);
      var wk = studyWeekNumber(date);
      var showWk = (date.getDay() === 0 && wk);
      html += '<div class="sch-month-cell' + (isSameDay(date, today) ? ' today' : '') +
              (inTermBounds(date) ? '' : ' out-of-term') + '" data-date="' + fmtLocalDate(date) + '">' +
              '<div class="sch-month-head">' +
              '<span class="sch-month-day-num">' + dd + '</span>' +
              (showWk ? '<span class="sch-month-wk">' + (isAr() ? 'أ' : 'W') + wk + '</span>' : '') +
              '</div>';

      if (items.length) {
        var n = { exam:0, lecture:0, study:0, intensive:0, task:0, late:0 };
        items.forEach(function (e) {
          if (e.kind === 'exam') n.exam++;
          else if (e.kind === 'lecture') n.lecture++;
          else if (e.kind === 'study') n.study++;
          else if (e.kind === 'intensive') n.intensive++;
          else {
            var overdue = !e.done && parseLocalDate(e.date) < new Date(new Date().setHours(0,0,0,0));
            if (overdue) n.late++; else n.task++;
          }
        });
        html += '<div class="sch-month-dots">';
        html += dots('is-exam', n.exam, 3) + dots('is-lecture', n.lecture, 3) +
                dots('is-study', n.study, 2) + dots('is-intensive', n.intensive, 2) +
                dots('is-late', n.late, 2) + dots('is-task', n.task, 3);
        html += '</div>';
      }
      html += '</div>';
    }
    grid.innerHTML = html;

    var lg = document.getElementById('month-legend');
    lg.innerHTML = MONTH_LEGEND.map(function (it) {
      return '<span class="sch-legend-item"><span class="sch-month-dot ' + it.cls + '"></span>' +
             escapeH(isAr() ? it.ar : it.en) + '</span>';
    }).join('');

    /*@3.SCHJ.145*/
    /*@3.SCHJ.300*/
    grid.querySelectorAll('.sch-month-cell[data-date]').forEach(function (cell) {
      cell.addEventListener('click', function () {
        monthPick = this.getAttribute('data-date');
        renderMonthView();
      });
    });
    renderMonthRail();
  }

  /*@3.SCHJ.301*/
  var monthPick = null;
  function monthPickDate() {
    var y = currentMonthDate.getFullYear(), m = currentMonthDate.getMonth();
    if (monthPick) {
      var p = parseLocalDate(monthPick);
      if (p && p.getFullYear() === y && p.getMonth() === m) return p;
    }
    var now = new Date();
    if (now.getFullYear() === y && now.getMonth() === m) return new Date(now);
    var last = new Date(y, m + 1, 0).getDate();
    for (var d = 1; d <= last; d++) {
      var c = new Date(y, m, d);
      if (eventsOnDate(c).length) return c;
    }
    return new Date(y, m, 1);
  }

  function renderMonthRail() {
    var rail = document.getElementById('month-rail');
    if (!rail) return;
    var lang = isAr() ? 'ar' : 'en';
    var d = monthPickDate();
    monthPick = fmtLocalDate(d);
    document.querySelectorAll('.sch-month-cell[data-date]').forEach(function (c) {
      c.classList.toggle('is-pick', c.getAttribute('data-date') === monthPick);
    });

    var items = eventsOnDate(d);
    var head = '<div class="sch-mr-head">' +
      '<div class="sch-mr-day">' + escapeH(DAY_NAMES[lang][DAYS_ORDER[d.getDay()]]) +
      ' · <span class="sch-code">' + d.getDate() + '</span> ' +
      escapeH(MONTH_NAMES[lang][d.getMonth()]) + '</div>' +
      '<button type="button" class="sch-mr-open" id="mr-open">' +
      escapeH(isAr() ? 'افتحْ هذا اليوم' : 'Open this day') +
      '<i class="fa-solid fa-chevron-' + (isAr() ? 'left' : 'right') + '" aria-hidden="true"></i></button>' +
      '</div>';

    var body;
    if (!items.length) {
      body = '<div class="sch-mr-empty">' +
        '<i class="fa-solid fa-calendar-day" aria-hidden="true"></i>' +
        '<b>' + escapeH(isAr() ? 'لا شيءَ في هذا اليوم' : 'Nothing on this day') + '</b>' +
        '<button type="button" class="sch-mr-add" id="mr-add">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i>' +
        escapeH(isAr() ? 'أضِفْ حدثاً هنا' : 'Add an event here') + '</button></div>';
    } else {
      body = '<div class="sch-mr-list">' + items.map(function (e, i) {
        var allDay = (e.allDay || e.start === null);
        var when = allDay ? (isAr() ? 'طوال اليوم' : 'All-day') : fmtMin12(e.start);
        return '<button type="button" class="sch-mr-row' + (e.done ? ' is-done' : '') +
          '" data-i="' + i + '" style="--row-c:' + escapeH(e.color) + '">' +
          '<span class="sch-mr-t' + (allDay ? '' : ' gd-clock') + '">' + escapeH(when) + '</span>' +
          '<span class="sch-mr-n">' + escapeH(evTitle(e)) + '</span>' +
          (e.room ? '<span class="sch-mr-r">' + escapeH(e.room) + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
    }

    rail.innerHTML = head + body;
    var op = document.getElementById('mr-open');
    if (op) op.addEventListener('click', function () { openDayAgenda(d); });
    var ad = document.getElementById('mr-add');
    if (ad) ad.addEventListener('click', function (ev) {
      var b = ev.currentTarget.getBoundingClientRect();
      openAddModal(DAYS_ORDER[d.getDay()], null, fmtLocalDate(d),
                   { x: b.left + b.width / 2, y: b.bottom });
    });
    rail.querySelectorAll('.sch-mr-row').forEach(function (b) {
      b.addEventListener('click', function () {
        var it = items[parseInt(this.getAttribute('data-i'), 10)];
        if (it) openSheet(it);
      });
    });
  }
  function dots(cls, n, cap) {
    var s = '';
    for (var i = 0; i < Math.min(n, cap); i++) s += '<span class="sch-month-dot ' + cls + '"></span>';
    return s;
  }

  /*@3.SCHJ.146*/
  function ytEmbed(url) {
    var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/.exec(String(url || ''));
    return m ? ('https://www.youtube.com/embed/' + m[1]) : null;
  }

  function openSheet(ev) {
    sheetEvent = ev;
    var ov = document.getElementById('modal-sheet');
    var sheet = ov.querySelector('.sch-sheet');
    sheet.style.setProperty('--event-color', ev.color);
    sheet.style.setProperty('--kind-color', ({
      lecture:'#a78bfa', study:'#10b981', exam:'#ef4444', general:'#f59e0b', intensive:'#7c3aed'
    })[ev.kind] || '#a78bfa');

    document.getElementById('sheet-kind').innerHTML =
      '<i class="fa-solid ' + kindIcon(ev) + '"></i> ' + escapeH(subLabel(ev));
    document.getElementById('sheet-title').textContent = evTitle(ev);
    var courseEl = document.getElementById('sheet-course');
    courseEl.textContent = ev.course_code ? courseDisplayName(ev.course_code) : '';
    courseEl.style.display = ev.course_code ? '' : 'none';

    var body = document.getElementById('sheet-body');
    var rows = '';
    var d = parseLocalDate(ev.date);
    rows += row('fa-calendar-day', DAY_NAMES[isAr()?'ar':'en'][DAYS_ORDER[d.getDay()]] + ' · ' +
                d.getDate() + ' ' + MONTH_NAMES[isAr()?'ar':'en'][d.getMonth()] + ' ' + d.getFullYear());
    if (!ev.allDay) rows += row('fa-clock', fmtMin12(ev.start) + ' – ' + fmtMin12(ev.end), true);
    else rows += row('fa-clock', isAr() ? 'طوال اليوم' : 'All-day');
    if (ev.kind === 'lecture') rows += row('fa-user-check', L(ATTEND[ev.attendance] || ATTEND.in_person));
    if (ev.room) rows += row('fa-location-dot', ev.room);
    if (ev.recurring) rows += row('fa-repeat', isAr() ? 'يتكرّر أسبوعياً' : 'Repeats weekly');
    if (ev.kind === 'intensive' && ev.module) {
      var mnum = String(ev.module).replace(/^M/, '');
      rows += row('fa-cube', (isAr() ? 'الوحدة ' : 'Module ') + mnum +
        (ev.module_title ? ' · ' + ev.module_title : '') +
        (ev.total_parts > 1 ? ' · ' + (isAr() ? ('الجلسة ' + ev.part + ' من ' + ev.total_parts)
                                              : ('session ' + ev.part + ' of ' + ev.total_parts)) : ''));
    }
    if (ev.notes) rows += '<div class="sch-sheet-note">' + escapeH(ev.notes) + '</div>';
    var emb = ytEmbed(ev.youtube);
    if (emb) rows += '<div class="sch-sheet-video"><iframe src="' + escapeH(emb) +
      '" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
    if (ev.youtube) rows += '<a class="sch-sheet-link" href="' + escapeH(ev.youtube) + '" target="_blank" rel="noopener">' +
      '<i class="fa-solid fa-arrow-up-right-from-square"></i> ' + (isAr() ? 'فتح الرابط' : 'Open link') + '</a>';
    body.innerHTML = rows;

    /*@3.SCHJ.147*/
    var acts = document.getElementById('sheet-actions');
    var btns = '';
    btns += '<button class="sch-btn sch-btn-primary" id="sheet-done">' +
      '<i class="fa-solid fa-check"></i> ' + (ev.done ? (isAr() ? 'تراجع' : 'Undo') : (isAr() ? 'إتمام' : 'Done')) + '</button>';
    if (canEdit(ev)) {
      btns += '<button class="sch-btn sch-btn-secondary" id="sheet-edit">' +
        '<i class="fa-solid fa-pen"></i> ' + (isAr() ? 'تعديل' : 'Edit') + '</button>';
    }
    if (ev.recurring) {
      btns += '<button class="sch-btn sch-btn-secondary" id="sheet-skip">' +
        '<i class="fa-solid fa-ban"></i> ' + (isAr() ? 'تجاهل' : 'Skip') + '</button>';
    }
    if (ev.kind === 'intensive') {
      /*@3.SCHJ.148*/
      if (ev.module) {
        btns += '<button class="sch-btn sch-btn-secondary" id="sheet-details">' +
          '<i class="fa-solid fa-circle-info"></i> ' + (isAr() ? 'التفاصيل' : 'Details') + '</button>';
      }
      btns += '<button class="sch-btn sch-btn-secondary" id="sheet-module">' +
        '<i class="fa-solid fa-book-open-reader"></i> ' + (isAr() ? 'ادرس' : 'Study') + '</button>';
    }
    if (canDelete(ev)) {
      btns += '<button class="sch-btn sch-btn-danger" id="sheet-del">' +
        '<i class="fa-solid fa-trash"></i> ' + (isAr() ? 'حذف' : 'Delete') + '</button>';
    }
    acts.innerHTML = btns;

    bindSheetBtn('sheet-done', function () { closeSheet(); toggleDone(ev); });
    bindSheetBtn('sheet-edit', function () { closeSheet(); openEditEvent(ev); });
    bindSheetBtn('sheet-skip', function () { closeSheet(); skipOccurrence(ev); });
    bindSheetBtn('sheet-del', function () { closeSheet(); deleteEvent(ev); });
    bindSheetBtn('sheet-module', function () {
      if (window.GardenSchedulePlan && window.GardenSchedulePlan.openModule) window.GardenSchedulePlan.openModule(ev.course_code, ev.module);
    });
    bindSheetBtn('sheet-details', function () {
      closeSheet();
      if (window.GardenSchedulePlan && window.GardenSchedulePlan.openDetails) window.GardenSchedulePlan.openDetails(ev.course_code, ev.module);
    });

    ov.style.display = '';

    function row(icon, txt, mono) {
      return '<div class="sch-sheet-row"><i class="fa-solid ' + icon + '"></i>' +
        '<span' + (mono ? ' class="mono"' : '') + '>' + escapeH(txt) + '</span></div>';
    }
  }
  function bindSheetBtn(id, fn) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', fn);
  }
  function closeSheet() {
    document.getElementById('modal-sheet').style.display = 'none';
    sheetEvent = null;
  }
  function canEdit(ev) {
    if (ev.src === 'lecture' || ev.src === 'study' || ev.src === 'exam' || ev.src === 'general') return true;
    if (ev.src === 'task') return true;      /*@3.SCHJ.149*/
    if (ev.src === 'intensive') return true;
    return false;                            /*@3.SCHJ.150*/
  }
  function canDelete(ev) {
    return ev.src === 'lecture' || ev.src === 'study' || ev.src === 'exam' ||
           ev.src === 'general' || ev.src === 'task';
  }

  function skipOccurrence(ev) {
    if (ev.src === 'lecture') {
      var o = schedule.week_overrides[ev.weekId] || (schedule.week_overrides[ev.weekId] = {});
      o.cancelled_lectures = o.cancelled_lectures || [];
      if (o.cancelled_lectures.indexOf(ev.id) === -1) o.cancelled_lectures.push(ev.id);
    } else if (ev.src === 'study') {
      var b = schedule.study_blocks.filter(function (x) { return x.id === ev.id; })[0];
      if (b) {
        b.excluded_weeks = b.excluded_weeks || [];
        if (b.excluded_weeks.indexOf(ev.weekId) === -1) b.excluded_weeks.push(ev.weekId);
      }
    }
    save(); render();
  }

  /*@3.SCHJ.151*/
  function showLecDelScope() {
    var main = document.getElementById('lec-main-actions');
    var scope = document.getElementById('lec-del-scope');
    if (!scope) return;
    /*@3.SCHJ.238*/
    var stop = document.getElementById('del-lec-stop');
    if (stop) {
      var row = editingEvent && editingEvent.src === 'lecture'
        ? (schedule.lectures || []).filter(function (l) { return l.id === editingEvent.id; })[0]
        : null;
      stop.hidden = !(row && row.sx_crn);
    }
    if (main) main.style.display = 'none';
    scope.style.display = '';
    requestAnimationFrame(function () {
      try { scope.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { scope.scrollIntoView(false); }
      scope.classList.remove('is-hit');
      void scope.offsetWidth;
      scope.classList.add('is-hit');
      setTimeout(function () { scope.classList.remove('is-hit'); }, 640);
    });
  }

  function deleteEvent(ev) {
    if (ev.src === 'lecture') {
      editingEvent = { src: 'lecture', id: ev.id, weekId: ev.weekId };
      openEditEvent(ev);
      showLecDelScope();
      return;
    }
    askConfirm(
      isAr() ? 'حذف الحدث' : 'Delete event',
      isAr() ? 'حذف هذا الحدث نهائياً؟' : 'Delete this event permanently?',
      isAr() ? 'حذف' : 'Delete',
      function () {
        if (ev.src === 'study') schedule.study_blocks = schedule.study_blocks.filter(function (x) { return x.id !== ev.id; });
        else if (ev.src === 'exam') schedule.exams = schedule.exams.filter(function (x) { return x.id !== ev.id; });
        else if (ev.src === 'general') schedule.general_events = schedule.general_events.filter(function (x) { return x.id !== ev.id; });
        else if (ev.src === 'task') { if (window.GardenData) window.GardenData.deleteTask(ev.id); }
        save(); render();
      }, 'fa-trash');
  }

  /*@3.SCHJ.152*/

  function pendingList() {
    return (window.GardenData && GardenData.pendingSections)
      ? GardenData.pendingSections() : [];
  }
  function pendingCodes() {
    return pendingList().map(function (c) { return c.code; });
  }
  /*@3.SCHJ.153*/
  function reloadState() {
    try { semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null'); } catch (e) { semester = null; }
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
    schedule = migrateSchedule(raw);
  }
  function adoptPending(after) {
    if (!(window.GardenData && GardenData.adoptPending)) { if (after) after(); return; }
    GardenData.adoptPending().then(function () {
      reloadState();
      if (after) after();
    });
  }
  /*@3.SCHJ.154*/
  function archiveAndAdopt() {
    if (semester && (semester.courses || []).length) {
      var arch = [];
      try { arch = JSON.parse(localStorage.getItem('semester_archive') || '[]') || []; } catch (e) { arch = []; }
      arch.push({
        id: semester.id, name: semester.name,
        name_ar: semester.name_ar || semester.name,
        name_en: semester.name_en || semester.name,
        courses: semester.courses,
        gpa: null, total_credits: null,
        created_at: semester.created_at,
        archived_at: new Date().toISOString()
      });
      try { localStorage.setItem('semester_archive', JSON.stringify(arch)); } catch (e) {}
      try { localStorage.setItem('__syncT_semester_archive', String(Date.now())); } catch (e) {}
      /*@3.SCHJ.155*/
      semester.courses.forEach(function (c) {
        var bucket = schedule.archived[c.code] ||
          { lectures: [], study_blocks: [], exams: [], archived_at: null };
        ['lectures','study_blocks','exams'].forEach(function (k) {
          var keep = [], take = [];
          (schedule[k] || []).forEach(function (e) { (e.course_code === c.code ? take : keep).push(e); });
          if (take.length) { bucket[k] = bucket[k].concat(take); schedule[k] = keep; }
        });
        bucket.archived_at = new Date().toISOString();
        schedule.archived[c.code] = bucket;
      });
    }
    semester = null;
    try { localStorage.removeItem(LS_SEMESTER); } catch (e) {}
    try { localStorage.setItem('__syncT_' + LS_SEMESTER, String(Date.now())); } catch (e) {}
    try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
    save();
    adoptPending(arguments[0]);
  }

  /*@3.SCHJ.235*/
  var FOCUS_LBL = { midterm: ['أسبوع الميدتيرم', 'Midterm week'],
                    final:   ['أسبوع الفاينل', 'Final week'] };

  function focusSuggestHtml(ask) {
    if (!ask) return '';
    var rows = Object.keys(ask).map(function (k) {
      var cur = (schedule.settings.focus_periods || {})[k] || {};
      var was = (cur.start && cur.end) ? (cur.start + ' → ' + cur.end) : '—';
      return '<span><b>' + escapeH(isAr() ? FOCUS_LBL[k][0] : FOCUS_LBL[k][1]) + '</b>' +
        '<em dir="ltr">' + escapeH(was) + ' → ' +
        escapeH(ask[k].start + ' → ' + ask[k].end) + '</em></span>';
    }).join('');
    return '<div class="sch-term-sug"><div class="sch-term-sug-h">' +
        '<i class="fa-solid fa-file-pen" aria-hidden="true"></i><b>' +
        (isAr() ? 'اختباراتُ شعبك تقول أسبوعاً آخر'
                : 'Your sections’ exams suggest a different week') + '</b></div>' +
      '<div class="sch-term-sug-l">' + rows + '</div>' +
      '<p class="sch-editor-hint">' + (isAr()
        ? 'المدى من أوّلِ اختبارٍ إلى آخِرِه في شعبك، ويوماً قبله ويوماً بعده. وفي أسابيع التركيز تُخفى المحاضراتُ المتكرّرة ولا يصلك تنبيهُها.'
        : 'The span runs from your sections’ first exam to the last, plus a day either side. In focus weeks recurring lectures are hidden and their reminders stop.') + '</p>' +
      '<div class="sch-modal-actions">' +
        '<button class="sch-btn sch-btn-primary" id="focus-sug-apply">' +
          (isAr() ? 'حدِّثها' : 'Update them') + '</button>' +
        '<button class="sch-btn sch-btn-secondary" id="focus-sug-keep">' +
          (isAr() ? 'أبقِ أسابيعي' : 'Keep mine') + '</button>' +
      '</div></div>';
  }

  function wireFocusSuggest(ask) {
    if (!ask) return;
    var st = schedule.settings;
    var ap = document.getElementById('focus-sug-apply');
    if (ap) ap.addEventListener('click', function () {
      Object.keys(ask).forEach(function (k) {
        st.focus_periods[k] = { start: ask[k].start, end: ask[k].end };
        if (!st.focus_auto) st.focus_auto = {};
        st.focus_auto[k] = { start: ask[k].start, end: ask[k].end };
      });
      syncFocusFields();
      save(); renderTermSuggest(); render();
    });
    var kp = document.getElementById('focus-sug-keep');
    if (kp) kp.addEventListener('click', function () {
      if (!st.focus_rejected) st.focus_rejected = {};
      Object.keys(ask).forEach(function (k) {
        st.focus_rejected[k] = { start: ask[k].start, end: ask[k].end };
      });
      save(); renderTermSuggest();
    });
  }

  /*@3.SCHJ.236*/
  function syncFocusFields() {
    var fp = schedule.settings.focus_periods || {};
    var map = { 'editor-mid-start': ['midterm', 'start'], 'editor-mid-end': ['midterm', 'end'],
                'editor-fin-start': ['final', 'start'], 'editor-fin-end': ['final', 'end'] };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var v = (fp[map[id][0]] || {})[map[id][1]] || '';
      el.value = v;
    });
  }

  /*@3.SCHJ.156*/
  function renderTermSuggest() {
    var host = document.getElementById('editor-term-suggest');
    if (!host) return;
    var r = syncTermRange();
    /*@3.SCHJ.234*/
    var fask = syncFocusPeriods();
    var st = schedule.settings;
    var rows = [];
    if (r) {
      if (r.start && r.start !== st.term_start_date) {
        rows.push({ l: isAr() ? 'البداية' : 'Start', from: st.term_start_date || '—', to: r.start });
      }
      if (r.end && r.end !== st.semester_end_date) {
        rows.push({ l: isAr() ? 'النهاية' : 'End', from: st.semester_end_date || '—', to: r.end });
      }
    }
    if (!rows.length && !fask) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML = (!rows.length ? '' :
      '<div class="sch-term-sug"><div class="sch-term-sug-h">' +
        '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><b>' +
        (isAr() ? 'شعبُك تقول مدًى مختلفاً' : 'Your sections suggest a different span') + '</b></div>' +
      '<div class="sch-term-sug-l">' + rows.map(function (x) {
        return '<span><b>' + escapeH(x.l) + '</b>' +
          '<em dir="ltr">' + escapeH(x.from) + ' → ' + escapeH(x.to) + '</em></span>';
      }).join('') + '</div>' +
      '<p class="sch-editor-hint">' + (isAr()
        ? 'البدايةُ من أوّلِ توفّرٍ لموادّك في بانر، والنهايةُ من آخرِ اختبارٍ نهائيّ. تواريخُك مكتوبةٌ بيدك فلن نغيّرها إلا بأمرك.'
        : 'Start comes from your courses’ earliest Banner availability, end from the last final exam. Your dates were set by hand, so nothing changes without you.') + '</p>' +
      '<div class="sch-modal-actions">' +
        '<button class="sch-btn sch-btn-primary" id="term-sug-apply">' +
          (isAr() ? 'حدِّثها' : 'Update them') + '</button>' +
        '<button class="sch-btn sch-btn-secondary" id="term-sug-keep">' +
          (isAr() ? 'أبقِ تواريخي' : 'Keep mine') + '</button>' +
      '</div></div>') + focusSuggestHtml(fask);

    wireFocusSuggest(fask);
    var ap = document.getElementById('term-sug-apply');
    if (ap) ap.addEventListener('click', function () {
      if (r.start) { st.term_start_date = r.start; document.getElementById('editor-start').value = r.start; }
      if (r.end) { st.semester_end_date = r.end; document.getElementById('editor-end').value = r.end; }
      st.term_auto = { start: st.term_start_date, end: st.semester_end_date };
      save(); renderTermSuggest(); render();
    });
    var kp = document.getElementById('term-sug-keep');
    if (kp) kp.addEventListener('click', function () {
      /*@3.SCHJ.157*/
      st.term_rejected = { start: r.start || '', end: r.end || '' };
      save(); renderTermSuggest();
    });
  }

  function renderPendingBar() {
    var host = document.getElementById('editor-pending');
    if (!host) return;
    var list = pendingList();
    if (!list.length) { host.innerHTML = ''; host.style.display = 'none'; return; }
    var names = list.map(function (c) { return c.code; }).join('، ');
    var live = activeCourseCodes().length;
    host.style.display = '';
    host.innerHTML =
      '<div class="sch-pending"><div class="sch-pending-h">' +
        '<i class="fa-solid fa-calendar-plus"></i><b>' +
        (isAr() ? 'شعبٌ أضفتَها من صفحة الشعب' : 'Sections you added from the catalog') +
        '</b></div>' +
      '<div class="sch-pending-list">' + list.map(function (c) {
        return '<span class="sch-pending-i"><b>' + escapeH(c.code) + '</b>' +
          (c.title ? '<span>' + escapeH(c.title) + '</span>' : '') +
          '<em>' + (c.crns || []).length + (isAr() ? ' شعبة' : ' sec') + '</em></span>';
      }).join('') + '</div>' +
      '<p class="sch-editor-hint">' + (live
        ? (isAr()
            ? ('أوقاتُها في جدولك، لكن موادَّها ليست في فصلك الجاري — فتُحجَب عن العرض ' +
               'كي لا تختلط به. اختر ما تريد:')
            : ('Their times are in your schedule, but the courses are not in your current ' +
               'term, so they are kept out of view. Choose what to do:'))
        : (isAr() ? 'لا فصلَ جارٍ عندك — ستُضاف هذه المواد إلى فصلٍ جديد.'
                  : 'You have no current term — these will start a new one.')) + '</p>' +
      '<div class="sch-modal-actions">' +
        '<button class="sch-btn sch-btn-primary" id="pending-adopt">' +
          (live ? (isAr() ? 'أضِفها للفصل الحالي' : 'Add to current term')
                : (isAr() ? 'أنشئ فصلي بها' : 'Start my term')) + '</button>' +
        (live ? '<button class="sch-btn sch-btn-secondary" id="pending-fresh">' +
          (isAr() ? 'فصلٌ جديد وأرشِف الحالي' : 'New term, archive current') + '</button>' : '') +
      '</div></div>';
    /*@3.SCHJ.158*/
    function afterAdopt() {
      renderPendingBar(); renderEditorCourses(); renderArchiveList();
      render();
    }
    var a = document.getElementById('pending-adopt');
    if (a) a.addEventListener('click', function () { adoptPending(afterAdopt); });
    var f = document.getElementById('pending-fresh');
    if (f) f.addEventListener('click', function () { archiveAndAdopt(afterAdopt); });
  }

  /*@3.SCHJ.159*/
  function syncArchive() {
    var live = activeCourseCodes();
    if (!live.length) return;   /*@3.SCHJ.160*/
    var moved = 0;
    var known = {};
    ['lectures','study_blocks','exams'].forEach(function (k) {
      (schedule[k] || []).forEach(function (e) { if (e.course_code) known[e.course_code] = 1; });
    });
    var waiting = pendingCodes();
    Object.keys(known).forEach(function (code) {
      if (live.indexOf(code) !== -1) return;
      if (String(code).indexOf('__CUSTOM_') === 0) return;
      /*@3.SCHJ.161*/
      if (waiting.indexOf(code) !== -1) return;
      var bucket = schedule.archived[code] || { lectures: [], study_blocks: [], exams: [], archived_at: null };
      ['lectures','study_blocks','exams'].forEach(function (k) {
        var keep = [], take = [];
        (schedule[k] || []).forEach(function (e) { (e.course_code === code ? take : keep).push(e); });
        if (take.length) { bucket[k] = bucket[k].concat(take); schedule[k] = keep; moved += take.length; }
      });
      bucket.archived_at = new Date().toISOString();
      schedule.archived[code] = bucket;
    });
    if (moved) save();
  }

  /*@3.SCHJ.162*/
  function checkArchiveRestore() {
    var live = activeCourseCodes();
    var pending = Object.keys(schedule.archived || {}).filter(function (c) { return live.indexOf(c) !== -1; });
    if (!pending.length) return;
    var code = pending[0];
    var b = schedule.archived[code];
    var n = (b.lectures || []).length + (b.study_blocks || []).length + (b.exams || []).length;
    if (!n) { delete schedule.archived[code]; save(); return checkArchiveRestore(); }
    showArchivePrompt(code, n);
  }

  function showArchivePrompt(code, n) {
    var ov = document.getElementById('modal-archive');
    document.getElementById('archive-text').textContent = isAr()
      ? ('وجدنا ' + n + ' حدثاً سابقاً للمادة ' + code + '. ماذا تريد أن نفعل بها؟')
      : ('We found ' + n + ' earlier events for ' + code + '. What should we do with them?');
    ov.style.display = '';
    document.getElementById('archive-restore').onclick = function () {
      var b = schedule.archived[code];
      ['lectures','study_blocks','exams'].forEach(function (k) {
        schedule[k] = (schedule[k] || []).concat(b[k] || []);
      });
      delete schedule.archived[code];
      save(); ov.style.display = 'none'; render(); checkArchiveRestore();
    };
    document.getElementById('archive-fresh').onclick = function () {
      delete schedule.archived[code];
      save(); ov.style.display = 'none'; render(); checkArchiveRestore();
    };
  }

  /*@3.SCHJ.163*/
  function closeModal(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; }

  /*@3.SCHJ.164*/
  function refreshEditorSurfaces() {
    var ed = document.getElementById('modal-editor');
    if (!ed || ed.style.display === 'none') return;
    try { renderEditorCourses(); } catch (e) {}
    try { renderArchiveList(); } catch (e) {}
  }

  /*@3.SCHJ.165*/
  var confirmFn = null;
  /*@3.SCHJ.222*/
  function askConfirm(title, msg, okText, fn, okIcon) {
    var ov = document.getElementById('modal-confirm');
    if (!ov) { if (window.confirm(msg)) fn(); return; }
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = msg;
    var ok = document.getElementById('confirm-ok');
    ok.textContent = '';
    if (okIcon) {
      var ic = document.createElement('i');
      ic.className = 'fa-solid ' + okIcon;
      ic.setAttribute('aria-hidden', 'true');
      ok.appendChild(ic);
      ok.appendChild(document.createTextNode(' '));
    }
    ok.appendChild(document.createTextNode(okText));
    confirmFn = fn;
    ov.style.display = '';
  }

  function hideDeleteButtons() {
    ['del-lecture','del-study','del-exam','del-general'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.style.display = 'none';
    });
    var scope = document.getElementById('lec-del-scope'); if (scope) scope.style.display = 'none';
    var main = document.getElementById('lec-main-actions'); if (main) main.style.display = '';
  }

  function populateCourseSelect(selectId, allowEmpty) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    if (allowEmpty) {
      var o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = isAr() ? '— بلا مادة —' : '— No course —';
      sel.appendChild(o0);
    }
    semesterCourses().forEach(function (c) {
      var name = c.custom ? (isAr() ? c.name_ar : (c.name_en || c.name_ar)) : c.code;
      if (c.completed) name = '✓ ' + name + (isAr() ? ' · أُتمّت' : ' · done');
      var o = document.createElement('option');
      o.value = c.code; o.textContent = name;
      sel.appendChild(o);
    });
  }
  function populateDaySelect(selectId, selected) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    DAYS_ORDER.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d; o.textContent = DAY_NAMES[isAr() ? 'ar' : 'en'][d];
      if (d === selected) o.selected = true;
      sel.appendChild(o);
    });
  }

  var pendingSlot = { day: null, time: null, date: null };

  /*@3.SCHJ.223*/
  function nowSlotTime() {
    var d = new Date();
    var m = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 15) * 15;
    if (m >= 24 * 60) m = 24 * 60 - 15;
    return minToHM24(m);
  }

  var ADD_TYPES = [
    { k: 'add-lec',   i: 'fa-chalkboard-user', tone: 'var(--st-accent, #a78bfa)',
      ar: 'محاضرة', en: 'Lecture' },
    { k: 'add-study', i: 'fa-book-open',       tone: 'var(--st-ok, #10b981)',
      ar: 'مذاكرة', en: 'Study' },
    { k: 'add-exam',  i: 'fa-file-pen',        tone: 'var(--st-danger, #ef4444)',
      ar: 'اختبار', en: 'Exam' },
    { k: 'add-gen',   i: 'fa-bookmark',        tone: 'var(--text-muted)',
      ar: 'عام · مهمّةٌ أو ملاحظةٌ أو حدث', en: 'General · task, note or event' },
    { sep: true },
    { k: 'add-plan',  i: 'fa-bolt',            tone: 'var(--st-warn, #f59e0b)',
      ar: 'خطّةُ مذاكرةٍ مكثّفة', en: 'Intensive study plan' }
  ];

  function openAddModal(day, time, dateStr, at) {
    editingEvent = null;
    hideDeleteButtons();
    var base = (currentView === 'day' ? currentDayDate : new Date());
    pendingSlot = {
      day: day || DAYS_ORDER[base.getDay()],
      /*@3.SCHJ.224*/
      time: time || nowSlotTime(),
      date: dateStr || fmtLocalDate(base)
    };
    var d = parseLocalDate(pendingSlot.date);
    var head = (d ? DAY_NAMES[isAr() ? 'ar' : 'en'][DAYS_ORDER[d.getDay()]] + ' · ' : '') +
               fmtTime12(pendingSlot.time);
    closeSchMenu();
    paintSchMenu(ADD_TYPES, null, null,
                 { x: (at && at.x) || window.innerWidth / 2,
                   y: (at && at.y) || Math.round(window.innerHeight * 0.28) },
                 head);
  }

  /*@3.SCHJ.225*/
  /*@3.SCHJ.227*/
  var OPEN_SECS = { term: 1, courses: 1, ics: 1, plans: 1, data: 1 };

  /*@3.SCHJ.228*/
  function openIntent(sec, tries) {
    var box = document.getElementById('modal-editor');
    /*@3.SCHJ.229*/
    try { openEditor(); } catch (e) { try { console.error('openEditor:', e); } catch (_) {} }
    var open = box && getComputedStyle(box).display !== 'none';
    if (!open) {
      if (tries > 0) setTimeout(function () { openIntent(sec, tries - 1); }, 300);
      return;
    }
    /*@3.SCHJ.230*/
    /*@3.SCHJ.231*/
    var swPending = !!(navigator.serviceWorker && !navigator.serviceWorker.controller);
    if (!swPending) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    }
    goEditorSec(sec);
    if (sec !== 'term') return;
    var start = document.getElementById('editor-start');
    if (start) setTimeout(function () { try { start.focus(); } catch (e) {} }, 420);
  }

  function runIntent() {
    var q = location.search || '';
    var open = (/[?&]open=([a-z]+)/.exec(q) || [])[1] || '';
    if (OPEN_SECS[open]) { openIntent(open, 2); return; }
    if (!/[?&]add=event/.test(q)) return;
    var d = (/[?&]d=(\d{4}-\d{2}-\d{2})/.exec(q) || [])[1] || null;
    var tm = (/[?&]t=(\d{2}:\d{2})/.exec(q) || [])[1] || null;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    var day = d ? DAYS_ORDER[parseLocalDate(d).getDay()] : null;
    openAddModal(day, tm, d);
  }

  function prepLectureModal() {
    populateCourseSelect('lec-course');
    populateDaySelect('lec-day', pendingSlot.day);
    TP.set('lec-start', pendingSlot.time);
    TP.set('lec-end', addMinutes(pendingSlot.time, 50));
    document.getElementById('lec-room').value = '';
    document.getElementById('lec-kind').value = 'lecture';
    document.getElementById('lec-attend').value = 'in_person';
    toggleRoomField();
    document.getElementById('modal-add-lecture').style.display = '';
  }
  function prepStudyModal() {
    populateCourseSelect('study-course');
    populateDaySelect('study-day', pendingSlot.day);
    TP.set('study-start', pendingSlot.time);
    document.getElementById('study-duration').value = 60;
    document.getElementById('study-kind').value = 'study';
    document.getElementById('study-custom').value = '';
    document.getElementById('study-notes').value = '';
    document.getElementById('study-youtube').value = '';
    document.getElementById('study-recurring').checked = true;
    document.getElementById('study-week-date').value = pendingSlot.date;
    toggleCustomLabel(); toggleSingleWeekField();
    document.getElementById('modal-add-study').style.display = '';
  }
  function prepExamModal() {
    populateCourseSelect('exam-course');
    document.getElementById('exam-date').value = pendingSlot.date;
    TP.set('exam-start', pendingSlot.time);
    TP.set('exam-end', addMinutes(pendingSlot.time, 90));
    document.getElementById('exam-kind').value = 'exam';
    document.getElementById('exam-room').value = '';
    document.getElementById('exam-notes').value = '';
    document.getElementById('modal-add-exam').style.display = '';
  }
  function prepGeneralModal() {
    populateCourseSelect('gen-course', true);
    document.getElementById('gen-kind').value = 'task';
    document.getElementById('gen-title').value = '';
    document.getElementById('gen-date').value = pendingSlot.date;
    document.getElementById('gen-timed').checked = true;
    TP.set('gen-start', pendingSlot.time);
    document.getElementById('gen-notes').value = '';
    document.getElementById('gen-link').value = '';
    refreshGeneralPicker();
    toggleGenTime();
    document.getElementById('modal-add-general').style.display = '';
  }

  function toggleRoomField() {
    var remote = document.getElementById('lec-attend').value === 'remote';
    document.getElementById('lec-room-wrap').style.display = remote ? 'none' : '';
  }
  function toggleCustomLabel() {
    var custom = document.getElementById('study-kind').value === 'custom';
    document.getElementById('study-custom-wrap').style.display = custom ? '' : 'none';
  }
  function toggleSingleWeekField() {
    var rec = document.getElementById('study-recurring');
    document.getElementById('study-single-week').style.display = rec.checked ? 'none' : '';
  }
  function toggleGenTime() {
    var on = document.getElementById('gen-timed').checked;
    document.getElementById('gen-time-wrap').style.display = on ? '' : 'none';
  }

  /*@3.SCHJ.166*/
  function refreshGeneralPicker() {
    var kind = document.getElementById('gen-kind').value;
    var box = document.getElementById('gen-existing-wrap');
    var sel = document.getElementById('gen-existing');
    if (kind !== 'task' || !window.GardenData) { box.style.display = 'none'; return; }
    var list = (window.GardenData.tasks() || []).filter(function (t) { return !t.done; })
      .map(function (t) { return { id: t.id, label: t.title || '—' }; });
    sel.innerHTML = '<option value="">' + (isAr() ? '— إنشاء جديد —' : '— Create new —') + '</option>';
    list.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.id; o.textContent = it.label;
      sel.appendChild(o);
    });
    box.style.display = list.length ? '' : 'none';
  }

  function openEditEvent(ev) {
    if (ev.src === 'intensive') {
      if (window.GardenSchedulePlan && window.GardenSchedulePlan.editSession) window.GardenSchedulePlan.editSession(ev.id);
      return;
    }
    hideDeleteButtons();
    editingEvent = { src: ev.src, id: ev.id, weekId: ev.weekId };
    if (ev.src === 'lecture') {
      var l = ev.raw;
      populateCourseSelect('lec-course');
      populateDaySelect('lec-day', l.day);
      document.getElementById('lec-course').value = l.course_code;
      TP.set('lec-start', l.start_time || '15:00');
      TP.set('lec-end', l.end_time || '16:00');
      document.getElementById('lec-room').value = l.room || '';
      document.getElementById('lec-kind').value = l.kind || 'lecture';
      document.getElementById('lec-attend').value = l.attendance || 'in_person';
      toggleRoomField();
      document.getElementById('del-lecture').style.display = '';
      document.getElementById('modal-add-lecture').style.display = '';
    } else if (ev.src === 'study') {
      var b = ev.raw;
      populateCourseSelect('study-course');
      populateDaySelect('study-day', b.day);
      document.getElementById('study-course').value = b.course_code;
      TP.set('study-start', b.start_time || '16:00');
      document.getElementById('study-duration').value = b.duration_minutes || 60;
      document.getElementById('study-kind').value = b.kind || 'study';
      document.getElementById('study-custom').value = b.custom_label || '';
      document.getElementById('study-notes').value = b.notes || '';
      document.getElementById('study-youtube').value = b.youtube || '';
      document.getElementById('study-recurring').checked = (b.week_id == null);
      document.getElementById('study-week-date').value = ev.date;
      toggleCustomLabel(); toggleSingleWeekField();
      document.getElementById('del-study').style.display = '';
      document.getElementById('modal-add-study').style.display = '';
    } else if (ev.src === 'exam') {
      var x = ev.raw;
      populateCourseSelect('exam-course');
      document.getElementById('exam-course').value = x.course_code;
      document.getElementById('exam-date').value = x.date || '';
      TP.set('exam-start', x.start_time || '15:00');
      TP.set('exam-end', x.end_time || '16:30');
      document.getElementById('exam-kind').value = x.exam_type || 'exam';
      document.getElementById('exam-room').value = x.room || '';
      document.getElementById('exam-notes').value = x.notes || '';
      document.getElementById('del-exam').style.display = '';
      document.getElementById('modal-add-exam').style.display = '';
    } else if (ev.src === 'general' || ev.src === 'task') {
      populateCourseSelect('gen-course', true);
      document.getElementById('gen-existing-wrap').style.display = 'none';
      if (ev.src === 'general') {
        var g = ev.raw;
        document.getElementById('gen-kind').value = g.kind || 'event';
        document.getElementById('gen-title').value = g.title || '';
        document.getElementById('gen-course').value = g.course_code || '';
        document.getElementById('gen-date').value = g.date;
        document.getElementById('gen-timed').checked = !!g.start_time;
        TP.set('gen-start', g.start_time || '15:00');
        document.getElementById('gen-notes').value = g.notes || '';
        document.getElementById('gen-link').value = g.link || '';
      } else {
        var t = ev.raw;
        document.getElementById('gen-kind').value = 'task';
        document.getElementById('gen-title').value = t.title || '';
        document.getElementById('gen-course').value = t.course || '';
        document.getElementById('gen-date').value = String(t.due || '').slice(0, 10);
        document.getElementById('gen-timed').checked = String(t.due || '').length > 10;
        TP.set('gen-start', String(t.due || '').slice(11, 16) || '15:00');
        document.getElementById('gen-notes').value = t.note || '';
        document.getElementById('gen-link').value = '';
      }
      toggleGenTime();
      document.getElementById('del-general').style.display = '';
      document.getElementById('modal-add-general').style.display = '';
    }
  }

  /*@3.SCHJ.167*/
  function saveLecture() {
    var data = {
      course_code: document.getElementById('lec-course').value,
      day: document.getElementById('lec-day').value,
      start_time: document.getElementById('lec-start').value,
      end_time: document.getElementById('lec-end').value,
      room: document.getElementById('lec-room').value.trim(),
      kind: document.getElementById('lec-kind').value,
      attendance: document.getElementById('lec-attend').value
    };
    if (!data.course_code) { alert(isAr() ? 'اختر المادة' : 'Pick a course'); return; }
    if (data.attendance === 'remote') data.room = '';
    if (editingEvent && editingEvent.src === 'lecture') {
      var l = schedule.lectures.filter(function (x) { return x.id === editingEvent.id; })[0];
      if (l) {
        l.course_code = data.course_code; l.day = data.day;
        l.start_time = data.start_time; l.end_time = data.end_time;
        l.room = data.room; l.kind = data.kind; l.attendance = data.attendance;
        l.color = getCourseColor(data.course_code);
      }
    } else {
      schedule.lectures.push({
        id: 'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        course_code: data.course_code, day: data.day,
        start_time: data.start_time, end_time: data.end_time,
        room: data.room, kind: data.kind, attendance: data.attendance,
        recurring: true, color: getCourseColor(data.course_code)
      });
    }
    save(); editingEvent = null; hideDeleteButtons();
    closeModal('modal-add-lecture'); render();
  }

  function saveStudy() {
    var recurring = document.getElementById('study-recurring').checked;
    var data = {
      course_code: document.getElementById('study-course').value,
      day: document.getElementById('study-day').value,
      start_time: document.getElementById('study-start').value,
      duration_minutes: parseInt(document.getElementById('study-duration').value, 10) || 60,
      kind: document.getElementById('study-kind').value,
      custom_label: document.getElementById('study-custom').value.trim(),
      notes: document.getElementById('study-notes').value.trim(),
      youtube: document.getElementById('study-youtube').value.trim()
    };
    if (!data.course_code) { alert(isAr() ? 'اختر المادة' : 'Pick a course'); return; }
    var wkDate = document.getElementById('study-week-date').value;
    var targetWeekId = getWeekId(wkDate ? parseLocalDate(wkDate) : currentWeekStart);

    if (editingEvent && editingEvent.src === 'study') {
      var b = schedule.study_blocks.filter(function (x) { return x.id === editingEvent.id; })[0];
      if (b) {
        var wasRecurring = (b.week_id == null);
        b.course_code = data.course_code; b.day = data.day;
        b.start_time = data.start_time; b.duration_minutes = data.duration_minutes;
        b.kind = data.kind; b.custom_label = data.custom_label;
        b.notes = data.notes; b.youtube = data.youtube;
        if (recurring) b.week_id = null;
        else if (wasRecurring) {
          /*@3.SCHJ.168*/
          b.excluded_weeks = b.excluded_weeks || [];
          if (b.excluded_weeks.indexOf(targetWeekId) === -1) b.excluded_weeks.push(targetWeekId);
          schedule.study_blocks.push(newBlock(data, targetWeekId));
        } else b.week_id = targetWeekId;
      }
    } else {
      schedule.study_blocks.push(newBlock(data, recurring ? null : targetWeekId));
    }
    save(); editingEvent = null; hideDeleteButtons();
    closeModal('modal-add-study'); render();

    function newBlock(d, weekId) {
      return {
        id: 'sb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        course_code: d.course_code, day: d.day, start_time: d.start_time,
        duration_minutes: d.duration_minutes, kind: d.kind, custom_label: d.custom_label,
        notes: d.notes, youtube: d.youtube, modules: [], week_id: weekId
      };
    }
  }

  function saveExam() {
    var data = {
      course_code: document.getElementById('exam-course').value,
      date: document.getElementById('exam-date').value,
      start_time: document.getElementById('exam-start').value,
      end_time: document.getElementById('exam-end').value,
      exam_type: document.getElementById('exam-kind').value,
      room: document.getElementById('exam-room').value.trim(),
      notes: document.getElementById('exam-notes').value.trim()
    };
    if (!data.course_code) { alert(isAr() ? 'اختر المادة' : 'Pick a course'); return; }
    if (!data.date) { alert(isAr() ? 'اختر تاريخ الاختبار' : 'Pick an exam date'); return; }
    if (editingEvent && editingEvent.src === 'exam') {
      var x = schedule.exams.filter(function (e) { return e.id === editingEvent.id; })[0];
      if (x) {
        x.course_code = data.course_code; x.date = data.date;
        x.start_time = data.start_time; x.end_time = data.end_time;
        x.exam_type = data.exam_type; x.room = data.room; x.notes = data.notes;
        x.all_day = false;      /*@3.SCHJ.169*/
      }
    } else {
      schedule.exams.push({
        id: 'exam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        course_code: data.course_code, date: data.date,
        start_time: data.start_time, end_time: data.end_time,
        exam_type: data.exam_type, room: data.room, notes: data.notes
      });
    }
    save(); editingEvent = null; hideDeleteButtons();
    closeModal('modal-add-exam'); render();
  }

  /*@3.SCHJ.170*/
  function saveGeneral() {
    var kind = document.getElementById('gen-kind').value;
    var title = document.getElementById('gen-title').value.trim();
    var course = document.getElementById('gen-course').value;
    var date = document.getElementById('gen-date').value;
    var timed = document.getElementById('gen-timed').checked;
    var time = document.getElementById('gen-start').value;
    var notes = document.getElementById('gen-notes').value.trim();
    var link = document.getElementById('gen-link').value.trim();
    var existing = document.getElementById('gen-existing').value;

    if (!date) { alert(isAr() ? 'اختر التاريخ' : 'Pick a date'); return; }
    var due = date + (timed ? 'T' + time : '');

    if (kind === 'task' && window.GardenData && window.GardenData.upsertTask) {
      var id = (editingEvent && editingEvent.src === 'task') ? editingEvent.id : (existing || null);
      if (!id && !title) { alert(isAr() ? 'اكتب عنوان المهمة' : 'Enter a task title'); return; }
      /*@3.SCHJ.171*/
      var prev = id ? (window.GardenData.tasks() || []).filter(function (t) { return t.id === id; })[0] : null;
      var payload = prev ? JSON.parse(JSON.stringify(prev)) : {};
      payload.due = due;
      payload.course = course || null;
      payload.note = notes;
      if (id) payload.id = id;
      if (title) payload.title = title;
      window.GardenData.upsertTask(payload);
    } else {
      if (!title) { alert(isAr() ? 'اكتب عنوان الحدث' : 'Enter an event title'); return; }
      if (editingEvent && editingEvent.src === 'general') {
        var g = schedule.general_events.filter(function (x) { return x.id === editingEvent.id; })[0];
        if (g) {
          g.kind = 'event'; g.title = title; g.course_code = course; g.date = date;
          g.start_time = timed ? time : ''; g.notes = notes; g.link = link;
        }
      } else {
        schedule.general_events.push({
          id: 'gen_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          kind: 'event', title: title, course_code: course, date: date,
          start_time: timed ? time : '', duration_minutes: 60,
          notes: notes, link: link, done: false
        });
      }
      save();
    }
    editingEvent = null; hideDeleteButtons();
    closeModal('modal-add-general'); render();
  }

  /*@3.SCHJ.172*/
  var PURGE_TYPES = [
    { k:'lecture',   ar:'محاضرات',      en:'Lectures' },
    { k:'study',     ar:'مذاكرة',       en:'Study' },
    { k:'review',    ar:'مراجعة',       en:'Review' },
    { k:'custom',    ar:'أخرى',         en:'Other' },
    { k:'exam',      ar:'اختبارات',     en:'Exams' },
    { k:'general',   ar:'أحداث عامة',   en:'General' },
    { k:'intensive', ar:'جلسات مكثّفة', en:'Intensive' }
  ];

  /*@3.SCHJ.173*/
  function purgeCourseTotal(code) {
    var n = 0;
    ['lectures', 'study_blocks', 'exams', 'general_events'].forEach(function (k) {
      (schedule[k] || []).forEach(function (e) { if (e.course_code === code) n++; });
    });
    var p = activePlan();
    if (p) p.sessions.forEach(function (s) { if (s.course === code) n++; });
    return n;
  }
  /*@3.SCHJ.174*/
  function purgeTypeTotal(kind) {
    if (kind === 'lecture') return (schedule.lectures || []).length;
    if (kind === 'exam') return (schedule.exams || []).length;
    if (kind === 'general') return (schedule.general_events || []).length;
    if (kind === 'intensive') { var p = activePlan(); return p ? p.sessions.length : 0; }
    return (schedule.study_blocks || []).filter(function (b) { return (b.kind || 'study') === kind; }).length;
  }

  function openPurge() {
    var box = document.getElementById('purge-types');
    box.innerHTML = PURGE_TYPES.map(function (t) {
      var n = purgeTypeTotal(t.k);
      return '<button type="button" class="sch-chip' + (n ? '' : ' is-empty') +
        '" data-ptype="' + t.k + '">' +
        escapeH(isAr() ? t.ar : t.en) + '<span class="sch-chip-n">' + n + '</span></button>';
    }).join('');
    /*@3.SCHJ.175*/
    var cbox = document.getElementById('purge-courses');
    cbox.innerHTML = scheduleCourseCodes().map(function (c) {
      var n = purgeCourseTotal(c);
      return '<button type="button" class="sch-chip' + (n ? '' : ' is-empty') +
        '" data-pcourse="' + escapeH(c) + '" ' +
        'style="--chip-color:' + getCourseColor(c) + '"><span class="sch-chip-dot"></span>' +
        escapeH(courseShort(c)) + '<span class="sch-chip-n">' + n + '</span></button>';
    }).join('');
    document.getElementById('purge-from').value = '';
    document.getElementById('purge-to').value = '';
    box.querySelectorAll('.sch-chip').forEach(bindToggle);
    cbox.querySelectorAll('.sch-chip').forEach(bindToggle);
    document.getElementById('purge-from').oninput = updatePurgeCount;
    document.getElementById('purge-to').oninput = updatePurgeCount;
    updatePurgeCount();
    document.getElementById('modal-purge').style.display = '';
    function bindToggle(b) {
      b.addEventListener('click', function () { this.classList.toggle('is-on'); updatePurgeCount(); });
    }
  }

  function purgeSelection() {
    var types = [], courses = [];
    document.querySelectorAll('#purge-types .sch-chip.is-on').forEach(function (b) { types.push(b.getAttribute('data-ptype')); });
    document.querySelectorAll('#purge-courses .sch-chip.is-on').forEach(function (b) { courses.push(b.getAttribute('data-pcourse')); });
    return {
      types: types, courses: courses,
      from: document.getElementById('purge-from').value,
      to: document.getElementById('purge-to').value
    };
  }

  /*@3.SCHJ.176*/
  function purgeMatches() {
    var f = purgeSelection();
    var out = { lectures: [], study_blocks: [], exams: [], general_events: [], intensive: [] };
    function typeOn(k) { return !f.types.length || f.types.indexOf(k) !== -1; }
    function courseOn(c) { return !f.courses.length || f.courses.indexOf(c) !== -1; }
    function dateOn(dstr) {
      if (!dstr) return !f.from && !f.to;   /*@3.SCHJ.177*/
      if (f.from && dstr < f.from) return false;
      if (f.to && dstr > f.to) return false;
      return true;
    }
    if (typeOn('lecture')) {
      schedule.lectures.forEach(function (l) { if (courseOn(l.course_code) && dateOn(null)) out.lectures.push(l.id); });
    }
    schedule.study_blocks.forEach(function (b) {
      var k = b.kind || 'study';
      if (!typeOn(k)) return;
      if (!courseOn(b.course_code)) return;
      var dstr = null;
      if (b.week_id) { var wd = weekIdToDate(b.week_id, b.day); dstr = wd ? fmtLocalDate(wd) : null; }
      if (!dateOn(dstr)) return;
      out.study_blocks.push(b.id);
    });
    if (typeOn('exam')) {
      schedule.exams.forEach(function (x) { if (courseOn(x.course_code) && dateOn(x.date)) out.exams.push(x.id); });
    }
    if (typeOn('general')) {
      (schedule.general_events || []).forEach(function (g) { if (courseOn(g.course_code) && dateOn(g.date)) out.general_events.push(g.id); });
    }
    if (typeOn('intensive')) {
      var p = activePlan();
      if (p) p.sessions.forEach(function (s) { if (courseOn(s.course) && dateOn(s.date)) out.intensive.push(s.id); });
    }
    return out;
  }
  function purgeCount(m) {
    return m.lectures.length + m.study_blocks.length + m.exams.length + m.general_events.length + m.intensive.length;
  }
  /*@3.SCHJ.178*/
  function purgeZeroWhy() {
    var f = purgeSelection();
    var dated = !!(f.from || f.to);
    var lecOn = !f.types.length || f.types.indexOf('lecture') !== -1;
    if (dated && lecOn) {
      return isAr()
        ? 'لا شيء يطابق — والمحاضرات لا تدخل عند تحديد مدًى زمنيّ (فهي متكرّرة بلا تاريخ). امسح المدى لتشملها.'
        : 'Nothing matches — lectures are excluded whenever a date range is set (they recur with no single date). Clear the range to include them.';
    }
    if (f.courses.length || f.types.length || dated) {
      return isAr() ? 'لا شيء يطابق هذه الفلاتر — وسّعها أو امسح بعضها.'
                    : 'Nothing matches these filters — widen or clear some of them.';
    }
    return isAr() ? 'لا أحداث في جدولك لتُحذف.' : 'No events in your schedule to delete.';
  }
  function updatePurgeCount() {
    var n = purgeCount(purgeMatches());
    document.getElementById('purge-count').textContent = n
      ? (isAr() ? ('سيُحذف ' + n + ' عنصراً') : ('Will delete ' + n + ' item' + (n === 1 ? '' : 's')))
      : purgeZeroWhy();
    document.getElementById('purge-run').disabled = (n === 0);
  }
  /*@3.SCHJ.246*/
  function purgeLinkedCrns(m) {
    var out = [];
    (schedule.lectures || []).forEach(function (l) {
      if (l && l.sx_crn && m.lectures.indexOf(l.id) !== -1 && out.indexOf(l.sx_crn) === -1) out.push(l.sx_crn);
    });
    (schedule.exams || []).forEach(function (x) {
      if (x && x.sx_crn && m.exams.indexOf(x.id) !== -1 && out.indexOf(x.sx_crn) === -1) out.push(x.sx_crn);
    });
    return out;
  }

  function offerStopFetch(crns) {
    if (!crns.length) return;
    askConfirm(
      isAr() ? 'أتوقف جلبها من البانر؟' : 'Stop fetching from Banner?',
      isAr() ? ('حُذفت. وشعبُ ' + crns.join('، ') + ' يعيدها جلبُ البانر عند أوّل فتحةٍ لصفحة الشعب. ' +
                'أنوقف جلبَها؟ يمكنك استئنافُه من هذه الإعدادات متى شئت.')
             : ('Deleted. Banner will bring ' + crns.join(', ') + ' back next time you open the sections page. ' +
                'Stop fetching them? You can resume from these settings at any time.'),
      isAr() ? 'أوقف جلبها' : 'Stop fetching',
      function () {
        if (!schedule.sx_optout || typeof schedule.sx_optout !== 'object') schedule.sx_optout = {};
        crns.forEach(function (c) {
          schedule.sx_optout[String(c)] = { at: new Date().toISOString(), scope: 'all' };
        });
        save();
        refreshEditorSurfaces();
        renderEditorCourses();
        render();
      }, 'fa-link-slash');
  }

  function runPurge() {
    var m = purgeMatches(), n = purgeCount(m);
    if (!n) return;
    /*@3.SCHJ.248*/
    var linkedCrns = purgeLinkedCrns(m);
    var warn = linkedCrns.length
      ? (isAr() ? (' ومنها ' + linkedCrns.length + ' شعبةً مجلوبةً من البانر (' + linkedCrns.join('، ') +
                   ') يعيدها الجلبُ ما لم توقفه — وسنعرض عليك إيقافَه بعد الحذف.')
                : (' ' + linkedCrns.length + ' of them come from Banner (' + linkedCrns.join(', ') +
                   ') and will return unless you stop fetching them — we will offer that next.'))
      : '';
    askConfirm(
      isAr() ? 'تنظيف الأحداث' : 'Clean up events',
      (isAr() ? ('سيُحذف ' + n + ' عنصراً نهائياً.' + warn + ' متابعة؟')
              : ('This will permanently delete ' + n + ' items.' + warn + ' Continue?')),
      isAr() ? 'حذف المحدَّد' : 'Delete selected',
      function () {
        schedule.lectures = schedule.lectures.filter(function (l) { return m.lectures.indexOf(l.id) === -1; });
        schedule.study_blocks = schedule.study_blocks.filter(function (b) { return m.study_blocks.indexOf(b.id) === -1; });
        schedule.exams = schedule.exams.filter(function (x) { return m.exams.indexOf(x.id) === -1; });
        schedule.general_events = (schedule.general_events || []).filter(function (g) { return m.general_events.indexOf(g.id) === -1; });
        var p = activePlan();
        if (p && m.intensive.length) p.sessions = p.sessions.filter(function (s) { return m.intensive.indexOf(s.id) === -1; });
        /*@3.SCHJ.284*/
        /*@3.SCHJ.285*/
        (function purgeArchived() {
          var A = schedule.archived;
          if (!A) return;
          var sel = purgeSelection();
          var typeOn = function (k) { return !sel.types.length || sel.types.indexOf(k) !== -1; };
          var courseOn = function (c) { return !sel.courses.length || sel.courses.indexOf(c) !== -1; };
          Object.keys(A).forEach(function (key) {
            var box = A[key]; if (!box) { delete A[key]; return; }
            if (Array.isArray(box.lectures) && typeOn('lecture')) {
              box.lectures = box.lectures.filter(function (r) { return !courseOn(r.course_code); });
            }
            if (Array.isArray(box.study_blocks)) {
              box.study_blocks = box.study_blocks.filter(function (r) {
                return !(typeOn(r.kind || 'study') && courseOn(r.course_code));
              });
            }
            if (Array.isArray(box.exams) && typeOn('exam')) {
              box.exams = box.exams.filter(function (r) { return !courseOn(r.course_code); });
            }
            if (Array.isArray(box.general_events) && typeOn('event')) {
              box.general_events = box.general_events.filter(function (r) { return !courseOn(r.course_code); });
            }
            var any = ['lectures', 'study_blocks', 'exams', 'general_events']
              .some(function (k) { return (box[k] || []).length; });
            if (!any) delete A[key];
          });
        })();
        if (window.GardenSXLink && GardenSXLink.forgetPick) {
          linkedCrns.forEach(function (c) { GardenSXLink.forgetPick(c); });
        }
        /*@3.SCHJ.179*/
        if (m.lectures.length) {
          Object.keys(schedule.week_overrides || {}).forEach(function (w) {
            var o = schedule.week_overrides[w];
            if (o && o.cancelled_lectures) {
              o.cancelled_lectures = o.cancelled_lectures.filter(function (x) { return m.lectures.indexOf(x) === -1; });
            }
          });
        }
        save();
        closeModal('modal-purge');
        refreshEditorSurfaces();
        render();
        offerStopFetch(linkedCrns);
      }, 'fa-trash');
  }
  /*@3.SCHJ.180*/
  function weekIdToDate(weekId, dayName) {
    var m = /^(\d{4})-W(\d{2})$/.exec(String(weekId));
    if (!m) return null;
    var year = parseInt(m[1], 10), wk = parseInt(m[2], 10);
    var jan4 = new Date(year, 0, 4);
    var mon = new Date(jan4); mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    mon.setDate(mon.getDate() + (wk - 1) * 7);
    var sun = new Date(mon); sun.setDate(sun.getDate() - 1);   /*@3.SCHJ.181*/
    sun.setDate(sun.getDate() + DAYS_ORDER.indexOf(dayName || 'sunday'));
    return sun;
  }

  /*@3.SCHJ.182*/
  function legacyKeys() {
    if (window.ByteLegacy) return window.ByteLegacy.keys();
    var P1 = 'plan' + 'ner_', P2 = 'study_' + 'plan_';
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf(P1) === 0 || k.indexOf(P2) === 0)) out.push(k);
      }
    } catch (e) {}
    return out;
  }
  function maybeShowLegacyNotice() {
    if (schedule.settings.legacy_notice_seen) return;
    var keys = legacyKeys();
    if (!keys.length) return;
    document.getElementById('legacy-count').textContent = isAr()
      ? ('وجدنا ' + keys.length + ' مفتاحاً محفوظاً من النظام السابق.')
      : ('We found ' + keys.length + ' saved keys from the previous system.');
    document.getElementById('modal-legacy').style.display = '';

    /*@3.SCHJ.183*/
    var expBtn = document.getElementById('legacy-export');
    if (expBtn) expBtn.onclick = function () {
      if (window.ByteLegacy) window.ByteLegacy.exportFile();
    };
    document.getElementById('legacy-wipe').onclick = function () {
      askConfirm(
        isAr() ? 'مسح بيانات النظام السابق' : 'Wipe previous-system data',
        isAr() ? 'حذفٌ نهائيّ لا رجعة فيه. هل صدّرتَ نسخةً؟'
               : 'Permanent, irreversible delete. Did you export a copy?',
        isAr() ? 'امسحها' : 'Wipe them',
        function () {
          var n = window.ByteLegacy ? window.ByteLegacy.wipe() : (function () {
            var ks = legacyKeys();
            ks.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
            return ks.length;
          })();
          /*@3.SCHJ.184*/
          var box = document.getElementById('legacy-count');
          if (box) box.textContent = isAr() ? ('حُذف ' + n + ' مفتاحاً.') : ('Deleted ' + n + ' keys.');
          setTimeout(finishLegacy, 900);
        }, 'fa-trash');
    };
    document.getElementById('legacy-close').onclick = finishLegacy;
    function finishLegacy() {
      /*@3.SCHJ.185*/
      schedule.settings.legacy_notice_seen = true;
      save();
      closeModal('modal-legacy');
    }
  }

  /*@3.SCHJ.186*/
  function openEditor() {
    var lang = isAr() ? 'ar' : 'en';
    var active = schedule.settings.active_days || [];
    /*@3.SCHJ.187*/
    document.getElementById('editor-days').innerHTML = DAYS_ORDER.map(function (d) {
      return '<label class="sch-day"><input type="checkbox" data-eday="' + d + '"' +
        (active.indexOf(d) !== -1 ? ' checked' : '') + '>' +
        '<span class="sch-day-box"><i class="fa-solid fa-check"></i></span>' +
        '<span>' + escapeH(DAY_NAMES[lang][d]) + '</span></label>';
    }).join('');
    document.getElementById('editor-start').value = schedule.settings.term_start_date || '';
    document.getElementById('editor-term-type').value = schedule.settings.term_type || 'normal';
    document.getElementById('editor-end').value = schedule.settings.semester_end_date || '';
    TP.set('editor-day-start', minToHM24(schedule.settings.day_start_hour * 60));
    TP.set('editor-day-end', minToHM24((schedule.settings.day_end_hour % 24) * 60));
    var fp = schedule.settings.focus_periods || { midterm:{}, final:{} };
    document.getElementById('editor-mid-start').value = (fp.midterm && fp.midterm.start) || '';
    document.getElementById('editor-mid-end').value = (fp.midterm && fp.midterm.end) || '';
    document.getElementById('editor-fin-start').value = (fp.final && fp.final.start) || '';
    document.getElementById('editor-fin-end').value = (fp.final && fp.final.end) || '';
    renderTermSuggest();
    renderPendingBar();
    renderEditorCourses();
    renderArchiveList();
    if (window.GardenSchedulePlan && window.GardenSchedulePlan.renderSettingsSection) {
      window.GardenSchedulePlan.renderSettingsSection(document.getElementById('editor-plans'));
    }
    syncTermSeg();
    if (window.GardenICSPanel) GardenICSPanel.mount(document.getElementById('ics-card'));
    if (!schedule.settings.onboarded) { schedule.settings.onboarded = true; save(); }
    document.getElementById('modal-editor').style.display = '';
    initEditorRail();
  }

  /*@3.SCHJ.188*/
  var railBound = false;

  function initEditorRail() {
    var scroll = document.getElementById('editor-scroll');
    var rail = document.getElementById('editor-rail');
    if (!scroll || !rail) return;

    if (!railBound) {
      railBound = true;
      rail.addEventListener('click', function (e) {
        var b = e.target.closest('.set-rail-item');
        if (b) goEditorSec(b.getAttribute('data-go'));
      });
      /*@3.SCHJ.189*/
      var ticking = false;
      scroll.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; spyEditor(); });
      });
      window.addEventListener('resize', measureRail);
      document.addEventListener('garden:languageChanged', measureRail);
    }
    /*@3.SCHJ.190*/
    measureRail();

    /*@3.SCHJ.191*/
    scroll.scrollTop = 0;
    markEditorRail('term');
  }

  /*@3.SCHJ.192*/
  function syncTermSeg() {
    var seg = document.getElementById('editor-term-seg');
    var hid = document.getElementById('editor-term-type');
    if (!seg || !hid) return;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-v') === (hid.value || 'normal'));
    });
    if (seg.dataset.bound) return;
    seg.dataset.bound = '1';
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      hid.value = b.getAttribute('data-v');
      syncTermSeg();
      hid.dispatchEvent(new Event('change'));
    });
  }

  /*@3.SCHJ.193*/
  function measureRail() {
    var scroll = document.getElementById('editor-scroll');
    var wrap = document.querySelector('.sch-ed-railwrap');
    if (!scroll || !wrap) return;
    var h = wrap.offsetHeight;
    if (h > 0) scroll.style.setProperty('--sch-ed-rail', h + 'px');
  }

  function markEditorRail(sec) {
    var rail = document.getElementById('editor-rail');
    if (!rail) return;
    Array.prototype.forEach.call(rail.querySelectorAll('.set-rail-item'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-go') === sec);
    });
  }

  function goEditorSec(sec) {
    var card = document.getElementById('sec-' + sec);
    if (!card) return;
    /*@3.SCHJ.194*/
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' });
    markEditorRail(sec);
    card.classList.add('is-hit');
    setTimeout(function () { card.classList.remove('is-hit'); }, 1400);
  }

  function spyEditor() {
    var scroll = document.getElementById('editor-scroll');
    if (!scroll) return;
    var y = scroll.getBoundingClientRect().top + 90;
    var best = null, bestD = Infinity;
    Array.prototype.forEach.call(scroll.querySelectorAll('.set-card'), function (c) {
      var d = Math.abs(c.getBoundingClientRect().top - y);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (best) markEditorRail(best.getAttribute('data-sec'));
  }

  function renderArchiveList() {
    var box = document.getElementById('editor-archive');
    var codes = Object.keys(schedule.archived || {});
    if (!codes.length) {
      box.innerHTML = '<p class="sch-editor-hint">' +
        (isAr() ? 'لا مواد مؤرشفة.' : 'No archived courses.') + '</p>';
      return;
    }
    box.innerHTML = codes.map(function (c) {
      var b = schedule.archived[c];
      var n = (b.lectures || []).length + (b.study_blocks || []).length + (b.exams || []).length;
      return '<div class="sch-ecourse"><div class="sch-ecourse-head">' +
        '<span class="sch-ecourse-dot" style="background:' + getCourseColor(c) + '"></span>' +
        escapeH(courseDisplayName(c)) + ' · ' + n + '</div>' +
        '<div class="sch-modal-actions" style="margin-top:.35rem">' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-arestore="' + escapeH(c) + '">' +
          (isAr() ? '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> استعادة' : '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Restore') + '</button>' +
        '<button class="sch-btn sch-btn-danger sch-btn-xs" data-adelete="' + escapeH(c) + '">' +
          (isAr() ? '<i class="fa-solid fa-trash" aria-hidden="true"></i> حذف نهائي' : '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete forever') + '</button>' +
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-arestore]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-arestore'), bk = schedule.archived[c];
        ['lectures','study_blocks','exams'].forEach(function (k) { schedule[k] = (schedule[k] || []).concat(bk[k] || []); });
        delete schedule.archived[c];
        /*@3.SCHJ.195*/
        save(); refreshEditorSurfaces(); render();
      });
    });
    box.querySelectorAll('[data-adelete]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-adelete');
        askConfirm(
          isAr() ? 'حذف نهائي' : 'Delete forever',
          isAr() ? ('حذف أحداث ' + c + ' نهائياً؟') : ('Delete ' + c + ' events forever?'),
          isAr() ? 'حذف نهائي' : 'Delete forever',
          function () {
            delete schedule.archived[c];
            save(); renderArchiveList();
          }, 'fa-trash');
      });
    });
  }

  function durationOf(l) {
    if (l.duration) return l.duration;
    var s = parseHM(l.start_time), e = parseHM(l.end_time);
    return (s !== null && e !== null && e > s) ? (e - s) : 50;
  }

  /*@3.SCHJ.196*/
  function modulesEditor(c) {
    if (!c || !Array.isArray(c.modules) || !c.modules.length) return '';
    return '<div class="sch-mods">' +
      '<button type="button" class="sch-mods-btn" data-modtoggle="1">' +
        '<i class="fa-solid fa-list-ol"></i>' +
        (isAr() ? ('أسماء الوحدات (' + c.modules.length + ')')
                : ('Module names (' + c.modules.length + ')')) + '</button>' +
      '<div class="sch-mods-list" hidden>' + c.modules.map(function (m, i) {
        return '<div class="sch-mods-row"><span>' + (i + 1) + '</span>' +
          '<input type="text" class="sch-input ec-mod" data-mid="' + escapeH(m.id || ('m' + (i + 1))) +
          '" value="' + escapeH(isAr() ? (m.title || '') : (m.title_en || m.title || '')) +
          '" placeholder="' + (isAr() ? 'اسم الوحدة' : 'Module name') + '"></div>';
      }).join('') + '</div></div>';
  }

  /*@3.SCHJ.239*/
  var OPT_LBL = { all: ['كلَّها', 'everything'], lectures: ['محاضراتِها', 'its lectures'],
                  exams: ['اختباراتِها', 'its exams'] };

  function optOutHtml() {
    var map = (schedule && schedule.sx_optout && typeof schedule.sx_optout === 'object')
      ? schedule.sx_optout : {};
    var crns = Object.keys(map);
    if (!crns.length) return '';
    return '<div class="sch-pending" style="margin-block-start:.9rem">' +
      '<div class="sch-pending-h"><i class="fa-solid fa-link-slash" aria-hidden="true"></i><b>' +
        (isAr() ? 'شعبٌ أوقفتَ جلبها من البانر' : 'Sections you stopped fetching') + '</b></div>' +
      '<div class="sch-pending-list">' + crns.map(function (c) {
        var sc = (map[c] && map[c].scope) || 'all';
        var lbl = OPT_LBL[sc] || OPT_LBL.all;
        return '<span class="sch-pending-i"><b dir="ltr">' + escapeH(c) + '</b>' +
          '<span>' + escapeH(isAr() ? lbl[0] : lbl[1]) + '</span>' +
          '<button class="sch-btn sch-btn-secondary" type="button" data-optback="' + escapeH(c) + '">' +
            (isAr() ? 'استأنفْ' : 'Resume') + '</button></span>';
      }).join('') + '</div>' +
      '<p class="sch-editor-hint">' + (isAr()
        ? 'لن تُبنى من البانر ما دامت هنا. والاستئنافُ يعيدها في أوّل فتحةٍ لصفحة الشعب.'
        : 'They will not be rebuilt from Banner while listed here. Resuming brings them back next time you open the sections page.') + '</p>' +
    '</div>';
  }

  /*@3.SCHJ.244*/
  function dropCourseFromSemester(code) {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null'); } catch (e) { return false; }
    if (!sem || !Array.isArray(sem.courses)) return false;
    var keep = sem.courses.filter(function (c) { return !c || c.code !== code; });
    if (keep.length === sem.courses.length) return false;
    sem.courses = keep;
    sem.updated_at = new Date().toISOString();
    try {
      localStorage.setItem(LS_SEMESTER, JSON.stringify(sem));
      localStorage.setItem('__syncT_' + LS_SEMESTER, String(Date.now()));
    } catch (e) { return false; }
    return true;
  }

  function wireOptBack(box) {
    box.querySelectorAll('[data-optback]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-optback');
        if (schedule.sx_optout) {
          delete schedule.sx_optout[c];
          if (!Object.keys(schedule.sx_optout).length) delete schedule.sx_optout;
          save();
        }
        renderEditorCourses();
      });
    });
  }

  function renderEditorCourses() {
    var box = document.getElementById('editor-courses');
    var courses = semesterCourses();
    if (!courses.length) {
      box.innerHTML = '<p class="sch-editor-hint">' +
        (isAr() ? 'لا مواد في فصلك الخاص بعد — أضِفها من صفحة الفصل.' : 'No courses in your semester yet.') +
        '</p>' + optOutHtml();
      wireOptBack(box);
      return;
    }
    var lang = isAr() ? 'ar' : 'en';
    box.innerHTML = courses.map(function (c) {
      var code = c.code, color = getCourseColor(code);
      var existing = schedule.lectures.filter(function (l) { return l.course_code === code; });
      var days = existing.map(function (l) { return l.day; });
      var first = existing[0];
      var start = first ? first.start_time : '15:00';
      var dur = first ? durationOf(first) : 50;
      var attend = (first && first.attendance) ? first.attendance : 'in_person';
      var form = (first && first.kind) ? first.kind : 'lecture';
      var room = first ? (first.room || '') : '';
      var chips = DAYS_ORDER.map(function (d) {
        return '<button type="button" class="sch-daychip' + (days.indexOf(d) !== -1 ? ' on' : '') +
          '" data-ecdaych="' + d + '">' + escapeH(DAY_SHORT[lang][d]) + '</button>';
      }).join('');
      /*@3.SCHJ.245*/
      var base0 = escapeH(JSON.stringify({ start: start, dur: dur, attend: attend, form: form, room: room }));
      return '<div class="sch-ecourse" data-ecode="' + escapeH(code) + '" data-ec0="' + base0 + '">' +
        '<div class="sch-ecourse-head"><span class="sch-ecourse-dot" style="background:' + color + '"></span>' +
          '<span class="sch-ecourse-nm">' + escapeH(courseDisplayName(code)) + '</span>' +
          /*@3.SCHJ.242*/
          '<button class="sch-ecourse-x" type="button" data-ecdrop="' + escapeH(code) + '" ' +
            'aria-label="' + escapeH(isAr() ? ('احذف ' + courseDisplayName(code) + ' من فصلك')
                                            : ('Remove ' + courseDisplayName(code) + ' from your term')) + '" ' +
            'title="' + escapeH(isAr() ? 'احذفها من فصلك' : 'Remove from your term') + '">' +
            '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="sch-daychips">' + chips + '</div>' +
        '<div class="sch-ecourse-row">' +
          '<div><label class="sch-label">' + (isAr() ? 'البداية' : 'Start') + '</label>' +
            '<div class="sch-timepick"><select class="tp-h"></select><span class="tp-colon">:</span>' +
            '<select class="tp-m"></select><select class="tp-mer"></select>' +
            '<input type="hidden" class="ec-start" value="' + start + '"></div></div>' +
          '<div><label class="sch-label">' + (isAr() ? 'المدة (د)' : 'Duration') + '</label>' +
            '<input type="number" class="sch-input ec-dur" min="30" max="180" step="5" value="' + dur + '"></div>' +
        '</div>' +
        '<div class="sch-ecourse-row" style="margin-top:.4rem">' +
          '<div><label class="sch-label">' + (isAr() ? 'الشكل' : 'Form') + '</label>' +
            '<select class="sch-select ec-form">' +
            '<option value="lecture"' + (form === 'lecture' ? ' selected' : '') + '>' + L(LEC_FORM.lecture) + '</option>' +
            '<option value="lab"' + (form === 'lab' ? ' selected' : '') + '>' + L(LEC_FORM.lab) + '</option>' +
            '</select></div>' +
          '<div><label class="sch-label">' + (isAr() ? 'الحضور' : 'Attendance') + '</label>' +
            '<select class="sch-select ec-attend">' +
            '<option value="in_person"' + (attend === 'in_person' ? ' selected' : '') + '>' + L(ATTEND.in_person) + '</option>' +
            '<option value="remote"' + (attend === 'remote' ? ' selected' : '') + '>' + L(ATTEND.remote) + '</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="sch-room-wrap" style="display:' + (attend === 'remote' ? 'none' : '') + '">' +
          '<label class="sch-label">' + (isAr() ? 'رقم القاعة' : 'Room') + '</label>' +
          '<input type="text" class="sch-input ec-room" value="' + escapeH(room) + '" placeholder="B204"></div>' +
        modulesEditor(c) +
      '</div>';
    }).join('');
    box.querySelectorAll('.sch-daychip').forEach(function (chip) {
      chip.addEventListener('click', function () { this.classList.toggle('on'); });
    });
    box.querySelectorAll('[data-modtoggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var w = this.parentElement.querySelector('.sch-mods-list');
        if (w) w.hidden = !w.hidden;
      });
    });
    box.querySelectorAll('.ec-attend').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var w = this.closest('.sch-ecourse').querySelector('.sch-room-wrap');
        if (w) w.style.display = this.value === 'remote' ? 'none' : '';
      });
    });
    /*@3.SCHJ.240*/
    box.insertAdjacentHTML('beforeend', optOutHtml());
    wireOptBack(box);
    /*@3.SCHJ.243*/
    box.querySelectorAll('[data-ecdrop]').forEach(function (b) {
      b.addEventListener('click', function () {
        var code = this.getAttribute('data-ecdrop');
        var nm = courseDisplayName(code);
        askConfirm(
          isAr() ? 'حذف مادة' : 'Remove course',
          isAr() ? ('ستخرج «' + nm + '» من فصلك، وتُحذف أوقاتُها ومواعيدُها ومهامُّها. ولا يمكن التراجع.')
                 : ('“' + nm + '” leaves your term; its times, deadlines and tasks are deleted. This cannot be undone.'),
          isAr() ? 'احذفها' : 'Remove',
          function () {
            try { if (window.GardenData) GardenData.removeCourseTraces(code); } catch (e) {}
            dropCourseFromSemester(code);
            reloadState();
            renderEditorCourses();
            refreshEditorSurfaces();
            render();
          }, 'fa-trash');
      });
    });
    TP.build(box);
    /*@3.SCHJ.197*/
    if (window.GardenSelect) GardenSelect.enhance(box);
  }

  function autoArrange() {
    var t = minToHM24(schedule.settings.day_start_hour * 60);
    document.querySelectorAll('#editor-courses .sch-ecourse').forEach(function (card) {
      var dur = parseInt(card.querySelector('.ec-dur').value, 10) || 50;
      TP.setEl(card.querySelector('.ec-start'), t);
      t = addMinutes(t, dur);
    });
  }

  function saveEditor() {
    var days = [];
    document.querySelectorAll('#editor-days input[data-eday]:checked').forEach(function (cb) {
      days.push(cb.getAttribute('data-eday'));
    });
    if (days.length) {
      schedule.settings.active_days = days.sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });
    }
    schedule.settings.term_start_date = document.getElementById('editor-start').value || '';
    schedule.settings.term_type = document.getElementById('editor-term-type').value || 'normal';
    schedule.settings.semester_end_date = document.getElementById('editor-end').value || '';

    var ds = parseHM(document.getElementById('editor-day-start').value);
    var de = parseHM(document.getElementById('editor-day-end').value);
    if (ds !== null) schedule.settings.day_start_hour = Math.floor(ds / 60);
    if (de !== null) schedule.settings.day_end_hour = Math.max(schedule.settings.day_start_hour + 1, Math.ceil(de / 60) || 24);

    schedule.settings.focus_periods = {
      midterm: { start: document.getElementById('editor-mid-start').value || '', end: document.getElementById('editor-mid-end').value || '' },
      final:   { start: document.getElementById('editor-fin-start').value || '', end: document.getElementById('editor-fin-end').value || '' }
    };
    schedule.settings.onboarded = true;

    document.querySelectorAll('#editor-courses .sch-ecourse').forEach(function (card) {
      var code = card.getAttribute('data-ecode');
      var lecDays = [];
      card.querySelectorAll('.sch-daychip.on').forEach(function (ch) { lecDays.push(ch.getAttribute('data-ecdaych')); });
      var start = card.querySelector('.ec-start').value || '15:00';
      var dur = parseInt(card.querySelector('.ec-dur').value, 10) || 50;
      var attend = card.querySelector('.ec-attend').value;
      var form = card.querySelector('.ec-form').value;
      var room = attend === 'in_person' ? (card.querySelector('.ec-room').value || '') : '';
      var end = addMinutes(start, dur);
      /*@3.SCHJ.198*/
      /*@3.SCHJ.247*/
      var base = {};
      try { base = JSON.parse(card.getAttribute('data-ec0') || '{}') || {}; } catch (e) { base = {}; }
      var setTime = (start !== base.start) || (dur !== base.dur);
      var setForm = (form !== base.form) || (attend !== base.attend) || (room !== base.room);
      var prev = schedule.lectures.filter(function (l) { return l.course_code === code; });
      var byDay = {}, tagAny = '', srcRow = prev[0] || null;
      prev.forEach(function (l) {
        (byDay[l.day] || (byDay[l.day] = [])).push(l);
        if (!tagAny && l.sx_crn) tagAny = l.sx_crn;
      });
      var keepRows = [];
      lecDays.forEach(function (d) {
        var cur = byDay[d];
        if (cur && cur.length) {
          cur.forEach(function (l) {
            if (setTime) { l.start_time = start; l.end_time = end; l.duration = dur; }
            if (setForm) { l.kind = form; l.attendance = attend; l.room = attend === 'in_person' ? room : ''; }
            keepRows.push(l);
          });
          delete byDay[d];
          return;
        }
        var row = {
          id: 'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          course_code: code, day: d, start_time: start, end_time: end,
          room: room, kind: form, attendance: attend, recurring: true,
          color: getCourseColor(code), duration: dur
        };
        if (tagAny) row.sx_crn = tagAny;
        if (srcRow && srcRow.start_date) row.start_date = srcRow.start_date;
        if (srcRow && srcRow.end_date) row.end_date = srcRow.end_date;
        keepRows.push(row);
      });
      schedule.lectures = schedule.lectures.filter(function (l) { return l.course_code !== code; })
                                           .concat(keepRows);
      /*@3.SCHJ.199*/
      var mods = card.querySelectorAll('.ec-mod');
      if (mods.length) {
        var entry = semesterCourses().filter(function (x) { return x.code === code; })[0];
        if (entry && Array.isArray(entry.modules)) {
          var ar = isAr();
          Array.prototype.forEach.call(mods, function (inp) {
            var mid = inp.getAttribute('data-mid');
            var m = entry.modules.filter(function (x) { return x.id === mid; })[0];
            if (!m) return;
            var v = (inp.value || '').trim();
            if (!v) return;
            if (ar) { m.title = v; if (!m.title_en) m.title_en = v; }
            else { m.title_en = v; if (!m.title) m.title = v; }
          });
          semesterDirty = true;
        }
      }
    });
    if (semesterDirty) { semesterDirty = false; saveSemester(); }
    save();
    closeModal('modal-editor');
    warnOrphanBlocks();
    render();
  }

  /*@3.SCHJ.200*/
  function warnOrphanBlocks() {
    var active = schedule.settings.active_days || [];
    var orphans = schedule.study_blocks.filter(function (b) { return active.indexOf(b.day) === -1; });
    if (!orphans.length) return;
    alert(isAr()
      ? ('لديك ' + orphans.length + ' بلوك مذاكرة في أيامٍ أخفيتَها من العرض الأسبوعي — لم تُحذف، وتبقى في الأجندة والعرض اليومي والشهري.')
      : (orphans.length + ' study blocks fall on days hidden from the weekly view — nothing was deleted; they remain in the agenda, day and month views.'));
  }

  /*@3.SCHJ.201*/
  function openDayAgenda(date) {
    currentDayDate = new Date(date);
    currentWeekStart = getWeekStartDate(date);
    currentView = 'day';
    agendaOn = true;
    dayFocusFilter = true;
    schedule.settings.agenda = true;
    save();
    syncViewButtons();
    render();
  }
  function syncViewButtons() {
    document.querySelectorAll('.sch-view-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === currentView);
    });
    var ag = document.getElementById('btn-agenda');
    if (ag) ag.classList.toggle('is-on', agendaOn);
  }
  function switchView(view) {
    currentView = view;
    dayFocusFilter = false;
    didAutoScroll = false;
    dayWinStart = null;          /*@3.SCHJ.202*/
    /*@3.SCHJ.288*/
    if (agendaOn) {
      agendaOn = false;
      schedule.settings.agenda = false;
      save();
    }
    syncViewButtons();
    render();
  }

  function render() {
    counters.renders++;
    beginPass();
    try {
      updateTextContent();
      renderCourseChips();

      var showMonthNav = (currentView === 'month');
      var showWeekNav = !showMonthNav;
      document.getElementById('week-nav').style.display = showWeekNav ? '' : 'none';
      document.getElementById('month-nav').style.display = showMonthNav ? '' : 'none';
      /*@3.SCHJ.203*/

      /*@3.SCHJ.204*/
      var gw = document.getElementById('grid-wrap');
      var mw = document.getElementById('month-wrapper');
      var aw = document.getElementById('agenda-wrap');
      gw.style.display = 'none'; mw.style.display = 'none'; aw.style.display = 'none';

      updateNavLabel();
      updateFocusBanner();
      updateDayFilterBar();
      updateOutOfRangeBanner();

      if (agendaOn) {
        /*@3.SCHJ.309*/
        if (currentView === 'month') renderMonthNavOnly();
        renderPulse(scopeDates());
        renderAgendaView();
      } else if (currentView === 'month') {
        mw.style.display = '';
        renderPulse(scopeDates());
        renderMonthView();
      } else if (currentView === 'day') {
        document.getElementById('day-strip').style.display = 'none';
        renderPulse([new Date(currentDayDate)]);
        renderGrid([new Date(currentDayDate)]);
        wireDrag();
        playIntro();
      } else {
        var info = windowDates();
        renderDayStrip(info);
        renderPulse(info.all);
        renderGrid(info.shown);
        bindGridSwipe();
        wireDrag();
        playIntro();
      }
    } finally { endPass(); }
  }
  function renderMonthNavOnly() {
    document.getElementById('month-label').textContent =
      MONTH_NAMES[isAr() ? 'ar' : 'en'][currentMonthDate.getMonth()] + ' ' + currentMonthDate.getFullYear();
    document.getElementById('month-grid').innerHTML = '';
    document.getElementById('month-legend').innerHTML = '';
    document.getElementById('month-rail').innerHTML = '';
  }

  function updateNavLabel() {
    var lang = isAr() ? 'ar' : 'en';
    var numEl = document.getElementById('wk-num');
    var dateEl = document.getElementById('wk-date');
    if (currentView === 'day') {
      var w = studyWeekNumber(currentDayDate);
      numEl.textContent = DAY_NAMES[lang][DAYS_ORDER[currentDayDate.getDay()]] +
        (w ? (isAr() ? ' · الأسبوع ' + w : ' · Week ' + w) : '');
      dateEl.textContent = currentDayDate.getDate() + ' ' + MONTH_NAMES[lang][currentDayDate.getMonth()] +
        ' ' + currentDayDate.getFullYear();
    } else {
      var wn = studyWeekNumber(currentWeekStart);
      numEl.textContent = wn ? (isAr() ? 'الأسبوع ' + wn : 'Week ' + wn)
                             : (isAr() ? 'خارج الفصل' : 'Outside term');
      var e = new Date(currentWeekStart); e.setDate(e.getDate() + 6);
      dateEl.textContent = currentWeekStart.getDate() + ' – ' + e.getDate() + ' ' +
        MONTH_NAMES[lang][e.getMonth()] + ' ' + e.getFullYear();
    }
  }

  function updateFocusBanner() {
    var banner = document.getElementById('focus-banner');
    if (currentView === 'month') { banner.style.display = 'none'; return; }
    var ws = (currentView === 'day') ? getWeekStartDate(currentDayDate) : currentWeekStart;
    var RL = window.GardenScheduleRules;
    var n = (RL && RL.lectureNotice) ? RL.lectureNotice(
      (currentView === 'day') ? currentDayDate : ws, isAr()) : null;
    if (!n || n.why !== 'focus') { banner.style.display = 'none'; return; }
    document.getElementById('focus-banner-text').textContent = n.text;
    var btn = document.getElementById('btn-toggle-lectures');
    btn.textContent = n.action;
    btn.onclick = function () {
      RL.setLecturesShown(n.weekId, !n.shown);
      var raw = null;
      try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
      if (raw) schedule = migrateSchedule(raw);
      render();
    };
    banner.style.display = '';
  }

  function updateOutOfRangeBanner() {
    var bar = document.getElementById('outrange-banner');
    if (currentView === 'month') { bar.style.display = 'none'; return; }
    var ref = (currentView === 'day') ? currentDayDate : currentWeekStart;
    var end = new Date(ref); if (currentView !== 'day') end.setDate(end.getDate() + 6);
    var st = schedule.settings;
    var outside = (!inTermBounds(ref) && !inTermBounds(end));
    if (!outside || (!st.term_start_date && !st.semester_end_date)) { bar.style.display = 'none'; return; }
    var RL2 = window.GardenScheduleRules;
    var n2 = (RL2 && RL2.lectureNotice) ? RL2.lectureNotice(ref, isAr()) : null;
    bar.textContent = (n2 && n2.why === 'term') ? n2.text
      : (isAr() ? 'خارج مدى الفصل — لا تُعرض المحاضرات المتكرّرة'
                : 'Outside the term range — recurring lectures are not shown');
    bar.style.display = '';
  }

  function updateDayFilterBar() {
    var bar = document.getElementById('dayfilter-bar');
    if (!dayFocusFilter || currentView !== 'day') { bar.style.display = 'none'; return; }
    bar.innerHTML = '<span>' + (isAr() ? '<i class="fa-solid fa-list" aria-hidden="true"></i> أجندة هذا اليوم' : '<i class="fa-solid fa-list" aria-hidden="true"></i> This day\'s agenda') + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="btn-clear-dayfilter">' +
      (isAr() ? 'عرض اليوم كاملاً' : 'Show full day') + '</button>';
    document.getElementById('btn-clear-dayfilter').addEventListener('click', function () {
      dayFocusFilter = false;
      agendaOn = false;
      schedule.settings.agenda = false;
      didAutoScroll = false;
      save(); syncViewButtons(); render();
    });
    bar.style.display = '';
  }

  /*@3.SCHJ.221*/
  function renderCourseChips() {
    var box = document.getElementById('course-chips');
    if (!box) return;
    /*@3.SCHJ.205*/
    var host = document.getElementById('sch-cf');
    var codes = scheduleCourseCodes();
    if (!codes.length) {
      if (host) { host.style.display = 'none'; host.classList.remove('open'); }
      return;
    }
    if (host) host.style.display = '';
    var hidden = schedule.settings.course_filter || [];
    box.innerHTML = codes.map(function (c) {
      var on = hidden.indexOf(c) === -1;
      return '<button class="sch-cf-item ' + (on ? 'is-on' : 'is-off') + '" type="button" ' +
        'data-course="' + escapeH(c) + '" style="--chip-color:' + getCourseColor(c) + '" ' +
        'aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="sch-cf-box"><i class="fa-solid fa-check"></i></span>' +
        '<span class="sch-cf-dot"></span>' +
        '<span class="sch-cf-nm">' + escapeH(courseDisplayName(c)) + '</span>' +
        '<span class="sch-cf-code sch-code">' + escapeH(courseShort(c)) + '</span></button>';
    }).join('');
    box.querySelectorAll('[data-course]').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var c = this.getAttribute('data-course');
        var arr = schedule.settings.course_filter || [];
        var i = arr.indexOf(c);
        if (i === -1) arr.push(c); else arr.splice(i, 1);
        schedule.settings.course_filter = arr;
        save(); render();
      });
    });
    var n = hidden.filter(function (c) { return codes.indexOf(c) !== -1; }).length;
    var badge = document.getElementById('cf-n');
    if (badge) { badge.textContent = n ? String(n) : ''; badge.hidden = !n; }
    var all = document.getElementById('cf-all');
    if (all) all.disabled = !n;
  }

  /*@3.SCHJ.206*/
  function updateTextContent() {
    var ar = isAr();
    document.querySelectorAll('[data-ar]').forEach(function (el) {
      var t = ar ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if (t != null && t !== '') el.textContent = t;
    });
    document.querySelectorAll('[data-title-ar]').forEach(function (el) {
      var t = ar ? el.getAttribute('data-title-ar') : el.getAttribute('data-title-en');
      if (t) { el.setAttribute('title', t); el.setAttribute('aria-label', t); }
    });
    document.querySelectorAll('[data-ph-ar]').forEach(function (el) {
      var t = ar ? el.getAttribute('data-ph-ar') : el.getAttribute('data-ph-en');
      if (t) el.setAttribute('placeholder', t);
    });
    TP.relabelAll();
  }

  /*@3.SCHJ.207*/
  function on(id, ev, fn) {
    var e = document.getElementById(id);
    if (e) e.addEventListener(ev, fn);
  }

  function bindEvents() {
    document.querySelectorAll('.sch-view-btn[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { switchView(this.getAttribute('data-view')); });
    });

    on('btn-agenda', 'click', function () {
      agendaOn = !agendaOn;
      dayFocusFilter = false;
      schedule.settings.agenda = agendaOn;
      save(); syncViewButtons(); render();
    });

    var cf = document.getElementById('sch-cf');
    var cfBtn = document.getElementById('cf-btn');
    if (cf && cfBtn) {
      function setCf(open) {
        cf.classList.toggle('open', open);
        cfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      cfBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        setCf(!cf.classList.contains('open'));
      });
      document.addEventListener('click', function (ev) {
        if (cf.classList.contains('open') && !cf.contains(ev.target)) setCf(false);
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && cf.classList.contains('open')) setCf(false);
      });
    }
    on('cf-all', 'click', function (ev) {
      ev.stopPropagation();
      schedule.settings.course_filter = [];
      save(); render();
    });

    /*@3.SCHJ.208*/
    on('btn-prev-week', 'click', function () {
      if (currentView === 'day') currentDayDate.setDate(currentDayDate.getDate() - 1);
      else currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      dayWinStart = null; didAutoScroll = false; render();
    });
    on('btn-next-week', 'click', function () {
      if (currentView === 'day') currentDayDate.setDate(currentDayDate.getDate() + 1);
      else currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      dayWinStart = null; didAutoScroll = false; render();
    });
    on('btn-today', 'click', function () {
      currentWeekStart = getWeekStartDate(new Date());
      currentDayDate = new Date();
      currentMonthDate = new Date();
      dayWinStart = null; didAutoScroll = false; render();
    });
    on('btn-prev-month', 'click', function () {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1); render();
    });
    on('btn-next-month', 'click', function () {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1); render();
    });
    on('btn-this-month', 'click', function () {
      currentMonthDate = new Date();
      monthPick = null;
      render();
    });


    on('btn-save-lecture', 'click', saveLecture);
    on('btn-save-study', 'click', saveStudy);
    on('btn-save-exam', 'click', saveExam);
    on('btn-save-general', 'click', saveGeneral);

    on('lec-attend', 'change', toggleRoomField);
    on('study-kind', 'change', toggleCustomLabel);
    on('study-recurring', 'change', toggleSingleWeekField);
    on('gen-kind', 'change', function () { refreshGeneralPicker(); });
    on('gen-timed', 'change', toggleGenTime);

    ['lecture','study','exam','general'].forEach(function (k) {
      on('btn-cancel-' + k, 'click', function () {
        editingEvent = null; hideDeleteButtons(); closeModal('modal-add-' + k);
      });
    });

    on('del-lecture', 'click', function () {
      document.getElementById('lec-main-actions').style.display = 'none';
      document.getElementById('lec-del-scope').style.display = '';
    });
    on('del-lec-back', 'click', function () {
      document.getElementById('lec-del-scope').style.display = 'none';
      document.getElementById('lec-main-actions').style.display = '';
    });
    on('del-lec-week', 'click', function () {
      if (editingEvent && editingEvent.src === 'lecture') {
        var wid = editingEvent.weekId || getWeekId(currentWeekStart);
        var o = schedule.week_overrides[wid] || (schedule.week_overrides[wid] = {});
        o.cancelled_lectures = o.cancelled_lectures || [];
        if (o.cancelled_lectures.indexOf(editingEvent.id) === -1) o.cancelled_lectures.push(editingEvent.id);
        save();
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-lecture'); render();
    });
    on('del-lec-all', 'click', function () {
      if (editingEvent && editingEvent.src === 'lecture') {
        var id = editingEvent.id;
        schedule.lectures = schedule.lectures.filter(function (l) { return l.id !== id; });
        Object.keys(schedule.week_overrides).forEach(function (w) {
          var o = schedule.week_overrides[w];
          if (o && o.cancelled_lectures) o.cancelled_lectures = o.cancelled_lectures.filter(function (x) { return x !== id; });
        });
        save();
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-lecture'); render();
    });
    /*@3.SCHJ.237*/
    on('del-lec-stop', 'click', function () {
      if (editingEvent && editingEvent.src === 'lecture') {
        var id = editingEvent.id;
        var row = (schedule.lectures || []).filter(function (l) { return l.id === id; })[0];
        var crn = row && row.sx_crn;
        schedule.lectures = schedule.lectures.filter(function (l) { return l.id !== id; });
        Object.keys(schedule.week_overrides).forEach(function (w) {
          var o = schedule.week_overrides[w];
          if (o && o.cancelled_lectures) o.cancelled_lectures = o.cancelled_lectures.filter(function (x) { return x !== id; });
        });
        /*@3.SCHJ.241*/
        if (crn) {
          if (!schedule.sx_optout || typeof schedule.sx_optout !== 'object') schedule.sx_optout = {};
          schedule.sx_optout[String(crn)] = { at: new Date().toISOString(), scope: 'lectures' };
        }
        save();
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-lecture'); render();
    });
    on('del-study', 'click', function () {
      if (editingEvent && editingEvent.src === 'study') {
        schedule.study_blocks = schedule.study_blocks.filter(function (b) { return b.id !== editingEvent.id; });
        save();
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-study'); render();
    });
    on('del-exam', 'click', function () {
      if (editingEvent && editingEvent.src === 'exam') {
        schedule.exams = schedule.exams.filter(function (x) { return x.id !== editingEvent.id; });
        save();
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-exam'); render();
    });
    on('del-general', 'click', function () {
      if (editingEvent && editingEvent.src === 'general') {
        schedule.general_events = schedule.general_events.filter(function (g) { return g.id !== editingEvent.id; });
        save();
      } else if (editingEvent && editingEvent.src === 'task' && window.GardenData) {
        window.GardenData.deleteTask(editingEvent.id);
      }
      editingEvent = null; hideDeleteButtons(); closeModal('modal-add-general'); render();
    });

    on('sheet-close', 'click', closeSheet);
    on('btn-settings', 'click', openEditor);
    on('btn-close-editor', 'click', function () { closeModal('modal-editor'); });
    on('btn-cancel-editor', 'click', function () { closeModal('modal-editor'); });
    on('btn-save-editor', 'click', saveEditor);
    on('btn-auto-arrange', 'click', autoArrange);
    on('btn-open-purge', 'click', openPurge);
    on('purge-run', 'click', runPurge);
    on('purge-cancel', 'click', function () { closeModal('modal-purge'); });

    /*@3.SCHJ.209*/
    on('confirm-ok', 'click', function () {
      var f = confirmFn; confirmFn = null;
      closeModal('modal-confirm');
      if (f) f();
    });
    on('confirm-cancel', 'click', function () {
      confirmFn = null; closeModal('modal-confirm');
    });

    on('editor-start', 'change', function () {
      if (!this.value) return;
      var tt = detectTermType(this.value);
      document.getElementById('editor-term-type').value = tt;
      document.getElementById('editor-end').value = computeTermEnd(this.value, tt);
    });
    on('editor-term-type', 'change', function () {
      var s = document.getElementById('editor-start').value;
      if (s) document.getElementById('editor-end').value = computeTermEnd(s, this.value);
    });

    on('btn-print-sch', 'click', function () {
      if (window.GardenSchedulePrint) window.GardenSchedulePrint.openDialog();
    });

    document.querySelectorAll('.sch-modal-overlay, .sch-sheet-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) {
        if (e.target === ov) {
          ov.style.display = 'none';
          if (ov.id === 'modal-confirm') confirmFn = null;   /*@3.SCHJ.211*/   /*@3.SCHJ.210*/
          editingEvent = null; hideDeleteButtons();
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.sch-modal-overlay, .sch-sheet-overlay').forEach(function (ov) {
        if (ov.style.display !== 'none') ov.style.display = 'none';
      });
      confirmFn = null;      editingEvent = null; hideDeleteButtons();
    });
  }

  /*@3.SCHJ.212*/
  function init() {
    fetch(CATALOG_PATH)
      .then(function (r) { return r.json(); })
      .catch(function () { return { courses: [] }; })
      .then(function (c) {
        catalog = c || { courses: [] };
        boot();
      });
  }

  function boot() {
    try { semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null'); } catch (e) { semester = null; }
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
    var wasMissing = !raw;
    schedule = migrateSchedule(raw);
    if (wasMissing || schedule.__needsSave) { delete schedule.__needsSave; save(); }
    /*@3.SCHJ.213*/
    syncTermRange();
    syncFocusPeriods();

    /*@3.SCHJ.214*/
    if (window.MutationObserver && window.GardenSelect) {
      document.querySelectorAll('.sch-modal-overlay').forEach(function (ov) {
        new MutationObserver(function () {
          if (ov.style.display !== 'none') GardenSelect.sync(ov);
        }).observe(ov, { attributes: true, attributeFilter: ['style'] });
      });
    }

    /*@3.SCHJ.215*/
    if (pendingList().length && !activeCourseCodes().length) {
      adoptPending(boot2);
    } else {
      boot2();
    }
  }

  function boot2() {
    syncArchive();

    currentWeekStart = getWeekStartDate(new Date());
    currentMonthDate = new Date();
    currentDayDate = new Date();
    agendaOn = !!schedule.settings.agenda;

    bindEvents();
    if (window.GardenSchedDrag && GardenSchedDrag.holdMenu) {
      ['month-wrapper', 'agenda-wrap'].forEach(function (id) {
        GardenSchedDrag.holdMenu(document.getElementById(id), openSchMenu);
      });
    }
    /*@3.SCHJ.226*/
    setTimeout(runIntent, 0);
    TP.build(document);
    syncViewButtons();
    render();

    document.addEventListener('garden:languageChanged', function () { render(); });

    /*@3.SCHJ.216*/
    if (nowTimer) clearInterval(nowTimer);
    nowTimer = setInterval(function () {
      var onGrid = !(currentView === 'month' || agendaOn);
      if (onGrid) {
        var dates = [];
        document.querySelectorAll('#grid-body .sch-daycol').forEach(function (c) {
          dates.push(parseLocalDate(c.getAttribute('data-date')));
        });
        if (dates.length) {
          var r = effectiveRange();
          drawNowLine(dates, r.startH, r.endH);
        }
      }
      /*@3.SCHJ.217*/
      if (!document.hidden) {
        renderPulse(scopeDates());
        document.querySelectorAll('#grid-body .sch-ev.is-now').forEach(function (el) {
          var pct = el.getAttribute('data-pct');
          if (pct) el.style.setProperty('--p', pct + '%');
        });
      }
    }, 60000);

    maybeShowLegacyNotice();
    checkArchiveRestore();

    /*@3.SCHJ.218*/
    if (!schedule.settings.onboarded || pendingList().length) setTimeout(openEditor, 500);

    if (window.GardenSchedulePlan && window.GardenSchedulePlan.init) window.GardenSchedulePlan.init();
  }

  /*@3.SCHJ.219*/
  window.GardenSchedule = {
    DAYS_ORDER: DAYS_ORDER,
    DAY_NAMES: DAY_NAMES,
    DAY_SHORT: DAY_SHORT,
    MONTH_NAMES: MONTH_NAMES,
    data: function () { return schedule; },
    semester: function () { return semester; },
    catalog: function () { return catalog; },
    save: save,
    render: render,
    /*@3.SCHJ.220*/
    reload: function () {
      var raw = null;
      try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
      if (raw) schedule = migrateSchedule(raw);
      try { semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null'); } catch (e) {}
      render();
    },
    eventsOnDate: eventsOnDate,
    eventsForRange: eventsForRange,
    buildAgendaHtml: buildAgendaHtml,
    bindAgendaClicks: bindAgendaClicks,
    beginPass: beginPass,
    endPass: endPass,
    counters: counters,
    isAr: isAr,
    L: L,
    escapeH: escapeH,
    fmtLocalDate: fmtLocalDate,
    parseLocalDate: parseLocalDate,
    fmtTime12: fmtTime12,
    fmtMin12: fmtMin12,
    minToHM24: minToHM24,
    parseHM: parseHM,
    addMinutes: addMinutes,
    getWeekId: getWeekId,
    getWeekStartDate: getWeekStartDate,
    studyWeekNumber: studyWeekNumber,
    inTermBounds: inTermBounds,
    courseColor: getCourseColor,
    courseShort: courseShort,
    courseName: courseDisplayName,
    semesterCourses: semesterCourses,
    scheduleCourseCodes: scheduleCourseCodes,
    isCourseHidden: isCourseHidden,
    kindIcon: kindIcon,
    subLabel: subLabel,
    evTitle: evTitle,
    evMeta: evMeta,
    openSheet: openSheet,
    currentState: function () {
      return {
        view: currentView, agenda: agendaOn,
        weekStart: new Date(currentWeekStart),
        day: new Date(currentDayDate),
        month: new Date(currentMonthDate)
      };
    },
    TP: TP,
    updateTextContent: updateTextContent
  };

  document.addEventListener('DOMContentLoaded', init);
})();
