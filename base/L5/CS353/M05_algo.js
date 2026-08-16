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

window._algoTitles = window._algoTitles || {};
window._algoTitles[3] = { en: 'Quick Sort: Hoare Partitioning', ar: 'الترتيب السريع : تقسيم هور' };

window.AlgoWidgets[3] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(3) +
      _AL.toolbar(3) +
      '<div class="algo-explanation" id="w3-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 16:9 
      '<div class="algo-canvas" id="w3-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: flex-end; justify-content: center; overflow:visible; padding-bottom: 30px;">' +
        '<svg id="w3-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:20px;font-size:0.85rem;color:var(--text-secondary);">' +
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
  var isInitialized = false;
      
  const NUM_ELEMENTS = 8;
  const BAR_WIDTH = 60;
  const BAR_GAP = 20;
  const MAX_VAL = 100;
  const SVG_W = 800;
  const SVG_H = 450;
  const MAX_BAR_H = 280;
  
  // إجمالي العرض للمصفوفة
  const TOTAL_W = (NUM_ELEMENTS * BAR_WIDTH) + ((NUM_ELEMENTS - 1) * BAR_GAP);
  const START_X = (SVG_W - TOTAL_W) / 2;
  const BASE_Y = SVG_H - 60; // مكان ارتكاز الأعمدة من الأسفل

  var uiBars = [];
  var uiPointers = { i: { g: null, poly: null, txt: null }, j: { g: null, poly: null, txt: null } };
      
  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
      
  function updateLabels() {
    container.querySelector('[data-algo-text="w3-un"]').textContent = _AL.exp('Unsorted', 'غير مرتب');
    container.querySelector('[data-algo-text="w3-pi"]').textContent = _AL.exp('Pivot', 'المحور (Pivot)');
    container.querySelector('[data-algo-text="w3-co"]').textContent = _AL.exp('Comparing', 'مقارنة');
    container.querySelector('[data-algo-text="w3-sw"]').textContent = _AL.exp('Swapping', 'تبديل');
    container.querySelector('[data-algo-text="w3-so"]').textContent = _AL.exp('Sorted Range', 'نطاق مرتب');
  }
      
  function generateSteps() {
    var arr = [];
    for(var i=0; i<NUM_ELEMENTS; i++) {
      arr.push(Math.floor(Math.random() * 80) + 20); // Values 20-99
    }
      
    steps = [];
    var sortedRegions = [];
      
    function partition(arr, low, high, steps, sortedRegions) {
      let pivotIdx = low; 
      let pivotValue = arr[pivotIdx];
      let activeRange = [low, high];
      
      steps.push({
        array: arr.slice(), pivotIdx: pivotIdx, activeRange: activeRange,
        i: low - 1, j: high + 1, comparingI: false, comparingJ: false, swapping: false,
        sortedRegions: sortedRegions.slice(),
        en: `Partitioning sub-array [${low}...${high}]. Pivot is <strong>${pivotValue}</strong> (at index ${pivotIdx}).`, 
        ar: `تقسيم المصفوفة الفرعية [${low}...${high}]. المحور هو <strong>${pivotValue}</strong> (في الفهرس ${pivotIdx}).`
      });
      
      let i = low - 1;
      let j = high + 1;
      
      while (true) {
        do {
          i++;
          steps.push({
            array: arr.slice(), pivotIdx: pivotIdx, activeRange: activeRange,
            i: i, j: j, comparingI: true, comparingJ: false, swapping: false,
            sortedRegions: sortedRegions.slice(),
            en: `Move <strong>i</strong> right while A[i] < pivot (${pivotValue}). Checking A[${i}]=${arr[i]}.`, 
            ar: `تحريك المؤشر <strong>i</strong> لليمين طالما A[i] < المحور (${pivotValue}). نفحص A[${i}]=${arr[i]}.`
          });
        } while (arr[i] < pivotValue);
      
        do {
          j--;
          steps.push({
            array: arr.slice(), pivotIdx: pivotIdx, activeRange: activeRange,
            i: i, j: j, comparingI: false, comparingJ: true, swapping: false,
            sortedRegions: sortedRegions.slice(),
            en: `Move <strong>j</strong> left while A[j] > pivot (${pivotValue}). Checking A[${j}]=${arr[j]}.`, 
            ar: `تحريك المؤشر <strong>j</strong> لليسار طالما A[j] > المحور (${pivotValue}). نفحص A[${j}]=${arr[j]}.`
          });
        } while (arr[j] > pivotValue);
      
        if (i < j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({
            array: arr.slice(), pivotIdx: pivotIdx, activeRange: activeRange,
            i: i, j: j, comparingI: false, comparingJ: false, swapping: true,
            sortedRegions: sortedRegions.slice(),
            en: `Swap A[${i}] and A[${j}] as they are on the wrong sides of the pivot.`, 
            ar: `تبديل A[${i}] و A[${j}] لأنهما في الجانب الخاطئ من المحور.`
          });
        } else {
          steps.push({
            array: arr.slice(), pivotIdx: pivotIdx, activeRange: activeRange,
            i: i, j: j, comparingI: false, comparingJ: false, swapping: false,
            sortedRegions: sortedRegions.slice(),
            en: `<strong>i</strong> (${i}) has crossed <strong>j</strong> (${j}). Partitioning complete. Split point is ${j}.`, 
            ar: `المؤشر <strong>i</strong> (${i}) تجاوز <strong>j</strong> (${j}). اكتمل التقسيم. نقطة التقسيم هي ${j}.`
          });
          return j;
        }
      }
    }
      
    function quickSortIterative(arr, steps, sortedRegions) {
      let callStack = [{ low: 0, high: arr.length - 1 }];
      
      steps.push({
        array: arr.slice(), pivotIdx: -1, activeRange: [0, arr.length - 1],
        i: -1, j: -1, comparingI: false, comparingJ: false, swapping: false,
        sortedRegions: sortedRegions.slice(),
        en: 'Initial array state. Starting Quick Sort.', 
        ar: 'الحالة الأولية للمصفوفة. بدء الترتيب السريع.'
      });
      
      while (callStack.length > 0) {
        let { low, high } = callStack.pop();
      
        if (low >= high) {
          let isCovered = false;
          for (let region of sortedRegions) {
            if (low >= region[0] && high <= region[1]) { isCovered = true; break; }
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
            array: arr.slice(), pivotIdx: -1, activeRange: [low, high],
            i: -1, j: -1, comparingI: false, comparingJ: false, swapping: false,
            sortedRegions: sortedRegions.slice(),
            en: `Sub-array [${low}...${high}] is sorted.`, 
            ar: `المصفوفة الفرعية [${low}...${high}] مرتبة.`
          });
          continue;
        }
      
        let p = partition(arr, low, high, steps, sortedRegions);
        callStack.push({ low: p + 1, high: high });
        callStack.push({ low: low, high: p });
      }
      
      if (sortedRegions.length === 0 || sortedRegions[0][0] !== 0 || sortedRegions[0][1] !== arr.length - 1) {
        sortedRegions = [[0, arr.length - 1]];
      }
      
      steps.push({
        array: arr.slice(), pivotIdx: -1, activeRange: [0, arr.length - 1],
        i: -1, j: -1, comparingI: false, comparingJ: false, swapping: false,
        sortedRegions: sortedRegions.slice(),
        en: '<strong>Quick Sort complete!</strong> Array is fully sorted.', 
        ar: '<strong>اكتمل الترتيب السريع!</strong> المصفوفة مرتبة بالكامل.'
      });
    }
      
    quickSortIterative(arr, steps, sortedRegions);
  }

  function makeSVG(tag, attrs) {
    let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let k in attrs) el.setAttribute(k, attrs[k]);
    el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    return el;
  }

  function buildSVG() {
    svgEl.innerHTML = '';
    uiBars = [];

    // بناء الأعمدة (Bars)
    for(let i=0; i<NUM_ELEMENTS; i++) {
      let x = START_X + i * (BAR_WIDTH + BAR_GAP);
      let g = makeSVG('g', {});
      
      // المستطيل (العمود)
      let rect = makeSVG('rect', { x: x, y: BASE_Y, width: BAR_WIDTH, height: 0, rx: 6, ry: 6 });
      
      // خلفية النص لتوضيح القيمة
      let txtBg = makeSVG('rect', { x: x + 5, width: BAR_WIDTH - 10, height: 26, rx: 4, fill: 'rgba(0,0,0,0.2)' });
      
      // نص القيمة داخل العمود
      let valTxt = makeSVG('text', { x: x + BAR_WIDTH/2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: '#ffffff', 'font-family': "'JetBrains Mono', monospace", 'font-size': '16px', 'font-weight': '800' });
      
      // الفهرس (Index) أسفل العمود
      let idxTxt = makeSVG('text', { x: x + BAR_WIDTH/2, y: BASE_Y + 25, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-muted)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '14px', 'font-weight': 'bold' });
      idxTxt.textContent = i;

      g.appendChild(rect);
      g.appendChild(txtBg);
      g.appendChild(valTxt);
      g.appendChild(idxTxt);
      svgEl.appendChild(g);

      uiBars.push({ g, rect, txtBg, valTxt, x });
    }

    // بناء المؤشرات (Pointers i and j)
    function createPointer(color, labelStr, isTop) {
      let g = makeSVG('g', { opacity: 0 });
      let poly = makeSVG('polygon', { fill: color });
      let txt = makeSVG('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: color, 'font-family': "'JetBrains Mono', monospace", 'font-size': '18px', 'font-weight': 'bold' });
      txt.textContent = labelStr;
      g.appendChild(poly);
      g.appendChild(txt);
      svgEl.appendChild(g);
      return { g, poly, txt, isTop };
    }

    uiPointers.i = createPointer('var(--algo-active)', 'i', true);
    uiPointers.j = createPointer('var(--algo-active)', 'j', false);

    isInitialized = true;
  }
      
  function render() {
    if(!isInitialized) buildSVG();
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);
      
    var maxVal = Math.max(...s.array, 1); 
      
    // 1. تحديث الأعمدة
    s.array.forEach(function(val, idx) {
      var ui = uiBars[idx];
      var barHeight = (val / maxVal) * MAX_BAR_H;
      var currentY = BASE_Y - barHeight;
      
      ui.rect.setAttribute('y', currentY);
      ui.rect.setAttribute('height', barHeight);
      
      ui.txtBg.setAttribute('y', currentY + 10);
      ui.valTxt.setAttribute('y', currentY + 23);
      ui.valTxt.textContent = val;

      // الألوان والحالات
      let fill = 'var(--brand-400)';
      let isSorted = false;
      
      for (let region of s.sortedRegions) {
        if (idx >= region[0] && idx <= region[1]) { isSorted = true; break; }
      }

      if (isSorted) {
        fill = 'var(--algo-sorted)';
      } else if (s.swapping && (s.i === idx || s.j === idx)) {
        fill = 'var(--algo-swap)';
      } else if ((s.comparingI && s.i === idx) || (s.comparingJ && s.j === idx)) {
        fill = 'var(--algo-compare)';
      } else if (s.pivotIdx === idx && s.activeRange && idx >= s.activeRange[0] && idx <= s.activeRange[1]) {
        fill = 'var(--algo-active)';
      }

      ui.rect.setAttribute('fill', fill);
      
      // التعتيم خارج نطاق التقسيم
      if (s.activeRange && (idx < s.activeRange[0] || idx > s.activeRange[1])) {
        ui.g.style.opacity = '0.3';
      } else {
        ui.g.style.opacity = '1';
      }
    });

    // 2. تحديث المؤشرات i و j
    function updatePointer(ptrUi, targetIdx, isComparing, isSwapping) {
      if (targetIdx >= 0 && targetIdx < NUM_ELEMENTS) {
        let targetX = uiBars[targetIdx].x + BAR_WIDTH/2;
        let targetY;
        
        ptrUi.g.style.opacity = '1';
        let color = 'var(--algo-active)';
        if (isSwapping) color = 'var(--algo-swap)';
        else if (isComparing) color = 'var(--algo-compare)';

        ptrUi.poly.setAttribute('fill', color);
        ptrUi.txt.setAttribute('fill', color);

        if (ptrUi.isTop) {
          // السهم العلوي (i)
          targetY = BASE_Y - MAX_BAR_H - 30; // ثابت فوق أعلى عمود محتمل
          ptrUi.poly.setAttribute('points', `${targetX},${targetY+10} ${targetX-8},${targetY-4} ${targetX+8},${targetY-4}`);
          ptrUi.txt.setAttribute('x', targetX);
          ptrUi.txt.setAttribute('y', targetY - 18);
        } else {
          // السهم السفلي (j)
          targetY = BASE_Y + 50; 
          ptrUi.poly.setAttribute('points', `${targetX},${targetY-10} ${targetX-8},${targetY+4} ${targetX+8},${targetY+4}`);
          ptrUi.txt.setAttribute('x', targetX);
          ptrUi.txt.setAttribute('y', targetY + 18);
        }
        
        // تأثير تكبير إذا كان يقارن
        ptrUi.g.style.transform = isComparing ? 'scale(1.2)' : 'scale(1)';
        ptrUi.g.style.transformOrigin = `${targetX}px ${targetY}px`;
      } else {
        ptrUi.g.style.opacity = '0';
      }
    }

    // إظهار المؤشرات فقط إذا لم نكن في الحالة النهائية المكتملة
    let isDone = (s.sortedRegions.length === 1 && s.sortedRegions[0][0] === 0 && s.sortedRegions[0][1] === NUM_ELEMENTS - 1);
    
    if (isDone) {
      uiPointers.i.g.style.opacity = '0';
      uiPointers.j.g.style.opacity = '0';
    } else {
      updatePointer(uiPointers.i, s.i, s.comparingI, s.swapping && s.i !== -1);
      updatePointer(uiPointers.j, s.j, s.comparingJ, s.swapping && s.j !== -1);
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
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ 
    stopPlay(); 
    isInitialized = false; 
    generateSteps(); 
    cur = 0; 
    render(); 
  });
  
  container.querySelector('.algo-speed input').addEventListener('input', function(){
    if(playing){ clearInterval(interval); interval = setInterval(function(){if(cur<steps.length-1){cur++;render();}else stopPlay();},getDelay()); }
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

window._algoTitles = window._algoTitles || {};
window._algoTitles[5] = { en: 'Closest Pair (Divide & Conquer)', ar: 'أقرب زوج (التقسيم والسيطرة)' };

window.AlgoWidgets[5] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(5) +
      _AL.toolbar(5) +
      '<div class="algo-explanation" id="w5-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية מתجاوبة بأبعاد 16:9
      '<div class="algo-canvas" id="w5-canvas" style="position:relative; width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); display: flex; align-items: center; justify-content: center; overflow:hidden;">' +
        '<svg id="w5-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w5-points"></span></span>' +
        '<span><span style="display:inline-block;width:16px;height:2px;border-bottom:2px dashed var(--algo-active);margin-right:4px;vertical-align:middle;"></span><span data-algo-text="w5-divline"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);opacity:0.4;border-radius:3px;margin-right:4px;"></span><span data-algo-text="w5-strip"></span></span>' +
        '<span><span style="display:inline-block;width:16px;height:2px;border-bottom:3px dashed var(--algo-compare);margin-right:4px;vertical-align:middle;"></span><span data-algo-text="w5-comp"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-sorted);border-radius:50%;margin-right:4px;"></span><span data-algo-text="w5-minpair"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w5-exp');
    var svgEl   = container.querySelector('#w5-svg');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    const SVG_W = 800, SVG_H = 450;
    const PADDING = 50;
    const RADIUS = 7;
    
    var uiElements = {
      points: {},
      divLine: null,
      stripRect: null,
      compLine: null,
      bestLine: null,
      distBadge: { g: null, bg: null, txt: null }
    };

    var basePoints = [];

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w5-points"]').textContent  = _AL.exp('Points', 'النقاط');
      container.querySelector('[data-algo-text="w5-divline"]').textContent = _AL.exp('Dividing Line', 'خط التقسيم');
      container.querySelector('[data-algo-text="w5-strip"]').textContent   = _AL.exp('2d Strip Boundary', 'شريط الحدود (2d)');
      container.querySelector('[data-algo-text="w5-comp"]').textContent    = _AL.exp('Distance Check', 'فحص المسافة');
      container.querySelector('[data-algo-text="w5-minpair"]').textContent = _AL.exp('Closest Pair', 'أقرب زوج');
    }

    function dist(p1, p2) {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    function generateSteps() {
      steps = [];
      basePoints = [];
      var numPoints = Math.floor(Math.random() * 6) + 12; // 12 to 17 points
      
      // توليد نقاط متباعدة بشكل معقول
      var minDistance = 30; 
      for (var i = 0; i < numPoints; i++) {
        var newP;
        var valid = false;
        while (!valid) {
          newP = {
            id: i,
            x: Math.floor(Math.random() * (SVG_W - PADDING * 2)) + PADDING,
            y: Math.floor(Math.random() * (SVG_H - PADDING * 2)) + PADDING
          };
          valid = true;
          for (var j = 0; j < basePoints.length; j++) {
            if (dist(newP, basePoints[j]) < minDistance) {
              valid = false;
              break;
            }
          }
        }
        basePoints.push(newP);
      }

      // Step 1: Initial state
      steps.push({
        points: basePoints.slice(), divLineX: null, stripRect: null, comparing: null, minPair: null, currDist: null, hlPoints: [],
        en: `<strong>Initial State:</strong> A set of ${numPoints} points in 2D space. Goal: Find the closest pair using Divide & Conquer.`,
        ar: `<strong>الحالة الأولية:</strong> مجموعة من ${numPoints} نقطة في فضاء ثنائي الأبعاد. الهدف: إيجاد أقرب نقطتين باستخدام التقسيم والسيطرة.`
      });

      // Step 2: Sort by X
      var sortedPx = basePoints.slice().sort((a, b) => a.x - b.x);
      steps.push({
        points: sortedPx.slice(), divLineX: null, stripRect: null, comparing: null, minPair: null, currDist: null, hlPoints: [],
        en: '<strong>Step 1:</strong> Sort all points based on their X-coordinate.',
        ar: `<strong>الخطوة 1:</strong> نقوم بترتيب جميع النقاط بناءً على إحداثياتها الأفقية (X).`
      });

      // Step 3: Divide
      var midIndex = Math.floor(sortedPx.length / 2);
      var midX = (sortedPx[midIndex - 1].x + sortedPx[midIndex].x) / 2;
      
      steps.push({
        points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: null, currDist: null, hlPoints: [],
        en: '<strong>Divide:</strong> Split the points into two equal halves (Left and Right) using a vertical dividing line.',
        ar: `<strong>التقسيم:</strong> نقسم النقاط إلى نصفين متساويين (أيسر وأيمن) باستخدام خط تقسيم رأسي وهمي.`
      });

      var leftHalf = sortedPx.slice(0, midIndex);
      var rightHalf = sortedPx.slice(midIndex);

      // Simulation of Left Half solving
      var minL = Infinity, pairL = null;
      for (var i = 0; i < leftHalf.length; i++) {
        for (var j = i + 1; j < leftHalf.length; j++) {
          var dL = dist(leftHalf[i], leftHalf[j]);
          if (dL < minL) { minL = dL; pairL = [leftHalf[i].id, leftHalf[j].id]; }
        }
      }

      steps.push({
        points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: pairL, currDist: minL, hlPoints: leftHalf.map(p => p.id),
        en: `<strong>Conquer (Left):</strong> Recursively find the closest pair in the left half. <strong>dL = ${minL.toFixed(1)}</strong>.`,
        ar: `<strong>السيطرة (النصف الأيسر):</strong> نجد أقرب زوج في النصف الأيسر بشكل متكرر. <strong>dL = <span dir="ltr">${minL.toFixed(1)}</span></strong>.`
      });

      // Simulation of Right Half solving
      var minR = Infinity, pairR = null;
      for (var i = 0; i < rightHalf.length; i++) {
        for (var j = i + 1; j < rightHalf.length; j++) {
          var dR = dist(rightHalf[i], rightHalf[j]);
          if (dR < minR) { minR = dR; pairR = [rightHalf[i].id, rightHalf[j].id]; }
        }
      }

      steps.push({
        points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: pairR, currDist: minR, hlPoints: rightHalf.map(p => p.id),
        en: `<strong>Conquer (Right):</strong> Recursively find the closest pair in the right half. <strong>dR = ${minR.toFixed(1)}</strong>.`,
        ar: `<strong>السيطرة (النصف الأيمن):</strong> نجد أقرب زوج في النصف الأيمن بشكل متكرر. <strong>dR = <span dir="ltr">${minR.toFixed(1)}</span></strong>.`
      });

      var currentMinDist = Infinity;
      var currentMinPair = null;
      if (minL < minR) { currentMinDist = minL; currentMinPair = pairL; } 
      else { currentMinDist = minR; currentMinPair = pairR; }

      steps.push({
        points: sortedPx.slice(), divLineX: midX, stripRect: null, comparing: null, minPair: currentMinPair, currDist: currentMinDist, hlPoints: currentMinPair,
        en: `Let <strong>d</strong> be the minimum of dL and dR. Currently, <strong>d = ${currentMinDist.toFixed(1)}</strong>.`,
        ar: `لتكن <strong>d</strong> هي القيمة الأصغر بين dL و dR. حالياً، <strong>d = <span dir="ltr">${currentMinDist.toFixed(1)}</span></strong>.`
      });

      // Strip creation
      var stripWidth = 2 * currentMinDist;
      var stripX = midX - currentMinDist;
      var stripPoints = sortedPx.filter(p => p.x >= stripX && p.x <= midX + currentMinDist);
      
      steps.push({
        points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, width: stripWidth }, comparing: null, minPair: currentMinPair, currDist: currentMinDist, hlPoints: stripPoints.map(p => p.id),
        en: `<strong>Combine (Boundary Check):</strong> A closer pair might exist across the dividing line. We check points within a strip of width <strong>2d</strong>.`,
        ar: `<strong>الدمج (فحص الحدود):</strong> قد يوجد زوج أقرب عبر خط التقسيم. نفحص النقاط داخل شريط وهمي بعرض <strong>2d</strong>.`
      });

      var sortedPy = stripPoints.slice().sort((a, b) => a.y - b.y);
      if(sortedPy.length > 1) {
        steps.push({
          points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, width: stripWidth }, comparing: null, minPair: currentMinPair, currDist: currentMinDist, hlPoints: sortedPy.map(p => p.id),
          en: `Points in the strip are sorted by Y-coordinate. We only need to check each point against its next few neighbors.`,
          ar: `يتم ترتيب النقاط في الشريط حسب المحور الرأسي (Y). نحتاج فقط لفحص كل نقطة مع جيرانها القريبين جداً للأسفل.`
        });
      }

      var foundNewMin = false;
      for (var i = 0; i < sortedPy.length; i++) {
        var p1 = sortedPy[i];
        for (var j = i + 1; j < sortedPy.length && (sortedPy[j].y - p1.y) < currentMinDist; j++) {
          var p2 = sortedPy[j];
          var d = dist(p1, p2);
          
          steps.push({
            points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, width: stripWidth }, comparing: [p1.id, p2.id], minPair: currentMinPair, currDist: d, hlPoints: sortedPy.map(p => p.id),
            en: `Checking pair across boundary. Distance = <strong>${d.toFixed(1)}</strong>.`,
            ar: `فحص زوج من النقاط عبر الحدود. المسافة = <strong><span dir="ltr">${d.toFixed(1)}</span></strong>.`
          });

          if (d < currentMinDist) {
            currentMinDist = d;
            currentMinPair = [p1.id, p2.id];
            foundNewMin = true;
            
            steps.push({
              points: sortedPx.slice(), divLineX: midX, stripRect: { x: stripX, width: stripWidth }, comparing: null, minPair: currentMinPair, currDist: currentMinDist, hlPoints: sortedPy.map(p => p.id),
              en: `<strong>New Minimum!</strong> Found a closer pair across the boundary. <strong>d</strong> is updated to <strong>${d.toFixed(1)}</strong>.`,
              ar: `<strong>حد أدنى جديد!</strong> وجدنا زوجاً أقرب يعبر الحدود. تم تحديث <strong>d</strong> لتصبح <strong><span dir="ltr">${d.toFixed(1)}</span></strong>.`
            });
          }
        }
      }
      
      steps.push({
        points: sortedPx.slice(), divLineX: null, stripRect: null, comparing: null, minPair: currentMinPair, currDist: currentMinDist, hlPoints: currentMinPair,
        en: `<strong>Algorithm Complete!</strong> The absolute closest pair has been found with a distance of <strong>${currentMinDist.toFixed(1)}</strong>.`,
        ar: `<strong>اكتملت الخوارزمية!</strong> تم إيجاد أقرب زوج من النقاط بمسافة نهائية قدرها <strong><span dir="ltr">${currentMinDist.toFixed(1)}</span></strong>.`
      });
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      uiElements.points = {};

      // 1. الأنماط (Patterns) للشريط الوهمي
      let defs = makeSVG('defs', {});
      defs.innerHTML = `
        <pattern id="w5-strip-pattern" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--algo-compare)" stroke-width="2" opacity="0.25" />
        </pattern>
      `;
      svgEl.appendChild(defs);

      // 2. العناصر الخلفية (الشريط وخط التقسيم)
      uiElements.stripRect = makeSVG('rect', { y: 0, height: SVG_H, fill: 'url(#w5-strip-pattern)', opacity: 0 });
      uiElements.divLine = makeSVG('line', { y1: 0, y2: SVG_H, stroke: 'var(--algo-active)', 'stroke-width': 2, 'stroke-dasharray': '8,6', opacity: 0 });
      
      svgEl.appendChild(uiElements.stripRect);
      svgEl.appendChild(uiElements.divLine);

      // 3. خطوط المسافات
      uiElements.bestLine = makeSVG('line', { stroke: 'var(--algo-sorted)', 'stroke-width': 4, opacity: 0 });
      uiElements.compLine = makeSVG('line', { stroke: 'var(--algo-compare)', 'stroke-width': 3, 'stroke-dasharray': '6,4', opacity: 0 });
      
      svgEl.appendChild(uiElements.bestLine);
      svgEl.appendChild(uiElements.compLine);

      // 4. النقاط
      let nodesGroup = makeSVG('g', {});
      basePoints.forEach(p => {
        let g = makeSVG('g', { 'transform-origin': `${p.x}px ${p.y}px` });
        
        let circ = makeSVG('circle', { cx: p.x, cy: p.y, r: RADIUS, fill: 'var(--brand-500)', stroke: 'var(--algo-canvas-bg)', 'stroke-width': 2 });
        
        let lblBg = makeSVG('rect', { x: p.x + 8, y: p.y - 10, width: 24, height: 20, rx: 4, fill: 'var(--algo-canvas-bg)', opacity: 0.8 });
        let lblTxt = makeSVG('text', { x: p.x + 20, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--text-secondary)', 'font-family': "'JetBrains Mono', monospace", 'font-weight': 'bold', 'font-size': '12px' });
        lblTxt.textContent = `P${p.id}`;

        g.appendChild(circ);
        g.appendChild(lblBg);
        g.appendChild(lblTxt);
        nodesGroup.appendChild(g);

        uiElements.points[p.id] = { g, circ, lblTxt, p };
      });
      svgEl.appendChild(nodesGroup);

      // 5. شارة المسافة العائمة (Distance Badge)
      uiElements.distBadge.g = makeSVG('g', { opacity: 0 });
      uiElements.distBadge.bg = makeSVG('rect', { width: 54, height: 24, rx: 6, fill: 'var(--algo-compare)' });
      uiElements.distBadge.txt = makeSVG('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: '#ffffff', 'font-family': "'JetBrains Mono', monospace", 'font-weight': '800', 'font-size': '13px' });
      
      uiElements.distBadge.g.appendChild(uiElements.distBadge.bg);
      uiElements.distBadge.g.appendChild(uiElements.distBadge.txt);
      svgEl.appendChild(uiElements.distBadge.g);

      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // 1. تحديث الخط العمودي والشريط
      if (s.divLineX !== null) {
        uiElements.divLine.setAttribute('x1', s.divLineX);
        uiElements.divLine.setAttribute('x2', s.divLineX);
        uiElements.divLine.style.opacity = '1';
      } else {
        uiElements.divLine.style.opacity = '0';
      }

      if (s.stripRect !== null) {
        uiElements.stripRect.setAttribute('x', s.stripRect.x);
        uiElements.stripRect.setAttribute('width', s.stripRect.width);
        uiElements.stripRect.style.opacity = '1';
      } else {
        uiElements.stripRect.style.opacity = '0';
      }

      // 2. تحديث خط المقارنة المؤقت والشارة
      if (s.comparing) {
        let p1 = basePoints.find(p => p.id === s.comparing[0]);
        let p2 = basePoints.find(p => p.id === s.comparing[1]);
        
        uiElements.compLine.setAttribute('x1', p1.x); uiElements.compLine.setAttribute('y1', p1.y);
        uiElements.compLine.setAttribute('x2', p2.x); uiElements.compLine.setAttribute('y2', p2.y);
        uiElements.compLine.style.opacity = '1';

        let mx = (p1.x + p2.x) / 2;
        let my = (p1.y + p2.y) / 2;
        
        uiElements.distBadge.bg.setAttribute('fill', 'var(--algo-compare)');
        uiElements.distBadge.bg.setAttribute('x', mx - 27);
        uiElements.distBadge.bg.setAttribute('y', my - 30);
        uiElements.distBadge.txt.setAttribute('x', mx);
        uiElements.distBadge.txt.setAttribute('y', my - 18);
        uiElements.distBadge.txt.textContent = s.currDist.toFixed(1);
        
        uiElements.distBadge.g.style.opacity = '1';
        uiElements.distBadge.g.style.transform = `scale(1.1)`;
        uiElements.distBadge.g.style.transformOrigin = `${mx}px ${my - 18}px`;

      } else {
        uiElements.compLine.style.opacity = '0';
        uiElements.distBadge.g.style.opacity = '0';
      }

      // 3. تحديث خط أفضل زوج (Best Pair)
      if (s.minPair) {
        let p1 = basePoints.find(p => p.id === s.minPair[0]);
        let p2 = basePoints.find(p => p.id === s.minPair[1]);
        
        uiElements.bestLine.setAttribute('x1', p1.x); uiElements.bestLine.setAttribute('y1', p1.y);
        uiElements.bestLine.setAttribute('x2', p2.x); uiElements.bestLine.setAttribute('y2', p2.y);
        
        // إذا كنا نقارن، نبهت خط الـ Best قليلاً للتركيز على المقارنة
        uiElements.bestLine.style.opacity = s.comparing ? '0.4' : '1';
        
        // إذا لم نكن نقارن، نضع شارة المسافة على الخط الأفضل
        if (!s.comparing) {
          let mx = (p1.x + p2.x) / 2;
          let my = (p1.y + p2.y) / 2;
          uiElements.distBadge.bg.setAttribute('fill', 'var(--algo-sorted)');
          uiElements.distBadge.bg.setAttribute('x', mx - 27);
          uiElements.distBadge.bg.setAttribute('y', my - 30);
          uiElements.distBadge.txt.setAttribute('x', mx);
          uiElements.distBadge.txt.setAttribute('y', my - 18);
          uiElements.distBadge.txt.textContent = s.currDist.toFixed(1);
          uiElements.distBadge.g.style.opacity = '1';
          uiElements.distBadge.g.style.transform = `scale(1)`;
        }
      } else {
        uiElements.bestLine.style.opacity = '0';
      }

      // 4. تحديث النقاط (بهتان وتلوين)
      Object.keys(uiElements.points).forEach(id => {
        let ui = uiElements.points[id];
        let nId = parseInt(id);
        
        let isHl = s.hlPoints.length === 0 || s.hlPoints.includes(nId);
        let isComp = s.comparing && (s.comparing[0] === nId || s.comparing[1] === nId);
        let isBest = s.minPair && (s.minPair[0] === nId || s.minPair[1] === nId);

        let fill = 'var(--bg-elevated)';
        let scale = 'scale(1)';
        let opacity = isHl ? '1' : '0.2'; // Fade pattern

        if (isComp) {
          fill = 'var(--algo-compare)';
          scale = 'scale(1.5)';
          opacity = '1';
          ui.g.parentNode.appendChild(ui.g); // Bring to front
        } else if (isBest) {
          fill = 'var(--algo-sorted)';
          scale = 'scale(1.4)';
          opacity = '1';
          ui.g.parentNode.appendChild(ui.g); // Bring to front
        } else if (isHl) {
          fill = 'var(--brand-500)';
        }

        ui.circ.setAttribute('fill', fill);
        ui.g.style.transform = scale;
        ui.g.style.opacity = opacity;
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
    
    // Reset يعيد توليد كل شيء ببيانات جديدة
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