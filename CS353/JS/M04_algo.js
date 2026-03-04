// M04_algo.js - Interactive algorithm widgets
// Generated: 2023-10-25T12:00:00Z
// Diagrams: 3/3 (Additional algorithms from text)

window.AlgoWidgets = window.AlgoWidgets || {};

var _AL = {
  lang: function () { return document.documentElement.lang || 'ar'; },
  i18n: {
    prev: { ar: 'السابق', en: 'Prev' },
    step: { ar: 'التالي', en: 'Next' },
    play: { ar: '▶ تشغيل', en: '▶ Play' },
    pause: { ar: '❚❚ إيقاف', en: '❚❚ Pause' },
    reset: { ar: '↺ إعادة', en: '↺ Reset' },
    stepN: { ar: 'الخطوة', en: 'Step' },
    fast: { ar: 'سريع', en: 'Fast' },
    slow: { ar: 'بطيء', en: 'Slow' }
  },
  t: function (k) { return this.i18n[k] ? (this.i18n[k][this.lang()] || this.i18n[k].en) : k; },
  stepLabel: function (c, t) { return this.t('stepN') + ': ' + c + ' / ' + t; },
  exp: function (en, ar) { return this.lang() === 'ar' ? ar : en; },
  speedToDelay: function (v) { return 2100 - (v * 20); },
  toolbar: function (id) {
    return '<div class="algo-toolbar" data-algo-toolbar="' + id + '">' +
      '<button data-algo-btn="prev">' + this.t('prev') + '</button>' +
      '<button data-algo-btn="play">' + this.t('play') + '</button>' +
      '<button data-algo-btn="step">' + this.t('step') + '</button>' +
      '<button data-algo-btn="reset">' + this.t('reset') + '</button>' +
      '</div>' +
      '<div class="algo-controls-row">' +
      '<span class="step-counter" data-algo-counter>' + this.stepLabel(0, 0) + '</span>' +
      '<div class="algo-speed" data-algo-speed>' +
      '<span data-algo-speed-slow>' + this.t('slow') + '</span>' +
      '<input type="range" min="1" max="100" value="60" step="1">' +
      '<span data-algo-speed-fast>' + this.t('fast') + '</span>' +
      '</div>' +
      '</div>';
  },
  titleHTML: function (id) {
    var t = window._algoTitles && window._algoTitles[id];
    if (!t) return '';
    var text = this.lang() === 'ar' ? t.ar : t.en;
    return '<h4 class="algo-title" data-algo-title="' + id + '">' + text + '</h4>';
  },
  refreshToolbars: function () {
    var self = this;
    document.querySelectorAll('[data-algo-toolbar]').forEach(function (tb) {
      tb.querySelector('[data-algo-btn="prev"]').textContent = self.t('prev');
      tb.querySelector('[data-algo-btn="step"]').textContent = self.t('step');
      var pb = tb.querySelector('[data-algo-btn="play"]');
      pb.textContent = pb.dataset.playing === '1' ? self.t('pause') : self.t('play');
      tb.querySelector('[data-algo-btn="reset"]').textContent = self.t('reset');
    });
    document.querySelectorAll('[data-algo-speed-slow]').forEach(function (s) { s.textContent = self.t('slow'); });
    document.querySelectorAll('[data-algo-speed-fast]').forEach(function (s) { s.textContent = self.t('fast'); });
  }
};

window._algoRerenders = window._algoRerenders || {};
window._algoRefresh = function () {
  _AL.refreshToolbars();
  document.querySelectorAll('[data-algo-title]').forEach(function (el) {
    var id = el.dataset.algoTitle;
    var t = window._algoTitles && window._algoTitles[id];
    if (t) el.textContent = _AL.lang() === 'ar' ? t.ar : t.en;
  });
  Object.values(window._algoRerenders).forEach(function (fn) { try { fn(); } catch (e) { } });
};

function _algoBindSpeed(container, getDelay, restartFn) {
  var input = container.querySelector('.algo-speed input');
  input.addEventListener('input', function () {
    var playBtn = container.querySelector('[data-algo-btn="play"]');
    if (playBtn && playBtn.dataset.playing === '1') restartFn();
  });
}

window._algoTitles = window._algoTitles || {};

// WIDGET 1: Introduction to Decrease-and-Conquer (Flowchart)
window._algoTitles[1] = { en: 'Decrease-and-Conquer Flowchart', ar: 'مخطط تقليل وحل' };
window.AlgoWidgets[1] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(1) + _AL.toolbar(1) +
    '<div class="algo-explanation" id="w1-exp"></div>' +
    '<div class="algo-canvas" id="w1-canvas" style="height:250px; position:relative;"></div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w1-exp');
  var cvsEl = container.querySelector('#w1-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  function updateLabels() { }

  function generateSteps() {
    steps = [
      { step: 0, showSub: false, showSol: false, showComb: false, en: "Start with a problem of size n.", ar: "نبدأ بمشكلة بحجم n." },
      { step: 1, showSub: true, showSol: false, showComb: false, en: "Step 1: Decrease to a smaller subproblem.", ar: "الخطوة 1: تقليل إلى مشكلة فرعية أصغر." },
      { step: 2, showSub: true, showSol: true, showComb: false, en: "Step 2: Conquer (solve) the subproblem.", ar: "الخطوة 2: حل المشكلة الفرعية." },
      { step: 3, showSub: true, showSol: true, showComb: true, en: "Step 3: Combine/Extend the sub-solution to solve the original problem.", ar: "الخطوة 3: توسيع الحل الفرعي لحل المشكلة الأصلية." }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var html = '<div style="width:100%; height:100%; position:relative; font-family:sans-serif; ">';

    // Problem Node
    html += '<div style="position:absolute; top:10px; left:50%; transform:translateX(-50%); padding:10px 20px; border-radius:8px; background:var(--brand-500); color:var(--algo-text); font-weight:bold; border:2px solid var(--algo-text); z-index:2;">Problem (Size n)</div>';

    // Subproblem Node
    var opacitySub = s.showSub ? '1' : '0.2';
    html += '<div style="position:absolute; top:90px; left:20%; transform:translateX(-50%); padding:10px 20px; border-radius:8px; background:var(--algo-swap); color:var(--algo-text); border:2px solid var(--brand-500); opacity:' + opacitySub + '; transition:opacity 0.3s; z-index:2;">Subproblem</div>';

    // SubSolution Node
    var opacitySol = s.showSol ? '1' : '0.2';
    html += '<div style="position:absolute; top:170px; left:20%; transform:translateX(-50%); padding:10px 20px; border-radius:8px; background:var(--algo-compare); color:var(--algo-text); border:2px solid var(--brand-500); opacity:' + opacitySol + '; transition:opacity 0.3s; z-index:2;">Sub-Solution</div>';

    // Final Solution Node
    var opacityComb = s.showComb ? '1' : '0.2';
    html += '<div style="position:absolute; top:170px; left:80%; transform:translateX(-50%); padding:10px 20px; border-radius:8px; background:var(--algo-sorted); color:var(--algo-text); border:2px solid var(--brand-500); opacity:' + opacityComb + '; transition:opacity 0.3s; z-index:2;">Solution</div>';

    // SVG Arrows
    html += '<svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;">';
    html += '<defs><marker id="arrow' + 1 + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker></defs>';

    // Decrease Arrow
    if (s.showSub) {
      html += '<path d="M 50% 45 Q 30% 60 25% 90" fill="none" stroke="var(--brand-500)" stroke-width="3" marker-end="url(#arrow' + 1 + ')"/>';
      html += '<text x="35%" y="60" fill="var(--algo-text)" font-size="12" text-anchor="middle">Step 1: Decrease</text>';
    }
    // Conquer Arrow
    if (s.showSol) {
      html += '<path d="M 20% 125 L 20% 170" fill="none" stroke="var(--brand-500)" stroke-width="3" marker-end="url(#arrow' + 1 + ')"/>';
      html += '<text x="25%" y="150" fill="var(--algo-text)" font-size="12" text-anchor="start">Step 2: Conquer</text>';
    }
    // Combine Arrow
    if (s.showComb) {
      html += '<path d="M 33% 185 L 70% 185" fill="none" stroke="var(--brand-500)" stroke-width="3" marker-end="url(#arrow' + 1 + ')"/>';
      html += '<text x="50%" y="180" fill="var(--algo-text)" font-size="12" text-anchor="middle">Step 3: Combine</text>';
    }

    html += '</svg>';
    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[1] = render;
  generateSteps();
  render();
};

// WIDGET 2: Topological Sorting
window._algoTitles[2] = { en: 'Topological Sorting', ar: 'الفرز الطوبولوجي' };
window.AlgoWidgets[2] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(2) + _AL.toolbar(2) +
    '<div class="algo-explanation" id="w2-exp"></div>' +
    '<div class="algo-canvas" id="w2-canvas" style="height:250px; position:relative;"></div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w2-exp');
  var cvsEl = container.querySelector('#w2-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  function updateLabels() { }

  function generateSteps() {
    steps = [
      { step: 0, nodes: [1, 2, 3, 4, 5], queue: [], out: [], en: "Initial graph. Find nodes with in-degree 0. C1 and C2 have no incoming edges.", ar: "الرسم البياني الأولي. البحث عن الرؤوس التي لا توجد حواف داخلة إليها. C1 و C2 ليس لهما حواف داخلة." },
      { step: 1, nodes: [2, 3, 4, 5], queue: [2], out: [1], en: "Remove C1 (source) and its outgoing edges. Next source is C2.", ar: "حذف C1 (المصدر) وحوافه الخارجة. المصدر التالي هو C2." },
      { step: 2, nodes: [3, 4, 5], queue: [3], out: [1, 2], en: "Remove C2. Now C3 has no incoming edges.", ar: "حذف C2. الآن C3 ليس له حواف داخلة." },
      { step: 3, nodes: [4, 5], queue: [4], out: [1, 2, 3], en: "Remove C3 and its edges. C4 now has in-degree 0.", ar: "حذف C3 وحوافه. C4 الآن درجة دخوله صفر." },
      { step: 4, nodes: [5], queue: [5], out: [1, 2, 3, 4], en: "Remove C4. Only C5 remains.", ar: "حذف C4. يتبقى فقط C5." },
      { step: 5, nodes: [], queue: [], out: [1, 2, 3, 4, 5], en: "Remove C5. the graph is empty. Topological sort is: C1, C2, C3, C4, C5.", ar: "حذف C5. الرسم البياني فارغ. الفرز الطوبولوجي هو: C1, C2, C3, C4, C5." }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    // Positions for C1, C2, C3, C4, C5
    var pos = {
      1: { x: 20, y: 20 },
      2: { x: 20, y: 80 },
      3: { x: 50, y: 50 },
      4: { x: 80, y: 50 },
      5: { x: 80, y: 80 }
    };

    var html = '<div style="width:100%; height:100%; position:relative; font-family:sans-serif;">';

    // Draw edges
    html += '<svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;">';
    html += '<defs><marker id="arrow2" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-border)"/></marker></defs>';

    var showNode = function (id) { return s.nodes.indexOf(id) !== -1; };

    if (showNode(1) && showNode(3)) html += '<path d="M 20% 60 L 50% 120" fill="none" stroke="var(--algo-border)" stroke-width="2" marker-end="url(#arrow2)"/>';
    if (showNode(2) && showNode(3)) html += '<path d="M 20% 210 L 50% 120" fill="none" stroke="var(--algo-border)" stroke-width="2" marker-end="url(#arrow2)"/>';
    if (showNode(3) && showNode(4)) html += '<path d="M 50% 120 L 80% 120" fill="none" stroke="var(--algo-border)" stroke-width="2" marker-end="url(#arrow2)"/>';
    if (showNode(3) && showNode(5)) html += '<path d="M 50% 120 L 80% 210" fill="none" stroke="var(--algo-border)" stroke-width="2" marker-end="url(#arrow2)"/>';
    if (showNode(4) && showNode(5)) html += '<path d="M 80% 120 L 80% 210" fill="none" stroke="var(--algo-border)" stroke-width="2" marker-end="url(#arrow2)"/>';

    html += '</svg>';

    // Draw nodes
    for (var i = 1; i <= 5; i++) {
      if (showNode(i)) {
        var bg = (s.queue.indexOf(i) !== -1 || (cur === 0 && (i === 1 || i === 2))) ? 'var(--brand-500)' : 'var(--algo-bg)';
        var color = (s.queue.indexOf(i) !== -1 || (cur === 0 && (i === 1 || i === 2))) ? 'var(--algo-text)' : 'var(--algo-text)';
        var borderC = 'var(--algo-border)';
        html += '<div style="position:absolute; top:' + (pos[i].y * 2.5 - 20) + 'px; left:' + pos[i].x + '%; transform:translateX(-50%); width:40px; height:40px; border-radius:50%; background:' + bg + '; color:' + color + '; border:2px solid ' + borderC + '; display:flex; align-items:center; justify-content:center; font-weight:bold; z-index:2; transition:all 0.3s;">C' + i + '</div>';
      }
    }

    // Output tape
    html += '<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:10px; z-index:2;">';
    for (var i = 0; i < s.out.length; i++) {
      html += '<div style="padding:5px 15px; background:var(--algo-sorted); border-radius:4px; color:var(--algo-text); border:1px solid var(--algo-border); font-weight:bold;">C' + s.out[i] + '</div>';
    }
    html += '</div>';

    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[2] = render;
  generateSteps();
  render();
};

// WIDGET 3: Types of Edges in a DFS Forest
window._algoTitles[3] = { en: 'Types of Edges in a DFS Forest', ar: 'أنواع الحواف في غابة البحث بالعمق' };
window.AlgoWidgets[3] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(3) + _AL.toolbar(3) +
    '<div class="algo-explanation" id="w3-exp"></div>' +
    '<div class="algo-canvas" id="w3-canvas" style="height:250px; position:relative;"></div>' +
    '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
    '<span><svg width="20" height="10" style="display:inline-block; margin-right:4px;"><path d="M 0 5 L 15 5" fill="none" stroke="var(--algo-sorted)" stroke-width="2" marker-end="url(#arrow3)"/></svg><span data-algo-text="w3-tree"></span></span>' +
    '<span><svg width="20" height="10" style="display:inline-block; margin-right:4px;"><path d="M 0 5 L 15 5" fill="none" stroke="var(--brand-500)" stroke-width="2" stroke-dasharray="2,2" marker-end="url(#arrow3b)"/></svg><span data-algo-text="w3-back"></span></span>' +
    '<span><svg width="20" height="10" style="display:inline-block; margin-right:4px;"><path d="M 0 5 L 15 5" fill="none" stroke="var(--algo-swap)" stroke-width="2" stroke-dasharray="4,2" marker-end="url(#arrow3c)"/></svg><span data-algo-text="w3-forward"></span></span>' +
    '<span><svg width="20" height="10" style="display:inline-block; margin-right:4px;"><path d="M 0 5 L 15 5" fill="none" stroke="var(--algo-compare)" stroke-width="2" stroke-dasharray="1,2" marker-end="url(#arrow3d)"/></svg><span data-algo-text="w3-cross"></span></span>' +
    '</div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w3-exp');
  var cvsEl = container.querySelector('#w3-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('[data-algo-text="w3-tree"]').textContent = ar ? 'حافة شجرة' : 'Tree Edge';
    container.querySelector('[data-algo-text="w3-back"]').textContent = ar ? 'حافة خلفية' : 'Back Edge';
    container.querySelector('[data-algo-text="w3-forward"]').textContent = ar ? 'حافة أمامية' : 'Forward Edge';
    container.querySelector('[data-algo-text="w3-cross"]').textContent = ar ? 'حافة متقاطعة' : 'Cross Edge';
  }

  function generateSteps() {
    steps = [
      { step: 0, nodes: ['a'], edges: [], en: "Start DFS at node a. a is marked as visited.", ar: "بدأ البحث بالعمق (DFS) عند العقدة a. تم تعليم a كمزارة." },
      { step: 1, nodes: ['a', 'b'], edges: [{ u: 'a', v: 'b', type: 'tree' }], en: "Follow edge a->b to an unvisited node. This is a Tree Edge.", ar: "تتبع الحافة a->b إلى عقدة غير مزارة. هذه حافة شجرة (Tree Edge)." },
      { step: 2, nodes: ['a', 'b', 'c'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }], en: "Follow edge b->c to an unvisited node. This is a Tree Edge.", ar: "تتبع الحافة b->c إلى عقدة غير مزارة. هذه حافة شجرة." },
      { step: 3, nodes: ['a', 'b', 'c'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }, { u: 'c', v: 'a', type: 'back' }], en: "Edge c->a goes to an ancestor in the DFS tree. This is a Back Edge (indicates a cycle).", ar: "الحافة c->a تتجه إلى سلف في شجرة DFS. هذه حافة خلفية (Back Edge - تشير لدورة)." },
      { step: 4, nodes: ['a', 'b', 'c'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }, { u: 'c', v: 'a', type: 'back' }, { u: 'a', v: 'c', type: 'forward' }], en: "Edge a->c goes to a descendent that is not a child. This is a Forward Edge.", ar: "الحافة a->c تتجه إلى حفيد ليس طفلاً مباشراً. هذه حافة أمامية (Forward Edge)." },
      { step: 5, nodes: ['a', 'b', 'c', 'd'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }, { u: 'c', v: 'a', type: 'back' }, { u: 'a', v: 'c', type: 'forward' }, { u: 'a', v: 'd', type: 'tree' }], en: "DFS backtracks to a, follows edge a->d. This is a Tree Edge.", ar: "يتراجع DFS إلى a، ثم يتتبع החافة a->d. هذه حافة شجرة." },
      { step: 6, nodes: ['a', 'b', 'c', 'd', 'e'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }, { u: 'c', v: 'a', type: 'back' }, { u: 'a', v: 'c', type: 'forward' }, { u: 'a', v: 'd', type: 'tree' }, { u: 'd', v: 'e', type: 'tree' }], en: "Follow edge d->e. This is a Tree Edge.", ar: "تتبع الحافة d->e. هذه حافة شجرة." },
      { step: 7, nodes: ['a', 'b', 'c', 'd', 'e'], edges: [{ u: 'a', v: 'b', type: 'tree' }, { u: 'b', v: 'c', type: 'tree' }, { u: 'c', v: 'a', type: 'back' }, { u: 'a', v: 'c', type: 'forward' }, { u: 'a', v: 'd', type: 'tree' }, { u: 'd', v: 'e', type: 'tree' }, { u: 'd', v: 'c', type: 'cross' }], en: "Edge d->c goes to a previously visited node in a different branch. This is a Cross Edge.", ar: "الحافة d->c تتجه إلى عقدة تمت زيارتها مسبقاً في فرع مختلف. هذه حافة متقاطعة (Cross Edge)." }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var pos = {
      'a': { x: 50, y: 20 },
      'b': { x: 30, y: 50 },
      'c': { x: 30, y: 80 },
      'd': { x: 70, y: 50 },
      'e': { x: 70, y: 80 }
    };

    var html = '<div style="width:100%; height:100%; position:relative; font-family:sans-serif;">';

    // Draw edges
    html += '<svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; overflow:visible;">';
    html += '<defs>';
    html += '<marker id="arrow3" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-sorted)"/></marker>';
    html += '<marker id="arrow3b" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker>';
    html += '<marker id="arrow3c" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-swap)"/></marker>';
    html += '<marker id="arrow3d" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-compare)"/></marker>';
    html += '</defs>';

    for (var i = 0; i < s.edges.length; i++) {
      var edge = s.edges[i];
      var u = pos[edge.u];
      var v = pos[edge.v];
      var stroke = 'var(--algo-border)';
      var d = 'M ' + u.x + '% ' + (u.y * 2.5 - 20 + 20) + ' L ' + v.x + '% ' + (v.y * 2.5 - 20 + 20); // standard path
      var dash = '';
      var marker = 'url(#arrow3)';

      if (edge.type === 'tree') { stroke = 'var(--algo-sorted)'; }
      if (edge.type === 'back') { stroke = 'var(--brand-500)'; dash = 'stroke-dasharray="4,4"'; marker = 'url(#arrow3b)'; d = 'M ' + u.x + '% ' + (u.y * 2.5) + ' Q 10% 125 ' + v.x + '% ' + (v.y * 2.5 - 20 + 20); } // curve
      if (edge.type === 'forward') { stroke = 'var(--algo-swap)'; dash = 'stroke-dasharray="6,2"'; marker = 'url(#arrow3c)'; d = 'M ' + u.x + '% ' + (u.y * 2.5 - 20 + 20) + ' Q 60% 125 ' + v.x + '% ' + (v.y * 2.5 - 20 + 20); } // curve
      if (edge.type === 'cross') { stroke = 'var(--algo-compare)'; dash = 'stroke-dasharray="2,2"'; marker = 'url(#arrow3d)'; }

      html += '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="2" ' + dash + ' marker-end="' + marker + '"/>';
    }
    html += '</svg>';

    // Draw nodes
    var allNodes = ['a', 'b', 'c', 'd', 'e'];
    for (var i = 0; i < allNodes.length; i++) {
      var n = allNodes[i];
      if (s.nodes.indexOf(n) !== -1) {
        var bg = (n === s.nodes[s.nodes.length - 1]) ? 'var(--brand-500)' : 'var(--algo-bg)';
        var color = (n === s.nodes[s.nodes.length - 1]) ? 'var(--algo-text)' : 'var(--algo-text)';
        var borderC = 'var(--algo-border)';
        html += '<div style="position:absolute; top:' + (pos[n].y * 2.5 - 20) + 'px; left:' + pos[n].x + '%; transform:translateX(-50%); width:30px; height:30px; border-radius:50%; background:' + bg + '; color:' + color + '; border:2px solid ' + borderC + '; display:flex; align-items:center; justify-content:center; font-weight:bold; z-index:2; transition:all 0.3s;">' + n + '</div>';
      }
    }

    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[3] = render;
  generateSteps();
  render();
};

// WIDGET 4: The Selection Problem and Quick Select
window._algoTitles[4] = { en: 'Quick Select', ar: 'خوارزمية الإختيار السريع' };
window.AlgoWidgets[4] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(4) + _AL.toolbar(4) +
    '<div class="algo-explanation" id="w4-exp"></div>' +
    '<div class="algo-canvas" id="w4-canvas" style="height:200px; position:relative;"></div>' +
    '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-pivot"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-search"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-found"></span></span>' +
    '</div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w4-exp');
  var cvsEl = container.querySelector('#w4-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('[data-algo-text="w4-pivot"]').textContent = ar ? 'المحور (Pivot)' : 'Pivot';
    container.querySelector('[data-algo-text="w4-search"]').textContent = ar ? 'نطاق البحث' : 'Search Range';
    container.querySelector('[data-algo-text="w4-found"]').textContent = ar ? 'النتيجة (K-th)' : 'Result (K-th)';
  }

  function lomutoPartition(arr, l, r) {
    var p = arr[l];
    var s = l;
    for (var i = l + 1; i <= r; i++) {
      if (arr[i] < p) {
        s++;
        var temp = arr[s];
        arr[s] = arr[i];
        arr[i] = temp;
      }
    }
    var temp2 = arr[l];
    arr[l] = arr[s];
    arr[s] = temp2;
    return s;
  }

  function generateSteps() {
    var arr = [4, 1, 10, 8, 7, 12, 9, 2, 15];
    var k = 5; // We want the 5th smallest element (index 4 in 0-based, which should be 7 in sorted array)
    var targetIdx = k - 1; // 4

    steps = [];
    steps.push({ a: arr.slice(), l: 0, r: arr.length - 1, p: -1, s: -1, k: k, found: false, en: 'Find the ' + k + 'th smallest element (k=' + k + '). Initial array.', ar: 'إيجاد العنصر رقم ' + k + ' الأصغر (k=' + k + '). المصفوفة الأولية.' });

    var l = 0;
    var r = arr.length - 1;

    while (l <= r) {
      steps.push({ a: arr.slice(), l: l, r: r, p: arr[l], s: -1, k: k, found: false, en: 'Select first element as pivot p = ' + arr[l] + '. Partition the array from index ' + l + ' to ' + r + '.', ar: 'اختيار العنصر الأول كمحور p = ' + arr[l] + '. تقسيم المصفوفة من الفهرس ' + l + ' إلى ' + r + '.' });

      var originalPivotValue = arr[l];
      var s = lomutoPartition(arr, l, r);

      steps.push({ a: arr.slice(), l: l, r: r, p: originalPivotValue, s: s, k: k, found: false, en: 'After partitioning, pivot ' + originalPivotValue + ' is at its final position s = ' + s + '.', ar: 'بعد التقسيم، المحور ' + originalPivotValue + ' موجود في موقعه النهائي s = ' + s + '.' });

      if (s === targetIdx) {
        steps.push({ a: arr.slice(), l: l, r: r, p: originalPivotValue, s: s, k: k, found: true, en: 's (' + s + ') == k-1 (' + targetIdx + '). Found the ' + k + 'th smallest element: ' + arr[s] + '!', ar: 's (' + s + ') == k-1 (' + targetIdx + '). تم إيجاد العنصر رقم ' + k + ' الأصغر: ' + arr[s] + '!' });
        return;
      } else if (s > targetIdx) {
        steps.push({ a: arr.slice(), l: l, r: r, p: originalPivotValue, s: s, k: k, found: false, en: 's (' + s + ') > ' + targetIdx + '. Search in the left sub-array.', ar: 's (' + s + ') > ' + targetIdx + '. ابحث في المصفوفة الفرعية اليسرى.' });
        r = s - 1;
      } else {
        steps.push({ a: arr.slice(), l: l, r: r, p: originalPivotValue, s: s, k: k, found: false, en: 's (' + s + ') < ' + targetIdx + '. Search in the right sub-array.', ar: 's (' + s + ') < ' + targetIdx + '. ابحث في المصفوفة الفرعية اليمنى.' });
        l = s + 1;
      }
    }
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var html = '<div style="display:flex; justify-content:center; align-items:flex-end; gap:5px; height:100%; padding-bottom:30px; position:relative;">';
    var mx = 15; // Max value in our hardcoded array

    s.a.forEach(function (val, idx) {
      var bg = 'var(--algo-bg)';
      var border = '1px solid var(--algo-border)';
      var opacity = '1';

      if (idx >= s.l && idx <= s.r) {
        bg = 'var(--algo-compare)';
      } else {
        opacity = '0.3';
        border = '1px dashed var(--algo-muted)';
      }

      if (idx === s.s) {
        bg = s.found ? 'var(--algo-sorted)' : 'var(--brand-500)';
        opacity = '1';
      } else if (s.s === -1 && val === s.p && idx === s.l) {
        bg = 'var(--algo-swap)'; // Pivot before partition
        opacity = '1';
      }

      html += '<div style="width:35px; height:' + ((val / mx) * 80) + '%; background:' + bg + '; border:' + border + '; opacity:' + opacity + '; position:relative; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; transition:all 0.3s;">';
      html += '<span style="font-size:0.8em; font-weight:bold;">' + val + '</span>';

      var ptrs = [];
      if (idx === s.l) ptrs.push('L');
      if (idx === s.r && s.l !== s.r) ptrs.push('R');
      if (idx === s.s) ptrs.push('s');

      if (ptrs.length > 0) {
        html += '<div style="position:absolute; bottom:-25px; font-weight:bold; color:var(--algo-text); font-size:0.9em;">' + ptrs.join(',') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[4] = render;
  generateSteps();
  render();
};

// WIDGET 5: Insertion Sort
window._algoTitles[5] = { en: 'Insertion Sort', ar: 'الترتيب بالإدراج' };
window.AlgoWidgets[5] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(5) + _AL.toolbar(5) +
    '<div class="algo-explanation" id="w5-exp"></div>' +
    '<div class="algo-canvas" id="w5-canvas" style="height:250px;"></div>' +
    '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-sorted"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-current"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-shift"></span></span>' +
    '</div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w5-exp');
  var cvsEl = container.querySelector('#w5-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('[data-algo-text="w5-sorted"]').textContent = ar ? 'مرتب' : 'Sorted';
    container.querySelector('[data-algo-text="w5-current"]').textContent = ar ? 'العنصر الحالي' : 'Current Item';
    container.querySelector('[data-algo-text="w5-shift"]').textContent = ar ? 'إزاحة / مقارنة' : 'Shift / Compare';
  }

  function generateSteps() {
    var arr = []; for (var i = 0; i < 8; i++) arr.push(Math.floor(Math.random() * 80) + 20);
    steps = [];
    steps.push({ a: arr.slice(), i: 0, j: -1, v: null, hl: [], sorted: [0], en: 'Initial array. First element is considered sorted.', ar: 'المصفوفة الأولية. العنصر الأول يعتبر مرتباً.' });
    var n = arr.length;
    for (var i = 1; i < n; i++) {
      var v = arr[i];
      var j = i - 1;
      var sorted = []; for (var k = 0; k <= i; k++) sorted.push(k);
      steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [i], sorted: sorted.slice(), en: 'Select A[' + i + '] = ' + v + ' to insert into the sorted portion.', ar: 'تحديد A[' + i + '] = ' + v + ' لإدراجه في الجزء المرتب.' });
      while (j >= 0 && arr[j] > v) {
        steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [j], sorted: sorted.slice(), en: 'Compare ' + v + ' with ' + arr[j] + '. ' + arr[j] + ' is larger, shift it right.', ar: 'مقارنة ' + v + ' مع ' + arr[j] + '. ' + arr[j] + ' أكبر، إزاحته لليمين.' });
        arr[j + 1] = arr[j];
        steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [j + 1], sorted: sorted.slice(), en: 'Shifted ' + arr[j] + ' to index ' + (j + 1) + '.', ar: 'تمت إزاحة ' + arr[j] + ' إلى الفهرس ' + (j + 1) + '.' });
        j--;
      }
      if (j >= 0) {
        steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [j], sorted: sorted.slice(), en: 'Compare ' + v + ' with ' + arr[j] + '. ' + v + ' is larger or equal, stop shifting.', ar: 'مقارنة ' + v + ' مع ' + arr[j] + '. ' + v + ' أكبر أو يساوي، توقف الإزاحة.' });
      } else {
        steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [], sorted: sorted.slice(), en: 'Reached the start of the array.', ar: 'وصلنا إلى بداية المصفوفة.' });
      }
      arr[j + 1] = v;
      steps.push({ a: arr.slice(), i: i, j: j, v: v, hl: [j + 1], sorted: sorted.slice(), en: 'Inserted ' + v + ' at index ' + (j + 1) + '.', ar: 'تم إدراج ' + v + ' في الفهرس ' + (j + 1) + '.' });
    }
    var allSorted = []; for (var k = 0; k < n; k++) allSorted.push(k);
    steps.push({ a: arr.slice(), i: -1, j: -1, v: null, hl: [], sorted: allSorted, en: 'Array is fully sorted!', ar: 'المصفوفة مرتبة بالكامل!' });
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var html = '<div style="display:flex; justify-content:center; align-items:flex-end; gap:5px; height:100%; padding-bottom:10px;">';
    var mx = Math.max.apply(null, s.a);
    s.a.forEach(function (val, idx) {
      var bg = 'var(--algo-bg)';
      var border = '1px solid var(--algo-border)';
      if (s.sorted.indexOf(idx) !== -1) bg = 'var(--algo-sorted)';
      if (s.hl.indexOf(idx) !== -1) bg = 'var(--algo-swap)';
      if (idx === s.i && s.i !== -1) { bg = 'var(--brand-500)'; border = '2px solid var(--algo-text)'; }

      html += '<div style="width:40px; height:' + ((val / mx) * 90) + '%; background:' + bg + '; border:' + border + '; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; transition:all 0.2s;">';
      html += '<span style="font-size:0.9em; font-weight:bold; color:var(--algo-text);">' + val + '</span>';
      html += '</div>';
    });
    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[5] = render;
  generateSteps();
  render();
};

// WIDGET 6: Binary Search
window._algoTitles[6] = { en: 'Binary Search', ar: 'البحث الثنائي' };
window.AlgoWidgets[6] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(6) + _AL.toolbar(6) +
    '<div class="algo-explanation" id="w6-exp"></div>' +
    '<div class="algo-canvas" id="w6-canvas" style="height:200px;"></div>' +
    '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w6-range"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w6-mid"></span></span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w6-found"></span></span>' +
    '</div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w6-exp');
  var cvsEl = container.querySelector('#w6-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('[data-algo-text="w6-range"]').textContent = ar ? 'نطاق البحث' : 'Search Range';
    container.querySelector('[data-algo-text="w6-mid"]').textContent = ar ? 'المنتصف (m)' : 'Mid (m)';
    container.querySelector('[data-algo-text="w6-found"]').textContent = ar ? 'تم العثور' : 'Found';
  }

  function generateSteps() {
    var arr = [];
    var val = 10;
    for (var i = 0; i < 12; i++) {
      val += Math.floor(Math.random() * 10) + 2;
      arr.push(val);
    }
    var targetIdx = Math.floor(Math.random() * 12);
    var K = arr[targetIdx];
    if (Math.random() > 0.8) K += 1; // 20% chance to search for a missing element

    steps = [];
    steps.push({ a: arr.slice(), l: 0, r: 11, m: -1, k: K, found: false, en: 'Searching for K = ' + K + ' in a sorted array.', ar: 'البحث عن K = ' + K + ' في مصفوفة مرتبة.' });

    var l = 0, r = 11;
    while (l <= r) {
      var m = Math.floor((l + r) / 2);
      steps.push({ a: arr.slice(), l: l, r: r, m: m, k: K, found: false, en: 'Calculate mid m = ' + m + '. Compare A[' + m + '] (' + arr[m] + ') with ' + K + '.', ar: 'حساب المنتصف m = ' + m + '. مقارنة A[' + m + '] (' + arr[m] + ') مع ' + K + '.' });
      if (K === arr[m]) {
        steps.push({ a: arr.slice(), l: l, r: r, m: m, k: K, found: true, en: 'Match found at index ' + m + '!', ar: 'تم العثور على تطابق في الفهرس ' + m + '!' });
        return;
      } else if (K < arr[m]) {
        steps.push({ a: arr.slice(), l: l, r: r, m: m, k: K, found: false, en: K + ' < ' + arr[m] + ', so search left half (r = ' + (m - 1) + ').', ar: K + ' < ' + arr[m] + '، لذا ابحث في النصف الأيسر (r = ' + (m - 1) + ').' });
        r = m - 1;
      } else {
        steps.push({ a: arr.slice(), l: l, r: r, m: m, k: K, found: false, en: K + ' > ' + arr[m] + ', so search right half (l = ' + (m + 1) + ').', ar: K + ' > ' + arr[m] + '، لذا ابحث في النصف الأيمن (l = ' + (m + 1) + ').' });
        l = m + 1;
      }
    }
    steps.push({ a: arr.slice(), l: l, r: r, m: -1, k: K, found: false, en: 'l > r. Target not found in the array.', ar: 'l > r. لم يتم العثور على الهدف في المصفوفة.' });
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var html = '<div style="display:flex; justify-content:center; align-items:flex-end; gap:5px; height:100%; padding-bottom:30px; position:relative;">';
    var mx = Math.max.apply(null, s.a);
    s.a.forEach(function (val, idx) {
      var bg = 'var(--algo-bg)';
      var border = '1px solid var(--algo-border)';
      var opacity = '1';

      if (idx >= s.l && idx <= s.r) {
        bg = 'var(--algo-compare)';
      } else {
        opacity = '0.3';
        border = '1px dashed var(--algo-muted)';
      }

      if (idx === s.m) {
        bg = s.found ? 'var(--algo-sorted)' : 'var(--brand-500)';
        opacity = '1';
      }

      html += '<div style="width:35px; height:' + ((val / mx) * 80) + '%; background:' + bg + '; border:' + border + '; opacity:' + opacity + '; position:relative; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; transition:all 0.3s;">';
      html += '<span style="font-size:0.8em; font-weight:bold;">' + val + '</span>';

      var ptrs = [];
      if (idx === s.l) ptrs.push('L');
      if (idx === s.m) ptrs.push('M');
      if (idx === s.r) ptrs.push('R');
      if (ptrs.length > 0) {
        html += '<div style="position:absolute; bottom:-25px; font-weight:bold; color:var(--algo-text); font-size:0.9em;">' + ptrs.join(',') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[6] = render;
  generateSteps();
  render();
};

// WIDGET 7: Euclid's Algorithm
window._algoTitles[7] = { en: "Euclid's Algorithm", ar: 'خوارزمية إقليدس' };
window.AlgoWidgets[7] = function (container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(7) + _AL.toolbar(7) +
    '<div class="algo-explanation" id="w7-exp"></div>' +
    '<div class="algo-canvas" id="w7-canvas" style="height:150px;"></div>' +
    '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl = container.querySelector('#w7-exp');
  var cvsEl = container.querySelector('#w7-canvas');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  function updateLabels() { }

  function generateSteps() {
    var m = 50 + Math.floor(Math.random() * 100);
    var n = 10 + Math.floor(Math.random() * 40);
    steps = [];
    steps.push({ m: m, n: n, r: null, en: 'Find GCD of ' + m + ' and ' + n + '.', ar: 'إيجاد القاسم المشترك الأكبر لـ ' + m + ' و ' + n + '.' });

    while (n !== 0) {
      var r = m % n;
      steps.push({ m: m, n: n, r: r, en: 'Calculate remainder: ' + m + ' mod ' + n + ' = ' + r + '.', ar: 'حساب باقي القسمة: ' + m + ' mod ' + n + ' = ' + r + '.' });
      m = n;
      n = r;
      steps.push({ m: m, n: n, r: null, en: 'Update values: m becomes ' + m + ', n becomes ' + n + '.', ar: 'تحديث القيم: m تصبح ' + m + '، و n تصبح ' + n + '.' });
    }
    steps.push({ m: m, n: n, r: null, en: 'n is 0. The GCD is ' + m + '.', ar: 'n أصبحت 0. القاسم المشترك الأكبر هو ' + m + '.' });
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    var html = '<div style="display:flex; justify-content:center; align-items:center; gap:30px; height:100%; font-size:1.5em; font-family:monospace;">';
    html += '<div style="text-align:center; transition:all 0.3s;"><div style="font-size:0.6em; color:var(--algo-muted); margin-bottom:5px;">m</div><div style="padding:15px 25px; background:var(--algo-compare); border-radius:8px; border:2px solid var(--brand-500); color:var(--algo-text);">' + s.m + '</div></div>';
    html += '<div style="text-align:center; transition:all 0.3s;"><div style="font-size:0.6em; color:var(--algo-muted); margin-bottom:5px;">n</div><div style="padding:15px 25px; background:var(--algo-swap); border-radius:8px; border:2px solid var(--brand-500); color:var(--algo-text);">' + s.n + '</div></div>';
    if (s.r !== null) {
      html += '<div style="text-align:center; transition:all 0.3s;"><div style="font-size:0.6em; color:var(--algo-muted); margin-bottom:5px;">r (m mod n)</div><div style="padding:15px 25px; background:var(--algo-sorted); border-radius:8px; border:2px solid var(--brand-500); color:var(--algo-text);">' + s.r + '</div></div>';
    }
    html += '</div>';
    cvsEl.innerHTML = html;
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if (cur >= steps.length - 1) cur = 0;
    interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () { stopPlay(); if (cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function () { stopPlay(); startPlay(); });

  window._algoRerenders[7] = render;
  generateSteps();
  render();
};

(function () {
  function init() {
    Object.keys(window.AlgoWidgets).forEach(function (id) {
      var el = document.getElementById('algo-widget-' + id);
      if (el && !el.dataset.algoLoaded) {
        try { window.AlgoWidgets[id](el); el.dataset.algoLoaded = 'true'; }
        catch (e) { console.error('AlgoWidget #' + id + ' error:', e); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();