/*@3.COCJ.1*/

;(function () {
  'use strict';

  var dlg = null, code = null, opts = {}, wired = false;

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function q(sel) { return dlg ? dlg.querySelector(sel) : null; }

  function D() { return window.GardenData; }
  function palette() { return (D() && D().COLOR_PALETTE) || []; }
  function norm(v) { return D() ? D().normHex(v) : ''; }

  /*@3.COCJ.2*/
  function lum(hex) {
    var h = norm(hex) || '#000000';
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(h.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  /*@3.COCJ.3*/
  function surfaceHex() {
    try {
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;background:var(--bg-card)';
      document.body.appendChild(probe);
      var rgb = getComputedStyle(probe).backgroundColor;
      probe.remove();
      var m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(rgb || '');
      if (!m) return '#1f2937';
      return '#' + [1, 2, 3].map(function (i) {
        return ('0' + (+m[i]).toString(16)).slice(-2);
      }).join('');
    } catch (e) { return '#1f2937'; }
  }
  function contrast(hex) {
    var a = lum(hex), b = lum(surfaceHex());
    var hi = Math.max(a, b), lo = Math.min(a, b);
    return (hi + 0.05) / (lo + 0.05);
  }

  /*@3.COCJ.4*/
  function gridKeys(box) {
    if (!box || box._gccKeys) return;
    box._gccKeys = true;
    box.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'ArrowUp' &&
          k !== 'ArrowDown' && k !== 'Home' && k !== 'End') return;
      var items = Array.prototype.slice.call(box.querySelectorAll('.gcc-sw'));
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      /*@3.COCJ.5*/
      var rtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
      var per = 1, top = items[0].getBoundingClientRect().top;
      while (per < items.length && items[per].getBoundingClientRect().top === top) per++;
      var next = i;
      if (k === 'Home') next = 0;
      else if (k === 'End') next = items.length - 1;
      else if (k === 'ArrowUp') next = i - per;
      else if (k === 'ArrowDown') next = i + per;
      else next = i + ((k === 'ArrowRight') === rtl ? -1 : 1);
      if (next < 0 || next >= items.length) return;
      items[next].focus();
    });
  }

  /*@3.COCJ.6*/
  function swatch(c, entry) {
    var col = D() ? D().courseColor(c, entry) : '#a78bfa';
    return '<span class="gcc-dot" style="--gcc-c:' + esc(col) + '" aria-hidden="true"></span>';
  }

  /*@3.COCJ.7*/
  function build() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'gcc-dlg';
    dlg.id = 'gcc-dlg';
    dlg.setAttribute('aria-labelledby', 'gcc-t');
    dlg.innerHTML =
      '<div class="gcc-h">' +
        '<h2 class="gcc-t" id="gcc-t">' + esc(L('لون المادة', 'Course colour')) + '</h2>' +
        '<button class="gcc-ico" type="button" data-gcc-close ' +
          'aria-label="' + esc(L('إغلاق', 'Close')) + '" title="' + esc(L('إغلاق', 'Close')) + '">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="gcc-b">' +
        /*@3.COCJ.8*/
        '<div class="gcc-prev" id="gcc-prev">' +
          '<span class="gcc-prev-ic"><i class="fa-solid fa-book" aria-hidden="true"></i></span>' +
          '<span class="gcc-prev-b">' +
            '<span class="gcc-prev-n" id="gcc-prev-n">—</span>' +
            '<span class="gcc-prev-m" id="gcc-prev-m"></span>' +
          '</span>' +
        '</div>' +
        '<p class="gcc-warn" id="gcc-warn" hidden></p>' +

        '<div class="gcc-lbl">' + esc(L('ألوان الموقع', 'Site colours')) + '</div>' +
        '<div class="gcc-grid" id="gcc-grid" role="radiogroup" ' +
          'aria-label="' + esc(L('ألوان الموقع', 'Site colours')) + '"></div>' +

        /*@3.COCJ.9*/
        '<div class="gcc-lbl" id="gcc-skin-lbl" hidden></div>' +
        '<div class="gcc-grid" id="gcc-skin" role="radiogroup" hidden></div>' +

        '<div class="gcc-lbl">' + esc(L('لونٌ خاصٌّ بك', 'Your own colour')) + '</div>' +
        '<div class="gcc-own">' +
          /*@3.COCJ.10*/
          '<label class="gcc-pick" title="' + esc(L('اختر من لوحة الألوان', 'Pick from the colour wheel')) + '">' +
            '<input type="color" id="gcc-wheel" ' +
              'aria-label="' + esc(L('اختر من لوحة الألوان', 'Pick from the colour wheel')) + '">' +
            '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i>' +
            '<span>' + esc(L('لوحة الألوان', 'Colour wheel')) + '</span>' +
          '</label>' +
          '<span class="gcc-hexwrap">' +
            '<span class="gcc-hash" aria-hidden="true">#</span>' +
            '<input type="text" class="gcc-hex" id="gcc-hex" dir="ltr" maxlength="7" ' +
              'inputmode="latin" autocomplete="off" spellcheck="false" placeholder="a78bfa" ' +
              'aria-label="' + esc(L('رمز اللون', 'Colour code')) + '">' +
          '</span>' +
          '<button class="gcc-btn" type="button" id="gcc-apply">' +
            esc(L('طبِّق', 'Apply')) + '</button>' +
        '</div>' +
        '<p class="gcc-hint" id="gcc-hint"></p>' +
      '</div>' +
      '<div class="gcc-f">' +
        '<button class="gcc-btn gcc-btn--ghost" type="button" id="gcc-reset" hidden></button>' +
        '<button class="gcc-btn gcc-btn--primary" type="button" data-gcc-close>' +
          esc(L('تمّ', 'Done')) + '</button>' +
      '</div>';
    document.body.appendChild(dlg);
    wire();
  }

  function wire() {
    if (wired) return;
    wired = true;

    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-gcc-close]')) { dlg.close(); return; }
      var sw = e.target.closest('[data-gcc-hex]');
      if (sw) { apply(sw.getAttribute('data-gcc-hex')); return; }
      if (e.target.closest('#gcc-reset')) { apply(''); return; }
      if (e.target.closest('#gcc-apply')) { applyTyped(); return; }
    });

    /*@3.COCJ.11*/
    var wheel = q('#gcc-wheel');
    if (wheel) wheel.addEventListener('input', function () { apply(wheel.value); });

    var hex = q('#gcc-hex');
    if (hex) {
      hex.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); applyTyped(); }
      });
      /*@3.COCJ.12*/
      hex.addEventListener('input', function () { markTyped(); });
    }

    gridKeys(q('#gcc-grid'));

    document.addEventListener('garden:languageChanged', function () {
      if (dlg && dlg.open) { relabel(); render(); }
    });
  }

  /*@3.COCJ.13*/
  function relabel() {
    var t = q('#gcc-t'); if (t) t.textContent = L('لون المادة', 'Course colour');
    var lb = dlg.querySelectorAll('.gcc-lbl');
    if (lb[0]) lb[0].textContent = L('ألوان الموقع', 'Site colours');
    if (lb[1]) lb[1].textContent = L('لونٌ خاصٌّ بك', 'Your own colour');
    var ap = q('#gcc-apply'); if (ap) ap.textContent = L('طبِّق', 'Apply');
    var dn = q('.gcc-btn--primary'); if (dn) dn.textContent = L('تمّ', 'Done');
    var ps = q('.gcc-pick span'); if (ps) ps.textContent = L('لوحة الألوان', 'Colour wheel');
  }

  function markTyped() {
    var el = q('#gcc-hex'), hint = q('#gcc-hint');
    if (!el || !hint) return;
    var raw = el.value.trim();
    if (!raw) { hint.textContent = ''; hint.removeAttribute('data-bad'); return; }
    if (norm(raw)) {
      hint.textContent = L('اضغط «طبِّق» أو Enter', 'Press “Apply” or Enter');
      hint.removeAttribute('data-bad');
    } else {
      hint.textContent = L('رمزٌ غيرُ صالح — ستُّ خاناتٍ مثل a78bfa',
                           'Not a valid code — six digits like a78bfa');
      hint.setAttribute('data-bad', '1');
    }
  }

  function applyTyped() {
    var el = q('#gcc-hex');
    if (!el) return;
    var v = norm(el.value);
    if (!v) { markTyped(); el.focus(); return; }
    apply(v);
  }

  /*@3.COCJ.14*/
  function apply(hex) {
    if (!code || !D()) return;
    var now = D().setCourseColor(code, hex);
    render();
    if (typeof opts.onPick === 'function') {
      try { opts.onPick(now); } catch (e) {}
    }
  }

  function render() {
    if (!dlg || !D()) return;
    var cur = D().courseColor(code, opts.entry);
    var base = D().courseColorBase(code, opts.entry);
    var src = D().courseColorSource(code, opts.entry);
    var custom = src === 'custom';

    /*@3.COCJ.15*/
    var prev = q('#gcc-prev');
    if (prev) prev.style.setProperty('--gcc-c', cur);
    var pn = q('#gcc-prev-n');
    if (pn) pn.textContent = opts.courseName || code || '';
    var pm = q('#gcc-prev-m');
    if (pm) {
      pm.textContent = custom
        ? L('لونٌ اخترتَه', 'A colour you chose')
        : (src === 'catalog'
            ? L('لونُ المادة الأصليّ', 'The course’s original colour')
            : L('اللونُ الافتراضيّ', 'The default colour'));
    }

    /*@3.COCJ.16*/
    function swatches(list) {
      return list.map(function (p) {
        var on = norm(p.hex) === norm(cur);
        var nm = isAr() ? p.ar : p.en;
        return '<button class="gcc-sw" type="button" role="radio" ' +
          'aria-checked="' + (on ? 'true' : 'false') + '" ' +
          'data-gcc-hex="' + esc(p.hex) + '" style="--gcc-c:' + esc(p.hex) + '" ' +
          'title="' + esc(nm) + '" aria-label="' + esc(nm) + '">' +
          '<i class="fa-solid fa-check" aria-hidden="true"></i></button>';
      }).join('');
    }
    var grid = q('#gcc-grid');
    if (grid) grid.innerHTML = swatches(palette());

    /*@3.COCJ.17*/
    var skinList = (opts.skinColours && D() && D().COLOR_PALETTE_SKIN) || [];
    var sg = q('#gcc-skin'), sl = q('#gcc-skin-lbl');
    if (sg && sl) {
      var show = skinList.length > 0;
      sg.hidden = sl.hidden = !show;
      if (show) {
        sl.textContent = L('ألوانُ الجلود', 'Skin colours');
        sg.setAttribute('aria-label', L('ألوانُ الجلود', 'Skin colours'));
        sg.innerHTML = swatches(skinList);
        gridKeys(sg);
      }
    }

    /*@3.COCJ.18*/
    var wheel = q('#gcc-wheel'); if (wheel) wheel.value = cur;
    var hex = q('#gcc-hex');
    if (hex && norm(hex.value) !== norm(cur)) hex.value = cur.replace(/^#/, '');
    var hint = q('#gcc-hint'); if (hint) { hint.textContent = ''; hint.removeAttribute('data-bad'); }

    /*@3.COCJ.19*/
    var rs = q('#gcc-reset');
    if (rs) {
      rs.hidden = !custom;
      rs.innerHTML = '<span class="gcc-dot" style="--gcc-c:' + esc(base) + '" aria-hidden="true"></span>' +
        esc(L('أعِد اللونَ الأصليّ', 'Restore original'));
    }

    /*@3.COCJ.20*/
    var w = q('#gcc-warn');
    if (w) {
      var r = contrast(cur);
      if (r < 1.6) {
        w.hidden = false;
        w.textContent = L('هذا اللونُ يكاد لا يُرى على ثيمك الحالي — سيظهر لكنّه باهت.',
                          'This colour is nearly invisible on your current theme — it will show, but faintly.');
      } else { w.hidden = true; }
    }
  }

  function open(c, o) {
    if (!window.GardenData) return;
    build();
    code = c;
    opts = o || {};
    relabel();
    render();
    if (!dlg.open) dlg.showModal();
  }

  window.GardenCourseColor = {
    open: open,
    swatch: swatch,
    /*@3.COCJ.21*/
    wireGrid: gridKeys,
    /*@3.COCJ.22*/
    of: function (c, entry) { return window.GardenData ? GardenData.courseColor(c, entry) : '#a78bfa'; },
    isCustom: function (c) { return !!window.GardenData && GardenData.courseColorSource(c) === 'custom'; }
  };
})();
