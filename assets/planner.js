/* ═══════════════════════════════════════════════════════════════
   Digital Garden · planner.js v2.1
   Intelligent Study Planner — 4-step wizard + 3D card view
   ═══════════════════════════════════════════════════════════════ */

; (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────
  const CLOUDFLARE_WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';
  const CURRICULUM_MAP_URL = '../data/curriculum_map.json';
  const MAX_TOKENS = 8192;

  // ─── Env Loader (reads .env for local DeepSeek API) ──────
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

  // ─── API Config (local DeepSeek vs Cloudflare) ───────────
  function isLocalServer() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' || window.location.protocol === 'file:';
  }

  // ─── JSON Repair Utilities (ported from reformat_b_gemini.py) ───
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
    // Remove trailing comma before closing
    let result = text.replace(/,\s*$/, '');
    return result + stack.reverse().join('');
  }

  function tryParseJSON(text) {
    text = stripFences(text);
    // 1. Direct parse
    try { return JSON.parse(text); } catch (e) { /* continue */ }
    // 2. Extract JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
      // 3. Auto-close and parse
      try { return JSON.parse(autoClose(match[0])); } catch (e) { /* continue */ }
    }
    // 4. Auto-close full text
    try { return JSON.parse(autoClose(text)); } catch (e) { /* continue */ }
    return null;
  }

  const SELF_RATING_MAP = {
    excellent: 0.85,
    good: 0.55,
    weak: 0.20,
    not_studied: 0.0
  };

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

  // ─── Date Formatting ──────────────────────────────────────
  // mode: 'card' = "10 مارس" / "March 10"
  //       'table' = "10/3" (compact, below day name)
  //       'input' = "DD/MM/YYYY"
  function formatDate(dateStr, mode) {
    // Parse as local date (avoid UTC-to-local shift for YYYY-MM-DD strings)
    const parts = (dateStr || '').split('-');
    const d = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      : new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth(); // 0-indexed
    const year = d.getFullYear();
    const isAr = lang() === 'ar';
    const dayName = isAr ? DAY_NAMES.ar[d.getDay()] : DAY_NAMES.en[d.getDay()];

    switch (mode) {
      case 'card':
        // "الأحد · 10 مارس" / "Sun · March 10"
        return isAr
          ? `${dayName} · ${day} ${MONTH_NAMES.ar[month]}`
          : `${dayName} · ${MONTH_NAMES.en[month]} ${day}`;
      case 'table':
        // "10/3" — compact for print table
        return `${day}/${month + 1}`;
      case 'input':
        // "DD/MM/YYYY"
        return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      default:
        return dateStr;
    }
  }

  // ─── State ────────────────────────────────────────────────
  let curriculumMap = null;
  let currentStep = 1;
  let cardViewMode = 'cards'; // 'cards' or 'list'
  let currentCardIndex = 0;
  let _cardIndexInitialized = false; // tracks if we've auto-jumped to today already
  let allDayCards = [];  // flat list of days for card navigation (each card = one day)
  let use3D = true; // 3D flip toggle (auto-enabled)
  let _loadingIntervals = []; // track loading screen intervals for cleanup
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

  // ─── Init ─────────────────────────────────────────────────
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

    // Pre-load env for local API
    if (isLocalServer()) {
      await EnvLoader.load();
    }

    // Auto-open last plan if exists
    const activePlanKey = getActivePlanKey();
    const savedPlan = localStorage.getItem(activePlanKey);
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        showStep(4);
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('plan-content').style.display = '';
        renderPlan(plan);
        return;
      } catch (e) { /* corrupted plan, continue to wizard */ }
    }

    // No saved plan — show wizard step 1
    showStep(1);
  }

  // ─── Dual Plan Support ────────────────────────────────────
  function getActivePlanKey() {
    // Check for midterm plan first (most urgent)
    const midPlan = localStorage.getItem('study_plan_midterm');
    if (midPlan) {
      try {
        JSON.parse(midPlan); // validate JSON
        return 'study_plan_midterm';
      } catch (e) {
        localStorage.removeItem('study_plan_midterm');
      }
    }
    // Check for final plan
    const finalPlan = localStorage.getItem('study_plan_final');
    if (finalPlan) {
      try {
        JSON.parse(finalPlan);
        return 'study_plan_final';
      } catch (e) {
        localStorage.removeItem('study_plan_final');
      }
    }
    return 'study_plan_general';
  }

  function getPlanStorageKey(planType) {
    if (planType === 'midterm') return 'study_plan_midterm';
    if (planType === 'final') return 'study_plan_final';
    return 'study_plan_general';
  }

  // ─── Navigation ───────────────────────────────────────────
  function showStep(n) {
    currentStep = n;
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const steps = ['step-plan-type', 'step-courses', 'step-sessions', 'step-display'];
    const el = document.getElementById(steps[n - 1]);
    if (el) el.classList.add('active');

    // Hide wizard progress when showing the plan
    const wizardProgress = document.getElementById('wizard-progress');
    if (wizardProgress) {
      wizardProgress.style.display = (n === 4) ? 'none' : '';
    }

    // Hide continue prompt
    const cp = document.getElementById('continue-prompt');
    if (cp) cp.style.display = 'none';

    if (n < 4) updateWizardProgress();
    if (n === 2) buildCourseList();
    if (n === 3) {
      updateFeasibility();
      renderBusyDates(); // restore busy dates from userConfig
      // Sync rest-day checkboxes
      document.querySelectorAll('.rest-day-check').forEach(el => {
        const day = el.dataset.day;
        el.classList.toggle('checked', userConfig.rest_days.includes(day));
      });
      // Set start-date input default to today
      const startInput = document.getElementById('start-date-input');
      if (startInput && !startInput.value) {
        startInput.value = new Date().toISOString().split('T')[0];
        userConfig.start_date = startInput.value;
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

  // ─── Step 1: Plan Type ────────────────────────────────────
  function selectPlanType(type) {
    userConfig.plan_type = type;
    // Reset course module selections for new plan type
    userConfig.courses = {};
    document.querySelectorAll('.plan-type-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.planType === type);
    });
    hideError();
    setTimeout(() => nextStep(), 300);
  }

  // ─── Step 2: Course List ──────────────────────────────────
  function buildCourseList() {
    if (!curriculumMap) return;
    const container = document.getElementById('course-list');
    container.innerHTML = '';

    for (const [courseId, courseData] of Object.entries(curriculumMap.courses)) {
      const modules = Object.keys(courseData.modules);
      const isAr = lang() === 'ar';

      // Initialize config if not set
      if (!userConfig.courses[courseId]) {
        // Midterm: auto-select first 6 modules; Final/General: all modules
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
          </div>
          ` : ''}
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
        const modTitle = mod ? (isAr ? mod.title : mod.title_en) : m;
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
                </div>
              `}).join('')}
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
    if (idx >= 0) {
      cfg.included_modules.splice(idx, 1);
      el.classList.remove('checked');
    } else {
      cfg.included_modules.push(modId);
      cfg.included_modules.sort();
      el.classList.add('checked');
    }
  }

  function setRating(courseId, modId, rating, el) {
    userConfig.courses[courseId].self_rating[modId] = rating;
    el.parentElement.querySelectorAll('.rating-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  }

  // ─── Step 3: Session Config ───────────────────────────────
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

    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    if (activeCourses.length === 0) {
      statsEl.innerHTML = '';
      statusEl.textContent = isAr ? 'فعّل مادة واحدة على الأقل' : 'Enable at least one course';
      statusEl.className = 'feasibility-status';
      return;
    }

    // Find earliest exam
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
    let totalDays = earliestExam ? Math.max(1, Math.ceil((earliestExam - today) / 86400000)) : 14;

    // Count available days (exclude rest days and busy dates)
    let availDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      if (userConfig.rest_days.includes(dayName)) continue;
      const dateStr = d.toISOString().split('T')[0];
      if (userConfig.busy_dates.includes(dateStr)) continue;
      availDays++;
    }

    const availSessions = availDays * userConfig.daily_sessions;

    // Count modules needing study
    let criticalModules = 0, reviewModules = 0;
    for (const [courseId, cfg] of activeCourses) {
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

  // ─── Step 3 → 4: Generate Plan ────────────────────────────
  const DEEPSEEK_SYSTEM = `أنت مستشار أكاديمي ذكي متخصص في تحسين خطط الدراسة لطلاب علوم الحاسوب الجامعية.
مبادئك: 1.التبديل الذكي بين المواد 2.أولوية المتطلبات 3.الربط المفاهيمي 4.التصاعد التدريجي 5.الواقعية 6.يوم قبل الامتحان=مراجعة خفيفة
أجب بـ JSON نظيف فقط.`;

  function buildPrompt() {
    const isAr = lang() === 'ar';
    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);

    // Extract relevant topics only
    const relevant = {};
    for (const [cid, cfg] of activeCourses) {
      if (!curriculumMap.courses[cid]) continue;
      relevant[cid] = {};
      for (const m of cfg.included_modules) {
        const mod = curriculumMap.courses[cid].modules[m];
        if (mod) relevant[cid][m] = mod;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const coursesInfo = activeCourses.map(([cid, cfg]) => {
      const c = curriculumMap.courses[cid];
      return `${cid} (${c?.name_en || cid}): exam=${cfg.exam_date || 'none'}, modules=${cfg.included_modules.join(',')}, ratings=${JSON.stringify(cfg.self_rating)}`;
    }).join('\n');

    return `## مهمتك
أنشئ جدول مذاكرة ذكياً.
## إعدادات الطالب
- نوع: ${userConfig.plan_type}
- تاريخ اليوم: ${today}
- جلسات يومية: ${userConfig.daily_sessions}
- وحدات/جلسة: ${userConfig.modules_per_session}
- أيام راحة: ${userConfig.rest_days.join(', ')}
- أيام مشغولة: ${userConfig.busy_dates.join(', ') || 'لا يوجد'}
## المواد
${coursesInfo}
## بيانات المناهج
${JSON.stringify(relevant, null, 0)}
## الناتج المطلوب
أنتج JSON:
{"plan_summary":{"total_days":N,"total_sessions":N,"strategy_description":"...","weeks":[{"week_number":1,"theme":"..."}]},"days":[{"date":"YYYY-MM-DD","day_label":"...","week_number":1,"day_type":"study","sessions":[{"session_number":1,"course_id":"CS350","module_id":"M01","mode":"deep","difficulty_avg":7,"is_critical":false,"ai_note_ar":"...","ai_note_en":"...","must_know_today":["..."],"must_know_today_en":["..."],"must_memorize_today":["..."],"must_memorize_today_en":["..."]}],"daily_tip_ar":"...","daily_tip_en":"..."}]}`;
  }

  // ─── Loading Screen Helpers ──────────────────────────────
  function cleanupLoadingIntervals() {
    _loadingIntervals.forEach(id => clearInterval(id));
    _loadingIntervals = [];
  }

  function setupInteractiveLoading(isAr) {
    const stepsEl = document.getElementById('loading-steps');
    const fillEl = document.getElementById('loading-fill');
    const loadingScreen = document.getElementById('loading-screen');

    const loadSteps = isAr
      ? ['تحليل نقاط ضعفك...', 'اكتشاف الروابط بين المواضيع...', 'ترتيب الأولويات...', 'بناء الجدول...']
      : ['Analyzing weak points...', 'Finding topic connections...', 'Prioritizing...', 'Building schedule...'];

    const tips = isAr ? [
      '💡 التبديل بين المواد يُقوّي الذاكرة أكثر من دراسة مادة واحدة حتى الانتهاء',
      '💡 يوم الراحة قبل الامتحان أهم من المذاكرة المكثفة',
      '💡 اربط المفاهيم المتشابهة بين المواد — فهم واحد يُعزز الآخر',
      '💡 ابدأ بالأصعب وأنت نشيط، ثم انتقل للأسهل',
      '💡 استخدم تقنية البومودورو: 25 دقيقة مذاكرة + 5 دقائق راحة',
      '💡 المراجعة المتباعدة (Spaced Repetition) أفضل من الحشو المتواصل',
      '💡 اشرح المفهوم لنفسك بصوت عالٍ — إذا وقفت، ارجع وادرسه!'
    ] : [
      '💡 Switching between subjects strengthens memory retention',
      '💡 Rest day before exam is more important than cramming',
      '💡 Link similar concepts across courses — understanding one boosts the other',
      '💡 Start with hard topics while fresh, then move to easier ones',
      '💡 Use the Pomodoro technique: 25 min study + 5 min break',
      '💡 Spaced repetition beats continuous cramming',
      '💡 Explain the concept aloud — if you get stuck, review it!'
    ];

    // Steps display
    stepsEl.innerHTML = `
      <div class="loading-steps-list">
        ${loadSteps.map((s, i) => `<div class="loading-step" id="ls-${i}">${i === 0 ? '⏳' : '○'} ${s}</div>`).join('')}
      </div>
      <div class="loading-warning">
        ⚠️ ${isAr ? 'لا تحدّث الصفحة — المحتوى قيد التوليد' : 'Do not refresh — content is being generated'}
      </div>
      <div class="loading-timer" id="loading-timer">00:00</div>
      <div class="loading-tip" id="loading-tip">${tips[0]}</div>
    `;

    // Timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      const timerEl = document.getElementById('loading-timer');
      if (timerEl) timerEl.textContent = mins + ':' + secs;
    }, 1000);
    _loadingIntervals.push(timerInterval);

    // Rotating tips every 8 seconds
    let tipIdx = 0;
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % tips.length;
      const tipEl = document.getElementById('loading-tip');
      if (tipEl) {
        tipEl.style.opacity = '0';
        setTimeout(() => {
          tipEl.textContent = tips[tipIdx];
          tipEl.style.opacity = '1';
        }, 400);
      }
    }, 8000);
    _loadingIntervals.push(tipInterval);

    // Advance helper
    const advanceLoading = (step, pct) => {
      fillEl.style.width = pct + '%';
      for (let i = 0; i < loadSteps.length; i++) {
        const el = document.getElementById('ls-' + i);
        if (!el) continue;
        if (i < step) { el.classList.add('done'); el.classList.remove('active-step'); el.textContent = '✅ ' + loadSteps[i]; }
        else if (i === step) { el.classList.add('active-step'); el.textContent = '⏳ ' + loadSteps[i]; }
      }
    };

    return advanceLoading;
  }

  async function onGeneratePlan() {
    hideError();
    showStep(4);
    const loadingScreen = document.getElementById('loading-screen');
    const planContent = document.getElementById('plan-content');
    loadingScreen.classList.add('active');
    planContent.style.display = 'none';

    window._lastRenderSig = null;
    window.GardenSync?.pause();

    const isAr = lang() === 'ar';
    cleanupLoadingIntervals();
    const advanceLoading = setupInteractiveLoading(isAr);

    advanceLoading(0, 15);

    try {
      const prompt = buildPrompt();
      advanceLoading(1, 35);

      // Dual API: local → DeepSeek direct, GitHub → Cloudflare Worker
      let apiUrl, apiHeaders, apiBody, parseResponse;
      const deepseekKey = isLocalServer() ? await EnvLoader.getDeepseekKey() : '';

      if (deepseekKey) {
        // Local: call DeepSeek API directly
        apiUrl = 'https://api.deepseek.com/chat/completions';
        apiHeaders = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + deepseekKey
        };
        apiBody = JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: DEEPSEEK_SYSTEM },
            { role: 'user', content: prompt }
          ],
          max_tokens: MAX_TOKENS,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        parseResponse = (data) => data.choices?.[0]?.message?.content || '';
      } else {
        // GitHub Pages: use Cloudflare Worker
        apiUrl = CLOUDFLARE_WORKER_URL;
        apiHeaders = { 'Content-Type': 'application/json' };
        apiBody = JSON.stringify({
          messages: [
            { role: 'system', content: DEEPSEEK_SYSTEM },
            { role: 'user', content: prompt }
          ],
          max_tokens: MAX_TOKENS,
          temperature: 0.3
        });
        parseResponse = (data) => data.text || data.choices?.[0]?.message?.content || '';
      }

      // Fetch with 90-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: apiBody,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      advanceLoading(2, 65);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('API response status:', response.status, '| Response preview:', errBody.substring(0, 200));
        throw new Error('API error: ' + response.status);
      }
      const data = await response.json();

      if (data.error) {
        console.error('API returned error object:', data.error);
        throw new Error(data.message_ar || data.message_en || data.error);
      }

      advanceLoading(3, 85);

      let planData;
      const text = parseResponse(data);
      console.log('AI response length:', text.length, 'chars');

      // Check finish_reason for truncation
      const finishReason = data.choices?.[0]?.finish_reason || '';
      if (finishReason === 'length') {
        console.warn('AI response was truncated (finish_reason=length). Attempting JSON repair...');
      }

      // Use robust JSON parser with auto-close repair
      planData = tryParseJSON(text);
      if (!planData) {
        console.error('Failed to parse AI response even with repair. First 300 chars:', text.substring(0, 300));
        throw new Error('Invalid JSON response from AI');
      }
      console.log('AI plan parsed successfully. Days:', planData.days?.length);

      // Save plan to appropriate storage key
      const fullPlan = {
        plan_type: userConfig.plan_type,
        generated_at: new Date().toISOString(),
        ai_model: 'deepseek',
        ai_status: 'success',
        config: userConfig,
        ...planData
      };
      const storageKey = getPlanStorageKey(userConfig.plan_type);
      localStorage.setItem(storageKey, JSON.stringify(fullPlan));
      localStorage.setItem('planner_config', JSON.stringify(userConfig));

      cleanupLoadingIntervals();
      advanceLoading(4, 100);

      setTimeout(() => {
        loadingScreen.classList.remove('active');
        planContent.style.display = '';
        try {
          renderPlan(fullPlan);
        } catch (renderErr) {
          console.error('renderPlan error:', renderErr);
          planContent.innerHTML = '<div style="padding:2rem;text-align:center;color:#f43f5e;"><h3>⚠️ خطأ في عرض الجدول</h3><p>' + renderErr.message + '</p><button onclick="Planner.regenerate()" style="margin-top:1rem;padding:0.5rem 1rem;border-radius:8px;border:1px solid #a78bfa;background:rgba(167,139,250,0.1);color:#a78bfa;cursor:pointer;">إعادة التوليد</button></div>';
        }
        window.GardenSync?.resume();
      }, 500);

    } catch (err) {
      console.error('Plan generation failed:', err.message);
      cleanupLoadingIntervals();
      loadingScreen.classList.remove('active');
      planContent.style.display = '';
      // Show fallback plan with clear ai_status tracking
      const fallback = generateFallbackPlan();
      fallback.ai_status = 'fallback';
      const storageKey = getPlanStorageKey(userConfig.plan_type);
      localStorage.setItem(storageKey, JSON.stringify(fallback));
      localStorage.setItem('planner_config', JSON.stringify(userConfig));
      try {
        renderPlan(fallback);
      } catch (renderErr) {
        console.error('Fallback renderPlan error:', renderErr);
        planContent.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);"><p>⚠️ ' + renderErr.message + '</p></div>';
      }
      window.GardenSync?.resume();
      showInfo(isAr
        ? 'تم إنشاء جدول أساسي تلقائياً (بدون AI). يمكنك إعادة التوليد للحصول على جدول ذكي.'
        : 'A basic plan was generated locally. You can regenerate for an AI-powered plan.');
    }
  }

  // ─── Smart Local Plan Generator (v3 — Exam-Aware Adaptive) ──
  // 1. Extends schedule until LAST exam (not first)
  // 2. Multi-phase: study → review → golden review → exam
  // 3. After each exam, course is removed from future scheduling
  // 4. Spaced review sessions injected automatically
  // 5. Honors modules_per_session and start_date

  function generateSmartLocalPlan() {
    const startDate = userConfig.start_date ? new Date(userConfig.start_date + 'T00:00:00') : new Date();
    startDate.setHours(0, 0, 0, 0);
    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    const isAr = lang() === 'ar';
    const mps = userConfig.modules_per_session || 1;
    const sessionsPerDay = userConfig.daily_sessions || 2;

    // ── Helper: build a session object ──
    function buildSession(item, num, modeOverride, noteOverride) {
      const partLabel = item._partLabel || '';
      const mode = modeOverride || item.mode;
      const isReview = mode === 'flash' || mode === 'review';
      return {
        session_number: num,
        course_id: item.courseId,
        module_id: item.moduleId + (partLabel ? ' ' + partLabel : ''),
        mode,
        difficulty_avg: item.difficulty,
        is_critical: item.priority >= 3 && !isReview,
        ai_note_ar: noteOverride?.ar || (item.priority >= 3 ? `⚠️ هذه الوحدة تحتاج دراسة مركّزة — ${curriculumMap.courses[item.courseId]?.name || item.courseId}` : ''),
        ai_note_en: noteOverride?.en || (item.priority >= 3 ? `⚠️ This module needs focused study — ${curriculumMap.courses[item.courseId]?.name_en || item.courseId}` : ''),
        must_know_today: item.mustKnow,
        must_know_today_en: item.mustKnowEn.length ? item.mustKnowEn : item.mustKnow,
        must_memorize_today: item.mustMem,
        must_memorize_today_en: item.mustMemEn.length ? item.mustMemEn : item.mustMem,
        completed: false,
        _snoozeCount: 0
      };
    }

    // ── Step 1: Collect exam dates and sort courses by exam ──
    const courseExams = []; // [{cid, examDate}] sorted by date
    let latestExam = null;
    for (const [cid, cfg] of activeCourses) {
      const examDate = cfg.exam_date ? new Date(cfg.exam_date + 'T00:00:00') : null;
      courseExams.push({ cid, examDate });
      if (examDate && (!latestExam || examDate > latestExam)) latestExam = examDate;
    }
    // Sort: courses with exams first (by date), then no-exam courses last
    courseExams.sort((a, b) => {
      if (!a.examDate && !b.examDate) return 0;
      if (!a.examDate) return 1;
      if (!b.examDate) return -1;
      return a.examDate - b.examDate;
    });

    const endDate = latestExam || new Date(startDate.getTime() + 14 * 86400000);
    const totalCalendarDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000)) + 1; // +1 to include exam day

    // ── Step 2: Build all available dates ──
    const allDates = [];
    for (let i = 0; i < totalCalendarDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      allDates.push(d);
    }

    function isAvailable(d) {
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = d.toISOString().split('T')[0];
      return !userConfig.rest_days.includes(dayName) && !userConfig.busy_dates.includes(dateStr);
    }

    // ── Step 3: Collect & categorize all modules ──
    const allModulesByCourse = {}; // cid → [moduleItem]
    for (const [cid, cfg] of activeCourses) {
      allModulesByCourse[cid] = [];
      for (const m of cfg.included_modules) {
        const r = cfg.self_rating[m] || 'not_studied';
        const priority = r === 'not_studied' ? 4 : r === 'weak' ? 3 : r === 'good' ? 2 : 1;
        const mod = curriculumMap.courses[cid]?.modules[m];
        const diff = mod?.module_difficulty || 5;

        const mustKnow = [], mustKnowEn = [], mustMem = [], mustMemEn = [];
        if (mod?.topics) {
          for (const t of mod.topics) {
            if (t.must_know) mustKnow.push(...t.must_know);
            if (t.must_know_en) mustKnowEn.push(...t.must_know_en);
            if (t.must_memorize) mustMem.push(...t.must_memorize);
            if (t.must_memorize_en) mustMemEn.push(...t.must_memorize_en);
          }
        }

        allModulesByCourse[cid].push({
          courseId: cid, moduleId: m, priority, difficulty: diff, mod,
          mustKnow: mustKnow.slice(0, 3), mustKnowEn: mustKnowEn.slice(0, 3),
          mustMem: mustMem.slice(0, 2), mustMemEn: mustMemEn.slice(0, 2),
          mode: priority >= 3 ? 'deep' : priority === 2 ? 'full' : 'flash'
        });
      }
      allModulesByCourse[cid].sort((a, b) => b.priority - a.priority || b.difficulty - a.difficulty);
    }

    // ── Step 4: Apply modules_per_session expansion/collapse per course ──
    function expandModules(modules) {
      if (mps < 1) {
        const sessionsPerMod = Math.round(1 / mps);
        const expanded = [];
        for (const item of modules) {
          for (let p = 0; p < sessionsPerMod; p++) {
            expanded.push({ ...item, _partLabel: `(${p + 1}/${sessionsPerMod})` });
          }
        }
        return expanded;
      } else if (mps > 1) {
        const mergeCount = Math.round(mps);
        const merged = [];
        for (let i = 0; i < modules.length; i += mergeCount) {
          const group = modules.slice(i, i + mergeCount);
          const m = { ...group[0] };
          if (group.length > 1) {
            m.moduleId = group.map(g => g.moduleId).join(' + ');
            m.difficulty = Math.round(group.reduce((s, g) => s + g.difficulty, 0) / group.length);
            m.mustKnow = group.flatMap(g => g.mustKnow).slice(0, 3);
            m.mustKnowEn = group.flatMap(g => g.mustKnowEn).slice(0, 3);
            m.mustMem = group.flatMap(g => g.mustMem).slice(0, 2);
            m.mustMemEn = group.flatMap(g => g.mustMemEn).slice(0, 2);
          }
          merged.push(m);
        }
        return merged;
      }
      return modules;
    }

    const studyQueueByCourse = {}; // cid → expanded modules still to study
    for (const cid of Object.keys(allModulesByCourse)) {
      studyQueueByCourse[cid] = expandModules([...allModulesByCourse[cid]]);
    }

    // ── Step 5: Build schedule day by day ──
    const days = [];
    let sessionCount = 0;
    const studiedModules = []; // track modules already studied (for review scheduling)
    const reviewScheduled = new Set(); // track "courseId:moduleId" already scheduled for review
    const finishedCourses = new Set(); // courses whose exam has passed

    for (let i = 0; i < allDates.length; i++) {
      const d = allDates[i];
      const dateStr = d.toISOString().split('T')[0];

      // ── Check if today is an exam day for any course ──
      const examsToday = courseExams.filter(ce =>
        ce.examDate && ce.examDate.toISOString().split('T')[0] === dateStr
      );
      if (examsToday.length > 0) {
        // Insert exam marker card
        const examSessions = examsToday.map((ce, idx) => {
          const courseName = curriculumMap.courses[ce.cid]
            ? (isAr ? curriculumMap.courses[ce.cid].name : curriculumMap.courses[ce.cid].name_en)
            : ce.cid;
          return {
            session_number: idx + 1,
            course_id: ce.cid,
            module_id: isAr ? 'اختبار' : 'Exam',
            mode: 'exam',
            difficulty_avg: 10,
            is_critical: false,
            ai_note_ar: `📝 اختبار ${courseName} — بالتوفيق!`,
            ai_note_en: `📝 ${courseName} Exam — Good luck!`,
            must_know_today: [],
            must_know_today_en: [],
            must_memorize_today: [],
            must_memorize_today_en: [],
            completed: false
          };
        });
        days.push({
          date: dateStr,
          day_label: formatDate(dateStr, 'card'),
          week_number: Math.floor(i / 7) + 1,
          day_type: 'exam',
          sessions: examSessions,
          daily_tip_ar: '📝 يوم اختبار — توكل على الله وثق بنفسك!',
          daily_tip_en: '📝 Exam day — trust yourself and do your best!'
        });

        // Mark these courses as finished
        examsToday.forEach(ce => finishedCourses.add(ce.cid));
        continue;
      }

      if (!isAvailable(d)) continue;

      // ── Determine which courses are still active (not yet examined) ──
      const liveCourseIds = courseExams
        .map(ce => ce.cid)
        .filter(cid => !finishedCourses.has(cid));

      if (liveCourseIds.length === 0) break;

      // ── Check if this is a golden review day (1-2 days before any exam) ──
      let goldenExam = null;
      for (const ce of courseExams) {
        if (!ce.examDate || finishedCourses.has(ce.cid)) continue;
        const daysUntilExam = Math.ceil((ce.examDate - d) / 86400000);
        if (daysUntilExam >= 1 && daysUntilExam <= 2) {
          goldenExam = ce;
          break;
        }
      }

      if (goldenExam) {
        // ── Golden Review Day: review hardest modules of the upcoming exam course ──
        const cid = goldenExam.cid;
        const courseModules = allModulesByCourse[cid] || [];
        const hardest = [...courseModules].sort((a, b) => b.difficulty - a.difficulty || b.priority - a.priority).slice(0, sessionsPerDay);
        const sessions = hardest.map((item, idx) =>
          buildSession(item, idx + 1, 'flash', {
            ar: `⭐ مراجعة ذهبية — ${curriculumMap.courses[cid]?.name || cid}`,
            en: `⭐ Golden review — ${curriculumMap.courses[cid]?.name_en || cid}`
          })
        );
        if (sessions.length > 0) {
          days.push({
            date: dateStr,
            day_label: formatDate(dateStr, 'card'),
            week_number: Math.floor(i / 7) + 1,
            day_type: 'golden_review',
            sessions,
            daily_tip_ar: `⭐ مراجعة ذهبية لمادة ${curriculumMap.courses[cid]?.name || cid} — الاختبار قريب!`,
            daily_tip_en: `⭐ Golden review for ${curriculumMap.courses[cid]?.name_en || cid} — exam is near!`
          });
          sessionCount += sessions.length;
        }
        continue;
      }

      // ── Regular study/review day ──
      const sessions = [];

      // Decide: ~20% of slots for review, ~80% for new study
      const reviewSlots = Math.max(0, Math.floor(sessionsPerDay * 0.2));
      const studySlots = sessionsPerDay - reviewSlots;

      // Fill study slots (round-robin across live courses)
      let filled = 0;
      let rrIdx = 0;
      let emptyRounds = 0;
      while (filled < studySlots && emptyRounds < liveCourseIds.length) {
        const cid = liveCourseIds[rrIdx % liveCourseIds.length];
        rrIdx++;
        if (studyQueueByCourse[cid] && studyQueueByCourse[cid].length > 0) {
          const item = studyQueueByCourse[cid].shift();
          sessions.push(buildSession(item, sessions.length + 1));
          studiedModules.push({ ...item, _studiedDate: dateStr });
          filled++;
          emptyRounds = 0;
        } else {
          emptyRounds++;
        }
      }

      // Fill review slots from studiedModules (spaced repetition: review after 2+ days)
      if (reviewSlots > 0 && studiedModules.length > 0) {
        const reviewCandidates = studiedModules.filter(sm => {
          const daysSince = Math.ceil((d - new Date(sm._studiedDate + 'T00:00:00')) / 86400000);
          const key = sm.courseId + ':' + sm.moduleId;
          return daysSince >= 2 && !finishedCourses.has(sm.courseId) && !reviewScheduled.has(key + ':' + dateStr);
        });
        // Pick hardest/highest priority first
        reviewCandidates.sort((a, b) => b.priority - a.priority || b.difficulty - a.difficulty);
        for (let r = 0; r < reviewSlots && r < reviewCandidates.length; r++) {
          const item = reviewCandidates[r];
          sessions.push(buildSession(item, sessions.length + 1, 'flash', {
            ar: `🔄 مراجعة — ${curriculumMap.courses[item.courseId]?.name || item.courseId}`,
            en: `🔄 Review — ${curriculumMap.courses[item.courseId]?.name_en || item.courseId}`
          }));
          reviewScheduled.add(item.courseId + ':' + item.moduleId + ':' + dateStr);
        }
      }

      if (sessions.length > 0) {
        const hasReview = sessions.some(s => s.mode === 'flash');
        days.push({
          date: dateStr,
          day_label: formatDate(dateStr, 'card'),
          week_number: Math.floor(i / 7) + 1,
          day_type: hasReview ? 'mixed' : 'study',
          sessions,
          daily_tip_ar: '',
          daily_tip_en: ''
        });
        sessionCount += sessions.length;
      }
    }

    // ── Build week labels ──
    const weekSet = [...new Set(days.map(d => d.week_number))];
    const weeks = weekSet.map((w, i) => ({
      week_number: w,
      theme: i === 0
        ? (isAr ? 'بناء الأساس' : 'Foundation')
        : i === weekSet.length - 1
          ? (isAr ? 'مراجعة وتثبيت' : 'Review & Consolidation')
          : (isAr ? 'تعميق الفهم' : 'Deepening Understanding'),
      theme_en: i === 0 ? 'Foundation Building' : i === weekSet.length - 1 ? 'Review & Consolidation' : 'Deepening Understanding'
    }));

    return {
      plan_type: userConfig.plan_type,
      generated_at: new Date().toISOString(),
      ai_model: 'smart_local',
      ai_status: 'smart_local',
      config: { ...userConfig },
      plan_summary: {
        total_days: days.length,
        total_sessions: sessionCount,
        strategy_description_ar: 'جدول تكيّفي ذكي — يمتد حتى آخر اختبار مع مراجعة ذهبية ⭐ قبل كل اختبار وحذف تلقائي للمواد المنتهية',
        strategy_description_en: 'Adaptive smart plan — extends to last exam with golden reviews ⭐ before each exam and auto-removal of finished courses',
        strategy_description: 'جدول تكيّفي ذكي — يمتد حتى آخر اختبار مع مراجعة ذهبية ⭐ قبل كل اختبار وحذف تلقائي للمواد المنتهية',
        weeks
      },
      days
    };
  }

  // Keep old fallback as alias for backward compatibility
  function generateFallbackPlan() {
    return generateSmartLocalPlan();
  }

  // ─── Generate Local Plan (UI wrapper) ─────────────────────
  function generateLocalPlan() {
    hideError();
    hideInfo();
    showStep(4);
    const loadingScreen = document.getElementById('loading-screen');
    const planContent = document.getElementById('plan-content');
    loadingScreen.classList.remove('active');
    planContent.style.display = '';

    window._lastRenderSig = null;
    window.GardenSync?.pause();

    const plan = generateSmartLocalPlan();
    const storageKey = getPlanStorageKey(userConfig.plan_type);
    localStorage.setItem(storageKey, JSON.stringify(plan));
    localStorage.setItem('planner_config', JSON.stringify(userConfig));

    try {
      renderPlan(plan);
    } catch (renderErr) {
      console.error('Local plan renderPlan error:', renderErr);
      planContent.innerHTML = '<div style="padding:2rem;text-align:center;color:#f43f5e;"><h3>⚠️ خطأ في عرض الجدول</h3><p>' + renderErr.message + '</p></div>';
    }

    window.GardenSync?.resume();

    showInfo(lang() === 'ar'
      ? '📋 تم إنشاء جدول ذكي محلياً — مرتب حسب الأولوية مع تبديل بين المواد.'
      : '📋 Smart local plan generated — prioritized with course interleaving.');
  }

  // ─── Auto-Cleanup: Remove Expired Course Sessions (Phase 3) ──
  function cleanupExpiredCourses(plan) {
    const todayStr = new Date().toISOString().split('T')[0];
    const examDates = {};

    if (plan.config?.courses) {
      for (const [cid, cfg] of Object.entries(plan.config.courses)) {
        if (cfg.exam_date) examDates[cid] = cfg.exam_date;
      }
    }

    // Remove sessions of courses whose exam has passed from future days
    let changed = false;
    plan.days.forEach(day => {
      if (day.date <= todayStr) return; // don't modify past/today
      const before = day.sessions.length;
      day.sessions = day.sessions.filter(s => {
        const examDate = examDates[s.course_id];
        return !examDate || day.date <= examDate;
      });
      if (day.sessions.length !== before) changed = true;
      // Re-number sessions
      day.sessions.forEach((s, idx) => s.session_number = idx + 1);
    });

    // Remove empty days (but keep exam days)
    if (changed) {
      plan.days = plan.days.filter(d => (d.sessions && d.sessions.length > 0) || d.day_type === 'exam');
    }
  }

  // ─── Build Course Progress Bars HTML (Phase 3) ──────────────
  function buildCourseProgressBars(plan, isAr) {
    if (!plan.config?.courses) return '';
    const todayStr = new Date().toISOString().split('T')[0];
    const todayD = new Date(todayStr + 'T00:00:00');
    const activeCourses = Object.entries(plan.config.courses).filter(([, c]) => c.active);
    if (activeCourses.length === 0) return '';

    let barsHTML = '';
    for (const [cid, cfg] of activeCourses) {
      const courseName = curriculumMap?.courses?.[cid]
        ? (isAr ? curriculumMap.courses[cid].name : curriculumMap.courses[cid].name_en)
        : cid;

      // Count total and completed sessions for this course
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

      // Days until exam
      let metaText = '';
      let fillClass = '';
      if (cfg.exam_date) {
        const examD = new Date(cfg.exam_date + 'T00:00:00');
        const daysLeft = Math.ceil((examD - todayD) / 86400000);
        if (daysLeft < 0) {
          metaText = isAr ? '✅ انتهى' : '✅ Done';
          fillClass = 'exam-passed';
        } else if (daysLeft <= 3) {
          metaText = isAr ? `⚠️ ${daysLeft} أيام` : `⚠️ ${daysLeft}d left`;
          fillClass = 'near-exam';
        } else {
          metaText = isAr ? `${daysLeft} يوم` : `${daysLeft}d left`;
        }
      }

      barsHTML += `
        <div class="course-progress-item">
          <span class="course-progress-name">${cid}</span>
          <div class="course-progress-bar"><div class="course-progress-fill ${fillClass}" style="width:${pct}%"></div></div>
          <span class="course-progress-meta">${pct}% ${metaText ? '· ' + metaText : ''}</span>
        </div>
      `;
    }

    return `<div class="course-progress-bars">${barsHTML}</div>`;
  }

  // ─── Render Plan ──────────────────────────────────────────
  function renderPlan(plan) {
    // تجاهل إذا لم تتغير البيانات أو وضع العرض — يمنع أي مصدر من إعادة render بنفس البيانات
    const _sig = JSON.stringify(plan?.days?.map(d=>d.date+d.sessions?.length)) + '|' + cardViewMode;
    if (_sig === window._lastRenderSig) return;
    window._lastRenderSig = _sig;
    const container = document.getElementById('plan-content');
    const isAr = lang() === 'ar';

    // Phase 3: Auto-cleanup expired courses
    cleanupExpiredCourses(plan);

    console.log('renderPlan called, days:', plan.days?.length, 'plan_type:', plan.plan_type);

    const totalDays = plan.plan_summary?.total_days || plan.days?.length || 0;
    const totalSessions = plan.plan_summary?.total_sessions || 0;
    const strategy = isAr
      ? (plan.plan_summary?.strategy_description_ar || plan.plan_summary?.strategy_description || '')
      : (plan.plan_summary?.strategy_description_en || plan.plan_summary?.strategy_description || '');

    const planTypeLabel = { general: isAr ? 'عام' : 'General', midterm: isAr ? 'ميدتيرم' : 'Midterm', final: isAr ? 'فاينل' : 'Final' };

    // Build day cards flat list for card navigation (each card = one day with all sessions)
    allDayCards = [];
    (plan.days || []).forEach(day => {
      if (day.sessions && day.sessions.length > 0) {
        allDayCards.push(day);
      }
    });
    // currentCardIndex = 0; // Removed: This would reset the index on every re-render.

    // AI source label
    const aiStatus = plan.ai_status || (plan.ai_model === 'deepseek' ? 'success' : plan.ai_model === 'smart_local' ? 'smart_local' : 'fallback');
    let sourceLabel, sourceLabelClass;
    if (aiStatus === 'success') {
      sourceLabel = isAr ? '🤖 مولّد عبر الذكاء الاصطناعي' : '🤖 AI Generated';
      sourceLabelClass = 'ai';
    } else if (aiStatus === 'smart_local') {
      sourceLabel = isAr ? '📋 جدول ذكي محلي' : '📋 Smart Local Plan';
      sourceLabelClass = 'smart_local';
    } else {
      sourceLabel = isAr ? '📋 جدول أساسي محلي' : '📋 Local Basic Plan';
      sourceLabelClass = 'local';
    }

    // Plan header
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

      <!-- Per-course progress bars (Phase 3) -->
      ${buildCourseProgressBars(plan, isAr)}

      <!-- View mode toggle -->
      <div class="view-mode-toggle">
        <button class="view-mode-btn ${cardViewMode === 'cards' ? 'active' : ''}" onclick="Planner.setViewMode('cards')">
          <i class="fas fa-clone"></i> ${isAr ? 'بطاقات' : 'Cards'}
        </button>
        <button class="view-mode-btn ${cardViewMode === 'list' ? 'active' : ''}" onclick="Planner.setViewMode('list')">
          <i class="fas fa-list"></i> ${isAr ? 'عرض الكل' : 'Show All'}
        </button>
      </div>
    `;

    if (cardViewMode === 'cards') {
      html += renderCardView(plan, isAr);
    } else {
      html += renderListView(plan, isAr);
    }

    console.log('renderPlan: setting innerHTML, length:', html.length);
    container.innerHTML = html;

    // Auto-scroll to today in list view
    if (cardViewMode === 'list') {
      setTimeout(() => {
        const todayEl = container.querySelector('.day-section.today-section');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // No today — find nearest future day
          const todayStr = new Date().toISOString().split('T')[0];
          const allDays = container.querySelectorAll('.day-section[data-date]');
          for (const el of allDays) {
            if (el.dataset.date >= todayStr) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              break;
            }
          }
        }
      }, 150);
    }

    // لا نستدعي Garden.setLanguage — كان مصدر الحلقة الأصلية
    if (!window._plannerLangListenerAttached) {
      document.addEventListener('garden:languageChanged', (e) => {
        const newLang = e.detail?.lang;
        if (!newLang || newLang === window._plannerLastLang) return;
        window._plannerLastLang = newLang;
        window._lastRenderSig = null;
        const p = getCurrentPlan();
        if (p) renderPlan(p);
      });
      window._plannerLastLang = lang();
      window._plannerLangListenerAttached = true;
    }
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
      plan_type: null,
      daily_sessions: 2,
      modules_per_session: 1,
      start_date: null,
      rest_days: ['friday', 'saturday'],
      busy_dates: [],
      courses: {}
    };
    currentStep = 1;
    cardViewMode = 'cards';
    currentCardIndex = 0;
    _cardIndexInitialized = false;
    hideError();
    hideInfo();
    showStep(1);
  }

  // ─── Arabic Pluralization Helper ──────────────────────────
  function formatSessionsCount(count, isAr) {
    if (!isAr) return `${count} Sessions`;
    if (count === 1) return 'جلسة واحدة';
    if (count === 2) return 'جلستين';
    return `${count} جلسات`;
  }

  // ─── Card View (each session is its own 3D card) ────────────
  function renderCardView(plan, isAr) {
    if (allDayCards.length === 0) return `<p style="text-align:center;color:var(--text-muted)">${isAr ? 'لا توجد جلسات' : 'No sessions'}</p>`;

    const todayStr = new Date().toISOString().split('T')[0];
    // Find today's card — only auto-jump on first render, not on navigation
    if (!_cardIndexInitialized) {
      const todayIdx = allDayCards.findIndex(d => d.date === todayStr);
      if (todayIdx >= 0) {
        currentCardIndex = todayIdx;
      } else {
        // No exact today — jump to nearest future day (or last day if all past)
        const futureIdx = allDayCards.findIndex(d => d.date > todayStr);
        currentCardIndex = futureIdx >= 0 ? futureIdx : Math.max(0, allDayCards.length - 1);
      }
      _cardIndexInitialized = true;
    }
    if (currentCardIndex >= allDayCards.length) currentCardIndex = Math.max(0, allDayCards.length - 1);

    const day = allDayCards[currentCardIndex];
    const isToday = day.date === todayStr;
    const sessions = day.sessions || [];

    // Build each session as an independent 3D flip card
    let sessionCardsHTML = '';
    sessions.forEach((session, sIdx) => {
      const courseName = curriculumMap.courses[session.course_id]
        ? (isAr ? curriculumMap.courses[session.course_id].name : curriculumMap.courses[session.course_id].name_en)
        : session.course_id;
      const diff = session.difficulty_avg || 5;
      const diffLabel = diff >= 9 ? 'critical' : diff >= 7 ? 'hard' : diff >= 4 ? 'medium' : 'easy';
      const modeEmoji = session.mode === 'deep' ? '🔴' : session.mode === 'full' ? '🟡' : '🟢';

      // Back details for this session
      const mustKnowMsg = isAr ? 'يجب معرفته' : 'Must know';
      const mustMemMsg = isAr ? 'يجب حفظه' : 'Must memorize';

      const mustKnowList = (!isAr && session.must_know_today_en && session.must_know_today_en.length > 0) ? session.must_know_today_en : session.must_know_today;
      const mustMemList = (!isAr && session.must_memorize_today_en && session.must_memorize_today_en.length > 0) ? session.must_memorize_today_en : session.must_memorize_today;

      const contentNoteStr = !isAr && mustKnowList?.length && mustKnowList[0].match(/[\u0600-\u06FF]/)
        ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;font-weight:600;">(Module details maintained in Arabic)</div>` : '';

      const mustKnow = mustKnowList?.length
        ? `<div class="card-back-section"><span class="card-back-icon">🎯</span><div><strong>${mustKnowMsg}:</strong>${contentNoteStr}<br>${mustKnowList.join('<br>')}</div></div>` : '';
      const mustMem = mustMemList?.length
        ? `<div class="card-back-section"><span class="card-back-icon">📝</span><div><strong>${mustMemMsg}:</strong>${contentNoteStr}<br>${mustMemList.join('<br>')}</div></div>` : '';
      const aiNoteStr = isAr ? (session.ai_note_ar || session.ai_note) : (session.ai_note_en || session.ai_note);
      const aiNote = aiNoteStr
        ? `<div class="card-back-section"><span class="card-back-icon">💡</span><div>${aiNoteStr}</div></div>` : '';
      const crossLink = session.cross_link_alert?.active
        ? `<div class="card-back-section"><span class="card-back-icon">🔗</span><div>${session.cross_link_alert.message}</div></div>` : '';

      sessionCardsHTML += `
        <div class="sc-scene ${use3D ? '' : 'mobile-3d-off'}" id="session-scene-${sIdx}">
          <div class="sc-card ${session.completed ? 'completed' : ''}"
               id="session-inner-${sIdx}"
               onclick="Planner.flipSession(${sIdx})">
            <div class="sc-face sc-front">
              <div class="card-session-top-row">
                <span class="card-session-badge ${diffLabel}">${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
                <span class="card-diff-text">${isAr ? 'الصعوبة: ' + diff + ' من 10' : 'Difficulty: ' + diff + ' of 10'}</span>
              </div>
              <div class="card-course-name">${session.course_id} — ${session.module_id}</div>
              <div class="card-course-subtitle">${courseName}</div>
              <div class="card-difficulty">
                <span class="card-diff-bar"><span class="card-diff-fill ${diffLabel}" style="width:${diff * 10}%"></span></span>
                <span class="card-diff-label ${diffLabel}">${isAr
          ? (diffLabel === 'critical' ? 'حرج' : diffLabel === 'hard' ? 'صعب' : diffLabel === 'medium' ? 'متوسط' : 'سهل')
          : (diffLabel === 'critical' ? 'Critical' : diffLabel === 'hard' ? 'Hard' : diffLabel === 'medium' ? 'Medium' : 'Easy')
        }</span>
              </div>
              <button class="card-session-done-btn"
                      onclick="event.stopPropagation(); Planner.toggleComplete('${day.date}',${session.session_number})">
                ${session.completed ? (isAr ? '↩ إلغاء' : '↩ Undo') : (isAr ? '✅ أتممت مذاكرة المودل' : '✅ Module Complete')}
              </button>
              ${(session.mode === 'flash' || day.day_type === 'golden_review') && !session.completed ? `
              <button class="card-snooze-btn"
                      onclick="event.stopPropagation(); Planner.snoozeSession('${day.date}',${session.session_number})">
                😴 ${isAr ? 'راحة' : 'Snooze'}
                ${(session._snoozeCount || 0) > 0 ? `<span class="snooze-warning">(${session._snoozeCount}/2)</span>` : ''}
              </button>` : ''}
              <div class="sc-hint">${isAr ? '👆 اضغط للتفاصيل' : '👆 Tap for details'}</div>
            </div>
            <!-- BACK -->
            <div class="sc-face sc-back">
              <div class="card-back-session-title">${session.course_id} — ${session.module_id}</div>
              <div class="card-back-subtitle">${courseName}</div>
              <div class="sc-back-body">
                ${mustKnow}${mustMem}${aiNote}${crossLink}
              </div>
              <div class="sc-hint">${isAr ? '👆 اضغط للرجوع' : '👆 Tap to go back'}</div>
            </div>
          </div>
        </div>
      `;
    });

    // 3D toggle button (will be hidden on desktop via CSS)
    const toggle3DBtn = `
      <button class="card-3d-toggle" onclick="Planner.toggle3D()">
        <i class="fas ${use3D ? 'fa-cube' : 'fa-square'}"></i>
        ${use3D ? (isAr ? '3D مفعّل' : '3D On') : (isAr ? '3D معطّل' : '3D Off')}
      </button>
    `;

    return `
      <div class="card-3d-container">
        <div class="card-top-bar">
          <div class="card-counter">${isAr ? `الجلسات المتبقية: ${formatSessionsCount(allDayCards.length - currentCardIndex, isAr)} من اصل ${formatSessionsCount(allDayCards.length, isAr)}` : `Remaining: ${allDayCards.length - currentCardIndex} of ${allDayCards.length}`}</div>
          ${toggle3DBtn}
        </div>
        <!-- Day label -->
        <div class="card-day-header ${isToday ? 'today' : ''} ${day.day_type === 'exam' ? 'day-type-exam' : day.day_type === 'golden_review' ? 'day-type-golden' : ''}">
          <div class="card-day-label-group">
            <span class="card-day-text">${formatDate(day.date, 'card')}</span>
            ${day.day_type === 'exam' ? `<span class="day-type-badge exam-badge">${isAr ? '📝 يوم اختبار' : '📝 Exam Day'}</span>` : ''}
            ${day.day_type === 'golden_review' ? `<span class="day-type-badge golden-badge">${isAr ? '⭐ مراجعة ذهبية' : '⭐ Golden Review'}</span>` : ''}
            ${day.day_type === 'mixed' ? `<span class="day-type-badge review-badge">${isAr ? '🔄 تعلم + مراجعة' : '🔄 Study + Review'}</span>` : ''}
            ${day.day_type === 'light_review' ? `<span class="day-type-badge review-badge">${isAr ? '🏁 مراجعة' : '🏁 Review'}</span>` : ''}
          </div>
          ${isToday ? `<span class="card-today-badge">${isAr ? '⏳ اليوم' : '⏳ Today'}</span>` : ''}
        </div>
        <!-- Sessions as individual 3D cards -->
        <div class="session-cards-list">
          ${sessionCardsHTML}
        </div>
        ${(isAr ? (day.daily_tip_ar || day.daily_tip) : (day.daily_tip_en || day.daily_tip)) ? `<div class="card-tip">💡 ${(isAr ? (day.daily_tip_ar || day.daily_tip) : (day.daily_tip_en || day.daily_tip))}</div>` : ''}
        <!-- Navigation -->
        <div class="card-nav">
          <button class="card-nav-btn" onclick="Planner.prevCard()" ${currentCardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-right"></i> ${isAr ? 'السابق' : 'Prev'}
          </button>
          <button class="card-nav-btn" onclick="Planner.nextCard()" ${currentCardIndex >= allDayCards.length - 1 ? 'disabled' : ''}>
            ${isAr ? 'التالي' : 'Next'} <i class="fas fa-arrow-left"></i>
          </button>
        </div>
      </div>
    `;
  }

  function flipSession(sessionIdx) {
    const card = document.getElementById('session-inner-' + sessionIdx);
    if (card) card.classList.toggle('flipped');
  }

  // Legacy flipCard for backward compatibility
  function flipCard() {
    document.querySelectorAll('.sc-card').forEach(s => s.classList.toggle('flipped'));
  }

  function toggle3D() {
    use3D = !use3D;
    // Unflip all open cards
    document.querySelectorAll('.sc-card').forEach(s => s.classList.remove('flipped'));
    const plan = getCurrentPlan();
    if (plan) renderPlan(plan);
  }

  function nextCard() {
    if (currentCardIndex < allDayCards.length - 1) {
      currentCardIndex++;
      const plan = getCurrentPlan();
      if (plan) renderPlan(plan);
    }
  }

  function prevCard() {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      const plan = getCurrentPlan();
      if (plan) renderPlan(plan);
    }
  }

  function setViewMode(mode) {
    if (cardViewMode === mode) return; // لا تفعل شيء إذا لم يتغير الوضع
    cardViewMode = mode;
    window._lastRenderSig = null; // أجبر re-render لأن الوضع تغير
    const plan = getCurrentPlan();
    if (plan) renderPlan(plan);
  }

  function getCurrentPlan() {
    const key = getActivePlanKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // ─── List View (Show All) ─────────────────────────────────
  function renderListView(plan, isAr) {
    let html = '';
    const todayStr = new Date().toISOString().split('T')[0];

    // Group by weeks
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
        const allDone = day.sessions?.every(s => s.completed);
        const doneCount = (day.sessions || []).filter(s => s.completed).length;
        const totalCount = (day.sessions || []).length;
        let statusClass = 'upcoming', statusText = '';

        if (isToday) { statusClass = 'today'; statusText = isAr ? '⏳ اليوم' : '⏳ Today'; }
        else if (allDone) { statusClass = 'completed'; statusText = isAr ? '✅ منتهي' : '✅ Done'; }
        else if (isPast) { statusClass = 'past'; statusText = ''; }

        // Day type badge (same as Card View)
        const dayType = day.day_type || 'study';
        let dayTypeBadge = '';
        if (dayType === 'exam') dayTypeBadge = `<span class="day-type-badge exam-badge">${isAr ? '📝 يوم اختبار' : '📝 Exam Day'}</span>`;
        else if (dayType === 'golden_review') dayTypeBadge = `<span class="day-type-badge golden-badge">${isAr ? '⭐ مراجعة ذهبية' : '⭐ Golden Review'}</span>`;
        else if (dayType === 'mixed') dayTypeBadge = `<span class="day-type-badge review-badge">${isAr ? '🔄 تعلم + مراجعة' : '🔄 Study + Review'}</span>`;
        else if (dayType === 'light_review') dayTypeBadge = `<span class="day-type-badge review-badge">${isAr ? '🏁 مراجعة' : '🏁 Review'}</span>`;

        // Session progress counter
        const progressText = totalCount > 0 ? `<span class="day-progress-count">${doneCount}/${totalCount} ${formatSessionsCount(totalCount, isAr)}</span>` : '';

        html += `
          <div class="day-section ${isToday ? 'today-section' : ''} ${isPast && !isToday ? 'past-section' : ''}" data-day-type="${dayType}" data-date="${day.date}">
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
          const modeEmoji = session.mode === 'deep' ? '🔴' : session.mode === 'full' ? '🟡' : '🟢';

          const mustKnowList = (!isAr && session.must_know_today_en && session.must_know_today_en.length > 0) ? session.must_know_today_en : session.must_know_today;
          const mustMemList = (!isAr && session.must_memorize_today_en && session.must_memorize_today_en.length > 0) ? session.must_memorize_today_en : session.must_memorize_today;
          const aiNoteStr = isAr ? (session.ai_note_ar || session.ai_note) : (session.ai_note_en || session.ai_note);

          // Snooze button for review sessions (same condition as Card View)
          const showSnooze = (session.mode === 'flash' || dayType === 'golden_review') && !session.completed;

          html += `
            <div class="session-card ${session.completed ? 'completed' : ''}" data-date="${day.date}" data-session="${session.session_number}">
              <div class="session-card-top">
                <span class="session-badge ${diffLabel}">${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
                <span class="session-difficulty">${isAr ? 'الصعوبة: ' + diff + ' من 10' : 'Difficulty: ' + diff + ' of 10'}</span>
              </div>
              <div class="session-course">${session.course_id} — ${session.module_id} (${courseName})</div>
              <div class="session-details">
                ${mustKnowList?.length ? `<span>🎯 ${mustKnowList.join(isAr ? '، ' : ', ')}</span>` : ''}
                ${mustMemList?.length ? `<span>📝 ${mustMemList.join(isAr ? '، ' : ', ')}</span>` : ''}
                ${aiNoteStr ? `<span>💡 ${aiNoteStr}</span>` : ''}
              </div>
              ${session.cross_link_alert?.active ? `<div class="session-link-alert">🔗 ${session.cross_link_alert.message}</div>` : ''}
              <div class="session-actions">
                <button class="session-action-btn session-complete-btn" onclick="Planner.toggleComplete('${day.date}',${session.session_number})">
                  ${session.completed ? (isAr ? '↩ إلغاء' : '↩ Undo') : (isAr ? '✅ أتممت مذاكرة المودل' : '✅ Module Complete')}
                </button>
                ${showSnooze ? `<button class="session-action-btn session-snooze-btn" onclick="Planner.snoozeSession('${day.date}',${session.session_number})">
                  😴 ${isAr ? 'راحة' : 'Snooze'}
                  ${(session._snoozeCount || 0) > 0 ? `<span class="snooze-warning">(${session._snoozeCount}/2)</span>` : ''}
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
      ? (plan.plan_summary?.strategy_description || '')
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
                    <span class="m-id">${session.module_id}</span>
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
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Week Divider */
  .week-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0 10px 0;
    position: relative;
    page-break-after: avoid;
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

  // ─── Session Complete Toggle ──────────────────────────────
  function toggleComplete(dateStr, sessionNum) {
    const key = getActivePlanKey();
    const plan = JSON.parse(localStorage.getItem(key) || '{}');
    const day = plan.days?.find(d => d.date === dateStr);
    if (!day) return;
    const session = day.sessions?.find(s => s.session_number === sessionNum);
    if (!session) return;

    const isNowCompleted = !session.completed;

    // Immediately update memory and storage to prevent race condition
    session.completed = isNowCompleted;
    session.completed_at = isNowCompleted ? new Date().toISOString() : null;
    localStorage.setItem(key, JSON.stringify(plan));

    // Fast-path for undo
    if (!isNowCompleted) {
      renderPlan(plan);
      return;
    }

    // Animate completion
    let animatedEl = null;

    if (cardViewMode === 'cards') {
      const sIdx = day.sessions.findIndex(s => s.session_number === sessionNum);
      animatedEl = document.getElementById('session-inner-' + sIdx);
    } else {
      animatedEl = document.querySelector(`.session-card[data-date="${dateStr}"][data-session="${sessionNum}"]`);
    }

    if (animatedEl) {
      animatedEl.classList.add('completed-animate');
      setTimeout(() => {
        // Re-fetch in case other sessions were toggled during the 600ms
        const updatedPlan = JSON.parse(localStorage.getItem(key) || '{}');
        renderPlan(updatedPlan);
      }, 600);
    } else {
      renderPlan(plan);
    }
  }

  // ─── Continue / New Plan ──────────────────────────────────
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
        userConfig = { ...userConfig, ...savedConfig }; // merge to keep defaults
        hideError();
        hideInfo();
        // Jump straight to step 3 so busy_dates are visible immediately
        showStep(3);
        return;
      } catch (e) { /* corrupted */ }
    }
    showStep(1);
  }

  // ─── Error / Info Handling ─────────────────────────────────
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

  // ─── Today Banner Helper (called from main index.html) ──────
  function getTodayBannerData() {
    // Check all plan keys
    const keys = ['study_plan_midterm', 'study_plan_final', 'study_plan_general'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const plan = JSON.parse(raw);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDay = plan.days?.find(d => d.date === todayStr);
        if (!todayDay) continue;
        const sessions = todayDay.sessions || [];
        const total = sessions.length;
        const done = sessions.filter(s => s.completed).length;
        const allDays = plan.days || [];
        const totalSessions = allDays.reduce((sum, d) => sum + (d.sessions?.length || 0), 0);
        const doneSessions = allDays.reduce((sum, d) => sum + (d.sessions?.filter(s => s.completed).length || 0), 0);
        return {
          hasPlan: true,
          todaySessions: total,
          todaySessionsFormatted: formatSessionsCount(total, lang() === 'ar'),
          todayDone: done,
          totalSessions,
          doneSessions,
          progressPct: totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0,
          planType: plan.plan_type,
          planUrl: './planner/index.html'
        };
      } catch (e) { continue; }
    }
    return { hasPlan: false };
  }

  // ─── Snooze System (Phase 2) ──────────────────────────────
  function findNextAvailableDay(plan, afterDate, beforeExamDate) {
    const sessionsPerDay = plan.config?.daily_sessions || 2;
    // Allow +1 over daily limit for snoozed sessions (better than failing)
    const maxWithSnooze = sessionsPerDay + 1;
    const afterD = new Date(afterDate + 'T00:00:00');
    const beforeD = beforeExamDate ? new Date(beforeExamDate + 'T00:00:00') : null;

    // Pass 1: find a day with room under normal limit
    for (const day of plan.days) {
      const dayD = new Date(day.date + 'T00:00:00');
      if (dayD <= afterD) continue;
      if (beforeD && dayD >= beforeD) continue;
      if (day.day_type === 'exam') continue;
      if ((day.sessions || []).length < sessionsPerDay) return day;
    }
    // Pass 2: allow +1 overflow
    for (const day of plan.days) {
      const dayD = new Date(day.date + 'T00:00:00');
      if (dayD <= afterD) continue;
      if (beforeD && dayD >= beforeD) continue;
      if (day.day_type === 'exam') continue;
      if ((day.sessions || []).length < maxWithSnooze) return day;
    }
    // Pass 3: allow any day after exam too (last resort — better than failing)
    for (const day of plan.days) {
      const dayD = new Date(day.date + 'T00:00:00');
      if (dayD <= afterD) continue;
      if (day.day_type === 'exam') continue;
      if ((day.sessions || []).length < maxWithSnooze) return day;
    }
    return null;
  }

  function snoozeSession(date, sessionNum) {
    const plan = getCurrentPlan();
    if (!plan) return;
    const isAr = lang() === 'ar';

    const day = plan.days.find(d => d.date === date);
    if (!day) return;
    const session = day.sessions.find(s => s.session_number === sessionNum);
    if (!session) return;

    // Snooze limit check
    session._snoozeCount = (session._snoozeCount || 0) + 1;
    if (session._snoozeCount > 2) {
      alert(isAr
        ? '⚠️ لا يمكن تأجيل هذه الجلسة أكثر — الحد الأقصى تأجيلتان!'
        : '⚠️ Cannot snooze this session again — max 2 snoozes!');
      session._snoozeCount = 2;
      return;
    }

    // Find exam date for this course
    const examDate = plan.config?.courses?.[session.course_id]?.exam_date || null;

    // Find next available day
    const targetDay = findNextAvailableDay(plan, date, examDate);
    if (!targetDay) {
      alert(isAr
        ? '⚠️ لا يوجد يوم متاح لنقل الجلسة — كل الأيام ممتلئة قبل الاختبار!'
        : '⚠️ No available day to move this session — all days are full before the exam!');
      session._snoozeCount--;
      return;
    }

    // Remove from current day
    day.sessions = day.sessions.filter(s => s.session_number !== sessionNum);

    // Re-number remaining sessions
    day.sessions.forEach((s, idx) => s.session_number = idx + 1);

    // Add to target day
    const newSession = { ...session, session_number: targetDay.sessions.length + 1 };
    targetDay.sessions.push(newSession);

    // Remove empty days (but keep exam days)
    plan.days = plan.days.filter(d => (d.sessions && d.sessions.length > 0) || d.day_type === 'exam');

    // Save and re-render
    const storageKey = getPlanStorageKey(plan.plan_type);
    localStorage.setItem(storageKey, JSON.stringify(plan));
    renderPlan(plan);

    showInfo(isAr
      ? `😴 تم تأجيل الجلسة إلى ${formatDate(targetDay.date, 'card')}`
      : `😴 Session snoozed to ${formatDate(targetDay.date, 'card')}`);
  }

  // ─── Public API ───────────────────────────────────────────
  window.Planner = {
    selectPlanType, nextStep, prevStep, toggleCourse, setExamDate,
    toggleModule, setRating, setConfig, toggleRestDay, addBusyDate,
    removeBusyDate, onGeneratePlan, generateLocalPlan, toggleComplete,
    continuePlan, newPlan, regenerate, flipCard, flipSession, nextCard, prevCard,
    setViewMode, exportPDF, buildPrintTable, toggle3D, getTodayBannerData,
    snoozeSession
  };

  // ─── Boot ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('garden:languageChanged', (e) => {
    const newLang = e.detail?.lang;
    if (!newLang || newLang === window._plannerLastLang) return;
    window._plannerLastLang = newLang;
    window._lastRenderSig = null;
    if (currentStep === 2) renderCourseSelection();
    if (currentStep === 3) renderConfigOptions();
    if (currentStep === 4) {
      const plan = getCurrentPlan();
      if (plan) renderPlan(plan);
    }
  });

})();
