// M09_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T09:36:17
// Diagrams: 2/2

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
window._algoTitles[1] = { en: 'Open Hashing (Separate Chaining)', ar: 'التهشير المفتوح (السلسلة المنفصلة)' };
window._algoTitles[2] = { en: 'B-Trees and Properties', ar: 'أشجار B وخصائصها' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
        _AL.titleHTML(1) +
        _AL.toolbar(1) +
        '<div class="algo-explanation" id="w1-exp"></div>' +
        '<div class="algo-canvas" id="w1-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio:2/1;"></div>' +
        '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-canvas-bg);border:1px solid var(--text-muted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-empty"></span></span>' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-active"></span></span>' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-inserted"></span></span>' +
        '</div>' +
      '</div>';
    
      var btnPlay = container.querySelector('[data-algo-btn="play"]');
      var expEl   = container.querySelector('#w1-exp');
      var canvasEl= container.querySelector('#w1-canvas');
      var counter = container.querySelector('[data-algo-counter]');
      var steps = [], cur = 0, playing = false, interval = null;
    
      function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
    
      function updateLabels() {
        container.querySelector('[data-algo-text="w1-empty"]').textContent = _AL.lang() === 'ar' ? 'فارغ / غير نشط' : 'Empty / Inactive';
        container.querySelector('[data-algo-text="w1-active"]').textContent = _AL.lang() === 'ar' ? 'مقارنة / اجتياز' : 'Comparing / Traversing';
        container.querySelector('[data-algo-text="w1-inserted"]').textContent = _AL.lang() === 'ar' ? 'تم الإدراج' : 'Inserted';
      }
    
      function cloneTable(t) {
        return t.map(function(arr) { return arr.slice(); });
      }
    
      function generateSteps() {
        steps = [];
        var words = [
          { w: 'A', i: 1 },
          { w: 'AND', i: 6 },
          { w: 'MONEY', i: 7 },
          { w: 'FOOL', i: 9 },
          { w: 'HIS', i: 11 },
          { w: 'ARE', i: 11 },
          { w: 'SOON', i: 11 },
          { w: 'PARTED', i: 12 }
        ];
        var table = [];
        for (var i = 0; i < 13; i++) table.push([]);
    
        steps.push({
          table: cloneTable(table),
          activeWord: null,
          activeIdx: -1,
          traverseIdx: -1,
          en: 'Initial empty hash table with 13 slots.',
          ar: 'جدول تهشير فارغ مبدئياً بـ 13 خانة.'
        });
    
        words.forEach(function(item) {
          var w = item.w;
          var idx = item.i;
    
          steps.push({
            table: cloneTable(table),
            activeWord: w,
            activeIdx: idx,
            traverseIdx: -1,
            en: 'Hashing word "<strong>' + w + '</strong>". The hash function maps it to index <strong>' + idx + '</strong>.',
            ar: 'تهشير الكلمة "<strong>' + w + '</strong>". دالة التهشير توجهها إلى الفهرس <strong>' + idx + '</strong>.'
          });
    
          if (table[idx].length === 0) {
            table[idx].push(w);
            steps.push({
              table: cloneTable(table),
              activeWord: w,
              activeIdx: idx,
              traverseIdx: 0,
              en: 'Index ' + idx + ' is empty. Inserting "<strong>' + w + '</strong>" directly as the head of the list.',
              ar: 'الفهرس ' + idx + ' فارغ. إدراج "<strong>' + w + '</strong>" مباشرة كرأس للقائمة.'
            });
          } else {
            steps.push({
              table: cloneTable(table),
              activeWord: w,
              activeIdx: idx,
              traverseIdx: 0,
              en: 'Collision at index ' + idx + '! Traversing the existing linked list.',
              ar: 'تصادم في الفهرس ' + idx + '! اجتياز القائمة المرتبطة الموجودة.'
            });
    
            for (var k = 0; k < table[idx].length; k++) {
              steps.push({
                table: cloneTable(table),
                activeWord: w,
                activeIdx: idx,
                traverseIdx: k,
                en: 'Checking node "<strong>' + table[idx][k] + '</strong>". Moving to the next pointer.',
                ar: 'التحقق من العقدة "<strong>' + table[idx][k] + '</strong>". الانتقال للمؤشر التالي.'
              });
            }
    
            table[idx].push(w);
            steps.push({
              table: cloneTable(table),
              activeWord: w,
              activeIdx: idx,
              traverseIdx: table[idx].length - 1,
              en: 'Reached the end. Appending "<strong>' + w + '</strong>" to the linked list at index ' + idx + '.',
              ar: 'الوصول للنهاية. إضافة "<strong>' + w + '</strong>" إلى القائمة المرتبطة في الفهرس ' + idx + '.'
            });
          }
        });
    
        steps.push({
          table: cloneTable(table),
          activeWord: null,
          activeIdx: -1,
          traverseIdx: -1,
          en: 'All words inserted successfully using Separate Chaining.',
          ar: 'تم إدراج جميع الكلمات بنجاح باستخدام السلسلة المنفصلة.'
        });
      }
    
      function render() {
        updateLabels();
        var s = steps[cur];
        counter.textContent = _AL.stepLabel(cur, steps.length - 1);
        expEl.innerHTML = _AL.exp(s.en, s.ar);
    
        var svg = '<svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="display:block;">';
        svg += '<defs><marker id="w1-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/></marker></defs>';
    
        var currentWordText = s.activeWord ? (_AL.lang() === 'ar' ? 'الكلمة الحالية: ' : 'Current Word: ') + s.activeWord : '';
        svg += '<text x="400" y="20" text-anchor="middle" dominant-baseline="middle" dy=".1em" fill="var(--algo-text)" font-size="16px" font-weight="bold" font-family="monospace">' + currentWordText + '</text>';
    
        for (var i = 0; i < 13; i++) {
          var bx = 36 + i * 56;
          var by = 50;
          var isTarget = (s.activeIdx === i);
          var fill = isTarget ? 'var(--algo-compare)' : 'var(--algo-canvas-bg)';
          var stroke = isTarget ? 'var(--algo-compare)' : 'var(--text-muted)';
          var textFill = isTarget ? '#ffffff' : 'var(--algo-text)';
    
          svg += '<text x="' + (bx + 26) + '" y="' + (by - 12) + '" text-anchor="middle" dominant-baseline="middle" dy=".1em" fill="var(--algo-muted)" font-size="12px" font-family="monospace">' + i + '</text>';
          svg += '<rect x="' + bx + '" y="' + by + '" width="52" height="30" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" rx="4" style="transition:fill 0.3s ease, stroke 0.3s ease;"/>';
    
          var list = s.table[i];
          for (var k = 0; k < list.length; k++) {
            var nx = bx + 26;
            var ny = by + 60 + k * 50;
            var isTraversing = (s.activeIdx === i && s.traverseIdx === k);
            var isNew = (s.activeIdx === i && s.traverseIdx === k && k === list.length - 1 && s.activeWord === list[k]);
            
            var nFill = isNew ? 'var(--brand-500)' : (isTraversing ? 'var(--algo-compare)' : 'var(--algo-canvas-bg)');
            var nStroke = isNew ? 'var(--brand-500)' : (isTraversing ? 'var(--algo-compare)' : 'var(--text-muted)');
            var nTextFill = (isNew || isTraversing) ? '#ffffff' : 'var(--algo-text)';
    
            var startY = (k === 0) ? (by + 30) : (ny - 50 + 15);
            var endY = ny - 15;
            svg += '<line x1="' + nx + '" y1="' + startY + '" x2="' + nx + '" y2="' + (endY - 3) + '" stroke="var(--text-muted)" stroke-width="2" marker-end="url(#w1-arrow)" style="transition:all 0.3s ease;"/>';
    
            svg += '<rect x="' + (nx - 25) + '" y="' + (ny - 15) + '" width="50" height="30" fill="' + nFill + '" stroke="' + nStroke + '" stroke-width="2" rx="15" style="transition:fill 0.3s ease, stroke 0.3s ease;"/>';
            svg += '<text x="' + nx + '" y="' + ny + '" text-anchor="middle" dominant-baseline="middle" dy=".1em" fill="' + nTextFill + '" font-size="10px" font-family="monospace" style="transition:fill 0.3s ease;">' + list[k] + '</text>';
          }
        }
    
        svg += '</svg>';
        canvasEl.innerHTML = svg;
      }
    
      function startPlay() {
        playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
        if (cur >= steps.length - 1) cur = 0;
        interval = setInterval(function() {
          if (cur < steps.length - 1) { cur++; render(); }
          else stopPlay();
        }, getDelay());
      }
    
      function stopPlay() {
        playing = false; clearInterval(interval); interval = null;
        btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
      }
    
      container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() { stopPlay(); if (cur > 0) { cur--; render(); } });
      container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
      container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() { playing ? stopPlay() : startPlay(); });
      container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); generateSteps(); cur = 0; render(); });
      
      _algoBindSpeed(container, getDelay, function() {
        clearInterval(interval);
        interval = setInterval(function() {
          if (cur < steps.length - 1) { cur++; render(); }
          else stopPlay();
        }, getDelay());
      });
    
      window._algoRerenders[1] = render;
      generateSteps();
      render();
};

window.AlgoWidgets[2] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 2:1 
      '<div class="algo-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio:2/1; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; justify-content: center; align-items: center; overflow:visible;">' +
        '<svg id="w2-svg" width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.8rem; color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-leg-keys"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-leg-ptrs"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-leg-target"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w2-exp');
    var svgEl   = container.querySelector('#w2-svg');
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // عناصر الـ SVG ليتم تحديثها برمجياً (للحفاظ على الأنيميشن)
    var keyRects = [], keyTexts = [];
    var ptrRects = [], ptrDots = [], ptrLines = [];
    var treeGroups = [], treePolys = [], treeLabels = [], treeConds = [];
    var targetGroup, targetText;
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w2-leg-keys"]').textContent = _AL.exp('Keys (Sorted)', 'مفاتيح (مرتبة)');
      container.querySelector('[data-algo-text="w2-leg-ptrs"]').textContent = _AL.exp('Pointers', 'مؤشرات فرعية');
      container.querySelector('[data-algo-text="w2-leg-target"]').textContent = _AL.exp('Search Target', 'هدف البحث');
    }
 
    // متغيرات القيم الديناميكية
    var dynamicKeys = [];
    var searchTarget = 0;

    function generateSteps() {
      // توليد أرقام تفاعلية وعشوائية في كل مرة يتم فيها عمل Reset
      let startVal = Math.floor(Math.random() * 20) + 10;
      dynamicKeys = [
        startVal, 
        startVal + Math.floor(Math.random() * 15) + 10, 
        startVal + Math.floor(Math.random() * 30) + 30
      ];
      // توليد هدف بحث يقع بين المفتاحين الأول والثاني كمثال
      searchTarget = dynamicKeys[0] + Math.floor(Math.random() * (dynamicKeys[1] - dynamicKeys[0] - 1)) + 1;

      steps = [
        { keys: [], ptrs: [], trees: [], cmp: -1, target: null,
          en: 'A B-Tree node contains sorted keys and pointers to subtrees.',
          ar: 'تحتوي عقدة شجرة B على مفاتيح مرتبة ومؤشرات لأشجار فرعية.' },
        
        { keys: [0,1,2], ptrs: [], trees: [], cmp: -1, target: null,
          en: `Keys are strictly sorted in ascending order: ${dynamicKeys[0]} < ${dynamicKeys[1]} < ${dynamicKeys[2]}.`,
          ar: `المفاتيح مرتبة تصاعدياً بشكل صارم: <strong dir="ltr">${dynamicKeys[0]} < ${dynamicKeys[1]} < ${dynamicKeys[2]}</strong>.` },
        
        { keys: [], ptrs: [0,1,2,3], trees: [0,1,2,3], cmp: -1, target: null,
          en: 'Pointers link to child subtrees based on these key ranges.',
          ar: 'تربط المؤشرات الأشجار الفرعية بناءً على النطاقات التي تحددها المفاتيح.' },
        
        { keys: [0], ptrs: [0], trees: [0], cmp: -1, target: null,
          en: `Keys in subtree T0 are strictly less than ${dynamicKeys[0]}.`,
          ar: `جميع المفاتيح في الشجرة الفرعية T0 أصغر تماماً من ${dynamicKeys[0]}.` },
        
        { keys: [0,1], ptrs: [1], trees: [1], cmp: -1, target: null,
          en: `Keys in subtree T1 are between ${dynamicKeys[0]} and ${dynamicKeys[1]}.`,
          ar: `جميع المفاتيح في الشجرة الفرعية T1 تقع بين ${dynamicKeys[0]} و ${dynamicKeys[1]}.` },
        
        { keys: [1,2], ptrs: [2], trees: [2], cmp: -1, target: null,
          en: `Keys in subtree T2 are between ${dynamicKeys[1]} and ${dynamicKeys[2]}.`,
          ar: `جميع المفاتيح في الشجرة الفرعية T2 تقع بين ${dynamicKeys[1]} و ${dynamicKeys[2]}.` },
        
        { keys: [2], ptrs: [3], trees: [3], cmp: -1, target: null,
          en: `Keys in subtree T3 are strictly greater than ${dynamicKeys[2]}.`,
          ar: `جميع المفاتيح في الشجرة الفرعية T3 أكبر تماماً من ${dynamicKeys[2]}.` },
        
        { keys: [], ptrs: [], trees: [], cmp: -1, target: searchTarget,
          en: `Now, let's search for the key <strong>${searchTarget}</strong> in this node.`,
          ar: `الآن، دعنا نبحث عن المفتاح <strong>${searchTarget}</strong> داخل هذه العقدة.` },
        
        { keys: [0], ptrs: [], trees: [], cmp: 0, target: searchTarget,
          en: `Compare ${searchTarget} with ${dynamicKeys[0]}. Since ${searchTarget} > ${dynamicKeys[0]}, we move right.`,
          ar: `نقارن ${searchTarget} مع ${dynamicKeys[0]}. بما أن <strong dir="ltr">${searchTarget} > ${dynamicKeys[0]}</strong>، نتحرك يميناً.` },
        
        { keys: [1], ptrs: [], trees: [], cmp: 1, target: searchTarget,
          en: `Compare ${searchTarget} with ${dynamicKeys[1]}. Since ${searchTarget} < ${dynamicKeys[1]}, we stop here.`,
          ar: `نقارن ${searchTarget} مع ${dynamicKeys[1]}. بما أن <strong dir="ltr">${searchTarget} < ${dynamicKeys[1]}</strong>، نتوقف هنا.` },
        
        { keys: [], ptrs: [1], trees: [1], cmp: -1, target: searchTarget,
          en: `Follow pointer P1 to continue the search down in subtree T1.`,
          ar: `نتبع المؤشر P1 للنزول والاستمرار في البحث داخل الشجرة الفرعية T1.` }
      ];
    }
 
    function buildSVG() {
      var ns = 'http://www.w3.org/2000/svg';
      svgEl.innerHTML = '';
      keyRects = []; keyTexts = [];
      ptrRects = []; ptrDots = []; ptrLines = [];
      treeGroups = []; treePolys = []; treeLabels = []; treeConds = [];

      var defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = `
        <marker id="w2-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" /></marker>
        <marker id="w2-arr-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-swap)" /></marker>
      `;
      svgEl.appendChild(defs);
 
      // 1. بناء الأشجار والخطوط
      for (let i = 0; i < 4; i++) {
        let cx = 160 + (i * 160); // 160, 320, 480, 640
        
        // خط المؤشر
        let line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', cx); line.setAttribute('y1', 100);
        line.setAttribute('x2', cx); line.setAttribute('y2', 180);
        line.setAttribute('stroke', 'var(--text-muted)');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('marker-end', 'url(#w2-arr-muted)');
        line.style.transition = 'all 0.3s ease';
        svgEl.appendChild(line);
        ptrLines.push(line);

        // مجموعة الشجرة
        let g = document.createElementNS(ns, 'g');
        g.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
        
        let poly = document.createElementNS(ns, 'polygon');
        poly.setAttribute('points', `${cx},190 ${cx-50},290 ${cx+50},290`);
        poly.setAttribute('fill', 'var(--algo-canvas-bg)');
        poly.setAttribute('stroke', 'var(--text-muted)');
        poly.setAttribute('stroke-width', '2');
        poly.style.transition = 'all 0.3s ease';
        g.appendChild(poly);

        let tLabel = document.createElementNS(ns, 'text');
        tLabel.setAttribute('x', cx); tLabel.setAttribute('y', 230);
        tLabel.setAttribute('text-anchor', 'middle'); tLabel.setAttribute('dominant-baseline', 'middle');
        tLabel.setAttribute('fill', 'var(--algo-text)');
        tLabel.setAttribute('font-family', "'JetBrains Mono', monospace");
        tLabel.setAttribute('font-size', '18px'); tLabel.setAttribute('font-weight', '800');
        tLabel.textContent = `T${i}`;
        g.appendChild(tLabel);

        let tCond = document.createElementNS(ns, 'text');
        tCond.setAttribute('x', cx); tCond.setAttribute('y', 265);
        tCond.setAttribute('text-anchor', 'middle'); tCond.setAttribute('dominant-baseline', 'middle');
        tCond.setAttribute('fill', 'var(--text-secondary)');
        tCond.setAttribute('font-family', "'JetBrains Mono', monospace");
        tCond.setAttribute('font-size', '13px'); tCond.setAttribute('font-weight', '700');
        g.appendChild(tCond);

        svgEl.appendChild(g);
        treeGroups.push(g); treePolys.push(poly); treeLabels.push(tLabel); treeConds.push(tCond);
      }

      // 2. بناء المؤشرات (Pointers) والمفاتيح (Keys)
      for (let j = 0; j < 7; j++) {
        if (j % 2 === 0) { // المؤشرات
          let pIdx = j / 2;
          let pcx = 160 + (pIdx * 160);
          
          let rect = document.createElementNS(ns, 'rect');
          rect.setAttribute('x', pcx - 20); rect.setAttribute('y', 60);
          rect.setAttribute('width', 40); rect.setAttribute('height', 50);
          rect.setAttribute('rx', 4);
          rect.setAttribute('stroke', 'var(--text-muted)'); rect.setAttribute('stroke-width', '2');
          rect.setAttribute('fill', 'var(--bg-elevated)');
          rect.style.transition = 'all 0.3s ease';
          svgEl.appendChild(rect);
          ptrRects.push(rect);

          let dot = document.createElementNS(ns, 'circle');
          dot.setAttribute('cx', pcx); dot.setAttribute('cy', 85);
          dot.setAttribute('r', 6);
          dot.setAttribute('fill', 'var(--text-muted)');
          dot.style.transition = 'all 0.3s ease';
          svgEl.appendChild(dot);
          ptrDots.push(dot);

        } else { // المفاتيح
          let kIdx = Math.floor(j / 2);
          let kcx = 240 + (kIdx * 160);
          
          let rect = document.createElementNS(ns, 'rect');
          rect.setAttribute('x', kcx - 60); rect.setAttribute('y', 55);
          rect.setAttribute('width', 120); rect.setAttribute('height', 60);
          rect.setAttribute('rx', 6);
          rect.setAttribute('stroke', 'var(--border-color)'); rect.setAttribute('stroke-width', '2');
          rect.setAttribute('fill', 'var(--bg-elevated)');
          rect.style.transition = 'all 0.3s ease';
          svgEl.appendChild(rect);
          keyRects.push(rect);

          let text = document.createElementNS(ns, 'text');
          text.setAttribute('x', kcx); text.setAttribute('y', 85);
          text.setAttribute('dy', '.1em'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', 'var(--text-primary)');
          text.setAttribute('font-family', "'JetBrains Mono', monospace");
          text.setAttribute('font-size', '22px'); text.setAttribute('font-weight', '800');
          text.style.transition = 'all 0.3s ease';
          svgEl.appendChild(text);
          keyTexts.push(text);
        }
      }

      // 3. بناء صندوق الهدف المتحرك
      targetGroup = document.createElementNS(ns, 'g');
      targetGroup.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      targetGroup.style.opacity = '0';
      
      let tRect = document.createElementNS(ns, 'rect');
      tRect.setAttribute('x', 340); tRect.setAttribute('y', 5);
      tRect.setAttribute('width', 120); tRect.setAttribute('height', 36);
      tRect.setAttribute('rx', 6);
      tRect.setAttribute('fill', 'var(--algo-compare)');
      targetGroup.appendChild(tRect);

      targetText = document.createElementNS(ns, 'text');
      targetText.setAttribute('x', 400); targetText.setAttribute('y', 23);
      targetText.setAttribute('text-anchor', 'middle'); targetText.setAttribute('dominant-baseline', 'middle');
      targetText.setAttribute('fill', '#ffffff');
      targetText.setAttribute('font-family', "'Cairo', 'JetBrains Mono', sans-serif");
      targetText.setAttribute('font-size', '16px'); targetText.setAttribute('font-weight', '800');
      targetGroup.appendChild(targetText);

      svgEl.appendChild(targetGroup);
      isInitialized = true;
    }
 
    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      // تحديث شروط الأشجار الفرعية بناءً على الأرقام الديناميكية الجديدة
      var conds = [`< ${dynamicKeys[0]}`, `${dynamicKeys[0]}-${dynamicKeys[1]}`, `${dynamicKeys[1]}-${dynamicKeys[2]}`, `> ${dynamicKeys[2]}`];

      var anyTreeActive = s.trees.length > 0;

      // 1. تحديث الأشجار
      for (let i = 0; i < 4; i++) {
        let isActive = s.trees.includes(i);
        let opacity = (anyTreeActive && !isActive) ? '0.2' : '1';
        let fill = isActive ? 'var(--algo-active)' : 'var(--algo-canvas-bg)';
        let stroke = isActive ? '#ffffff' : 'var(--text-muted)';
        let textFill = isActive ? '#ffffff' : 'var(--algo-text)';
        let scale = isActive ? 'scale(1.05)' : 'scale(1)';
        let tx = 160 + (i * 160);

        treeGroups[i].style.opacity = opacity;
        treeGroups[i].style.transform = `${scale}`;
        treeGroups[i].style.transformOrigin = `${tx}px 240px`;
        treePolys[i].setAttribute('fill', fill);
        treePolys[i].setAttribute('stroke', stroke);
        treeLabels[i].setAttribute('fill', textFill);
        treeConds[i].textContent = conds[i];
        treeConds[i].setAttribute('fill', isActive ? '#ffffff' : 'var(--text-secondary)');

        // تحديث خطوط المؤشرات
        let ptrActive = s.ptrs.includes(i);
        ptrLines[i].style.opacity = (s.ptrs.length > 0 && !ptrActive) ? '0.2' : '1';
        ptrLines[i].setAttribute('stroke', ptrActive ? 'var(--algo-swap)' : 'var(--text-muted)');
        ptrLines[i].setAttribute('marker-end', ptrActive ? 'url(#w2-arrow-active)' : 'url(#w2-arr-muted)');
        
        // تحديث مربعات المؤشرات
        ptrRects[i].setAttribute('fill', ptrActive ? 'var(--algo-swap)' : 'var(--bg-elevated)');
        ptrRects[i].setAttribute('stroke', ptrActive ? '#ffffff' : 'var(--text-muted)');
        ptrDots[i].setAttribute('fill', ptrActive ? '#ffffff' : 'var(--text-muted)');
      }

      // 2. تحديث المفاتيح
      for (let k = 0; k < 3; k++) {
        let kActive = s.keys.includes(k);
        let kCmp = s.cmp === k;
        
        let fill = kCmp ? 'var(--algo-compare)' : (kActive ? 'var(--brand-500)' : 'var(--bg-elevated)');
        let stroke = (kCmp || kActive) ? '#ffffff' : 'var(--border-color)';
        let textFill = (kCmp || kActive) ? '#ffffff' : 'var(--text-primary)';

        keyRects[k].setAttribute('fill', fill);
        keyRects[k].setAttribute('stroke', stroke);
        keyTexts[k].setAttribute('fill', textFill);
        keyTexts[k].textContent = dynamicKeys[k];
      }

      // 3. تحريك وتحديث صندوق الهدف (Target)
      if (s.target !== null) {
        targetGroup.style.opacity = '1';
        let tx = 400; // المركز الافتراضي
        if (s.cmp !== -1) tx = 240 + s.cmp * 160; // فوق المفتاح المقارن
        else if (s.ptrs.length > 0) tx = 160 + s.ptrs[0] * 160; // فوق المؤشر المتبع
        
        targetGroup.style.transform = `translateX(${tx - 400}px)`;
        let label = _AL.lang() === 'ar' ? 'البحث:' : 'Target:';
        targetText.textContent = `${label} ${s.target}`;
      } else {
        targetGroup.style.opacity = '0';
      }
    }
 
    function startPlay() {
      playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
    }
    
    function stopPlay() {
      playing = false; clearInterval(interval); interval = null;
      btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
    }
 
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() { stopPlay(); if (cur > 0) { cur--; render(); } });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() { playing ? stopPlay() : startPlay(); });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); generateSteps(); cur = 0; render(); });
    
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
      }
    });
 
    window._algoRerenders[2] = render;
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