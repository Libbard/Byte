// M11_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T02:02:10
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
window._algoTitles[1] = { en: 'Minimum Spanning Tree (MST)', ar: 'شجرة الامتداد الصغرى (خوارزمية بريم)' };
window._algoTitles[2] = { en: 'Dijkstra’s Algorithm', ar: 'خوارزمية دايجسترا' };
window._algoTitles[3] = { en: 'Huffman Trees and Codes', ar: 'أشجار ورموز هوفمان' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.95rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px; text-align: center; min-height: 48px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 4:3 لتناسب الشاشات الصغيرة والكبيرة
      '<div class="algo-canvas" id="w1-canvas-container" style="position:relative; width:100%; max-width:700px; margin:0 auto; aspect-ratio: 4/3; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-unvisited"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w1-candidate"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w1-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w1-mst"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay   = container.querySelector('[data-algo-btn="play"]');
    var expEl     = container.querySelector('#w1-exp');
    var counter   = container.querySelector('[data-algo-counter]');
    var svgEl     = container.querySelector('#w1-svg');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // إحداثيات مدروسة لخريطة جميلة بـ 5 عقد تتناسب مع viewBox 600x450
    // تم تدويرها قليلاً وإعادة توزيعها لتبدو كشبكة طبيعية
    var nodeCoords = {
      'A': { x: 150, y: 150 },
      'B': { x: 450, y: 150 },
      'C': { x: 150, y: 350 },
      'D': { x: 450, y: 350 },
      'E': { x: 300, y: 250 } // العقدة المركزية
    };
    var RADIUS = 22;

    var baseEdges = [
      { u: 'A', v: 'B' }, { u: 'A', v: 'C' }, { u: 'A', v: 'E' },
      { u: 'B', v: 'D' }, { u: 'C', v: 'D' }, { u: 'B', v: 'E' },
      { u: 'C', v: 'E' }, { u: 'E', v: 'D' }
    ];
    var allEdges = [];

    var nodesUI = {};
    var edgesUI = {};

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w1-unvisited"]').textContent = _AL.exp('Unexplored', 'غير مستكشفة');
      container.querySelector('[data-algo-text="w1-candidate"]').textContent = _AL.exp('Candidate Edge', 'حافة مرشحة');
      container.querySelector('[data-algo-text="w1-current"]').textContent   = _AL.exp('Newly Added', 'مضافة حديثاً');
      container.querySelector('[data-algo-text="w1-mst"]').textContent       = _AL.exp('In MST', 'في الشجرة (MST)');
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    // حساب نقاط توقف الخطوط عند حواف الدوائر باستخدام المتجهات
    function getEdgeCoords(p1, p2, r) {
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = Math.hypot(dx, dy);
      return {
        x1: p1.x + (dx / dist) * r,
        y1: p1.y + (dy / dist) * r,
        x2: p2.x - (dx / dist) * r,
        y2: p2.y - (dy / dist) * r
      };
    }

    function generateSteps() {
      // 1. توليد أوزان عشوائية في كل مرة لإبقاء الخوارزمية تفاعلية
      allEdges = baseEdges.map(e => ({
        u: e.u, v: e.v, id: e.u + e.v, w: Math.floor(Math.random() * 15) + 1
      }));

      steps = [];
      var visited = new Set(['A']);
      var mstEdges = [];

      steps.push({
        visited: Array.from(visited), mstEdges: [], candidates: [], currentEdge: null, currentNode: 'A',
        en: 'Start <strong>Prim\'s Algorithm</strong> from an arbitrary starting node (Node A).',
        ar: 'نبدأ <strong>خوارزمية بريم</strong> من عقدة بداية عشوائية (العقدة A).'
      });

      while(visited.size < Object.keys(nodeCoords).length) {
        var candidates = [];
        
        allEdges.forEach(e => {
          let uVis = visited.has(e.u);
          let vVis = visited.has(e.v);
          if ((uVis && !vVis) || (!uVis && vVis)) {
            candidates.push(e);
          }
        });

        steps.push({
          visited: Array.from(visited), mstEdges: [...mstEdges], candidates: candidates.map(e => e.id), currentEdge: null, currentNode: null,
          en: 'Identify all <strong>candidate edges</strong> connecting the current MST to unvisited nodes.',
          ar: 'نحدد جميع <strong>الحواف المرشحة</strong> التي تربط الشجرة الحالية بعقد لم تتم زيارتها بعد.'
        });

        candidates.sort((a, b) => a.w - b.w);
        var minEdge = candidates[0];
        var newNode = visited.has(minEdge.u) ? minEdge.v : minEdge.u;

        steps.push({
          visited: Array.from(visited), mstEdges: [...mstEdges], candidates: candidates.map(e => e.id), currentEdge: minEdge.id, currentNode: newNode,
          en: `Select the edge with the <strong>minimum weight (${minEdge.w})</strong> to reach node <strong>${newNode}</strong>.`,
          ar: `نختار الحافة ذات <strong>الوزن الأقل (${minEdge.w})</strong> للوصول إلى العقدة <strong>${newNode}</strong>.`
        });

        visited.add(newNode);
        mstEdges.push(minEdge.id);

        steps.push({
          visited: Array.from(visited), mstEdges: [...mstEdges], candidates: [], currentEdge: null, currentNode: newNode,
          en: `Node <strong>${newNode}</strong> is permanently added to the Minimum Spanning Tree.`,
          ar: `تمت إضافة العقدة <strong>${newNode}</strong> بشكل دائم إلى شجرة الامتداد الصغرى (MST).`
        });
      }

      steps.push({
        visited: Array.from(visited), mstEdges: [...mstEdges], candidates: [], currentEdge: null, currentNode: null,
        en: 'All nodes are visited! The <strong>Minimum Spanning Tree</strong> is fully constructed.',
        ar: 'تمت زيارة جميع العقد! اكتمل بناء <strong>شجرة الامتداد الصغرى</strong> بنجاح.'
      });
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      edgesUI = {};
      nodesUI = {};

      let edgesG = makeSVG('g', {});
      let nodesG = makeSVG('g', {});

      // 1. بناء الخطوط والحواف (خلف العقد) باستخدام المتجهات
      allEdges.forEach(e => {
        let uPos = nodeCoords[e.u];
        let vPos = nodeCoords[e.v];
        let coords = getEdgeCoords(uPos, vPos, RADIUS);
        
        let g = makeSVG('g', {});
        let line = makeSVG('line', { x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2, stroke: 'var(--text-muted)', 'stroke-width': 2 });
        
        let mx = (uPos.x + vPos.x) / 2;
        let my = (uPos.y + vPos.y) / 2;
        
        // خلفية للرقم لكي يكون واضحاً فوق الخط
        let rect = makeSVG('rect', { x: mx - 13, y: my - 11, width: 26, height: 22, rx: 4, fill: 'var(--bg-elevated)', stroke: 'var(--border-color)', 'stroke-width': 1.5 });
        let txt = makeSVG('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '13px', 'font-weight': '800' });
        
        g.appendChild(line);
        g.appendChild(rect);
        g.appendChild(txt);
        edgesG.appendChild(g);

        edgesUI[e.id] = { line: line, rect: rect, txt: txt };
      });

      // 2. بناء العقد
      Object.keys(nodeCoords).forEach(id => {
        let p = nodeCoords[id];
        let g = makeSVG('g', { 'transform-origin': `${p.x}px ${p.y}px` });
        let circle = makeSVG('circle', { cx: p.x, cy: p.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--border-color)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '18px', 'font-weight': '800' });
        txt.textContent = id;

        g.appendChild(circle);
        g.appendChild(txt);
        nodesG.appendChild(g);

        nodesUI[id] = { g: g, circle: circle, txt: txt };
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

      // تحديث الحواف (Edges)
      allEdges.forEach(e => {
        let ui = edgesUI[e.id];
        ui.txt.textContent = e.w;

        let isMst  = s.mstEdges.includes(e.id);
        let isCand = s.candidates.includes(e.id);
        let isCur  = s.currentEdge === e.id;

        let color = 'var(--text-muted)';
        let width = '2';
        let dash = '0';
        let lineOpacity = '0.2';
        let rectFill = 'var(--bg-elevated)';
        let txtColor = 'var(--text-primary)';

        if (isCur) {
          color = 'var(--algo-active)'; width = '4'; lineOpacity = '1';
          rectFill = 'var(--algo-active)'; txtColor = '#fff';
        } else if (isMst) {
          color = 'var(--algo-sorted)'; width = '4'; lineOpacity = '1';
          rectFill = 'var(--algo-sorted)'; txtColor = '#fff';
        } else if (isCand) {
          color = 'var(--algo-compare)'; width = '3'; dash = '6,4'; lineOpacity = '1';
          rectFill = 'var(--algo-compare)'; txtColor = '#fff';
        }

        ui.line.setAttribute('stroke', color);
        ui.line.setAttribute('stroke-width', width);
        ui.line.setAttribute('stroke-dasharray', dash);
        ui.line.style.opacity = lineOpacity;

        ui.rect.setAttribute('fill', rectFill);
        ui.rect.setAttribute('stroke', color);
        ui.rect.style.opacity = lineOpacity;
        
        ui.txt.setAttribute('fill', txtColor);
        ui.txt.style.opacity = lineOpacity;
      });

      // تحديث العقد (Nodes)
      Object.keys(nodeCoords).forEach(id => {
        let ui = nodesUI[id];
        let isVis = s.visited.includes(id);
        let isCur = s.currentNode === id;

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--border-color)';
        let txtColor = 'var(--text-primary)';
        let scale = 'scale(1)';

        if (isCur) {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.15)';
        } else if (isVis) {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtColor = '#ffffff';
        }

        ui.circle.setAttribute('fill', fill);
        ui.circle.setAttribute('stroke', stroke);
        ui.txt.setAttribute('fill', txtColor);
        ui.g.style.transform = scale;
      });
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
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { 
      stopPlay(); 
      isInitialized = false; // إعادة البناء لتوليد أوزان جديدة
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
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 16:9
      '<div class="algo-canvas" id="w2-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w2-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--text-muted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-unvisited"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-considering"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-visited"></span></span>' +
      '</div>' +
    '</div>';
    
    var btnPlay   = container.querySelector('[data-algo-btn="play"]');
    var expEl     = container.querySelector('#w2-exp');
    var svgEl     = container.querySelector('#w2-svg');
    var counter   = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // الخريطة الأساسية (الإحداثيات موزعة بشكل جميل لملء 800x450)
    var nodes = [
      { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }
    ];
    var nodeCoords = {
      'A': { x: 150, y: 225 },
      'B': { x: 350, y: 100 },
      'C': { x: 650, y: 100 },
      'D': { x: 350, y: 350 },
      'E': { x: 650, y: 350 }
    };
    var RADIUS = 26;

    // الروابط الأساسية، الأوزان سيتم توليدها ديناميكياً
    var baseEdges = [
      { u: 'A', v: 'B' }, { u: 'A', v: 'D' }, { u: 'B', v: 'C' },
      { u: 'B', v: 'D' }, { u: 'C', v: 'E' }, { u: 'D', v: 'E' }
    ];
    var allEdges = [];
    var adj = {};

    var nodesUI = {};
    var edgesUI = {};

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w2-unvisited"]').textContent   = _AL.exp('Unexplored', 'غير مستكشفة');
      container.querySelector('[data-algo-text="w2-considering"]').textContent = _AL.exp('Checking Edge', 'فحص الحافة');
      container.querySelector('[data-algo-text="w2-current"]').textContent     = _AL.exp('Current Node', 'العقدة الحالية');
      container.querySelector('[data-algo-text="w2-visited"]').textContent     = _AL.exp('Shortest Path Known', 'تم التأكد (أقصر مسار)');
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function generateSteps() {
      // 1. توليد أوزان عشوائية (1 إلى 15) لجعلها تفاعلية عند كل Reset
      allEdges = baseEdges.map(e => ({
        u: e.u, v: e.v, id: e.u + e.v, w: Math.floor(Math.random() * 15) + 1
      }));

      // 2. بناء قائمة الجوار (Adjacency List)
      adj = {};
      nodes.forEach(n => adj[n.id] = []);
      allEdges.forEach(e => {
        adj[e.u].push({ node: e.v, weight: e.w, id: e.id });
        adj[e.v].push({ node: e.u, weight: e.w, id: e.id }); // لأنها خريطة غير موجهة
      });

      steps = [];
      var distances = {};
      var previous = {};
      var unvisited = new Set(nodes.map(n => n.id));
      var startNode = 'A';

      nodes.forEach(n => {
        distances[n.id] = Infinity;
        previous[n.id] = null;
      });
      distances[startNode] = 0;

      steps.push({
        dist: { ...distances }, prev: { ...previous },
        unvisited: Array.from(unvisited),
        currNode: null, visited: [], consideringEdge: null,
        en: `Initialize Dijkstra: Source node <strong>${startNode}</strong> distance is 0, others are ∞.`,
        ar: `تهيئة خوارزمية دايجسترا: مسافة عقدة المصدر <strong>${startNode}</strong> هي 0، والباقي لا نهائي (∞).`
      });

      var visitedList = [];

      while (unvisited.size > 0) {
        // البحث عن العقدة صاحبة المسافة الأقل
        let u = null;
        let minD = Infinity;
        unvisited.forEach(id => {
          if (distances[id] < minD) { minD = distances[id]; u = id; }
        });

        if (u === null) break; // توقف إذا كانت باقي العقد معزولة

        unvisited.delete(u);
        visitedList.push(u);

        steps.push({
          dist: { ...distances }, prev: { ...previous },
          unvisited: Array.from(unvisited),
          currNode: u, visited: [...visitedList], consideringEdge: null,
          en: `Select node <strong>${u}</strong> with the smallest known distance (${minD}). Mark it as finalized.`,
          ar: `اختيار العقدة <strong>${u}</strong> ذات أصغر مسافة معروفة (${minD}). نعتمدها كمسار نهائي.`
        });

        // فحص الجيران
        adj[u].forEach(neighbor => {
          let v = neighbor.node;
          let w = neighbor.weight;
          let eId = neighbor.id;

          if (unvisited.has(v)) {
            let alt = distances[u] + w;
            let currentDistV = distances[v] === Infinity ? '∞' : distances[v];

            steps.push({
              dist: { ...distances }, prev: { ...previous },
              unvisited: Array.from(unvisited),
              currNode: u, visited: [...visitedList], consideringEdge: eId,
              en: `Check edge <strong>${u}-${v}</strong> (weight ${w}). Current dist to ${v} is ${currentDistV}. Path via ${u} is ${distances[u]} + ${w} = <strong>${alt}</strong>.`,
              ar: `فحص الحافة <strong>${u}-${v}</strong> (الوزن ${w}). المسافة الحالية إلى ${v} هي ${currentDistV}. المسار عبر ${u} يكلف ${distances[u]} + ${w} = <strong>${alt}</strong>.`
            });

            if (alt < distances[v]) {
              distances[v] = alt;
              previous[v] = u;

              steps.push({
                dist: { ...distances }, prev: { ...previous },
                unvisited: Array.from(unvisited),
                currNode: u, visited: [...visitedList], consideringEdge: eId,
                en: `<strong>${alt}</strong> is smaller! Update shortest distance to ${v} and set its parent to ${u}.`,
                ar: `<strong>${alt}</strong> أصغر! تحديث أقصر مسافة إلى ${v} وتعيين ${u} كأب لها في المسار.`
              });
            }
          }
        });
      }

      steps.push({
        dist: { ...distances }, prev: { ...previous },
        unvisited: [], currNode: null, visited: [...visitedList], consideringEdge: null,
        en: `<strong>Finished!</strong> All reachable nodes are finalized. The Shortest Path Tree is complete.`,
        ar: `<strong>انتهينا!</strong> تمت زيارة واعتماد جميع العقد الممكنة. شجرة أقصر مسار مكتملة الآن.`
      });
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      edgesUI = {};
      nodesUI = {};

      let edgesG = makeSVG('g', {});
      let nodesG = makeSVG('g', {});

      // 1. بناء الخطوط والحواف (في الخلف) باستخدام حساب المثلثات
      allEdges.forEach(e => {
        let p1 = nodeCoords[e.u];
        let p2 = nodeCoords[e.v];
        
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.hypot(dx, dy);
        
        // نقطة البداية والنهاية تتوقف عند حافة الدائرة (RADIUS)
        let x1 = p1.x + (dx / dist) * RADIUS;
        let y1 = p1.y + (dy / dist) * RADIUS;
        let x2 = p2.x - (dx / dist) * RADIUS;
        let y2 = p2.y - (dy / dist) * RADIUS;

        let g = makeSVG('g', {});
        let line = makeSVG('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--text-muted)', 'stroke-width': 2 });
        
        let mx = (p1.x + p2.x) / 2;
        let my = (p1.y + p2.y) / 2;
        
        // خلفية للرقم لكي يكون واضحاً
        let rect = makeSVG('rect', { x: mx - 14, y: my - 12, width: 28, height: 24, rx: 6, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': '800' });
        
        g.appendChild(line);
        g.appendChild(rect);
        g.appendChild(txt);
        edgesG.appendChild(g);

        edgesUI[e.id] = { line: line, rect: rect, txt: txt };
      });

      // 2. بناء العقد والنصوص (في الأمام)
      nodes.forEach(n => {
        let p = nodeCoords[n.id];
        let g = makeSVG('g', { 'transform-origin': `${p.x}px ${p.y}px` });
        
        let circle = makeSVG('circle', { cx: p.x, cy: p.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '22px', 'font-weight': '800' });
        txt.textContent = n.id;

        // نص المسافة (d=...) يظهر تحت العقدة
        let distTxt = makeSVG('text', { x: p.x, y: p.y + RADIUS + 18, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '15px', 'font-weight': '700' });

        g.appendChild(circle);
        g.appendChild(txt);
        g.appendChild(distTxt);
        nodesG.appendChild(g);

        nodesUI[n.id] = { g: g, circle: circle, txt: txt, distTxt: distTxt };
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

      // تحديث الحواف (Edges)
      allEdges.forEach(e => {
        let ui = edgesUI[e.id];
        ui.txt.textContent = e.w;

        // هل الحافة جزء من الشجرة النهائية لأقصر مسار؟
        let isTreeEdge = (s.prev[e.v] === e.u || s.prev[e.u] === e.v);
        let isConsidering = s.consideringEdge === e.id;

        let color = 'var(--text-muted)';
        let width = '2';
        let dash = '0';
        let lineOpacity = '0.2'; // بهتان الحواف غير المستخدمة للتركيز
        let rectFill = 'var(--bg-elevated)';
        let txtColor = 'var(--algo-text)';

        if (isConsidering) {
          color = 'var(--algo-compare)'; width = '4'; dash = '6,4'; lineOpacity = '1';
          rectFill = 'var(--algo-compare)'; txtColor = '#ffffff';
        } else if (isTreeEdge && (s.visited.includes(e.u) || s.visited.includes(e.v))) {
          // الحافة تثبت في الشجرة إذا كان أحد أطرافها على الأقل تمت زيارته واعتماده
          color = 'var(--algo-sorted)'; width = '4'; lineOpacity = '1';
          rectFill = 'var(--algo-sorted)'; txtColor = '#ffffff';
        }

        ui.line.setAttribute('stroke', color);
        ui.line.setAttribute('stroke-width', width);
        ui.line.setAttribute('stroke-dasharray', dash);
        ui.line.style.opacity = lineOpacity;

        ui.rect.setAttribute('fill', rectFill);
        ui.rect.setAttribute('stroke', color);
        ui.txt.setAttribute('fill', txtColor);
      });

      // تحديث العقد (Nodes)
      nodes.forEach(n => {
        let id = n.id;
        let ui = nodesUI[id];
        
        let isVis = s.visited.includes(id);
        let isCur = s.currNode === id;
        
        let dist = s.dist[id];
        let distStr = dist === Infinity ? '∞' : dist;

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--text-muted)';
        let txtColor = 'var(--text-primary)';
        let scale = 'scale(1)';
        let distColor = 'var(--text-muted)';

        if (isCur) {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.15)';
          distColor = 'var(--algo-active)';
        } else if (isVis) {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtColor = '#ffffff';
          distColor = 'var(--algo-sorted)';
        }

        ui.circle.setAttribute('fill', fill);
        ui.circle.setAttribute('stroke', stroke);
        ui.txt.setAttribute('fill', txtColor);
        ui.g.style.transform = scale;

        ui.distTxt.textContent = `d=${distStr}`;
        ui.distTxt.setAttribute('fill', distColor);
      });
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
    
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { 
      stopPlay(); 
      isInitialized = false; // نكسر حالة التهيئة لكي يتم توليد ورسم أوزان جديدة بالكامل
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

    window._algoRerenders[2] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية الشجرة متجاوبة
      '<div class="algo-canvas" id="w3-svg-container" style="width:100%; max-width:800px; aspect-ratio: 16 / 9; margin: 0 auto; display:flex; justify-content:center; align-items:center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
        '<svg id="w3-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // حاوية الرموز (Codes) كبطاقات سفلية
      '<div id="w3-codes-container" style="display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top: 15px;"></div>' +

      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.8rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--text-muted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-unprocessed"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-active"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-coded"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w3-exp');
    var svgEl   = container.querySelector('#w3-svg');
    var codesEl = container.querySelector('#w3-codes-container');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // متغيرات هيكل الشجرة
    var chars = ['A', 'B', 'C', 'D', 'E'];
    var allNodes = [];
    var uiNodes = {};
    var uiEdges = {};
    var uiCards = {};

    const NODE_R = 22;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w3-unprocessed"]').textContent = _AL.exp('Pending Node', 'عقدة في الانتظار');
      container.querySelector('[data-algo-text="w3-active"]').textContent      = _AL.exp('Combining / Traversing', 'جاري الدمج / العبور');
      container.querySelector('[data-algo-text="w3-coded"]').textContent       = _AL.exp('Code Assigned', 'تم تعيين الرمز');
    }

    // بناء وتخطيط الشجرة رياضياً
    function buildAndLayoutTree() {
      allNodes = [];
      let pool = [];
      
      // 1. توليد تكرارات عشوائية لضمان التفاعلية (1 إلى 30)
      chars.forEach(c => {
        let freq = Math.floor(Math.random() * 25) + 5;
        let node = { id: c, char: c, freq: freq, isLeaf: true, left: null, right: null, parent: null, x: 0, y: 0 };
        allNodes.push(node);
        pool.push(node);
      });

      let internalId = 1;

      // 2. بناء هيكل الشجرة (من الأسفل للأعلى)
      while (pool.length > 1) {
        // ترتيب تصاعدي لاختيار الأقل
        pool.sort((a, b) => a.freq - b.freq);
        let n1 = pool.shift();
        let n2 = pool.shift();

        let p = {
          id: 'N' + internalId++,
          char: '',
          freq: n1.freq + n2.freq,
          isLeaf: false,
          left: n1, right: n2, parent: null, x: 0, y: 0
        };
        n1.parent = p;
        n2.parent = p;

        allNodes.push(p);
        pool.push(p);
      }

      let root = pool[0];

      // 3. حساب عمق كل عقدة من الجذر
      let maxDepth = 0;
      function calcDepth(node, d) {
        node.depth = d;
        if(d > maxDepth) maxDepth = d;
        if(node.left) calcDepth(node.left, d+1);
        if(node.right) calcDepth(node.right, d+1);
      }
      calcDepth(root, 0);

      // 4. حساب إحداثيات (X) بناءً على الترتيب (In-order)
      let leafCounter = 0;
      function calcX(node) {
        if(node.isLeaf) {
          node.x = leafCounter * 120; // مسافة أفقية مريحة
          leafCounter++;
        } else {
          calcX(node.left);
          calcX(node.right);
          node.x = (node.left.x + node.right.x) / 2;
        }
        // إحداثي Y مبني على العمق
        node.y = node.depth * 75 + 50; 
      }
      calcX(root);

      // 5. توسيط الشجرة كاملة في الـ viewBox (800)
      let minX = Math.min(...allNodes.map(n => n.x));
      let maxX = Math.max(...allNodes.map(n => n.x));
      let offsetX = (800 - (maxX - minX)) / 2 - minX;
      allNodes.forEach(n => n.x += offsetX);

      return root;
    }

    function generateSteps() {
      let root = buildAndLayoutTree();
      steps = [];

      let visNodes = chars.slice(); // الأوراق ظاهرة في البداية
      let visEdges = [];

      steps.push({
        visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [], hlEdges: [], codes: {},
        en: 'Initial characters and their randomized frequencies. We build the tree bottom-up by combining the two lowest frequencies.',
        ar: 'الأحرف وتكراراتها (أوزانها) الأولية. سنبني الشجرة من الأسفل للأعلى بدمج العقدتين الأقل وزناً في كل خطوة.'
      });

      // إعادة محاكاة خطوات الدمج بالترتيب (من الأوراق حتى الجذر)
      // نحتاج قائمة بالعقد الداخلية مرتبة حسب تكوينها
      let internalNodes = allNodes.filter(n => !n.isLeaf);
      
      internalNodes.forEach(p => {
        let n1 = p.left;
        let n2 = p.right;
        visNodes.push(p.id);
        visEdges.push(`${p.id}-${n1.id}`, `${p.id}-${n2.id}`);

        steps.push({
          visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [p.id, n1.id, n2.id], hlEdges: [`${p.id}-${n1.id}`, `${p.id}-${n2.id}`], codes: {},
          en: `Combine the two smallest available nodes (${n1.freq} and ${n2.freq}) to form a parent node with frequency <strong>${p.freq}</strong>.`,
          ar: `ندمج العقدتين الأصغر المتاحتين (${n1.freq} و ${n2.freq}) لإنشاء عقدة أب جديدة بوزن <strong>${p.freq}</strong>.`
        });
      });

      steps.push({
        visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [root.id], hlEdges: [], codes: {},
        en: `The Huffman Tree is structurally complete! The root node holds the total sum of all frequencies (${root.freq}).`,
        ar: `اكتمل هيكل شجرة هوفمان! تحتوي العقدة الجذرية على المجموع الكلي لجميع الأوزان (${root.freq}).`
      });

      // مرحلة تعيين الرموز (Top-Down Traversal)
      let currentCodes = {};

      function traverse(node, currentCode) {
        if(node.isLeaf) {
          currentCodes[node.char] = currentCode;
          steps.push({
            visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [node.id], hlEdges: [], codes: {...currentCodes},
            en: `Reached leaf node '${node.char}'. Assigned code: <strong>${currentCode}</strong>.`,
            ar: `وصلنا إلى العقدة الطرفية '${node.char}'. تم تعيين الرمز: <strong dir="ltr">${currentCode}</strong>.`
          });
        } else {
          // Left Branch (0)
          steps.push({
            visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [node.left.id], hlEdges: [`${node.id}-${node.left.id}`], codes: {...currentCodes},
            en: `Traversing left edge... appending '0'.`,
            ar: `العبور عبر المسار الأيسر... إضافة '0'.`
          });
          traverse(node.left, currentCode + '0');

          // Right Branch (1)
          steps.push({
            visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [node.right.id], hlEdges: [`${node.id}-${node.right.id}`], codes: {...currentCodes},
            en: `Traversing right edge... appending '1'.`,
            ar: `العبور عبر المسار الأيمن... إضافة '1'.`
          });
          traverse(node.right, currentCode + '1');
        }
      }

      steps.push({
        visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [root.id], hlEdges: [], codes: {},
        en: `Now, traverse from the root to leaves to assign binary codes. Left path = 0, Right path = 1.`,
        ar: `الآن، ننتقل من الجذر نزولاً لتعيين الرموز الثنائية. المسار الأيسر = 0، المسار الأيمن = 1.`
      });

      traverse(root, "");

      steps.push({
        visNodes: [...visNodes], visEdges: [...visEdges], hlNodes: [], hlEdges: [], codes: {...currentCodes},
        en: `Huffman Coding is complete! Characters with higher frequencies effectively got shorter codes.`,
        ar: `اكتمل ترميز هوفمان بنجاح! لاحظ كيف أن الحروف ذات التكرار العالي تحصل على رموز أقصر (أقرب للجذر).`
      });
    }

    function buildUI() {
      var ns = 'http://www.w3.org/2000/svg';
      svgEl.innerHTML = '';
      codesEl.innerHTML = '';
      uiNodes = {};
      uiEdges = {};
      uiCards = {};

      var defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = `
        <marker id="w3-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/></marker>
        <marker id="w3-arr-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-active)"/></marker>
      `;
      svgEl.appendChild(defs);

      var edgesGroup = document.createElementNS(ns, 'g');
      var nodesGroup = document.createElementNS(ns, 'g');

      // 1. بناء الخطوط (في الخلف) مع علامات 0 و 1
      allNodes.forEach(p => {
        if (!p.isLeaf) {
          [p.left, p.right].forEach((child, idx) => {
            let edgeId = `${p.id}-${child.id}`;
            let dx = child.x - p.x;
            let dy = child.y - p.y;
            let dist = Math.hypot(dx, dy);
            
            let x1 = p.x + (dx/dist)*NODE_R;
            let y1 = p.y + (dy/dist)*NODE_R;
            let x2 = child.x - (dx/dist)*(NODE_R + 4);
            let y2 = child.y - (dy/dist)*(NODE_R + 4);

            let g = document.createElementNS(ns, 'g');
            g.style.transition = 'opacity 0.4s ease';

            let line = document.createElementNS(ns, 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.style.transition = 'all 0.3s ease';

            // نص 0 لليسار و 1 لليمين
            let lbl = document.createElementNS(ns, 'text');
            let mx = (x1 + x2)/2 + (idx === 0 ? -12 : 12);
            let my = (y1 + y2)/2 - 5;
            lbl.setAttribute('x', mx); lbl.setAttribute('y', my);
            lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('dominant-baseline', 'middle');
            lbl.setAttribute('font-family', "'JetBrains Mono', monospace");
            lbl.setAttribute('font-size', '16px'); lbl.setAttribute('font-weight', '800');
            lbl.textContent = idx === 0 ? '0' : '1';
            lbl.style.transition = 'fill 0.3s ease';

            g.appendChild(line); g.appendChild(lbl);
            edgesGroup.appendChild(g);
            uiEdges[edgeId] = { g, line, lbl };
          });
        }
      });

      // 2. بناء العقد
      allNodes.forEach(n => {
        let g = document.createElementNS(ns, 'g');
        g.style.transformOrigin = `${n.x}px ${n.y}px`;
        g.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
        
        let circ = document.createElementNS(ns, 'circle');
        circ.setAttribute('cx', n.x); circ.setAttribute('cy', n.y);
        circ.setAttribute('r', NODE_R);
        circ.style.transition = 'all 0.3s ease';
        
        let freqTxt = document.createElementNS(ns, 'text');
        freqTxt.setAttribute('x', n.x); freqTxt.setAttribute('y', n.y);
        freqTxt.setAttribute('dy', '.1em'); freqTxt.setAttribute('text-anchor', 'middle'); freqTxt.setAttribute('dominant-baseline', 'middle');
        freqTxt.setAttribute('font-family', "'JetBrains Mono', monospace");
        freqTxt.setAttribute('font-size', '15px'); freqTxt.setAttribute('font-weight', '800');
        freqTxt.textContent = n.freq;
        freqTxt.style.transition = 'fill 0.3s ease';

        g.appendChild(circ); g.appendChild(freqTxt);

        let charTxt = null;
        if(n.isLeaf) {
          charTxt = document.createElementNS(ns, 'text');
          charTxt.setAttribute('x', n.x); charTxt.setAttribute('y', n.y + NODE_R + 15);
          charTxt.setAttribute('text-anchor', 'middle'); charTxt.setAttribute('dominant-baseline', 'middle');
          charTxt.setAttribute('font-family', "'Cairo', sans-serif");
          charTxt.setAttribute('font-size', '18px'); charTxt.setAttribute('font-weight', 'bold');
          charTxt.setAttribute('fill', 'var(--text-primary)');
          charTxt.textContent = n.char;
          g.appendChild(charTxt);
        }

        nodesGroup.appendChild(g);
        uiNodes[n.id] = { g, circ, freqTxt, charTxt };
      });

      svgEl.appendChild(edgesGroup);
      svgEl.appendChild(nodesGroup);

      // 3. بناء بطاقات الرموز السفلية
      chars.forEach(c => {
        let card = document.createElement('div');
        card.style.background = 'var(--bg-elevated)';
        card.style.border = '2px solid var(--algo-border)';
        card.style.borderRadius = '8px';
        card.style.padding = '8px 16px';
        card.style.minWidth = '60px';
        card.style.transition = 'all 0.3s ease';

        let cTitle = document.createElement('div');
        cTitle.textContent = c;
        cTitle.style.fontWeight = '800';
        cTitle.style.color = 'var(--text-primary)';
        cTitle.style.marginBottom = '4px';

        let cCode = document.createElement('div');
        cCode.textContent = '-';
        cCode.style.fontFamily = "'JetBrains Mono', monospace";
        cCode.style.color = 'var(--text-muted)';
        cCode.style.fontWeight = '700';

        card.appendChild(cTitle);
        card.appendChild(cCode);
        codesEl.appendChild(card);

        uiCards[c] = { card, cCode };
      });

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildUI();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // 1. تحديث الخطوط
      Object.keys(uiEdges).forEach(edgeId => {
        let ui = uiEdges[edgeId];
        let isVis = s.visEdges.includes(edgeId);
        let isHl = s.hlEdges.includes(edgeId);

        ui.g.style.opacity = isVis ? '1' : '0';
        
        let color = isHl ? 'var(--algo-active)' : 'var(--text-muted)';
        let sw = isHl ? '3' : '2';
        let marker = isHl ? 'url(#w3-arr-active)' : 'url(#w3-arr-muted)';

        ui.line.setAttribute('stroke', color);
        ui.line.setAttribute('stroke-width', sw);
        ui.line.setAttribute('marker-end', marker);
        ui.lbl.setAttribute('fill', color);
      });

      // 2. تحديث العقد
      allNodes.forEach(n => {
        let ui = uiNodes[n.id];
        let isVis = s.visNodes.includes(n.id);
        
        ui.g.style.opacity = isVis ? '1' : '0';

        let isHl = s.hlNodes.includes(n.id);
        let hasCode = n.isLeaf && s.codes[n.char] !== undefined;

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--algo-border)';
        let txtFill = 'var(--text-primary)';
        let scale = 'scale(1)';

        if(isHl) {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.15)';
        } else if (hasCode) {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtFill = '#ffffff';
        }

        ui.circ.setAttribute('fill', fill);
        ui.circ.setAttribute('stroke', stroke);
        ui.circ.setAttribute('stroke-width', isHl || hasCode ? '3' : '2');
        ui.freqTxt.setAttribute('fill', txtFill);
        ui.g.style.transform = scale;
      });

      // 3. تحديث البطاقات
      chars.forEach(c => {
        let ui = uiCards[c];
        let code = s.codes[c];
        if(code !== undefined) {
          ui.cCode.textContent = code;
          ui.cCode.style.color = 'var(--algo-sorted)';
          ui.card.style.borderColor = 'var(--algo-sorted)';
        } else {
          ui.cCode.textContent = '-';
          ui.cCode.style.color = 'var(--text-muted)';
          ui.card.style.borderColor = 'var(--algo-border)';
        }
      });
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
    
    // عند إعادة الضبط، نكسر التهيئة لتوليد تكرارات وبناء شجرة جديدة بالكامل
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