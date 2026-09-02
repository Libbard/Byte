/*@3.DASJ.1*/

;(function () {
  'use strict';

  var D = window.GardenData;
  var LS_PREFS = 'dashboard_prefs';
  var LS_TOUR_SEEN = 'garden_tour_seen';

  /*@3.DASJ.2*/
  var COMMUNITY_CHAT_URL = 'https://t.me/Computing_and_Informatics';
  var COMMUNITY_ARCHIVE_URL = 'https://t.me/computingg';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  function syncTourPromo() {
    var seen = false;
    try { seen = localStorage.getItem(LS_TOUR_SEEN) === '1'; } catch (e) {}
    var promo = el('dash-tour-promo');
    if (promo) promo.hidden = seen;
    if (seen) document.documentElement.setAttribute('data-tour-seen', '1');
    else document.documentElement.removeAttribute('data-tour-seen');
  }

  /*@3.DASJ.3*/
  function countWord(n, arForms, enForms) {
    if (window.Garden && window.Garden.countWord) return window.Garden.countWord(n, arForms, enForms);
    return isAr() ? arForms[2] : enForms[1];
  }
  /*@3.DASJ.4*/
  function smartCount(n, arForms, enForms, isAdj) {
    if (window.Garden && window.Garden.smartCount) return window.Garden.smartCount(n, arForms, enForms, isAdj);
    return n + ' ' + countWord(n, arForms, enForms);
  }

  /*@3.DASJ.5*/
  var DEFAULT_ORDER = ['welcome', 'semester', 'gpa', 'today', 'due', 'tasks', 'notes', 'community'];
  var prefs = null;

  function loadPrefs() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(LS_PREFS) || 'null'); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!Array.isArray(p.order)) p.order = DEFAULT_ORDER.slice();
    /*@3.DASJ.6*/
    DEFAULT_ORDER.forEach(function (id) { if (p.order.indexOf(id) === -1) p.order.push(id); });
    p.order = p.order.filter(function (id) { return DEFAULT_ORDER.indexOf(id) !== -1; });
    if (!p.hidden || typeof p.hidden !== 'object') p.hidden = {};
    /*@3.DASJ.7*/
    if (typeof p.hideCompletedLevels !== 'boolean') p.hideCompletedLevels = false;
    /*@3.DASJ.8*/
    if (!p.courseStyle || typeof p.courseStyle !== 'object') p.courseStyle = {};
    prefs = p;
    return p;
  }
  var OWN_PREFS = ['order', 'hidden', 'hideCompletedLevels', 'hideLevelsSection', 'courseStyle'];
  function savePrefs() {
    try {
      var fresh = null;
      try { fresh = JSON.parse(localStorage.getItem(LS_PREFS) || 'null'); } catch (e2) {}
      if (!fresh || typeof fresh !== 'object') fresh = {};
      for (var i = 0; i < OWN_PREFS.length; i++) {
        var k = OWN_PREFS[i];
        if (Object.prototype.hasOwnProperty.call(prefs, k)) fresh[k] = prefs[k];
      }
      prefs = fresh;
      localStorage.setItem(LS_PREFS, JSON.stringify(fresh));
    } catch (e) {}
  }

  /*@3.DASJ.9*/

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

  /*@3.DASJ.10*/
  function animateBar(node, pct) {
    if (!node) return;
    node.style.width = pct + '%';
  }

  /*@3.DASJ.140*/
  function setupDone() {
    try {
      if (window.GardenFirstRun && GardenFirstRun.completed) return !!GardenFirstRun.completed();
      var st = JSON.parse(localStorage.getItem('onboarding_state') || 'null');
      return !!(st && (st.completed_v || 0) > 0);
    } catch (e) { return false; }
  }

  /*@3.DASJ.11*/

  var WIDGETS = {

    welcome: {
      ar: 'ترحيب', en: 'Welcome',
      plain: true,                 /*@3.DASJ.12*/
      render: function () {
        var p = D.profile();
        /*@3.DASJ.13*/
        var name = D.dispName ? (D.dispName(p) || '') : ((p && p.name) || '');
        var now = new Date();
        var greet = now.getHours() < 12 ? tx('صباح الخير', 'Good morning')
                  : now.getHours() < 18 ? tx('مساء الخير', 'Good afternoon')
                                        : tx('مساء الخير', 'Good evening');
        /*@3.DASJ.14*/
        var greeting = name ? greet + tx('، ', ', ') + esc(name) : greet;
        /*@3.DASJ.15*/
        var g = new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-gregory' : 'en-GB',
          { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
        /*@3.DASJ.16*/
        var h = '';
        try {
          h = new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura',
            { day: 'numeric', month: 'long' }).format(now);
        } catch (e) {}
        /*@3.DASJ.139*/
        var done = setupDone();
        var invite = tx('أكمل ملفك وإعدادات الموقع', 'Finish your profile and settings');
        return head('<i class="fa-solid fa-hand-sparkles"></i>', tx('أهلاً', 'Welcome')) +
          '<button type="button" class="widget-body dash-greet" data-act="wizard" data-wizard-entry ' +
              'aria-label="' + esc(done ? tx('افتح معالج الإعداد', 'Open the setup wizard') : invite) + '" ' +
              'title="' + esc(done ? tx('معالج الإعداد', 'Setup wizard') : invite) + '">' +
            '<span class="dash-greet-n">' + greeting + '</span>' +
            '<span class="widget-sub">' + esc(g) + (h ? ' · ' + esc(h) : '') + '</span>' +
            (done ? '' : '<span class="dash-greet-cta">' +
              '<i class="fa-solid fa-seedling" aria-hidden="true"></i>' + esc(invite) + '</span>') +
          '</button>';
      }
    },

    semester: {
      ar: 'تقدّم الفصل', en: 'Semester progress',
      render: function () {
        var p = D.semesterProgress();
        if (!p.exists) {
          return head('<i class="fa-solid fa-graduation-cap"></i>', tx('فصلي', 'My semester'), 'hub/index.html') +
            emptyState('<i class="fa-solid fa-graduation-cap"></i>', tx('لا يوجد فصل بعد', 'No semester yet'), tx('أنشئ فصلك', 'Create semester'), 'go-hub');
        }
        return head('<i class="fa-solid fa-graduation-cap"></i>', tx('تقدّم الفصل', 'Semester progress'), 'hub/index.html') +
          '<div class="widget-body">' +
            '<div class="widget-metric">' + p.pct + '%</div>' +
            /*@3.DASJ.17*/
            '<div class="widget-sub">' + esc(p.name || tx('فصلي', 'My semester')) + ' · ' +
              esc(tx('أكملت ' + p.done + ' من ' + smartCount(p.total, ['مادة', 'مادتين', 'مواد'], ['course', 'courses']),
                     p.done + ' of ' + smartCount(p.total, ['مادة', 'مادتين', 'مواد'], ['course', 'courses']) + ' completed')) + '</div>' +
            '<div class="widget-bar"><div class="widget-bar-fill" data-bar="' + p.pct + '"></div></div>' +
          '</div>';
      }
    },

    gpa: {
      ar: 'المعدل', en: 'GPA',
      render: function () {
        var g = D.gpaSummary();
        if (!g.exists) {
          return head('<i class="fa-solid fa-chart-simple"></i>', tx('المعدل', 'GPA'), 'hub/gpa.html') +
            emptyState('<i class="fa-solid fa-chart-simple"></i>', tx('لم تُسجّل درجات بعد', 'No grades recorded yet'), tx('احسب معدلك', 'Calculate GPA'), 'go-gpa');
        }
        var pct = Math.max(0, Math.min(1, g.cgpa / 4));
        var r = 30, c = 2 * Math.PI * r;
        var off = c - pct * c;
        return head('<i class="fa-solid fa-chart-simple"></i>', tx('المعدل التراكمي', 'Cumulative GPA'), 'hub/gpa.html') +
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
        /*@3.DASJ.144*/
        /*@3.DASJ.19*/
        var all = (D.todayEvents ? D.todayEvents() : []);
        var live = [], doneN = 0, pastN = 0;
        all.forEach(function (e) {
          if (e.done) { doneN++; return; }
          if (e.past) { pastN++; return; }
          live.push(e);
        });
        var ICO = '<i class="fa-solid fa-calendar-day"></i>';
        var HD = head(ICO, tx('اليوم', 'Today'), 'hub/schedule.html');

        /*@3.DASJ.20*/
        if (!live.length) {
          var note = hiddenNote(D.todaySchedule());
          var msg = note ? note
            : (doneN && !pastN) ? tx('أنهيتَ كلَّ المهام 🎉', 'You finished every task 🎉')
            : (doneN || pastN) ? tx('انقضى اليوم', 'The day is over')
            : tx('لا شيء مجدول اليوم', 'Nothing scheduled today');
          return HD + ((doneN || pastN)
            ? emptyState(ICO, msg, tx('تفاصيل اليوم', 'Day details'), 'day-open')
            : emptyState(ICO, msg, tx('افتح الجدول', 'Open schedule'), 'go-schedule'));
        }

        /*@3.DASJ.148*/
        var list = live.slice(0, TODAY_ROWS).map(todayRow).join('');
        var bits = [];
        if (live.length > TODAY_ROWS) {
          bits.push('+' + (live.length - TODAY_ROWS) + ' ' + tx('أخرى', 'more'));
        }
        if (pastN) bits.push(pastN + ' ' + tx('مضت', 'passed'));
        if (doneN) bits.push(doneN + ' ' + tx('أُتمّت', 'done'));
        var foot = '<div class="dash-today-foot">' +
          '<span class="dash-today-cnt">' + esc(bits.join(' · ')) + '</span>' +
          '<button type="button" class="dash-today-more" data-act="day-open">' +
            esc(tx('تفاصيل اليوم', 'Day details')) + '</button>' +
          '</div>';
        return HD + '<div class="widget-body"><div class="widget-list">' + list + '</div>' + foot + '</div>';
      }
    },

    due: {
      ar: 'مستحقات', en: 'Due cards',
      render: function () {
        /*@3.DASJ.21*/
        var ICO = '<i class="fa-solid fa-layer-group" aria-hidden="true"></i>';
        var p = D.semesterProgress();
        if (!p.exists) {
          return head(ICO, tx('بطاقات مستحقّة', 'Cards due')) +
            emptyState('<i class="fa-solid fa-layer-group"></i>',
                       tx('أضف مواد فصلك لتتابع مستحقّاتك', 'Add semester courses to track due cards'),
                       tx('أنشئ فصلك', 'Create semester'), 'go-hub');
        }
        if (!p.due) {
          return head(ICO, tx('بطاقات مستحقّة', 'Cards due')) +
            emptyState('<i class="fa-solid fa-circle-check"></i>', tx('لا بطاقات مستحقّة — أحسنت!', 'No cards due — nice work!'));
        }
        /*@3.DASJ.22*/
        var withDue = p.courses.filter(function (c) { return c.due > 0; })
                               .sort(function (a, b) { return b.due - a.due; });
        var list = withDue.slice(0, 3).map(function (c) {
          return '<button class="widget-item dash-due-row" type="button" data-act="due-open" data-id="' + esc(c.code) + '">' +
            '<span class="dash-due-code">' + esc(c.code) + '</span>' +
            '<span class="widget-item-name">' + esc(isAr() ? c.name_ar : c.name_en) + '</span>' +
            '<span class="dash-due-n">' + c.due + '</span></button>';
        }).join('');
        var more = withDue.length > 3
          ? '<div class="widget-sub dash-due-more">+' + (withDue.length - 3) + ' ' + esc(tx('أخرى', 'more')) + '</div>'
          : '';
        /*@3.DASJ.23*/
        return head(ICO, tx('بطاقات مستحقّة', 'Cards due')) +
          '<div class="widget-body">' +
            '<div class="dash-due-metric">' +
              '<span class="dash-due-stack" aria-hidden="true"><i></i><i></i><i></i></span>' +
              /*@3.DASJ.24*/
              '<span class="dash-due-count">' +
                '<b>' + p.due + '</b>' +
                '<small>' + esc(tx('تنتظر مراجعتَك', 'awaiting your review')) + '</small>' +
              '</span>' +
            '</div>' +
            '<div class="widget-list dash-due-list">' + list + more + '</div>' +
            /*@3.DASJ.25*/
            '<button class="dash-due-cta" type="button" data-act="due-open">' +
              '<i class="fa-solid fa-play" aria-hidden="true"></i>' +
              esc(tx('ابدأ المراجعة', 'Start review')) + '</button>' +
          '</div>';
      }
    },

    /*@3.DASJ.26*/
    tasks: {
      ar: 'المهام', en: 'Tasks',
      render: function () {
        var t = D.tasks();
        var open = (t || []).filter(function (x) { return x && !x.done; });
        if (!open.length) {
          return head('<i class="fa-solid fa-clock"></i>', tx('القادم', 'Upcoming')) +
            emptyState('<i class="fa-solid fa-clock"></i>', tx('لا مهام قادمة', 'No upcoming tasks'), tx('أضف مهمة', 'Add task'), 'new-task');
        }
        open.sort(function (a, b) { return String(a.due || '').localeCompare(String(b.due || '')); });
        /*@3.DASJ.27*/
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
        return head('<i class="fa-solid fa-clock"></i>', tx('القادم', 'Upcoming')) +
          '<div class="widget-body"><div class="widget-list">' + list + '</div></div>';
      }
    },

    notes: {
      ar: 'ملاحظات سريعة', en: 'Quick notes',
      render: function () {
        /*@3.DASJ.28*/
        var everything = (D.quickNotes() || []).filter(function (x) { return x; });
        var total = everything.length;                 /*@3.DASJ.29*/
        var all = everything.filter(function (x) { return !x.archived; });
        all.sort(function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); });
        var recent = all.slice(0, 3);
        var list = recent.length ? recent.map(function (n) {
          var body = (n.body || '').trim() || tx('(فارغة)', '(empty)');
          /*@3.DASJ.30*/
    var rem = n.remind_at ? '<span class="wn-rem"><i class="fa-solid fa-clock" aria-hidden="true"></i> ' + esc(String(n.remind_at).replace('T', ' ')) + '</span>' : '';
          return '<button class="wn-item" data-act="note-edit" data-id="' + esc(n.id) + '">' +
            '<span class="wn-body">' + esc(body.slice(0, 90)) + '</span>' + rem + '</button>';
        }).join('') : '<div class="widget-sub">' + esc(tx('لا ملاحظات بعد — أضِف واحدة', 'No notes yet — add one')) + '</div>';
        return head('<i class="fa-solid fa-note-sticky"></i>', tx('ملاحظات سريعة', 'Quick notes')) +
          '<div class="widget-body">' +
            '<div class="wn-list">' + list + '</div>' +
            '<div class="wn-foot">' +
              '<button class="wn-add" data-act="note-add">＋ ' + esc(tx('ملاحظة', 'Note')) + '</button>' +
              (total > recent.length ? '<button class="wn-all" data-act="notes-all">' + esc(tx('الكل', 'All')) + ' (' + total + ')</button>' : '') +
            '</div>' +
          '</div>';
      }
    },

    /*@3.DASJ.31*/
    community: {
      ar: 'مجتمع الكلية', en: 'College community',
      plain: true, dismissible: true,
      render: function () {
        /*@3.DASJ.32*/
        var mark = '<i class="fa-brands fa-telegram" aria-hidden="true"></i>';
        return head('<i class="fa-solid fa-user-group"></i>', tx('مجتمع الكلية', 'College community')) +
          '<div class="widget-body cm-body">' +
            '<div class="cm-title">' + esc(tx('قروب كلية الحوسبة والمعلوماتية',
              'Computing & Informatics group')) + '</div>' +
            '<div class="widget-sub">' + esc(tx('اسأل زملاءك، وتابع إعلانات الكلية وملفّاتها أولاً بأول.',
              'Ask your peers, and keep up with college announcements and files.')) + '</div>' +
            '<div class="cm-links">' +
              '<a class="cm-btn cm-btn--chat" href="' + COMMUNITY_CHAT_URL + '" target="_blank" rel="noopener noreferrer">' +
                mark + '<span>' + esc(tx('انضم للدردشة', 'Join the chat')) + '</span></a>' +
              '<a class="cm-btn cm-btn--archive" href="' + COMMUNITY_ARCHIVE_URL + '" target="_blank" rel="noopener noreferrer">' +
                mark + '<span>' + esc(tx('الأرشيف والأخبار', 'Archive & news')) + '</span></a>' +
            '</div>' +
          '</div>';
      }
    }
  };

  /*@3.DASJ.33*/
  /*@3.DASJ.143*/
  function hiddenNote(s) {
    if (!s || !s.hidden) return '';
    var R = window.GardenScheduleRules;
    if (!R || !R.lectureNotice) return '';
    var n = R.lectureNotice(new Date(), isAr());
    return n ? n.text : '';
  }

  var TODAY_ROWS = 3;
  var TODAY_COLOUR = {
    exam: 'var(--st-danger)', lecture: 'var(--st-accent)', study: 'var(--st-ok)',
    intensive: 'var(--st-accent)', general: 'var(--st-warn)', task: 'var(--st-warn)'
  };
  function todayName(e) {
    var code = e.code || '';
    /*@3.DASJ.147*/
    if (e.kind === 'lecture') return code + ' · ' + tx('محاضرة', 'Lecture');
    if (e.kind === 'exam') return code + ' · ' + tx('اختبار', 'Exam');
    if (e.kind === 'study') return code + ' · ' + (e.label || tx('مذاكرة', 'Study'));
    /*@3.DASJ.18*/
    if (e.kind === 'intensive') {
      var num = parseInt(String(e.module || '').replace('M', ''), 10);
      var what = e.sub === 'buffer' ? tx('مراجعة ما قبل الاختبار', 'Pre-exam review')
               : e.sub === 'spaced' ? tx('مراجعة متباعدة', 'Spaced review')
               : (tx('الوحدة ', 'Module ') + (num || '—') +
                  (e.total_parts > 1 ? ' (' + e.part + '/' + e.total_parts + ')' : ''));
      return code + ' · ' + what;
    }
    var t = e.label || tx('حدث', 'Event');
    return code ? (code + ' · ' + t) : t;
  }
  /*@3.DASJ.146*/
  function todayRow(e) {
    var name = todayName(e);
    var lbl = tx('إتمام', 'Mark done') + ' — ' + name;
    var cont = e.spill
      ? '<i class="fa-solid fa-arrow-turn-down widget-item-cont" aria-hidden="true"></i>' : '';
    var when = e.spill ? minToHM(e.spill_start) : (e.time || tx('طوال اليوم', 'All day'));
    var from = e.spill
      ? (tx('بدأ أمسِ ', 'Started yesterday ') + minToHM(e.spill_start) + ' — ') : '';
    return '<div class="widget-item widget-item--act' + (e.spill ? ' is-spill' : '') + '">' +
      '<a class="widget-item-go" href="hub/schedule.html"' +
        (e.spill ? ' title="' + esc(from + name) + '"' : '') + '>' +
        '<span class="widget-item-dot" style="background:' + (TODAY_COLOUR[e.kind] || 'var(--st-accent)') + '"></span>' +
        '<span class="widget-item-time">' + esc(when) + '</span>' +
        cont +
        '<span class="widget-item-name">' + esc(name) + '</span>' +
      '</a>' +
      '<button type="button" class="widget-item-check" data-act="today-done"' +
        ' data-src="' + esc(e.src) + '" data-id="' + esc(e.id) + '" data-code="' + esc(e.code || '') + '"' +
        ' data-date="' + esc(e.src_date || e.date || '') + '"' +
        ' title="' + esc(from + lbl) + '" aria-label="' + esc(from + lbl) + '">' +
        '<i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '</div>';
  }
  function minToHM(m) {
    var h = Math.floor((m || 0) / 60), n = (m || 0) % 60;
    return String(h).padStart(2, '0') + ':' + String(n).padStart(2, '0');
  }

  /*@3.DASJ.149*/
  var dayScope = 'all';

  function dayIsOpen() { var m = el('day-modal'); return !!(m && !m.hidden); }
  function closeDay() { var m = el('day-modal'); if (m) m.hidden = true; }
  function openDay() {
    var m = el('day-modal');
    if (!m) return;
    dayScope = 'all';
    m.hidden = false;
    renderDay();
  }

  function courseNameOf(code, list) {
    if (!code) return '';
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].code === code) {
        return isAr() ? (list[i].name_ar || list[i].name_en || '')
                      : (list[i].name_en || list[i].name_ar || '');
      }
    }
    var info = D.courseInfo ? D.courseInfo(code) : null;
    if (!info) return '';
    return isAr() ? (info.name_ar || info.name_en || '') : (info.name_en || info.name_ar || '');
  }

  function gapText(mins) {
    var h = Math.round(mins / 60);
    if (!isAr()) return h === 1 ? '1 hour gap' : (h + ' hours gap');
    if (h === 1) return 'فجوةُ ساعة';
    if (h === 2) return 'فجوةُ ساعتين';
    return 'فجوةُ ' + h + ' ساعات';
  }

  function dayStart(e) {
    if (e.allDay || e.start === null || e.start === undefined) return null;
    return e.start;
  }

  function dayRow(e, names) {
    var cls = 'dash-day-r' + ((e.done || e.past) ? ' is-off' : '') + (e.done ? ' is-done' : '');
    var col = TODAY_COLOUR[e.kind] || 'var(--st-accent)';
    var st = dayStart(e);
    var when = (st === null) ? tx('طوال اليوم', 'All day')
                             : minToHM(e.spill ? e.spill_start : st);
    var name = todayName(e);
    var meta = [];
    var cn = courseNameOf(e.code, names);
    if (cn) meta.push('<span>' + esc(cn) + '</span>');
    if (e.kind === 'lecture' && e.label) {
      meta.push('<span class="dash-day-tag">' + esc(e.label) + '</span>');
    }
    if (st !== null && e.end !== null && e.end !== undefined && e.end !== st) {
      meta.push('<span class="dash-day-tag">' +
        esc(tx('حتى ', 'until ') + minToHM(e.end % 1440)) + '</span>');
    }
    if (e.spill) {
      meta.push('<span class="dash-day-tag">' + esc(tx('بدأ أمسِ', 'Started yesterday')) + '</span>');
    }
    if (e.past && !e.done) {
      meta.push('<span class="dash-day-tag">' + esc(tx('مضت', 'passed')) + '</span>');
    }
    var lbl = (e.done ? tx('إلغاء الإتمام', 'Undo done') : tx('إتمام', 'Mark done')) + ' — ' + name;
    return '<div class="' + cls + '" style="--ev-color:' + col + '">' +
      '<div class="dash-day-h"><b>' + esc(when) + '</b></div>' +
      '<div class="dash-day-l"></div>' +
      '<div class="dash-day-c"><div class="dash-day-card">' +
        '<div class="dash-day-b">' +
          '<span class="dash-day-n">' + esc(name) + '</span>' +
          (meta.length ? '<span class="dash-day-m">' + meta.join('') + '</span>' : '') +
        '</div>' +
        '<button type="button" class="dash-day-x2" data-act="today-done"' +
          ' data-src="' + esc(e.src) + '" data-id="' + esc(e.id) + '"' +
          ' data-code="' + esc(e.code || '') + '"' +
          ' data-date="' + esc(e.src_date || e.date || '') + '"' +
          ' data-on="' + (e.done ? '0' : '1') + '"' +
          ' title="' + esc(lbl) + '" aria-label="' + esc(lbl) + '">' +
          '<i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '</div></div></div>';
  }

  function renderDay() {
    var body = el('day-modal-body');
    if (!body) return;
    var all = (D.todayEvents ? D.todayEvents() : []);
    var left = all.filter(function (e) { return !e.done && !e.past; });

    var sub = el('day-modal-sub');
    if (sub) {
      var loc = isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
      var when = new Date().toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
      sub.textContent = when + ' — ' + (isAr()
        ? (left.length + ' متبقّية من ' + all.length)
        : (left.length + ' left of ' + all.length));
    }

    var segs = document.querySelectorAll('#day-modal-seg [data-scope]');
    for (var i = 0; i < segs.length; i++) {
      segs[i].setAttribute('aria-pressed',
        segs[i].getAttribute('data-scope') === dayScope ? 'true' : 'false');
    }

    var rows = (dayScope === 'left') ? left : all;
    if (!rows.length) {
      body.innerHTML = '<div class="dash-day-none">' + esc(dayScope === 'left'
        ? tx('لا شيء متبقٍّ اليوم', 'Nothing left today')
        : tx('لا شيء مجدول اليوم', 'Nothing scheduled today')) + '</div>';
      return;
    }

    var sem = D.semester ? D.semester() : null;
    var names = (sem && sem.courses) || [];
    var n = new Date();
    var nowMin = n.getHours() * 60 + n.getMinutes();
    var nowLine = '<div class="dash-day-now"><b>' + esc(minToHM(nowMin)) + '</b><i></i></div>';
    var html = '', shownNow = false, prevEnd = null;

    rows.forEach(function (e) {
      var st = dayStart(e);
      if (st !== null && prevEnd !== null && st - prevEnd >= 60) {
        html += '<div class="dash-day-gap"><span></span><b>' +
          esc(gapText(st - prevEnd)) + '</b><i></i></div>';
      }
      if (!shownNow && st !== null && st > nowMin) { html += nowLine; shownNow = true; }
      html += dayRow(e, names);
      if (st !== null) {
        var en = (e.end === null || e.end === undefined) ? st : Math.min(e.end, 1440);
        prevEnd = (prevEnd === null) ? en : Math.max(prevEnd, en);
      }
    });
    if (!shownNow) html += nowLine;
    body.innerHTML = html;
  }

  /*@3.DASJ.34*/
  function clearIntensiveSlot() {
    var slot = el('ip-home-slot');
    if (slot) slot.innerHTML = '';
  }

  /*@3.DASJ.35*/
  function renderExamStrip() {
    var slot = el('dash-exam-slot');
    if (!slot) return;
    var w = null;
    try { w = D.majorExamWave ? D.majorExamWave(21) : null; } catch (e) { w = null; }
    if (!w) { slot.innerHTML = ''; slot.hidden = true; return; }

    var kind = w.kind === 'final'
      ? tx('الاختبارات النهائية', 'Final exams')
      : tx('الاختبارات النصفيّة', 'Midterm exams');

    /*@3.DASJ.36*/
    var big = w.days === 0 ? tx('اليوم', 'Today')
            : w.days === 1 ? tx('غداً', 'Tomorrow')
            : String(w.days);
    var unit = (w.days > 1)
      ? countWord(w.days, ['يوم', 'يومان', 'أيام'], ['day', 'days'])
      : '';

    var when = '';
    try {
      /*@3.DASJ.37*/
      when = new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
        { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(w.due));
    } catch (e) {}

    /*@3.DASJ.38*/
    var many = w.total > w.count
      ? tx('بقي ' + smartCount(w.count, ['اختبار', 'اختباران', 'اختبارات'], ['exam', 'exams']) + ' من ' + w.total,
           w.count + ' of ' + w.total + ' left')
      : smartCount(w.count, ['اختبار', 'اختباران', 'اختبارات'], ['exam', 'exams']);

    var near = (w.course ? w.course + ' · ' : '') + when;

    slot.hidden = false;
    slot.innerHTML =
      '<a class="dash-xam" href="hub/schedule.html" data-tone="' + (w.days <= 3 ? 'danger' : 'warn') + '">' +
        '<span class="dash-xam-num">' +
          '<b>' + esc(big) + '</b>' + (unit ? '<span>' + esc(unit) + '</span>' : '') +
        '</span>' +
        '<span class="dash-xam-txt">' +
          '<span class="dash-xam-t">' + esc(kind) + '</span>' +
          '<span class="dash-xam-s">' + esc(many) + (near ? ' · ' + esc(near) : '') + '</span>' +
        '</span>' +
        '<i class="fa-solid fa-calendar-week dash-xam-go" aria-hidden="true"></i>' +
      '</a>';
  }

  /*@3.DASJ.39*/

  function renderWidgets() {
    clearIntensiveSlot();
    renderExamStrip();
    var grid = el('widgets-grid');
    if (!grid) return;
    var html = '';
    prefs.order.forEach(function (id) {
      var w = WIDGETS[id];
      if (!w) return;
      var hidden = !!prefs.hidden[id];
      if (hidden && !document.body.classList.contains('dash-customizing')) return;
      var focusable = !w.plain;   /*@3.DASJ.40*/
      html += '<article class="widget' + (hidden ? ' is-hidden-widget' : '') + '" data-widget="' + id + '" draggable="false"' +
        (focusable ? ' tabindex="0" role="link"' : '') + '>' +
        /*@3.DASJ.41*/
        (w.dismissible ? '<button type="button" class="widget-eye" data-act="w-dismiss" data-id="' + id + '"' +
          ' title="' + esc(tx('إخفاء البطاقة', 'Hide card')) + '"' +
          ' aria-label="' + esc(tx('إخفاء البطاقة', 'Hide card')) + '">' +
          '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i></button>' : '') +
        '<div class="widget-cust">' +
          '<button data-act="w-hide" data-id="' + id + '" title="' + esc(tx('إظهار/إخفاء', 'Show/hide')) + '">' + (hidden ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>') + '</button>' +
          '<button data-act="w-up" data-id="' + id + '" title="' + esc(tx('تقديم', 'Move up')) + '">↑</button>' +
          '<button data-act="w-down" data-id="' + id + '" title="' + esc(tx('تأخير', 'Move down')) + '">↓</button>' +
        '</div>' +
        (function () { try { return w.render(); } catch (e) {
          return head('<i class="fa-solid fa-triangle-exclamation"></i>', id) + '<div class="widget-body"><div class="widget-sub">' +
            esc(tx('تعذّر عرض هذه الودجة', 'This widget failed to render')) + '</div></div>';
        } })() +
        '</article>';
    });
    grid.innerHTML = html;

    /*@3.DASJ.42*/
    grid.querySelectorAll('[data-bar]').forEach(function (b) {
      animateBar(b, parseInt(b.getAttribute('data-bar'), 10) || 0);
    });
    if (document.body.classList.contains('dash-customizing')) enableDrag();
  }

  /*@3.DASJ.43*/
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

  /*@3.DASJ.44*/

  /*@3.DASJ.45*/
  var STYLE_COLORS = ['#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#64748b'];
  var STYLE_ICONS = ['fa-solid fa-book', 'fa-solid fa-flask', 'fa-solid fa-calculator', 'fa-solid fa-code',
    'fa-solid fa-brain', 'fa-solid fa-globe', 'fa-solid fa-pen-fancy', 'fa-solid fa-chart-column',
    'fa-solid fa-microchip', 'fa-solid fa-database', 'fa-solid fa-palette', 'fa-solid fa-scale-balanced'];

  /*@3.DASJ.46*/
  function courseStyle(code, entry) {
    var info = D.courseInfo(code);
    var mine = (prefs && prefs.courseStyle && prefs.courseStyle[code]) || {};
    return {
      color: D.courseColor(code, entry),
      icon: mine.icon || (info && info.icon) || 'fa-solid fa-book'
    };
  }

  function openCourseStyle(code) {
    /*@3.DASJ.47*/
    var row = (D.semesterProgress().courses || []).filter(function (x) { return x.code === code; })[0];
    var cur = courseStyle(code, row ? { brand_color: row.color } : null);
    var ov = el('dash-style-modal');
    if (!ov) return;
    ov.querySelector('[data-style-body]').innerHTML =
      '<div class="dash-style-row">' + STYLE_COLORS.map(function (c) {
        return '<button class="dash-style-color' + (c === cur.color ? ' active' : '') +
          '" data-color="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>';
      }).join('') + '</div>' +
      '<div class="dash-style-row">' + STYLE_ICONS.map(function (i) {
        return '<button class="dash-style-icon' + (i === cur.icon ? ' active' : '') +
          '" data-icon="' + i + '"><i class="' + i + '"></i></button>';
      }).join('') + '</div>';
    ov.style.display = '';
    ov.setAttribute('data-code', code);
  }

  /*@3.DASJ.48*/
  function bindSettingsAcc() {
    var accs = document.querySelectorAll('.dash-settings .dash-acc');
    if (!accs.length) return;
    Array.prototype.forEach.call(accs, function (a) {
      var head = a.querySelector('.dash-acc-head');
      if (!head) return;
      head.addEventListener('click', function () {
        var open = a.classList.contains('is-open');
        Array.prototype.forEach.call(accs, function (x) { x.classList.remove('is-open'); });
        if (!open) a.classList.add('is-open');
        syncAccSummaries();
      });
    });
    syncAccSummaries();
  }
  function syncAccSummaries() {
    var s = el('acc-sum-profile');
    if (s) {
      var nm = (el('set-name') && el('set-name').value) ||
               (el('set-name-en') && el('set-name-en').value) || '';
      var lv = (el('set-level') && el('set-level').value) || '';
      s.textContent = [nm, lv ? tx('المستوى ' + lv, 'Level ' + lv) : ''].filter(Boolean).join(' · ');
    }
    var r = el('acc-sum-rem');
    if (r) {
      /*@3.DASJ.49*/
      var on = !!(window.Reminders && Reminders.settings && Reminders.settings().enabled);
      var okPerm = !(window.Reminders && Reminders.capability
        && Reminders.capability().permission !== 'granted');
      r.textContent = on
        ? (okPerm ? tx('مفعّلة', 'On') : tx('مفعّلة — الإذن ناقص', 'On — permission missing'))
        : tx('مطفأة', 'Off');
    }
    var y = el('acc-sum-sync');
    if (y) {
      var t = el('sync-state-text');
      y.textContent = (t && t.textContent !== '—') ? t.textContent : tx('غير مضبوطة', 'Not set up');
    }
    var g = el('acc-sum-legacy');
    if (g && window.ByteLegacy) {
      var ls = window.ByteLegacy.summary();
      g.textContent = !ls.exists ? ''
        : window.ByteLegacy.hasContent(ls)
          ? tx('فيها عملٌ محفوظ', 'Contains saved work')
          : tx('بقايا فارغة', 'Empty leftovers');
    }
  }
  /*@3.DASJ.50*/
  document.addEventListener('reminders:synced', syncAccSummaries);
  document.addEventListener('garden:languageChanged', syncAccSummaries);

  function bindStyleModal() {
    var ov = el('dash-style-modal');
    if (!ov) return;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-style-close]')) { ov.style.display = 'none'; return; }
      var b = e.target.closest('[data-color], [data-icon]');
      if (!b) return;
      var code = ov.getAttribute('data-code');
      if (!code) return;
      var cur = prefs.courseStyle[code] || (prefs.courseStyle[code] = {});
      if (b.hasAttribute('data-color')) cur.color = b.getAttribute('data-color');
      else cur.icon = b.getAttribute('data-icon');
      savePrefs();
      openCourseStyle(code);      /*@3.DASJ.51*/
      renderCourses();
    });
  }

  /*@3.DASJ.52*/
  function creditsText(n) {
    n = Number(n) || 0;
    if (!isAr()) return n + (n === 1 ? ' credit' : ' credits');
    if (n === 1) return 'ساعة';
    if (n === 2) return 'ساعتان';
    return (n <= 10 ? n + ' ساعات' : n + ' ساعة');
  }

  function renderCourses() {
    var grids = [el('dash-courses'), el('dash-courses-full')].filter(Boolean);
    if (!grids.length) return;
    var p = D.semesterProgress();
    if (!p.exists) {
      var empty = '<div class="widget" style="grid-column:1/-1">' +
        emptyState('<i class="fa-solid fa-graduation-cap"></i>', tx('لا مواد في فصلك بعد', 'No courses in your semester yet'),
                   tx('أنشئ فصلك', 'Create semester'), 'go-hub') + '</div>';
      grids.forEach(function (g) { g.innerHTML = empty; });
      return;
    }
    /*@3.DASJ.53*/
    var html = p.courses.map(function (c) {
      /*@3.DASJ.54*/
      var st = courseStyle(c.code, { brand_color: c.color });
      var color = st.color;
      var href = c.path || 'hub/index.html';
      var isReal = D.isRealCourse(c.code);
      /*@3.DASJ.55*/
      var codeCell = c.custom
        ? '<span class="dash-course-code dash-course-custom" data-ar="مخصّصة" data-en="Custom">' + esc(tx('مخصّصة', 'Custom')) + '</span>'
        : '<a class="dash-course-code" href="' + esc(href) + '">' + esc(c.code) + '</a>';
      return '<div class="dash-course-card" style="--course-color:' + esc(color) + '" data-course="' + esc(c.code) + '" ' +
        'tabindex="0" role="link" aria-label="' + esc(isAr() ? c.name_ar : c.name_en) + '">' +
        '<div class="dash-course-top">' +
          /*@3.DASJ.56*/
          '<span class="dash-course-icon"><i class="' + esc(st.icon) + '"></i></span>' +
          codeCell +
          (isReal ? '<a class="dash-course-info" href="hub/course.html?code=' + encodeURIComponent(c.code) + '" ' +
            'title="' + esc(tx('بطاقة المادة', 'Course card')) + '" aria-label="' + esc(tx('بطاقة المادة', 'Course card')) + '" ' +
            'data-ar="بطاقة المادة" data-en="Course card">' + esc(tx('بطاقة المادة', 'Course card')) + '</a>'
            : '<button class="dash-course-style" data-act="course-style" data-id="' + esc(c.code) + '" ' +
              'title="' + esc(tx('لون المادة وأيقونتها', 'Course color & icon')) + '" aria-label="' +
              esc(tx('لون المادة وأيقونتها', 'Course color & icon')) + '"><i class="fa-solid fa-palette"></i></button>') +
        '</div>' +
        '<div class="dash-course-body">' +
          '<a class="dash-course-name" href="' + esc(href) + '">' + esc(isAr() ? c.name_ar : c.name_en) + '</a>' +
          /*@3.DASJ.57*/
          '<p class="dash-course-desc">' + esc(isAr() ? c.desc_ar : c.desc_en) + '</p>' +
          '<div class="dash-course-meta">' +
            '<span>' + esc(creditsText(c.credits)) + '</span>' +
            (c.completed ? '<span class="dash-course-st is-done"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
              esc(tx('مكتملة', 'Completed')) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="dash-course-prog">' +
          '<span class="dash-course-bar"><span class="dash-course-fill" style="width:' + c.pct + '%"></span></span>' +
          '<span class="dash-course-pct">' + c.pct + '%</span>' +
        '</div></div>';
    }).join('');
    grids.forEach(function (g) { g.innerHTML = html; });
  }

  /*@3.DASJ.58*/
  function applyLevelsSectionVis() {
    var s = el('dash-levels-section');
    if (s) s.style.display = (prefs && prefs.hideLevelsSection) ? 'none' : '';
  }

  var _cfg = null;
  function renderLevels() {
    var grids = [el('dash-levels'), el('dash-levels-full')].filter(Boolean);
    if (!grids.length || !_cfg) return;
    var colors = ['#3b82f6', '#10b981', '#a78bfa', '#f59e0b', '#f43f5e', '#06b6d4'];
    /*@3.DASJ.59*/
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
      if (done && levelDone(lv)) return;   /*@3.DASJ.60*/
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
        '<span class="dash-level-num"><i class="fa-solid fa-layer-group"></i></span>' +
        '<span class="dash-level-info">' +
          '<span class="dash-level-title">' + esc(tx('مقررات أخرى', 'Other courses')) + '</span>' +
          '<span class="dash-level-meta">' +
            esc(smartCount((o.subjects || []).length, ['مادة', 'مادتين', 'مواد'], ['course', 'courses'])) + '</span>' +
        '</span></a>';
    }
    grids.forEach(function (g) { g.innerHTML = html; });
  }

  /*@3.DASJ.61*/

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
    /*@3.DASJ.62*/
    reading:    ['قراءة', 'Reading'],
    discussion: ['مناقشة', 'Discussion'],
    task:       ['مهمة', 'Task'],
    note:       ['تذكير', 'Reminder'],
    other:      ['مهمة', 'Task']
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

  /*@3.DASJ.63*/
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
        (t.done ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '') + '</button>'
      : '<span class="tk-check tk-check-locked" aria-hidden="true">' + (t.source === 'exam' ? '<i class="fa-solid fa-file-pen"></i>' : '<i class="fa-solid fa-calendar-days"></i>') + '</span>';

    var actions = t.editable
      ? '<button class="tk-act" data-act="tk-edit" data-id="' + esc(t.id) + '" aria-label="' + esc(tx('تعديل', 'Edit')) + '"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="tk-act" data-act="tk-del" data-id="' + esc(t.id) + '" aria-label="' + esc(tx('حذف', 'Delete')) + '"><i class="fa-solid fa-trash"></i></button>'
      : '<a class="tk-act" href="' + (t.source === 'exam' ? 'hub/schedule.html' : 'hub/course.html?code=' + encodeURIComponent(t.course || '')) + '" ' +
        'aria-label="' + esc(tx('فتح المصدر', 'Open source')) + '"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>';

    /*@3.DASJ.64*/
    return '<div class="tk-item ' + u.cls + '">' +
      check +
      '<button type="button" class="tk-main" data-act="tk-open" data-id="' + esc(t.id) + '"' +
        ' data-src="' + esc(t.source || 'task') + '"' +
        ' aria-label="' + esc(tx('تفاصيل: ', 'Details: ') + title) + '">' +
        '<div class="tk-title">' + esc(title) + '</div>' +
        '<div class="tk-meta">' +
          (t.course ? '<span class="tk-chip">' + esc(t.course) + '</span>' : '') +
          '<span class="tk-chip">' + esc(typeLabel(t.type)) + '</span>' +
          '<span class="tk-chip tk-chip-src">' + esc(tx(src[0], src[1])) + '</span>' +
          (t.note ? '<span class="tk-note">' + esc(t.note) + '</span>' : '') +
        '</div>' +
      '</button>' +
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
        emptyState('<i class="fa-solid fa-clock"></i>', msg, tkFilter === 'all' ? tx('مهمة جديدة', 'New task') : '', 'add-task') + '</div>';
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

  /*@3.DASJ.65*/
  var sheetTask = null;

  var SHEET_ICON = {
    task: 'fa-list-check', course: 'fa-book-open', exam: 'fa-file-pen'
  };

  function fmtDue(due) {
    if (!due) return null;
    var s = String(due);
    var day = s.split('T')[0], time = s.indexOf('T') > -1 ? s.split('T')[1].slice(0, 5) : '';
    var p = day.split('-');
    var d = new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
    if (isNaN(d.getTime())) return { day: day, time: time };
    /*@3.DASJ.66*/
    var loc = isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
    var txt = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var t12 = '';
    if (time) {
      var hm = time.split(':');
      var dd = new Date(2000, 0, 1, +hm[0] || 0, +hm[1] || 0);
      t12 = dd.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    }
    return { day: txt, time: t12 };
  }

  function sheetRow(icon, label, value, mono) {
    if (!value) return '';
    return '<div class="tk-sheet-row"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span class="tk-sheet-l">' + esc(label) + '</span>' +
      '<span class="tk-sheet-v' + (mono ? ' mono' : '') + '">' + esc(value) + '</span></div>';
  }

  function openTaskSheet(id, src) {
    var m = el('tk-sheet');
    if (!m) return;
    var t = D.allDeadlines().filter(function (x) {
      return String(x.id) === String(id) && (!src || x.source === src);
    })[0];
    if (!t) return;
    sheetTask = t;

    var days = D.daysUntil(t.due);
    var u = urgency(days, t.done);
    var info = t.course ? D.courseInfo(t.course) : null;
    var color = (info && info.brand_color) || 'var(--st-accent)';
    var box = m.querySelector('.tk-sheet-box');
    if (box) box.style.setProperty('--ev-color', color);

    el('tk-sheet-kind').innerHTML =
      '<i class="fa-solid ' + (SHEET_ICON[t.source] || SHEET_ICON.task) + '" aria-hidden="true"></i> ' +
      esc(typeLabel(t.type));
    el('tk-sheet-title').textContent =
      t.title || (t.course ? t.course + ' · ' + typeLabel(t.type) : typeLabel(t.type));
    var ce = el('tk-sheet-course');
    ce.textContent = t.course ? (t.course + (info ? ' · ' + (isAr() ? info.name_ar : info.name_en) : '')) : '';
    ce.hidden = !t.course;

    var f = fmtDue(t.due);
    var srcL = SRC_LABEL[t.source] || SRC_LABEL.task;
    var rows = '';
    rows += sheetRow('fa-calendar-day', tx('التاريخ', 'Date'), f ? f.day : tx('بلا تاريخ', 'No date'));
    if (f && f.time) rows += sheetRow('fa-clock', tx('الوقت', 'Time'), f.time, true);
    rows += '<div class="tk-sheet-row"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>' +
      '<span class="tk-sheet-l">' + esc(tx('المتبقّي', 'Remaining')) + '</span>' +
      '<span class="tk-sheet-v" style="color:' + u.color + ';font-weight:800">' + esc(dueLabel(days)) + '</span></div>';
    rows += sheetRow('fa-inbox', tx('المصدر', 'Source'), tx(srcL[0], srcL[1]));
    rows += sheetRow('fa-circle-check', tx('الحالة', 'Status'),
      t.done ? tx('مكتملة', 'Done') : tx('لم تُنجَز بعد', 'Not done yet'));
    if (t.note) rows += '<p class="tk-sheet-note">' + esc(t.note) + '</p>';
    el('tk-sheet-body').innerHTML = rows;

    /*@3.DASJ.67*/
    var b = '';
    if (t.editable) {
      b += '<button class="tk-btn tk-btn-primary" data-act="sheet-done">' +
        '<i class="fa-solid fa-check"></i> ' + (t.done ? tx('تراجع', 'Undo') : tx('إتمام', 'Done')) + '</button>' +
        '<button class="tk-btn" data-act="sheet-edit"><i class="fa-solid fa-pen"></i> ' + tx('تعديل', 'Edit') + '</button>' +
        '<button class="tk-btn tk-btn-danger" data-act="sheet-del"><i class="fa-solid fa-trash"></i> ' + tx('حذف', 'Delete') + '</button>';
    } else {
      var href = t.source === 'exam' ? 'hub/schedule.html'
               : 'hub/course.html?code=' + encodeURIComponent(t.course || '');
      b += '<a class="tk-btn tk-btn-primary" href="' + href + '">' +
        '<i class="fa-solid fa-arrow-up-right-from-square"></i> ' +
        (t.source === 'exam' ? tx('افتح في الجدول', 'Open in schedule') : tx('افتح بطاقة المادة', 'Open the course card')) + '</a>';
    }
    b += '<button class="tk-btn tk-btn-ghost" data-act="sheet-close">' + tx('إغلاق', 'Close') + '</button>';
    el('tk-sheet-acts').innerHTML = b;

    m.hidden = false;
  }
  function closeTaskSheet() { var m = el('tk-sheet'); if (m) m.hidden = true; sheetTask = null; }

  /*@3.DASJ.68*/

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

  /*@3.DASJ.136*/
  function nowParts() {
    var d = new Date();
    var p2 = function (n) { return String(n).padStart(2, '0'); };
    var m = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 15) * 15;
    if (m >= 24 * 60) m = 24 * 60 - 15;
    return {
      date: d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()),
      time: p2(Math.floor(m / 60)) + ':' + p2(m % 60)
    };
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
    /*@3.DASJ.69*/
    /*@3.DASJ.137*/
    var due = t ? String(t.due || '') : '';
    var nowD = nowParts();
    el('tk-f-date').value = due ? due.split('T')[0] : (t ? '' : nowD.date);
    el('tk-f-time').value = due.indexOf('T') > -1 ? due.split('T')[1].slice(0, 5)
                          : (t ? '' : nowD.time);
    el('tk-f-note').value = t ? (t.note || '') : '';
    el('tk-modal-title').textContent = t ? tx('تعديل المهمة', 'Edit task') : tx('مهمة جديدة', 'New task');
    m.hidden = false;
    setTimeout(function () { el('tk-f-title').focus(); }, 50);
  }

  function closeTaskModal() { var m = el('tk-modal'); if (m) m.hidden = true; }

  /*@3.DASJ.70*/
  function loadNotesArr() { return D.quickNotes() || []; }
  /*@3.DASJ.71*/
  function saveNotesArr(arr) {
    try { localStorage.setItem('quick_notes', JSON.stringify(arr)); } catch (_) {}
  }
  /*@3.DASJ.72*/
  var _noteCtx = null;
  function openNoteModal(id, ctx) {
    _noteCtx = (!id && ctx) ? ctx : null;
    var m = el('note-modal'); if (!m) return;
    var n = id ? loadNotesArr().find(function (x) { return String(x.id) === String(id); }) : null;
    el('note-f-id').value = n ? n.id : '';
    el('note-f-body').value = n ? (n.body || '') : '';
    /*@3.DASJ.73*/
    var rAt = n && n.remind_at ? String(n.remind_at) : '';
    el('note-f-remind').value = rAt.slice(0, 10);
    var rt = el('note-f-remind-time');
    if (rt) rt.value = rAt.length > 10 ? rAt.slice(11, 16) : '';
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
    /*@3.DASJ.74*/
    var rtEl = el('note-f-remind-time');
    var rTime = rtEl ? rtEl.value : '';
    if (remind && rTime) remind = remind + 'T' + rTime;
    if (!body && !remind) { closeNoteModal(); return; }
    var arr = loadNotesArr();
    var n = id ? arr.find(function (x) { return String(x.id) === String(id); }) : null;

    /*@3.DASJ.75*/
    if (remind && D.convertNoteToTask) {
      var src = n || { id: 'n' + Date.now(), created_at: Date.now() };
      src.body = body;
      src.remind_at = remind;
      if (!n && _noteCtx && _noteCtx.course) src.course = _noteCtx.course;
      _noteCtx = null;
      /*@3.DASJ.138*/
      (D.linkNoteToTask || D.convertNoteToTask)(src);
      closeNoteModal();
      renderWidgets(); renderTasks(); refreshNotesListModal();
      toast(tx('أُضيفت مهمّةٌ مرتبطة — والملاحظةُ باقية',
               'A linked task was added — the note stays'));
      return;
    }

    if (n) { n.body = body; n.remind_at = null; n.updated_at = Date.now(); }
    else {
      /*@3.DASJ.76*/
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
    /*@3.DASJ.77*/
    var rem = n.remind_at ? '<span class="wn-rem"><i class="fa-solid fa-clock" aria-hidden="true"></i> ' + esc(String(n.remind_at).replace('T', ' ')) + '</span>' : '';
    return '<div class="nl-row' + (n.archived ? ' is-arch' : '') + '">' +
      '<button class="nl-text" data-act="note-edit" data-id="' + esc(n.id) + '">' + esc(body.slice(0, 140)) + rem + '</button>' +
      '<span class="nl-acts">' +
        '<button data-act="note-toggle-arch" data-id="' + esc(n.id) + '" title="' + esc(n.archived ? tx('استرجاع', 'Restore') : tx('أرشفة', 'Archive')) + '">' + (n.archived ? '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i>' : '<i class="fa-solid fa-box-archive" aria-hidden="true"></i>') + '</button>' +
        '<button data-act="note-del" data-id="' + esc(n.id) + '" title="' + esc(tx('حذف', 'Delete')) + '"><i class="fa-solid fa-trash"></i></button>' +
      '</span></div>';
  }
  /*@3.DASJ.78*/
  var nlFilter = 'active';
  function setNotesFilter(f) {
    nlFilter = f;
    var box = el('nl-filters');
    if (box) {
      box.querySelectorAll('[data-nl-filter]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-nl-filter') === f);
      });
    }
    refreshNotesListModal();
  }
  function refreshNotesListModal() {
    var box = el('notes-list-body'); if (!box || el('notes-list-modal').hidden) return;
    var byRecent = function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); };
    var arr = loadNotesArr();
    var active = arr.filter(function (n) { return !n.archived; }).sort(byRecent);
    var arch = arr.filter(function (n) { return n.archived; }).sort(byRecent);

    var html = '';
    if (nlFilter === 'arch') {
      html = arch.length ? arch.map(noteRowHtml).join('')
        : '<div class="widget-sub">' + esc(tx('لا ملاحظات مؤرشفة', 'No archived notes')) + '</div>';
    } else {
      html = active.length ? active.map(noteRowHtml).join('')
        : '<div class="widget-sub">' + esc(tx('لا ملاحظات نشطة', 'No active notes')) + '</div>';
      if (nlFilter === 'all' && arch.length) {
        html += '<div class="nl-sep" data-ar="المؤرشفة" data-en="Archived">' + esc(tx('المؤرشفة', 'Archived')) + '</div>' + arch.map(noteRowHtml).join('');
      }
    }
    box.innerHTML = html;
  }
  function openNotesList() {
    var m = el('notes-list-modal'); if (!m) return;
    m.hidden = false; setNotesFilter(nlFilter);
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

  /*@3.DASJ.79*/
  function afterTaskChange() {
    renderTasks();
    renderWidgets();
    if (window.GardenNav && window.GardenNav.updateDueBadge) window.GardenNav.updateDueBadge();
  }

  /*@3.DASJ.80*/

  /*@3.DASJ.81*/
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

  /*@3.DASJ.82*/
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
    /*@3.DASJ.83*/
    if (name !== 'overview' && document.body.classList.contains('dash-customizing')) {
      document.body.classList.remove('dash-customizing');
      if (window.GardenSideOrder) GardenSideOrder.setEdit(false);
      if (window.GardenNav && GardenNav.setArrange) GardenNav.setArrange(false);
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

  /*@3.DASJ.84*/

  function fillSettings() {
    var p = D.profile();
    var pn = window.GardenBiName ? window.GardenBiName.read(p) : { ar: (p && p.name) || '', en: '' };
    if (el('set-name')) el('set-name').value = pn.ar;
    if (el('set-name-en')) el('set-name-en').value = pn.en;
    if (window.GardenBiName && el('set-name') && el('set-name-en') && !el('set-name').dataset.biBound) {
      el('set-name').dataset.biBound = '1';
      window.GardenBiName.attach({ ar: el('set-name'), en: el('set-name-en'), suggest: false });
    }
    if (el('set-level')) el('set-level').value = (p && p.level) || '';
    if (el('set-theme')) el('set-theme').value = localStorage.getItem('garden_theme') || 'dark';
    /*@3.DASJ.85*/
    ['set-name', 'set-name-en'].forEach(function (id) {
      var f = el(id);
      if (f && !f.dataset.autoSave) {
        f.dataset.autoSave = '1';
        f.addEventListener('change', saveSettings);
      }
    });
    fillFontSeg();
    initSetRail();
    fillSyncSection();
    fillLegacySection();
  }

  /*@3.DASJ.86*/
  function initSetRail() {
    var rail = el('dash-set-rail');
    if (!rail || rail.dataset.bound) return;
    rail.dataset.bound = '1';

    function cards() {
      return Array.prototype.slice.call(document.querySelectorAll('.dash-settings .set-card[data-dsec]'));
    }
    function mark(sec) {
      Array.prototype.forEach.call(rail.querySelectorAll('[data-dgo]'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-dgo') === sec);
      });
    }

    rail.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dgo]');
      if (!b) return;
      var sec = b.getAttribute('data-dgo');
      var card = document.querySelector('.dash-settings .set-card[data-dsec="' + sec + '"]');
      if (!card) return;
      mark(sec);
      var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      card.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' });
    });

    /*@3.DASJ.87*/
    var tick = 0;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = requestAnimationFrame(function () {
        tick = 0;
        var view = document.querySelector('.dash-view[data-view="settings"]');
        if (!view || !view.classList.contains('active')) return;
        var best = null, bestD = Infinity, y = window.innerHeight * 0.28;
        cards().forEach(function (c) {
          var d = Math.abs(c.getBoundingClientRect().top - y);
          if (d < bestD) { bestD = d; best = c; }
        });
        if (best) mark(best.getAttribute('data-dsec'));
      });
    }, { passive: true });
  }

  /*@3.DASJ.88*/
  var FS_PREVIEW = { xs: '.85rem', sm: '.92rem', md: '1rem', lg: '1.12rem', xl: '1.26rem' };
  function fillFontSeg() {
    var seg = el('set-font');
    if (!seg || seg.tagName === 'SELECT') return;   /*@3.DASJ.89*/
    var cur = localStorage.getItem('garden_font_size') || 'md';
    if (!FS_PREVIEW[cur]) cur = 'md';
    Array.prototype.forEach.call(seg.querySelectorAll('[data-fs]'), function (b) {
      var on = b.getAttribute('data-fs') === cur;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var sample = el('set-fsample');
    if (sample) sample.style.setProperty('--fs-preview', FS_PREVIEW[cur]);
    if (!seg.dataset.bound) {
      seg.dataset.bound = '1';
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('[data-fs]');
        if (!b) return;
        var v = b.getAttribute('data-fs');
        if (window.Garden && Garden.setFontSize) Garden.setFontSize(v);
        else {
          try { localStorage.setItem('garden_font_size', v); } catch (x) {}
          document.documentElement.setAttribute('data-font-size', v);
        }
        fillFontSeg();
      });
    }
  }

  /*@3.DASJ.90*/
  function fillLegacySection() {
    var box = el('dash-legacy'), acc = el('acc-legacy');
    if (!box || !window.ByteLegacy) return;
    window.ByteLegacy.mount(box, {
      hideHost: acc,
      toast: toast,
      onWipe: function () { syncAccSummaries(); }
    });
    syncAccSummaries();
  }

  /*@3.DASJ.91*/
  function fillSyncSection() {
    var box = el('dash-sync');
    if (!box) return;
    var S = window.GardenSync;
    var key = (S && S.getKey && S.getKey()) || null;
    var dot = el('sync-state-dot'), txt = el('sync-state-text'), last = el('sync-last-text');

    if (!S) {
      if (txt) txt.textContent = tx('غير متاحة على هذه الصفحة', 'Unavailable here');
      return;
    }
    /*@3.DASJ.132*/
    var lk = (S.lockInfo && S.lockInfo()) || null;
    if (key) {
      if (dot) dot.className = 'dash-sync-dot is-on';
      if (txt) txt.textContent = (lk && lk.locked)
        ? tx('محميّة — تحتاج فتحاً على هذا الجهاز', 'Protected — needs unlocking on this device')
        : tx('مفعّلة', 'Enabled');
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
      if (last) last.textContent = '';
    }
  }

  function saveSettings() {
    var p = D.profile() || {};
    /*@3.DASJ.92*/
    var v = window.GardenBiName
      ? window.GardenBiName.resolve(el('set-name') ? el('set-name').value : '',
                                    el('set-name-en') ? el('set-name-en').value : '')
      : null;
    if (v) { p.name = v.name; p.name_ar = v.name_ar; p.name_en = v.name_en; }
    else { p.name = ''; p.name_ar = ''; p.name_en = ''; }
    /*@3.DASJ.93*/
    if (el('set-level')) {
      p.level = el('set-level').value;
      /*@3.DASJ.94*/
      if (p.level) p.levels = [String(p.level)]; else delete p.levels;
    }
    try { localStorage.setItem('student_profile', JSON.stringify(p)); } catch (e) {}
    var th = el('set-theme') ? el('set-theme').value : null;
    if (th) { localStorage.setItem('garden_theme', th); document.documentElement.setAttribute('data-theme', th); }
    /*@3.DASJ.95*/
    var fsEl = el('set-font');
    var fs = (fsEl && fsEl.tagName === 'SELECT') ? fsEl.value : null;
    if (fs) {
      if (fs === 'md') { localStorage.removeItem('garden_font_size'); document.documentElement.removeAttribute('data-font-size'); }
      else { localStorage.setItem('garden_font_size', fs); document.documentElement.setAttribute('data-font-size', fs); }
    }
    renderWidgets();
    toast(tx('حُفظ', 'Saved'));
  }

  /*@3.DASJ.96*/
  var SYNC_TS_PREFIX = '__syncT_';
  function exportData() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(SYNC_TS_PREFIX) === 0) continue;
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
        Object.keys(j.data).forEach(function (k) {
          if (k.indexOf(SYNC_TS_PREFIX) === 0) return;   /*@3.DASJ.97*/
          localStorage.setItem(k, j.data[k]); n++;
        });
        toast(tx('استُورد ' + n + ' مفتاحاً — يُعاد التحميل…', 'Imported ' + n + ' keys — reloading…'));
        setTimeout(function () { location.reload(); }, 900);
      } catch (e) {
        toast(tx('ملف غير صالح', 'Invalid file'));
      }
    };
    r.readAsText(file);
  }

  /*@3.DASJ.98*/
  function toast(msg, actionText, onUndo) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:3000;' +
      'display:flex;align-items:center;gap:.75rem;' +
      'background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:9999px;' +
      'padding:.5rem 1.1rem;font-size:.82rem;font-weight:700;color:var(--text-primary);' +
      'box-shadow:0 8px 24px var(--shadow-base)';
    var label = document.createElement('span');
    label.textContent = msg;
    t.appendChild(label);
    if (actionText && onUndo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = actionText;
      b.style.cssText = 'font:inherit;font-weight:800;color:#a78bfa;background:none;border:0;' +
        'padding:0;cursor:pointer';
      b.addEventListener('click', function () { t.remove(); onUndo(); });
      t.appendChild(b);
    }
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, actionText && onUndo ? 5000 : 2400);
  }

  /*@3.DASJ.99*/

  /*@3.DASJ.100*/

  /*@3.DASJ.101*/

  /*@3.DASJ.102*/
  function cardMainLink(card) { return card && card.querySelector('a[href]'); }
  /*@3.DASJ.103*/
  function widgetMainHref(id) {
    return ({ semester: 'hub/index.html', gpa: 'hub/gpa.html', today: 'hub/schedule.html', due: 'hub/index.html', upcoming: 'hub/schedule.html' })[id] || null;
  }
  /*@3.DASJ.104*/
  function widgetActivate(w) {
    var id = w.getAttribute('data-widget');
    if (id === 'notes') { openNotesList(); return; }        /*@3.DASJ.105*/
    if (id === 'tasks') { showView('tasks'); return; }
    /*@3.DASJ.106*/
    if (id === 'due' && window.GardenDue) { GardenDue.open({}); return; }
    var wl = w.querySelector('.widget-link');
    if (wl) { location.href = wl.getAttribute('href'); return; }
    var href = widgetMainHref(id);
    if (href) location.href = href;
  }
  function onCardNav(e) {
    if (e.target.closest('a, button, input, select, textarea, label')) return;
    var card = e.target.closest('.dash-course-card');
    if (card) { var link = cardMainLink(card); if (link) location.href = link.getAttribute('href'); return; }
    /*@3.DASJ.107*/
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

    /*@3.DASJ.145*/
    if (act === 'today-done') {
      e.preventDefault();
      var tsrc = t.getAttribute('data-src') || '';
      var tid = t.getAttribute('data-id') || '';
      var tcode = t.getAttribute('data-code') || '';
      var tdate = t.getAttribute('data-date') || D.todayStr();
      var ton = t.getAttribute('data-on') !== '0';
      if (tsrc === 'task') { if (D.toggleTask) D.toggleTask(tid); }
      else if (tsrc === 'course') { if (D.toggleCourseDate) D.toggleCourseDate(tcode, tid); }
      else if (window.GardenScheduleRules && GardenScheduleRules.setDone) {
        GardenScheduleRules.setDone({ src: tsrc, id: tid, date: tdate }, ton);
      }
      renderWidgets();
      if (dayIsOpen()) renderDay();
      return;
    }

    if (act === 'day-open') { e.preventDefault(); openDay(); return; }
    if (act === 'day-close') { e.preventDefault(); closeDay(); return; }
    if (act === 'day-scope') {
      e.preventDefault();
      dayScope = (t.getAttribute('data-scope') === 'left') ? 'left' : 'all';
      renderDay();
      return;
    }

    /*@3.DASJ.108*/
    if (act === 'wizard') {
      if (window.GardenFirstRun && GardenFirstRun.launch) GardenFirstRun.launch();
      else location.hash = 'setup';
      return;
    }
    if (act === 'sync-open') { if (window.GardenSync) window.GardenSync.showModal(); return; }
    if (act === 'sync-now') {
      if (window.GardenSync && window.GardenSync.syncNow) {
        window.GardenSync.syncNow();
        toast(tx('جارٍ المزامنة…', 'Syncing…'));
        setTimeout(fillSyncSection, 1500);
      }
      return;
    }
    /*@3.DASJ.133*/
    if (act === 'course-style') { openCourseStyle(id); return; }
    if (act === 'go-hub') location.href = 'hub/index.html';
    else if (act === 'go-gpa') location.href = 'hub/gpa.html';
    else if (act === 'go-schedule') location.href = 'hub/schedule.html';
    else if (act === 'go-settings') showView('settings');
    else if (act === 'w-hide') { prefs.hidden[id] = !prefs.hidden[id]; savePrefs(); renderWidgets(); }
    else if (act === 'w-dismiss') {
      /*@3.DASJ.109*/
      prefs.hidden[id] = true; savePrefs(); renderWidgets();
      toast(tx('أُخفيت البطاقة', 'Card hidden'), tx('تراجع', 'Undo'), function () {
        prefs.hidden[id] = false; savePrefs(); renderWidgets();
      });
    }
    else if (act === 'w-up') moveWidget(id, -1);
    else if (act === 'w-down') moveWidget(id, 1);
    else if (act === 'toggle-cust') {
      var on = document.body.classList.toggle('dash-customizing');
      t.classList.toggle('active', on);
      var bar = el('dash-cust-bar'); if (bar) bar.hidden = !on;
      renderWidgets();
      /*@3.DASJ.141*/
      if (window.GardenSideOrder) GardenSideOrder.setEdit(on);
      if (window.GardenNav && GardenNav.setArrange) GardenNav.setArrange(on);
    }
    else if (act === 'toggle-hide-levels') {
      /*@3.DASJ.110*/
      var hl = document.getElementById('hide-done-levels');
      prefs.hideCompletedLevels = hl ? hl.checked : !prefs.hideCompletedLevels;
      savePrefs();
      renderLevels();
    }
    else if (act === 'toggle-hide-levels-section') {
      /*@3.DASJ.111*/
      var hls = document.getElementById('hide-levels-section');
      prefs.hideLevelsSection = hls ? hls.checked : !prefs.hideLevelsSection;
      savePrefs();
      applyLevelsSectionVis();
    }
    /*@3.DASJ.112*/
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
    /*@3.DASJ.113*/
    else if (act === 'due-open') { if (window.GardenDue) GardenDue.open(id ? { code: id } : {}); }
    else if (act === 'open-onboarding') { location.href = 'hub/gpa.html#setup'; }
    else if (act === 'fab') { el('fab-menu').classList.toggle('open'); }
    else if (act === 'new-task') { el('fab-menu').classList.remove('open'); showView('tasks'); openTaskModal(null); }
    else if (act === 'new-note') { el('fab-menu').classList.remove('open'); openNoteModal(null); }
    /*@3.DASJ.135*/
    else if (act === 'new-course') location.href = 'hub/index.html?add=course';
    else if (act === 'new-event') location.href = 'hub/schedule.html?add=event';
    else if (act === 'new-semester') location.href = 'hub/index.html?add=semester';
    else if (act === 'export') exportData();
    else if (act === 'import') el('import-file').click();
    else if (act === 'save-settings') saveSettings();
    /*@3.DASJ.114*/
    else if (act === 'done-task') { D.toggleTask(id); afterTaskChange(); }
    else if (act === 'add-task') openTaskModal(null);
    else if (act === 'tk-edit') openTaskModal(id);
    else if (act === 'tk-toggle') { D.toggleTask(id); afterTaskChange(); }
    else if (act === 'tk-del') {
      if (confirm(tx('حذف هذه المهمة؟', 'Delete this task?'))) { D.deleteTask(id); afterTaskChange(); }
    }
    else if (act === 'tk-save') saveTask();
    else if (act === 'tk-cancel') closeTaskModal();
    /*@3.DASJ.115*/
    else if (act === 'tk-open') openTaskSheet(id, t.getAttribute('data-src'));
    else if (act === 'sheet-close') closeTaskSheet();
    else if (act === 'sheet-done') {
      if (sheetTask) { D.toggleTask(sheetTask.id); }
      closeTaskSheet(); afterTaskChange();
    }
    else if (act === 'sheet-edit') {
      var sid = sheetTask && sheetTask.id;
      closeTaskSheet();
      if (sid) openTaskModal(sid);
    }
    else if (act === 'sheet-del') {
      if (sheetTask && confirm(tx('حذف هذه المهمة؟', 'Delete this task?'))) {
        D.deleteTask(sheetTask.id); closeTaskSheet(); afterTaskChange();
      }
    }
  }

  /*@3.DASJ.116*/
  function onTaskFilter(e) {
    var b = e.target.closest('.tk-filter');
    if (!b) return;
    tkFilter = b.getAttribute('data-filter');
    /*@3.DASJ.117*/
    e.currentTarget.querySelectorAll('.tk-filter').forEach(function (x) {
      x.classList.toggle('active', x === b);
    });
    renderTasks();
  }

  function onNotesFilter(e) {
    var b = e.target.closest('[data-nl-filter]');
    if (!b) return;
    setNotesFilter(b.getAttribute('data-nl-filter'));
  }

  /*@3.DASJ.118*/

  /*@3.DASJ.119*/

  function init() {
    syncTourPromo();
    loadPrefs();

    D.ready().then(function () {
      return fetch('config/project.json').then(function (r) { return r.json(); }).catch(function () { return null; });
    }).then(function (cfg) {
      _cfg = cfg;
      var hl = el('hide-done-levels'); if (hl) hl.checked = !!prefs.hideCompletedLevels;  /*@3.DASJ.120*/
      var hls = el('hide-levels-section'); if (hls) hls.checked = !!prefs.hideLevelsSection;  /*@3.DASJ.121*/
      applyLevelsSectionVis();
      renderWidgets();
      renderCourses();
      renderLevels();
      updateSidebarBadges();
      buildMobileTabs();
      /*@3.DASJ.122*/
      /*@3.DASJ.134*/
      var hashView = (location.hash || '').replace('#', '');
      var v = hashView || 'overview';
      if (!document.querySelector('.dash-view[data-view="' + v + '"]')) v = 'overview';
      /*@3.DASJ.123*/
      if (!hasVisibleSwitcher(v)) v = 'overview';
      showView(v);
    });

    document.addEventListener('click', onAction);
    document.addEventListener('click', onCardNav);
    document.addEventListener('keydown', onCardKey);
    bindStyleModal();
    bindSettingsAcc();

    document.querySelectorAll('.dash-side-item[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
    });

    window.addEventListener('pageshow', syncTourPromo);
    window.addEventListener('storage', function (e) {
      if (e.key === LS_TOUR_SEEN) syncTourPromo();
    });

    var tf = el('tk-filters');
    if (tf) tf.addEventListener('click', onTaskFilter);
    var nf = el('nl-filters');
    if (nf) nf.addEventListener('click', onNotesFilter);

    /*@3.DASJ.124*/
    window.addEventListener('garden:notesMigrated', function () {
      renderWidgets(); renderTasks(); refreshNotesListModal();
    });
    var tg = el('tk-group');
    if (tg) tg.addEventListener('change', function () { tkGroup = tg.checked; renderTasks(); });

    /*@3.DASJ.125*/
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      /*@3.DASJ.126*/
      var m = el('tk-modal'); if (m && !m.hidden) { e.preventDefault(); closeTaskModal(); return; }
      var sh = el('tk-sheet'); if (sh && !sh.hidden) { e.preventDefault(); closeTaskSheet(); return; }
      var nm = el('note-modal'); if (nm && !nm.hidden) { e.preventDefault(); closeNoteModal(); return; }
      var nl = el('notes-list-modal'); if (nl && !nl.hidden) { e.preventDefault(); closeNotesList(); return; }
      var dm = el('day-modal'); if (dm && !dm.hidden) { e.preventDefault(); closeDay(); return; }
    });
    /*@3.DASJ.127*/
    var tm = el('tk-modal');
    if (tm) tm.addEventListener('click', function (e) { if (e.target === tm) closeTaskModal(); });
    var tsh = el('tk-sheet');
    if (tsh) tsh.addEventListener('click', function (e) { if (e.target === tsh) closeTaskSheet(); });
    var nmod = el('note-modal');
    if (nmod) nmod.addEventListener('click', function (e) { if (e.target === nmod) closeNoteModal(); });
    var nlmod = el('notes-list-modal');
    if (nlmod) nlmod.addEventListener('click', function (e) { if (e.target === nlmod) closeNotesList(); });
    var dmod = el('day-modal');
    if (dmod) dmod.addEventListener('click', function (e) { if (e.target === dmod) closeDay(); });

    /*@3.DASJ.128*/

    var imp = el('import-file');
    if (imp) imp.addEventListener('change', function () { if (imp.files[0]) importData(imp.files[0]); });

    /*@3.DASJ.142*/
    document.addEventListener('click', function (e) {
      var m = el('fab-menu');
      if (!m || !m.classList.contains('open')) return;
      if (e.target.closest && (e.target.closest('#fab-menu') || e.target.closest('[data-act="fab"]'))) return;
      m.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var m = el('fab-menu');
      if (m) m.classList.remove('open');
    });

    document.addEventListener('garden:languageChanged', function () {
      renderWidgets(); renderCourses(); renderLevels(); renderTasks();
      /*@3.DASJ.129*/
      fillSyncSection();
      applyTitles();
    });
    /*@3.DASJ.130*/
    document.addEventListener('garden:cardsReviewed', function () {
      renderWidgets(); renderCourses(); updateSidebarBadges();
    });
    applyTitles();
  }

  /*@3.DASJ.131*/
  function applyTitles() {
    document.querySelectorAll('[data-title-ar]').forEach(function (el2) {
      var t = isAr() ? el2.getAttribute('data-title-ar') : el2.getAttribute('data-title-en');
      if (t) { el2.setAttribute('title', t); el2.setAttribute('aria-label', t); }
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
