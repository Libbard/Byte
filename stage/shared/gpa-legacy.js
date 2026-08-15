;(function () {
  'use strict';

  /*@3.GPLJ.1*/

  const LS_GRADES = 'gpa_grades';
  const LS_SEMESTER = 'my_semester';
  const LS_ARCHIVE = 'semester_archive';
  /*@3.GPLJ.2*/
  const CATALOG_PATH = '../shared/data/courses_catalog.json';

  /*@3.GPLJ.3*/
  const GPA_SCALE = {
    'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.00,
    'C+': 2.50, 'C': 2.00, 'D+': 1.50, 'D': 1.00, 'F': 0.00
  };
  /*@3.GPLJ.4*/
  const GRADE_OPTIONS = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'TR'];
  const TR_GRADE = 'TR';

  /*@3.GPLJ.5*/
  const GRADE_COLORS = {
    'A+': '#10b981', 'A': '#10b981', 'B+': '#3b82f6', 'B': '#3b82f6',
    'C+': '#f59e0b', 'C': '#f59e0b', 'D+': '#f97316', 'D': '#f97316', 'F': '#ef4444'
  };

  /*@3.GPLJ.6*/
  const T = {
    ar: {
      title: 'المعدل الدراسي',
      cumGpa: 'المعدل التراكمي',
      semGpa: 'معدل الفصل',
      course: 'المادة',
      credits: 'ساعات',
      grade: 'التقدير',
      points: 'النقاط',
      noGrade: '—',
      totalCredits: 'إجمالي الساعات',
      totalPoints: 'إجمالي النقاط',
      whatIf: 'ماذا لو؟',
      whatIfDesc: 'جرّب درجات مختلفة للمواد بدون تقدير',
      expectedGpa: 'المعدل المتوقع',
      record: 'السجل الأكاديمي',
      currentSem: 'الفصل الحالي',
      prevSemesters: 'الفصول السابقة',
      exportPng: 'تصدير كصورة',
      addManual: 'إضافة مادة يدوياً',
      courseName: 'اسم المادة',
      empty: 'لا توجد مواد — أنشئ فصلك أولاً',
      outOf: 'من',
      semCredits: 'ساعة',
      semCourses: 'مواد',
      confirm: 'إضافة',
      cancel: 'إلغاء',
      remove: 'حذف',
      removeConfirm: 'حذف هذه المادة من حاسبة المعدل؟',
    },
    en: {
      title: 'GPA Calculator',
      cumGpa: 'Cumulative GPA',
      semGpa: 'Semester GPA',
      course: 'Course',
      credits: 'Credits',
      grade: 'Grade',
      points: 'Points',
      noGrade: '—',
      totalCredits: 'Total Credits',
      totalPoints: 'Total Points',
      whatIf: 'What if?',
      whatIfDesc: 'Try different grades for ungraded courses',
      expectedGpa: 'Expected GPA',
      record: 'Academic Record',
      currentSem: 'Current Semester',
      prevSemesters: 'Previous Semesters',
      exportPng: 'Export as Image',
      addManual: 'Add course manually',
      courseName: 'Course name',
      empty: 'No courses — create your semester first',
      outOf: 'out of',
      semCredits: 'credits',
      semCourses: 'courses',
      confirm: 'Add',
      cancel: 'Cancel',
      remove: 'Remove',
      removeConfirm: 'Remove this course from GPA calculator?',
    }
  };
  function t(k) {
    const lang = document.documentElement.getAttribute('lang') || 'ar';
    return T[lang]?.[k] || T.ar[k] || k;
  }
  function isAr() {
    return (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  }

  /*@3.GPLJ.7*/
  let gradesData = null;   /*@3.GPLJ.8*/
  let semester = null;     /*@3.GPLJ.9*/
  let archive = [];        /*@3.GPLJ.10*/
  let catalogMap = {};     /*@3.GPLJ.11*/
  let catalogArr = [];     /*@3.GPLJ.12*/
  let whatIfGrades = {};   /*@3.GPLJ.13*/
  let pickerSearch = '';   /*@3.GPLJ.14*/

  /*@3.GPLJ.15*/
  async function init() {
    /*@3.GPLJ.16*/
    try {
      const res = await fetch(CATALOG_PATH);
      const j = await res.json();
      catalogArr = j.courses || [];
      catalogArr.forEach(function (c) { catalogMap[c.code] = c; });
    } catch (e) {
      console.error('[gpa] courses_catalog.json fetch failed:', e);
    }

    /*@3.GPLJ.17*/
    semester = JSON.parse(localStorage.getItem(LS_SEMESTER) || 'null');
    archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');

    /*@3.GPLJ.18*/
    gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || 'null');
    if (!gradesData) {
      gradesData = { semesters: [], updated_at: new Date().toISOString() };
    }

    /*@3.GPLJ.19*/
    syncCurrentSemester();

    /*@3.GPLJ.20*/
    normalizeCurrentFlag();

    /*@3.GPLJ.21*/
    syncArchivedSemesters();

    /*@3.GPLJ.22*/
    render();

    /*@3.GPLJ.23*/
    bindEvents();

    /*@3.GPLJ.24*/
    document.addEventListener('garden:languageChanged', function () {
      render();
    });

    /*@3.GPLJ.25*/
    document.addEventListener('garden:gradesChanged', function () {
      archive = JSON.parse(localStorage.getItem(LS_ARCHIVE) || '[]');
      gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || 'null') || gradesData;
      render();
    });
  }

  /*@3.GPLJ.26*/
  function getCourseInfo(semCourse) {
    /*@3.GPLJ.27*/
    if (semCourse.custom) {
      return {
        name_ar: semCourse.name_ar || semCourse.name_en || 'مادة مخصصة',
        name_en: semCourse.name_en || semCourse.name_ar || 'Custom Course',
        credits: semCourse.credits || 3
      };
    }
    /*@3.GPLJ.28*/
    const info = catalogMap[semCourse.code];
    if (info) {
      return {
        name_ar: info.name_ar || semCourse.code,
        name_en: info.name_en || semCourse.code,
        /*@3.GPLJ.29*/
        credits: (semCourse.credits != null) ? semCourse.credits : ((info.credits != null) ? info.credits : 3)
      };
    }
    /*@3.GPLJ.30*/
    return {
      name_ar: semCourse.name_ar || semCourse.name_en || semCourse.code,
      name_en: semCourse.name_en || semCourse.name_ar || semCourse.code,
      credits: semCourse.credits || 3
    };
  }

  /*@3.GPLJ.31*/
  function currentSemesterId() {
    if (!semester) return null;
    return semester.id || ('sem_legacy_' + (semester.name || 'current'));
  }

  function syncCurrentSemester() {
    if (!semester || !semester.courses || semester.courses.length === 0) return;

    var semId = currentSemesterId();
    let gradeSem = gradesData.semesters.find(function (s) { return s.id === semId; });
    if (!gradeSem) {
      gradeSem = { id: semId, name: semester.name, courses: [], is_current: true };
      gradesData.semesters.push(gradeSem);
    }
    gradeSem.is_current = true;
    gradeSem.name = semester.name;

    /*@3.GPLJ.32*/
    semester.courses.forEach(function (sc) {
      var info = getCourseInfo(sc);
      var existing = gradeSem.courses.find(function (gc) { return gc.code === sc.code; });
      if (!existing) {
        gradeSem.courses.push({
          code: sc.code,
          name_ar: info.name_ar,
          name_en: info.name_en,
          credits: info.credits,
          grade: sc.grade || null,
          points: sc.grade ? (GPA_SCALE[sc.grade] || 0) : null
        });
      } else {
        /*@3.GPLJ.33*/
        existing.name_ar = info.name_ar;
        existing.name_en = info.name_en;
        existing.credits = info.credits;
        if (sc.grade && !existing.grade) {
          existing.grade = sc.grade;
          existing.points = GPA_SCALE[sc.grade] || 0;
        }
      }
    });

    /*@3.GPLJ.34*/
    var liveCodes = new Set(semester.courses.map(function (c) { return c.code; }));
    gradeSem.courses = gradeSem.courses.filter(function (gc) {
      /*@3.GPLJ.35*/
      if (String(gc.code).indexOf('__MANUAL_') === 0) return true;
      return liveCodes.has(gc.code);
    });

    saveGrades();
  }

  /*@3.GPLJ.36*/
  function normalizeCurrentFlag() {
    var currentId = currentSemesterId();
    var changed = false;
    gradesData.semesters.forEach(function (s) {
      var shouldBeCurrent = (currentId !== null && s.id === currentId);
      if (!!s.is_current !== shouldBeCurrent) { s.is_current = shouldBeCurrent; changed = true; }
    });
    if (changed) saveGrades();
  }

  /*@3.GPLJ.37*/
  function syncArchivedSemesters() {
    /*@3.GPLJ.38*/
    var archiveIds = {};
    (archive || []).forEach(function (a) { archiveIds[a.id] = true; });

    /*@3.GPLJ.39*/
    var archiveKeyExists = localStorage.getItem(LS_ARCHIVE) !== null;
    if (archiveKeyExists) {
      gradesData.semesters = gradesData.semesters.filter(function (s) {
        if (s.is_current) return true;       /*@3.GPLJ.40*/
        return !!archiveIds[s.id];
      });
    }

    /*@3.GPLJ.41*/
    (archive || []).forEach(function (archivedSem) {
      var courses = (archivedSem.courses || []).map(function (c) {
        var info = getCourseInfo(c);
        return {
          code: c.code,
          name_ar: info.name_ar,
          name_en: info.name_en,
          credits: info.credits,
          grade: c.grade || null,
          points: c.grade ? (GPA_SCALE[c.grade] || 0) : null
        };
      });
      var existing = gradesData.semesters.find(function (s) { return s.id === archivedSem.id; });
      if (existing) {
        existing.name = archivedSem.name;
        existing.courses = courses;
        existing.is_current = false;
      } else {
        gradesData.semesters.push({
          id: archivedSem.id,
          name: archivedSem.name,
          courses: courses,
          is_current: false
        });
      }
    });
    saveGrades();
  }

  /*@3.GPLJ.42*/
  function calcSemesterGPA(courses) {
    var totalPoints = 0, totalCredits = 0;
    courses.forEach(function (c) {
      if (c.grade && c.grade !== null && GPA_SCALE[c.grade] !== undefined) {
        totalPoints += GPA_SCALE[c.grade] * c.credits;
        totalCredits += c.credits;
      }
    });
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  function calcCumulativeGPA() {
    var totalPoints = 0, totalCredits = 0;
    gradesData.semesters.forEach(function (sem) {
      sem.courses.forEach(function (c) {
        if (c.grade && c.grade !== null && GPA_SCALE[c.grade] !== undefined) {
          totalPoints += GPA_SCALE[c.grade] * c.credits;
          totalCredits += c.credits;
        }
      });
    });
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  function calcWhatIfGPA() {
    /*@3.GPLJ.43*/
    var totalPoints = 0, totalCredits = 0;
    gradesData.semesters.forEach(function (sem) {
      sem.courses.forEach(function (c) {
        var grade = c.grade || whatIfGrades[c.code] || null;
        if (grade && GPA_SCALE[grade] !== undefined) {
          totalPoints += GPA_SCALE[grade] * c.credits;
          totalCredits += c.credits;
        }
      });
    });
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /*@3.GPLJ.44*/
  function render() {
    updateTextContent();

    var currentSem = gradesData.semesters.find(function (s) { return s.is_current; });
    var hasData = currentSem && currentSem.courses.length > 0;

    document.getElementById('empty-state').style.display = hasData ? 'none' : '';
    document.getElementById('gpa-ring-section').style.display = hasData ? '' : 'none';
    document.getElementById('current-semester-section').style.display = hasData ? '' : 'none';
    var exportRow = document.getElementById('gpa-export-row');
    if (exportRow) exportRow.style.display = hasData ? '' : 'none';

    if (!hasData) {
      document.getElementById('what-if-section').style.display = 'none';
      document.getElementById('record-section').style.display = 'none';
      return;
    }

    /*@3.GPLJ.45*/
    var cumGPA = calcCumulativeGPA();
    renderRing(cumGPA);
    document.getElementById('gpa-cumulative').textContent = cumGPA.toFixed(2);

    /*@3.GPLJ.46*/
    var totalCredits = 0, totalGraded = 0;
    gradesData.semesters.forEach(function (s) {
      s.courses.forEach(function (c) {
        totalCredits += c.credits;
        if (c.grade) totalGraded++;
      });
    });
    /*@3.GPLJ.47*/
    var sc = (window.Garden && window.Garden.smartCount)
      ? window.Garden.smartCount
      : function (n, ar) { return n + ' ' + ar[0]; };
    document.getElementById('gpa-sub-info').textContent =
      sc(totalCredits, ['ساعة','ساعتين','ساعات'], ['credit','credits']) + ' · ' +
      sc(totalGraded, ['مادة مُقدّرة','مادتان مُقدّرتان','مواد مُقدّرة'], ['graded','graded'], true);

    /*@3.GPLJ.48*/
    var semGPA = calcSemesterGPA(currentSem.courses);
    document.getElementById('current-sem-gpa').textContent = semGPA > 0 ? semGPA.toFixed(2) : '—';
    renderCoursesTable(currentSem);

    /*@3.GPLJ.49*/
    var hasUngraded = currentSem.courses.some(function (c) { return !c.grade; });
    var whatIfSection = document.getElementById('what-if-section');
    whatIfSection.style.display = hasUngraded ? '' : 'none';
    if (hasUngraded) {
      var whatIfGPA = calcWhatIfGPA();
      var hasWhatIfSelection = Object.keys(whatIfGrades).length > 0;
      document.getElementById('what-if-gpa').textContent = hasWhatIfSelection ? whatIfGPA.toFixed(2) : '—';
    }

    /*@3.GPLJ.50*/
    var archivedSemesters = gradesData.semesters.filter(function (s) { return !s.is_current; });
    var recordSection = document.getElementById('record-section');
    recordSection.style.display = archivedSemesters.length > 0 ? '' : 'none';
    if (archivedSemesters.length > 0) {
      renderRecord(archivedSemesters);
    }
  }

  /*@3.GPLJ.51*/
  function renderRing(gpa) {
    var wrapper = document.getElementById('gpa-ring-wrapper');
    var maxGPA = 4.0;
    var percent = Math.min(gpa / maxGPA, 1) * 100;
    var radius = 65;
    var circumference = 2 * Math.PI * radius;
    var offset = circumference - (percent / 100) * circumference;

    var color = '#ef4444'; /*@3.GPLJ.52*/
    if (gpa >= 3.5) color = '#10b981';
    else if (gpa >= 2.5) color = '#3b82f6';
    else if (gpa >= 1.5) color = '#f59e0b';

    wrapper.innerHTML =
      '<svg width="160" height="160" viewBox="0 0 160 160">' +
        '<circle cx="80" cy="80" r="' + radius + '" fill="none" ' +
          'stroke="var(--bg-elevated)" stroke-width="10" />' +
        '<circle cx="80" cy="80" r="' + radius + '" fill="none" ' +
          'stroke="' + color + '" stroke-width="10" ' +
          'stroke-linecap="round" ' +
          'stroke-dasharray="' + circumference + '" ' +
          'stroke-dashoffset="' + offset + '" ' +
          'transform="rotate(-90 80 80)" ' +
          'style="transition: stroke-dashoffset 0.8s ease;" />' +
        '<text x="80" y="75" text-anchor="middle" ' +
          'fill="var(--text-primary)" font-size="28" font-weight="900" ' +
          'font-family="Inter, Cairo, sans-serif">' + gpa.toFixed(2) + '</text>' +
        '<text x="80" y="98" text-anchor="middle" ' +
          'fill="var(--text-muted)" font-size="12" font-weight="600" ' +
          'font-family="Cairo, Inter, sans-serif">' + t('outOf') + ' 4.00</text>' +
      '</svg>';
  }

  /*@3.GPLJ.53*/
  function renderCoursesTable(semData) {
    var wrapper = document.getElementById('courses-table-wrapper');
    var html = '<table class="gpa-table">';

    html += '<thead><tr>';
    html += '<th class="gpa-th-code">' + (isAr() ? 'الرمز' : 'Code') + '</th>';
    html += '<th>' + t('course') + '</th>';
    html += '<th>' + t('credits') + '</th>';
    html += '<th>' + t('grade') + '</th>';
    html += '<th>' + t('points') + '</th>';
    html += '<th></th>';
    html += '</tr></thead>';

    html += '<tbody>';
    var totalCredits = 0, totalPoints = 0;

    semData.courses.forEach(function (c) {
      var name = isAr() ? c.name_ar : c.name_en;
      var gradeColor = c.grade ? (GRADE_COLORS[c.grade] || 'var(--text-primary)') : 'var(--text-muted)';
      var points = c.grade ? (GPA_SCALE[c.grade] * c.credits).toFixed(2) : '—';

      totalCredits += c.credits;
      if (c.grade) {
        totalPoints += GPA_SCALE[c.grade] * c.credits;
      }

      html += '<tr data-code="' + c.code + '">';
      /*@3.GPLJ.54*/
      html += '<td class="gpa-td-code"><span class="record-course-code">' + escapeHtmlG(c.code || '') + '</span></td>';
      html += '<td class="gpa-course-name" title="' + escapeHtmlG(name) + '">' + escapeHtmlG(name) + '</td>';
      html += '<td class="gpa-course-credits">' + c.credits + '</td>';
      html += '<td>';
      html += '<select class="gpa-grade-select" data-code="' + c.code + '" ' +
              'style="border-color:' + gradeColor + '">';
      GRADE_OPTIONS.forEach(function (g) {
        var selected = c.grade === g ? ' selected' : '';
        var label = g === '' ? t('noGrade') : g;
        html += '<option value="' + g + '"' + selected + '>' + label + '</option>';
      });
      html += '</select>';

      if (!c.grade) {
        var wiGrade = whatIfGrades[c.code] || '';
        html += '<select class="gpa-what-if-select" data-code="' + c.code + '">';
        html += '<option value="">—</option>';
        GRADE_OPTIONS.forEach(function (g) {
          if (g === '') return;
          var selected = wiGrade === g ? ' selected' : '';
          html += '<option value="' + g + '"' + selected + '>' + g + '</option>';
        });
        html += '</select>';
      }

      html += '</td>';
      html += '<td class="gpa-course-points" style="color:' + gradeColor + '">' + points + '</td>';
      html += '<td><button class="gpa-remove-btn" data-code="' + c.code + '" title="' + t('remove') + '">';
      html += '<i class="fa-solid fa-trash-can"></i></button></td>';
      html += '</tr>';
    });

    html += '</tbody><tfoot><tr>';
    html += '<td colspan="2"><strong>' + t('totalCredits') + '</strong></td>';
    html += '<td><strong>' + totalCredits + '</strong></td>';
    html += '<td></td>';
    html += '<td><strong>' + totalPoints.toFixed(2) + '</strong></td>';
    html += '<td></td>';
    html += '</tr></tfoot>';

    html += '</table>';
    wrapper.innerHTML = html;

    wrapper.querySelectorAll('.gpa-grade-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        onGradeChange(this.getAttribute('data-code'), this.value);
      });
    });

    wrapper.querySelectorAll('.gpa-what-if-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var code = this.getAttribute('data-code');
        if (this.value) { whatIfGrades[code] = this.value; }
        else { delete whatIfGrades[code]; }
        render();
      });
    });

    wrapper.querySelectorAll('.gpa-remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeCourse(this.getAttribute('data-code'));
      });
    });
  }

  /*@3.GPLJ.55*/
  function onGradeChange(code, newGrade) {
    var currentSem = gradesData.semesters.find(function (s) { return s.is_current; });
    if (!currentSem) return;
    var course = currentSem.courses.find(function (c) { return c.code === code; });
    if (!course) return;

    course.grade = newGrade || null;
    course.points = newGrade ? (GPA_SCALE[newGrade] || 0) : null;
    saveGrades();

    /*@3.GPLJ.56*/
    if (semester && semester.courses) {
      var semCourse = semester.courses.find(function (c) { return c.code === code; });
      if (semCourse) {
        semCourse.grade = newGrade || null;
        if (newGrade) {
          semCourse.completed = true;
          semCourse.completed_at = semCourse.completed_at || new Date().toISOString();
        }
        semester.updated_at = new Date().toISOString();
        localStorage.setItem(LS_SEMESTER, JSON.stringify(semester));
      }
    }

    if (newGrade && whatIfGrades[code]) { delete whatIfGrades[code]; }
    render();
  }

  /*@3.GPLJ.57*/
  function removeCourse(code) {
    if (!confirm(t('removeConfirm'))) return;
    var currentSem = gradesData.semesters.find(function (s) { return s.is_current; });
    if (!currentSem) return;
    currentSem.courses = currentSem.courses.filter(function (c) { return c.code !== code; });
    saveGrades();
    render();
  }

  /*@3.GPLJ.58*/
  function addManualCourse() {
    /*@3.GPLJ.59*/
    var name = document.getElementById('manual-name').value.trim();
    var credits = parseInt(document.getElementById('manual-credits').value) || 3;

    if (!name) return;
    var nameAr = name, nameEn = name;

    var currentSem = gradesData.semesters.find(function (s) { return s.is_current; });
    if (!currentSem) {
      currentSem = { id: 'sem_' + Date.now(), name: isAr() ? 'فصلي' : 'My Semester', courses: [], is_current: true };
      gradesData.semesters.push(currentSem);
    }

    currentSem.courses.push({
      code: '__MANUAL_' + Date.now(),
      name_ar: nameAr || nameEn,
      name_en: nameEn || nameAr,
      credits: credits,
      grade: null,
      points: null
    });

    saveGrades();
    closeModal('modal-add-manual');
    document.getElementById('manual-name').value = '';
    document.getElementById('manual-credits').value = '3';
    render();
  }

  /*@3.GPLJ.60*/
  function gradientBg(color) {
    var c = (color || '#64748b').replace('#', '');
    return 'linear-gradient(135deg, #' + c + ', #' + c + ')';
  }
  function openPicker() {
    pickerSearch = '';
    var s = document.getElementById('picker-search');
    if (s) s.value = '';
    renderPicker();
    openModal('modal-course-picker');
  }
  function renderPicker() {
    var list = document.getElementById('picker-list');
    if (!list) return;

    var currentSem = gradesData.semesters.find(function (s) { return s.is_current; });
    var currentCodes = new Set(currentSem ? currentSem.courses.map(function (c) { return c.code; }) : []);
    var activeSemCodes = new Set((semester && semester.courses) ? semester.courses.map(function (c) { return c.code; }) : []);

    var q = pickerSearch.trim().toLowerCase();
    var items = catalogArr.filter(function (c) {
      if (currentCodes.has(c.code)) return false;   /*@3.GPLJ.61*/
      if (!q) return true;
      return (c.code || '').toLowerCase().indexOf(q) !== -1 ||
             (c.name_ar || '').toLowerCase().indexOf(q) !== -1 ||
             (c.name_en || '').toLowerCase().indexOf(q) !== -1;
    });

    /*@3.GPLJ.62*/
    function isActive(c) { return activeSemCodes.has(c.code); }
    var active = items.filter(isActive);
    var rest = items.filter(function (c) { return !isActive(c); });

    function row(c, activeTag) {
      var name = isAr() ? c.name_ar : c.name_en;
      var lvl = isAr() ? (c.level_name_ar || c.level) : (c.level_name_en || c.level);
      var credits = (c.credits != null) ? c.credits : 3;
      var tag = activeTag ? '<span class="gpa-picker-active-tag">' + (isAr() ? 'نشطة' : 'Active') + '</span>' : '';
      return '<div class="gpa-picker-item" data-code="' + c.code + '">' +
        '<div class="gpa-picker-icon" style="background:' + gradientBg(c.brand_color) + '"><i class="' + (c.icon || 'fa-solid fa-book') + '"></i></div>' +
        '<div class="gpa-picker-info">' +
          '<div class="gpa-picker-name">' + escapeHtmlG(name) + ' <span style="color:var(--text-muted);font-weight:400">(' + c.code + ')</span></div>' +
          '<div class="gpa-picker-meta">' + escapeHtmlG(lvl) + ' · ' + credits + ' ' + t('semCredits') + '</div>' +
        '</div>' + tag +
      '</div>';
    }

    var html = '';
    if (active.length) {
      html += '<div class="gpa-picker-group-label">' + (isAr() ? 'مواد نشطة' : 'Active courses') + '</div>';
      html += active.map(function (c) { return row(c, true); }).join('');
    }
    if (rest.length) {
      html += '<div class="gpa-picker-group-label">' + (isAr() ? 'كل المواد' : 'All courses') + '</div>';
      html += rest.map(function (c) { return row(c, false); }).join('');
    }
    if (!active.length && !rest.length) {
      html = '<div class="gpa-picker-empty">' + (isAr() ? 'لا نتائج' : 'No results') + '</div>';
    }
    list.innerHTML = html;

    list.querySelectorAll('.gpa-picker-item').forEach(function (el) {
      el.addEventListener('click', function () { addCatalogCourse(this.getAttribute('data-code')); });
    });
  }
  function escapeHtmlG(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  /*@3.GPLJ.63*/
  function scHours(n) {
    return (window.Garden && window.Garden.smartCount)
      ? window.Garden.smartCount(n, ['ساعة', 'ساعتان', 'ساعات'], ['credit', 'credits'])
      : (n + ' ' + t('semCredits'));
  }
  function addCatalogCourse(code) {
    var info = catalogMap[code];
    if (!info) return;
    /*@3.GPLJ.64*/
    if (!semester) {
      semester = { id: 'sem_' + Date.now(), name: isAr() ? 'فصلي' : 'My Semester', courses: [],
                   is_active: true, is_pinned: false, was_activated: false,
                   created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }
    if (!semester.courses.some(function (c) { return c.code === code; })) {
      semester.courses.push({ code: code, added_at: new Date().toISOString(), completed: false, completed_at: null, grade: null });
      semester.updated_at = new Date().toISOString();
      localStorage.setItem(LS_SEMESTER, JSON.stringify(semester));
    }
    syncCurrentSemester();
    normalizeCurrentFlag();
    renderPicker();
    render();
  }

  /*@3.GPLJ.65*/
  function findArchiveById(id) {
    for (var i = 0; i < archive.length; i++) if (archive[i] && archive[i].id === id) return archive[i];
    return null;
  }
  function catalogCredits(code) { var i = catalogMap[code]; return (i && i.credits != null) ? i.credits : null; }
  function catalogName(code) {
    var i = catalogMap[code];
    if (!i) return code;
    return (isAr() ? i.name_ar : i.name_en) || code;
  }

  function renderRecord(archivedSemesters) {
    var list = document.getElementById('record-list');
    var html = '';
    archivedSemesters.forEach(function (sem) {
      var editable = !!findArchiveById(sem.id);           /*@3.GPLJ.66*/
      var gpa = calcSemesterGPA(sem.courses);
      var credits = sem.courses.reduce(function (sum, c) { return sum + c.credits; }, 0);
      html += '<details class="gpa-record-item" data-id="' + escapeHtmlG(sem.id) + '">';
      html += '<summary>';
      html += '<span class="record-name">' + escapeHtmlG(sem.name) + '</span>';
      html += '<span class="record-meta">' + escapeHtmlG(scHours(credits)) +
              ' · GPA: <strong style="color:#a78bfa">' + gpa.toFixed(2) + '</strong>';
      if (editable) {
        html += ' <button type="button" class="record-edit-btn" data-id="' + escapeHtmlG(sem.id) + '" ' +
                'title="' + (isAr() ? 'تعديل السجل' : 'Edit record') + '" aria-label="' + (isAr() ? 'تعديل السجل' : 'Edit record') + '"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>';
      }
      html += '</span>';
      html += '</summary>';
      html += '<div class="record-courses">';
      sem.courses.forEach(function (c) {
        var name = isAr() ? c.name_ar : c.name_en;
        html += '<div class="record-course-row">';
        /*@3.GPLJ.67*/
        html += '<span class="record-course-code" title="' + escapeHtmlG(c.code || '') + '">' + escapeHtmlG(c.code || '') + '</span>';
        html += '<span class="record-course-name" title="' + escapeHtmlG(name) + '">' + escapeHtmlG(name) + '</span>';
        html += '<span class="record-course-cr">' + escapeHtmlG(scHours(c.credits)) + '</span>';
        html += '<span class="record-course-grade" style="color:' + (GRADE_COLORS[c.grade] || 'var(--text-muted)') + '">' +
                '<bdi dir="ltr">' + (c.grade || '—') + '</bdi></span>';
        html += '</div>';
      });
      html += '</div>';
      html += '</details>';
    });
    list.innerHTML = html;

    if (!list._recBound) {
      list._recBound = true;
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('.record-edit-btn');
        if (btn) { e.preventDefault(); e.stopPropagation(); openRecordEditor(btn.getAttribute('data-id')); }
      });
    }
  }

  /*@3.GPLJ.68*/
  function recGradeSelect(sel) {
    return '<select class="rec-ed-grade">' + GRADE_OPTIONS.map(function (g) {
      return '<option value="' + g + '"' + (sel === g ? ' selected' : '') + '>' + (g || '—') + '</option>';
    }).join('') + '</select>';
  }
  function recCourseRow(code, grade, credits) {
    var cr = (credits != null) ? credits : (catalogCredits(code) != null ? catalogCredits(code) : 3);
    return '<div class="rec-ed-row" data-code="' + escapeHtmlG(code) + '">' +
      '<span class="rec-ed-name"><span class="record-course-code">' + escapeHtmlG(code) + '</span> ' +
        escapeHtmlG(catalogName(code)) + '</span>' +
      '<input type="number" class="rec-ed-cr" min="0" max="12" step="1" value="' + cr + '" ' +
        'title="' + (isAr() ? 'الساعات' : 'Credits') + '">' +
      recGradeSelect(grade || '') +
      '<button type="button" class="rec-ed-del" title="' + (isAr() ? 'حذف' : 'Delete') + '" aria-label="' + (isAr() ? 'حذف' : 'Delete') + '"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
    '</div>';
  }

  function openRecordEditor(id) {
    var a = findArchiveById(id);
    if (!a) return;
    closeRecordEditor();

    var opts = (catalogArr || []).filter(function (c) { return c && c.code; }).map(function (c) {
      return '<option value="' + escapeHtmlG(c.code) + '">' + escapeHtmlG((isAr() ? c.name_ar : c.name_en) || c.code) + ' (' + escapeHtmlG(c.code) + ')</option>';
    }).join('');

    var rowsHtml = (a.courses || []).map(function (c) { return recCourseRow(c.code, c.grade, c.credits); }).join('');

    var ov = document.createElement('div');
    ov.id = 'rec-ed-overlay';
    ov.className = 'rec-ed-overlay';
    ov.innerHTML =
      '<div class="rec-ed-box" role="dialog" aria-modal="true" data-id="' + escapeHtmlG(id) + '">' +
        '<div class="rec-ed-head">' +
          '<h3>' + (isAr() ? 'تعديل السجل' : 'Edit record') + '</h3>' +
          '<button type="button" class="rec-ed-x" aria-label="' + (isAr() ? 'إغلاق' : 'Close') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '<label class="rec-ed-lbl">' + (isAr() ? 'اسم الفصل' : 'Semester name') + '</label>' +
        '<input type="text" class="rec-ed-title" maxlength="60" value="' + escapeHtmlG(a.name || '') + '">' +
        '<label class="rec-ed-lbl">' + (isAr() ? 'المواد' : 'Courses') + '</label>' +
        '<div class="rec-ed-rows">' + rowsHtml + '</div>' +
        '<div class="rec-ed-add">' +
          '<select class="rec-ed-add-select"><option value="">' + (isAr() ? 'إضافة مادة…' : 'Add course…') + '</option>' + opts + '</select>' +
        '</div>' +
        '<div class="rec-ed-foot">' +
          '<button type="button" class="rec-ed-cancel">' + (isAr() ? 'إلغاء' : 'Cancel') + '</button>' +
          '<button type="button" class="rec-ed-save">' + (isAr() ? 'حفظ' : 'Save') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.rec-ed-x') || e.target.closest('.rec-ed-cancel')) { closeRecordEditor(); return; }
      var del = e.target.closest('.rec-ed-del');
      if (del) { var row = del.closest('.rec-ed-row'); if (row) row.remove(); return; }
      if (e.target.closest('.rec-ed-save')) { saveRecordEditor(id); return; }
    });
    ov.querySelector('.rec-ed-add-select').addEventListener('change', function () {
      var code = this.value; this.value = '';
      if (!code) return;
      var rows = ov.querySelector('.rec-ed-rows');
      if (rows.querySelector('.rec-ed-row[data-code="' + code + '"]')) return;   /*@3.GPLJ.69*/
      rows.insertAdjacentHTML('beforeend', recCourseRow(code, '', null));
    });
  }

  function closeRecordEditor() {
    var ov = document.getElementById('rec-ed-overlay');
    if (ov) ov.remove();
  }

  function saveRecordEditor(id) {
    var a = findArchiveById(id);
    if (!a) { closeRecordEditor(); return; }
    var ov = document.getElementById('rec-ed-overlay');
    var name = (ov.querySelector('.rec-ed-title').value || '').trim() || a.name;
    var courses = [];
    ov.querySelectorAll('.rec-ed-row').forEach(function (row) {
      var code = row.getAttribute('data-code');
      var grade = row.querySelector('.rec-ed-grade').value || null;
      var crVal = parseInt(row.querySelector('.rec-ed-cr').value, 10);
      var entry = { code: code, grade: grade };
      var cc = catalogCredits(code);
      /*@3.GPLJ.70*/
      if (!isNaN(crVal) && (cc == null || crVal !== cc)) entry.credits = crVal;
      courses.push(entry);
    });

    /*@3.GPLJ.71*/
    a.name = name;
    a.courses = courses;
    if (!courses.length) {
      /*@3.GPLJ.72*/
      archive = archive.filter(function (x) { return x && x.id !== id; });
    }
    localStorage.setItem(LS_ARCHIVE, JSON.stringify(archive));

    /*@3.GPLJ.73*/
    syncArchivedSemesters();
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }
    /*@3.GPLJ.74*/
    gradesData = JSON.parse(localStorage.getItem(LS_GRADES) || '{"semesters":[]}');
    normalizeCurrentFlag();
    closeRecordEditor();
    render();
  }

  /*@3.GPLJ.75*/
  function saveGrades() {
    gradesData.updated_at = new Date().toISOString();
    localStorage.setItem(LS_GRADES, JSON.stringify(gradesData));
  }

  function updateTextContent() {
    document.querySelectorAll('[data-ar]').forEach(function (el) {
      var text = isAr() ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if (text) el.textContent = text;
    });
    /*@3.GPLJ.76*/
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  /*@3.GPLJ.77*/
  function bindEvents() {
    /*@3.GPLJ.78*/
    var btnAdd = document.getElementById('btn-add-manual');
    if (btnAdd) btnAdd.addEventListener('click', openPicker);

    var btnClosePicker = document.getElementById('btn-close-picker');
    if (btnClosePicker) btnClosePicker.addEventListener('click', function () { closeModal('modal-course-picker'); });

    var btnOpenManual = document.getElementById('btn-open-manual');
    if (btnOpenManual) btnOpenManual.addEventListener('click', function () {
      closeModal('modal-course-picker');
      openModal('modal-add-manual');
    });

    var pickerSearchEl = document.getElementById('picker-search');
    if (pickerSearchEl) pickerSearchEl.addEventListener('input', function () {
      pickerSearch = this.value || '';
      renderPicker();
    });

    var btnConfirm = document.getElementById('btn-confirm-manual');
    if (btnConfirm) btnConfirm.addEventListener('click', addManualCourse);

    var btnCancel = document.getElementById('btn-cancel-manual');
    if (btnCancel) btnCancel.addEventListener('click', function () { closeModal('modal-add-manual'); });

    var btnPng = document.getElementById('btn-export-png');
    if (btnPng) btnPng.addEventListener('click', function () { runExport('png'); });
    var btnPdf = document.getElementById('btn-export-pdf');
    if (btnPdf) btnPdf.addEventListener('click', function () { runExport('pdf'); });

    document.querySelectorAll('.gpa-modal-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) {
        if (e.target === ov) ov.style.display = 'none';
      });
    });
  }

  /*@3.GPLJ.79*/
  function runExport(kind) {
    var container = document.querySelector('.gpa-container');
    if (!container || !window.Export) { alert('Export unavailable'); return; }
    var fname = (isAr() ? 'المعدل_' : 'GPA_') + new Date().toISOString().slice(0, 10);
    var opts = {
      /*@3.GPLJ.80*/
      onclone: function (doc) {
        ['.gpa-actions', '#gpa-export-row', '.bottom-nav', '#modal-course-picker', '#modal-add-manual']
          .forEach(function (sel) {
            doc.querySelectorAll(sel).forEach(function (el) { el.style.display = 'none'; });
          });
      }
    };
    var p = (kind === 'pdf')
      ? window.Export.toPDF(container, fname + '.pdf', Object.assign({ orientation: 'portrait' }, opts))
      : window.Export.toPNG(container, fname + '.png', opts);
    Promise.resolve(p).catch(function (e) { console.error('[gpa export]', e); alert('Export failed'); });
  }

  /*@3.GPLJ.81*/
  document.addEventListener('DOMContentLoaded', init);

})();
