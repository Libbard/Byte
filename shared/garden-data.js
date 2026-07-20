 

;(function () {
  'use strict';

   
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

   
   
  var GPA_SCALE = {
    'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.00,
    'C+': 2.50, 'C': 2.00, 'D+': 1.50, 'D': 1.00, 'F': 0.00
  };
  var TR_GRADE = 'TR';

  var DAYS_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

   

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

   

  var _catalog = null;      
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
        _catalog = {};       
        _catalogArr = [];
        return false;
      });
    return _readyPromise;
  }

  function catalog() { return _catalog || {}; }
  function catalogList() { return _catalogArr.slice(); }
  function courseInfo(code) { return (_catalog || {})[code] || null; }

   
  function moduleCount(code) {
    var info = courseInfo(code);
    return (info && typeof info.modules === 'number') ? info.modules : 13;
  }

  function isRealCourse(code) {
    return !!code &&
           String(code).indexOf('__CUSTOM_') !== 0 &&
           String(code).indexOf('__MANUAL_') !== 0;
  }

   

   
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

   
  function courseStats(code) {
    var total = moduleCount(code);
    var out = { mastered: 0, due: 0, quizzesDone: 0, totalQuizzes: total, hasData: false };
    if (!isRealCourse(code)) { out.totalQuizzes = 0; return out; }
    var now = Date.now();
    for (var m = 1; m <= total; m++) {
      moduleCards(code, m).forEach(function (card) {
        out.hasData = true;
        if (card.interval && card.interval >= 21) out.mastered++;
        if (card.nextReview && card.nextReview <= now) out.due++;
      });
      try {
        if (localStorage.getItem('garden_' + code + '_m' + m + '_quiz') !== null) out.quizzesDone++;
      } catch (e) {}
    }
    return out;
  }

   
  function dueCards(code, modules) {
    if (!isRealCourse(code)) return 0;
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
    var count = 0;
    nums.forEach(function (n) {
      moduleCards(code, n).forEach(function (card) {
        if (card.nextReview && card.nextReview <= now) count++;
      });
    });
    return count;
  }

   
  function dueForSemester() {
    var sem = semester();
    if (!sem || !sem.courses) return 0;
    return sem.courses.reduce(function (sum, c) {
      return sum + (c && isRealCourse(c.code) && !c.completed ? dueCards(c.code) : 0);
    }, 0);
  }

   

  function semester() { return readJSON(LS.semester, null); }
  function archive() { return readJSON(LS.archive, []); }

   
  function coursePercent(entry) {
    if (!entry) return 0;
    if (entry.completed) return 100;
    if (entry.custom || !isRealCourse(entry.code)) return 0;
    var st = courseStats(entry.code);
    return st.totalQuizzes ? Math.round((st.quizzesDone / st.totalQuizzes) * 100) : 0;
  }

  function semesterProgress() {
    var sem = semester();
    var out = { exists: false, name: '', total: 0, done: 0, credits: 0, pct: 0, due: 0, courses: [] };
    if (!sem || !sem.courses || !sem.courses.length) return out;

    out.exists = true;
    out.name = sem.name || '';
    out.total = sem.courses.length;
    out.done = sem.courses.filter(function (c) { return c && c.completed; }).length;

    var sumPct = 0;
    sem.courses.forEach(function (c) {
      if (!c) return;
      var info = courseInfo(c.code);
      var pct = coursePercent(c);
      var due = (isRealCourse(c.code) && !c.completed) ? dueCards(c.code) : 0;
      sumPct += pct;
      out.credits += (info && info.credits) || c.credits || 3;
      out.due += due;
      out.courses.push({
        code: c.code,
        name_ar: (info && info.name_ar) || c.name_ar || c.name || c.code,
        name_en: (info && info.name_en) || c.name_en || c.name || c.code,
        credits: (info && info.credits) || c.credits || 3,
        path: info && info.path,
        completed: !!c.completed,
        custom: !!c.custom,
        pct: pct,
        due: due
      });
    });
    out.pct = out.total ? Math.round(sumPct / out.total) : 0;
    return out;
  }

   

   
  function gpaSummary() {
    var g = readJSON(LS.grades, null);
    var out = { exists: false, cgpa: 0, credits: 0, graded: 0, scale: 4, earnedCredits: 0, trCredits: 0 };
    if (!g || !g.semesters || !g.semesters.length) return out;
    var points = 0, credits = 0, graded = 0, earned = 0, tr = 0;
    g.semesters.forEach(function (sem) {
      (sem.courses || []).forEach(function (c) {
        if (!c || !c.grade) return;
        if (c.grade === TR_GRADE) {
           
          tr += c.credits || 0;
          earned += c.credits || 0;
          return;
        }
        if (GPA_SCALE[c.grade] === undefined) return;
        points += GPA_SCALE[c.grade] * c.credits;
        credits += c.credits;
        graded++;
        if (c.grade !== 'F') earned += c.credits || 0;   
      });
    });
    out.exists = credits > 0 || tr > 0;
    out.credits = credits;              
    out.graded = graded;
    out.trCredits = tr;
    out.earnedCredits = earned;         
    out.cgpa = credits > 0 ? points / credits : 0;
    return out;
  }

   
  function gradeCourseInfo(c) {
    if (c.custom || !isRealCourse(c.code)) {
      return { name_ar: c.name_ar || c.name || 'مادة مخصصة',
               name_en: c.name_en || c.name || 'Custom Course',
               credits: c.credits || 3 };
    }
    var info = courseInfo(c.code);
    if (info) {
      return { name_ar: info.name_ar || c.code, name_en: info.name_en || c.code,
               
               credits: (c.credits != null) ? c.credits : ((info.credits != null) ? info.credits : 3) };
    }
    return { name_ar: c.name_ar || c.name || c.code,
             name_en: c.name_en || c.name || c.code, credits: c.credits || 3 };
  }

   
  function rebuildGrades() {
     
    if (_catalog === null) { ready().then(rebuildGrades); return false; }
    var g = readJSON(LS.grades, null) || { semesters: [], updated_at: null };
    if (!Array.isArray(g.semesters)) g.semesters = [];
    var arch = archive() || [];
    var before = JSON.stringify(g.semesters);

    var ids = {};
    arch.forEach(function (a) { if (a && a.id) ids[a.id] = true; });
     
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
      if (!sc) return;               
      points += sp; credits += sc;
      out.push({
        id: sem.id, name: sem.name || '',
        kind: sem.is_current ? 'current' : 'past',
        semGPA: sp / sc, cumGPA: points / credits,
        credits: sc, totalCredits: credits, totalPoints: points
      });
    });
    return out;
  }

   

   
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

   

  function writeSchedule(s) {
    s.updated_at = new Date().toISOString();
    try { localStorage.setItem(LS.schedule, JSON.stringify(s)); return true; }
    catch (e) { return false; }
  }

  function scheduleRaw() {
    var s = readJSON(LS.schedule, null);
    if (!s) {
      
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

   

  function metaKey(code) { return 'course_meta_' + code; }

  function courseMeta(code) {
    var m = readJSON(metaKey(code), null) || {};
    if (!Array.isArray(m.instructors)) m.instructors = [];
    if (!Array.isArray(m.links)) m.links = [];
    if (!Array.isArray(m.dates)) m.dates = [];   
    if (!Array.isArray(m.notes)) m.notes = [];
    return m;
  }

  function saveCourseMeta(code, meta) {
    meta.updated_at = Date.now();
    try { localStorage.setItem(metaKey(code), JSON.stringify(meta)); return true; }
    catch (e) { return false; }
  }

   

   
  function plannerToday(level, date) {
    var ds = todayStr(date);
    var out = { exists: false, todayTotal: 0, todayDone: 0, total: 0, done: 0, pct: 0, planType: null };
     
    var levels = level ? [String(level)] : ['HUB', 'others', '3', '4', '5', '6', '7', '8'];

    for (var i = 0; i < levels.length; i++) {
      var d = readJSON('planner_v2_L' + levels[i], null);
      if (!d || d.version !== 2 || !d.plans) continue;
      var type = d.active_plan || 'midterm';
      var plan = d.plans[type];
      if (!plan || !plan.entries) continue;

      var todayEntry = plan.entries[ds];
      var mods = (todayEntry && todayEntry.items)
        ? todayEntry.items.filter(function (it) { return it && it.type === 'module'; })
        : [];
      out.todayTotal += mods.length;
      out.todayDone += mods.filter(function (it) { return it.completed; }).length;

      Object.keys(plan.entries).forEach(function (k) {
        var items = (plan.entries[k] && plan.entries[k].items) || [];
        items.forEach(function (it) {
          if (it && it.type === 'module') {
            out.total++;
            if (it.completed) out.done++;
          }
        });
      });
      out.exists = true;
      out.planType = type;
    }
    out.pct = out.total ? Math.round((out.done / out.total) * 100) : 0;
    return out;
  }

   

  function profile() { return readJSON(LS.profile, { name: '', level: '', target_gpa: null }); }
  function quickNotes() { return readJSON(LS.notes, []); }
  function prefs() { return readJSON(LS.prefs, null); }

   

  function tasks() {
    var t = readJSON(LS.tasks, []);
    return Array.isArray(t) ? t.filter(Boolean) : [];
  }

  function writeTasks(list) {
    try { localStorage.setItem(LS.tasks, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

   
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

   

  function gpaPlan() {
    var p = readJSON(LS.gpaPlan, null);
    if (!p || !Array.isArray(p.semesters)) p = { semesters: [] };
    return p;
  }

  function saveGpaPlan(plan) {
    try { localStorage.setItem(LS.gpaPlan, JSON.stringify(plan)); return true; }
    catch (e) { return false; }
  }

   
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
        id: sem.id, name: sem.name || '',
        semGPA: sc ? sp / sc : 0, cumGPA: credits ? points / credits : 0,
        credits: sc, graded: sc > 0
      });
    });
    out.final = credits ? points / credits : 0;
    return out;
  }

   
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

   
  function allDeadlines() {
    var out = tasks().map(function (t) {
      return {
        id: t.id, source: 'task', editable: true,
        course: t.course || null, title: t.title, type: t.type,
        due: t.due, done: !!t.done, note: t.note || ''
      };
    });

     
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

     
    quickNotes().forEach(function (n) {
      if (!n || !n.remind_at || n.archived) return;
      out.push({
        id: n.id, source: 'note', editable: false,
        course: null, title: (n.title || n.body || '').slice(0, 60), type: 'note',
        due: n.remind_at, done: false, note: n.body || ''
      });
    });

    out.sort(function (a, b) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return String(a.due).localeCompare(String(b.due));
    });
    return out;
  }

   
  function daysUntil(due, now) {
    if (!due) return null;
    var d = new Date(due);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    var base = now ? new Date(now) : new Date();
    base.setHours(0, 0, 0, 0);
    return Math.round((d - base) / 86400000);
  }

   
  function tasksDueSoon(now) {
    return allDeadlines().filter(function (t) {
      if (t.done) return false;
      var d = daysUntil(t.due, now);
      return d !== null && d <= 1;
    }).length;
  }

   

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

    moduleCards: moduleCards,
    courseStats: courseStats,
    dueCards: dueCards,
    dueForSemester: dueForSemester,

    semester: semester,
    archive: archive,
    coursePercent: coursePercent,
    semesterProgress: semesterProgress,

    gpaSummary: gpaSummary,
    rebuildGrades: rebuildGrades,
    completedCourses: completedCourses,
    dispName: dispName,
    todaySchedule: todaySchedule,
    plannerToday: plannerToday,

    scheduleRaw: scheduleRaw,
    courseExams: courseExams,
    upsertExam: upsertExam,
    deleteExam: deleteExam,

    courseMeta: courseMeta,
    saveCourseMeta: saveCourseMeta,

    profile: profile,
    quickNotes: quickNotes,
    prefs: prefs,

    tasks: tasks,
    upsertTask: upsertTask,
    deleteTask: deleteTask,
    toggleTask: toggleTask,
    allDeadlines: allDeadlines,
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

   
  ready().then(rebuildGrades);
})();
