 
;(function () {
  'use strict';

  var S = null;
  function ar() { return S.isAr(); }
  function T(a, e) { return ar() ? a : e; }
  function esc(s) { return S.escapeH(s); }

  
  function openDialog() {
    S = window.GardenSchedule;
    if (!S) return;
    var st = S.currentState();
    document.getElementById('print-mode').value = (st.view === 'month') ? 'months' : (st.agenda ? 'agenda' : 'weeks');
    document.getElementById('print-from').value = S.fmtLocalDate(st.weekStart);
    var to = new Date(st.weekStart); to.setDate(to.getDate() + 27);
    document.getElementById('print-to').value = S.fmtLocalDate(to);
    syncDialog();
    document.getElementById('modal-print').style.display = '';
  }
  function syncDialog() {
    var m = document.getElementById('print-mode').value;
    document.getElementById('print-weeks-wrap').style.display = (m === 'weeks' || m === 'agenda') ? '' : 'none';
    document.getElementById('print-months-wrap').style.display = (m === 'months') ? '' : 'none';
    var scope = document.getElementById('print-week-scope').value;
    document.getElementById('print-range-wrap').style.display = (scope === 'range') ? '' : 'none';
  }

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
    M = null;    
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

  function styles() {
    var isA = ar();
    return '@page{size:A4 portrait;margin:9mm 10mm}' +
    '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{font-family:' + (isA ? "'Tajawal','Cairo',sans-serif" : "'Plus Jakarta Sans',sans-serif") + ';' +
      'direction:' + (isA ? 'rtl' : 'ltr') + ';color:#1e293b;background:#fff;font-size:9pt;line-height:1.45}' +
    '.pg-head{position:relative;text-align:center;padding-bottom:7pt;margin-bottom:9pt;border-bottom:2px solid #e2e8f0}' +
    '.pg-brand{position:absolute;top:0;inset-inline-end:0;display:inline-flex;align-items:center;gap:4px;font-size:8pt;font-weight:800;color:#0f766e;opacity:.9}' +
    '.pg-title{font-size:19pt;font-weight:900;color:#0f172a;line-height:1.1}' +
    '.pg-sub{font-size:9.5pt;font-weight:600;color:#64748b;margin-top:2pt}' +
    '.legend{display:flex;flex-wrap:wrap;gap:5pt;justify-content:center;margin-bottom:9pt}' +
    '.lg{display:inline-flex;align-items:center;gap:4px;padding:2pt 7pt;border-radius:999px;font-size:7.5pt;font-weight:800;border:1px solid #e2e8f0}' +
    '.lg i{width:7px;height:7px;border-radius:50%;display:inline-block}' +
     
    '.sec + .sec, .sec ~ .sec{page-break-before:always;break-before:page}' +
    '.sec-title{font-size:12pt;font-weight:900;color:#0f172a;margin:0 0 6pt;padding-bottom:3pt;border-bottom:1.5px solid #cbd5e1;display:flex;justify-content:space-between;align-items:baseline;gap:8pt}' +
    '.sec-title .wk{font-size:9pt;font-weight:800;color:#7c3aed}' +
     
    '.day-wrapper{background:#fff;border:1px solid #cbd5e1;border-radius:11pt;overflow:hidden;margin-bottom:8pt;page-break-inside:avoid;break-inside:avoid}' +
    '.day-header{padding:5pt 10pt;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-bottom:1px solid #e2e8f0}' +
    '.day-header.exam{background:#fff1f2;border-bottom-color:#fecdd3}' +
    '.day-date{font-size:10pt;font-weight:800;color:#0f172a}' +
    '.day-tag{font-size:7.5pt;font-weight:700;padding:1.5pt 7pt;border-radius:5pt;background:#e2e8f0;color:#475569}' +
    '.item{display:flex;align-items:flex-start;gap:7pt;padding:5pt 10pt;border-bottom:1px dashed #e2e8f0;border-inline-start:3px solid transparent}' +
    '.item:last-child{border-bottom:none}' +
    '.chk{width:12pt;height:12pt;border:1.5px solid #cbd5e1;border-radius:50%;flex-shrink:0;margin-top:1.5pt;background:#fff}' +
    '.itm-time{font-size:8pt;font-weight:800;color:#334155;min-width:52pt;flex-shrink:0}' +
    '.itm-main{flex:1}' +
    '.itm-title{font-size:9pt;font-weight:800;color:#0f172a}' +
    '.itm-sub{font-size:7.5pt;font-weight:600;color:#64748b;margin-top:1pt}' +
    '.pill{display:inline-flex;align-items:center;gap:3px;padding:1pt 6pt;border-radius:999px;font-size:7pt;font-weight:800;border:1px solid}' +
    '.none-card{padding:7pt;text-align:center;color:#94a3b8;font-size:8pt;font-weight:600;font-style:italic}' +
     
    '.cal{width:100%;border-collapse:separate;border-spacing:3pt;table-layout:fixed}' +
    '.cal th{font-size:8pt;font-weight:800;color:#475569;padding:3pt 0;text-align:center;background:#f8fafc;border-radius:5pt}' +
    '.cal td{vertical-align:top;border:1px solid #e8edf3;border-radius:6pt;padding:3pt;height:74pt;background:#fff;position:relative}' +
    '.cal td.off{background:#fafbfc}' +
    '.cal td.out{background:#fcfcfd;opacity:.45}' +
     
    '.cal td.heavy{border-color:#94a3b8;box-shadow:inset 0 0 0 1px #cbd5e1}' +
    '.dnum{font-size:8.5pt;font-weight:800;color:#0f172a;display:block;margin-bottom:2pt}' +
    '.wkcol{position:absolute;inset-block-start:2pt;inset-inline-end:3pt;font-size:6pt;font-weight:800;color:#a78bfa}' +
    '.chip{display:block;border-radius:4pt;padding:1.5pt 4pt;margin-bottom:2pt;font-size:6.6pt;font-weight:700;line-height:1.25;overflow:hidden}' +
    '.chip b{font-weight:900}' +
    '.chip .tm{font-size:6pt;opacity:.75;font-weight:700}' +
    '.chip.exam{outline:1px solid rgba(220,38,38,.35)}' +
     
    '.ftr{margin-top:9pt;padding-top:5pt;border-top:1px solid #e2e8f0;text-align:center}' +
    '.ftr-quote{font-size:9pt;font-weight:700;color:#475569;line-height:1.55}' +
     
    '.tipbox{margin-top:9pt;border:1px dashed #cbd5e1;border-radius:8pt;padding:7pt 9pt;' +
      'display:flex;gap:12pt;page-break-inside:avoid;break-inside:avoid;background:#fcfdfe}' +
    '.tipcol{flex:1;min-width:0}' +
    '.tiphead{font-size:8pt;font-weight:900;color:#334155;margin-bottom:3pt;' +
      'padding-bottom:2pt;border-bottom:1px solid #e2e8f0}' +
    '.tiplist{list-style:none;margin:0;padding:0}' +
    '.tiplist li{font-size:7.5pt;font-weight:600;color:#475569;line-height:1.6;' +
      'padding-inline-start:9pt;position:relative}' +
    '.tiplist li::before{content:"";position:absolute;inset-inline-start:0;top:5.5pt;' +
      'width:3pt;height:3pt;border-radius:50%;background:#a78bfa}';
  }

   
  var M = null;
  function motivation() {
    if (!M) M = (window.GardenScheduleMotivation
      ? window.GardenScheduleMotivation.forDoc(ar())
      : { badge: '', quote: '', method: null, tips: null });
    return M;
  }
   
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

  function openDoc(title, bodyHtml) {
    var isA = ar();
    var win = window.open('', '_blank');
    if (!win) { alert(T('مانع النوافذ منع الطباعة', 'Popup blocked')); return; }
    win.document.write('<!DOCTYPE html><html dir="' + (isA ? 'rtl' : 'ltr') + '" lang="' + (isA ? 'ar' : 'en') + '"><head>' +
      '<meta charset="UTF-8"><title>' + esc(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' + styles() + '</style></head><body>' + bodyHtml +
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
   
  function legend() {
    var codes = S.scheduleCourseCodes().filter(function (c) { return !S.isCourseHidden(c); });
    if (!codes.length) return '';
    return '<div class="legend">' + codes.map(function (c) {
      var col = S.courseColor(c);
      var nm = S.courseName(c);
      return '<span class="lg" style="background:' + tint(col, 0.1) + ';color:' + col + '">' +
        '<i style="background:' + col + '"></i>' + esc(nm) +
        (nm === S.courseShort(c) ? '' : ' <b style="opacity:.7">' + esc(S.courseShort(c)) + '</b>') +
        '</span>';
    }).join('') + '</div>';
  }
  function footer() {
    var q = motivation().quote;
    if (!q) return '';
    return '<div class="ftr"><div class="ftr-quote">' + esc(q) + '</div></div>';
  }
   
  function shortLabel(e) {
    return e.course_code ? S.courseShort(e.course_code) : S.evTitle(e);
  }

  function dayLabel(d) {
    var lang = ar() ? 'ar' : 'en';
    var nm = S.DAY_NAMES[lang][S.DAYS_ORDER[d.getDay()]];
    return ar() ? (nm + ' ' + d.getDate() + ' ' + S.MONTH_NAMES.ar[d.getMonth()])
                : (nm + ', ' + S.MONTH_NAMES.en[d.getMonth()] + ' ' + d.getDate());
  }

  function itemHtml(e) {
    var col = e.color;
    return '<div class="item" style="border-inline-start-color:' + col + '">' +
      '<div class="chk"></div>' +
      '<div class="itm-time">' + esc(e.allDay ? T('طوال اليوم', 'All-day') : S.fmtMin12(e.start)) + '</div>' +
      '<div class="itm-main">' +
        '<div class="itm-title">' + esc(shortLabel(e)) + '</div>' +
        '<div class="itm-sub">' + esc(S.evMeta(e)) + '</div>' +
      '</div>' +
      '<span class="pill" style="background:' + tint(col, 0.08) + ';color:' + col + ';border-color:' + tint(col, 0.3) + '">' +
        esc(e.course_code ? S.courseShort(e.course_code) : T('عام', 'General')) + '</span>' +
    '</div>';
  }

  
  function printWeeks(range) {
    var sections = '';
    var wkStart = S.getWeekStartDate(range.from);
    var guard = 0;
    while (wkStart <= range.to && guard++ < 40) {
      var wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 6);
      var wn = S.studyWeekNumber(wkStart);
      var days = S.eventsForRange(wkStart, wkEnd);
      var cards = days.map(function (d) {
        var hasExam = d.items.some(function (e) { return e.kind === 'exam'; });
        var body = d.items.length ? d.items.map(itemHtml).join('')
          : '<div class="none-card">' + T('لا أحداث', 'No events') + '</div>';
        return '<div class="day-wrapper"><div class="day-header' + (hasExam ? ' exam' : '') + '">' +
          '<span class="day-date">' + esc(dayLabel(d.date)) + '</span>' +
          '<span class="day-tag">' + d.items.length + ' ' + T('عنصر', 'items') + '</span></div>' +
          body + '</div>';
      }).join('');
      sections += '<div class="sec"><div class="sec-title"><span>' +
        esc(wkStart.getDate() + ' – ' + wkEnd.getDate() + ' ' + S.MONTH_NAMES[ar() ? 'ar' : 'en'][wkEnd.getMonth()] + ' ' + wkEnd.getFullYear()) +
        '</span>' + (wn ? '<span class="wk">' + T('الأسبوع ' + wn, 'Week ' + wn) + '</span>' : '') + '</div>' + cards + '</div>';
      wkStart = new Date(wkStart); wkStart.setDate(wkStart.getDate() + 7);
    }
    openDoc(T('الجدول الأسبوعي', 'Weekly Schedule'),
      header(T('الجدول الأسبوعي', 'Weekly Schedule'),
        S.fmtLocalDate(range.from) + ' → ' + S.fmtLocalDate(range.to)) + legend() + sections + footer());
  }

  
  function printMonths(count) {
    var st = S.currentState();
    var sections = '';
    for (var k = 0; k < count; k++) {
      var md = new Date(st.month.getFullYear(), st.month.getMonth() + k, 1);
      sections += monthSection(md);
    }
    openDoc(T('التقويم الشهري', 'Monthly Calendar'),
      header(T('التقويم الشهري', 'Monthly Calendar'),
        S.MONTH_NAMES[ar() ? 'ar' : 'en'][st.month.getMonth()] + ' ' + st.month.getFullYear() +
        (count > 1 ? ' +' + (count - 1) : '')) + legend() + sections + tipBox() + footer());
  }

  function monthSection(md) {
    var lang = ar() ? 'ar' : 'en';
    var first = new Date(md.getFullYear(), md.getMonth(), 1);
    var last = new Date(md.getFullYear(), md.getMonth() + 1, 0);
    var gridStart = new Date(first); gridStart.setDate(1 - first.getDay());
    var total = Math.ceil((last.getDate() + first.getDay()) / 7) * 7;
    var active = S.data().settings.active_days || [];

    var head = '<tr>' + S.DAYS_ORDER.map(function (d) {
      return '<th>' + esc(S.DAY_SHORT[lang][d]) + '</th>';
    }).join('') + '</tr>';

    var body = '', cur = new Date(gridStart);
    for (var i = 0; i < total; i++) {
      if (i % 7 === 0) body += '<tr>';
      var inMonth = cur.getMonth() === md.getMonth();
      var off = active.indexOf(S.DAYS_ORDER[cur.getDay()]) === -1;
      var items = inMonth ? S.eventsOnDate(cur) : [];
       
      var heavy = items.some(function (e) { return e.kind === 'exam'; }) || items.length >= 4;
      var wn = (cur.getDay() === 0 && inMonth) ? S.studyWeekNumber(cur) : null;
      body += '<td class="' + (!inMonth ? 'out' : (off ? 'off' : '')) + (heavy && inMonth ? ' heavy' : '') + '">' +
        (wn ? '<span class="wkcol">' + T('أ', 'W') + wn + '</span>' : '') +
        '<span class="dnum">' + cur.getDate() + '</span>' +
        items.slice(0, 5).map(chipHtml).join('') +
        (items.length > 5 ? '<span class="chip" style="background:#f1f5f9;color:#64748b">+' + (items.length - 5) + '</span>' : '') +
        '</td>';
      if (i % 7 === 6) body += '</tr>';
      cur.setDate(cur.getDate() + 1);
    }
    return '<div class="sec"><div class="sec-title"><span>' +
      esc(S.MONTH_NAMES[lang][md.getMonth()] + ' ' + md.getFullYear()) + '</span></div>' +
      '<table class="cal">' + head + body + '</table></div>';
  }

  function chipHtml(e) {
    var col = e.color;
    var t = e.allDay ? '' : '<span class="tm">' + esc(S.fmtMin12(e.start)) + '</span> ';
    return '<span class="chip' + (e.kind === 'exam' ? ' exam' : '') + '" style="background:' + tint(col, 0.13) +
      ';color:' + col + '">' + t + '<b>' + esc(shortLabel(e)) + '</b></span>';
  }

  
  function printAgenda(range) {
    var days = S.eventsForRange(range.from, range.to);
    var body = days.map(function (d) {
      if (!d.items.length) return '';
      return '<div class="day-wrapper"><div class="day-header">' +
        '<span class="day-date">' + esc(dayLabel(d.date)) + '</span>' +
        '<span class="day-tag">' + d.items.length + '</span></div>' +
        d.items.map(itemHtml).join('') + '</div>';
    }).join('');
    if (!body) body = '<div class="none-card">' + T('لا أحداث في هذا النطاق.', 'No events in this range.') + '</div>';
    openDoc(T('الأجندة', 'Agenda'),
      header(T('الأجندة', 'Agenda'), S.fmtLocalDate(range.from) + ' → ' + S.fmtLocalDate(range.to)) +
      legend() + body + footer());
  }

  
  function printPlan() {
    var d = S.data();
    var it = d.intensive || {};
    var p = (it.active && it.plans) ? it.plans[it.active] : null;
    if (!p || !p.sessions.length) {
      alert(T('لا خطة مكثّفة نشطة للطباعة.', 'No active intensive plan to print.'));
      return;
    }
    var byDate = {};
    p.sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    var body = Object.keys(byDate).sort().map(function (ds) {
      var dd = S.parseLocalDate(ds);
      var isExamDay = p.courses.some(function (c) { return p.exam_dates[c] === ds; });
      return '<div class="day-wrapper"><div class="day-header' + (isExamDay ? ' exam' : '') + '">' +
        '<span class="day-date">' + esc(dayLabel(dd)) + '</span>' +
        '<span class="day-tag">' + byDate[ds].length + ' ' + T('جلسة', 'sessions') + '</span></div>' +
        byDate[ds].map(function (s) {
          var col = S.courseColor(s.course);
          var label = s.kind === 'buffer' ? T('مراجعة ما قبل الاختبار', 'Pre-exam review')
                    : s.kind === 'spaced' ? T('مراجعة متباعدة', 'Spaced review')
                    : T('وحدة ' + parseInt(String(s.module).replace('M',''), 10), 'Module ' + parseInt(String(s.module).replace('M',''), 10)) +
                      (s.total_parts > 1 ? ' (' + s.part + '/' + s.total_parts + ')' : '');
          return '<div class="item" style="border-inline-start-color:' + col + '">' +
            '<div class="chk"></div>' +
            '<div class="itm-time">' + esc(S.fmtTime12(s.start_time)) + '</div>' +
            '<div class="itm-main"><div class="itm-title">' + esc(label) + '</div>' +
            '<div class="itm-sub">' + s.minutes + T(' دقيقة', ' minutes') + '</div></div>' +
            '<span class="pill" style="background:' + tint(col, 0.08) + ';color:' + col + ';border-color:' + tint(col, 0.3) + '">' +
            esc(S.courseShort(s.course)) + '</span></div>';
        }).join('') + '</div>';
    }).join('');

    var exams = p.courses.map(function (c) {
      return esc(S.courseShort(c)) + ': ' + esc(p.exam_dates[c] || '—');
    }).join(' · ');

    openDoc(T('الخطة المكثّفة', 'Intensive Plan'),
      header(T('خطة المذاكرة المكثّفة', 'Intensive Study Plan'), exams) + legend() + body + tipBox() + footer());
  }

  
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
