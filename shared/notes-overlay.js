;(function () {
  'use strict';


  /*@3.NOOJ.18*/
  var A4W = 794;

  function pageW(sheet, z) {
    if (!sheet) return A4W;
    var w = Math.round(sheet.getBoundingClientRect().width / (z || 1));
    return (w > 40) ? w : A4W;
  }

  /*@3.NOOJ.13*/
  function zoomOf(el) {
    if (!el || !el.offsetWidth) return 1;
    var z = el.getBoundingClientRect().width / el.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  }

  function Overlay(opts) {
    var o = opts || {};
    this.scroller = o.scroller;
    this.stage = o.stage || o.scroller;
    this.sheet = o.sheet;
    this.onChange = o.onChange || function () {};
    this.data = o.data || null;
    this.favHost = o.favHost || null;
    this.onBand = o.onBand || function () {};
    this.onTap = o.onTap || function () {};
    this.onPinch = o.onPinch || null;
    /*@3.NOOJ.14*/
    this.bound = o.bound !== false;
    this.hist = o.hist || null;
    this.on = false;
    this.pick = false;
    this.build();
  }

  /*@3.NOOJ.1*/
  /*@3.NOOJ.7*/
  Overlay.prototype.build = function () {
    this.host = document.createElement('div');
    this.host.className = 'nov-host';
    this.host.hidden = true;
    this.stage.appendChild(this.host);

    var self = this;
    if (window.GardenNotesDial) {
      this.dial = GardenNotesDial.mount({
        canvas: function () { return self.cv; },
        onExit: function () { self.toggle(false); },
        favHost: this.favHost || null
      });
    }
  };

  Overlay.prototype.sync = function () {
    if (this.dial) this.dial.sync();
  };

  /*@3.NOOJ.2*/
  /*@3.NOOJ.4*/
  /*@3.NOOJ.9*/
  Overlay.prototype.fit = function () {
    if (!this.cv) return;
    var stage = this.stage;
    var z = zoomOf(stage);
    var sh = this.sheet.getBoundingClientRect();
    var st = stage.getBoundingClientRect();
    var sc = this.scroller.getBoundingClientRect();
    var w = Math.round(sh.width / z);
    /*@3.NOOJ.23*/
    var h = this.bound
      ? Math.max(Math.round(this.sheet.scrollHeight), Math.round(sc.height / z))
      : Math.round(this.sheet.scrollHeight);
    var rtl = false;
    try { rtl = getComputedStyle(this.scroller).direction === 'rtl'; } catch (e) {}
    var top = (sh.top - st.top) / z;
    var inl = (rtl ? (st.right - sh.right) : (sh.left - st.left)) / z;
    this.host.style.inlineSize = w + 'px';
    this.host.style.blockSize = h + 'px';
    this.host.style.insetBlockStart = Math.round(top) + 'px';
    this.host.style.insetInlineStart = Math.round(inl) + 'px';
    if (this.cv) {
      this.cv.pageH = h; this.cv.w = 0; this.cv.resize();
      /*@3.NOOJ.5*/
      /*@3.NOOJ.11*/
      /*@3.NOOJ.20*/
      if (this.bound) { this.refW = A4W; this.cv.setFit(1); this.syncWindow(); }
      else this.fitBoard(w);
    }
  };

  /*@3.NOOJ.21*/
  /*@3.NOOJ.30*/
  Overlay.prototype.syncWindow = function () {
    if (!this.cv || !this.bound || !this.cv.setWindow) return;
    var z = zoomOf(this.stage) || 1;
    var wr = this.cv.wrap.getBoundingClientRect();
    var sr = this.scroller.getBoundingClientRect();
    var yTop = (sr.top - wr.top) / z;
    var vhW = sr.height / z;
    this.cv.setWindow(yTop - Math.max(0, (this.cv.winH - vhW) / 2), yTop, vhW);
  };

  /*@3.NOOJ.27*/
  var LINE_SEL = '.ne-text, .ne-li, .ne-cell, .ne-code, .ne-cap, .ne-math-out';

  /*@3.NOOJ.28*/
  function mergeLines(rects, out) {
    var i, k;
    for (i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.height < 4 || r.width < 1) continue;
      var mid = (r.top + r.bottom) / 2, hit = null;
      for (k = 0; k < out.length; k++) {
        var o = out[k];
        var tol = Math.min(o.h, r.height) * 0.6 + 1;
        if (Math.abs(mid - (o.top + o.bot) / 2) <= tol) { hit = o; break; }
      }
      if (!hit) {
        out.push({ top: r.top, bot: r.bottom, left: r.left, right: r.right,
                   h: r.height });
        continue;
      }
      if (r.top < hit.top) hit.top = r.top;
      if (r.bottom > hit.bot) hit.bot = r.bottom;
      if (r.left < hit.left) hit.left = r.left;
      if (r.right > hit.right) hit.right = r.right;
      hit.h = hit.bot - hit.top;
    }
  }

  /*@3.NOOJ.29*/
  function caretAt(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (document.caretPositionFromPoint) {
      var cp = document.caretPositionFromPoint(x, y);
      if (!cp) return null;
      var rg = document.createRange();
      try { rg.setStart(cp.offsetNode, cp.offset); rg.collapse(true); } catch (e) { return null; }
      return rg;
    }
    return null;
  }

  function wordRect(x, y) {
    var rg = caretAt(x, y);
    if (!rg) return null;
    var n = rg.startContainer;
    if (!n || n.nodeType !== 3) return null;
    var t = n.nodeValue || '';
    var i = Math.max(0, Math.min(t.length, rg.startOffset));
    var word = function (c) { return c && !/[\s\u00a0]/.test(c); };
    var a = i, b = i;
    while (a > 0 && word(t.charAt(a - 1))) a--;
    while (b < t.length && word(t.charAt(b))) b++;
    if (b <= a) return null;
    var r2 = document.createRange();
    try { r2.setStart(n, a); r2.setEnd(n, b); } catch (e2) { return null; }
    var rr = r2.getBoundingClientRect();
    return (rr && rr.width > 0.5) ? rr : null;
  }

  Overlay.prototype.lineUnder = function (bx) {
    if (!this.cv || !this.sheet) return null;
    var a = this.worldToClient({ x: bx.x0, y: bx.y0 });
    var b = this.worldToClient({ x: bx.x1, y: bx.y1 });
    var cTop = Math.min(a.y, b.y), cBot = Math.max(a.y, b.y);
    var cL = Math.min(a.x, b.x), cR = Math.max(a.x, b.x);
    var mid = (cTop + cBot) / 2, cMx = (cL + cR) / 2;
    var hosts = this.sheet.querySelectorAll(LINE_SEL);
    var lines = [], i;
    for (i = 0; i < hosts.length; i++) {
      var hr = hosts[i].getBoundingClientRect();
      if (hr.bottom < cTop - 40 || hr.top > cBot + 40) continue;
      if (hr.right < cL - 60 || hr.left > cR + 60) continue;
      var rects = null;
      try {
        var rg = document.createRange();
        rg.selectNodeContents(hosts[i]);
        rects = rg.getClientRects();
      } catch (e) { rects = null; }
      if (!rects || !rects.length) rects = [hr];
      mergeLines(rects, lines);
    }
    if (!lines.length) return null;
    var best = null, bestD = 1e9;
    for (i = 0; i < lines.length; i++) {
      var L0 = lines[i];
      var lm = (L0.top + L0.bot) / 2;
      var dy = Math.abs(lm - mid);
      var dx = (cMx < L0.left) ? (L0.left - cMx) : (cMx > L0.right ? cMx - L0.right : 0);
      var d = dy + dx * 0.35;
      if (d < bestD) { bestD = d; best = L0; }
    }
    if (!best) return null;
    if (Math.abs((best.top + best.bot) / 2 - mid) > best.h * 1.6 + 8) return null;
    var ly = (best.top + best.bot) / 2;
    var sL = Math.max(best.left, Math.min(best.right, cL));
    var sR = Math.max(best.left, Math.min(best.right, cR));
    var wA = wordRect(sL, ly), wB = wordRect(sR, ly);
    if (wA && Math.abs((wA.top + wA.bottom) / 2 - ly) < best.h) {
      sL = Math.min(sL, wA.left); sR = Math.max(sR, wA.right);
    }
    if (wB && Math.abs((wB.top + wB.bottom) / 2 - ly) < best.h) {
      sL = Math.min(sL, wB.left); sR = Math.max(sR, wB.right);
    }
    sL = Math.max(best.left, sL); sR = Math.min(best.right, sR);
    if (sR - sL < 2) { sL = best.left; sR = best.right; }
    var p0 = this.clientToWorld(best.left, best.top);
    var p1 = this.clientToWorld(best.right, best.bot);
    var q0 = this.clientToWorld(sL, best.top);
    var q1 = this.clientToWorld(sR, best.bot);
    return { x0: Math.min(p0.x, p1.x), x1: Math.max(p0.x, p1.x),
             y: Math.min(p0.y, p1.y), h: Math.abs(p1.y - p0.y),
             sx0: Math.min(q0.x, q1.x), sx1: Math.max(q0.x, q1.x) };
  };

  Overlay.prototype.worldToClient = function (p) {
    var r = this.cv.wet.getBoundingClientRect();
    var z = zoomOf(this.stage);
    var c = this.cv.cam;
    return { x: r.left + (p.x * c.z + c.x) * z, y: r.top + (p.y * c.z + c.y) * z };
  };

  Overlay.prototype.clientToWorld = function (x, y) {
    var r = this.cv.wet.getBoundingClientRect();
    var z = zoomOf(this.stage) || 1;
    var c = this.cv.cam;
    return { x: ((x - r.left) / z - c.x) / c.z, y: ((y - r.top) / z - c.y) / c.z };
  };

  /*@3.NOOJ.16*/
  Overlay.prototype.fitBoard = function (w) {
    if (!this.cv || !this.cv.contentBox) return;
    var bb = this.cv.contentBox();
    var need = bb ? Math.max(0, bb.x + bb.w) : 0;
    var room = Math.max(40, w - 10);
    var f = (need > room) ? (room / need) : 1;
    this.cv.setFit(Math.max(0.2, Math.min(1, f)));
  };

  /*@3.NOOJ.6*/
  Overlay.prototype.ensureCanvas = function () {
    if (this.cv || !window.GardenCanvas) return this.cv;
    var self = this;
    this.cv = GardenCanvas.mount(this.host, {
      height: 400,
      onWin: function () { self.syncWindow(); },
      hist: this.hist,
      snapText: function (bx) { return self.lineUnder(bx); },
      /*@3.NOOJ.8*/
      bound: this.bound,
      onScroll: function (dx, dy) {
        self.scroller.scrollTop -= dy;
        self.scroller.scrollLeft -= dx;
      },
      onPinch: function (phase, f, cx, cy) {
        if (self.onPinch) self.onPinch(phase, f, cx, cy);
      },
      onChange: function (d, quiet) {
        var out = {};
        for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) out[k] = d[k];
        out.ch = d.ch || 0;
        out.rw = A4W;
        self.onChange(out, quiet);
      },
      onState: function () { self.sync(); },
      onBand: function (r) { self.onBand(r); },
      onTap: function (p) { self.onTap(p); }
    });
    this.cv.setTool(GardenCanvas.lastTool ? GardenCanvas.lastTool() : 'pen');
    if (this.hist) this.hist.register('ink', {
      undo: function () { return self.cv ? self.cv.undo() : false; },
      redo: function () { return self.cv ? self.cv.redo() : false; }
    });
    this.wet = this.cv.wet;
    /*@3.NOOJ.26*/
    function dropSel() {
      try {
        var sel = window.getSelection();
        if (sel && !sel.isCollapsed) sel.removeAllRanges();
      } catch (e) {}
      try {
        var ae = document.activeElement;
        if (ae && ae !== document.body && ae.blur &&
            ae.closest && ae.closest('.ne-root')) ae.blur();
      } catch (e2) {}
    }
    this.wet.addEventListener('pointerdown', function (e) {
      self.drawing = true;
      dropSel();
      if (e && e.cancelable) { try { e.preventDefault(); } catch (eP) {} }
      self.dim(true);
    });
    this.wet.addEventListener('selectstart', function (e) { e.preventDefault(); });
    this.wet.addEventListener('pointermove', function () {
      if (self.drawing) dropSel();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      self.wet.addEventListener(ev, function () {
        self.drawing = false;
        self.dim(false);
      });
    });
    if (this.bound && this.scroller) {
      var selfW = this;
      this._scT = 0;
      this._onSc = function () {
        /*@3.NOOJ.24*/
        clearTimeout(selfW._scSettle);
        selfW._scSettle = setTimeout(function () { selfW.syncWindow(); }, 140);
        if (selfW._scT) return;
        selfW._scT = requestAnimationFrame(function () {
          selfW._scT = 0;
          selfW.syncWindow();
        });
      };
      this.scroller.addEventListener('scroll', this._onSc, { passive: true });
    }
    if (this.data && (this.data.ink || (this.data.shapes && this.data.shapes.length))) {
      var was = this.data.rw || this.data.w || 0;
      this.refW = this.bound ? A4W : pageW(this.sheet, zoomOf(this.stage));
      var self2 = this;
      var done = this.cv.load(this.data.ink, null, this.data.shapes);
      if (done && done.then) done.then(function () { self2.migrateRef(was); });
      else this.migrateRef(was);
    }
    return this.cv;
  };

  /*@3.NOOJ.25*/
  Overlay.prototype.shiftY = function (regs) {
    if (!this.cv || !this.cv.shiftY) return 0;
    return this.cv.shiftY(regs);
  };

  /*@3.NOOJ.19*/
  Overlay.prototype.migrateRef = function (was) {
    if (!this.bound || !this.cv) return 0;
    var now = A4W;
    var k = (was && was > 0) ? (now / was) : 1;
    if (Math.abs(k - 1) < 0.002) return 0;
    var els = this.cv.els, i;
    for (i = 0; i < els.length; i++) this.cv.mapEl(els[i], 0, 0, 0, 0, k);
    this.cv.paint();
    this.cv.commit(true);
    return els.length;
  };

/*@3.NOOJ.10*/
  Overlay.prototype.setPick = function (on) {
    var want = !!on;
    this.pick = want;
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? A4W : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
    if (this.cv) {
      this.cv.setPick(want);
      if (!want) { this.cv.deselect(); this.cv.setTool('pen'); }
    }
    this.host.hidden = false;
    this.host.setAttribute('data-live', (want || this.on) ? '1' : '0');
    return this.pick;
  };

  Overlay.prototype.clearBand = function (rect) {
    if (!this.cv) return 0;
    /*@3.NOOJ.22*/
    if (this.bound) return this.cv.deleteInWorldRect(rect);
    return this.cv.deleteInScreenRect(rect);
  };

  Overlay.prototype.show = function () {
    this.host.hidden = false;
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? A4W : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
  };

  Overlay.prototype.toggle = function (on) {
    var want = (on == null) ? !this.on : !!on;
    if (want === this.on) return this.on;
    this.on = want;
    this.host.hidden = false;
    this.host.setAttribute('data-live', (want || this.pick) ? '1' : '0');
    this.scroller.classList.toggle('nov-drawing', want);
    if (want) { try { var s0 = window.getSelection(); if (s0) s0.removeAllRanges(); } catch (eS) {} }
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? A4W : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
    if (this.dial) this.dial.show(want, want);
    if (want) this.sync();
    return this.on;
  };

  /*@3.NOOJ.3*/
  Overlay.prototype.dim = function (on) {
    if (this.dial) this.dial.dim(!!on);
  };

  Overlay.prototype.load = function (data) {
    this.data = data || null;
    var was = this.data ? (this.data.rw || this.data.w || 0) : 0;
    this.refW = this.bound ? A4W : pageW(this.sheet, zoomOf(this.stage));
    if (this.cv && this.data) {
      var self3 = this;
      var p = this.cv.load(this.data.ink, null, this.data.shapes);
      if (p && p.then) p.then(function () { self3.migrateRef(was); });
      else this.migrateRef(was);
    }
  };

  Overlay.prototype.destroy = function () {
    if (this._onSc && this.scroller) {
      this.scroller.removeEventListener('scroll', this._onSc);
      this._onSc = null;
    }
    if (this.hist) this.hist.unregister('ink');
    if (this.cv) { try { this.cv.destroy(); } catch (e) {} this.cv = null; }
    if (this.host && this.host.parentNode) this.host.remove();
    if (this.dial) { try { this.dial.destroy(); } catch (e2) {} this.dial = null; }
    this.scroller.classList.remove('nov-drawing');
  };

  window.GardenNotesOverlay = {
    mount: function (opts) { return new Overlay(opts); }
  };
})();
