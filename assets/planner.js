/*
  Digital Garden — Hybrid Rules-First Planner Engine
  Final file prepared for integration/testing.
  Purpose:
  1) Build the calendar skeleton locally (study/rest/busy/exam/golden review).
  2) Let AI assign modules only inside allowed slots.
  3) Validate and repair the AI distribution deterministically.
  4) Generate per-session content after the schedule becomes valid.

  This file is intentionally standalone so you can test the engine without
  risking the current planner file. It exposes:
    window.HybridPlannerEngine

  Main methods:
    - buildSkeleton(curriculumMap, userConfig)
    - buildAssignmentPayload(curriculumMap, userConfig, skeleton)
    - validateAssignment(curriculumMap, userConfig, skeleton, aiAssignment)
    - repairAssignment(curriculumMap, userConfig, skeleton, aiAssignment)
    - materializePlan(curriculumMap, userConfig, skeleton, repairedAssignment)
    - buildAssignmentPrompt(curriculumMap, userConfig, payload)
    - buildContentPrompt(curriculumMap, plan, session)
    - generateHybridPlanLocally(curriculumMap, userConfig)

  Design note:
  - “Success” is guaranteed only when legality lives locally.
  - AI is never trusted to decide what is legal.
  - AI chooses from allowed candidates, then a validator/repair layer enforces rules.
*/
(function () {
  'use strict';

  const DAY_MAP = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const DEFAULTS = {
    goldenReviewWindowDays: 5,
    minGoldenReviewUnits: 1,
    hardCapSessionsPerDay: 6,
    allowGoldenReviewOnRestDay: true,
    enforcePrerequisites: true,
    enforceNoCourseAfterExam: true,
    enforcePerModuleUnitsExactly: true,
    aiDistributionMode: 'assign_only',
    fallbackModeMap: {
      excellent: 'flash',
      good: 'full',
      weak: 'deep',
      not_studied: 'deep'
    },
    ratingWeights: {
      not_studied: 1.0,
      weak: 0.75,
      good: 0.4,
      excellent: 0.15
    },
    modeUnits: {
      deep: 1,
      full: 1,
      flash: 0.5,
      exam: 0
    }
  };

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function mergeConfig(userConfig) {
    const cfg = clone(userConfig || {});
    cfg.rest_days = Array.isArray(cfg.rest_days) ? cfg.rest_days : ['friday', 'saturday'];
    cfg.busy_dates = Array.isArray(cfg.busy_dates) ? cfg.busy_dates : [];
    cfg.courses = cfg.courses || {};
    cfg.daily_sessions = Number(cfg.daily_sessions || 2);
    cfg.modules_per_session = Number(cfg.modules_per_session || 1);
    cfg.start_date = cfg.start_date || getLocalDateStr(new Date());
    cfg.hybrid_rules = Object.assign({}, DEFAULTS, cfg.hybrid_rules || {});
    return cfg;
  }

  function getLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseLocalDate(dateStr) {
    const [y, m, d] = (dateStr || '').split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function addDays(dateStr, n) {
    const d = parseLocalDate(dateStr);
    d.setDate(d.getDate() + n);
    return getLocalDateStr(d);
  }

  function daysBetween(a, b) {
    const ad = parseLocalDate(a);
    const bd = parseLocalDate(b);
    ad.setHours(0, 0, 0, 0);
    bd.setHours(0, 0, 0, 0);
    return Math.round((bd - ad) / 86400000);
  }

  function isSameOrAfter(a, b) {
    return a >= b;
  }

  function dayNameFromDateStr(dateStr) {
    const d = parseLocalDate(dateStr);
    return Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
  }

  function safeCourseName(curriculumMap, courseId, lang) {
    const c = curriculumMap?.courses?.[courseId];
    if (!c) return courseId;
    return lang === 'en' ? (c.name_en || c.name || courseId) : (c.name || c.name_en || courseId);
  }

  function naturalModuleSort(a, b) {
    const na = Number(String(a).replace(/\D/g, ''));
    const nb = Number(String(b).replace(/\D/g, ''));
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  }

  function buildCourseExamMap(userConfig) {
    const out = {};
    for (const [cid, cfg] of Object.entries(userConfig.courses || {})) {
      if (cfg?.active && cfg?.exam_date) out[cid] = cfg.exam_date;
    }
    return out;
  }

  function getPlanningEndDate(userConfig) {
    const exams = Object.values(buildCourseExamMap(userConfig));
    if (!exams.length) return addDays(userConfig.start_date, 30);
    const latest = exams.slice().sort().at(-1);
    return addDays(latest, 2);
  }

  function isDateBlocked(userConfig, dateStr) {
    const dayName = dayNameFromDateStr(dateStr);
    if (userConfig.rest_days.includes(dayName)) return true;
    if (userConfig.busy_dates.includes(dateStr)) return true;
    return false;
  }

  function getStudyDates(userConfig) {
    const end = getPlanningEndDate(userConfig);
    const dates = [];
    let cur = userConfig.start_date;
    while (cur <= end) {
      dates.push(cur);
      cur = addDays(cur, 1);
    }
    return dates;
  }

  function findLastAvailableStudyDateBefore(userConfig, examDate) {
    let cur = addDays(examDate, -1);
    while (cur >= userConfig.start_date) {
      if (!isDateBlocked(userConfig, cur) && cur < examDate) return cur;
      cur = addDays(cur, -1);
    }
    return null;
  }

  function moduleTopics(curriculumMap, courseId, moduleId) {
    return curriculumMap?.courses?.[courseId]?.modules?.[moduleId]?.topics || [];
  }

  function extractModulePrereqs(curriculumMap, courseId, moduleId) {
    const reqs = new Set();
    for (const t of moduleTopics(curriculumMap, courseId, moduleId)) {
      for (const p of (t.prerequisites || [])) {
        const m = String(p).match(new RegExp(`^${courseId}(M\\d+)`));
        if (m && m[1] !== moduleId) reqs.add(m[1]);
      }
    }
    return Array.from(reqs).sort(naturalModuleSort);
  }

  function moduleDifficulty(curriculumMap, courseId, moduleId) {
    return Number(curriculumMap?.courses?.[courseId]?.modules?.[moduleId]?.module_difficulty || 5);
  }

  function unitDemandFromRating(userConfig, rating) {
    const modeMap = userConfig.hybrid_rules.fallbackModeMap;
    const mode = modeMap[rating] || 'deep';
    const unitsPerSession = userConfig.hybrid_rules.modeUnits[mode] || 1;
    return { mode, units: unitsPerSession };
  }

  function buildPriorityScore(userConfig, rating, diff) {
    const w = userConfig.hybrid_rules.ratingWeights[rating] ?? 1.0;
    return Math.round(((w * 0.65) + ((diff / 10) * 0.35)) * 1000) / 1000;
  }

  function computeExactModuleDemand(curriculumMap, userConfig) {
    const demand = [];
    for (const [courseId, cfg] of Object.entries(userConfig.courses || {})) {
      if (!cfg?.active) continue;
      const modules = (cfg.included_modules || []).slice().sort(naturalModuleSort);
      for (const moduleId of modules) {
        const rating = cfg.self_rating?.[moduleId] || 'not_studied';
        const diff = moduleDifficulty(curriculumMap, courseId, moduleId);
        const exact = cfg.module_unit_overrides?.[moduleId];
        let requiredUnits;
        let preferredMode;
        if (typeof exact === 'number' && exact > 0) {
          requiredUnits = exact;
          preferredMode = exact <= 0.5 ? 'flash' : rating === 'good' ? 'full' : rating === 'excellent' ? 'flash' : 'deep';
        } else {
          const base = unitDemandFromRating(userConfig, rating);
          requiredUnits = base.units;
          preferredMode = base.mode;
        }
        demand.push({
          course_id: courseId,
          module_id: moduleId,
          rating,
          difficulty: diff,
          prerequisite_modules: extractModulePrereqs(curriculumMap, courseId, moduleId),
          exam_date: cfg.exam_date || null,
          required_units: requiredUnits,
          remaining_units: requiredUnits,
          preferred_mode: preferredMode,
          course_order_key: cfg.exam_date || '9999-12-31',
          priority_score: buildPriorityScore(userConfig, rating, diff)
        });
      }
    }
    return demand.sort((a, b) => {
      if (a.course_order_key !== b.course_order_key) return a.course_order_key.localeCompare(b.course_order_key);
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      if (a.course_id !== b.course_id) return a.course_id.localeCompare(b.course_id);
      return naturalModuleSort(a.module_id, b.module_id);
    });
  }

  function buildSkeleton(curriculumMap, rawUserConfig) {
    const userConfig = mergeConfig(rawUserConfig);
    const courseExamMap = buildCourseExamMap(userConfig);
    const dates = getStudyDates(userConfig);
    const slots = [];
    const days = [];
    const warnings = [];

    for (const dateStr of dates) {
      const examCourses = Object.entries(courseExamMap).filter(([, d]) => d === dateStr).map(([cid]) => cid);
      let dayType = 'study';
      if (examCourses.length) dayType = 'exam';
      else if (userConfig.busy_dates.includes(dateStr)) dayType = 'busy';
      else if (userConfig.rest_days.includes(dayNameFromDateStr(dateStr))) dayType = 'rest';

      const day = {
        date: dateStr,
        day_type: dayType,
        exam_courses: examCourses,
        slot_ids: []
      };

      if (dayType === 'study') {
        for (let s = 1; s <= userConfig.daily_sessions; s++) {
          const slotId = `slot_${dateStr}_${s}`;
          day.slot_ids.push(slotId);
          slots.push({
            slot_id: slotId,
            date: dateStr,
            slot_index: s,
            slot_type: 'study',
            unit_capacity: 1,
            allowed_courses: Object.keys(userConfig.courses).filter(cid => userConfig.courses[cid]?.active),
            notes: []
          });
        }
      }

      days.push(day);
    }

    for (const [courseId, examDate] of Object.entries(courseExamMap)) {
      const lastStudyDate = findLastAvailableStudyDateBefore(userConfig, examDate);
      const inWindow = lastStudyDate && daysBetween(lastStudyDate, examDate) <= userConfig.hybrid_rules.goldenReviewWindowDays;
      let goldenDate = lastStudyDate;

      if (!goldenDate && userConfig.hybrid_rules.allowGoldenReviewOnRestDay) {
        let cursor = addDays(examDate, -1);
        while (cursor >= userConfig.start_date && daysBetween(cursor, examDate) <= userConfig.hybrid_rules.goldenReviewWindowDays) {
          if (!userConfig.busy_dates.includes(cursor)) {
            goldenDate = cursor;
            break;
          }
          cursor = addDays(cursor, -1);
        }
      }

      if (!goldenDate || (!inWindow && !userConfig.hybrid_rules.allowGoldenReviewOnRestDay)) {
        warnings.push({ type: 'missing_golden_window', course_id: courseId, exam_date: examDate });
        continue;
      }

      let existingDay = days.find(d => d.date === goldenDate);
      if (!existingDay) {
        existingDay = { date: goldenDate, day_type: 'goldenreview', exam_courses: [], slot_ids: [] };
        days.push(existingDay);
      }

      if (existingDay.day_type === 'rest' || existingDay.day_type === 'study' || existingDay.day_type === 'goldenreview' || existingDay.day_type === 'mixed') {
        existingDay.day_type = existingDay.day_type === 'study' ? 'mixed' : 'goldenreview';
        const slotId = `slot_${goldenDate}_golden_${courseId}`;
        existingDay.slot_ids.push(slotId);
        slots.push({
          slot_id: slotId,
          date: goldenDate,
          slot_index: existingDay.slot_ids.length,
          slot_type: 'golden_review',
          unit_capacity: 1,
          locked_course_id: courseId,
          allowed_courses: [courseId],
          notes: ['last_available_review_before_exam']
        });
      }
    }

    days.sort((a, b) => a.date.localeCompare(b.date));
    slots.sort((a, b) => a.date.localeCompare(b.date) || a.slot_index - b.slot_index);

    return {
      engine: 'hybrid_rules_first',
      version: '1.0.0',
      config: userConfig,
      days,
      slots,
      warnings
    };
  }

  function buildAssignmentPayload(curriculumMap, rawUserConfig, skeleton) {
    const userConfig = mergeConfig(rawUserConfig);
    const moduleDemand = computeExactModuleDemand(curriculumMap, userConfig);

    return {
      rules: {
        ai_distribution_mode: userConfig.hybrid_rules.aiDistributionMode,
        enforce_prerequisites: userConfig.hybrid_rules.enforcePrerequisites,
        enforce_no_course_after_exam: userConfig.hybrid_rules.enforceNoCourseAfterExam,
        enforce_per_module_units_exactly: userConfig.hybrid_rules.enforcePerModuleUnitsExactly,
        allowed_unit_values: [0.5, 1],
        slot_count: skeleton.slots.length
      },
      slots: skeleton.slots.map(s => ({
        slot_id: s.slot_id,
        date: s.date,
        slot_type: s.slot_type,
        unit_capacity: s.unit_capacity,
        allowed_courses: s.allowed_courses,
        locked_course_id: s.locked_course_id || null,
        notes: s.notes || []
      })),
      modules: moduleDemand.map(m => ({
        course_id: m.course_id,
        module_id: m.module_id,
        rating: m.rating,
        difficulty: m.difficulty,
        prerequisite_modules: m.prerequisite_modules,
        exam_date: m.exam_date,
        required_units: m.required_units,
        preferred_mode: m.preferred_mode,
        priority_score: m.priority_score
      }))
    };
  }

  function buildAssignmentPrompt(curriculumMap, rawUserConfig, payload) {
    const userConfig = mergeConfig(rawUserConfig);
    const activeCourses = Object.keys(userConfig.courses).filter(cid => userConfig.courses[cid]?.active);
    return [
      'You are assigning modules to prebuilt calendar slots.',
      'Do NOT invent dates or slots.',
      'Do NOT change slot ids, units, dates, or day types.',
      'Only choose which module goes into each existing slot.',
      'You must follow these hard rules:',
      '1) Return JSON only.',
      '2) Each slot can hold at most one assignment record.',
      '3) allowed slot units are 0.5 or 1 only.',
      '4) Do not assign a course on or after its exam date.',
      '5) Respect prerequisites inside the same course.',
      '6) Golden review slots must use the locked course only and preferably the highest-priority remaining module of that course.',
      '7) Use each module exactly for its required_units total.',
      '8) If a module requires 0.5 units, assign it to exactly one slot with units=0.5.',
      '9) If a module requires 1 unit, assign it to exactly one slot with units=1.',
      '10) If you cannot complete everything, leave the slot empty rather than breaking rules.',
      '',
      `Plan type: ${userConfig.plan_type || 'general'}`,
      `Start date: ${userConfig.start_date}`,
      `Active courses: ${activeCourses.join(', ')}`,
      '',
      'JSON schema:',
      '{"assignments":[{"slot_id":"slot_...","course_id":"CS350","module_id":"M03","units":1,"mode":"deep","reason":"short reason"}]}',
      '',
      'Payload:',
      JSON.stringify(payload)
    ].join('\n');
  }

  function validateAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment) {
    const userConfig = mergeConfig(rawUserConfig);
    const payload = buildAssignmentPayload(curriculumMap, userConfig, skeleton);
    const slotMap = Object.fromEntries(skeleton.slots.map(s => [s.slot_id, s]));
    const moduleMap = Object.fromEntries(payload.modules.map(m => [`${m.course_id}:${m.module_id}`, clone(m)]));
    const errors = [];
    const warnings = [];
    const accepted = [];
    const bySlot = new Map();
    const accumulatedUnits = {};
    const firstScheduledDate = {};
    const rawAssignments = Array.isArray(aiAssignment?.assignments) ? aiAssignment.assignments : [];

    for (const a of rawAssignments) {
      const slot = slotMap[a.slot_id];
      const key = `${a.course_id}:${a.module_id}`;
      const mod = moduleMap[key];
      if (!slot) { errors.push({ type: 'unknown_slot', assignment: a }); continue; }
      if (bySlot.has(a.slot_id)) { errors.push({ type: 'duplicate_slot_assignment', assignment: a }); continue; }
      if (!mod) { errors.push({ type: 'unknown_module', assignment: a }); continue; }
      if (!slot.allowed_courses.includes(a.course_id)) { errors.push({ type: 'course_not_allowed_in_slot', assignment: a }); continue; }
      if (slot.locked_course_id && slot.locked_course_id !== a.course_id) { errors.push({ type: 'violates_locked_course', assignment: a }); continue; }
      if (![0.5, 1].includes(Number(a.units))) { errors.push({ type: 'illegal_units', assignment: a }); continue; }
      if (Number(a.units) > Number(slot.unit_capacity)) { errors.push({ type: 'exceeds_slot_capacity', assignment: a }); continue; }
      if (mod.exam_date && isSameOrAfter(slot.date, mod.exam_date)) { errors.push({ type: 'course_on_or_after_exam', assignment: a }); continue; }
      const priorUnits = accumulatedUnits[key] || 0;
      if (priorUnits + Number(a.units) > Number(mod.required_units)) { errors.push({ type: 'module_units_overflow', assignment: a }); continue; }

      if (userConfig.hybrid_rules.enforcePrerequisites && mod.prerequisite_modules.length) {
        const prereqDates = mod.prerequisite_modules.map(pm => firstScheduledDate[`${a.course_id}:${pm}`]).filter(Boolean);
        if (prereqDates.length !== mod.prerequisite_modules.length) {
          warnings.push({ type: 'prereq_not_scheduled_yet', assignment: a });
        } else if (prereqDates.some(d => d > slot.date)) {
          errors.push({ type: 'prerequisite_after_child', assignment: a });
          continue;
        }
      }

      bySlot.set(a.slot_id, true);
      accumulatedUnits[key] = priorUnits + Number(a.units);
      if (!firstScheduledDate[key] || slot.date < firstScheduledDate[key]) firstScheduledDate[key] = slot.date;
      accepted.push({
        slot_id: a.slot_id,
        date: slot.date,
        course_id: a.course_id,
        module_id: a.module_id,
        units: Number(a.units),
        mode: a.mode || mod.preferred_mode || 'deep',
        reason: a.reason || ''
      });
    }

    const deficits = [];
    for (const m of payload.modules) {
      const key = `${m.course_id}:${m.module_id}`;
      const used = accumulatedUnits[key] || 0;
      const remaining = Math.round((m.required_units - used) * 100) / 100;
      if (remaining > 0) deficits.push({ ...m, remaining_units: remaining });
    }

    const unusedSlots = skeleton.slots.filter(s => !bySlot.has(s.slot_id));
    return {
      valid: errors.length === 0 && deficits.length === 0,
      accepted_assignments: accepted,
      errors,
      warnings,
      deficits,
      unused_slots: unusedSlots
    };
  }

  function pickFallbackCandidates(deficits, slot, scheduledMap) {
    return deficits
      .filter(m => m.remaining_units > 0)
      .filter(m => slot.allowed_courses.includes(m.course_id))
      .filter(m => !m.exam_date || slot.date < m.exam_date)
      .filter(m => !m.prerequisite_modules.length || m.prerequisite_modules.every(pm => Boolean(scheduledMap[`${m.course_id}:${pm}`])))
      .sort((a, b) => {
        const goldenA = slot.locked_course_id === a.course_id ? 1 : 0;
        const goldenB = slot.locked_course_id === b.course_id ? 1 : 0;
        if (goldenB !== goldenA) return goldenB - goldenA;
        if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
        if (a.course_id !== b.course_id) return a.course_id.localeCompare(b.course_id);
        return naturalModuleSort(a.module_id, b.module_id);
      });
  }

  function repairAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment) {
    const validation = validateAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment);
    const repaired = validation.accepted_assignments.slice().sort((a, b) => a.date.localeCompare(b.date));
    const deficits = validation.deficits.map(clone);
    const scheduledMap = {};
    for (const a of repaired) scheduledMap[`${a.course_id}:${a.module_id}`] = a.date;

    for (const slot of validation.unused_slots.sort((a, b) => a.date.localeCompare(b.date) || a.slot_index - b.slot_index)) {
      const candidates = pickFallbackCandidates(deficits, slot, scheduledMap);
      if (!candidates.length) continue;
      const c = candidates[0];
      const assignUnits = Math.min(slot.unit_capacity, c.remaining_units);
      if (![0.5, 1].includes(assignUnits)) continue;
      repaired.push({
        slot_id: slot.slot_id,
        date: slot.date,
        course_id: c.course_id,
        module_id: c.module_id,
        units: assignUnits,
        mode: slot.slot_type === 'golden_review' ? 'flash' : (c.preferred_mode || 'deep'),
        reason: 'auto_repair_fallback'
      });
      scheduledMap[`${c.course_id}:${c.module_id}`] = slot.date;
      c.remaining_units = Math.round((c.remaining_units - assignUnits) * 100) / 100;
    }

    const finalValidation = validateAssignment(curriculumMap, rawUserConfig, skeleton, { assignments: repaired });
    return {
      repaired_assignments: repaired.sort((a, b) => a.date.localeCompare(b.date)),
      validation_before: validation,
      validation_after: finalValidation,
      success: finalValidation.errors.length === 0 && finalValidation.deficits.length === 0
    };
  }

  function formatDayLabel(dateStr, lang) {
    const d = parseLocalDate(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return lang === 'en' ? `${month}/${day}` : `${day}/${month}`;
  }

  function buildSessionContentFromCurriculum(curriculumMap, courseId, moduleId, lang) {
    const mod = curriculumMap?.courses?.[courseId]?.modules?.[moduleId];
    if (!mod) return { must_know_today: [], must_memorize_today: [], ai_note: '' };
    const mustKnow = [];
    const mustMem = [];
    for (const t of (mod.topics || [])) {
      if (lang === 'en') {
        if (Array.isArray(t.must_know_en)) mustKnow.push(...t.must_know_en.slice(0, 1));
        else if (t.must_know_en) mustKnow.push(t.must_know_en);
        if (Array.isArray(t.must_memorize_en)) mustMem.push(...t.must_memorize_en.slice(0, 1));
        else if (t.must_memorize_en) mustMem.push(t.must_memorize_en);
      } else {
        if (Array.isArray(t.must_know)) mustKnow.push(...t.must_know.slice(0, 1));
        else if (t.must_know) mustKnow.push(t.must_know);
        if (Array.isArray(t.must_memorize)) mustMem.push(...t.must_memorize.slice(0, 1));
        else if (t.must_memorize) mustMem.push(t.must_memorize);
      }
    }
    return {
      must_know_today: Array.from(new Set(mustKnow)).slice(0, 3),
      must_memorize_today: Array.from(new Set(mustMem)).slice(0, 2),
      ai_note: lang === 'en'
        ? `Focus on ${mod.title_en || mod.title || moduleId}, then solve one representative exam-style question.`
        : `ركّز على ${mod.title || mod.title_en || moduleId} ثم حل سؤالًا تمثيليًا واحدًا بصيغة اختبار.`
    };
  }

  function materializePlan(curriculumMap, rawUserConfig, skeleton, repairedAssignment, lang = 'ar') {
    const userConfig = mergeConfig(rawUserConfig);
    const assignments = repairedAssignment.repaired_assignments || repairedAssignment.accepted_assignments || [];
    const byDate = {};
    for (const d of skeleton.days) {
      byDate[d.date] = {
        date: d.date,
        day_label: formatDayLabel(d.date, lang),
        day_type: d.day_type,
        sessions: []
      };
    }

    const slotMap = Object.fromEntries(skeleton.slots.map(s => [s.slot_id, s]));
    for (const a of assignments.sort((x, y) => x.date.localeCompare(y.date))) {
      const slot = slotMap[a.slot_id];
      if (!slot) continue;
      const content = buildSessionContentFromCurriculum(curriculumMap, a.course_id, a.module_id, lang);
      const courseName = safeCourseName(curriculumMap, a.course_id, lang);
      byDate[a.date].sessions.push({
        session_number: byDate[a.date].sessions.length + 1,
        course_id: a.course_id,
        module_id: a.module_id,
        course_name: courseName,
        mode: a.mode,
        units: a.units,
        difficulty_avg: moduleDifficulty(curriculumMap, a.course_id, a.module_id),
        source_slot_type: slot.slot_type,
        ai_note: content.ai_note,
        must_know_today: content.must_know_today,
        must_memorize_today: content.must_memorize_today,
        completed: false
      });
    }

    for (const day of Object.values(byDate)) {
      if (day.day_type === 'exam') {
        const examCourses = skeleton.days.find(d => d.date === day.date)?.exam_courses || [];
        day.sessions = examCourses.map((cid, idx) => ({
          session_number: idx + 1,
          course_id: cid,
          module_id: 'EXAM',
          course_name: safeCourseName(curriculumMap, cid, lang),
          mode: 'exam',
          units: 0,
          difficulty_avg: 10,
          ai_note: lang === 'en' ? 'Exam day. Stay calm and trust your preparation.' : 'يوم اختبار. اهدأ وثق بما راجعته.',
          must_know_today: [],
          must_memorize_today: [],
          completed: false
        }));
      }
    }

    const orderedDays = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(d => d.day_type === 'exam' || d.sessions.length > 0 || d.day_type === 'rest' || d.day_type === 'busy');

    return {
      plan_type: userConfig.plan_type,
      generated_at: new Date().toISOString(),
      ai_model: 'hybrid_rules_first',
      ai_status: repairedAssignment.success ? 'validated' : 'repaired_with_warnings',
      config: userConfig,
      plan_summary: {
        total_days: orderedDays.length,
        total_sessions: orderedDays.reduce((sum, d) => sum + d.sessions.length, 0),
        strategy_description: lang === 'en'
          ? 'Calendar skeleton built locally; module assignment validated and repaired deterministically; session content generated after validation.'
          : 'تم بناء هيكل الجدول محليًا؛ ثم تم التحقق من توزيع الوحدات وإصلاحه حتميًا؛ ثم توليد محتوى كل جلسة بعد التحقق.'
      },
      days: orderedDays,
      warnings: repairedAssignment.validation_after?.warnings || [],
      errors: repairedAssignment.validation_after?.errors || []
    };
  }

  function buildContentPrompt(curriculumMap, plan, session) {
    const course = curriculumMap?.courses?.[session.course_id];
    const mod = course?.modules?.[session.module_id];
    return [
      'Generate concise study-session content in JSON only.',
      'Keep content faithful to the supplied curriculum facts.',
      'Do not invent concepts outside the provided module.',
      'Return schema:',
      '{"ai_note":"...","quick_steps":["..."],"practice_questions":["..."],"flashcards":[{"front":"...","back":"..."}]}',
      'Session:',
      JSON.stringify({
        course_id: session.course_id,
        module_id: session.module_id,
        mode: session.mode,
        units: session.units,
        must_know_today: session.must_know_today,
        must_memorize_today: session.must_memorize_today,
        module: mod || null
      })
    ].join('\n');
  }

  function generateHybridPlanLocally(curriculumMap, rawUserConfig, lang = 'ar') {
    const skeleton = buildSkeleton(curriculumMap, rawUserConfig);
    const payload = buildAssignmentPayload(curriculumMap, rawUserConfig, skeleton);
    const deterministicAssignments = [];
    const deficits = payload.modules.map(m => ({ ...m, remaining_units: m.required_units }));
    const scheduledMap = {};

    for (const slot of skeleton.slots) {
      const candidates = pickFallbackCandidates(deficits, slot, scheduledMap);
      if (!candidates.length) continue;
      const c = candidates[0];
      const units = Math.min(slot.unit_capacity, c.remaining_units);
      if (![0.5, 1].includes(units)) continue;
      deterministicAssignments.push({
        slot_id: slot.slot_id,
        course_id: c.course_id,
        module_id: c.module_id,
        units,
        mode: slot.slot_type === 'golden_review' ? 'flash' : (c.preferred_mode || 'deep'),
        reason: 'deterministic_local_assignment'
      });
      c.remaining_units = Math.round((c.remaining_units - units) * 100) / 100;
      scheduledMap[`${c.course_id}:${c.module_id}`] = slot.date;
    }

    const repaired = repairAssignment(curriculumMap, rawUserConfig, skeleton, { assignments: deterministicAssignments });
    const plan = materializePlan(curriculumMap, rawUserConfig, skeleton, repaired, lang);
    return { skeleton, payload, repaired, plan };
  }

  window.HybridPlannerEngine = {
    buildSkeleton,
    buildAssignmentPayload,
    buildAssignmentPrompt,
    validateAssignment,
    repairAssignment,
    materializePlan,
    buildContentPrompt,
    generateHybridPlanLocally
  };
})();
