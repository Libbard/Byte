/*@3.COUJ.1*/

;(function () {
  'use strict';

  var CODE = (new URLSearchParams(location.search).get('code') || '').toUpperCase();

  var S = {
    info: null, meta: null, stats: null, sched: null,
    pred: null, sec: null, facultyReady: false, hist: null
  };

  /*@3.COUJ.2*/

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  /*@3.COUJ.3*/
  function on(id, ev, fn) { var n = el(id); if (n) n.addEventListener(ev, fn); return !!n; }
  function uid(p) { return p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

  var toastT = 0;
  function toast(msg) {
    var t = el('crs-toast'); if (!t) return;
    t.querySelector('span').textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /*@3.COUJ.4*/
  function nOf(n, arForms, enForms, masc) {
    if (isAr() && masc && n === 1) return arForms[0] + ' واحد';
    if (window.Garden && Garden.smartCount) return Garden.smartCount(n, arForms, enForms);
    return n + ' ' + (isAr() ? arForms[2] : enForms[1]);
  }

  function pct(v) { return Math.round(Math.max(0, Math.min(1, v || 0)) * 100); }
  function pctTxt(v) { return pct(v) + (isAr() ? '٪' : '%'); }

  /*@3.COUJ.5*/
  function dstr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }
  function hhmm(t) {
    if (!t) return '';
    var p = String(t).split(':');
    return p.length >= 2 ? p[0].padStart(2, '0') + ':' + p[1] : String(t);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (isNaN(d)) return String(iso);
    return new Intl.DateTimeFormat(isAr() ? 'ar-SA-u-ca-gregory' : 'en',
      { day: 'numeric', month: 'short' }).format(d);
  }
  function relWord(days) {
    if (days === null || days === undefined) return '';
    if (days < 0) return L('مضى', 'Passed');
    if (days === 0) return L('اليوم', 'Today');
    if (days === 1) return L('غداً', 'Tomorrow');
    var w = nOf(days, ['يوم', 'يومان', 'أيام'], ['day', 'days'], true);
    return L('بعد ' + w, 'in ' + w);
  }
  function relTone(days) {
    if (days === null || days === undefined) return '';
    if (days < 0) return 'bad';
    if (days <= 2) return 'bad';
    if (days <= 7) return 'mid';
    return '';
  }
  function rateTone(v) {
    if (v == null) return '';
    if (v >= 80) return 'ok';
    if (v >= 55) return 'mid';
    return 'bad';
  }

  var DAY_AR = { sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
                 wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
  var DAY_EN = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
                 wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

  function typeLabel(t) {
    var m = {
      final: L('نهائي', 'Final'), midterm: L('نصفي', 'Midterm'),
      quiz: L('كويز', 'Quiz'), exam: L('اختبار', 'Exam'),
      assignment: L('تسليم', 'Assignment'), project: L('مشروع', 'Project'),
      reading: L('قراءة', 'Reading'), other: L('أخرى', 'Other')
    };
    return m[t] || t;
  }

  /*@3.COUJ.6*/
  function row(icon, main, sub, tail, empty) {
    return '<div class="crs-r' + (empty ? ' is-empty' : '') + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span class="crs-r-b"><span class="crs-r-t">' + main + '</span>' +
      (sub ? '<span class="crs-r-s">' + sub + '</span>' : '') + '</span>' +
      (tail ? '<span class="crs-r-e">' + tail + '</span>' : '') +
    '</div>';
  }
  function empty(icon, text) {
    return '<div class="crs-empty"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
           '<p>' + esc(text) + '</p></div>';
  }

  /*@3.COUJ.7*/

  /*@3.COUJ.8*/
  function courseName() {
    var e = semEntry() || {};
    return isAr()
      ? ((S.info && S.info.name_ar) || e.name_ar || e.name_en || CODE)
      : ((S.info && S.info.name_en) || e.name_en || e.name_ar || CODE);
  }
  function courseCredits() {
    var e = semEntry() || {};
    if (S.info && S.info.credits != null) return S.info.credits;
    return e.credits != null ? e.credits : null;
  }
  /*@3.COUJ.9*/
  function shownCode() { return GardenData.isRealCourse(CODE) ? CODE : ''; }

  /*@3.COUJ.10*/
  function semEntry() {
    var sem = GardenData.semester();
    var list = (sem && sem.courses) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].code === CODE) return list[i];
    }
    return null;
  }

  function renderHead() {
    var e = semEntry();
    /*@3.COUJ.11*/
    var color = GardenData.courseColor(CODE, e);
    var name = courseName();

    document.title = name + ' · ' + L('الحديقة الرقمية', 'Digital Garden');
    if (window.GardenHeader && GardenHeader.setTitle) GardenHeader.setTitle(CODE, CODE);
    /*@3.COUJ.12*/
    if (color) document.documentElement.style.setProperty('--course-color', color);
    /*@3.COUJ.13*/
    var cb = el('crs-color-btn');
    if (cb) cb.style.setProperty('--crs-sw', color);

    var sc = shownCode();
    el('crs-code').textContent = sc;
    el('crs-code').hidden = !sc;
    el('crs-name').textContent = name;

    var bits = [];
    var cr = courseCredits();
    if (cr) {
      bits.push('<b>' + esc(nOf(cr, ['ساعة', 'ساعتان', 'ساعات'], ['credit', 'credits'])) + '</b>');
    }
    if (!sc) {
      bits.push('<span class="crs-badge">' + esc(L('مادةٌ أضفتَها بنفسك', 'A course you added')) + '</span>');
    }
    if (S.info && S.info.modules) {
      bits.push(esc(nOf(S.info.modules, ['وحدة', 'وحدتان', 'وحدات'], ['module', 'modules'])));
    }
    if (S.info && (S.info.level_name_ar || S.info.level)) {
      bits.push(esc(isAr() ? (S.info.level_name_ar || S.info.level)
                           : (S.info.level_name_en || S.info.level)));
    }
    var alt = isAr() ? (S.info && S.info.name_en) : (S.info && S.info.name_ar);
    if (alt && alt !== name) bits.push('<span class="ltr">' + esc(alt) + '</span>');
    if (e && GardenData.courseDone(e)) {
      bits.push('<span class="crs-badge" data-tone="ok">' + esc(L('منتهية', 'Completed')) + '</span>');
    } else if (e) {
      bits.push('<span class="crs-badge">' + esc(L('في فصلك الحالي', 'In your semester')) + '</span>');
    }
    el('crs-meta').innerHTML = bits.join('<span aria-hidden="true">·</span>');

    var study = el('crs-study');
    if (S.info && S.info.path) {
      study.href = '../' + S.info.path + 'index.html';
      study.hidden = false;
    } else {
      study.hidden = true;
    }
    el('crs-head').hidden = false;
  }

  /*@3.COUJ.14*/
  function stat(k, v, sub, fill, href, act) {
    var body =
      '<span class="crs-stat-k">' + esc(k) + '</span>' +
      '<span class="crs-stat-v">' + v + (sub ? ' <small>' + esc(sub) + '</small>' : '') + '</span>' +
      (fill != null ? '<span class="crs-bar" style="--fill:' + esc(fill.color) + '">' +
        '<i style="inline-size:' + fill.w + '%"></i></span>' : '');
    if (act) return '<button class="crs-stat" type="button" data-act="' + esc(act) + '">' + body + '</button>';
    return href
      ? '<a class="crs-stat" href="' + esc(href) + '">' + body + '</a>'
      : '<div class="crs-stat">' + body + '</div>';
  }

  function renderStats() {
    var e = semEntry();
    var p = e ? GardenData.coursePercent(e) : (S.stats.totalQuizzes
      ? Math.round(S.stats.quizzesDone / S.stats.totalQuizzes * 100) : 0);
    /*@3.COUJ.15*/
    var due = GardenData.courseIsActive(CODE) ? GardenData.dueCards(CODE) : 0;
    var h = '';

    h += stat(L('التقدّم', 'Progress'), pct(p / 100) + (isAr() ? '٪' : '%'), '',
      { w: pct(p / 100), color: GardenData.qualityColor01(p / 100) });

    h += stat(L('بطاقاتٌ متقنة', 'Mastered cards'), String(S.stats.mastered), '',
      null);

    h += stat(L('مستحقّةٌ اليوم', 'Due today'), String(due),
      due ? L('اضغط لمراجعتها', 'tap to review') : L('لا شيء', 'none'), null,
      null, due ? 'due' : null);

    h += stat(L('اختباراتٌ خضتَها', 'Quizzes taken'),
      String(S.stats.quizzesDone), L('من ' + S.stats.totalQuizzes, 'of ' + S.stats.totalQuizzes),
      /*@3.COUJ.16*/
      { w: S.stats.totalQuizzes ? Math.round(S.stats.quizzesDone / S.stats.totalQuizzes * 100) : 0,
        color: 'var(--crs-c)' });

    /*@3.COUJ.17*/
    var g = e && e.grade;
    h += stat(L('درجتُك', 'Your grade'), g ? '<span class="ltr">' + esc(g) + '</span>' : '—',
      L('تُعدَّل في المعدل', 'edit in GPA'), null, 'gpa.html');

    var box = el('crs-stats');
    box.innerHTML = h;
    box.hidden = false;
  }

  function quick(href, icon, ar, en) {
    return '<a class="crs-q" href="' + esc(href) + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + esc(L(ar, en)) + '</span></a>';
  }

  function renderQuick() {
    var box = el('crs-quick');
    if (!S.info || !S.info.path) { box.hidden = true; return; }
    var b = '../' + S.info.path;
    box.innerHTML =
      quick(b + 'index.html', 'fa-book', 'الوحدات', 'Modules') +
      quick(b + 'midterm-review.html', 'fa-list-check', 'مراجعة النصفي', 'Midterm review') +
      quick(b + 'midterm-quiz.html', 'fa-circle-question', 'كويز النصفي', 'Midterm quiz') +
      quick(b + 'final-review.html', 'fa-list-check', 'مراجعة النهائي', 'Final review') +
      quick(b + 'final-quiz.html', 'fa-circle-question', 'كويز النهائي', 'Final quiz') +
      quick('schedule.html', 'fa-calendar-week', 'الجدول', 'Schedule') +
      quick('index.html', 'fa-graduation-cap', 'فصلي', 'My Semester');
    box.hidden = false;
  }

  /*@3.COUJ.18*/

  function renderToday() {
    var host = el('crs-today');
    if (!GardenData.isRealCourse(CODE) || !S.info) {
      host.innerHTML = empty('fa-box-open',
        L('هذه مادةٌ خارجيةٌ لا محتوى لها عندنا — تبقى مواعيدُها وملاحظاتُها ودرجتُها.',
          'This is an external course with no content here — its dates, notes and grade still work.'));
      el('crs-today-a').innerHTML = '';
      return;
    }

    var total = GardenData.moduleCount(CODE);
    var due = GardenData.courseIsActive(CODE) ? GardenData.dueCards(CODE) : 0;
    var now = Date.now();

    /*@3.COUJ.19*/
    var best = null;
    GardenData.allDeadlines().forEach(function (d) {
      if (d.done || d.course !== CODE || !d.due) return;
      var days = GardenData.daysUntil(d.due);
      if (days === null || days < 0) return;
      if (!best || days < best.days) {
        var title = d.title;
        if (!title && d.source === 'exam') title = typeLabel(d.type);
        best = { days: days, title: title || L('موعد', 'Deadline'), type: d.type };
      }
    });

    var h = '';
    h += row('fa-layer-group',
      esc(due ? nOf(due, ['بطاقة مستحقّة', 'بطاقتان مستحقّتان', 'بطاقات مستحقّة'],
                         ['card due', 'cards due'])
              : L('لا بطاقةَ مستحقّةً اليوم', 'No cards due today')),
      esc(due ? L('مراجعتُها اليوم تُثبّتها — والتأجيلُ يضاعفها غداً',
                  'Review them today — postponing doubles them tomorrow')
              : L('عُد غداً، أو ابدأ وحدةً جديدة', 'Come back tomorrow, or start a new module')),
      due
        ? '<button class="crs-btn crs-btn--primary" type="button" data-act="due">' +
          '<i class="fa-solid fa-play" aria-hidden="true"></i><span>' +
          esc(L('راجع الآن', 'Review now')) + '</span></button>'
        : '', !due);

    h += row('fa-hourglass-half',
      esc(best ? best.title : L('لا موعدَ قادماً', 'Nothing coming up')),
      esc(best ? typeLabel(best.type) : L('أضِف موعداً من قسم المواعيد', 'Add one from the dates section')),
      best ? '<span class="crs-badge"' + (relTone(best.days) ? ' data-tone="' + relTone(best.days) + '"' : '') +
             '>' + esc(relWord(best.days)) + '</span>' : '', !best);

    /*@3.COUJ.20*/
    var mods = '';
    for (var m = 1; m <= total; m++) {
      var cards = GardenData.moduleCards(CODE, m);
      var d = 0;
      cards.forEach(function (c) { if (c.nextReview && c.nextReview <= now) d++; });
      var q = null;
      try {
        var raw = localStorage.getItem('garden_' + CODE + '_m' + m + '_quiz');
        if (raw != null && raw !== '') q = Math.max(0, Math.min(1, parseFloat(raw) / 10));
      } catch (err) {}
      var href = S.info.path ? '../' + S.info.path + 'M' + String(m).padStart(2, '0') + '.html' : '#';
      mods += '<a class="crs-mod" href="' + esc(href) + '"' + (d ? ' data-due="1"' : '') +
          ' title="' + esc(L('الوحدة ' + m, 'Module ' + m)) + '">' +
        '<span class="crs-mod-n">M' + String(m).padStart(2, '0') + '</span>' +
        '<span class="crs-mod-d">' + (d ? esc(L(d + ' مستحقّة', d + ' due'))
                                        : (q == null ? '—' : pctTxt(q))) + '</span>' +
        '<span class="crs-mod-b" style="--fill:' +
          (q == null ? 'var(--border-color)' : esc(GardenData.qualityColor01(q))) + '">' +
          '<i style="inline-size:' + (q == null ? 0 : pct(q)) + '%"></i></span>' +
      '</a>';
    }
    h += '<div class="crs-sec-d" style="margin:.9rem 0 .5rem">' +
      esc(L('وحداتُ المادة — الرقمُ درجةُ كويزها، والمصبوغُ فيه بطاقاتٌ تنتظرك.',
            'Course modules — the number is the quiz score; tinted ones have cards waiting.')) + '</div>';
    h += '<div class="crs-mods">' + mods + '</div>';

    host.innerHTML = h;
    el('crs-today-a').innerHTML = due
      ? '<span class="crs-badge" data-tone="mid">' + esc(String(due)) + '</span>' : '';
  }

  /*@3.COUJ.21*/

  function evLabel(kind) {
    if (kind === 'midterm') return L('الاختبار النصفي', 'Midterm');
    if (kind === 'final') return L('الاختبار النهائي', 'Final');
    if (kind === 'cards') return L('بطاقاتُك (استبقاء)', 'Your cards (retention)');
    return L('الوحدة ' + kind, 'Module ' + kind);
  }

  function renderPredict() {
    var host = el('crs-predict');
    if (!GardenData.isRealCourse(CODE)) {
      host.innerHTML = empty('fa-box-open',
        L('المادةُ الخارجيةُ لا اختباراتِ لها عندنا، فلا شيءَ يُقاس.',
          'External courses have no quizzes here, so there is nothing to measure.'));
      return;
    }

    var p = S.pred = GardenData.coursePrediction(CODE);

    if (p.state === 'none') {
      host.innerHTML = empty('fa-flask',
        L('لم تخض اختباراً في هذه المادة بعد. اخضع لكويز وحدةٍ واحدةٍ ويبدأ القياس — ولن نتوقّع لك شيئاً من لا شيء.',
          'You haven’t taken any quiz in this course yet. Take one module quiz and measurement begins — we won’t predict from nothing.')) +
        (S.info && S.info.path
          ? '<div style="display:flex;justify-content:center"><a class="crs-btn crs-btn--primary" href="../' +
            esc(S.info.path) + 'M01.html"><i class="fa-solid fa-play" aria-hidden="true"></i><span>' +
            esc(L('ابدأ بالوحدة الأولى', 'Start with module 1')) + '</span></a></div>'
          : '');
      return;
    }

    var col = GardenData.qualityColor01(p.level);
    var ready = p.state === 'ready';
    var passPct = pct(p.pass);

    /*@3.COUJ.22*/
    var lo = pct(p.lo), hi = pct(p.hi), lv = pct(p.level), th = pct(p.threshold);

    var h = '<div class="crs-pred" style="--pred:' + esc(col) + '">';

    h += '<div class="crs-pred-box">' +
      '<div class="crs-pred-k">' + esc(L('مستواك المقيس', 'Your measured level')) + '</div>' +
      '<div class="crs-pred-v">' + lv + '<small>' + (isAr() ? '٪' : '%') + '</small></div>' +
      '<div class="crs-pred-g">' + esc(p.grade) + '</div>' +
      '<div class="crs-range" aria-hidden="true">' +
        '<i style="inset-inline-start:' + lo + '%;inline-size:' + Math.max(1, hi - lo) + '%"></i>' +
        '<b style="inset-inline-start:calc(' + lv + '% - 1px)"></b>' +
        '<u style="inset-inline-start:' + th + '%"></u>' +
      '</div>' +
      '<div class="crs-pred-rng">' + esc(L('المجال ', 'Range ')) +
        '<span class="ltr">' + lo + '–' + hi + (isAr() ? '٪' : '%') + '</span>' +
        ' · ' + esc(L('عتبةُ النجاح ', 'pass mark ')) + th + (isAr() ? '٪' : '%') +
      '</div>' +
    '</div>';

    h += '<div>';

    /*@3.COUJ.23*/
    var tone, verdict;
    if (!ready) {
      tone = 'var(--text-muted)';
      /*@3.COUJ.24*/
      var aW = nOf(p.attempts, ['محاولة', 'محاولتان', 'محاولات'], ['attempt', 'attempts']);
      var mW = nOf(p.covered, ['وحدة', 'وحدتان', 'وحدات'], ['module', 'modules']);
      verdict = '<b>' + esc(L('لا يكفي بعد.', 'Not enough yet.')) + '</b> ' +
        esc(L('ما قِسناه قليلٌ — ' + aW + ' في ' + mW + '، ' +
              'ورقمٌ من عيّنةٍ صغيرةٍ يخدعُك أكثرَ ممّا يفيدك. اخضع لكويزين آخرين ويصير الحكمُ ذا معنى.',
              'We’ve measured little — ' + aW + ' across ' + mW + ', ' +
              'and a number from a small sample misleads more than it helps. Two more quizzes and this becomes meaningful.'));
    } else if (passPct >= 85) {
      tone = 'var(--st-ok, #10b981)';
      verdict = '<b>' + esc(L('أنت في المنطقة الآمنة.', 'You’re in the safe zone.')) + '</b> ' +
        esc(L('احتمالُ نجاحك ' + passPct + '٪ على ما قِسناه، والتقديرُ المتوقّع ' + p.grade + '. ' +
              'الوحداتُ التي لم تختبرها بعدُ هي ما يبقى مجهولاً.',
              'Your pass likelihood is ' + passPct + '% on what we measured, expected grade ' + p.grade + '. ' +
              'What remains unknown are the modules you haven’t tested.'));
    } else if (passPct >= 60) {
      tone = 'var(--st-warn, #f59e0b)';
      verdict = '<b>' + esc(L('تمرّ — بهامشٍ ضيّق.', 'You pass — narrowly.')) + '</b> ' +
        esc(L('احتمالُ نجاحك ' + passPct + '٪، وحدُّ المجال الأدنى ' + lo + '٪ يقع تحت عتبة النجاح. ' +
              'أضعفُ وحداتِك أدناه — ابدأ بها.',
              'Pass likelihood ' + passPct + '%, and the low end of the range (' + lo + '%) sits under the pass mark. ' +
              'Your weakest modules are listed below — start there.'));
    } else {
      tone = 'var(--st-danger, #ef4444)';
      verdict = '<b>' + esc(L('الخطرُ حقيقيّ.', 'The risk is real.')) + '</b> ' +
        esc(L('احتمالُ نجاحك ' + passPct + '٪ على ما قِسناه. ' +
              'هذا ليس حكماً نهائياً — هو قياسُ اليوم، وأضعفُ وحداتِك أدناه.',
              'Pass likelihood ' + passPct + '% on what we measured. ' +
              'This is not a verdict — it is today’s measurement, and your weakest modules are below.'));
    }
    if (p.trend != null && Math.abs(p.trend) >= 0.05) {
      verdict += ' ' + esc(p.trend > 0
        ? L('واتجاهُك صاعد: محاولاتُك الأخيرةُ أعلى من أولاها بـ' + Math.round(p.trend * 100) + ' نقطة.',
            'And you’re trending up: your latest attempts beat your first by ' + Math.round(p.trend * 100) + ' points.')
        : L('واتجاهُك هابط: محاولاتُك الأخيرةُ أدنى من أولاها بـ' + Math.round(Math.abs(p.trend) * 100) + ' نقطة.',
            'And you’re trending down: your latest attempts fall below your first by ' + Math.round(Math.abs(p.trend) * 100) + ' points.'));
    }
    h += '<div class="crs-verdict" style="--tone:' + tone + '">' +
      '<i class="fa-solid fa-lightbulb" aria-hidden="true"></i><div>' + verdict + '</div></div>';

    /*@3.COUJ.25*/
    var rows = p.rows.slice().sort(function (a, b) { return a.score - b.score; });
    h += '<div class="crs-ev-wrap" style="margin-top:.8rem"><table class="crs-ev">' +
      '<thead><tr>' +
        '<th>' + esc(L('ما قِسناه', 'What we measured')) + '</th>' +
        '<th>' + esc(L('نتيجتُك', 'Your score')) + '</th>' +
        '<th>' + esc(L('المحاولات', 'Attempts')) + '</th>' +
        '<th>' + esc(L('من أوّلٍ إلى آخر', 'First → last')) + '</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var tr = r.trend;
      h += '<tr>' +
        '<td class="crs-ev-n">' + esc(evLabel(r.kind)) +
          (r.legacy ? ' <span class="crs-ev-w">' + esc(L('(محفوظٌ قديماً)', '(legacy)')) + '</span>' : '') +
          '<div class="crs-ev-w">' + esc(L('وزنُه ', 'weight ')) + r.weight + '</div></td>' +
        '<td style="color:' + esc(GardenData.qualityColor01(r.score)) + ';font-weight:800">' +
          pctTxt(r.score) + '</td>' +
        '<td>' + (r.kind === 'cards'
          ? '<span class="crs-ev-w">' + esc(r.cards.mastered + '/' + r.cards.total) + '</span>'
          : r.attempts) + '</td>' +
        /*@3.COUJ.26*/
        '<td>' + (tr == null ? '<span class="crs-ev-w">—</span>'
          : '<span class="ltr ' + (tr > 0 ? 'crs-ev-up' : tr < 0 ? 'crs-ev-dn' : '') + '">' +
            pctTxt(r.first) + ' → ' + pctTxt(r.last) + '</span>') + '</td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    /*@3.COUJ.27*/
    h += '<details style="margin-top:.8rem">' +
      '<summary class="crs-sec-d" style="cursor:pointer">' +
        esc(L('كيف حُسب هذا الرقم؟', 'How is this computed?')) + '</summary>' +
      '<p class="crs-sec-d" style="line-height:1.9;margin-top:.5rem">' +
        esc(L('كلُّ اختبارٍ يُوزن بحصّته (كويزُ وحدةٍ ١ · النصفيُّ ٢٫٥ · النهائيُّ ٣ · بطاقاتُك ٢)، ' +
              'وداخلَ الاختبار الواحد تُوزن **آخرُ محاولةٍ كاملةً وما قبلها نصفاً ثم ربعاً** — ' +
              'ولذلك يعلو الصاعدُ على الهابط رغم تساوي متوسّطهما. ثم يُقلَّص الناتجُ نحو عتبة النجاح ' +
              'بمقدارِ ما نجهله: كلّما قلَّ ما قِسناه اقترب الرقمُ من المنتصف واتّسع مجالُه.',
              'Each test is weighted by its share (module quiz 1 · midterm 2.5 · final 3 · your cards 2), ' +
              'and within a test the **latest attempt counts fully, the one before it half, then a quarter** — ' +
              'which is why a rising history beats a falling one with the same average. The result is then shrunk ' +
              'toward the pass mark in proportion to what we don’t know: the less measured, the closer to the middle and the wider the range.')) +
      '</p>' +
      /*@3.COUJ.28*/
      '<p class="crs-sec-d" style="line-height:1.9">' + '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ' +
        esc(L('ويُفترض فيه أمران معلنان: عتبةُ النجاح ٦٠٪ (تقدير D)، وأن اختبار الوحدة عشرةُ أسئلة — ' +
              'وهذا مقيسٌ لا مُخمَّن (٤٧٠ وحدةً في الموقع كلُّها عشرة). ' +
              'ولا يعرف هذا الحسابُ درجاتِ أعمالك في البلاك بورد، فهو قياسُ استعدادك لا كشفُ درجاتك.',
              'Two stated assumptions: a 60% pass mark (grade D), and 10 questions per module quiz — ' +
              'which is measured, not guessed (all 470 modules on the site have 10). ' +
              'It does not know your Blackboard coursework marks: it measures your readiness, not your official grade.')) +
      '</p>' +
    '</details>';

    h += '</div></div>';
    host.innerHTML = h;
  }

  /*@3.COUJ.29*/

  function instructor() {
    var ins = (S.meta.instructors || [])[0];
    return (ins && (ins.name || ins.email)) ? ins : null;
  }

  function facultyOf(ins) {
    if (!ins || !S.facultyReady || !window.GardenFaculty) return null;
    return (ins.email && GardenFaculty.byEmail(ins.email)) ||
           (ins.faculty_id && GardenFaculty.byId(ins.faculty_id)) ||
           GardenFaculty.byBannerName(ins.name) || null;
  }

  function renderProf() {
    var host = el('crs-prof');
    var ins = instructor();
    el('crs-prof-a').innerHTML =
      '<button class="crs-btn" type="button" data-act="ins-pick">' +
        '<i class="fa-solid fa-' + (ins ? 'right-left' : 'plus') + '" aria-hidden="true"></i><span>' +
        esc(ins ? L('غيّره', 'Change') : L('اختر الدكتور', 'Pick instructor')) + '</span></button>';

    if (!ins) {
      host.innerHTML = empty('fa-chalkboard-user',
        L('لم تُحدِّد دكتورَ المادة بعد. اختره من قائمة الأساتذة فيصلك بريدُه ومؤشّرُ تقييم زملائك له.',
          'No instructor yet. Pick one from the faculty list to get their email and your peers’ rating index.'));
      return;
    }

    var f = facultyOf(ins);
    var h = '';

    h += row('fa-user',
      esc(ins.name || L('بلا اسم', 'Unnamed')),
      f ? esc(L('من قائمة الأساتذة', 'from the faculty list'))
        : esc(L('اسمٌ كتبتَه بنفسك — لا تقييمَ له عندنا', 'a name you typed — no rating on file')),
      f && f.idx != null
        ? '<button class="crs-rate" type="button" data-act="fac" data-tone="' + rateTone(f.idx) + '" ' +
          'title="' + esc(L('افتح بطاقةَ تقييمه', 'Open the rating card')) + '">' +
          '<b>' + Math.round(f.idx) + '%</b><small>(' + (f.n || 0) + ')</small></button>'
        : '');

    /*@3.COUJ.30*/
    h += row('fa-envelope',
      ins.email
        ? '<a class="ltr" href="mailto:' + esc(ins.email) + '" style="color:var(--crs-c);text-decoration:none">' +
          esc(ins.email) + '</a>'
        : esc(L('بلا بريد', 'No email')),
      esc(L('بريدُ الدكتور', 'Instructor email')),
      ins.email
        ? '<button class="crs-ico" type="button" data-act="copy" data-val="' + esc(ins.email) + '" ' +
          'aria-label="' + esc(L('نسخ', 'Copy')) + '" title="' + esc(L('نسخ', 'Copy')) + '">' +
          '<i class="fa-solid fa-copy" aria-hidden="true"></i></button>'
        : '', !ins.email);

    /*@3.COUJ.31*/
    [['office_hours', 'fa-clock', 'الساعات المكتبية', 'Office hours', 'مثال: الأحد والثلاثاء ١٠–١٢', 'e.g. Sun & Tue 10–12'],
     ['location', 'fa-location-dot', 'المكتب / القاعة', 'Office / room', 'مثال: مبنى ٣ · مكتب ٢١٤', 'e.g. Bldg 3 · office 214'],
     ['note', 'fa-note-sticky', 'ملاحظةٌ عنه', 'A note about them', 'يقبل التسليم متأخراً؟ يحبّ الأسئلة؟', 'Accepts late work? Likes questions?']
    ].forEach(function (fd) {
      var v = ins[fd[0]] || '';
      h += '<div class="crs-r' + (v ? '' : ' is-empty') + '">' +
        '<i class="fa-solid ' + fd[1] + '" aria-hidden="true"></i>' +
        '<span class="crs-r-b">' +
          '<input class="crs-in" data-ins-f="' + fd[0] + '" value="' + esc(v) + '" ' +
            'aria-label="' + esc(L(fd[2], fd[3])) + '" ' +
            'placeholder="' + esc(L(fd[4], fd[5])) + '" ' +
            'style="border:0;background:none;padding:.2rem 0;font-weight:700">' +
        '</span></div>';
    });

    h += '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.8rem">' +
      '<button class="crs-btn crs-btn--danger" type="button" data-act="ins-clear">' +
        '<i class="fa-solid fa-user-slash" aria-hidden="true"></i><span>' +
        esc(L('أزِل الدكتور', 'Remove instructor')) + '</span></button>' +
      (f ? '<a class="crs-btn" href="faculty.html#' + encodeURIComponent(f.id) + '">' +
        '<i class="fa-solid fa-star" aria-hidden="true"></i><span>' +
        esc(L('صفحتُه في التقييمات', 'Their ratings page')) + '</span></a>' : '') +
    '</div>';

    host.innerHTML = h;
  }

  function openFaculty() {
    var f = facultyOf(instructor());
    if (!f || !window.GardenFaculty) return;
    el('dlg-fac-t').textContent = GardenFaculty.nameOf(f);
    el('dlg-fac-b').innerHTML = GardenFaculty.detailHtml(f, { base: '', full: 'faculty.html#' + encodeURIComponent(f.id) });
    GardenFaculty.wire(el('dlg-fac-b'), { onSent: function () { el('dlg-fac').close(); } });
    el('dlg-fac').showModal();
  }

  /*@3.COUJ.58*/
  function openFacRate(id) {
    var GF = window.GardenFaculty;
    if (!GF) return;
    var f = GF.byId(id);
    GF.resetVals();
    el('dlg-fac-t').textContent = f
      ? L('قيّم ', 'Rate ') + GF.nameOf(f)
      : L('قيّم أستاذاً', 'Rate an instructor');
    el('dlg-fac-b').innerHTML = GF.rateHtml(f, { course: CODE });
  }

  /*@3.COUJ.32*/

  /*@3.COUJ.33*/
  function sectionOf() {
    var rows = (S.sched.lectures || []).filter(function (x) {
      return x && x.course_code === CODE;
    });
    if (!rows.length) return null;
    var days = [], crn = null, room = '', remote = false, someInPerson = false;
    rows.forEach(function (r) {
      if (days.indexOf(r.day) === -1) days.push(r.day);
      if (!crn && r.sx_crn) crn = r.sx_crn;
      if (!room && r.room) room = r.room;
      if (r.attendance === 'remote') remote = true; else someInPerson = true;
    });
    var order = GardenData.DAYS_ORDER;
    days.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return {
      crn: crn, room: room, remote: remote, mixed: remote && someInPerson,
      days: days, time: hhmm(rows[0].start_time), end: hhmm(rows[0].end_time),
      label: days.map(function (d) { return isAr() ? DAY_AR[d] : DAY_EN[d]; })
                 .join(isAr() ? '، ' : ', ')
    };
  }

  function renderSection() {
    var host = el('crs-section');
    var s = S.sec = sectionOf();
    el('crs-sec-a').innerHTML = '';

    if (!s) {
      host.innerHTML = empty('fa-id-card',
        L('لا شعبةَ لهذه المادة في جدولك. أضِفها من صفحة الشعب فتصلك مواعيدُها ومواعيدُ اختباراتها من بانر.',
          'No section for this course in your schedule. Add it from the Sections page to get its times and Banner exam dates.')) +
        '<div style="display:flex;justify-content:center"><a class="crs-btn crs-btn--primary" href="sections.html">' +
        '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>' +
        esc(L('ابحث في الشعب', 'Browse sections')) + '</span></a></div>';
      return;
    }

    var h = '';
    h += row('fa-hashtag',
      s.crn ? '<span class="ltr">' + esc(s.crn) + '</span>' : esc(L('بلا رقم شعبة', 'No CRN')),
      esc(L('رقمُ الشعبة في بانر', 'Banner CRN')),
      s.crn ? '<button class="crs-ico" type="button" data-act="copy" data-val="' + esc(s.crn) + '" ' +
        'aria-label="' + esc(L('نسخ', 'Copy')) + '" title="' + esc(L('نسخ', 'Copy')) + '">' +
        '<i class="fa-solid fa-copy" aria-hidden="true"></i></button>' : '', !s.crn);

    h += row('fa-clock',
      esc(s.label || L('بلا أيام', 'No days')),
      s.time ? '<span class="ltr">' + esc(s.time + (s.end ? '–' + s.end : '')) + '</span>' : esc(L('بلا وقت', 'No time')),
      '<a class="crs-btn" href="schedule.html"><i class="fa-solid fa-calendar-week" aria-hidden="true"></i>' +
        '<span>' + esc(L('في الجدول', 'On schedule')) + '</span></a>');

    h += row('fa-location-dot',
      esc(s.mixed ? L('حضوريٌّ وعن بُعد', 'In person & remote')
                  : (s.remote ? L('عن بُعد', 'Remote') : L('حضوري', 'In person'))),
      esc(s.room ? L('القاعة ', 'Room ') + s.room : L('بلا قاعةٍ بعد — تُعيَّن لاحقاً', 'No room yet — assigned later')),
      '', !s.room && !s.remote);

    /*@3.COUJ.34*/
    var exams = GardenData.courseExams(CODE).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });
    if (exams.length) {
      h += '<div class="crs-sec-d" style="margin:.9rem 0 .3rem">' +
        esc(L('اختباراتُ هذه الشعبة', 'This section’s exams')) + '</div>';
      exams.forEach(function (x) {
        var days = GardenData.daysUntil(x.date + (x.start_time ? 'T' + x.start_time : ''));
        h += row('fa-file-pen',
          esc(typeLabel(x.exam_type || 'exam')),
          esc(fmtDate(x.date) + (x.start_time ? ' · ' + hhmm(x.start_time) : '')),
          '<span class="crs-badge"' + (relTone(days) ? ' data-tone="' + relTone(days) + '"' : '') + '>' +
            esc(relWord(days)) + '</span>');
      });
    }

    h += '<div id="crs-hist" style="margin-top:1rem"></div>';
    host.innerHTML = h;
    if (s.crn) loadHistory(s.crn);
  }

  /*@3.COUJ.35*/
  var EV_AR = { instructor: 'تغيّر الأستاذ', room: 'تغيّرت القاعة', time: 'تغيّر وقت المحاضرة',
                exam: 'تغيّرت مواعيد الاختبارات', seats: 'تغيّرت المقاعد', added: 'أُضيفت الشعبة',
                removed: 'اختفت الشعبة', status: 'تغيّرت الحالة' };
  var EV_EN = { instructor: 'Instructor changed', room: 'Room changed', time: 'Class time changed',
                exam: 'Exam dates changed', seats: 'Seats changed', added: 'Section added',
                removed: 'Section removed', status: 'Status changed' };

  function loadHistory(crn) {
    var box = el('crs-hist');
    if (!box) return;
    var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
    if (!API) return;

    var term = '';
    try { term = (JSON.parse(localStorage.getItem('sx_prefs') || '{}') || {}).term || ''; } catch (e) {}
    if (!term) return;   /*@3.COUJ.36*/

    box.innerHTML = '<div class="crs-sec-d">' + esc(L('تُجلب تحديثاتُ الشعبة…', 'Loading section updates…')) + '</div>';
    fetch(API + '/v1/section/' + encodeURIComponent(term) + '/' + encodeURIComponent(crn) + '/history')
      .then(function (r) { if (!r.ok) throw new Error('h-' + r.status); return r.json(); })
      .then(function (d) {
        S.hist = d;
        var evs = (d && d.events) || [];
        var h = '<div class="crs-sec-d" style="margin-bottom:.5rem">' +
          esc(L('ما رصدناه على هذه الشعبة في بانر', 'What we recorded for this section on Banner')) + '</div>';
        if (!evs.length) {
          h += '<div class="crs-r is-empty"><i class="fa-solid fa-check" aria-hidden="true"></i>' +
            '<span class="crs-r-b"><span class="crs-r-t">' +
            esc(L('لا تغييراتٍ مرصودة', 'No changes recorded')) + '</span></span></div>';
        } else {
          h += '<ul class="crs-tl">' + evs.slice(0, 12).map(function (e) {
            var lbl = (isAr() ? EV_AR : EV_EN)[e.kind] || e.kind;
            return '<li><span class="crs-tl-when">' + esc(fmtDate(e.at)) + '</span>' +
              '<span class="crs-tl-what"><b>' + esc(lbl) + '</b>' +
              (e.from != null && e.to != null
                ? '<span class="ltr">' + esc(String(e.from)) + ' ← ' + esc(String(e.to)) + '</span>' : '') +
              '</span></li>';
          }).join('') + '</ul>';
        }
        h += '<div style="margin-top:.7rem"><a class="crs-btn" href="sections.html">' +
          '<i class="fa-solid fa-bell" aria-hidden="true"></i><span>' +
          esc(L('تابِع تغيّراتها', 'Watch its changes')) + '</span></a></div>';
        box.innerHTML = h;
      })
      .catch(function () { box.innerHTML = ''; });
  }

  /*@3.COUJ.37*/

  /*@3.COUJ.38*/
  function allItems() {
    var out = [];
    GardenData.courseExams(CODE).forEach(function (e) {
      out.push({ id: e.id, src: 'exam', type: e.exam_type || 'exam', title: '',
                 date: e.date, time: e.start_time, room: e.room, note: e.notes || '',
                 done: false });
    });
    (S.meta.dates || []).forEach(function (d) {
      if (!d || !d.date) return;
      out.push({ id: d.id, src: 'meta', type: d.type || 'assignment', title: d.title || '',
                 date: d.date, time: d.time, room: d.location, note: d.note || '', done: !!d.done });
    });
    GardenData.tasks().forEach(function (t) {
      if (!t || t.course !== CODE) return;
      var due = String(t.due || '');
      out.push({ id: t.id, src: 'task', type: t.type || 'other', title: t.title || '',
                 date: due.slice(0, 10), time: due.slice(11, 16), room: '',
                 note: t.note || '', done: !!t.done });
    });
    out.sort(function (a, b) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return String(a.date + (a.time || '')).localeCompare(String(b.date + (b.time || '')));
    });
    return out;
  }

  function srcLabel(src) {
    return src === 'exam' ? L('من الجدول', 'from schedule')
         : src === 'task' ? L('مهمّة', 'task')
         : L('تسليم', 'deliverable');
  }

  function renderDates() {
    var host = el('crs-dates');
    var list = allItems();
    if (!list.length) {
      host.innerHTML = empty('fa-calendar-days',
        L('لا مواعيدَ ولا مهامَّ لهذه المادة بعد. ما تضيفه هنا يظهر في اللوحة والجدول وصفحة المهام.',
          'No dates or tasks for this course yet. Whatever you add here shows on the dashboard, schedule and tasks page.'));
      return;
    }
    var h = '';
    list.forEach(function (d) {
      var days = GardenData.daysUntil(d.date + (d.time ? 'T' + d.time : ''));
      var past = days !== null && days < 0;
      /*@3.COUJ.39*/
      var done = d.src === 'exam' ? past : d.done;
      var tail = '';
      if (d.src !== 'exam') {
        tail += '<button class="crs-ico" type="button" data-act="tog" data-src="' + d.src +
          '" data-id="' + esc(d.id) + '" aria-pressed="' + (done ? 'true' : 'false') +
          '" aria-label="' + esc(L('إتمام', 'Complete')) + '" title="' + esc(L('إتمام', 'Complete')) + '">' +
          '<i class="fa-' + (done ? 'solid fa-circle-check' : 'regular fa-circle') + '" aria-hidden="true"></i></button>';
      }
      tail += '<span class="crs-badge"' + (!done && relTone(days) ? ' data-tone="' + relTone(days) + '"' : '') + '>' +
        esc(done ? L('انتهى', 'Done') : relWord(days)) + '</span>';
      tail += '<button class="crs-ico" type="button" data-act="edit" data-src="' + d.src +
        '" data-id="' + esc(d.id) + '" aria-label="' + esc(L('تحرير', 'Edit')) +
        '" title="' + esc(L('تحرير', 'Edit')) + '"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>';

      var sub = [typeLabel(d.type), fmtDate(d.date) + (d.time ? ' · ' + hhmm(d.time) : ''),
                 d.room || '', srcLabel(d.src)].filter(Boolean).join(' · ');
      h += row(d.src === 'exam' ? 'fa-file-pen' : (d.src === 'task' ? 'fa-list-check' : 'fa-box'),
        esc(d.title || typeLabel(d.type)), esc(sub), tail, done);
    });
    host.innerHTML = h;
  }

  /*@3.COUJ.40*/

  function renderNotes() {
    var host = el('crs-notes');
    var notes = S.meta.notes || [], links = S.meta.links || [];
    var h = '';

    h += '<div class="crs-sec-d" style="margin-bottom:.4rem">' +
      esc(L('ملاحظاتي', 'My notes')) + '</div>';
    if (!notes.length) {
      h += '<div class="crs-r is-empty"><i class="fa-regular fa-note-sticky" aria-hidden="true"></i>' +
        '<span class="crs-r-b"><span class="crs-r-t">' +
        esc(L('لا ملاحظاتٍ بعد — دوّن ما يقوله الدكتور في المحاضرة', 'No notes yet — jot down what the professor says')) +
        '</span></span></div>';
    } else {
      notes.forEach(function (n) {
        h += row('fa-note-sticky', esc(n.title || L('بلا عنوان', 'Untitled')),
          esc(String(n.body || '').slice(0, 120)),
          '<button class="crs-ico" type="button" data-act="note-edit" data-id="' + esc(n.id) + '" ' +
            'aria-label="' + esc(L('تحرير', 'Edit')) + '" title="' + esc(L('تحرير', 'Edit')) + '">' +
            '<i class="fa-solid fa-pen" aria-hidden="true"></i></button>');
      });
    }

    h += '<div class="crs-sec-d" style="margin:1rem 0 .4rem">' +
      esc(L('روابطُ المادة', 'Course links')) + '</div>';
    if (!links.length) {
      h += '<div class="crs-r is-empty"><i class="fa-solid fa-link" aria-hidden="true"></i>' +
        '<span class="crs-r-b"><span class="crs-r-t">' +
        esc(L('لا روابطَ بعد — أضِف البلاك بورد وقروب المادة', 'No links yet — add Blackboard and the course group')) +
        '</span></span></div>';
    } else {
      links.forEach(function (l) {
        h += row('fa-link',
          '<a href="' + esc(l.url) + '" target="_blank" rel="noopener" ' +
            'style="color:var(--crs-c);text-decoration:none">' +
            esc(l.label || l.url) + '</a>',
          '<span class="ltr">' + esc(l.url) + '</span>',
          '<button class="crs-ico" type="button" data-act="copy" data-val="' + esc(l.url) + '" ' +
            'aria-label="' + esc(L('نسخ', 'Copy')) + '" title="' + esc(L('نسخ', 'Copy')) + '">' +
            '<i class="fa-solid fa-copy" aria-hidden="true"></i></button>' +
          '<button class="crs-ico" type="button" data-act="link-edit" data-id="' + esc(l.id) + '" ' +
            'aria-label="' + esc(L('تحرير', 'Edit')) + '" title="' + esc(L('تحرير', 'Edit')) + '">' +
            '<i class="fa-solid fa-pen" aria-hidden="true"></i></button>');
      });
    }
    host.innerHTML = h;
  }

  /*@3.COUJ.41*/

  function saveMeta() { GardenData.saveCourseMeta(CODE, S.meta); }

  var editing = null;    /*@3.COUJ.42*/

  function fillSelect(id, opts, cur) {
    var n = el(id); if (!n) return;
    n.innerHTML = opts.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' +
        esc(typeLabel(o)) + '</option>';
    }).join('');
  }

  function openDate(item) {
    editing = item ? { kind: 'date', id: item.id, src: item.src } : { kind: 'date', id: null, src: null };
    el('dlg-date-t').textContent = item ? L('تحرير الموعد', 'Edit date') : L('موعدٌ جديد', 'New date');
    fillSelect('d-type', ['final', 'midterm', 'quiz', 'exam', 'assignment'],
      (item && item.type) || 'assignment');
    el('d-date').value = (item && item.date) || dstr(new Date());
    el('d-time').value = (item && hhmm(item.time)) || '';
    el('d-room').value = (item && item.room) || '';
    el('d-title').value = (item && item.title) || '';
    el('d-note').value = (item && item.note) || '';
    el('d-del').hidden = !item;
    el('dlg-date').showModal();
  }

  function saveDate() {
    var type = el('d-type').value, date = el('d-date').value;
    if (!date) { toast(L('التاريخ مطلوب', 'A date is required')); return; }
    var isExam = type !== 'assignment';
    var prevSrc = editing && editing.src;

    /*@3.COUJ.43*/
    if (editing.id) {
      if (prevSrc === 'exam' && !isExam) GardenData.deleteExam(editing.id);
      if (prevSrc === 'meta' && isExam) {
        S.meta.dates = (S.meta.dates || []).filter(function (x) { return x.id !== editing.id; });
        saveMeta();
      }
    }

    if (isExam) {
      /*@3.COUJ.44*/
      GardenData.upsertExam({
        id: (editing.id && prevSrc === 'exam') ? editing.id : null,
        course_code: CODE, date: date, start_time: el('d-time').value || '15:00',
        end_time: '', exam_type: type, room: el('d-room').value, notes: el('d-note').value
      });
    } else {
      var prev = (S.meta.dates || []).filter(function (x) { return x.id === editing.id; })[0];
      var rec = {
        id: (editing.id && prevSrc === 'meta') ? editing.id : uid('date'),
        type: 'assignment', title: el('d-title').value.trim(), date: date,
        time: el('d-time').value, location: el('d-room').value,
        note: el('d-note').value, done: !!(prev && prev.done)
      };
      S.meta.dates = (S.meta.dates || []).filter(function (x) { return x.id !== rec.id; });
      S.meta.dates.push(rec);
      saveMeta();
    }
    el('dlg-date').close();
    refresh();
    toast(L('حُفظ ✓', 'Saved ✓'));
  }

  function openTask(t) {
    editing = { kind: 'task', id: t ? t.id : null, src: 'task' };
    el('dlg-task-t').textContent = t ? L('تحرير المهمّة', 'Edit task') : L('مهمّةٌ جديدة', 'New task');
    el('t-title').value = (t && t.title) || '';
    fillSelect('t-type', ['assignment', 'quiz', 'project', 'reading', 'other'], (t && t.type) || 'assignment');
    el('t-due').value = t && t.date ? (t.date + 'T' + (hhmm(t.time) || '23:59')) : '';
    el('t-note').value = (t && t.note) || '';
    el('t-del').hidden = !t;
    el('dlg-task').showModal();
  }

  function saveTask() {
    var title = el('t-title').value.trim();
    if (!title) { toast(L('اكتب عنوان المهمّة', 'Give the task a title')); return; }
    var prev = GardenData.tasks().filter(function (x) { return x.id === editing.id; })[0];
    GardenData.upsertTask({
      id: editing.id || null, course: CODE, title: title,
      type: el('t-type').value, due: el('t-due').value || '',
      note: el('t-note').value, done: !!(prev && prev.done)
    });
    el('dlg-task').close();
    refresh();
    toast(L('حُفظت ✓', 'Saved ✓'));
  }

  function openNote(n) {
    editing = { kind: 'note', id: n ? n.id : null };
    el('dlg-note-t').textContent = n ? L('تحرير الملاحظة', 'Edit note') : L('ملاحظةٌ جديدة', 'New note');
    el('n-title').value = (n && n.title) || '';
    el('n-body').value = (n && n.body) || '';
    el('n-del').hidden = !n;
    el('dlg-note').showModal();
  }

  function saveNote() {
    var title = el('n-title').value.trim(), body = el('n-body').value;
    if (!title && !body.trim()) { toast(L('اكتب شيئاً أولاً', 'Write something first')); return; }
    var rec = { id: editing.id || uid('note'), title: title, body: body, updated_at: Date.now() };
    S.meta.notes = (S.meta.notes || []).filter(function (x) { return x.id !== rec.id; });
    S.meta.notes.unshift(rec);
    saveMeta();
    el('dlg-note').close();
    refresh();
    toast(L('حُفظت ✓', 'Saved ✓'));
  }

  function openLink(l) {
    editing = { kind: 'link', id: l ? l.id : null };
    el('dlg-link-t').textContent = l ? L('تحرير الرابط', 'Edit link') : L('رابطٌ جديد', 'New link');
    el('l-label').value = (l && l.label) || '';
    el('l-url').value = (l && l.url) || '';
    el('l-del').hidden = !l;
    el('dlg-link').showModal();
  }

  function saveLink() {
    var url = el('l-url').value.trim();
    if (!url) { toast(L('الرابط مطلوب', 'A URL is required')); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    var rec = { id: editing.id || uid('link'), label: el('l-label').value.trim(), url: url };
    S.meta.links = (S.meta.links || []).filter(function (x) { return x.id !== rec.id; });
    S.meta.links.push(rec);
    saveMeta();
    el('dlg-link').close();
    refresh();
    toast(L('حُفظ ✓', 'Saved ✓'));
  }

  /*@3.COUJ.45*/
  var askFn = null;
  function ask(title, body, okLabel, fn) {
    el('dlg-ask-t').textContent = title;
    el('dlg-ask-b').textContent = body;
    el('ask-ok').textContent = okLabel;
    askFn = fn;
    el('dlg-ask').showModal();
  }

  function delCurrent() {
    var e = editing;
    if (!e) return;
    var dlgId = e.kind === 'date' ? 'dlg-date' : e.kind === 'task' ? 'dlg-task'
              : e.kind === 'note' ? 'dlg-note' : 'dlg-link';
    var what = e.kind === 'date' ? L('هذا الموعد', 'this date')
             : e.kind === 'task' ? L('هذه المهمّة', 'this task')
             : e.kind === 'note' ? L('هذه الملاحظة', 'this note') : L('هذا الرابط', 'this link');
    el(dlgId).close();
    ask(L('حذف؟', 'Delete?'),
        L('سيُحذف ' + what + ' نهائياً ولا يُسترجَع.', 'This will permanently delete ' + what + '.'),
        L('احذف', 'Delete'),
        function () {
          if (e.kind === 'date') {
            if (e.src === 'exam') GardenData.deleteExam(e.id);
            else { S.meta.dates = (S.meta.dates || []).filter(function (x) { return x.id !== e.id; }); saveMeta(); }
          } else if (e.kind === 'task') { GardenData.deleteTask(e.id); }
          else if (e.kind === 'note') { S.meta.notes = (S.meta.notes || []).filter(function (x) { return x.id !== e.id; }); saveMeta(); }
          else { S.meta.links = (S.meta.links || []).filter(function (x) { return x.id !== e.id; }); saveMeta(); }
          refresh();
          toast(L('حُذف', 'Deleted'));
        });
  }

  /*@3.COUJ.46*/

  function markRail(id) {
    $$('.crs-rail-item').forEach(function (a) {
      var on = a.getAttribute('data-spy') === id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  /*@3.COUJ.47*/
  function spy() {
    var best = null, bestD = Infinity, y = window.innerHeight * 0.28;
    $$('.crs-main .crs-sec').forEach(function (c) {
      if (c.hidden || !c.offsetParent) return;
      var d = Math.abs(c.getBoundingClientRect().top - y);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (best) markRail(best.id);
  }

  /*@3.COUJ.48*/

  function refresh() {
    S.meta = GardenData.courseMeta(CODE);
    S.stats = GardenData.courseStats(CODE);
    S.sched = GardenData.scheduleRaw();
    renderHead();
    renderStats();
    renderQuick();
    renderToday();
    renderPredict();
    renderProf();
    renderSection();
    renderDates();
    renderNotes();
  }

  function bind() {
    /*@3.COUJ.49*/
    document.addEventListener('click', function (ev) {
      var rail = ev.target.closest && ev.target.closest('.crs-rail-item[href^="#"]');
      if (!rail || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
      var sec = document.getElementById(rail.getAttribute('href').slice(1));
      if (!sec) return;
      ev.preventDefault();
      var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      sec.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' });
      markRail(sec.id);
      try { history.replaceState(null, '', rail.getAttribute('href')); } catch (e) {}
    });

    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;

      var close = t.closest('[data-close]');
      if (close) {
        var d = close.closest('dialog');
        if (d) d.close();
        return;
      }

      /*@3.COUJ.59*/
      var rt = t.closest('[data-rate]');
      if (rt && t.closest('#dlg-fac-b')) { openFacRate(rt.getAttribute('data-rate')); return; }

      var a = t.closest('[data-act]');
      if (!a) return;
      var act = a.getAttribute('data-act');
      var id = a.getAttribute('data-id');
      var src = a.getAttribute('data-src');

      if (act === 'due') {
        if (window.GardenDue) GardenDue.open({ code: CODE });
        return;
      }
      if (act === 'copy') {
        navigator.clipboard.writeText(a.getAttribute('data-val') || '')
          .then(function () { toast(L('نُسخ ✓', 'Copied ✓')); })
          .catch(function () { toast(L('تعذّر النسخ', 'Copy failed')); });
        return;
      }
      if (act === 'ins-pick') {
        if (window.GardenInsPicker) {
          GardenInsPicker.open(CODE, {
            courseName: courseName(),
            onSave: function (rec) {
              refresh();
              toast(rec ? L('حُفظ الدكتور', 'Instructor saved') : L('أُزيل الدكتور', 'Instructor removed'));
            }
          });
        }
        return;
      }
      if (act === 'ins-clear') {
        ask(L('إزالةُ الدكتور؟', 'Remove instructor?'),
            L('يُزال اسمُه وبريدُه وساعاتُه المكتبية من هذه المادة. ملاحظاتُك ومواعيدُك تبقى.',
              'Their name, email and office hours are removed from this course. Your notes and dates stay.'),
            L('أزِله', 'Remove'), function () {
              S.meta.instructors = (S.meta.instructors || []).slice(1);
              saveMeta(); refresh(); toast(L('أُزيل الدكتور', 'Instructor removed'));
            });
        return;
      }
      if (act === 'fac') { openFaculty(); return; }

      if (act === 'date-new') { openDate(null); return; }
      if (act === 'task-new') { openTask(null); return; }
      if (act === 'note-new') { openNote(null); return; }
      if (act === 'link-new') { openLink(null); return; }

      if (act === 'edit') {
        var item = allItems().filter(function (x) { return x.id === id && x.src === src; })[0];
        if (!item) return;
        if (src === 'task') openTask(item); else openDate(item);
        return;
      }
      if (act === 'tog') {
        if (src === 'task') GardenData.toggleTask(id);
        else GardenData.toggleCourseDate(CODE, id);
        refresh();
        return;
      }
      if (act === 'note-edit') {
        openNote((S.meta.notes || []).filter(function (x) { return x.id === id; })[0]);
        return;
      }
      if (act === 'link-edit') {
        openLink((S.meta.links || []).filter(function (x) { return x.id === id; })[0]);
        return;
      }
    });

    /*@3.COUJ.50*/
    document.addEventListener('change', function (ev) {
      var f = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-ins-f');
      if (!f) return;
      var ins = (S.meta.instructors || [])[0];
      if (!ins) return;
      ins[f] = ev.target.value.trim();
      saveMeta();
      toast(L('حُفظ ✓', 'Saved ✓'));
    }, true);

    on('crs-prof-btn', 'click', function () {
      var s = el('s-prof');
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /*@3.COUJ.51*/
    on('crs-color-btn', 'click', function () {
      if (!window.GardenCourseColor) return;
      GardenCourseColor.open(CODE, {
        courseName: courseName(),
        entry: semEntry(),
        /*@3.COUJ.52*/
        onPick: function () { renderHead(); }
      });
    });

    on('d-ok', 'click', saveDate);
    on('t-ok', 'click', saveTask);
    on('n-ok', 'click', saveNote);
    on('l-ok', 'click', saveLink);
    ['d-del', 't-del', 'n-del', 'l-del'].forEach(function (x) { on(x, 'click', delCurrent); });

    /*@3.COUJ.53*/
    on('ask-ok', 'click', function () {
      var f = askFn; askFn = null;
      el('dlg-ask').close();
      if (f) f();
    });
    /*@3.COUJ.54*/
    on('dlg-ask', 'close', function () { if (!el('dlg-ask').open) askFn = null; });

    /*@3.COUJ.55*/
    [['n-title', saveNote], ['l-url', saveLink], ['l-label', saveLink], ['t-title', saveTask]]
      .forEach(function (p) {
        on(p[0], 'keydown', function (e) { if (e.key === 'Enter') p[1](); });
      });

    var st = 0;
    window.addEventListener('scroll', function () {
      if (st) return;
      st = setTimeout(function () { st = 0; spy(); }, 90);
    }, { passive: true });

    /*@3.COUJ.56*/
    document.addEventListener('garden:languageChanged', function () { refresh(); });
    document.addEventListener('garden:syncCompleted', function () { refresh(); });
    document.addEventListener('garden:cardsReviewed', function () { refresh(); });
    document.addEventListener('garden:gradesChanged', function () { renderStats(); renderHead(); });
  }

  function init() {
    if (!CODE) { el('crs-nocode').hidden = false; return; }

    GardenData.ready().then(function () {
      S.info = GardenData.courseInfo(CODE);
      refresh();
      el('crs-layout').hidden = false;
      spy();

      /*@3.COUJ.57*/
      if (window.GardenFaculty) {
        GardenFaculty.load(function () { S.facultyReady = true; renderProf(); });
      }

      if (window.GardenCourseView) GardenCourseView.mount({ into: 'crs-rate', code: CODE });
    });

    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
