// M07_algo.js — Interactive algorithm widgets
// Generated: 2026-03-03T16:43:39
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
window._algoTitles[1] = { en: 'Heap Definition and Properties', ar: 'تعريف الكومة وخصائصها' };
window._algoTitles[2] = { en: 'Heap\'s Array Representation', ar: 'تمثيل الكومة بالمصفوفة' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بذكاء: الشجرتان بجانب بعضهما في الشاشات الكبيرة، وفوق بعضهما في الجوال
      '<div class="algo-canvas" id="w1-canvas-container" style="width:100%; min-height:300px; display:flex; flex-wrap:wrap; justify-content:space-evenly; align-items:flex-start; padding:15px 5px; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); gap: 10px;">' +
        
        // الشجرة الأولى (Max-Heap صحيح)
        '<div style="text-align:center; flex: 1 1 45%; min-width: 240px; display:flex; flex-direction:column; align-items:center;">' +
          '<h5 data-algo-text="w1-title-left" style="color:var(--text-primary); font-weight:800; font-size:1rem; margin-bottom:5px; font-family:\'Cairo\', sans-serif;"></h5>' +
          '<svg id="w1-tree-left" viewBox="0 0 300 250" style="width:100%; max-width:300px; height:auto; overflow:visible;"></svg>' +
        '</div>' +
        
        // الشجرة الثانية (Max-Heap خاطئ)
        '<div style="text-align:center; flex: 1 1 45%; min-width: 240px; display:flex; flex-direction:column; align-items:center;">' +
          '<h5 data-algo-text="w1-title-right" style="color:var(--text-primary); font-weight:800; font-size:1rem; margin-bottom:5px; font-family:\'Cairo\', sans-serif;"></h5>' +
          '<svg id="w1-tree-right" viewBox="0 0 300 250" style="width:100%; max-width:300px; height:auto; overflow:visible;"></svg>' +
        '</div>' +
        
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.8rem; color: var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-node-normal"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-node-active"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w1-node-violation"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay   = container.querySelector('[data-algo-btn="play"]');
    var expEl     = container.querySelector('#w1-exp');
    var svgLeft   = container.querySelector('#w1-tree-left');
    var svgRight  = container.querySelector('#w1-tree-right');
    var counter   = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
 
    // إحداثيات نسبية مبنية على viewBox(0 0 300 250) لكل شجرة
    var leftNodes = {
      'L0': { id: 'L0', val: 10, x: 150, y: 40,  children: ['L1', 'L2'] },
      'L1': { id: 'L1', val: 5,  x: 75,  y: 120, children: ['L3', 'L4'] },
      'L2': { id: 'L2', val: 7,  x: 225, y: 120, children: ['L5'] },
      'L3': { id: 'L3', val: 4,  x: 40,  y: 200, children: [] },
      'L4': { id: 'L4', val: 2,  x: 110, y: 200, children: [] },
      'L5': { id: 'L5', val: 1,  x: 190, y: 200, children: [] }
    };
 
    var rightNodes = {
      'R0': { id: 'R0', val: 10, x: 150, y: 40,  children: ['R1', 'R2'] },
      'R1': { id: 'R1', val: 5,  x: 75,  y: 120, children: ['R3', 'R4'] },
      'R2': { id: 'R2', val: 7,  x: 225, y: 120, children: ['R5'] },
      'R3': { id: 'R3', val: 6,  x: 40,  y: 200, children: [] }, // Violation
      'R4': { id: 'R4', val: 2,  x: 110, y: 200, children: [] },
      'R5': { id: 'R5', val: 1,  x: 190, y: 200, children: [] }
    };
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-title-left"]').textContent   = _AL.exp('Valid Max-Heap', 'كومة قصوى (Max-Heap) صالحة');
      container.querySelector('[data-algo-text="w1-title-right"]').textContent  = _AL.exp('Invalid Max-Heap', 'ليست كومة قصوى');
      container.querySelector('[data-algo-text="w1-node-normal"]').textContent    = _AL.exp('Normal Node', 'عقدة عادية');
      container.querySelector('[data-algo-text="w1-node-active"]').textContent    = _AL.exp('Checking Property', 'فحص الخاصية');
      container.querySelector('[data-algo-text="w1-node-violation"]').textContent = _AL.exp('Property Violation', 'انتهاك الخاصية');
    }
 
    function generateSteps() {
      steps = [];
      
      // Step 0: Initial state
      steps.push({
        en: 'A <strong>Max-Heap</strong> requires every parent node to have a value greater than or equal to its children. Let\'s verify these two trees.',
        ar: 'تتطلب <strong>الكومة القصوى (Max-Heap)</strong> أن تكون قيمة كل عقدة أب أكبر من أو تساوي قيم أبنائها. دعنا نتحقق من هاتين الشجرتين.',
        stateL: { highlight: [], fade: false },
        stateR: { highlight: [], error: [], fade: false }
      });
      
      // Step 1: Valid tree check
      steps.push({
        en: 'In the Left Tree, every node satisfies the property. For example, 10 > 5 and 10 > 7. It is a valid Max-Heap.',
        ar: 'في الشجرة اليسرى، كل عقدة تحقق الخاصية. مثلاً: 10 > 5 و 10 > 7. إنها كومة قصوى صالحة.',
        stateL: { highlight: ['L0', 'L1', 'L2'], fade: false },
        stateR: { highlight: [], error: [], fade: true } // تبهيت الشجرة اليمنى
      });
 
      // Step 2: Invalid tree focus
      steps.push({
        en: 'Now look at the Right Tree. Let\'s check node 5 and its children.',
        ar: 'الآن لننظر إلى الشجرة اليمنى. لنتحقق من العقدة 5 وأبنائها.',
        stateL: { highlight: [], fade: true }, // تبهيت الشجرة اليسرى للتركيز
        stateR: { highlight: ['R1', 'R3', 'R4'], error: [], fade: false }
      });
 
      // Step 3: Highlight Violation
      steps.push({
        en: 'Here is a <strong>violation!</strong> Node 6 (child) is greater than its parent 5. Therefore, the Right Tree is NOT a valid Max-Heap.',
        ar: 'يوجد هنا <strong>انتهاك للخاصية!</strong> العقدة 6 (الابن) أكبر من العقدة الأب 5. لذلك، الشجرة اليمنى ليست كومة قصوى صالحة.',
        stateL: { highlight: [], fade: true },
        stateR: { highlight: [], error: ['R1', 'R3'], fade: false } // إضاءة الخطأ بالأحمر
      });
    }
 
    // رسم شجرة محددة في SVG محدد بناءً على الإعدادات
    function drawTree(svg, treeData, state) {
      svg.innerHTML = '';
      var radius = 20;
      var ns = 'http://www.w3.org/2000/svg';
      
      // إعداد الشفافية العامة (تأثير الخفوت Fade)
      var treeOpacity = state.fade ? '0.2' : '1';
      var gTree = document.createElementNS(ns, 'g');
      gTree.style.opacity = treeOpacity;
      gTree.style.transition = 'opacity 0.4s ease';

      // 1. رسم الخطوط (في الخلفية) باستخدام حسابات رياضية لتلامس الحواف
      Object.keys(treeData).forEach(key => {
        let parent = treeData[key];
        parent.children.forEach(childKey => {
          let child = treeData[childKey];
          
          let dx = child.x - parent.x;
          let dy = child.y - parent.y;
          let dist = Math.hypot(dx, dy);
          
          // حساب نقطة التلامس مع الدائرة
          let x1 = parent.x + (dx / dist) * radius;
          let y1 = parent.y + (dy / dist) * radius;
          let x2 = child.x - (dx / dist) * radius;
          let y2 = child.y - (dy / dist) * radius;

          // هل هذا الخط هو جزء من "انتهاك"؟
          let isErrorLine = state.error && state.error.includes(parent.id) && state.error.includes(child.id);
          
          let line = document.createElementNS(ns, 'line');
          line.setAttribute('x1', x1);
          line.setAttribute('y1', y1);
          line.setAttribute('x2', x2);
          line.setAttribute('y2', y2);
          line.setAttribute('stroke', isErrorLine ? 'var(--algo-compare)' : 'var(--text-muted)');
          line.setAttribute('stroke-width', isErrorLine ? '4' : '2');
          if (isErrorLine) line.setAttribute('stroke-dasharray', '5,5');
          line.style.transition = 'all 0.3s ease';
          
          gTree.appendChild(line);
        });
      });
 
      // 2. رسم العقد والنصوص (في المقدمة)
      Object.keys(treeData).forEach(key => {
        let node = treeData[key];
        
        let isHighlight = state.highlight && state.highlight.includes(node.id);
        let isError     = state.error && state.error.includes(node.id);
        
        let fill = 'var(--brand-500)';
        let strokeColor = 'var(--algo-border)';
        let strokeW = '2';
        let scale = '1';

        if (isHighlight) {
          fill = 'var(--algo-active)';
          strokeColor = '#ffffff';
          strokeW = '3';
          scale = '1.15';
        }
        if (isError) {
          fill = 'var(--algo-compare)';
          strokeColor = '#ffffff';
          strokeW = '3';
          scale = '1.15';
        }

        let gNode = document.createElementNS(ns, 'g');
        gNode.style.transform = `scale(${scale})`;
        gNode.style.transformOrigin = `${node.x}px ${node.y}px`;
        gNode.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        let circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', fill);
        circle.setAttribute('stroke', strokeColor);
        circle.setAttribute('stroke-width', strokeW);
        circle.style.transition = 'fill 0.3s ease, stroke 0.3s ease';
        gNode.appendChild(circle);
 
        let text = document.createElementNS(ns, 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y);
        text.setAttribute('dy', '.1em');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '16px');
        text.setAttribute('font-weight', '800');
        text.setAttribute('font-family', "'Inter', sans-serif");
        text.textContent = node.val;
        gNode.appendChild(text);
        
        gTree.appendChild(gNode);
      });
      
      svg.appendChild(gTree);
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
      
      // رسم الشجرتين وتمرير حالة الإضاءة لكل واحدة
      drawTree(svgLeft, leftNodes, s.stateL);
      drawTree(svgRight, rightNodes, s.stateR);
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
 
    window._algoRerenders[1] = render;
    generateSteps();
    render();
};

window.AlgoWidgets[2] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(2) +
      _AL.toolbar(2) +
      '<div class="algo-explanation" id="w2-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة 16:9 تضمن احتواء الشجرة والمصفوفة بشكل ممتاز
      '<div class="algo-canvas" id="w2-canvas-container" style="width:100%; max-width:800px; aspect-ratio: 16 / 9; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
        '<svg id="w2-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.8rem; color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-normal"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-current"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-child"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w2-parent"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w2-exp');
    var counter  = container.querySelector('[data-algo-counter]');
    var svgEl    = container.querySelector('#w2-svg');

    var steps = [], cur = 0, playing = false, interval = null;

    // بيانات الكومة (Heap)
    // نستخدم الفهرس من 1 لتسهيل المعادلات الرياضية (1-based index)
    const heap = [null, 9, 5, 3, 1, 4, 2];
    
    // إحداثيات الشجرة
    const R = 22; // نصف القطر
    const treePos = {
      1: { x: 400, y: 50 },
      2: { x: 250, y: 140 },
      3: { x: 550, y: 140 },
      4: { x: 175, y: 230 },
      5: { x: 325, y: 230 },
      6: { x: 475, y: 230 }
    };

    // إحداثيات المصفوفة
    const cellW = 55;
    const cellH = 55;
    const cellGap = 6;
    const arrayY = 360;
    const totalW = (6 * cellW) + (5 * cellGap);
    const startX = 400 - (totalW / 2);
    const arrPos = {};
    for(let i=1; i<=6; i++) {
        arrPos[i] = { x: startX + (i-1)*(cellW + cellGap), y: arrayY };
    }

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w2-normal"]').textContent  = _AL.exp('Normal Node', 'عقدة طبيعية');
      container.querySelector('[data-algo-text="w2-current"]').textContent = _AL.exp('Current Index (i)', 'الفهرس الحالي (i)');
      container.querySelector('[data-algo-text="w2-child"]').textContent   = _AL.exp('Children (2i, 2i+1)', 'الأبناء (2i, 2i+1)');
      container.querySelector('[data-algo-text="w2-parent"]').textContent  = _AL.exp('Parent floor(i/2)', 'الأب floor(i/2)');
    }

    function generateSteps() {
      steps = [];

      steps.push({
        current: [], children: [], parent: [],
        en: 'A Binary Heap is efficiently represented as an array (1-based index). The root is at index 1.',
        ar: 'تُمثّل الكومة الثنائية (Binary Heap) بكفاءة داخل مصفوفة (يبدأ الفهرس من 1). يقع الجذر دائماً في الفهرس 1.'
      });

      steps.push({
        current: [2], children: [4, 5], parent: [],
        en: 'For any node at index <strong dir="ltr">i</strong>, its Left Child is at <strong dir="ltr">2i</strong> and Right Child is at <strong dir="ltr">2i+1</strong>. For node at index 2 (value 5): Left=4, Right=5.',
        ar: 'لأي عقدة في الفهرس <strong dir="ltr">i</strong>، يقع الابن الأيسر في <strong dir="ltr">2i</strong> والأيمن في <strong dir="ltr">2i+1</strong>. العقدة في الفهرس 2: الأيسر=4، والأيمن=5.'
      });

      steps.push({
        current: [3], children: [6], parent: [],
        en: 'For node at index 3 (value 3): Left=6. The Right Child would be 7, but the array ends at 6.',
        ar: 'للعقدة في الفهرس 3 (القيمة 3): الأيسر=6. الابن الأيمن يفترض أن يكون 7، لكن المصفوفة تنتهي عند 6.'
      });

      steps.push({
        current: [4], children: [], parent: [2],
        en: 'To find a parent of a node at index <strong dir="ltr">i</strong>, we use <strong dir="ltr">floor(i/2)</strong>. For node at index 4 (value 1), its Parent is at index 2.',
        ar: 'للعثور على الأب لعقدة في الفهرس <strong dir="ltr">i</strong>، نستخدم <strong dir="ltr">floor(i/2)</strong>. العقدة في الفهرس 4 (القيمة 1)، يقع أبوها في الفهرس 2.'
      });

      steps.push({
        current: [6], children: [], parent: [3],
        en: 'Similarly, for the node at index 6 (value 2), its Parent is at <strong dir="ltr">floor(6/2) = 3</strong>.',
        ar: 'بالمثل، العقدة التي في الفهرس 6 (القيمة 2)، يقع أبوها في الفهرس <strong dir="ltr">floor(6/2) = 3</strong>.'
      });

      steps.push({
        current: [], children: [], parent: [],
        en: 'These simple math formulas allow us to traverse the heap tree purely within the array, without any slow pointers!',
        ar: 'هذه المعادلات الرياضية البسيطة تتيح لنا التنقل صعوداً وهبوطاً في الشجرة باستخدام المصفوفة فقط، وبدون استخدام أي مؤشرات (Pointers) بطيئة!'
      });
    }

    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      var colorMap = {
        'normal':  'var(--brand-500)',
        'current': 'var(--algo-active)',
        'child':   'var(--algo-compare)',
        'parent':  'var(--algo-swap)'
      };

      let svgHTML = '<defs>';
      // رؤوس الأسهم لتناسب ألوان الأفعال
      ['current', 'child', 'parent'].forEach(key => {
        svgHTML += `<marker id="arr-${key}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${colorMap[key]}" /></marker>`;
      });
      svgHTML += '</defs>';

      // 1. رسم خطوط الشجرة الثابتة
      for (let i = 1; i <= 6; i++) {
        let leftIdx = 2 * i;
        let rightIdx = 2 * i + 1;
        
        [leftIdx, rightIdx].forEach(childIdx => {
          if (childIdx <= 6) {
            let p1 = treePos[i];
            let p2 = treePos[childIdx];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.hypot(dx, dy);
            
            // حساب المثلثات لتلامس الحواف
            let x1 = p1.x + (dx/dist)*R;
            let y1 = p1.y + (dy/dist)*R;
            let x2 = p2.x - (dx/dist)*R;
            let y2 = p2.y - (dy/dist)*R;

            svgHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--text-muted)" stroke-width="3" opacity="0.5"></line>`;
          }
        });
      }

      // 2. رسم خطوط الربط الشفافة بين الشجرة والمصفوفة (للعناصر النشطة)
      [...s.current, ...s.children, ...s.parent].forEach(idx => {
          let tP = treePos[idx];
          let aP = arrPos[idx];
          let color = s.current.includes(idx) ? colorMap['current'] : 
                      s.children.includes(idx) ? colorMap['child'] : colorMap['parent'];
          
          svgHTML += `<line x1="${tP.x}" y1="${tP.y + R + 5}" x2="${aP.x + cellW/2}" y2="${aP.y - 5}" stroke="${color}" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"></line>`;
      });

      // 3. رسم أقواس المصفوفة (القفزات)
      s.children.forEach(childIdx => {
          let cIdx = s.current[0];
          let x1 = arrPos[cIdx].x + cellW/2;
          let y1 = arrPos[cIdx].y - 5;
          let x2 = arrPos[childIdx].x + cellW/2;
          let y2 = arrPos[childIdx].y - 5;
          let midX = (x1 + x2) / 2;
          let arcHeight = y1 - 40 - (Math.abs(x1 - x2) * 0.15); // ارتفاع القوس بناءً على المسافة
          
          svgHTML += `<path d="M ${x1} ${y1} Q ${midX} ${arcHeight} ${x2} ${y2}" fill="none" stroke="${colorMap['child']}" stroke-width="3" marker-end="url(#arr-child)" style="transition: all 0.3s ease;"></path>`;
      });

      s.parent.forEach(parentIdx => {
          let cIdx = s.current[0];
          let x1 = arrPos[cIdx].x + cellW/2;
          let y1 = arrPos[cIdx].y - 5;
          let x2 = arrPos[parentIdx].x + cellW/2;
          let y2 = arrPos[parentIdx].y - 5;
          let midX = (x1 + x2) / 2;
          let arcHeight = y1 - 40 - (Math.abs(x1 - x2) * 0.15);
          
          svgHTML += `<path d="M ${x1} ${y1} Q ${midX} ${arcHeight} ${x2} ${y2}" fill="none" stroke="${colorMap['parent']}" stroke-width="3" marker-end="url(#arr-parent)" style="transition: all 0.3s ease;"></path>`;
      });

      // 4. رسم العقد في الشجرة
      for (let i = 1; i <= 6; i++) {
        let pos = treePos[i];
        let val = heap[i];
        
        let state = 'normal';
        if (s.current.includes(i)) state = 'current';
        else if (s.children.includes(i)) state = 'child';
        else if (s.parent.includes(i)) state = 'parent';

        let fill = colorMap[state];
        let strokeColor = state === 'normal' ? 'var(--algo-border)' : '#ffffff';
        let sw = state === 'normal' ? '2' : '3';
        let scale = state === 'normal' ? 'scale(1)' : 'scale(1.15)';

        svgHTML += `<g style="transform: ${scale}; transform-origin: ${pos.x}px ${pos.y}px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
          <circle cx="${pos.x}" cy="${pos.y}" r="${R}" fill="${fill}" stroke="${strokeColor}" stroke-width="${sw}"></circle>
          <text x="${pos.x}" y="${pos.y}" dy=".1em" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="16px" font-weight="800" font-family="'JetBrains Mono', monospace">${val}</text>
          <text x="${pos.x + R + 10}" y="${pos.y}" dy=".1em" text-anchor="middle" dominant-baseline="middle" fill="var(--text-muted)" font-size="12px" font-weight="700" font-family="'JetBrains Mono', monospace">i=${i}</text>
        </g>`;
      }

      // 5. رسم خلايا المصفوفة
      for (let i = 1; i <= 6; i++) {
        let pos = arrPos[i];
        let val = heap[i];
        
        let state = 'normal';
        if (s.current.includes(i)) state = 'current';
        else if (s.children.includes(i)) state = 'child';
        else if (s.parent.includes(i)) state = 'parent';

        let fill = state === 'normal' ? 'var(--bg-elevated)' : colorMap[state];
        let strokeColor = state === 'normal' ? 'var(--border-color)' : colorMap[state];
        let textColor = state === 'normal' ? 'var(--text-primary)' : '#ffffff';
        let sw = state === 'normal' ? '1.5' : '3';
        let transY = state === 'normal' ? '0' : '-8px'; // بروز الخلية عند التحديد

        svgHTML += `<g style="transform: translateY(${transY}); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
          <rect x="${pos.x}" y="${pos.y}" width="${cellW}" height="${cellH}" rx="8" ry="8" fill="${fill}" stroke="${strokeColor}" stroke-width="${sw}"></rect>
          <text x="${pos.x + cellW/2}" y="${pos.y + cellH/2}" dy=".1em" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="18px" font-weight="800" font-family="'JetBrains Mono', monospace">${val}</text>
          <text x="${pos.x + cellW/2}" y="${pos.y + cellH + 18}" text-anchor="middle" fill="var(--text-muted)" font-size="12px" font-weight="700" font-family="'JetBrains Mono', monospace">i=${i}</text>
        </g>`;
      }

      svgEl.innerHTML = svgHTML;
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
      if (playing) { clearInterval(interval); interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
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