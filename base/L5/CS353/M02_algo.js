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

window._algoTitles = window._algoTitles || {};
window._algoTitles[1] = { en: 'Asymptotic Notations', ar: 'الرموز التقاربية' };

window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' +
      _AL.titleHTML(1) +
      _AL.toolbar(1) +
      '<div class="algo-explanation" id="w1-exp" style="font-size: 0.9rem; font-weight: 600; line-height: 1.6; margin-bottom: 15px;"></div>' +
      
      // حاوية SVG المتجاوبة
      '<div class="algo-canvas" id="w1-canvas-container" style="width:100%; max-width:800px; margin:0 auto; aspect-ratio: 16/9; border: 1px solid var(--algo-border); border-radius: var(--radius-md); background: var(--algo-canvas-bg); overflow:hidden; position:relative; display: flex; align-items: center; justify-content: center;">' +
        '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" style="overflow:visible;"></svg>' +
      '</div>' +
      
      // دليل الألوان
      '<div class="algo-legend" style="display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin-top:15px;font-size:0.85rem;color:var(--text-secondary);">' +
        '<span><span style="display:inline-block;width:16px;height:4px;background:var(--brand-500);margin-right:6px;vertical-align:middle; border-radius: 2px;"></span><span data-algo-text="w1-tn"></span></span>' +
        '<span><span style="display:inline-block;width:16px;height:4px;background:var(--algo-compare);margin-right:6px;vertical-align:middle; border-radius: 2px;"></span><span data-algo-text="w1-c1gn"></span></span>' +
        '<span><span style="display:inline-block;width:16px;height:4px;background:var(--algo-swap);margin-right:6px;vertical-align:middle; border-radius: 2px;"></span><span data-algo-text="w1-c2gn"></span></span>' +
        '<span><span style="display:inline-block;width:4px;height:12px;background:var(--algo-active);margin-right:6px;vertical-align:middle; border-radius: 2px;"></span><span data-algo-text="w1-n0"></span></span>' +
      '</div>' +
    '</div>';

    var btnPlay = container.querySelector('[data-algo-btn="play"]');
    var expEl   = container.querySelector('#w1-exp');
    var svgEl   = container.querySelector('#w1-svg');
    var counter = container.querySelector('[data-algo-counter]');

    var steps = [], cur = 0, playing = false, interval = null;
    var isInitialized = false;

    // الثوابت الهندسية للرسم البياني
    const SVG_W = 800;
    const SVG_H = 450;
    const PAD_L = 70;
    const PAD_R = 100; // مساحة إضافية للنصوص في اليمين
    const PAD_T = 40;
    const PAD_B = 50;
    const CHART_W = SVG_W - PAD_L - PAD_R;
    const CHART_H = SVG_H - PAD_T - PAD_B;

    const MAX_N = 50;
    const N0 = 15;

    // دوال حساب النمو
    function t_n(n) { return 0.5 * n * n + 10 * n + 50; }
    function g_n(n) { return n * n; }
    const C1 = 1.5;
    const C2 = 0.2;
    function c1_g_n(n) { return C1 * g_n(n); }
    function c2_g_n(n) { return C2 * g_n(n); }

    const MAX_Y = Math.max(t_n(MAX_N), c1_g_n(MAX_N)) * 1.05;

    // دوال التحجيم
    function scaleX(n) { return PAD_L + (n / MAX_N) * CHART_W; }
    function scaleY(v) { return PAD_T + CHART_H - (v / MAX_Y) * CHART_H; }

    // عناصر الـ UI لتحديثها برمجياً
    var uiElements = {
      tnPath: null, c1Path: null, c2Path: null,
      tnLbl: null, c1Lbl: null, c2Lbl: null,
      n0Line: null, n0Lbl: null, shadeO: null, shadeOmega: null,
      intDot: null
    };

    function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

    function updateLabels() {
      container.querySelector('[data-algo-text="w1-tn"]').textContent   = _AL.exp('T(n): Actual Time', 'T(n): الوقت الفعلي');
      container.querySelector('[data-algo-text="w1-c1gn"]').textContent = _AL.exp('c₁·g(n): Upper Bound (O)', 'c₁·g(n): الحد الأعلى (O)');
      container.querySelector('[data-algo-text="w1-c2gn"]').textContent = _AL.exp('c₂·g(n): Lower Bound (Ω)', 'c₂·g(n): الحد الأدنى (Ω)');
      container.querySelector('[data-algo-text="w1-n0"]').textContent   = _AL.exp('n₀: Threshold', 'n₀: نقطة التقاطع');
    }

    function makeSVG(tag, attrs) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (let k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
      return el;
    }

    // بناء مسارات المنحنيات
    function buildPath(fn) {
      let d = `M ${scaleX(0)},${scaleY(fn(0))}`;
      for (let n = 1; n <= MAX_N; n++) {
        d += ` L ${scaleX(n)},${scaleY(fn(n))}`;
      }
      return d;
    }

    // بناء مساحة التظليل بين منحنيين من n0 فصاعداً
    function buildShadePath(topFn, bottomFn) {
      let d = `M ${scaleX(N0)},${scaleY(topFn(N0))}`;
      for (let n = N0 + 1; n <= MAX_N; n++) d += ` L ${scaleX(n)},${scaleY(topFn(n))}`;
      for (let n = MAX_N; n >= N0; n--) d += ` L ${scaleX(n)},${scaleY(bottomFn(n))}`;
      d += ' Z';
      return d;
    }

    function generateSteps() {
      steps = [
        {
          state: { tn: 0, c1: 0, c2: 0, n0: 0, shadeO: 0, shadeOmega: 0 },
          en: 'This graph visualizes algorithm growth rates. The X-axis is input size (n) and the Y-axis is running time.',
          ar: 'يوضح هذا الرسم البياني معدلات نمو الخوارزميات. المحور الأفقي يمثل حجم المدخلات (n) والمحور الرأسي يمثل وقت التشغيل.'
        },
        {
          state: { tn: 1, c1: 0, c2: 0, n0: 0, shadeO: 0, shadeOmega: 0 },
          en: 'Here is the actual running time curve of our algorithm: <strong>T(n)</strong>.',
          ar: 'هذا هو منحنى وقت التشغيل الفعلي لخوارزميتنا: <strong dir="ltr">T(n)</strong>.'
        },
        {
          state: { tn: 1, c1: 1, c2: 0, n0: 0, shadeO: 0, shadeOmega: 0 },
          en: 'We introduce a bounding function <strong>c₁·g(n)</strong> to act as an upper bound.',
          ar: 'نُدخل دالة قيد <strong dir="ltr">c₁·g(n)</strong> لتعمل كحد أعلى.'
        },
        {
          state: { tn: 1, c1: 1, c2: 0, n0: 1, shadeO: 1, shadeOmega: 0 },
          en: 'For all <strong>n ≥ n₀</strong>, T(n) is bounded above. This proves Big-O: <strong>T(n) ∈ O(g(n))</strong>.',
          ar: 'لجميع قيم <strong>n ≥ n₀</strong>، يكون T(n) مقيداً من الأعلى. هذا يثبت رمز (O): <strong dir="ltr">T(n) ∈ O(g(n))</strong>.'
        },
        {
          state: { tn: 1, c1: 1, c2: 1, n0: 1, shadeO: 0, shadeOmega: 0 },
          en: 'Similarly, we find another constant to create <strong>c₂·g(n)</strong> as a lower bound.',
          ar: 'وبالمثل، نجد ثابتاً آخر لإنشاء <strong dir="ltr">c₂·g(n)</strong> كحد أدنى.'
        },
        {
          state: { tn: 1, c1: 1, c2: 1, n0: 1, shadeO: 0, shadeOmega: 1 },
          en: 'For all <strong>n ≥ n₀</strong>, T(n) is bounded below. This proves Big-Omega: <strong>T(n) ∈ Ω(g(n))</strong>.',
          ar: 'لجميع قيم <strong>n ≥ n₀</strong>، يكون T(n) مقيداً من الأسفل. هذا يثبت رمز (Ω): <strong dir="ltr">T(n) ∈ Ω(g(n))</strong>.'
        },
        {
          state: { tn: 1, c1: 1, c2: 1, n0: 1, shadeO: 1, shadeOmega: 1 },
          en: 'Since T(n) is squeezed tightly between both bounds, we conclude <strong>T(n) ∈ Θ(g(n))</strong> (Big-Theta).',
          ar: 'بما أن T(n) محصور بإحكام بين كلا الحدين، يمكننا الاستنتاج أن <strong dir="ltr">T(n) ∈ Θ(g(n))</strong> (رمز ثيتا).'
        }
      ];
    }

    function buildSVG() {
      svgEl.innerHTML = '';
      
      let defs = makeSVG('defs', {});
      defs.innerHTML = `
        <pattern id="diag-stripes-o" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--algo-compare)" stroke-width="2" opacity="0.25" />
        </pattern>
        <pattern id="diag-stripes-omega" width="8" height="8" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--algo-swap)" stroke-width="2" opacity="0.25" />
        </pattern>
      `;
      svgEl.appendChild(defs);

      // 1. بناء المحاور (Axes)
      let axesG = makeSVG('g', {});
      
      // محور X
      axesG.appendChild(makeSVG('line', { x1: PAD_L, y1: scaleY(0), x2: SVG_W - PAD_R + 30, y2: scaleY(0), stroke: 'var(--text-muted)', 'stroke-width': 2 }));
      let xLbl = makeSVG('text', { x: SVG_W / 2, y: SVG_H - 10, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-secondary)', 'font-size': '15', 'font-family': "'Cairo', 'Inter', sans-serif", 'font-weight': '800' });
      xLbl.textContent = _AL.lang() === 'ar' ? 'حجم المدخلات (n)' : 'Input Size (n)';
      axesG.appendChild(xLbl);
      
      // محور Y
      axesG.appendChild(makeSVG('line', { x1: PAD_L, y1: PAD_T - 20, x2: PAD_L, y2: scaleY(0), stroke: 'var(--text-muted)', 'stroke-width': 2 }));
      let yLbl = makeSVG('text', { x: PAD_L - 45, y: SVG_H / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-secondary)', 'font-size': '15', 'font-family': "'Cairo', 'Inter', sans-serif", 'font-weight': '800', transform: `rotate(-90 ${PAD_L - 45} ${SVG_H / 2})` });
      yLbl.textContent = _AL.lang() === 'ar' ? 'وقت التشغيل' : 'Running Time';
      axesG.appendChild(yLbl);

      // علامات (Ticks) لمحور X
      for (let i = 10; i <= MAX_N; i += 10) {
        let x = scaleX(i);
        axesG.appendChild(makeSVG('line', { x1: x, y1: scaleY(0), x2: x, y2: scaleY(0) + 6, stroke: 'var(--text-muted)', 'stroke-width': 2 }));
        let tick = makeSVG('text', { x: x, y: scaleY(0) + 20, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'var(--text-muted)', 'font-size': '13', 'font-family': "'JetBrains Mono', monospace", 'font-weight': 'bold' });
        tick.textContent = i;
        axesG.appendChild(tick);
      }

      svgEl.appendChild(axesG);

      // 2. بناء البيانات (Data Layer)
      let dataG = makeSVG('g', {});

      // مناطق التظليل
      uiElements.shadeO = makeSVG('path', { d: buildShadePath(c1_g_n, t_n), fill: 'url(#diag-stripes-o)', opacity: '0' });
      uiElements.shadeOmega = makeSVG('path', { d: buildShadePath(t_n, c2_g_n), fill: 'url(#diag-stripes-omega)', opacity: '0' });
      dataG.appendChild(uiElements.shadeO);
      dataG.appendChild(uiElements.shadeOmega);

      // خط البداية n0
      let n0X = scaleX(N0);
      uiElements.n0Line = makeSVG('line', { x1: n0X, y1: PAD_T - 10, x2: n0X, y2: scaleY(0), stroke: 'var(--algo-active)', 'stroke-width': 2, 'stroke-dasharray': '6,4', opacity: '0' });
      
      // خلفية لنص n0 ليكون واضحاً
      uiElements.n0Bg = makeSVG('rect', { x: n0X - 16, y: scaleY(0) + 12, width: 32, height: 24, rx: 4, fill: 'var(--algo-canvas-bg)', opacity: '0' });
      uiElements.n0Lbl = makeSVG('text', { x: n0X, y: scaleY(0) + 24, 'text-anchor': 'middle', 'dominant-baseline': 'middle', dy: '.1em', fill: 'var(--algo-active)', 'font-size': '16', 'font-family': "'JetBrains Mono', monospace", 'font-weight': '800', opacity: '0' });
      uiElements.n0Lbl.textContent = "n₀";
      
      // نقطة التقاطع
      uiElements.intDot = makeSVG('circle', { cx: n0X, cy: scaleY(t_n(N0)), r: 6, fill: 'var(--algo-active)', stroke: 'var(--algo-canvas-bg)', 'stroke-width': 2, opacity: '0' });

      dataG.appendChild(uiElements.n0Line);
      dataG.appendChild(uiElements.n0Bg);
      dataG.appendChild(uiElements.n0Lbl);
      dataG.appendChild(uiElements.intDot);

      // المنحنيات الرئيسية
      uiElements.c1Path = makeSVG('path', { d: buildPath(c1_g_n), fill: 'none', stroke: 'var(--algo-compare)', 'stroke-width': 3, 'stroke-dasharray': '8,6', opacity: '0' });
      uiElements.c2Path = makeSVG('path', { d: buildPath(c2_g_n), fill: 'none', stroke: 'var(--algo-swap)', 'stroke-width': 3, 'stroke-dasharray': '8,6', opacity: '0' });
      uiElements.tnPath = makeSVG('path', { d: buildPath(t_n), fill: 'none', stroke: 'var(--brand-500)', 'stroke-width': 4, opacity: '0' });
      
      dataG.appendChild(uiElements.c1Path);
      dataG.appendChild(uiElements.c2Path);
      dataG.appendChild(uiElements.tnPath);

      // نصوص المنحنيات في اليمين مع خلفيات
      let lX = scaleX(MAX_N) + 12;
      let fontStr = "'JetBrains Mono', monospace";
      
      function createCurveLabel(y, text, color) {
        let bg = makeSVG('rect', { x: lX - 4, y: y - 12, width: 65, height: 24, rx: 4, fill: 'var(--algo-canvas-bg)', opacity: '0' });
        let lbl = makeSVG('text', { x: lX, y: y, 'text-anchor': 'start', 'dominant-baseline': 'middle', dy: '.1em', fill: color, 'font-size': '16', 'font-family': fontStr, 'font-weight': '800', opacity: '0' });
        lbl.textContent = text;
        dataG.appendChild(bg);
        dataG.appendChild(lbl);
        return { bg, lbl };
      }

      let c1UIs = createCurveLabel(scaleY(c1_g_n(MAX_N)), "c₁g(n)", 'var(--algo-compare)');
      let tnUIs = createCurveLabel(scaleY(t_n(MAX_N)), "T(n)", 'var(--brand-500)');
      let c2UIs = createCurveLabel(scaleY(c2_g_n(MAX_N)), "c₂g(n)", 'var(--algo-swap)');

      uiElements.c1Bg = c1UIs.bg; uiElements.c1Lbl = c1UIs.lbl;
      uiElements.tnBg = tnUIs.bg; uiElements.tnLbl = tnUIs.lbl;
      uiElements.c2Bg = c2UIs.bg; uiElements.c2Lbl = c2UIs.lbl;

      svgEl.appendChild(dataG);
      isInitialized = true;
    }

    function render() {
      if(!isInitialized) buildSVG();
      updateLabels();
      var s = steps[cur];
      counter.textContent = _AL.stepLabel(cur, steps.length - 1);
      expEl.innerHTML = _AL.exp(s.en, s.ar);

      // تحديث الشفافية بناءً على حالة الخطوة
      uiElements.tnPath.style.opacity = s.state.tn;
      uiElements.tnBg.style.opacity = s.state.tn;
      uiElements.tnLbl.style.opacity = s.state.tn;
      
      uiElements.c1Path.style.opacity = s.state.c1;
      uiElements.c1Bg.style.opacity = s.state.c1;
      uiElements.c1Lbl.style.opacity = s.state.c1;
      
      uiElements.c2Path.style.opacity = s.state.c2;
      uiElements.c2Bg.style.opacity = s.state.c2;
      uiElements.c2Lbl.style.opacity = s.state.c2;
      
      uiElements.n0Line.style.opacity = s.state.n0;
      uiElements.n0Bg.style.opacity = s.state.n0;
      uiElements.n0Lbl.style.opacity = s.state.n0;
      uiElements.intDot.style.opacity = s.state.n0;

      uiElements.shadeO.style.opacity = s.state.shadeO ? '1' : '0';
      uiElements.shadeOmega.style.opacity = s.state.shadeOmega ? '1' : '0';
      
      // إبراز خط n0 عند تفعيل التظليلين معاً كإشارة نهائية
      uiElements.n0Line.setAttribute('stroke-width', (s.state.shadeO && s.state.shadeOmega) ? '4' : '2');
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
    container.querySelector('[data-algo-btn="reset"]').addEventListener('click', function(){ stopPlay(); cur=0; render(); });
    
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