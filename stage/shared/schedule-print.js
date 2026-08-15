/*@3.SCPJ2.1*/
;(function () {
  'use strict';

  var S = null;

  /*@3.SCPJ2.26*/
  var _fontHref = (function () {
    var sc = document.currentScript;
    return sc && sc.src
      ? sc.src.replace(/schedule-print\.js(\?.*)?$/, 'vendor/fonts/garden/garden-core.css')
      : '';
  })();

  function ar() { return S.isAr(); }
  function T(a, e) { return ar() ? a : e; }
  function esc(s) { return S.escapeH(s); }

  /*@3.SCPJ2.2*/
  var PREF_KEY = 'garden_print_prefs';
  function openDialog() {
    S = window.GardenSchedule;
    if (!S) return;
    var st = S.currentState();
    document.getElementById('print-mode').value = (st.view === 'month') ? 'months' : (st.agenda ? 'agenda' : 'weeks');
    document.getElementById('print-from').value = S.fmtLocalDate(st.weekStart);
    var to = new Date(st.weekStart); to.setDate(to.getDate() + 27);
    document.getElementById('print-to').value = S.fmtLocalDate(to);
    loadPrefs();
    syncDialog();
    document.getElementById('modal-print').style.display = '';
  }
  function syncDialog() {
    var m = document.getElementById('print-mode').value;
    document.getElementById('print-weeks-wrap').style.display = (m === 'weeks' || m === 'agenda') ? '' : 'none';
    document.getElementById('print-months-wrap').style.display = (m === 'months') ? '' : 'none';
    var kinds = document.getElementById('print-kinds');
    if (kinds) kinds.style.display = (m === 'plan') ? 'none' : '';
    var scope = document.getElementById('print-week-scope').value;
    document.getElementById('print-range-wrap').style.display = (scope === 'range') ? '' : 'none';
  }

  function loadPrefs() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); } catch (e) { p = null; }
    if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('.print-f'), function (el) {
      if (p[el.value] != null) el.checked = !!p[el.value];
    });
    var hd = document.getElementById('print-hide-done');
    if (hd && p.hideDone != null) hd.checked = !!p.hideDone;
  }

  /*@3.SCPJ2.21*/
  var F = null;
  function buildFilter() {
    var f = { lecture: true, study: true, exam: true, task: true, event: true, hideDone: false };
    Array.prototype.forEach.call(document.querySelectorAll('.print-f'), function (el) {
      f[el.value] = !!el.checked;
    });
    var hd = document.getElementById('print-hide-done');
    f.hideDone = !!(hd && hd.checked);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(f)); } catch (e) {}
    return f;
  }
  function bucket(e) {
    if (e.kind === 'lecture') return 'lecture';
    if (e.kind === 'study' || e.kind === 'intensive') return 'study';
    if (e.kind === 'exam') return 'exam';
    if (e.sub === 'task') return 'task';
    return 'event';
  }
  function keep(e) {
    if (!F) return true;
    if (F.hideDone && e.done) return false;
    return F[bucket(e)] !== false;
  }
  function sift(list) { return (list || []).filter(keep); }

  function resolveRange() {
    var st = S.currentState();
    var scope = document.getElementById('print-week-scope').value;
    if (scope === 'range') {
      var f = document.getElementById('print-from').value;
      var t = document.getElementById('print-to').value;
      if (f && t) return { from: S.getWeekStartDate(S.parseLocalDate(f)), to: S.parseLocalDate(t) };
    }
    if (scope === 'term') {
      var d = S.data().settings;
      if (d.term_start_date && d.semester_end_date) {
        return { from: S.getWeekStartDate(S.parseLocalDate(d.term_start_date)), to: S.parseLocalDate(d.semester_end_date) };
      }
    }
    var e = new Date(st.weekStart); e.setDate(e.getDate() + 6);
    return { from: new Date(st.weekStart), to: e };
  }

  function run() {
    M = null;   /*@3.SCPJ2.3*/
    F = buildFilter();
    var mode = document.getElementById('print-mode').value;
    document.getElementById('modal-print').style.display = 'none';
    S.beginPass();
    try {
      if (mode === 'weeks') printWeeks(resolveRange());
      else if (mode === 'months') printMonths(parseInt(document.getElementById('print-month-count').value, 10) || 1);
      else if (mode === 'agenda') printAgenda(resolveRange());
      else printPlan();
    } finally { S.endPass(); }
  }

  /*@3.SCPJ2.4*/
  function brand(px) {
    var s = px || 15;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;flex-shrink:0">' +
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M50 88 V64" stroke="#10b981" stroke-width="8"/>' +
      '<path d="M50 64 L22 42 M50 64 L78 42 M50 64 V34" stroke="#a78bfa" stroke-width="7"/></g>' +
      '<circle cx="50" cy="64" r="12" fill="#a78bfa"/><circle cx="22" cy="42" r="9" fill="#a78bfa"/>' +
      '<circle cx="78" cy="42" r="9" fill="#a78bfa"/><circle cx="50" cy="26" r="14" fill="#10b981"/></svg>';
  }
  function tint(hex, a) {
    if (!hex || hex[0] !== '#') return 'rgba(148,163,184,' + a + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return 'rgba(' + parseInt(h.slice(0,2),16) + ',' + parseInt(h.slice(2,4),16) + ',' + parseInt(h.slice(4,6),16) + ',' + a + ')';
  }

  function styles(geom) {
    var isA = ar();
    var g = geom || cellGeom(6);
    return '@page{size:A4 portrait;margin:9mm 10mm}' +
    '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{font-family:' + (isA ? "'Tajawal','Cairo',sans-serif" : "'Plus Jakarta Sans',sans-serif") + ';' +
      'direction:' + (isA ? 'rtl' : 'ltr') + ';color:#334155;background:#fff;font-size:9pt;line-height:1.45;' +
      'font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;-webkit-font-smoothing:antialiased}' +
    '.pg-head{position:relative;text-align:center;padding-bottom:7pt;margin-bottom:8pt;border-bottom:1pt solid #e8edf3}' +
    '.pg-brand{position:absolute;top:1pt;inset-inline-end:0;display:inline-flex;align-items:center;gap:3pt;font-size:7.5pt;font-weight:800;color:#0d9488}' +
    '.pg-title{font-size:18pt;font-weight:900;color:#0f172a;line-height:1.1;letter-spacing:-.012em}' +
    '.pg-sub{font-size:8.5pt;font-weight:600;color:#94a3b8;margin-top:2.5pt;letter-spacing:.02em}' +
    '.legend{display:flex;flex-wrap:wrap;gap:3pt 13pt;justify-content:center;margin-bottom:7pt}' +
    '.lg{display:inline-flex;align-items:center;gap:4pt;font-size:7.6pt;font-weight:700;color:#475569}' +
    '.lg i{width:6pt;height:6pt;border-radius:50%;display:inline-block;flex-shrink:0}' +
    '.lg b{font-weight:800;color:#a8b3c2;font-size:6.8pt;letter-spacing:.02em}' +
    '.slg{display:flex;flex-wrap:wrap;gap:3pt 12pt;justify-content:center;margin-bottom:8pt;padding-top:5pt;' +
      'border-top:.5pt dashed #edf1f6;font-size:6.8pt;font-weight:700;color:#a8b3c2}' +
    '.slg span{display:inline-flex;align-items:center;gap:3.5pt}' +
    '.mk{display:inline-block;flex-shrink:0;justify-self:center;align-self:center}' +
    '.mk-dot{width:4.6pt;height:4.6pt;border-radius:50%}' +
    '.mk-ring{width:4.8pt;height:4.8pt;border-radius:50%;background:#fff;border:1pt solid}' +
    '.mk-dia{width:4pt;height:4pt;border-radius:.6pt;transform:rotate(45deg)}' +
    '.mk-sq{width:4.2pt;height:4.2pt;border-radius:1pt}' +
    '.mk-bar{width:6pt;height:2.2pt;border-radius:1.2pt}' +
    'svg.mk{width:6pt;height:6pt;background:none;border:0}' +
    /*@3.SCPJ2.5*/
    '.sec + .sec, .sec ~ .sec{page-break-before:always;break-before:page}' +
    '.sec-title{font-size:11.5pt;font-weight:900;color:#0f172a;margin:0 0 6pt;padding-bottom:3.5pt;' +
      'border-bottom:1pt solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:8pt}' +
    /*@3.SCPJ2.25*/
    '.sec-title .wk{font-size:7.4pt;font-weight:800;color:#0f766e;background:#fff;border:.75pt solid #99f6e4;' +
      'border-radius:999px;padding:1.5pt 8pt;letter-spacing:.02em;white-space:nowrap}' +
    '.sec-title .wk.now{color:#fff;background:#0d9488;border-color:#0d9488}' +
    /*@3.SCPJ2.6*/
    '.day-wrapper{background:#fff;border:.75pt solid #dfe5ec;border-radius:9pt;overflow:hidden;margin-bottom:6pt;page-break-inside:avoid;break-inside:avoid}' +
    '.day-wrapper.exam{border-color:#fbd0d7}' +
    '.day-header{padding:4pt 9pt;display:flex;justify-content:space-between;align-items:baseline;gap:8pt;' +
      'background:#fbfcfe;border-bottom:.75pt solid #eef2f7}' +
    '.day-header.exam{background:#fff7f8;border-bottom-color:#fbd0d7}' +
    '.day-date{font-size:9.4pt;font-weight:800;color:#0f172a}' +
    '.day-header.exam .day-date{color:#be123c}' +
    '.day-tag{font-size:6.8pt;font-weight:700;color:#a8b3c2;letter-spacing:.03em;white-space:nowrap}' +
    '.item{display:grid;grid-template-columns:11pt 46pt 1fr 52pt;align-items:center;column-gap:7pt;' +
      'padding:3.5pt 9pt;border-bottom:.5pt dashed #eef2f7;height:25pt}' +
    '.item:last-child{border-bottom:none}' +
    '.tick{width:11pt;height:11pt;border-radius:50%;border:1.1pt solid #cbd5e1;background:#fff;flex-shrink:0;justify-self:center}' +
    'svg.tick{border:0;background:none;border-radius:0}' +
    '.itm-time{font-size:7.8pt;font-weight:800;color:#64748b;white-space:nowrap;overflow:hidden;letter-spacing:-.01em}' +
    '.itm-main{min-width:0}' +
    '.itm-title{font-size:8.8pt;font-weight:800;color:#0f172a;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.itm-sub{font-size:7pt;font-weight:600;color:#94a3b8;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.itm-code{font-size:7.2pt;font-weight:800;color:#a8b3c2;letter-spacing:.03em;text-align:end;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.is-done .itm-title{color:#a8b3c2;text-decoration:line-through;text-decoration-thickness:.4pt;text-decoration-color:#cbd5e1}' +
    '.is-done .itm-time, .is-done .itm-sub, .is-done .itm-code{color:#cbd5e1}' +
    '.none-card{padding:6pt;text-align:center;color:#c3cbd6;font-size:7.6pt;font-weight:600;letter-spacing:.02em}' +
    /*@3.SCPJ2.7*/
    '.cal{width:100%;border-collapse:separate;border-spacing:2.5pt;table-layout:fixed}' +
    '.cal th{font-size:7.2pt;font-weight:800;color:#a8b3c2;padding:0 0 3.5pt;text-align:center;letter-spacing:.05em}' +
    '.cal td{padding:0;vertical-align:top;border:.75pt solid #e8edf3;border-radius:6pt;background:#fff;overflow:hidden}' +
    '.cal td.off{background:#fbfcfd;border-color:#eef2f7}' +
    '.cal td.out{border-color:#f4f7fa}' +
    '.cal td.out .dnum{color:#dde3ea}' +
    /*@3.SCPJ2.8*/
    '.cal td.heavy{border-color:#c9d2dd}' +
    '.cal td.today{border-color:#0d9488;box-shadow:inset 0 0 0 .75pt #0d9488}' +
    '.cell{display:flex;flex-direction:column;height:' + g.h + 'pt;padding:3pt 3.5pt 2.5pt;overflow:hidden}' +
    '.chead{display:flex;align-items:center;justify-content:space-between;gap:3pt;height:9.5pt;flex-shrink:0;margin-bottom:1.5pt}' +
    '.dnum{font-size:8.4pt;font-weight:800;color:#0f172a;line-height:1}' +
    '.cal td.today .dnum{color:#0d9488}' +
    '.wkcol{font-size:5.8pt;font-weight:800;color:#0d9488;letter-spacing:.02em;white-space:nowrap}' +
    '.cbody{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:.8pt}' +
    '.chip{display:grid;grid-template-columns:6pt 22pt 1fr;align-items:center;column-gap:2.5pt;' +
      'height:8.6pt;flex-shrink:0;overflow:hidden}' +
    '.chip .tm{font-size:5.8pt;font-weight:700;color:#a8b3c2;white-space:nowrap;overflow:hidden;line-height:1}' +
    '.chip .nm{font-size:6.4pt;font-weight:800;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1}' +
    '.chip.exam .nm{color:#be123c;font-weight:900}' +
    '.chip.done .nm{color:#b9c2cd;text-decoration:line-through;text-decoration-thickness:.35pt;text-decoration-color:#dde3ea}' +
    '.chip.done .tm{color:#d3dae2}' +
    '.more{display:grid;grid-template-columns:6pt 1fr;column-gap:2.5pt;align-items:center;height:8.6pt;flex-shrink:0}' +
    '.more-d{justify-self:center;display:inline-flex;gap:1pt}' +
    '.more-d i{width:1.7pt;height:1.7pt;border-radius:50%;background:#c3cbd6;display:inline-block}' +
    '.more span{font-size:5.9pt;font-weight:800;color:#a8b3c2;letter-spacing:.02em}' +
    /*@3.SCPJ2.9*/
    '.ftr{margin-top:9pt;padding-top:5pt;border-top:1pt solid #eef2f7;text-align:center}' +
    '.ftr-quote{font-size:8.6pt;font-weight:700;color:#64748b;line-height:1.55}' +
    /*@3.SCPJ2.10*/
    '.tipbox{margin-top:9pt;border:.75pt dashed #dfe5ec;border-radius:8pt;padding:7pt 9pt;' +
      'display:flex;gap:12pt;page-break-inside:avoid;break-inside:avoid;background:#fcfdfe}' +
    '.tipcol{flex:1;min-width:0}' +
    '.tiphead{font-size:7.8pt;font-weight:900;color:#475569;margin-bottom:3pt;' +
      'padding-bottom:2pt;border-bottom:.5pt solid #eef2f7}' +
    '.tiplist{list-style:none;margin:0;padding:0}' +
    '.tiplist li{font-size:7.3pt;font-weight:600;color:#64748b;line-height:1.6;' +
      'padding-inline-start:9pt;position:relative}' +
    '.tiplist li::before{content:"";position:absolute;inset-inline-start:0;top:5.5pt;' +
      'width:3pt;height:3pt;border-radius:50%;background:#5eead4}';
  }

  /*@3.SCPJ2.11*/
  var M = null;
  function motivation() {
    if (!M) M = (window.GardenScheduleMotivation
      ? window.GardenScheduleMotivation.forDoc(ar())
      : { badge: '', quote: '', method: null, tips: null });
    return M;
  }
  /*@3.SCPJ2.12*/
  function tipBox() {
    var m = motivation();
    if (!m.method || !m.tips) return '';
    return '<div class="tipbox">' +
      '<div class="tipcol"><div class="tiphead">' +
        T('طريقة المذاكرة', 'Study method') + ' · ' + esc(m.method[0]) + '</div>' +
        '<ul class="tiplist">' + m.method[1].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="tipcol"><div class="tiphead">' + T('نصائح ذكية', 'Smart tips') + '</div>' +
        '<ul class="tiplist">' + m.tips.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
    '</div>';
  }

  function openDoc(title, bodyHtml, geom) {
    var isA = ar();
    var win = window.open('', '_blank');
    if (!win) {
      window.GardenEv('sched_print', { ok: 0, why: 'popup_blocked' });
      alert(T('مانع النوافذ منع الطباعة', 'Popup blocked')); return;
    }
    window.GardenEv('sched_print', { ok: 1 });
    win.document.write('<!DOCTYPE html><html dir="' + (isA ? 'rtl' : 'ltr') + '" lang="' + (isA ? 'ar' : 'en') + '"><head>' +
      '<meta charset="UTF-8"><title>' + esc(title) + '</title>' +
      (_fontHref ? '<link rel="stylesheet" href="' + _fontHref + '">' : '') +
      '<style>' + styles(geom) + '</style></head><body>' + bodyHtml +
      '<script>if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(function(){window.print();},200);});}' +
      'else{setTimeout(function(){window.print();},700);}<\/script></body></html>');
    win.document.close();
  }

  function header(title, sub) {
    return '<div class="pg-head">' +
      '<div class="pg-brand">' + brand(14) + '<span>' + T('الحديقة الرقمية', 'Digital Garden') + '</span></div>' +
      '<div class="pg-title">' + esc(title) + '</div>' +
      '<div class="pg-sub">' + esc(sub) + '</div></div>';
  }
  /*@3.SCPJ2.13*/
  function legend() {
    var codes = S.scheduleCourseCodes().filter(function (c) { return !S.isCourseHidden(c); });
    if (!codes.length) return '';
    return '<div class="legend">' + codes.map(function (c) {
      var col = S.courseColor(c);
      var nm = S.courseName(c);
      return '<span class="lg"><i style="background:' + col + '"></i>' + esc(nm) +
        (nm === S.courseShort(c) ? '' : ' <b>' + esc(S.courseShort(c)) + '</b>') +
        '</span>';
    }).join('') + '</div>';
  }
  /*@3.SCPJ2.23*/
  var SHAPES = { lecture: 'dot', study: 'ring', exam: 'dia', task: 'sq', event: 'bar' };
  var SHAPE_LABEL = {
    lecture: ['محاضرة', 'Lecture'], study: ['مذاكرة', 'Study'], exam: ['اختبار', 'Exam'],
    task: ['مهمة', 'Task'], event: ['حدث', 'Event']
  };
  function marker(e) {
    if (e.done) return okMark('#b9c2cd');
    var sh = SHAPES[bucket(e)] || 'dot';
    if (sh === 'ring') return '<span class="mk mk-ring" style="border-color:' + e.color + '"></span>';
    return '<span class="mk mk-' + sh + '" style="background:' + e.color + '"></span>';
  }
  function okMark(col) {
    return '<svg class="mk" viewBox="0 0 12 12" aria-hidden="true">' +
      '<path d="M2.3 6.4 4.7 8.8 9.7 3.3" fill="none" stroke="' + col + '" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function shapeLegend() {
    var out = Object.keys(SHAPES).filter(function (b) { return !F || F[b] !== false; }).map(function (b) {
      var sh = SHAPES[b];
      var st = (sh === 'ring') ? 'border-color:#8fa0b3' : 'background:#8fa0b3';
      return '<span><i class="mk mk-' + sh + '" style="' + st + '"></i>' +
        esc(T(SHAPE_LABEL[b][0], SHAPE_LABEL[b][1])) + '</span>';
    });
    if (!F || F.hideDone !== true) out.push('<span>' + okMark('#8fa0b3') + esc(T('تمّ', 'Done')) + '</span>');
    return out.length ? '<div class="slg">' + out.join('') + '</div>' : '';
  }
  function footer() {
    var q = motivation().quote;
    if (!q) return '';
    return '<div class="ftr"><div class="ftr-quote">' + esc(q) + '</div></div>';
  }
  /*@3.SCPJ2.14*/
  function shortLabel(e) {
    return e.course_code ? S.courseShort(e.course_code) : S.evTitle(e);
  }

  function dayLabel(d) {
    var lang = ar() ? 'ar' : 'en';
    var nm = S.DAY_NAMES[lang][S.DAYS_ORDER[d.getDay()]];
    return ar() ? (nm + ' ' + d.getDate() + ' ' + S.MONTH_NAMES.ar[d.getMonth()])
                : (nm + ', ' + S.MONTH_NAMES.en[d.getMonth()] + ' ' + d.getDate());
  }
  function todayStr() { return S.fmtLocalDate(new Date()); }

  /*@3.SCPJ2.24*/
  function tickBox(e, col) {
    if (e.done) {
      return '<svg class="tick" viewBox="0 0 14 14" aria-hidden="true">' +
        '<circle cx="7" cy="7" r="6.2" fill="none" stroke="#dde3ea" stroke-width="1"/>' +
        '<path d="M4.1 7.2 6 9.1 10 4.8" fill="none" stroke="#94a3b8" stroke-width="1.6" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return '<span class="tick" style="border-color:' + tint(col, 0.55) + '"></span>';
  }

  function row(opts) {
    return '<div class="item' + (opts.done ? ' is-done' : '') + '">' +
      tickBox({ done: opts.done }, opts.color) +
      '<div class="itm-time">' + esc(opts.time) + '</div>' +
      '<div class="itm-main">' +
        '<div class="itm-title">' + esc(opts.title) + '</div>' +
        '<div class="itm-sub">' + (opts.sub ? esc(opts.sub) : '&nbsp;') + '</div>' +
      '</div>' +
      '<div class="itm-code">' + esc(opts.code) + '</div>' +
    '</div>';
  }

  function itemHtml(e) {
    return row({
      done: !!e.done, color: e.color,
      time: e.allDay ? T('طوال اليوم', 'All-day') : S.fmtMin12(e.start),
      title: S.evTitle(e), sub: S.evMeta(e),
      code: e.course_code ? S.courseShort(e.course_code) : T('عام', 'General')
    });
  }

  function dayCard(d, items) {
    var hasExam = items.some(function (e) { return e.kind === 'exam'; });
    var body = items.length ? items.map(itemHtml).join('')
      : '<div class="none-card">' + T('لا أحداث', 'No events') + '</div>';
    return '<div class="day-wrapper' + (hasExam ? ' exam' : '') + '">' +
      '<div class="day-header' + (hasExam ? ' exam' : '') + '">' +
      '<span class="day-date">' + esc(dayLabel(d)) + '</span>' +
      '<span class="day-tag">' + (items.length ? items.length + ' ' + T('عنصر', 'items') : T('—', '—')) + '</span></div>' +
      body + '</div>';
  }

  /*@3.SCPJ2.15*/
  function printWeeks(range) {
    var sections = '';
    var wkStart = S.getWeekStartDate(range.from);
    var guard = 0;
    while (wkStart <= range.to && guard++ < 40) {
      var wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 6);
      var wn = S.studyWeekNumber(wkStart);
      var days = S.eventsForRange(wkStart, wkEnd);
      var cards = days.map(function (d) { return dayCard(d.date, sift(d.items)); }).join('');
      var isNow = todayIn(wkStart, wkEnd);
      var badge = wn ? T('الأسبوع ' + wn, 'Week ' + wn) : (isNow ? T('هذا الأسبوع', 'This week') : '');
      sections += '<div class="sec"><div class="sec-title"><span>' +
        esc(wkStart.getDate() + ' – ' + wkEnd.getDate() + ' ' + S.MONTH_NAMES[ar() ? 'ar' : 'en'][wkEnd.getMonth()] + ' ' + wkEnd.getFullYear()) +
        '</span>' + (badge ? '<span class="wk' + (isNow ? ' now' : '') + '">' + esc(badge) + '</span>' : '') +
        '</div>' + cards + '</div>';
      wkStart = new Date(wkStart); wkStart.setDate(wkStart.getDate() + 7);
    }
    openDoc(T('الجدول الأسبوعي', 'Weekly Schedule'),
      header(T('الجدول الأسبوعي', 'Weekly Schedule'),
        S.fmtLocalDate(range.from) + ' → ' + S.fmtLocalDate(range.to)) + legend() + sections + footer());
  }
  function todayIn(from, to) {
    var t = todayStr();
    return S.fmtLocalDate(from) <= t && t <= S.fmtLocalDate(to);
  }

  /*@3.SCPJ2.22*/
  function cellGeom(rows) {
    var h = (rows >= 6) ? 78 : 92;
    var slot = 9.4;
    var cap = Math.max(3, Math.floor((h - 15.7) / slot));
    return { h: h, cap: cap };
  }

  /*@3.SCPJ2.16*/
  function printMonths(count) {
    var st = S.currentState();
    var rows = 5;
    for (var k = 0; k < count; k++) {
      var probe = new Date(st.month.getFullYear(), st.month.getMonth() + k, 1);
      var lastD = new Date(probe.getFullYear(), probe.getMonth() + 1, 0);
      rows = Math.max(rows, Math.ceil((lastD.getDate() + probe.getDay()) / 7));
    }
    var geom = cellGeom(rows);
    var sections = '';
    for (var j = 0; j < count; j++) {
      sections += monthSection(new Date(st.month.getFullYear(), st.month.getMonth() + j, 1), geom);
    }
    openDoc(T('التقويم الشهري', 'Monthly Calendar'),
      header(T('التقويم الشهري', 'Monthly Calendar'),
        S.MONTH_NAMES[ar() ? 'ar' : 'en'][st.month.getMonth()] + ' ' + st.month.getFullYear() +
        (count > 1 ? ' +' + (count - 1) : '')) + legend() + shapeLegend() + sections + tipBox() + footer(), geom);
  }

  function monthSection(md, geom) {
    var lang = ar() ? 'ar' : 'en';
    var first = new Date(md.getFullYear(), md.getMonth(), 1);
    var last = new Date(md.getFullYear(), md.getMonth() + 1, 0);
    var gridStart = new Date(first); gridStart.setDate(1 - first.getDay());
    var total = Math.ceil((last.getDate() + first.getDay()) / 7) * 7;
    var active = S.data().settings.active_days || [];
    var today = todayStr();

    var head = '<tr>' + S.DAYS_ORDER.map(function (d) {
      return '<th>' + esc(S.DAY_SHORT[lang][d]) + '</th>';
    }).join('') + '</tr>';

    var body = '', cur = new Date(gridStart);
    for (var i = 0; i < total; i++) {
      if (i % 7 === 0) body += '<tr>';
      var inMonth = cur.getMonth() === md.getMonth();
      var off = active.indexOf(S.DAYS_ORDER[cur.getDay()]) === -1;
      var items = inMonth ? sift(S.eventsOnDate(cur)) : [];
      /*@3.SCPJ2.17*/
      var heavy = items.some(function (e) { return e.kind === 'exam'; }) || items.length >= geom.cap;
      var wn = (cur.getDay() === 0 && inMonth) ? S.studyWeekNumber(cur) : null;
      var isToday = inMonth && S.fmtLocalDate(cur) === today;
      var shown = (items.length > geom.cap) ? items.slice(0, geom.cap - 1) : items;
      var hidden = items.length - shown.length;
      body += '<td class="' + (!inMonth ? 'out' : (off ? 'off' : '')) + (heavy && inMonth ? ' heavy' : '') +
        (isToday ? ' today' : '') + '"><div class="cell">' +
        '<div class="chead"><span class="dnum">' + cur.getDate() + '</span>' +
        (wn ? '<span class="wkcol">' + T('أ', 'W') + wn + '</span>' : '') + '</div>' +
        '<div class="cbody">' + shown.map(chipHtml).join('') +
        (hidden > 0 ? '<div class="more"><span class="more-d"><i></i><i></i><i></i></span>' +
          '<span>+' + hidden + '</span></div>' : '') +
        '</div></div></td>';
      if (i % 7 === 6) body += '</tr>';
      cur.setDate(cur.getDate() + 1);
    }
    return '<div class="sec"><div class="sec-title"><span>' +
      esc(S.MONTH_NAMES[lang][md.getMonth()] + ' ' + md.getFullYear()) + '</span></div>' +
      '<table class="cal">' + head + body + '</table></div>';
  }

  function chipHtml(e) {
    return '<div class="chip' + (e.kind === 'exam' ? ' exam' : '') + (e.done ? ' done' : '') + '">' +
      marker(e) +
      '<span class="tm">' + (e.allDay ? '' : esc(S.fmtMin12(e.start))) + '</span>' +
      '<span class="nm">' + esc(shortLabel(e)) + '</span></div>';
  }

  /*@3.SCPJ2.18*/
  function printAgenda(range) {
    var days = S.eventsForRange(range.from, range.to);
    var body = days.map(function (d) {
      var items = sift(d.items);
      if (!items.length) return '';
      return dayCard(d.date, items);
    }).join('');
    if (!body) body = '<div class="none-card">' + T('لا أحداث في هذا النطاق.', 'No events in this range.') + '</div>';
    openDoc(T('الأجندة', 'Agenda'),
      header(T('الأجندة', 'Agenda'), S.fmtLocalDate(range.from) + ' → ' + S.fmtLocalDate(range.to)) +
      legend() + body + footer());
  }

  /*@3.SCPJ2.19*/
  function printPlan() {
    var d = S.data();
    var it = d.intensive || {};
    var p = (it.active && it.plans) ? it.plans[it.active] : null;
    if (!p || !p.sessions.length) {
      alert(T('لا خطة مكثّفة نشطة للطباعة.', 'No active intensive plan to print.'));
      return;
    }
    var byDate = {};
    p.sessions.forEach(function (s) {
      if (F && F.hideDone && s.done) return;
      (byDate[s.date] = byDate[s.date] || []).push(s);
    });
    var body = Object.keys(byDate).sort().map(function (ds) {
      var dd = S.parseLocalDate(ds);
      var isExamDay = p.courses.some(function (c) { return p.exam_dates[c] === ds; });
      return '<div class="day-wrapper' + (isExamDay ? ' exam' : '') + '"><div class="day-header' + (isExamDay ? ' exam' : '') + '">' +
        '<span class="day-date">' + esc(dayLabel(dd)) + '</span>' +
        '<span class="day-tag">' + byDate[ds].length + ' ' + T('جلسة', 'sessions') + '</span></div>' +
        byDate[ds].map(function (s) {
          var label = s.kind === 'buffer' ? T('مراجعة ما قبل الاختبار', 'Pre-exam review')
                    : s.kind === 'spaced' ? T('مراجعة متباعدة', 'Spaced review')
                    : T('وحدة ' + parseInt(String(s.module).replace('M',''), 10), 'Module ' + parseInt(String(s.module).replace('M',''), 10)) +
                      (s.total_parts > 1 ? ' (' + s.part + '/' + s.total_parts + ')' : '');
          return row({
            done: !!s.done, color: S.courseColor(s.course),
            time: S.fmtTime12(s.start_time), title: label,
            sub: s.minutes + T(' دقيقة', ' minutes'), code: S.courseShort(s.course)
          });
        }).join('') + '</div>';
    }).join('');
    if (!body) body = '<div class="none-card">' + T('لا جلسات مطابقة للفلتر.', 'No sessions match the filter.') + '</div>';

    var exams = p.courses.map(function (c) {
      return esc(S.courseShort(c)) + ': ' + esc(p.exam_dates[c] || '—');
    }).join(' · ');

    openDoc(T('الخطة المكثّفة', 'Intensive Plan'),
      header(T('خطة المذاكرة المكثّفة', 'Intensive Study Plan'), exams) + legend() + body + tipBox() + footer());
  }

  /*@3.SCPJ2.20*/
  document.addEventListener('DOMContentLoaded', function () {
    var m = document.getElementById('print-mode');
    if (m) m.addEventListener('change', syncDialog);
    var sc = document.getElementById('print-week-scope');
    if (sc) sc.addEventListener('change', syncDialog);
    var run1 = document.getElementById('print-run');
    if (run1) run1.addEventListener('click', run);
    var c = document.getElementById('print-cancel');
    if (c) c.addEventListener('click', function () { document.getElementById('modal-print').style.display = 'none'; });
  });

  window.GardenSchedulePrint = { openDialog: openDialog };
})();
