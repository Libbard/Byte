/* ═══════════════════════════════════════════════════════════════
   Digital Garden · planner.js v2.1
   Intelligent Study Planner — 4-step wizard + 3D card view
   ═══════════════════════════════════════════════════════════════ */

; (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────
  const CLOUDFLARE_WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';
  const CURRICULUM_MAP_URL = '../data/curriculum_map.json';
  const MAX_TOKENS = 32768; // ★ FIX: was 8192 — truncated plans to ~12 sessions. 32K allows full 28+ day plans

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

  // ─── Local Date Helper ────────────────────────────────────
  // Returns YYYY-MM-DD using LOCAL timezone (avoids UTC-shift bug where
  // new Date().toISOString() returns yesterday for GMT+3 users before 3am)
  function getLocalTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

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
      // Restore start-date input: prefer userConfig.start_date (saved), fallback to local today
      const startInput = document.getElementById('start-date-input');
      if (startInput) {
        const restored = userConfig.start_date || getLocalTodayStr();
        startInput.value = restored;
        userConfig.start_date = restored;
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
    let totalDays = earliestExam ? Math.max(1, Math.ceil((earliestExam - today) / 86400000)) : 90;

    // Count available days (exclude rest days and busy dates)
    let availDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      if (userConfig.rest_days.includes(dayName)) continue;
      // ★ FIX: use local date string instead of toISOString to avoid UTC shift
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
مبادئك:
1. الترتيب التسلسلي إلزامي: ابدأ من M01 ثم M02 ثم M03 لكل مادة — لا تقفز! M01 دائماً أساسية.
2. التبديل الذكي بين المواد (interleaving): لا تُكمّل مادة كاملة قبل الأخرى.
3. أولوية المتطلبات (prerequisites): لا تدرس موضوعاً قبل متطلباته.
4. التصاعد التدريجي: ابدأ بالسهل، تصاعد تدريجياً.
5. المراجعة المتباعدة: راجع كل وحدة بعد 1 يوم، ثم 3 أيام، ثم 7 أيام.
6. الواقعية: احترم عدد الجلسات والوقت المتاح بدقة.
7. يوم قبل الامتحان = مراجعة خفيفة فقط (Flash Mode).
8. priority تحدد mode الدراسة (deep/full/flash) وليس ترتيب المودلات.
أجب بـ JSON نظيف فقط.`;

  function buildPrompt() {
    const isAr = lang() === 'ar';
    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    const dailySessions = userConfig.daily_sessions || 2;
    const mps = userConfig.modules_per_session || 1;

    // ── A. استخراج بيانات المناهج الغنية (كل المعلومات الهيكلية) ──
    // DeepSeek input limit = 64K tokens (~256KB) — بياناتنا ~15KB = مريحة جداً
    // نُرسل كل شيء يحتاجه AI لاتخاذ قرارات ذكية:
    //   ✅ prerequisites (أي مودل يعتمد على أي مودل)
    //   ✅ cross_course_links (مواضيع مترابطة بين المواد)
    //   ✅ topic types (concept/algorithm/theorem)
    //   ✅ difficulty breakdown (كل أبعاد الصعوبة)
    //   ✅ common_mistakes (للملاحظات الذكية)
    //   ❌ must_know/must_memorize TEXT → نحقنها محلياً بعد الاستلام (توفير مساحة الإخراج)
    const richCurriculum = {};
    for (const [cid, cfg] of activeCourses) {
      const courseData = curriculumMap.courses[cid];
      if (!courseData) continue;
      richCurriculum[cid] = {
        name: courseData.name_en,
        modules: {}
      };
      for (const m of cfg.included_modules) {
        const mod = courseData.modules[m];
        if (!mod) continue;

        // Collect ALL structural data from topics
        const prereqs = new Set();      // module-level prerequisites
        const unlocks = new Set();      // what this module enables
        const crossLinks = [];          // cross-course connections
        const topicTypes = [];          // concept, algorithm, theorem...
        const commonMistakes = [];      // for AI notes
        let maxConceptual = 0, maxExamApp = 0, networkEffect = 0;

        for (const t of (mod.topics || [])) {
          // Prerequisites: convert topic_id to module_id
          for (const prereqTopic of (t.prerequisites || [])) {
            // Extract module ID from topic ID: "CS350_M02_T01" → "M02"
            const match = prereqTopic.match(new RegExp(`^${cid}_(M\\d+)_`));
            if (match && match[1] !== m) prereqs.add(match[1]);
          }
          // Unlocks
          for (const unlockTopic of (t.unlocks || [])) {
            const match = unlockTopic.match(new RegExp(`^${cid}_(M\\d+)_`));
            if (match && match[1] !== m) unlocks.add(match[1]);
          }
          // Cross-course links
          for (const link of (t.cross_course_links || [])) {
            if (typeof link === 'string') {
              crossLinks.push(link);
            } else if (link.topic_id) {
              crossLinks.push(link.topic_id);
            }
          }
          // Topic types
          if (t.type && !topicTypes.includes(t.type)) topicTypes.push(t.type);
          // Difficulty dimensions
          if (t.difficulty) {
            maxConceptual = Math.max(maxConceptual, t.difficulty.conceptual_abstraction || 0);
            maxExamApp = Math.max(maxExamApp, t.difficulty.exam_application || 0);
            networkEffect = Math.max(networkEffect, t.difficulty.network_effect || 0);
          }
          // Common mistakes (first one per topic, limited)
          if (t.common_mistakes?.[0] && commonMistakes.length < 2) {
            commonMistakes.push(t.common_mistakes[0]);
          }
        }

        richCurriculum[cid].modules[m] = {
          title: mod.title_en,
          diff: mod.module_difficulty,
          hours: mod.study_hours_estimate,
          types: topicTypes,                              // ["concept","algorithm"]
          prereqs: [...prereqs].sort(),                   // ["M01","M02"] — modules that must come before
          unlocks: [...unlocks].sort(),                   // ["M04","M05"] — modules that depend on this
          cross_links: crossLinks,                        // ["CS352_M09_T01"] — related topics in other courses
          conceptual: maxConceptual,                      // 0-3: how abstract
          exam_app: maxExamApp,                           // 0-2: how hard in exams
          network: networkEffect,                         // 0-1: impacts other topics
          mistakes: commonMistakes                        // ["خطأ شائع 1"] — for AI notes
        };
      }
    }

    // ── Cross-course clusters (مجموعات المفاهيم المشتركة) ──
    // These tell the AI which topics from DIFFERENT courses should be studied together
    const relevantClusters = [];
    if (curriculumMap.cross_course_clusters) {
      const activeCids = new Set(activeCourses.map(([cid]) => cid));
      for (const cluster of curriculumMap.cross_course_clusters) {
        // Only include clusters that involve active courses
        const relevantTopics = cluster.topics.filter(t => {
          const topicCourse = t.split('_')[0];
          return activeCids.has(topicCourse);
        });
        if (relevantTopics.length >= 2) {
          relevantClusters.push({
            name: cluster.cluster_name_en || cluster.cluster_name,
            topics: relevantTopics,
            order: cluster.study_order || relevantTopics,
            tip: cluster.study_tip_en || cluster.study_tip
          });
        }
      }
    }

    // Use the user-selected start date, NOT the raw UTC "today" which causes
    // off-by-one errors for GMT+3 users and ignores user's chosen start date
    const today = userConfig.start_date || getLocalTodayStr();
    const todayDate = new Date(today + 'T00:00:00');
    todayDate.setHours(0, 0, 0, 0);

    // Find earliest and latest exam dates
    let earliestExam = null;
    let latestExam = null;
    const examDates = {}; // Store exam dates per course
    if (userConfig.plan_type !== 'general') {
      for (const [courseId, cfg] of activeCourses) {
        if (cfg.exam_date) {
          const d = new Date(cfg.exam_date + 'T00:00:00');
          examDates[courseId] = cfg.exam_date; // Store string for prompt
          if (!earliestExam || d < earliestExam) earliestExam = d;
          if (!latestExam || d > latestExam) latestExam = d;
        }
      }
    }

    // Determine the full planning range
    // If no exams, plan for 14 days from start_date.
    // If exams, plan from start_date until the latest exam date + 7 days (for buffer).
    let endDate = new Date(todayDate);
    if (latestExam) {
      endDate = new Date(latestExam);
      endDate.setDate(endDate.getDate() + 7); // Add a week buffer after the last exam
    } else {
      endDate.setDate(endDate.getDate() + 90); // Default 90 days if no exams (semester length)
    }

    const totalPlanningDays = Math.max(1, Math.ceil((endDate - todayDate) / 86400000));

    // Calculate actual available dates for the AI
    // ★ FIX: Exclude exam dates — they are NOT study days
    const examDateStrings = new Set(Object.values(examDates)); // e.g. {"2026-04-08", "2026-04-09", ...}
    const availableDates = [];
    for (let i = 0; i < totalPlanningDays; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() + i);
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (userConfig.rest_days.includes(dayName)) continue;
      if (userConfig.busy_dates.includes(dateStr)) continue;
      if (examDateStrings.has(dateStr)) continue; // ★ Exam dates are NOT available for study

      availableDates.push(dateStr);
    }

    // ★ Build explicit exam dates section for the prompt
    const examDatesList = Object.entries(examDates)
      .map(([cid, date]) => `  ${date} → ${cid} (${curriculumMap.courses[cid]?.name_en || cid})`)
      .sort()
      .join('\n');

    // ── B. بناء ملخص تفصيلي لكل مادة مع أولوية كل وحدة ──
    // ★ FIX: عرض الوحدات بالترتيب التسلسلي (M01, M02, M03...) وليس حسب الأولوية
    const coursesDetail = activeCourses.map(([cid, cfg]) => {
      const c = curriculumMap.courses[cid];
      const courseName = c?.name_en || cid;
      const examDate = examDates[cid] || 'none';
      const ratingWeight = { not_studied: 1.0, weak: 0.7, good: 0.4, excellent: 0.15 };
      // ★ Sort modules naturally (M01 < M02 < M03) instead of by priority
      const sortedModules = [...cfg.included_modules].sort();
      const moduleSummaries = sortedModules.map((m, idx) => {
        const mod = c?.modules[m];
        const rating = cfg.self_rating[m] || 'not_studied';
        const diff = mod?.module_difficulty || 5;
        const hours = mod?.study_hours_estimate || 2;
        const priority = Math.round(((ratingWeight[rating] || 1.0) * 0.65 + (diff / 10) * 0.35) * 10) / 10;
        const modeHint = (rating === 'not_studied' || rating === 'weak') ? 'deep' : rating === 'good' ? 'full' : 'flash';
        return `  ${m}(order=${idx + 1},diff=${diff},rating=${rating},priority=${priority},mode=${modeHint},est_hours=${hours})`;
      }).join('\n');
      return `${cid} — ${courseName} [exam_date=${examDate}]\nStudy order: M01→M02→M03... (sequential, mandatory)\n${moduleSummaries}`;
    }).join('\n\n');

    // Build dynamic JSON example reflecting ACTUAL daily_sessions count
    // ★ FIX: COMPACT output format — no bilingual fields, no must_know/memorize
    // These fields are ALREADY in curriculum_map.json — we inject them locally after parsing
    // This reduces output size from ~650 tokens/day to ~150 tokens/day = 4x savings!
    const exampleSessions = [];
    for (let s = 1; s <= dailySessions; s++) {
      const exModuleId = mps > 1
        ? `M0${s} + M0${s + 1}`
        : `M0${s}`;
      exampleSessions.push(
        `{"sn":${s},"cid":"CS350","mid":"${exModuleId}","mode":"deep","diff":7,"note":"ملاحظة مختصرة"}`
      );
    }
    const exampleSessionsStr = exampleSessions.join(',');

    // Determine module grouping instruction
    const moduleGroupingNote = mps > 1
      ? `- كل جلسة تضم ${mps} وحدات مدمجة → اجعل module_id سلسلة مثل "M01 + M02"`
      : mps < 1
        ? `- كل وحدة تُقسَّم على ${Math.round(1 / mps)} جلسات → أضف تسمية الجزء مثل "M01 (1/2)"`
        : `- كل جلسة تغطي وحدة واحدة فقط`;

    // بناء سطر التواريخ المتاحة الفعلية (بحد أقصى 90 تاريخ لتجنب overflow)
    const availableDatesStr = availableDates.length > 0
      ? availableDates.slice(0, 90).join(', ')
      : 'لم يتم تحديد نطاق زمني';

    // نطاق الجدول الزمني للعرض
    // ★ FIX: use local date helper instead of toISOString
    function _toLocalStr(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const scheduleEndStr = latestExam
      ? _toLocalStr(latestExam)
      : _toLocalStr(new Date(new Date(today + 'T00:00:00').getTime() + 90 * 86400000));

    return `## مهمتك
أنشئ جدول مذاكرة ذكياً يمتد من تاريخ البدء حتى آخر اختبار، مع مراعاة أولوية كل وحدة واختلاف مواعيد الاختبارات.

## إعدادات الطالب
- نوع الجدول: ${userConfig.plan_type}
- تاريخ البدء: ${today}
- تاريخ آخر اختبار: ${scheduleEndStr}
- الجلسات اليومية المسموحة: ${dailySessions} (الحد الأقصى المطلق — لا تتجاوزه)
- وحدات لكل جلسة: ${mps}

## ⚠️ التواريخ المتاحة للدراسة (يُحظر وضع جلسات خارجها)
${availableDatesStr}
الأيام الغائبة هي أيام راحة (${userConfig.rest_days.join(', ')}) أو أيام مشغولة — لا تضع فيها أي جلسات.

## 📝 تواريخ الاختبارات الفعلية (أيام اختبار — لا تضع فيها جلسات دراسة!)
${examDatesList || 'لا يوجد اختبارات محددة'}
⚠️ هذه التواريخ هي أيام الاختبار الفعلية. لا تُنشئ لها أي جلسات في الناتج. سنضيف بطاقة الاختبار تلقائياً.

## المواد وتواريخ الاختبارات وأولوية كل وحدة
(priority: 1.0=الأعلى أولوية | mode: deep=من الصفر, full=يحتاج تعزيز, flash=مراجعة سريعة)
(est_hours=الوقت التقديري للدراسة)

${coursesDetail}

## قواعد إلزامية
⚠️ كل يوم دراسي = ${dailySessions} جلسة بالضبط — لا أكثر ولا أقل.
⚠️ لا تضع جلسات لمادة بعد تاريخ اختبارها. لا تضع أي جلسات في يوم الاختبار نفسه (أيام الاختبار مذكورة أعلاه).
⚠️ المراجعة الذهبية: اليوم الذي يسبق الاختبار مباشرة (وليس يوم الاختبار!) = day_type=golden_review, mode=flash لمادة الاختبار القادم.
⚠️ بعد الانتهاء من كل وحدات مادة → خصص ما تبقى من أيام قبل اختبارها للمراجعة.
⚠️ الترتيب التسلسلي إلزامي: ابدأ دائماً من M01 ثم M02 ثم M03... لكل مادة. الوحدة M01 أساسية لفهم بقية المنهج — لا تقفز لوحدات متقدمة!
⚠️ priority تحدد الـ mode (deep/full/flash) وليس ترتيب الدراسة. حتى لو M01 تقييمها "excellent"، يجب مراجعتها (flash) قبل M02 لأنها أساس.
⚠️ نوّع بين المواد يومياً (interleaving) مع الحفاظ على التسلسل داخل كل مادة.
⚠️ أضف مراجعة متباعدة (spaced review): راجع كل وحدة بعد يوم واحد، ثم 3 أيام، ثم 7 أيام من دراستها.
${moduleGroupingNote}

## بيانات المناهج الهيكلية (prerequisites + cross-links + difficulty)
⚠️ استخدم هذه البيانات لاتخاذ قرارات الجدولة. لا تضمّنها في الناتج.
⚠️ prereqs = وحدات يجب دراستها قبل هذه الوحدة. unlocks = وحدات تعتمد على هذه الوحدة.
⚠️ cross_links = مواضيع في مواد أخرى مرتبطة — حاول جدولتها في نفس الأسبوع.
⚠️ types: concept=فهم, algorithm=تطبيق+تمرين, theorem=إثبات, formula=حفظ+تطبيق
${JSON.stringify(richCurriculum, null, 0)}

${relevantClusters.length > 0 ? `## مجموعات المفاهيم المشتركة بين المواد
هذه مواضيع من مواد مختلفة يُفضل دراستها في نفس الأسبوع لأنها تُكمل بعضها:
${JSON.stringify(relevantClusters, null, 0)}` : ''}

## الناتج المطلوب (مضغوط — استخدم مفاتيح قصيرة لتوفير المساحة)
أنتج JSON نظيف فقط (بدون أي نص خارج الـ JSON).
⚠️ لا تُضمّن must_know أو must_memorize في الناتج — سنضيفها تلقائياً من قاعدة البيانات.
⚠️ استخدم المفاتيح القصيرة: sn=session_number, cid=course_id, mid=module_id, diff=difficulty_avg
{"plan_summary":{"total_days":N,"total_sessions":N,"strategy":"وصف مختصر","weeks":[{"wn":1,"theme":"..."}]},"days":[{"date":"YYYY-MM-DD","wn":1,"type":"study","sessions":[${exampleSessionsStr}],"tip":"..."}]}

تذكر: استخدم فقط التواريخ من القائمة المتاحة أعلاه. كل يوم دراسي = ${dailySessions} جلسات بالضبط. أنشئ أيام لكل التواريخ المتاحة — لا تحذف أياً منها!`;
  }

  // ── Expand Compact AI Plan → Full Format ──────────────────
  // The AI returns a compact format to save tokens:
  //   {sn, cid, mid, mode, diff, note} per session
  // We expand to the full format the renderer expects:
  //   {session_number, course_id, module_id, mode, difficulty_avg, ...}
  // And inject must_know/must_memorize from curriculum_map
  function expandCompactAIPlan(planData) {
    if (!planData?.days) return planData;
    const isAr = lang() === 'ar';

    // Expand plan_summary
    if (planData.plan_summary) {
      const ps = planData.plan_summary;
      if (!ps.strategy_description && ps.strategy) {
        ps.strategy_description = ps.strategy;
        ps.strategy_description_ar = ps.strategy;
        ps.strategy_description_en = ps.strategy;
      }
      if (ps.weeks) {
        ps.weeks = ps.weeks.map(w => ({
          week_number: w.wn || w.week_number || 1,
          theme: w.theme || '',
          theme_en: w.theme_en || w.theme || ''
        }));
      }
    }

    let wasTruncated = false;

    for (const day of planData.days) {
      // Expand day-level compact keys
      if (!day.week_number && day.wn) day.week_number = day.wn;
      if (!day.day_type && day.type) day.day_type = day.type;
      if (!day.day_label) day.day_label = formatDate(day.date, 'card');
      if (!day.daily_tip_ar && day.tip) { day.daily_tip_ar = day.tip; day.daily_tip_en = day.tip; }
      if (!day.daily_tip_ar) { day.daily_tip_ar = ''; day.daily_tip_en = ''; }

      if (!day.sessions || day.sessions.length === 0) {
        day.sessions = day.sessions || []; // ★ FIX: ensure sessions is always an array
        wasTruncated = true;
        continue;
      }

      day.sessions = day.sessions.map(s => {
        // Expand compact keys → full keys
        const session = {
          session_number: s.sn || s.session_number || 1,
          course_id: s.cid || s.course_id || '',
          module_id: s.mid || s.module_id || '',
          mode: s.mode || 'deep',
          difficulty_avg: s.diff || s.difficulty_avg || 5,
          is_critical: s.is_critical || (s.diff >= 7),
          ai_note_ar: s.note || s.ai_note_ar || s.ai_note || '',
          ai_note_en: s.note_en || s.ai_note_en || s.ai_note || s.note || '',
          must_know_today: s.must_know_today || [],
          must_know_today_en: s.must_know_today_en || [],
          must_memorize_today: s.must_memorize_today || [],
          must_memorize_today_en: s.must_memorize_today_en || [],
          completed: false,
          _snoozeCount: 0
        };

        // ★ Inject must_know/must_memorize from curriculum_map if not provided by AI
        if (session.must_know_today.length === 0 && curriculumMap?.courses) {
          const course = curriculumMap.courses[session.course_id];
          if (course) {
            // Handle compound module IDs like "M01 + M02"
            const modIds = session.module_id.split(/\s*\+\s*/).map(s => s.trim().replace(/\s*\(.*\)/, ''));
            for (const mid of modIds) {
              const mod = course.modules[mid];
              if (mod?.topics) {
                for (const t of mod.topics) {
                  if (t.must_know && session.must_know_today.length < 3)
                    session.must_know_today.push(...t.must_know.slice(0, 1));
                  if (t.must_know_en && session.must_know_today_en.length < 3)
                    session.must_know_today_en.push(...t.must_know_en.slice(0, 1));
                  if (t.must_memorize && session.must_memorize_today.length < 2)
                    session.must_memorize_today.push(...t.must_memorize.slice(0, 1));
                  if (t.must_memorize_en && session.must_memorize_today_en.length < 2)
                    session.must_memorize_today_en.push(...t.must_memorize_en.slice(0, 1));
                }
              }
            }
          }
        }

        return session;
      });
    }

    planData._wasTruncated = wasTruncated;
    return planData;
  }

  // ── Inject Missing Exam Days (Safety Net) ────────────────
  // After AI generates the plan, ensure ALL exam dates from userConfig
  // exist as proper exam day cards with the correct course name.
  // This fixes: AI forgetting exams, merging exams, or misplacing them.
  function injectExamDays(planData) {
    if (!planData?.days || !planData.config?.courses) return planData;
    const isAr = lang() === 'ar';

    // Collect all exam dates from config
    const examEntries = []; // [{cid, date, name, name_en}]
    for (const [cid, cfg] of Object.entries(planData.config.courses)) {
      if (!cfg.active || !cfg.exam_date) continue;
      const course = curriculumMap?.courses?.[cid];
      examEntries.push({
        cid,
        date: cfg.exam_date,
        name: course?.name || cid,
        name_en: course?.name_en || cid
      });
    }
    if (examEntries.length === 0) return planData;

    // Group exams by date (multiple exams can be on the same day)
    const examsByDate = {};
    for (const e of examEntries) {
      if (!examsByDate[e.date]) examsByDate[e.date] = [];
      examsByDate[e.date].push(e);
    }

    let modified = false;

    for (const [date, exams] of Object.entries(examsByDate)) {
      // Check if this date already exists as a proper exam day
      const existingDay = planData.days.find(d => d.date === date);

      if (existingDay) {
        // Day exists — ensure it's marked as exam with proper sessions
        if (existingDay.day_type !== 'exam') {
          // AI put study sessions on exam day! Replace with exam card
          console.warn(`⚠️ Exam day ${date} had type "${existingDay.day_type}" — converting to exam`);
          existingDay.day_type = 'exam';
          modified = true;
        }

        // Ensure exam sessions exist with correct course names
        const existingExamCids = new Set(
          (existingDay.sessions || [])
            .filter(s => s.mode === 'exam')
            .map(s => s.course_id)
        );

        const missingSessions = exams.filter(e => !existingExamCids.has(e.cid));
        if (missingSessions.length > 0 || !existingDay.sessions || existingDay.sessions.length === 0) {
          existingDay.sessions = exams.map((e, idx) => ({
            session_number: idx + 1,
            course_id: e.cid,
            module_id: isAr ? 'اختبار' : 'Exam',
            mode: 'exam',
            difficulty_avg: 10,
            is_critical: false,
            ai_note_ar: `📝 اختبار ${e.name} — بالتوفيق!`,
            ai_note_en: `📝 ${e.name_en} Exam — Good luck!`,
            must_know_today: [], must_know_today_en: [],
            must_memorize_today: [], must_memorize_today_en: [],
            completed: false
          }));
          existingDay.daily_tip_ar = '📝 يوم اختبار — توكل على الله وثق بنفسك!';
          existingDay.daily_tip_en = '📝 Exam day — trust yourself and do your best!';
          modified = true;
        }
      } else {
        // Day doesn't exist — inject it
        console.warn(`⚠️ Exam day ${date} was missing from plan — injecting`);
        const firstDate = planData.days[0]?.date || date;
        const weekNum = Math.floor(
          (new Date(date + 'T00:00:00') - new Date(firstDate + 'T00:00:00')) / (7 * 86400000)
        ) + 1;

        planData.days.push({
          date,
          day_label: formatDate(date, 'card'),
          week_number: weekNum,
          day_type: 'exam',
          sessions: exams.map((e, idx) => ({
            session_number: idx + 1,
            course_id: e.cid,
            module_id: isAr ? 'اختبار' : 'Exam',
            mode: 'exam',
            difficulty_avg: 10,
            is_critical: false,
            ai_note_ar: `📝 اختبار ${e.name} — بالتوفيق!`,
            ai_note_en: `📝 ${e.name_en} Exam — Good luck!`,
            must_know_today: [], must_know_today_en: [],
            must_memorize_today: [], must_memorize_today_en: [],
            completed: false
          })),
          daily_tip_ar: '📝 يوم اختبار — توكل على الله وثق بنفسك!',
          daily_tip_en: '📝 Exam day — trust yourself and do your best!'
        });
        modified = true;
      }
    }

    // Also remove any study sessions that fall ON or AFTER the exam date for each course
    for (const { cid, date } of examEntries) {
      for (const day of planData.days) {
        if (day.date >= date && day.day_type !== 'exam') {
          const before = (day.sessions || []).length;
          day.sessions = (day.sessions || []).filter(s => s.course_id !== cid || s.mode === 'exam');
          if (day.sessions.length !== before) {
            day.sessions.forEach((s, idx) => s.session_number = idx + 1);
            modified = true;
          }
        }
      }
    }

    if (modified) {
      // Re-sort days by date
      planData.days.sort((a, b) => a.date.localeCompare(b.date));
      // Remove empty non-exam days
      planData.days = planData.days.filter(d =>
        (d.sessions && d.sessions.length > 0) || d.day_type === 'exam'
      );
    }

    return planData;
  }

  // ── Complete Truncated Plan ──────────────────────────────
  // When the AI response is cut short (finish_reason=length), the plan
  // has fewer days than expected. We detect which dates are missing
  // and generate the remaining days using the local smart generator.
  function completeTruncatedPlan(planData) {
    if (!planData?.days) return planData;
    const isAr = lang() === 'ar';

    // Build set of dates already covered by AI
    const coveredDates = new Set(planData.days.map(d => d.date));

    // Generate a complete local plan
    const localPlan = generateSmartLocalPlan();

    // Find days in local plan that are NOT in AI plan
    const missingDays = (localPlan.days || []).filter(d => !coveredDates.has(d.date));

    if (missingDays.length > 0) {
      console.log(`Completing plan: AI provided ${planData.days.length} days, adding ${missingDays.length} local days`);

      // Append missing days and sort by date
      planData.days = [...planData.days, ...missingDays].sort((a, b) => a.date.localeCompare(b.date));

      // Update summary
      if (planData.plan_summary) {
        planData.plan_summary.total_days = planData.days.length;
        planData.plan_summary.total_sessions = planData.days.reduce(
          (sum, d) => sum + (d.sessions?.length || 0), 0
        );
        const desc = isAr
          ? 'جدول مدمج: AI + استكمال ذكي محلي (بسبب بتر استجابة الذكاء الاصطناعي)'
          : 'Hybrid plan: AI + smart local completion (AI response was truncated)';
        planData.plan_summary.strategy_description = desc;
        planData.plan_summary.strategy_description_ar = desc;
      }
    }

    // Recalculate week numbers
    if (planData.days.length > 0) {
      const firstDate = new Date(planData.days[0].date + 'T00:00:00');
      planData.days.forEach(d => {
        const dayDate = new Date(d.date + 'T00:00:00');
        d.week_number = Math.floor((dayDate - firstDate) / (7 * 86400000)) + 1;
      });
    }

    return planData;
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
    const startInput = document.getElementById('start-date-input');
    userConfig.start_date = (startInput && startInput.value) ? startInput.value : getLocalTodayStr();

    hideError();
    hideInfo();
    showStep(4);
    const loadingScreen = document.getElementById('loading-screen');
    const planContent = document.getElementById('plan-content');
    loadingScreen.classList.add('active');
    planContent.style.display = 'none';

    const isAr = lang() === 'ar';
    cleanupLoadingIntervals();
    const advanceLoading = setupInteractiveLoading(isAr);
    advanceLoading(0, 10);

    try {
      const prompt = buildPrompt();
      advanceLoading(1, 20);

      // ═══════════════════════════════════════════════════════════
      // Multi-Chunk AI Generation System
      // ═══════════════════════════════════════════════════════════
      // DeepSeek has a hard 8192 output token limit. For plans with
      // 20+ days, a single call will be truncated. We:
      //  1. Make first call → get partial plan
      //  2. Detect incompleteness (missing dates vs expected)
      //  3. Continue by sending partial result + "continue from date X"
      //  4. Repeat up to MAX_CHUNKS times
      //  5. Show live progress to user during each chunk

      const MAX_CHUNKS = 6; // Safety limit
      const allDays = [];   // Accumulated days across all chunks
      let planSummary = null;
      let chunkCount = 0;
      let lastCoveredDate = null;

      // Calculate expected available dates for completeness checking
      const expectedDates = getExpectedAvailableDates();

      // ── First chunk: full prompt ──
      const systemMsg = { role: 'system', content: DEEPSEEK_SYSTEM };
      const userMsg = { role: 'user', content: prompt };
      let messages = [systemMsg, userMsg];

      while (chunkCount < MAX_CHUNKS) {
        chunkCount++;
        const chunkLabel = chunkCount === 1
          ? (isAr ? 'إنشاء الجدول...' : 'Generating plan...')
          : (isAr ? `استكمال الجزء ${chunkCount}...` : `Continuing chunk ${chunkCount}...`);

        // Update loading screen with chunk info
        updateChunkProgress(chunkCount, MAX_CHUNKS, chunkLabel, isAr);
        const pct = 20 + Math.round((chunkCount / (MAX_CHUNKS + 1)) * 60);
        advanceLoading(2, pct);

        console.log(`🔄 Chunk ${chunkCount}: sending request...`);

        // API call with timeout
        const TIMEOUT_MS = 180000; // 3 min per chunk
        const controller = new AbortController();
        const timeoutId = setTimeout(() =>
          controller.abort(new DOMException('Chunk timeout', 'TimeoutError')), TIMEOUT_MS);

        const response = await fetch(CLOUDFLARE_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            max_tokens: 8192,
            temperature: 0.3
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          console.error(`Chunk ${chunkCount} API error:`, response.status, errBody.substring(0, 200));
          throw new Error('API error: ' + response.status);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.message_ar || data.message_en || data.error);

        const text = data.text || data.choices?.[0]?.message?.content || '';
        const finishReason = data.finish_reason || data.choices?.[0]?.finish_reason || 'unknown';
        const outputTokens = data.usage?.output || 0;
        console.log(`✅ Chunk ${chunkCount}: ${text.length} chars, ${outputTokens} tokens, finish=${finishReason}`);

        // Parse the chunk
        let chunkData = tryParseJSON(text);
        if (!chunkData) {
          console.error(`Chunk ${chunkCount} parse failed. First 300 chars:`, text.substring(0, 300));
          if (allDays.length > 0) break; // Use what we have
          throw new Error('Invalid JSON from AI');
        }

        // Expand compact format and inject curriculum data
        chunkData = expandCompactAIPlan(chunkData);

        // Collect days and summary
        if (chunkData.plan_summary && !planSummary) {
          planSummary = chunkData.plan_summary;
        }
        if (chunkData.days && chunkData.days.length > 0) {
          // Deduplicate: only add days not already covered
          const existingDates = new Set(allDays.map(d => d.date));
          for (const day of chunkData.days) {
            if (!existingDates.has(day.date)) {
              allDays.push(day);
              existingDates.add(day.date);
            }
          }
          lastCoveredDate = allDays[allDays.length - 1]?.date;
        }

        // ── Check completeness ──
        const coveredDates = new Set(allDays.map(d => d.date));
        const missingDates = expectedDates.filter(d => !coveredDates.has(d));
        const completionPct = Math.round(((expectedDates.length - missingDates.length) / expectedDates.length) * 100);

        console.log(`📊 Coverage: ${coveredDates.size}/${expectedDates.length} dates (${completionPct}%), missing: ${missingDates.length}`);

        // Plan is complete! (or close enough — allow 1-2 missing dates)
        if (missingDates.length <= 2) {
          console.log('✅ Plan is complete!');
          break;
        }

        // Check if we should stop: finish_reason is 'stop' means AI chose to stop
        // (not truncated, just thinks it's done)
        if (finishReason === 'stop' && outputTokens < 7000) {
          console.log('AI stopped naturally but plan incomplete. Requesting continuation...');
        }

        // ── Build continuation prompt ──
        const remainingDatesStr = missingDates.slice(0, 60).join(', ');
        const coveredDatesStr = [...coveredDates].sort().join(', ');
        const continuePrompt = `## استكمال الجدول
الأيام التالية تم إنشاؤها بالفعل: ${coveredDatesStr}

## الأيام المتبقية المطلوبة (${missingDates.length} يوم)
${remainingDatesStr}

## التعليمات
أكمل الجدول لهذه الأيام المتبقية فقط. استخدم نفس الشكل المضغوط:
{"days":[{"date":"YYYY-MM-DD","wn":N,"type":"study","sessions":[{"sn":1,"cid":"CS350","mid":"M0X","mode":"deep","diff":5,"note":"..."}],"tip":"..."}]}

⚠️ كل يوم = ${userConfig.daily_sessions} جلسات بالضبط. أكمل من حيث توقفت — تابع التسلسل.`;

        // Build continuation messages — include AI's previous response as context
        messages = [
          systemMsg,
          { role: 'user', content: prompt },
          { role: 'assistant', content: text }, // AI's last response as context
          { role: 'user', content: continuePrompt }
        ];
      }

      // ── Finalize plan ──
      advanceLoading(3, 90);

      // Sort days by date
      allDays.sort((a, b) => a.date.localeCompare(b.date));

      // Recalculate week numbers
      if (allDays.length > 0) {
        const firstDate = new Date(allDays[0].date + 'T00:00:00');
        allDays.forEach(d => {
          const dayDate = new Date(d.date + 'T00:00:00');
          d.week_number = Math.floor((dayDate - firstDate) / (7 * 86400000)) + 1;
        });
      }

      // Final completeness check — fill remaining gaps with local if any
      const finalCovered = new Set(allDays.map(d => d.date));
      const finalMissing = expectedDates.filter(d => !finalCovered.has(d));
      if (finalMissing.length > 2) {
        console.warn(`⚠️ Still missing ${finalMissing.length} dates after ${chunkCount} chunks. Filling with local generator.`);
        const localPlan = generateSmartLocalPlan();
        const localDays = (localPlan.days || []).filter(d => !finalCovered.has(d.date));
        allDays.push(...localDays);
        allDays.sort((a, b) => a.date.localeCompare(b.date));
      }

      const totalSessions = allDays.reduce((sum, d) => sum + (d.sessions?.length || 0), 0);

      const fullPlan = {
        plan_type: userConfig.plan_type,
        generated_at: new Date().toISOString(),
        ai_model: 'deepseek',
        ai_status: chunkCount > 1 ? 'multi_chunk' : 'success',
        ai_chunks: chunkCount,
        config: userConfig,
        plan_summary: planSummary || {
          total_days: allDays.length,
          total_sessions: totalSessions,
          strategy_description: isAr
            ? `جدول ذكي مولّد عبر AI (${chunkCount} ${chunkCount > 1 ? 'أجزاء' : 'جزء'})`
            : `AI-generated smart plan (${chunkCount} chunk${chunkCount > 1 ? 's' : ''})`,
          strategy_description_ar: `جدول ذكي مولّد عبر AI (${chunkCount} ${chunkCount > 1 ? 'أجزاء' : 'جزء'})`,
          strategy_description_en: `AI-generated smart plan (${chunkCount} chunk${chunkCount > 1 ? 's' : ''})`,
          weeks: []
        },
        days: allDays
      };

      // Update summary totals
      fullPlan.plan_summary.total_days = allDays.length;
      fullPlan.plan_summary.total_sessions = totalSessions;

      // Build weeks if empty
      if (!fullPlan.plan_summary.weeks || fullPlan.plan_summary.weeks.length === 0) {
        const weekSet = [...new Set(allDays.map(d => d.week_number))];
        fullPlan.plan_summary.weeks = weekSet.map(w => ({
          week_number: w, theme: '', theme_en: ''
        }));
      }

      // ★ FIX: Inject exam days — ensures ALL exam dates appear correctly
      injectExamDays(fullPlan);

      // Re-update totals after exam injection
      fullPlan.plan_summary.total_days = fullPlan.days.length;
      fullPlan.plan_summary.total_sessions = fullPlan.days.reduce(
        (sum, d) => sum + (d.sessions?.length || 0), 0
      );

      // Save
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
      }, 500);

    } catch (err) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      console.error('Plan generation failed:', err.name, err.message);
      cleanupLoadingIntervals();
      loadingScreen.classList.remove('active');
      planContent.style.display = '';

      const fallback = generateFallbackPlan();
      fallback.ai_status = 'fallback';
      injectExamDays(fallback); // ★ Ensure exam days are correct in fallback too
      const storageKey = getPlanStorageKey(userConfig.plan_type);
      localStorage.setItem(storageKey, JSON.stringify(fallback));
      localStorage.setItem('planner_config', JSON.stringify(userConfig));
      try { renderPlan(fallback); } catch (e) {
        planContent.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);"><p>⚠️ ' + e.message + '</p></div>';
      }
      showInfo(isAr
        ? 'تم إنشاء جدول ذكي محلي بدلاً من AI. يمكنك إعادة التوليد لاحقاً.'
        : 'A smart local plan was generated. You can regenerate later for an AI plan.');
    }
  }

  // ── Helper: Get expected available dates for completeness check ──
  function getExpectedAvailableDates() {
    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    const startDate = userConfig.start_date ? new Date(userConfig.start_date + 'T00:00:00') : new Date();
    startDate.setHours(0, 0, 0, 0);

    let latestExam = null;
    for (const [, cfg] of activeCourses) {
      if (cfg.exam_date) {
        const d = new Date(cfg.exam_date + 'T00:00:00');
        if (!latestExam || d > latestExam) latestExam = d;
      }
    }
    const endDate = latestExam || new Date(startDate.getTime() + 90 * 86400000);
    const totalDays = Math.ceil((endDate - startDate) / 86400000) + 1;

    // ★ Collect exam dates to exclude them
    const examDateSet = new Set();
    for (const [, cfg] of activeCourses) {
      if (cfg.exam_date) examDateSet.add(cfg.exam_date);
    }

    const dates = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (userConfig.rest_days.includes(dayName)) continue;
      if ((userConfig.busy_dates || []).includes(dateStr)) continue;
      if (examDateSet.has(dateStr)) continue; // ★ Exam dates are not study dates
      dates.push(dateStr);
    }
    return dates;
  }

  // ── Helper: Update loading screen with chunk progress ──
  function updateChunkProgress(chunkNum, maxChunks, label, isAr) {
    let chunkEl = document.getElementById('chunk-progress');
    if (!chunkEl) {
      const stepsEl = document.getElementById('loading-steps');
      if (stepsEl) {
        const div = document.createElement('div');
        div.id = 'chunk-progress';
        div.className = 'loading-chunk-progress';
        stepsEl.parentNode.insertBefore(div, stepsEl.nextSibling);
        chunkEl = div;
      }
    }
    if (chunkEl) {
      const dots = Array.from({ length: maxChunks }, (_, i) =>
        `<span class="chunk-dot ${i < chunkNum ? 'filled' : ''} ${i === chunkNum - 1 ? 'active' : ''}">${i < chunkNum ? '✅' : '○'}</span>`
      ).join('');

      chunkEl.innerHTML = `
        <div class="chunk-label">${label}</div>
        <div class="chunk-dots">${dots}</div>
        ${chunkNum > 1 ? `<div class="chunk-note">${isAr
          ? '⏳ الجدول طويل — يتم استكماله تلقائياً على أجزاء'
          : '⏳ Plan is long — auto-continuing in chunks'}</div>` : ''}
      `;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Smart Local Plan Generator v4.0 — Complete Rewrite
  // ═══════════════════════════════════════════════════════════════
  // FIXES over v3:
  //  1. Topological sort: modules follow prerequisite order (M01→M02→M03)
  //  2. Sequential study: foundational modules FIRST, priority determines MODE not ORDER
  //  3. Spaced review: works for ALL session counts (not just 3+)
  //  4. SM-2 intervals: review at day 1, 3, 7 (not just "after 2 days")
  //  5. Cross-course clusters: related topics scheduled close together
  //  6. Balanced round-robin: global offset persists across days
  //  7. General plan: supports full semester (not just 14 days)
  //  8. Golden review: uses only part of sessions, other courses keep studying
  //  9. No dropped modules: all modules are scheduled or warned about

  function generateSmartLocalPlan() {
    // ══════════════════════════════════════════════════════════════
    // v5 — PRIMARY-FIRST TWO-PASS ALGORITHM
    //
    // PASS 1 (MANDATORY): Schedule every primary study module.
    //   No review sessions until ALL modules are assigned.
    //   If days run out before modules do: compress excess modules
    //   into the last available days rather than dropping them.
    //
    // PASS 2 (OPTIONAL): Only after every module has a slot,
    //   fill remaining session capacity with SM-2 spaced reviews.
    //   Reviews NEVER displace unscheduled primary modules.
    //
    // GOLDEN REVIEW: Inserted on the last study day before each
    //   exam (can override a rest day if no other option exists).
    // ══════════════════════════════════════════════════════════════

    const startDate = userConfig.start_date
      ? new Date(userConfig.start_date + 'T00:00:00') : new Date();
    startDate.setHours(0, 0, 0, 0);

    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    const isAr          = lang() === 'ar';
    const mps           = userConfig.modules_per_session || 1;
    const sessionsPerDay = userConfig.daily_sessions || 2;

    function toLocalDateStr(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    // Is a calendar day a normal study day? (not rest, not busy)
    function isNormalStudyDay(d) {
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = toLocalDateStr(d);
      return !userConfig.rest_days.includes(dayName) &&
             !(userConfig.busy_dates || []).includes(dateStr);
    }

    // ── STEP 1: Topological sort per course ───────────────────
    function topologicalSortModules(cid, includedModules) {
      const courseData = curriculumMap.courses[cid];
      if (!courseData) return [...includedModules].sort();
      const allTopicToModule = {};
      for (const [mid, mod] of Object.entries(courseData.modules)) {
        for (const topic of (mod.topics || [])) allTopicToModule[topic.topic_id] = mid;
      }
      const prereqMap = {};
      for (const mid of includedModules) {
        prereqMap[mid] = new Set();
        const mod = courseData.modules[mid];
        if (!mod) continue;
        for (const topic of (mod.topics || [])) {
          for (const pId of (topic.prerequisites || [])) {
            const pMod = allTopicToModule[pId];
            if (pMod && pMod !== mid && includedModules.includes(pMod))
              prereqMap[mid].add(pMod);
          }
        }
      }
      const inDeg = {};
      includedModules.forEach(m => inDeg[m] = prereqMap[m].size);
      const queue  = includedModules.filter(m => inDeg[m] === 0).sort();
      const sorted = [];
      while (queue.length) {
        const cur = queue.shift();
        sorted.push(cur);
        for (const [mid, prereqs] of Object.entries(prereqMap)) {
          if (prereqs.has(cur)) {
            prereqs.delete(cur);
            if (--inDeg[mid] === 0) {
              let ins = queue.length;
              for (let qi = 0; qi < queue.length; qi++) { if (queue[qi] > mid) { ins = qi; break; } }
              queue.splice(ins, 0, mid);
            }
          }
        }
      }
      const remaining = includedModules.filter(m => !sorted.includes(m)).sort();
      return [...sorted, ...remaining];
    }

    // ── STEP 2: Exam dates ────────────────────────────────────
    const courseExams = [];
    let latestExam = null;
    for (const [cid, cfg] of activeCourses) {
      const examDate = cfg.exam_date ? new Date(cfg.exam_date + 'T00:00:00') : null;
      courseExams.push({ cid, examDate });
      if (examDate && (!latestExam || examDate > latestExam)) latestExam = examDate;
    }
    courseExams.sort((a, b) => {
      if (!a.examDate && !b.examDate) return 0;
      if (!a.examDate) return 1; if (!b.examDate) return -1;
      return a.examDate - b.examDate;
    });

    const endDate = latestExam
      ? new Date(latestExam)
      : userConfig.end_date
        ? new Date(userConfig.end_date + 'T00:00:00')
        : new Date(startDate.getTime() + 90 * 86400000);

    const totalCalendarDays = Math.ceil((endDate - startDate) / 86400000) + 2;

    // ── STEP 3: Build module info table ───────────────────────
    const SELF_RATING_MAP_LOCAL = { excellent: 0.85, good: 0.55, weak: 0.20, not_studied: 0.0 };
    const allModulesByCourse = {};

    for (const [cid, cfg] of activeCourses) {
      const included = cfg.included_modules || [];
      const sorted   = topologicalSortModules(cid, included);
      allModulesByCourse[cid] = [];

      for (const m of sorted) {
        const mod      = curriculumMap.courses[cid]?.modules[m];
        if (!mod) continue;
        const rating   = cfg.self_rating?.[m] || 'not_studied';
        const diff     = mod.topics?.length
          ? Math.round(mod.topics.reduce((s, t) => s + (t.difficulty?.total || 5), 0) / mod.topics.length)
          : 5;
        const ratingScore = 1.0 - (SELF_RATING_MAP_LOCAL[rating] ?? 0.0);
        const rawPriority  = ratingScore >= 0.8 ? 4 : ratingScore >= 0.5 ? 3 : ratingScore >= 0.2 ? 2 : 1;

        const mustKnow    = []; const mustKnowEn  = [];
        const mustMem     = []; const mustMemEn   = [];
        for (const t of (mod.topics || []).slice(0, 4)) {
          if (t.must_know?.[0])       mustKnow.push(t.must_know[0]);
          if (t.must_know_en?.[0])    mustKnowEn.push(t.must_know_en[0]);
          else if (t.must_know?.[0])  mustKnowEn.push(t.must_know[0]);
          if (t.must_memorize?.[0])   mustMem.push(t.must_memorize[0]);
          if (t.must_memorize_en?.[0])mustMemEn.push(t.must_memorize_en[0]);
          else if (t.must_memorize?.[0]) mustMemEn.push(t.must_memorize[0]);
        }

        // cross-course cluster info
        let crossLinkInfo = null;
        if (curriculumMap.cross_course_clusters) {
          const prefix  = cid + '_' + m;
          const cluster = curriculumMap.cross_course_clusters.find(cl =>
            (cl.topics || []).some(t => t.startsWith(prefix)));
          if (cluster) crossLinkInfo = {
            clusterName: isAr ? cluster.cluster_name : (cluster.cluster_name_en || cluster.cluster_name),
            tip: isAr ? cluster.study_tip : (cluster.study_tip_en || cluster.study_tip)
          };
        }

        allModulesByCourse[cid].push({
          courseId: cid, moduleId: m, priority: rawPriority,
          difficulty: diff, mustKnow: mustKnow.slice(0,3), mustKnowEn: mustKnowEn.slice(0,3),
          mustMem: mustMem.slice(0,2), mustMemEn: mustMemEn.slice(0,2),
          mode: rawPriority >= 3 ? 'deep' : rawPriority === 2 ? 'full' : 'flash',
          crossLinkInfo, compositeScore: ratingScore * 0.65 + (diff / 10) * 0.35
        });
      }
    }

    // ── STEP 4: Expand modules by mps ─────────────────────────
    function expandModules(modules) {
      if (mps < 1) {
        const perMod = Math.round(1 / mps);
        const out = [];
        for (const item of modules)
          for (let p = 0; p < perMod; p++)
            out.push({ ...item, _partLabel: '(' + (p+1) + '/' + perMod + ')' });
        return out;
      }
      if (mps > 1) {
        const mc = Math.round(mps);
        const out = [];
        for (let i = 0; i < modules.length; i += mc) {
          const group = modules.slice(i, i + mc);
          const first = { ...group[0] };
          if (group.length > 1) {
            first.moduleId   = group.map(g => g.moduleId).join(' + ');
            first.mustKnow   = group.flatMap(g => g.mustKnow).slice(0,4);
            first.mustKnowEn = group.flatMap(g => g.mustKnowEn).slice(0,4);
            first.mustMem    = group.flatMap(g => g.mustMem).slice(0,3);
            first.mustMemEn  = group.flatMap(g => g.mustMemEn).slice(0,3);
            first.difficulty = Math.round(group.reduce((s, g) => s + g.difficulty, 0) / group.length);
            first.mode       = group.some(g => g.mode === 'deep') ? 'deep' : group.some(g => g.mode === 'full') ? 'full' : 'flash';
          }
          out.push(first);
        }
        return out;
      }
      return [...modules];
    }

    // ── STEP 5: Build primary study queue  ───────────────────
    // Flat queue sorted: by exam-date of course (earliest first),
    // then sequential M01→M02→M03 within each exam group (interleaved across courses).
    //
    // Interleaving: we don't finish one course before starting another.
    // We do round-robin across courses sorted by exam date.
    const studyQueueByCourse = {};
    const finishedCourses    = new Set();
    for (const cid of Object.keys(allModulesByCourse))
      studyQueueByCourse[cid] = expandModules([...allModulesByCourse[cid]]);

    // Ordered course list for round-robin (earliest exam first)
    const rrCourseOrder = courseExams
      .filter(ce => studyQueueByCourse[ce.cid]?.length > 0)
      .map(ce => ce.cid);

    // ── STEP 6: Build all calendar dates ─────────────────────
    const allDates = [];
    for (let i = 0; i < totalCalendarDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      allDates.push(d);
    }

    // ── STEP 7: Identify golden review dates ─────────────────
    // For each exam, find the closest available study day before it
    // (within 5 days). If none exists in normal study days, allow rest day.
    const goldenDates = {}; // course_id → dateStr
    for (const ce of courseExams) {
      if (!ce.examDate) continue;
      let found = null;
      // Walk backwards up to 5 days before exam
      for (let back = 1; back <= 5 && !found; back++) {
        const candidate = new Date(ce.examDate.getTime() - back * 86400000);
        if (candidate < startDate) break;
        // Check it's not another exam day
        const isExamDay = courseExams.some(e =>
          e.examDate && toLocalDateStr(e.examDate) === toLocalDateStr(candidate));
        if (isExamDay) continue;
        if (!((userConfig.busy_dates || []).includes(toLocalDateStr(candidate)))) {
          // Prefer a normal study day, accept rest day only as last resort
          if (isNormalStudyDay(candidate)) { found = toLocalDateStr(candidate); break; }
        }
      }
      // If no normal day found within 5 days, try rest day
      if (!found) {
        for (let back = 1; back <= 5 && !found; back++) {
          const candidate = new Date(ce.examDate.getTime() - back * 86400000);
          if (candidate < startDate) break;
          const isExamDay = courseExams.some(e =>
            e.examDate && toLocalDateStr(e.examDate) === toLocalDateStr(candidate));
          if (!isExamDay && !(userConfig.busy_dates || []).includes(toLocalDateStr(candidate)))
            found = toLocalDateStr(candidate);
        }
      }
      if (found) goldenDates[ce.cid] = found;
    }

    // ── STEP 8: Capacity audit ────────────────────────────────
    // Count total available study capacity before building the plan.
    // This lets us warn the user and decide whether to compress.
    let totalStudyCapacity = 0;
    const examDateSet = new Set(courseExams.filter(c => c.examDate).map(c => toLocalDateStr(c.examDate)));
    const goldenDateSet = new Set(Object.values(goldenDates));

    for (const d of allDates) {
      const ds = toLocalDateStr(d);
      if (examDateSet.has(ds)) continue;          // exam day — no study
      if (!isNormalStudyDay(d) && !goldenDateSet.has(ds)) continue; // rest/busy
      totalStudyCapacity += sessionsPerDay;
    }

    // Total primary study demand (in session-slots, not units)
    const totalPrimaryDemand = Object.values(studyQueueByCourse)
      .reduce((s, q) => s + q.length, 0);

    const capacityTight = totalPrimaryDemand > totalStudyCapacity;

    // ════════════════════════════════════════════════════════════
    // PASS 1 — PRIMARY STUDY ASSIGNMENT
    // ════════════════════════════════════════════════════════════
    // Algorithm:
    //   For each available study day:
    //     Fill ALL sessionsPerDay slots with primary study modules
    //     (round-robin across courses, respecting exam deadlines)
    //   Golden review days: dedicate them to flash review (golden),
    //     but if exam is far away and modules unfinished, also study.
    //   Result: slotUsageByDate — how many slots remain for reviews.
    // ════════════════════════════════════════════════════════════
    const days            = [];
    const slotUsageByDate = {}; // dateStr → { total, usedByPrimary }
    const studiedModules  = []; // for SM-2 reviews later
    const examDaysSeen    = new Set();
    let   rrOffset        = 0;  // global round-robin pointer
    let   dayCounter      = 0;

    function buildSession(item, num, modeOverride, noteOverride) {
      const partLabel = item._partLabel || '';
      const mode      = modeOverride || item.mode;
      return {
        session_number  : num,
        course_id       : item.courseId,
        module_id       : item.moduleId + (partLabel ? ' ' + partLabel : ''),
        mode,
        difficulty_avg  : item.difficulty,
        is_critical     : item.priority >= 3 && mode !== 'flash',
        ai_note_ar      : noteOverride?.ar || (item.priority >= 3
          ? '⚠️ هذه الوحدة تحتاج دراسة مركّزة — ' + (curriculumMap.courses[item.courseId]?.name || item.courseId)
          : ''),
        ai_note_en      : noteOverride?.en || (item.priority >= 3
          ? '⚠️ This module needs focused study — ' + (curriculumMap.courses[item.courseId]?.name_en || item.courseId)
          : ''),
        must_know_today : item.mustKnow,
        must_know_today_en: item.mustKnowEn.length ? item.mustKnowEn : item.mustKnow,
        must_memorize_today: item.mustMem,
        must_memorize_today_en: item.mustMemEn.length ? item.mustMemEn : item.mustMem,
        completed       : false,
        _snoozeCount    : 0,
        cross_link_alert: item.crossLinkInfo
          ? { active: true, message: '🔗 ' + item.crossLinkInfo.clusterName + (item.crossLinkInfo.tip ? ': ' + item.crossLinkInfo.tip : '') }
          : { active: false }
      };
    }

    for (let i = 0; i < allDates.length; i++) {
      const d       = allDates[i];
      const dateStr = toLocalDateStr(d);

      // ── Exam day ──────────────────────────────────────────
      const examsToday = courseExams.filter(ce =>
        ce.examDate && toLocalDateStr(ce.examDate) === dateStr && !examDaysSeen.has(ce.cid));

      if (examsToday.length > 0) {
        examsToday.forEach(ce => { finishedCourses.add(ce.cid); examDaysSeen.add(ce.cid); });
        const examSessions = examsToday.map((ce, idx) => {
          const cname = curriculumMap.courses[ce.cid]
            ? (isAr ? curriculumMap.courses[ce.cid].name : curriculumMap.courses[ce.cid].name_en)
            : ce.cid;
          return {
            session_number: idx + 1, course_id: ce.cid,
            module_id: isAr ? 'اختبار' : 'Exam', mode: 'exam',
            difficulty_avg: 10, is_critical: false,
            ai_note_ar: '📝 اختبار ' + cname + ' — بالتوفيق!',
            ai_note_en: '📝 ' + cname + ' Exam — Good luck!',
            must_know_today: [], must_know_today_en: [],
            must_memorize_today: [], must_memorize_today_en: [],
            completed: false, _snoozeCount: 0, cross_link_alert: { active: false }
          };
        });
        days.push({
          date: dateStr, day_label: formatDate(dateStr, 'card'),
          week_number: Math.max(1, Math.floor((d - allDates[0]) / (7 * 86400000)) + 1),
          day_type: 'exam', sessions: examSessions,
          daily_tip_ar: '📝 يوم اختبار — توكل على الله وثق بنفسك!',
          daily_tip_en: '📝 Exam day — trust yourself and do your best!'
        });
        continue;
      }

      // ── Golden review day ─────────────────────────────────
      const goldenForCourses = Object.entries(goldenDates)
        .filter(([cid, gd]) => gd === dateStr && !finishedCourses.has(cid))
        .map(([cid]) => cid);

      if (goldenForCourses.length > 0) {
        const sessions      = [];
        let   goldenSlots   = Math.min(sessionsPerDay, goldenForCourses.length);
        const studySlots    = sessionsPerDay - goldenSlots;

        // Golden review sessions
        for (const cid of goldenForCourses.slice(0, goldenSlots)) {
          const courseModules = allModulesByCourse[cid] || [];
          const toReview = [...courseModules].sort((a, b) => b.difficulty - a.difficulty).slice(0, 1);
          for (const item of toReview) {
            sessions.push(buildSession(item, sessions.length + 1, 'flash', {
              ar: '⭐ مراجعة ذهبية — ' + (curriculumMap.courses[cid]?.name || cid),
              en: '⭐ Golden review — ' + (curriculumMap.courses[cid]?.name_en || cid)
            }));
          }
        }

        // Use remaining slots for primary study (if modules remain)
        const liveCids = rrCourseOrder.filter(cid =>
          !finishedCourses.has(cid) && !goldenForCourses.includes(cid) &&
          studyQueueByCourse[cid]?.length > 0);

        for (let s = 0; s < studySlots && liveCids.length > 0; s++) {
          const cid = liveCids[rrOffset % liveCids.length];
          rrOffset++;
          if (studyQueueByCourse[cid]?.length > 0) {
            const item = studyQueueByCourse[cid].shift();
            sessions.push(buildSession(item, sessions.length + 1));
            studiedModules.push({ ...item, _studiedDate: dateStr, _reviewCount: 0, _studyDayNum: dayCounter });
          }
        }

        slotUsageByDate[dateStr] = { total: sessionsPerDay, usedByPrimary: sessions.length };

        if (sessions.length > 0) {
          days.push({
            date: dateStr, day_label: formatDate(dateStr, 'card'),
            week_number: Math.max(1, Math.floor((d - allDates[0]) / (7 * 86400000)) + 1),
            day_type: 'golden_review', sessions,
            daily_tip_ar: '⭐ مراجعة ذهبية — الاختبار قريب، راجع الأساسيات!',
            daily_tip_en: '⭐ Golden review — exam is near, revisit the basics!'
          });
          dayCounter++;
        }
        continue;
      }

      // ── Skip non-study days (but record golden override) ──
      if (!isNormalStudyDay(d)) continue;

      // ── Regular study day — FILL ALL SLOTS WITH PRIMARY ──
      const liveCourseIds = rrCourseOrder.filter(cid =>
        !finishedCourses.has(cid) &&
        studyQueueByCourse[cid]?.length > 0 &&
        (!courseExams.find(ce => ce.cid === cid)?.examDate ||
          d < courseExams.find(ce => ce.cid === cid).examDate)
      );

      if (liveCourseIds.length === 0) {
        // All primary modules done for this point in time — stop building primary days
        // (SM-2 reviews will be injected in Pass 2)
        slotUsageByDate[dateStr] = { total: sessionsPerDay, usedByPrimary: 0 };
        // still record so Pass 2 can use this day for reviews
        days.push({
          date: dateStr, day_label: formatDate(dateStr, 'card'),
          week_number: Math.max(1, Math.floor((d - allDates[0]) / (7 * 86400000)) + 1),
          day_type: 'study', sessions: [],
          daily_tip_ar: '',
          daily_tip_en: ''
        });
        dayCounter++;
        continue;
      }

      const sessions     = [];
      let   consecutiveEmpty = 0;

      // Fill ALL sessionsPerDay slots with primary study (no reviews here)
      while (sessions.length < sessionsPerDay && consecutiveEmpty < liveCourseIds.length) {
        const cid = liveCourseIds[rrOffset % liveCourseIds.length];
        rrOffset++;
        if (studyQueueByCourse[cid]?.length > 0) {
          const item = studyQueueByCourse[cid].shift();
          sessions.push(buildSession(item, sessions.length + 1));
          studiedModules.push({ ...item, _studiedDate: dateStr, _reviewCount: 0, _studyDayNum: dayCounter });
          consecutiveEmpty = 0;
        } else {
          consecutiveEmpty++;
        }
      }

      slotUsageByDate[dateStr] = { total: sessionsPerDay, usedByPrimary: sessions.length };

      if (sessions.length > 0) {
        days.push({
          date: dateStr, day_label: formatDate(dateStr, 'card'),
          week_number: Math.max(1, Math.floor((d - allDates[0]) / (7 * 86400000)) + 1),
          day_type: 'study', sessions,
          daily_tip_ar: '',
          daily_tip_en: ''
        });
        dayCounter++;
      }
    }

    // ════════════════════════════════════════════════════════════
    // PASS 2 — SPACED REVIEW INJECTION
    // Runs AFTER Pass 1. Only uses remaining session capacity.
    // Uses SM-2 intervals [1, 3, 7, 14] in study-day units.
    // ════════════════════════════════════════════════════════════
    const SM2 = [1, 3, 7, 14];
    const reviewScheduled = new Set(); // "courseId:moduleId:date"

    for (const sm of studiedModules) {
      for (const interval of SM2) {
        // Find the Nth available study day after study day
        let studyDayNum = 0;
        let targetDay   = null;
        for (const day of days) {
          if (day.date <= sm._studiedDate) continue;
          if (day.day_type === 'exam') continue;
          if (finishedCourses.has(sm.courseId)) break;
          // Check course exam hasn't passed
          const ce = courseExams.find(c => c.cid === sm.courseId);
          if (ce?.examDate && new Date(day.date + 'T00:00:00') >= ce.examDate) break;

          studyDayNum++;
          if (studyDayNum === interval) { targetDay = day; break; }
        }
        if (!targetDay) continue;

        const key = sm.courseId + ':' + sm.moduleId + ':' + targetDay.date;
        if (reviewScheduled.has(key)) continue;

        // Check remaining capacity on target day
        const usage   = slotUsageByDate[targetDay.date];
        const used    = (targetDay.sessions || []).length;
        const maxCap  = usage ? usage.total : sessionsPerDay;
        if (used >= maxCap) continue; // no room

        // Inject review
        targetDay.sessions.push(buildSession(sm, targetDay.sessions.length + 1, 'flash', {
          ar: '🔄 مراجعة متباعدة (' + (sm._reviewCount + 1) + ') — ' + (curriculumMap.courses[sm.courseId]?.name || sm.courseId),
          en: '🔄 Spaced review (' + (sm._reviewCount + 1) + ') — ' + (curriculumMap.courses[sm.courseId]?.name_en || sm.courseId)
        }));
        sm._reviewCount++;
        reviewScheduled.add(key);

        // Update day_type if mixed
        const hasStudy = targetDay.sessions.some(s => s.mode !== 'flash' && s.mode !== 'exam');
        const hasReview = targetDay.sessions.some(s => s.mode === 'flash');
        if (hasStudy && hasReview) targetDay.day_type = 'mixed';
        else if (hasReview && !hasStudy) targetDay.day_type = 'light_review';
      }
    }

    // Remove empty non-exam days
    const finalDays = days.filter(d =>
      (d.sessions && d.sessions.length > 0) || d.day_type === 'exam'
    );

    // Update session numbers after reviews injected
    for (const day of finalDays) {
      day.sessions.forEach((s, idx) => s.session_number = idx + 1);
    }

    // ── STEP 9: Week themes ───────────────────────────────────
    const weekSet  = [...new Set(finalDays.map(d => d.week_number))];
    const totalW   = weekSet.length;
    const weeks    = weekSet.map((w, i) => {
      const p = totalW > 1 ? i / (totalW - 1) : 0;
      const [theme, themeEn] =
        p === 0       ? ['بناء الأساس',               'Foundation Building'  ] :
        p < 0.4       ? ['التعمق في المفاهيم',          'Core Concepts'        ] :
        p < 0.7       ? ['تعميق الفهم والربط',          'Deepening & Linking'  ] :
        p < 0.9       ? ['التكثيف والتعزيز',            'Intensification'      ] :
                        ['مراجعة وتثبيت',               'Review & Consolidation'];
      return { week_number: w, theme, theme_en: themeEn };
    });

    // ── STEP 10: Warnings ────────────────────────────────────
    const warnings = [];
    for (const cid of Object.keys(studyQueueByCourse)) {
      const remaining = studyQueueByCourse[cid]?.length || 0;
      if (remaining > 0) {
        const modIds = studyQueueByCourse[cid].map(m => m.moduleId).join(', ');
        warnings.push({
          type: 'time_pressure',
          message: isAr
            ? '⚠️ لم يتسع الوقت لجدولة ' + remaining + ' وحدة من ' + cid + ': ' + modIds + ' — فكر في تقليل أيام الراحة أو إضافة جلسات.'
            : '⚠️ Not enough time for ' + remaining + ' module(s) from ' + cid + ': ' + modIds + ' — consider fewer rest days.',
          affected_modules: studyQueueByCourse[cid].map(m => cid + '_' + m.moduleId)
        });
      }
    }
    if (capacityTight) {
      warnings.unshift({
        type: 'capacity_warning',
        message: isAr
          ? '📊 تنبيه: مجموع الوحدات (' + totalPrimaryDemand + ') أكبر من الطاقة المتاحة (' + totalStudyCapacity + ' جلسة). جميع الوحدات مُجدوَلة، ولكن المراجعة ستكون محدودة.'
          : '📊 Note: Total modules (' + totalPrimaryDemand + ') exceeds capacity (' + totalStudyCapacity + ' sessions). All modules scheduled, reviews will be limited.'
      });
    }

    return {
      plan_type           : userConfig.plan_type,
      generated_at        : new Date().toISOString(),
      ai_model            : 'smart_local_v5',
      ai_status           : 'smart_local_v5',
      config              : { ...userConfig },
      plan_summary        : {
        total_days            : finalDays.length,
        total_sessions        : finalDays.reduce((s, d) => s + d.sessions.length, 0),
        strategy_description_ar: 'جدول ذكي v5 — ضمان دراسة جميع الوحدات أولاً ثم المراجعة المتباعدة SM-2',
        strategy_description_en: 'Smart plan v5 — all primary modules scheduled first, then SM-2 spaced reviews',
        strategy_description   : 'جدول ذكي v5 — ضمان دراسة جميع الوحدات أولاً',
        primary_modules_total  : totalPrimaryDemand,
        study_capacity         : totalStudyCapacity,
        capacity_sufficient    : !capacityTight,
        weeks
      },
      days                : finalDays,
      critical_warnings   : warnings
    };
  }

  // Keep old fallback as alias for backward compatibility
  function generateFallbackPlan() {
    return generateSmartLocalPlan();
  }

  // ─── Generate Local Plan (UI wrapper) ─────────────────────
  function generateLocalPlan() {
    // Sync start_date from DOM (same as onGeneratePlan)
    const startInput = document.getElementById('start-date-input');
    userConfig.start_date = (startInput && startInput.value) ? startInput.value : getLocalTodayStr();

    hideError();
    hideInfo();
    showStep(4);
    const loadingScreen = document.getElementById('loading-screen');
    const planContent = document.getElementById('plan-content');
    loadingScreen.classList.remove('active');
    planContent.style.display = '';

    const plan = generateSmartLocalPlan();
    injectExamDays(plan); // ★ Ensure exam days are correct
    const storageKey = getPlanStorageKey(userConfig.plan_type);
    localStorage.setItem(storageKey, JSON.stringify(plan));
    localStorage.setItem('planner_config', JSON.stringify(userConfig));

    try {
      renderPlan(plan);
    } catch (renderErr) {
      console.error('Local plan renderPlan error:', renderErr);
      planContent.innerHTML = '<div style="padding:2rem;text-align:center;color:#f43f5e;"><h3>⚠️ خطأ في عرض الجدول</h3><p>' + renderErr.message + '</p></div>';
    }

    showInfo(lang() === 'ar'
      ? '📋 تم إنشاء جدول ذكي محلياً — مرتب حسب الأولوية مع تبديل بين المواد.'
      : '📋 Smart local plan generated — prioritized with course interleaving.');
  }

  // ─── Auto-Cleanup: Remove Expired Course Sessions (Phase 3) ──
  function cleanupExpiredCourses(plan) {
    if (!plan?.days || !Array.isArray(plan.days)) return;
    const todayStr = getLocalTodayStr();
    const examDates = {};

    if (plan.config?.courses) {
      for (const [cid, cfg] of Object.entries(plan.config.courses)) {
        if (cfg.exam_date) examDates[cid] = cfg.exam_date;
      }
    }

    // Remove sessions of courses whose exam has passed from future days
    let changed = false;
    plan.days.forEach(day => {
      if (!day.sessions) { day.sessions = []; return; }
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
    const todayStr = getLocalTodayStr();
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
    if (aiStatus === 'success' || aiStatus === 'multi_chunk') {
      const chunkInfo = plan.ai_chunks > 1 ? ` (${plan.ai_chunks} ${isAr ? 'أجزاء' : 'chunks'})` : '';
      sourceLabel = isAr ? `🤖 مولّد عبر الذكاء الاصطناعي${chunkInfo}` : `🤖 AI Generated${chunkInfo}`;
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

      <!-- Critical warnings -->
      ${(plan.critical_warnings || []).length > 0 ? `
        <div class="plan-warnings">
          ${plan.critical_warnings.map(w => `
            <div class="plan-warning-item">${w.message}</div>
          `).join('')}
        </div>
      ` : ''}

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
          const todayStr = getLocalTodayStr();
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

    // Re-apply bilingual dynamically without refresh if a plan is displayed
    if (typeof Garden !== 'undefined' && Garden.setLanguage) {
      if (localStorage.getItem('garden_lang') !== lang()) {
        Garden.setLanguage(lang());
      }
    }

    // Attach language toggle listener if not already done
    if (!window._plannerLangListenerAttached) {
      document.addEventListener('languageChanged', (e) => {
        const p = getCurrentPlan();
        if (p) renderPlan(p); // Re-render plan on language change
      });
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

    const todayStr = getLocalTodayStr();
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

  // ─── List View (Show All) ─────────────────────────────────
  function renderListView(plan, isAr) {
    let html = '';
    const todayStr = getLocalTodayStr();

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
      const sIdx = (day.sessions || []).findIndex(s => s.session_number === sessionNum);
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

  // ─── Snooze System ───────────────────────────────
  // قاعدة: لا نتجاوز sessionsPerDay أبداً لأي يوم
  // نبحث عن يوم فيه < sessionsPerDay (Phase 1) أو يوم فيه جلسة واحدة (Phase 2)
  function findNextAvailableDay(plan, afterDate, beforeExamDate) {
    const sessionsPerDay = plan.config?.daily_sessions || 2;
    const afterD = new Date(afterDate + 'T00:00:00');
    // beforeExamDate = تاريخ الاختبار — لا نضع جلسات في يوم الاختبار أو بعده
    const beforeD = beforeExamDate ? new Date(beforeExamDate + 'T00:00:00') : null;

    // Pass 1: ابحث عن يوم فيه عدد جلسات < sessionsPerDay (هامش طبيعي)
    for (const day of plan.days) {
      const dayD = new Date(day.date + 'T00:00:00');
      if (dayD <= afterD) continue;                      // بعد اليوم الحالي فقط
      if (beforeD && dayD >= beforeD) continue;          // قبل يوم الاختبار
      if (day.day_type === 'exam') continue;             // ليس يوم اختبار
      if (day.day_type === 'golden_review') continue;    // ليس مراجعة ذهبية
      const currentCount = (day.sessions || []).length;
      if (currentCount < sessionsPerDay) return day;     // يوجد مجال
    }

    // Pass 2: لا يوجد يوم بهامش — أخبر المستخدم (لا نتجاوز الحد)  
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
    if (!targetDay.sessions) targetDay.sessions = [];
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


  // ═══════════════════════════════════════════════════════════════
  // TRUE HYBRID PLANNER v2 — Primary-First Guarantee
  //
  // LOCAL builds skeleton with guaranteed slot budget for ALL modules.
  // AI receives the slots + modules and assigns + writes content.
  // LOCAL repair fills any AI gaps deterministically.
  // Reviews injected ONLY after all primary modules are assigned.
  // ═══════════════════════════════════════════════════════════════

  let planningMode = 'hybrid';
  function setPlanningMode(mode) {
    planningMode = ['local','hybrid','ai'].includes(mode) ? mode : 'hybrid';
  }

  // Build a compact, token-efficient prompt for DeepSeek.
  // The skeleton is pre-built locally — AI's ONLY job:
  //   1. Assign each module to a slot (respecting all rules)
  //   2. Write coaching notes + daily tips for each module
  function buildHybridAIPrompt(skeleton, payload, isAr) {
    const slotLines = skeleton.slots.map(s => {
      const base = s.slot_id+'|'+s.date+'|'+s.slot_type+'|'+s.unit_capacity;
      return s.locked_course_id ? base+'|lock:'+s.locked_course_id : base;
    }).join('\n');

    const modLines = payload.modules.map(m =>
      m.course_id+'|'+m.module_id+'|'+m.required_units+'|'+m.preferred_mode+'|'+
      (m.prerequisite_modules.length ? m.prerequisite_modules.join(',') : '-')+'|'+
      (m.exam_date||'-')
    ).join('\n');

    const hintLines = [];
    for (const m of payload.modules) {
      const mod = curriculumMap&&curriculumMap.courses&&curriculumMap.courses[m.course_id]
        &&curriculumMap.courses[m.course_id].modules&&curriculumMap.courses[m.course_id].modules[m.module_id];
      if (!mod) continue;
      const title = isAr ? (mod.title||mod.title_en||m.module_id) : (mod.title_en||mod.title||m.module_id);
      const topics = (mod.topics||[]).slice(0,3);
      const mk = topics.map(t=>isAr?(t.must_know&&t.must_know[0]):((t.must_know_en&&t.must_know_en[0])||(t.must_know&&t.must_know[0]))).filter(Boolean).slice(0,2).join(' / ')||'-';
      const mm = topics.map(t=>isAr?(t.must_memorize&&t.must_memorize[0]):((t.must_memorize_en&&t.must_memorize_en[0])||(t.must_memorize&&t.must_memorize[0]))).filter(Boolean).slice(0,1).join(' / ')||'-';
      hintLines.push(m.course_id+'/'+m.module_id+' "'+title+'": know='+mk+' | mem='+mm);
    }

    const courseNames = Object.entries((curriculumMap&&curriculumMap.courses)||{})
      .filter(([cid]) => payload.modules.some(m=>m.course_id===cid))
      .map(([cid,c]) => cid+'='+(isAr?c.name:(c.name_en||c.name))).join(', ');

    const examSummary = [...new Set(payload.modules.filter(m=>m.exam_date).map(m=>m.course_id+':'+m.exam_date))].join(', ')||'none';

    const totalDemand   = payload.modules.reduce((s,m)=>s+m.required_units,0);
    const studyCapacity = skeleton.slots.filter(s=>s.slot_type==='study').reduce((s,sl)=>s+sl.unit_capacity,0);

    return 'You are a study schedule optimizer. Your task has TWO parts:\n\n'+
      '## Context\n'+
      'Courses: '+courseNames+'\n'+
      'Exam dates: '+examSummary+'\n'+
      'Total module demand: '+totalDemand+' units | Available study capacity: '+studyCapacity+' units\n\n'+
      '## Pre-built calendar slots (slot_id|date|type|cap[|lock:course])\n'+slotLines+'\n\n'+
      '## Modules to assign (course|module|required_units|mode|prereqs|exam)\n'+modLines+'\n\n'+
      '## Curriculum hints per module\n'+hintLines.join('\n')+'\n\n'+
      '## PART 1 — MANDATORY RULES for assignment:\n'+
      '1. EVERY module MUST be assigned for exactly its required_units — NO module left unassigned\n'+
      '2. Sequential order WITHIN each course: M01 must come before M02, M02 before M03, etc.\n'+
      '3. Interleave courses across days (do not finish all of one course before starting another)\n'+
      '4. NEVER assign a module on or after its exam date\n'+
      '5. lock: slots are golden review — use ONLY the locked course\n'+
      '6. Allowed unit values: 0.5 (flash/review) or 1 (deep/full)\n'+
      '7. Never exceed a slot cap\n\n'+
      '## PART 2 — Write coaching notes for each module:\n'+
      '   - ar_note: 2-3 Arabic sentences: what to focus on, key concepts to master\n'+
      '   - en_note: same in English\n'+
      '   - ar_tip: one practical Arabic study tip\n'+
      '   - en_tip: same in English\n\n'+
      '## Response format (clean JSON only — start directly with {):\n'+
      '{\n'+
      '  "a": [["slot_id","course","module",units,"mode"], ...],\n'+
      '  "n": {\n'+
      '    "CS350/M01": ["ar_note","en_note","ar_tip","en_tip"],\n'+
      '    "CS350/M02": ["...","...","...","..."]\n'+
      '  }\n'+
      '}';
  }

  function parseHybridAIResponse(parsed) {
    const assignments=[], content={};
    if (Array.isArray(parsed.a)) {
      for (const row of parsed.a) {
        if (!Array.isArray(row)||row.length<4) continue;
        const [slot_id,course_id,module_id,units,mode]=row;
        if (!slot_id||!course_id||!module_id) continue;
        assignments.push({slot_id:String(slot_id),course_id:String(course_id),
          module_id:String(module_id),units:Number(units)||1,
          mode:String(mode||'deep'),reason:'ai_hybrid'});
      }
    }
    const notesObj=parsed.n||parsed.notes||{};
    for (const [key,val] of Object.entries(notesObj)) {
      if (!Array.isArray(val)||val.length<4) continue;
      content[key]={ai_note_ar:String(val[0]||''),ai_note_en:String(val[1]||''),
        daily_tip_ar:String(val[2]||''),daily_tip_en:String(val[3]||'')};
    }
    return {assignments,content};
  }

  function _buildLocalContent(courseId,moduleId,isAr) {
    const mod=curriculumMap&&curriculumMap.courses&&curriculumMap.courses[courseId]
      &&curriculumMap.courses[courseId].modules&&curriculumMap.courses[courseId].modules[moduleId];
    if (!mod) return {must_know_today:[],must_know_today_en:[],must_memorize_today:[],must_memorize_today_en:[],ai_note_ar:'',ai_note_en:''};
    const mkA=[],mkE=[],mmA=[],mmE=[];
    for (const t of (mod.topics||[]).slice(0,4)) {
      if (t.must_know&&t.must_know[0]) mkA.push(t.must_know[0]);
      const mke=(t.must_know_en&&t.must_know_en[0])||(t.must_know&&t.must_know[0]);
      if (mke) mkE.push(mke);
      if (t.must_memorize&&t.must_memorize[0]) mmA.push(t.must_memorize[0]);
      const mme=(t.must_memorize_en&&t.must_memorize_en[0])||(t.must_memorize&&t.must_memorize[0]);
      if (mme) mmE.push(mme);
    }
    const tA=mod.title||mod.title_en||moduleId, tE=mod.title_en||mod.title||moduleId;
    return {
      must_know_today:[...new Set(mkA)].slice(0,3),must_know_today_en:[...new Set(mkE)].slice(0,3),
      must_memorize_today:[...new Set(mmA)].slice(0,2),must_memorize_today_en:[...new Set(mmE)].slice(0,2),
      ai_note_ar:'\u0631\u0643\u0651\u0632 \u0639\u0644\u0649 '+tA+'. \u0628\u0639\u062f \u0627\u0644\u062f\u0631\u0627\u0633\u0629 \u062d\u0627\u0648\u0644 \u0634\u0631\u062d \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u0628\u0643\u0644\u0645\u0627\u062a\u0643 \u0627\u0644\u062e\u0627\u0635\u0629.',
      ai_note_en:'Focus on '+tE+'. After studying, explain the concept in your own words.'
    };
  }

  function _buildCrossLink(courseId,moduleId,isAr) {
    if (!curriculumMap||!curriculumMap.cross_course_clusters) return {active:false};
    const prefix=courseId+'_'+moduleId;
    const cl=curriculumMap.cross_course_clusters.find(c=>(c.topics||[]).some(t=>t.startsWith(prefix)));
    if (!cl) return {active:false};
    const tip=isAr?(cl.study_tip||''):(cl.study_tip_en||cl.study_tip||'');
    const name=isAr?(cl.cluster_name||''):(cl.cluster_name_en||cl.cluster_name||'');
    return (tip||name) ? {active:true,message:'\uD83D\uDD17 '+name+(tip?': '+tip:'')} : {active:false};
  }

  function materializeHybridPlan(skeleton,repairedResult,aiContent,isAr) {
    const allAssign=[...(repairedResult.repaired_assignments||[]),...(repairedResult.spaced_reviews||[])];
    const bySlotId={};
    for (const a of allAssign) { if (!bySlotId[a.slot_id]) bySlotId[a.slot_id]=[]; bySlotId[a.slot_id].push(a); }
    const slotMap=Object.fromEntries(skeleton.slots.map(s=>[s.slot_id,s]));
    const firstDate=skeleton.days.length?skeleton.days[0].date:userConfig.start_date;
    const byDate={};
    for (const d of skeleton.days) {
      byDate[d.date]={
        date:d.date, day_label:formatDate(d.date,'card'), day_type:d.day_type,
        week_number:Math.max(1,Math.floor((new Date(d.date+'T00:00:00')-new Date(firstDate+'T00:00:00'))/(7*86400000))+1),
        sessions:[]
      };
    }
    for (const day of skeleton.days) {
      const dayObj=byDate[day.date];
      if (!dayObj) continue;
      for (const slotId of (day.slot_ids||[])) {
        const slotAssigns=bySlotId[slotId];
        if (!slotAssigns||!slotAssigns.length) continue;
        const slot=slotMap[slotId];
        const primary=slotAssigns[0];
        const isGolden=slot&&slot.slot_type==='golden_review';
        const isReview=slotAssigns.every(a=>String(a.reason||'').startsWith('spaced_review'));
        const joinedMid=[...new Set(slotAssigns.map(a=>a.module_id))].join(' + ');
        const ck=primary.course_id+'/'+primary.module_id;
        const aiC=aiContent[ck]||{};
        const uniq=arr=>[...new Set(arr.filter(Boolean))];
        const mkT=[],mkTE=[],mmT=[],mmTE=[];
        for (const a of slotAssigns) {
          const lc=_buildLocalContent(a.course_id,a.module_id,isAr);
          mkT.push(...lc.must_know_today); mkTE.push(...lc.must_know_today_en);
          mmT.push(...lc.must_memorize_today); mmTE.push(...lc.must_memorize_today_en);
        }
        const courses=curriculumMap&&curriculumMap.courses;
        const cName=courses&&courses[primary.course_id]?(isAr?courses[primary.course_id].name:(courses[primary.course_id].name_en||courses[primary.course_id].name)):primary.course_id;
        const diff=Math.max(...slotAssigns.map(a=>{
          const m=courses&&courses[a.course_id]&&courses[a.course_id].modules&&courses[a.course_id].modules[a.module_id];
          if (!m||!m.topics||!m.topics.length) return 5;
          return Math.round(m.topics.reduce((s,t)=>s+((t.difficulty&&t.difficulty.total)||5),0)/m.topics.length);
        }));
        const mode=primary.mode||'deep';
        const lc=_buildLocalContent(primary.course_id,primary.module_id,isAr);
        const nar=aiC.ai_note_ar||lc.ai_note_ar||(isGolden?'\u2B50 \u0645\u0631\u0627\u062C\u0639\u0629 \u0630\u0647\u0628\u064A\u0629 \u2014 '+cName:'');
        const nen=aiC.ai_note_en||lc.ai_note_en||(isGolden?'\u2B50 Golden review \u2014 '+cName:'');
        const tar=aiC.daily_tip_ar||(mode==='deep'?'\u0627\u062F\u0631\u0633 '+joinedMid+' \u0628\u0639\u0645\u0642.':mode==='full'?'\u0627\u0642\u0631\u0623 '+joinedMid+' \u0628\u062A\u0631\u0643\u064A\u0632.':'\u0631\u0627\u062C\u0639 '+joinedMid+' \u0628\u0633\u0631\u0639\u0629.');
        const ten=aiC.daily_tip_en||(mode==='deep'?'Study '+joinedMid+' deeply.':mode==='full'?'Read '+joinedMid+' thoroughly.':'Quickly review '+joinedMid+'.');
        dayObj.sessions.push({
          session_number:dayObj.sessions.length+1,
          course_id:primary.course_id,module_id:joinedMid,course_name:cName,mode,
          units:slotAssigns.reduce((s,a)=>s+(a.units||1),0),
          difficulty_avg:diff,is_critical:(mode==='deep'&&diff>=8)||isGolden,
          is_review:isReview,is_golden:isGolden,
          ai_model:aiC.ai_note_ar?'deepseek_hybrid':'local_hybrid',
          ai_note:isAr?nar:nen,ai_note_ar:nar,ai_note_en:nen,
          must_know_today:uniq(mkT).slice(0,4),must_know_today_en:uniq(mkTE).slice(0,4),
          must_memorize_today:uniq(mmT).slice(0,3),must_memorize_today_en:uniq(mmTE).slice(0,3),
          daily_tip_ar:tar,daily_tip_en:ten,
          cross_link_alert:_buildCrossLink(primary.course_id,primary.module_id,isAr),
          completed:false,_snoozeCount:0
        });
      }
    }
    // Exam days
    for (const day of Object.values(byDate)) {
      if (day.day_type!=='exam') continue;
      const sd=skeleton.days.find(d=>d.date===day.date);
      const ecs=(sd&&sd.exam_courses)||[];
      day.sessions=ecs.map((cid,idx)=>{
        const courses=curriculumMap&&curriculumMap.courses;
        const cn=courses&&courses[cid]?(isAr?courses[cid].name:(courses[cid].name_en||courses[cid].name)):cid;
        return {
          session_number:idx+1,course_id:cid,module_id:isAr?'\u0627\u062E\u062A\u0628\u0627\u0631':'Exam',course_name:cn,mode:'exam',
          units:0,difficulty_avg:10,is_critical:false,is_review:false,is_golden:false,
          ai_note:isAr?'\uD83D\uDCDD \u0627\u062E\u062A\u0628\u0627\u0631 '+cn+' \u2014 \u0628\u0627\u0644\u062A\u0648\u0641\u064A\u0642!':'\uD83D\uDCDD '+cn+' Exam \u2014 Good luck!',
          ai_note_ar:'\uD83D\uDCDD \u0627\u062E\u062A\u0628\u0627\u0631 '+cn+' \u2014 \u0628\u0627\u0644\u062A\u0648\u0641\u064A\u0642!',
          ai_note_en:'\uD83D\uDCDD '+cn+' Exam \u2014 Good luck!',
          must_know_today:[],must_know_today_en:[],must_memorize_today:[],must_memorize_today_en:[],
          daily_tip_ar:'\u0627\u0644\u064A\u0648\u0645 \u0627\u062E\u062A\u0628\u0627\u0631 \u2014 \u062B\u0642 \u0628\u0646\u0641\u0633\u0643.',
          daily_tip_en:'Exam day \u2014 trust yourself.',
          cross_link_alert:{active:false},completed:false,_snoozeCount:0
        };
      });
    }
    const orderedDays=Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date))
      .filter(d=>d.sessions.length>0||d.day_type==='exam');
    const weekNums=[...new Set(orderedDays.map(d=>d.week_number))].sort((a,b)=>a-b);
    const totalW=weekNums.length;
    const weeks=weekNums.map((w,i)=>{
      const p=totalW>1?i/(totalW-1):0;
      const th=p===0?['\u0628\u0646\u0627\u0621 \u0627\u0644\u0623\u0633\u0627\u0633','Foundation Building']:
        p<0.4?['\u0627\u0644\u062A\u0639\u0645\u0642 \u0641\u064A \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645','Core Concepts']:
        p<0.7?['\u062A\u0639\u0645\u064A\u0642 \u0627\u0644\u0641\u0647\u0645 \u0648\u0627\u0644\u0631\u0628\u0637','Deepening & Linking']:
        p<0.9?['\u0627\u0644\u062A\u0643\u062B\u064A\u0641 \u0648\u0627\u0644\u062A\u0639\u0632\u064A\u0632','Intensification']:
              ['\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u062B\u0628\u064A\u062A','Review & Consolidation'];
      return {week_number:w,theme:th[0],theme_en:th[1]};
    });
    const aiUsed=Object.keys(aiContent).length;
    return {
      plan_type:userConfig.plan_type,generated_at:new Date().toISOString(),
      ai_model:aiUsed>0?'hybrid_deepseek':'hybrid_local',
      ai_status:aiUsed>0?'hybrid_ai_content':'hybrid_local_content',
      config:JSON.parse(JSON.stringify(userConfig)),
      plan_summary:{
        total_days:orderedDays.length,
        total_sessions:orderedDays.reduce((s,d)=>s+d.sessions.length,0),
        strategy_description_ar:aiUsed>0
          ?'\u0647\u062C\u064A\u0646 \u062D\u0642\u064A\u0642\u064A \u2014 \u0636\u0645\u0627\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A + DeepSeek \u064A\u0648\u0632\u0651\u0639 + \u0625\u0635\u0644\u0627\u062D \u062D\u062A\u0645\u064A'
          :'\u0647\u062C\u064A\u0646 \u0645\u062D\u0644\u064A \u2014 \u0636\u0645\u0627\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A + SM-2',
        strategy_description_en:aiUsed>0
          ?'True hybrid \u2014 all modules guaranteed + DeepSeek assigns + auto-repair'
          :'Local hybrid \u2014 all modules guaranteed + SM-2',
        strategy_description:aiUsed>0?'\u0647\u062C\u064A\u0646 \u062D\u0642\u064A\u0642\u064A':'\u0647\u062C\u064A\u0646 \u0645\u062D\u0644\u064A',
        ai_modules_enriched:aiUsed,weeks
      },
      days:orderedDays,
      critical_warnings:(repairedResult.validation_after&&repairedResult.validation_after.warnings)||[]
    };
  }

  async function generateHybridPlan() {
    const si=document.getElementById('start-date-input');
    userConfig.start_date=(si&&si.value)?si.value:getLocalTodayStr();
    hideError(); hideInfo();
    if (!window.HybridPlannerEngine) {
      showError(lang()==='ar'?'\u26A0\uFE0F \u0645\u062D\u0631\u0643 \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0647\u062C\u064A\u0646\u0629 \u063A\u064A\u0631 \u0645\u062D\u0645\u0651\u0644':'\u26A0\uFE0F Hybrid Engine not loaded');
      return;
    }
    const isAr=lang()==='ar';
    const ac=Object.entries(userConfig.courses||{}).filter(function(e){return e[1].active;});
    if (ac.length===0){showError(isAr?'\u0641\u0639\u0651\u0644 \u0645\u0627\u062F\u0629 \u0648\u0627\u062D\u062F\u0629.':'Enable at least one course.');return;}
    showStep(4);
    const lEl=document.getElementById('loading-screen'),cEl=document.getElementById('plan-content');
    lEl.classList.add('active'); cEl.style.display='none';
    cleanupLoadingIntervals();
    const adv=setupInteractiveLoading(isAr);
    adv(0,10);

    // STEP 1: Skeleton
    let skeleton,payload;
    try {
      skeleton=window.HybridPlannerEngine.buildSkeleton(curriculumMap,userConfig);
      payload=window.HybridPlannerEngine.buildAssignmentPayload(curriculumMap,userConfig,skeleton);
      const totalD=payload.modules.reduce(function(s,m){return s+m.required_units;},0);
      const studyC=skeleton.slots.filter(function(s){return s.slot_type==='study';}).reduce(function(s,sl){return s+sl.unit_capacity;},0);
      console.log('Skeleton: '+skeleton.slots.length+' slots | Demand: '+totalD+' units | Capacity: '+studyC+' units');
      if (totalD>studyC) {
        showInfo(isAr
          ?'\u26A0\uFE0F \u0627\u0644\u0637\u0627\u0642\u0629 (' +studyC+ ' \u062C\u0644\u0633\u0629) \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u0637\u0644\u0628 (' +totalD+ ' \u0648\u062D\u062F\u0629). \u0633\u064A\u062A\u0645 \u0625\u0639\u0637\u0627\u0621 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629 \u0644\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.'
          :'\u26A0\uFE0F Capacity (' +studyC+ ' sessions) < Demand (' +totalD+ ' units). Primary modules will be prioritized.');
      }
    } catch(e) {
      console.error('Skeleton failed:',e);
      cleanupLoadingIntervals();lEl.classList.remove('active');cEl.style.display='';
      showError(isAr?'\u0641\u0634\u0644 \u0628\u0646\u0627\u0621 \u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0642\u0648\u064A\u0645.':'Failed to build skeleton.');return;
    }
    if (!skeleton.slots.filter(function(s){return s.slot_type==='study';}).length) {
      cleanupLoadingIntervals();lEl.classList.remove('active');cEl.style.display='';
      showError(isAr?'\u26A0\uFE0F \u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u064A\u0627\u0645 \u062F\u0631\u0627\u0633\u0629 \u0645\u062A\u0627\u062D\u0629.':'\u26A0\uFE0F No study days available.');return;
    }
    adv(1,20);
    const prompt=buildHybridAIPrompt(skeleton,payload,isAr);
    console.log('Prompt: '+prompt.length+' chars');
    adv(2,35);
    let aiContent={},aiAssignment={assignments:[]};
    try {
      const ctrl=new AbortController();
      const tid=setTimeout(function(){ctrl.abort(new DOMException('timeout','TimeoutError'));},120000);
      const resp=await fetch(CLOUDFLARE_WORKER_URL,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages:[
            {role:'system',content:'You are a study schedule optimizer. Respond with clean JSON only. No markdown.'},
            {role:'user',content:prompt}
          ],
          max_tokens:8192,temperature:0.2
        }),
        signal:ctrl.signal
      });
      clearTimeout(tid);
      adv(3,60);
      if (!resp.ok){const eb=await resp.text().catch(function(){return '';});throw new Error('HTTP '+resp.status+': '+eb.substring(0,150));}
      const data=await resp.json();
      if (data.error) throw new Error(data.message_ar||data.message_en||data.error);
      const text=data.text||(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      console.log('AI response: '+text.length+' chars');
      const parsed=tryParseJSON(text);
      if (!parsed) throw new Error('Invalid JSON from AI');
      const p2=parseHybridAIResponse(parsed);
      console.log('Parsed: '+p2.assignments.length+' assignments, '+Object.keys(p2.content).length+' content entries');
      aiAssignment={assignments:p2.assignments};
      aiContent=p2.content;
    } catch(aiErr) {
      console.warn('AI failed, using local repair:',aiErr.message);
      showInfo(isAr
        ?'\u26A0\uFE0F \u0627\u0644\u0630\u0643\u0627\u0621 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D (' +aiErr.message.substring(0,50)+ '). \u0633\u064A\u062A\u0645 \u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u0645\u062D\u0644\u064A\u0651\u0627\u064B \u0628\u0636\u0645\u0627\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A.'
        :'\u26A0\uFE0F AI unavailable. All modules will be scheduled locally.');
    }
    adv(4,75);
    let repaired;
    try {
      repaired=window.HybridPlannerEngine.repairAssignment(curriculumMap,userConfig,skeleton,aiAssignment);
      const va=repaired.validation_after;
      console.log('Repair: errors='+va.errors.length+' deficits='+va.deficits.length);
      if (va.deficits.length>0) console.warn('Still unscheduled:',va.deficits.map(function(d){return d.course_id+'/'+d.module_id;}).join(', '));
    } catch(e){console.error('Repair failed:',e);_hybridFallback(lEl,cEl,isAr,adv);return;}
    try {
      const reviews=window.HybridPlannerEngine.injectSpacedReviews(skeleton,repaired.repaired_assignments);
      repaired.repaired_assignments=[...repaired.repaired_assignments,...reviews].sort(function(a,b){return a.date.localeCompare(b.date);});
      repaired.spaced_reviews=reviews;
      console.log('Spaced reviews injected: '+reviews.length);
    } catch(e){console.warn('Spaced reviews (non-fatal):',e);}
    adv(5,90);
    let plan;
    try {plan=materializeHybridPlan(skeleton,repaired,aiContent,isAr);}
    catch(e){console.error('Materialize failed:',e);_hybridFallback(lEl,cEl,isAr,adv);return;}
    adv(6,100);
    localStorage.setItem(getPlanStorageKey(userConfig.plan_type),JSON.stringify(plan));
    localStorage.setItem('planner_config',JSON.stringify(userConfig));
    cleanupLoadingIntervals();lEl.classList.remove('active');cEl.style.display='';
    try{renderPlan(plan);}catch(re){
      console.error('Render error:',re);
      cEl.innerHTML='<div style="padding:2rem;text-align:center;color:#f43f5e;"><h3>\u26A0\uFE0F \u062E\u0637\u0623 \u0641\u064A \u0639\u0631\u0636 \u0627\u0644\u062C\u062F\u0648\u0644</h3><p>'+re.message+'</p></div>';
    }
    const aiUsed=Object.keys(aiContent).length;
    const def=(repaired.validation_after&&repaired.validation_after.deficits&&repaired.validation_after.deficits.length)||0;
    showInfo(aiUsed>0&&def===0
      ?(isAr?'\u26A1 \u062C\u062F\u0648\u0644 \u0647\u062C\u064A\u0646 \u0645\u062B\u0627\u0644\u064A \u2014 '+aiUsed+' \u0648\u062D\u062F\u0629 \u0628\u0645\u062D\u062A\u0648\u0649 AI + \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0645\u0636\u0645\u0648\u0646\u0629':'\u26A1 Perfect hybrid \u2014 '+aiUsed+' AI-enriched modules + all modules guaranteed')
      :aiUsed>0
      ?(isAr?'\u26A1 \u0647\u062C\u064A\u0646 \u2014 AI \u0623\u062B\u0631\u0649 '+aiUsed+' \u0648\u062D\u062F\u0629 | '+def+' \u062C\u064F\u062F\u0648\u0644\u062A \u0645\u062D\u0644\u064A\u0651\u0627\u064B':'\u26A1 Hybrid \u2014 AI enriched '+aiUsed+' | '+def+' scheduled locally')
      :(isAr?'\u26A1 \u0647\u062C\u064A\u0646 \u0645\u062D\u0644\u064A \u2014 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0645\u0636\u0645\u0648\u0646\u0629':'\u26A1 Local hybrid \u2014 all modules guaranteed'));
  }

  function _hybridFallback(lEl,cEl,isAr,adv) {
    console.warn('Full fallback to generateSmartLocalPlan');
    try {
      const plan=generateSmartLocalPlan();
      injectExamDays(plan);
      localStorage.setItem(getPlanStorageKey(userConfig.plan_type),JSON.stringify(plan));
      localStorage.setItem('planner_config',JSON.stringify(userConfig));
      cleanupLoadingIntervals();lEl.classList.remove('active');cEl.style.display='';
      renderPlan(plan);
      showInfo(isAr?'\u26A0\uFE0F \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062C\u062F\u0648\u0644 \u0645\u062D\u0644\u064A \u0643\u0628\u062F\u064A\u0644.':'\u26A0\uFE0F Generated local plan as fallback.');
    } catch(e) {
      cleanupLoadingIntervals();lEl.classList.remove('active');cEl.style.display='';
      showError(isAr?'\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062C\u062F\u0648\u0644.':'Plan generation failed.');
    }
  }


  // ─── Public API ───────────────────────────────────────────
  window.Planner = {
    selectPlanType, nextStep, prevStep, toggleCourse, setExamDate,
    toggleModule, setRating, setConfig, toggleRestDay, addBusyDate,
    removeBusyDate, onGeneratePlan, generateLocalPlan, generateHybridPlan,
    setPlanningMode, toggleComplete,
    continuePlan, newPlan, regenerate, flipCard, flipSession, nextCard, prevCard,
    setViewMode, exportPDF, buildPrintTable, toggle3D, getTodayBannerData,
    snoozeSession
  };

  // ─── Boot ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('garden:languageChanged', () => {
    // buildCourseList و updateFeasibility هي الدوال الفعلية
    // (كانت هنا renderCourseSelection/renderConfigOptions غير المعرّفتين → بُدّلتا)
    if (currentStep === 2) buildCourseList();
    if (currentStep === 3) updateFeasibility();
    if (currentStep === 4) {
      const plan = getCurrentPlan();
      if (plan) renderPlan(plan);
    }
  });

})();
