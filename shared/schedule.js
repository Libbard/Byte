 
;(function () {
  'use strict';

  var LS_KEY = 'weekly_schedule';
  var LS_SEMESTER = 'my_semester';
  var CATALOG_PATH = '../shared/data/courses_catalog.json';

   
  var HOUR_PX_MIN = 44;      
  var HOUR_PX_MAX = 56;       
  var HOUR_PX_DEF = 56;      
  var GAP_PX = 34;           
  var LABEL_TAIL_PX = 8;     
  var MIN_GAP_HOURS = 2;     
  var MIN_EV_PX = 22;        

  var axis = null;                 
  var expandedGaps = Object.create(null);  

  var DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var DAY_NAMES = {
    ar: { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' },
    en: { sunday:'Sunday', monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' }
  };
  var DAY_SHORT = {
    ar: { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' },
    en: { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }
  };
   
  var DAY_MIN = {
    ar: { sunday:'أحد', monday:'اثن', tuesday:'ثلا', wednesday:'أرب', thursday:'خمي', friday:'جمع', saturday:'سبت' },
    en: { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }
  };
  var MONTH_NAMES = {
    ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };

   
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
   
  var GEN_KIND = {
    task:  { ar:'مهمة', en:'Task' },
    event: { ar:'حدث',  en:'Event' }
  };

  
  var schedule = null;
  var semester = null;
  var catalog = null;

  var currentWeekStart = null;
  var currentMonthDate = null;
  var currentDayDate = null;
  var currentView = 'week';       
  var agendaOn = false;           
  var dayFocusFilter = false;     
  var editingEvent = null;
  var sheetEvent = null;
  var didAutoScroll = false;
  var nowTimer = null;

  
  var counters = { deadlines: 0, weekEvents: 0, renders: 0 };
  var pass = null;   

  
  
  
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
         
        relabel(tp);
        apply(tp, hid.value || '15:00');
        tp.addEventListener('change', function () { sync(tp); });
      });
    }
     
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

  
  
  
  function defaultSchedule() {
    return {
      version: 2,
      settings: {
        active_days: ['sunday','monday','tuesday','wednesday','thursday'],
        day_start_hour: 15,          
        day_end_hour: 22,            
        slot_duration_minutes: 30,   
        reminder_lead: 0,
        term_start_date: '',
        term_type: 'normal',
        semester_end_date: '',
        focus_periods: { midterm: { start:'', end:'' }, final: { start:'', end:'' } },
        onboarded: false,
        span_mode: 'study',          
        agenda: false,
        course_filter: [],           
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

   
  function migrateSchedule(s) {
    var d = defaultSchedule();
    if (!s || typeof s !== 'object') return d;

    var st = s.settings;
    if (!st || typeof st !== 'object') st = s.settings = {};
    Object.keys(d.settings).forEach(function (k) { if (st[k] === undefined) st[k] = d.settings[k]; });
    if (!Array.isArray(st.active_days) || !st.active_days.length) st.active_days = d.settings.active_days.slice();
    if (!st.focus_periods || typeof st.focus_periods !== 'object') st.focus_periods = { midterm:{start:'',end:''}, final:{start:'',end:''} };
    if (!st.focus_periods.midterm) st.focus_periods.midterm = { start:'', end:'' };
    if (!st.focus_periods.final) st.focus_periods.final = { start:'', end:'' };
    if (typeof st.day_start_hour !== 'number' || st.day_start_hour < 0 || st.day_start_hour > 23) st.day_start_hour = d.settings.day_start_hour;
    if (typeof st.day_end_hour !== 'number' || st.day_end_hour < 1 || st.day_end_hour > 24 || st.day_end_hour <= st.day_start_hour) st.day_end_hour = d.settings.day_end_hour;
    if (!Array.isArray(st.course_filter)) st.course_filter = [];
    if (st.span_mode !== 'study' && st.span_mode !== 'full') st.span_mode = 'study';

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
       
      s.lectures.forEach(function (l) {
        if (!l.kind) l.kind = (l.type === 'lab') ? 'lab' : 'lecture';
        if (!l.attendance) l.attendance = 'in_person';
        delete l.type;
      });
       
      s.study_blocks.forEach(function (b) {
        if (!b.kind) b.kind = (b.type === 'review' || b.type === 'flashcards') ? 'review' : 'study';
        if (b.kind === 'flashcards') b.kind = 'review';
        if (!b.custom_label) b.custom_label = '';
        delete b.type;
      });
       
      try {
        var oldSpan = localStorage.getItem('sch_span');
        if (oldSpan === 'full') st.span_mode = 'full';
        else if (oldSpan === 'study' || oldSpan === 'compact') st.span_mode = 'study';
        if (oldSpan) localStorage.removeItem('sch_span');
      } catch (e) {}
      s.version = 2;
    }
     
    s.lectures.forEach(function (l) { if (!l.kind) l.kind = 'lecture'; if (!l.attendance) l.attendance = 'in_person'; });
    s.study_blocks.forEach(function (b) { if (!b.kind) b.kind = 'study'; });

    if (!s.updated_at) s.updated_at = new Date().toISOString();
    return s;
  }

  function save() {
    schedule.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS_KEY, JSON.stringify(schedule)); } catch (e) {}
  }

  
  
  
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(o) { return o ? (isAr() ? o.ar : o.en) : ''; }
  function escapeH(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }
   
  function fmtLocalDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseLocalDate(s) {
    var p = String(s).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function isSameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
   
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
    d.setDate(d.getDate() - d.getDay());   
    return d;
  }

  
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
   
  function inTermBounds(dateObj) {
    var st = schedule.settings || {};
    if (st.term_start_date && dateObj < parseLocalDate(st.term_start_date)) return false;
    if (st.semester_end_date && dateObj > parseLocalDate(st.semester_end_date)) return false;
    return true;
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

  
  function getCourseColor(code) {
    if (!catalog || !catalog.courses) return '#a78bfa';
    var c = catalog.courses.filter(function (x) { return x.code === code; })[0];
    return c ? c.brand_color : '#a78bfa';
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

  
  
  
  function beginPass() { pass = { byDate: null, ov: {} }; }
  function endPass() { pass = null; }

  function overrideFor(weekId) {
    if (pass) {
      if (pass.ov[weekId] === undefined) pass.ov[weekId] = schedule.week_overrides[weekId] || {};
      return pass.ov[weekId];
    }
    return schedule.week_overrides[weekId] || {};
  }

   
  function deadlinesByDate() {
    if (pass && pass.byDate) return pass.byDate;
    var map = {};
    if (window.GardenData && window.GardenData.allDeadlines) {
      counters.deadlines++;
      var all = [];
      try { all = window.GardenData.allDeadlines() || []; } catch (e) { all = []; }
      all.forEach(function (d) {
        if (d.source === 'exam') return;      
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

  function normalizeEvent(o) {
    o.color = o.color || getCourseColor(o.course_code);
    if (o.start != null && o.end != null && o.end <= o.start) o.end = o.start + 30;
    return o;
  }

   
  function eventsOnDate(dateObj, opts) {
    opts = opts || {};
    counters.weekEvents++;
    var dstr = fmtLocalDate(dateObj);
    var dayName = DAYS_ORDER[dateObj.getDay()];
    var weekStart = getWeekStartDate(dateObj);
    var weekId = getWeekId(weekStart);
    var ov = overrideFor(weekId);
    var out = [];

    var activeDays = (schedule.settings.active_days || []).slice();
    (ov.extra_days || []).forEach(function (d) { if (activeDays.indexOf(d) === -1) activeDays.push(d); });

    var withinTerm = inTermBounds(dateObj);
    var focus = weekFocus(weekStart);
    var lecturesHidden = focus.active && !ov.show_lectures;
    var cancelled = ov.cancelled_lectures || [];
    var doneIds = ov.completed_events || [];

    
    if (withinTerm && !lecturesHidden && activeDays.indexOf(dayName) !== -1) {
      schedule.lectures.forEach(function (l) {
        if (l.day !== dayName) return;
        if (cancelled.indexOf(l.id) !== -1) return;
        var s = parseHM(l.start_time);
        if (s === null) return;
        var e = parseHM(l.end_time);
        if (e === null || e <= s) e = s + (l.duration || 50);
        out.push(normalizeEvent({
          uid: 'lecture:' + l.id + ':' + dstr, id: l.id, src: 'lecture', kind: 'lecture',
          sub: l.kind || 'lecture', course_code: l.course_code,
           
          title: courseDisplayName(l.course_code), start: s, end: e, allDay: false,
          room: l.room || '', attendance: l.attendance || 'in_person',
          notes: l.notes || '', youtube: '', date: dstr, weekId: weekId,
          done: doneIds.indexOf(l.id) !== -1, recurring: true, raw: l
        }));
      });
    }

    
     
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

    
    (schedule.exams || []).forEach(function (x) {
      if (x.date !== dstr) return;
       
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

    
    var plan = activePlan();
    if (plan && plan.sessions) {
       
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
   
  function evTitle(ev) {
    if (ev.kind === 'general') return ev.title || subLabel(ev);
    return ev.title || courseDisplayName(ev.course_code) || subLabel(ev);
  }
   
  function isCodeTitle(ev) {
    if (!ev.course_code) return false;
    return evTitle(ev) === courseShort(ev.course_code);
  }
   
  function codeCls(ev) { return isCodeTitle(ev) ? ' sch-code' : ''; }

  
  
  
  function createEventEl(ev, startH) {
     
    var top = axis.yFor(ev.start);
    var h = Math.max(MIN_EV_PX, axis.yFor(ev.end) - top);
    var clipped = ev.start < axis.startH * 60;
    if (top < 0) { h += top; top = 0; clipped = true; }
    if (h < MIN_EV_PX) h = MIN_EV_PX;

    var cols = ev._cols || 1, col = ev._col || 0;
    var tier = (h < 34 || cols >= 3) ? 'xs' : (h < 62 ? 'sm' : 'md');
    var done = ev.done;
    var expired = !done && isExpired(ev);

     
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

    var noteMark = (ev.notes || ev.youtube) ? '<span class="sch-ev-note">📝</span>' : '';
    var html = '<div class="sch-ev-head">' +
      '<i class="fa-solid ' + kindIcon(ev) + ' sch-ev-ico"></i>' +
       
      '<span class="sch-ev-title' + codeCls(ev) + '"><span class="sch-ev-tx">' +
      escapeH(evTitle(ev)) + '</span></span>' + noteMark + '</div>';
     
    if (tier !== 'xs') {
      html += '<div class="sch-ev-time"><span class="sch-ev-start">' + escapeH(fmtMin12(ev.start)) +
              '</span><span class="sch-ev-end"> – ' + escapeH(fmtMin12(ev.end)) + '</span></div>';
    }
    if (tier === 'md') html += '<div class="sch-ev-meta">' + escapeH(evMeta(ev)) + '</div>';
    html += '<button class="sch-ev-check' + (done ? ' is-done' : '') + '" type="button" aria-pressed="' + (done ? 'true' : 'false') +
            '" title="' + escapeH(done ? (isAr() ? 'إلغاء الإتمام' : 'Mark undone') : (isAr() ? 'إتمام' : 'Mark done')) + '">✓</button>';
    el.innerHTML = html;

    el.querySelector('.sch-ev-check').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDone(ev);
    });
    el.addEventListener('click', function (e) { e.stopPropagation(); openSheet(ev); });
    return el;
  }

   
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

  
  
  
  function effectiveRange() {
    var st = schedule.settings;
    if (st.span_mode === 'full') return { startH: 0, endH: 24 };
    return { startH: st.day_start_hour, endH: st.day_end_hour };
  }
   
  function spanLabel() {
    var full = schedule.settings.span_mode === 'full';
    return '<i class="fa-solid ' + (full ? 'fa-clock' : 'fa-book-open') + '"></i><span>' +
      escapeH(full ? (isAr() ? 'اليوم كامل' : 'Full day')
                   : (isAr() ? 'ساعات الدراسة' : 'Study hours')) + '</span>';
  }

  
  
  
   
  function gapKey(from, to) { return from + '-' + to; }

  function buildAxis(dates, startH, endH, hourPx) {
    var hours = endH - startH;
    var busy = new Array(hours);
    var i, k;
    for (i = 0; i < hours; i++) busy[i] = false;

     
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

     
    if (hours > 0) { busy[0] = true; busy[hours - 1] = true; }
    var now = new Date();
    for (i = 0; i < dates.length; i++) {
      if (!isSameDay(dates[i], now)) continue;
      k = now.getHours() - startH;
      if (k >= 0 && k < hours) busy[k] = true;
      break;
    }

    var segments = [], total = 0, run = 0;
    function pushHours(from, to) {
      if (to <= from) return;
      segments.push({ type: 'hours', from: from, to: to, top: total, px: (to - from) * hourPx });
      total += (to - from) * hourPx;
    }
    function pushGap(from, to) {
      segments.push({ type: 'gap', from: from, to: to, top: total, px: GAP_PX, key: gapKey(from, to) });
      total += GAP_PX;
    }

     
    var cursor = startH;
    i = 0;
    while (i < hours) {
      if (busy[i]) { i++; continue; }
      run = i;
      while (run < hours && !busy[run]) run++;
      var f = startH + i, t = startH + run;
      if (run - i >= MIN_GAP_HOURS && !expandedGaps[gapKey(f, t)]) {
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
     
    var shown = 0;
    segments.forEach(function (s) { if (s.type === 'hours') shown += (s.to - s.from); });

    return { segments: segments, totalH: total, hourPx: hourPx, startH: startH, endH: endH,
             shownHours: shown, yFor: yFor, minAt: minAt };
  }
   
  function computeHourPx(dates, startH, endH) {
    var wrap = document.getElementById('grid-wrap');
    if (!wrap) return HOUR_PX_DEF;
    var probe = buildAxis(dates, startH, endH, HOUR_PX_DEF);
    var shown = probe.shownHours || (endH - startH);
    var gapsPx = probe.segments.reduce(function (a, s) { return a + (s.type === 'gap' ? s.px : 0); }, 0);

    var top = wrap.getBoundingClientRect().top;         
     
    var chrome = document.getElementById('head-row').offsetHeight +
                 (document.getElementById('allday-row').offsetHeight || 0);
    var bottomNav = document.querySelector('.bottom-nav');
    var navH = (bottomNav && getComputedStyle(bottomNav).display !== 'none') ? bottomNav.offsetHeight : 0;
     
    var reserve = navH + 26;
     
    var box = window.innerHeight - top - reserve;
    lastAvail = Math.max(180, box);
     
    var forHours = box - chrome - gapsPx - LABEL_TAIL_PX;
    var px = Math.floor(forHours / Math.max(1, shown));
    return Math.max(HOUR_PX_MIN, Math.min(HOUR_PX_MAX, px));
  }
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

  
  
  
  function weekDays() {
    var ov = overrideFor(getWeekId(currentWeekStart));
    var days = (schedule.settings.active_days || []).slice();
    (ov.extra_days || []).forEach(function (d) { if (days.indexOf(d) === -1) days.push(d); });
     
    for (var i = 0; i < 7; i++) {
      var d = new Date(currentWeekStart); d.setDate(d.getDate() + i);
      var nm = DAYS_ORDER[d.getDay()];
      if (days.indexOf(nm) !== -1) continue;
      if (eventsOnDate(d).length) days.push(nm);
    }
    days.sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });
    return days.length ? days : ['sunday','monday','tuesday','wednesday','thursday'];
  }

  
  
  
   
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

   
  function durLabel(mins) {
    if (mins < 60) return mins + (isAr() ? ' د' : ' min');
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + (isAr() ? ' س' : 'h') + (m ? ' ' + m + (isAr() ? ' د' : 'm') : '');
  }
   
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

     
    if (!sessions) {
       
      pulseLead = pulseAfter = null;
      box.style.display = 'none';
      return;
    }
    box.style.display = '';

    var kick = document.getElementById('pulse-kick');
    var title = document.getElementById('pulse-title');
    var sub = document.getElementById('pulse-sub');
    var barW = document.getElementById('pulse-bar-wrap');

    if (!lead) {
      box.style.setProperty('--c', 'var(--st-ok, #10b981)');
      document.getElementById('pulse-orb').innerHTML = '<i class="fa-solid fa-mug-hot"></i>';
      kick.textContent = isAr() ? 'وقتٌ حرّ' : 'FREE';
      title.textContent = isAr() ? 'لا شيء متبقٍّ' : 'Nothing left';
      sub.innerHTML = '<span>' + escapeH(isAr() ? 'كل ما جُدول قد مضى — أضِف حدثاً أو تصفّح التالي' : 'Everything scheduled has passed — add an event or browse ahead') + '</span>';
      barW.hidden = true;
    }

    if (lead) {
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

     
    pulseLead = lead ? lead.ev : null;
    pulseAfter = after ? after.ev : null;
    bindPulse();
    pulseHit(document.querySelector('#sch-pulse .sch-pulse-main'), pulseLead);
    pulseHit(document.getElementById('pulse-next'), pulseAfter);

    document.getElementById('pulse-stats').innerHTML =
      '<div class="sch-stat"><b>' + (Math.round(hours * 10) / 10) + '</b><span>' + (isAr() ? 'ساعة' : 'hours') + '</span></div>' +
      '<div class="sch-stat"><b>' + sessions + '</b><span>' + (isAr() ? 'حصة' : 'sessions') + '</span></div>' +
      (exams ? '<div class="sch-stat is-exam"><b>' + exams + '</b><span>' + (isAr() ? 'اختبار' : 'exams') + '</span></div>' : '');
  }

   
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
     
    wrap.style.display = '';
    var range = effectiveRange();
    var startH = range.startH, endH = range.endH;
    var activeDays = schedule.settings.active_days || [];
    var cols = '66px repeat(' + dates.length + ', minmax(0,1fr))';

    
    var head = document.getElementById('head-row');
    head.style.gridTemplateColumns = cols;
    var hh = '<div class="sch-head-gutter"></div>';
    dates.forEach(function (d) {
      var nm = DAYS_ORDER[d.getDay()];
      var today = isSameDay(d, new Date());
       
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

    
    var ad = document.getElementById('allday-row');
    ad.style.gridTemplateColumns = cols;
    var anyAllDay = false;
    var adh = '<div class="sch-allday-label">' + (isAr() ? 'طوال اليوم' : 'All-day') + '</div>';
    var allDayStore = {};
    dates.forEach(function (d) {
      var key = fmtLocalDate(d);
      var items = eventsOnDate(d).filter(function (e) { return e.allDay; });
      allDayStore[key] = items;
       
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

    
    var body = document.getElementById('grid-body');
    body.style.gridTemplateColumns = cols;
    body.innerHTML = '';

     
    axis = buildAxis(dates, startH, endH, computeHourPx(dates, startH, endH));
    var bodyH = axis.totalH;
    wrap.style.maxHeight = lastAvail + 'px';

    var gutter = document.createElement('div');
    gutter.className = 'sch-gutter';
    gutter.style.height = bodyH + 'px';
     
     
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

       
      var lines = '';
      axis.segments.forEach(function (s) {
        if (s.type !== 'hours') return;
        for (var h = s.from; h <= s.to; h++) {
          lines += '<div class="sch-hourline" style="top:' + axis.yFor(h * 60) + 'px"></div>';
        }
      });
       
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

       
      col.addEventListener('click', function (clickEv) {
        if (clickEv.target !== this) return;
        var rect = this.getBoundingClientRect();
         
        var mins = Math.round(axis.minAt(clickEv.clientY - rect.top) / 15) * 15;
        mins = Math.max(startH * 60, Math.min(endH * 60 - 30, mins));
        openAddModal(DAYS_ORDER[parseLocalDate(this.getAttribute('data-date')).getDay()],
                     minToHM24(mins), this.getAttribute('data-date'));
      });
      body.appendChild(col);
    });

    wrap.style.display = '';
    applyWidthTiers();
    drawNowLine(dates, startH, endH);
    autoScroll(dates, startH);
  }

   
  function applyWidthTiers() {
    var mq = [];
    document.querySelectorAll('#grid-body .sch-ev').forEach(function (el) {
      var w = el.getBoundingClientRect().width;
      el.classList.toggle('is-narrow', w < 104);
      el.classList.toggle('is-vnarrow', w < 62);
      var m = measureOverflow(el.querySelector('.sch-ev-title'));
      if (m) mq.push(m);
       
      el.querySelectorAll('.sch-ev-time, .sch-ev-meta').forEach(function (line) {
        line.classList.remove('is-hidden');
        if (line.scrollWidth > line.clientWidth + 1) line.classList.add('is-hidden');
      });
    });
    syncMarquee(mq);
  }

   
   
  var MQ_WPM = 70;               
  var MQ_HOLD_START = 3.0;       
  var MQ_HOLD_END = 0.7;         
  var MQ_V_MIN = 30, MQ_V_MAX = 85;   
  var MQ_PX_PER_WORD_FALLBACK = 44;

   
  function measureOverflow(t) {
    if (!t) return null;
    var tx = t.querySelector('.sch-ev-tx');
    if (!tx) return null;
    t.classList.remove('is-mq');
    t.style.removeProperty('--mq-x');
    t.style.removeProperty('--mq-dur');
    var over = t.scrollWidth - t.clientWidth;
    if (over <= 2 || !t.clientWidth) return null;  
    var s = (tx.textContent || '').trim();
    return { t: t, over: over, w: tx.getBoundingClientRect().width,
             words: s ? s.split(/\s+/).length : 0 };
  }

   
  function writeMarqueeFrames(p1, p2) {
    var st = document.getElementById('sch-mq-kf');
    if (!st) {
      st = document.createElement('style');
      st.id = 'sch-mq-kf';
      document.head.appendChild(st);          
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
     
    var pxPerWord = words ? (px / words) : MQ_PX_PER_WORD_FALLBACK;
    var v = Math.max(MQ_V_MIN, Math.min(MQ_V_MAX, MQ_WPM / 60 * pxPerWord));
     
    var travel = maxOver / v;
    var dur = MQ_HOLD_START + travel + MQ_HOLD_END;
    writeMarqueeFrames(MQ_HOLD_START / dur * 100, (MQ_HOLD_START + travel) / dur * 100);
    list.forEach(function (o) {
      var rtl = getComputedStyle(o.t).direction === 'rtl';
      o.t.style.setProperty('--mq-x', (rtl ? o.over : -o.over) + 'px');
      o.t.style.setProperty('--mq-dur', dur.toFixed(2) + 's');
      o.t.classList.add('is-mq');
    });
     
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

   
  function drawNowLine(dates, startH, endH) {
    document.querySelectorAll('.sch-nowline, .sch-nowrail, .sch-nowchip').forEach(function (n) { n.remove(); });
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    if (mins < startH * 60 || mins > endH * 60) return;
    var y = axis.yFor(mins);

    var todayIdx = -1;
    dates.forEach(function (d, i) { if (isSameDay(d, now)) todayIdx = i; });

     
    var body = document.getElementById('grid-body');
    if (body) {
      var rail = document.createElement('div');
      rail.className = 'sch-nowrail';
      rail.style.top = y + 'px';
      body.appendChild(rail);
    }

     
    var gutter = document.querySelector('#grid-body .sch-gutter');
    if (gutter) {
      var chip = document.createElement('div');
      chip.className = 'sch-nowchip';
      chip.style.top = y + 'px';
      chip.textContent = fmtMin12(mins);
      gutter.appendChild(chip);
       
      var cb = chip.getBoundingClientRect();
      gutter.querySelectorAll('.sch-hour-label').forEach(function (lb) {
        var r = lb.getBoundingClientRect();
        lb.style.visibility = (r.bottom > cb.top - 2 && r.top < cb.bottom + 2) ? 'hidden' : '';
      });
    }

     
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
     
    if (wrap.scrollHeight <= wrap.clientHeight + 1) { didAutoScroll = true; return; }
    wrap.scrollTop = Math.max(0, axis.yFor(target) - axis.hourPx);
    didAutoScroll = true;
  }

  
  
  
   
  function buildAgendaHtml(scope) {
    var days = eventsForRange(scope.from, scope.to);
    var today = new Date();
    var html = '';
    var any = false;

    days.forEach(function (d) {
      var items = d.items;
      if (scope.course) items = items.filter(function (e) { return e.course_code === scope.course; });
      var isToday = isSameDay(d.date, today);
      var nm = DAYS_ORDER[d.date.getDay()];
      var dateTxt = d.date.getDate() + ' ' + MONTH_NAMES[isAr() ? 'ar' : 'en'][d.date.getMonth()];

      if (!items.length) {
         
        if (scope.type === 'day') {
          html += '<div class="sch-ag-day is-empty"><div class="sch-ag-head">' +
            '<span class="sch-ag-dname">' + escapeH(DAY_NAMES[isAr() ? 'ar' : 'en'][nm]) + '</span>' +
            '<span class="sch-ag-ddate">' + escapeH(dateTxt) + '</span>' +
            '<span class="sch-ag-count">' + (isAr() ? 'لا أحداث' : 'No events') + '</span></div></div>';
        } else {
          html += '<div class="sch-ag-day is-empty"><div class="sch-ag-head">' +
            '<span class="sch-ag-dname">' + escapeH(DAY_SHORT[isAr() ? 'ar' : 'en'][nm]) + '</span>' +
            '<span class="sch-ag-ddate">' + escapeH(dateTxt) + '</span>' +
            '<span class="sch-ag-count">—</span></div></div>';
        }
        return;
      }
      any = true;
      var allDay = items.filter(function (e) { return e.allDay; });
      var timed = items.filter(function (e) { return !e.allDay; });

      html += '<div class="sch-ag-day' + (isToday ? ' is-today' : '') + '">' +
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
      html += '</div></div>';
    });

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
              '<span class="sch-month-day-num">' + dd + '</span>' +
              (showWk ? '<span class="sch-month-wk">' + (isAr() ? 'أ' : 'W') + wk + '</span>' : '');

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

     
    grid.querySelectorAll('.sch-month-cell[data-date]').forEach(function (cell) {
      cell.addEventListener('click', function () { openDayAgenda(parseLocalDate(this.getAttribute('data-date'))); });
    });
  }
  function dots(cls, n, cap) {
    var s = '';
    for (var i = 0; i < Math.min(n, cap); i++) s += '<span class="sch-month-dot ' + cls + '"></span>';
    return s;
  }

  
  
  
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
    if (ev.src === 'task') return true;      
     
    if (ev.src === 'intensive') return true;
    return false;                            
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

  function deleteEvent(ev) {
    if (ev.src === 'lecture') {
      editingEvent = { src: 'lecture', id: ev.id, weekId: ev.weekId };
      openEditEvent(ev);
      document.getElementById('lec-main-actions').style.display = 'none';
      document.getElementById('lec-del-scope').style.display = '';
      return;
    }
    if (!confirm(isAr() ? 'حذف هذا الحدث نهائياً؟' : 'Delete this event permanently?')) return;
    if (ev.src === 'study') schedule.study_blocks = schedule.study_blocks.filter(function (x) { return x.id !== ev.id; });
    else if (ev.src === 'exam') schedule.exams = schedule.exams.filter(function (x) { return x.id !== ev.id; });
    else if (ev.src === 'general') schedule.general_events = schedule.general_events.filter(function (x) { return x.id !== ev.id; });
    else if (ev.src === 'task') { if (window.GardenData) window.GardenData.deleteTask(ev.id); }
    save(); render();
  }

  
  
  
   
  function syncArchive() {
    var live = activeCourseCodes();
    if (!live.length) return;   
    var moved = 0;
    var known = {};
    ['lectures','study_blocks','exams'].forEach(function (k) {
      (schedule[k] || []).forEach(function (e) { if (e.course_code) known[e.course_code] = 1; });
    });
    Object.keys(known).forEach(function (code) {
      if (live.indexOf(code) !== -1) return;
      if (String(code).indexOf('__CUSTOM_') === 0) return;
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

  
  
  
  function closeModal(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; }
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

  function openAddModal(day, time, dateStr) {
    editingEvent = null;
    hideDeleteButtons();
    pendingSlot = {
      day: day || DAYS_ORDER[(currentView === 'day' ? currentDayDate : new Date()).getDay()],
      time: time || '15:00',
      date: dateStr || fmtLocalDate(currentView === 'day' ? currentDayDate : new Date())
    };
    document.getElementById('modal-choose-type').style.display = '';
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
        x.all_day = false;      
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

  
  
  
  var PURGE_TYPES = [
    { k:'lecture',   ar:'محاضرات',      en:'Lectures' },
    { k:'study',     ar:'مذاكرة',       en:'Study' },
    { k:'review',    ar:'مراجعة',       en:'Review' },
    { k:'custom',    ar:'أخرى',         en:'Other' },
    { k:'exam',      ar:'اختبارات',     en:'Exams' },
    { k:'general',   ar:'أحداث عامة',   en:'General' },
    { k:'intensive', ar:'جلسات مكثّفة', en:'Intensive' }
  ];

  function openPurge() {
    var box = document.getElementById('purge-types');
    box.innerHTML = PURGE_TYPES.map(function (t) {
      return '<button type="button" class="sch-chip" data-ptype="' + t.k + '">' +
        escapeH(isAr() ? t.ar : t.en) + '</button>';
    }).join('');
    var cbox = document.getElementById('purge-courses');
    cbox.innerHTML = scheduleCourseCodes().map(function (c) {
      return '<button type="button" class="sch-chip" data-pcourse="' + escapeH(c) + '" ' +
        'style="--chip-color:' + getCourseColor(c) + '"><span class="sch-chip-dot"></span>' +
        escapeH(courseShort(c)) + '</button>';
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

   
  function purgeMatches() {
    var f = purgeSelection();
    var out = { lectures: [], study_blocks: [], exams: [], general_events: [], intensive: [] };
    function typeOn(k) { return !f.types.length || f.types.indexOf(k) !== -1; }
    function courseOn(c) { return !f.courses.length || f.courses.indexOf(c) !== -1; }
    function dateOn(dstr) {
      if (!dstr) return !f.from && !f.to;   
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
  function updatePurgeCount() {
    var n = purgeCount(purgeMatches());
    document.getElementById('purge-count').textContent = isAr()
      ? ('سيُحذف ' + n + ' عنصراً') : ('Will delete ' + n + ' item' + (n === 1 ? '' : 's'));
    document.getElementById('purge-run').disabled = (n === 0);
  }
  function runPurge() {
    var m = purgeMatches(), n = purgeCount(m);
    if (!n) return;
    if (!confirm(isAr() ? ('سيُحذف ' + n + ' عنصراً نهائياً. متابعة؟')
                        : ('This will permanently delete ' + n + ' items. Continue?'))) return;
    schedule.lectures = schedule.lectures.filter(function (l) { return m.lectures.indexOf(l.id) === -1; });
    schedule.study_blocks = schedule.study_blocks.filter(function (b) { return m.study_blocks.indexOf(b.id) === -1; });
    schedule.exams = schedule.exams.filter(function (x) { return m.exams.indexOf(x.id) === -1; });
    schedule.general_events = (schedule.general_events || []).filter(function (g) { return m.general_events.indexOf(g.id) === -1; });
    var p = activePlan();
    if (p && m.intensive.length) p.sessions = p.sessions.filter(function (s) { return m.intensive.indexOf(s.id) === -1; });
    save();
    closeModal('modal-purge'); render();
  }
   
  function weekIdToDate(weekId, dayName) {
    var m = /^(\d{4})-W(\d{2})$/.exec(String(weekId));
    if (!m) return null;
    var year = parseInt(m[1], 10), wk = parseInt(m[2], 10);
    var jan4 = new Date(year, 0, 4);
    var mon = new Date(jan4); mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    mon.setDate(mon.getDate() + (wk - 1) * 7);
    var sun = new Date(mon); sun.setDate(sun.getDate() - 1);   
    sun.setDate(sun.getDate() + DAYS_ORDER.indexOf(dayName || 'sunday'));
    return sun;
  }

  
  
  
   
   
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

     
    var expBtn = document.getElementById('legacy-export');
    if (expBtn) expBtn.onclick = function () {
      if (window.ByteLegacy) window.ByteLegacy.exportFile();
    };
    document.getElementById('legacy-wipe').onclick = function () {
      if (!confirm(isAr() ? 'حذفٌ نهائيّ لا رجعة فيه. هل صدّرتَ نسخةً؟'
                          : 'Permanent, irreversible delete. Did you export a copy?')) return;
      var n = window.ByteLegacy ? window.ByteLegacy.wipe() : (function () {
        var ks = legacyKeys();
        ks.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        return ks.length;
      })();
      alert(isAr() ? ('حُذف ' + n + ' مفتاحاً.') : ('Deleted ' + n + ' keys.'));
      finishLegacy();
    };
    document.getElementById('legacy-close').onclick = finishLegacy;
    function finishLegacy() {
       
      schedule.settings.legacy_notice_seen = true;
      save();
      closeModal('modal-legacy');
    }
  }

  
  
  
  function openEditor() {
    var lang = isAr() ? 'ar' : 'en';
    var active = schedule.settings.active_days || [];
    document.getElementById('editor-days').innerHTML = DAYS_ORDER.map(function (d) {
      return '<label><input type="checkbox" data-eday="' + d + '"' +
        (active.indexOf(d) !== -1 ? ' checked' : '') + '> ' + escapeH(DAY_NAMES[lang][d]) + '</label>';
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
    renderEditorCourses();
    renderArchiveList();
    if (window.GardenSchedulePlan && window.GardenSchedulePlan.renderSettingsSection) {
      window.GardenSchedulePlan.renderSettingsSection(document.getElementById('editor-plans'));
    }
    if (!schedule.settings.onboarded) { schedule.settings.onboarded = true; save(); }
    document.getElementById('modal-editor').style.display = '';
    buildEditorAccordion();
  }

   
  function buildEditorAccordion() {
    var root = document.getElementById('modal-editor');
    if (!root || root.getAttribute('data-acc') === '1') { syncAccordionSummaries(); return; }
    root.setAttribute('data-acc', '1');

    var secs = root.querySelectorAll('.sch-editor-section');
    Array.prototype.forEach.call(secs, function (sec, i) {
      var subhead = sec.querySelector('.sch-editor-subhead');
      var title, keep = null;
      if (subhead) {
        title = (subhead.querySelector('span') || subhead).textContent;
         
        keep = subhead.querySelector('button');
        subhead.remove();
      } else {
        var lb = sec.querySelector('.sch-label');
        title = lb ? lb.textContent : '';
        if (lb) lb.remove();
      }

      var body = document.createElement('div');
      body.className = 'sch-acc-body';
      while (sec.firstChild) body.appendChild(sec.firstChild);
      if (keep) body.insertBefore(keep, body.firstChild);

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'sch-acc-head';
      head.innerHTML = '<span class="sch-acc-title"></span>' +
                       '<span class="sch-acc-sum"></span>' +
                       '<i class="fa-solid fa-chevron-down sch-acc-caret"></i>';
      head.querySelector('.sch-acc-title').textContent = title;

      sec.appendChild(head);
      sec.appendChild(body);
      sec.classList.add('sch-acc');
       
      if (i === 0) sec.classList.add('is-open');

      head.addEventListener('click', function () {
        var open = sec.classList.contains('is-open');
        Array.prototype.forEach.call(secs, function (s) { s.classList.remove('is-open'); });
        if (!open) sec.classList.add('is-open');
      });
    });
    syncAccordionSummaries();
  }

   
  function syncAccordionSummaries() {
    var root = document.getElementById('modal-editor');
    if (!root) return;
    var st = schedule.settings;
    var sums = [
      (st.active_days || []).length + (isAr() ? ' أيام دراسة' : ' study days'),
      (st.focus_periods && st.focus_periods.midterm && st.focus_periods.midterm.start)
        ? (isAr() ? 'مضبوطة' : 'configured') : (isAr() ? 'غير مضبوطة' : 'not set'),
      scheduleCourseCodes().length + (isAr() ? ' مواد' : ' courses'),
      '', '', ''
    ];
    var heads = root.querySelectorAll('.sch-acc-sum');
    Array.prototype.forEach.call(heads, function (h, i) { h.textContent = sums[i] || ''; });
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
          (isAr() ? '🔄 استعادة' : '🔄 Restore') + '</button>' +
        '<button class="sch-btn sch-btn-danger sch-btn-xs" data-adelete="' + escapeH(c) + '">' +
          (isAr() ? '🗑️ حذف نهائي' : '🗑️ Delete forever') + '</button>' +
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-arestore]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-arestore'), bk = schedule.archived[c];
        ['lectures','study_blocks','exams'].forEach(function (k) { schedule[k] = (schedule[k] || []).concat(bk[k] || []); });
        delete schedule.archived[c];
        save(); renderArchiveList(); render();
      });
    });
    box.querySelectorAll('[data-adelete]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-adelete');
        if (!confirm(isAr() ? ('حذف أحداث ' + c + ' نهائياً؟') : ('Delete ' + c + ' events forever?'))) return;
        delete schedule.archived[c];
        save(); renderArchiveList();
      });
    });
  }

  function durationOf(l) {
    if (l.duration) return l.duration;
    var s = parseHM(l.start_time), e = parseHM(l.end_time);
    return (s !== null && e !== null && e > s) ? (e - s) : 50;
  }

  function renderEditorCourses() {
    var box = document.getElementById('editor-courses');
    var courses = semesterCourses();
    if (!courses.length) {
      box.innerHTML = '<p class="sch-editor-hint">' +
        (isAr() ? 'لا مواد في فصلك الخاص بعد — أضِفها من صفحة الفصل.' : 'No courses in your semester yet.') + '</p>';
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
      return '<div class="sch-ecourse" data-ecode="' + escapeH(code) + '">' +
        '<div class="sch-ecourse-head"><span class="sch-ecourse-dot" style="background:' + color + '"></span>' +
          escapeH(courseDisplayName(code)) + '</div>' +
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
      '</div>';
    }).join('');
    box.querySelectorAll('.sch-daychip').forEach(function (chip) {
      chip.addEventListener('click', function () { this.classList.toggle('on'); });
    });
    box.querySelectorAll('.ec-attend').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var w = this.closest('.sch-ecourse').querySelector('.sch-room-wrap');
        if (w) w.style.display = this.value === 'remote' ? 'none' : '';
      });
    });
    TP.build(box);
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
      
      schedule.lectures = schedule.lectures.filter(function (l) { return l.course_code !== code; });
      lecDays.forEach(function (d) {
        schedule.lectures.push({
          id: 'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          course_code: code, day: d, start_time: start, end_time: end,
          room: room, kind: form, attendance: attend, recurring: true,
          color: getCourseColor(code), duration: dur
        });
      });
    });
    save();
    closeModal('modal-editor');
    warnOrphanBlocks();
    render();
  }

   
  function warnOrphanBlocks() {
    var active = schedule.settings.active_days || [];
    var orphans = schedule.study_blocks.filter(function (b) { return active.indexOf(b.day) === -1; });
    if (!orphans.length) return;
    alert(isAr()
      ? ('لديك ' + orphans.length + ' بلوك مذاكرة في أيام غير مفعّلة — تبقى ظاهرة في الجدول ولم تُحذف.')
      : (orphans.length + ' study blocks fall on inactive days — they remain visible and were not deleted.'));
  }

  
  
  
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
    dayWinStart = null;          
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
       
      document.getElementById('btn-span').style.display =
        (currentView === 'week' && !agendaOn) ? '' : 'none';
      document.getElementById('btn-span').innerHTML = spanLabel();

       
      var pulseEl = document.getElementById('sch-pulse');
      if (pulseEl && currentView === 'month') pulseEl.style.display = 'none';

      var gw = document.getElementById('grid-wrap');
      var mw = document.getElementById('month-wrapper');
      var aw = document.getElementById('agenda-wrap');
      gw.style.display = 'none'; mw.style.display = 'none'; aw.style.display = 'none';

      updateNavLabel();
      updateFocusBanner();
      updateDayFilterBar();
      updateOutOfRangeBanner();

      if (agendaOn) {
        if (currentView === 'month') { mw.style.display = ''; renderMonthNavOnly(); }
        renderAgendaView();
      } else if (currentView === 'month') {
        mw.style.display = '';
        renderMonthView();
      } else if (currentView === 'day') {
        document.getElementById('day-strip').style.display = 'none';
        renderPulse([new Date(currentDayDate)]);
        renderGrid([new Date(currentDayDate)]);
        playIntro();
      } else {
        var info = windowDates();
        renderDayStrip(info);
        renderPulse(info.all);
        renderGrid(info.shown);
        bindGridSwipe();
        playIntro();
      }
    } finally { endPass(); }
  }
  function renderMonthNavOnly() {
    document.getElementById('month-label').textContent =
      MONTH_NAMES[isAr() ? 'ar' : 'en'][currentMonthDate.getMonth()] + ' ' + currentMonthDate.getFullYear();
    document.getElementById('month-grid').innerHTML = '';
    document.getElementById('month-legend').innerHTML = '';
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
    var f = weekFocus(ws);
    if (!f.active) { banner.style.display = 'none'; return; }
    var wid = getWeekId(ws);
    var revealed = !!(schedule.week_overrides[wid] && schedule.week_overrides[wid].show_lectures);
    var kind = f.kind === 'midterm' ? (isAr() ? 'الميدتيرم' : 'Midterm') : (isAr() ? 'الفاينل' : 'Final');
    document.getElementById('focus-banner-text').textContent = revealed
      ? (isAr() ? ('🎯 أسبوع تركيز (' + kind + ') — المحاضرات ظاهرة') : ('🎯 Focus week (' + kind + ') — lectures shown'))
      : (isAr() ? ('🎯 أسبوع تركيز (' + kind + ') — المحاضرات المتكرّرة مخفية') : ('🎯 Focus week (' + kind + ') — recurring lectures hidden'));
    var btn = document.getElementById('btn-toggle-lectures');
    btn.textContent = revealed ? (isAr() ? 'إخفاء المحاضرات' : 'Hide lectures')
                               : (isAr() ? 'إظهار المحاضرات' : 'Show lectures');
    btn.onclick = function () {
      var o = schedule.week_overrides[wid] || (schedule.week_overrides[wid] = {});
      o.show_lectures = !o.show_lectures;
      save(); render();
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
    bar.textContent = isAr() ? '⚠️ خارج مدى الفصل — لا تُعرض المحاضرات المتكرّرة هنا'
                             : '⚠️ Outside the term range — recurring lectures are not shown';
    bar.style.display = '';
  }

  function updateDayFilterBar() {
    var bar = document.getElementById('dayfilter-bar');
    if (!dayFocusFilter || currentView !== 'day') { bar.style.display = 'none'; return; }
    bar.innerHTML = '<span>' + (isAr() ? '📋 أجندة هذا اليوم' : '📋 This day\'s agenda') + '</span>' +
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

  function renderCourseChips() {
    var box = document.getElementById('course-chips');
    var codes = scheduleCourseCodes();
    if (!codes.length) { box.style.display = 'none'; return; }
    var hidden = schedule.settings.course_filter || [];
    var html = codes.map(function (c) {
      return '<button class="sch-chip' + (hidden.indexOf(c) !== -1 ? ' is-off' : '') + '" data-course="' + escapeH(c) + '" ' +
        'style="--chip-color:' + getCourseColor(c) + '" ' +
        'title="' + escapeH(courseDisplayName(c)) + '">' +
        '<span class="sch-chip-dot"></span><span class="sch-code">' + escapeH(courseShort(c)) + '</span></button>';
    }).join('');
    if (hidden.length) {
      html += '<button class="sch-chip sch-chip-clear" id="chip-clear">' +
        (isAr() ? 'إظهار الكل' : 'Show all') + '</button>';
    }
    box.innerHTML = html;
    box.style.display = '';
    box.querySelectorAll('[data-course]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-course');
        var arr = schedule.settings.course_filter || [];
        var i = arr.indexOf(c);
        if (i === -1) arr.push(c); else arr.splice(i, 1);
        schedule.settings.course_filter = arr;
        save(); render();
      });
    });
    var clr = document.getElementById('chip-clear');
    if (clr) clr.addEventListener('click', function () {
      schedule.settings.course_filter = [];
      save(); render();
    });
  }

  
  
  
   
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
    on('btn-span', 'click', function () {
      schedule.settings.span_mode = (schedule.settings.span_mode === 'study') ? 'full' : 'study';
      didAutoScroll = false; save(); render();
    });

    on('btn-add-event', 'click', function () { openAddModal(null, null, null); });
    on('choose-lecture', 'click', function () { closeModal('modal-choose-type'); prepLectureModal(); });
    on('choose-study', 'click', function () { closeModal('modal-choose-type'); prepStudyModal(); });
    on('choose-exam', 'click', function () { closeModal('modal-choose-type'); prepExamModal(); });
    on('choose-general', 'click', function () { closeModal('modal-choose-type'); prepGeneralModal(); });
    on('choose-plan', 'click', function () {
      closeModal('modal-choose-type');
      if (window.GardenSchedulePlan) window.GardenSchedulePlan.openWizard();
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
        if (e.target === ov) { ov.style.display = 'none'; editingEvent = null; hideDeleteButtons(); }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.sch-modal-overlay, .sch-sheet-overlay').forEach(function (ov) {
        if (ov.style.display !== 'none') ov.style.display = 'none';
      });
      editingEvent = null; hideDeleteButtons();
    });
  }

  
  
  
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
    if (wasMissing || schedule.version === 2) save();

    syncArchive();

    currentWeekStart = getWeekStartDate(new Date());
    currentMonthDate = new Date();
    currentDayDate = new Date();
    agendaOn = !!schedule.settings.agenda;

    bindEvents();
    TP.build(document);
    syncViewButtons();
    render();

    document.addEventListener('garden:languageChanged', function () { render(); });

     
    if (nowTimer) clearInterval(nowTimer);
    nowTimer = setInterval(function () {
      if (currentView === 'month' || agendaOn) return;
      var dates = [];
      document.querySelectorAll('#grid-body .sch-daycol').forEach(function (c) {
        dates.push(parseLocalDate(c.getAttribute('data-date')));
      });
      if (dates.length) {
        var r = effectiveRange();
        drawNowLine(dates, r.startH, r.endH);
      }
       
      if (!document.hidden) {
        renderPulse(currentView === 'day' ? [new Date(currentDayDate)] : weekDateList());
        document.querySelectorAll('#grid-body .sch-ev.is-now').forEach(function (el) {
          var pct = el.getAttribute('data-pct');
          if (pct) el.style.setProperty('--p', pct + '%');
        });
      }
    }, 60000);

    maybeShowLegacyNotice();
    checkArchiveRestore();

    if (!schedule.settings.onboarded && semesterCourses().length) setTimeout(openEditor, 500);

    if (window.GardenSchedulePlan && window.GardenSchedulePlan.init) window.GardenSchedulePlan.init();
  }

  
  
  
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
