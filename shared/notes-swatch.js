;(function () {
  'use strict';

  var KEY = 'garden_notes_swatches';
  var MAX = 8;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function norm(v) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    if (s.charAt(0) !== '#') s = '#' + s;
    if (/^#[0-9a-f]{3}$/.test(s)) {
      return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    return /^#[0-9a-f]{6}$/.test(s) ? s : '';
  }

  function read() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  function bucket(kind) {
    var o = read();
    var b = o[kind] || {};
    return {
      recent: (b.recent || []).map(norm).filter(Boolean),
      pinned: (b.pinned || []).map(norm).filter(Boolean)
    };
  }

  function save(kind, b) {
    var o = read();
    o[kind] = { recent: b.recent.slice(0, MAX), pinned: b.pinned.slice(0, MAX) };
    write(o);
  }

  /*@3.NOSJ5.1*/
  function push(kind, hex) {
    var v = norm(hex);
    if (!v) return false;
    var b = bucket(kind);
    if (b.pinned.indexOf(v) > -1) return true;
    b.recent = [v].concat(b.recent.filter(function (x) { return x !== v; }));
    var room = Math.max(0, MAX - b.pinned.length);
    b.recent = b.recent.slice(0, room);
    save(kind, b);
    return true;
  }

  function togglePin(kind, hex) {
    var v = norm(hex);
    if (!v) return false;
    var b = bucket(kind);
    if (b.pinned.indexOf(v) > -1) {
      b.pinned = b.pinned.filter(function (x) { return x !== v; });
      b.recent = [v].concat(b.recent.filter(function (x) { return x !== v; }));
    } else {
      b.pinned = [v].concat(b.pinned.filter(function (x) { return x !== v; })).slice(0, MAX);
      b.recent = b.recent.filter(function (x) { return x !== v; });
    }
    var room = Math.max(0, MAX - b.pinned.length);
    b.recent = b.recent.slice(0, room);
    save(kind, b);
    return true;
  }

  function all(kind) {
    var b = bucket(kind);
    var out = b.pinned.map(function (h) { return { hex: h, pin: 1 }; });
    b.recent.forEach(function (h) {
      if (!out.some(function (x) { return x.hex === h; })) out.push({ hex: h, pin: 0 });
    });
    return out.slice(0, MAX);
  }

  /*@3.NOSJ5.2*/
  function html(kind) {
    var items = all(kind);
    var h = '<div class="nsw" data-swkind="' + esc(kind) + '">' +
      '<div class="nr-pop-h">' + esc(L('لونٌ مخصّص', 'Custom colour')) + '</div>';
    if (items.length) {
      h += '<div class="nsw-row">' + items.map(function (it) {
        return '<span class="nsw-cell' + (it.pin ? ' is-pin' : '') + '">' +
          '<button type="button" class="nsw-sw" data-swatch="' + esc(it.hex) + '"' +
          ' style="--t:' + esc(it.hex) + '" aria-label="' +
          esc(L('استعمل ', 'Use ') + it.hex) + '"></button>' +
          '<button type="button" class="nsw-pin" data-pin="' + esc(it.hex) + '"' +
          ' aria-pressed="' + (it.pin ? 'true' : 'false') + '" aria-label="' +
          esc(it.pin ? L('ألغِ تثبيت ', 'Unpin ') + it.hex : L('ثبّتْ ', 'Pin ') + it.hex) +
          '"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></button>' +
          '</span>';
      }).join('') + '</div>';
    }
    h += '<div class="nsw-hex">' +
      '<input type="text" class="nsw-in" data-hexin="' + esc(kind) + '"' +
      ' spellcheck="false" dir="ltr" inputmode="latin" maxlength="7" placeholder="#7C3AED"' +
      ' aria-label="' + esc(L('رمزُ اللون', 'Colour code')) + '">' +
      '<button type="button" class="nsw-go" data-hexgo="' + esc(kind) + '" aria-label="' +
      esc(L('طبّقِ الرمز', 'Apply code')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '<button type="button" class="nsw-eye" data-custom="' + esc(kind) + '" aria-label="' +
      esc(L('اختر من اللوحة', 'Pick from the palette')) +
      '"><i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button>' +
      '</div></div>';
    return h;
  }


  /*@3.NOSJ5.5*/
  function hsv2hex(h, sv, vv) {
    var c = vv * sv, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = vv - c;
    var r = 0, g = 0, b = 0, k = Math.floor(h / 60) % 6;
    if (k === 0) { r = c; g = x; }
    else if (k === 1) { r = x; g = c; }
    else if (k === 2) { g = c; b = x; }
    else if (k === 3) { g = x; b = c; }
    else if (k === 4) { r = x; b = c; }
    else { r = c; b = x; }
    function h2(v) { var t = Math.round((v + m) * 255).toString(16); return t.length < 2 ? '0' + t : t; }
    return '#' + h2(r) + h2(g) + h2(b);
  }

  function hex2hsv(hex) {
    var v = norm(hex) || '#7c3aed';
    var r = parseInt(v.slice(1, 3), 16) / 255,
        g = parseInt(v.slice(3, 5), 16) / 255,
        b = parseInt(v.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var h = 0;
    if (d) {
      if (mx === r) h = 60 * (((g - b) / d) % 6);
      else if (mx === g) h = 60 * (((b - r) / d) + 2);
      else h = 60 * (((r - g) / d) + 4);
    }
    if (h < 0) h += 360;
    return { h: h, s: mx ? d / mx : 0, v: mx };
  }

  function board(anchor, current, cb) {
    closeBoard();
    var st = hex2hsv(current);
    var host = (anchor && anchor.closest && anchor.closest('dialog[open]')) || document.body;
    var el = document.createElement('div');
    el.className = 'nsw-bd';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', L('لوحُ الألوان', 'Colour board'));
    el.innerHTML =
      '<div class="nsw-sv" data-sv><span class="nsw-knob" data-knob></span></div>' +
      '<input type="range" class="nsw-hue" data-hue min="0" max="359" step="1"' +
      ' aria-label="' + esc(L('الصبغة', 'Hue')) + '">' +
      '<div class="nsw-bd-f">' +
      '<span class="nsw-prev" data-prev aria-hidden="true"></span>' +
      '<input type="text" class="nsw-in" data-bdhex spellcheck="false" dir="ltr"' +
      ' maxlength="7" aria-label="' + esc(L('رمزُ اللون', 'Colour code')) + '">' +
      '<button type="button" class="nsw-go" data-bdok aria-label="' +
      esc(L('طبّق', 'Apply')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '</div>';
    host.appendChild(el);

    var sv = el.querySelector('[data-sv]');
    var knob = el.querySelector('[data-knob]');
    var hue = el.querySelector('[data-hue]');
    var prev = el.querySelector('[data-prev]');
    var hexf = el.querySelector('[data-bdhex]');

    function paint(live) {
      var hex = hsv2hex(st.h, st.s, st.v);
      el.style.setProperty('--h', String(Math.round(st.h)));
      knob.style.insetInlineStart = '';
      knob.style.left = (st.s * 100) + '%';
      knob.style.top = ((1 - st.v) * 100) + '%';
      knob.style.setProperty('--t', hex);
      prev.style.setProperty('--t', hex);
      if (document.activeElement !== hexf) hexf.value = hex;
      hue.value = String(Math.round(st.h));
      if (live) cb(hex, false);
      return hex;
    }

    function fromPoint(e) {
      var r = sv.getBoundingClientRect();
      st.s = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      st.v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
      paint(true);
    }

    sv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { sv.setPointerCapture(e.pointerId); } catch (err) {}
      fromPoint(e);
    });
    sv.addEventListener('pointermove', function (e) {
      if (e.buttons & 1) fromPoint(e);
    });
    hue.addEventListener('input', function () { st.h = parseFloat(hue.value) || 0; paint(true); });
    hexf.addEventListener('input', function () {
      var v = norm(hexf.value);
      if (!v) return;
      st = hex2hsv(v);
      paint(true);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeBoard(); return; }
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
    });
    el.querySelector('[data-bdok]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); commit();
    });

    function commit() {
      var hex = norm(hexf.value) || hsv2hex(st.h, st.s, st.v);
      push(kindOf(el), hex);
      cb(hex, true);
      closeBoard();
    }
    el.__commit = commit;

    var r = anchor ? anchor.getBoundingClientRect()
                   : { left: innerWidth / 2, bottom: innerHeight / 2, top: innerHeight / 2 };
    el.style.position = 'fixed';
    el.style.insetBlockStart = Math.round(Math.min(innerHeight - 250, r.bottom + 6)) + 'px';
    el.style.left = Math.round(Math.max(8, Math.min(innerWidth - 232, r.left - 90))) + 'px';
    paint(false);
    _board = el;
    setTimeout(function () {
      document.addEventListener('pointerdown', outside, true);
    }, 0);
    return el;
  }

  var _board = null;
  var _kind = 'fg';
  function kindOf() { return _kind; }

  function outside(e) {
    if (!_board || _board.contains(e.target)) return;
    var go = _board.__commit;
    if (go) go(); else closeBoard();
  }

  function closeBoard() {
    document.removeEventListener('pointerdown', outside, true);
    if (_board) { try { _board.remove(); } catch (e) {} _board = null; }
  }

  /*@3.NOSJ5.3*/
  function openNative(anchor, current, cb) {
    var inp = document.createElement('input');
    inp.type = 'color';
    inp.value = norm(current) || '#7c3aed';
    var r = anchor ? anchor.getBoundingClientRect()
                   : { left: innerWidth / 2, bottom: innerHeight / 2, width: 0, height: 0 };
    inp.style.cssText = 'position:fixed;inline-size:' + Math.max(1, Math.round(r.width)) +
      'px;block-size:' + Math.max(1, Math.round(r.height)) + 'px;opacity:0;border:0;padding:0;' +
      'pointer-events:none;inset-block-start:' + Math.round(r.top) + 'px;' +
      'inset-inline-start:auto;left:' + Math.round(r.left) + 'px;z-index:2147483647';
    document.body.appendChild(inp);
    var done = false;
    function fire() {
      if (done) return;
      done = true;
      var v = norm(inp.value);
      if (v) cb(v);
      setTimeout(function () { try { inp.remove(); } catch (e) {} }, 0);
    }
    inp.addEventListener('change', fire);
    inp.addEventListener('blur', function () { setTimeout(fire, 120); });
    try { inp.click(); } catch (e) { try { inp.remove(); } catch (e2) {} }
    return inp;
  }

  /*@3.NOSJ5.4*/
  function bind(host, kind, apply, repaint) {
    if (!host) return;
    host.addEventListener('click', function (e) {
      var pin = e.target.closest('[data-pin]');
      if (pin) {
        e.preventDefault();
        e.stopPropagation();
        togglePin(kind, pin.getAttribute('data-pin'));
        if (repaint) repaint();
        return;
      }
      var sw = e.target.closest('[data-swatch]');
      if (sw) {
        e.preventDefault();
        e.stopPropagation();
        var hv = norm(sw.getAttribute('data-swatch'));
        if (hv) { push(kind, hv); apply(hv, true); }
        return;
      }
      var go = e.target.closest('[data-hexgo]');
      if (go) {
        e.preventDefault();
        e.stopPropagation();
        var fld = host.querySelector('[data-hexin]');
        var hx = norm(fld && fld.value);
        if (hx) { push(kind, hx); apply(hx, true); }
        else if (fld) { fld.setAttribute('aria-invalid', 'true'); fld.focus(); }
        return;
      }
      var eye = e.target.closest('[data-custom]');
      if (eye) {
        e.preventDefault();
        e.stopPropagation();
        _kind = kind;
        var seed = (host.querySelector('[data-hexin]') || {}).value;
        board(eye, seed, function (v, done) {
          if (done) push(kind, v);
          apply(v, done);
        });
      }
    });
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var fld = e.target.closest('[data-hexin]');
      if (!fld) return;
      e.preventDefault();
      var hx = norm(fld.value);
      if (hx) { push(kind, hx); apply(hx, true); }
      else fld.setAttribute('aria-invalid', 'true');
    });
    host.addEventListener('input', function (e) {
      var fld = e.target.closest('[data-hexin]');
      if (fld) fld.removeAttribute('aria-invalid');
    });
  }

  window.GardenSwatch = {
    norm: norm,
    list: all,
    push: push,
    togglePin: togglePin,
    html: html,
    bind: bind,
    board: board,
    closeBoard: closeBoard,
    openNative: openNative,
    MAX: MAX
  };
})();
