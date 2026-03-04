// M06_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T04:05:59
// Diagrams: 5/4

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
window._algoTitles[1] = { en: 'Transform-and-Conquer Strategy', ar: 'استراتيجية التحويل والحل' };
window._algoTitles[2] = { en: 'Gaussian Elimination', ar: 'الحذف الغاوسي' };
window._algoTitles[3] = { en: 'AVL Trees', ar: 'أشجار AVL' };
window._algoTitles[4] = { en: 'AVL Trees', ar: 'أشجار AVL: مقارنة عامل التوازن' };
window._algoTitles[5] = { en: 'AVL Tree: Single R-Rotation', ar: 'شجرة AVL: دوران يميني أحادي' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
        _AL.titleHTML(1) +
        _AL.toolbar(1) +
        '<div class="algo-explanation" id="w1-exp"></div>' +
        '<div class="algo-canvas" id="w1-canvas" style="width:100%; height:300px; background:var(--algo-canvas-bg);"></div>' +
      '</div>';
    
      var btnPlay  = container.querySelector('[data-algo-btn="play"]');
      var expEl    = container.querySelector('#w1-exp');
      var canvasEl = container.querySelector('#w1-canvas');
      var counter  = container.querySelector('[data-algo-counter]');
      var steps = [], cur = 0, playing = false, interval = null;
    
      function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
    
      function generateSteps() {
        steps = [];
        steps.push({
          highlight: 'none',
          en: 'The Transform-and-Conquer strategy involves three conceptual steps to solve a problem.',
          ar: 'تتضمن استراتيجية التحويل والحل ثلاث خطوات مفاهيمية لحل المشكلة.'
        });
        steps.push({
          highlight: 'step1',
          en: 'Start with an instance of the problem that needs to be solved.',
          ar: 'ابدأ بحالة من المشكلة التي تحتاج إلى حل.'
        });
        steps.push({
          highlight: 'arrow1+step2',
          en: 'Transform the problem into a simpler instance, a different representation, or another problem for which a solution is known or easier to find.',
          ar: 'حوّل المشكلة إلى حالة أبسط، أو تمثيل مختلف، أو مشكلة أخرى معروف حلها أو أسهل في العثور عليه.'
        });
        steps.push({
          highlight: 'arrow2+step3',
          en: 'Solve the transformed problem. The solution to the transformed problem then provides the solution to the original problem.',
          ar: 'حل المشكلة المحولة. يوفر حل المشكلة المحولة بعد ذلك حلاً للمشكلة الأصلية.'
        });
        steps.push({
          highlight: 'all',
          en: 'This strategy simplifies complex problems by changing their form, making them more manageable.',
          ar: 'تبسط هذه الاستراتيجية المشكلات المعقدة عن طريق تغيير شكلها، مما يجعلها أكثر قابلية للإدارة.'
        });
      }
    
      function render() {
        var s = steps[cur];
        counter.textContent = _AL.stepLabel(cur, steps.length - 1);
        expEl.innerHTML = _AL.exp(s.en, s.ar);
    
        canvasEl.innerHTML = ''; // Clear previous SVG content
    
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 800 400');
        svg.setAttribute('style', 'font-family: Arial, sans-serif; text-align: center;');
    
        var defaultBoxFill = 'var(--algo-bg)';
        var defaultBoxStroke = 'var(--algo-border)';
        var defaultTextFill = 'var(--algo-text)';
        var defaultArrowStroke = 'var(--algo-muted)';
    
        var activeColor = 'var(--algo-active)';
    
        // Helper to create SVG elements
        function createSvgElement(tag, attributes) {
          var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
          for (var key in attributes) {
            el.setAttribute(key, attributes[key]);
          }
          return el;
        }
    
        // --- Step 1: Problem Instance ---
        var g1 = createSvgElement('g', { id: 'w1-step1-group' });
        var rect1 = createSvgElement('rect', {
          x: '50', y: '100', width: '200', height: '200', rx: '10', ry: '10',
          fill: defaultBoxFill, stroke: defaultBoxStroke, 'stroke-width': '2'
        });
        var icon1 = createSvgElement('text', {
          x: '150', y: '170', 'font-size': '60', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: defaultTextFill
        });
        icon1.textContent = '❓';
        var label1_en = createSvgElement('text', {
          x: '150', y: '230', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label en'
        });
        label1_en.textContent = 'Problem Instance';
        var label1_ar = createSvgElement('text', {
          x: '150', y: '260', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label ar'
        });
        label1_ar.textContent = 'حالة المشكلة';
        g1.appendChild(rect1); g1.appendChild(icon1); g1.appendChild(label1_en); g1.appendChild(label1_ar);
        svg.appendChild(g1);
    
        // --- Arrow 1 ---
        var line1 = createSvgElement('line', { x1: '250', y1: '200', x2: '350', y2: '200', stroke: defaultArrowStroke, 'stroke-width': '3' });
        var head1 = createSvgElement('polygon', { points: '330,190 350,200 330,210', fill: defaultArrowStroke });
        svg.appendChild(line1); svg.appendChild(head1);
    
        // --- Step 2: Transformation ---
        var g2 = createSvgElement('g', { id: 'w1-step2-group' });
        var rect2 = createSvgElement('rect', {
          x: '300', y: '100', width: '200', height: '200', rx: '10', ry: '10',
          fill: defaultBoxFill, stroke: defaultBoxStroke, 'stroke-width': '2'
        });
        var icon2 = createSvgElement('text', {
          x: '400', y: '170', 'font-size': '60', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: defaultTextFill
        });
        icon2.textContent = '🔄';
        var label2_en = createSvgElement('text', {
          x: '400', y: '230', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label en'
        });
        label2_en.textContent = 'Transform';
        var label2_ar = createSvgElement('text', {
          x: '400', y: '260', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label ar'
        });
        label2_ar.textContent = 'تحويل';
        g2.appendChild(rect2); g2.appendChild(icon2); g2.appendChild(label2_en); g2.appendChild(label2_ar);
        svg.appendChild(g2);
    
        // --- Arrow 2 ---
        var line2 = createSvgElement('line', { x1: '500', y1: '200', x2: '600', y2: '200', stroke: defaultArrowStroke, 'stroke-width': '3' });
        var head2 = createSvgElement('polygon', { points: '580,190 600,200 580,210', fill: defaultArrowStroke });
        svg.appendChild(line2); svg.appendChild(head2);
    
        // --- Step 3: Solution ---
        var g3 = createSvgElement('g', { id: 'w1-step3-group' });
        var rect3 = createSvgElement('rect', {
          x: '550', y: '100', width: '200', height: '200', rx: '10', ry: '10',
          fill: defaultBoxFill, stroke: defaultBoxStroke, 'stroke-width': '2'
        });
        var icon3 = createSvgElement('text', {
          x: '650', y: '170', 'font-size': '60', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: defaultTextFill
        });
        icon3.textContent = '✅';
        var label3_en = createSvgElement('text', {
          x: '650', y: '230', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label en'
        });
        label3_en.textContent = 'Solution';
        var label3_ar = createSvgElement('text', {
          x: '650', y: '260', 'font-size': '20', 'text-anchor': 'middle', fill: defaultTextFill, class: 'w1-label ar'
        });
        label3_ar.textContent = 'الحل';
        g3.appendChild(rect3); g3.appendChild(icon3); g3.appendChild(label3_en); g3.appendChild(label3_ar);
        svg.appendChild(g3);
    
        // Apply highlighting based on current step
        var currentHighlight = s.highlight;
    
        if (currentHighlight === 'step1' || currentHighlight === 'all') {
          rect1.setAttribute('fill', activeColor);
          rect1.setAttribute('stroke', activeColor);
          icon1.setAttribute('fill', 'white');
          label1_en.setAttribute('fill', 'white');
          label1_ar.setAttribute('fill', 'white');
        }
        if (currentHighlight === 'arrow1+step2' || currentHighlight === 'all') {
          line1.setAttribute('stroke', activeColor);
          head1.setAttribute('fill', activeColor);
          rect2.setAttribute('fill', activeColor);
          rect2.setAttribute('stroke', activeColor);
          icon2.setAttribute('fill', 'white');
          label2_en.setAttribute('fill', 'white');
          label2_ar.setAttribute('fill', 'white');
        }
        if (currentHighlight === 'arrow2+step3' || currentHighlight === 'all') {
          line2.setAttribute('stroke', activeColor);
          head2.setAttribute('fill', activeColor);
          rect3.setAttribute('fill', activeColor);
          rect3.setAttribute('stroke', activeColor);
          icon3.setAttribute('fill', 'white');
          label3_en.setAttribute('fill', 'white');
          label3_ar.setAttribute('fill', 'white');
        }
    
        // Handle language for labels
        var isArabic = _AL.lang() === 'ar';
        svg.querySelectorAll('.w1-label.en').forEach(function(el) { el.style.display = isArabic ? 'none' : 'block'; });
        svg.querySelectorAll('.w1-label.ar').forEach(function(el) { el.style.display = isArabic ? 'block' : 'none'; });
    
        canvasEl.appendChild(svg);
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
      _algoBindSpeed(container, getDelay, startPlay);
    
      window._algoRerenders[1] = render;
      generateSteps();
      render();
};

window.AlgoWidgets[2] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
        _AL.titleHTML(2) +
        _AL.toolbar(2) +
        '<div class="algo-explanation" id="w2-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.7; margin-bottom: 15px; text-align: center;"></div>' +
        
        // حاوية الرسم المتجاوبة (بنسبة 2:1)
        '<div class="algo-canvas" id="w2-canvas" style="width:100%; max-width:800px; aspect-ratio: 2 / 1; margin: 0 auto; display:flex; justify-content:center; align-items:center; border:1px solid var(--algo-border); border-radius:var(--radius-md); background:var(--algo-canvas-bg); overflow:visible;">' +
          '<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%; overflow:visible;"></svg>' +
        '</div>' +
        
        // دليل الألوان
        '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.85rem; color: var(--text-secondary);">' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-normal"></span></span>' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-active"></span></span>' +
          '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-target"></span></span>' +
        '</div>' +
      '</div>';
   
      var btnPlay = container.querySelector('[data-algo-btn="play"]');
      var expEl = container.querySelector('#w2-exp');
      var svgEl = container.querySelector('#w2-canvas svg');
      var counter = container.querySelector('[data-algo-counter]');
   
      var steps = [], cur = 0, playing = false, interval = null;
   
      // الثوابت الهندسية للشبكة
      const numRows = 3;
      const numCols = 4;
      const cellW = 46;
      const cellH = 46;
      const cellGap = 6;
      const matW = (numCols * cellW) + ((numCols - 1) * cellGap);
      const matH = (numRows * cellH) + ((numRows - 1) * cellGap);
      
      // التوسيط الدقيق
      const matrixLeftX = 80;
      const matrixRightX = 800 - 80 - matW;
      const matrixY = (400 - matH) / 2;
   
      const initialMatrixData = [
        [2,  1, -1,  8],
        [-3, -1,  2, -11],
        [-2,  1,  2, -3]
      ];
   
      function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
      function updateLabels() {
        container.querySelector('[data-algo-text="w2-normal"]').textContent = _AL.exp('Normal Cell', 'عنصر عادي');
        container.querySelector('[data-algo-text="w2-active"]').textContent = _AL.exp('Active Rows (Pivot/Target)', 'الصفوف النشطة (المحور والمستهدف)');
        container.querySelector('[data-algo-text="w2-target"]').textContent = _AL.exp('Target to Eliminate', 'العنصر المُراد تصفيره');
      }
   
      // دالة ذكية لتنسيق الأرقام بدون أصفار عشرية مزعجة (مثل 0.50 -> 0.5)
      function formatNum(num) {
        if (Math.abs(num) < 0.0001) return "0";
        let s = num.toFixed(2);
        if (s.endsWith('.00')) return s.slice(0, -3);
        if (s.endsWith('0')) return s.slice(0, -1);
        return s;
      }
   
      function drawMatrix(svg, matrix, startX, startY, highlightRows, highlightCells, isLeftMatrix) {
        const matrixGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        matrixGroup.style.transition = "all 0.3s ease";
   
        // 1. رسم أقواس المصفوفة [ ] (لمسة رياضية احترافية)
        const bPad = 12; // بُعد القوس عن الخلايا
        const bW = 8;    // عرض شفة القوس
        const bColor = 'var(--text-muted)';
        
        const leftBracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        leftBracket.setAttribute('d', `M ${startX - bPad + bW},${startY - bPad} L ${startX - bPad},${startY - bPad} L ${startX - bPad},${startY + matH + bPad} L ${startX - bPad + bW},${startY + matH + bPad}`);
        leftBracket.setAttribute('fill', 'none'); leftBracket.setAttribute('stroke', bColor); leftBracket.setAttribute('stroke-width', '3');
        
        const rightBracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        rightBracket.setAttribute('d', `M ${startX + matW + bPad - bW},${startY - bPad} L ${startX + matW + bPad},${startY - bPad} L ${startX + matW + bPad},${startY + matH + bPad} L ${startX + matW + bPad - bW},${startY + matH + bPad}`);
        rightBracket.setAttribute('fill', 'none'); rightBracket.setAttribute('stroke', bColor); rightBracket.setAttribute('stroke-width', '3');
        
        matrixGroup.appendChild(leftBracket);
        matrixGroup.appendChild(rightBracket);
   
        // 2. رسم الخلايا
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            const x = startX + c * (cellW + cellGap);
            const y = startY + r * (cellH + cellGap);
   
            let bgFill = 'var(--bg-elevated)';
            let strokeColor = 'var(--border-color)';
            let textFill = 'var(--text-primary)';
            let fontW = '700';
   
            if (!isLeftMatrix) {
              if (highlightRows.includes(r)) {
                bgFill = 'var(--algo-active)';
                strokeColor = '#ffffff';
                textFill = '#ffffff';
                fontW = '800';
              }
              if (highlightCells.some(cell => cell[0] === r && cell[1] === c)) {
                bgFill = 'var(--algo-compare)';
                strokeColor = '#ffffff';
                textFill = '#ffffff';
                fontW = '900';
              }
            }
   
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', cellW);
            rect.setAttribute('height', cellH);
            rect.setAttribute('rx', '6'); // زوايا ناعمة
            rect.setAttribute('ry', '6');
            rect.setAttribute('fill', bgFill);
            rect.setAttribute('stroke', strokeColor);
            rect.setAttribute('stroke-width', '1.5');
            rect.style.transition = 'fill 0.3s ease, stroke 0.3s ease';
            matrixGroup.appendChild(rect);
   
            // توسيط النص بدقة داخل الخلية
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + cellW / 2);
            text.setAttribute('y', y + cellH / 2);
            text.setAttribute('dy', '.1em'); 
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', textFill);
            text.setAttribute('font-family', "'JetBrains Mono', monospace");
            text.setAttribute('font-size', '15px');
            text.setAttribute('font-weight', fontW);
            text.textContent = formatNum(matrix[r][c]);
            text.style.transition = 'fill 0.3s ease';
            
            matrixGroup.appendChild(text);
          }
        }
        
        // 3. إضافة عنوان فوق كل مصفوفة
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', startX + matW / 2);
        title.setAttribute('y', startY - 35);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('fill', 'var(--text-muted)');
        title.setAttribute('font-family', "'Cairo', sans-serif");
        title.setAttribute('font-weight', '700');
        title.setAttribute('font-size', '14px');
        title.textContent = _AL.exp(isLeftMatrix ? 'Original Matrix' : 'Working Matrix', isLeftMatrix ? 'المصفوفة الأصلية' : 'مصفوفة العمليات');
        matrixGroup.appendChild(title);
  
        svg.appendChild(matrixGroup);
      }
   
      function generateSteps() {
        steps = [];
        let currentMatrix = initialMatrixData.map(row => row.slice()); 
   
        steps.push({
          matrix: currentMatrix.map(row => row.slice()),
          highlightRows: [], highlightCells: [],
          en: 'Initial augmented matrix system.',
          ar: 'نظام المصفوفة الموسعة الأولي.'
        });
   
        for (let p = 0; p < currentMatrix.length - 1; p++) {
          for (let r = p + 1; r < currentMatrix.length; r++) {
            const pivotVal = currentMatrix[p][p];
            const valToEliminate = currentMatrix[r][p];
   
            if (pivotVal === 0) return;
            if (valToEliminate === 0) continue;
   
            const multiplier = valToEliminate / pivotVal;
            const multStr = formatNum(multiplier);
            
            // عرض المعادلة بشكل رياضي أنيق باستخدام LTR code blocks
            const eqEn = `<span dir="ltr" class="code-block-header" style="display:inline-block; padding:2px 8px; border-radius:4px; margin-top:4px;">R<sub>${r+1}</sub> &larr; R<sub>${r+1}</sub> - (${multStr}) &times; R<sub>${p+1}</sub></span>`;
            const eqAr = `<span dir="ltr" class="code-block-header" style="display:inline-block; padding:2px 8px; border-radius:4px; margin-top:4px;">R<sub>${r+1}</sub> &larr; R<sub>${r+1}</sub> - (${multStr}) &times; R<sub>${p+1}</sub></span>`;
  
            steps.push({
              matrix: currentMatrix.map(row => row.slice()),
              highlightRows: [p, r], // إضاءة الصفين (المحور والمستهدف)
              highlightCells: [[r, p]], // إضاءة العنصر المُراد تصفيره بقوة
              en: `Eliminate <strong>${formatNum(valToEliminate)}</strong> using pivot row R<sub>${p+1}</sub>.<br>${eqEn}`,
              ar: `إلغاء العنصر <strong>${formatNum(valToEliminate)}</strong> ليصبح صفراً باستخدام الصف المحوري R<sub>${p+1}</sub>.<br>${eqAr}`
            });
   
            for (let c = p; c < currentMatrix[0].length; c++) {
              currentMatrix[r][c] -= multiplier * currentMatrix[p][c];
            }
   
            steps.push({
              matrix: currentMatrix.map(row => row.slice()),
              highlightRows: [r],
              highlightCells: [[r, p]], // يظل مضاءً ليراه وهو صفر
              en: `Row R<sub>${r+1}</sub> has been successfully updated.`,
              ar: `تم تحديث الصف R<sub>${r+1}</sub> بنجاح.`
            });
          }
        }
   
        steps.push({
          matrix: currentMatrix.map(row => row.slice()),
          highlightRows: [], highlightCells: [],
          en: 'Gaussian Elimination complete. The matrix is in upper triangular form.',
          ar: 'اكتمل الحذف الغاوسي. المصفوفة الآن في الصورة المثلثية العلوية جاهزة للتعويض العكسي.'
        });
      }
   
      function render() {
        updateLabels();
        var s = steps[cur];
        counter.textContent = _AL.stepLabel(cur, steps.length - 1);
        expEl.innerHTML = _AL.exp(s.en, s.ar);
   
        svgEl.innerHTML = ''; 
        
        // تعريف رأس السهم
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `<marker id="w2-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" /></marker>`;
        svgEl.appendChild(defs);
   
        // رسم المصفوفة الأصلية (يسار)
        drawMatrix(svgEl, initialMatrixData, matrixLeftX, matrixY, [], [], true);
   
        // رسم المصفوفة الحالية (يمين)
        drawMatrix(svgEl, s.matrix, matrixRightX, matrixY, s.highlightRows, s.highlightCells, false);
   
        // رسم السهم بالمنتصف
        const arrowStartX = matrixLeftX + matW + 40;
        const arrowEndX = matrixRightX - 30;
        const arrowY = matrixY + matH / 2;
   
        const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowLine.setAttribute('x1', arrowStartX);
        arrowLine.setAttribute('y1', arrowY);
        arrowLine.setAttribute('x2', arrowEndX);
        arrowLine.setAttribute('y2', arrowY);
        arrowLine.setAttribute('stroke', 'var(--text-muted)');
        arrowLine.setAttribute('stroke-width', '3');
        arrowLine.setAttribute('marker-end', 'url(#w2-arrow)');
        svgEl.appendChild(arrowLine);
   
        // رسم نص السهم
        const arrowLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        arrowLabel.setAttribute('x', (arrowStartX + arrowEndX) / 2);
        arrowLabel.setAttribute('y', arrowY - 15);
        arrowLabel.setAttribute('text-anchor', 'middle');
        arrowLabel.setAttribute('fill', 'var(--text-primary)');
        arrowLabel.setAttribute('font-weight', '800');
        arrowLabel.setAttribute('font-family', "'Cairo', 'Inter', sans-serif");
        arrowLabel.setAttribute('font-size', '14px');
        arrowLabel.textContent = _AL.exp('Gaussian Elimination', 'الحذف الغاوسي');
        svgEl.appendChild(arrowLabel);
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
      container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); generateSteps(); cur = 0; render(); });
      container.querySelector('.algo-speed input').addEventListener('input', function() {
        if (playing) { clearInterval(interval); interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
      });
   
      window._algoRerenders[2] = render;
      generateSteps();
      render();
};

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة لضمان احتواء الشجرتين بشكل ممتاز
      '<div class="algo-canvas" id="w3-canvas" style="width:100%; max-width:800px; aspect-ratio: 2 / 1; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:hidden;">' +
        // تم تثبيت الـ SVG هنا بدلاً من خلقه برمجياً في كل خطوة
        '<svg id="w3-svg-canvas" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;"></svg>' +
      '</div>' +
      
      // دليل الألوان لتوضيح الحالات
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:12px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-normal"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-active"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-violation"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w3-exp');
    var svgEl   = container.querySelector('#w3-svg-canvas'); // استخدام الـ SVG الثابت
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var nodes = [], edges = [];
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w3-normal"]').textContent = _AL.exp('Tree Node', 'عقدة عادية');
      container.querySelector('[data-algo-text="w3-active"]').textContent = _AL.exp('Checking Node', 'جاري الفحص');
      container.querySelector('[data-algo-text="w3-violation"]').textContent = _AL.exp('AVL Violation', 'إخلال بالتوازن');
    }
 
    function generateSteps() {
      var valA_root = Math.floor(Math.random() * 21) + 50;
      var valA_L    = Math.floor(Math.random() * 16) + 30;
      var valA_R    = Math.floor(Math.random() * 16) + 75;
      var valA_LL   = Math.floor(Math.random() * 16) + 10;
      var valA_LR   = Math.floor(Math.random() * 4) + 46;
 
      var valB_root = Math.floor(Math.random() * 21) + 50;
      var valB_L    = Math.floor(Math.random() * 16) + 30;
      var valB_R    = Math.floor(Math.random() * 16) + 75;
      var valB_LL   = Math.floor(Math.random() * 11) + 15;
      var valB_LLL  = Math.floor(Math.random() * 6) + 5;
 
      nodes = [
        { id: 0, x: 200, y: 80,  val: valA_root, bf: 1, tree: 'A' },
        { id: 1, x: 120, y: 150, val: valA_L,    bf: 0, tree: 'A' },
        { id: 2, x: 280, y: 150, val: valA_R,    bf: 0, tree: 'A' },
        { id: 3, x: 80,  y: 230, val: valA_LL,   bf: 0, tree: 'A' },
        { id: 4, x: 160, y: 230, val: valA_LR,   bf: 0, tree: 'A' },
 
        { id: 5, x: 600, y: 80,  val: valB_root, bf: 2, tree: 'B' },
        { id: 6, x: 520, y: 150, val: valB_L,    bf: 2, tree: 'B' },
        { id: 7, x: 680, y: 150, val: valB_R,    bf: 0, tree: 'B' },
        { id: 8, x: 440, y: 230, val: valB_LL,   bf: 1, tree: 'B' },
        { id: 9, x: 360, y: 310, val: valB_LLL,  bf: 0, tree: 'B' }
      ];
 
      edges = [
        { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 1, v: 3 }, { u: 1, v: 4 },
        { u: 5, v: 6 }, { u: 5, v: 7 }, { u: 6, v: 8 }, { u: 8, v: 9 }
      ];
 
      steps = [
        {
          activeNodes: [], showBf: [], highlightBf: [],
          en: 'Initial state: Two Binary Search Trees.',
          ar: 'الحالة الأولية: شجرتا بحث ثنائيتان.'
        },
        {
          activeNodes: [0,1,2,3,4], showBf: [], highlightBf: [],
          en: 'Let us check if Tree A is an AVL tree by calculating Balance Factors (BF = Height(L) - Height(R)).',
          ar: 'لنتحقق مما إذا كانت الشجرة (أ) هي شجرة AVL بحساب معاملات التوازن (BF = ارتفاع اليسار - ارتفاع اليمين).'
        },
        {
          activeNodes: [2,3,4], showBf: [2,3,4], highlightBf: [],
          en: 'Leaf nodes have no children, so their BF is 0.',
          ar: 'العقد الطرفية ليس لها أبناء، لذا معامل التوازن لها هو 0.'
        },
        {
          activeNodes: [1], showBf: [1,2,3,4], highlightBf: [],
          en: 'Node <strong>' + valA_L + '</strong>: Left height 1, Right height 1. BF = 1 - 1 = 0.',
          ar: 'العقدة <strong>' + valA_L + '</strong>: ارتفاع اليسار 1، ارتفاع اليمين 1. معامل التوازن = 1 - 1 = 0.'
        },
        {
          activeNodes: [0], showBf: [0,1,2,3,4], highlightBf: [],
          en: 'Node <strong>' + valA_root + '</strong>: Left height 2, Right height 1. BF = 2 - 1 = 1.',
          ar: 'العقدة <strong>' + valA_root + '</strong>: ارتفاع اليسار 2، ارتفاع اليمين 1. معامل التوازن = 2 - 1 = 1.'
        },
        {
          activeNodes: [0,1,2,3,4], showBf: [0,1,2,3,4], highlightBf: [],
          en: 'Tree A is an <strong>AVL Tree</strong> because all BFs are within the allowed range {-1, 0, 1}.',
          ar: 'الشجرة (أ) هي <strong>شجرة AVL</strong> لأن جميع معاملات التوازن تقع ضمن النطاق المسموح {-1، 0، 1}.'
        },
        {
          activeNodes: [5,6,7,8,9], showBf: [0,1,2,3,4], highlightBf: [],
          en: 'Now let us check Tree B.',
          ar: 'الآن لنتحقق من الشجرة (ب).'
        },
        {
          activeNodes: [7,9], showBf: [0,1,2,3,4, 7,9], highlightBf: [],
          en: 'Leaf nodes have BF = 0.',
          ar: 'العقد الطرفية لها معامل توازن = 0.'
        },
        {
          activeNodes: [8], showBf: [0,1,2,3,4, 7,8,9], highlightBf: [],
          en: 'Node <strong>' + valB_LL + '</strong>: Left height 1, Right height 0. BF = 1 - 0 = 1.',
          ar: 'العقدة <strong>' + valB_LL + '</strong>: ارتفاع اليسار 1، ارتفاع اليمين 0. معامل التوازن = 1 - 0 = 1.'
        },
        {
          activeNodes: [6], showBf: [0,1,2,3,4, 6,7,8,9], highlightBf: [6],
          en: 'Node <strong>' + valB_L + '</strong>: Left height 2, Right height 0. BF = 2 - 0 = 2. <span style="color:var(--algo-compare)">This violates the AVL property!</span>',
          ar: 'العقدة <strong>' + valB_L + '</strong>: ارتفاع اليسار 2، ارتفاع اليمين 0. معامل التوازن = 2 - 0 = 2. <span style="color:var(--algo-compare)">هذا يخل بخاصية التوازن!</span>'
        },
        {
          activeNodes: [5], showBf: [0,1,2,3,4, 5,6,7,8,9], highlightBf: [5,6],
          en: 'Node <strong>' + valB_root + '</strong> also has BF = 3 - 1 = 2. Tree B is <strong>NOT</strong> an AVL Tree.',
          ar: 'العقدة <strong>' + valB_root + '</strong> أيضاً لها معامل توازن = 3 - 1 = 2. الشجرة (ب) <strong>ليست</strong> شجرة AVL.'
        }
      ];
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      svgEl.innerHTML = ''; // تنظيف المحتوى الداخلي فقط
 
      var svgNS = "http://www.w3.org/2000/svg";
 
      // عناوين الأشجار
      var titleA = document.createElementNS(svgNS, "text");
      titleA.setAttribute("x", "200"); titleA.setAttribute("y", "30");
      titleA.setAttribute("text-anchor", "middle");
      titleA.setAttribute("fill", "var(--text-primary)");
      titleA.setAttribute("font-size", "18px");
      titleA.setAttribute("font-weight", "800");
      titleA.setAttribute("font-family", "'Cairo', 'Inter', sans-serif");
      titleA.textContent = _AL.lang() === 'ar' ? 'الشجرة أ (متوازنة AVL)' : 'Tree A (AVL Balanced)';
      svgEl.appendChild(titleA);
 
      var titleB = document.createElementNS(svgNS, "text");
      titleB.setAttribute("x", "600"); titleB.setAttribute("y", "30");
      titleB.setAttribute("text-anchor", "middle");
      titleB.setAttribute("fill", "var(--text-primary)");
      titleB.setAttribute("font-size", "18px");
      titleB.setAttribute("font-weight", "800");
      titleB.setAttribute("font-family", "'Cairo', 'Inter', sans-serif");
      titleB.textContent = _AL.lang() === 'ar' ? 'الشجرة ب (غير متوازنة)' : 'Tree B (Unbalanced)';
      svgEl.appendChild(titleB);
 
      // رسم الخطوط أولاً لتكون خلف العقد
      edges.forEach(function(e) {
        var u = nodes[e.u], v = nodes[e.v];
        var line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", u.x); line.setAttribute("y1", u.y);
        line.setAttribute("x2", v.x); line.setAttribute("y2", v.y);
        // إصلاح لون الخطوط ليظهر بوضوح في النمط النهاري والليلي
        line.setAttribute("stroke", "var(--text-muted)");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("opacity", "0.6");
        svgEl.appendChild(line);
      });
 
      // رسم العقد
      nodes.forEach(function(n) {
        var g = document.createElementNS(svgNS, "g");
        
        var isActive = s.activeNodes.includes(n.id);
        var fill = isActive ? "var(--algo-active)" : "var(--brand-500)";
        var strokeColor = isActive ? "#ffffff" : "var(--algo-border)";
        var scale = isActive ? "scale(1.1)" : "scale(1)";
        var sw = isActive ? "3" : "2";

        g.style.transform = scale;
        g.style.transformOrigin = `${n.x}px ${n.y}px`;
        g.style.transition = "all 0.3s ease";

        var circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", n.x); 
        circle.setAttribute("cy", n.y);
        circle.setAttribute("r", "22");
        circle.setAttribute("fill", fill);
        circle.setAttribute("stroke", strokeColor);
        circle.setAttribute("stroke-width", sw);
        g.appendChild(circle);
 
        var text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", n.x); 
        text.setAttribute("y", n.y);
        text.setAttribute("dy", ".1em"); // التوسيط الدقيق
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("fill", "#ffffff"); // لون الخط دائمًا أبيض للتباين
        text.setAttribute("font-size", "15px");
        text.setAttribute("font-weight", "800");
        text.setAttribute("font-family", "'Inter', sans-serif");
        text.textContent = n.val;
        g.appendChild(text);
 
        // رسم معامل التوازن (BF)
        if (s.showBf.includes(n.id)) {
          var isHighlight = s.highlightBf.includes(n.id);
          var bfColor = isHighlight ? "var(--algo-compare)" : "var(--text-secondary)";
          var bfFontWeight = isHighlight ? "900" : "700";
          var bfSize = isHighlight ? "16px" : "14px";
          
          var bfText = document.createElementNS(svgNS, "text");
          bfText.setAttribute("x", n.x + 28); 
          bfText.setAttribute("y", n.y - 18);
          bfText.setAttribute("fill", bfColor);
          bfText.setAttribute("font-size", bfSize);
          bfText.setAttribute("font-weight", bfFontWeight);
          bfText.setAttribute("font-family", "'Inter', sans-serif");
          bfText.textContent = "BF=" + n.bf;
          g.appendChild(bfText);
        }
        svgEl.appendChild(g);
      });
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
    
    // إصلاح ربط سرعة التشغيل
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function() {
          if (cur < steps.length - 1) { cur++; render(); }
          else stopPlay();
        }, getDelay());
      }
    });
 
    window._algoRerenders[3] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[4] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
        _AL.titleHTML(4) +
        _AL.toolbar(4) +
        '<div class="algo-explanation" id="w4-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
        
        // الحاوية: تم ضبط الـ flex لضمان بقاء الشجرتين بجانب بعضهما في الشاشات العادية
        '<div class="algo-canvas" id="w4-svg-container" style="width:100%; min-height:280px; display:flex; flex-wrap:wrap; justify-content:center; align-items:flex-start; padding:15px 5px; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); gap: 10px;">' +
          
          // الشجرة الأولى (AVL) - عرض 45% لضمان التواجد الجانبي
          '<div style="text-align:center; flex: 1 1 45%; min-width: 240px; display:flex; flex-direction:column; align-items:center;">' +
            '<h5 data-algo-text="w4-title-avl" style="color:var(--text-primary); font-weight:800; font-size:1rem; margin-bottom:5px; font-family:\'Cairo\', sans-serif;"></h5>' +
            '<svg id="w4-tree-avl" viewBox="0 0 280 240" style="width:100%; max-width:280px; height:auto; overflow:visible;"></svg>' +
          '</div>' +
          
          // الشجرة الثانية (غير متوازنة)
          '<div style="text-align:center; flex: 1 1 45%; min-width: 240px; display:flex; flex-direction:column; align-items:center;">' +
            '<h5 data-algo-text="w4-title-non-avl" style="color:var(--text-primary); font-weight:800; font-size:1rem; margin-bottom:5px; font-family:\'Cairo\', sans-serif;"></h5>' +
            '<svg id="w4-tree-non-avl" viewBox="0 0 280 240" style="width:100%; max-width:280px; height:auto; overflow:visible;"></svg>' +
          '</div>' +
          
        '</div>' +
        
        // دليل الألوان
        '<div class="algo-legend" style="margin-top:15px; display:flex; justify-content:center; flex-wrap:wrap; gap:15px; font-size:0.8rem; color:var(--text-secondary);">' +
          '<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--brand-500); margin-inline-end:5px;"></span><span data-algo-text="w4-node-normal"></span></span>' +
          '<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--algo-compare); margin-inline-end:5px;"></span><span data-algo-text="w4-node-problem"></span></span>' +
          '<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--algo-active); margin-inline-end:5px;"></span><span data-algo-text="w4-node-current"></span></span>' +
        '</div>' +
      '</div>';
    
      var btnPlay  = container.querySelector('[data-algo-btn="play"]');
      var expEl    = container.querySelector('#w4-exp');
      var counter  = container.querySelector('[data-algo-counter]');
      var svgAvl   = container.querySelector('#w4-tree-avl');
      var svgNonAvl = container.querySelector('#w4-tree-non-avl');
    
      var steps = [], cur = 0, playing = false, interval = null;
      var treeAData = null;
      var treeBData = null;
    
      function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
    
      function updateLabels() {
        container.querySelector('[data-algo-text="w4-title-avl"]').textContent      = _AL.exp('Tree (A): AVL Balanced', 'شجرة أ: متوازنة (AVL)');
        container.querySelector('[data-algo-text="w4-title-non-avl"]').textContent  = _AL.exp('Tree (B): Unbalanced', 'شجرة ب: غير متوازنة');
        container.querySelector('[data-algo-text="w4-node-normal"]').textContent    = _AL.exp('Normal Node', 'عقدة طبيعية');
        container.querySelector('[data-algo-text="w4-node-problem"]').textContent   = _AL.exp('Violating Node', 'عقدة تخل بالتوازن');
        container.querySelector('[data-algo-text="w4-node-current"]').textContent   = _AL.exp('Checking Node', 'جاري الفحص');
      }
    
      // بناء هيكل الشجرة
      function buildTree(data, parent = null) {
        if (!data) return null;
        const node = { id: data.id, value: data.value, bf: data.bf, parent: parent };
        node.left = buildTree(data.left, node);
        node.right = buildTree(data.right, node);
        return node;
      }
    
      // حساب إحداثيات الشجرة بطريقة مضغوطة وأنيقة
      function layoutTreeNodes(treeRoot) {
        let counter = 0;
        const vOffset = 65; // تقليل المسافة العمودية
        const hSpacing = 42; // تقليل المسافة الأفقية
        
        function traverse(node, level) {
          if (!node) return;
          traverse(node.left, level + 1);
          node.x = counter * hSpacing;
          node.y = level * vOffset + 25; // رفع الشجرة للأعلى قليلاً
          counter++;
          traverse(node.right, level + 1);
        }
        
        traverse(treeRoot, 0);
        return treeRoot;
      }
    
      // دالة الرسم المستقلة تماماً
      function drawTree(svgEl, treeRoot, activeNodes = [], problematicNodes = []) {
        svgEl.innerHTML = ''; 
        if (!treeRoot) return;
    
        // تحديد أبعاد الشجرة لضبطها في المنتصف
        let minX = Infinity, maxX = -Infinity;
        function findBounds(node) {
          if (!node) return;
          minX = Math.min(minX, node.x);
          maxX = Math.max(maxX, node.x);
          findBounds(node.left);
          findBounds(node.right);
        }
        findBounds(treeRoot);
    
        const treeWidth = maxX - minX;
        const svgWidth = 280; // العرض المصغر للـ viewBox
        const offsetX = (svgWidth - treeWidth) / 2 - minX; 
    
        const nodeRadius = 18; // تصغير حجم الدائرة
        const svgNS = 'http://www.w3.org/2000/svg';

        // 1. رسم الخطوط أولاً (لتكون في الخلفية)
        function drawEdges(node) {
            if (!node) return;
            const nodeX = node.x + offsetX;
            const nodeY = node.y;
            
            if (node.parent) {
                const parentX = node.parent.x + offsetX;
                const parentY = node.parent.y;
                const line = document.createElementNS(svgNS, 'line');
                line.setAttribute('x1', parentX);
                line.setAttribute('y1', parentY);
                line.setAttribute('x2', nodeX);
                line.setAttribute('y2', nodeY);
                line.setAttribute('stroke', 'var(--text-muted)');
                line.setAttribute('stroke-width', '2.5'); // خط أرفع قليلاً
                line.setAttribute('opacity', '0.5');
                svgEl.appendChild(line);
            }
            drawEdges(node.left);
            drawEdges(node.right);
        }
        drawEdges(treeRoot);

        // 2. رسم العقد والنصوص فوق الخطوط
        function drawNodes(node) {
          if (!node) return;
          const nodeX = node.x + offsetX;
          const nodeY = node.y;
    
          var isCurrent = activeNodes.includes(node.id);
          var isProblem = problematicNodes.includes(node.id);

          var fill = 'var(--brand-500)';
          var stroke = 'var(--algo-border)';
          var sw = '2';
          var scale = '1';

          if (isProblem) {
              fill = 'var(--algo-compare)';
              stroke = '#fff';
              sw = '2.5';
              scale = '1.05';
          }
          if (isCurrent) {
              fill = 'var(--algo-active)';
              stroke = '#fff';
              sw = '3';
              scale = '1.15';
          }

          const g = document.createElementNS(svgNS, 'g');
          g.style.transform = `scale(${scale})`;
          g.style.transformOrigin = `${nodeX}px ${nodeY}px`;
          g.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

          // الدائرة
          const circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', nodeX);
          circle.setAttribute('cy', nodeY);
          circle.setAttribute('r', nodeRadius);
          circle.setAttribute('fill', fill);
          circle.setAttribute('stroke', stroke);
          circle.setAttribute('stroke-width', sw);
          circle.style.transition = "fill 0.3s ease";
          g.appendChild(circle);
    
          // الرقم داخل الدائرة (مصغر)
          const valueText = document.createElementNS(svgNS, 'text');
          valueText.setAttribute('x', nodeX);
          valueText.setAttribute('y', nodeY);
          valueText.setAttribute('dy', '.1em');
          valueText.setAttribute('text-anchor', 'middle');
          valueText.setAttribute('dominant-baseline', 'middle');
          valueText.setAttribute('fill', '#ffffff');
          valueText.setAttribute('font-size', '13px'); // خط أصغر
          valueText.setAttribute('font-weight', '800');
          valueText.setAttribute('font-family', "'Inter', sans-serif");
          valueText.textContent = node.value;
          g.appendChild(valueText);
    
          // رقم معامل التوازن (BF) بجانب الدائرة (مصغر ومقرب)
          if (node.bf !== null) {
              const bfText = document.createElementNS(svgNS, 'text');
              bfText.setAttribute('x', nodeX + nodeRadius + 3); // أقرب للدائرة
              bfText.setAttribute('y', nodeY - 12); // أسفل قليلاً
              bfText.setAttribute('fill', isProblem ? 'var(--algo-compare)' : 'var(--text-secondary)');
              bfText.setAttribute('font-size', '11px'); // خط أصغر
              bfText.setAttribute('font-weight', isProblem ? '900' : '700');
              bfText.setAttribute('font-family', "'Inter', sans-serif");
              bfText.textContent = 'BF=' + node.bf;
              svgEl.appendChild(bfText); 
          }
          
          svgEl.appendChild(g);

          drawNodes(node.left);
          drawNodes(node.right);
        }
        drawNodes(treeRoot);
      }
    
      function generateSteps() {
        treeAData = layoutTreeNodes(buildTree({
          id: 'A1', value: 30, bf: 0,
          left: {
            id: 'A2', value: 20, bf: -1,
            left: { id: 'A3', value: 10, bf: 0, left: null, right: null },
            right: null
          },
          right: {
            id: 'A4', value: 40, bf: 1,
            left: { id: 'A5', value: 35, bf: 0, left: null, right: null },
            right: { id: 'A6', value: 50, bf: 0, left: null, right: null }
          }
        }));
    
        treeBData = layoutTreeNodes(buildTree({
          id: 'B1', value: 30, bf: 2, 
          left: {
            id: 'B2', value: 20, bf: 1,
            left: { id: 'B3', value: 10, bf: 0, left: null, right: null },
            right: null
          },
          right: null
        }));
    
        steps = [];
        
        steps.push({
          en: 'An AVL tree must maintain a balance factor (BF) of {-1, 0, 1} for every node.',
          ar: 'شجرة AVL يجب أن تحافظ على معامل توازن (BF) بقيمة {-1، 0، 1} لجميع العقد دون استثناء.',
          activeA: [], probA: [], activeB: [], probB: []
        });
    
        steps.push({
          en: 'In Tree (A), let\'s observe the balance factors. <strong>BF = Height(Left) - Height(Right)</strong>.',
          ar: 'في الشجرة (أ)، لنراقب معاملات التوازن. يتم حسابها كالتالي: <strong>BF = ارتفاع اليسار - ارتفاع اليمين</strong>.',
          activeA: ['A1','A2','A3','A4','A5','A6'], probA: [], activeB: [], probB: []
        });

        steps.push({
          en: 'Because all BFs in Tree A are strictly -1, 0, or 1, it is considered a valid <strong>AVL Tree</strong>.',
          ar: 'نظراً لأن جميع المعاملات في الشجرة أ تقع ضمن النطاق المسموح، فهي تعتبر <strong>شجرة AVL</strong> صالحة.',
          activeA: [], probA: [], activeB: [], probB: []
        });
    
        steps.push({
          en: 'Now, let us examine Tree (B). Notice the root node (30).',
          ar: 'الآن، لنتفحص الشجرة (ب). لاحظ عقدة الجذر (العقدة 30).',
          activeA: [], probA: [], activeB: ['B1'], probB: []
        });

        steps.push({
          en: 'The root node has a left subtree of height 2, but no right subtree (height 0). So, <strong>BF = 2 - 0 = 2</strong>.',
          ar: 'الجذر يمتلك فرعاً أيسر بارتفاع 2، ولا يمتلك فرعاً أيمن (ارتفاع 0). بالتالي <strong>BF = 2 - 0 = 2</strong>.',
          activeA: [], probA: [], activeB: [], probB: ['B1']
        });
        
        steps.push({
          en: 'Because a Balance Factor of 2 is found, Tree (B) violates the rule and is <strong>NOT</strong> an AVL Tree.',
          ar: 'بسبب وجود معامل توازن يساوي 2، فإن الشجرة (ب) تخل بالقاعدة وتعتبر <strong>غير متوازنة</strong> (ليست AVL).',
          activeA: [], probA: [], activeB: [], probB: ['B1']
        });
      }
    
      function render() {
        updateLabels();
        var s = steps[cur];
        counter.textContent = _AL.stepLabel(cur, steps.length - 1);
        expEl.innerHTML = _AL.exp(s.en, s.ar);
    
        drawTree(svgAvl, treeAData, s.activeA, s.probA);
        drawTree(svgNonAvl, treeBData, s.activeB, s.probB);
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
      container.querySelector('.algo-speed input').addEventListener('input', function() {
        if (playing) {
          clearInterval(interval);
          interval = setInterval(function(){ if(cur<steps.length-1){cur++;render();}else stopPlay(); }, getDelay());
        }
      });
    
      window._algoRerenders[4] = render;
      generateSteps();
      render();
};

window.AlgoWidgets[5] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
        _AL.titleHTML(5) +
        _AL.toolbar(5) +
        '<div class="algo-explanation" id="w5-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
        
        // حاوية متجاوبة بأبعاد 2:1 لضمان احتواء الشجرة بأناقة
        '<div class="algo-canvas" id="w5-canvas-container" style="width:100%; max-width:800px; aspect-ratio: 2 / 1; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
          '<svg id="w5-svg" width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
        '</div>' +
        
        // دليل الألوان
        '<div class="algo-legend" style="margin-top:15px; display:flex; justify-content:center; flex-wrap:wrap; gap:15px; font-size:0.85rem; color:var(--text-secondary);">' +
          '<span><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--brand-500); margin-inline-end:5px;"></span><span data-algo-text="w5-normal"></span></span>' +
          '<span><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--algo-compare); margin-inline-end:5px;"></span><span data-algo-text="w5-imbalance"></span></span>' +
          '<span><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--algo-swap); margin-inline-end:5px;"></span><span data-algo-text="w5-moving"></span></span>' +
          '<span><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--algo-sorted); margin-inline-end:5px;"></span><span data-algo-text="w5-balanced"></span></span>' +
        '</div>' +
      '</div>';
    
      var btnPlay  = container.querySelector('[data-algo-btn="play"]');
      var expEl    = container.querySelector('#w5-exp');
      var canvasEl = container.querySelector('#w5-svg');
      var counter  = container.querySelector('[data-algo-counter]');
      var steps = [], cur = 0, playing = false, interval = null;
    
      var NODE_RADIUS = 24;
    
      function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
      function updateLabels() {
        container.querySelector('[data-algo-text="w5-normal"]').textContent = _AL.exp('Normal Node', 'عقدة طبيعية');
        container.querySelector('[data-algo-text="w5-imbalance"]').textContent = _AL.exp('Imbalanced Node', 'عقدة تخل بالتوازن');
        container.querySelector('[data-algo-text="w5-moving"]').textContent = _AL.exp('Rotating / Moving', 'جاري الدوران');
        container.querySelector('[data-algo-text="w5-balanced"]').textContent = _AL.exp('Balanced / New Root', 'متوازنة / الجذر الجديد');
      }
    
      function generateSteps() {
        steps = [];
    
        // إحداثيات الشجرة "قبل" الدوران (مرتكزة في المنتصف x=400)
        var layoutBefore = {
          r:  { x: 400, y: 80,  label: 'r' },
          c:  { x: 250, y: 180, label: 'c' },
          T3: { x: 550, y: 180, label: 'T3' },
          T1: { x: 150, y: 280, label: 'T1' },
          T2: { x: 350, y: 280, label: 'T2' }
        };
        var edgesBefore = [
          { from: 'r', to: 'c' }, { from: 'r', to: 'T3' },
          { from: 'c', to: 'T1' }, { from: 'c', to: 'T2' }
        ];
    
        // إحداثيات الشجرة "بعد" الدوران (في نفس المركز لضمان سلاسة الفهم)
        var layoutAfter = {
          c:  { x: 400, y: 80,  label: 'c' },
          T1: { x: 250, y: 180, label: 'T1' },
          r:  { x: 550, y: 180, label: 'r' },
          T2: { x: 450, y: 280, label: 'T2' },
          T3: { x: 650, y: 280, label: 'T3' }
        };
        var edgesAfter = [
          { from: 'c', to: 'T1' }, { from: 'c', to: 'r' },
          { from: 'r', to: 'T2' }, { from: 'r', to: 'T3' }
        ];
    
        // الخطوة 0: الشجرة غير المتوازنة
        steps.push({
          en: 'This is an imbalanced AVL tree (Left-Left Case). Node <strong>r</strong> has a Balance Factor of +2.',
          ar: 'هذه شجرة AVL غير متوازنة (حالة يسار-يسار). العقدة <strong>r</strong> لديها معامل توازن +2.',
          layout: layoutBefore,
          edges: edgesBefore,
          colors: { r: 'pending', c: 'pending', T1: 'pending', T2: 'pending', T3: 'pending' },
          showArrow: false
        });
    
        // الخطوة 1: تحديد الخلل
        steps.push({
          en: 'The imbalance is detected at root <strong>r</strong>. Because the left child <strong>c</strong> is also left-heavy, a single <strong>Right Rotation (LL-Rotation)</strong> is needed.',
          ar: 'تم اكتشاف الخلل في الجذر <strong>r</strong>. ولأن الابن الأيسر <strong>c</strong> يميل لليسار أيضاً، نحتاج إلى <strong>دوران يميني أحادي (LL-Rotation)</strong>.',
          layout: layoutBefore,
          edges: edgesBefore,
          colors: { r: 'compare', c: 'active', T1: 'pending', T2: 'pending', T3: 'pending' },
          showArrow: false
        });
    
        // الخطوة 2: حركة الدوران (رسم السهم)
        steps.push({
          en: 'During rotation, <strong>c</strong> moves up to replace <strong>r</strong>. <strong>r</strong> moves down to become the right child of <strong>c</strong>. Subtree <strong>T2</strong> transfers to <strong>r</strong>.',
          ar: 'أثناء الدوران، تصعد <strong>c</strong> لتحل محل <strong>r</strong>. وتنزل <strong>r</strong> لتصبح الابن الأيمن لـ <strong>c</strong>. وتنتقل الشجرة <strong>T2</strong> لتصبح الابن الأيسر لـ <strong>r</strong>.',
          layout: layoutBefore,
          edges: edgesBefore,
          colors: { r: 'swap', c: 'swap', T1: 'pending', T2: 'compare', T3: 'pending' },
          showArrow: true
        });
    
        // الخطوة 3: الشجرة المتوازنة النهائية
        steps.push({
          en: 'The tree is now perfectly balanced! Node <strong>c</strong> is the new root, preserving the Binary Search Tree properties.',
          ar: 'الشجرة الآن متوازنة تماماً! العقدة <strong>c</strong> أصبحت الجذر الجديد، مع الحفاظ على خصائص شجرة البحث الثنائية.',
          layout: layoutAfter,
          edges: edgesAfter,
          colors: { c: 'sorted', r: 'sorted', T1: 'pending', T2: 'pending', T3: 'pending' },
          showArrow: false
        });
      }
    
      function render() {
        updateLabels();
        var s = steps[cur];
        counter.textContent = _AL.stepLabel(cur, steps.length - 1);
        expEl.innerHTML = _AL.exp(s.en, s.ar);
    
        var colorMap = {
          'pending': 'var(--brand-500)',
          'compare': 'var(--algo-compare)',
          'active':  'var(--algo-active)',
          'swap':    'var(--algo-swap)',
          'sorted':  'var(--algo-sorted)'
        };
    
        var svgHTML = '<defs>';
        // تعريف رأس السهم للدوران
        svgHTML += '<marker id="w5-rot-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-active)" /></marker>';
        svgHTML += '</defs>';
    
        // رسم الخطوط (تحت العقد)
        s.edges.forEach(edge => {
          let fromNode = s.layout[edge.from];
          let toNode = s.layout[edge.to];
          if (fromNode && toNode) {
            svgHTML += `<line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" stroke="var(--text-muted)" stroke-width="3" opacity="0.6"></line>`;
          }
        });
    
        // رسم سهم الدوران المنحني إذا كان مفعلاً (Step 2)
        if (s.showArrow) {
          // رسم قوس يلتف من فوق c إلى يمين r
          let pathD = "M 270 140 Q 360 20 460 70";
          svgHTML += `<path d="${pathD}" fill="none" stroke="var(--algo-active)" stroke-width="3" stroke-dasharray="6,4" marker-end="url(#w5-rot-arrow)"></path>`;
          
          let arrowText = _AL.lang() === 'ar' ? 'دوران يميني' : 'Right Rotation';
          svgHTML += `<text x="365" y="35" text-anchor="middle" fill="var(--algo-active)" font-size="14px" font-weight="800" font-family="'Cairo', 'Inter', sans-serif">${arrowText}</text>`;
        }
    
        // رسم العقد
        Object.keys(s.layout).forEach(nodeKey => {
          let node = s.layout[nodeKey];
          let state = s.colors[nodeKey];
          let fill = colorMap[state];
          let strokeColor = (state === 'pending') ? 'var(--algo-border)' : '#ffffff';
          let sw = (state === 'pending') ? '2' : '3';
          let scale = (state === 'active' || state === 'swap') ? 'scale(1.15)' : 'scale(1)';
          
          svgHTML += `
          <g style="transform: ${scale}; transform-origin: ${node.x}px ${node.y}px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
            <circle cx="${node.x}" cy="${node.y}" r="${NODE_RADIUS}" fill="${fill}" stroke="${strokeColor}" stroke-width="${sw}"></circle>
            <text x="${node.x}" y="${node.y}" dy=".1em" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="16px" font-weight="800" font-family="'Inter', sans-serif">${node.label}</text>
          </g>`;
        });
    
        canvasEl.innerHTML = svgHTML;
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
      container.querySelector('.algo-speed input').addEventListener('input', function() {
        if (playing) {
          clearInterval(interval);
          interval = setInterval(function(){ if(cur<steps.length-1){cur++;render();}else stopPlay(); }, getDelay());
        }
      });
    
      window._algoRerenders[5] = render;
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