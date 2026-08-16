/*@3.SETJ.1*/

(function () {
  'use strict';

  var PROF = 'student_profile';
  var PREFS = 'dashboard_prefs';
  var PL_KEY = 'sx_plans', PL_VER = 3, PL_TTL = 30 * 24 * 3600 * 1000;
  var SYNC_TS_PREFIX = '__syncT_';
  var MAX_LEVEL = 12;                 /*@3.SETJ.2*/
  var STORE_BUDGET = 5 * 1024 * 1024; /*@3.SETJ.3*/

  var WIDGETS = [
    { id: 'welcome',   ar: 'ترحيب',          en: 'Welcome' },
    { id: 'semester',  ar: 'تقدّم الفصل',     en: 'Semester progress' },
    { id: 'gpa',       ar: 'المعدل',          en: 'GPA' },
    { id: 'today',     ar: 'اليوم',           en: 'Today' },
    { id: 'due',       ar: 'مستحقات',         en: 'Due cards' },
    { id: 'tasks',     ar: 'المهام',          en: 'Tasks' },
    { id: 'notes',     ar: 'ملاحظات سريعة',   en: 'Quick notes' },
    { id: 'community', ar: 'مجتمع الكلية',    en: 'College community' }
  ];

  var KEYS = [
    { k: 'Ctrl K', ar: 'البحث الشامل',   en: 'Global search' },
    { k: 'Ctrl B', ar: 'طيّ الشريط',      en: 'Collapse sidebar' },
    { k: 'T',      ar: 'تبديل الثيم',     en: 'Cycle theme' },
    { k: 'Esc',    ar: 'إغلاق المفتوح',   en: 'Close what is open' }
  ];

  var PLANS = null;

  /*@3.SETJ.4*/

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(a, e) { return isAr() ? a : e; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function readJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /*@3.SETJ.5*/
  function normQ(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/\s+/g, ' ').trim();
  }

  var toastT = null;
  function toast(msg) {
    var t = $('#set-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function saved() { toast(L('حُفظ', 'Saved')); }

  /*@3.SETJ.6*/

  var menuKey = null;
  var menuPlace = null;
  function closeMenu() {
    if (menuKey) { document.removeEventListener('keydown', menuKey, true); menuKey = null; }
    menuPlace = null;
    var m = $('#set-menu');
    if (m) {
      var owner = m.getAttribute('data-owner');
      var b = owner && document.getElementById(owner);
      if (b) b.setAttribute('aria-expanded', 'false');
      m.remove();
    }
  }

  /*@3.SETJ.7*/
  function openMenu(btn, items, onPick, opts) {
    opts = opts || {};
    closeMenu();
    var sheet = !!opts.search && window.innerWidth <= 620;

    var m = document.createElement('div');
    m.className = 'set-menu' + (opts.wide ? ' set-menu--wide' : '') + (sheet ? ' set-menu--sheet' : '');
    m.id = 'set-menu';
    if (btn.id) m.setAttribute('data-owner', btn.id);
    m.setAttribute('role', 'dialog');

    var head = opts.search
      ? '<div class="set-menu-head"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input class="set-menu-q" id="set-menu-q" type="search" autocomplete="off" spellcheck="false" ' +
        'placeholder="' + esc(opts.search) + '" aria-label="' + esc(opts.search) + '"></div>'
      : '';
    m.innerHTML = head + '<div class="set-menu-list" role="listbox"></div>';
    document.body.appendChild(m);
    btn.setAttribute('aria-expanded', 'true');

    var list = $('.set-menu-list', m), q = $('#set-menu-q', m), ai = -1;

    function hay(it) {
      if (it._h == null) it._h = normQ(it.k + ' ' + (it.d || ''));
      return it._h;
    }
    function draw(filtered) {
      if (!filtered.length) {
        list.innerHTML = '<div class="set-menu-none">' + esc(L('لا نتائج', 'No matches')) + '</div>';
        ai = -1; return;
      }
      list.innerHTML = filtered.map(function (it, i) {
        return '<button class="set-menu-opt' + (it.on ? ' is-on' : '') + '" type="button" role="option" ' +
          'aria-selected="' + (it.on ? 'true' : 'false') + '" data-v="' + esc(it.v) + '" data-i="' + i + '">' +
          '<i class="fa-solid fa-check" aria-hidden="true"></i>' +
          '<span class="set-menu-opt-k">' + esc(it.k) + '</span>' +
          (it.d ? '<span class="set-menu-opt-d">' + esc(it.d) + '</span>' : '') +
          '</button>';
      }).join('');
      ai = -1;
      var on = filtered.map(function (x) { return !!x.on; }).indexOf(true);
      if (on >= 0) setActive(on, false);
    }
    function setActive(i, scroll) {
      var opts2 = $$('.set-menu-opt', list);
      if (!opts2.length) return;
      i = Math.max(0, Math.min(opts2.length - 1, i));
      opts2.forEach(function (o) { o.classList.remove('is-active'); });
      opts2[i].classList.add('is-active');
      ai = i;
      if (scroll !== false) opts2[i].scrollIntoView({ block: 'nearest' });
    }
    function pick(v) { closeMenu(); onPick(v); }

    draw(items);

    function placeMenu() {
      if (sheet) return true;
      var vv = window.visualViewport;
      var vh = (vv && vv.height) ? vv.height : window.innerHeight;
      var vw = (vv && vv.width) ? vv.width : window.innerWidth;
      var r = btn.getBoundingClientRect(), mr = m.getBoundingClientRect();
      if (!document.body.contains(btn) || r.bottom <= 0 || r.top >= vh) return false;
      var top = r.bottom + 6;
      if (top + mr.height > vh - 8) top = Math.max(8, r.top - mr.height - 6);
      var startInline = r.left;
      if (startInline + mr.width > vw - 8) startInline = Math.max(8, vw - 8 - mr.width);
      m.style.top = top + 'px';
      m.style.left = startInline + 'px';
      return true;
    }
    placeMenu();
    menuPlace = placeMenu;

    list.addEventListener('click', function (e) {
      var o = e.target.closest('.set-menu-opt');
      if (o) pick(o.getAttribute('data-v'));
    });

    if (q) {
      q.addEventListener('input', function () {
        var terms = normQ(q.value).split(' ').filter(Boolean);
        draw(!terms.length ? items : items.filter(function (it) {
          var h = hay(it);
          return terms.every(function (t) { return h.indexOf(t) >= 0; });
        }));
      });
      /*@3.SETJ.8*/
      setTimeout(function () { q.focus(); }, 20);
    }

    menuKey = function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeMenu(); btn.focus(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(ai + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(ai - 1); return; }
      /*@3.SETJ.9*/
      if ((e.key === 'Home' || e.key === 'End') && document.activeElement !== q) {
        e.preventDefault(); setActive(e.key === 'Home' ? 0 : 1e9); return;
      }
      if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        var cur = $$('.set-menu-opt', list)[ai];
        if (cur) pick(cur.getAttribute('data-v'));
      }
    };
    document.addEventListener('keydown', menuKey, true);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-menu]');
    if (b) { e.preventDefault(); onMenuBtn(b); return; }
    if (!e.target.closest('#set-menu')) closeMenu();
  });
  /*@3.SETJ.36*/
  function reflowMenu(e) {
    if (!menuPlace) return;
    if (e && e.target && e.target.closest && e.target.closest('#set-menu')) return;
    if (!menuPlace()) closeMenu();
  }
  window.addEventListener('resize', reflowMenu);
  window.addEventListener('scroll', reflowMenu, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', reflowMenu);
    window.visualViewport.addEventListener('scroll', reflowMenu);
  }

  /*@3.SETJ.10*/

  function prof() { return readJSON(PROF, {}) || {}; }
  function saveProf(p) { writeJSON(PROF, p); }

  function plansFromCache() {
    try {
      var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null');
      if (!v || !v.d || v.v !== PL_VER) return null;
      return Array.isArray(v.d) ? v.d : (v.d.programs || null);
    } catch (e) { return null; }
  }
  function cacheAge() {
    try { var v = JSON.parse(localStorage.getItem(PL_KEY) || 'null'); return v ? Date.now() - v.t : Infinity; }
    catch (e) { return Infinity; }
  }
  function loadPlans(cb) {
    PLANS = PLANS || plansFromCache();
    var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
    if (!API || (PLANS && cacheAge() < PL_TTL)) return cb(!!PLANS);
    /*@3.SETJ.11*/
    fetch(API + '/v1/plans?r=' + PL_VER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.programs) {
          PLANS = d.programs;
          try { localStorage.setItem(PL_KEY, JSON.stringify({ t: Date.now(), v: PL_VER, d: d })); } catch (e) {}
        }
        cb(!!PLANS);
      })
      .catch(function () { cb(!!PLANS); });
  }
  function progLabel(p) {
    var n = isAr() ? (p.name_ar || p.name_en || p.slug) : (p.name_en || p.name_ar || p.slug);
    n = String(n)
      .replace(/^\s*برنامج\s+/, '')
      .replace(/^\s*(البكالوريوس|البكالوريس|بكالوريوس(\s+العلوم)?)\s+(في\s+)?/, '')
      .replace(/^\s*(الماجستير|ماجستير)\s+(في\s+)?/, '')
      .replace(/^\s*(Bachelor|Master)(\s+of|\s+in)?(\s+Science)?(\s+in)?\s+/i, '')
      .replace(/\s*Program\s*$/i, '')
      .replace(/^\s*-\s*/, '').trim();
    n = n.split(/\s+[-–—]\s+/).pop().trim()
         .replace(/^\s*تخصّ?ص\s+/, '')
         .replace(/^\s*Major\s+in\s+/i, '').trim();
    return n || p.slug;
  }
  function progOf(slug) {
    if (!PLANS || !slug) return null;
    for (var i = 0; i < PLANS.length; i++) if (PLANS[i].slug === slug) return PLANS[i];
    return null;
  }

  /*@3.SETJ.12*/
  function levelCap() {
    var pr = progOf(prof().program);
    if (!pr || !pr.courses || !pr.courses.length) return 8;
    var mx = 0;
    pr.courses.forEach(function (c) {
      var l = parseInt(c.l != null ? c.l : c.level, 10);
      if (l > mx && l <= MAX_LEVEL) mx = l;
    });
    return mx || 8;
  }

  function setPick(btn, label, empty) {
    var s = btn.querySelector('span');
    s.textContent = label;
    btn.classList.toggle('is-empty', !!empty);
  }

  function fillProfile() {
    var p = prof();
    var pn = window.GardenBiName ? window.GardenBiName.read(p) : { ar: p.name || '', en: '' };
    var ar = $('#p-name-ar'), en = $('#p-name-en');
    if (ar) ar.value = pn.ar || '';
    if (en) en.value = pn.en || '';
    if (window.GardenBiName && ar && en && !ar.dataset.biBound) {
      ar.dataset.biBound = '1';
      window.GardenBiName.attach({ ar: ar, en: en, suggest: false });
    }

    var pr = progOf(p.program);
    setPick($('#p-prog'),
      pr ? progLabel(pr) : (p.program ? p.program : L('— لم يُحدَّد —', '— not set —')),
      !p.program);

    var lv = parseInt(p.level, 10);
    setPick($('#p-level'),
      lv ? L('المستوى ' + lv, 'Level ' + lv) : L('— لم يُحدَّد —', '— not set —'), !lv);

    setPick($('#p-year'),
      p.start_year ? String(p.start_year) : L('— لم تُحدَّد —', '— not set —'), !p.start_year);
  }

  function saveName() {
    var p = prof();
    var ar = $('#p-name-ar').value, en = $('#p-name-en').value;
    var v = window.GardenBiName ? window.GardenBiName.resolve(ar, en) : null;
    if (v) { p.name = v.name; p.name_ar = v.name_ar; p.name_en = v.name_en; }
    else if (!ar && !en) { p.name = ''; p.name_ar = ''; p.name_en = ''; }
    else { p.name = ar || en; p.name_ar = ar || en; p.name_en = en || ar; }
    saveProf(p);
    saved();
  }

  /*@3.SETJ.13*/
  function setLevel(v) {
    var p = prof();
    var n = parseInt(v, 10);
    if (n) { p.level = String(n); p.levels = [String(n)]; }
    else { p.level = ''; delete p.levels; }
    saveProf(p);
    fillProfile();
    saved();
  }

  function onMenuBtn(btn) {
    if ($('#set-menu') && $('#set-menu').getAttribute('data-owner') === btn.id) { closeMenu(); return; }
    var kind = btn.getAttribute('data-menu'), p = prof();

    if (kind === 'prog') {
      if (!PLANS) {
        setPick(btn, L('جارٍ جلب خطط الجامعة…', 'Fetching plans…'), true);
        return loadPlans(function (ok) {
          fillProfile();
          if (!ok) return toast(L('تعذّر جلب خطط الجامعة — تحقّق من اتصالك', 'Could not fetch the plans — check your connection'));
          onMenuBtn(btn);
        });
      }
      var items = [{ v: '', k: L('— بلا برنامج —', '— no programme —'), d: '', on: !p.program }];
      PLANS.forEach(function (pr) {
        items.push({
          v: pr.slug, k: progLabel(pr),
          d: (isAr() ? (pr.college_ar || pr.college_en) : (pr.college_en || pr.college_ar)) || '',
          on: p.program === pr.slug
        });
      });
      return openMenu(btn, items, function (v) {
        var q = prof();
        if (v) q.program = v; else delete q.program;
        saveProf(q);
        fillProfile();
        saved();
      }, { search: L('ابحث باسم البرنامج أو كليّته…', 'Search by programme or college…'), wide: true });
    }

    if (kind === 'level') {
      var cap = levelCap(), cur = parseInt(p.level, 10) || 0;
      var ls = [{ v: '', k: L('— لم يُحدَّد —', '— not set —'), on: !cur }];
      for (var i = 1; i <= cap; i++) {
        ls.push({ v: String(i), k: L('المستوى ' + i, 'Level ' + i), on: cur === i });
      }
      return openMenu(btn, ls, setLevel);
    }

    if (kind === 'year') {
      var now = new Date().getFullYear();
      var ys = [{ v: '', k: L('— لم تُحدَّد —', '— not set —'), on: !p.start_year }];
      for (var y = now; y >= now - 12; y--) {
        ys.push({ v: String(y), k: String(y), on: String(p.start_year) === String(y) });
      }
      return openMenu(btn, ys, function (v) {
        var q = prof();
        if (v) q.start_year = v; else delete q.start_year;
        saveProf(q);
        fillProfile();
        saved();
      });
    }
  }

  /*@3.SETJ.14*/

  var FONTS = ['xs', 'sm', 'md', 'lg', 'xl'];
  var FONT_PV = { xs: '.85rem', sm: '.92rem', md: '1rem', lg: '1.12rem', xl: '1.26rem' };

  function segSet(host, v) {
    $$('button', host).forEach(function (b) {
      var on = b.getAttribute('data-v') === v;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function swSet(el, on) { if (el) el.setAttribute('aria-checked', on ? 'true' : 'false'); }
  function swOn(el) { return el && el.getAttribute('aria-checked') === 'true'; }

  function fillLook() {
    var th = localStorage.getItem('garden_theme') || 'dark';
    $$('.set-theme', $('#p-themes')).forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-v') === th);
      b.setAttribute('aria-pressed', b.getAttribute('data-v') === th ? 'true' : 'false');
    });

    var fs = localStorage.getItem('garden_font_size') || 'md';
    if (FONTS.indexOf(fs) === -1) fs = 'md';
    segSet($('#p-font'), fs);
    $('#p-fsample').style.setProperty('--fs-preview', FONT_PV[fs]);

    segSet($('#p-lang'), isAr() ? 'ar' : 'en');
    swSet($('#p-sidebar'), document.documentElement.classList.contains('sb-collapsed'));
    swSet($('#p-3d'), localStorage.getItem('garden_mobile_3d') !== '0');
  }

  function bindLook() {
    $('#p-themes').addEventListener('click', function (e) {
      var b = e.target.closest('.set-theme');
      if (!b) return;
      if (window.Garden && Garden.applyTheme) Garden.applyTheme(b.getAttribute('data-v'));
      else {
        localStorage.setItem('garden_theme', b.getAttribute('data-v'));
        document.documentElement.setAttribute('data-theme', b.getAttribute('data-v'));
      }
      fillLook();
    });

    $('#p-font').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var v = b.getAttribute('data-v');
      if (window.Garden && Garden.setFontSize) Garden.setFontSize(v);
      else {
        localStorage.setItem('garden_font_size', v);
        document.documentElement.setAttribute('data-font-size', v);
      }
      fillLook();
    });

    $('#p-lang').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var v = b.getAttribute('data-v');
      if (v === (isAr() ? 'ar' : 'en')) return;
      if (window.Garden && Garden.setLanguage) Garden.setLanguage(v);
      fillLook();
    });

    /*@3.SETJ.15*/
    $('#p-sidebar').addEventListener('click', function () {
      var on = !swOn($('#p-sidebar'));
      document.documentElement.classList.toggle('sb-collapsed', on);
      try { localStorage.setItem('garden_sidebar', on ? 'collapsed' : 'expanded'); } catch (e) {}
      window.dispatchEvent(new Event('resize'));
      swSet($('#p-sidebar'), on);
    });

    $('#p-3d').addEventListener('click', function () {
      var on = !swOn($('#p-3d'));
      if (window.Garden && Garden.toggle3D) Garden.toggle3D(on);
      else { try { localStorage.setItem('garden_mobile_3d', on ? '1' : '0'); } catch (e) {} }
      swSet($('#p-3d'), on);
    });
  }

  /*@3.SETJ.16*/

  /*@3.SETJ.17*/
  var syncPanel = null;
  function fillSync() {
    var host = $('#sync-panel-host');
    if (!host || !window.GardenSyncPanel) return;
    if (syncPanel && syncPanel.destroy) syncPanel.destroy();
    syncPanel = window.GardenSyncPanel.mount(host, { allowSkip: false });
  }


  /*@3.SETJ.18*/

  function prefs() {
    var p = readJSON(PREFS, {}) || {};
    if (!p.hidden || typeof p.hidden !== 'object') p.hidden = {};
    return p;
  }
  function savePrefs(p) { writeJSON(PREFS, p); }

  function fillStudy() {
    var dn = parseInt(localStorage.getItem('garden_daily_new_limit'), 10);
    if (!(dn > 0)) dn = 10;
    $('#p-daily').textContent = dn;
    $('[data-act="dn-minus"]').disabled = dn <= 5;
    $('[data-act="dn-plus"]').disabled = dn >= 50;

    var pf = prefs();
    swSet($('#p-hidedone'), !!pf.hideCompletedLevels);
    swSet($('#p-hidelv'), !!pf.hideLevelsSection);

    $('#p-widgets').innerHTML = WIDGETS.map(function (w) {
      var on = !pf.hidden[w.id];
      return '<button class="set-check' + (on ? ' is-on' : '') + '" type="button" data-w="' + w.id + '" ' +
        'aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="set-check-box"><i class="fa-solid fa-check"></i></span>' +
        '<span>' + esc(L(w.ar, w.en)) + '</span></button>';
    }).join('');
  }

  function bindStudy() {
    $('#p-widgets').addEventListener('click', function (e) {
      var b = e.target.closest('.set-check');
      if (!b) return;
      var pf = prefs(), id = b.getAttribute('data-w');
      if (pf.hidden[id]) delete pf.hidden[id]; else pf.hidden[id] = true;
      savePrefs(pf);
      fillStudy();
    });
    $('#p-hidedone').addEventListener('click', function () {
      var pf = prefs(); pf.hideCompletedLevels = !pf.hideCompletedLevels;
      savePrefs(pf); swSet($('#p-hidedone'), pf.hideCompletedLevels);
    });
    $('#p-hidelv').addEventListener('click', function () {
      var pf = prefs(); pf.hideLevelsSection = !pf.hideLevelsSection;
      savePrefs(pf); swSet($('#p-hidelv'), pf.hideLevelsSection);
    });
  }

  function bumpDaily(d) {
    var cur = parseInt(localStorage.getItem('garden_daily_new_limit'), 10);
    if (!(cur > 0)) cur = 10;
    var next = Math.max(5, Math.min(50, cur + d));
    try { localStorage.setItem('garden_daily_new_limit', String(next)); } catch (e) {}
    fillStudy();
  }

  /*@3.SETJ.19*/

  function storeBytes() {
    var n = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      n += (k.length + (localStorage.getItem(k) || '').length) * 2;   /*@3.SETJ.20*/
    }
    return n;
  }
  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
  function fillStore() {
    var b = storeBytes(), pct = Math.min(100, b / STORE_BUDGET * 100);
    $('#p-store-n').textContent = fmtSize(b) + ' / ' + fmtSize(STORE_BUDGET);
    var f = $('#p-store-f');
    f.style.width = Math.max(1.5, pct) + '%';
    f.setAttribute('data-lvl', pct > 85 ? 'bad' : pct > 60 ? 'warn' : 'ok');
  }

  /*@3.SETJ.21*/
  function exportData() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(SYNC_TS_PREFIX) === 0) continue;
      out[k] = localStorage.getItem(k);
    }
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'digital-garden-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast(L('نزّلت نسختك', 'Backup downloaded'));
  }

  function importData(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var data;
      try { data = JSON.parse(fr.result); } catch (e) { data = null; }
      if (!data || typeof data !== 'object') return toast(L('ملفٌّ غير صالح', 'Invalid file'));
      var n = Object.keys(data).length;
      if (!window.confirm(L(
        'ستُستبدل بياناتُ هذا الجهاز بـ' + n + ' مدخلةً من الملف. لا رجعةَ إلا بنسخةٍ أخرى — أمتابعٌ؟',
        n + ' entries from the file will replace this device’s data. Only another backup can undo it — continue?'
      ))) return;
      Object.keys(data).forEach(function (k) {
        try { localStorage.setItem(k, data[k]); } catch (e) {}
      });
      toast(L('استُوردت — يُعاد التحميل', 'Imported — reloading'));
      setTimeout(function () { location.reload(); }, 900);
    };
    fr.readAsText(file);
  }

  /*@3.SETJ.22*/
  var wipeArmed = 0;
  function onWipe(btn) {
    if (Date.now() - wipeArmed < 5000) {
      var keep = {};
      /*@3.SETJ.23*/
      /*@3.SETJ.37*/
      ['garden_sync_key', 'garden_vault_secret', 'garden_device_id',
       'garden_recovery_set', 'garden_theme', 'garden_lang'].forEach(function (k) {
        var v = localStorage.getItem(k); if (v != null) keep[k] = v;
      });
      /*@3.SETJ.38*/
      for (var wi = 0; wi < localStorage.length; wi++) {
        var wk = localStorage.key(wi);
        if (wk && (wk.indexOf('garden_vault_tok:') === 0 || wk.indexOf('garden_vault_docid:') === 0)) {
          keep[wk] = localStorage.getItem(wk);
        }
      }
      localStorage.clear();
      Object.keys(keep).forEach(function (k) { localStorage.setItem(k, keep[k]); });
      toast(L('مُحيت — يُعاد التحميل', 'Erased — reloading'));
      setTimeout(function () { location.reload(); }, 900);
      return;
    }
    wipeArmed = Date.now();
    var sp = btn.querySelector('span'), old = sp.textContent;
    btn.classList.add('is-armed');
    sp.textContent = L('اضغط ثانيةً للتأكيد', 'Press again to confirm');
    setTimeout(function () {
      if (Date.now() - wipeArmed >= 5000) { sp.textContent = old; btn.classList.remove('is-armed'); }
    }, 5100);
  }

  function fillLegacy() {
    var box = $('#p-legacy'), row = $('#p-legacy-row');
    if (!box || !window.ByteLegacy) return;
    window.ByteLegacy.mount(box, { hideHost: row, toast: toast, onWipe: fillStore });
  }

  /*@3.SETJ.24*/

  function fillAbout() {
    $('#a-keys').innerHTML = KEYS.map(function (k) {
      return '<span class="set-check"><code class="set-key">' + esc(k.k) + '</code>' +
        '<span>' + esc(L(k.ar, k.en)) + '</span></span>';
    }).join('');

    var dot = $('#a-dot'), ver = $('#a-ver');
    if (!('caches' in window)) { ver.textContent = L('لا نسخة محفوظة', 'No offline copy'); return; }
    caches.keys().then(function (ks) {
      /*@3.SETJ.39*/
      var mine = ks.filter(function (k) { return k.indexOf('garden') > -1; });
      if (!mine.length) { ver.textContent = L('لم تُحفظ بعد', 'Not stored yet'); return; }
      ver.classList.add('ltr');
      if (navigator.serviceWorker && navigator.serviceWorker.controller) dot.classList.add('is-on');
      return caches.open(mine[0]).then(function (c) {
        return c.keys().then(function (rs) {
          var k = rs.filter(function (r) { return r.url.indexOf('__precache-state__') > -1; })[0];
          return k ? c.match(k) : null;
        });
      }).then(function (r) { return r ? r.json() : null; })
        .then(function (st) { ver.textContent = (st && st.version) || mine[0]; })
        .catch(function () { ver.textContent = mine[0]; });
    }).catch(function () { ver.textContent = '—'; });
  }

  function swUpdate() {
    toast(L('يُجلب آخر تحديث…', 'Fetching the latest…'));
    var done = function () { setTimeout(function () { location.reload(true); }, 700); };
    if (!navigator.serviceWorker) return done();
    navigator.serviceWorker.getRegistrations().then(function (rs) {
      return Promise.all(rs.map(function (r) { return r.update().catch(function () {}); }));
    }).then(done, done);
  }

  /*@3.SETJ.25*/

  function rowText(row) {
    return normQ((row.getAttribute('data-k') || '') + ' ' + (row.textContent || ''));
  }

  /*@3.SETJ.26*/
  function sHide(el, on) {
    if (on) el.setAttribute('data-shide', '');
    else el.removeAttribute('data-shide');
  }
  function visible(el) { return !el.hidden && !el.hasAttribute('data-shide'); }

  function runSearch(raw) {
    var terms = normQ(raw).split(' ').filter(Boolean);
    var wrap = $('#set-search');
    wrap.classList.toggle('has-q', !!raw);
    var cards = $$('.set-card'), hits = 0;

    cards.forEach(function (card) {
      if (!terms.length) {
        sHide(card, false);
        $$('.set-row', card).forEach(function (r) { sHide(r, false); });
        return;
      }
      /*@3.SETJ.27*/
      var head = normQ((card.querySelector('.set-card-head') || {}).textContent || '');
      var headHit = terms.every(function (t) { return head.indexOf(t) >= 0; });
      var rows = $$('.set-row', card), any = headHit;
      rows.forEach(function (r) {
        var h = headHit || terms.every(function (t) { return rowText(r).indexOf(t) >= 0; });
        sHide(r, !h);
        /*@3.SETJ.28*/
        if (h && !r.hidden) any = true;
      });
      /*@3.SETJ.29*/
      if (!rows.length) {
        var body = normQ((card.querySelector('.set-card-body') || {}).textContent || '') + ' ' +
                   normQ(card.querySelector('.set-card-body').getAttribute('data-k') || '');
        any = headHit || terms.every(function (t) { return body.indexOf(t) >= 0; });
      }
      sHide(card, !any);
      if (any) hits++;
    });

    $('#set-empty').classList.toggle('is-on', !!terms.length && !hits);
    if (terms.length) markRail(null);
  }

  /*@3.SETJ.30*/

  function markRail(sec) {
    $$('.set-rail-item').forEach(function (b) {
      b.classList.toggle('is-on', !!sec && b.getAttribute('data-go') === sec);
    });
  }

  function goSec(sec) {
    var card = $('#sec-' + sec);
    if (!card) return;
    if (!visible(card)) { $('#set-q').value = ''; runSearch(''); }
    /*@3.SETJ.31*/
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' });
    markRail(sec);
    card.classList.add('is-hit');
    setTimeout(function () { card.classList.remove('is-hit'); }, 1400);
    if (history.replaceState) history.replaceState(null, '', '#' + sec);
  }

  function spy() {
    if ($('#set-q').value) return;
    var best = null, bestD = Infinity, y = window.innerHeight * 0.28;
    $$('.set-card').forEach(function (c) {
      if (!visible(c)) return;
      var d = Math.abs(c.getBoundingClientRect().top - y);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (best) markRail(best.getAttribute('data-sec'));
  }

  /*@3.SETJ.32*/

  function bind() {
    $('#p-name-ar').addEventListener('change', saveName);
    $('#p-name-en').addEventListener('change', saveName);

    bindLook();
    bindStudy();

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      /*@3.SETJ.33*/
      if (a === 'dn-minus') bumpDaily(-1);
      else if (a === 'dn-plus') bumpDaily(1);
      else if (a === 'export') exportData();
      else if (a === 'import') $('#p-import-file').click();
      else if (a === 'wipe') onWipe(b);
      else if (a === 'sw-update') swUpdate();
    });

    $('#p-import-file').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
      e.target.value = '';
    });

    $('#set-rail').addEventListener('click', function (e) {
      var b = e.target.closest('.set-rail-item');
      if (b) goSec(b.getAttribute('data-go'));
    });

    var qT = null;
    $('#set-q').addEventListener('input', function (e) {
      clearTimeout(qT);
      var v = e.target.value;
      qT = setTimeout(function () { runSearch(v); }, 90);
    });
    $('#set-q-x').addEventListener('click', function () {
      $('#set-q').value = ''; runSearch(''); $('#set-q').focus();
    });

    window.addEventListener('scroll', function () {
      clearTimeout(spy._t);
      spy._t = setTimeout(spy, 90);
    }, { passive: true });

    /*@3.SETJ.34*/
    document.addEventListener('garden:languageChanged', function () {
      fillProfile(); fillLook(); fillSync(); fillStudy(); fillAbout(); fillStore();
    });
  }

  function init() {
    bind();
    fillProfile();
    fillLook();
    fillSync();
    fillStudy();
    fillStore();
    fillLegacy();
    fillAbout();

    /*@3.SETJ.35*/
    if (prof().program) loadPlans(function () { fillProfile(); });

    var h = (location.hash || '').replace('#', '');
    if (h) setTimeout(function () { goSec(h); }, 120);
    else spy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
