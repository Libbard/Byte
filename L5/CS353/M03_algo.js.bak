// M03_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T00:24:20
// Diagrams: 9/9

window.AlgoWidgets = window.AlgoWidgets || {};

var _AL = {
  lang: function() { return document.documentElement.lang || 'ar'; },
  i18n: {
    prev:  { ar: 'السابق',    en: 'Prev'      },
    step:  { ar: 'التالي',    en: 'Next'      },
    play:  { ar: '▶ تشغيل',  en: '▶ Play'    },
    pause: { ar: '❚❚ إيقاف', en: '❚❚ Pause'  },
    reset: { ar: '↺ إعادة',  en: '↺ Reset'   },
    stepN: { ar: 'الخطوة',   en: 'Step'      },
    fast:  { ar: 'سريع',     en: 'Fast'      },
    slow:  { ar: 'بطيء',     en: 'Slow'      }
  },
  t: function(k) { return this.i18n[k] ? (this.i18n[k][this.lang()] || this.i18n[k].en) : k; },
  stepLabel: function(c, t) { return this.t('stepN') + ': ' + c + ' / ' + t; },
  exp: function(en, ar) { return this.lang() === 'ar' ? ar : en; },
  speedToDelay: function(v) { return 2100 - (v * 20); },
  toolbar: function(id) {
    return '<div class="algo-toolbar" data-algo-toolbar="' + id + '">' +
      '<button data-algo-btn="prev">'  + this.t('prev')  + '</button>' +
      '<button data-algo-btn="play">'  + this.t('play')  + '</button>' +
      '<button data-algo-btn="step">'  + this.t('step')  + '</button>' +
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
  titleHTML: function(id) {
    var t = window._algoTitles && window._algoTitles[id];
    if (!t) return '';
    var text = this.lang() === 'ar' ? t.ar : t.en;
    return '<h4 class="algo-title" data-algo-title="' + id + '">' + text + '</h4>';
  },
  refreshToolbars: function() {
    var self = this;
    document.querySelectorAll('[data-algo-toolbar]').forEach(function(tb) {
      tb.querySelector('[data-algo-btn="prev"]').textContent  = self.t('prev');
      tb.querySelector('[data-algo-btn="step"]').textContent  = self.t('step');
      var pb = tb.querySelector('[data-algo-btn="play"]');
      pb.textContent = pb.dataset.playing === '1' ? self.t('pause') : self.t('play');
      tb.querySelector('[data-algo-btn="reset"]').textContent = self.t('reset');
    });
    document.querySelectorAll('[data-algo-speed-slow]').forEach(function(s){ s.textContent = self.t('slow'); });
    document.querySelectorAll('[data-algo-speed-fast]').forEach(function(s){ s.textContent = self.t('fast'); });
  }
};

window._algoRerenders = window._algoRerenders || {};
window._algoRefresh = function() {
  _AL.refreshToolbars();
  document.querySelectorAll('[data-algo-title]').forEach(function(el) {
    var id = el.dataset.algoTitle;
    var t = window._algoTitles && window._algoTitles[id];
    if (t) el.textContent = _AL.lang() === 'ar' ? t.ar : t.en;
  });
  Object.values(window._algoRerenders).forEach(function(fn){ try{ fn(); }catch(e){} });
};

function _algoBindSpeed(container, getDelay, restartFn) {
  var input = container.querySelector('.algo-speed input');
  input.addEventListener('input', function() {
    var playBtn = container.querySelector('[data-algo-btn="play"]');
    if (playBtn && playBtn.dataset.playing === '1') restartFn();
  });
}

window._algoTitles = window._algoTitles || {};
window._algoTitles[1] = { en: 'Selection Sort', ar: 'ترتيب الاختيار' };
window._algoTitles[2] = { en: 'Bubble Sort', ar: 'الترتيب بالفقاعات' };
window._algoTitles[3] = { en: 'Brute-Force String Matching', ar: 'مطابقة السلاسل النصية بالقوة الغاشمة' };
window._algoTitles[4] = { en: 'Closest-Pair Problem', ar: 'مشكلة أقرب زوج' };
window._algoTitles[5] = { en: 'Traveling Salesman Problem (TSP)', ar: 'مشكلة البائع المتجول' };
window._algoTitles[6] = { en: 'Knapsack Problem — Brute Force', ar: 'مشكلة حقيبة الظهر - القوة الغاشمة' };
window._algoTitles[7] = { en: 'Assignment Problem', ar: 'مشكلة التعيين - القوة الغاشمة' };
window._algoTitles[8] = { en: 'Depth-First Search (DFS)', ar: 'البحث العميق أولاً (DFS)' };
window._algoTitles[9] = { en: 'Breadth-First Search (BFS)', ar: 'البحث في العرض أولاً (BFS)' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp"></div>' +
      '<div class="algo-canvas" id="w1-svg-container" style="min-height:250px; display:flex; justify-content:center; align-items:center;"></div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-sorted"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-unsorted"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-comparing"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-min"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-swapping"></span></span>' +
      '</div>' +
      '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w1-exp');
    var svgContainerEl = container.querySelector('#w1-svg-container');
    var counter = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    var ARRAY_SIZE = 8;
    var BAR_WIDTH = 50;
    var BAR_GAP = 10;
    var SVG_WIDTH = ARRAY_SIZE * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
    var SVG_HEIGHT = 200;
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-sorted"]').textContent = _AL.lang() === 'ar' ? 'مرتب' : 'Sorted';
      container.querySelector('[data-algo-text="w1-unsorted"]').textContent = _AL.lang() === 'ar' ? 'غير مرتب' : 'Unsorted';
      container.querySelector('[data-algo-text="w1-comparing"]').textContent = _AL.lang() === 'ar' ? 'مقارنة' : 'Comparing';
      container.querySelector('[data-algo-text="w1-min"]').textContent = _AL.lang() === 'ar' ? 'الحد الأدنى' : 'Current Min';
      container.querySelector('[data-algo-text="w1-swapping"]').textContent = _AL.lang() === 'ar' ? 'تبديل' : 'Swapping';
    }
  
    function generateSteps() {
      var arr = [];
      for (var i = 0; i < ARRAY_SIZE; i++) arr.push(Math.floor(Math.random() * 80) + 20); // Values 20-99
      steps = [];
  
      // Initial state
      steps.push({
        a: arr.slice(),
        i: -1, j: -1, minIdx: -1,
        sortedCount: 0,
        swapping: false,
        en: 'Initial array state. The goal is to sort elements in ascending order.',
        ar: 'الحالة الأولية للمصفوفة. الهدف هو ترتيب العناصر تصاعدياً.'
      });
  
      var n = arr.length;
      for (var i = 0; i < n - 1; i++) {
        var minIdx = i;
        steps.push({
          a: arr.slice(),
          i: i, j: i, minIdx: i,
          sortedCount: i,
          swapping: false,
          en: 'Starting pass ' + (i + 1) + '. Assume element ' + arr[i] + ' at index ' + i + ' is the minimum in the unsorted part.',
          ar: 'بدء الجولة ' + (i + 1) + '. نفترض أن العنصر ' + arr[i] + ' في الفهرس ' + i + ' هو الحد الأدنى في الجزء غير المرتب.'
        });
  
        for (var j = i + 1; j < n; j++) {
          steps.push({
            a: arr.slice(),
            i: i, j: j, minIdx: minIdx,
            sortedCount: i,
            swapping: false,
            en: 'Compare ' + arr[j] + ' (index ' + j + ') with current minimum ' + arr[minIdx] + ' (index ' + minIdx + ').',
            ar: 'مقارنة ' + arr[j] + ' (الفهرس ' + j + ') مع الحد الأدنى الحالي ' + arr[minIdx] + ' (الفهرس ' + minIdx + ').'
          });
          if (arr[j] < arr[minIdx]) {
            minIdx = j;
            steps.push({
              a: arr.slice(),
              i: i, j: j, minIdx: minIdx,
              sortedCount: i,
              swapping: false,
              en: 'New minimum found: ' + arr[minIdx] + ' at index ' + minIdx + '.',
              ar: 'تم العثور على حد أدنى جديد: ' + arr[minIdx] + ' في الفهرس ' + minIdx + '.'
            });
          }
        }
  
        if (minIdx !== i) {
          steps.push({
            a: arr.slice(),
            i: i, j: -1, minIdx: minIdx,
            sortedCount: i,
            swapping: true,
            en: 'Minimum element ' + arr[minIdx] + ' (index ' + minIdx + ') is not at its correct position. Swapping with ' + arr[i] + ' (index ' + i + ').',
            ar: 'العنصر الأدنى ' + arr[minIdx] + ' (الفهرس ' + minIdx + ') ليس في موضعه الصحيح. يتم تبديله مع ' + arr[i] + ' (الفهرس ' + i + ').'
          });
          var temp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = temp;
          steps.push({
            a: arr.slice(),
            i: i, j: -1, minIdx: i, // minIdx is now i after swap
            sortedCount: i + 1,
            swapping: false,
            en: 'Elements swapped. Element ' + arr[i] + ' is now in its sorted position.',
            ar: 'تم تبديل العناصر. العنصر ' + arr[i] + ' أصبح الآن في موضعه المرتب.'
          });
        } else {
          steps.push({
            a: arr.slice(),
            i: i, j: -1, minIdx: i,
            sortedCount: i + 1,
            swapping: false,
            en: 'Element ' + arr[i] + ' is already the minimum. It is in its sorted position.',
            ar: 'العنصر ' + arr[i] + ' هو بالفعل الحد الأدنى. إنه في موضعه المرتب.'
          });
        }
      }
  
      // Final state
      steps.push({
        a: arr.slice(),
        i: -1, j: -1, minIdx: -1,
        sortedCount: n,
        swapping: false,
        en: 'Array is fully sorted!',
        ar: 'تم ترتيب المصفوفة بالكامل!'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      svgContainerEl.innerHTML = ''; // Clear previous SVG
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', SVG_WIDTH);
      svg.setAttribute('height', SVG_HEIGHT);
      svg.setAttribute('viewBox', '0 0 ' + SVG_WIDTH + ' ' + SVG_HEIGHT);
      svg.style.overflow = 'visible'; // Allow arrow to extend
  
      var maxVal = Math.max.apply(null, s.a);
      var barMaxHeight = 150; // Max height for bars
  
      // Draw bars
      s.a.forEach(function (val, idx) {
        var barHeight = (val / maxVal) * barMaxHeight;
        var x = idx * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
        var y = SVG_HEIGHT - barHeight - 30; // 30 for index labels below
  
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', BAR_WIDTH);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('rx', 3); // Rounded corners
        rect.setAttribute('ry', 3);
  
        var fillColor = 'var(--brand-500)'; // Default unsorted
        if (idx < s.sortedCount) {
          fillColor = 'var(--algo-sorted)';
        } else if (s.swapping && (idx === s.i || idx === s.minIdx)) {
          fillColor = 'var(--algo-swap)';
        } else if (idx === s.j) {
          fillColor = 'var(--algo-compare)';
        } else if (idx === s.minIdx) {
          fillColor = 'var(--algo-active)';
        }
        rect.setAttribute('fill', fillColor);
        svg.appendChild(rect);
  
        // Value label
        var textVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textVal.setAttribute('x', x + BAR_WIDTH / 2);
        textVal.setAttribute('y', y + barHeight / 2 + 5); // Center text vertically
        textVal.setAttribute('text-anchor', 'middle');
        textVal.setAttribute('fill', 'var(--algo-text)');
        textVal.setAttribute('font-size', '14px');
        textVal.textContent = val;
        svg.appendChild(textVal);
  
        // Index label
        var textIdx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textIdx.setAttribute('x', x + BAR_WIDTH / 2);
        textIdx.setAttribute('y', SVG_HEIGHT - 10); // Below the bars
        textIdx.setAttribute('text-anchor', 'middle');
        textIdx.setAttribute('fill', 'var(--algo-muted)');
        textIdx.setAttribute('font-size', '12px');
        textIdx.textContent = idx;
        svg.appendChild(textIdx);
      });
  
      // Draw arrow for current minIdx
      if (s.minIdx !== -1 && s.minIdx >= s.sortedCount) { // Only show arrow for unsorted part
        var arrowX = s.minIdx * (BAR_WIDTH + BAR_GAP) + BAR_GAP + BAR_WIDTH / 2;
        var arrowY1 = SVG_HEIGHT - 25; // Start above index label
        var arrowY2 = SVG_HEIGHT - 5;  // End at bottom of SVG
  
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', arrowX);
        line.setAttribute('y1', arrowY1);
        line.setAttribute('x2', arrowX);
        line.setAttribute('y2', arrowY2);
        line.setAttribute('stroke', 'var(--algo-active)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
  
        var triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        var triangleSize = 8;
        triangle.setAttribute('points',
          (arrowX - triangleSize) + ',' + (arrowY1 - triangleSize) + ' ' +
          (arrowX + triangleSize) + ',' + (arrowY1 - triangleSize) + ' ' +
          arrowX + ',' + arrowY1
        );
        triangle.setAttribute('fill', 'var(--algo-active)');
        svg.appendChild(triangle);
      }
  
      svgContainerEl.appendChild(svg);
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
    container.querySelector('.algo-speed input').addEventListener('input', function () {
      if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
    });
  
    window._algoRerenders[1] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[2] = function(container) {
  // Constants for SVG drawing
    const BAR_WIDTH = 50;
    const BAR_SPACING = 10;
    const SVG_HEIGHT = 250; // Height for bars + arrows
    const BAR_MAX_HEIGHT = 180; // Max height for a bar, leaving space for labels and arrows
    const ARROW_CURVE_HEIGHT = 30; // Height of the curve for swap arrows
    const ARROW_OFFSET_Y = 10; // Y offset from bar top for arrow start/end
  
    container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp"></div>' +
      '<div class="algo-canvas" style="display:flex; justify-content:center; align-items:center; min-height:' + SVG_HEIGHT + 'px; padding: 10px 0;">' +
      '<svg id="w2-svg" width="0" height="' + SVG_HEIGHT + '" viewBox="0 0 0 ' + SVG_HEIGHT + '" style="overflow:visible;"></svg>' +
      '</div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-un"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-co"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-sw"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-so"></span></span>' +
      '</div>' +
      '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w2-exp');
    var svgEl = container.querySelector('#w2-svg');
    var counter = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w2-un"]').textContent = _AL.lang() === 'ar' ? 'غير مرتب' : 'Unsorted';
      container.querySelector('[data-algo-text="w2-co"]').textContent = _AL.lang() === 'ar' ? 'مقارنة' : 'Comparing';
      container.querySelector('[data-algo-text="w2-sw"]').textContent = _AL.lang() === 'ar' ? 'تبديل' : 'Swapping';
      container.querySelector('[data-algo-text="w2-so"]').textContent = _AL.lang() === 'ar' ? 'مرتب' : 'Sorted';
    }
  
    function generateSteps() {
      var arr = []; for (var i = 0; i < 8; i++) arr.push(Math.floor(Math.random() * 80) + 20);
      steps = []; var sortedIndices = []; // Stores indices of elements that are in their final sorted position
  
      steps.push({
        a: arr.slice(),
        c: [], // comparing indices
        sw: false, // was a swap performed
        s: sortedIndices.slice(), // sorted indices
        en: 'Starting Bubble Sort with array: [' + arr.join(', ') + ']',
        ar: 'بدء الترتيب بالفقاعات للمصفوفة: [' + arr.join(', ') + ']'
      });
  
      var n = arr.length;
      for (var pass = 0; pass < n - 1; pass++) {
        for (var j = 0; j < n - 1 - pass; j++) {
          steps.push({
            a: arr.slice(),
            c: [j, j + 1],
            sw: false,
            s: sortedIndices.slice(),
            en: 'Compare elements at index ' + j + ' (' + arr[j] + ') and ' + (j + 1) + ' (' + arr[j + 1] + ')',
            ar: 'مقارنة العنصرين عند الفهرس ' + j + ' (' + arr[j] + ') و ' + (j + 1) + ' (' + arr[j + 1] + ')'
          });
          if (arr[j] > arr[j + 1]) {
            var tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
            steps.push({
              a: arr.slice(),
              c: [j, j + 1],
              sw: true,
              s: sortedIndices.slice(),
              en: 'Elements are out of order. Swap ' + arr[j + 1] + ' and ' + arr[j] + '.',
              ar: 'العناصر ليست بالترتيب الصحيح. تبديل ' + arr[j + 1] + ' و ' + arr[j] + '.'
            });
          }
        }
        sortedIndices.push(n - 1 - pass); // The largest element of this pass is now in its final position
        steps.push({
          a: arr.slice(),
          c: [],
          sw: false,
          s: sortedIndices.slice(),
          en: 'Pass ' + (pass + 1) + ' completed. Element ' + arr[n - 1 - pass] + ' is now sorted.',
          ar: 'اكتملت الجولة ' + (pass + 1) + '. العنصر ' + arr[n - 1 - pass] + ' أصبح مرتبًا.'
        });
      }
      sortedIndices.push(0); // The last element (smallest) will also be sorted after the loop
      steps.push({
        a: arr.slice(),
        c: [],
        sw: false,
        s: sortedIndices.slice(),
        en: 'Bubble Sort finished. Array is fully sorted!',
        ar: 'انتهى الترتيب بالفقاعات. المصفوفة مرتبة بالكامل!'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Clear previous SVG content
      svgEl.innerHTML = '';
  
      // Calculate dynamic SVG width based on number of bars
      const numBars = s.a.length;
      const totalWidth = numBars * BAR_WIDTH + (numBars - 1) * BAR_SPACING;
      svgEl.setAttribute('width', totalWidth);
      svgEl.setAttribute('viewBox', '0 0 ' + totalWidth + ' ' + SVG_HEIGHT);
  
      var maxValue = Math.max.apply(null, s.a);
      if (maxValue === 0) maxValue = 1; // Avoid division by zero if all values are zero
  
      s.a.forEach(function (val, idx) {
        const barHeight = (val / maxValue) * BAR_MAX_HEIGHT;
        const x = idx * (BAR_WIDTH + BAR_SPACING);
        const y = SVG_HEIGHT - barHeight - 20; // Position from bottom, leaving space for text/arrows
  
        // Bar rectangle
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', BAR_WIDTH);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('rx', 3); // Rounded corners
        rect.setAttribute('ry', 3);
  
        let fillColor = 'var(--brand-500)'; // Default unsorted color
        if (s.s.indexOf(idx) !== -1) {
          fillColor = 'var(--algo-sorted)';
        } else if (s.c.indexOf(idx) !== -1) {
          fillColor = s.sw ? 'var(--algo-swap)' : 'var(--algo-compare)';
        }
        rect.setAttribute('fill', fillColor);
        rect.setAttribute('stroke', 'var(--algo-border)');
        rect.setAttribute('stroke-width', '1');
        svgEl.appendChild(rect);
  
        // Bar label (value)
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + BAR_WIDTH / 2);
        text.setAttribute('y', y + barHeight / 2 + 5); // Center text vertically
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--algo-text)');
        text.setAttribute('font-size', '14');
        text.textContent = val;
        svgEl.appendChild(text);
      });
  
      // Draw swap arrows if a swap just occurred
      if (s.sw && s.c.length === 2) {
        const idx1 = s.c[0];
        const idx2 = s.c[1];
  
        const x1 = idx1 * (BAR_WIDTH + BAR_SPACING) + BAR_WIDTH / 2;
        const x2 = idx2 * (BAR_WIDTH + BAR_SPACING) + BAR_WIDTH / 2;
  
        // Y position for the top of the bars involved in the swap (before the swap visually)
        // For simplicity, let's assume the arrow starts/ends slightly above the bars
        const yTop = SVG_HEIGHT - BAR_MAX_HEIGHT - 20 - ARROW_OFFSET_Y;
  
        // Define arrowhead marker
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '0');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        marker.innerHTML = '<polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-swap)" />';
        defs.appendChild(marker);
        svgEl.appendChild(defs);
  
        // Arrow 1: from left bar to right bar
        var arrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow1.setAttribute('stroke', 'var(--algo-swap)');
        arrow1.setAttribute('stroke-width', '2');
        arrow1.setAttribute('fill', 'none');
        arrow1.setAttribute('marker-end', 'url(#arrowhead)');
        arrow1.setAttribute('d',
          'M' + x1 + ',' + (yTop + ARROW_OFFSET_Y) + // Start at top of left bar
          ' C' + x1 + ',' + (yTop - ARROW_CURVE_HEIGHT) + // Control point 1 (above left bar)
          ' ' + x2 + ',' + (yTop - ARROW_CURVE_HEIGHT) + // Control point 2 (above right bar)
          ' ' + x2 + ',' + (yTop + ARROW_OFFSET_Y)    // End at top of right bar
        );
        svgEl.appendChild(arrow1);
  
        // Arrow 2: from right bar to left bar
        var arrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow2.setAttribute('stroke', 'var(--algo-swap)');
        arrow2.setAttribute('stroke-width', '2');
        arrow2.setAttribute('fill', 'none');
        arrow2.setAttribute('marker-end', 'url(#arrowhead)');
        arrow2.setAttribute('d',
          'M' + x2 + ',' + (yTop + ARROW_OFFSET_Y + 10) + // Start slightly below arrow1
          ' C' + x2 + ',' + (yTop - ARROW_CURVE_HEIGHT + 10) +
          ' ' + x1 + ',' + (yTop - ARROW_CURVE_HEIGHT + 10) +
          ' ' + x1 + ',' + (yTop + ARROW_OFFSET_Y + 10)
        );
        svgEl.appendChild(arrow2);
      }
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
    container.querySelector('.algo-speed input').addEventListener('input', function () {
      if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
    });
  
    window._algoRerenders[2] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[3] = function(container) {
  var ID = 3;
    var CHAR_WIDTH = 30;
    var CHAR_MARGIN = 2; // Margin-right for each char box
    var TEXT_ROW_TOP = 50; // Y position for text row relative to canvas top
    var PATTERN_ROW_TOP = TEXT_ROW_TOP + CHAR_WIDTH + 20; // Y position for pattern row
  
    container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(ID) +
      _AL.toolbar(ID) +
      '<div class="algo-explanation" id="w' + ID + '-exp"></div>' +
      '<div class="algo-canvas" id="w' + ID + '-canvas" style="position:relative; overflow:hidden; padding-top: 20px; padding-bottom: 20px; min-height: 200px;">' +
      '<div id="w' + ID + '-text-row" style="display:flex; justify-content:flex-start; position:absolute; top:' + TEXT_ROW_TOP + 'px; left: 0;"></div>' +
      '<div id="w' + ID + '-pattern-row" style="display:flex; justify-content:flex-start; position:absolute; top:' + PATTERN_ROW_TOP + 'px; left: 0;"></div>' +
      '<svg id="w' + ID + '-arrow-svg" style="position:absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">' +
      '<defs>' +
      '<marker id="arrowhead' + ID + '" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">' +
      '<polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-active)" />' +
      '</marker>' +
      '</defs>' +
      '<line x1="0" y1="0" x2="0" y2="0" stroke="var(--algo-active)" stroke-width="2" marker-end="url(#arrowhead' + ID + ')"/>' +
      '</svg>' +
      '</div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-400);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w' + ID + '-default"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w' + ID + '-current"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w' + ID + '-matched"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w' + ID + '-mismatched"></span></span>' +
      '</div>' +
      '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w' + ID + '-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var textRowEl = container.querySelector('#w' + ID + '-text-row');
    var patternRowEl = container.querySelector('#w' + ID + '-pattern-row');
    var arrowSvgEl = container.querySelector('#w' + ID + '-arrow-svg');
    var arrowLineEl = arrowSvgEl.querySelector('line');
  
    var steps = [], cur = 0, playing = false, interval = null;
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w' + ID + '-default"]').textContent = _AL.lang() === 'ar' ? 'افتراضي' : 'Default';
      container.querySelector('[data-algo-text="w' + ID + '-current"]').textContent = _AL.lang() === 'ar' ? 'مقارنة حالية' : 'Current Compare';
      container.querySelector('[data-algo-text="w' + ID + '-matched"]').textContent = _AL.lang() === 'ar' ? 'متطابق' : 'Matched';
      container.querySelector('[data-algo-text="w' + ID + '-mismatched"]').textContent = _AL.lang() === 'ar' ? 'غير متطابق' : 'Mismatched';
    }
  
    function createCharBox(char) {
      var box = document.createElement('div');
      box.className = 'char-box';
      box.textContent = char;
      box.style.width = CHAR_WIDTH + 'px';
      box.style.height = CHAR_WIDTH + 'px';
      box.style.marginRight = CHAR_MARGIN + 'px';
      box.style.marginLeft = '0px';
      box.style.backgroundColor = 'var(--brand-400)'; // Default
      box.style.color = 'var(--algo-text)';
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.justifyContent = 'center';
      box.style.border = '1px solid var(--algo-border)';
      box.style.fontFamily = 'monospace';
      box.style.fontWeight = 'bold';
      box.style.boxSizing = 'border-box';
      return box;
    }
  
    function generateSteps() {
      var T = "ABAAABCDBACDAABA"; // Example text
      var P = "AABA";             // Example pattern
  
      steps = [];
      var n = T.length;
      var m = P.length;
  
      steps.push({
        text: T, pattern: P, offset: 0, matchLength: 0, compareIdx: -1, mismatchIdx: -1, fullMatch: false,
        en: 'Starting brute-force string matching. Text: "' + T + '", Pattern: "' + P + '".',
        ar: 'بدء مطابقة السلاسل النصية بالقوة الغاشمة. النص: "' + T + '", النمط: "' + P + '".'
      });
  
      for (var i = 0; i <= n - m; i++) {
        var currentMatchLength = 0;
        var currentMismatchIdx = -1;
        var isFullMatch = true;
  
        for (var j = 0; j < m; j++) {
          // Step for comparing characters
          steps.push({
            text: T, pattern: P, offset: i, matchLength: currentMatchLength, compareIdx: j, mismatchIdx: -1, fullMatch: false,
            en: 'Comparing T[' + (i + j) + '] (' + T[i + j] + ') with P[' + j + '] (' + P[j] + ').',
            ar: 'مقارنة T[' + (i + j) + '] (' + T[i + j] + ') مع P[' + j + '] (' + P[j] + ').'
          });
  
          if (T[i + j] === P[j]) {
            currentMatchLength++;
          } else {
            currentMismatchIdx = j;
            isFullMatch = false;
            break; // Mismatch, break inner loop
          }
        }
  
        if (isFullMatch) { // Full match
          steps.push({
            text: T, pattern: P, offset: i, matchLength: m, compareIdx: -1, mismatchIdx: -1, fullMatch: true,
            en: 'Full match found at index ' + i + '!',
            ar: 'تم العثور على تطابق كامل عند الفهرس ' + i + '!'
          });
        } else { // Mismatch
          steps.push({
            text: T, pattern: P, offset: i, matchLength: currentMatchLength, compareIdx: -1, mismatchIdx: currentMismatchIdx, fullMatch: false,
            en: 'Mismatch at T[' + (i + currentMismatchIdx) + '] and P[' + currentMismatchIdx + ']. Shifting pattern.',
            ar: 'عدم تطابق عند T[' + (i + currentMismatchIdx) + '] و P[' + currentMismatchIdx + ']. يتم إزاحة النمط.'
          });
        }
      }
      steps.push({
        text: T, pattern: P, offset: n - m + 1, matchLength: 0, compareIdx: -1, mismatchIdx: -1, fullMatch: false,
        en: 'End of text. No more shifts possible.',
        ar: 'نهاية النص. لا توجد إزاحات أخرى ممكنة.'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      textRowEl.innerHTML = '';
      patternRowEl.innerHTML = '';
  
      // Render Text
      for (var i = 0; i < s.text.length; i++) {
        var charBox = createCharBox(s.text[i]);
        // Check if character is within the current pattern window
        if (i >= s.offset && i < s.offset + s.pattern.length) {
          var j = i - s.offset; // Index within pattern
          if (s.fullMatch) {
            charBox.style.backgroundColor = 'var(--algo-compare)'; // All chars in window are matched
          } else if (s.compareIdx !== -1 && j === s.compareIdx) {
            charBox.style.backgroundColor = 'var(--algo-active)'; // Currently comparing
          } else if (s.mismatchIdx !== -1 && j === s.mismatchIdx) {
            charBox.style.backgroundColor = 'var(--algo-swap)'; // First mismatch
          } else if (j < s.matchLength) {
            charBox.style.backgroundColor = 'var(--algo-compare)'; // Already matched prefix
          }
        }
        textRowEl.appendChild(charBox);
      }
  
      // Render Pattern
      for (var j = 0; j < s.pattern.length; j++) {
        var charBox = createCharBox(s.pattern[j]);
        if (s.fullMatch) {
          charBox.style.backgroundColor = 'var(--algo-compare)'; // All chars in pattern are matched
        } else if (s.compareIdx !== -1 && j === s.compareIdx) {
          charBox.style.backgroundColor = 'var(--algo-active)'; // Currently comparing
        } else if (s.mismatchIdx !== -1 && j === s.mismatchIdx) {
          charBox.style.backgroundColor = 'var(--algo-swap)'; // First mismatch
        } else if (j < s.matchLength) {
          charBox.style.backgroundColor = 'var(--algo-compare)'; // Already matched prefix
        }
        patternRowEl.appendChild(charBox);
      }
  
      // Position pattern row
      patternRowEl.style.left = (s.offset * (CHAR_WIDTH + CHAR_MARGIN)) + 'px';
  
      // Update arrow
      var arrowX = s.offset * (CHAR_WIDTH + CHAR_MARGIN) + CHAR_WIDTH / 2;
      arrowLineEl.setAttribute('x1', arrowX);
      arrowLineEl.setAttribute('y1', TEXT_ROW_TOP - 10); // Above text row
      arrowLineEl.setAttribute('x2', arrowX);
      arrowLineEl.setAttribute('y2', PATTERN_ROW_TOP - 10); // Above pattern row
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
    container.querySelector('.algo-speed input').addEventListener('input', function () {
      if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
    });
  
    window._algoRerenders[ID] = render;
    generateSteps();
    render();
};

window._algoTitles = window._algoTitles || {};
window._algoTitles[4] = { en: 'Closest Pair (Brute Force)', ar: 'أقرب زوج (القوة الغاشمة)' };

window.AlgoWidgets[4] = function (container) {
  container.innerHTML = '<div class="algo-widget">' +
    _AL.titleHTML(4) +
    _AL.toolbar(4) +
    '<div class="algo-explanation" id="w4-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
    
    // حاوية متجاوبة 16:9
    '<div class="algo-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
      '<svg id="w4-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
    '</div>' +
    
    // دليل الألوان
    '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:2px solid var(--text-muted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w4-point"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w4-current"></span></span>' +
      '<span><span style="display:inline-block;width:16px;height:2px;border-bottom:3px dashed var(--algo-compare);margin-right:4px;vertical-align:middle;"></span><span data-algo-text="w4-compare-line"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w4-closest"></span></span>' +
    '</div>' +
  '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl   = container.querySelector('#w4-exp');
  var svgEl   = container.querySelector('#w4-svg');
  var counter = container.querySelector('[data-algo-counter]');
  
  var steps = [], cur = 0, playing = false, interval = null;
  var isInitialized = false;

  // مساحة الرسم (800x450) مع هوامش للحواف
  const W = 800, H = 450, PADDING = 60;
  const RADIUS = 8;
  
  // بيانات الخوارزمية وعناصر الـ UI
  var points = [];
  var uiPoints = [];
  var uiBestLine = null;
  var uiCurrLine = null;
  var uiDistLabel = { g: null, bg: null, txt: null };

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    container.querySelector('[data-algo-text="w4-point"]').textContent        = _AL.exp('Unexplored Point', 'نقطة لم تُفحص');
    container.querySelector('[data-algo-text="w4-current"]').textContent      = _AL.exp('Currently Comparing', 'نقطة قيد المقارنة');
    container.querySelector('[data-algo-text="w4-compare-line"]').textContent = _AL.exp('Distance Check', 'قياس المسافة');
    container.querySelector('[data-algo-text="w4-closest"]').textContent      = _AL.exp('Closest Pair Found', 'أقرب زوج تم العثور عليه');
  }

  function dist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  function generateSteps() {
    points = [];
    // توليد 8 إلى 12 نقطة عشوائية بمسافات متباعدة نسبياً
    var numPoints = Math.floor(Math.random() * 5) + 8; 
    
    for (var i = 0; i < numPoints; i++) {
      points.push({
        id: String.fromCharCode(65 + i), // A, B, C...
        x: PADDING + Math.floor(Math.random() * (W - PADDING * 2)),
        y: PADDING + Math.floor(Math.random() * (H - PADDING * 2))
      });
    }

    steps = [];
    var minDist = Infinity;
    var closestPair = null;

    steps.push({
      p1: null, p2: null, phase: 'intro', currDist: null, bestDist: Infinity, bestPair: null,
      en: `<strong>Brute Force:</strong> We have ${numPoints} random points. We need to check the distance between <em>every single pair</em>.`,
      ar: `<strong>القوة الغاشمة (Brute Force):</strong> لدينا ${numPoints} نقاط عشوائية. سنقوم بحساب المسافة بين <em>كل زوج ممكن</em> من النقاط.`
    });

    for (var i = 0; i < numPoints; i++) {
      for (var j = i + 1; j < numPoints; j++) {
        var p1 = points[i];
        var p2 = points[j];
        var d = dist(p1, p2);

        steps.push({
          p1: i, p2: j, phase: 'compare', currDist: d, bestDist: minDist, bestPair: closestPair ? [...closestPair] : null,
          en: `Measuring distance between <strong>${p1.id}</strong> and <strong>${p2.id}</strong>. Distance = <strong>${d.toFixed(1)}</strong>.`,
          ar: `قياس المسافة بين <strong>${p1.id}</strong> و <strong>${p2.id}</strong>. المسافة = <strong dir="ltr">${d.toFixed(1)}</strong>.`
        });

        if (d < minDist) {
          minDist = d;
          closestPair = [i, j];
          steps.push({
            p1: i, p2: j, phase: 'new_min', currDist: d, bestDist: minDist, bestPair: [...closestPair],
            en: `<strong>New Minimum Found!</strong> ${d.toFixed(1)} is smaller than our previous best. Update closest pair.`,
            ar: `<strong>تم العثور على مسافة أصغر!</strong> <span dir="ltr">${d.toFixed(1)}</span> أصغر من المسافة السابقة. نحدّث أقرب زوج.`
          });
        }
      }
    }

    steps.push({
      p1: null, p2: null, phase: 'done', currDist: null, bestDist: minDist, bestPair: [...closestPair],
      en: `<strong>Finished!</strong> The closest points are <strong>${points[closestPair[0]].id}</strong> and <strong>${points[closestPair[1]].id}</strong> with a distance of <strong>${minDist.toFixed(1)}</strong>.`,
      ar: `<strong>انتهينا!</strong> أقرب نقطتين هما <strong>${points[closestPair[0]].id}</strong> و <strong>${points[closestPair[1]].id}</strong> بمسافة قدرها <strong dir="ltr">${minDist.toFixed(1)}</strong>.`
    });
  }

  function makeSVG(tag, attrs) {
    let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let k in attrs) el.setAttribute(k, attrs[k]);
    el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    return el;
  }

  function buildSVG() {
    svgEl.innerHTML = '';
    uiPoints = [];

    // مجموعة الخطوط في الخلفية
    let linesG = makeSVG('g', {});
    
    // خط أفضل مسافة (Best Pair Line)
    uiBestLine = makeSVG('line', { stroke: 'var(--algo-sorted)', 'stroke-width': 4, opacity: 0 });
    linesG.appendChild(uiBestLine);

    // خط المقارنة الحالية (Current Comparison Line)
    uiCurrLine = makeSVG('line', { stroke: 'var(--algo-compare)', 'stroke-width': 2.5, 'stroke-dasharray': '6,4', opacity: 0 });
    linesG.appendChild(uiCurrLine);
    
    svgEl.appendChild(linesG);

    // مجموعة النقاط
    let nodesG = makeSVG('g', {});
    points.forEach((p, i) => {
      let g = makeSVG('g', { 'transform-origin': `${p.x}px ${p.y}px` });
      
      let circ = makeSVG('circle', { cx: p.x, cy: p.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 2 });
      
      // خلفية بسيطة للحرف ليكون مقروءاً دائماً
      let lblBg = makeSVG('circle', { cx: p.x, cy: p.y - 20, r: 10, fill: 'var(--algo-canvas-bg)', opacity: 0.8 });
      let lbl = makeSVG('text', { x: p.x, y: p.y - 20, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-weight': 'bold', 'font-size': '14px' });
      lbl.textContent = p.id;

      g.appendChild(circ);
      g.appendChild(lblBg);
      g.appendChild(lbl);
      nodesG.appendChild(g);
      
      uiPoints.push({ g, circ, lblBg, lbl, x: p.x, y: p.y });
    });
    svgEl.appendChild(nodesG);

    // صندوق يطفو فوق خط المقارنة لعرض المسافة الحالية
    uiDistLabel.g = makeSVG('g', { opacity: 0 });
    uiDistLabel.bg = makeSVG('rect', { width: 54, height: 24, rx: 6, fill: 'var(--algo-compare)' });
    uiDistLabel.txt = makeSVG('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: '#ffffff', 'font-family': "'JetBrains Mono', monospace", 'font-weight': '800', 'font-size': '13px' });
    uiDistLabel.g.appendChild(uiDistLabel.bg);
    uiDistLabel.g.appendChild(uiDistLabel.txt);
    svgEl.appendChild(uiDistLabel.g);

    isInitialized = true;
  }

  function render() {
    if (!isInitialized) buildSVG();
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    // 1. تحديث الخط الأفضل (Best Line)
    if (s.bestPair) {
      let bp1 = points[s.bestPair[0]];
      let bp2 = points[s.bestPair[1]];
      uiBestLine.setAttribute('x1', bp1.x); uiBestLine.setAttribute('y1', bp1.y);
      uiBestLine.setAttribute('x2', bp2.x); uiBestLine.setAttribute('y2', bp2.y);
      uiBestLine.style.opacity = (s.phase === 'done') ? '1' : '0.4'; // واضح جداً في النهاية، باهت أثناء البحث
    } else {
      uiBestLine.style.opacity = '0';
    }

    // 2. تحديث خط المقارنة الحالي وتسمية المسافة (Current Compare Line & Label)
    if (s.p1 !== null && s.p2 !== null && s.phase !== 'done') {
      let cp1 = points[s.p1];
      let cp2 = points[s.p2];
      uiCurrLine.setAttribute('x1', cp1.x); uiCurrLine.setAttribute('y1', cp1.y);
      uiCurrLine.setAttribute('x2', cp2.x); uiCurrLine.setAttribute('y2', cp2.y);
      
      let mx = (cp1.x + cp2.x) / 2;
      let my = (cp1.y + cp2.y) / 2;
      
      // إذا كان هذا هو الرقم الأصغر الجديد، نغير لون الصندوق ليكون مميزاً
      let isNewMin = s.phase === 'new_min';
      let boxColor = isNewMin ? 'var(--algo-swap)' : 'var(--algo-compare)';
      uiCurrLine.setAttribute('stroke', boxColor);
      uiCurrLine.setAttribute('stroke-width', isNewMin ? '4' : '2.5');
      uiCurrLine.setAttribute('stroke-dasharray', isNewMin ? '0' : '6,4');
      
      uiDistLabel.bg.setAttribute('fill', boxColor);
      uiDistLabel.bg.setAttribute('x', mx - 27);
      uiDistLabel.bg.setAttribute('y', my - 12);
      uiDistLabel.txt.setAttribute('x', mx);
      uiDistLabel.txt.setAttribute('y', my);
      uiDistLabel.txt.textContent = s.currDist.toFixed(1);
      
      uiCurrLine.style.opacity = '1';
      uiDistLabel.g.style.opacity = '1';
      
      // تأثير القفز للرقم عند إيجاد حد أدنى جديد
      uiDistLabel.g.style.transform = isNewMin ? 'scale(1.2)' : 'scale(1)';
      uiDistLabel.g.style.transformOrigin = `${mx}px ${my}px`;
    } else {
      uiCurrLine.style.opacity = '0';
      uiDistLabel.g.style.opacity = '0';
    }

    // 3. تحديث مظهر النقاط (Nodes)
    uiPoints.forEach((ui, idx) => {
      let isComparing = (idx === s.p1 || idx === s.p2) && s.phase !== 'done';
      let isBest = (s.bestPair && (idx === s.bestPair[0] || idx === s.bestPair[1]));
      let isNewMin = isComparing && s.phase === 'new_min';

      let fill = 'var(--bg-elevated)';
      let stroke = 'var(--text-muted)';
      let scale = 'scale(1)';
      let opacity = '0.3'; // بهتان النقاط غير النشطة للتركيز على مسار الفحص

      if (s.phase === 'intro' || s.phase === 'done') {
        opacity = '1';
      }

      if (isComparing) {
        fill = isNewMin ? 'var(--algo-swap)' : 'var(--algo-compare)';
        stroke = '#ffffff';
        scale = 'scale(1.4)';
        opacity = '1';
        // إظهار النقاط التي يتم فحصها في المقدمة
        ui.g.parentNode.appendChild(ui.g); 
      } else if (isBest) {
        fill = 'var(--algo-sorted)';
        stroke = '#ffffff';
        scale = (s.phase === 'done') ? 'scale(1.5)' : 'scale(1.2)';
        opacity = '1';
      }

      ui.circ.setAttribute('fill', fill);
      ui.circ.setAttribute('stroke', stroke);
      ui.circ.setAttribute('stroke-width', (isComparing || isBest) ? '3' : '2');
      ui.g.style.transform = scale;
      ui.g.style.opacity = opacity;
    });
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
  
  // إعادة التوليد بأرقام وإحداثيات جديدة عند النقر على "إعادة"
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () { 
    stopPlay(); 
    isInitialized = false;
    generateSteps(); 
    cur = 0; 
    render(); 
  });
  
  container.querySelector('.algo-speed input').addEventListener('input', function () {
    if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
  });

  window._algoRerenders[4] = render;
  generateSteps();
  render();
};

window.AlgoWidgets[5] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(5) +
      _AL.toolbar(5) +
      '<div class="algo-explanation" id="w5-exp"></div>' +
      '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:20px; margin-top:15px;">' +
      '<div class="algo-canvas" id="w5-canvas" style="width:350px; height:350px; border:1px solid var(--algo-border); border-radius:8px; background:var(--algo-canvas-bg);"></div>' +
      '<div style="flex-grow:1; min-width:250px;">' +
      '<h5 style="text-align:center; margin-bottom:10px;"><span data-algo-text="w5-tours-title"></span></h5>' +
      '<div style="max-height:300px; overflow-y:auto; border:1px solid var(--algo-border); border-radius:8px;">' +
      '<table id="w5-tours-table" style="width:100%; border-collapse:collapse; font-size:0.9em;">' +
      '<thead><tr>' +
      '<th style="padding:8px; border-bottom:1px solid var(--algo-border); text-align:start;"><span data-algo-text="w5-tour-col"></span></th>' +
      '<th style="padding:8px; border-bottom:1px solid var(--algo-border); text-align:end;"><span data-algo-text="w5-length-col"></span></th>' +
      '</tr></thead>' +
      '<tbody></tbody>' +
      '</table>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-current-path"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-optimal-path"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-other-edges"></span></span>' +
      '</div>' +
      '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w5-exp');
    var canvasEl = container.querySelector('#w5-canvas');
    var toursTableBody = container.querySelector('#w5-tours-table tbody');
    var counter = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    var nodes = {
      'A': { x: 175, y: 50 },
      'B': { x: 300, y: 175 },
      'C': { x: 175, y: 300 },
      'D': { x: 50, y: 175 }
    };
  
    var edges = [
      { from: 'A', to: 'B', weight: 10 },
      { from: 'A', to: 'C', weight: 15 },
      { from: 'A', to: 'D', weight: 20 },
      { from: 'B', to: 'C', weight: 35 },
      { from: 'B', to: 'D', weight: 25 },
      { from: 'C', to: 'D', weight: 30 }
    ];
  
    function getEdgeWeight(from, to) {
      for (var i = 0; i < edges.length; i++) {
        if ((edges[i].from === from && edges[i].to === to) || (edges[i].from === to && edges[i].to === from)) {
          return edges[i].weight;
        }
      }
      return Infinity; // Should not happen for a complete graph
    }
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w5-tours-title"]').textContent = _AL.exp('All Possible Tours', 'جميع المسارات الممكنة');
      container.querySelector('[data-algo-text="w5-tour-col"]').textContent = _AL.exp('Tour', 'المسار');
      container.querySelector('[data-algo-text="w5-length-col"]').textContent = _AL.exp('Length', 'الطول');
      container.querySelector('[data-algo-text="w5-current-path"]').textContent = _AL.exp('Current Tour', 'المسار الحالي');
      container.querySelector('[data-algo-text="w5-optimal-path"]').textContent = _AL.exp('Optimal Tour', 'المسار الأمثل');
      container.querySelector('[data-algo-text="w5-other-edges"]').textContent = _AL.exp('Other Edges', 'الحواف الأخرى');
    }
  
    function generateSteps() {
      steps = [];
      var cityNames = Object.keys(nodes);
      var startNode = cityNames[0]; // Fix start node to 'A'
      var otherCities = cityNames.slice(1); // B, C, D
  
      var initialStep = {
        tours: [],
        currentTour: [],
        currentTourLength: 0,
        optimalTourIdx: -1,
        en: 'Starting TSP Brute Force. We will enumerate all possible tours starting and ending at ' + startNode + '.',
        ar: 'بدء مشكلة البائع المتجول بالقوة الغاشمة. سنقوم بحساب جميع المسارات الممكنة التي تبدأ وتنتهي عند ' + startNode + '.'
      };
      steps.push(initialStep);
  
      function permute(arr, l, r, currentTours) {
        if (l === r) {
          var tourPath = [startNode].concat(arr).concat([startNode]);
          var tourLength = 0;
          var tourString = tourPath.join(' → ');
          for (var i = 0; i < tourPath.length - 1; i++) {
            tourLength += getEdgeWeight(tourPath[i], tourPath[i + 1]);
          }
  
          var newTours = currentTours.slice();
          newTours.push({ path: tourString, length: tourLength });
  
          var currentOptimalIdx = -1;
          var minLength = Infinity;
          for (var i = 0; i < newTours.length; i++) {
            if (newTours[i].length < minLength) {
              minLength = newTours[i].length;
              currentOptimalIdx = i;
            }
          }
  
          steps.push({
            tours: newTours,
            currentTour: tourPath,
            currentTourLength: tourLength,
            optimalTourIdx: currentOptimalIdx,
            en: 'Evaluating tour: ' + tourString + ' with total length ' + tourLength + '. Current optimal length: ' + minLength + '.',
            ar: 'تقييم المسار: ' + tourString + ' بطول إجمالي ' + tourLength + '. الطول الأمثل الحالي: ' + minLength + '.'
          });
        } else {
          for (var i = l; i <= r; i++) {
            [arr[l], arr[i]] = [arr[i], arr[l]]; // Swap
            permute(arr, l + 1, r, currentTours);
            [arr[l], arr[i]] = [arr[i], arr[l]]; // Backtrack
          }
        }
      }
  
      permute(otherCities, 0, otherCities.length - 1, []);
  
      var finalStep = steps[steps.length - 1];
      steps.push({
        tours: finalStep.tours,
        currentTour: [], // No specific tour highlighted, just final result
        currentTourLength: 0,
        optimalTourIdx: finalStep.optimalTourIdx,
        en: 'All tours evaluated. The shortest tour has a length of ' + finalStep.tours[finalStep.optimalTourIdx].length + '.',
        ar: 'تم تقييم جميع المسارات. أقصر مسار له طول ' + finalStep.tours[finalStep.optimalTourIdx].length + '.'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Render SVG graph
      canvasEl.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 350 350"></svg>';
      var svg = canvasEl.querySelector('svg');
  
      // Draw edges
      edges.forEach(function (edge) {
        var fromNode = nodes[edge.from];
        var toNode = nodes[edge.to];
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke', 'var(--algo-compare)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
  
        // Draw edge weight
        var midX = (fromNode.x + toNode.x) / 2;
        var midY = (fromNode.y + toNode.y) / 2;
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX + 5);
        text.setAttribute('y', midY - 5);
        text.setAttribute('fill', 'var(--algo-text)');
        text.setAttribute('font-size', '12');
        text.textContent = edge.weight;
        svg.appendChild(text);
      });
  
      // Highlight optimal path edges first (if different from current)
      if (s.optimalTourIdx !== -1 && s.currentTour.length > 0 && s.tours[s.optimalTourIdx].path !== s.currentTour.join(' → ')) {
        var optimalPathNodes = s.tours[s.optimalTourIdx].path.split(' → ');
        for (var i = 0; i < optimalPathNodes.length - 1; i++) {
          var n1 = nodes[optimalPathNodes[i]];
          var n2 = nodes[optimalPathNodes[i + 1]];
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', n1.x);
          line.setAttribute('y1', n1.y);
          line.setAttribute('x2', n2.x);
          line.setAttribute('y2', n2.y);
          line.setAttribute('stroke', 'var(--algo-sorted)');
          line.setAttribute('stroke-width', '3');
          svg.appendChild(line);
        }
      }
  
      // Highlight current path edges
      if (s.currentTour.length > 0) {
        for (var i = 0; i < s.currentTour.length - 1; i++) {
          var n1 = nodes[s.currentTour[i]];
          var n2 = nodes[s.currentTour[i + 1]];
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', n1.x);
          line.setAttribute('y1', n1.y);
          line.setAttribute('x2', n2.x);
          line.setAttribute('y2', n2.y);
          line.setAttribute('stroke', 'var(--algo-active)');
          line.setAttribute('stroke-width', '3');
          svg.appendChild(line);
        }
      }
  
      // Draw nodes (on top of lines)
      for (var nodeName in nodes) {
        var node = nodes[nodeName];
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', '18');
        circle.setAttribute('fill', 'var(--brand-500)');
        circle.setAttribute('stroke', 'var(--algo-border)');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
  
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--algo-bg)');
        text.setAttribute('font-weight', 'bold');
        text.textContent = nodeName;
        svg.appendChild(text);
      }
  
      // Render tours table
      toursTableBody.innerHTML = '';
      s.tours.forEach(function (tour, idx) {
        var row = toursTableBody.insertRow();
        row.style.background = 'transparent';
        row.style.color = 'var(--algo-text)';
        if (s.currentTour.join(' → ') === tour.path) {
          row.style.background = 'var(--algo-active)';
          row.style.color = 'var(--algo-bg)';
        } else if (idx === s.optimalTourIdx) {
          row.style.background = 'var(--algo-sorted)';
          row.style.color = 'var(--algo-bg)';
        }
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        cell1.textContent = tour.path;
        cell2.textContent = tour.length;
        cell1.style.padding = '8px';
        cell2.style.padding = '8px';
        cell1.style.borderBottom = '1px solid var(--algo-border)';
        cell2.style.borderBottom = '1px solid var(--algo-border)';
        cell2.style.textAlign = 'end';
      });
      if (s.currentTour.length > 0) {
        var currentTourRow = toursTableBody.querySelector('tr:has(td:first-child:contains("' + s.currentTour.join(' → ') + '"))');
        if (currentTourRow) currentTourRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
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
    container.querySelector('.algo-speed input').addEventListener('input', function () {
      if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
    });
  
    window._algoRerenders[5] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[6] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(6) +
      _AL.toolbar(6) +
      '<div class="algo-explanation" id="w6-exp"></div>' +
      '<div class="w6-knapsack-container">' +
        '<div class="w6-items-display">' +
          '<h5 data-algo-text="w6-available-items"></h5>' +
          '<div id="w6-items-list" class="w6-items-list"></div>' +
        '</div>' +
        '<div class="w6-knapsack-info">' +
          '<h5 data-algo-text="w6-knapsack-capacity"></h5>' +
          '<div id="w6-capacity-value" class="w6-capacity-value"></div>' +
        '</div>' +
      '</div>' +
      '<div class="w6-table-container">' +
        '<h5 data-algo-text="w6-subsets-table-title"></h5>' +
        
        // دليل الألوان (Legend) الجديد
        '<div class="w6-legend">' +
          '<span class="w6-legend-item"><span class="w6-legend-color" style="background-color: var(--algo-compare);"></span> <span data-algo-text="w6-leg-current"></span></span>' +
          '<span class="w6-legend-item"><span class="w6-legend-color" style="background-color: var(--algo-swap);"></span> <span data-algo-text="w6-leg-infeasible"></span></span>' +
          '<span class="w6-legend-item"><span class="w6-legend-color" style="background-color: rgba(var(--algo-sorted-rgb), 0.2);"></span> <span data-algo-text="w6-leg-feasible"></span></span>' +
          '<span class="w6-legend-item"><span class="w6-legend-color" style="background-color: var(--algo-sorted);"></span> <span data-algo-text="w6-leg-optimal"></span></span>' +
        '</div>' +

        // حاوية شريط التمرير الجديدة التي تغلف الجدول
        '<div class="w6-table-scroll-area">' +
          '<table id="w6-subsets-table" class="w6-subsets-table">' +
            '<thead><tr>' +
              '<th data-algo-text="w6-th-subset"></th>' +
              '<th data-algo-text="w6-th-weight"></th>' +
              '<th data-algo-text="w6-th-value"></th>' +
              '<th data-algo-text="w6-th-feasible"></th>' +
            '</tr></thead>' +
            '<tbody></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
      '<style>' +
        /* ترتيب الحاويتين (العناصر والسعة) بجانب بعضهما مع تقليل المسافات */
        '.w6-knapsack-container { display: flex; justify-content: center; align-items: stretch; gap: 15px; margin-top: 10px; flex-wrap: wrap; }' +
        '.w6-items-display { flex: 1; min-width: 200px; max-width: 400px; border: 1px solid var(--algo-border); padding: 10px; border-radius: 8px; background-color: var(--algo-canvas-bg); text-align: center; }' +
        '.w6-knapsack-info { width: 140px; border: 1px solid var(--algo-border); padding: 10px; border-radius: 8px; background-color: var(--algo-canvas-bg); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }' +
        
        /* جعل العناصر مربعة ومضغوطة */
        '.w6-items-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px; }' +
        '.w6-item-box { width: 65px; height: 65px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid var(--algo-muted); border-radius: 6px; background-color: var(--brand-400); color: var(--algo-text); font-size: 0.8em; line-height: 1.3; transition: all 0.2s ease-in-out; }' +
        '.w6-item-box.w6-item-selected { background-color: var(--algo-active); border-color: var(--algo-active); color: var(--algo-bg); transform: scale(1.05); box-shadow: 0 4px 8px var(--brand-glow); }' +
        
        /* تقليل حجم نص السعة ليتناسب مع الصندوق الجديد */
        '.w6-capacity-value { font-size: 1.3em; font-weight: bold; color: var(--algo-active); margin-top: 5px; }' +
        '.w6-table-container { margin-top: 30px; text-align: center; }' +
        
        /* تنسيق دليل الألوان */
        '.w6-legend { display: flex; justify-content: center; gap: 15px; margin: 15px 0; flex-wrap: wrap; font-size: 0.9em; color: var(--algo-text); }' +
        '.w6-legend-item { display: flex; align-items: center; gap: 6px; }' +
        '.w6-legend-color { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--algo-border); }' +

        /* تنسيق صندوق التمرير للجدول */
        '.w6-table-scroll-area { max-height: 300px; overflow-y: auto; border: 1px solid var(--algo-border); border-radius: 8px; margin: 0 auto; max-width: 800px; background-color: var(--algo-canvas-bg); }' +
        '.w6-subsets-table { width: 100%; border-collapse: collapse; margin: 0; }' +
        '.w6-subsets-table th, .w6-subsets-table td { border: 1px solid var(--algo-border); border-top: none; padding: 10px; text-align: center; }' +
        
        /* تثبيت رأس الجدول أثناء التمرير (Sticky Header) */
        '.w6-subsets-table thead th { position: sticky; top: 0; z-index: 10; background-color: var(--brand-500); color: var(--algo-bg); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }' +

        /* --- الأسطر التي تم استرجاعها لتلوين صفوف الجدول --- */
        '.w6-subsets-table tbody tr:nth-child(even) { background-color: rgba(var(--brand-rgb), 0.1); }' +
        '.w6-subsets-table tbody tr.w6-current-subset { background-color: var(--algo-compare); color: var(--algo-bg); font-weight: bold; }' +
        '.w6-subsets-table tbody tr.w6-infeasible { background-color: var(--algo-swap); color: var(--algo-bg); }' +
        '.w6-subsets-table tbody tr.w6-feasible { background-color: rgba(var(--algo-sorted-rgb), 0.2); }' +
        '.w6-subsets-table tbody tr.w6-optimal { background-color: var(--algo-sorted); color: var(--algo-bg); font-weight: bold; box-shadow: 0 0 10px var(--algo-sorted); }' +
      '</style>' +
    '</div>';
  
    var btnPlay   = container.querySelector('[data-algo-btn="play"]');
    var expEl     = container.querySelector('#w6-exp');
    var itemsListEl = container.querySelector('#w6-items-list');
    var capacityValueEl = container.querySelector('#w6-capacity-value');
    var subsetsTableBody = container.querySelector('#w6-subsets-table tbody');
    var counter   = container.querySelector('[data-algo-counter]');
  
    var steps = [], cur = 0, playing = false, interval = null;
    var items = [];
    var capacity = 0;
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w6-available-items"]').textContent = _AL.exp('Available Items', 'العناصر المتاحة');
      container.querySelector('[data-algo-text="w6-knapsack-capacity"]').textContent = _AL.exp('Knapsack Capacity', 'سعة حقيبة الظهر');
      container.querySelector('[data-algo-text="w6-subsets-table-title"]').textContent = _AL.exp('Subsets Enumeration', 'تعداد المجموعات الفرعية');
      container.querySelector('[data-algo-text="w6-th-subset"]').textContent = _AL.exp('Subset', 'المجموعة الفرعية');
      container.querySelector('[data-algo-text="w6-th-weight"]').textContent = _AL.exp('Weight (kg)', 'الوزن (كجم)');
      container.querySelector('[data-algo-text="w6-th-value"]').textContent = _AL.exp('Value ($)', 'القيمة ($)');
      container.querySelector('[data-algo-text="w6-th-feasible"]').textContent = _AL.exp('Feasible?', 'ممكن؟');
	  container.querySelector('[data-algo-text="w6-leg-current"]').textContent = _AL.exp('Current Eval', 'جاري التقييم');
      container.querySelector('[data-algo-text="w6-leg-infeasible"]').textContent = _AL.exp('Overweight', 'تجاوز السعة (مرفوض)');
      container.querySelector('[data-algo-text="w6-leg-feasible"]').textContent = _AL.exp('Feasible', 'مقبول (ضمن السعة)');
      container.querySelector('[data-algo-text="w6-leg-optimal"]').textContent = _AL.exp('Optimal Solution', 'الحل الأمثل');
    }
  
    function generateSteps() {
      // Generate random items (4-5 items)
      items = [];
      var numItems = Math.floor(Math.random() * 2) + 4; // 4 or 5 items
      for (var i = 0; i < numItems; i++) {
        items.push({
          id: 'i' + (i + 1),
          weight: Math.floor(Math.random() * 7) + 3, // 3-9 kg
          value: Math.floor(Math.random() * 90) + 10 // $10-$100
        });
      }
      // Generate random capacity
      capacity = Math.floor(Math.random() * 10) + 15; // 15-24 kg
  
      steps = [];
      var n = items.length;
      var maxOverallValue = -1;
      var optimalSubsetIndex = -1;
      var subsetsTable = []; // Stores all generated subsets for the table
  
      // Initial state
      steps.push({
        items: items,
        capacity: capacity,
        currentSubsetIndices: [],
        currentWeight: 0,
        currentValue: 0,
        isFeasible: true,
        subsetsTable: [],
        optimalSubsetIndex: -1,
        en: 'Starting Knapsack Brute Force. Items and capacity are defined.',
        ar: 'بدء حل مشكلة حقيبة الظهر بالقوة الغاشمة. تم تحديد العناصر والسعة.'
      });
  
      // Iterate through all 2^n subsets
      for (var i = 0; i < (1 << n); i++) {
        var currentSubset = [];
        var currentSubsetIndices = [];
        var currentWeight = 0;
        var currentValue = 0;
  
        for (var j = 0; j < n; j++) {
          if ((i >> j) & 1) { // If j-th bit is set, include item j
            currentSubset.push(items[j].id);
            currentSubsetIndices.push(j);
            currentWeight += items[j].weight;
            currentValue += items[j].value;
          }
        }
  
        var isFeasible = currentWeight <= capacity;
        var subsetString = currentSubset.length > 0 ? '{' + currentSubset.join(', ') + '}' : '{}';
  
        var newSubsetRow = {
          id: i,
          subsetString: subsetString,
          weight: currentWeight,
          value: currentValue,
          isFeasible: isFeasible,
          isOptimal: false // Will be set later for the final optimal
        };
        subsetsTable.push(newSubsetRow);
  
        // Update optimal solution if feasible and better
        if (isFeasible && currentValue > maxOverallValue) {
          maxOverallValue = currentValue;
          optimalSubsetIndex = i;
        }
  
        var explanationEn = 'Evaluating subset: ' + subsetString + '. Weight: ' + currentWeight + 'kg, Value: $' + currentValue + '. ';
        var explanationAr = 'تقييم المجموعة الفرعية: ' + subsetString + '. الوزن: ' + currentWeight + ' كجم، القيمة: $' + currentValue + '. ';
  
        if (!isFeasible) {
          explanationEn += 'Exceeds capacity (' + capacity + 'kg). Not feasible.';
          explanationAr += 'تجاوز السعة (' + capacity + ' كجم). غير ممكن.';
        } else {
          explanationEn += 'Feasible. Current best value: $' + maxOverallValue + '.';
          explanationAr += 'ممكن. أفضل قيمة حالية: $' + maxOverallValue + '.';
        }
  
        steps.push({
          items: items,
          capacity: capacity,
          currentSubsetIndices: currentSubsetIndices,
          currentWeight: currentWeight,
          currentValue: currentValue,
          isFeasible: isFeasible,
          subsetsTable: JSON.parse(JSON.stringify(subsetsTable)), // Deep copy
          currentSubsetId: i,
          optimalSubsetIndex: optimalSubsetIndex,
          en: explanationEn,
          ar: explanationAr
        });
      }
  
      // Final step: Mark the optimal solution
      var finalSubsetsTable = JSON.parse(JSON.stringify(subsetsTable));
      if (optimalSubsetIndex !== -1) {
        finalSubsetsTable.find(row => row.id === optimalSubsetIndex).isOptimal = true;
      }
      steps.push({
        items: items,
        capacity: capacity,
        currentSubsetIndices: [], // No specific subset highlighted
        currentWeight: 0,
        currentValue: 0,
        isFeasible: true,
        subsetsTable: finalSubsetsTable,
        optimalSubsetIndex: optimalSubsetIndex,
        en: 'All subsets evaluated. The optimal feasible solution (highlighted) has a value of $' + maxOverallValue + '.',
        ar: 'تم تقييم جميع المجموعات الفرعية. الحل الأمثل الممكن (المظلل) له قيمة $' + maxOverallValue + '.'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Render items
      itemsListEl.innerHTML = '';
      s.items.forEach(function(item, idx) {
        var itemBox = document.createElement('div');
        itemBox.className = 'w6-item-box';
        // تم تنسيق النص ليظهر بشكل عمودي مناسب للمربع
        itemBox.innerHTML = '<strong>' + item.id + '</strong><span>' + item.weight + 'kg</span><span>$' + item.value + '</span>';
        if (s.currentSubsetIndices.includes(idx)) {
          itemBox.classList.add('w6-item-selected');
        }
        itemsListEl.appendChild(itemBox);
      });
  
      // Render capacity
      capacityValueEl.textContent = s.capacity + 'kg';
  
      // Render subsets table
      subsetsTableBody.innerHTML = '';
      s.subsetsTable.forEach(function(subsetRow) {
        var tr = document.createElement('tr');
        if (cur < steps.length - 1 && subsetRow.id === s.currentSubsetId) {
          tr.classList.add('w6-current-subset');
        } else if (subsetRow.isOptimal) {
          tr.classList.add('w6-optimal');
        } else if (!subsetRow.isFeasible) {
          tr.classList.add('w6-infeasible');
        } else {
          tr.classList.add('w6-feasible');
        }
  
        var tdSubset = document.createElement('td');
        tdSubset.textContent = subsetRow.subsetString;
        tr.appendChild(tdSubset);
  
        var tdWeight = document.createElement('td');
        tdWeight.textContent = subsetRow.weight + 'kg';
        tr.appendChild(tdWeight);
  
        var tdValue = document.createElement('td');
        tdValue.textContent = '$' + subsetRow.value;
        tr.appendChild(tdValue);
  
        var tdFeasible = document.createElement('td');
        tdFeasible.textContent = subsetRow.isFeasible ? _AL.exp('Yes', 'نعم') : _AL.exp('No', 'لا');
        tr.appendChild(tdFeasible);
  
        subsetsTableBody.appendChild(tr);
      });
	  
	  // --- كود التمرير التلقائي (Auto-scroll) المطور ---
      var scrollArea = container.querySelector('.w6-table-scroll-area');
      
      // نبحث أولاً عن الصف الجاري تقييمه
      var activeRow = container.querySelector('.w6-current-subset');
      
      // إذا لم نجد صفاً جاري تقييمه، وكنا في الخطوة الأخيرة، نبحث عن صف (الحل الأمثل)
      if (!activeRow && cur === steps.length - 1) {
        activeRow = container.querySelector('.w6-optimal');
      }
      
      if (scrollArea && activeRow) {
        // حساب المسافة لعمل تمرير سلس يضع الصف المستهدف في منتصف الصندوق تقريباً
        var scrollPosition = activeRow.offsetTop - (scrollArea.clientHeight / 2) + (activeRow.clientHeight / 2);
        
        // تطبيق التمرير
        scrollArea.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  
    function startPlay() {
      playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function(){ if(cur < steps.length-1){ cur++; render(); } else stopPlay(); }, getDelay());
    }
    function stopPlay() {
      playing = false; clearInterval(interval); interval = null;
      btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
    }
  
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click',  function(){ stopPlay(); if(cur>0){ cur--; render(); } });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click',  function(){ stopPlay(); if(cur<steps.length-1){ cur++; render(); } });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click',  function(){ playing ? stopPlay() : startPlay(); });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); generateSteps(); cur=0; render(); });
    container.querySelector('.algo-speed input').addEventListener('input', function(){
      if(playing){ clearInterval(interval); interval = setInterval(function(){ if(cur<steps.length-1){cur++;render();}else stopPlay(); }, getDelay()); }
    });
  
    window._algoRerenders[6] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[7] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(7) +
      _AL.toolbar(7) +
      // تصغير حجم الشرح العلوي ليتناسب مع الجوال (0.85rem)
      '<div class="algo-explanation" id="w7-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 10px;"></div>' +
      
      '<div class="algo-assignment-container" style="display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:10px;">' +
      
      // التعديل 1: تنسيق صندوق الجدول
      '<div class="algo-matrix-wrapper" style="border:1px solid var(--algo-border); border-radius: var(--radius-md); padding:10px; background:var(--algo-canvas-bg); width: 100%; max-width: 500px; overflow-x: auto;">' +
      '<h5 style="text-align:center; margin-top:0; margin-bottom:10px; color:var(--algo-text); font-size: 0.95rem; font-weight: 800;" data-algo-text="w7-cost-matrix-title"></h5>' +
      
      // التعديل 2: تنسيق الجدول (تصغير الخط، منع الالتصاق، وتوسيط)
      '<table id="w7-cost-matrix" class="algo-table" style="width:100%; border-collapse:collapse; font-size: 0.75rem; margin: 0 auto; text-align: center;">' +
      '<thead style="background:var(--bg-elevated); color: var(--text-primary); font-weight: 800;">' +
      '<tr id="w7-matrix-header"></tr>' +
      '</thead>' +
      '<tbody id="w7-matrix-body"></tbody>' +
      '</table>' +
      '</div>' +
      
      // التعديل 3: التجاوب الذكي للرسمة باستخدام aspect-ratio بدلاً من الارتفاع الثابت
      '<div class="algo-svg-wrapper" style="width:100%; max-width:500px; aspect-ratio: 5 / 2; border:1px solid var(--algo-border); border-radius: var(--radius-md); background:var(--algo-canvas-bg); overflow: hidden;">' +
      '<svg id="w7-assignment-svg" width="100%" height="100%" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet"></svg>' +
      '</div>' +
      
      // التعديل 4: إزالة النصوص المكررة السفلية المزعجة (تم إخفاء التعيين والتكلفة، وإبقاء رسالة الحل الأمثل فقط)
      '<div class="algo-current-info" style="text-align:center; font-size:0.9rem; line-height:1.6; color:var(--algo-text);">' +
      '<div id="w7-optimal-found" style="margin-top:5px; font-weight:bold; color:var(--algo-sorted); display:none;"></div>' +
      '</div>' +
      '</div>' +
      
      // تصغير الأسطورة لـ 0.8rem
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:10px;font-size:0.8rem; color:var(--algo-text);">' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w7-current-assignment"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w7-optimal-solution"></span></span>' +
      '</div>' +
      '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w7-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var matrixTableEl = container.querySelector('#w7-cost-matrix'); // نحتاج هذا للـ RTL
    var matrixHeaderEl = container.querySelector('#w7-matrix-header');
    var matrixBodyEl = container.querySelector('#w7-matrix-body');
    var svgEl = container.querySelector('#w7-assignment-svg');
    var optimalFoundEl = container.querySelector('#w7-optimal-found');
 
    var steps = [], cur = 0, playing = false, interval = null;
    var numEntities = 4; // Persons/Jobs
    var currentCostMatrix = []; 
 
    // SVG Node positions
    var nodeRadius = 15;
    var personNodes = [];
    var jobNodes = [];
    for (var i = 0; i < numEntities; i++) {
      personNodes.push({
        x: 70,
        y: 50 + i * 50,
        label: 'P' + (i + 1)
      });
      jobNodes.push({
        x: 530,
        y: 50 + i * 50,
        label: 'J' + (i + 1)
      });
    }
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w7-cost-matrix-title"]').textContent = _AL.exp('Cost Matrix', 'مصفوفة التكلفة');
      container.querySelector('[data-algo-text="w7-current-assignment"]').textContent = _AL.exp('Current Assignment', 'التعيين الحالي');
      container.querySelector('[data-algo-text="w7-optimal-solution"]').textContent = _AL.exp('Optimal Solution', 'الحل الأمثل');
 
      // التعديل 5: إضافة white-space: nowrap للخلايا لمنع الكلمات من الالتصاق
      matrixHeaderEl.innerHTML = '<th style="padding: 6px; white-space: nowrap; border-bottom: 2px solid var(--brand-500);">' + _AL.exp('Person', 'الشخص') + '</th>';
      for (var j = 0; j < numEntities; j++) {
        matrixHeaderEl.innerHTML += '<th style="padding: 6px; white-space: nowrap; border-bottom: 2px solid var(--brand-500);">' + _AL.exp('Job ' + (j + 1), 'الوظيفة ' + (j + 1)) + '</th>';
      }
 
      personNodes.forEach(function (node, i) { node.label = _AL.exp('P' + (i + 1), 'ش' + (i + 1)); });
      jobNodes.forEach(function (node, i) { node.label = _AL.exp('J' + (i + 1), 'و' + (i + 1)); });
    }
 
    function permute(arr) {
      var results = [];
      function backtrack(index, currentPermutation, used) {
        if (index === arr.length) {
          results.push(currentPermutation.slice());
          return;
        }
        for (var i = 0; i < arr.length; i++) {
          if (!used[i]) {
            used[i] = true;
            currentPermutation.push(arr[i]);
            backtrack(index + 1, currentPermutation, used);
            currentPermutation.pop();
            used[i] = false;
          }
        }
      }
      backtrack(0, [], Array(arr.length).fill(false));
      return results;
    }
 
    function generateRandomCostMatrix(size) {
      var matrix = [];
      for (var i = 0; i < size; i++) {
        matrix[i] = [];
        for (var j = 0; j < size; j++) {
          matrix[i][j] = Math.floor(Math.random() * 16) + 5; 
        }
      }
      return matrix;
    }
 
    function generateSteps() {
      currentCostMatrix = generateRandomCostMatrix(numEntities);
      steps = [];
      var allPermutations = permute(Array.from({ length: numEntities }, (_, i) => i)); 
 
      var minCost = Infinity;
      var optimalPermutation = [];
      var optimalAssignments = [];
 
      steps.push({
        permutation: [],
        cost: 0,
        assignments: [],
        minCostSoFar: Infinity,
        optimalPermutationSoFar: [],
        optimalAssignmentsSoFar: [],
        en: 'Initial state. Checking all permutations for ' + numEntities + ' persons to ' + numEntities + ' jobs.',
        ar: 'الحالة الأولية. فحص جميع التباديل لـ ' + numEntities + ' أشخاص و ' + numEntities + ' وظائف.'
      });
 
      allPermutations.forEach(function (p, index) {
        var currentTotalCost = 0;
        var assignments = [];
        var en_assignments = [];
        var ar_assignments = [];
 
        for (var i = 0; i < numEntities; i++) {
          var person = i;
          var job = p[i]; 
          var cost = currentCostMatrix[person][job];
          currentTotalCost += cost;
          assignments.push({ person: person, job: job, cost: cost });
          en_assignments.push('P' + (person + 1) + '→J' + (job + 1) + ' (' + cost + ')');
          ar_assignments.push('ش' + (person + 1) + '→و' + (job + 1) + ' (' + cost + ')');
        }
 
        var isOptimal = false;
        if (currentTotalCost < minCost) {
          minCost = currentTotalCost;
          optimalPermutation = p;
          optimalAssignments = assignments;
          isOptimal = true;
        }
 
        steps.push({
          permutation: p,
          cost: currentTotalCost,
          assignments: assignments,
          en: 'Considering: ' + en_assignments.join(', ') + '. Total: <strong>' + currentTotalCost + '</strong>.',
          ar: 'النظر في التبديل: <span dir="ltr">' + ar_assignments.join(', ') + '</span>. الإجمالي: <strong dir="ltr">' + currentTotalCost + '</strong>.',
          isOptimal: isOptimal,
          minCostSoFar: minCost,
          optimalPermutationSoFar: optimalPermutation,
          optimalAssignmentsSoFar: optimalAssignments
        });
      });
 
      steps.push({
        permutation: optimalPermutation,
        cost: minCost,
        assignments: optimalAssignments,
        en: 'Algorithm finished. Optimal total cost is <strong>' + minCost + '</strong>.',
        ar: 'انتهت الخوارزمية. التكلفة الإجمالية المثلى هي <strong dir="ltr">' + minCost + '</strong>.',
        isOptimal: true,
        minCostSoFar: minCost,
        optimalPermutationSoFar: optimalPermutation,
        optimalAssignmentsSoFar: optimalAssignments
      });
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
 
      // التعديل 6: فرض التفاف الجدول برمجياً ليدعم العربية RTL
      if(matrixTableEl) {
        matrixTableEl.style.setProperty('direction', _AL.lang() === 'ar' ? 'rtl' : 'ltr', 'important');
      }
 
      // Render Cost Matrix Table
      matrixBodyEl.innerHTML = '';
      for (var i = 0; i < numEntities; i++) {
        var row = matrixBodyEl.insertRow();
        var cellPerson = row.insertCell();
        cellPerson.textContent = _AL.exp('P' + (i + 1), 'ش' + (i + 1));
        cellPerson.style.fontWeight = '700'; // خط أقل سماكة بقليل ليتناسب مع الكلمة العربية
        cellPerson.style.color = 'var(--text-primary)';
        cellPerson.style.border = '1px solid var(--algo-border)';
        cellPerson.style.padding = '6px';
        cellPerson.style.textAlign = 'center';
 
        for (var j = 0; j < numEntities; j++) {
          var cell = row.insertCell();
          cell.textContent = currentCostMatrix[i][j];
          cell.style.border = '1px solid var(--algo-border)';
          cell.style.padding = '6px'; // Padding أقل
          cell.style.textAlign = 'center';
          cell.style.background = 'transparent';
          cell.style.color = 'var(--text-secondary)';
          cell.style.fontWeight = '600';
        }
      }
 
      // Highlight current assignments in matrix
      s.assignments.forEach(function (assignment) {
        var row = matrixBodyEl.rows[assignment.person];
        if (row) {
          var cell = row.cells[assignment.job + 1]; 
          if (cell) {
            cell.style.background = 'var(--algo-active)';
            cell.style.color = '#fff';
            cell.style.fontWeight = '800';
          }
        }
      });
 
      // Highlight optimal assignments
      if (cur === steps.length - 1 || s.isOptimal) {
        s.optimalAssignmentsSoFar.forEach(function (assignment) {
          var row = matrixBodyEl.rows[assignment.person];
          if (row) {
            var cell = row.cells[assignment.job + 1];
            if (cell) {
              cell.style.background = 'var(--algo-sorted)';
              cell.style.color = '#fff';
              cell.style.fontWeight = '800';
            }
          }
        });
      }
 
      // Render SVG
      svgEl.innerHTML = ''; 
 
      // Draw lines
      s.assignments.forEach(function (assignment) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', personNodes[assignment.person].x + nodeRadius);
        line.setAttribute('y1', personNodes[assignment.person].y);
        line.setAttribute('x2', jobNodes[assignment.job].x - nodeRadius);
        line.setAttribute('y2', jobNodes[assignment.job].y);
        line.setAttribute('stroke', 'var(--algo-active)');
        line.setAttribute('stroke-width', '2'); // سلك أنحف وأكثر أناقة
        svgEl.appendChild(line);
      });
 
      // Draw nodes
      var nodeTextColor = '#fff'; 
      var nodeBgColor = 'var(--brand-500)'; 
 
      personNodes.forEach(function (node) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', nodeRadius);
        circle.setAttribute('fill', nodeBgColor);
        svgEl.appendChild(circle);
 
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 4); 
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', nodeTextColor);
        text.setAttribute('font-size', '11px'); // خط العقد أصغر ليتناسب مع العقدة
        text.setAttribute('font-weight', '700');
        text.textContent = node.label;
        svgEl.appendChild(text);
      });
 
      jobNodes.forEach(function (node) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', nodeRadius);
        circle.setAttribute('fill', nodeBgColor);
        svgEl.appendChild(circle);
 
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', nodeTextColor);
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', '700');
        text.textContent = node.label;
        svgEl.appendChild(text);
      });
 
      optimalFoundEl.style.display = 'none';
      if (s.isOptimal) {
        optimalFoundEl.style.display = 'block';
        optimalFoundEl.innerHTML = _AL.exp('New optimal solution found! Cost: ', 'تم العثور على حل أمثل جديد! التكلفة: ') + s.minCostSoFar;
      } else if (cur === steps.length - 1) {
        optimalFoundEl.style.display = 'block';
        optimalFoundEl.innerHTML = _AL.exp('Optimal solution: ', 'الحل الأمثل: ') + s.minCostSoFar;
      }
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
    container.querySelector('.algo-speed input').addEventListener('input', function () {
      if (playing) { clearInterval(interval); interval = setInterval(function () { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
    });
 
    window._algoRerenders[7] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[8] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(8) +
      _AL.toolbar(8) +
      '<div class="algo-explanation" id="w8-exp"></div>' +
      '<div style="display:flex; justify-content:space-around; align-items:flex-start; margin-top:15px;">' +
      '<div class="algo-canvas" id="w8-graph-canvas" style="width:60%; height:500px; border:1px solid var(--algo-border); border-radius:8px; background:var(--algo-canvas-bg);"></div>' +
      '<div id="w8-stack-viz" style="width:35%; height:500px; border:1px solid var(--algo-border); border-radius:8px; padding:10px; background:var(--algo-canvas-bg); display:flex; flex-direction:column; align-items:center;">' +
      '<h5 style="margin-top:0; color:var(--algo-text);" data-algo-text="w8-stack-title">Stack</h5>' +
      '<div id="w8-stack-items" style="display:flex; flex-direction:column-reverse; gap:5px; width:80%; flex-grow:1;"></div>' +
      '</div>' +
      '</div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:var(--brand-500);margin-right:4px;"></span><span data-algo-text="w8-unvisited"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:var(--algo-sorted);margin-right:4px;"></span><span data-algo-text="w8-visited"></span></span>' +
      '<span><span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:var(--algo-active);margin-right:4px;"></span><span data-algo-text="w8-current"></span></span>' +
      '<span><svg width="20" height="12" style="vertical-align:middle;margin-right:4px;"><line x1="0" y1="6" x2="20" y2="6" stroke="var(--algo-active)" stroke-width="2"/></svg><span data-algo-text="w8-tree-edge"></span></span>' +
      '<span><svg width="20" height="12" style="vertical-align:middle;margin-right:4px;"><line x1="0" y1="6" x2="20" y2="6" stroke="var(--algo-compare)" stroke-width="2" stroke-dasharray="4 2"/></svg><span data-algo-text="w8-back-edge"></span></span>' +
      '<span><svg width="20" height="12" style="vertical-align:middle;margin-right:4px;"><line x1="0" y1="6" x2="20" y2="6" stroke="var(--algo-swap)" stroke-width="2"/></svg><span data-algo-text="w8-exploring-edge"></span></span>' +
      '</div>' +
      '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w8-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var graphCanvas = container.querySelector('#w8-graph-canvas');
    var stackItemsEl = container.querySelector('#w8-stack-items');
  
    var steps = [], cur = 0, playing = false, interval = null;
  
    var nodes = [
      { id: 0, x: 100, y: 50, label: '0' },
      { id: 1, x: 200, y: 150, label: '1' },
      { id: 2, x: 0, y: 150, label: '2' },
      { id: 3, x: 300, y: 250, label: '3' },
      { id: 4, x: 100, y: 250, label: '4' },
      { id: 5, x: 200, y: 350, label: '5' },
      { id: 6, x: 0, y: 350, label: '6' },
      { id: 7, x: 100, y: 450, label: '7' }
    ];
  
    var adj = {
      0: [1, 2],
      1: [3],
      2: [4],
      3: [5],
      4: [6],
      5: [1], // Back edge to 1
      6: [7],
      7: [2]  // Back edge to 2
    };
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w8-stack-title"]').textContent = _AL.lang() === 'ar' ? 'المكدس' : 'Stack';
      container.querySelector('[data-algo-text="w8-unvisited"]').textContent = _AL.lang() === 'ar' ? 'غير مزور' : 'Unvisited';
      container.querySelector('[data-algo-text="w8-visited"]').textContent = _AL.lang() === 'ar' ? 'مزور' : 'Visited';
      container.querySelector('[data-algo-text="w8-current"]').textContent = _AL.lang() === 'ar' ? 'الحالي' : 'Current';
      container.querySelector('[data-algo-text="w8-tree-edge"]').textContent = _AL.lang() === 'ar' ? 'حافة شجرة' : 'Tree Edge';
      container.querySelector('[data-algo-text="w8-back-edge"]').textContent = _AL.lang() === 'ar' ? 'حافة خلفية' : 'Back Edge';
      container.querySelector('[data-algo-text="w8-exploring-edge"]').textContent = _AL.lang() === 'ar' ? 'استكشاف حافة' : 'Exploring Edge';
    }
  
    function generateSteps() {
      steps = [];
      var N = nodes.length;
      var visited = new Array(N).fill(false);
      var discovery = new Array(N).fill(-1);
      var finish = new Array(N).fill(-1);
      var parent = new Array(N).fill(-1);
      var time = 0;
      var currentStack = [];
      var treeEdges = [];
      var backEdges = [];
  
      function addStep(en, ar, current_node_id = null, exploring_edge = null) {
        steps.push({
          visited: visited.slice(),
          discovery: discovery.slice(),
          finish: finish.slice(),
          stack: currentStack.slice(),
          treeEdges: treeEdges.map(e => ({ u: e.u, v: e.v })),
          backEdges: backEdges.map(e => ({ u: e.u, v: e.v })),
          current_node: current_node_id,
          exploring_edge: exploring_edge,
          en: en,
          ar: ar
        });
      }
  
      addStep('Initial state. All nodes unvisited.', 'الحالة الأولية. جميع العقد غير مزورة.');
  
      function dfs(u) {
        visited[u] = true;
        discovery[u] = time++;
        currentStack.push(u);
        addStep(
          'Visit node ' + u + '. Push to stack. Discovery time: ' + discovery[u],
          'زيارة العقدة ' + u + '. دفعها إلى المكدس. وقت الاكتشاف: ' + discovery[u],
          u
        );
  
        var neighbors = adj[u] || [];
        for (var i = 0; i < neighbors.length; i++) {
          var v = neighbors[i];
          addStep(
            'Exploring edge (' + u + ' -> ' + v + ').',
            'استكشاف الحافة (' + u + ' -> ' + v + ').',
            u,
            { u: u, v: v }
          );
  
          if (!visited[v]) {
            parent[v] = u;
            treeEdges.push({ u: u, v: v });
            addStep(
              'Node ' + v + ' is unvisited. Add (' + u + ' -> ' + v + ') as a tree edge.',
              'العقدة ' + v + ' غير مزورة. إضافة (' + u + ' -> ' + v + ') كحافة شجرة.',
              u,
              { u: u, v: v }
            );
            dfs(v);
            addStep(
              'Returned from DFS on ' + v + '. Continue exploring neighbors of ' + u + '.',
              'العودة من DFS على ' + v + '. متابعة استكشاف جيران ' + u + '.',
              u
            );
          } else if (finish[v] === -1 && v !== parent[u]) { // v is visited, but not yet finished, and not parent
            backEdges.push({ u: u, v: v });
            addStep(
              'Node ' + v + ' is visited and still in stack (discovery[' + v + ']=' + discovery[v] + ' < discovery[' + u + ']=' + discovery[u] + '). Add (' + u + ' -> ' + v + ') as a back edge (cycle detected).',
              'العقدة ' + v + ' مزورة وما زالت في المكدس (وقت الاكتشاف [' + v + ']=' + discovery[v] + ' < وقت الاكتشاف [' + u + ']=' + discovery[u] + '). إضافة (' + u + ' -> ' + v + ') كحافة خلفية (تم اكتشاف دورة).',
              u,
              { u: u, v: v }
            );
          } else {
            addStep(
              'Node ' + v + ' is visited and finished (discovery[' + v + ']=' + discovery[v] + ' < discovery[' + u + ']=' + discovery[u] + ', finish[' + v + ']=' + finish[v] + '). This is a forward or cross edge, ignored for DFS tree.',
              'العقدة ' + v + ' مزورة ومنتهية (وقت الاكتشاف [' + v + ']=' + discovery[v] + ' < وقت الاكتشاف [' + u + ']=' + discovery[u] + ', وقت الانتهاء [' + v + ']=' + finish[v] + '). هذه حافة أمامية أو متقاطعة، تم تجاهلها لشجرة DFS.',
              u,
              { u: u, v: v }
            );
          }
        }
  
        finish[u] = time++;
        currentStack.pop();
        addStep(
          'Finished exploring node ' + u + '. Pop from stack. Finish time: ' + finish[u],
          'انتهى استكشاف العقدة ' + u + '. إخراجها من المكدس. وقت الانتهاء: ' + finish[u],
          null // No current node when popping
        );
      }
  
      // Iterate over all nodes to handle disconnected components
      for (var i = 0; i < N; i++) {
        if (!visited[i]) {
          addStep(
            'Starting DFS from unvisited node ' + i + '.',
            'بدء البحث العميق أولاً من العقدة غير المزورة ' + i + '.',
            i
          );
          dfs(i);
        }
      }
  
      addStep('DFS complete.', 'اكتمل البحث العميق أولاً.');
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Render Graph
      graphCanvas.innerHTML = ''; // Clear previous drawing
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '-50 -50 450 600'); // Adjust viewBox to fit nodes and labels
  
      // Arrowhead definition
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      marker.innerHTML = '<polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-swap)" />';
      defs.appendChild(marker);
      svg.appendChild(defs);
  
      // Draw default edges (background, dashed)
      for (var u in adj) {
        adj[u].forEach(function (v) {
          var nodeU = nodes.find(n => n.id == u);
          var nodeV = nodes.find(n => n.id == v);
          if (!nodeU || !nodeV) return;
  
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', nodeU.x);
          line.setAttribute('y1', nodeU.y);
          line.setAttribute('x2', nodeV.x);
          line.setAttribute('y2', nodeV.y);
          line.setAttribute('stroke', 'var(--algo-border)');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('stroke-dasharray', '2 2');
          svg.appendChild(line);
        });
      }
  
      // Tree edges
      s.treeEdges.forEach(function (edge) {
        var nodeU = nodes.find(n => n.id == edge.u);
        var nodeV = nodes.find(n => n.id == edge.v);
        if (!nodeU || !nodeV) return;
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', nodeU.x);
        line.setAttribute('y1', nodeU.y);
        line.setAttribute('x2', nodeV.x);
        line.setAttribute('y2', nodeV.y);
        line.setAttribute('stroke', 'var(--algo-active)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
      });
  
      // Back edges
      s.backEdges.forEach(function (edge) {
        var nodeU = nodes.find(n => n.id == edge.u);
        var nodeV = nodes.find(n => n.id == edge.v);
        if (!nodeU || !nodeV) return;
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', nodeU.x);
        line.setAttribute('y1', nodeU.y);
        line.setAttribute('x2', nodeV.x);
        line.setAttribute('y2', nodeV.y);
        line.setAttribute('stroke', 'var(--algo-compare)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5 5');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
      });
  
      // Exploring edge (drawn last to be on top)
      if (s.exploring_edge) {
        var nodeU = nodes.find(n => n.id == s.exploring_edge.u);
        var nodeV = nodes.find(n => n.id == s.exploring_edge.v);
        if (nodeU && nodeV) {
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', nodeU.x);
          line.setAttribute('y1', nodeU.y);
          line.setAttribute('x2', nodeV.x);
          line.setAttribute('y2', nodeV.y);
          line.setAttribute('stroke', 'var(--algo-swap)');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          svg.appendChild(line);
        }
      }
  
      // Draw nodes
      nodes.forEach(function (node) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', '15');
        circle.setAttribute('stroke', 'var(--algo-border)');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('fill', 'var(--brand-500)'); // Default unvisited
  
        if (s.visited[node.id]) {
          circle.setAttribute('fill', 'var(--algo-sorted)'); // Visited
        }
        if (s.current_node === node.id) {
          circle.setAttribute('fill', 'var(--algo-active)'); // Current
        }
        svg.appendChild(circle);
  
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--algo-text)');
        text.setAttribute('font-size', '12');
        text.textContent = node.label;
        svg.appendChild(text);
  
        if (s.discovery[node.id] !== -1) {
          var discText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          discText.setAttribute('x', node.x + 20);
          discText.setAttribute('y', node.y - 5);
          discText.setAttribute('fill', 'var(--algo-muted)');
          discText.setAttribute('font-size', '10');
          discText.textContent = 'D:' + s.discovery[node.id];
          svg.appendChild(discText);
        }
        if (s.finish[node.id] !== -1) {
          var finText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          finText.setAttribute('x', node.x + 20);
          finText.setAttribute('y', node.y + 15);
          finText.setAttribute('fill', 'var(--algo-muted)');
          finText.setAttribute('font-size', '10');
          finText.textContent = 'F:' + s.finish[node.id];
          svg.appendChild(finText);
        }
      });
  
      graphCanvas.appendChild(svg);
  
      // Render Stack
      stackItemsEl.innerHTML = '';
      s.stack.forEach(function (nodeId, index) {
        var stackItem = document.createElement('div');
        stackItem.className = 'algo-node'; // Reusing algo-node for styling
        stackItem.style.width = '40px';
        stackItem.style.height = '40px';
        stackItem.style.lineHeight = '40px';
        stackItem.style.borderRadius = '5px';
        stackItem.style.textAlign = 'center';
        stackItem.style.background = 'var(--brand-500)';
        stackItem.style.color = 'var(--algo-text)';
        stackItem.style.border = '1px solid var(--algo-border)';
        stackItem.textContent = nodes[nodeId].label;
        if (index === s.stack.length - 1) { // Top of the stack
          stackItem.style.background = 'var(--algo-active)';
          stackItem.classList.add('current');
        }
        stackItemsEl.appendChild(stackItem);
      });
    }
  
    function startPlay() {
      playing = true;
      btnPlay.textContent = _AL.t('pause');
      btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function () {
        if (cur < steps.length - 1) {
          cur++;
          render();
        } else {
          stopPlay();
        }
      }, getDelay());
    }
  
    function stopPlay() {
      playing = false;
      clearInterval(interval);
      interval = null;
      btnPlay.textContent = _AL.t('play');
      btnPlay.dataset.playing = '0';
    }
  
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function () {
      stopPlay();
      if (cur > 0) {
        cur--;
        render();
      }
    });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function () {
      stopPlay();
      if (cur < steps.length - 1) {
        cur++;
        render();
      }
    });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function () {
      playing ? stopPlay() : startPlay();
    });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function () {
      stopPlay();
      generateSteps();
      cur = 0;
      render();
    });
    _algoBindSpeed(container, getDelay, startPlay); // Use helper for speed binding
  
    window._algoRerenders[8] = render;
    generateSteps();
    render();
};

window._algoTitles = window._algoTitles || {};
window._algoTitles[9] = { en: 'Breadth-First Search (BFS)', ar: 'البحث في العرض أولاً (BFS)' };

window.AlgoWidgets[9] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(9) +
      _AL.toolbar(9) +
      '<div class="algo-explanation" id="w9-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 16:9 مع شبكة (Grid) لتجاوب أفضل بين الرسم والطابور
      '<div style="display: grid; grid-template-columns: minmax(0, 1fr); gap: 15px; width: 100%; max-width: 800px; margin: 0 auto;">' +
        '<div class="algo-canvas" id="w9-canvas" style="position:relative; width:100%; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
          '<svg id="w9-svg" width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
        '</div>' +
        
        '<div class="algo-queue-container" style="text-align: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--bg-elevated); padding: 10px;">' +
          '<h5 data-algo-text="w9-queue-label" style="margin: 0 0 10px 0; color: var(--text-primary); font-family: \'Cairo\', sans-serif; font-weight: 800; font-size: 1rem;"></h5>' +
          '<div id="w9-queue" style="display: flex; justify-content: center; align-items: center; gap: 8px; min-height: 44px; flex-wrap: wrap;"></div>' +
        '</div>' +
      '</div>' +
      
      '<div class="algo-legend" style="display:flex; justify-content:center; flex-wrap:wrap; gap:15px; margin-top:15px; font-size:0.85rem; color: var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:2px solid var(--text-muted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w9-unvisited"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w9-in-queue"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w9-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w9-visited"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w9-exp');
    var svgEl   = container.querySelector('#w9-svg');
    var queueEl = container.querySelector('#w9-queue');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // بنية الجراف مع إحداثيات متناسقة لـ viewBox="0 0 600 350"
    const RADIUS = 22;
    var graph = {
      'A': ['B', 'C'],
      'B': ['A', 'D', 'G'],
      'C': ['A', 'E', 'G'],
      'D': ['B', 'F'],
      'E': ['C', 'F'],
      'F': ['D', 'E'],
      'G': ['B', 'C']
    };

    var nodePositions = {
      'A': { x: 300, y: 50 },
      'B': { x: 150, y: 150 },
      'C': { x: 450, y: 150 },
      'D': { x: 80,  y: 280 },
      'E': { x: 520, y: 280 },
      'F': { x: 300, y: 280 },
      'G': { x: 300, y: 170 } // توسيط G بين B و C
    };

    var allEdges = [];
    // بناء قائمة حواف فريدة
    let seenEdges = new Set();
    Object.keys(graph).forEach(u => {
      graph[u].forEach(v => {
        let edgeId = [u, v].sort().join('-');
        if (!seenEdges.has(edgeId)) {
          allEdges.push({ u: u, v: v, id: edgeId });
          seenEdges.add(edgeId);
        }
      });
    });

    var uiNodes = {};
    var uiEdges = {};

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w9-queue-label"]').textContent = _AL.exp('Queue (FIFO)', 'الطابور (Queue)');
      container.querySelector('[data-algo-text="w9-unvisited"]').textContent   = _AL.exp('Unvisited', 'غير مستكشفة');
      container.querySelector('[data-algo-text="w9-in-queue"]').textContent    = _AL.exp('In Queue', 'في الطابور');
      container.querySelector('[data-algo-text="w9-current"]').textContent     = _AL.exp('Current Node', 'العقدة الحالية');
      container.querySelector('[data-algo-text="w9-visited"]').textContent     = _AL.exp('Visited (Done)', 'مكتملة (تمت زيارتها)');
    }

    function generateSteps() {
      steps = [];
      
      // التفاعلية: اختيار عقدة بداية عشوائية
      let nodesArray = Object.keys(graph);
      let startNode = nodesArray[Math.floor(Math.random() * nodesArray.length)];

      var visited = {};
      var distances = {};
      var q = [];
      
      Object.keys(graph).forEach(node => {
        visited[node] = false;
        distances[node] = Infinity;
      });

      steps.push({
        visited: { ...visited }, queue: [...q], current: null, distances: { ...distances }, highlightedEdge: null,
        en: `<strong>BFS Algorithm:</strong> We will explore the graph level by level starting from random node <strong>${startNode}</strong>.`,
        ar: `<strong>خوارزمية BFS:</strong> سنستكشف الرسم البياني مستوى بمستوى، بدءاً من العقدة العشوائية <strong>${startNode}</strong>.`
      });

      q.push(startNode);
      visited[startNode] = true;
      distances[startNode] = 0;
      
      steps.push({
        visited: { ...visited }, queue: [...q], current: null, distances: { ...distances }, highlightedEdge: null,
        en: `Enqueue start node <strong>${startNode}</strong>. Mark it as visited and set its distance to 0.`,
        ar: `أضف عقدة البداية <strong>${startNode}</strong> إلى الطابور. ضع علامة عليها كمزورة واضبط المسافة إلى 0.`
      });

      while (q.length > 0) {
        var u = q.shift();
        
        steps.push({
          visited: { ...visited }, queue: [...q], current: u, distances: { ...distances }, highlightedEdge: null,
          en: `Dequeue node <strong>${u}</strong>. Now we will process all its unvisited neighbors.`,
          ar: `سحب العقدة <strong>${u}</strong> من الطابور. الآن سنعالج جميع جيرانها غير المستكشفين.`
        });

        // ترتيب الجيران ليكون العرض منطقياً
        var neighbors = graph[u].slice().sort();
        for (var i = 0; i < neighbors.length; i++) {
          var v = neighbors[i];
          var edgeId = [u, v].sort().join('-');

          steps.push({
            visited: { ...visited }, queue: [...q], current: u, distances: { ...distances }, highlightedEdge: edgeId,
            en: `Checking neighbor <strong>${v}</strong> of node <strong>${u}</strong>.`,
            ar: `فحص الجار <strong>${v}</strong> للعقدة <strong>${u}</strong>.`
          });

          if (!visited[v]) {
            visited[v] = true;
            distances[v] = distances[u] + 1;
            q.push(v);
            
            steps.push({
              visited: { ...visited }, queue: [...q], current: u, distances: { ...distances }, highlightedEdge: edgeId,
              en: `Neighbor <strong>${v}</strong> is unvisited. Mark it as visited, distance = ${distances[v]}, and add to queue.`,
              ar: `الجار <strong>${v}</strong> لم تتم زيارته بعد. ضع علامة، المسافة = ${distances[v]}، وأضفه للطابور.`
            });
          } else {
            steps.push({
              visited: { ...visited }, queue: [...q], current: u, distances: { ...distances }, highlightedEdge: edgeId,
              en: `Neighbor <strong>${v}</strong> is already visited or in the queue. Skipping.`,
              ar: `الجار <strong>${v}</strong> تمت زيارته أو موجود في الطابور مسبقاً. تخطي.`
            });
          }
        }
        
        // بعد الانتهاء من جميع الجيران، العقدة تعتبر "منتهية" تماماً
        // نستخدم حالة خاصة (أو نعتمد على كونها ليست في الطابور وليست الحالية ومزورة)
      }

      steps.push({
        visited: { ...visited }, queue: [], current: null, distances: { ...distances }, highlightedEdge: null,
        en: `Queue is empty. BFS traversal is <strong>complete</strong>! All reachable nodes have been visited.`,
        ar: `الطابور فارغ. <strong>اكتمل</strong> الاستكشاف! تمت زيارة جميع العقد التي يمكن الوصول إليها.`
      });
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      return el;
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      uiNodes = {};
      uiEdges = {};

      let edgesG = makeSVG('g', {});
      let nodesG = makeSVG('g', {});

      // بناء الخطوط
      allEdges.forEach(e => {
        let p1 = nodePositions[e.u];
        let p2 = nodePositions[e.v];
        
        // الحسابات المثلثية لتلامس الدائرة (حتى لو كبرت)
        let dx = p2.x - p1.x; let dy = p2.y - p1.y; let dist = Math.hypot(dx, dy);
        let x1 = p1.x + (dx/dist) * RADIUS; let y1 = p1.y + (dy/dist) * RADIUS;
        let x2 = p2.x - (dx/dist) * RADIUS; let y2 = p2.y - (dy/dist) * RADIUS;

        let line = makeSVG('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--text-muted)', 'stroke-width': 2 });
        edgesG.appendChild(line);
        uiEdges[e.id] = line;
      });

      // بناء العقد
      Object.keys(nodePositions).forEach(id => {
        let p = nodePositions[id];
        let g = makeSVG('g', { 'transform-origin': `${p.x}px ${p.y}px` });

        let circ = makeSVG('circle', { cx: p.x, cy: p.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '18px', 'font-weight': '800' });
        txt.textContent = id;

        // نص المسافة
        let distTxt = makeSVG('text', { x: p.x, y: p.y + RADIUS + 15, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': '700', opacity: 0 });

        g.appendChild(circ);
        g.appendChild(txt);
        g.appendChild(distTxt);
        nodesG.appendChild(g);

        uiNodes[id] = { g: g, circ: circ, txt: txt, distTxt: distTxt };
      });

      svgEl.appendChild(edgesG);
      svgEl.appendChild(nodesG);
      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // 1. تحديث الخطوط
      Object.keys(uiEdges).forEach(edgeId => {
        let line = uiEdges[edgeId];
        let isHl = s.highlightedEdge === edgeId;
        
        let color = isHl ? 'var(--algo-active)' : 'var(--text-muted)';
        let sw = isHl ? '4' : '2';
        let dash = isHl ? '6,4' : '0';
        let op = isHl ? '1' : '0.3'; // التركيز على الخط الحالي
        if(s.highlightedEdge === null && s.current === null) op = '1'; // النهاية

        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', sw);
        line.setAttribute('stroke-dasharray', dash);
        line.style.opacity = op;
        
        // إظهار الخط في الأمام عند التحديد
        if(isHl) line.parentNode.appendChild(line);
      });

      // 2. تحديث العقد
      Object.keys(uiNodes).forEach(id => {
        let ui = uiNodes[id];
        
        let isCur = s.current === id;
        let inQ = s.queue.includes(id);
        let isVis = s.visited[id]; // visited in BFS means "discovered"
        
        // If it's visited, NOT in queue, and NOT current -> it is DONE
        let isDone = isVis && !inQ && !isCur;

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--text-muted)';
        let txtFill = 'var(--text-primary)';
        let scale = 'scale(1)';

        if (isCur) {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.2)';
          // جلب العقدة للأمام
          ui.g.parentNode.appendChild(ui.g);
        } else if (inQ) {
          fill = 'var(--algo-compare)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.1)';
        } else if (isDone) {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtFill = '#ffffff';
        }

        ui.circ.setAttribute('fill', fill);
        ui.circ.setAttribute('stroke', stroke);
        ui.circ.setAttribute('stroke-width', isVis ? '2' : '2');
        ui.txt.setAttribute('fill', txtFill);
        ui.g.style.transform = scale;

        // تحديث المسافة
        let d = s.distances[id];
        if (d !== Infinity) {
          ui.distTxt.textContent = `d=${d}`;
          ui.distTxt.style.opacity = '1';
          ui.distTxt.setAttribute('fill', (isCur || inQ || isDone) ? 'var(--text-primary)' : 'var(--text-muted)');
        } else {
          ui.distTxt.style.opacity = '0';
        }
      });

      // 3. تحديث الطابور (Queue) برمجياً دون تدمير حاويته
      queueEl.innerHTML = '';
      if (s.queue.length === 0) {
        queueEl.innerHTML = `<span style="color:var(--text-muted); font-size:14px; font-family:'Cairo', sans-serif;">${_AL.exp('Empty', 'فارغ')}</span>`;
      } else {
        s.queue.forEach(node => {
          let box = document.createElement('div');
          box.style.display = 'flex';
          box.style.alignItems = 'center';
          box.style.justifyContent = 'center';
          box.style.width = '36px';
          box.style.height = '36px';
          box.style.borderRadius = '6px';
          box.style.background = 'var(--algo-compare)';
          box.style.color = '#ffffff';
          box.style.fontFamily = "'JetBrains Mono', monospace";
          box.style.fontWeight = 'bold';
          box.style.fontSize = '16px';
          box.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          box.textContent = node;
          queueEl.appendChild(box);
        });
      }
    }

    function startPlay() {
      playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function() {
        if (cur < steps.length - 1) { cur++; render(); } else stopPlay();
      }, getDelay());
    }

    function stopPlay() {
      playing = false; clearInterval(interval); interval = null;
      btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
    }

    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() { stopPlay(); if (cur > 0) { cur--; render(); } });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() { playing ? stopPlay() : startPlay(); });
    
    // إعادة التوليد من عقدة عشوائية
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { 
      stopPlay(); 
      isInitialized = false;
      generateSteps(); 
      cur = 0; 
      render(); 
    });
    
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
      }
    });

    window._algoRerenders[9] = render;
    generateSteps();
    render();
};

(function(){
  function init(){
    Object.keys(window.AlgoWidgets).forEach(function(id){
      var el = document.getElementById('algo-widget-' + id);
      if (el && !el.dataset.algoLoaded) {
        try { window.AlgoWidgets[id](el); el.dataset.algoLoaded = 'true'; }
        catch(e) { console.error('AlgoWidget #' + id + ' error:', e); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();