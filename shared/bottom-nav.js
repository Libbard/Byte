;(function() {
  'use strict';

  var CATALOG_REL = 'shared/data/courses_catalog.json';
   
  var MODULES_FALLBACK = 15;
  var moduleCounts = null; 

  function init() {
    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottom-nav';

    var lang = localStorage.getItem('garden_lang') || 'ar';
    var isAr = lang === 'ar';

    var basePath = getBasePath();

    var items = [
      { page: 'home',     icon: 'fa-solid fa-house',           ar: 'الرئيسية',  en: 'Home',     href: basePath + 'index.html' },
      { page: 'semester', icon: 'fa-solid fa-graduation-cap',   ar: 'فصلي',     en: 'Semester', href: basePath + 'hub/index.html' },
      { page: 'schedule', icon: 'fa-solid fa-calendar-week',    ar: 'الجدول',    en: 'Schedule', href: basePath + 'hub/schedule.html' },
      { page: 'gpa',      icon: 'fa-solid fa-chart-line',       ar: 'المعدل',    en: 'GPA',      href: basePath + 'hub/gpa.html' }
    ];

    var currentPage = detectCurrentPage();

    items.forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'bottom-nav-item' + (item.page === currentPage ? ' active' : '');
      if (item.page === 'semester') a.setAttribute('data-nav-semester', '');
      a.innerHTML = '<i class="' + item.icon + '"></i><span class="bottom-nav-label" ' +
        'data-ar="' + item.ar + '" data-en="' + item.en + '">' + (isAr ? item.ar : item.en) + '</span>';
      nav.appendChild(a);
    });

    document.body.appendChild(nav);

     
    document.addEventListener('garden:languageChanged', relabel);

     
    loadModuleCounts(basePath).then(function() {
      refreshBadge();
    });
  }

  function relabel() {
    var ar = (localStorage.getItem('garden_lang') || 'ar') === 'ar';
    document.querySelectorAll('#bottom-nav .bottom-nav-label').forEach(function (s) {
      var v = s.getAttribute(ar ? 'data-ar' : 'data-en');
      if (v) s.textContent = v;
    });
  }

   
  function refreshBadge() {
    var n = countDueForSemester();
    if (window.GardenData && window.GardenData.tasksDueSoon) {
      try { n += window.GardenData.tasksDueSoon(); } catch (e) {}
    }
    updateDueBadge(n);
  }

   
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
        moduleCounts = {}; 
        return moduleCounts;
      });
  }

  function updateDueBadge(dueCount) {
    var a = document.querySelector('.bottom-nav [data-nav-semester]');
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

    
    var byteIndex = path.indexOf('/Byte/');
    if (byteIndex !== -1) {
      var afterByte = path.substring(byteIndex + 6); 
      var depth = afterByte.split('/').filter(function(p) { return p.length > 0 && p.indexOf('.') === -1; }).length;
      var prefix = '';
      for (var i = 0; i < depth; i++) prefix += '../';
      return prefix || './';
    }

    
    if (path.indexOf('/hub/') !== -1) return '../';
    if (path.match(/\/L\d+\//)) return '../../';
    if (path.indexOf('/others/') !== -1) return '../../';
    return './';
  }

  function detectCurrentPage() {
    var path = window.location.pathname;
    if (path.indexOf('/hub/schedule') !== -1) return 'schedule';
    if (path.indexOf('/hub/gpa') !== -1) return 'gpa';
    if (path.indexOf('/hub/') !== -1) return 'semester';
    
    if (path.endsWith('/index.html') || path.endsWith('/Byte/') || path === '/') {
      if (path.indexOf('/hub/') === -1 && !path.match(/\/L\d+\//) && path.indexOf('/others/') === -1) {
        return 'home';
      }
    }
    return '';
  }

   
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
        var key = 'garden_' + c.code + '_m' + m + '_fc'; 
        var fcRaw = localStorage.getItem(key);
        if (!fcRaw) continue;
        try {
          var data = JSON.parse(fcRaw);
          Object.values(data).forEach(function(card) { 
            if (card && typeof card === 'object' && card.nextReview && card.nextReview <= now) total++;
          });
        } catch (e) {}
      }
    });
    return total;
  }

   
  window.GardenNav = { updateDueBadge: refreshBadge };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
