// M02_algo.js - Interactive algorithm widgets
// Generated: 2023-10-25T12:00:00Z
// Diagrams: 1/1

window.AlgoWidgets = window.AlgoWidgets || {};

var _AL = {
  lang: function() { return document.documentElement.lang || 'ar'; },
  i18n: {
    prev:  { ar: 'السابق',     en: 'Prev'      },
    step:  { ar: 'التالي',     en: 'Next'      },
    play:  { ar: '▶ تشغيل',   en: '▶ Play'    },
    pause: { ar: '❚❚ إيقاف',  en: '❚❚ Pause'  },
    reset: { ar: '↺ إعادة',   en: '↺ Reset'   },
    stepN: { ar: 'الخطوة',    en: 'Step'      },
    fast:  { ar: 'سريع',      en: 'Fast'      },
    slow:  { ar: 'بطيء',      en: 'Slow'      }
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
      '<span class="step-counter" data-algo-counter>' + this.stepLabel(0,0) + '</span>' +
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

// WIDGET 1: Asymptotic Notations
window._algoTitles[1] = { en: 'Asymptotic Notations', ar: 'الرموز التقاربية' };
window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(1) + _AL.toolbar(1) +
    '<div class="algo-explanation" id="w1-exp"></div>' +
    '<div class="algo-canvas" id="w1-canvas" style="height:320px; position:relative; overflow:hidden;">' +
      '<svg viewBox="0 0 600 320" style="width:100%; height:100%; fill:none; stroke-width:3; font-family:sans-serif;">' +
        '<defs>' +
          '<marker id="w1-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-muted)"/></marker>' +
        '</defs>' +
        // Axes
        '<path d="M 50 280 L 550 280" stroke="var(--algo-muted)" stroke-width="2" marker-end="url(#w1-arr)"/>' +
        '<path d="M 50 280 L 50 40" stroke="var(--algo-muted)" stroke-width="2" marker-end="url(#w1-arr)"/>' +
        '<text x="560" y="285" fill="var(--algo-muted)" font-size="14" font-weight="bold">n</text>' +
        '<text id="w1-time-lbl" x="40" y="30" fill="var(--algo-muted)" font-size="14" font-weight="bold" text-anchor="middle">Time</text>' +

        // n0 line
        '<path id="w1-n0-line" d="M 220 280 L 220 40" stroke="var(--algo-muted)" stroke-width="2" stroke-dasharray="6,4" style="transition: opacity 0.3s;"/>' +
        '<text id="w1-n0-lbl" x="220" y="300" fill="var(--algo-text)" font-size="14" text-anchor="middle" font-style="italic" style="transition: opacity 0.3s;">n<tspan dy="5" font-size="10">0</tspan></text>' +

        // t(n)
        '<path d="M 50 260 Q 250 220 500 120" stroke="var(--algo-text)"/>' +
        '<text x="510" y="120" fill="var(--algo-text)" font-size="16" font-style="italic" font-weight="bold">t(n)</text>' +

        // Upper bound c1 g(n)
        '<path id="w1-upper" d="M 50 290 Q 250 160 450 50" stroke="var(--algo-compare)" style="transition: opacity 0.3s;"/>' +
        '<text id="w1-upper-lbl" x="460" y="50" fill="var(--algo-compare)" font-size="16" font-style="italic" font-weight="bold" style="transition: opacity 0.3s;">c<tspan dy="5" font-size="10">1</tspan><tspan dy="-5"> g(n)</tspan></text>' +

        // Lower bound c2 g(n)
        '<path id="w1-lower" d="M 50 150 Q 300 320 550 220" stroke="var(--algo-swap)" style="transition: opacity 0.3s;"/>' +
        '<text id="w1-lower-lbl" x="560" y="220" fill="var(--algo-swap)" font-size="16" font-style="italic" font-weight="bold" style="transition: opacity 0.3s;">c<tspan dy="5" font-size="10">2</tspan><tspan dy="-5"> g(n)</tspan></text>' +
      '</svg>' +
    '</div>' +
    '<div class="algo-legend" style="display:flex;justify-content:center;gap:15px;margin-top:12px;font-size:0.9em;">' +
      '<span><span style="display:inline-block;width:20px;height:3px;background:var(--algo-text);vertical-align:middle;margin-right:5px;"></span><span data-algo-text="w1-tn"></span></span>' +
      '<span><span style="display:inline-block;width:20px;height:3px;background:var(--algo-compare);vertical-align:middle;margin-right:5px;"></span><span data-algo-text="w1-up"></span></span>' +
      '<span><span style="display:inline-block;width:20px;height:3px;background:var(--algo-swap);vertical-align:middle;margin-right:5px;"></span><span data-algo-text="w1-lo"></span></span>' +
    '</div>' +
  '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl   = container.querySelector('#w1-exp');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('[data-algo-text="w1-tn"]').textContent = ar ? 'وقت التشغيل t(n)' : 'Running Time t(n)';
    container.querySelector('[data-algo-text="w1-up"]').textContent = ar ? 'الحد الأعلى (O)' : 'Upper Bound (O)';
    container.querySelector('[data-algo-text="w1-lo"]').textContent = ar ? 'الحد الأدنى (Ω)' : 'Lower Bound (Ω)';
    container.querySelector('#w1-time-lbl').textContent = ar ? 'الوقت' : 'Time';
  }

  function generateSteps() {
    steps = [
      {
        showUpper: false, showLower: false, showN0: false,
        en: "Let <b>t(n)</b> be the actual running time of our algorithm as the input size <b>n</b> grows.",
        ar: "لتكن <b>t(n)</b> هي وقت التشغيل الفعلي لخوارزميتنا مع زيادة حجم المدخلات <b>n</b>."
      },
      {
        showUpper: true, showLower: false, showN0: true,
        en: "<b>Big-O (O)</b>: Provides an upper bound. <b>t(n) &le; c<sub>1</sub> &middot; g(n)</b> for all <b>n &ge; n<sub>0</sub></b>.",
        ar: "<b>Big-O (O)</b>: يوفر حداً أعلى. <b>t(n) &le; c<sub>1</sub> &middot; g(n)</b> لجميع <b>n &ge; n<sub>0</sub></b>."
      },
      {
        showUpper: false, showLower: true, showN0: true,
        en: "<b>Big-Omega (&Omega;)</b>: Provides a lower bound. <b>t(n) &ge; c<sub>2</sub> &middot; g(n)</b> for all <b>n &ge; n<sub>0</sub></b>.",
        ar: "<b>Big-Omega (&Omega;)</b>: يوفر حداً أدنى. <b>t(n) &ge; c<sub>2</sub> &middot; g(n)</b> لجميع <b>n &ge; n<sub>0</sub></b>."
      },
      {
        showUpper: true, showLower: true, showN0: true,
        en: "<b>Big-Theta (&Theta;)</b>: Provides a tight bound. <b>t(n)</b> is sandwiched between both bounds after <b>n<sub>0</sub></b>.",
        ar: "<b>Big-Theta (&Theta;)</b>: يوفر حداً محكماً. <b>t(n)</b> محصورة بين كلا الحدين بعد <b>n<sub>0</sub></b>."
      }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    container.querySelector('#w1-upper').style.opacity = s.showUpper ? '1' : '0';
    container.querySelector('#w1-upper-lbl').style.opacity = s.showUpper ? '1' : '0';

    container.querySelector('#w1-lower').style.opacity = s.showLower ? '1' : '0';
    container.querySelector('#w1-lower-lbl').style.opacity = s.showLower ? '1' : '0';

    container.querySelector('#w1-n0-line').style.opacity = s.showN0 ? '1' : '0';
    container.querySelector('#w1-n0-lbl').style.opacity = s.showN0 ? '1' : '0';
  }

  function startPlay() {
    playing = true; btnPlay.textContent = _AL.t('pause'); btnPlay.dataset.playing = '1';
    if(cur >= steps.length - 1) cur = 0;
    interval = setInterval(function(){ if(cur < steps.length - 1) { cur++; render(); } else stopPlay(); }, getDelay());
  }
  function stopPlay() {
    playing = false; clearInterval(interval); interval = null;
    btnPlay.textContent = _AL.t('play'); btnPlay.dataset.playing = '0';
  }

  container.querySelector('[data-algo-btn="prev"]').addEventListener('click', function(){ stopPlay(); if(cur > 0) { cur--; render(); } });
  container.querySelector('[data-algo-btn="step"]').addEventListener('click', function(){ stopPlay(); if(cur < steps.length - 1) { cur++; render(); } });
  container.querySelector('[data-algo-btn="play"]').addEventListener('click', function(){ playing ? stopPlay() : startPlay(); });
  container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); generateSteps(); cur = 0; render(); });
  _algoBindSpeed(container, getDelay, function() { stopPlay(); startPlay(); });

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