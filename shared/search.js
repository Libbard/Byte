 

;(function () {
  'use strict';

  var thisScript = document.currentScript;
  var ROOT = (thisScript && thisScript.src)
    ? thisScript.src.replace(/shared\/search\.js(\?.*)?$/, '')
    : '';

  var INDEX_URL = ROOT + 'shared/data/search_index.json';
  var MAX_RESULTS = 24;
  var MIN_CHARS = 2;

  var index = null;
  var loading = null;
  var box = null, input = null, panel = null;
  var results = [];
  var active = -1;

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

   
  var AR_DIACRITICS = /[ً-ٰٟـ]/g;   
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(AR_DIACRITICS, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىی]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

   

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(INDEX_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = (j && j.entries) || [];
         
        index = list.map(function (e) {
          var kw = (e.kw || []).join(' ');
           
          var code = norm(e.code || '');
          var mod = e.m ? (code + ' m' + e.m + ' ' + code + e.m) : '';
          return {
            e: e,
            nar: norm(e.ar), nen: norm(e.en), nkw: norm(kw),
            ncode: (code + ' ' + mod).trim()
          };
        });
        return index;
      })
      .catch(function () { index = []; return index; });
    return loading;
  }

   

   
  var modUrlMap = null;
  function moduleUrl(code, m) {
    if (!modUrlMap) {
      modUrlMap = {};
      (index || []).forEach(function (it) {
        var e = it.e;
        if (e && e.t === 'module' && e.code && e.m && e.url) modUrlMap[e.code + '|' + e.m] = e.url;
      });
    }
    return modUrlMap[code + '|' + m] || null;
  }

  function searchNotes(q) {
    var out = [];
    var nq = norm(q);
    if (!nq) return out;

    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var m = /^garden_([A-Z0-9]+)_m(\d+)_notes$/.exec(k || '');
      if (m) {
        var data = null;
        try { data = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        var arr = Array.isArray(data) ? data : Object.values(data || {});
        arr.forEach(function (n) {
          if (!n) return;
          var body = n.note || n.text || n.body || '';
          var quote = n.quote || n.selection || '';
          if (norm(body).indexOf(nq) === -1 && norm(quote).indexOf(nq) === -1) return;
          var mn = parseInt(m[2], 10);
           
          out.push({
            t: 'note', code: m[1], m: mn,
            ar: body || quote, en: body || quote,
            url: moduleUrl(m[1], mn), score: 40
          });
        });
        continue;
      }

      var cm = /^course_meta_([A-Z0-9_]+)$/.exec(k || '');
      if (cm) {
        var meta = null;
        try { meta = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        (meta && meta.notes || []).forEach(function (n) {
          var t = (n.title || '') + ' ' + (n.body || '');
          if (norm(t).indexOf(nq) === -1) return;
          out.push({
            t: 'note', code: cm[1], ar: n.title || n.body, en: n.title || n.body,
            url: 'hub/course.html?code=' + encodeURIComponent(cm[1]), score: 40
          });
        });
      }
    }

    try {
      (JSON.parse(localStorage.getItem('quick_notes') || '[]') || []).forEach(function (n) {
        if (!n || !n.body) return;
        if (norm(n.body).indexOf(nq) === -1) return;
        out.push({ t: 'note', code: '', ar: n.body, en: n.body, url: 'index.html', score: 40 });
      });
    } catch (e) {}

    return out;
  }

   

  var semCodes = null;
  function mySemesterCodes() {
    if (semCodes) return semCodes;
    semCodes = {};
    try {
      var s = JSON.parse(localStorage.getItem('my_semester') || 'null');
      (s && s.courses || []).forEach(function (c) { if (c && c.code) semCodes[c.code] = true; });
    } catch (e) {}
    return semCodes;
  }

  function scoreField(hay, nq) {
    if (!hay) return 0;
    var i = hay.indexOf(nq);
    if (i === -1) return 0;
    if (i === 0) return 100;                                   
    if (hay.charAt(i - 1) === ' ') return 70;                  
    return 40;                                                 
  }

  var TYPE_WEIGHT = { course: 12, module: 6, concept: 0, note: 3 };

  function search(q) {
    var nq = norm(q);
    if (nq.length < MIN_CHARS) return [];
    var mine = mySemesterCodes();
    var out = [];

    (index || []).forEach(function (it) {
      var s = Math.max(scoreField(it.nar, nq), scoreField(it.nen, nq));
      if (!s) s = scoreField(it.ncode, nq);          
      if (!s) {
        var k = scoreField(it.nkw, nq);
        if (!k) return;
        s = k * 0.55;                    
      }
      s += TYPE_WEIGHT[it.e.t] || 0;
      if (mine[it.e.code]) s += 25;
      out.push({ e: it.e, score: s });
    });

    searchNotes(q).forEach(function (n) {
      out.push({ e: n, score: n.score + (mine[n.code] ? 25 : 0) });
    });

    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (a.e.ar || '').length - (b.e.ar || '').length;   
    });
    return out.slice(0, MAX_RESULTS);
  }

   

  var GROUP = {
    course:  ['📚', 'مواد', 'Courses'],
    module:  ['📖', 'وحدات', 'Modules'],
    concept: ['💡', 'مفاهيم', 'Concepts'],
    note:    ['📝', 'ملاحظاتي', 'My notes']
  };

  function highlight(text, nq) {
    var n = norm(text);
    var i = n.indexOf(nq);
    if (i === -1) return esc(text);
     
    var raw = String(text);
    if (raw.length !== n.length) return esc(raw);   
    return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + nq.length)) +
           '</mark>' + esc(raw.slice(i + nq.length));
  }

  function render(q) {
    var nq = norm(q);
    if (!panel) return;

    if (nq.length < MIN_CHARS) { close(); return; }
    results = search(q);
    active = -1;

    if (!results.length) {
      panel.innerHTML = '<div class="gs-empty">' +
        esc(tx('لا نتائج لـ «' + q + '»', 'No results for “' + q + '”')) + '</div>';
      open();
      return;
    }

     
    var order = ['course', 'module', 'concept', 'note'];
    var buckets = { course: [], module: [], concept: [], note: [] };
    results.forEach(function (r) { (buckets[r.e.t] || buckets.concept).push(r.e); });

    var html = '';
    var idx = 0;
    order.forEach(function (t) {
      var list = buckets[t];
      if (!list.length) return;
      var g = GROUP[t];
      html += '<div class="gs-group">' + g[0] + ' ' + esc(tx(g[1], g[2])) + '</div>';
      list.forEach(function (e) {
        var title = isAr() ? (e.ar || e.en) : (e.en || e.ar);
        var sub = e.t === 'course' ? e.code
                : e.m ? e.code + ' · ' + tx('وحدة ' + e.m, 'Module ' + e.m)
                : e.code || '';
        html += '<a class="gs-item" data-i="' + (idx++) + '" href="' + esc(hrefFor(e)) + '" role="option">' +
          '<span class="gs-item-title">' + highlight(title, nq) + '</span>' +
          (sub ? '<span class="gs-item-sub">' + esc(sub) + '</span>' : '') +
        '</a>';
      });
    });
    panel.innerHTML = html;
    open();
  }

  function hrefFor(e) {
    if (!e.url) return '#';
    if (/^(https?:)?\/\//.test(e.url)) return e.url;
    return ROOT + e.url;
  }

  function open() { if (panel) { panel.hidden = false; box.classList.add('gs-open'); input.setAttribute('aria-expanded', 'true'); } }
  function close() { if (panel) { panel.hidden = true; box.classList.remove('gs-open'); input.setAttribute('aria-expanded', 'false'); active = -1; } }

  function setActive(i) {
    var items = panel.querySelectorAll('.gs-item');
    if (!items.length) return;
    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;
    active = i;
    items.forEach(function (el, j) {
      el.classList.toggle('is-active', j === i);
      if (j === i) {
        el.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', 'gs-opt-' + j);
        el.id = 'gs-opt-' + j;
      }
    });
  }

   

  var timer = null;
  function onInput() {
    clearTimeout(timer);
    var q = input.value;
    timer = setTimeout(function () {
      loadIndex().then(function () { render(q); });
    }, 90);
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); input.blur(); return; }
    if (panel.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      var items = panel.querySelectorAll('.gs-item');
      if (active > -1 && items[active]) { e.preventDefault(); items[active].click(); }
    }
  }

  function init() {
    box = document.getElementById('gs-box');
    input = document.getElementById('gs-input');
    panel = document.getElementById('gs-panel');
    if (!box || !input || !panel) return;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'listbox');

     
    input.addEventListener('focus', function () { loadIndex(); }, { once: true });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);

    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) close();
    });

     
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault(); input.focus(); input.select();
      } else if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault(); input.focus();
      }
    });

    document.addEventListener('garden:languageChanged', function () {
      semCodes = null;
      if (!panel.hidden) render(input.value);
      refreshPlaceholder();
    });

    setupPlaceholder();
  }

   
  var _ph, _phMask;
  function isArLang() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function setupPlaceholder() {
    _ph = document.getElementById('gs-ph');
    _phMask = box ? box.querySelector('.dash-search-ph-mask') : null;
    if (!_ph || !_phMask) return;
    input.addEventListener('focus', function () { _ph.classList.add('is-paused'); });
    input.addEventListener('blur', function () { if (!input.value) _ph.classList.remove('is-paused'); refreshPlaceholder(); });
    input.addEventListener('input', function () { togglePlaceholder(); });
    var rt = null;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(refreshPlaceholder, 200); });
     
    if (window.ResizeObserver) {
      try { new ResizeObserver(function () { refreshPlaceholder(); }).observe(_phMask); } catch (e) {}
    }
    refreshPlaceholder();
  }
  function togglePlaceholder() {
    if (!_ph) return;
    _ph.hidden = !!input.value;   
  }
  function refreshPlaceholder() {
    if (!_ph || !_phMask) return;
    _ph.textContent = _ph.getAttribute(isArLang() ? 'data-ar' : 'data-en') || '';
    togglePlaceholder();
    _ph.classList.remove('is-marquee');
    _ph.style.removeProperty('--mq-shift');
    if (input.value || reducedMotion()) return;
    
    var overflow = _ph.scrollWidth - _phMask.clientWidth;
    if (overflow <= 4) return;                 
    var sign = isArLang() ? 1 : -1;            
    _ph.style.setProperty('--mq-shift', (sign * overflow) + 'px');
    _ph.classList.add('is-marquee');
  }

  window.GardenSearch = { load: loadIndex, query: search, norm: norm };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
