;(function () {
  'use strict';

  var DB = 'byte-pdfink';
  var ST = 'ink';
  var _db = null;

  function idb() {
    if (_db) return _db;
    _db = new Promise(function (ok, no) {
      if (!window.indexedDB) { no(new Error('no-idb')); return; }
      var rq;
      try { rq = indexedDB.open(DB, 1); } catch (e) { no(e); return; }
      rq.onupgradeneeded = function () {
        try { rq.result.createObjectStore(ST); } catch (e2) {}
      };
      rq.onsuccess = function () { ok(rq.result); };
      rq.onerror = function () { no(rq.error || new Error('idb-open')); };
      rq.onblocked = function () { no(new Error('idb-blocked')); };
    });
    _db.catch(function () { _db = null; });
    return _db;
  }

  function idbDo(mode, run) {
    return idb().then(function (db) {
      return new Promise(function (ok, no) {
        var tx;
        try { tx = db.transaction(ST, mode); } catch (e) { no(e); return; }
        var out = null;
        tx.oncomplete = function () { ok(out); };
        tx.onerror = function () { no(tx.error || new Error('idb-tx')); };
        tx.onabort = function () { no(tx.error || new Error('idb-abort')); };
        try { run(tx.objectStore(ST), function (v) { out = v; }); }
        catch (e2) { try { tx.abort(); } catch (e3) {} no(e2); }
      });
    });
  }

  function key(id, page) { return id + '#' + page; }

  function read(id, page) {
    return idbDo('readonly', function (s, put) {
      var rq = s.get(key(id, page));
      rq.onsuccess = function () { put(rq.result || null); };
    }).catch(function () { return null; });
  }

  function write(id, page, row) {
    return idbDo('readwrite', function (s) {
      if (row && row.els && row.els.length) s.put(row, key(id, page));
      else s.delete(key(id, page));
    }).then(function () { return true; }, function () { return false; });
  }

  function pagesOf(id) {
    return idbDo('readonly', function (s, put) {
      var out = [];
      var rq = s.getAllKeys ? s.getAllKeys() : null;
      if (!rq) { put(out); return; }
      rq.onsuccess = function () {
        var all = rq.result || [];
        for (var i = 0; i < all.length; i++) {
          var k = String(all[i]);
          if (k.indexOf(id + '#') !== 0) continue;
          out.push(+k.slice(id.length + 1));
        }
        put(out.sort(function (a, b) { return a - b; }));
      };
    }).catch(function () { return []; });
  }

  function wipe(id) {
    return pagesOf(id).then(function (list) {
      if (!list.length) return true;
      return idbDo('readwrite', function (s) {
        for (var i = 0; i < list.length; i++) s.delete(key(id, list[i]));
      }).then(function () { return true; }, function () { return false; });
    });
  }

  /*@3.NOPJ8.1*/
  function frame(page, scale) {
    var vp = page.getViewport({ scale: scale || 1 });
    return {
      w: vp.width, h: vp.height,
      toPt: function (x, y) {
        var p = vp.convertToPdfPoint(x, y);
        return { x: p[0], y: p[1] };
      },
      toPx: function (x, y) {
        var p = vp.convertToViewportPoint(x, y);
        return { x: p[0], y: p[1] };
      }
    };
  }

  /*@3.NOPJ8.2*/
  function stamp(g, el, k, map) {
    var K = window.GardenCanvas;
    if (!K || !K.inkGeom || !K.inkPaints) return;
    var geom = K.inkGeom(el, k, map);
    if (!geom) return;
    var lay = K.inkPaints(geom);
    if (!lay.length) return;
    var hex = el.hi ? K.hiHexOf(el.c) : K.hexOf(el.c);
    g.save();
    g.fillStyle = hex;
    g.strokeStyle = hex;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    var api = {
      move: function (x, y) { g.moveTo(x, y); },
      line: function (x, y) { g.lineTo(x, y); },
      quad: function (cx, cy, x, y) { g.quadraticCurveTo(cx, cy, x, y); },
      close: function () { g.closePath(); },
      circle: function (x, y, r) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
    };
    for (var q = 0; q < lay.length; q++) {
      var pa = lay[q];
      g.globalAlpha = Math.max(0, Math.min(1, pa.alpha));
      g.beginPath();
      pa.emit(api);
      if (pa.fill) g.fill();
      else { g.lineWidth = pa.w; g.stroke(); }
    }
    g.restore();
  }

  function ratio(cap) {
    var d = window.devicePixelRatio || 1;
    var top = cap || 2.5;
    return d > top ? top : (d < 1 ? 1 : d);
  }

  function Ink(o) {
    this.o = o || {};
    this.id = this.o.id || '';
    this.view = this.o.view || null;
    this.pages = {};
    this.undoS = [];
    this.redoS = [];
    this.live = null;
    this.armed = false;
    this.dead = false;
    this.saveT = {};
    paper(true);
  }

  /*@3.NOPJ8.13*/
  function paper(on) {
    var K = window.GardenCanvas;
    if (!K || !K.setPaper) return false;
    return K.setPaper(on ? '#ffffff' : null);
  }

  Ink.prototype.setView = function (v) { this.view = v; };

  Ink.prototype.tool = function () {
    var t = this.o.tool ? this.o.tool() : this.kit();
    return {
      act: (t && t.act) || 'pen',
      c: (t && t.c) || 'ink',
      w: (t && t.w > 0) ? t.w : 2,
      nib: (t && t.nib) || 'round',
      hi: !!(t && t.hi),
      o: (t && t.o > 0) ? t.o : 1,
      hiMode: (t && t.hiMode) || 'text',
      straight: (t && t.straight != null) ? t.straight : 1,
      eraseMode: (t && t.eraseMode) === 'part' ? 'part' : 'whole'
    };
  };

  /*@3.NOPJ8.3*/
  Ink.prototype.layer = function (n, el, geo) {
    var p = this.pages[n];
    if (!p) {
      p = this.pages[n] = { n: n, el: el, els: [], loaded: false };
      /*@3.NOPJ8.22*/
      var hic = document.createElement('canvas');
      hic.className = 'gpi-hi';
      el.appendChild(hic);
      p.hi = hic;
      var dry = document.createElement('canvas');
      dry.className = 'gpi-dry';
      el.appendChild(dry);
      p.dry = dry;
      this.load(n);
    }
    p.el = el;
    p.page = geo && geo.page ? geo.page : p.page;
    p.w = (geo && geo.w) || p.w || 1;
    p.h = (geo && geo.h) || p.h || 1;
    p.scale = (geo && geo.scale) || 1;
    if (p.hi && p.hi.parentNode !== el) el.appendChild(p.hi);
    if (p.dry.parentNode !== el) el.appendChild(p.dry);
    this.size(p);
    this.paint(n);
    this.beat();
    return p;
  };

  Ink.prototype.size = function (p) {
    var r = ratio(this.o.maxRatio);
    var w = Math.max(1, Math.round(p.w * p.scale * r));
    var h = Math.max(1, Math.round(p.h * p.scale * r));
    if (p.dry.width !== w || p.dry.height !== h) {
      p.dry.width = w; p.dry.height = h;
    }
    if (p.hi && (p.hi.width !== w || p.hi.height !== h)) {
      p.hi.width = w; p.hi.height = h;
    }
    p.k = r;
    if (p.wet && (p.wet.width !== w || p.wet.height !== h)) {
      p.wet.width = w; p.wet.height = h;
    }
  };

  Ink.prototype.off = function (n) {
    var p = this.pages[n];
    if (!p) return;
    this.flush(n);
    /*@3.NOPJ8.62*/
    if (this.view && this.view.slots && this.view.slots[n] && this.view.slots[n].hl) {
      var mk2 = this.view.slots[n].hl.querySelectorAll('.gpi-mk');
      for (var z = 0; z < mk2.length; z++) mk2[z].remove();
    }
    if (p.dry) { p.dry.width = 0; p.dry.height = 0; }
    if (p.hi) { p.hi.width = 0; p.hi.height = 0; }
    if (p.wet) { p.wet.width = 0; p.wet.height = 0; }
    delete this.pages[n];
  };

  Ink.prototype.load = function (n) {
    var self = this;
    if (!this.id) return Promise.resolve(null);
    return read(this.id, n).then(function (row) {
      var p = self.pages[n];
      if (!p || self.dead) return null;
      p.loaded = true;
      if (row && row.els && row.els.length && !p.els.length) {
        p.els = row.els;
        self.paint(n);
        if (self.o.onCount) self.o.onCount(self.count());
      }
      return row;
    });
  };

  /*@3.NOPJ8.4*/
  Ink.prototype.frameOf = function (p, k) {
    if (!p.page) return null;
    var box = p._frs || (p._frs = {});
    var id = String(Math.round(k * 10000));
    if (!box[id]) {
      if (Object.keys(box).length > 3) p._frs = box = {};
      box[id] = frame(p.page, k);
    }
    return box[id];
  };

  Ink.prototype.mapOf = function (p) {
    var k = p.scale * p.k;
    var f = this.frameOf(p, k);
    if (!f) return function (x, y) { return { x: x * k, y: y * k }; };
    return f.toPx;
  };

  /*@3.NOPJ8.23*/
  Ink.prototype.paint = function (n) {
    var p = this.pages[n];
    if (!p || !p.dry) return;
    this.paintMarks(n);
    var g = p.dry.getContext('2d');
    var gh = p.hi ? p.hi.getContext('2d') : null;
    if (!g) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, p.dry.width, p.dry.height);
    if (gh) { gh.setTransform(1, 0, 0, 1, 0, 0); gh.clearRect(0, 0, p.hi.width, p.hi.height); }
    if (!p.els.length) return;
    var map = this.mapOf(p);
    var k = p.scale * p.k;
    for (var i = 0; i < p.els.length; i++) {
      var e = p.els[i];
      if (!e || e.ty === 'hl') continue;
      stamp((e && e.hi && gh) ? gh : g, e, k, map);
    }
  };

  Ink.prototype.wetOf = function (p) {
    if (p.wet) return p.wet;
    var c = document.createElement('canvas');
    c.className = 'gpi-wet';
    c.width = p.dry.width; c.height = p.dry.height;
    p.el.appendChild(c);
    p.wet = c;
    return c;
  };

  Ink.prototype.drawWet = function (p, el) {
    var c = this.wetOf(p);
    var g = c.getContext('2d');
    if (!g) return;
    if (el && el.hi) c.setAttribute('data-hi', '1');
    else c.removeAttribute('data-hi');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    stamp(g, el, p.scale * p.k, this.mapOf(p));
  };

  Ink.prototype.clearWet = function (p) {
    if (!p || !p.wet) return;
    var g = p.wet.getContext('2d');
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, p.wet.width, p.wet.height); }
  };

  /*@3.NOPJ8.5*/
  Ink.prototype.spot = function (lx, ly) {
    var v = this.view;
    if (!v || !v.pageAt) return null;
    if (!(lx === lx) || !(ly === ly)) return null;
    var a = v.pageAt(lx, ly);
    if (!a) return null;
    var p = this.pages[a.n];
    if (!p) return null;
    var f = this.frameOf(p, p.scale);
    var pt = f ? f.toPt(a.x * p.scale, a.y * p.scale) : { x: a.x, y: a.y };
    return { n: a.n, p: p, x: pt.x, y: pt.y, hit: a.hit };
  };

  Ink.prototype.begin = function (lx, ly, pressure, tilt) {
    var s = this.spot(lx, ly);
    if (!s || !s.hit) return false;
    var t = this.tool();
    if (t.act === 'erase') {
      this.live = { erase: 1, n: s.n, gone: [], cut: [], snap: s.p.els.slice() };
      this.rub(s);
      return true;
    }
    /*@3.NOPJ8.34*/
    if (t.act === 'sel' || t.act === 'lasso') {
      if (t.act === 'sel' && this.inPick(s.n, s.x, s.y)) {
        this.live = { drag: 1, n: s.n, x: s.x, y: s.y, dx: 0, dy: 0,
                      snap: deep(s.p.els) };
        return true;
      }
      this.live = { mark: t.act, n: s.n, x0: s.x, y0: s.y, x1: s.x, y1: s.y,
                    poly: [{ x: s.x, y: s.y }] };
      this.setPick(null);
      return true;
    }
    if (t.act === 'hand') return false;
    var pt = { x: s.x, y: s.y, p: pressure == null ? 0.55 : pressure };
    if (tilt) { pt.tz = tilt.tz; pt.az = tilt.az; }
    this.live = {
      n: s.n,
      el: { ty: 'st', pts: [pt], c: t.c, w: t.w, nib: t.nib, o: t.o, hi: t.hi ? 1 : 0,
            ts: Date.now() - (this.o.t0 || 0) }
    };
    this.drawWet(s.p, this.live.el);
    return true;
  };

  Ink.prototype.move = function (lx, ly, pressure, tilt) {
    var L = this.live;
    if (!L) return;
    var s = this.spot(lx, ly);
    if (!s) return;
    if (L.erase) { if (s.n === L.n) this.rub(s); return; }
    /*@3.NOPJ8.35*/
    if (L.mark) {
      if (s.n !== L.n) return;
      L.x1 = s.x; L.y1 = s.y;
      if (L.mark === 'lasso') L.poly.push({ x: s.x, y: s.y });
      this.paintMark(L);
      return;
    }
    if (L.drag) {
      if (s.n !== L.n) return;
      this.slide(L, s.x - L.x - L.dx, s.y - L.y - L.dy);
      L.dx = s.x - L.x; L.dy = s.y - L.y;
      return;
    }
    if (s.n !== L.n) return;
    var pt = { x: s.x, y: s.y, p: pressure == null ? 0.55 : pressure };
    if (tilt) { pt.tz = tilt.tz; pt.az = tilt.az; }
    L.el.pts.push(pt);
    this.drawWet(s.p, L.el);
  };

  Ink.prototype.end = function (keep) {
    var L = this.live;
    this.live = null;
    if (!L) return false;
    var p = this.pages[L.n];
    /*@3.NOPJ8.36*/
    if (L.mark) {
      if (p) this.clearWet(p);
      if (keep) {
        var pk = this.hits(L);
        if (!pk) {
          var at = this.hit(L.n, L.x1, L.y1);
          if (at >= 0) pk = { n: L.n, ids: [at] };
        }
        this.setPick(pk);
      }
      this.beat();
      return true;
    }
    if (L.drag) {
      if (L.dx || L.dy) {
        this.push({ act: 'set', n: L.n, before: L.snap,
                    after: p ? deep(p.els) : [] });
        this.touch(L.n);
      }
      this.beat();
      return true;
    }
    if (L.erase) {
      /*@3.NOPJ8.20*/
      if (L.cut && L.cut.length) {
        this.push({ act: 'set', n: L.n, before: L.snap,
                    after: p ? p.els.slice() : [] });
        this.touch(L.n);
        return true;
      }
      if (!L.gone.length) return false;
      this.push({ act: 'erase', n: L.n, gone: L.gone });
      this.touch(L.n);
      return true;
    }
    if (p) this.clearWet(p);
    if (!keep || !p || L.el.pts.length < 1) return false;
    var tk = this.tool();
    /*@3.NOPJ8.57*/
    if (tk.hi && tk.hiMode !== 'free' && L.el.pts.length > 1) {
      var qa = L.el.pts[0], qb = L.el.pts[L.el.pts.length - 1];
      var rects = this.markRects(L.n, qa, qb, tk.hiMode === 'line' ? 'line' : 'text');
      if (rects && rects.length) {
        if (this.face) {
          this.face.used = { tool: 'hi', color: this.face.color,
                             width: this.face.width, nib: this.face.nib, straight: 1 };
        }
        this.addMark(L.n, rects, tk.c);
        return true;
      }
    }
    /*@3.NOPJ8.19*/
    var more = this.dress(L.n, L.el, tk);
    /*@3.NOPJ8.21*/
    if (this.face) {
      this.face.used = { tool: L.el.hi ? 'hi' : 'pen', color: this.face.color,
                         width: this.face.width, nib: L.el.nib || this.face.nib,
                         straight: L.el.hi ? (this.face.hiStraight ? 1 : 0) : 0 };
    }
    /*@3.NOPJ8.28*/
    if (more && more.length) {
      var snap = p.els.slice();
      p.els.push(L.el);
      for (var m = 0; m < more.length; m++) p.els.push(more[m]);
      this.push({ act: 'set', n: L.n, before: snap, after: p.els.slice() });
    } else {
      this.push({ act: 'add', n: L.n, el: L.el });
      p.els.push(L.el);
    }
    this.paint(L.n);
    this.touch(L.n);
    return true;
  };

  /*@3.NOPJ8.37*/
  function deep(list) {
    return JSON.parse(JSON.stringify(list || []));
  }

  function bboxOf(el) {
    var pts = el && el.pts;
    if (!pts || !pts.length) return null;
    var b = { x0: pts[0].x, x1: pts[0].x, y0: pts[0].y, y1: pts[0].y };
    for (var i = 1; i < pts.length; i++) {
      if (pts[i].x < b.x0) b.x0 = pts[i].x;
      if (pts[i].x > b.x1) b.x1 = pts[i].x;
      if (pts[i].y < b.y0) b.y0 = pts[i].y;
      if (pts[i].y > b.y1) b.y1 = pts[i].y;
    }
    var pad = (el.w || 2) / 2;
    b.x0 -= pad; b.x1 += pad; b.y0 -= pad; b.y1 += pad;
    return b;
  }

  function inPoly(poly, x, y) {
    var on = false, n = poly.length, i, j;
    for (i = 0, j = n - 1; i < n; j = i++) {
      var a = poly[i], c = poly[j];
      if ((a.y > y) !== (c.y > y) &&
          x < (c.x - a.x) * (y - a.y) / ((c.y - a.y) || 1e-9) + a.x) on = !on;
    }
    return on;
  }

  /*@3.NOPJ8.38*/
  Ink.prototype.hits = function (L) {
    var p = this.pages[L.n];
    if (!p || !p.els.length) return null;
    /*@3.NOPJ8.50*/
    var lasso = L.mark === 'lasso' && L.poly.length > 3;
    var rect;
    if (lasso) {
      rect = { x0: L.poly[0].x, x1: L.poly[0].x, y0: L.poly[0].y, y1: L.poly[0].y };
      for (var q = 1; q < L.poly.length; q++) {
        var pp = L.poly[q];
        if (pp.x < rect.x0) rect.x0 = pp.x;
        if (pp.x > rect.x1) rect.x1 = pp.x;
        if (pp.y < rect.y0) rect.y0 = pp.y;
        if (pp.y > rect.y1) rect.y1 = pp.y;
      }
    } else {
      rect = { x0: Math.min(L.x0, L.x1), x1: Math.max(L.x0, L.x1),
               y0: Math.min(L.y0, L.y1), y1: Math.max(L.y0, L.y1) };
    }
    if (rect.x1 - rect.x0 < 2 && rect.y1 - rect.y0 < 2) return null;
    var out = [], i, k;
    for (i = 0; i < p.els.length; i++) {
      var el = p.els[i], pts = el.pts;
      if (!pts || !pts.length) continue;
      var any = false;
      for (k = 0; k < pts.length; k++) {
        var q = pts[k];
        if (q.x < rect.x0 || q.x > rect.x1 || q.y < rect.y0 || q.y > rect.y1) continue;
        if (lasso && !inPoly(L.poly, q.x, q.y)) continue;
        any = true; break;
      }
      if (any) out.push(i);
    }
    return out.length ? { n: L.n, ids: out } : null;
  };

  Ink.prototype.hit = function (n, x, y, pad) {
    var K = window.GardenCanvas;
    var p = this.pages[n];
    if (!p || !p.els.length) return -1;
    var lim = pad > 0 ? pad : 6;
    for (var i = p.els.length - 1; i >= 0; i--) {
      var el = p.els[i];
      if (el.ty === 'hl') {
        for (var q = 0; q < (el.r || []).length; q++) {
          var b = el.r[q];
          if (x >= b.x - lim && x <= b.x + b.w + lim &&
              y >= b.y - lim && y <= b.y + b.h + lim) return i;
        }
        continue;
      }
      var pts = el.pts || [];
      var r = lim + (el.w || 2) / 2;
      if (pts.length === 1) {
        var dx = pts[0].x - x, dy = pts[0].y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= r) return i;
        continue;
      }
      if (!K || !K.segDist) continue;
      for (var j = 1; j < pts.length; j++) {
        if (K.segDist(x, y, pts[j - 1].x, pts[j - 1].y, pts[j].x, pts[j].y) <= r) return i;
      }
    }
    return -1;
  };

  /*@3.NOPJ8.39*/
  Ink.prototype.setPick = function (pk) {
    var old = this.pick;
    this.pick = pk || null;
    if (old && (!pk || pk.n !== old.n)) {
      var po = this.pages[old.n];
      if (po) this.clearWet(po);
    }
    if (pk) this.paintPick();
    if (this.face) this.face.selection = pk ? pk.ids.length : 0;
  };

  /*@3.NOPJ8.40*/
  Ink.prototype.pickBox = function () {
    var pk = this.pick;
    if (!pk) return null;
    var p = this.pages[pk.n];
    if (!p) return null;
    var box = null, i;
    for (i = 0; i < pk.ids.length; i++) {
      var b = bboxOf(p.els[pk.ids[i]]);
      if (!b) continue;
      if (!box) box = { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1 };
      else {
        if (b.x0 < box.x0) box.x0 = b.x0;
        if (b.x1 > box.x1) box.x1 = b.x1;
        if (b.y0 < box.y0) box.y0 = b.y0;
        if (b.y1 > box.y1) box.y1 = b.y1;
      }
    }
    return box;
  };

  Ink.prototype.inPick = function (n, x, y) {
    if (!this.pick || this.pick.n !== n) return false;
    var b = this.pickBox();
    if (!b) return false;
    var pad = 4;
    return x >= b.x0 - pad && x <= b.x1 + pad && y >= b.y0 - pad && y <= b.y1 + pad;
  };

  /*@3.NOPJ8.41*/
  Ink.prototype.paintMark = function (L) {
    var p = this.pages[L.n];
    if (!p) return;
    var c = this.wetOf(p);
    var g = c.getContext('2d');
    if (!g) return;
    c.removeAttribute('data-hi');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    var map = this.mapOf(p);
    g.save();
    g.strokeStyle = '#7c3aed';
    g.lineWidth = Math.max(1, p.k);
    g.setLineDash([6 * p.k, 4 * p.k]);
    g.beginPath();
    if (L.mark === 'lasso' && L.poly.length > 1) {
      var a0 = map(L.poly[0].x, L.poly[0].y);
      g.moveTo(a0.x, a0.y);
      for (var i = 1; i < L.poly.length; i++) {
        var q = map(L.poly[i].x, L.poly[i].y);
        g.lineTo(q.x, q.y);
      }
      g.closePath();
    } else {
      var a = map(L.x0, L.y0), b = map(L.x1, L.y1);
      g.rect(Math.min(a.x, b.x), Math.min(a.y, b.y),
             Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    }
    g.stroke();
    g.restore();
  };

  /*@3.NOPJ8.42*/
  Ink.prototype.paintPick = function () {
    var pk = this.pick;
    if (!pk) return;
    var p = this.pages[pk.n];
    var box = this.pickBox();
    if (!p || !box) return;
    var c = this.wetOf(p);
    var g = c.getContext('2d');
    if (!g) return;
    c.removeAttribute('data-hi');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    var map = this.mapOf(p);
    var a = map(box.x0, box.y0), b = map(box.x1, box.y1);
    g.save();
    g.strokeStyle = '#7c3aed';
    g.fillStyle = 'rgba(124, 58, 237, .10)';
    g.lineWidth = Math.max(1, p.k);
    g.setLineDash([5 * p.k, 3 * p.k]);
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    var w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    g.fillRect(x, y, w, h);
    g.strokeRect(x, y, w, h);
    g.restore();
  };

  /*@3.NOPJ8.43*/
  Ink.prototype.slide = function (L, dx, dy) {
    var pk = this.pick;
    var p = this.pages[L.n];
    if (!pk || !p || pk.n !== L.n) return;
    for (var i = 0; i < pk.ids.length; i++) {
      var el = p.els[pk.ids[i]];
      if (!el || !el.pts) continue;
      for (var k = 0; k < el.pts.length; k++) { el.pts[k].x += dx; el.pts[k].y += dy; }
    }
    this.paint(L.n);
    this.paintPick();
  };

  /*@3.NOPJ8.44*/
  Ink.prototype.dropPick = function () {
    var pk = this.pick;
    if (!pk) return false;
    var p = this.pages[pk.n];
    if (!p) return false;
    var before = p.els.slice();
    var keep = [], i;
    var kill = {};
    for (i = 0; i < pk.ids.length; i++) kill[pk.ids[i]] = 1;
    for (i = 0; i < p.els.length; i++) if (!kill[i]) keep.push(p.els[i]);
    p.els = keep;
    this.push({ act: 'set', n: pk.n, before: before, after: p.els.slice() });
    this.setPick(null);
    this.clearWet(p);
    this.paint(pk.n);
    this.touch(pk.n);
    this.beat();
    return true;
  };

  Ink.prototype.pickEls = function () {
    var pk = this.pick;
    if (!pk) return [];
    var p = this.pages[pk.n];
    if (!p) return [];
    var out = [];
    for (var i = 0; i < pk.ids.length; i++) {
      if (p.els[pk.ids[i]]) out.push(p.els[pk.ids[i]]);
    }
    return out;
  };

  Ink.prototype.selectAll = function (n) {
    var v = this.view;
    var pg = n || (v && v.mid ? v.mid() : 1);
    var p = this.pages[pg];
    if (!p || !p.els.length) return false;
    var ids = [];
    for (var i = 0; i < p.els.length; i++) ids.push(i);
    this.setPick({ n: pg, ids: ids });
    this.beat();
    return true;
  };

  Ink.prototype.dupPick = function () {
    var pk = this.pick;
    var K = window.GardenCanvas;
    if (!pk || !K || !K.eachPoint) return false;
    var p = this.pages[pk.n];
    if (!p) return false;
    var snap = deep(p.els);
    var list = this.pickEls(), ids = [];
    for (var i = 0; i < list.length; i++) {
      var c = deep([list[i]])[0];
      if (c.ts != null) c.ts = Date.now() - (this.o.t0 || 0) + i;
      K.eachPoint(c, function (x, y) { return [x + 12, y - 12]; });
      ids.push(p.els.length);
      p.els.push(c);
    }
    if (!ids.length) return false;
    this.push({ act: 'set', n: pk.n, before: snap, after: deep(p.els) });
    this.paint(pk.n);
    this.touch(pk.n);
    this.setPick({ n: pk.n, ids: ids });
    this.beat();
    return true;
  };

  Ink.prototype.rotatePick = function (deg) {
    var pk = this.pick;
    var K = window.GardenCanvas;
    if (!pk || !K || !K.eachPoint) return false;
    var p = this.pages[pk.n];
    var b = this.pickBox();
    if (!p || !b) return false;
    var snap = deep(p.els);
    var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    var a = (deg || 90) * Math.PI / 180;
    var cos = Math.cos(a), sin = Math.sin(a);
    var list = this.pickEls();
    if (!list.length) return false;
    for (var i = 0; i < list.length; i++) {
      K.eachPoint(list[i], function (x, y) {
        var ox = x - cx, oy = y - cy;
        return [cx + ox * cos - oy * sin, cy + ox * sin + oy * cos];
      });
    }
    this.push({ act: 'set', n: pk.n, before: snap, after: deep(p.els) });
    this.paint(pk.n);
    this.paintPick();
    this.touch(pk.n);
    this.beat();
    return true;
  };

  Ink.prototype.stylePick = function (patch) {
    var pk = this.pick;
    if (!pk || !patch) return false;
    var p = this.pages[pk.n];
    if (!p) return false;
    var list = this.pickEls();
    if (!list.length) return false;
    var snap = deep(p.els), hit = 0, k;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.ty === 'hl') {
        if (patch.c == null) continue;
        el.c = patch.c; hit = 1;
        continue;
      }
      for (k in patch) {
        if (patch[k] == null) continue;
        if (k === 'c') el.c = patch.c;
        else if (k === 'w') el.w = patch.w;
        else if (k === 'nib') el.nib = patch.nib;
        else continue;
        hit = 1;
      }
    }
    if (!hit) return false;
    this.push({ act: 'set', n: pk.n, before: snap, after: deep(p.els) });
    this.paint(pk.n);
    this.paintPick();
    this.touch(pk.n);
    this.beat();
    return true;
  };

  Ink.prototype.copyPick = function () {
    var K = window.GardenCanvas;
    var list = this.pickEls();
    if (!list.length || !K || !K.clip) return false;
    K.clip.store(deep(list));
    this.beat();
    return true;
  };

  Ink.prototype.cutPick = function () {
    if (!this.copyPick()) return false;
    return this.dropPick();
  };

  Ink.prototype.canPaste = function () {
    var K = window.GardenCanvas;
    return !!(K && K.clip && K.clip.any());
  };

  Ink.prototype.pastePick = function (n) {
    var K = window.GardenCanvas;
    if (!K || !K.clip || !K.eachPoint) return false;
    var list = K.clip.load();
    if (!list || !list.length) return false;
    var v = this.view;
    var pg = n || (this.pick && this.pick.n) || (v && v.mid ? v.mid() : 1);
    var p = this.pages[pg];
    if (!p) return false;
    var box = K.unionBox ? null : null;
    var snap = deep(p.els);
    var ids = [];
    for (var i = 0; i < list.length; i++) {
      var c = deep([list[i]])[0];
      c.ts = Date.now() - (this.o.t0 || 0) + i;
      K.eachPoint(c, function (x, y) { return [x + 16, y - 16]; });
      ids.push(p.els.length);
      p.els.push(c);
    }
    if (!ids.length) return false;
    void box;
    this.push({ act: 'set', n: pg, before: snap, after: deep(p.els) });
    this.paint(pg);
    this.touch(pg);
    this.setPick({ n: pg, ids: ids });
    this.beat();
    return true;
  };

  /*@3.NOPJ8.45*/
  Ink.prototype.gesture = function (phase, g) {
    var v = this.view;
    if (this.o.onGesture) this.o.onGesture(phase, g);
    if (!v || !v.scroller || !g) return;
    /*@3.NOPJ8.51*/
    if (phase === 'end' || !g.n) { this._pan = null; return; }
    if (phase === 'start' || !this._pan || this._pan.n !== g.n) {
      this._pan = { x: g.x, y: g.y, n: g.n };
      return;
    }
    v.scroller.scrollLeft -= (g.x - this._pan.x);
    v.scroller.scrollTop -= (g.y - this._pan.y);
    this._pan.x = g.x; this._pan.y = g.y;
  };

  function eraseLim(t, view) {
    var K = window.GardenCanvas;
    var E = (K && K.ERASE) || { TOL_PX: 8, partR: function (w) { return Math.max(6, w * 2.2); } };
    if (t.eraseMode === 'part') return E.partR(t.w);
    var z = (view && view.scale) || 1;
    return E.TOL_PX / z;
  }

  /*@3.NOPJ8.6*/
  Ink.prototype.rub = function (s) {
    var K = window.GardenCanvas;
    var p = s.p;
    if (!p || !p.els.length || !K || !K.segDist) return;
    var t = this.tool();
    var lim = eraseLim(t, this.view);
    if (t.eraseMode === 'part') {
      var r = this.slice(p, s, lim);
      if (!r.cut.length) return;
      if (this.live && this.live.erase) this.live.cut = this.live.cut.concat(r.cut);
      this.paint(s.n);
      return;
    }
    var gone = [];
    for (var i = p.els.length - 1; i >= 0; i--) {
      var el = p.els[i];
      /*@3.NOPJ8.61*/
      if (el.ty === 'hl') {
        var mk = false;
        for (var q = 0; q < (el.r || []).length; q++) {
          var b = el.r[q];
          if (s.x >= b.x - lim / 2 && s.x <= b.x + b.w + lim / 2 &&
              s.y >= b.y - lim / 2 && s.y <= b.y + b.h + lim / 2) { mk = true; break; }
        }
        if (!mk) continue;
        gone.push({ at: i, el: el });
        p.els.splice(i, 1);
        continue;
      }
      var pts = el.pts || [];
      var hit = false;
      for (var j = 1; j < pts.length; j++) {
        if (K.segDist(s.x, s.y, pts[j - 1].x, pts[j - 1].y, pts[j].x, pts[j].y) <=
            lim + (el.w || 2) / 2) { hit = true; break; }
      }
      if (!hit && pts.length === 1) {
        var dx = pts[0].x - s.x, dy = pts[0].y - s.y;
        hit = Math.sqrt(dx * dx + dy * dy) <= lim + (el.w || 2) / 2;
      }
      if (!hit) continue;
      gone.push({ at: i, el: el });
      p.els.splice(i, 1);
    }
    if (!gone.length) return;
    if (this.live && this.live.erase) this.live.gone = this.live.gone.concat(gone);
    this.paint(s.n);
  };

  /*@3.NOPJ8.7*/
  Ink.prototype.push = function (act) {
    this.undoS.push(act);
    if (this.undoS.length > 120) this.undoS.shift();
    this.redoS.length = 0;
    this.beat();
    if (this.o.onCount) this.o.onCount(this.count());
  };

  Ink.prototype.undo = function () {
    var a = this.undoS.pop();
    if (!a) return false;
    this.apply(a, true);
    this.redoS.push(a);
    this.beat();
    if (this.o.onCount) this.o.onCount(this.count());
    return true;
  };

  Ink.prototype.redo = function () {
    var a = this.redoS.pop();
    if (!a) return false;
    this.apply(a, false);
    this.undoS.push(a);
    this.beat();
    if (this.o.onCount) this.o.onCount(this.count());
    return true;
  };

  Ink.prototype.apply = function (a, back) {
    var p = this.pages[a.n];
    var i;
    if (!p) { this.pending(a, back); return; }
    if (a.act === 'set') {
      p.els = (back ? a.before : a.after).slice();
    } else if (a.act === 'add') {
      if (back) {
        i = findEl(p.els, a.el);
        if (i >= 0) p.els.splice(i, 1);
      } else p.els.push(a.el);
    } else {
      var rows = a.gone || [];
      if (back) {
        for (i = rows.length - 1; i >= 0; i--) p.els.splice(rows[i].at, 0, rows[i].el);
      } else {
        for (i = 0; i < rows.length; i++) {
          var at = findEl(p.els, rows[i].el);
          if (at >= 0) p.els.splice(at, 1);
        }
      }
    }
    this.paint(a.n);
    this.touch(a.n);
  };

  /*@3.NOPJ8.8*/
  Ink.prototype.pending = function (a, back) {
    var self = this;
    read(this.id, a.n).then(function (row) {
      var els = (row && row.els) || [];
      var i;
      if (a.act === 'set') {
        els = (back ? a.before : a.after).slice();
      } else if (a.act === 'add') {
        if (back) {
          for (i = els.length - 1; i >= 0; i--) if (same(els[i], a.el)) { els.splice(i, 1); break; }
        } else els.push(a.el);
      } else {
        var rows = a.gone || [];
        if (back) for (i = rows.length - 1; i >= 0; i--) els.splice(Math.min(rows[i].at, els.length), 0, rows[i].el);
        else {
          for (i = 0; i < rows.length; i++) {
            for (var j = els.length - 1; j >= 0; j--) if (same(els[j], rows[i].el)) { els.splice(j, 1); break; }
          }
        }
      }
      void 0;
      return write(self.id, a.n, { els: els, t: Date.now() });
    });
  };

  function same(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.ty === 'hl' || b.ty === 'hl') {
      if (a.ty !== b.ty || a.c !== b.c) return false;
      var ra = a.r || [], rb = b.r || [];
      if (ra.length !== rb.length || !ra.length) return false;
      return ra[0].x === rb[0].x && ra[0].y === rb[0].y && ra[0].w === rb[0].w;
    }
    if (!a.pts || !b.pts || a.pts.length !== b.pts.length) return false;
    return a.ts === b.ts && a.pts[0].x === b.pts[0].x && a.pts[0].y === b.pts[0].y;
  }

  function findEl(list, el) {
    var i = list.indexOf(el);
    if (i >= 0) return i;
    for (i = list.length - 1; i >= 0; i--) if (same(list[i], el)) return i;
    return -1;
  }

  Ink.prototype.count = function () {
    var n = 0;
    for (var k in this.pages) n += this.pages[k].els.length;
    return { pages: Object.keys(this.pages).length, els: n,
             undo: this.undoS.length, redo: this.redoS.length };
  };

  Ink.prototype.els = function (n) {
    var p = this.pages[n];
    return p ? p.els.slice() : [];
  };

  /*@3.NOPJ8.9*/
  Ink.prototype.touch = function (n) {
    var self = this;
    if (this.saveT[n]) clearTimeout(this.saveT[n]);
    this.saveT[n] = setTimeout(function () {
      self.saveT[n] = 0;
      self.flush(n);
    }, 700);
    if (this.o.onDirty) this.o.onDirty(n);
  };

  Ink.prototype.flush = function (n) {
    if (this.saveT[n]) { clearTimeout(this.saveT[n]); this.saveT[n] = 0; }
    var p = this.pages[n];
    if (!p || !this.id || !p.loaded) return Promise.resolve(false);
    return write(this.id, n, { els: p.els, t: Date.now() });
  };

  Ink.prototype.flushAll = function () {
    var jobs = [];
    for (var k in this.pages) jobs.push(this.flush(+k));
    return Promise.all(jobs);
  };

  /*@3.NOPJ8.10*/
  Ink.prototype.arm = function (on) {
    var v = this.view;
    if (!v || !v.wrap) return false;
    if (!on) {
      if (this.router) { try { this.router.destroy(); } catch (e) {} this.router = null; }
      if (this.grab && this.grab.parentNode) this.grab.parentNode.removeChild(this.grab);
      this.grab = null;
      /*@3.NOPJ8.48*/
      if (this._key) { document.removeEventListener('keydown', this._key, true); this._key = null; }
      if (this._ring) { this._ring.drop(); this._ring = null; }
      this._hoverOff();
      this.setPick(null);
      this.armed = false;
      if (this.o.onArm) this.o.onArm(false);
      return false;
    }
    if (this.armed) return true;
    var el = document.createElement('div');
    el.className = 'gpi-catch';
    v.wrap.appendChild(el);
    this.grab = el;
    var self = this;
    var I = window.GardenInkInput;
    if (!I) { this.arm(false); return false; }
    var has = function () { return !!(self.pick && self.pick.ids.length); };
    /*@3.NOPJ8.49*/
    this._key = I.keys({
      'mod+z': function () { self.undo(); },
      'mod+shift+z': function () { self.redo(); },
      'mod+y': function () { self.redo(); },
      'mod+a': function () { self.selectAll(); },
      'mod+d': function () { if (!has()) return false; self.dupPick(); },
      'mod+c': function () { if (!has()) return false; self.copyPick(); },
      'mod+x': function () { if (!has()) return false; self.cutPick(); },
      'mod+v': function () { if (!self.canPaste()) return false; self.pastePick(); },
      'r': function () { if (!has()) return false; self.rotatePick(15); },
      'shift+r': function () { if (!has()) return false; self.rotatePick(-15); },
      'delete': function () { if (!has()) return false; self.dropPick(); },
      'backspace': function () { if (!has()) return false; self.dropPick(); },
      'escape': function () {
        if (!has()) return false;
        self.setPick(null);
        self.beat();
      }
    }, function () { return !!self.armed; });
    document.addEventListener('keydown', this._key, true);
    this._ring = I.ring(el);
    this._hoverOn(el);
    this.router = I.create({
      el: el,
      /*@3.NOPJ8.31*/
      mode: function () { return self.tool().act === 'hand' ? 'pan' : 'draw'; },
      /*@3.NOPJ8.63*/
      palmDefault: 'always',
      /*@3.NOPJ8.64*/
      onBegin: function (id, pt, ptype, act) {
        if (act) self.mods().begin(act);
        self.begin(pt.x, pt.y, pt.p, tiltOf(pt));
      },
      onMove: function (id, out) {
        for (var i = 0; i < out.length; i++) self.move(out[i].x, out[i].y, out[i].p, tiltOf(out[i]));
      },
      onEnd: function (id, keep) { self.end(keep); },
      /*@3.NOPJ8.65*/
      onEndMod: function (info) { self.mods().end(info); },
      /*@3.NOPJ8.32*/
      onGesture: function (phase, g) { self.gesture(phase, g); }
    });
    this.armed = true;
    if (this.o.onArm) this.o.onArm(true);
    return true;
  };

  /*@3.NOPJ8.66*/
  Ink.prototype.ringR = function () {
    var K = window.GardenCanvas;
    var E = (K && K.ERASE) || { RING_PX: 9 };
    var t = this.tool();
    var z = (this.view && this.view.scale) || 1;
    return (t.eraseMode === 'part') ? eraseLim(t, this.view) * z : E.RING_PX;
  };

  Ink.prototype._hoverOn = function (el) {
    var self = this;
    this._hoverOff();
    this._hv = function (e) {
      if (!self._ring) return;
      if (self.tool().act !== 'erase') { self._ring.off(); return; }
      var r = self.router;
      var pt = r ? r.local(e) : { x: e.offsetX, y: e.offsetY };
      self._ring.at(pt.x, pt.y, self.ringR(), self.tool().eraseMode !== 'part');
    };
    this._hvOut = function () { if (self._ring) self._ring.off(); };
    this._hvEl = el;
    el.addEventListener('pointermove', this._hv);
    el.addEventListener('pointerdown', this._hv);
    el.addEventListener('pointerleave', this._hvOut);
    el.addEventListener('pointercancel', this._hvOut);
    el.addEventListener('pointerup', this._hvOut);
  };

  Ink.prototype._hoverOff = function () {
    var el = this._hvEl;
    if (!el || !this._hv) { this._hvEl = null; return; }
    el.removeEventListener('pointermove', this._hv);
    el.removeEventListener('pointerdown', this._hv);
    el.removeEventListener('pointerleave', this._hvOut);
    el.removeEventListener('pointercancel', this._hvOut);
    el.removeEventListener('pointerup', this._hvOut);
    this._hv = null; this._hvOut = null; this._hvEl = null;
  };

  function tiltOf(p) {
    return (p && p.tz != null) ? { tz: p.tz, az: p.az } : null;
  }

  var TOOL_KEY = 'garden_pdfink';

  function lastKit() {
    var d = { tool: 'pen', color: 'ink', width: 2, nib: 'round',
              hiMode: 'text', eraseMode: 'whole' };
    try {
      var raw = JSON.parse(localStorage.getItem(TOOL_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (raw.tool) d.tool = raw.tool;
        if (raw.color) d.color = raw.color;
        if (raw.width > 0) d.width = raw.width;
        if (raw.nib) d.nib = raw.nib;
        if (raw.hiMode) d.hiMode = raw.hiMode;
        if (raw.eraseMode) d.eraseMode = raw.eraseMode;
      }
    } catch (e) {}
    return d;
  }

  function keepKit(k) {
    try { localStorage.setItem(TOOL_KEY, JSON.stringify(k)); } catch (e) {}
  }

  function keepKit2(f) {
    keepKit({ tool: f.tool, color: f.color, width: f.width, nib: f.nib,
              hiMode: f.hiMode, eraseMode: f.eraseMode });
  }

  /*@3.NOPJ8.11*/
  Ink.prototype.bar = function () {
    if (this.face) return this.face;
    var self = this;
    var kit = lastKit();
    var f = {
      tool: kit.tool, color: kit.color, width: kit.width, nib: kit.nib,
      hiMode: kit.hiMode, hiStraight: kit.hiMode === 'free' ? 0 : 1,
      straight: kit.hiMode === 'free' ? 0 : 1,
      eraseMode: kit.eraseMode,
      bound: true, hist: null, used: null, palmDefault: 'always',
      userZ: 1, fitZ: 1,
      cam: { x: 0, y: 0, z: (this.view && this.view.scale) || 1 },
      expanded: false,
      undoS: this.undoS,
      redoS: this.redoS,
      /*@3.NOPJ8.46*/
      selected: function () { return self.pick ? self.pick.ids.slice() : []; },
      deleteSelected: function () { return self.dropPick(); },
      undo: function () { return self.undo(); },
      redo: function () { return self.redo(); },
      paint: function () { self.repaint(); },
      setTool: function (t) {
        f.tool = t || 'pen';
        /*@3.NOPJ8.47*/
        if (f.tool !== 'sel' && f.tool !== 'lasso') self.setPick(null);
        keepKit2(f);
        self.beat();
      },
      /*@3.NOPJ8.67*/
      setColor: function (c) {
        f.color = c; keepKit2(f);
        if (!self.stylePick({ c: c })) self.beat();
      },
      setWidth: function (w) {
        f.width = w > 0 ? w : 2; keepKit2(f);
        if (!self.stylePick({ w: f.width })) self.beat();
      },
      setNib: function (n) {
        f.nib = n || 'round'; keepKit2(f);
        if (!self.stylePick({ nib: f.nib })) self.beat();
      },
      setEraseMode: function (m) {
        f.eraseMode = m === 'part' ? 'part' : 'whole';
        keepKit2(f); self.beat();
      },
      /*@3.NOPJ8.14*/
      setHiMode: function (v) {
        f.hiMode = (v === 'free' || v === 'line') ? v : 'text';
        f.hiStraight = f.straight = (f.hiMode === 'free') ? 0 : 1;
        keepKit2(f); self.beat();
      },
      setStraight: function (on) {
        f.hiStraight = f.straight = on ? 1 : 0;
        if (f.hiMode !== 'text') f.hiMode = on ? 'line' : 'free';
        keepKit2(f); self.beat();
      },
      /*@3.NOPJ8.15*/
      toggleAct: function (act) { return self.mods().toggle(act); },
      duplicateSelected: function () { return self.dupPick(); },
      copySelected: function () { return self.copyPick(); },
      cutSelected: function () { return self.cutPick(); },
      rotateSelected: function (d) { return self.rotatePick(d); },
      selectAll: function () { return self.selectAll(); },
      paste: function () { return self.pastePick(); },
      canPaste: false,
      setUserZoom: function (z) { if (self.o.onZoom) self.o.onZoom(z); },
      resetZoom: function () { if (self.o.onFit) self.o.onFit(); },
      setZoom: function (z) { if (self.o.onZoom) self.o.onZoom(z); },
      resetView: function () { if (self.o.onFit) self.o.onFit(); },
      expand: function (on) {
        f.expanded = !!on;
        if (self.o.onExpand) self.o.onExpand(!!on);
        self.beat();
      }
    };
    this.face = f;
    return f;
  };

  Ink.prototype.mods = function () {
    if (this._mods) return this._mods;
    var self = this;
    var f = this.face || this.bar();
    this._mods = window.GardenInkInput.mods({
      getTool: function () { return f.tool; },
      setTool: function (t) { f.setTool(t); },
      getEraseMode: function () { return f.eraseMode; },
      setEraseMode: function (m) { f.eraseMode = m === 'part' ? 'part' : 'whole'; },
      hasSelection: function () { return !!(self.pick && self.pick.ids.length); },
      onChange: function () { self.beat(); }
    });
    return this._mods;
  };

  /*@3.NOPJ8.12*/
  Ink.prototype.kit = function () {
    var f = this.face || this.bar();
    var t = f.tool;
    /*@3.NOPJ8.33*/
    var act = (t === 'era' || t === 'erase') ? 'erase'
      : (t === 'hand' || t === 'pan') ? 'hand'
      : (t === 'sel') ? 'sel' : (t === 'lasso') ? 'lasso'
      : (t === 'hi') ? 'hi' : 'pen';
    return { act: act === 'hi' ? 'pen' : act, c: f.color, w: f.width,
             nib: f.nib, hi: act === 'hi', o: 1,
             hiMode: f.hiMode, straight: f.hiStraight,
             eraseMode: f.eraseMode };
  };

  Ink.prototype.repaint = function () {
    for (var k in this.pages) this.paint(+k);
  };

  /*@3.NOPJ8.16*/
  Ink.prototype.snapText = function (p, bx) {
    var V = window.GardenPdfView;
    var s = this.pages[p];
    if (!V || !V.merge || !s || !s.el) return null;
    var td = s.el.parentNode ? s.el.parentNode.querySelector('.gpv-text') : null;
    if (!td) return null;
    var spans = td.querySelectorAll('span');
    if (!spans.length) return null;
    var base = s.el.getBoundingClientRect();
    var rects = [], i, r;
    for (i = 0; i < spans.length; i++) {
      r = spans[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) rects.push(r);
    }
    if (!rects.length) return null;
    var lines = V.merge(rects, base.left, base.top);
    var f = this.frameOf(s, s.scale);
    var k = s.scale;
    var mid = { x: (bx.x0 + bx.x1) / 2, y: (bx.y0 + bx.y1) / 2 };
    var best = null, bd = Infinity;
    for (i = 0; i < lines.length; i++) {
      var b = lines[i];
      var pa = f ? f.toPt(b.x, b.y) : { x: b.x / k, y: b.y / k };
      var pb = f ? f.toPt(b.x + b.w, b.y + b.h) : { x: (b.x + b.w) / k, y: (b.y + b.h) / k };
      var box = { x0: Math.min(pa.x, pb.x), x1: Math.max(pa.x, pb.x),
                  y0: Math.min(pa.y, pb.y), y1: Math.max(pa.y, pb.y) };
      var cy = (box.y0 + box.y1) / 2;
      var dy = Math.abs(cy - mid.y);
      var dx = mid.x < box.x0 ? box.x0 - mid.x : (mid.x > box.x1 ? mid.x - box.x1 : 0);
      var d = dy + dx * 0.35;
      if (d < bd) { bd = d; best = box; }
    }
    if (!best) return null;
    var h = best.y1 - best.y0;
    if (!(h > 1)) return null;
    if (Math.abs((best.y0 + best.y1) / 2 - mid.y) > h * 1.6 + 4) return null;
    var sx0 = Math.max(best.x0, Math.min(best.x1, Math.min(bx.x0, bx.x1)));
    var sx1 = Math.max(best.x0, Math.min(best.x1, Math.max(bx.x0, bx.x1)));
    if (sx1 - sx0 < 2) { sx0 = best.x0; sx1 = best.x1; }
    return { x0: best.x0, x1: best.x1, y: best.y0, h: h, sx0: sx0, sx1: sx1 };
  };

  /*@3.NOPJ8.29*/
  function clone(el) {
    var out = {}, k;
    for (k in el) if (Object.prototype.hasOwnProperty.call(el, k)) out[k] = el[k];
    if (el.pts) {
      out.pts = [];
      for (var i = 0; i < el.pts.length; i++) {
        var q = el.pts[i], c = {};
        for (k in q) if (Object.prototype.hasOwnProperty.call(q, k)) c[k] = q[k];
        out.pts.push(c);
      }
    }
    return out;
  }

  /*@3.NOPJ8.24*/
  function caretIn(td, cx, cy) {
    var r = null;
    if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(cx, cy);
    else if (document.caretPositionFromPoint) {
      var q = document.caretPositionFromPoint(cx, cy);
      if (q && q.offsetNode) {
        r = document.createRange();
        try { r.setStart(q.offsetNode, q.offset); r.collapse(true); } catch (e) { r = null; }
      }
    }
    if (!r || !r.startContainer) return null;
    var node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    if (!node || !td.contains(node)) return null;
    return { node: r.startContainer, offset: r.startOffset };
  }

  /*@3.NOPJ8.25*/
  Ink.prototype.textOf = function (p) {
    var s = this.pages[p];
    if (!s || !s.el || !s.el.parentNode) return null;
    return s.el.parentNode.querySelector('.gpv-text');
  };

  /*@3.NOPJ8.52*/
  function sameRow(a, b) {
    var ma = a.y + a.h / 2, mb = b.y + b.h / 2;
    return Math.abs(ma - mb) <= Math.min(a.h, b.h) * 0.6;
  }

  function touches(a, b) {
    return sameRow(a, b) && a.x <= b.x + b.w + 0.5 && b.x <= a.x + a.w + 0.5;
  }

  function joinRect(a, b) {
    var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x + a.w, b.x + b.w);
    var y0 = Math.min(a.y, b.y), y1 = Math.max(a.y + a.h, b.y + b.h);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /*@3.NOPJ8.53*/
  /*@3.NOPJ8.58*/
  function foldRects(list) {
    var out = [], i;
    for (i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || !(r.w > 0.5) || !(r.h > 0.5)) continue;
      out.push({ x: r.x, y: r.y, w: r.w, h: r.h });
    }
    var again = true, a, b;
    while (again) {
      again = false;
      for (a = 0; a < out.length && !again; a++) {
        for (b = a + 1; b < out.length; b++) {
          if (!touches(out[a], out[b])) continue;
          out[a] = joinRect(out[a], out[b]);
          out.splice(b, 1);
          again = true;
          break;
        }
      }
    }
    return out;
  }

  function areaOf(list) {
    var a = 0;
    for (var i = 0; i < list.length; i++) a += list[i].w * list[i].h;
    return a;
  }

  function overlapArea(A, B) {
    var a = 0, i, j;
    for (i = 0; i < A.length; i++) {
      for (j = 0; j < B.length; j++) {
        var w = Math.min(A[i].x + A[i].w, B[j].x + B[j].w) - Math.max(A[i].x, B[j].x);
        var h = Math.min(A[i].y + A[i].h, B[j].y + B[j].h) - Math.max(A[i].y, B[j].y);
        if (w > 0 && h > 0) a += w * h;
      }
    }
    return a;
  }

  /*@3.NOPJ8.54*/
  Ink.prototype.addMark = function (n, rects, colour) {
    var p = this.pages[n];
    if (!p) return false;
    var fresh = foldRects(rects);
    if (!fresh.length) return false;
    var before = p.els.slice();
    var mine = areaOf(fresh);
    var keep = [], merged = fresh, i;
    var twin = false;
    for (i = 0; i < p.els.length; i++) {
      var e = p.els[i];
      if (e.ty !== 'hl' || e.c !== colour || !e.r || !e.r.length) { keep.push(e); continue; }
      var over = overlapArea(merged, e.r);
      if (over < 0.5) { keep.push(e); continue; }
      var his = areaOf(e.r);
      /*@3.NOPJ8.59*/
      if (over > mine * 0.85 && over > his * 0.85) { twin = true; keep.push(e); continue; }
      merged = foldRects(merged.concat(e.r));
    }
    keep.push({ ty: 'hl', c: colour, r: merged });
    void twin;
    p.els = keep;
    this.push({ act: 'set', n: n, before: before, after: p.els.slice() });
    this.paint(n);
    this.touch(n);
    this.beat();
    return true;
  };

  /*@3.NOPJ8.55*/
  Ink.prototype.paintMarks = function (n) {
    var v = this.view;
    var p = this.pages[n];
    if (!v || !v.marks || !p) return;
    var host = v.marks(n);
    if (!host) return;
    var old = host.querySelectorAll('.gpi-mk');
    for (var q = 0; q < old.length; q++) old[q].remove();
    var f = this.frameOf(p, p.scale);
    var K = window.GardenCanvas;
    for (var i = 0; i < p.els.length; i++) {
      var e = p.els[i];
      if (e.ty !== 'hl' || !e.r) continue;
      var hex = (K && K.hiHexOf) ? K.hiHexOf(e.c) : '#ffe14d';
      for (var j = 0; j < e.r.length; j++) {
        var r = e.r[j];
        var a = f ? f.toPx(r.x, r.y) : { x: r.x, y: r.y };
        var b = f ? f.toPx(r.x + r.w, r.y + r.h) : { x: r.x + r.w, y: r.y + r.h };
        var el = document.createElement('div');
        el.className = 'gpi-mk';
        el.style.insetInlineStart = Math.min(a.x, b.x).toFixed(2) + 'px';
        el.style.insetBlockStart = Math.min(a.y, b.y).toFixed(2) + 'px';
        el.style.inlineSize = Math.abs(b.x - a.x).toFixed(2) + 'px';
        el.style.blockSize = Math.abs(b.y - a.y).toFixed(2) + 'px';
        el.style.background = hex;
        host.appendChild(el);
      }
    }
  };

  /*@3.NOPJ8.26*/
  Ink.prototype.snapLines = function (p, a, b) {
    var V = window.GardenPdfView;
    var s = this.pages[p];
    var td = this.textOf(p);
    if (!V || !V.merge || !td || !s || !s.el) return null;
    var f = this.frameOf(s, s.scale);
    if (!f) return null;
    var base = s.el.getBoundingClientRect();
    var pa = f.toPx(a.x, a.y), pb = f.toPx(b.x, b.y);
    /*@3.NOPJ8.30*/
    var lift = this.grab, was = lift ? lift.style.pointerEvents : null;
    if (lift) lift.style.pointerEvents = 'none';
    var c1 = caretIn(td, base.left + pa.x, base.top + pa.y);
    var c2 = caretIn(td, base.left + pb.x, base.top + pb.y);
    if (lift) lift.style.pointerEvents = was || '';
    if (!c1 || !c2) return null;
    var rg = document.createRange();
    try {
      rg.setStart(c1.node, c1.offset);
      rg.setEnd(c2.node, c2.offset);
      if (rg.collapsed) { rg.setStart(c2.node, c2.offset); rg.setEnd(c1.node, c1.offset); }
    } catch (e) { return null; }
    if (rg.collapsed) return null;
    var list = rg.getClientRects();
    if (!list || !list.length) return null;
    var boxes = V.merge(list, base.left, base.top);
    if (!boxes.length) return null;
    var out = [], i;
    for (i = 0; i < boxes.length; i++) {
      var bx = boxes[i];
      var q1 = f.toPt(bx.x, bx.y), q2 = f.toPt(bx.x + bx.w, bx.y + bx.h);
      var y0 = Math.min(q1.y, q2.y), y1 = Math.max(q1.y, q2.y);
      var x0 = Math.min(q1.x, q2.x), x1 = Math.max(q1.x, q2.x);
      if (!(y1 - y0 > 1) || !(x1 - x0 > 1)) continue;
      out.push({ x0: x0, x1: x1, y: y0, h: y1 - y0, sx0: x0, sx1: x1 });
    }
    return out.length ? out : null;
  };

  /*@3.NOPJ8.56*/
  Ink.prototype.markRects = function (n, a, b, mode) {
    var V = window.GardenPdfView;
    var s = this.pages[n];
    var td = this.textOf(n);
    if (!V || !V.merge || !td || !s || !s.el) return null;
    var f = this.frameOf(s, s.scale);
    if (!f) return null;
    var base = s.el.getBoundingClientRect();
    var pa = f.toPx(a.x, a.y), pb = f.toPx(b.x, b.y);
    var lift = this.grab, was = lift ? lift.style.pointerEvents : null;
    if (lift) lift.style.pointerEvents = 'none';
    var c1 = caretIn(td, base.left + pa.x, base.top + pa.y);
    var c2 = caretIn(td, base.left + pb.x, base.top + pb.y);
    if (lift) lift.style.pointerEvents = was || '';
    if (!c1 || !c2) return null;
    var rg = document.createRange();
    try {
      rg.setStart(c1.node, c1.offset);
      rg.setEnd(c2.node, c2.offset);
      if (rg.collapsed) { rg.setStart(c2.node, c2.offset); rg.setEnd(c1.node, c1.offset); }
    } catch (e) { return null; }
    if (rg.collapsed) return null;
    var list = rg.getClientRects();
    if (!list || !list.length) return null;
    var boxes = V.merge(list, base.left, base.top);
    if (!boxes.length) return null;
    /*@3.NOPJ8.60*/
    if (mode === 'line') {
      var spans = td.querySelectorAll('span');
      var all = [], k, rr;
      for (k = 0; k < spans.length; k++) {
        rr = spans[k].getBoundingClientRect();
        if (rr.width > 0 && rr.height > 0) all.push(rr);
      }
      var rows = V.merge(all, base.left, base.top);
      var wide = [];
      for (k = 0; k < boxes.length; k++) {
        var best = null;
        for (var m = 0; m < rows.length; m++) {
          if (!sameRow(rows[m], boxes[k])) continue;
          best = best ? joinRect(best, rows[m]) : rows[m];
        }
        wide.push(best || boxes[k]);
      }
      boxes = wide;
    }
    var out = [];
    for (var i = 0; i < boxes.length; i++) {
      var bx = boxes[i];
      var q1 = f.toPt(bx.x, bx.y), q2 = f.toPt(bx.x + bx.w, bx.y + bx.h);
      var x0 = Math.min(q1.x, q2.x), x1 = Math.max(q1.x, q2.x);
      var y0 = Math.min(q1.y, q2.y), y1 = Math.max(q1.y, q2.y);
      if (!(x1 - x0 > 0.6) || !(y1 - y0 > 0.6)) continue;
      out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
    return out.length ? out : null;
  };

  /*@3.NOPJ8.17*/
  Ink.prototype.dress = function (n, el, t) {
    var K = window.GardenCanvas;
    if (!t.hi || !K) return null;
    var self = this;
    var done = false;
    /*@3.NOPJ8.27*/
    if (t.hiMode === 'text' && K.snapHi && el.pts && el.pts.length > 1) {
      var a = el.pts[0], b = el.pts[el.pts.length - 1];
      var lines = this.snapLines(n, a, b);
      if (lines && lines.length) {
        var extra = [], i;
        for (i = 0; i < lines.length; i++) {
          var one = lines[i];
          var st = (i === 0) ? el : clone(el);
          if (K.snapHi({ snapText: function () { return one; } }, st)) {
            if (i === 0) done = true; else extra.push(st);
          }
        }
        if (done) return extra.length ? extra : null;
      }
      done = K.snapHi({ snapText: function (bx) { return self.snapText(n, bx); } }, el);
    }
    if (!done && t.hiMode !== 'free' && K.straighten) K.straighten(el);
    return null;
  };

  /*@3.NOPJ8.18*/
  Ink.prototype.slice = function (p, s, lim) {
    var K = window.GardenCanvas;
    var cut = [], keep = [], i, j;
    for (i = p.els.length - 1; i >= 0; i--) {
      var el = p.els[i];
      var pts = el.pts || [];
      var runs = [], run = [];
      for (j = 0; j < pts.length; j++) {
        var dx = pts[j].x - s.x, dy = pts[j].y - s.y;
        var near = Math.sqrt(dx * dx + dy * dy) <= lim + (el.w || 2) / 2;
        if (near) { if (run.length > 1) runs.push(run); run = []; }
        else run.push(pts[j]);
      }
      if (run.length > 1) runs.push(run);
      if (runs.length === 1 && runs[0].length === pts.length) continue;
      cut.push({ at: i, el: el });
      p.els.splice(i, 1);
      for (j = 0; j < runs.length; j++) {
        var cl = {};
        for (var q in el) if (Object.prototype.hasOwnProperty.call(el, q)) cl[q] = el[q];
        cl.pts = runs[j];
        keep.push({ at: i, el: cl });
      }
    }
    for (i = 0; i < keep.length; i++) p.els.push(keep[i].el);
    void K;
    return { cut: cut };
  };

  Ink.prototype.beat = function () {
    var f = this.face;
    if (!f) return;
    f.canPaste = this.canPaste();
    if (this.view) f.cam.z = this.view.scale;
    if (this.o.onState) {
      this.o.onState({
        tool: f.tool, color: f.color, width: f.width, nib: f.nib,
        zoom: f.cam.z, selection: this.pick ? this.pick.ids.length : 0,
        canUndo: this.undoS.length > 0, canRedo: this.redoS.length > 0,
        canPaste: f.canPaste, expanded: f.expanded
      });
    }
  };

  Ink.prototype.destroy = function () {
    this.dead = true;
    paper(false);
    this.arm(false);
    for (var k in this.saveT) if (this.saveT[k]) clearTimeout(this.saveT[k]);
    this.saveT = {};
    for (var n in this.pages) {
      var p = this.pages[n];
      if (p.dry) { p.dry.width = 0; p.dry.height = 0; }
      if (p.wet) { p.wet.width = 0; p.wet.height = 0; }
    }
    this.pages = {};
    this.undoS.length = 0;
    this.redoS.length = 0;
  };

  window.GardenPdfInk = {
    create: function (o) { return new Ink(o); },
    frame: frame,
    stamp: stamp,
    read: read,
    write: write,
    pagesOf: pagesOf,
    wipe: wipe
  };
})();
