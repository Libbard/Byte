/*@3.ONLJ.1*/
;(function () {
  'use strict';

  var STATE_KEY = 'onboarding_state';
  var CURRENT_V = 1;                 /*@3.ONLJ.2*/
  var GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'TR'];
  var PRIOR_ID = 'onb_prior';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function readJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function loadState() { return readJSON(STATE_KEY, { completed_v: 0, seen_v: 0, step: 0, data: {} }); }
  function saveState(s) { writeJSON(STATE_KEY, s); }

  var _catalog = null;
  function catalogReady(cb) {
    if (_catalog) { cb(); return; }
    fetch(scriptRoot() + 'shared/data/courses_catalog.json')
      .then(function (r) { return r.json(); })
      .then(function (j) { _catalog = j; cb(); })
      .catch(function () { _catalog = { courses: [] }; cb(); });
  }
  function scriptRoot() {
    var s = document.currentScript;
    return (s && s.src) ? s.src.replace(/shared\/onboarding\.js(\?.*)?$/, '') : '';
  }

  function levelNum(c) { var m = String(c.level || '').match(/\d+/); return m ? parseInt(m[0], 10) : null; }
  function isGeneral(c) { return String(c.level || '').toLowerCase() === 'others'; }
  function findCourse(code) { var a = (_catalog.courses || []).filter(function (c) { return c.code === code; }); return a[0] || null; }

  /*@3.ONLJ.3*/
  var W = null;   /*@3.ONLJ.4*/

  var STEPS = ['welcome', 'name', 'year', 'levels', 'current', 'done'];

  function launchIfNeeded() {
    var st = loadState();
    if (st.completed_v >= CURRENT_V) return;    /*@3.ONLJ.5*/
    if ((st.seen_v || 0) >= CURRENT_V) { markReminder(); return; }  /*@3.ONLJ.6*/
    markReminder();
    open(st.step || 0, st.data || {});
  }

  /*@3.ONLJ.7*/
  function sealSeen() {
    var st = loadState();
    st.seen_v = CURRENT_V;
    saveState(st);
  }

  /*@3.ONLJ.8*/
  function biRead(obj) {
    return window.GardenBiName ? window.GardenBiName.read(obj)
      : { ar: (obj && obj.name) || '', en: '' };
  }
  function biResolve(ar, en) {
    return window.GardenBiName ? window.GardenBiName.resolve(ar, en)
      : ((ar || en) ? { name_ar: ar || en, name_en: en || ar, name: ar || en } : null);
  }

  /*@3.ONLJ.9*/
  function buildFromReality() {
    var prof = readJSON('student_profile', {}) || {};
    var arch = readJSON('semester_archive', []) || [];
    var completed = {};
    (arch || []).forEach(function (a) {
      if (a && a.id === PRIOR_ID && a.courses) {
        a.courses.forEach(function (c) { if (c && c.code) completed[c.code] = c.grade || ''; });
      }
    });
    var sem = readJSON('my_semester', null) || {};
    var current = (sem.courses || []).map(function (c) { return c && c.code; }).filter(Boolean);
    var pn = biRead(prof), sn = biRead(sem);
    return {
      nameAr: pn.ar, nameEn: pn.en,
      semAr: sn.ar, semEn: sn.en,
      startYear: prof.start_year || null,
      term: (sem.term === 'summer') ? 'summer' : 'regular',
      completed: completed,
      current: current,
      currentLevel: null
    };
  }

  function open(step, data, fromReality) {
    catalogReady(function () {
      var base = fromReality ? buildFromReality() : (data || {});
      var pn0 = biRead(readJSON('student_profile', {}) || {});
      var sn0 = biRead(readJSON('my_semester', {}) || {});
      W = {
        step: step || 0,
        nameAr: base.nameAr || pn0.ar,
        nameEn: base.nameEn || pn0.en,
        semAr: base.semAr || sn0.ar,
        semEn: base.semEn || sn0.en,
        startYear: base.startYear || null,
        term: base.term || 'regular',
        currentLevel: (base.currentLevel != null) ? base.currentLevel : null,  /*@3.ONLJ.10*/
        levelTouched: base.currentLevel != null,
        showOther: false,
        completed: base.completed || {},   /*@3.ONLJ.11*/
        current: base.current || []
      };
      render();
    });
  }

  function persistProgress() {
    var st = loadState();
    st.step = W.step;
    st.data = { nameAr: W.nameAr, nameEn: W.nameEn, semAr: W.semAr, semEn: W.semEn,
                startYear: W.startYear, term: W.term, currentLevel: W.currentLevel,
                completed: W.completed, current: W.current };
    saveState(st);
  }

  function close() {
    var o = document.getElementById('onb-overlay');
    if (o) o.remove();
  }

  /*@3.ONLJ.12*/
  function inferLevel() {
    var maxL = 0;
    Object.keys(W.completed).forEach(function (code) {
      if (W.completed[code] === 'F') return;           /*@3.ONLJ.13*/
      var c = findCourse(code); var ln = c ? levelNum(c) : null;
      if (ln && ln > maxL) maxL = ln;
    });
    return maxL ? Math.min(8, maxL + 1) : 3;
  }
  function effectiveLevel() { return W.levelTouched && W.currentLevel != null ? W.currentLevel : inferLevel(); }

  function render() {
    persistProgress();
    var name = STEPS[W.step];
    var body = '', title = '', canBack = W.step > 0, nextLabel = tx('التالي', 'Next');
    if (name === 'welcome') { title = tx('أهلاً بك في الحديقة الرقمية', 'Welcome to Digital Garden'); body = welcomeBody(); }
    else if (name === 'name') { title = tx('ما اسمك؟', 'Your name?'); body = nameBody(); }
    else if (name === 'year') { title = tx('سنة بدء دراستك', 'Year you started'); body = yearBody(); }
    else if (name === 'levels') { title = tx('المواد التي أتممتها', 'Courses you completed'); body = levelsBody(); }
    else if (name === 'current') { title = tx('فصلك الحالي ومواده', 'Your current term & courses'); body = currentBody(); nextLabel = tx('إنهاء', 'Finish'); }
    else if (name === 'done') { title = tx('جاهز!', 'All set!'); body = doneBody(); }

    var totalSteps = STEPS.length - 1;   /*@3.ONLJ.14*/
    var pct = Math.round((W.step / totalSteps) * 100);
    var remain = Math.max(0, totalSteps - W.step);
    var mins = Math.max(1, Math.round(remain * 20 / 60));

    close();
    var o = document.createElement('div');
    o.id = 'onb-overlay';
    o.className = 'onb-overlay';
    o.innerHTML =
      '<div class="onb-box" role="dialog" aria-modal="true" aria-label="' + esc(tx('بداية الطالب', 'Getting started')) + '">' +
        '<div class="onb-progress"><div class="onb-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="onb-head">' +
          '<h2 class="onb-title">' + esc(title) + '</h2>' +
          (name !== 'done' ? '<span class="onb-eta">≈ ' + mins + ' ' + esc(tx('دقيقة', 'min')) + '</span>' : '') +
        '</div>' +
        '<div class="onb-body">' + body + '</div>' +
        '<div class="onb-foot">' +
          (canBack ? '<button class="onb-btn onb-back" data-onb="back">' + esc(tx('رجوع', 'Back')) + '</button>' : '<span></span>') +
          '<div class="onb-foot-right">' +
            (name !== 'done' ? '<button class="onb-btn onb-later" data-onb="later">' + esc(tx('لاحقاً', 'Later')) + '</button>' : '') +
            (name === 'done'
              ? '<button class="onb-btn onb-primary" data-onb="finish">' + esc(tx('ابدأ', 'Start')) + '</button>'
              : '<button class="onb-btn onb-primary" data-onb="next">' + esc(nextLabel) + '</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    wire(o);
    bindBiFields();
  }

  /*@3.ONLJ.15*/
  function bindBiFields() {
    if (!window.GardenBiName) return;
    var n1 = document.getElementById('onb-name'), n2 = document.getElementById('onb-name-en');
    if (n1 && n2) window.GardenBiName.attach({ ar: n1, en: n2, suggest: false });

    var s1 = document.getElementById('onb-sem'), s2 = document.getElementById('onb-sem-en');
    if (s1 && s2) {
      /*@3.ONLJ.16*/
      window.GardenBiName.attach({
        ar: s1, en: s2, suggest: true,
        primary: (W.term === 'summer') ? 'summer' : effectiveLevel()
      });
    }
  }

  function welcomeBody() {
    /*@3.ONLJ.17*/
    var feats = [
      ['<i class="fa-solid fa-book" aria-hidden="true"></i>', tx('مواد تفاعلية', 'Interactive courses')],
      ['<i class="fa-solid fa-calendar-days" aria-hidden="true"></i>', tx('جدول', 'Schedule')],
      ['<i class="fa-solid fa-chart-line" aria-hidden="true"></i>', tx('المعدل', 'GPA')],
      ['<i class="fa-solid fa-cloud" aria-hidden="true"></i>', tx('مزامنة', 'Sync')]
    ];
    return '<p class="onb-lead">' + esc(tx('نُعرّفك بالموقع ونؤسّس بياناتك في دقائق. يمكنك التخطّي أو الإكمال لاحقاً.',
      'A quick tour and setup. You can skip or finish later.')) + '</p>' +
      '<div class="onb-feats">' + feats.map(function (f) {
        return '<div class="onb-feat"><span class="onb-feat-ico">' + f[0] + '</span><span>' + esc(f[1]) + '</span></div>';
      }).join('') + '</div>';
  }

  /*@3.ONLJ.18*/
  function nameBody() {
    return (window.GardenBiName ? window.GardenBiName.fieldHtml({
      idAr: 'onb-name', idEn: 'onb-name-en', cls: 'onb-input', max: 40,
      valAr: W.nameAr, valEn: W.nameEn,
      phAr: tx('اكتب اسمك', 'Your name in Arabic'),
      phEn: 'Your name in English'
    }) : '<input class="onb-input" id="onb-name" type="text" maxlength="40" value="' + esc(W.nameAr) + '" ' +
      'placeholder="' + esc(tx('اكتب اسمك', 'Type your name')) + '" autocomplete="off">') +
      '<p class="onb-hint">' + esc(tx('يكفي أن تملأ أحدهما — والآخر يأخذ نسخته تلقائياً.',
        'Fill either one — the other copies automatically.')) + '</p>';
  }

  function yearBody() {
    var now = new Date().getFullYear();
    var opts = '';
    for (var y = now; y >= 2018; y--) opts += '<option value="' + y + '"' + (W.startYear === y ? ' selected' : '') + '>' + y + '</option>';
    return '<select class="onb-input" id="onb-year"><option value="">' + esc(tx('اختر السنة', 'Select year')) + '</option>' + opts + '</select>';
  }

  function gradeSelect(code) {
    var cur = W.completed[code] || '';
    var opts = '<option value="">' + esc(tx('الدرجة', 'Grade')) + '</option>' +
      GRADES.map(function (g) { return '<option value="' + g + '"' + (cur === g ? ' selected' : '') + '>' + g + '</option>'; }).join('');
    return '<select class="onb-grade" data-code="' + esc(code) + '">' + opts + '</select>';
  }

  function levelsBody() {
    /*@3.ONLJ.19*/
    var intro = '<p class="onb-lead">' + esc(tx('أشِّر المواد التي أتممتها في المستويات السابقة (درجة كل مادة اختياريةٌ).',
      'Tick courses you completed in earlier levels (grade per course is optional).')) + '</p>';
    var html = intro;
    function section(hdr, courses) {
      if (!courses.length) return '';
      return '<div class="onb-level"><div class="onb-level-h">' + esc(hdr) + '</div>' +
        '<div class="onb-courses">' + courses.map(function (c) {
          var on = W.completed[c.code] != null;
          return '<label class="onb-course' + (on ? ' on' : '') + '">' +
            '<input type="checkbox" class="onb-ck" data-code="' + esc(c.code) + '"' + (on ? ' checked' : '') + '>' +
            '<span class="onb-course-name">' + esc(isAr() ? c.name_ar : c.name_en) + ' <em>(' + esc(c.code) + ')</em></span>' +
            (on ? gradeSelect(c.code) : '') +
          '</label>';
        }).join('') + '</div></div>';
    }
    for (var n = 3; n <= 8; n++) {
      var own = (_catalog.courses || []).filter(function (c) { return levelNum(c) === n; });
      html += section(tx('المستوى ', 'Level ') + n, own);
    }
    html += section(tx('مواد عامة', 'General courses'), (_catalog.courses || []).filter(isGeneral));
    return html;
  }

  /*@3.ONLJ.20*/
  function curRow(c, extra) {
    var on = W.current.indexOf(c.code) !== -1;
    var g = W.completed[c.code];
    var isF = (g === 'F');
    var nm = isAr() ? c.name_ar : c.name_en;
    var hay = (String(nm) + ' ' + c.code).toLowerCase();
    return '<label class="onb-course' + (on ? ' on' : '') + (extra ? ' onb-extra' : '') + '" data-search="' + esc(hay) + '"' + (extra && !on ? ' style="display:none"' : '') + '>' +
      '<input type="checkbox" class="onb-cur-ck" data-code="' + esc(c.code) + '"' + (on ? ' checked' : '') + '>' +
      '<span class="onb-course-name">' + esc(nm) + ' <em>(' + esc(c.code) + ')</em></span>' +
      (isF ? '<span class="onb-repeat-tag">' + esc(tx('إعادة', 'Repeat')) + '</span>' : '') +
    '</label>';
  }

  function currentBody() {
    var summer = W.term === 'summer';
    var termToggle =
      '<div class="onb-term-toggle" role="group" aria-label="' + esc(tx('نوع الفصل', 'Term type')) + '">' +
        '<button type="button" class="onb-term-btn' + (!summer ? ' on' : '') + '" data-onb-term="regular">' + esc(tx('فصل عادي', 'Regular')) + '</button>' +
        '<button type="button" class="onb-term-btn' + (summer ? ' on' : '') + '" data-onb-term="summer">' + esc(tx('فصل صيفي', 'Summer')) + '</button>' +
      '</div>';

    var html = termToggle;

    /*@3.ONLJ.21*/
    html += '<label class="onb-field-lbl">' + esc(tx('اسم الفصل', 'Semester name')) + '</label>' +
      (window.GardenBiName ? window.GardenBiName.fieldHtml({
        idAr: 'onb-sem', idEn: 'onb-sem-en', cls: 'onb-input', max: 60,
        valAr: W.semAr, valEn: W.semEn,
        phAr: tx('مثال: المستوى الرابع', 'e.g. المستوى الرابع'),
        phEn: 'e.g. Level 4'
      }) : '') +
      '<p class="onb-hint">' + esc(tx('اضغط الحقل لتظهر التسميات الجاهزة — واختيار واحدة يملأ اللغتين.',
        'Tap the field for ready-made labels — picking one fills both languages.')) + '</p>';

    /*@3.ONLJ.22*/
    function eligible(c) {
      var g = W.completed[c.code];
      var done = (g != null);
      if (done && g !== 'F') return false;   /*@3.ONLJ.23*/
      return true;
    }
    var all = (_catalog.courses || []).filter(eligible);

    var primary, extra;
    if (!summer) {
      var eff = effectiveLevel();
      var lvOpts = '';
      for (var n = 3; n <= 8; n++) lvOpts += '<option value="' + n + '"' + (eff === n ? ' selected' : '') + '>' + esc(tx('المستوى ' + n, 'Level ' + n)) + '</option>';
      html += '<label class="onb-field-lbl">' + esc(tx('المستوى الحالي', 'Current level')) + '</label>' +
        '<select class="onb-input" id="onb-curlevel">' + lvOpts + '</select>';
      primary = all.filter(function (c) { return isGeneral(c) || levelNum(c) === eff; });
      extra = all.filter(function (c) { return !(isGeneral(c) || levelNum(c) === eff); });
    } else {
      html += '<p class="onb-lead onb-summer-hint">' + esc(tx('الفصل الصيفي: من مادة إلى ثلاث مواد، بلا مستوى دراسي.',
        'Summer term: 1 to 3 courses, no study level.')) + '</p>';
      primary = all.filter(isGeneral);
      extra = all.filter(function (c) { return !isGeneral(c); });
    }

    html += '<label class="onb-field-lbl">' + esc(tx('مواد هذا الفصل', 'This term’s courses')) +
      ' <span class="onb-cur-count" id="onb-cur-count"></span></label>';
    html += '<input class="onb-input onb-cur-search" id="onb-cur-search" type="text" ' +
      'placeholder="' + esc(tx('ابحث عن مادة…', 'Search a course…')) + '" autocomplete="off">';
    html += '<div class="onb-courses" id="onb-cur-courses">' +
      primary.map(function (c) { return curRow(c, false); }).join('') +
      extra.map(function (c) { return curRow(c, true); }).join('') +
      '</div>';
    html += '<button type="button" class="onb-other-toggle' + (W.showOther ? ' open' : '') + '" data-onb-toggle="other">' +
      esc(tx('مواد من مستويات أخرى', 'Courses from other levels')) + '</button>';
    return html;
  }

  function doneBody() {
    var doneCount = Object.keys(W.completed).length;
    var termTxt = W.term === 'summer' ? tx('فصل صيفي', 'summer term') : tx('فصل عادي', 'regular term');
    return '<p class="onb-lead">' + esc(tx('حفظنا بياناتك: ', 'Saved: ')) +
      esc((isAr() ? (W.nameAr || W.nameEn) : (W.nameEn || W.nameAr)) || tx('طالب', 'Student')) + ' · ' +
      esc(termTxt) + ' · ' +
      esc(tx(doneCount + ' مادة مُتمّة', doneCount + ' completed courses')) + ' · ' +
      esc(tx(W.current.length + ' مادة حالية', W.current.length + ' current courses')) + '</p>' +
      '<p class="onb-lead">' + esc(tx('يمكنك تعديل كل ذلك لاحقاً من «بياناتي وبدايتي» في الإعدادات. فعّل المزامنة من الإعدادات لتحفظ تقدّمك عبر أجهزتك.',
        'Edit anytime from “My data & start” in Settings. Enable Sync in Settings to keep progress across devices.')) + '</p>';
  }

  /*@3.ONLJ.24*/
  function collect() {
    var name = STEPS[W.step];
    if (name === 'name') {
      var i = document.getElementById('onb-name'); if (i) W.nameAr = i.value.trim();
      var ie = document.getElementById('onb-name-en'); if (ie) W.nameEn = ie.value.trim();
    }
    else if (name === 'year') { var y = document.getElementById('onb-year'); if (y && y.value) W.startYear = parseInt(y.value, 10); }
    else if (name === 'levels') {
      document.querySelectorAll('.onb-ck').forEach(function (ck) {
        var code = ck.getAttribute('data-code');
        if (ck.checked) { if (W.completed[code] == null) W.completed[code] = ''; }
        else { delete W.completed[code]; }
      });
      document.querySelectorAll('.onb-grade').forEach(function (g) {
        var code = g.getAttribute('data-code');
        if (W.completed[code] != null) W.completed[code] = g.value;
      });
    }
    else if (name === 'current') {
      var sa = document.getElementById('onb-sem'); if (sa) W.semAr = sa.value.trim();
      var se = document.getElementById('onb-sem-en'); if (se) W.semEn = se.value.trim();
      var cl = document.getElementById('onb-curlevel'); if (cl) { W.currentLevel = parseInt(cl.value, 10); W.levelTouched = true; }
      W.current = [];
      document.querySelectorAll('.onb-cur-ck').forEach(function (ck) { if (ck.checked) W.current.push(ck.getAttribute('data-code')); });
    }
  }

  function updateCurCount() {
    var el = document.getElementById('onb-cur-count');
    if (!el) return;
    var n = W.current.length;
    var summer = W.term === 'summer';
    var warn = summer && n > 3;
    el.textContent = summer ? tx('(' + n + '/3)', '(' + n + '/3)') : '(' + n + ')';
    el.classList.toggle('warn', warn);
  }

  function filterCurCourses() {
    var s = document.getElementById('onb-cur-search');
    var q = (s ? s.value : '').trim().toLowerCase();
    document.querySelectorAll('#onb-cur-courses .onb-course').forEach(function (row) {
      var isExtra = row.classList.contains('onb-extra');
      var on = row.querySelector('input').checked;
      var hay = row.getAttribute('data-search') || '';
      var matches = !q || hay.indexOf(q) !== -1;
      var visible;
      if (on) visible = matches;               /*@3.ONLJ.25*/
      else if (q) visible = matches;
      else visible = !isExtra || W.showOther;   /*@3.ONLJ.26*/
      row.style.display = visible ? '' : 'none';
    });
  }

  function commit() {
    /*@3.ONLJ.27*/
    var prof = readJSON('student_profile', {}) || {};
    var pv = biResolve(W.nameAr, W.nameEn);
    if (pv) { prof.name = pv.name; prof.name_ar = pv.name_ar; prof.name_en = pv.name_en; }
    if (W.startYear) prof.start_year = W.startYear;
    writeJSON('student_profile', prof);

    /*@3.ONLJ.28*/
    var arch = readJSON('semester_archive', []) || [];
    arch = arch.filter(function (a) { return a && a.id !== PRIOR_ID; });
    if (Object.keys(W.completed).length) {
      arch.push({
        id: PRIOR_ID,
        name: tx('سجل سابق', 'Prior record'),
        courses: Object.keys(W.completed).map(function (code) { return { code: code, grade: W.completed[code] || null }; })
      });
    }
    writeJSON('semester_archive', arch);

    /*@3.ONLJ.29*/
    var sem = readJSON('my_semester', null) || { name: tx('فصلي', 'My semester'), courses: [] };
    var byCode = {};
    (sem.courses || []).forEach(function (c) { if (c && c.code) byCode[c.code] = c; });
    sem.courses = W.current.map(function (code) {
      return byCode[code] || { code: code, added_at: new Date().toISOString(), completed: false };
    });
    sem.term = (W.term === 'summer') ? 'summer' : 'regular';
    var sv = biResolve(W.semAr, W.semEn);
    if (sv) { sem.name = sv.name; sem.name_ar = sv.name_ar; sem.name_en = sv.name_en; }
    writeJSON('my_semester', sem);

    /*@3.ONLJ.30*/
    if (window.GardenData && GardenData.rebuildGrades) { try { GardenData.rebuildGrades(); } catch (e) {} }

    /*@3.ONLJ.31*/
    var st = loadState();
    st.completed_v = CURRENT_V; st.seen_v = CURRENT_V; st.step = 0; st.data = {};
    saveState(st);
  }

  function wire(o) {
    o.addEventListener('click', function (e) {
      /*@3.ONLJ.32*/
      var term = e.target.closest('[data-onb-term]');
      if (term) { collect(); W.term = term.getAttribute('data-onb-term'); render(); return; }
      /*@3.ONLJ.33*/
      var tog = e.target.closest('[data-onb-toggle]');
      if (tog) { W.showOther = !W.showOther; tog.classList.toggle('open', W.showOther); filterCurCourses(); return; }

      var b = e.target.closest('[data-onb]');
      if (!b) return;
      var act = b.getAttribute('data-onb');
      if (act === 'back') { collect(); W.step = Math.max(0, W.step - 1); render(); }
      else if (act === 'next') {
        collect();
        /*@3.ONLJ.34*/
        if (STEPS[W.step] === 'name' && !W.nameAr && !W.nameEn) {
          var i = document.getElementById('onb-name'); if (i) i.focus(); return;
        }
        /*@3.ONLJ.35*/
        if (STEPS[W.step] === 'current' && W.term === 'summer' && W.current.length > 3) {
          alert(tx('الفصل الصيفي يسمح بثلاث مواد كحدٍّ أقصى.', 'Summer term allows up to 3 courses.'));
          return;
        }
        W.step = Math.min(STEPS.length - 1, W.step + 1);
        render();
      }
      else if (act === 'later') { collect(); persistProgress(); sealSeen(); close(); markReminder(); }
      else if (act === 'finish') { commit(); close(); notifyDone(); }
    });

    /*@3.ONLJ.36*/
    o.addEventListener('dblclick', function (e) {
      if (e.target !== o) return;   /*@3.ONLJ.37*/
      collect(); persistProgress(); sealSeen(); close(); markReminder();
    });

    /*@3.ONLJ.38*/
    o.addEventListener('change', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('onb-ck')) {
        var code = t.getAttribute('data-code');
        var label = t.closest('.onb-course');
        if (t.checked) {
          if (W.completed[code] == null) W.completed[code] = '';
          if (label) { label.classList.add('on'); if (!label.querySelector('.onb-grade')) label.insertAdjacentHTML('beforeend', gradeSelect(code)); }
        } else {
          delete W.completed[code];
          if (label) { label.classList.remove('on'); var g0 = label.querySelector('.onb-grade'); if (g0) g0.remove(); }
        }
        persistProgress();
      }
      else if (t.classList && t.classList.contains('onb-grade')) {
        var code2 = t.getAttribute('data-code');
        if (W.completed[code2] != null) W.completed[code2] = t.value;
        persistProgress();
      }
      else if (t.classList && t.classList.contains('onb-cur-ck')) {
        var code3 = t.getAttribute('data-code');
        var label3 = t.closest('.onb-course');
        if (t.checked) { if (W.current.indexOf(code3) === -1) W.current.push(code3); if (label3) label3.classList.add('on'); }
        else { W.current = W.current.filter(function (x) { return x !== code3; }); if (label3) label3.classList.remove('on'); }
        updateCurCount();
        persistProgress();
      }
      else if (t.id === 'onb-curlevel') {
        /*@3.ONLJ.39*/
        W.currentLevel = parseInt(t.value, 10); W.levelTouched = true;
        var bd = document.querySelector('.onb-body'); var sc = bd ? bd.scrollTop : 0;
        render();
        var nb = document.querySelector('.onb-body'); if (nb) nb.scrollTop = sc;
      }
    });

    /*@3.ONLJ.40*/
    o.addEventListener('input', function (e) {
      if (e.target.id === 'onb-cur-search') filterCurCourses();
    });

    if (STEPS[W.step] === 'current') updateCurCount();
    var nameInput = document.getElementById('onb-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 60);
  }

  function markReminder() {
    /*@3.ONLJ.41*/
    var s = document.querySelector('[data-view="settings"]');
    if (s && !s.querySelector('.onb-remind-dot')) {
      var d = document.createElement('span'); d.className = 'onb-remind-dot'; s.appendChild(d);
    }
  }

  function notifyDone() {
    try { document.dispatchEvent(new CustomEvent('garden:onboardingDone')); } catch (e) {}
    /*@3.ONLJ.42*/
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
      setTimeout(function () { location.reload(); }, 200);
    }
  }

  /*@3.ONLJ.43*/
  window.Onboarding = {
    open: function () {
      var st = loadState();
      if (st.completed_v >= CURRENT_V) open(0, null, true);
      else open(0, st.data || {});
    },
    launchIfNeeded: launchIfNeeded
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launchIfNeeded);
  else launchIfNeeded();
})();
