 
;(function () {
  'use strict';

  var INDEX_PATH = '../shared/data/curriculum_index.json';
  var MAP_BASE = '../';

  var S = null;                 
  var index = null;             
  var maps = {};                
  var modulesCache = {};        

  var wizard = null;            
  var activeTab = 'midterm';    

  var SPACING_TIERS = ['full', 'lite', 'off'];
  var SPACING_OFFSETS = { full: [3, 7], lite: [3], off: [] };

  var GAP_MIN = 15;             
  var DEFAULT_START = '10:00';  

  function isAr() { return S.isAr(); }
  function esc(s) { return S.escapeH(s); }
  function T(ar, en) { return isAr() ? ar : en; }

  
  
  
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch(INDEX_PATH).then(function (r) { return r.json(); })
      .then(function (j) { index = (j && j.courses) || {}; return index; })
      .catch(function () { index = {}; return index; });
  }

  function loadMap(path) {
    if (maps[path]) return Promise.resolve(maps[path]);
    return fetch(MAP_BASE + path).then(function (r) { return r.json(); })
      .then(function (j) { maps[path] = j; return j; })
      .catch(function () { maps[path] = { courses: {} }; return maps[path]; });
  }

   
  function loadModules(code) {
    if (modulesCache[code]) return Promise.resolve(modulesCache[code]);
    return loadIndex().then(function (idx) {
      var entry = idx[code];
      if (!entry || !entry.map) { modulesCache[code] = []; return []; }
      return loadMap(entry.map).then(function (m) {
        var course = (m.courses || {})[code];
        var out = [];
        if (course && course.modules) {
          Object.keys(course.modules).sort().forEach(function (mid) {
            var md = course.modules[mid] || {};
            out.push({
              id: mid,
              title: md.title || mid,
              title_en: md.title_en || md.title || mid,
              difficulty: Number(md.module_difficulty) || 5,
              hours: Number(md.study_hours_estimate) || 2,
              topics: Array.isArray(md.topics) ? md.topics : []
            });
          });
        }
        modulesCache[code] = out;
        return out;
      });
    });
  }

  function loadModulesFor(codes) {
    return Promise.all(codes.map(loadModules)).then(function (all) {
      var out = {};
      codes.forEach(function (c, i) { out[c] = all[i]; });
      return out;
    });
  }

  function modTitle(m) { return isAr() ? m.title : (m.title_en || m.title); }
  function modNum(id) { return parseInt(String(id).replace(/^M/i, ''), 10) || 0; }

  
  
  
  function store() {
    var d = S.data();
    if (!d.intensive) d.intensive = { active: null, plans: {}, module_status: {}, updated_at: null };
    return d.intensive;
  }
  function planOf(tab) { return store().plans[tab] || null; }
  function statusKey(code, mid) { return code + '_' + mid; }
  function moduleStatus(code, mid) { return store().module_status[statusKey(code, mid)] || 'new'; }
  function setModuleStatus(code, mid, st) {
    var ms = store().module_status;
    if (st === 'new') delete ms[statusKey(code, mid)];
    else ms[statusKey(code, mid)] = st;
  }
  function persist() {
    store().updated_at = new Date().toISOString();
    S.save();
  }

  
  
  
  function d2s(d) { return S.fmtLocalDate(d); }
  function s2d(s) { return S.parseLocalDate(s); }
  function addDays(dstr, n) { var d = s2d(dstr); d.setDate(d.getDate() + n); return d2s(d); }
  function dayName(dstr) { return S.DAYS_ORDER[s2d(dstr).getDay()]; }
  function diffDays(a, b) { return Math.round((s2d(b) - s2d(a)) / 86400000); }
  function todayStr() { return d2s(new Date()); }

  
  
  
  
  
  
  
  
  function dayWindow(cfg) {
    var s = S.parseHM((cfg.window && cfg.window.start_time) || DEFAULT_START);
    if (s === null) s = 10 * 60;
    var st = S.data().settings || {};
    var e = (st.day_end_hour || 23) * 60;
    if (e <= s + 90) e = Math.min(24 * 60, s + 8 * 60);
    return { start: s, end: e };
  }

   
  var busyCache = {};
  function busyOn(dstr) {
    if (busyCache[dstr]) return busyCache[dstr];
    var out = [];
    try {
      S.eventsOnDate(s2d(dstr)).forEach(function (e) {
        if (e.src === 'intensive') return;
        if (e.allDay || e.start == null) return;
        out.push({ s: e.start, e: (e.end != null ? e.end : e.start + 60) });
      });
    } catch (err) {   }
    out.sort(function (a, b) { return a.s - b.s; });
    busyCache[dstr] = out;
    return out;
  }
  function clearBusy() { busyCache = {}; }

  function busyMinutes(dstr, win) {
    var n = 0;
    busyOn(dstr).forEach(function (b) {
      var s = Math.max(b.s, win.start), e = Math.min(b.e, win.end);
      if (e > s) n += e - s;
    });
    return n;
  }

   
  function dayCapacity(cfg, dstr) {
    var win = dayWindow(cfg);
    var free = (win.end - win.start) - busyMinutes(dstr, win);
    return Math.max(0, Math.floor(free / (cfg.session_minutes + GAP_MIN)));
  }

   
  function firstFreeAt(busy, from, len, hardEnd) {
    var t = from, guard = 0;
    while (guard++ < 200) {
      var hit = null;
      for (var i = 0; i < busy.length; i++) {
        if (busy[i].e > t && busy[i].s < t + len) { hit = busy[i]; break; }
      }
      if (!hit) return (t + len <= hardEnd) ? t : null;
      t = hit.e;
      if (t + len > hardEnd) return null;
    }
    return null;
  }

  
  
  

   
   
  function partsFor(mod, cfg, onePerModule) {
    if (onePerModule) return 1;
    var m = cfg.parts_mode;
    if (m === 1 || m === 2 || m === 3) return m;
    var need = Math.ceil((mod.hours * 60) / cfg.session_minutes);
    return Math.max(1, Math.min(3, need));
  }

  function buildUnits(cfg, mods, onePerModule) {
    var units = [];
    cfg.courses.forEach(function (code) {
      var selected = (cfg.modules[code] || []);
      var list = (mods[code] || []).filter(function (m) { return selected.indexOf(m.id) !== -1; });
      list.sort(function (a, b) { return modNum(a.id) - modNum(b.id); });
      list.forEach(function (m) {
        var p = partsFor(m, cfg, onePerModule);
        for (var i = 1; i <= p; i++) {
          units.push({
            course: code, module: m.id, part: i, total_parts: p,
            difficulty: m.difficulty, kind: 'study'
          });
        }
      });
    });
    return units;
  }

   
  function buildSlots(cfg) {
    var lastExam = '';
    cfg.courses.forEach(function (c) {
      var d = cfg.exam_dates[c];
      if (d && d > lastExam) lastExam = d;
    });
    if (!lastExam) return [];
    var slots = [], d = cfg.start_date, guard = 0;
    while (d <= lastExam && guard++ < 400) {
      if (cfg.rest_days.indexOf(dayName(d)) === -1) {
         
        var n = Math.min(cfg.sessions_per_day, dayCapacity(cfg, d));
        for (var i = 0; i < n; i++) slots.push({ date: d, order: i, taken: null });
      }
      d = addDays(d, 1);
    }
    return slots;
  }

   
  function capacityBreakdown(cfg) {
    var lastExam = '';
    cfg.courses.forEach(function (c) {
      var d = cfg.exam_dates[c];
      if (d && d > lastExam) lastExam = d;
    });
    var out = { days_total: 0, days_rest: 0, days_full: 0, days_partial: 0, last_exam: lastExam, window: dayWindow(cfg) };
    if (!lastExam) return out;
    if (cfg.start_date > lastExam) { out.past = true; return out; }
    var d = cfg.start_date, guard = 0;
    while (d <= lastExam && guard++ < 400) {
      out.days_total++;
      if (cfg.rest_days.indexOf(dayName(d)) !== -1) out.days_rest++;
      else {
        var cap = dayCapacity(cfg, d);
        if (cap === 0) out.days_full++;
        else if (cap < cfg.sessions_per_day) out.days_partial++;
      }
      d = addDays(d, 1);
    }
    return out;
  }

   
  function slotAllowed(slot, course, cfg) {
    var ex = cfg.exam_dates[course];
    if (!ex) return true;
    return slot.date < ex;
  }

  function capacityFor(cfg, slots, course) {
    var n = 0;
    slots.forEach(function (s) { if (!s.taken && slotAllowed(s, course, cfg)) n++; });
    return n;
  }

   
  function reserveBuffers(cfg, slots) {
    var buffers = [];
    cfg.courses.forEach(function (code) {
      var ex = cfg.exam_dates[code];
      if (!ex) return;
      var candidates = slots.filter(function (s) { return !s.taken && s.date < ex; });
      if (!candidates.length) return;
      var lastDate = candidates[candidates.length - 1].date;
      var onLast = candidates.filter(function (s) { return s.date === lastDate; });
      var slot = onLast[0];
      slot.taken = { course: code, kind: 'buffer' };
      buffers.push(slot);
    });
    return buffers;
  }

   
  function distribute(cfg, slots, units) {
    var remaining = {};
    units.forEach(function (u) { remaining[u.course] = (remaining[u.course] || 0) + 1; });

    var placed = {};                  
    var pending = units.slice();
    var dayLog = {};                  

    for (var i = 0; i < slots.length && pending.length; i++) {
      var slot = slots[i];
      if (slot.taken) continue;
      var log = dayLog[slot.date] = dayLog[slot.date] || [];
      var prev = log.length ? log[log.length - 1] : null;

      var best = null, bestScore = -Infinity, bestIdx = -1;
      for (var j = 0; j < pending.length; j++) {
        var u = pending[j];
        if (!slotAllowed(slot, u.course, cfg)) continue;
        var key = u.course + '/' + u.module;
        var st = placed[key];
        
        if (u.part > 1) {
          if (!st || st.part !== u.part - 1) continue;
          if (st.date === slot.date) continue;
        }
        
        if (st && st.date === slot.date) continue;

        var daysLeft = Math.max(1, diffDays(slot.date, cfg.exam_dates[u.course] || slot.date));
        var slack = daysLeft / Math.max(1, remaining[u.course]);
        var score = -slack * 10;                       
        if (prev && prev.course === u.course) score -= 6;          
        if (prev && prev.difficulty >= 7 && u.difficulty >= 7) score -= 14;  
        if (prev && prev.difficulty >= 7 && u.difficulty < 5) score += 4;    
        if (u.part > 1) score += 8;                    
        if (score > bestScore) { bestScore = score; best = u; bestIdx = j; }
      }
      if (!best) continue;

      pending.splice(bestIdx, 1);
      remaining[best.course]--;
      placed[best.course + '/' + best.module] = { part: best.part, date: slot.date, total: best.total_parts };
      slot.taken = best;
      log.push({ course: best.course, difficulty: best.difficulty });
    }
    return { unplaced: pending, placed: placed };
  }

   
  function applySpacing(cfg, slots, placed, tier) {
    var offsets = SPACING_OFFSETS[tier] || [];
    if (!offsets.length) return { ok: true, added: [] };
    var keys = Object.keys(placed).filter(function (k) { return placed[k].part === placed[k].total; });
    var added = [];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var parts = key.split('/');
      var course = parts[0], mid = parts[1];
      for (var o = 0; o < offsets.length; o++) {
        var target = addDays(placed[key].date, offsets[o]);
        var slot = null;
        for (var s = 0; s < slots.length; s++) {
          if (slots[s].taken) continue;
          if (slots[s].date < target) continue;
          if (!slotAllowed(slots[s], course, cfg)) continue;
          slot = slots[s]; break;
        }
        if (!slot) {
          
          added.forEach(function (x) { x.taken = null; });
          return { ok: false, added: [] };
        }
        slot.taken = { course: course, module: mid, part: 1, total_parts: 1, kind: 'spaced' };
        added.push(slot);
      }
    }
    return { ok: true, added: added };
  }

   
  function computePlan(cfg, mods, opts) {
    opts = opts || {};
    var slots = buildSlots(cfg);
    var units = buildUnits(cfg, mods, !!opts.onePerModule);
    var capacity = slots.length;
    var buffers = cfg.courses.filter(function (c) { return cfg.exam_dates[c]; }).length;
    var demand = units.length + buffers;

    var diag = {
      feasible: demand <= capacity,
      demand: demand, capacity: capacity, units: units.length, buffers: buffers,
      advice: [], spacing_advice: null, per_course: {},
      breakdown: capacityBreakdown(cfg)
    };

    
    cfg.courses.forEach(function (code) {
      var need = units.filter(function (u) { return u.course === code; }).length + (cfg.exam_dates[code] ? 1 : 0);
      var cap = slots.filter(function (s) { return slotAllowed(s, code, cfg); }).length;
      diag.per_course[code] = { need: need, cap: cap, ok: need <= cap };
      if (need > cap) diag.feasible = false;
    });

     
    if (!diag.feasible && !opts.force) {
      diag.reason = (demand > capacity) ? 'capacity' : 'course_deadline';
      diag.advice = opts.noAdvice ? [] : buildAdvice(cfg, mods, diag, opts);
      return { ok: false, diagnostics: diag };
    }

    reserveBuffers(cfg, slots);
    var res = distribute(cfg, slots, units);
    if (res.unplaced.length && opts.force) {
      diag.forced = true;
      diag.unplaced = res.unplaced.length;
      diag.unplaced_list = res.unplaced.map(function (u) {
        return { course: u.course, module: u.module, part: u.part, total: u.total_parts };
      });
    } else if (res.unplaced.length) {
       
      diag.feasible = false;
      diag.reason = 'conflict';
      diag.unplaced = res.unplaced.length;
      diag.advice = opts.noAdvice ? [] : buildAdvice(cfg, mods, diag, opts);
      return { ok: false, diagnostics: diag };
    }

     
    var wanted = cfg.spacing || 'full';
    var tierIdx = SPACING_TIERS.indexOf(wanted);
    if (tierIdx === -1) tierIdx = 0;
    var chosen = 'off';
    for (var t = tierIdx; t < SPACING_TIERS.length; t++) {
      var r = applySpacing(cfg, slots, res.placed, SPACING_TIERS[t]);
      if (r.ok) { chosen = SPACING_TIERS[t]; break; }
    }
    diag.spacing_applied = chosen;
    if (chosen !== wanted) diag.spacing_advice = spacingAdvice(cfg, res.placed, wanted, chosen);

     
    var exRes = applyExtraReviews(cfg, slots);
    diag.extra_reviews_placed = exRes.placed;
    diag.extra_reviews_failed = exRes.failed;

    
    var sessions = [];
    slots.forEach(function (s) {
      if (!s.taken) return;
      var u = s.taken;
      sessions.push({
        id: 'ip_' + s.date.replace(/-/g, '') + '_' + s.order + '_' + Math.random().toString(36).slice(2, 6),
        date: s.date, order: s.order, course: u.course, module: u.module || null,
        part: u.part || 1, total_parts: u.total_parts || 1, kind: u.kind || 'study',
        start_time: '', minutes: cfg.session_minutes, done: false, note: ''
      });
    });
    sessions.sort(function (a, b) { return a.date.localeCompare(b.date) || a.order - b.order; });
    diag.moved = layTimes(cfg, sessions);

    return { ok: true, sessions: sessions, diagnostics: diag, spacing: chosen };
  }

   
  function layTimes(cfg, sessions) {
    var win = dayWindow(cfg);
    var byDate = {};
    sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    var moved = 0;
    Object.keys(byDate).forEach(function (d) {
      var list = byDate[d].sort(function (a, b) { return a.order - b.order; });
      var busy = cfg.avoid_conflicts === false ? [] : busyOn(d).slice();
      var cursor = win.start;
      list.forEach(function (s) {
        var want = cursor;
        var at = cfg.avoid_conflicts === false ? want : firstFreeAt(busy, want, s.minutes, win.end);
        if (at === null) at = want;                       
        if (at !== want) moved++;
        s.start_time = S.minToHM24(at);
        busy.push({ s: at, e: at + s.minutes });
        busy.sort(function (a, b) { return a.s - b.s; });
        cursor = at + s.minutes + GAP_MIN;
      });
    });
    return moved;
  }

   
  function applyExtraReviews(cfg, slots) {
    var list = cfg.extra_reviews || [];
    var placed = 0, failed = 0;
    if (!list.length) return { placed: 0, failed: 0 };

    var used = {};
    slots.forEach(function (s) { if (s.taken) used[s.date] = (used[s.date] || 0) + 1; });

    list.forEach(function (r) {
      var mods = r.modules || [];
      if (!mods.length || !r.from || !r.to) return;
      var days = [];
      var d = r.from, guard = 0;
      while (d <= r.to && guard++ < 200) {
        if (cfg.rest_days.indexOf(dayName(d)) === -1) days.push(d);
        d = addDays(d, 1);
      }
      if (!days.length) { failed += mods.length; return; }
      mods.forEach(function (mid, i) {
        
        var start = Math.floor(i * days.length / mods.length);
        var slot = null;
        for (var k = 0; k < days.length; k++) {
          var dd = days[(start + k) % days.length];
          var n = used[dd] || 0;
          if (n >= dayCapacity(cfg, dd)) continue;
          var free = null;
          for (var j = 0; j < slots.length; j++) {
            if (slots[j].date === dd && !slots[j].taken) { free = slots[j]; break; }
          }
          if (!free) { free = { date: dd, order: n, taken: null }; slots.push(free); }
          slot = free; used[dd] = n + 1; break;
        }
        if (!slot) { failed++; return; }
        slot.taken = { course: r.course, module: mid, part: 1, total_parts: 1, kind: 'spaced' };
        placed++;
      });
    });
    slots.sort(function (a, b) { return a.date.localeCompare(b.date) || a.order - b.order; });
    return { placed: placed, failed: failed };
  }

   
  function buildAdvice(cfg, mods, diag, opts) {
    var cands = [];

    
    cfg.rest_days.forEach(function (rd) {
      cands.push({
        id: 'open:' + rd,
        text: T('افتح ' + S.DAY_NAMES.ar[rd], 'Open ' + S.DAY_NAMES.en[rd]),
        onePerModule: false,
        apply: function (c) { c.rest_days = c.rest_days.filter(function (x) { return x !== rd; }); }
      });
    });
    
    if (!opts.onePerModule) {
      cands.push({
        id: 'one', text: T('اجعل كل وحدة جلسة واحدة', 'One session per module'),
        onePerModule: true, apply: function () {}
      });
    }
    
    if (cfg.sessions_per_day < 4) {
      var next = cfg.sessions_per_day + 1;
      cands.push({
        id: 'spd', text: T('ارفع إلى ' + next + ' جلسات يومياً', 'Raise to ' + next + ' sessions/day'),
        onePerModule: false, apply: function (c) { c.sessions_per_day = next; }
      });
    }
    
    var byCourse = cfg.courses.map(function (code) {
      var one = { courses: [code], modules: cfg.modules, session_minutes: cfg.session_minutes, parts_mode: cfg.parts_mode };
      return { code: code, n: buildUnits(one, mods, !!opts.onePerModule).length + 1 };
    }).sort(function (a, b) { return b.n - a.n; });
    byCourse.slice(0, 2).forEach(function (c) {
      cands.push({
        id: 'drop:' + c.code,
        text: T('أخرِج ' + c.code + ' من الخطة', 'Drop ' + c.code + ' from the plan'),
        onePerModule: false,
        apply: function (cf) {
          cf.courses = cf.courses.filter(function (x) { return x !== c.code; });
          delete cf.exam_dates[c.code];
        }
      });
    });
    
    if (cfg.start_date > todayStr()) {
      cands.push({
        id: 'earlier', text: T('ابدأ اليوم بدل ' + cfg.start_date, 'Start today instead of ' + cfg.start_date),
        onePerModule: false, apply: function (c) { c.start_date = todayStr(); }
      });
    }

    
    var out = [];
    cands.forEach(function (a) {
      var c2 = clone(cfg);
      a.apply(c2);
      var trial = computePlan(c2, mods, { onePerModule: opts.onePerModule || a.onePerModule, noAdvice: true });
      var td = trial.diagnostics;
      var dCap = td.capacity - diag.capacity;
      var dDem = td.demand - diag.demand;
      var parts = [];
      if (dCap) parts.push((dCap > 0 ? '+' : '−') + Math.abs(dCap) + ' ' + T('سعة', 'capacity'));
      if (dDem) parts.push((dDem > 0 ? '+' : '−') + Math.abs(dDem) + ' ' + T('طلب', 'demand'));
      if (!parts.length) parts.push(T('بلا أثر عددي', 'no numeric change'));
      out.push({
        id: a.id, text: a.text, delta: parts.join(' · '),
        enough: !!trial.ok, onePerModule: a.onePerModule, apply: a.apply
      });
    });
    
    out.sort(function (x, y) { return (y.enough ? 1 : 0) - (x.enough ? 1 : 0); });
    return out;
  }

  function spacingAdvice(cfg, placed, wanted, got) {
    var n = Object.keys(placed).filter(function (k) { return placed[k].part === placed[k].total; }).length;
    var wantSlots = n * SPACING_OFFSETS[wanted].length;
    var gotSlots = n * SPACING_OFFSETS[got].length;
    var need = wantSlots - gotSlots;
    var label = wanted === 'full' ? T('الحزمة الكاملة (بعد 3 و7 أيام)', 'the full package (after 3 and 7 days)')
                                  : T('الحزمة المصغّرة (بعد 3 أيام)', 'the lite package (after 3 days)');
    return T(
      'لتفعيل المراجعة المتباعدة — ' + label + ' — لكلّ الوحدات (' + n + ' وحدة) تحتاج ' + need +
      ' جلسة إضافية. لا تُفعَّل جزئياً: إمّا لكل الوحدات أو لا شيء.',
      'To enable spaced review — ' + label + ' — for all ' + n + ' modules you need ' + need +
      ' more sessions. It is never enabled partially: all modules or none.'
    );
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  
  
  
  function openWizard(tab, editExisting) {
    var d = S.data();
    var courses = S.semesterCourses().map(function (c) { return c.code; });
    if (!courses.length) {
      alert(T('أضِف مواد فصلك أولاً من صفحة الفصل.', 'Add your semester courses first.'));
      return;
    }
    clearBusy();
    wizard = {
      step: 1,
      tab: tab || autoTab(),
      cfg: {
        start_date: todayStr(),
        exam_dates: {},
        courses: courses.slice(),
        modules: {},
        sessions_per_day: 2,
        session_minutes: 60,
         
        parts_mode: 1,
        rest_days: ['friday', 'saturday'],
        spacing: 'off',                     
        avoid_conflicts: true,              
        window: { start_time: DEFAULT_START },   
        extra_reviews: []
      },
      mods: {},
      onePerModule: false,
      editing: false,
      result: null
    };
    seedExamDates();

     
    if (editExisting) {
      var p = normalizePlan(editExisting);
      wizard.editing = true;
      wizard.cfg.start_date = todayStr();
      wizard.cfg.exam_dates = clone(p.exam_dates);
      wizard.cfg.courses = p.courses.filter(function (c) { return courses.indexOf(c) !== -1; });
      if (!wizard.cfg.courses.length) wizard.cfg.courses = courses.slice();
      wizard.cfg.modules = clone(p.modules);
      wizard.cfg.sessions_per_day = p.sessions_per_day;
      wizard.cfg.session_minutes = p.session_minutes;
      wizard.cfg.parts_mode = p.parts_mode;
      wizard.cfg.rest_days = p.rest_days.slice();
      wizard.cfg.spacing = p.spacing || 'off';
      wizard.cfg.avoid_conflicts = p.avoid_conflicts !== false;
      wizard.cfg.extra_reviews = clone(p.extra_reviews);
      wizard.cfg.window = clone(p.window);
    }

    showWizard();
    loadModulesFor(courses).then(function (m) {
      wizard.mods = m;
      if (!wizard.editing) applyDefaultSelection();
      renderWizard();
    });
  }

   
  function focusOf(tab) {
    var fp = (S.data().settings || {}).focus_periods || {};
    return fp[tab] || {};
  }
  function autoTab() {
    var t = todayStr();
    var m = focusOf('midterm'), f = focusOf('final');
    if (f.start && t >= f.start) return 'final';
    if (m.end && t > m.end) return 'final';
    if (m.start && t >= m.start) return 'midterm';
    return activeTab || 'midterm';
  }
   
  function seedExamDates() {
    var d = S.data();
    var wantType = wizard.tab === 'midterm' ? 'midterm' : 'final';
    var fp = focusOf(wizard.tab);
    wizard.cfg.exam_dates = {};
    wizard.cfg.courses.forEach(function (c) {
      if (fp.start) wizard.cfg.exam_dates[c] = fp.start;
    });
    (d.exams || []).forEach(function (x) {
      if (x.exam_type === wantType && x.course_code) wizard.cfg.exam_dates[x.course_code] = x.date;
    });
    wizard.cfg.start_date = todayStr();
  }

   
  function applyDefaultSelection() {
    wizard.cfg.courses.forEach(function (code) {
      var list = wizard.mods[code] || [];
      var sel = [];
      list.forEach(function (m) {
        var n = modNum(m.id);
        if (wizard.tab === 'midterm') {
          if (n <= 6) sel.push(m.id);
        } else {
          if (n <= 6) setModuleStatus(code, m.id, 'mastered');
          else sel.push(m.id);
        }
      });
      
      wizard.cfg.modules[code] = sel.filter(function (id) { return moduleStatus(code, id) !== 'mastered'; });
    });
    persist();
  }

  function resetSelection() {
    wizard.cfg.courses.forEach(function (code) {
      (wizard.mods[code] || []).forEach(function (m) { setModuleStatus(code, m.id, 'new'); });
      wizard.cfg.modules[code] = [];
    });
    persist();
    renderWizard();
  }

  function showWizard() {
    var ov = document.getElementById('modal-plan');
    ov.style.display = '';
    renderWizard();
  }
  function closeWizard() {
    document.getElementById('modal-plan').style.display = 'none';
    wizard = null;
  }

  function renderWizard() {
    var box = document.getElementById('plan-wizard');
    if (!box || !wizard) return;
    var steps = [
      T('النوع والتواريخ', 'Type & dates'),
      T('المواد والوحدات', 'Courses & modules'),
      T('الإيقاع', 'Rhythm'),
      T('الجدوى والتوزيع', 'Feasibility & layout')
    ];
    var head = '<div class="ip-steps">' + steps.map(function (s, i) {
      var n = i + 1;
      var cls = wizard.step === n ? ' active' : (wizard.step > n ? ' done' : '');
      return '<span class="ip-step' + cls + '"><span class="ip-step-num">' + n + '</span>' + esc(s) + '</span>';
    }).join('<span class="ip-connector"></span>') + '</div>';

    var body = '';
    if (wizard.step === 1) body = stepDates();
    else if (wizard.step === 2) body = stepModules();
    else if (wizard.step === 3) body = stepRhythm();
    else body = stepResult();

    var nav = '<div class="sch-modal-actions">';
    if (wizard.step > 1) nav += '<button class="sch-btn sch-btn-secondary" id="ip-back">' + T('رجوع', 'Back') + '</button>';
    if (wizard.step < 4) nav += '<button class="sch-btn sch-btn-primary" id="ip-next">' + T('التالي', 'Next') + '</button>';
    if (wizard.step === 4 && wizard.result && wizard.result.ok) {
      nav += '<button class="sch-btn sch-btn-primary" id="ip-save">' + T('اعتماد الخطة', 'Save plan') + '</button>';
    }
    nav += '<button class="sch-btn sch-btn-secondary" id="ip-close">' + T('إغلاق', 'Close') + '</button></div>';

    box.innerHTML = head + '<div class="ip-body">' + body + '</div>' + nav;
    bindWizard();
  }

  function stepDates() {
     
    var h = wizard.editing
      ? '<div class="ip-note">' + esc(T('تُعدّل الآن خطة ' + (wizard.tab === 'midterm' ? 'الميدتيرم' : 'الفاينل') +
          ' — تُحفظ فوق نفسها ولا تُمسّ الخطة الأخرى.',
          'Editing the ' + wizard.tab + ' plan — it saves over itself and the other plan is untouched.')) + '</div>'
      : '<div class="ip-tabs">' +
        ['midterm','final'].map(function (t) {
          return '<button class="ip-tab' + (wizard.tab === t ? ' active' : '') + '" data-ptab="' + t + '">' +
            (t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final')) + '</button>';
        }).join('') + '</div>';
    h += '<p class="sch-editor-hint">' + T(
      'الخطتان تتعايشان: لكلٍّ تواريخها ووحداتها وحالة إتقانها.',
      'Both plans coexist: each keeps its own dates, modules and mastery state.') + '</p>';

     
    var fp = focusOf(wizard.tab);
    var auto = autoTab();
    h += '<div class="ip-note">' + esc(
      fp.start
        ? T('من إعدادات الجدول: فترة ' + (wizard.tab === 'midterm' ? 'الميدتيرم' : 'الفاينل') +
            ' تبدأ ' + fp.start + (fp.end ? ' وتنتهي ' + fp.end : '') + '. أُخذت بداية الفترة تاريخاً مبدئياً لكل اختبار.',
            'From schedule settings: the ' + wizard.tab + ' window starts ' + fp.start +
            (fp.end ? ' and ends ' + fp.end : '') + '. Its start was used as the initial exam date for every course.')
        : T('لم تُضبط فترات التركيز في إعدادات الجدول، فالتواريخ أدناه فارغة — اضبطها هناك مرة واحدة ولن تُسأل عنها ثانية.',
            'Focus periods are not set in schedule settings, so the dates below are empty — set them once there.')
    ) + (auto === wizard.tab ? '' : ' ' + esc(T('(التاريخ اليوم يرجّح خطة ' + (auto === 'final' ? 'الفاينل' : 'الميدتيرم') + '.)',
      '(Today\'s date suggests the ' + auto + ' plan.)'))) + '</div>';

    h += '<label class="sch-label">' + T('تاريخ بدء الخطة', 'Plan start date') + '</label>' +
      '<input type="date" class="sch-input" id="ip-start" value="' + wizard.cfg.start_date + '">';
    h += '<label class="sch-label">' + T('تاريخ اختبار كل مادة', 'Exam date per course') + '</label>';
    h += '<p class="sch-editor-hint">' + T(
      'يُضاف كلٌّ منها إلى الجدول وإلى صفحة المادة حدثاً لكامل اليوم، حتى تحدّد ساعته. وقابل للتعديل لاحقاً من لوحة الخطة.',
      'Each is added to the schedule and to the course page as an all-day event until you set its hour. Editable later from the plan panel.') + '</p>';
    wizard.cfg.courses.forEach(function (c) {
      h += '<div class="ip-row"><span class="ip-row-label"><span class="ip-dot" style="background:' +
        S.courseColor(c) + '"></span>' + esc(S.courseShort(c)) + '</span>' +
        '<input type="date" class="sch-input ip-exam" data-code="' + esc(c) + '" value="' +
        (wizard.cfg.exam_dates[c] || '') + '"></div>';
    });
    return h;
  }

  function stepModules() {
    if (!Object.keys(wizard.mods).length) {
      return '<p class="sch-editor-hint">' + T('جارٍ تحميل الوحدات…', 'Loading modules…') + '</p>';
    }
    var h = '<div class="sch-editor-subhead"><span>' + T('اختر وحدات كل مادة', 'Pick modules per course') + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-reset">' +
      T('إلغاء كل التحديدات والتقييم التلقائي', 'Clear all selections & auto-rating') + '</button></div>';
    h += '<p class="sch-editor-hint">' + T(
      'المربّع الأخضر = متقنة (لا تُوزَّع) · المحدَّد = يدخل الخطة · الباهت = خارجها. اضغط المربّع لتدوير حالته.',
      'Green = mastered (never scheduled) · selected = in the plan · faded = out. Click a square to cycle its state.') + '</p>';

    wizard.cfg.courses.forEach(function (code) {
      var list = wizard.mods[code] || [];
      var sel = wizard.cfg.modules[code] || [];
      h += '<div class="ip-course"><div class="ip-course-head">' +
        '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
        '<b>' + esc(S.courseShort(code)) + '</b>' +
        '<span class="ip-course-count">' + sel.length + '/' + list.length + '</span></div>';
      if (!list.length) {
        h += '<p class="sch-editor-hint">' + T('لا بيانات وحدات لهذه المادة.', 'No module data for this course.') + '</p></div>';
        return;
      }
      h += '<div class="ip-mods">';
      list.forEach(function (m) {
        var st = moduleStatus(code, m.id);
        var on = sel.indexOf(m.id) !== -1;
        var cls = st === 'mastered' ? 'is-mastered' : (on ? 'is-on' : 'is-off');
        var hrs = m.hours + (isAr() ? ' س' : 'h');
        h += '<button class="ip-mod ' + cls + '" data-code="' + esc(code) + '" data-mid="' + esc(m.id) + '" ' +
          'title="' + esc(modTitle(m) + ' · ' + T('صعوبة', 'difficulty') + ' ' + m.difficulty + '/10 · ' + hrs) + '">' +
          '<span class="ip-mod-n">' + modNum(m.id) + '</span>' +
          '<span class="ip-mod-t">' + esc(modTitle(m)) + '</span>' +
          '<span class="ip-mod-meta"><span class="ip-diff d' + Math.min(3, Math.ceil(m.difficulty / 3.5)) + '">' +
            m.difficulty + '</span><span class="ip-hours">' + esc(hrs) + '</span></span>' +
          '</button>';
      });
      h += '</div></div>';
    });
    return h;
  }

  function stepRhythm() {
    var c = wizard.cfg;
    var h = '';
    h += '<label class="sch-label">' + T('جلسات في اليوم', 'Sessions per day') + '</label><div class="ip-pills" data-group="spd">' +
      [1,2,3,4].map(function (n) {
        return '<button class="ip-pill' + (c.sessions_per_day === n ? ' active' : '') + '" data-spd="' + n + '">' + n + '</button>';
      }).join('') + '</div>';
    h += '<label class="sch-label">' + T('طول الجلسة (دقيقة)', 'Session length (min)') + '</label><div class="ip-pills">' +
      [45,60,90,120].map(function (n) {
        return '<button class="ip-pill' + (c.session_minutes === n ? ' active' : '') + '" data-smin="' + n + '">' + n + '</button>';
      }).join('') + '</div>';
    h += '<label class="sch-label">' + T('وقت أول جلسة', 'First session time') + '</label>' +
      '<div class="sch-timepick"><select class="tp-h"></select><span class="tp-colon">:</span>' +
      '<select class="tp-m"></select><select class="tp-mer"></select>' +
      '<input type="hidden" id="ip-start-time" value="' + c.window.start_time + '"></div>';
    h += '<label class="sch-label">' + T('أيام الراحة', 'Rest days') + '</label>' +
      '<p class="sch-editor-hint">' + T('الجمعة والسبت مغلقتان افتراضياً — افتحهما لو احتجت سعةً أكبر.',
        'Friday and Saturday are closed by default — open them if you need more capacity.') + '</p>' +
      '<div class="ip-pills">' + S.DAYS_ORDER.map(function (d) {
        return '<button class="ip-pill' + (c.rest_days.indexOf(d) !== -1 ? ' active' : '') + '" data-rest="' + d + '">' +
          esc(S.DAY_SHORT[isAr() ? 'ar' : 'en'][d]) + '</button>';
      }).join('') + '</div>';

     
    h += '<label class="sch-label">' + T('جلسات لكل وحدة', 'Sessions per module') + '</label>' +
      '<p class="sch-editor-hint">' + T(
        'الأصل جلسة واحدة لكل وحدة. و«تلقائي» يقسم ساعات الوحدة التقديرية على طول الجلسة (بين 1 و3) — فيضاعف الطلب على المواد الثقيلة.',
        'One session per module by default. "Auto" divides each module\'s estimated hours by the session length (1–3), which multiplies demand for heavy courses.') + '</p>' +
      '<div class="ip-pills">' +
      [[1, '1'], [2, '2'], [3, '3'], ['auto', T('تلقائي', 'Auto')]].map(function (p) {
        return '<button class="ip-pill' + (String(c.parts_mode) === String(p[0]) ? ' active' : '') +
          '" data-parts="' + p[0] + '">' + esc(String(p[1])) + '</button>';
      }).join('') + '</div>';

     
    h += '<label class="sch-label">' + T('التعارض مع المحاضرات', 'Lecture conflicts') + '</label>' +
      '<div class="ip-pills">' +
      [[true, T('انقل الجلسة لأقرب وقت بعد المحاضرة', 'Move the session after the lecture')],
       [false, T('اترك الجلسة في وقتها ولو تعارضت', 'Keep its time even if it clashes')]].map(function (p) {
        return '<button class="ip-pill' + ((c.avoid_conflicts !== false) === p[0] ? ' active' : '') +
          '" data-avoid="' + (p[0] ? '1' : '0') + '">' + esc(p[1]) + '</button>';
      }).join('') + '</div>';

     
    h += '<label class="sch-label">' + T('المراجعة المتباعدة', 'Spaced review') + '</label>' +
      '<p class="sch-editor-hint">' + T(
        'الحزمة الشاملة تُطبَّق على كل الوحدات أو لا تُطبَّق. وللاختيار وحدةً وحدة استعمل «مراجعات مخصّصة» أدناه — وهي الأصحّ، فالوحدات ليست سواءً.',
        'The blanket package applies to every module or none. To pick module by module use "custom reviews" below — the sounder path, since modules differ.') + '</p>' +
      '<div class="ip-pills">' +
      [['off',  T('بلا مراجعة متباعدة', 'No spaced review')],
       ['lite', T('حزمة مصغّرة (3 أيام)', 'Lite (3 days)')],
       ['full', T('حزمة كاملة (3 و7 أيام)', 'Full (3 & 7 days)')]].map(function (p) {
        return '<button class="ip-pill' + (c.spacing === p[0] ? ' active' : '') + '" data-spacing="' + p[0] + '">' + esc(p[1]) + '</button>';
      }).join('') + '</div>';

    h += extraReviewsHtml(c);
    return h;
  }

   
  function extraReviewsHtml(c) {
    var h = '<div class="sch-editor-subhead" style="margin-block-start:.7rem"><span>' +
      T('مراجعات مخصّصة', 'Custom reviews') + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-xr-add">＋ ' +
      T('أضف مراجعة', 'Add review') + '</button></div>';
    var list = c.extra_reviews || [];
    if (!list.length) {
      return h + '<p class="sch-editor-hint">' + T(
        'لا مراجعات مخصّصة. أضِف واحدة لتختار وحداتٍ بعينها ونافذة تواريخها.',
        'None yet. Add one to pick specific modules and their date window.') + '</p>';
    }
    list.forEach(function (r, i) {
      var mods = (wizard.mods[r.course] || []);
      h += '<div class="ip-xr" data-xr="' + i + '">' +
        '<div class="ip-xr-head">' +
          '<span class="ip-dot" style="background:' + S.courseColor(r.course) + '"></span>' +
          '<b>' + esc(S.courseShort(r.course)) + '</b>' +
          '<span class="ip-xr-count">' + (r.modules || []).length + ' ' + T('وحدة', 'modules') + '</span>' +
          '<button class="ip-xr-del" data-xrdel="' + i + '" title="' + T('حذف', 'Remove') + '">✕</button>' +
        '</div>' +
        '<div class="ip-xr-dates">' +
          '<label class="sch-label">' + T('من', 'From') + '</label>' +
          '<input type="date" class="sch-input ip-xr-from" data-xr="' + i + '" value="' + esc(r.from || '') + '">' +
          '<label class="sch-label">' + T('إلى', 'To') + '</label>' +
          '<input type="date" class="sch-input ip-xr-to" data-xr="' + i + '" value="' + esc(r.to || '') + '">' +
        '</div>' +
        '<div class="ip-xr-mods">' + mods.map(function (m) {
          var on = (r.modules || []).indexOf(m.id) !== -1;
          return '<button class="ip-xr-mod' + (on ? ' active' : '') + '" data-xr="' + i + '" data-mid="' +
            esc(m.id) + '" title="' + esc(modTitle(m)) + '">' + modNum(m.id) + '</button>';
        }).join('') + '</div></div>';
    });
    return h;
  }

  function stepResult() {
    if (!wizard.result) {
      wizard.result = computePlan(wizard.cfg, wizard.mods, { onePerModule: wizard.onePerModule });
    }
    var r = wizard.result, d = r.diagnostics;
    var h = '';
    if (!r.ok) {
       
      var headline;
      if (d.reason === 'conflict') {
        headline = T('السعة تكفي عدداً (' + d.demand + ' من ' + d.capacity + ') لكن ' + d.unplaced +
                     ' جلسة لا تجد يوماً متاحاً قبل موعد اختبار مادتها — المواد تتزاحم على الأيام نفسها.',
                     'Capacity is enough numerically (' + d.demand + ' of ' + d.capacity + ') but ' + d.unplaced +
                     ' sessions cannot find a day before their course exam — the courses compete for the same days.');
      } else if (d.reason === 'course_deadline') {
        headline = T('السعة الكلية تكفي، لكن مادةً أو أكثر لا يتّسع وقتها قبل اختبارها.',
                     'Total capacity is enough, but one or more courses have no room before their exam.');
      } else {
        headline = T('تحتاج ' + d.demand + ' جلسة ولديك ' + d.capacity + '.',
                     'You need ' + d.demand + ' sessions but have ' + d.capacity + '.');
      }
      h += '<div class="ip-infeasible"><b>⚠️ ' + esc(headline) + '</b></div>';
      h += capacityHtml(d.breakdown);
      var bad = Object.keys(d.per_course).filter(function (c) { return !d.per_course[c].ok; });
      if (bad.length) {
        h += '<p class="sch-editor-hint">' + T('المواد التي لا يتّسع وقتها قبل اختبارها: ', 'Courses without room before their exam: ') +
          bad.map(function (c) {
            return esc(S.courseShort(c)) + ' (' + d.per_course[c].need + '/' + d.per_course[c].cap + ')';
          }).join(' · ') + '</p>';
      }
      var anyEnough = d.advice.some(function (a) { return a.enough; });
      h += '<p class="sch-editor-hint">' + T('اختر حلاً — كل خيار جُرِّب فعلاً، و«يكفي وحده» تعني أن تطبيقه ينتج خطةً كاملة:',
        'Pick a remedy — each was actually simulated, and "enough alone" means applying it yields a complete plan:') +
        (anyEnough ? '' : ' <b>' + T('لا خيار يكفي وحده هنا — طبّق واحداً ثم أعد النظر في القائمة، فهي تُحسب من جديد بعد كل خطوة.',
          'No single option is enough here — apply one and look again; the list is recomputed after each step.') + '</b>') + '</p>';
      h += '<div class="ip-advice">' + d.advice.map(function (a, i) {
        return '<button class="ip-advice-item' + (a.enough ? ' is-enough' : '') + '" data-advice="' + i + '">' +
          '<span class="ip-advice-n">' + (i + 1) + '</span>' +
          '<span class="ip-advice-t">' + esc(a.text) + '</span>' +
          '<span class="ip-advice-d">' + esc(a.delta) + '</span>' +
          (a.enough ? '<span class="ip-advice-ok">' + T('يكفي وحده', 'enough alone') + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
       
      h += '<div class="ip-force-wrap">' +
        '<button class="sch-btn sch-btn-secondary sch-btn-block" id="ip-force">' +
        T('أدرج الخطة كما هي ودعني أُكملها يدوياً', 'Lay it out anyway and let me finish manually') + '</button>' +
        '<p class="sch-editor-hint">' + T(
          'يُوزَّع ما يتّسع له الوقت، وتُعرض الجلسات التي لم تجد مكاناً في لوحة الخطة لتضعها بنفسك.',
          'Whatever fits is laid out; the sessions that found no room are listed in the plan panel for you to place.') + '</p></div>';
      return h;
    }

    if (d.forced && d.unplaced) {
      h += '<div class="ip-note"><b>' + esc(T(
        d.unplaced + ' جلسة لم تجد مكاناً وأُبقيت خارج التوزيع.',
        d.unplaced + ' sessions found no room and were left out.')) + '</b> ' + esc(T(
        'ستجدها مسرودةً في لوحة الخطة لتضعها يدوياً.',
        'They are listed in the plan panel so you can place them by hand.')) + '</div>';
    }

    var byCourse = {};
    r.sessions.forEach(function (s) { byCourse[s.course] = (byCourse[s.course] || 0) + 1; });
    h += '<div class="ip-ok"><b>✅ ' + T('الخطة جاهزة', 'Plan ready') + '</b> — ' +
      T(r.sessions.length + ' جلسة على ' + countDays(r.sessions) + ' يوماً.',
        r.sessions.length + ' sessions across ' + countDays(r.sessions) + ' days.') + '</div>';
    h += '<div class="ip-summary">' + Object.keys(byCourse).map(function (c) {
      return '<span class="sch-chip" style="--chip-color:' + S.courseColor(c) + '">' +
        '<span class="sch-chip-dot"></span>' + esc(S.courseShort(c)) + ' · ' + byCourse[c] + '</span>';
    }).join('') + '</div>';
    var sp = r.spacing;
    h += '<p class="sch-editor-hint">' + T('المراجعة المتباعدة: ', 'Spaced review: ') +
      (sp === 'full' ? T('حزمة كاملة لكل الوحدات', 'full package for every module')
       : sp === 'lite' ? T('حزمة مصغّرة لكل الوحدات', 'lite package for every module')
       : T('غير مفعّلة', 'not enabled')) + '</p>';
    if (d.spacing_advice) h += '<div class="ip-note">' + esc(d.spacing_advice) + '</div>';
    h += '<div class="ip-preview">' + previewHtml(r.sessions) + '</div>';
    return h;
  }

   
  function capacityHtml(b) {
    if (!b) return '';
    var rows = [];
    if (b.past) {
      return '<div class="ip-note">' + esc(T(
        'تاريخ البدء بعد آخر اختبار — لا يوم واحد بين الاثنين. قدّم البدء أو أخّر تواريخ الاختبارات.',
        'The start date is after the last exam — not a single day lies between them. Move the start earlier or the exams later.')) + '</div>';
    }
    if (!b.last_exam) {
      return '<div class="ip-note">' + esc(T('لا تاريخ اختبار واحد محدَّد — لا سقف للخطة فلا شرائح.',
        'No exam date set at all — the plan has no ceiling, hence no slots.')) + '</div>';
    }
    var win = b.window;
    rows.push(T('المدى: ' + b.days_total + ' يوماً حتى ' + b.last_exam,
                'Range: ' + b.days_total + ' days until ' + b.last_exam));
    rows.push(T('أيام راحة مغلقة: ' + b.days_rest, 'Closed rest days: ' + b.days_rest));
    rows.push(T('نافذة اليوم: ' + S.fmtMin12(win.start) + ' – ' + S.fmtMin12(win.end),
                'Day window: ' + S.fmtMin12(win.start) + ' – ' + S.fmtMin12(win.end)));
    if (b.days_full) rows.push(T('أيام لم يبقَ فيها متّسع لجلسة واحدة: ' + b.days_full,
                                 'Days with no room for even one session: ' + b.days_full));
    if (b.days_partial) rows.push(T('أيام يتّسع بعضها فقط: ' + b.days_partial,
                                    'Days that fit only part of the request: ' + b.days_partial));
    return '<ul class="ip-caplist">' + rows.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
  }

  function countDays(sessions) {
    var seen = {};
    sessions.forEach(function (s) { seen[s.date] = 1; });
    return Object.keys(seen).length;
  }

  function previewHtml(sessions) {
    var byDate = {};
    sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    return Object.keys(byDate).sort().map(function (d) {
      var dd = s2d(d);
      return '<div class="ip-prev-day"><div class="ip-prev-date">' +
        esc(S.DAY_SHORT[isAr() ? 'ar' : 'en'][S.DAYS_ORDER[dd.getDay()]] + ' ' + dd.getDate() + ' ' +
            S.MONTH_NAMES[isAr() ? 'ar' : 'en'][dd.getMonth()]) + '</div>' +
        byDate[d].map(function (s) {
          return '<div class="ip-prev-item" style="--event-color:' + S.courseColor(s.course) + '">' +
            '<span class="ip-prev-time">' + esc(S.fmtTime12(s.start_time)) + '</span>' +
            '<span class="ip-prev-course">' + esc(S.courseShort(s.course)) + '</span>' +
            '<span class="ip-prev-mod">' + esc(sessionLabel(s)) + '</span></div>';
        }).join('') + '</div>';
    }).join('');
  }

  function sessionLabel(s) {
    if (s.kind === 'buffer') return T('مراجعة ما قبل الاختبار', 'Pre-exam review');
    if (s.kind === 'spaced') return T('مراجعة متباعدة · وحدة ' + modNum(s.module), 'Spaced review · module ' + modNum(s.module));
    var base = T('الوحدة ' + modNum(s.module), 'Module ' + modNum(s.module));
    if (s.total_parts > 1) {
      base += ' · ' + T('الجلسة ' + s.part + ' من ' + s.total_parts, 'session ' + s.part + ' of ' + s.total_parts);
    }
    return base;
  }

  function bindWizard() {
    var box = document.getElementById('plan-wizard');
    if (!box) return;
    S.TP.build(box);

    bind('ip-close', closeWizard);
    bind('ip-back', function () { wizard.step--; wizard.result = null; renderWizard(); });
    bind('ip-next', function () {
      if (wizard.step === 1) {
        wizard.cfg.start_date = document.getElementById('ip-start').value || todayStr();
        var missing = [];
        box.querySelectorAll('.ip-exam').forEach(function (i) {
          var c = i.getAttribute('data-code');
          if (i.value) wizard.cfg.exam_dates[c] = i.value; else missing.push(c);
        });
        if (missing.length === wizard.cfg.courses.length) {
          alert(T('حدّد تاريخ اختبار واحداً على الأقل.', 'Set at least one exam date.'));
          return;
        }
        
        wizard.cfg.courses = wizard.cfg.courses.filter(function (c) { return wizard.cfg.exam_dates[c]; });
      } else if (wizard.step === 3) {
        var st = document.getElementById('ip-start-time');
        if (st) wizard.cfg.window.start_time = st.value;
      }
      wizard.step++;
      wizard.result = null;
      renderWizard();
    });
    bind('ip-save', function () { commitPlan(); });
    bind('ip-reset', resetSelection);

    box.querySelectorAll('[data-ptab]').forEach(function (b) {
      b.addEventListener('click', function () {
        wizard.tab = this.getAttribute('data-ptab');
        seedExamDates();
        applyDefaultSelection();
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-mod').forEach(function (b) {
      b.addEventListener('click', function () {
        var code = this.getAttribute('data-code'), mid = this.getAttribute('data-mid');
        cycleModule(code, mid);
        renderWizard();
      });
    });
     
    function keepTime() {
      var st = document.getElementById('ip-start-time');
      if (st && st.value) wizard.cfg.window.start_time = st.value;
    }
    function redraw() { keepTime(); renderWizard(); }

    box.querySelectorAll('[data-spd]').forEach(function (b) {
      b.addEventListener('click', function () { wizard.cfg.sessions_per_day = parseInt(this.getAttribute('data-spd'), 10); redraw(); });
    });
    box.querySelectorAll('[data-smin]').forEach(function (b) {
      b.addEventListener('click', function () { wizard.cfg.session_minutes = parseInt(this.getAttribute('data-smin'), 10); redraw(); });
    });
    box.querySelectorAll('[data-parts]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = this.getAttribute('data-parts');
        wizard.cfg.parts_mode = (v === 'auto') ? 'auto' : parseInt(v, 10);
        redraw();
      });
    });
    box.querySelectorAll('[data-avoid]').forEach(function (b) {
      b.addEventListener('click', function () { wizard.cfg.avoid_conflicts = this.getAttribute('data-avoid') === '1'; redraw(); });
    });
    box.querySelectorAll('[data-rest]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = this.getAttribute('data-rest');
        var i = wizard.cfg.rest_days.indexOf(d);
        if (i === -1) wizard.cfg.rest_days.push(d); else wizard.cfg.rest_days.splice(i, 1);
        redraw();
      });
    });
    box.querySelectorAll('[data-spacing]').forEach(function (b) {
      b.addEventListener('click', function () { wizard.cfg.spacing = this.getAttribute('data-spacing'); redraw(); });
    });

    
    bind('ip-xr-add', function () {
      keepTime();
      var c = wizard.cfg.courses[0];
      if (!c) return;
      var from = wizard.cfg.start_date;
      var to = '';
      wizard.cfg.courses.forEach(function (x) {
        var d = wizard.cfg.exam_dates[x];
        if (d && (!to || d > to)) to = d;
      });
      wizard.cfg.extra_reviews.push({ course: c, modules: [], from: from, to: to || from });
      renderWizard();
    });
    box.querySelectorAll('[data-xrdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        keepTime();
        wizard.cfg.extra_reviews.splice(parseInt(this.getAttribute('data-xrdel'), 10), 1);
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-xr-mod').forEach(function (b) {
      b.addEventListener('click', function () {
        keepTime();
        var r = wizard.cfg.extra_reviews[parseInt(this.getAttribute('data-xr'), 10)];
        if (!r) return;
        var mid = this.getAttribute('data-mid');
        var i = (r.modules = r.modules || []).indexOf(mid);
        if (i === -1) r.modules.push(mid); else r.modules.splice(i, 1);
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-xr-from, .ip-xr-to').forEach(function (i) {
      i.addEventListener('change', function () {
        var r = wizard.cfg.extra_reviews[parseInt(this.getAttribute('data-xr'), 10)];
        if (!r) return;
        r[this.classList.contains('ip-xr-from') ? 'from' : 'to'] = this.value;
      });
    });
    box.querySelectorAll('.ip-xr-head b').forEach(function (b) {
      b.style.cursor = 'pointer';
      b.addEventListener('click', function () {
        keepTime();
        var wrap = this.closest('.ip-xr');
        var r = wizard.cfg.extra_reviews[parseInt(wrap.getAttribute('data-xr'), 10)];
        if (!r) return;
        var i = wizard.cfg.courses.indexOf(r.course);
        r.course = wizard.cfg.courses[(i + 1) % wizard.cfg.courses.length];
        r.modules = [];
        renderWizard();
      });
    });

    
    bind('ip-force', function () {
      wizard.result = computePlan(wizard.cfg, wizard.mods, { onePerModule: wizard.onePerModule, force: true });
      renderWizard();
    });
    box.querySelectorAll('[data-advice]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = wizard.result.diagnostics.advice[parseInt(this.getAttribute('data-advice'), 10)];
        if (!a) return;
        if (a.onePerModule) wizard.onePerModule = true;
        a.apply(wizard.cfg);
        wizard.result = null;
        renderWizard();
      });
    });

    function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
  }

   
  function cycleModule(code, mid) {
    var sel = wizard.cfg.modules[code] || (wizard.cfg.modules[code] = []);
    var st = moduleStatus(code, mid);
    var i = sel.indexOf(mid);
    if (st === 'mastered') { setModuleStatus(code, mid, 'new'); if (i === -1) sel.push(mid); }
    else if (i !== -1) sel.splice(i, 1);
    else { setModuleStatus(code, mid, 'mastered'); }
    persist();
  }

  function commitPlan() {
    var r = wizard.result;
    if (!r || !r.ok) return;
    var st = store();
    st.plans[wizard.tab] = {
      created_at: new Date().toISOString(),
      start_date: wizard.cfg.start_date,
      exam_dates: clone(wizard.cfg.exam_dates),
      courses: wizard.cfg.courses.slice(),
      modules: clone(wizard.cfg.modules),
      sessions_per_day: wizard.cfg.sessions_per_day,
      session_minutes: wizard.cfg.session_minutes,
      parts_mode: wizard.cfg.parts_mode,
      rest_days: wizard.cfg.rest_days.slice(),
      spacing: r.spacing,
      avoid_conflicts: wizard.cfg.avoid_conflicts !== false,
      extra_reviews: clone(wizard.cfg.extra_reviews || []),
      window: clone(wizard.cfg.window),
      sessions: r.sessions,
      unplaced: r.diagnostics.unplaced_list || [],
      diagnostics: {
        feasible: !r.diagnostics.forced, demand: r.diagnostics.demand, capacity: r.diagnostics.capacity,
        advice: [], spacing_advice: r.diagnostics.spacing_advice || null,
        moved: r.diagnostics.moved || 0
      }
    };
     
    syncExamEvents(wizard.tab, wizard.cfg.exam_dates);
    st.active = wizard.tab;
    activeTab = wizard.tab;
    persist();
    closeWizard();
    S.render();
    openPanel();
  }

   
  function syncExamEvents(tab, examDates) {
    var d = S.data();
    if (!Array.isArray(d.exams)) d.exams = [];
    var type = tab === 'midterm' ? 'midterm' : 'final';
    dedupeExams();
    Object.keys(examDates || {}).forEach(function (code) {
      var date = examDates[code];
      if (!date) return;
      var found = null;
      for (var i = 0; i < d.exams.length; i++) {
        var x = d.exams[i];
        if (x.course_code === code && (x.exam_type || 'exam') === type) { found = x; break; }
      }
      if (found) {
        if (found.date !== date) found.date = date;
        return;                                  
      }
      d.exams.push({
        id: 'exam_ip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        course_code: code, date: date,
        start_time: '', end_time: '', all_day: true,
        exam_type: type, room: '', notes: '', plan_tab: tab
      });
    });
    dedupeExams();
  }

   
  function dedupeExams() {
    var d = S.data();
    if (!Array.isArray(d.exams)) return 0;
    var best = {}, order = [];
    d.exams.forEach(function (x) {
      if (!x || !x.course_code) return;
      var k = x.course_code + '|' + (x.exam_type || 'exam');
      var prev = best[k];
      if (!prev) { best[k] = x; order.push(k); return; }
      best[k] = richerExam(prev, x);
    });
    var out = order.map(function (k) { return best[k]; });
    
    d.exams.forEach(function (x) { if (!x || !x.course_code) out.push(x); });
    var removed = d.exams.length - out.length;
    d.exams = out;
    return removed;
  }
  function richerExam(a, b) {
    var wa = examWeight(a), wb = examWeight(b);
    return wb > wa ? b : a;
  }
  function examWeight(x) {
    var w = 0;
    if (x.start_time) w += 4;          
    if (x.room) w += 2;
    if (x.notes) w += 1;
    if (!x.plan_tab) w += 1;           
    return w;
  }

   
  function planEndDate(p) {
    var last = '';
    Object.keys(p.exam_dates || {}).forEach(function (c) {
      var d = p.exam_dates[c];
      if (d && d > last) last = d;
    });
    return last;
  }

   
  function normalizePlan(p) {
    if (!p || typeof p !== 'object') return null;
    if (!Array.isArray(p.sessions)) p.sessions = [];
    if (!Array.isArray(p.courses) || !p.courses.length) {
      var seen = {};
      p.sessions.forEach(function (s) { if (s.course) seen[s.course] = 1; });
      p.courses = Object.keys(seen);
    }
    if (!p.exam_dates || typeof p.exam_dates !== 'object') p.exam_dates = {};
    if (!p.modules || typeof p.modules !== 'object') p.modules = {};
    if (!Array.isArray(p.rest_days)) p.rest_days = [];
    if (!Array.isArray(p.unplaced)) p.unplaced = [];
    if (!Array.isArray(p.extra_reviews)) p.extra_reviews = [];
    if (!p.window || typeof p.window !== 'object') p.window = { start_time: DEFAULT_START };
    if (!p.session_minutes) p.session_minutes = 60;
    if (!p.sessions_per_day) p.sessions_per_day = 2;
    if (p.parts_mode === undefined) p.parts_mode = 1;

     
    var end = planEndDate(p);
    var seen = {};
    p.sessions = p.sessions.filter(function (s) {
      if (!s || !s.date) return false;
      if (end && s.date > end) return false;
      if (seen[s.id]) return false;
      seen[s.id] = 1;
      return true;
    });
    return p;
  }

  
  
  
  function openPanel() {
    var ov = document.getElementById('modal-plan-panel');
    if (!ov) return;
    activeTab = store().active || activeTab;
    panelView = 'main'; editingSession = null;
    clearBusy();
    renderPanel();
    ov.style.display = '';
  }
  function closePanel() { document.getElementById('modal-plan-panel').style.display = 'none'; }

  
  
  
  
  
  
  var panelView = 'main';
  var editingSession = null;

  function seriesKey(s) { return s.course + '|' + s.order; }
  function orderLabel(n) {
    var ar = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
    return T('الجلسة ' + (ar[n] || (n + 1)), 'Session ' + (n + 1));
  }
   
  function nSessions(n) {
    if (window.Garden && window.Garden.smartCount) {
      return window.Garden.smartCount(n, ['جلسة', 'جلستان', 'جلسات'], ['session', 'sessions']);
    }
    return n + ' ' + T('جلسة', 'sessions');
  }
  function backToMain() { panelView = 'main'; editingSession = null; renderPanel(); }

  function openTimesEditor() { panelView = 'times'; renderPanel(); }
  function openSessionEditor(id) {
    var p = normalizePlan(store().plans[activeTab]);
    var s = p && p.sessions.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    editingSession = id;
    panelView = 'session';
    openPanelRaw();
  }
  function openPanelRaw() {
    var ov = document.getElementById('modal-plan-panel');
    if (!ov) return;
    renderPanel();
    ov.style.display = '';
  }

   
  var detailsFor = null;
  function openModuleDetails(code, mid) {
    detailsFor = { code: code, mid: mid };
    panelView = 'details';
    openPanelRaw();
    loadModules(code).then(function () { if (panelView === 'details') renderPanel(); });
  }

  var DETAIL_GROUPS = [
    { key: 'must_know',       icon: 'fa-bullseye',            ar: 'يجب أن تعرف',  en: 'Must know' },
    { key: 'must_memorize',   icon: 'fa-pen-to-square',       ar: 'يجب أن تحفظ',  en: 'Must memorize' },
    { key: 'common_mistakes', icon: 'fa-triangle-exclamation', ar: 'انتبه لهذه',  en: 'Watch out' }
  ];

  function renderDetails(box) {
    var code = detailsFor.code, mid = detailsFor.mid;
    var mod = (modulesCache[code] || []).filter(function (m) { return m.id === mid; })[0];
    var h = '<div class="ip-subnav"><button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-back-main">← ' +
      T('رجوع', 'Back') + '</button><b>' + T('تفاصيل الوحدة', 'Module details') + '</b></div>';
    if (!mod) {
      h += '<p class="sch-editor-hint">' + T('جارٍ التحميل…', 'Loading…') + '</p>';
      box.innerHTML = h; bindPanel(); return;
    }
    h += '<div class="ip-det-head">' +
      '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
      '<span class="ip-det-num">' + modNum(mid) + '</span>' +
      '<b class="ip-det-title">' + esc(modTitle(mod)) + '</b>' +
      '<span class="ip-diff d' + Math.min(3, Math.ceil(mod.difficulty / 3.5)) + '">' + mod.difficulty + '</span>' +
      '</div>';

    var any = false;
    DETAIL_GROUPS.forEach(function (g) {
      var items = [];
      (mod.topics || []).forEach(function (t) { items = items.concat(fieldList(t, g.key)); });
      if (!items.length) return;
      any = true;
      h += '<div class="ip-det-group"><div class="ip-det-glabel">' +
        '<i class="fa-solid ' + g.icon + '"></i> ' + esc(isAr() ? g.ar : g.en) +
        '<span class="ip-det-count">' + items.length + '</span></div>' +
        '<ul class="ip-det-list">' + items.map(function (x) {
          return '<li>' + esc(x) + '</li>';
        }).join('') + '</ul></div>';
    });
    if (!any) h += '<p class="sch-editor-hint">' + T('لا تفاصيل محفوظة لهذه الوحدة.', 'No stored details for this module.') + '</p>';

    h += '<div class="sch-modal-actions">' +
      '<button class="sch-btn sch-btn-primary" id="ip-det-page">' + T('صفحة الوحدة', 'Module page') + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-panel-close">' + T('إغلاق', 'Close') + '</button></div>';
    box.innerHTML = h;
    bindPanel();
    var pg = document.getElementById('ip-det-page');
    if (pg) pg.addEventListener('click', function () { openModule(code, mid); });
  }

  function renderTimesEditor(box, p) {
    var groups = {};
    p.sessions.forEach(function (s) { (groups[seriesKey(s)] = groups[seriesKey(s)] || []).push(s); });
    var keys = Object.keys(groups).sort();
    var h = '<div class="ip-subnav"><button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-back-main">← ' +
      T('رجوع', 'Back') + '</button><b>' + T('أوقات الجلسات', 'Session times') + '</b></div>';
    if (!keys.length) {
      h += '<p class="sch-editor-hint">' + T('لا جلسات في هذه الخطة.', 'No sessions in this plan.') + '</p>';
      box.innerHTML = h; bindPanel(); return;
    }
    h += '<p class="sch-editor-hint">' + T(
      'كل سطر سلسلةٌ مستقلّة: المادة مع رتبة جلستها في اليوم. تغيير الوقت هنا يسري على كل جلسات السلسلة؛ ولتعديل يومٍ واحد افتح جلسته من الجدول.',
      'Each row is its own series: a course plus its slot rank in the day. Changing the time here applies to the whole series; to change a single day open that session from the schedule.') + '</p>';
    keys.forEach(function (k) {
      var list = groups[k], s0 = list[0];
      h += '<div class="ip-series" data-series="' + esc(k) + '">' +
        '<div class="ip-series-head">' +
          '<span class="ip-dot" style="background:' + S.courseColor(s0.course) + '"></span>' +
          '<b>' + esc(S.courseShort(s0.course)) + '</b>' +
          '<span class="ip-series-meta">' + esc(orderLabel(s0.order)) + ' · ' + esc(nSessions(list.length)) + '</span>' +
        '</div>' +
        '<div class="ip-series-fields">' +
          '<div class="sch-timepick"><select class="tp-h"></select><span class="tp-colon">:</span>' +
          '<select class="tp-m"></select><select class="tp-mer"></select>' +
          '<input type="hidden" class="ip-series-time" value="' + esc(s0.start_time || DEFAULT_START) + '"></div>' +
          '<input type="number" class="sch-input ip-series-min" min="15" max="240" step="5" value="' + (s0.minutes || 60) + '">' +
          '<button class="sch-btn sch-btn-primary sch-btn-xs ip-series-apply">' + T('طبّق', 'Apply') + '</button>' +
        '</div></div>';
    });
    box.innerHTML = h;
    S.TP.build(box);
    bindPanel();
  }

  function renderSessionEditor(box, p) {
    var s = p.sessions.filter(function (x) { return x.id === editingSession; })[0];
    if (!s) { backToMain(); return; }
    var n = p.sessions.filter(function (x) { return seriesKey(x) === seriesKey(s); }).length;
    var h = '<div class="ip-subnav"><button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-back-main">← ' +
      T('رجوع', 'Back') + '</button><b>' + T('تعديل الجلسة', 'Edit session') + '</b></div>';
    h += '<div class="ip-note">' +
      '<span class="ip-dot" style="background:' + S.courseColor(s.course) + '"></span> ' +
      esc(S.courseShort(s.course)) + ' · ' + esc(sessionLabel(s)) + ' · ' + esc(s.date) + '</div>';
    h += '<label class="sch-label">' + T('الوقت', 'Time') + '</label>' +
      '<div class="sch-timepick"><select class="tp-h"></select><span class="tp-colon">:</span>' +
      '<select class="tp-m"></select><select class="tp-mer"></select>' +
      '<input type="hidden" id="ip-se-time" value="' + esc(s.start_time || DEFAULT_START) + '"></div>';
    h += '<label class="sch-label">' + T('المدّة (دقيقة)', 'Duration (min)') + '</label>' +
      '<input type="number" class="sch-input" id="ip-se-min" min="15" max="240" step="5" value="' + (s.minutes || 60) + '">';
    h += '<p class="sch-editor-hint">' + T(
      'سلسلة هذه الجلسة: ' + S.courseShort(s.course) + ' · ' + orderLabel(s.order) + ' (' + nSessions(n) + '). ' +
      'التعديل على السلسلة يمسّها كلها ولا يمسّ جلسة المادة الأخرى في اليوم نفسه.',
      'This session\'s series: ' + S.courseShort(s.course) + ' · ' + orderLabel(s.order) + ' (' + nSessions(n) + '). ' +
      'Applying to the series touches them all and leaves the course\'s other daily slot alone.') + '</p>';
    h += '<div class="sch-modal-actions">' +
      '<button class="sch-btn sch-btn-primary" id="ip-se-one">' + T('هذه الجلسة فقط', 'This session only') + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-se-all">' + T('كل جلسات السلسلة', 'The whole series') + '</button>' +
      '<button class="sch-btn sch-btn-danger" id="ip-se-del">' + T('حذف الجلسة', 'Delete session') + '</button>' +
      '</div>';
    box.innerHTML = h;
    S.TP.build(box);
    bindPanel();
  }

  function applySessionEdit(all) {
    var p = normalizePlan(store().plans[activeTab]);
    var s = p && p.sessions.filter(function (x) { return x.id === editingSession; })[0];
    if (!s) return;
    var t = document.getElementById('ip-se-time').value || s.start_time;
    var m = parseInt(document.getElementById('ip-se-min').value, 10) || s.minutes;
    var key = seriesKey(s);
    p.sessions.forEach(function (x) {
      if (all ? seriesKey(x) === key : x.id === s.id) { x.start_time = t; x.minutes = m; }
    });
    persist(); backToMain(); S.render();
  }

  function renderPanel() {
    var box = document.getElementById('plan-panel');
    var st = store();
    if (panelView === 'details' && detailsFor) return renderDetails(box);
    if (panelView !== 'main') {
      var pv = normalizePlan(st.plans[activeTab]);
      if (!pv) { panelView = 'main'; }
      else if (panelView === 'times') return renderTimesEditor(box, pv);
      else if (panelView === 'session') return renderSessionEditor(box, pv);
    }
    var h = '<div class="ip-tabs">' + ['midterm','final'].map(function (t) {
      var has = !!st.plans[t];
      return '<button class="ip-tab' + (activeTab === t ? ' active' : '') + '" data-paneltab="' + t + '">' +
        (t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final')) +
        (has ? '' : ' <span class="ip-tab-empty">•</span>') + '</button>';
    }).join('') + '</div>';

    var p = normalizePlan(st.plans[activeTab]);
    if (!p) {
      h += '<p class="sch-editor-hint">' + T('لا خطة لهذا التبويب بعد.', 'No plan for this tab yet.') + '</p>' +
        '<button class="sch-btn sch-btn-primary sch-btn-block" id="ip-new">' +
        T('أنشئ خطة ' + (activeTab === 'midterm' ? 'الميدتيرم' : 'الفاينل'),
          'Create the ' + activeTab + ' plan') + '</button>';
      box.innerHTML = h;
      bindPanel();
      return;
    }

    h += '<div class="ip-state">' + esc(stateText(p)) + '</div>';
    h += '<div class="ip-progress-wrap">' + trackerHtml(p) + '</div>';
    h += '<div class="sch-editor-subhead"><span>' + T('تواريخ الاختبارات', 'Exam dates') + '</span></div>';
    p.courses.forEach(function (c) {
      h += '<div class="ip-row"><span class="ip-row-label"><span class="ip-dot" style="background:' +
        S.courseColor(c) + '"></span>' + esc(S.courseShort(c)) + '</span>' +
        '<input type="date" class="sch-input ip-panel-exam" data-code="' + esc(c) + '" value="' + (p.exam_dates[c] || '') + '"></div>';
    });

     
    if (p.unplaced.length) {
      h += '<div class="sch-editor-subhead"><span>' + T('لم تُوزَّع', 'Not scheduled') + '</span></div>' +
        '<p class="sch-editor-hint">' + T(
          'هذه الجلسات لم تجد يوماً متاحاً قبل موعد اختبار مادتها. أضِفها يدوياً من زر ＋ في الجدول، أو أعد التوزيع بعد فتح يوم راحة أو تقليل جلسات الوحدة.',
          'These found no day before their course exam. Add them by hand from ＋ in the schedule, or rebuild after opening a rest day or lowering sessions per module.') + '</p>' +
        '<div class="ip-unplaced">' + p.unplaced.map(function (u) {
          return '<span class="sch-chip" style="--chip-color:' + S.courseColor(u.course) + '">' +
            '<span class="sch-chip-dot"></span>' + esc(S.courseShort(u.course)) + ' · ' +
            esc(T('وحدة ', 'M') + modNum(u.module)) + (u.total > 1 ? ' (' + u.part + '/' + u.total + ')' : '') + '</span>';
        }).join('') + '</div>';
    }

    h += '<div class="sch-editor-subhead"><span>' + T('جلسات اليوم', "Today's sessions") + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-times">' +
      T('تعديل الأوقات', 'Edit times') + '</button></div>';
    h += '<div id="ip-today-cards">' + T('…', '…') + '</div>';

     
    var isOn = st.active === activeTab;
    h += '<div class="sch-modal-actions">' +
      '<button class="sch-btn ' + (isOn ? 'sch-btn-secondary' : 'sch-btn-primary') + '" id="ip-activate">' +
        (isOn ? T('⏸ أوقفها مؤقتاً', '⏸ Pause') : T('▶ فعّلها', '▶ Activate')) + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-rebuild">' + T('تعديل وإعادة التوزيع', 'Edit & rebuild') + '</button>' +
      '<button class="sch-btn sch-btn-danger" id="ip-delete">' + T('حذف الخطة', 'Delete plan') + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-panel-close">' + T('إغلاق', 'Close') + '</button></div>';
    if (!isOn) {
      h += '<p class="sch-editor-hint">' + T(
        'الخطة موقوفة: جلساتها لا تظهر في الجدول، وكل بياناتها محفوظة كما هي.',
        'Paused: its sessions are hidden from the schedule and all its data is kept intact.') + '</p>';
    }

    box.innerHTML = h;
    bindPanel();
    renderTodayCards(document.getElementById('ip-today-cards'), p);
  }

   
  function stateText(p) {
    var today = todayStr();
    var nextExam = null;
    p.courses.forEach(function (c) {
      var d = p.exam_dates[c];
      if (d && d >= today && (!nextExam || d < nextExam.date)) nextExam = { course: c, date: d };
    });
    var doneN = p.sessions.filter(function (s) { return s.done; }).length;
    var total = p.sessions.length;

    if (nextExam && nextExam.date === today) {
      return T('اليوم اختبار ' + S.courseShort(nextExam.course) + '. لا وحدات جديدة — راجع رؤوس الأقلام وثِق بما بنيته.',
               'Today is your ' + S.courseShort(nextExam.course) + ' exam. No new modules — skim your headlines and trust the work.');
    }
    if (!nextExam) {
      return T('انتهت اختبارات هذه الخطة. راجع ما استقرّ وما لم يستقرّ قبل أن تُغلقها.',
               'This plan\'s exams are done. Review what stuck and what did not before closing it.');
    }
    var left = diffDays(today, nextExam.date);
    if (p.start_date > today) {
      return T('تبدأ الخطة في ' + p.start_date + ' — ' + total + ' جلسة بانتظارك، وأقرب اختبار بعد ' + left + ' يوماً.',
               'The plan starts on ' + p.start_date + ' — ' + total + ' sessions ahead, nearest exam in ' + left + ' days.');
    }
    if (left <= 1) {
      return T('اختبار ' + S.courseShort(nextExam.course) + ' غداً. الليلة للمراجعة والنوم، لا لفتح وحدة جديدة.',
               S.courseShort(nextExam.course) + ' exam tomorrow. Tonight is for review and sleep, not a new module.');
    }
    var pct = total ? Math.round(doneN / total * 100) : 0;
    return T('أنجزت ' + doneN + ' من ' + total + ' جلسة (' + pct + '٪) وأمامك ' + left + ' يوماً حتى ' + S.courseShort(nextExam.course) + '.',
             doneN + ' of ' + total + ' sessions done (' + pct + '%), ' + left + ' days until ' + S.courseShort(nextExam.course) + '.');
  }

   
  function trackerHtml(p) {
    return p.courses.map(function (code) {
      var all = modulesCache[code] || [];
      var sel = p.modules[code] || [];
      var scheduled = {};
      p.sessions.forEach(function (s) { if (s.course === code && s.module) scheduled[s.module] = 1; });
      var nM = 0, nD = 0, nN = 0;
      var squares = all.map(function (m) {
        var st = moduleStatus(code, m.id);
        var cls, lab;
        if (st === 'mastered') { cls = 'is-mastered'; nM++; lab = T('متقنة', 'mastered'); }
        else if (scheduled[m.id]) { cls = 'is-scheduled'; nD++; lab = T('موزّعة', 'scheduled'); }
        else { cls = 'is-none'; nN++; lab = T('لم تُوزَّع', 'not scheduled'); }
        return '<button class="ip-sq ' + cls + '" data-code="' + esc(code) + '" data-mid="' + esc(m.id) + '" ' +
          'style="--chip-color:' + S.courseColor(code) + '" title="' +
          esc(modNum(m.id) + ' · ' + modTitle(m) + ' — ' + lab) + '">' + modNum(m.id) + '</button>';
      }).join('');
      return '<div class="ip-track"><div class="ip-track-head">' +
        '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
        '<b>' + esc(S.courseShort(code)) + '</b>' +
        '<span class="ip-track-count">' + nD + '/' + all.length + ' ' + T('موزّعة', 'scheduled') +
        ' · ' + nM + ' ' + T('متقنة', 'mastered') + ' · ' + nN + ' ' + T('متبقّية', 'left') + '</span></div>' +
        '<div class="ip-squares">' + squares + '</div></div>';
    }).join('');
  }

  function bindPanel() {
    var box = document.getElementById('plan-panel');
    bind('ip-back-main', backToMain);
    bind('ip-se-one', function () { applySessionEdit(false); });
    bind('ip-se-all', function () { applySessionEdit(true); });
    bind('ip-se-del', function () {
      if (!confirm(T('حذف هذه الجلسة من الخطة؟', 'Delete this session from the plan?'))) return;
      var p = normalizePlan(store().plans[activeTab]);
      p.sessions = p.sessions.filter(function (x) { return x.id !== editingSession; });
      persist(); backToMain(); S.render();
    });
    box.querySelectorAll('.ip-series-apply').forEach(function (b) {
      b.addEventListener('click', function () {
        var wrap = this.closest('.ip-series');
        var key = wrap.getAttribute('data-series');
        var t = wrap.querySelector('.ip-series-time').value;
        var m = parseInt(wrap.querySelector('.ip-series-min').value, 10) || 60;
        var p = normalizePlan(store().plans[activeTab]);
        p.sessions.forEach(function (x) { if (seriesKey(x) === key) { x.start_time = t; x.minutes = m; } });
        persist(); renderPanel(); S.render();
      });
    });
    box.querySelectorAll('[data-paneltab]').forEach(function (b) {
      b.addEventListener('click', function () { activeTab = this.getAttribute('data-paneltab'); renderPanel(); });
    });
    bind('ip-panel-close', closePanel);
    bind('ip-new', function () { closePanel(); openWizard(activeTab); });
    bind('ip-rebuild', function () { closePanel(); openWizard(activeTab, store().plans[activeTab]); });
    bind('ip-times', function () { openTimesEditor(); });
    bind('ip-activate', function () {
      var st = store();
      st.active = (st.active === activeTab) ? null : activeTab;   
      persist(); renderPanel(); S.render();
    });
     
    bind('ip-delete', function () {
      var st = store();
      var kin = String(activeTab);
      var keys = Object.keys(st.plans).filter(function (k) { return k === kin || k.indexOf(kin) === 0; });
      var n = keys.reduce(function (a, k) { return a + ((st.plans[k] && st.plans[k].sessions) || []).length; }, 0);
      if (!confirm(T(
        'حذف كل خطط ' + (kin === 'midterm' ? 'الميدتيرم' : 'الفاينل') + ' (' + keys.length + ') و' + n +
        ' جلسة، ومعها اختبارات هذه الخطط من الجدول؟ حالة إتقان الوحدات تبقى كما هي.',
        'Delete all ' + kin + ' plans (' + keys.length + ') with ' + n +
        ' sessions, plus the exams they created? Module mastery is kept.'))) return;
      keys.forEach(function (k) { delete st.plans[k]; });
      var d = S.data();
      if (Array.isArray(d.exams)) {
        d.exams = d.exams.filter(function (x) { return !(x && x.plan_tab === kin); });
      }
      if (st.active === activeTab || keys.indexOf(st.active) !== -1) st.active = Object.keys(st.plans)[0] || null;
      persist(); renderPanel(); S.render();
    });
    box.querySelectorAll('.ip-panel-exam').forEach(function (i) {
      i.addEventListener('change', function () {
        var p = store().plans[activeTab];
        if (!p) return;
        p.exam_dates[this.getAttribute('data-code')] = this.value;
        var m = {}; m[this.getAttribute('data-code')] = this.value;
        syncExamEvents(activeTab, m);              
        persist();
        renderPanel();
        S.render();
      });
    });
    box.querySelectorAll('.ip-sq').forEach(function (b) {
      b.addEventListener('click', function () {
        var code = this.getAttribute('data-code'), mid = this.getAttribute('data-mid');
        var st = moduleStatus(code, mid);
        setModuleStatus(code, mid, st === 'mastered' ? 'new' : 'mastered');
        persist(); renderPanel(); S.render();
      });
    });
    function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
  }

  
  
  
  function fieldList(topic, key) {
    var v = isAr() ? topic[key] : (topic[key + '_en'] || topic[key]);
    if (!v) return [];
    return Array.isArray(v) ? v : [String(v)];
  }

  function sessionCard(s, mod) {
    var color = S.courseColor(s.course);
    var title = mod ? modTitle(mod) : sessionLabel(s);
    var diff = mod ? mod.difficulty : null;
     
    var counts = 0;
    if (mod && mod.topics) {
      DETAIL_GROUPS.forEach(function (g) {
        mod.topics.forEach(function (t) { counts += fieldList(t, g.key).length; });
      });
    }
    var body = counts
      ? '<button class="ip-card-details" data-ipdet="' + esc(s.course) + '|' + esc(s.module) + '">' +
          '<i class="fa-solid fa-circle-info"></i><span>' +
          esc(T('ماذا تعرف وتحفظ وتنتبه له', 'What to know, memorize and watch')) + '</span>' +
          '<span class="ip-card-detcount">' + counts + '</span></button>'
      : '<p class="sch-editor-hint">' + T('لا تفاصيل محفوظة لهذه الوحدة.', 'No stored details for this module.') + '</p>';

    return '<div class="ip-card' + (s.done ? ' is-done' : '') + '" style="--event-color:' + color + '">' +
      '<div class="ip-card-head">' +
        '<span class="ip-card-time">' + esc(S.fmtTime12(s.start_time)) + '</span>' +
        '<span class="ip-card-course">' + esc(S.courseShort(s.course)) + '</span>' +
        (diff ? '<span class="ip-diff d' + Math.min(3, Math.ceil(diff / 3.5)) + '">' + diff + '</span>' : '') +
        '<span class="ip-card-mins">' + s.minutes + T(' د', 'm') + '</span>' +
      '</div>' +
      '<div class="ip-card-title">' +
        (s.module ? '<span class="ip-card-modn">' + modNum(s.module) + '</span>' : '') +
        esc(title) + '</div>' +
      '<div class="ip-card-sub">' + esc(sessionLabel(s)) + '</div>' +
      '<div class="ip-card-body">' + body + '</div>' +
      '<div class="ip-card-actions">' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-ipedit="' + esc(s.id) + '">' +
          T('الوقت', 'Time') + '</button>' +
        (s.module ? '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-ipmod="' + esc(s.course) + '|' + esc(s.module) + '">' +
          T('صفحة الوحدة', 'Module page') + '</button>' : '') +
        '<button class="sch-btn ' + (s.done ? 'sch-btn-secondary' : 'sch-btn-primary') + ' sch-btn-xs" data-ipdone="' + esc(s.id) + '">' +
          (s.done ? T('تراجع', 'Undo') : T('أتممتها', 'Done')) + '</button>' +
      '</div></div>';
  }

  function renderTodayCards(box, p) {
    if (!box) return;
    var today = todayStr();
    var list = p.sessions.filter(function (s) { return s.date === today; });
    if (!list.length) {
      box.innerHTML = '<p class="sch-editor-hint">' + T('لا جلسات مكثّفة اليوم.', 'No intensive sessions today.') + '</p>';
      return;
    }
    var codes = {};
    list.forEach(function (s) { codes[s.course] = 1; });
    loadModulesFor(Object.keys(codes)).then(function (mods) {
      box.innerHTML = '<div class="ip-cards">' + list.map(function (s) {
        var mod = (mods[s.course] || []).filter(function (m) { return m.id === s.module; })[0];
        return sessionCard(s, mod);
      }).join('') + '</div>';
      bindCards(box);
    });
  }

  function bindCards(box) {
    box.querySelectorAll('[data-ipdone]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = this.getAttribute('data-ipdone');
        var p = store().plans[activeTab];
        if (!p) return;
        var s = p.sessions.filter(function (x) { return x.id === id; })[0];
        if (s) { s.done = !s.done; persist(); renderPanel(); S.render(); }
      });
    });
    box.querySelectorAll('[data-ipmod]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = this.getAttribute('data-ipmod').split('|');
        openModule(p[0], p[1]);
      });
    });
    box.querySelectorAll('[data-ipdet]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = this.getAttribute('data-ipdet').split('|');
        openModuleDetails(p[0], p[1]);
      });
    });
    box.querySelectorAll('[data-ipedit]').forEach(function (b) {
      b.addEventListener('click', function () { openSessionEditor(this.getAttribute('data-ipedit')); });
    });
  }

   
  function openModule(code, mid) {
    var cat = S.catalog();
    var c = (cat && cat.courses ? cat.courses : []).filter(function (x) { return x.code === code; })[0];
    if (!c || !c.path) { alert(T('لا صفحة لهذه المادة.', 'No page for this course.')); return; }
    var n = String(modNum(mid)).padStart(2, '0');
    window.location.href = '../' + c.path + 'M' + n + '.html';
  }

  
  
  
  function renderSettingsSection(box) {
    if (!box) return;
    var st = store();
    var lines = ['midterm','final'].map(function (t) {
      var p = st.plans[t];
      var label = t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final');
      if (!p) return '<div class="ip-row"><span class="ip-row-label">' + label + '</span><span class="sch-editor-hint">' +
        T('لا خطة', 'No plan') + '</span></div>';
      var done = p.sessions.filter(function (s) { return s.done; }).length;
      return '<div class="ip-row"><span class="ip-row-label">' + label +
        (st.active === t ? ' <span class="ip-tab-empty">●</span>' : '') + '</span>' +
        '<span class="sch-editor-hint">' + done + '/' + p.sessions.length + ' ' + T('جلسة', 'sessions') + '</span></div>';
    }).join('');

    box.innerHTML = '<div class="sch-editor-subhead"><span>' + T('الخطط المكثّفة', 'Intensive plans') + '</span></div>' +
      '<p class="sch-editor-hint">' + T(
        'خطتان متعايشتان لكلٍّ تواريخها ووحداتها. جلساتها تُعرض في الجدول ولا تُنسخ إلى أوقات المذاكرة العادية.',
        'Two coexisting plans, each with its own dates and modules. Their sessions appear in the schedule and are never copied into regular study blocks.') + '</p>' +
      lines +
      '<button class="sch-btn sch-btn-primary sch-btn-block" id="ip-open-panel" style="margin-top:.5rem">' +
      T('إدارة الخطط المكثّفة', 'Manage intensive plans') + '</button>';

    var b = document.getElementById('ip-open-panel');
    if (b) b.addEventListener('click', function () {
      document.getElementById('modal-editor').style.display = 'none';
      openPanel();
    });
  }

  
  
  
  function init() {
    S = window.GardenSchedule;
    if (!S) return;
    activeTab = store().active || 'midterm';

     
    var st = store(), dirty = 0;
    Object.keys(st.plans).forEach(function (k) {
      var p = st.plans[k];
      var n = (p && p.sessions) ? p.sessions.length : 0;
      normalizePlan(p);
      if (p && p.sessions.length !== n) dirty += n - p.sessions.length;
    });
    dirty += dedupeExams();
    if (dirty) { persist(); }
    
    var codes = [];
    Object.keys(store().plans).forEach(function (t) {
      (store().plans[t].courses || []).forEach(function (c) { if (codes.indexOf(c) === -1) codes.push(c); });
    });
     
    if (codes.length) loadModulesFor(codes).then(function () { S.render(); });

    var closeBtn = document.getElementById('plan-panel-x');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    var wizX = document.getElementById('plan-wizard-x');
    if (wizX) wizX.addEventListener('click', closeWizard);
    document.addEventListener('garden:languageChanged', function () {
      if (wizard) renderWizard();
      if (document.getElementById('modal-plan-panel').style.display !== 'none') renderPanel();
    });
  }

  window.GardenSchedulePlan = {
    init: init,
    openWizard: function (tab) { if (S) openWizard(tab); },
    openPanel: function () { if (S) openPanel(); },
    renderSettingsSection: renderSettingsSection,
    openModule: function (code, mid) { if (S) openModule(code, mid); },
     
    moduleTitle: function (code, mid) {
      if (!S || !code || !mid) return '';
      var m = (modulesCache[code] || []).filter(function (x) { return x.id === mid; })[0];
      return m ? modTitle(m) : '';
    },
    moduleNum: function (mid) { return modNum(mid); },
    openDetails: function (code, mid) { if (S) openModuleDetails(code, mid); },
    editSession: function (id) { if (S) openSessionEditor(id); },
     
    todaySessions: function () {
      var s = window.GardenSchedule;
      if (!s) return [];
      var d = s.data();
      var it = d && d.intensive;
      var p = (it && it.active && it.plans) ? it.plans[it.active] : null;
      if (!p) return [];
      var t = s.fmtLocalDate(new Date());
      return p.sessions.filter(function (x) { return x.date === t; });
    },
    sessionCardHtml: function (s, mod) { return sessionCard(s, mod); },
    loadModules: function (code) { return loadModules(code); },
    bindCards: bindCards
  };
})();
