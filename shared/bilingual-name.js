/*@3.BINJ.1*/

;(function () {
  'use strict';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.BINJ.2*/
  var LEVEL_AR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
                  'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
  var MAX_LEVEL = LEVEL_AR.length - 1;      /*@3.BINJ.3*/
  /*@3.BINJ.28*/
  var MIN_PICK = 3, MAX_PICK = 10;
  function pairs() {
    var out = [];
    for (var i = MIN_PICK; i <= MAX_PICK; i++) out.push(levelPair(i));
    out.push(summerPair());
    return out;
  }

  /*@3.BINJ.4*/
  function levelPair(n) {
    var i = parseInt(n, 10);
    if (!(i >= 1)) return null;
    return { ar: 'المستوى ' + (LEVEL_AR[i] || i), en: 'Level ' + i, level: i };
  }
  function summerPair() { return { ar: 'الفصل الصيفي', en: 'Summer Term', summer: true }; }

  function norm(s) { return String(s || '').trim().toLowerCase(); }

  /*@3.BINJ.5*/
  function readJSON(k) {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
  }
  /*@3.BINJ.31*/
  function levelFromRecord() {
    var D = window.GardenData;
    if (!D || !D.completedCourses || !D.courseInfo) return 0;
    var max = 0;
    var done = D.completedCourses() || {};
    Object.keys(done).forEach(function (code) {
      var info = D.courseInfo(code);
      var m = info && String(info.level || '').match(/\d+/);
      if (m) { var n = parseInt(m[0], 10); if (n > max) max = n; }
    });
    return max ? max + 1 : 0;
  }
  function inferLevel() {
    /*@3.BINJ.6*/
    var prof = readJSON('student_profile') || {};
    var explicit = parseInt(prof.level, 10);
    if (!(explicit >= 1)) explicit = 0;
    var n = Math.max(explicit, levelFromRecord());
    return n ? Math.max(MIN_PICK, Math.min(MAX_PICK, n)) : MIN_PICK;
  }
  function isSummerNow() {
    var m = new Date().getMonth() + 1;   /*@3.BINJ.7*/
    return m >= 6 && m <= 8;
  }
  /*@3.BINJ.8*/
  function primaryKey(override) {
    if (override === 'summer' || (typeof override === 'number' && override >= 3)) return override;
    return isSummerNow() ? 'summer' : inferLevel();
  }
  /*@3.BINJ.9*/
  function orderedPairs(override) {
    var key = primaryKey(override);
    var all = pairs();
    var i = (key === 'summer')
      ? all.length - 1
      : all.map(function (p) { return p.en; }).indexOf('Level ' + key);
    if (i < 0) return all;
    var top = all[i];
    top.primary = true;
    return [top].concat(all.filter(function (_, j) { return j !== i; }));
  }

  /*@3.BINJ.29*/
  function suggestPairs(override) {
    var n = (typeof override === 'number' && override >= 1)
      ? Math.min(MAX_PICK, override) : inferLevel();
    var top = [levelPair(n)];
    if (n < MAX_PICK) top.push(levelPair(n + 1));
    top.push(summerPair());
    if (isSummerNow()) top.unshift(top.pop());
    top[0].primary = true;

    var seen = {};
    top.forEach(function (p) { seen[key(p)] = 1; });
    var rest = pairs().filter(function (p) { return !seen[key(p)]; });
    return { top: top, rest: rest };

    function key(p) { return p.summer ? 's' : ('L' + p.level); }
  }

  /*@3.BINJ.30*/
  function pairOf(v) {
    if (v === 's' || v === 'summer') return summerPair();
    var n = parseInt(v, 10);
    return (n >= 1 && n <= MAX_LEVEL) ? levelPair(n) : null;
  }

  /*@3.BINJ.10*/
  function resolve(ar, en) {
    ar = String(ar || '').trim();
    en = String(en || '').trim();
    if (!ar && !en) return null;
    if (!ar) ar = en;
    if (!en) en = ar;
    return { name_ar: ar, name_en: en, name: ar };
  }

  /*@3.BINJ.11*/
  function read(obj) {
    obj = obj || {};
    return {
      ar: obj.name_ar || obj.name || '',
      en: obj.name_en || (obj.name_ar ? '' : (obj.name || ''))
    };
  }

  /*@3.BINJ.12*/
  var STYLED = false;
  function injectStyle() {
    if (STYLED) return;
    STYLED = true;
    var s = document.createElement('style');
    s.id = 'bi-name-style';
    s.textContent =
      '.bi-row{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;align-items:start}' +
      '@media(max-width:520px){.bi-row{grid-template-columns:1fr}}' +
      '.bi-field{position:relative;min-width:0}' +
      '.bi-lang{display:block;font-size:0.68rem;font-weight:800;letter-spacing:0.02em;' +
        'color:var(--text-muted);margin-bottom:0.25rem}' +
      '.bi-sugg{position:absolute;inset-inline:0;top:100%;z-index:50;margin-top:0.2rem;' +
        'max-height:190px;overflow-y:auto;padding:0.25rem;' +
        'background:var(--bg-elevated,#1a1a2e);border:1px solid var(--border-color,#333);' +
        'border-radius:var(--radius-md,8px);box-shadow:0 12px 28px var(--shadow-base,rgba(0,0,0,.4))}' +
      '.bi-sugg[hidden]{display:none}' +
      '.bi-sugg-item{display:flex;justify-content:space-between;gap:0.6rem;width:100%;' +
        'padding:0.42rem 0.55rem;border:0;border-radius:var(--radius-sm,6px);cursor:pointer;' +
        'background:transparent;color:var(--text-primary,#eee);font-family:inherit;font-size:0.78rem;text-align:start}' +
      '.bi-sugg-item:hover,.bi-sugg-item.is-on{background:color-mix(in srgb,var(--brand-500,#a78bfa) 16%,transparent)}' +
      '.bi-sugg-en{color:var(--text-muted,#888);font-weight:700;flex-shrink:0}' +
      '.bi-sugg-head{padding:0.3rem 0.55rem 0.35rem;font-size:0.66rem;font-weight:800;color:var(--text-muted,#888)}' +
      /*@3.BINJ.13*/
      '.bi-sugg-item.is-primary{border-inline-start:2px solid var(--brand-500,#a78bfa)}' +
      '.bi-sugg-tag{font-size:0.6rem;font-weight:800;color:var(--brand-500,#a78bfa);margin-inline-start:0.3rem}';
    document.head.appendChild(s);
  }

  /*@3.BINJ.14*/
  function attach(opts) {
    var a = opts && opts.ar, b = opts && opts.en;
    if (!a || !b) return;
    injectStyle();

    var phAr = a.getAttribute('placeholder') || '';
    var phEn = b.getAttribute('placeholder') || '';

    /*@3.BINJ.15*/
    function mirror() {
      var va = a.value.trim(), vb = b.value.trim();
      b.setAttribute('placeholder', (!vb && va) ? va : phEn);
      a.setAttribute('placeholder', (!va && vb) ? vb : phAr);
    }
    a.addEventListener('input', mirror);
    b.addEventListener('input', mirror);
    mirror();

    if (opts.suggest === false) return { mirror: mirror };

    /*@3.BINJ.16*/
    return wireSuggest(a, b, mirror, opts.primary);
  }

  function wireSuggest(a, b, mirror, primaryOverride) {
    if (!a.parentNode || !a.parentNode.classList.contains('bi-field')) return { mirror: mirror };

    var box = document.createElement('div');
    box.className = 'bi-sugg';
    box.hidden = true;

    var idx = -1, shown = [], host = null;

    function render(q) {
      var nq = norm(q);
      shown = orderedPairs(primaryOverride).filter(function (p) {
        if (!nq) return true;
        return norm(p.ar).indexOf(nq) > -1 || norm(p.en).indexOf(nq) > -1;
      });
      if (!shown.length) { hide(); return false; }
      idx = -1;
      box.innerHTML =
        '<div class="bi-sugg-head">' + esc(tx('تسميات جاهزة', 'Quick labels')) + '</div>' +
        shown.map(function (p, i) {
          return '<button type="button" class="bi-sugg-item' + (p.primary ? ' is-primary' : '') + '" data-i="' + i + '">' +
            '<span>' + esc(p.ar) +
              (p.primary ? '<span class="bi-sugg-tag">' + esc(tx('مقترح', 'Suggested')) + '</span>' : '') +
            '</span>' +
            '<span class="bi-sugg-en">' + esc(p.en) + '</span></button>';
        }).join('');
      return true;
    }
    function show(input) {
      if (!render(input.value)) return;
      host = input;
      input.parentNode.appendChild(box);   /*@3.BINJ.17*/
      box.hidden = false;
    }
    function hide() {
      box.hidden = true; idx = -1; host = null;
      if (box.parentNode) box.parentNode.removeChild(box);
    }
    function isOpen() { return !box.hidden; }
    function highlight() {
      box.querySelectorAll('.bi-sugg-item').forEach(function (el, i) {
        el.classList.toggle('is-on', i === idx);
      });
    }
    function pick(i) {
      var p = shown[i];
      if (!p) return;
      var input = host;
      a.value = p.ar;                      /*@3.BINJ.18*/
      b.value = p.en;
      mirror();
      hide();                              /*@3.BINJ.19*/
      if (input) input.focus();
      /*@3.BINJ.20*/
      a.dispatchEvent(new Event('input', { bubbles: true }));
      b.dispatchEvent(new Event('input', { bubbles: true }));
    }
    /*@3.BINJ.21*/
    function exactHit(v) {
      var nv = norm(v);
      return !!nv && pairs().some(function (p) { return norm(p.ar) === nv || norm(p.en) === nv; });
    }

    [a, b].forEach(function (input) {
      /*@3.BINJ.22*/
      input.addEventListener('click', function () {
        if (isOpen() && host === input) { hide(); return; }   /*@3.BINJ.23*/
        show(input);
      });
      /*@3.BINJ.24*/
      input.addEventListener('input', function () {
        if (!isOpen() || host !== input) return;
        if (exactHit(input.value)) { hide(); return; }
        render(input.value);
      });
      input.addEventListener('keydown', function (e) {
        if (!isOpen() || host !== input) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, shown.length - 1); highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); highlight(); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (idx > -1) pick(idx); else hide(); }
        else if (e.key === 'Escape') { e.stopPropagation(); hide(); }
      });
      input.addEventListener('blur', function () { setTimeout(function () { if (host === input) hide(); }, 120); });
    });

    /*@3.BINJ.25*/
    box.addEventListener('mousedown', function (e) {
      var btn = e.target.closest('.bi-sugg-item');
      if (!btn) return;
      e.preventDefault();
      pick(parseInt(btn.getAttribute('data-i'), 10));
    });

    return { mirror: mirror, hide: hide };
  }

  /*@3.BINJ.26*/
  function fieldHtml(o) {
    o = o || {};
    return '<div class="bi-row">' +
      '<div class="bi-field">' +
        '<label class="bi-lang" for="' + esc(o.idAr) + '">' + esc(tx('بالعربية', 'Arabic')) + '</label>' +
        '<input type="text" class="' + esc(o.cls || '') + '" id="' + esc(o.idAr) + '" maxlength="' + (o.max || 60) + '" ' +
          'autocomplete="off" value="' + esc(o.valAr || '') + '" placeholder="' + esc(o.phAr || '') + '">' +
      '</div>' +
      '<div class="bi-field">' +
        '<label class="bi-lang" for="' + esc(o.idEn) + '">' + esc(tx('بالإنجليزية', 'English')) + '</label>' +
        '<input type="text" class="' + esc(o.cls || '') + '" id="' + esc(o.idEn) + '" maxlength="' + (o.max || 60) + '" ' +
          'autocomplete="off" dir="ltr" value="' + esc(o.valEn || '') + '" placeholder="' + esc(o.phEn || '') + '">' +
      '</div>' +
    '</div>';
  }

  window.GardenBiName = {
    pairs: pairs,
    /*@3.BINJ.27*/
    levelPair: levelPair,
    summerPair: summerPair,
    suggestPairs: suggestPairs,
    pairOf: pairOf,
    isSummerNow: isSummerNow,
    currentLevel: inferLevel,
    MAX_LEVEL: MAX_LEVEL,
    MIN_PICK: MIN_PICK,
    MAX_PICK: MAX_PICK,
    resolve: resolve,
    read: read,
    attach: attach,
    fieldHtml: fieldHtml
  };
})();
