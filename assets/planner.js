/* ═══════════════════════════════════════════════════════════════
   Digital Garden · planner.js v2.1
   Intelligent Study Planner — 4-step wizard + 3D card view
   ═══════════════════════════════════════════════════════════════ */

; (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────
  const CLOUDFLARE_WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';
  const CURRICULUM_MAP_URL = '../data/curriculum_map.json';
  const MAX_TOKENS = 8192; // DeepSeek hard limit per response — plan continues via multi-chunk

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
    // Inject additional CSS for new features (study link button)
    if (!document.getElementById('planner-extra-styles')) {
      const style = document.createElement('style');
      style.id = 'planner-extra-styles';
      style.textContent = `
        .card-study-link-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 14px; margin-top: 6px;
          font-size: 0.82rem; font-weight: 600;
          color: var(--accent, #a78bfa); background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.25); border-radius: 8px;
          text-decoration: none; cursor: pointer; transition: all 0.2s;
          justify-content: center; width: fit-content;
        }
        .card-study-link-btn:hover {
          background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.5);
          transform: translateY(-1px); box-shadow: 0 2px 8px rgba(167,139,250,0.15);
        }
        .session-study-link-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 12px; font-size: 0.8rem; font-weight: 600;
          color: var(--accent, #a78bfa); background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.25); border-radius: 8px;
          text-decoration: none; cursor: pointer; transition: all 0.2s;
        }
        .session-study-link-btn:hover {
          background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.5);
        }
      `;
      document.head.appendChild(style);
    }

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
    // Rebuild rating grid immediately so new modules get a rating row
    const courseBlock = document.getElementById('course-' + courseId);
    if (!courseBlock || !curriculumMap) return;
    const isAr = lang() === 'ar';
    const courseData = curriculumMap.courses[courseId];
    if (!courseData) return;
    const ratingGridEl = courseBlock.querySelector('.rating-grid');
    if (!ratingGridEl) return;
    ratingGridEl.innerHTML = cfg.included_modules.map(m => {
      const mod = courseData.modules[m];
      const modTitle = mod ? (isAr ? mod.title : mod.title_en) : m;
      if (!cfg.self_rating[m]) cfg.self_rating[m] = 'not_studied';
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
      `;
    }).join('');
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
          const d = new Date(cfg.exam_date + 'T00:00:00');  // local timezone
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

    const availModuleCapacity = availDays * userConfig.daily_sessions * (userConfig.modules_per_session || 1);

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
    const ratio = totalModules > 0 ? availModuleCapacity / totalModules : 999;

    let status, label;
    if (ratio >= 1.5) { status = 'comfortable'; label = isAr ? '✅ ممتاز — لديك وقت كافٍ' : '✅ Excellent — plenty of time'; }
    else if (ratio >= 1.0) { status = 'feasible'; label = isAr ? '✅ ممكن (مع هامش مراجعة)' : '✅ Feasible (with review margin)'; }
    else if (ratio >= 0.7) { status = 'tight'; label = isAr ? '⚠️ ضيّق — قد تحتاج تقليص الراحة' : '⚠️ Tight — may need fewer rest days'; }
    else { status = 'critical'; label = isAr ? '🔴 حرج — ركّز على أهم الوحدات فقط' : '🔴 Critical — focus on key modules only'; }

    statsEl.innerHTML = `
      <div class="feasibility-stat"><span class="feasibility-stat-icon">📅</span><div><div class="feasibility-stat-text">${isAr ? 'أيام متاحة' : 'Available days'}</div><div class="feasibility-stat-value">${availDays} ${isAr ? 'يوم' : 'days'}</div></div></div>
      <div class="feasibility-stat"><span class="feasibility-stat-icon">⏱️</span><div><div class="feasibility-stat-text">${isAr ? 'سعة الوحدات الكلية' : 'Total module capacity'}</div><div class="feasibility-stat-value">${availModuleCapacity}</div></div></div>
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
9. كل جلسة تستخدم "mids":[] (مصفوفة) وليس "mid":string — هذا إلزامي في كل الناتج.
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

    // ══════════════════════════════════════════════════════════════
    // SCHEMA FIX: AI يولّد mids:[] بعدد وحدات حقيقي لكل جلسة
    // بدلاً من mid:string + post-processing (كان يكسر منطق AI كاملاً)
    // ══════════════════════════════════════════════════════════════
    // للحالات: mps >= 1 → AI يضع Math.round(mps) وحدة في كل جلسة
    //          mps < 1  → AI يضع وحدة واحدة (سنقسّمها محلياً للعرض فقط)
    const effectiveMpsPerSession = mps >= 1 ? Math.round(mps) : 1;
    const effectiveDailyModules  = dailySessions * effectiveMpsPerSession; // الطاقة الحقيقية للـ AI

    // بناء مثال JSON يعكس الطاقة الحقيقية
    const exampleSessions = [];
    let _exampleMod = 1;
    for (let s = 1; s <= dailySessions; s++) {
      const midsArr = [];
      for (let m = 0; m < effectiveMpsPerSession; m++) {
        midsArr.push(`"M${String(_exampleMod++).padStart(2, '0')}"`);
      }
      exampleSessions.push(
        `{"sn":${s},"cid":"CS350","mids":[${midsArr.join(',')}],"mode":"deep","diff":7,"note":"ملاحظة مختصرة"}`
      );
    }
    const exampleSessionsStr = exampleSessions.join(',');

    // ملاحظة للـ AI توضّح قاعدة mids
    const midsSchemaNote = effectiveMpsPerSession === 1
      ? `- كل جلسة تغطي وحدة واحدة: "mids":["M01"] — مصفوفة بعنصر واحد دائماً`
      : `- كل جلسة تغطي ${effectiveMpsPerSession} وحدات: "mids":["M01","M02",...] — مصفوفة بـ ${effectiveMpsPerSession} عناصر بالضبط`;

    // بناء سطر التواريخ المتاحة الفعلية (بحد أقصى 90 تاريخ لتجنب overflow)
    const availableDatesStr = availableDates.length > 0
      ? availableDates.slice(0, 120).join(', ')
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
- الجلسات اليومية: ${dailySessions}
- وحدات لكل جلسة: ${effectiveMpsPerSession}
- ⚡ الطاقة اليومية الفعلية: ${effectiveDailyModules} وحدة (${dailySessions} جلسة × ${effectiveMpsPerSession} وحدة/جلسة)

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
⚠️ كل جلسة = ${effectiveMpsPerSession} وحدة بالضبط في مصفوفة mids — لا تكسر هذه القاعدة أبداً.
⚠️ لا تضع جلسات لمادة بعد تاريخ اختبارها. لا تضع أي جلسات في يوم الاختبار نفسه (أيام الاختبار مذكورة أعلاه).
⚠️ المراجعة الذهبية: اليوم الذي يسبق الاختبار مباشرة (وليس يوم الاختبار!) = day_type=golden_review, mode=flash لمادة الاختبار القادم.
⚠️ بعد الانتهاء من كل وحدات مادة → خصص ما تبقى من أيام قبل اختبارها للمراجعة.
⚠️ الترتيب التسلسلي إلزامي: ابدأ دائماً من M01 ثم M02 ثم M03... لكل مادة. الوحدة M01 أساسية لفهم بقية المنهج — لا تقفز لوحدات متقدمة!
⚠️ priority تحدد الـ mode (deep/full/flash) وليس ترتيب الدراسة. حتى لو M01 تقييمها "excellent"، يجب مراجعتها (flash) قبل M02 لأنها أساس.
⚠️ نوّع بين المواد يومياً (interleaving) مع الحفاظ على التسلسل داخل كل مادة.
⚠️ أضف مراجعة متباعدة (spaced review): راجع كل وحدة بعد يوم واحد، ثم 3 أيام، ثم 7 أيام من دراستها.
${midsSchemaNote}

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
⚠️ استخدم المفاتيح القصيرة: sn=session_number, cid=course_id, mids=[array of module_ids], diff=difficulty_avg
⚠️ mids يجب أن تكون مصفوفة دائماً حتى لو وحدة واحدة: "mids":["M01"] وليس "mid":"M01"
{"plan_summary":{"total_days":N,"total_sessions":N,"strategy":"وصف مختصر","weeks":[{"wn":1,"theme":"..."}]},"days":[{"date":"YYYY-MM-DD","wn":1,"type":"study","sessions":[${exampleSessionsStr}],"tip":"..."}]}

تذكر: استخدم فقط التواريخ من القائمة المتاحة أعلاه. كل يوم دراسي = ${dailySessions} جلسات × ${effectiveMpsPerSession} وحدة/جلسة = ${effectiveDailyModules} وحدة/يوم. أنشئ أيام لكل التواريخ المتاحة — لا تحذف أياً منها!`;
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
        // ★ NEW SCHEMA: mids[] → join with " + " for display
        // Backward compat: fall back to mid (old schema) or module_id
        let resolvedModuleId;
        if (Array.isArray(s.mids) && s.mids.length > 0) {
          resolvedModuleId = s.mids.join(' + ');
        } else {
          resolvedModuleId = s.mid || s.module_id || '';
        }

        // Expand compact keys → full keys
        const session = {
          session_number: s.sn || s.session_number || 1,
          course_id: s.cid || s.course_id || '',
          module_id: resolvedModuleId,
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
        // Handles compound module IDs from new schema: "M01 + M02" or "M01 + M02 + M03"
        if (session.must_know_today.length === 0 && curriculumMap?.courses) {
          const course = curriculumMap.courses[session.course_id];
          if (course) {
            // Parse all module IDs: "M01 + M02" → ["M01", "M02"]
            // Also strips part labels: "M01 (1/2)" → "M01"
            const modIds = session.module_id
              .split(/\s*\+\s*/)
              .map(s => s.trim().replace(/\s*\(.*\)/, ''));
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

  // ── Enforce modules_per_session (Post-Processor) ──────────
  // ★ ARCHITECTURE NOTE:
  //   mps >= 1 → AI نفسه يولّد mids[] بالعدد الصحيح — لا حاجة لمعالجة هنا
  //   mps <  1 → نحتاج تقسيم الوحدة الواحدة لأجزاء (عرض فقط)
  // الدالة تبقى للتقسيم فقط، وتُتجاهل تماماً عند mps >= 1
  function enforceModulesPerSession(planData) {
    if (!planData?.days || !planData.config) return planData;
    const mps = planData.config.modules_per_session || 1;

    // ★ SKIP for mps >= 1: AI already generated the correct mids[] schema
    if (mps >= 1) return planData;

    // ─── SPLIT ONLY (mps < 1): split each module into 1/mps visible parts ───

    const dailySessions = planData.config.daily_sessions || 2;
    const isAr = lang() === 'ar';

    // ── Step A: Separate fixed days (exam/golden) from study days ──
    const fixedDays = [];
    const studySessions = [];

    for (const day of planData.days) {
      if (day.day_type === 'exam' || day.day_type === 'golden_review') {
        fixedDays.push(day);
        continue;
      }
      for (const s of (day.sessions || [])) {
        if (s.mode !== 'exam') {
          studySessions.push({ ...s, _originalDate: day.date });
        }
      }
    }

    // ── Step B: Split each session → (1/mps) parts ──
    const sessionsPerMod = Math.round(1 / mps);
    const transformedSessions = [];

    for (const s of studySessions) {
      const mid = s.module_id || '';
      if (mid.includes('(') && mid.includes('/')) {
        transformedSessions.push(s); // already split
        continue;
      }
      for (let p = 0; p < sessionsPerMod; p++) {
        transformedSessions.push({
          ...s,
          module_id: `${mid} (${p + 1}/${sessionsPerMod})`,
          ai_note_ar: p === 0
            ? (s.ai_note_ar || (isAr ? '📖 الجزء الأول — ركز على المفاهيم الأساسية' : ''))
            : (isAr ? `📖 الجزء ${p + 1} — أكمل ما بدأته` : ''),
          ai_note_en: p === 0
            ? (s.ai_note_en || 'Part 1 — Focus on core concepts')
            : `Part ${p + 1} — Continue where you left off`
        });
      }
    }
    console.log(`✂️ MPS=${mps}: Split ${studySessions.length} sessions → ${transformedSessions.length} parts`);

    // ── Step C: Build list of available study dates ──
    const fixedDates = new Set(fixedDays.map(d => d.date));
    const restDays = planData.config.rest_days || [];
    const busyDates = planData.config.busy_dates || [];
    const examDatesSet = new Set();
    if (planData.config.courses) {
      for (const [, cfg] of Object.entries(planData.config.courses)) {
        if (cfg.exam_date) examDatesSet.add(cfg.exam_date);
      }
    }

    // Determine date range from the original plan
    const allPlanDates = planData.days.map(d => d.date).sort();
    const startStr = planData.config.start_date || allPlanDates[0] || getLocalTodayStr();
    const endStr = allPlanDates[allPlanDates.length - 1] || startStr;
    const startD = new Date(startStr + 'T00:00:00');
    const endD = new Date(endStr + 'T00:00:00');
    // Extend range if we have more sessions than available slots
    const neededDays = Math.ceil(transformedSessions.length / dailySessions);
    const totalCalDays = Math.max(
      Math.ceil((endD - startD) / 86400000) + 1,
      neededDays + 30 // buffer for rest days
    );

    const availableStudyDates = [];
    for (let i = 0; i < totalCalDays; i++) {
      const d = new Date(startD);
      d.setDate(d.getDate() + i);
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (restDays.includes(dayName)) continue;
      if (busyDates.includes(dateStr)) continue;
      if (examDatesSet.has(dateStr)) continue;
      if (fixedDates.has(dateStr)) continue; // Don't overwrite fixed days

      availableStudyDates.push(dateStr);
    }

    // ── Step D: Redistribute sessions into available dates ──
    // ★ Respect exam dates: don't place a course's sessions on/after its exam
    const courseExamDates = {};
    if (planData.config.courses) {
      for (const [cid, cfg] of Object.entries(planData.config.courses)) {
        if (cfg.exam_date) courseExamDates[cid] = cfg.exam_date;
      }
    }

    const newStudyDays = [];
    let sessionIdx = 0;
    const firstDate = planData.days[0]?.date || startStr;
    const skippedSessions = []; // Sessions that can't be placed (past exam)

    for (const dateStr of availableStudyDates) {
      if (sessionIdx >= transformedSessions.length) break;

      const daySessions = [];
      while (daySessions.length < dailySessions && sessionIdx < transformedSessions.length) {
        const session = transformedSessions[sessionIdx];
        const courseExam = courseExamDates[session.course_id];
        // Skip if this date is on/after the course's exam
        if (courseExam && dateStr >= courseExam) {
          skippedSessions.push(session);
          sessionIdx++;
          continue;
        }
        daySessions.push({ ...session, session_number: daySessions.length + 1 });
        sessionIdx++;
      }

      if (daySessions.length > 0) {
        const d = new Date(dateStr + 'T00:00:00');
        const weekNum = Math.floor((d - new Date(firstDate + 'T00:00:00')) / (7 * 86400000)) + 1;
        const hasReview = daySessions.some(s => s.mode === 'flash');
        const hasStudy = daySessions.some(s => s.mode !== 'flash' && s.mode !== 'exam');

        newStudyDays.push({
          date: dateStr,
          day_label: formatDate(dateStr, 'card'),
          week_number: weekNum,
          day_type: hasReview && hasStudy ? 'mixed' : hasReview ? 'light_review' : 'study',
          sessions: daySessions,
          daily_tip_ar: '', daily_tip_en: ''
        });
      }
    }

    // ── Step E: Merge fixed days + new study days, sort by date ──
    planData.days = [...fixedDays, ...newStudyDays].sort((a, b) => a.date.localeCompare(b.date));

    // Update totals
    planData.plan_summary.total_days = planData.days.length;
    planData.plan_summary.total_sessions = planData.days.reduce(
      (sum, d) => sum + (d.sessions?.length || 0), 0
    );

    // Warn if sessions were dropped
    const remaining = transformedSessions.length - sessionIdx;
    const totalDropped = remaining + skippedSessions.length;
    if (totalDropped > 0) {
      if (!planData.critical_warnings) planData.critical_warnings = [];
      if (remaining > 0) {
        planData.critical_warnings.push({
          type: 'mps_overflow',
          message: isAr
            ? `⚠️ لم يتسع الوقت لـ ${remaining} جلسة بعد تقسيم الوحدات`
            : `⚠️ ${remaining} session(s) couldn't fit after module splitting`
        });
      }
    }

    console.log(`✅ enforceModulesPerSession: ${planData.days.length} days, ${planData.plan_summary.total_sessions} sessions`);
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
            max_tokens: MAX_TOKENS,
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
{"days":[{"date":"YYYY-MM-DD","wn":N,"type":"study","sessions":[{"sn":1,"cid":"CS350","mids":["M01","M02"],"mode":"deep","diff":5,"note":"..."}],"tip":"..."}]}

⚠️ كل يوم = ${userConfig.daily_sessions} جلسات × ${Math.max(1, Math.round(userConfig.modules_per_session || 1))} وحدة/جلسة. أكمل من حيث توقفت — تابع التسلسل.
⚠️ mids يجب أن تكون مصفوفة دائماً: ["M01"] أو ["M01","M02"] — لا تستخدم mid:string`;

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

      // ★ Split sessions for mps < 1 (mps >= 1 is handled by AI via mids[] schema)
      enforceModulesPerSession(fullPlan);

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
    const startDate = userConfig.start_date ? new Date(userConfig.start_date + 'T00:00:00') : new Date();
    startDate.setHours(0, 0, 0, 0);
    const activeCourses = Object.entries(userConfig.courses).filter(([, c]) => c.active);
    const isAr = lang() === 'ar';
    const mps = userConfig.modules_per_session || 1;
    const sessionsPerDay = userConfig.daily_sessions || 2;

    // ── Helper: local date string (avoids UTC shift) ──
    function toLocalDateStr(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function isAvailable(d) {
      const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d.getDay());
      const dateStr = toLocalDateStr(d);
      return !userConfig.rest_days.includes(dayName) && !(userConfig.busy_dates || []).includes(dateStr);
    }

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

    // ══════════════════════════════════════════════════════════════
    // STEP 1: Topological Sort — Respect Prerequisites
    // ══════════════════════════════════════════════════════════════
    // Instead of sorting by composite priority (which breaks M01→M02 order),
    // we sort modules in NATURAL/PREREQUISITE order within each course.
    // Priority determines the STUDY MODE (deep/full/flash), NOT the order.

    function topologicalSortModules(cid, includedModules) {
      const courseData = curriculumMap.courses[cid];
      if (!courseData) return [...includedModules].sort();

      // Build dependency graph from curriculum_map prerequisites
      const prereqMap = {}; // moduleId → set of prerequisite moduleIds
      const allTopicToModule = {}; // topic_id → moduleId

      // Map topic IDs to their module
      for (const [mid, mod] of Object.entries(courseData.modules)) {
        for (const topic of (mod.topics || [])) {
          allTopicToModule[topic.topic_id] = mid;
        }
      }

      // Build prereqs at module level
      for (const mid of includedModules) {
        prereqMap[mid] = new Set();
        const mod = courseData.modules[mid];
        if (!mod) continue;
        for (const topic of (mod.topics || [])) {
          for (const prereqTopicId of (topic.prerequisites || [])) {
            const prereqModId = allTopicToModule[prereqTopicId];
            // Only consider prerequisites within the same course and included modules
            if (prereqModId && prereqModId !== mid && includedModules.includes(prereqModId)) {
              prereqMap[mid].add(prereqModId);
            }
          }
        }
      }

      // Kahn's algorithm for topological sort
      const inDegree = {};
      includedModules.forEach(m => inDegree[m] = 0);
      for (const [mid, prereqs] of Object.entries(prereqMap)) {
        inDegree[mid] = prereqs.size;
      }

      const queue = includedModules.filter(m => inDegree[m] === 0)
        .sort(); // Natural M01 < M02 ordering for equal-depth modules

      const sorted = [];
      while (queue.length > 0) {
        const current = queue.shift();
        sorted.push(current);
        // Remove this as a prerequisite from others
        for (const [mid, prereqs] of Object.entries(prereqMap)) {
          if (prereqs.has(current)) {
            prereqs.delete(current);
            inDegree[mid]--;
            if (inDegree[mid] === 0) {
              // Insert in natural order
              let insertIdx = queue.length;
              for (let qi = 0; qi < queue.length; qi++) {
                if (queue[qi] > mid) { insertIdx = qi; break; }
              }
              queue.splice(insertIdx, 0, mid);
            }
          }
        }
      }

      // If cycle detected (shouldn't happen), fall back to natural sort
      if (sorted.length < includedModules.length) {
        const remaining = includedModules.filter(m => !sorted.includes(m)).sort();
        sorted.push(...remaining);
      }

      return sorted;
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 2: Collect exam dates and sort courses by exam
    // ══════════════════════════════════════════════════════════════
    const courseExams = [];
    let latestExam = null;
    for (const [cid, cfg] of activeCourses) {
      const examDate = cfg.exam_date ? new Date(cfg.exam_date + 'T00:00:00') : null;
      courseExams.push({ cid, examDate });
      if (examDate && (!latestExam || examDate > latestExam)) latestExam = examDate;
    }
    courseExams.sort((a, b) => {
      if (!a.examDate && !b.examDate) return 0;
      if (!a.examDate) return 1;
      if (!b.examDate) return -1;
      return a.examDate - b.examDate;
    });

    // General plan: use end_date or 90 days. Midterm/Final: use latest exam.
    const endDate = latestExam
      ? new Date(latestExam)
      : userConfig.end_date
        ? new Date(userConfig.end_date + 'T00:00:00')
        : new Date(startDate.getTime() + 90 * 86400000);
    const totalCalendarDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000)) + 1;

    // ══════════════════════════════════════════════════════════════
    // STEP 3: Build module items in SEQUENTIAL (topological) order
    // ══════════════════════════════════════════════════════════════
    const ratingScoreMap = { not_studied: 1.0, weak: 0.7, good: 0.4, excellent: 0.15 };

    const allModulesByCourse = {}; // cid → [moduleItem] in sequential order

    for (const [cid, cfg] of activeCourses) {
      allModulesByCourse[cid] = [];
      // ★ KEY FIX: Use topological sort instead of priority sort
      const sortedModuleIds = topologicalSortModules(cid, cfg.included_modules);

      for (const m of sortedModuleIds) {
        const r = cfg.self_rating[m] || 'not_studied';
        const mod = curriculumMap.courses[cid]?.modules[m];
        const diff = mod?.module_difficulty || 5;
        const rawPriority = r === 'not_studied' ? 4 : r === 'weak' ? 3 : r === 'good' ? 2 : 1;
        const compositeScore = (ratingScoreMap[r] || 1.0) * 0.65 + (diff / 10) * 0.35;

        const mustKnow = [], mustKnowEn = [], mustMem = [], mustMemEn = [];
        if (mod?.topics) {
          for (const t of mod.topics) {
            if (t.must_know) mustKnow.push(...t.must_know);
            if (t.must_know_en) mustKnowEn.push(...t.must_know_en);
            if (t.must_memorize) mustMem.push(...t.must_memorize);
            if (t.must_memorize_en) mustMemEn.push(...t.must_memorize_en);
          }
        }

        // Cross-course cluster detection
        let crossLinkInfo = null;
        if (curriculumMap.cross_course_clusters) {
          for (const cluster of curriculumMap.cross_course_clusters) {
            const matchingTopics = (mod?.topics || []).filter(t => cluster.topics.includes(t.topic_id));
            if (matchingTopics.length > 0) {
              crossLinkInfo = {
                clusterName: isAr ? cluster.cluster_name : cluster.cluster_name_en,
                tip: isAr ? cluster.study_tip : (cluster.study_tip_en || cluster.study_tip),
                linkedTopics: cluster.topics.filter(t => !matchingTopics.map(mt => mt.topic_id).includes(t))
              };
              break;
            }
          }
        }

        allModulesByCourse[cid].push({
          courseId: cid, moduleId: m,
          priority: rawPriority,
          compositeScore,
          difficulty: diff, mod,
          mustKnow: mustKnow.slice(0, 3), mustKnowEn: mustKnowEn.slice(0, 3),
          mustMem: mustMem.slice(0, 2), mustMemEn: mustMemEn.slice(0, 2),
          // ★ KEY FIX: Mode is based on self-rating, but ORDER is sequential
          mode: rawPriority >= 3 ? 'deep' : rawPriority === 2 ? 'full' : 'flash',
          crossLinkInfo
        });
      }
      // ★ DO NOT sort by compositeScore — keep topological order!
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 4: modules_per_session expansion/collapse
    // ══════════════════════════════════════════════════════════════
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
            m.priority = Math.max(...group.map(g => g.priority));
            m.mode = m.priority >= 3 ? 'deep' : m.priority === 2 ? 'full' : 'flash';
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

    const studyQueueByCourse = {};
    for (const cid of Object.keys(allModulesByCourse)) {
      studyQueueByCourse[cid] = expandModules([...allModulesByCourse[cid]]);
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 5: Build all calendar dates
    // ══════════════════════════════════════════════════════════════
    const allDates = [];
    for (let i = 0; i < totalCalendarDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      allDates.push(d);
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 6: Day-by-day schedule builder
    // ══════════════════════════════════════════════════════════════
    const days = [];
    let sessionCount = 0;
    const studiedModules = [];       // {item, _studiedDate, _reviewCount}
    const reviewScheduled = new Set();
    const finishedCourses = new Set();
    let globalRROffset = 0;          // ★ FIX: persistent round-robin offset
    let dayCounter = 0;              // counts study days for SM-2 review timing

    // SM-2 review intervals (in study-days, not calendar days)
    const SM2_INTERVALS = [1, 3, 7, 14, 30];

    // ★ FIX 5: Helper — is this the last study day before an exam?
    // Used in golden review check and exam day golden review injection
    function _isLastStudyDayBefore(currentDate, examDate) {
      let next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      while (next < examDate) {
        if (isAvailable(next)) {
          // Also check it's not itself an exam day
          const nextStr = toLocalDateStr(next);
          const isExamDay = courseExams.some(ce => ce.examDate && toLocalDateStr(ce.examDate) === nextStr);
          if (!isExamDay) return false; // there IS a study day after this one
        }
        next.setDate(next.getDate() + 1);
      }
      return true; // this is genuinely the last study day
    }

    for (let i = 0; i < allDates.length; i++) {
      const d = allDates[i];
      const dateStr = toLocalDateStr(d);

      // ── Exam day check ──
      const examsToday = courseExams.filter(ce =>
        ce.examDate && toLocalDateStr(ce.examDate) === dateStr
      );
      if (examsToday.length > 0) {
        const examSessions = examsToday.map((ce, idx) => {
          const courseName = curriculumMap.courses[ce.cid]
            ? (isAr ? curriculumMap.courses[ce.cid].name : curriculumMap.courses[ce.cid].name_en)
            : ce.cid;
          return {
            session_number: idx + 1, course_id: ce.cid,
            module_id: isAr ? 'اختبار' : 'Exam', mode: 'exam',
            difficulty_avg: 10, is_critical: false,
            ai_note_ar: `📝 اختبار ${courseName} — بالتوفيق!`,
            ai_note_en: `📝 ${courseName} Exam — Good luck!`,
            must_know_today: [], must_know_today_en: [],
            must_memorize_today: [], must_memorize_today_en: [],
            completed: false
          };
        });
        examsToday.forEach(ce => finishedCourses.add(ce.cid));

        // ★ FIX 9: Check if other courses need golden review on this exam day
        const goldenForOthers = [];
        for (const ce of courseExams) {
          if (!ce.examDate || finishedCourses.has(ce.cid)) continue;
          const daysUntilExam = Math.ceil((ce.examDate - d) / 86400000);
          if (daysUntilExam >= 1 && daysUntilExam <= 5 && _isLastStudyDayBefore(d, ce.examDate)) {
            goldenForOthers.push(ce);
          }
        }

        if (goldenForOthers.length > 0) {
          for (const ge of goldenForOthers) {
            const cid = ge.cid;
            const courseModules = [...(allModulesByCourse[cid] || [])].sort((a, b) => b.priority - a.priority);
            const item = courseModules[0];
            if (item) {
              examSessions.push(buildSession(item, examSessions.length + 1, 'flash', {
                ar: `⭐ مراجعة ذهبية — ${curriculumMap.courses[cid]?.name || cid}`,
                en: `⭐ Golden review — ${curriculumMap.courses[cid]?.name_en || cid}`
              }));
            }
          }
          days.push({
            date: dateStr, day_label: formatDate(dateStr, 'card'),
            week_number: Math.floor((d - allDates[0]) / (7 * 86400000)) + 1, day_type: 'exam',
            sessions: examSessions,
            daily_tip_ar: '📝 يوم اختبار مع مراجعة للمادة التالية!',
            daily_tip_en: '📝 Exam day + golden review for next exam!'
          });
        } else {
          days.push({
            date: dateStr, day_label: formatDate(dateStr, 'card'),
            week_number: Math.floor((d - allDates[0]) / (7 * 86400000)) + 1, day_type: 'exam',
            sessions: examSessions,
            daily_tip_ar: '📝 يوم اختبار — توكل على الله وثق بنفسك!',
            daily_tip_en: '📝 Exam day — trust yourself and do your best!'
          });
        }
        continue;
      }

      if (!isAvailable(d)) continue;

      const liveCourseIds = courseExams
        .map(ce => ce.cid)
        .filter(cid => !finishedCourses.has(cid));

      if (liveCourseIds.length === 0 && studiedModules.length === 0) break;

      // ── Golden review: last study day before exam ──
      // ★ FIX 5: expanded window (up to 5 calendar days) + must be last available day
      let goldenExamCourses = [];
      for (const ce of courseExams) {
        if (!ce.examDate || finishedCourses.has(ce.cid)) continue;
        const daysUntilExam = Math.ceil((ce.examDate - d) / 86400000);
        // Expanded window: within 5 calendar days AND must be last available study day
        if (daysUntilExam >= 1 && daysUntilExam <= 5 && _isLastStudyDayBefore(d, ce.examDate)) {
          goldenExamCourses.push(ce);
        }
      }

      if (goldenExamCourses.length > 0) {
        const sessions = [];
        // Allocate sessions proportionally: golden review gets priority
        const goldenSlots = Math.min(sessionsPerDay, Math.max(1, Math.ceil(sessionsPerDay * 0.7)));
        const otherSlots = sessionsPerDay - goldenSlots;

        // Golden review sessions
        for (const ge of goldenExamCourses) {
          const cid = ge.cid;
          const courseModules = allModulesByCourse[cid] || [];
          // ★ FIX: review hardest + weakest (not just hardest)
          const reviewOrder = [...courseModules].sort((a, b) => {
            // Prioritize: not_studied/weak modules first, then by difficulty
            if (a.priority !== b.priority) return b.priority - a.priority;
            return b.difficulty - a.difficulty;
          });
          const slotsForThis = Math.ceil(goldenSlots / goldenExamCourses.length);
          const toReview = reviewOrder.slice(0, slotsForThis);
          for (const item of toReview) {
            if (sessions.length >= goldenSlots) break;
            sessions.push(buildSession(item, sessions.length + 1, 'flash', {
              ar: `⭐ مراجعة ذهبية — ${curriculumMap.courses[cid]?.name || cid}`,
              en: `⭐ Golden review — ${curriculumMap.courses[cid]?.name_en || cid}`
            }));
          }
        }

        // ★ FIX: Use remaining slots for other live courses (continue studying)
        if (otherSlots > 0) {
          const otherCourseIds = liveCourseIds.filter(
            cid => !goldenExamCourses.some(ge => ge.cid === cid)
          );
          for (let s = 0; s < otherSlots && otherCourseIds.length > 0; s++) {
            const cid = otherCourseIds[s % otherCourseIds.length];
            if (studyQueueByCourse[cid] && studyQueueByCourse[cid].length > 0) {
              const item = studyQueueByCourse[cid].shift();
              sessions.push(buildSession(item, sessions.length + 1));
              studiedModules.push({ ...item, _studiedDate: dateStr, _reviewCount: 0, _studyDayNum: dayCounter });
            }
          }
        }

        if (sessions.length > 0) {
          days.push({
            date: dateStr, day_label: formatDate(dateStr, 'card'),
            week_number: Math.floor((d - allDates[0]) / (7 * 86400000)) + 1, day_type: 'golden_review',
            sessions,
            daily_tip_ar: `⭐ مراجعة ذهبية — الاختبار قريب!`,
            daily_tip_en: `⭐ Golden review — exam is near!`
          });
          sessionCount += sessions.length;
          dayCounter++;
        }
        continue;
      }

      // ══════════════════════════════════════════════════════════════
      // Regular study/review day
      // ══════════════════════════════════════════════════════════════
      const sessions = [];

      const allStudyQueuesEmpty = liveCourseIds.every(
        cid => !studyQueueByCourse[cid] || studyQueueByCourse[cid].length === 0
      );

      if (allStudyQueuesEmpty && liveCourseIds.length > 0) {
        // ═══ Phase 2: All studied — pure review phase ═══
        const liveByExam = [...liveCourseIds].sort((a, b) => {
          const eA = courseExams.find(ce => ce.cid === a)?.examDate;
          const eB = courseExams.find(ce => ce.cid === b)?.examDate;
          if (!eA && !eB) return 0;
          if (!eA) return 1;
          if (!eB) return -1;
          return eA - eB;
        });

        // ★ FIX: Cycle through modules for review (not just hardest first every time)
        const reviewCandidates = [];
        for (const cid of liveByExam) {
          const mods = [...(allModulesByCourse[cid] || [])];
          // Rotate starting point using dayCounter for variety
          const offset = dayCounter % mods.length;
          const rotated = [...mods.slice(offset), ...mods.slice(0, offset)];
          for (const m of rotated) {
            const key = `${m.courseId}:${m.moduleId}:${dateStr}`;
            if (!reviewScheduled.has(key)) {
              reviewCandidates.push(m);
            }
          }
        }

        for (let s = 0; s < sessionsPerDay && s < reviewCandidates.length; s++) {
          const item = reviewCandidates[s];
          sessions.push(buildSession(item, sessions.length + 1, 'flash', {
            ar: `📖 مراجعة ما قبل الاختبار — ${curriculumMap.courses[item.courseId]?.name || item.courseId}`,
            en: `📖 Pre-exam review — ${curriculumMap.courses[item.courseId]?.name_en || item.courseId}`
          }));
          reviewScheduled.add(`${item.courseId}:${item.moduleId}:${dateStr}`);
        }
      } else {
        // ═══ Phase 1: Active study with spaced review ═══

        // ★ FIX: Spaced review works for ALL session counts
        // For 1 session/day: review every 3rd day (dedicate full day to review)
        // For 2 sessions/day: 1 review session every 3rd day
        // For 3+ sessions/day: 1 review slot per day
        let reviewSlots = 0;
        if (sessionsPerDay >= 3) {
          reviewSlots = Math.floor(sessionsPerDay / 3);
        } else if (dayCounter > 0 && dayCounter % 3 === 0 && studiedModules.length > 0) {
          reviewSlots = 1; // Every 3rd day, allocate 1 slot to review
        }
        const studySlots = sessionsPerDay - reviewSlots;

        // ── Round-robin distribution with GLOBAL offset ──
        let filled = 0;
        let consecutiveEmpty = 0;
        while (filled < studySlots && consecutiveEmpty < liveCourseIds.length) {
          const cid = liveCourseIds[globalRROffset % liveCourseIds.length];
          globalRROffset++; // ★ FIX: global, not reset per day
          if (studyQueueByCourse[cid] && studyQueueByCourse[cid].length > 0) {
            const item = studyQueueByCourse[cid].shift();
            sessions.push(buildSession(item, sessions.length + 1));
            studiedModules.push({ ...item, _studiedDate: dateStr, _reviewCount: 0, _studyDayNum: dayCounter });
            filled++;
            consecutiveEmpty = 0;
          } else {
            consecutiveEmpty++;
          }
        }

        // ★ FIX: If study slots not filled (queues empty), give slots to review
        if (filled < studySlots) {
          reviewSlots += (studySlots - filled);
        }

        // ── Spaced Review with SM-2 intervals ──
        if (reviewSlots > 0 && studiedModules.length > 0) {
          const reviewCandidates = studiedModules.filter(sm => {
            const daysSinceStudy = dayCounter - sm._studyDayNum;
            const nextReviewAt = SM2_INTERVALS[Math.min(sm._reviewCount, SM2_INTERVALS.length - 1)];
            const key = `${sm.courseId}:${sm.moduleId}:${dateStr}`;
            return daysSinceStudy >= nextReviewAt
              && !finishedCourses.has(sm.courseId)
              && !reviewScheduled.has(key);
          });
          // Sort: overdue reviews first, then by priority
          reviewCandidates.sort((a, b) => {
            const aOverdue = dayCounter - a._studyDayNum - SM2_INTERVALS[Math.min(a._reviewCount, SM2_INTERVALS.length - 1)];
            const bOverdue = dayCounter - b._studyDayNum - SM2_INTERVALS[Math.min(b._reviewCount, SM2_INTERVALS.length - 1)];
            if (bOverdue !== aOverdue) return bOverdue - aOverdue;
            return b.compositeScore - a.compositeScore;
          });

          for (let r = 0; r < reviewSlots && r < reviewCandidates.length; r++) {
            const item = reviewCandidates[r];
            sessions.push(buildSession(item, sessions.length + 1, 'flash', {
              ar: `🔄 مراجعة متباعدة (${item._reviewCount + 1}) — ${curriculumMap.courses[item.courseId]?.name || item.courseId}`,
              en: `🔄 Spaced review (${item._reviewCount + 1}) — ${curriculumMap.courses[item.courseId]?.name_en || item.courseId}`
            }));
            item._reviewCount++;
            reviewScheduled.add(`${item.courseId}:${item.moduleId}:${dateStr}`);
          }
        }
      }

      if (sessions.length > 0) {
        const hasReview = sessions.some(s => s.mode === 'flash');
        const hasStudy = sessions.some(s => s.mode !== 'flash' && s.mode !== 'exam');

        // ★ Add cross-course link alerts
        sessions.forEach(s => {
          const item = allModulesByCourse[s.course_id]?.find(m =>
            s.module_id.includes(m.moduleId)
          );
          if (item?.crossLinkInfo) {
            s.cross_link_alert = {
              active: true,
              message: isAr
                ? `🔗 ${item.crossLinkInfo.clusterName}: ${item.crossLinkInfo.tip}`
                : `🔗 ${item.crossLinkInfo.clusterName}: ${item.crossLinkInfo.tip}`
            };
          }
        });

        days.push({
          date: dateStr,
          day_label: formatDate(dateStr, 'card'),
          week_number: Math.floor((d - allDates[0]) / (7 * 86400000)) + 1,
          day_type: hasReview && hasStudy ? 'mixed' : hasReview ? 'light_review' : 'study',
          sessions,
          daily_tip_ar: '',
          daily_tip_en: ''
        });
        sessionCount += sessions.length;
        dayCounter++;
      }
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 6.5: POST-PROCESSING — Guarantee golden review for every exam
    // ══════════════════════════════════════════════════════════════
    // If no golden review exists for a course within 5 days before its exam,
    // create one — even on a rest day if necessary (as exception).
    for (const ce of courseExams) {
      if (!ce.examDate) continue;
      const examDateStr = toLocalDateStr(ce.examDate);

      // Check if golden review already exists for this course before its exam
      const hasGolden = days.some(day => {
        const dayD = new Date(day.date + 'T00:00:00');
        const diff = Math.ceil((ce.examDate - dayD) / 86400000);
        return diff >= 1 && diff <= 5 &&
          day.sessions?.some(s => s.course_id === ce.cid && (s.mode === 'flash' || s.mode === 'exam'));
      });

      if (!hasGolden) {
        // Find the closest day before exam to inject golden review
        for (let offset = 1; offset <= 3; offset++) {
          const candidateD = new Date(ce.examDate);
          candidateD.setDate(candidateD.getDate() - offset);
          const candidateStr = toLocalDateStr(candidateD);

          // Skip if it's another exam day
          if (courseExams.some(other => other.examDate && toLocalDateStr(other.examDate) === candidateStr)) continue;
          // Skip if before plan start
          if (candidateD < startDate) continue;

          const existingDay = days.find(dd => dd.date === candidateStr);
          const courseModules = [...(allModulesByCourse[ce.cid] || [])].sort((a, b) => b.priority - a.priority);
          const item = courseModules[0];
          if (!item) break;

          const goldenSession = buildSession(item, 1, 'flash', {
            ar: `⭐ مراجعة ذهبية استثنائية — ${curriculumMap.courses[ce.cid]?.name || ce.cid}`,
            en: `⭐ Special golden review — ${curriculumMap.courses[ce.cid]?.name_en || ce.cid}`
          });

          if (existingDay) {
            // Add golden review session to existing day
            goldenSession.session_number = existingDay.sessions.length + 1;
            existingDay.sessions.push(goldenSession);
            // Update day type if needed
            if (existingDay.day_type === 'study') existingDay.day_type = 'mixed';
          } else {
            // Create new day (even on rest day — exception for pre-exam review)
            const weekNum = allDates.length > 0
              ? Math.floor((candidateD - allDates[0]) / (7 * 86400000)) + 1
              : 1;
            days.push({
              date: candidateStr,
              day_label: formatDate(candidateStr, 'card'),
              week_number: weekNum,
              day_type: 'golden_review',
              sessions: [goldenSession],
              daily_tip_ar: '⭐ مراجعة ذهبية استثنائية — اليوم أُضيف خصيصاً لأن الاختبار قريب!',
              daily_tip_en: '⭐ Special golden review — this day was added because the exam is near!'
            });
          }
          break; // found a candidate, stop looking
        }
      }
    }
    // Re-sort days after post-processing
    days.sort((a, b) => a.date.localeCompare(b.date));

    // ══════════════════════════════════════════════════════════════
    // STEP 7: Build week labels with meaningful themes
    // ══════════════════════════════════════════════════════════════
    const weekSet = [...new Set(days.map(d => d.week_number))];
    const totalWeeks = weekSet.length;

    const weeks = weekSet.map((w, i) => {
      let theme, themeEn;
      const progress = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;

      if (progress === 0) { theme = 'بناء الأساس'; themeEn = 'Foundation Building'; }
      else if (progress < 0.4) { theme = 'التعمق في المفاهيم'; themeEn = 'Core Concepts'; }
      else if (progress < 0.7) { theme = 'تعميق الفهم والربط'; themeEn = 'Deepening & Linking'; }
      else if (progress < 0.9) { theme = 'التكثيف والتعزيز'; themeEn = 'Intensification'; }
      else { theme = 'مراجعة وتثبيت'; themeEn = 'Review & Consolidation'; }

      return { week_number: w, theme, theme_en: themeEn };
    });

    // ══════════════════════════════════════════════════════════════
    // STEP 8: Generate warnings for dropped/tight modules
    // ══════════════════════════════════════════════════════════════
    const warnings = [];
    for (const cid of Object.keys(studyQueueByCourse)) {
      const remaining = studyQueueByCourse[cid]?.length || 0;
      if (remaining > 0) {
        const modIds = studyQueueByCourse[cid].map(m => m.moduleId).join(', ');
        warnings.push({
          type: 'time_pressure',
          message: isAr
            ? `⚠️ لم يتسع الوقت لجدولة ${remaining} وحدة من ${cid}: ${modIds}`
            : `⚠️ Not enough time to schedule ${remaining} module(s) from ${cid}: ${modIds}`,
          affected_modules: studyQueueByCourse[cid].map(m => `${cid}_${m.moduleId}`)
        });
      }
    }

    return {
      plan_type: userConfig.plan_type,
      generated_at: new Date().toISOString(),
      ai_model: 'smart_local',
      ai_status: 'smart_local',
      config: { ...userConfig },
      plan_summary: {
        total_days: days.length,
        total_sessions: sessionCount,
        strategy_description_ar: 'جدول تكيّفي ذكي v4 — ترتيب تسلسلي يحترم المتطلبات + مراجعة متباعدة SM-2 + ربط مفاهيمي بين المواد',
        strategy_description_en: 'Adaptive smart plan v4 — sequential prerequisite-aware ordering + SM-2 spaced review + cross-course concept linking',
        strategy_description: 'جدول تكيّفي ذكي v4 — ترتيب تسلسلي يحترم المتطلبات + مراجعة متباعدة SM-2 + ربط مفاهيمي بين المواد',
        weeks
      },
      days,
      critical_warnings: warnings
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
    // ★ FIX: Preserve sessions on golden_review and exam days — only clean up regular study days
    let changed = false;
    plan.days.forEach(day => {
      if (!day.sessions) { day.sessions = []; return; }
      if (day.date <= todayStr) return; // don't modify past/today
      if (day.day_type === 'exam' || day.day_type === 'golden_review') return; // ★ never touch these
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

  // ─── Study Material URL Helper ────────────────────────────
  function getStudyUrl(courseId, moduleId) {
    if (!courseId || !moduleId) return null;
    const cid = courseId.toLowerCase(); // CS350 → cs350
    // Extract first module number from compound/part IDs like "M01 + M02" or "M01 (1/2)"
    const match = moduleId.match(/M(\d+)/);
    if (!match) return null;
    const modNum = parseInt(match[1]); // M01 → 1
    return `../${cid}/M${modNum}.html`;
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
      const modeEmoji = session.mode === 'deep' ? '🔴' : session.mode === 'full' ? '🟡' : session.mode === 'exam' ? '📝' : '🟢';
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
                <span class="card-session-badge ${diffLabel}">${modeEmoji} ${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
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
              ${session.mode !== 'exam' && getStudyUrl(session.course_id, session.module_id) ? `
              <a class="card-study-link-btn" href="${getStudyUrl(session.course_id, session.module_id)}" 
                 onclick="event.stopPropagation()" target="_blank" rel="noopener">
                📚 ${isAr ? 'انتقل للدراسة' : 'Go to Study'}
              </a>` : ''}
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
          <div class="card-counter">${isAr ? `اليوم ${currentCardIndex + 1} من ${allDayCards.length} — ${formatDate(day.date, 'card')}` : `Day ${currentCardIndex + 1} of ${allDayCards.length}`}</div>
          ${toggle3DBtn}
        </div>
        <!-- Day label -->
        <div class="card-day-header ${isToday ? 'today' : ''} ${day.day_type === 'exam' ? 'day-type-exam' : day.day_type === 'golden_review' ? 'day-type-golden' : ''}">
          <div class="card-day-label-group">
            <span class="card-day-text">${formatDate(day.date, 'card')}</span>
            ${day.day_type === 'exam' ? (() => {
    const names = [...new Set((day.sessions || []).filter(s => s.mode === 'exam').map(s =>
        curriculumMap?.courses?.[s.course_id]
            ? (isAr ? curriculumMap.courses[s.course_id].name : curriculumMap.courses[s.course_id].name_en)
            : s.course_id
    ))].join(' · ');
    return `<span class="day-type-badge exam-badge">📝 ${isAr ? 'اختبار' : 'Exam'}: ${names}</span>`;
})() : ''}
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
        if (dayType === 'exam') {
          const names = [...new Set((day.sessions || []).filter(s => s.mode === 'exam').map(s =>
            curriculumMap?.courses?.[s.course_id]
              ? (isAr ? curriculumMap.courses[s.course_id].name : curriculumMap.courses[s.course_id].name_en)
              : s.course_id
          ))].join(' · ');
          dayTypeBadge = `<span class="day-type-badge exam-badge">📝 ${isAr ? 'اختبار' : 'Exam'}: ${names}</span>`;
        }
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
                <span class="session-badge ${diffLabel}">${modeEmoji} ${isAr ? 'جلسة' : 'Session'} ${session.session_number}</span>
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
                ${session.mode !== 'exam' && getStudyUrl(session.course_id, session.module_id) ? `
                <a class="session-action-btn session-study-link-btn" href="${getStudyUrl(session.course_id, session.module_id)}" target="_blank" rel="noopener">
                  📚 ${isAr ? 'انتقل للدراسة' : 'Go to Study'}
                </a>` : ''}
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
    _cardIndexInitialized = false; // ★ FIX: auto-jump to today on resume
    showStep(4);
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('plan-content').style.display = '';
    renderPlan(plan);
  }



  function regenerate() {
    _cardIndexInitialized = false; // ★ FIX: ensure new plan auto-jumps to today
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
      // golden_review مقبولة إذا فيها مساحة
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
