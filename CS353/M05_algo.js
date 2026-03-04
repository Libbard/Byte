// M05_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T02:41:34
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
window._algoTitles[1] = { en: 'Divide-and-Conquer Paradigm', ar: 'نموذج فرّق تسد' };
window._algoTitles[2] = { en: 'Merge Sort', ar: 'الترتيب بالدمج' };
window._algoTitles[3] = { en: 'Quick Sort', ar: 'الترتيب السريع (تقسيم هوار)' };
window._algoTitles[4] = { en: 'Binary Tree Traversals', ar: 'اجتيازات الشجرة الثنائية' };
window._algoTitles[5] = { en: 'Closest-Pair Problem', ar: 'مشكلة أقرب زوج من النقاط' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية الرسم المتجاوبة (4:3)
      '<div class="algo-canvas" id="w1-canvas" style="width:100%; max-width:600px; aspect-ratio: 4 / 3; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
        '<svg id="w1-canvas-svg" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان (تم تحسين المسميات لتلائم جميع الخطوات بما فيها الخطوة الأخيرة)
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.8rem; color: var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-pending"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-divide"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-conquer"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-combine"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-focus"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w1-exp');
    var counter  = container.querySelector('[data-algo-counter]');
    var svgEl    = container.querySelector('#w1-canvas-svg');
 
    var steps = [], cur = 0, playing = false, interval = null;
 
    // تعريف الدوائر ونصوصها المقسمة لسطرين
    var nodesData = {
      'problem-n': { cx: 300, cy: 75, r: 52, en1: 'Problem', en2: 'size n', ar1: 'مشكلة', ar2: 'بحجم n' },
      'sub-L': { cx: 150, cy: 225, r: 45, en1: 'Sub-problem', en2: 'n/2', ar1: 'مشكلة فرعية', ar2: 'n/2' },
      'sub-R': { cx: 450, cy: 225, r: 45, en1: 'Sub-problem', en2: 'n/2', ar1: 'مشكلة فرعية', ar2: 'n/2' },
      'solution-n': { cx: 300, cy: 375, r: 52, en1: 'Solution', en2: 'of n', ar1: 'حل المشكلة', ar2: 'n' }
    };

    // التعديل الأهم: إضافة إزاحة (dx, dy) لكي يبتعد النص عن السهم تماماً وبشكل هندسي سليم
    var linesConfig = [
      { id: 'div-L', from: 'problem-n', to: 'sub-L', en: 'Divide', ar: 'قسّم', dx: -25, dy: -15 },
      { id: 'div-R', from: 'problem-n', to: 'sub-R', en: 'Divide', ar: 'قسّم', dx: 25, dy: -15 },
      { id: 'com-L', from: 'sub-L', to: 'solution-n', en: 'Combine', ar: 'ادمج', dx: -25, dy: 15 },
      { id: 'com-R', from: 'sub-R', to: 'solution-n', en: 'Combine', ar: 'ادمج', dx: 25, dy: 15 }
    ];

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      // تم تعديل المسميات لتكون دقيقة وتعبر عن كل حالة، خاصة خطوة الدمج/الاكتمال
      container.querySelector('[data-algo-text="w1-pending"]').textContent = _AL.exp('Pending', 'قيد الانتظار');
      container.querySelector('[data-algo-text="w1-divide"]').textContent  = _AL.exp('Divide', 'تقسيم');
      container.querySelector('[data-algo-text="w1-conquer"]').textContent = _AL.exp('Conquer', 'حلّ');
      container.querySelector('[data-algo-text="w1-combine"]').textContent = _AL.exp('Combined / Solved', 'مكتمل / دمج');
      container.querySelector('[data-algo-text="w1-focus"]').textContent = _AL.exp('Current Focus', 'التركيز الحالي');
    }
 
    function generateSteps() {
      steps = [];
      
      // 0. البداية
      steps.push({
        en: 'Divide-and-Conquer paradigm breaks a complex problem into smaller sub-problems.',
        ar: 'نموذج فرّق تسد يقوم بتقسيم المشكلة المعقدة إلى مشكلات فرعية أصغر.',
        nodes: { 'problem-n': 'active' }, lines: {}
      });
 
      // 1. التقسيم
      steps.push({
        en: '<b>Divide Step:</b> The problem is split into two smaller sub-problems.',
        ar: '<b>خطوة التقسيم:</b> يتم تقسيم المشكلة الأصلية إلى مشكلتين فرعيتين أصغر.',
        nodes: { 'problem-n': 'compare', 'sub-L': 'pending', 'sub-R': 'pending' },
        lines: { 'div-L': 'compare', 'div-R': 'compare' }
      });
 
      // 2. الحل - اليسار
      steps.push({
        en: '<b>Conquer Step:</b> Solving the left sub-problem recursively.',
        ar: '<b>خطوة الحل:</b> يتم حل المشكلة الفرعية اليسرى بشكل مستقل.',
        nodes: { 'problem-n': 'fade', 'sub-L': 'active', 'sub-R': 'fade' },
        lines: { 'div-L': 'fade', 'div-R': 'fade' }
      });
 
      // 3. الحل - اليمين
      steps.push({
        en: 'Solving the right sub-problem.',
        ar: 'يتم الآن حل المشكلة الفرعية اليمنى.',
        nodes: { 'problem-n': 'fade', 'sub-L': 'swap', 'sub-R': 'active' },
        lines: { 'div-L': 'fade', 'div-R': 'fade' }
      });
 
      // 4. اكتمل الحل
      steps.push({
        en: 'Sub-problems are now solved independently.',
        ar: 'تم حل كلتا المشكلتين الفرعيتين الآن بشكل مستقل ومستعدتان للدمج.',
        nodes: { 'problem-n': 'fade', 'sub-L': 'swap', 'sub-R': 'swap' },
        lines: { 'div-L': 'fade', 'div-R': 'fade' }
      });
 
      // 5. الدمج
      steps.push({
        en: '<b>Combine Step:</b> Solutions from sub-problems are merged into the final solution.',
        ar: '<b>خطوة الدمج:</b> يتم دمج الحلول الفرعية لتشكيل حل المشكلة الأصلية.',
        nodes: { 'problem-n': 'fade', 'sub-L': 'swap', 'sub-R': 'swap', 'solution-n': 'active' },
        lines: { 'div-L': 'fade', 'div-R': 'fade', 'com-L': 'active', 'com-R': 'active' }
      });
 
      // 6. النهاية
      steps.push({
        en: 'Original problem is fully solved using Divide-and-Conquer strategy!',
        ar: 'تم حل المشكلة الأصلية بالكامل باستخدام استراتيجية فرّق تسد!',
        // المشكلة الأساسية والحل يضاءان بلون "مكتمل"، وتتلاشى الفروع
        nodes: { 'problem-n': 'sorted', 'sub-L': 'fade', 'sub-R': 'fade', 'solution-n': 'sorted' },
        lines: {}
      });
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
 
      // الألوان المتناسقة
      var colorMap = {
        'active': 'var(--algo-active)',
        'compare': 'var(--algo-compare)',
        'swap': 'var(--algo-swap)',
        'sorted': 'var(--algo-sorted)',
        'pending': 'var(--brand-500)',
        'fade': 'var(--bg-elevated)'
      };

      var svgHTML = '<defs>';
      ['active', 'compare', 'swap', 'pending'].forEach(state => {
         svgHTML += `<marker id="w1-arr-${state}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${colorMap[state]}" /></marker>`;
      });
      svgHTML += `<marker id="w1-arr-fade" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-border)" opacity="0.3" /></marker>`;
      svgHTML += '</defs>';
 
      // رسم الأسهم
      var currentLines = s.lines || {};
      linesConfig.forEach(lc => {
        let state = currentLines[lc.id];
        if (!state) return;

        let n1 = nodesData[lc.from];
        let n2 = nodesData[lc.to];
        
        let dx = n2.cx - n1.cx;
        let dy = n2.cy - n1.cy;
        let dist = Math.hypot(dx, dy);
        
        // حساب نقطة الانطلاق والوصول لتلامس حافة الدائرة تماماً
        let padStart = n1.r + 3; 
        let padEnd = n2.r + 14; 
        
        let x1 = n1.cx + (dx / dist) * padStart;
        let y1 = n1.cy + (dy / dist) * padStart;
        let x2 = n1.cx + (dx / dist) * (dist - padEnd);
        let y2 = n1.cy + (dy / dist) * (dist - padEnd);

        let color = colorMap[state];
        let sw = state === 'active' || state === 'compare' ? '3' : '2';
        let dash = state === 'fade' ? '5,5' : '0';
        let opacity = state === 'fade' ? '0.4' : '1';
        let marker = `url(#w1-arr-${state})`;
        if(state === 'fade') color = 'var(--algo-border)';

        svgHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="${opacity}" marker-end="${marker}" style="transition: all 0.3s ease;"></line>`;

        // رسم نص السهم (قسّم / ادمج) وتطبيق الإزاحة لكي لا يلامس الخط أبداً
        let labelText = _AL.lang() === 'ar' ? lc.ar : lc.en;
        let midX = ((x1 + x2) / 2) + (lc.dx || 0);
        let midY = ((y1 + y2) / 2) + (lc.dy || 0);
        let fontW = state === 'active' || state === 'compare' ? '800' : '600';
        // تصغير خط النصوص المحاذية للأسهم ليكون أرتب 
        svgHTML += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="middle" fill="${color}" opacity="${opacity}" font-size="11px" font-weight="${fontW}" font-family="'Cairo', 'Inter', sans-serif" style="transition: all 0.3s ease;">${labelText}</text>`;
      });
 
      // رسم العقد (الدوائر)
      var currentNodes = s.nodes || {};
      Object.keys(nodesData).forEach(nId => {
        let state = currentNodes[nId];
        if (!state) return;

        let nd = nodesData[nId];
        let fill = colorMap[state];
        let stroke = state === 'active' || state === 'compare' || state === 'swap' ? '#ffffff' : 'var(--algo-border)';
        let sw = state === 'active' ? '4' : '2';
        let dash = state === 'fade' ? '5,5' : '0';
        let scale = state === 'active' ? '1.08' : '1';
        let opacity = state === 'fade' ? '0.2' : '1';
        let textFill = state === 'fade' ? 'var(--text-muted)' : '#ffffff';
        let fontW = state === 'fade' ? '600' : '800';
        
        let label1 = _AL.lang() === 'ar' ? nd.ar1 : nd.en1;
        let label2 = _AL.lang() === 'ar' ? nd.ar2 : nd.en2;
        
        svgHTML += `
        <g style="transform: scale(${scale}); transform-origin: ${nd.cx}px ${nd.cy}px; opacity: ${opacity}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
          <circle cx="${nd.cx}" cy="${nd.cy}" r="${nd.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" style="transition: fill 0.3s ease, stroke 0.3s ease;"></circle>
          
          <text x="${nd.cx}" y="${nd.cy}" text-anchor="middle" dominant-baseline="middle" fill="${textFill}" font-size="12px" font-weight="${fontW}" font-family="'Cairo', 'Inter', sans-serif" style="user-select:none; pointer-events:none;">
             <tspan x="${nd.cx}" dy="-0.4em">${label1}</tspan>
             <tspan x="${nd.cx}" dy="1.4em" dir="ltr">${label2}</tspan>
          </text>
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
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); generateSteps(); cur=0; render(); });
    container.querySelector('.algo-speed input').addEventListener('input', function(){
      if(playing){ clearInterval(interval); interval = setInterval(function(){if(cur<steps.length-1){cur++;render();}else stopPlay();},getDelay()); }
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
      
      // التعديل 1: حاوية متجاوبة باستخدام aspect-ratio لضمان عدم التشوه في الجوال
      '<div class="algo-canvas" id="w2-canvas" style="width:100%; max-width:700px; aspect-ratio: 2 / 1; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:hidden;">' +
        '<svg viewBox="0 0 800 400" id="w2-svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;"></svg>' +
      '</div>' +
      
      '<div class="algo-legend" style="display:flex;justify-content:center; flex-wrap:wrap; gap:15px;margin-top:15px;font-size:0.85rem; color: var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-default"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-compare"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-move"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w2-sorted"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl = container.querySelector('#w2-exp');
    var svgEl = container.querySelector('#w2-svg');
    var counter = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
 
    // الثوابت الهندسية (Geometry Constants)
    var CELL_WIDTH = 40;
    var CELL_HEIGHT = 40;
    var CELL_GAP = 5;
    var BLOCK_GAP = 60; // التعديل 2: المسافة الإجبارية بين النصف الأيمن والأيسر
    var ARRAY_START_Y = 50;
    var ROW_GAP = 120; // مسافة أكبر بين الصفوف ليتسع للأسهم والنصوص
    var LABEL_OFFSET_Y = -15; 
    var POINTER_OFFSET_Y = 70; 
    var SVG_WIDTH = 800;
 
    // دالة مساعدة لحساب عرض أي مصفوفة
    function getArrWidth(len) {
      return len * CELL_WIDTH + Math.max(0, len - 1) * CELL_GAP;
    }
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w2-default"]').textContent = _AL.exp('Element', 'عنصر');
      container.querySelector('[data-algo-text="w2-compare"]').textContent = _AL.exp('Comparing', 'مقارنة');
      container.querySelector('[data-algo-text="w2-move"]').textContent = _AL.exp('Moving', 'نقل');
      container.querySelector('[data-algo-text="w2-sorted"]').textContent = _AL.exp('Sorted', 'مرتب');
    }
 
    function generateSteps() {
      var initialArr = [6, 5, 3, 1, 8, 7, 2, 4];
      var leftHalf = initialArr.slice(0, 4);
      var rightHalf = initialArr.slice(4, 8);
      
      // التعديل 3: حساب الإحداثيات (X) مسبقاً بدقة متناهية لمنع التداخل وضبط الأسهم
      var center_X = SVG_WIDTH / 2;
      var origWidth = getArrWidth(initialArr.length);
      var halfWidth = getArrWidth(4);
      
      var origX = center_X - (origWidth / 2);
      var leftX = center_X - (BLOCK_GAP / 2) - halfWidth;
      var rightX = center_X + (BLOCK_GAP / 2);
      var resultX = origX; // النتيجة تعود للمنتصف تماماً

      // إحداثيات مراكز المصفوفات لرسم الأسهم بدقة
      var origLeftCenterX = origX + (halfWidth / 2);
      var origRightCenterX = origX + halfWidth + CELL_GAP + (halfWidth / 2);
      var destLeftCenterX = leftX + (halfWidth / 2);
      var destRightCenterX = rightX + (halfWidth / 2);

      steps = [];
 
      // Step 0
      steps.push({
        en: 'Initial unsorted array.', ar: 'المصفوفة الأولية غير المرتبة.',
        visual: {
          arrays: [{ values: initialArr.slice(), x: origX, y: ARRAY_START_Y, highlights: [], label: 'Original Array', class: '' }],
          pointers: [], lines: []
        }
      });
 
      // Step 1: Divide
      steps.push({
        en: 'Divide the array into two halves.', ar: 'تقسيم المصفوفة إلى نصفين متساويين.',
        visual: {
          arrays: [
            { values: initialArr.slice(), x: origX, y: ARRAY_START_Y, highlights: [], label: 'Original Array', class: '' },
            { values: leftHalf, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Left Half', class: '' },
            { values: rightHalf, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Right Half', class: '' }
          ],
          pointers: [],
          lines: [
            // أسهم التقسيم تنطلق من المركز الدقيق للنصف إلى المركز الدقيق للمصفوفة الجديدة
            { x1: origLeftCenterX, y1: ARRAY_START_Y + CELL_HEIGHT + 5, x2: destLeftCenterX, y2: ARRAY_START_Y + ROW_GAP - 25, class: 'divide-line' },
            { x1: origRightCenterX, y1: ARRAY_START_Y + CELL_HEIGHT + 5, x2: destRightCenterX, y2: ARRAY_START_Y + ROW_GAP - 25, class: 'divide-line' }
          ]
        }
      });
 
      // Step 2: Conquer
      var sortedLeft = [1, 3, 5, 6];
      var sortedRight = [2, 4, 7, 8];
      steps.push({
        en: 'Recursively sort sub-arrays. Now we have two sorted halves.', ar: 'يتم ترتيب المصفوفات الفرعية بشكل متكرر. لدينا الآن نصفان مرتبان.',
        visual: {
          arrays: [
            { values: sortedLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Sorted Left Half', class: 'sorted' },
            { values: sortedRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Sorted Right Half', class: 'sorted' }
          ],
          pointers: [], lines: []
        }
      });
 
      // Step 3: Start Merge
      var currentLeft = sortedLeft.slice();
      var currentRight = sortedRight.slice();
      var currentResult = [];
      steps.push({
        en: 'Start merging. Pointers <strong style="color:var(--brand-500)">i</strong> and <strong style="color:var(--brand-500)">j</strong> track current elements.', 
        ar: 'بدء الدمج. المؤشران <strong dir="ltr" style="color:var(--brand-500)">i</strong> و <strong dir="ltr" style="color:var(--brand-500)">j</strong> يتتبعان العناصر الحالية للمقارنة.',
        visual: {
          arrays: [
            { values: currentLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [0], label: 'Left', class: 'sorted' },
            { values: currentRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [0], label: 'Right', class: 'sorted' },
            { values: currentResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [], label: 'Result', class: '' }
          ],
          pointers: [
            { x: leftX + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'i' },
            { x: rightX + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'j' }
          ],
          lines: []
        }
      });
 
      // Detailed Merge Steps
      var i = 0, j = 0, k = 0;
      var tempLeft = sortedLeft.slice();
      var tempRight = sortedRight.slice();
      var finalResult = [];
 
      while (i < tempLeft.length && j < tempRight.length) {
        steps.push({
          en: 'Compare <strong>' + tempLeft[i] + '</strong> and <strong>' + tempRight[j] + '</strong>.', 
          ar: 'مقارنة <strong>' + tempLeft[i] + '</strong> و <strong>' + tempRight[j] + '</strong>.',
          visual: {
            arrays: [
              { values: tempLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [i], highlightClass: 'comparing', label: 'Left', class: 'sorted' },
              { values: tempRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [j], highlightClass: 'comparing', label: 'Right', class: 'sorted' },
              { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [], label: 'Result', class: '' }
            ],
            pointers: [
              { x: leftX + i * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'i' },
              { x: rightX + j * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'j' }
            ],
            lines: []
          }
        });
 
        if (tempLeft[i] <= tempRight[j]) {
          finalResult.push(tempLeft[i]);
          steps.push({
            en: '<strong>' + tempLeft[i] + '</strong> is smaller. Add it to the result and advance <strong>i</strong>.', 
            ar: '<strong>' + tempLeft[i] + '</strong> أصغر. أضفه إلى مصفوفة النتيجة وقدم المؤشر <strong dir="ltr">i</strong>.',
            visual: {
              arrays: [
                { values: tempLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Left', class: 'sorted' },
                { values: tempRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [j], label: 'Right', class: 'sorted' },
                { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [k], highlightClass: 'swapping', label: 'Result', class: '' }
              ],
              pointers: [
                { x: leftX + (i + 1) * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'i' },
                { x: rightX + j * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'j' }
              ],
              lines: []
            }
          });
          i++;
        } else {
          finalResult.push(tempRight[j]);
          steps.push({
            en: '<strong>' + tempRight[j] + '</strong> is smaller. Add it to the result and advance <strong>j</strong>.', 
            ar: '<strong>' + tempRight[j] + '</strong> أصغر. أضفه إلى مصفوفة النتيجة وقدم المؤشر <strong dir="ltr">j</strong>.',
            visual: {
              arrays: [
                { values: tempLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [i], label: 'Left', class: 'sorted' },
                { values: tempRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Right', class: 'sorted' },
                { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [k], highlightClass: 'swapping', label: 'Result', class: '' }
              ],
              pointers: [
                { x: leftX + i * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'i' },
                { x: rightX + (j + 1) * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'j' }
              ],
              lines: []
            }
          });
          j++;
        }
        k++;
      }
 
      while (i < tempLeft.length) {
        finalResult.push(tempLeft[i]);
        steps.push({
          en: 'Left array has remaining elements. Add <strong>' + tempLeft[i] + '</strong>.', 
          ar: 'النصف الأيسر به عناصر متبقية. أضف <strong>' + tempLeft[i] + '</strong> للنتيجة.',
          visual: {
            arrays: [
              { values: tempLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Left', class: 'sorted' },
              { values: tempRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Right', class: 'sorted' },
              { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [k], highlightClass: 'swapping', label: 'Result', class: '' }
            ],
            pointers: [{ x: leftX + (i + 1) * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'i' }],
            lines: []
          }
        });
        i++; k++;
      }
 
      while (j < tempRight.length) {
        finalResult.push(tempRight[j]);
        steps.push({
          en: 'Right array has remaining elements. Add <strong>' + tempRight[j] + '</strong>.', 
          ar: 'النصف الأيمن به عناصر متبقية. أضف <strong>' + tempRight[j] + '</strong> للنتيجة.',
          visual: {
            arrays: [
              { values: tempLeft, x: leftX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Left', class: 'sorted' },
              { values: tempRight, x: rightX, y: ARRAY_START_Y + ROW_GAP, highlights: [], label: 'Right', class: 'sorted' },
              { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [k], highlightClass: 'swapping', label: 'Result', class: '' }
            ],
            pointers: [{ x: rightX + (j + 1) * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2, y: ARRAY_START_Y + ROW_GAP + POINTER_OFFSET_Y, text: 'j' }],
            lines: []
          }
        });
        j++; k++;
      }
 
      steps.push({
        en: 'The array is now fully sorted!', ar: 'تم دمج وترتيب المصفوفة بالكامل بنجاح!',
        visual: {
          arrays: [
            { values: finalResult, x: resultX, y: ARRAY_START_Y + ROW_GAP * 2, highlights: [], label: 'Sorted Array', class: 'sorted' }
          ],
          pointers: [], lines: []
        }
      });
    }
 
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
 
      svgEl.innerHTML = ''; 
 
      // التعديل 4: إضافة تعريف رأس السهم للخطوط المتقطعة وللمؤشرات
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      var markerDivide = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      markerDivide.setAttribute('id', 'arrow-divide');
      markerDivide.setAttribute('markerWidth', '10');
      markerDivide.setAttribute('markerHeight', '7');
      markerDivide.setAttribute('refX', '9');
      markerDivide.setAttribute('refY', '3.5');
      markerDivide.setAttribute('orient', 'auto');
      var polyDivide = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polyDivide.setAttribute('points', '0 0, 10 3.5, 0 7');
      polyDivide.setAttribute('fill', 'var(--algo-compare)');
      markerDivide.appendChild(polyDivide);
      defs.appendChild(markerDivide);

      var markerPtr = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      markerPtr.setAttribute('id', 'arrow-ptr');
      markerPtr.setAttribute('markerWidth', '10');
      markerPtr.setAttribute('markerHeight', '7');
      markerPtr.setAttribute('refX', '9');
      markerPtr.setAttribute('refY', '3.5');
      markerPtr.setAttribute('orient', 'auto');
      var polyPtr = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polyPtr.setAttribute('points', '0 0, 10 3.5, 0 7');
      polyPtr.setAttribute('fill', 'var(--brand-500)'); // لون المؤشر
      markerPtr.appendChild(polyPtr);
      defs.appendChild(markerPtr);

      svgEl.appendChild(defs);

      // رسم خطوط التقسيم (Divide Lines)
      s.visual.lines.forEach(function(lineData) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', lineData.x1);
        line.setAttribute('y1', lineData.y1);
        line.setAttribute('x2', lineData.x2);
        line.setAttribute('y2', lineData.y2);
        line.setAttribute('stroke', 'var(--algo-compare)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.setAttribute('marker-end', 'url(#arrow-divide)');
        svgEl.appendChild(line);
      });
 
      // رسم المصفوفات
      s.visual.arrays.forEach(function(arrData) {
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
 
        // Array label
        var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', arrData.x + (arrData.values.length * CELL_WIDTH + (arrData.values.length - 1) * CELL_GAP) / 2);
        label.setAttribute('y', arrData.y + LABEL_OFFSET_Y);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', 'var(--text-primary)');
        label.setAttribute('font-size', '13px');
        label.setAttribute('font-weight', '800');
        label.setAttribute('font-family', "'Cairo', 'Inter', sans-serif");
        
        var translatedLabel = arrData.label;
        if(_AL.lang() === 'ar') {
           if(arrData.label === 'Original Array') translatedLabel = 'المصفوفة الأصلية';
           else if(arrData.label === 'Left Half') translatedLabel = 'النصف الأيسر';
           else if(arrData.label === 'Right Half') translatedLabel = 'النصف الأيمن';
           else if(arrData.label === 'Sorted Left Half') translatedLabel = 'النصف الأيسر مرتب';
           else if(arrData.label === 'Sorted Right Half') translatedLabel = 'النصف الأيمن مرتب';
           else if(arrData.label === 'Left') translatedLabel = 'يسار';
           else if(arrData.label === 'Right') translatedLabel = 'يمين';
           else if(arrData.label === 'Result') translatedLabel = 'مصفوفة الدمج (النتيجة)';
           else if(arrData.label === 'Sorted Array') translatedLabel = 'المصفوفة النهائية المرتبة';
        }
        label.textContent = translatedLabel;
        group.appendChild(label);
 
        arrData.values.forEach(function(val, idx) {
          var x = arrData.x + idx * (CELL_WIDTH + CELL_GAP);
          var y = arrData.y;
 
          var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', CELL_WIDTH);
          rect.setAttribute('height', CELL_HEIGHT);
          rect.setAttribute('rx', 6);
          rect.setAttribute('ry', 6);
          rect.style.transition = "fill 0.3s ease"; // انتقال سلس للألوان
 
          var fill = 'var(--brand-400)';
          if (arrData.class === 'sorted') fill = 'var(--algo-sorted)';
          
          var strokeColor = 'var(--algo-border)';
          var strokeW = 1;

          if (arrData.highlights.includes(idx)) {
              if (arrData.highlightClass === 'comparing') { fill = 'var(--algo-compare)'; strokeColor = '#fff'; strokeW = 2; }
              else if (arrData.highlightClass === 'swapping') { fill = 'var(--algo-swap)'; strokeColor = '#fff'; strokeW = 2; }
              else { fill = 'var(--algo-active)'; strokeColor = '#fff'; strokeW = 2; }
          }
          rect.setAttribute('fill', fill);
          rect.setAttribute('stroke', strokeColor);
          rect.setAttribute('stroke-width', strokeW);
          group.appendChild(rect);
 
          // التعديل 5: توسيط النص بدقة ووضوح داخل المربع
          var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', x + CELL_WIDTH / 2);
          text.setAttribute('y', y + CELL_HEIGHT / 2);
          text.setAttribute('dy', '.1em'); // تعديل بصري طفيف للخطوط
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', '#ffffff'); // لون أبيض لتطابق الألوان الغامقة للمربعات
          text.setAttribute('font-weight', '800');
          text.setAttribute('font-family', "'Inter', sans-serif");
          text.setAttribute('font-size', '16px');
          text.textContent = val;
          group.appendChild(text);
        });
        svgEl.appendChild(group);
      });
 
      // التعديل 6: رسم المؤشرات (Pointers i, j) بأسهم تتجه للأعلى نحو المربعات
      s.visual.pointers.forEach(function(ptr) {
        // رسم الحرف
        var pointerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        pointerText.setAttribute('x', ptr.x);
        pointerText.setAttribute('y', ptr.y); // موقع الحرف أسفل المربع
        pointerText.setAttribute('text-anchor', 'middle');
        pointerText.setAttribute('fill', 'var(--brand-600)');
        pointerText.setAttribute('font-weight', '900');
        pointerText.setAttribute('font-family', "'Inter', sans-serif");
        pointerText.setAttribute('font-size', '16px');
        pointerText.textContent = ptr.text;
        svgEl.appendChild(pointerText);
 
        // رسم سهم يتجه للأعلى من الحرف للمربع
        var arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowLine.setAttribute('x1', ptr.x);
        arrowLine.setAttribute('y1', ptr.y - 15); // يبدأ فوق الحرف بقليل
        arrowLine.setAttribute('x2', ptr.x);
        arrowLine.setAttribute('y2', ptr.y - 25); // يتجه للأعلى نحو المربع
        arrowLine.setAttribute('stroke', 'var(--brand-500)');
        arrowLine.setAttribute('stroke-width', '2');
        arrowLine.setAttribute('marker-end', 'url(#arrow-ptr)');
        svgEl.appendChild(arrowLine);
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
          '<div class="algo-explanation" id="w3-exp"></div>' +
          '<div class="algo-canvas" id="w3-canvas" style="width:100%; height:300px; display:flex; justify-content:center; align-items:flex-end; padding-bottom:20px;">' +
            '<svg id="w3-svg" width="800" height="250" viewBox="0 0 800 250" style="background:var(--algo-canvas-bg);"></svg>' +
          '</div>' +
          '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;flex-wrap:wrap;">' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-400);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-un"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-pi"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-co"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-sw"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w3-so"></span></span>' +
          '</div>' +
        '</div>';
      
        var btnPlay  = container.querySelector('[data-algo-btn="play"]');
        var expEl    = container.querySelector('#w3-exp');
        var svgEl    = container.querySelector('#w3-svg');
        var counter  = container.querySelector('[data-algo-counter]');
        var steps = [], cur = 0, playing = false, interval = null;
      
        var BAR_WIDTH = 60;
        var BAR_GAP = 10;
        var BAR_MAX_HEIGHT = 180;
        var SVG_WIDTH = 800;
        var SVG_HEIGHT = 250;
        var TEXT_OFFSET_Y = 20; // For value inside bar
        var POINTER_OFFSET_Y = 10; // For i/j pointers above/below bars
      
        function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
        function updateLabels() {
          container.querySelector('[data-algo-text="w3-un"]').textContent = _AL.lang()==='ar' ? 'غير مرتب'  : 'Unsorted';
          container.querySelector('[data-algo-text="w3-pi"]').textContent = _AL.lang()==='ar' ? 'المحور'    : 'Pivot';
          container.querySelector('[data-algo-text="w3-co"]').textContent = _AL.lang()==='ar' ? 'مقارنة'    : 'Comparing';
          container.querySelector('[data-algo-text="w3-sw"]').textContent = _AL.lang()==='ar' ? 'تبديل'     : 'Swapping';
          container.querySelector('[data-algo-text="w3-so"]').textContent = _AL.lang()==='ar' ? 'مرتب'      : 'Sorted';
        }
      
        function generateSteps() {
          var arr = [];
          var numElements = 8; // Fixed number of elements for consistent visualization
          for(var i=0; i<numElements; i++) arr.push(Math.floor(Math.random()*80)+20); // Values 20-99
      
          steps = [];
          var sortedRegions = []; // Stores [start, end] ranges that are sorted
      
          // Helper for Hoare Partitioning
          function partition(arr, low, high, steps, sortedRegions) {
              let pivotIdx = low; // The element at this index is the pivot for this partition
              let pivotValue = arr[pivotIdx]; // The value we compare against
              let activeRange = [low, high];
      
              steps.push({
                  array: arr.slice(),
                  pivotIdx: pivotIdx,
                  activeRange: activeRange,
                  i: low - 1,
                  j: high + 1,
                  comparingI: false,
                  comparingJ: false,
                  swapping: false,
                  sortedRegions: sortedRegions.slice(),
                  explanation: { en: `Partitioning sub-array [${low}...${high}]. Pivot element: ${arr[pivotIdx]} (at index ${pivotIdx}).`, ar: `تقسيم المصفوفة الفرعية [${low}...${high}]. عنصر المحور: ${arr[pivotIdx]} (في الفهرس ${pivotIdx}).` }
              });
      
              let i = low - 1;
              let j = high + 1;
      
              while (true) {
                  do {
                      i++;
                      steps.push({
                          array: arr.slice(),
                          pivotIdx: pivotIdx,
                          activeRange: activeRange,
                          i: i,
                          j: j,
                          comparingI: true,
                          comparingJ: false,
                          swapping: false,
                          sortedRegions: sortedRegions.slice(),
                          explanation: { en: `Increment 'i' to find A[i] >= pivot (${pivotValue}). Current A[${i}]=${arr[i]}.`, ar: `زيادة 'i' لإيجاد A[i] >= المحور (${pivotValue}). A[${i}]=${arr[i]} الحالي.` }
                      });
                  } while (arr[i] < pivotValue);
      
                  do {
                      j--;
                      steps.push({
                          array: arr.slice(),
                          pivotIdx: pivotIdx,
                          activeRange: activeRange,
                          i: i,
                          j: j,
                          comparingI: false,
                          comparingJ: true,
                          swapping: false,
                          sortedRegions: sortedRegions.slice(),
                          explanation: { en: `Decrement 'j' to find A[j] <= pivot (${pivotValue}). Current A[${j}]=${arr[j]}.`, ar: `إنقاص 'j' لإيجاد A[j] <= المحور (${pivotValue}). A[${j}]=${arr[j]} الحالي.` }
                      });
                  } while (arr[j] > pivotValue);
      
                  if (i < j) {
                      [arr[i], arr[j]] = [arr[j], arr[i]];
                      steps.push({
                          array: arr.slice(),
                          pivotIdx: pivotIdx,
                          activeRange: activeRange,
                          i: i,
                          j: j,
                          comparingI: false,
                          comparingJ: false,
                          swapping: true,
                          sortedRegions: sortedRegions.slice(),
                          explanation: { en: `Swap A[${i}]=${arr[j]} and A[${j}]=${arr[i]} as they are on wrong sides of pivot.`, ar: `تبديل A[${i}]=${arr[j]} و A[${j}]=${arr[i]} لأنهما في الجانب الخطأ من المحور.` }
                      });
                  } else {
                      steps.push({
                          array: arr.slice(),
                          pivotIdx: pivotIdx,
                          activeRange: activeRange,
                          i: i,
                          j: j,
                          comparingI: false,
                          comparingJ: false,
                          swapping: false,
                          sortedRegions: sortedRegions.slice(),
                          explanation: { en: `'i' (${i}) has crossed 'j' (${j}). Partition complete. Split point is ${j}.`, ar: `تجاوز 'i' (${i}) 'j' (${j}). اكتمل التقسيم. نقطة التقسيم هي ${j}.` }
                      });
                      return j; // Return the partition point
                  }
              }
          }
      
          // Iterative Quick Sort using a stack to simulate recursion
          function quickSortIterative(arr, steps, sortedRegions) {
              let callStack = [{ low: 0, high: arr.length - 1 }];
      
              steps.push({
                  array: arr.slice(),
                  pivotIdx: -1,
                  activeRange: [0, arr.length - 1],
                  i: -1,
                  j: -1,
                  comparingI: false,
                  comparingJ: false,
                  swapping: false,
                  sortedRegions: sortedRegions.slice(),
                  explanation: { en: 'Initial array state. Starting Quick Sort.', ar: 'الحالة الأولية للمصفوفة. بدء الترتيب السريع.' }
              });
      
              while (callStack.length > 0) {
                  let { low, high } = callStack.pop();
      
                  if (low >= high) {
                      // This sub-array is sorted (0 or 1 element)
                      let isCovered = false;
                      for (let region of sortedRegions) {
                          if (low >= region[0] && high <= region[1]) {
                              isCovered = true;
                              break;
                          }
                      }
                      if (!isCovered) {
                          sortedRegions.push([low, high]);
                          sortedRegions.sort((a, b) => a[0] - b[0]);
                          for (let k = 0; k < sortedRegions.length - 1; k++) {
                              if (sortedRegions[k][1] + 1 >= sortedRegions[k+1][0]) {
                                  sortedRegions[k][1] = Math.max(sortedRegions[k][1], sortedRegions[k+1][1]);
                                  sortedRegions.splice(k+1, 1);
                                  k--;
                              }
                          }
                      }
      
                      steps.push({
                          array: arr.slice(),
                          pivotIdx: -1,
                          activeRange: [low, high],
                          i: -1,
                          j: -1,
                          comparingI: false,
                          comparingJ: false,
                          swapping: false,
                          sortedRegions: sortedRegions.slice(),
                          explanation: { en: `Sub-array [${low}...${high}] is sorted.`, ar: `المصفوفة الفرعية [${low}...${high}] مرتبة.` }
                      });
                      continue;
                  }
      
                  let p = partition(arr, low, high, steps, sortedRegions);
      
                  // Push right child first, then left child, so left is processed next (LIFO)
                  callStack.push({ low: p + 1, high: high });
                  callStack.push({ low: low, high: p });
              }
      
              // Ensure the final state shows the entire array as sorted
              if (sortedRegions.length === 0 || sortedRegions[0][0] !== 0 || sortedRegions[0][1] !== arr.length - 1) {
                  sortedRegions = [[0, arr.length - 1]];
              }
      
              steps.push({
                  array: arr.slice(),
                  pivotIdx: -1,
                  activeRange: [0, arr.length - 1],
                  i: -1,
                  j: -1,
                  comparingI: false,
                  comparingJ: false,
                  swapping: false,
                  sortedRegions: sortedRegions.slice(),
                  explanation: { en: 'Quick Sort complete! Array is fully sorted.', ar: 'اكتمل الترتيب السريع! المصفوفة مرتبة بالكامل.' }
              });
          }
      
          quickSortIterative(arr, steps, sortedRegions);
        }
      
        function render() {
          updateLabels();
          var s = steps[cur];
          counter.textContent = _AL.stepLabel(cur, steps.length - 1);
          expEl.innerHTML = _AL.exp(s.en, s.ar);
      
          svgEl.innerHTML = ''; // Clear previous drawing
      
          var maxVal = Math.max(...s.array);
          if (maxVal === 0) maxVal = 1; // Avoid division by zero
      
          var startX = (SVG_WIDTH - (s.array.length * (BAR_WIDTH + BAR_GAP))) / 2;
      
          s.array.forEach(function(val, idx) {
            var barHeight = (val / maxVal) * BAR_MAX_HEIGHT;
            var x = startX + idx * (BAR_WIDTH + BAR_GAP);
            var y = SVG_HEIGHT - barHeight;
      
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', BAR_WIDTH);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('rx', 3);
            rect.setAttribute('ry', 3);
            rect.style.fill = 'var(--brand-400)';
            rect.style.stroke = 'var(--algo-border)';
            rect.style.strokeWidth = '1';
            rect.style.transition = 'all 0.3s ease-in-out';
      
            // Dim elements outside active partition
            if (s.activeRange && (idx < s.activeRange[0] || idx > s.activeRange[1])) {
                rect.style.opacity = '0.5';
            }
      
            // Highlight sorted regions
            for (let region of s.sortedRegions) {
                if (idx >= region[0] && idx <= region[1]) {
                    rect.style.fill = 'var(--algo-sorted)';
                    rect.style.opacity = '1'; // Ensure sorted regions are fully visible
                    break;
                }
            }
      
            // Highlight pivot
            if (s.pivotIdx === idx && s.activeRange && idx >= s.activeRange[0] && idx <= s.activeRange[1]) {
                rect.style.fill = 'var(--algo-active)';
            }
      
            // Highlight comparing elements
            if ((s.comparingI && s.i === idx) || (s.comparingJ && s.j === idx)) {
                rect.style.fill = 'var(--algo-compare)';
            }
      
            // Highlight swapping elements
            if (s.swapping && (s.i === idx || s.j === idx)) {
                rect.style.fill = 'var(--algo-swap)';
            }
      
            svgEl.appendChild(rect);
      
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + BAR_WIDTH / 2);
            text.setAttribute('y', y + TEXT_OFFSET_Y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'var(--algo-text)');
            text.setAttribute('font-size', '14');
            text.textContent = val;
            svgEl.appendChild(text);
      
            // Index labels
            var indexText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            indexText.setAttribute('x', x + BAR_WIDTH / 2);
            indexText.setAttribute('y', SVG_HEIGHT + 15); // Below the bars
            indexText.setAttribute('text-anchor', 'middle');
            indexText.setAttribute('fill', 'var(--algo-muted)');
            indexText.setAttribute('font-size', '12');
            indexText.textContent = idx;
            svgEl.appendChild(indexText);
          });
      
          // Draw i and j pointers
          var pointerY_i = SVG_HEIGHT - BAR_MAX_HEIGHT - POINTER_OFFSET_Y; // Above bars
          var pointerY_j = SVG_HEIGHT + POINTER_OFFSET_Y + 15; // Below index labels
      
          if (s.i !== -1 && s.i < s.array.length) {
              var i_x = startX + s.i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
              var i_pointer = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
              i_pointer.setAttribute('points', `${i_x},${pointerY_i} ${i_x - 5},${pointerY_i - 10} ${i_x + 5},${pointerY_i - 10}`);
              i_pointer.setAttribute('fill', 'var(--algo-active)');
              svgEl.appendChild(i_pointer);
      
              var i_label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              i_label.setAttribute('x', i_x);
              i_label.setAttribute('y', pointerY_i - 15);
              i_label.setAttribute('text-anchor', 'middle');
              i_label.setAttribute('fill', 'var(--algo-active)');
              i_label.setAttribute('font-weight', 'bold');
              i_label.textContent = 'i';
              svgEl.appendChild(i_label);
          }
      
          if (s.j !== -1 && s.j >= 0) {
              var j_x = startX + s.j * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
              var j_pointer = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
              j_pointer.setAttribute('points', `${j_x},${pointerY_j} ${j_x - 5},${pointerY_j + 10} ${j_x + 5},${pointerY_j + 10}`);
              j_pointer.setAttribute('fill', 'var(--algo-active)');
              svgEl.appendChild(j_pointer);
      
              var j_label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              j_label.setAttribute('x', j_x);
              j_label.setAttribute('y', pointerY_j + 25);
              j_label.setAttribute('text-anchor', 'middle');
              j_label.setAttribute('fill', 'var(--algo-active)');
              j_label.setAttribute('font-weight', 'bold');
              j_label.textContent = 'j';
              svgEl.appendChild(j_label);
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
      
        window._algoRerenders[3] = render;
        generateSteps();
        render();
};

window.AlgoWidgets[4] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
          _AL.titleHTML(4) +
          _AL.toolbar(4) +
          '<div class="algo-explanation" id="w4-exp" style="font-size: 0.85rem; font-weight: 600; line-height: 1.6; margin-bottom: 10px;"></div>' +
          
          // حاوية الرسم البياني المتجاوبة
          '<div class="algo-canvas" style="width:100%; max-width: 600px; aspect-ratio: 4 / 3; margin: 0 auto; overflow:hidden; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center;">' +
            '<svg id="w4-svg-canvas" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;"></svg>' +
          '</div>' +
          
          // دليل الألوان
          '<div class="algo-legend" style="margin-top:12px; text-align:center; display:flex; justify-content:center; flex-wrap:wrap; gap:15px; font-size:0.8rem; color:var(--text-secondary);">' +
            '<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--algo-active); margin-inline-end:5px;"></span><span data-algo-text="w4-current"></span></span>' +
            '<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--algo-sorted); margin-inline-end:5px;"></span><span data-algo-text="w4-path-node"></span></span>' +
          '</div>' +
          
          // الحاوية الجديدة الذكية للنتائج النهائية (لا يتغير حجمها بشكل مزعج)
          '<div id="w4-results-container" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:15px; min-height:30px;"></div>' +
        '</div>';
      
        var btnPlay = container.querySelector('[data-algo-btn="play"]');
        var expEl = container.querySelector('#w4-exp');
        var counter = container.querySelector('[data-algo-counter]');
        var svgEl = container.querySelector('#w4-svg-canvas');
        var resultsContainer = container.querySelector('#w4-results-container');
      
        var steps = [], cur = 0, playing = false, interval = null;
      
        // تم ضبط إحداثيات الشجرة لتكون متناظرة وتتوسط مساحة 600x450 بأناقة
        var nodes = {
          'a': { x: 300, y: 60, left: 'b', right: 'c' },
          'b': { x: 180, y: 160, left: 'd', right: 'e' },
          'c': { x: 420, y: 160, left: 'f', right: null },
          'd': { x: 100, y: 260, left: null, right: 'g' },
          'e': { x: 260, y: 260, left: null, right: null },
          'f': { x: 340, y: 260, left: null, right: null },
          'g': { x: 160, y: 360, left: null, right: null }
        };
      
        function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
        function updateLabels() {
          container.querySelector('[data-algo-text="w4-current"]').textContent = _AL.lang() === 'ar' ? 'العقدة الحالية' : 'Current Node';
          container.querySelector('[data-algo-text="w4-path-node"]').textContent = _AL.lang() === 'ar' ? 'تمت زيارتها' : 'Visited Node';
        }
      
        // متغير عالمي لتتبع النتائج المكتملة
        var completedPaths = { pre: null, in: null, post: null };

        function addStep(traversalType, currentNode, currentPath, en, ar) {
          // حفظ نسخة من النتائج المكتملة حتى هذه الخطوة
          let currentCompleted = {
            pre: completedPaths.pre ? [...completedPaths.pre] : null,
            in: completedPaths.in ? [...completedPaths.in] : null,
            post: completedPaths.post ? [...completedPaths.post] : null
          };

          steps.push({
            traversalType: traversalType,
            currentNode: currentNode,
            path: currentPath.slice(), 
            completed: currentCompleted,
            en: en,
            ar: ar
          });
        }
      
        function preorderTraversal(nodeId, path, traversalType) {
          if (!nodeId) return;
      
          addStep(traversalType, nodeId, path,
            'Visiting node <strong>' + nodeId.toUpperCase() + '</strong>. Adding to Preorder path.',
            'زيارة العقدة <strong>' + nodeId.toUpperCase() + '</strong>. تمت إضافتها للترتيب الأمامي.'
          );
          path.push(nodeId);
      
          preorderTraversal(nodes[nodeId].left, path, traversalType);
          preorderTraversal(nodes[nodeId].right, path, traversalType);
        }
      
        function inorderTraversal(nodeId, path, traversalType) {
          if (!nodeId) return;
      
          inorderTraversal(nodes[nodeId].left, path, traversalType);
      
          addStep(traversalType, nodeId, path,
            'Visiting node <strong>' + nodeId.toUpperCase() + '</strong>. Adding to Inorder path.',
            'زيارة العقدة <strong>' + nodeId.toUpperCase() + '</strong>. تمت إضافتها للترتيب الوسطي.'
          );
          path.push(nodeId);
      
          inorderTraversal(nodes[nodeId].right, path, traversalType);
        }
      
        function postorderTraversal(nodeId, path, traversalType) {
          if (!nodeId) return;
      
          postorderTraversal(nodes[nodeId].left, path, traversalType);
          postorderTraversal(nodes[nodeId].right, path, traversalType);
      
          addStep(traversalType, nodeId, path,
            'Visiting node <strong>' + nodeId.toUpperCase() + '</strong>. Adding to Postorder path.',
            'زيارة العقدة <strong>' + nodeId.toUpperCase() + '</strong>. تمت إضافتها للترتيب الخلفي.'
          );
          path.push(nodeId);
        }
      
        function generateSteps() {
          steps = [];
          completedPaths = { pre: null, in: null, post: null }; // إعادة تعيين
      
          // Preorder
          addStep('preorder', null, [], 'Starting Preorder Traversal (Root &rarr; Left &rarr; Right).', 'بدء اجتياز الترتيب الأمامي (الجذر &larr; اليسار &larr; اليمين).');
          var preorderPath = [];
          preorderTraversal('a', preorderPath, 'preorder');
          completedPaths.pre = preorderPath.slice(); // تم الاكتمال
          addStep('preorder', null, preorderPath, 'Preorder Traversal Complete!', 'اكتمل اجتياز الترتيب الأمامي بنجاح!');
      
          // Inorder
          addStep('inorder', null, [], 'Starting Inorder Traversal (Left &rarr; Root &rarr; Right).', 'بدء اجتياز الترتيب الوسطي (اليسار &larr; الجذر &larr; اليمين).');
          var inorderPath = [];
          inorderTraversal('a', inorderPath, 'inorder');
          completedPaths.in = inorderPath.slice(); // تم الاكتمال
          addStep('inorder', null, inorderPath, 'Inorder Traversal Complete!', 'اكتمل اجتياز الترتيب الوسطي بنجاح!');
      
          // Postorder
          addStep('postorder', null, [], 'Starting Postorder Traversal (Left &rarr; Right &rarr; Root).', 'بدء اجتياز الترتيب الخلفي (اليسار &larr; اليمين &larr; الجذر).');
          var postorderPath = [];
          postorderTraversal('a', postorderPath, 'postorder');
          completedPaths.post = postorderPath.slice(); // تم الاكتمال
          addStep('postorder', null, postorderPath, 'All Traversals Complete!', 'اكتملت جميع عمليات الاجتياز بنجاح!');
        }
      
        function createBadge(labelEn, labelAr, pathArr, color) {
            var label = _AL.lang() === 'ar' ? labelAr : labelEn;
            var pathStr = pathArr.map(n => n.toUpperCase()).join(' &rarr; ');
            return `<div style="font-size:0.75rem; background:var(--bg-elevated); border:1px solid var(--border-color); padding:4px 10px; border-radius:var(--radius-pill); display:flex; align-items:center; gap:6px;">
                <strong style="color:${color};">${label}:</strong> 
                <span dir="ltr" style="font-family:'JetBrains Mono', monospace; font-weight:800; color:var(--text-primary); letter-spacing:0.05em;">${pathStr}</span>
            </div>`;
        }

        function render() {
          updateLabels();
          var s = steps[cur];
          counter.textContent = _AL.stepLabel(cur, steps.length - 1);
          expEl.innerHTML = _AL.exp(s.en, s.ar);
          
          // تحديث حاوية النتائج السفلية بشكل ديناميكي وذكي
          resultsContainer.innerHTML = '';
          var comp = s.completed;
          if (comp.pre) resultsContainer.innerHTML += createBadge('Preorder', 'أمامي', comp.pre, 'var(--brand-500)');
          if (comp.in) resultsContainer.innerHTML += createBadge('Inorder', 'وسطي', comp.in, 'var(--algo-compare)');
          if (comp.post) resultsContainer.innerHTML += createBadge('Postorder', 'خلفي', comp.post, 'var(--algo-swap)');
      
          svgEl.innerHTML = ''; 
      
          // رسم الخطوط أولاً لتكون خلف الدوائر (وتحسين وضوحها)
          for (var nodeId in nodes) {
            var node = nodes[nodeId];
            if (node.left) { drawEdge(nodeId, node.left); }
            if (node.right) { drawEdge(nodeId, node.right); }
          }
      
          // رسم العقد والنصوص
          for (var nodeId in nodes) {
            var node = nodes[nodeId];
            
            var isCurrent = (nodeId === s.currentNode);
            var inPath = s.path.includes(nodeId);

            var fill = 'var(--brand-400)';
            var stroke = 'var(--algo-border)';
            var sw = '2';
            var scale = '1';

            if (isCurrent) {
              fill = 'var(--algo-active)';
              stroke = '#ffffff';
              sw = '3';
              scale = '1.15';
            } else if (inPath) {
              fill = 'var(--algo-sorted)';
            }

            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.style.transform = `scale(${scale})`;
            g.style.transformOrigin = `${node.x}px ${node.y}px`;
            g.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', 22); // حجم أوسع قليلاً للدوائر
            circle.setAttribute('fill', fill);
            circle.setAttribute('stroke', stroke);
            circle.setAttribute('stroke-width', sw);
            circle.style.transition = 'fill 0.3s ease';
      
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y);
            text.setAttribute('dy', '.1em');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#ffffff');
            text.setAttribute('font-family', "'Inter', sans-serif");
            text.setAttribute('font-size', '15px');
            text.setAttribute('font-weight', '800');
            text.textContent = nodeId.toUpperCase();
      
            g.appendChild(circle);
            g.appendChild(text);
            svgEl.appendChild(g);
          }
        }
      
        function drawEdge(parent, child) {
          var p = nodes[parent];
          var c = nodes[child];
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', p.x);
          line.setAttribute('y1', p.y);
          line.setAttribute('x2', c.x);
          line.setAttribute('y2', c.y);
          // حل مشكلة النمط النهاري بجعل الخط داكناً وأكثر وضوحاً
          line.setAttribute('stroke', 'var(--text-muted)');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('opacity', '0.6'); 
          svgEl.appendChild(line);
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
      
        window._algoRerenders[4] = render;
        generateSteps();
        render();
};

window.AlgoWidgets[5] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
          _AL.titleHTML(5) +
          _AL.toolbar(5) +
          '<div class="algo-explanation" id="w5-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 10px;"></div>' +
          '<div class="algo-canvas" style="height:400px; width:100%; border: 1px solid var(--algo-border); border-radius: var(--radius-md); overflow: hidden;">' +
            '<svg id="w5-svg" width="100%" height="100%" viewBox="0 0 800 400" style="background:var(--algo-canvas-bg);">' +
              '<g id="w5-lines"></g>' +
              '<rect id="w5-strip-rect" fill="var(--algo-compare)" opacity="0.1" style="display:none; transition: all 0.3s ease;"></rect>' +
              '<line id="w5-divline" stroke="var(--algo-active)" stroke-dasharray="5,5" stroke-width="2" style="display:none; transition: all 0.3s ease;"></line>' +
              '<g id="w5-points-group"></g>' +
            '</svg>' +
          '</div>' +
          '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:12px;font-size:0.85rem;color:var(--text-secondary);">' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-points"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-divline"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);opacity:0.4;border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-strip"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;border:2px dashed var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-comp"></span></span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-minpair"></span></span>' +
          '</div>' +
        '</div>';
      
        var btnPlay   = container.querySelector('[data-algo-btn="play"]');
        var expEl     = container.querySelector('#w5-exp');
        var counter   = container.querySelector('[data-algo-counter]');
        var svgEl     = container.querySelector('#w5-svg');
        var linesGroup = container.querySelector('#w5-lines');
        var pointsGroup = container.querySelector('#w5-points-group');
        var divLineEl = container.querySelector('#w5-divline');
        var stripRectEl = container.querySelector('#w5-strip-rect');
      
        var steps = [], cur = 0, playing = false, interval = null;
        var SVG_WIDTH = 800, SVG_HEIGHT = 400;
      
        function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
        function updateLabels() {
          container.querySelector('[data-algo-text="w5-points"]').textContent  = _AL.exp('Points', 'النقاط');
          container.querySelector('[data-algo-text="w5-divline"]').textContent = _AL.exp('Dividing Line', 'خط التقسيم');
          container.querySelector('[data-algo-text="w5-strip"]').textContent   = _AL.exp('2d Strip', 'شريط 2d');
          container.querySelector('[data-algo-text="w5-comp"]').textContent    = _AL.exp('Comparison', 'مقارنة / مسافة');
          container.querySelector('[data-algo-text="w5-minpair"]').textContent = _AL.exp('Closest Pair', 'أقرب زوج');
        }
      
        function dist(p1, p2) {
          return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }
      
        function generateSteps() {
          steps = [];
          var points = [];
          var numPoints = 15;
          var minCoord = 50, maxCoordX = SVG_WIDTH - 50, maxCoordY = SVG_HEIGHT - 50;
          var minDistanceBetweenGeneratedPoints = 30; 
      
          for (var i = 0; i < numPoints; i++) {
            var newP;
            var valid = false;
            while (!valid) {
              newP = {
                id: i,
                x: Math.floor(Math.random() * (maxCoordX - minCoord)) + minCoord,
                y: Math.floor(Math.random() * (maxCoordY - minCoord)) + minCoord
              };
              valid = true;
              for (var j = 0; j < points.length; j++) {
                if (dist(newP, points[j]) < minDistanceBetweenGeneratedPoints) {
                  valid = false;
                  break;
                }
              }
            }
            points.push(newP);
          }
      
          steps.push({
            points: points.slice(), divLineX: null, stripRect: null, comparing: null, minPair: null, highlightPoints: [],
            en: 'Initial set of ' + numPoints + ' points in 2D space.',
            ar: 'المجموعة الأولية المكونة من ' + numPoints + ' نقطة في الفضاء ثنائي الأبعاد.'
          });
      
          var sortedPx = points.slice().sort((a, b) => a.x - b.x);
          steps.push({
            points: sortedPx.slice(), divLineX: null, stripRect: null, comparing: null, minPair: null, highlightPoints: [],
            en: 'Points sorted by X-coordinate.',
            ar: 'تم ترتيب النقاط من اليسار إلى اليمين بناءً على الإحداثي السيني (X).'
          });
      
          var midIndex = Math.floor(sortedPx.length / 2);
          var midX = (sortedPx[midIndex - 1].x + sortedPx[midIndex].x) / 2;
          
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: null, highlightPoints: [],
            en: 'Divide points into left and right halves by a vertical line.',
            ar: 'قسّم: تقسيم النقاط إلى نصفين متساويين (أيسر وأيمن) بخط عمودي وهمي.'
          });
      
          var leftHalf = sortedPx.slice(0, midIndex);
          var rightHalf = sortedPx.slice(midIndex);

          var minL = Infinity, pairL = null;
          for (var i = 0; i < leftHalf.length; i++) {
            for (var j = i + 1; j < leftHalf.length; j++) {
              var dL = dist(leftHalf[i], leftHalf[j]);
              if (dL < minL) { minL = dL; pairL = [leftHalf[i].id, leftHalf[j].id]; }
            }
          }

          var minR = Infinity, pairR = null;
          for (var i = 0; i < rightHalf.length; i++) {
            for (var j = i + 1; j < rightHalf.length; j++) {
              var dR = dist(rightHalf[i], rightHalf[j]);
              if (dR < minR) { minR = dR; pairR = [rightHalf[i].id, rightHalf[j].id]; }
            }
          }
      
          // الخطوة الجديدة 1: استعراض النصف الأيسر فقط
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: pairL, minPair: null, highlightPoints: leftHalf.map(p=>p.id),
            en: 'Solve Left: Recursively find closest pair in left half. dL = ' + minL.toFixed(1) + '.',
            ar: 'حلّ (النصف الأيسر): تقوم الخوارزمية بالبحث المتكرر في النصف الأيسر، وُجد أن أقصر مسافة هي <strong>dL = ' + minL.toFixed(1) + '</strong>.'
          });

          // الخطوة الجديدة 2: استعراض النصف الأيمن فقط
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: pairR, minPair: null, highlightPoints: rightHalf.map(p=>p.id),
            en: 'Solve Right: Recursively find closest pair in right half. dR = ' + minR.toFixed(1) + '.',
            ar: 'حلّ (النصف الأيمن): تقوم الخوارزمية بالبحث المتكرر في النصف الأيمن، وُجد أن أقصر مسافة هي <strong>dR = ' + minR.toFixed(1) + '</strong>.'
          });

          var currentMinDist = Infinity;
          var currentMinPair = null;
          if (minL < minR) { currentMinDist = minL; currentMinPair = pairL; } 
          else { currentMinDist = minR; currentMinPair = pairR; }
      
          // الخطوة الجديدة 3: المقارنة وتحديد d
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: currentMinPair, highlightPoints: currentMinPair,
            en: 'Take the minimum of both sides. Let d = min(dL, dR) = ' + currentMinDist.toFixed(1) + '.',
            ar: 'مقارنة: نأخذ المسافة الأقصر بين النصفين. لتكن <strong>d = ' + currentMinDist.toFixed(1) + '</strong> كأقصر مسافة تم العثور عليها حتى الآن.'
          });
      
          var stripWidth = 2 * currentMinDist;
          var stripX = midX - currentMinDist;
          var stripPoints = sortedPx.filter(p => p.x >= stripX && p.x <= midX + currentMinDist);
          
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, y: 0, width: stripWidth, height: SVG_HEIGHT }, comparing: null, minPair: currentMinPair, highlightPoints: stripPoints.map(p => p.id),
            en: 'Check the boundary: Create a strip of width 2d around the dividing line.',
            ar: 'ادمج (فحص الحدود): قد توجد نقطة باليسار وأخرى باليمين أقرب لبعضهما من d. نرسم شريطاً بعرض 2d حول الخط.'
          });
      
          var sortedPy = stripPoints.slice().sort((a, b) => a.y - b.y);
          if(sortedPy.length > 1) {
              steps.push({
                points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, y: 0, width: stripWidth, height: SVG_HEIGHT }, comparing: null, minPair: currentMinPair, highlightPoints: sortedPy.map(p => p.id),
                en: 'Points within the strip are sorted by Y-coordinate.',
                ar: 'نقوم بترتيب النقاط التي تقع داخل الشريط بناءً على الإحداثي الصادي (Y) لفحصها بسرعة.'
              });
          }
      
          var foundNewMin = false;
          for (var i = 0; i < sortedPy.length; i++) {
            var p1 = sortedPy[i];
            for (var j = i + 1; j < sortedPy.length && (sortedPy[j].y - p1.y) < currentMinDist; j++) {
              var p2 = sortedPy[j];
              steps.push({
                points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, y: 0, width: stripWidth, height: SVG_HEIGHT }, comparing: [p1.id, p2.id], minPair: currentMinPair, highlightPoints: sortedPy.map(p => p.id),
                en: 'Comparing distance between points P' + p1.id + ' and P' + p2.id + ' inside the strip.',
                ar: 'التحقق من المسافة بين P' + p1.id + ' و P' + p2.id + ' داخل الشريط.'
              });
      
              var d = dist(p1, p2);
              if (d < currentMinDist) {
                currentMinDist = d;
                currentMinPair = [p1.id, p2.id];
                foundNewMin = true;
                steps.push({
                  points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, y: 0, width: stripWidth, height: SVG_HEIGHT }, comparing: null, minPair: currentMinPair, highlightPoints: sortedPy.map(p => p.id),
                  en: 'Found a closer pair across the boundary! Distance is now ' + d.toFixed(1) + '.',
                  ar: 'تم العثور على زوج أقرب يعبر الحدود! (P' + p1.id + ' , P' + p2.id + ') بمسافة <strong dir="ltr">' + d.toFixed(1) + '</strong>.'
                });
              }
            }
          }
          
          if (!foundNewMin && sortedPy.length > 1) {
              steps.push({
                points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, y: 0, width: stripWidth, height: SVG_HEIGHT }, comparing: null, minPair: currentMinPair, highlightPoints: sortedPy.map(p => p.id),
                en: 'Checked all valid pairs in the strip. No closer pair was found.',
                ar: 'تم فحص جميع الأزواج المحتملة في الشريط ولم يتم العثور على مسافة أقصر من d.'
              });
          }
      
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: currentMinPair, highlightPoints: currentMinPair,
            en: 'The absolute closest pair is P' + currentMinPair[0] + ' and P' + currentMinPair[1] + '.',
            ar: 'الخلاصة: أقرب زوج من النقاط على الإطلاق هما P' + currentMinPair[0] + ' و P' + currentMinPair[1] + ' بمسافة نهائية <strong dir="ltr">' + currentMinDist.toFixed(1) + '</strong>.'
          });
        }
      
        function render() {
          updateLabels();
          var s = steps[cur];
          counter.textContent = _AL.stepLabel(cur, steps.length - 1);
          expEl.innerHTML = _AL.exp(s.en, s.ar);
      
          linesGroup.innerHTML = '';
          pointsGroup.innerHTML = '';
      
          if (s.stripRect) {
            stripRectEl.setAttribute('x', s.stripRect.x);
            stripRectEl.setAttribute('y', s.stripRect.y);
            stripRectEl.setAttribute('width', s.stripRect.width);
            stripRectEl.setAttribute('height', s.stripRect.height);
            stripRectEl.style.display = 'block';
          } else {
            stripRectEl.style.display = 'none';
          }
      
          if (s.divLineX !== null) {
            divLineEl.setAttribute('x1', s.divLineX);
            divLineEl.setAttribute('y1', 0);
            divLineEl.setAttribute('x2', s.divLineX);
            divLineEl.setAttribute('y2', SVG_HEIGHT);
            divLineEl.style.display = 'block';
          } else {
            divLineEl.style.display = 'none';
          }
      
          s.points.forEach(function(p) {
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', 6);
            
            // Highlight logic
            if (s.minPair && (p.id === s.minPair[0] || p.id === s.minPair[1])) {
               circle.setAttribute('fill', 'var(--algo-sorted)');
               circle.setAttribute('r', 8);
            } else if (s.highlightPoints.includes(p.id)) {
               circle.setAttribute('fill', 'var(--algo-compare)');
            } else {
               circle.setAttribute('fill', 'var(--brand-500)');
               if(s.highlightPoints.length > 0 && !s.minPair) {
                   circle.setAttribute('opacity', '0.3'); // بهتان العقد غير المحددة للتركيز
               }
            }
            
            g.appendChild(circle);
      
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', p.x + 10);
            text.setAttribute('y', p.y + 4);
            text.setAttribute('fill', 'var(--algo-text)');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-family', "'Inter', sans-serif");
            text.setAttribute('font-weight', '700');
            text.textContent = 'P' + p.id;
            if(s.highlightPoints.length > 0 && !s.highlightPoints.includes(p.id) && !s.minPair) {
                text.setAttribute('opacity', '0.3');
            }
            g.appendChild(text);
            
            pointsGroup.appendChild(g);
          });
      
          // رسم خط المقارنة المؤقت (المسافة الفرعية)
          if (s.comparing && s.comparing.length === 2) {
            var p1 = s.points.find(p => p.id === s.comparing[0]);
            var p2 = s.points.find(p => p.id === s.comparing[1]);
            if (p1 && p2) {
              var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
              line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
              line.setAttribute('stroke', 'var(--algo-compare)');
              line.setAttribute('stroke-dasharray', '4,4');
              line.setAttribute('stroke-width', '2');
              linesGroup.appendChild(line);
            }
          }
      
          // رسم خط أقرب مسافة
          if (s.minPair && s.minPair.length === 2) {
            var p1 = s.points.find(p => p.id === s.minPair[0]);
            var p2 = s.points.find(p => p.id === s.minPair[1]);
            if (p1 && p2) {
              var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
              line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
              line.setAttribute('stroke', 'var(--algo-sorted)');
              line.setAttribute('stroke-width', '3');
              linesGroup.appendChild(line);
            }
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
          if (playing) { clearInterval(interval); interval = setInterval(function() { if (cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); }
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