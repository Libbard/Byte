;(function () {
  'use strict';

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(a, e) { return isAr() ? a : e; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var CATS = [
    {
      k: 'cx', ar: 'التعقيد و«بيج أو»', en: 'Complexity & Big-O',
      items: [
        { ar: 'بيج أو', en: 'Big-O', tex: 'f(n) = O(g(n)) \\iff \\exists\\, c>0,\\ n_0:\\ \\forall n \\ge n_0,\\ f(n) \\le c\\,g(n)' },
        { ar: 'أوميغا الكبرى', en: 'Big-Omega', tex: 'f(n) = \\Omega(g(n)) \\iff \\exists\\, c>0,\\ n_0:\\ \\forall n \\ge n_0,\\ f(n) \\ge c\\,g(n)' },
        { ar: 'ثيتا', en: 'Big-Theta', tex: 'f(n) = \\Theta(g(n)) \\iff f(n)=O(g(n)) \\wedge f(n)=\\Omega(g(n))' },
        { ar: 'سُلَّم النموّ', en: 'Growth ladder', tex: 'O(1) \\subset O(\\log n) \\subset O(n) \\subset O(n\\log n) \\subset O(n^2) \\subset O(2^n) \\subset O(n!)' },
        { ar: 'المبرهنة الرئيسة', en: 'Master theorem', tex: 'T(n) = a\\,T\\!\\left(\\tfrac{n}{b}\\right) + f(n),\\quad a \\ge 1,\\ b > 1' },
        { ar: 'البحث الثنائي', en: 'Binary search', tex: 'T(n) = T\\!\\left(\\tfrac{n}{2}\\right) + O(1) = O(\\log n)' },
        { ar: 'الفرز بالدمج', en: 'Merge sort', tex: 'T(n) = 2T\\!\\left(\\tfrac{n}{2}\\right) + O(n) = O(n \\log n)' },
        { ar: 'مجموع متسلسلة', en: 'Arithmetic sum', tex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} = \\Theta(n^2)' }
      ]
    },
    {
      k: 'ds', ar: 'المتقطّعة والمنطق', en: 'Discrete & Logic',
      items: [
        { ar: 'قوانين دي مورغان', en: "De Morgan's laws", tex: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}, \\qquad \\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}' },
        { ar: 'التكافؤ الشرطي', en: 'Implication', tex: 'p \\rightarrow q \\equiv \\neg p \\vee q' },
        { ar: 'النقيض', en: 'Contrapositive', tex: 'p \\rightarrow q \\equiv \\neg q \\rightarrow \\neg p' },
        { ar: 'التوافيق', en: 'Combinations', tex: '\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!}' },
        { ar: 'التباديل', en: 'Permutations', tex: 'P(n,k) = \\frac{n!}{(n-k)!}' },
        { ar: 'المبدأ الاحتوائي', en: 'Inclusion-exclusion', tex: '|A \\cup B| = |A| + |B| - |A \\cap B|' },
        { ar: 'الاستقراء الرياضي', en: 'Induction', tex: '\\big(P(1) \\wedge \\forall k\\,(P(k) \\rightarrow P(k+1))\\big) \\rightarrow \\forall n\\, P(n)' },
        { ar: 'متتالية فيبوناتشي', en: 'Fibonacci', tex: 'F_n = F_{n-1} + F_{n-2}, \\quad F_0 = 0,\\ F_1 = 1' }
      ]
    },
    {
      k: 'al', ar: 'الجبر والمتتاليات', en: 'Algebra & series',
      items: [
        { ar: 'القانون العام', en: 'Quadratic formula', tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
        { ar: 'قوانين اللوغاريتم', en: 'Log laws', tex: '\\log_b(xy) = \\log_b x + \\log_b y, \\qquad \\log_b x^n = n \\log_b x' },
        { ar: 'تغيير الأساس', en: 'Change of base', tex: '\\log_b x = \\frac{\\log_c x}{\\log_c b}' },
        { ar: 'متتالية هندسية', en: 'Geometric series', tex: '\\sum_{i=0}^{n-1} ar^i = a\\,\\frac{1 - r^n}{1 - r}, \\quad r \\ne 1' },
        { ar: 'مجموع المربّعات', en: 'Sum of squares', tex: '\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}' },
        { ar: 'ذات الحدّين', en: 'Binomial theorem', tex: '(x + y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^{k}' }
      ]
    },
    {
      k: 'ca', ar: 'التفاضل والتكامل', en: 'Calculus',
      items: [
        { ar: 'تعريف المشتقّة', en: 'Derivative definition', tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
        { ar: 'قاعدة السلسلة', en: 'Chain rule', tex: '\\frac{d}{dx} f(g(x)) = f\'(g(x))\\, g\'(x)' },
        { ar: 'قاعدة الضرب', en: 'Product rule', tex: "(fg)' = f'g + fg'" },
        { ar: 'التكامل بالتجزئة', en: 'Integration by parts', tex: '\\int u\\,dv = uv - \\int v\\,du' },
        { ar: 'المبرهنة الأساسية', en: 'Fundamental theorem', tex: '\\int_a^b f\'(x)\\,dx = f(b) - f(a)' },
        { ar: 'متسلسلة تايلور', en: 'Taylor series', tex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}\\,(x-a)^n' }
      ]
    },
    {
      k: 'st', ar: 'الإحصاء والاحتمال', en: 'Statistics & probability',
      items: [
        { ar: 'المتوسّط', en: 'Mean', tex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i' },
        { ar: 'الانحراف المعياري', en: 'Standard deviation', tex: '\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n} (x_i - \\mu)^2}' },
        { ar: 'مبرهنة بايز', en: "Bayes' theorem", tex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}' },
        { ar: 'الاحتمال الشرطي', en: 'Conditional probability', tex: 'P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}' },
        { ar: 'التوزيع الطبيعي', en: 'Normal distribution', tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}' },
        { ar: 'ذو الحدّين', en: 'Binomial distribution', tex: 'P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}' },
        { ar: 'المعدّل التراكمي', en: 'GPA', tex: '\\mathrm{GPA} = \\frac{\\sum_{i} (\\text{points}_i \\times \\text{hours}_i)}{\\sum_{i} \\text{hours}_i}' }
      ]
    },
    {
      k: 'ph', ar: 'الفيزياء', en: 'Physics',
      items: [
        { ar: 'قانون نيوتن الثاني', en: "Newton's second law", tex: '\\vec{F} = m\\vec{a}' },
        { ar: 'الطاقة الحركية', en: 'Kinetic energy', tex: 'E_k = \\tfrac{1}{2} m v^2' },
        { ar: 'حركة بتسارع ثابت', en: 'Uniform acceleration', tex: 'v^2 = v_0^2 + 2a(x - x_0)' },
        { ar: 'قانون الجذب العام', en: 'Universal gravitation', tex: 'F = G\\,\\frac{m_1 m_2}{r^2}' },
        { ar: 'قانون أوم', en: "Ohm's law", tex: 'V = IR' },
        { ar: 'القدرة الكهربائية', en: 'Electrical power', tex: 'P = VI = I^2 R = \\frac{V^2}{R}' },
        { ar: 'قانون كولوم', en: "Coulomb's law", tex: 'F = k_e\\,\\frac{|q_1 q_2|}{r^2}' },
        { ar: 'طاقة الفوتون', en: 'Photon energy', tex: 'E = h\\nu = \\frac{hc}{\\lambda}' },
        { ar: 'تكافؤ الكتلة والطاقة', en: 'Mass-energy', tex: 'E = mc^2' }
      ]
    }
  ];

  var dlg = null, onPick = null, built = false, typeset = false;

  /*@3.NOMJ2.1*/
  function ensureDlg() {
    if (dlg) return dlg;
    dlg = document.getElementById('na-mathlib');
    if (!dlg) return null;
    dlg.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-mcat]');
      if (tab) { showCat(tab.getAttribute('data-mcat')); return; }
      var it = e.target.closest('[data-mtex]');
      if (it) {
        var tex = it.getAttribute('data-mtex');
        try { dlg.close(); } catch (x) {}
        if (onPick) onPick(tex);
      }
    });
    return dlg;
  }

  function build() {
    if (built) return;
    var d = ensureDlg();
    if (!d) return;
    var tabs = d.querySelector('#na-ml-tabs');
    var body = d.querySelector('#na-ml-body');
    if (!tabs || !body) return;

    tabs.innerHTML = CATS.map(function (c, i) {
      return '<button type="button" class="gsf-chip' + (i === 0 ? ' on' : '') +
        '" data-mcat="' + c.k + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
        esc(L(c.ar, c.en)) + '</button>';
    }).join('');

    body.innerHTML = CATS.map(function (c, i) {
      return '<div class="na-ml-grid" data-mgrid="' + c.k + '"' + (i === 0 ? '' : ' hidden') + '>' +
        c.items.map(function (it) {
          return '<button type="button" class="na-ml-i" data-mtex="' + esc(it.tex) + '"' +
            ' aria-label="' + esc(L(it.ar, it.en)) + '">' +
            '<span class="na-ml-n">' + esc(L(it.ar, it.en)) + '</span>' +
            '<span class="na-ml-p">\\(' + it.tex + '\\)</span></button>';
        }).join('') + '</div>';
    }).join('');

    built = true;
  }

  /*@3.NOMJ2.2*/
  function paint() {
    if (typeset) return;
    var d = ensureDlg();
    if (!d) return;
    if (window.GardenMath && GardenMath.typeset) {
      try { GardenMath.typeset(d.querySelector('#na-ml-body')); typeset = true; } catch (e) {}
    }
  }

  function showCat(k) {
    var d = ensureDlg();
    if (!d) return;
    [].forEach.call(d.querySelectorAll('[data-mcat]'), function (b) {
      var on = b.getAttribute('data-mcat') === k;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    [].forEach.call(d.querySelectorAll('[data-mgrid]'), function (g) {
      g.hidden = g.getAttribute('data-mgrid') !== k;
    });
  }

  function open(cb) {
    var d = ensureDlg();
    if (!d) return;
    onPick = cb;
    build();
    try { d.showModal(); } catch (e) {}
    paint();
  }

  function relang() { built = false; typeset = false; }

  /*@3.NOMJ2.3*/
  document.addEventListener('garden:languageChanged', relang);

  window.GardenNotesMathLib = { open: open, CATS: CATS };
})();
