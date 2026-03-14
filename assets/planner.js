/* ═══════════════════════════════════════════════════════════════
   Digital Garden · planner.js v3.0
   Hybrid Study Planner — Local Scheduling + AI Enrichment
   Two systems (local + hybrid) producing identical schedules
   ═══════════════════════════════════════════════════════════════ */

; (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: Constants & Environment
  // ═══════════════════════════════════════════════════════════════
  const CLOUDFLARE_WORKER_URL = 'https://lively-block-fc3c.xxli50xx.workers.dev';
  const PLANNER_WORKER_URL    = 'https://lively-block-fc3c.xxli50xx.workers.dev';
  const CURRICULUM_MAP_URL    = '../data/curriculum_map.json';
  const MAX_TOKENS            = 8192;

  const EnvLoader = {
    _cache: null,
    async load() {
      if (this._cache) return this._cache;
      try {
        const res = await fetch('../.env');
        if (!res.ok) return {};
        const text = await res.text();
        const vars = {};
        text.split('\n').forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          const eq = line.indexOf('=');
          if (eq > 0) vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
        });
        this._cache = vars;
        return vars;
      } catch (e) { return {}; }
    },
    async getDeepseekKey() {
      const vars = await this.load();
      return vars.DEEPSEEK_API_KEY || '';
    }
  };

  function isLocalServer() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' || window.location.protocol === 'file:';
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: JSON Repair Utilities
  // ═══════════════════════════════════════════════════════════════
  function stripFences(t) {
    t = t.trim();
    if (t.startsWith('```json')) t = t.slice(7);
    else if (t.startsWith('```')) t = t.slice(3);
    if (t.endsWith('```')) t = t.slice(0, -3);
    return t.trim();
  }

  function autoClose(text) {
    const stack = [];
    let inStr = false, esc = false;
    for (const ch of text) {
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
      else if (ch === '}' || ch === ']') {
        if (stack.length && stack[stack.length - 1] === ch) stack.pop();
      }
    }
    let result = text.replace(/,\s*$/, '');
    return result + stack.reverse().join('');
  }

  function tryParseJSON(text) {
    if (!text) return null;
    text = stripFences(text);
    try { return JSON.parse(text); } catch (e) { /* continue */ }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
      try { return JSON.parse(autoClose(match[0])); } catch (e) { /* continue */ }
    }
    try { return JSON.parse(autoClose(text)); } catch (e) { /* continue */ }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Constants & Labels
  // ═══════════════════════════════════════════════════════════════
  const SELF_RATING_MAP = { excellent: 0.85, good: 0.55, weak: 0.20, not_studied: 0.0 };

  const RATING_LABELS = {
    ar: { excellent: 'ممتاز', good: 'جيد', weak: 'ضعيف', not_studied: 'لم أدرسها' },
    en: { excellent: 'Excellent', good: 'Good', weak: 'Weak', not_studied: 'Not studied' }
  };

  const DAY_NAMES = {
    ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  };

  const MONTH_NAMES = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  const DAY_MAP = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

  function getLocalTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDate(dateStr, mode) {
    const parts = (dateStr || '').split('-');
    const d = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      : new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    const isAr = lang() === 'ar';
    const dayName = isAr ? DAY_NAMES.ar[d.getDay()] : DAY_NAMES.en[d.getDay()];

    switch (mode) {
      case 'card':
        return isAr
          ? `${dayName} · ${day} ${MONTH_NAMES.ar[month]}`
          : `${dayName} · ${MONTH_NAMES.en[month]} ${day}`;
      case 'table':
        return `${day}/${month + 1}`;
      case 'input':
        return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      default:
        return dateStr;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: Date & Utility Helpers
  // ═══════════════════════════════════════════════════════════════
  function toLocalDateStr(d) {
    if (typeof d === 'string') return d;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function addDaysToDate(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return toLocalDateStr(d);
  }

  function subtractDays(dateStr, n) {
    return addDaysToDate(dateStr, -n);
  }

  function getDayName(d) {
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
    return names[date.getDay()];
  }

  function dateDiffDays(d1, d2) {
    return Math.round((new Date(d1 + 'T00:00:00') - new Date(d2 + 'T00:00:00')) / 86400000);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function formatDateDisplay(dateStr) { return formatDate(dateStr, 'input'); }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: Config Helpers
  // ═══════════════════════════════════════════════════════════════
  function getActiveCourses(config) {
    return Object.entries(config.courses || {}).filter(([, c]) => c.active);
  }

  function getLatestExamDate(config) {
    let latest = null;
    for (const [, cfg] of getActiveCourses(config)) {
      if (cfg.exam_date && (!latest || cfg.exam_date > latest)) latest = cfg.exam_date;
    }
    return latest;
  }

  function getFirstExamDate(config) {
    let first = null;
    for (const [, cfg] of getActiveCourses(config)) {
      if (cfg.exam_date && (!first || cfg.exam_date < first)) first = cfg.exam_date;
    }
    return first;
  }

  function isExamDate(dateStr, config) {
    for (const [, cfg] of getActiveCourses(config)) {
      if (cfg.exam_date === dateStr) return true;
    }
    return false;
  }

  function getExamCoursesOnDate(dateStr, config, cMap) {
    const result = [];
    const isAr = lang() === 'ar';
    for (const [cid, cfg] of getActiveCourses(config)) {
      if (cfg.exam_date !== dateStr) continue;
      result.push({
        cid,
        name: cMap?.courses?.[cid]?.name || cid,
        name_en: cMap?.courses?.[cid]?.name_en || cid
      });
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: State & Init
  // ═══════════════════════════════════════════════════════════════
  let curriculumMap = null;
  let currentStep = 1;
  let cardViewMode = 'cards';
  let currentCardIndex = 0;
  let _cardIndexInitialized = false;
  let allDayCards = [];
  let use3D = true;
  let _loadingIntervals = [];
  let userConfig = {
    plan_type: null,
    daily_sessions: 2,
    modules_per_session: 1,
    start_date: null,
    rest_days: ['friday', 'saturday'],
    busy_dates: [],
    courses: {}
  };

  function lang() {
    return localStorage.getItem('garden_lang') || 'ar';
  }

  async function init() {
    try {
      const r = await fetch(CURRICULUM_MAP_URL);
      if (!r.ok) throw new Error('Failed to load curriculum map');
      curriculumMap = await r.json();
    } catch (e) {
      showError(lang() === 'ar'
        ? 'فشل تحميل بيانات المناهج — تأكد من وجود data/curriculum_map.json'
        : 'Failed to load curriculum data');
      return;
    }

    if (isLocalServer()) await EnvLoader.load();

    const activePlanKey = getActivePlanKey();
    const savedPlan = localStorage.getItem(activePlanKey);
	if (savedPlan) {
	  try {
		const plan = JSON.parse(savedPlan);

		// ✅ إصلاح الروابط مرة واحدة فقط
		const fixKey = activePlanKey + '_urls_fixed';
		if (!localStorage.getItem(fixKey)) {
		  for (const day of (plan.days || [])) {
			for (const session of (day.sessions || [])) {
			  if (session.course_id && session.module_id) {
				const num = parseInt(session.module_id.replace(/^M/i, ''));
				session.study_url = `../${session.course_id}/M${String(num).padStart(2, '0')}.html`;
			  }
			}
		  }
		  localStorage.setItem(activePlanKey, JSON.stringify(plan));
		  localStorage.setItem(fixKey, '1'); // 🚩 علّم إن الإصلاح تم
		}

		showStep(4);
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('plan-content').style.display = '';
        renderPlan(plan);
        return;
      } catch (e) { /* corrupted plan, continue to wizard */ }
    }
    showStep(1);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: Navigation & Wizard
  // ═══════════════════════════════════════════════════════════════
  function getActivePlanKey() {
    for (const key of ['study_plan_midterm', 'study_plan_final']) {
      const raw = localStorage.getItem(key);
      if (raw) { try { JSON.parse(raw); return key; } catch (e) { localStorage.removeItem(key); } }
    }
    return 'study_plan_general';
  }

  function getPlanStorageKey(planType) {
    if (planType === 'midterm') return 'study_plan_midterm';
    if (planType === 'final') return 'study_plan_final';
    return 'study_plan_general';
  }

  function showStep(n) {
    currentStep = n;
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const steps = ['step-plan-type', 'step-courses', 'step-sessions', 'step-display'];
    const el = document.getElementById(steps[n - 1]);
    if (el) el.classList.add('active');

    const wizardProgress = document.getElementById('wizard-progress');
    if (wizardProgress) wizardProgress.style.display = (n === 4) ? 'none' : '';

    const cp = document.getElementById('continue-prompt');
    if (cp) cp.style.display = 'none';

    if (n < 4) updateWizardProgress();
    if (n === 2) buildCourseList();
    if (n === 3) {
      updateFeasibility();
      renderBusyDates();
      document.querySelectorAll('.rest-day-check').forEach(el => {
        const day = el.dataset.day;
        el.classList.toggle('checked', userConfig.rest_days.includes(day));
      });
      const startInput = document.getElementById('start-date-input');
      if (startInput) {
        const restored = userConfig.start_date || getLocalTodayStr();
        startInput.value = restored;
        userConfig.start_date = restored;
      }
      // ── ملاحظة أيام الراحة ──
      if (!document.getElementById('rest-days-note')) {
        const isAr = lang() === 'ar';
        const container = document.querySelector('.rest-day-checks');
        if (container && container.parentElement) {
          const note = document.createElement('div');
          note.id = 'rest-days-note';
          note.className = 'field-note';
          note.innerHTML = isAr
            ? '💡 أيام الراحة تُطبَّق <strong>فقط قبل أول اختبار</strong>. خلال فترة الاختبارات، كل الأيام متاحة للمذاكرة والمراجعة الذهبية. استخدم "أيام مشغولة" لاستثناء أيام محددة.'
            : '💡 Rest days apply <strong>only before the first exam</strong>. During exams, all days are available. Use "Busy dates" to exclude specific days.';
          container.parentElement.appendChild(note);
        }
      }
    }
  }

  function nextStep() {
    if (currentStep === 1 && !userConfig.plan_type) {
      showError(lang() === 'ar' ? 'اختر نوع الجدول أولاً' : 'Select a plan type first');
      return;
    }
    if (currentStep === 2) {
      const active = Object.values(userConfig.courses).filter(c => c.active);
      if (active.length === 0) {
        showError(lang() === 'ar' ? 'فعّل مادة واحدة على الأقل' : 'Enable at least one course');
        return;
      }
    }
    hideError();
    showStep(currentStep + 1);
  }

  function prevStep() {
    hideError();
    if (currentStep > 1) showStep(currentStep - 1);
  }

  function updateWizardProgress() {
    document.querySelectorAll('.wizard-step-indicator').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'done');
      if (s === currentStep) el.classList.add('active');
      else if (s < currentStep) el.classList.add('done');
    });
    document.querySelectorAll('.wizard-connector').forEach((c, i) => {
      c.classList.toggle('done', i + 1 < currentStep);
    });
  }

  // ─── Step 1: Plan Type ──────────────────────────────
  function selectPlanType(type) {
    userConfig.plan_type = type;
    userConfig.courses = {};
    document.querySelectorAll('.plan-type-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.planType === type);
    });
    hideError();
    setTimeout(() => nextStep(), 300);
  }

  // ─── Step 2: Course List ────────────────────────────
  function buildCourseList() {
    if (!curriculumMap) return;
    const container = document.getElementById('course-list');
    container.innerHTML = '';

    for (const [courseId, courseData] of Object.entries(curriculumMap.courses)) {
      const modules = Object.keys(courseData.modules);
      const isAr = lang() === 'ar';

      if (!userConfig.courses[courseId]) {
        const defaultModules = userConfig.plan_type === 'midterm'
          ? modules.slice(0, Math.min(6, modules.length))
          : [...modules];
        userConfig.courses[courseId] = {
          active: false,
          exam_date: '',
          included_modules: defaultModules,
          self_rating: {}
        };
        modules.forEach(m => {
          userConfig.courses[courseId].self_rating[m] = 'not_studied';
        });
      }

      const cfg = userConfig.courses[courseId];
      const block = document.createElement('div');
      block.className = 'course-block' + (cfg.active ? ' active-course' : '');
      block.id = 'course-' + courseId;
      const title = isAr ? courseData.name : courseData.name_en;

      block.innerHTML = `
        <div class="course-block-header" onclick="Planner.toggleCourse('${courseId}')">
          <div class="course-toggle ${cfg.active ? 'on' : ''}"></div>
          <div class="course-block-title">${title}</div>
          <div class="course-block-code">${courseId}</div>
        </div>
        <div class="course-block-body">
          ${userConfig.plan_type !== 'general' ? `
          <div class="course-field">
            <label>${isAr ? 'تاريخ الامتحان' : 'Exam Date'}</label>
            <input type="date" value="${cfg.exam_date}" onchange="Planner.setExamDate('${courseId}', this.value)">
          </div>` : ''}
          <div class="course-field">
            <label>${isAr ? 'الوحدات المشمولة' : 'Included Modules'}</label>
            <div class="module-checks">
              ${modules.map(m => `
                <div class="module-check ${cfg.included_modules.includes(m) ? 'checked' : ''}"
                     data-module="${m}" onclick="Planner.toggleModule('${courseId}','${m}',this)">
                  ${m}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="course-field">
            <label>${isAr ? 'تقييمك لنفسك في كل وحدة' : 'Self-rating per module'}</label>
            <div class="rating-grid">
              ${cfg.included_modules.map(m => {
                const mod = courseData.modules[m];
                return `
                <div class="rating-row">
                  <span class="rating-module-label">${m}</span>
                  <div class="rating-options">
                    ${Object.keys(RATING_LABELS[isAr ? 'ar' : 'en']).map(r => `
                      <div class="rating-option ${cfg.self_rating[m] === r ? 'selected' : ''}"
                           data-rating="${r}"
                           onclick="Planner.setRating('${courseId}','${m}','${r}',this)">
                        ${RATING_LABELS[isAr ? 'ar' : 'en'][r]}
                      </div>
                    `).join('')}
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
      container.appendChild(block);
    }
  }

  function toggleCourse(courseId) {
    const cfg = userConfig.courses[courseId];
    cfg.active = !cfg.active;
    const block = document.getElementById('course-' + courseId);
    block.classList.toggle('active-course', cfg.active);
    block.querySelector('.course-toggle').classList.toggle('on', cfg.active);
  }

  function setExamDate(courseId, date) {
    userConfig.courses[courseId].exam_date = date;
  }

  function toggleModule(courseId, modId, el) {
    const cfg = userConfig.courses[courseId];
    const idx = cfg.included_modules.indexOf(modId);
    if (idx >= 0) { cfg.included_modules.splice(idx, 1); el.classList.remove('checked'); }
    else { cfg.included_modules.push(modId); cfg.included_modules.sort(); el.classList.add('checked'); }
  }

  function setRating(courseId, modId, rating, el) {
    userConfig.courses[courseId].self_rating[modId] = rating;
    el.parentElement.querySelectorAll('.rating-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  }

  // ─── Step 3: Session Config ─────────────────────────
  function setConfig(key, value, el) {
    userConfig[key] = value;
    el.parentElement.querySelectorAll('.config-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    updateFeasibility();
  }

  function toggleRestDay(el) {
    const day = el.dataset.day;
    el.classList.toggle('checked');
    if (el.classList.contains('checked')) {
      if (!userConfig.rest_days.includes(day)) userConfig.rest_days.push(day);
    } else {
      userConfig.rest_days = userConfig.rest_days.filter(d => d !== day);
    }
    updateFeasibility();
  }

  function addBusyDate() {
    const input = document.getElementById('busy-date-input');
    if (!input.value) return;
    if (!userConfig.busy_dates.includes(input.value)) {
      userConfig.busy_dates.push(input.value);
      renderBusyDates();
      updateFeasibility();
    }
    input.value = '';
  }

  function removeBusyDate(date) {
    userConfig.busy_dates = userConfig.busy_dates.filter(d => d !== date);
    renderBusyDates();
    updateFeasibility();
  }

  function renderBusyDates() {
    const list = document.getElementById('busy-dates-list');
    list.innerHTML = userConfig.busy_dates.map(d => `
      <span class="busy-date-tag">${d} <span class="remove-busy" onclick="Planner.removeBusyDate('${d}')">×</span></span>
    `).join('');
  }

  function updateFeasibility() {
    const isAr = lang() === 'ar';
    const statsEl = document.getElementById('feasibility-stats');
    const statusEl = document.getElementById('feasibility-status');

    const activeCourses = getActiveCourses(userConfig);
    if (activeCourses.length === 0) {
      statsEl.innerHTML = '';
      statusEl.textContent = isAr ? 'فعّل مادة واحدة على الأقل' : 'Enable at least one course';
      statusEl.className = 'feasibility-status';
      return;
    }

    const firstExam = getFirstExamDate(userConfig);
    let earliestExam = null;
    if (userConfig.plan_type !== 'general') {
      for (const [, cfg] of activeCourses) {
        if (cfg.exam_date) {
          const d = new Date(cfg.exam_date);
          if (!earliestExam || d < earliestExam) earliestExam = d;
        }
      }
    }

    const today = userConfig.start_date ? new Date(userConfig.start_date + 'T00:00:00') : new Date();
    today.setHours(0, 0, 0, 0);
    const latestExam = getLatestExamDate(userConfig);
    let totalDays = latestExam
      ? Math.max(1, Math.ceil((new Date(latestExam + 'T00:00:00') - today) / 86400000))
      : 90;

    let availDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayName = getDayName(d);
      const dateStr = toLocalDateStr(d);
      // ── قاعدة جديدة: أيام الراحة فقط قبل أول اختبار ──
      if (userConfig.rest_days.includes(dayName) && (!firstExam || dateStr < firstExam)) continue;
      if ((userConfig.busy_dates || []).includes(dateStr)) continue;
      if (isExamDate(dateStr, userConfig)) continue;
      availDays++;
    }

    const availSessions = availDays * userConfig.daily_sessions;
    let criticalModules = 0, reviewModules = 0;
    for (const [, cfg] of activeCourses) {
      for (const m of cfg.included_modules) {
        const r = cfg.self_rating[m] || 'not_studied';
        if (r === 'weak' || r === 'not_studied') criticalModules++;
        else reviewModules++;
      }
    }

    const totalModules = criticalModules + reviewModules;
    const ratio = totalModules > 0 ? availSessions / totalModules : 999;

    let status, label;
    if (ratio >= 1.5) { status = 'comfortable'; label = isAr ? '✅ ممتاز — لديك وقت كافٍ' : '✅ Excellent — plenty of time'; }
    else if (ratio >= 1.0) { status = 'feasible'; label = isAr ? '✅ ممكن (مع هامش مراجعة)' : '✅ Feasible (with review margin)'; }
    else if (ratio >= 0.7) { status = 'tight'; label = isAr ? '⚠️ ضيّق — قد تحتاج تقليص الراحة' : '⚠️ Tight — may need fewer rest days'; }
    else { status = 'critical'; label = isAr ? '🔴 حرج — ركّز على أهم الوحدات فقط' : '🔴 Critical — focus on key modules only'; }

    statsEl.innerHTML = `
      <div class="feasibility-stat"><span class="feasibility-stat-icon">📅</span><div><div class="feasibility-stat-text">${isAr ? 'أيام متاحة' : 'Available days'}</div><div class="feasibility-stat-value">${availDays} ${isAr ? 'يوم' : 'days'}</div></div></div>
      <div class="feasibility-stat"><span class="feasibility-stat-icon">⏱️</span><div><div class="feasibility-stat-text">${isAr ? 'إجمالي الجلسات' : 'Total sessions'}</div><div class="feasibility-stat-value">${availSessions}</div></div></div>
      <div class="feasibility-stat"><span class="feasibility-stat-icon">📚</span><div><div class="feasibility-stat-text">${isAr ? 'وحدات للدراسة' : 'Modules to study'}</div><div class="feasibility-stat-value">${totalModules}</div></div></div>
      <div class="feasibility-stat"><span class="feasibility-stat-icon">🔴</span><div><div class="feasibility-stat-text">${isAr ? 'وحدات حرجة' : 'Critical modules'}</div><div class="feasibility-stat-value">${criticalModules}</div></div></div>
    `;
    statusEl.textContent = label;
    statusEl.className = 'feasibility-status ' + status;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: Core Scheduling Engine
  // Both local and hybrid modes use these same functions
  // ═══════════════════════════════════════════════════════════════

  // ── الخطوة 1: توليد كل الأيام وتصنيفها ──────────────────
  function buildLocalSkeleton(config, cMap) {
    const start = new Date(config.start_date + 'T00:00:00');
    const latestExam = getLatestExamDate(config);
    const end = latestExam ? new Date(latestExam + 'T00:00:00') : new Date(start.getTime() + 90 * 86400000);
    const firstExam = getFirstExamDate(config);
    const totalDays = Math.ceil((end - start) / 86400000) + 1;
    const days = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateStr(d);
      const dayName = getDayName(d);

      let dayType = 'study';

      // ── قاعدة: أيام الراحة فقط قبل أول اختبار ──
      if (config.rest_days.includes(dayName)) {
        if (!firstExam || dateStr < firstExam) {
          dayType = 'rest';
        }
      }

      // أيام مشغولة تُطبّق دائماً
      if ((config.busy_dates || []).includes(dateStr)) dayType = 'rest';

      // أيام الاختبارات
      if (isExamDate(dateStr, config)) dayType = 'exam';

      days.push({
        date: dateStr,
        day_type: dayType,
        sessions: [],
        session_slots: dayType === 'study' ? config.daily_sessions : 0
      });
    }

    // ── حقن جلسات الاختبار ──
    const isAr = lang() === 'ar';
    for (const day of days) {
      if (day.day_type !== 'exam') continue;
      const exams = getExamCoursesOnDate(day.date, config, cMap);
      for (const ex of exams) {
        day.sessions.push({
          session_number: day.sessions.length + 1,
          course_id: ex.cid,
          module_id: 'Exam',
          module_id_ar: 'اختبار',
          module_id_en: 'Exam',
          modules: [],
          mode: 'exam',
          difficulty_avg: 10,
          session_type: 'exam',
          is_critical: false,
          ai_note_ar: `📝 اختبار ${ex.name} — بالتوفيق!`,
          ai_note_en: `📝 ${ex.name_en} Exam — Good luck!`,
          ai_note: '',
          must_know_today: [], must_know_today_en: [],
          must_memorize_today: [], must_memorize_today_en: [],
          completed: false, _snoozeCount: 0,
          cross_link_alert: { active: false, message: null }
        });
      }
    }

    return days;
  }

  // ── الخطوة 2.5: حجز أيام المراجعة الذهبية (قبل توزيع الجلسات) ──
  function markGoldenReviewDays(days, config) {
    if (config.plan_type === 'general') return;
    const activeCourses = getActiveCourses(config);

    // رتّب بتاريخ الاختبار (الأقرب أولاً)
    const sorted = [...activeCourses].sort(([, a], [, b]) => {
      if (!a.exam_date) return 1;
      if (!b.exam_date) return -1;
      return a.exam_date.localeCompare(b.exam_date);
    });

    for (const [cid, cfg] of sorted) {
      if (!cfg.exam_date) continue;

      // Pass 1: ابحث عن يوم نظيف مستقل
      let reserved = false;
      for (let back = 1; back <= 7; back++) {
        const date = subtractDays(cfg.exam_date, back);
        const entry = days.find(d => d.date === date);
        if (!entry) continue;
        if (entry.day_type === 'exam') continue;
        if (entry.day_type === 'golden_review') continue;

        // يوم نظيف — احجزه (حتى لو كان rest)
        if (entry.day_type === 'rest') {
          entry.rest_override = true;
          entry.session_slots = config.daily_sessions;
        }
        entry.day_type = 'golden_review';
        entry._golden_for = cid;
        reserved = true;
        break;
      }

      // Pass 2: شارك golden_review موجود
      if (!reserved) {
        for (let back = 1; back <= 7; back++) {
          const date = subtractDays(cfg.exam_date, back);
          const entry = days.find(d => d.date === date);
          if (!entry || entry.day_type === 'exam') continue;
          if (entry.day_type === 'golden_review') {
            reserved = true;
            break;
          }
        }
      }
    }
  }

  // ── الخطوة 2: توزيع المذاكرة الأساسية ────────────────
  function distributeCoreSessions(days, config, cMap) {
    const activeCourses = getActiveCourses(config);
    const mps = config.modules_per_session || 1;

    // بناء queue لكل مادة بالترتيب التسلسلي
    const courseQueues = {};
    for (const [cid, cfg] of activeCourses) {
      const sortedModules = [...cfg.included_modules].sort();
      courseQueues[cid] = sortedModules.map((m, idx) => {
        const rating = cfg.self_rating[m] || 'not_studied';
        const diff = cMap.courses[cid]?.modules[m]?.module_difficulty || 5;
        const mode = (rating === 'not_studied' || rating === 'weak') ? 'deep'
                   : rating === 'good' ? 'full' : 'flash';
        return {
          session_type: 'core', cid, mid: m, mode, diff,
          exam_date: cfg.exam_date || null,
          sequential_order: idx
        };
      });
    }

    const mergedQueue = buildMergedQueue(courseQueues, mps);
    const studyDays = days.filter(d => d.day_type === 'study');

    for (const session of mergedQueue) {
      const eligibleDays = studyDays.filter(d => {
        if (session.exam_date && d.date >= session.exam_date) return false;
        if (d.sessions.length >= config.daily_sessions) return false;
        return true;
      });
      if (eligibleDays.length === 0) break;

      const targetDay = eligibleDays[0]; // تعبئة تسلسلية
      targetDay.sessions.push({
        session_number: targetDay.sessions.length + 1,
        course_id: session.cid,
        module_id: session.mid,
        modules: session.modules || [session.mid],
        mode: session.mode,
        difficulty_avg: session.diff,
        session_type: 'core',
        exam_date: session.exam_date,
        is_critical: session.diff >= 7,
        ai_note_ar: '', ai_note_en: '', ai_note: '',
        must_know_today: [], must_know_today_en: [],
        must_memorize_today: [], must_memorize_today_en: [],
        completed: false, _snoozeCount: 0,
        cross_link_alert: { active: false, message: null }
      });
    }

    return days;
  }

  // ── buildMergedQueue — دمج المودلات حسب mps ──────────
  function buildMergedQueue(courseQueues, mps) {
    const perCourse = [];

    if (mps < 1) {
      // 0.5: مودل واحد على جلستين
      const sessionsPerMod = Math.round(1 / mps);
      for (const [cid, queue] of Object.entries(courseQueues)) {
        for (const s of queue) {
          for (let p = 1; p <= sessionsPerMod; p++) {
            perCourse.push({
              ...s,
              mid: `${s.mid} (${p}/${sessionsPerMod})`,
              modules: [s.mid],
              _partLabel: `(${p}/${sessionsPerMod})`
            });
          }
        }
      }
    } else {
      const step = Math.round(mps);
      for (const [cid, queue] of Object.entries(courseQueues)) {
        for (let i = 0; i < queue.length; i += step) {
          const chunk = queue.slice(i, i + step);
          const midStr = chunk.map(c => c.mid).join(' + ');
          const avgDiff = chunk.reduce((s, c) => s + c.diff, 0) / chunk.length;
          perCourse.push({
            session_type: 'core',
            cid: chunk[0].cid,
            mid: midStr,
            modules: chunk.map(c => c.mid),
            mode: chunk[0].mode,
            diff: avgDiff,
            exam_date: chunk[0].exam_date,
            sequential_order: chunk[0].sequential_order
          });
        }
      }
    }

    return interleaveRoundRobin(perCourse);
  }

  function interleaveRoundRobin(sessions) {
    const byCourse = {};
    for (const s of sessions) {
      const key = s.cid;
      if (!byCourse[key]) byCourse[key] = [];
      byCourse[key].push(s);
    }
    const result = [];
    const queues = Object.values(byCourse);
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const q of queues) {
        if (q.length) { result.push(q.shift()); hasMore = true; }
      }
    }
    return result;
  }

  // ── الخطوة 3: تخصيص المراجعة الذهبية ─────────────────
  // قاعدة المستخدم: جلسة واحدة لكل مادة (مراجعة شاملة flash)
  function distributeGoldenReviews(days, config, cMap) {
    if (config.plan_type === 'general') return days;
    const activeCourses = getActiveCourses(config);
    const isAr = lang() === 'ar';

    const sortedCourses = [...activeCourses].sort(([, a], [, b]) => {
      if (!a.exam_date) return 1;
      if (!b.exam_date) return -1;
      return a.exam_date.localeCompare(b.exam_date);
    });

    for (const [cid, cfg] of sortedCourses) {
      if (!cfg.exam_date) continue;
      const courseName = cMap.courses[cid]?.name || cid;
      const courseNameEn = cMap.courses[cid]?.name_en || cid;
      const allModules = [...cfg.included_modules].sort();

      // ── أولوية 1: اليوم المحجوز تحديداً لهذه المادة ──
      let targetEntry = days.find(d => d._golden_for === cid && d.day_type === 'golden_review');

      // ── أولوية 2: يوم golden_review مشترك (حُجز لمادة أخرى لكن يتسع) ──
      if (!targetEntry) {
        for (let daysBack = 1; daysBack <= 7; daysBack++) {
          const candidateDate = subtractDays(cfg.exam_date, daysBack);
          const candidateEntry = days.find(d => d.date === candidateDate);
          if (!candidateEntry) continue;
          if (candidateEntry.day_type === 'exam') continue;
          if (candidateEntry.day_type === 'golden_review') { targetEntry = candidateEntry; break; }
        }
      }

      // ── أولوية 3: أي يوم متاح (study أو rest) ──
      if (!targetEntry) {
        for (let daysBack = 1; daysBack <= 7; daysBack++) {
          const candidateDate = subtractDays(cfg.exam_date, daysBack);
          const candidateEntry = days.find(d => d.date === candidateDate);
          if (!candidateEntry) continue;
          if (candidateEntry.day_type === 'exam') continue;
          targetEntry = candidateEntry;
          break;
        }
      }

      if (!targetEntry) continue;

      // تحويل اليوم
      if (targetEntry.day_type === 'rest') {
        targetEntry.day_type = 'golden_review';
        targetEntry.session_slots = config.daily_sessions;
        targetEntry.rest_override = true;
      } else if (targetEntry.day_type === 'study') {
        targetEntry.day_type = 'golden_review';
      }
      // إذا كان golden_review بالفعل → فقط أضف

      if (!targetEntry.sessions) targetEntry.sessions = [];

      // ── جلسة واحدة لكل مادة (مراجعة شاملة لجميع المودلات) ──
      const avgDiff = allModules.reduce((sum, m) => {
        return sum + (cMap.courses[cid]?.modules[m]?.module_difficulty || 5);
      }, 0) / allModules.length;

      // ── رابط المراجعة حسب نوع الجدول ──
      const reviewUrl = config.plan_type === 'midterm'
        ? `../${cid}/midterm-review.html`
        : config.plan_type === 'final'
          ? `../${cid}/final-review.html`
          : buildStudyURL(cid, allModules[0] || 'M01');

      // ── جمع أهم المعلومات من كل المودلات (وليس M01 فقط) ──
      const allMustKnow = [], allMustKnowEn = [];
      const allMustMem = [], allMustMemEn = [];
      for (const m of allModules) {
        const modData = cMap.courses[cid]?.modules[m];
        if (!modData?.topics) continue;
        for (const t of modData.topics) {
          if (t.must_know?.[0] && allMustKnow.length < 5) allMustKnow.push(t.must_know[0]);
          if (t.must_know_en?.[0] && allMustKnowEn.length < 5) allMustKnowEn.push(t.must_know_en[0]);
          if (t.must_memorize?.[0] && allMustMem.length < 3) allMustMem.push(t.must_memorize[0]);
          if (t.must_memorize_en?.[0] && allMustMemEn.length < 3) allMustMemEn.push(t.must_memorize_en[0]);
        }
      }

      // ── تعليق إيجابي مبني من معلومات المادة ──
      const topicCount = allModules.reduce((sum, m) => {
        return sum + (cMap.courses[cid]?.modules[m]?.topics?.length || 0);
      }, 0);
      const goldenMsgAr = `🌟 أنت درست ${allModules.length} وحدات و ${topicCount} موضوع في ${courseName} — اليوم تُثبّت كل شيء!`;
      const goldenMsgEn = `🌟 You studied ${allModules.length} modules & ${topicCount} topics in ${courseNameEn} — today you lock it all in!`;

      targetEntry.sessions.push({
        session_number: targetEntry.sessions.length + 1,
        course_id: cid,
        module_id: `Golden Review (${allModules.length} modules)`,
        module_id_ar: `مراجعة ذهبية (${allModules.length} وحدة)`,
        module_id_en: `Golden Review (${allModules.length} modules)`,
        modules: allModules,
        mode: 'flash',
        difficulty_avg: Math.round(avgDiff * 10) / 10,
        session_type: 'golden_review',
        exam_date: cfg.exam_date,
        is_critical: true,
        study_url: reviewUrl,
        golden_message_ar: goldenMsgAr,
        golden_message_en: goldenMsgEn,
        ai_note_ar: `⭐ مراجعة ذهبية شاملة — ${courseName} — راجع جميع الوحدات بسرعة`,
        ai_note_en: `⭐ Golden review — ${courseNameEn} — Quick pass over all modules`,
        ai_note: '',
        must_know_today: allMustKnow,
        must_know_today_en: allMustKnowEn,
        must_memorize_today: allMustMem,
        must_memorize_today_en: allMustMemEn,
        completed: false, _snoozeCount: 0,
        cross_link_alert: { active: false, message: null }
      });
    }
    return days;
  }

  // ── الخطوة 4: توزيع المراجعة المتباعدة ───────────────
  function distributeSpacedReviews(days, config, cMap) {
    const isAr = lang() === 'ar';

    // جمع المودلات المكتملة
    const studiedMap = new Map();

    for (const day of days) {
      for (const s of day.sessions) {
        if (s.session_type !== 'core') continue;

        for (const mid of (s.modules || [s.module_id])) {
          const rawMid = mid.trim();
          const partMatch = rawMid.match(/^(.+?)\s+\((\d+)\/(\d+)\)$/);

          if (partMatch) {
            const cleanMid = partMatch[1].trim();
            const partNum = parseInt(partMatch[2]);
            const totalParts = parseInt(partMatch[3]);
            if (partNum < totalParts) continue; // لم يكتمل بعد
            const key = `${s.course_id}_${cleanMid}`;
            if (!studiedMap.has(key)) {
              studiedMap.set(key, {
                cid: s.course_id, mid: cleanMid, studiedOn: day.date,
                diff: cMap.courses[s.course_id]?.modules[cleanMid]?.module_difficulty || 5,
                exam_date: s.exam_date
              });
            }
          } else {
            const cleanMid = rawMid.split(' + ')[0].trim();
            const key = `${s.course_id}_${cleanMid}`;
            if (!studiedMap.has(key)) {
              studiedMap.set(key, {
                cid: s.course_id, mid: cleanMid, studiedOn: day.date,
                diff: cMap.courses[s.course_id]?.modules[cleanMid]?.module_difficulty || 5,
                exam_date: s.exam_date
              });
            }
          }
        }
      }
    }

    const studiedModules = [...studiedMap.values()].sort((a, b) => b.diff - a.diff);

    for (const item of studiedModules) {
      for (const interval of [1, 3, 7]) {
        if (countRemainingSlots(days, config) === 0) return days;

        const targetDate = addDaysToDate(item.studiedOn, interval);
        let targetDay = days.find(d => {
          if (d.date !== targetDate) return false;
          if (['exam', 'golden_review'].includes(d.day_type)) return false;
          if (item.exam_date && d.date >= item.exam_date) return false;
          if (d.sessions.length >= config.daily_sessions) return false;
          return true;
        });

        if (!targetDay)
          targetDay = findNearestAvailableDay(days, targetDate, item.exam_date, config);
        if (!targetDay) continue;

        const courseName = cMap.courses[item.cid]?.name || item.cid;
        const courseNameEn = cMap.courses[item.cid]?.name_en || item.cid;

        targetDay.sessions.push({
          session_number: targetDay.sessions.length + 1,
          course_id: item.cid,
          module_id: item.mid,
          modules: [item.mid],
          mode: 'flash',
          difficulty_avg: item.diff,
          session_type: 'spaced_review',
          exam_date: item.exam_date,
          is_critical: false,
          ai_note_ar: `🔄 مراجعة متباعدة (${interval} يوم) — ${courseName}`,
          ai_note_en: `🔄 Spaced review (${interval}d) — ${courseNameEn}`,
          ai_note: '',
          must_know_today: [], must_know_today_en: [],
          must_memorize_today: [], must_memorize_today_en: [],
          completed: false, _snoozeCount: 0,
          cross_link_alert: { active: false, message: null },
          original_study_date: item.studiedOn,
          interval_days: interval
        });
      }
    }
    return days;
  }

  function countRemainingSlots(days, config) {
    return days.filter(d => d.day_type === 'study')
      .reduce((sum, d) => sum + Math.max(0, config.daily_sessions - d.sessions.length), 0);
  }

  function findNearestAvailableDay(days, targetDate, examDate, config) {
    let best = null, bestDist = Infinity;
    for (const d of days) {
      if (['exam', 'golden_review', 'rest'].includes(d.day_type)) continue;
      if (examDate && d.date >= examDate) continue;
      if (d.sessions.length >= config.daily_sessions) continue;
      const dist = Math.abs(dateDiffDays(d.date, targetDate));
      if (dist < bestDist) { best = d; bestDist = dist; }
    }
    return best;
  }

  // ── التحقق المسبق ────────────────────────────────────
  function validateBeforeSend(days, config, cMap) {
    const activeCourses = getActiveCourses(config);
    const errors = [];

    const covered = new Set();
    for (const day of days) {
      for (const s of day.sessions) {
        if (s.session_type !== 'core') continue;
        (s.modules || [s.module_id]).forEach(m =>
          covered.add(`${s.course_id}_${m.replace(/ \(\d\/\d\)/, '').trim()}`)
        );
      }
    }

    const uncovered = [];
    for (const [cid, cfg] of activeCourses) {
      for (const m of cfg.included_modules) {
        if (!covered.has(`${cid}_${m}`)) uncovered.push(`${cid}-${m}`);
      }
    }

    if (uncovered.length > 0) {
      const totalSlots = days.filter(d => d.day_type === 'study')
        .reduce((s, d) => s + (d.session_slots || config.daily_sessions), 0);
      const totalModules = activeCourses.reduce((s, [, cfg]) => s + cfg.included_modules.length, 0);
      errors.push({
        type: 'insufficient_sessions',
        message_ar:
          `لا يمكن إنشاء الجدول:\n` +
          `الجلسات المتاحة (${totalSlots}) لا تكفي لتغطية كل المودلات (${totalModules}).\n` +
          `المودلات غير المغطاة: ${uncovered.join(', ')}\n\n` +
          `الحلول:\n① زد عدد الجلسات اليومية\n② زد المودلات لكل جلسة\n` +
          `③ قلّل أيام الراحة\n④ قلّل عدد المواد المُفعَّلة`,
        message_en:
          `Cannot generate: ${totalSlots} sessions cannot cover ${totalModules} modules.\n` +
          `Uncovered: ${uncovered.join(', ')}`
      });
    }

    return { canSend: errors.length === 0, errors };
  }

  // ── التحقق اللاحق ────────────────────────────────────
  function validateAfterReceive(plan, config, cMap) {
    const activeCourses = getActiveCourses(config);
    const critical = [], warnings = [];

    // مودل بلا جلسة core
    const covered = new Set();
    for (const day of (plan.days || plan)) {
      for (const s of (day.sessions || [])) {
        if (s.session_type === 'core')
          (s.modules || [s.module_id]).forEach(m =>
            covered.add(`${s.course_id}_${m.replace(/ \(\d\/\d\)/, '').trim()}`)
          );
      }
    }
    for (const [cid, cfg] of activeCourses) {
      for (const m of cfg.included_modules) {
        if (!covered.has(`${cid}_${m}`))
          critical.push(`مودل بلا جلسة: ${cid}-${m}`);
      }
    }

    // مادة بلا مراجعة ذهبية
    if (config.plan_type !== 'general') {
      const daysArr = plan.days || plan;
      for (const [cid, cfg] of activeCourses) {
        if (!cfg.exam_date) continue;
        const hasGolden = daysArr.some(d =>
          d.day_type === 'golden_review' &&
          d.sessions?.some(s => s.course_id === cid && s.session_type === 'golden_review')
        );
        if (!hasGolden) critical.push(`مادة بلا مراجعة ذهبية: ${cid}`);
      }
    }

    // يوم تجاوز الحد الأقصى
    const daysArr = plan.days || plan;
    for (const day of daysArr) {
      if (['exam', 'rest', 'golden_review'].includes(day.day_type)) continue;
      if ((day.sessions || []).length > config.daily_sessions)
        warnings.push(`يوم تجاوز الحد: ${day.date}`);
    }

    return { valid: critical.length === 0, critical, warnings };
  }

  // ── حقن بيانات المناهج ────────────────────────────────
  function injectCurriculumData(skeleton, cMap) {
    for (const day of skeleton) {
      for (const session of (day.sessions || [])) {
        if (session.mode === 'exam') continue;
        const modules = session.modules || [session.module_id];
        for (const mid of modules) {
          const cleanMid = mid.replace(/ \(\d\/\d\)/, '').trim().split(' + ')[0];
          const modData = cMap.courses?.[session.course_id]?.modules?.[cleanMid];
          if (!modData) continue;

          if (!session.must_know_today?.length) {
            session.must_know_today = modData.topics?.[0]?.must_know?.slice(0, 2) || [];
          }
          if (!session.must_memorize_today?.length) {
            session.must_memorize_today = modData.topics?.[0]?.must_memorize?.slice(0, 1) || [];
          }

          // English: ALWAYS fill from curriculum — AI doesn't provide these
          // This prevents Arabic text from appearing in English view
          const enKnow = modData.topics?.[0]?.must_know_en?.slice(0, 2) || [];
          const enMem = modData.topics?.[0]?.must_memorize_en?.slice(0, 1) || [];
          if (enKnow.length > 0 && !session.must_know_today_en?.length) session.must_know_today_en = enKnow;
          if (enMem.length > 0 && !session.must_memorize_today_en?.length) session.must_memorize_today_en = enMem;

          if (!session.study_url) {
            session.study_url = buildStudyURL(session.course_id, cleanMid);
          }
        }
      }
    }
  }

  function buildStudyURL(courseId, moduleId) {
    const folder = courseId;
    const num = parseInt(moduleId.replace(/^M/i, ''));
    return `../${folder}/M${String(num).padStart(2, '0')}.html`;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: AI Integration
  // ═══════════════════════════════════════════════════════════════

  function buildRichCurriculum(config, cMap) {
    const activeCourses = getActiveCourses(config);
    const richCurriculum = {};
    for (const [cid, cfg] of activeCourses) {
      const courseData = cMap.courses[cid];
      if (!courseData) continue;
      richCurriculum[cid] = { name: courseData.name_en, modules: {} };
      for (const m of cfg.included_modules) {
        const mod = courseData.modules[m];
        if (!mod) continue;
        const prereqs = new Set(), crossLinks = [], topicTypes = [], commonMistakes = [];
        let maxConceptual = 0, maxExamApp = 0;
        for (const t of (mod.topics || [])) {
          for (const prereqTopic of (t.prerequisites || [])) {
            const match = prereqTopic.match(new RegExp(`^${cid}_(M\\d+)_`));
            if (match && match[1] !== m) prereqs.add(match[1]);
          }
          for (const link of (t.cross_course_links || [])) {
            if (typeof link === 'string') crossLinks.push(link);
            else if (link.topic_id) crossLinks.push(link.topic_id);
          }
          if (t.type && !topicTypes.includes(t.type)) topicTypes.push(t.type);
          if (t.difficulty) {
            maxConceptual = Math.max(maxConceptual, t.difficulty.conceptual_abstraction || 0);
            maxExamApp = Math.max(maxExamApp, t.difficulty.exam_application || 0);
          }
          if (t.common_mistakes?.[0] && commonMistakes.length < 2) commonMistakes.push(t.common_mistakes[0]);
        }
        richCurriculum[cid].modules[m] = {
          title: mod.title_en, diff: mod.module_difficulty, hours: mod.study_hours_estimate,
          types: topicTypes, prereqs: [...prereqs].sort(), cross_links: crossLinks,
          conceptual: maxConceptual, exam_app: maxExamApp, mistakes: commonMistakes
        };
      }
    }
    return richCurriculum;
  }

  function buildAIPrompt(localSkeleton, config, cMap) {
    const compactDays = localSkeleton
      .filter(d => d.sessions.length > 0)
      .map(d => ({
        date: d.date, type: d.day_type,
        sessions: d.sessions.map(s => ({
          sn: s.session_number, cid: s.course_id, mid: s.module_id,
          mods: s.modules, mode: s.mode, diff: s.difficulty_avg, stype: s.session_type
        }))
      }));

    const richCurriculum = buildRichCurriculum(config, cMap);
    const examInfo = Object.entries(config.courses)
      .filter(([, c]) => c.active && c.exam_date)
      .map(([cid, c]) => `${cid}: ${c.exam_date}`)
      .join(', ');

    const systemPrompt = `أنت مستشار أكاديمي لطلاب علوم الحاسوب. مهمتك الوحيدة:
إثراء الجدول الدراسي المعطى بمحتوى تعليمي ذكي.

قواعد صارمة لا استثناء فيها:
1. لا تُعدّل أي تاريخ أو ترتيب جلسة في الهيكل المعطى.
2. لا تُضف جلسات. لا تحذف جلسات.
3. الترتيب التسلسلي M01→M02→M03 محدد ومحمي.
4. الربط المفاهيمي يعني: اذكره في ai_note فقط.
5. كل حقل يحتوي على نسخة عربية وإنجليزية (ai_note + ai_note_en، daily_tip + daily_tip_en).
6. لا تكرر نفس الملاحظة لجلسات مختلفة من نفس المودل — نوّع حسب السياق (دراسة أولى / جزء ثانٍ / مراجعة).
7. أجب بـ JSON نظيف فقط.`;

    // ── Cache-optimized prompt: static content FIRST, dynamic content LAST ──
    // DeepSeek caches prefix matches — identical beginnings = cheaper reruns
    const userPrompt = `## القواعد والتعليمات (ثابتة)
⚠️ أعِد كل الأيام والجلسات كما هي. المفاتيح sn وcid وmid يجب أن تطابق تماماً.
⚠️ أجب بالعربية في ai_note وبالإنجليزية في ai_note_en.
⚠️ لا تكرر نفس الملاحظة لجلسات مختلفة من نفس المودل — نوّع حسب السياق.

## المطلوب لكل جلسة (أضف حسب sn + cid + mid):
- "topics_focus": [topic_id, ...]
- "must_know_today": ["جملة واحدة بالعربية"]
- "must_memorize_today": ["جملة واحدة بالعربية"]
- "is_critical": true|false
- "estimated_minutes": 60|90|120
- "ai_note": "جملة واحدة بالعربية — نصيحة أو ربط أو تحذير"
- "ai_note_en": "Same tip in English"
- "cross_link_alert": {"active": bool, "message": "نص بالعربية", "message_en": "English text"} أو null

## المطلوب لكل يوم:
- "daily_tip": "جملة واحدة بالعربية"
- "daily_tip_en": "Same tip in English"
- "week_theme": "3 كلمات بالعربية"

## المطلوب على مستوى الجدول:
- "critical_warnings": [{"type": "time_pressure|dependency_risk|overload", "message": "...", "affected": ["CS350-M04"]}]

## شكل الناتج:
{"days":[{"date":"YYYY-MM-DD","daily_tip":"...","daily_tip_en":"...","week_theme":"...","sessions":[{"sn":1,"cid":"CS350","mid":"M01","topics_focus":[],"must_know_today":[],"must_memorize_today":[],"is_critical":false,"estimated_minutes":90,"ai_note":"...","ai_note_en":"...","cross_link_alert":null}]}],"critical_warnings":[]}

## بيانات المناهج (ثابتة — للاستخدام في المحتوى)
${JSON.stringify(richCurriculum, null, 0)}

## مواعيد الاختبارات
${examInfo || 'لا يوجد'}

## الجدول المحدد مسبقاً (أضف إليه فقط — لا تعدّله)
${JSON.stringify(compactDays, null, 0)}`;

    return { system: systemPrompt, user: userPrompt };
  }

  function mergeAIResponse(localSkeleton, aiResponse) {
    if (!aiResponse?.days) {
      injectCurriculumData(localSkeleton, curriculumMap);
      return localSkeleton;
    }

    const aiDayIndex = {};
    for (const aiDay of aiResponse.days) aiDayIndex[aiDay.date] = aiDay;

    for (const localDay of localSkeleton) {
      const aiDay = aiDayIndex[localDay.date];
      if (!aiDay) continue;

      if (aiDay.daily_tip) localDay.daily_tip_ar = aiDay.daily_tip;
      if (aiDay.daily_tip_en) localDay.daily_tip_en = aiDay.daily_tip_en;
      if (aiDay.week_theme) localDay.week_theme = aiDay.week_theme;

      const aiSessionIndex = {};
      for (const s of (aiDay.sessions || [])) {
        aiSessionIndex[`${s.sn}_${s.cid}_${s.mid}`] = s;
      }

      for (const ls of localDay.sessions) {
        const key = `${ls.session_number}_${ls.course_id}_${ls.module_id}`;
        const as = aiSessionIndex[key];
        if (!as) continue;

        if (as.topics_focus) ls.topics_focus = as.topics_focus;
        if (as.must_know_today) ls.must_know_today = as.must_know_today;
        if (as.must_memorize_today) ls.must_memorize_today = as.must_memorize_today;
        if (as.is_critical != null) ls.is_critical = as.is_critical;
        if (as.estimated_minutes) ls.estimated_minutes = as.estimated_minutes;

        // ── AI notes: save to specific language fields ONLY ──
        if (as.ai_note) ls.ai_note_ar = as.ai_note;
        if (as.ai_note_en) ls.ai_note_en = as.ai_note_en;

        // ── Bilingual cross_link_alert ──
        if (as.cross_link_alert) {
          ls.cross_link_alert = {
            active: as.cross_link_alert.active || false,
            message: as.cross_link_alert.message || null,
            message_en: as.cross_link_alert.message_en || null
          };
        }
      }
    }

    if (aiResponse.critical_warnings?.length) {
      localSkeleton._critical_warnings = aiResponse.critical_warnings;
    }

    injectCurriculumData(localSkeleton, curriculumMap);
    return localSkeleton;
  }

  async function callAIWorker(systemMsg, userMsg) {
    const messages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg }
    ];

    const localKey = isLocalServer() ? await EnvLoader.getDeepseekKey() : '';

    if (localKey) {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localKey },
        body: JSON.stringify({
          model: 'deepseek-chat', messages: messages.slice(0, 5),
          max_tokens: MAX_TOKENS, temperature: 0.3, stream: false,
          response_format: { type: 'json_object' }
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.status);
      const raw = await response.json();
      return raw.choices?.[0]?.message?.content || '';
    } else {
      const response = await fetch(PLANNER_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages, max_tokens: MAX_TOKENS, temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.status);
      const data = await response.json();
      if (data.error) throw new Error(data.message_ar || data.error);
      return data.text || data.choices?.[0]?.message?.content || '';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: Plan Normalization & Finalization
  // ═══════════════════════════════════════════════════════════════

  function normalizePlanDays(days) {
    if (!days || days.length === 0) return [];
    const firstDate = days[0].date;

    return days.map(day => {
      const weekNum = Math.floor(dateDiffDays(day.date, firstDate) / 7) + 1;
      return {
        ...day,
        day_label: formatDate(day.date, 'card'),
        week_number: weekNum,
        daily_tip_ar: day.daily_tip_ar || '',
        daily_tip_en: day.daily_tip_en || '',
        daily_tip: day.daily_tip_ar || ''
      };
    });
  }

  function buildWeekLabels(days, isAr) {
    const weekSet = [...new Set(days.map(d => d.week_number))];
    const totalWeeks = weekSet.length;
    return weekSet.map((w, i) => {
      const progress = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;
      let theme, themeEn;
      if (progress === 0) { theme = 'بناء الأساس'; themeEn = 'Foundation Building'; }
      else if (progress < 0.4) { theme = 'التعمق في المفاهيم'; themeEn = 'Core Concepts'; }
      else if (progress < 0.7) { theme = 'تعميق الفهم والربط'; themeEn = 'Deepening & Linking'; }
      else if (progress < 0.9) { theme = 'التكثيف والتعزيز'; themeEn = 'Intensification'; }
      else { theme = 'مراجعة وتثبيت'; themeEn = 'Review & Consolidation'; }
      return { week_number: w, theme, theme_en: themeEn };
    });
  }

  function buildFinalPlan(days, config, aiStatus, warnings) {
    const isAr = lang() === 'ar';
    const normalizedDays = normalizePlanDays(days);
    const totalSessions = normalizedDays.reduce((s, d) => s + (d.sessions?.length || 0), 0);
    const weeks = buildWeekLabels(normalizedDays, isAr);

    return {
      plan_type: config.plan_type,
      generated_at: getLocalTodayStr(),
      ai_model: aiStatus === 'hybrid' ? 'deepseek' : 'smart_local',
      ai_status: aiStatus,
      config: { ...config },
      plan_summary: {
        total_days: normalizedDays.length,
        total_sessions: totalSessions,
        strategy_description_ar: aiStatus === 'hybrid'
          ? 'جدول هجين — هيكل محلي مضمون + إثراء ذكاء اصطناعي'
          : 'جدول تكيّفي ذكي — توزيع عادل + مراجعة ذهبية + مراجعة متباعدة',
        strategy_description_en: aiStatus === 'hybrid'
          ? 'Hybrid plan — guaranteed local structure + AI enrichment'
          : 'Smart adaptive plan — fair distribution + golden review + spaced review',
        strategy_description: aiStatus === 'hybrid'
          ? 'جدول هجين — هيكل محلي مضمون + إثراء ذكاء اصطناعي'
          : 'جدول تكيّفي ذكي — توزيع عادل + مراجعة ذهبية + مراجعة متباعدة',
        weeks
      },
      days: normalizedDays,
      critical_warnings: warnings || []
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: Plan Generation Flows
  // ═══════════════════════════════════════════════════════════════

  // ── نقطة الدخول الرئيسية ──
  function onGeneratePlan() {
    return generatePlanFlow();
  }

  async function generatePlanFlow() {
    const startInput = document.getElementById('start-date-input');
    userConfig.start_date = (startInput && startInput.value) ? startInput.value : getLocalTodayStr();
    const isAr = lang() === 'ar';

    hideError(); hideInfo();
    showStep(4);
    const loadingScreen = document.getElementById('loading-screen');
    const planContent = document.getElementById('plan-content');
    loadingScreen.classList.add('active');
    planContent.style.display = 'none';

    const loader = showInteractiveLoadingScreen();

    try {
      // ── المرحلة 1: البناء المحلي (سريع — أقل من ثانية) ──
      loader.advance('local');
      const skeleton = buildLocalSkeleton(userConfig, curriculumMap);
      markGoldenReviewDays(skeleton, userConfig);
      distributeCoreSessions(skeleton, userConfig, curriculumMap);

      const preCheck = validateBeforeSend(skeleton, userConfig, curriculumMap);
      if (!preCheck.canSend) {
        cleanupLoadingIntervals();
        loadingScreen.classList.remove('active');
        planContent.style.display = '';
        showBlockingError(preCheck);
        return;
      }

      distributeGoldenReviews(skeleton, userConfig, curriculumMap);
      distributeSpacedReviews(skeleton, userConfig, curriculumMap);
      injectCurriculumData(skeleton, curriculumMap);

      // ── المرحلة 2: إثراء AI (بطيء — 30 ثانية إلى 3 دقائق) ──
      let aiData = null;
      try {
        loader.advance('ai');
        const { system, user } = buildAIPrompt(skeleton, userConfig, curriculumMap);
        const aiRaw = await callAIWorker(system, user);
        aiData = tryParseJSON(aiRaw);
      } catch (aiErr) {
        console.warn('AI enrichment failed, using local plan:', aiErr.message);
      }

      if (aiData) {
        mergeAIResponse(skeleton, aiData);
      }

      const postCheck = validateAfterReceive({ days: skeleton }, userConfig, curriculumMap);
      if (!postCheck.valid) {
        console.error('أخطاء في التحقق:', postCheck.critical);
      }

      // ── المرحلة 3: جاهز ──
      loader.advance('done');
      const finalPlan = buildFinalPlan(
        skeleton, userConfig,
        aiData ? 'hybrid' : 'smart_local',
        [...(postCheck.warnings || []), ...(skeleton._critical_warnings || [])]
      );

      // ── 12. حفظ وعرض ──
      localStorage.setItem(getPlanStorageKey(userConfig.plan_type), JSON.stringify(finalPlan));
      localStorage.setItem('planner_config', JSON.stringify(userConfig));

      await sleep(400);
      cleanupLoadingIntervals();
      loadingScreen.classList.remove('active');
      planContent.style.display = '';
      renderPlan(finalPlan);

    } catch (err) {
      console.error('generatePlanFlow:', err);
      cleanupLoadingIntervals();

      // ── Fallback: خطة محلية بدون AI ──
      try {
        const fallback = buildLocalPlanDirect();
        localStorage.setItem(getPlanStorageKey(userConfig.plan_type), JSON.stringify(fallback));
        localStorage.setItem('planner_config', JSON.stringify(userConfig));
        loadingScreen.classList.remove('active');
        planContent.style.display = '';
        renderPlan(fallback);
        showInfo(isAr
          ? '⚠️ فشل الاتصال بالذكاء — تم إنشاء جدول ذكي محلي بدلاً.'
          : '⚠️ AI failed — smart local plan generated instead.');
      } catch (fallbackErr) {
        loadingScreen.classList.remove('active');
        planContent.style.display = '';
        showError(isAr ? 'خطأ في التوليد — تحقق من الاتصال' : 'Generation error — check connection');
      }
    }
  }

  // ── توليد محلي مباشر (نفس المحرك بدون AI) ──
  function buildLocalPlanDirect() {
    const skeleton = buildLocalSkeleton(userConfig, curriculumMap);
    markGoldenReviewDays(skeleton, userConfig);
    distributeCoreSessions(skeleton, userConfig, curriculumMap);

    const preCheck = validateBeforeSend(skeleton, userConfig, curriculumMap);
    if (!preCheck.canSend) {
      console.warn('Validation issues:', preCheck.errors);
    }

    distributeGoldenReviews(skeleton, userConfig, curriculumMap);
    distributeSpacedReviews(skeleton, userConfig, curriculumMap);
    injectCurriculumData(skeleton, curriculumMap);

    return buildFinalPlan(skeleton, userConfig, 'smart_local', []);
  }

  function generateLocalPlan() {
    const startInput = document.getElementById('start-date-input');
    userConfig.start_date = (startInput && startInput.value) ? startInput.value : getLocalTodayStr();

    hideError(); hideInfo();
    showStep(4);
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('plan-content').style.display = '';

    const plan = buildLocalPlanDirect();
    localStorage.setItem(getPlanStorageKey(userConfig.plan_type), JSON.stringify(plan));
    localStorage.setItem('planner_config', JSON.stringify(userConfig));

    try { renderPlan(plan); } catch (e) {
      console.error('renderPlan error:', e);
      document.getElementById('plan-content').innerHTML =
        '<div style="padding:2rem;text-align:center;color:#f43f5e;"><h3>⚠️ خطأ في عرض الجدول</h3><p>' + e.message + '</p></div>';
    }

    showInfo(lang() === 'ar'
      ? '📋 تم إنشاء جدول ذكي محلياً — مرتب تسلسلياً مع توزيع عادل ومراجعات ذهبية.'
      : '📋 Smart local plan generated — sequential with fair distribution and golden reviews.');
  }

  // Backward-compatible aliases
  function generateSmartLocalPlan() { return buildLocalPlanDirect(); }
  function generateFallbackPlan() { return buildLocalPlanDirect(); }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: Loading Screen & Error Display
  // ═══════════════════════════════════════════════════════════════

  const LOADING_STAGES = [
    { id: 'local', icon: '🏗️', ar: 'بناء الجدول محلياً',   en: 'Building local schedule' },
    { id: 'ai',    icon: '🤖', ar: 'إثراء المحتوى بالذكاء', en: 'AI enriching content' },
    { id: 'done',  icon: '🎉', ar: 'الجدول جاهز!',          en: 'Plan ready!' }
  ];

  const TIME_MESSAGES = [
    { after: 0,   ar: 'جارٍ بناء الهيكل الأساسي...',                             en: 'Building base schedule...' },
    { after: 5,   ar: 'يتم إرسال البيانات للذكاء الاصطناعي...',                   en: 'Sending data to AI...' },
    { after: 20,  ar: 'الذكاء الاصطناعي يحلل المناهج ويكتب الملاحظات...',         en: 'AI is analyzing and writing notes...' },
    { after: 120, ar: 'تقريباً انتهى — يُراجع الجدول...',                         en: 'Almost done — reviewing...' },
    { after: 150, ar: 'بقي القليل — يُنهي الإثراء...',                            en: 'Almost there — finishing up...' },
    { after: 200, ar: 'لحظات فقط...',                                              en: 'Just a moment...' },
    { after: 300, ar: 'استجابة بطيئة — سيُكمَل محلياً إن تأخر...', en: 'Slow response — will complete locally if delayed...' }
  ];

  const TIPS = [
    { ar: 'التبديل بين المواد يُقوّي الذاكرة أكثر من دراسة مادة واحدة حتى الانتهاء', en: 'Switching between subjects strengthens memory retention' },
    { ar: 'يوم الراحة قبل الامتحان أهم من المذاكرة المكثفة',                          en: 'Rest day before exam is more important than cramming' },
    { ar: 'اربط المفاهيم المتشابهة بين المواد — فهم واحد يُعزز الآخر',                en: 'Link similar concepts across courses' },
    { ar: 'ابدأ بالأصعب وأنت نشيط، ثم انتقل للأسهل',                                  en: 'Start with hard topics while fresh' },
    { ar: 'استخدم تقنية البومودورو: 25 دقيقة مذاكرة + 5 دقائق راحة',                  en: 'Pomodoro: 25 min study + 5 min break' },
    { ar: 'المراجعة المتباعدة أفضل من الحشو المتواصل',                                 en: 'Spaced repetition beats continuous cramming' }
  ];

  function showInteractiveLoadingScreen() {
    const stepsEl = document.getElementById('loading-steps');
    const fillEl = document.getElementById('loading-fill');
    const L = () => lang() === 'ar';

    stepsEl.innerHTML = `
      <div class="loading-stages-box">
        ${LOADING_STAGES.map(s => `
          <div class="loading-stage" id="stage-${s.id}">
            <span class="loading-stage-icon">○</span>
            <span class="loading-stage-label" data-ar="${s.icon} ${s.ar}" data-en="${s.icon} ${s.en}">${s.icon} ${L() ? s.ar : s.en}</span>
          </div>
        `).join('')}
      </div>
      <div class="loading-status" id="loading-status"></div>
      <div class="loading-timer" id="loading-timer">00:00</div>
      <div class="loading-tip" id="loading-tip">💡 ${L() ? TIPS[0].ar : TIPS[0].en}</div>
      <div class="loading-warning-pill" id="loading-warning">
        ⚠️ <span data-ar="لا تحدّث الصفحة" data-en="Do not refresh">${L() ? 'لا تحدّث الصفحة' : 'Do not refresh'}</span>
      </div>
    `;

    const startTime = Date.now();
    let currentPhase = 'local';

    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      const timerEl = document.getElementById('loading-timer');
      if (timerEl) timerEl.textContent = mins + ':' + secs;

      const isAr = L();

      // Dynamic language update for all data-ar/data-en elements
      stepsEl.querySelectorAll('[data-ar]').forEach(el => {
        const txt = isAr ? el.dataset.ar : el.dataset.en;
        if (el.textContent !== txt) el.textContent = txt;
      });

      // Time-based status during AI phase
      if (currentPhase === 'ai') {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) {
          let best = TIME_MESSAGES[0];
          for (const tm of TIME_MESSAGES) { if (elapsed >= tm.after) best = tm; }
          const msg = isAr ? best.ar : best.en;
          if (statusEl.textContent !== msg) {
            statusEl.style.opacity = '0';
            setTimeout(() => { statusEl.textContent = msg; statusEl.style.opacity = '1'; }, 200);
          }
        }
      }

      // Smooth progress during AI phase (update every 5s)
      if (currentPhase === 'ai' && fillEl && elapsed % 5 === 0) {
        fillEl.style.width = Math.min(85, 40 + (elapsed / 180) * 45) + '%';
      }
    }, 1000);
    _loadingIntervals.push(timerInterval);

    // Rotating tips (bilingual)
    let tipIdx = 0;
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % TIPS.length;
      const tipEl = document.getElementById('loading-tip');
      if (tipEl) {
        tipEl.style.opacity = '0';
        setTimeout(() => {
          tipEl.textContent = '💡 ' + (L() ? TIPS[tipIdx].ar : TIPS[tipIdx].en);
          tipEl.style.opacity = '1';
        }, 300);
      }
    }, 8000);
    _loadingIntervals.push(tipInterval);

    function advance(stageId) {
      currentPhase = stageId;
      LOADING_STAGES.forEach(s => {
        const el = document.getElementById('stage-' + s.id);
        if (!el) return;
        const icon = el.querySelector('.loading-stage-icon');
        const idx = LOADING_STAGES.findIndex(x => x.id === s.id);
        const activeIdx = LOADING_STAGES.findIndex(x => x.id === stageId);
        if (idx < activeIdx) {
          el.classList.remove('loading-stage--active');
          el.classList.add('loading-stage--done');
          icon.textContent = '✅';
        } else if (idx === activeIdx) {
          el.classList.add('loading-stage--active');
          el.classList.remove('loading-stage--done');
          icon.textContent = '⏳';
        }
      });

      if (fillEl) {
        if (stageId === 'local') fillEl.style.width = '15%';
        else if (stageId === 'done') fillEl.style.width = '100%';
      }

      const statusEl = document.getElementById('loading-status');
      if (statusEl && stageId === 'local') {
        statusEl.textContent = L() ? 'يبني الهيكل الأساسي...' : 'Building base structure...';
        statusEl.style.opacity = '1';
      }
      if (statusEl && stageId === 'done') {
        statusEl.textContent = L() ? '✨ تم بنجاح!' : '✨ Complete!';
        statusEl.style.opacity = '1';
      }
    }

    return { advance };
  }

  function cleanupLoadingIntervals() {
    _loadingIntervals.forEach(id => clearInterval(id));
    _loadingIntervals = [];
  }

  function showBlockingError(preCheck) {
    const isAr = lang() === 'ar';
    const msg = preCheck.errors.map(e => isAr ? e.message_ar : e.message_en).join('\n\n');
    const container = document.getElementById('plan-content');
    container.style.display = '';
    container.innerHTML = `
      <div class="blocking-error">
        <div class="blocking-error-icon">🚫</div>
        <div class="blocking-error-title">${isAr ? 'لا يمكن إنشاء الجدول' : 'Cannot generate plan'}</div>
        <pre class="blocking-error-message">${msg}</pre>
        <button class="blocking-error-btn" onclick="Planner.regenerate()">
          ${isAr ? '← تعديل الإعدادات' : '← Edit settings'}
        </button>
      </div>
    `;
  }

  // Legacy loading support (for backward compatibility)
  function setupInteractiveLoading(isAr) {
    return showInteractiveLoadingScreen().advance;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: Rendering
  // ═══════════════════════════════════════════════════════════════

  function cleanupExpiredCourses(plan) {
    if (!plan?.days || !Array.isArray(plan.days)) return;
    const todayStr = getLocalTodayStr();
    const examDates = {};
    if (plan.config?.courses) {
      for (const [cid, cfg] of Object.entries(plan.config.courses)) {
        if (cfg.exam_date) examDates[cid] = cfg.exam_date;
      }
    }
    let changed = false;
    plan.days.forEach(day => {
      if (!day.sessions) { day.sessions = []; return; }
      if (day.date <= todayStr) return;
      const before = day.sessions.length;
      day.sessions = day.sessions.filter(s => {
        const examDate = examDates[s.course_id];
        return !examDate || day.date <= examDate;
      });
      if (day.sessions.length !== before) changed = true;
      day.sessions.forEach((s, idx) => s.session_number = idx + 1);
    });
    if (changed) {
      plan.days = plan.days.filter(d => (d.sessions && d.sessions.length > 0) || d.day_type === 'exam');
    }
  }

  function buildCourseProgressBars(plan, isAr) {
    if (!plan.config?.courses) return '';
    const todayStr = getLocalTodayStr();
    const todayD = new Date(todayStr + 'T00:00:00');
    const activeCourses = Object.entries(plan.config.courses).filter(([, c]) => c.active);
    if (activeCourses.length === 0) return '';

    let barsHTML = '';
    for (const [cid, cfg] of activeCourses) {
      const courseName = curriculumMap?.courses?.[cid]
        ? (isAr ? curriculumMap.courses[cid].name : curriculumMap.courses[cid].name_en) : cid;

      let totalSessions = 0, completedSessions = 0;
      (plan.days || []).forEach(day => {
        (day.sessions || []).forEach(s => {
          if (s.course_id === cid && s.mode !== 'exam') {
            totalSessions++;
            if (s.completed) completedSessions++;
          }
        });
      });

      const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
      let metaText = '', fillClass = '';
      if (cfg.exam_date) {
        const daysLeft = Math.ceil((new Date(cfg.exam_date + 'T00:00:00') - todayD) / 86400000);
        if (daysLeft < 0) { metaText = isAr ? '✅ انتهى' : '✅ Done'; fillClass = 'exam-passed'; }
        else if (daysLeft <= 3) { metaText = isAr ? `⚠️ ${daysLeft} أيام` : `⚠️ ${daysLeft}d left`; fillClass = 'near-exam'; }
        else { metaText = isAr ? `${daysLeft} يوم` : `${daysLeft}d left`; }
      }

      barsHTML += `
        <div class="course-progress-item">
          <span class="course-progress-name">${cid}</span>
          <div class="course-progress-bar"><div class="course-progress-fill ${fillClass}" style="width:${pct}%"></div></div>
          <span class="course-progress-meta">${pct}% ${metaText ? '· ' + metaText : ''}</span>
        </div>`;
    }
    return `<div class="course-progress-bars">${barsHTML}</div>`;
  }

  function renderPlan(plan) {
    const container = document.getElementById('plan-content');
    const isAr = lang() === 'ar';
    cleanupExpiredCourses(plan);

    const totalDays = plan.plan_summary?.total_days || plan.days?.length || 0;
    const totalSessions = plan.plan_summary?.total_sessions || 0;
    const strategy = isAr
      ? (plan.plan_summary?.strategy_description_ar || plan.plan_summary?.strategy_description || '')
      : (plan.plan_summary?.strategy_description_en || plan.plan_summary?.strategy_description || '');

    const planTypeLabel = { general: isAr ? 'عام' : 'General', midterm: isAr ? 'ميدتيرم' : 'Midterm', final: isAr ? 'فاينل' : 'Final' };

    allDayCards = [];
    (plan.days || []).forEach(day => {
      if (day.sessions && day.sessions.length > 0) allDayCards.push(day);
    });

    const aiStatus = plan.ai_status || 'fallback';
    let sourceLabel, sourceLabelClass;
    if (aiStatus === 'hybrid' || aiStatus === 'success' || aiStatus === 'multi_chunk') {
      sourceLabel = isAr ? '🤖 جدول هجين (محلي + AI)' : '🤖 Hybrid (Local + AI)';
      sourceLabelClass = 'ai';
    } else if (aiStatus === 'smart_local') {
      sourceLabel = isAr ? '📋 جدول ذكي محلي' : '📋 Smart Local Plan';
      sourceLabelClass = 'smart_local';
    } else {
      sourceLabel = isAr ? '📋 جدول محلي' : '📋 Local Plan';
      sourceLabelClass = 'local';
    }

    let html = `
      <div class="plan-header">
        <div class="plan-header-top">
          <div class="plan-header-left">
            <div class="plan-source-label ${sourceLabelClass}">${sourceLabel}</div>
            <h2>📅 ${isAr ? 'جدول مذاكرتك' : 'Your Study Plan'} — ${totalDays} ${isAr ? 'يوم' : 'days'}</h2>
            <div class="plan-header-meta">${planTypeLabel[plan.plan_type] || ''}</div>
          </div>
          <div class="plan-header-actions">
            <button class="plan-action-btn btn-pdf" onclick="Planner.exportPDF()">
              <i class="fas fa-file-pdf"></i> ${isAr ? 'تصدير PDF' : 'Export PDF'}
            </button>
            <button class="plan-action-btn btn-regenerate" onclick="Planner.regenerate()">
              <i class="fas fa-rotate"></i> ${isAr ? 'إعادة التوليد' : 'Regenerate'}
            </button>
            <button class="plan-action-btn btn-new-plan" onclick="Planner.newPlan()">
              <i class="fas fa-plus"></i> ${isAr ? 'جدول جديد' : 'New Plan'}
            </button>
          </div>
        </div>
        ${strategy ? `<div class="plan-strategy-bar"><div class="plan-strategy-icon">💡</div><p class="plan-header-strategy">${strategy}</p></div>` : ''}
      </div>
      ${buildCourseProgressBars(plan, isAr)}
      ${(plan.critical_warnings || []).length > 0 ? `
        <div class="plan-warnings">
          ${plan.critical_warnings.map(w => `<div class="plan-warning-item">${typeof w === 'string' ? w : w.message}</div>`).join('')}
        </div>` : ''}
      <div class="view-mode-toggle">
        <button class="view-mode-btn ${cardViewMode === 'cards' ? 'active' : ''}" onclick="Planner.setViewMode('cards')">
          <i class="fas fa-clone"></i> ${isAr ? 'بطاقات' : 'Cards'}
        </button>
        <button class="view-mode-btn ${cardViewMode === 'list' ? 'active' : ''}" onclick="Planner.setViewMode('list')">
          <i class="fas fa-list"></i> ${isAr ? 'عرض الكل' : 'Show All'}
        </button>
      </div>
    `;

    html += cardViewMode === 'cards' ? renderCardView(plan, isAr) : renderListView(plan, isAr);
    container.innerHTML = html;

    if (cardViewMode === 'list') {
      setTimeout(() => {
        const todayEl = container.querySelector('.day-section.today-section');
        if (todayEl) { todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else {
          const todayStr = getLocalTodayStr();
          for (const el of container.querySelectorAll('.day-section[data-date]')) {
            if (el.dataset.date >= todayStr) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); break; }
          }
        }
      }, 150);
    }

    if (!window._plannerLangListenerAttached) {
      document.addEventListener('languageChanged', () => {
        const p = getCurrentPlan();
        if (p) renderPlan(p);
      });
      window._plannerLangListenerAttached = true;
    }
  }

  function formatSessionsCount(count, isAr) {
    if (!isAr) return `${count} Sessions`;
    if (count === 1) return 'جلسة واحدة';
    if (count === 2) return 'جلستين';
    return `${count} جلسات`;
  }

  // Helper for session type badge
  function getSessionTypeBadge(session, isAr) {
    const st = session.session_type;
    if (st === 'golden_review') return `<span class="session-type-tag golden">${isAr ? '⭐ ذهبية' : '⭐ Golden'}</span>`;
    if (st === 'spaced_review') return `<span class="session-type-tag spaced">${isAr ? '🔄 مراجعة' : '🔄 Review'}</span>`;
    return '';
  }

  // Resolve module_id display based on current language
  function getModuleIdDisplay(session, isAr) {
    if (isAr && session.module_id_ar) return session.module_id_ar;
    if (!isAr && session.module_id_en) return session.module_id_en;
    return session.module_id;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 14: Card View & List View
  // ═══════════════════════════════════════════════════════════════

  function renderCardView(plan, isAr) {
    if (allDayCards.length === 0) return `<p style="text-align:center;color:var(--text-muted)">${isAr ? 'لا توجد جلسات' : 'No sessions'}</p>`;

    const todayStr = getLocalTodayStr();
    if (!_cardIndexInitialized) {
      const todayIdx = allDayCards.findIndex(d => d.date === todayStr);
      if (todayIdx >= 0) currentCardIndex = todayIdx;
      else {
        const futureIdx = allDayCards.findIndex(d => d.date > todayStr);
        currentCardIndex = futureIdx >= 0 ? futureIdx : Math.max(0, allDayCards.length - 1);
      }
      _cardIndexInitialized = true;
    }
    if (currentCardIndex >= allDayCards.length) currentCardIndex = Math.max(0, allDayCards.length - 1);

    const day = allDayCards[currentCardIndex];
    const isToday = day.date === todayStr;
    const sessions = day.sessions || [];

    let sessionCardsHTML = '';
    sessions.forEach((session, sIdx) => {
      const courseName = curriculumMap.courses[session.course_id]
        ? (isAr ? curriculumMap.courses[session.course_id].name : curriculumMap.courses[session.course_id].name_en)
        : session.course_id;
      const diff = session.difficulty_avg || 5;
      const diffLabel = diff >= 9 ? 'critical' : diff >= 7 ? 'hard' : diff >= 4 ? 'medium' : 'easy';
      const isGolden = session.session_type === 'golden_review';

      const mustKnowList = (!isAr && session.must_know_today_en?.length > 0) ? session.must_know_today_en : session.must_know_today;
      const mustMemList = (!isAr && session.must_memorize_today_en?.length > 0) ? session.must_memorize_today_en : session.must_memorize_today;
      const aiNoteStr = isAr ? (session.ai_note_ar || session.ai_note) : (session.ai_note_en || session.ai_note);

      const contentNoteStr = !isAr && mustKnowList?.length && mustKnowList[0]?.match(/[\u0600-\u06FF]/)
        ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;font-weight:600;">(Module details in Arabic)</div>` : '';

      const mustKnow = mustKnowList?.length
        ? `<div class="card-back-section"><span class="card-back-icon">🎯</span><div><strong>${isAr ? 'يجب معرفته' : 'Must know'}:</strong>${contentNoteStr}<br>${mustKnowList.join('<br>')}</div></div>` : '';
      const mustMem = mustMemList?.length
        ? `<div class="card-back-section"><span class="card-back-icon">📝</span><div><strong>${isAr ? 'يجب حفظه' : 'Must memorize'}:</strong>${contentNoteStr}<br>${mustMemList.join('<br>')}</div></div>` : '';
      const aiNote = aiNoteStr
        ? `<div class="card-back-section"><span class="card-back-icon">💡</span><div>${aiNoteStr}</div></div>` : '';
      const crossLink = session.cross_link_alert?.active
        ? `<div class="card-back-section"><span class="card-back-icon">🔗</span><div>${(!isAr && session.cross_link_alert.message_en) ? session.cross_link_alert.message_en : (session.cross_link_alert.message || '')}</div></div>` : '';

      const typeBadge = getSessionTypeBadge(session, isAr);

      // ── Golden review: motivational message instead of difficulty ──
      const goldenMsg = isGolden ? (isAr ? session.golden_message_ar : session.golden_message_en) : '';
      const diffArea = isGolden
        ? `<div class="golden-motivational">${goldenMsg || (isAr ? '⭐ أنت جاهز!' : '⭐ You are ready!')}</div>`
        : `<div class="card-difficulty">
                <span class="card-diff-bar"><span class="card-diff-fill ${diffLabel}" style="width:${diff * 10}%"></span></span>
                <span class="card-diff-label ${diffLabel}">${isAr
                  ? (diffLabel === 'critical' ? 'حرج' : diffLabel === 'hard' ? 'صعب' : diffLabel === 'medium' ? 'متوسط' : 'سهل')
                  : (diffLabel === 'critical' ? 'Critical' : diffLabel === 'hard' ? 'Hard' : diffLabel === 'medium' ? 'Medium' : 'Easy')
                }</span>
              </div>`;
      const topRightText = isGolden
        ? `<span class="card-diff-text golden-hint">${isAr ? '⭐ مراجعة شاملة' : '⭐ Full Review'}</span>`
        : `<span class="card-diff-text">${isAr ? 'الصعوبة: ' + diff + ' من 10' : 'Difficulty: ' + diff + ' of 10'}</span>`;
      const studyBtnLabel = isGolden ? (isAr ? '📖 راجع' : '📖 Review') : (isAr ? '📖 ادرس' : '📖 Study');

      sessionCardsHTML += `
        <div class="sc-scene ${use3D ? '' : 'mobile-3d-off'}" id="session-scene-${sIdx}">
          <div class="sc-card ${session.completed ? 'completed' : ''}" id="session-inner-${sIdx}" onclick="Planner.flipSession(${sIdx})">
            <div class="sc-face sc-front">
              <div class="card-session-top-row">
                <span class="card-session-badge ${isGolden ? 'golden' : diffLabel}">${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
                ${typeBadge}
                ${topRightText}
              </div>
              <div class="card-course-name">${session.course_id} — ${getModuleIdDisplay(session, isAr)}</div>
              <div class="card-course-subtitle">${courseName}</div>
              ${diffArea}
              ${session.study_url ? `<a href="${session.study_url}" class="study-link-btn" onclick="event.stopPropagation()">${studyBtnLabel}</a>` : ''}
              <button class="card-session-done-btn" onclick="event.stopPropagation(); Planner.toggleComplete('${day.date}',${session.session_number})">
                ${session.completed ? (isAr ? '↩ إلغاء' : '↩ Undo') : (isAr ? '✅ أتممت مذاكرة المودل' : '✅ Module Complete')}
              </button>
              ${(session.mode === 'flash' || day.day_type === 'golden_review') && !session.completed ? `
              <button class="card-snooze-btn" onclick="event.stopPropagation(); Planner.snoozeSession('${day.date}',${session.session_number})">
                😴 ${isAr ? 'تأجيل' : 'Snooze'}
                ${(session._snoozeCount || 0) > 0 ? `<span class="snooze-warning">(${session._snoozeCount}/2)</span>` : ''}
              </button>` : ''}
              <div class="sc-hint">${isAr ? '👆 اضغط للتفاصيل' : '👆 Tap for details'}</div>
            </div>
            <div class="sc-face sc-back">
              <div class="card-back-session-title">${session.course_id} — ${getModuleIdDisplay(session, isAr)}</div>
              <div class="card-back-subtitle">${courseName}</div>
              <div class="sc-back-body">${mustKnow}${mustMem}${aiNote}${crossLink}</div>
              <div class="sc-hint">${isAr ? '👆 اضغط للرجوع' : '👆 Tap to go back'}</div>
            </div>
          </div>
        </div>`;
    });

    const toggle3DBtn = `
      <button class="card-3d-toggle" onclick="Planner.toggle3D()">
        <i class="fas ${use3D ? 'fa-cube' : 'fa-square'}"></i>
        ${use3D ? (isAr ? '3D مفعّل' : '3D On') : (isAr ? '3D معطّل' : '3D Off')}
      </button>`;

    return `
      <div class="card-3d-container">
        <div class="card-top-bar">
          <div class="card-counter">${isAr ? `الجلسات المتبقية: ${formatSessionsCount(allDayCards.length - currentCardIndex, isAr)} من اصل ${formatSessionsCount(allDayCards.length, isAr)}` : `Remaining: ${allDayCards.length - currentCardIndex} of ${allDayCards.length}`}</div>
          ${toggle3DBtn}
        </div>
        <div class="card-day-header ${isToday ? 'today' : ''} ${day.day_type === 'exam' ? 'day-type-exam' : day.day_type === 'golden_review' ? 'day-type-golden' : ''}">
          <div class="card-day-label-group">
            <span class="card-day-text">${formatDate(day.date, 'card')}</span>
            ${day.day_type === 'exam' ? `<span class="day-type-badge exam-badge">${isAr ? '📝 يوم اختبار' : '📝 Exam Day'}</span>` : ''}
            ${day.day_type === 'golden_review' ? `<span class="day-type-badge golden-badge">${isAr ? '⭐ مراجعة ذهبية' : '⭐ Golden Review'}</span>` : ''}
          </div>
          ${isToday ? `<span class="card-today-badge">${isAr ? '⏳ اليوم' : '⏳ Today'}</span>` : ''}
        </div>
        <div class="session-cards-list">${sessionCardsHTML}</div>
        ${(isAr ? (day.daily_tip_ar || day.daily_tip) : (day.daily_tip_en || day.daily_tip)) ? `<div class="card-tip">💡 ${(isAr ? (day.daily_tip_ar || day.daily_tip) : (day.daily_tip_en || day.daily_tip))}</div>` : ''}
        <div class="card-nav">
          <button class="card-nav-btn" onclick="Planner.prevCard()" ${currentCardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-right"></i> ${isAr ? 'السابق' : 'Prev'}
          </button>
          <button class="card-nav-btn" onclick="Planner.nextCard()" ${currentCardIndex >= allDayCards.length - 1 ? 'disabled' : ''}>
            ${isAr ? 'التالي' : 'Next'} <i class="fas fa-arrow-left"></i>
          </button>
        </div>
      </div>`;
  }

  function renderListView(plan, isAr) {
    let html = '';
    const todayStr = getLocalTodayStr();
    const weeks = {};
    (plan.days || []).forEach(day => {
      const w = day.week_number || 1;
      if (!weeks[w]) weeks[w] = [];
      weeks[w].push(day);
    });

    for (const [weekNum, days] of Object.entries(weeks)) {
      const weekInfo = plan.plan_summary?.weeks?.find(w => w.week_number === parseInt(weekNum));
      const weekTheme = weekInfo ? (isAr ? weekInfo.theme : (weekInfo.theme_en || weekInfo.theme)) : '';

      html += `<div class="week-section">
        <div class="week-label">📌 ${isAr ? 'الأسبوع' : 'Week'} ${weekNum} ${weekTheme ? '— ' + weekTheme : ''}</div>`;

      for (const day of days) {
        const isToday = day.date === todayStr;
        const isPast = new Date(day.date) < new Date(todayStr);
        const totalCount = (day.sessions || []).length;
        const doneCount = (day.sessions || []).filter(s => s.completed).length;
        const allDone = totalCount > 0 && day.sessions.every(s => s.completed);
        const isRestDay = totalCount === 0;
        let statusClass = 'upcoming', statusText = '';

        if (isRestDay) {
          statusClass = 'rest';
          statusText = isAr ? '😴 راحة' : '😴 Rest';
        } else if (isToday) {
          statusClass = 'today';
          statusText = isAr ? '⏳ اليوم' : '⏳ Today';
        } else if (allDone) {
          statusClass = 'completed';
          statusText = isAr ? '✅ منتهي' : '✅ Done';
        } else if (isPast) {
          statusClass = 'past';
        }

        const dayType = day.day_type || 'study';
        let dayTypeBadge = '';
        if (dayType === 'exam') dayTypeBadge = `<span class="day-type-badge exam-badge">${isAr ? '📝 يوم اختبار' : '📝 Exam Day'}</span>`;
        else if (dayType === 'golden_review') dayTypeBadge = `<span class="day-type-badge golden-badge">${isAr ? '⭐ مراجعة ذهبية' : '⭐ Golden Review'}</span>`;

        // Session count: only show for days with sessions
        const progressText = !isRestDay
          ? `<span class="day-progress-count">${doneCount}/${totalCount} ${formatSessionsCount(totalCount, isAr)}</span>`
          : '';

        html += `
          <div class="day-section ${isToday ? 'today-section' : ''} ${isPast && !isToday ? 'past-section' : ''} ${isRestDay ? 'rest-section' : ''}" data-day-type="${dayType}" data-date="${day.date}">
            <div class="day-header">
              <div class="day-label-group">
                <div class="day-label">${formatDate(day.date, 'card')}</div>
                ${dayTypeBadge}
              </div>
              <div class="day-header-right">
                ${progressText}
                ${statusText ? `<div class="day-status ${statusClass}">${statusText}</div>` : ''}
              </div>
            </div>`;

        for (const session of (day.sessions || [])) {
          const courseName = curriculumMap.courses[session.course_id]
            ? (isAr ? curriculumMap.courses[session.course_id].name : curriculumMap.courses[session.course_id].name_en)
            : session.course_id;
          const diff = session.difficulty_avg || 5;
          const diffLabel = diff >= 9 ? 'critical' : diff >= 7 ? 'hard' : diff >= 4 ? 'medium' : 'easy';
          const isGolden = session.session_type === 'golden_review';

          const mustKnowList = (!isAr && session.must_know_today_en?.length > 0) ? session.must_know_today_en : session.must_know_today;
          const mustMemList = (!isAr && session.must_memorize_today_en?.length > 0) ? session.must_memorize_today_en : session.must_memorize_today;
          const aiNoteStr = isAr ? (session.ai_note_ar || session.ai_note) : (session.ai_note_en || session.ai_note);
          const showSnooze = (session.mode === 'flash' || dayType === 'golden_review') && !session.completed;
          const typeBadge = getSessionTypeBadge(session, isAr);

          const diffOrGolden = isGolden
            ? `<span class="session-difficulty golden-hint">${isAr ? '⭐ مراجعة شاملة' : '⭐ Full Review'}</span>`
            : `<span class="session-difficulty">${isAr ? 'الصعوبة: ' + diff + ' من 10' : 'Difficulty: ' + diff + ' of 10'}</span>`;
          const goldenMotivation = isGolden
            ? `<div class="golden-motivational-sm">${isAr ? (session.golden_message_ar || '') : (session.golden_message_en || '')}</div>`
            : '';
          const studyBtnLabel = isGolden ? (isAr ? '📖 راجع' : '📖 Review') : (isAr ? '📖 ادرس' : '📖 Study');

          html += `
            <div class="session-card ${session.completed ? 'completed' : ''} ${isGolden ? 'session-card--golden' : ''}" data-date="${day.date}" data-session="${session.session_number}">
              <div class="session-card-top">
                <span class="session-badge ${isGolden ? 'golden' : diffLabel}">${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
                ${typeBadge}
                ${diffOrGolden}
              </div>
              <div class="session-course">${session.course_id} — ${getModuleIdDisplay(session, isAr)} (${courseName})</div>
              ${goldenMotivation}
              <div class="session-details">
                ${mustKnowList?.length ? `<span>🎯 ${mustKnowList.join(isAr ? '، ' : ', ')}</span>` : ''}
                ${mustMemList?.length ? `<span>📝 ${mustMemList.join(isAr ? '، ' : ', ')}</span>` : ''}
                ${aiNoteStr ? `<span>💡 ${aiNoteStr}</span>` : ''}
              </div>
              ${session.cross_link_alert?.active ? `<div class="session-link-alert">🔗 ${(!isAr && session.cross_link_alert.message_en) ? session.cross_link_alert.message_en : (session.cross_link_alert.message || '')}</div>` : ''}
              <div class="session-actions">
                ${session.study_url ? `<a href="${session.study_url}" class="session-action-btn study-link-btn" onclick="event.stopPropagation()">${studyBtnLabel}</a>` : ''}
                <button class="session-action-btn session-complete-btn" onclick="Planner.toggleComplete('${day.date}',${session.session_number})">
                  ${session.completed ? (isAr ? '↩ إلغاء' : '↩ Undo') : (isAr ? '✅ أنهيت' : '✅ Done')}
                </button>
                ${showSnooze ? `<button class="session-action-btn session-snooze-btn" onclick="Planner.snoozeSession('${day.date}',${session.session_number})">
                  😴 ${isAr ? 'تأجيل' : 'Snooze'} ${(session._snoozeCount || 0) > 0 ? `(${session._snoozeCount}/2)` : ''}
                </button>` : ''}
              </div>
            </div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }
    return html;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 15: Card Interactions & Navigation
  // ═══════════════════════════════════════════════════════════════

  function flipSession(sessionIdx) {
    const card = document.getElementById('session-inner-' + sessionIdx);
    if (card) card.classList.toggle('flipped');
  }

  function flipCard() {
    document.querySelectorAll('.sc-card').forEach(s => s.classList.toggle('flipped'));
  }

  function toggle3D() {
    use3D = !use3D;
    document.querySelectorAll('.sc-card').forEach(s => s.classList.remove('flipped'));
    const plan = getCurrentPlan();
    if (plan) renderPlan(plan);
  }

  function nextCard() {
    if (currentCardIndex < allDayCards.length - 1) { currentCardIndex++; const plan = getCurrentPlan(); if (plan) renderPlan(plan); }
  }

  function prevCard() {
    if (currentCardIndex > 0) { currentCardIndex--; const plan = getCurrentPlan(); if (plan) renderPlan(plan); }
  }

  function setViewMode(mode) {
    cardViewMode = mode;
    const plan = getCurrentPlan();
    if (plan) renderPlan(plan);
  }

  function getCurrentPlan() {
    const key = getActivePlanKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function newPlan() {
    const isAr = lang() === 'ar';
    const confirmed = confirm(isAr
      ? 'هل تريد إنشاء جدول جديد؟ سيتم حذف الجدول الحالي.'
      : 'Create a new plan? The current plan will be removed.');
    if (!confirmed) return;
    const key = getActivePlanKey();
    localStorage.removeItem(key);
    localStorage.removeItem('planner_config');
    const cp = document.getElementById('continue-prompt');
    if (cp) cp.style.display = 'none';
    userConfig = {
      plan_type: null, daily_sessions: 2, modules_per_session: 1,
      start_date: null, rest_days: ['friday', 'saturday'],
      busy_dates: [], courses: {}
    };
    currentStep = 1; cardViewMode = 'cards'; currentCardIndex = 0;
    _cardIndexInitialized = false;
    hideError(); hideInfo();
    showStep(1);
  }

  function continuePlan() {
    const plan = getCurrentPlan();
    if (!plan) return;
    showStep(4);
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('plan-content').style.display = '';
    renderPlan(plan);
  }

  function regenerate() {
    const savedConfigRaw = localStorage.getItem('planner_config');
    if (savedConfigRaw) {
      try {
        const savedConfig = JSON.parse(savedConfigRaw);
        userConfig = { ...userConfig, ...savedConfig };
        hideError(); hideInfo();
        showStep(3);
        return;
      } catch (e) { /* corrupted */ }
    }
    showStep(1);
  }

  // ─── Error / Info Handling ─────────────────────────────
  function showError(msg) {
    const el = document.getElementById('error-box');
    el.textContent = msg;
    el.className = 'error-box visible';
  }

  function hideError() {
    document.getElementById('error-box').classList.remove('visible');
  }

  function showInfo(msg) {
    const el = document.getElementById('error-box');
    el.textContent = msg;
    el.className = 'error-box info-box visible';
  }

  function hideInfo() {
    const el = document.getElementById('error-box');
    el.classList.remove('info-box', 'visible');
  }

  // ─── Toggle Complete ──────────────────────────────────
  function toggleComplete(dateStr, sessionNum) {
    const plan = getCurrentPlan();
    if (!plan || !plan.days) return;

    const day = plan.days.find(d => d.date === dateStr);
    if (!day || !day.sessions) return;

    const session = day.sessions.find(s => s.session_number === sessionNum);
    if (!session) return;

    const isNowCompleted = !session.completed;
    session.completed = isNowCompleted;

    const key = getPlanStorageKey(plan.plan_type);
    localStorage.setItem(key, JSON.stringify(plan));

    if (!isNowCompleted) { renderPlan(plan); return; }

    let animatedEl = null;
    if (cardViewMode === 'cards') {
      const sIdx = (day.sessions || []).findIndex(s => s.session_number === sessionNum);
      animatedEl = document.getElementById('session-inner-' + sIdx);
    } else {
      animatedEl = document.querySelector(`.session-card[data-date="${dateStr}"][data-session="${sessionNum}"]`);
    }

    if (animatedEl) {
      animatedEl.classList.add('completed-animate');
      setTimeout(() => {
        const updatedPlan = JSON.parse(localStorage.getItem(key) || '{}');
        renderPlan(updatedPlan);
      }, 600);
    } else {
      renderPlan(plan);
    }
  }

  // ─── Mark Day Missed ──────────────────────────────────
  function markDayMissedAndRegenerate(date) {
    const isAr = lang() === 'ar';
    const plan = getCurrentPlan();
    if (!plan) return;

    const confirmed = confirm(isAr
      ? 'لم تدرس اليوم؟ سيُحدَّث تقييم المودلات المكتملة وتُعاد جدولة الباقي.'
      : "Missed today? Completed modules will be updated and remaining days rescheduled.");
    if (!confirmed) return;

    const completed = new Set();
    for (const d of plan.days)
      for (const s of (d.sessions || []))
        if (s.completed) completed.add(`${s.course_id}_${s.module_id}`);

    const saved = JSON.parse(localStorage.getItem('planner_config') || '{}');
    for (const [cid, cfg] of Object.entries(saved.courses || {}))
      for (const m of (cfg.included_modules || []))
        if (completed.has(`${cid}_${m}`))
          saved.courses[cid].self_rating[m] = 'excellent';

    saved.start_date = addDaysToDate(date, 1);
    localStorage.setItem('planner_config', JSON.stringify(saved));
    userConfig = { ...userConfig, ...saved };

    showInfo(isAr
      ? '✅ تم التحديث — أعِد ضبط الإعدادات وأنشئ جدولاً جديداً'
      : '✅ Updated — adjust settings and create a new plan');
    setTimeout(() => showStep(2), 700);
  }

  // ─── Snooze System ────────────────────────────────────
  function findNextAvailableDay(plan, afterDate, beforeExamDate) {
    const sessionsPerDay = plan.config?.daily_sessions || 2;
    const afterD = new Date(afterDate + 'T00:00:00');
    const beforeD = beforeExamDate ? new Date(beforeExamDate + 'T00:00:00') : null;

    for (const day of plan.days) {
      const dayD = new Date(day.date + 'T00:00:00');
      if (dayD <= afterD) continue;
      if (beforeD && dayD >= beforeD) continue;
      if (day.day_type === 'exam') continue;
      if (day.day_type === 'golden_review') continue;
      const currentCount = (day.sessions || []).length;
      if (currentCount < sessionsPerDay) return day;
    }
    return null;
  }

  function snoozeSession(date, sessionNum) {
    const plan = getCurrentPlan();
    if (!plan || !plan.days) return;
    const isAr = lang() === 'ar';

    const day = plan.days.find(d => d.date === date);
    if (!day || !day.sessions) return;
    const session = day.sessions.find(s => s.session_number === sessionNum);
    if (!session) return;

    session._snoozeCount = (session._snoozeCount || 0) + 1;
    if (session._snoozeCount > 2) {
      alert(isAr ? '⚠️ لا يمكن تأجيل هذه الجلسة أكثر!' : '⚠️ Cannot snooze again — max 2!');
      session._snoozeCount = 2;
      return;
    }

    const examDate = plan.config?.courses?.[session.course_id]?.exam_date || null;
    const targetDay = findNextAvailableDay(plan, date, examDate);
    if (!targetDay) {
      alert(isAr ? '⚠️ لا يوجد يوم متاح!' : '⚠️ No available day!');
      session._snoozeCount--;
      return;
    }

    day.sessions = day.sessions.filter(s => s.session_number !== sessionNum);
    day.sessions.forEach((s, idx) => s.session_number = idx + 1);
    if (!targetDay.sessions) targetDay.sessions = [];
    targetDay.sessions.push({ ...session, session_number: targetDay.sessions.length + 1 });

    plan.days = plan.days.filter(d => (d.sessions && d.sessions.length > 0) || d.day_type === 'exam');
    localStorage.setItem(getPlanStorageKey(plan.plan_type), JSON.stringify(plan));
    renderPlan(plan);
    showInfo(isAr ? `😴 تم تأجيل الجلسة إلى ${formatDate(targetDay.date, 'card')}` : `😴 Snoozed to ${formatDate(targetDay.date, 'card')}`);
  }

  // ─── Today Banner Helper ──────────────────────────────
  function getTodayBannerData() {
    const keys = ['study_plan_midterm', 'study_plan_final', 'study_plan_general'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const plan = JSON.parse(raw);
        const todayStr = getLocalTodayStr();
        const todayDay = plan.days?.find(d => d.date === todayStr);
        if (!todayDay) continue;
        const sessions = todayDay.sessions || [];
        const total = sessions.length;
        const done = sessions.filter(s => s.completed).length;
        const allDays = plan.days || [];
        const totalSessions = allDays.reduce((sum, d) => sum + (d.sessions?.length || 0), 0);
        const doneSessions = allDays.reduce((sum, d) => sum + (d.sessions?.filter(s => s.completed).length || 0), 0);
        return {
          hasPlan: true, todaySessions: total,
          todaySessionsFormatted: formatSessionsCount(total, lang() === 'ar'),
          todayDone: done, totalSessions, doneSessions,
          progressPct: totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0,
          planType: plan.plan_type, planUrl: './planner/index.html'
        };
      } catch (e) { continue; }
    }
    return { hasPlan: false };
  }
  // ─── PDF Export (Professional Table via iframe) ───────────
  function exportPDF() {
    const plan = getCurrentPlan();
    if (!plan) return;
    const isAr = lang() === 'ar';
    const printHTML = buildPrintTable(plan, isAr);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(printHTML);
    doc.close();
    // Wait for fonts/styles to load
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 3000);
    }, 600);
  }

  // ─── PDF Export (Professional Output Redesign) ─────────────
  function buildPrintTable(plan, isAr) {
    const dir = isAr ? 'rtl' : 'ltr';
    const langAttr = isAr ? 'ar' : 'en';
    const planTypeLabel = { general: isAr ? 'عام' : 'General', midterm: isAr ? 'ميدتيرم' : 'Midterm', final: isAr ? 'فاينل' : 'Final' };
    const totalDays = plan.plan_summary?.total_days || plan.days?.length || 0;
    const aiStatus = plan.ai_status || (plan.ai_model === 'deepseek' ? 'success' : 'fallback');

    let sourceText;
    if (aiStatus === 'success') {
      sourceText = isAr ? 'الذكاء الاصطناعي (DeepSeek)' : 'AI Generated (DeepSeek)';
    } else if (aiStatus === 'smart_local') {
      sourceText = isAr ? 'جدول ذكي محلي' : 'Smart Local Plan';
    } else {
      sourceText = isAr ? 'جدول أساسي' : 'Basic Plan';
    }

    const strategy = isAr
      ? (plan.plan_summary?.strategy_description_ar || plan.plan_summary?.strategy_description || '')
      : (plan.plan_summary?.strategy_description_en || plan.plan_summary?.strategy_description || '');

    let htmlBody = `
      <div class="print-container">
        <!-- Document Header -->
        <div class="doc-header">
          <div class="header-left">
            <h1 class="doc-title">${isAr ? 'خطة المذاكرة الذكية' : 'Smart Study Plan'}</h1>
            <p class="doc-subtitle">${planTypeLabel[plan.plan_type] || ''} • ${totalDays} ${isAr ? 'يوم' : 'Days'} • ${sourceText}</p>
          </div>
          <div class="header-right doc-branding">
            Digital Garden
          </div>
        </div>
        ${strategy ? `<div class="doc-strategy"><span class="strategy-icon">💡</span> ${strategy}</div>` : ''}
        
        <div class="plan-grid">
    `;

    let currentWeek = 0;

    (plan.days || []).forEach((day, dayIdx) => {
      // Week divider
      if (day.week_number && day.week_number !== currentWeek) {
        currentWeek = day.week_number;
        const weekInfo = plan.plan_summary?.weeks?.find(w => w.week_number === currentWeek);
        const weekTheme = weekInfo ? (isAr ? weekInfo.theme : (weekInfo.theme_en || weekInfo.theme)) : '';
        htmlBody += `
          <div class="week-divider">
            <div class="week-pill-container">
               <span class="week-pill">${isAr ? 'الأسبوع' : 'Week'} ${currentWeek}</span>
            </div>
            ${weekTheme ? `<div class="week-theme">${weekTheme}</div>` : ''}
            <div class="week-line"></div>
          </div>
        `;
      }

      const sessions = day.sessions || [];
      const dayDateParsed = formatDate(day.date, 'card');

      const dayType = day.day_type || 'study';
      let dayThemeClass = 'theme-study';
      let dayIcon = '📅';
      let typeLabel = '';

      if (dayType === 'exam') {
        dayThemeClass = 'theme-exam';
        dayIcon = '📝';
        typeLabel = isAr ? 'يوم اختبار' : 'Exam Day';
      } else if (dayType === 'golden_review') {
        dayThemeClass = 'theme-golden';
        dayIcon = '⭐';
        typeLabel = isAr ? 'مراجعة ذهبية' : 'Golden Review';
      } else if (dayType === 'mixed') {
        dayThemeClass = 'theme-review';
        dayIcon = '🔄';
        typeLabel = isAr ? 'تعلم + مراجعة' : 'Study + Review';
      } else if (dayType === 'light_review') {
        dayThemeClass = 'theme-review';
        dayIcon = '🏁';
        typeLabel = isAr ? 'مراجعة خفيفة' : 'Light Review';
      } else if (dayType === 'rest') {
        dayThemeClass = 'theme-rest';
        dayIcon = '😴';
        typeLabel = isAr ? 'يوم راحة' : 'Rest Day';
      }

      htmlBody += `
        <!-- Wrap the day content so it avoids hard page breaks inside if possible -->
        <div class="day-wrapper ${dayThemeClass}">
          <div class="day-header">
            <div class="day-header-main">
              <span class="day-icon">${dayIcon}</span>
              <span class="day-date">${dayDateParsed}</span>
            </div>
            <div class="day-header-meta">
              ${typeLabel ? `<span class="day-type-tag">${typeLabel}</span>` : ''}
              <span class="day-count-tag">${formatSessionsCount(sessions.length, isAr)}</span>
            </div>
          </div>
          <div class="sessions-list">
      `;

      if (sessions.length === 0) {
        htmlBody += `
          <div class="empty-day-message">
            ${isAr ? 'لا توجد جلسات لهذا اليوم. استمتع بوقتك!' : 'No sessions for today. Enjoy your time!'}
          </div>
        `;
      }

      sessions.forEach((session, idx) => {
        const courseName = curriculumMap.courses[session.course_id]
          ? (isAr ? curriculumMap.courses[session.course_id].name : curriculumMap.courses[session.course_id].name_en)
          : session.course_id;

        const diff = session.difficulty_avg || 5;
        const diffClass = diff >= 9 ? 'critical' : diff >= 7 ? 'hard' : diff >= 4 ? 'medium' : 'easy';

        let diffLabel = diff + '/10';
        if (isAr) {
          diffLabel = diff >= 9 ? 'حرج' : diff >= 7 ? 'صعب' : diff >= 4 ? 'متوسط' : 'سهل';
        } else {
          diffLabel = diff >= 9 ? 'Critical' : diff >= 7 ? 'Hard' : diff >= 4 ? 'Medium' : 'Easy';
        }

        const mustKnowList = (!isAr && session.must_know_today_en && session.must_know_today_en.length > 0) ? session.must_know_today_en : session.must_know_today;
        const mustMemList = (!isAr && session.must_memorize_today_en && session.must_memorize_today_en.length > 0) ? session.must_memorize_today_en : session.must_memorize_today;
        const aiNoteStr = isAr ? (session.ai_note_ar || session.ai_note) : (session.ai_note_en || session.ai_note);

        const mustKnow = mustKnowList?.join(isAr ? '، ' : ', ') || '';
        const mustMem = mustMemList?.join(isAr ? '، ' : ', ') || '';

        htmlBody += `
            <div class="session-item">
              <div class="session-check-circle"></div>
              <div class="session-content">
                <div class="session-top">
                  <div class="session-course-title">
                    <span class="c-id">${session.course_id}</span>
                    <span class="m-id">${getModuleIdDisplay(session, isAr)}</span>
                    <span class="c-name">${courseName}</span>
                  </div>
                  <div class="session-tags">
                     <span class="s-num">${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
                     <span class="diff-badge ${diffClass}">${diffLabel}</span>
                  </div>
                </div>
                <div class="session-body">
                  ${mustKnow ? `<div class="detail-line"><span class="d-icon">🎯</span> <span class="d-text">${mustKnow}</span></div>` : ''}
                  ${mustMem ? `<div class="detail-line"><span class="d-icon">📝</span> <span class="d-text">${mustMem}</span></div>` : ''}
                  ${aiNoteStr ? `<div class="detail-line"><span class="d-icon">💡</span> <span class="d-text">${aiNoteStr}</span></div>` : ''}
                </div>
              </div>
            </div>
        `;
      });

      htmlBody += `
          </div>
        </div>
      `;
    });

    htmlBody += `
        </div> <!-- end plan-grid -->
      </div>
    `;

    return `<!DOCTYPE html>
<html lang="${langAttr}" dir="${dir}">
<head>
<meta charset="UTF-8">
<title>${isAr ? 'جدول المذاكرة' : 'Study Plan'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');

  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Kufi Arabic', 'Inter', sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1e293b;
    background: #ffffff;
    direction: ${dir};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-container {
    max-width: 100%;
    margin: 0 auto;
  }

  /* Header */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 16px;
  }
  .doc-title {
    font-size: 24pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
    line-height: 1.1;
  }
  .doc-subtitle {
    font-size: 11pt;
    font-weight: 600;
    color: #64748b;
  }
  .doc-branding {
    font-size: 16pt;
    font-weight: 900;
    color: #8b5cf6;
    letter-spacing: -0.5px;
    opacity: 0.9;
  }

  .doc-strategy {
    background: rgba(139, 92, 246, 0.06);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 10pt;
    font-weight: 600;
    color: #4c1d95;
    margin-bottom: 24px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border: 1px solid rgba(139, 92, 246, 0.15);
  }
  .strategy-icon {
    font-size: 12pt;
    margin-top: 2px;
  }

  /* Grid Layout (One column but blocks handle page breaks) */
  .plan-grid {
    display: block;
  }
  .plan-grid > * {
    margin-bottom: 20px;
  }
  .week-divider {
    margin-top: 24px !important;
    margin-bottom: 12px !important;
  }

  /* Week Divider */
  .week-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0 10px 0;
    position: relative;
    page-break-after: avoid;
    break-after: avoid;
  }
  .week-pill-container {
    background: #ffffff;
    padding: 0 16px;
    z-index: 2;
  }
  .week-pill {
    background: #1e293b;
    color: #ffffff;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 10pt;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .week-theme {
    background: #ffffff;
    color: #475569;
    font-size: 10.5pt;
    font-weight: 700;
    padding: 4px 16px;
    margin-top: 8px;
    z-index: 2;
  }
  .week-line {
    position: absolute;
    top: 14px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e2e8f0;
    z-index: 1;
  }

  /* Day Wrapper - Heart of the elegant layout */
  .day-wrapper {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    overflow: hidden;
    page-break-inside: avoid; /* Core requirement: Keeps day complete */
    break-inside: avoid;
  }

  /* Day Themes - Very subtle pastel backgrounds for headers */
  .theme-study  .day-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .theme-exam   .day-header { background: #fff1f2; border-bottom: 1px solid #fecdd3; }
  .theme-golden .day-header { background: #fffbeb; border-bottom: 1px solid #fde68a; }
  .theme-review .day-header { background: #f0fdf4; border-bottom: 1px solid #bbf7d0; }
  .theme-rest   .day-header { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }

  /* Very subtle full-body tint for special days (optional, disabled for cleaner print) */
  /* .theme-exam   { background: #fffcfd; } */

  .day-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .day-header-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .day-icon {
    font-size: 14pt;
  }
  .day-date {
    font-size: 12pt;
    font-weight: 800;
    color: #0f172a;
  }

  .day-header-meta {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .day-type-tag {
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0,0,0,0.05);
    color: #334155;
  }
  .theme-exam .day-type-tag { background: #ffe4e6; color: #be123c; }
  .theme-golden .day-type-tag { background: #fef3c7; color: #b45309; }
  
  .day-count-tag {
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    background: #e2e8f0;
    color: #475569;
  }

  /* Sessions List inside Day */
  .sessions-list {
    display: flex;
    flex-direction: column;
  }

  .empty-day-message {
    padding: 20px;
    text-align: center;
    color: #94a3b8;
    font-weight: 600;
    font-size: 10pt;
    font-style: italic;
  }

  /* Session Item Flex Layout */
  .session-item {
    display: flex;
    padding: 12px 16px;
    border-bottom: 1px dashed #e2e8f0;
    position: relative;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .session-item:last-child {
    border-bottom: none;
  }

  /* Check Circle for Physical Printing */
  .session-check-circle {
    width: 22px;
    height: 22px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    margin-top: 4px;
    margin-${isAr ? 'left' : 'right'}: 14px;
    flex-shrink: 0;
    background: #fff;
  }

  .session-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* Session Top Row */
  .session-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .session-course-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    line-height: 1.3;
  }
  
  .c-id {
    font-family: 'Inter', monospace;
    font-weight: 900;
    font-size: 10.5pt;
    color: #4338ca;
  }
  .m-id {
    font-family: 'Inter', monospace;
    font-weight: 700;
    font-size: 10pt;
    color: #334155;
    background: #f1f5f9;
    padding: 0 6px;
    border-radius: 4px;
  }
  .c-name {
    font-weight: 700;
    font-size: 9.5pt;
    color: #64748b;
  }

  .session-tags {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  
  .s-num {
    font-size: 8.5pt;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
  }

  /* Beautiful Difficulty Badges */
  .diff-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 8.5pt;
    font-weight: 800;
  }
  /* Adjusted for optimal paper print clarity */
  .diff-badge.easy { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .diff-badge.medium { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .diff-badge.hard { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
  .diff-badge.critical { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }

  /* Session Details Loop */
  .session-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 2px;
    padding-${isAr ? 'right' : 'left'}: 4px; /* Slight indent under title */
    border-${isAr ? 'right' : 'left'}: 2px solid #f1f5f9;
  }
  
  .detail-line {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .d-icon {
    font-size: 9pt;
    opacity: 0.9;
    margin-top: 1px;
  }
  .d-text {
    font-size: 9pt;
    color: #334155;
    font-weight: 500;
    line-height: 1.5;
  }

</style>
</head>
<body>
<div id="print-container">
  ${htmlBody}
  <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #f1f5f9; color: #94a3b8; font-size: 9pt; font-weight: 600;">
    Digital Garden · Intelligent Study Planner · ${new Date().toLocaleDateString(langAttr)}
  </div>
</div>
</body>
</html>`;
  }



  // ═══════════════════════════════════════════════════════════════
  // SECTION 17: Public API & Boot
  // ═══════════════════════════════════════════════════════════════
  window.Planner = {
    selectPlanType, nextStep, prevStep, toggleCourse, setExamDate,
    toggleModule, setRating, setConfig, toggleRestDay, addBusyDate,
    removeBusyDate, onGeneratePlan, generateLocalPlan, toggleComplete,
    continuePlan, newPlan, regenerate, flipCard, flipSession, nextCard, prevCard,
    setViewMode, exportPDF, buildPrintTable, toggle3D, getTodayBannerData,
    snoozeSession, markDayMissedAndRegenerate, formatDateDisplay
  };

  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('garden:languageChanged', () => {
    if (currentStep === 2) buildCourseList();
    if (currentStep === 3) updateFeasibility();
    if (currentStep === 4) {
      const plan = getCurrentPlan();
      if (plan) renderPlan(plan);
    }
  });

})();
