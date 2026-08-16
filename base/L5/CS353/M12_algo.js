// M12_algo.js — Interactive algorithm widgets
// Generated: 2026-03-03T17:28:32
// Diagrams: 3/3

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
window._algoTitles[1] = { en: 'Decision Trees', ar: 'شجرة القرار لترتيب 3 عناصر' };
window._algoTitles[2] = { en: 'Classes P and NP', ar: 'فئات P و NP' };
window._algoTitles[3] = { en: 'NP-Complete Problems', ar: 'مسائل NP-كاملة' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 16:9 
      '<div class="algo-canvas" id="w1-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان المتناسق مع الأشكال (معين للمقارنات، مربع للنتيجة)
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span style="display:flex; align-items:center;"><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--text-muted);transform:rotate(45deg);margin-right:6px;"></span><span data-algo-text="w1-unvisited"></span></span>' +
        '<span style="display:flex; align-items:center;"><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:2px;margin-right:4px;"></span><span data-algo-text="w1-path"></span></span>' +
        '<span style="display:flex; align-items:center;"><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);transform:rotate(45deg);margin-right:6px;"></span><span data-algo-text="w1-current"></span></span>' +
        '<span style="display:flex; align-items:center;"><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:2px;margin-right:4px;"></span><span data-algo-text="w1-final"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w1-exp');
    var svgEl = container.querySelector('#w1-svg');
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // ثوابت الهندسة
    const NW = 110, NH = 54; // Node Width, Node Height

    // بناء الشجرة هندسياً (حساب المسافات لتكون متناسقة ومتجاوبة)
    var nodeData = {
      n3:  { type: 'rect', text: 'a < b < c', x: 100, y: 380 },
      n7:  { type: 'rect', text: 'a < c < b', x: 220, y: 380 },
      n8:  { type: 'rect', text: 'c < a < b', x: 340, y: 380 },
      n5:  { type: 'rect', text: 'b < a < c', x: 460, y: 380 },
      n9:  { type: 'rect', text: 'b < c < a', x: 580, y: 380 },
      n10: { type: 'rect', text: 'c < b < a', x: 700, y: 380 },
      
      n4: { type: 'diamond', text: 'a < c', x: (220+340)/2, y: 260 }, // parent of n7, n8
      n6: { type: 'diamond', text: 'b < c', x: (580+700)/2, y: 260 }, // parent of n9, n10
      
      n1: { type: 'diamond', text: 'b < c', x: (100+280)/2, y: 140 }, // parent of n3, n4
      n2: { type: 'diamond', text: 'a < c', x: (460+640)/2, y: 140 }, // parent of n5, n6
      
      n0: { type: 'diamond', text: 'a < b', x: 400, y: 40 } // Root, parent of n1, n2
    };

    var edgeData = [
      { id: 'e1', from: 'n0', to: 'n1', label: 'Yes' },
      { id: 'e2', from: 'n0', to: 'n2', label: 'No' },
      { id: 'e3', from: 'n1', to: 'n3', label: 'Yes' },
      { id: 'e4', from: 'n1', to: 'n4', label: 'No' },
      { id: 'e5', from: 'n2', to: 'n5', label: 'Yes' },
      { id: 'e6', from: 'n2', to: 'n6', label: 'No' },
      { id: 'e7', from: 'n4', to: 'n7', label: 'Yes' },
      { id: 'e8', from: 'n4', to: 'n8', label: 'No' },
      { id: 'e9', from: 'n6', to: 'n9', label: 'Yes' },
      { id: 'e10',from: 'n6', to: 'n10',label: 'No' }
    ];

    var uiNodes = {};
    var uiEdges = {};
    var valsEl = {};

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w1-unvisited"]').textContent = _AL.exp('Unvisited', 'غير مزورة');
      container.querySelector('[data-algo-text="w1-path"]').textContent      = _AL.exp('Path Taken', 'المسار المتخذ');
      container.querySelector('[data-algo-text="w1-current"]').textContent   = _AL.exp('Evaluating', 'جاري التقييم');
      container.querySelector('[data-algo-text="w1-final"]').textContent     = _AL.exp('Final Result', 'النتيجة النهائية');
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function generateSteps() {
      // 1. توليد قيم عشوائية مختلفة لـ a, b, c
      let vals = [1,2,3,4,5,6,7,8,9];
      vals.sort(() => Math.random() - 0.5);
      let a = vals[0], b = vals[1], c = vals[2];

      steps = [];
      let pathNodes = [];
      let pathEdges = [];

      steps.push({
        a, b, c, pathNodes: [...pathNodes], pathEdges: [...pathEdges], activeNode: null,
        en: `Start sorting. We have three random variables: <strong>a = ${a}</strong>, <strong>b = ${b}</strong>, <strong>c = ${c}</strong>.`,
        ar: `بدء الفرز. لدينا ثلاث متغيرات عشوائية: <strong>أ = ${a}</strong>، <strong>ب = ${b}</strong>، <strong>ج = ${c}</strong>.`
      });

      // المحاكاة الديناميكية للمسار
      let curr = 'n0';
      pathNodes.push(curr);

      while (nodeData[curr].type !== 'rect') {
        let condition = nodeData[curr].text; // e.g., "a < b"
        let isYes = false;

        // التقييم البرمجي للشرط النصي
        if (condition === 'a < b') isYes = a < b;
        else if (condition === 'a < c') isYes = a < c;
        else if (condition === 'b < c') isYes = b < c;

        steps.push({
          a, b, c, pathNodes: [...pathNodes], pathEdges: [...pathEdges], activeNode: curr,
          en: `Evaluate condition: Is <strong>${condition.replace('<', '&lt;')}</strong>? (${condition.split(' ')[0]}=${eval(condition.split(' ')[0])}, ${condition.split(' ')[2]}=${eval(condition.split(' ')[2])}). Result: <strong>${isYes ? 'Yes' : 'No'}</strong>.`,
          ar: `تقييم الشرط: هل <strong>${condition.replace('<', '&lt;').replace('a','أ').replace('b','ب').replace('c','ج')}</strong>؟ (النتيجة: <strong>${isYes ? 'نعم' : 'لا'}</strong>).`
        });

        // العثور على الفرع الصحيح للتقدم
        let edge = edgeData.find(e => e.from === curr && e.label === (isYes ? 'Yes' : 'No'));
        pathEdges.push(edge.id);
        curr = edge.to;
        pathNodes.push(curr);
      }

      // مرحلة النتيجة النهائية
      let finalResult = nodeData[curr].text.replace(/</g, '&lt;');
      steps.push({
        a, b, c, pathNodes: [...pathNodes], pathEdges: [...pathEdges], activeNode: curr,
        en: `Reached a leaf! The fully sorted order is <strong>${finalResult}</strong>.`,
        ar: `وصلنا للنتيجة النهائية! الترتيب الصحيح هو <strong>${finalResult.replace('a','أ').replace('b','ب').replace('c','ج')}</strong>.`
      });
    }

    function buildUI() {
      svgEl.innerHTML = '';
      uiNodes = {};
      uiEdges = {};

      // بناء صندوق المتغيرات (Variables HUD) في الزاوية العلوية
      let hudG = makeSVG('g', { transform: 'translate(20, 20)' });
      let hudRect = makeSVG('rect', { x: 0, y: 0, width: 140, height: 36, rx: 6, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 2 });
      let hudTxt = makeSVG('text', { x: 70, y: 18, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '15px', 'font-weight': 'bold' });
      hudG.appendChild(hudRect); hudG.appendChild(hudTxt);
      svgEl.appendChild(hudG);
      valsEl = hudTxt;

      let edgesG = makeSVG('g', {});
      let nodesG = makeSVG('g', {});

      // 1. رسم الخطوط بشكل دقيق (Perfect Anchors)
      edgeData.forEach(e => {
        let u = nodeData[e.from], v = nodeData[e.to];
        let g = makeSVG('g', {});

        // تنطلق من أسفل المعين، وتتصل بأعلى المعين أو المربع
        let x1 = u.x, y1 = u.y + NH/2;
        let x2 = v.x, y2 = v.y - NH/2;

        let line = makeSVG('line', { x1, y1, x2, y2, stroke: 'var(--text-muted)', 'stroke-width': 2 });
        
        let mx = (x1 + x2) / 2;
        let my = (y1 + y2) / 2;
        
        let pillW = 34, pillH = 20;
        let rect = makeSVG('rect', { x: mx - pillW/2, y: my - pillH/2, width: pillW, height: pillH, rx: 4, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 1.5 });
        let lbl = makeSVG('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-secondary)', 'font-family': "'Cairo', 'Inter', sans-serif", 'font-size': '12px', 'font-weight': 'bold' });
        
        // دعم اللغتين
        lbl.textContent = _AL.lang() === 'ar' ? (e.label === 'Yes' ? 'نعم' : 'لا') : e.label;

        g.appendChild(line); g.appendChild(rect); g.appendChild(lbl);
        edgesG.appendChild(g);

        uiEdges[e.id] = { g, line, rect, lbl };
      });

      // 2. رسم العقد (Diamonds & Rects)
      Object.keys(nodeData).forEach(id => {
        let n = nodeData[id];
        let g = makeSVG('g', { 'transform-origin': `${n.x}px ${n.y}px` });
        let shape;

        if (n.type === 'diamond') {
          let pts = `${n.x},${n.y - NH/2} ${n.x + NW/2},${n.y} ${n.x},${n.y + NH/2} ${n.x - NW/2},${n.y}`;
          shape = makeSVG('polygon', { points: pts, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 2 });
        } else {
          shape = makeSVG('rect', { x: n.x - NW/2, y: n.y - NH/2, width: NW, height: NH, rx: 6, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 2 });
        }

        // معالجة النص لدعم الرموز والأحرف العربية
        let displayTxt = _AL.lang() === 'ar' ? n.text.replace('a','أ').replace('b','ب').replace('c','ج') : n.text;
        
        let txt = makeSVG('text', { x: n.x, y: n.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '15px', 'font-weight': '700' });
        txt.textContent = displayTxt;

        g.appendChild(shape); g.appendChild(txt);
        nodesG.appendChild(g);

        uiNodes[id] = { g, shape, txt, type: n.type };
      });

      svgEl.appendChild(edgesG);
      svgEl.appendChild(nodesG);
      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildUI();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // تحديث شريط المتغيرات
      valsEl.textContent = `a=${s.a} | b=${s.b} | c=${s.c}`;

      // 1. تحديث مسارات الخطوط (Edges)
      edgeData.forEach(e => {
        let ui = uiEdges[e.id];
        let isInPath = s.pathEdges.includes(e.id);
        
        let color = isInPath ? 'var(--algo-compare)' : 'var(--text-muted)';
        let sw = isInPath ? '4' : '2';
        let opacity = s.pathNodes.length > 0 && !isInPath ? '0.2' : '1'; // تلاشي الباقي للتركيز البصري

        ui.g.style.opacity = opacity;
        ui.line.setAttribute('stroke', color);
        ui.line.setAttribute('stroke-width', sw);
        ui.rect.setAttribute('stroke', color);
        ui.lbl.setAttribute('fill', isInPath ? color : 'var(--text-secondary)');
      });

      // 2. تحديث حالات العقد (Nodes)
      Object.keys(nodeData).forEach(id => {
        let ui = uiNodes[id];
        let isInPath = s.pathNodes.includes(id);
        let isActive = s.activeNode === id;
        
        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--text-muted)';
        let txtColor = 'var(--algo-text)';
        let scale = 'scale(1)';
        let opacity = s.pathNodes.length > 0 && !isInPath ? '0.3' : '1';

        if (isActive && ui.type === 'rect') {
          // النتيجة النهائية
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.15)'; opacity = '1';
        } else if (isActive) {
          // جاري التقييم (مقارنة)
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.15)'; opacity = '1';
        } else if (isInPath) {
          // جزء من المسار السابق
          fill = 'var(--algo-compare)'; stroke = '#ffffff'; txtColor = '#ffffff'; opacity = '0.9';
        }

        ui.g.style.opacity = opacity;
        ui.g.style.transform = scale;
        ui.shape.setAttribute('fill', fill);
        ui.shape.setAttribute('stroke', stroke);
        ui.txt.setAttribute('fill', txtColor);
      });
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
    
    // عند الضغط على إعادة الضبط، نكسر التهيئة لتوليد قيم A, B, C جديدة كلياً
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

    window._algoRerenders[1] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[2] = function(container) {
  // Step 1: Render the HTML scaffold
    container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp"></div>' +
      '<div class="algo-canvas" id="w2-canvas" style="height:400px; width:100%;"></div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-400);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-p"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-np"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-nphard"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-npcomplete"></span></span>' +
      '</div>' +
    '</div>';
  
    // Step 2: Variables and DOM references
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w2-exp');
    var canvasEl = container.querySelector('#w2-canvas');
    var counter  = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    // Helper for animation speed (not strictly used for static diagram, but kept for consistency)
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    // Update bilingual labels
    function updateLabels() {
      container.querySelector('[data-algo-text="w2-p"]').textContent         = _AL.lang() === 'ar' ? 'فئة P' : 'Class P';
      container.querySelector('[data-algo-text="w2-np"]').textContent        = _AL.lang() === 'ar' ? 'فئة NP' : 'Class NP';
      container.querySelector('[data-algo-text="w2-nphard"]').textContent    = _AL.lang() === 'ar' ? 'NP-Hard' : 'NP-Hard';
      container.querySelector('[data-algo-text="w2-npcomplete"]').textContent = _AL.lang() === 'ar' ? 'NP-Complete' : 'NP-Complete';
      container.querySelector('[data-algo-text="w2-easy"]').textContent      = _AL.lang() === 'ar' ? 'سهل' : 'Easy';
      container.querySelector('[data-algo-text="w2-hardest"]').textContent   = _AL.lang() === 'ar' ? 'الأصعب' : 'Hardest';
      container.querySelector('[data-algo-text="w2-difficulty"]').textContent = _AL.lang() === 'ar' ? 'الصعوبة' : 'Difficulty';
    }
  
    // Step 3: Pre-compute all steps (static diagram, so mostly just one main step)
    function generateSteps() {
      steps = [];
      steps.push({
        en: 'This diagram illustrates the relationship between complexity classes P, NP, NP-Complete, and NP-Hard.',
        ar: 'يوضح هذا الرسم البياني العلاقة بين فئات التعقيد P و NP و NP-Complete و NP-Hard.'
      });
      steps.push({
        en: 'Class P problems can be solved in polynomial time. Class NP problems can be verified in polynomial time. NP-Complete problems are the "hardest" in NP, and NP-Hard problems are at least as hard as NP-Complete problems.',
        ar: 'يمكن حل مسائل فئة P في وقت متعدد الحدود. يمكن التحقق من مسائل فئة NP في وقت متعدد الحدود. مسائل NP-Complete هي "الأصعب" في NP، ومسائل NP-Hard هي على الأقل بنفس صعوبة مسائل NP-Complete.'
      });
    }
  
    // Step 4: Render function
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      canvasEl.innerHTML = ''; // Clear previous SVG
  
      if (cur === 1) { // Only draw the diagram on the second step
        canvasEl.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 700 400" style="background:var(--algo-canvas-bg);">
            <defs>
              <linearGradient id="w2-difficulty-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" style="stop-color:var(--algo-sorted);stop-opacity:1" />
                <stop offset="100%" style="stop-color:var(--algo-swap);stop-opacity:1" />
              </linearGradient>
              <marker id="w2-arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-text)" />
              </marker>
            </defs>
  
            <!-- NP Circle -->
            <circle cx="250" cy="200" r="120" fill="var(--algo-compare)" fill-opacity="0.6" stroke="var(--algo-compare)" stroke-width="2"/>
            <text x="250" y="100" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="20px">NP</text>
  
            <!-- NP-Hard Circle -->
            <circle cx="450" cy="200" r="120" fill="var(--algo-swap)" fill-opacity="0.6" stroke="var(--algo-swap)" stroke-width="2"/>
            <text x="450" y="100" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="20px">NP-Hard</text>
  
            <!-- P Circle -->
            <circle cx="250" cy="280" r="70" fill="var(--brand-400)" fill-opacity="0.6" stroke="var(--brand-400)" stroke-width="2"/>
            <text x="250" y="280" text-anchor="middle" dominant-baseline="middle" fill="var(--algo-text)" font-weight="bold" font-size="20px">P</text>
  
            <!-- NP-Complete (Intersection) -->
            <path d="M 350 133.67 A 120 120 0 0 1 350 266.33 A 120 120 0 0 1 350 133.67 Z"
                  fill="var(--algo-sorted)" fill-opacity="0.7" stroke="var(--algo-sorted)" stroke-width="2"/>
            <text x="350" y="200" text-anchor="middle" dominant-baseline="middle" fill="var(--algo-text)" font-weight="bold" font-size="18px">NP-Complete</text>
  
            <!-- Difficulty Arrow -->
            <line x1="600" y1="350" x2="600" y2="50" stroke="url(#w2-difficulty-gradient)" stroke-width="4" marker-end="url(#w2-arrowhead)"/>
            <text x="600" y="370" text-anchor="middle" fill="var(--algo-text)" font-size="16px" data-algo-text="w2-easy"></text>
            <text x="600" y="30" text-anchor="middle" fill="var(--algo-text)" font-size="16px" data-algo-text="w2-hardest"></text>
            <text x="630" y="200" text-anchor="middle" fill="var(--algo-text)" font-size="16px" transform="rotate(90 630 200)" data-algo-text="w2-difficulty"></text>
          </svg>
        `;
      }
    }
  
    // Step 5: Play / Pause pattern (simplified for static diagram)
    function startPlay() {
      playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0; // Reset if at end
      if (cur < steps.length - 1) { cur++; render(); } // Advance one step
      stopPlay(); // Immediately stop after one step
    }
    function stopPlay() {
      playing = false; clearInterval(interval); interval = null;
      btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
    }
  
    // Step 6: Wire all buttons
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click',  function(){ stopPlay(); if(cur>0){ cur--; render(); } });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click',  function(){ stopPlay(); if(cur<steps.length-1){ cur++; render(); } });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click',  function(){ playing ? stopPlay() : startPlay(); });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); generateSteps(); cur=0; render(); });
    // Speed slider has no effect on static diagram, but keep listener for consistency
    container.querySelector('.algo-speed input').addEventListener('input', function(){
      if(playing){ /* no actual interval to adjust for static diagram */ }
    });
  
    // Step 7: Register for language refresh and initialize
    window._algoRerenders[2] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp"></div>' +
      '<div class="algo-canvas" id="w3-svg-container" style="height:300px;">' +
        '<svg id="w3-svg" width="100%" height="100%" viewBox="0 0 600 300" style="background:var(--algo-canvas-bg);">' +
          '<defs>' +
            '<marker id="w3-arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">' +
              '<polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-text)" />' +
            '</marker>' +
          '</defs>' +
  
          // NP Oval
          '<ellipse id="w3-np-oval" cx="300" cy="150" rx="280" ry="130" fill="none" stroke="var(--algo-border)" stroke-width="2" />' +
          '<text id="w3-np-label" x="300" y="280" text-anchor="middle" fill="var(--algo-text)" font-size="16" data-algo-text="w3-np-label-text">NP Problems</text>' +
  
          // NP Problems (dots)
          '<circle id="w3-prob-1" cx="100" cy="80" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
          '<circle id="w3-prob-2" cx="200" cy="50" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
          '<circle id="w3-prob-3" cx="400" cy="50" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
          '<circle id="w3-prob-4" cx="500" cy="80" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
          '<circle id="w3-prob-5" cx="150" cy="220" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
          '<circle id="w3-prob-6" cx="450" cy="220" r="10" fill="var(--brand-400)" class="w3-np-problem" />' +
  
          // NP-Complete Problem (central circle)
          '<circle id="w3-np-complete" cx="300" cy="150" r="30" fill="var(--algo-bg)" stroke="var(--algo-border)" stroke-width="2" />' +
          '<text id="w3-np-complete-label" x="300" y="155" text-anchor="middle" fill="var(--algo-muted)" font-size="14" data-algo-text="w3-np-complete-label-text">NP-Complete</text>' +
  
          // Arrows (initially hidden)
          '<line id="w3-arrow-1" x1="100" y1="80" x2="275" y2="140" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
          '<line id="w3-arrow-2" x1="200" y1="50" x2="280" y2="130" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
          '<line id="w3-arrow-3" x1="400" y1="50" x2="320" y2="130" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
          '<line id="w3-arrow-4" x1="500" y1="80" x2="325" y2="140" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
          '<line id="w3-arrow-5" x1="150" y1="220" x2="280" y2="170" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
          '<line id="w3-arrow-6" x1="450" y1="220" x2="320" y2="170" stroke="var(--algo-text)" stroke-width="1" marker-end="url(#w3-arrowhead)" class="w3-reduction-arrow" style="opacity:0;" />' +
        '</svg>' +
      '</div>' +
    '</div>';
  
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w3-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    // SVG elements
    var npOval = container.querySelector('#w3-np-oval');
    var npLabel = container.querySelector('#w3-np-label');
    var npProblems = container.querySelectorAll('.w3-np-problem');
    var npComplete = container.querySelector('#w3-np-complete');
    var npCompleteLabel = container.querySelector('#w3-np-complete-label');
    var reductionArrows = container.querySelectorAll('.w3-reduction-arrow');
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w3-np-label-text"]').textContent = _AL.lang() === 'ar' ? 'مسائل NP' : 'NP Problems';
      container.querySelector('[data-algo-text="w3-np-complete-label-text"]').textContent = _AL.lang() === 'ar' ? 'NP-كاملة' : 'NP-Complete';
    }
  
    function generateSteps() {
      steps = [];
      steps.push({
        en: 'The class NP (Nondeterministic Polynomial time) contains problems whose solutions can be verified in polynomial time.',
        ar: 'فئة مسائل NP (زمن كثير الحدود غير الحتمي) تحتوي على المسائل التي يمكن التحقق من حلولها في زمن كثير الحدود.',
        highlight: 'np-oval'
      });
      steps.push({
        en: 'Many important computational problems, like the Traveling Salesperson Problem or Satisfiability, belong to NP.',
        ar: 'العديد من المسائل الحسابية الهامة، مثل مشكلة البائع المتجول أو قابلية الإرضاء، تنتمي إلى فئة NP.',
        highlight: 'np-problems'
      });
      steps.push({
        en: 'An NP-Complete problem is an NP problem that is also NP-Hard. This means every other NP problem can be reduced to it in polynomial time.',
        ar: 'مسألة NP-كاملة هي مسألة تنتمي إلى NP وهي أيضاً NP-صعبة. هذا يعني أن كل مسألة أخرى في NP يمكن اختزالها إليها في زمن كثير الحدود.',
        highlight: 'np-complete'
      });
      steps.push({
        en: 'If you can solve any NP-Complete problem efficiently, you can solve all NP problems efficiently by reducing them to it.',
        ar: 'إذا تمكنت من حل أي مسألة NP-كاملة بكفاءة، يمكنك حل جميع مسائل NP بكفاءة عن طريق اختزالها إليها.',
        highlight: 'reductions'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Reset all elements to default/hidden state
      npOval.style.stroke = 'var(--algo-border)';
      npLabel.style.fill = 'var(--algo-text)';
      npProblems.forEach(p => p.style.fill = 'var(--brand-400)');
      npComplete.style.fill = 'var(--algo-bg)';
      npComplete.style.stroke = 'var(--algo-border)';
      npCompleteLabel.style.fill = 'var(--algo-muted)';
      reductionArrows.forEach(a => a.style.opacity = '0');
  
      // Apply step-specific highlights
      if (s.highlight === 'np-oval') {
        npOval.style.stroke = 'var(--algo-active)';
        npLabel.style.fill = 'var(--algo-active)';
      } else if (s.highlight === 'np-problems') {
        npProblems.forEach(p => p.style.fill = 'var(--algo-active)');
      } else if (s.highlight === 'np-complete') {
        npProblems.forEach(p => p.style.fill = 'var(--brand-400)'); // Mute problems
        npComplete.style.fill = 'var(--algo-active)';
        npComplete.style.stroke = 'var(--algo-active)';
        npCompleteLabel.style.fill = 'var(--algo-active)';
      } else if (s.highlight === 'reductions') {
        npProblems.forEach(p => p.style.fill = 'var(--brand-400)');
        npComplete.style.fill = 'var(--algo-active)';
        npComplete.style.stroke = 'var(--algo-active)';
        npCompleteLabel.style.fill = 'var(--algo-active)';
        reductionArrows.forEach(a => a.style.opacity = '1');
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
    _algoBindSpeed(container, getDelay, startPlay); // Use helper for speed binding
  
    window._algoRerenders[3] = render;
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