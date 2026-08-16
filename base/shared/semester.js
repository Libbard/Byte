/*@3.SEMJ.1*/

(function () {
  'use strict';

  /*@3.SEMJ.2*/

  function el(id) { return document.getElementById(id); }
  /*@3.SEMJ.3*/
  function on(id, ev, fn) {
    var n = el(id);
    if (n) n.addEventListener(ev, fn);
    return !!n;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  /*@3.SEMJ.4*/
  function nOf(n, arForms, enForms, masc) {
    if (isAr() && masc && n === 1) return arForms[0] + ' واحد';
    if (window.Garden && Garden.smartCount) return Garden.smartCount(n, arForms, enForms);
    return n + ' ' + (isAr() ? arForms[2] : enForms[1]);
  }

  var toastT = null;
  function toast(msg) {
    var t = el('sem-toast'); if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }

  /*@3.SEMJ.5*/
  function dstr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseD(s) {
    var p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d) ? null : d;
  }
  function fmtD(s) {
    var d = parseD(s); if (!d) return '';
    try {
      /*@3.SEMJ.6*/
      return d.toLocaleDateString(isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
        { day: 'numeric', month: 'short' });
    } catch (e) { return String(s).slice(0, 10); }
  }
  /*@3.SEMJ.7*/
  function relWord(days) {
    if (days === null || days === undefined) return '';
    if (days === 0) return L('اليوم', 'Today');
    if (days === 1) return L('غداً', 'Tomorrow');
    if (days === -1) return L('أمس', 'Yesterday');
    if (days > 1) return L('بعد ' + nOf(days, ['يوم', 'يومين', 'أيام'], ['day', 'days']),
                           'in ' + nOf(days, ['يوم', 'يومين', 'أيام'], ['day', 'days']));
    return L('متأخّر ' + nOf(-days, ['يوم', 'يومين', 'أيام'], ['day', 'days']),
             nOf(-days, ['يوم', 'يومين', 'أيام'], ['day', 'days']) + ' late');
  }
  function relTone(days) {
    if (days === null || days === undefined) return '';
    if (days < 0) return 'now';
    if (days <= 2) return 'soon';
    return '';
  }
  function hhmm(t) { return String(t || '').slice(0, 5); }

  var DAY_AR = { sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
                 thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
  var DAY_EN = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
                 thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
  var DAY_SHORT_AR = { sunday: 'أحد', monday: 'اثنين', tuesday: 'ثلاثاء', wednesday: 'أربعاء',
                       thursday: 'خميس', friday: 'جمعة', saturday: 'سبت' };
  function dayName(d) { return isAr() ? (DAY_AR[d] || d) : (DAY_EN[d] || d); }

  /*@3.SEMJ.8*/

  var S = {
    sem: null,          /*@3.SEMJ.9*/
    sched: null,        /*@3.SEMJ.10*/
    deadlines: [],      /*@3.SEMJ.11*/
    pending: [],        /*@3.SEMJ.12*/
    roll: null,
    nextFilter: 'all',
    openArchive: {},    /*@3.SEMJ.13*/
    addLevel: 'all',
    addQ: '',
    addShowDone: false,    /*@3.SEMJ.14*/
    addColor: '#64748b',   /*@3.SEMJ.15*/
    facultyReady: false
  };

  function readAll() {
    S.sem = GardenData.semester();
    S.sched = GardenData.scheduleRaw();
    S.deadlines = GardenData.allDeadlines();
    S.pending = GardenData.pendingSections ? GardenData.pendingSections() : [];
  }

  function courses() { return (S.sem && Array.isArray(S.sem.courses)) ? S.sem.courses.filter(Boolean) : []; }

  /*@3.SEMJ.16*/
  function info(entry) {
    var cat = GardenData.courseInfo(entry.code);
    return {
      code: entry.code,
      name: isAr()
        ? ((cat && cat.name_ar) || entry.name_ar || entry.name_en || entry.code)
        : ((cat && cat.name_en) || entry.name_en || entry.name_ar || entry.code),
      credits: (cat && cat.credits != null) ? cat.credits : (entry.credits != null ? entry.credits : 3),
      icon: (cat && cat.icon) || entry.icon || 'fa-solid fa-book',
      /*@3.SEMJ.17*/
      color: GardenData.courseColor(entry.code, entry),
      path: cat && cat.path,
      level: cat ? (isAr() ? cat.level_name_ar : cat.level_name_en) : '',
      /*@3.SEMJ.18*/
      real: GardenData.isRealCourse(entry.code),
      mine: !!cat && !!cat.path
    };
  }

  /*@3.SEMJ.19*/
  function shownCode(code) {
    return GardenData.isRealCourse(code) ? code : '';
  }

  /*@3.SEMJ.20*/

  function termArc() {
    var st = (S.sched && S.sched.settings) || {};
    var a = parseD(st.term_start_date), b = parseD(st.semester_end_date);
    if (!a || !b || b <= a) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var total = Math.round((b - a) / 86400000);
    var gone = Math.round((now - a) / 86400000);
    var pct = Math.max(0, Math.min(100, Math.round((gone / total) * 100)));
    var weeks = Math.max(1, Math.ceil(total / 7));
    var week = Math.max(1, Math.min(weeks, Math.floor(gone / 7) + 1));
    var flags = [];
    ['midterm', 'final'].forEach(function (k) {
      var f = st.focus_periods && st.focus_periods[k];
      var d = f && parseD(f.start);
      if (!d) return;
      var p = Math.round(((d - a) / 86400000 / total) * 100);
      if (p < 0 || p > 100) return;
      flags.push({ kind: k, pct: p, days: GardenData.daysUntil(dstr(d)) });
    });
    return {
      start: st.term_start_date, end: st.semester_end_date,
      pct: pct, week: week, weeks: weeks,
      left: Math.max(0, Math.round((b - now) / 86400000)),
      before: gone < 0, after: gone > total,
      flags: flags
    };
  }

  function renderArc() {
    var arc = termArc();
    var box = el('sem-arc'), empty = el('sem-arc-empty');
    if (!arc) { box.hidden = true; empty.hidden = false; return; }
    box.hidden = false; empty.hidden = true;

    el('sem-arc-week').innerHTML = arc.before
      ? esc(L('لم يبدأ فصلك بعد', 'Your term hasn’t started yet'))
      : (arc.after
        ? esc(L('انتهى فصلك', 'Your term has ended'))
        : esc(L('الأسبوع ', 'Week ')) + '<b>' + arc.week + '</b>' +
          esc(L(' من ' + arc.weeks, ' of ' + arc.weeks)));

    var rest = [];
    if (!arc.after) {
      rest.push(L('بقي ', '') + nOf(arc.left, ['يوم', 'يومان', 'أيام'], ['day', 'days']) + L('', ' left'));
    }
    arc.flags.forEach(function (f) {
      if (f.days === null || f.days < 0) return;
      rest.push(L(f.kind === 'midterm' ? 'النصفيّة' : 'النهائية',
                  f.kind === 'midterm' ? 'Midterms' : 'Finals') + ' ' + relWord(f.days));
    });
    el('sem-arc-rest').textContent = rest.join(' · ');

    el('sem-arc-fill').style.inlineSize = arc.pct + '%';
    el('sem-arc-a').textContent = fmtD(arc.start);
    el('sem-arc-b').textContent = fmtD(arc.end);

    /*@3.SEMJ.21*/
    var track = el('sem-arc-track');
    $$('.sem-arc-flag, .sem-arc-now', track).forEach(function (n) { n.remove(); });
    arc.flags.forEach(function (f) {
      var s = document.createElement('span');
      s.className = 'sem-arc-flag';
      s.setAttribute('data-kind', f.kind);
      s.style.insetInlineStart = f.pct + '%';
      s.textContent = L(f.kind === 'midterm' ? 'نصفيّة' : 'نهائية',
                        f.kind === 'midterm' ? 'Mid' : 'Final');
      track.appendChild(s);
    });
    if (!arc.before && !arc.after) {
      var now = document.createElement('span');
      now.className = 'sem-arc-now';
      now.style.insetInlineStart = arc.pct + '%';
      now.setAttribute('aria-label', L('أنت هنا', 'You are here'));
      track.appendChild(now);
    }
  }

  /*@3.SEMJ.22*/

  /*@3.SEMJ.23*/
  function weeklyMinutes() {
    var mine = {}, out = {};
    courses().forEach(function (c) { mine[c.code] = 1; });
    (S.sched.lectures || []).forEach(function (x) {
      if (!x || !mine[x.course_code]) return;
      var a = hhmm(x.start_time).split(':'), b = hhmm(x.end_time).split(':');
      var m = (b.length === 2 && a.length === 2)
        ? ((+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1])) : 50;
      if (!(m > 0)) m = 50;
      out[x.day] = (out[x.day] || 0) + m;
    });
    return out;
  }

  function renderStats() {
    var list = courses();
    var credits = 0, sumPct = 0, done = 0;
    list.forEach(function (c) {
      credits += info(c).credits;
      sumPct += GardenData.coursePercent(c);
      if (GardenData.courseDone(c)) done++;
    });
    var pct = list.length ? Math.round(sumPct / list.length) : 0;

    var mins = weeklyMinutes();
    var weekly = 0;
    Object.keys(mins).forEach(function (k) { weekly += mins[k]; });
    var weeklyH = Math.round(weekly / 6) / 10;   /*@3.SEMJ.24*/

    /*@3.SEMJ.25*/
    var pts = 0, gc = 0;
    list.forEach(function (c) {
      var g = c.grade;
      if (!g || GardenData.GPA_SCALE[g] === undefined) return;
      var cr = info(c).credits;
      pts += GardenData.GPA_SCALE[g] * cr; gc += cr;
    });
    var semGpa = gc ? (pts / gc) : null;

    var due = GardenData.dueForSemester();

    /*@3.SEMJ.26*/
    function card(k, v, sub, barPct, href, title) {
      var inner =
        '<div class="sem-stat-k">' + esc(k) + '</div>' +
        '<div class="sem-stat-v">' + v + (sub ? ' <small>' + esc(sub) + '</small>' : '') + '</div>' +
        (barPct === null ? '' :
          '<div class="sem-stat-bar"><i style="inline-size:' + barPct + '%;--fill:' +
            esc(GardenData.qualityColor01(barPct / 100)) + '"></i></div>');
      return href
        ? '<a class="sem-stat" href="' + esc(href) + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + inner + '</a>'
        : '<div class="sem-stat">' + inner + '</div>';
    }

    var html = '';
    html += card(L('المواد', 'Courses'), list.length,
      done ? L(done + ' مكتملة', done + ' done') : '',
      list.length ? Math.round((done / list.length) * 100) : 0);
    html += card(L('الساعات المعتمدة', 'Credit hours'), credits, '', null);
    html += card(L('حِملك الأسبوعي', 'Weekly load'), weeklyH,
      L('ساعة محاضرات', 'lecture hrs'), null);
    html += card(L('تقدّمك', 'Progress'), pct + '<small>%</small>', '', pct);
    /*@3.SEMJ.27*/
    html += card(L('معدّل فصلك', 'Term GPA'),
      semGpa === null ? '—' : semGpa.toFixed(2),
      semGpa === null ? L('بلا درجات بعد', 'no grades yet') : L('من 4.0', 'of 4.0'),
      semGpa === null ? 0 : Math.round(((semGpa - 2) / 2) * 100),
      'gpa.html', L('الدرجات تُحرَّر في صفحة المعدل', 'Grades are edited on the GPA page'));
    /*@3.SEMJ.28*/
    if (due) {
      html += '<button class="sem-stat" type="button" data-act="due" title="' +
        esc(L('راجِعها الآن', 'Review them now')) + '">' +
        '<div class="sem-stat-k">' + esc(L('بطاقات مستحقّة', 'Cards due')) + '</div>' +
        '<div class="sem-stat-v">' + due + '</div>' +
        '<div class="sem-stat-sub">' + esc(L('اضغط لمراجعتها', 'Tap to review')) + '</div>' +
        '</button>';
    }
    el('sem-stats').innerHTML = html;
  }

  /*@3.SEMJ.29*/

  function renderHead() {
    el('sem-name').textContent = GardenData.dispName(S.sem) || L('فصلي', 'My term');

    /*@3.SEMJ.30*/
    var bits = [];
    var n = courses().length;
    bits.push(esc(nOf(n, ['مادة', 'مادتان', 'مواد'], ['course', 'courses'])));
    var arc = termArc();
    if (arc && !arc.after && !arc.before) {
      bits.push(esc(L('الأسبوع ' + arc.week, 'week ' + arc.week)));
    }
    /*@3.SEMJ.31*/
    el('sem-sub').innerHTML = bits.length
      ? '<span aria-hidden="true">·</span>' + bits.join('<span aria-hidden="true">·</span>')
      : '';
  }

  /*@3.SEMJ.32*/

  function renderPending() {
    var box = el('sem-pending');
    if (!S.pending.length) { box.hidden = true; return; }
    box.hidden = false;
    el('sem-pending-h').textContent = L(
      'سجّلتَ ' + nOf(S.pending.length, ['مادة', 'مادتين', 'مواد'], ['course', 'courses']) + ' في الشعب ولم تدخل فصلك',
      'You registered ' + nOf(S.pending.length, ['course', 'courses'], ['course', 'courses']) + ' in sections that aren’t in your term');
    el('sem-pending-codes').innerHTML = S.pending.map(function (c) {
      return '<span class="sem-badge" data-tone="warn"><span class="sem-code">' + esc(c.code) + '</span></span>';
    }).join('');
  }

  /*@3.SEMJ.33*/

  var HORIZON = 45;

  function buildNext() {
    var mine = {}, out = [];
    courses().forEach(function (c) { mine[c.code] = c; });

    /*@3.SEMJ.34*/
    var todayName = GardenData.todayDayName();
    (S.sched.lectures || []).forEach(function (x) {
      if (!x || !mine[x.course_code] || !x.recurring) return;
      if (x.day !== todayName) return;
      out.push({
        kind: 'lecture', code: x.course_code, days: 0,
        title: L(x.kind === 'lab' ? 'معمل' : 'محاضرة', x.kind === 'lab' ? 'Lab' : 'Lecture'),
        meta: hhmm(x.start_time) + (x.room ? ' · ' + x.room : '') +
              (x.attendance === 'remote' ? ' · ' + L('عن بُعد', 'Remote') : ''),
        href: 'schedule.html', sortKey: '0000-00-00T' + hhmm(x.start_time)
      });
    });

    /*@3.SEMJ.35*/
    S.deadlines.forEach(function (d) {
      if (d.done || !d.due) return;
      var days = GardenData.daysUntil(d.due);
      if (days === null || days > HORIZON) return;
      var kind = (d.source === 'exam') ? 'exam' : 'task';
      var title = d.title;
      if (!title && d.source === 'exam') {
        title = d.type === 'midterm' ? L('اختبار نصفي', 'Midterm')
              : d.type === 'final' ? L('اختبار نهائي', 'Final')
              : L('اختبار', 'Exam');
      }
      out.push({
        kind: kind, code: d.course || null, days: days,
        title: title || L('موعد', 'Deadline'),
        meta: fmtD(d.due) + (d.note ? ' · ' + d.note : ''),
        href: (d.source === 'exam') ? 'schedule.html' : '../index.html#tasks',
        sortKey: String(d.due)
      });
    });

    out.sort(function (a, b) {
      if (a.days !== b.days) return a.days - b.days;
      return String(a.sortKey).localeCompare(String(b.sortKey));
    });
    return out;
  }

  function bucketOf(days) {
    if (days < 0) return 'late';
    if (days === 0) return 'today';
    if (days === 1) return 'tom';
    if (days <= 7) return 'week';
    return 'later';
  }
  var BUCKET_NAME = {
    late:  ['متأخّر', 'Overdue'],
    today: ['اليوم', 'Today'],
    tom:   ['غداً', 'Tomorrow'],
    week:  ['هذا الأسبوع', 'This week'],
    later: ['قريباً', 'Coming up']
  };

  function renderNext() {
    var list = buildNext().filter(function (x) {
      return S.nextFilter === 'all' || x.kind === S.nextFilter;
    });
    var host = el('sem-next');
    if (!list.length) {
      host.innerHTML = '<div class="sem-empty"><i class="fa-solid fa-mug-hot" aria-hidden="true"></i>' +
        '<p>' + esc(S.nextFilter === 'all'
          ? L('لا شيء قادماً في الأفق — لا محاضرة اليوم ولا موعد قريب.',
              'Nothing on the horizon — no lecture today and no deadline soon.')
          : L('لا شيء من هذا النوع قادماً.', 'Nothing of this kind coming up.')) + '</p></div>';
      return;
    }
    var html = '', last = null;
    list.forEach(function (x) {
      var b = bucketOf(x.days);
      if (b !== last) {
        last = b;
        html += '<div class="sem-when">' + esc(L(BUCKET_NAME[b][0], BUCKET_NAME[b][1])) + '</div>';
      }
      var ci = x.code ? info({ code: x.code }) : null;
      var ico = x.kind === 'exam' ? 'fa-file-pen' : (x.kind === 'lecture' ? 'fa-chalkboard-user' : 'fa-list-check');
      html += '<a class="sem-ev" href="' + esc(x.href) + '"' +
          (ci && ci.color ? ' style="--ev-color:' + esc(ci.color) + '"' : '') + '>' +
        '<span class="sem-ev-dot" aria-hidden="true"></span>' +
        '<span class="sem-ev-b">' +
          '<span class="sem-ev-t">' + esc(x.title) + '</span>' +
          '<span class="sem-ev-m">' +
            '<i class="fa-solid ' + ico + '" aria-hidden="true"></i>' +
            (x.code && shownCode(x.code) ? '<span class="sem-code">' + esc(shownCode(x.code)) + '</span>' : '') +
            (ci && !shownCode(x.code) ? '<span>' + esc(ci.name) + '</span>' : '') +
            '<span>' + esc(x.meta) + '</span>' +
          '</span>' +
        '</span>' +
        '<span class="sem-ev-w"' + (relTone(x.days) ? ' data-tone="' + relTone(x.days) + '"' : '') + '>' +
          esc(relWord(x.days)) + '</span>' +
      '</a>';
    });
    host.innerHTML = html;
  }

  /*@3.SEMJ.36*/

  /*@3.SEMJ.37*/
  function sectionOf(code) {
    var rows = (S.sched.lectures || []).filter(function (x) {
      return x && x.course_code === code;
    });
    if (!rows.length) return null;
    var days = [], crn = null, room = '', remote = false;
    rows.forEach(function (r) {
      if (days.indexOf(r.day) === -1) days.push(r.day);
      if (!crn && r.sx_crn) crn = r.sx_crn;
      if (!room && r.room) room = r.room;
      if (r.attendance === 'remote') remote = true;
    });
    var order = GardenData.DAYS_ORDER;
    days.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return {
      crn: crn, room: room, remote: remote,
      days: days, time: hhmm(rows[0].start_time),
      /*@3.SEMJ.38*/
      label: days.map(function (d) { return isAr() ? (DAY_SHORT_AR[d] || d) : (DAY_EN[d] || d); })
                 .join(isAr() ? '، ' : ', ')
    };
  }

  function instructorOf(code) {
    var m = GardenData.courseMeta(code);
    var ins = (m.instructors || [])[0];
    if (!ins || !ins.name) return null;
    var f = null;
    if (S.facultyReady && window.GardenFaculty) {
      f = (ins.email && GardenFaculty.byEmail(ins.email)) || GardenFaculty.byBannerName(ins.name);
    }
    return { name: ins.name, rating: f };
  }

  function nextForCourse(code) {
    var best = null;
    S.deadlines.forEach(function (d) {
      if (d.done || d.course !== code || !d.due) return;
      var days = GardenData.daysUntil(d.due);
      if (days === null || days < 0) return;
      if (!best || days < best.days) {
        var title = d.title;
        if (!title && d.source === 'exam') {
          title = d.type === 'midterm' ? L('اختبار نصفي', 'Midterm')
                : d.type === 'final' ? L('اختبار نهائي', 'Final') : L('اختبار', 'Exam');
        }
        best = { days: days, title: title || L('موعد', 'Deadline'), src: d.source };
      }
    });
    return best;
  }

  function openTasksOf(code) {
    return GardenData.tasks().filter(function (t) {
      return t && t.course === code && !t.done;
    }).length;
  }

  function rateTone(v) {
    if (v == null) return '';
    if (v >= 80) return 'ok';
    if (v >= 55) return 'mid';
    return 'bad';
  }

  /*@3.SEMJ.39*/
  function row(icon, main, sub, tail, empty) {
    return '<div class="sem-r' + (empty ? ' is-empty' : '') + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span class="sem-r-b"><span class="sem-r-t">' + main + '</span>' +
      (sub ? '<span class="sem-r-s">' + sub + '</span>' : '') + '</span>' +
      (tail ? '<span class="sem-r-e">' + tail + '</span>' : '') +
    '</div>';
  }

  function courseCard(entry) {
    var i = info(entry);
    var st = i.real ? GardenData.courseStats(entry.code) : null;
    var pct = GardenData.coursePercent(entry);
    var sec = sectionOf(entry.code);
    var ins = instructorOf(entry.code);
    var nx = nextForCourse(entry.code);
    var tk = openTasksOf(entry.code);

    var isDone = GardenData.courseDone(entry);
    var h = '<article class="sem-c' + (isDone ? ' is-done sem-c-done' : '') + '"' +
      ' style="' + (i.color ? '--course-color:' + esc(i.color) + ';' : '') +
        '--fill:' + esc(GardenData.qualityColor01(pct / 100)) + '"' +
      ' data-code="' + esc(entry.code) + '">';

    /*@3.SEMJ.40*/
    if (i.mine) {
      h += '<a class="sem-c-open" href="../' + esc(i.path) + 'index.html" tabindex="-1" aria-hidden="true">' +
        esc(L('ادرس ', 'Study ') + i.name) + '</a>';
    }

    /*@3.SEMJ.41*/
    h += '<div class="sem-c-h">' +
      '<span class="sem-c-ic"><i class="' + esc(i.icon) + '" aria-hidden="true"></i></span>' +
      '<span class="sem-c-ht">' +
        '<span class="sem-c-n">' + esc(i.name) + '</span>' +
        '<span class="sem-c-m">' +
          /*@3.SEMJ.42*/
          (shownCode(entry.code) && i.name !== entry.code
            ? '<span class="sem-code">' + esc(shownCode(entry.code)) + '</span>' : '') +
          '<span class="sem-badge">' + esc(nOf(i.credits, ['ساعة', 'ساعتان', 'ساعات'], ['hr', 'hrs'])) + '</span>' +
          (isDone ? '<span class="sem-badge" data-tone="ok"><i class="fa-solid fa-check" aria-hidden="true"></i>' +
            esc(L('اكتملت', 'Done')) + '</span>' : '') +
          (entry.external ? '<span class="sem-badge">' + esc(L('خارج المحتوى', 'External')) + '</span>' : '') +
        '</span>' +
      '</span>' +
      '<span class="sem-c-more"><button class="sem-ico" type="button" data-more="' + esc(entry.code) + '" ' +
        'aria-label="' + esc(L('خيارات المادة', 'Course options')) + '" title="' + esc(L('خيارات', 'Options')) + '">' +
        '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button></span>' +
    '</div>';

    /*@3.SEMJ.43*/
    h += '<div class="sem-c-prog">' +
      '<span class="sem-c-pv">' + pct + '<small style="font-size:.6em">%</small></span>' +
      '<span class="sem-c-pb"><i style="inline-size:' + pct + '%"></i></span>' +
    '</div>';

    /*@3.SEMJ.44*/
    if (st && st.hasData) {
      h += row('fa-layer-group',
        esc(nOf(st.mastered, ['بطاقة متقنة', 'بطاقتان متقنتان', 'بطاقات متقنة'], ['card mastered', 'cards mastered'])),
        '', st.due
          /*@3.SEMJ.45*/
          ? '<button class="sem-badge" type="button" data-tone="warn" data-due="' + esc(entry.code) + '" ' +
            'title="' + esc(L('راجِع بطاقاتِ هذه المادة', 'Review this course’s cards')) + '">' +
            esc(L(st.due + ' مستحقّة', st.due + ' due')) + '</button>'
          : '');
    } else {
      h += row('fa-layer-group', esc(L('لم تبدأ بطاقاتها بعد', 'No flashcards started')), '', '', true);
    }

    /*@3.SEMJ.46*/
    if (ins) {
      var rt = '';
      if (ins.rating && ins.rating.idx != null) {
        rt = '<span class="sem-rate" data-tone="' + rateTone(ins.rating.idx) + '">' +
          '<b>' + Math.round(ins.rating.idx) + '%</b>' +
          '<small>(' + (ins.rating.n || 0) + ')</small></span>';
      }
      h += row('fa-chalkboard-user',
        '<button class="sem-linkish" type="button" data-ins-open="' + esc(entry.code) + '">' +
          esc(ins.name) + '</button>', '', rt);
    } else {
      h += row('fa-chalkboard-user', esc(L('لم تُضِف دكتور المادة', 'No instructor added')), '',
        '<button class="sem-badge" type="button" data-ins-open="' + esc(entry.code) + '">' +
        esc(L('أضِفه', 'Add')) + '</button>', true);
    }

    /*@3.SEMJ.47*/
    if (sec) {
      var extra = [];
      if (sec.room) extra.push(sec.room);
      if (sec.remote) extra.push(L('عن بُعد', 'Remote'));
      h += row('fa-clock',
        esc(sec.label + ' · ' + sec.time) +
          (extra.length ? ' <span class="sem-r-dim">· ' + esc(extra.join(' · ')) + '</span>' : ''),
        '',
        /*@3.SEMJ.139*/
        sec.crn ? '<button class="sem-code sem-code-btn" type="button" data-crn-chip="' +
            esc(entry.code) + '" data-crn="' + esc(sec.crn) + '" title="' +
            esc(L('شعبتُك — اعرضها أو فُكّ ربطَها', 'Your section — inspect it or unlink')) + '">' +
            esc(sec.crn) + '</button>'
          : '');
    } else {
      /*@3.SEMJ.140*/
      h += row('fa-clock', esc(L('لا شعبة في جدولك', 'No section in your schedule')), '',
        '<button class="sem-badge" type="button" data-crn-open="' + esc(entry.code) + '" title="' +
        esc(L('اربطها برقم الشعبة من البانر', 'Link it with its Banner CRN')) + '">' +
        esc(L('اربطها', 'Link')) + '</button>', true);
    }

    /*@3.SEMJ.48*/
    if (nx) {
      h += row(nx.src === 'exam' ? 'fa-file-pen' : 'fa-flag', esc(nx.title), '',
        '<span class="sem-badge"' + (nx.days <= 2 ? ' data-tone="warn"' : '') + '>' +
        esc(relWord(nx.days)) + '</span>');
    } else {
      h += row('fa-flag', esc(L('لا موعد قادم', 'No upcoming deadline')), '', '', true);
    }

    /*@3.SEMJ.49*/
    var gradeChip = entry.grade
      ? '<a class="sem-grade" href="gpa.html" title="' +
          esc(L('الدرجات تُحرَّر في صفحة المعدل', 'Grades are edited on the GPA page')) + '">' +
          esc(entry.grade) + '</a>'
      : '<a class="sem-grade is-empty" href="gpa.html" title="' +
          esc(L('لا درجة بعد — تُدخَل في صفحة المعدل', 'No grade yet — entered on the GPA page')) + '">—</a>';
    /*@3.SEMJ.50*/
    h += row('fa-list-check',
      tk ? esc(nOf(tk, ['مهمة مفتوحة', 'مهمتان مفتوحتان', 'مهام مفتوحة'], ['open task', 'open tasks']))
         : esc(L('لا مهام مفتوحة', 'No open tasks')),
      '', gradeChip, !tk && !entry.grade);

    /*@3.SEMJ.51*/
    function act(on, href, icon, label) {
      return on
        ? '<a class="sem-btn" href="' + esc(href) + '">' +
            '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + esc(label) + '</span></a>'
        : '<span class="sem-btn is-void" aria-hidden="true">' +
            '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + esc(label) + '</span></span>';
    }
    h += '<div class="sem-c-a">' +
      act(i.mine, '../' + (i.path || '') + 'index.html', 'fa-book-open', L('المحتوى', 'Content')) +
      act(true, 'course.html?code=' + encodeURIComponent(entry.code), 'fa-id-card', L('البطاقة', 'Card')) +
      act(i.real, 'sections.html?q=' + encodeURIComponent(entry.code), 'fa-layer-group', L('الشعب', 'Sections')) +
    '</div>';

    h += '</article>';
    return h;
  }

  /*@3.SEMJ.179*/
  function renderRateNudge() {
    var host = el('sem-rate-nudge');
    if (!host) return;
    var GF = window.GardenFaculty;
    if (!S.facultyReady || !GF) { host.hidden = true; return; }

    var seen = {}, gaps = [];
    courses().forEach(function (entry) {
      var m = GardenData.courseMeta(entry.code);
      ((m && m.instructors) || []).forEach(function (ins) {
        if (!ins || !ins.name) return;
        var k = String(ins.email || ins.name).toLowerCase();
        if (seen[k]) return;
        seen[k] = 1;
        var f = (ins.email && GF.byEmail(ins.email)) || GF.byBannerName(ins.name);
        var n = f ? (f.n || 0) : 0;
        if (n >= 3) return;
        gaps.push({ name: (f && GF.nameOf(f)) || ins.name,
                    key: (f && f.id) || ins.name, n: n });
      });
    });
    if (!gaps.length) { host.hidden = true; host.innerHTML = ''; return; }

    gaps.sort(function (a, b) { return a.n - b.n; });
    host.hidden = false;
    host.innerHTML =
      '<i class="fa-solid fa-seedling" aria-hidden="true"></i>' +
      '<span>' + esc(L(
        'رأيُك ناقصٌ عند ' +
          nOf(gaps.length, ['أستاذ', 'أستاذين', 'أساتذة'], ['instructor', 'instructors'], true) +
          ' من أساتذة فصلك:',
        gaps.length + ' of your instructors have few or no ratings:')) + ' ' +
        gaps.map(function (g) {
          return '<a class="sem-nudge-b" href="faculty.html?rate=' +
            encodeURIComponent(g.key) + '">' + esc(g.name) +
            '<small>' + esc(GF.nudgeT(g.n)) + '</small></a>';
        }).join('') +
      '</span>';
  }

  function renderCourses() {
    var list = courses();
    var grid = el('sem-courses'), empty = el('sem-courses-empty');
    if (!list.length) { grid.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    /*@3.SEMJ.52*/
    grid.innerHTML = list.map(function (entry) {
      try { return courseCard(entry); }
      catch (err) {
        try { console.error('semester: courseCard failed for', entry && entry.code, err); } catch (e) {}
        return '<article class="sem-c sem-c-broken"><div class="sem-c-h">' +
          '<span class="sem-c-ic"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>' +
          '<span class="sem-c-ht"><span class="sem-c-n">' + esc((entry && entry.code) || '—') + '</span>' +
          '<span class="sem-c-m">' + esc(L('تعذّر عرضُ هذه البطاقة', 'This card failed to render')) +
          '</span></span></div></article>';
      }
    }).join('');
    renderRateNudge();
  }

  /*@3.SEMJ.53*/

  function renderRhythm() {
    var mins = weeklyMinutes();
    var days = (S.sched.settings && S.sched.settings.active_days) ||
               ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    var max = 0;
    days.forEach(function (d) { if ((mins[d] || 0) > max) max = mins[d] || 0; });

    var host = el('sem-load'), empty = el('sem-rhythm-empty');
    if (!max) { host.innerHTML = ''; empty.hidden = false; el('sem-lag').hidden = true; return; }
    empty.hidden = true;

    host.innerHTML = days.map(function (d) {
      var m = mins[d] || 0;
      var h = Math.round(m / 6) / 10;
      return '<div class="sem-load-r"' + (m === max && m > 0 ? ' data-peak="1"' : '') + '>' +
        '<span class="sem-load-d">' + esc(dayName(d)) + '</span>' +
        '<span class="sem-load-b"><i style="inline-size:' + Math.round((m / max) * 100) + '%"></i></span>' +
        '<span class="sem-load-v">' + (m ? esc(h + L(' س', 'h')) : '—') + '</span>' +
      '</div>';
    }).join('');

    /*@3.SEMJ.54*/
    var arc = termArc();
    var lag = el('sem-lag');
    if (!arc || arc.before || arc.pct < 10) { lag.hidden = true; return; }

    var live = courses().filter(function (c) { return !GardenData.courseDone(c) && info(c).real; });
    var worst = null, sum = 0, n = 0;
    live.forEach(function (c) {
      var p = GardenData.coursePercent(c);
      sum += p; n++;
      var gap = arc.pct - p;
      if (!worst || gap > worst.gap) worst = { c: c, gap: gap, pct: p };
    });
    if (!n) { lag.hidden = true; return; }

    var avg = Math.round(sum / n);
    var q = Math.max(0, Math.min(1, avg / arc.pct));   /*@3.SEMJ.55*/
    lag.hidden = false;
    lag.style.setProperty('--tint', GardenData.qualityColor01(q));

    var tag, icon, body;
    if (q >= 0.95) {
      tag = L('ممتاز', 'Excellent'); icon = 'fa-circle-check';
      body = L('موادّك كلّها على إيقاع فصلك أو أسرع منه.',
               'All your courses are keeping pace with your term — or ahead of it.');
    } else if (q >= 0.75) {
      tag = L('جيد', 'On track'); icon = 'fa-circle-check';
      body = L('أنت قريبٌ من إيقاع فصلك — متوسّطُ تقدّمك ' + avg + '٪ وقد انقضى ' + arc.pct + '٪.',
               'You’re close to your term’s pace — ' + avg + '% average progress against ' + arc.pct + '% elapsed.');
    } else if (q >= 0.5) {
      tag = L('متأخّر قليلاً', 'Slipping'); icon = 'fa-circle-exclamation';
      body = L('انقضى ' + arc.pct + '٪ من فصلك ومتوسّطُ تقدّمك ' + avg + '٪.',
               arc.pct + '% of your term has passed and your average progress is ' + avg + '%.');
    } else {
      tag = L('متأخّر', 'Behind'); icon = 'fa-triangle-exclamation';
      body = L('انقضى ' + arc.pct + '٪ من فصلك ومتوسّطُ تقدّمك ' + avg + '٪ فقط.',
               arc.pct + '% of your term has passed and your average progress is only ' + avg + '%.');
    }

    var tail = '';
    if (worst && worst.gap > 20) {
      var wi = info(worst.c);
      tail = ' <b>' + esc(wi.name) + '</b>' +
        esc(L(' عند ' + worst.pct + '٪ — أبعدُ موادّك عن إيقاعه.',
              ' is at ' + worst.pct + '% — the furthest behind.'));
    }
    lag.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + esc(body) + tail + '</span>' +
      '<span class="sem-note-tag">' + esc(tag) + '</span>';
  }

  /*@3.SEMJ.56*/

  /*@3.SEMJ.57*/
  function archiveStats(a) {
    var pts = 0, gc = 0, credits = 0;
    (a.courses || []).forEach(function (c) {
      if (!c) return;
      var cr = (c.credits != null) ? c.credits
        : ((GardenData.courseInfo(c.code) || {}).credits != null
            ? GardenData.courseInfo(c.code).credits : 3);
      credits += cr;
      if (c.grade && GardenData.GPA_SCALE[c.grade] !== undefined) {
        pts += GardenData.GPA_SCALE[c.grade] * cr; gc += cr;
      }
    });
    return { credits: credits, gpa: gc ? (pts / gc) : null, graded: gc };
  }

  function renderArchive() {
    var arch = GardenData.archive() || [];
    var host = el('sem-archive'), empty = el('sem-archive-empty');
    if (!arch.length) { host.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    host.innerHTML = arch.slice().reverse().map(function (a) {
      if (!a || !a.id) return '';
      var s = archiveStats(a);
      var open = !!S.openArchive[a.id];
      var rows = (a.courses || []).map(function (c) {
        var ci = GardenData.courseInfo(c.code);
        var nm = isAr()
          ? ((ci && ci.name_ar) || c.name_ar || c.name_en || c.code)
          : ((ci && ci.name_en) || c.name_en || c.name_ar || c.code);
        return '<div class="sem-ar-row">' +
          /*@3.SEMJ.58*/
          (shownCode(c.code) && nm !== c.code
            ? '<span class="sem-code">' + esc(shownCode(c.code)) + '</span>' : '') +
          '<span class="sem-ar-row-n">' + esc(nm) + '</span>' +
          '<a class="sem-grade' + (c.grade ? '' : ' is-empty') + '" href="gpa.html" title="' +
            esc(L('الدرجات تُحرَّر في صفحة المعدل', 'Grades are edited on the GPA page')) + '">' +
            esc(c.grade || '—') + '</a>' +
        '</div>';
      }).join('');

      return '<div class="sem-ar-i' + (open ? ' is-open' : '') + '" data-arch="' + esc(a.id) + '">' +
        '<button class="sem-ar-h" type="button" data-toggle="' + esc(a.id) + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
          '<i class="fa-solid fa-chevron-down sem-ar-car" aria-hidden="true"></i>' +
          '<span class="sem-ar-n">' + esc(GardenData.dispName(a) || L('فصل', 'Semester')) + '</span>' +
          '<span class="sem-ar-m">' +
            '<span class="sem-badge">' + esc(nOf(s.credits, ['ساعة', 'ساعتان', 'ساعات'], ['hr', 'hrs'])) + '</span>' +
            (s.gpa === null
              ? '<span class="sem-badge">' + esc(L('بلا درجات', 'No grades')) + '</span>'
              : '<span class="sem-badge" data-tone="' + (s.gpa >= 3 ? 'ok' : (s.gpa >= 2 ? 'warn' : 'bad')) + '">' +
                s.gpa.toFixed(2) + '</span>') +
          '</span>' +
        '</button>' +
        '<div class="sem-ar-body"' + (open ? '' : ' hidden') + '>' + rows +
          '<div class="sem-ar-a">' +
            '<button class="sem-btn" type="button" data-restore="' + esc(a.id) + '">' +
              '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>' + esc(L('استرجاع', 'Restore')) + '</span></button>' +
            '<a class="sem-btn" href="gpa.html"><i class="fa-solid fa-chart-line" aria-hidden="true"></i>' +
              '<span>' + esc(L('حرّر درجاته', 'Edit its grades')) + '</span></a>' +
            '<button class="sem-btn sem-btn--danger" type="button" data-delarch="' + esc(a.id) + '">' +
              '<i class="fa-solid fa-trash" aria-hidden="true"></i><span>' + esc(L('حذف', 'Delete')) + '</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /*@3.SEMJ.59*/

  function save() {
    if (!S.sem) return;
    S.sem.updated_at = new Date().toISOString();
    window.GardenEv('sem_edit', { n: ((S.sem && S.sem.courses) || []).length });
    try { localStorage.setItem('my_semester', JSON.stringify(S.sem)); } catch (e) {}
    try { localStorage.setItem('__syncT_my_semester', String(Date.now())); } catch (e) {}
  }
  /*@3.SEMJ.60*/
  function saveArchive(list) {
    try { localStorage.setItem('semester_archive', JSON.stringify(list)); } catch (e) {}
    try { localStorage.setItem('__syncT_semester_archive', String(Date.now())); } catch (e) {}
    try { GardenData.rebuildGrades(); } catch (e) {}
  }

  /*@3.SEMJ.61*/

  function markRail(sec) {
    $$('.sem-rail-item').forEach(function (b) {
      b.classList.toggle('is-on', !!sec && b.getAttribute('data-go') === sec);
    });
  }
  function goSec(sec) {
    var card = el('sec-' + sec);
    if (!card) return;
    /*@3.SEMJ.62*/
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' });
    markRail(sec);
    if (history.replaceState) history.replaceState(null, '', '#' + sec);
  }
  function spy() {
    var best = null, bestD = Infinity, y = window.innerHeight * 0.28;
    $$('.sem-sec').forEach(function (c) {
      if (c.hidden || !c.offsetParent) return;
      var d = Math.abs(c.getBoundingClientRect().top - y);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (best) markRail(best.getAttribute('data-sec'));
  }

  /*@3.SEMJ.63*/

  function levelsOf() {
    var seen = {}, out = [];
    GardenData.catalogList().forEach(function (c) {
      if (!c || !c.level || seen[c.level]) return;
      seen[c.level] = 1;
      out.push({ key: c.level, ar: c.level_name_ar || c.level, en: c.level_name_en || c.level });
    });
    out.sort(function (a, b) { return String(a.key).localeCompare(String(b.key)); });
    return out;
  }

  function renderAddLevels() {
    var html = '<button class="sem-chip' + (S.addLevel === 'all' ? ' is-on' : '') +
      '" type="button" data-lv="all">' + esc(L('الكل', 'All')) + '</button>';
    levelsOf().forEach(function (l) {
      html += '<button class="sem-chip' + (S.addLevel === l.key ? ' is-on' : '') +
        '" type="button" data-lv="' + esc(l.key) + '">' + esc(isAr() ? l.ar : l.en) + '</button>';
    });
    el('add-levels').innerHTML = html;
  }

  function hi(text, q) {
    if (!q) return esc(text);
    var i = String(text).toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(String(text).slice(0, i)) + '<mark class="sem-mk">' +
      esc(String(text).slice(i, i + q.length)) + '</mark>' + esc(String(text).slice(i + q.length));
  }

  function renderAddList() {
    var have = {};
    courses().forEach(function (c) { have[c.code] = 1; });
    var done = GardenData.completedCourses();
    var q = S.addQ.trim().toLowerCase();

    var all = GardenData.catalogList().filter(function (c) {
      if (!c || !c.code) return false;
      if (S.addLevel !== 'all' && c.level !== S.addLevel) return false;
      if (!q) return true;
      return (c.code + ' ' + (c.name_ar || '') + ' ' + (c.name_en || '')).toLowerCase().indexOf(q) >= 0;
    });

    /*@3.SEMJ.64*/
    var fresh = [], prev = [];
    all.forEach(function (c) { (done[c.code] ? prev : fresh).push(c); });

    /*@3.SEMJ.65*/
    function item(c) {
      var added = !!have[c.code];
      var d = done[c.code];
      var body =
        /*@3.SEMJ.66*/
        '<span class="sem-swatch sem-pick-sw" style="--sw:' +
          esc(GardenData.courseColor(c.code)) + '" aria-hidden="true"></span>' +
        '<span class="sem-code">' + hi(c.code, q) + '</span>' +
        '<span class="sem-pick-b">' +
          '<span class="sem-pick-n">' + hi(isAr() ? (c.name_ar || c.code) : (c.name_en || c.code), q) + '</span>' +
          '<span class="sem-pick-m">' + esc((isAr() ? c.level_name_ar : c.level_name_en) || '') +
            ' · ' + esc(nOf(c.credits != null ? c.credits : 3, ['ساعة', 'ساعتان', 'ساعات'], ['hr', 'hrs'])) +
            '<span class="cv-slot" data-cv-code="' + esc(c.code) + '" data-cv-flat="1"></span>' +
          '</span>' +
        '</span>';

      if (added) {
        return '<div class="sem-pick-i is-added">' + body +
          '<span class="sem-badge" data-tone="ok"><i class="fa-solid fa-check" aria-hidden="true"></i>' +
            esc(L('مضافة', 'Added')) + '</span>' +
          '<button class="sem-pick-color" type="button" data-acolor="' + esc(c.code) + '" ' +
            'title="' + esc(L('لون المادة', 'Course colour')) + '" ' +
            'aria-label="' + esc(L('لون ' + (isAr() ? (c.name_ar || c.code) : (c.name_en || c.code)),
                                   'Colour of ' + (c.name_en || c.code))) + '">' +
            '<i class="fa-solid fa-palette" aria-hidden="true"></i></button>' +
        '</div>';
      }
      return '<button class="sem-pick-i" type="button" data-add="' + esc(c.code) + '">' + body +
        (d ? '<span class="sem-badge" data-tone="warn">' +
             esc(L('أُتمّت (' + d.grade + ')', 'Passed (' + d.grade + ')')) + '</span>' : '') +
      '</button>';
    }

    var html = '';
    if (fresh.length) html += fresh.map(item).join('');
    if (prev.length) {
      html += foldRow(prev.length);
      if (S.addShowDone) html += prev.map(item).join('');
    }
    if (!html) {
      html = '<div class="sem-empty"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<p>' + esc(L('لا نتائج', 'No results')) + '</p></div>';
    }
    /*@3.SEMJ.141*/
    if (looksCrn(S.addQ)) html = crnPickRow(S.addQ.trim()) + html;
    el('add-list').innerHTML = html;
    fillRateChips(el('add-list'));
  }

  function fillRateChips(host) {
    var V = window.GardenCourseView;
    if (!V || !host) return;
    var slots = [].slice.call(host.querySelectorAll('.cv-slot[data-cv-code]'));
    if (!slots.length) return;
    var codes = {};
    slots.forEach(function (s) { codes[s.getAttribute('data-cv-code')] = 1; });
    V.brief(Object.keys(codes)).then(function (map) {
      slots.forEach(function (s) {
        var code = s.getAttribute('data-cv-code');
        s.innerHTML = V.chip(code, map[code], { flat: !!s.getAttribute('data-cv-flat') });
      });
    });
  }

  /*@3.SEMJ.67*/
  function foldRow(n) {
    var word = nOf(n, ['مادة', 'مادتان', 'مواد'], ['course', 'courses']);
    return '<div class="sem-pick-fold">' +
      /*@3.SEMJ.68*/
      '<span>' + esc(L('أتممتَها سابقاً — ' + word, 'Already passed — ' + word)) + '</span>' +
      '<button class="sem-chip" type="button" data-showdone="' + (S.addShowDone ? '0' : '1') + '" ' +
        'aria-expanded="' + (S.addShowDone ? 'true' : 'false') + '">' +
        '<i class="fa-solid fa-' + (S.addShowDone ? 'eye-slash' : 'eye') + '" aria-hidden="true"></i>' +
        esc(S.addShowDone ? L('أخفِها', 'Hide') : L('أظهرها', 'Show')) +
      '</button>' +
    '</div>';
  }

  /*@3.SEMJ.69*/
  function renderAddColor() {
    var box = el('add-color');
    if (!box || !GardenData.COLOR_PALETTE) return;
    box.innerHTML = GardenData.COLOR_PALETTE.map(function (p) {
      var on = GardenData.normHex(p.hex) === GardenData.normHex(S.addColor);
      var nm = isAr() ? p.ar : p.en;
      return '<button class="gcc-sw" type="button" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" ' +
        'data-acol="' + esc(p.hex) + '" style="--gcc-c:' + esc(p.hex) + '" ' +
        'title="' + esc(nm) + '" aria-label="' + esc(nm) + '">' +
        '<i class="fa-solid fa-check" aria-hidden="true"></i></button>';
    }).join('');
    /*@3.SEMJ.70*/
    if (window.GardenCourseColor) GardenCourseColor.wireGrid(box);
    var w = el('add-color-wheel'); if (w) w.value = S.addColor;
    var h = el('add-color-hex');
    if (h && GardenData.normHex(h.value) !== GardenData.normHex(S.addColor)) {
      h.value = S.addColor.replace(/^#/, '');
    }
  }

  function setAddColor(v) {
    var n = GardenData.normHex(v);
    if (!n) return;
    S.addColor = n;
    renderAddColor();
  }

  /*@3.SEMJ.71*/
  function defaultAddLevel() {
    var key = 'L' + guessLevel();
    var found = levelsOf().some(function (l) { return l.key === key; });
    return found ? key : 'all';
  }

  function openAdd() {
    S.addQ = ''; el('add-q').value = '';
    S.addLevel = defaultAddLevel();
    S.addShowDone = false;
    renderAddLevels(); renderAddList(); renderAddColor();
    el('dlg-add').showModal();
  }

  function ensureSemester() {
    if (S.sem) return;
    S.sem = {
      id: 'sem_' + Date.now(),
      name: L('فصلي', 'My term'), name_ar: 'فصلي', name_en: 'My term',
      courses: [], is_active: true, is_pinned: false, was_activated: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    save();
  }

  function addCatalog(code) {
    ensureSemester();
    if (courses().some(function (c) { return c.code === code; })) return;
    S.sem.courses.push({ code: code, added_at: new Date().toISOString(),
                         completed: false, completed_at: null, grade: null });
    save();
    toast(L('أُضيفت المادة', 'Course added'));
    refresh();
    renderAddList();
  }

  /*@3.SEMJ.72*/

  var restudyCode = null;

  /*@3.SEMJ.73*/
  function learningOf(code, wipe) {
    if (GardenData.courseLearning) return GardenData.courseLearning(code, wipe);
    var out = { cards: 0, quizzes: 0, attempts: 0, keys: 0 };
    if (!code) return out;
    var CODE = String(code), pre = 'garden_' + CODE + '_m';
    var logK = 'garden_' + CODE.toUpperCase() + '_quizlog';
    var kill = [], keys = [];
    try { for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); }
    catch (e) { return out; }
    keys.forEach(function (k) {
      if (!k) return;
      var v = null;
      if (k.indexOf(pre) === 0 && /_m\d+_fc$/.test(k)) {
        try { v = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
        if (v && typeof v === 'object') out.cards += Object.keys(v).length;
        kill.push(k); return;
      }
      if (k.indexOf(pre) === 0 && /_m\d+_quiz$/.test(k)) { out.quizzes++; kill.push(k); return; }
      if (k === logK) {
        try { v = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
        if (Array.isArray(v)) out.attempts += v.length;
        kill.push(k); return;
      }
      if (k === CODE + '_midterm_score' || k === CODE + '_final_score') { out.quizzes++; kill.push(k); }
    });
    out.keys = kill.length;
    if (!wipe || !out.keys) return out;
    kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    try {
      document.dispatchEvent(new CustomEvent('garden:cardsReviewed', { detail: { code: CODE, reset: true } }));
    } catch (e) {}
    return out;
  }

  /*@3.SEMJ.74*/
  function addPicked(code) {
    var d = GardenData.completedCourses()[code];
    if (!d) { addCatalog(code); return; }
    askRestudy(code, d);
  }

  function askRestudy(code, d) {
    restudyCode = code;
    var c = GardenData.courseInfo(code) || {};
    var nm = (isAr() ? (c.name_ar || code) : (c.name_en || code));

    var lr = learningOf(code, false);
    var bits = [];
    if (lr.cards) bits.push(nOf(lr.cards, ['بطاقة', 'بطاقتان', 'بطاقات'], ['card', 'cards']));
    if (lr.quizzes) bits.push(nOf(lr.quizzes, ['اختبار', 'اختباران', 'اختبارات'], ['quiz', 'quizzes'], true));
    if (lr.attempts) bits.push(nOf(lr.attempts, ['محاولة', 'محاولتان', 'محاولات'], ['attempt', 'attempts']));
    var wipeWord = bits.length
      ? L('يُمحى: ' + bits.join(' · '), 'Erased: ' + bits.join(' · '))
      : L('لا تقدّمَ محفوظٌ لها أصلاً', 'There is no saved progress anyway');

    var where = d.semester ? L(' في «' + d.semester + '»', ' in “' + d.semester + '”') : '';
    var body =
      '<div class="sem-note" style="--tint:var(--st-warn,#f59e0b)">' +
        '<i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>' +
        '<span><b>' + esc(L('أتممتَها سابقاً', 'You already passed this')) + '</b> — ' +
          esc(L('بتقدير ', 'with ')) + '<span class="ltr" style="direction:ltr;unicode-bidi:isolate">' +
            esc(d.grade) + '</span>' + esc(where) +
          esc(L('. تستطيع دراستَها من جديد — اختر كيف.',
                '. You can study it again — choose how.')) +
        '</span>' +
      '</div>' +
      '<div class="sem-menu" style="margin-top:.7rem">' +
        menuRow('fresh', 'fa-rotate-right', L('ابدأ من الصفر', 'Start from scratch'),
                L('تُضاف ويُصفَّر تقدّمُك فيها — ' + wipeWord,
                  'It is added and your progress is reset — ' + wipeWord),
                false, false, 'restudy') +
        menuRow('keep', 'fa-clock-rotate-left', L('احتفظ بتقدّمي', 'Keep my progress'),
                L('تُضاف وبطاقاتُك وكويزاتُك تبقى كما تركتَها',
                  'It is added and your cards and quizzes stay as you left them'),
                false, false, 'restudy') +
      '</div>';

    ask(nm, body, L('إلغاء', 'Cancel'), null);
    /*@3.SEMJ.75*/
    el('ask-ok').className = 'sem-btn';
  }

  function doRestudy(mode) {
    var code = restudyCode; restudyCode = null;
    el('dlg-ask').close();
    if (!code) return;
    /*@3.SEMJ.76*/
    if (mode === 'fresh') learningOf(code, true);
    addCatalog(code);
    toast(mode === 'fresh' ? L('أُضيفت — وبدأتَ من الصفر', 'Added — starting fresh')
                           : L('أُضيفت — وتقدّمُك كما تركتَه', 'Added — your progress is intact'));
  }

  function addCustom() {
    var ar = (el('add-name-ar').value || '').trim();
    var en = (el('add-name-en').value || '').trim();
    if (!ar && !en) { toast(L('اكتب اسم المادة', 'Enter the course name')); return; }
    var cr = parseInt(el('add-credits').value, 10);
    if (!(cr > 0)) cr = 3;
    ensureSemester();
    /*@3.SEMJ.77*/
    S.sem.courses.push({
      code: '__CUSTOM_' + Date.now(), custom: true,
      name_ar: ar || en, name_en: en || ar,
      /*@3.SEMJ.78*/
      credits: cr, icon: 'fa-solid fa-book',
      brand_color: GardenData.normHex(S.addColor) || '#64748b',
      added_at: new Date().toISOString(), completed: false, completed_at: null, grade: null
    });
    save();
    el('add-name-ar').value = ''; el('add-name-en').value = ''; el('add-credits').value = '3';
    S.addColor = '#64748b'; renderAddColor();
    toast(L('أُضيفت المادة', 'Course added'));
    refresh();
  }

  /*@3.SEMJ.142*/

  function SXL() { return window.GardenSXLink; }
  function GW() { return window.GardenWatch; }

  /*@3.SEMJ.143*/
  var CRN_RE = /^\d{4,6}$/;
  function looksCrn(s) { return CRN_RE.test(String(s == null ? '' : s).trim()); }

  /*@3.SEMJ.144*/
  var CRN = { code: null, q: '', sec: null, term: null, more: false,
              phase: 'idle', watch: true, busy: false };

  function openCrn(code, prefill) {
    if (!SXL()) { toast(L('ربطُ الشعب غيرُ متاحٍ الآن', 'Section linking is unavailable')); return; }
    CRN = { code: code || null, q: '', sec: null, term: null, more: false,
            phase: 'idle', watch: true, busy: false };
    crnLead();
    el('crn-n').value = prefill ? String(prefill) : '';
    renderCrn();
    el('dlg-crn').showModal();
    if (looksCrn(prefill)) crnLookup(String(prefill).trim());
    /*@3.SEMJ.145*/
    setTimeout(function () { try { el('crn-n').focus(); el('crn-n').select(); } catch (e) {} }, 30);
  }

  /*@3.SEMJ.146*/
  function crnLead() {
    var lead = el('crn-lead');
    if (!lead) return;
    if (!CRN.code) {
      lead.textContent = lead.getAttribute(isAr() ? 'data-ar' : 'data-en') || '';
      return;
    }
    var nm = info({ code: CRN.code }).name;
    lead.textContent = L(
      'أدخل رقم شعبة «' + nm + '» كما هو في البانر — ونجلب مواعيدها وقاعتها ودكتورها ومواعيد اختباراتها إلى جدولك.',
      'Enter the CRN of “' + nm + '” exactly as Banner shows it — we bring its times, room, instructor and exam dates into your schedule.');
  }

  /*@3.SEMJ.147*/
  var crnSeq = 0, crnTimer = 0;

  function crnLookup(q, all) {
    var seq = ++crnSeq;
    CRN.q = q;
    if (!looksCrn(q)) { CRN.phase = 'idle'; CRN.sec = null; renderCrn(); return; }
    if (!SXL().ready()) { CRN.phase = 'offline'; renderCrn(); return; }
    CRN.phase = 'loading'; CRN.sec = null; renderCrn();
    SXL().find(q, { all: !!all }).then(function (r) {
      if (seq !== crnSeq) return;      /*@3.SEMJ.148*/
      CRN.sec = r.sec; CRN.term = r.term; CRN.more = !!r.more;
      CRN.phase = r.sec ? 'found' : 'miss';
      renderCrn();
    }, function () {
      if (seq !== crnSeq) return;
      CRN.phase = 'error'; renderCrn();
    });
  }

  function crnNote(tint, icon, html) {
    var p = el('crn-prev');
    p.hidden = false;
    p.style.setProperty('--tint', tint);
    el('crn-prev-i').className = 'fa-solid ' + icon;
    el('crn-prev-t').innerHTML = html;
  }

  /*@3.SEMJ.149*/
  function crnFacts(s) {
    var f = { days: [], time: '', room: '', remote: false, mid: null, fin: null };
    (s.mg || []).forEach(function (m) {
      if (m.type === 'CLAS' || m.type === 'VRTL') {
        (m.days || []).forEach(function (x) { if (f.days.indexOf(x) < 0) f.days.push(x); });
        if (!f.time) f.time = hhmm(SXL().hm24(m.begin)) + ' – ' + hhmm(SXL().hm24(m.end));
        if (m.type === 'VRTL') f.remote = true;
        else if (!f.room && m.room) f.room = m.room;
      } else if (m.type === 'MEXM') { if (!f.mid) f.mid = m; }
      else if (m.type === 'FEXM') { if (!f.fin) f.fin = m; }
    });
    var order = GardenData.DAYS_ORDER;
    f.days.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    f.label = f.days.map(function (d) { return isAr() ? (DAY_SHORT_AR[d] || d) : (DAY_EN[d] || d); })
                    .join(isAr() ? '، ' : ', ');
    return f;
  }

  /*@3.SEMJ.150*/
  function crnExamWord(m, label) {
    if (!m) return '';
    var d = fmtD(SXL().iso(m.start_date));
    var t = m.begin ? hhmm(SXL().examHM(m.begin)) : '';
    return label + ' ' + d + (t ? ' · ' + t : '');
  }

  /*@3.SEMJ.151*/
  function renderCrn() {
    var body = el('crn-body'), ok = el('crn-ok'), un = el('crn-unlink'), wbox = el('crn-watch-box');
    if (!body) return;
    body.innerHTML = '';
    wbox.hidden = true; wbox.innerHTML = '';
    un.hidden = true;
    ok.disabled = true;
    ok.textContent = L('اربطها', 'Link it');

    if (CRN.phase === 'idle') { el('crn-prev').hidden = true; return; }
    if (CRN.phase === 'loading') {
      crnNote('var(--tint-on)', 'fa-spinner fa-spin',
        esc(L('نفتّش كتالوج الفصل…', 'Searching the term catalog…')));
      return;
    }
    if (CRN.phase === 'offline') {
      crnNote('var(--st-warn, #f59e0b)', 'fa-wifi',
        esc(L('لا اتصالَ بخدمة الشعب الآن — جرّب بعد قليل.',
              'The sections service is unreachable right now — try again shortly.')));
      return;
    }
    if (CRN.phase === 'error') {
      crnNote('var(--st-danger, #ef4444)', 'fa-triangle-exclamation',
        esc(L('تعذّر جلب كتالوج الفصل.', 'Could not load the term catalog.')));
      return;
    }
    if (CRN.phase === 'miss') {
      crnNote('var(--st-danger, #ef4444)', 'fa-circle-question',
        esc(L('لا شعبةَ بهذا الرقم في الفصل الذي نفتّشه.',
              'No section with this CRN in the term we searched.')));
      /*@3.SEMJ.152*/
      if (CRN.more) {
        body.innerHTML = '<button class="sem-cta" type="button" id="crn-all" style="margin-top:.7rem">' +
          '<i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i>' +
          '<span>' + esc(L('فتّش بقيّة الفصول', 'Search the other terms')) + '</span></button>';
      }
      return;
    }

    var s = CRN.sec;
    var linked = SXL().has(String(s.crn), s);
    var other = CRN.code && s.c !== CRN.code;
    var f = crnFacts(s);
    var title = crnTitle(s);

    if (linked) {
      crnNote('var(--st-ok, #10b981)', 'fa-circle-check',
        '<b>' + esc(L('مربوطةٌ في جدولك أصلاً', 'Already linked in your schedule')) + '</b>');
      un.hidden = false;
    } else if (other) {
      /*@3.SEMJ.153*/
      crnNote('var(--st-warn, #f59e0b)', 'fa-shuffle',
        '<b>' + esc(L('هذه الشعبة لمادةٍ أخرى', 'This section belongs to another course')) + '</b> — ' +
        esc(L('ستُضاف مادةٌ جديدةٌ إلى فصلك، ولن تُربط بالمادة التي فتحتَ منها.',
              'A new course will be added to your term; it will not attach to the course you opened this from.')));
    } else {
      crnNote('var(--tint-on)', 'fa-circle-check',
        '<b>' + esc(L('وجدناها', 'Found it')) + '</b>' +
        (title ? ' — ' + esc(title) : ''));
    }

    var h = '';
    h += row('fa-book',
      '<span class="sem-code">' + esc(s.c || '') + '</span>' +
        (title ? ' <span class="sem-r-dim">' + esc(title) + '</span>' : ''),
      '', s.ch ? '<span class="sem-badge">' + esc(crnHours(s.ch)) + '</span>' : '');

    h += f.days.length
      ? row('fa-clock', esc(f.label + (f.time ? ' · ' + f.time : '')), '',
          (f.room ? '<span class="sem-code">' + esc(f.room) + '</span>'
                  : (f.remote ? '<span class="sem-badge">' + esc(L('عن بُعد', 'Remote')) + '</span>' : '')))
      : row('fa-clock', esc(L('بلا مواعيدَ معلنة', 'No published meeting times')), '', '', true);

    /*@3.SEMJ.154*/
    var profs = (s.f || []).map(function (p) { return (p && p.n) || p || ''; })
                           .filter(function (x) { return !!x; });
    h += profs.length
      ? row('fa-chalkboard-user', '<span class="ltr" style="direction:ltr;unicode-bidi:isolate">' +
          esc(profs.join(isAr() ? '، ' : ', ')) + '</span>', '', '')
      : row('fa-chalkboard-user', esc(L('لم يُعيَّن أستاذٌ بعد', 'No instructor assigned yet')), '',
          '<span class="sem-badge" data-tone="warn">' + esc(L('يُنبّهك عند تعيينه', 'We’ll alert you')) + '</span>', true);

    var exams = [crnExamWord(f.mid, L('نصفي', 'Midterm')), crnExamWord(f.fin, L('نهائي', 'Final'))]
      .filter(function (x) { return !!x; });
    h += exams.length
      ? row('fa-file-pen', esc(exams.join(' · ')), '', '')
      : row('fa-file-pen', esc(L('لا مواعيدَ اختباراتٍ في البانر بعد', 'No exam dates in Banner yet')), '', '', true);

    if (s.cm) h += row('fa-location-dot', esc(SXL().campusLabel(s.cm)), '', '');

    /*@3.SEMJ.155*/
    h += crnSeatsRow(s);
    body.innerHTML = h;

    /*@3.SEMJ.156*/
    if (!linked && GW() && GW().ready()) {
      wbox.hidden = false;
      wbox.innerHTML = menuRow('watch', 'fa-bell',
        L('نبّهني بتغيّراتها', 'Alert me on its changes'),
        L('تعيينُ الأستاذ · تغيّرُ الوقت أو القاعة · تحرّكُ مواعيد الاختبارات · إلغاؤها',
          'Instructor assigned · time or room changed · exam dates moved · cancellation'),
        CRN.watch, false, 'crnw');
    }

    ok.disabled = !!linked;
    if (linked) ok.textContent = L('مربوطة', 'Linked');
  }

  /*@3.SEMJ.157*/
  function crnTitle(s) {
    var cat = GardenData.courseInfo(s.c);
    if (cat) return isAr() ? (cat.name_ar || cat.name_en || '') : (cat.name_en || cat.name_ar || '');
    return String(s.t || '').replace(/&amp;/g, '&');
  }

  function crnHours(ch) {
    var n = parseFloat(ch);
    if (!(n > 0)) return '';
    return nOf(n, ['ساعة', 'ساعتان', 'ساعات'], ['hr', 'hrs']);
  }

  /*@3.SEMJ.158*/
  function crnSeatsRow(s) {
    var max = s.m || 0, avail = s.a == null ? 0 : s.a;
    if (!max || max >= 1000) {
      return row('fa-chair', esc(L('سعةٌ غير محدودة', 'Unlimited capacity')), '', '');
    }
    var taken = Math.max(0, max - Math.max(0, avail));
    var tone = avail <= 0 ? 'bad' : (avail <= 3 ? 'warn' : 'ok');
    return row('fa-chair',
      esc(L('مقاعدُها ' + taken + ' من ' + max, taken + ' of ' + max + ' seats taken')), '',
      '<span class="sem-badge" data-tone="' + tone + '">' +
        esc(avail <= 0 ? L('ممتلئة', 'Full') : L('باقٍ ' + avail, avail + ' left')) + '</span>');
  }

  /*@3.SEMJ.159*/
  function doCrnLink() {
    var s = CRN.sec;
    if (!s || CRN.busy || !SXL()) return;
    CRN.busy = true;
    var r = SXL().register([s]);
    CRN.busy = false;
    if (!r.saved) {
      toast(L('تعذّر الحفظ — مساحةُ التخزين ممتلئة', 'Could not save — storage is full'));
      return;
    }
    if (!r.report.added && !r.report.updated) {
      toast(L('لا جديدَ في هذه الشعبة يُضاف لجدولك', 'Nothing new in this section to add'));
      renderCrn();
      return;
    }
    var crn = String(s.crn);
    /*@3.SEMJ.160*/
    GardenData.adoptPending([s.c]).then(function () {
      crnArmWatch(crn);
      el('dlg-crn').close();
      refresh();
      if (el('dlg-add').open) renderAddList();
      toast(L('رُبطت الشعبة — والمادةُ الآن في فصلك وجدولك',
              'Section linked — the course is now in your term and schedule'));
    });
  }

  /*@3.SEMJ.161*/
  function crnArmWatch(crn) {
    if (!CRN.watch) return;
    var W = GW();
    if (!W || !W.ready() || !CRN.term) return;
    if (W.has('changes', CRN.term, crn)) return;
    W.toggle('changes', CRN.term, crn).then(function (res) {
      if (res && res.error) {
        toast(L('رُبطت — لكن تعذّر تفعيلُ تنبيهاتها', 'Linked — but its alerts could not be turned on'));
      }
    });
  }

  /*@3.SEMJ.162*/
  function doCrnUnlink() {
    var s = CRN.sec;
    if (!s || !SXL()) return;
    var n = SXL().unregister(String(s.crn), s);
    refresh();
    if (el('dlg-add').open) renderAddList();
    renderCrn();
    toast(n ? L('فُكّ ربطُ الشعبة', 'Section unlinked')
            : L('لم يبقَ منها شيءٌ في جدولك', 'Nothing of it was left in your schedule'));
  }

  /*@3.SEMJ.163*/
  function crnPickRow(q) {
    return '<button class="sem-pick-i" type="button" data-crn-q="' + esc(q) + '">' +
      '<span class="sem-swatch sem-pick-sw" style="--sw:var(--st-accent, #a78bfa)" aria-hidden="true"></span>' +
      '<span class="sem-code">' + esc(q) + '</span>' +
      '<span class="sem-pick-b">' +
        '<span class="sem-pick-n">' + esc(L('اربط الشعبة بهذا الرقم', 'Link the section with this CRN')) + '</span>' +
        '<span class="sem-pick-m">' +
          esc(L('نجلب مادتَها ومواعيدَها ودكتورَها من البانر',
                'We pull its course, times and instructor from Banner')) + '</span>' +
      '</span>' +
      '<span class="sem-badge" data-tone="accent">' + esc(L('شعبة', 'CRN')) + '</span>' +
    '</button>';
  }

  /*@3.SEMJ.79*/

  var menuCode = null;

  function openCourseMenu(code) {
    menuCode = code;
    var entry = courses().filter(function (c) { return c.code === code; })[0];
    if (!entry) return;
    var i = info(entry);
    var fin = null;
    (S.sched.exams || []).forEach(function (e) {
      if (e && e.course_code === code && e.exam_type === 'final' && e.date) {
        if (!fin || e.date > fin) fin = e.date;
      }
    });
    var auto = entry.done_manual !== true && entry.done_manual !== false;
    var done = GardenData.courseDone(entry);

    var why;
    if (!auto) {
      why = entry.done_manual
        ? L('أنت قلتَ إنها انتهت.', 'You marked it finished.')
        : L('أنت قلتَ إنها لم تنتهِ.', 'You marked it unfinished.');
    } else if (fin) {
      var dd = GardenData.daysUntil(fin);
      why = dd < 0
        ? L('انتهت تلقائياً — مضى اختبارُها النهائيُّ في ' + fmtD(fin) + '.',
            'Auto-finished — its final exam was on ' + fmtD(fin) + '.')
        : L('نهائيُّها في ' + fmtD(fin) + ' — تنتهي تلقائياً بعده.',
            'Its final is on ' + fmtD(fin) + ' — it finishes automatically after that.');
    } else {
      why = L('لا تاريخَ لنهائيّها في جدولك — سجّله من الشعب أو الجدول ليُحسم تلقائياً.',
              'No final-exam date in your schedule — add it from Sections or Schedule to settle this automatically.');
    }

    var body =
      '<div class="sem-note"' + (done ? ' style="--tint:var(--st-ok,#10b981)"' : '') + '>' +
        '<i class="fa-solid ' + (done ? 'fa-flag-checkered' : 'fa-hourglass-half') + '" aria-hidden="true"></i>' +
        '<span><b>' + esc(done ? L('منتهية', 'Finished') : L('جارية', 'In progress')) + '</b> — ' + esc(why) + '</span>' +
      '</div>' +
      '<div class="sem-menu">' +
        menuRow('auto', 'fa-wand-magic-sparkles', L('تلقائي (حسب النهائي)', 'Automatic (by final exam)'),
                L('الأصل — تنتهي بعد اختبارها النهائيّ', 'Default — finishes after its final exam'), auto) +
        menuRow('done', 'fa-check', L('انتهت', 'Finished'),
                L('أنهيتُها ولو لم يأتِ موعدُ نهائيّها', 'I’m done with it, whatever the date says'),
                !auto && entry.done_manual === true) +
        menuRow('open', 'fa-rotate-left', L('لم تنتهِ بعد', 'Not finished'),
                L('ما زلتُ أدرسها', 'I’m still studying it'),
                !auto && entry.done_manual === false) +
      '</div>' +
      /*@3.SEMJ.80*/
      '<div class="sem-menu" style="margin-top:.7rem">' +
        '<button class="sem-mrow" type="button" data-cm="color">' +
          '<i class="fa-solid fa-palette" aria-hidden="true"></i>' +
          '<span class="sem-mrow-b"><span class="sem-mrow-t">' +
            esc(L('لون المادة', 'Course colour')) + '</span>' +
            '<span class="sem-mrow-s">' + esc(colorWord(entry)) + '</span></span>' +
          /*@3.SEMJ.81*/
          '<span class="sem-swatch" style="--sw:' + esc(i.color) + '" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
      '<div class="sem-menu" style="margin-top:.7rem">' +
        menuRow('retake', 'fa-repeat', L('أعِد المادة', 'Retake the course'),
                L('رسبتُ فيها وأدرسها من جديد — يُمسح تقديرُها وتعود جارية',
                  'I failed it and I’m taking it again — its grade is cleared and it reopens'), false) +
        menuRow('remove', 'fa-trash', L('أخرِجها من فصلي', 'Remove from my term'), '', false, true) +
      '</div>';

    ask(i.name, body, L('إغلاق', 'Close'), null);
    /*@3.SEMJ.82*/
    el('ask-ok').className = 'sem-btn';
  }

  /*@3.SEMJ.83*/
  function colorWord(entry) {
    var src = GardenData.courseColorSource(entry.code, entry);
    if (src === 'custom') return L('لونٌ اخترتَه — غيّره أو أعِد الأصليّ',
                                   'A colour you chose — change it or restore');
    if (src === 'catalog') return L('لونُها الأصليّ — اختر غيرَه إن شئت',
                                    'Its original colour — pick another if you like');
    return L('بلا لونٍ خاصّ — اختر لها لوناً', 'No colour yet — pick one');
  }

  function openColor(code) {
    if (!window.GardenCourseColor) return;
    var entry = courses().filter(function (c) { return c.code === code; })[0];
    GardenCourseColor.open(code, {
      courseName: info(entry || { code: code }).name,
      entry: entry,
      /*@3.SEMJ.84*/
      onPick: function (hex) {
        refresh();
        /*@3.SEMJ.85*/
        var add = el('dlg-add');
        if (add && add.open) renderAddList();
        /*@3.SEMJ.86*/
        var row = $('#dlg-ask-b [data-cm="color"]');
        if (!row) return;
        var sw = $('.sem-swatch', row);
        if (sw) sw.style.setProperty('--sw', hex);
        var sub = $('.sem-mrow-s', row);
        /*@3.SEMJ.87*/
        if (sub) sub.textContent = colorWord(
          courses().filter(function (c) { return c.code === code; })[0] || { code: code });
      }
    });
  }

  /*@3.SEMJ.88*/
  function menuRow(act, icon, title, sub, on, danger, attr) {
    return '<button class="sem-mrow' + (on ? ' is-on' : '') + (danger ? ' is-danger' : '') +
        '" type="button" data-' + (attr || 'cm') + '="' + act + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span class="sem-mrow-b"><span class="sem-mrow-t">' + esc(title) + '</span>' +
      (sub ? '<span class="sem-mrow-s">' + esc(sub) + '</span>' : '') + '</span>' +
      (on ? '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' : '') +
    '</button>';
  }

  function courseMenuAct(act) {
    var code = menuCode;
    var entry = courses().filter(function (c) { return c.code === code; })[0];
    if (!entry) return;
    if (act === 'remove') { el('dlg-ask').close(); askRemove(code); return; }
    /*@3.SEMJ.89*/
    if (act === 'color') { openColor(code); return; }

    if (act === 'auto') { delete entry.done_manual; }
    else if (act === 'done') { entry.done_manual = true; entry.completed = true; entry.completed_at = entry.completed_at || new Date().toISOString(); }
    else if (act === 'open') { entry.done_manual = false; entry.completed = false; }
    else if (act === 'retake') {
      /*@3.SEMJ.90*/
      entry.done_manual = false;
      entry.completed = false;
      entry.completed_at = null;
      entry.grade = null;
      entry.retaken_at = new Date().toISOString();
    }
    save();
    try { GardenData.rebuildGrades(); } catch (e) {}
    el('dlg-ask').close();
    refresh();
    toast(act === 'retake' ? L('أُعيدت المادة — عادت جارية', 'Course reopened')
                           : L('حُفظ ✓', 'Saved ✓'));
    if (act === 'done') rateNudge(code);
  }

  var NUDGE_KEY = 'gd_rate_nudged';
  function nudged() {
    try { return JSON.parse(localStorage.getItem(NUDGE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function markNudged(code) {
    var m = nudged(); m[code] = 1;
    try { localStorage.setItem(NUDGE_KEY, JSON.stringify(m)); } catch (e) {}
  }

  /*@3.SEMJ.182*/
  function pickedTerm() {
    try {
      var p = JSON.parse(localStorage.getItem('student_profile') || '{}') || {};
      var v = p.picks && p.picks.term;
      return /^\d{6}$/.test(String(v || '')) ? String(v) : '';
    } catch (e) { return ''; }
  }

  /*@3.SEMJ.183*/
  function bannerInsOf(code) {
    var ins = (GardenData.courseMeta(code).instructors || [])[0];
    if (!ins || !ins.name) return '';
    var GF = window.GardenFaculty;
    if (GF && GF.data()) {
      var f = (ins.email && GF.byEmail(ins.email)) || GF.byBannerName(ins.name);
      if (f && f.link && f.link.n) return f.link.n;
    }
    return String(ins.name);
  }

  /*@3.SEMJ.171*/
  function rateNudge(code) {
    if (!window.GardenCourseRate || !/^[A-Z]{2,4}[0-9]{2,4}$/.test(String(code))) return;
    var F = window.GardenFlags;
    if (F && F.get('ratings.course.enabled') === false) return;
    if (nudged()[code]) return;
    markNudged(code);

    var box = document.createElement('div');
    box.className = 'sem-nudge';
    box.innerHTML =
      '<p class="sem-nudge-t">' + esc(L('كيف كانت ' + code + '؟', 'How was ' + code + '?')) + '</p>' +
      '<p class="sem-nudge-d">' + esc(L(
        'أنهيتَها للتوّ — وهذه أدقُّ لحظةٍ تتذكّر فيها. دقيقةٌ منك تختصر فصلاً على من يأتي بعدك.',
        'You just finished it — this is when you remember best. A minute from you saves a term for the next student.')) + '</p>' +
      '<div class="sem-nudge-a">' +
        '<button type="button" class="sem-chip" data-nudge="no">' + esc(L('لاحقاً', 'Later')) + '</button>' +
        '<button type="button" class="sem-chip is-go" data-nudge="yes">' + esc(L('قيّمها الآن', 'Rate it now')) + '</button>' +
      '</div>';
    document.body.appendChild(box);

    var close = function () { if (box.parentNode) box.parentNode.removeChild(box); };
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-nudge]');
      if (!b) return;
      close();
      if (b.getAttribute('data-nudge') === 'yes') {
        /*@3.SEMJ.184*/
        GardenCourseRate.open({
          code: code, name: info({ code: code }).name,
          term: pickedTerm(), instructor: bannerInsOf(code),
        });
      }
    });
    setTimeout(close, 20000);
  }

  /*@3.SEMJ.91*/

  function openIns(code) {
    if (!window.GardenInsPicker) return;
    GardenInsPicker.open(code, {
      courseName: info({ code: code }).name,
      onSave: function (rec) {
        refresh();
        toast(rec ? L('حُفظ الدكتور', 'Instructor saved')
                  : L('أُزيل الدكتور', 'Instructor removed'));
      }
    });
  }

  /*@3.SEMJ.92*/

  function BN() { return window.GardenBiName; }

  /*@3.SEMJ.93*/
  function guessLevel() {
    var n = parseInt(S.sem && S.sem.level, 10);
    if (n >= 1) return n;
    var b = BN();
    return (b && b.currentLevel) ? b.currentLevel() : 3;
  }

  /*@3.SEMJ.94*/
  function stampPair(o, pair) {
    o.name = pair.ar; o.name_ar = pair.ar; o.name_en = pair.en;
    if (pair.level) { o.level = pair.level; o.summer = false; o.term = 'regular'; }
    else { delete o.level; o.summer = true; o.term = 'summer'; }
    return o;
  }

  function newSemester(pair, key) {
    S.sem = stampPair({
      id: 'sem_' + Date.now(),
      courses: [], is_active: true, is_pinned: false, was_activated: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }, pair);
    /*@3.SEMJ.177*/
    if (key) S.sem.roll_done = key;
    try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
    save();
    refresh();
  }

  function applyPair(pair, key) {
    if (!S.sem) return;
    stampPair(S.sem, pair);
    if (key) S.sem.roll_done = key;
    delete S.sem.roll_off;
    save();
    refresh();
  }

  var lvMode = 'create', lvMore = false;

  function openLevel(mode) {
    var b = BN();
    /*@3.SEMJ.95*/
    if (!b || !b.suggestPairs) { openName(mode); return; }
    lvMode = mode;
    lvMore = false;
    el('dlg-level-t').textContent = mode === 'create'
      ? L('أنشئ فصلك', 'Create your semester') : L('سمِّ فصلك', 'Name your semester');
    renderLevelList();
    el('dlg-level').showModal();
    /*@3.SEMJ.96*/
    setTimeout(function () { try { $('[data-lvpick]', el('lv-top')).focus(); } catch (e) {} }, 30);
  }

  /*@3.SEMJ.174*/
  function renderLevelList() {
    var b = BN();
    if (!b) return;
    var cur = lvMode === 'rename' ? parseInt(S.sem && S.sem.level, 10) : NaN;
    var s = b.suggestPairs(cur >= 1 ? cur : null);
    el('lv-top').innerHTML = s.top.map(lvBtn).join('');
    el('lv-rest').innerHTML = s.rest.map(lvBtn).join('');
    el('lv-rest').hidden = !lvMore;
    el('lv-more').hidden = !s.rest.length;
    el('lv-more').setAttribute('data-open', lvMore ? '1' : '0');
    el('lv-more').setAttribute('aria-expanded', lvMore ? 'true' : 'false');
    $('span', el('lv-more')).textContent = lvMore ? L('أقلّ', 'Less') : L('مزيد', 'More');
  }

  function lvBtn(p) {
    var now = S.sem && GardenData.dispName(S.sem);
    var on = lvMode === 'rename' && now && (now === p.ar || now === p.en);
    return '<button class="sem-lv" type="button" data-lvpick="' + (p.summer ? 's' : p.level) + '"' +
      (p.primary ? ' data-primary="1"' : '') + (on ? ' data-on="1"' : '') + '>' +
      '<span class="sem-lv-ar">' + esc(p.ar) + '</span>' +
      '<span class="sem-lv-en">' + esc(p.en) + '</span>' +
      (p.primary ? '<span class="sem-lv-tag">' + esc(L('مقترح', 'Suggested')) + '</span>' : '') +
      '</button>';
  }

  function openCreate() { openLevel('create'); }

  /*@3.SEMJ.172*/
  function nextPair() {
    var b = BN();
    if (!b || !S.sem) return null;
    var n = parseInt(S.sem.level, 10);
    if (S.sem.summer || S.sem.term === 'summer') {
      return b.levelPair(Math.max(b.currentLevel(), n >= 1 ? n : 1));
    }
    if (!(n >= 1)) n = b.currentLevel();
    return b.isSummerNow() ? b.summerPair() : b.levelPair(Math.min(b.MAX_LEVEL, n + 1));
  }

  /*@3.SEMJ.173*/
  function rollKey() {
    if (!S.sem) return null;
    var arc = termArc();
    if (arc && arc.after) return 'end:' + arc.end;
    var b = BN();
    if (b && !b.isSummerNow() && (S.sem.summer || S.sem.term === 'summer')) {
      return 'sum:' + new Date().getFullYear();
    }
    return null;
  }

  function rollPending() {
    if (!S.sem) return null;
    var k = rollKey();
    if (!k || S.sem.roll_done === k) return null;
    var p = nextPair();
    if (!p || p.ar === S.sem.name_ar) return null;
    /*@3.SEMJ.176*/
    if (!courses().length) {
      stampPair(S.sem, p);
      S.sem.roll_done = k;
      delete S.sem.roll_off;
      save();
      return null;
    }
    return S.sem.roll_off === k ? null : { pair: p, key: k };
  }

  function renderRoll() {
    var box = el('sem-roll');
    var r = S.roll;
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    var old = GardenData.dispName(S.sem);
    var nu = isAr() ? r.pair.ar : r.pair.en;
    el('sem-roll-h').textContent = L('انتهى «' + old + '»', '“' + old + '” has ended');
    el('sem-roll-p').textContent = L(
      'نؤرشفه بموادّه ودرجاته تحت اسمه، ونفتح لك «' + nu + '» فارغاً.',
      'We’ll archive it with its courses and grades under its own name, and open an empty “' + nu + '” for you.');
    el('sem-roll-go-t').textContent = L('أرشِفه وابدأ «' + nu + '»', 'Archive it and start “' + nu + '”');
  }

  function doRoll() {
    var r = S.roll;
    if (!r || !S.sem) return;
    var s = archiveStats({ courses: S.sem.courses });
    var arch = GardenData.archive() || [];
    arch.push({
      id: S.sem.id,
      name: S.sem.name || S.sem.name_ar || S.sem.name_en,
      name_ar: S.sem.name_ar || S.sem.name,
      name_en: S.sem.name_en || S.sem.name,
      level: S.sem.level, term: S.sem.term,
      courses: S.sem.courses,
      gpa: s.gpa, total_credits: s.credits,
      created_at: S.sem.created_at,
      archived_at: new Date().toISOString()
    });
    saveArchive(arch);
    newSemester(r.pair, r.key);
    toast(L('أُرشف فصلُك السابق، وبدأ «' + r.pair.ar + '»',
            'Your past term is archived — “' + r.pair.en + '” has begun'));
  }

  /*@3.SEMJ.98*/

  var nameMode = 'rename';
  function openName(mode) {
    nameMode = mode;
    el('dlg-name-t').textContent = mode === 'create'
      ? L('أنشئ فصلك', 'Create your semester') : L('اسم الفصل', 'Semester name');
    el('nm-ar').value = (mode === 'create') ? '' : (S.sem && S.sem.name_ar) || (S.sem && S.sem.name) || '';
    el('nm-en').value = (mode === 'create') ? '' : (S.sem && S.sem.name_en) || '';
    /*@3.SEMJ.178*/
    if (BN() && !el('nm-ar').dataset.biBound) {
      el('nm-ar').dataset.biBound = '1';
      BN().attach({ ar: el('nm-ar'), en: el('nm-en'), suggest: false });
    }
    el('dlg-name').showModal();
    setTimeout(function () { try { el('nm-ar').focus(); } catch (e) {} }, 30);
  }
  function saveName() {
    var ar = (el('nm-ar').value || '').trim();
    var en = (el('nm-en').value || '').trim();
    if (!ar && !en) { toast(L('اكتب اسماً', 'Enter a name')); return; }
    if (nameMode === 'create') {
      S.sem = {
        id: 'sem_' + Date.now(),
        name: ar || en, name_ar: ar || en, name_en: en || ar,
        courses: [], is_active: true, is_pinned: false, was_activated: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
    } else {
      /*@3.SEMJ.99*/
      S.sem.name = ar || en;
      S.sem.name_ar = ar || en;
      S.sem.name_en = en || ar;
    }
    save();
    el('dlg-name').close();
    refresh();
    toast(L('حُفظ ✓', 'Saved ✓'));
  }

  /*@3.SEMJ.100*/

  var askFn = null;
  function ask(title, bodyHtml, okText, fn) {
    el('dlg-ask-t').textContent = title;
    el('dlg-ask-b').innerHTML = bodyHtml;
    /*@3.SEMJ.101*/
    el('ask-ok').className = 'sem-btn sem-btn--danger';
    el('ask-ok').textContent = okText;
    askFn = fn;
    el('dlg-ask').showModal();
  }

  /*@3.SEMJ.102*/
  function traceOf(code, wipe) {
    if (GardenData.courseTraces) return GardenData.courseTraces(code, wipe);
    return localTraces(code, wipe);
  }

  function localTraces(code, wipe) {
    var out = { lectures: 0, study: 0, exams: 0, tasks: 0, archived: 0, pending: 0, plans: 0 };
    if (!code) return out;
    var F = [['lectures', 'lectures'], ['study_blocks', 'study'], ['exams', 'exams']];
    var s = GardenData.scheduleRaw(), dirty = false;
    F.forEach(function (f) {
      var list = s[f[0]] || [];
      var keep = list.filter(function (x) { return !x || x.course_code !== code; });
      out[f[1]] = list.length - keep.length;
      if (out[f[1]] && wipe) { s[f[0]] = keep; dirty = true; }
    });
    var b = s.archived && s.archived[code];
    if (b) {
      F.forEach(function (f) { out.archived += (b[f[0]] || []).length; });
      if (out.archived && wipe) { delete s.archived[code]; dirty = true; }
    }
    if (s.sx_pending && Array.isArray(s.sx_pending.courses)) {
      var pc = s.sx_pending.courses.filter(function (c) { return !c || c.code !== code; });
      out.pending = s.sx_pending.courses.length - pc.length;
      if (out.pending && wipe) { s.sx_pending.courses = pc; dirty = true; }
    }
    /*@3.SEMJ.103*/
    var ints = s.intensive;
    if (ints && typeof ints === 'object') {
      Object.keys(ints.plans || {}).forEach(function (tab) {
        var p = ints.plans[tab];
        if (!p || typeof p !== 'object') return;
        if (Array.isArray(p.courses)) {
          var kc = p.courses.filter(function (c) { return c !== code; });
          out.plans += p.courses.length - kc.length;
          if (kc.length !== p.courses.length && wipe) { p.courses = kc; dirty = true; }
        }
        if (Array.isArray(p.sessions)) {
          var ks = p.sessions.filter(function (x) { return !x || x.course !== code; });
          out.plans += p.sessions.length - ks.length;
          if (ks.length !== p.sessions.length && wipe) { p.sessions = ks; dirty = true; }
        }
        ['exam_dates', 'modules'].forEach(function (k) {
          if (p[k] && typeof p[k] === 'object' && p[k][code] !== undefined) {
            out.plans++;
            if (wipe) { delete p[k][code]; dirty = true; }
          }
        });
      });
      var ms = ints.module_status;
      if (ms && typeof ms === 'object') {
        Object.keys(ms).forEach(function (k) {
          if (k.indexOf(code + '_') !== 0) return;
          out.plans++;
          if (wipe) { delete ms[k]; dirty = true; }
        });
      }
    }
    if (dirty) {
      s.updated_at = new Date().toISOString();
      try { localStorage.setItem('weekly_schedule', JSON.stringify(s)); } catch (e) {}
      try { localStorage.setItem('__syncT_weekly_schedule', String(Date.now())); } catch (e) {}
    }
    var tl = GardenData.tasks();
    out.tasks = tl.filter(function (t) { return t && t.course === code; }).length;
    /*@3.SEMJ.104*/
    if (out.tasks && wipe) {
      tl.forEach(function (t) { if (t && t.course === code) GardenData.deleteTask(t.id); });
    }
    return out;
  }

  function askRemove(code) {
    var entry = courses().filter(function (c) { return c.code === code; })[0];
    if (!entry) return;
    /*@3.SEMJ.105*/
    var i = info(entry), t;
    try { t = traceOf(code); }
    catch (e) { t = { lectures: 0, study: 0, exams: 0, tasks: 0, archived: 0, pending: 0, plans: 0 }; }
    var bits = [];
    if (t.lectures) bits.push(nOf(t.lectures, ['محاضرة', 'محاضرتان', 'محاضرات'], ['lecture', 'lectures']));
    /*@3.SEMJ.106*/
    if (t.study) bits.push(nOf(t.study, ['بلوك مذاكرة', 'بلوكا مذاكرة', 'بلوكات مذاكرة'], ['study block', 'study blocks'], true));
    if (t.exams) bits.push(nOf(t.exams, ['اختبار', 'اختباران', 'اختبارات'], ['exam', 'exams'], true));
    if (t.tasks) bits.push(nOf(t.tasks, ['مهمة', 'مهمتان', 'مهام'], ['task', 'tasks']));
    if (t.archived) bits.push(nOf(t.archived, ['حدث مؤرشف', 'حدثان مؤرشفان', 'أحداث مؤرشفة'], ['archived event', 'archived events'], true));
    /*@3.SEMJ.107*/
    if (t.plans) bits.push(nOf(t.plans, ['بند في خطط المذاكرة', 'بندان في خطط المذاكرة', 'بنود في خطط المذاكرة'], ['study-plan entry', 'study-plan entries'], true));

    var body = '<p style="margin:0 0 .7rem;font-size:.86rem">' +
      esc(L('ستخرج ', 'Removing ')) + '<b>' + esc(i.name) + '</b>' +
      esc(L(' من فصلك.', ' from your term.')) + '</p>';
    if (bits.length) {
      /*@3.SEMJ.108*/
      body += '<div class="sem-note" style="--tint:var(--st-danger,#ef4444)">' +
        '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<span>' + esc(L('لها ' + bits.join(' و') + ' — ',
                          'It has ' + bits.join(', ') + ' — ')) +
        '<b>' + esc(L('ستُحذف كلُّها معها', 'all will be deleted with it')) + '</b>' +
        esc(L('، ولا يمكن التراجع.', ', and this cannot be undone.')) +
        '</span></div>';
    }
    /*@3.SEMJ.109*/
    body += '<div class="sem-note"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i>' +
      '<span>' + esc(L('تبقى لك: بطاقاتُها ودرجاتُ كويزاتها وملاحظاتُك عليها.',
                        'Kept: its flashcards, quiz scores, and your notes.')) + '</span></div>';

    ask(L('إخراج المادة', 'Remove course'), body, L('أخرِجها وامحُ أثرَها', 'Remove and wipe'), function () {
      /*@3.SEMJ.110*/
      S.sem.courses = courses().filter(function (c) { return c.code !== code; });
      save();
      var gone = { lectures: 0, study: 0, exams: 0, tasks: 0, archived: 0, pending: 0, plans: 0 };
      try { gone = traceOf(code, true); } catch (e) {}
      try { GardenData.rebuildGrades(); } catch (e) {}
      /*@3.SEMJ.111*/
      S.sched = GardenData.scheduleRaw();
      refresh();
      var n = gone.lectures + gone.study + gone.exams + gone.tasks + gone.archived + gone.plans;
      toast(n
        ? L('أُخرجت ومُحي أثرُها (' + n + ')', 'Removed with its ' + n + ' items')
        : L('أُخرجت من فصلك', 'Removed from your term'));
    });
  }

  function askArchive() {
    var list = courses();
    var st = { credits: 0, graded: 0 };
    list.forEach(function (c) {
      st.credits += info(c).credits;
      if (c.grade && GardenData.GPA_SCALE[c.grade] !== undefined) st.graded++;
    });
    var body = '<p style="margin:0 0 .7rem;font-size:.86rem">' +
      esc(L('ينتقل ', 'Move ')) + '<b>' + esc(GardenData.dispName(S.sem)) + '</b>' +
      esc(L(' إلى الفصول السابقة بموادّه ودرجاته، وتبدأ بفصلٍ فارغ.',
             ' to your past semesters with its courses and grades, and start with an empty term.')) + '</p>';
    /*@3.SEMJ.112*/
    if (st.graded < list.length) {
      body += '<div class="sem-note" data-kind="warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<span>' + esc(L(
          (list.length - st.graded) + ' من موادّك بلا درجة — تُؤرشَف بلا درجة ولا تدخل معدّلك. أدخِلها من صفحة المعدل أولاً إن شئت.',
          (list.length - st.graded) + ' of your courses have no grade — they will be archived ungraded and won’t count toward your GPA.')) +
        '</span></div>';
    }
    ask(L('أرشفة الفصل', 'Archive semester'), body, L('أرشِفه', 'Archive'), function () {
      var s = archiveStats({ courses: S.sem.courses });
      var arch = GardenData.archive() || [];
      arch.push({
        id: S.sem.id,
        name: S.sem.name || S.sem.name_ar || S.sem.name_en,
        /*@3.SEMJ.113*/
        name_ar: S.sem.name_ar || S.sem.name,
        name_en: S.sem.name_en || S.sem.name,
        level: S.sem.level, term: S.sem.term,
        courses: S.sem.courses,
        gpa: s.gpa, total_credits: s.credits,
        created_at: S.sem.created_at,
        archived_at: new Date().toISOString()
      });
      /*@3.SEMJ.114*/
      try { localStorage.removeItem('my_semester'); } catch (e) {}
      try { localStorage.setItem('__syncT_my_semester', String(Date.now())); } catch (e) {}
      try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
      S.sem = null;
      saveArchive(arch);
      refresh();
      toast(L('أُرشف فصلك', 'Semester archived'));
    });
  }

  function askRestore(id) {
    var arch = GardenData.archive() || [];
    var a = arch.filter(function (x) { return x && x.id === id; })[0];
    if (!a) return;
    var body = '<p style="margin:0;font-size:.86rem">' +
      esc(L('يعود ', 'Restore ')) + '<b>' + esc(GardenData.dispName(a)) + '</b>' +
      esc(L(' فصلاً جارياً.', ' as your current term.')) + '</p>';
    if (S.sem && courses().length) {
      body += '<div class="sem-note" data-kind="warn"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>' +
        '<span>' + esc(L('وفصلُك الحالي يُؤرشَف مكانه.', 'Your current term will be archived in its place.')) +
        '</span></div>';
    }
    ask(L('استرجاع فصل', 'Restore semester'), body, L('استرجِعه', 'Restore'), function () {
      var list = GardenData.archive() || [];
      if (S.sem && courses().length) {
        var s = archiveStats({ courses: S.sem.courses });
        list.push({
          id: S.sem.id, name: S.sem.name || S.sem.name_ar,
          name_ar: S.sem.name_ar || S.sem.name, name_en: S.sem.name_en || S.sem.name,
          level: S.sem.level, term: S.sem.term,
          courses: S.sem.courses, gpa: s.gpa, total_credits: s.credits,
          created_at: S.sem.created_at, archived_at: new Date().toISOString()
        });
      }
      /*@3.SEMJ.115*/
      S.sem = {
        id: a.id,
        name: a.name || a.name_ar || a.name_en,
        name_ar: a.name_ar || a.name,
        name_en: a.name_en || a.name,
        level: a.level, term: a.term,
        courses: a.courses || [],
        is_active: true, is_pinned: false, was_activated: false,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      /*@3.SEMJ.116*/
      save();
      try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
      saveArchive(list.filter(function (x) { return x && x.id !== id; }));
      refresh();
      toast(L('استُرجع الفصل', 'Semester restored'));
    });
  }

  function askDeleteArchive(id) {
    var arch = GardenData.archive() || [];
    var a = arch.filter(function (x) { return x && x.id === id; })[0];
    if (!a) return;
    var s = archiveStats(a);
    var body = '<p style="margin:0;font-size:.86rem">' +
      esc(L('يُحذف ', 'Delete ')) + '<b>' + esc(GardenData.dispName(a)) + '</b>' +
      esc(L(' من سجلّك نهائياً.', ' from your record permanently.')) + '</p>' +
      (s.graded ? '<div class="sem-note" data-kind="warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<span>' + esc(L('فيه درجاتٌ تدخل معدّلك التراكمي — سينقص بحذفه.',
                          'It holds graded courses that count toward your CGPA — deleting it will change your CGPA.')) +
        '</span></div>' : '');
    ask(L('حذف فصل مؤرشف', 'Delete archived semester'), body, L('احذفه', 'Delete'), function () {
      saveArchive(arch.filter(function (x) { return x && x.id !== id; }));
      refresh();
      toast(L('حُذف الفصل', 'Semester deleted'));
    });
  }

  /*@3.SEMJ.117*/

  function refresh() {
    readAll();
    var live = !!(S.sem && Array.isArray(S.sem.courses));
    el('sem-live').hidden = !live;
    el('sem-hero').hidden = live;

    if (!live) {
      el('sem-hero-adopt').hidden = !S.pending.length;
      renderArchiveOnlyHero();
      return;
    }
    S.roll = rollPending();
    renderHead();
    renderRoll();
    renderPending();
    renderArc();
    renderStats();
    renderNext();
    renderCourses();
    renderRhythm();
    renderArchive();
    spy();
  }

  /*@3.SEMJ.118*/
  function renderArchiveOnlyHero() {
    var arch = GardenData.archive() || [];
    var host = el('sem-hero');
    var old = $('#sem-hero-arch', host);
    if (old) old.remove();
    if (!arch.length) return;
    var a = document.createElement('a');
    a.id = 'sem-hero-arch';
    a.className = 'sem-cta';
    a.href = '#';
    a.innerHTML = '<i class="fa-solid fa-box-archive" aria-hidden="true"></i><span>' +
      esc(L('لديك ' + nOf(arch.length, ['فصل مؤرشف', 'فصلان مؤرشفان', 'فصول مؤرشفة'], ['archived term', 'archived terms'], true),
            'You have ' + nOf(arch.length, ['archived term', 'archived terms'], ['archived term', 'archived terms']))) + '</span>';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      /*@3.SEMJ.119*/
      location.href = 'gpa.html';
    });
    $('.sem-empty-a', host).appendChild(a);
  }

  /*@3.SEMJ.120*/

  function bind() {
    /*@3.SEMJ.121*/
    document.addEventListener('click', function (e) {
      var t = e.target;

      var act = t.closest && t.closest('[data-act]');
      if (act) {
        var a = act.getAttribute('data-act');
        if (a === 'add') { openAdd(); return; }
        if (a === 'rename') { openLevel('rename'); return; }
        if (a === 'create') { openCreate(); return; }
        if (a === 'archive') { askArchive(); return; }
        if (a === 'due') { if (window.GardenDue) GardenDue.open(); return; }
        if (a === 'adopt-all') {
          GardenData.adoptPending().then(function (r) {
            refresh();
            toast(r.added.length
              ? L('أُضيفت ' + nOf(r.added.length, ['مادة', 'مادتان', 'مواد'], ['course', 'courses']),
                  nOf(r.added.length, ['course', 'courses'], ['course', 'courses']) + ' added')
              : L('لا شيء ينتظر', 'Nothing waiting'));
          });
          return;
        }
      }

      var close = t.closest && t.closest('[data-close]');
      if (close) { var d = close.closest('dialog'); if (d) d.close(); return; }

      var rail = t.closest && t.closest('[data-go]');
      if (rail) { goSec(rail.getAttribute('data-go')); return; }

      var lv = t.closest && t.closest('[data-lv]');
      if (lv) { S.addLevel = lv.getAttribute('data-lv'); renderAddLevels(); renderAddList(); return; }

      /*@3.SEMJ.122*/
      var sd = t.closest && t.closest('[data-showdone]');
      if (sd) { S.addShowDone = sd.getAttribute('data-showdone') === '1'; renderAddList(); return; }

      var addBtn = t.closest && t.closest('[data-add]');
      if (addBtn) { addPicked(addBtn.getAttribute('data-add')); return; }

      var rst = t.closest && t.closest('[data-restudy]');
      if (rst) { doRestudy(rst.getAttribute('data-restudy')); return; }

      /*@3.SEMJ.123*/
      var aCol = t.closest && t.closest('[data-acolor]');
      if (aCol) { openColor(aCol.getAttribute('data-acolor')); return; }

      /*@3.SEMJ.124*/
      var pCol = t.closest && t.closest('[data-acol]');
      if (pCol) { setAddColor(pCol.getAttribute('data-acol')); return; }

      var nf = t.closest && t.closest('[data-nf]');
      if (nf) {
        S.nextFilter = nf.getAttribute('data-nf');
        $$('#sem-next-filters .sem-chip').forEach(function (b) {
          b.classList.toggle('is-on', b.getAttribute('data-nf') === S.nextFilter);
        });
        renderNext();
        return;
      }

      var more = t.closest && t.closest('[data-more]');
      if (more) { openCourseMenu(more.getAttribute('data-more')); return; }

      var mAct = t.closest && t.closest('[data-cm]');
      if (mAct) { courseMenuAct(mAct.getAttribute('data-cm')); return; }

      var insOpen = t.closest && t.closest('[data-ins-open]');
      if (insOpen) { openIns(insOpen.getAttribute('data-ins-open')); return; }

      /*@3.SEMJ.164*/
      var crnOpen = t.closest && t.closest('[data-crn-open]');
      if (crnOpen) { openCrn(crnOpen.getAttribute('data-crn-open')); return; }
      var crnChip = t.closest && t.closest('[data-crn-chip]');
      if (crnChip) {
        openCrn(crnChip.getAttribute('data-crn-chip'), crnChip.getAttribute('data-crn'));
        return;
      }
      /*@3.SEMJ.165*/
      var crnQ = t.closest && t.closest('[data-crn-q]');
      if (crnQ) { openCrn(null, crnQ.getAttribute('data-crn-q')); return; }
      if (t.closest && t.closest('#crn-all')) { crnLookup(CRN.q, true); return; }
      /*@3.SEMJ.166*/
      var crnW = t.closest && t.closest('[data-crnw]');
      if (crnW) { CRN.watch = !CRN.watch; renderCrn(); return; }

      var dueOne = t.closest && t.closest('[data-due]');
      if (dueOne) {
        if (window.GardenDue) GardenDue.open({ code: dueOne.getAttribute('data-due') });
        return;
      }

      var tg = t.closest && t.closest('[data-toggle]');
      if (tg) {
        var id = tg.getAttribute('data-toggle');
        S.openArchive[id] = !S.openArchive[id];
        renderArchive();
        return;
      }
      var rs = t.closest && t.closest('[data-restore]');
      if (rs) { askRestore(rs.getAttribute('data-restore')); return; }
      var da = t.closest && t.closest('[data-delarch]');
      if (da) { askDeleteArchive(da.getAttribute('data-delarch')); return; }
    });

    on('nm-ok', 'click', saveName);

    /*@3.SEMJ.175*/
    on('dlg-level', 'click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-lvpick]');
      if (!btn) return;
      var p = BN() && BN().pairOf(btn.getAttribute('data-lvpick'));
      if (!p) return;
      el('dlg-level').close();
      if (lvMode === 'create') {
        newSemester(p);
        toast(L('أُنشئ «' + p.ar + '»', '“' + p.en + '” created'));
      } else {
        applyPair(p);
        toast(L('صار «' + p.ar + '»', 'Renamed to “' + p.en + '”'));
      }
    });
    /*@3.SEMJ.126*/
    on('lv-more', 'click', function () { lvMore = !lvMore; renderLevelList(); });
    /*@3.SEMJ.127*/
    on('lv-custom', 'click', function () { el('dlg-level').close(); openName(lvMode); });

    on('sem-roll-go', 'click', doRoll);
    on('sem-roll-off', 'click', function () {
      if (!S.sem) return;
      S.sem.roll_off = rollKey();
      save(); refresh();
    });

    on('add-custom', 'click', addCustom);
    /*@3.SEMJ.128*/
    on('ask-ok', 'click', function () {
      var f = askFn; askFn = null;
      el('dlg-ask').close();
      if (f) f();
    });
    /*@3.SEMJ.129*/
    on('dlg-ask', 'close', function () {
      if (el('dlg-ask').open) return;
      askFn = null;
      /*@3.SEMJ.130*/
      restudyCode = null;
    });

    var qt = 0;
    on('add-q', 'input', function (e) {
      S.addQ = e.target.value || '';
      cancelAnimationFrame(qt);
      qt = requestAnimationFrame(renderAddList);
    });

    /*@3.SEMJ.167*/
    on('crn-n', 'input', function (e) {
      var v = String(e.target.value || '').replace(/\D+/g, '').slice(0, 6);
      if (v !== e.target.value) e.target.value = v;
      clearTimeout(crnTimer);
      if (!looksCrn(v)) { crnLookup(v); return; }
      /*@3.SEMJ.168*/
      crnTimer = setTimeout(function () { crnLookup(v); }, 260);
    });
    on('crn-n', 'keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(crnTimer);
      if (CRN.phase === 'found' && !el('crn-ok').disabled) { doCrnLink(); return; }
      crnLookup(String(el('crn-n').value || '').trim());
    });
    on('crn-ok', 'click', doCrnLink);
    on('crn-unlink', 'click', doCrnUnlink);
    /*@3.SEMJ.131*/
    ['nm-ar', 'nm-en'].forEach(function (id) {
      on(id, 'keydown', function (e) { if (e.key === 'Enter') saveName(); });
    });

    /*@3.SEMJ.132*/
    on('add-color-wheel', 'input', function (e) { setAddColor(e.target.value); });
    on('add-color-hex', 'input', function (e) {
      var n = GardenData.normHex(e.target.value);
      /*@3.SEMJ.133*/
      if (!n) return;
      S.addColor = n;
      var w = el('add-color-wheel'); if (w) w.value = n;
      $$('#add-color .gcc-sw').forEach(function (b) {
        b.setAttribute('aria-checked',
          GardenData.normHex(b.getAttribute('data-acol')) === n ? 'true' : 'false');
      });
    });

    var st = 0;
    window.addEventListener('scroll', function () {
      if (st) return;
      st = setTimeout(function () { st = 0; spy(); }, 90);
    }, { passive: true });

    /*@3.SEMJ.134*/
    document.addEventListener('garden:languageChanged', function () {
      refresh();
      if (el('dlg-add').open) { renderAddLevels(); renderAddList(); renderAddColor(); }
      /*@3.SEMJ.135*/
      if (el('dlg-level') && el('dlg-level').open) renderLevelList();
      /*@3.SEMJ.169*/
      if (el('dlg-crn') && el('dlg-crn').open) { crnLead(); renderCrn(); }
    });
    /*@3.SEMJ.136*/
    document.addEventListener('garden:courseColorChanged', function () { renderCourses(); });
    document.addEventListener('garden:gradesChanged', refresh);
    document.addEventListener('garden:syncCompleted', refresh);
    document.addEventListener('garden:semesterActivated', refresh);
    document.addEventListener('garden:cardsReviewed', refresh);
  }

  /*@3.SEMJ.137*/

  /*@3.SEMJ.180*/
  function askNewTerm() {
    if (!S.sem) { openName('create'); return; }
    var list = courses();
    if (!list.length) { openName('create'); return; }
    var nm = GardenData.dispName(S.sem);
    var body = '<p style="margin:0 0 .7rem;font-size:.86rem">' +
      esc(L('يُؤرشَف ', 'We archive ')) + '<b>' + esc(nm) + '</b>' +
      esc(L(' بموادّه ودرجاته أوّلاً، ثمّ نفتح لك فصلاً جديداً فارغاً.',
             ' with its courses and grades first, then open a new empty term for you.')) + '</p>' +
      '<div class="sem-note"><i class="fa-solid fa-box-archive" aria-hidden="true"></i><span>' +
      esc(L('ولا يضيع شيء: تجده في «الفصول السابقة» أسفل الصفحة، وتستطيع إرجاعَه فصلاً جارياً متى شئت.',
             'Nothing is lost: you will find it under “Past semesters” below, and you can restore it as your current term any time.')) +
      '</span></div>';
    ask(L('فصلٌ جديد', 'New semester'), body, L('أرشِفْ وابدأ', 'Archive and start'), function () {
      var s = archiveStats({ courses: S.sem.courses });
      var arch = GardenData.archive() || [];
      arch.push({
        id: S.sem.id,
        name: S.sem.name || S.sem.name_ar || S.sem.name_en,
        name_ar: S.sem.name_ar || S.sem.name,
        name_en: S.sem.name_en || S.sem.name,
        level: S.sem.level, term: S.sem.term,
        courses: S.sem.courses,
        gpa: s.gpa, total_credits: s.credits,
        created_at: S.sem.created_at,
        archived_at: new Date().toISOString()
      });
      try { localStorage.removeItem('my_semester'); } catch (e) {}
      try { localStorage.setItem('__syncT_my_semester', String(Date.now())); } catch (e) {}
      try { localStorage.removeItem('garden_semester_meta'); } catch (e) {}
      S.sem = null;
      saveArchive(arch);
      refresh();
      toast(L('أُرشف «' + nm + '» — تجده في الفصول السابقة',
              '“' + nm + '” is archived — find it under past semesters'));
      setTimeout(function () { openName('create'); }, 260);
    });
  }

  /*@3.SEMJ.181*/
  function runIntent() {
    var m = /[?&]add=([a-z]+)/.exec(location.search || '');
    if (!m) return;
    var what = m[1];
    try {
      history.replaceState(null, '', location.pathname + location.hash);
    } catch (e) {}
    if (what === 'semester') { askNewTerm(); return; }
    if (what === 'course') {
      if (!S.sem) { openName('create'); return; }
      openAdd();
    }
  }

  function init() {
    if (!window.GardenData) return;
    bind();
    GardenData.ready().then(function () {
      refresh();
      var h = (location.hash || '').replace('#', '');
      if (h && el('sec-' + h)) setTimeout(function () { goSec(h); }, 120);
      runIntent();

      /*@3.SEMJ.138*/
      if (window.GardenFaculty) {
        GardenFaculty.load(function (d) {
          if (!d) return;
          S.facultyReady = true;
          if (S.sem) renderCourses();
        });
      }

      /*@3.SEMJ.170*/
      if (GW() && GW().ready()) { try { GW().load(); } catch (e) {} }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
