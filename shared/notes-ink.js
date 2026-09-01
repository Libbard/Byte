/*@3.NOIJ.1*/
;(function () {
  'use strict';

  var C = function () { return window.GardenInkCodec; };

  var GROW_STEP = 240;
  var MAX_H = 4000;
  var PALM_KEY = 'garden_ink_palm';

  var INK_COLORS = {
    ink: { dark: '#e5e7eb', light: '#111827' },
    amber: { dark: '#fbbf24', light: '#b45309' },
    rose: { dark: '#fb7185', light: '#be123c' },
    violet: { dark: '#a78bfa', light: '#6d28d9' },
    emerald: { dark: '#34d399', light: '#047857' },
    sky: { dark: '#38bdf8', light: '#0369a1' },
    lime: { dark: '#a3e635', light: '#4d7c0f' },
    orange: { dark: '#fb923c', light: '#c2410c' },
    red: { dark: '#f87171', light: '#b91c1c' },
    pink: { dark: '#f472b6', light: '#be185d' },
    teal: { dark: '#2dd4bf', light: '#0f766e' },
    indigo: { dark: '#818cf8', light: '#4338ca' }
  };

  function isLight() {
    try { return document.documentElement.getAttribute('data-theme') === 'light'; }
    catch (e) { return false; }
  }

  function hexOf(name) {
    var c = INK_COLORS[name] || INK_COLORS.ink;
    return isLight() ? c.light : c.dark;
  }

  function palmMode() {
    try { return localStorage.getItem(PALM_KEY) || 'auto'; }
    catch (e) { return 'auto'; }
  }

  function Ink(host, opts) {
    var o = opts || {};
    this.host = host;
    this.onChange = o.onChange || function () {};
    this.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.tool = 'pen';
    this.color = 'ink';
    this.width = 2;
    this.penSeen = false;
    this.lastPenAt = 0;
    this.pMax = 0.5;
    this.live = {};
    this.h = o.height || GROW_STEP;

    this.wrap = document.createElement('div');
    this.wrap.className = 'ink-wrap';
    /*@3.NOIJ.4*/
    this.base = document.createElement('canvas');
    this.base.className = 'ink-c ink-base';
    this.wet = document.createElement('canvas');
    this.wet.className = 'ink-c ink-wet';
    this.wrap.appendChild(this.base);
    this.wrap.appendChild(this.wet);
    host.appendChild(this.wrap);

    this.bind();
    this.resize();
  }

  Ink.prototype.dpr = function () {
    return Math.min(window.devicePixelRatio || 1, 2.5);
  };

  Ink.prototype.resize = function () {
    var w = this.wrap.clientWidth || this.host.clientWidth || 320;
    var d = this.dpr();
    this.w = w;
    [this.base, this.wet].forEach(function (c) {
      c.width = Math.round(w * d);
      c.height = Math.round(this.h * d);
      c.style.width = w + 'px';
      c.style.height = this.h + 'px';
      var g = c.getContext('2d');
      g.setTransform(d, 0, 0, d, 0, 0);
      g.lineCap = 'round';
      g.lineJoin = 'round';
    }, this);
    this.wrap.style.height = this.h + 'px';
    this.repaint();
  };

  Ink.prototype.grow = function (toY) {
    if (toY < this.h - 80) return false;
    var next = Math.min(MAX_H, this.h + GROW_STEP);
    if (next === this.h) return false;
    this.h = next;
    this.resize();
    return true;
  };

  function strokePath(pts) {
    var p = new Path2D();
    if (!pts.length) return p;
    if (pts.length === 1) {
      p.moveTo(pts[0].x, pts[0].y);
      p.lineTo(pts[0].x + 0.01, pts[0].y);
      return p;
    }
    p.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2;
      var my = (pts[i].y + pts[i + 1].y) / 2;
      p.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    var last = pts[pts.length - 1];
    p.lineTo(last.x, last.y);
    return p;
  }

  function avgPressure(pts) {
    if (!pts.length) return 0.5;
    var s = 0;
    for (var i = 0; i < pts.length; i++) s += (pts[i].p == null ? 0.5 : pts[i].p);
    return s / pts.length;
  }

  Ink.prototype.paintStroke = function (g, st) {
    if (!st.pts || !st.pts.length) return;
    g.save();
    var col = hexOf(st.color);
    if (st.tool === 'hi') {
      g.globalCompositeOperation = isLight() ? 'multiply' : 'screen';
      g.globalAlpha = 0.35;
      g.lineWidth = st.w * 6;
    } else {
      g.globalAlpha = 1;
      g.lineWidth = Math.max(0.4, st.w * (0.55 + avgPressure(st.pts)));
    }
    g.strokeStyle = col;
    g.stroke(strokePath(st.pts));
    g.restore();
  };

  Ink.prototype.repaint = function () {
    var g = this.base.getContext('2d');
    g.clearRect(0, 0, this.w, this.h);
    for (var i = 0; i < this.strokes.length; i++) this.paintStroke(g, this.strokes[i]);
  };

  /*@3.NOIJ.2*/
  var MOUSE_TWIN_MS = 1500;

  Ink.prototype.accepts = function (e) {
    var mode = palmMode();
    var t = e.pointerType;

    if (t === 'pen') {
      this.penSeen = true;
      this.lastPenAt = Date.now();
      return true;
    }

    /*@3.NOIJ.5*/
    if (t === 'mouse') {
      if (this.penSeen && (Date.now() - this.lastPenAt) < MOUSE_TWIN_MS) return false;
      return true;
    }

    if (t === 'touch') {
      if (mode === 'never') return true;
      if (mode === 'always') return false;
      return !this.penSeen;
    }
    return true;
  };

  /*@3.NOIJ.6*/
  Ink.prototype.norm = function (e) {
    if (e.pointerType !== 'pen') return 0.5;
    var raw = (e.pressure > 0) ? e.pressure : 0.5;
    if (raw > this.pMax) this.pMax = raw;
    return Math.max(0.05, Math.min(1, raw / this.pMax));
  };

  Ink.prototype.pt = function (e) {
    var r = this.wet.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, p: this.norm(e) };
  };

  Ink.prototype.bind = function () {
    var self = this;

    function wetCtx() { return self.wet.getContext('2d'); }

    function redrawWet() {
      var g = wetCtx();
      g.clearRect(0, 0, self.w, self.h);
      for (var id in self.live) self.paintStroke(g, self.live[id]);
    }

    this.wet.addEventListener('pointerdown', function (e) {
      if (!self.accepts(e)) return;
      if (e.button > 0) return;
      e.preventDefault();
      try { self.wet.setPointerCapture(e.pointerId); } catch (err) {}

      if (self.tool === 'era') {
        self.eraseAt(self.pt(e));
        self.live[e.pointerId] = null;
        self.erasing = self.erasing || {};
        self.erasing[e.pointerId] = 1;
        return;
      }

      /*@3.NOIJ.7*/
      self.live[e.pointerId] = {
        tool: self.tool, color: self.color, w: self.width, pts: [self.pt(e)]
      };
    });

    this.wet.addEventListener('pointermove', function (e) {
      if (self.erasing && self.erasing[e.pointerId]) { self.eraseAt(self.pt(e)); return; }
      var st = self.live[e.pointerId];
      if (!st) return;
      e.preventDefault();

      /*@3.NOIJ.8*/
      var evts = (typeof e.getCoalescedEvents === 'function')
        ? (e.getCoalescedEvents() || [e]) : [e];
      if (!evts.length) evts = [e];

      for (var i = 0; i < evts.length; i++) {
        var p = self.pt(evts[i]);
        var last = st.pts[st.pts.length - 1];
        if (last && Math.abs(p.x - last.x) < 0.35 && Math.abs(p.y - last.y) < 0.35) continue;
        st.pts.push(p);
      }
      redrawWet();
    });

    function settle(e) {
      if (self.erasing && self.erasing[e.pointerId]) {
        delete self.erasing[e.pointerId];
        self.commit();
        return;
      }
      var st = self.live[e.pointerId];
      if (!st) return;
      delete self.live[e.pointerId];
      redrawWet();

      if (!st.pts.length) return;
      self.undoStack.push(JSON.stringify(self.strokes));
      if (self.undoStack.length > 60) self.undoStack.shift();
      self.redoStack.length = 0;
      self.strokes.push(st);
      var maxY = 0;
      for (var i = 0; i < st.pts.length; i++) maxY = Math.max(maxY, st.pts[i].y);
      if (!self.grow(maxY)) self.paintStroke(self.base.getContext('2d'), st);
      /*@3.NOIJ.11*/
      try {
        var p0 = st.pts[0] || { x: 0, y: 0 };
        window.dispatchEvent(new CustomEvent('garden:inkMark', { detail: {
          t: Date.now(), x: Math.round(p0.x), y: Math.round(p0.y),
          page: self.page || 0, tool: st.tool
        } }));
      } catch (e2) {}
      self.commit();
    }

    this.wet.addEventListener('pointerup', settle);
    /*@3.NOIJ.9*/
    this.wet.addEventListener('pointercancel', settle);
    this.wet.addEventListener('lostpointercapture', settle);

    this._themeObs = new MutationObserver(function () { self.repaint(); });
    this._themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  /*@3.NOIJ.3*/
  Ink.prototype.eraseAt = function (p) {
    var hit = -1;
    var R = Math.max(8, this.width * 4);
    for (var i = this.strokes.length - 1; i >= 0; i--) {
      var pts = this.strokes[i].pts;
      for (var j = 0; j < pts.length; j++) {
        var dx = pts[j].x - p.x, dy = pts[j].y - p.y;
        if (dx * dx + dy * dy <= R * R) { hit = i; break; }
      }
      if (hit >= 0) break;
    }
    if (hit < 0) return;
    this.undoStack.push(JSON.stringify(this.strokes));
    this.strokes.splice(hit, 1);
    this.repaint();
  };

  Ink.prototype.undo = function () {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify(this.strokes));
    this.strokes = JSON.parse(this.undoStack.pop());
    this.repaint();
    this.commit();
  };

  Ink.prototype.redo = function () {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(this.strokes));
    this.strokes = JSON.parse(this.redoStack.pop());
    this.repaint();
    this.commit();
  };

  Ink.prototype.clear = function () {
    if (!this.strokes.length) return;
    this.undoStack.push(JSON.stringify(this.strokes));
    this.strokes = [];
    this.repaint();
    this.commit();
  };

  Ink.prototype.commit = function () {
    var self = this;
    C().pack(this.strokes).then(function (packed) {
      self.onChange({ ink: packed, w: self.w, h: self.h, strokes: self.strokes.length });
    });
  };

  Ink.prototype.load = function (packed, h) {
    var self = this;
    if (h) this.h = h;
    return C().unpack(packed).then(function (strokes) {
      self.strokes = strokes || [];
      self.resize();
      return self.strokes.length;
    });
  };

  Ink.prototype.setTool = function (t) { this.tool = t; };
  Ink.prototype.setColor = function (c) { this.color = c; };
  Ink.prototype.setWidth = function (w) { this.width = w; };

  Ink.prototype.destroy = function () {
    if (this._themeObs) this._themeObs.disconnect();
    this.wrap.remove();
  };

  function toSvg(strokes, w, h) {
    var paths = (strokes || []).map(function (st) {
      var pts = st.pts || [];
      if (!pts.length) return '';
      var d = 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = ((pts[i].x + pts[i + 1].x) / 2).toFixed(2);
        var my = ((pts[i].y + pts[i + 1].y) / 2).toFixed(2);
        d += ' Q ' + pts[i].x.toFixed(2) + ' ' + pts[i].y.toFixed(2) + ' ' + mx + ' ' + my;
      }
      var last = pts[pts.length - 1];
      d += ' L ' + last.x.toFixed(2) + ' ' + last.y.toFixed(2);
      var lw = st.tool === 'hi' ? st.w * 6 : st.w * (0.55 + avgPressure(pts));
      var op = st.tool === 'hi' ? 0.35 : 1;
      return '<path d="' + d + '" fill="none" stroke="' + hexOf(st.color) +
             '" stroke-width="' + lw.toFixed(2) + '" stroke-linecap="round" ' +
             'stroke-linejoin="round" opacity="' + op + '"/>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
           '" width="' + w + '" height="' + h + '">' + paths + '</svg>';
  }

  window.GardenInk = {
    mount: function (host, opts) { return new Ink(host, opts); },
    toSvg: toSvg,
    hexOf: hexOf,
    COLORS: INK_COLORS,
    palmMode: palmMode,
    setPalmMode: function (m) { try { localStorage.setItem(PALM_KEY, m); } catch (e) {} }
  };
})();
