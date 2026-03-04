// M01_algo.js - Interactive algorithm widgets
// Generated: 2023-10-25T12:00:00Z
// Diagrams: 2/2

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

// WIDGET 1: Methods of Specifying an Algorithm
window._algoTitles[1] = { en: 'Methods of Specifying an Algorithm', ar: 'طرق تحديد الخوارزمية' };
window.AlgoWidgets[1] = function(container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(1) + _AL.toolbar(1) +
    '<div class="algo-explanation" id="w1-exp"></div>' +
    '<div class="algo-canvas" id="w1-canvas" style="height:250px; position:relative; overflow:hidden;">' +
      '<svg viewBox="0 0 800 250" style="width:100%; height:100%; fill:none; stroke-width:2; font-family:sans-serif;">' +
        '<defs>' +
          '<marker id="w1-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-muted)"/></marker>' +
          '<marker id="w1-arr-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker>' +
        '</defs>' +
        '<path id="w1-e1" d="M 400 80 L 400 110 L 200 110 L 200 150" stroke="var(--algo-muted)" marker-end="url(#w1-arr)"/>' +
        '<path id="w1-e2" d="M 400 80 L 400 150" stroke="var(--algo-muted)" marker-end="url(#w1-arr)"/>' +
        '<path id="w1-e3" d="M 400 80 L 400 110 L 600 110 L 600 150" stroke="var(--algo-muted)" marker-end="url(#w1-arr)"/>' +
        
        '<rect id="w1-n0" x="280" y="20" width="240" height="60" rx="8" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w1-n1" x="100" y="150" width="200" height="60" rx="8" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w1-n2" x="320" y="150" width="160" height="60" rx="8" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w1-n3" x="500" y="150" width="200" height="60" rx="8" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        
        '<text id="w1-t0" x="400" y="50" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="16" dominant-baseline="middle"></text>' +
        '<text id="w1-t1" x="200" y="180" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w1-t2" x="400" y="180" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w1-t3" x="600" y="180" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
      '</svg>' +
    '</div>' +
  '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl   = container.querySelector('#w1-exp');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('#w1-t0').textContent = ar ? "مواصفات الخوارزمية" : "Algorithm Specifications";
    container.querySelector('#w1-t1').textContent = ar ? "(أ) اللغة الطبيعية" : "(a) Natural Language";
    container.querySelector('#w1-t2').textContent = ar ? "(ب) الكود الوهمي" : "(b) Pseudocode";
    container.querySelector('#w1-t3').textContent = ar ? "(ج) المخطط الانسيابي" : "(c) Flowchart";
  }

  function generateSteps() {
    steps = [
      {
        nodes: ['n0'], edges: [],
        en: "An algorithm must be specified clearly before it can be implemented.",
        ar: "يجب تحديد الخوارزمية بوضوح قبل أن يتم تنفيذها."
      },
      {
        nodes: ['n0', 'n1'], edges: ['e1'],
        en: "1. Natural Language: Simple but often ambiguous and lacks precision.",
        ar: "1. اللغة الطبيعية: بسيطة ولكنها غالباً ما تكون غامضة وتفتقر للدقة."
      },
      {
        nodes: ['n0', 'n1', 'n2'], edges: ['e1', 'e2'],
        en: "2. Pseudocode: The dominant method. A mix of natural language and programming constructs.",
        ar: "2. الكود الوهمي: الطريقة السائدة. مزيج من اللغة الطبيعية وهياكل البرمجة."
      },
      {
        nodes: ['n0', 'n1', 'n2', 'n3'], edges: ['e1', 'e2', 'e3'],
        en: "3. Flowchart: Graphical representation. Good for small algorithms but inconvenient for complex ones.",
        ar: "3. المخطط الانسيابي: تمثيل رسومي. جيد للخوارزميات الصغيرة ولكنه غير مريح للمعقدة."
      }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    for(var i=0; i<=3; i++) {
      var n = container.querySelector('#w1-n'+i);
      var active = s.nodes.indexOf('n'+i) > -1;
      n.style.stroke = active ? 'var(--brand-500)' : 'var(--algo-muted)';
      n.style.strokeWidth = active ? '3' : '2';
      n.style.opacity = active ? '1' : '0.3';
      container.querySelector('#w1-t'+i).style.opacity = active ? '1' : '0.3';
    }
    for(var j=1; j<=3; j++) {
      var e = container.querySelector('#w1-e'+j);
      var active = s.edges.indexOf('e'+j) > -1;
      e.style.stroke = active ? 'var(--brand-500)' : 'var(--algo-muted)';
      e.style.strokeWidth = active ? '3' : '2';
      e.style.opacity = active ? '1' : '0.3';
      e.setAttribute('marker-end', active ? 'url(#w1-arr-hi)' : 'url(#w1-arr)');
    }
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

// WIDGET 2: Steps of Designing and Analysis of Algorithms
window._algoTitles[2] = { en: 'Algorithm Design Steps', ar: 'خطوات تصميم الخوارزمية' };
window.AlgoWidgets[2] = function(container) {
  container.innerHTML = '<div class="algo-widget">' + _AL.titleHTML(2) + _AL.toolbar(2) +
    '<div class="algo-explanation" id="w2-exp"></div>' +
    '<div class="algo-canvas" id="w2-canvas" style="height:420px; position:relative; overflow:hidden;">' +
      '<svg viewBox="0 0 800 420" style="width:100%; height:100%; fill:none; stroke-width:2; font-family:sans-serif;">' +
        '<defs>' +
          '<marker id="w2-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-muted)"/></marker>' +
          '<marker id="w2-arr-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-500)"/></marker>' +
          '<marker id="w2-arr-fb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--algo-swap)"/></marker>' +
        '</defs>' +
        
        // Main downward edges
        '<path id="w2-e1" d="M 400 60 L 400 90" stroke="var(--algo-muted)" marker-end="url(#w2-arr)"/>' +
        '<path id="w2-e2" d="M 400 130 L 400 160" stroke="var(--algo-muted)" marker-end="url(#w2-arr)"/>' +
        '<path id="w2-e3" d="M 400 200 L 400 230" stroke="var(--algo-muted)" marker-end="url(#w2-arr)"/>' +
        '<path id="w2-e4" d="M 400 270 L 400 300" stroke="var(--algo-muted)" marker-end="url(#w2-arr)"/>' +
        '<path id="w2-e5" d="M 400 340 L 400 370" stroke="var(--algo-muted)" marker-end="url(#w2-arr)"/>' +
        
        // Feedback edges
        '<path id="w2-fb1" d="M 250 250 L 200 250 L 200 180 L 240 180" stroke="var(--algo-muted)" stroke-dasharray="5,5" marker-end="url(#w2-arr)"/>' +
        '<path id="w2-fb2" d="M 550 320 L 600 320 L 600 180 L 560 180" stroke="var(--algo-muted)" stroke-dasharray="5,5" marker-end="url(#w2-arr)"/>' +
        
        // Nodes
        '<rect id="w2-n1" x="250" y="20" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w2-n2" x="250" y="90" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w2-n3" x="250" y="160" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w2-n4" x="250" y="230" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w2-n5" x="250" y="300" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        '<rect id="w2-n6" x="250" y="370" width="300" height="40" rx="6" fill="var(--algo-bg)" stroke="var(--algo-muted)"/>' +
        
        // Texts
        '<text id="w2-t1" x="400" y="40" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w2-t2" x="400" y="110" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w2-t3" x="400" y="180" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w2-t4" x="400" y="250" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w2-t5" x="400" y="320" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
        '<text id="w2-t6" x="400" y="390" text-anchor="middle" fill="var(--algo-text)" font-weight="bold" font-size="14" dominant-baseline="middle"></text>' +
      '</svg>' +
    '</div>' +
  '</div>';

  var btnPlay = container.querySelector('[data-algo-btn="play"]');
  var expEl   = container.querySelector('#w2-exp');
  var counter = container.querySelector('[data-algo-counter]');
  var steps = [], cur = 0, playing = false, interval = null;

  function getDelay() { return _AL.speedToDelay(parseInt(container.querySelector('.algo-speed input').value)); }

  function updateLabels() {
    var ar = _AL.lang() === 'ar';
    container.querySelector('#w2-t1').textContent = ar ? "1. فهم المشكلة" : "1. Understand the problem";
    container.querySelector('#w2-t2').textContent = ar ? "2. اتخاذ القرارات (الوسائل، التقنيات)" : "2. Decide on (means, techniques)";
    container.querySelector('#w2-t3').textContent = ar ? "3. تصميم الخوارزمية" : "3. Design an algorithm";
    container.querySelector('#w2-t4').textContent = ar ? "4. إثبات الصحة" : "4. Prove correctness";
    container.querySelector('#w2-t5').textContent = ar ? "5. تحليل الخوارزمية" : "5. Analyze the algorithm";
    container.querySelector('#w2-t6').textContent = ar ? "6. كتابة الكود" : "6. Code the algorithm";
  }

  function generateSteps() {
    steps = [
      {
        nodes: ['n1'], edges: [], fbs: [],
        en: "Step 1: Understand the problem. Read the description carefully and identify inputs/outputs.",
        ar: "الخطوة 1: فهم المشكلة. اقرأ الوصف بعناية وحدد المدخلات والمخرجات."
      },
      {
        nodes: ['n1', 'n2'], edges: ['e1'], fbs: [],
        en: "Step 2: Decide on computational means (sequential vs parallel), exact vs approximate, and design technique.",
        ar: "الخطوة 2: اتخاذ القرارات بشأن وسائل الحوسبة، الحل الدقيق مقابل التقريبي، وتقنية التصميم."
      },
      {
        nodes: ['n1', 'n2', 'n3'], edges: ['e1', 'e2'], fbs: [],
        en: "Step 3: Design the algorithm using pseudocode.",
        ar: "الخطوة 3: تصميم الخوارزمية باستخدام الكود الوهمي."
      },
      {
        nodes: ['n1', 'n2', 'n3', 'n4'], edges: ['e1', 'e2', 'e3'], fbs: [],
        en: "Step 4: Prove correctness. Ensure it works for all legitimate inputs (often using mathematical induction).",
        ar: "الخطوة 4: إثبات الصحة. تأكد من عملها لجميع المدخلات المشروعة (غالباً باستخدام الاستقراء الرياضي)."
      },
      {
        nodes: ['n1', 'n2', 'n3', 'n4'], edges: ['e1', 'e2', 'e3'], fbs: ['fb1'],
        en: "If the proof fails, you must go back and redesign the algorithm (Feedback loop).",
        ar: "إذا فشل الإثبات، يجب عليك العودة وإعادة تصميم الخوارزمية (حلقة تغذية راجعة)."
      },
      {
        nodes: ['n1', 'n2', 'n3', 'n4', 'n5'], edges: ['e1', 'e2', 'e3', 'e4'], fbs: [],
        en: "Step 5: Analyze the algorithm. Measure time and space efficiency.",
        ar: "الخطوة 5: تحليل الخوارزمية. قياس كفاءة الوقت والمساحة."
      },
      {
        nodes: ['n1', 'n2', 'n3', 'n4', 'n5'], edges: ['e1', 'e2', 'e3', 'e4'], fbs: ['fb2'],
        en: "If the algorithm is inefficient, you might need to redesign it or choose a different technique.",
        ar: "إذا كانت الخوارزمية غير فعالة، قد تحتاج إلى إعادة تصميمها أو اختيار تقنية مختلفة."
      },
      {
        nodes: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'], edges: ['e1', 'e2', 'e3', 'e4', 'e5'], fbs: [],
        en: "Step 6: Code the algorithm. Translate the pseudocode into a programming language like C++ or Java.",
        ar: "الخطوة 6: كتابة الكود. ترجمة الكود الوهمي إلى لغة برمجة مثل C++ أو Java."
      }
    ];
  }

  function render() {
    updateLabels();
    var s = steps[cur];
    counter.textContent = _AL.stepLabel(cur, steps.length - 1);
    expEl.innerHTML = _AL.exp(s.en, s.ar);

    for(var i=1; i<=6; i++) {
      var n = container.querySelector('#w2-n'+i);
      var active = s.nodes.indexOf('n'+i) > -1;
      n.style.stroke = active ? 'var(--brand-500)' : 'var(--algo-muted)';
      n.style.strokeWidth = active ? '3' : '2';
      n.style.opacity = active ? '1' : '0.3';
      container.querySelector('#w2-t'+i).style.opacity = active ? '1' : '0.3';
    }
    for(var j=1; j<=5; j++) {
      var e = container.querySelector('#w2-e'+j);
      var active = s.edges.indexOf('e'+j) > -1;
      e.style.stroke = active ? 'var(--brand-500)' : 'var(--algo-muted)';
      e.style.strokeWidth = active ? '3' : '2';
      e.style.opacity = active ? '1' : '0.3';
      e.setAttribute('marker-end', active ? 'url(#w2-arr-hi)' : 'url(#w2-arr)');
    }
    for(var k=1; k<=2; k++) {
      var fb = container.querySelector('#w2-fb'+k);
      var active = s.fbs.indexOf('fb'+k) > -1;
      fb.style.stroke = active ? 'var(--algo-swap)' : 'var(--algo-muted)';
      fb.style.strokeWidth = active ? '3' : '2';
      fb.style.opacity = active ? '1' : '0.1';
      fb.setAttribute('marker-end', active ? 'url(#w2-arr-fb)' : 'url(#w2-arr)');
    }
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