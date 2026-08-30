/*@3.SCRJ.1*/
;(function () {
  'use strict';
  if (window.GardenScheduleRules) return;

  var LS_KEY = 'weekly_schedule';
  var DAYS_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function raw() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}; }
    catch (e) { return {}; }
  }

  function settings() {
    var s = raw().settings;
    return (s && typeof s === 'object') ? s : {};
  }

  function fmtLocalDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function parseLocalDate(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) return null;
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return isNaN(d.getTime()) ? null : d;
  }

  function getWeekStartDate(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function getWeekId(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
  }

  function overrideFor(weekId) {
    var o = raw().week_overrides;
    return (o && o[weekId]) || {};
  }

  /*@3.SCRJ.2*/
  function day0(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function inTerm(dateObj) {
    var st = settings();
    var d = day0(dateObj);
    var a = parseLocalDate(st.term_start_date);
    var b = parseLocalDate(st.semester_end_date);
    if (a && d < a) return false;
    if (b && d > b) return false;
    return true;
  }

  function weekFocus(weekStart) {
    var fp = settings().focus_periods || {};
    var s = getWeekStartDate(weekStart);
    var e = new Date(s); e.setDate(e.getDate() + 6);
    function overlaps(p) {
      if (!p || !p.start || !p.end) return false;
      var ps = parseLocalDate(p.start), pe = parseLocalDate(p.end);
      return !!(ps && pe && ps <= e && pe >= s);
    }
    if (overlaps(fp.midterm)) return { active: true, kind: 'midterm' };
    if (overlaps(fp.final)) return { active: true, kind: 'final' };
    return { active: false, kind: null };
  }

  function lectureOn(l, dateObj) {
    if (!l || !l.day || !dateObj) return { on: false, why: 'none' };
    if (DAYS_ORDER[dateObj.getDay()] !== l.day) return { on: false, why: 'day' };
    /*@3.SCRJ.3*/
    var d = day0(dateObj);
    if (!inTerm(d)) return { on: false, why: 'term' };

    var from = parseLocalDate(l.start_date), to = parseLocalDate(l.end_date);
    if (from && d < from) return { on: false, why: 'range' };
    if (to && d > to) return { on: false, why: 'range' };

    var ws = getWeekStartDate(d);
    var ov = overrideFor(getWeekId(ws));
    if (weekFocus(ws).active && !ov.show_lectures) return { on: false, why: 'focus' };

    var cx = ov.cancelled_lectures || [];
    if (l.id && cx.indexOf(l.id) !== -1) return { on: false, why: 'cancelled' };

    return { on: true, why: null };
  }

  /*@3.SCRJ.4*/
  function blockOn(b, dateObj) {
    if (!b || !b.day || !dateObj) return { on: false, why: 'none' };
    if (DAYS_ORDER[dateObj.getDay()] !== b.day) return { on: false, why: 'day' };
    var d = day0(dateObj);
    var wid = getWeekId(getWeekStartDate(d));
    if (b.week_id != null) {
      return b.week_id === wid ? { on: true, why: null } : { on: false, why: 'week' };
    }
    if (!inTerm(d)) return { on: false, why: 'term' };
    if (b.excluded_weeks && b.excluded_weeks.indexOf(wid) !== -1) return { on: false, why: 'excluded' };
    return { on: true, why: null };
  }

  function lectureNotice(dateObj, ar) {
    var d = day0(dateObj || new Date());
    var ws = getWeekStartDate(d);
    var wid = getWeekId(ws);
    var f = weekFocus(ws);
    var st = settings();

    if (!inTerm(d)) {
      if (!st.term_start_date && !st.semester_end_date) return null;
      var a = parseLocalDate(st.term_start_date);
      var before = !!(a && d < a);
      return {
        why: 'term', kind: null, weekId: wid, shown: false, canToggle: false,
        text: ar ? (before ? 'لم يبدأ الفصلُ بعد — والمحاضراتُ المتكرّرةُ صامتةٌ حتى يبدأ'
                           : 'انتهى الفصل — والمحاضراتُ المتكرّرةُ صامتة')
                 : (before ? 'The term has not started — recurring lectures stay silent until it does'
                           : 'The term has ended — recurring lectures are silent'),
        action: ''
      };
    }

    if (f.active) {
      var shown = !!overrideFor(wid).show_lectures;
      var kind = f.kind === 'midterm' ? (ar ? 'الميدتيرم' : 'Midterm') : (ar ? 'الفاينل' : 'Final');
      return {
        why: 'focus', kind: f.kind, weekId: wid, shown: shown, canToggle: true,
        text: ar
          ? ('أسبوعُ تركيزٍ (' + kind + ') — المحاضراتُ المتكرّرةُ ' + (shown ? 'ظاهرةٌ وتُنبِّه' : 'صامتةٌ ولا تُنبِّه'))
          : ('Focus week (' + kind + ') — recurring lectures are ' + (shown ? 'shown and will remind' : 'silent and will not remind')),
        action: ar ? (shown ? 'أسكِتْها' : 'أظهِرْها') : (shown ? 'Silence them' : 'Show them')
      };
    }
    return null;
  }

  function setLecturesShown(weekId, on) {
    var s;
    try { s = JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}; }
    catch (e) { return false; }
    if (!s.week_overrides || typeof s.week_overrides !== 'object') s.week_overrides = {};
    var o = s.week_overrides[weekId] || (s.week_overrides[weekId] = {});
    o.show_lectures = !!on;
    s.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { return false; }
    announce('lecture-toggle');
    return true;
  }

  function announce(from) {
    try {
      window.dispatchEvent(new CustomEvent('garden:scheduleChanged', {
        detail: { from: from || 'unknown' }
      }));
    } catch (e) {}
  }

  window.GardenScheduleRules = {
    announce: announce,
    lectureNotice: lectureNotice,
    setLecturesShown: setLecturesShown,
    DAYS_ORDER: DAYS_ORDER,
    settings: settings,
    fmtLocalDate: fmtLocalDate,
    parseLocalDate: parseLocalDate,
    getWeekStartDate: getWeekStartDate,
    getWeekId: getWeekId,
    overrideFor: overrideFor,
    inTerm: inTerm,
    weekFocus: weekFocus,
    lectureOn: lectureOn,
    blockOn: blockOn
  };
})();
