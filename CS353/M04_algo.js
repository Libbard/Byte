// M04_algo.js — Interactive algorithm widgets
// Generated: 2026-03-03T17:02:32
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
window._algoTitles[1] = { en: 'Topological Sorting', ar: 'الفرز الطوبولوجي: إزالة المصدر' };
window._algoTitles[2] = { en: 'Types of Edges in a DFS Forest', ar: 'أنواع الحواف في غابة DFS' };
window._algoTitles[3] = { en: 'The Selection Problem and Quick Select', ar: 'الاختيار السريع - تقسيم لوموتو' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة للرسم البياني
      '<div class="algo-svg-wrapper" style="width: 100%; max-width: 550px; aspect-ratio: 5 / 3; margin: 0 auto; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow: hidden;">' +
      '<svg id="w1-canvas" width="100%" height="100%" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet"></svg>' +
      '</div>' +
      
      // دليل الألوان المحدث
      '<div class="algo-legend" style="display:flex; justify-content:center; flex-wrap:wrap; gap:15px; margin-top:15px; font-size: 0.8rem; color: var(--text-secondary);">' +
        '<span style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;"></span><span data-algo-text="w1-normal"></span></span>' +
        '<span style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;"></span><span data-algo-text="w1-source"></span></span>' +
        '<span style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;"></span><span data-algo-text="w1-current"></span></span>' +
        '<span style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px dashed var(--algo-muted);border-radius:3px;"></span><span data-algo-text="w1-removed"></span></span>' +
      '</div>' +
      
      // صندوق النتيجة
      '<div class="algo-output" id="w1-output" style="margin-top:20px; text-align:center;"></div>' +
    '</div>';
 
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w1-exp');
    var canvasEl = container.querySelector('#w1-canvas');
    var outputEl = container.querySelector('#w1-output');
    var counter  = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
 
    var NODE_RADIUS = 22; // حجم مناسب للعقد
    var NODE_POSITIONS = {
      'C1': { x: 100, y: 100 },
      'C2': { x: 100, y: 200 },
      'C3': { x: 250, y: 150 },
      'C4': { x: 400, y: 100 },
      'C5': { x: 400, y: 200 }
    };
    var INITIAL_EDGES = [
      { from: 'C1', to: 'C3' },
      { from: 'C2', to: 'C3' },
      { from: 'C3', to: 'C4' },
      { from: 'C3', to: 'C5' },
      { from: 'C4', to: 'C5' }
    ];
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-normal"]').textContent  = _AL.exp('Normal Node', 'عقدة عادية');
      container.querySelector('[data-algo-text="w1-source"]').textContent  = _AL.exp('Source (In-degree 0)', 'مصدر (دخول 0)');
      container.querySelector('[data-algo-text="w1-current"]').textContent = _AL.exp('Being Removed', 'جاري إزالتها');
      container.querySelector('[data-algo-text="w1-removed"]').textContent = _AL.exp('Removed', 'تمت إزالتها');
    }
 
    function generateSteps() {
      steps = [];
      var nodes = Object.keys(NODE_POSITIONS).map(id => ({ id: id, label: id, ...NODE_POSITIONS[id], status: 'normal' }));
      var edges = INITIAL_EDGES.map(e => ({ ...e, status: 'active' }));
      var inDegrees = {};
      var adjList = {};
 
      nodes.forEach(n => {
        inDegrees[n.id] = 0;
        adjList[n.id] = [];
      });
      edges.forEach(edge => {
        inDegrees[edge.to]++;
        adjList[edge.from].push(edge.to);
      });
 
      var currentInDegrees = { ...inDegrees };
      var currentNodes = nodes.map(n => ({ ...n }));
      var currentEdges = edges.map(e => ({ ...e }));
      var removedOrder = [];
 
      // وظيفة مساعدة لتحديث حالة العقد بناءً على درجات الدخول
      function updateNodeStatuses() {
        currentNodes.forEach(n => {
          if (n.status !== 'removed' && n.status !== 'current') {
            n.status = currentInDegrees[n.id] === 0 ? 'source' : 'normal';
          }
        });
      }
 
      updateNodeStatuses();
 
      steps.push({
        nodes: currentNodes.map(n => ({ ...n })),
        edges: currentEdges.map(e => ({ ...e })),
        removedOrder: [...removedOrder],
        en: 'Initial Graph. Calculating in-degrees. Nodes with 0 incoming edges are highlighted as sources.',
        ar: 'الرسم البياني الأولي. حساب الأسهم الداخلة لكل عقدة. العقد التي ليس لها أسهم داخلة تضاء كمصادر.'
      });
 
      while (removedOrder.length < nodes.length) {
        var sources = currentNodes.filter(n => n.status === 'source');
 
        if (sources.length === 0) break; // لتجنب الحلقات اللانهائية
 
        sources.sort((a, b) => a.id.localeCompare(b.id)); // الترتيب الأبجدي لضمان سير الخوارزمية بمنهجية
        var sourceToRemove = sources[0].id;
 
        // 1. تحديد العقدة التي ستتم إزالتها
        currentNodes.find(n => n.id === sourceToRemove).status = 'current';
        steps.push({
          nodes: currentNodes.map(n => ({ ...n })),
          edges: currentEdges.map(e => ({ ...e })),
          removedOrder: [...removedOrder],
          en: 'Select source node <strong>' + sourceToRemove + '</strong> to remove it from the graph.',
          ar: 'تحديد العقدة المصدر <strong dir="ltr">' + sourceToRemove + '</strong> لكي يتم حذفها من الرسم البياني.'
        });
 
        // 2. إزالة العقدة وحوافها
        currentNodes.find(n => n.id === sourceToRemove).status = 'removed';
        removedOrder.push(sourceToRemove);
        
        currentEdges.forEach(e => {
          if (e.from === sourceToRemove) {
            e.status = 'removed'; // تصبح الحافة شفافة ومنقطة
            currentInDegrees[e.to]--; // تقليل درجة الدخول للعقدة المستقبلة
          }
        });
 
        updateNodeStatuses();
 
        steps.push({
          nodes: currentNodes.map(n => ({ ...n })),
          edges: currentEdges.map(e => ({ ...e })),
          removedOrder: [...removedOrder],
          en: 'Node <strong>' + sourceToRemove + '</strong> and its outgoing edges are removed. Updating in-degrees of neighbors.',
          ar: 'تم بهتان وإزالة <strong dir="ltr">' + sourceToRemove + '</strong> مع أسهمها الخارجة. وتحديث حالة العقد المجاورة.'
        });
      }
 
      steps.push({
        nodes: currentNodes.map(n => ({ ...n })),
        edges: currentEdges.map(e => ({ ...e })),
        removedOrder: [...removedOrder],
        en: 'Algorithm Complete! All nodes have been sorted topologically.',
        ar: 'اكتملت الخوارزمية! تم استخراج جميع العقد وترتيبها طوبولوجياً.'
      });
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
 
      canvasEl.innerHTML = ''; 
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 500 300');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
 
      // تعريف رؤوس الأسهم لحالتين: نشط ومحذوف
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      var markerActive = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      markerActive.setAttribute('id', 'arrow-active');
      markerActive.setAttribute('markerWidth', '10');
      markerActive.setAttribute('markerHeight', '7');
      markerActive.setAttribute('refX', '9'); // ضبط نقطة اتصال السهم بالدائرة
      markerActive.setAttribute('refY', '3.5');
      markerActive.setAttribute('orient', 'auto');
      var polyActive = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polyActive.setAttribute('points', '0 0, 10 3.5, 0 7');
      polyActive.setAttribute('fill', 'var(--text-primary)');
      polyActive.setAttribute('opacity', '0.8');
      markerActive.appendChild(polyActive);
      defs.appendChild(markerActive);
 
      var markerRemoved = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      markerRemoved.setAttribute('id', 'arrow-removed');
      markerRemoved.setAttribute('markerWidth', '10');
      markerRemoved.setAttribute('markerHeight', '7');
      markerRemoved.setAttribute('refX', '9');
      markerRemoved.setAttribute('refY', '3.5');
      markerRemoved.setAttribute('orient', 'auto');
      var polyRemoved = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polyRemoved.setAttribute('points', '0 0, 10 3.5, 0 7');
      polyRemoved.setAttribute('fill', 'var(--algo-muted)');
      polyRemoved.setAttribute('opacity', '0.3');
      markerRemoved.appendChild(polyRemoved);
      defs.appendChild(markerRemoved);
 
      svg.appendChild(defs);
 
      // رسم الخطوط أولاً لكي تكون خلف الدوائر
      s.edges.forEach(edge => {
        var fromNode = s.nodes.find(n => n.id === edge.from);
        var toNode = s.nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;
 
        var dx = toNode.x - fromNode.x;
        var dy = toNode.y - fromNode.y;
        var angle = Math.atan2(dy, dx);
 
        // حساب نقطة البداية والنهاية لكي يلامس الخط محيط الدائرة وليس مركزها
        var x1 = fromNode.x + NODE_RADIUS * Math.cos(angle);
        var y1 = fromNode.y + NODE_RADIUS * Math.sin(angle);
        var x2 = toNode.x - NODE_RADIUS * Math.cos(angle); 
        var y2 = toNode.y - NODE_RADIUS * Math.sin(angle);
 
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        
        if (edge.status === 'active') {
          line.setAttribute('stroke', 'var(--text-primary)');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('opacity', '0.8');
          line.setAttribute('marker-end', 'url(#arrow-active)');
        } else {
          // الحواف المحذوفة (شفافة ومتقطعة)
          line.setAttribute('stroke', 'var(--algo-muted)');
          line.setAttribute('stroke-width', '1.5');
          line.setAttribute('stroke-dasharray', '4,4');
          line.setAttribute('opacity', '0.3');
          line.setAttribute('marker-end', 'url(#arrow-removed)');
        }
        svg.appendChild(line);
      });
 
      // رسم العقد
      s.nodes.forEach(node => {
        // تجميع الدائرة والنص في جروب لضمان ترابطهما
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', NODE_RADIUS);
        circle.setAttribute('stroke-width', '2');
        
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y);
        text.setAttribute('dy', '.3em'); // توسيط عمودي دقيق
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '13px');
        text.setAttribute('font-family', "'Inter', sans-serif");
        text.setAttribute('font-weight', '800');
        text.textContent = node.label;
 
        // تلوين العقدة حسب حالتها
        if (node.status === 'normal') {
          circle.setAttribute('fill', 'var(--brand-500)');
          circle.setAttribute('stroke', 'var(--brand-600)');
          text.setAttribute('fill', '#ffffff');
        } else if (node.status === 'source') {
          circle.setAttribute('fill', 'var(--algo-compare)');
          circle.setAttribute('stroke', 'var(--brand-600)');
          text.setAttribute('fill', 'var(--bg-body)');
        } else if (node.status === 'current') {
          circle.setAttribute('fill', 'var(--algo-active)');
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', '3'); // توهج بسيط أثناء الإزالة
          text.setAttribute('fill', '#ffffff');
        } else if (node.status === 'removed') {
          circle.setAttribute('fill', 'var(--bg-elevated)');
          circle.setAttribute('stroke', 'var(--algo-muted)');
          circle.setAttribute('stroke-dasharray', '4,4');
          text.setAttribute('fill', 'var(--algo-muted)');
        }
 
        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
 
      canvasEl.appendChild(svg);
 
      // تحديث شريط النتيجة بـ Badges أنيقة
      var outputHtml = '<div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:8px;">' + _AL.exp('Topological Order:', 'الترتيب الطوبولوجي:') + '</div>';
      outputHtml += '<div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">';
      
      if (s.removedOrder.length > 0) {
        s.removedOrder.forEach(item => {
          outputHtml += '<span style="background:var(--algo-active); color:#fff; padding:4px 12px; border-radius:var(--radius-pill); font-family:\'Inter\', sans-serif; font-size:0.85rem; font-weight:800; box-shadow:0 2px 4px var(--shadow-base);">' + item + '</span>';
        });
      } else {
        outputHtml += '<span style="color:var(--text-muted); font-size:0.85rem; font-style:italic;">' + _AL.exp('Empty', 'فارغ') + '</span>';
      }
      outputHtml += '</div>';
      outputEl.innerHTML = outputHtml;
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
 
    window._algoRerenders[1] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[2] = function(container) {
  // Node positions and radius
    var nodes = {
      a: { x: 100, y: 100, label: 'a' },
      b: { x: 200, y: 150, label: 'b' },
      c: { x: 300, y: 100, label: 'c' },
      d: { x: 400, y: 100, label: 'd' },
      e: { x: 500, y: 150, label: 'e' }
    };
    var nodeRadius = 20;
  
    // Helper to get adjusted line points for arrows
    function getArrowPoints(fromNode, toNode, radius) {
      var dx = toNode.x - fromNode.x;
      var dy = toNode.y - fromNode.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) return { startX: fromNode.x, startY: fromNode.y, endX: toNode.x, endY: toNode.y, ux: 0, uy: 0 };
      var ux = dx / dist;
      var uy = dy / dist;
  
      var startX = fromNode.x + ux * radius;
      var startY = fromNode.y + uy * radius;
      var endX = toNode.x - ux * radius;
      var endY = toNode.y - uy * radius;
  
      return { startX, startY, endX, endY, ux, uy };
    }
  
    // HTML Scaffold
    container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp"></div>' +
      '<div class="algo-canvas-container" style="text-align:center; padding:10px;">' +
        '<svg class="algo-canvas" id="w2-canvas" viewBox="0 0 600 300" style="width:100%; height:300px; background:var(--algo-canvas-bg); border-radius:8px;">' +
          '<defs>' +
            '<marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-active)" /></marker>' +
            '<marker id="arrowhead-compare" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-compare)" /></marker>' +
            '<marker id="arrowhead-swap" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-swap)" /></marker>' +
            '<marker id="arrowhead-sorted" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-sorted)" /></marker>' +
            '<marker id="arrowhead-muted" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-muted)" /></marker>' +
          '</defs>' +
  
          // Edges
          '<line id="w2-edge-ab" class="edge" x1="" y1="" x2="" y2="" marker-end="url(#arrowhead-active)" stroke-width="2"></line>' +
          '<line id="w2-edge-bc" class="edge" x1="" y1="" x2="" y2="" marker-end="url(#arrowhead-active)" stroke-width="2"></line>' +
          '<line id="w2-edge-de" class="edge" x1="" y1="" x2="" y2="" marker-end="url(#arrowhead-active)" stroke-width="2"></line>' +
          // الحل هنا: إضافة fill="none" لهذا المسار الدائري
          '<path id="w2-edge-ca-back" class="edge" d="" marker-end="url(#arrowhead-compare)" stroke-width="2" fill="none"></path>' +
          '<line id="w2-edge-ac-forward" class="edge" x1="" y1="" x2="" y2="" marker-end="url(#arrowhead-swap)" stroke-width="2"></line>' +
          '<line id="w2-edge-dc-cross" class="edge" x1="" y1="" x2="" y2="" marker-end="url(#arrowhead-sorted)" stroke-width="2"></line>' +
  
          // Nodes
          '<g id="w2-nodes"></g>' + // Group for nodes
        '</svg>' +
      '</div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-tree"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-back"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-forward"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-cross"></span></span>' +
      '</div>' +
    '</div>';
  
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w2-exp');
    var svgEl    = container.querySelector('#w2-canvas');
    var counter  = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    // Cache SVG elements
    var edgeAB = svgEl.querySelector('#w2-edge-ab');
    var edgeBC = svgEl.querySelector('#w2-edge-bc');
    var edgeDE = svgEl.querySelector('#w2-edge-de');
    var edgeCABack = svgEl.querySelector('#w2-edge-ca-back');
    var edgeACForward = svgEl.querySelector('#w2-edge-ac-forward');
    var edgeDCCross = svgEl.querySelector('#w2-edge-dc-cross');
    var nodesGroup = svgEl.querySelector('#w2-nodes');
  
    // Draw static nodes
    Object.keys(nodes).forEach(function(key) {
      var node = nodes[key];
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', nodeRadius);
      circle.setAttribute('fill', 'var(--brand-400)'); // Node fill
      circle.setAttribute('stroke', 'var(--brand-600)');
      circle.setAttribute('stroke-width', '2');
      circle.classList.add('algo-node');
      nodesGroup.appendChild(circle);
  
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + 5); // Adjust for vertical centering
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--algo-text)');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = node.label;
      nodesGroup.appendChild(text);
    });
  
    // Set static edge coordinates
    var pAB = getArrowPoints(nodes.a, nodes.b, nodeRadius);
    edgeAB.setAttribute('x1', pAB.startX); edgeAB.setAttribute('y1', pAB.startY); edgeAB.setAttribute('x2', pAB.endX); edgeAB.setAttribute('y2', pAB.endY);
    var pBC = getArrowPoints(nodes.b, nodes.c, nodeRadius);
    edgeBC.setAttribute('x1', pBC.startX); edgeBC.setAttribute('y1', pBC.startY); edgeBC.setAttribute('x2', pBC.endX); edgeBC.setAttribute('y2', pBC.endY);
    var pDE = getArrowPoints(nodes.d, nodes.e, nodeRadius);
    edgeDE.setAttribute('x1', pDE.startX); edgeDE.setAttribute('y1', pDE.startY); edgeDE.setAttribute('x2', pDE.endX); edgeDE.setAttribute('y2', pDE.endY);
  
    // Back edge c->a (curved)
    var pCA = getArrowPoints(nodes.c, nodes.a, nodeRadius);
    var controlX_CA = (nodes.c.x + nodes.a.x) / 2;
    var controlY_CA = Math.min(nodes.c.y, nodes.a.y) - 80; // Control point above nodes
    edgeCABack.setAttribute('d', 'M ' + pCA.startX + ' ' + pCA.startY + ' Q ' + controlX_CA + ' ' + controlY_CA + ' ' + pCA.endX + ' ' + pCA.endY);
  
    // Forward edge a->c (straight)
    var pAC = getArrowPoints(nodes.a, nodes.c, nodeRadius);
    edgeACForward.setAttribute('x1', pAC.startX); edgeACForward.setAttribute('y1', pAC.startY); edgeACForward.setAttribute('x2', pAC.endX); edgeACForward.setAttribute('y2', pAC.endY);
  
    // Cross edge d->c (straight)
    var pDC = getArrowPoints(nodes.d, nodes.c, nodeRadius);
    edgeDCCross.setAttribute('x1', pDC.startX); edgeDCCross.setAttribute('y1', pDC.startY); edgeDCCross.setAttribute('x2', pDC.endX); edgeDCCross.setAttribute('y2', pDC.endY);
  
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w2-tree"]').textContent    = _AL.lang()==='ar' ? 'حافة شجرية' : 'Tree Edge';
      container.querySelector('[data-algo-text="w2-back"]').textContent    = _AL.lang()==='ar' ? 'حافة خلفية' : 'Back Edge';
      container.querySelector('[data-algo-text="w2-forward"]').textContent = _AL.lang()==='ar' ? 'حافة أمامية' : 'Forward Edge';
      container.querySelector('[data-algo-text="w2-cross"]').textContent   = _AL.lang()==='ar' ? 'حافة متقاطعة' : 'Cross Edge';
    }
  
    function generateSteps() {
      steps = [];
      steps.push({ activeEdgeType: 'none', en: 'A DFS forest consists of multiple trees. Edges within these trees are called tree edges. Other edges are classified based on their relationship to the DFS tree.', ar: 'تتكون غابة DFS من عدة أشجار. تسمى الحواف داخل هذه الأشجار حوافًا شجرية. تُصنف الحواف الأخرى بناءً على علاقتها بشجرة DFS.' });
      steps.push({ activeEdgeType: 'tree', en: 'Tree Edges (solid): Edges that are part of the DFS tree. They connect a node to its child in the DFS traversal.', ar: 'الحواف الشجرية (صلبة): حواف تشكل جزءًا من شجرة DFS. تربط عقدة بطفلها في اجتياز DFS.' });
      steps.push({ activeEdgeType: 'back', en: 'Back Edges (dotted, curved): Connect a node to an ancestor in the DFS tree. Indicate cycles in directed graphs.', ar: 'الحواف الخلفية (منقطة، منحنية): تربط عقدة بسلف في شجرة DFS. تشير إلى الدورات في الرسوم البيانية الموجهة.' });
      steps.push({ activeEdgeType: 'forward', en: 'Forward Edges (dotted, straight): Connect a node to a descendant in the DFS tree, but are not tree edges themselves (e.g., skipping intermediate nodes).', ar: 'الحواف الأمامية (منقطة، مستقيمة): تربط عقدة بذرية في شجرة DFS، ولكنها ليست حوافًا شجرية بحد ذاتها (مثل تخطي العقد الوسيطة).' });
      steps.push({ activeEdgeType: 'cross', en: 'Cross Edges (dashed): Connect two nodes where neither is an ancestor or descendant of the other. They connect nodes in different DFS trees or different branches of the same tree.', ar: 'الحواف المتقاطعة (متقطعة): تربط عقدتين حيث لا تكون أي منهما سلفًا أو ذرية للأخرى. تربط العقد في أشجار DFS مختلفة أو فروع مختلفة من نفس الشجرة.' });
      steps.push({ activeEdgeType: 'all', en: 'All Edge Types: A complete view of all edge classifications in the DFS forest.', ar: 'جميع أنواع الحواف: عرض كامل لجميع تصنيفات الحواف في غابة DFS.' });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      // Function to apply styles to an edge
      function applyEdgeStyle(edgeElement, type, isActive) {
        edgeElement.style.opacity = isActive ? '1' : '0.2';
        edgeElement.style.stroke = 'var(--algo-text)'; // Default muted color
        edgeElement.style.strokeDasharray = '0'; // Default solid
        edgeElement.setAttribute('marker-end', 'url(#arrowhead-muted)');
  
        if (type === 'tree') {
          edgeElement.style.stroke = 'var(--algo-active)';
          edgeElement.setAttribute('marker-end', 'url(#arrowhead-active)');
        } else if (type === 'back') {
          edgeElement.style.stroke = 'var(--algo-compare)';
          edgeElement.style.strokeDasharray = '4 4';
          edgeElement.setAttribute('marker-end', 'url(#arrowhead-compare)');
        } else if (type === 'forward') {
          edgeElement.style.stroke = 'var(--algo-swap)';
          edgeElement.style.strokeDasharray = '4 4';
          edgeElement.setAttribute('marker-end', 'url(#arrowhead-swap)');
        } else if (type === 'cross') {
          edgeElement.style.stroke = 'var(--algo-sorted)';
          edgeElement.style.strokeDasharray = '8 4';
          edgeElement.setAttribute('marker-end', 'url(#arrowhead-sorted)');
        }
      }
  
      // Apply styles to all edges based on activeEdgeType
      var allEdges = [
        { el: edgeAB, type: 'tree' },
        { el: edgeBC, type: 'tree' },
        { el: edgeDE, type: 'tree' },
        { el: edgeCABack, type: 'back' },
        { el: edgeACForward, type: 'forward' },
        { el: edgeDCCross, type: 'cross' }
      ];
  
      allEdges.forEach(function(edge) {
        var isActive = (s.activeEdgeType === 'all' || s.activeEdgeType === edge.type);
        applyEdgeStyle(edge.el, edge.type, isActive);
      });
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
  
    window._algoRerenders[2] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp"></div>' +
      '<div class="algo-array" id="w3-arr" style="height:250px; align-items:flex-end; margin-top: 20px;"></div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-unprocessed"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-pivot"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-lesseq"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-finalpivot"></span></span>' +
      '</div>' +
    '</div>';
  
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w3-exp');
    var arrEl    = container.querySelector('#w3-arr');
    var counter  = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w3-unprocessed"]').textContent = _AL.lang()==='ar' ? 'غير معالج'  : 'Unprocessed';
      container.querySelector('[data-algo-text="w3-current"]').textContent     = _AL.lang()==='ar' ? 'العنصر الحالي (j)' : 'Current Element (j)';
      container.querySelector('[data-algo-text="w3-pivot"]').textContent       = _AL.lang()==='ar' ? 'المحور (p)' : 'Pivot (p)';
      container.querySelector('[data-algo-text="w3-lesseq"]').textContent      = _AL.lang()==='ar' ? 'أقل من أو يساوي المحور (i)' : '<= Pivot (i)';
      container.querySelector('[data-algo-text="w3-finalpivot"]').textContent  = _AL.lang()==='ar' ? 'المحور في مكانه النهائي' : 'Pivot in Final Position';
    }
  
    function generateSteps() {
      var arr = [];
      for(var i=0; i<10; i++) arr.push(Math.floor(Math.random()*80)+20); // 10 elements, values 20-99
  
      steps = [];
      var low = 0;
      var high = arr.length - 1;
      var pivotValue = arr[high];
      var i = low - 1; // Index of smaller element
  
      steps.push({
        a: arr.slice(),
        i: i,
        j: low - 1, // j hasn't started yet
        pivotIdx: high,
        swapped: [],
        finalPivotIdx: -1,
        en: 'Initial array. Pivot is chosen as the last element (' + pivotValue + '). `i` is at ' + i + ', `j` will iterate from ' + low + '.',
        ar: 'المصفوفة الأولية. تم اختيار العنصر الأخير (' + pivotValue + ') كمحور. `i` عند ' + i + '، و`j` سيبدأ من ' + low + '.'
      });
  
      for (var j = low; j <= high - 1; j++) {
        steps.push({
          a: arr.slice(),
          i: i,
          j: j,
          pivotIdx: high,
          swapped: [],
          finalPivotIdx: -1,
          en: 'Comparing `arr[' + j + ']` (' + arr[j] + ') with pivot (' + pivotValue + '). `i` is at ' + i + '.',
          ar: 'مقارنة `arr[' + j + ']` (' + arr[j] + ') بالمحور (' + pivotValue + '). `i` عند ' + i + '.'
        });
  
        if (arr[j] <= pivotValue) {
          i++;
          if (i !== j) { // Only swap if i and j are different
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            steps.push({
              a: arr.slice(),
              i: i,
              j: j,
              pivotIdx: high,
              swapped: [i, j],
              finalPivotIdx: -1,
              en: '`arr[' + j + ']` (' + arr[j] + ') is <= pivot. Swapping `arr[' + i + ']` (' + arr[j] + ') and `arr[' + j + ']` (' + temp + '). `i` is now at ' + i + '.',
              ar: '`arr[' + j + ']` (' + arr[j] + ') أقل من أو يساوي المحور. تبديل `arr[' + i + ']` (' + arr[j] + ') و`arr[' + j + ']` (' + temp + '). `i` الآن عند ' + i + '.'
            });
          } else {
            steps.push({
              a: arr.slice(),
              i: i,
              j: j,
              pivotIdx: high,
              swapped: [],
              finalPivotIdx: -1,
              en: '`arr[' + j + ']` (' + arr[j] + ') is <= pivot. No swap needed as `i` and `j` are the same. `i` is now at ' + i + '.',
              ar: '`arr[' + j + ']` (' + arr[j] + ') أقل من أو يساوي المحور. لا حاجة للتبديل لأن `i` و`j` متطابقان. `i` الآن عند ' + i + '.'
            });
          }
        }
      }
  
      // Place the pivot in its correct position
      var finalPivotIdx = i + 1;
      var temp = arr[finalPivotIdx];
      arr[finalPivotIdx] = arr[high];
      arr[high] = temp;
  
      steps.push({
        a: arr.slice(),
        i: i,
        j: high, // j has finished its loop
        pivotIdx: high,
        swapped: [finalPivotIdx, high],
        finalPivotIdx: -1,
        en: 'Partitioning complete. Swapping pivot (' + pivotValue + ') with `arr[' + finalPivotIdx + ']` (' + temp + ') to place pivot in its final position.',
        ar: 'اكتمل التقسيم. تبديل المحور (' + pivotValue + ') مع `arr[' + finalPivotIdx + ']` (' + temp + ') لوضع المحور في مكانه النهائي.'
      });
  
      steps.push({
        a: arr.slice(),
        i: i,
        j: high,
        pivotIdx: -1, // Pivot is now in its final place, not just 'pivotIdx'
        swapped: [],
        finalPivotIdx: finalPivotIdx,
        en: 'Pivot (' + pivotValue + ') is now at index ' + finalPivotIdx + '. Elements to its left are <= pivot, elements to its right are > pivot.',
        ar: 'المحور (' + pivotValue + ') الآن في الفهرس ' + finalPivotIdx + '. العناصر على يساره أقل من أو تساوي المحور، والعناصر على يمينه أكبر من المحور.'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      arrEl.innerHTML = '';
  
      var mx = Math.max.apply(null, s.a);
      s.a.forEach(function(val, idx) {
        var bar = document.createElement('div');
        bar.className = 'algo-bar';
        bar.style.height = (val / mx * 90) + '%';
        bar.style.width = '45px';
        bar.style.margin = '0 2px';
        bar.style.display = 'flex';
        bar.style.flexDirection = 'column';
        bar.style.justifyContent = 'flex-end';
        bar.style.alignItems = 'center';
        bar.style.position = 'relative';
        bar.style.background = 'var(--brand-500)'; // Default color
  
        if (s.finalPivotIdx === idx) {
          bar.style.background = 'var(--algo-sorted)';
        } else if (s.pivotIdx === idx) {
          bar.style.background = 'var(--algo-compare)'; // Pivot color
        } else if (s.swapped.includes(idx)) {
          bar.style.background = 'var(--algo-swap)'; // Swapped elements
        } else if (idx <= s.i && s.i !== -1) { // Elements <= pivot (left partition)
          bar.style.background = 'var(--algo-swap)'; // Using swap color for <= pivot partition
        } else if (s.j === idx) {
          bar.style.background = 'var(--algo-active)'; // Current element (j)
        }
  
        var lb = document.createElement('div');
        lb.className = 'algo-bar-label';
        lb.textContent = val;
        lb.style.position = 'absolute';
        lb.style.top = '-20px'; // Position value above the bar
        lb.style.color = 'var(--algo-text)';
        lb.style.fontSize = '0.8em';
  
        var idxLabel = document.createElement('div');
        idxLabel.className = 'algo-bar-index';
        idxLabel.textContent = idx;
        idxLabel.style.position = 'absolute';
        idxLabel.style.bottom = '-20px'; // Position index below the bar
        idxLabel.style.color = 'var(--algo-muted)';
        idxLabel.style.fontSize = '0.7em';
  
        bar.appendChild(lb);
        bar.appendChild(idxLabel);
        arrEl.appendChild(bar);
      });
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
      if(playing){ clearInterval(interval); interval = setInterval(function(){if(cur<steps.length-1){cur++;render();}else stopPlay();},getDelay()); }
    });
  
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