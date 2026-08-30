;(function () {
  'use strict';

  /*@3.EXPJ.1*/
  var ExportPNG = {};

  var GRADE_PTS = { 'A+':4,'A':3.75,'B+':3.5,'B':3,'C+':2.5,'C':2,'D+':1.5,'D':1,'F':0 };
  var GRADE_COLORS = { 'A+':'#10b981','A':'#10b981','B+':'#3b82f6','B':'#3b82f6','C+':'#f59e0b','C':'#f59e0b','D+':'#f97316','D':'#f97316','F':'#ef4444' };

  function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }
  function isArLang() {
    return (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  }
  function downloadCanvas(canvas, filename) {
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  /*@3.EXPJ.2*/
  ExportPNG.exportGPA = function () {
    var cumGPA = 0, courses = [];
    try {
      var data = JSON.parse(localStorage.getItem('gpa_grades') || '{}');
      if (!data.semesters) return;

      var allGraded = [];
      var currentCourses = [];
      data.semesters.forEach(function (sem) {
        sem.courses.forEach(function (c) {
          if (c.grade && GRADE_PTS[c.grade] !== undefined) {
            allGraded.push({ credits: c.credits, points: GRADE_PTS[c.grade] });
          }
          if (sem.is_current) currentCourses.push(c);
        });
      });

      var tp = 0, tc = 0;
      allGraded.forEach(function (c) { tp += c.points * c.credits; tc += c.credits; });
      cumGPA = tc > 0 ? tp / tc : 0;
      courses = currentCourses;
    } catch (e) { return; }

    var isAr = isArLang();
    var isDark = isDarkTheme();
    var width = 600, height = 210 + courses.length * 36;
    var canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = isDark ? '#111827' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = isDark ? '#ffffff' : '#111827';
    ctx.font = 'bold 20px Inter, Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(isAr ? 'المعدل الدراسي' : 'GPA Calculator', width / 2, 35);

    /*@3.EXPJ.3*/
    var cx = width / 2, cy = 100, r = 45;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 8;
    ctx.stroke();

    var color = '#ef4444';
    if (cumGPA >= 3.5) color = '#10b981';
    else if (cumGPA >= 2.5) color = '#3b82f6';
    else if (cumGPA >= 1.5) color = '#f59e0b';

    var percent = Math.min(cumGPA / 4, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * percent);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = isDark ? '#ffffff' : '#111827';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cumGPA.toFixed(2), cx, cy);
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '11px Cairo, Inter, sans-serif';
    ctx.fillText((isAr ? 'من' : 'of') + ' 4.00', cx, cy + 20);
    ctx.textBaseline = 'alphabetic';

    /*@3.EXPJ.4*/
    var startY = 175;
    ctx.font = 'bold 11px Inter, Cairo, sans-serif';
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    var x1 = isAr ? width - 30 : 30;
    var x2 = isAr ? 30 : width - 30;
    ctx.textAlign = isAr ? 'right' : 'left';
    ctx.fillText(isAr ? 'المادة' : 'Course', x1, startY);
    ctx.textAlign = 'center';
    ctx.fillText(isAr ? 'ساعات' : 'Credits', width / 2, startY);
    ctx.textAlign = isAr ? 'left' : 'right';
    ctx.fillText(isAr ? 'التقدير' : 'Grade', x2, startY);

    startY += 8;
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(20, startY); ctx.lineTo(width - 20, startY); ctx.stroke();

    courses.forEach(function (c, i) {
      var y = startY + 24 + i * 36;
      var name = isAr ? (c.name_ar || c.code) : (c.name_en || c.code);
      if (name.length > 30) name = name.substring(0, 27) + '…';

      ctx.font = '13px Cairo, Inter, sans-serif';
      ctx.fillStyle = isDark ? '#f3f4f6' : '#1f2937';
      ctx.textAlign = isAr ? 'right' : 'left';
      ctx.fillText(name, x1, y);

      ctx.textAlign = 'center';
      ctx.fillText(String(c.credits), width / 2, y);

      ctx.fillStyle = c.grade ? (GRADE_COLORS[c.grade] || '#9ca3af') : '#9ca3af';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = isAr ? 'left' : 'right';
      ctx.fillText(c.grade || '—', x2, y);
    });

    ctx.fillStyle = isDark ? '#4b5563' : '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الحديقة الرقمية · Digital Garden', width / 2, height - 12);

    downloadCanvas(canvas, 'GPA_' + new Date().toISOString().slice(0, 10) + '.png');
  };

  /*@3.EXPJ.5*/
  var DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var DAY_NAMES_AR = { sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء', thursday:'الخميس', friday:'الجمعة', saturday:'السبت' };
  var DAY_NAMES_EN = { sunday:'Sunday', monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };

  ExportPNG.exportSchedule = function () {
    var schedule, semester = null;
    try {
      schedule = JSON.parse(localStorage.getItem('weekly_schedule') || 'null');
      semester = JSON.parse(localStorage.getItem('my_semester') || 'null');
    } catch (e) { return; }
    if (!schedule) return;

    var isAr = isArLang();
    var isDark = isDarkTheme();
    var dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

    var activeDays = (schedule.settings && schedule.settings.active_days ? schedule.settings.active_days.slice() : [])
      .sort(function (a, b) { return DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b); });

    function courseName(code) {
      if (!code) return '';
      if (String(code).indexOf('__CUSTOM_') === 0 && semester && semester.courses) {
        var sc = semester.courses.find(function (c) { return c.code === code; });
        if (sc) return isAr ? (sc.name_ar || code) : (sc.name_en || code);
      }
      return code;
    }

    /*@3.EXPJ.6*/
    function eventsForDay(day) {
      var list = [];
      (schedule.lectures || []).forEach(function (l) {
        if (l.day === day && l.recurring) {
          list.push({ time: l.start_time, end: l.end_time, name: courseName(l.course_code), meta: (l.room || ''), color: l.color || '#a78bfa', kind: 'lec' });
        }
      });
      (schedule.study_blocks || []).forEach(function (s) {
        if (s.day === day && (s.week_id === null || s.week_id === undefined)) {
          list.push({ time: s.start_time, dur: s.duration_minutes, name: courseName(s.course_code), meta: (isAr ? 'مذاكرة' : 'Study'), color: '#a78bfa', kind: 'study' });
        }
      });
      list.sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
      return list;
    }

    /*@3.EXPJ.7*/
    var lineH = 26, dayHeaderH = 30, dayGap = 10;
    var bodyH = 0;
    var dayData = activeDays.map(function (d) {
      var evs = eventsForDay(d);
      bodyH += dayHeaderH + Math.max(1, evs.length) * lineH + dayGap;
      return { day: d, events: evs };
    });

    var width = 620, height = 90 + bodyH + 30;
    var canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = isDark ? '#111827' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = isDark ? '#ffffff' : '#111827';
    ctx.font = 'bold 20px Inter, Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isAr ? 'الجدول الأسبوعي' : 'Weekly Schedule', width / 2, 40);

    var startX = isAr ? width - 30 : 30;
    var alignMain = isAr ? 'right' : 'left';
    var y = 80;

    dayData.forEach(function (dd) {
      /*@3.EXPJ.8*/
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 14px Cairo, Inter, sans-serif';
      ctx.textAlign = alignMain;
      ctx.fillText(dayNames[dd.day], startX, y);
      y += 6;
      ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(width - 20, y); ctx.stroke();
      y += dayHeaderH - 6;

      if (dd.events.length === 0) {
        ctx.fillStyle = isDark ? '#6b7280' : '#9ca3af';
        ctx.font = '12px Cairo, Inter, sans-serif';
        ctx.textAlign = alignMain;
        ctx.fillText(isAr ? '— لا شيء —' : '— none —', startX, y);
        y += lineH;
      } else {
        dd.events.forEach(function (ev) {
          /*@3.EXPJ.9*/
          var dotX = isAr ? width - 30 : 30;
          ctx.fillStyle = ev.color;
          ctx.beginPath();
          ctx.arc(dotX, y - 4, 4, 0, 2 * Math.PI);
          ctx.fill();

          /*@3.EXPJ.10*/
          var textX = isAr ? width - 44 : 44;
          ctx.fillStyle = isDark ? '#f3f4f6' : '#1f2937';
          ctx.font = 'bold 13px Cairo, Inter, sans-serif';
          ctx.textAlign = alignMain;
          var timeStr = ev.time + (ev.end ? ('–' + ev.end) : '');
          var label = ev.name + '  ·  ' + timeStr + (ev.meta ? ('  ·  ' + ev.meta) : '');
          if (label.length > 52) label = label.substring(0, 49) + '…';
          ctx.fillText(label, textX, y);
          y += lineH;
        });
      }
      y += dayGap;
    });

    ctx.fillStyle = isDark ? '#4b5563' : '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الحديقة الرقمية · Digital Garden', width / 2, height - 12);

    downloadCanvas(canvas, 'Schedule_' + new Date().toISOString().slice(0, 10) + '.png');
  };

  window.ExportPNG = ExportPNG;
})();
