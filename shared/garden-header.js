/*@3.GAHJ.1*/

;(function () {
  'use strict';

  var thisScript = document.currentScript;
  var ROOT = (thisScript && thisScript.src)
    ? thisScript.src.replace(/shared\/garden-header\.js(\?.*)?$/, '')
    : '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }

  /*@3.GAHJ.2*/
  var SB_KEY = 'garden_sidebar';
  function sbIsCollapsed() {
    try { return localStorage.getItem(SB_KEY) === 'collapsed'; } catch (e) { return false; }
  }
  function sbApply(on) { document.documentElement.classList.toggle('sb-collapsed', !!on); }
  sbApply(sbIsCollapsed());
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function L(ar, en) { return isAr() ? ar : en; }

  /*@3.GAHJ.3*/
  var _cat = null, _catCbs = [];
  function subjectMeta(code, cb) {
    if (!code) { cb(null); return; }
    if (_cat) { var c = _cat[code]; cb(c ? { icon: c.icon, color: c.brand_color } : null); return; }
    _catCbs.push({ code: code, cb: cb });
    if (_catCbs.length > 1) return;   /*@3.GAHJ.4*/
    fetch(ROOT + 'shared/data/courses_catalog.json')
      .then(function (r) { return r.json(); })
      .then(function (j) { _cat = {}; (j.courses || []).forEach(function (c) { if (c && c.code) _cat[c.code] = c; }); })
      .catch(function () { _cat = {}; })
      .then(function () { _catCbs.forEach(function (o) { var c = _cat[o.code]; o.cb(c ? { icon: c.icon, color: c.brand_color } : null); }); _catCbs = []; });
  }

  /*@3.GAHJ.5*/
  var _upFallback = '';
  function upTarget() { return _upFallback || (ROOT + 'index.html'); }
  function goBack() {
    if (window.Garden && Garden.goBack && Garden.hasBackTarget && Garden.hasBackTarget()) { Garden.goBack(); return; }
    if (window.Garden && Garden.goBack && !Garden.hasBackTarget) { Garden.goBack(); return; }
    if (window.Garden && Garden.goUp) { Garden.goUp(upTarget()); return; }
    location.href = upTarget();
  }
  function hasBack() {
    if (window.Garden && Garden.hasBackTarget) return Garden.hasBackTarget();
    return history.length > 1;
  }
  /*@3.GAHJ.6*/
  function upIsSelf() {
    if (window.Garden && Garden.isSelfHref) return Garden.isSelfHref(upTarget());
    try {
      var u = new URL(upTarget(), location.href), h = new URL(location.href);
      u.hash = ''; h.hash = '';
      if (/\/$/.test(u.pathname)) u.pathname += 'index.html';
      if (/\/$/.test(h.pathname)) h.pathname += 'index.html';
      return u.href === h.href;
    } catch (e) { return false; }
  }

  /*@3.GAHJ.7*/
  function isContentVariant(variant) {
    if (variant === 'module') return true;
    var p = document.documentElement.getAttribute('data-page');
    return p === 'review' || p === 'quiz';
  }

  /*@3.GAHJ.8*/
  function _injectSearchJs(input) {
    if (window.__gardenSearchInjected) {
      /*@3.GAHJ.9*/
      try { if (window.GardenSearch && document.activeElement === input) window.GardenSearch.load(); } catch (e) {}
      return;
    }
    window.__gardenSearchInjected = true;
    window.GARDEN_HEADER_ROOT = ROOT;            /*@3.GAHJ.10*/
    var s = document.createElement('script');
    s.src = ROOT + 'shared/search.js';
    s.onload = function () {
      /*@3.GAHJ.11*/
      try { if (window.GardenSearch && document.activeElement === input) window.GardenSearch.load(); } catch (e) {}
    };
    document.head.appendChild(s);
  }

  /*@3.GAHJ.12*/
  /*@3.GAHJ.92*/
  var PH_LONG = { ar: 'ابحث في موادك ومهامك وشعبك وأساتذتك والمختبرات وملاحظاتك…',
                  en: 'Search your courses, tasks, sections, instructors, labs and notes…' };
  var PH_SHORT = { ar: 'ابحث…', en: 'Search…' };
  function syncSearchPlaceholder() {
    var ph = document.getElementById('gs-ph');
    if (!ph) return;
    var p = window.innerWidth <= 640 ? PH_SHORT : PH_LONG;
    ph.setAttribute('data-ar', p.ar);
    ph.setAttribute('data-en', p.en);
    ph.textContent = isAr() ? p.ar : p.en;
  }

  function _buildHeaderSearch(host) {
    var box = document.createElement('div');
    box.className = 'dash-search g-search-slot';
    box.id = 'gs-box';
    box.setAttribute('data-gh-slot', 'search');
    box.innerHTML =
      '<i class="fa-solid fa-magnifying-glass dash-search-icon" aria-hidden="true"></i>' +
      '<input type="search" id="gs-input" class="dash-search-input" autocomplete="off" aria-label="' + esc(L('بحث شامل', 'Search')) + '">' +
      '<span class="dash-search-ph-mask" aria-hidden="true"><span class="dash-search-ph" id="gs-ph"' +
        ' data-ar="' + esc(PH_LONG.ar) + '"' +
        ' data-en="' + esc(PH_LONG.en) + '">' +
        esc(L(PH_LONG.ar, PH_LONG.en)) + '</span></span>' +
      '<span class="dash-search-kbd">Ctrl K</span>' +
      '<div class="gs-panel" id="gs-panel" hidden></div>';
    var input = box.querySelector('#gs-input');

    /*@3.GAHJ.13*/
    input.addEventListener('focus', function () { _injectSearchJs(input); }, { once: true });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        _injectSearchJs(input);
        input.focus();
      }
    });
    return box;
  }

  /*@3.GAHJ.14*/

  function _courseCode() {
    return (document.documentElement.getAttribute('data-subject') || '').trim();
  }

  /*@3.GAHJ.15*/
  function tintedColor(fallback) {
    return document.documentElement.hasAttribute('data-subject')
      ? 'var(--brand-500, ' + fallback + ')'
      : fallback;
  }

  /*@3.GAHJ.16*/
  var _ccState = 0, _ccWait = [];
  function _needCourseColor(cb) {
    if (_ccState === 2) { cb(true); return; }
    _ccWait.push(cb);
    if (_ccState === 1) return;
    _ccState = 1;

    if (!document.querySelector('link[data-gh-cc]')) {
      var lk = document.createElement('link');
      lk.rel = 'stylesheet';
      lk.href = ROOT + 'shared/course-color.css';
      lk.setAttribute('data-gh-cc', '1');
      document.head.appendChild(lk);
    }

    var need = [];
    if (!window.GardenData) need.push('shared/garden-data.js');
    if (!window.GardenCourseColor) need.push('shared/course-color.js');

    var i = 0;
    (function next(ok) {
      if (!ok) { done(false); return; }
      if (i >= need.length) { done(true); return; }
      var s = document.createElement('script');
      s.src = ROOT + need[i++];
      s.onload = function () { next(true); };
      s.onerror = function () { next(false); };
      document.head.appendChild(s);
    })(true);

    function done(ok) {
      _ccState = ok ? 2 : 0;                 /*@3.GAHJ.17*/
      var w = _ccWait; _ccWait = [];
      w.forEach(function (f) { try { f(ok); } catch (e) {} });
    }
  }

  /*@3.GAHJ.100*/
  var _qnLoad = 0;
  function _openQuickNote(btn, id) {
    if (window.GardenQuickNote) { GardenQuickNote.open({ opener: btn, id: id }); return; }
    if (_qnLoad) return;
    _qnLoad = 1;
    if (btn) btn.setAttribute('aria-busy', 'true');
    var s = document.createElement('script');
    s.src = ROOT + 'shared/notes-quick.js';
    s.onload = function () {
      _qnLoad = 0;
      if (btn) btn.removeAttribute('aria-busy');
      if (window.GardenQuickNote) GardenQuickNote.open({ opener: btn, id: id });
    };
    s.onerror = function () {
      _qnLoad = 0;
      if (btn) btn.removeAttribute('aria-busy');
    };
    document.head.appendChild(s);
  }

  /*@3.GAHJ.102*/
  function _quickFromHash() {
    var m = /(?:^|[#&])qn-([A-Za-z0-9_.-]+)/.exec(location.hash || '');
    if (!m) return;
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e) {}
    _openQuickNote(null, m[1]);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _quickFromHash);
  } else {
    setTimeout(_quickFromHash, 0);
  }
  window.addEventListener('hashchange', _quickFromHash);

  function _openColor(code, btn) {
    if (btn) btn.setAttribute('aria-busy', 'true');
    _needCourseColor(function (ok) {
      if (btn) btn.removeAttribute('aria-busy');
      if (!ok || !window.GardenCourseColor || !window.GardenData) return;
      window.GardenData.ready().then(function () {
        var info = GardenData.courseInfo ? GardenData.courseInfo(code) : null;
        GardenCourseColor.open(code, {
          courseName: info ? (isAr() ? (info.name_ar || code) : (info.name_en || code)) : code,
          /*@3.GAHJ.18*/
          skinColours: true,
          /*@3.GAHJ.19*/
          onPick: function () {
            if (window.GardenTint && GardenTint.refresh) GardenTint.refresh();
          }
        });
      });
    });
  }

  /*@3.GAHJ.20*/
  var _mtState = 0, _mtWait = [];
  function _needModTheme(cb) {
    if (window.GardenModuleTheme) { cb(true); return; }
    _mtWait.push(cb);
    if (_mtState === 1) return;
    _mtState = 1;
    var s = document.createElement('script');
    s.src = ROOT + 'shared/module-theme.js';
    s.onload = function () { done(true); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
    function done(ok) {
      _mtState = ok ? 2 : 0;
      var w = _mtWait; _mtWait = [];
      w.forEach(function (f) { try { f(ok); } catch (e) {} });
    }
  }

  /*@3.GAHJ.21*/
  function _watchBaseTheft() {
    if (!window.MutationObserver || _watchBaseTheft.__on) return;
    _watchBaseTheft.__on = 1;
    setTimeout(function () {
      var root = document.documentElement;
      var mo = new MutationObserver(function () {
        if (!root.getAttribute('data-mod-theme')) return;
        var base = (GardenTint.THEME_BASE || {})[root.getAttribute('data-mod-theme')];
        if (root.getAttribute('data-theme') === base) return;   /*@3.GAHJ.22*/
        GardenTint.clearTheme();                                 /*@3.GAHJ.23*/
      });
      try { mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
    }, 0);
  }

  function _themeBtn() {
    var b = document.createElement('button');
    b.className = 'g-menu-item toggle-btn g-mod-theme';
    b.type = 'button';
    b.setAttribute('data-title-ar', 'مظهرٌ مخصّص');
    b.setAttribute('data-title-en', 'Custom appearance');
    b.title = L('مظهرٌ مخصّص', 'Custom appearance');
    b.setAttribute('aria-label', L('مظهرٌ مخصّص', 'Custom appearance'));
    b.setAttribute('aria-haspopup', 'menu');
    /*@3.GAHJ.24*/
    b.innerHTML = '<i class="fa-solid fa-swatchbook" aria-hidden="true"></i>';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      _needModTheme(function (ok) { if (ok && window.GardenModuleTheme) GardenModuleTheme.open(b); });
    });
    return b;
  }
  /*@3.GAHJ.25*/

  function _courseBtns(host, inline, variant, upHref) {
    var code = _courseCode();
    if (!code) return;

    /*@3.GAHJ.26*/
    if (variant === 'module' && upHref) {
      var a = document.createElement('a');
      a.className = 'g-menu-item toggle-btn g-course-home';
      a.href = upHref;
      a.setAttribute('data-title-ar', 'صفحة المادة');
      a.setAttribute('data-title-en', 'Course page');
      a.title = L('صفحة المادة', 'Course page');
      a.setAttribute('aria-label', L('صفحة المادة', 'Course page'));
      a.innerHTML = '<i class="fa-solid fa-book-open-reader" aria-hidden="true"></i>';
      inline.appendChild(a);
    }

    var b = document.createElement('button');
    b.className = 'g-menu-item toggle-btn g-course-color';
    b.type = 'button';
    b.setAttribute('data-title-ar', 'لون المادة');
    b.setAttribute('data-title-en', 'Course colour');
    b.title = L('لون المادة', 'Course colour');
    b.setAttribute('aria-label', L('لون المادة', 'Course colour'));
    /*@3.GAHJ.27*/
    b.innerHTML = '<i class="fa-solid fa-palette" aria-hidden="true" ' +
                  'style="color:var(--brand-500, currentColor)"></i>';
    b.addEventListener('click', function () { _openColor(code, b); });
    inline.appendChild(b);

    /*@3.GAHJ.28*/
    inline.appendChild(_themeBtn());
  }

  /*@3.GAHJ.29*/
  function placeCourseHome(host) {
    var ch = host.querySelector('.g-course-home');
    if (!ch) return;
    if (window.matchMedia('(max-width: 640px)').matches) {
      var sem = host.querySelector('.g-sem-link');
      if (sem && sem.parentNode) {
        if (sem.previousElementSibling !== ch) sem.parentNode.insertBefore(ch, sem);
      } else {
        var inl = host.querySelector('.g-inline');
        if (inl && ch.parentNode !== inl) inl.appendChild(ch);
      }
      return;
    }
    var back = host.querySelector('.g-back');
    if (back && back.parentNode && back.nextElementSibling !== ch) {
      back.parentNode.insertBefore(ch, back.nextSibling);
    }
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

    /*@3.GAHJ.30*/
    var searchSlot = host.querySelector('[data-gh-slot="search"]');
    var actionsSlot = host.querySelector('[data-gh-slot="actions"]');
    if (searchSlot) searchSlot.remove();
    if (actionsSlot) actionsSlot.remove();

    host.className = 'g-header g-v-' + variant;
    host.innerHTML = '';

    /*@3.GAHJ.31*/
    var logo = document.createElement('a');
    logo.className = 'g-logo';
    logo.href = ROOT + 'index.html';
    logo.innerHTML =
      '<img class="g-logo-mark" src="' + ROOT + 'shared/icons/logo-mark.svg" alt="" aria-hidden="true" width="26" height="26">' +
      '<span class="g-logo-text" data-ar="الحديقة الرقمية" data-en="Digital Garden">' +
      esc(L('الحديقة الرقمية', 'Digital Garden')) + '</span>';
    logo.setAttribute('aria-label', L('الرئيسية', 'Home'));
    host.appendChild(logo);

    /*@3.GAHJ.32*/
    var back = document.createElement('button');
    back.className = 'g-back';
    back.type = 'button';
    /*@3.GAHJ.33*/
    back.innerHTML = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    back.setAttribute('aria-label', L('رجوع', 'Back'));
    back.setAttribute('data-ar-label', 'رجوع');
    back.setAttribute('data-en-label', 'Back');
    _upFallback = upHref || (ROOT + 'index.html');
    back.addEventListener('click', goBack);
    /*@3.GAHJ.34*/
    if (!hasBack()) {
      if (upIsSelf()) back.style.display = 'none';
      else back.setAttribute('data-gh-up-only', '1');
    }
    host.appendChild(back);

    /*@3.GAHJ.35*/
    var isSubjectVariant = (variant === 'module' || variant === 'course');
    if (isSubjectVariant) {
      /*@3.GAHJ.36*/
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

      /*@3.GAHJ.37*/
      var injIcon = host.getAttribute('data-gh-icon');
      var injColor = host.getAttribute('data-gh-color');
      if (injIcon) { ico.className = 'g-title-ico ' + injIcon; if (injColor) ico.style.color = tintedColor(injColor); }
      else {
        var code = (host.getAttribute('data-gh-code') || (titleAr || '').split(/[\s·]/)[0] || '').trim();
        subjectMeta(code, function (m) { if (m && m.icon) { ico.className = 'g-title-ico ' + m.icon; if (m.color) ico.style.color = tintedColor(m.color); } });
      }
    } else {
      var titleEl = document.createElement('h1');
      titleEl.className = 'g-title';
      titleEl.setAttribute('data-ar', titleAr);
      titleEl.setAttribute('data-en', titleEn);
      titleEl.textContent = isAr() ? titleAr : titleEn;
      host.appendChild(titleEl);
    }

    /*@3.GAHJ.38*/
    if (searchSlot) { searchSlot.classList.add('g-search-slot'); host.appendChild(searchSlot); }
    else if (variant === 'top' || variant === 'level') { host.appendChild(_buildHeaderSearch(host)); }
    else { var sp = document.createElement('div'); sp.className = 'g-spacer'; host.appendChild(sp); }

    /*@3.GAHJ.39*/
    var tail = document.createElement('div');
    tail.className = 'g-tail';

    var menu = document.createElement('div');
    menu.className = 'g-menu';
    menu.id = 'g-menu';

    var inline = document.createElement('div');
    inline.className = 'g-inline';

    /*@3.GAHJ.40*/

    /*@3.GAHJ.41*/
    if (actionsSlot) {
      while (actionsSlot.firstElementChild) {
        var _a = actionsSlot.firstElementChild;
        _a.classList.add('g-menu-item');
        inline.appendChild(_a);
      }
      actionsSlot.remove();
    }

    /*@3.GAHJ.42*/

    /*@3.GAHJ.43*/
    if (isSubjectVariant) {
      var semA = document.createElement('a');
      /*@3.GAHJ.44*/
      semA.className = 'g-menu-item toggle-btn g-sem-link';
      semA.href = ROOT + 'hub/index.html';
      semA.setAttribute('data-title-ar', 'فصلي');
      semA.setAttribute('data-title-en', 'My Semester');
      semA.title = L('فصلي', 'My Semester');
      semA.setAttribute('aria-label', L('فصلي', 'My Semester'));
      semA.innerHTML = '<i class="fa-solid fa-seedling" aria-hidden="true"></i>';
      inline.appendChild(semA);

      /*@3.GAHJ.45*/
      _courseBtns(host, inline, variant, upHref);
    }

    /*@3.GAHJ.46*/
    if (isContentVariant(variant) && !document.getElementById('font-size-group')) {
      var fg = document.createElement('div');
      fg.className = 'font-size-group g-menu-item';
      fg.id = 'font-size-group';
      var lbl = _fontLabel();
      fg.innerHTML =
        '<button class="font-size-btn" id="font-size-minus" type="button" title="' + esc(L('تصغير الخط', 'Smaller')) + '"><i class="fa-solid fa-minus"></i></button>' +
        '<span class="font-size-indicator" id="font-size-indicator">' + esc(lbl) + '</span>' +
        '<button class="font-size-btn" id="font-size-plus" type="button" title="' + esc(L('تكبير الخط', 'Larger')) + '"><i class="fa-solid fa-plus"></i></button>';
      inline.appendChild(fg);
      fg.querySelector('#font-size-minus').addEventListener('click', function () { if (window.Garden) Garden.fontDown(); _syncFont(); });
      fg.querySelector('#font-size-plus').addEventListener('click', function () { if (window.Garden) Garden.fontUp(); _syncFont(); });
    }

    /*@3.GAHJ.47*/
    var themeBtn = document.createElement('button');
    themeBtn.className = 'g-menu-item toggle-btn';
    themeBtn.type = 'button';
    themeBtn.setAttribute('data-gh-theme', '');
    /*@3.GAHJ.48*/
    themeBtn.setAttribute('data-title-ar', 'الثيم');
    themeBtn.setAttribute('data-title-en', 'Theme');
    themeBtn.title = L('الثيم', 'Theme');
    themeBtn.innerHTML = '<span id="theme-icon"><i class="fa-solid fa-moon" aria-hidden="true"></i></span>';
    themeBtn.addEventListener('click', function () { if (window.Garden && Garden.cycleTheme) Garden.cycleTheme(); });
    inline.appendChild(themeBtn);

    /*@3.GAHJ.99*/
    if (document.body.hasAttribute('data-no-notes') &&
        !document.body.hasAttribute('data-notes-app')) {
      var qnBtn = document.createElement('button');
      qnBtn.className = 'g-menu-item toggle-btn';
      qnBtn.type = 'button';
      qnBtn.setAttribute('data-gh-quicknote', '');
      qnBtn.setAttribute('data-title-ar', 'ملاحظة سريعة');
      qnBtn.setAttribute('data-title-en', 'Quick note');
      qnBtn.title = L('ملاحظة سريعة', 'Quick note');
      qnBtn.setAttribute('aria-label', L('ملاحظة سريعة', 'Quick note'));
      qnBtn.innerHTML = '<i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>';
      qnBtn.addEventListener('click', function () { _openQuickNote(qnBtn); });
      inline.appendChild(qnBtn);
    }

    /*@3.GAHJ.49*/
    var langBtn = document.createElement('button');
    langBtn.className = 'toggle-btn g-lang';
    langBtn.type = 'button';
    /*@3.GAHJ.50*/
    langBtn.title = isAr() ? 'English' : 'العربية';
    langBtn.innerHTML = '<span id="lang-btn">' + esc(isAr() ? 'EN' : 'AR') + '</span>';
    langBtn.addEventListener('click', function () { if (window.Garden && Garden.toggleLanguage) Garden.toggleLanguage(); });

    /*@3.GAHJ.51*/
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

    tail.appendChild(inline);
    tail.appendChild(langBtn);
    tail.appendChild(more);
    tail.appendChild(menu);
    host.appendChild(tail);

    /*@3.GAHJ.52*/
    decorateMenuItems(inline);
    layoutMenu(host);

    /*@3.GAHJ.53*/
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

    /*@3.GAHJ.54*/
    if ((variant === 'top' || variant === 'level') && !document.querySelector('.dash-side')) injectAppSidebar();

    /*@3.GAHJ.55*/
    mountSidebarToggle();

    if (window.Garden && Garden.applyTheme) {
      Garden.applyTheme(localStorage.getItem('garden_theme') || 'dark');

      /*@3.GAHJ.56*/
      if (window.GardenTint && GardenTint.applyTheme) {
        GardenTint.applyTheme();
        if (GardenTint.clearTheme) _watchBaseTheft();
      }
      /*@3.GAHJ.57*/
    }
    _syncFont();
    relabel();
    syncSearchPlaceholder();
    document.addEventListener('garden:languageChanged', function () {
      relabel(); _syncFont(); syncSearchPlaceholder();
      document.querySelectorAll('.app-sidebar, .dash-side').forEach(sbSyncTips);
      /*@3.GAHJ.58*/
      layoutMenu(host);
    });

    /*@3.GAHJ.59*/
    var _lay = null, _ro = null;
    function relayout() { clearTimeout(_lay); _lay = setTimeout(function () { layoutMenu(host); }, 60); }
    /*@3.GAHJ.60*/
    if (window.ResizeObserver) { try { _ro = new ResizeObserver(relayout); _ro.observe(host); } catch (e) {} }
    window.addEventListener('resize', relayout);
    /*@3.GAHJ.61*/
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(function () {});

    /*@3.GAHJ.62*/
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (!e.key || e.key.toLowerCase() !== 'b') return;
      var t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (!document.querySelector('.app-sidebar, .dash-side')) return;
      e.preventDefault();
      sbToggle();
    });
    var _phT = null;
    window.addEventListener('resize', function () { clearTimeout(_phT); _phT = setTimeout(syncSearchPlaceholder, 180); });
  }

  /*@3.GAHJ.63*/
  function injectAppSidebar() {
    if (document.querySelector('.app-sidebar')) return;
    var header = document.querySelector('.g-header');
    if (!header || header.parentElement !== document.body) return;   /*@3.GAHJ.64*/

    var path = location.pathname;
    /*@3.GAHJ.65*/
    var cur = /hub\/schedule/.test(path) ? 'schedule'
            : /hub\/sections/.test(path) ? 'sections'
            : /hub\/ratings/.test(path) ? 'ratings'
            : /hub\/faculty/.test(path) ? 'faculty'
            : /hub\/gpa/.test(path) ? 'gpa'
            : /(hub\/labs|\/labs\/)/.test(path) ? 'labs'
            : /hub\/(index|course)/.test(path) ? 'semester'
            : /\/(L\d+|others)\//.test(path) ? 'levels'
            : '';
    /*@3.GAHJ.66*/
    var groups = [
      { label: null, items: [
        { key: 'home', href: ROOT + 'index.html', icon: 'fa-house', ar: 'الرئيسية', en: 'Home' },
        /*@3.GAHJ.67*/
        { key: 'levels', href: ROOT + 'index.html#levels', icon: 'fa-stairs', ar: 'المستويات', en: 'Levels' },
        /*@3.GAHJ.68*/
        { key: 'tasks', href: ROOT + 'index.html#tasks', icon: 'fa-list-check', ar: 'المهام', en: 'Tasks' }
      ] },
      { label: { ar: 'الأدوات', en: 'Tools' }, items: [
        { key: 'semester', href: ROOT + 'hub/index.html', icon: 'fa-graduation-cap', ar: 'فصلي', en: 'Semester' },
        { key: 'schedule', href: ROOT + 'hub/schedule.html', icon: 'fa-calendar-week', ar: 'الجدول', en: 'Schedule' },
        { key: 'gpa', href: ROOT + 'hub/gpa.html', icon: 'fa-chart-line', ar: 'المعدل', en: 'GPA' },
        /*@3.GAHJ.71*/
        /*@3.GAHJ.103*/
        { key: 'faculty', href: ROOT + 'hub/faculty.html', icon: 'fa-chalkboard-user', ar: 'الأساتذة', en: 'Faculty' },
        /*@3.GAHJ.69*/
        { key: 'labs', href: ROOT + 'hub/labs.html', icon: 'fa-flask', ar: 'المختبر', en: 'Labs' },
        /*@3.GAHJ.70*/
        { key: 'sections', href: ROOT + 'hub/sections.html', icon: 'fa-layer-group', ar: 'الشعب', en: 'Sections' },
        { key: 'ratings', href: ROOT + 'hub/ratings.html', icon: 'fa-star-half-stroke', ar: 'تقييماتي', en: 'My ratings' },
        /*@3.GAHJ.93*/
        { key: 'notes', href: ROOT + 'hub/notes.html', icon: 'fa-note-sticky', ar: 'ملاحظاتي', en: 'My notes' }
      ] },
      { label: null, items: [
        { key: 'tour', href: ROOT + 'tour.html', icon: 'fa-seedling', ar: 'اكتشف الحديقة', en: 'Explore the Garden' },
        { key: 'settings', href: ROOT + 'index.html#settings', icon: 'fa-gear', ar: 'الإعدادات', en: 'Settings' }
      ] }
    ];
    /*@3.GAHJ.72*/
    var F = window.GardenFlags;
    if (F && !F.get('labs.publicNav')) {
      groups = groups.map(function (g) {
        return { label: g.label, items: g.items.filter(function (it) { return it.key !== 'labs'; }) };
      });
    }

    var aside = document.createElement('aside');
    aside.className = 'dash-side app-sidebar';
    aside.innerHTML = groups.map(function (g) {
      var lbl = g.label
        ? '<div class="dash-side-label" data-ar="' + esc(g.label.ar) + '" data-en="' + esc(g.label.en) + '">' + esc(L(g.label.ar, g.label.en)) + '</div>'
        : '';
      return '<div class="dash-side-group">' + lbl + g.items.map(function (it) {
        /*@3.GAHJ.73*/
        var nm = esc(L(it.ar, it.en));
        return '<a class="dash-side-item' + (it.key === cur ? ' active' : '') + '" href="' + it.href + '"' +
          ' data-side-key="' + esc(it.key) + '"' +
          ' title="' + nm + '" aria-label="' + nm + '"' +
          ' data-ar-title="' + esc(it.ar) + '" data-en-title="' + esc(it.en) + '"' +
          (it.key === cur ? ' aria-current="page"' : '') + '>' +
          '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i><span data-ar="' + esc(it.ar) + '" data-en="' + esc(it.en) + '">' +
          nm + '</span></a>';
      }).join('') + '</div>';
    }).join('');

    /*@3.GAHJ.74*/
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

  /*@3.GAHJ.94*/
  window.GardenDragOrder = function (host, opt) {
    var Y = opt.axis === 'y';
    var CO = Y ? 'clientY' : 'clientX';
    var LO = Y ? 'top' : 'left';
    var HI = Y ? 'bottom' : 'right';
    var drag = null, dead = false;
    function live() { return !opt.enabled || opt.enabled(); }
    function tf(d) {
      return (Y ? 'translateY(' + d + 'px) translateX(4px)'
                : 'translateX(' + d + 'px) translateY(-4px)') + ' scale(1.04)';
    }
    function end() {
      if (!drag) return;
      var a = drag.a, moved = drag.moved;
      drag = null;
      a.style.transform = '';
      a.classList.remove('gdo-drag');
      if (!moved) return;
      dead = true;
      setTimeout(function () { dead = false; }, 0);
      if (opt.onDrop) opt.onDrop();
    }
    host.addEventListener('pointerdown', function (e) {
      if (!live()) return;
      var a = e.target && e.target.closest ? e.target.closest(opt.sel) : null;
      if (!a || !host.contains(a)) return;
      drag = { a: a, base: e[CO], id: e.pointerId, moved: false };
      try { host.setPointerCapture(e.pointerId); } catch (e2) {}
    });
    host.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = e[CO] - drag.base;
      if (!drag.moved) {
        if (Math.abs(d) < 6) return;
        drag.moved = true;
        drag.a.classList.add('gdo-drag');
      }
      var sibs = [].slice.call(host.querySelectorAll(opt.sel));
      for (var i = 0; i < sibs.length; i++) {
        var el = sibs[i];
        if (el === drag.a) continue;
        var r = el.getBoundingClientRect();
        if (e[CO] < r[LO] || e[CO] > r[HI]) continue;
        var after = !!(drag.a.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
        drag.a.style.transform = '';
        var was = drag.a.getBoundingClientRect()[LO];
        el.parentElement.insertBefore(drag.a, after ? el.nextSibling : el);
        drag.base += drag.a.getBoundingClientRect()[LO] - was;
        d = e[CO] - drag.base;
        break;
      }
      drag.a.style.transform = tf(d);
    });
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    return { swallowed: function () { return dead; } };
  };

  /*@3.GAHJ.95*/
  var NAV_PREFS = 'dashboard_prefs';
  var NAV_ORDER = 'navOrder';

  function orderRead() {
    try {
      var p = JSON.parse(localStorage.getItem(NAV_PREFS) || 'null');
      var v = p && (p[NAV_ORDER] || p.navPins);
      return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : [];
    } catch (e) { return []; }
  }

  function orderWrite(list) {
    try {
      var p = null;
      try { p = JSON.parse(localStorage.getItem(NAV_PREFS) || 'null'); } catch (e2) {}
      if (!p || typeof p !== 'object') p = {};
      if (list && list.length) p[NAV_ORDER] = list; else delete p[NAV_ORDER];
      delete p.navPins;
      localStorage.setItem(NAV_PREFS, JSON.stringify(p));
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('garden:navOrderChanged'));
  }

  /*@3.GAHJ.101*/
  var SIDE_FIXED = { home: 1 };
  function sideItems(scope) {
    return [].slice.call(scope.querySelectorAll('.dash-side-item[data-side-key]'))
      .filter(function (a) { return !SIDE_FIXED[a.getAttribute('data-side-key')]; });
  }

  /*@3.GAHJ.97*/
  function orderSort(list, keyOf) {
    var rank = {};
    orderRead().forEach(function (k, i) { rank[k] = i; });
    var slots = [], picked = [];
    list.forEach(function (n, i) {
      if (rank[keyOf(n)] !== undefined) { slots.push(i); picked.push(n); }
    });
    if (picked.length < 2) return list.slice();
    picked.sort(function (a, b) { return rank[keyOf(a)] - rank[keyOf(b)]; });
    var out = list.slice();
    slots.forEach(function (i, j) { out[i] = picked[j]; });
    return out;
  }

  function sideKeyOf(a) { return a.getAttribute('data-side-key'); }

  function sideApply(root) {
    if (!orderRead().length) return;
    [].slice.call(root.querySelectorAll('.dash-side-group')).forEach(function (g) {
      var cur = sideItems(g);
      if (cur.length < 2) return;
      orderSort(cur, sideKeyOf).forEach(function (n) { g.appendChild(n); });
    });
  }

  function sideCapture() {
    var side = document.querySelector('.app-sidebar, .dash-side');
    if (!side) return;
    var seen = {}, seq = [];
    sideItems(side).forEach(function (a) {
      var k = a.getAttribute('data-side-key');
      if (k && !seen[k]) { seen[k] = 1; seq.push(k); }
    });
    orderRead().forEach(function (k) { if (!seen[k]) { seen[k] = 1; seq.push(k); } });
    orderWrite(seq);
  }

  /*@3.GAHJ.96*/
  var sideEdit = false, sideBound = null;
  function sideBind(side) {
    if (side._gdo) return;
    side._gdo = window.GardenDragOrder(side, {
      sel: '.dash-side-item[data-side-key]:not([data-side-key="home"])',
      axis: 'y',
      enabled: function () { return sideEdit; },
      onDrop: sideCapture
    });
    side.addEventListener('click', function (e) {
      if (!sideEdit) return;
      if (!e.target.closest('.dash-side-item')) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    /*@3.GAHJ.98*/
    sideItems(side).forEach(function (a) { a.draggable = false; });
    side.addEventListener('dragstart', function (e) { e.preventDefault(); });
    sideBound = side;
  }
  function sideSetEdit(on) {
    sideEdit = !!on;
    document.querySelectorAll('.app-sidebar, .dash-side').forEach(function (side) {
      if (sideEdit) side.setAttribute('data-order-edit', '1');
      else side.removeAttribute('data-order-edit');
    });
  }
  function sideBoot() {
    document.querySelectorAll('.app-sidebar, .dash-side').forEach(function (side) {
      sideApply(side);
      sideBind(side);
    });
  }
  window.GardenSideOrder = {
    sort: orderSort,
    setEdit: sideSetEdit,
    apply: sideBoot,
    read: orderRead,
    write: orderWrite
  };
  document.addEventListener('garden:navOrderChanged', function () {
    document.querySelectorAll('.app-sidebar, .dash-side').forEach(sideApply);
  });

  /*@3.GAHJ.75*/
  function sbSyncTips(side) {
    side.querySelectorAll('.dash-side-item').forEach(function (it) {
      var s = it.querySelector('span:not(.dash-side-badge)');
      var t = (s ? s.textContent : it.textContent) || '';
      it.setAttribute('data-tip', t.trim());
    });
    var tg = side.querySelector('.sb-toggle');
    if (tg) {
      var lbl = document.documentElement.classList.contains('sb-collapsed')
        ? L('بسط القائمة', 'Expand menu') : L('طيّ القائمة', 'Collapse menu');
      tg.setAttribute('data-tip', lbl);
      tg.setAttribute('aria-label', lbl);
      tg.setAttribute('title', lbl + ' (Ctrl+B)');
      var tx = tg.querySelector('.sb-toggle-txt');
      if (tx) {
        tx.setAttribute('data-ar', 'طيّ القائمة');
        tx.setAttribute('data-en', 'Collapse menu');
        tx.textContent = L('طيّ القائمة', 'Collapse menu');
      }
      tg.setAttribute('aria-expanded', document.documentElement.classList.contains('sb-collapsed') ? 'false' : 'true');
    }
  }

  function mountSidebarToggle() {
    sideBoot();
    var sides = document.querySelectorAll('.app-sidebar, .dash-side');
    if (!sides.length) return;
    sides.forEach(function (side) {
      if (side.querySelector('.sb-toggle')) { sbSyncTips(side); return; }
      var b = document.createElement('button');
      b.className = 'sb-toggle';
      b.type = 'button';
      b.innerHTML = '<i class="fa-solid fa-angles-right" aria-hidden="true"></i>' +
        '<span class="sb-toggle-txt" data-ar="طيّ القائمة" data-en="Collapse menu">' +
        esc(L('طيّ القائمة', 'Collapse menu')) + '</span>';
      b.addEventListener('click', function () { sbToggle(); });
      side.appendChild(b);
      sbSyncTips(side);
    });
  }

  function sbToggle(force) {
    var on = (force === undefined) ? !document.documentElement.classList.contains('sb-collapsed') : !!force;
    sbApply(on);
    try { localStorage.setItem(SB_KEY, on ? 'collapsed' : 'expanded'); } catch (e) {}
    document.querySelectorAll('.app-sidebar, .dash-side').forEach(sbSyncTips);
    /*@3.GAHJ.76*/
    window.dispatchEvent(new Event('resize'));
  }

  /*@3.GAHJ.77*/
  function _menuLabelOf(el) {
    var ar = el.getAttribute('data-title-ar') || el.getAttribute('data-ar-label');
    var en = el.getAttribute('data-title-en') || el.getAttribute('data-en-label');
    if (!ar && !en) {
      /*@3.GAHJ.78*/
      var t = (el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
      if (!t) return null;
      var parts = t.split('·');
      ar = (parts[0] || t).trim();
      en = (parts[1] || parts[0] || t).trim();
    }
    return { ar: ar || en, en: en || ar };
  }

  /*@3.GAHJ.79*/
  function _overflows(host) {
    /*@3.GAHJ.80*/
    return host.scrollWidth > host.clientWidth + 2;
  }

  function layoutMenu(host) {
    host = host || document.querySelector('.g-header');
    if (!host) return;
    var inline = host.querySelector('.g-inline');
    var menu = host.querySelector('.g-menu');
    var more = host.querySelector('.g-more');
    if (!inline || !menu || !more) return;
    if (!host.offsetParent && host.offsetWidth === 0) return;   /*@3.GAHJ.81*/

    /*@3.GAHJ.82*/
    while (menu.firstElementChild) inline.appendChild(menu.firstElementChild);
    host.classList.remove('g-has-more', 'g-menu-open');
    more.setAttribute('aria-expanded', 'false');

    /*@3.GAHJ.83*/
    placeCourseHome(host);

    /*@3.GAHJ.84*/
    if (window.matchMedia('(max-width: 640px)').matches && inline.children.length > 1) {
      while (inline.lastElementChild) menu.insertBefore(inline.lastElementChild, menu.firstChild);
      host.classList.add('g-has-more');
    }

    /*@3.GAHJ.85*/
    if (_overflows(host)) {
      host.classList.add('g-has-more');
      while (_overflows(host) && inline.lastElementChild) {
        menu.insertBefore(inline.lastElementChild, menu.firstChild);
      }
    }

    /*@3.GAHJ.86*/
    if (menu.children.length === 1) {
      var only = menu.firstElementChild;
      inline.appendChild(only);
      host.classList.remove('g-has-more');
      if (_overflows(host)) { menu.appendChild(only); host.classList.add('g-has-more'); }
    }
    if (!menu.children.length) host.classList.remove('g-has-more');
  }

  function decorateMenuItems(menu) {
    var items = menu.querySelectorAll('.toggle-btn, .g-menu-item');
    items.forEach(function (el) {
      if (el.classList.contains('font-size-group')) return;      /*@3.GAHJ.87*/
      if (el.querySelector(':scope > .g-menu-ico')) return;      /*@3.GAHJ.88*/
      var lab = _menuLabelOf(el);
      var ico = document.createElement('span');
      ico.className = 'g-menu-ico';
      while (el.firstChild) ico.appendChild(el.firstChild);
      el.appendChild(ico);
      if (!lab) return;
      var sp = document.createElement('span');
      sp.className = 'g-menu-label';
      sp.setAttribute('data-ar', lab.ar);
      sp.setAttribute('data-en', lab.en);
      sp.textContent = isAr() ? lab.ar : lab.en;
      el.appendChild(sp);
    });
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
    /*@3.GAHJ.89*/
    var tb = host.querySelector('[data-gh-theme]');
    if (tb) tb.title = ar ? 'الثيم' : 'Theme';
    /*@3.GAHJ.90*/
    host.querySelectorAll('[data-title-ar][data-title-en]').forEach(function (el) {
      var v = el.getAttribute(ar ? 'data-title-ar' : 'data-title-en');
      if (!v) return;
      el.title = v;
      el.setAttribute('aria-label', v);
    });
    var mb = host.querySelector('.g-more');
    if (mb) mb.title = ar ? 'المزيد' : 'More';
    host.querySelectorAll('.g-title-link').forEach(function (el) {
      el.title = ar ? 'بطاقة المادة' : 'Course card';
    });
    /*@3.GAHJ.91*/
    var lgb = host.querySelector('.g-lang');
    if (lgb) lgb.title = ar ? 'English' : 'العربية';
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
