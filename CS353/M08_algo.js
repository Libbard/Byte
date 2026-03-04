// M08_algo.js — Interactive algorithm widgets
// Generated: 2026-03-04T06:58:14
// Diagrams: 1/1

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
window._algoTitles[1] = { en: 'Horspool Shift Cases', ar: 'حالات الإزاحة في خوارزمية هورسبول' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية متجاوبة بأبعاد 2:1
      '<div class="algo-canvas" id="w1-canvas-container" style="width:100%; max-width:750px; aspect-ratio: 2 / 1; margin: 0 auto; display: flex; justify-content: center; align-items: center; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:visible;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 750 375" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-leg-mis"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-leg-align"></span></span>' +
      '</div>' +
    '</div>';
 
    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w1-exp');
    var counter = container.querySelector('[data-algo-counter]');
    var svgEl   = container.querySelector('#w1-svg');
 
    var steps = [], cur = 0, playing = false, interval = null;
    
    // متغيرات الـ SVG لتحديثها برمجياً بدون إعادة خلقها
    var isInitialized = false;
    var textRects = [], textLabels = [];
    var patRects = [], patLabels = [], patGroups = [];
    var arrowLine, arrowLabel, arrowGroup;
 
    // الثوابت الهندسية
    var boxSize = 45;
    var gap = 8;
    var stepX = boxSize + gap;
    var totalW = (12 * boxSize) + (11 * gap);
    var startX = (750 - totalW) / 2; // توسيط دقيق
    var textY = 90;
    var patY = 170;
    var arrowY = 270;
 
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
 
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-leg-mis"]').textContent = _AL.exp('Mismatched / Check Char', 'حرف الفحص / عدم تطابق');
      container.querySelector('[data-algo-text="w1-leg-align"]').textContent = _AL.exp('Alignment Target', 'هدف المحاذاة');
      
      var s = steps[cur];
      if (s && s.shiftArrow && arrowLabel) {
        arrowLabel.textContent = _AL.lang() === 'ar' ? s.shiftArrow.ar : s.shiftArrow.en;
      }
    }
 
    function generateSteps() {
      steps = [
        {
          text: ['T','E','X','T',' ','S','T','R','I','N','G',' '],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 0, highlightText: [], highlightPat: [], shiftArrow: null,
          en: 'Horspool\'s algorithm shifts the pattern based on the text character currently aligned with the last pattern character.',
          ar: 'تقوم خوارزمية هورسبول بإزاحة النمط بناءً على حرف النص المحاذي لآخر حرف في النمط.'
        },
        {
          text: ['X','Y','Z','W','V','S','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 0, highlightText: [5], highlightPat: [5],
          shiftArrow: { to: 6, en: 'Shift = 6', ar: 'إزاحة = 6' },
          en: '<strong>Case 1:</strong> The character (S) is completely missing from the pattern. We safely shift by the full pattern length (m=6).',
          ar: '<strong>الحالة 1:</strong> الحرف (S) غير موجود إطلاقاً في النمط. يمكننا الإزاحة بأمان بطول النمط كاملاً (m=6).'
        },
        {
          text: ['X','Y','Z','W','V','S','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 6, highlightText: [], highlightPat: [], shiftArrow: null,
          en: 'The pattern is shifted completely past the mismatched character.',
          ar: 'تمت إزاحة النمط بالكامل متجاوزاً الحرف غير المتطابق.'
        },
        {
          text: ['X','Y','Z','W','V','B','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 0, highlightText: [5], highlightPat: [3, 5],
          shiftArrow: { to: 2, en: 'Shift = 2', ar: 'إزاحة = 2' },
          en: '<strong>Case 2:</strong> The character (B) is in the pattern. We align the text with the <em>rightmost</em> B in the pattern (excluding the last char). Shift = 2.',
          ar: '<strong>الحالة 2:</strong> الحرف (B) موجود في النمط. نقوم بمحاذاته مع أقصى حرف B يمين النمط (باستثناء الحرف الأخير). الإزاحة = 2.'
        },
        {
          text: ['X','Y','Z','W','V','B','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 2, highlightText: [5], highlightPat: [3], shiftArrow: null,
          en: 'The rightmost B in the pattern is now aligned with the B in the text.',
          ar: 'أصبح حرف B الأيمن في النمط محاذياً لحرف B في النص.'
        },
        {
          text: ['X','Y','Z','W','V','Q','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','Q'], // تم تغيير النمط خصيصاً لهذه الحالة
          patOffset: 0, highlightText: [5], highlightPat: [5],
          shiftArrow: { to: 6, en: 'Shift = 6', ar: 'إزاحة = 6' },
          en: '<strong>Case 3:</strong> The character (Q) is the last pattern character, but exists nowhere else. Shift by full length (m=6).',
          ar: '<strong>الحالة 3:</strong> الحرف (Q) هو الحرف الأخير في النمط ولا يوجد في أي مكان آخر فيه. إزاحة بالطول الكامل (m=6).'
        },
        {
          text: ['X','Y','Z','W','V','Q','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','Q'],
          patOffset: 6, highlightText: [], highlightPat: [], shiftArrow: null,
          en: 'The pattern shifts completely past the matched last character to find the next potential match.',
          ar: 'ينزاح النمط بالكامل متجاوزاً الحرف الأخير المتطابق للبحث عن التطابق التالي.'
        },
        {
          text: ['X','Y','Z','W','V','R','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 0, highlightText: [5], highlightPat: [2, 5],
          shiftArrow: { to: 3, en: 'Shift = 3', ar: 'إزاحة = 3' },
          en: '<strong>Case 4:</strong> The character (R) is the last character, AND exists elsewhere. Align the next rightmost R. Shift = 3.',
          ar: '<strong>الحالة 4:</strong> الحرف (R) هو الحرف الأخير وموجود أيضاً في مكان آخر بالنمط. نحاذي أقصى R تالية. الإزاحة = 3.'
        },
        {
          text: ['X','Y','Z','W','V','R','L','M','N','O','P','Q'],
          pat:  ['B','A','R','B','E','R'],
          patOffset: 3, highlightText: [5], highlightPat: [2], shiftArrow: null,
          en: 'The rightmost R in the first m-1 characters is now correctly aligned with the text.',
          ar: 'تمت محاذاة أقصى R (في أول m-1 حرف) بشكل صحيح مع النص.'
        }
      ];
    }
 
    function buildSVG() {
      var ns = 'http://www.w3.org/2000/svg';
      
      // تعريف رأس السهم
      var defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = `<marker id="w1-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--algo-active)" /></marker>`;
      svgEl.appendChild(defs);
 
      // بناء مربعات النص (Text Array)
      for(let i=0; i<12; i++) {
        let g = document.createElementNS(ns, 'g');
        g.style.transition = 'opacity 0.4s ease';
        
        let r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', startX + i * stepX);
        r.setAttribute('y', textY);
        r.setAttribute('width', boxSize);
        r.setAttribute('height', boxSize);
        r.setAttribute('rx', 6);
        r.setAttribute('stroke-width', '2');
        r.style.transition = 'fill 0.3s ease, stroke 0.3s ease';
 
        let t = document.createElementNS(ns, 'text');
        t.setAttribute('x', startX + i * stepX + boxSize/2);
        t.setAttribute('y', textY + boxSize/2);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('dy', '.1em');
        t.setAttribute('font-family', "'JetBrains Mono', monospace");
        t.setAttribute('font-size', '20px');
        t.setAttribute('font-weight', '800');
        t.style.transition = 'fill 0.3s ease';
 
        g.appendChild(r); g.appendChild(t);
        svgEl.appendChild(g);
        textRects.push(r); textLabels.push(t);
      }
 
      // بناء مربعات النمط (Pattern Array)
      for(let i=0; i<6; i++) {
        let g = document.createElementNS(ns, 'g');
        g.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'; // حركة انسيابية للإزاحة
        
        let r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', startX + i * stepX);
        r.setAttribute('y', patY);
        r.setAttribute('width', boxSize);
        r.setAttribute('height', boxSize);
        r.setAttribute('rx', 6);
        r.setAttribute('stroke-width', '2');
        r.style.transition = 'fill 0.3s ease, stroke 0.3s ease';
 
        let t = document.createElementNS(ns, 'text');
        t.setAttribute('x', startX + i * stepX + boxSize/2);
        t.setAttribute('y', patY + boxSize/2);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('dy', '.1em');
        t.setAttribute('font-family', "'JetBrains Mono', monospace");
        t.setAttribute('font-size', '20px');
        t.setAttribute('font-weight', '800');
        t.style.transition = 'fill 0.3s ease';
 
        g.appendChild(r); g.appendChild(t);
        svgEl.appendChild(g);
        patGroups.push(g); patRects.push(r); patLabels.push(t);
      }
 
      // بناء سهم الإزاحة
      arrowGroup = document.createElementNS(ns, 'g');
      arrowGroup.style.transition = 'opacity 0.4s ease';
      
      arrowLine = document.createElementNS(ns, 'line');
      arrowLine.setAttribute('y1', arrowY);
      arrowLine.setAttribute('y2', arrowY);
      arrowLine.setAttribute('stroke', 'var(--algo-active)');
      arrowLine.setAttribute('stroke-width', '3');
      arrowLine.setAttribute('stroke-dasharray', '6,4');
      arrowLine.setAttribute('marker-end', 'url(#w1-arrowhead)');
      arrowLine.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      
      arrowLabel = document.createElementNS(ns, 'text');
      arrowLabel.setAttribute('y', arrowY + 25);
      arrowLabel.setAttribute('fill', 'var(--algo-active)');
      arrowLabel.setAttribute('text-anchor', 'middle');
      arrowLabel.setAttribute('dominant-baseline', 'middle');
      arrowLabel.setAttribute('font-family', "'Cairo', 'Inter', sans-serif");
      arrowLabel.setAttribute('font-size', '16px');
      arrowLabel.setAttribute('font-weight', '800');
      arrowLabel.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
 
      arrowGroup.appendChild(arrowLine);
      arrowGroup.appendChild(arrowLabel);
      svgEl.appendChild(arrowGroup);
      
      isInitialized = true;
    }
 
    function render() {
      if (!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
 
      // تحديث النص الأساسي
      for(let i=0; i<12; i++) {
        textLabels[i].textContent = s.text[i];
        
        if (s.highlightText.includes(i)) {
          textRects[i].setAttribute('fill', 'var(--algo-compare)');
          textRects[i].setAttribute('stroke', '#ffffff');
          textLabels[i].setAttribute('fill', '#ffffff');
        } else {
          textRects[i].setAttribute('fill', 'var(--bg-elevated)');
          textRects[i].setAttribute('stroke', 'var(--border-color)');
          textLabels[i].setAttribute('fill', 'var(--text-primary)');
        }
        
        // بهتان الأحرف خارج نافذة النمط للتركيز
        if (i < s.patOffset || i >= s.patOffset + 6) {
          textRects[i].parentNode.style.opacity = '0.3';
        } else {
          textRects[i].parentNode.style.opacity = '1';
        }
      }
 
      // تحديث النمط (إزاحة وتلوين)
      var patShiftX = s.patOffset * stepX;
      for(let i=0; i<6; i++) {
        patLabels[i].textContent = s.pat[i];
        patGroups[i].style.transform = `translateX(${patShiftX}px)`;
 
        if (s.highlightPat.includes(i)) {
          // الحرف الأخير نقارنه (أحمر)، الحرف الداخلي نحاذيه (أزرق/بنفسجي)
          let color = (i === 5 && s.highlightText.length > 0) ? 'var(--algo-compare)' : 'var(--algo-swap)';
          patRects[i].setAttribute('fill', color);
          patRects[i].setAttribute('stroke', '#ffffff');
          patLabels[i].setAttribute('fill', '#ffffff');
        } else {
          patRects[i].setAttribute('fill', 'var(--brand-500)');
          patRects[i].setAttribute('stroke', 'var(--algo-border)');
          patLabels[i].setAttribute('fill', '#ffffff');
        }
      }
 
      // تحديث سهم الإزاحة
      if (s.shiftArrow) {
        arrowGroup.style.opacity = '1';
        // حساب الانطلاق من مركز آخر حرف في النمط الحالي إلى مكانه الجديد
        let startArrowX = startX + (s.patOffset * stepX) + (5 * stepX) + boxSize/2;
        let endArrowX = startArrowX + (s.shiftArrow.to * stepX);
 
        arrowLine.setAttribute('x1', startArrowX);
        arrowLine.setAttribute('x2', endArrowX - 12); // ترك مسافة لرأس السهم
        arrowLabel.setAttribute('x', (startArrowX + endArrowX) / 2);
      } else {
        arrowGroup.style.opacity = '0';
      }
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
 
    container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function() { stopPlay(); if(cur > 0) { cur--; render(); } });
    container.querySelector('[data-algo-btn="step"]').addEventListener('click', function() { stopPlay(); if(cur < steps.length - 1) { cur++; render(); } });
    container.querySelector('[data-algo-btn="play"]').addEventListener('click', function() { playing ? stopPlay() : startPlay(); });
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function() { stopPlay(); generateSteps(); cur = 0; render(); });
    
    container.querySelector('.algo-speed input').addEventListener('input', function() {
      if(playing) { 
        clearInterval(interval); 
        interval = setInterval(function() { if(cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay()); 
      }
    });
 
    window._algoRerenders[1] = render;
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