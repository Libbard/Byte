(function () {
  'use strict';

  var _lib = null;

  function base() {
    var probe = document.querySelector('script[src*="notes-pdfview.js"]') ||
                document.querySelector('script[src*="notes-editor.js"]') ||
                document.querySelector('script[src*="notes-app.js"]');
    var src = probe ? (probe.getAttribute('src') || '') : '';
    return { dir: src.replace(/notes-[a-z]+\.js.*$/, ''), v: src.split('?')[1] || '' };
  }

  var PDFJS = '4.6.82';

  /*@3.NOPJ3.53*/
  function lib() {
    if (_lib) return _lib;
    var b = base();
    var q = '?p=' + PDFJS;
    _lib = import(b.dir + 'vendor/pdfjs/pdf.min.mjs' + q).then(function (m) {
      try { m.GlobalWorkerOptions.workerSrc = b.dir + 'vendor/pdfjs/pdf.worker.min.mjs' + q; }
      catch (e) {}
      return m;
    });
    return _lib;
  }

  function load(src, opts) {
    var o = opts || {};
    return lib().then(function (m) {
      var args = { isEvalSupported: false, disableAutoFetch: false };
      if (typeof src === 'string') args.url = src;
      else args.data = src;
      if (o.password) args.password = o.password;
      var task = m.getDocument(args);
      return task.promise.then(function (doc) {
        return { m: m, doc: doc, pages: doc.numPages };
      });
    });
  }

  function ratio(cap) {
    var d = window.devicePixelRatio || 1;
    var top = cap || 2.5;
    return d > top ? top : (d < 1 ? 1 : d);
  }

  var GAP = 12;
  var CELL = 8;

  function px(v, d) {
    if (v == null) return d;
    if (typeof v === 'number') return v;
    var m = String(v).match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : d;
  }

  /*@3.NOPJ3.19*/
  function merge(list, ox, oy) {
    var a = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.width <= 0 || r.height <= 0) continue;
      a.push({ x: r.left - ox, y: r.top - oy, w: r.width, h: r.height });
    }
    a.sort(function (p, q) {
      var d = (p.y + p.h / 2) - (q.y + q.h / 2);
      if (Math.abs(d) > Math.min(p.h, q.h) * 0.6) return d;
      return p.x - q.x;
    });
    var out = [], cur = null;
    for (var j = 0; j < a.length; j++) {
      var c = a[j];
      if (cur && Math.abs((c.y + c.h / 2) - (cur.y + cur.h / 2)) <= Math.min(c.h, cur.h) * 0.6 &&
          c.x <= cur.x + cur.w + Math.max(1.5, c.h * 0.6)) {
        var right = Math.max(cur.x + cur.w, c.x + c.w);
        var top = Math.min(cur.y, c.y);
        var bot = Math.max(cur.y + cur.h, c.y + c.h);
        cur.x = Math.min(cur.x, c.x);
        cur.w = right - cur.x;
        cur.y = top; cur.h = bot - top;
        continue;
      }
      cur = { x: c.x, y: c.y, w: c.w, h: c.h };
      out.push(cur);
    }
    return out;
  }

  function paintBoxes(host, boxes, cls) {
    var old = host.querySelectorAll('.' + cls);
    for (var i = 0; i < old.length; i++) old[i].remove();
    for (var j = 0; j < boxes.length; j++) {
      var b = boxes[j];
      var el = document.createElement('div');
      el.className = cls;
      el.style.insetInlineStart = b.x.toFixed(2) + 'px';
      el.style.insetBlockStart = b.y.toFixed(2) + 'px';
      el.style.inlineSize = b.w.toFixed(2) + 'px';
      el.style.blockSize = b.h.toFixed(2) + 'px';
      host.appendChild(el);
    }
  }

  function View(handle, host, opts) {
    this.h = handle;
    this.host = host;
    this.o = opts || {};
    this.scale = this.o.scale || 1;
    this.n = handle.doc.numPages;
    this.pw = [];
    this.ph = [];
    this.stop = [];
    this.slots = {};
    this.gen = 0;
    this.dead = false;
    this.tick = 0;
    this.scroller = this.o.scroller || host;
    this.margin = px(this.o.margin, 900);
    this.keep = this.o.keep == null ? 6 : this.o.keep;
    this.mode = this.o.mode || 1;
    this.order = this.o.order === 'col' ? 'col' : 'row';
    this.flow = this.o.flow === 'page' ? 'page' : 'cont';
    this.side = this.o.side === 'rtl' ? 'rtl' : 'ltr';
  }

  /*@3.NOPJ3.1*/
  View.prototype.probe = function () {
    var self = this;
    var doc = this.h.doc;
    var wants = [1];
    if (this.n > 1) wants.push(this.n);
    if (this.n > 4) wants.push(Math.ceil(this.n / 2));
    return Promise.all(wants.map(function (n) {
      return doc.getPage(n).then(function (p) {
        var vp = p.getViewport({ scale: 1 });
        try { p.cleanup(); } catch (e) {}
        return { n: n, w: vp.width, h: vp.height };
      });
    })).then(function (rows) {
      var d = rows[0];
      self.defW = d.w; self.defH = d.h;
      for (var i = 0; i < rows.length; i++) {
        self.pw[rows[i].n] = rows[i].w;
        self.ph[rows[i].n] = rows[i].h;
      }
      return self;
    });
  };

  View.prototype.wOf = function (n) { return (this.pw[n] || this.defW) * this.scale; };
  View.prototype.hOf = function (n) { return (this.ph[n] || this.defH) * this.scale; };

  /*@3.NOPJ3.54*/
  function grid(mode, w, h) {
    var tall = h > 0 && w > 0 && h > w * 1.15;
    if (mode === 4) return { cols: 2, rows: 2 };
    if (mode === 2) return tall ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 };
    return { cols: 1, rows: 1 };
  }

  /*@3.NOPJ3.11*/
  View.prototype.grid = function () { return grid(this.mode, this.vw(), this.vh()); };
  View.prototype.cols = function () { return this.grid().cols; };
  View.prototype.rows = function () { return this.grid().rows; };
  View.prototype.per = function () { return this.cols() * this.rows(); };
  View.prototype.sheets = function () { return Math.ceil(this.n / this.per()); };
  View.prototype.sheetOf = function (n) { return Math.floor((n - 1) / this.per()); };
  View.prototype.firstOf = function (s) { return s * this.per() + 1; };

  View.prototype.cellOf = function (n) {
    var s = this.sheetOf(n), i = (n - 1) - s * this.per();
    if (this.mode === 4 && this.order === 'col') {
      return { s: s, r: i % 2, c: Math.floor(i / 2) };
    }
    return { s: s, r: Math.floor(i / this.cols()), c: i % this.cols() };
  };

  /*@3.NOPJ3.12*/
  View.prototype.box = function (s) {
    var per = this.per(), w = 0, h = 0;
    for (var i = 0; i < per; i++) {
      var n = s * per + 1 + i;
      if (n > this.n) break;
      var pw = this.wOf(n), ph = this.hOf(n);
      if (pw > w) w = pw;
      if (ph > h) h = ph;
    }
    if (!w) { w = this.defW * this.scale; h = this.defH * this.scale; }
    return { w: w, h: h };
  };

  View.prototype.sheetW = function (s) {
    var b = this.box(s);
    return b.w * this.cols() + CELL * (this.cols() - 1);
  };
  View.prototype.sheetH = function (s) {
    var b = this.box(s);
    return b.h * this.rows() + CELL * (this.rows() - 1);
  };

  /*@3.NOPJ3.49*/
  View.prototype.slotH = function (s) {
    var h = this.sheetH(s);
    if (this.flow !== 'page') return h;
    var vh = this.vh();
    return h > vh ? h : vh;
  };

  /*@3.NOPJ3.2*/
  View.prototype.lay = function () {
    var y = 0, wide = 0, s, k = this.sheets();
    var gap = this.flow === 'page' ? 0 : GAP;
    this.stop = [];
    this.roomH = this.vh();
    for (s = 0; s < k; s++) {
      this.stop[s] = y;
      y += this.slotH(s) + gap;
      var w = this.sheetW(s);
      if (w > wide) wide = w;
    }
    this.total = y > 0 ? y - gap : 0;
    this.wide = wide;
    if (this.wrap) {
      this.wrap.setAttribute('data-mode', this.mode + this.order.charAt(0));
      /*@3.NOPJ3.55*/
      this.wrap.setAttribute('data-grid', this.cols() + 'x' + this.rows());
      this.wrap.style.blockSize = Math.ceil(this.total) + 'px';
      this.wrap.style.inlineSize = Math.ceil(wide) + 'px';
    }
  };

  /*@3.NOPJ3.3*/
  View.prototype.atSheet = function (y) {
    var lo = 0, hi = this.stop.length - 1, ans = 0;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (this.stop[mid] <= y) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  };

  View.prototype.at = function (y) { return this.firstOf(this.atSheet(y)); };

  View.prototype.off = function () {
    var s = this.scroller;
    if (!this.wrap || s === this.wrap) return 0;
    var a = this.wrap.getBoundingClientRect();
    var b = s.getBoundingClientRect ? s.getBoundingClientRect() : { top: 0 };
    var v = (a.top - b.top) + s.scrollTop;
    return isFinite(v) ? v : 0;
  };

  View.prototype.y = function () { return this.scroller.scrollTop - this.off(); };

  View.prototype.offX = function () {
    var s = this.scroller;
    if (!this.wrap || s === this.wrap) return 0;
    var a = this.wrap.getBoundingClientRect();
    var b = s.getBoundingClientRect ? s.getBoundingClientRect() : { left: 0 };
    var v = (a.left - b.left) + s.scrollLeft;
    return isFinite(v) ? v : 0;
  };

  View.prototype.x = function () { return this.scroller.scrollLeft - this.offX(); };

  View.prototype.vh = function () {
    var s = this.scroller;
    var h = (s === document.scrollingElement || s === document.body)
      ? window.innerHeight : s.clientHeight;
    return h || 800;
  };

  View.prototype.vw = function () {
    var s = this.scroller;
    var w = (s === document.scrollingElement || s === document.body)
      ? window.innerWidth : s.clientWidth;
    return w || 800;
  };

  /*@3.NOPJ3.10*/
  View.prototype.mid = function () {
    return this.at(this.y() + this.vh() / 2);
  };

  /*@3.NOPJ3.4*/
  View.prototype.range = function () {
    var y0 = this.y(), y1 = y0 + this.vh();
    var per = this.per(), last = this.n;
    var span = function (self, a, b) {
      var s0 = self.atSheet(a), s1 = self.atSheet(b);
      return [s0 * per + 1, Math.min(last, (s1 + 1) * per)];
    };
    return {
      seen: span(this, y0, y1),
      near: span(this, y0 - this.margin, y1 + this.margin)
    };
  };

  View.prototype.build = function () {
    var self = this;
    this.host.innerHTML = '';
    this.wrap = document.createElement('div');
    this.wrap.className = 'gpv';
    this.wrap.style.direction = this.side;
    this.host.appendChild(this.wrap);
    return this.probe().then(function () {
      if (self.dead) return self;
      self.lay();
      self.bind();
      self.sync();
      return self;
    });
  };

  View.prototype.bind = function () {
    var self = this;
    this.onScroll = function () {
      if (self.tick) return;
      self.tick = requestAnimationFrame(function () { self.tick = 0; self.sync(); });
    };
    var s = this.scroller;
    this.evTarget = (s === document.scrollingElement || s === document.body) ? window : s;
    this.evTarget.addEventListener('scroll', this.onScroll, { passive: true });
    /*@3.NOPJ3.13*/
    /*@3.NOPJ3.20*/
    this.onWheel = function (e) {
      if (self.flow !== 'page' || e.ctrlKey || e.metaKey) return;
      if (Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      var now = (e.timeStamp || Date.now());
      if (self.wheelAt && now - self.wheelAt < 45) return;
      self.wheelAt = now;
      var big = e.deltaMode === 1 ? Math.abs(e.deltaY) : Math.abs(e.deltaY) / 120;
      var tall = self.sheetH(self.atSheet(self.y() + 1)) > self.vh() + 2;
      var jump = (!tall && big >= 3) ? Math.min(6, Math.round(big)) : 1;
      self.step(e.deltaY > 0 ? jump : -jump);
    };
    (s.addEventListener ? s : window).addEventListener('wheel', this.onWheel, { passive: false });
    this.onSel = function () {
      if (self.selTick) return;
      self.selTick = requestAnimationFrame(function () { self.selTick = 0; self.drawSel(); });
    };
    document.addEventListener('selectionchange', this.onSel);
    /*@3.NOPJ3.21*/
    this.onCopy = function (e) { self.copy(e); };
    this.host.addEventListener('copy', this.onCopy);
    /*@3.NOPJ3.36*/
    this.onDbl = function (e) {
      /*@3.NOPJ3.40*/
      var pg = e.target && e.target.closest ? e.target.closest('.gpv-page') : null;
      if (pg && (self.mode !== 1 || self.focus)) {
        e.preventDefault();
        self.zoomPage(+pg.getAttribute('data-p'), e.clientX, e.clientY);
        return;
      }
      var sp = e.target;
      var inText = sp && sp.tagName === 'SPAN' && sp.parentNode &&
        sp.parentNode.classList && sp.parentNode.classList.contains('gpv-text');
      if (inText && (sp.textContent || '').trim().length <= 1) {
        if (self.word(sp)) { e.preventDefault(); return; }
      }
      /*@3.NOPJ3.57*/
      if (pg && !inText && self.o.onTapZoom) {
        e.preventDefault();
        self.o.onTapZoom(e.clientX, e.clientY);
      }
    };
    this.host.addEventListener('dblclick', this.onDbl);
    /*@3.NOPJ3.41*/
    this.tapAt = 0; this.tapOn = 0;
    this.onTap = function (e) {
      if (e.pointerType !== 'touch') return;
      var pg = e.target && e.target.closest ? e.target.closest('.gpv-page') : null;
      if (!pg) return;
      var n = +pg.getAttribute('data-p');
      var now = e.timeStamp || Date.now();
      if (self.tapOn === n && now - self.tapAt < 340) {
        self.tapAt = 0; self.tapOn = 0;
        if (self.mode !== 1 || self.focus) self.zoomPage(n, e.clientX, e.clientY);
        /*@3.NOPJ3.58*/
        else if (self.o.onTapZoom) self.o.onTapZoom(e.clientX, e.clientY);
        return;
      }
      self.tapAt = now; self.tapOn = n;
    };
    this.host.addEventListener('pointerup', this.onTap, { passive: true });
    /*@3.NOPJ3.43*/
    this.onTagClick = function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.gpv-tag') : null;
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      if (self.o.onAsk) self.o.onAsk(+b.getAttribute('data-p'));
    };
    this.host.addEventListener('click', this.onTagClick);
    this.bindPinch();
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(this.onScroll);
      try { this.ro.observe(this.host); } catch (e) {}
    }
  };

  /*@3.NOPJ3.22*/
  View.prototype.bindPinch = function () {
    var self = this;
    var pts = {}, live = null;
    var dist = function () {
      var k = Object.keys(pts);
      if (k.length < 2) return null;
      var a = pts[k[0]], b = pts[k[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y),
               cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    };
    this.onPd = function (e) {
      if (e.pointerType !== 'touch') return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(pts).length === 2) {
        var d = dist();
        var r = self.wrap.getBoundingClientRect();
        live = { d0: d.d, s0: self.scale, ox: d.cx - r.left, oy: d.cy - r.top,
                 cx: d.cx, cy: d.cy, hold: self.grip(d.cx, d.cy) };
        self.wrap.style.transformOrigin = live.ox + 'px ' + live.oy + 'px';
      }
    };
    this.onPm = function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (!live) return;
      var d = dist();
      if (!d) return;
      e.preventDefault();
      var k = d.d / live.d0;
      if (!(k > 0.05 && k < 20)) return;
      var want = clampScale(live.s0 * k);
      live.k = want / live.s0;
      self.wrap.style.transform = 'scale(' + live.k + ')';
    };
    this.onPu = function (e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      if (!live || Object.keys(pts).length >= 2) return;
      var k = live.k || 1;
      var grip = live;
      live = null;
      self.wrap.style.transform = '';
      self.wrap.style.transformOrigin = '';
      if (Math.abs(k - 1) < 0.01) return;
      var want = clampScale(self.scale * k);
      /*@3.NOPJ3.44*/
      /*@3.NOPJ3.60*/
      if (self.o.onPinch) self.o.onPinch(want);
      if (self.dead || !self.wrap) return;
      /*@3.NOPJ3.38*/
      self.setScale(want, { grip: grip.hold });
      self.sync();
    };
    var s = this.scroller;
    s.addEventListener('pointerdown', this.onPd, { passive: true });
    s.addEventListener('pointermove', this.onPm, { passive: false });
    s.addEventListener('pointerup', this.onPu, { passive: true });
    s.addEventListener('pointercancel', this.onPu, { passive: true });
  };

  /*@3.NOPJ3.14*/
  /*@3.NOPJ3.37*/
  View.prototype.step = function (dir) {
    var s = this.atSheet(this.y() + 1);
    var vh = this.vh();
    var h = this.slotH(s);
    if (h > vh + 2) {
      var y = this.y();
      var room = dir > 0 ? (this.stop[s] + h - vh) - y : y - this.stop[s];
      if (room > 1) {
        this.scroller.scrollTop += (dir > 0 ? 1 : -1) * Math.min(room, vh * 0.9);
        this.sync();
        return this.mid();
      }
    }
    var t = Math.max(0, Math.min(this.sheets() - 1, s + dir));
    var th = this.slotH(t);
    var f = (dir < 0 && th > vh + 2) ? ((th - vh) / th) : 0;
    this.goTo(this.firstOf(t), f);
    return this.firstOf(t);
  };

  /*@3.NOPJ3.32*/
  View.prototype.held = function () {
    var out = {};
    var r = this.pick();
    if (!r) return out;
    for (var k in this.slots) {
      var s = this.slots[k];
      if (!s.td) continue;
      try { if (r.intersectsNode(s.td)) out[k] = 1; } catch (e) {}
    }
    return out;
  };

  View.prototype.sync = function () {
    if (this.dead || !this.wrap) return;
    /*@3.NOPJ3.51*/
    if (this.flow === 'page' && Math.abs((this.roomH || 0) - this.vh()) > 1) {
      var at = this.mid();
      this.lay();
      for (var q in this.slots) this.place(+q, this.slots[q].el);
      this.relayer();
      this.goTo(at, 0);
      return;
    }
    var r = this.range();
    var a = r.near[0], b = r.near[1];
    var sa = r.seen[0], sb = r.seen[1];
    var keep = this.held();
    var n;
    for (n = a; n <= b; n++) this.hold(n);
    for (var k in this.slots) {
      n = +k;
      if (keep[k]) continue;
      if (n < a - this.keep || n > b + this.keep) this.free(n);
      else if (n < a || n > b) this.blank(n);
    }
    for (n = a; n <= b; n++) this.paint(n);
    for (n = a; n <= b; n++) if ((n < sa || n > sb) && !keep[n]) this.untext(n);
    this.later(sa, sb);
    if (this.o.onView) this.o.onView(this.mid(), this.n);
  };

  /*@3.NOPJ3.9*/
  View.prototype.later = function (sa, sb) {
    var self = this;
    this.seen = [sa, sb];
    if (this.idle) clearTimeout(this.idle);
    this.idle = setTimeout(function () {
      self.idle = 0;
      if (self.dead) return;
      for (var n = self.seen[0]; n <= self.seen[1]; n++) self.text(n);
    }, 110);
  };

  View.prototype.rectOf = function (n) {
    var c = this.cellOf(n);
    var b = this.box(c.s);
    var lead = (this.wide - this.sheetW(c.s)) / 2;
    var rise = (this.slotH(c.s) - this.sheetH(c.s)) / 2;
    return {
      x: lead + c.c * (b.w + CELL) + (b.w - this.wOf(n)) / 2,
      y: this.stop[c.s] + rise + c.r * (b.h + CELL) + (b.h - this.hOf(n)) / 2,
      w: this.wOf(n), h: this.hOf(n)
    };
  };

  View.prototype.spot = function (n) {
    var q = this.rectOf(n);
    q.x = Math.round(q.x); q.y = Math.round(q.y);
    q.w = Math.round(q.w); q.h = Math.round(q.h);
    if (this.side === 'rtl') q.x = Math.ceil(this.wide) - q.x - q.w;
    return q;
  };

  /*@3.NOPJ3.15*/
  View.prototype.place = function (n, el) {
    var q = this.rectOf(n);
    el.style.inlineSize = Math.round(q.w) + 'px';
    el.style.blockSize = Math.round(q.h) + 'px';
    el.style.insetInlineStart = Math.round(q.x) + 'px';
    el.style.insetBlockStart = Math.round(q.y) + 'px';
    el.style.setProperty('--scale-factor', String(this.scale));
    var f = q.w / 56;
    el.style.setProperty('--gpv-tag',
      (f < 6 ? 6 : (f > 11 ? 11 : Math.round(f * 10) / 10)) + 'px');
  };

  View.prototype.local = function (cx, cy) {
    if (!this.wrap) return null;
    var r = this.wrap.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  };

  /*@3.NOPJ3.47*/
  View.prototype.pageAt = function (X, Y) {
    if (!this.wrap || !this.stop.length) return null;
    var sh = this.atSheet(Y), per = this.per();
    var best = null, bd = Infinity, i, n, q, ax, ay, d;
    for (i = 0; i < per; i++) {
      n = sh * per + 1 + i;
      if (n > this.n) break;
      q = this.spot(n);
      ax = X < q.x ? q.x - X : (X > q.x + q.w ? X - q.x - q.w : 0);
      ay = Y < q.y ? q.y - Y : (Y > q.y + q.h ? Y - q.y - q.h : 0);
      d = ax * ax + ay * ay;
      if (d < bd) { bd = d; best = { n: n, q: q }; }
    }
    if (!best) return null;
    return { n: best.n, q: best.q, hit: bd === 0,
             x: (X - best.q.x) / this.scale, y: (Y - best.q.y) / this.scale };
  };

  /*@3.NOPJ3.46*/
  View.prototype.grip = function (cx, cy) {
    if (!this.wrap || !this.stop.length) return null;
    var s = this.scroller;
    var r = s.getBoundingClientRect ? s.getBoundingClientRect() : { left: 0, top: 0 };
    var dx = cx == null ? (s.clientLeft || 0) + this.vw() / 2 : cx - r.left;
    var dy = cy == null ? (s.clientTop || 0) + this.vh() / 2 : cy - r.top;
    var a = this.pageAt(this.x() + dx, this.y() + dy);
    if (!a) return null;
    return { n: a.n, dx: dx, dy: dy,
             u: (a.x * this.scale) / Math.max(1, a.q.w),
             v: (a.y * this.scale) / Math.max(1, a.q.h) };
  };

  View.prototype.regrip = function (g) {
    if (!g || !this.wrap) return;
    var q = this.spot(g.n);
    this.scroller.scrollTop = this.off() + q.y + g.v * q.h - g.dy;
    this.scroller.scrollLeft = this.offX() + q.x + g.u * q.w - g.dx;
  };

  /*@3.NOPJ3.23*/
  View.prototype.hold = function (n) {
    var s = this.slots[n];
    if (s) return s;
    var el = document.createElement('div');
    el.className = 'gpv-page';
    el.setAttribute('data-p', String(n));
    this.place(n, el);
    var before = null, best = Infinity;
    for (var k in this.slots) {
      var m = +k;
      if (m > n && m < best) { best = m; before = this.slots[k].el; }
    }
    this.wrap.insertBefore(el, before);
    s = this.slots[n] = { el: el };
    return s;
  };

  /*@3.NOPJ3.5*/
  View.prototype.paint = function (n) {
    var self = this;
    var s = this.slots[n];
    if (!s || s.busy) return;
    if (s.cv && !s.stale) return;
    s.busy = 1;
    var gen = this.gen;
    this.h.doc.getPage(n).then(function (page) {
      if (self.dead || gen !== self.gen || !self.slots[n]) { try { page.cleanup(); } catch (e) {} return; }
      s.page = page;
      var vp = page.getViewport({ scale: self.scale });
      self.fix(n, page);
      var r = ratio(self.o.maxRatio);
      var cv = document.createElement('canvas');
      cv.className = 'gpv-cv';
      cv.width = Math.round(vp.width * r);
      cv.height = Math.round(vp.height * r);
      cv.style.inlineSize = Math.round(vp.width) + 'px';
      cv.style.blockSize = Math.round(vp.height) + 'px';
      var ctx = cv.getContext('2d', { alpha: false });
      var task = page.render({
        canvasContext: ctx,
        viewport: vp,
        transform: r !== 1 ? [r, 0, 0, r, 0, 0] : null,
        background: '#ffffff'
      });
      s.task = task;
      return task.promise.then(function () {
        if (self.dead || gen !== self.gen || !self.slots[n]) return;
        if (s.cv && s.cv.parentNode) {
          s.cv.parentNode.removeChild(s.cv);
          s.cv.width = 0; s.cv.height = 0;
        }
        s.cv = cv;
        s.stale = 0;
        s.el.insertBefore(cv, s.el.firstChild);
        s.busy = 0;
        self.tag(n);
        self.layer(n);
        if (self.o.onPage) self.o.onPage(n);
        if (self.seen && n >= self.seen[0] && n <= self.seen[1]) self.text(n);
      });
    }).catch(function () { if (self.slots[n]) self.slots[n].busy = 0; });
  };

  /*@3.NOPJ3.16*/
  View.prototype.layer = function (n) {
    var s = this.slots[n];
    if (!s || s.lay) return null;
    var el = document.createElement('div');
    el.className = 'gpv-lay';
    el.setAttribute('data-p', String(n));
    s.el.appendChild(el);
    s.lay = el;
    this.tellLayer(n, s);
    return el;
  };

  /*@3.NOPJ3.48*/
  View.prototype.tellLayer = function (n, s) {
    if (!this.o.onLayer || !s || !s.lay) return;
    this.o.onLayer(n, s.lay, {
      w: this.pw[n] || this.defW,
      h: this.ph[n] || this.defH,
      scale: this.scale,
      page: s.page || null
    });
  };

  View.prototype.relayer = function () {
    if (!this.o.onLayer) return;
    for (var k in this.slots) this.tellLayer(+k, this.slots[k]);
  };

  /*@3.NOPJ3.39*/
  View.prototype.tag = function (n) {
    var s = this.slots[n];
    if (!s || s.tag) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gpv-tag';
    b.setAttribute('data-p', String(n));
    b.textContent = this.o.stamp ? this.o.stamp(n, this.n) : (n + ' / ' + this.n);
    b.setAttribute('aria-label', b.textContent);
    s.el.appendChild(b);
    s.tag = b;
  };

  /*@3.NOPJ3.24*/
  View.prototype.marks = function (n) {
    var s = this.slots[n];
    if (!s) return null;
    if (!s.hl) {
      var el = document.createElement('div');
      el.className = 'gpv-hl';
      s.el.insertBefore(el, s.td || s.lay || null);
      s.hl = el;
    }
    return s.hl;
  };

  /*@3.NOPJ3.6*/
  View.prototype.text = function (n) {
    var self = this;
    var s = this.slots[n];
    if (!s || !s.page || s.td || s.tbusy) return;
    s.tbusy = 1;
    var gen = this.gen;
    var vp = s.page.getViewport({ scale: this.scale });
    var td = document.createElement('div');
    td.className = 'gpv-text';
    td.spellcheck = false;
    td.setAttribute('spellcheck', 'false');
    td.setAttribute('translate', 'no');
    var tl = new this.h.m.TextLayer({
      textContentSource: s.page.streamTextContent({ includeMarkedContent: false }),
      container: td,
      viewport: vp
    });
    s.tl = tl;
    tl.render().then(function () {
      if (self.dead || gen !== self.gen || !self.slots[n]) return;
      /*@3.NOPJ3.25*/
      var eoc = document.createElement('div');
      eoc.className = 'endOfContent';
      td.appendChild(eoc);
      s.td = td;
      s.el.insertBefore(td, s.lay || null);
      s.tbusy = 0;
      if (self.o.onText) self.o.onText(n, td);
      /*@3.NOPJ3.33*/
      self.onSel();
    }).catch(function () { if (self.slots[n]) self.slots[n].tbusy = 0; });
  };

  View.prototype.untext = function (n) {
    var s = this.slots[n];
    if (!s) return;
    if (s.tl && s.tl.cancel) { try { s.tl.cancel(); } catch (e) {} }
    s.tl = null; s.tbusy = 0;
    if (s.td && s.td.parentNode) s.td.parentNode.removeChild(s.td);
    if (s.td && this.o.offText) { try { this.o.offText(n); } catch (e2) {} }
    s.td = null;
  };

  View.prototype.blank = function (n) {
    var s = this.slots[n];
    if (!s) return;
    this.untext(n);
    if (s.task && s.task.cancel) { try { s.task.cancel(); } catch (e) {} }
    s.task = null; s.busy = 0;
    if (s.cv) {
      if (s.cv.parentNode) s.cv.parentNode.removeChild(s.cv);
      s.cv.width = 0; s.cv.height = 0;
      s.cv = null;
    }
    s.stale = 0;
    if (s.hl) { s.hl.remove(); s.hl = null; }
    if (s.sel) { s.sel.remove(); s.sel = null; }
    if (s.tag) { s.tag.remove(); s.tag = null; }
    if (s.page) { try { s.page.cleanup(); } catch (e) {} }
  };

  View.prototype.free = function (n) {
    var s = this.slots[n];
    if (!s) return;
    this.blank(n);
    if (s.lay && this.o.offLayer) { try { this.o.offLayer(n, s.lay); } catch (e) {} }
    s.lay = null;
    if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
    delete this.slots[n];
  };

  /*@3.NOPJ3.26*/
  View.prototype.stale = function (n) {
    var s = this.slots[n];
    if (!s) return;
    this.untext(n);
    if (s.task && s.task.cancel) { try { s.task.cancel(); } catch (e) {} }
    s.task = null; s.busy = 0;
    if (s.hl) { s.hl.innerHTML = ''; }
    if (s.cv) {
      s.stale = 1;
      s.cv.style.inlineSize = '100%';
      s.cv.style.blockSize = '100%';
    }
  };

  /*@3.NOPJ3.7*/
  View.prototype.fix = function (n, page) {
    var vp = page.getViewport({ scale: 1 });
    var oldH = this.ph[n] == null ? this.defH : this.ph[n];
    var oldW = this.pw[n] == null ? this.defW : this.pw[n];
    if (Math.abs(vp.height - oldH) < 0.5 && Math.abs(vp.width - oldW) < 0.5) return;
    this.pw[n] = vp.width; this.ph[n] = vp.height;
    var s = this.sheetOf(n);
    var before = this.stop[s];
    var past = this.atSheet(this.y()) > s;
    this.lay();
    if (past) this.scroller.scrollTop += (this.stop[s] - before);
    for (var k in this.slots) this.place(+k, this.slots[+k].el);
    this.relayer();
  };

  View.prototype.setScale = function (v, opts) {
    if (!(v > 0) || Math.abs(v - this.scale) < 0.0005) return;
    var o = opts || {};
    var g = (o.keep || o.fit) ? null : (o.grip || this.grip(o.cx, o.cy));
    this.relay(function (self) { self.scale = v; }, { keep: o.keep, grip: g });
  };

  /*@3.NOPJ3.17*/
  /*@3.NOPJ3.27*/
  View.prototype.relay = function (change, opts) {
    var o = opts || {};
    var g = o.grip || null;
    var w = (o.keep || g) ? null : this.where();
    this.gen++;
    for (var k in this.slots) this.stale(+k);
    change(this);
    this.lay();
    for (var k2 in this.slots) this.place(+k2, this.slots[k2].el);
    this.relayer();
    if (g) { this.regrip(g); this.sync(); }
    else if (w) {
      /*@3.NOPJ3.52*/
      var s2 = this.sheetOf(w.p);
      var flat = this.flow === 'page' && this.slotH(s2) <= this.vh() + 2;
      this.goTo(w.p, flat ? 0 : w.f);
    } else this.sync();
  };

  View.prototype.setView = function (mode, order) {
    var m = (mode === 2 || mode === 4) ? mode : 1;
    var o = order === 'col' ? 'col' : 'row';
    if (m === this.mode && o === this.order) return;
    this.relay(function (self) { self.mode = m; self.order = o; });
  };

  /*@3.NOPJ3.28*/
  View.prototype.setSide = function (s) {
    var v = s === 'rtl' ? 'rtl' : 'ltr';
    if (v === this.side) return this.side;
    this.side = v;
    if (this.wrap) this.wrap.style.direction = v;
    this.relay(function () {});
    return v;
  };

  /*@3.NOPJ3.50*/
  View.prototype.setFlow = function (f) {
    var v = f === 'page' ? 'page' : 'cont';
    if (v === this.flow) return this.flow;
    var at = this.mid();
    this.flow = v;
    this.relay(function () {}, { keep: true });
    this.goTo(at, 0);
    return this.flow;
  };

  View.prototype.goTo = function (n, frac) {
    n = Math.max(1, Math.min(this.n, n | 0));
    var s = this.sheetOf(n);
    var f = frac > 0 ? (frac < 1 ? frac : 0.999) : 0;
    this.scroller.scrollTop = this.off() + this.stop[s] + f * this.slotH(s);
    this.sync();
    return this.firstOf(s);
  };

  /*@3.NOPJ3.8*/
  View.prototype.where = function () {
    var y = this.y();
    var s = this.atSheet(y);
    var f = (y - this.stop[s]) / Math.max(1, this.slotH(s));
    return { p: this.firstOf(s), f: f > 0 ? (f < 1 ? f : 0.999) : 0 };
  };

  /*@3.NOPJ3.29*/
  View.prototype.pick = function () {
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    if (!this.wrap || !this.wrap.contains(r.commonAncestorContainer) &&
        !this.wrap.contains(r.startContainer)) return null;
    return r;
  };

  View.prototype.drawSel = function () {
    if (this.dead || !this.wrap) return;
    var r = this.pick();
    for (var k in this.slots) {
      var s = this.slots[k];
      if (!s.sel) continue;
      s.sel.remove(); s.sel = null;
    }
    if (!r) return;
    for (var k2 in this.slots) {
      var sl = this.slots[k2];
      if (!sl.td) continue;
      var sub = r.cloneRange();
      try {
        if (!r.intersectsNode(sl.td)) continue;
        var box = document.createRange();
        box.selectNodeContents(sl.td);
        if (r.compareBoundaryPoints(Range.START_TO_START, box) < 0) sub.setStart(box.startContainer, box.startOffset);
        if (r.compareBoundaryPoints(Range.END_TO_END, box) > 0) sub.setEnd(box.endContainer, box.endOffset);
      } catch (e) { continue; }
      var rects = sub.getClientRects();
      if (!rects.length) continue;
      var base = sl.el.getBoundingClientRect();
      var boxes = merge(rects, base.left, base.top);
      var host = document.createElement('div');
      host.className = 'gpv-selpaint';
      sl.el.insertBefore(host, sl.td);
      sl.sel = host;
      paintBoxes(host, boxes, 'gpv-selbox');
    }
  };

  /*@3.NOPJ3.30*/
  View.prototype.selText = function () {
    var r = this.pick();
    var T = window.GardenPdfText;
    if (!r || !T) return '';
    var out = [];
    var nums = Object.keys(this.slots).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < nums.length; i++) {
      var s = this.slots[nums[i]];
      if (!s.td) continue;
      var spans = s.td.querySelectorAll('span');
      var cells = [];
      for (var j = 0; j < spans.length; j++) {
        var sp = spans[j];
        var node = sp.firstChild;
        if (!node || !node.length) continue;
        if (!r.intersectsNode(sp)) continue;
        var a = 0, b = node.length;
        if (r.startContainer === node) a = r.startOffset;
        if (r.endContainer === node) b = r.endOffset;
        if (b <= a) continue;
        var q = sp.getBoundingClientRect();
        cells.push({ s: node.data.slice(a, b), x: q.left, y: q.top, w: q.width, h: q.height });
      }
      if (cells.length) out.push(T.fromNodes(cells));
    }
    return out.join('\n');
  };

  /*@3.NOPJ3.34*/
  View.prototype.selectPage = function (n) {
    var s = this.slots[n || this.mid()];
    if (!s || !s.td) return false;
    var r = document.createRange();
    r.selectNodeContents(s.td);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    this.drawSel();
    return true;
  };

  /*@3.NOPJ3.35*/
  View.prototype.word = function (sp) {
    var td = sp.parentNode;
    if (!td || !td.classList || !td.classList.contains('gpv-text')) return false;
    var q = sp.getBoundingClientRect();
    var kin = td.querySelectorAll('span');
    var line = [];
    for (var i = 0; i < kin.length; i++) {
      var r = kin[i].getBoundingClientRect();
      if (!r.width) continue;
      if (Math.abs((r.top + r.height / 2) - (q.top + q.height / 2)) > q.height * 0.6) continue;
      line.push({ el: kin[i], r: r });
    }
    line.sort(function (a, b) { return a.r.left - b.r.left; });
    var at = -1, j;
    for (j = 0; j < line.length; j++) if (line[j].el === sp) { at = j; break; }
    if (at < 0) return false;
    var lim = q.height * 0.3;
    var lo = at, hi = at;
    while (lo > 0 && (line[lo].r.left - (line[lo - 1].r.left + line[lo - 1].r.width)) <= lim &&
           !/\s/.test(line[lo - 1].el.textContent)) lo--;
    while (hi < line.length - 1 && (line[hi + 1].r.left - (line[hi].r.left + line[hi].r.width)) <= lim &&
           !/\s/.test(line[hi + 1].el.textContent)) hi++;
    if (lo === hi) return false;
    var a = line[lo].el.firstChild, b = line[hi].el.firstChild;
    if (!a || !b) return false;
    var rg = document.createRange();
    var first = a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? a : b;
    var last = first === a ? b : a;
    try { rg.setStart(first, 0); rg.setEnd(last, last.length); } catch (e2) { return false; }
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rg);
    this.drawSel();
    return true;
  };

  /*@3.NOPJ3.59*/
  View.prototype.zoomPage = function (n, cx, cy) {
    if (this.focus) { this.unfocus(); return true; }
    if (!(n > 0)) return false;
    this.focus = { mode: this.mode, order: this.order, scale: this.scale, page: n,
                   flow: this.flow, where: this.where(),
                   grip: this.grip(cx, cy) };
    if (this.o.onFocus) this.o.onFocus(true, n, this.focus);
    return true;
  };

  View.prototype.unfocus = function () {
    var f = this.focus;
    if (!f) return false;
    this.focus = null;
    if (this.o.onFocus) this.o.onFocus(false, f.page, f);
    return true;
  };

  View.prototype.copy = function (e) {
    var t = this.selText();
    if (!t || !e.clipboardData) return;
    e.clipboardData.setData('text/plain', t);
    e.preventDefault();
  };

  View.prototype.destroy = function () {
    this.dead = true;
    this.gen++;
    if (this.tick) { cancelAnimationFrame(this.tick); this.tick = 0; }
    if (this.selTick) { cancelAnimationFrame(this.selTick); this.selTick = 0; }
    if (this.idle) { clearTimeout(this.idle); this.idle = 0; }
    if (this.onScroll && this.evTarget) {
      this.evTarget.removeEventListener('scroll', this.onScroll);
      this.onScroll = null;
    }
    var s = this.scroller;
    if (this.onWheel) {
      (s.removeEventListener ? s : window).removeEventListener('wheel', this.onWheel);
      this.onWheel = null;
    }
    if (this.onPd) {
      s.removeEventListener('pointerdown', this.onPd);
      s.removeEventListener('pointermove', this.onPm);
      s.removeEventListener('pointerup', this.onPu);
      s.removeEventListener('pointercancel', this.onPu);
      this.onPd = this.onPm = this.onPu = null;
    }
    if (this.onSel) { document.removeEventListener('selectionchange', this.onSel); this.onSel = null; }
    if (this.onCopy) { this.host.removeEventListener('copy', this.onCopy); this.onCopy = null; }
    if (this.onDbl) { this.host.removeEventListener('dblclick', this.onDbl); this.onDbl = null; }
    if (this.onTap) { this.host.removeEventListener('pointerup', this.onTap); this.onTap = null; }
    if (this.onTagClick) { this.host.removeEventListener('click', this.onTagClick); this.onTagClick = null; }
    if (this.ro) { try { this.ro.disconnect(); } catch (e) {} this.ro = null; }
    for (var k in this.slots) this.free(+k);
    try { this.h.doc.destroy(); } catch (e2) {}
    if (this.host) this.host.innerHTML = '';
  };

  function clampScale(n) {
    if (!(n > 0)) return 1;
    return n < 0.15 ? 0.15 : (n > 8 ? 8 : n);
  }

  function mount(host, handle, opts) {
    return new View(handle, host, opts).build();
  }

  /*@3.NOPJ3.18*/
  /*@3.NOPJ3.31*/
  function fitScale(handle, width, mode, height, whole) {
    /*@3.NOPJ3.56*/
    var g = grid(mode, width, height);
    var cols = g.cols, rws = g.rows;
    return handle.doc.getPage(1).then(function (p) {
      var vp = p.getViewport({ scale: 1 });
      var room = (width - CELL * (cols - 1)) / cols;
      var byW = room > 0 ? (room / vp.width) : 1;
      if (!whole || !(height > 0)) return byW;
      var tall = (height - CELL * (rws - 1)) / rws;
      var byH = tall > 0 ? (tall / vp.height) : byW;
      return Math.min(byW, byH);
    });
  }

  window.GardenPdfView = {
    load: load,
    mount: mount,
    fitScale: fitScale,
    grid: grid,
    merge: merge,
    paintBoxes: paintBoxes,
    ready: function () { return lib(); }
  };
})();
