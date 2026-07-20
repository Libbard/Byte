;(function () {
  'use strict';

  var LS_KEY = 'weekly_schedule';
  var LS_SEMESTER = 'my_semester';
  var CATALOG_PATH = '../shared/data/courses_catalog.json';

  var DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var DAY_NAMES = {
    ar: { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' },
    en: { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }
  };
  var MONTH_NAMES = {
    ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };

  var schedule = null;  
  var semester = null;  
  var catalog = null;   
  var currentWeekStart = null; 
  var currentMonthDate = null; 
  var currentDayDate = null;   
  var currentView = 'week'; 
  var editingEvent = null;  
  var pendingStudyDate = null;  
  var pendingStudyTime = null;  
  var plannerCache = [];    
  var curriculumMaps = {};  
  var cmapLoading = {};     
  var cmapCbs = {};         

  
  var TP = (function () {
    function pad(n) { return String(n).padStart(2, '0'); }
    function to12(v) {
      var p = String(v || '15:00').split(':');
      var H = parseInt(p[0], 10) || 0, m = parseInt(p[1], 10) || 0;
      var mer = H < 12 ? 'ص' : 'م';       
      var h = H % 12; if (!h) h = 12;
      return { h: h, m: m, mer: mer };
    }
    function to24(h, m, mer) {
      h = parseInt(h, 10) % 12;
      if (mer === 'م') h += 12;
      return pad(h) + ':' + pad(m);
    }
    function apply(tp, val) {   
      var t = to12(val);
      tp.querySelector('.tp-h').value = t.h;
      tp.querySelector('.tp-m').value = t.m;
      tp.querySelector('.tp-mer').value = t.mer;
    }
    function sync(tp) {         
      var hid = tp.querySelector('input[type=hidden]');
      hid.value = to24(tp.querySelector('.tp-h').value, tp.querySelector('.tp-m').value, tp.querySelector('.tp-mer').value);
    }
    function build(root) {
      (root || document).querySelectorAll('.sch-timepick').forEach(function (tp) {
        var hs = tp.querySelector('.tp-h'), ms = tp.querySelector('.tp-m');
        var hid = tp.querySelector('input[type=hidden]');
        if (hs.dataset.built) return;
        hs.dataset.built = '1';
        for (var i = 1; i <= 12; i++) { var o = document.createElement('option'); o.value = i; o.textContent = i; hs.appendChild(o); }
        for (var j = 0; j < 60; j++) { var o2 = document.createElement('option'); o2.value = j; o2.textContent = pad(j); ms.appendChild(o2); }
        apply(tp, hid.value || '15:00');
        tp.addEventListener('change', function () { sync(tp); });
      });
    }
    function set(id, val) {     
      var hid = document.getElementById(id);
      if (hid) setEl(hid, val);
    }
    function setEl(hid, val) {  
      if (!hid) return;
      hid.value = val;
      var tp = hid.closest('.sch-timepick');
      if (tp) apply(tp, val);
    }
    return { build: build, set: set, setEl: setEl };
  })();

  
   
  function defaultSchedule() {
    return {
      version: 1,
      settings: {
        active_days: ['sunday','monday','tuesday','wednesday','thursday'],
        day_start_hour: 15,   
        day_end_hour: 22,     
        slot_duration_minutes: 30,
        reminder_lead: 0,         
        term_start_date: '',      
        term_type: 'normal',      
        semester_end_date: '',    
        focus_periods: {          
          midterm: { start: '', end: '' },
          final: { start: '', end: '' }
        },
        onboarded: false          
      },
      lectures: [],
      study_blocks: [],
      exams: [],
      week_overrides: {},
      updated_at: new Date().toISOString()
    };
  }

   
  function migrateSchedule(s) {
    var d = defaultSchedule();
    if (!s || typeof s !== 'object') return d;
    if (s.version == null) s.version = d.version;

    var st = s.settings;
    if (!st || typeof st !== 'object') st = s.settings = {};
    Object.keys(d.settings).forEach(function (k) {
      if (st[k] === undefined) st[k] = d.settings[k];
    });
    
    if (!Array.isArray(st.active_days) || !st.active_days.length) st.active_days = d.settings.active_days.slice();
    
    if (!st.focus_periods || typeof st.focus_periods !== 'object') st.focus_periods = d.settings.focus_periods;
    if (!st.focus_periods.midterm) st.focus_periods.midterm = { start: '', end: '' };
    if (!st.focus_periods.final) st.focus_periods.final = { start: '', end: '' };
    
    if (typeof st.day_start_hour !== 'number' || st.day_start_hour < 0 || st.day_start_hour > 23) st.day_start_hour = d.settings.day_start_hour;
    if (typeof st.day_end_hour !== 'number' || st.day_end_hour < 1 || st.day_end_hour > 24 || st.day_end_hour <= st.day_start_hour) st.day_end_hour = d.settings.day_end_hour;

    
    if (!Array.isArray(s.lectures)) s.lectures = [];
    if (!Array.isArray(s.study_blocks)) s.study_blocks = [];
    if (!Array.isArray(s.exams)) s.exams = [];
    if (!s.week_overrides || typeof s.week_overrides !== 'object') s.week_overrides = {};
    if (!s.updated_at) s.updated_at = new Date().toISOString();
    return s;
  }

  
  async function init() {
    try {
      var res = await fetch(CATALOG_PATH);
      catalog = await res.json();
    } catch(e) { catalog = { courses: [] }; }

    semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null');
    schedule = JSON.parse(localStorage.getItem(LS_KEY) || 'null');

    var wasMissing = !schedule;
    schedule = migrateSchedule(schedule);   
    if (wasMissing) save();

    currentWeekStart = getWeekStartDate(new Date());
    currentMonthDate = new Date();
    currentDayDate = new Date();

    render();
    bindEvents();
    TP.build(document);   
    
    document.addEventListener('garden:languageChanged', function() { render(); });

    
    if (!schedule.settings.onboarded && semester && semester.courses && semester.courses.length) {
      setTimeout(openEditor, 500);
    }
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
    var dayOfWeek = d.getDay(); 
    d.setDate(d.getDate() - dayOfWeek);
    return d;
  }

  
  function addMonthsStr(dateStr, n) {
    var p = String(dateStr).split('-');
    var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
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
    var wkStart = getWeekStartDate(date);
    var n = Math.round((wkStart - termStart) / (7 * 86400000)) + 1;
    return n >= 1 ? n : null;
  }
  
  function weekFocus(weekStart) {
    var fp = (schedule.settings || {}).focus_periods || {};
    var wkStart = getWeekStartDate(weekStart);
    var wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 6);
    function overlaps(p) {
      if (!p || !p.start || !p.end) return false;
      return parseLocalDate(p.start) <= wkEnd && parseLocalDate(p.end) >= wkStart;
    }
    if (overlaps(fp.midterm)) return { active: true, kind: 'midterm' };
    if (overlaps(fp.final)) return { active: true, kind: 'final' };
    return { active: false, kind: null };
  }

  
  function getEventsForWeek(weekStart) {
    var weekId = getWeekId(weekStart);
    var override = schedule.week_overrides[weekId] || {};
    var cancelledIds = new Set(override.cancelled_lectures || []);
    var extraDays = override.extra_days || [];

    var activeDays = schedule.settings.active_days.slice();
    extraDays.forEach(function(d) { if (activeDays.indexOf(d) === -1) activeDays.push(d); });

    var lectures = schedule.lectures.filter(function(lec) {
      if (cancelledIds.has(lec.id)) return false;
      if (activeDays.indexOf(lec.day) === -1) return false;
      return lec.recurring;
    });

    
    var focus = weekFocus(weekStart);
    var revealed = !!override.show_lectures;
    if (focus.active && !revealed) lectures = [];

    var studyBlocks = schedule.study_blocks.filter(function(sb) {
      if (activeDays.indexOf(sb.day) === -1) return false;
       
      if (sb.week_id == null && sb.excluded_weeks && sb.excluded_weeks.indexOf(weekId) !== -1) return false;
       
      return sb.week_id == null || sb.week_id === weekId;
    });

    var extraBlocks = override.added_blocks || [];

    return {
      lectures: lectures,
      studyBlocks: studyBlocks.concat(extraBlocks),
      activeDays: activeDays,
      weekId: weekId,
      focus: focus,
      revealed: revealed
    };
  }

  
  function parseLocalDate(s) {
    var p = String(s).split('-');
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  }
  
  function examToEvent(ex) {
    var d = parseLocalDate(ex.date);
    var start = ex.start_time || '15:00';
    return {
      id: ex.id, course_code: ex.course_code, day: DAYS_ORDER[d.getDay()],
      start_time: start, end_time: ex.end_time || addMinutes(start, 90),
      room: ex.room || '', type: ex.exam_type || 'exam', exam_type: ex.exam_type || 'exam',
      notes: ex.notes || '', youtube: '', date: ex.date, color: getCourseColor(ex.course_code)
    };
  }
  function examsInWeek(weekStart) {
    var start = new Date(weekStart); start.setHours(0, 0, 0, 0);
    var end = new Date(start); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999);
    return (schedule.exams || []).filter(function (ex) {
      if (!ex.date) return false;
      var d = parseLocalDate(ex.date);
      return d >= start && d <= end;
    }).map(examToEvent);
  }
  function examsOnDate(date) {
    var ds = fmtLocalDate(date);
    return (schedule.exams || []).filter(function (ex) { return ex.date === ds; }).map(examToEvent);
  }

   
  function tasksOnDate(dstr) {
    if (!window.GardenData || !window.GardenData.allDeadlines) return [];
    try {
      return window.GardenData.allDeadlines().filter(function (t) {
        return !t.done && t.source !== 'exam' && String(t.due || '').slice(0, 10) === dstr;
      }).map(function (t) {
        return { title: t.title || t.course || '', late: window.GardenData.daysUntil(t.due) < 0 };
      });
    } catch (e) { return []; }
  }

  
  
  function eventEndMinutes(ev) {
    var sp = (ev.start_time || '0:0').split(':');
    var startMin = parseInt(sp[0]) * 60 + parseInt(sp[1] || 0);
    if (ev.end_time) {
      var ep = ev.end_time.split(':');
      return parseInt(ep[0]) * 60 + parseInt(ep[1] || 0);
    }
    return startMin + (ev.duration_minutes || 60);
  }

   
  function isCompletableType(type) { return type === 'lecture' || type === 'exam' || type === 'study'; }
  function eventOccurrenceDate(event, type, weekStart) {
    if (type === 'exam' && event.date) return parseLocalDate(event.date);
    if (!weekStart) return null;
    var di = DAYS_ORDER.indexOf(event.day);
    if (di === -1) return null;
    var d = new Date(weekStart); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + di);
    return d;
  }
  function isEventExpired(event, type, weekStart) {
    var occ = eventOccurrenceDate(event, type, weekStart);
    if (!occ) return false;
    var end = new Date(occ); end.setMinutes(end.getMinutes() + eventEndMinutes(event));
    return end.getTime() < Date.now();
  }
  function isEventDone(event, type, weekStart) {
    if (type === 'exam') {
      var ex = (schedule.exams || []).filter(function (x) { return x.id === event.id; })[0];
      return !!(ex && ex.completed_at);
    }
    if (!weekStart) return false;
    var ov = schedule.week_overrides[getWeekId(weekStart)];
    return !!(ov && ov.completed_events && ov.completed_events.indexOf(event.id) !== -1);
  }
  function toggleEventDone(event, type, weekStart) {
    if (type === 'exam') {
      var ex = (schedule.exams || []).filter(function (x) { return x.id === event.id; })[0];
      if (ex) { ex.completed_at = ex.completed_at ? null : new Date().toISOString(); save(); }
    } else {
      var wid = getWeekId(weekStart);
      var ov = schedule.week_overrides[wid] || (schedule.week_overrides[wid] = {});
      ov.completed_events = ov.completed_events || [];
      var i = ov.completed_events.indexOf(event.id);
      if (i === -1) ov.completed_events.push(event.id); else ov.completed_events.splice(i, 1);
      save();
    }
    render();
  }

  
  function effectiveRange(allEvents) {
    var baseStart = schedule.settings.day_start_hour;
    var baseEnd = schedule.settings.day_end_hour;
    var minH = baseStart, maxH = baseEnd;
    allEvents.forEach(function (ev) {
      var sh = parseInt((ev.start_time || '').split(':')[0]);
      if (!isNaN(sh)) minH = Math.min(minH, sh);
      var endH = Math.ceil(eventEndMinutes(ev) / 60);
      if (!isNaN(endH)) maxH = Math.max(maxH, endH);
    });
    return { startH: Math.max(0, minH), endH: Math.min(24, Math.max(maxH, baseEnd)) };
  }

  function renderWeekView() {
    var events = getEventsForWeek(currentWeekStart);
    var examEvents = examsInWeek(currentWeekStart);
    var days = events.activeDays.slice();
    
    examEvents.forEach(function(ex) { if (days.indexOf(ex.day) === -1) days.push(ex.day); });
    
    var weekDayByDate = {};
    for (var wd = 0; wd < 7; wd++) {
      var wdDate = new Date(currentWeekStart);
      wdDate.setDate(wdDate.getDate() + wd);
      weekDayByDate[fmtLocalDate(wdDate)] = DAYS_ORDER[wdDate.getDay()];
    }
    plannerCache.forEach(function(p) {
      var pd = weekDayByDate[p.date];
      if (pd && days.indexOf(pd) === -1) days.push(pd);
    });
    days.sort(function(a,b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });
    var range = effectiveRange(events.lectures.concat(events.studyBlocks).concat(examEvents));
    var startH = range.startH;
    var endH = range.endH;
    var slotMin = schedule.settings.slot_duration_minutes;
    var totalSlots = (endH - startH) * (60 / slotMin);
    var lang = document.documentElement.getAttribute('lang') || 'ar';

    var grid = document.getElementById('timetable');
    var cols = '60px ' + days.map(function() { return '1fr'; }).join(' ');
    grid.style.gridTemplateColumns = cols;
     
    grid.style.gridTemplateRows = 'auto repeat(' + totalSlots + ', 40px)';

    var pcache = plannerCache;
    var html = '';
    html += '<div class="sch-time-header"></div>';
    days.forEach(function(day, i) {
      var dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + DAYS_ORDER.indexOf(day));
      var isToday = isSameDay(dayDate, new Date());
      html += '<div class="sch-day-header' + (isToday ? ' today' : '') + '">' +
              DAY_NAMES[lang][day] + '<br><span class="sch-day-date">' + dayDate.getDate() + '</span>' +
              plannerBadgesHtml(fmtLocalDate(dayDate), pcache) + '</div>';
    });

    for (var s = 0; s < totalSlots; s++) {
      var hour = startH + Math.floor(s * slotMin / 60);
      var min = (s * slotMin) % 60;
      var timeStr = String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0');
      if (min === 0) {
        html += '<div class="sch-time-label" style="grid-row:' + (s + 2) + '/span ' + (60/slotMin) + '">' + timeStr + '</div>';
      }
      days.forEach(function(day, di) {
        html += '<div class="sch-cell" data-day="' + day + '" data-time="' + timeStr + '" ' +
                'style="grid-column:' + (di + 2) + '; grid-row:' + (s + 2) + '"></div>';
      });
    }

    grid.innerHTML = html;

     
    var allDraw = [];
    events.lectures.forEach(function (e) { allDraw.push({ ev: e, type: 'lecture' }); });
    events.studyBlocks.forEach(function (e) { allDraw.push({ ev: e, type: 'study' }); });
    examEvents.forEach(function (e) { allDraw.push({ ev: e, type: 'exam' }); });
     
    timedPlanBlocks(currentWeekStart, days).forEach(function (e) { allDraw.push({ ev: e, type: 'plan' }); });
    computeOverlapColumns(allDraw);
    allDraw.forEach(function (d) {
      var el = createEventBlock(d.ev, d.type, days, startH, slotMin, currentWeekStart);
      if (el) grid.appendChild(el);
    });

    renderPrintAppendix(currentWeekStart, days);

    var endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 4); 
    var weekLabel = document.getElementById('week-label');
    var dateRange = currentWeekStart.getDate() + ' - ' + endDate.getDate() + ' ' +
      MONTH_NAMES[lang][currentWeekStart.getMonth()] + ' ' + currentWeekStart.getFullYear();
    var swn = studyWeekNumber(currentWeekStart);
    var wkPrefix = swn ? ((lang === 'ar' ? 'الأسبوع ' + swn : 'Week ' + swn) + ' · ') : '';
    weekLabel.textContent = wkPrefix + dateRange;

    grid.querySelectorAll('.sch-cell').forEach(function(cell) {
      cell.addEventListener('click', function() {
        openAddModal(this.dataset.day, this.dataset.time);
      });
    });
  }

   
  function parseHM(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t == null ? '' : t).trim());
    if (!m) return null;
    var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

   
  function computeOverlapColumns(list) {
    var byDay = {};
    list.forEach(function (d) {
      var s = parseHM(d.ev.start_time);
      if (s === null) { d.ev._col = 0; d.ev._cols = 1; return; }
      var e;
      if (d.type === 'lecture' || d.type === 'exam') { e = parseHM(d.ev.end_time); if (e === null || e <= s) e = s + 60; }
      else e = s + (d.ev.duration_minutes || 60);
      d._s = s; d._e = e;
      (byDay[d.ev.day] = byDay[d.ev.day] || []).push(d);
    });
    Object.keys(byDay).forEach(function (day) {
      var evs = byDay[day];
      evs.sort(function (a, b) { return a._s - b._s || a._e - b._e; });
      var columns = [];      
      var cluster = [], clusterEnd = -1;
      function flush() {
        var n = 0;
        cluster.forEach(function (x) { n = Math.max(n, x.ev._col + 1); });
        cluster.forEach(function (x) { x.ev._cols = n; });
        cluster = []; columns = [];
      }
      evs.forEach(function (d) {
        if (cluster.length && d._s >= clusterEnd) flush();
        var placed = false;
        for (var i = 0; i < columns.length; i++) {
          if (columns[i] <= d._s) { columns[i] = d._e; d.ev._col = i; placed = true; break; }
        }
        if (!placed) { d.ev._col = columns.length; columns.push(d._e); }
        cluster.push(d);
        clusterEnd = Math.max(clusterEnd, d._e);
      });
      if (cluster.length) flush();
    });
  }

  function createEventBlock(event, type, days, startH, slotMin, weekStart) {
    var dayIndex = days.indexOf(event.day);
    if (dayIndex === -1) return null;

    var startMinutes = parseHM(event.start_time);
    if (startMinutes === null) {
      
      console.warn('[schedule] وقت بداية غير صالح — تُخطّي الحدث:', event.id, event.start_time);
      return null;
    }
    var startSlot = (startMinutes - startH * 60) / slotMin;

    var endMinutes;
    if (type === 'lecture' || type === 'exam') {
      endMinutes = parseHM(event.end_time);
      if (endMinutes === null) endMinutes = startMinutes + 60;
    } else {
      endMinutes = startMinutes + (event.duration_minutes || 60);
    }
    if (endMinutes <= startMinutes) endMinutes = startMinutes + slotMin;
    var span = (endMinutes - startMinutes) / slotMin;

     
    var clipped = false;
    if (startSlot < 0) {
      span += startSlot;
      startSlot = 0;
      clipped = true;
    }
    if (span < 1) span = 1;

    var color = event.color || getCourseColor(event.course_code);
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    var courseName = getCourseShortName(event.course_code);

    var el = document.createElement('div');
    var cols = event._cols || 1, col = event._col || 0;
    
    var completable = isCompletableType(type);
    var done = completable && isEventDone(event, type, weekStart);
    var expired = completable && !done && isEventExpired(event, type, weekStart);
    el.className = 'sch-event sch-event-' + type + (clipped ? ' sch-event-clipped' : '') + (cols >= 3 ? ' sch-event-tight' : '') +
      (done ? ' sch-event-done' : '') + (expired ? ' sch-event-expired' : '');
    el.style.gridColumn = String(dayIndex + 2);
    el.style.gridRow = (Math.round(startSlot) + 2) + ' / span ' + Math.max(1, Math.round(span));
     
    if (cols > 1) {
      el.style.width = 'calc(' + (100 / cols) + '% - 3px)';
      el.style.marginInlineStart = (col * 100 / cols) + '%';
    }
    el.style.setProperty('--event-color', color);
    if (clipped) {
      el.title = (lang === 'ar')
        ? 'يبدأ هذا الحدث قبل بداية الجدول — قُصّ إلى بدايته'
        : 'This event starts before the schedule begins — clipped to the start';
    }

    var hasNote = !!(event.notes || event.youtube);
    var noteMark = hasNote ? ' <span class="sch-event-note" title="ملاحظة">📝</span>' : '';
    var innerHtml = '<div class="sch-event-title">' + courseName + noteMark + '</div>';
    if (type === 'lecture') {
      var typeLabels = { lecture: lang==='ar'?'محاضرة':'Lecture', lab: lang==='ar'?'معمل':'Lab',
                         tutorial: lang==='ar'?'تمارين':'Tutorial', section: lang==='ar'?'شعبة':'Section' };
      innerHtml += '<div class="sch-event-meta">' + (typeLabels[event.type] || '') +
                   (event.room ? ' · ' + event.room : '') + '</div>';
    } else if (type === 'exam') {
      var examLabels = { exam: lang==='ar'?'اختبار':'Exam', midterm: lang==='ar'?'نصفي':'Midterm',
                         final: lang==='ar'?'نهائي':'Final', quiz: lang==='ar'?'كويز':'Quiz' };
      innerHtml += '<div class="sch-event-meta">📝 ' + (examLabels[event.exam_type] || examLabels.exam) +
                   (event.room ? ' · ' + event.room : '') + '</div>';
    } else {
      var dueCount = getDueCards(event.course_code, event.modules);
      if (dueCount > 0) {
        innerHtml += '<div class="sch-event-badge">🃏 ' + dueCount + '</div>';
      }
      if (type === 'plan' && event._plan) {
        var pn = parseInt(String(event._plan.module_id || '').replace(/^M/i, ''), 10);
        if (!isNaN(pn)) innerHtml += '<div class="sch-event-meta">M' + pn + '</div>';
      }
    }

    
    if (completable) {
      innerHtml += '<button class="sch-event-check' + (done ? ' is-done' : '') + '" type="button" ' +
        'title="' + escapeH(done ? (isAr() ? 'إلغاء الإتمام' : 'Mark undone') : (isAr() ? 'إتمام' : 'Mark done')) + '" ' +
        'aria-pressed="' + (done ? 'true' : 'false') + '">✓</button>';
    }

    el.innerHTML = innerHtml;

    var chk = el.querySelector('.sch-event-check');
    if (chk) chk.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleEventDone(event, type, weekStart);
    });

    el.addEventListener('click', function(e) {
      e.stopPropagation();
       
      if (type === 'study' || type === 'plan') openSessionCard(type, event);
      else openEditEvent(type, event);   
    });

    return el;
  }

   
  function openSessionCard(type, event) {
    var model;
    if (type === 'plan' && event._plan) {
      model = event._plan;
    } else {
      
      model = {
        id: event.id, level: null, plan: null, date: null,
        course_code: event.course_code, kind: 'routine',
        modules: event.modules || [], module_id: (event.modules && event.modules[0]) || null,
        completed: false, time: event.start_time, duration_minutes: event.duration_minutes,
        notes: event.notes || '', youtube: event.youtube || ''
      };
    }
    document.getElementById('pd-title').textContent =
      (isAr() ? 'الجلسة · ' : 'Session · ') + (model.course_code || '');
    document.getElementById('pd-body').innerHTML = sessionCardHtml(model);
    var m = document.getElementById('modal-planner-detail');
    m.dataset.pdate = model.date || ''; m.dataset.pcourse = '';   
    m.style.display = '';
  }

  
  
  function getDueCards(courseCode, modules) {
    if (!courseCode || String(courseCode).indexOf('__CUSTOM_') === 0) return 0;
    var now = Date.now();
    var count = 0;
    var courseInfo = catalog && catalog.courses ? catalog.courses.find(function(c) { return c.code === courseCode; }) : null;
    var totalModules = courseInfo ? courseInfo.modules : 13;

    var modNums = [];
    if (modules && modules.length > 0) {
      modules.forEach(function(m) {
        var n = parseInt(String(m).replace('M',''));
        if (!isNaN(n)) modNums.push(n);
      });
    } else {
      for (var i = 1; i <= totalModules; i++) modNums.push(i);
    }

    modNums.forEach(function(m) {
      var key = 'garden_' + courseCode + '_m' + m + '_fc'; 
      var raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        var data = JSON.parse(raw);
        Object.values(data).forEach(function(card) { 
          if (card && typeof card === 'object' && card.nextReview && card.nextReview <= now) count++;
        });
      } catch(e) {}
    });
    return count;
  }

  
  
  function fmtLocalDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
   
  var planFilter = (function () {
    try { return sessionStorage.getItem('sch_plan_filter') || 'active'; } catch (e) { return 'active'; }
  })();

  function planKeysFor(data, filt) {
    filt = filt || planFilter;
    var all = Object.keys(data.plans || {});
    if (filt === 'all') return all;
    if (filt === 'midterm' || filt === 'final') {
      return all.indexOf(filt) !== -1 ? [filt] : [];
    }
    var act = data.active_plan || 'midterm';
    return all.indexOf(act) !== -1 ? [act] : [];
  }

   
  function getPlannerEvents(filt) {
    var out = [];
    if (!semester || !semester.courses) return out;
    var codes = {};
    semester.courses.forEach(function (c) { codes[c.code] = true; });
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || key.indexOf('planner_v2_L') !== 0 || key.indexOf('_progress') !== -1) continue;
      var levelId = key.replace('planner_v2_L', '');
      var data;
      try { data = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; }
      if (!data || !data.plans) continue;
      planKeysFor(data, filt).forEach(function (planKey) {
        var plan = data.plans[planKey] || {};
        var ce = plan.course_exams || {};
        Object.keys(ce).forEach(function (cid) {
          if (codes[cid] && ce[cid]) {
            out.push({ date: ce[cid], course_code: cid, kind: 'exam', label: (isAr() ? 'اختبار' : 'Exam') + ' · ' + cid, level: levelId, plan: planKey });
          }
        });
        var entries = plan.entries || {};
        Object.keys(entries).forEach(function (date) {
          var modAgg = {};  
          (entries[date].items || []).forEach(function (it) {
            if (it.type === 'event' && codes[it.course_id]) {
              out.push({ date: date, course_code: it.course_id, kind: it.event_type || 'event', label: it.label || it.event_type || '', level: levelId, plan: planKey,
                items: [{ id: it.id, level: levelId, plan: planKey, date: date, course_code: it.course_id, kind: 'event', event_type: it.event_type, label: it.label, completed: !!it.completed,
                          time: it.time || null, duration_minutes: it.duration_minutes || null, notes: it.notes || '', youtube: it.youtube || '' }] });
            } else if (it.type === 'module' && codes[it.course_id]) {
              var mk = (it.instance_kind === 'review') ? 'review' : 'study';
              var key = it.course_id + '|' + mk;
               
              (modAgg[key] = modAgg[key] || []).push({ id: it.id, level: levelId, plan: planKey, date: date, course_code: it.course_id, kind: mk, module_id: it.module_id, part: it.part, total_parts: it.total_parts, completed: !!it.completed,
                time: it.time || null, duration_minutes: it.duration_minutes || null, notes: it.notes || '', youtube: it.youtube || '' });
            }
          });
          Object.keys(modAgg).forEach(function (key) {
            var parts = key.split('|'), cid = parts[0], mk = parts[1], arr = modAgg[key], n = arr.length;
            var kindWord = (mk === 'review') ? (isAr() ? 'مراجعة' : 'Review') : (isAr() ? 'مذاكرة' : 'Study');
            out.push({ date: date, course_code: cid, kind: mk, count: n, items: arr, label: kindWord + ' · ' + cid + ' (' + n + ')', level: levelId, plan: planKey });
          });
        });
      });
    }
    return out;
  }
  function plannerKindIcon(kind) {
    return ({ exam: '📝', midterm: '📝', final: '🎓', assign: '📋', quiz: '✏️', project: '🛠️', study: '📚', review: '🔁' })[kind] || '📌';
  }

  
  
  function recomputePlannerProgress(level, data) {
    var total = 0, done = 0;
    Object.keys(data.plans || {}).forEach(function (pk) {
      var p = data.plans[pk] || {};
      Object.keys(p.entries || {}).forEach(function (d) {
        (p.entries[d].items || []).forEach(function (item) {
          if (item.type === 'module') { total++; if (item.completed) done++; }
        });
      });
    });
    if (data.module_status) Object.keys(data.module_status).forEach(function (mkey) {
      if (data.module_status[mkey] !== 'mastered') return;
      var pp = mkey.split('_'), cid = pp[0], mid = pp[1];
      var inCal = Object.keys(data.plans || {}).some(function (pk) {
        var p = data.plans[pk] || {};
        return Object.keys(p.entries || {}).some(function (d) {
          return (p.entries[d].items || []).some(function (i) { return i.type === 'module' && i.course_id === cid && i.module_id === mid; });
        });
      });
      if (!inCal) { total++; done++; }
    });
    localStorage.setItem('planner_v2_progress_L' + level,
      JSON.stringify({ total: total, completed: done, percent: total ? Math.round(done / total * 100) : 0 }));
  }
  
  function togglePlannerItem(level, plan, date, itemId) {
    var key = 'planner_v2_L' + level;
    var data;
    try { data = JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    if (!data || !data.plans || !data.plans[plan] || !data.plans[plan].entries || !data.plans[plan].entries[date]) return null;
    var items = data.plans[plan].entries[date].items || [];
    var it = null;
    for (var i = 0; i < items.length; i++) { if (items[i].id === itemId) { it = items[i]; break; } }
    if (!it) return null;
    it.completed = !it.completed;
    if (data.level === undefined) data.level = parseInt(level) || level;
    localStorage.setItem(key, JSON.stringify(data));
    recomputePlannerProgress(level, data);
    if (window.FirebaseSync) { try { var fn = window.FirebaseSync.save || window.FirebaseSync.set; if (fn) fn(key, data); } catch (e) {} }
    return it.completed;
  }

  
  
  function plannerUid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); } 
  function plannerLoad(level) {
    var key = 'planner_v2_L' + level, data;
    try { data = JSON.parse(localStorage.getItem(key)); } catch (e) { data = null; }
    if (!data || typeof data !== 'object') data = { version: 2, level: parseInt(level) || level, active_plan: 'midterm', plans: {}, module_notes: {}, module_status: {}, custom_courses: [] };
    if (!data.plans) data.plans = {};
    return { key: key, data: data };
  }
  function plannerWrite(level, data) {
    var key = 'planner_v2_L' + level;
    if (data.level === undefined) data.level = parseInt(level) || level;
    localStorage.setItem(key, JSON.stringify(data));
    recomputePlannerProgress(level, data);
    if (window.FirebaseSync) { try { var fn = window.FirebaseSync.save || window.FirebaseSync.set; if (fn) fn(key, data); } catch (e) {} }
  }
  function planEntriesOf(data, plan) {
    if (!data.plans[plan]) data.plans[plan] = { start_date: '', end_date: '', course_exams: {}, entries: {}, excluded_courses: [] };
    if (!data.plans[plan].entries) data.plans[plan].entries = {};
    return data.plans[plan].entries;
  }
  
  function countModuleInstances(data, plan, cid, mid) {
    var n = 0, entries = (data.plans[plan] && data.plans[plan].entries) || {};
    Object.keys(entries).forEach(function (d) {
      (entries[d].items || []).forEach(function (it) { if (it.type === 'module' && it.course_id === cid && it.module_id === mid) n++; });
    });
    return n;
  }
  
  function plannerPlaceModule(level, plan, date, cid, mid, kind, opts) {
    if (level == null || !plan || !date || !cid || !mid) return { ok: false, reason: 'bad' };
    var L = plannerLoad(level), data = L.data;
    var entries = planEntriesOf(data, plan);
    var e = entries[date] || (entries[date] = { items: [], day_note: '' });
    e.items = e.items || [];
    var count = countModuleInstances(data, plan, cid, mid);
    var k, n;
    if (kind === 'review') { k = 'review'; n = count; }          
    else if (kind === 'study') { k = 'study'; n = 0; }
    else { if (count === 0) { k = 'study'; n = 0; } else { k = 'review'; n = count; } } 
    
    if (k === 'study' && e.items.some(function (i) { return i.type === 'module' && i.course_id === cid && i.module_id === mid && i.instance_kind === 'study'; }))
      return { ok: false, reason: 'dup' };
    var rec = { id: plannerUid(), type: 'module', course_id: cid, module_id: mid, part: 1, total_parts: 1, completed: false, instance_kind: k, instance_n: n };
     
    if (opts && opts.time) {
      rec.time = opts.time;
      rec.duration_minutes = parseInt(opts.dur, 10) > 0 ? parseInt(opts.dur, 10) : 60;
    }
    e.items.push(rec);
    plannerWrite(level, data);
    return { ok: true, kind: k, n: n, id: rec.id };
  }

   
  function plannerTargetLevel(code) {
    var inSem = (semester && semester.courses || []).some(function (c) { return c && c.code === code; });
     
    if (inSem) return 'HUB';
    return courseLevel(code);
  }
  
  function plannerRemoveItem(level, plan, date, id) {
    var L = plannerLoad(level), data = L.data;
    var entries = data.plans[plan] && data.plans[plan].entries;
    if (!entries || !entries[date]) return false;
    var e = entries[date];
    e.items = (e.items || []).filter(function (i) { return i.id !== id; });
    if (!(e.items && e.items.length) && !e.day_note) delete entries[date]; 
    plannerWrite(level, data);
    return true;
  }
  
  function plannerMoveItem(level, plan, from, to, id) {
    if (from === to) return false;
    var L = plannerLoad(level), data = L.data;
    var entries = data.plans[plan] && data.plans[plan].entries;
    if (!entries || !entries[from]) return false;
    var fe = entries[from];
    var item = (fe.items || []).find(function (i) { return i.id === id; });
    if (!item) return false;
    fe.items = fe.items.filter(function (i) { return i.id !== id; });
    if (!(fe.items && fe.items.length) && !fe.day_note) delete entries[from]; 
    var te = entries[to] || (entries[to] = { items: [], day_note: '' });
    te.items = te.items || []; te.items.push(item);
    plannerWrite(level, data);
    return true;
  }

   
  function plannerSetTime(level, plan, date, id, time, dur) {
    var L = plannerLoad(level), data = L.data;
    var entries = data.plans[plan] && data.plans[plan].entries;
    if (!entries || !entries[date]) return false;
    var item = (entries[date].items || []).find(function (i) { return i.id === id; });
    if (!item) return false;
    if (time) {
      item.time = time;
      item.duration_minutes = parseInt(dur, 10) > 0 ? parseInt(dur, 10) : 60;
    } else {
      delete item.time;              
      delete item.duration_minutes;
    }
    plannerWrite(level, data);
    return true;
  }

  
  function fmtTime12(v) {
    var p = String(v || '').split(':');
    var H = parseInt(p[0], 10);
    if (isNaN(H)) return v || '';
    var m = p[1] || '00';
    var mer = H < 12 ? (isAr() ? 'ص' : 'AM') : (isAr() ? 'م' : 'PM');
    var h = H % 12; if (!h) h = 12;
    return isAr() ? (h + ':' + m + mer) : (h + ':' + m + ' ' + mer);
  }
  
  function ensureCurriculumMap(level, cb) {
    if (level == null) return;
    if (curriculumMaps[level] !== undefined) { if (cb) cb(); return; } 
    if (cb) (cmapCbs[level] = cmapCbs[level] || []).push(cb);
    if (cmapLoading[level]) return; 
    cmapLoading[level] = true;
     
    var cmUrl = (level === 'others') ? '../others/data/curriculum_map.json'
                                     : ('../L' + level + '/data/curriculum_map.json');
    fetch(cmUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { curriculumMaps[level] = j || null; })
      .catch(function () { curriculumMaps[level] = null; })
      .then(function () {
        cmapLoading[level] = false;
        var cbs = cmapCbs[level] || []; cmapCbs[level] = [];
        cbs.forEach(function (f) { try { f(); } catch (e) {} });
        render(); 
      });
  }
  
  function courseLevel(code) {
    if (!catalog || !catalog.courses) return null;
    var c = catalog.courses.find(function (x) { return x.code === code; });
    if (!c || !c.level) return null;
    var m = String(c.level).match(/\d+/);
    if (m) return m[0];
     
    if (String(c.level).toLowerCase() === 'others') return 'others';
    return null;
  }
   
  function mapLevelFor(code, level) {
    return (level === 'HUB') ? courseLevel(code) : level;
  }
  
  function plannerActivePlan(level) {
    try { var d = JSON.parse(localStorage.getItem('planner_v2_L' + level)); return (d && d.active_plan) || 'midterm'; }
    catch (e) { return 'midterm'; }
  }
  
  function resolveModuleTitle(code, mid, level) {
    if (!code || !mid) return null;
    var cm = curriculumMaps[mapLevelFor(code, level)];
    if (!cm || !cm.courses || !cm.courses[code]) return null;
    var mods = cm.courses[code].modules || {};
    var md = mods[mid];
    if (!md) { 
      var n = parseInt(String(mid).replace(/^M/i, ''), 10);
      if (!isNaN(n)) md = mods['M' + String(n).padStart(2, '0')] || mods['M' + n];
    }
    if (!md) return null;
    return isAr() ? (md.title || null) : (md.title_en || md.title || null);
  }
  function moduleLabel(mid, part, total, code, level) {
    if (!mid) return '';
    var n = parseInt(String(mid).replace(/^M/i, ''), 10);
    var title = resolveModuleTitle(code, mid, level); 
    var base = title || (isAr() ? ('الوحدة ' + (isNaN(n) ? mid : n)) : ('Module ' + (isNaN(n) ? mid : n)));
    var s = title ? ((isNaN(n) ? mid : 'M' + n) + ' · ' + base) : base;
    if (part && total && total > 1) s += isAr() ? (' (جزء ' + part + '/' + total + ')') : (' (part ' + part + '/' + total + ')');
    return s;
  }
  function planWord(plan) { return plan === 'final' ? (isAr() ? 'فاينل' : 'Final') : (isAr() ? 'ميد' : 'Mid'); }

  
  function plannerItemsFor(dateStr, courseCode) {
    var res = [];
    plannerCache.forEach(function (e) {
      if (e.date !== dateStr || e.course_code !== courseCode || !e.items) return;
      e.items.forEach(function (it) { res.push(it); });
    });
    return res;
  }
   

  function courseInfoOf(code) {
    if (!catalog || !catalog.courses) return null;
    return catalog.courses.find(function (x) { return x.code === code; }) || null;
  }

   
  function moduleHref(code, mid) {
    var info = courseInfoOf(code);
    if (!info || !info.path || !mid) return null;
    var n = parseInt(String(mid).replace(/^M/i, ''), 10);
    if (isNaN(n)) return null;
    return '../' + info.path.replace(/index\.html$/, '') + 'M' + String(n).padStart(2, '0') + '.html';
  }

  function moduleQuizDone(code, mid) {
    var n = parseInt(String(mid || '').replace(/^M/i, ''), 10);
    if (isNaN(n)) return null;
    var raw = null;
    try { raw = localStorage.getItem('garden_' + code + '_m' + n + '_quiz'); } catch (e) { return null; }
    if (raw === null) return null;
    var score = parseInt(raw, 10);
    return isNaN(score) ? null : score;
  }

  function fmtTimeRange(time, dur) {
    if (!time) return '';
    var start = parseHM(time);
    if (start === null) return '';
    var end = start + (dur || 60);
    var f = function (m) { return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    return f(start) + '–' + f(end);
  }

  function sessionCardHtml(it) {
    var isEvent = (it.kind === 'event');
    var isRoutine = (it.kind === 'routine');
    var label = isEvent ? (it.label || (isAr() ? 'حدث' : 'Event'))
                        : moduleLabel(it.module_id, it.part, it.total_parts, it.course_code, it.level);
    var kindWord = it.kind === 'review' ? (isAr() ? 'مراجعة' : 'Review')
                 : it.kind === 'study' ? (isAr() ? 'مذاكرة' : 'Study')
                 : isRoutine ? (isAr() ? 'روتين أسبوعي' : 'Weekly routine')
                 : (isAr() ? 'حدث' : 'Event');
    var ds = 'data-level="' + escapeH(it.level || '') + '" data-plan="' + escapeH(it.plan || '') +
             '" data-date="' + escapeH(it.date || '') + '" data-id="' + escapeH(it.id) + '"' +
             (isRoutine ? ' data-routine="1"' : '');

     
    var srcWord = isRoutine ? (isAr() ? 'متكرّر' : 'Recurring')
                : (it.level === 'HUB' ? (isAr() ? 'فصلي' : 'My semester') : ('L' + it.level)) +
                  (it.plan ? ' · ' + planWord(it.plan) : '');

    var html = '<div class="sch-card' + (it.completed ? ' is-done' : '') + '" ' + ds +
               ' style="--course-color:' + escapeH(getCourseColor(it.course_code)) + '">';

    
    html += '<div class="sch-card-head">' +
      '<span class="sch-card-kind">' + plannerKindIcon(isRoutine ? 'study' : it.kind) + ' ' + escapeH(kindWord) + '</span>' +
      '<span class="sch-card-code">' + escapeH(it.course_code || '') + '</span>' +
      '<span class="sch-card-src">' + escapeH(srcWord) + '</span>' +
    '</div>';

    
    html += '<div class="sch-card-title">' + escapeH(label) + '</div>';

    
    var facts = [];
    if (window.GardenData && it.course_code && !isEvent) {
      var mods = isRoutine ? (it.modules || []) : (it.module_id ? [it.module_id] : []);
      var due = 0;
      try { due = window.GardenData.dueCards(it.course_code, mods.length ? mods : null); } catch (e) {}
      if (due > 0) {
        facts.push('<span class="sch-card-fact sch-card-fact--due">🃏 ' +
          escapeH(smartCountSch(due, ['مستحقّة', 'مستحقّتان', 'مستحقّة'], ['due', 'due'])) + '</span>');
      }
    }
    if (!isEvent && !isRoutine && it.module_id) {
      var q = moduleQuizDone(it.course_code, it.module_id);
      if (q !== null) {
        
        var qCls = q >= 60 ? ' sch-card-fact--ok' : ' sch-card-fact--warn';
        var qIco = q >= 60 ? '✅ ' : '📊 ';
        facts.push('<span class="sch-card-fact' + qCls + '">' +
          qIco + escapeH(isAr() ? ('نتيجتك في كويز الوحدة: ' + q + '%') : ('Your module quiz: ' + q + '%')) + '</span>');
      }
    }
    if (facts.length) html += '<div class="sch-card-facts">' + facts.join('') + '</div>';

    
    var range = fmtTimeRange(it.time, it.duration_minutes);
    if (range) html += '<div class="sch-card-time">🕐 <bdi>' + escapeH(range) + '</bdi></div>';

    
    if (it.notes) html += '<div class="sch-card-note">📝 ' + escapeH(it.notes) + '</div>';
    if (it.youtube) {
      html += '<a class="sch-card-yt" href="' + escapeH(it.youtube) + '" target="_blank" rel="noopener">▶️ ' +
              escapeH(isAr() ? 'فيديو الشرح' : 'Video') + '</a>';
    }

    
    html += '<div class="sch-card-actions">';
    if (!isRoutine) {
      html += '<button class="sch-card-btn sch-pd-check" ' + ds + ' aria-pressed="' + (it.completed ? 'true' : 'false') + '">' +
              (it.completed ? '✓ ' + escapeH(isAr() ? 'منجزة' : 'Done') : '✓ ' + escapeH(isAr() ? 'إتمام' : 'Complete')) + '</button>';
    }
    var href = (!isEvent && it.module_id) ? moduleHref(it.course_code, it.module_id) : null;
    if (href) {
      html += '<a class="sch-card-btn" href="' + escapeH(href) + '">📖 ' + escapeH(isAr() ? 'افتح الوحدة' : 'Open module') + '</a>';
    }
    if (!isRoutine) {
      html += '<button class="sch-card-btn sch-card-time-btn" title="' + escapeH(isAr() ? 'وقت الجلسة' : 'Session time') + '">🕐</button>';
      html += '<button class="sch-card-btn sch-pd-move" title="' + escapeH(isAr() ? 'نقل' : 'Move') + '">📅</button>';
      
      if (!isEvent) html += '<button class="sch-card-btn sch-pd-edit" title="' + escapeH(isAr() ? 'تعديل' : 'Edit') + '">✏️</button>';
      html += '<button class="sch-card-btn sch-pd-del" title="' + escapeH(isAr() ? 'حذف' : 'Delete') + '">🗑</button>';
    } else {
      html += '<button class="sch-card-btn sch-card-edit-block" title="' + escapeH(isAr() ? 'تعديل' : 'Edit') + '">✏️</button>';
    }
    html += '</div>';

    
    if (!isRoutine) {
      html += '<div class="sch-card-timeedit" style="display:none">' +
        '<input type="time" class="sch-card-time-in" value="' + escapeH(it.time || '') + '">' +
        '<input type="number" class="sch-card-dur-in" min="15" step="15" placeholder="' +
          escapeH(isAr() ? 'دقائق' : 'min') + '" value="' + escapeH(it.duration_minutes || '') + '">' +
        '<button class="sch-card-time-ok" title="' + escapeH(isAr() ? 'تأكيد' : 'Confirm') + '">✓</button>' +
        '<button class="sch-card-time-clear" title="' + escapeH(isAr() ? 'بلا وقت' : 'No time') + '">✕</button>' +
      '</div>';
      html += '<span class="sch-pd-moveedit" style="display:none">' +
        '<input type="date" class="sch-pd-movedate" value="' + escapeH(it.date || '') + '">' +
        '<button class="sch-pd-moveok" title="' + escapeH(isAr() ? 'تأكيد' : 'Confirm') + '">✓</button>' +
        '<button class="sch-pd-movecancel" title="' + escapeH(isAr() ? 'إلغاء' : 'Cancel') + '">✕</button></span>';
    }

    html += '</div>';
    return html;
  }

   
  function smartCountSch(n, arForms, enForms) {
    if (window.Garden && window.Garden.smartCount) return window.Garden.smartCount(n, arForms, enForms);
    return n + ' ' + (isAr() ? arForms[2] : enForms[1]);
  }

   
  function plannerRowHtml(it) { return sessionCardHtml(it); }
  function openPlannerDetail(dateStr, courseCode) {
    var items = plannerItemsFor(dateStr, courseCode);
    document.getElementById('pd-title').textContent = (isAr() ? 'خطة ' : 'Plan · ') + courseCode + ' — ' + dateStr;
    var body = document.getElementById('pd-body');
    var rows = items.length ? items.map(plannerRowHtml).join('') : '<p class="sch-editor-hint">' + (isAr() ? 'لا جلسات مخطّطة.' : 'No planned sessions.') + '</p>';
    
    var addBtn = (courseLevel(courseCode) != null)
      ? '<button class="sch-btn sch-btn-secondary sch-pd-add" data-date="' + escapeH(dateStr) + '" data-course="' + escapeH(courseCode) + '">➕ ' + (isAr() ? 'إضافة جلسة هنا' : 'Add session here') + '</button>'
      : '';
    body.innerHTML = rows + addBtn;
    var m = document.getElementById('modal-planner-detail');
    m.dataset.pdate = dateStr; m.dataset.pcourse = courseCode;
    m.style.display = '';
  }
   
  function renderPrintAppendix(weekStart, days) {
    var box = document.getElementById('print-appendix');
    if (!box) return;
    var rows = [];
    days.forEach(function (day) {
      var dt = new Date(weekStart);
      dt.setDate(dt.getDate() + DAYS_ORDER.indexOf(day));
      var ds = fmtLocalDate(dt);
      var lang = document.documentElement.getAttribute('lang') || 'ar';
      plannerCache.forEach(function (e) {
        if (e.date !== ds || !e.items) return;
        e.items.forEach(function (it) {
          rows.push({
            day: DAY_NAMES[lang][day] + ' ' + dt.getDate(),
            time: it.time ? fmtTimeRange(it.time, it.duration_minutes) : (isAr() ? 'بلا وقت' : 'Untimed'),
            code: it.course_code,
            what: (it.kind === 'event') ? (it.label || '') :
                  moduleLabel(it.module_id, it.part, it.total_parts, it.course_code, it.level),
            done: !!it.completed
          });
        });
      });
    });
    if (!rows.length) { box.innerHTML = ''; return; }
    box.innerHTML =
      '<h2>' + escapeH(isAr() ? 'جلسات الأسبوع' : 'Week sessions') + '</h2>' +
      '<table class="sch-print-table"><thead><tr>' +
        '<th>' + escapeH(isAr() ? 'اليوم' : 'Day') + '</th>' +
        '<th>' + escapeH(isAr() ? 'الوقت' : 'Time') + '</th>' +
        '<th>' + escapeH(isAr() ? 'المادة' : 'Course') + '</th>' +
        '<th>' + escapeH(isAr() ? 'الجلسة' : 'Session') + '</th>' +
        '<th>✓</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr' + (r.done ? ' class="sch-print-done"' : '') + '>' +
          '<td>' + escapeH(r.day) + '</td><td>' + escapeH(r.time) + '</td>' +
          '<td>' + escapeH(r.code) + '</td><td>' + escapeH(r.what) + '</td>' +
          '<td>' + (r.done ? '✓' : '☐') + '</td></tr>';
      }).join('') +
      '</tbody></table>';
  }

   
  function openDayPlannerDetail(dateStr) {
    var items = [];
    plannerCache.forEach(function (e) {
      if (e.date !== dateStr || !e.items) return;
      e.items.forEach(function (it) { items.push(it); });
    });
    document.getElementById('pd-title').textContent = (isAr() ? 'خطة اليوم — ' : 'Day plan — ') + dateStr;
    document.getElementById('pd-body').innerHTML = items.length
      ? items.map(sessionCardHtml).join('')
      : '<p class="sch-editor-hint">' + (isAr() ? 'لا جلسات مخطّطة.' : 'No planned sessions.') + '</p>';
    var m = document.getElementById('modal-planner-detail');
    m.dataset.pdate = dateStr; m.dataset.pcourse = '';
    m.style.display = '';
  }

  
  function refreshAfterPlannerWrite() {
    render();
    var m = document.getElementById('modal-planner-detail');
    if (!m || m.style.display === 'none') return;
     
    if (m.dataset.pcourse) openPlannerDetail(m.dataset.pdate, m.dataset.pcourse);
    else if (m.dataset.pdate) openDayPlannerDetail(m.dataset.pdate);
  }
  
  function eligiblePlannerCourses() {
    var courses = (semester && semester.courses) ? semester.courses : [];
    return courses.filter(function (c) { return courseLevel(c.code) != null; }); 
  }
  function fillPlannerCourseSelect(sel, prefill) {
    sel.innerHTML = '';
    eligiblePlannerCourses().forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.code; opt.textContent = c.code;
      if (c.code === prefill) opt.selected = true;
      sel.appendChild(opt);
    });
  }
  function fillPlannerModuleSelect(code, prefillMid) {
    var sel = document.getElementById('ps-module');
    if (!sel) return;
    var level = courseLevel(code);
    sel.innerHTML = '';
    function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
    if (level == null) { opt('', isAr() ? '(لا مستوى)' : '(no level)'); return; }
    var cm = curriculumMaps[level];
    if (cm === undefined) { 
      opt('', isAr() ? '…جارٍ التحميل' : 'Loading…');
      ensureCurriculumMap(level, function () { fillPlannerModuleSelect(code, prefillMid); });
      return;
    }
    var mods = (cm && cm.courses && cm.courses[code] && cm.courses[code].modules) || {};
    var keys = Object.keys(mods).sort();
    if (!keys.length) { opt('', isAr() ? '(لا وحدات)' : '(no modules)'); return; }
    keys.forEach(function (mid) {
      var md = mods[mid] || {}; var n = parseInt(String(mid).replace(/^M/i, ''), 10);
      var title = isAr() ? (md.title || '') : (md.title_en || md.title || '');
      opt(mid, 'M' + (isNaN(n) ? mid : n) + (title ? ' · ' + title : ''));
    });
    if (prefillMid && keys.indexOf(prefillMid) !== -1) sel.value = prefillMid;
  }
  function syncPlannerPlanDefault(code) {
    var level = courseLevel(code);
    if (level == null) return;
    var sel = document.getElementById('ps-plan');
    if (sel) sel.value = plannerActivePlan(level);
  }
   
  function schToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;inset-block-end:1.5rem;inset-inline-start:50%;transform:translateX(-50%);z-index:4000;' +
      'background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:9999px;' +
      'padding:.55rem 1.15rem;font-size:.82rem;font-weight:700;color:var(--text-primary);max-width:90vw;text-align:center;' +
      'box-shadow:0 10px 30px var(--shadow-base)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3600);
  }
   
  var plannerEditTarget = null;
  function setPlannerItemCompleted(level, plan, date, id, val) {
    var L = plannerLoad(level), data = L.data;
    var entries = data.plans[plan] && data.plans[plan].entries;
    if (!entries || !entries[date]) return;
    (entries[date].items || []).forEach(function (i) { if (i.id === id) i.completed = !!val; });
    plannerWrite(level, data);
  }
  function plannerEditCommit(t, nv) {
    var newLevel = plannerTargetLevel(nv.code);
    if (newLevel == null) return { ok: false, reason: 'nolevel' };
    var kOld = 'planner_v2_L' + t.level, kNew = 'planner_v2_L' + newLevel;
    var snapOld = localStorage.getItem(kOld);
    var snapNew = (newLevel !== t.level) ? localStorage.getItem(kNew) : null;
    plannerRemoveItem(t.level, t.plan, t.date, t.id);
    var r = plannerPlaceModule(newLevel, nv.plan, nv.date, nv.code, nv.mid, nv.kind, { time: nv.time, dur: nv.dur });
    if (!r.ok) {
      
      if (snapOld != null) localStorage.setItem(kOld, snapOld); else localStorage.removeItem(kOld);
      if (newLevel !== t.level) { if (snapNew != null) localStorage.setItem(kNew, snapNew); else localStorage.removeItem(kNew); }
      return r;
    }
    if (t.completed) setPlannerItemCompleted(newLevel, nv.plan, nv.date, r.id, true);
    return { ok: true };
  }
  function openPlannerEditModal(target) {
    plannerEditTarget = target;
    var sel = document.getElementById('ps-course');
    fillPlannerCourseSelect(sel, target.code);
    document.getElementById('ps-date').value = target.date || fmtLocalDate(new Date());
    var kEl = document.getElementById('ps-kind'); if (kEl) kEl.value = (target.kind === 'review') ? 'review' : 'study';
    var tIn = document.getElementById('ps-time'); if (tIn) tIn.value = target.time || '';
    var dIn = document.getElementById('ps-dur'); if (dIn) dIn.value = target.dur || '';
    var hint = document.getElementById('ps-hint'); if (hint) hint.style.display = 'none';
    var pSel = document.getElementById('ps-plan');
    if (pSel && target.plan) pSel.value = target.plan; else syncPlannerPlanDefault(target.code);
    fillPlannerModuleSelect(target.code, target.module_id);
    var save = document.getElementById('btn-save-planner');
    if (save) save.textContent = isAr() ? 'حفظ التعديل' : 'Save changes';
    document.getElementById('modal-add-planner').style.display = '';
  }

  function openPlannerModal(prefillCourse, prefillDate) {
    plannerEditTarget = null;   
    var save0 = document.getElementById('btn-save-planner');
    if (save0) save0.textContent = isAr() ? 'إضافة' : 'Add';
    var eligible = eligiblePlannerCourses();
    if (!eligible.length) {
      schToast(isAr()
        ? 'لا مادة في فصلك مرتبطة ببلانر. أضف جلسة روتين أسبوعي بدلاً، أو اربط مادة ببلانر فصلك.'
        : 'No planner-linked course in your semester. Add a weekly routine session, or link a course to your semester plan.');
      return;
    }
    var sel = document.getElementById('ps-course');
    fillPlannerCourseSelect(sel, prefillCourse || eligible[0].code);
    var code = sel.value;
    document.getElementById('ps-date').value = prefillDate || fmtLocalDate(new Date());
    document.getElementById('ps-kind').value = 'study';
     
    var tIn = document.getElementById('ps-time');
    if (tIn) tIn.value = pendingStudyTime || '';
    var dIn = document.getElementById('ps-dur');
    if (dIn) dIn.value = '';
    var hint = document.getElementById('ps-hint'); if (hint) hint.style.display = 'none';
    syncPlannerPlanDefault(code);
    fillPlannerModuleSelect(code);
    document.getElementById('modal-add-planner').style.display = '';
  }
  
  function handlePlannerCheck(cb) {
    var res = togglePlannerItem(cb.dataset.level, cb.dataset.plan, cb.dataset.date, cb.dataset.id);
    if (res === null) return;
    render();  
    var m = document.getElementById('modal-planner-detail');
    if (m.style.display !== 'none' && m.dataset.pcourse) openPlannerDetail(m.dataset.pdate, m.dataset.pcourse);
  }

  
  function renderTodayPanel() {
    var panel = document.getElementById('today-panel');
    if (!panel) return;
    if (currentView === 'overview') { panel.style.display = 'none'; return; }
    var today = new Date();
    var dstr = fmtLocalDate(today);
    var dayName = DAYS_ORDER[today.getDay()];
    var ev = getEventsForWeek(getWeekStartDate(today));
    var lecs = ev.lectures.filter(function (l) { return l.day === dayName; });
    var studyB = ev.studyBlocks.filter(function (s) { return s.day === dayName; });
    var exams = examsOnDate(today);
    var planner = plannerCache.filter(function (e) { return e.date === dstr; });

    var rows = '';
    lecs.forEach(function (l) {
      rows += '<div class="sch-today-row"><span class="sch-today-ic">📘</span><span>' + escapeH(l.course_code) + ' · ' + fmtTime12(l.start_time) + (l.room ? ' · ' + escapeH(l.room) : '') + '</span></div>';
    });
    exams.forEach(function (x) {
      rows += '<div class="sch-today-row"><span class="sch-today-ic">📝</span><span>' + (isAr() ? 'اختبار ' : 'Exam ') + escapeH(x.course_code) + ' · ' + fmtTime12(x.start_time) + '</span></div>';
    });
    studyB.forEach(function (s) {
      rows += '<div class="sch-today-row"><span class="sch-today-ic">' + plannerKindIcon(s.type || 'study') + '</span><span>' + escapeH(s.course_code) + ' · ' + fmtTime12(s.start_time) + '</span></div>';
    });
    
    planner.forEach(function (e) {
      if (!e.items) return;
      e.items.forEach(function (it) {
        var label = (it.kind === 'event') ? (it.label || '') : moduleLabel(it.module_id, it.part, it.total_parts, it.course_code, it.level);
        rows += '<label class="sch-today-row sch-today-check' + (it.completed ? ' done' : '') + '">' +
          '<input type="checkbox" class="sch-pd-check" data-level="' + escapeH(it.level) + '" data-plan="' + escapeH(it.plan) + '" data-date="' + escapeH(it.date) + '" data-id="' + escapeH(it.id) + '"' + (it.completed ? ' checked' : '') + '>' +
          '<span class="sch-today-ic">' + plannerKindIcon(it.kind) + '</span><span>' + escapeH(e.course_code) + ' · ' + escapeH(label) + '</span></label>';
      });
    });

    var titleDate = DAY_NAMES[isAr() ? 'ar' : 'en'][dayName] + ' ' + today.getDate() + ' ' + MONTH_NAMES[isAr() ? 'ar' : 'en'][today.getMonth()];
    document.getElementById('today-title').textContent = (isAr() ? 'مهام اليوم · ' : 'Today · ') + titleDate;
    document.getElementById('today-body').innerHTML = rows || '<div class="sch-today-empty">' + (isAr() ? 'لا مهام اليوم 🎉' : 'Nothing due today 🎉') + '</div>';
    panel.style.display = '';
  }

  
  function renderCourseOverview() {
    var grid = document.getElementById('overview-grid');
    if (!grid || currentView !== 'overview') return;
    var courses = (semester && semester.courses) ? semester.courses : [];
    if (!courses.length) { grid.innerHTML = '<p class="sch-editor-hint">' + (isAr() ? 'لا مواد في فصلك الخاص.' : 'No courses in your semester.') + '</p>'; return; }
    var todayStr = fmtLocalDate(new Date());
    grid.innerHTML = courses.map(function (c) {
      var code = c.code;
      var evs = plannerCache.filter(function (e) { return e.course_code === code; });
      var studyItems = [], reviewItems = [], examDates = [];
      evs.forEach(function (e) {
        if (e.kind === 'study' && e.items) studyItems = studyItems.concat(e.items);
        else if (e.kind === 'review' && e.items) reviewItems = reviewItems.concat(e.items);
        else if (e.kind === 'exam') examDates.push(e.date);
      });
      (schedule.exams || []).forEach(function (x) { if (x.course_code === code) examDates.push(x.date); });
      
      examDates = Object.keys(examDates.reduce(function (acc, d) { if (d) acc[d] = true; return acc; }, {}));
      var all = studyItems.concat(reviewItems);
      var total = all.length, done = all.filter(function (i) { return i.completed; }).length;
      var pct = total ? Math.round(done / total * 100) : 0;
      var nextExam = examDates.filter(function (d) { return d >= todayStr; }).sort()[0];
       
      var sessItems = [];
      evs.forEach(function (e) { if ((e.kind === 'study' || e.kind === 'review' || e.kind === 'event') && e.items) e.items.forEach(function (it) { sessItems.push(it); }); });
      var upcoming = sessItems.filter(function (it) { return it.date >= todayStr; })
        .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); }).slice(0, 3);
      return '<div class="sch-oc-card">' +
        '<div class="sch-oc-head">' + escapeH(code) + '</div>' +
        '<div class="sch-oc-stats"><span>📚 ' + studyItems.length + '</span><span>🔁 ' + reviewItems.length + '</span><span>✅ ' + done + '/' + total + '</span></div>' +
        '<div class="sch-oc-bar"><span style="width:' + pct + '%"></span></div>' +
        (nextExam ? '<div class="sch-oc-line">📝 ' + (isAr() ? 'اختبار قادم: ' : 'Next exam: ') + escapeH(nextExam) + '</div>' : '') +
        (upcoming.length ? '<div class="sch-oc-sessions">' + upcoming.map(ocSessionRow).join('') + '</div>' : '') +
        (total || examDates.length
          ? '<a class="sch-oc-all" href="planner.html?from=schedule">' + (isAr() ? 'كل الجلسات ↗' : 'All sessions ↗') + '</a>'
          : '<div class="sch-oc-line sch-oc-empty">' + (isAr() ? 'لا خطة بعد — خطّط من البلانر' : 'No plan yet') + '</div>') +
      '</div>';
    }).join('');
  }
  function ocSessionRow(it) {
    var n = parseInt(String(it.module_id || '').replace(/^M/i, ''), 10);
    var isEvent = (it.kind === 'event');
    var kind = isEvent ? (it.event_type || 'event') : it.kind;
    var modShort = isEvent ? (it.label || '') : (isNaN(n) ? '' : ('M' + n));
    return '<button class="sch-oc-sess" data-osess="' + escapeH(it.id) + '"' +
      ' style="--course-color:' + escapeH(getCourseColor(it.course_code)) + '">' +
      '<span class="sch-oc-sess-date">' + escapeH(it.date) + '</span>' +
      '<span class="sch-oc-sess-ico">' + plannerKindIcon(kind) + '</span>' +
      '<span class="sch-oc-sess-mod">' + escapeH(modShort) + '</span>' +
      '<span class="sch-oc-sess-st">' + (it.completed ? '✅' : '⏳') + '</span>' +
    '</button>';
  }
   
  function findPlanItemById(id) {
    var found = null;
    plannerCache.forEach(function (e) { (e.items || []).forEach(function (it) { if (it.id === id) found = it; }); });
    return found;
  }
   
   
  function timedPlanBlocks(weekStart, days) {
    var out = [];
    var byDate = {};
    days.forEach(function (d) {
      var dt = new Date(weekStart);
      dt.setDate(dt.getDate() + DAYS_ORDER.indexOf(d));
      byDate[fmtLocalDate(dt)] = d;
    });
    plannerCache.forEach(function (e) {
      var day = byDate[e.date];
      if (!day) return;
      (e.items || []).forEach(function (it) {
        if (!it.time) return;
        out.push({
          id: it.id, course_code: it.course_code, day: day,
          start_time: it.time, duration_minutes: it.duration_minutes || 60,
          modules: it.module_id ? [it.module_id] : [],
          notes: it.notes || '', youtube: it.youtube || '',
          _plan: it   
        });
      });
    });
    return out;
  }

  function laneEntriesFor(dateStr, cache) {
    var out = [];
    cache.filter(function (e) { return e.date === dateStr; }).forEach(function (e) {
      (e.items || []).forEach(function (it) { if (!it.time) out.push(it); });
    });
    return out;
  }

   
  function plannerDotsHtml(dateStr, cache) {
    var items = laneEntriesFor(dateStr, cache);
    if (!items.length) return '';
    var MAX = 4;
    var html = '';
    items.slice(0, MAX).forEach(function (it) {
      var n = parseInt(String(it.module_id || '').replace(/^M/i, ''), 10);
      var modShort = isNaN(n) ? '' : ('M' + n);
      var kindWord = (it.kind === 'event') ? (it.label || (isAr() ? 'حدث' : 'Event'))
                   : (it.kind === 'review') ? (isAr() ? 'مراجعة' : 'Review')
                   : (isAr() ? 'مذاكرة' : 'Study');
      html += '<span class="sch-month-dot sch-month-dot-plan' + (it.completed ? ' is-done' : '') + '"' +
        ' data-pdate="' + escapeH(dateStr) + '" data-pcourse="' + escapeH(it.course_code) + '"' +
        ' style="background:' + escapeH(getCourseColor(it.course_code)) + '"' +
        ' title="' + escapeH(kindWord + ' · ' + it.course_code + (modShort ? ' · ' + modShort : '')) + '"></span>';
    });
    if (items.length > MAX) {
      html += '<button class="sch-lane-more sch-month-more" data-pdate="' + escapeH(dateStr) + '">+' + (items.length - MAX) + '</button>';
    }
    return html;
  }

  function plannerBadgesHtml(dateStr, cache) {
    var items = laneEntriesFor(dateStr, cache);
    if (!items.length) return '';
    var MAX = 3;
    var shown = items.slice(0, MAX);
    var rest = items.length - shown.length;

    var html = '<div class="sch-day-lane">';
    shown.forEach(function (it) {
      var n = parseInt(String(it.module_id || '').replace(/^M/i, ''), 10);
      var modShort = isNaN(n) ? '' : ('M' + n);
      var text = (it.kind === 'event') ? (it.label || '') : modShort;
      html += '<span class="sch-lane-card' + (it.completed ? ' is-done' : '') + '"' +
        ' data-pdate="' + escapeH(dateStr) + '" data-pcourse="' + escapeH(it.course_code) + '"' +
        ' style="--course-color:' + escapeH(getCourseColor(it.course_code)) + '"' +
        ' title="' + escapeH((it.kind === 'review' ? (isAr() ? 'مراجعة' : 'Review') : (isAr() ? 'مذاكرة' : 'Study')) +
                             ' · ' + it.course_code + ' · ' + (it.level === 'HUB' ? (isAr() ? 'فصلي' : 'My semester') : 'L' + it.level)) + '">' +
        '<span class="sch-lane-icon">' + plannerKindIcon(it.kind) + '</span>' +
        '<span class="sch-lane-code">' + escapeH(it.course_code) + '</span>' +
        (text ? '<span class="sch-lane-mod">' + escapeH(text) + '</span>' : '') +
        (it.completed ? '<span class="sch-lane-done">✓</span>' : '') +
      '</span>';
    });
    if (rest > 0) {
      html += '<button class="sch-lane-more" data-pdate="' + escapeH(dateStr) + '">+' + rest + '</button>';
    }
    html += '</div>';
    return html;
  }

  
  function renderDayView() {
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    var dayName = DAYS_ORDER[currentDayDate.getDay()];
    var days = [dayName];
    var startH = 0, endH = 24;
    var slotMin = schedule.settings.slot_duration_minutes;
    var totalSlots = (endH - startH) * (60 / slotMin);

    
    var weekStart = getWeekStartDate(currentDayDate);
    var ev = getEventsForWeek(weekStart);
    var lectures = ev.lectures.filter(function(l) { return l.day === dayName; });
    var studyBlocks = ev.studyBlocks.filter(function(s) { return s.day === dayName; });

    var grid = document.getElementById('timetable');
    grid.style.gridTemplateColumns = '60px 1fr';
    grid.style.gridTemplateRows = '40px repeat(' + totalSlots + ', 40px)';

    var isToday = isSameDay(currentDayDate, new Date());
    var pcache = plannerCache;
    var html = '<div class="sch-time-header"></div>';
    html += '<div class="sch-day-header' + (isToday ? ' today' : '') + '">' + DAY_NAMES[lang][dayName] +
            '<br><span class="sch-day-date">' + currentDayDate.getDate() + '</span>' +
            plannerBadgesHtml(fmtLocalDate(currentDayDate), pcache) + '</div>';

    for (var s = 0; s < totalSlots; s++) {
      var hour = startH + Math.floor(s * slotMin / 60);
      var min = (s * slotMin) % 60;
      var timeStr = String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0');
      if (min === 0) {
        html += '<div class="sch-time-label" style="grid-row:' + (s + 2) + '/span ' + (60/slotMin) + '">' + timeStr + '</div>';
      }
      html += '<div class="sch-cell" data-day="' + dayName + '" data-time="' + timeStr + '" style="grid-column:2; grid-row:' + (s + 2) + '"></div>';
    }
    grid.innerHTML = html;

     
    var allDraw = [];
    lectures.forEach(function (e) { allDraw.push({ ev: e, type: 'lecture' }); });
    studyBlocks.forEach(function (e) { allDraw.push({ ev: e, type: 'study' }); });
    examsOnDate(currentDayDate).forEach(function (e) { allDraw.push({ ev: e, type: 'exam' }); });
    timedPlanBlocks(weekStart, days).forEach(function (e) { allDraw.push({ ev: e, type: 'plan' }); });
    computeOverlapColumns(allDraw);
    allDraw.forEach(function (d) { var el = createEventBlock(d.ev, d.type, days, startH, slotMin, weekStart); if (el) grid.appendChild(el); });

    var label = document.getElementById('week-label');
    var dSwn = studyWeekNumber(currentDayDate);
    var dPrefix = dSwn ? ((lang === 'ar' ? 'الأسبوع ' + dSwn : 'Week ' + dSwn) + ' · ') : '';
    label.textContent = dPrefix + DAY_NAMES[lang][dayName] + ' ' + currentDayDate.getDate() + ' ' +
      MONTH_NAMES[lang][currentDayDate.getMonth()] + ' ' + currentDayDate.getFullYear();

    grid.querySelectorAll('.sch-cell').forEach(function(cell) {
      cell.addEventListener('click', function() { openAddModal(this.dataset.day, this.dataset.time); });
    });
  }

  
  function renderMonthView() {
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    var year = currentMonthDate.getFullYear();
    var month = currentMonthDate.getMonth();

    document.getElementById('month-label').textContent =
      MONTH_NAMES[lang][month] + ' ' + year;

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startDow = firstDay.getDay(); 

    var grid = document.getElementById('month-grid');
    var pcache = plannerCache;
    var html = '';

    DAYS_ORDER.forEach(function(d) {
      html += '<div class="sch-month-day-header">' + DAY_NAMES[lang][d] + '</div>';
    });

    for (var i = 0; i < startDow; i++) {
      html += '<div class="sch-month-cell empty"></div>';
    }

    for (var d = 1; d <= lastDay.getDate(); d++) {
      var date = new Date(year, month, d);
      var dayName = DAYS_ORDER[date.getDay()];
      var isToday = isSameDay(date, new Date());

      var weekStart = getWeekStartDate(date);
      var events = getEventsForWeek(weekStart);
      var dayEvents = events.lectures.filter(function(l) { return l.day === dayName; }).length +
                      events.studyBlocks.filter(function(s) { return s.day === dayName; }).length +
                      examsOnDate(date).length;

      var dstr = fmtLocalDate(date);
      var pev = pcache.filter(function(pe) { return pe.date === dstr; });
      html += '<div class="sch-month-cell' + (isToday ? ' today' : '') + (pev.length ? ' has-planner' : '') + '" data-date="' + date.toISOString() + '">';
      html += '<span class="sch-month-day-num">' + d + '</span>';
       
      var dayTasks = tasksOnDate(dstr);
      
      var planDots = plannerDotsHtml(dstr, pcache);
      if (dayEvents > 0 || dayTasks.length || planDots) {
        html += '<div class="sch-month-dots">';
        for (var e = 0; e < Math.min(dayEvents, 4); e++) {
          html += '<span class="sch-month-dot" style="background:#a78bfa"></span>';
        }
        for (var k = 0; k < Math.min(dayTasks.length, 3); k++) {
          html += '<span class="sch-month-dot sch-month-dot-task" style="background:' +
                  (dayTasks[k].late ? 'var(--st-danger)' : 'var(--st-warn)') + '" title="' +
                  escapeH(dayTasks[k].title) + '"></span>';
        }
        html += planDots;
        html += '</div>';
      }
      html += '</div>';
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.sch-month-cell[data-date]').forEach(function(cell) {
      cell.addEventListener('click', function(e) {
        
        if (e.target.closest && e.target.closest('.sch-planner-chip')) return;
        var date = new Date(this.dataset.date);
        currentWeekStart = getWeekStartDate(date);
        switchView('week');
      });
    });
  }

  
   
  function _pBrand(px) {
    var s = px || 15;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;flex-shrink:0">' +
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M50 88 V64" stroke="#10b981" stroke-width="8"/>' +
      '<path d="M50 64 L22 42 M50 64 L78 42 M50 64 V34" stroke="#a78bfa" stroke-width="7"/></g>' +
      '<circle cx="50" cy="64" r="12" fill="#a78bfa"/><circle cx="22" cy="42" r="9" fill="#a78bfa"/>' +
      '<circle cx="78" cy="42" r="9" fill="#a78bfa"/><circle cx="50" cy="26" r="14" fill="#10b981"/></svg>';
  }
  function _pTint(hex, a) {
    if (!hex || hex[0] !== '#') return 'rgba(148,163,184,' + a + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return 'rgba(' + parseInt(h.slice(0,2),16) + ',' + parseInt(h.slice(2,4),16) + ',' + parseInt(h.slice(4,6),16) + ',' + a + ')';
  }
   
  function _pDayItems(dateObj) {
    var ds = fmtLocalDate(dateObj);
    var dayName = DAYS_ORDER[dateObj.getDay()];
    var wkStart = getWeekStartDate(dateObj);
    var ev = getEventsForWeek(wkStart);
    var out = [];
    ev.lectures.filter(function (l) { return l.day === dayName; }).forEach(function (l) {
      out.push({ t: l.start_time || '', kind: 'lecture', code: l.course_code, room: l.room || '',
                 label: isAr() ? 'محاضرة' : 'Lecture', end: l.end_time || '' });
    });
    ev.studyBlocks.filter(function (s) { return s.day === dayName; }).forEach(function (s) {
      out.push({ t: s.start_time || '', kind: 'study', code: s.course_code, room: '',
                 label: isAr() ? 'مذاكرة' : 'Study', end: s.end_time || '' });
    });
    examsOnDate(dateObj).forEach(function (x) {
      out.push({ t: x.start_time || '', kind: 'exam', code: x.course_code, room: x.room || '',
                 label: isAr() ? 'اختبار' : 'Exam', end: x.end_time || '' });
    });
    laneEntriesFor(ds, plannerCache).forEach(function (it) {
      var n = parseInt(String(it.module_id || '').replace(/^M/i, ''), 10);
      out.push({ t: it.time || '', kind: 'plan', code: it.course_code, room: '',
                 label: (it.kind === 'review' ? (isAr() ? 'مراجعة' : 'Review') : (isAr() ? 'جلسة' : 'Session')) +
                        (isNaN(n) ? '' : ' M' + n), end: '' });
    });
    out.sort(function (a, b) { return String(a.t || '99').localeCompare(String(b.t || '99')); });
    return out;
  }
  function _pCourses() {
    var seen = {}, list = [];
    (schedule.lectures || []).forEach(function (l) { if (l.course_code) seen[l.course_code] = 1; });
    (schedule.exams || []).forEach(function (x) { if (x.course_code) seen[x.course_code] = 1; });
    (schedule.study_blocks || []).forEach(function (s) { if (s.course_code) seen[s.course_code] = 1; });
    (plannerCache || []).forEach(function (p) { if (p.course_code) seen[p.course_code] = 1; });
    Object.keys(seen).forEach(function (c) { list.push({ code: c, color: getCourseColor(c) }); });
    return list;
  }
  function _pStyles(landscape) {
    var ar = isAr();
    return '@page{size:A4 ' + (landscape ? 'landscape' : 'portrait') + ';margin:9mm 10mm}' +
    '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{font-family:' + (ar ? "'Tajawal','Cairo',sans-serif" : "'Plus Jakarta Sans',sans-serif") + ';' +
      'direction:' + (ar ? 'rtl' : 'ltr') + ';color:#1e293b;background:#fff;font-size:9pt;line-height:1.4}' +
    '.pg-head{position:relative;text-align:center;padding-bottom:7pt;margin-bottom:9pt;border-bottom:2px solid #e2e8f0}' +
    '.pg-brand{position:absolute;top:0;inset-inline-end:0;display:inline-flex;align-items:center;gap:4px;' +
      'font-size:8pt;font-weight:800;color:#0f766e;opacity:.9}' +
    '.pg-title{font-size:19pt;font-weight:900;color:#0f172a;line-height:1.1}' +
    '.pg-sub{font-size:9.5pt;font-weight:600;color:#64748b;margin-top:2pt}' +
    '.legend{display:flex;flex-wrap:wrap;gap:5pt;justify-content:center;margin-bottom:9pt}' +
    '.lg{display:inline-flex;align-items:center;gap:4px;padding:2pt 7pt;border-radius:999px;' +
      'font-size:7.5pt;font-weight:800;border:1px solid #e2e8f0}' +
    '.lg i{width:7px;height:7px;border-radius:50%;display:inline-block}' +
    '.cal{width:100%;border-collapse:separate;border-spacing:3pt;table-layout:fixed}' +
    '.cal th{font-size:8pt;font-weight:800;color:#475569;padding:3pt 0;text-align:center;' +
      'background:#f8fafc;border-radius:5pt}' +
    '.cal td{vertical-align:top;border:1px solid #e8edf3;border-radius:6pt;padding:3pt;height:78pt;background:#fff}' +
    '.cal td.off{background:#fafbfc}' +
    '.cal td.out{background:#fcfcfd;opacity:.5}' +
    '.dnum{font-size:8.5pt;font-weight:800;color:#0f172a;display:block;margin-bottom:2pt}' +
    '.dnum .mo{font-size:6.5pt;font-weight:700;color:#94a3b8}' +
    '.chip{display:block;border-radius:4pt;padding:1.5pt 4pt;margin-bottom:2pt;font-size:6.8pt;' +
      'font-weight:700;line-height:1.25;overflow:hidden}' +
    '.chip b{font-weight:900}' +
    '.chip .tm{font-size:6pt;opacity:.75;font-weight:700}' +
    '.chip.exam{outline:1px solid rgba(220,38,38,.35)}' +
    '.wk{width:100%;border-collapse:separate;border-spacing:4pt}' +
    '.wk td{vertical-align:top;border:1px solid #e8edf3;border-radius:7pt;padding:5pt;background:#fff}' +
    '.wk .dh{font-size:9pt;font-weight:900;color:#0f172a;margin-bottom:3pt;padding-bottom:2pt;border-bottom:1px solid #eef2f7}' +
    '.wk .dh span{font-size:7pt;font-weight:700;color:#94a3b8}' +
    '.none{font-size:7pt;color:#cbd5e1;font-weight:700;text-align:center;padding:6pt 0}' +
    '.ftr{margin-top:9pt;padding-top:5pt;border-top:1px solid #e2e8f0;text-align:center;' +
      'font-size:7.5pt;color:#94a3b8;font-weight:700}';
  }
  function _pChip(it) {
    var col = getCourseColor(it.code);
    var t = it.t ? '<span class="tm">' + escapeH(fmtTime12(it.t)) + '</span> ' : '';
    return '<span class="chip' + (it.kind === 'exam' ? ' exam' : '') + '" style="background:' + _pTint(col, 0.13) +
      ';color:' + col + '">' + t + '<b>' + escapeH(getCourseShortName(it.code)) + '</b> · ' + escapeH(it.label) + '</span>';
  }

  function _pOpen(title, landscape, bodyHtml) {
    var ar = isAr();
    var win = window.open('', '_blank');
    if (!win) { alert(ar ? 'مانع النوافذ منع الطباعة' : 'Popup blocked'); return; }
    win.document.write('<!DOCTYPE html><html dir="' + (ar ? 'rtl' : 'ltr') + '" lang="' + (ar ? 'ar' : 'en') + '"><head>' +
      '<meta charset="UTF-8"><title>' + escapeH(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' + _pStyles(landscape) + '</style></head><body>' + bodyHtml +
      '<script>if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(function(){window.print();},180);});}' +
      'else{setTimeout(function(){window.print();},700);}<\/script></body></html>');
    win.document.close();
  }
  function _pHeader(title, sub) {
    var ar = isAr();
    return '<div class="pg-head">' +
      '<div class="pg-brand">' + _pBrand(14) + '<span>' + (ar ? 'الحديقة الرقمية' : 'Digital Garden') + '</span></div>' +
      '<div class="pg-title">' + escapeH(title) + '</div>' +
      '<div class="pg-sub">' + escapeH(sub) + '</div></div>';
  }
  function _pLegend() {
    var cs = _pCourses();
    if (!cs.length) return '';
    return '<div class="legend">' + cs.map(function (c) {
      return '<span class="lg" style="background:' + _pTint(c.color, 0.1) + ';color:' + c.color + '">' +
        '<i style="background:' + c.color + '"></i>' + escapeH(getCourseShortName(c.code)) + '</span>';
    }).join('') + '</div>';
  }
  function _pFooter() {
    var ar = isAr();
    return '<div class="ftr">' + (ar ? 'الحديقة الرقمية' : 'Digital Garden') + ' · ' +
      (ar ? 'جدولي الدراسي' : 'My Study Schedule') + ' · ' +
      new Date().toLocaleDateString(ar ? 'ar' : 'en') + '</div>';
  }

   
  function printScheduleWeek() {
    var ar = isAr(), lang = ar ? 'ar' : 'en';
    var ws = new Date(currentWeekStart);
    var days = [];
    for (var i = 0; i < 7; i++) { var d = new Date(ws); d.setDate(d.getDate() + i); days.push(d); }
    var active = schedule.settings.active_days || [];
    var shown = days.filter(function (d) {
      return active.indexOf(DAYS_ORDER[d.getDay()]) !== -1 || _pDayItems(d).length;
    });
    if (!shown.length) shown = days;

    var we = new Date(ws); we.setDate(we.getDate() + 6);
    var sub = dom2(ws) + ' ' + MONTH_NAMES[lang][ws.getMonth()] + ' – ' +
              dom2(we) + ' ' + MONTH_NAMES[lang][we.getMonth()] + ' ' + we.getFullYear();

    var cells = shown.map(function (d) {
      var items = _pDayItems(d);
      return '<td><div class="dh">' + DAY_NAMES[lang][DAYS_ORDER[d.getDay()]] +
        ' <span>' + dom2(d) + '</span></div>' +
        (items.length ? items.map(_pChip).join('') : '<div class="none">—</div>') + '</td>';
    });
    
    var per = shown.length > 4 ? Math.ceil(shown.length / 2) : shown.length;
    var rows = '';
    for (var r = 0; r < cells.length; r += per) {
      rows += '<tr>' + cells.slice(r, r + per).join('') + '</tr>';
    }
    _pOpen(ar ? 'الجدول الأسبوعي' : 'Weekly Schedule', true,
      _pHeader(ar ? 'الجدول الأسبوعي' : 'Weekly Schedule', sub) + _pLegend() +
      '<table class="wk">' + rows + '</table>' + _pFooter());
  }

   
  function printScheduleMonth() {
    var ar = isAr(), lang = ar ? 'ar' : 'en';
    var md = new Date(currentMonthDate);
    var first = new Date(md.getFullYear(), md.getMonth(), 1);
    var last = new Date(md.getFullYear(), md.getMonth() + 1, 0);
    var gridStart = new Date(first); gridStart.setDate(1 - first.getDay());
    var total = Math.ceil((last.getDate() + first.getDay()) / 7) * 7;
    var active = schedule.settings.active_days || [];

    var head = '<tr>' + DAYS_ORDER.map(function (dn) {
      return '<th>' + DAY_NAMES[lang][dn] + '</th>';
    }).join('') + '</tr>';

    var body = '', cur = new Date(gridStart);
    for (var i = 0; i < total; i++) {
      if (i % 7 === 0) body += '<tr>';
      var inMonth = cur.getMonth() === md.getMonth();
      var isOff = active.indexOf(DAYS_ORDER[cur.getDay()]) === -1;
      var items = inMonth ? _pDayItems(cur) : [];
      body += '<td class="' + (!inMonth ? 'out' : (isOff ? 'off' : '')) + '">' +
        '<span class="dnum">' + cur.getDate() +
        (cur.getDate() === 1 ? ' <span class="mo">' + MONTH_NAMES[lang][cur.getMonth()].slice(0, 3) + '</span>' : '') +
        '</span>' + items.map(_pChip).join('') + '</td>';
      if (i % 7 === 6) body += '</tr>';
      cur.setDate(cur.getDate() + 1);
    }
    var sub = MONTH_NAMES[lang][md.getMonth()] + ' ' + md.getFullYear();
    _pOpen((ar ? 'التقويم الشهري · ' : 'Monthly Calendar · ') + sub, false,
      _pHeader(ar ? 'التقويم الشهري' : 'Monthly Calendar', sub) + _pLegend() +
      '<table class="cal">' + head + body + '</table>' + _pFooter());
  }
  function dom2(d) { return d.getDate(); }

   
  function runSchedulePrint() {
    if (!schedule) return;
    if (currentView === 'month') printScheduleMonth();
    else printScheduleWeek();
  }

  function getCourseColor(code) {
    if (!catalog || !catalog.courses) return '#a78bfa';
    var c = catalog.courses.find(function(c) { return c.code === code; });
    return c ? c.brand_color : '#a78bfa';
  }
  function getCourseShortName(code) {
    if (!code) return '';
    if (String(code).indexOf('__CUSTOM_') === 0) {
      if (!semester) return code;
      var sc = semester.courses.find(function(c) { return c.code === code; });
      var lang = document.documentElement.getAttribute('lang') || 'ar';
      return sc ? (lang === 'ar' ? sc.name_ar : sc.name_en) : code;
    }
    return code; 
  }
  function isSameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function save() { schedule.updated_at = new Date().toISOString(); localStorage.setItem(LS_KEY, JSON.stringify(schedule)); }

  
  function addLecture(data) {
    if (!data.course_code) return;
    schedule.lectures.push({
      id: 'lec_' + Date.now(),
      course_code: data.course_code,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      room: data.room || '',
      type: data.type || 'lecture',
      recurring: true,
      color: getCourseColor(data.course_code)
    });
    save();
  }

  function addStudyBlock(data) {
    if (!data.course_code) return;
    schedule.study_blocks.push({
      id: 'sb_' + Date.now(),
      course_code: data.course_code,
      day: data.day,
      start_time: data.start_time,
      duration_minutes: data.duration || 60,
      modules: [],
      type: data.type || 'study',
      week_id: data.recurring ? null : (data._week_id || getWeekId(currentWeekStart)),
      notes: data.notes || '',
      youtube: data.youtube || ''
    });
    save();
  }

  function addExam(data) {
    if (!data.course_code || !data.date) return;
    schedule.exams.push({
      id: 'exam_' + Date.now(),
      course_code: data.course_code,
      date: data.date,
      start_time: data.start_time || '15:00',
      end_time: data.end_time || '',
      exam_type: data.exam_type || 'exam',
      room: data.room || '',
      notes: data.notes || ''
    });
    save();
  }

  
  function hideDeleteButtons() {
    var dl = document.getElementById('del-lecture'); if (dl) dl.style.display = 'none';
    var ds = document.getElementById('del-study'); if (ds) ds.style.display = 'none';
    var de = document.getElementById('del-exam'); if (de) de.style.display = 'none';
    
    var scope = document.getElementById('lec-del-scope'); if (scope) scope.style.display = 'none';
    var mainActions = document.getElementById('lec-main-actions'); if (mainActions) mainActions.style.display = '';
  }

  
  function openEditEvent(type, ev) {
    var refDate = (currentView === 'day') ? getWeekStartDate(currentDayDate) : currentWeekStart;
    editingEvent = { type: type, id: ev.id, weekId: getWeekId(refDate) };
    var courses = semester ? semester.courses : [];
    var allDays = schedule.settings.active_days.slice();
    var weekId = getWeekId(currentWeekStart);
    var override = schedule.week_overrides[weekId] || {};
    (override.extra_days || []).forEach(function(d) { if (allDays.indexOf(d) === -1) allDays.push(d); });

    if (type === 'lecture') {
      populateCourseSelect('lec-course', courses);
      populateDaySelect('lec-day', allDays, ev.day);
      document.getElementById('lec-course').value = ev.course_code;
      TP.set('lec-start', ev.start_time || '15:00');
      TP.set('lec-end', ev.end_time || '16:30');
      document.getElementById('lec-room').value = ev.room || '';
      document.getElementById('lec-type').value = ev.type || 'lecture';
      document.getElementById('del-lecture').style.display = '';
      document.getElementById('modal-add-lecture').style.display = '';
    } else if (type === 'exam') {
      populateCourseSelect('exam-course', courses);
      var exam = (schedule.exams || []).find(function(x) { return x.id === ev.id; }) || ev;
      document.getElementById('exam-course').value = exam.course_code;
      document.getElementById('exam-date').value = exam.date || '';
      TP.set('exam-start', exam.start_time || '15:00');
      TP.set('exam-end', exam.end_time || '16:30');
      document.getElementById('exam-type').value = exam.exam_type || 'exam';
      document.getElementById('exam-room').value = exam.room || '';
      document.getElementById('exam-notes').value = exam.notes || '';
      document.getElementById('del-exam').style.display = '';
      document.getElementById('modal-add-exam').style.display = '';
    } else {
      populateCourseSelect('study-course', courses);
      populateDaySelect('study-day', allDays, ev.day);
      document.getElementById('study-course').value = ev.course_code;
      TP.set('study-start', ev.start_time || '16:00');
      document.getElementById('study-duration').value = ev.duration_minutes || 60;
      document.getElementById('study-type').value = ev.type || 'study';
      document.getElementById('study-notes').value = ev.notes || '';
      document.getElementById('study-youtube').value = ev.youtube || '';
      document.getElementById('study-recurring').checked = (ev.week_id === null || ev.week_id === undefined);
      var wd = document.getElementById('study-week-date');
      if (wd) wd.value = (ev.week_id && ev.week_id !== null) ? fmtLocalDate(currentDayDate || currentWeekStart) : fmtLocalDate(currentWeekStart);
      toggleSingleWeekField();
      document.getElementById('del-study').style.display = '';
      document.getElementById('modal-add-study').style.display = '';
    }
  }
   
  function toggleSingleWeekField() {
    var wrap = document.getElementById('study-single-week');
    var rec = document.getElementById('study-recurring');
    if (!wrap || !rec) return;
    wrap.style.display = rec.checked ? 'none' : '';
    var dInp = document.getElementById('study-week-date');
    if (dInp && !dInp.value) dInp.value = fmtLocalDate(currentWeekStart);
  }

  function openAddModal(day, time) {
    editingEvent = null;
    hideDeleteButtons();
    var courses = semester ? semester.courses : [];
    populateCourseSelect('lec-course', courses);
    populateCourseSelect('study-course', courses);
    populateCourseSelect('exam-course', courses);
    
    document.getElementById('study-notes').value = '';
    document.getElementById('study-youtube').value = '';
    document.getElementById('exam-notes').value = '';
    document.getElementById('exam-room').value = '';

    var allDays = schedule.settings.active_days.slice();
    var weekId = getWeekId(currentWeekStart);
    var override = schedule.week_overrides[weekId] || {};
    (override.extra_days || []).forEach(function(d) { if (allDays.indexOf(d)===-1) allDays.push(d); });
    populateDaySelect('lec-day', allDays, day);
    populateDaySelect('study-day', allDays, day);

    
    var examDate;
    if (currentView === 'day') examDate = currentDayDate;
    else if (day) { examDate = new Date(currentWeekStart); examDate.setDate(examDate.getDate() + DAYS_ORDER.indexOf(day)); }
    else examDate = new Date();
    document.getElementById('exam-date').value = fmtLocalDate(examDate);

    if (time) {
      TP.set('lec-start', time);
      TP.set('study-start', time);
      TP.set('exam-start', time);
      var parts = time.split(':');
      var endMin = parseInt(parts[0])*60 + parseInt(parts[1]) + 90;
      var endStr = String(Math.floor(endMin/60)).padStart(2,'0') + ':' + String(endMin%60).padStart(2,'0');
      TP.set('lec-end', endStr);
      TP.set('exam-end', endStr);
    }

     
    pendingStudyDate = null;
    pendingStudyTime = time || null;
    if (currentView === 'day' && currentDayDate) pendingStudyDate = fmtLocalDate(currentDayDate);
    else if (day) {
      var pd = new Date(currentWeekStart);
      pd.setDate(pd.getDate() + DAYS_ORDER.indexOf(day));
      pendingStudyDate = fmtLocalDate(pd);
    }

    document.getElementById('modal-choose-type').style.display = '';
  }

  function populateCourseSelect(selectId, courses) {
    var sel = document.getElementById(selectId);
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    sel.innerHTML = '';
    courses.forEach(function(c) {
      var name = c.custom ? (lang==='ar' ? c.name_ar : c.name_en) : c.code;
      
      if (c.completed) name = '✓ ' + name + (lang==='ar' ? ' · أُتمّت' : ' · done');
      var opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  }

  function populateDaySelect(selectId, days, selected) {
    var sel = document.getElementById(selectId);
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    sel.innerHTML = '';
    days.sort(function(a,b) { return DAYS_ORDER.indexOf(a)-DAYS_ORDER.indexOf(b); });
    days.forEach(function(d) {
      var opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_NAMES[lang][d];
      if (d === selected) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  
  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.sch-view-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.view === view);
    });
    var showGrid = (view === 'week' || view === 'day');
    document.getElementById('timetable-wrapper').style.display = showGrid ? '' : 'none';
    document.getElementById('month-wrapper').style.display = view === 'month' ? '' : 'none';
    document.getElementById('week-nav').style.display = showGrid ? '' : 'none';
    var ov = document.getElementById('overview-wrapper');
    if (ov) ov.style.display = view === 'overview' ? '' : 'none';
    render();
  }

   
  function setPlanFilterAndRender(f) {
    planFilter = f;
    var sel = document.getElementById('plan-filter'); if (sel) sel.value = f;
    try { sessionStorage.setItem('sch_plan_filter', f); } catch (e) {}
    render();
  }
  function updatePlanEmptyBar(show) {
    var bar = document.getElementById('plan-empty-bar');
    if (!bar) return;
    if (!show) { bar.style.display = 'none'; return; }
    var ar = isAr();
    var label = planFilter === 'final' ? (ar ? 'خطة الفاينل' : 'The Final plan')
              : planFilter === 'midterm' ? (ar ? 'خطة الميد' : 'The Midterm plan')
              : (ar ? 'الخطة النشطة' : 'The active plan');
    var txt = document.getElementById('plan-empty-text');
    if (txt) txt.textContent = (ar ? (label + ' فارغة — لا جلسات هنا.') : (label + ' is empty — no sessions here.'));
    var acts = document.getElementById('plan-empty-actions');
    if (acts) {
      acts.innerHTML = '';
      var btns = [];
      btns.push({ f: 'all', label: ar ? 'عرض الكل' : 'Show all' });
      
      if (planFilter !== 'midterm') btns.push({ f: 'midterm', label: ar ? 'الميد' : 'Midterm' });
      if (planFilter !== 'final') btns.push({ f: 'final', label: ar ? 'الفاينل' : 'Final' });
      btns.forEach(function (b) {
        var el = document.createElement('button');
        el.className = 'sch-btn sch-btn-secondary sch-btn-xs';
        el.textContent = b.label;
        el.addEventListener('click', function () { setPlanFilterAndRender(b.f); });
        acts.appendChild(el);
      });
      var plan = document.createElement('a');
      plan.className = 'sch-btn sch-btn-secondary sch-btn-xs';
      plan.href = 'planner.html?from=schedule';
      plan.textContent = (ar ? 'خطّط لها ↗' : 'Plan it ↗');
      acts.appendChild(plan);
    }
    bar.style.display = '';
  }

  
  function render() {
    updateTextContent();
    plannerCache = getPlannerEvents();   
     
    var hasAnyPlan = (planFilter === 'all') ? (plannerCache.length > 0) : (getPlannerEvents('all').length > 0);
    var pfWrap = document.getElementById('plan-filter-wrap');
    if (pfWrap) pfWrap.style.display = hasAnyPlan ? '' : 'none';
    
    updatePlanEmptyBar(hasAnyPlan && plannerCache.length === 0);
    
    var lvlSeen = {};
    plannerCache.forEach(function (e) {
      if (e.level == null) return;
      var ml = mapLevelFor(e.course_code, e.level);   
      if (ml != null && !lvlSeen[ml]) { lvlSeen[ml] = true; ensureCurriculumMap(ml); }
    });
    if (currentView === 'week') renderWeekView();
    else if (currentView === 'day') renderDayView();
    else if (currentView === 'month') renderMonthView();
    updateFocusBanner();
    renderTodayPanel();
    renderCourseOverview();
  }

  
  function updateFocusBanner() {
    var banner = document.getElementById('focus-banner');
    if (!banner) return;
    if (currentView === 'month') { banner.style.display = 'none'; return; }
    var weekStart = (currentView === 'day') ? getWeekStartDate(currentDayDate) : currentWeekStart;
    var ev = getEventsForWeek(weekStart);
    if (!ev.focus || !ev.focus.active) { banner.style.display = 'none'; return; }
    var ar = isAr();
    var kindAr = ev.focus.kind === 'midterm' ? 'الميدتيرم' : 'الفاينل';
    var kindEn = ev.focus.kind === 'midterm' ? 'Midterm' : 'Final';
    var txt = document.getElementById('focus-banner-text');
    var btn = document.getElementById('btn-toggle-lectures');
    if (ev.revealed) {
      txt.textContent = ar ? ('🎯 أسبوع تركيز (' + kindAr + ') — المحاضرات ظاهرة') : ('🎯 Focus week (' + kindEn + ') — lectures shown');
      btn.textContent = ar ? 'إخفاء المحاضرات' : 'Hide lectures';
    } else {
      txt.textContent = ar ? ('🎯 أسبوع تركيز (' + kindAr + ') — المحاضرات المتكررة مخفية للتركيز على الاختبارات') : ('🎯 Focus week (' + kindEn + ') — recurring lectures hidden');
      btn.textContent = ar ? 'إظهار المحاضرات' : 'Show lectures';
    }
    banner.style.display = '';
    btn.onclick = function () {
      var wid = getWeekId(weekStart);
      var ov = schedule.week_overrides[wid] || (schedule.week_overrides[wid] = {});
      ov.show_lectures = !ov.show_lectures;
      save();
      render();
    };
  }

  function updateTextContent() {
    var isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
    document.querySelectorAll('[data-ar]').forEach(function(el) {
      var text = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if (text) {
        if (el.tagName === 'BUTTON' || el.tagName === 'SPAN' || el.tagName === 'LABEL' || el.tagName === 'H3' || el.tagName === 'DIV') {
          el.textContent = text;
        }
      }
    });
     
  }

  
  function bindEvents() {
    document.querySelectorAll('.sch-view-btn[data-view]').forEach(function(b) {
      b.addEventListener('click', function() { switchView(this.dataset.view); });
    });

    document.getElementById('btn-prev-week').addEventListener('click', function() {
      if (currentView === 'day') currentDayDate.setDate(currentDayDate.getDate() - 1);
      else currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      render();
    });
    document.getElementById('btn-next-week').addEventListener('click', function() {
      if (currentView === 'day') currentDayDate.setDate(currentDayDate.getDate() + 1);
      else currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      render();
    });
    document.getElementById('btn-today').addEventListener('click', function() {
      currentWeekStart = getWeekStartDate(new Date());
      currentDayDate = new Date();
      render();
    });

    document.getElementById('btn-prev-month').addEventListener('click', function() {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      renderMonthView();
    });
    document.getElementById('btn-next-month').addEventListener('click', function() {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      renderMonthView();
    });

    document.getElementById('btn-add-event').addEventListener('click', function() {
      openAddModal(null, null);
    });

     
    var pf = document.getElementById('plan-filter');
    if (pf) {
      pf.value = planFilter;
      pf.addEventListener('change', function () {
        planFilter = this.value;
        try { sessionStorage.setItem('sch_plan_filter', planFilter); } catch (e) {}
        render();
      });
    }

    
    document.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('.sch-planner-chip[data-pcourse]');
      if (chip) { e.stopPropagation(); openPlannerDetail(chip.getAttribute('data-pdate'), chip.getAttribute('data-pcourse')); return; }
      
      var lane = e.target.closest && e.target.closest('.sch-lane-card[data-pcourse]');
      if (lane) { e.stopPropagation(); openPlannerDetail(lane.getAttribute('data-pdate'), lane.getAttribute('data-pcourse')); return; }
      
      var mdot = e.target.closest && e.target.closest('.sch-month-dot-plan[data-pcourse]');
      if (mdot) { e.stopPropagation(); openPlannerDetail(mdot.getAttribute('data-pdate'), mdot.getAttribute('data-pcourse')); return; }
      
      var more = e.target.closest && e.target.closest('.sch-lane-more[data-pdate]');
      if (more) { e.stopPropagation(); openDayPlannerDetail(more.getAttribute('data-pdate')); return; }
      
      var oc = e.target.closest && e.target.closest('.sch-oc-sess[data-osess]');
      if (oc) { e.stopPropagation(); var it = findPlanItemById(oc.getAttribute('data-osess')); if (it) openSessionCard('plan', { _plan: it }); return; }
    });
    document.getElementById('btn-close-pd').addEventListener('click', function () { closeModal('modal-planner-detail'); });
    document.getElementById('btn-pd-close2').addEventListener('click', function () { closeModal('modal-planner-detail'); });
     
    ['pd-body', 'today-body'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.addEventListener('change', function (e) {
        var cb = e.target.closest && e.target.closest('input.sch-pd-check');
        if (cb) handlePlannerCheck(cb);
      });
      box.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button.sch-pd-check');
        if (b) { e.preventDefault(); handlePlannerCheck(b); }
      });
    });
    
    var pdBody = document.getElementById('pd-body');
    if (pdBody) pdBody.addEventListener('click', function (e) {
      var t = e.target;
      var addB = t.closest && t.closest('.sch-pd-add');
      if (addB) { openPlannerModal(addB.getAttribute('data-course'), addB.getAttribute('data-date')); return; }
      var wrap = t.closest && t.closest('.sch-card');
      if (!wrap) return;
      var lv = wrap.getAttribute('data-level'), pl = wrap.getAttribute('data-plan'), dt = wrap.getAttribute('data-date'), id = wrap.getAttribute('data-id');

       
      if (wrap.getAttribute('data-routine')) {
        if (t.closest('.sch-card-edit-block')) {
          var sb = (schedule.study_blocks || []).find(function (x) { return x.id === id; });
          if (sb) { closeModal('modal-planner-detail'); openEditEvent('study', sb); }
        }
        return;
      }

      
      if (t.closest('.sch-card-time-btn')) {
        var te = wrap.querySelector('.sch-card-timeedit');
        if (te) te.style.display = (te.style.display === 'none' ? '' : 'none');
        return;
      }
      if (t.closest('.sch-card-time-ok')) {
        var ti = wrap.querySelector('.sch-card-time-in');
        var du = wrap.querySelector('.sch-card-dur-in');
        plannerSetTime(lv, pl, dt, id, ti && ti.value, du && du.value);
        refreshAfterPlannerWrite(); return;
      }
      if (t.closest('.sch-card-time-clear')) {
        plannerSetTime(lv, pl, dt, id, null, null);
        refreshAfterPlannerWrite(); return;
      }

      if (t.closest('.sch-pd-edit')) {
        var eit = findPlanItemById(id) || {};
        openPlannerEditModal({
          level: lv, plan: pl, date: dt, id: id, completed: wrap.classList.contains('is-done'),
          code: eit.course_code || wrap.querySelector('.sch-card-code') && wrap.querySelector('.sch-card-code').textContent || '',
          module_id: eit.module_id, kind: eit.kind, time: eit.time, dur: eit.duration_minutes
        });
        return;
      }
      if (t.closest('.sch-pd-del')) {
        if (!confirm(isAr() ? 'حذف هذه الجلسة؟' : 'Delete this session?')) return;
        plannerRemoveItem(lv, pl, dt, id); refreshAfterPlannerWrite(); return;
      }
      if (t.closest('.sch-pd-move')) {
        var ed = wrap.querySelector('.sch-pd-moveedit'); if (ed) ed.style.display = (ed.style.display === 'none' ? '' : 'none'); return;
      }
      if (t.closest('.sch-pd-movecancel')) {
        var ed2 = wrap.querySelector('.sch-pd-moveedit'); if (ed2) ed2.style.display = 'none'; return;
      }
      if (t.closest('.sch-pd-moveok')) {
        var nd = wrap.querySelector('.sch-pd-movedate'); var newDate = nd && nd.value;
        if (!newDate || newDate === dt) { var ed3 = wrap.querySelector('.sch-pd-moveedit'); if (ed3) ed3.style.display = 'none'; return; }
        plannerMoveItem(lv, pl, dt, newDate, id); refreshAfterPlannerWrite(); return;
      }
    });
    
    var psCourse = document.getElementById('ps-course');
    if (psCourse) psCourse.addEventListener('change', function () {
      syncPlannerPlanDefault(this.value);
      fillPlannerModuleSelect(this.value);
    });
    var btnSavePlanner = document.getElementById('btn-save-planner');
    if (btnSavePlanner) btnSavePlanner.addEventListener('click', function () {
      var code = document.getElementById('ps-course').value;
      var plan = document.getElementById('ps-plan').value;
      var date = document.getElementById('ps-date').value;
      var mid = document.getElementById('ps-module').value;
      var kind = document.getElementById('ps-kind').value;
      var tEl = document.getElementById('ps-time');
      var dEl = document.getElementById('ps-dur');
      var hint = document.getElementById('ps-hint');
      var level = plannerTargetLevel(code);        
      function fail(msg) { if (hint) { hint.textContent = msg; hint.style.display = ''; } }
      if (level == null) return fail(isAr() ? 'هذه المادة غير مرتبطة ببلانر.' : 'Course not linked to a planner.');
      if (!date) return fail(isAr() ? 'اختر تاريخاً.' : 'Pick a date.');
      if (!mid) return fail(isAr() ? 'اختر وحدة.' : 'Pick a module.');
      
      if (plannerEditTarget) {
        var er = plannerEditCommit(plannerEditTarget, { code: code, plan: plan, date: date, mid: mid, kind: kind, time: tEl && tEl.value, dur: dEl && dEl.value });
        if (!er.ok) return fail(er.reason === 'dup'
          ? (isAr() ? 'هذه الوحدة مضافة كمذاكرة في نفس اليوم. جرّب «مراجعة» أو يوماً آخر.' : 'This module already has a study session that day. Try "Review" or another day.')
          : (isAr() ? 'تعذّر حفظ التعديل.' : 'Could not save changes.'));
        plannerEditTarget = null;
        closeModal('modal-add-planner');
        closeModal('modal-planner-detail');
        refreshAfterPlannerWrite();
        return;
      }
      var r = plannerPlaceModule(level, plan, date, code, mid, kind,
                                 { time: tEl && tEl.value, dur: dEl && dEl.value });
      if (!r.ok) return fail(r.reason === 'dup'
        ? (isAr() ? 'هذه الوحدة مضافة كمذاكرة في نفس اليوم. جرّب «مراجعة» أو يوماً آخر.' : 'This module already has a study session that day. Try "Review" or another day.')
        : (isAr() ? 'تعذّرت الإضافة.' : 'Could not add.'));
      closeModal('modal-add-planner');
      refreshAfterPlannerWrite();
    });
    var btnCancelPlanner = document.getElementById('btn-cancel-planner');
    if (btnCancelPlanner) btnCancelPlanner.addEventListener('click', function () { plannerEditTarget = null; closeModal('modal-add-planner'); });
     
    var choosePlanner = document.getElementById('choose-planner');
    if (choosePlanner) choosePlanner.addEventListener('click', function () {
      document.getElementById('modal-choose-type').style.display = 'none';
      openPlannerModal(null, null);
    });

    
    var skPlanned = document.getElementById('study-kind-planned');
    if (skPlanned) skPlanned.addEventListener('click', function () {
      document.getElementById('modal-study-kind').style.display = 'none';
      openPlannerModal(null, pendingStudyDate);
    });
    var skRoutine = document.getElementById('study-kind-routine');
    if (skRoutine) skRoutine.addEventListener('click', function () {
      document.getElementById('modal-study-kind').style.display = 'none';
      editingEvent = null;
      var rc = document.getElementById('study-recurring'); if (rc) rc.checked = true;   
      var wd = document.getElementById('study-week-date'); if (wd) wd.value = fmtLocalDate(pendingStudyDate ? new Date(pendingStudyDate) : currentWeekStart);
      toggleSingleWeekField();
      document.getElementById('modal-add-study').style.display = '';
    });
    var todayCollapse = document.getElementById('today-collapse');
    if (todayCollapse) todayCollapse.addEventListener('click', function () {
      var panel = document.getElementById('today-panel');
      panel.classList.toggle('collapsed');
      this.textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
    });

    document.getElementById('choose-lecture').addEventListener('click', function() {
      document.getElementById('modal-choose-type').style.display = 'none';
      document.getElementById('modal-add-lecture').style.display = '';
    });
    document.getElementById('choose-study').addEventListener('click', function() {
      document.getElementById('modal-choose-type').style.display = 'none';
      document.getElementById('modal-study-kind').style.display = '';
    });
    document.getElementById('choose-exam').addEventListener('click', function() {
      document.getElementById('modal-choose-type').style.display = 'none';
      document.getElementById('modal-add-exam').style.display = '';
    });

    document.getElementById('btn-save-lecture').addEventListener('click', function() {
      var data = {
        course_code: document.getElementById('lec-course').value,
        day: document.getElementById('lec-day').value,
        start_time: document.getElementById('lec-start').value,
        end_time: document.getElementById('lec-end').value,
        room: document.getElementById('lec-room').value,
        type: document.getElementById('lec-type').value
      };
      if (editingEvent && editingEvent.type === 'lecture') {
        var lec = schedule.lectures.find(function(l) { return l.id === editingEvent.id; });
        if (lec) {
          lec.course_code = data.course_code; lec.day = data.day;
          lec.start_time = data.start_time; lec.end_time = data.end_time;
          lec.room = data.room; lec.type = data.type; lec.color = getCourseColor(data.course_code);
        }
        save();
      } else {
        addLecture(data);
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-lecture');
      render();
    });

    document.getElementById('btn-save-study').addEventListener('click', function() {
      var data = {
        course_code: document.getElementById('study-course').value,
        day: document.getElementById('study-day').value,
        start_time: document.getElementById('study-start').value,
        duration: parseInt(document.getElementById('study-duration').value) || 60,
        type: document.getElementById('study-type').value,
        notes: document.getElementById('study-notes').value.trim(),
        youtube: document.getElementById('study-youtube').value.trim(),
        recurring: document.getElementById('study-recurring').checked
      };
       
      var wkDateEl = document.getElementById('study-week-date');
      var targetWeekId = (wkDateEl && wkDateEl.value) ? getWeekId(wkDateEl.value) : getWeekId(currentWeekStart);
      if (editingEvent && editingEvent.type === 'study') {
        var sb = schedule.study_blocks.find(function(s) { return s.id === editingEvent.id; });
        if (sb) {
          var wasRecurring = (sb.week_id == null);
          sb.course_code = data.course_code; sb.day = data.day;
          sb.start_time = data.start_time; sb.duration_minutes = data.duration;
          sb.type = data.type; sb.notes = data.notes; sb.youtube = data.youtube;
          if (data.recurring) {
            sb.week_id = null;   
          } else if (wasRecurring) {
             
            sb.excluded_weeks = sb.excluded_weeks || [];
            if (sb.excluded_weeks.indexOf(targetWeekId) === -1) sb.excluded_weeks.push(targetWeekId);
            schedule.study_blocks.push({
              id: 'sb' + Date.now() + Math.random().toString(36).slice(2, 5),
              course_code: data.course_code, day: data.day, start_time: data.start_time,
              duration_minutes: data.duration, type: data.type, notes: data.notes,
              youtube: data.youtube, week_id: targetWeekId
            });
          } else {
            sb.week_id = targetWeekId;   
          }
        }
        save();
      } else {
        if (!data.recurring) data._week_id = targetWeekId;   
        addStudyBlock(data);
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-study');
      render();
    });

    
    
    document.getElementById('del-lecture').addEventListener('click', function() {
      if (!editingEvent || editingEvent.type !== 'lecture') return;
      document.getElementById('lec-main-actions').style.display = 'none';
      document.getElementById('lec-del-scope').style.display = '';
    });
    document.getElementById('del-lec-back').addEventListener('click', function() {
      document.getElementById('lec-del-scope').style.display = 'none';
      document.getElementById('lec-main-actions').style.display = '';
    });
    document.getElementById('del-lec-week').addEventListener('click', function() {
      if (editingEvent && editingEvent.type === 'lecture') {
        var wid = editingEvent.weekId || getWeekId(currentWeekStart);
        var ov = schedule.week_overrides[wid] || (schedule.week_overrides[wid] = {});
        ov.cancelled_lectures = ov.cancelled_lectures || [];
        if (ov.cancelled_lectures.indexOf(editingEvent.id) === -1) ov.cancelled_lectures.push(editingEvent.id);
        save();
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-lecture');
      render();
    });
    document.getElementById('del-lec-all').addEventListener('click', function() {
      if (editingEvent && editingEvent.type === 'lecture') {
        schedule.lectures = schedule.lectures.filter(function(l) { return l.id !== editingEvent.id; });
        
        Object.keys(schedule.week_overrides).forEach(function(wid) {
          var ov = schedule.week_overrides[wid];
          if (ov && ov.cancelled_lectures) ov.cancelled_lectures = ov.cancelled_lectures.filter(function(id) { return id !== editingEvent.id; });
        });
        save();
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-lecture');
      render();
    });
    document.getElementById('del-study').addEventListener('click', function() {
      if (editingEvent && editingEvent.type === 'study') {
        schedule.study_blocks = schedule.study_blocks.filter(function(s) { return s.id !== editingEvent.id; });
        save();
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-study');
      render();
    });

    document.getElementById('btn-cancel-lecture').addEventListener('click', function() { editingEvent = null; hideDeleteButtons(); closeModal('modal-add-lecture'); });
    document.getElementById('btn-cancel-study').addEventListener('click', function() { editingEvent = null; hideDeleteButtons(); closeModal('modal-add-study'); });

     
    var recChk = document.getElementById('study-recurring');
    if (recChk) recChk.addEventListener('change', function () { toggleSingleWeekField(); });

    document.getElementById('btn-save-exam').addEventListener('click', function() {
      var data = {
        course_code: document.getElementById('exam-course').value,
        date: document.getElementById('exam-date').value,
        start_time: document.getElementById('exam-start').value,
        end_time: document.getElementById('exam-end').value,
        exam_type: document.getElementById('exam-type').value,
        room: document.getElementById('exam-room').value.trim(),
        notes: document.getElementById('exam-notes').value.trim()
      };
      if (!data.date) { alert(isAr() ? 'اختر تاريخ الاختبار' : 'Pick an exam date'); return; }
      if (editingEvent && editingEvent.type === 'exam') {
        var ex = schedule.exams.find(function(x) { return x.id === editingEvent.id; });
        if (ex) {
          ex.course_code = data.course_code; ex.date = data.date;
          ex.start_time = data.start_time; ex.end_time = data.end_time;
          ex.exam_type = data.exam_type; ex.room = data.room; ex.notes = data.notes;
        }
        save();
      } else {
        addExam(data);
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-exam');
      render();
    });
    document.getElementById('del-exam').addEventListener('click', function() {
      if (editingEvent && editingEvent.type === 'exam') {
        schedule.exams = schedule.exams.filter(function(x) { return x.id !== editingEvent.id; });
        save();
      }
      editingEvent = null; hideDeleteButtons();
      closeModal('modal-add-exam');
      render();
    });
    document.getElementById('btn-cancel-exam').addEventListener('click', function() { editingEvent = null; hideDeleteButtons(); closeModal('modal-add-exam'); });

    document.getElementById('btn-settings').addEventListener('click', openEditor);
    document.getElementById('btn-close-editor').addEventListener('click', function() { closeModal('modal-editor'); });
    document.getElementById('btn-cancel-editor').addEventListener('click', function() { closeModal('modal-editor'); });
    document.getElementById('btn-save-editor').addEventListener('click', saveEditor);
    document.getElementById('btn-auto-arrange').addEventListener('click', autoArrange);

    
    document.getElementById('editor-start').addEventListener('change', function () {
      var start = this.value;
      if (!start) return;
      var tt = detectTermType(start);
      document.getElementById('editor-term-type').value = tt;
      document.getElementById('editor-end').value = computeTermEnd(start, tt);
    });
    
    document.getElementById('editor-term-type').addEventListener('change', function () {
      var start = document.getElementById('editor-start').value;
      if (start) document.getElementById('editor-end').value = computeTermEnd(start, this.value);
    });

    var printBtn = document.getElementById('btn-print-sch');
    if (printBtn) printBtn.addEventListener('click', runSchedulePrint);

    document.querySelectorAll('.sch-modal-overlay').forEach(function(ov) {
      ov.addEventListener('click', function(e) { if (e.target === ov) { ov.style.display = 'none'; editingEvent = null; hideDeleteButtons(); } });
    });
  }

  function closeModal(id) { document.getElementById(id).style.display = 'none'; }

  
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function escapeH(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function addMinutes(t, min) {
    var p = (t || '15:00').split(':');
    var total = parseInt(p[0]) * 60 + parseInt(p[1] || 0) + min;
    total = ((total % 1440) + 1440) % 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }
  function durationOf(lec) {
    if (lec.duration) return lec.duration;
    if (lec.start_time && lec.end_time) {
      var s = lec.start_time.split(':'), e = lec.end_time.split(':');
      return (parseInt(e[0]) * 60 + parseInt(e[1])) - (parseInt(s[0]) * 60 + parseInt(s[1]));
    }
    return 50;
  }
  function courseDisplayName(code) {
    if (String(code).indexOf('__CUSTOM_') === 0) {
      var sc = semester && semester.courses.find(function (c) { return c.code === code; });
      return sc ? (isAr() ? sc.name_ar : (sc.name_en || sc.name_ar)) : code;
    }
    var c = catalog && catalog.courses ? catalog.courses.find(function (x) { return x.code === code; }) : null;
    return c ? (isAr() ? c.name_ar : c.name_en) : code;
  }

  function openEditor() {
    var lang = isAr() ? 'ar' : 'en';
    var active = schedule.settings.active_days || [];
    document.getElementById('editor-days').innerHTML = DAYS_ORDER.map(function (d) {
      return '<label><input type="checkbox" data-eday="' + d + '"' + (active.indexOf(d) !== -1 ? ' checked' : '') + '> ' + DAY_NAMES[lang][d] + '</label>';
    }).join('');
    document.getElementById('editor-start').value = schedule.settings.term_start_date || '';
    document.getElementById('editor-term-type').value = schedule.settings.term_type || 'normal';
    document.getElementById('editor-end').value = schedule.settings.semester_end_date || '';
    
    var remEl = document.getElementById('editor-reminder');
    if (remEl) remEl.value = String(schedule.settings.reminder_lead || 0);
    var fp = schedule.settings.focus_periods || { midterm: {}, final: {} };
    document.getElementById('editor-mid-start').value = (fp.midterm && fp.midterm.start) || '';
    document.getElementById('editor-mid-end').value = (fp.midterm && fp.midterm.end) || '';
    document.getElementById('editor-fin-start').value = (fp.final && fp.final.start) || '';
    document.getElementById('editor-fin-end').value = (fp.final && fp.final.end) || '';
    renderEditorCourses();
    if (!schedule.settings.onboarded) { schedule.settings.onboarded = true; save(); }
    document.getElementById('modal-editor').style.display = '';
  }

  function renderEditorCourses() {
    var box = document.getElementById('editor-courses');
    var courses = (semester && semester.courses) ? semester.courses : [];
    if (!courses.length) {
      box.innerHTML = '<p class="sch-editor-hint">' + (isAr() ? 'لا مواد في فصلك الخاص بعد — أضِفها من صفحة الفصل.' : 'No courses in your semester yet.') + '</p>';
      return;
    }
    var lang = isAr() ? 'ar' : 'en';
    box.innerHTML = courses.map(function (c) {
      var code = c.code;
      var color = getCourseColor(code);
      var existing = schedule.lectures.filter(function (l) { return l.course_code === code; });
      var days = existing.map(function (l) { return l.day; });
      var first = existing[0];
      var start = first ? first.start_time : '15:00';
      var dur = first ? durationOf(first) : 50;
      var attend = (first && first.attendance) ? first.attendance : 'in_person';
      var room = first ? (first.room || '') : '';
      var chips = DAYS_ORDER.map(function (d) {
        return '<button type="button" class="sch-daychip' + (days.indexOf(d) !== -1 ? ' on' : '') + '" data-ecdaych="' + d + '">' + DAY_NAMES[lang][d] + '</button>';
      }).join('');
      return '<div class="sch-ecourse" data-ecode="' + escapeH(code) + '">' +
        '<div class="sch-ecourse-head"><span class="sch-ecourse-dot" style="background:' + color + '"></span>' + escapeH(courseDisplayName(code)) + '</div>' +
        '<div class="sch-daychips">' + chips + '</div>' +
        '<div class="sch-ecourse-row">' +
          '<div><label class="sch-label">' + (isAr() ? 'البداية' : 'Start') + '</label><div class="sch-timepick"><select class="tp-h"></select><span class="tp-colon">:</span><select class="tp-m"></select><select class="tp-mer"><option value="ص">ص</option><option value="م">م</option></select><input type="hidden" class="ec-start" value="' + start + '"></div></div>' +
          '<div><label class="sch-label">' + (isAr() ? 'المدة (د)' : 'Duration') + '</label><input type="number" class="sch-input ec-dur" min="30" max="180" step="5" value="' + dur + '"></div>' +
          '<div><label class="sch-label">' + (isAr() ? 'الحضور' : 'Attendance') + '</label><select class="sch-select ec-attend"><option value="in_person"' + (attend === 'in_person' ? ' selected' : '') + '>' + (isAr() ? 'حضوري' : 'In-person') + '</option><option value="remote"' + (attend === 'remote' ? ' selected' : '') + '>' + (isAr() ? 'عن بُعد' : 'Remote') + '</option></select></div>' +
        '</div>' +
        '<div class="sch-room-wrap" style="display:' + (attend === 'remote' ? 'none' : '') + '"><label class="sch-label">' + (isAr() ? 'رقم القاعة' : 'Room') + '</label><input type="text" class="sch-input ec-room" value="' + escapeH(room) + '" placeholder="B204"></div>' +
      '</div>';
    }).join('');
    box.querySelectorAll('.sch-daychip').forEach(function (chip) {
      chip.addEventListener('click', function () { this.classList.toggle('on'); });
    });
    box.querySelectorAll('.ec-attend').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var wrap = this.closest('.sch-ecourse').querySelector('.sch-room-wrap');
        if (wrap) wrap.style.display = this.value === 'remote' ? 'none' : '';
      });
    });
    TP.build(box);   
  }

  function autoArrange() {
    var t = '15:00';
    document.querySelectorAll('#editor-courses .sch-ecourse').forEach(function (card) {
      var dur = parseInt(card.querySelector('.ec-dur').value) || 50;
      TP.setEl(card.querySelector('.ec-start'), t);
      t = addMinutes(t, dur);
    });
  }

  function saveEditor() {
    var days = Array.from(document.querySelectorAll('#editor-days input[data-eday]:checked')).map(function (cb) { return cb.getAttribute('data-eday'); });
    if (days.length) schedule.settings.active_days = days.sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });
    schedule.settings.term_start_date = document.getElementById('editor-start').value || '';
    schedule.settings.term_type = document.getElementById('editor-term-type').value || 'normal';
    schedule.settings.semester_end_date = document.getElementById('editor-end').value || '';
    
    var remSave = document.getElementById('editor-reminder');
    if (remSave) schedule.settings.reminder_lead = parseInt(remSave.value) || 0;
    schedule.settings.focus_periods = {
      midterm: { start: document.getElementById('editor-mid-start').value || '', end: document.getElementById('editor-mid-end').value || '' },
      final:   { start: document.getElementById('editor-fin-start').value || '', end: document.getElementById('editor-fin-end').value || '' }
    };
    schedule.settings.onboarded = true;

    document.querySelectorAll('#editor-courses .sch-ecourse').forEach(function (card) {
      var code = card.getAttribute('data-ecode');
      var lecDays = Array.from(card.querySelectorAll('.sch-daychip.on')).map(function (ch) { return ch.getAttribute('data-ecdaych'); });
      var start = card.querySelector('.ec-start').value || '15:00';
      var dur = parseInt(card.querySelector('.ec-dur').value) || 50;
      var attend = card.querySelector('.ec-attend').value;
      var room = attend === 'in_person' ? (card.querySelector('.ec-room').value || '') : '';
      var end = addMinutes(start, dur);
      
      schedule.lectures = schedule.lectures.filter(function (l) { return l.course_code !== code; });
      lecDays.forEach(function (d) {
        schedule.lectures.push({
          id: 'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          course_code: code, day: d, start_time: start, end_time: end,
          room: room, type: 'lecture', recurring: true, color: getCourseColor(code),
          duration: dur, attendance: attend, reminder: schedule.settings.reminder_lead
        });
      });
    });
    save();
    closeModal('modal-editor');
    render();
  }

  
   

  
  document.addEventListener('DOMContentLoaded', init);
})();
