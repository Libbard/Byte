/*@3.COHJ.1*/

;(function () {
  'use strict';

  var D = window.GardenData;
  var CODE = new URLSearchParams(location.search).get('code') || '';
  var meta = null, info = null, stats = null;
  var editing = {};   /*@3.COHJ.2*/

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function uid(p) { return p + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000); }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:3000;' +
      'background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:9999px;' +
      'padding:.5rem 1.1rem;font-size:.82rem;font-weight:700;color:var(--text-primary);' +
      'box-shadow:0 8px 24px var(--shadow-base)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  function empty(icon, text) {
    return '<div class="ch-empty"><div class="ch-empty-icon">' + icon + '</div>' +
           '<div class="ch-empty-text">' + esc(text) + '</div></div>';
  }

  /*@3.COHJ.3*/

  function renderHero() {
    var name = info ? (isAr() ? info.name_ar : info.name_en) : CODE;
    var color = (info && info.brand_color) || '#a78bfa';
    document.documentElement.style.setProperty('--c', color);
    document.title = name + ' · ' + tx('بطاقة المادة', 'Course card');
    /*@3.COHJ.4*/
    if (window.GardenHeader) window.GardenHeader.setTitle(CODE, CODE);

    var pct = stats.totalQuizzes ? Math.round((stats.quizzesDone / stats.totalQuizzes) * 100) : 0;
    var grade = courseGrade();
    var base = info && info.path ? '../' + info.path : null;

    el('ch-hero').innerHTML =
      '<div class="ch-hero-code">' + esc(CODE) + '</div>' +
      '<h1 class="ch-hero-name">' + esc(name) + '</h1>' +
      '<div class="ch-hero-stats">' +
        stat(pct + '%', tx('التقدّم', 'Progress')) +
        stat(String((info && info.credits) || '—'), tx('ساعة', 'Credits')) +
        stat(String((info && info.modules) || '—'), tx('وحدة', 'Modules')) +
        stat(String(stats.due), tx('مستحقّة', 'Due'), stats.due ? '#f43f5e' : null) +
        (grade ? stat(grade, tx('الدرجة', 'Grade')) : '') +
      '</div>' +
      '<div class="ch-hero-bar"><div class="ch-hero-fill" style="width:' + pct + '%"></div></div>' +
      (base ? '<div class="ch-quick">' +
        '<a href="' + esc(base) + '"><i class="fa-solid fa-book"></i> ' + esc(tx('الوحدات', 'Modules')) + '</a>' +
        '<a class="ch-mid" data-mid href="' + esc(base) + 'midterm-review.html"><i class="fa-solid fa-list-check"></i> ' + esc(tx('مراجعة النصفي', 'Midterm review')) + '</a>' +
        '<a href="' + esc(base) + 'final-review.html"><i class="fa-solid fa-list-check"></i> ' + esc(tx('مراجعة النهائي', 'Final review')) + '</a>' +
        '<a class="ch-mid" data-mid href="' + esc(base) + 'midterm-quiz.html"><i class="fa-solid fa-circle-question"></i> ' + esc(tx('كويز النصفي', 'Midterm quiz')) + '</a>' +
        '<a href="' + esc(base) + 'final-quiz.html"><i class="fa-solid fa-circle-question"></i> ' + esc(tx('كويز النهائي', 'Final quiz')) + '</a>' +
        '<a href="schedule.html"><i class="fa-solid fa-calendar-week"></i> ' + esc(tx('الجدول', 'Schedule')) + '</a>' +
      '</div>' : '');
    /*@3.COHJ.5*/
    if (base) hideMissingMidterm(base);
  }
  /*@3.COHJ.6*/
  function hideMissingMidterm(base) {
    fetch(base + 'midterm-review.html', { method: 'HEAD' }).then(function (r) {
      if (!r.ok) {
        var mids = document.querySelectorAll('#ch-hero .ch-mid[data-mid]');
        for (var i = 0; i < mids.length; i++) mids[i].remove();
      }
    }).catch(function () { /*@3.COHJ.7*/ });
  }
  function stat(v, l, color) {
    return '<div class="ch-stat"><span class="ch-stat-val"' + (color ? ' style="color:' + color + '"' : '') + '>' +
           esc(v) + '</span><span class="ch-stat-lbl">' + esc(l) + '</span></div>';
  }
  function courseGrade() {
    var g = null;
    try { g = JSON.parse(localStorage.getItem('gpa_grades') || 'null'); } catch (e) {}
    if (!g || !g.semesters) return null;
    for (var i = g.semesters.length - 1; i >= 0; i--) {
      var f = (g.semesters[i].courses || []).find(function (c) { return c.code === CODE && c.grade; });
      if (f) return f.grade;
    }
    return null;
  }

  /*@3.COHJ.8*/

  function renderInstructors() {
    var box = el('panel-instructors');
    var html = meta.instructors.map(function (ins, i) {
      if (editing.ins === ins.id) return insForm(ins);
      return '<div class="ch-card">' +
        '<div class="ch-card-head">' +
          '<span class="ch-card-title">' + esc(ins.name || tx('بلا اسم', 'Unnamed')) + '</span>' +
          '<span class="ch-card-actions">' +
            '<button class="ch-icon-btn" data-act="ins-edit" data-id="' + esc(ins.id) + '" title="' + esc(tx('تعديل', 'Edit')) + '"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="ch-icon-btn danger" data-act="ins-del" data-id="' + esc(ins.id) + '" title="' + esc(tx('حذف', 'Delete')) + '"><i class="fa-solid fa-trash"></i></button>' +
          '</span>' +
        '</div>' +
        (ins.email ? '<div class="ch-row"><i class="fa-solid fa-envelope"></i>' +
          '<a class="ch-row-val" href="mailto:' + esc(ins.email) + '" style="color:var(--c);text-decoration:none">' + esc(ins.email) + '</a>' +
          '<button class="ch-icon-btn" data-act="copy" data-val="' + esc(ins.email) + '" title="' + esc(tx('نسخ', 'Copy')) + '"><i class="fa-solid fa-copy"></i></button></div>' : '') +
        (ins.office_hours ? '<div class="ch-row"><i class="fa-regular fa-clock"></i><span class="ch-row-val">' + esc(ins.office_hours) + '</span></div>' : '') +
        (ins.location ? '<div class="ch-row"><i class="fa-solid fa-location-dot"></i><span class="ch-row-val">' + esc(ins.location) + '</span></div>' : '') +
        (ins.note ? '<div class="ch-row"><i class="fa-regular fa-note-sticky"></i><span class="ch-row-val">' + esc(ins.note) + '</span></div>' : '') +
      '</div>';
    }).join('');

    if (editing.ins === 'new') html += insForm({ id: 'new' });
    if (!meta.instructors.length && editing.ins !== 'new') {
      html = empty('<i class="fa-solid fa-chalkboard-user"></i>', tx('لم تُضِف دكتور المادة بعد — أضِف المحاضر والمعيد وساعاتهما المكتبية.',
                              'No instructor yet — add the lecturer, TA and their office hours.'));
    }
    html += '<button class="ch-add-btn" data-act="ins-new">+ ' + esc(tx('إضافة دكتور / معيد', 'Add instructor / TA')) + '</button>';
    /*@3.COHJ.9*/
    html += '<div id="ch-rated"></div>';
    box.innerHTML = html;
    renderRated();
  }

  /*@3.COHJ.10*/
  var RATED = null;
  function renderRated() {
    var box = el('ch-rated');
    if (!box) return;
    var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
    if (!API || !CODE) return;
    if (RATED === null) {
      RATED = 'loading';
      fetch(API + '/v1/faculty/index.json', { cache: 'default' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { RATED = (d && d.faculty) || []; renderRated(); })
        .catch(function () { RATED = []; });
      return;
    }
    if (RATED === 'loading' || !RATED.length) return;
    /*@3.COHJ.11*/
    var code = String(CODE).toUpperCase();
    var mine = RATED.filter(function (f) { return (f.c || []).indexOf(code) >= 0; })
      .sort(function (a, b) { return (b.rk || 0) - (a.rk || 0); });
    if (!mine.length) return;
    box.innerHTML =
      '<div class="ch-sec-h"><i class="fa-solid fa-star"></i>' +
        esc(tx('قيّمهم الطلاب في هذه المادة', 'Rated by students in this course')) + '</div>' +
      mine.map(function (f) {
        var col = f.idx >= 80 ? '#10b981' : f.idx >= 60 ? '#f59e0b' : f.idx >= 40 ? '#f97316' : '#ef4444';
        return '<a class="ch-rated-row" href="faculty.html#' + encodeURIComponent(f.id) + '">' +
          '<span class="ch-rated-n" style="color:' + col + '">' + (f.idx == null ? '—' : f.idx) + '</span>' +
          '<span class="ch-rated-name">' + esc(f.name) + '</span>' +
          '<span class="ch-rated-c">' + esc(tx(f.n + ' تقييماً', f.n + ' ratings')) + '</span>' +
          '<i class="fa-solid fa-chevron-left ch-rated-go"></i></a>';
      }).join('');
  }

  function insForm(ins) {
    return '<div class="ch-card"><div class="ch-form">' +
      '<input class="ch-input" id="f-ins-name" placeholder="' + esc(tx('الاسم', 'Name')) + '" value="' + esc(ins.name || '') + '">' +
      '<div class="ch-form-row">' +
        '<input class="ch-input" id="f-ins-email" type="email" placeholder="' + esc(tx('الإيميل', 'Email')) + '" value="' + esc(ins.email || '') + '">' +
        '<input class="ch-input" id="f-ins-hours" placeholder="' + esc(tx('الساعات المكتبية', 'Office hours')) + '" value="' + esc(ins.office_hours || '') + '">' +
      '</div>' +
      '<div class="ch-form-row">' +
        '<input class="ch-input" id="f-ins-loc" placeholder="' + esc(tx('المكتب / القاعة', 'Office / room')) + '" value="' + esc(ins.location || '') + '">' +
        '<input class="ch-input" id="f-ins-note" placeholder="' + esc(tx('ملاحظة', 'Note')) + '" value="' + esc(ins.note || '') + '">' +
      '</div>' +
      '<div style="display:flex;gap:.4rem">' +
        '<button class="ch-btn ch-btn-primary" data-act="ins-save" data-id="' + esc(ins.id) + '">' + esc(tx('حفظ', 'Save')) + '</button>' +
        '<button class="ch-btn" data-act="cancel">' + esc(tx('إلغاء', 'Cancel')) + '</button>' +
      '</div></div></div>';
  }

  /*@3.COHJ.12*/

  function allDates() {
    var exams = D.courseExams(CODE).map(function (e) {
      return { id: e.id, src: 'schedule', type: e.exam_type || 'exam', title: '',
               date: e.date, time: e.start_time, location: e.room, note: e.notes };
    });
    var tasks = meta.dates.map(function (d) {
      return { id: d.id, src: 'meta', type: d.type || 'assignment', title: d.title || '',
               date: d.date, time: d.time, location: d.location, note: d.note, done: !!d.done };
    });
    return exams.concat(tasks).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  }

  function renderDates() {
    var box = el('panel-dates');
    var list = allDates();
    var html = '';
    if (editing.date) html += dateForm(list.find(function (d) { return d.id === editing.date; }) || { id: 'new' });

    if (!list.length && !editing.date) {
      html += empty('<i class="fa-solid fa-calendar-days"></i>', tx('لا مواعيد بعد — أضِف اختباراتك وتسليماتك لتظهر في الجدول واللوحة.',
                             'No dates yet — add exams and deliverables to see them on the schedule and dashboard.'));
    } else {
      html += list.map(function (d) {
        if (editing.date === d.id) return '';
        var dt = d.date ? new Date(d.date + 'T00:00:00') : null;
        var day = dt ? dt.getDate() : '—';
        var mon = dt ? new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-gregory' : 'en', { month: 'short' }).format(dt) : '';
        var cd = countdown(d.date);
        var isExam = d.src === 'schedule';
        /*@3.COHJ.13*/
        return '<div class="ch-card ch-date-card' + (d.done ? ' is-done' : '') + '">' +
          '<div class="ch-date-badge"><div class="ch-date-day">' + day + '</div><div class="ch-date-mon">' + esc(mon) + '</div></div>' +
          '<div class="ch-date-info">' +
            '<span class="ch-date-type ch-t-' + esc(d.type) + '">' + esc(typeLabel(d.type)) + '</span>' +
            esc(d.title || '') +
            '<span class="ch-source">' + esc(isExam ? tx('الجدول', 'Schedule') : tx('بطاقة المادة', 'Card')) + '</span>' +
            '<div class="ch-date-meta">' +
              (d.time ? '<i class="fa-solid fa-clock"></i> ' + esc(d.time) + ' ' : '') +
              (d.location ? '<i class="fa-solid fa-location-dot"></i> ' + esc(d.location) + ' ' : '') +
              (d.note ? '· ' + esc(d.note) : '') +
            '</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div class="ch-countdown ' + cd.cls + '">' + esc(cd.text) + '</div>' +
            '<div style="display:flex;gap:.2rem;margin-top:.3rem">' +
              (isExam ? '' :
                '<button class="ch-icon-btn" data-act="date-done" data-id="' + esc(d.id) + '" ' +
                  'aria-pressed="' + (d.done ? 'true' : 'false') + '" ' +
                  'aria-label="' + esc(tx('إتمام', 'Complete')) + '">' + (d.done ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle"></i>') + '</button>') +
              '<button class="ch-icon-btn" data-act="date-edit" data-id="' + esc(d.id) + '"><i class="fa-solid fa-pen"></i></button>' +
              '<button class="ch-icon-btn danger" data-act="date-del" data-id="' + esc(d.id) + '" data-src="' + d.src + '"><i class="fa-solid fa-trash"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    if (!editing.date) html += '<button class="ch-add-btn" data-act="date-new">+ ' + esc(tx('إضافة موعد', 'Add date')) + '</button>';
    box.innerHTML = html;
  }

  function typeLabel(t) {
    var m = {
      final: tx('نهائي', 'Final'), midterm: tx('نصفي', 'Midterm'),
      quiz: tx('كويز', 'Quiz'), exam: tx('اختبار', 'Exam'),
      assignment: tx('تسليم', 'Assignment')
    };
    return m[t] || t;
  }

  function countdown(date) {
    if (!date) return { text: '', cls: 'ch-cd-far' };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var d = new Date(date + 'T00:00:00');
    var days = Math.round((d - today) / 86400000);
    if (days < 0) return { text: tx('مضى', 'Passed'), cls: 'ch-cd-late' };
    if (days === 0) return { text: tx('اليوم', 'Today'), cls: 'ch-cd-late' };
    if (days === 1) return { text: tx('غداً', 'Tomorrow'), cls: 'ch-cd-soon' };
    /*@3.COHJ.14*/
    var txt = (window.Garden && window.Garden.smartCount)
      ? window.Garden.smartCount(days, ['يوم', 'يومان', 'أيام'], ['day', 'days'])
      : days + ' ' + tx('يوم', 'days');
    return { text: tx('بعد ' + txt, txt), cls: days <= 7 ? 'ch-cd-soon' : 'ch-cd-far' };
  }

  function dateForm(d) {
    d = d || {};
    var types = ['final', 'midterm', 'quiz', 'exam', 'assignment'];
    return '<div class="ch-card"><div class="ch-form">' +
      '<div class="ch-form-row">' +
        '<select class="ch-select" id="f-d-type">' + types.map(function (t) {
          return '<option value="' + t + '"' + (d.type === t ? ' selected' : '') + '>' + esc(typeLabel(t)) + '</option>';
        }).join('') + '</select>' +
        '<input class="ch-input" id="f-d-date" type="date" value="' + esc(d.date || '') + '">' +
      '</div>' +
      '<div class="ch-form-row">' +
        '<input class="ch-input" id="f-d-time" type="time" value="' + esc(d.time || '') + '">' +
        '<input class="ch-input" id="f-d-loc" placeholder="' + esc(tx('القاعة', 'Room')) + '" value="' + esc(d.location || '') + '">' +
      '</div>' +
      '<input class="ch-input" id="f-d-title" placeholder="' + esc(tx('العنوان (للتسليمات)', 'Title (for assignments)')) + '" value="' + esc(d.title || '') + '">' +
      '<input class="ch-input" id="f-d-note" placeholder="' + esc(tx('ملاحظة', 'Note')) + '" value="' + esc(d.note || '') + '">' +
      '<div class="ch-hint" style="font-size:.68rem;color:var(--text-muted)">' +
        esc(tx('الاختبارات تُحفظ في الجدول الأسبوعي (المصدر الوحيد) وتظهر فيه تلقائياً.',
               'Exams are saved to the weekly schedule (the single source) and appear there automatically.')) + '</div>' +
      '<div style="display:flex;gap:.4rem">' +
        '<button class="ch-btn ch-btn-primary" data-act="date-save" data-id="' + esc(d.id || 'new') + '" data-src="' + esc(d.src || '') + '">' + esc(tx('حفظ', 'Save')) + '</button>' +
        '<button class="ch-btn" data-act="cancel">' + esc(tx('إلغاء', 'Cancel')) + '</button>' +
      '</div></div></div>';
  }

  /*@3.COHJ.15*/

  var noteQuery = '';
  function renderNotes() {
    var box = el('panel-notes');
    var q = noteQuery.trim().toLowerCase();
    var list = meta.notes.filter(function (n) {
      return !q || (n.title || '').toLowerCase().indexOf(q) !== -1 || (n.body || '').toLowerCase().indexOf(q) !== -1;
    });
    var html = '<input class="ch-search" id="note-q" placeholder="' + esc(tx('ابحث في ملاحظات المادة…', 'Search this course’s notes…')) + '" value="' + esc(noteQuery) + '">';
    if (editing.note) html += noteForm(meta.notes.find(function (n) { return n.id === editing.note; }) || { id: 'new' });

    if (!meta.notes.length && !editing.note) {
      html += empty('<i class="fa-solid fa-note-sticky"></i>', tx('لا ملاحظات بعد — دوّن ما يقوله الدكتور في المحاضرة.',
                             'No notes yet — jot down what the professor says in class.'));
    } else if (!list.length) {
      html += empty('<i class="fa-solid fa-magnifying-glass"></i>', tx('لا نتائج مطابقة.', 'No matches.'));
    } else {
      html += list.map(function (n) {
        if (editing.note === n.id) return '';
        return '<div class="ch-card">' +
          '<div class="ch-card-head">' +
            '<span class="ch-card-title">' + esc(n.title || tx('بلا عنوان', 'Untitled')) + '</span>' +
            '<span class="ch-card-actions">' +
              '<button class="ch-icon-btn" data-act="note-edit" data-id="' + esc(n.id) + '"><i class="fa-solid fa-pen"></i></button>' +
              '<button class="ch-icon-btn danger" data-act="note-del" data-id="' + esc(n.id) + '"><i class="fa-solid fa-trash"></i></button>' +
            '</span>' +
          '</div>' +
          '<div class="ch-note-body">' + esc(n.body || '') + '</div>' +
        '</div>';
      }).join('');
    }
    if (!editing.note) html += '<button class="ch-add-btn" data-act="note-new">+ ' + esc(tx('ملاحظة جديدة', 'New note')) + '</button>';
    box.innerHTML = html;
  }

  function noteForm(n) {
    return '<div class="ch-card"><div class="ch-form">' +
      '<input class="ch-input" id="f-n-title" placeholder="' + esc(tx('العنوان', 'Title')) + '" value="' + esc(n.title || '') + '">' +
      '<textarea class="ch-textarea" id="f-n-body" placeholder="' + esc(tx('نص الملاحظة…', 'Note body…')) + '">' + esc(n.body || '') + '</textarea>' +
      '<div style="display:flex;gap:.4rem">' +
        '<button class="ch-btn ch-btn-primary" data-act="note-save" data-id="' + esc(n.id) + '">' + esc(tx('حفظ', 'Save')) + '</button>' +
        '<button class="ch-btn" data-act="cancel">' + esc(tx('إلغاء', 'Cancel')) + '</button>' +
      '</div></div></div>';
  }

  /*@3.COHJ.16*/

  function renderLinks() {
    var box = el('panel-links');
    var html = meta.links.map(function (l) {
      if (editing.link === l.id) return linkForm(l);
      return '<div class="ch-card"><div class="ch-card-head">' +
        '<a class="ch-card-title" href="' + esc(l.url) + '" target="_blank" rel="noopener" style="color:var(--c);text-decoration:none">' +
          '<i class="fa-solid fa-link"></i> ' + esc(l.label || l.url) + '</a>' +
        '<span class="ch-card-actions">' +
          '<button class="ch-icon-btn" data-act="copy" data-val="' + esc(l.url) + '"><i class="fa-solid fa-copy"></i></button>' +
          '<button class="ch-icon-btn" data-act="link-edit" data-id="' + esc(l.id) + '"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="ch-icon-btn danger" data-act="link-del" data-id="' + esc(l.id) + '"><i class="fa-solid fa-trash"></i></button>' +
        '</span></div>' +
        '<div class="ch-row"><span class="ch-row-val" style="font-size:.7rem;color:var(--text-muted)">' + esc(l.url) + '</span></div>' +
      '</div>';
    }).join('');
    if (editing.link === 'new') html += linkForm({ id: 'new' });
    if (!meta.links.length && editing.link !== 'new') {
      html = empty('<i class="fa-solid fa-link"></i>', tx('لا روابط بعد — أضِف Blackboard وقروب المادة والمراجع.',
                            'No links yet — add Blackboard, the course group and references.'));
    }
    html += '<button class="ch-add-btn" data-act="link-new">+ ' + esc(tx('إضافة رابط', 'Add link')) + '</button>';
    box.innerHTML = html;
  }

  function linkForm(l) {
    return '<div class="ch-card"><div class="ch-form">' +
      '<input class="ch-input" id="f-l-label" placeholder="' + esc(tx('الاسم (مثال: Blackboard)', 'Label (e.g. Blackboard)')) + '" value="' + esc(l.label || '') + '">' +
      '<input class="ch-input" id="f-l-url" type="url" placeholder="https://…" value="' + esc(l.url || '') + '">' +
      '<div style="display:flex;gap:.4rem">' +
        '<button class="ch-btn ch-btn-primary" data-act="link-save" data-id="' + esc(l.id) + '">' + esc(tx('حفظ', 'Save')) + '</button>' +
        '<button class="ch-btn" data-act="cancel">' + esc(tx('إلغاء', 'Cancel')) + '</button>' +
      '</div></div></div>';
  }

  /*@3.COHJ.17*/

  function save() { D.saveCourseMeta(CODE, meta); }
  function v(id) { var n = el(id); return n ? n.value.trim() : ''; }

  function onAction(e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    var id = t.getAttribute('data-id');
    var src = t.getAttribute('data-src');

    /*@3.COHJ.18*/
    if (act === 'copy') {
      navigator.clipboard.writeText(t.getAttribute('data-val') || '')
        .then(function () { toast(tx('نُسخ ✓', 'Copied ✓')); })
        .catch(function () { toast(tx('تعذّر النسخ', 'Copy failed')); });
      return;
    }
    if (act === 'cancel') { editing = {}; renderAll(); return; }

    /*@3.COHJ.19*/
    if (act === 'ins-new') { editing = { ins: 'new' }; renderInstructors(); return; }
    if (act === 'ins-edit') { editing = { ins: id }; renderInstructors(); return; }
    if (act === 'ins-del') {
      meta.instructors = meta.instructors.filter(function (x) { return x.id !== id; });
      save(); renderInstructors(); toast(tx('حُذف', 'Deleted')); return;
    }
    if (act === 'ins-save') {
      var rec = { id: id === 'new' ? uid('ins') : id, name: v('f-ins-name'), email: v('f-ins-email'),
                  office_hours: v('f-ins-hours'), location: v('f-ins-loc'), note: v('f-ins-note') };
      if (!rec.name) { toast(tx('الاسم مطلوب', 'Name is required')); return; }
      var i = meta.instructors.findIndex(function (x) { return x.id === rec.id; });
      if (i > -1) meta.instructors[i] = rec; else meta.instructors.push(rec);
      save(); editing = {}; renderInstructors(); toast(tx('حُفظ ✓', 'Saved ✓')); return;
    }

    /*@3.COHJ.20*/
    if (act === 'date-new') { editing = { date: 'new' }; renderDates(); return; }
    if (act === 'date-edit') { editing = { date: id }; renderDates(); return; }
    if (act === 'date-done') {
      var dRec = meta.dates.find(function (x) { return x.id === id; });
      if (dRec) { dRec.done = !dRec.done; save(); renderDates(); }
      return;
    }
    if (act === 'date-del') {
      if (src === 'schedule') D.deleteExam(id);
      else { meta.dates = meta.dates.filter(function (x) { return x.id !== id; }); save(); }
      renderDates(); toast(tx('حُذف', 'Deleted')); return;
    }
    if (act === 'date-save') {
      var type = v('f-d-type'), date = v('f-d-date');
      if (!date) { toast(tx('التاريخ مطلوب', 'Date is required')); return; }
      var isExam = type !== 'assignment';
      var existingSrc = src || (isExam ? 'schedule' : 'meta');

      /*@3.COHJ.21*/
      if (id !== 'new') {
        if (existingSrc === 'schedule' && !isExam) D.deleteExam(id);
        if (existingSrc === 'meta' && isExam) {
          meta.dates = meta.dates.filter(function (x) { return x.id !== id; }); save();
        }
      }

      if (isExam) {
        /*@3.COHJ.22*/
        D.upsertExam({
          id: (id !== 'new' && existingSrc === 'schedule') ? id : null,
          course_code: CODE, date: date, start_time: v('f-d-time') || '15:00',
          end_time: '', exam_type: type, room: v('f-d-loc'), notes: v('f-d-note')
        });
      } else {
        var prev = meta.dates.find(function (x) { return x.id === id; });
        var rec2 = { id: (id !== 'new' && existingSrc === 'meta') ? id : uid('date'),
                     type: 'assignment', title: v('f-d-title'), date: date,
                     time: v('f-d-time'), location: v('f-d-loc'), note: v('f-d-note'),
                     done: !!(prev && prev.done) };
        var j = meta.dates.findIndex(function (x) { return x.id === rec2.id; });
        if (j > -1) meta.dates[j] = rec2; else meta.dates.push(rec2);
        save();
      }
      editing = {}; renderDates(); toast(tx('حُفظ ✓', 'Saved ✓')); return;
    }

    /*@3.COHJ.23*/
    if (act === 'note-new') { editing = { note: 'new' }; renderNotes(); return; }
    if (act === 'note-edit') { editing = { note: id }; renderNotes(); return; }
    if (act === 'note-del') {
      meta.notes = meta.notes.filter(function (x) { return x.id !== id; });
      save(); renderNotes(); toast(tx('حُذفت', 'Deleted')); return;
    }
    if (act === 'note-save') {
      var n = { id: id === 'new' ? uid('note') : id, title: v('f-n-title'),
                body: el('f-n-body') ? el('f-n-body').value : '', updated_at: Date.now() };
      if (!n.title && !n.body) { toast(tx('اكتب شيئاً أولاً', 'Write something first')); return; }
      var k = meta.notes.findIndex(function (x) { return x.id === n.id; });
      if (k > -1) meta.notes[k] = n; else meta.notes.unshift(n);
      save(); editing = {}; renderNotes(); toast(tx('حُفظت ✓', 'Saved ✓')); return;
    }

    /*@3.COHJ.24*/
    if (act === 'link-new') { editing = { link: 'new' }; renderLinks(); return; }
    if (act === 'link-edit') { editing = { link: id }; renderLinks(); return; }
    if (act === 'link-del') {
      meta.links = meta.links.filter(function (x) { return x.id !== id; });
      save(); renderLinks(); toast(tx('حُذف', 'Deleted')); return;
    }
    if (act === 'link-save') {
      var url = v('f-l-url');
      if (!url) { toast(tx('الرابط مطلوب', 'URL is required')); return; }
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      var rec3 = { id: id === 'new' ? uid('link') : id, label: v('f-l-label'), url: url };
      var m = meta.links.findIndex(function (x) { return x.id === rec3.id; });
      if (m > -1) meta.links[m] = rec3; else meta.links.push(rec3);
      save(); editing = {}; renderLinks(); toast(tx('حُفظ ✓', 'Saved ✓')); return;
    }
  }

  /*@3.COHJ.25*/

  function showTab(name) {
    document.querySelectorAll('.ch-panel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === name);
    });
    document.querySelectorAll('.ch-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    try { localStorage.setItem('ch_tab', name); } catch (e) {}
  }

  function renderAll() {
    renderHero(); renderInstructors(); renderDates(); renderNotes(); renderLinks();
  }

  /*@3.COHJ.26*/

  function init() {
    if (!CODE) {
      document.querySelector('.ch-wrap').innerHTML =
        empty('<i class="fa-solid fa-circle-question"></i>', tx('لم تُحدَّد مادة. افتح البطاقة من اللوحة أو من صفحة فصلي.',
                       'No course specified. Open the card from the dashboard or My Semester.'));
      return;
    }
    D.ready().then(function () {
      info = D.courseInfo(CODE);
      meta = D.courseMeta(CODE);
      stats = D.courseStats(CODE);
      renderAll();
      showTab(localStorage.getItem('ch_tab') || 'overview');
    });

    document.addEventListener('click', onAction);
    document.addEventListener('input', function (e) {
      if (e.target.matches('#note-q')) { noteQuery = e.target.value; renderNotes(); el('note-q').focus(); }
    });
    document.querySelectorAll('.ch-tab').forEach(function (b) {
      b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
    });
    document.addEventListener('garden:languageChanged', function () {
      if (meta) renderAll();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
