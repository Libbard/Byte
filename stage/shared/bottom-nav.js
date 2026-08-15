;(function() {
  'use strict';

  var CATALOG_REL = 'shared/data/courses_catalog.json';
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
      /*@3.BONJ.6*/
      /*@3.BONJ.33*/
      { page: 'labs',     icon: 'fa-solid fa-flask',            ar: 'المختبر',   en: 'Labs',     href: basePath + 'hub/labs.html' },
      /*@3.BONJ.5*/
      { page: 'faculty',  icon: 'fa-solid fa-chalkboard-user',  ar: 'الأساتذة',  en: 'Faculty',  href: basePath + 'hub/faculty.html' },
      /*@3.BONJ.4*/
      { page: 'gpa',      icon: 'fa-solid fa-chart-line',       ar: 'المعدل',    en: 'GPA',      href: basePath + 'hub/gpa.html' },
      /*@3.BONJ.32*/
      { page: 'ratings',  icon: 'fa-solid fa-star-half-stroke', ar: 'تقييماتي',  en: 'Ratings',  href: basePath + 'hub/ratings.html' },
      { page: 'tour',     icon: 'fa-solid fa-seedling',         ar: 'اكتشف',     en: 'Explore',  href: basePath + 'tour.html' }
    ];

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
      sheet.classList.toggle('on');
      syncMore();
    });
    document.addEventListener('click', function () { sheet.classList.remove('on'); syncMore(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { sheet.classList.remove('on'); syncMore(); }
    });
    sheet.addEventListener('click', function (e) { e.stopPropagation(); });

    /*@3.BONJ.10*/
    function overflows() { return nav.scrollWidth > nav.clientWidth + 2; }

    function layoutNav() {
      if (!nav.clientWidth) return;                 /*@3.BONJ.11*/
      while (sheetIn.firstElementChild) nav.insertBefore(sheetIn.firstElementChild, moreBtn);
      nav.classList.remove('bn-has-more');
      sheet.classList.remove('on'); syncMore();

      if (overflows()) {
        nav.classList.add('bn-has-more');
        while (overflows() && nav.children.length > 2) {
          var last = moreBtn.previousElementSibling;
          if (!last) break;
          sheetIn.insertBefore(last, sheetIn.firstChild);
        }
      }
      if (sheetIn.children.length === 1) {
        var only = sheetIn.firstElementChild;
        nav.insertBefore(only, moreBtn);
        nav.classList.remove('bn-has-more');
        if (overflows()) { sheetIn.appendChild(only); nav.classList.add('bn-has-more'); }
      }
      if (!sheetIn.children.length) nav.classList.remove('bn-has-more');

      /*@3.BONJ.12*/
      moreBtn.classList.toggle('active', !!sheetIn.querySelector('.active'));
    }

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
  window.GardenNav = { updateDueBadge: refreshBadge };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
