// M02_algo.js — Interactive algorithm widgets
// Generated: 2026-03-03T16:48:20
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
window._algoTitles[1] = { en: 'Asymptotic Notations', ar: 'الرموز التقاربية' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp"></div>' +
      '<div class="algo-canvas" id="w1-canvas" style="width:100%; height:400px; overflow:hidden;"></div>' +
      '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--brand-500);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-tn"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-compare);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-c1gn"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-swap);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-c2gn"></span></span>' +
        '<span><span style="display:inline-block;width:12px;height:12px;background:var(--algo-active);border-radius:3px;margin-right:4px;"></span><span data-algo-text="w1-n0"></span></span>' +
      '</div>' +
    '</div>';
  
    var btnPlay  = container.querySelector('[data-algo-btn="play"]');
    var expEl    = container.querySelector('#w1-exp');
    var canvasEl = container.querySelector('#w1-canvas');
    var counter  = container.querySelector('[data-algo-counter]');
    var steps = [], cur = 0, playing = false, interval = null;
  
    // SVG constants
    var SVG_WIDTH = 800;
    var SVG_HEIGHT = 400;
    var PADDING_LEFT = 70;
    var PADDING_RIGHT = 30;
    var PADDING_TOP = 40;
    var PADDING_BOTTOM = 50;
    var CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    var CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  
    var MAX_N = 50; // Max input size
    var N0 = 15;    // Threshold for n
  
    // Functions for visualization
    function t_n(n) { return 0.5 * n * n + 10 * n + 50; } // Actual running time
    function g_n(n) { return n * n; }                    // Bounding function
    var C1 = 1.5; // Constant for upper bound
    var C2 = 0.2; // Constant for lower bound
    function c1_g_n(n) { return C1 * g_n(n); }
    function c2_g_n(n) { return C2 * g_n(n); }
  
    var MAX_Y_VALUE = Math.max(t_n(MAX_N), c1_g_n(MAX_N)) * 1.05; // Max Y value for scaling
  
    // Scaling functions
    function scaleX(n) { return PADDING_LEFT + (n / MAX_N) * CHART_WIDTH; }
    function scaleY(val) { return PADDING_TOP + CHART_HEIGHT - (val / MAX_Y_VALUE) * CHART_HEIGHT; }
  
    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }
  
    function updateLabels() {
      container.querySelector('[data-algo-text="w1-tn"]').textContent    = _AL.lang()==='ar' ? 'T(n): وقت التشغيل الفعلي' : 'T(n): Actual Running Time';
      container.querySelector('[data-algo-text="w1-c1gn"]').textContent = _AL.lang()==='ar' ? 'c1*g(n): الحد الأعلى (O-notation)' : 'c1*g(n): Upper Bound (O-notation)';
      container.querySelector('[data-algo-text="w1-c2gn"]').textContent = _AL.lang()==='ar' ? 'c2*g(n): الحد الأدنى (Omega-notation)' : 'c2*g(n): Lower Bound (Omega-notation)';
      container.querySelector('[data-algo-text="w1-n0"]').textContent   = _AL.lang()==='ar' ? 'n0: نقطة البداية' : 'n0: Threshold';
    }
  
    function generateSteps() {
      steps = [];
      // Step 0: Initial state - only axes
      steps.push({
        plot_tn: false, plot_c1gn: false, plot_c2gn: false, show_n0: false,
        en: 'The graph shows axes for input size (n) and running time.',
        ar: 'الرسم البياني يوضح المحاور لحجم المدخلات (n) ووقت التشغيل.'
      });
      // Step 1: Plot T(n)
      steps.push({
        plot_tn: true, plot_c1gn: false, plot_c2gn: false, show_n0: false,
        en: 'This curve represents the actual running time of an algorithm, T(n).',
        ar: 'يمثل هذا المنحنى وقت التشغيل الفعلي للخوارزمية، T(n).'
      });
      // Step 2: Plot c1*g(n)
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: false, show_n0: false,
        en: 'We introduce a bounding function g(n) and a constant c1. The curve c1*g(n) serves as an upper bound.',
        ar: 'نقدم دالة تقييد g(n) وثابت c1. يعمل منحنى c1*g(n) كحد أعلى.'
      });
      // Step 3: Show n0 and explain Big-O
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: false, show_n0: true,
        en: 'For n greater than or equal to n0, T(n) is always below c1*g(n). This is Big-O notation (O(g(n))), representing the worst-case efficiency.',
        ar: 'بالنسبة لـ n أكبر من أو يساوي n0، يكون T(n) دائمًا أقل من c1*g(n). هذا هو رمز O الكبير (O(g(n)))، ويمثل كفاءة أسوأ حالة.'
      });
      // Step 4: Plot c2*g(n)
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: true, show_n0: true,
        en: 'Similarly, we find a constant c2 such that c2*g(n) serves as a lower bound for T(n).',
        ar: 'وبالمثل، نجد ثابتًا c2 بحيث يعمل c2*g(n) كحد أدنى لـ T(n).'
      });
      // Step 5: Explain Big-Omega
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: true, show_n0: true,
        en: 'For n greater than or equal to n0, T(n) is always above c2*g(n). This is Big-Omega notation (Ω(g(n))), representing the best-case efficiency.',
        ar: 'بالنسبة لـ n أكبر من أو يساوي n0، يكون T(n) دائمًا أعلى من c2*g(n). هذا هو رمز أوميغا الكبير (Ω(g(n)))، ويمثل كفاءة أفضل حالة.'
      });
      // Step 6: Explain Big-Theta
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: true, show_n0: true,
        en: 'When T(n) is bounded both above and below by constant multiples of g(n), we use Big-Theta notation (Θ(g(n))).',
        ar: 'عندما يكون T(n) مقيدًا من الأعلى والأسفل بمضاعفات ثابتة لـ g(n)، نستخدم رمز ثيتا الكبير (Θ(g(n))).'
      });
      // Step 7: Final state
      steps.push({
        plot_tn: true, plot_c1gn: true, plot_c2gn: true, show_n0: true,
        en: 'Big-Theta notation describes the tight bound, indicating that the algorithm\'s running time grows at the same rate as g(n).',
        ar: 'يصف رمز ثيتا الكبير الحد الضيق، مما يشير إلى أن وقت تشغيل الخوارزمية ينمو بنفس معدل g(n).'
      });
    }
  
    function render() {
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);
  
      var svgContent = '<svg viewBox="0 0 ' + SVG_WIDTH + ' ' + SVG_HEIGHT + '" style="background:var(--algo-canvas-bg);">';
  
      // Axes
      svgContent += '<line x1="' + PADDING_LEFT + '" y1="' + scaleY(0) + '" x2="' + (SVG_WIDTH - PADDING_RIGHT) + '" y2="' + scaleY(0) + '" stroke="var(--algo-text)" stroke-width="2"/>'; // X-axis
      svgContent += '<line x1="' + PADDING_LEFT + '" y1="' + PADDING_TOP + '" x2="' + PADDING_LEFT + '" y2="' + scaleY(0) + '" stroke="var(--algo-text)" stroke-width="2"/>'; // Y-axis
  
      // Axis labels
      svgContent += '<text x="' + (SVG_WIDTH / 2) + '" y="' + (SVG_HEIGHT - 10) + '" text-anchor="middle" fill="var(--algo-text)" font-size="16">' + _AL.exp('n (Input Size)', 'n (حجم المدخلات)') + '</text>';
      svgContent += '<text x="' + (PADDING_LEFT - 30) + '" y="' + (SVG_HEIGHT / 2) + '" text-anchor="middle" transform="rotate(-90 ' + (PADDING_LEFT - 30) + ' ' + (SVG_HEIGHT / 2) + ')" fill="var(--algo-text)" font-size="16">' + _AL.exp('Running Time', 'وقت التشغيل') + '</text>';
  
      // X-axis ticks and labels
      for (var i = 0; i <= MAX_N; i += 10) {
        var x = scaleX(i);
        svgContent += '<line x1="' + x + '" y1="' + scaleY(0) + '" x2="' + x + '" y2="' + (scaleY(0) + 5) + '" stroke="var(--algo-muted)" stroke-width="1"/>';
        svgContent += '<text x="' + x + '" y="' + (scaleY(0) + 20) + '" text-anchor="middle" fill="var(--algo-muted)" font-size="12">' + i + '</text>';
      }
      // Y-axis ticks and labels
      for (var i = 0; i <= MAX_Y_VALUE; i += 500) {
        var y = scaleY(i);
        svgContent += '<line x1="' + PADDING_LEFT + '" y1="' + y + '" x2="' + (PADDING_LEFT - 5) + '" y2="' + y + '" stroke="var(--algo-muted)" stroke-width="1"/>';
        svgContent += '<text x="' + (PADDING_LEFT - 10) + '" y="' + (y + 5) + '" text-anchor="end" fill="var(--algo-muted)" font-size="12">' + i + '</text>';
      }
  
      // Plot T(n)
      if (s.plot_tn) {
        var path_tn = 'M';
        for (var n = 0; n <= MAX_N; n++) {
          path_tn += scaleX(n) + ',' + scaleY(t_n(n)) + ' ';
        }
        svgContent += '<path d="' + path_tn + '" fill="none" stroke="var(--brand-500)" stroke-width="3"/>';
        svgContent += '<text x="' + scaleX(MAX_N) + '" y="' + (scaleY(t_n(MAX_N)) - 10) + '" fill="var(--brand-500)" font-weight="bold" font-size="14">T(n)</text>';
      }
  
      // Plot c1*g(n)
      if (s.plot_c1gn) {
        var path_c1gn = 'M';
        for (var n = 0; n <= MAX_N; n++) {
          path_c1gn += scaleX(n) + ',' + scaleY(c1_g_n(n)) + ' ';
        }
        svgContent += '<path d="' + path_c1gn + '" fill="none" stroke="var(--algo-compare)" stroke-width="3"/>';
        svgContent += '<text x="' + scaleX(MAX_N) + '" y="' + (scaleY(c1_g_n(MAX_N)) - 10) + '" fill="var(--algo-compare)" font-weight="bold" font-size="14">c1*g(n)</text>';
      }
  
      // Plot c2*g(n)
      if (s.plot_c2gn) {
        var path_c2gn = 'M';
        for (var n = 0; n <= MAX_N; n++) {
          path_c2gn += scaleX(n) + ',' + scaleY(c2_g_n(n)) + ' ';
        }
        svgContent += '<path d="' + path_c2gn + '" fill="none" stroke="var(--algo-swap)" stroke-width="3"/>';
        svgContent += '<text x="' + scaleX(MAX_N) + '" y="' + (scaleY(c2_g_n(MAX_N)) + 20) + '" fill="var(--algo-swap)" font-weight="bold" font-size="14">c2*g(n)</text>';
      }
  
      // Show n0 line
      if (s.show_n0) {
        var x_n0 = scaleX(N0);
        svgContent += '<line x1="' + x_n0 + '" y1="' + PADDING_TOP + '" x2="' + x_n0 + '" y2="' + scaleY(0) + '" stroke="var(--algo-active)" stroke-width="2" stroke-dasharray="5,5"/>';
        svgContent += '<text x="' + x_n0 + '" y="' + (scaleY(0) + 35) + '" text-anchor="middle" fill="var(--algo-active)" font-weight="bold" font-size="14">n0</text>';
      }
  
      svgContent += '</svg>';
      canvasEl.innerHTML = svgContent;
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