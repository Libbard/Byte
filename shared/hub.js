;(function(){ 'use strict';

 

 
const T = {
  ar: {
    pageTitle: 'فصلي الدراسي',
    createSemester: 'إنشاء فصل جديد',
    createHeroTitle: 'أنشئ فصلك الدراسي',
    createHeroDesc: 'اختر موادك من أي مستوى وابدأ رحلتك',
    semesterName: 'اسم الفصل',
    semesterNamePlaceholder: 'مثال: خريف 2026',
    create: 'إنشاء',
    cancel: 'إلغاء',
    addCourse: 'إضافة مادة',
    addCustom: 'إضافة مادة يدوياً',
    customNameAr: 'اسم المادة بالعربي',
    customNameEn: 'Course name in English',
    customCredits: 'الساعات المعتمدة',
    add: 'إضافة',
    removeCourse: 'إزالة',
    removeConfirm: 'إزالة المادة من الفصل؟ (التقدم محفوظ ولن يُحذف)',
    markComplete: 'اكتملت ✓',
    markIncomplete: 'لم تكتمل',
    openCourse: 'فتح المادة',
    archiveSemester: 'أرشفة الفصل',
    archiveConfirm: 'هل تريد أرشفة هذا الفصل وإنشاء فصل جديد فارغ؟',
    prevSemesters: '📦 الفصول السابقة',
    courses: 'مواد',
    credits: 'ساعة',
    completed: 'مكتملة',
    remaining: 'متبقية',
    modules: 'وحدة',
    progress: 'التقدم',
    search: 'ابحث عن مادة...',
    filterAll: 'الكل',
    filterByLevel: 'حسب المستوى',
    filterByCategory: 'حسب التصنيف',
    alreadyAdded: 'مضافة ✓',
    fcDue: 'بطاقة مستحقة',
    fcMastered: 'متقنة',
    close: 'إغلاق',
    edit: 'تعديل',
    renameSemester: 'تعديل اسم الفصل',
    noResults: 'لا توجد نتائج',
    back: 'العودة',
    settings: 'إعدادات',
    langBtn: 'EN',
    dueNotification: 'لديك {count} بطاقة مستحقة للمراجعة',
    completedCourses: 'مواد مكتملة',
    totalCredits: 'إجمالي الساعات',
    noArchive: 'لا توجد فصول مؤرشفة بعد',
    gpaLabel: 'المعدل',
    archivedOn: 'أرشف في',
    customCourse: 'مادة يدوية',
    levelOthers: 'مواد عامة',
  },
  en: {
    pageTitle: 'My Semester',
    createSemester: 'Create New Semester',
    createHeroTitle: 'Create Your Semester',
    createHeroDesc: 'Pick courses from any level and start your journey',
    semesterName: 'Semester Name',
    semesterNamePlaceholder: 'e.g., Fall 2026',
    create: 'Create',
    cancel: 'Cancel',
    addCourse: 'Add Course',
    addCustom: 'Add Custom Course',
    customNameAr: 'Course name in Arabic',
    customNameEn: 'Course name in English',
    customCredits: 'Credit Hours',
    add: 'Add',
    removeCourse: 'Remove',
    removeConfirm: 'Remove course from semester? (Progress is saved)',
    markComplete: 'Completed ✓',
    markIncomplete: 'Not completed',
    openCourse: 'Open Course',
    archiveSemester: 'Archive Semester',
    archiveConfirm: 'Archive this semester and create a new empty one?',
    prevSemesters: '📦 Previous Semesters',
    courses: 'Courses',
    credits: 'Credits',
    completed: 'Completed',
    remaining: 'Remaining',
    modules: 'Modules',
    progress: 'Progress',
    search: 'Search courses...',
    filterAll: 'All',
    filterByLevel: 'By Level',
    filterByCategory: 'By Category',
    alreadyAdded: 'Added ✓',
    fcDue: 'cards due',
    fcMastered: 'mastered',
    close: 'Close',
    edit: 'Edit',
    renameSemester: 'Rename Semester',
    noResults: 'No results found',
    back: 'Back',
    settings: 'Settings',
    langBtn: 'AR',
    dueNotification: 'You have {count} cards due for review',
    completedCourses: 'Completed courses',
    totalCredits: 'Total credits',
    noArchive: 'No archived semesters yet',
    gpaLabel: 'GPA',
    archivedOn: 'Archived on',
    customCourse: 'Custom course',
    levelOthers: 'General Courses',
  }
};

 
const GPA_SCALE = {
  'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.00,
  'C+': 2.50, 'C': 2.00, 'D+': 1.50, 'D': 1.00, 'F': 0.00
};

 
let catalog = null;
let semester = null;
let archive = [];
let currentFilter = 'all';
let currentSearch = '';

 
function t(key) {
  const lang = document.documentElement.getAttribute('lang') || 'ar';
  return T[lang]?.[key] || T.ar[key] || key;
}
function isAr() {
  return (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function darkenHex(hex, percent) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const f = 1 - percent / 100;
  const toHex = v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function gradientBg(color) {
  return 'linear-gradient(135deg, ' + color + ', ' + darkenHex(color, 22) + ')';
}

 
function arabicCount(n, singular, dual, plural, isAdj) {
  if (n === 0) return n + ' ' + plural;
  if (n === 1) return isAdj ? ('1 ' + singular) : (singular + ' واحدة');
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return n + ' ' + plural;
  return n + ' ' + singular;
}
function englishCount(n, singular, plural) {
  return n + ' ' + (n === 1 ? singular : plural);
}
function smartCount(n, arForms, enForms, isAdj) {
  return isAr()
    ? arabicCount(n, arForms[0], arForms[1], arForms[2], isAdj)
    : englishCount(n, enForms[0], enForms[1]);
}

 
function getSemesterMeta() {
  try {
    const raw = localStorage.getItem('garden_semester_meta');
    if (!raw) return { visits: 0, last_visit: 0 };
    return JSON.parse(raw);
  } catch (e) { return { visits: 0, last_visit: 0 }; }
}
function saveSemesterMeta(meta) {
  try { localStorage.setItem('garden_semester_meta', JSON.stringify(meta)); } catch (e) {}
}
function isVisitedToday(meta) {
  if (!meta.last_visit) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const last = new Date(meta.last_visit); last.setHours(0,0,0,0);
  return today.getTime() === last.getTime();
}
function getActivityState() {
  if (!semester) return 'none';
  if (semester.is_active === true || semester.is_active === undefined) return 'active';
  return 'inactive';
}
function getActivityTooltip() {
  const state = getActivityState();
  const meta = getSemesterMeta();
  if (state === 'inactive') {
    const visits = meta.visits || 0;
    const remaining = Math.max(0, 3 - visits);
    if (remaining > 0) {
      return isAr()
        ? 'زِر فصلك ' + remaining + ' ' + (remaining === 1 ? 'مرة' : (remaining === 2 ? 'مرتين' : 'مرات')) + ' لتفعيله · انقر للتثبيت'
        : 'Visit ' + remaining + ' more time' + (remaining > 1 ? 's' : '') + ' to activate · Click to pin';
    }
    return isAr() ? 'انقر للتثبيت' : 'Click to pin';
  }
  if (semester.is_pinned === true) {
    return isAr() ? 'مثبّت · انقر لإلغاء' : 'Pinned · Click to unpin';
  }
  return isAr() ? 'نشط · انقر للتثبيت' : 'Active · Click to pin';
}
function toggleActivity() {
  if (!semester) return;
  const isActive = semester.is_active === true || semester.is_active === undefined;
  if (isActive) {
    semester.is_active = false;
    semester.is_pinned = false;
  } else {
    semester.is_active = true;
    semester.is_pinned = true;
    semester.was_activated = true;
  }
  save();
  renderOverview();
  renderActiveDot();
}

 
function animateNumber(el, target, suffix, duration) {
  if (!el) return;
  suffix = suffix || '';
  duration = duration || 800;
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

 
function renderProgressRing(percent) {
  const fill = document.getElementById('progress-ring-fill');
  const circumference = 2 * Math.PI * 33;
  fill.setAttribute('stroke-dasharray', circumference);
  fill.setAttribute('stroke-dashoffset', circumference);
  if (percent > 0) {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        fill.setAttribute('stroke-dashoffset', circumference - (percent / 100) * circumference);
      });
    });
  }
}
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isAr()
    ? d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

 
async function init() {
  try {
    const res = await fetch('../shared/data/courses_catalog.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    catalog = await res.json();
  } catch (e) {
    console.error('[hub] courses_catalog.json fetch failed:', e);
    return;
  }

  try { semester = JSON.parse(localStorage.getItem('my_semester')) || null; } catch (e) { semester = null; }
  try { archive = JSON.parse(localStorage.getItem('semester_archive')) || []; } catch (e) { archive = []; }

  bindEvents();
  renderAll();
  updateHeaderButtons();

  document.addEventListener('garden:languageChanged', () => {
    updateHeaderButtons();
    if (catalog) renderAll();
  });
  document.addEventListener('garden:syncCompleted', () => {
    try { semester = JSON.parse(localStorage.getItem('my_semester')) || null; } catch (e) { semester = null; }
    try { archive = JSON.parse(localStorage.getItem('semester_archive')) || []; } catch (e) { archive = []; }
    if (catalog) renderAll();
  });
  document.addEventListener('garden:semesterActivated', () => {
    try { semester = JSON.parse(localStorage.getItem('my_semester')) || null; } catch (e) {}
    renderActiveDot();
    renderOverview();
  });
}

 
function updateHeaderButtons() {
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('langBtn');
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const icons = { dark: '🌙', dim: '🌆', light: '☀️' };
    themeIcon.textContent = icons[cur] || '🌙';
  }
}

 
function bindEvents() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const code = btn.getAttribute('data-code') || '';

    switch (action) {
      case 'show-create': showCreateSemesterModal(); break;
      case 'confirm-create': handleCreateSemester(); break;
      case 'show-add': showAddCourseModal(); break;
      case 'add-course': addCourse(code); break;
      case 'add-custom': handleAddCustom(); break;
      case 'remove-course': removeCourse(code); break;
      case 'toggle-complete': toggleComplete(code); break;
      case 'archive': archiveSemester(); break;
      case 'show-rename': showRenameModal(); break;
      case 'confirm-rename': handleRename(); break;
      case 'toggle-activity': toggleActivity(); break;
      case 'close-modal': closeAllModals(); break;
      case 'filter': setActiveFilter(btn); break;
      case 'notification-click': scrollToFirstDue(); break;
      case 'back': window.location.href = '../index.html'; break;
    }
  }, true);

  
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.startsWith('../L') || href.startsWith('../others/')) {
      try { sessionStorage.setItem('garden_nav_from_hub', '1'); } catch(e2) {}
    }
  }, true);

  const searchEl = document.getElementById('hub-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderCatalog();
    });
  }

  const nameInput = document.getElementById('semester-name-input');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleCreateSemester(); }
    });
  }

  const renameInput = document.getElementById('rename-input');
  if (renameInput) {
    renameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleRename(); }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

 
function handleCreateSemester() {
  const input = document.getElementById('semester-name-input');
  const name = (input?.value || '').trim();
  if (!name) { input?.focus(); return; }
  createSemester(name);
  closeAllModals();
}

function createSemester(name) {
  const now = new Date().toISOString();
  semester = {
    id: 'sem_' + Date.now(),
    name: name,
    courses: [],
    is_active: false,
    is_pinned: false,
    was_activated: false,
    created_at: now,
    updated_at: now
  };
  save();
  saveSemesterMeta({ visits: 0, last_visit: 0 });
  renderAll();
}

 
function addCourse(code) {
  if (!semester) return;
  if (semester.courses.some(c => c.code === code)) return;
  semester.courses.push({
    code: code,
    added_at: new Date().toISOString(),
    completed: false,
    completed_at: null,
    grade: null
  });
  save();
  renderCourseGrid();
  renderOverview();
  renderNotification();
  closeAllModals();
}

 
function handleAddCustom() {
  const arInput = document.getElementById('custom-name-ar');
  const enInput = document.getElementById('custom-name-en');
  const creditsInput = document.getElementById('custom-credits');
  const nameAr = (arInput?.value || '').trim();
  const nameEn = (enInput?.value || '').trim() || nameAr;
  const credits = parseInt(creditsInput?.value || '3', 10) || 3;
  if (!nameAr) { arInput?.focus(); return; }
  addCustomCourse(nameAr, nameEn, credits);
  closeAllModals();
}

function addCustomCourse(nameAr, nameEn, credits) {
  if (!semester) return;
  const code = '__CUSTOM_' + Date.now();
  semester.courses.push({
    code: code,
    custom: true,
    name_ar: nameAr,
    name_en: nameEn,
    credits: credits,
    icon: 'fa-solid fa-book',
    brand_color: '#64748b',
    added_at: new Date().toISOString(),
    completed: false,
    completed_at: null,
    grade: null
  });
  save();
  renderCourseGrid();
  renderOverview();
  closeAllModals();
}

 
function removeCourse(code) {
  if (!semester) return;
  if (!confirm(t('removeConfirm'))) return;
  semester.courses = semester.courses.filter(c => c.code !== code);
  save();
  renderCourseGrid();
  renderOverview();
  renderNotification();
}

 
function toggleComplete(code) {
  if (!semester) return;
  const entry = semester.courses.find(c => c.code === code);
  if (!entry) return;
  const wasIncomplete = !entry.completed;
  entry.completed = !entry.completed;
  entry.completed_at = entry.completed ? new Date().toISOString() : null;
  save();
  renderCourseGrid();
  renderOverview();
  if (wasIncomplete && entry.completed && window.Garden && typeof window.Garden.launchConfetti === 'function') {
    try { window.Garden.launchConfetti(); } catch(e) {}
    const card = document.querySelector('[data-code="' + CSS.escape(code) + '"]');
    if (card) {
      card.style.borderColor = '#34d399';
      card.style.boxShadow = '0 0 20px -4px rgba(52,211,153,0.5)';
      setTimeout(() => { card.style.borderColor = ''; card.style.boxShadow = ''; }, 2000);
    }
  }
}

 
function archiveSemester() {
  if (!semester) return;
  if (!confirm(t('archiveConfirm'))) return;

  let totalCredits = 0;
  let weightedSum = 0;
  let hasGrades = false;
  semester.courses.forEach(entry => {
    const info = getCourseInfo(entry);
    const credits = info?.credits || entry.credits || 3;
    if (entry.grade && GPA_SCALE[entry.grade] !== undefined) {
      weightedSum += GPA_SCALE[entry.grade] * credits;
      totalCredits += credits;
      hasGrades = true;
    }
  });
  const gpa = hasGrades ? (weightedSum / totalCredits) : null;

  archive.push({
    id: semester.id,
    name: semester.name,
    courses: semester.courses,
    gpa: gpa,
    total_credits: totalCredits,
    created_at: semester.created_at,
    archived_at: new Date().toISOString()
  });
  try { localStorage.setItem('semester_archive', JSON.stringify(archive)); } catch (e) {}

  localStorage.removeItem('my_semester');
  localStorage.removeItem('garden_semester_meta');
  semester = null;
  renderAll();
}

 
function getCourseInfo(entry) {
  if (!catalog || entry.custom) return null;
  return catalog.courses.find(c => c.code === entry.code) || null;
}

 
function getCourseProgress(entry) {
  const info = getCourseInfo(entry);
  const totalModules = info?.modules || 13;
  const result = { masteredCards: 0, dueCards: 0, quizzesDone: 0, totalQuizzes: totalModules, hasData: false };

  for (let m = 1; m <= totalModules; m++) {
    const fcKey = 'garden_' + entry.code + '_m' + m + '_fc';
    const quizKey = 'garden_' + entry.code + '_m' + m + '_quiz';
    const fcRaw = localStorage.getItem(fcKey);
    if (fcRaw) {
      try {
        const sm2 = JSON.parse(fcRaw);
        const states = Object.values(sm2);
        states.forEach(state => {
          if (state && typeof state === 'object') {
            result.hasData = true;
            if (state.interval && state.interval >= 21) result.masteredCards++;
            if (state.nextReview && state.nextReview <= Date.now()) result.dueCards++;
          }
        });
      } catch (e) {}
    }
    const quizRaw = localStorage.getItem(quizKey);
    if (quizRaw !== null) result.quizzesDone++;
  }
  return result;
}

 
function getCoursePercent(progress) {
  if (progress.totalQuizzes === 0) return 0;
  return Math.round((progress.quizzesDone / progress.totalQuizzes) * 100);
}

 
function renderAll() {
  const emptyState = document.getElementById('empty-state');
  const activeState = document.getElementById('active-state');
  if (!emptyState || !activeState) return;

  if (!semester) {
    emptyState.hidden = false;
    activeState.hidden = true;
    renderArchive();
    return;
  }
  emptyState.hidden = true;
  activeState.hidden = false;
  renderOverview();
  renderActiveDot();
  renderNotification();
  renderCourseGrid();
  renderArchive();
}

 
function renderOverview() {
  if (!semester) return;
  const nameEl = document.getElementById('overview-name');
  const statsEl = document.getElementById('overview-stats');
  const percentEl = document.getElementById('progress-percent');
  const detailEl = document.getElementById('progress-detail');
  if (!nameEl) return;

  nameEl.textContent = semester.name;

  const total = semester.courses.length;
  const done = semester.courses.filter(c => c.completed).length;
  const totalCredits = semester.courses.reduce((sum, c) => {
    const info = getCourseInfo(c);
    return sum + (info?.credits || c.credits || 3);
  }, 0);
  const remaining = total - done;

  
  let totalPercent = 0;
  semester.courses.forEach(entry => {
    if (entry.custom) { totalPercent += entry.completed ? 100 : 0; return; }
    if (entry.completed) { totalPercent += 100; return; }
    const progress = getCourseProgress(entry);
    totalPercent += getCoursePercent(progress);
  });
  const percent = total > 0 ? Math.round(totalPercent / total) : 0;
  renderProgressRing(percent);
  animateNumber(percentEl, percent, '%');
  if (detailEl) detailEl.textContent = done + ' / ' + total + ' ' + t('completed');

  if (statsEl) {
    statsEl.innerHTML =
      '<span class="stat-courses"><i class="fa-solid fa-book"></i> ' + smartCount(total, ['مادة','مادتين','مواد'], ['course','courses']) + '</span>' +
      '<span class="stat-completed"><i class="fa-solid fa-circle-check"></i> ' + smartCount(done, ['مكتملة','مكتملتين','مكتملة'], ['completed','completed'], true) + '</span>' +
      '<span class="stat-remaining"><i class="fa-solid fa-clock"></i> ' + smartCount(remaining, ['متبقية','متبقيتين','متبقية'], ['remaining','remaining'], true) + '</span>' +
      '<span class="stat-credits"><i class="fa-solid fa-scale-balanced"></i> ' + smartCount(totalCredits, ['ساعة','ساعتين','ساعات'], ['credit','credits']) + '</span>';
  }
}

 
function renderActiveDot() {
  const dot = document.getElementById('activity-dot');
  if (!dot) return;
  const state = getActivityState();
  if (state === 'none') { dot.hidden = true; return; }
  dot.hidden = false;
  const meta = getSemesterMeta();
  if (state === 'active') {
    dot.classList.add('active');
    dot.classList.remove('inactive');
    if (isVisitedToday(meta)) dot.classList.add('today');
    else dot.classList.remove('today');
    dot.title = isAr() ? 'نشط — انقر للإلغاء' : 'Active — click to deactivate';
  } else {
    dot.classList.remove('active', 'today');
    dot.classList.add('inactive');
    dot.title = isAr() ? 'تفعيل' : 'Activate';
  }
}

 
function renderNotification() {
  const bar = document.getElementById('hub-notification');
  const text = document.getElementById('hub-notification-text');
  if (!bar) return;
  if (!semester) { bar.hidden = true; return; }

  let totalDue = 0;
  semester.courses.forEach(entry => {
    if (entry.custom) return;
    const p = getCourseProgress(entry);
    totalDue += p.dueCards;
  });

  if (totalDue === 0) {
    bar.hidden = true;
  } else {
    bar.hidden = false;
    if (text) text.innerHTML = t('dueNotification').replace('{count}', '<span class="due-count">' + totalDue + '</span>');
  }
}

 
function scrollToFirstDue() {
  if (!semester) return;
  for (const entry of semester.courses) {
    if (entry.custom) continue;
    const p = getCourseProgress(entry);
    if (p.dueCards > 0) {
      const card = document.querySelector('[data-code="' + CSS.escape(entry.code) + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.outline = '2px solid #a78bfa';
        setTimeout(() => { card.style.outline = ''; }, 2000);
      }
      return;
    }
  }
}

 
function renderCourseGrid() {
  const grid = document.getElementById('hub-courses-grid');
  if (!grid || !semester) return;

  let html = '';
  semester.courses.forEach(entry => {
    html += buildCourseCard(entry);
  });
  html += '<button class="hub-add-btn" data-action="show-add">' +
    '<i class="fa-solid fa-plus"></i> ' + escapeHtml(t('addCourse')) + '</button>';
  grid.innerHTML = html;
}

 
function buildCourseCard(entry) {
  const info = getCourseInfo(entry);
  let icon, color, glow, name, levelLabel, credits, path, modules;

  if (entry.custom) {
    icon = entry.icon || 'fa-solid fa-book';
    color = entry.brand_color || '#64748b';
    glow = 'rgba(100,116,139,0.12)';    name = isAr() ? entry.name_ar : (entry.name_en || entry.name_ar);
    levelLabel = t('customCourse');
    credits = entry.credits || 3;
    path = null;
    modules = 0;
  } else if (info) {
    icon = info.icon;
    color = info.brand_color;
    glow = info.brand_glow;
    name = isAr() ? info.name_ar : info.name_en;
    levelLabel = isAr() ? info.level_name_ar : info.level_name_en;
    credits = info.credits;
    path = info.path;
    modules = info.modules;
  } else {
    return '';
  }

  const progress = entry.custom ? { masteredCards: 0, dueCards: 0, quizzesDone: 0, totalQuizzes: 0 } : getCourseProgress(entry);
  const percent = entry.custom ? 0 : getCoursePercent(progress);
  const completedClass = entry.completed ? ' completed' : '';

  let html = '<div class="hub-course-card' + completedClass + '" data-code="' + escapeHtml(entry.code) + '" style="--card-accent:' + color + '; --card-glow:' + glow + '">';
  html += '<div class="hub-card-header">';
  html += '<div class="hub-card-icon" style="background:' + gradientBg(color) + '"><i class="' + icon + '"></i></div>';
  html += '<div class="hub-card-info">';
  html += '<h3>' + escapeHtml(name) + '</h3>';
  html += '<span class="hub-card-level">' + escapeHtml(levelLabel) + ' · ' + smartCount(credits, ['ساعة','ساعتين','ساعات'], ['credit','credits']) + '</span>';
  html += '</div>';
  if (progress.dueCards > 0) {
    html += '<span class="hub-due-badge">🃏 ' + progress.dueCards + '</span>';
  }
  html += '</div>';

  if (!entry.custom) {
    html += '<div class="hub-card-progress">';
    html += '<div class="hub-progress-bar"><div class="hub-progress-fill" style="width:' + percent + '%"></div></div>';
    html += '<span class="hub-progress-text">' + percent + '%</span>';
    html += '</div>';
    html += '<div class="hub-card-stats">';
    html += '<span>🃏 ' + progress.masteredCards + ' ' + t('fcMastered') + '</span>';
    html += '<span>📝 ' + progress.quizzesDone + '/' + progress.totalQuizzes + '</span>';
    html += '</div>';
  }

  html += '<div class="hub-card-actions">';
  if (path) {
    html += '<a href="../' + path + 'index.html" class="hub-card-btn hub-card-btn-primary">' + escapeHtml(t('openCourse')) + '</a>';
  }
  html += '<button class="hub-card-btn" data-action="toggle-complete" data-code="' + escapeHtml(entry.code) + '">' + (entry.completed ? escapeHtml(t('markIncomplete')) : escapeHtml(t('markComplete'))) + '</button>';
  html += '<button class="hub-card-btn hub-card-btn-danger" data-action="remove-course" data-code="' + escapeHtml(entry.code) + '">' + escapeHtml(t('removeCourse')) + '</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

 
function showCreateSemesterModal() {
  const modal = document.getElementById('modal-create-semester');
  if (!modal) return;
  const input = document.getElementById('semester-name-input');
  modal.hidden = false;
  if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
}

 
function showAddCourseModal() {
  const modal = document.getElementById('modal-add-course');
  if (!modal) return;
  modal.hidden = false;
  currentFilter = 'all';
  currentSearch = '';
  const searchEl = document.getElementById('hub-search');
  if (searchEl) searchEl.value = '';
  renderFilters();
  renderCatalog();
}

 
function renderFilters() {
  const container = document.getElementById('course-filters');
  if (!container || !catalog) return;

  const filters = [
    { key: 'all', label: t('filterAll') },
    { key: 'L3', label: 'L3' },
    { key: 'L4', label: 'L4' },
    { key: 'L5', label: 'L5' },
    { key: 'L6', label: 'L6' },
    { key: 'L7', label: 'L7' },
    { key: 'L8', label: 'L8' },
    { key: 'others', label: isAr() ? 'مواد عامة' : 'General' },
  ];

  container.innerHTML = filters.map(f =>
    '<button class="course-filter-btn' + (f.key === currentFilter ? ' active' : '') + '" data-action="filter" data-filter="' + f.key + '">' + escapeHtml(f.label) + '</button>'
  ).join('');
}

function setActiveFilter(btn) {
  currentFilter = btn.getAttribute('data-filter') || 'all';
  renderFilters();
  renderCatalog();
}

 
function renderCatalog() {
  const container = document.getElementById('course-catalog');
  if (!container || !catalog) return;

  const addedCodes = new Set(semester ? semester.courses.map(c => c.code) : []);
  let courses = catalog.courses;

  if (currentFilter !== 'all') {
    courses = courses.filter(c => c.level === currentFilter);
  }
  if (currentSearch) {
    courses = courses.filter(c =>
      c.code.toLowerCase().includes(currentSearch) ||
      (c.name_ar || '').toLowerCase().includes(currentSearch) ||
      (c.name_en || '').toLowerCase().includes(currentSearch)
    );
  }

  if (courses.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem">' + escapeHtml(t('noResults')) + '</p>';
    return;
  }

  container.innerHTML = courses.map(c => {
    const added = addedCodes.has(c.code);
    const cls = added ? ' disabled' : '';
    const badge = added ? '<span class="catalog-item-badge">' + escapeHtml(t('alreadyAdded')) + '</span>' : '';
    const action = added ? '' : 'data-action="add-course" data-code="' + c.code + '"';
    return '<div class="catalog-item' + cls + '" ' + action + '>' +
      '<div class="catalog-item-icon" style="background:' + gradientBg(c.brand_color) + '"><i class="' + c.icon + '"></i></div>' +
      '<div class="catalog-item-info">' +
      '<div class="catalog-item-name">' + escapeHtml(isAr() ? c.name_ar : c.name_en) + ' <span style="color:var(--text-muted);font-weight:400">(' + c.code + ')</span></div>' +
      '<div class="catalog-item-meta">' + escapeHtml(isAr() ? c.level_name_ar : c.level_name_en) + ' · ' + smartCount(c.credits, ['ساعة','ساعتين','ساعات'], ['credit','credits']) + '</div>' +
      '</div>' +
      badge +
      '</div>';
  }).join('');
}

 
function renderArchive() {
  const section = document.getElementById('hub-archive-section');
  const list = document.getElementById('archive-list');
  const divider = document.getElementById('glass-divider');
  if (!section || !list) return;

  if (!archive || archive.length === 0) {
    section.hidden = true;
    if (divider) divider.hidden = true;
    return;
  }
  section.hidden = false;
  if (divider) divider.hidden = false;

  list.innerHTML = archive.map(item => {
    const gpaText = item.gpa !== null ? '<span class="archive-gpa">' + t('gpaLabel') + ': ' + item.gpa.toFixed(2) + '</span>' : '<span class="archive-gpa" style="color:var(--text-muted)">—</span>';
    return '<div class="archive-item">' +
      '<div>' +
      '<div class="archive-item-name">' + escapeHtml(item.name) + '</div>' +
      '<div class="archive-item-meta">' + smartCount((item.total_credits||0), ['ساعة','ساعتين','ساعات'], ['credit','credits']) + ' · ' + formatDate(item.archived_at) + '</div>' +
      '</div>' +
      gpaText +
      '</div>';
  }).join('');
}

 
function showRenameModal() {
  const modal = document.getElementById('modal-rename');
  if (!modal || !semester) return;
  const input = document.getElementById('rename-input');
  modal.hidden = false;
  if (input) {
    input.value = semester.name || '';
    setTimeout(() => { input.focus(); input.select(); }, 50);
  }
}

function handleRename() {
  if (!semester) return;
  const input = document.getElementById('rename-input');
  const name = (input?.value || '').trim();
  if (!name) { input?.focus(); return; }
  semester.name = name;
  save();
  renderOverview();
  closeAllModals();
}

 
function closeAllModals() {
  document.querySelectorAll('.hub-modal-overlay').forEach(m => { m.hidden = true; });
}

 
function save() {
  if (!semester) return;
  semester.updated_at = new Date().toISOString();
  try { localStorage.setItem('my_semester', JSON.stringify(semester)); } catch (e) {}
}

 
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
