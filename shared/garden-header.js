 

;(function () {
  'use strict';

  var thisScript = document.currentScript;
  var ROOT = (thisScript && thisScript.src)
    ? thisScript.src.replace(/shared\/garden-header\.js(\?.*)?$/, '')
    : '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function L(ar, en) { return isAr() ? ar : en; }

   
  var _cat = null, _catCbs = [];
  function subjectMeta(code, cb) {
    if (!code) { cb(null); return; }
    if (_cat) { var c = _cat[code]; cb(c ? { icon: c.icon, color: c.brand_color } : null); return; }
    _catCbs.push({ code: code, cb: cb });
    if (_catCbs.length > 1) return;   
    fetch(ROOT + 'shared/data/courses_catalog.json')
      .then(function (r) { return r.json(); })
      .then(function (j) { _cat = {}; (j.courses || []).forEach(function (c) { if (c && c.code) _cat[c.code] = c; }); })
      .catch(function () { _cat = {}; })
      .then(function () { _catCbs.forEach(function (o) { var c = _cat[o.code]; o.cb(c ? { icon: c.icon, color: c.brand_color } : null); }); _catCbs = []; });
  }

  function goBack() {
    if (window.Garden && Garden.goBack) { Garden.goBack(); return; }
    if (history.length > 1) history.back();
  }
  function hasBack() {
    if (window.Garden && Garden.hasBackTarget) return Garden.hasBackTarget();
    return history.length > 1;
  }

   
  function isContentVariant(variant) {
    if (variant === 'module') return true;
    var p = document.documentElement.getAttribute('data-page');
    return p === 'review' || p === 'quiz';
  }

  function build() {
    var host = document.querySelector('[data-gh]');
    if (!host || host.getAttribute('data-gh-ready') === '1') return;

    var variant = host.getAttribute('data-gh-variant') || 'top';
    var upHref = host.getAttribute('data-gh-up') || '';
    var prevHref = host.getAttribute('data-gh-prev') || '';
    var nextHref = host.getAttribute('data-gh-next') || '';
    var cardHref = host.getAttribute('data-gh-card') || '';

    var titleAr = document.body.getAttribute('data-page-title') || '';
    var titleEn = document.body.getAttribute('data-page-title-en') || titleAr;

     
    var searchSlot = host.querySelector('[data-gh-slot="search"]');
    var actionsSlot = host.querySelector('[data-gh-slot="actions"]');
    if (searchSlot) searchSlot.remove();
    if (actionsSlot) actionsSlot.remove();

    host.className = 'g-header g-v-' + variant;
    host.innerHTML = '';

     
    var logo = document.createElement('a');
    logo.className = 'g-logo';
    logo.href = ROOT + 'index.html';
    logo.innerHTML =
      '<img class="g-logo-mark" src="' + ROOT + 'shared/icons/logo-mark.svg" alt="" aria-hidden="true" width="26" height="26">' +
      '<span class="g-logo-text" data-ar="الحديقة الرقمية" data-en="Digital Garden">' +
      esc(L('الحديقة الرقمية', 'Digital Garden')) + '</span>';
    logo.setAttribute('aria-label', L('الرئيسية', 'Home'));
    host.appendChild(logo);

     
    var back = document.createElement('button');
    back.className = 'g-back';
    back.type = 'button';
    
    back.innerHTML = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    back.setAttribute('aria-label', L('رجوع', 'Back'));
    back.setAttribute('data-ar-label', 'رجوع');
    back.setAttribute('data-en-label', 'Back');
    back.addEventListener('click', goBack);
    if (!hasBack()) back.style.display = 'none';
    host.appendChild(back);

     
    var isSubjectVariant = (variant === 'module' || variant === 'course');
    if (isSubjectVariant) {
      
      var spL = document.createElement('div'); spL.className = 'g-spacer'; host.appendChild(spL);

      var center = document.createElement('div');
      center.className = 'g-center';
      if (variant === 'module') center.appendChild(_segBtn(prevHref, 'fa-arrow-right', L('السابق', 'Prev'), 'prev'));

      var chip;
      if (cardHref) {
        chip = document.createElement('a');
        chip.className = 'g-title-chip g-title-link';
        chip.href = cardHref;
        chip.title = L('بطاقة المادة', 'Course card');
      } else {
        chip = document.createElement('div');
        chip.className = 'g-title-chip';
      }
      var ico = document.createElement('i');
      ico.className = 'g-title-ico fa-solid fa-book-open';
      ico.setAttribute('aria-hidden', 'true');
      var txt = document.createElement('span');
      txt.className = 'g-title';
      txt.setAttribute('data-ar', titleAr);
      txt.setAttribute('data-en', titleEn);
      txt.textContent = isAr() ? titleAr : titleEn;
      chip.appendChild(ico); chip.appendChild(txt);
      if (cardHref) {
        var caret = document.createElement('i');
        caret.className = 'g-title-caret fa-solid fa-chevron-left';
        caret.setAttribute('aria-hidden', 'true');
        chip.appendChild(caret);
      }
      center.appendChild(chip);
      if (variant === 'module') center.appendChild(_segBtn(nextHref, 'fa-arrow-left', L('التالي', 'Next'), 'next'));
      host.appendChild(center);

       
      var injIcon = host.getAttribute('data-gh-icon');
      var injColor = host.getAttribute('data-gh-color');
      if (injIcon) { ico.className = 'g-title-ico ' + injIcon; if (injColor) ico.style.color = injColor; }
      else {
        var code = (host.getAttribute('data-gh-code') || (titleAr || '').split(/[\s·]/)[0] || '').trim();
        subjectMeta(code, function (m) { if (m && m.icon) { ico.className = 'g-title-ico ' + m.icon; if (m.color) ico.style.color = m.color; } });
      }
    } else {
      var titleEl = document.createElement('h1');
      titleEl.className = 'g-title';
      titleEl.setAttribute('data-ar', titleAr);
      titleEl.setAttribute('data-en', titleEn);
      titleEl.textContent = isAr() ? titleAr : titleEn;
      host.appendChild(titleEl);
    }

     
    if (searchSlot) { searchSlot.classList.add('g-search-slot'); host.appendChild(searchSlot); }
    else { var sp = document.createElement('div'); sp.className = 'g-spacer'; host.appendChild(sp); }

     
    var tail = document.createElement('div');
    tail.className = 'g-tail';

    var menu = document.createElement('div');
    menu.className = 'g-menu';
    menu.id = 'g-menu';

     

     
    if (actionsSlot) { actionsSlot.classList.add('g-actions'); menu.appendChild(actionsSlot); }

     
    if (variant === 'level' && !actionsSlot) {
      var planHref = host.getAttribute('data-gh-plan') || 'planner/index.html';
      var plan = document.createElement('a');
      plan.className = 'g-menu-item toggle-btn g-plan';
      plan.href = planHref;
      plan.innerHTML = '<span aria-hidden="true">📋</span> <span data-ar="خطتي" data-en="My plan">' + esc(L('خطتي', 'My plan')) + '</span>';
      menu.appendChild(plan);
    }

     
    if (isContentVariant(variant) && !document.getElementById('font-size-group')) {
      var fg = document.createElement('div');
      fg.className = 'font-size-group g-menu-item';
      fg.id = 'font-size-group';
      var lbl = _fontLabel();
      fg.innerHTML =
        '<button class="font-size-btn" id="font-size-minus" type="button" title="' + esc(L('تصغير الخط', 'Smaller')) + '"><i class="fa-solid fa-minus"></i></button>' +
        '<span class="font-size-indicator" id="font-size-indicator">' + esc(lbl) + '</span>' +
        '<button class="font-size-btn" id="font-size-plus" type="button" title="' + esc(L('تكبير الخط', 'Larger')) + '"><i class="fa-solid fa-plus"></i></button>';
      menu.appendChild(fg);
      fg.querySelector('#font-size-minus').addEventListener('click', function () { if (window.Garden) Garden.fontDown(); _syncFont(); });
      fg.querySelector('#font-size-plus').addEventListener('click', function () { if (window.Garden) Garden.fontUp(); _syncFont(); });
    }

     
    var themeBtn = document.createElement('button');
    themeBtn.className = 'g-menu-item toggle-btn';
    themeBtn.type = 'button';
    themeBtn.setAttribute('data-gh-theme', '');
    themeBtn.title = L('الثيم', 'Theme');
    themeBtn.innerHTML = '<span id="theme-icon">🌙</span>';
    themeBtn.addEventListener('click', function () { if (window.Garden && Garden.cycleTheme) Garden.cycleTheme(); });
    menu.appendChild(themeBtn);

     
    var langBtn = document.createElement('button');
    langBtn.className = 'toggle-btn g-lang';
    langBtn.type = 'button';
    langBtn.title = 'Language';
    langBtn.innerHTML = '<span id="lang-btn">' + esc(isAr() ? 'EN' : 'AR') + '</span>';
    langBtn.addEventListener('click', function () { if (window.Garden && Garden.toggleLanguage) Garden.toggleLanguage(); });

     
    var more = document.createElement('button');
    more.className = 'g-more';
    more.type = 'button';
    more.setAttribute('aria-expanded', 'false');
    more.title = L('المزيد', 'More');
    more.innerHTML = '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>';
    more.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = host.classList.toggle('g-menu-open');
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    tail.appendChild(menu);
    tail.appendChild(langBtn);
    tail.appendChild(more);
    host.appendChild(tail);

     
    document.addEventListener('click', function (e) {
      if (!host.classList.contains('g-menu-open')) return;
      if (host.contains(e.target)) return;
      host.classList.remove('g-menu-open');
      more.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && host.classList.contains('g-menu-open')) {
        host.classList.remove('g-menu-open');
        more.setAttribute('aria-expanded', 'false');
      }
    });

    host.setAttribute('data-gh-ready', '1');

     
    if ((variant === 'top' || variant === 'level') && !document.querySelector('.dash-side')) injectAppSidebar();

    if (window.Garden && Garden.applyTheme) {
      Garden.applyTheme(localStorage.getItem('garden_theme') || 'dark');
    }
    _syncFont();
    relabel();
    document.addEventListener('garden:languageChanged', function () { relabel(); _syncFont(); });
  }

   
  function injectAppSidebar() {
    if (document.querySelector('.app-sidebar')) return;
    var header = document.querySelector('.g-header');
    if (!header || header.parentElement !== document.body) return;   

    var path = location.pathname;
    var cur = /hub\/schedule/.test(path) ? 'schedule'
            : /hub\/gpa/.test(path) ? 'gpa'
            : /hub\/(index|course|planner)/.test(path) ? 'semester'
            : /\/(L\d+|others)\//.test(path) ? 'levels'
            : '';
     
    var groups = [
      { label: null, items: [
        { key: 'home', href: ROOT + 'index.html', icon: 'fa-house', ar: 'الرئيسية', en: 'Home' },
        { key: 'levels', href: ROOT + 'index.html#levels', icon: 'fa-layer-group', ar: 'المستويات', en: 'Levels' }
      ] },
      { label: { ar: 'الأدوات', en: 'Tools' }, items: [
        { key: 'semester', href: ROOT + 'hub/index.html', icon: 'fa-graduation-cap', ar: 'فصلي', en: 'Semester' },
        { key: 'schedule', href: ROOT + 'hub/schedule.html', icon: 'fa-calendar-week', ar: 'الجدول', en: 'Schedule' },
        { key: 'gpa', href: ROOT + 'hub/gpa.html', icon: 'fa-chart-line', ar: 'المعدل', en: 'GPA' }
      ] },
      { label: null, items: [
        { key: 'tasks', href: ROOT + 'index.html#tasks', icon: 'fa-list-check', ar: 'المهام', en: 'Tasks' },
        { key: 'settings', href: ROOT + 'index.html#settings', icon: 'fa-gear', ar: 'الإعدادات', en: 'Settings' }
      ] }
    ];
    var aside = document.createElement('aside');
    aside.className = 'dash-side app-sidebar';
    aside.innerHTML = groups.map(function (g) {
      var lbl = g.label
        ? '<div class="dash-side-label" data-ar="' + esc(g.label.ar) + '" data-en="' + esc(g.label.en) + '">' + esc(L(g.label.ar, g.label.en)) + '</div>'
        : '';
      return '<div class="dash-side-group">' + lbl + g.items.map(function (it) {
        return '<a class="dash-side-item' + (it.key === cur ? ' active' : '') + '" href="' + it.href + '">' +
          '<i class="fa-solid ' + it.icon + '"></i><span data-ar="' + esc(it.ar) + '" data-en="' + esc(it.en) + '">' +
          esc(L(it.ar, it.en)) + '</span></a>';
      }).join('') + '</div>';
    }).join('');

     
    var shell = document.createElement('div');
    shell.className = 'app-shell';
    var main = document.createElement('div');
    main.className = 'app-shell-main';

    var node = header.nextSibling;
    while (node) {
      var next = node.nextSibling;
      var skip = node.nodeType === 1 && /^(SCRIPT|TEMPLATE|STYLE|NOSCRIPT|LINK)$/.test(node.tagName);
      if (!skip) main.appendChild(node);
      node = next;
    }
    shell.appendChild(aside);
    shell.appendChild(main);
    header.parentNode.insertBefore(shell, header.nextSibling);
    document.documentElement.classList.add('has-app-shell');
  }

  function _segBtn(href, icon, label, kind) {
    var b;
    if (href) {
      b = document.createElement('a');
      b.href = href;
    } else {
      b = document.createElement('span');
      b.setAttribute('aria-disabled', 'true');
    }
    b.className = 'g-seg-btn g-seg-' + kind;
    b.setAttribute('data-ar-label', kind === 'prev' ? 'السابق' : 'التالي');
    b.setAttribute('data-en-label', kind === 'prev' ? 'Prev' : 'Next');
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>';
    return b;
  }

  var FONT_LABELS = { xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
  function _fontLabel() {
    var v = document.documentElement.getAttribute('data-font-size') || localStorage.getItem('garden_font_size') || 'md';
    return FONT_LABELS[v] || 'M';
  }
  function _syncFont() {
    var ind = document.getElementById('font-size-indicator');
    if (ind) ind.textContent = _fontLabel();
  }

  function relabel() {
    var ar = isAr();
    var host = document.querySelector('.g-header');
    if (!host) return;
    host.querySelectorAll('[data-ar]').forEach(function (el) {
      var v = el.getAttribute(ar ? 'data-ar' : 'data-en');
      if (v) el.textContent = v;
    });
    var lb = host.querySelector('#lang-btn'); if (lb) lb.textContent = ar ? 'EN' : 'AR';
    var b = host.querySelector('.g-back');
    if (b) b.setAttribute('aria-label', b.getAttribute(ar ? 'data-ar-label' : 'data-en-label') || '');
    var l = host.querySelector('.g-logo');
    if (l) l.setAttribute('aria-label', ar ? 'الرئيسية' : 'Home');
    host.querySelectorAll('.g-seg-btn').forEach(function (el) {
      var v = el.getAttribute(ar ? 'data-ar-label' : 'data-en-label');
      if (v) { el.title = v; el.setAttribute('aria-label', v); }
    });
  }

  window.GardenHeader = {
    setTitle: function (ar, en) {
      document.body.setAttribute('data-page-title', ar || '');
      document.body.setAttribute('data-page-title-en', en || ar || '');
      var t = document.querySelector('.g-header .g-title');
      if (t) {
        t.setAttribute('data-ar', ar || '');
        t.setAttribute('data-en', en || ar || '');
        t.textContent = isAr() ? (ar || '') : (en || ar || '');
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
