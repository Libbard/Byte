/*@3.MOTJ.1*/

;(function () {
  'use strict';

  var PREFS = 'dashboard_prefs';

  /*@3.MOTJ.2*/
  var THEMES = [
    { id: 'garden',  base: null,    star: 1, ar: 'مظهرُ الموقع', en: 'Site look' },

    { id: 'paper',   base: 'light', star: 1, ar: 'ورقٌ دافئ',            en: 'Warm Paper' },
    { id: 'github',  base: 'light', star: 1, ar: 'جِت‑هَب نهاريّ',       en: 'GitHub Light' },
    { id: 'latte',   base: 'light', star: 1, ar: 'كابتشينو نهاريّ',      en: 'Catppuccin Latte' },
    { id: 'solar',   base: 'light',          ar: 'سولارايزد نهاريّ',     en: 'Solarized Light' },
    { id: 'everlight', base: 'light',        ar: 'غابةٌ نهاريّة',        en: 'Everforest Light' },

    { id: 'mocha',   base: 'dark',  star: 1, ar: 'كابتشينو داكن',        en: 'Catppuccin Mocha' },
    { id: 'onedark', base: 'dark',  star: 1, ar: 'ون دارك',              en: 'One Dark' },
    { id: 'dracula', base: 'dark',           ar: 'دراكولا',              en: 'Dracula' },
    { id: 'nord',    base: 'dark',           ar: 'نورد',                 en: 'Nord' },
    { id: 'gruvbox', base: 'dark',           ar: 'جروف‑بوكس',            en: 'Gruvbox Dark' },
    { id: 'rosepine', base: 'dark',          ar: 'صنوبرٌ ورديّ',         en: 'Rosé Pine' },
    { id: 'everforest', base: 'dark',        ar: 'غابةٌ دائمة',          en: 'Everforest Dark' },

    { id: 'tokyo',   base: 'dim',   star: 1, ar: 'طوكيو ليلاً',          en: 'Tokyo Night' },
    { id: 'oled',    base: 'dim',            ar: 'أسودُ خالص',           en: 'True Black (OLED)' },
    { id: 'nightowl', base: 'dim',           ar: 'بومةُ الليل',          en: 'Night Owl' },
    { id: 'ayu',     base: 'dim',            ar: 'آيو داكن',             en: 'Ayu Dark' },
    { id: 'carbon',  base: 'dim',            ar: 'كربون',                en: 'Carbon' },
    { id: 'amber',   base: 'dim',            ar: 'كهرمانيّ',             en: 'Amber Night' }
  ];

  /*@3.MOTJ.3*/
  var FAMILY = {
    light: { ar: 'نهاريّة · ترث ثيمَنا النهاريّ', en: 'Light · inherit our light theme' },
    dark:  { ar: 'داكنة · ترث ثيمَنا الداكن',     en: 'Dark · inherit our dark theme' },
    dim:   { ar: 'ليليّة · ترث ثيمَنا الليليّ',   en: 'Night · inherit our night theme' }
  };

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }

  function prefs() {
    try {
      var p = JSON.parse(localStorage.getItem(PREFS) || 'null');
      return (p && typeof p === 'object') ? p : {};
    } catch (e) { return {}; }
  }
  function current() {
    var v = prefs().moduleTheme;
    return (typeof v === 'string' && v) ? v : 'garden';
  }

  /*@3.MOTJ.4*/
  function choose(id) {
    /*@3.MOTJ.5*/
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearTheme) GardenTint.clearTheme();
      try {
        document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: 'garden' } }));
      } catch (e) {}
      return;
    }
    var p = prefs();
    p.moduleTheme = id;
    try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {}
    if (window.GardenTint && GardenTint.applyTheme) GardenTint.applyTheme();
    try {
      document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: current() } }));
    } catch (e) {}
  }

  /*@3.MOTJ.15*/
  var _siteSw = null, _siteKey = '';
  function siteSwatch() {
    var root = document.documentElement;
    /*@3.MOTJ.6*/
    if (!root.getAttribute('data-mod-theme')) return null;
    var site = 'dark';
    try { site = localStorage.getItem('garden_theme') || 'dark'; } catch (e) {}
    var key = site + '|' + (root.getAttribute('data-tinted') || '');
    if (_siteSw && _siteKey === key) return _siteSw;

    /*@3.MOTJ.7*/
    var hadSkin = root.getAttribute('data-mod-theme');
    var hadBase = root.getAttribute('data-theme');
    root.removeAttribute('data-mod-theme');
    root.setAttribute('data-theme', site);
    var cs = getComputedStyle(root);
    _siteSw = {
      bg: cs.getPropertyValue('--bg-card').trim() || '#1f2937',
      bars: ['--syn-keyword', '--syn-string', '--syn-function', '--syn-type'].map(function (k) {
        return cs.getPropertyValue(k).trim() || 'currentColor';
      })
    };
    _siteKey = key;
    root.setAttribute('data-mod-theme', hadSkin);
    if (hadBase) root.setAttribute('data-theme', hadBase); else root.removeAttribute('data-theme');
    return _siteSw;
  }

  /*@3.MOTJ.11*/
  var FONTS = [
    { id: 'garden',   css: null,                   star: 1, ar: 'خطُّ الموقع (القاهرة)', en: 'Site font (Cairo)' },
    /*@3.MOTJ.27*/
    { id: 'thmanyah', css: 'Thmanyah Sans',         star: 1, ar: 'ثمانية',        en: 'Thmanyah Sans' },
    { id: 'plex',     css: 'IBM Plex Sans Arabic', star: 1, ar: 'بلكس عربي',    en: 'IBM Plex Sans Arabic' },
    { id: 'readex',   css: 'Readex Pro',           star: 1, ar: 'ريدكس برو',    en: 'Readex Pro' },
    { id: 'notosans', css: 'Noto Sans Arabic',     star: 1, ar: 'نوتو سانس',    en: 'Noto Sans Arabic' },
    { id: 'amiri',    css: 'Amiri',                star: 1, ar: 'أميري',        en: 'Amiri' },
    { id: 'naskh',    css: 'Noto Naskh Arabic',             ar: 'نسخ',          en: 'Noto Naskh Arabic' },
    { id: 'tajawal',  css: 'Tajawal',                       ar: 'تجوّل',         en: 'Tajawal' },
    { id: 'almarai',  css: 'Almarai',                       ar: 'المراعي',      en: 'Almarai' },
    { id: 'alexandria', css: 'Alexandria',                  ar: 'الإسكندريّة',  en: 'Alexandria' },
    { id: 'vazir',    css: 'Vazirmatn',                     ar: 'وزيرمتن',      en: 'Vazirmatn' },
    { id: 'messiri',  css: 'El Messiri',                    ar: 'المسيري',      en: 'El Messiri' },
    { id: 'kufi',     css: 'Noto Kufi Arabic',              ar: 'نوتو كوفي',    en: 'Noto Kufi Arabic' },
    { id: 'zain',     css: 'Zain',                          ar: 'زين',          en: 'Zain' },
    { id: 'rubik',    css: 'Rubik',                         ar: 'روبيك',        en: 'Rubik' },
    { id: 'thmanyahserif', css: 'Thmanyah Serif Text',      ar: 'ثمانية سيريف', en: 'Thmanyah Serif Text' }
  ];

  /*@3.MOTJ.16*/
  var FONTS_LAT = [
    { id: 'garden',      css: null,                    star: 1, ar: 'خطُّ الموقع (إنتر)', en: 'Site font (Inter)' },
    { id: 'sourceserif', css: 'Source Serif 4',        star: 1, ar: 'سورس سيريف',  en: 'Source Serif 4' },
    { id: 'newsreader',  css: 'Newsreader',            star: 1, ar: 'نيوزريدر',    en: 'Newsreader' },
    { id: 'literata',    css: 'Literata',              star: 1, ar: 'ليتيراتا',    en: 'Literata' },
    { id: 'atkinson',    css: 'Atkinson Hyperlegible', star: 1, ar: 'أتكِنسون',    en: 'Atkinson Hyperlegible' },
    { id: 'merriweather', css: 'Merriweather',                  ar: 'ميريويذر',    en: 'Merriweather' },
    { id: 'lora',        css: 'Lora',                           ar: 'لورا',        en: 'Lora' },
    { id: 'garamond',    css: 'EB Garamond',                    ar: 'غارامون',     en: 'EB Garamond' },
    { id: 'spectral',    css: 'Spectral',                       ar: 'سبكترال',     en: 'Spectral' },
    { id: 'fraunces',    css: 'Fraunces',                       ar: 'فرونسيس',     en: 'Fraunces' },
    { id: 'plexsans',    css: 'IBM Plex Sans',                  ar: 'بلكس سانس',   en: 'IBM Plex Sans' },
    { id: 'sourcesans',  css: 'Source Sans 3',                  ar: 'سورس سانس',   en: 'Source Sans 3' },
    { id: 'geist',       css: 'Geist',                          ar: 'غايست',       en: 'Geist' }
  ];

  function fontList() { return isAr() ? FONTS : FONTS_LAT; }
  function fontKey() { return isAr() ? 'moduleFont' : 'moduleFontLat'; }

  function currentFont() {
    var v = prefs()[fontKey()];
    return (typeof v === 'string' && v) ? v : 'garden';
  }

  function chooseFont(id) {
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearFont) GardenTint.clearFont(isAr() ? 'ar' : 'lat');
      return;
    }
    var p = prefs();
    p[fontKey()] = id;
    try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {}
    if (window.GardenTint && GardenTint.applyFont) GardenTint.applyFont();
  }

  /*@3.MOTJ.18*/
  var _base = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared\/module-theme\.js(\?.*)?$/, '') : '';
  })();
  function surfaceSheet() {
    if (document.querySelector('link[data-garden-surface], link[href*="surface.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = _base + 'shared/surface.css';
    l.setAttribute('data-garden-surface', '');
    document.head.appendChild(l);
  }

  var _dlg = null, _opener = null;

  function close() {
    if (!_dlg) return;
    var d = _dlg;
    _dlg = null;
    try { d.close(); } catch (e) {}
    if (d.parentNode) d.parentNode.removeChild(d);
    if (_opener) { try { _opener.focus(); } catch (e) {} }
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /*@3.MOTJ.19*/
  function paintGarden(tile) {
    var site = siteSwatch();
    var prev = tile.querySelector('.mt-prev');
    var bars = tile.querySelectorAll('.mt-prev > i');
    prev.style.background = site ? site.bg : '';
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.background = site ? site.bars[i % site.bars.length] : '';
    }
  }

  /*@3.MOTJ.20*/
  function moreBtn(host, hidden) {
    if (!hidden.length) return null;
    var n = hidden.filter(function (x) { return x.tagName === 'BUTTON'; }).length || hidden.length;
    var b = el('button', 'mt-more');
    b.type = 'button';
    b.setAttribute('aria-expanded', 'false');
    var lab = el('span', null, L('المزيد (' + n + ')', 'More (' + n + ')'));
    b.appendChild(lab);
    b.appendChild(el('i', 'fa-solid fa-chevron-down'));
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', on ? 'false' : 'true');
      hidden.forEach(function (x) { x.hidden = on; });
      lab.textContent = on ? L('المزيد (' + n + ')', 'More (' + n + ')') : L('أقلّ', 'Less');
    });
    host.appendChild(b);
    return b;
  }

  /*@3.MOTJ.21*/
  function themeSection() {
    var sec = el('section', 'mt-sec');
    var h = el('h3', 'gsf-card-h');
    h.appendChild(el('i', 'fa-solid fa-swatchbook'));
    h.appendChild(el('span', null, L('الثيم', 'Theme')));
    sec.appendChild(h);

    var grid = el('div', 'mt-grid');
    sec.appendChild(grid);

    var tiles = [], hidden = [], group = null, gardenTile = null;

    function tile(th) {
      var b = el('button', 'mt-tile' + (th.id === 'garden' ? '' : ' mt-pal-' + th.id));
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      var prev = el('span', 'mt-prev');
      prev.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 4; i++) prev.appendChild(document.createElement('i'));
      b.appendChild(prev);
      var nm = el('span', 'mt-tname');
      nm.appendChild(el('span', null, isAr() ? th.ar : th.en));
      b.appendChild(nm);
      b.addEventListener('click', function () {
        choose(th.id);
        mark();
        if (gardenTile) paintGarden(gardenTile);
      });
      b.__id = th.id;
      tiles.push(b);
      return b;
    }

    THEMES.forEach(function (th) {
      if (!th.star) return;
      var b = tile(th);
      grid.appendChild(b);
      if (th.id === 'garden') gardenTile = b;
    });

    THEMES.forEach(function (th) {
      if (th.star) return;
      /*@3.MOTJ.8*/
      if (th.base !== group) {
        group = th.base;
        var lab = el('div', 'mt-fam mt-hid', L(FAMILY[group].ar, FAMILY[group].en));
        lab.hidden = true;
        grid.appendChild(lab);
        hidden.push(lab);
      }
      var b = tile(th);
      b.classList.add('mt-hid');
      b.hidden = true;
      grid.appendChild(b);
      hidden.push(b);
    });

    moreBtn(sec, hidden);

    function mark() {
      var cur = current();
      tiles.forEach(function (b) {
        var on = b.__id === cur;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    mark();
    if (gardenTile) paintGarden(gardenTile);
    sec.__mark = function () { mark(); if (gardenTile) paintGarden(gardenTile); };
    return sec;
  }

  /*@3.MOTJ.22*/
  function fontSection() {
    /*@3.MOTJ.13*/
    if (window.GardenTint && GardenTint.fontSheet) GardenTint.fontSheet();
    var sec = el('section', 'mt-sec');
    var h = el('h3', 'gsf-card-h');
    h.appendChild(el('i', 'fa-solid fa-font'));
    h.appendChild(el('span', null, L('خطُّ القراءة', 'Reading font')));
    sec.appendChild(h);

    var list = el('div', 'mt-flist');
    sec.appendChild(list);

    var rows = [], hidden = [];

    fontList().forEach(function (fo) {
      var b = el('button', 'mt-fopt');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      var name = el('span', 'mt-name', isAr() ? fo.ar : fo.en);
      /*@3.MOTJ.14*/
      if (fo.css) name.style.fontFamily = '"' + fo.css + '", sans-serif';
      b.appendChild(name);
      var samp = el('span', 'mt-fsamp');
      /*@3.MOTJ.17*/
      samp.textContent = isAr() ? 'خوارزميّة' : 'Algorithm';
      if (fo.css) samp.style.fontFamily = '"' + fo.css + '", sans-serif';
      b.appendChild(samp);
      b.addEventListener('click', function () { chooseFont(fo.id); mark(); });
      b.__id = fo.id;
      rows.push(b);
      if (!fo.star) { b.classList.add('mt-hid'); b.hidden = true; hidden.push(b); }
      list.appendChild(b);
    });

    moreBtn(sec, hidden);

    function mark() {
      var cur = currentFont();
      rows.forEach(function (b) {
        var on = b.__id === cur;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    mark();
    sec.__mark = mark;
    return sec;
  }

  /*@3.MOTJ.9*/
  function open(button) {
    if (_dlg) { close(); return; }
    _opener = button || null;
    surfaceSheet();

    var d = document.createElement('dialog');
    d.className = 'gsf mt-dlg';
    d.setAttribute('aria-label', L('مظهرٌ مخصّص', 'Custom appearance'));

    d.appendChild(el('div', 'gsf-grip'));
    var x = el('form', 'gsf-x');
    x.method = 'dialog';
    var xb = el('button', 'gsf-close');
    xb.type = 'submit';
    xb.setAttribute('aria-label', L('إغلاق', 'Close'));
    xb.appendChild(el('i', 'fa-solid fa-xmark'));
    x.appendChild(xb);
    d.appendChild(x);

    var head = el('div', 'gsf-head');
    head.appendChild(el('h2', 'gsf-title', L('مظهرٌ مخصّص', 'Custom appearance')));
    head.appendChild(el('p', 'gsf-sub',
      L('اختر ثيماً وخطَّ قراءةٍ لصفحات المادة — يُطبَّق فوراً ويبقى محفوظاً على هذا الجهاز.',
        'Pick a theme and a reading font for course pages — applied at once, kept on this device.')));
    d.appendChild(head);

    /*@3.MOTJ.12*/
    var body = el('div', 'gsf-body mt-body');
    var st = themeSection(), sf = fontSection();
    body.appendChild(st);
    body.appendChild(sf);
    d.appendChild(body);

    /*@3.MOTJ.23*/
    var foot = el('div', 'gsf-foot');
    var acts = el('div', 'gsf-acts');
    var reset = el('button', 'gsf-btn gsf-btn--ghost');
    reset.type = 'button';
    reset.appendChild(el('i', 'fa-solid fa-rotate-left'));
    reset.appendChild(el('span', null, L('أعِدْ مظهرَ الموقع', 'Back to site look')));
    reset.addEventListener('click', function () {
      choose('garden');
      chooseFont('garden');
      st.__mark();
      sf.__mark();
    });
    acts.appendChild(reset);
    foot.appendChild(acts);
    d.appendChild(foot);

    document.body.appendChild(d);
    _dlg = d;
    d.addEventListener('close', close);
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  }

  window.GardenModuleTheme = {
    open: open, close: close, current: current, choose: choose, THEMES: THEMES,
    currentFont: currentFont, chooseFont: chooseFont, FONTS: FONTS, FONTS_LAT: FONTS_LAT
  };
})();
