/*@3.GARJ.1*/
;(function () {
  'use strict';
  if (window.GardenFlags) return;

  /*@3.GARJ.2*/
  var DEFAULTS = {
    'ratings.course.enabled': false,
    'ratings.course.publicMin': 50,
    'ratings.course.resourcesOn': true,
    'ratings.course.reportsOn': true,
    'ratings.faculty.enabled': true,
    'ratings.faculty.publicMin': 3,
    'labs.publicNav': true,
    'banner.syncEnabled': true,
    'alerts.enabled': true,
    'telemetry.enabled': true
  };

  /*@3.GARJ.3*/
  var CACHE_KEY = 'gd_flags';
  var TTL_MS = 5 * 60 * 1000;

  var current = {}, subs = [], fetched = false, cachedAt = 0;

  for (var d in DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(DEFAULTS, d)) current[d] = DEFAULTS[d];
  }

  try {
    var raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (raw && raw.f && typeof raw.f === 'object') {
      for (var k in raw.f) {
        if (Object.prototype.hasOwnProperty.call(raw.f, k)) current[k] = raw.f[k];
      }
      cachedAt = Number(raw.at) || 0;
    }
  } catch (e) { /*@3.GARJ.4*/ }

  function get(key) {
    return Object.prototype.hasOwnProperty.call(current, key) ? current[key] : DEFAULTS[key];
  }

  function announce(changed) {
    if (!changed.length) return;
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](current, changed); } catch (e) { }
    }
  }

  function apply(f) {
    var changed = [];
    for (var key in f) {
      if (!Object.prototype.hasOwnProperty.call(f, key)) continue;
      if (current[key] !== f[key]) { current[key] = f[key]; changed.push(key); }
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), f: current }));
    } catch (e) { }
    announce(changed);
  }

  function refresh(force) {
    if (fetched && !force) return;
    fetched = true;
    /*@3.GARJ.5*/
    var E = window.GardenEndpoints;
    var base = E && (E.publicData || E.sync);
    if (!base) return;
    if (!force && Date.now() - cachedAt < TTL_MS) return;
    try {
      fetch(base + '/v1/flags.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.ok && j.flags) apply(j.flags); })
        .catch(function () { /*@3.GARJ.6*/ });
    } catch (e) { }
  }

  window.GardenFlags = {
    get: get,
    all: function () { var o = {}; for (var q in current) o[q] = current[q]; return o; },
    on: function (fn) { if (typeof fn === 'function') subs.push(fn); },
    refresh: function () { refresh(true); },
    DEFAULTS: DEFAULTS
  };

  refresh(false);
})();

/*@3.GARJ.578*/
;(function () {
  'use strict';
  if (window.GardenRating) return;

  function isAr() {
    return (document.documentElement.getAttribute('lang')
      || localStorage.getItem('garden_lang') || 'ar') !== 'en';
  }

  function facultyMin() {
    var F = window.GardenFlags;
    var v = F && F.get('ratings.faculty.publicMin');
    v = Number(v);
    return (isFinite(v) && v >= 0) ? v : 3;
  }

  function nOf(f) { return Number(f && f.n) || 0; }

  function facultyShown(f) {
    return !!(f && f.idx != null && nOf(f) >= facultyMin());
  }

  function facultyIdx(f) { return facultyShown(f) ? f.idx : null; }

  function facultyFew(f) {
    var n = nOf(f);
    if (!n) return isAr() ? 'لا تقييماتٍ بعد' : 'No ratings yet';
    var ar = n === 1 ? 'رأيٌ واحد' : n === 2 ? 'رأيان' : n + ' آراء';
    return isAr()
      ? (ar + ' — لم يُعلَن بعد')
      : (n + (n === 1 ? ' rating' : ' ratings') + ' — not declared yet');
  }

  function facultyWhy(f) {
    var m = facultyMin();
    return isAr()
      ? ('المؤشّرُ لا يُعلَن قبل ' + m + ' تقييمات — وعند هذا الأستاذ ' + nOf(f) +
         '. رأيُك يقرّبه من الإعلان.')
      : ('The index is not declared below ' + m + ' ratings — this instructor has ' +
         nOf(f) + '. Yours brings it closer.');
  }

  window.GardenRating = {
    facultyMin: facultyMin,
    facultyShown: facultyShown,
    facultyIdx: facultyIdx,
    facultyFew: facultyFew,
    facultyWhy: facultyWhy
  };
})();

; (function () {
  'use strict';

  function isAr() {
    return (document.documentElement.getAttribute('lang')
      || localStorage.getItem('garden_lang') || 'ar') !== 'en';
  }

  var KIND_AR = { First: 'الأول', Second: 'الثاني', Third: 'الثالث', Summer: 'الصيفي' };
  var KIND_ORD = { First: 1, Second: 2, Third: 3, Summer: 4 };
  var DESC_RE = /(First|Secon(?:d)?|Third|Summer)\s*Term\s*(\d{4})\s*-\s*(\d{4})/i;

  function row(x) {
    return (x && typeof x === 'object') ? x : { term: String(x == null ? '' : x) };
  }

  function mk(code, year, ord, kind, dip, label) {
    return { term: code, year: year, ord: ord, kind: kind, dip: dip,
             label: label, full: label + ' · ' + year };
  }

  function parse(x) {
    var r = row(x), code = String(r.term || ''), d = String(r.description || '');
    var dip = /diploma/i.test(d);
    var m = d.match(DESC_RE);
    if (m) {
      var kind = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      /*@3.GARJ.598*/
      if (kind === 'Secon') kind = 'Second';
      var lbl = (isAr() ? 'الفصل ' + KIND_AR[kind] : kind + ' Term') +
                (dip ? (isAr() ? ' · دبلوم' : ' · Diploma') : '');
      return mk(code, m[2] + ' – ' + m[3],
                (dip ? 10 : 0) + (KIND_ORD[kind] || 9), kind, dip, lbl);
    }
    /*@3.GARJ.599*/
    var y = code.slice(0, 4);
    var yr = /^\d{4}$/.test(y) ? (y + ' – ' + (parseInt(y, 10) + 1))
                               : (isAr() ? 'غير مصنّف' : 'Unclassified');
    var bare = d.replace(/\s*(\(View Only\))\s*/i, '').trim();
    return mk(code, yr, 99, '', dip, bare || code || (isAr() ? 'فصل' : 'Term'));
  }

  function label(x, full) { var p = parse(x); return full ? p.full : p.label; }

  function byRecent(a, b) {
    var da = parse(a).ord >= 10 ? 1 : 0, db = parse(b).ord >= 10 ? 1 : 0;
    if (da !== db) return da - db;
    return String(row(b).term).localeCompare(String(row(a).term));
  }

  function sort(list) { return (list || []).slice().sort(byRecent); }

  /*@3.GARJ.597*/
  window.GardenTerms = {
    parse: parse, label: label, byRecent: byRecent, sort: sort
  };
})();

/*@3.GARJ.615*/
;(function () {
  'use strict';
  if (window.GardenCode) return;

  var ALIAS = { ISLAM: 'ISLM' };
  var PAGE_OF = { ISLM: 'ISLAM' };

  function norm(code) {
    return String(code == null ? '' : code).toUpperCase().replace(/\s+/g, '');
  }
  function split(code) {
    var m = /^([A-Z]+)(\d[A-Z0-9]*)$/.exec(norm(code));
    return m ? { s: m[1], n: m[2] } : null;
  }
  function canon(code) {
    var p = split(code);
    return (p && ALIAS[p.s]) ? (ALIAS[p.s] + p.n) : norm(code);
  }
  function page(code) {
    var c = canon(code), p = split(c);
    return (p && PAGE_OF[p.s]) ? (PAGE_OF[p.s] + p.n) : c;
  }
  function subject(code) { var p = split(code); return p ? p.s : ''; }
  function same(a, b) { var x = canon(a); return !!x && x === canon(b); }

  window.GardenCode = {
    norm: norm, canon: canon, page: page, subject: subject, same: same
  };
})();

/*@3.GARJ.616*/
;(function () {
  'use strict';
  if (window.GardenHint) return;

  function wire(btn) {
    if (!btn || btn._gHint) return;
    btn._gHint = 1;
    function off() {
      btn.classList.remove('is-on');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = btn.classList.toggle('is-on');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    document.addEventListener('click', off);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') off(); });
  }

  window.GardenHint = { wire: wire };
})();

/*@3.GARJ.7*/

; (function () {
  'use strict';

  /*@3.GARJ.8*/
  const _thisScript = document.currentScript;
  const ROOT = (_thisScript && _thisScript.src)
    ? _thisScript.src.replace(/shared\/garden\.js(\?.*)?$/, '')
    : '';

  const THEMES = ['dark', 'dim', 'light'];
  /*@3.GARJ.9*/
  const THEME_ICONS = { dark: 'fa-solid fa-cloud-moon', dim: 'fa-solid fa-sun', light: 'fa-solid fa-moon' };

  let currentLang = localStorage.getItem('garden_lang') || 'ar';
  let currentTheme = localStorage.getItem('garden_theme') || 'dark';

  /*@3.GARJ.10*/
  (function () {
    const fs = localStorage.getItem('garden_font_size');
    if (fs) document.documentElement.setAttribute('data-font-size', fs);
  })();

  /*@3.GARJ.11*/
  const i18n = {
    ar: {
      'nav.home': 'الرئيسية', 'nav.prev': 'السابق', 'nav.next': 'التالي',
      /*@3.GARJ.12*/
      'layer.flash': 'سريع', 'layer.full': 'كامل', 'layer.deep': 'عميق',
      'fc.title': 'البطاقات التعليمية', 'fc.due': 'بطاقة للمراجعة',
      'fc.none_due': 'أحسنت! لا توجد بطاقات مستحقة اليوم', 'fc.flip': 'اضغط للقلب',
      'fc.grade.0': 'لم أتذكر', 'fc.grade.2': 'صعب', 'fc.grade.3': 'جيد', 'fc.grade.4': 'ممتاز', 'fc.grade.5': 'سهل',
      'fc.reset': 'إعادة الضبط',
      'fc.undo': 'تراجع', 'fc.bury': 'تأجيل',
      'fc.info': 'البطاقات تعمل بنظام التكرار المتباعد (SM-2) — أحد أقوى تقنيات الحفظ العلمية.\n\n📊 كيف يعمل التقييم:\n• "لم أتذكر" (0): تعود لنهاية الجلسة لمحاولة أخرى.\n• "صعب" (2): تعود مع تقليل معامل السهولة — ستُراجَع أكثر.\n• "جيد" (3): تختفي اليوم وتعود بفترة قياسية (×EF).\n• "ممتاز" (4): فترة أطول من جيد — أفضل لزيادة معامل السهولة.\n• "سهل" (5): أطول فترة ممكنة — يزيد معامل السهولة بشكل ملحوظ.\n\n🧠 النظام يتكيف معك — كلما أجبت صح، زادت الفترة قبل المراجعة التالية.\n\n⌨️ اختصارات لوحة المفاتيح:\n• مسافة: اقلب البطاقة\n• 0/2/3/4/5: التقييم بعد القلب\n\n↩ تراجع: يلغي آخر 5 تقييمات (بالضغط المتكرر).\n⏸ تأجيل: يرجئ البطاقة لليوم التالي.\n↺ إعادة الضبط: يمسح كل التقدم (يطلب تأكيد أولاً).',
      'fc.reset_all': 'إعادة جميع البطاقات', 'fc.reset_hard': 'الصعبة فقط',
      'fc.practice': 'مراجعة حرة', 'fc.practice_badge': 'وضع المراجعة الحرة — لا يؤثر على تقدمك',
      'fc.practice_done': 'انتهت المراجعة الحرة', 'fc.practice_next': 'التالي',
      'fc.leech': 'تسرّب', 'fc.leech_warning': 'بطاقة متسرّبة — فشلت أكثر من 8 مرات',
      'fc.filter.all': 'الكل', 'fc.filter.new': 'جديدة', 'fc.filter.learning': 'قيد التعلم',
      'fc.filter.mastered': 'متقنة', 'fc.filter.leech': 'صعبة جداً',
      'fc.quick': 'مراجعة سريعة (10)',
      'fc.streak': 'أيام متتالية', 'fc.retention': 'معدل الحفظ',
      'fc.3d_on': 'تأثير 3D مفعّل', 'fc.3d_off': 'تأثير 3D معطّل',
      'quiz.title': 'اختبر نفسك', 'quiz.hint': 'تلميح', 'quiz.score': 'النتيجة',
      'quiz.next': 'التالي', 'quiz.retry': 'إعادة الاختبار',
      'vault.title': 'خزنة الامتحان', 'prof.title': 'حديث البروفيسور',
      'ask.title': 'اسأل البروفيسور', 'obj.title': 'أهداف التعلم',
      /*@3.GARJ.13*/
      'vault.trap': 'فخ امتحاني', 'vault.secret': 'سر الامتحان',
      'vault.key': 'مفهوم أساسي',
      'toc.title': 'محتويات الوحدة',
      'notes.btn': 'ملاحظاتي'
    },
    en: {
      'nav.home': 'Home', 'nav.prev': 'Previous', 'nav.next': 'Next',
      'layer.flash': 'Quick', 'layer.full': 'Full', 'layer.deep': 'Deep',
      'fc.title': 'Flashcards', 'fc.due': 'cards due',
      'fc.none_due': 'Well done! No cards due today', 'fc.flip': 'Click to flip',
      'fc.grade.0': 'Blackout', 'fc.grade.2': 'Hard', 'fc.grade.3': 'Good', 'fc.grade.4': 'Very Good', 'fc.grade.5': 'Easy',
      'fc.reset': 'Reset',
      'fc.undo': 'Undo', 'fc.bury': 'Bury',
      'fc.info': 'Cards use Spaced Repetition (SM-2) — one of the most powerful evidence-based memorization techniques.\n\n📊 Grading system:\n• "Blackout" (0): Card goes back to end for another try.\n• "Hard" (2): Goes back with reduced ease — scheduled more often.\n• "Good" (3): Disappears today, returns at standard interval (×EF).\n• "Very Good" (4): Longer interval than Good — grows ease factor better.\n• "Easy" (5): Longest possible interval — significantly boosts ease factor.\n\n🧠 The system adapts to you — the better you know a card, the longer the interval.\n\n⌨️ Keyboard shortcuts:\n• Space: flip card\n• 0/2/3/4/5: grade after flipping\n\n↩ Undo: reverts last 5 grades (press repeatedly).\n⏸ Bury: postpones card until tomorrow.\n↺ Reset: clears all progress (asks for confirmation first).',
      'fc.reset_all': 'Reset All Cards', 'fc.reset_hard': 'Hard Only',
      'fc.practice': 'Free Review', 'fc.practice_badge': 'Practice Mode — does not affect your progress',
      'fc.practice_done': 'Practice session complete', 'fc.practice_next': 'Next',
      'fc.leech': 'Leech', 'fc.leech_warning': 'Leech card — failed 8+ times',
      'fc.filter.all': 'All', 'fc.filter.new': 'New', 'fc.filter.learning': 'Learning',
      'fc.filter.mastered': 'Mastered', 'fc.filter.leech': 'Leeches',
      'fc.quick': 'Quick Review (10)',
      'fc.streak': 'day streak', 'fc.retention': 'Retention Rate',
      'fc.3d_on': '3D Flip ON', 'fc.3d_off': '3D Flip OFF',
      'quiz.title': 'Self Quiz', 'quiz.hint': 'Hint', 'quiz.score': 'Score',
      'quiz.next': 'Next', 'quiz.retry': 'Retry Quiz',
      'vault.title': 'Exam Vault', 'prof.title': 'Professor\'s Narrative',
      'ask.title': 'Ask The Professor', 'obj.title': 'Learning Objectives',
      'vault.trap': 'Exam Trap', 'vault.secret': 'Exam Secret',
      'vault.key': 'Key Concept',
      'toc.title': 'Module Contents',
      'notes.btn': 'My Notes'
    }
  };

  /*@3.GARJ.14*/
  function showModal({ icon, title, message, confirmText, cancelText, onConfirm, danger }) {
    /*@3.GARJ.15*/
    document.querySelector('.garden-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'garden-modal-overlay';
    overlay.innerHTML = `
      <div class="garden-modal">
        <div class="garden-modal-icon">${icon || '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>'}</div>
        <div class="garden-modal-title">${title || ''}</div>
        <div class="garden-modal-message">${message || ''}</div>
        <div class="garden-modal-actions">
          <button class="garden-modal-btn garden-modal-btn--cancel" id="modal-cancel">${cancelText || (currentLang === 'ar' ? 'إلغاء' : 'Cancel')}</button>
          <button class="garden-modal-btn ${danger ? 'garden-modal-btn--danger' : ''}" id="modal-confirm">${confirmText || (currentLang === 'ar' ? 'تأكيد' : 'Confirm')}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    /*@3.GARJ.16*/
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    /*@3.GARJ.17*/
    const escHandler = (e) => {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-confirm').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });
  }

  /*@3.GARJ.18*/
  const THEME_META_COLOR = { light: '#ffffff', dark: '#1f2937', dim: '#171923' };
  /*@3.GARJ.646*/
  const APP_SHELL_COLOR = '#1f2937';
  const INSTALLED_MODES = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
  function isInstalledShell() {
    try {
      if (window.navigator && window.navigator.standalone === true) return true;
      if (!window.matchMedia) return false;
      return INSTALLED_MODES.some(function (m) {
        return window.matchMedia('(display-mode: ' + m + ')').matches;
      });
    } catch (e) { return false; }
  }
  function updateThemeColorMeta(theme) {
    const color = isInstalledShell()
      ? APP_SHELL_COLOR
      : (THEME_META_COLOR[theme] || THEME_META_COLOR.dark);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      (document.head || document.documentElement).appendChild(meta);
    }
    meta.setAttribute('content', color);
  }
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    /*@3.GARJ.552*/
    var _prevTheme = localStorage.getItem('garden_theme');
    localStorage.setItem('garden_theme', theme);
    if (_prevTheme && _prevTheme !== theme) window.GardenEv('theme_switch', { t: theme });
    updateThemeColorMeta(theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerHTML = '<i class="'
      + (THEME_ICONS[theme] || 'fa-solid fa-moon') + '" aria-hidden="true"></i>';
  }
  function cycleTheme() {
    applyTheme(THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length]);
    if (document.querySelector('.mermaid')) location.reload();
  }

  /*@3.GARJ.19*/

  /*@3.GARJ.20*/
  function localizeNode(el, lang) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute('data-i18n')) {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang]?.[key]) el.textContent = i18n[lang][key];
    }
    if (el.hasAttribute('data-ar') && el.hasAttribute('data-en')) {
      const txt = el.getAttribute('data-' + lang);
      if (txt != null) el.textContent = txt;
    }
    if (el.hasAttribute('data-ar-placeholder') && el.hasAttribute('data-en-placeholder')) {
      const ph = el.getAttribute('data-' + lang + '-placeholder');
      if (ph != null) el.placeholder = ph;
    }
    /*@3.GARJ.21*/
    if (el.hasAttribute('data-ar-title') && el.hasAttribute('data-en-title')) {
      const tt = el.getAttribute('data-' + lang + '-title');
      if (tt != null) {
        el.setAttribute('title', tt);
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', tt);
      }
    }
  }
  function localize(root, lang) {
    lang = lang || currentLang || document.documentElement.getAttribute('lang') || 'ar';
    if (!root) return;
    localizeNode(root, lang);
    const scope = root.querySelectorAll ? root : document;
    scope.querySelectorAll(
      '[data-i18n],[data-ar][data-en],[data-ar-placeholder][data-en-placeholder],[data-ar-title][data-en-title]'
    ).forEach(el => localizeNode(el, lang));
  }

  function setLanguage(lang) {
    currentLang = lang;
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    var _prevLang = localStorage.getItem('garden_lang');
    localStorage.setItem('garden_lang', lang);
    if (_prevLang && _prevLang !== lang) window.GardenEv('lang_switch', { l: lang });

    localize(document, lang);
    document.querySelectorAll('[data-bilingual]').forEach(container => {
      const tpl = container.querySelector(`.content-${lang}`);
      const target = container.querySelector('.content-target');
      if (tpl && target) target.innerHTML = tpl.innerHTML;
    });
    document.querySelectorAll('.smart-term').forEach(term => {
      const tip = term._gardenTip;
      if (!tip) return;
      const enDef = term.getAttribute('data-en-def') || '';
      const termEn = term.getAttribute('data-term-en') || '';
      updateTooltipContent(tip, termEn, enDef, lang);
    });
    /*@3.GARJ.22*/
    if (typeof initSmartTermTooltips === 'function') initSmartTermTooltips();
    /*@3.GARJ.23*/
    const langText = lang === 'ar' ? 'EN' : 'AR';
    const ll = document.getElementById('lang-label');
    if (ll) ll.textContent = langText;
    const lb = document.getElementById('lang-btn');
    if (lb) lb.textContent = langText;

    if (window._gardenFC.cards) { const wasFlipped = document.getElementById('fc-card')?.classList.contains('flipped'); renderFlashcard(); if (wasFlipped) flipCard(); }
    if (window._gardenQuiz.questions) renderQuestion();
    if (typeof window._algoRefresh === 'function') window._algoRefresh();

    /*@3.GARJ.24*/
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise().catch((err) => console.log('MathJax Error:', err));
    }
    /*@3.GARJ.25*/
    document.dispatchEvent(new CustomEvent('garden:languageChanged', { detail: { lang } }));
  }
  function toggleLanguage() { setLanguage(currentLang === 'ar' ? 'en' : 'ar'); }

  /*@3.GARJ.26*/
  function initDepthTabs() {
    document.querySelectorAll('.depth-tabs').forEach(tg => {
      const card = tg.closest('.concept-card'); if (!card) return;
      const tabs = tg.querySelectorAll('.depth-tab');
      const layers = card.querySelectorAll('.depth-layer');
      tabs.forEach(tab => tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-layer');
        tabs.forEach(x => x.classList.remove('active'));
        layers.forEach(x => x.classList.remove('active'));
        tab.classList.add('active');
        card.querySelector(`.depth-layer[data-layer="${t}"]`)?.classList.add('active');
      }));
    });
  }

  /*@3.GARJ.27*/
  function initAccordion() {
    document.querySelectorAll('.accordion-trigger').forEach(tr => {
      tr.addEventListener('click', () => {
        const item = tr.closest('.accordion-item');
        const was = item.classList.contains('open');
        item.closest('.accordion')?.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
        if (!was) item.classList.add('open');
      });
    });
  }

  /*@3.GARJ.28*/
  window._gardenFC = { _undoStack: [] };

  function fcKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    const m = document.documentElement.getAttribute('data-module') || '0';
    return `garden_${s}_m${m}_fc`;
  }
  function sm2Calc(card, grade) {
    let { n, ef, interval } = card;
    if (grade >= 3) {
      interval = n === 0 ? 1 : n === 1 ? 6 : Math.round(interval * ef);
      n++;
    } else { n = 0; interval = 1; }
    ef = Math.max(1.3, ef + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    return { n, ef, interval, nextReview: Date.now() + interval * 86400000, lastGrade: grade };
  }

  /*@3.GARJ.29*/
  function calcRetrieval(state) {
    if (!state || !state.n || state.n === 0 || !state.interval || state.interval <= 0) return null;
    const lastReview = state.nextReview - state.interval * 86400000;
    const t = (Date.now() - lastReview) / 86400000; /*@3.GARJ.30*/
    if (t < 0) return 100;
    return Math.max(0, Math.min(100, Math.round(Math.pow(0.9, t / state.interval) * 100)));
  }
  function newCard() { return { n: 0, ef: 2.5, interval: 0, nextReview: Date.now(), failCount: 0, buriedUntil: 0 }; }

  /*@3.GARJ.31*/
  function _fcIsPlaceholder(s) {
    const t = String(s == null ? '' : s).trim();
    return /^\[[A-Z][A-Z_]*\]$/.test(t) || t === 'null' || t === 'undefined';
  }
  function _fcTxt(s) { return _fcIsPlaceholder(s) ? '' : (s || ''); }
  function _fcHasExample(card) {
    const e = card && card.back && card.back.example;
    return !!e && !!(_fcTxt(e.ar) || _fcTxt(e.en));
  }

  /*@3.GARJ.32*/
  function getMobile3D() {
    try { return localStorage.getItem('garden_mobile_3d') !== '0'; } catch (e) { return true; }
  }
  function setMobile3D(val) {
    try { localStorage.setItem('garden_mobile_3d', val ? '1' : '0'); } catch (e) { }
    document.documentElement.classList.toggle('mobile-3d-off', !val);
    /*@3.GARJ.33*/
    document.querySelectorAll('.fc-3d-btn').forEach(function (btn) {
      btn.classList.toggle('active', val);
      btn.setAttribute('aria-pressed', val ? 'true' : 'false');
      btn.title = val
        ? (document.documentElement.lang === 'ar' ? '3D مفعّل — اضغط لإيقافه' : '3D ON — tap to disable')
        : (document.documentElement.lang === 'ar' ? '3D معطّل — اضغط لتفعيله' : '3D OFF — tap to enable');
    });
  }
  /*@3.GARJ.34*/
  window._gardenGetMobile3D = getMobile3D;
  window._gardenSetMobile3D = setMobile3D;
  window._gardenToggle3D = function () { setMobile3D(!getMobile3D()); };
  /*@3.GARJ.35*/
  document.documentElement.classList.toggle('mobile-3d-off', !getMobile3D());

  function isReviewPage() {
    const page = document.documentElement.getAttribute('data-page') || '';
    const module = document.documentElement.getAttribute('data-module') || '';
    return page === 'review'
      || ['review', 'midterm', 'final'].includes(module)
      || (module !== '0' && isNaN(Number(module)));
  }

  /*@3.GARJ.36*/
  function activityKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    return 'garden_' + s + '_activity';
  }
  function recordDailyActivity() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = JSON.parse(localStorage.getItem(activityKey()) || '{}');
      data[today] = (data[today] || 0) + 1;
      localStorage.setItem(activityKey(), JSON.stringify(data));
    } catch (e) { }
  }
  function calculateStreak() {
    try {
      const data = JSON.parse(localStorage.getItem(activityKey()) || '{}');
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (data[key] && data[key] > 0) { streak++; } else if (i > 0) break;
      }
      return streak;
    } catch (e) { return 0; }
  }
  function getActivityData() {
    try { return JSON.parse(localStorage.getItem(activityKey()) || '{}'); } catch (e) { return {}; }
  }

  /*@3.GARJ.37*/
  function retentionKey() { return fcKey() + '_ret'; }
  function recordRetention(success) {
    try {
      const d = JSON.parse(localStorage.getItem(retentionKey()) || '{"t":0,"c":0}');
      d.t++; if (success) d.c++;
      localStorage.setItem(retentionKey(), JSON.stringify(d));
    } catch (e) { }
  }
  function getRetentionRate() {
    try {
      const d = JSON.parse(localStorage.getItem(retentionKey()) || '{"t":0,"c":0}');
      return d.t > 0 ? Math.round((d.c / d.t) * 100) : null;
    } catch (e) { return null; }
  }

  /*@3.GARJ.38*/
  function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * -canvas.height * 0.5,
      r: Math.random() * 8 + 4, c: 'hsl(' + Math.round(Math.random() * 360) + ',80%,60%)',
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8
    }));
    let frame = 0;
    (function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r / 1.5);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.05;
      });
      if (++frame < 120) requestAnimationFrame(draw); else canvas.remove();
    })();
  }

  function loadSM2() { try { return JSON.parse(localStorage.getItem(fcKey())) || {}; } catch (e) { return {}; } }
  function saveSM2(st) {
    try { localStorage.setItem(fcKey(), JSON.stringify(st)); }
    catch (e) { if (e.name === 'QuotaExceededError') { Object.keys(localStorage).filter(k => k.startsWith('garden_') && k.endsWith('_fc')).sort().slice(0, 1).forEach(k => localStorage.removeItem(k)); try { localStorage.setItem(fcKey(), JSON.stringify(st)) } catch (e2) { } } }
  }

  function initFlashcards() {
    const el = document.getElementById('flashcard-data');
    if (!el) return;
    try { window._gardenFC.cards = JSON.parse(el.textContent); } catch (e) { return; }
    window._gardenFC.sm2 = loadSM2();
    buildQueue();
    renderFlashcard();
    updateDueCount();
  }

  function buildQueue(filterMode) {
    const fc = window._gardenFC;
    const now = Date.now();

    /*@3.GARJ.39*/
    if (isReviewPage()) {
      fc.queue = fc.cards.map((card, i) => ({
        card, i,
        state: fc.sm2[i] || newCard(),
        _isOriginallyNew: !fc.sm2[i] || fc.sm2[i].n === 0
      }));
      fc.pos = 0; fc.totalOriginal = fc.queue.length; fc.completed = 0;
      fc.filterMode = null; fc._isReview = true;
      return;
    }

    /*@3.GARJ.40*/
    fc._isReview = false;
    /*@3.GARJ.41*/
    try {
      const saved = parseInt(localStorage.getItem('garden_daily_new_limit'));
      fc.dailyNewLimit = (!isNaN(saved) && saved > 0) ? saved : (fc.dailyNewLimit || 10);
    } catch (e) { fc.dailyNewLimit = fc.dailyNewLimit || 10; }
    const DAILY_NEW_LIMIT = fc.dailyNewLimit;

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = fcKey() + '_dn_' + today;
    let dailyNewCount = 0;
    try { dailyNewCount = parseInt(localStorage.getItem(dailyKey) || '0'); } catch (e) { }
    fc._dailyKey = dailyKey; fc._dailyNewCount = dailyNewCount;

    fc.queue = fc.cards
      .map((card, i) => ({
        card, i,
        state: fc.sm2[i] || newCard(),
        /*@3.GARJ.42*/
        _isOriginallyNew: !fc.sm2[i] || fc.sm2[i].n === 0
      }))
      .filter(({ i, state, _isOriginallyNew }) => {
        if (state.buriedUntil && state.buriedUntil > now) return false;
        const isDue = state.nextReview <= now;
        if (!isDue) return false;
        if (filterMode === 'new') return _isOriginallyNew;
        if (filterMode === 'learning') return fc.sm2[i] && fc.sm2[i].n > 0 && fc.sm2[i].interval < 21;
        if (filterMode === 'mastered') return fc.sm2[i] && fc.sm2[i].interval >= 21;
        if (filterMode === 'leech') return fc.sm2[i] && (fc.sm2[i].failCount || 0) >= 8;
        if (_isOriginallyNew && dailyNewCount >= DAILY_NEW_LIMIT) return false;
        return true;
      });
    fc.pos = 0; fc.totalOriginal = fc.queue.length; fc.completed = 0;
    fc.filterMode = filterMode || null;
  }

  /*@3.GARJ.43*/
  function ghostsHTML(remaining, nextCard, L, label) {
    const n = Math.max(0, Math.min(3, (remaining | 0) - 1));
    let out = '';
    for (let i = 0; i < n; i++) {
      if (i === 0 && nextCard) {
        const t = _fcTxt(nextCard.front?.[L] || nextCard.front?.ar || nextCard.front?.en || '');
        out += `<i class="fc-ghost fc-ghost--next" aria-hidden="true">` +
          (label ? `<span class="fc-g-pill">${escHtml(label)}</span>` : '') +
          `<span class="fc-g-term">${escHtml(t)}</span></i>`;
        continue;
      }
      out += '<i class="fc-ghost" aria-hidden="true"></i>';
    }
    return out;
  }

  /*@3.GARJ.44*/
  const MATH_RE = /\$[^$\n]+\$|\\\(|\\\[/;

  /*@3.GARJ.45*/
  const _SUP = /(\{[^}]{1,12}\}|[A-Za-z0-9\)\]])\^(\{[^}]{1,12}\}|-?[A-Za-z0-9]{1,4})/g;
  const _SUB = /\b([A-Za-z])_(\{[^}]{1,10}\}|[A-Za-z0-9]{1,2})\b/g;
  /*@3.GARJ.46*/
  const _RUN = /[A-Za-z0-9\(\[][^؀-ۿ\n]{0,80}(?:=|≡|≤|≥|\bmod\b)[^؀-ۿ\n]{0,80}[A-Za-z0-9\)\]]/g;
  function _braces(s) { return s.replace(/^\{|\}$/g, ''); }

  function _supSub(s) {
    return s
      .replace(_SUP, (m, a, b) => a + '<sup>' + _braces(b) + '</sup>')
      .replace(_SUB, (m, a, b) => a + '<sub>' + _braces(b) + '</sub>');
  }

  /*@3.GARJ.47*/
  const _MATH_WORDS = /^(mod|sqrt|log|ln|exp|max|min|sin|cos|tan|true|false|null|and|xor|not|div|gcd|lcm)$/i;
  function _isFormula(m) {
    if (m.length > 44) return false;
    const words = m.match(/[A-Za-z]{4,}/g);
    return !words || words.every((w) => _MATH_WORDS.test(w));
  }

  function mathText(s) {
    if (!s) return '';
    const str = String(s);
    if (MATH_RE.test(str)) return str;        /*@3.GARJ.48*/
    let out = '', last = 0, m;
    _RUN.lastIndex = 0;
    while ((m = _RUN.exec(str)) !== null) {
      out += _supSub(str.slice(last, m.index));
      out += _isFormula(m[0])
        ? '<span class="fc-math">' + _supSub(m[0]) + '</span>'
        : _supSub(m[0]);
      last = m.index + m[0].length;
    }
    out += _supSub(str.slice(last));
    return out;
  }

  /*@3.GARJ.49*/
  const MATH_SEL = '.fc-term .content-target, .fc-term-en, .fc-definition .content-target,' +
    '.fc-example .content-target, .fc-g-term,' +
    '.fc-term, .fc-definition, .fc-example';
  function enhanceMath(root) {
    if (!root) return;
    root.querySelectorAll(MATH_SEL).forEach((el) => {
      if (el.dataset.mathDone === '1') return;
      if (el.querySelector('.content-target')) return;   /*@3.GARJ.50*/
      const raw = el.textContent || '';
      const html = mathText(raw);
      if (html !== raw) el.innerHTML = html;
      el.dataset.mathDone = '1';
    });
  }

  let _mathLoading = null;
  function typesetMath(el) {
    if (!el) return;
    enhanceMath(el);
    if (!MATH_RE.test(el.textContent || '')) return;
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise([el]).catch(() => { });
      return;
    }
    if (!_mathLoading) {
      window.MathJax = window.MathJax || {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        chtml: { displayAlign: 'left' },
        options: { enableMenu: false }
      };
      _mathLoading = new Promise((res) => {
        /*@3.GARJ.573*/
        const SCRIPT_ID = 'MathJax-script-live';
        const ready = () => !!(window.MathJax && MathJax.typesetPromise);
        var pending = document.getElementById(SCRIPT_ID);
        const holder = document.getElementById('MathJax-script');
        if (!pending && holder && holder.getAttribute('data-src') && !holder.getAttribute('src')) {
          pending = document.createElement('script');
          pending.id = SCRIPT_ID;
          pending.async = true;
          pending.src = holder.getAttribute('data-src');
          (document.head || document.documentElement).appendChild(pending);
        }
        if (pending) {
          if (ready()) return res(true);
          pending.addEventListener('load', () => res(true));
          pending.addEventListener('error', () => res(false));
          setTimeout(() => res(ready()), 15000);
          return;
        }
        const s = document.createElement('script');
        s.id = SCRIPT_ID;
        s.async = true;
        /*@3.GARJ.569*/
        s.src = ROOT + 'shared/vendor/mathjax/tex-mml-chtml.js';
        s.onload = () => res(true);
        s.onerror = () => res(false);
        document.head.appendChild(s);
      });
    }
    _mathLoading.then((ok) => {
      if (ok && window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([el]).catch(() => { });
      }
    });
  }
  window.GardenMath = { typeset: typesetMath, text: mathText, enhance: enhanceMath };

  /*@3.GARJ.51*/
  const TAP_SEEN = 'garden_fc_tap_seen';
  function tapSeen() { try { return localStorage.getItem(TAP_SEEN) === '1'; } catch (e) { return false; } }
  function markTapSeen() { try { localStorage.setItem(TAP_SEEN, '1'); } catch (e) {} }
  function tapHintHTML(L) {
    if (tapSeen()) return '';
    return '<div class="fc-tap"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i>' +
      '<span>' + (L === 'ar' ? 'اضغط البطاقة لقلبها' : 'Tap the card to flip') + '</span></div>';
  }

  /*@3.GARJ.52*/
  function fcSubjectLabel() {
    return (document.querySelector('meta[name="course-name"]')?.content) ||
      (document.documentElement.getAttribute('data-subject') || '');
  }

  function fcTopHTML(L, num, total, isBack) {
    const subj = document.documentElement.getAttribute('data-subject') || '';
    const name = (document.querySelector('meta[name="course-name"]')?.content) ||
      (L === 'ar' ? subj : subj);
    const pos = String(num).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    return `<div class="fc-top">
      <span class="fc-pos">${pos}</span>
      <span class="fc-pill"><i class="fa-solid fa-atom" aria-hidden="true"></i>${name}</span>
      ${isBack ? `<span class="fc-ans"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>${L === 'ar' ? 'الإجابة' : 'Answer'}</span>` : '<span></span>'}
    </div>`;
  }

  function renderFlashcard() {
    const fc = window._gardenFC;
    /*@3.GARJ.53*/
    if (fc._deferRender) return;
    const box = document.getElementById('fc-container');
    if (!box) return;
    const L = currentLang;

    /*@3.GARJ.54*/
    const mode = fc.browseMode ? 'browse' : (fc.practiceMode ? 'practice' : 'learn');

    if (mode !== 'learn') return renderLoose(fc, box, L, mode);

    /*@3.GARJ.55*/
    if (!fc.queue || fc.queue.length === 0 || fc.pos >= fc.queue.length) {
      const fcInfoText = (i18n[L]?.['fc.info'] || '').split('\n').join('<br>');
      box.innerHTML = `
        <div class="fc-toolbar">
          <div class="flashcard-counter" style="visibility:hidden">—</div>
          <div class="fc-toolbar-actions">
            <button class="fc-mini-btn" onclick="Garden.resetFC('all')" title="${i18n[L]?.['fc.reset'] || 'Reset'}"><i class="fa-solid fa-eraser" aria-hidden="true"></i></button>
            <button class="fc-report-btn" onclick="Garden.report()" title="${L === 'ar' ? 'تقرير SM-2' : 'SM-2 Report'}"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i></button>
            <span class="fc-info-btn" tabindex="0" data-fc-info="${encodeURIComponent(fcInfoText)}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>
          </div>
        </div>
        <div class="fc-empty">
          <div class="fc-empty-icon"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>
          <p>${i18n[L]?.['fc.none_due'] || ''}</p>
          <div class="fc-actions">
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.browse()">${L === 'ar' ? 'تصفّح البطاقات' : 'Browse cards'}</button>
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.practice()">${i18n[L]?.['fc.practice'] || ''}</button>
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.quickReview()">${i18n[L]?.['fc.quick'] || 'Quick (10)'}</button>
            <button class="fc-reset-btn" onclick="Garden.resetFC('all')">${i18n[L]?.['fc.reset_all'] || ''}</button>
            <button class="fc-reset-btn" onclick="Garden.resetFC('hard')">${i18n[L]?.['fc.reset_hard'] || ''}</button>
          </div>
          <div class="fc-filter-row">
            <button class="fc-filter-btn${!fc.filterMode ? ' active' : ''}" onclick="Garden.filterFC(null)">${i18n[L]?.['fc.filter.all'] || 'All'}</button>
            <button class="fc-filter-btn${fc.filterMode === 'new' ? ' active' : ''}" onclick="Garden.filterFC('new')">${i18n[L]?.['fc.filter.new'] || 'New'}</button>
            <button class="fc-filter-btn${fc.filterMode === 'learning' ? ' active' : ''}" onclick="Garden.filterFC('learning')">${i18n[L]?.['fc.filter.learning'] || 'Learning'}</button>
            <button class="fc-filter-btn${fc.filterMode === 'mastered' ? ' active' : ''}" onclick="Garden.filterFC('mastered')">${i18n[L]?.['fc.filter.mastered'] || 'Mastered'}</button>
            <button class="fc-filter-btn${fc.filterMode === 'leech' ? ' active' : ''}" onclick="Garden.filterFC('leech')">${i18n[L]?.['fc.filter.leech'] || 'Leeches'}</button>
          </div>
          <div class="fc-daily-limit-row">
            <span class="fc-dl-label"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> ${L === 'ar' ? 'حد البطاقات الجديدة يومياً:' : 'Daily new cards limit:'}</span>
            <div class="fc-dl-controls">
              <button class="fc-dl-btn" onclick="Garden.changeDailyLimit(-5)">−</button>
              <span class="fc-dl-value" id="fc-dl-value">${fc.dailyNewLimit || 10}</span>
              <button class="fc-dl-btn" onclick="Garden.changeDailyLimit(+5)">+</button>
            </div>
          </div>
        </div>`;
      return;
    }

    const item = fc.queue[fc.pos];
    const card = item.card;
    const num = fc.completed + 1;
    /*@3.GARJ.56*/
    const uniqueRemaining = new Set(fc.queue.map(q => q.i)).size;
    const total = fc.completed + uniqueRemaining;

    /*@3.GARJ.57*/
    const ret = calcRetrieval(item.state);
    const retBadge = ret !== null
      ? (() => {
        const cls = ret >= 80 ? 'fc-ret--high' : ret >= 50 ? 'fc-ret--mid' : 'fc-ret--low';
        const label = L === 'ar' ? `تذكّر ${ret}%` : `Memory ${ret}%`;
        return `<div class="fc-ret-badge ${cls}" title="${L === 'ar' ? 'احتمالية تذكّر البطاقة الآن' : 'Estimated probability of recalling this card now'}">${label}</div>`;
      })()
      : '';

    /*@3.GARJ.58*/
    const undoCount = fc._undoStack ? fc._undoStack.length : 0;
    const undoLabel = undoCount > 1
      ? (i18n[L]?.['fc.undo'] || 'Undo') + ` (${undoCount})`
      : (i18n[L]?.['fc.undo'] || 'Undo');

    box.innerHTML = `
      <div class="fc-toolbar">
        <div class="flashcard-counter">${fc._isReview
        ? '<span class="fc-review-badge">' + (L === 'ar' ? 'وضع المراجعة' : 'Review Mode') + '</span>'
        : ''}</div>
        <div class="fc-toolbar-actions">
          <button class="fc-toolbar-bury" onclick="Garden.bury()" title="${L === 'ar' ? 'يرجئ هذه البطاقة ليوم الغد' : 'Postpone this card until tomorrow'}"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i><span>${L === 'ar' ? 'تأجيل' : 'Bury'}</span></button>
          <button class="fc-mini-btn fc-undo-mini" onclick="Garden.undo()" ${undoCount ? '' : 'disabled'} title="${L === 'ar' ? 'تراجع عن آخر تقييم' : 'Undo last grade'}"><i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i>${undoCount > 1 ? '<b>' + undoCount + '</b>' : ''}</button>
          <button class="fc-mini-btn" onclick="Garden.browse()" title="${L === 'ar' ? 'تصفّح كل البطاقات بحرّية' : 'Browse all cards freely'}"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></button>
          <button class="fc-mini-btn" onclick="Garden.resetFC('all')" title="${i18n[L]?.['fc.reset'] || 'Reset'}"><i class="fa-solid fa-eraser" aria-hidden="true"></i></button>
          <button class="fc-report-btn" onclick="Garden.report()" title="${L === 'ar' ? 'تقرير SM-2' : 'SM-2 Report'}"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i></button>
          <button class="fc-3d-btn${getMobile3D() ? ' active' : ''}" onclick="window._gardenToggle3D()" title="${getMobile3D() ? (L === 'ar' ? '3D مفعّل — اضغط لإيقافه' : '3D ON — tap to disable') : (L === 'ar' ? '3D معطّل — اضغط لتفعيله' : '3D OFF — tap to enable')}">3D</button>
          <span class="fc-info-btn" tabindex="0" data-fc-info="${encodeURIComponent((i18n[L]?.['fc.info'] || '').replace(/\n/g, '<br>'))}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>
        </div>
      </div>
      <div class="flashcard-scene">
        ${ghostsHTML(uniqueRemaining, fc.queue[fc.pos + 1]?.card, L, fcSubjectLabel())}
        <div class="flashcard-card" id="fc-card" onclick="Garden.flip()">
          <div class="flashcard-face flashcard-front">
            ${fcTopHTML(L, num, total, false)}
            <div class="fc-body">
              ${(item.state.failCount || 0) >= 8 ? ('<div class="fc-leech-badge" title="' + (i18n[L]?.['fc.leech_warning'] || 'Leech') + '">' + '<i class="fa-solid fa-fire" aria-hidden="true"></i> ' + (i18n[L]?.['fc.leech'] || 'Leech') + '</div>') : ''}
              ${retBadge}
              <div class="fc-term" data-bilingual>
                <template class="content-ar">${card.front?.ar || ''}</template>
                <template class="content-en">${card.front?.en || ''}</template>
                <div class="content-target">${card.front?.[L] || ''}</div>
              </div>
              <div class="fc-term-en">${L === 'ar' ? (card.front?.en || '') : ''}</div>
            </div>
            <div class="fc-rule" aria-hidden="true"><i></i><b></b><i></i></div>
            ${tapHintHTML(L)}
          </div>
          <div class="flashcard-face flashcard-back">
            ${fcTopHTML(L, num, total, true)}
            <div class="fc-body">
              <div class="fc-definition" data-bilingual>
                <template class="content-ar">${card.back?.definition?.ar || ''}</template>
                <template class="content-en">${card.back?.definition?.en || ''}</template>
                <div class="content-target">${card.back?.definition?.[L] || ''}</div>
              </div>
            </div>
            <div class="fc-rule" aria-hidden="true"><i></i><b></b><i></i></div>
            ${_fcHasExample(card) ? `<div class="fc-example" data-bilingual>
              <template class="content-ar">${_fcTxt(card.back.example.ar)}</template>
              <template class="content-en">${_fcTxt(card.back.example.en)}</template>
              <div class="content-target">${_fcTxt(card.back.example[L])}</div>
            </div>`: ''}
          </div>
        </div>
      </div>
      <div class="sm2-grades hidden" id="fc-grades">
        <button class="sm2-btn sm2-btn--0" onclick="Garden.grade(0)">${i18n[L]?.['fc.grade.0'] || '0'}</button>
        <button class="sm2-btn sm2-btn--2" onclick="Garden.grade(2)">${i18n[L]?.['fc.grade.2'] || '2'}</button>
        <button class="sm2-btn sm2-btn--3" onclick="Garden.grade(3)">${i18n[L]?.['fc.grade.3'] || '3'}</button>
        <button class="sm2-btn sm2-btn--4" onclick="Garden.grade(4)">${i18n[L]?.['fc.grade.4'] || '4'}</button>
        <button class="sm2-btn sm2-btn--5" onclick="Garden.grade(5)">${i18n[L]?.['fc.grade.5'] || '5'}</button>
      </div>
`;
    typesetMath(box);
  }

  function flipCard() {
    const c = document.getElementById('fc-card');
    const g = document.getElementById('fc-grades');
    if (c) c.classList.toggle('flipped');
    if (c && c.classList.contains('flipped')) window.GardenEv('card_flip', {
      s: document.documentElement.getAttribute('data-subject') || ''
    });
    if (g) g.classList.toggle('hidden', !c?.classList.contains('flipped'));
    /*@3.GARJ.59*/
    if (c && c.classList.contains('flipped') && !tapSeen()) {
      markTapSeen();
      const t = document.querySelector('.fc-tap');
      if (t) t.remove();
    }
  }

  /*@3.GARJ.60*/
  function startPractice() {
    const fc = window._gardenFC;
    if (!fc.cards || fc.cards.length === 0) return;
    /*@3.GARJ.61*/
    fc.practiceMode = true;
    fc.browseMode = false;
    const _all = fc.cards.map((card, i) => ({ card, i }));
    for (let _i = _all.length - 1; _i > 0; _i--) {
      const _j = Math.floor(Math.random() * (_i + 1));
      [_all[_i], _all[_j]] = [_all[_j], _all[_i]];
    }
    fc.practiceQueue = _all;
    fc.practicePos = 0;
    renderFlashcard();
  }

  /*@3.GARJ.62*/
  function renderPractice() { renderFlashcard(); }

  /*@3.GARJ.63*/
  function renderLoose(fc, box, L, mode) {
    const q = fc.practiceQueue || [];
    const pos = fc.practicePos || 0;

    if (!q.length) { fc.practiceMode = false; fc.browseMode = false; return renderFlashcard(); }
    if (pos >= q.length) {
      /*@3.GARJ.64*/
      if (mode === 'browse') { fc.practicePos = 0; return renderFlashcard(); }
      fc.practiceMode = false;
      box.innerHTML = `
        <div class="fc-empty">
          <div class="fc-empty-icon"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>
          <p>${i18n[L]?.['fc.practice_done'] || ''}</p>
          <div class="fc-actions">
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.practice()">${i18n[L]?.['fc.practice'] || ''}</button>
            <button class="fc-reset-btn" onclick="Garden.exitLoose()">${L === 'ar' ? 'عودة للمراجعة المجدولة' : 'Back to scheduled review'}</button>
          </div>
        </div>`;
      return;
    }

    const item = q[pos];
    const card = item.card;
    const num = pos + 1, total = q.length;
    const badge = mode === 'browse'
      ? (L === 'ar' ? 'تصفّحٌ حرّ — لا يؤثّر على تقدّمك' : 'Free browsing — does not affect your progress')
      : (i18n[L]?.['fc.practice_badge'] || '');

    box.innerHTML = `
      <div class="fc-practice-badge">${badge}</div>
      ${fcToolbarHTML(L, num, total, mode)}
      <div class="flashcard-scene">
        ${ghostsHTML(total - pos, q[pos + 1]?.card, L, fcSubjectLabel())}
        <div class="flashcard-card" id="fc-card" onclick="Garden.flip()">
          <div class="flashcard-face flashcard-front">
            ${fcTopHTML(L, num, total, false)}
            <div class="fc-body">
              <div class="fc-term" data-bilingual>
                <template class="content-ar">${card.front?.ar || ''}</template>
                <template class="content-en">${card.front?.en || ''}</template>
                <div class="content-target">${card.front?.[L] || ''}</div>
              </div>
              <div class="fc-term-en">${L === 'ar' ? (card.front?.en || '') : ''}</div>
            </div>
            <div class="fc-rule" aria-hidden="true"><i></i><b></b><i></i></div>
            ${tapHintHTML(L)}
          </div>
          <div class="flashcard-face flashcard-back">
            ${fcTopHTML(L, num, total, true)}
            <div class="fc-body">
              <div class="fc-definition" data-bilingual>
                <template class="content-ar">${card.back?.definition?.ar || ''}</template>
                <template class="content-en">${card.back?.definition?.en || ''}</template>
                <div class="content-target">${card.back?.definition?.[L] || ''}</div>
              </div>
            </div>
            <div class="fc-rule" aria-hidden="true"><i></i><b></b><i></i></div>
            ${_fcHasExample(card) ? `<div class="fc-example" data-bilingual>
              <template class="content-ar">${_fcTxt(card.back.example.ar)}</template>
              <template class="content-en">${_fcTxt(card.back.example.en)}</template>
              <div class="content-target">${_fcTxt(card.back.example[L])}</div>
            </div>`: ''}
          </div>
        </div>
      </div>
      ${fcNavHTML(L, pos, total)}`;
    typesetMath(box);
  }

  /*@3.GARJ.65*/
  function fcNavHTML(L, pos, total) {
    return `<div class="fc-nav">
      <button class="fc-nav-btn" type="button" onclick="Garden.loosePrev()" ${pos <= 0 ? 'disabled' : ''}
        aria-label="${L === 'ar' ? 'السابق' : 'Previous'}"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      <span class="fc-nav-pos">${pos + 1} / ${total}</span>
      <button class="fc-nav-btn" type="button" onclick="Garden.looseNext()"
        aria-label="${L === 'ar' ? 'التالي' : 'Next'}"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
    </div>`;
  }

  function fcToolbarHTML(L, num, total, mode) {
    return `<div class="fc-toolbar">
      <div class="flashcard-counter"></div>
      <div class="fc-toolbar-actions">
        <button class="fc-mini-btn" onclick="Garden.exitLoose()" title="${L === 'ar' ? 'عودة للمراجعة المجدولة' : 'Back to scheduled review'}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <button class="fc-report-btn" onclick="Garden.report()" title="${L === 'ar' ? 'تقرير SM-2' : 'SM-2 Report'}"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i></button>
      </div>
    </div>`;
  }

  function loosePrev() {
    const fc = window._gardenFC;
    if ((fc.practicePos || 0) > 0) { fc.practicePos--; renderFlashcard(); }
  }
  function looseNext() {
    const fc = window._gardenFC;
    fc.practicePos = (fc.practicePos || 0) + 1;
    renderFlashcard();
  }
  function exitLoose() {
    const fc = window._gardenFC;
    fc.practiceMode = false; fc.browseMode = false;
    renderFlashcard();
  }

  /*@3.GARJ.66*/
  function startBrowse() {
    const fc = window._gardenFC;
    if (!fc.cards || !fc.cards.length) return;
    fc.browseMode = true;
    fc.practiceMode = false;
    fc.practiceQueue = fc.cards.map((card, i) => ({ card, i }));
    fc.practicePos = 0;
    renderFlashcard();
    document.getElementById('fc-container')?.scrollIntoView({ block: 'nearest' });
  }

  /*@3.GARJ.67*/
  function exitClassFor(g) {
    return g >= 4 ? 'fc-exit-away' : g === 3 ? 'fc-exit-slide' : 'fc-exit-back';
  }
  const EXIT_MS = 420;
  function _reduced() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  /*@3.GARJ.68*/
  function gradeCard(grade) {
    const c = document.getElementById('fc-card');
    /*@3.GARJ.69*/
    if (c && c.dataset.exiting === '1') return;
    if (!c || _reduced()) { _gradeCardNow(grade); return; }

    const fc = window._gardenFC;
    c.dataset.exiting = '1';
    c.classList.add(exitClassFor(grade));
    const g = document.getElementById('fc-grades');
    if (g) g.style.pointerEvents = 'none';

    fc._deferRender = true;
    let done = false;
    /*@3.GARJ.70*/
    const finish = () => {
      if (done) return;
      done = true;
      fc._deferRender = false;
      renderFlashcard();
    };
    c.addEventListener('animationend', finish, { once: true });
    try { _gradeCardNow(grade); }          /*@3.GARJ.71*/
    finally { setTimeout(finish, EXIT_MS + 140); }
  }

  function _gradeCardNow(grade) {
    const fc = window._gardenFC;
    if (!fc.queue || fc.pos >= fc.queue.length) return;
    const item = fc.queue[fc.pos];

    /*@3.GARJ.72*/
    if (!fc._undoStack) fc._undoStack = [];
    fc._undoStack.push({
      itemIndex: item.i,
      sm2Snapshot: JSON.parse(JSON.stringify(fc.sm2)),  /*@3.GARJ.73*/
      queue: fc.queue.map(q => ({
        card: q.card, i: q.i,
        state: JSON.parse(JSON.stringify(q.state)),
        retryCount: q.retryCount || 0,
        _isOriginallyNew: q._isOriginallyNew || false
      })),
      pos: fc.pos,
      completed: fc.completed,
      dailyNewCount: fc._dailyNewCount || 0
    });
    if (fc._undoStack.length > 5) fc._undoStack.shift();  /*@3.GARJ.74*/

    if (grade >= 3) {
      /*@3.GARJ.75*/
      const updated = sm2Calc(item.state, grade);

      /*@3.GARJ.76*/
      const prevFail = item.state.failCount || 0;
      if (updated.interval >= 21) {
        /*@3.GARJ.77*/
        updated.failCount = 0;
      } else if (prevFail > 0 && updated.n > 2) {
        /*@3.GARJ.78*/
        updated.failCount = prevFail - 1;
      } else {
        updated.failCount = prevFail;
      }
      updated.buriedUntil = 0;

      if (!fc._isReview) {
        fc.sm2[item.i] = updated;
        saveSM2(fc.sm2);
        recordRetention(true);
        recordDailyActivity();
        /*@3.GARJ.79*/
        if (item._isOriginallyNew) {
          const dn = (fc._dailyNewCount || 0) + 1;
          fc._dailyNewCount = dn;
          try { localStorage.setItem(fc._dailyKey, String(dn)); } catch (e) { }
        }
      }
      fc.queue.splice(fc.pos, 1);
      fc.completed++;
    } else {
      /*@3.GARJ.80*/
      const updated = sm2Calc(item.state, grade);
      updated.nextReview = Date.now();
      updated.failCount = (item.state.failCount || 0) + 1;
      updated.buriedUntil = 0;
      if (!fc._isReview) {
        fc.sm2[item.i] = updated;
        item.state = updated;
        saveSM2(fc.sm2);
        recordRetention(false);
      }
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount < 3) {
        const removed = fc.queue.splice(fc.pos, 1)[0];
        fc.queue.push(removed);
      } else {
        fc.queue.splice(fc.pos, 1);
        fc.completed++;
        if (!fc._isReview) recordDailyActivity();
      }
    }

    if (fc.pos >= fc.queue.length) fc.pos = 0;

    /*@3.GARJ.81*/
    if (fc.queue.length === 0 && fc.completed > 0 && !fc.filterMode && !fc._isReview) {
      setTimeout(launchConfetti, 300);
    }

    renderFlashcard();
    updateDueCount();
  }

  /*@3.GARJ.82*/
  function undoGrade() {
    const fc = window._gardenFC;
    if (!fc._undoStack || fc._undoStack.length === 0) return;
    const snap = fc._undoStack.pop();
    if (!fc._isReview) {
      fc.sm2 = snap.sm2Snapshot;
      saveSM2(fc.sm2);
    }
    fc.queue = snap.queue;
    fc.pos = snap.pos;
    fc.completed = snap.completed;
    fc._dailyNewCount = snap.dailyNewCount;
    if (fc._dailyKey) {
      try { localStorage.setItem(fc._dailyKey, String(snap.dailyNewCount)); } catch (e) { }
    }
    renderFlashcard();
    updateDueCount();
  }

  /*@3.GARJ.83*/
  function buryCard() {
    const fc = window._gardenFC;
    if (!fc.queue || fc.pos >= fc.queue.length) return;
    const item = fc.queue[fc.pos];
    if (!fc._isReview) {
      const tom = new Date(); tom.setDate(tom.getDate() + 1); tom.setHours(23, 59, 59, 999);
      const state = fc.sm2[item.i] || newCard();
      state.buriedUntil = tom.getTime();
      fc.sm2[item.i] = state;
      saveSM2(fc.sm2);
    }
    fc.queue.splice(fc.pos, 1);
    if (fc.pos >= fc.queue.length) fc.pos = 0;
    renderFlashcard(); updateDueCount();
  }

  /*@3.GARJ.84*/
  function filterFC(mode) { buildQueue(mode); renderFlashcard(); updateDueCount(); }

  /*@3.GARJ.85*/
  function quickReview() {
    const fc = window._gardenFC;
    if (!fc.cards || fc.cards.length === 0) return;
    fc.practiceMode = true;
    const all = fc.cards.map((card, i) => ({ card, i }));
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    fc.practiceQueue = all.slice(0, 10);
    fc.practicePos = 0;
    fc.browseMode = false;
    renderFlashcard();
  }

  function resetFC(mode) {
    const L = currentLang;
    const isAll = mode === 'all';

    const modalConfig = isAll ? {
      icon: '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>',
      title: L === 'ar' ? 'إعادة ضبط جميع البطاقات؟' : 'Reset All Cards?',
      message: L === 'ar'
        ? 'سيتم مسح كل تقدمك في البطاقات التعليمية لهذه الوحدة وإعادة جميع البطاقات من الصفر. هذا الإجراء لا يمكن التراجع عنه.'
        : 'This will erase all your flashcard progress for this module and bring back every card from scratch. This action cannot be undone.',
      confirmText: L === 'ar' ? 'نعم، إعادة الضبط' : 'Yes, Reset All',
      danger: true
    } : {
      icon: '<i class="fa-solid fa-rotate" aria-hidden="true"></i>',
      title: L === 'ar' ? 'إعادة البطاقات الصعبة فقط؟' : 'Reset Hard Cards Only?',
      message: L === 'ar'
        ? 'سيتم إعادة البطاقات التي كانت صعبة عليك (معامل السهولة أقل من 2.0) فقط. البطاقات التي أتقنتها ستبقى كما هي.'
        : 'Only cards you found difficult (ease factor below 2.0) will be reset. Cards you\'ve mastered will remain unchanged.',
      confirmText: L === 'ar' ? 'نعم، إعادة الصعبة' : 'Yes, Reset Hard',
      danger: false
    };

    showModal({
      ...modalConfig,
      onConfirm: () => {
        const fc = window._gardenFC;
        if (isAll) {
          fc.sm2 = {};
          /*@3.GARJ.86*/
          try {
            const prefix = fcKey() + '_dn_';
            Object.keys(localStorage)
              .filter(k => k.startsWith(prefix))
              .forEach(k => localStorage.removeItem(k));
          } catch (e) { }
          fc._dailyNewCount = 0;
          /*@3.GARJ.87*/
          try { localStorage.removeItem(retentionKey()); } catch (e) { }
        } else {
          Object.keys(fc.sm2).forEach(k => {
            if (fc.sm2[k].ef < 2.0) fc.sm2[k] = newCard();
          });
        }
        saveSM2(fc.sm2);
        buildQueue();
        renderFlashcard();
        updateDueCount();
        /*@3.GARJ.88*/
        const sm2Dash = document.getElementById('sm2-dashboard');
        const sm2Ov = document.getElementById('sm2-overlay');
        const sm2Tog = document.getElementById('sm2-toggle');
        if (sm2Dash) sm2Dash.classList.remove('open');
        if (sm2Ov) sm2Ov.classList.remove('open');
        if (sm2Tog) sm2Tog.setAttribute('aria-expanded', 'false');
        if (typeof window._gardenCloseSM2 === 'function') window._gardenCloseSM2();
      }
    });
  }

  function updateDueCount() {
    const fc = window._gardenFC;
    const el = document.getElementById('fc-due-count');
    /*@3.GARJ.89*/
    if (el && fc.queue) {
      const uniqueLeft = new Set(fc.queue.map(it => it.i)).size;
      el.textContent = uniqueLeft;
    } else if (el) { el.textContent = 0; }

    /*@3.GARJ.90*/
    const widget = document.querySelector('.sidebar-widget');
    if (widget && fc.queue?.length > 0) widget.classList.add('has-due');

    /*@3.GARJ.91*/
    updateSM2Dashboard();
  }

  /*@3.GARJ.92*/
  function initSM2Dashboard() {
    const widget = document.querySelector('.sidebar-widget');
    if (!widget) return;

    /*@3.GARJ.93*/
    const dueNum = widget.querySelector('.widget-number');
    const dueLabel = widget.querySelector('.widget-label');
    if (!dueNum || !dueLabel) return;

    const currentNum = dueNum.textContent;
    const currentLabel = dueLabel.textContent;

    widget.innerHTML = `
      <button class="sm2-widget-toggle" id="sm2-toggle" aria-expanded="false">
        <div>
          <div class="widget-number" id="fc-due-count">${currentNum}</div>
          <div class="widget-label" data-i18n="fc.due">${currentLabel}</div>
        </div>
        <span class="widget-chevron"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span>
      </button>
      <div class="sm2-dashboard" id="sm2-dashboard">
        ${[['last', 'clock-rotate-left', 'last-review'],
           ['next', 'forward-step', 'next-review'],
           ['streak', 'fire', 'streak'],
           ['retention', 'bullseye', 'retention'],
           ['total', 'chart-simple', 'total-cards']].map(([k, ic, val]) => `
        <div class="sm2-dash-row">
          <span class="sm2-dash-label"><i class="fa-solid fa-${ic}" aria-hidden="true"></i>
            <span id="sm2-${k}-label"></span></span>
          <span class="sm2-dash-value" id="sm2-${val}">—</span>
        </div>`).join('')}
        <div class="sm2-dash-bar" id="sm2-bar">
          <span class="sm2-bar-new" style="width:100%"></span>
          <span class="sm2-bar-learning" style="width:0%"></span>
          <span class="sm2-bar-mastered" style="width:0%"></span>
        </div>
        <div class="sm2-dash-legend">
          <span class="sm2-legend-new" id="sm2-leg-new"></span>
          <span class="sm2-legend-learning" id="sm2-leg-learning"></span>
          <span class="sm2-legend-mastered" id="sm2-leg-mastered"></span>
        </div>
      </div>`;

    /*@3.GARJ.94*/
    const toggle = document.getElementById('sm2-toggle');
    const dash = document.getElementById('sm2-dashboard');

    /*@3.GARJ.95*/
    let overlay = document.getElementById('sm2-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sm2-overlay';
      overlay.id = 'sm2-overlay';
      document.body.appendChild(overlay);
    }

    function openSM2() {
      const rect = widget.getBoundingClientRect();
      const bottomFromViewport = window.innerHeight - rect.top + 8;
      dash.style.bottom = bottomFromViewport + 'px';
      const popoverWidth = 260;
      const widgetCenter = rect.left + rect.width / 2;
      const idealLeft = widgetCenter - popoverWidth / 2;
      /*@3.GARJ.96*/
      const clampedLeft = Math.max(8, Math.min(idealLeft, window.innerWidth - popoverWidth - 8));
      dash.style.left = clampedLeft + 'px';
      dash.style.right = 'auto';
      dash.classList.add('open');
      overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      updateSM2Dashboard();
    }

    function closeSM2() {
      dash.classList.remove('open');
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    /*@3.GARJ.97*/
    window._gardenCloseSM2 = closeSM2;

    toggle.addEventListener('click', () => {
      dash.classList.contains('open') ? closeSM2() : openSM2();
    });

    overlay.addEventListener('click', closeSM2);

    updateSM2Dashboard();
  }

  function updateSM2Dashboard() {
    const fc = window._gardenFC;
    if (!fc.cards || !fc.sm2) return;
    const dash = document.getElementById('sm2-dashboard');
    if (!dash) return;

    const L = currentLang;
    const now = Date.now();
    const total = fc.cards.length;

    /*@3.GARJ.98*/
    let newCount = 0, learningCount = 0, masteredCount = 0;
    let lastReviewTime = 0, nextReviewTime = Infinity;

    for (let i = 0; i < total; i++) {
      const st = fc.sm2[i];
      if (!st) { newCount++; continue; }

      /*@3.GARJ.99*/
      const reviewedAt = st.nextReview - (st.interval * 86400000);
      if (reviewedAt > lastReviewTime && st.n > 0) lastReviewTime = reviewedAt;

      /*@3.GARJ.100*/
      if (st.nextReview > now && st.nextReview < nextReviewTime) nextReviewTime = st.nextReview;

      /*@3.GARJ.101*/
      if (st.interval >= 21) masteredCount++;
      else learningCount++;
    }

    /*@3.GARJ.102*/
    const labels = {
      ar: {
        last: 'آخر مراجعة', next: 'القادمة', total: 'الإجمالي',
        newL: 'جديدة', learning: 'قيد التعلم', mastered: 'متقنة',
        never: 'لم تبدأ بعد', today: 'اليوم', tomorrow: 'غداً', yesterday: 'أمس',
        daysAgo: 'أيام', daysLater: 'يوم', allDone: 'أنجزت الكل!'
      },
      en: {
        last: 'Last review', next: 'Next due', total: 'Total',
        newL: 'New', learning: 'Learning', mastered: 'Mastered',
        never: 'Not started', today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
        daysAgo: 'days ago', daysLater: 'days', allDone: 'All done!'
      }
    };
    const t = labels[L] || labels.ar;

    /*@3.GARJ.103*/
    function relTime(ts, isFuture) {
      if (!ts || ts === Infinity || ts === 0) return isFuture ? t.allDone : t.never;
      const diffMs = ts - now;
      const days = Math.round(diffMs / 86400000);
      const absDays = Math.abs(days);
      if (absDays === 0) return t.today;
      if (isFuture) {
        if (days === 1) return t.tomorrow;
        return L === 'ar' ? ('بعد ' + days + ' ' + t.daysLater) : ('In ' + days + ' ' + t.daysLater);
      } else {
        if (days === -1) return t.yesterday;
        return L === 'ar' ? ('منذ ' + absDays + ' ' + t.daysAgo) : (absDays + ' ' + t.daysAgo);
      }
    }

    /*@3.GARJ.104*/
    const $l = id => document.getElementById(id);
    const setT = (id, v) => { const e = $l(id); if (e) e.textContent = v; };

    setT('sm2-last-label', t.last);
    setT('sm2-next-label', t.next);
    setT('sm2-total-label', t.total);
    setT('sm2-last-review', relTime(lastReviewTime, false));
    setT('sm2-next-review', relTime(nextReviewTime, true));
    setT('sm2-total-cards', String(total));
    /*@3.GARJ.105*/
    const streak = calculateStreak();
    setT('sm2-streak-label', L === 'ar' ? (i18n[L]?.['fc.streak'] || 'أيام متتالية') : 'Streak');
    setT('sm2-streak', streak > 0 ? (streak + (L === 'ar' ? ' يوم' : ' days')) : (L === 'ar' ? 'ابدأ اليوم!' : 'Start today!'));
    /*@3.GARJ.106*/
    const retention = getRetentionRate();
    setT('sm2-retention-label', L === 'ar' ? (i18n[L]?.['fc.retention'] || 'معدل الحفظ') : 'Retention');
    setT('sm2-retention', retention !== null ? (retention + '%') : '—');
    setT('sm2-leg-new', newCount + ' ' + t.newL);
    setT('sm2-leg-learning', learningCount + ' ' + t.learning);
    setT('sm2-leg-mastered', masteredCount + ' ' + t.mastered);

    /*@3.GARJ.107*/
    const bar = $l('sm2-bar');
    if (bar && total > 0) {
      const spans = bar.querySelectorAll('span');
      spans[0].style.width = `${(newCount / total) * 100}%`;
      spans[1].style.width = `${(learningCount / total) * 100}%`;
      spans[2].style.width = `${(masteredCount / total) * 100}%`;
    }
  }

  /*@3.GARJ.108*/
  function showSM2Report() {
    const fc = window._gardenFC;
    const L = currentLang;
    const isAr = L === 'ar';
    document.querySelector('.sm2-report-overlay')?.remove();

    const now = Date.now();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const total = fc.cards?.length || 0;

    /*@3.GARJ.109*/
    let newCount = 0, learningCount = 0, masteredCount = 0;
    let totalEF = 0, efCount = 0;
    const forecast = {};

    /*@3.GARJ.110*/
    let needsReviews1 = 0, needsReviews2 = 0, needsReviews3plus = 0;
    let nextDueTs = Infinity;
    for (let i = 0; i < total; i++) {
      const st = fc.sm2?.[i];
      if (!st || st.n === 0) {
        newCount++;
        forecast[0] = (forecast[0] || 0) + 1;
        needsReviews3plus++;
      } else {
        const dueDate = new Date(st.nextReview); dueDate.setHours(0, 0, 0, 0);
        const diff = Math.round((dueDate - today) / 86400000);
        const key = Math.max(0, diff);
        if (key <= 30) forecast[key] = (forecast[key] || 0) + 1;
        if (st.nextReview > now && st.nextReview < nextDueTs) nextDueTs = st.nextReview;
        if (st.interval >= 21) {
          masteredCount++;
        } else {
          learningCount++;
          /*@3.GARJ.111*/
          const repsNeeded = (st.n <= 1) ? 3 : st.n === 2 ? 2 : 1;
          if (repsNeeded === 1) needsReviews1++;
          else if (repsNeeded === 2) needsReviews2++;
          else needsReviews3plus++;
        }
        totalEF += st.ef; efCount++;
      }
    }
    const nextDueDate = nextDueTs < Infinity ? new Date(nextDueTs) : null;
    const avgEF = efCount > 0 ? (totalEF / efCount).toFixed(2) : '—';

    /*@3.GARJ.112*/
    const sessionTotal = fc.totalOriginal || 0;
    const sessionDone = fc.completed || 0;
    const sessionLeft = fc.queue ? new Set(fc.queue.map(it => it.i)).size : 0;
    /*@3.GARJ.113*/
    const gs = { 0: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < total; i++) {
      const st = fc.sm2?.[i];
      if (st && st.lastGrade !== undefined) gs[st.lastGrade] = (gs[st.lastGrade] || 0) + 1;
    }
    const gsTot = (gs[0] || 0) + (gs[2] || 0) + (gs[3] || 0) + (gs[4] || 0) + (gs[5] || 0);

    /*@3.GARJ.114*/
    const avgEFNum = efCount > 0 ? totalEF / efCount : 0;
    const easeHell = efCount >= 3 && avgEFNum < 1.6;
    const easeHellHTML = easeHell ? `
      <div class="sm2-ease-warning">
        <span class="sm2-ease-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
        <div>
          <strong>${isAr ? 'تحذير: Ease Hell' : 'Warning: Ease Hell'}</strong>
          <p>${isAr
        ? `معامل السهولة المتوسط (${avgEFNum.toFixed(2)}) منخفض جداً. كثير من بطاقاتك تُراجَع بفترات قصيرة جداً مما يثقّل جلساتك. الحل: قيّم بـ "ممتاز" أو "سهل" عند الإمكان، وأعد ضبط الصعبة جداً.`
        : `Avg. ease factor (${avgEFNum.toFixed(2)}) is very low. Many cards are scheduled at short intervals, making sessions heavy. Fix: grade cards "Very Good" or "Easy" when possible, or reset hard cards.`
      }</p>
        </div>
      </div>` : '';

    /*@3.GARJ.115*/
    const allKeys = Object.keys(forecast).map(Number).sort((a, b) => a - b);
    const maxVal = allKeys.length ? Math.max(...allKeys.map(k => forecast[k])) : 1;
    const forecastHTML = allKeys.filter(d => d <= 14 || forecast[d] > 0).map(d => {
      const count = forecast[d];
      const pct = Math.round((count / maxVal) * 100);
      const label = d === 0 ? (isAr ? 'اليوم' : 'Today')
        : d === 1 ? (isAr ? 'غداً' : 'Tomorrow')
          : isAr ? `بعد ${d} أيام` : `In ${d} days`;
      return `<div class="sm2-rfc-row">
        <span class="sm2-rfc-label">${label}</span>
        <div class="sm2-rfc-track"><div class="sm2-rfc-bar${d === 0 ? ' sm2-rfc-today' : ''}" style="width:${Math.max(pct, 3)}%"></div></div>
        <span class="sm2-rfc-num${count === 0 ? ' sm2-rfc-zero' : ''}">${count}</span>
      </div>`;
    }).join('') || `<p class="sm2-report-empty">${isAr ? 'لا توجد بطاقات مجدولة بعد' : 'No cards scheduled yet'}</p>`;

    const overlay = document.createElement('div');
    overlay.className = 'sm2-report-overlay';
    overlay.innerHTML = `
      <div class="sm2-report-modal" dir="${isAr ? 'rtl' : 'ltr'}">
        <div class="sm2-report-header">
          <span class="sm2-report-header-icon"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i></span>
          <h3 class="sm2-report-title">${isAr ? 'تقرير البطاقات التعليمية' : 'Flashcard SM-2 Report'}</h3>
          <button class="sm2-report-close" id="sm2-report-close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <div class="sm2-report-body">

          ${sessionTotal > 0 ? `
          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-bolt" aria-hidden="true"></i></span>${isAr ? 'جلسة اليوم' : "Today's Session"}</div>
            <div class="sm2-rpills">
              <div class="sm2-rpill sm2-rpill--blue"><span class="sm2-rpill-n">${sessionTotal}</span><span class="sm2-rpill-l">${isAr ? 'إجمالي' : 'Total'}</span></div>
              <div class="sm2-rpill sm2-rpill--green"><span class="sm2-rpill-n">${sessionDone}</span><span class="sm2-rpill-l">${isAr ? 'أُنجز' : 'Done'}</span></div>
              <div class="sm2-rpill sm2-rpill--orange"><span class="sm2-rpill-n">${sessionLeft}</span><span class="sm2-rpill-l">${isAr ? 'متبقي' : 'Left'}</span></div>
            </div>
          </div>` : ''}

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-folder-tree" aria-hidden="true"></i></span>${isAr ? 'حالة البطاقات' : 'Card Status'}<span class="sm2-rtotal-badge">${total} ${isAr ? 'بطاقة' : 'cards'}</span></div>
            <div class="sm2-rstat-bar">
              <div class="sm2-rsb-new"      style="width:${total ? ((newCount / total) * 100).toFixed(1) : 0}%"></div>
              <div class="sm2-rsb-learning" style="width:${total ? ((learningCount / total) * 100).toFixed(1) : 0}%"></div>
              <div class="sm2-rsb-mastered" style="width:${total ? ((masteredCount / total) * 100).toFixed(1) : 0}%"></div>
            </div>
            <div class="sm2-rstat-legend">
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-new"></span><span>${isAr ? 'جديدة' : 'New'}</span><strong>${newCount}</strong></div>
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-learning"></span><span>${isAr ? 'قيد التعلم' : 'Learning'}</span><strong>${learningCount}</strong></div>
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-mastered"></span><span>${isAr ? 'متقنة' : 'Mastered'}</span><strong>${masteredCount}</strong></div>
            </div>
            ${efCount > 0 ? `<div class="sm2-ref-row"><span>${isAr ? 'متوسط معامل السهولة (EF):' : 'Avg. Ease Factor (EF):'}</span><strong>${avgEF}</strong></div>` : ''}
            ${easeHellHTML}
          </div>

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-bullseye" aria-hidden="true"></i></span>${isAr ? 'مسار الإتقان' : 'Path to Mastery'}</div>
            <div class="sm2-rmastery-note">${isAr ? 'البطاقة تُعتبر متقنة عند وصول الفاصل الزمني إلى <strong>21 يوماً أو أكثر</strong> (معيار Anki العالمي). يستلزم ذلك <strong>3 مراجعات ناجحة متتالية</strong> كحد أدنى.' : 'A card is considered <strong>mastered</strong> when its interval reaches <strong>21+ days</strong> (Anki global standard). This requires a minimum of <strong>3 consecutive successful reviews</strong>.'}</div>
            <div class="sm2-rmastery-path">
              <div class="sm2-rmp-step sm2-rmp-s1"><span class="sm2-rmp-day">${isAr ? 'اليوم' : 'Today'}</span><span class="sm2-rmp-icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><span class="sm2-rmp-label">${isAr ? 'مراجعة ١' : 'Review 1'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s2"><span class="sm2-rmp-day">${isAr ? '+1 يوم' : '+1 day'}</span><span class="sm2-rmp-icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><span class="sm2-rmp-label">${isAr ? 'مراجعة ٢' : 'Review 2'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s3"><span class="sm2-rmp-day">${isAr ? '+6 أيام' : '+6 days'}</span><span class="sm2-rmp-icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><span class="sm2-rmp-label">${isAr ? 'مراجعة ٣' : 'Review 3'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s4"><span class="sm2-rmp-day">${isAr ? '+21 يوماً' : '+21 days'}</span><span class="sm2-rmp-icon"><i class="fa-solid fa-trophy" aria-hidden="true"></i></span><span class="sm2-rmp-label">${isAr ? 'متقنة!' : 'Mastered!'}</span></div>
            </div>
            ${(learningCount > 0) ? `<div class="sm2-rmastery-breakdown">
              ${needsReviews1 > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#10b981"></span><span>${isAr ? `${needsReviews1} بطاقة — مراجعة واحدة بعيدة عن الإتقان` : `${needsReviews1} card${needsReviews1 > 1 ? 's' : ''} — 1 more review to mastery`}</span></div>` : ''}
              ${needsReviews2 > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#f59e0b"></span><span>${isAr ? `${needsReviews2} بطاقة — مراجعتان متبقيتان` : `${needsReviews2} card${needsReviews2 > 1 ? 's' : ''} — 2 more reviews to mastery`}</span></div>` : ''}
              ${needsReviews3plus > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#6b7280"></span><span>${isAr ? `${needsReviews3plus} بطاقة — 3 مراجعات أو أكثر متبقية` : `${needsReviews3plus} card${needsReviews3plus > 1 ? 's' : ''} — 3+ more reviews to mastery`}</span></div>` : ''}
            </div>` : ''}
            ${gsTot > 0 ? `<div class="sm2-rgrade-stats">
              <div class="sm2-rgs-label">${isAr ? 'احصائياتك:' : 'Your stats:'}</div>
              <div class="sm2-rgs-pills">
                <span class="sm2-rgs-pill sm2-rgs-pill-0"><span class="sm2-rgs-dot"></span>${isAr ? 'لم أتذكر' : 'Blackout'}<strong>${gs[0] || 0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-2"><span class="sm2-rgs-dot"></span>${isAr ? 'صعب' : 'Hard'}<strong>${gs[2] || 0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-3"><span class="sm2-rgs-dot"></span>${isAr ? 'جيد' : 'Good'}<strong>${gs[3] || 0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-4"><span class="sm2-rgs-dot"></span>${isAr ? 'ممتاز' : 'Very Good'}<strong>${gs[4] || 0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-5"><span class="sm2-rgs-dot"></span>${isAr ? 'سهل' : 'Easy'}<strong>${gs[5] || 0}</strong></span>
              </div>
            </div>` : ''}
          </div>

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-trophy" aria-hidden="true"></i></span>${isAr ? 'الأداء العام' : 'Overall Performance'}</div>
            <div class="sm2-rpills">
              <div class="sm2-rpill sm2-rpill--blue">
                <span class="sm2-rpill-n">${calculateStreak()}</span>
                <span class="sm2-rpill-l">${isAr ? 'أيام متتالية' : 'Day Streak'}</span>
              </div>
              ${(() => {
        const r = getRetentionRate();
        if (r === null) return '';
        const cls = r >= 80 ? 'sm2-rpill--green' : r >= 60 ? 'sm2-rpill--orange' : 'sm2-rpill--red';
        return '<div class="sm2-rpill ' + cls + '"><span class="sm2-rpill-n">' + r + '%</span><span class="sm2-rpill-l">' + (isAr ? 'معدل الحفظ' : 'Retention') + '</span></div>';
      })()}
            </div>
          </div>

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></span>${isAr ? 'نشاط المراجعة (12 أسبوع)' : 'Review Activity (12 weeks)'}</div>
            ${(() => {
        const actData = getActivityData();
        const refDay = new Date(); const DAYS = 84;
        const vals = []; let maxV = 1;
        for (let i = DAYS - 1; i >= 0; i--) {
          const d = new Date(refDay); d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          const v = actData[key] || 0;
          vals.push({ key, v }); if (v > maxV) maxV = v;
        }
        const cells = vals.map(({ key, v }) => {
          const iv = v === 0 ? 0 : Math.ceil((v / maxV) * 4);
          return '<div class="sm2-hm-cell sm2-hm-i' + iv + '" title="' + key + ': ' + v + ' ' + (isAr ? 'مراجعة' : 'reviews') + '"></div>';
        }).join('');
        return '<div class="sm2-heatmap">' + cells + '</div>'
          + '<div class="sm2-hm-legend"><span>' + (isAr ? 'أقل' : 'Less') + '</span>'
          + '<div class="sm2-hm-cell sm2-hm-i0"></div><div class="sm2-hm-cell sm2-hm-i1"></div>'
          + '<div class="sm2-hm-cell sm2-hm-i2"></div><div class="sm2-hm-cell sm2-hm-i3"></div>'
          + '<div class="sm2-hm-cell sm2-hm-i4"></div>'
          + '<span>' + (isAr ? 'أكثر' : 'More') + '</span></div>';
      })()}
          </div>

          ${nextDueDate ? `<div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-bell" aria-hidden="true"></i></span>${isAr ? 'الزيارة القادمة المقررة' : 'Your Next Scheduled Visit'}</div>
            <div class="sm2-rnext-date">
              <div class="sm2-rnd-big">${nextDueDate.toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="sm2-rnd-sub">${(() => {
          const diff = Math.round((nextDueDate - today) / 86400000);
          if (diff <= 0) return isAr ? 'البطاقات متاحة الآن' : 'Cards available now';
          if (diff === 1) return isAr ? 'غداً' : 'Tomorrow';
          return isAr ? `بعد ${diff} أيام` : `In ${diff} days`;
        })()}</div>
            </div>
          </div>` : ''}

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></span>${isAr ? 'جدول المراجعات القادمة' : 'Upcoming Review Schedule'}</div>
            <div class="sm2-rfc-list">${forecastHTML}</div>
          </div>

          <div class="sm2-report-section sm2-report-howto">
            <div class="sm2-rsec-title"><span><i class="fa-solid fa-brain" aria-hidden="true"></i></span>${isAr ? 'كيف يعمل نظام SM-2؟' : 'How does SM-2 work?'}</div>
            <div class="sm2-rhow-grid">
              <div class="sm2-rhow-item sm2-rhow-0"><span class="sm2-rhow-g">0</span><div><strong>${isAr ? 'لم أتذكر' : 'Blackout'}</strong><p>${isAr ? 'تُعاد لنهاية الجلسة (حتى ٣ محاولات)' : 'Re-queued to end (up to 3 tries)'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-2"><span class="sm2-rhow-g">2</span><div><strong>${isAr ? 'صعب' : 'Hard'}</strong><p>${isAr ? 'تُعاد، يقل معامل السهولة' : 'Re-queued, ease factor reduced'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-3"><span class="sm2-rhow-g">3</span><div><strong>${isAr ? 'جيد' : 'Good'}</strong><p>${isAr ? 'تختفي اليوم، تعود بعد أيام' : 'Done today, returns in days'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-4"><span class="sm2-rhow-g">4</span><div><strong>${isAr ? 'ممتاز' : 'Very Good'}</strong><p>${isAr ? 'تختفي، تعود بعد وقت أطول' : 'Done, returns after longer interval'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-5"><span class="sm2-rhow-g">5</span><div><strong>${isAr ? 'سهل' : 'Easy'}</strong><p>${isAr ? 'تختفي، تعود بعد أسابيع أو أكثر' : 'Done, returns in weeks or more'}</p></div></div>
            </div>
            <div class="sm2-rformula">
              <div class="sm2-rformula-title">${isAr ? 'معادلة EF (معامل السهولة):' : 'EF (Ease Factor) formula:'}</div>
              <code class="sm2-rformula-code">EF = EF + 0.1 − (5 − grade) × (0.08 + (5 − grade) × 0.02)</code>
              <div class="sm2-rformula-note">${isAr ? 'EF لا يقل عن 1.3 — يتكيف مع مستواك تلقائياً' : 'EF never goes below 1.3 — adapts automatically to your level'}</div>
            </div>
          </div>

        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const closeReport = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 220); };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeReport(); });
    overlay.querySelector('#sm2-report-close').addEventListener('click', closeReport);
    document.addEventListener('keydown', function escRpt(e) {
      if (e.key === 'Escape') { closeReport(); document.removeEventListener('keydown', escRpt); }
    });
  }

  /*@3.GARJ.116*/
  function initActionLinks() {
    const selectors = [
      '.toc-link[href="#flashcards"]',
      '.toc-link[href="#quiz"]'
    ];
    selectors.forEach(sel => {
      const link = document.querySelector(sel);
      if (!link) return;
      link.classList.add('toc-link--action');
      /*@3.GARJ.117*/
      const href = link.getAttribute('href');
      const icon = document.createElement('span');
      icon.className = 'toc-action-icon';
      icon.innerHTML = href === '#flashcards'
        ? '<i class="fa-solid fa-clone" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-list-check" aria-hidden="true"></i>';
      link.prepend(icon);
      /*@3.GARJ.118*/
      try {
        const key = 'garden_action_pulsed';
        if (!sessionStorage.getItem(key)) {
          link.classList.add('pulse');
          sessionStorage.setItem(key, '1');
        }
      } catch (e) { }
    });
  }

  /*@3.GARJ.119*/
  window._gardenQuiz = {};

  /*@3.GARJ.120*/
  function shuffleMcqOptions(q) {
    if (!q || !q.options || !q.options.ar) return;
    var n = q.options.ar.length;
    if (n < 2) return;
    var map = Array.from({ length: n }, function(_, i) { return i; });
    for (var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = map[i]; map[i] = map[j]; map[j] = t;
    }
    q.options.ar = map.map(function(i) { return q.options.ar[i]; });
    if (q.options.en) q.options.en = map.map(function(i) { return q.options.en[i]; });
    q.correctIndex = map.indexOf(q.correctIndex);
  }

  function initQuiz() {
    const el = document.getElementById('quiz-data');
    if (!el) return;
    try { window._gardenQuiz.questions = JSON.parse(el.textContent); } catch (e) { return; }
    window._gardenQuiz.current = 0;
    window._gardenQuiz.score = 0;
    window._gardenQuiz.answered = false;
    window._gardenQuiz.marks = [];
    window._gardenQuiz.started = false;
    liveScore();
    renderQuestion();
  }

  function liveScore() {
    const el = document.getElementById('quiz-score-live');
    if (el) el.textContent = window._gardenQuiz.score;
  }

  function renderQuestion() {
    const q = window._gardenQuiz;
    if (!q.questions) return;
    const total = q.questions.length;
    if (q.current >= total) { showResults(); return; }
    q.answered = false;
    const item = q.questions[q.current];
    const labels = ['A', 'B', 'C', 'D'];
    const L = currentLang;

    const counter = document.getElementById('quiz-counter');
    const prog = document.getElementById('quiz-progress-fill');
    const qText = document.getElementById('quiz-question-text');
    const opts = document.getElementById('quiz-options-container');
    const fb = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    const hintBtn = document.getElementById('quiz-hint-btn');

    if (counter) counter.textContent = `${q.current + 1} / ${total}`;
    if (prog) prog.style.width = `${(q.current / total) * 100}%`;
    if (qText) qText.textContent = item.question?.[L] || '';
    if (fb) { fb.className = 'quiz-feedback hidden'; fb.textContent = ''; }
    if (nextBtn) nextBtn.classList.add('hidden');
    if (hintBtn) { hintBtn.classList.remove('hidden'); hintBtn.onclick = () => showHint(); }

    if (opts) {
      shuffleMcqOptions(item); /*@3.GARJ.121*/
      opts.innerHTML = (item.options?.[L] || []).map((o, i) =>
        `<button class="mcq-option" onclick="Garden.pick(${i})"><span class="mcq-label">${labels[i]}</span><span>${o}</span></button>`
      ).join('');
    }
  }

  function selectOption(idx) {
    const q = window._gardenQuiz;
    if (q.answered) return;
    q.answered = true;
    const item = q.questions[q.current];
    const btns = document.querySelectorAll('.mcq-option');
    btns.forEach(b => b.disabled = true);
    const ok = idx === item.correctIndex;
    if (!q.marks) q.marks = [];
    q.marks[q.current] = ok ? 1 : 0;
    /*@3.GARJ.553*/
    if (!q.started) {
      q.started = true;
      window.GardenEv('quiz_start', {
        s: document.documentElement.getAttribute('data-subject') || '',
        m: document.documentElement.getAttribute('data-module') || '',
        n: (q.questions || []).length
      });
    }
    if (ok) { btns[idx]?.classList.add('correct'); q.score++; }
    else { btns[idx]?.classList.add('wrong'); btns[item.correctIndex]?.classList.add('correct'); }
    liveScore();
    const fb = document.getElementById('quiz-feedback');
    if (fb) { fb.textContent = item.explanation?.[currentLang] || ''; fb.className = `quiz-feedback ${ok ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`; }
    document.getElementById('quiz-next-btn')?.classList.remove('hidden');
    document.getElementById('quiz-hint-btn')?.classList.add('hidden');
  }

  function nextQ() { window._gardenQuiz.current++; renderQuestion(); }

  function showHint() {
    const q = window._gardenQuiz; if (q.answered) return;
    const fb = document.getElementById('quiz-feedback');
    if (fb) { fb.textContent = q.questions[q.current].hint?.[currentLang] || ''; fb.className = 'quiz-feedback'; fb.style.cssText = 'background:var(--bg-elevated);color:var(--text-secondary);border:1px solid var(--border-color)'; }
  }

  /*@3.GARJ.122*/
  var QLOG_CAP = 120;                 /*@3.GARJ.123*/

  function quizLogKey(code) { return 'garden_' + String(code || '').toUpperCase() + '_quizlog'; }

  function readQuizLog(code) {
    try {
      var raw = localStorage.getItem(quizLogKey(code));
      var v = raw ? JSON.parse(raw) : null;
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  /*@3.GARJ.124*/
  function recordQuiz(code, kind, score, total) {
    code = String(code || '').toUpperCase();
    kind = String(kind == null ? '' : kind);
    score = Number(score); total = Number(total);
    if (!code || !kind || !isFinite(score) || !isFinite(total) || total <= 0) return null;
    var log = readQuizLog(code);
    var at = Date.now();
    /*@3.GARJ.125*/
    log.push({ id: kind + '@' + at, k: kind, s: Math.max(0, Math.round(score)), t: Math.round(total), at: at });
    if (log.length > QLOG_CAP) log = log.slice(log.length - QLOG_CAP);
    try {
      localStorage.setItem(quizLogKey(code), JSON.stringify(log));
      /*@3.GARJ.126*/
      localStorage.setItem('__syncT_' + quizLogKey(code), String(Date.now()));
    } catch (e) { return null; }
    var _q = window._gardenQuiz;
    var _marks = (_q && Array.isArray(_q.marks) && _q.marks.length === Math.round(total)) ? _q.marks : null;
    window.GardenEv('quiz_submit', {
      s: code, k: kind, sc: Math.round(score), t: Math.round(total),
      pct: Math.round(score / total * 100), items: _marks
    });
    return log[log.length - 1];
  }

  /*@3.GARJ.127*/
  function recordQuizByKey(storageKey, score, total) {
    var m = /^([A-Za-z0-9]+)_(midterm|final)_score$/.exec(String(storageKey || ''));
    if (!m) return null;
    return recordQuiz(m[1], m[2], score, total);
  }

  /*@3.GARJ.128*/
  function hookExamPages() {
    if (typeof window.finishExam !== 'function' || window.finishExam.__gLog) return;
    var orig = window.finishExam;
    var wrapped = function () {
      var out = orig.apply(this, arguments);
      try {
        /*@3.GARJ.129*/
        var k = (typeof STORAGE_KEY !== 'undefined') ? STORAGE_KEY : null;
        var s = (typeof score !== 'undefined') ? score : null;
        var t = (typeof TOTAL !== 'undefined') ? TOTAL : null;
        if (k != null && s != null && t != null) recordQuizByKey(k, s, t);
      } catch (e) {}
      return out;
    };
    wrapped.__gLog = 1;
    window.finishExam = wrapped;
  }

  function showResults() {
    const q = window._gardenQuiz;
    document.getElementById('quiz-content')?.classList.add('hidden');
    document.getElementById('quiz-results')?.classList.remove('hidden');
    const pf = document.getElementById('quiz-progress-fill'); if (pf) pf.style.width = '100%';
    const se = document.getElementById('quiz-score-display'); if (se) se.textContent = `${q.score} / ${q.questions.length}`;
    const ee = document.getElementById('quiz-score-emoji');
    const pct = q.score / q.questions.length;
    /*@3.GARJ.130*/
    const badge = n => `<i class="fa-solid fa-${n}" aria-hidden="true"></i>`;
    if (ee) {
      if (pct >= 0.9) { ee.innerHTML = badge('trophy'); try { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }) } catch (e) { } }
      else if (pct >= 0.7) ee.innerHTML = badge('star');
      else if (pct >= 0.5) ee.innerHTML = badge('hand-fist');
      else ee.innerHTML = badge('book-open-reader');
    }
    const s = document.documentElement.getAttribute('data-subject') || 'XX', m = document.documentElement.getAttribute('data-module') || '0';
    try { const p = parseInt(localStorage.getItem(`garden_${s}_m${m}_quiz`)) || 0; if (q.score > p) localStorage.setItem(`garden_${s}_m${m}_quiz`, q.score) } catch (e) { }
    /*@3.GARJ.131*/
    recordQuiz(s, m, q.score, q.questions.length);
  }

  function retryQuiz() {
    const q = window._gardenQuiz; q.current = 0; q.score = 0; q.answered = false; q.marks = []; q.started = false; liveScore();
    document.getElementById('quiz-content')?.classList.remove('hidden');
    document.getElementById('quiz-results')?.classList.add('hidden');
    renderQuestion();
  }

  /*@3.GARJ.132*/
  function initSyntaxHighlight() {
    document.querySelectorAll('.code-block').forEach(block => {
      const headerSpan = block.querySelector('.code-block-header span');
      const codeEl = block.querySelector('pre code');
      if (!codeEl) return;

      const lang = (headerSpan?.textContent || '').trim().toLowerCase();
      const raw = codeEl.textContent; /*@3.GARJ.133*/

      let highlighted;
      if (['sql', 'mysql', 'postgresql', 'plsql', 'sqlite'].includes(lang)) {
        highlighted = hlSQL(raw);
      } else if (['pseudocode', 'pseudo', 'algorithm'].includes(lang)) {
        highlighted = hlPseudo(raw);
      } else if (['python', 'py'].includes(lang)) {
        highlighted = hlPython(raw);
      } else if (['java', 'c', 'cpp', 'c++', 'csharp', 'c#'].includes(lang)) {
        highlighted = hlCLike(raw);
      } else if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
        highlighted = hlJS(raw);
      } else {
        highlighted = hlGeneric(raw);
      }

      codeEl.innerHTML = highlighted;
    });

    document.querySelectorAll('.pseudo-block code, pre.pseudo-block').forEach(codeEl => {
      if (codeEl.closest('.code-block')) return;
      codeEl.innerHTML = hlPseudo(codeEl.textContent);
    });
  }

  /*@3.GARJ.134*/

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderTokens(tokens) {
    return tokens.map(t => {
      const safe = escHtml(t.text);
      return t.type === 'plain' ? safe : '<span class="' + t.type + '">' + safe + '</span>';
    }).join('');
  }

  function tokenizeLine(line, rules) {
    const tokens = [];
    let pos = 0;
    while (pos < line.length) {
      let matched = false;
      for (const rule of rules) {
        rule.regex.lastIndex = pos;
        const m = rule.regex.exec(line);
        if (m && m.index === pos) {
          if (pos > m.index) continue; /*@3.GARJ.135*/
          tokens.push({ type: rule.type, text: m[0] });
          pos += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        /*@3.GARJ.136*/
        const last = tokens[tokens.length - 1];
        if (last && last.type === 'plain') {
          last.text += line[pos];
        } else {
          tokens.push({ type: 'plain', text: line[pos] });
        }
        pos++;
      }
    }
    return tokens;
  }

  /*@3.GARJ.137*/
  const SQL_RULES = [
    { type: 'cm', regex: /--.*$/gm },
    { type: 'cm', regex: /\/\*[\s\S]*?\*\//g },
    { type: 'str', regex: /'(?:[^'\\]|\\.)*'/g },
    { type: 'num', regex: /\b\d+(?:\.\d+)?\b/g },
    { type: 'ct', regex: /\b(?:NULL|TRUE|FALSE|DEFAULT)\b/gi },
    { type: 'kw', regex: /\b(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|UNION|ALL|DISTINCT|AS|JOIN|INNER|LEFT|RIGHT|OUTER|CROSS|NATURAL|ON|USING|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|INSERT\s+INTO|INSERT|VALUES|UPDATE|SET|DELETE|CREATE\s+TABLE|CREATE\s+SCHEMA|CREATE\s+DOMAIN|CREATE\s+INDEX|CREATE\s+VIEW|CREATE\s+TRIGGER|CREATE\s+ASSERTION|CREATE|DROP|ALTER\s+TABLE|ALTER|ADD|COLUMN|MODIFY|RENAME|TRUNCATE|REPLACE|INTO|TABLE|SCHEMA|VIEW|INDEX|GRANT|REVOKE|BEGIN|END|COMMIT|ROLLBACK|SAVEPOINT|IF|ELSE|THEN|WHEN|CASE|CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|UNIQUE|CHECK|NOT\s+NULL|ON\s+DELETE|ON\s+UPDATE|CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION|AUTHORIZATION|WITH|RECURSIVE|DECLARE|CURSOR|FETCH|OPEN|CLOSE|FOR\s+EACH\s+ROW|BEFORE|AFTER|INSTEAD\s+OF|PROCEDURE|FUNCTION|RETURNS|RETURN|CALL|EXECUTE|ASC|DESC)\b/gi },
    { type: 'fn', regex: /\b(?:COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|TRIM|SUBSTRING|CONCAT|COALESCE|CAST|CONVERT|ROUND|CEIL|FLOOR|ABS|MOD|POWER|SQRT|NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|EXTRACT|DATEDIFF|IFNULL|NULLIF|NVL|GREATEST|LEAST)\s*(?=\()/gi },
    { type: 'ty', regex: /\b(?:INT|INTEGER|SMALLINT|BIGINT|FLOAT|DOUBLE\s+PRECISION|REAL|DECIMAL|NUMERIC|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|CLOB|BLOB|BOOLEAN|BIT|DATE|TIME|TIMESTAMP|INTERVAL|SERIAL|DOMAIN|ENUM)\b/gi },
    { type: 'op', regex: /[<>=!]+|:=|\|\||&&/g },
  ];

  function hlSQL(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, SQL_RULES))).join('\n');
  }

  /*@3.GARJ.138*/
  const PSEUDO_RULES = [
    { type: 'cm', regex: /\/\/.*$/gm },
    { type: 'cm', regex: /#.*$/gm },
    { type: 'str', regex: /"[^"]*"|'[^']*'/g },
    { type: 'num', regex: /\b\d+(?:\.\d+)?\b/g },
    { type: 'ct', regex: /\b(?:NULL|nil|null|TRUE|FALSE|true|false|INFINITY|EMPTY|undefined|NaN)\b/g },
    { type: 'kw', regex: /\b(?:if|else|elif|then|while|for|do|end|begin|return|function|procedure|algorithm|call|input|output|print|read|write|repeat|until|break|continue|switch|case|default|try|catch|throw|new|class|extends|import|from|export|var|let|const|def|lambda|yield|async|await|each|in|of|to|downto|step|and|or|not|xor|mod|div|is|set|get)\b/gi },
    { type: 'fn', regex: /\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type: 'op', regex: /←|→|≤|≥|≠|:=|==|!=|<>|&&|\|\||[<>=!]+/g },
  ];

  function hlPseudo(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, PSEUDO_RULES))).join('\n');
  }

  /*@3.GARJ.139*/
  const PY_RULES = [
    { type: 'cm', regex: /#.*$/gm },
    { type: 'str', regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*'/g },
    { type: 'num', regex: /\b\d+(?:\.\d+)?\b/g },
    { type: 'ct', regex: /\b(?:None|True|False)\b/g },
    { type: 'kw', regex: /\b(?:def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|assert|del|print|async|await)\b/g },
    { type: 'fn', regex: /\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type: 'op', regex: /==|!=|<=|>=|:=|\*\*|[<>=!+\-*\/%]+/g },
  ];

  function hlPython(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, PY_RULES))).join('\n');
  }

  /*@3.GARJ.140*/
  const C_RULES = [
    { type: 'cm', regex: /\/\/.*$/gm },
    { type: 'cm', regex: /\/\*[\s\S]*?\*\//g },
    { type: 'str', regex: /"[^"]*"|'[^']*'/g },
    { type: 'num', regex: /\b\d+(?:\.\d+)?[fFdDlL]?\b/g },
    { type: 'ct', regex: /\b(?:null|NULL|true|false|nullptr)\b/g },
    { type: 'ty', regex: /\b(?:int|float|double|char|void|bool|boolean|long|short|unsigned|signed|string|String|auto|Integer|Float|Double|Boolean|ArrayList|HashMap|LinkedList|Queue|Stack|Set|List|Map)\b/g },
    { type: 'kw', regex: /\b(?:const|static|final|public|private|protected|abstract|virtual|override|class|struct|enum|interface|extends|implements|new|delete|this|super|sizeof|typeof|instanceof|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|throw|throws|finally|import|package|include|using|namespace|var)\b/g },
    { type: 'fn', regex: /\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type: 'op', regex: /==|!=|<=|>=|&&|\|\||::|->|\+\+|--|[<>=!+\-*\/%&|^~]+/g },
  ];

  function hlCLike(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, C_RULES))).join('\n');
  }

  /*@3.GARJ.141*/
  const JS_RULES = [
    { type: 'cm', regex: /\/\/.*$/gm },
    { type: 'cm', regex: /\/\*[\s\S]*?\*\//g },
    { type: 'str', regex: /`[^`]*`|"[^"]*"|'[^']*'/g },
    { type: 'num', regex: /\b\d+(?:\.\d+)?\b/g },
    { type: 'ct', regex: /\b(?:null|undefined|NaN|Infinity|true|false)\b/g },
    { type: 'kw', regex: /\b(?:var|let|const|function|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|throw|finally|new|delete|typeof|instanceof|in|of|class|extends|super|this|import|export|from|as|async|await|yield|static|get|set)\b/g },
    { type: 'fn', regex: /\b[a-zA-Z_$]\w*\s*(?=\()/g },
    { type: 'op', regex: /===|!==|==|!=|=>|<=|>=|&&|\|\||[<>=!+\-*\/%&|^~?:]+/g },
  ];

  function hlJS(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, JS_RULES))).join('\n');
  }

  /*@3.GARJ.142*/
  function hlGeneric(code) {
    const sqlHits = (code.match(/\b(SELECT|CREATE|INSERT|DELETE|UPDATE|FROM|WHERE|TABLE|PRIMARY|FOREIGN|KEY|REFERENCES|CONSTRAINT)\b/gi) || []).length;
    return sqlHits >= 2 ? hlSQL(code) : hlPseudo(code);
  }

  /*@3.GARJ.143*/

  /*@3.GARJ.144*/
  const NOTE_COLORS = {
    yellow:  { dot: '#fde047', rgb: '253,224,71',  label_ar: 'أصفر',    label_en: 'Yellow'  },
    amber:   { dot: '#fb923c', rgb: '251,146,60',  label_ar: 'برتقالي', label_en: 'Orange'  },
    red:     { dot: '#f87171', rgb: '248,113,113', label_ar: 'أحمر',    label_en: 'Red'     },
    pink:    { dot: '#f472b6', rgb: '244,114,182', label_ar: 'زهري',    label_en: 'Pink'    },
    violet:  { dot: '#c084fc', rgb: '192,132,252', label_ar: 'بنفسجي',  label_en: 'Violet'  },
    indigo:  { dot: '#818cf8', rgb: '129,140,248', label_ar: 'نيلي',    label_en: 'Indigo'  },
    blue:    { dot: '#60a5fa', rgb: '96,165,250',  label_ar: 'أزرق',    label_en: 'Blue'    },
    cyan:    { dot: '#22d3ee', rgb: '34,211,238',  label_ar: 'سيانسي',  label_en: 'Cyan'    },
    teal:    { dot: '#2dd4bf', rgb: '45,212,191',  label_ar: 'مائي',    label_en: 'Teal'    },
    green:   { dot: '#4ade80', rgb: '74,222,128',  label_ar: 'أخضر',    label_en: 'Green'   },
    lime:    { dot: '#a3e635', rgb: '163,230,53',  label_ar: 'ليموني',  label_en: 'Lime'    },
    rose:    { dot: '#fb7185', rgb: '251,113,133', label_ar: 'وردي',    label_en: 'Rose'    },
  };

  const COLOR_CFG_KEY = 'garden_color_config';
  const RECENT_KEY    = 'garden_recent_colors';

  function defaultColorConfig() {
    return {
      primary:  ['yellow','violet','blue','green','red'],
      extended: ['amber','pink','indigo','cyan','teal','lime','rose'],
      custom:   []
    };
  }
  function getColorConfig() {
    try {
      const c = JSON.parse(localStorage.getItem(COLOR_CFG_KEY) || 'null');
      if (c && Array.isArray(c.primary) && Array.isArray(c.extended)) return c;
    } catch {}
    return defaultColorConfig();
  }
  function saveColorConfig(cfg) {
    try { localStorage.setItem(COLOR_CFG_KEY, JSON.stringify(cfg)); } catch {}
  }
  function addCustomColorToCfg(hex) {
    hex = hex.toLowerCase();
    const cfg = getColorConfig();
    if (!cfg.custom.includes(hex)) { cfg.custom.unshift(hex); cfg.custom = cfg.custom.slice(0, 12); }
    if (!cfg.extended.includes(hex) && !cfg.primary.includes(hex)) cfg.extended.unshift(hex);
    saveColorConfig(cfg);
  }
  function getRecentColors() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
  function addRecentColor(k) {
    let r = getRecentColors().filter(x => x !== k); r.unshift(k); r = r.slice(0, 8);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch {}
  }
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x+x).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function isCustomColor(c) { return typeof c === 'string' && c.startsWith('#'); }
  function getDotColor(k) { return isCustomColor(k) ? k : (NOTE_COLORS[k]?.dot || '#ccc'); }
  function getDotLabel(k) {
    if (isCustomColor(k)) return k;
    const nc = NOTE_COLORS[k];
    return nc ? nL(nc.label_ar, nc.label_en) : k;
  }
  function makeDotEl(colorKey, currentColor, extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = colorKey === currentColor;
    const isRecent = getRecentColors().includes(colorKey);
    btn.className = 'notes-tip-dot' + (isActive ? ' active' : '') + (isRecent ? ' recent' : '') + (extraClass ? ' ' + extraClass : '');
    btn.setAttribute('data-color', colorKey);
    btn.style.setProperty('--dot', getDotColor(colorKey));
    btn.title = getDotLabel(colorKey);
    return btn;
  }

  function buildColorPickerHTML(currentColor, opts) {
    opts = opts || {};
    const cfg    = getColorConfig();
    const recent = getRecentColors();
    const dotHTML = (k) => {
      const isA = k === currentColor, isR = recent.includes(k);
      const ex  = isCustomColor(k) ? ' notes-tip-custom-dot' : '';
      return '<button type="button" class="notes-tip-dot' + (isA ? ' active' : '') + (isR ? ' recent' : '') + ex +
             '" data-color="' + k + '" style="--dot:' + getDotColor(k) + ';" title="' + getDotLabel(k) + '"></button>';
    };
    const backBtn = opts.showBack
      ? '<button type="button" class="notes-tip-dot-back notes-cp-back-btn" id="cp-back-btn" title="' + nL('رجوع','Back') + '"><i class="fa-solid fa-reply"></i></button>'
      : '';
    return (
      '<div class="notes-cp-primary">' +
        cfg.primary.map(dotHTML).join('') +
        '<button type="button" class="notes-tip-more-btn" id="cp-more-btn" title="' + nL('ألوان إضافية','More colors') + '">•••</button>' +
        '<button type="button" class="notes-tip-custom-btn" id="cp-custom-btn" title="' + nL('لون مخصص','Custom color') + '"><i class="fa-solid fa-palette"></i></button>' +
        '<input type="color" id="cp-color-input" class="notes-cp-hidden-input" value="' + (isCustomColor(currentColor) ? currentColor : '#c084fc') + '" tabindex="-1" aria-hidden="true">' +
        '<button type="button" class="notes-tip-manage-btn" id="cp-manage-btn" title="' + nL('تخصيص الألوان','Manage colors') + '"><i class="fa-solid fa-sliders"></i></button>' +
        backBtn +
      '</div>' +
      '<div class="notes-cp-extended" id="cp-extended" style="display:none;">' +
        cfg.extended.map(dotHTML).join('') +
        '<button type="button" class="notes-tip-dot-back" id="cp-extended-close" title="' + nL('إغلاق','Close') + '"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="notes-cp-manager" id="cp-manager" style="display:none;"></div>'
    );
  }

  function buildColorManagerUI(container, onConfigChange) {
    const cfg = getColorConfig();
    const mgr = container.querySelector('#cp-manager');
    if (!mgr) return;
    const itemHTML = (k, side) => {
      const isCustom = isCustomColor(k);
      const dot  = '<span class="notes-tip-dot" style="--dot:' + getDotColor(k) + ';" title="' + getDotLabel(k) + '"></span>';
      const move = side === 'primary'
        ? '<button class="cpm-act cpm-demote" data-color="' + k + '" title="' + nL('للفرعية','To extended') + '"><i class="fa-solid fa-arrow-down"></i></button>'
        : '<button class="cpm-act cpm-promote" data-color="' + k + '" title="' + nL('للرئيسية','To primary') + '"><i class="fa-solid fa-arrow-up"></i></button>';
      const del  = isCustom ? '<button class="cpm-act cpm-delete" data-color="' + k + '" title="' + nL('حذف','Delete') + '"><i class="fa-solid fa-xmark"></i></button>' : '';
      return '<div class="cpm-item" data-color="' + k + '">' + dot + move + del + '</div>';
    };
    mgr.innerHTML =
      '<div class="cpm-header">' +
        '<button class="cpm-close-btn" id="cpm-close"><i class="fa-solid fa-xmark"></i></button>' +
        '<span class="cpm-title">' + nL('تخصيص الألوان','Manage Colors') + '</span>' +
        '<button class="cpm-reset-btn" id="cpm-reset" title="' + nL('إعادة الافتراضي','Reset to defaults') + '"><i class="fa-solid fa-rotate-left"></i></button>' +
      '</div>' +
      '<div class="cpm-section">' +
        '<div class="cpm-label">' + nL('القائمة الرئيسية','Primary') + '</div>' +
        '<div class="cpm-row" id="cpm-primary">' + cfg.primary.map(k => itemHTML(k,'primary')).join('') + '</div>' +
      '</div>' +
      '<div class="cpm-section">' +
        '<div class="cpm-label">' + nL('القائمة الفرعية','Extended') + '</div>' +
        '<div class="cpm-row" id="cpm-extended">' + cfg.extended.map(k => itemHTML(k,'extended')).join('') + '</div>' +
        '<div class="cpm-add-row">' +
          '<input type="color" id="cpm-color-input" class="notes-cp-hidden-input" value="#c084fc" aria-hidden="true">' +
          '<button class="cpm-add-btn" id="cpm-add-btn"><i class="fa-solid fa-plus"></i> ' + nL('أضف لون','Add color') + '</button>' +
        '</div>' +
      '</div>';
    mgr.addEventListener('mousedown', e => e.stopPropagation());
    mgr.querySelector('#cpm-close').onclick = () => {
      mgr.style.display = 'none';
      const pr = container.querySelector('.notes-cp-primary');
      if (pr) pr.style.display = '';
    };
    const resetBtn = mgr.querySelector('#cpm-reset');
    if (resetBtn) {
      resetBtn.onmousedown = e => e.stopPropagation();
      resetBtn.onclick = (e) => {
        e.stopPropagation();
        saveColorConfig(defaultColorConfig());
        buildColorManagerUI(container, onConfigChange);
        onConfigChange();
      };
    }
    mgr.querySelectorAll('.cpm-demote').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const k = btn.getAttribute('data-color'), cfg2 = getColorConfig();
        cfg2.primary = cfg2.primary.filter(x => x !== k);
        if (!cfg2.extended.includes(k)) cfg2.extended.push(k);
        saveColorConfig(cfg2); buildColorManagerUI(container, onConfigChange); onConfigChange();
      };
    });
    mgr.querySelectorAll('.cpm-promote').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const k = btn.getAttribute('data-color'), cfg2 = getColorConfig();
        cfg2.extended = cfg2.extended.filter(x => x !== k);
        if (!cfg2.primary.includes(k)) cfg2.primary.push(k);
        saveColorConfig(cfg2); buildColorManagerUI(container, onConfigChange); onConfigChange();
      };
    });
    mgr.querySelectorAll('.cpm-delete').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const k = btn.getAttribute('data-color'), cfg2 = getColorConfig();
        cfg2.custom   = cfg2.custom.filter(x => x !== k);
        cfg2.primary  = cfg2.primary.filter(x => x !== k);
        cfg2.extended = cfg2.extended.filter(x => x !== k);
        saveColorConfig(cfg2); buildColorManagerUI(container, onConfigChange); onConfigChange();
      };
    });
    const ci = mgr.querySelector('#cpm-color-input'), ab = mgr.querySelector('#cpm-add-btn');
    ab.onmousedown = e => e.stopPropagation();
    ab.onclick = (e) => { e.stopPropagation(); ci.click(); };
    ci.onmousedown = e => e.stopPropagation();
    ci.onchange = (e) => {
      e.stopPropagation();
      addCustomColorToCfg(e.target.value);
      buildColorManagerUI(container, onConfigChange); onConfigChange();
    };
  }

  function wireColorPicker(container, onPick, onBack, previewEls, onExpand) {
    container.addEventListener('mousedown', e => e.stopPropagation());

    /*@3.GARJ.145*/
    function getRgb(colorKey) {
      return isCustomColor(colorKey)
        ? (() => { const {r,g,b}=hexToRgb(colorKey); return r+','+g+','+b; })()
        : (NOTE_COLORS[colorKey]?.rgb || '253,224,71');
    }
    function applyPreview(colorKey) {
      removePreview();
      /*@3.GARJ.146*/
      if (previewEls && previewEls.length) {
        const rgb = getRgb(colorKey);
        previewEls.forEach(el => {
          if (!el._previewOrig) el._previewOrig = { hl: el.style.getPropertyValue('--hl'), dc: el.getAttribute('data-color') };
          el.style.setProperty('--hl', rgb);
          el.setAttribute('data-color', isCustomColor(colorKey) ? 'custom' : colorKey);
          if (isCustomColor(colorKey)) el.style.setProperty('--accent', colorKey);
        });
        return;
      }
      /*@3.GARJ.147*/
      const range = _gardenSelRange;
      if (!range || range.collapsed) return;
      try {
        const rects = range.getClientRects ? Array.from(range.getClientRects()) : [];
        if (!rects.length) { const r = range.getBoundingClientRect(); if (r && r.width) rects.push(r); }
        if (!rects.length) return;
        const rgb = getRgb(colorKey);
        rects.forEach(r => {
          const d = document.createElement('div');
          d.className = 'notes-preview-overlay';
          d.style.cssText = 'position:fixed;pointer-events:none;z-index:9990;' +
            'top:'+r.top+'px;left:'+r.left+'px;width:'+r.width+'px;height:'+r.height+'px;' +
            'background:rgba('+rgb+',0.30);border-bottom:2px solid rgba('+rgb+',0.7);border-radius:2px;';
          document.body.appendChild(d);
        });
      } catch (_) {}
    }
    function removePreview() {
      /*@3.GARJ.148*/
      if (previewEls && previewEls.length) {
        previewEls.forEach(el => {
          if (el._previewOrig) {
            el.style.setProperty('--hl', el._previewOrig.hl || '');
            el.setAttribute('data-color', el._previewOrig.dc || '');
            el.style.removeProperty('--accent');
            delete el._previewOrig;
          }
        });
        return;
      }
      document.querySelectorAll('.notes-preview-overlay').forEach(d => d.remove());
    }

    const bindDots = () => {
      container.querySelectorAll('.notes-tip-dot').forEach(dot => {
        if (dot._cpBound) return; dot._cpBound = true;
        dot.addEventListener('mousedown', e => e.stopPropagation());
        dot.addEventListener('mouseenter', () => applyPreview(dot.getAttribute('data-color')));
        dot.addEventListener('mouseleave', removePreview);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          removePreview();
          const c = dot.getAttribute('data-color');
          container.querySelectorAll('.notes-tip-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          addRecentColor(c); onPick(c);
        });
      });
    };
    bindDots();
    const extPanel = container.querySelector('#cp-extended');
    const primRow  = container.querySelector('.notes-cp-primary');
    const manPanel = container.querySelector('#cp-manager');

    const moreBtn = container.querySelector('#cp-more-btn');
    if (moreBtn && extPanel) {
      moreBtn.addEventListener('mousedown', e => e.stopPropagation());
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const opening = extPanel.style.display === 'none';
        extPanel.style.display = opening ? 'flex' : 'none';
        if (opening) requestAnimationFrame(() => { repositionTooltip(); if (onExpand) onExpand(); });
      });
    }
    const closeExt = container.querySelector('#cp-extended-close');
    if (closeExt) closeExt.addEventListener('click', (e) => { e.stopPropagation(); if (extPanel) extPanel.style.display = 'none'; });

    const manageBtn = container.querySelector('#cp-manage-btn');
    if (manageBtn && manPanel) {
      manageBtn.addEventListener('mousedown', e => e.stopPropagation());
      manageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (extPanel) extPanel.style.display = 'none';
        if (primRow)  primRow.style.display  = 'none';
        manPanel.style.display = 'block';
        buildColorManagerUI(container, () => {
          const cfg2 = getColorConfig();
          /*@3.GARJ.149*/
          if (primRow) {
            primRow.querySelectorAll('.notes-tip-dot').forEach(d => d.remove());
            const firstBtn = primRow.querySelector('button:not(.notes-tip-dot)');
            cfg2.primary.forEach(k => { const el = makeDotEl(k,null,''); primRow.insertBefore(el, firstBtn); });
          }
          /*@3.GARJ.150*/
          if (extPanel) {
            extPanel.innerHTML = cfg2.extended.map(k => {
              const ex = isCustomColor(k) ? ' notes-tip-custom-dot' : '';
              return '<button type="button" class="notes-tip-dot' + ex + '" data-color="' + k + '" style="--dot:' + getDotColor(k) + ';" title="' + getDotLabel(k) + '"></button>';
            }).join('') + '<button type="button" class="notes-tip-dot-back" id="cp-extended-close" title="' + nL('إغلاق','Close') + '"><i class="fa-solid fa-xmark"></i></button>';
            extPanel.querySelector('#cp-extended-close')?.addEventListener('click', (e) => { e.stopPropagation(); extPanel.style.display = 'none'; });
          }
          bindDots();
        });
      });
    }

    const backBtn = container.querySelector('#cp-back-btn');
    if (backBtn && onBack) {
      backBtn.addEventListener('mousedown', e => e.stopPropagation());
      backBtn.addEventListener('click', (e) => { e.stopPropagation(); onBack(); });
    }

    const customBtn  = container.querySelector('#cp-custom-btn');
    const colorInput = container.querySelector('#cp-color-input');
    if (customBtn && colorInput) {
      customBtn.addEventListener('mousedown', e => e.stopPropagation());
      customBtn.addEventListener('click', (e) => { e.stopPropagation(); colorInput.click(); });
      colorInput.addEventListener('mousedown', e => e.stopPropagation());
      colorInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const hex = e.target.value;
        addCustomColorToCfg(hex);
        addRecentColor(hex);
        /*@3.GARJ.151*/
        if (extPanel && !extPanel.querySelector('[data-color="' + hex + '"]')) {
          const dot = makeDotEl(hex, null, 'notes-tip-custom-dot');
          dot._cpBound = true;
          dot.addEventListener('mousedown', ev => ev.stopPropagation());
          dot.addEventListener('click', (ev) => {
            ev.stopPropagation();
            container.querySelectorAll('.notes-tip-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            addRecentColor(hex); onPick(hex);
          });
          const xBtn = extPanel.querySelector('#cp-extended-close');
          extPanel.insertBefore(dot, xBtn || null);
        }
        if (extPanel) extPanel.style.display = 'flex';
        container.querySelectorAll('.notes-tip-dot').forEach(d => d.classList.remove('active'));
        const newDot = container.querySelector('.notes-tip-dot[data-color="' + hex + '"]');
        if (newDot) newDot.classList.add('active');
        onPick(hex);
      });
    }
  }
  let _hashLangSwitched = false;
  let _gardenSelRange = null;   /*@3.GARJ.152*/
  let _gardenSelAnchor = null;
  let _gardenSelText = '';
  function _captureSelection(range, text) {
    _gardenSelRange = range;
    _gardenSelText = text || '';
    try { _gardenSelAnchor = range ? computeAnchor(range.cloneRange()) : null; }
    catch (_) { _gardenSelAnchor = null; }
  }
  /*@3.GARJ.153*/
  function _resolveSel() {
    const range = _gardenSelRange ? _gardenSelRange.cloneRange() : null;
    const live = range ? range.toString().trim() : '';
    const text = _gardenSelText || live || (window._gardenNotesSelection || '').trim();
    const anchor = _gardenSelAnchor
      || (range ? computeAnchor(range) : (text ? { text: text, occurrence: 0, blockIndex: -1 } : null));
    return { text: text, anchor: anchor };
  }

  function nL(ar, en) { return currentLang === 'ar' ? ar : en; }

  function notesKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    const m = document.documentElement.getAttribute('data-module') || '0';
    return `garden_${s}_m${m}_notes`;
  }
  function loadNotes() {
    try {
      const arr = JSON.parse(localStorage.getItem(notesKey())) || [];
      /*@3.GARJ.154*/
      return arr.map(n => ({
        id: n.id,
        title: n.title || (n.highlight && !n.free ? smartTitle(n.highlight) : (n.highlight || nL('ملاحظة', 'Note'))),
        highlight: n.highlight || '',
        body: (n.body != null ? n.body : (n.note || '')),
        color: n.color || 'amber',
        free: !!n.free || !n.highlight,
        highlightOnly: !!n.highlightOnly,
        date: n.date || new Date().toISOString().split('T')[0],
        ts: n.ts || 0,
        ut: n.ut || n.ts || 0,
        lang: n.lang || currentLang,
        anchor: n.anchor || (n.highlight && !n.free ? { text: n.highlight, occurrence: 0 } : null),
        blockIndex: (n.blockIndex != null ? n.blockIndex : -1)
      }));
    } catch (e) { return []; }
  }
  function saveNotes(notes) { try { localStorage.setItem(notesKey(), JSON.stringify(notes)); } catch (e) { } }

  function smartTitle(text) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    const words = clean.split(' ').slice(0, 6).join(' ');
    return (words.length > 46 ? words.slice(0, 46) + '…' : words) || nL('ملاحظة', 'Note');
  }

  /*@3.GARJ.155*/
  function getContentRoot() { return document.querySelector('.main-content') || document.body; }

  /*@3.GARJ.156*/
  function bilingualBlocks() {
    const root = getContentRoot();
    if (!root) return [];
    return Array.from(root.querySelectorAll('[data-bilingual]'));
  }
  function blockIndexOfNode(node) {
    if (!node) return -1;
    const el = node.nodeType === 3 ? node.parentNode : node;
    const block = el && el.closest ? el.closest('[data-bilingual]') : null;
    if (!block) return -1;
    return bilingualBlocks().indexOf(block);
  }

  /*@3.GARJ.621*/
  let _corpus = null, _corpusN = -1;
  function langCorpus() {
    const blocks = bilingualBlocks();
    if (_corpus && _corpusN === blocks.length) return _corpus;
    const out = { ar: [], en: [] };
    blocks.forEach(b => {
      ['ar', 'en'].forEach(l => {
        const tpl = b.querySelector('.content-' + l);
        if (!tpl) return;
        out[l].push(tpl.content ? tpl.content.textContent : tpl.textContent);
      });
    });
    _corpus = { ar: out.ar.join('\n'), en: out.en.join('\n') };
    _corpusN = blocks.length;
    return _corpus;
  }

  /*@3.GARJ.622*/
  function langOfAnchor(text) {
    if (!text) return null;
    const c = langCorpus();
    const a = c.ar.indexOf(text) !== -1, e = c.en.indexOf(text) !== -1;
    if (a && !e) return 'ar';
    if (e && !a) return 'en';
    return null;
  }

  /*@3.GARJ.623*/
  function noteLang(note) {
    const t = (note.anchor && note.anchor.text) || note.highlight || '';
    const guess = langOfAnchor(t);
    if (guess) return guess;
    const root = getContentRoot();
    if (t && root && root.textContent.indexOf(t) !== -1) return currentLang;
    return note.lang || currentLang;
  }

  /*@3.GARJ.624*/
  function hashNoteLang() {
    const m = /^#note-(.+)$/.exec(location.hash || '');
    if (!m) return null;
    let note = null;
    try {
      const id = decodeURIComponent(m[1]);
      note = loadNotes().find(n => String(n.id) === id);
    } catch (_) { return null; }
    if (!note || note.free) return null;
    return langOfAnchor((note.anchor && note.anchor.text) || note.highlight || '');
  }

  /*@3.GARJ.625*/
  function markOf(id, scope) {
    const q = '[data-note-id="' + id + '"]';
    return (scope || document).querySelector('.user-highlight' + q + ', .user-highlight-txt' + q);
  }

  /*@3.GARJ.626*/
  function svgHost(node) {
    const el = node && node.nodeType === 3 ? node.parentNode : node;
    if (!el || !el.ownerSVGElement || !el.closest) return null;
    return el.closest('tspan, text');
  }

  /*@3.GARJ.627*/
  function highlightSvg(host, id, color) {
    const txt = host.closest('text') || host;
    if (!txt.parentNode) return;
    if (!host.hasAttribute('data-note-id')) {
      host.setAttribute('data-note-id', id);
      host.classList.add('user-highlight-txt');
    }
    let box = null;
    try { box = host.getBBox(); } catch (_) { return; }
    if (!box || box.width <= 0 || box.height <= 0) return;
    const NS = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', (box.x - 3).toFixed(2));
    rect.setAttribute('y', (box.y - 2).toFixed(2));
    rect.setAttribute('width', (box.width + 6).toFixed(2));
    rect.setAttribute('height', (box.height + 4).toFixed(2));
    rect.setAttribute('rx', '3');
    rect.setAttribute('class', 'user-highlight');
    rect.setAttribute('data-note-id', id);
    if (color) {
      rect.setAttribute('data-color', isCustomColor(color) ? 'custom' : color);
      if (isCustomColor(color)) {
        const { r: cr, g, b } = hexToRgb(color);
        rect.style.setProperty('--hl', cr + ',' + g + ',' + b);
      }
    }
    const tr = txt.getAttribute('transform');
    if (tr) rect.setAttribute('transform', tr);
    txt.parentNode.insertBefore(rect, txt);
  }

  /*@3.GARJ.628*/
  function landOn(el, done) {
    const soft = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    try { el.scrollIntoView({ behavior: soft ? 'smooth' : 'auto', block: 'center' }); } catch (_) { }
    let last = null, n = 0;
    const tick = () => {
      if (!el.isConnected) return;
      const top = Math.round(el.getBoundingClientRect().top);
      const still = last !== null && Math.abs(top - last) < 2;
      last = top; n++;
      if (!still && n < 14) { setTimeout(tick, 70); return; }
      /*@3.GARJ.629*/
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || 0;
      if (r.top < 8 || r.bottom > h - 8) { try { el.scrollIntoView({ block: 'center' }); } catch (_) { } }
      const at = el.getBoundingClientRect();
      done(at);
      /*@3.GARJ.639*/
      setTimeout(() => {
        if (!el.isConnected) return;
        const r2 = el.getBoundingClientRect();
        if (Math.abs(r2.top - at.top) < 4) return;
        const h2 = window.innerHeight || 0;
        if (r2.top < 8 || r2.bottom > h2 - 8) { try { el.scrollIntoView({ block: 'center' }); } catch (_) { } }
        done(el.getBoundingClientRect());
      }, 520);
    };
    setTimeout(tick, 70);
  }

  /*@3.GARJ.157*/
  function charOffsetOf(root, container, offset) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let pos = 0, n;
    while ((n = walker.nextNode())) {
      if (n === container) return pos + offset;
      pos += n.textContent.length;
    }
    return -1;
  }

  /*@3.GARJ.158*/
  function rangeFromCharOffsets(root, startChar, endChar) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let pos = 0, startNode = null, startOff = 0, endNode = null, endOff = 0, n;
    while ((n = walker.nextNode())) {
      const len = n.textContent.length;
      if (startNode === null && pos + len >= startChar) { startNode = n; startOff = startChar - pos; }
      if (endNode === null && pos + len >= endChar) { endNode = n; endOff = endChar - pos; break; }
      pos += len;
    }
    if (!startNode || !endNode) return null;
    try {
      const r = document.createRange();
      r.setStart(startNode, startOff);
      r.setEnd(endNode, endOff);
      return r;
    } catch (e) { return null; }
  }

  /*@3.GARJ.159*/
  function computeAnchor(range) {
    const root = getContentRoot();
    if (!root || !range) return null;
    const text = range.toString();
    if (!text) return null;
    const blockIndex = blockIndexOfNode(range.startContainer);
    const startChar = charOffsetOf(root, range.startContainer, range.startOffset);
    if (startChar < 0) return { text: text, occurrence: 0, blockIndex: blockIndex };
    const full = root.textContent;
    let occ = 0, from = 0, idx;
    while ((idx = full.indexOf(text, from)) !== -1 && idx < startChar) { occ++; from = idx + 1; }
    return { text: text, occurrence: occ, blockIndex: blockIndex };
  }

  /*@3.GARJ.160*/
  function highlightRange(range, id, color) {
    const sc = range.startContainer, so = range.startOffset;
    const ec = range.endContainer, eo = range.endOffset;
    const nodes = [];
    if (sc === ec && sc.nodeType === 3) {
      nodes.push(sc);
    } else {
      let rootEl = range.commonAncestorContainer;
      if (rootEl.nodeType === 3) rootEl = rootEl.parentNode;
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = walker.nextNode())) { if (range.intersectsNode(n)) nodes.push(n); }
    }
    nodes.forEach(node => {
      let s = 0, e = node.textContent.length;
      if (node === sc) s = so;
      if (node === ec) e = eo;
      if (s >= e) return;
      try {
        /*@3.GARJ.630*/
        const host = svgHost(node);
        if (host) { highlightSvg(host, id, color); return; }
        const r = document.createRange();
        r.setStart(node, s); r.setEnd(node, e);
        const mark = document.createElement('mark');
        mark.className = 'user-highlight';
        mark.dataset.noteId = id;
        if (color) {
          mark.dataset.color = color;
          if (isCustomColor(color)) {
            const { r: cr, g, b } = hexToRgb(color);
            mark.style.setProperty('--hl', `${cr},${g},${b}`);
          }
        }
        r.surroundContents(mark);
      } catch (_) { /*@3.GARJ.161*/ }
    });
  }


  /*@3.GARJ.640*/
  function revealFor(node) {
    let el = node && node.nodeType === 3 ? node.parentNode : node;
    const root = getContentRoot();
    let n = 0;
    while (el && el !== root && el.nodeType === 1 && n++ < 40) {
      if (el.tagName === 'DETAILS' && !el.open) el.open = true;
      if (el.hasAttribute('hidden')) el.removeAttribute('hidden');
      if (el.classList.contains('accordion-item') && !el.classList.contains('open')) {
        const tr = el.querySelector('.accordion-trigger');
        if (tr) tr.click(); else el.classList.add('open');
      }
      if (el.classList.contains('depth-layer') && !el.classList.contains('active')) {
        const card = el.closest('.concept-card');
        const key = el.getAttribute('data-layer');
        const tab = (card && key) ? card.querySelector('.depth-tab[data-layer="' + key + '"]') : null;
        if (tab) tab.click();
        else {
          if (card) card.querySelectorAll('.depth-layer').forEach(l => l.classList.remove('active'));
          el.classList.add('active');
        }
      }
      el = el.parentElement;
    }
  }

  /*@3.GARJ.162*/
  function findAndHighlight(note, reveal) {
    const root = getContentRoot();
    if (!root) return false;
    const text = (note.anchor && note.anchor.text) || note.highlight;
    if (!text) return false;
    if (markOf(note.id, root)) return true;
    const occurrence = (note.anchor && note.anchor.occurrence) || 0;
    const full = root.textContent;
    let idx, from = 0, count = 0, found = -1;
    while ((idx = full.indexOf(text, from)) !== -1) {
      if (count === occurrence) { found = idx; break; }
      count++; from = idx + 1;
    }
    if (found === -1) found = full.indexOf(text);
    if (found === -1) return false;        /*@3.GARJ.163*/
    const range = rangeFromCharOffsets(root, found, found + text.length);
    if (!range) return false;
    /*@3.GARJ.641*/
    if (reveal) revealFor(range.startContainer);
    highlightRange(range, note.id, note.color);
    return true;
  }

  /*@3.GARJ.164*/
  function clearHighlights() {
    document.querySelectorAll('mark.user-highlight').forEach(m => {
      const parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
    /*@3.GARJ.631*/
    document.querySelectorAll('rect.user-highlight').forEach(r => r.remove());
    document.querySelectorAll('.user-highlight-txt').forEach(t => {
      t.classList.remove('user-highlight-txt');
      t.removeAttribute('data-note-id');
    });
  }

  function restoreHighlights() {
    const root = getContentRoot();
    if (!root) return;
    clearHighlights();
    /*@3.GARJ.165*/
    loadNotes().forEach(n => { if (!n.free) findAndHighlight(n); });
  }

  /*@3.GARJ.166*/
  function renderNoteBody(src) {
    if (!src) return '';
    let s = escapeHTML(src);
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/==([^=\n]+)==/g, '<mark class="md-hl">$1</mark>');
    const lines = s.split('\n');
    const out = [];
    let inList = false;
    for (const line of lines) {
      const m = line.match(/^\s*[-•]\s+(.*)$/);
      if (m) {
        if (!inList) { out.push('<ul class="note-md-list">'); inList = true; }
        out.push('<li>' + m[1] + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push(line);
      }
    }
    if (inList) out.push('</ul>');
    s = out.join('\n');
    s = s.replace(/\n(?![ \t]*<\/?(?:ul|li))/g, '<br>').replace(/\n/g, '');
    return s;
  }

  /*@3.GARJ.167*/
  function notesToast(msg) {
    document.querySelector('.notes-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'notes-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 1900);
  }

  /*@3.GARJ.168*/
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => notesToast(nL('تم النسخ ✓', 'Copied ✓')),
        () => fallbackCopy(text)
      );
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      notesToast(nL('تم النسخ ✓', 'Copied ✓'));
    } catch (e) { notesToast(nL('تعذّر النسخ', 'Copy failed')); }
  }

  /*@3.GARJ.169*/
  function initNotes() {
    /*@3.GARJ.170*/
    const tooltip = document.createElement('div');
    tooltip.className = 'notes-tooltip';
    tooltip.id = 'notes-tooltip';
    document.body.appendChild(tooltip);
    buildSelectionTooltip(tooltip);

    const widget = document.querySelector('.sidebar-widget');
    if (widget) {
      const notesBtn = document.createElement('button');
      notesBtn.className = 'sidebar-notes-btn';
      notesBtn.id = 'sidebar-notes-btn';
      const notes = loadNotes();
      notesBtn.innerHTML = `<i class="fa-solid fa-note-sticky" aria-hidden="true"></i> <span data-i18n="notes.btn">${nL('ملاحظاتي', 'My Notes')}</span> <span class="notes-count" id="notes-count">${notes.length}</span>`;
      notesBtn.addEventListener('click', openNotesPanel);
      widget.parentNode.insertBefore(notesBtn, widget.nextSibling);
    }

    let selectionTimeout;
    const mainContent = document.querySelector('.main-content');

    /*@3.GARJ.171*/
    const notesOff = document.body.hasAttribute('data-no-notes');
    if (notesOff) return;

    mainContent?.addEventListener('mouseup', (e) => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        if (sessionStorage.getItem('garden_notes_paused') === '1') return;
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length >= 1 && text.length < 500) {
          _captureSelection(sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null, text);
          const rect = _gardenSelRange ? _gardenSelRange.getBoundingClientRect() : null;
          showNotesTooltip(rect, text);
        } else { hideNotesTooltip(); }
      }, 200);
    });

    let mobileSelTimeout;
    document.addEventListener('selectionchange', () => {
      clearTimeout(mobileSelTimeout);
      if (window.innerWidth > 1024) return;
      mobileSelTimeout = setTimeout(() => {
        if (sessionStorage.getItem('garden_notes_paused') === '1') return;
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length >= 1 && text.length < 500 && mainContent?.contains(sel.anchorNode)) {
          _captureSelection(sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null, text);
          showMobileNoteSaveBar(text);
        } else { hideMobileNoteSaveBar(); }
      }, 800);
    });

    /*@3.GARJ.172*/
    mainContent?.addEventListener('click', (e) => {
      const mark = e.target.closest('.user-highlight, .user-highlight-txt');
      if (!mark) return;
      /*@3.GARJ.173*/
      if ((window.getSelection()?.toString() || '').trim().length > 3) return;
      const id = mark.dataset.noteId;
      const note = loadNotes().find(n => String(n.id) === String(id));
      if (note) { e.stopPropagation(); showNotePop(note, mark.getBoundingClientRect()); }
    });

    /*@3.GARJ.174*/
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.notes-tooltip, .notes-panel, .mobile-note-bar, .notes-cp-primary, .notes-cp-extended, .notes-cp-hidden-input')) {
        hideNotesTooltip();
      }
      if (!e.target.closest('.note-pop, .user-highlight, .user-highlight-txt, .notes-panel, .notes-cp-primary, .notes-cp-extended, .notes-cp-hidden-input')) {
        hideNotePop();
      }
    });

    /*@3.GARJ.175*/
    document.addEventListener('garden:languageChanged', () => {
      hideNotePop();
      buildSelectionTooltip(tooltip);   /*@3.GARJ.176*/
      clearTimeout(window._notesRestoreT);
      window._notesRestoreT = setTimeout(restoreHighlights, 120);
    });

    restoreHighlights();

    /*@3.GARJ.575*/
    openNoteFromHash();
    window.addEventListener('hashchange', openNoteFromHash);
  }

  function openNoteFromHash() {
    const m = /^#note-(.+)$/.exec(location.hash || '');
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const note = loadNotes().find(n => String(n.id) === id);
    if (!note) return;
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => gotoNoteSource(note), 60);
  }

  /*@3.GARJ.177*/
  function buildSelectionTooltip(tip) {
    const isPaused = sessionStorage.getItem('garden_notes_paused') === '1';
    /*@3.GARJ.178*/
    const explainBtn = _isContentPage()
      ? `<button class="notes-tip-btn notes-tip-explain" id="tip-explain" title="${nL('اشرح بالذكاء','Explain')}"><i class="fa-solid fa-wand-magic-sparkles"></i><span>${nL('اشرح','Explain')}</span></button>`
      : '';
    tip.innerHTML = `
      <div class="notes-tip-main">
        <button class="notes-tip-btn notes-tip-color" id="tip-color" title="${nL('تلوين النص','Highlight')}"><i class="fa-solid fa-highlighter"></i><span>${nL('تلوين','Highlight')}</span></button>
        <button class="notes-tip-btn notes-tip-copy"  id="tip-copy"  title="${nL('نسخ النص','Copy')}"><i class="fa-solid fa-copy"></i><span>${nL('نسخ','Copy')}</span></button>
        <button class="notes-tip-btn notes-tip-note"  id="tip-note"  title="${nL('إضافة ملاحظة','Add note')}"><i class="fa-solid fa-pen-to-square"></i><span>${nL('ملاحظة','Note')}</span></button>
        ${explainBtn}
        <button class="notes-tip-pause" id="tip-pause" title="${nL('إخفاء مؤقت','Dismiss for session')}"><i class="fa-solid fa-eye-slash"></i></button>
      </div>
      <div class="notes-tip-colors notes-cp" id="tip-colors" style="display:none;">
        ${buildColorPickerHTML(null, { showBack: true })}
      </div>`;

    const main = tip.querySelector('.notes-tip-main');
    const colors = tip.querySelector('#tip-colors');

    tip.querySelector('#tip-copy').addEventListener('click', () => {
      const text = (_gardenSelRange ? _gardenSelRange.toString() : (window._gardenNotesSelection || '')).trim();
      if (text) copyText(text);
      hideNotesTooltip();
      window.getSelection()?.removeAllRanges();
    });
    tip.querySelector('#tip-note').addEventListener('click', () => {
      const { text, anchor } = _resolveSel();
      if (!text) return;
      hideNotesTooltip();
      window.getSelection()?.removeAllRanges();
      openNoteEditor({ free: false, highlightText: text, anchor: anchor });
    });
    tip.querySelector('#tip-color').addEventListener('click', () => {
      /*@3.GARJ.179*/
      try { window.getSelection()?.removeAllRanges(); } catch(_) {}
      main.style.display = 'none';
      colors.style.display = 'block';
      requestAnimationFrame(() => repositionTooltip());
    });

    const explainEl = tip.querySelector('#tip-explain');
    if (explainEl) explainEl.addEventListener('click', () => {
      const range = _gardenSelRange ? _gardenSelRange.cloneRange() : null;
      const text = (range ? range.toString() : (window._gardenNotesSelection || '')).trim();
      if (!text) return;
      let title = '';
      const node = range ? range.startContainer : null;
      const host = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
      const card = host && host.closest ? host.closest('.concept-card, .vault-section, .objectives-card, .accordion-item, .professor-card') : null;
      if (card) { const hh = card.querySelector('h2, h3'); title = hh ? hh.textContent.trim().slice(0, 80) : ''; }
      if (!title) title = (document.title.split('·')[0] || '').trim();
      hideNotesTooltip();
      try { window.getSelection()?.removeAllRanges(); } catch (_) {}
      showAiModal({ title, content: text, background: '', activeLayer: '', allLayersText: '', svgBlock: '', type: 'selection', hasSVG: false, hasAlgo: false, svgOnly: false });
    });

    tip.querySelector('#tip-pause').addEventListener('click', (e) => {
      e.stopPropagation();
      sessionStorage.setItem('garden_notes_paused', '1');
      hideNotesTooltip();
      hideMobileNoteSaveBar();
      notesToast(nL('تم إخفاء الشريط حتى نهاية الجلسة — يمكن تفعيله من قائمة الملاحظات', 'Toolbar hidden for this session — re-enable from the Notes panel ⚙'));
    });

    const goBack = () => { colors.style.display = 'none'; main.style.display = 'flex'; };
    wireColorPicker(colors, (colorKey) => {
      const { text, anchor } = _resolveSel();
      if (!text) return;
      createHighlightOnly(text, anchor, colorKey);
      hideNotesTooltip();
      window.getSelection()?.removeAllRanges();
    }, goBack);
  }

  /*@3.GARJ.180*/
  function createHighlightOnly(text, anchor, color) {
    const notes = loadNotes();
    notes.unshift({
      id: Date.now(),
      title: smartTitle(text),
      highlight: text,
      body: '',
      color: color || 'amber',
      free: false,
      highlightOnly: true,
      date: new Date().toISOString().split('T')[0],
      /*@3.GARJ.642*/
      ts: Date.now(),
      ut: Date.now(),
      lang: currentLang,
      anchor: anchor
    });
    saveNotes(notes);
    restoreHighlights();
    updateNotesCount();
    if (document.querySelector('.notes-panel')) renderNotesPanelBody(document.querySelector('#notes-search')?.value);
    notesToast(nL('تم التلوين ✓', 'Highlighted ✓'));
  }

  /*@3.GARJ.181*/
  let _tooltipRect = null;
  function placeFloating(el, rect, gap) {
    gap = gap || 10;
    const pad = 12;
    el.style.visibility = 'hidden';
    el.style.display = 'block';
    const w = el.offsetWidth  || 260;
    const h = el.offsetHeight || 90;
    el.style.visibility = '';
    const vw = window.innerWidth  || 1280;
    const vh = window.innerHeight || 800;
    let top, left;
    if (!rect || !rect.width) {
      top  = Math.max(pad, (vh - h) / 2);
      left = Math.max(pad, (vw - w) / 2);
    } else {
      /*@3.GARJ.576*/
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const osMenu = coarse ? 48 : 0;
      const spaceAbove = rect.top - gap - pad;
      top = (spaceAbove >= h)
          ? rect.top - h - gap
          : rect.bottom + gap + osMenu;
      const cx = rect.left + rect.width / 2;
      left = Math.max(pad, Math.min(cx - w / 2, vw - w - pad));
    }
    /*@3.GARJ.638*/
    el.style.top  = Math.max(pad, Math.min(top, vh - h - pad)) + 'px';
    el.style.left = Math.max(0,   left) + 'px';
  }

  function repositionTooltip() {
    const tip = document.getElementById('notes-tooltip');
    if (!tip || tip.style.display === 'none') return;
    if (_tooltipRect) placeFloating(tip, _tooltipRect, 8);
  }
  function showNotesTooltip(rect, text) {
    const tip = document.getElementById('notes-tooltip');
    if (!tip) return;
    window._gardenNotesSelection = text;
    if (rect && rect.width) _tooltipRect = rect;
    const main   = tip.querySelector('.notes-tip-main');
    const colors = tip.querySelector('#tip-colors');
    /*@3.GARJ.182*/
    if (main)   main.style.display   = 'flex';
    if (colors) colors.style.display = 'none';
    const extP = tip.querySelector('#cp-extended');
    const manP = tip.querySelector('#cp-manager');
    const primR = tip.querySelector('.notes-cp-primary');
    if (extP) extP.style.display = 'none';
    if (manP) manP.style.display = 'none';
    if (primR) primR.style.display = '';
    placeFloating(tip, _tooltipRect || rect, 8);
    /*@3.GARJ.183*/
    document.body.classList.add('garden-selbar-open');
  }

  function hideNotesTooltip() {
    const tip = document.getElementById('notes-tooltip');
    if (tip) tip.style.display = 'none';
    _tooltipRect = null;
    document.querySelectorAll('.notes-preview-overlay').forEach(d => d.remove());
    document.body.classList.remove('garden-selbar-open');
  }

  function showMobileNoteSaveBar(text) {
    let bar = document.getElementById('mobile-note-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'mobile-note-bar';
      bar.className = 'mobile-note-bar';
      document.body.appendChild(bar);
    }
    window._gardenNotesSelection = text;
    const preview = text.length > 42 ? text.substring(0, 42) + '…' : text;
    bar.innerHTML =
      '<div class="mnb-text">' + escapeHTML(preview) + '</div>' +
      '<div class="mnb-actions">' +
      '<button class="mnb-btn mnb-color" id="mnb-color" title="' + nL('تلوين', 'Highlight') + '"><i class="fa-solid fa-highlighter"></i></button>' +
      '<button class="mnb-btn mnb-copy" id="mnb-copy" title="' + nL('نسخ', 'Copy') + '"><i class="fa-solid fa-copy"></i></button>' +
      '<button class="mnb-btn mnb-save" id="mnb-save"><i class="fa-solid fa-pen-to-square"></i> ' + nL('ملاحظة', 'Note') + '</button>' +
      '</div>' +
      '<div class="mnb-colors notes-cp" id="mnb-colors" style="display:none;">' +
      buildColorPickerHTML(null) +
      '</div>';
    bar.style.display = 'flex';

    bar.querySelector('#mnb-save').onclick = () => {
      const r = _resolveSel();
      hideMobileNoteSaveBar();
      window.getSelection()?.removeAllRanges();
      openNoteEditor({ free: false, highlightText: r.text || text, anchor: r.anchor || { text: text, occurrence: 0, blockIndex: -1 } });
    };
    bar.querySelector('#mnb-copy').onclick = () => { copyText(text); hideMobileNoteSaveBar(); window.getSelection()?.removeAllRanges(); };
    bar.querySelector('#mnb-color').onclick = () => {
      const c = bar.querySelector('#mnb-colors');
      c.style.display = c.style.display === 'none' ? 'block' : 'none';
    };
    wireColorPicker(bar.querySelector('#mnb-colors'), (colorKey) => {
      const r = _resolveSel();
      const text2 = r.text || text;
      const anchor = r.anchor || { text: text2, occurrence: 0, blockIndex: -1 };
      createHighlightOnly(text2, anchor, colorKey);
      hideMobileNoteSaveBar();
      window.getSelection()?.removeAllRanges();
    });
  }

  function hideMobileNoteSaveBar() {
    const bar = document.getElementById('mobile-note-bar');
    if (bar) bar.style.display = 'none';
  }

  /*@3.GARJ.184*/
  function ensureNotePop() {
    let pop = document.getElementById('note-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'note-pop';
      pop.className = 'note-pop';
      document.body.appendChild(pop);
    }
    return pop;
  }

  function showNotePop(note, rect) {
    const pop = ensureNotePop();
    const L = currentLang;
    const colorKey = isCustomColor(note.color) ? 'custom' : (note.color || 'amber');
    pop.setAttribute('data-color', colorKey);
    if (isCustomColor(note.color)) pop.style.setProperty('--accent', note.color);
    else pop.style.removeProperty('--accent');

    const quote = note.highlight ? `
      <div class="note-pop-quote"><i class="fa-solid fa-quote-right"></i><span>${escapeHTML(note.highlight.substring(0, 160))}${note.highlight.length > 160 ? '…' : ''}</span></div>` : '';

    const deleteNote = () => {
      const notes = loadNotes().filter(n => String(n.id) !== String(note.id));
      saveNotes(notes);
      restoreHighlights();
      updateNotesCount();
      if (document.querySelector('.notes-panel')) renderNotesPanelBody(document.querySelector('#notes-search')?.value);
      hideNotePop();
      notesToast(nL('تم الحذف', 'Deleted'));
    };

    const colorDots = Object.keys(NOTE_COLORS)
      .map(k => `<button type="button" class="notes-tip-dot" data-color="${k}" style="--dot:${NOTE_COLORS[k].dot}" title="${nL(NOTE_COLORS[k].label_ar, NOTE_COLORS[k].label_en)}"></button>`)
      .join('');

    if (note.highlightOnly) {
      /*@3.GARJ.185*/
      pop.innerHTML = `
        <div class="note-pop-head">
          <span class="note-pop-dot"></span>
          <span class="note-pop-title">${nL('نص مُلوّن', 'Highlighted text')}</span>
          <button class="note-pop-x" id="note-pop-x" title="${nL('إغلاق', 'Close')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${quote}
        <div class="note-pop-actions note-pop-hl-actions">
          <button class="note-pop-act" id="hl-note"><i class="fa-solid fa-pen-to-square"></i> ${nL('ملاحظة', 'Note')}</button>
          <button class="note-pop-act" id="hl-copy"><i class="fa-solid fa-copy"></i> ${nL('نسخ النص', 'Copy text')}</button>
          <button class="note-pop-act" id="hl-recolor"><i class="fa-solid fa-palette"></i> ${nL('تغيير التلوين', 'Change color')}</button>
          <button class="note-pop-act note-pop-del" id="hl-del"><i class="fa-solid fa-eraser"></i> ${nL('حذف التلوين', 'Remove highlight')}</button>
        </div>
        <div class="note-pop-colors notes-cp" id="hl-colors" style="display:none;">${buildColorPickerHTML(note.color)}</div>`;

      placeFloating(pop, rect, 12);
      requestAnimationFrame(() => pop.classList.add('visible'));

      pop.querySelector('#note-pop-x').onclick = hideNotePop;
      pop.querySelector('#hl-note').onclick = () => {
        hideNotePop();
        const fresh = loadNotes().find(n => String(n.id) === String(note.id)) || note;
        openNoteEditor({ note: fresh });
      };
      pop.querySelector('#hl-copy').onclick = () => copyText(note.highlight || '');
      const colorsRow = pop.querySelector('#hl-colors');
      pop.querySelector('#hl-recolor').onclick = () => {
        const opening = colorsRow.style.display === 'none';
        colorsRow.style.display = opening ? 'block' : 'none';
        /*@3.GARJ.186*/
        requestAnimationFrame(() => placeFloating(pop, rect, 12));
      };
      /*@3.GARJ.187*/
      const existingMarks = Array.from(document.querySelectorAll('.user-highlight[data-note-id="' + note.id + '"]'));
      wireColorPicker(colorsRow, (c) => {
        const notes = loadNotes();
        const i = notes.findIndex(n => String(n.id) === String(note.id));
        if (i !== -1) { notes[i].color = c; saveNotes(notes); }
        note.color = c;
        restoreHighlights();
        if (document.querySelector('.notes-panel')) renderNotesPanelBody(document.querySelector('#notes-search')?.value);
        pop.setAttribute('data-color', isCustomColor(c) ? 'custom' : c);
        if (isCustomColor(c)) pop.style.setProperty('--accent', c);
        colorsRow.style.display = 'none';
        notesToast(nL('تم تغيير اللون ✓', 'Color changed ✓'));
      }, null, existingMarks, () => placeFloating(pop, rect, 12));
      pop.querySelector('#hl-del').onclick = deleteNote;

      document.addEventListener('keydown', function escP(e) {
        if (e.key === 'Escape') { hideNotePop(); document.removeEventListener('keydown', escP); }
      });
      return;
    }

    /*@3.GARJ.188*/
    const hasBody = !!(note.body && note.body.trim());
    const bodyHtml = hasBody
      ? `<div class="note-pop-body">${renderNoteBody(note.body)}</div>`
      : `<div class="note-pop-empty">${nL('لا يوجد نص للملاحظة بعد.', 'No note text yet.')}</div>`;

    pop.innerHTML = `
      <div class="note-pop-head">
        <span class="note-pop-dot"></span>
        <span class="note-pop-title">${escapeHTML(note.title || nL('ملاحظة', 'Note'))}</span>
        <button class="note-pop-x" id="note-pop-x" title="${nL('إغلاق', 'Close')}"><i class="fa-solid fa-xmark"></i></button>
      </div>
      ${quote}
      ${bodyHtml}
      <div class="note-pop-actions">
        <button class="note-pop-act" id="note-pop-edit"><i class="fa-solid fa-pen"></i> ${hasBody ? nL('تعديل', 'Edit') : nL('أضف ملاحظة', 'Add note')}</button>
        <button class="note-pop-act note-pop-del" id="note-pop-del"><i class="fa-solid fa-trash-can"></i> ${nL('حذف', 'Delete')}</button>
      </div>`;

    placeFloating(pop, rect, 12);
    requestAnimationFrame(() => pop.classList.add('visible'));

    pop.querySelector('#note-pop-x').onclick = hideNotePop;
    pop.querySelector('#note-pop-edit').onclick = () => {
      hideNotePop();
      const fresh = loadNotes().find(n => String(n.id) === String(note.id)) || note;
      openNoteEditor({ note: fresh });
    };
    pop.querySelector('#note-pop-del').onclick = deleteNote;

    document.addEventListener('keydown', function escP(e) {
      if (e.key === 'Escape') { hideNotePop(); document.removeEventListener('keydown', escP); }
    });
  }

  function hideNotePop() {
    const pop = document.getElementById('note-pop');
    if (!pop) return;
    pop.classList.remove('visible');
    setTimeout(() => { if (pop && !pop.classList.contains('visible')) pop.style.display = 'none'; }, 180);
  }

  /*@3.GARJ.189*/
  function openNoteEditor(opts) {
    opts = opts || {};
    const editing = !!opts.note;
    const note = opts.note || null;
    const isFree = editing ? !!note.free : !!opts.free;
    const highlightText = editing ? note.highlight : (opts.highlightText || '');
    const anchor = editing ? note.anchor : (opts.anchor || null);
    let color = editing ? (note.color || 'amber') : (opts.color || 'amber');

    const L = currentLang;
    document.querySelector('.garden-modal-overlay')?.remove();

    const titleVal = editing ? (note.title || '') : (highlightText ? smartTitle(highlightText) : '');
    const bodyVal = editing ? (note.body || '') : '';

    const colorSwatches = isFree ? '' : `
      <div class="note-color-row">
        <span class="note-color-label">${L === 'ar' ? 'لون التظليل' : 'Highlight color'}</span>
        <div class="note-color-swatches notes-cp" id="note-color-swatches-cp">
          ${buildColorPickerHTML(color)}
        </div>
      </div>`;

    const quoteBox = (!isFree && highlightText) ? `
      <div class="note-editor-quote">
        <i class="fa-solid fa-quote-right"></i>
        <span>${escapeHTML(highlightText.substring(0, 200))}${highlightText.length > 200 ? '…' : ''}</span>
      </div>` : '';

    const overlay = document.createElement('div');
    overlay.className = 'garden-modal-overlay';
    overlay.innerHTML = `
      <div class="garden-modal note-editor" style="max-width:520px;">
        <div class="note-editor-head">
          <div class="note-editor-title">
            <span class="note-editor-icon">${isFree ? '<i class="fa-solid fa-note-sticky" aria-hidden="true"></i>' : '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>'}</span>
            ${editing ? (L === 'ar' ? 'تعديل الملاحظة' : 'Edit Note')
        : (isFree ? (L === 'ar' ? 'ملاحظة جديدة' : 'New Note') : (L === 'ar' ? 'أضف ملاحظتك' : 'Add Your Note'))}
          </div>
        </div>
        ${quoteBox}
        <label class="note-field-label">${L === 'ar' ? 'العنوان' : 'Title'}</label>
        <input id="note-title-input" type="text" class="note-title-input"
          placeholder="${L === 'ar' ? 'عنوان الملاحظة...' : 'Note title...'}" value="${escapeHTML(titleVal).replace(/"/g, '&quot;')}">

        <label class="note-field-label">${L === 'ar' ? 'المحتوى' : 'Content'}</label>
        <div class="note-format-toolbar" id="note-format-toolbar">
          <button type="button" data-md="bold"      title="${L === 'ar' ? 'عريض' : 'Bold'}"><i class="fa-solid fa-bold"></i></button>
          <button type="button" data-md="italic"    title="${L === 'ar' ? 'مائل' : 'Italic'}"><i class="fa-solid fa-italic"></i></button>
          <button type="button" data-md="code"       title="${L === 'ar' ? 'كود' : 'Code'}"><i class="fa-solid fa-code"></i></button>
          <button type="button" data-md="hl"         title="${L === 'ar' ? 'تظليل' : 'Highlight'}"><i class="fa-solid fa-highlighter"></i></button>
          <button type="button" data-md="list"       title="${L === 'ar' ? 'قائمة' : 'List'}"><i class="fa-solid fa-list-ul"></i></button>
          <span class="note-toolbar-sep"></span>
          <button type="button" id="note-preview-toggle" class="note-preview-toggle" title="${L === 'ar' ? 'معاينة' : 'Preview'}"><i class="fa-solid fa-eye"></i></button>
        </div>
        <textarea id="note-body-input" class="note-body-input" rows="5"
          placeholder="${L === 'ar' ? 'اكتب ملاحظتك... يمكنك استخدام **عريض** و*مائل* و- قوائم' : 'Write your note... use **bold**, *italic*, - lists'}">${escapeHTML(bodyVal)}</textarea>
        <div class="note-preview" id="note-preview" style="display:none;"></div>

        ${colorSwatches}

        <div class="garden-modal-actions">
          <button class="garden-modal-btn garden-modal-btn--cancel" id="note-cancel">${L === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button class="garden-modal-btn note-save-btn" id="note-confirm">${L === 'ar' ? 'حفظ' : 'Save'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const titleInput = overlay.querySelector('#note-title-input');
    const bodyInput = overlay.querySelector('#note-body-input');
    const preview = overlay.querySelector('#note-preview');
    const previewToggle = overlay.querySelector('#note-preview-toggle');

    /*@3.GARJ.190*/
    const wraps = { bold: ['**', '**'], italic: ['*', '*'], code: ['`', '`'], hl: ['==', '=='] };
    overlay.querySelector('#note-format-toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-md]');
      if (!btn) return;
      const kind = btn.getAttribute('data-md');
      if (kind === 'list') {
        insertAtLineStart(bodyInput, '- ');
      } else if (wraps[kind]) {
        wrapTextarea(bodyInput, wraps[kind][0], wraps[kind][1]);
      }
      if (preview.style.display !== 'none') preview.innerHTML = renderNoteBody(bodyInput.value);
    });

    /*@3.GARJ.191*/
    previewToggle.addEventListener('click', () => {
      const showing = preview.style.display !== 'none';
      if (showing) {
        preview.style.display = 'none';
        bodyInput.style.display = '';
        previewToggle.classList.remove('active');
      } else {
        preview.innerHTML = renderNoteBody(bodyInput.value) || `<span class="note-preview-empty">${L === 'ar' ? 'لا يوجد محتوى للمعاينة' : 'Nothing to preview'}</span>`;
        preview.style.display = '';
        bodyInput.style.display = 'none';
        previewToggle.classList.add('active');
      }
    });

    /*@3.GARJ.192*/
    const swatchesCP = overlay.querySelector('#note-color-swatches-cp');
    if (swatchesCP) {
      wireColorPicker(swatchesCP, (c) => { color = c; });
    }

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#note-cancel').addEventListener('click', close);

    overlay.querySelector('#note-confirm').addEventListener('click', () => {
      const title = (titleInput.value || '').trim();
      const body = (bodyInput.value || '').trim();
      if (!title && !body) { titleInput.focus(); return; }

      let notes = loadNotes();
      if (editing) {
        const i = notes.findIndex(n => n.id === note.id);
        if (i !== -1) {
          notes[i].title = title || smartTitle(notes[i].highlight) || nL('ملاحظة', 'Note');
          notes[i].body = body;
          notes[i].color = color;
          notes[i].ut = Date.now();
          /*@3.GARJ.636*/
          if (isFree || !notes[i].lang) notes[i].lang = currentLang;
          if (body) notes[i].highlightOnly = false;   /*@3.GARJ.193*/
        }
      } else {
        const newNote = {
          id: Date.now(),
          title: title || (highlightText ? smartTitle(highlightText) : nL('ملاحظة عامة', 'General note')),
          highlight: isFree ? '' : highlightText,
          body: body,
          color: color,
          free: isFree,
          highlightOnly: false,
          date: new Date().toISOString().split('T')[0],
          ts: Date.now(),
          ut: Date.now(),
          lang: currentLang,
          anchor: isFree ? null : anchor
        };
        notes.unshift(newNote);
      }
      saveNotes(notes);
      restoreHighlights();
      updateNotesCount();
      close();
      if (document.querySelector('.notes-panel')) renderNotesPanelBody();
    });

    setTimeout(() => { (titleVal ? bodyInput : titleInput).focus(); }, 100);
  }

  /*@3.GARJ.194*/
  function wrapTextarea(ta, before, after) {
    const start = ta.selectionStart, end = ta.selectionEnd;
    const val = ta.value;
    const sel = val.slice(start, end) || (currentLang === 'ar' ? 'نص' : 'text');
    ta.value = val.slice(0, start) + before + sel + after + val.slice(end);
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd = start + before.length + sel.length;
  }
  function insertAtLineStart(ta, prefix) {
    const start = ta.selectionStart;
    const val = ta.value;
    let lineStart = val.lastIndexOf('\n', start - 1) + 1;
    ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + prefix.length;
  }

  function promptNoteText(highlightText) { openNoteEditor({ free: false, highlightText: highlightText, anchor: { text: highlightText, occurrence: 0, blockIndex: -1 } }); }
  function promptFreeNote() { openNoteEditor({ free: true }); }

  function updateNotesCount() {
    const el = document.getElementById('notes-count');
    if (el) el.textContent = loadNotes().length;
  }

  /*@3.GARJ.195*/
  function gotoNoteSource(note) {
    if (note.free) { showNotePop(note, null); return; }       /*@3.GARJ.196*/
    closeNotesPanel();
    /*@3.GARJ.632*/
    const want = noteLang(note);
    let switched = _hashLangSwitched;
    _hashLangSwitched = false;
    if (want !== currentLang) {
      switched = true;
      setLanguage(want);
      /*@3.GARJ.633*/
      clearTimeout(window._notesRestoreT);
      restoreHighlights();
    }
    const say = () => {
      if (!switched) return;
      notesToast(want === 'ar'
        ? 'عُرضت الصفحة بالعربية — لغة هذه الملاحظة'
        : 'Page shown in English — this note\u2019s language');
    };
    setTimeout(() => {
      /*@3.GARJ.197*/
      let mark = markOf(note.id);
      if (mark) revealFor(mark);
      if (!mark) { findAndHighlight(note, true); mark = markOf(note.id); }
      if (mark) {
        say();
        mark.classList.add('flash');
        setTimeout(() => mark.classList.remove('flash'), 1700);
        /*@3.GARJ.634*/
        landOn(mark, (r) => showNotePop(note, r));
        return;
      }
      /*@3.GARJ.198*/
      const blocks = bilingualBlocks();
      const bi = note.anchor && note.anchor.blockIndex != null ? note.anchor.blockIndex : (note.blockIndex != null ? note.blockIndex : -1);
      const block = (bi >= 0 && bi < blocks.length) ? blocks[bi] : null;
      if (block) {
        block.classList.add('note-block-flash');
        setTimeout(() => block.classList.remove('note-block-flash'), 1700);
        landOn(block, (r) => showNotePop(note, r));
        /*@3.GARJ.635*/
        notesToast(nL('عُرضت عند فقرتها — لم يُعثر على النصِّ نفسِه',
                      'Shown at its paragraph — the text itself was not found'));
        return;
      }
      /*@3.GARJ.199*/
      showNotePop(note, null);
    }, switched ? 320 : 240);
  }

  /*@3.GARJ.200*/
  function closeNotesPanel() {
    document.querySelector('.notes-panel-overlay')?.remove();
    document.querySelector('.notes-panel')?.remove();
  }

  function openNotesPanel() {
    closeNotesPanel();
    const L = currentLang;

    const overlay = document.createElement('div');
    overlay.className = 'notes-panel-overlay';
    overlay.style.display = 'block';

    const panel = document.createElement('div');
    panel.className = 'notes-panel';
    const isPaused = sessionStorage.getItem('garden_notes_paused') === '1';
    panel.innerHTML = `
      <div class="notes-panel-header">
        <h3 id="notes-panel-title"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i> ${L === 'ar' ? 'ملاحظاتي' : 'My Notes'}</h3>
        <div class="notes-panel-head-actions">
          ${isPaused ? `<button class="notes-resume-btn" id="notes-resume" title="${L === 'ar' ? 'تفعيل شريط التحديد' : 'Re-enable selection toolbar'}"><i class="fa-solid fa-eye"></i></button>` : ''}
          <button class="notes-add-free" id="notes-add-free" title="${L === 'ar' ? 'ملاحظة جديدة' : 'New note'}"><i class="fa-solid fa-plus"></i></button>
          <button class="notes-panel-close" id="notes-panel-close" title="${L === 'ar' ? 'إغلاق' : 'Close'}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="notes-search-wrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="notes-search" class="notes-search" placeholder="${L === 'ar' ? 'ابحث في ملاحظاتك...' : 'Search your notes...'}">
      </div>
      <div class="notes-panel-body" id="notes-panel-body"></div>
      <div class="notes-panel-footer">
        <button class="notes-bulk-btn" id="notes-clear-highlights">
          <i class="fa-solid fa-eraser"></i> ${L === 'ar' ? 'حذف كل التلوينات' : 'Clear all highlights'}
        </button>
        <button class="notes-bulk-btn notes-bulk-danger" id="notes-clear-all">
          <i class="fa-solid fa-trash-can"></i> ${L === 'ar' ? 'حذف كل الملاحظات' : 'Delete all notes'}
        </button>
      </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    overlay.addEventListener('click', closeNotesPanel);
    panel.querySelector('#notes-panel-close').addEventListener('click', closeNotesPanel);
    document.addEventListener('keydown', function escN(e) {
      if (e.key === 'Escape') { closeNotesPanel(); document.removeEventListener('keydown', escN); }
    });
    panel.querySelector('#notes-add-free').addEventListener('click', () => openNoteEditor({ free: true }));
    panel.querySelector('#notes-search').addEventListener('input', (e) => renderNotesPanelBody(e.target.value));
    panel.querySelector('#notes-clear-highlights').addEventListener('click', clearAllHighlights);
    panel.querySelector('#notes-clear-all').addEventListener('click', clearAllNotes);
    panel.querySelector('#notes-resume')?.addEventListener('click', () => {
      sessionStorage.removeItem('garden_notes_paused');
      closeNotesPanel();
      notesToast(nL('تم تفعيل شريط التحديد ✓', 'Selection toolbar re-enabled ✓'));
    });

    renderNotesPanelBody();
  }

  /*@3.GARJ.201*/
  function notesConfirm(opts) {
    return new Promise((resolve) => {
      hideNotePop();
      const overlay = document.createElement('div');
      overlay.className = 'notes-confirm-overlay';
      overlay.innerHTML = `
        <div class="notes-confirm-box" role="alertdialog" aria-modal="true">
          <div class="notes-confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="notes-confirm-title">${escapeHTML(opts.title)}</div>
          <div class="notes-confirm-msg">${escapeHTML(opts.message)}</div>
          <div class="notes-confirm-actions">
            <button class="notes-confirm-cancel" id="nc-cancel">${escapeHTML(opts.cancel)}</button>
            <button class="notes-confirm-ok" id="nc-ok">${escapeHTML(opts.confirm)}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));

      const done = (val) => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 180);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      };
      function onKey(e) {
        if (e.key === 'Escape') done(false);
        if (e.key === 'Enter') done(true);
      }
      overlay.addEventListener('click', (e) => { if (e.target === overlay) done(false); });
      overlay.querySelector('#nc-cancel').addEventListener('click', () => done(false));
      overlay.querySelector('#nc-ok').addEventListener('click', () => done(true));
      document.addEventListener('keydown', onKey);
    });
  }

  /*@3.GARJ.202*/
  async function clearAllHighlights() {
    const notes = loadNotes();
    const highlightCount = notes.filter(n => n.highlightOnly).length;
    if (highlightCount === 0) { notesToast(nL('لا توجد تلوينات في هذه الصفحة', 'No highlights on this page')); return; }

    const ok = await notesConfirm({
      title: nL('حذف كل التلوينات؟', 'Clear all highlights?'),
      message: nL(
        'سيتم حذف كل التلوينات الخالصة (بدون نص) في هذه الصفحة فقط، ولن تتمكّن من التراجع. (ملاحظاتك المكتوبة تبقى كما هي بألوانها، والصفحات الأخرى لا تتأثر.)',
        'All standalone highlights (without notes) on THIS page only will be removed and cannot be undone. (Your written notes stay exactly as they are, and other pages are unaffected.)'),
      confirm: nL('نعم، احذف التلوينات', 'Yes, clear highlights'),
      cancel: nL('إلغاء', 'Cancel')
    });
    if (!ok) return;

    /*@3.GARJ.203*/
    const kept = notes.filter(n => !n.highlightOnly);
    saveNotes(kept);
    restoreHighlights();
    updateNotesCount();
    renderNotesPanelBody(document.querySelector('#notes-search')?.value);
    notesToast(nL('تم حذف كل التلوينات ✓', 'All highlights cleared ✓'));
  }

  /*@3.GARJ.204*/
  async function clearAllNotes() {
    const notes = loadNotes();
    const noteCount = notes.filter(n => !n.highlightOnly && n.body && n.body.trim()).length;
    if (noteCount === 0) { notesToast(nL('لا توجد ملاحظات في هذه الصفحة', 'No notes on this page')); return; }

    const ok = await notesConfirm({
      title: nL('حذف كل الملاحظات؟', 'Delete all notes?'),
      message: nL(
        'سيتم حذف كل الملاحظات المكتوبة في هذه الصفحة فقط نهائياً، ولن تتمكّن من التراجع. (التلوينات الخالصة تبقى، وملاحظاتك في الصفحات الأخرى سليمة تماماً.)',
        'All written notes on THIS page only will be permanently deleted and cannot be undone. (Standalone highlights are kept, and your notes on other pages remain completely intact.)'),
      confirm: nL('نعم، احذف الملاحظات', 'Yes, delete notes'),
      cancel: nL('إلغاء', 'Cancel')
    });
    if (!ok) return;

    /*@3.GARJ.205*/
    const kept = notes.filter(n => n.highlightOnly || !(n.body && n.body.trim()));
    /*@3.GARJ.206*/
    const finalKept = kept.filter(n => n.highlightOnly);
    saveNotes(finalKept);
    restoreHighlights();
    updateNotesCount();
    renderNotesPanelBody();
    notesToast(nL('تم حذف كل الملاحظات ✓', 'All notes deleted ✓'));
  }

  function renderNotesPanelBody(filter) {
    const panel = document.querySelector('.notes-panel');
    if (!panel) return;
    const L = currentLang;
    const body = panel.querySelector('#notes-panel-body');
    const titleEl = panel.querySelector('#notes-panel-title');
    let notes = loadNotes();
    /*@3.GARJ.207*/
    notes = notes.filter(n => !n.highlightOnly);
    const total = notes.length;

    const q = (filter || '').trim().toLowerCase();
    if (q) notes = notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.body || '').toLowerCase().includes(q) ||
      (n.highlight || '').toLowerCase().includes(q));

    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-note-sticky" aria-hidden="true"></i> ${L === 'ar' ? 'ملاحظاتي' : 'My Notes'} <span class="notes-title-count">${total}</span>`;

    if (total === 0) {
      body.innerHTML = `<div class="notes-empty">
        <div class="notes-empty-icon"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i></div>
        <div>${L === 'ar' ? 'لا توجد ملاحظات بعد.' : 'No notes yet.'}</div>
        <div class="notes-empty-hint">${L === 'ar' ? 'حدّد أي نص ثم اختر «تلوين» أو «ملاحظة»، أو أنشئ ملاحظة عامة بزر +' : 'Select any text then choose "Highlight" or "Note", or create a general note with +'}</div>
      </div>`;
      return;
    }
    if (notes.length === 0) {
      body.innerHTML = `<div class="notes-empty"><div class="notes-empty-icon"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></div><div>${L === 'ar' ? 'لا نتائج مطابقة' : 'No matching notes'}</div></div>`;
      return;
    }

    body.innerHTML = notes.map(n => {
      const navigable = !n.free && (n.anchor || n.highlight);
      const bodyHtml = renderNoteBody(n.body);
      const quote = (!n.free && n.highlight) ? `
        <div class="note-quote" data-goto="${n.id}" title="${L === 'ar' ? 'اذهب إلى موضع النص' : 'Jump to source'}">
          <i class="fa-solid fa-location-dot"></i>
          <span>${escapeHTML(n.highlight.substring(0, 120))}${n.highlight.length > 120 ? '…' : ''}</span>
        </div>` : '';
      const badge = n.free
        ? `<span class="note-badge note-badge--free"><i class="fa-solid fa-note-sticky"></i> ${L === 'ar' ? 'عامة' : 'General'}</span>`
        : (n.highlightOnly
          ? `<span class="note-badge note-badge--highlight"><i class="fa-solid fa-highlighter"></i> ${L === 'ar' ? 'تلوين' : 'Highlight'}</span>`
          : `<span class="note-badge note-badge--source"><i class="fa-solid fa-link"></i> ${L === 'ar' ? 'من النص' : 'From text'}</span>`);
      const cardColor = isCustomColor(n.color) ? 'custom' : (n.color || 'amber');
      const cardStyle = isCustomColor(n.color) ? ` style="--accent:${n.color}"` : '';
      return `
        <div class="note-card ${navigable ? 'is-navigable' : ''}" data-note-id="${n.id}" data-color="${cardColor}"${cardStyle}>
          <div class="note-card-head">
            <div class="note-card-title" ${navigable ? `data-goto="${n.id}"` : ''}>${escapeHTML(n.title || '')}</div>
            <div class="note-card-actions">
              <button class="note-act note-edit" data-edit-id="${n.id}" title="${L === 'ar' ? 'تعديل' : 'Edit'}"><i class="fa-solid fa-pen"></i></button>
              <button class="note-act note-delete" data-del-id="${n.id}" title="${L === 'ar' ? 'حذف' : 'Delete'}"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
          ${quote}
          ${bodyHtml ? `<div class="note-user-text clamp">${bodyHtml}</div>` : ''}
          <div class="note-meta">
            <span class="note-meta-date"><i class="fa-regular fa-calendar"></i> ${n.date || ''}</span>
            ${badge}
          </div>
        </div>`;
    }).join('');

    /*@3.GARJ.208*/
    body.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(el.getAttribute('data-goto'));
        const note = loadNotes().find(n => n.id === id);
        if (note) gotoNoteSource(note);
      });
    });
    /*@3.GARJ.209*/
    body.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.note-act') || e.target.closest('[data-goto]')) return;
        const id = parseInt(card.getAttribute('data-note-id'));
        const note = loadNotes().find(n => n.id === id);
        if (!note) return;
        if (card.classList.contains('is-navigable')) gotoNoteSource(note);
        else showNotePop(note, null);   /*@3.GARJ.210*/
      });
    });
    /*@3.GARJ.211*/
    body.querySelectorAll('.note-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-edit-id'));
        const note = loadNotes().find(n => n.id === id);
        if (note) openNoteEditor({ note: note });
      });
    });
    /*@3.GARJ.212*/
    body.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-del-id'));
        let notes = loadNotes().filter(n => n.id !== id);
        saveNotes(notes);
        markOf(id) && restoreHighlights();
        updateNotesCount();
        const card = btn.closest('.note-card');
        card.classList.add('removing');
        setTimeout(() => renderNotesPanelBody(panel.querySelector('#notes-search')?.value), 200);
      });
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  /*@3.GARJ.213*/
  function initVideos() {
    const subject = document.documentElement.getAttribute('data-subject');
    const moduleNum = document.documentElement.getAttribute('data-module');
    if (!subject || !moduleNum) return;
    /*@3.GARJ.571*/
    if (!/^[0-9]+$/.test(moduleNum)) return;
    /*@3.GARJ.572*/
    if (document.documentElement.hasAttribute('data-no-videos')) return;

    const moduleStr = `M${String(moduleNum).padStart(2, '0')}`;
    const jsonPath = `_vault/${moduleStr}_videos.json`;

    fetch(jsonPath)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        if (!data.videos || data.videos.length === 0) return;
        renderVideoSection(data);
      })
      .catch(() => { /*@3.GARJ.214*/ });
  }

  function renderVideoSection(data) {
    const L = currentLang;
    const videos = data.videos;
    /*@3.GARJ.215*/
    const FILM = '<i class="fa-solid fa-film" aria-hidden="true"></i>';

    /*@3.GARJ.216*/
    const anchor = document.getElementById('professor')
      || document.getElementById('flashcards')
      || document.getElementById('vault');
    if (!anchor) return;

    const section = document.createElement('section');
    section.id = 'videos';
    section.className = 'video-section fade-up';

    const videoCards = videos.map(v => {
      const topicAr = v.topic_ar || v.topic_en || '';
      const topicEn = v.topic_en || v.topic_ar || '';
      return `
        <a href="${v.url}" target="_blank" rel="noopener" class="video-card glass-card" title="${escapeHTML(v.title)}">
          <div class="video-card-lang">${v.language === 'ar' ? 'عر' : 'EN'}</div>
          <div class="video-card-body">
            <div class="video-card-title">${escapeHTML(v.title)}</div>
            <div class="video-card-channel">${escapeHTML(v.channel)}</div>
            <div class="video-card-topic" data-bilingual>
              <template class="content-ar">${escapeHTML(topicAr)}</template>
              <template class="content-en">${escapeHTML(topicEn)}</template>
              <span class="content-target">${escapeHTML(L === 'ar' ? topicAr : topicEn)}</span>
            </div>
          </div>
          <div class="video-card-play"><i class="fa-solid fa-play" aria-hidden="true"></i></div>
        </a>`;
    }).join('');

    section.innerHTML = `
      <button class="video-toggle glass-card" id="video-toggle" aria-expanded="false">
        <div class="video-toggle-content" data-bilingual>
          <template class="content-ar">${FILM} فيديوهات تعليمية مقترحة (${videos.length})</template>
          <template class="content-en">${FILM} Recommended Videos (${videos.length})</template>
          <span class="content-target">${L === 'ar' ? `${FILM} فيديوهات تعليمية مقترحة (${videos.length})` : `${FILM} Recommended Videos (${videos.length})`}</span>
        </div>
        <span class="video-toggle-chevron"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span>
      </button>
      <div class="video-collapsible" id="video-collapsible">
        <p class="video-section-desc" data-bilingual>
          <template class="content-ar">فيديوهات مختارة بعناية لأصعب المواضيع في هذه الوحدة</template>
          <template class="content-en">Carefully selected videos for the hardest topics in this module</template>
          <span class="content-target">${L === 'ar' ? 'فيديوهات مختارة بعناية لأصعب المواضيع في هذه الوحدة' : 'Carefully selected videos for the hardest topics in this module'}</span>
        </p>
        <div class="video-list">${videoCards}</div>
      </div>`;

    anchor.parentNode.insertBefore(section, anchor);

    /*@3.GARJ.217*/
    document.getElementById('video-toggle').addEventListener('click', () => {
      const btn = document.getElementById('video-toggle');
      const list = document.getElementById('video-collapsible');
      const isOpen = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    /*@3.GARJ.218*/
    const tocDivider = document.querySelector('.toc-divider');
    if (tocDivider) {
      const tocLink = document.createElement('a');
      tocLink.href = '#videos';
      tocLink.className = 'toc-link toc-link--action';
      tocLink.setAttribute('data-bilingual', '');
      tocLink.innerHTML = `
        <span class="toc-action-icon"><i class="fa-solid fa-film" aria-hidden="true"></i></span>
        <template class="content-ar">فيديوهات مقترحة</template>
        <template class="content-en">Recommended Videos</template>
        <span class="content-target">${L === 'ar' ? 'فيديوهات مقترحة' : 'Recommended Videos'}</span>`;
      tocDivider.parentNode.insertBefore(tocLink, tocDivider);
    }

    /*@3.GARJ.219*/
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    obs.observe(section);
  }

  /*@3.GARJ.220*/
  const FONT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
  const FONT_LABELS = { xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
  let currentFontSize = localStorage.getItem('garden_font_size') || 'md';

  function applyFontSize(size) {
    if (!FONT_SIZES.includes(size)) size = 'md';
    currentFontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('garden_font_size', size);
    updateFontSizeUI();
  }

  function changeFontSize(direction) {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= FONT_SIZES.length) return;
    applyFontSize(FONT_SIZES[newIdx]);
  }

  function updateFontSizeUI() {
    const indicator = document.getElementById('font-size-indicator');
    const btnMinus = document.getElementById('font-size-minus');
    const btnPlus = document.getElementById('font-size-plus');
    if (indicator) indicator.textContent = FONT_LABELS[currentFontSize] || 'M';
    if (btnMinus) btnMinus.classList.toggle('at-limit', FONT_SIZES.indexOf(currentFontSize) === 0);
    if (btnPlus) btnPlus.classList.toggle('at-limit', FONT_SIZES.indexOf(currentFontSize) === FONT_SIZES.length - 1);
  }

  function initFontSize() {
    /*@3.GARJ.221*/
    applyFontSize(currentFontSize);

    /*@3.GARJ.222*/
    const actions = document.querySelector('.header-actions');
    if (!actions) {
      /*@3.GARJ.223*/
      const dashActions = document.querySelector('.dash-actions');
      if (dashActions) injectFontButtons(dashActions, 'before');
      return;
    }
    injectFontButtons(actions, 'before');
  }

  function injectFontButtons(container, position) {
    /*@3.GARJ.224*/
    if (document.getElementById('font-size-group')) return;

    const group = document.createElement('div');
    group.className = 'font-size-group';
    group.id = 'font-size-group';
    group.innerHTML =
      '<button class="font-size-btn" id="font-size-minus" title="' + (currentLang === 'ar' ? 'تصغير الخط' : 'Decrease font') + '"><i class="fa-solid fa-minus"></i></button>' +
      '<span class="font-size-indicator" id="font-size-indicator">' + (FONT_LABELS[currentFontSize] || 'M') + '</span>' +
      '<button class="font-size-btn" id="font-size-plus" title="' + (currentLang === 'ar' ? 'تكبير الخط' : 'Increase font') + '"><i class="fa-solid fa-plus"></i></button>';

    /*@3.GARJ.225*/
    const divider = container.querySelector('.divider-v');
    if (divider && position === 'before') {
      container.insertBefore(group, divider);
    } else {
      container.prepend(group);
    }

    /*@3.GARJ.226*/
    document.getElementById('font-size-minus').addEventListener('click', () => changeFontSize(-1));
    document.getElementById('font-size-plus').addEventListener('click', () => changeFontSize(1));
    updateFontSizeUI();
  }

  /*@3.GARJ.227*/
  function initScrollToTop() {
    /*@3.GARJ.228*/
    if (document.querySelector('.garden-scroll-top') || document.getElementById('back-to-top')) return;
    const btn = document.createElement('button');
    btn.className = 'garden-scroll-top';
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.setAttribute('aria-label', currentLang === 'ar' ? 'العودة للأعلى' : 'Back to top');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          btn.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /*@3.GARJ.229*/
  function initTableWrap() {
    /*@3.GARJ.230*/
    document.querySelectorAll('.comparison-table').forEach(table => {
      if (table.parentElement?.classList.contains('comparison-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'comparison-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /*@3.GARJ.231*/
  function initScrollAnimations() {
    const all = document.querySelectorAll('.fade-up');
    const reveal = el => el.classList.add('visible');
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) { all.forEach(reveal); return; }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) reveal(e.target); });
    }, { threshold: 0.08 });

    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) reveal(el);   /*@3.GARJ.232*/
      else obs.observe(el);
    });

    /*@3.GARJ.233*/
    setTimeout(() => all.forEach(reveal), 3000);
  }
  function initTOC() {
    const secs = document.querySelectorAll('section[id]'); if (!secs.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const l = document.querySelector(`.toc-link[href="#${e.target.id}"]`);
        if (l) {
          l.classList.toggle('active', e.isIntersecting);
          if (e.isIntersecting) {
            const scroller = document.querySelector('.toc-concepts');
            if (scroller && l.closest('.toc-concepts-wrapper')) {
              const top = l.offsetTop - scroller.offsetTop - scroller.clientHeight / 2 + l.clientHeight / 2;
              scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
          }
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    secs.forEach(s => obs.observe(s));
  }
  function initProgress() {
    const bar = document.querySelector('.reading-progress'); if (!bar) return;
    window.addEventListener('scroll', () => { const t = document.body.scrollHeight - window.innerHeight; bar.style.width = t > 0 ? `${(window.scrollY / t) * 100}%` : '0%'; }, { passive: true });
  }
  function initCopy() {
    document.querySelectorAll('.copy-btn').forEach(btn => { btn.addEventListener('click', () => { const code = btn.closest('.code-block')?.querySelector('pre')?.textContent || ''; navigator.clipboard.writeText(code).then(() => { const o = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>'; setTimeout(() => btn.innerHTML = o, 1500) }); }); });
  }

  /*@3.GARJ.234*/
  function initSmartSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const tocList = document.querySelector('.toc-list');
    if (!sidebar || !tocList) return;

    const divider = tocList.querySelector('.toc-divider');
    if (!divider) return;

    /*@3.GARJ.235*/
    const conceptLinks = [], bottomLinks = [];
    let passedDivider = false;

    Array.from(tocList.children).forEach(el => {
      if (el === divider) { passedDivider = true; return; }
      if (!el.classList.contains('toc-link')) { return; }
      if (passedDivider) { bottomLinks.push(el); } else { conceptLinks.push(el); }
    });

    /*@3.GARJ.236*/
    if (conceptLinks.length < 4) return;
    sidebar.classList.add('smart');

    /*@3.GARJ.237*/
    const wrapper = document.createElement('div');
    wrapper.className = 'toc-concepts-wrapper at-top at-bottom';

    if (conceptLinks.length >= 10) {
      /*@3.GARJ.238*/
      const innerTop = document.createElement('div');
      innerTop.className = 'toc-inner-top';
      conceptLinks.slice(0, 2).forEach(l => innerTop.appendChild(l));

      const scroller = document.createElement('div');
      scroller.className = 'toc-concepts';
      conceptLinks.slice(2, -2).forEach(l => scroller.appendChild(l));

      const innerBot = document.createElement('div');
      innerBot.className = 'toc-inner-bottom';
      conceptLinks.slice(-2).forEach(l => innerBot.appendChild(l));

      wrapper.appendChild(innerTop);
      wrapper.appendChild(scroller);
      wrapper.appendChild(innerBot);

      scroller.addEventListener('scroll', () => {
        wrapper.classList.toggle('at-top',
          scroller.scrollTop < 5);
        wrapper.classList.toggle('at-bottom',
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5);
      }, { passive: true });

      /*@3.GARJ.239*/
      requestAnimationFrame(() => {
        if (scroller.scrollHeight <= scroller.clientHeight) {
          /*@3.GARJ.240*/
          wrapper.style.overflow = 'visible';
          wrapper.style.flex = '0 0 auto';
          /*@3.GARJ.241*/
          const topFragment = document.createDocumentFragment();
          Array.from(innerTop.children).forEach(l => topFragment.appendChild(l));
          scroller.insertBefore(topFragment, scroller.firstChild);
          Array.from(innerBot.children).forEach(l => scroller.appendChild(l));
          innerTop.remove();
          innerBot.remove();
          scroller.style.flex = '0 0 auto';
          scroller.style.height = 'auto';
          /*@3.GARJ.242*/
          tocList.innerHTML = '';
          const centerGroup = document.createElement('div');
          centerGroup.className = 'toc-center-group';
          centerGroup.appendChild(wrapper);
          tocList.appendChild(centerGroup);
        }
      });

    } else {
      /*@3.GARJ.243*/
      wrapper.style.overflow = 'visible';
      wrapper.style.flex = '0 0 auto';
      const scroller = document.createElement('div');
      scroller.className = 'toc-concepts';
      scroller.style.flex = '0 0 auto';
      scroller.style.height = 'auto';
      conceptLinks.forEach(l => scroller.appendChild(l));
      wrapper.appendChild(scroller);
    }

    /*@3.GARJ.244*/
    const pinnedBottom = document.createElement('div');
    pinnedBottom.className = 'toc-pinned-bottom';
    pinnedBottom.appendChild(divider);
    bottomLinks.forEach(l => pinnedBottom.appendChild(l));

    /*@3.GARJ.245*/
    tocList.innerHTML = '';

    if (conceptLinks.length < 10) {
      /*@3.GARJ.246*/
      const centerGroup = document.createElement('div');
      centerGroup.className = 'toc-center-group';
      centerGroup.appendChild(wrapper);
      tocList.appendChild(centerGroup);
    } else {
      tocList.appendChild(wrapper);
    }

    /*@3.GARJ.247*/
    const widget = sidebar.querySelector('.sidebar-widget');
    if (widget) {
      sidebar.insertBefore(pinnedBottom, widget);
    } else {
      sidebar.appendChild(pinnedBottom);
    }
  }


  /*@3.GARJ.248*/
  function initMobileFabs() {
    if (window.innerWidth > 1024) return;
    /*@3.GARJ.249*/
    const hasNotes = !!document.querySelector('.sidebar-notes-btn');
    if (!hasNotes) return;
    const ctn = document.createElement('div');
    ctn.className = 'mobile-fab-container';
    ctn.id = 'mobile-fabs';

    /*@3.GARJ.250*/
    if (hasNotes) {
      const nfab = document.createElement('button');
      nfab.className = 'mobile-fab';
      nfab.innerHTML = '<i class="fa-solid fa-note-sticky" aria-hidden="true"></i>';
      const nbadge = document.createElement('span');
      nbadge.className = 'fab-badge'; nbadge.id = 'fab-notes-badge';
      const nc = document.getElementById('notes-count');
      nbadge.textContent = nc ? nc.textContent : '0';
      nfab.appendChild(nbadge);
      nfab.onclick = () => { document.getElementById('sidebar-notes-btn')?.click(); };
      ctn.appendChild(nfab);
      if (nc) new MutationObserver(() => { nbadge.textContent = nc.textContent; }).observe(nc, { childList: true, characterData: true, subtree: true });
    }

    document.body.appendChild(ctn);
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      ctn.classList.toggle('scrolling-down', y > lastY && y > 150);
      lastY = y;
    }, { passive: true });
  }

  function initKeys() {
    document.addEventListener('keydown', e => {
      /*@3.GARJ.577*/
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case ' ': if (document.getElementById('fc-card')) { e.preventDefault(); flipCard(); } break;
        case 't': case 'T': cycleTheme(); break;
        case 'l': case 'L': toggleLanguage(); break;
        case '0': case '2': case '3': case '4': case '5': if (document.getElementById('fc-card')?.classList.contains('flipped')) { gradeCard(Number(e.key)); } break;
        case '+': case '=': changeFontSize(1); break;
        case '-': case '_': changeFontSize(-1); break;
      }
    });
  }

  /*@3.GARJ.251*/
  function initAlgoPalette() {
    /*@3.GARJ.252*/
    const PALETTES = {
      /*@3.GARJ.253*/
      'CS353': {
        dark: { compare: '#2DD4BF', compareGlow: 'rgba(45, 212, 191, 0.35)', swap: '#60A5FA', swapGlow: 'rgba(96, 165, 250, 0.35)', sorted: '#22D3EE', active: '#FB923C', activeGlow: 'rgba(251, 146, 60, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim: { compare: '#2DD4BF', compareGlow: 'rgba(45, 212, 191, 0.25)', swap: '#60A5FA', swapGlow: 'rgba(96, 165, 250, 0.25)', sorted: '#22D3EE', active: '#FB923C', activeGlow: 'rgba(251, 146, 60, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light: { compare: '#0D9488', compareGlow: 'rgba(13, 148, 136, 0.25)', swap: '#2563EB', swapGlow: 'rgba(37, 99, 235, 0.25)', sorted: '#0891B2', active: '#EA580C', activeGlow: 'rgba(234, 88, 12, 0.25)', bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      /*@3.GARJ.254*/
      'CS352': {
        dark: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.35)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.35)', sorted: '#34D399', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.25)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.25)', sorted: '#34D399', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light: { compare: '#CA8A04', compareGlow: 'rgba(202, 138, 4, 0.25)', swap: '#DB2777', swapGlow: 'rgba(219, 39, 119, 0.25)', sorted: '#059669', active: '#9333EA', activeGlow: 'rgba(147, 51, 234, 0.25)', bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      /*@3.GARJ.255*/
      'CS350': {
        dark: { compare: '#22D3EE', compareGlow: 'rgba(34, 211, 238, 0.35)', swap: '#F87171', swapGlow: 'rgba(248, 113, 113, 0.35)', sorted: '#2DD4BF', active: '#60A5FA', activeGlow: 'rgba(96, 165, 250, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim: { compare: '#22D3EE', compareGlow: 'rgba(34, 211, 238, 0.25)', swap: '#F87171', swapGlow: 'rgba(248, 113, 113, 0.25)', sorted: '#2DD4BF', active: '#60A5FA', activeGlow: 'rgba(96, 165, 250, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light: { compare: '#0891B2', compareGlow: 'rgba(8, 145, 178, 0.25)', swap: '#DC2626', swapGlow: 'rgba(220, 38, 38, 0.25)', sorted: '#0D9488', active: '#2563EB', activeGlow: 'rgba(37, 99, 235, 0.25)', bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      /*@3.GARJ.256*/
      'CS351': {
        dark: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.35)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.35)', sorted: '#22D3EE', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.25)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.25)', sorted: '#22D3EE', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light: { compare: '#CA8A04', compareGlow: 'rgba(202, 138, 4, 0.25)', swap: '#DB2777', swapGlow: 'rgba(219, 39, 119, 0.25)', sorted: '#0891B2', active: '#9333EA', activeGlow: 'rgba(147, 51, 234, 0.25)', bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      }
    };

    const root = document.documentElement;
    const currentSubject = root.getAttribute('data-subject') || 'CS352';
    const palette = PALETTES[currentSubject] || PALETTES['CS352'];

    function applyAlgoPalette() {
      const theme = root.getAttribute('data-theme') || 'dark';
      const p = palette[theme] || palette['dark'];

      root.style.setProperty('--algo-compare', p.compare);
      root.style.setProperty('--algo-compare-glow', p.compareGlow);
      root.style.setProperty('--algo-swap', p.swap);
      root.style.setProperty('--algo-swap-glow', p.swapGlow);
      root.style.setProperty('--algo-sorted', p.sorted);
      root.style.setProperty('--algo-active', p.active);
      root.style.setProperty('--algo-active-glow', p.activeGlow);
      root.style.setProperty('--algo-bar', p.bar);
      root.style.setProperty('--algo-node-text', p.nodeText);
      root.style.setProperty('--algo-bar-label', p.barLabel);
    }

    applyAlgoPalette();

    /*@3.GARJ.257*/
    new MutationObserver(applyAlgoPalette)
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    root.setAttribute('data-algo-palette', currentSubject);
  }

  /*@3.GARJ.258*/
  function initAlgoLoader() {
    const m = document.documentElement.getAttribute('data-module');
    if (!m || m === 'review' || m === 'midterm' || m === 'final' || isNaN(m)) return;
    /*@3.GARJ.570*/
    if (!document.querySelector('[id^="algo-widget-"]')) return;
    /*@3.GARJ.259*/
    const padded = 'M' + String(m).padStart(2, '0') + '_algo.js';
    if (document.querySelector(`script[src="${padded}"]`)) return;
    const s = document.createElement('script');
    s.src = padded;
    s.onerror = function () { }; /*@3.GARJ.260*/
    document.body.appendChild(s);
  }

  /*@3.GARJ.261*/
  let _smartTipActive = null;
  let _smartTipDocBound = false;
  function initSmartTermTooltips() {
    /*@3.GARJ.262*/
    const liveTips = new Set();
    document.querySelectorAll('.smart-term').forEach(term => { if (term._gardenTip) liveTips.add(term._gardenTip); });
    document.querySelectorAll('body > .smart-term-tooltip').forEach(tip => {
      if (!liveTips.has(tip)) { if (_smartTipActive === tip) _smartTipActive = null; tip.remove(); }
    });

    /*@3.GARJ.263*/
    document.querySelectorAll('.smart-term').forEach(term => {
      if (term._gardenTip && term._gardenTip.isConnected) return;
      const termEn = term.getAttribute('data-term-en') || '';
      const enDef = term.getAttribute('data-en-def') || '';
      if (!termEn && !enDef) return; /*@3.GARJ.264*/

      /*@3.GARJ.265*/
      const oldTip = term.querySelector('.smart-term-tooltip');
      if (oldTip) oldTip.remove();

      /*@3.GARJ.266*/
      const tip = document.createElement('div');
      tip.className = 'smart-term-tooltip';
      updateTooltipContent(tip, termEn, enDef, currentLang);
      document.body.appendChild(tip);

      /*@3.GARJ.267*/
      term._gardenTip = tip;

      term.addEventListener('mouseenter', () => showTip(term, tip));
      term.addEventListener('mouseleave', () => hideTip(tip));
      term.addEventListener('focus', () => showTip(term, tip));
      term.addEventListener('blur', () => hideTip(tip));
      /*@3.GARJ.268*/
      term.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (_smartTipActive === tip) { hideTip(tip); _smartTipActive = null; }
        else { if (_smartTipActive) hideTip(_smartTipActive); showTip(term, tip); _smartTipActive = tip; }
      }, { passive: false });
    });

    /*@3.GARJ.269*/
    if (!_smartTipDocBound) {
      _smartTipDocBound = true;
      document.addEventListener('touchstart', (e) => {
        if (_smartTipActive && !e.target.closest('.smart-term')) { hideTip(_smartTipActive); _smartTipActive = null; }
      });
    }
  }

  function updateTooltipContent(tip, termEn, enDef, lang) {
    if (lang === 'ar') {
      tip.innerHTML = `<span class="tt-label">${termEn}</span><span class="tt-def">${enDef}</span>`;
    } else {
      tip.innerHTML = `<span class="tt-def">${enDef}</span>`;
    }
  }

  function showTip(term, tip) {
    const rect = term.getBoundingClientRect();
    const pad = 12; /*@3.GARJ.270*/
    tip.classList.remove('below');

    /*@3.GARJ.271*/
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    tip.style.left = '0'; tip.style.top = '0';
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    tip.style.visibility = '';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /*@3.GARJ.272*/
    let top;
    let isBelow = false;
    if (rect.top - tipH - 10 >= pad) {
      top = rect.top - tipH - 10;
    } else {
      top = rect.bottom + 10;
      isBelow = true;
      tip.classList.add('below');
    }

    /*@3.GARJ.273*/
    let idealLeft = rect.left + rect.width / 2 - tipW / 2;
    let left = Math.max(pad, Math.min(idealLeft, vw - tipW - pad));

    /*@3.GARJ.274*/
    const termCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.max(14, Math.min(termCenter - left, tipW - 14));
    tip.style.setProperty('--arrow-left', arrowLeft + 'px');

    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.classList.add('visible');
  }

  function hideTip(tip) {
    tip.classList.remove('visible');
    /*@3.GARJ.275*/
    setTimeout(() => { if (!tip.classList.contains('visible')) tip.style.display = 'none'; }, 200);
  }

  /*@3.GARJ.276*/
  function init() {
    /*@3.GARJ.637*/
    const hLang = hashNoteLang();
    if (hLang && hLang !== currentLang) { currentLang = hLang; _hashLangSwitched = true; }
    setLanguage(currentLang);
    initDepthTabs(); initAccordion(); initFlashcards(); initQuiz();

    /* [Byte] 2026-07-02 — Hook quiz-page renderMcq for option shuffling.
       Quiz pages define renderMcq as a global before garden.js loads;
       we wrap it so options are shuffled once per question per session.
       To remove: delete this block (7 lines). */
    if (typeof renderMcq === 'function' && !window._gardenMcqHooked) {
      window._gardenMcqHooked = true;
      var _origMcq = renderMcq;
      window.renderMcq = function(idx) {
        var q = window.sessionMCQ && window.sessionMCQ[idx];
        if (q && !q._shuffled) { shuffleMcqOptions(q); q._shuffled = true; }
        return _origMcq.call(this, idx);
      };
    }

    initScrollAnimations(); initSmartSidebar(); initTOC(); initProgress(); initCopy(); initKeys();
    initSyntaxHighlight();
    initSM2Dashboard(); initActionLinks(); initNotes(); initVideos(); initMobileFabs();
    initAlgoPalette();
    initTableWrap(); initScrollToTop(); initFontSize(); initAlgoLoader();
    if (_isContentPage()) initAiSystem();   /*@3.GARJ.277*/
    initInfoBtnToggle();
    initSmartTermTooltips();
  }

  /*@3.GARJ.278*/
  function initInfoBtnToggle() {
    /*@3.GARJ.279*/
    const panel = document.createElement('div');
    panel.id = 'fc-info-panel';
    panel.className = 'fc-info-tooltip';
    document.body.appendChild(panel);

    /*@3.GARJ.280*/
    let infoOverlay = document.getElementById('fc-info-overlay');
    if (!infoOverlay) {
      infoOverlay = document.createElement('div');
      infoOverlay.className = 'fc-info-overlay';
      infoOverlay.id = 'fc-info-overlay';
      document.body.appendChild(infoOverlay);
    }

    let activeBtn = null;

    function positionPanel(btn) {
      const r = btn.getBoundingClientRect();
      const w = Math.min(300, window.innerWidth - 32);
      const gap = 10;
      /*@3.GARJ.281*/
      panel.style.width = w + 'px';
      panel.style.top = (r.bottom + gap) + 'px';
      /*@3.GARJ.282*/
      let left = r.right - w;
      left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
      panel.style.left = left + 'px';
    }

    function openPanel(btn) {
      activeBtn = btn;
      const raw = btn.getAttribute('data-fc-info') || '';
      panel.innerHTML = decodeURIComponent(raw);
      positionPanel(btn);
      panel.classList.add('open');
      panel.style.pointerEvents = 'auto';
      infoOverlay.classList.add('open');
      btn.classList.add('open');
    }

    function closePanel() {
      if (activeBtn) { activeBtn.classList.remove('open'); activeBtn = null; }
      panel.classList.remove('open');
      panel.style.pointerEvents = 'none';
      infoOverlay.classList.remove('open');
    }

    /*@3.GARJ.283*/
    document.addEventListener('mouseover', function (e) {
      const btn = e.target.closest('.fc-info-btn');
      if (btn && !panel.classList.contains('open')) {
        const raw = btn.getAttribute('data-fc-info') || '';
        panel.innerHTML = decodeURIComponent(raw);
        positionPanel(btn);
        /*@3.GARJ.284*/
      }
    });

    document.addEventListener('mouseleave', function (e) {
      /*@3.GARJ.285*/
    }, true);

    /*@3.GARJ.286*/
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.fc-info-btn');
      if (btn) {
        e.stopPropagation();
        if (panel.classList.contains('open') && activeBtn === btn) {
          closePanel();
        } else {
          openPanel(btn);
        }
        return;
      }
      /*@3.GARJ.287*/
      if (panel.contains(e.target)) return;
      closePanel();
    });

    infoOverlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  /*@3.GARJ.288*/

  /*@3.GARJ.289*/
  const GARDEN_AI_ENDPOINT = 'https://gardin-main.xxli50xx.workers.dev'; /*@3.GARJ.290*/

  const AI_CACHE_PREFIX = 'garden_ai_';
  const AI_CACHE_MAX = 50; /*@3.GARJ.291*/

  /*@3.GARJ.595*/
  const AI_CADENCE_REPLAY = true;
  /*@3.GARJ.594*/
  const AI_CADENCE = {
    thinkMs: [700, 1500, 3200],
    ttfbMs:  [900, 1800, 4200],
    /*@3.GARJ.617*/
    cps:     [77, 95, 117],
    thinkShare: 1,
    measured: 'cps+share',
  };
  function cadPick(tri) {
    const r = Math.random();
    return r < 0.5 ? tri[0] + (tri[1] - tri[0]) * (r / 0.5)
                   : tri[1] + (tri[2] - tri[1]) * ((r - 0.5) / 0.5);
  }

  function aiT(ar, en) { return currentLang === 'ar' ? ar : en; }

  /*@3.GARJ.292*/
  const AI_COURSE_NAMES = {
    'CS350': { ar: 'مقدمة في قواعد البيانات', en: 'Intro to Database' },
    'CS351': { ar: 'نظم التشغيل', en: 'Operating Systems' },
    'CS352': { ar: 'تحليل النظم وتصميمها', en: 'System Analysis & Design' },
    'CS353': { ar: 'تصميم الخوارزميات وتحليلها', en: 'Design & Analysis of Algorithms' },
  };

  /*@3.GARJ.293*/
  let AI_CATALOG = null;
  /*@3.GARJ.588*/
  let AI_CATALOG_READY = false;
  function loadAiCatalog() {
    if (AI_CATALOG !== null) return;
    AI_CATALOG = {}; /*@3.GARJ.294*/
    try {
      const gs = document.querySelector('script[src*="garden.js"]');
      const base = gs && gs.src ? gs.src.replace(/garden\.js[^/]*$/, '') : 'shared/';
      fetch(base + 'courses_catalog.json')
        .then(r => (r.ok ? r.json() : null))
        .then(j => { if (j && typeof j === 'object') AI_CATALOG = j; })
        .catch(() => { })
        .finally(() => { AI_CATALOG_READY = true; });
    } catch (e) { AI_CATALOG_READY = true; }
  }

  /*@3.GARJ.295*/
  function extractSVGComment(card) {
    try {
      const iter = document.createNodeIterator(card, NodeFilter.SHOW_COMMENT);
      let node;
      while ((node = iter.nextNode())) {
        if (node.nodeValue.includes('DIAGRAM[')) {
          // استخرج النص بعد DIAGRAM[N]:
          let raw = node.nodeValue.replace(/[\s\S]*DIAGRAM\[\d+\]:\s*/, '').trim();
          /*@3.GARJ.296*/
          raw = raw.replace(/^Detailed SVG generation prompt:\s*/i, '');
          raw = raw.replace(/^Create\s+a\s+\w[\w\s-]*showing\s+/i, '');
          /*@3.GARJ.297*/
          raw = raw.replace(/Style:[^.]+\./gi, '').replace(/viewBox[^.]+\./gi, '').trim();
          return raw;
        }
      }
    } catch (e) { }
    return '';
  }

  /*@3.GARJ.298*/
  function stripHTML(html) {
    return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  /*@3.GARJ.299*/
  function extractCardContent(card) {
    const L = currentLang;
    /*@3.GARJ.300*/
    const result = { title: '', content: '', background: '', activeLayer: '', allLayersText: '', svgBlock: '', type: 'concept', hasSVG: false, hasAlgo: false, svgOnly: false };

    /*@3.GARJ.301*/
    if (card.classList.contains('vault-section') || card.closest('.vault-section')) {
      result.type = 'vault';
    } else if (card.id === 'professor' || card.classList.contains('professor-card')) {
      result.type = 'professor';
    } else if (card.closest('.quiz-section') || card.id === 'quiz') {
      result.type = 'quiz';
    } else if (card.closest('.flashcard-section')) {
      result.type = 'flashcard';
    } else if (card.classList.contains('accordion-item') || card.closest('.accordion')) {
      result.type = 'accordion';
    } else if (card.classList.contains('objectives-card')) {
      result.type = 'objectives';
    }

    /*@3.GARJ.302*/
    if (result.type === 'accordion') {
      /*@3.GARJ.303*/
      const triggerSpan = card.querySelector('.accordion-trigger [data-bilingual]');
      if (triggerSpan) {
        const tpl = triggerSpan.querySelector(`.content-${L}`) || triggerSpan.querySelector('.content-ar');
        result.title = stripHTML(tpl?.innerHTML || triggerSpan.textContent || '');
      }
    } else {
      const h2 = card.querySelector('.concept-header h2, h2, h3');
      if (h2) {
        const tpl = h2.closest('[data-bilingual]')?.querySelector(`.content-${L}`);
        result.title = stripHTML(tpl?.innerHTML || h2.textContent || '');
      }
    }

    /*@3.GARJ.304*/
    const LAYER_LABELS = {
      ar: { flash: '⚡ سريع', full: '📖 كامل', deep: '🔬 عميق' },
      en: { flash: '⚡ Flash', full: '📖 Full', deep: '🔬 Deep' },
    };
    const labels = LAYER_LABELS[L] || LAYER_LABELS.ar;
    const focusParts = [];
    const bgParts = [];
    const allChunks = [];

    card.querySelectorAll('.depth-layer').forEach(layer => {
      const layerName = layer.getAttribute('data-layer') || layer.className.match(/layer--(\w+)/)?.[1] || '';
      const tpl = layer.querySelector(`.content-${L}`) || layer.querySelector('.content-ar');
      const text = tpl ? stripHTML(tpl.innerHTML) : layer.textContent.trim();
      if (!(text && layerName && labels[layerName])) return;
      const chunk = `[${labels[layerName]}]\n${text}`;
      allChunks.push(chunk);
      /*@3.GARJ.305*/
      if (layer.classList.contains('active')) {
        focusParts.push(chunk);
        result.activeLayer = layerName;
      } else {
        bgParts.push(chunk);
      }
    });

    if (allChunks.length) result.allLayersText = allChunks.join('\n\n');

    /*@3.GARJ.306*/
    if (!focusParts.length && bgParts.length) {
      focusParts.push(...bgParts);
      bgParts.length = 0;
    }

    if (focusParts.length) {
      result.content = focusParts.join('\n\n');
      result.background = bgParts.join('\n\n');
    } else if (result.type === 'vault') {
      /*@3.GARJ.307*/
      const entries = [];
      card.querySelectorAll('.vault-entry').forEach(entry => {
        const typeLabel = entry.querySelector('.vault-type')?.textContent?.trim() || '';
        const bodyEl = entry.querySelector('[data-bilingual]');
        const tpl = bodyEl?.querySelector(`.content-${L}`) || bodyEl?.querySelector('.content-ar');
        const text = tpl ? stripHTML(tpl.innerHTML) : '';
        if (text) entries.push(`${typeLabel}\n${text}`);
      });
      result.content = entries.join('\n\n').substring(0, 3000);
    } else if (result.type === 'accordion') {
      /*@3.GARJ.308*/
      const qEl = card.querySelector('.accordion-trigger [data-bilingual]');
      const aEl = card.querySelector('.accordion-body [data-bilingual]');
      const qTpl = qEl?.querySelector(`.content-${L}`) || qEl?.querySelector('.content-ar');
      const aTpl = aEl?.querySelector(`.content-${L}`) || aEl?.querySelector('.content-ar');
      const q = qTpl ? stripHTML(qTpl.innerHTML) : '';
      const a = aTpl ? stripHTML(aTpl.innerHTML) : '';
      if (q) result.content += (L === 'ar' ? `[السؤال]: ${q}` : `[Question]: ${q}`);
      if (a) result.content += '\n' + (L === 'ar' ? `[الإجابة]: ${a}` : `[Answer]: ${a}`);
    } else {
      /*@3.GARJ.309*/
      const texts = [];
      card.querySelectorAll('[data-bilingual]').forEach(el => {
        const tpl = el.querySelector(`.content-${L}`) || el.querySelector('.content-ar');
        if (tpl) {
          const text = stripHTML(tpl.innerHTML);
          if (text) texts.push(text);
        }
      });
      result.content = texts.join('\n').substring(0, 3000);
    }

    /*@3.GARJ.310*/
    if (card.querySelector('.svg-diagram, .concept-diagram')) {
      const svgDesc = extractSVGComment(card);
      if (svgDesc) {
        result.hasSVG = true;
        /*@3.GARJ.311*/
        const svgBlock = `[سياق الرسمة — للفهم المفاهيمي فقط، لا تُعد وصفها]:\n${svgDesc}`;
        result.svgBlock = svgBlock;
        if (!result.content.trim()) {
          /*@3.GARJ.312*/
          result.svgOnly = true;
          result.content = svgBlock;
        } else {
          /*@3.GARJ.313*/
          result.background += (result.background ? '\n\n' : '') + svgBlock;
        }
      }
    }

    /*@3.GARJ.314*/
    const algoEl = card.querySelector('.svg-placeholder, .algo-widget, [data-algo]');
    if (algoEl) {
      const algoName = algoEl.getAttribute('data-algo-name') || algoEl.getAttribute('data-algo') || '';
      const complexity = algoEl.getAttribute('data-complexity') || '';
      if (algoName || complexity) {
        let algoInfo = '';
        if (algoName) algoInfo += `الخوارزمية: ${algoName}\n`;
        if (complexity) algoInfo += `التعقيد: ${complexity}\n`;
        result.content += `\n\n[معلومات الخوارزمية]:\n${algoInfo}`;
        result.hasAlgo = true;
      }
    }

    return result;
  }

  /*@3.GARJ.315*/
  const _BASE_RULES_AR = `قواعد صارمة:
- اكتب بالعربية الفصحى البسيطة حصراً
- لا تتجاوز 150 كلمة نهائياً (حد صارم)
- لا تكرر محتوى البطاقة حرفياً
- لا تضف مقدمة أو خاتمة
- إذا كانت هناك نقاط عديدة، اربطها تحت فكرة واحدة تجمعها`;

  const _BASE_RULES_EN = `Rules (strict):
- Write in English only
- Max 130 words total (hard cap)
- Never copy card text verbatim
- No intro or closing sentence
- If multiple points exist, connect them under one unifying idea`;

  /*@3.GARJ.316*/
  const _BASE_RULES_AR_RICH = `قواعد صارمة:
- اكتب بالعربية الفصحى البسيطة حصراً
- لا تتجاوز 200 كلمة نهائياً (حد صارم)
- لا تكرر المحتوى حرفياً
- لا تضف مقدمة أو خاتمة`;

  const _BASE_RULES_EN_RICH = `Rules (strict):
- Write in English only
- Max 180 words total (hard cap)
- Never copy text verbatim
- No intro or closing sentence`;

  /*@3.GARJ.317*/
  const _BASE_RULES_AR_XL = `قواعد صارمة:
- اكتب بالعربية الفصحى البسيطة حصراً
- لا تتجاوز 300 كلمة نهائياً (حد صارم)
- أدرج مثالاً محسوساً محلولاً خطوة بخطوة إن كان الموضوع يحتمله
- لا تكرر محتوى البطاقة حرفياً
- لا تضف مقدمة أو خاتمة`;

  const _BASE_RULES_EN_XL = `Rules (strict):
- Write in English only
- Max 260 words total (hard cap)
- Include a small worked example step by step if the topic allows it
- Never copy card text verbatim
- No intro or closing sentence`;

  /*@3.GARJ.647*/
  function aiField(cat, name, L) {
    return String((cat && cat[name + '_' + (L === 'ar' ? 'ar' : 'en')]) || '').trim();
  }

  /*@3.GARJ.648*/
  const _RULE_WHOLE_AR = '- اذكر شروط أي تعريف كاملة، وإن بسّطته فصرّح بأنه مبسّط';
  const _RULE_WHOLE_EN = '- State every condition of any definition; if you simplify one, say that you did';

  /*@3.GARJ.649*/
  function withDomainRules(rules, guard, L) {
    const lines = [rules, L === 'ar' ? _RULE_WHOLE_AR : _RULE_WHOLE_EN];
    if (guard) lines.push('- ' + guard);
    return lines.join('\n');
  }

  /*@3.GARJ.318*/
  function trimAtSentence(text, limit, L) {
    const t = (text || '').trim();
    if (t.length <= limit) return t;
    const cut = t.substring(0, limit);
    /*@3.GARJ.319*/
    let idx = Math.max(
      cut.lastIndexOf('. '), cut.lastIndexOf('.\n'),
      cut.lastIndexOf('؟'), cut.lastIndexOf('!'),
      cut.lastIndexOf('\n')
    );
    /*@3.GARJ.320*/
    if (idx < limit * 0.5) idx = cut.lastIndexOf(' ');
    if (idx <= 0) idx = limit - 1;
    return cut.substring(0, idx + 1).trim() + (L === 'ar' ? ' …[اقتُطع]' : ' …[trimmed]');
  }

  /*@3.GARJ.321*/
  /*@3.GARJ.590*/
  function noLayer(d) { d.activeLayer = ''; return d; }

  function composeCardData(raw, scope) {
    if (scope === 'card' && raw.allLayersText) {
      const d = Object.assign({}, raw);
      d.content = raw.allLayersText;
      d.background = raw.svgBlock || '';
      d.svgOnly = false;
      return noLayer(d);
    }
    if (scope === 'svg' && raw.svgBlock) {
      const d = Object.assign({}, raw);
      d.content = raw.svgBlock;
      /*@3.GARJ.592*/
      d.background = raw.allLayersText || raw.content; /*@3.GARJ.322*/
      d.svgOnly = true; /*@3.GARJ.323*/
      return noLayer(d);
    }
    return raw; /*@3.GARJ.324*/
  }

  /*@3.GARJ.325*/
  const AI_STYLES = {
    simplify: {
      ar: `مهمتك الآن: اجعل الفكرة بديهية لطالب تاه في المصطلحات. اشرح في 3 أقسام مرقمة:
🪄 التشبيه: تشبيه واحد ممتد يطابق الفكرة بدقة، مأخوذ من {{ANALOGY}} — ابنِ الصورة كاملة (3-4 جمل)
🔁 من التشبيه إلى المفهوم: اربط كل عنصر في تشبيهك بمقابله التقني الصحيح واحداً واحداً
📌 الجملة الدقيقة: صياغة تقنية صحيحة واحدة يحفظها الطالب بعد أن فهم`,
      en: `Your task now: make the idea intuitive for a student lost in jargon. Explain in 3 numbered sections:
🪄 The Analogy: one extended analogy that precisely mirrors the idea, drawn from {{ANALOGY}} — build the full picture (3-4 sentences)
🔁 Analogy to Concept: map each element of your analogy to its correct technical counterpart, one by one
📌 The Precise Sentence: one technically correct formulation to keep after understanding`,
    },
    example: {
      ar: `مهمتك الآن: اشرح بالمثال لا بالتنظير، عبر مثال واحد صغير محسوس. في 3 أقسام مرقمة:
🧮 المثال: {{EXAMPLE}}
⚙️ الحل خطوة بخطوة: طبّق المفهوم على المثال خطوة خطوة واذكر ناتج كل خطوة
📌 التعميم: جملة واحدة تحوّل ما حدث في المثال إلى القاعدة العامة`,
      en: `Your task now: teach by example, not theory, through one small concrete worked example. In 3 numbered sections:
🧮 The Example: {{EXAMPLE}}
⚙️ Step-by-step Solution: apply the concept to the example step by step, stating each step's result
📌 Generalization: one sentence turning what happened in the example into the general rule`,
    },
    why: {
      ar: `مهمتك الآن: أجب عن سؤال الطالب الخفي: "لماذا يوجد هذا أصلاً؟". اشرح في 3 أقسام مرقمة:
❓ المشكلة قبل الحل: ما الذي كان ينكسر أو يستحيل قبل وجود هذا المفهوم
💡 لماذا هذا التصميم تحديداً: المنطق الذي جعل الحل بهذا الشكل وليس بشكل آخر أبسط
⚖️ الثمن المدفوع: جملة واحدة عمّا نخسره أو نعقّده مقابل هذه الفائدة`,
      en: `Your task now: answer the student's hidden question — "why does this even exist?". Explain in 3 numbered sections:
❓ The Problem Before: what used to break or be impossible before this concept existed
💡 Why This Design: the reasoning that made the solution take this exact shape and not a simpler one
⚖️ The Price Paid: one sentence on what we lose or complicate in exchange for this benefit`,
    },
    exam: {
      ar: `مهمتك الآن: جهّز الطالب لأسئلة الامتحان في هذا الموضوع تحديداً. في 3 أقسام مرقمة:
📋 أشكال السؤال المتوقعة: صيغتان مختلفتان يُسأل بهما هذا الموضوع (تعريف/مقارنة/سيناريو)
✍️ الإجابة النموذجية: سطران جاهزان للكتابة حرفياً في ورقة الإجابة
⚠️ الفخ: الخطأ الذي يخسر به الطلاب درجاتهم في هذا الموضوع بالذات`,
      en: `Your task now: prepare the student for university exam questions on this exact topic. In 3 numbered sections:
📋 Expected Question Forms: two different phrasings this topic is asked in (definition/comparison/scenario)
✍️ Model Answer: two lines ready to write verbatim on the answer sheet
⚠️ The Trap: the exact mistake students lose marks on for this specific topic`,
    },
  };

  /*@3.GARJ.327*/
  function saveAiFeedback(vote, meta) {
    try {
      const KEY = 'garden_ai_feedback';
      const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      arr.push(Object.assign({ ts: Date.now(), vote }, meta));
      while (arr.length > 200) arr.shift();
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) { }
    window.GardenEv('ai_explain_feedback', Object.assign({ vote: vote }, meta));
  }

  /*@3.GARJ.328*/
  function buildPrompt(cardData, opts) {
    opts = opts || {};
    const regenVariant = opts.regen || false;
    const prevText = opts.prevText || '';
    const subjectCode = document.documentElement.getAttribute('data-subject') || '';
    const L = currentLang;

    /*@3.GARJ.329*/
    const cat = (AI_CATALOG && AI_CATALOG[subjectCode]) || {};
    const nameEn = (cat.name_en || '').trim() || AI_COURSE_NAMES[subjectCode]?.en || '';
    const courseLabel = nameEn ? `${nameEn} (${subjectCode})` : subjectCode;
    /*@3.GARJ.589*/
    const rawModule = document.documentElement.getAttribute('data-module') || '';
    const moduleNum = /^[0-9]+$/.test(rawModule) ? rawModule : '';

    /*@3.GARJ.586*/
    let ctxLine = L === 'ar'
      ? `المادة: ${courseLabel}`
      : `Course: ${courseLabel}`;

    /*@3.GARJ.330*/
    const textbook = (cat.textbook || '').trim();
    if (textbook) {
      ctxLine += L === 'ar'
        ? `\nالكتاب المقرر (المرجع العلمي المعتمد — استند إلى مصطلحاته ومنهجه): ${textbook}`
        : `\nCourse textbook (authoritative reference — align terminology and approach with it): ${textbook}`;
    }

    /*@3.GARJ.650*/
    const personaLine = aiField(cat, 'persona', L)
      || (L === 'ar' ? 'أستاذ جامعي متخصص في هذه المادة' : 'A university professor specialised in this course');
    const analogySrc = aiField(cat, 'analogy', L)
      || (L === 'ar' ? 'شيء يعرفه الطالب من حياته' : 'something the student knows from daily life');
    const exampleKind = aiField(cat, 'example', L)
      || (L === 'ar' ? 'معطيات صغيرة محددة (أرقام أو جدول مصغر أو حالة واقعية مصغرة)'
        : 'small specific inputs (numbers, a mini table, or a miniature real case)');
    const domainGuard = aiField(cat, 'guard', L);

    /*@3.GARJ.331*/
    const FOCUS_LIMIT = 2000;
    const TOTAL_LIMIT = 2600;
    const rawContent = (cardData.content || '').trim();
    const focus = trimAtSentence(rawContent, FOCUS_LIMIT, L);
    /*@3.GARJ.332*/
    let bg = (cardData.background || '').trim();
    const bgBudget = TOTAL_LIMIT - focus.length;
    bg = (bg && bgBudget > 250) ? trimAtSentence(bg, bgBudget, L) : '';
    const content = focus + (bg
      ? (L === 'ar'
        ? '\n\n[خلفية إضافية — للسياق فقط، ركّز الشرح على المحتوى الأساسي أعلاه]:\n'
        : '\n\n[Extra background — context only; focus the explanation on the main content above]:\n') + bg
      : '');

    /*@3.GARJ.333*/
    const isComplex = cardData.hasAlgo || cardData.svgOnly ||
      cardData.activeLayer === 'deep' || rawContent.length > 900;
    const baseRules = withDomainRules(L === 'ar'
      ? (isComplex ? _BASE_RULES_AR_XL : _BASE_RULES_AR)
      : (isComplex ? _BASE_RULES_EN_XL : _BASE_RULES_EN), domainGuard, L);

    /*@3.GARJ.334*/
    const regenSuffix = regenVariant
      ? (L === 'ar'
        ? `\n\n[إعادة توليد — منظور مختلف تماماً: إذا استخدمت تشبيهاً، استخدم الآن مثالاً رقمياً أو سياقاً تطبيقياً آخر. غيّر ترتيب الأقسام وأسلوب الربط كلياً. لا تعيد نفس الجمل.]`
        : `\n\n[Regeneration — completely different angle: if you used an analogy, now use a numerical example or a different applied context. Fully change the section ordering and framing. Do not repeat any previous sentences.]`)
      : '';

    let systemPrompt, userMsg;

    /*@3.GARJ.335*/
    const styleTpl = (opts.style && opts.style !== 'auto') ? AI_STYLES[opts.style] : null;
    if (styleTpl) {
      systemPrompt = personaLine + '\n' + (L === 'ar' ? styleTpl.ar : styleTpl.en)
        + '\n' + baseRules + regenSuffix;
      userMsg = L === 'ar'
        ? `${ctxLine}\nالموضوع: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nTopic: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.336*/
    } else if (cardData.type === 'selection') {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: الطالب ظلّل هذا المقطع تحديداً من صفحة الدرس لأنه لم يفهمه. اشرح المقطع نفسه لا الموضوع العام. 3 أقسام مرقمة:
🔍 المعنى المباشر: ماذا يقول هذا المقطع بالضبط بكلمات أبسط
💡 لماذا يهم: دور هذه الجزئية في الفكرة الأكبر للدرس
📌 الخلاصة: جملة واحدة يستبدل بها الطالب المقطع في ذهنه
${baseRules}`
        : `${personaLine}
Your task now: the student highlighted this exact passage because they did not understand it. Explain the passage itself, not the general topic. 3 numbered sections:
🔍 Direct Meaning: what exactly this passage says, in simpler words
💡 Why it Matters: this piece's role in the lesson's bigger idea
📌 Takeaway: one sentence the student can mentally substitute for the passage
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nمن بطاقة: ${cardData.title}\n\n[المقطع المُظلَّل]:\n${content}`
        : `${ctxLine}\nFrom card: ${cardData.title}\n\n[Highlighted passage]:\n${content}`;

    /*@3.GARJ.337*/
    } else if (cardData.svgOnly) {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: الطالب يرى الرسمة أمامه مباشرةً — لا تعد وصف عناصرها البصرية مطلقاً.
استخدم سياق الرسمة المرفق كمرجع فقط لتبني عليه الشرح المفاهيمي.
اشرح في 3 أقسام مرقمة:
💡 المفهوم الجوهري: ما المشكلة التي تحلها هذه الرسمة أو ما الفكرة التي تجسّدها (جملتان)
🔄 الآلية بكلماتك: اشرح كيف تعمل بمثال بسيط أو تشبيه واقعي — لا تصف الأشكال أو الأسهم
📌 نقطة الامتحان: جملة واحدة دقيقة جاهزة تُكتب في ورقة المراجعة
${baseRules}`
        : `${personaLine}
Your task now: the student sees this diagram directly — do NOT redescribe its visual elements.
Use the diagram context only as a reference to build a conceptual explanation.
Explain in 3 numbered sections:
💡 Core Concept: what problem this diagram solves or what idea it embodies (2 sentences)
🔄 How it Works: explain the mechanism using a simple example or analogy — no shape or arrow descriptions
📌 Exam Note: one precise, exam-ready sentence for the review sheet
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nالمفهوم: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nConcept: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.338*/
    } else if (cardData.hasAlgo || cardData.type === 'algo') {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: اشرح هذه الخوارزمية في 3 أقسام مرقمة:
⚙️ الآلية: خطوتان بمثال رقمي صغير مناسب للخوارزمية
📊 التعقيد: جملة واحدة تفسر لماذا هذا الـ Big-O بالتحديد
⚡ متى تستخدم: ميزة وعيب واحد مقارنة ببديل واحد
${baseRules}`
        : `${personaLine}
Your task now: explain this algorithm in 3 numbered sections:
⚙️ Mechanism: 2 steps with a small numerical example appropriate to the algorithm
📊 Complexity: 1 sentence explaining why exactly this Big-O
⚡ When to use: 1 advantage and 1 drawback compared to one alternative
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nالموضوع: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nTopic: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.339*/
    } else if (cardData.type === 'professor') {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: هذا نص سردي امتحاني من أستاذ الوحدة. اشرح في 3 أقسام مرقمة:
🎯 الفكرة المحورية: ما النقطة الأهم التي يريد البروفيسور ترسيخها في ذهن الطالب (جملة واحدة)
🔗 السبب والمنطق: لماذا هذه النقطة مهمة من منظور الامتحان والتطبيق العملي
📌 نصيحة الامتحان: صِغ في جملة واحدة ما يجب أن يكتبه الطالب لو سُئل عن هذا
${baseRules}`
        : `${personaLine}
Your task now: this is a narrative exam-oriented text from the module's professor. Explain in 3 numbered sections:
🎯 Central Point: what key idea the professor most wants to cement in the student's mind (1 sentence)
🔗 Why it Matters: why this is important from an exam and practical application perspective
📌 Exam Tip: formulate in one sentence what the student should write if asked about this
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nحديث البروفيسور${moduleNum ? ' — الوحدة ' + moduleNum : ''}\n\n${content}`
        : `${ctxLine}\nProfessor's narrative${moduleNum ? ' — Module ' + moduleNum : ''}\n\n${content}`;

    /*@3.GARJ.340*/
    } else if (cardData.type === 'vault') {
      const baseRulesVault = withDomainRules(L === 'ar' ? _BASE_RULES_AR_RICH : _BASE_RULES_EN_RICH, domainGuard, L);
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: هذه مادة من خزنة الامتحان (فخ أو مفهوم أساسي أو سر)، وأنت خبير بأخطاء الطلاب فيها. اشرح كل نقطة في 3 أقسام مرقمة:
⚠️ لماذا هذا مهم: ما الذي يجعل هذا فخاً أو نقطةً حرجة بالتحديد (جملتان)
🔍 الخطأ الشائع: كيف يقع الطالب المتوسط في هذا الخطأ بالضبط — صِف سيناريو الوقوع فيه
✅ القاعدة الذهبية: جملة واحدة واضحة تصحح الفهم وتُثبَّت في الذاكرة
${baseRulesVault}`
        : `${personaLine}
Your task now: this is from the exam vault (trap, key concept, or secret) and you know where students slip. Explain each point in 3 numbered sections:
⚠️ Why it Matters: what makes this a trap or critical point specifically (2 sentences)
🔍 The Common Mistake: how exactly an average student falls into this — describe the scenario
✅ The Golden Rule: one clear sentence that corrects the understanding and sticks in memory
${baseRulesVault}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nمحتوى الخزنة: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nVault content: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.341*/
    } else if (cardData.type === 'accordion') {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: هذا سؤال وإجابته من قسم "اسأل البروفيسور". لا تعد كتابة الإجابة. اشرح في 3 أقسام مرقمة:
🤔 لماذا هذا السؤال يُطرح: ما الإشكالية الحقيقية وراء السؤال (جملة واحدة)
💡 منطق الإجابة: لماذا الإجابة هي ما هي — الخطوات المنطقية وليس الحفظ
📌 كيف تكتبها في الامتحان: أعد صياغة الإجابة في جملة جاهزة للكتابة مباشرة
${baseRules}`
        : `${personaLine}
Your task now: this is a Q&A from "Ask the Professor". Do not rewrite the answer. Explain in 3 numbered sections:
🤔 Why this question is asked: what the real underlying problem is (1 sentence)
💡 Logic of the Answer: why the answer is what it is — reasoning steps, not memorization
📌 How to write it in an exam: rephrase the answer in one sentence ready to write directly
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nسؤال وإجابة: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nQ&A: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.342*/
    } else if (cardData.type === 'objectives') {
      const baseRulesObj = withDomainRules(L === 'ar' ? _BASE_RULES_AR_RICH : _BASE_RULES_EN_RICH, domainGuard, L);
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: هذه أهداف تعلم الوحدة. ساعد الطالب على فهم ما يجب إتقانه. اشرح في 3 أقسام مرقمة:
🗺️ خريطة الوحدة: جملتان تربطان كل الأهداف تحت فكرة واحدة تجمعها
⚡ الأهداف الأصعب: حدد أي الأهداف تحتاج جهداً أكبر ولماذا
📋 اختبار الإتقان: لكل هدف، سؤال واحد يعرف الطالب به أنه أتقن الهدف
${baseRulesObj}`
        : `${personaLine}
Your task now: these are the module's learning objectives. Help the student understand what to master. Explain in 3 numbered sections:
🗺️ Module Map: 2 sentences connecting all objectives under one unifying idea
⚡ Hardest Objectives: identify which objectives need the most effort and why
📋 Mastery Test: for each objective, one question the student can use to verify mastery
${baseRulesObj}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\n${moduleNum ? 'أهداف الوحدة ' + moduleNum : 'أهداف التعلّم'}\n\n${content}`
        : `${ctxLine}\n${moduleNum ? 'Module ' + moduleNum + ' objectives' : 'Learning objectives'}\n\n${content}`;

    /*@3.GARJ.343*/
    } else if (rawContent.length > 900) {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: اشرح في 3 أقسام مرقمة:
🏗️ الصورة الكبيرة: جملتان تجمعان كل النقاط تحت فكرة واحدة
🔗 الترابط: جملة توضح كيف تفترض النقطة A معرفة B لتعمل
📌 للمراجعة: 3 نقاط بصيغة "إذا... فـ" بترتيب منطقي
${baseRules}`
        : `${personaLine}
Your task now: explain in 3 numbered sections:
🏗️ Big Picture: 2 sentences uniting all points under one idea
🔗 Connection: how point A requires knowing B to function
📌 For Review: 3 bullet points using "If...then" logic
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nالموضوع: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nTopic: ${cardData.title}\n\n${content}`;

    /*@3.GARJ.344*/
    } else {
      systemPrompt = (L === 'ar'
        ? `${personaLine}
مهمتك الآن: اشرح في 3 أقسام مرقمة:
💡 الفكرة الجوهرية: جملتان بلغتك أنت كأنك تشرح لزميلك (ابتعد تماماً عن الحفظ الحرفي)
🔗 ربط بالواقع: جملة تربط هذا بـ{{ANALOGY}} أو بمادة سابقة درسها الطالب
📌 نقطة الامتحان: جملة واحدة جاهزة للكتابة في ورقة مراجعة
${baseRules}`
        : `${personaLine}
Your task now: explain in 3 numbered sections:
💡 Core Idea: 2 sentences as if explaining to a classmate (no rote rephrasing)
🔗 Connect: one sentence linking this to {{ANALOGY}} or to a prior concept
📌 Exam Note: one concise exam-ready sentence
${baseRules}`) + regenSuffix;

      userMsg = L === 'ar'
        ? `${ctxLine}\nالموضوع: ${cardData.title}\n\n${content}`
        : `${ctxLine}\nTopic: ${cardData.title}\n\n${content}`;
    }

    /*@3.GARJ.651*/
    systemPrompt = systemPrompt
      .split('{{ANALOGY}}').join(analogySrc)
      .split('{{EXAMPLE}}').join(exampleKind);

    /*@3.GARJ.345*/
    if (opts.question) {
      userMsg += (L === 'ar'
        ? `\n\n[سؤال الطالب — أجب عنه تحديداً وبوضوح ضمن الشرح]:\n`
        : `\n\n[Student's question — answer it specifically and clearly within the explanation]:\n`) + String(opts.question).trim().substring(0, 300);
    }

    /*@3.GARJ.346*/
    if (regenVariant && prevText) {
      userMsg += (L === 'ar'
        ? `\n\n[شرحك السابق لنفس البطاقة — ممنوع تكرار زواياه أو أمثلته أو جمله]:\n`
        : `\n\n[Your previous explanation of this card — do not reuse its angles, examples, or sentences]:\n`) + trimAtSentence(prevText, 600, L);
    }

    return { systemPrompt, userMsg };
  }

  /*@3.GARJ.583*/
  const AI_PROMPT_VER = 2;
  const AI_ID_SEP = '\u0000';

  /*@3.GARJ.579*/
  function aiNormalize(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFC');
    s = s.replace(/[\u0640\u064B-\u065F\u0670\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s.replace(/[A-Z]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 32); });
  }

  /*@3.GARJ.587*/
  /*@3.GARJ.591*/
  /*@3.GARJ.581*/
  function aiIdentityString(p) {
    return 'gai1' + AI_ID_SEP + aiNormalize(p.systemPrompt) + AI_ID_SEP + aiNormalize(p.userMsg);
  }

  /*@3.GARJ.580*/
  function aiHash(str) {
    const bytes = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', bytes).then(buf => {
      const b = new Uint8Array(buf);
      let out = '';
      for (let i = 0; i < 8; i++) out += ('0' + b[i].toString(16)).slice(-2);
      return out;
    });
  }

  function aiSeg(v, dflt) {
    const s = String(v == null || v === '' ? (dflt || '_') : v);
    return s.replace(/[^A-Za-z0-9._-]/g, '_');
  }

  /*@3.GARJ.585*/
  function aiKeyPath(o) {
    o = o || {};
    return 'ai/p' + aiSeg(o.promptVer, String(AI_PROMPT_VER))
      + '/' + aiSeg(o.subject, '_')
      + '/' + aiSeg(o.lang, 'ar')
      + '/' + aiSeg(o.style, 'auto')
      + '/' + aiSeg(o.hash)
      + '/' + aiSeg(o.variant, '1') + '.json';
  }

  function aiRemoteGet(prompt, style) {
    const base = (window.GardenEndpoints && window.GardenEndpoints.aiCache) || '';
    if (!base || !prompt) return Promise.resolve(null);
    const subject = document.documentElement.getAttribute('data-subject') || '';
    return aiHash(aiIdentityString(prompt)).then(hash => {
      const url = base.replace(/\/+$/, '') + '/' + aiKeyPath({
        subject: subject, lang: currentLang, style: style || 'auto', hash: hash, variant: '1',
      });
      return fetch(url, { mode: 'cors', credentials: 'omit' });
    }).then(r => (r && r.ok ? r.json() : null))
      .then(j => (j && typeof j.text === 'string' && j.text.trim().length > 40 ? j : null))
      .catch(() => null);
  }

  /*@3.GARJ.582*/
  function aiIdentity(cardEl, scope, style) {
    const raw = extractCardContent(cardEl);
    const composed = composeCardData(raw, scope || 'card');
    const prompt = buildPrompt(composed, { style: style || 'auto' });
    const identity = aiIdentityString(prompt);
    return aiHash(identity).then(hash => ({
      hash, identity, prompt, scope: scope || 'card', style: style || 'auto', composed, raw
    }));
  }

  /*@3.GARJ.614*/
  function getAiCache(key) {
    let raw = null;
    try { raw = localStorage.getItem(key); } catch { return null; }
    if (!raw) return null;
    if (raw.charAt(0) !== '{') return { text: raw, model: '', provider: '', tier: '' };
    try {
      const j = JSON.parse(raw);
      if (typeof j.text !== 'string') return null;
      return { text: j.text, model: j.model || '', provider: j.provider || '', tier: j.tier || '' };
    } catch { return { text: raw, model: '', provider: '', tier: '' }; }
  }

  function setAiCache(key, value) {
    try {
      /*@3.GARJ.350*/
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(AI_CACHE_PREFIX)) allKeys.push(k);
      }
      if (allKeys.length >= AI_CACHE_MAX) {
        allKeys.slice(0, allKeys.length - AI_CACHE_MAX + 5).forEach(k => localStorage.removeItem(k));
      }
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch { /*@3.GARJ.351*/ }
  }

  /*@3.GARJ.352*/
  async function callAI(messages, onDelta, onThinking, extra) {
    if (!GARDEN_AI_ENDPOINT) return { error: true, text: '' };
    extra = extra || {};
    const high = extra.tier === 'high';

    try {
      const res = await fetch(GARDEN_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          /*@3.GARJ.353*/
          max_tokens: high ? 4000 : 2000,
          stream: !!onDelta,
          tier: high ? 'high' : 'base',
          cache: extra.cache || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('AI Proxy error:', res.status, err);
        return { error: true, text: '', errorData: err };
      }

      /*@3.GARJ.608*/
      const tag = {
        model: res.headers.get('X-Garden-Model') || '',
        provider: res.headers.get('X-Garden-Provider') || '',
        tier: res.headers.get('X-Garden-Tier') || '',
        escalated: res.headers.get('X-Garden-Escalated') === '1'
      };

      const ctype = res.headers.get('Content-Type') || '';
      if (onDelta && ctype.includes('text/event-stream') && res.body) {
        /*@3.GARJ.354*/
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', full = '', thinkingNotified = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop(); /*@3.GARJ.355*/
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const payload = t.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const j = JSON.parse(payload);
              if (j.garden) { Object.assign(tag, j.garden); continue; }
              const delta = j.choices?.[0]?.delta || {};
              /*@3.GARJ.356*/
              if (delta.reasoning_content && !full && !thinkingNotified) {
                thinkingNotified = true;
                if (typeof onThinking === 'function') onThinking();
              }
              const dc = delta.content || '';
              if (dc) { full += dc; onDelta(full); }
            } catch (e) { /*@3.GARJ.357*/ }
          }
        }
        return Object.assign({ error: false, text: full }, tag);
      }

      const data = await res.json();
      if (data.model) Object.assign(tag, {
        model: data.model, provider: data.provider || '',
        tier: data.tier || '', escalated: !!data.escalated
      });
      return Object.assign({ error: false, text: data.text || '' }, tag);
    } catch (e) {
      console.error('AI fetch failed:', e);
      return {
        error: true, text: '', errorData: {
          message_ar: 'فشل الاتصال بالخادم. تحقق من الرابط أو حاول لاحقاً.',
          message_en: 'Failed to connect to server. Check URL or try later.'
        }
      };
    }
  }

  /*@3.GARJ.358*/
  const _AI_ICON_HEADER = `<span class="ai-header-icon"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>`;

  /*@3.GARJ.359*/
  const _AI_ICON_SVC = `<i class="fa-solid fa-arrow-up-right-from-square ai-svc-ico" aria-hidden="true"></i>`;

  /*@3.GARJ.360*/



  /*@3.GARJ.361*/
  function showAiModal(cardData) {
    /*@3.GARJ.362*/
    document.querySelector('.ai-modal-overlay')?.remove();

    /*@3.GARJ.363*/
    const intent = { scope: 'layer', style: 'auto', question: '' };
    /*@3.GARJ.611*/
    let lastTag = { model: '', provider: '', tier: '', escalated: false, src: '' };
    let regenCount = 0;
    let lastAiText = '';
    let busy = false;
    let sysPromptNow = '';   /*@3.GARJ.364*/
    let thread = [];         /*@3.GARJ.365*/
    const MAX_FOLLOWUPS = 4;

    const hasLayers = !!cardData.allLayersText;
    const hasDiagram = !!cardData.svgBlock;

    /*@3.GARJ.366*/
    const scopeChips = [];
    if (hasLayers) {
      scopeChips.push({ id: 'layer', ico: 'fa-layer-group', label: aiT('الطبقة الحالية', 'Current layer') });
      scopeChips.push({ id: 'card', ico: 'fa-file-lines', label: aiT('البطاقة كلها', 'Whole card') });
      if (hasDiagram) scopeChips.push({ id: 'svg', ico: 'fa-image', label: aiT('الرسمة', 'Diagram') });
    }

    /*@3.GARJ.367*/
    const styleChips = [
      { id: 'auto',     ico: 'fa-wand-magic-sparkles', label: aiT('تلقائي', 'Smart') },
      { id: 'simplify', ico: 'fa-feather',             label: aiT('بسّطها لي', 'Simplify it') },
      { id: 'example',  ico: 'fa-calculator',          label: aiT('مثال محلول', 'Worked example') },
      { id: 'why',      ico: 'fa-circle-question',     label: aiT('لماذا؟', 'Why?') },
      { id: 'exam',     ico: 'fa-bullseye',            label: aiT('للامتحان', 'Exam prep') },
    ];

    const chips = (list, group, activeId) => list.map(c =>
      `<button class="ai-chip${c.id === activeId ? ' active' : ''}" data-group="${group}" data-id="${c.id}">` +
      (c.ico ? `<i class="fa-solid ${c.ico}" aria-hidden="true"></i>` : '') + `${c.label}</button>`
    ).join('');

    const REGEN_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`;
    /*@3.GARJ.368*/
    const REGEN_INNER = `${REGEN_ICON}<span class="ai-btn-label">${aiT('توليد', 'Regen')}</span>`;

    const overlay = document.createElement('div');
    overlay.className = 'ai-modal-overlay';
    window.GardenEv('ai_open', {
      s: document.documentElement.getAttribute('data-subject') || '',
      m: document.documentElement.getAttribute('data-module') || '',
      ctype: cardData && cardData.type, intent: intent.scope + '-' + intent.style
    });
    overlay.innerHTML = `
      <div class="ai-modal">
        <div class="ai-modal-header">
          <h3>${_AI_ICON_HEADER} ${aiT('شرح أعمق بالذكاء الاصطناعي', 'A Deeper AI Explanation')}</h3>
          <button class="ai-modal-close" id="ai-close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <div class="ai-intent-bar">
          ${scopeChips.length ? `<div class="ai-chip-row"><span class="ai-chip-label">${aiT('ماذا أشرح؟', 'Explain what?')}</span>${chips(scopeChips, 'scope', intent.scope)}</div>` : ''}
          <div class="ai-chip-row"><span class="ai-chip-label">${aiT('كيف؟', 'How?')}</span>${chips(styleChips, 'style', intent.style)}</div>
          <div class="ai-q-row">
            <input type="text" class="ai-q-input" id="ai-question" maxlength="300" placeholder="${aiT('ما الذي لم تفهمه بالضبط؟ (اختياري)', 'What exactly is unclear? (optional)')}">
            <button class="ai-q-send" id="ai-ask">${aiT('اشرح', 'Explain')}</button>
          </div>
        </div>
        <div class="ai-modal-body" id="ai-body">
          <div id="ai-thread"></div>
          <div class="ai-composer" id="ai-composer" style="display:none">
            <div class="ai-feedback-row" id="ai-fb"></div>
            <div class="ai-followup-row" id="ai-fu-row"></div>
          </div>
        </div>
        <div class="ai-modal-footer" id="ai-footer">
          <button class="ai-action-btn" id="ai-copy-prompt" title="${aiT('نسخ البرومبت', 'Copy prompt')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <span class="ai-btn-label">${aiT('نسخ', 'Copy')}</span>
          </button>
          ${GARDEN_AI_ENDPOINT ? `<button class="ai-action-btn ai-action-btn--regen" id="ai-regen" title="${aiT('اشرحها لي من زاوية أخرى', 'Explain it from another angle')}">${REGEN_INNER}</button>` : ''}
          <a class="ai-action-btn ai-svc-btn" href="https://chat.qwen.ai/" target="_blank" rel="noopener" title="${aiT('انسخ البرومبت وافتح Qwen', 'Copy the prompt and open Qwen')}">
            ${_AI_ICON_SVC} <span class="ai-btn-label">Qwen</span>
          </a>
          <a class="ai-action-btn ai-svc-btn" href="https://chatgpt.com/" target="_blank" rel="noopener" title="${aiT('انسخ البرومبت وافتح ChatGPT', 'Copy the prompt and open ChatGPT')}">
            ${_AI_ICON_SVC} <span class="ai-btn-label">ChatGPT</span>
          </a>
          <a class="ai-action-btn ai-svc-btn" href="https://gemini.google.com/" target="_blank" rel="noopener" title="${aiT('انسخ البرومبت وافتح Gemini', 'Copy the prompt and open Gemini')}">
            ${_AI_ICON_SVC} <span class="ai-btn-label">Gemini</span>
          </a>
          ${GARDEN_AI_ENDPOINT ? `<button class="ai-action-btn ai-action-btn--primary" id="ai-retry" style="display:none" title="${aiT('إعادة المحاولة', 'Retry')}">
            ${REGEN_ICON}
            <span class="ai-btn-label">${aiT('محاولة', 'Retry')}</span>
          </button>` : ''}
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const body = overlay.querySelector('#ai-body');
    const threadEl = overlay.querySelector('#ai-thread');
    const composer = overlay.querySelector('#ai-composer');

    /*@3.GARJ.369*/
    const close = () => {
      /*@3.GARJ.596*/
      overlay.querySelectorAll('.ai-answer-holder').forEach(h => { if (h._aiStop) h._aiStop(); });
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 250);
    };
    overlay.querySelector('#ai-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    function currentPrompt(regen) {
      const composed = composeCardData(cardData, intent.scope);
      return buildPrompt(composed, {
        regen: !!regen,
        prevText: regen ? lastAiText : '',
        style: intent.style,
        question: intent.question,
      });
    }

    /*@3.GARJ.371*/
    function threadWindow() {
      let hist = thread;
      if (hist.length > 6) hist = hist.slice(0, 2).concat(hist.slice(-4));
      return hist;
    }

    /*@3.GARJ.372*/
    function currentMessages() {
      if (thread.length && sysPromptNow) {
        return [{ role: 'system', content: sysPromptNow }].concat(threadWindow());
      }
      const p = currentPrompt(false);
      return [{ role: 'system', content: p.systemPrompt }, { role: 'user', content: p.userMsg }];
    }

    /*@3.GARJ.373*/
    function scrollBottom() { if (body) body.scrollTop = body.scrollHeight; }

    function newHolder() {
      const holder = document.createElement('div');
      holder.className = 'ai-answer-holder';
      threadEl.appendChild(holder);
      return holder;
    }

    function typesetIn(el) {
      if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
        MathJax.typesetPromise([el]).catch(() => { });
      }
    }

    function errorHTML(result) {
      const errMsg = result.errorData?.message_ar && currentLang === 'ar'
        ? result.errorData.message_ar
        : result.errorData?.message_en || aiT('النموذج يتعرض لضغط عالي حالياً.', 'AI model is under heavy load.');
      return `
        <div class="ai-error">
          <div class="ai-error-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></div>
          <div class="ai-error-msg">${errMsg}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${aiT('يمكنك نسخ البرومبت وإرساله يدوياً عبر الأزرار أدناه', 'You can copy the prompt and send it manually using the buttons below')}</div>
        </div>`;
    }

    function restoreRegenBtn() {
      const regenBtn = overlay.querySelector('#ai-regen');
      if (regenBtn) {
        regenBtn.disabled = false;
        regenBtn.innerHTML = REGEN_INNER;
      }
    }

    /*@3.GARJ.374*/
    function setFailState(failed) {
      const regenBtn = overlay.querySelector('#ai-regen');
      const retryBtn = overlay.querySelector('#ai-retry');
      if (regenBtn) regenBtn.style.display = failed ? 'none' : '';
      if (retryBtn) retryBtn.style.display = failed ? '' : 'none';
    }

    /*@3.GARJ.561*/
    function waitRing() {
      return '<div class="ai-wait" role="progressbar" aria-label="' +
        aiT('يُحضَّر الشرح', 'Preparing the explanation') + '">' +
        '<svg viewBox="0 0 44 44" aria-hidden="true">' +
          '<circle class="ai-wait-t" cx="22" cy="22" r="19"></circle>' +
          '<circle class="ai-wait-b" cx="22" cy="22" r="19"></circle>' +
        '</svg></div>';
    }

    /*@3.GARJ.593*/
    function playText(holder, text, opts, onDone) {
      opts = opts || {};
      const finish = () => {
        if (!document.body.contains(holder)) return;
        holder.innerHTML = (opts.badge || '') + '<div class="ai-result">' + formatAiText(text) + '</div>';
        typesetIn(holder);
        scrollBottom();
        if (onDone) onDone();
      };
      if (!AI_CADENCE_REPLAY || opts.instant) { finish(); return; }

      holder.innerHTML = '<div class="ai-loading">' + waitRing() +
        '<span class="ai-loading-msg">' +
        (opts.loadingMsg || aiT('جاري الشرح...', 'Generating explanation...')) +
        '</span></div>';

      const thinking = Math.random() < AI_CADENCE.thinkShare;
      const tThink = thinking ? cadPick(AI_CADENCE.thinkMs) : 0;
      const tFirst = Math.max(tThink + 300, cadPick(AI_CADENCE.ttfbMs));
      const cps = Math.max(8, cadPick(AI_CADENCE.cps));
      let streamEl = null;

      const timers = [];
      const stop = () => timers.forEach(clearTimeout);
      holder._aiStop = stop;

      if (thinking) {
        timers.push(setTimeout(() => {
          const span = holder.querySelector('.ai-loading-msg');
          if (span) span.textContent = aiT('يفكر بعمق في شرحك...', 'Thinking deeply about your explanation...');
        }, tThink));
      }

      timers.push(setTimeout(function tick() {
        if (!document.body.contains(holder)) return;
        if (!streamEl) {
          holder.innerHTML = '';
          streamEl = document.createElement('div');
          streamEl.className = 'ai-result ai-streaming';
          streamEl.setAttribute('aria-live', 'off');
          holder.appendChild(streamEl);
        }
        const t0 = Date.now();
        const step = () => {
          if (!document.body.contains(holder)) return;
          const n = Math.floor((Date.now() - t0) / 1000 * cps);
          if (n >= text.length) { finish(); return; }
          streamEl.textContent = text.slice(0, n);
          scrollBottom();
          requestAnimationFrame(step);
        };
        step();
      }, tFirst));
    }

    /*@3.GARJ.375*/
    function runAI(messages, holder, opts, onOk) {
      holder.innerHTML = `<div class="ai-loading">${waitRing()}<span class="ai-loading-msg">${opts.loadingMsg || aiT('جاري الشرح...', 'Generating explanation...')}</span></div>`;
      let streamEl = null;
      const onThinking = () => {
        /*@3.GARJ.560*/
        const span = holder.querySelector('.ai-loading-msg');
        if (span) span.textContent = aiT('يفكر بعمق في شرحك...', 'Thinking deeply about your explanation...');
      };
      const onDelta = (full) => {
        if (!document.body.contains(holder)) return;
        if (!streamEl) {
          holder.innerHTML = '';
          streamEl = document.createElement('div');
          streamEl.className = 'ai-result ai-streaming';
          streamEl.setAttribute('aria-live', 'off'); /*@3.GARJ.603*/
          holder.appendChild(streamEl);
        }
        streamEl.textContent = full; /*@3.GARJ.376*/
        scrollBottom();
      };
      var _t0 = Date.now();
      callAI(messages, onDelta, onThinking, { tier: opts.tier, cache: opts.cache }).then(result => {
        busy = false;
        lastTag = {
          model: result.model || '', provider: result.provider || '',
          tier: result.tier || '', escalated: !!result.escalated, src: 'live'
        };
        window.GardenEv('ai_answer', {
          ms: Date.now() - _t0,
          ch: (result && result.text) ? result.text.length : 0,
          err: (result && result.error) ? 1 : 0
        });
        restoreRegenBtn();
        if (!document.body.contains(overlay)) return;
        if (result.error || !result.text) {
          holder.innerHTML = errorHTML(result);
          setFailState(true);
        } else {
          setFailState(false);
          holder.innerHTML = (opts.badge || '') + `<div class="ai-result">${formatAiText(result.text)}</div>`;
          typesetIn(holder);
          onOk(result.text);
        }
        scrollBottom();
      });
    }

    /*@3.GARJ.377*/
    function generate(opts) {
      opts = opts || {};
      if (busy || !body) return;
      thread = [];
      composer.style.display = 'none';
      resetFeedback();
      resetFollowupRow();
      threadEl.innerHTML = '';
      if (opts.note) {
        const n = document.createElement('div');
        n.className = 'ai-user-q';
        n.textContent = opts.note;
        threadEl.appendChild(n);
      }
      const p = currentPrompt(!!opts.regen);
      sysPromptNow = p.systemPrompt;

      if (!GARDEN_AI_ENDPOINT) {
        threadEl.innerHTML = `
          <div class="ai-error">
            <div class="ai-error-icon"><i class="fa-solid fa-clipboard" aria-hidden="true"></i></div>
            <div class="ai-error-msg">${aiT('انسخ البرومبت وأرسله لأي نموذج ذكاء اصطناعي', 'Copy the prompt and send it to any AI model')}</div>
          </div>`;
        return;
      }

      busy = true;
      if (opts.regen) {
        const regenBtn = overlay.querySelector('#ai-regen');
        if (regenBtn) {
          regenBtn.disabled = true;
          /*@3.GARJ.378*/
          regenBtn.innerHTML = `<span class="ai-regen-spin">↻</span><span class="ai-btn-label">${aiT('جارٍ…', 'Working…')}</span>`;
        }
      }

      const holder = newHolder();
      let key = '';
      const settle = (text) => {
        if (key) setAiCache(key, {
          text: text, model: lastTag.model, provider: lastTag.provider, tier: lastTag.tier,
        });
        lastAiText = text;
        thread = [{ role: 'user', content: p.userMsg }, { role: 'assistant', content: text }];
        composer.style.display = '';
      };
      const loadingMsg = opts.regen
        ? aiT('جاري توليد شرح جديد...', 'Generating a fresh explanation...')
        : aiT('جاري الشرح...', 'Generating explanation...');
      const badge = opts.regen
        ? `<div class="ai-fresh-badge"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ${aiT('شرح جديد', 'Fresh explanation')}</div>`
        : '';
      /*@3.GARJ.612*/
      const cacheMeta = {
        subject: document.documentElement.getAttribute('data-subject') || '',
        lang: currentLang, style: intent.style, promptVer: AI_PROMPT_VER,
        store: !intent.question
      };
      const live = () => runAI(
        [{ role: 'system', content: p.systemPrompt }, { role: 'user', content: p.userMsg }],
        holder,
        { badge: badge, loadingMsg: loadingMsg, tier: opts.tier, cache: cacheMeta },
        settle
      );

      /*@3.GARJ.600*/
      holder.innerHTML = `<div class="ai-loading">${waitRing()}<span class="ai-loading-msg">${loadingMsg}</span></div>`;

      /*@3.GARJ.602*/
      const HANDLED = 'handled';
      aiHash(aiIdentityString(p)).then(hash => {
        if (!document.body.contains(holder)) return HANDLED;
        key = AI_CACHE_PREFIX + hash;
        if (opts.regen) { try { localStorage.removeItem(key); } catch (e) { } }
        const local = (!opts.force && !opts.regen) ? getAiCache(key) : null;
        if (local) {
          lastTag = {
            model: local.model, provider: local.provider, tier: local.tier,
            escalated: false, src: 'local',
          };
          /*@3.GARJ.604*/
          playText(holder, local.text, { badge: badge, loadingMsg: loadingMsg },
            () => { busy = false; settle(local.text); });
          return HANDLED;
        }
        /*@3.GARJ.601*/
        const askRemote = !opts.regen && !opts.force && !intent.question;
        return askRemote ? aiRemoteGet(p, intent.style) : null;
      }).then(hit2 => {
        if (!document.body.contains(holder)) return;
        if (hit2 === HANDLED) return;
        if (!hit2) { live(); return; }
        lastTag = {
          model: hit2.model || '', provider: hit2.provider || '',
          tier: hit2.tier || 'base', escalated: false, src: 'remote'
        };
        playText(holder, hit2.text, { badge: badge, loadingMsg: loadingMsg },
          () => { busy = false; settle(hit2.text); });
      });
    }

    /*@3.GARJ.379*/
    function followUp(msgText, displayText) {
      if (busy || !msgText || !thread.length) return;
      window.GardenEv('ai_followup', { turns: Math.max(0, Math.round((thread.length - 1) / 2)) });
      busy = true;
      const q = document.createElement('div');
      q.className = 'ai-user-q';
      q.textContent = displayText || msgText;
      threadEl.appendChild(q);
      scrollBottom();

      /*@3.GARJ.380*/
      const messages = [{ role: 'system', content: sysPromptNow }]
        .concat(threadWindow(), [{ role: 'user', content: msgText }]);

      const holder = newHolder();
      runAI(messages, holder, { loadingMsg: aiT('جاري الرد...', 'Answering...') }, (ans) => {
        thread.push({ role: 'user', content: msgText }, { role: 'assistant', content: ans });
        lastAiText = ans;
        if ((thread.length - 2) / 2 >= MAX_FOLLOWUPS) limitComposer();
      });
    }

    /*@3.GARJ.381*/
    function bindFeedback() {
      overlay.querySelectorAll('.ai-fb-btn').forEach(b => b.addEventListener('click', () => {
        const vote = b.getAttribute('data-v');
        saveAiFeedback(vote, {
          s: document.documentElement.getAttribute('data-subject') || '',
          m: document.documentElement.getAttribute('data-module') || '',
          t: (cardData.title || '').substring(0, 40),
          intent: intent.scope + '-' + intent.style,
          turns: Math.max(0, (thread.length - 2) / 2),
          ctype: cardData.type,
          /*@3.GARJ.613*/
          model: lastTag.model, provider: lastTag.provider,
          tier: lastTag.tier, src: lastTag.src, lang: currentLang,
        });
        const fb = overlay.querySelector('#ai-fb');
        if (vote === 'up') {
          if (fb) fb.innerHTML = `<span class="ai-fb-thanks"><i class="fa-solid fa-heart" aria-hidden="true"></i> ${aiT('شكراً! تقييمك يحسّن الشرح', 'Thanks! Your rating improves explanations')}</span>`;
          return;
        }
        /*@3.GARJ.609*/
        if (busy) {
          if (fb) fb.innerHTML = `<span class="ai-fb-thanks">${aiT('انتظر انتهاء الشرح الحالي', 'Wait for the current explanation to finish')}</span>`;
          return;
        }
        generate({
          force: true, tier: 'high',
          note: aiT('لم يعجبني — أعد الشرح بأقوى نموذج متاح',
            'Not helpful — re-explain with the strongest model available'),
        });
      }));
    }
    function resetFeedback() {
      const fb = overlay.querySelector('#ai-fb');
      if (!fb) return;
      fb.innerHTML = `
        <span class="ai-fb-label">${aiT('هل أفادك الشرح؟', 'Was this helpful?')}</span>
        <button class="ai-fb-btn" data-v="up" aria-label="${aiT('مفيد', 'Helpful')}"><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i></button>
        <button class="ai-fb-btn" data-v="down" aria-label="${aiT('غير مفيد', 'Not helpful')}"><i class="fa-solid fa-thumbs-down" aria-hidden="true"></i></button>`;
      bindFeedback();
    }

    /*@3.GARJ.382*/
    function resetFollowupRow() {
      const row = overlay.querySelector('#ai-fu-row');
      if (!row) return;
      row.innerHTML = `
        <button class="ai-confused-btn" id="ai-confused"><i class="fa-solid fa-face-dizzy" aria-hidden="true"></i> ${aiT('لم أفهم بعد', 'Still unclear')}</button>
        <input type="text" class="ai-q-input" id="ai-fu-input" maxlength="300" placeholder="${aiT('اسأل سؤال متابعة...', 'Ask a follow-up...')}">
        <button class="ai-q-send" id="ai-fu-send">${aiT('أرسل', 'Send')}</button>`;
      const fuInput = row.querySelector('#ai-fu-input');
      const sendFu = () => {
        const v = fuInput.value.trim();
        if (!v) return;
        fuInput.value = '';
        followUp(v);
      };
      row.querySelector('#ai-fu-send').addEventListener('click', sendFu);
      fuInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendFu(); });
      row.querySelector('#ai-confused').addEventListener('click', () => {
        followUp(
          aiT(
            'لم أفهم شرحك السابق. انزل مستوى: أعد الشرح بأسلوب أبسط بكثير، بتشبيه أسهل ومثال أصغر خطوة بخطوة، وكأنك تشرح لمبتدئ تماماً.',
            "I didn't understand your previous explanation. Go a level down: re-explain much more simply, with an easier analogy and a smaller step-by-step example, as if to a complete beginner."
          ),
          aiT('لم أفهم بعد — بسّط أكثر', "Still unclear — simplify more")
        );
      });
    }
    function limitComposer() {
      const row = overlay.querySelector('#ai-fu-row');
      if (row) row.innerHTML = `<span class="ai-fu-limit">${aiT('وصلت لحد المتابعة — استخدم «إعادة التوليد» لبدء شرح جديد', 'Follow-up limit reached — use "Regenerate" to start fresh')}</span>`;
    }

    /*@3.GARJ.383*/
    overlay.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (busy) return;
        const group = chip.getAttribute('data-group');
        const id = chip.getAttribute('data-id');
        if ((group === 'scope' ? intent.scope : intent.style) === id) return;
        overlay.querySelectorAll(`.ai-chip[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (group === 'scope') intent.scope = id; else intent.style = id;
        generate();
      });
    });

    const qInput = overlay.querySelector('#ai-question');
    const askNow = () => {
      if (busy) return;
      intent.question = qInput.value.trim();
      generate();
    };
    overlay.querySelector('#ai-ask').addEventListener('click', askNow);
    qInput.addEventListener('keydown', e => { if (e.key === 'Enter') askNow(); });

    /*@3.GARJ.384*/
    function promptTextOut() {
      const ROLE_LABEL = { system: '[System]', user: '[User]', assistant: '[Assistant]' };
      return currentMessages()
        .map(m => `${ROLE_LABEL[m.role] || '[' + m.role + ']'}:\n${m.content}`)
        .join('\n\n');
    }
    /*@3.GARJ.385*/
    function flashOK(btn) {
      if (!btn || btn.dataset.flash === '1') return;
      btn.dataset.flash = '1';
      if (!btn.dataset.html) btn.dataset.html = btn.innerHTML;
      btn.innerHTML = `<span class="ai-btn-label"><i class="fa-solid fa-check" aria-hidden="true"></i> ${aiT('نُسخ', 'Copied')}</span>`;
      setTimeout(() => { btn.innerHTML = btn.dataset.html; btn.dataset.flash = '0'; }, 1500);
    }
    function copyPrompt(btn) {
      const text = promptTextOut();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => flashOK(btn), () => {});
      }
    }
    overlay.querySelector('#ai-copy-prompt')?.addEventListener('click', e =>
      copyPrompt(e.currentTarget));

    /*@3.GARJ.386*/
    overlay.querySelectorAll('.ai-svc-btn').forEach(a =>
      a.addEventListener('click', () => copyPrompt(a)));

    /*@3.GARJ.610*/
    overlay.querySelector('#ai-regen')?.addEventListener('click', () => {
      regenCount++;
      generate({ regen: true, force: true, tier: regenCount >= 3 ? 'high' : 'base' });
    });
    overlay.querySelector('#ai-retry')?.addEventListener('click', () => generate({ force: true }));

    /*@3.GARJ.387*/
    generate();
  }

  /*@3.GARJ.388*/
  /*@3.GARJ.559*/
  var _RATER_TOK = 'gd_crate_tok';
  var _RATER_RE = /^[A-Za-z0-9_-]{20,80}$/;

  function raterLocalToken() {
    var v = '';
    try { v = localStorage.getItem(_RATER_TOK) || ''; } catch (e) {}
    if (_RATER_RE.test(v)) return v;
    var a = new Uint8Array(24);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    v = btoa(String.fromCharCode.apply(null, a))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try { localStorage.setItem(_RATER_TOK, v); } catch (e) {}
    return v;
  }

  function raterIdentity() {
    var out = {};
    try {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      if (k && /^v[0-9a-f]{32}$/.test(k)) { out.vault_id = k; return out; }
    } catch (e) {}
    out.local_token = raterLocalToken();
    return out;
  }

  window.GardenRaterId = {
    identity: raterIdentity,
    token: raterLocalToken,
    synced: function () { return !!raterIdentity().vault_id; }
  };

  /*@3.GARJ.554*/
  var _AI_EMO = {
    '\u{1FA84}': 'fa-shapes',
    '\u{1F501}': 'fa-right-left',
    '\u{1F4CC}': 'fa-thumbtack',
    '\u{1F9EE}': 'fa-calculator',
    '⚙': 'fa-gears',
    '❓': 'fa-circle-question',
    '\u{1F4A1}': 'fa-lightbulb',
    '⚖': 'fa-scale-balanced',
    '\u{1F4CB}': 'fa-clipboard-list',
    '✍': 'fa-pen-nib',
    '⚠': 'fa-triangle-exclamation',
    '✅': 'fa-circle-check',
    '❌': 'fa-circle-xmark',
    '\u{1F534}': 'fa-circle-exclamation',
    '\u{1F3AF}': 'fa-bullseye',
    '\u{1F511}': 'fa-key',
    '\u{1F4DD}': 'fa-pen-to-square',
    '\u{1F50D}': 'fa-magnifying-glass',
    '\u{1F4CA}': 'fa-chart-simple',
    '\u{1F4D0}': 'fa-ruler-combined',
    '\u{1F517}': 'fa-link',
    '\u{1F4DA}': 'fa-book',
    '\u{1F4A3}': 'fa-bomb',
    '\u{1F9E9}': 'fa-puzzle-piece'
  };

  /*@3.GARJ.555*/
  var _AI_EMO_RE = /(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[‼⁉™ℹ⌚⌛⌨⏏⏩-⏺Ⓜ▪▫▶◀◻-◾☀-☄☎☑☔☕☘☝☠☢☣☦☪☮☯☸-☺♀♂♈-♓♟♠♣♥♦♨♻♾♿⚒-⚗⚙⚛⚜⚠⚡⚪⚫⚰⚱⚽⚾⛄⛅⛈⛎⛏⛑⛓⛔⛩⛪⛰-⛵⛷-⛺⛽✂✅✈-✍✏✒✔✖✝✡✨✳✴❄❇❌❎❓-❕❗❣❤➕-➗➡➰➿⤴⤵⬅-⬇⬛⬜⭐⭕〰〽㊗㊙])[︎️]?(?:\uD83C[\uDFFB-\uDFFF])?(?:‍(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿⬀-⯿])[︎️]?)*/g;

  /*@3.GARJ.556*/
  function _aiIcoName(seq) {
    return _AI_EMO[String(seq).replace(/[︎️‍]/g, '')] || null;
  }

  /*@3.GARJ.557*/
  function aiIconMarkup(escaped) {
    return String(escaped == null ? '' : escaped).replace(_AI_EMO_RE, function (m) {
      var ico = _aiIcoName(m);
      return ico ? '<i class="fa-solid ' + ico + ' ai-ico" aria-hidden="true"></i>' : '';
    }).replace(/[ \t]{2,}/g, ' ');
  }

  /*@3.GARJ.558*/
  function aiIconInto(el, text) {
    if (!el) return;
    var src = String(text == null ? '' : text);
    var last = 0, m;
    _AI_EMO_RE.lastIndex = 0;
    while ((m = _AI_EMO_RE.exec(src))) {
      if (m.index > last) el.appendChild(document.createTextNode(src.slice(last, m.index)));
      var ico = _aiIcoName(m[0]);
      if (ico) {
        var i = document.createElement('i');
        i.className = 'fa-solid ' + ico + ' ai-ico';
        i.setAttribute('aria-hidden', 'true');
        el.appendChild(i);
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) el.appendChild(document.createTextNode(src.slice(last)));
  }

  window.GardenAIIcons = { markup: aiIconMarkup, into: aiIconInto };

  function formatAiText(text) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = s => aiIconMarkup(esc(s))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>');

    const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let para = [];
    let list = null; /*@3.GARJ.389*/
    let inCode = false, codeBuf = [];

    const flushPara = () => { if (para.length) { html += '<p>' + para.join('<br>') + '</p>'; para = []; } };
    const flushList = () => { if (list) { html += `<${list.type}>` + list.items.map(i => `<li>${i}</li>`).join('') + `</${list.type}>`; list = null; } };

    for (const rawLine of lines) {
      const t = rawLine.trim();
      /*@3.GARJ.390*/
      if (/^```/.test(t)) {
        if (inCode) {
          html += `<pre dir="ltr"><code>${esc(codeBuf.join('\n'))}</code></pre>`;
          codeBuf = []; inCode = false;
        } else {
          flushPara(); flushList(); inCode = true;
        }
        continue;
      }
      if (inCode) { codeBuf.push(rawLine); continue; }
      if (!t) { flushPara(); flushList(); continue; }
      /*@3.GARJ.391*/
      const h = t.match(/^#{1,4}\s+(.*)/);
      if (h) { flushPara(); flushList(); html += `<h4>${inline(h[1])}</h4>`; continue; }
      /*@3.GARJ.392*/
      const ul = t.match(/^[-*•]\s+(.*)/);
      const ol = t.match(/^\d+[.)]\s+(.*)/);
      if (ul || ol) {
        flushPara();
        const type = ul ? 'ul' : 'ol';
        if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
        list.items.push(inline((ul || ol)[1]));
        continue;
      }
      flushList();
      para.push(inline(t));
    }
    if (inCode && codeBuf.length) html += `<pre dir="ltr"><code>${esc(codeBuf.join('\n'))}</code></pre>`;
    flushPara(); flushList();
    return html || '<p></p>';
  }

  /*@3.GARJ.393*/
  function renderAiResult(bodyEl, html) {
    if (!bodyEl) return;
    bodyEl.innerHTML = html;
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise([bodyEl]).catch(() => { });
    }
  }

  /*@3.GARJ.394*/
  /*@3.GARJ.584*/
  function aiExplainTargets() {
    const all = document.querySelectorAll(
      '.concept-card, .professor-card, .vault-section, .objectives-card, .accordion-item'
    );
    const isQuiz = document.documentElement.getAttribute('data-page') === 'quiz';
    return Array.prototype.filter.call(all, card => {
      if (card.id === 'mcq-card' || card.id === 'final-score-screen') return false;
      /*@3.GARJ.396*/
      if (isQuiz && !card.classList.contains('accordion-item')) return false;
      return true;
    });
  }

  function initAiExplain() {
    aiExplainTargets().forEach(card => {
      if (card.querySelector('.ai-explain-btn')) return; /*@3.GARJ.395*/
      /*@3.GARJ.397*/
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative'; /*@3.GARJ.398*/
      }
      const btn = document.createElement('button');
      btn.className = 'ai-explain-btn';
      /*@3.GARJ.399*/
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>';
      btn.setAttribute('aria-label', aiT('اشرح بالذكاء', 'Explain'));
      btn.title = aiT('اشرح بالذكاء', 'Explain');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const data = extractCardContent(card);
        showAiModal(data);
      });
      card.appendChild(btn);
    });
  }

  /*@3.GARJ.400*/
  function initSvgTextOrder() {
    document.querySelectorAll('.svg-diagram svg, figure.svg-diagram > svg').forEach(svg => {
      /*@3.GARJ.401*/
      const texts = Array.from(svg.querySelectorAll('text'));
      if (!texts.length) return;
      /*@3.GARJ.402*/
      texts.forEach(t => t.parentNode.appendChild(t));
    });
  }

  /*@3.GARJ.403*/
  function initFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    /*@3.GARJ.404*/
    link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='%2310B981' d='M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384h32c18 0 32-14 32-32s-14-32-32-32V384c18 0 32-14 32-32V32c0-18-14-32-32-32H384 96zm0 384H352v64H96c-18 0-32-14-32-32s14-32 32-32zm32-240c0-9 7-16 16-16H336c9 0 16 7 16 16s-7 16-16 16H144c-9 0-16-7-16-16zm16 48H336c9 0 16 7 16 16s-7 16-16 16H144c-9 0-16-7-16-16s7-16 16-16z'/%3E%3C/svg%3E";
    document.head.appendChild(link);
  }

  /*@3.GARJ.405*/

  /*@3.GARJ.406*/
  function _isContentPage() {
    var root = document.documentElement;
    var p = root.getAttribute('data-page');
    if (p === 'review' || p === 'quiz') return true;
    if (root.hasAttribute('data-subject') && root.hasAttribute('data-module')) return true;
    /*@3.GARJ.407*/
    var gh = document.querySelector('[data-gh-variant]');
    if (gh && gh.getAttribute('data-gh-variant') === 'module') return true;
    return false;
  }
  function initAiSystem() {
    if (!_isContentPage()) return;   /*@3.GARJ.408*/
    initAiExplain();
    loadAiCatalog(); /*@3.GARJ.409*/
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initFavicon(); initSvgTextOrder(); init(); });
  } else {
    initFavicon();
    initSvgTextOrder();
    init();
  }

  /*@3.GARJ.410*/
  function changeDailyLimit(delta) {
    const fc = window._gardenFC;
    const current = fc.dailyNewLimit || 10;
    const next = Math.max(5, Math.min(50, current + delta));
    fc.dailyNewLimit = next;
    try { localStorage.setItem('garden_daily_new_limit', String(next)); } catch (e) { }
    /*@3.GARJ.411*/
    const el = document.getElementById('fc-dl-value');
    if (el) el.textContent = next;
  }


  /*@3.GARJ.412*/
  (function () {
    var SCHEDULE_KEY = 'weekly_schedule';
    var DAYS_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    function _pad2(n) { return n < 10 ? ('0' + n) : String(n); }

    function _todayStr(d) {
      d = d || new Date();
      return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate());
    }

    /*@3.GARJ.413*/
    function _weekIdOf(d) {
      var dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
      var week1 = new Date(dt.getFullYear(), 0, 4);
      var weekNum = 1 + Math.round(((dt - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      return dt.getFullYear() + '-W' + _pad2(weekNum);
    }

    /*@3.GARJ.414*/
    function _getTodayBannerData() {
      var raw;
      try { raw = localStorage.getItem(SCHEDULE_KEY); } catch (e) { raw = null; }
      if (!raw) return { hasData: false };
      var sch;
      try { sch = JSON.parse(raw); } catch (e) { return { hasData: false }; }
      if (!sch || typeof sch !== 'object') return { hasData: false };

      var lectures = sch.lectures || [];
      var studyBlocks = sch.study_blocks || [];
      var exams = sch.exams || [];
      if (!lectures.length && !studyBlocks.length && !exams.length) return { hasData: false };

      var now = new Date();
      var today = _todayStr(now);
      var dayKey = DAYS_ORDER[now.getDay()];
      var wid = _weekIdOf(now);
      var overrides = (sch.week_overrides && sch.week_overrides[wid]) || {};
      var cancelled = overrides.cancelled_lectures || [];
      var completed = overrides.completed_events || [];

      /*@3.GARJ.619*/
      var R = window.GardenScheduleRules;
      var d0 = new Date(now); d0.setHours(0, 0, 0, 0);

      var todayEvents = [];
      lectures.forEach(function (l) {
        if (!l || l.day !== dayKey || !l.recurring) return;
        if (cancelled.indexOf(l.id) !== -1) return;
        if (R && !R.lectureOn(l, d0).on) return;
        todayEvents.push({
          id: l.id, start: l.start_time || '', course: l.course_code || '',
          done: completed.indexOf(l.id) !== -1
        });
      });
      studyBlocks.forEach(function (b) {
        if (!b || b.day !== dayKey) return;
        if (R ? !R.blockOn(b, d0).on
              : (b.week_id != null && b.week_id !== wid)) return;
        todayEvents.push({
          id: b.id, start: b.start_time || '', course: b.course_code || '',
          done: completed.indexOf(b.id) !== -1
        });
      });
      exams.forEach(function (ex) {
        if (!ex || ex.date !== today) return;
        todayEvents.push({
          id: ex.id, start: ex.start_time || '', course: ex.course_code || '',
          done: !!ex.completed_at
        });
      });

      todayEvents.sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); });

      var doneCount = 0;
      todayEvents.forEach(function (e) { if (e.done) doneCount++; });

      /*@3.GARJ.415*/
      var nowHM = _pad2(now.getHours()) + ':' + _pad2(now.getMinutes());
      var next = null;
      for (var i = 0; i < todayEvents.length; i++) {
        if (!todayEvents[i].done && todayEvents[i].start >= nowHM) { next = todayEvents[i]; break; }
      }
      if (!next) {
        for (var j = 0; j < todayEvents.length; j++) {
          if (!todayEvents[j].done) { next = todayEvents[j]; break; }
        }
      }

      return {
        hasData: true,
        todayTotal: todayEvents.length,
        todayDone: doneCount,
        progressPct: todayEvents.length ? Math.round((doneCount / todayEvents.length) * 100) : 0,
        next: next,
        scheduleUrl: ROOT + 'hub/schedule.html'
      };
    }

    /*@3.GARJ.416*/
    if (!window.GardenToday) window.GardenToday = {};
    window.GardenToday.getTodayBannerData = _getTodayBannerData;

    /*@3.GARJ.417*/
    function _updateTodayBanner() {
      var banner = document.getElementById('today-banner');
      if (!banner) return; /*@3.GARJ.418*/
      var data = _getTodayBannerData();
      var isAr = (document.documentElement.lang || localStorage.getItem('garden_lang') || 'ar') === 'ar';

      if (!data.hasData) {
        /*@3.GARJ.419*/
        banner.style.display = 'none';
        return;
      }

      /*@3.GARJ.420*/
      banner.style.display = 'flex';

      var titleEl = document.getElementById('today-banner-title');
      if (titleEl) {
        titleEl.textContent = data.todayTotal > 0
          ? (isAr
            ? ('اليوم: ' + data.todayDone + ' من ' + data.todayTotal + ' مكتمل')
            : ('Today: ' + data.todayDone + ' of ' + data.todayTotal + ' done'))
          : (isAr ? 'لا أحداث اليوم' : 'No events today');
      }

      var subEl = document.getElementById('today-banner-subtitle');
      if (subEl) {
        if (data.next) {
          subEl.textContent = isAr
            ? ('القادم: ' + (data.next.course || '') + (data.next.start ? ' الساعة ' + data.next.start : ''))
            : ('Next: ' + (data.next.course || '') + (data.next.start ? ' at ' + data.next.start : ''));
        } else {
          subEl.textContent = isAr ? 'الجدول الأسبوعي' : 'Weekly schedule';
        }
      }

      var pctEl = document.getElementById('today-banner-pct');
      if (pctEl) pctEl.textContent = data.progressPct + '%';

      var fillEl = document.getElementById('today-banner-bar-fill');
      if (fillEl) fillEl.style.width = data.progressPct + '%';

      /*@3.GARJ.421*/
    }

    /*@3.GARJ.422*/
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(_updateTodayBanner, 100); });
    } else {
      /*@3.GARJ.423*/
      setTimeout(_updateTodayBanner, 100);
    }
    /*@3.GARJ.424*/
    window.addEventListener('focus', _updateTodayBanner);
    /*@3.GARJ.425*/
    window.GardenToday.refreshBanner = _updateTodayBanner;
  })();

  /*@3.GARJ.426*/
  function garden_lang() {
    return document.documentElement.getAttribute('lang') || 'ar';
  }
  function arabicCount(n, singular, dual, plural, isAdj) {
    if (n === 0) return n + ' ' + plural;
    if (n === 1) return isAdj ? ('1 ' + singular) : (singular + ' واحدة');
    if (n === 2) return dual;
    if (n >= 3 && n <= 10) return n + ' ' + plural;
    return n + ' ' + singular;
  }
  function englishCount(n, singular, plural) {
    return n + ' ' + (n === 1 ? singular : plural);
  }
  function smartCount(n, arForms, enForms, isAdj) {
    return (garden_lang() === 'ar')
      ? arabicCount(n, arForms[0], arForms[1], arForms[2], isAdj)
      : englishCount(n, enForms[0], enForms[1]);
  }
  function countWord(n, arForms, enForms) {
    if (garden_lang() === 'ar') {
      if (n === 1) return arForms[0];
      if (n === 2) return arForms[1];
      if (n >= 3 && n <= 10) return arForms[2];
      return arForms[0];
    }
    return (n === 1) ? enForms[0] : enForms[1];
  }

  /*@3.GARJ.427*/

  /*@3.GARJ.428*/
  var NAV_STACK_KEY = 'garden_nav_stack';
  /*@3.GARJ.429*/
  function _canonUrl(h) {
    try {
      var u = new URL(h, location.href);
      u.hash = '';
      if (/\/$/.test(u.pathname)) u.pathname += 'index.html';
      return u.href;
    } catch (e) { return String(h || ''); }
  }
  function _navStackRead() {
    try { return JSON.parse(sessionStorage.getItem(NAV_STACK_KEY) || '[]'); } catch (e) { return []; }
  }
  function _navStackWrite(a) {
    try { sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(a.slice(-50))); } catch (e) {}
  }
  function _pushNavStack() {
    var here = location.href, canon = _canonUrl(here);
    var st = _navStackRead();
    if (st.length && _canonUrl(st[st.length - 1]) === canon) return;   /*@3.GARJ.430*/
    if (st.length >= 2 && _canonUrl(st[st.length - 2]) === canon) {
      st.pop();
      _navStackWrite(st);
      return;
    }
    st.push(here);
    _navStackWrite(st);
  }
  function hasBackTarget() { return _navStackRead().length > 1; }
  /*@3.GARJ.431*/
  function goBack() {
    var st = _navStackRead();
    if (st.length < 2) return false;
    st.pop();
    var target = st[st.length - 1];
    _navStackWrite(st);
    location.href = target;
    return true;
  }
  /*@3.GARJ.432*/
  function goUp(href) {
    var abs = _canonUrl(href);
    var st = _navStackRead();
    st.pop();                                       /*@3.GARJ.433*/
    if (!st.length || _canonUrl(st[st.length - 1]) !== abs) st.push(abs);
    _navStackWrite(st);
    location.href = href;
    return true;
  }
  /*@3.GARJ.434*/
  function isSelfHref(href) { return _canonUrl(href) === _canonUrl(location.href); }

  /*@3.GARJ.435*/
  _pushNavStack();

  function _navL(ar, en) { return (currentLang === 'ar') ? ar : en; }

  /*@3.GARJ.436*/
  function ensureNavAffordances() {
    var nav = document.querySelector('.header-nav');
    if (!nav) return;

    /*@3.GARJ.437*/
    if (!nav.querySelector('.g-nav-home')) {
      var home = document.createElement('a');
      home.className = 'nav-btn nav-btn--icon g-nav-home';
      home.href = ROOT + 'index.html';
      home.innerHTML = '<img src="' + ROOT + 'shared/icons/logo-mark.svg" alt="" width="17" height="17" aria-hidden="true">';
      home.title = _navL('الحديقة الرقمية — الرئيسية', 'Digital Garden — Home');
      home.setAttribute('aria-label', home.title);
      home.setAttribute('data-ar-title', 'الحديقة الرقمية — الرئيسية');
      home.setAttribute('data-en-title', 'Digital Garden — Home');
      nav.insertBefore(home, nav.firstChild);
    }

    /*@3.GARJ.438*/
    if (!nav.querySelector('.g-nav-back')) {
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'nav-btn nav-btn--icon g-nav-back';
      back.innerHTML = '<i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i>';
      back.title = _navL('رجوع خطوة', 'Back one step');
      back.setAttribute('aria-label', back.title);
      back.setAttribute('data-ar-title', 'رجوع خطوة');
      back.setAttribute('data-en-title', 'Back one step');
      back.addEventListener('click', function () { goBack(); });
      /*@3.GARJ.439*/
      if (!hasBackTarget()) back.style.display = 'none';
      var homeEl = nav.querySelector('.g-nav-home');
      nav.insertBefore(back, homeEl ? homeEl.nextSibling : nav.firstChild);
    }

    /*@3.GARJ.440*/
    var up2 = nav.querySelector('.nav-btn--icon[title="Home"]');
    if (up2) {
      up2.title = _navL('صفحة المادة', 'Course page');
      up2.setAttribute('aria-label', up2.title);
      up2.setAttribute('data-ar-title', 'صفحة المادة');
      up2.setAttribute('data-en-title', 'Course page');
    }
  }

  /*@3.GARJ.441*/

  /*@3.GARJ.442*/
  function _fixFooterBrand() {
    var el = document.querySelector('.footer-brand');
    if (!el) return;
    var p = location.pathname;
    var m = p.match(/\/L(\d+)\//);
    var label = m ? 'CS Level ' + m[1] : (/\/others\//.test(p) ? 'General Courses' : null);
    if (!label) return;                       /*@3.GARJ.443*/
    el.innerHTML = '<i class="fa-solid fa-seedling" aria-hidden="true"></i> <span></span> · Digital Garden';
      el.querySelector('span').textContent = label;
  }
  function _bootPage() {
    applyTheme(currentTheme);
    _fixFooterBrand();
    hookExamPages();
    /*@3.GARJ.444*/
  }

  /*@3.GARJ.445*/
  document.addEventListener('click', function (e) {
    var inp = e.target.closest && e.target.closest('input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=week]');
    if (!inp || inp.disabled || inp.readOnly) return;
    if (typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch (_) {} }
  });

  /*@3.GARJ.446*/
  hookExamPages();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootPage);
  } else {
    _bootPage();
  }

  var MODULE_VISITS_LS = 'garden_module_visits';

  function moduleVisitStore() {
    var raw = null;
    try { raw = localStorage.getItem(MODULE_VISITS_LS); } catch (e) { return {}; }
    if (!raw) return {};
    try {
      var d = JSON.parse(raw);
      return (d && typeof d === 'object') ? d : {};
    } catch (e) { return {}; }
  }

  function moduleVisits(code) {
    var all = moduleVisitStore();
    var out = {};
    var pre = String(code || '') + '_';
    Object.keys(all).forEach(function (k) {
      if (k.indexOf(pre) !== 0) return;
      var v = all[k];
      out[k.slice(pre.length)] = (v && typeof v === 'object') ? (parseInt(v.n, 10) || 0) : (parseInt(v, 10) || 0);
    });
    return out;
  }

  /*@3.GARJ.620*/
  function noteModuleVisit(code, mod) {
    var n = parseInt(mod, 10);
    if (!code || !(n > 0)) return false;
    var all = moduleVisitStore();
    var k = String(code) + '_' + n;
    var d0 = new Date(); d0.setHours(0, 0, 0, 0);
    var day = d0.getTime();
    var cur = all[k];
    if (cur && typeof cur === 'object' && cur.d === day) return false;
    all[k] = { n: ((cur && typeof cur === 'object' ? parseInt(cur.n, 10) : parseInt(cur, 10)) || 0) + 1, d: day };
    try { localStorage.setItem(MODULE_VISITS_LS, JSON.stringify(all)); return true; }
    catch (e) { return false; }
  }

  window.Garden = {

    cycleTheme, toggleLanguage, setLanguage, applyTheme,
    /*@3.GARJ.447*/
    localize,
    goBack, hasBackTarget, goUp, isSelfHref, ensureNavAffordances,
    smartCount, countWord,
    flip: flipCard, grade: gradeCard, resetFC, report: showSM2Report,
    practice: startPractice, renderPractice, renderFC: renderFlashcard,
    browse: startBrowse, loosePrev, looseNext, exitLoose,
    undo: undoGrade, bury: buryCard, filterFC, quickReview,
    launchConfetti,
    changeDailyLimit,
    toggle3D: (v) => { setMobile3D(typeof v === 'boolean' ? v : !getMobile3D()); },
    getStreak: calculateStreak, getRetention: getRetentionRate,
    pick: selectOption, nextQ, retryQuiz, showQuizHint: showHint,
    recordQuiz, recordQuizByKey, quizLog: readQuizLog,
    fontUp: () => changeFontSize(1), fontDown: () => changeFontSize(-1), setFontSize: applyFontSize,
    aiExplain: showAiModal, extractCard: extractCardContent,
    aiTargets: aiExplainTargets, aiIdentity,
    aiReady: () => AI_CATALOG_READY,
    aiKey: { normalize: aiNormalize, identityString: aiIdentityString, hash: aiHash, path: aiKeyPath, promptVer: AI_PROMPT_VER },
    /*@3.GARJ.618*/
    aiCadence: AI_CADENCE,
    moduleVisits: moduleVisits,
    noteModuleVisit: noteModuleVisit,
    toast: notesToast
  };

  /*@3.GARJ.448*/

  ; (function () {
    'use strict';

    /*@3.GARJ.449*/
    function getLang() {
      return document.documentElement.getAttribute('lang') || 'ar';
    }

    function essayKey() {
      const s = document.documentElement.getAttribute('data-subject') || 'XX';
      const p = document.documentElement.getAttribute('data-page') || 'review';
      const t = document.documentElement.getAttribute('data-review-type') || 'mid';
      return `garden_${s}_${p}_${t}_essays`;
    }

    function loadEssayProgress() {
      try { return JSON.parse(sessionStorage.getItem(essayKey())) || {}; } catch (e) { return {}; }
    }

    function saveEssayProgress(state) {
      try { sessionStorage.setItem(essayKey(), JSON.stringify(state)); } catch (e) { }
    }

    /*@3.GARJ.450*/
    const essayI18n = {
      ar: {
        'essay.title': '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> أسئلة المقالي',
        'essay.score': 'نقاطك:',
        'essay.write': 'اكتب إجابتك هنا...',
        'essay.reveal': '<i class="fa-solid fa-eye" aria-hidden="true"></i> أظهر الإجابة النموذجية',
        'essay.answer_label': '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i> الإجابة النموذجية',
        'essay.grade_prompt': 'قيّم إجابتك:',
        'essay.correct': '<i class="fa-solid fa-check" aria-hidden="true"></i> أجبت صحيح',
        'essay.wrong': '<i class="fa-solid fa-xmark" aria-hidden="true"></i> لم أتذكر',
        'essay.q_num': 'سؤال',
        'essay.module': 'وحدة',
      },
      en: {
        'essay.title': '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Essay Questions',
        'essay.score': 'Score:',
        'essay.write': 'Write your answer here...',
        'essay.reveal': '<i class="fa-solid fa-eye" aria-hidden="true"></i> Show Model Answer',
        'essay.answer_label': '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i> Model Answer',
        'essay.grade_prompt': 'Rate your answer:',
        'essay.correct': '<i class="fa-solid fa-check" aria-hidden="true"></i> I got it right',
        'essay.wrong': '<i class="fa-solid fa-xmark" aria-hidden="true"></i> I missed it',
        'essay.q_num': 'Q',
        'essay.module': 'Module',
      }
    };

    function t(key) {
      const L = getLang();
      return essayI18n[L]?.[key] || essayI18n.ar[key] || key;
    }

    /*@3.GARJ.451*/
    window._gardenEssay = { questions: null, state: {}, correct: 0 };

    function initEssayEngine() {
      const el = document.getElementById('essay-data');
      if (!el) return;

      let questions;
      try { questions = JSON.parse(el.textContent); }
      catch (e) { console.warn('[Garden Essay] Failed to parse essay-data:', e); return; }

      if (!Array.isArray(questions) || questions.length === 0) return;

      window._gardenEssay.questions = questions;
      window._gardenEssay.state = loadEssayProgress();

      /*@3.GARJ.452*/
      window._gardenEssay.correct = Object.values(window._gardenEssay.state)
        .filter(v => v === 1).length;

      renderEssaySection();
    }

    function renderEssaySection() {
      const container = document.getElementById('essay-container');
      if (!container) return;

      const questions = window._gardenEssay.questions;
      const state = window._gardenEssay.state;
      const L = getLang();

      /*@3.GARJ.453*/
      const totalEl = document.getElementById('essay-total');
      if (totalEl) totalEl.textContent = questions.length;

      /*@3.GARJ.454*/
      updateEssayScoreUI();

      /*@3.GARJ.455*/
      container.innerHTML = questions.map((q, i) => {
        const graded = state[i];
        const wasRevealed = graded !== undefined;
        const isCorrect = graded === 1;
        const borderColor = !wasRevealed ? 'var(--brand-500)' : isCorrect ? '#10b981' : '#ef4444';

        const questionText = q.question?.[L] || q.question?.ar || '';
        const answerText = q.answer?.[L] || q.answer?.ar || '';
        const moduleNum = q.module || '?';

        return `
<div class="essay-item glass-card" id="essay-item-${i}"
     data-graded="${graded !== undefined ? graded : ''}"
     style="border-inline-start-color:${borderColor}">
  <div class="essay-item-header">
    <span class="module-chip">${t('essay.module')} ${moduleNum}</span>
    <span style="font-size:0.8rem;font-weight:800;color:var(--text-muted)">#${i + 1}</span>
    ${wasRevealed ? `<span style="font-size:0.8rem;font-weight:700;color:${isCorrect ? '#10b981' : '#ef4444'}">
      ${isCorrect ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'}
    </span>` : ''}
  </div>

  <div class="essay-question-text" data-bilingual>
    <template class="content-ar">${q.question?.ar || ''}</template>
    <template class="content-en">${q.question?.en || ''}</template>
    <div class="content-target">${questionText}</div>
  </div>

  <textarea class="essay-textarea" id="essay-ta-${i}"
    placeholder="${t('essay.write')}"
    rows="4">${state['ta_' + i] || ''}</textarea>

  <button class="essay-reveal-btn ${wasRevealed ? 'hidden' : ''}"
          id="essay-reveal-${i}" onclick="Garden.revealEssay(${i})">
    ${t('essay.reveal')}
  </button>

  <div class="essay-answer-box ${wasRevealed ? '' : 'hidden'}" id="essay-answer-${i}">
    <span class="essay-answer-label">${t('essay.answer_label')}</span>
    <div data-bilingual>
      <template class="content-ar">${q.answer?.ar || ''}</template>
      <template class="content-en">${q.answer?.en || ''}</template>
      <div class="content-target">${answerText}</div>
    </div>

    <div class="essay-grade-bar" id="essay-grade-bar-${i}">
      <span class="essay-grade-label">${t('essay.grade_prompt')}</span>
      <button class="essay-grade-btn essay-grade-btn--correct ${graded === 1 ? 'active' : ''}"
              id="essay-grade-correct-${i}"
              onclick="Garden.gradeEssay(${i}, 1)"
              ${wasRevealed ? 'disabled' : ''}>
        ${t('essay.correct')}
      </button>
      <button class="essay-grade-btn essay-grade-btn--wrong ${graded === 0 ? 'active' : ''}"
              id="essay-grade-wrong-${i}"
              onclick="Garden.gradeEssay(${i}, 0)"
              ${wasRevealed ? 'disabled' : ''}>
        ${t('essay.wrong')}
      </button>
    </div>
  </div>
</div>`;
      }).join('');

      /*@3.GARJ.456*/
      questions.forEach((_, i) => {
        const ta = document.getElementById(`essay-ta-${i}`);
        if (ta) {
          ta.addEventListener('blur', () => {
            window._gardenEssay.state['ta_' + i] = ta.value;
            saveEssayProgress(window._gardenEssay.state);
          });
        }
      });
    }

    function revealEssay(idx) {
      const L = getLang();
      const q = window._gardenEssay.questions?.[idx];
      if (!q) return;

      /*@3.GARJ.457*/
      document.getElementById(`essay-reveal-${idx}`)?.classList.add('hidden');
      document.getElementById(`essay-answer-${idx}`)?.classList.remove('hidden');

      /*@3.GARJ.458*/
      const ta = document.getElementById(`essay-ta-${idx}`);
      if (ta) {
        window._gardenEssay.state['ta_' + idx] = ta.value;
      }
      saveEssayProgress(window._gardenEssay.state);
    }

    function gradeEssay(idx, correct) {
      const was = window._gardenEssay.state[idx];

      /*@3.GARJ.459*/
      if (was === 1) window._gardenEssay.correct--;
      if (correct) window._gardenEssay.correct++;

      /*@3.GARJ.460*/
      window._gardenEssay.state[idx] = correct;
      saveEssayProgress(window._gardenEssay.state);

      /*@3.GARJ.461*/
      const item = document.getElementById(`essay-item-${idx}`);
      if (item) {
        item.style.borderInlineStartColor = correct ? '#10b981' : '#ef4444';
        item.setAttribute('data-graded', correct);
      }

      /*@3.GARJ.462*/
      const btnCorrect = document.getElementById(`essay-grade-correct-${idx}`);
      const btnWrong = document.getElementById(`essay-grade-wrong-${idx}`);
      [btnCorrect, btnWrong].forEach(b => { if (b) { b.disabled = true; b.classList.remove('active'); } });
      if (correct && btnCorrect) btnCorrect.classList.add('active');
      if (!correct && btnWrong) btnWrong.classList.add('active');

      updateEssayScoreUI();
    }

    function updateEssayScoreUI() {
      const scoreEl = document.getElementById('essay-score');
      if (scoreEl) scoreEl.textContent = window._gardenEssay.correct;
      const totalEl = document.getElementById('essay-total');
      if (totalEl) totalEl.textContent = window._gardenEssay.questions?.length || 0;
    }

    function refreshEssayLanguage() {
      /*@3.GARJ.463*/
      if (!window._gardenEssay.questions) return;
      const L = getLang();

      /*@3.GARJ.464*/
      document.querySelectorAll('.essay-textarea').forEach(ta => {
        ta.setAttribute('dir', L === 'ar' ? 'rtl' : 'ltr');
        ta.style.direction = L === 'ar' ? 'rtl' : 'ltr';
        ta.style.textAlign = L === 'ar' ? 'right' : 'left';
        ta.placeholder = t('essay.write');
      });

      /*@3.GARJ.465*/
      window._gardenEssay.questions.forEach((_, i) => {
        const bc = document.getElementById(`essay-grade-correct-${i}`);
        const bw = document.getElementById(`essay-grade-wrong-${i}`);
        /*@3.GARJ.466*/
        if (bc) bc.innerHTML = t('essay.correct');
        if (bw) bw.innerHTML = t('essay.wrong');
        const rb = document.getElementById(`essay-reveal-${i}`);
        if (rb) rb.innerHTML = t('essay.reveal');
      });

      /*@3.GARJ.467*/
      document.querySelectorAll('.essay-grade-label').forEach(el => {
        el.textContent = t('essay.grade_prompt');
      });
      document.querySelectorAll('.essay-answer-label').forEach(el => {
        el.innerHTML = t('essay.answer_label');
      });
      updateEssayScoreUI();
    }

    /*@3.GARJ.468*/
    function patchLanguageToggle() {
      document.addEventListener('garden:languageChanged', function () {
        refreshEssayLanguage();
      });
    }

    /*@3.GARJ.469*/
    function initAdditions() {
      initEssayEngine();
      patchLanguageToggle();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAdditions);
    } else {
      initAdditions();
    }

    /*@3.GARJ.470*/
    if (!window.Garden) window.Garden = {};
    window.Garden.revealEssay = revealEssay;
    window.Garden.gradeEssay = gradeEssay;
    window.Garden.refreshEssays = renderEssaySection;

  })();
})();


/*@3.GARJ.471*/
;(function () {
  'use strict';

  /*@3.GARJ.472*/
  function isQuizPage() {
    return !!document.getElementById('mcq-engine');
  }

  /*@3.GARJ.473*/
  function _hashStr(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  /*@3.GARJ.474*/
  function _shuffleQuestionOptions(qArr) {
    if (!qArr || !Array.isArray(qArr)) return;
    qArr.forEach(function (q) {
      if (q._shuffled) return;                        /*@3.GARJ.475*/
      var opts = q.options;
      if (!opts) { q._shuffled = true; return; }
      var langs = Object.keys(opts);
      var numOpts = (opts[langs[0]] || []).length;
      if (numOpts < 2) { q._shuffled = true; return; }

      /*@3.GARJ.476*/
      var order = [];
      for (var i = 0; i < numOpts; i++) order.push(i);
      var s = _hashStr(String(q.id !== undefined ? q.id : Math.random()));
      for (var i = order.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) >>> 0;
        var j = s % (i + 1);
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }

      /*@3.GARJ.477*/
      langs.forEach(function (lang) {
        var orig = opts[lang].slice();
        opts[lang] = order.map(function (idx) { return orig[idx]; });
      });

      /*@3.GARJ.478*/
      q.correctIndex = order.indexOf(q.correctIndex);
      q._shuffled = true;
    });
  }

  /*@3.GARJ.479*/
  function _fixHintButtonTranslation() {
    var btn = document.getElementById('mcq-hint-btn');
    if (!btn) return;
    btn.querySelectorAll('span').forEach(function (sp) {
      if (sp.querySelector('template.content-ar') && !sp.hasAttribute('data-bilingual')) {
        sp.setAttribute('data-bilingual', '');
      }
    });
  }

  /*@3.GARJ.480*/
  function _addEssayModuleFilter() {
    var essaySection = document.getElementById('essay-section');
    if (!essaySection) return;

    /*@3.GARJ.481*/
    var essayArr = (typeof sessionEssay !== 'undefined') ? sessionEssay : [];
    if (!essayArr || !essayArr.length) {
      /*@3.GARJ.482*/
      essayArr = (typeof essayBank !== 'undefined') ? essayBank : [];
    }
    var modSet = {};
    essayArr.forEach(function (q) { modSet[q.module] = true; });
    var modules = Object.keys(modSet).map(Number).sort(function (a, b) { return a - b; });
    if (!modules.length) return;

    /*@3.GARJ.483*/
    essayArr.forEach(function (q, i) {
      var item = document.getElementById('essay-item-' + i);
      if (item) item.setAttribute('data-essay-module', q.module);
    });

    /*@3.GARJ.484*/
    if (document.getElementById('essay-module-toolbar')) return;

    var lang = document.documentElement.getAttribute('lang') || 'ar';
    var allText   = lang === 'ar' ? 'الكل' : 'All';
    var labelText = lang === 'ar' ? 'تصفية الوحدة:' : 'Filter Module:';

    /*@3.GARJ.485*/
    var toolbar = document.createElement('div');
    toolbar.id = 'essay-module-toolbar';
    toolbar.style.cssText = [
      'display:flex','flex-wrap:wrap','gap:0.5rem','align-items:center',
      'margin-bottom:1.25rem','padding:0.75rem 1rem',
      'background:var(--bg-surface)','border-radius:var(--radius-lg)',
      'border:1px solid var(--border-color)','box-shadow:0 4px 10px var(--shadow-base)'
    ].join(';');

    var html = '<span style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-inline-end:0.4rem">' + labelText + '</span>';
    html += '<button class="tag tag--accent" id="essay-filter-0" onclick="_quizPatch.filterEssay(0)">' + allText + '</button>';
    modules.forEach(function (m) {
      html += '<button class="tag" id="essay-filter-' + m + '" onclick="_quizPatch.filterEssay(' + m + ')">M' + m + '</button>';
    });
    toolbar.innerHTML = html;

    var container = document.getElementById('essay-questions-container');
    if (container) container.parentNode.insertBefore(toolbar, container);
  }

  /*@3.GARJ.486*/
  var _selectedMCQModules = []; /*@3.GARJ.487*/

  function _buildMultiModuleSession() {
    if (typeof mcqBank === 'undefined' || typeof seededRNG === 'undefined') return;

    var seed = Date.now().toString(36);
    var pool;

    if (!_selectedMCQModules.length) {
      /*@3.GARJ.488*/
      var total = (typeof MCQ_SESSION !== 'undefined') ? MCQ_SESSION : 70;
      var groups = (typeof MODULE_GROUPS !== 'undefined') ? MODULE_GROUPS : [[1,2,3],[4,5,6]];
      pool = (typeof pickSessionMCQ === 'function')
        ? pickSessionMCQ(mcqBank, groups, total, seed)
        : shuffleArr(mcqBank, seededRNG(seed)).slice(0, total);
    } else {
      /*@3.GARJ.489*/
      var total = (typeof MCQ_SESSION !== 'undefined') ? MCQ_SESSION : 70;
      var mods = _selectedMCQModules.slice();
      var base = Math.floor(total / mods.length);
      var rem  = total % mods.length;
      pool = [];
      mods.forEach(function (mod, i) {
        var quota = base + (i < rem ? 1 : 0);
        var subset = mcqBank.filter(function (q) { return q.module === mod; });
        var picked = shuffleArr(subset, seededRNG(seed + 'm' + mod)).slice(0, quota);
        pool = pool.concat(picked);
      });
      pool = shuffleArr(pool, seededRNG(seed + 'final'));
    }

    /*@3.GARJ.490*/
    sessionMCQ = pool;
    TOTAL      = pool.length;
    cur        = 0;
    score      = 0;
    answered.length = 0;

    /*@3.GARJ.491*/
    pool.forEach(function (q) { q._shuffled = false; });
    _shuffleQuestionOptions(pool);

    /*@3.GARJ.492*/
    var qTotal = document.getElementById('q-total');
    var lScore = document.getElementById('live-score');
    var card   = document.getElementById('mcq-card');
    var finScr = document.getElementById('final-score-screen');
    var fb     = document.getElementById('mcq-feedback');
    if (qTotal) qTotal.textContent = TOTAL;
    if (lScore) lScore.textContent = '0';
    if (card)   card.classList.remove('hidden');
    if (finScr) finScr.classList.add('hidden');
    if (fb)     fb.className = 'mcq-feedback-panel';

    if (typeof renderMcq === 'function') renderMcq(0);
  }

  function _updateModuleButtonStyles() {
    document.querySelectorAll('.module-filter-btn').forEach(function (btn) {
      var mod = parseInt(btn.dataset.module, 10);
      if (mod === 0) {
        btn.classList.toggle('tag--accent', _selectedMCQModules.length === 0);
        btn.classList.toggle('btn-primary',  _selectedMCQModules.length === 0);
      } else {
        var selected = _selectedMCQModules.indexOf(mod) !== -1;
        btn.classList.toggle('tag--accent', selected);
        btn.classList.toggle('btn-primary',  selected);
      }
    });
  }

  function _patchSetModuleFocus() {
    /*@3.GARJ.493*/
    window.setModuleFocus = function (mod) {
      if (mod === 0) {
        /*@3.GARJ.494*/
        _selectedMCQModules = [];
      } else {
        var idx = _selectedMCQModules.indexOf(mod);
        if (idx === -1) {
          _selectedMCQModules.push(mod);   /*@3.GARJ.495*/
        } else {
          _selectedMCQModules.splice(idx, 1); /*@3.GARJ.496*/
        }
      }
      currentModuleFocus = _selectedMCQModules.length === 1 ? _selectedMCQModules[0] : 0;
      _updateModuleButtonStyles();
      _buildMultiModuleSession();
    };
  }

  function _patchRetryFunctions() {
    /*@3.GARJ.497*/
    if (typeof retryWithNewQuestions === 'function') {
      window.retryWithNewQuestions = function () {
        _buildMultiModuleSession();
        /*@3.GARJ.498*/
        var seed2 = Date.now().toString(36) + 'e';
        var groups = (typeof MODULE_GROUPS !== 'undefined') ? MODULE_GROUPS : [[1,2,3],[4,5,6]];
        var essCnt = (typeof ESSAY_SESSION !== 'undefined') ? ESSAY_SESSION : 10;
        if (typeof pickSessionEssay === 'function' && typeof essayBank !== 'undefined') {
          sessionEssay = pickSessionEssay(essayBank, groups, essCnt, seed2);
        }
        essayScore = 0;
        if (typeof renderEssays === 'function') {
          renderEssays();
          /*@3.GARJ.499*/
          document.querySelectorAll('#essay-questions-container .fade-up')
            .forEach(function (el) { el.classList.add('visible'); });
          setTimeout(_addEssayModuleFilter, 10);
        }
      };
    }

    /*@3.GARJ.500*/
    if (typeof shuffleCurrentQuestions === 'function') {
      window.shuffleCurrentQuestions = function () {
        if (!_selectedMCQModules.length && typeof seededRNG !== 'undefined') {
          /*@3.GARJ.501*/
          sessionMCQ = shuffleArr(sessionMCQ, seededRNG(Date.now().toString()));
          TOTAL = sessionMCQ.length; cur = 0; score = 0; answered.length = 0;
          sessionMCQ.forEach(function (q) { q._shuffled = false; });
          _shuffleQuestionOptions(sessionMCQ);
          var qTotal = document.getElementById('q-total');
          var lScore = document.getElementById('live-score');
          if (qTotal) qTotal.textContent = TOTAL;
          if (lScore) lScore.textContent = '0';
          document.getElementById('mcq-card').classList.remove('hidden');
          document.getElementById('final-score-screen').classList.add('hidden');
          if (typeof renderMcq === 'function') renderMcq(0);
        } else {
          _buildMultiModuleSession();
        }
        /*@3.GARJ.502*/
        var seed3 = Date.now().toString(36) + 'sh';
        var groups = (typeof MODULE_GROUPS !== 'undefined') ? MODULE_GROUPS : [[1,2,3],[4,5,6]];
        var essCnt = (typeof ESSAY_SESSION !== 'undefined') ? ESSAY_SESSION : 10;
        if (typeof pickSessionEssay === 'function' && typeof essayBank !== 'undefined') {
          sessionEssay = pickSessionEssay(essayBank, groups, essCnt, seed3);
          essayScore = 0;
          if (typeof renderEssays === 'function') {
            renderEssays();
            /*@3.GARJ.503*/
            document.querySelectorAll('#essay-questions-container .fade-up')
              .forEach(function (el) { el.classList.add('visible'); });
            setTimeout(_addEssayModuleFilter, 10);
          }
        }
      };
    }
  }

  /*@3.GARJ.504*/
  window._quizPatch = {
    filterEssay: function (mod) {
      /*@3.GARJ.505*/
      document.querySelectorAll('[id^="essay-filter-"]').forEach(function (btn) {
        var bm = parseInt(btn.id.replace('essay-filter-', ''), 10);
        btn.classList.toggle('tag--accent', bm === mod);
      });

      /*@3.GARJ.506*/
      document.querySelectorAll('[data-essay-module]').forEach(function (item) {
        var m = parseInt(item.getAttribute('data-essay-module'), 10);
        item.style.display = (mod === 0 || m === mod) ? '' : 'none';
      });
    }
  };

  /*@3.GARJ.507*/
  function _applyAllPatches() {
    if (!isQuizPage()) return;

    /*@3.GARJ.508*/
    if (typeof sessionMCQ !== 'undefined') {
      _shuffleQuestionOptions(sessionMCQ);
    }

    /*@3.GARJ.509*/
    _fixHintButtonTranslation();

    /*@3.GARJ.510*/
    _patchSetModuleFocus();
    _patchRetryFunctions();

    /*@3.GARJ.511*/
    var lang = document.documentElement.getAttribute('lang') || 'ar';
    var tip  = lang === 'ar' ? 'انقر لتفعيل/إلغاء الوحدة (متعدد)' : 'Click to toggle module (multi-select)';
    document.querySelectorAll('.module-filter-btn[data-module]').forEach(function (btn) {
      var mod = parseInt(btn.dataset.module, 10);
      if (mod !== 0) btn.title = tip;
    });
  }

  function _applyDOMReadyPatches() {
    if (!isQuizPage()) return;

    /*@3.GARJ.512*/
    _addEssayModuleFilter();
  }

  /*@3.GARJ.513*/
  _applyAllPatches();

  /*@3.GARJ.514*/
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(_applyDOMReadyPatches, 50);
    });
  } else {
    setTimeout(_applyDOMReadyPatches, 50);
  }

})();
/*@3.GARJ.515*/

/*@3.GARJ.516*/
;(function(){
  'use strict';
  var path = location.pathname;

  /*@3.GARJ.517*/
  var isSubjectHub = /\/[A-Z]{2,5}\d{2,4}\/(index\.html)?$/.test(path);
  /*@3.GARJ.518*/
  var isLevelHub = /\/(L\d+|others)\/(index\.html)?$/.test(path);
  /*@3.GARJ.519*/
  var isHubIndex = /\/hub\/(index\.html)?$/.test(path);
  /*@3.GARJ.520*/
  var isModulePage = /\/[A-Z]{2,5}\d{2,4}\/M\d+\.html$/.test(path);
  /*@3.GARJ.521*/
  var isReviewPage = /\/[A-Z]{2,5}\d{2,4}\/(midterm|final)-(review|quiz)\.html$/.test(path);

  /*@3.GARJ.522*/
  function trackSemesterVisit() {
    /*@3.GARJ.523*/
    var isStudyPage = isSubjectHub || isLevelHub || isModulePage || isReviewPage || isHubIndex;
    if (!isStudyPage) return;
    var semRaw = null;
    try { semRaw = localStorage.getItem('my_semester'); } catch(e) { return; }
    if (!semRaw) return;
    var sem = null;
    try { sem = JSON.parse(semRaw); } catch(e) { return; }
    if (!sem) return;

    var metaRaw = null;
    try { metaRaw = localStorage.getItem('garden_semester_meta'); } catch(e) {}
    var meta = metaRaw ? (function(){ try { return JSON.parse(metaRaw); } catch(e) { return null; } })() : null;
    if (!meta) meta = { visits: 0, last_visit: 0 };

    var today = new Date(); today.setHours(0,0,0,0);
    var todayTs = today.getTime();
    var lastDay = meta.last_visit ? new Date(meta.last_visit) : new Date(0);
    lastDay.setHours(0,0,0,0);
    var lastDayTs = lastDay.getTime();

    var changed = false;
    /*@3.GARJ.548*/
    if (lastDayTs !== todayTs) {
      meta.visits = (meta.visits || 0) + 1;
      meta.last_visit = Date.now();
      changed = true;
    }
    if (changed) {
      try { localStorage.setItem('garden_semester_meta', JSON.stringify(meta)); } catch(e) {}
    }
  }
  trackSemesterVisit();

  function trackModuleVisit() {
    var root = document.documentElement;
    var code = root.getAttribute('data-subject') || '';
    var mod = root.getAttribute('data-module') || '';
    if (!code || !/^[0-9]+$/.test(mod) || +mod < 1) return;
    if (window.Garden && Garden.noteModuleVisit) Garden.noteModuleVisit(code, +mod);
  }
  trackModuleVisit();

  /*@3.GARJ.525*/

  /*@3.GARJ.526*/

  /*@3.GARJ.527*/
  var isDashboard = !isSubjectHub && !isLevelHub && !isHubIndex &&
                    (path === '/' || /\/index\.html$/.test(path) || /\/$/.test(path));

  /*@3.GARJ.528*/
  if (isLevelHub || isDashboard || isHubIndex) {
    try {
      sessionStorage.removeItem('garden_nav_from_hub');
      sessionStorage.removeItem('garden_nav_from_dashboard');
    } catch (e) {}
  }
})();
/*@3.GARJ.529*/

/*@3.GARJ.530*/
;(function () {
  'use strict';
  /*@3.GARJ.531*/
  var sc = document.currentScript;
  var root = (sc && sc.src) ? sc.src.replace(/shared\/garden\.js(\?.*)?$/, '') : '';
  if (!root || root === (sc && sc.src)) return;   /*@3.GARJ.532*/

  /*@3.GARJ.533*/
  var ics = document.createElement('script');
  ics.src = root + 'shared/ics-boot.js';
  ics.async = true;
  (document.head || document.documentElement).appendChild(ics);

  /*@3.GARJ.534*/
  if (document.documentElement.getAttribute('data-subject') &&
      !document.documentElement.hasAttribute('data-tinted') &&
      !window.GardenTint) {
    var tint = document.createElement('script');
    tint.src = root + 'shared/subject-tint.js';
    (document.head || document.documentElement).appendChild(tint);
  }

  /*@3.GARJ.652*/
  var remSet = null;
  try { remSet = JSON.parse(localStorage.getItem('garden_reminders') || 'null'); } catch (e) {}
  if (remSet && remSet.enabled && !window.GardenNotifyGuard &&
      !(('Notification' in window) && Notification.permission === 'granted')) {
    var ng = document.createElement('script');
    ng.src = root + 'shared/notify-guard.js';
    ng.async = true;
    (document.head || document.documentElement).appendChild(ng);
  }

  if (window.Reminders) return;                   /*@3.GARJ.535*/
  var el = document.createElement('script');
  el.src = root + 'shared/reminders-boot.js';
  el.async = true;
  (document.head || document.documentElement).appendChild(el);
})();


/*@3.GARJ.536*/
;(function () {
  'use strict';
  if (window.GardenTryInLab) return;

  /*@3.GARJ.537*/
  var LAB_LANGS = {
    java: 'java', python: 'python', py: 'python', c: 'c', cpp: 'cpp', 'c++': 'cpp',
    php: 'php', sql: 'sql', javascript: 'javascript', js: 'javascript',
    html: 'web', css: 'web', marie: 'marie'
  };
  var LAB_PATH = 'labs/programming-languages.html';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }

  function rootPrefix() {
    var tag = document.querySelector('script[src*="garden.js"]');
    return tag ? tag.src.replace(/shared\/garden\.js.*$/, '') : '../';
  }

  function b64url(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /*@3.GARJ.538*/
  function buildLink(code, lang) {
    var url = rootPrefix() + LAB_PATH;
    if (window.GardenPLStore && window.GardenPLStore.snippetLink) {
      return window.GardenPLStore.snippetLink(url, code, lang);
    }
    var raw = new TextEncoder().encode(code);
    if (typeof CompressionStream !== 'function') {
      return Promise.resolve(url + '#snippet=' + b64url(raw) + '&lang=' + lang + '&raw=1');
    }
    var stream = new CompressionStream('deflate-raw');
    var writer = stream.writable.getWriter();
    writer.write(raw); writer.close();
    return new Response(stream.readable).arrayBuffer()
      .then(function (buffer) { return url + '#snippet=' + b64url(new Uint8Array(buffer)) + '&lang=' + lang; })
      .catch(function () { return url + '#snippet=' + b64url(raw) + '&lang=' + lang + '&raw=1'; });
  }

  var current = null;
  function offer(code, lang) {
    if (current) { clearTimeout(current.timer); current.node.remove(); current = null; }
    buildLink(code, lang).then(function (link) {
      if (!link) return;                       /*@3.GARJ.539*/
      var node = document.createElement('div');
      node.className = 'gtl-toast';
      node.setAttribute('dir', 'auto');
      var label = document.createElement('span');
      label.textContent = isAr() ? 'نُسخ الكود — تجرّبه في المختبر؟' : 'Code copied — try it in the lab?';
      var go = document.createElement('a');
      go.href = link; go.target = '_blank'; go.rel = 'noopener';
      go.textContent = isAr() ? 'افتح المختبر ↗' : 'Open the lab ↗';
      go.addEventListener('click', function () { node.remove(); current = null; });
      var close = document.createElement('button');
      close.setAttribute('aria-label', isAr() ? 'إغلاق' : 'Close');
      close.innerHTML = '&times;';
      close.addEventListener('click', function () { node.remove(); current = null; });
      node.appendChild(label); node.appendChild(go); node.appendChild(close);
      document.body.appendChild(node);
      /*@3.GARJ.540*/
      void node.offsetHeight;
      node.classList.add('on');
      current = { node: node, timer: setTimeout(function () {
        node.classList.remove('on');
        setTimeout(function () { node.remove(); }, 260);
        current = null;
      }, 9000) };
    });
  }

  function handle(block) {
    if (!block) return;
    var header = block.querySelector('.code-block-header span');
    var tag = header ? header.textContent.trim().toLowerCase() : '';
    var lang = LAB_LANGS[tag];
    if (!lang) return;                          /*@3.GARJ.541*/
    var pre = block.querySelector('pre');
    var code = pre ? pre.textContent : '';
    if (code.trim().length < 12) return;         /*@3.GARJ.542*/
    offer(code, lang);
  }

  /*@3.GARJ.543*/
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest && event.target.closest('.copy-btn');
    if (button) setTimeout(function () { handle(button.closest('.code-block')); }, 120);
  }, true);

  /*@3.GARJ.544*/
  document.addEventListener('copy', function (event) {
    var node = event.target;
    var block = (node && node.closest) ? node.closest('.code-block') : null;
    if (!block && window.getSelection && window.getSelection().anchorNode) {
      var anchor = window.getSelection().anchorNode;
      block = (anchor.nodeType === 1 ? anchor : anchor.parentElement);
      block = block && block.closest ? block.closest('.code-block') : null;
    }
    if (block) setTimeout(function () { handle(block); }, 120);
  }, true);

  window.GardenTryInLab = { offer: offer, languages: LAB_LANGS };
})();


/*@3.GARJ.545*/
;(function () {
  'use strict';
  if (window.__gardenLightDismiss) return;
  window.__gardenLightDismiss = true;

  var armed = null;   /*@3.GARJ.546*/

  function isOutside(dlg, e) {
    var r = dlg.getBoundingClientRect();
    if (!r.width || !r.height) return false;   /*@3.GARJ.547*/
    return e.clientX < r.left || e.clientX > r.right ||
           e.clientY < r.top  || e.clientY > r.bottom;
  }

  function candidate(e) {
    var d = e.target;
    if (!d || d.tagName !== 'DIALOG' || !d.open) return null;
    if (d.hasAttribute('data-keep-open')) return null;
    return isOutside(d, e) ? d : null;
  }

  document.addEventListener('mousedown', function (e) {
    armed = (e.button === 0) ? candidate(e) : null;
  }, true);

  document.addEventListener('click', function (e) {
    var dlg = armed; armed = null;
    if (!dlg || candidate(e) !== dlg) return;
    try { dlg.close(); } catch (err) {}
  }, true);
})();

/*@3.GARJ.551*/
window.GardenEv = window.GardenEv || function (n, p) {
  (window.__gtq = window.__gtq || []).push([n, p, Date.now()]);
  if (window.__gtq.length > 40) window.__gtq.shift();
};

/*@3.GARJ.549*/ /*@3.GARJ.550*/
; (function () {
  'use strict';
  if (window.GardenTelemetry || document.getElementById('gt-boot')) return;
  var s = document.currentScript;
  var root = (s && s.src) ? s.src.replace(/shared\/garden\.js(\?.*)?$/, '') : '';
  var el = document.createElement('script');
  el.id = 'gt-boot';
  el.src = root + 'shared/garden-telemetry.js';
  el.async = true;
  (document.head || document.documentElement).appendChild(el);
})();

/*@3.GARJ.562*/
;(function () {
  'use strict';
  if (window.GardenDraft) return;

  var KEY = 'gd_rate_drafts';
  var TTL = 30 * 24 * 3600e3;
  var MAX = 24;

  function all() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || '{}');
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  /*@3.GARJ.563*/
  function prune(o) {
    var now = Date.now();
    var ks = Object.keys(o).filter(function (k) {
      if (!o[k] || now - (o[k].t || 0) > TTL) { delete o[k]; return false; }
      return true;
    });
    if (ks.length <= MAX) return o;
    ks.sort(function (a, b) { return o[b].t - o[a].t; })
      .slice(MAX).forEach(function (k) { delete o[k]; });
    return o;
  }

  function get(key) {
    if (!key) return null;
    var o = prune(all());
    var r = o[key];
    return r ? r.d : null;
  }
  /*@3.GARJ.564*/
  function set(key, data) {
    if (!key) return;
    var o = prune(all());
    if (!data || !Object.keys(data).length) delete o[key];
    else o[key] = { t: Date.now(), d: data };
    write(o);
  }
  function clear(key) {
    if (!key) return;
    var o = all();
    if (!(key in o)) return;
    delete o[key];
    write(o);
  }

  window.GardenDraft = { get: get, set: set, clear: clear };
})();

/*@3.GARJ.565*/
;(function () {
  'use strict';
  if (window.confetti) return;

  var s0 = document.currentScript;
  var root = (s0 && s0.src) ? s0.src.replace(/shared\/garden\.js(\?.*)?$/, '') : '';
  var p = null;

  function load() {
    if (p) return p;
    p = new Promise(function (ok) {
      var el = document.createElement('script');
      el.src = root + 'shared/vendor/confetti/confetti.browser.min.js';
      el.onload = function () { ok(typeof window.confetti === 'function' ? window.confetti : null); };
      el.onerror = function () { ok(null); };
      (document.head || document.documentElement).appendChild(el);
    });
    return p;
  }

  function stub() {
    var args = Array.prototype.slice.call(arguments);
    return load().then(function (real) {
      if (real && real !== stub) return real.apply(null, args);
      return null;
    });
  }
  stub.__gardenStub = true;

  window.confetti = stub;
  window.GardenConfetti = { ensure: load };
})();

/*@3.GARJ.566*/
;(function () {
  'use strict';

  function inject() {
    var mj = document.getElementById('MathJax-script');
    if (!mj) return;
    /*@3.GARJ.574*/
    if (document.getElementById('MathJax-script-live')) return;
    var src = mj.getAttribute('data-src');
    if (!src || mj.getAttribute('src')) return;
    var el = document.createElement('script');
    el.id = 'MathJax-script-live';
    el.async = true;
    el.src = src;
    (document.head || document.documentElement).appendChild(el);
  }

  /*@3.GARJ.568*/
  function schedule() {
    var idle = window.requestIdleCallback;
    if (idle) idle(inject, { timeout: 300 }); else setTimeout(inject, 0);
  }
  if (document.readyState !== 'loading') schedule();
  else document.addEventListener('DOMContentLoaded', schedule, { once: true });
})();
