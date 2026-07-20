 

;(function () {
  'use strict';

  var D = window.GardenData;
  var LS_PREFS = 'dashboard_prefs';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

   
  function countWord(n, arForms, enForms) {
    if (window.Garden && window.Garden.countWord) return window.Garden.countWord(n, arForms, enForms);
    return isAr() ? arForms[2] : enForms[1];
  }
   
  function smartCount(n, arForms, enForms, isAdj) {
    if (window.Garden && window.Garden.smartCount) return window.Garden.smartCount(n, arForms, enForms, isAdj);
    return n + ' ' + countWord(n, arForms, enForms);
  }

   
  var DEFAULT_ORDER = ['welcome', 'semester', 'gpa', 'today', 'due', 'tasks', 'notes'];
  var prefs = null;

  function loadPrefs() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(LS_PREFS) || 'null'); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!Array.isArray(p.order)) p.order = DEFAULT_ORDER.slice();
    
    DEFAULT_ORDER.forEach(function (id) { if (p.order.indexOf(id) === -1) p.order.push(id); });
    p.order = p.order.filter(function (id) { return DEFAULT_ORDER.indexOf(id) !== -1; });
    if (!p.hidden || typeof p.hidden !== 'object') p.hidden = {};
    
    if (typeof p.hideCompletedLevels !== 'boolean') p.hideCompletedLevels = false;
    prefs = p;
    return p;
  }
  function savePrefs() {
    try { localStorage.setItem(LS_PREFS, JSON.stringify(prefs)); } catch (e) {}
  }

   

  function emptyState(icon, text, ctaText, ctaAction) {
    return '<div class="widget-empty">' +
      '<div class="widget-empty-icon">' + icon + '</div>' +
      '<div class="widget-empty-text">' + esc(text) + '</div>' +
      (ctaText ? '<button class="widget-empty-cta" data-act="' + ctaAction + '">' + esc(ctaText) + '</button>' : '') +
      '</div>';
  }

  function head(icon, title, linkHref, linkText) {
    return '<div class="widget-head"><span class="widget-icon">' + icon + '</span>' +
      '<span>' + esc(title) + '</span>' +
      (linkHref ? '<a class="widget-link" href="' + linkHref + '">' + esc(linkText || tx('عرض', 'View')) + ' ›</a>' : '') +
      '</div>';
  }

   
  function animateBar(node, pct) {
    if (!node) return;
    node.style.width = pct + '%';
  }

   

  var WIDGETS = {

    welcome: {
      ar: 'ترحيب', en: 'Welcome',
      render: function () {
        var p = D.profile();
        var name = (p && p.name) ? p.name : '';
        var now = new Date();
        var greet = now.getHours() < 12 ? tx('صباح الخير', 'Good morning')
                  : now.getHours() < 18 ? tx('مساء الخير', 'Good afternoon')
                                        : tx('مساء الخير', 'Good evening');
        
        var greeting = name ? greet + tx('، ', ', ') + esc(name) : greet;
        var g = new Intl.DateTimeFormat(isAr() ? 'ar-SA' : 'en-GB',
          { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
        
        var h = '';
        try {
          h = new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-islamic' : 'en-u-ca-islamic',
            { day: 'numeric', month: 'long' }).format(now);
        } catch (e) {}
        return head('👋', tx('أهلاً', 'Welcome')) +
          '<div class="widget-body">' +
            '<div style="font-size:1.05rem;font-weight:800;color:var(--text-primary)">' + greeting + '</div>' +
            '<div class="widget-sub">' + esc(g) + (h ? ' · ' + esc(h) : '') + '</div>' +
            (name ? '' : '<button class="widget-empty-cta" data-act="go-settings" style="margin-top:.5rem;align-self:flex-start">' +
              esc(tx('عرّفنا باسمك', 'Tell us your name')) + '</button>') +
          '</div>';
      }
    },

    semester: {
      ar: 'تقدّم الفصل', en: 'Semester progress',
      render: function () {
        var p = D.semesterProgress();
        if (!p.exists) {
          return head('🎓', tx('فصلي', 'My semester'), 'hub/index.html') +
            emptyState('🎓', tx('لا يوجد فصل بعد', 'No semester yet'), tx('أنشئ فصلك', 'Create semester'), 'go-hub');
        }
        return head('🎓', tx('تقدّم الفصل', 'Semester progress'), 'hub/index.html') +
          '<div class="widget-body">' +
            '<div class="widget-metric">' + p.pct + '%</div>' +
            '<div class="widget-sub">' + esc(p.name || tx('فصلي', 'My semester')) + ' · ' +
              p.done + '/' + p.total + ' ' + esc(tx('مكتملة', 'done')) + '</div>' +
            '<div class="widget-bar"><div class="widget-bar-fill" data-bar="' + p.pct + '"></div></div>' +
          '</div>';
      }
    },

    gpa: {
      ar: 'المعدل', en: 'GPA',
      render: function () {
        var g = D.gpaSummary();
        if (!g.exists) {
          return head('📊', tx('المعدل', 'GPA'), 'hub/gpa.html') +
            emptyState('📊', tx('لم تُسجّل درجات بعد', 'No grades recorded yet'), tx('احسب معدلك', 'Calculate GPA'), 'go-gpa');
        }
        var pct = Math.max(0, Math.min(1, g.cgpa / 4));
        var r = 30, c = 2 * Math.PI * r;
        var off = c - pct * c;
        return head('📊', tx('المعدل التراكمي', 'Cumulative GPA'), 'hub/gpa.html') +
          '<div class="widget-body"><div class="widget-ring">' +
            '<svg viewBox="0 0 68 68" aria-hidden="true">' +
              '<circle class="widget-ring-bg" cx="34" cy="34" r="' + r + '"></circle>' +
              '<circle class="widget-ring-fill" cx="34" cy="34" r="' + r + '" ' +
                'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"></circle>' +
            '</svg>' +
            '<div><div class="widget-metric" style="font-size:1.5rem">' + g.cgpa.toFixed(2) + '</div>' +
            '<div class="widget-sub">' + esc(tx('من 4.00', 'of 4.00')) + ' · ' + g.credits + ' ' +
              esc(countWord(g.credits, ['ساعة', 'ساعتين', 'ساعات'], ['credit', 'credits'])) + '</div></div>' +
          '</div></div>';
      }
    },

    today: {
      ar: 'اليوم', en: 'Today',
      render: function () {
        var s = D.todaySchedule();
        var pl = D.plannerToday();
        var items = [];

        s.exams.forEach(function (e) {
          items.push({ t: e.start_time || '', n: (e.course_code || '') + ' · ' + tx('اختبار', 'Exam'), c: 'var(--st-danger)' });
        });
        s.lectures.forEach(function (l) {
          items.push({ t: l.start_time || '', n: (l.course_code || '') + (l.room ? ' · ' + l.room : ''), c: 'var(--st-accent)' });
        });
        s.blocks.forEach(function (b) {
          items.push({ t: b.start_time || '', n: (b.course_code || '') + ' · ' + tx('مذاكرة', 'Study'), c: 'var(--st-ok)' });
        });
        items.sort(function (a, b) { return String(a.t).localeCompare(String(b.t)); });

         
        var plLine = pl.exists && pl.todayTotal
          ? '<a class="widget-sub" href="hub/planner.html" style="margin-top:.45rem;display:block;text-decoration:none">📋 ' +
              esc(tx('خطتي', 'My plan')) + ' · ' + esc(tx('جلسات اليوم', 'today')) + ': ' + pl.todayDone + '/' + pl.todayTotal + '</a>'
          : '';

        if (!items.length && !(pl.exists && pl.todayTotal)) {
          return head('🗓️', tx('اليوم', 'Today'), 'hub/schedule.html') +
            emptyState('🗓️', tx('لا شيء مجدول اليوم', 'Nothing scheduled today'), tx('افتح الجدول', 'Open schedule'), 'go-schedule');
        }
        var list = items.slice(0, 4).map(function (i) {
          return '<a class="widget-item" href="hub/schedule.html">' +
            '<span class="widget-item-dot" style="background:' + i.c + '"></span>' +
            '<span class="widget-item-time">' + esc(i.t) + '</span>' +
            '<span class="widget-item-name">' + esc(i.n) + '</span></a>';
        }).join('');
        var more = items.length > 4
          ? '<div class="widget-sub" style="margin-top:.3rem">+' + (items.length - 4) + ' ' + esc(tx('أخرى', 'more')) + '</div>' : '';
        return head('🗓️', tx('اليوم', 'Today'), 'hub/schedule.html') +
          '<div class="widget-body"><div class="widget-list">' + list + '</div>' + more + plLine + '</div>';
      }
    },

    due: {
      ar: 'مستحقات', en: 'Due cards',
      render: function () {
        var p = D.semesterProgress();
        if (!p.exists) {
          return head('🃏', tx('المستحقّة', 'Due cards')) +
            emptyState('🃏', tx('أضف مواد فصلك لتتابع مستحقّاتك', 'Add semester courses to track due cards'),
                       tx('أنشئ فصلك', 'Create semester'), 'go-hub');
        }
        if (!p.due) {
          return head('🃏', tx('المستحقّة', 'Due cards')) +
            emptyState('✅', tx('لا بطاقات مستحقّة — أحسنت!', 'No cards due — nice work!'));
        }
        var withDue = p.courses.filter(function (c) { return c.due > 0; })
                               .sort(function (a, b) { return b.due - a.due; });
        var list = withDue.slice(0, 3).map(function (c) {
          var href = c.path ? c.path : 'hub/index.html';
          return '<a class="widget-item" href="' + esc(href) + '">' +
            '<span class="widget-item-name">' + esc(isAr() ? c.name_ar : c.name_en) + '</span>' +
            '<span style="color:#f43f5e;font-weight:800">' + c.due + '</span></a>';
        }).join('');
        return head('🃏', tx('بطاقات مستحقّة', 'Cards due')) +
          '<div class="widget-body">' +
            '<div class="widget-metric" style="color:#f43f5e">' + p.due + '</div>' +
            '<div class="widget-list" style="margin-top:.5rem">' + list + '</div>' +
          '</div>';
      }
    },

     
    tasks: {
      ar: 'المهام', en: 'Tasks',
      render: function () {
        var t = D.tasks();
        var open = (t || []).filter(function (x) { return x && !x.done; });
        if (!open.length) {
          return head('⏰', tx('القادم', 'Upcoming')) +
            emptyState('⏰', tx('لا مهام قادمة', 'No upcoming tasks'), tx('أضف مهمة', 'Add task'), 'new-task');
        }
        open.sort(function (a, b) { return String(a.due || '').localeCompare(String(b.due || '')); });
         
        var list = open.slice(0, 5).map(function (x) {
          var days = D.daysUntil(x.due);
          var u = urgency(days, false);
          var label = dueLabel(days);
          return '<div class="widget-item">' +
            '<button data-act="done-task" data-id="' + esc(x.id) + '" ' +
              'style="background:none;border:1px solid var(--border-color);border-radius:4px;width:15px;height:15px;cursor:pointer;flex-shrink:0" ' +
              'aria-label="' + esc(tx('إكمال', 'Complete')) + '"></button>' +
            '<span class="widget-item-name">' + esc(x.title || '') + '</span>' +
            '<span style="color:' + u.color + ';font-size:.66rem;font-weight:800">' + esc(label) + '</span></div>';
        }).join('');
        return head('⏰', tx('القادم', 'Upcoming')) +
          '<div class="widget-body"><div class="widget-list">' + list + '</div></div>';
      }
    },

    notes: {
      ar: 'ملاحظات سريعة', en: 'Quick notes',
      render: function () {
         
        var everything = (D.quickNotes() || []).filter(function (x) { return x; });
        var total = everything.length;                 
        var all = everything.filter(function (x) { return !x.archived; });
        all.sort(function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); });
        var recent = all.slice(0, 3);
        var list = recent.length ? recent.map(function (n) {
          var body = (n.body || '').trim() || tx('(فارغة)', '(empty)');
          var rem = n.remind_at ? '<span class="wn-rem">⏰ ' + esc(String(n.remind_at).slice(0, 10)) + '</span>' : '';
          return '<button class="wn-item" data-act="note-edit" data-id="' + esc(n.id) + '">' +
            '<span class="wn-body">' + esc(body.slice(0, 90)) + '</span>' + rem + '</button>';
        }).join('') : '<div class="widget-sub">' + esc(tx('لا ملاحظات بعد — أضِف واحدة', 'No notes yet — add one')) + '</div>';
        return head('📝', tx('ملاحظات سريعة', 'Quick notes')) +
          '<div class="widget-body">' +
            '<div class="wn-list">' + list + '</div>' +
            '<div class="wn-foot">' +
              '<button class="wn-add" data-act="note-add">＋ ' + esc(tx('ملاحظة', 'Note')) + '</button>' +
              (total > recent.length ? '<button class="wn-all" data-act="notes-all">' + esc(tx('الكل', 'All')) + ' (' + total + ')</button>' : '') +
            '</div>' +
          '</div>';
      }
    }
  };

   

  function renderWidgets() {
    var grid = el('widgets-grid');
    if (!grid) return;
    var html = '';
    prefs.order.forEach(function (id) {
      var w = WIDGETS[id];
      if (!w) return;
      var hidden = !!prefs.hidden[id];
      if (hidden && !document.body.classList.contains('dash-customizing')) return;
      var focusable = (id !== 'welcome');   
      html += '<article class="widget' + (hidden ? ' is-hidden-widget' : '') + '" data-widget="' + id + '" draggable="false"' +
        (focusable ? ' tabindex="0" role="link"' : '') + '>' +
        '<div class="widget-cust">' +
          '<button data-act="w-hide" data-id="' + id + '" title="' + esc(tx('إظهار/إخفاء', 'Show/hide')) + '">' + (hidden ? '👁' : '🚫') + '</button>' +
          '<button data-act="w-up" data-id="' + id + '" title="' + esc(tx('تقديم', 'Move up')) + '">↑</button>' +
          '<button data-act="w-down" data-id="' + id + '" title="' + esc(tx('تأخير', 'Move down')) + '">↓</button>' +
        '</div>' +
        (function () { try { return w.render(); } catch (e) {
          return head('⚠️', id) + '<div class="widget-body"><div class="widget-sub">' +
            esc(tx('تعذّر عرض هذه الودجة', 'This widget failed to render')) + '</div></div>';
        } })() +
        '</article>';
    });
    grid.innerHTML = html;

    
    grid.querySelectorAll('[data-bar]').forEach(function (b) {
      animateBar(b, parseInt(b.getAttribute('data-bar'), 10) || 0);
    });
    if (document.body.classList.contains('dash-customizing')) enableDrag();
  }

   
  var dragId = null;

  function enableDrag() {
    document.querySelectorAll('.widget[data-widget]').forEach(function (w) {
      w.setAttribute('draggable', 'true');
      w.ondragstart = function (e) {
        dragId = w.getAttribute('data-widget');
        w.classList.add('dragging');
        try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } catch (_) {}
      };
      w.ondragend = function () { w.classList.remove('dragging'); dragId = null; clearTargets(); };
      w.ondragover = function (e) { e.preventDefault(); w.classList.add('drop-target'); };
      w.ondragleave = function () { w.classList.remove('drop-target'); };
      w.ondrop = function (e) {
        e.preventDefault();
        var target = w.getAttribute('data-widget');
        if (!dragId || dragId === target) return;
        var o = prefs.order;
        o.splice(o.indexOf(target), 0, o.splice(o.indexOf(dragId), 1)[0]);
        savePrefs(); renderWidgets();
      };
    });
  }
  function clearTargets() {
    document.querySelectorAll('.drop-target').forEach(function (n) { n.classList.remove('drop-target'); });
  }
  function moveWidget(id, dir) {
    var o = prefs.order, i = o.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= o.length) return;
    var tmp = o[i]; o[i] = o[j]; o[j] = tmp;
    savePrefs(); renderWidgets();
  }

   

  function renderCourses() {
    var grids = [el('dash-courses'), el('dash-courses-full')].filter(Boolean);
    if (!grids.length) return;
    var p = D.semesterProgress();
    if (!p.exists) {
      var empty = '<div class="widget" style="grid-column:1/-1">' +
        emptyState('🎓', tx('لا مواد في فصلك بعد', 'No courses in your semester yet'),
                   tx('أنشئ فصلك', 'Create semester'), 'go-hub') + '</div>';
      grids.forEach(function (g) { g.innerHTML = empty; });
      return;
    }
     
    var html = p.courses.map(function (c) {
      var info = D.courseInfo(c.code);
      var color = (info && info.brand_color) || '#a78bfa';
      var href = c.path || 'hub/index.html';
      var isReal = D.isRealCourse(c.code);
       
      var codeCell = c.custom
        ? '<span class="dash-course-code dash-course-custom" data-ar="مخصّصة" data-en="Custom">' + esc(tx('مخصّصة', 'Custom')) + '</span>'
        : '<a class="dash-course-code" href="' + esc(href) + '">' + esc(c.code) + '</a>';
      return '<div class="dash-course-card" style="--course-color:' + esc(color) + '" data-course="' + esc(c.code) + '" ' +
        'tabindex="0" role="link" aria-label="' + esc(isAr() ? c.name_ar : c.name_en) + '">' +
        '<div class="dash-course-top">' +
          codeCell +
          (isReal ? '<a class="dash-course-info" href="hub/course.html?code=' + encodeURIComponent(c.code) + '" ' +
            'title="' + esc(tx('بطاقة المادة', 'Course card')) + '" aria-label="' + esc(tx('بطاقة المادة', 'Course card')) + '" ' +
            'data-ar="ℹ️ بطاقة المادة" data-en="ℹ️ Course card">' + esc(tx('ℹ️ بطاقة المادة', 'ℹ️ Course card')) + '</a>' : '') +
        '</div>' +
        '<a class="dash-course-name" href="' + esc(href) + '">' + esc(isAr() ? c.name_ar : c.name_en) + '</a>' +
        '<div class="dash-course-foot">' +
          '<span>' + c.pct + '%</span>' +
          '<span class="dash-course-bar"><span class="dash-course-fill" style="width:' + c.pct + '%"></span></span>' +
          (c.due ? '<span class="dash-course-due">🃏 ' + c.due + '</span>' : '') +
        '</div></div>';
    }).join('');
    grids.forEach(function (g) { g.innerHTML = html; });
  }

   
  function applyLevelsSectionVis() {
    var s = el('dash-levels-section');
    if (s) s.style.display = (prefs && prefs.hideLevelsSection) ? 'none' : '';
  }

  var _cfg = null;
  function renderLevels() {
    var grids = [el('dash-levels'), el('dash-levels-full')].filter(Boolean);
    if (!grids.length || !_cfg) return;
    var colors = ['#3b82f6', '#10b981', '#a78bfa', '#f59e0b', '#f43f5e', '#06b6d4'];
     
    var done = (prefs && prefs.hideCompletedLevels) ? D.completedCourses() : null;
    function levelDone(lv) {
      var subs = (lv.subjects || []).concat(lv.electives || []);
      if (!subs.length) return false;
      return subs.every(function (code) { return done[code]; });
    }
    var html = '';
    ['level3', 'level4', 'level5', 'level6', 'level7', 'level8'].forEach(function (lid, i) {
      var lv = _cfg.levels && _cfg.levels[lid];
      if (!lv) return;
      if (done && levelDone(lv)) return;   
      var n = lid.replace('level', '');
      var count = (lv.subjects || []).length + (lv.electives || []).length;
      html += '<a class="dash-level-card" href="L' + n + '/index.html" style="--level-color:' + colors[i % 6] + '" data-level="' + n + '">' +
        '<span class="dash-level-num">' + n + '</span>' +
        '<span class="dash-level-info">' +
          '<span class="dash-level-title">' + esc(tx('المستوى ' + n, 'Level ' + n)) + '</span>' +
          '<span class="dash-level-meta">' + esc(smartCount(count, ['مادة', 'مادتين', 'مواد'], ['course', 'courses'])) + '</span>' +
        '</span></a>';
    });
    if (_cfg.collections && _cfg.collections.others) {
      var o = _cfg.collections.others;
      html += '<a class="dash-level-card is-collection" href="others/index.html" style="--level-color:#8b5cf6" data-level="others">' +
        '<span class="dash-level-num">📚</span>' +
        '<span class="dash-level-info">' +
          '<span class="dash-level-title">' + esc(tx('مقررات أخرى', 'Other courses')) + '</span>' +
          '<span class="dash-level-meta">' +
            esc(smartCount((o.subjects || []).length, ['مادة', 'مادتين', 'مواد'], ['course', 'courses'])) + '</span>' +
        '</span></a>';
    }
    grids.forEach(function (g) { g.innerHTML = html; });
  }

   

  var tkFilter = 'all';
  var tkGroup = false;

  var TYPE_LABEL = {
    hw:         ['واجب', 'Homework'],
    project:    ['مشروع', 'Project'],
    quiz:       ['كويز', 'Quiz'],
    exam:       ['اختبار', 'Exam'],
    midterm:    ['نصفي', 'Midterm'],
    final:      ['نهائي', 'Final'],
    assignment: ['تسليم', 'Assignment'],
    note:       ['تذكير', 'Reminder'],
    other:      ['أخرى', 'Other']
  };
  function typeLabel(t) {
    var p = TYPE_LABEL[t] || TYPE_LABEL.other;
    return tx(p[0], p[1]);
  }
  var SRC_LABEL = {
    task:   ['مهامي', 'My tasks'],
    course: ['بطاقة المادة', 'Course card'],
    exam:   ['الجدول', 'Schedule']
  };

   
  function urgency(days, done) {
    if (done) return { cls: 'is-done', color: 'var(--st-ok)' };
    if (days === null) return { cls: '', color: 'var(--text-muted)' };
    if (days < 0) return { cls: 'is-late', color: 'var(--st-danger)' };
    if (days <= 3) return { cls: 'is-soon', color: 'var(--st-warn)' };
    return { cls: '', color: 'var(--text-muted)' };
  }

  var DAY_FORMS_AR = ['يوم', 'يومين', 'أيام'];
  var DAY_FORMS_EN = ['day', 'days'];

  function dueLabel(days) {
    if (days === null) return tx('بلا تاريخ', 'No date');
    if (days === 0) return tx('اليوم', 'Today');
    if (days === 1) return tx('غداً', 'Tomorrow');
    if (days === -1) return tx('متأخرة يوماً', '1 day late');
    if (days < -1) {
      var n = Math.abs(days);
      return tx('متأخرة ' + smartCount(n, DAY_FORMS_AR, DAY_FORMS_EN),
                n + ' days late');
    }
    return tx('بعد ' + smartCount(days, DAY_FORMS_AR, DAY_FORMS_EN),
              'in ' + days + ' ' + countWord(days, DAY_FORMS_AR, DAY_FORMS_EN));
  }

  function taskRow(t) {
    var days = D.daysUntil(t.due);
    var u = urgency(days, t.done);
    var title = t.title || (t.course ? t.course + ' · ' + typeLabel(t.type) : typeLabel(t.type));
    var src = SRC_LABEL[t.source] || SRC_LABEL.task;

    var check = t.editable
      ? '<button class="tk-check" data-act="tk-toggle" data-id="' + esc(t.id) + '" ' +
        'aria-label="' + esc(tx('إكمال', 'Complete')) + '"' + (t.done ? ' aria-pressed="true"' : '') + '>' +
        (t.done ? '✓' : '') + '</button>'
      : '<span class="tk-check tk-check-locked" aria-hidden="true">' + (t.source === 'exam' ? '📝' : '📅') + '</span>';

    var actions = t.editable
      ? '<button class="tk-act" data-act="tk-edit" data-id="' + esc(t.id) + '" aria-label="' + esc(tx('تعديل', 'Edit')) + '">✏️</button>' +
        '<button class="tk-act" data-act="tk-del" data-id="' + esc(t.id) + '" aria-label="' + esc(tx('حذف', 'Delete')) + '">🗑</button>'
      : '<a class="tk-act" href="' + (t.source === 'exam' ? 'hub/schedule.html' : 'hub/course.html?code=' + encodeURIComponent(t.course || '')) + '" ' +
        'aria-label="' + esc(tx('فتح المصدر', 'Open source')) + '">↗</a>';

    return '<div class="tk-item ' + u.cls + '">' +
      check +
      '<div class="tk-main">' +
        '<div class="tk-title">' + esc(title) + '</div>' +
        '<div class="tk-meta">' +
          (t.course ? '<span class="tk-chip">' + esc(t.course) + '</span>' : '') +
          '<span class="tk-chip">' + esc(typeLabel(t.type)) + '</span>' +
          '<span class="tk-chip tk-chip-src">' + esc(tx(src[0], src[1])) + '</span>' +
          (t.note ? '<span class="tk-note">' + esc(t.note) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="tk-due" style="color:' + u.color + '">' + esc(dueLabel(days)) + '</div>' +
      '<div class="tk-actions">' + actions + '</div>' +
    '</div>';
  }

  function filterTasks(list) {
    if (tkFilter === 'done') return list.filter(function (t) { return t.done; });
    var open = list.filter(function (t) { return !t.done; });
    if (tkFilter === 'late') {
      return open.filter(function (t) { var d = D.daysUntil(t.due); return d !== null && d < 0; });
    }
    if (tkFilter === 'week') {
      return open.filter(function (t) { var d = D.daysUntil(t.due); return d !== null && d >= 0 && d <= 7; });
    }
    return open;
  }

  function renderTasks() {
    var box = el('dash-tasks-list');
    if (!box) return;
    var list = filterTasks(D.allDeadlines());

    if (!list.length) {
      var msg = tkFilter === 'done' ? tx('لا مهام مكتملة بعد', 'No completed tasks yet')
              : tkFilter === 'late' ? tx('لا مهام متأخرة — ممتاز!', 'Nothing late — excellent!')
              : tkFilter === 'week' ? tx('لا شيء مستحقّ هذا الأسبوع', 'Nothing due this week')
              : tx('لا مهام بعد — أضف أول مهمة', 'No tasks yet — add your first');
      box.innerHTML = '<div class="widget" style="max-width:560px">' +
        emptyState('⏰', msg, tkFilter === 'all' ? tx('مهمة جديدة', 'New task') : '', 'add-task') + '</div>';
      return;
    }

    if (!tkGroup) {
      box.innerHTML = '<div class="tk-list">' + list.map(taskRow).join('') + '</div>';
      return;
    }

    var groups = {};
    var order = [];
    list.forEach(function (t) {
      var k = t.course || '__none';
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(t);
    });
    box.innerHTML = order.map(function (k) {
      var info = k === '__none' ? null : D.courseInfo(k);
      var name = k === '__none' ? tx('بلا مادة', 'No course')
               : (info ? (isAr() ? info.name_ar : info.name_en) : k);
      var color = (info && info.brand_color) || '#a78bfa';
      return '<div class="tk-group">' +
        '<div class="tk-group-head" style="--g-color:' + esc(color) + '">' +
          '<span class="tk-group-name">' + esc(name) + '</span>' +
          '<span class="tk-group-count">' + groups[k].length + '</span>' +
        '</div>' +
        '<div class="tk-list">' + groups[k].map(taskRow).join('') + '</div>' +
      '</div>';
    }).join('');
  }

   

  function fillCourseSelect() {
    var sel = el('tk-f-course');
    if (!sel) return;
    var p = D.semesterProgress();
    var opts = '<option value="">' + esc(tx('بلا مادة', 'No course')) + '</option>';
    p.courses.forEach(function (c) {
      opts += '<option value="' + esc(c.code) + '">' + esc(c.code + ' · ' + (isAr() ? c.name_ar : c.name_en)) + '</option>';
    });
    sel.innerHTML = opts;
  }

  function openTaskModal(id) {
    var m = el('tk-modal');
    if (!m) return;
    fillCourseSelect();
    var t = id ? D.tasks().find(function (x) { return x.id === id; }) : null;
    el('tk-f-id').value = t ? t.id : '';
    el('tk-f-title').value = t ? (t.title || '') : '';
    el('tk-f-course').value = t ? (t.course || '') : '';
    el('tk-f-type').value = t ? (t.type || 'hw') : 'hw';
     
    var due = t ? String(t.due || '') : '';
    el('tk-f-date').value = due ? due.split('T')[0] : '';
    el('tk-f-time').value = due.indexOf('T') > -1 ? due.split('T')[1].slice(0, 5) : '';
    el('tk-f-note').value = t ? (t.note || '') : '';
    el('tk-modal-title').textContent = t ? tx('تعديل المهمة', 'Edit task') : tx('مهمة جديدة', 'New task');
    m.hidden = false;
    setTimeout(function () { el('tk-f-title').focus(); }, 50);
  }

  function closeTaskModal() { var m = el('tk-modal'); if (m) m.hidden = true; }

   
  function loadNotesArr() { return D.quickNotes() || []; }
   
  function saveNotesArr(arr) {
    try { localStorage.setItem('quick_notes', JSON.stringify(arr)); } catch (_) {}
  }
   
  var _noteCtx = null;
  function openNoteModal(id, ctx) {
    _noteCtx = (!id && ctx) ? ctx : null;
    var m = el('note-modal'); if (!m) return;
    var n = id ? loadNotesArr().find(function (x) { return String(x.id) === String(id); }) : null;
    el('note-f-id').value = n ? n.id : '';
    el('note-f-body').value = n ? (n.body || '') : '';
    el('note-f-remind').value = n && n.remind_at ? String(n.remind_at).slice(0, 10) : '';
    el('note-modal-title').textContent = n ? tx('تعديل الملاحظة', 'Edit note') : tx('ملاحظة جديدة', 'New note');
    var arch = m.querySelector('[data-act="note-archive"]');
    if (arch) arch.style.display = n ? '' : 'none';
    var del = m.querySelector('[data-act="note-del"]');
    if (del) del.style.display = n ? '' : 'none';
    m.hidden = false;
    setTimeout(function () { el('note-f-body').focus(); }, 50);
  }
  function closeNoteModal() { var m = el('note-modal'); if (m) m.hidden = true; }
  function saveNote() {
    var id = el('note-f-id').value;
    var body = el('note-f-body').value.trim();
    var remind = el('note-f-remind').value;
    if (!body && !remind) { closeNoteModal(); return; }
    var arr = loadNotesArr();
    var n = id ? arr.find(function (x) { return String(x.id) === String(id); }) : null;
    if (n) { n.body = body; n.remind_at = remind || null; n.updated_at = Date.now(); }
    else {
       
      var now = Date.now();
      var rec = { id: 'n' + now, body: body, remind_at: remind || null, archived: false,
                  created_at: now, updated_at: now, tags: [], pinned: false };
      if (_noteCtx) {
        if (_noteCtx.course) rec.course = _noteCtx.course;
        if (_noteCtx.module) rec.module = _noteCtx.module;
        if (_noteCtx.tags && _noteCtx.tags.length) rec.tags = _noteCtx.tags.slice();
      }
      arr.unshift(rec);
    }
    _noteCtx = null;
    saveNotesArr(arr);
    closeNoteModal(); renderWidgets(); refreshNotesListModal();
  }
  function setNoteArchived(id, val) {
    var arr = loadNotesArr();
    var n = arr.find(function (x) { return String(x.id) === String(id); });
    if (n) { n.archived = val; n.archived_at = val ? Date.now() : null; n.updated_at = Date.now(); saveNotesArr(arr); }
    renderWidgets(); refreshNotesListModal();
  }
  function deleteNote(id) {
    var arr = loadNotesArr().filter(function (x) { return String(x.id) !== String(id); });
    saveNotesArr(arr);
    renderWidgets(); refreshNotesListModal();
  }
  function noteRowHtml(n) {
    var body = (n.body || '').trim() || tx('(فارغة)', '(empty)');
    var rem = n.remind_at ? '<span class="wn-rem">⏰ ' + esc(String(n.remind_at).slice(0, 10)) + '</span>' : '';
    return '<div class="nl-row' + (n.archived ? ' is-arch' : '') + '">' +
      '<button class="nl-text" data-act="note-edit" data-id="' + esc(n.id) + '">' + esc(body.slice(0, 140)) + rem + '</button>' +
      '<span class="nl-acts">' +
        '<button data-act="note-toggle-arch" data-id="' + esc(n.id) + '" title="' + esc(n.archived ? tx('استرجاع', 'Restore') : tx('أرشفة', 'Archive')) + '">' + (n.archived ? '↩' : '🗄') + '</button>' +
        '<button data-act="note-del" data-id="' + esc(n.id) + '" title="' + esc(tx('حذف', 'Delete')) + '">🗑</button>' +
      '</span></div>';
  }
  function refreshNotesListModal() {
    var box = el('notes-list-body'); if (!box || el('notes-list-modal').hidden) return;
    var arr = loadNotesArr();
    var active = arr.filter(function (n) { return !n.archived; }).sort(function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); });
    var arch = arr.filter(function (n) { return n.archived; }).sort(function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); });
    var html = active.length ? active.map(noteRowHtml).join('') : '<div class="widget-sub">' + esc(tx('لا ملاحظات نشطة', 'No active notes')) + '</div>';
    if (arch.length) {
      html += '<div class="nl-sep" data-ar="المؤرشفة" data-en="Archived">' + esc(tx('المؤرشفة', 'Archived')) + '</div>' + arch.map(noteRowHtml).join('');
    }
    box.innerHTML = html;
  }
  function openNotesList() {
    var m = el('notes-list-modal'); if (!m) return;
    m.hidden = false; refreshNotesListModal();
  }
  function closeNotesList() { var m = el('notes-list-modal'); if (m) m.hidden = true; }

  function saveTask() {
    var title = el('tk-f-title').value.trim();
    if (!title) { toast(tx('اكتب عنوان المهمة', 'Enter a task title')); el('tk-f-title').focus(); return; }
    var date = el('tk-f-date').value;
    var time = el('tk-f-time').value;
    D.upsertTask({
      id: el('tk-f-id').value || null,
      title: title,
      course: el('tk-f-course').value || null,
      type: el('tk-f-type').value,
      due: date ? (time ? date + 'T' + time : date) : '',
      note: el('tk-f-note').value.trim()
    });
    closeTaskModal();
    afterTaskChange();
    toast(tx('حُفظت المهمة ✓', 'Task saved ✓'));
  }

   
  function afterTaskChange() {
    renderTasks();
    renderWidgets();
    if (window.GardenNav && window.GardenNav.updateDueBadge) window.GardenNav.updateDueBadge();
  }

   

   
  var MOBILE_TAB_VIEWS = ['overview', 'courses', 'levels', 'tasks', 'settings'];

  function buildMobileTabs() {
    var main = document.querySelector('.dash-main');
    if (!main || document.querySelector('.dash-mobile-tabs')) return;

    var bar = document.createElement('nav');
    bar.className = 'dash-mobile-tabs';
    bar.setAttribute('aria-label', tx('عروض اللوحة', 'Dashboard views'));

    MOBILE_TAB_VIEWS.forEach(function (view) {
      var src = document.querySelector('.dash-side-item[data-view="' + view + '"]');
      if (!src) return;
      var b = document.createElement('button');
      b.className = 'dash-mtab';
      b.setAttribute('data-view', view);
      var icon = src.querySelector('i');
      var label = src.querySelector('span[data-ar]');
      b.innerHTML = (icon ? '<i class="' + icon.className + '"></i>' : '') +
        (label ? '<span data-ar="' + esc(label.getAttribute('data-ar')) + '" data-en="' +
                 esc(label.getAttribute('data-en')) + '">' + esc(label.textContent) + '</span>' : '');
      b.addEventListener('click', function () { showView(view); });
      bar.appendChild(b);
    });

    main.insertBefore(bar, main.firstChild);
  }

   
  function hasVisibleSwitcher(name) {
    var btns = document.querySelectorAll('[data-view="' + name + '"]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.tagName !== 'BUTTON') continue;
      if (b.offsetParent !== null) return true;
    }
    return false;
  }

  function showView(name) {
     
    if (name !== 'overview' && document.body.classList.contains('dash-customizing')) {
      document.body.classList.remove('dash-customizing');
      var cbar = el('dash-cust-bar'); if (cbar) cbar.hidden = true;
      var ctog = document.querySelector('[data-act="toggle-cust"]'); if (ctog) ctog.classList.remove('active');
      renderWidgets();
    }
    document.querySelectorAll('.dash-view').forEach(function (v) {
      v.classList.toggle('active', v.getAttribute('data-view') === name);
    });
    document.querySelectorAll('.dash-side-item[data-view], .dash-mtab[data-view]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === name);
    });
    try { localStorage.setItem('dash_view', name); } catch (e) {}
    if (name === 'courses') renderCourses();
    if (name === 'tasks') renderTasks();
    if (name === 'settings') fillSettings();
    window.scrollTo(0, 0);
  }

   

  function fillSettings() {
    var p = D.profile();
    if (el('set-name')) el('set-name').value = (p && p.name) || '';
    if (el('set-level')) el('set-level').value = (p && p.level) || '';
    if (el('set-theme')) el('set-theme').value = localStorage.getItem('garden_theme') || 'dark';
    if (el('set-font')) el('set-font').value = localStorage.getItem('garden_font_size') || 'md';
    fillSyncSection();
  }

   
  function fillSyncSection() {
    var box = el('dash-sync');
    if (!box) return;
    var S = window.GardenSync;
    var key = (S && S.getKey && S.getKey()) || null;
    var dot = el('sync-state-dot'), txt = el('sync-state-text'), last = el('sync-last-text');
    var keyRow = el('sync-key-row'), keyVal = el('sync-key-val');

    if (!S) {
      if (txt) txt.textContent = tx('غير متاحة على هذه الصفحة', 'Unavailable here');
      return;
    }
    if (key) {
      if (dot) dot.className = 'dash-sync-dot is-on';
      if (txt) txt.textContent = tx('مفعّلة', 'Enabled');
      if (keyRow) keyRow.hidden = false;
      if (keyVal) keyVal.textContent = String(key).slice(0, 4) + '····' + String(key).slice(-4);
      var lastTs = localStorage.getItem('garden_sync_last');
      if (last && lastTs) {
        var d = D.daysUntil(new Date(parseInt(lastTs, 10)).toISOString().slice(0, 10));
        last.textContent = tx('آخر مزامنة: ', 'Last sync: ') +
          (d === 0 ? tx('اليوم', 'today') : dueLabel(d));
      } else if (last) last.textContent = '';
    } else {
      if (dot) dot.className = 'dash-sync-dot';
      if (txt) txt.textContent = tx('غير مفعّلة — بياناتك على هذا الجهاز فقط',
                                    'Off — your data lives on this device only');
      if (keyRow) keyRow.hidden = true;
      if (last) last.textContent = '';
    }
  }

  function saveSettings() {
    var p = D.profile() || {};
    p.name = el('set-name') ? el('set-name').value.trim() : '';
    p.level = el('set-level') ? el('set-level').value : '';
    try { localStorage.setItem('student_profile', JSON.stringify(p)); } catch (e) {}
    var th = el('set-theme') ? el('set-theme').value : null;
    if (th) { localStorage.setItem('garden_theme', th); document.documentElement.setAttribute('data-theme', th); }
    var fs = el('set-font') ? el('set-font').value : null;
    if (fs) {
      if (fs === 'md') { localStorage.removeItem('garden_font_size'); document.documentElement.removeAttribute('data-font-size'); }
      else { localStorage.setItem('garden_font_size', fs); document.documentElement.setAttribute('data-font-size', fs); }
    }
    renderWidgets();
    toast(tx('حُفظ', 'Saved'));
  }

   
  function exportData() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      out[k] = localStorage.getItem(k);
    }
    var blob = new Blob([JSON.stringify({ _byte_backup: 1, at: new Date().toISOString(), data: out }, null, 2)],
                        { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'digital-garden-backup-' + D.todayStr() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function importData(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var j = JSON.parse(r.result);
        if (!j || !j._byte_backup || !j.data) throw new Error('bad');
        var n = 0;
        Object.keys(j.data).forEach(function (k) { localStorage.setItem(k, j.data[k]); n++; });
        toast(tx('استُورد ' + n + ' مفتاحاً — يُعاد التحميل…', 'Imported ' + n + ' keys — reloading…'));
        setTimeout(function () { location.reload(); }, 900);
      } catch (e) {
        toast(tx('ملف غير صالح', 'Invalid file'));
      }
    };
    r.readAsText(file);
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:3000;' +
      'background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:9999px;' +
      'padding:.5rem 1.1rem;font-size:.82rem;font-weight:700;color:var(--text-primary);' +
      'box-shadow:0 8px 24px var(--shadow-base)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

   

   

   

   
  function cardMainLink(card) { return card && card.querySelector('a[href]'); }
   
  function widgetMainHref(id) {
    return ({ semester: 'hub/index.html', gpa: 'hub/gpa.html', today: 'hub/schedule.html', due: 'hub/index.html', upcoming: 'hub/schedule.html' })[id] || null;
  }
   
  function widgetActivate(w) {
    var id = w.getAttribute('data-widget');
    if (id === 'notes') { openNotesList(); return; }        
    if (id === 'tasks') { showView('tasks'); return; }
    var wl = w.querySelector('.widget-link');
    if (wl) { location.href = wl.getAttribute('href'); return; }
    var href = widgetMainHref(id);
    if (href) location.href = href;
  }
  function onCardNav(e) {
    if (e.target.closest('a, button, input, select, textarea, label')) return;
    var card = e.target.closest('.dash-course-card');
    if (card) { var link = cardMainLink(card); if (link) location.href = link.getAttribute('href'); return; }
    
    if (document.body.classList.contains('dash-customizing')) return;
    var w = e.target.closest('.widget[data-widget]');
    if (w) widgetActivate(w);
  }
  function onCardKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('a, button, input, select, textarea')) return;
    var card = e.target.closest && e.target.closest('.dash-course-card');
    if (card && card === document.activeElement) { var link = cardMainLink(card); if (link) { e.preventDefault(); location.href = link.getAttribute('href'); } return; }
    var w = e.target.closest && e.target.closest('.widget[data-widget]');
    if (w && w === document.activeElement && !document.body.classList.contains('dash-customizing')) { e.preventDefault(); widgetActivate(w); }
  }

  function onAction(e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    var id = t.getAttribute('data-id');

    if (act === 'sync-open') { if (window.GardenSync) window.GardenSync.showModal(); return; }
    if (act === 'sync-now') {
      if (window.GardenSync && window.GardenSync.syncNow) {
        window.GardenSync.syncNow();
        toast(tx('جارٍ المزامنة…', 'Syncing…'));
        setTimeout(fillSyncSection, 1500);
      }
      return;
    }
    if (act === 'sync-copy') {
      var k = window.GardenSync && window.GardenSync.getKey && window.GardenSync.getKey();
      if (k && navigator.clipboard) {
        navigator.clipboard.writeText(k).then(function () { toast(tx('نُسخ المفتاح', 'Key copied')); });
      }
      return;
    }
    if (act === 'go-hub') location.href = 'hub/index.html';
    else if (act === 'go-gpa') location.href = 'hub/gpa.html';
    else if (act === 'go-schedule') location.href = 'hub/schedule.html';
    else if (act === 'go-settings') showView('settings');
    else if (act === 'w-hide') { prefs.hidden[id] = !prefs.hidden[id]; savePrefs(); renderWidgets(); }
    else if (act === 'w-up') moveWidget(id, -1);
    else if (act === 'w-down') moveWidget(id, 1);
    else if (act === 'toggle-cust') {
      var on = document.body.classList.toggle('dash-customizing');
      t.classList.toggle('active', on);
      var bar = el('dash-cust-bar'); if (bar) bar.hidden = !on;
      renderWidgets();
    }
    else if (act === 'toggle-hide-levels') {
       
      var hl = document.getElementById('hide-done-levels');
      prefs.hideCompletedLevels = hl ? hl.checked : !prefs.hideCompletedLevels;
      savePrefs();
      renderLevels();
    }
    else if (act === 'toggle-hide-levels-section') {
       
      var hls = document.getElementById('hide-levels-section');
      prefs.hideLevelsSection = hls ? hls.checked : !prefs.hideLevelsSection;
      savePrefs();
      applyLevelsSectionVis();
    }
     
    else if (act === 'note-add') { openNoteModal(null); }
    else if (act === 'note-edit') { openNoteModal(id); }
    else if (act === 'note-save') { saveNote(); }
    else if (act === 'note-cancel') { closeNoteModal(); }
    else if (act === 'note-archive') { if (id || el('note-f-id').value) { setNoteArchived(id || el('note-f-id').value, true); closeNoteModal(); } }
    else if (act === 'note-toggle-arch') {
      var nn = loadNotesArr().find(function (x) { return String(x.id) === String(id); });
      setNoteArchived(id, !(nn && nn.archived));
    }
    else if (act === 'note-del') {
      var nid = id || el('note-f-id').value;
      if (nid && confirm(tx('حذف هذه الملاحظة؟', 'Delete this note?'))) { deleteNote(nid); closeNoteModal(); }
    }
    else if (act === 'notes-all') { openNotesList(); }
    else if (act === 'notes-list-close') { closeNotesList(); }
    else if (act === 'open-onboarding') { if (window.Onboarding) window.Onboarding.open(); }
    else if (act === 'fab') { el('fab-menu').classList.toggle('open'); }
    else if (act === 'new-task') { el('fab-menu').classList.remove('open'); showView('tasks'); openTaskModal(null); }
    else if (act === 'new-note') { el('fab-menu').classList.remove('open'); openNoteModal(null); }
    else if (act === 'new-course') location.href = 'hub/index.html';
    else if (act === 'new-event') location.href = 'hub/schedule.html';
    else if (act === 'new-semester') location.href = 'hub/index.html';
    else if (act === 'export') exportData();
    else if (act === 'import') el('import-file').click();
    else if (act === 'save-settings') saveSettings();
     
    else if (act === 'done-task') { D.toggleTask(id); afterTaskChange(); }
    else if (act === 'add-task') openTaskModal(null);
    else if (act === 'tk-edit') openTaskModal(id);
    else if (act === 'tk-toggle') { D.toggleTask(id); afterTaskChange(); }
    else if (act === 'tk-del') {
      if (confirm(tx('حذف هذه المهمة؟', 'Delete this task?'))) { D.deleteTask(id); afterTaskChange(); }
    }
    else if (act === 'tk-save') saveTask();
    else if (act === 'tk-cancel') closeTaskModal();
  }

   
  function onTaskFilter(e) {
    var b = e.target.closest('.tk-filter');
    if (!b) return;
    tkFilter = b.getAttribute('data-filter');
    document.querySelectorAll('.tk-filter').forEach(function (x) {
      x.classList.toggle('active', x === b);
    });
    renderTasks();
  }

   

   

  function init() {
    loadPrefs();

    D.ready().then(function () {
      return fetch('config/project.json').then(function (r) { return r.json(); }).catch(function () { return null; });
    }).then(function (cfg) {
      _cfg = cfg;
      var hl = el('hide-done-levels'); if (hl) hl.checked = !!prefs.hideCompletedLevels;  
      var hls = el('hide-levels-section'); if (hls) hls.checked = !!prefs.hideLevelsSection;  
      applyLevelsSectionVis();
      renderWidgets();
      renderCourses();
      renderLevels();
      updateSidebarBadges();
      buildMobileTabs();
       
      var hashView = (location.hash || '').replace('#', '');
      var v = hashView || localStorage.getItem('dash_view') || 'overview';
      if (!document.querySelector('.dash-view[data-view="' + v + '"]')) v = 'overview';
       
      if (!hasVisibleSwitcher(v)) v = 'overview';
      showView(v);
    });

    document.addEventListener('click', onAction);
    document.addEventListener('click', onCardNav);
    document.addEventListener('keydown', onCardKey);

    document.querySelectorAll('.dash-side-item[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
    });

    var tf = el('tk-filters');
    if (tf) tf.addEventListener('click', onTaskFilter);
    var tg = el('tk-group');
    if (tg) tg.addEventListener('change', function () { tkGroup = tg.checked; renderTasks(); });

     
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var m = el('tk-modal'); if (m && !m.hidden) { e.preventDefault(); closeTaskModal(); return; }
      var nm = el('note-modal'); if (nm && !nm.hidden) { e.preventDefault(); closeNoteModal(); return; }
      var nl = el('notes-list-modal'); if (nl && !nl.hidden) { e.preventDefault(); closeNotesList(); return; }
    });
     
    var tm = el('tk-modal');
    if (tm) tm.addEventListener('click', function (e) { if (e.target === tm) closeTaskModal(); });
    var nmod = el('note-modal');
    if (nmod) nmod.addEventListener('click', function (e) { if (e.target === nmod) closeNoteModal(); });
    var nlmod = el('notes-list-modal');
    if (nlmod) nlmod.addEventListener('click', function (e) { if (e.target === nlmod) closeNotesList(); });

     

    var imp = el('import-file');
    if (imp) imp.addEventListener('change', function () { if (imp.files[0]) importData(imp.files[0]); });

    document.addEventListener('garden:languageChanged', function () {
      renderWidgets(); renderCourses(); renderLevels(); renderTasks();
    });
  }

  function updateSidebarBadges() {
    var p = D.semesterProgress();
    var b = el('side-due-badge');
    if (b) { b.textContent = p.due > 99 ? '99+' : p.due; b.hidden = !p.due; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
