 

;(function () {
  'use strict';

  var D = window.GardenData;
  var LS_SCEN = 'gpa_scenario';   

  var GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  var scenario = '';               

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }

   
  function creditWord(n) {
    if (window.Garden && window.Garden.smartCount) {
      return window.Garden.smartCount(n, ['ساعة', 'ساعتين', 'ساعات'], ['credit', 'credits'], true);
    }
    return n + ' ' + (isAr() ? 'ساعة' : (n === 1 ? 'credit' : 'credits'));
  }

   

  function buildPoints() {
    var tl = D.gpaTimeline();
    var fcst = D.gpaForecast(scenario || null);
    var pts = tl.map(function (s) {
      return { name: s.name, gpa: s.cumGPA, kind: s.kind };
    });
    fcst.semesters.forEach(function (s) {
      if (!s.graded) return;         
      pts.push({ name: s.name, gpa: s.cumGPA, kind: 'plan' });
    });
    return { pts: pts, forecast: fcst, nowIndex: tl.length - 1 };
  }

  function renderChart() {
    var svg = el('fc-chart');
    if (!svg) return;
    var data = buildPoints();
    var pts = data.pts;

     
    var title = svg.querySelector('title');
    svg.innerHTML = '';
    if (title) svg.appendChild(title);

    if (pts.length < 1) {
      el('fc-chart-wrap').classList.add('is-empty');
      return;
    }
    el('fc-chart-wrap').classList.remove('is-empty');

    var W = 640, H = 220, padX = 38, padY = 18;
    var innerW = W - padX * 2, innerH = H - padY * 2;

     
    var minG = 0, maxG = 4;
    var x = function (i) { return padX + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW); };
    var y = function (g) { return padY + innerH - ((g - minG) / (maxG - minG)) * innerH; };

    var ns = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs) {
      var e = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      return e;
    }

    
    [1, 2, 3, 4].forEach(function (g) {
      svg.appendChild(mk('line', {
        x1: padX, x2: W - padX, y1: y(g), y2: y(g),
        stroke: 'var(--border-color)', 'stroke-width': 1, 'stroke-dasharray': '3 4'
      }));
      var t = mk('text', { x: padX - 8, y: y(g) + 4, 'text-anchor': 'end',
                           fill: 'var(--text-muted)', 'font-size': 11 });
      t.textContent = g.toFixed(1);
      svg.appendChild(t);
    });

     
    var solid = pts.filter(function (p) { return p.kind !== 'plan'; });
    var planStart = solid.length ? solid.length - 1 : 0;
    var dashed = pts.slice(planStart);

    function poly(list, offset, color, dash) {
      if (list.length < 2) return;
      var d = list.map(function (p, i) { return x(i + offset) + ',' + y(p.gpa); }).join(' ');
      var attrs = { points: d, fill: 'none', stroke: color, 'stroke-width': 2.5,
                    'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
      if (dash) attrs['stroke-dasharray'] = '6 5';
      svg.appendChild(mk('polyline', attrs));
    }
    poly(solid, 0, 'var(--st-accent)', false);
    poly(dashed, planStart, 'var(--st-warn)', true);

    
    pts.forEach(function (p, i) {
      var isNow = i === data.nowIndex;
      svg.appendChild(mk('circle', {
        cx: x(i), cy: y(p.gpa), r: isNow ? 5.5 : 4,
        fill: p.kind === 'plan' ? 'var(--st-warn)' : 'var(--st-accent)',
        stroke: 'var(--bg-card)', 'stroke-width': isNow ? 3 : 2
      }));
      var lab = mk('text', { x: x(i), y: y(p.gpa) - 11, 'text-anchor': 'middle',
                             fill: 'var(--text-secondary)', 'font-size': 10, 'font-weight': 700 });
      lab.textContent = fmt(p.gpa);
      svg.appendChild(lab);

      var nm = mk('text', { x: x(i), y: H - 4, 'text-anchor': 'middle',
                            fill: 'var(--text-muted)', 'font-size': 9 });
      nm.textContent = p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name;
      svg.appendChild(nm);
    });
  }

   

  function renderPlan() {
    var box = el('fc-plan-list');
    if (!box) return;
    var plan = D.gpaPlan();

    if (!plan.semesters.length) {
      box.innerHTML = '<div class="fc-empty">' +
        '<div class="fc-empty-icon">📈</div>' +
        '<p>' + esc(tx('لا فصول مخططة بعد — أضف فصلاً وقدّر درجاتك لترى مسارك حتى التخرج',
                       'No planned semesters yet — add one and estimate your grades to see your path')) + '</p>' +
        '</div>';
      return;
    }

    box.innerHTML = plan.semesters.map(function (sem) {
      var rows = (sem.courses || []).map(function (c, ci) {
        var opts = GRADES.map(function (g) {
          return '<option value="' + g + '"' + (c.grade === g ? ' selected' : '') + '>' + g + '</option>';
        }).join('');
        var crOpts = [1, 2, 3, 4, 5, 6].map(function (cr) {
          return '<option value="' + cr + '"' + ((c.credits || 3) === cr ? ' selected' : '') + '>' + cr + '</option>';
        }).join('');
        return '<div class="fc-course">' +
          '<input class="fc-course-name" value="' + esc(c.name || c.code || '') + '" data-course-name="' + esc(sem.id) + '" data-ci="' + ci + '" ' +
            'placeholder="' + esc(tx('اسم المادة', 'Course name')) + '" aria-label="' + esc(tx('اسم المادة', 'Course name')) + '">' +
          '<select class="fc-course-cr" data-course-cr="' + esc(sem.id) + '" data-ci="' + ci + '" ' +
            'aria-label="' + esc(tx('الساعات', 'Credits')) + '" title="' + esc(tx('الساعات', 'Credits')) + '">' + crOpts + '</select>' +
          '<select class="fc-grade" data-sem="' + esc(sem.id) + '" data-ci="' + ci + '"' +
            (scenario ? ' disabled' : '') + '>' +
            '<option value="">—</option>' + opts +
          '</select>' +
          '<button class="fc-del" data-del-course="' + esc(sem.id) + '" data-ci="' + ci + '" ' +
            'aria-label="' + esc(tx('حذف', 'Delete')) + '">🗑</button>' +
        '</div>';
      }).join('');

      return '<div class="fc-sem">' +
        '<div class="fc-sem-head">' +
          '<input class="fc-sem-name" value="' + esc(sem.name || '') + '" data-sem-name="' + esc(sem.id) + '" ' +
            'aria-label="' + esc(tx('اسم الفصل', 'Semester name')) + '">' +
          '<button class="fc-btn-sm" data-add-course="' + esc(sem.id) + '" title="' + esc(tx('مادة يدوية', 'Manual course')) + '">+ ' + esc(tx('مادة', 'course')) + '</button>' +
          '<button class="fc-btn-sm" data-add-catalog="' + esc(sem.id) + '" title="' + esc(tx('من الفهرس', 'From catalog')) + '">＋ ' + esc(tx('الفهرس', 'catalog')) + '</button>' +
          '<button class="fc-btn-sm" data-add-batch="' + esc(sem.id) + '" title="' + esc(tx('إضافة دفعة (3 مواد)', 'Add a batch (3 courses)')) + '">+3</button>' +
          '<button class="fc-del" data-del-sem="' + esc(sem.id) + '" aria-label="' + esc(tx('حذف الفصل', 'Delete semester')) + '">🗑</button>' +
        '</div>' +
        (rows || '<div class="fc-hint">' + esc(tx('لا مواد بعد', 'No courses yet')) + '</div>') +
      '</div>';
    }).join('');
  }

   

  function renderTarget() {
    var out = el('fc-target-out');
    var inp = el('fc-target-input');
    if (!out || !inp) return;

    var target = parseFloat(inp.value);
    if (isNaN(target) || target < 0 || target > 4) {
      out.className = 'fc-target-out is-warn';
      out.textContent = tx('أدخل معدلاً بين 0 و 4', 'Enter a GPA between 0 and 4');
      return;
    }

    var fcst = D.gpaForecast(null);
    var rem = fcst.plannedCredits;
     
    if (!rem) {
      var plan = D.gpaPlan();
      var anyCredits = plan.semesters.some(function (s) { return (s.courses || []).length; });
      out.className = 'fc-target-out is-warn';
      out.textContent = anyCredits
        ? tx('قدّر درجات موادك المخططة أولاً', 'Estimate grades for your planned courses first')
        : tx('أضف فصلاً مخططاً بمواده لتحسب المطلوب', 'Add a planned semester with its courses first');
      return;
    }

    var r = D.gpaTarget(target, rem);
    if (!r.possible) {
      out.className = 'fc-target-out is-warn';
      out.textContent = tx('لا ساعات متبقية في خطتك', 'No remaining credits in your plan');
      return;
    }

    if (!r.feasible || target > r.maxAchievable + 1e-9) {
      out.className = 'fc-target-out is-bad';
      out.innerHTML = esc(tx('غير ممكن رياضياً بهذه الخطة. أقصى معدل تبلغه: ',
                             'Not mathematically possible with this plan. Your max is: ')) +
        '<b>' + fmt(r.maxAchievable) + '</b>' +
        '<span class="fc-target-sub">' +
          esc(tx('(بافتراض A+ في كل الساعات المتبقية — ' + creditWord(r.remainingCredits) + ')',
                 '(assuming A+ in all ' + r.remainingCredits + ' remaining credits)')) +
        '</span>';
      return;
    }

    var msg = r.needed <= 3.0 ? tx('في متناولك بإذن الله.', 'Well within reach.')
            : r.needed <= 3.5 ? tx('يتطلب انتظاماً جيداً.', 'Requires solid consistency.')
            : r.needed <= 3.9 ? tx('صعب لكن ممكن — يحتاج تركيزاً عالياً.', 'Hard but possible — needs high focus.')
            : tx('على الحافة تماماً — لا مجال لخطأ.', 'Right at the edge — no room for error.');

    out.className = 'fc-target-out is-good';
    out.innerHTML = esc(tx('تحتاج متوسط ', 'You need an average of ')) +
      '<b>' + fmt(r.needed) + '</b>' +
      esc(tx(' في الساعات المتبقية (' + creditWord(r.remainingCredits) + '). ',
             ' across your remaining ' + r.remainingCredits + ' credits. ')) +
      '<span class="fc-target-sub">' + esc(msg) + '</span>';
  }

   

  function renderAll() {
    var sec = el('forecast-section');
    if (!sec) return;
     
    var tl = D.gpaTimeline();
    sec.style.display = tl.length ? '' : 'none';
    if (!tl.length) return;

    renderChart();
    renderPlan();
    renderTarget();
  }

   

  function uid(p) { return p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }

  function addSemester() {
    var plan = D.gpaPlan();
    var n = plan.semesters.length + 1;
    plan.semesters.push({ id: uid('psem'), name: tx('فصل مخطّط ' + n, 'Planned ' + n), courses: [] });
    D.saveGpaPlan(plan);
    renderAll();
  }

  function addCourse(semId) {
    var plan = D.gpaPlan();
    var sem = plan.semesters.find(function (s) { return s.id === semId; });
    if (!sem) return;
    sem.courses.push({ code: '', name: tx('مادة جديدة', 'New course'), credits: 3, grade: '' });
    D.saveGpaPlan(plan);
    renderAll();
  }

   
  function addBatch(semId, n) {
    var plan = D.gpaPlan();
    var sem = plan.semesters.find(function (s) { return s.id === semId; });
    if (!sem) return;
    var base = (sem.courses || []).length;
    for (var i = 1; i <= n; i++) {
      sem.courses.push({ code: '', name: tx('مادة ' + (base + i), 'Course ' + (base + i)), credits: 3, grade: '' });
    }
    D.saveGpaPlan(plan);
    renderAll();
  }

   
  function openCatalogPicker(semId) {
    var list = (D.catalogList && D.catalogList()) || [];
    var ov = document.createElement('div');
    ov.className = 'fc-pick-overlay';
    ov.innerHTML =
      '<div class="fc-pick" role="dialog" aria-modal="true">' +
        '<div class="fc-pick-head">' +
          '<input class="fc-pick-search" type="search" placeholder="' + esc(tx('ابحث عن مادة…', 'Search a course…')) + '" aria-label="' + esc(tx('بحث', 'Search')) + '">' +
          '<button class="fc-pick-close" aria-label="' + esc(tx('إغلاق', 'Close')) + '">✕</button>' +
        '</div>' +
        '<div class="fc-pick-list"></div>' +
      '</div>';
    document.body.appendChild(ov);
    var listBox = ov.querySelector('.fc-pick-list');
    var search = ov.querySelector('.fc-pick-search');

    function draw(q) {
      q = (q || '').trim().toLowerCase();
      var rows = list.filter(function (c) {
        return !q || (c.code || '').toLowerCase().indexOf(q) !== -1 ||
          (c.name_ar || '').toLowerCase().indexOf(q) !== -1 || (c.name_en || '').toLowerCase().indexOf(q) !== -1;
      }).map(function (c) {
        return '<button class="fc-pick-item" data-code="' + esc(c.code) + '">' +
          '<span>' + esc(isAr() ? c.name_ar : c.name_en) + '</span>' +
          '<small>' + esc(c.code) + ' · ' + esc(creditWord(c.credits || 3)) + '</small></button>';
      }).join('');
      listBox.innerHTML = rows || '<div class="fc-hint">' + esc(tx('لا نتائج', 'No results')) + '</div>';
    }
    draw('');

    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.fc-pick-close')) { close(); return; }
      var it = e.target.closest && e.target.closest('.fc-pick-item');
      if (it) {
        var code = it.getAttribute('data-code');
        var info = D.courseInfo(code);
        var plan = D.gpaPlan();
        var sem = plan.semesters.find(function (s) { return s.id === semId; });
        if (sem && info) {
          sem.courses.push({ code: code, name: isAr() ? info.name_ar : info.name_en, credits: info.credits || 3, grade: '' });
          D.saveGpaPlan(plan);
          renderAll();
        }
        close();
      }
    });
    search.addEventListener('input', function () { draw(search.value); });
    search.focus();
  }

  function onAction(e) {
    var t = e.target;

    var addC = t.closest && t.closest('[data-add-course]');
    if (addC) { addCourse(addC.getAttribute('data-add-course')); return; }

     
    var addB = t.closest && t.closest('[data-add-batch]');
    if (addB) { addBatch(addB.getAttribute('data-add-batch'), 3); return; }

    var addCat = t.closest && t.closest('[data-add-catalog]');
    if (addCat) { openCatalogPicker(addCat.getAttribute('data-add-catalog')); return; }

    var delS = t.closest && t.closest('[data-del-sem]');
    if (delS) {
      if (!confirm(tx('حذف هذا الفصل المخطط؟', 'Delete this planned semester?'))) return;
      var plan = D.gpaPlan();
      plan.semesters = plan.semesters.filter(function (s) { return s.id !== delS.getAttribute('data-del-sem'); });
      D.saveGpaPlan(plan);
      renderAll();
      return;
    }

    var delC = t.closest && t.closest('[data-del-course]');
    if (delC) {
      var p2 = D.gpaPlan();
      var s2 = p2.semesters.find(function (s) { return s.id === delC.getAttribute('data-del-course'); });
      if (s2) { s2.courses.splice(parseInt(delC.getAttribute('data-ci'), 10), 1); D.saveGpaPlan(p2); renderAll(); }
      return;
    }

    var scen = t.closest && t.closest('.fc-scen');
    if (scen) {
      scenario = scen.getAttribute('data-scen') || '';
      try { localStorage.setItem(LS_SCEN, scenario); } catch (_) {}
      document.querySelectorAll('.fc-scen').forEach(function (b) { b.classList.toggle('active', b === scen); });
      renderAll();
      return;
    }
  }

  function onChange(e) {
    var g = e.target.closest && e.target.closest('.fc-grade');
    if (g) {
      var plan = D.gpaPlan();
      var sem = plan.semesters.find(function (s) { return s.id === g.getAttribute('data-sem'); });
      if (sem) {
        var c = sem.courses[parseInt(g.getAttribute('data-ci'), 10)];
        if (c) { c.grade = g.value; D.saveGpaPlan(plan); renderChart(); renderTarget(); }
      }
      return;
    }
    var nm = e.target.closest && e.target.closest('[data-sem-name]');
    if (nm) {
      var p = D.gpaPlan();
      var s = p.semesters.find(function (x) { return x.id === nm.getAttribute('data-sem-name'); });
      if (s) { s.name = nm.value; D.saveGpaPlan(p); renderChart(); }
      return;
    }
     
    var cn = e.target.closest && e.target.closest('[data-course-name]');
    if (cn) {
      var pl = D.gpaPlan();
      var sm = pl.semesters.find(function (x) { return x.id === cn.getAttribute('data-course-name'); });
      if (sm) { var cc = sm.courses[parseInt(cn.getAttribute('data-ci'), 10)]; if (cc) { cc.name = cn.value; D.saveGpaPlan(pl); } }
      return;
    }
     
    var cr = e.target.closest && e.target.closest('[data-course-cr]');
    if (cr) {
      var pl2 = D.gpaPlan();
      var sm2 = pl2.semesters.find(function (x) { return x.id === cr.getAttribute('data-course-cr'); });
      if (sm2) { var cc2 = sm2.courses[parseInt(cr.getAttribute('data-ci'), 10)]; if (cc2) { cc2.credits = parseInt(cr.value, 10) || 3; D.saveGpaPlan(pl2); renderChart(); renderTarget(); } }
      return;
    }
  }

  function init() {
    if (!D) return;
    try { scenario = localStorage.getItem(LS_SCEN) || ''; } catch (_) {}
    document.querySelectorAll('.fc-scen').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-scen') || '') === scenario);
    });

    var add = el('fc-add-sem');
    if (add) add.addEventListener('click', addSemester);
    document.addEventListener('click', onAction);
    document.addEventListener('change', onChange);
    var ti = el('fc-target-input');
    if (ti) ti.addEventListener('input', renderTarget);
    document.addEventListener('garden:languageChanged', renderAll);

    D.ready().then(renderAll).catch(renderAll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
