;(function() {
  'use strict';

  var CATALOG_REL = 'shared/data/courses_catalog.json';
  var PREFS_KEY = 'dashboard_prefs';
  var PINS_KEY = 'navOrder';

  /*@3.BONJ.42*/
  function readPins() {
    if (window.GardenSideOrder) return GardenSideOrder.read();
    try {
      var p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      var v = p && (p[PINS_KEY] || p.navPins);
      return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : [];
    } catch (e) { return []; }
  }

  function writePins(list) {
    if (window.GardenSideOrder) { GardenSideOrder.write(list); return; }
    try {
      var p = null;
      try { p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null'); } catch (e2) {}
      if (!p || typeof p !== 'object') p = {};
      if (list && list.length) p[PINS_KEY] = list;
      else delete p[PINS_KEY];
      delete p.navPins;
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  function orderByPins(items) {
    if (!readPins().length) return items;
    if (window.GardenSideOrder && GardenSideOrder.sort) {
      return GardenSideOrder.sort(items, function (it) { return it.page; });
    }
    return items;
  }

  /*@3.BONJ.1*/
  var MODULES_FALLBACK = 15;
  var moduleCounts = null; /*@3.BONJ.2*/

  function init() {
    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottom-nav';

    var lang = localStorage.getItem('garden_lang') || 'ar';
    var isAr = lang === 'ar';

    var basePath = getBasePath();

    /*@3.BONJ.3*/
    var items = [
      { page: 'home',     icon: 'fa-solid fa-house',           ar: 'الرئيسية',  en: 'Home',     href: basePath + 'index.html' },
      { page: 'semester', icon: 'fa-solid fa-graduation-cap',   ar: 'فصلي',     en: 'Semester', href: basePath + 'hub/index.html' },
      { page: 'schedule', icon: 'fa-solid fa-calendar-week',    ar: 'الجدول',    en: 'Schedule', href: basePath + 'hub/schedule.html' },
      { page: 'sections', icon: 'fa-solid fa-layer-group',      ar: 'الشعب',     en: 'Sections', href: basePath + 'hub/sections.html' },
      /*@3.BONJ.35*/
      { page: 'notes',    icon: 'fa-solid fa-note-sticky',      ar: 'ملاحظاتي',  en: 'Notes',    href: basePath + 'hub/notes.html' },
      /*@3.BONJ.5*/
      /*@3.BONJ.47*/
      { page: 'faculty',  icon: 'fa-solid fa-chalkboard-user',  ar: 'الأساتذة',  en: 'Faculty',  href: basePath + 'hub/faculty.html' },
      /*@3.BONJ.6*/
      /*@3.BONJ.33*/
      { page: 'labs',     icon: 'fa-solid fa-flask',            ar: 'المختبر',   en: 'Labs',     href: basePath + 'hub/labs.html' },
      /*@3.BONJ.4*/
      { page: 'gpa',      icon: 'fa-solid fa-chart-line',       ar: 'المعدل',    en: 'GPA',      href: basePath + 'hub/gpa.html' },
      /*@3.BONJ.32*/
      { page: 'ratings',  icon: 'fa-solid fa-star-half-stroke', ar: 'تقييماتي',  en: 'Ratings',  href: basePath + 'hub/ratings.html' },
      { page: 'tour',     icon: 'fa-solid fa-seedling',         ar: 'اكتشف',     en: 'Explore',  href: basePath + 'tour.html' }
    ];

    /*@3.BONJ.34*/
    items = orderByPins(items);

    /*@3.BONJ.7*/
    var F = window.GardenFlags;
    if (F && !F.get('labs.publicNav')) {
      items = items.filter(function (it) { return it.page !== 'labs'; });
    }

    var currentPage = detectCurrentPage();

    items.forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'bottom-nav-item' + (item.page === currentPage ? ' active' : '');
      a.setAttribute('data-bn-page', item.page);
      if (item.page === 'semester') a.setAttribute('data-nav-semester', '');
      a.innerHTML = '<i class="' + item.icon + '"></i>' +
        '<span class="bottom-nav-label" data-ar="' + item.ar + '" data-en="' + item.en + '">' +
        (isAr ? item.ar : item.en) + '</span>';
      nav.appendChild(a);
    });

    /*@3.BONJ.8*/
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.id = 'bn-more';
    moreBtn.className = 'bottom-nav-item bn-more-item';
    moreBtn.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
    moreBtn.setAttribute('data-ar-label', 'المزيد');
    moreBtn.setAttribute('data-en-label', 'More');
    moreBtn.setAttribute('aria-label', isAr ? 'المزيد' : 'More');
    moreBtn.setAttribute('aria-expanded', 'false');
    nav.appendChild(moreBtn);

    document.body.appendChild(nav);

    /*@3.BONJ.9*/
    var sheet = document.createElement('div');
    sheet.className = 'bn-sheet';
    sheet.innerHTML = '<div class="bn-sheet-in"></div>';
    document.body.appendChild(sheet);
    var sheetIn = sheet.querySelector('.bn-sheet-in');

    var syncMore = function () {
      moreBtn.setAttribute('aria-expanded', sheet.classList.contains('on') ? 'true' : 'false');
    };
    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      /*@3.BONJ.40*/
      if (editing) { setEdit(false); return; }
      sheet.classList.toggle('on');
      syncMore();
    });
    document.addEventListener('click', function () {
      if (armed) return;
      if (editing) { setEdit(false); return; }
      sheet.classList.remove('on'); syncMore();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (editing) { setEdit(false); return; }
      sheet.classList.remove('on'); syncMore();
    });
    sheet.addEventListener('click', function (e) { e.stopPropagation(); });

    /*@3.BONJ.10*/
    function overflows() { return nav.scrollWidth > nav.clientWidth + 2; }

    function layoutNav() {
      if (!nav.clientWidth) return;                 /*@3.BONJ.11*/
      var moved;
      while ((moved = sheetIn.querySelector('[data-bn-page]'))) nav.insertBefore(moved, moreBtn);
      if (!editing) { sheet.classList.remove('on'); syncMore(); }

      if (overflows()) {
        while (overflows() && nav.querySelectorAll('[data-bn-page]').length > 1) {
          var last = moreBtn.previousElementSibling;
          if (!last || !last.hasAttribute('data-bn-page')) break;
          sheetIn.insertBefore(last, sheetIn.firstChild);
        }
      }

      /*@3.BONJ.12*/
      moreBtn.classList.toggle('active', !!sheetIn.querySelector('.active'));
      syncPinBtns();
      syncHint();
      if (editRow) sheetIn.appendChild(editRow);
      nav.classList.add('bn-has-more');
    }

    /*@3.BONJ.36*/
    var editing = false, armed = false;

    function applyPins() {
      if (!readPins().length) return;
      if (!(window.GardenSideOrder && GardenSideOrder.sort)) return;
      var all = [].slice.call(nav.querySelectorAll('[data-bn-page]'))
        .concat([].slice.call(sheetIn.querySelectorAll('[data-bn-page]')));
      GardenSideOrder.sort(all, function (a) { return a.getAttribute('data-bn-page'); })
        .forEach(function (a) { nav.insertBefore(a, moreBtn); });
      layoutNav();
    }

    /*@3.BONJ.38*/
    function fullOrder() {
      return [].slice.call(nav.querySelectorAll('[data-bn-page]'))
        .concat([].slice.call(sheetIn.querySelectorAll('[data-bn-page]')))
        .map(function (a) { return a.getAttribute('data-bn-page'); });
    }
    function commitOrder() {
      /*@3.BONJ.46*/
      var seq = fullOrder(), seen = {};
      seq.forEach(function (k) { seen[k] = 1; });
      readPins().forEach(function (k) { if (!seen[k]) { seen[k] = 1; seq.push(k); } });
      writePins(seq);
    }

    /*@3.BONJ.37*/
    function moveItem(a, toBar) {
      if (toBar) {
        var bar = nav.querySelectorAll('[data-bn-page]');
        nav.insertBefore(a, bar.length ? bar[bar.length - 1] : moreBtn);
      } else {
        sheetIn.appendChild(a);
      }
      layoutNav();
      commitOrder();
    }

    /*@3.BONJ.39*/
    var gdo = window.GardenDragOrder && window.GardenDragOrder(nav, {
      sel: '[data-bn-page]',
      axis: 'x',
      enabled: function () { return editing; },
      onDrop: function () { layoutNav(); commitOrder(); }
    });
    function swallowed() { return !!(gdo && gdo.swallowed()); }

    function syncPinBtns() {
      [].slice.call(document.querySelectorAll('[data-bn-page]')).forEach(function (a) {
        var inBar = a.parentElement === nav;
        var b = a.querySelector('.bn-pin');
        if (!b) {
          b = document.createElement('span');
          b.className = 'bn-pin';
          b.setAttribute('aria-hidden', 'true');
          a.appendChild(b);
        }
        b.innerHTML = '<i class="fa-solid ' + (inBar ? 'fa-minus' : 'fa-plus') + '"></i>';
      });
    }

    function setEdit(on) {
      editing = !!on;
      nav.classList.toggle('bn-edit', editing);
      sheet.classList.toggle('bn-edit', editing);
      if (editRow) {
        editRow.setAttribute('aria-pressed', editing ? 'true' : 'false');
        var lbl = editRow.querySelector('span');
        if (lbl) lbl.textContent = editing
          ? (isArNow() ? 'تمّ' : 'Done')
          : (isArNow() ? 'رتّبِ الأيقونات' : 'Arrange icons');
      }
      if (editing) sheet.classList.add('on'); else sheet.classList.remove('on');
      syncHint();
      syncMore();
    }

    function isArNow() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }

    /*@3.BONJ.41*/
    var hint = document.createElement('div');
    hint.className = 'bn-hint';
    function paintHint() {
      hint.textContent = isArNow()
        ? 'اسحبِ الأيقونةَ لترتيبِها · واضغطْ عليها لنقلِها'
        : 'Drag an icon to reorder \u00b7 tap it to move it';
    }
    paintHint();
    document.addEventListener('garden:languageChanged', paintHint);
    function syncHint() {
      if (editing) sheetIn.insertBefore(hint, sheetIn.firstChild);
      else if (hint.parentElement) hint.remove();
    }

    var editRow = document.createElement('button');
    editRow.type = 'button';
    editRow.className = 'bottom-nav-item bn-edit-row';
    editRow.setAttribute('aria-pressed', 'false');
    editRow.innerHTML = '<i class="fa-solid fa-sliders"></i><span class="bottom-nav-label">' +
      (isArNow() ? 'رتّبِ الأيقونات' : 'Arrange icons') + '</span>';
    editRow.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      setEdit(!editing);
    });

    document.addEventListener('click', function (e) {
      if (!editing) return;
      var a = e.target.closest && e.target.closest('[data-bn-page]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      if (swallowed()) return;
      moveItem(a, a.parentElement !== nav);
      setEdit(true);
    }, true);

    var _lt = null, _ro = null;
    function relayoutNav() { clearTimeout(_lt); _lt = setTimeout(layoutNav, 60); }
    layoutNav();
    window.addEventListener('resize', relayoutNav);
    /*@3.BONJ.13*/
    if (window.ResizeObserver) { try { _ro = new ResizeObserver(relayoutNav); _ro.observe(nav); } catch (e) {} }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutNav).catch(function () {});
    document.addEventListener('garden:languageChanged', relayoutNav);

    /*@3.BONJ.14*/
    document.addEventListener('garden:languageChanged', relabel);
    window.GardenNav.setArrange = function (on) {
      if (!on) { setEdit(false); return; }
      /*@3.BONJ.44*/
      if (getComputedStyle(nav).display === 'none') return;
      /*@3.BONJ.45*/
      armed = true;
      setTimeout(function () { armed = false; }, 0);
      setEdit(true);
    };
    document.addEventListener('garden:navOrderChanged', function () {
      applyPins();
    });

    /*@3.BONJ.15*/
    loadModuleCounts(basePath).then(function() {
      refreshBadge();
    });
  }

  function relabel() {
    var ar = (localStorage.getItem('garden_lang') || 'ar') === 'ar';
    document.querySelectorAll('#bottom-nav .bottom-nav-label, .bn-sheet [data-ar]')
      .forEach(function (s) {
        var v = s.getAttribute(ar ? 'data-ar' : 'data-en');
        if (v) s.textContent = v;
      });
    /*@3.BONJ.16*/
    document.querySelectorAll('#bottom-nav .bn-more-item').forEach(function (b) {
      var v = b.getAttribute(ar ? 'data-ar-label' : 'data-en-label');
      if (v) b.setAttribute('aria-label', v);
    });
  }

  /*@3.BONJ.17*/
  function refreshBadge() {
    var n = countDueForSemester();
    if (window.GardenData && window.GardenData.tasksDueSoon) {
      try { n += window.GardenData.tasksDueSoon(); } catch (e) {}
    }
    updateDueBadge(n);
  }

  /*@3.BONJ.18*/
  function loadModuleCounts(basePath) {
    if (moduleCounts) return Promise.resolve(moduleCounts);
    return fetch(basePath + CATALOG_REL)
      .then(function(res) { return res.json(); })
      .then(function(j) {
        moduleCounts = {};
        (j.courses || []).forEach(function(c) {
          if (c && c.code && typeof c.modules === 'number') moduleCounts[c.code] = c.modules;
        });
        return moduleCounts;
      })
      .catch(function() {
        moduleCounts = {}; /*@3.BONJ.19*/
        return moduleCounts;
      });
  }

  function updateDueBadge(dueCount) {
    /*@3.BONJ.20*/
    var a = document.querySelector('[data-nav-semester]');
    if (!a) return;
    var dot = a.querySelector('.bottom-nav-dot');
    if (dueCount > 0) {
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'bottom-nav-dot';
        a.appendChild(dot);
      }
      dot.textContent = dueCount > 99 ? '99+' : String(dueCount);
    } else if (dot) {
      dot.remove();
    }
  }

  function getBasePath() {
    var path = window.location.pathname;

    /*@3.BONJ.21*/
    /*@3.BONJ.23*/
    if (path.indexOf('/hub/') !== -1) return '../';
    /*@3.BONJ.24*/
    if (path.indexOf('/labs/') !== -1) return '../';
    if (path.match(/\/L\d+\//)) return '../../';
    if (path.indexOf('/others/') !== -1) return '../../';
    return './';
  }

  function detectCurrentPage() {
    var path = window.location.pathname;
    if (path.indexOf('/hub/schedule') !== -1) return 'schedule';
    if (path.indexOf('/hub/sections') !== -1) return 'sections';
    if (path.indexOf('/hub/gpa') !== -1) return 'gpa';
    /*@3.BONJ.25*/
    if (path.indexOf('/hub/labs') !== -1 || path.indexOf('/labs/') !== -1) return 'labs';
    /*@3.BONJ.26*/
    if (path.indexOf('/hub/faculty') !== -1) return 'faculty';
    if (path.indexOf('/hub/ratings') !== -1) return 'ratings';
    if (path.indexOf('/tour') !== -1) return 'tour';
    if (path.indexOf('/hub/') !== -1) return 'semester';
    /*@3.BONJ.27*/
    if (path.endsWith('/index.html') || path.endsWith('/')) {
      if (path.indexOf('/hub/') === -1 && !path.match(/\/L\d+\//) && path.indexOf('/others/') === -1) {
        return 'home';
      }
    }
    return '';
  }

  /*@3.BONJ.28*/
  function countDueForSemester() {
    if (window.GardenData && window.GardenData.dueForSemester) {
      try { return window.GardenData.dueForSemester(); } catch (e) {}
    }
    var raw;
    try { raw = localStorage.getItem('my_semester'); } catch (e) { return 0; }
    if (!raw) return 0;
    var sem;
    try { sem = JSON.parse(raw); } catch (e) { return 0; }
    if (!sem || !sem.courses) return 0;

    var now = Date.now();
    var total = 0;
    sem.courses.forEach(function(c) {
      if (!c.code || String(c.code).indexOf('__CUSTOM_') === 0) return;
      if (String(c.code).indexOf('__MANUAL_') === 0) return;
      if (c.completed) return;
      var maxModule = (moduleCounts && moduleCounts[c.code]) || MODULES_FALLBACK;
      for (var m = 1; m <= maxModule; m++) {
        var key = 'garden_' + c.code + '_m' + m + '_fc'; /*@3.BONJ.29*/
        var fcRaw = localStorage.getItem(key);
        if (!fcRaw) continue;
        try {
          var data = JSON.parse(fcRaw);
          Object.values(data).forEach(function(card) { /*@3.BONJ.30*/
            if (card && typeof card === 'object' && card.nextReview && card.nextReview <= now) total++;
          });
        } catch (e) {}
      }
    });
    return total;
  }

  /*@3.BONJ.31*/
  /*@3.BONJ.43*/
  window.GardenNav = { updateDueBadge: refreshBadge, setArrange: function () {} };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
