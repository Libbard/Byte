;(function () {
  'use strict';

  var AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFC]/;
  var MARK = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
  var BIDI = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

  function digits(s) {
    return s.replace(/[\u0660-\u0669]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48);
    }).replace(/[\u06F0-\u06F9]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48);
    });
  }

  function shape(s) {
    var t = String(s == null ? '' : s);
    try { t = t.normalize('NFKC'); } catch (e) {}
    return t;
  }

  function fold(s) {
    var t = digits(shape(s)).replace(BIDI, '').replace(MARK, '');
    t = t.replace(/[\u0622\u0623\u0625\u0671-\u0673\u0675]/g, '\u0627')
         .replace(/[\u0649]/g, '\u064A')
         .replace(/[\u0629]/g, '\u0647')
         .replace(/[\u0624]/g, '\u0648')
         .replace(/[\u0626]/g, '\u064A');
    return t.toLowerCase();
  }

  function isRtl(s) { return AR.test(s); }

  function rows(cells) {
    var a = cells.slice().sort(function (p, q) { return p.y - q.y; });
    var out = [], cur = null;
    for (var i = 0; i < a.length; i++) {
      var c = a[i];
      if (!cur || Math.abs(c.y - cur.y) > cur.tol) {
        cur = { y: c.y, tol: Math.max(1.5, (c.h || 10) * 0.5), a: [] };
        out.push(cur);
      }
      cur.a.push(c);
    }
    return out;
  }

  /*@3.NOPJ6.1*/
  function lay(cells) {
    var raw = '';
    for (var i = 0; i < cells.length; i++) raw += cells[i].s;
    var rtl = isRtl(raw);
    var a = cells.slice().sort(function (p, q) { return rtl ? (q.x - p.x) : (p.x - q.x); });
    return { rtl: rtl, a: a };
  }

  function push(out, i, s) {
    out.t += s;
    var last = out.r[out.r.length - 1];
    if (last && last.i === i && last.e === out.t.length - s.length) { last.e += s.length; return; }
    out.r.push({ i: i, s: out.t.length - s.length, e: out.t.length });
  }

  function build(cells, gapK) {
    var kk = gapK > 0 ? gapK : 0.16;
    var g = rows(cells);
    var out = { t: '', r: [] };
    for (var i = 0; i < g.length; i++) {
      if (i) push(out, -1, '\n');
      var L = lay(g[i].a);
      for (var j = 0; j < L.a.length; j++) {
        var c = L.a[j];
        if (j) {
          var p = L.a[j - 1];
          var gap = L.rtl ? (p.x - (c.x + c.w)) : (c.x - (p.x + p.w));
          var lim = Math.max(1.2, (c.h || 10) * kk);
          if (gap > lim && !/\s$/.test(out.t) && !/^\s/.test(c.s)) push(out, -1, ' ');
        }
        push(out, c.i, c.s);
      }
    }
    return out;
  }

  /*@3.NOPJ6.2*/
  function fromItems(items) {
    var cells = [], k = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || it.str == null || it.str === '') continue;
      var m = it.transform || [1, 0, 0, 1, 0, 0];
      cells.push({ i: k++, s: it.str, x: m[4], y: -m[5], w: it.width || 0,
                   h: it.height || Math.abs(m[3]) || 10 });
    }
    return build(cells);
  }

  function fromNodes(nodes) {
    var cells = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || !n.s) continue;
      cells.push({ i: i, s: n.s, x: n.x, y: n.y, w: n.w, h: n.h });
    }
    return shape(build(cells, 0.42).t);
  }

  /*@3.NOPJ6.3*/
  function mapFold(text) {
    var out = '', map = [], i, j;
    for (i = 0; i < text.length; i++) {
      var c = fold(text.charAt(i));
      for (j = 0; j < c.length; j++) { out += c.charAt(j); map.push(i); }
    }
    map.push(text.length);
    return { t: out, m: map };
  }

  function query(q) {
    return fold(String(q || '')).replace(/\s+/g, ' ').trim();
  }

  window.GardenPdfText = {
    AR: AR,
    shape: shape,
    fold: fold,
    query: query,
    isRtl: isRtl,
    fromItems: fromItems,
    fromNodes: fromNodes,
    mapFold: mapFold
  };
})();
