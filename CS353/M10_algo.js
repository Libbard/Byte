// M10_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T09:53:18
// Diagrams: 5/5

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
window._algoTitles[1] = { en: 'DP Fundamentals: Overlapping Subproblems', ar: 'أساسيات البرمجة الديناميكية: التداخل' };
window._algoTitles[2] = { en: 'Knapsack Problem — Dynamic Programming', ar: 'مسألة حقيبة الظهر — البرمجة الديناميكية' };
window._algoTitles[3] = { en: 'Warshall', ar: 'خوارزمية وارشال (الانغلاق المتعدي)' };
window._algoTitles[4] = { en: 'Floyd', ar: 'خوارزمية فلويد (أقصر المسارات)' };
window._algoTitles[5] = { en: 'Optimal BST (Dynamic Programming)', ar: 'شجرة البحث الثنائية المثلى (البرمجة الديناميكية)' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 2:1
      '<div class="algo-canvas" id="w1-svg-container" style="width:100%; max-width:800px; aspect-ratio: 2 / 1; margin: 0 auto; display:flex; justify-content:center; align-items:center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.8rem; color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-act"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-comp"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-hit"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w1-exp');
    var svgEl   = container.querySelector('#w1-svg');
    var counter = container.querySelector('[data-algo-counter]');
 
    var steps = [], cur = 0, playing = false, interval = null;
    
    // متغيرات لبناء الشجرة التفاعلية
    var targetN = 5;
    var nextNodeId = 0;
    var nodes = []; 
    var nodeMap = {}; 
    var treeRoot = null;
    var memoMap = {};
    var memoOrder = [];

    const NODE_R = 25;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-act"]').textContent  = _AL.exp('Computing Now', 'جاري الحساب');
      container.querySelector('[data-algo-text="w1-comp"]').textContent = _AL.exp('Computed & Cached', 'تم حسابه وحفظه');
      container.querySelector('[data-algo-text="w1-hit"]').textContent  = _AL.exp('Cache Hit', 'موجود بالذاكرة (Hit)');
    }

    // بناء شجرة فيبوناتشي بشكل هرمي (في الذاكرة فقط)
    function buildFibTree(n, parentId = null) {
      let id = nextNodeId++;
      let node = { id: id, n: n, val: `F(${n})`, parent: parentId, children: [], x: 0, y: 0 };
      nodes.push(node);
      nodeMap[id] = node;

      if (n > 1) {
        node.children.push(buildFibTree(n - 1, id));
        node.children.push(buildFibTree(n - 2, id));
      }
      return id;
    }

    // حساب الإحداثيات لكي تتوسط الـ SVG بشكل مثالي
    function layoutTree(rootId) {
      const vOffset = 75; 
      const hSpacing = 50;
      let counterX = 0;

      function traverse(id, depth) {
        let node = nodeMap[id];
        if (node.children.length === 2) {
          traverse(node.children[0], depth + 1);
          node.x = counterX * hSpacing;
          counterX++;
          traverse(node.children[1], depth + 1);
        } else {
          node.x = counterX * hSpacing;
          counterX++;
        }
        node.y = depth * vOffset + 40;
      }
      traverse(rootId, 0);

      // توسيط الشجرة داخل الـ viewBox (800)
      let minX = Infinity, maxX = -Infinity;
      nodes.forEach(n => {
        if(n.x < minX) minX = n.x;
        if(n.x > maxX) maxX = n.x;
      });
      let treeW = maxX - minX;
      let offsetX = (800 - treeW) / 2 - minX;
      
      nodes.forEach(n => { n.x += offsetX; });
    }

    // توليد خطوات الحل (Execution Trace)
    function traceFibonacci(id, currentSteps, currentVis, currentComp, currentMemo) {
      let node = nodeMap[id];
      let n = node.n;

      currentVis.push(id);

      currentSteps.push({
        vis: [...currentVis], act: id, comp: [...currentComp], memo: [...currentMemo],
        en: `Need to compute <strong>F(${n})</strong>.`,
        ar: `نحتاج لحساب <strong dir="ltr">F(${n})</strong>.`
      });

      // حالة أساسية
      if (n === 0 || n === 1) {
        currentComp.push(id);
        if (!memoMap[n]) {
           memoMap[n] = true;
           memoOrder.push(n);
        }
        currentSteps.push({
          vis: [...currentVis], act: id, comp: [...currentComp], memo: [...currentMemo],
          en: `<strong>Base Case:</strong> F(${n}) = ${n}. Saving to memory.`,
          ar: `<strong>الحالة الأساسية:</strong> F(${n}) = ${n}. تم الحفظ في الذاكرة.`
        });
        return;
      }

      // هل هي محسوبة مسبقاً (Cache Hit)؟
      if (memoMap[n]) {
        currentMemo.push(id); 
        currentSteps.push({
          vis: [...currentVis], act: id, comp: [...currentComp], memo: [...currentMemo],
          en: `<strong>Cache Hit!</strong> F(${n}) is already in memory. No need to branch further!`,
          ar: `<strong>موجود بالذاكرة!</strong> تم استرجاع F(${n}) فوراً بدون الحاجة لتكرار العمليات السابقة.`
        });
        currentComp.push(id);
        return;
      }

      // حساب الأبناء
      traceFibonacci(node.children[0], currentSteps, currentVis, currentComp, currentMemo);
      
      currentSteps.push({
        vis: [...currentVis], act: id, comp: [...currentComp], memo: [...currentMemo],
        en: `Waiting for the right side to finish so we can calculate <strong>F(${n})</strong>.`,
        ar: `في انتظار انتهاء الجانب الأيمن لكي نتمكن من حساب <strong dir="ltr">F(${n})</strong>.`
      });

      traceFibonacci(node.children[1], currentSteps, currentVis, currentComp, currentMemo);

      // بعد اكتمال الأبناء
      memoMap[n] = true;
      memoOrder.push(n);
      currentComp.push(id);
      
      currentSteps.push({
        vis: [...currentVis], act: id, comp: [...currentComp], memo: [...currentMemo],
        en: `<strong>F(${n})</strong> is now computed and saved in memory!`,
        ar: `تم الآن حساب <strong dir="ltr">F(${n})</strong> وحفظ النتيجة في الذاكرة.`
      });
    }

    function generateSteps() {
      // تفاعلية: حد أقصى للرقم هو 5 لكي لا تفيض الشجرة خارج الشاشة
      targetN = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
      
      nextNodeId = 0;
      nodes = [];
      nodeMap = {};
      memoMap = {};
      memoOrder = [];

      treeRoot = buildFibTree(targetN);
      layoutTree(treeRoot);

      steps = [];
      steps.push({
        vis: [], act: null, comp: [], memo: [],
        en: `Let's calculate Fibonacci <strong>F(${targetN})</strong> using Top-Down Dynamic Programming (Memoization).`,
        ar: `دعنا نقوم بحساب رقم فيبوناتشي <strong dir="ltr">F(${targetN})</strong> باستخدام البرمجة الديناميكية وتقنية الحفظ في الذاكرة (Memoization).`
      });

      let vis = [], comp = [], memo = [];
      traceFibonacci(treeRoot, steps, vis, comp, memo);

      steps.push({
        vis: [...vis], act: null, comp: [...comp], memo: [...memo],
        en: `<strong>Finished!</strong> Total unique values calculated: ${memoOrder.length} instead of exploring the whole exponential tree.`,
        ar: `<strong>اكتمل الحساب بنجاح!</strong> بفضل الذاكرة، قمنا بحساب ${memoOrder.length} قيم فريدة فقط بدلاً من استكشاف جميع فروع الشجرة.`
      });
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      var svgHTML = '<defs>';
      svgHTML += `<marker id="arr-muted" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" opacity="0.4" /></marker>`;
      svgHTML += `<marker id="arr-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" /></marker>`;
      svgHTML += `<marker id="arr-hit" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-compare)" /></marker>`;
      svgHTML += '</defs>';
 
      // 1. رسم الخطوط
      nodes.forEach(n => {
        if (n.parent !== null) {
          let pNode = nodeMap[n.parent];
          
          let dx = n.x - pNode.x;
          let dy = n.y - pNode.y;
          let dist = Math.hypot(dx, dy);
          
          let x1 = pNode.x + (dx / dist) * NODE_R;
          let y1 = pNode.y + (dy / dist) * NODE_R;
          let x2 = n.x - (dx / dist) * (NODE_R + 5); 
          let y2 = n.y - (dy / dist) * (NODE_R + 5);

          let isVisible = s.vis.includes(n.id) && s.vis.includes(pNode.id);
          let isHit = s.memo.includes(n.id);
          
          let stroke = isHit ? 'var(--algo-compare)' : 'var(--text-muted)';
          
          // الإخفاء التام (0) لعدم حرق الخوارزمية
          let opacity = isVisible ? '1' : '0'; 
          
          if(isVisible && !s.act && !s.comp.includes(n.id) && !isHit && n.id !== s.act) opacity = '0.3'; 
          
          let sw = isVisible ? '2' : '1';
          let dash = isHit ? '6,4' : '0';
          let marker = isHit ? 'url(#arr-hit)' : (isVisible ? 'url(#arr-active)' : 'url(#arr-muted)');

          svgHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="${opacity}" marker-end="${marker}" style="transition: all 0.4s ease;"></line>`;
        }
      });
 
      // 2. رسم العقد والنصوص
      nodes.forEach(n => {
        let isVisible = s.vis.includes(n.id);
        
        let fill = 'var(--algo-canvas-bg)';
        let strokeColor = 'var(--text-muted)';
        let textFill = 'var(--algo-text)';
        let scale = '1';
        
        // الإخفاء التام (0) بدلاً من (0.1) ليكون الاستكشاف حقيقياً
        let opacity = isVisible ? '1' : '0'; 

        if (isVisible) {
          if (s.act === n.id) {
            fill = 'var(--algo-active)';
            strokeColor = '#ffffff';
            textFill = '#ffffff';
            scale = '1.15';
          } else if (s.memo.includes(n.id)) {
            fill = 'var(--algo-compare)';
            strokeColor = '#ffffff';
            textFill = '#ffffff';
            scale = '1.05';
          } else if (s.comp.includes(n.id)) {
            fill = 'var(--algo-sorted)';
            strokeColor = '#ffffff';
            textFill = '#ffffff';
          } else {
            // معلقة في الـ Stack
            fill = 'var(--brand-500)';
            strokeColor = '#ffffff';
            textFill = '#ffffff';
            opacity = '0.5';
          }
        }

        svgHTML += `
        <g style="transform: scale(${scale}); transform-origin: ${n.x}px ${n.y}px; opacity: ${opacity}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
          <circle cx="${n.x}" cy="${n.y}" r="${NODE_R}" fill="${fill}" stroke="${strokeColor}" stroke-width="2" style="transition: fill 0.3s ease;"></circle>
          <text x="${n.x}" y="${n.y}" dy=".1em" text-anchor="middle" dominant-baseline="middle" fill="${textFill}" font-size="14px" font-weight="800" font-family="'JetBrains Mono', monospace" style="transition: fill 0.3s ease;">${n.val}</text>
        </g>`;
      });
 
      svgEl.innerHTML = svgHTML;
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
    // عند الضغط على إعادة، يتم توليد شجرة جديدة برقم جديد!
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); generateSteps(); cur=0; render(); });
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function(){ if(cur<steps.length-1){cur++;render();}else stopPlay(); }, getDelay());
      }
    });
 
    window._algoRerenders[1] = render;
    generateSteps(); // يتضمن اختيار رقم عشوائي وبناء الشجرة
    render();
};

window.AlgoWidgets[2] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp" style="font-size: 0.95rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px; text-align: center; min-height: 48px;"></div>' +
      
      // حاوية متجاوبة هجينة (SVG + HTML Overlay)
      '<div class="algo-canvas" style="position:relative; width:100%; max-width:700px; margin:0 auto; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:hidden; display: flex; flex-direction: column; align-items: center; padding-bottom: 60px;">' +
        '<svg id="w2-svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="overflow:visible; margin-top: 15px;"></svg>' +
        
        // صندوق المعادلة العائم (HTML للحصول على تنسيق غني)
        '<div id="w2-formula-box" style="position:absolute; bottom: 15px; width: 90%; max-width: 500px; padding: 8px 15px; background: var(--bg-elevated); border: 2px solid var(--algo-border); border-radius: 8px; text-align: center; font-family: \'JetBrains Mono\', monospace; font-size: 14px; font-weight: bold; color: var(--text-primary); opacity: 0; transition: all 0.4s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"></div>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w2-target"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w2-exclude"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:4px;margin-right:4px;"></span><span data-algo-text="w2-include"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w2-exp');
    var svgEl   = container.querySelector('#w2-svg');
    var formulaBox = container.querySelector('#w2-formula-box');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // عناصر التخزين المؤقت (DOM Caching)
    var uiCells = [];
    var uiRowLabels = [];
    var uiColLabels = [];
    var arrowExclude, arrowInclude;

    // بيانات الخوارزمية (سيتم توليدها عشوائياً)
    var items = [];
    var W = 0;
    var numItems = 0;

    // الثوابت الهندسية
    const CELL_W = 48;
    const CELL_H = 40;
    const GAP = 4;
    const PAD_LEFT = 90;
    const PAD_TOP = 50;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w2-target"]').textContent  = _AL.exp('Target Cell', 'الخلية المستهدفة');
      container.querySelector('[data-algo-text="w2-exclude"]').textContent = _AL.exp('Exclude Item', 'استبعاد العنصر');
      container.querySelector('[data-algo-text="w2-include"]').textContent = _AL.exp('Include Item', 'تضمين العنصر');
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function generateSteps() {
      // توليد بيانات عشوائية للحقيبة في كل Reset
      W = Math.floor(Math.random() * 3) + 5; // سعة من 5 إلى 7
      numItems = 4;
      items = [{ w: 0, v: 0 }]; // العنصر 0 وهمي
      
      // لتفادي تكرار الأوزان بشكل ممل
      let wPool = [1, 2, 3, 4, 5];
      wPool.sort(() => Math.random() - 0.5);
      
      for (let i = 1; i <= numItems; i++) {
        items.push({ 
          w: wPool[i-1], 
          v: Math.floor(Math.random() * 8) + 2 
        });
      }

      steps = [];
      let dp = Array(numItems + 1).fill().map(() => Array(W + 1).fill(0));

      steps.push({
        dp: dp.map(r => r.slice()), i: -1, j: -1, phase: 'init',
        en: `Initialize DP table. Capacity <strong>W = ${W}</strong>. Row 0 and Col 0 are 0.`,
        ar: `تهيئة الجدول. السعة القصوى للحقيبة <strong>W = ${W}</strong>. الصف 0 والعمود 0 أصفار.`
      });

      for (let i = 1; i <= numItems; i++) {
        for (let j = 1; j <= W; j++) {
          let w = items[i].w;
          let v = items[i].v;

          steps.push({
            dp: dp.map(r => r.slice()), i, j, phase: 'target', w, v,
            en: `Evaluating Item <strong>${i}</strong> (weight=${w}, value=${v}) at capacity <strong>${j}</strong>.`,
            ar: `تقييم العنصر <strong>${i}</strong> (الوزن=${w}، القيمة=${v}) عند السعة <strong>${j}</strong>.`
          });

          if (j < w) {
            dp[i][j] = dp[i-1][j];
            steps.push({
              dp: dp.map(r => r.slice()), i, j, phase: 'exclude', w, v,
              from1: { r: i-1, c: j }, val: dp[i][j],
              en: `Capacity ${j} < weight ${w}. Cannot include. Copy from above: <strong>${dp[i-1][j]}</strong>.`,
              ar: `السعة ${j} أقل من الوزن ${w}. لا يمكن إضافته. ننسخ من الأعلى: <strong>${dp[i-1][j]}</strong>.`
            });
          } else {
            let valExclude = dp[i-1][j];
            let valInclude = dp[i-1][j-w] + v;
            let maxVal = Math.max(valExclude, valInclude);
            dp[i][j] = maxVal;
            
            steps.push({
              dp: dp.map(r => r.slice()), i, j, phase: 'compare', w, v,
              from1: { r: i-1, c: j }, from2: { r: i-1, c: j-w },
              valExclude, valInclude, maxVal,
              en: `Compare: Exclude (${valExclude}) vs Include (${dp[i-1][j-w]} + ${v} = ${valInclude}). Max is <strong>${maxVal}</strong>.`,
              ar: `مقارنة: استبعاد (${valExclude}) ضد تضمين (${dp[i-1][j-w]} + ${v} = ${valInclude}). الأكبر هو <strong>${maxVal}</strong>.`
            });
          }
        }
      }

      steps.push({
        dp: dp.map(r => r.slice()), i: numItems, j: W, phase: 'done',
        en: `<strong>Done!</strong> The maximum possible value is <strong>${dp[numItems][W]}</strong>.`,
        ar: `<strong>انتهينا!</strong> أقصى قيمة ممكنة للحقيبة هي <strong>${dp[numItems][W]}</strong>.`
      });
    }

    function buildUI() {
      svgEl.innerHTML = '';
      uiCells = [];
      uiRowLabels = [];
      uiColLabels = [];

      // ضبط الـ ViewBox ديناميكياً ليتناسب مع الجوال تماماً ولا يترك فراغات
      let totalW = PAD_LEFT + (W + 1) * (CELL_W + GAP) + 20;
      let totalH = PAD_TOP + (numItems + 1) * (CELL_H + GAP) + 20;
      svgEl.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

      // تعريف الأسهم
      let defs = makeSVG('defs', {});
      defs.innerHTML = `
        <marker id="w2-arr-exc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="var(--algo-swap)"/></marker>
        <marker id="w2-arr-inc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="var(--brand-500)"/></marker>
      `;
      svgEl.appendChild(defs);

      // العناوين (الأعمدة - السعة)
      let colTitle = makeSVG('text', { x: PAD_LEFT + ((W + 1) * (CELL_W + GAP)) / 2, y: 15, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-family': "'Cairo', sans-serif", 'font-size': '15px', 'font-weight': 'bold' });
      colTitle.textContent = _AL.exp('Capacity (j)', 'السعة المتاحة (j)');
      svgEl.appendChild(colTitle);

      for (let j = 0; j <= W; j++) {
        let x = PAD_LEFT + j * (CELL_W + GAP) + CELL_W / 2;
        let txt = makeSVG('text', { x: x, y: PAD_TOP - 10, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': 'bold' });
        txt.textContent = j;
        svgEl.appendChild(txt);
        uiColLabels.push(txt);
      }

      // العناوين (الصفوف - العناصر)
      for (let i = 0; i <= numItems; i++) {
        let y = PAD_TOP + i * (CELL_H + GAP) + CELL_H / 2;
        let txt = makeSVG('text', { x: PAD_LEFT - 10, y: y, 'text-anchor': 'end', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '13px', 'font-weight': 'bold' });
        txt.textContent = i === 0 ? '0' : `i=${i} (w:${items[i].w},v:${items[i].v})`;
        svgEl.appendChild(txt);
        uiRowLabels.push(txt);
      }

      // بناء الخلايا
      let cellsG = makeSVG('g', {});
      for (let i = 0; i <= numItems; i++) {
        uiCells[i] = [];
        for (let j = 0; j <= W; j++) {
          let cx = PAD_LEFT + j * (CELL_W + GAP) + CELL_W / 2;
          let cy = PAD_TOP + i * (CELL_H + GAP) + CELL_H / 2;

          let g = makeSVG('g', { 'transform-origin': `${cx}px ${cy}px` });
          let rect = makeSVG('rect', { x: cx - CELL_W/2, y: cy - CELL_H/2, width: CELL_W, height: CELL_H, rx: 6, fill: 'var(--bg-elevated)', stroke: 'var(--algo-border)', 'stroke-width': 1.5 });
          let txt = makeSVG('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-primary)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '15px', 'font-weight': 'bold' });
          
          g.appendChild(rect); g.appendChild(txt);
          cellsG.appendChild(g);
          uiCells[i][j] = { g, rect, txt, cx, cy };
        }
      }
      svgEl.appendChild(cellsG);

      // بناء الأسهم
      arrowExclude = makeSVG('line', { stroke: 'var(--algo-swap)', 'stroke-width': 3, 'stroke-dasharray': '5,4', 'marker-end': 'url(#w2-arr-exc)', opacity: 0 });
      arrowInclude = makeSVG('path', { fill: 'none', stroke: 'var(--brand-500)', 'stroke-width': 3, 'marker-end': 'url(#w2-arr-inc)', opacity: 0 });
      svgEl.appendChild(arrowExclude);
      svgEl.appendChild(arrowInclude);

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildUI();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // 1. تحديث الجدول (الخلايا)
      for (let i = 0; i <= numItems; i++) {
        // تحديث ألوان العناوين
        let isRowActive = (i === s.i);
        uiRowLabels[i].setAttribute('fill', isRowActive ? 'var(--algo-active)' : 'var(--text-muted)');
        
        for (let j = 0; j <= W; j++) {
          if (i === 0) uiColLabels[j].setAttribute('fill', (j === s.j) ? 'var(--algo-active)' : 'var(--text-muted)');

          let ui = uiCells[i][j];
          let val = s.dp[i][j];
          let opacity = '1', scale = 'scale(1)', fill = 'var(--bg-elevated)', stroke = 'var(--algo-border)', txtFill = 'var(--text-primary)';

          // منطق الرؤية
          if (i > s.i || (i === s.i && j > s.j)) {
            if (s.phase !== 'done') { opacity = '0.1'; val = ''; }
          } else if (s.phase !== 'done' && i < s.i - 1) {
            opacity = '0.25'; // تبهيت الصفوف القديمة لتركيز الانتباه
          }

          // الألوان والتحديد
          if (s.phase === 'done' && i === numItems && j === W) {
            fill = 'var(--algo-sorted)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.15)';
          } else if (i === s.i && j === s.j) {
            fill = 'var(--algo-active)'; stroke = '#ffffff'; txtFill = '#ffffff'; scale = 'scale(1.15)';
          } else if (s.from1 && s.from1.r === i && s.from1.c === j) {
            fill = 'var(--algo-swap)'; stroke = '#ffffff'; txtFill = '#ffffff';
          } else if (s.from2 && s.from2.r === i && s.from2.c === j) {
            fill = 'var(--brand-500)'; stroke = '#ffffff'; txtFill = '#ffffff';
          }

          ui.g.style.opacity = opacity;
          ui.g.style.transform = scale;
          ui.rect.setAttribute('fill', fill);
          ui.rect.setAttribute('stroke', stroke);
          ui.txt.setAttribute('fill', txtFill);
          ui.txt.textContent = val;
        }
      }

      // 2. تحديث الأسهم مع رياضيات دقيقة لا تخترق الخلايا
      arrowExclude.style.opacity = '0';
      arrowInclude.style.opacity = '0';

      if (s.phase === 'exclude' || s.phase === 'compare') {
        let u = uiCells[s.from1.r][s.from1.c];
        let v = uiCells[s.i][s.j];
        arrowExclude.setAttribute('x1', u.cx);
        arrowExclude.setAttribute('y1', u.cy + CELL_H/2);
        arrowExclude.setAttribute('x2', v.cx);
        arrowExclude.setAttribute('y2', v.cy - CELL_H/2 - 6);
        arrowExclude.style.opacity = '1';
      }

      if (s.phase === 'compare' && s.from2) {
        let u = uiCells[s.from2.r][s.from2.c];
        let v = uiCells[s.i][s.j];
        // رسم منحنى أنيق باستخدام (Quadratic Bezier Curve) لتجنب التداخل مع سهم الاستبعاد
        let startX = u.cx;
        let startY = u.cy + CELL_H/2;
        let endX = v.cx - 10; // الإزاحة قليلاً لليسار عن السهم الآخر
        let endY = v.cy - CELL_H/2 - 6;
        let midX = startX + (endX - startX) / 2;
        let midY = startY + (endY - startY) / 2 + 25; // انحناء لأسفل

        arrowInclude.setAttribute('d', `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
        arrowInclude.style.opacity = '1';
      }

      // 3. تحديث صندوق المعادلة (HTML Overlay)
      if (s.phase === 'compare' || s.phase === 'exclude') {
        formulaBox.style.opacity = '1';
        let html = `DP[${s.i}][${s.j}] = `;
        if (s.phase === 'exclude') {
          html += `<span style="color:var(--algo-swap);">DP[${s.i-1}][${s.j}]</span> = ${s.val}`;
          formulaBox.style.borderColor = 'var(--algo-swap)';
        } else {
          html += `max( <span style="color:var(--algo-swap);">${s.valExclude}</span>, <span style="color:var(--brand-500);">${s.v} + ${s.valInclude - s.v}</span> ) = <span style="color:var(--algo-active);">${s.maxVal}</span>`;
          formulaBox.style.borderColor = 'var(--algo-active)';
        }
        formulaBox.innerHTML = html;
      } else {
        formulaBox.style.opacity = '0';
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
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); isInitialized = false; generateSteps(); cur = 0; render(); });
    
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
      
      // حاوية متجاوبة لتوسيط الشاشة 
      '<div class="algo-canvas" style="position:relative; width:100%; max-width:600px; margin:0 auto; aspect-ratio: 5/3; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:visible;">' +
        '<svg id="w3-svg" width="100%" height="100%" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--text-muted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-prev"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-check"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-new"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w3-exp');
    var svgEl   = container.querySelector('#w3-svg');
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // إحداثيات متناسقة جداً داخل 600x360
    var nodeCoords = {
      i: { x: 150, y: 260 },
      j: { x: 450, y: 260 },
      k: { x: 300, y: 80 }
    };
    var radius = 24;

    // متغيرات للاحتفاظ بالعناصر لتحديثها برمجياً (Lazy Init)
    var edgesUI = {};
    var nodesUI = {};
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w3-prev"]').textContent  = _AL.exp('Previous State', 'حالة سابقة');
      container.querySelector('[data-algo-text="w3-check"]').textContent = _AL.exp('Checking', 'قيد التحقق');
      container.querySelector('[data-algo-text="w3-new"]').textContent   = _AL.exp('Confirmed Path', 'مسار مؤكد');
    }
 
    function generateSteps() {
      steps = [
        {
          nodes: { i: true, j: true, k: false },
          edges: [],
          en: '<strong>Goal:</strong> Find if there is a path from node <strong>i</strong> to node <strong>j</strong>.',
          ar: '<strong>الهدف:</strong> معرفة ما إذا كان هناك مسار من العقدة <strong>i</strong> إلى العقدة <strong>j</strong>.'
        },
        {
          nodes: { i: true, j: true, k: false },
          edges: [
            { from: 'i', to: 'j', dashed: true, color: 'var(--text-muted)', label: 'R(k-1)[i,j]', dx: 0, dy: 22 }
          ],
          en: '<strong>Condition 1:</strong> Is there already a known path from i to j using previous intermediate nodes?',
          ar: '<strong>الشرط الأول:</strong> هل يوجد مسار مسبق معروف من i إلى j باستخدام العقد الوسيطة السابقة؟'
        },
        {
          nodes: { i: false, j: false, k: true },
          edges: [
            { from: 'i', to: 'j', dashed: true, color: 'var(--text-muted)', label: 'R(k-1)[i,j]', dx: 0, dy: 22 }
          ],
          en: 'Now, let\'s consider a new intermediate node <strong>k</strong>.',
          ar: 'الآن، نأخذ في الاعتبار استخدام عقدة وسيطة جديدة <strong>k</strong>.'
        },
        {
          nodes: { i: true, j: false, k: true },
          edges: [
            { from: 'i', to: 'j', dashed: true, color: 'var(--text-muted)', label: 'R(k-1)[i,j]', dx: 0, dy: 22 },
            { from: 'i', to: 'k', dashed: false, color: 'var(--algo-compare)', label: 'R(k-1)[i,k]', dx: -45, dy: -15 }
          ],
          en: '<strong>Condition 2a:</strong> Can we reach k from i using previous nodes?',
          ar: '<strong>الشرط الثاني (أ):</strong> هل يمكننا الوصول إلى k من i باستخدام العقد السابقة؟'
        },
        {
          nodes: { i: false, j: true, k: true },
          edges: [
            { from: 'i', to: 'j', dashed: true, color: 'var(--text-muted)', label: 'R(k-1)[i,j]', dx: 0, dy: 22 },
            { from: 'i', to: 'k', dashed: false, color: 'var(--text-muted)', label: 'R(k-1)[i,k]', dx: -45, dy: -15 },
            { from: 'k', to: 'j', dashed: false, color: 'var(--algo-compare)', label: 'R(k-1)[k,j]', dx: 45, dy: -15 }
          ],
          en: '<strong>Condition 2b:</strong> AND can we reach j from k using previous nodes?',
          ar: '<strong>الشرط الثاني (ب):</strong> وهل يمكننا أيضاً الوصول إلى j من k باستخدام العقد السابقة؟'
        },
        {
          nodes: { i: true, j: true, k: true },
          edges: [
            { from: 'i', to: 'k', dashed: false, color: 'var(--text-muted)', label: 'R(k-1)[i,k]', dx: -45, dy: -15 },
            { from: 'k', to: 'j', dashed: false, color: 'var(--text-muted)', label: 'R(k-1)[k,j]', dx: 45, dy: -15 },
            { from: 'i', to: 'j', dashed: false, color: 'var(--brand-500)', label: 'R(k)[i,j]', dx: 0, dy: 22 }
          ],
          en: '<strong>Result:</strong> A path exists if (Condition 1) OR (Condition 2a AND 2b) is true. We update our matrix!',
          ar: '<strong>النتيجة:</strong> يوجد مسار إذا كان (الشرط الأول) أو (الشرط الثاني أ و ب معاً) صحيحاً. نقوم بتحديث المصفوفة!'
        }
      ];
    }

    // حساب إحداثيات الخط ليتوقف عند حافة الدائرة
    function getEdgeCoords(fromId, toId) {
      let p1 = nodeCoords[fromId];
      let p2 = nodeCoords[toId];
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = Math.hypot(dx, dy);
      return {
        x1: p1.x + (dx / dist) * radius,
        y1: p1.y + (dy / dist) * radius,
        x2: p2.x - (dx / dist) * (radius + 4), // مسافة لرأس السهم
        y2: p2.y - (dy / dist) * (radius + 4)
      };
    }
 
    function buildSVG() {
      var ns = 'http://www.w3.org/2000/svg';
      svgEl.innerHTML = '';
      edgesUI = {};
      nodesUI = {};

      // 1. تعريف رؤوس الأسهم (Markers) لكل لون نستخدمه
      var defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = `
        <marker id="arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/></marker>
        <marker id="arr-compare" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-compare)"/></marker>
        <marker id="arr-brand" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker>
      `;
      svgEl.appendChild(defs);

      // 2. بناء الخطوط (Edges) بشكل مسبق ومخفي
      var edgesGroup = document.createElementNS(ns, 'g');
      ['ij', 'ik', 'kj'].forEach(key => {
        let from = key[0], to = key[1];
        let c = getEdgeCoords(from, to);

        let g = document.createElementNS(ns, 'g');
        g.style.transition = 'opacity 0.4s ease';
        g.style.opacity = '0'; // مخفي في البداية

        let line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', c.x1); line.setAttribute('y1', c.y1);
        line.setAttribute('x2', c.x2); line.setAttribute('y2', c.y2);
        line.setAttribute('stroke-width', '3');
        line.style.transition = 'all 0.4s ease';

        let text = document.createElementNS(ns, 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('dy', '.1em');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '16px');
        text.setAttribute('font-weight', '800');
        text.style.transition = 'all 0.4s ease';

        g.appendChild(line);
        g.appendChild(text);
        edgesGroup.appendChild(g);

        edgesUI[key] = { g: g, line: line, text: text, c: c };
      });
      svgEl.appendChild(edgesGroup);

      // 3. بناء العقد (Nodes)
      var nodesGroup = document.createElementNS(ns, 'g');
      ['i', 'j', 'k'].forEach(id => {
        let p = nodeCoords[id];
        
        let g = document.createElementNS(ns, 'g');
        g.style.transformOrigin = `${p.x}px ${p.y}px`;
        g.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        let circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke-width', '2');
        circle.style.transition = 'fill 0.3s ease, stroke 0.3s ease';

        let text = document.createElementNS(ns, 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('dy', '.1em');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '18px');
        text.setAttribute('font-weight', '800');
        text.textContent = id;
        text.style.transition = 'fill 0.3s ease';

        g.appendChild(circle);
        g.appendChild(text);
        nodesGroup.appendChild(g);

        nodesUI[id] = { g: g, circle: circle, text: text };
      });
      svgEl.appendChild(nodesGroup);

      isInitialized = true;
    }
 
    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      const colorToMarker = {
        'var(--text-muted)': 'url(#arr-muted)',
        'var(--algo-compare)': 'url(#arr-compare)',
        'var(--brand-500)': 'url(#arr-brand)'
      };

      // 1. تحديث الخطوط (Edges)
      // إخفاء جميع الخطوط أولاً
      Object.values(edgesUI).forEach(ui => ui.g.style.opacity = '0');

      // إظهار وتحديث الخطوط المطلوبة في الخطوة الحالية
      s.edges.forEach(e => {
        let key = e.from + e.to;
        let ui = edgesUI[key];
        if (ui) {
          ui.g.style.opacity = '1';
          ui.line.setAttribute('stroke', e.color);
          ui.line.setAttribute('stroke-dasharray', e.dashed ? '8,6' : '0');
          ui.line.setAttribute('marker-end', colorToMarker[e.color]);

          ui.text.textContent = e.label;
          // تلوين النص ليتناسب مع الخط (الرمادي نجعله كلون النص العادي ليُقرأ بوضوح)
          ui.text.setAttribute('fill', e.color === 'var(--text-muted)' ? 'var(--text-primary)' : e.color);

          let mx = (ui.c.x1 + ui.c.x2) / 2 + e.dx;
          let my = (ui.c.y1 + ui.c.y2) / 2 + e.dy;
          ui.text.setAttribute('x', mx);
          ui.text.setAttribute('y', my);
        }
      });

      // 2. تحديث العقد (Nodes)
      ['i', 'j', 'k'].forEach(id => {
        let ui = nodesUI[id];
        let isActive = s.nodes[id];

        let fill = isActive ? 'var(--brand-500)' : 'var(--bg-elevated)';
        let stroke = isActive ? '#ffffff' : 'var(--algo-border)';
        let textFill = isActive ? '#ffffff' : 'var(--text-primary)';
        let scale = isActive ? 'scale(1.15)' : 'scale(1)';

        ui.circle.setAttribute('fill', fill);
        ui.circle.setAttribute('stroke', stroke);
        ui.text.setAttribute('fill', textFill);
        ui.g.style.transform = scale;
      });
    }
 
    function startPlay() {
      playing = true;
      btnPlay.textContent = _AL.t('pause');
      btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function() {
        if (cur < steps.length - 1) { cur++; render(); }
        else stopPlay();
      }, getDelay());
    }
 
    function stopPlay() {
      playing = false;
      clearInterval(interval);
      interval = null;
      btnPlay.textContent = _AL.t('play');
      btnPlay.dataset.playing = '0';
    }
 
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() {
      stopPlay();
      if (cur > 0) { cur--; render(); }
    });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() {
      stopPlay();
      if (cur < steps.length - 1) { cur++; render(); }
    });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() {
      playing ? stopPlay() : startPlay();
    });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() {
      stopPlay();
      generateSteps();
      cur = 0;
      render();
    });
    
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
      '<div class="algo-explanation" id="w4-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 5:3 
      '<div class="algo-canvas" style="position:relative; width:100%; max-width:600px; margin:0 auto; aspect-ratio: 5/3; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:visible;">' +
        '<svg id="w4-svg" width="100%" height="100%" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--text-muted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-normal"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-compare"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w4-update"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w4-exp');
    var svgEl   = container.querySelector('#w4-svg');
    var counter = container.querySelector('[data-algo-counter]');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // الثوابت الهندسية
    var radius = 24;
    var nodeCoords = {
      i: { x: 150, y: 240 },
      j: { x: 450, y: 240 },
      k: { x: 300, y: 80 }
    };

    // عناصر الـ UI لتحديثها برمجياً
    var edgesUI = {};
    var nodesUI = {};
    var formulaTextUI;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w4-normal"]').textContent  = _AL.exp('Normal Path', 'مسار عادي');
      container.querySelector('[data-algo-text="w4-compare"]').textContent = _AL.exp('Comparing', 'مقارنة مسار');
      container.querySelector('[data-algo-text="w4-update"]').textContent  = _AL.exp('Final Path', 'المسار المعتمد');
    }

    function generateSteps() {
      steps = [];
      // توليد أرقام تفاعلية في كل مرة
      var dij = Math.floor(Math.random() * 15) + 5;
      var dik = Math.floor(Math.random() * 8) + 3;
      var dkj = Math.floor(Math.random() * 8) + 3;
      var sum = dik + dkj;
      var updated = sum < dij;

      steps.push({
        state: 'intro', hlNodes: ['i', 'j'], hlEdges: ['ij'],
        edgeState: { ij: { color: 'var(--text-muted)', dashed: true, val: dij }, ik: null, kj: null },
        eq: '',
        en: 'We want to find the shortest path from node <strong>i</strong> to node <strong>j</strong>.',
        ar: 'نريد إيجاد أقصر مسار ممكن من العقدة <strong>i</strong> إلى العقدة <strong>j</strong>.'
      });

      steps.push({
        state: 'k', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij'],
        edgeState: { ij: { color: 'var(--text-muted)', dashed: true, val: dij }, ik: null, kj: null },
        eq: 'D[i,j] = min( D[i,j], D[i,k] + D[k,j] )',
        en: 'Consider node <strong>k</strong> as an intermediate step to see if it offers a shorter route.',
        ar: 'نعتبر العقدة <strong>k</strong> كخطوة وسيطة لنرى ما إذا كانت توفر طريقاً أقصر.'
      });

      steps.push({
        state: 'direct', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij'],
        edgeState: { ij: { color: 'var(--algo-compare)', dashed: false, val: dij }, ik: null, kj: null },
        eq: `min( ${dij}, D[i,k] + D[k,j] )`,
        en: `The current known direct distance D[i,j] is <strong>${dij}</strong>.`,
        ar: `المسافة المباشرة الحالية المعروفة D[i,j] هي <strong>${dij}</strong>.`
      });

      steps.push({
        state: 'via_k', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij', 'ik', 'kj'],
        edgeState: { 
          ij: { color: 'var(--text-muted)', dashed: false, val: dij }, 
          ik: { color: 'var(--algo-compare)', dashed: false, val: dik }, 
          kj: { color: 'var(--algo-compare)', dashed: false, val: dkj } 
        },
        eq: `min( ${dij}, ${dik} + ${dkj} )`,
        en: `The distance going through k is D[i,k] + D[k,j] = ${dik} + ${dkj} = <strong>${sum}</strong>.`,
        ar: `المسافة بالمرور عبر k هي D[i,k] + D[k,j] = ${dik} + ${dkj} = <strong>${sum}</strong>.`
      });

      steps.push({
        state: 'compare', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij', 'ik', 'kj'],
        edgeState: { 
          ij: { color: 'var(--algo-compare)', dashed: false, val: dij }, 
          ik: { color: 'var(--algo-compare)', dashed: false, val: dik }, 
          kj: { color: 'var(--algo-compare)', dashed: false, val: dkj } 
        },
        eq: `min( ${dij}, ${sum} )`,
        en: `Compare the direct path (${dij}) with the path through k (${sum}).`,
        ar: `نقارن المسار المباشر (${dij}) مع المسار عبر العقدة k (${sum}).`
      });

      if (updated) {
        steps.push({
          state: 'update', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij', 'ik', 'kj'],
          edgeState: { 
            ij: { color: 'var(--algo-sorted)', dashed: false, val: sum }, 
            ik: { color: 'var(--text-muted)', dashed: false, val: dik }, 
            kj: { color: 'var(--text-muted)', dashed: false, val: dkj } 
          },
          eq: `${sum} < ${dij} ➔ Update D[i,j] = ${sum}`,
          en: `Since ${sum} < ${dij}, we <strong>update</strong> the shortest path matrix to ${sum}.`,
          ar: `بما أن ${sum} < ${dij}، نقوم بـ <strong>تحديث</strong> مصفوفة أقصر مسار لتصبح ${sum}.`
        });
      } else {
        steps.push({
          state: 'keep', hlNodes: ['i', 'j', 'k'], hlEdges: ['ij', 'ik', 'kj'],
          edgeState: { 
            ij: { color: 'var(--brand-500)', dashed: false, val: dij }, 
            ik: { color: 'var(--text-muted)', dashed: false, val: dik }, 
            kj: { color: 'var(--text-muted)', dashed: false, val: dkj } 
          },
          eq: `${dij} ≤ ${sum} ➔ Keep D[i,j] = ${dij}`,
          en: `Since ${dij} is already ≤ ${sum}, we <strong>keep</strong> the current distance.`,
          ar: `بما أن ${dij} أصغر أو يساوي ${sum}، <strong>نحتفظ</strong> بالمسافة الحالية كما هي.`
        });
      }
    }

    // حساب نقاط الارتكاز لكي تلامس الخطوط حواف الدوائر
    function getEdgeCoords(fromId, toId) {
      let p1 = nodeCoords[fromId];
      let p2 = nodeCoords[toId];
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = Math.hypot(dx, dy);
      return {
        x1: p1.x + (dx / dist) * radius,
        y1: p1.y + (dy / dist) * radius,
        x2: p2.x - (dx / dist) * (radius + 4), // مسافة لرأس السهم
        y2: p2.y - (dy / dist) * (radius + 4),
        mx: (p1.x + p2.x) / 2, // نقطة المنتصف للنص
        my: (p1.y + p2.y) / 2
      };
    }

    function buildSVG() {
      var ns = 'http://www.w3.org/2000/svg';
      svgEl.innerHTML = '';
      edgesUI = {};
      nodesUI = {};

      // تعريف رؤوس الأسهم (Markers)
      var defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = `
        <marker id="arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/></marker>
        <marker id="arr-compare" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-compare)"/></marker>
        <marker id="arr-sorted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-sorted)"/></marker>
        <marker id="arr-brand" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker>
      `;
      svgEl.appendChild(defs);

      // بناء الخطوط (Edges) والنصوص المرافقة لها
      var edgesGroup = document.createElementNS(ns, 'g');
      
      // إزاحات النصوص (Labels offsets)
      var offsets = {
        'ij': { dx: 0, dy: -18 },
        'ik': { dx: -25, dy: -15 },
        'kj': { dx: 25, dy: -15 }
      };

      ['ij', 'ik', 'kj'].forEach(key => {
        let from = key[0], to = key[1];
        let c = getEdgeCoords(from, to);

        let g = document.createElementNS(ns, 'g');
        g.style.transition = 'opacity 0.4s ease';
        g.style.opacity = '0';

        let line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', c.x1); line.setAttribute('y1', c.y1);
        line.setAttribute('x2', c.x2); line.setAttribute('y2', c.y2);
        line.style.transition = 'all 0.4s ease';

        // خلفية للنص لتسهيل القراءة
        let textBg = document.createElementNS(ns, 'rect');
        textBg.setAttribute('x', c.mx + offsets[key].dx - 15);
        textBg.setAttribute('y', c.my + offsets[key].dy - 12);
        textBg.setAttribute('width', 30);
        textBg.setAttribute('height', 24);
        textBg.setAttribute('rx', 4);
        textBg.setAttribute('fill', 'var(--algo-canvas-bg)');
        textBg.style.transition = 'all 0.4s ease';

        let text = document.createElementNS(ns, 'text');
        text.setAttribute('x', c.mx + offsets[key].dx);
        text.setAttribute('y', c.my + offsets[key].dy);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('dy', '.1em');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '15px');
        text.setAttribute('font-weight', '800');
        text.style.transition = 'all 0.4s ease';

        g.appendChild(line);
        g.appendChild(textBg);
        g.appendChild(text);
        edgesGroup.appendChild(g);

        edgesUI[key] = { g: g, line: line, textBg: textBg, text: text, c: c, offsets: offsets[key] };
      });
      svgEl.appendChild(edgesGroup);

      // بناء العقد (Nodes)
      var nodesGroup = document.createElementNS(ns, 'g');
      ['i', 'j', 'k'].forEach(id => {
        let p = nodeCoords[id];
        
        let g = document.createElementNS(ns, 'g');
        g.style.transformOrigin = `${p.x}px ${p.y}px`;
        g.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        g.style.opacity = '0'; // عقدة k تكون مخفية في البداية

        let circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke-width', '2');
        circle.style.transition = 'fill 0.3s ease, stroke 0.3s ease';

        let text = document.createElementNS(ns, 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('dy', '.1em');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '18px');
        text.setAttribute('font-weight', '800');
        text.textContent = id;
        text.style.transition = 'fill 0.3s ease';

        g.appendChild(circle);
        g.appendChild(text);
        nodesGroup.appendChild(g);

        nodesUI[id] = { g: g, circle: circle, text: text };
      });
      svgEl.appendChild(nodesGroup);

      // بناء نص المعادلة (Formula) في الأسفل
      formulaTextUI = document.createElementNS(ns, 'text');
      formulaTextUI.setAttribute('x', 300);
      formulaTextUI.setAttribute('y', 330);
      formulaTextUI.setAttribute('text-anchor', 'middle');
      formulaTextUI.setAttribute('dominant-baseline', 'middle');
      formulaTextUI.setAttribute('fill', 'var(--text-primary)');
      formulaTextUI.setAttribute('font-family', "'JetBrains Mono', monospace");
      formulaTextUI.setAttribute('font-size', '18px');
      formulaTextUI.setAttribute('font-weight', '800');
      formulaTextUI.style.transition = 'opacity 0.4s ease';
      svgEl.appendChild(formulaTextUI);

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      const colorToMarker = {
        'var(--text-muted)': 'url(#arr-muted)',
        'var(--algo-compare)': 'url(#arr-compare)',
        'var(--algo-sorted)': 'url(#arr-sorted)',
        'var(--brand-500)': 'url(#arr-brand)'
      };

      // 1. تحديث الخطوط
      Object.keys(edgesUI).forEach(key => {
        let ui = edgesUI[key];
        let state = s.edgeState[key];
        
        if (state) {
          ui.g.style.opacity = (s.hlEdges.includes(key) || key === 'ij') ? '1' : '0.3';
          let sw = s.hlEdges.includes(key) ? '3' : '2';
          
          ui.line.setAttribute('stroke', state.color);
          ui.line.setAttribute('stroke-width', sw);
          ui.line.setAttribute('stroke-dasharray', state.dashed ? '6,6' : '0');
          ui.line.setAttribute('marker-end', colorToMarker[state.color]);

          ui.text.textContent = state.val;
          ui.text.setAttribute('fill', state.color === 'var(--text-muted)' ? 'var(--text-primary)' : state.color);
          ui.text.setAttribute('font-size', s.hlEdges.includes(key) ? '18px' : '15px');
        } else {
          ui.g.style.opacity = '0';
        }
      });

      // 2. تحديث العقد
      ['i', 'j', 'k'].forEach(id => {
        let ui = nodesUI[id];
        let isVisible = s.hlNodes.includes(id);

        if (isVisible) {
          ui.g.style.opacity = '1';
          let isActive = id === 'k' && s.state !== 'intro'; // K is always active when visible
          let fill = isActive ? 'var(--brand-500)' : 'var(--algo-canvas-bg)';
          let stroke = isActive ? '#ffffff' : 'var(--text-muted)';
          let textFill = isActive ? '#ffffff' : 'var(--algo-text)';
          let scale = isActive ? 'scale(1.15)' : 'scale(1)';

          ui.circle.setAttribute('fill', fill);
          ui.circle.setAttribute('stroke', stroke);
          ui.text.setAttribute('fill', textFill);
          ui.g.style.transform = scale;
        } else {
          ui.g.style.opacity = '0';
        }
      });

      // 3. تحديث المعادلة الرياضية
      if (s.eq) {
        formulaTextUI.style.opacity = '1';
        formulaTextUI.textContent = s.eq;
      } else {
        formulaTextUI.style.opacity = '0';
      }
    }

    function startPlay() {
      playing = true;
      btnPlay.textContent = _AL.t('pause');
      btnPlay.dataset.playing = '1';
      if (cur >= steps.length - 1) cur = 0;
      interval = setInterval(function() {
        if (cur < steps.length - 1) { cur++; render(); }
        else stopPlay();
      }, getDelay());
    }

    function stopPlay() {
      playing = false;
      clearInterval(interval);
      interval = null;
      btnPlay.textContent = _AL.t('play');
      btnPlay.dataset.playing = '0';
    }

    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() {
      stopPlay();
      if (cur > 0) { cur--; render(); }
    });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() {
      stopPlay();
      if (cur < steps.length - 1) { cur++; render(); }
    });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() {
      playing ? stopPlay() : startPlay();
    });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() {
      stopPlay();
      generateSteps();
      cur = 0;
      render();
    });
    
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function() {
          if (cur < steps.length - 1) { cur++; render(); }
          else stopPlay();
        }, getDelay());
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
      
      // حاوية متجاوبة بأبعاد 16:9
      '<div class="algo-canvas" style="position:relative; width:100%; max-width:750px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:visible;">' +
        '<svg id="w5-svg" width="100%" height="100%" viewBox="0 0 750 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-400);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w5-node"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-muted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-empty"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-optimal"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w5-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var svgEl   = container.querySelector('#w5-svg');
    
    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // عناصر واجهة SVG برمجياً
    var ui = {
      formula: null,
      root: { g: null, circ: null, text: null },
      leftArrow: null, rightArrow: null,
      leftChild: { g: null, circ: null, tri: null, rect: null, text: null },
      rightChild: { g: null, circ: null, tri: null, rect: null, text: null },
      cardsGroup: null,
      cards: {}
    };

    // الثوابت الهندسية
    const rootPos  = { x: 375, y: 130 };
    const leftPos  = { x: 200, y: 260 };
    const rightPos = { x: 550, y: 260 };
    const R = 26;

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w5-node"]').textContent    = _AL.exp('Node / Subtree', 'عقدة / شجرة فرعية');
      container.querySelector('[data-algo-text="w5-empty"]').textContent   = _AL.exp('Empty (Null)', 'فارغ (Null)');
      container.querySelector('[data-algo-text="w5-optimal"]').textContent = _AL.exp('Optimal Choice', 'الخيار الأمثل');
    }

    function generateSteps() {
      steps = [
        { k: null, kLabel: 'ₖ', phase: 'intro', left: 'tri', right: 'tri', leftL: 'aᵢ ... aₖ₋₁', rightL: 'aₖ₊₁ ... aⱼ', c1: '', c2: '', c3: '', 
          en: 'DP Approach: Try every key aₖ as the root. The left and right children will be optimal subtrees.', 
          ar: 'نهج البرمجة الديناميكية: سنجرب كل مفتاح aₖ كجذر. الأبناء ستكون الأشجار الفرعية المثلى.' },
        
        { k: 1, kLabel: '₁', phase: 'try', left: 'null', right: 'tri', leftL: 'Null', rightL: 'a₂, a₃', c1: '...', c2: '', c3: '', 
          en: 'Example (i=1, j=3): Try <strong>k=1</strong> as root. Left subtree is empty, right is optimal BST for {a₂, a₃}.', 
          ar: 'مثال (i=1, j=3): لنجرب <strong>k=1</strong> كجذر. الشجرة اليسرى فارغة، واليمنى هي الشجرة المثلى للمفاتيح {a₂, a₃}.' },
        
        { k: 1, kLabel: '₁', phase: 'calc', left: 'null', right: 'tri', leftL: 'Null', rightL: 'a₂, a₃', c1: '45', c2: '', c3: '', 
          en: 'Cost for k=1 is: C[1,0] + C[2,3] + sum(p) = <strong>45</strong>.', 
          ar: 'التكلفة عند اختيار k=1 هي: C[1,0] + C[2,3] + sum(p) = <strong>45</strong>.' },
        
        { k: 2, kLabel: '₂', phase: 'try', left: 'circ', right: 'circ', leftL: 'a₁', rightL: 'a₃', c1: '45', c2: '...', c3: '', 
          en: 'Try <strong>k=2</strong> as root. Left subtree is just a₁, right subtree is just a₃.', 
          ar: 'لنجرب <strong>k=2</strong> كجذر. الشجرة اليسرى تحتوي a₁ فقط، واليمنى تحتوي a₃ فقط.' },
        
        { k: 2, kLabel: '₂', phase: 'calc', left: 'circ', right: 'circ', leftL: 'a₁', rightL: 'a₃', c1: '45', c2: '38', c3: '', 
          en: 'Cost for k=2 is: C[1,1] + C[3,3] + sum(p) = <strong>38</strong>.', 
          ar: 'التكلفة عند اختيار k=2 هي: C[1,1] + C[3,3] + sum(p) = <strong>38</strong>.' },
        
        { k: 3, kLabel: '₃', phase: 'try', left: 'tri', right: 'null', leftL: 'a₁, a₂', rightL: 'Null', c1: '45', c2: '38', c3: '...', 
          en: 'Try <strong>k=3</strong> as root. Left is optimal BST for {a₁, a₂}, right subtree is empty.', 
          ar: 'لنجرب <strong>k=3</strong> كجذر. الشجرة اليسرى هي الشجرة المثلى للمفاتيح {a₁, a₂}، واليمنى فارغة.' },
        
        { k: 3, kLabel: '₃', phase: 'calc', left: 'tri', right: 'null', leftL: 'a₁, a₂', rightL: 'Null', c1: '45', c2: '38', c3: '52', 
          en: 'Cost for k=3 is: C[1,2] + C[4,3] + sum(p) = <strong>52</strong>.', 
          ar: 'التكلفة عند اختيار k=3 هي: C[1,2] + C[4,3] + sum(p) = <strong>52</strong>.' },
        
        { k: 2, kLabel: '₂', phase: 'result', left: 'circ', right: 'circ', leftL: 'a₁', rightL: 'a₃', c1: '45', c2: '38', c3: '52', min: 2, 
          en: 'The minimum cost among all choices is 38 (when k=2). Therefore, <strong>a₂</strong> is the optimal root!', 
          ar: 'أقل تكلفة بين جميع الخيارات هي 38 (عندما k=2). إذن، <strong>a₂</strong> هو الجذر الأمثل!' }
      ];
    }

    // دالة مساعدة لإنشاء عناصر SVG بمرونة
    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function createChildNode(cx, cy) {
      let g = makeSVG('g', { transform: `translate(${cx}, ${cy})` });
      
      // الأشكال الثلاثة المحتملة (يتم تفعيل واحد منها فقط عبر الـ Opacity)
      let circ = makeSVG('circle', { cx: 0, cy: 0, r: R, fill: 'var(--brand-400)', stroke: 'var(--algo-bg)', 'stroke-width': 2 });
      let tri = makeSVG('polygon', { points: `0,-35 -65,35 65,35`, fill: 'var(--brand-400)', stroke: 'var(--algo-bg)', 'stroke-width': 2 });
      let rect = makeSVG('rect', { x: -25, y: -20, width: 50, height: 40, rx: 6, fill: 'var(--algo-muted)', stroke: 'var(--algo-bg)', 'stroke-width': 2 });
      
      let text = makeSVG('text', { x: 0, y: 0, dy: '.1em', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: '#ffffff', 'font-family': "'JetBrains Mono', monospace", 'font-size': '16px', 'font-weight': '800' });

      g.appendChild(circ);
      g.appendChild(tri);
      g.appendChild(rect);
      g.appendChild(text);

      return { g, circ, tri, rect, text };
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      
      let defs = makeSVG('defs', {});
      defs.innerHTML = `
        <marker id="arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/></marker>
        <marker id="arr-sorted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-sorted)"/></marker>
      `;
      svgEl.appendChild(defs);

      // 1. المعادلة بالأعلى
      ui.formula = makeSVG('text', { x: 375, y: 40, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '18px', 'font-weight': 'bold' });
      svgEl.appendChild(ui.formula);

      // 2. الأسهم 
      ui.leftArrow = makeSVG('line', { 'stroke-width': 3, 'stroke': 'var(--text-muted)' });
      ui.rightArrow = makeSVG('line', { 'stroke-width': 3, 'stroke': 'var(--text-muted)' });
      svgEl.appendChild(ui.leftArrow);
      svgEl.appendChild(ui.rightArrow);

      // 3. العقدة الجذر
      ui.root.g = makeSVG('g', {});
      
      // إصلاح الخلل: تحديد نقطة المركز بدقة لضمان تكبير العقدة في مكانها دون انزياح
      ui.root.g.style.transformOrigin = `${rootPos.x}px ${rootPos.y}px`;
      
      ui.root.circ = makeSVG('circle', { cx: rootPos.x, cy: rootPos.y, r: R, fill: 'var(--brand-500)', stroke: 'var(--algo-bg)', 'stroke-width': 2 });
      ui.root.text = makeSVG('text', { x: rootPos.x, y: rootPos.y, dy: '.1em', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: '#ffffff', 'font-family': "'JetBrains Mono', monospace", 'font-size': '20px', 'font-weight': '800' });
      ui.root.g.appendChild(ui.root.circ);
      ui.root.g.appendChild(ui.root.text);
      svgEl.appendChild(ui.root.g);

      // 4. الأبناء
      ui.leftChild = createChildNode(leftPos.x, leftPos.y);
      ui.rightChild = createChildNode(rightPos.x, rightPos.y);
      svgEl.appendChild(ui.leftChild.g);
      svgEl.appendChild(ui.rightChild.g);

      // 5. بطاقات التكلفة بالأسفل (Cards)
      ui.cardsGroup = makeSVG('g', { transform: 'translate(0, 340)' });
      let cardCenters = [200, 375, 550]; // مراكز البطاقات
      
      for (let i = 1; i <= 3; i++) {
        let cx = cardCenters[i-1];
        let card = {
          rect: makeSVG('rect', { x: cx - 60, y: 0, width: 120, height: 65, rx: 8, fill: 'var(--algo-canvas-bg)', stroke: 'var(--algo-border)', 'stroke-width': 2 }),
          title: makeSVG('text', { x: cx, y: 20, dy: '.1em', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': 'bold' }),
          val: makeSVG('text', { x: cx, y: 45, dy: '.1em', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--algo-text)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '22px', 'font-weight': '800' })
        };
        card.title.textContent = `k = ${i}`;
        
        ui.cardsGroup.appendChild(card.rect);
        ui.cardsGroup.appendChild(card.title);
        ui.cardsGroup.appendChild(card.val);
        ui.cards[i] = card;
      }
      svgEl.appendChild(ui.cardsGroup);

      isInitialized = true;
    }

    // حساب انطلاق ووصول السهم بدقة
    function updateArrow(lineUI, fromPos, toPos, targetType, isResult) {
      let dx = toPos.x - fromPos.x;
      let dy = toPos.y - fromPos.y;
      let dist = Math.hypot(dx, dy);

      // إصلاح الخلل: أخذ التكبير (1.1) في عين الاعتبار لكي يظل السهم متصلاً بحافة الدائرة
      let currentR = isResult ? R * 1.1 : R;
      
      let sx = fromPos.x + (dx/dist) * (currentR + 2);
      let sy = fromPos.y + (dy/dist) * (currentR + 2);

      let ex, ey;
      if (targetType === 'circ') {
        ex = toPos.x - (dx/dist) * (R + 5);
        ey = toPos.y - (dy/dist) * (R + 5);
      } else if (targetType === 'tri') {
        ex = toPos.x - (dx/dist) * 5;
        ey = (toPos.y - 35) - 5;
      } else if (targetType === 'null') {
        ex = toPos.x - (dx/dist) * 5;
        ey = (toPos.y - 20) - 5;
      }

      lineUI.setAttribute('x1', sx);
      lineUI.setAttribute('y1', sy);
      lineUI.setAttribute('x2', ex);
      lineUI.setAttribute('y2', ey);
      
      lineUI.setAttribute('stroke', isResult ? 'var(--algo-sorted)' : 'var(--text-muted)');
      lineUI.setAttribute('marker-end', isResult ? 'url(#arr-sorted)' : 'url(#arr-muted)');
    }

    function updateChildUI(childUI, type, label, isResult) {
      childUI.circ.style.opacity = '0';
      childUI.tri.style.opacity = '0';
      childUI.rect.style.opacity = '0';

      let color = isResult ? 'var(--algo-sorted)' : 'var(--brand-400)';
      if (type === 'null') color = 'var(--algo-muted)';

      if (type === 'circ') {
        childUI.circ.style.opacity = '1';
        childUI.circ.setAttribute('fill', color);
        childUI.circ.setAttribute('stroke', isResult ? '#fff' : 'var(--algo-bg)');
      } else if (type === 'tri') {
        childUI.tri.style.opacity = '1';
        childUI.tri.setAttribute('fill', color);
        childUI.tri.setAttribute('stroke', isResult ? '#fff' : 'var(--algo-bg)');
      } else if (type === 'null') {
        childUI.rect.style.opacity = '1';
      }

      childUI.text.textContent = label;
      childUI.text.setAttribute('y', type === 'tri' ? '15' : '0'); // Triangle text needs offset
      childUI.text.setAttribute('font-size', type === 'null' ? '14px' : '16px');
      childUI.text.setAttribute('fill', type === 'null' ? 'var(--text-primary)' : '#ffffff');
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // تحديث المعادلة العلوية
      ui.formula.textContent = s.phase === 'intro' 
        ? 'C[i,j] = min( C[i,k-1] + C[k+1,j] ) + sum(p)' 
        : 'C[1,3] = min( C[1,k-1] + C[k+1,3] ) + sum(p)';

      // تحديث الجذر
      let isResult = s.phase === 'result';
      ui.root.circ.setAttribute('fill', (isResult && s.min === s.k) ? 'var(--algo-sorted)' : 'var(--brand-500)');
      ui.root.circ.setAttribute('stroke', isResult ? '#ffffff' : 'var(--algo-bg)');
      ui.root.text.textContent = 'a' + s.kLabel;
      ui.root.g.style.transform = isResult ? 'scale(1.1)' : 'scale(1)';

      // تحديث الأبناء
      updateChildUI(ui.leftChild, s.left, s.leftL, isResult);
      updateChildUI(ui.rightChild, s.right, s.rightL, isResult);

      // تحديث الأسهم
      updateArrow(ui.leftArrow, rootPos, leftPos, s.left, isResult);
      updateArrow(ui.rightArrow, rootPos, rightPos, s.right, isResult);

      // تحديث البطاقات
      if (s.phase === 'intro') {
        ui.cardsGroup.style.opacity = '0';
      } else {
        ui.cardsGroup.style.opacity = '1';
        for (let i = 1; i <= 3; i++) {
          let card = ui.cards[i];
          let isTarget = isResult && s.min === i;
          let isCurrent = s.k === i && !isResult;
          
          let borderColor = isTarget ? 'var(--algo-sorted)' : (isCurrent ? 'var(--algo-active)' : 'var(--algo-border)');
          let borderWidth = isTarget || isCurrent ? '3' : '2';
          let valColor = isTarget ? 'var(--algo-sorted)' : (isCurrent ? 'var(--algo-active)' : 'var(--algo-text)');
          let transY = isTarget || isCurrent ? '-5px' : '0px'; // بطاقة بارزة

          card.rect.setAttribute('stroke', borderColor);
          card.rect.setAttribute('stroke-width', borderWidth);
          card.rect.style.transform = `translateY(${transY})`;
          card.title.style.transform = `translateY(${transY})`;
          card.val.style.transform = `translateY(${transY})`;

          card.val.textContent = s['c'+i];
          card.val.setAttribute('fill', valColor);
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
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); generateSteps(); cur = 0; render(); });
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if (playing) {
        clearInterval(interval);
        interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
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