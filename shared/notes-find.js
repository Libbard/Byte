/*@3.NOFJ.1*/
;(function () {
  'use strict';
  if (window.GardenNotesFind) return;

  function L(ar, en) {
    var lang = 'ar';
    try { lang = localStorage.getItem('garden_lang') || 'ar'; } catch (e) {}
    return lang === 'en' ? en : ar;
  }

  function B() { return window.GardenNotesBlocks; }

  /*@3.NOFJ.2*/
  var MARK = /[ً-ْٰـ‌‍]/;
  var FOLD = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
    'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي'
  };

  function digit(c) {
    var k = c.charCodeAt(0);
    if (k >= 0x0660 && k <= 0x0669) return String(k - 0x0660);
    if (k >= 0x06F0 && k <= 0x06F9) return String(k - 0x06F0);
    return '';
  }

  function norm(src) {
    var out = '', map = [], i, c, d;
    for (i = 0; i < src.length; i++) {
      c = src.charAt(i);
      if (MARK.test(c)) continue;
      d = digit(c);
      if (d) c = d;
      else if (FOLD[c]) c = FOLD[c];
      else c = c.toLowerCase();
      out += c;
      map.push(i);
    }
    return { s: out, m: map };
  }

  function blockText(b) {
    var M = B();
    if (!b) return '';
    if (b.ty === 'code') return String(b.src || '');
    if (b.ty === 'math') return String(b.tex || '');
    if (b.ty === 'img') return String(b.alt || b.cap || '');
    if (Array.isArray(b.rt)) return M.runsToText(b.rt);
    if (Array.isArray(b.items)) {
      return b.items.map(function (it) { return M.runsToText(it.rt || []); }).join('\n');
    }
    if (Array.isArray(b.rows)) {
      return b.rows.map(function (row) {
        return (row || []).map(function (c) { return M.runsToText(c.rt || []); }).join(' ');
      }).join('\n');
    }
    return '';
  }

  function Find() {
    this.ed = null;
    this.bar = null;
    this.layer = null;
    this.q = '';
    this.hits = [];
    this.at = -1;
    this.idx = null;
    this.open = false;
  }

  /*@3.NOFJ.8*/
  Find.prototype.pdf = function () {
    return (this.getPdf && this.getPdf()) || null;
  };

  /*@3.NOFJ.5*/
  Find.prototype.index = function () {
    var ed = this.ed;
    if (!ed || !ed.doc) return [];
    var bs = ed.doc.blocks || [];
    var key = bs.length + ':' + (ed._findStamp || 0);
    if (this.idx && this.idx.key === key) return this.idx.rows;
    var rows = [], i, n;
    for (i = 0; i < bs.length; i++) {
      n = norm(blockText(bs[i]));
      rows.push({ i: i, id: bs[i].id, s: n.s, m: n.m });
    }
    this.idx = { key: key, rows: rows };
    return rows;
  };

  Find.prototype.soil = function () {
    if (this.ed) this.ed._findStamp = (this.ed._findStamp || 0) + 1;
    this.idx = null;
  };

  Find.prototype.search = function (q) {
    this.q = String(q == null ? '' : q);
    this.hits = [];
    this.at = -1;
    /*@3.NOFJ.9*/
    var P = this.pdf();
    if (P) {
      var n = P.search(this.q);
      if (n) P.next();
      this.say();
      return n;
    }
    var nq = norm(this.q).s;
    if (nq.length < 1) { this.paint(); this.say(); return 0; }
    var rows = this.index(), r, k, from, cap = 5000;
    for (var i = 0; i < rows.length; i++) {
      r = rows[i];
      if (!r.s) continue;
      from = 0;
      while ((k = r.s.indexOf(nq, from)) !== -1) {
        this.hits.push({ b: r.i, id: r.id,
          s: r.m[k], e: (r.m[k + nq.length - 1] != null ? r.m[k + nq.length - 1] + 1 : r.m[k] + 1) });
        from = k + 1;
        if (this.hits.length >= cap) break;
      }
      if (this.hits.length >= cap) break;
    }
    this.say();
    if (this.hits.length) this.go(0);
    else this.paint();
    return this.hits.length;
  };

  Find.prototype.go = function (at) {
    if (!this.hits.length) return false;
    var n = this.hits.length;
    this.at = ((at % n) + n) % n;
    var h = this.hits[this.at];
    var ed = this.ed;
    if (ed && ed._win && ed.winShow) ed.winShow(h.id);
    var node = ed.root.querySelector('[data-bid="' + h.id + '"]');
    if (node) {
      try { node.scrollIntoView({ block: 'center' }); } catch (e) { node.scrollIntoView(); }
    }
    this.paint();
    this.say();
    return true;
  };

  Find.prototype.next = function (back) {
    var P = this.pdf();
    if (P) {
      if (back) P.prev(); else P.next();
      this.say();
      return true;
    }
    return this.go(this.at + (back ? -1 : 1));
  };

  /*@3.NOFJ.3*/
  Find.prototype.host = function () {
    var ed = this.ed;
    if (!ed || !ed.root) return null;
    var el = this.layer;
    if (el && el.parentNode === ed.root) return el;
    el = document.createElement('div');
    el.className = 'nf-layer';
    el.setAttribute('aria-hidden', 'true');
    ed.root.appendChild(el);
    this.layer = el;
    return el;
  };

  function walkRange(node, from, to) {
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    var acc = 0, t, r = document.createRange(), a = null, b = null;
    while ((t = w.nextNode())) {
      var len = t.nodeValue.length;
      if (a === null && acc + len >= from) { a = [t, from - acc]; }
      if (a !== null && acc + len >= to) { b = [t, to - acc]; break; }
      acc += len;
    }
    if (!a) return null;
    if (!b) b = [a[0], a[0].nodeValue.length];
    try { r.setStart(a[0], Math.max(0, Math.min(a[1], a[0].nodeValue.length))); r.setEnd(b[0], Math.max(0, Math.min(b[1], b[0].nodeValue.length))); }
    catch (e) { return null; }
    return r;
  }

  Find.prototype.paint = function () {
    if (this.pdf()) return;
    var host = this.host();
    if (!host) return;
    host.textContent = '';
    if (!this.hits.length || !this.open) return;
    var ed = this.ed;
    var z = ed.zoomOf ? (ed.zoomOf() || 1) : 1;
    /*@3.NOFJ.6*/
    var rr = host.getBoundingClientRect();
    var seen = 0;
    for (var i = 0; i < this.hits.length && seen < 400; i++) {
      var h = this.hits[i];
      var node = ed.root.querySelector('[data-bid="' + h.id + '"]');
      if (!node) continue;
      var field = node.querySelector('.ne-text, .ne-li, .ne-code, .ne-cell') || node;
      var rg = walkRange(field, h.s, h.e);
      if (!rg) continue;
      var rects = rg.getClientRects();
      for (var k = 0; k < rects.length; k++) {
        var q = rects[k];
        if (!q.width || !q.height) continue;
        var d = document.createElement('div');
        d.className = 'nf-hit';
        if (i === this.at) d.setAttribute('data-on', '1');
        d.style.left = ((q.left - rr.left) / z) + 'px';
        d.style.top = ((q.top - rr.top) / z) + 'px';
        d.style.width = (q.width / z) + 'px';
        d.style.height = (q.height / z) + 'px';
        host.appendChild(d);
        seen++;
      }
    }
  };

  Find.prototype.say = function () {
    if (!this.bar) return;
    var out = this.bar.querySelector('[data-nf="count"]');
    if (!out) return;
    /*@3.NOFJ.10*/
    var P = this.pdf();
    if (P) {
      var st = P.state();
      if (!st.q) { out.textContent = ''; out.removeAttribute('data-none'); return; }
      var scan = st.scanning
        ? ' \u00b7 ' + Math.round(st.scanned * 100 / Math.max(1, st.pages)) + '%'
        : '';
      if (!st.total) {
        out.textContent = (st.scanning ? L('\u064a\u064f\u0642\u0631\u0623 \u0627\u0644\u0645\u0644\u0641\u0651', 'Reading the file') + scan
                                       : L('\u0644\u0627 \u0646\u062a\u064a\u062c\u0629', 'No results'));
        out.setAttribute('data-none', st.scanning ? '0' : '1');
        return;
      }
      out.removeAttribute('data-none');
      out.textContent = (st.cur + 1) + ' / ' + st.total + scan;
      return;
    }
    if (!this.q) { out.textContent = ''; out.removeAttribute('data-none'); return; }
    if (!this.hits.length) {
      out.textContent = L('لا نتيجة', 'No results');
      out.setAttribute('data-none', '1');
      return;
    }
    out.removeAttribute('data-none');
    out.textContent = (this.at + 1) + ' / ' + this.hits.length;
  };

  Find.prototype.place = function () {
    var bar = this.bar;
    if (!bar || bar.hidden) return;
    var host = bar.offsetParent;
    if (!host) return;
    var hr = host.getBoundingClientRect();
    var w = bar.offsetWidth, h = bar.offsetHeight;
    if (!w || !hr.width) return;
    var btn = document.getElementById('na-find-btn');
    var br = btn ? btn.getBoundingClientRect() : null;
    var pad = 8, x, y;
    if (br && br.width > 0 && br.height > 0) {
      x = br.left + br.width / 2 - w / 2 - hr.left;
      y = br.bottom - hr.top + 6;
    } else {
      x = hr.width - w - pad;
      y = pad;
    }
    x = Math.max(pad, Math.min(hr.width - w - pad, x));
    y = Math.max(pad, Math.min(Math.max(pad, hr.height - h - pad), y));
    bar.style.left = Math.round(x) + 'px';
    bar.style.insetBlockStart = Math.round(y) + 'px';
  };

  Find.prototype.show = function (on) {
    if (!this.bar) return;
    var want = on !== false;
    this.open = want;
    this.bar.hidden = !want;
    var btn = document.getElementById('na-find-btn');
    if (btn) btn.setAttribute('aria-expanded', want ? 'true' : 'false');
    /*@3.NOFJ.11*/
    var P = this.pdf();
    if (P) {
      if (want) {
        this.place();
        var pin = this.bar.querySelector('[data-nf="q"]');
        if (pin) { try { pin.focus(); pin.select(); } catch (e3) {} }
        if (this.q) this.search(this.q);
        else this.say();
      } else { P.clear(); this.say(); }
      return;
    }
    if (want) {
      this.place();
      var inp = this.bar.querySelector('[data-nf="q"]');
      if (inp) { try { inp.focus(); inp.select(); } catch (e) {} }
      if (this.q) this.search(this.q);
    } else {
      this.hits = []; this.at = -1;
      this.paint();
      var ed = this.ed;
      if (ed && ed.root) {
        var f = ed.root.querySelector('.ne-text, .ne-li');
        if (f && !this.coarse()) { try { f.focus({ preventScroll: true }); } catch (e2) {} }
      }
    }
  };

  Find.prototype.coarse = function () {
    try { return !!(window.matchMedia && matchMedia('(hover: none)').matches); }
    catch (e) { return false; }
  };

  Find.prototype.bind = function (opts) {
    var self = this;
    this.getEd = opts.editor;
    this.getPdf = opts.pdf || null;
    this.bar = opts.bar || document.getElementById('na-find-bar');
    if (!this.bar) return;
    var inp = this.bar.querySelector('[data-nf="q"]');

    var sync = function () { self.ed = self.getEd ? self.getEd() : null; };

    if (inp) {
      inp.addEventListener('input', function () { sync(); self.search(inp.value); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sync(); self.next(e.shiftKey); return; }
        if (e.key === 'Escape') { e.preventDefault(); self.show(false); }
      });
    }
    this.bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-nf]') : null;
      if (!b) return;
      var k = b.getAttribute('data-nf');
      sync();
      if (k === 'next') self.next(false);
      else if (k === 'prev') self.next(true);
      else if (k === 'shut') self.show(false);
    });

    /*@3.NOFJ.4*/
    this._keys = function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.code === 'KeyF') {
        sync();
        if (!self.pdf() && (!self.ed || !self.ed.root || !self.ed.root.isConnected)) return;
        e.preventDefault();
        self.show(true);
        return;
      }
      if (!self.open) return;
      if (e.code === 'F3') { e.preventDefault(); sync(); self.next(e.shiftKey); return; }
      if (e.key === 'Escape') {
        var inBar = self.bar.contains(e.target);
        if (inBar || !e.target.closest || !e.target.closest('dialog')) {
          e.preventDefault();
          self.show(false);
        }
      }
    };
    document.addEventListener('keydown', this._keys, true);

    var btn = document.getElementById('na-find-btn');
    if (btn) btn.addEventListener('click', function () { sync(); self.show(self.bar.hidden); });

    /*@3.NOFJ.7*/
    document.addEventListener('pointerdown', function (e) {
      if (!self.open) return;
      var t = e.target;
      if (self.bar.contains(t)) return;
      if (t.closest && t.closest('#na-find-btn')) return;
      self.show(false);
    }, true);

    this._relay = function () { if (self.open) { self.place(); self.paint(); } };
    window.addEventListener('resize', this._relay, { passive: true });
    document.addEventListener('garden:languageChanged', function () { self.say(); });
  };

  Find.prototype.onDocChange = function () {
    this.soil();
    if (this.open && this.q) this.search(this.q);
  };

  Find.prototype.onLayout = function () { if (this.open) { this.place(); this.paint(); } };

  var inst = new Find();
  window.GardenNotesFind = {
    bind: function (o) { inst.bind(o || {}); },
    show: function (on) { inst.ed = inst.getEd ? inst.getEd() : inst.ed; inst.show(on); },
    isOpen: function () { return inst.open; },
    soil: function () { inst.onDocChange(); },
    relayout: function () { inst.onLayout(); },
    search: function (q) { inst.ed = inst.getEd ? inst.getEd() : inst.ed; return inst.search(q); },
    tell: function () { inst.say(); },
    next: function (b) { return inst.next(b); },
    hits: function () { return inst.hits.length; },
    at: function () { return inst.at; },
    normalize: norm,
    _i: inst
  };
})();
