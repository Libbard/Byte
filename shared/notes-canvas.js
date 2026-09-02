;(function () {
  'use strict';

  var C = function () { return window.GardenInkCodec; };

  /*@3.NOCJ.78*/
  var TONES = {
    ink:     { dark: '#e5e7eb', light: '#111827' },
    red:     { dark: '#ff7a7a', light: '#d61f26' },
    orange:  { dark: '#ff9f45', light: '#e2600b' },
    yellow:  { dark: '#ffd94a', light: '#c99a00' },
    lime:    { dark: '#b8e34b', light: '#6a9c00' },
    emerald: { dark: '#3ddc8a', light: '#0a8f4d' },
    teal:    { dark: '#2fd8d0', light: '#00868f' },
    sky:     { dark: '#5ab8ff', light: '#1273cc' },
    indigo:  { dark: '#8b8cff', light: '#3b3ec7' },
    violet:  { dark: '#c78bff', light: '#8225c9' },
    pink:    { dark: '#ff85c0', light: '#cc177a' },
    brown:   { dark: '#c99274', light: '#8a5230' },
    amber:   { dark: '#fbbf24', light: '#b45309' },
    rose:    { dark: '#fb7185', light: '#be123c' },
    white:   { dark: '#ffffff', light: '#ffffff' },
    black:   { dark: '#000000', light: '#000000' }
  };

  /*@3.NOCJ.80*/
  var HI_TONES = {
    yellow:  { dark: '#ffe14d', light: '#ffe14d' },
    lime:    { dark: '#c3f14a', light: '#c3f14a' },
    emerald: { dark: '#7cf0b0', light: '#7cf0b0' },
    teal:    { dark: '#6cebe2', light: '#6cebe2' },
    sky:     { dark: '#8ad4ff', light: '#8ad4ff' },
    indigo:  { dark: '#a9aaff', light: '#a9aaff' },
    violet:  { dark: '#d9adff', light: '#d9adff' },
    pink:    { dark: '#ffa8d2', light: '#ffa8d2' },
    orange:  { dark: '#ffbc70', light: '#ffbc70' },
    red:     { dark: '#ff9d9d', light: '#ff9d9d' },
    amber:   { dark: '#ffd166', light: '#ffd166' },
    rose:    { dark: '#ffa3ba', light: '#ffa3ba' },
    brown:   { dark: '#e0bda6', light: '#e0bda6' },
    ink:     { dark: '#c9ccd4', light: '#c9ccd4' }
  };

  /*@3.NOCJ.11*/
  /*@3.NOCJ.100*/
  var NIBS = {
    round:  { scale: 1.00, min: 0.30, resp: 0.95, chisel: 0, round: 1,
              tw: 0.16, ov: 0.30 },
    fine:   { scale: 0.45, min: 0.78, resp: 0.30, chisel: 0, round: 1,
              tw: 0.10, ov: 0.22 },
    marker: { scale: 1.55, min: 1.00, resp: 0.00, chisel: 0, round: 1,
              tw: 0.34, ov: 0.55 },
    flat:   { scale: 1.30, min: 0.45, resp: 0.35, chisel: 1, round: 0,
              tw: 0.24, ov: 0 },
    /*@3.NOCJ.79*/
    pencil: { scale: 0.88, min: 0.46, resp: 0.58, chisel: 0, round: 1,
              grain: 1, speck: 3.0, spread: 1.15, dust: 0.46,
              tw: 0.95, ov: 0.85, tg: 1 },
    chalk:  { scale: 1.85, min: 0.74, resp: 0.24, chisel: 0, round: 0,
              grain: 1, speck: 4.2, spread: 1.35, dust: 0.30,
              tw: 0.70, ov: 0.75, tg: 1 }
  };
  var CHISEL_ANGLE = -Math.PI / 4;
  var TILT_MIN = 0.12;

  var SEL = '#10b981';

/*@3.NOCJ.31*/
  var _lightCache = null;

  var _paperOverride = null;

  /*@3.NOCJ.101*/
  var PAL_KEY = 'garden_ink_palette';
  var _palette = null;

  function paletteMode() {
    if (_palette === null) {
      var v = '';
      try { v = localStorage.getItem(PAL_KEY) || ''; } catch (e) {}
      _palette = (v === 'day' || v === 'night') ? v : '';
    }
    return _palette;
  }

  function setPalette(m) {
    var v = (m === 'day' || m === 'night') ? m : '';
    if (v === paletteMode()) return false;
    _palette = v;
    try { if (v) localStorage.setItem(PAL_KEY, v); else localStorage.removeItem(PAL_KEY); } catch (e) {}
    _lightCache = null;
    return true;
  }

  /*@3.NOCJ.34*/
  function setPaper(hex) {
    var v = (typeof hex === 'string' && hex.charAt(0) === '#') ? hex : null;
    if (v === _paperOverride) return false;
    _paperOverride = v;
    _lightCache = null;
    return true;
  }

  function docLum() {
    var cs = getComputedStyle(document.documentElement);
    var v = (cs.getPropertyValue('--bg-card') || '').trim() ||
            (cs.getPropertyValue('--bg-surface') || '').trim();
    if (!v) return null;
    if (v.charAt(0) === '#') {
      if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      if (v.length !== 7) return null;
      return relLum(v);
    }
    var m = v.match(/(-?[\d.]+)/g);
    if (!m || m.length < 3) return null;
    var f = function (n) {
      var x = Math.max(0, Math.min(1, parseFloat(n) / 255));
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
  }

  /*@3.NOCJ.35*/
  function paperLum() {
    return _paperOverride ? relLum(_paperOverride) : docLum();
  }

  /*@3.NOCJ.83*/
  var HI_DARK = 0.45;
  var HI_FLAT = 0.55;

  function themeIsLight() {
    var l = docLum();
    if (l == null) {
      try { return document.documentElement.getAttribute('data-theme') === 'light'; }
      catch (e) { return false; }
    }
    return l > 0.34;
  }

  function isLight() {
    if (_lightCache !== null) return _lightCache;
    var pm = paletteMode();
    if (pm) { _lightCache = (pm === 'day'); return _lightCache; }
    var out = false;
    try {
      var lum = paperLum();
      out = (lum == null)
        ? document.documentElement.getAttribute('data-theme') === 'light'
        : lum > 0.34;
    } catch (e) {}
    _lightCache = out;
    return out;
  }

  try {
    new MutationObserver(function () { _lightCache = null; })
      .observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'data-tinted'] });
  } catch (e) {}
  function relLum(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var f = function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  function mixHex(hex, towards, amount) {
    var n = parseInt(hex.slice(1), 16);
    var t = parseInt(towards.slice(1), 16);
    var out = 0, sh;
    for (sh = 16; sh >= 0; sh -= 8) {
      var a = (n >> sh) & 255, b = (t >> sh) & 255;
      out |= Math.round(a + (b - a) * amount) << sh;
    }
    return '#' + ('000000' + (out >>> 0).toString(16)).slice(-6);
  }

  /*@3.NOCJ.16*/
  function adaptHex(hex) {
    var lum = relLum(hex);
    if (isLight()) return lum > 0.62 ? mixHex(hex, '#000000', (lum - 0.62) / 0.38 * 0.62) : hex;
    return lum < 0.16 ? mixHex(hex, '#ffffff', (0.16 - lum) / 0.16 * 0.68) : hex;
  }

  function hexOf(name) {
    if (typeof name === 'string' && name.charAt(0) === '#' && name.length === 7) {
      return name.toLowerCase();
    }
    var c = TONES[name] || TONES.ink;
    return isLight() ? c.light : c.dark;
  }

  function hiHexOf(name) {
    if (typeof name === 'string' && name.charAt(0) === '#' && name.length === 7) {
      return name.toLowerCase();
    }
    var c = HI_TONES[name];
    if (!c) return hexOf(name);
    return isLight() ? c.light : c.dark;
  }

  function inkHex(el) {
    return el && el.hi ? hiHexOf(el.c) : hexOf(el.c);
  }

  /*@3.NOCJ.89*/
  function inkSafe(el) {
    var K = C();
    if (!K || typeof K.canCarry !== 'function' || K.canCarry(el.c)) return el.c;
    return inkHex(el);
  }
  function uid() {
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  var INK_KEY = 'garden_ink_last';

  /*@3.NOCJ.39*/
  /*@3.NOCJ.43*/
  var TOOL_DEF = {
    pen:   { color: 'ink',   width: 4,  nib: 'round' },
    pencil:{ color: 'ink',   width: 3,  nib: 'pencil' },
    hi:    { color: 'yellow', width: 26, nib: 'marker' },
    era:   { color: 'ink',   width: 12, nib: 'round' },
    sel:   { color: 'ink',   width: 4,  nib: 'round' },
    lasso: { color: 'ink',   width: 4,  nib: 'round' },
    hand:  { color: 'ink',   width: 4,  nib: 'round' }
  };

  function toolKey(t) { return TOOL_DEF[t] ? t : 'pen'; }

  function inkStore() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(INK_KEY) || 'null'); } catch (e) {}
    if (!o || typeof o !== 'object') return {};
    if (typeof o.color === 'string' || typeof o.width === 'number') return { pen: o };
    return o;
  }

  function lastInk(tool) {
    var k = toolKey(tool);
    var def = TOOL_DEF[k];
    var out = { color: def.color, width: def.width, nib: def.nib };
    var o = inkStore()[k];
    if (o && typeof o === 'object') {
      if (typeof o.color === 'string') out.color = o.color;
      if (typeof o.width === 'number' && o.width > 0) out.width = o.width;
      if (typeof o.nib === 'string' && NIBS[o.nib]) out.nib = o.nib;
    }
    return out;
  }

  /*@3.NOCJ.90*/
  var RESUME = { pen: 1, pencil: 1, hi: 1 };

  function lastTool() {
    var t = inkStore()._t;
    return (typeof t === 'string' && RESUME[t]) ? t : 'pen';
  }

  function keepTool(tool) {
    var k = toolKey(tool);
    if (!RESUME[k]) return;
    var all = inkStore();
    if (all._t === k) return;
    all._t = k;
    try { localStorage.setItem(INK_KEY, JSON.stringify(all)); } catch (e) {}
  }

  function keepInk(tool, patch) {
    var k = toolKey(tool);
    var all = inkStore();
    var cur = all[k] || lastInk(k);
    for (var p in patch) if (patch[p] != null) cur[p] = patch[p];
    all[k] = cur;
    try { localStorage.setItem(INK_KEY, JSON.stringify(all)); } catch (e) {}
  }


  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len2 = dx * dx + dy * dy;
    var t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    var qx = ax + t * dx, qy = ay + t * dy;
    return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
  }

  function pointInPoly(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /*@3.NOCJ.1*/
  function bboxOf(el) {
    if (el.ty === 'st') {
      var mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
      for (var i = 0; i < el.pts.length; i++) {
        var p = el.pts[i];
        if (p.x < mnx) mnx = p.x;
        if (p.y < mny) mny = p.y;
        if (p.x > mxx) mxx = p.x;
        if (p.y > mxy) mxy = p.y;
      }
      if (!isFinite(mnx)) return { x: 0, y: 0, w: 0, h: 0 };
      var pad = (el.w || 2) / 2;
      return { x: mnx - pad, y: mny - pad, w: (mxx - mnx) + pad * 2, h: (mxy - mny) + pad * 2 };
    }
    var x1 = Math.min(el.x1, el.x2), y1 = Math.min(el.y1, el.y2);
    return { x: x1, y: y1, w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
  }

  /*@3.NOCJ.54*/
  function boxOf(el) {
    if (!el._bb) {
      try {
        Object.defineProperty(el, '_bb',
          { value: bboxOf(el), writable: true, configurable: true, enumerable: false });
      } catch (e) { return bboxOf(el); }
    }
    return el._bb;
  }
  function dropBox(el) { if (el._bb) el._bb = null; }

  var ERASE = { TOL_PX: 8, RING_PX: 9,
                partR: function (w) { return Math.max(6, (w || 2) * 2.2); } };

  function unionBox(list) {
    var mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (var i = 0; i < list.length; i++) {
      var b = boxOf(list[i]);
      if (b.x < mnx) mnx = b.x;
      if (b.y < mny) mny = b.y;
      if (b.x + b.w > mxx) mxx = b.x + b.w;
      if (b.y + b.h > mxy) mxy = b.y + b.h;
    }
    if (!isFinite(mnx)) return null;
    return { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
  }

  function eachPoint(el, fn) {
    dropBox(el);
    if (el.ty === 'tx') {
      var m2 = fn(el.x + el.w / 2, el.y + el.h / 2);
      el.x = m2[0] - el.w / 2; el.y = m2[1] - el.h / 2;
      return;
    }
    if (el.ty === 'hl') {
      for (var q = 0; q < (el.r || []).length; q++) {
        var b = el.r[q];
        var m = fn(b.x + b.w / 2, b.y + b.h / 2);
        b.x = m[0] - b.w / 2; b.y = m[1] - b.h / 2;
      }
      return;
    }
    if (el.ty === 'st') {
      for (var i = 0; i < el.pts.length; i++) {
        var p = el.pts[i], r = fn(p.x, p.y);
        p.x = r[0]; p.y = r[1];
      }
      return;
    }
    var a = fn(el.x1, el.y1), b = fn(el.x2, el.y2);
    el.x1 = a[0]; el.y1 = a[1]; el.x2 = b[0]; el.y2 = b[1];
  }


  function Canvas(host, opts) {
    var o = opts || {};
    this.host = host;
    this.onChange = o.onChange || function () {};
    this.onState = o.onState || function () {};
    /*@3.NOCJ.19*/
    this.bound = !!o.bound;
    this.onScroll = o.onScroll || function () {};
    this.onWin = o.onWin || null;
    this.onPinch = o.onPinch || null;
    this.onBand = o.onBand || function () {};
    this.onAdd = o.onAdd || function () {};
    this.onTap = o.onTap || function () {};
    this.pick = false;
    this.hist = o.hist || null;
    this.host.__cv = this;

    this.els = [];
    this.sel = {};
    this.undoS = [];
    this.redoS = [];

    this.tool = lastTool();
    /*@3.NOCJ.40*/
    var seed = lastInk(this.tool);
    this.color = seed.color;
    /*@3.NOCJ.18*/
    this.width = seed.width;
    this.nib = seed.nib;
    this.opacity = 1;
    this.used = null;
    /*@3.NOCJ.23*/
    this.eraseMode = 'whole';
    this.hiStraight = 1;
    this.hiMode = 'text';
    this.snapText = (opts && opts.snapText) || null;

    this.cam = { x: 0, y: 0, z: 1 };
    this.fitZ = 1;
    this.userZ = 1;
    this.pageH = o.height || 360;
    this.expanded = false;
    this.winY = 0;
    this.winH = 0;
    this.live = {};
    this.lasso = null;
    this.drag = null;

    this.build();
    this.bindInput();
    this.bindHover();
    this.resize();

    var self = this;
    this._ro = (typeof ResizeObserver === 'function')
      ? new ResizeObserver(function () { self.resize(); }) : null;
    if (this._ro) this._ro.observe(this.wrap);
    this._themeObs = new MutationObserver(function () { self.paint(); });
    this._themeObs.observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'data-tinted'] });
  }

  Canvas.prototype.build = function () {
    this.wrap = document.createElement('div');
    this.wrap.className = 'nc-wrap';
    this.base = document.createElement('canvas');
    this.base.className = 'nc-base';
    this.wet = document.createElement('canvas');
    this.wet.className = 'nc-wet';
    this.wet.setAttribute('role', 'application');
    this.wet.setAttribute('tabindex', '0');
    this.wrap.appendChild(this.base);
    this.wrap.appendChild(this.wet);
    /*@3.NOCJ.57*/
    this.selbar = document.createElement('div');
    this.selbar.className = 'nc-selbar';
    this.selbar.hidden = true;
    var SB = [
      ['copy', 'fa-copy', '\u0646\u0633\u062e', 'Copy'],
      ['dup', 'fa-clone', '\u062a\u0643\u0631\u0627\u0631', 'Duplicate'],
      ['rot', 'fa-rotate', '\u062a\u062f\u0648\u064a\u0631 90\u00b0', 'Rotate 90\u00b0'],
      ['del', 'fa-trash', '\u062d\u0630\u0641', 'Delete']
    ];
    var selfB = this;
    SB.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nc-sb' + (it[0] === 'del' ? ' nc-sb--danger' : '');
      b.setAttribute('data-act', it[0]);
      b.setAttribute('aria-label', it[2]);
      b.setAttribute('data-ar-title', it[2]);
      b.setAttribute('data-en-title', it[3]);
      b.innerHTML = '<i class="fa-solid ' + it[1] + '" aria-hidden="true"></i>';
      selfB.selbar.appendChild(b);
    });
    this.selbar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    this.selbar.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      if (!btn) return;
      e.stopPropagation();
      var act = btn.getAttribute('data-act');
      if (act === 'copy') selfB.copySelected();
      else if (act === 'dup') selfB.duplicateSelected();
      else if (act === 'rot') selfB.rotateSelected(90);
      else if (act === 'del') selfB.deleteSelected();
    });
    this.wrap.appendChild(this.selbar);
    this.host.innerHTML = '';
    this.host.appendChild(this.wrap);
  };

  /*@3.NOCJ.41*/
  Canvas.prototype.vz = function () {
    var el = this.wrap;
    if (!el || !el.offsetWidth) return 1;
    var z = el.getBoundingClientRect().width / el.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  };

  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  /*@3.NOCJ.67*/
  function probeCanvas(c) {
    if (!c.width || !c.height) return false;
    /*@3.NOCJ.86*/
    var area = c.width * c.height;
    if (c.__okArea >= area) return true;
    try {
      var g = c.getContext('2d');
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#000';
      g.fillRect(c.width - 1, c.height - 1, 1, 1);
      var a = g.getImageData(c.width - 1, c.height - 1, 1, 1).data[3];
      g.clearRect(c.width - 1, c.height - 1, 1, 1);
      g.restore();
      if (a > 0) { c.__okArea = area; return true; }
      return false;
    } catch (e) { return true; }
  }

  Canvas.prototype.dpr = function (w, h) {
    var d = Math.min(4, Math.max(1, (window.devicePixelRatio || 1) * this.vz()));
    /*@3.NOCJ.53*/
    if (w > 0 && h > 0 && w * h * d * d > 24000000) {
      d = Math.max(0.75, Math.sqrt(24000000 / (w * h)));
    }
    return d;
  };

  /*@3.NOCJ.87*/
  Canvas.prototype.covers = function (vTop, vH) {
    if (vTop == null || !(vH > 0)) return true;
    var slack = Math.max(0, this.winH - vH);
    var m = Math.min(24, slack / 2);
    return this.winY <= vTop - m + 0.5 &&
           this.winY + this.winH >= vTop + vH + m - 0.5;
  };

  Canvas.prototype.resize = function () {
    /*@3.NOCJ.6*/
    this.wrap.style.blockSize = this.expanded ? '' : (this.pageH + 'px');
    var w = Math.max(1, Math.round(this.wrap.offsetWidth ||
                                   this.wrap.getBoundingClientRect().width));
    var full = Math.max(1, Math.round(this.expanded
      ? (this.wrap.offsetHeight || this.wrap.getBoundingClientRect().height)
      : this.pageH));
    var h = full;
    /*@3.NOCJ.51*/
    if (this.bound) {
      var vh = (window.visualViewport && window.visualViewport.height) ||
               window.innerHeight || 800;
      var vz = this.vz();
      this.winH = Math.min(full, Math.max(600, Math.ceil((vh / vz) * 2)));
      h = this.winH;
      if (this.winY > full - h) this.winY = Math.max(0, full - h);
    } else {
      this.winY = 0;
      this.winH = h;
    }
    var d = this.dpr(w, h);
    /*@3.NOCJ.66*/
    /*@3.NOCJ.69*/
    var maxB = IS_IOS ? 2800 : 4050;
    if (this.bound) {
      var cap = Math.floor(maxB / Math.max(0.5, d));
      if (h > cap) {
        h = Math.max(600, cap);
        this.winH = h;
        if (this.winY > full - h) this.winY = Math.max(0, full - h);
      }
    } else if (h * d > maxB || w * d > maxB) {
      d = Math.max(0.4, Math.min(maxB / h, maxB / w));
    }
    if (w === this.w && h === this.h && d === this._d && this._wy === this.winY) return;
    var self = this;
    /*@3.NOCJ.68*/
    function size(hh, dd) {
      [self.base, self.wet].forEach(function (c) {
        c.width = Math.round(w * dd);
        c.height = Math.round(hh * dd);
        c.style.width = w + 'px';
        c.style.height = hh + 'px';
        c.style.insetBlockStart = self.winY + 'px';
        var g = c.getContext('2d');
        g.setTransform(dd, 0, 0, dd, 0, 0);
      });
    }
    size(h, d);
    for (var t = 0; t < 3 && !probeCanvas(this.base); t++) {
      if (this.bound && h > 600) {
        h = Math.max(600, Math.floor(h * 0.7));
        this.winH = h;
        if (this.winY > full - h) this.winY = Math.max(0, full - h);
      } else {
        d = Math.max(0.4, d * 0.7);
      }
      size(h, d);
    }
    this.w = w; this.h = h; this._d = d; this._wy = this.winY;
    if (this.bound) { this.cam.x = 0; this.cam.y = -this.winY * this.cam.z; }
    if (this.bound && this.onWin) { try { this.onWin(); } catch (eW) {} }
    if (this.router) this.router.dropRect();
    this.paint();
  };

  /*@3.NOCJ.52*/
  Canvas.prototype.setWindow = function (y, vTop, vH) {
    if (!this.bound || !this.winH || this.winH >= this.pageH) return;
    var target = Math.max(0, Math.min(this.pageH - this.winH, Math.round(y)));
    if (Math.abs(target - this.winY) < 0.5) return;
    if (!this.covers(vTop, vH) || Math.abs(target - this.winY) >= this.winH * 0.2) {
      this.winY = target;
    } else return;
    this._wy = target;
    this.base.style.insetBlockStart = target + 'px';
    this.wet.style.insetBlockStart = target + 'px';
    this.cam.y = -target * this.cam.z;
    /*@3.NOCJ.64*/
    if (this.router) this.router.dropRect();
    this.paint();
  };


  Canvas.prototype.toWorld = function (p) {
    return { x: (p.x - this.cam.x) / this.cam.z, y: (p.y - this.cam.y) / this.cam.z };
  };
  Canvas.prototype.toScreen = function (p) {
    return { x: p.x * this.cam.z + this.cam.x, y: p.y * this.cam.z + this.cam.y };
  };

  /*@3.NOCJ.14*/
  /*@3.NOCJ.15*/
  Canvas.prototype.setFit = function (f) {
    var nf = Math.max(0.2, Math.min(4, f || 1));
    if (Math.abs(nf - this.fitZ) < 0.0005) return;
    var k = nf / (this.fitZ || 1);
    this.fitZ = nf;
    this.cam.z *= k;
    this.cam.x *= k;
    this.cam.y *= k;
    this.paint();
    this.emit();
  };

  Canvas.prototype.applyZoom = function () {
    var target = this.fitZ * this.userZ;
    var px = this.w / 2, py = this.h / 2;
    var wx = (px - this.cam.x) / this.cam.z;
    var wy = (py - this.cam.y) / this.cam.z;
    this.cam.z = target;
    this.cam.x = px - wx * target;
    this.cam.y = py - wy * target;
    this.paint();
    this.emit();
  };

  Canvas.prototype.setUserZoom = function (uz) {
    if (this.bound) return;
    var n = Math.max(0.25, Math.min(6, uz || 1));
    if (Math.abs(n - this.userZ) < 0.0005) return;
    this.userZ = n;
    this.applyZoom();
  };

  Canvas.prototype.resetZoom = function () {
    this.userZ = 1;
    this.cam.x = 0; this.cam.y = 0;
    this.cam.z = this.fitZ;
    this.paint();
    this.emit();
  };

  Canvas.prototype.setZoom = function (z, cx, cy) {
    if (this.bound) return;
    var nz = Math.max(0.25 * this.fitZ, Math.min(6 * this.fitZ, z));
    this.userZ = nz / (this.fitZ || 1);
    if (nz === this.cam.z) return;
    var px = (cx == null) ? this.w / 2 : cx;
    var py = (cy == null) ? this.h / 2 : cy;
    var wx = (px - this.cam.x) / this.cam.z;
    var wy = (py - this.cam.y) / this.cam.z;
    this.cam.z = nz;
    this.cam.x = px - wx * nz;
    this.cam.y = py - wy * nz;
    this.paint();
    this.emit();
  };

  Canvas.prototype.panBy = function (dx, dy) {
    this.cam.x += dx; this.cam.y += dy;
    this.paint();
  };

  /*@3.NOCJ.17*/
  Canvas.prototype.resetView = function () {
    this.resetZoom();
  };


  /*@3.NOCJ.65*/
  var CORNER_COS = 0.25;
  var CORNER_MIN_SEG = 0.8;

  function cornerFlags(pts) {
    var out = new Array(pts.length);
    for (var i = 1; i < pts.length - 1; i++) {
      var ax = pts[i].x - pts[i - 1].x, ay = pts[i].y - pts[i - 1].y;
      var bx = pts[i + 1].x - pts[i].x, by = pts[i + 1].y - pts[i].y;
      var la = Math.sqrt(ax * ax + ay * ay), lb = Math.sqrt(bx * bx + by * by);
      if (la < CORNER_MIN_SEG || lb < CORNER_MIN_SEG) continue;
      if ((ax * bx + ay * by) / (la * lb) < CORNER_COS) out[i] = 1;
    }
    return out;
  }

  /*@3.NOCJ.12*/
  function smoothPts(pts) {
    var once = smoothOnce(pts);
    return (once.length > 5) ? smoothOnce(once) : once;
  }

  function smoothOnce(pts) {
    if (pts.length < 3) return pts;
    var corner = cornerFlags(pts);
    var out = [pts[0]];
    for (var i = 1; i < pts.length - 1; i++) {
      if (corner[i]) {
        out.push(pts[i]);
        out.push(pts[i]);
        continue;
      }
      /*@3.NOCJ.103*/
      var o = {
        x: (pts[i - 1].x + pts[i].x * 2 + pts[i + 1].x) / 4,
        y: (pts[i - 1].y + pts[i].y * 2 + pts[i + 1].y) / 4,
        p: (pts[i - 1].p + pts[i].p * 2 + pts[i + 1].p) / 4
      };
      if (pts[i].tz != null) {
        o.tz = (pts[i - 1].tz + pts[i].tz * 2 + pts[i + 1].tz) / 4;
        o.ax = (pts[i - 1].ax + pts[i].ax * 2 + pts[i + 1].ax) / 4;
        o.ay = (pts[i - 1].ay + pts[i].ay * 2 + pts[i + 1].ay) / 4;
      }
      out.push(o);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  var MIN_DIR = 1.0;

  function dirsOf(pts) {
    var out = new Array(pts.length), i, first = -1;
    for (i = 0; i < pts.length; i++) {
      var prev = pts[Math.max(0, i - 1)];
      var next = pts[Math.min(pts.length - 1, i + 1)];
      var dx = next.x - prev.x, dy = next.y - prev.y;
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DIR) { out[i] = null; continue; }
      out[i] = Math.atan2(dy, dx);
      if (first < 0) first = i;
    }
    if (first < 0) { for (i = 0; i < out.length; i++) out[i] = 0; return out; }
    for (i = first - 1; i >= 0; i--) out[i] = out[first];
    for (i = first + 1; i < out.length; i++) if (out[i] == null) out[i] = out[i - 1];
    return out;
  }

  /*@3.NOCJ.27*/
  /*@3.NOCJ.92*/
  var ONSET_N = 6, ONSET_W = 3.5, ONSET_TH = 0.62;

  function medPress(pts) {
    var a = [], i;
    for (i = 0; i < pts.length; i++) a.push(pts[i].p);
    a.sort(function (x, y) { return x - y; });
    return a[a.length >> 1];
  }

  function holdEnds(pts, base) {
    var n = pts.length;
    if (n < 3) return pts;
    var pr = medPress(pts);
    if (!(pr > 0)) return pts;
    var lim = pr * ONSET_TH;
    var span = Math.max(2, base * ONSET_W);
    var i, k, d, steps;

    /*@3.NOCJ.93*/
    pts[0].p = pts[1].p;
    pts[n - 1].p = pts[n - 2].p;

    d = 0; k = 0; steps = 0;
    while (k < n - 1 && pts[k].p < lim && steps < ONSET_N && d < span) {
      d += Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].y - pts[k].y);
      k++; steps++;
    }
    for (i = 0; i < k; i++) pts[i].p = pts[k].p;

    d = 0; k = n - 1; steps = 0;
    while (k > 0 && pts[k].p < lim && steps < ONSET_N && d < span) {
      d += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
      k--; steps++;
    }
    for (i = n - 1; i > k; i--) pts[i].p = pts[k].p;
    return pts;
  }

  /*@3.NOCJ.114*/
  function widthAt(base, nib, pr, ang, pt) {
    var w = base * nib.scale * (nib.min + nib.resp * pr);
    var lean = (pt && pt.ln) || 0;
    if (lean > 0 && nib.tw) w *= (1 + nib.tw * lean);
    if (nib.chisel) {
      /*@3.NOCJ.109*/
      var d = Math.abs(Math.sin(ang - (lean > 0 ? pt.eg : CHISEL_ANGLE)));
      /*@3.NOCJ.110*/
      var lo = 0.18 * (1 - 0.72 * lean);
      w *= (lo + (1 - lo) * d);
    } else if (lean > 0 && nib.ov) {
      /*@3.NOCJ.111*/
      var k = nib.ov * lean;
      /*@3.NOCJ.112*/
      w *= (1 - k * 0.5) + k * Math.abs(Math.cos(ang - pt.eg));
    }
    return Math.max(0.35, w);
  }

  /*@3.NOCJ.102*/
  function leanOf(pts) {
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      if (q.tz == null) continue;
      q.ln = Math.max(0, (q.tz - TILT_MIN) / (1 - TILT_MIN));
      if (q.ln > 0) q.eg = Math.atan2(q.ay, q.ax) + Math.PI / 2;
    }
  }

  /*@3.NOCJ.106*/
  function tiltPt(x, y, src) {
    var o = { x: x, y: y, p: src.p };
    if (src.tz != null) { o.tz = src.tz; o.az = src.az || 0; }
    return o;
  }

  /*@3.NOCJ.105*/
  function fillTilt(pts) {
    var n = pts.length, i, last = null;
    for (i = 0; i < n; i++) {
      if (pts[i].tz != null) { last = pts[i]; continue; }
      if (last) { pts[i].tz = last.tz; pts[i].ax = last.ax; pts[i].ay = last.ay; }
    }
    last = null;
    for (i = n - 1; i >= 0; i--) {
      if (pts[i].tz != null) { last = pts[i]; continue; }
      if (last) { pts[i].tz = last.tz; pts[i].ax = last.ax; pts[i].ay = last.ay; }
    }
  }

  /*@3.NOCJ.46*/
  function grainAt(i) {
    var n = Math.sin(i * 12.9898) * 43758.5453;
    return 0.82 + 0.36 * (n - Math.floor(n));
  }

  /*@3.NOCJ.74*/
  function inkGeom(el, k, map) {
    var nib = NIBS[el.nib] || NIBS.round;
    var sc = k || 1;
    var base = (el.w || 2) * sc;
    var raw = [], i, list = el.pts || [], tilted = 0;
    for (i = 0; i < list.length; i++) {
      var p = list[i];
      var px = (p && p.x != null) ? p.x : (p && p[0]);
      var py = (p && p.y != null) ? p.y : (p && p[1]);
      if (px == null || py == null) continue;
      var q = map ? map(px, py) : { x: px * sc, y: py * sc };
      var r = { x: q.x, y: q.y, p: (p && p.p != null) ? p.p : 0.55 };
      /*@3.NOCJ.104*/
      if (p && p.tz != null) {
        var a0 = p.az || 0;
        r.tz = p.tz; r.ax = Math.cos(a0); r.ay = Math.sin(a0);
        tilted = 1;
      }
      raw.push(r);
    }
    if (!raw.length) return null;
    if (tilted) fillTilt(raw);
    var pts = smoothPts(holdEnds(raw, base));
    if (tilted) leanOf(pts);
    var alpha = (el.o == null ? 1 : el.o) *
                (nib.speck ? (1 - (nib.dust || 0.4)) : (nib.grain ? 0.72 : 1));
    if (el.hi) alpha *= isLight() ? HI_FLAT : (HI_DARK * HI_FLAT * 2);
    if (pts.length === 1) {
      return { kind: 'dot', alpha: alpha, grain: !!nib.grain,
               x: pts[0].x, y: pts[0].y,
               r: Math.max(0.4, widthAt(base, nib, pts[0].p, 0, pts[0]) / 2) };
    }
    /*@3.NOCJ.28*/
    /*@3.NOCJ.107*/
    if (!nib.resp && !nib.chisel && !tilted) {
      return { kind: 'line', alpha: alpha, grain: false, pts: pts,
               w: Math.max(0.5, widthAt(base, nib, 1, 0)) };
    }
    var angs = dirsOf(pts), left = [], right = [];
    for (i = 0; i < pts.length; i++) {
      var ang = angs[i];
      var hw = widthAt(base, nib, pts[i].p, ang, pts[i]) / 2;
      if (nib.grain) hw *= grainAt(i);
      var nx = -Math.sin(ang) * hw, ny = Math.cos(ang) * hw;
      left.push({ x: pts[i].x + nx, y: pts[i].y + ny });
      right.push({ x: pts[i].x - nx, y: pts[i].y - ny });
    }
    var caps = null;
    if (nib.round) {
      var lastI = pts.length - 1;
      caps = [{ x: pts[0].x, y: pts[0].y,
                r: Math.max(0.3, widthAt(base, nib, pts[0].p, angs[0], pts[0]) / 2) },
              { x: pts[lastI].x, y: pts[lastI].y,
                r: Math.max(0.3, widthAt(base, nib, pts[lastI].p, angs[lastI],
                                         pts[lastI]) / 2) }];
    }
    var spk = null;
    if (nib.speck) spk = speckle(pts, angs, base, nib);
    return { kind: 'blob', alpha: alpha, grain: !!nib.grain,
             left: left, right: right, caps: caps, speck: spk,
             dust: nib.dust || 0 };
  }

  var SPECK_MAX = 2600;

  /*@3.NOCJ.108*/
  function speckle(pts, angs, base, nib) {
    var out = [], i, j;
    var per = nib.speck || 3;
    var cap = SPECK_MAX;
    for (i = 0; i < pts.length && out.length < cap; i++) {
      var lean = pts[i].ln || 0;
      var hw = widthAt(base, nib, pts[i].p, angs[i], pts[i]) / 2;
      if (hw < 0.25) continue;
      var ang = angs[i] || 0;
      var nx = -Math.sin(ang), ny = Math.cos(ang);
      var n = Math.max(1, Math.round(per * (0.45 + 0.55 * pts[i].p) *
                                     (1 + (nib.tg ? 0.5 : 0) * lean)));
      for (j = 0; j < n; j++) {
        var h1 = rnd(i * 7.13 + j * 3.71);
        var h2 = rnd(i * 2.37 + j * 9.19 + 5.5);
        var h3 = rnd(i * 5.51 + j * 1.93 + 11.2);
        var t = (h1 * 2 - 1) * ((nib.spread || 1) * (1 + 0.45 * lean));
        var d = t * hw;
        out.push({
          x: pts[i].x + nx * d + (h2 - 0.5) * hw * 0.5,
          y: pts[i].y + ny * d + (h3 - 0.5) * hw * 0.5,
          r: Math.max(0.22, hw * (0.16 + 0.24 * h3)),
          a: Math.max(0.06, (1 - Math.min(1, Math.abs(t))) * 0.72 + 0.12)
        });
      }
    }
    return out.length ? out : null;
  }

  function rnd(seed) {
    var n = Math.sin(seed * 12.9898) * 43758.5453;
    return n - Math.floor(n);
  }

  /*@3.NOCJ.75*/
  function smoothInto(pts, api) {
    api.move(pts[0].x, pts[0].y);
    if (pts.length === 1) { api.line(pts[0].x + 0.01, pts[0].y); return; }
    for (var i = 1; i < pts.length - 1; i++) {
      api.quad(pts[i].x, pts[i].y,
               (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    }
    api.line(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }

  function backInto(pts, api) {
    for (var i = pts.length - 2; i >= 0; i--) {
      api.quad(pts[i + 1].x, pts[i + 1].y,
               (pts[i + 1].x + pts[i].x) / 2, (pts[i + 1].y + pts[i].y) / 2);
    }
    api.line(pts[0].x, pts[0].y);
  }

  function inkEmit(geom, api) {
    if (!geom) return;
    if (geom.kind === 'dot') { api.circle(geom.x, geom.y, geom.r); return; }
    if (geom.kind === 'line') { smoothInto(geom.pts, api); return; }
    smoothInto(geom.left, api);
    api.line(geom.right[geom.right.length - 1].x, geom.right[geom.right.length - 1].y);
    backInto(geom.right, api);
    api.close();
  }

  var SPECK_STEPS = 10;

  function shifted(api, dx, dy) {
    return {
      move: function (x, y) { api.move(x + dx, y + dy); },
      line: function (x, y) { api.line(x + dx, y + dy); },
      quad: function (cx, cy, x, y) { api.quad(cx + dx, cy + dy, x + dx, y + dy); },
      close: function () { api.close(); },
      circle: function (x, y, r) { api.circle(x + dx, y + dy, r); }
    };
  }

  /*@3.NOCJ.95*/
  function inkPaints(geom) {
    if (!geom) return [];
    if (geom.kind === 'dot') {
      return [{ fill: 1, alpha: geom.alpha, emit: function (api) {
        api.circle(geom.x, geom.y, geom.r);
      } }];
    }
    if (geom.kind === 'line') {
      return [{ fill: 0, alpha: geom.alpha, w: geom.w, emit: function (api) {
        smoothInto(geom.pts, api);
      } }];
    }
    var out = [{ fill: 1, alpha: geom.alpha, emit: function (api) {
      inkEmit(geom, api);
    } }];
    /*@3.NOCJ.96*/
    if (geom.speck && geom.speck.length) {
      var dust = geom.dust ? (1 - geom.dust * 0.4) : 1;
      var bins = {}, i, sp, lv;
      for (i = 0; i < geom.speck.length; i++) {
        sp = geom.speck[i];
        lv = Math.max(1, Math.min(SPECK_STEPS, Math.round(sp.a * SPECK_STEPS)));
        (bins[lv] || (bins[lv] = [])).push(sp);
      }
      for (lv = 1; lv <= SPECK_STEPS; lv++) {
        if (!bins[lv]) continue;
        out.push({ fill: 1, alpha: geom.alpha * (lv / SPECK_STEPS) * dust,
          list: bins[lv], emit: (function (list) {
            return function (api) {
              for (var q = 0; q < list.length; q++) api.circle(list[q].x, list[q].y, list[q].r);
            };
          }(bins[lv])) });
      }
    } else if (geom.grain) {
      out.push({ fill: 1, alpha: geom.alpha * 0.34, emit: function (api) {
        inkEmit(geom, shifted(api, 0.45, 0.45));
      } });
    }
    /*@3.NOCJ.97*/
    if (geom.caps) {
      out.push({ fill: 1, alpha: geom.alpha, emit: function (api) {
        for (var c = 0; c < geom.caps.length; c++) {
          api.circle(geom.caps[c].x, geom.caps[c].y, geom.caps[c].r);
        }
      } });
    }
    return out;
  }

  /*@3.NOCJ.2*/
  Canvas.prototype.paintStroke = function (g, el) {
    var self = this;
    var geom = inkGeom(el, this.cam.z, function (x, y) { return self.toScreen({ x: x, y: y }); });
    if (!geom) return;
    var lay = inkPaints(geom);
    if (!lay.length) return;
    g.save();
    g.fillStyle = inkHex(el);
    g.strokeStyle = inkHex(el);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    var api = {
      move: function (x, y) { g.moveTo(x, y); },
      line: function (x, y) { g.lineTo(x, y); },
      quad: function (cx, cy, x, y) { g.quadraticCurveTo(cx, cy, x, y); },
      close: function () { g.closePath(); },
      circle: function (x, y, r) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
    };
    /*@3.NOCJ.76*/
    for (var q = 0; q < lay.length; q++) {
      var pa = lay[q];
      g.globalAlpha = Math.max(0, Math.min(1, pa.alpha));
      g.beginPath();
      pa.emit(api);
      if (pa.fill) g.fill();
      else { g.lineWidth = pa.w; g.stroke(); }
    }
    g.restore();
  };

  Canvas.prototype.paintShape = function (g, el) {
    var a = this.toScreen({ x: el.x1, y: el.y1 });
    var b = this.toScreen({ x: el.x2, y: el.y2 });
    g.save();
    g.globalAlpha = el.o == null ? 1 : el.o;
    g.strokeStyle = hexOf(el.c);
    g.fillStyle = hexOf(el.c);
    g.lineWidth = Math.max(0.6, (el.w || 2) * this.cam.z);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    if (el.ty === 'rect') {
      g.beginPath();
      g.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      if (el.fill) { g.globalAlpha = (el.o == null ? 1 : el.o) * 0.18; g.fill(); g.globalAlpha = el.o == null ? 1 : el.o; }
      g.stroke();
    } else if (el.ty === 'ell') {
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      g.beginPath();
      g.ellipse(cx, cy, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      if (el.fill) { g.globalAlpha = (el.o == null ? 1 : el.o) * 0.18; g.fill(); g.globalAlpha = el.o == null ? 1 : el.o; }
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      if (el.ty === 'arr') {
        var ang = Math.atan2(b.y - a.y, b.x - a.x);
        var hl = Math.max(8, (el.w || 2) * 3.4) * this.cam.z;
        g.beginPath();
        g.moveTo(b.x, b.y);
        g.lineTo(b.x - hl * Math.cos(ang - 0.42), b.y - hl * Math.sin(ang - 0.42));
        g.moveTo(b.x, b.y);
        g.lineTo(b.x - hl * Math.cos(ang + 0.42), b.y - hl * Math.sin(ang + 0.42));
        g.stroke();
      }
    }
    g.restore();
  };

  Canvas.prototype.paintEl = function (g, el) {
    if (el.ty === 'st') this.paintStroke(g, el);
    else this.paintShape(g, el);
  };

  Canvas.prototype.paint = function () {
    if (!this.w) return;
    var g = this.base.getContext('2d');
    g.clearRect(0, 0, this.w, this.h);
    var z = this.cam.z || 1;
    var x0 = (0 - this.cam.x) / z, x1 = (this.w - this.cam.x) / z;
    var y0 = (0 - this.cam.y) / z, y1 = (this.h - this.cam.y) / z;
    for (var i = 0; i < this.els.length; i++) {
      var el = this.els[i];
      var b = boxOf(el);
      if (b.x > x1 || b.x + b.w < x0 || b.y > y1 || b.y + b.h < y0) continue;
      this.paintEl(g, el);
    }
    this.paintWet();
  };

  /*@3.NOCJ.60*/
  Canvas.prototype.wetTick = function () {
    if (this._wetQ) return;
    var self = this;
    this._wetQ = requestAnimationFrame(function () {
      self._wetQ = 0;
      self.paintWet();
    });
  };

  /*@3.NOCJ.3*/
  Canvas.prototype.paintWet = function () {
    if (!this.w) return;
    var g = this.wet.getContext('2d');
    g.clearRect(0, 0, this.w, this.h);
    for (var id in this.live) if (this.live[id]) this.paintEl(g, this.live[id]);

    if (this.lasso && this.lasso.length > 1) {
      g.save();
      g.strokeStyle = SEL;
      g.setLineDash([5, 4]);
      g.lineWidth = 1.4;
      g.beginPath();
      var p0 = this.toScreen(this.lasso[0]);
      g.moveTo(p0.x, p0.y);
      for (var k = 1; k < this.lasso.length; k++) {
        var pk = this.toScreen(this.lasso[k]);
        g.lineTo(pk.x, pk.y);
      }
      g.closePath();
      g.stroke();
      g.restore();
    }

    var picked = this.selected();
    if (picked.length) {
      var bb = unionBox(picked);
      if (bb) {
        var a = this.toScreen({ x: bb.x, y: bb.y });
        var b = this.toScreen({ x: bb.x + bb.w, y: bb.y + bb.h });
        g.save();
        g.strokeStyle = SEL;
        g.lineWidth = 1.2;
        g.setLineDash([4, 3]);
        g.strokeRect(a.x - 4, a.y - 4, (b.x - a.x) + 8, (b.y - a.y) + 8);
        g.setLineDash([]);
        g.fillStyle = SEL;
        var hs = 7;
        var hx = b.x + 4 - hs / 2, hy = b.y + 4 - hs / 2;
        g.fillRect(hx, hy, hs, hs);
        this._handle = { x: hx, y: hy, s: hs, box: bb };
        /*@3.NOCJ.49*/
        var rx = (a.x + b.x) / 2, ry = a.y - 18;
        g.beginPath();
        g.moveTo(rx, a.y - 4);
        g.lineTo(rx, ry + 5);
        g.strokeStyle = SEL;
        g.stroke();
        g.beginPath();
        g.arc(rx, ry, 5.5, 0, Math.PI * 2);
        g.fill();
        this._rotor = { x: rx, y: ry, r: 9, box: bb };
        g.restore();
        if (this.selbar) {
          var sx = Math.max(80, Math.min(this.w - 80, Math.round((a.x + b.x) / 2)));
          var sy = a.y - 78;
          if (sy < 6) sy = Math.min(this.h - 8, b.y + 16);
          this.selbar.hidden = false;
          this.selbar.style.left = sx + 'px';
          this.selbar.style.top = Math.round(sy + (this.winY || 0)) + 'px';
        }
      }
    } else {
      this._handle = null; this._rotor = null;
      if (this.selbar) this.selbar.hidden = true;
    }

/*@3.NOCJ.29*/
    if (this.tool === 'era' && this.hover) {
      var rr = (this.eraseMode === 'part')
        ? ERASE.partR(this.width) * this.cam.z
        : ERASE.RING_PX;
      g.save();
      g.beginPath();
      g.arc(this.hover.x, this.hover.y, rr, 0, Math.PI * 2);
      if (this.eraseMode !== 'part') g.setLineDash([4, 3]);
      g.strokeStyle = 'rgba(0,0,0,.5)';
      g.lineWidth = 3.2;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.95)';
      g.lineWidth = 1.4;
      g.stroke();
      g.restore();
    }
  };


  Canvas.prototype.snapshot = function () { return JSON.stringify(this.els); };

  Canvas.prototype.push = function (before) {
    this.undoS.push(before);
    if (this.hist) this.hist.note('ink');
    if (this.undoS.length > 80) this.undoS.shift();
    this.redoS.length = 0;
  };

  Canvas.prototype.undo = function () {
    if (!this.undoS.length) return false;
    this.redoS.push(this.snapshot());
    this.els = JSON.parse(this.undoS.pop());
    this.sel = {};
    this.paint(); this.commit(); this.emit();
    return true;
  };

  Canvas.prototype.redo = function () {
    if (!this.redoS.length) return false;
    this.undoS.push(this.snapshot());
    this.els = JSON.parse(this.redoS.pop());
    this.sel = {};
    this.paint(); this.commit(); this.emit();
    return true;
  };

  Canvas.prototype.clear = function () {
    if (!this.els.length) return;
    this.push(this.snapshot());
    this.els = [];
    this.sel = {};
    this.paint(); this.commit(); this.emit();
  };

  Canvas.prototype.selected = function () {
    var out = [];
    for (var i = 0; i < this.els.length; i++) if (this.sel[this.els[i].id]) out.push(this.els[i]);
    return out;
  };

  Canvas.prototype.selectAll = function () {
    this.sel = {};
    for (var i = 0; i < this.els.length; i++) this.sel[this.els[i].id] = 1;
    this.paintWet(); this.emit();
  };

  Canvas.prototype.deselect = function () {
    this.sel = {};
    /*@3.NOCJ.59*/
    /*@3.NOCJ.70*/
    if (this.tool === 'sel' && !this.pick) this.setTool('pen');
    this.paintWet(); this.emit();
  };

  Canvas.prototype.deleteSelected = function () {
    var picked = this.selected();
    if (!picked.length) return false;
    this.push(this.snapshot());
    var self = this;
    this.els = this.els.filter(function (e) { return !self.sel[e.id]; });
    this.sel = {};
    /*@3.NOCJ.71*/
    if (this.tool === 'sel' && !this.pick) this.setTool('pen');
    this.paint(); this.commit(); this.emit();
    return true;
  };

  Canvas.prototype.duplicateSelected = function () {
    var picked = this.selected();
    if (!picked.length) return false;
    this.push(this.snapshot());
    this.sel = {};
    for (var i = 0; i < picked.length; i++) {
      var copy = JSON.parse(JSON.stringify(picked[i]));
      copy.id = uid();
      eachPoint(copy, function (x, y) { return [x + 14, y + 14]; });
      this.els.push(copy);
      this.sel[copy.id] = 1;
    }
    this.paint(); this.commit(); this.emit();
    return true;
  };

  /*@3.NOCJ.9*/
  /*@3.NOCJ.58*/
  var INKCLIP_KEY = 'garden_notes_inkclip';
  function inkClipStore(list) {
    try {
      var raw = JSON.stringify(list || []);
      if (raw.length < 400000) localStorage.setItem(INKCLIP_KEY, raw);
    } catch (e) {}
  }
  function inkClipLoad() {
    try { return JSON.parse(localStorage.getItem(INKCLIP_KEY) || 'null') || []; }
    catch (e) { return []; }
  }
  function inkClipAny() {
    try { return (localStorage.getItem(INKCLIP_KEY) || '').length > 2; }
    catch (e) { return false; }
  }

  Canvas.prototype.copySelected = function () {
    var picked = this.selected();
    if (!picked.length) return false;
    this.clip = JSON.parse(JSON.stringify(picked));
    inkClipStore(this.clip);
    this.emit();
    return true;
  };

  Canvas.prototype.cutSelected = function () {
    if (!this.copySelected()) return false;
    return this.deleteSelected();
  };

  Canvas.prototype.paste = function (at) {
    if (!this.clip || !this.clip.length) this.clip = inkClipLoad();
    if (!this.clip || !this.clip.length) return false;
    this.push(this.snapshot());
    var bb = unionBox(this.clip);
    var dx = 18, dy = 18;
    if (at && bb) { dx = at.x - bb.x; dy = at.y - bb.y; }
    this.sel = {};
    for (var i = 0; i < this.clip.length; i++) {
      var copy = JSON.parse(JSON.stringify(this.clip[i]));
      copy.id = uid();
      eachPoint(copy, function (x, y) { return [x + dx, y + dy]; });
      this.els.push(copy);
      this.sel[copy.id] = 1;
    }
    this.setTool('sel');
    this.paint(); this.commit(); this.emit();
    return true;
  };

  /*@3.NOCJ.10*/
  Canvas.prototype.rotateSelected = function (deg) {
    var picked = this.selected();
    if (!picked.length) return false;
    var bb = unionBox(picked);
    if (!bb) return false;
    this.push(this.snapshot());
    var cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
    var a = (deg || 90) * Math.PI / 180;
    var cos = Math.cos(a), sin = Math.sin(a);
    for (var i = 0; i < picked.length; i++) {
      eachPoint(picked[i], function (x, y) {
        var ox = x - cx, oy = y - cy;
        return [cx + ox * cos - oy * sin, cy + ox * sin + oy * cos];
      });
    }
    this.paint(); this.commit(); this.emit();
    return true;
  };

  Canvas.prototype.styleSelected = function (patch) {
    var picked = this.selected();
    if (!picked.length) return false;
    this.push(this.snapshot());
    for (var i = 0; i < picked.length; i++) {
      Object.assign(picked[i], patch);
      dropBox(picked[i]);
    }
    this.paint(); this.commit(); this.emit();
    return true;
  };

  /*@3.NOCJ.4*/
  Canvas.prototype.hit = function (wp) {
    var tol = ERASE.TOL_PX / this.cam.z;
    for (var i = this.els.length - 1; i >= 0; i--) {
      var el = this.els[i];
      if (el.ty === 'st') {
        var d = tol + (el.w || 2) / 2;
        var hb = boxOf(el);
        if (wp.x < hb.x - tol || wp.x > hb.x + hb.w + tol ||
            wp.y < hb.y - tol || wp.y > hb.y + hb.h + tol) continue;
        for (var k = 1; k < el.pts.length; k++) {
          if (segDist(wp.x, wp.y, el.pts[k - 1].x, el.pts[k - 1].y, el.pts[k].x, el.pts[k].y) <= d) return el;
        }
        if (el.pts.length === 1 &&
            segDist(wp.x, wp.y, el.pts[0].x, el.pts[0].y, el.pts[0].x, el.pts[0].y) <= d) return el;
      } else {
        var b = bboxOf(el);
        if (el.fill && wp.x >= b.x - tol && wp.x <= b.x + b.w + tol &&
            wp.y >= b.y - tol && wp.y <= b.y + b.h + tol) return el;
        if (el.ty === 'line' || el.ty === 'arr') {
          if (segDist(wp.x, wp.y, el.x1, el.y1, el.x2, el.y2) <= tol + (el.w || 2) / 2) return el;
        } else {
          var near = Math.abs(wp.x - b.x) <= tol || Math.abs(wp.x - (b.x + b.w)) <= tol ||
                     Math.abs(wp.y - b.y) <= tol || Math.abs(wp.y - (b.y + b.h)) <= tol;
          var inBand = wp.x >= b.x - tol && wp.x <= b.x + b.w + tol &&
                       wp.y >= b.y - tol && wp.y <= b.y + b.h + tol;
          if (near && inBand) return el;
        }
      }
    }
    return null;
  };

  Canvas.prototype.eraseAt = function (wp) {
    var el = this.hit(wp);
    if (!el) return false;
    if (!this._eraseBefore) this._eraseBefore = this.snapshot();
    this.els = this.els.filter(function (e) { return e !== el; });
    delete this.sel[el.id];
    this.paint();
    return true;
  };

  /*@3.NOCJ.24*/
  Canvas.prototype.erasePart = function (wp, r) {
    var rad = r || ERASE.partR(this.width);
    var out = [], hitAny = false;
    for (var i = 0; i < this.els.length; i++) {
      var el = this.els[i];
      if (el.ty !== 'st') {
        var bb = bboxOf(el);
        if (wp.x >= bb.x - rad && wp.x <= bb.x + bb.w + rad &&
            wp.y >= bb.y - rad && wp.y <= bb.y + bb.h + rad && this.hit(wp) === el) {
          hitAny = true;
          continue;
        }
        out.push(el);
        continue;
      }
      var runs = [], cur = [];
      for (var k = 0; k < el.pts.length; k++) {
        var pt = el.pts[k];
        var dx = pt.x - wp.x, dy = pt.y - wp.y;
        if (dx * dx + dy * dy <= rad * rad) {
          hitAny = true;
          if (cur.length > 1) runs.push(cur);
          cur = [];
        } else {
          cur.push(pt);
        }
      }
      if (cur.length > 1) runs.push(cur);
      if (runs.length === 1 && runs[0].length === el.pts.length) { out.push(el); continue; }
      for (var j = 0; j < runs.length; j++) {
        var copy = {};
        for (var key in el) copy[key] = el[key];
        copy.id = uid();
        copy.pts = runs[j];
        out.push(copy);
      }
    }
    if (!hitAny) return false;
    if (!this._eraseBefore) this._eraseBefore = this.snapshot();
    this.els = out;
    this.sel = {};
    this.paint();
    return true;
  };

  Canvas.prototype.deleteInWorldRect = function (r) {
    this.lassoPick([{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y },
                    { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }]);
    var n = this.selected().length;
    if (n) this.deleteSelected();
    return n;
  };

  Canvas.prototype.deleteInScreenRect = function (r) {
    var a = this.toWorld({ x: r.x, y: r.y });
    var b = this.toWorld({ x: r.x + r.w, y: r.y + r.h });
    this.lassoPick([{ x: a.x, y: a.y }, { x: b.x, y: a.y },
                    { x: b.x, y: b.y }, { x: a.x, y: b.y }]);
    var n = this.selected().length;
    if (n) this.deleteSelected();
    return n;
  };

  function worldBox(poly) {
    var mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (var i = 0; i < poly.length; i++) {
      var p = poly[i];
      if (p.x < mnx) mnx = p.x;
      if (p.y < mny) mny = p.y;
      if (p.x > mxx) mxx = p.x;
      if (p.y > mxy) mxy = p.y;
    }
    if (!isFinite(mnx)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
  }

  Canvas.prototype.screenBox = function (poly) {
    var mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (var i = 0; i < poly.length; i++) {
      var p = this.toScreen(poly[i]);
      if (p.x < mnx) mnx = p.x;
      if (p.y < mny) mny = p.y;
      if (p.x > mxx) mxx = p.x;
      if (p.y > mxy) mxy = p.y;
    }
    if (!isFinite(mnx)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
  };

  Canvas.prototype.lassoPick = function (poly) {
    this.sel = {};
    for (var i = 0; i < this.els.length; i++) {
      var el = this.els[i];
      var b = bboxOf(el);
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      var inside = pointInPoly(cx, cy, poly);
      if (!inside && el.ty === 'st') {
        for (var k = 0; k < el.pts.length; k += 2) {
          if (pointInPoly(el.pts[k].x, el.pts[k].y, poly)) { inside = true; break; }
        }
      }
      if (inside) this.sel[el.id] = 1;
    }
  };

  /*@3.NOCJ.22*/
  Canvas.prototype.contentBox = function () { return unionBox(this.els); };

  Canvas.prototype.contentH = function () {
    var bb = unionBox(this.els);
    return bb ? Math.max(0, bb.y + bb.h) : 0;
  };

  Canvas.prototype.growIfNeeded = function () {
    if (this.bound || this.expanded) return false;
    var bb = unionBox(this.els);
    if (!bb) return false;
    var need = Math.ceil((bb.y + bb.h) * this.cam.z + this.cam.y) + 60;
    if (need > this.pageH) {
      this.pageH = Math.min(4000, need);
      this.w = 0;
      this.resize();
      return true;
    }
    return false;
  };


  /*@3.NOCJ.88*/
  Canvas.prototype.commit = function (quiet) {
    var self = this;
    var strokes = this.els.filter(function (e) { return e.ty === 'st'; });
    var shapes = this.els.filter(function (e) { return e.ty !== 'st'; });
    /*@3.NOCJ.45*/
    return C().pack(strokes.map(function (e) {
      return { tool: e.hi ? 'hi' : 'pen', color: inkSafe(e), w: e.w, nib: e.nib, o: e.o, pts: e.pts };
    })).then(function (packed) {
      self.onChange({ ink: packed, shapes: shapes, w: self.w, h: self.pageH,
                      ch: Math.round(self.contentH()) }, quiet);
      return packed;
    });
  };

  /*@3.NOCJ.77*/
  Canvas.prototype.shiftY = function (regs) {
    if (!regs || !regs.length || !this.els.length) return 0;
    var moved = 0;
    function byOf(y) {
      var d = 0;
      for (var r = 0; r < regs.length; r++) {
        if (regs[r].from <= y) d = regs[r].by; else break;
      }
      return d;
    }
    for (var i = 0; i < this.els.length; i++) {
      var hit = 0;
      eachPoint(this.els[i], function (x, y) {
        var d = byOf(y);
        if (d) hit = 1;
        return [x, y + d];
      });
      moved += hit;
    }
    if (!moved) return 0;
    this.growIfNeeded();
    this.paint();
    this.commit(true);
    return moved;
  };

  Canvas.prototype.mapEl = function (el, ox, oy, nx, ny, s) {
    eachPoint(el, function (x, y) { return [nx + (x - ox) * s, ny + (y - oy) * s]; });
    if (s !== 1 && typeof el.w === 'number') el.w = Math.max(0.4, el.w * s);
  };

  Canvas.prototype.load = function (packed, h, shapes) {
    var self = this;
    if (h) this.pageH = h;
    this.els = [];
    if (Array.isArray(shapes)) {
      for (var i = 0; i < shapes.length; i++) {
        var s = shapes[i];
        if (!s.id) s.id = uid();
        this.els.push(s);
      }
    }
    if (!packed) { this.w = 0; this.resize(); this.paint(); return Promise.resolve(); }
    return C().unpack(packed).then(function (strokes) {
      for (var k = 0; k < strokes.length; k++) {
        var st = strokes[k];
        self.els.push({
          id: uid(), ty: 'st', c: st.color || 'ink', w: st.w || 2.4,
          nib: st.nib || 'round', o: st.tool === 'hi' ? 0.32 : (st.o == null ? 1 : st.o),
          hi: st.tool === 'hi' ? 1 : 0, pts: st.pts
        });
      }
      self.w = 0;
      self.resize();
      self.paint();
    });
  };


  /*@3.NOCJ.26*/
  function snapHi(cv, st) {
    var pts = st.pts;
    if (!pts || pts.length < 2) return false;
    var x0 = pts[0].x, x1 = pts[0].x, y0 = pts[0].y, y1 = pts[0].y, i;
    for (i = 1; i < pts.length; i++) {
      if (pts[i].x < x0) x0 = pts[i].x;
      if (pts[i].x > x1) x1 = pts[i].x;
      if (pts[i].y < y0) y0 = pts[i].y;
      if (pts[i].y > y1) y1 = pts[i].y;
    }
    if (x1 - x0 < 4 && y1 - y0 < 4) return false;
    var line = null;
    try { line = cv.snapText({ x0: x0, x1: x1, y0: y0, y1: y1 }); } catch (e) { return false; }
    if (!line || !(line.h > 2) || !(line.x1 - line.x0 > 2)) return false;
    var ax, bx;
    /*@3.NOCJ.81*/
    if (line.sx1 - line.sx0 > 2) { ax = line.sx0; bx = line.sx1; }
    else {
      ax = Math.max(x0, line.x0); bx = Math.min(x1, line.x1);
      if (bx - ax < 3) { ax = line.x0; bx = line.x1; }
    }
    var my = line.y + line.h / 2;
    st.w = Math.max(6, line.h * 0.86);
    st.nib = 'marker';
    st.pts = [{ x: ax, y: my, p: 0.6 }, { x: bx, y: my, p: 0.6 }];
    return true;
  }

  function straighten(st) {
    var pts = st.pts;
    if (!pts || pts.length < 2) return;
    var a = pts[0], b = pts[pts.length - 1];
    var dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
    var n = pts.length, i, sum = 0;
    if (dx >= dy) {
      for (i = 0; i < n; i++) sum += pts[i].y;
      var my = sum / n;
      for (i = 0; i < n; i++) { pts[i].y = my; pts[i].p = 0.6; }
    } else {
      for (i = 0; i < n; i++) sum += pts[i].x;
      var mx = sum / n;
      for (i = 0; i < n; i++) { pts[i].x = mx; pts[i].p = 0.6; }
    }
  }

/*@3.NOCJ.30*/
  Canvas.prototype.bindHover = function () {
    var self = this;
    this._hover = function (e) {
      if (self.tool !== 'era') {
        if (self.hover) { self.hover = null; self.paintWet(); }
        return;
      }
      var r = self.wet.getBoundingClientRect();
      /*@3.NOCJ.55*/
      var hz = (self.wet.offsetWidth && r.width / self.wet.offsetWidth) || 1;
      if (!isFinite(hz) || hz <= 0.05) hz = 1;
      self.hover = { x: (e.clientX - r.left) / hz, y: (e.clientY - r.top) / hz };
      self.paintWet();
    };
    this._hoverOut = function () {
      if (!self.hover) return;
      self.hover = null;
      self.paintWet();
    };
    this.wet.addEventListener('pointermove', this._hover);
    this.wet.addEventListener('pointerdown', this._hover);
    this.wet.addEventListener('pointerleave', this._hoverOut);
    this.wet.addEventListener('pointercancel', this._hoverOut);
  };

  Canvas.prototype.setPick = function (on) {
    this.pick = !!on;
    if (this.pick) this.setTool('sel');
  };

  Canvas.prototype.setEraseMode = function (m) {
    this.eraseMode = (m === 'part') ? 'part' : 'whole';
    this.emit();
  };

  Canvas.prototype.setStraight = function (on) {
    this.hiStraight = on ? 1 : 0;
    if (this.hiMode !== 'text') this.hiMode = on ? 'line' : 'free';
    this.emit();
  };

  Canvas.prototype.setHiMode = function (m) {
    var v = (m === 'line' || m === 'free') ? m : 'text';
    this.hiMode = v;
    this.hiStraight = (v === 'free') ? 0 : 1;
    this.emit();
  };

  /*@3.NOCJ.32*/
  /*@3.NOCJ.44*/
  Canvas.prototype.toggleAct = function (act) { return this.mods().toggle(act); };

  /*@3.NOCJ.48*/
  Canvas.prototype.mods = function () {
    if (this._mods) return this._mods;
    var self = this;
    this._mods = window.GardenInkInput.mods({
      getTool: function () { return self.tool; },
      setTool: function (t) { self.setTool(t); },
      getEraseMode: function () { return self.eraseMode; },
      setEraseMode: function (m) { self.eraseMode = m; },
      hasSelection: function () { return !!self.selected().length; },
      onChange: function () { self.emit(); }
    });
    return this._mods;
  };

  Canvas.prototype.useMod = function (act) { return this.mods().begin(act); };

  Canvas.prototype.beginMod = function (act) { return this.mods().begin(act); };

  /*@3.NOCJ.36*/
  Canvas.prototype.endMod = function (info) {
    this.mods().end(info);
    this._modDid = false;
  };

  Canvas.prototype.setTool = function (t) {
    if (t !== 'era' && this.hover) this.hover = null;
    var from = toolKey(this.tool), to = toolKey(t);
    if (from !== to) {
      keepInk(from, { color: this.color, width: this.width, nib: this.nib });
      var want = lastInk(to);
      this.color = want.color;
      this.width = want.width;
      this.nib = want.nib;
    }
    this.tool = t;
    keepTool(t);
    if (t !== 'sel' && t !== 'lasso') { this.sel = {}; this.paintWet(); }
    this.wrap.setAttribute('data-tool', t);
    this.emit();
  };
  Canvas.prototype.setColor = function (c) {
    this.color = c;
    keepInk(this.tool, { color: c });
    if (this.selected().length) this.styleSelected({ c: c });
    this.emit();
  };
  Canvas.prototype.setWidth = function (w) {
    this.width = w;
    keepInk(this.tool, { width: w });
    if (this.selected().length) this.styleSelected({ w: w });
    this.emit();
  };
  Canvas.prototype.setNib = function (n) {
    this.nib = n;
    keepInk(this.tool, { nib: n });
    if (this.selected().length) this.styleSelected({ nib: n });
    this.emit();
  };

  Canvas.prototype.emit = function () {
    this.onState({
      tool: this.tool, color: this.color, width: this.width, nib: this.nib,
      eraseMode: this.eraseMode, straight: this.hiStraight, hiMode: this.hiMode,
      zoom: this.userZ, fit: this.fitZ, selection: this.selected().length,
      canUndo: this.hist ? this.hist.canUndo() : !!this.undoS.length,
      canRedo: this.hist ? this.hist.canRedo() : !!this.redoS.length,
      canPaste: !!((this.clip && this.clip.length) || inkClipAny()),
      expanded: this.expanded, count: this.els.length, used: this.used || null
    });
  };

  Canvas.prototype.expand = function (on) {
    this.expanded = !!on;
    this.wrap.setAttribute('data-expanded', this.expanded ? '1' : '0');
    document.documentElement.classList.toggle('nc-locked', this.expanded);
    this.w = 0;
    var self = this;
    setTimeout(function () { self.resize(); self.emit(); }, 0);
  };


  Canvas.prototype.bindInput = function () {
    var self = this;
    this.router = window.GardenInkInput.create({
      el: this.wet,
      mode: function () { return self.tool === 'hand' ? 'pan' : 'draw'; },
      onEndMod: function (info) { self.endMod(info); },

      onBegin: function (id, pt, ptype, act) {
        if (act) { self.beginMod(act); self._modDid = false; }
        var wp = self.toWorld(pt);
        if (self.tool === 'era') {
          self._eraseBefore = null;
          var gone = (self.eraseMode === 'part') ? self.erasePart(wp) : self.eraseAt(wp);
          /*@3.NOCJ.38*/
          if (gone) self._modDid = true;
          self.live[id] = null;
          self._erasing = self._erasing || {};
          self._erasing[id] = 1;
          return;
        }
        if (self.tool === 'lasso') { self.lasso = [wp]; return; }
        if (self.tool === 'sel') {
          /*@3.NOCJ.50*/
          var ro = self._rotor;
          if (ro && Math.abs(pt.x - ro.x) <= ro.r && Math.abs(pt.y - ro.y) <= ro.r) {
            var cw = { x: ro.box.x + ro.box.w / 2, y: ro.box.y + ro.box.h / 2 };
            self.drag = { kind: 'spin', c: cw, a0: Math.atan2(wp.y - cw.y, wp.x - cw.x),
                          before: self.snapshot(),
                          orig: JSON.parse(JSON.stringify(self.selected())) };
            return;
          }
          var el = self.hit(wp);
          if (self._handle && pt.x >= self._handle.x - 6 && pt.x <= self._handle.x + self._handle.s + 6 &&
              pt.y >= self._handle.y - 6 && pt.y <= self._handle.y + self._handle.s + 6) {
            self.drag = { kind: 'scale', from: wp, box: self._handle.box, before: self.snapshot(),
                          orig: JSON.parse(JSON.stringify(self.selected())) };
            return;
          }
          /*@3.NOCJ.20*/
          var bb = self._handle ? self._handle.box : null;
          var pad = 6 / Math.max(0.05, self.cam.z);
          var inBox = !!bb && wp.x >= bb.x - pad && wp.x <= bb.x + bb.w + pad &&
                              wp.y >= bb.y - pad && wp.y <= bb.y + bb.h + pad;
          if (inBox) {
            self.drag = { kind: 'move', from: wp, before: self.snapshot() };
          } else if (el) {
            self.sel = {}; self.sel[el.id] = 1;
            self.drag = { kind: 'move', from: wp, before: self.snapshot() };
          } else {
            self.sel = {};
            self.drag = { kind: 'band', from: wp };
          }
          self.paintWet(); self.emit();
          return;
        }
        /*@3.NOCJ.5*/
        if (self.tool === 'rect' || self.tool === 'ell' ||
            self.tool === 'line' || self.tool === 'arr') {
          self.live[id] = { id: uid(), ty: self.tool, c: self.color, w: self.width,
                            o: self.opacity, fill: 0,
                            x1: wp.x, y1: wp.y, x2: wp.x, y2: wp.y };
          self.paintWet();
          return;
        }
        var hi = self.tool === 'hi';
        self.live[id] = {
          id: uid(), ty: 'st', c: self.color, w: hi ? self.width / NIBS.marker.scale : self.width,
          /*@3.NOCJ.82*/
          nib: hi ? 'marker' : self.nib, o: hi ? 0.8 : self.opacity, hi: hi ? 1 : 0,
          pts: [tiltPt(wp.x, wp.y, pt)]
        };
        self.paintWet();
      },

      onMove: function (id, pts) {
        if (self._erasing && self._erasing[id]) {
          for (var e = 0; e < pts.length; e++) {
            var ew = self.toWorld(pts[e]);
            if (self.eraseMode === 'part') self.erasePart(ew);
            else self.eraseAt(ew);
          }
          return;
        }
        if (self.tool === 'lasso' && self.lasso) {
          for (var l = 0; l < pts.length; l++) self.lasso.push(self.toWorld(pts[l]));
          self.wetTick();
          return;
        }
        if (self.drag) {
          var wp = self.toWorld(pts[pts.length - 1]);
          if (self.drag.kind === 'move') {
            var dx = wp.x - self.drag.from.x, dy = wp.y - self.drag.from.y;
            self.drag.from = wp;
            var picked = self.selected();
            for (var m = 0; m < picked.length; m++) {
              eachPoint(picked[m], function (x, y) { return [x + dx, y + dy]; });
            }
            self.paint();
          } else if (self.drag.kind === 'scale') {
            var box = self.drag.box;
            var sx = Math.max(0.08, (wp.x - box.x) / Math.max(1e-6, box.w));
            var sy = Math.max(0.08, (wp.y - box.y) / Math.max(1e-6, box.h));
            var orig = self.drag.orig;
            var live2 = self.selected();
            for (var s2 = 0; s2 < live2.length; s2++) {
              var src = orig[s2];
              if (!src) continue;
              var tgt = live2[s2];
              if (tgt.ty === 'st') {
                for (var q = 0; q < tgt.pts.length; q++) {
                  tgt.pts[q].x = box.x + (src.pts[q].x - box.x) * sx;
                  tgt.pts[q].y = box.y + (src.pts[q].y - box.y) * sy;
                }
              } else {
                tgt.x1 = box.x + (src.x1 - box.x) * sx;
                tgt.y1 = box.y + (src.y1 - box.y) * sy;
                tgt.x2 = box.x + (src.x2 - box.x) * sx;
                tgt.y2 = box.y + (src.y2 - box.y) * sy;
              }
            }
            self.paint();
          } else if (self.drag.kind === 'spin') {
            var d = self.drag;
            var ang = Math.atan2(wp.y - d.c.y, wp.x - d.c.x) - d.a0;
            var cs = Math.cos(ang), sn = Math.sin(ang);
            var live3 = self.selected();
            for (var s3 = 0; s3 < live3.length; s3++) {
              var src3 = d.orig[s3];
              if (!src3) continue;
              var tgt3 = live3[s3];
              var turn = function (x, y) {
                var dx3 = x - d.c.x, dy3 = y - d.c.y;
                return [d.c.x + dx3 * cs - dy3 * sn, d.c.y + dx3 * sn + dy3 * cs];
              };
              if (tgt3.ty === 'st') {
                for (var q3 = 0; q3 < tgt3.pts.length; q3++) {
                  var r3 = turn(src3.pts[q3].x, src3.pts[q3].y);
                  tgt3.pts[q3].x = r3[0]; tgt3.pts[q3].y = r3[1];
                }
              } else {
                var p1 = turn(src3.x1, src3.y1), p2 = turn(src3.x2, src3.y2);
                tgt3.x1 = p1[0]; tgt3.y1 = p1[1]; tgt3.x2 = p2[0]; tgt3.y2 = p2[1];
              }
            }
            self.paint();
          } else if (self.drag.kind === 'band') {
            self.drag.to = wp;
            var a = self.drag.from, b = wp;
            self.lassoPick([{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }, { x: a.x, y: b.y }]);
            self.wetTick();
          }
          return;
        }
        var st = self.live[id];
        if (!st) return;
        if (st.ty !== 'st') {
          var w2 = self.toWorld(pts[pts.length - 1]);
          st.x2 = w2.x; st.y2 = w2.y;
          self.wetTick();
          return;
        }
        /*@3.NOCJ.61*/
        var minD = 0.5 / Math.max(0.05, self.cam.z);
        for (var i = 0; i < pts.length; i++) {
          var w3 = self.toWorld(pts[i]);
          var lp = st.pts[st.pts.length - 1];
          var tdx = w3.x - lp.x, tdy = w3.y - lp.y;
          if (tdx * tdx + tdy * tdy < minD * minD &&
              Math.abs((pts[i].p || 0) - (lp.p || 0)) < 0.05) continue;
          st.pts.push(tiltPt(w3.x, w3.y, pts[i]));
        }
        self.wetTick();
      },

      onEnd: function (id, keep) {
        if (self._erasing && self._erasing[id]) {
          delete self._erasing[id];
          if (self._eraseBefore) { self.push(self._eraseBefore); self._eraseBefore = null; self.commit(); self.emit(); }
          return;
        }
        if (self.tool === 'lasso' && self.lasso) {
          if (keep && self.lasso.length > 2) {
            self.lassoPick(self.lasso);
            /*@3.NOCJ.56*/
            self.onBand(worldBox(self.lasso));
          }
          self.lasso = null;
          /*@3.NOCJ.8*/
          /*@3.NOCJ.73*/
          if (self.selected().length || self.pick) self.setTool('sel');
          else self.setTool('pen');
          self.paintWet(); self.emit();
          return;
        }
        if (self.drag) {
          var d = self.drag;
          self.drag = null;
          if (d.kind === 'band') {
            /*@3.NOCJ.85*/
            if (d.to) {
              if (keep) {
                self.onBand({ x: Math.min(d.from.x, d.to.x), y: Math.min(d.from.y, d.to.y),
                              w: Math.abs(d.to.x - d.from.x), h: Math.abs(d.to.y - d.from.y) });
              }
            } else if (keep || self.pick) {
              self.onTap({ x: d.from.x, y: d.from.y });
            }
          }
          if (d.before && keep) { self.push(d.before); self.commit(); }
          /*@3.NOCJ.72*/
          if (self.tool === 'sel' && !self.selected().length && !self.pick) self.setTool('pen');
          self.paintWet(); self.emit();
          return;
        }
        var st = self.live[id];
        delete self.live[id];
        if (!st) { self.paintWet(); return; }
        if (!keep) { self.paintWet(); return; }
        if (st.ty === 'st' && st.pts.length < 1) { self.paintWet(); return; }
        /*@3.NOCJ.25*/
        if (st.ty === 'st' && st.hi) {
          var snapped = false;
          if (self.hiMode === 'text' && self.snapText) snapped = snapHi(self, st);
          if (!snapped && self.hiMode !== 'free') straighten(st);
        }
        if (st.ty !== 'st' &&
            Math.abs(st.x2 - st.x1) < 2 && Math.abs(st.y2 - st.y1) < 2) {
          self.paintWet(); return;
        }
        self.push(self.snapshot());
        self.els.push(st);
        /*@3.NOCJ.99*/
        if (st.ty === 'st') {
          self.used = { tool: st.hi ? 'hi' : 'pen', color: self.color,
                        width: self.width, nib: st.nib || self.nib,
                        straight: st.hi ? (self.hiStraight ? 1 : 0) : 0 };
        }
        self.onAdd(st);
        self.growIfNeeded();
        /*@3.NOCJ.7*/
        if (st.ty !== 'st') {
          self.sel = {};
          self.sel[st.id] = 1;
          self.setTool('sel');
        }
        self.paint();
        self.commit();
        self.emit();
      },

      /*@3.NOCJ.21*/
      onGesture: function (phase, d) {
        if (phase === 'end' || !d.n) {
          /*@3.NOCJ.63*/
          if (self._g && self._g.n > 1 && self.bound && self.onPinch) self.onPinch('end');
          self._g = null;
          return;
        }
        var prev = self._g;
        var keep = { n: d.n, x: d.x, y: d.y, cx: d.cx, cy: d.cy, d: d.d };
        if (!prev || prev.n !== d.n) {
          if (self.bound && self.onPinch) {
            if (prev && prev.n > 1 && d.n <= 1) self.onPinch('end');
            if (d.n > 1) self.onPinch('begin', 1, d.cx || 0, d.cy || 0);
          }
          self._g = keep;
          return;
        }
        /*@3.NOCJ.42*/
        if (self.bound) {
          /*@3.NOCJ.62*/
          if (d.n > 1 && prev.d && d.d && self.onPinch) {
            self.onPinch('move', d.d / Math.max(1e-3, prev.d), d.cx || 0, d.cy || 0);
          } else {
            self.onScroll((d.cx || 0) - (prev.cx || 0), (d.cy || 0) - (prev.cy || 0));
          }
          self._g = keep;
          return;
        }
        var dx = d.x - prev.x, dy = d.y - prev.y;
        self.panBy(dx, dy);
        if (d.n > 1) self.setZoom(self.cam.z * (d.d / Math.max(1e-3, prev.d)), d.x, d.y);
        self._g = keep;
      }
    });

    /*@3.NOCJ.47*/
    this._wheel = function (e) {
      if (self.bound) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        var r = self.wet.getBoundingClientRect();
        self.setZoom(self.cam.z * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - r.left, e.clientY - r.top);
        return;
      }
      var k = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? self.h : 1);
      var dx = -e.deltaX * k, dy = -e.deltaY * k;
      if (e.shiftKey && !e.deltaX) { dx = dy; dy = 0; }
      if (!dx && !dy) return;
      e.preventDefault();
      self.panBy(dx, dy);
    };
    this.wet.addEventListener('wheel', this._wheel, { passive: false });

    this._key = function (e) {
      if (e.defaultPrevented) return;
      if (!self.expanded && !self.pick && document.activeElement !== self.wet) return;
      var mod = e.ctrlKey || e.metaKey;
      var I = window.GardenInkInput;
      var k = (I && I.keyOf) ? I.keyOf(e) : String(e.key || '').toLowerCase();
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); if (self.hist) self.hist.undo(); else self.undo(); }
      else if (mod && (k === 'y' || (e.shiftKey && k === 'z'))) { e.preventDefault(); if (self.hist) self.hist.redo(); else self.redo(); }
      else if (mod && k === 'a') { e.preventDefault(); self.selectAll(); }
      else if (mod && k === 'd') { e.preventDefault(); self.duplicateSelected(); }
      else if (mod && k === 'c') { if (self.selected().length) { e.preventDefault(); self.copySelected(); } }
      else if (mod && k === 'x') { if (self.selected().length) { e.preventDefault(); self.cutSelected(); } }
      else if (mod && k === 'v') { if (self.clip && self.clip.length) { e.preventDefault(); self.paste(); } }
      else if (!mod && k === 'r') { if (self.selected().length) { e.preventDefault(); self.rotateSelected(e.shiftKey ? -15 : 15); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (self.selected().length) { e.preventDefault(); self.deleteSelected(); }
      } else if (e.key === 'Escape') {
        if (self.expanded) { e.preventDefault(); self.expand(false); }
        else self.deselect();
      }
    };
    document.addEventListener('keydown', this._key);
  };

  Canvas.prototype.destroy = function () {
    if (this._hover) {
      this.wet.removeEventListener('pointermove', this._hover);
      this.wet.removeEventListener('pointerdown', this._hover);
      this.wet.removeEventListener('pointerleave', this._hoverOut);
      this.wet.removeEventListener('pointercancel', this._hoverOut);
    }
    if (this.router) this.router.destroy();
    if (this._ro) this._ro.disconnect();
    if (this._themeObs) this._themeObs.disconnect();
    this.wet.removeEventListener('wheel', this._wheel);
    document.removeEventListener('keydown', this._key);
    document.documentElement.classList.remove('nc-locked');
  };

  /*@3.NOCJ.13*/
  function n1(v) { return Math.round(v * 10) / 10; }

  function toSvg(els, w, h, opts) {
    var hx = (opts && typeof opts.hex === 'function') ? opts.hex : hexOf;
    var parts = (els || []).map(function (el) {
      var col = el.hi ? hiHexOf(el.c) : hx(el.c);
      var op = el.o == null ? 1 : el.o;
      if (el.ty === 'st') {
        var geom = inkGeom(el, (opts && opts.scale) || 1);
        if (!geom) return '';
        var d = [];
        var api = {
          move: function (X, Y) { d.push('M' + n1(X) + ' ' + n1(Y)); },
          line: function (X, Y) { d.push('L' + n1(X) + ' ' + n1(Y)); },
          quad: function (cx, cy, X, Y) {
            d.push('Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(X) + ' ' + n1(Y));
          },
          close: function () { d.push('Z'); },
          circle: function (X, Y, R) {
            d.push('M' + n1(X - R) + ' ' + n1(Y) + 'a' + n1(R) + ' ' + n1(R) +
                   ' 0 1 0 ' + n1(R * 2) + ' 0a' + n1(R) + ' ' + n1(R) +
                   ' 0 1 0 ' + n1(-R * 2) + ' 0Z');
          }
        };
        /*@3.NOCJ.98*/
        return inkPaints(geom).map(function (pa) {
          d = [];
          pa.emit(api);
          if (!d.length) return '';
          if (!pa.fill) {
            return '<path d="' + d.join(' ') + '" fill="none" stroke="' + col +
              '" stroke-width="' + n1(pa.w) + '" stroke-linecap="round" ' +
              'stroke-linejoin="round" opacity="' + n1(pa.alpha) + '"/>';
          }
          return '<path d="' + d.join(' ') + '" fill="' + col +
            '" fill-rule="nonzero" stroke="none" opacity="' + n1(pa.alpha) + '"/>';
        }).join('');
      }
      var x = Math.min(el.x1, el.x2), y = Math.min(el.y1, el.y2);
      var ww = Math.abs(el.x2 - el.x1), hh = Math.abs(el.y2 - el.y1);
      if (el.ty === 'rect') {
        return '<rect x="' + x + '" y="' + y + '" width="' + ww + '" height="' + hh +
          '" fill="none" stroke="' + col + '" stroke-width="' + (el.w || 2) + '" opacity="' + op + '"/>';
      }
      if (el.ty === 'ell') {
        return '<ellipse cx="' + (x + ww / 2) + '" cy="' + (y + hh / 2) + '" rx="' + (ww / 2) +
          '" ry="' + (hh / 2) + '" fill="none" stroke="' + col + '" stroke-width="' + (el.w || 2) +
          '" opacity="' + op + '"/>';
      }
      return '<line x1="' + el.x1 + '" y1="' + el.y1 + '" x2="' + el.x2 + '" y2="' + el.y2 +
        '" stroke="' + col + '" stroke-width="' + (el.w || 2) + '" stroke-linecap="round" opacity="' + op + '"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (w || 100) + ' ' + (h || 100) +
      '" width="' + (w || 100) + '" height="' + (h || 100) + '">' + parts.join('') + '</svg>';
  }

  window.GardenCanvas = {
    mount: function (host, opts) { return new Canvas(host, opts); },
    hexOf: hexOf,
    lastTool: lastTool,
    hiHexOf: hiHexOf,
    TONES: TONES,
    HI_TONES: HI_TONES,
    NIBS: NIBS,
    inkPaints: inkPaints,
    snapHi: snapHi,
    straighten: straighten,
    toSvg: toSvg,
    inkGeom: inkGeom,
    inkEmit: inkEmit,
    isLight: isLight,
    setPaper: setPaper,
    setPalette: setPalette,
    paletteMode: paletteMode,
    /*@3.NOCJ.113*/
    paperHex: function () { return _paperOverride; },
    themeIsLight: themeIsLight,
    /*@3.NOCJ.91*/
    mixHex: mixHex,
    adaptHex: adaptHex,
    lumOf: function (hex) {
      try { return relLum(hex); } catch (e) { return null; }
    },
    bboxOf: bboxOf,
    segDist: segDist,
    pointInPoly: pointInPoly,
    eachPoint: eachPoint,
    unionBox: unionBox,
    ERASE: ERASE,
    clip: { store: inkClipStore, load: inkClipLoad, any: inkClipAny }
  };
})();
