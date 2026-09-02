;(function () {
  'use strict';

  var LOAD = 4;

  function create(o) {
    var h = o.handle;
    var view = o.view;
    var n = h.doc.numPages;
    var pg = new Array(n + 1);
    var st = { done: 0, dead: false, q: '', hits: [], cur: -1, scanning: false };

    function tell() {
      if (o.onState) {
        o.onState({ q: st.q, total: st.hits.length, cur: st.cur,
                    scanned: st.done, pages: n, scanning: st.scanning });
      }
    }

    /*@3.NOPJ7.1*/
    function grab(i) {
      if (st.dead || pg[i]) return Promise.resolve();
      return h.doc.getPage(i).then(function (p) {
        return p.getTextContent({ includeMarkedContent: false }).then(function (tc) {
          if (st.dead) return;
          var T = window.GardenPdfText;
          var b = T.fromItems(tc.items || []);
          var f = T.mapFold(b.t);
          pg[i] = { t: b.t, r: b.r, f: f.t, m: f.m };
          try { p.cleanup(); } catch (e) {}
        });
      }).catch(function () { pg[i] = { t: '', r: [], f: '', m: [0] }; });
    }

    /*@3.NOPJ7.2*/
    function scan(from) {
      if (st.scanning || st.dead) return Promise.resolve();
      st.scanning = true;
      var i = 1;
      var seq = [];
      var start = Math.max(1, Math.min(n, from || 1));
      for (var k = 0; k < n; k++) seq.push(((start - 1 + k) % n) + 1);
      var at = 0;
      var lanes = [];
      var run = function () {
        if (st.dead || at >= seq.length) return Promise.resolve();
        var idx = seq[at++];
        return grab(idx).then(function () {
          st.done++;
          if (st.q && pg[idx]) addPage(idx);
          if (st.done % 12 === 0 || st.done === n) { tell(); if (o.onProgress) o.onProgress(st.done, n); }
          return new Promise(function (r) { setTimeout(r, 0); }).then(run);
        });
      };
      for (i = 0; i < LOAD; i++) lanes.push(run());
      return Promise.all(lanes).then(function () {
        st.scanning = false;
        sortHits();
        tell();
      });
    }

    function sortHits() {
      st.hits.sort(function (a, b) { return a.p - b.p || a.s - b.s; });
    }

    function addPage(i) {
      var d = pg[i];
      if (!d || !st.q) return;
      var q = st.q, at = 0, guard = 0;
      while (guard++ < 5000) {
        var j = d.f.indexOf(q, at);
        if (j < 0) break;
        at = j + Math.max(1, q.length);
        var s = d.m[j];
        var e = d.m[Math.min(d.m.length - 1, j + q.length)];
        if (e > s) st.hits.push({ p: i, s: s, e: e });
      }
    }

    /*@3.NOPJ7.3*/
    function search(raw) {
      var T = window.GardenPdfText;
      var q = T.query(raw);
      st.q = q;
      st.hits = [];
      st.cur = -1;
      if (q) {
        for (var i = 1; i <= n; i++) if (pg[i]) addPage(i);
        sortHits();
      }
      repaintAll();
      tell();
      if (q && !st.scanning && st.done < n) scan(view ? view.mid() : 1);
      return st.hits.length;
    }

    function nearest(dir) {
      if (!st.hits.length) return -1;
      if (st.cur >= 0) {
        var k = st.cur + (dir < 0 ? -1 : 1);
        if (k < 0) k = st.hits.length - 1;
        if (k >= st.hits.length) k = 0;
        return k;
      }
      var here = view ? view.mid() : 1;
      for (var i = 0; i < st.hits.length; i++) if (st.hits[i].p >= here) return i;
      return 0;
    }

    /*@3.NOPJ7.4*/
    function jump(k) {
      if (k < 0 || k >= st.hits.length) return;
      st.cur = k;
      var hit = st.hits[k];
      st.want = hit;
      if (view) view.goTo(hit.p, 0);
      repaintAll();
      tell();
      reveal(hit);
    }

    function next() { jump(nearest(1)); }
    function prev() { jump(nearest(-1)); }

    function runs(i, s, e) {
      var d = pg[i];
      if (!d) return [];
      var out = [];
      for (var k = 0; k < d.r.length; k++) {
        var r = d.r[k];
        if (r.i < 0 || r.e <= s || r.s >= e) continue;
        var a = Math.max(s, r.s) - r.s;
        var b = Math.min(e, r.e) - r.s;
        if (b > a) out.push({ i: r.i, a: a, b: b });
      }
      return out;
    }

    /*@3.NOPJ7.5*/
    function rectsOf(i, td, hit) {
      var spans = td.querySelectorAll('span');
      var list = [];
      var parts = runs(i, hit.s, hit.e);
      for (var k = 0; k < parts.length; k++) {
        var sp = spans[parts[k].i];
        if (!sp || !sp.firstChild) continue;
        var node = sp.firstChild;
        var a = Math.min(parts[k].a, node.length);
        var b = Math.min(parts[k].b, node.length);
        if (b <= a) continue;
        var rg = document.createRange();
        try { rg.setStart(node, a); rg.setEnd(node, b); } catch (e) { continue; }
        var rs = rg.getClientRects();
        for (var j = 0; j < rs.length; j++) list.push(rs[j]);
      }
      return list;
    }

    function paint(i, td) {
      if (st.dead || !view) return;
      var host = view.marks ? view.marks(i) : null;
      if (!host) return;
      wipeMine(host);
      if (!st.q || !td) return;
      var slot = view.slots && view.slots[i];
      if (!slot) return;
      var base = slot.el.getBoundingClientRect();
      var V = window.GardenPdfView;
      for (var k = 0; k < st.hits.length; k++) {
        var hit = st.hits[k];
        if (hit.p !== i) continue;
        var rects = rectsOf(i, td, hit);
        if (!rects.length) continue;
        var boxes = V.merge(rects, base.left, base.top);
        var on = (k === st.cur);
        for (var j = 0; j < boxes.length; j++) {
          var b = boxes[j];
          var el = document.createElement('div');
          el.className = 'gpv-mark' + (on ? ' on' : '');
          el.setAttribute('data-k', String(k));
          el.style.insetInlineStart = b.x.toFixed(2) + 'px';
          el.style.insetBlockStart = b.y.toFixed(2) + 'px';
          el.style.inlineSize = b.w.toFixed(2) + 'px';
          el.style.blockSize = b.h.toFixed(2) + 'px';
          host.appendChild(el);
        }
      }
      if (st.want && st.want.p === i) reveal(st.want);
    }

    /*@3.NOPJ7.7*/
    function wipeMine(host) {
      var old = host.querySelectorAll('.gpv-mark');
      for (var q = 0; q < old.length; q++) old[q].remove();
    }

    function repaintAll() {
      if (!view || !view.slots) return;
      for (var k in view.slots) {
        var s = view.slots[k];
        if (s.hl) wipeMine(s.hl);
        if (s.td) paint(+k, s.td);
      }
    }

    /*@3.NOPJ7.6*/
    function reveal(hit) {
      if (!view || !view.slots) return;
      var s = view.slots[hit.p];
      if (!s || !s.hl) return;
      var el = s.hl.querySelector('.gpv-mark.on');
      if (!el) return;
      st.want = null;
      var sc = view.scroller;
      var r = el.getBoundingClientRect();
      var box = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0, height: view.vh() };
      var pad = 90;
      if (r.top < box.top + pad || r.bottom > box.top + box.height - pad) {
        sc.scrollTop += (r.top - box.top) - Math.max(pad, box.height * 0.3);
        view.sync();
      }
    }

    function clear() {
      st.q = ''; st.hits = []; st.cur = -1; st.want = null;
      repaintAll();
      tell();
    }

    function destroy() {
      st.dead = true;
      pg = null;
    }

    return {
      scan: scan,
      search: search,
      next: next,
      prev: prev,
      jump: jump,
      paint: paint,
      repaint: repaintAll,
      clear: clear,
      destroy: destroy,
      state: function () {
        return { q: st.q, total: st.hits.length, cur: st.cur,
                 scanned: st.done, pages: n, scanning: st.scanning };
      },
      hit: function (k) { return st.hits[k] || null; },
      text: function (i) { return pg && pg[i] ? pg[i].t : ''; }
    };
  }

  window.GardenPdfFind = { create: create };
})();
