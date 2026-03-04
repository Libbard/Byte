// M13_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T02:05:25
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
window._algoTitles[1] = { en: 'Backtracking', ar: 'مشكلة الملكات الأربع - التراجع' };
window._algoTitles[2] = { en: 'Branch-and-Bound: Assignment Problem', ar: 'التفرع والحد: مشكلة التعيين' };
window._algoTitles[3] = { en: 'TSP: Twice-Around-the-Tree Approximation', ar: 'TSP: خوارزمية الشجرة المزدوجة التقريبية' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 16:9
      '<div class="algo-canvas" id="w1-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-visited"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-pruned"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-solution"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w1-exp');
    var svgEl   = container.querySelector('#w1-svg');
    var counter = container.querySelector('[data-algo-counter]');
 
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    const N = 4;
    const RADIUS = 6; // حجم العقد في الشجرة (61 عقدة إجمالاً)
    
    // هياكل البيانات للتوليد والـ SVG
    var nodeMap = {};
    var edges = [];
    var uiNodes = {};
    var uiEdges = {};
    var uiBoard = [];
    var uiQueens = [];
    var idGen = 0;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w1-current"]').textContent  = _AL.exp('Testing', 'قيد التجربة');
      container.querySelector('[data-algo-text="w1-visited"]').textContent  = _AL.exp('Valid (Exploring)', 'صالح (جاري الاستكشاف)');
      container.querySelector('[data-algo-text="w1-pruned"]').textContent   = _AL.exp('Pruned (Conflict)', 'تم تقليمه (تضارب)');
      container.querySelector('[data-algo-text="w1-solution"]').textContent = _AL.exp('Solution', 'مسار الحل');
    }

    function isValid(row, col, board) {
      for (let i = 0; i < row; i++) {
        if (board[i] === col || Math.abs(board[i] - col) === Math.abs(i - row)) {
          return false;
        }
      }
      return true;
    }

    // بناء شجرة مساحة الحالة (State-Space Tree) وتوليد الخطوات
    function generateSteps() {
      steps = [];
      nodeMap = {};
      edges = [];
      idGen = 0;
      
      let rootId = 'root';
      nodeMap[rootId] = { id: rootId, row: -1, col: -1, level: 0, parentId: null, children: [], weight: 0, x: 0, y: 0 };
      
      let board = [-1, -1, -1, -1];
      let nodeStates = {};
      nodeStates[rootId] = 'visited';
      let solutions = [];

      steps.push({
        board: [...board], testQ: null, states: {...nodeStates},
        en: 'Starting the Backtracking algorithm. The goal is to safely place 4 queens on a 4x4 board.',
        ar: 'بدء خوارزمية التراجع (Backtracking). الهدف: وضع 4 ملكات بأمان على رقعة 4x4.'
      });

      function backtrack(row, parentId) {
        if (row === N) {
          let curr = parentId;
          let path = [];
          while (curr !== 'root') {
            path.push(curr);
            curr = nodeMap[curr].parentId;
          }
          path.forEach(id => nodeStates[id] = 'solution');
          solutions.push(path);

          steps.push({
            board: [...board], testQ: null, states: {...nodeStates},
            en: '<strong>Solution found!</strong> All queens are placed safely.',
            ar: '<strong>تم العثور على حل!</strong> تم وضع جميع الملكات بأمان.'
          });

          // التراجع بعد إيجاد الحل للاستمرار
          path.forEach(id => nodeStates[id] = 'visited');
          return;
        }

        for (let col = 0; col < N; col++) {
          let id = 'n' + (++idGen);
          nodeMap[id] = { id: id, row: row, col: col, level: row + 1, parentId: parentId, children: [], weight: 0, x: 0, y: 0 };
          nodeMap[parentId].children.push(id);
          edges.push({ from: parentId, to: id });

          nodeStates[id] = 'current';

          steps.push({
            board: [...board], testQ: { r: row, c: col, status: 'testing' }, states: {...nodeStates},
            en: `Trying to place queen at row ${row}, column ${col}.`,
            ar: `محاولة وضع الملكة في الصف ${row}، العمود ${col}.`
          });

          if (isValid(row, col, board)) {
            board[row] = col;
            nodeStates[id] = 'visited';

            steps.push({
              board: [...board], testQ: { r: row, c: col, status: 'valid' }, states: {...nodeStates},
              en: `Position is valid. Proceeding to row ${row + 1}.`,
              ar: `الموضع آمن (لا يوجد تضارب). ننتقل للصف ${row + 1}.`
            });

            backtrack(row + 1, id);

            // تراجع (Backtrack)
            board[row] = -1;
          } else {
            nodeStates[id] = 'pruned';
            steps.push({
              board: [...board], testQ: { r: row, c: col, status: 'conflict' }, states: {...nodeStates},
              en: `<strong>Conflict!</strong> Queen at (${row}, ${col}) is under attack. Pruning this branch.`,
              ar: `<strong>تضارب!</strong> الملكة في (${row}, ${col}) مهددة. يتم تقليم (إلغاء) هذا المسار.`
            });
          }
        }
      }

      backtrack(0, rootId);

      // الخطوة النهائية: عرض كل الحلول
      let finalStates = {};
      Object.keys(nodeMap).forEach(k => finalStates[k] = 'faded'); // بهتان للكل
      finalStates[rootId] = 'solution';
      solutions.forEach(path => path.forEach(id => finalStates[id] = 'solution'));

      steps.push({
        board: [-1,-1,-1,-1], testQ: null, states: finalStates,
        en: `Exploration complete. Found exactly <strong>${solutions.length}</strong> distinct solutions.`,
        ar: `اكتمل البحث. تم العثور على <strong>${solutions.length}</strong> حلول مختلفة بنجاح.`
      });

      // --- حساب تخطيط الشجرة (Tree Layout) هندسياً ---
      // 1. حساب أوزان الفروع (عدد الأوراق) لضمان عدم التداخل
      function calcWeight(nodeId) {
        let n = nodeMap[nodeId];
        if (n.children.length === 0) {
          n.weight = 1;
        } else {
          n.weight = 0;
          n.children.forEach(cId => {
            calcWeight(cId);
            n.weight += nodeMap[cId].weight;
          });
        }
      }
      calcWeight(rootId);

      // 2. توزيع العقد على محور X و Y
      function assignCoords(nodeId, startX, endX) {
        let n = nodeMap[nodeId];
        n.x = (startX + endX) / 2;
        n.y = 40 + n.level * 80; // 5 مستويات: 40, 120, 200, 280, 360

        let currX = startX;
        n.children.forEach(cId => {
          let cNode = nodeMap[cId];
          let wRatio = cNode.weight / n.weight;
          let width = wRatio * (endX - startX);
          assignCoords(cId, currX, currX + width);
          currX += width;
        });
      }
      // نعطي الشجرة عرض 600 بكسل (نترك 200 بكسل على اليمين للوحة)
      assignCoords(rootId, 20, 580);
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      uiNodes = {};
      uiEdges = {};
      uiBoard = [];
      uiQueens = [];

      // 1. بناء الشجرة (خلفية)
      let edgesG = makeSVG('g', {});
      edges.forEach(e => {
        let p1 = nodeMap[e.from];
        let p2 = nodeMap[e.to];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.hypot(dx, dy);
        
        let x1 = p1.x + (dx/dist)*RADIUS;
        let y1 = p1.y + (dy/dist)*RADIUS;
        let x2 = p2.x - (dx/dist)*RADIUS;
        let y2 = p2.y - (dy/dist)*RADIUS;

        let line = makeSVG('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--text-muted)', 'stroke-width': 1.5 });
        line.style.opacity = '0';
        edgesG.appendChild(line);
        uiEdges[`${e.from}-${e.to}`] = line;
      });

      let nodesG = makeSVG('g', {});
      Object.keys(nodeMap).forEach(id => {
        let n = nodeMap[id];
        let circ = makeSVG('circle', { cx: n.x, cy: n.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--text-muted)', 'stroke-width': 1.5 });
        circ.style.opacity = '0';
        circ.style.transformOrigin = `${n.x}px ${n.y}px`;
        nodesG.appendChild(circ);
        uiNodes[id] = circ;
      });

      svgEl.appendChild(edgesG);
      svgEl.appendChild(nodesG);

      // 2. بناء لوحة الشطرنج المصغرة 4x4 (على اليمين)
      let boardG = makeSVG('g', { transform: 'translate(600, 40)' });
      
      // إطار اللوحة
      let boardOutline = makeSVG('rect', { x: 0, y: 0, width: 160, height: 160, fill: 'none', stroke: 'var(--algo-border)', 'stroke-width': 2, rx: 4 });
      
      for(let r=0; r<N; r++) {
        uiBoard[r] = [];
        uiQueens[r] = [];
        for(let c=0; c<N; c++) {
          let isDark = (r + c) % 2 !== 0;
          let fill = isDark ? 'var(--bg-elevated)' : 'var(--algo-canvas-bg)';
          
          let cell = makeSVG('rect', { x: c*40, y: r*40, width: 40, height: 40, fill: fill });
          
          // الملكة (نص Unicode)
          let queen = makeSVG('text', { x: c*40 + 20, y: r*40 + 20, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--brand-500)', 'font-size': '26px' });
          queen.textContent = '♛';
          queen.style.opacity = '0'; // مخفية البداية

          boardG.appendChild(cell);
          boardG.appendChild(queen);
          
          uiBoard[r][c] = cell;
          uiQueens[r][c] = queen;
        }
      }
      boardG.appendChild(boardOutline);
      
      // نص يشرح اللوحة
      let boardLbl = makeSVG('text', { x: 80, y: 190, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': 'bold' });
      boardLbl.textContent = 'Board State';
      boardG.appendChild(boardLbl);

      svgEl.appendChild(boardG);

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // 1. تحديث الشجرة (العقد والخطوط)
      Object.keys(nodeMap).forEach(id => {
        let state = s.states[id];
        let circ = uiNodes[id];

        if (state) {
          circ.style.opacity = state === 'faded' ? '0.2' : '1';
          let fill = 'var(--bg-elevated)';
          let stroke = 'var(--text-muted)';
          let scale = 'scale(1)';

          if (state === 'current') {
            fill = 'var(--algo-active)'; stroke = '#ffffff'; scale = 'scale(1.3)';
          } else if (state === 'visited') {
            fill = 'var(--brand-500)'; stroke = '#ffffff';
          } else if (state === 'pruned') {
            fill = 'var(--algo-compare)'; stroke = '#ffffff';
          } else if (state === 'solution') {
            fill = 'var(--algo-sorted)'; stroke = '#ffffff'; scale = 'scale(1.3)';
          }

          circ.setAttribute('fill', fill);
          circ.setAttribute('stroke', stroke);
          circ.style.transform = scale;
        } else {
          circ.style.opacity = '0';
        }
      });

      edges.forEach(e => {
        let line = uiEdges[`${e.from}-${e.to}`];
        let toState = s.states[e.to];
        if (toState) {
          line.style.opacity = toState === 'faded' ? '0.1' : '1';
          let color = 'var(--text-muted)';
          let sw = '1.5';
          if (toState === 'pruned') color = 'var(--algo-compare)';
          if (toState === 'solution') { color = 'var(--algo-sorted)'; sw = '2.5'; }
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', sw);
        } else {
          line.style.opacity = '0';
        }
      });

      // 2. تحديث لوحة الشطرنج
      for(let r=0; r<N; r++) {
        for(let c=0; c<N; c++) {
          let queen = uiQueens[r][c];
          let isPlaced = s.board[r] === c;
          let isTesting = s.testQ && s.testQ.r === r && s.testQ.c === c;
          
          if (isPlaced) {
            queen.style.opacity = '1';
            queen.setAttribute('fill', s.states['root'] === 'solution' ? 'var(--algo-sorted)' : 'var(--brand-500)');
          } else if (isTesting) {
            queen.style.opacity = '1';
            if (s.testQ.status === 'testing') queen.setAttribute('fill', 'var(--algo-active)');
            if (s.testQ.status === 'valid') queen.setAttribute('fill', 'var(--brand-500)');
            if (s.testQ.status === 'conflict') queen.setAttribute('fill', 'var(--algo-compare)');
          } else {
            queen.style.opacity = '0';
          }
        }
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
    
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { 
      stopPlay(); 
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
      
      // حاوية متجاوبة 16:9 مع لوحة الـ Z (Upper Bound)
      '<div class="algo-canvas" id="w2-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w2-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
        '<div id="w2-z-board" style="position:absolute; top:20px; right:20px; padding: 10px 20px; background:var(--bg-elevated); border:2px solid var(--algo-border); border-radius:8px; font-family:\'JetBrains Mono\', monospace; font-size:15px; font-weight:800; color:var(--algo-text); box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.4s ease;">' +
          'Z = <span id="w2-z-val" style="color:var(--text-muted);">∞</span>' +
        '</div>' +
      '</div>' +
      
      // دليل الألوان (متوافق بصرياً مع الدوائر)
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--bg-elevated);border:1px solid var(--text-muted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-fringe"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-expanded"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-pruned"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-solution"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w2-exp');
    var svgEl   = container.querySelector('#w2-svg');
    var zValEl  = container.querySelector('#w2-z-val');
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    const RADIUS = 28;
    var allNodes = [];
    var allEdges = [];
    var uiNodes = {};
    var uiEdges = {};

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w2-fringe"]').textContent   = _AL.exp('In Queue (Fringe)', 'في قائمة الانتظار');
      container.querySelector('[data-algo-text="w2-current"]').textContent  = _AL.exp('Evaluating', 'جاري التقييم');
      container.querySelector('[data-algo-text="w2-expanded"]').textContent = _AL.exp('Expanded', 'تم تفريعها');
      container.querySelector('[data-algo-text="w2-pruned"]').textContent   = _AL.exp('Pruned (lb ≥ Z)', 'مُقلّمة (مستبعدة)');
      container.querySelector('[data-algo-text="w2-solution"]').textContent = _AL.exp('Solution Found', 'تم إيجاد الحل');
    }

    // الرياضيات المتجهية لرسم الخطوط بشكل مثالي (Golden Rule 2)
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

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    // هندسة الشجرة وتوليد القيم (لضمان سيناريو تعليمي متكامل)
    function setupTreeData() {
      let base = Math.floor(Math.random() * 15) + 10;
      
      // نبني شجرة تضمن "القفز" لفرع آخر، ثم إيجاد حل، ثم "التقليم"
      allNodes = [
        { id: 'n0', p: null, lb: base,       x: 400, y: 70 },
        { id: 'n1', p: 'n0', lb: base + 4,   x: 220, y: 200 },
        { id: 'n2', p: 'n0', lb: base + 2,   x: 400, y: 200 },
        { id: 'n3', p: 'n0', lb: base + 8,   x: 580, y: 200 },
        { id: 'n6', p: 'n1', lb: base + 4,   x: 150, y: 340, isLeaf: true }, // الحل الأمثل!
        { id: 'n7', p: 'n1', lb: base + 6,   x: 290, y: 340 },
        { id: 'n4', p: 'n2', lb: base + 5,   x: 350, y: 340 },
        { id: 'n5', p: 'n2', lb: base + 7,   x: 450, y: 340 }
      ];

      allEdges = [];
      allNodes.forEach(n => {
        if (n.p) {
          let parent = allNodes.find(pn => pn.id === n.p);
          allEdges.push({ id: `${n.p}-${n.id}`, u: parent, v: n });
        }
      });
    }

    function generateSteps() {
      setupTreeData();
      steps = [];
      let states = {};
      allNodes.forEach(n => states[n.id] = 'hidden');
      
      let pushStep = (en, ar, Z = '∞') => {
        steps.push({ states: {...states}, Z: Z, en: en, ar: ar });
      };

      // 1. البداية
      states['n0'] = 'fringe';
      pushStep(
        `Start Branch and Bound. Root node represents the entire problem space. Lower Bound (lb) = ${allNodes[0].lb}.`,
        `بدء خوارزمية التفرع والتحديد. العقدة الجذرية تمثل المشكلة بالكامل. الحد الأدنى (lb) = ${allNodes[0].lb}.`
      );

      // 2. تفريع الجذر
      states['n0'] = 'expanded';
      ['n1', 'n2', 'n3'].forEach(id => states[id] = 'fringe');
      pushStep(
        `Expand the root. We generate 3 subproblems. Using Best-First Search, we pick the one with the lowest <strong>lb</strong>.`,
        `تفريع الجذر لإنشاء 3 مشاكل فرعية. باستخدام (البحث الأفضل أولاً)، نختار العقدة صاحبة أقل حد أدنى <strong>lb</strong>.`
      );

      // 3. اختيار n2 (الأقل)
      states['n2'] = 'current';
      let lb_n2 = allNodes.find(n => n.id === 'n2').lb;
      pushStep(
        `Select node with <strong>lb = ${lb_n2}</strong> for expansion.`,
        `تحديد العقدة ذات <strong>lb = ${lb_n2}</strong> لتفريعها.`
      );

      // 4. تفريع n2
      states['n2'] = 'expanded';
      ['n4', 'n5'].forEach(id => states[id] = 'fringe');
      pushStep(
        `Expanded. Now the fringe (queue) contains LBs: [${allNodes.filter(n=>states[n.id]==='fringe').map(n=>n.lb).join(', ')}].`,
        `تم التفريع. قائمة الانتظار تحتوي الآن على الحدود الدنيا: [${allNodes.filter(n=>states[n.id]==='fringe').map(n=>n.lb).join(', ')}].`
      );

      // 5. القفز إلى n1 (وهذا هو سحر Branch & Bound)
      states['n1'] = 'current';
      let lb_n1 = allNodes.find(n => n.id === 'n1').lb;
      pushStep(
        `Notice the jump! The global minimum in the fringe is now <strong>lb = ${lb_n1}</strong> in a different branch.`,
        `لاحظ القفزة! الحد الأدنى الإجمالي في القائمة أصبح <strong>lb = ${lb_n1}</strong> في فرع مختلف تماماً.`
      );

      // 6. تفريع n1
      states['n1'] = 'expanded';
      ['n6', 'n7'].forEach(id => states[id] = 'fringe');
      pushStep(
        `Expanded. Fringe LBs: [${allNodes.filter(n=>states[n.id]==='fringe').map(n=>n.lb).join(', ')}].`,
        `تم التفريع. قائمة الانتظار: [${allNodes.filter(n=>states[n.id]==='fringe').map(n=>n.lb).join(', ')}].`
      );

      // 7. اختيار n6 (الحل)
      states['n6'] = 'current';
      let optLb = allNodes.find(n => n.id === 'n6').lb;
      pushStep(
        `Select node with <strong>lb = ${optLb}</strong>. Wait, this is a leaf node!`,
        `تحديد العقدة ذات <strong>lb = ${optLb}</strong>. لحظة، هذه عقدة ورقية (نهاية المسار)!`
      );

      // 8. إعلان الحل وتحديث Z
      states['n6'] = 'solution';
      pushStep(
        `<strong>Solution Found!</strong> We update our Upper Bound (Z) to <strong>${optLb}</strong>. Any path costing more is useless.`,
        `<strong>تم العثور على حل!</strong> نُحدّث الحد الأعلى (Z) ليصبح <strong>${optLb}</strong>. أي مسار يكلف أكثر من ذلك لا فائدة منه.`,
        optLb
      );

      // 9. التقليم (Pruning)
      allNodes.forEach(n => {
        if (states[n.id] === 'fringe' && n.lb >= optLb) {
          states[n.id] = 'pruned';
        }
      });
      pushStep(
        `<strong>Pruning!</strong> All remaining nodes in the fringe have lb ≥ ${optLb}. We prune (discard) them entirely. Search Complete!`,
        `<strong>عملية التقليم (Pruning)!</strong> جميع العقد المتبقية تمتلك lb ≥ ${optLb}. يتم استبعادها بالكامل. اكتمل البحث!`,
        optLb
      );
    }

    function buildUI() {
      svgEl.innerHTML = '';
      uiNodes = {};
      uiEdges = {};

      let edgesG = makeSVG('g', {});
      let nodesG = makeSVG('g', {});

      // 1. بناء الخطوط بدقة
      allEdges.forEach(e => {
        let coords = getEdgeCoords(e.u, e.v, RADIUS);
        let line = makeSVG('line', { x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2, stroke: 'var(--text-muted)', 'stroke-width': 2 });
        edgesG.appendChild(line);
        uiEdges[e.id] = line;
      });

      // 2. بناء العقد
      allNodes.forEach(n => {
        let g = makeSVG('g', { 'transform-origin': `${n.x}px ${n.y}px` });
        
        let circ = makeSVG('circle', { cx: n.x, cy: n.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 2 });
        
        // النص (lb=...)
        let txt = makeSVG('text', { x: n.x, y: n.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': 'bold' });
        txt.textContent = `lb=${n.lb}`;

        // علامة التقليم (X) مخفية افتراضياً
        let crossG = makeSVG('g', { opacity: '0' });
        let offset = RADIUS * 0.6;
        let l1 = makeSVG('line', { x1: n.x - offset, y1: n.y - offset, x2: n.x + offset, y2: n.y + offset, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round' });
        let l2 = makeSVG('line', { x1: n.x + offset, y1: n.y - offset, x2: n.x - offset, y2: n.y + offset, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round' });
        crossG.appendChild(l1); crossG.appendChild(l2);

        g.appendChild(circ);
        g.appendChild(txt);
        g.appendChild(crossG);
        nodesG.appendChild(g);

        uiNodes[n.id] = { g, circ, txt, crossG };
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

      // تحديث لوحة الـ Z (HUD)
      zValEl.textContent = s.Z;
      zValEl.style.color = s.Z === '∞' ? 'var(--text-muted)' : 'var(--algo-sorted)';

      // 1. تحديث الخطوط
      allEdges.forEach(e => {
        let line = uiEdges[e.id];
        let toState = s.states[e.v.id];
        let fromState = s.states[e.u.id];

        if (toState === 'hidden') {
          line.style.opacity = '0';
        } else {
          line.style.opacity = '1';
          let color = 'var(--text-muted)';
          let sw = '2';
          let dash = '0';

          if (toState === 'pruned') {
            color = 'var(--algo-compare)'; dash = '5,5'; opacity = '0.5';
          } else if (toState === 'solution' || fromState === 'solution') {
            color = 'var(--algo-sorted)'; sw = '3';
          } else if (toState === 'current') {
            color = 'var(--algo-active)'; sw = '3';
          }

          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', sw);
          line.setAttribute('stroke-dasharray', dash);
        }
      });

      // 2. تحديث العقد (إدارة الحالة النظيفة State Management)
      allNodes.forEach(n => {
        let state = s.states[n.id];
        let ui = uiNodes[n.id];

        if (state === 'hidden') {
          ui.g.style.opacity = '0';
          ui.g.style.transform = 'scale(0.5)'; // تأثير انبثاق (Pop-in) جميل عند الظهور
          return;
        }

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--text-muted)';
        let txtColor = 'var(--algo-text)';
        let scale = 'scale(1)';
        let opacity = '1';
        let showCross = false;

        if (state === 'fringe') {
          stroke = 'var(--text-muted)';
        } else if (state === 'current') {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.15)';
        } else if (state === 'expanded') {
          fill = 'var(--brand-500)'; stroke = '#ffffff'; txtColor = '#ffffff';
        } else if (state === 'pruned') {
          fill = 'var(--algo-compare)'; stroke = 'var(--algo-compare)'; txtColor = 'transparent'; showCross = true; opacity = '0.7';
        } else if (state === 'solution') {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtColor = '#ffffff'; scale = 'scale(1.2)';
        }

        ui.g.style.opacity = opacity;
        ui.g.style.transform = scale;
        ui.circ.setAttribute('fill', fill);
        ui.circ.setAttribute('stroke', stroke);
        ui.txt.setAttribute('fill', txtColor);
        ui.crossG.style.opacity = showCross ? '1' : '0';
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
    
    // Reset يعيد توليد القيم وبناء سيناريو جديد بأرقام مختلفة!
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

    window._algoRerenders[2] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // التغيير الجوهري هنا: استخدام CSS Grid لضمان بقاء اللوحتين جنباً إلى جنب (أفقياً) دائماً
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; max-width: 900px; margin: 0 auto; margin-top: 15px;">' +
        // اللوحة الأولى: MST
        '<div style="display: flex; flex-direction: column; align-items: center; min-width: 0;">' +
          '<h5 data-algo-text="w3-mst-title" style="font-size: 0.9rem; margin-bottom: 8px; font-weight: 800; color: var(--text-primary); text-align: center;"></h5>' +
          '<div class="algo-canvas" style="width: 100%; aspect-ratio: 4/3; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow: visible;">' +
            '<svg id="w3-mst-svg" width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" style="overflow: visible;"></svg>' +
          '</div>' +
        '</div>' +
        // اللوحة الثانية: Tour
        '<div style="display: flex; flex-direction: column; align-items: center; min-width: 0;">' +
          '<h5 data-algo-text="w3-tour-title" style="font-size: 0.9rem; margin-bottom: 8px; font-weight: 800; color: var(--text-primary); text-align: center;"></h5>' +
          '<div class="algo-canvas" style="width: 100%; aspect-ratio: 4/3; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow: visible;">' +
            '<svg id="w3-tour-svg" width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" style="overflow: visible;"></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex; justify-content:center; gap:15px; margin-top:20px; font-size:0.85rem; flex-wrap:wrap; color: var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-mst-edge"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-tour-edge"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-shortcut-edge"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-visited-node"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w3-current-node"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w3-exp');
    var mstSvg  = container.querySelector('#w3-mst-svg');
    var tourSvg = container.querySelector('#w3-tour-svg');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    const RADIUS = 18;
    // التغيير الثاني: تدوير إحداثيات الشجرة لتكون أفقية (من اليسار لليمين) بدلاً من عمودية
    var initialNodes = [
      { id: 0, x: 80,  y: 150 },
      { id: 1, x: 200, y: 220 },
      { id: 2, x: 200, y: 80 },
      { id: 3, x: 320, y: 260 },
      { id: 4, x: 320, y: 40 }
    ];

    var allEdges = [
      { u: 0, v: 1, isMST: true },
      { u: 0, v: 2, isMST: true },
      { u: 1, v: 3, isMST: true },
      { u: 2, v: 4, isMST: true },
      { u: 1, v: 2, isMST: false }, 
      { u: 3, v: 4, isMST: false }  
    ];

    var tourUiNodes = {};
    var tourUiLines = [];

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w3-mst-title"]').textContent       = _AL.exp('Graph & Minimum Spanning Tree', 'شجرة الامتداد الصغرى');
      container.querySelector('[data-algo-text="w3-tour-title"]').textContent      = _AL.exp('Euler Tour & Hamiltonian Cycle', 'جولة أويلر ودورة هاميلتون');
      container.querySelector('[data-algo-text="w3-mst-edge"]').textContent        = _AL.exp('MST Edge', 'حافة الشجرة');
      container.querySelector('[data-algo-text="w3-tour-edge"]').textContent       = _AL.exp('Tour Edge', 'مسار عادي');
      container.querySelector('[data-algo-text="w3-shortcut-edge"]').textContent   = _AL.exp('Shortcut (TSP)', 'اختصار مباشر');
      container.querySelector('[data-algo-text="w3-visited-node"]').textContent    = _AL.exp('Visited', 'تمت زيارتها');
      container.querySelector('[data-algo-text="w3-current-node"]').textContent    = _AL.exp('Current', 'العقدة الحالية');
    }

    function generateSteps() {
      steps = [];

      let adj = {0:[], 1:[], 2:[], 3:[], 4:[]};
      allEdges.forEach(e => {
        if(e.isMST) {
          adj[e.u].push(e.v);
          adj[e.v].push(e.u);
        }
      });

      steps.push({
        phase: 'intro', eulerPath: [], hamPath: [], currNode: null,
        en: 'We start with a graph and its Minimum Spanning Tree (MST) already calculated.',
        ar: 'نبدأ برسم بياني تم حساب شجرة الامتداد الصغرى (MST) الخاصة به مسبقاً.'
      });

      let eulerPath = [];
      function dfs(u, p) {
        eulerPath.push(u);
        steps.push({
          phase: 'euler', eulerPath: [...eulerPath], hamPath: [], currNode: u,
          en: `<strong>Euler Tour:</strong> DFS visits node <strong>${u}</strong>.`,
          ar: `<strong>جولة أويلر:</strong> البحث بالعمق يزور العقدة <strong>${u}</strong>.`
        });

        let neighbors = adj[u].slice().sort((a,b) => a-b);
        for(let v of neighbors) {
          if(v !== p) {
            dfs(v, u);
            eulerPath.push(u); 
            steps.push({
              phase: 'euler', eulerPath: [...eulerPath], hamPath: [], currNode: u,
              en: `<strong>Euler Tour:</strong> Backtrack to node <strong>${u}</strong>.`,
              ar: `<strong>جولة أويلر:</strong> التراجع (Backtrack) إلى العقدة <strong>${u}</strong>.`
            });
          }
        }
      }
      dfs(0, -1);

      steps.push({
        phase: 'ham_start', eulerPath: [...eulerPath], hamPath: [], currNode: null,
        en: 'Euler Tour traverses every MST edge twice. Now, we convert it to a <strong>Hamiltonian Cycle</strong> by taking shortcuts.',
        ar: 'جولة أويلر تعبر كل حافة في الشجرة مرتين. الآن، سنحولها إلى <strong>دورة هاميلتون</strong> عبر أخذ اختصارات وتخطي العقد المكررة.'
      });

      let hamPath = [];
      let visited = new Set();
      let lastNode = null;

      for(let i = 0; i < eulerPath.length; i++) {
        let u = eulerPath[i];
        if(!visited.has(u)) {
          visited.add(u);
          hamPath.push(u);
          
          let isShortcut = false;
          if (lastNode !== null) {
            let isMst = allEdges.some(e => e.isMST && ((e.u === lastNode && e.v === u) || (e.u === u && e.v === lastNode)));
            isShortcut = !isMst;
          }

          steps.push({
            phase: 'hamiltonian', eulerPath: [...eulerPath], hamPath: [...hamPath], currNode: u,
            en: `Node <strong>${u}</strong> is unvisited. Add it to the TSP tour.` + (isShortcut ? ` Taking a <strong>shortcut</strong>!` : ''),
            ar: `العقدة <strong>${u}</strong> جديدة. أضفها لمسار البائع المتجول.` + (isShortcut ? ` (استخدام <strong>مسار مختصر</strong>!)` : '')
          });
          lastNode = u;
        } else {
          steps.push({
            phase: 'hamiltonian', eulerPath: [...eulerPath], hamPath: [...hamPath], currNode: lastNode,
            en: `Node <strong>${u}</strong> is already visited. Skip it to avoid cycles!`,
            ar: `العقدة <strong>${u}</strong> تمت زيارتها بالفعل. نتخطاها لتجنب التكرار!`
          });
        }
      }

      let firstNode = hamPath[0];
      hamPath.push(firstNode);
      steps.push({
        phase: 'done', eulerPath: [...eulerPath], hamPath: [...hamPath], currNode: firstNode,
        en: `Close the cycle back to node <strong>${firstNode}</strong>. This completes our <strong>2-Approximation TSP</strong>!`,
        ar: `نغلق الدورة بالعودة للعقدة <strong>${firstNode}</strong>. هذا يكمل خوارزمية التقريب (2-Approximation TSP) بنجاح!`
      });
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function getArrowCoords(uId, vId) {
      let n1 = initialNodes.find(n => n.id === uId);
      let n2 = initialNodes.find(n => n.id === vId);
      let dx = n2.x - n1.x;
      let dy = n2.y - n1.y;
      let dist = Math.hypot(dx, dy);
      if (dist === 0) return null;
      return {
        x1: n1.x + (dx/dist) * RADIUS,
        y1: n1.y + (dy/dist) * RADIUS,
        x2: n2.x - (dx/dist) * (RADIUS + 6), 
        y2: n2.y - (dy/dist) * (RADIUS + 6)
      };
    }

    function buildSVG() {
      mstSvg.innerHTML = '';
      tourSvg.innerHTML = '';
      tourUiNodes = {};
      tourUiLines = [];

      let defs = makeSVG('defs', {});
      defs.innerHTML = `
        <marker id="arr-tour" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-swap)"/></marker>
        <marker id="arr-shortcut" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-compare)"/></marker>
      `;
      tourSvg.appendChild(defs);

      // 1. لوحة MST
      allEdges.forEach(e => {
        let uPos = initialNodes.find(n => n.id === e.u);
        let vPos = initialNodes.find(n => n.id === e.v);
        let stroke = e.isMST ? 'var(--brand-500)' : 'var(--text-muted)';
        let sw = e.isMST ? '3' : '2';
        let dash = e.isMST ? '0' : '4,4';
        let opacity = e.isMST ? '1' : '0.4';
        
        let line = makeSVG('line', { x1: uPos.x, y1: uPos.y, x2: vPos.x, y2: vPos.y, stroke: stroke, 'stroke-width': sw, 'stroke-dasharray': dash, opacity: opacity });
        mstSvg.appendChild(line);
      });

      initialNodes.forEach(n => {
        let g = makeSVG('g', {});
        let circ = makeSVG('circle', { cx: n.x, cy: n.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: n.x, y: n.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-weight': 'bold', 'font-size': '15px' });
        txt.textContent = n.id;
        g.appendChild(circ); g.appendChild(txt);
        mstSvg.appendChild(g);
      });

      // 2. لوحة Tour
      let edgesGroup = makeSVG('g', {});
      for(let i = 0; i < 20; i++) {
        let line = makeSVG('line', { opacity: 0 });
        edgesGroup.appendChild(line);
        tourUiLines.push(line);
      }
      tourSvg.appendChild(edgesGroup);

      let nodesGroup = makeSVG('g', {});
      initialNodes.forEach(n => {
        let g = makeSVG('g', { 'transform-origin': `${n.x}px ${n.y}px` });
        let circ = makeSVG('circle', { cx: n.x, cy: n.y, r: RADIUS, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 2 });
        let txt = makeSVG('text', { x: n.x, y: n.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-weight': 'bold', 'font-size': '15px' });
        txt.textContent = n.id;
        g.appendChild(circ); g.appendChild(txt);
        nodesGroup.appendChild(g);
        tourUiNodes[n.id] = { g, circ, txt };
      });
      tourSvg.appendChild(nodesGroup);

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      tourUiLines.forEach(l => l.style.opacity = '0'); 

      let edgeList = [];
      if (s.phase === 'euler') {
        for(let i=0; i<s.eulerPath.length - 1; i++) {
          edgeList.push({ u: s.eulerPath[i], v: s.eulerPath[i+1], type: 'euler' });
        }
      } else if (s.phase === 'hamiltonian' || s.phase === 'done' || s.phase === 'ham_start') {
        for(let i=0; i<s.hamPath.length - 1; i++) {
          edgeList.push({ u: s.hamPath[i], v: s.hamPath[i+1], type: 'ham' });
        }
      }

      edgeList.forEach((e, idx) => {
        let coords = getArrowCoords(e.u, e.v);
        if(!coords) return;
        let line = tourUiLines[idx];
        
        line.setAttribute('x1', coords.x1);
        line.setAttribute('y1', coords.y1);
        line.setAttribute('x2', coords.x2);
        line.setAttribute('y2', coords.y2);
        line.style.opacity = '1';

        if (e.type === 'euler') {
          line.setAttribute('stroke', 'var(--algo-swap)');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-dasharray', '0');
          line.setAttribute('marker-end', 'url(#arr-tour)');
        } else {
          let isMst = allEdges.some(ae => ae.isMST && ((ae.u===e.u && ae.v===e.v) || (ae.u===e.v && ae.v===e.u)));
          if (isMst) {
            line.setAttribute('stroke', 'var(--algo-swap)');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '0');
            line.setAttribute('marker-end', 'url(#arr-tour)');
          } else {
            line.setAttribute('stroke', 'var(--algo-compare)');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '6,6');
            line.setAttribute('marker-end', 'url(#arr-shortcut)');
          }
        }
      });

      initialNodes.forEach(n => {
        let ui = tourUiNodes[n.id];
        let isCurr = (n.id === s.currNode);
        let isVis = false;
        
        if (s.phase === 'euler') isVis = s.eulerPath.includes(n.id);
        else if (s.phase === 'hamiltonian' || s.phase === 'done') isVis = s.hamPath.includes(n.id);

        let fill = 'var(--bg-elevated)';
        let stroke = 'var(--algo-border)';
        let txtFill = 'var(--text-primary)';
        let scale = 'scale(1)';

        if (isCurr) {
          fill = 'var(--algo-active)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.15)';
        } else if (isVis) {
          fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtFill = '#ffffff';
        }

        ui.circ.setAttribute('fill', fill);
        ui.circ.setAttribute('stroke', stroke);
        ui.txt.setAttribute('fill', txtFill);
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