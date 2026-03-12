/*
  Digital Garden — Hybrid Rules-First Planner Engine  v2.0.0
  ──────────────────────────────────────────────────────────
  Architecture (what runs where):
    LOCAL  → build calendar skeleton  (rest/busy/exam/golden_review slots)
    LOCAL  → compute exact module demand per slot
    AI     → choose which module goes into each pre-built slot  (optional)
    LOCAL  → validate every AI choice against hard rules
    LOCAL  → deterministic repair for anything AI missed
    LOCAL  → materialize final plan with session content

  Fixes applied over v1.0.0:
    ★ FIX 1 – extractModulePrereqs: regex was wrong for real topic_id format
               (CS350_M02_T01 not CS350M02…). Now splits on '_'.
    ★ FIX 2 – unit_capacity now reflects modules_per_session (was hardcoded 1).
    ★ FIX 3 – validateAssignment / repairAssignment: track usedCapacityBySlot
               so multiple modules can share one slot (mps ≥ 2).
    ★ FIX 4 – repairAssignment: fills remaining slot capacity with a second
               module after a 0.5-unit flash module (no more wasted half-slots).
    ★ FIX 5 – Golden review window: if lastStudyDate exists but is outside the
               5-day window, search for a closer available date inside the window.
    ★ FIX 6 – day_type 'goldenreview' → 'golden_review' (consistent with
               planner.js renderer expectations).
    ★ FIX 7 – generateHybridPlanLocally: true round-robin interleaving across
               courses (was always picking highest-priority course first).
    ★ FIX 8 – materializePlan: groups assignments by slot, joins multiple
               module_ids ("M01 + M02"), adds all renderer-expected fields
               (week_number, ai_note_ar/en, must_know_today_en, is_critical,
                _snoozeCount, cross_link_alert, daily_tip_ar/en).
    ★ FIX 9 – injectSpacedReviews: SM-2-inspired review sessions injected
               post-assignment at +3, +7 days using remaining slot capacity.
    ★ FIX 10 – buildAssignmentPrompt: rules updated to reflect multi-assignment
                slots and correct unit capacity.

  Exposed as: window.HybridPlannerEngine
*/
(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  const DAY_MAP = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };

  const SM2_REVIEW_INTERVALS = [3, 7]; // days after initial study

  const DEFAULTS = {
    goldenReviewWindowDays    : 5,
    hardCapSessionsPerDay     : 6,
    allowGoldenReviewOnRestDay: true,
    enforcePrerequisites      : true,
    enforceNoCourseAfterExam  : true,
    enforcePerModuleUnitsExactly: true,
    aiDistributionMode        : 'assign_only',
    fallbackModeMap: {
      excellent  : 'flash',
      good       : 'full',
      weak       : 'deep',
      not_studied: 'deep'
    },
    ratingWeights: {
      not_studied: 1.0,
      weak       : 0.75,
      good       : 0.4,
      excellent  : 0.15
    },
    modeUnits: {
      deep : 1,
      full : 1,
      flash: 0.5,
      exam : 0
    }
  };

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function mergeConfig(rawUserConfig) {
    const cfg = clone(rawUserConfig || {});
    cfg.rest_days         = Array.isArray(cfg.rest_days)    ? cfg.rest_days    : ['friday', 'saturday'];
    cfg.busy_dates        = Array.isArray(cfg.busy_dates)   ? cfg.busy_dates   : [];
    cfg.courses           = cfg.courses || {};
    cfg.daily_sessions    = Number(cfg.daily_sessions    || 2);
    cfg.modules_per_session = Number(cfg.modules_per_session || 1);
    cfg.start_date        = cfg.start_date || getLocalDateStr(new Date());
    cfg.hybrid_rules      = Object.assign({}, DEFAULTS, cfg.hybrid_rules || {});
    return cfg;
  }

  function getLocalDateStr(d) {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
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
    const ad = parseLocalDate(a); ad.setHours(0, 0, 0, 0);
    const bd = parseLocalDate(b); bd.setHours(0, 0, 0, 0);
    return Math.round((bd - ad) / 86400000);
  }

  function isSameOrAfter(a, b) { return a >= b; }

  function dayNameFromDateStr(dateStr) {
    const d = parseLocalDate(dateStr);
    return Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
  }

  function naturalModuleSort(a, b) {
    const na = Number(String(a).replace(/\D/g, ''));
    const nb = Number(String(b).replace(/\D/g, ''));
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  }

  function roundUnits(v) { return Math.round(v * 100) / 100; }

  // ─── Curriculum Helpers ─────────────────────────────────────────────────────

  function safeCourseName(curriculumMap, courseId, lang) {
    const c = curriculumMap?.courses?.[courseId];
    if (!c) return courseId;
    return lang === 'en' ? (c.name_en || c.name || courseId) : (c.name || c.name_en || courseId);
  }

  function moduleTopics(curriculumMap, courseId, moduleId) {
    return curriculumMap?.courses?.[courseId]?.modules?.[moduleId]?.topics || [];
  }

  function moduleDifficulty(curriculumMap, courseId, moduleId) {
    return Number(curriculumMap?.courses?.[courseId]?.modules?.[moduleId]?.module_difficulty || 5);
  }

  /**
   * ★ FIX 1 – Prerequisites: real topic_id format is "CS350_M02_T01".
   * Split on '_' → parts[1] is the module ID (e.g. "M02").
   * Old regex `^${courseId}(M\\d+)` matched "CS350M02…" which never exists.
   */
  function extractModulePrereqs(curriculumMap, courseId, moduleId) {
    const reqs = new Set();
    for (const t of moduleTopics(curriculumMap, courseId, moduleId)) {
      for (const p of (t.prerequisites || [])) {
        const parts = String(p).split('_');
        // Format: {COURSE}_{MODULE}_{TOPIC}  →  parts[0]=CS350, parts[1]=M02
        if (parts.length >= 2 && parts[0] === courseId) {
          const prereqMod = parts[1];
          if (prereqMod !== moduleId) reqs.add(prereqMod);
        }
      }
    }
    return Array.from(reqs).sort(naturalModuleSort);
  }

  // ─── Config Helpers ─────────────────────────────────────────────────────────

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
    return addDays(exams.slice().sort().at(-1), 2);
  }

  function isDateBlocked(userConfig, dateStr) {
    if (userConfig.busy_dates.includes(dateStr)) return true;
    if (userConfig.rest_days.includes(dayNameFromDateStr(dateStr))) return true;
    return false;
  }

  function getStudyDates(userConfig) {
    const end = getPlanningEndDate(userConfig);
    const dates = [];
    let cur = userConfig.start_date;
    while (cur <= end) { dates.push(cur); cur = addDays(cur, 1); }
    return dates;
  }

  /** Returns last non-blocked date strictly before examDate, or null. */
  function findLastAvailableStudyDateBefore(userConfig, examDate) {
    let cur = addDays(examDate, -1);
    while (cur >= userConfig.start_date) {
      if (!isDateBlocked(userConfig, cur)) return cur;
      cur = addDays(cur, -1);
    }
    return null;
  }

  /**
   * ★ FIX 5 – Find the closest available date WITHIN the golden window
   * (≤ goldenReviewWindowDays before exam). Falls back to rest-day if
   * allowGoldenReviewOnRestDay is true.
   */
  function findGoldenReviewDate(userConfig, examDate) {
    const windowDays = userConfig.hybrid_rules.goldenReviewWindowDays;
    // Walk backwards from day before exam, stay within window
    let cursor = addDays(examDate, -1);
    while (cursor >= userConfig.start_date && daysBetween(cursor, examDate) <= windowDays) {
      if (!userConfig.busy_dates.includes(cursor)) {
        // Prefer study days; accept rest days only if flag is set
        if (!userConfig.rest_days.includes(dayNameFromDateStr(cursor)))
          return cursor; // study day inside window ✓
        if (userConfig.hybrid_rules.allowGoldenReviewOnRestDay)
          return cursor; // rest day allowed ✓
      }
      cursor = addDays(cursor, -1);
    }
    return null; // no suitable date in window
  }

  // ─── Demand Computation ─────────────────────────────────────────────────────

  function unitDemandFromRating(userConfig, rating) {
    const mode = userConfig.hybrid_rules.fallbackModeMap[rating] || 'deep';
    const units = userConfig.hybrid_rules.modeUnits[mode] || 1;
    return { mode, units };
  }

  function buildPriorityScore(userConfig, rating, diff) {
    const w = userConfig.hybrid_rules.ratingWeights[rating] ?? 1.0;
    return roundUnits((w * 0.65) + ((diff / 10) * 0.35));
  }

  function computeExactModuleDemand(curriculumMap, userConfig) {
    const demand = [];
    for (const [courseId, cfg] of Object.entries(userConfig.courses || {})) {
      if (!cfg?.active) continue;
      const modules = (cfg.included_modules || []).slice().sort(naturalModuleSort);
      for (const moduleId of modules) {
        const rating   = cfg.self_rating?.[moduleId] || 'not_studied';
        const diff     = moduleDifficulty(curriculumMap, courseId, moduleId);
        const override = cfg.module_unit_overrides?.[moduleId];
        let requiredUnits, preferredMode;
        if (typeof override === 'number' && override > 0) {
          requiredUnits = override;
          preferredMode = override <= 0.5 ? 'flash'
            : (rating === 'excellent' ? 'flash' : rating === 'good' ? 'full' : 'deep');
        } else {
          const base = unitDemandFromRating(userConfig, rating);
          requiredUnits = base.units;
          preferredMode = base.mode;
        }
        demand.push({
          course_id           : courseId,
          module_id           : moduleId,
          rating,
          difficulty          : diff,
          prerequisite_modules: extractModulePrereqs(curriculumMap, courseId, moduleId),
          exam_date           : cfg.exam_date || null,
          required_units      : requiredUnits,
          remaining_units     : requiredUnits,
          preferred_mode      : preferredMode,
          course_order_key    : cfg.exam_date || '9999-12-31',
          priority_score      : buildPriorityScore(userConfig, rating, diff)
        });
      }
    }
    return demand.sort((a, b) => {
      if (a.course_order_key !== b.course_order_key)
        return a.course_order_key.localeCompare(b.course_order_key);
      if (b.priority_score !== a.priority_score)
        return b.priority_score - a.priority_score;
      if (a.course_id !== b.course_id)
        return a.course_id.localeCompare(b.course_id);
      return naturalModuleSort(a.module_id, b.module_id);
    });
  }

  // ─── PHASE 1 — Build Skeleton ────────────────────────────────────────────────

  /**
   * Builds the full calendar skeleton with typed days and capacity-aware slots.
   * ★ FIX 2 – unit_capacity = modules_per_session (not hardcoded 1).
   * ★ FIX 5 – Golden review window searched correctly.
   * ★ FIX 6 – day_type uses 'golden_review' (underscore) throughout.
   */
  function buildSkeleton(curriculumMap, rawUserConfig) {
    const userConfig    = mergeConfig(rawUserConfig);
    const courseExamMap = buildCourseExamMap(userConfig);
    const mps           = Math.max(0.5, userConfig.modules_per_session); // slot capacity
    const dates         = getStudyDates(userConfig);
    const slots = [];
    const days  = [];
    const warnings = [];

    // ── Pass 1: build study / rest / busy / exam days ──────────────────────
    for (const dateStr of dates) {
      const examCourses = Object.entries(courseExamMap)
        .filter(([, d]) => d === dateStr).map(([cid]) => cid);

      let dayType = 'study';
      if (examCourses.length)                                         dayType = 'exam';
      else if (userConfig.busy_dates.includes(dateStr))              dayType = 'busy';
      else if (userConfig.rest_days.includes(dayNameFromDateStr(dateStr))) dayType = 'rest';

      const day = { date: dateStr, day_type: dayType, exam_courses: examCourses, slot_ids: [] };

      if (dayType === 'study') {
        for (let s = 1; s <= userConfig.daily_sessions; s++) {
          const slotId = `slot_${dateStr}_${s}`;
          day.slot_ids.push(slotId);
          slots.push({
            slot_id      : slotId,
            date         : dateStr,
            slot_index   : s,
            slot_type    : 'study',
            unit_capacity: mps,                      // ★ FIX 2
            allowed_courses: Object.keys(userConfig.courses)
              .filter(cid => userConfig.courses[cid]?.active),
            notes: []
          });
        }
      }
      days.push(day);
    }

    // ── Pass 2: inject golden_review slots ──────────────────────────────────
    for (const [courseId, examDate] of Object.entries(courseExamMap)) {
      const goldenDate = findGoldenReviewDate(userConfig, examDate); // ★ FIX 5

      if (!goldenDate) {
        warnings.push({ type: 'missing_golden_window', course_id: courseId, exam_date: examDate });
        continue;
      }

      let existingDay = days.find(d => d.date === goldenDate);
      if (!existingDay) {
        existingDay = { date: goldenDate, day_type: 'golden_review', exam_courses: [], slot_ids: [] };
        days.push(existingDay);
      }

      // ★ FIX 6: unified 'golden_review' day_type
      if (['rest', 'study', 'golden_review', 'mixed'].includes(existingDay.day_type)) {
        existingDay.day_type = existingDay.day_type === 'study' ? 'mixed' : 'golden_review';
        const slotId = `slot_${goldenDate}_gr_${courseId}`;
        existingDay.slot_ids.push(slotId);
        slots.push({
          slot_id         : slotId,
          date            : goldenDate,
          slot_index      : existingDay.slot_ids.length,
          slot_type       : 'golden_review',
          unit_capacity   : Math.max(1, mps),        // golden review slot = at least 1 unit
          locked_course_id: courseId,
          allowed_courses : [courseId],
          notes           : ['last_review_before_exam']
        });
      }
    }

    days.sort((a, b) => a.date.localeCompare(b.date));
    slots.sort((a, b) => a.date.localeCompare(b.date) || a.slot_index - b.slot_index);

    return { engine: 'hybrid_rules_first', version: '2.0.0', config: userConfig, days, slots, warnings };
  }

  // ─── PHASE 2 — Assignment Payload (for AI) ──────────────────────────────────

  function buildAssignmentPayload(curriculumMap, rawUserConfig, skeleton) {
    const userConfig   = mergeConfig(rawUserConfig);
    const moduleDemand = computeExactModuleDemand(curriculumMap, userConfig);
    return {
      rules: {
        ai_distribution_mode         : userConfig.hybrid_rules.aiDistributionMode,
        enforce_prerequisites        : userConfig.hybrid_rules.enforcePrerequisites,
        enforce_no_course_after_exam : userConfig.hybrid_rules.enforceNoCourseAfterExam,
        enforce_per_module_units_exactly: userConfig.hybrid_rules.enforcePerModuleUnitsExactly,
        allowed_unit_values          : [0.5, 1],
        modules_per_session          : userConfig.modules_per_session,
        slot_count                   : skeleton.slots.length
      },
      slots: skeleton.slots.map(s => ({
        slot_id         : s.slot_id,
        date            : s.date,
        slot_type       : s.slot_type,
        unit_capacity   : s.unit_capacity,
        allowed_courses : s.allowed_courses,
        locked_course_id: s.locked_course_id || null,
        notes           : s.notes || []
      })),
      modules: moduleDemand.map(m => ({
        course_id           : m.course_id,
        module_id           : m.module_id,
        rating              : m.rating,
        difficulty          : m.difficulty,
        prerequisite_modules: m.prerequisite_modules,
        exam_date           : m.exam_date,
        required_units      : m.required_units,
        preferred_mode      : m.preferred_mode,
        priority_score      : m.priority_score
      }))
    };
  }

  /**
   * ★ FIX 10 – Updated prompt rules to reflect multi-assignment slots.
   */
  function buildAssignmentPrompt(curriculumMap, rawUserConfig, payload) {
    const userConfig    = mergeConfig(rawUserConfig);
    const activeCourses = Object.keys(userConfig.courses)
      .filter(cid => userConfig.courses[cid]?.active);
    const mps = userConfig.modules_per_session;
    return [
      'You are distributing study modules into pre-built calendar slots.',
      'NEVER invent slot ids, dates, or new modules.',
      'ONLY decide which module(s) go into each existing slot.',
      '',
      'Hard rules:',
      '1) Return JSON only – no markdown, no explanation.',
      `2) Each slot has a unit_capacity of ${mps}. Multiple assignments per slot are allowed until capacity is reached.`,
      '3) Allowed unit values per assignment: 0.5 (flash) or 1 (deep/full).',
      '4) Do not assign a course on or after its exam_date.',
      '5) Respect prerequisite_modules: a module may only be assigned after all its prerequisites appear in an earlier slot.',
      '6) golden_review slots: use only the locked_course_id; prefer highest-priority modules of that course.',
      '7) Assign each module for exactly its required_units total across all slots.',
      '8) If capacity runs out before all modules are assigned, leave remaining modules unassigned rather than breaking rules.',
      '',
      `Plan type: ${userConfig.plan_type || 'general'}`,
      `Start date: ${userConfig.start_date}`,
      `Active courses: ${activeCourses.join(', ')}`,
      `Modules per session (slot capacity): ${mps}`,
      '',
      'Return schema:',
      '{"assignments":[{"slot_id":"slot_...","course_id":"CS350","module_id":"M03","units":1,"mode":"deep","reason":"..."}]}',
      '',
      'Payload:',
      JSON.stringify(payload)
    ].join('\n');
  }

  // ─── PHASE 3 — Validate ─────────────────────────────────────────────────────

  /**
   * ★ FIX 3 – Multi-assignment slots: track usedCapacityBySlot per slot.
   * Returns slotsWithRemainingCapacity instead of unusedSlots.
   */
  function validateAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment) {
    const userConfig = mergeConfig(rawUserConfig);
    const payload    = buildAssignmentPayload(curriculumMap, userConfig, skeleton);
    const slotMap    = Object.fromEntries(skeleton.slots.map(s => [s.slot_id, s]));
    const moduleMap  = Object.fromEntries(payload.modules.map(m => [`${m.course_id}:${m.module_id}`, clone(m)]));

    const errors   = [];
    const warnings = [];
    const accepted = [];
    const usedCapacityBySlot = {};   // slot_id → units used so far
    const accumulatedUnits   = {};   // "cid:mid" → units assigned
    const firstScheduledDate = {};   // "cid:mid" → earliest assignment date
    const rawAssignments = Array.isArray(aiAssignment?.assignments) ? aiAssignment.assignments : [];

    for (const a of rawAssignments) {
      const slot = slotMap[a.slot_id];
      const key  = `${a.course_id}:${a.module_id}`;
      const mod  = moduleMap[key];

      if (!slot) { errors.push({ type: 'unknown_slot',   assignment: a }); continue; }
      if (!mod)  { errors.push({ type: 'unknown_module', assignment: a }); continue; }
      if (!slot.allowed_courses.includes(a.course_id))
        { errors.push({ type: 'course_not_allowed_in_slot', assignment: a }); continue; }
      if (slot.locked_course_id && slot.locked_course_id !== a.course_id)
        { errors.push({ type: 'violates_locked_course', assignment: a }); continue; }
      if (![0.5, 1].includes(Number(a.units)))
        { errors.push({ type: 'illegal_units', assignment: a }); continue; }

      // ★ FIX 3: capacity check per slot (replaces old duplicate-slot check)
      const usedSoFar = usedCapacityBySlot[a.slot_id] || 0;
      if (usedSoFar + Number(a.units) > slot.unit_capacity + 0.001)
        { errors.push({ type: 'exceeds_slot_capacity', assignment: a }); continue; }

      if (mod.exam_date && isSameOrAfter(slot.date, mod.exam_date))
        { errors.push({ type: 'course_on_or_after_exam', assignment: a }); continue; }

      const priorUnits = accumulatedUnits[key] || 0;
      // Golden review & spaced review are recaps of already-studied material
      // — they are exempt from the unit budget (do not count against required_units)
      const isReviewAssignment = slot.slot_type === 'golden_review' ||
        String(a.reason || '').startsWith('spaced_review') ||
        String(a.reason || '') === 'golden_review_local';
      if (!isReviewAssignment && priorUnits + Number(a.units) > mod.required_units + 0.001)
        { errors.push({ type: 'module_units_overflow', assignment: a }); continue; }

      // Prerequisite check
      if (userConfig.hybrid_rules.enforcePrerequisites && mod.prerequisite_modules.length) {
        const prereqDates = mod.prerequisite_modules
          .map(pm => firstScheduledDate[`${a.course_id}:${pm}`])
          .filter(Boolean);
        if (prereqDates.length !== mod.prerequisite_modules.length) {
          warnings.push({ type: 'prereq_not_scheduled_yet', assignment: a });
        } else if (prereqDates.some(d => d > slot.date)) {
          errors.push({ type: 'prerequisite_after_child', assignment: a });
          continue;
        }
      }

      // Accept
      usedCapacityBySlot[a.slot_id] = usedSoFar + Number(a.units);
      accumulatedUnits[key]          = priorUnits + Number(a.units);
      if (!firstScheduledDate[key] || slot.date < firstScheduledDate[key])
        firstScheduledDate[key] = slot.date;

      accepted.push({
        slot_id  : a.slot_id,
        date     : slot.date,
        course_id: a.course_id,
        module_id: a.module_id,
        units    : Number(a.units),
        mode     : a.mode || mod.preferred_mode || 'deep',
        reason   : a.reason || ''
      });
    }

    // Compute deficits
    const deficits = [];
    for (const m of payload.modules) {
      const key  = `${m.course_id}:${m.module_id}`;
      const used = accumulatedUnits[key] || 0;
      const rem  = roundUnits(m.required_units - used);
      if (rem > 0.001) deficits.push({ ...m, remaining_units: rem });
    }

    // ★ FIX 3: slots with remaining capacity (for repair pass)
    const slotsWithRemainingCapacity = skeleton.slots
      .map(s => ({ ...s, remaining_capacity: roundUnits(s.unit_capacity - (usedCapacityBySlot[s.slot_id] || 0)) }))
      .filter(s => s.remaining_capacity > 0.001);

    return {
      valid                    : errors.length === 0 && deficits.length === 0,
      accepted_assignments     : accepted,
      errors,
      warnings,
      deficits,
      slots_with_remaining_capacity: slotsWithRemainingCapacity,
      // legacy alias so callers using old field name don't break
      unused_slots             : slotsWithRemainingCapacity
    };
  }

  // ─── PHASE 4 — Repair ───────────────────────────────────────────────────────

  /**
   * Pick best candidates for a slot from deficits list.
   * Partial fills are allowed: a module with remaining_units > cap can still
   * be selected — it will be assigned Math.min(cap, remaining_units) in the caller.
   * Callers must validate that the resulting units value is in [0.5, 1].
   */
  function pickFallbackCandidates(deficits, slot, scheduledMap) {
    return deficits
      .filter(m => m.remaining_units > 0.001)
      .filter(m => slot.allowed_courses.includes(m.course_id))
      .filter(m => !m.exam_date || slot.date < m.exam_date)
      .filter(m => !m.prerequisite_modules.length ||
        m.prerequisite_modules.every(pm => Boolean(scheduledMap[`${m.course_id}:${pm}`])))
      .sort((a, b) => {
        // Prefer locked course for golden_review slots
        const goldenA = slot.locked_course_id === a.course_id ? 1 : 0;
        const goldenB = slot.locked_course_id === b.course_id ? 1 : 0;
        if (goldenB !== goldenA) return goldenB - goldenA;
        if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
        if (a.course_id !== b.course_id) return a.course_id.localeCompare(b.course_id);
        return naturalModuleSort(a.module_id, b.module_id);
      });
  }

  /**
   * ★ FIX 3 + FIX 4 – Repair fills slots with multiple modules until capacity
   * is exhausted (no more wasted half-slots after flash assignments).
   */
  function repairAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment) {
    const validation = validateAssignment(curriculumMap, rawUserConfig, skeleton, aiAssignment);
    const repaired   = validation.accepted_assignments.slice().sort((a, b) => a.date.localeCompare(b.date));
    const deficits   = validation.deficits.map(clone);
    const scheduledMap = {};
    for (const a of repaired) scheduledMap[`${a.course_id}:${a.module_id}`] = a.date;

    const openSlots = validation.slots_with_remaining_capacity
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot_index - b.slot_index);

    for (const slot of openSlots) {
      let remainingCap = slot.remaining_capacity;

      // ★ FIX 4: keep filling until slot is full or no more candidates
      while (remainingCap > 0.001) {
        const candidates = pickFallbackCandidates(deficits, slot, scheduledMap);
        if (!candidates.length) break;
        const c           = candidates[0];
        const assignUnits = Math.min(remainingCap, c.remaining_units);
        if (![0.5, 1].includes(assignUnits)) break;

        const isGolden = slot.slot_type === 'golden_review';
        repaired.push({
          slot_id  : slot.slot_id,
          date     : slot.date,
          course_id: c.course_id,
          module_id: c.module_id,
          units    : assignUnits,
          mode     : isGolden ? 'flash' : (c.preferred_mode || 'deep'),
          reason   : 'auto_repair_fallback'
        });

        const key = `${c.course_id}:${c.module_id}`;
        c.remaining_units = roundUnits(c.remaining_units - assignUnits);
        remainingCap      = roundUnits(remainingCap - assignUnits);
        if (c.remaining_units <= 0.001 && !scheduledMap[key])
          scheduledMap[key] = slot.date;
      }
    }

    const finalValidation = validateAssignment(curriculumMap, rawUserConfig, skeleton, { assignments: repaired });
    return {
      repaired_assignments: repaired.sort((a, b) => a.date.localeCompare(b.date)),
      validation_before   : validation,
      validation_after    : finalValidation,
      success             : finalValidation.errors.length === 0 && finalValidation.deficits.length === 0
    };
  }

  // ─── PHASE 4b — Spaced Review Injection ─────────────────────────────────────

  /**
   * ★ FIX 9 – SM-2-inspired review sessions.
   * After initial assignment, inject 'flash' review sessions at +3 and +7 days
   * using available slot capacity. Reviews bypass the unit-budget validator
   * (they're bonus sessions, not counted against required_units).
   */
  function injectSpacedReviews(skeleton, assignments) {
    // Build slot capacity usage map
    const slotCapMap = {};
    for (const s of skeleton.slots)  slotCapMap[s.slot_id] = s.unit_capacity;
    for (const a of assignments)     slotCapMap[a.slot_id] = roundUnits((slotCapMap[a.slot_id] || 0) - a.units);

    // Only review non-flash initial assignments
    const initialByKey = {};
    for (const a of assignments) {
      if (a.mode === 'exam' || a.reason === 'spaced_review') continue;
      const key = `${a.course_id}:${a.module_id}`;
      if (!initialByKey[key] || a.date < initialByKey[key].date) initialByKey[key] = a;
    }

    const reviews = [];
    for (const a of Object.values(initialByKey)) {
      if (a.mode === 'flash') continue; // flash doesn't need spaced review
      for (const interval of SM2_REVIEW_INTERVALS) {
        const reviewDate = addDays(a.date, interval);
        // Find earliest slot with ≥ 0.5 remaining capacity on that date
        const slot = skeleton.slots.find(s =>
          s.date === reviewDate &&
          s.slot_type === 'study' &&
          s.allowed_courses.includes(a.course_id) &&
          (slotCapMap[s.slot_id] || 0) >= 0.5
        );
        if (!slot) continue;
        reviews.push({
          slot_id  : slot.slot_id,
          date     : reviewDate,
          course_id: a.course_id,
          module_id: a.module_id,
          units    : 0.5,
          mode     : 'flash',
          reason   : `spaced_review_d+${interval}`
        });
        slotCapMap[slot.slot_id] = roundUnits((slotCapMap[slot.slot_id] || 0) - 0.5);
      }
    }
    return reviews;
  }

  // ─── PHASE 5 — Materialize ──────────────────────────────────────────────────

function toLegacyDayType(dayType) {
if (dayType === 'golden_review') return 'goldenreview';
return dayType;
}

function inferAssignmentKind(slotType, reason) {
const r = String(reason || '');
if (slotType === 'golden_review' || r === 'golden_review_local' || r.startsWith('spaced_review')) return 'review';
return 'primary';
}

function buildTopicToModuleMap(curriculumMap, courseId) {
const out = {};
const course = curriculumMap?.courses?.[courseId];
if (!course?.modules) return out;
for (const [moduleId, mod] of Object.entries(course.modules)) {
for (const topic of (mod.topics || [])) {
out[topic.topic_id] = moduleId;
}
}
return out;
}

  function formatDayLabel(dateStr, lang) {
    const d = parseLocalDate(dateStr);
    return lang === 'en' ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getDate()}/${d.getMonth() + 1}`;
  }

  /** Build session content from curriculum topics, bilingual. */
  function buildSessionContent(curriculumMap, courseId, moduleId) {
    const mod = curriculumMap?.courses?.[courseId]?.modules?.[moduleId];
    if (!mod) return { must_know_today: [], must_know_today_en: [], must_memorize_today: [], must_memorize_today_en: [], ai_note_ar: '', ai_note_en: '' };
    const mkAr = [], mkEn = [], mmAr = [], mmEn = [];
    for (const t of (mod.topics || [])) {
      if (Array.isArray(t.must_know))    mkAr.push(...t.must_know.slice(0, 1));
      else if (t.must_know)              mkAr.push(t.must_know);
      if (Array.isArray(t.must_know_en)) mkEn.push(...t.must_know_en.slice(0, 1));
      else if (t.must_know_en)           mkEn.push(t.must_know_en);
      if (Array.isArray(t.must_memorize))    mmAr.push(...t.must_memorize.slice(0, 1));
      else if (t.must_memorize)              mmAr.push(t.must_memorize);
      if (Array.isArray(t.must_memorize_en)) mmEn.push(...t.must_memorize_en.slice(0, 1));
      else if (t.must_memorize_en)           mmEn.push(t.must_memorize_en);
    }
    const titleAr = mod.title    || mod.title_en || moduleId;
    const titleEn = mod.title_en || mod.title    || moduleId;
    return {
      must_know_today    : Array.from(new Set(mkAr)).slice(0, 3),
      must_know_today_en : Array.from(new Set(mkEn)).slice(0, 3),
      must_memorize_today    : Array.from(new Set(mmAr)).slice(0, 2),
      must_memorize_today_en : Array.from(new Set(mmEn)).slice(0, 2),
      ai_note_ar: `ركّز على ${titleAr}، ثم حل سؤالًا تمثيليًا بصيغة اختبار.`,
      ai_note_en: `Focus on ${titleEn}, then solve one representative exam-style question.`
    };
  }

  /**
   * ★ FIX 8 – materializePlan:
   *   • Groups assignments by slot → joins module_ids ("M01 + M02")
   *   • Adds: week_number, ai_note_ar/en, must_know_today_en,
   *           must_memorize_today_en, is_critical, _snoozeCount,
   *           cross_link_alert, daily_tip_ar/en, source_slot_type
   */
  function materializePlan(curriculumMap, rawUserConfig, skeleton, repairedResult, lang = 'ar') {
    const userConfig  = mergeConfig(rawUserConfig);
    const allAssign   = [
      ...(repairedResult.repaired_assignments || repairedResult.accepted_assignments || []),
      ...(repairedResult.spaced_reviews || [])
    ];

    // Group assignments by slot_id
    const bySlotId = {};
    for (const a of allAssign) {
      if (!bySlotId[a.slot_id]) bySlotId[a.slot_id] = [];
      bySlotId[a.slot_id].push(a);
    }

    const slotMap  = Object.fromEntries(skeleton.slots.map(s => [s.slot_id, s]));
    const firstDate = skeleton.days.length ? skeleton.days[0].date : userConfig.start_date;

    // Build byDate map
    const byDate = {};
    for (const d of skeleton.days) {
      byDate[d.date] = {
        date       : d.date,
        day_label  : formatDayLabel(d.date, lang),
        day_type   : d.day_type,
        week_number: Math.floor(daysBetween(firstDate, d.date) / 7) + 1,  // ★ FIX 8
        sessions   : []
      };
    }

    // Materialize sessions from slots
    for (const day of skeleton.days) {
      const dayObj = byDate[day.date];
      if (!dayObj) continue;

      for (const slotId of (day.slot_ids || [])) {
        const slotAssignments = bySlotId[slotId];
        if (!slotAssignments || !slotAssignments.length) continue;

        const slot = slotMap[slotId];

        // Merge all modules assigned to this slot into one session
        const moduleIds  = slotAssignments.map(a => a.module_id);
        const joinedMid  = moduleIds.join(' + ');
        const primaryA   = slotAssignments[0];
        const isReview   = slotAssignments.every(a => a.reason?.startsWith('spaced_review'));
        const isGolden   = slot?.slot_type === 'golden_review';

        // Merge content from all modules in slot
        const mergedContent = {
          must_know_today    : [], must_know_today_en : [],
          must_memorize_today: [], must_memorize_today_en: [],
          ai_note_ar: '', ai_note_en: ''
        };
        for (const a of slotAssignments) {
          const c = buildSessionContent(curriculumMap, a.course_id, a.module_id);
          mergedContent.must_know_today.push(...c.must_know_today);
          mergedContent.must_know_today_en.push(...c.must_know_today_en);
          mergedContent.must_memorize_today.push(...c.must_memorize_today);
          mergedContent.must_memorize_today_en.push(...c.must_memorize_today_en);
          if (!mergedContent.ai_note_ar) mergedContent.ai_note_ar = c.ai_note_ar;
          if (!mergedContent.ai_note_en) mergedContent.ai_note_en = c.ai_note_en;
        }
        // Deduplicate
        mergedContent.must_know_today     = Array.from(new Set(mergedContent.must_know_today)).slice(0, 4);
        mergedContent.must_know_today_en  = Array.from(new Set(mergedContent.must_know_today_en)).slice(0, 4);
        mergedContent.must_memorize_today = Array.from(new Set(mergedContent.must_memorize_today)).slice(0, 3);
        mergedContent.must_memorize_today_en = Array.from(new Set(mergedContent.must_memorize_today_en)).slice(0, 3);

        const courseName = safeCourseName(curriculumMap, primaryA.course_id, lang);
        const diff       = moduleIds.reduce((acc, mid) =>
          Math.max(acc, moduleDifficulty(curriculumMap, primaryA.course_id, mid)), 0);
        const mode = primaryA.mode;
        const isCritical = (mode === 'deep' && diff >= 8) || isGolden;

        const tip_ar = isGolden
          ? `مراجعة ذهبية — ${courseName}: راجع كل الوحدات السابقة بشكل سريع.`
          : isReview
          ? `مراجعة متباعدة لـ ${joinedMid}: حاول الاسترجاع من الذاكرة قبل النظر للمذكرات.`
          : (mode === 'deep' ? `ادرس ${joinedMid} بعمق — أكثر صعوبةً في هذا الجدول.`
           : mode === 'full' ? `ادرس ${joinedMid} بتركيز كامل مع الأمثلة.`
           : `راجع ${joinedMid} بسرعة — ركّز على المفاهيم الأساسية.`);
        const tip_en = isGolden
          ? `Golden review — ${courseName}: quick recap of all previous modules.`
          : isReview
          ? `Spaced review of ${joinedMid}: recall from memory before checking notes.`
          : (mode === 'deep' ? `Study ${joinedMid} deeply — one of the harder modules.`
           : mode === 'full' ? `Study ${joinedMid} thoroughly with examples.`
           : `Lightly review ${joinedMid} — focus on key concepts.`);

        dayObj.sessions.push({
          session_number       : dayObj.sessions.length + 1,
          course_id            : primaryA.course_id,
          module_id            : joinedMid,
          course_name          : courseName,
          mode,
          units                : slotAssignments.reduce((s, a) => s + a.units, 0),
          difficulty_avg       : diff,
          source_slot_type     : slot?.slot_type || 'study',
          is_review            : isReview,
          is_golden            : isGolden,
          is_critical          : isCritical,      // ★ FIX 8
          ai_note              : lang === 'en' ? mergedContent.ai_note_en : mergedContent.ai_note_ar,
          ai_note_ar           : mergedContent.ai_note_ar,
          ai_note_en           : mergedContent.ai_note_en,
          must_know_today      : mergedContent.must_know_today,
          must_know_today_en   : mergedContent.must_know_today_en,
          must_memorize_today  : mergedContent.must_memorize_today,
          must_memorize_today_en: mergedContent.must_memorize_today_en,
          daily_tip_ar         : tip_ar,           // ★ FIX 8
          daily_tip_en         : tip_en,
          cross_link_alert     : { active: false },// ★ FIX 8 (placeholder, can be enriched)
          completed            : false,
          _snoozeCount         : 0                 // ★ FIX 8
        });
      }
    }

    // Inject exam day sessions
    for (const day of Object.values(byDate)) {
      if (day.day_type !== 'exam') continue;
      const examCourses = skeleton.days.find(d => d.date === day.date)?.exam_courses || [];
      day.sessions = examCourses.map((cid, idx) => ({
        session_number     : idx + 1,
        course_id          : cid,
        module_id          : 'EXAM',
        course_name        : safeCourseName(curriculumMap, cid, lang),
        mode               : 'exam',
        units              : 0,
        difficulty_avg     : 10,
        source_slot_type   : 'exam',
        is_critical        : false,
        is_review          : false,
        is_golden          : false,
        ai_note            : lang === 'en' ? 'Exam day. Stay calm and trust your preparation.' : 'يوم اختبار. اهدأ وثق بما راجعته.',
        ai_note_ar         : 'يوم اختبار. اهدأ وثق بما راجعته.',
        ai_note_en         : 'Exam day. Stay calm and trust your preparation.',
        must_know_today    : [],
        must_know_today_en : [],
        must_memorize_today: [],
        must_memorize_today_en: [],
        daily_tip_ar       : 'اليوم يوم الاختبار — كلّ ما تحتاجه داخلك بالفعل.',
        daily_tip_en       : 'Exam day — everything you need is already inside you.',
        cross_link_alert   : { active: false },
        completed          : false,
        _snoozeCount       : 0
      }));
    }

    const orderedDays = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(d => d.sessions.length > 0 ||
                   ['exam','rest','busy','golden_review','mixed'].includes(d.day_type));

    return {
      plan_type   : userConfig.plan_type,
      generated_at: new Date().toISOString(),
      ai_model    : 'hybrid_rules_first_v2',
      ai_status   : repairedResult.success ? 'validated' : 'repaired_with_warnings',
      config      : userConfig,
      plan_summary: {
        total_days    : orderedDays.length,
        total_sessions: orderedDays.reduce((s, d) => s + d.sessions.length, 0),
        strategy_description: lang === 'en'
          ? 'Skeleton built locally → AI assigns modules → deterministic validation & repair → SM-2 reviews injected.'
          : 'هيكل التقويم يُبنى محليًا → AI يوزّع الوحدات → تحقق وإصلاح حتمي → حقن مراجعات SM-2.'
      },
      days    : orderedDays,
      warnings: repairedResult.validation_after?.warnings || [],
      errors  : repairedResult.validation_after?.errors   || []
    };
  }

  // ─── AI Content Prompt ──────────────────────────────────────────────────────

  function buildContentPrompt(curriculumMap, plan, session) {
    const mod = curriculumMap?.courses?.[session.course_id]?.modules?.[session.module_id];
    return [
      'Generate concise study-session content in JSON only.',
      'Stay faithful to the supplied curriculum. Do not invent concepts.',
      'Schema: {"ai_note_ar":"...","ai_note_en":"...","quick_steps":["..."],"practice_questions":["..."],"flashcards":[{"front":"...","back":"..."}]}',
      'Session:',
      JSON.stringify({
        course_id          : session.course_id,
        module_id          : session.module_id,
        mode               : session.mode,
        must_know_today    : session.must_know_today,
        must_memorize_today: session.must_memorize_today,
        module             : mod || null
      })
    ].join('\n');
  }

  // ─── MAIN: generateHybridPlanLocally ────────────────────────────────────────

  /**
   * ★ FIX 7 – True round-robin interleaving across courses.
   * Instead of always picking the globally highest-priority module,
   * we cycle through courses one-by-one so no single course dominates.
   */
  function generateHybridPlanLocally(curriculumMap, rawUserConfig, lang = 'ar') {
    const userConfig = mergeConfig(rawUserConfig);
    const skeleton   = buildSkeleton(curriculumMap, rawUserConfig);
    const payload    = buildAssignmentPayload(curriculumMap, rawUserConfig, skeleton);

    // Group deficits by course for round-robin
    const deficitsByCourse = {};
    for (const m of payload.modules) {
      if (!deficitsByCourse[m.course_id]) deficitsByCourse[m.course_id] = [];
      deficitsByCourse[m.course_id].push({ ...m, remaining_units: m.required_units });
    }

    // Course rotation order: sort by earliest exam date first
    const courseOrder = Object.keys(deficitsByCourse).sort((a, b) => {
      const ea = userConfig.courses[a]?.exam_date || '9999-12-31';
      const eb = userConfig.courses[b]?.exam_date || '9999-12-31';
      return ea.localeCompare(eb);
    });

    const allDeficits    = payload.modules.map(m => ({ ...m, remaining_units: m.required_units }));
    const scheduledMap   = {};     // "cid:mid" → date of first assignment
    const assignedModules = {};    // "cid:mid" → module record (golden review pool)
    const assignments    = [];
    let   courseRROffset = 0;      // round-robin pointer

    for (const slot of skeleton.slots) {
      let remainingCap = slot.unit_capacity;

      // ── golden_review: pick hardest ASSIGNED module of locked course ────
      // Golden review is a recap — exempt from deficit budget in validator.
      if (slot.slot_type === 'golden_review') {
        const pool = Object.values(assignedModules)
          .filter(m => m.course_id === slot.locked_course_id)
          .sort((a, b) => b.difficulty - a.difficulty || naturalModuleSort(a.module_id, b.module_id));
        // Fallback: if nothing assigned yet, pick first module from deficits
        const src = pool.length > 0
          ? pool
          : allDeficits.filter(m => m.course_id === slot.locked_course_id);
        if (src.length) {
          const c = src[0];
          assignments.push({ slot_id: slot.slot_id, date: slot.date,
            course_id: c.course_id, module_id: c.module_id, units: 0.5,
            mode: 'flash', reason: 'golden_review_local' });
        }
        continue;
      }

      // ── study slot: round-robin interleaving ────────────────────────────
      let triedCourses = 0;
      while (remainingCap > 0.001 && triedCourses < courseOrder.length) {
        const cid      = courseOrder[courseRROffset % courseOrder.length];
        const deficits = (deficitsByCourse[cid] || []).filter(m => m.remaining_units > 0.001);

        // Also pass allDeficits for prereq resolved check
        const cands = pickFallbackCandidates(deficits, slot, scheduledMap);

        if (cands.length) {
          const c = cands[0];
          const u = Math.min(remainingCap, c.remaining_units);
          if ([0.5, 1].includes(u)) {
            assignments.push({ slot_id: slot.slot_id, date: slot.date,
              course_id: c.course_id, module_id: c.module_id, units: u,
              mode: c.preferred_mode || 'deep', reason: 'interleaved_local' });
            c.remaining_units = roundUnits(c.remaining_units - u);
            // Also update allDeficits tracker
            const globalM = allDeficits.find(m => m.course_id === c.course_id && m.module_id === c.module_id);
            if (globalM) globalM.remaining_units = c.remaining_units;
            if (c.remaining_units <= 0.001) scheduledMap[`${c.course_id}:${c.module_id}`] = slot.date;
            // Track for golden review pool
            assignedModules[`${c.course_id}:${c.module_id}`] = c;
            remainingCap = roundUnits(remainingCap - u);
            courseRROffset++; // advance round-robin only on successful assignment
          } else {
            courseRROffset++;
          }
        } else {
          // No candidate from this course; try next
          courseRROffset++;
        }
        triedCourses++;
      }
    }

    // Repair pass (fills any remaining deficits/capacity)
    const repaired = repairAssignment(curriculumMap, rawUserConfig, skeleton, { assignments });

    // ★ FIX 9 – Inject spaced reviews
    const reviews = injectSpacedReviews(skeleton, repaired.repaired_assignments);
    repaired.repaired_assignments = [
      ...repaired.repaired_assignments,
      ...reviews
    ].sort((a, b) => a.date.localeCompare(b.date));
    repaired.spaced_reviews = reviews;

    const plan = materializePlan(curriculumMap, rawUserConfig, skeleton, repaired, lang);
    return { skeleton, payload, repaired, plan };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  window.HybridPlannerEngine = {
    // Core pipeline
    buildSkeleton,
    buildAssignmentPayload,
    buildAssignmentPrompt,
    validateAssignment,
    repairAssignment,
    materializePlan,
    injectSpacedReviews,
    buildContentPrompt,
    generateHybridPlanLocally,
    // Utilities (useful for testing)
    computeExactModuleDemand,
    extractModulePrereqs,
    pickFallbackCandidates
  };

})();
