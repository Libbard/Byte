;(function () {
  'use strict';

  var BASE = (function () {
    var sc = document.currentScript;
    return sc && sc.src ? sc.src.replace(/notes-pdf\.js(\?.*)?$/, '') : 'shared/';
  })();

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') !== 'en'; }
    catch (e) { return true; }
  }
  function L(a, e) { return isAr() ? a : e; }

  /*@3.NOPJ2.1*/

  var DUAL = '\u0626\u0628\u062A\u062B\u062C\u062D\u062E\u0633\u0634\u0635' +
             '\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u0643\u0644\u0645' +
             '\u0646\u0647\u064A\u067E\u0686\u06A9\u06AF\u06CC';
  var ISO = {
    0x0621: 0xFE80, 0x0622: 0xFE81, 0x0623: 0xFE83, 0x0624: 0xFE85,
    0x0625: 0xFE87, 0x0626: 0xFE89, 0x0627: 0xFE8D, 0x0628: 0xFE8F,
    0x0629: 0xFE93, 0x062A: 0xFE95, 0x062B: 0xFE99, 0x062C: 0xFE9D,
    0x062D: 0xFEA1, 0x062E: 0xFEA5, 0x062F: 0xFEA9, 0x0630: 0xFEAB,
    0x0631: 0xFEAD, 0x0632: 0xFEAF, 0x0633: 0xFEB1, 0x0634: 0xFEB5,
    0x0635: 0xFEB9, 0x0636: 0xFEBD, 0x0637: 0xFEC1, 0x0638: 0xFEC5,
    0x0639: 0xFEC9, 0x063A: 0xFECD, 0x0641: 0xFED1, 0x0642: 0xFED5,
    0x0643: 0xFED9, 0x0644: 0xFEDD, 0x0645: 0xFEE1, 0x0646: 0xFEE5,
    0x0647: 0xFEE9, 0x0648: 0xFEED, 0x0649: 0xFEEF, 0x064A: 0xFEF1,
    0x0671: 0xFB50, 0x067E: 0xFB56, 0x0686: 0xFB7A, 0x0698: 0xFB8A,
    0x06A9: 0xFB8E, 0x06AF: 0xFB92, 0x06CC: 0xFBFC
  };
  var DUALSET = {};
  for (var _d = 0; _d < DUAL.length; _d++) DUALSET[DUAL.charCodeAt(_d)] = 1;
  var LAM = 0x0644;
  var ALEF = { 0x0622: 0xFEF5, 0x0623: 0xFEF7, 0x0625: 0xFEF9, 0x0627: 0xFEFB };

  /*@3.NOPJ2.2*/
  function isFormat(c) {
    return c === 0x0A || c === 0x0D || c === 0x09 || c === 0x00AD ||
           (c >= 0x200B && c <= 0x200F) || (c >= 0x202A && c <= 0x202E) ||
           (c >= 0x2060 && c <= 0x2064) || (c >= 0x2066 && c <= 0x2069) ||
           c === 0xFE0E || c === 0xFE0F || c === 0xFEFF;
  }

  function isMark(c) {
    return (c >= 0x064B && c <= 0x065F) || c === 0x0670 || c === 0x0640 ||
           (c >= 0x06D6 && c <= 0x06ED);
  }
  function isArabicLetter(c) { return ISO[c] != null; }

  function shape(text) {
    var cs = [], i;
    /*@3.NOPJ2.47*/
    for (i = 0; i < text.length; i++) {
      var cc = text.charCodeAt(i);
      if (cc >= 0xD800 && cc <= 0xDBFF && i + 1 < text.length) {
        var lo = text.charCodeAt(i + 1);
        if (lo >= 0xDC00 && lo <= 0xDFFF) {
          cs.push(0x10000 + ((cc - 0xD800) << 10) + (lo - 0xDC00));
          i++;
          continue;
        }
      }
      if (!isFormat(cc)) cs.push(cc);
    }
    var out = [];
    for (i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (isMark(c) || !isArabicLetter(c)) { out.push({ g: c, u: [c] }); continue; }

      var j = i - 1;
      while (j >= 0 && isMark(cs[j])) j--;
      var prevJoins = j >= 0 && DUALSET[cs[j]] === 1;
      var k = i + 1;
      while (k < cs.length && isMark(cs[k])) k++;
      var nextC = k < cs.length ? cs[k] : 0;

      if (c === LAM && ALEF[nextC]) {
        var lig = ALEF[nextC] + (prevJoins ? 1 : 0);
        out.push({ g: lig, u: [LAM, nextC] });
        for (var m = i + 1; m < k; m++) out.push({ g: cs[m], u: [cs[m]] });
        i = k;
        continue;
      }

      var nextJoins = isArabicLetter(nextC);
      var iso = ISO[c], dual = DUALSET[c] === 1;
      var g = iso;
      if (prevJoins && nextJoins && dual) g = iso + 3;
      else if (prevJoins && nextJoins) g = iso + 1;
      else if (prevJoins) g = iso + 1;
      else if (nextJoins && dual) g = iso + 2;
      out.push({ g: g, u: [c] });
    }
    return out;
  }

  /*@3.NOPJ2.3*/

  var FACES = {};

  /*@3.NOPJ2.4*/
  /*@3.NOPJ2.21*/
  var FIDX = null, FBYFAM = {};
  /*@3.NOPJ2.46*/
  var FALLBACK = { a: 'cairo-400', b: 'cairo-700' };

  /*@3.NOPJ2.57*/
  var SYMFACES = [
    { id: 'garden-sym-latin-400', r: [[0x0100, 0x036F]] },
    { id: 'garden-sym-greek-400', r: [[0x0370, 0x04FF]] },
    { id: 'garden-sym-indic-400', r: [[0x0900, 0x097F]] },
    { id: 'garden-sym-punct-400', r: [[0x2000, 0x218F]] },
    { id: 'garden-sym-arrow-400', r: [[0x2190, 0x21FF]] },
    { id: 'garden-sym-math-400',  r: [[0x2200, 0x23FF]] },
    { id: 'garden-sym-shape-400', r: [[0x25A0, 0x27BF], [0x27F0, 0x27FF],
                                      [0x2B00, 0x2BFF]] }
  ];

  function loadIndex() {
    if (FIDX) return Promise.resolve(FIDX);
    return fetch(BASE + 'vendor/fonts/pdf/index.json').then(function (r) {
      if (!r.ok) throw new Error('index ' + r.status);
      return r.json();
    }).then(function (list) {
      FIDX = list || [];
      FBYFAM = {};
      for (var i = 0; i < FIDX.length; i++) {
        var e = FIDX[i];
        var key = String(e.family).toLowerCase();
        if (!FBYFAM[key]) FBYFAM[key] = {};
        FBYFAM[key][e.weight] = e;
      }
      return FIDX;
    })['catch'](function () { FIDX = []; FBYFAM = {}; return FIDX; });
  }

  function famList(css) {
    return String(css || '').split(',').map(function (t) {
      return t.trim().replace(/^["']|["']$/g, '').toLowerCase();
    }).filter(Boolean);
  }

  function pickWeight(rec, weight) {
    var w = parseInt(weight, 10) || 400;
    if (rec[900] && w >= 800) return rec[900];
    if (rec[700] && w >= 600) return rec[700];
    if (rec[400]) return rec[400];
    var ks = Object.keys(rec);
    return ks.length ? rec[ks[0]] : null;
  }

  function hasArabic(t) {
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) ||
          (c >= 0xFB50 && c <= 0xFEFF)) return true;
    }
    return false;
  }

  function faceIdFor(fam, weight, text) {
    var want = text ? hasArabic(text) : false;
    var list = famList(fam), i, rec, hit;
    var fallback = '';
    for (i = 0; i < list.length; i++) {
      rec = FBYFAM[list[i]];
      if (!rec) continue;
      hit = pickWeight(rec, weight);
      if (!hit) continue;
      if (want && !hit.ar && !hit.icon) { if (!fallback) fallback = hit.id; continue; }
      return hit.id;
    }
    for (i = 0; i < list.length; i++) {
      if (/mono|consolas|courier/.test(list[i]) && FBYFAM['jetbrains mono']) {
        hit = pickWeight(FBYFAM['jetbrains mono'], weight);
        if (hit && !want) return hit.id;
      }
    }
    var base = FBYFAM['cairo'] ? pickWeight(FBYFAM['cairo'], weight) : null;
    if (base) return base.id;
    return fallback || ((parseInt(weight, 10) || 400) >= 600 ? 'cairo-700' : 'cairo-400');
  }

  function loadFace(id) {
    if (FACES[id]) return FACES[id];
    FACES[id] = Promise.all([
      fetch(BASE + 'vendor/fonts/pdf/' + id + '.ttf').then(function (r) {
        if (!r.ok) throw new Error('ttf ' + r.status);
        return r.arrayBuffer();
      }),
      fetch(BASE + 'vendor/fonts/pdf/' + id + '.json').then(function (r) {
        if (!r.ok) throw new Error('meta ' + r.status);
        return r.json();
      })
    ]).then(function (p) {
      var meta = p[1];
      meta.ttf = new Uint8Array(p[0]);
      meta.blank = meta.blank || {};
      /*@3.NOPJ2.27*/
      meta.gid = function (cp) {
        var g = meta.cmap[cp];
        if (g != null) return meta.blank[g] ? 0 : g;
        var b = meta.baseOf[cp];
        if (b != null && meta.cmap[b] != null) {
          var g2 = meta.cmap[b];
          return meta.blank[g2] ? 0 : g2;
        }
        return 0;
      };
      /*@3.NOPJ2.50*/
      meta.sh = meta.sh || {};
      meta.shape = function (cp) {
        var v = meta.sh[cp];
        if (v == null) return null;
        return (typeof v === 'number') ? [v] : v;
      };
      meta.markw = meta.markw || {};
      meta.adv1 = function (gid) {
        var w = meta.adv[gid];
        return w == null ? 500 : w;
      };
      meta.used = {};
      return meta;
    })['catch'](function (e) { delete FACES[id]; throw e; });
    return FACES[id];
  }

  /*@3.NOPJ2.5*/

  function bytes(str) {
    var a = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 0xff;
    return a;
  }
  function concat(list) {
    var n = 0, i;
    for (i = 0; i < list.length; i++) n += list[i].length;
    var out = new Uint8Array(n), at = 0;
    for (i = 0; i < list.length; i++) { out.set(list[i], at); at += list[i].length; }
    return out;
  }
  function deflate(u8) {
    if (typeof CompressionStream !== 'function') return Promise.resolve(null);
    try {
      var cs = new CompressionStream('deflate');
      var w = cs.writable.getWriter();
      w.write(u8); w.close();
      return new Response(cs.readable).arrayBuffer()
        .then(function (b) { return new Uint8Array(b); })
        ['catch'](function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  /*@3.NOPJ2.6*/
  function pdfStr(s) {
    var t = String(s).replace(/[\r\n]/g, ' '), out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if (c === 92 || c === 40 || c === 41) out += '\\' + t.charAt(i);
      else if (c >= 32 && c < 127) out += t.charAt(i);
      else if (c < 256) out += '\\' + ('000' + c.toString(8)).slice(-3);
      else {
        out += '\\' + ('000' + (c >> 8).toString(8)).slice(-3) +
               '\\' + ('000' + (c & 0xff).toString(8)).slice(-3);
      }
    }
    return '(' + out + ')';
  }
  function utf16be(s) {
    var out = '\\376\\377';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      out += '\\' + ('000' + (c >> 8).toString(8)).slice(-3) +
             '\\' + ('000' + (c & 0xff).toString(8)).slice(-3);
    }
    return '(' + out + ')';
  }
  function hx(n, w) {
    var s = n.toString(16).toUpperCase();
    while (s.length < (w || 4)) s = '0' + s;
    return s;
  }
  function num(v) {
    var r = Math.round(v * 100) / 100;
    return (r === Math.floor(r)) ? String(r) : String(r);
  }

  function Doc() { this.objs = []; }
  Doc.prototype.add = function (body) { this.objs.push(body); return this.objs.length; };
  Doc.prototype.reserve = function () { this.objs.push(null); return this.objs.length; };
  Doc.prototype.set = function (id, body) { this.objs[id - 1] = body; };
  Doc.prototype.build = function (rootId, infoId) {
    var parts = [bytes('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')];
    var at = parts[0].length, offs = [], i;
    for (i = 0; i < this.objs.length; i++) {
      var b = this.objs[i];
      if (b == null) b = bytes('<< >>');
      if (typeof b === 'string') b = bytes(b);
      var head = bytes((i + 1) + ' 0 obj\n');
      var tail = bytes('\nendobj\n');
      offs.push(at);
      parts.push(head, b, tail);
      at += head.length + b.length + tail.length;
    }
    var xref = at;
    var x = 'xref\n0 ' + (this.objs.length + 1) + '\n0000000000 65535 f \n';
    for (i = 0; i < offs.length; i++) {
      x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    }
    x += 'trailer\n<< /Size ' + (this.objs.length + 1) + ' /Root ' + rootId + ' 0 R' +
         (infoId ? (' /Info ' + infoId + ' 0 R') : '') + ' >>\nstartxref\n' + xref + '\n%%EOF\n';
    parts.push(bytes(x));
    return concat(parts);
  };

  /*@3.NOPJ2.7*/

  var PT = 72 / 96;
  var MISSING = {};

  /*@3.NOPJ2.20*/
  var COLC = {}, COLCX = null;

  function solveColor(css) {
    if (!COLCX) {
      var cv = document.createElement('canvas');
      cv.width = 2; cv.height = 1;
      COLCX = cv.getContext('2d', { willReadFrequently: true });
      if (!COLCX) return null;
    }
    var x = COLCX;
    var out = [0, 0, 0], a = 1, k;
    var got = [null, null];
    var beds = ['#ffffff', '#000000'];
    for (k = 0; k < 2; k++) {
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = beds[k];
      x.fillRect(0, 0, 2, 1);
      x.fillStyle = '#000000';
      x.fillStyle = css;
      if (String(x.fillStyle).toLowerCase() === '#000000' && !/^\s*(#000|black|rgba?\(0,\s*0,\s*0)/i.test(css)) {
        /*@3.NOPJ2.28*/
        if (k === 0) return null;
      }
      x.fillRect(0, 0, 2, 1);
      var d = x.getImageData(0, 0, 1, 1).data;
      got[k] = [d[0] / 255, d[1] / 255, d[2] / 255];
    }
    var sum = 0;
    for (k = 0; k < 3; k++) sum += 1 - (got[0][k] - got[1][k]);
    a = Math.max(0, Math.min(1, sum / 3));
    if (a < 0.004) return null;
    for (k = 0; k < 3; k++) out[k] = Math.max(0, Math.min(1, got[1][k] / a));
    return [out[0], out[1], out[2], a];
  }

  function rgbOf(css) {
    var key = String(css || '');
    if (!key) return null;
    if (COLC[key] !== undefined) return COLC[key];
    var res = null;
    var m = key.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      var p = m[1].split(/[,\s\/]+/).filter(function (t) { return t !== ''; })
        .map(function (t) { return parseFloat(t); });
      var al = p.length > 3 ? p[3] : 1;
      if (al > 0.02) res = [p[0] / 255, p[1] / 255, p[2] / 255, al];
    } else if (!/^(transparent|none|)$/i.test(key)) {
      res = solveColor(key);
      if (res && !(res[3] > 0.02)) res = null;
    }
    COLC[key] = res;
    return res;
  }

  function charRects(node) {
    var out = [], d = node.ownerDocument, s = node.data;
    for (var i = 0; i < s.length; i++) {
      var r = d.createRange();
      r.setStart(node, i); r.setEnd(node, i + 1);
      var b = r.getBoundingClientRect();
      out.push((b.width || b.height) ? b : null);
    }
    return out;
  }

  function harvestText(node, org, runs, emo) {
    var s = node.data;
    if (!s || !/\S/.test(s)) return;
    var d = node.ownerDocument;
    var full = d.createRange();
    full.selectNodeContents(node);
    var boxes = [].slice.call(full.getClientRects()).filter(function (r) {
      return r.width > 0.05 && r.height > 0.05;
    });
    if (!boxes.length) return;

    var el = node.parentElement;
    if (!el) return;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return;
    var col = rgbOf(cs.color) || [0, 0, 0, 1];
    var size = parseFloat(cs.fontSize) || 12;
    var famCss = cs.fontFamily, wCss = cs.fontWeight;
    var deco = String(cs.textDecorationLine || cs.textDecoration || '');
    var dirCss = cs.direction;

    var cr = charRects(node);

    /*@3.NOPJ2.60*/
    if (emo) {
      for (i = 0; i < s.length; i++) {
        var ecp = s.codePointAt(i);
        var wide = ecp > 0xFFFF;
        if (isEmojiCp(ecp)) {
          var eb = cr[i] || (wide ? cr[i + 1] : null);
          if (eb && eb.width > 1 && eb.height > 1) {
            emo.push({ cp: ecp,
                       x: eb.left - org.left, y: eb.top - org.top,
                       w: eb.width, h: eb.height, size: size });
          }
        }
        if (wide) i++;
      }
    }

    /*@3.NOPJ2.8*/
    var owner = new Array(cr.length), i, k;
    for (i = 0; i < cr.length; i++) {
      var r = cr[i];
      owner[i] = -1;
      if (!r) continue;
      var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      var best = -1, bestW = Infinity;
      for (k = 0; k < boxes.length; k++) {
        var bx = boxes[k];
        if (cx < bx.left - 0.6 || cx > bx.right + 0.6) continue;
        if (cy < bx.top - 0.6 || cy > bx.bottom + 0.6) continue;
        if (bx.width < bestW) { bestW = bx.width; best = k; }
      }
      owner[i] = best;
    }
    /*@3.NOPJ2.9*/
    for (i = 0; i < owner.length; i++) {
      if (owner[i] < 0) owner[i] = (i > 0 ? owner[i - 1] : (boxes.length ? 0 : -1));
    }

    for (k = 0; k < boxes.length; k++) {
      var txt = '';
      for (i = 0; i < owner.length; i++) if (owner[i] === k) txt += s.charAt(i);
      if (!/\S/.test(txt)) continue;
      var box = boxes[k];
      runs.push({
        t: txt,
        face: faceIdFor(famCss, wCss, txt),
        famDbg: famCss, fam: famCss, wgt: wCss,
        x: box.left - org.left,
        yTop: box.top - org.top,
        yBase: box.bottom - org.top - (box.height - size * 0.78) / 2,
        w: box.width,
        h: box.height,
        size: size, col: col, dir: dirCss,
        under: /underline/.test(deco), strike: /line-through/.test(deco)
      });
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return num(x) + ' ' + num(y) + ' ' + num(w) + ' ' + num(h) + ' re\n';
    var k = r * 0.5523;
    return num(x + r) + ' ' + num(y) + ' m\n' +
      num(x + w - r) + ' ' + num(y) + ' l\n' +
      num(x + w - r + k) + ' ' + num(y) + ' ' + num(x + w) + ' ' + num(y + r - k) + ' ' + num(x + w) + ' ' + num(y + r) + ' c\n' +
      num(x + w) + ' ' + num(y + h - r) + ' l\n' +
      num(x + w) + ' ' + num(y + h - r + k) + ' ' + num(x + w - r + k) + ' ' + num(y + h) + ' ' + num(x + w - r) + ' ' + num(y + h) + ' c\n' +
      num(x + r) + ' ' + num(y + h) + ' l\n' +
      num(x + r - k) + ' ' + num(y + h) + ' ' + num(x) + ' ' + num(y + h - r + k) + ' ' + num(x) + ' ' + num(y + h - r) + ' c\n' +
      num(x) + ' ' + num(y + r) + ' l\n' +
      num(x) + ' ' + num(y + r - k) + ' ' + num(x + r - k) + ' ' + num(y) + ' ' + num(x + r) + ' ' + num(y) + ' c\n';
  }

  function harvestBoxes(rootEl, org, boxes) {
    var all = rootEl.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (parseFloat(cs.opacity) < 0.05) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) continue;
      if (r.width > 4000 || r.height > 40000) continue;

      var bg = rgbOf(cs.backgroundColor);
      var rad = parseFloat(cs.borderTopLeftRadius) || 0;
      if (bg) {
        boxes.push({ kind: 'fill', x: r.left - org.left, y: r.top - org.top,
                     w: r.width, h: r.height, col: bg, rad: rad });
      }
      var sides = [['Top', 0], ['Right', 1], ['Bottom', 2], ['Left', 3]];
      for (var s = 0; s < sides.length; s++) {
        var nm = sides[s][0];
        var bw = parseFloat(cs['border' + nm + 'Width']) || 0;
        if (bw < 0.2) continue;
        if (cs['border' + nm + 'Style'] === 'none') continue;
        var bc = rgbOf(cs['border' + nm + 'Color']);
        if (!bc) continue;
        var bx = r.left - org.left, by = r.top - org.top, bwid = r.width, bhei = r.height;
        if (nm === 'Top') boxes.push({ kind: 'fill', x: bx, y: by, w: bwid, h: bw, col: bc, rad: 0 });
        else if (nm === 'Bottom') boxes.push({ kind: 'fill', x: bx, y: by + bhei - bw, w: bwid, h: bw, col: bc, rad: 0 });
        else if (nm === 'Left') boxes.push({ kind: 'fill', x: bx, y: by, w: bw, h: bhei, col: bc, rad: 0 });
        else boxes.push({ kind: 'fill', x: bx + bwid - bw, y: by, w: bw, h: bhei, col: bc, rad: 0 });
      }
    }
  }

  function harvestLinks(rootEl, org, links, dests) {
    var as = rootEl.querySelectorAll('a[href]');
    var i, r;
    for (i = 0; i < as.length; i++) {
      var href = as[i].getAttribute('href') || '';
      var nl = as[i].getAttribute('data-nl') || '';
      var target = nl || href;
      r = as[i].getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (target.charAt(0) === '#') {
        links.push({ kind: 'goto', to: decodeURIComponent(target.slice(1)),
                     x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height });
      } else if (/^https:\/\//i.test(href)) {
        var safe = href;
        try { safe = encodeURI(decodeURI(href)); } catch (eU) { safe = encodeURI(href); }
        links.push({ kind: 'uri', uri: safe,
                     x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height });
      }
    }
    var ided = rootEl.querySelectorAll('[id]');
    for (i = 0; i < ided.length; i++) {
      var id = ided[i].id;
      if (!id || dests[id]) continue;
      r = ided[i].getBoundingClientRect();
      dests[id] = { y: r.top - org.top, x: r.left - org.left };
    }
  }

  function harvestOutline(rootEl, org, marks) {
    var hs = rootEl.querySelectorAll('.ne-b-h');
    for (var i = 0; i < hs.length; i++) {
      var el = hs[i];
      var ed = el.querySelector('[contenteditable], h1, h2, h3, h4, h5, h6') || el;
      var txt = (ed.textContent || '').trim();
      if (!txt) continue;
      var tag = (el.querySelector('h1,h2,h3,h4,h5,h6') || {}).tagName || 'H2';
      var r = el.getBoundingClientRect();
      marks.push({ t: txt.slice(0, 120), lv: parseInt(String(tag).slice(1), 10) || 2,
                   y: r.top - org.top, id: el.id || '' });
    }
  }

  /*@3.NOPJ2.22*/
  var QUOTED = /^"([\s\S]*)"$/;
  var BLANKS = /[\s\u200b]/g;

  /*@3.NOPJ2.37*/
  function pseudoBox(r, cs, es, size, text, org) {
    var nv = function (v) { var f = parseFloat(v); return isFinite(f) ? f : null; };
    var bl = nv(es.borderLeftWidth) || 0, br = nv(es.borderRightWidth) || 0;
    var bt = nv(es.borderTopWidth) || 0;
    var pw = nv(cs.width), ph = nv(cs.height);
    var w = (pw != null && pw > 0.5) ? pw : Math.min(r.width, size * 1.35 * text.length);
    var h = (ph != null && ph > 0.5) ? ph : r.height;
    var x, y = r.top, pos = cs.position;
    if (pos === 'absolute' || pos === 'fixed') {
      var lf = nv(cs.left), rt = nv(cs.right), tp = nv(cs.top);
      if (lf != null) x = r.left + bl + lf + (nv(cs.marginLeft) || 0);
      else if (rt != null) x = r.right - br - rt - (nv(cs.marginRight) || 0) - w;
      else x = r.left;
      if (tp != null) y = r.top + bt + tp + (nv(cs.marginTop) || 0);
    } else {
      x = (cs.direction === 'rtl' || es.direction === 'rtl') ? (r.right - w) : r.left;
    }
    /*@3.NOPJ2.38*/
    var ta = cs.textAlign;
    var align = (ta === 'center') ? 'c' : ((ta === 'right' || ta === 'end') ? 'e' : '');
    return { x: x - org.left, y: y - org.top, w: w, h: h, align: align };
  }

  function harvestPseudo(rootEl, org, runs) {
    var all = rootEl.querySelectorAll('*'), i, k;
    var spots = ['::before', '::after'];
    for (i = 0; i < all.length; i++) {
      var el = all[i];
      for (k = 0; k < spots.length; k++) {
        var cs;
        try { cs = getComputedStyle(el, spots[k]); } catch (e) { continue; }
        if (!cs || cs.content === 'none' || cs.content === 'normal') continue;
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (parseFloat(cs.opacity) < 0.05) continue;
        var m = String(cs.content).match(QUOTED);
        if (!m || !m[1] || !m[1].replace(BLANKS, '')) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        var size = parseFloat(cs.fontSize) || 12;
        var es = getComputedStyle(el);
        var col = rgbOf(cs.color) || rgbOf(es.color) || [0, 0, 0, 1];
        var box = pseudoBox(r, cs, es, size, m[1], org);
        runs.push({
          t: m[1],
          face: faceIdFor(cs.fontFamily, cs.fontWeight, m[1]),
          fam: cs.fontFamily, wgt: cs.fontWeight,
          x: box.x,
          yTop: box.y,
          yBase: box.y + box.h - (box.h - size * 0.78) / 2,
          w: box.w, h: box.h, size: size, col: col, dir: cs.direction,
          align: box.align,
          under: false, strike: false, fit: false
        });
      }
    }
  }

  var IMGFAIL = 0, IMGSKIP = 0;

  /*@3.NOPJ2.42*/
  function radiusOf(cs, r) {
    var v = String(cs.borderTopLeftRadius || '0').split(/\s+/)[0];
    var f = parseFloat(v);
    if (!isFinite(f)) return 0;
    if (/%$/.test(v)) f = f / 100 * Math.min(r.width, r.height);
    return Math.max(0, f);
  }

  function clipOf(im) {
    var e = im, hit = null, i;
    for (i = 0; i < 4 && e; i++) {
      var cs = getComputedStyle(e);
      var clips = (i === 0) || (cs.overflow !== 'visible');
      if (clips) {
        var r = e.getBoundingClientRect();
        var rad = radiusOf(cs, r);
        if (!hit || rad > hit.rad) hit = { r: r, rad: rad };
      }
      e = e.parentElement;
    }
    return hit;
  }

  function pctOf(v) {
    if (v == null) return 0.5;
    var f = parseFloat(v);
    if (/left|top/.test(v)) return 0;
    if (/right|bottom/.test(v)) return 1;
    if (/center/.test(v)) return 0.5;
    if (!isFinite(f)) return 0.5;
    return /%$/.test(String(v)) ? f / 100 : 0.5;
  }

  function fitBox(im, cs, box) {
    var f = cs.objectFit || 'fill';
    var nw = im.naturalWidth, nh = im.naturalHeight;
    if (!nw || !nh || f === 'fill') return box;
    var sc;
    if (f === 'cover') sc = Math.max(box.w / nw, box.h / nh);
    else if (f === 'none') sc = 1;
    else sc = Math.min(box.w / nw, box.h / nh);
    if (f === 'scale-down') sc = Math.min(sc, 1);
    var w = nw * sc, h = nh * sc;
    var pos = String(cs.objectPosition || '50% 50%').split(/\s+/);
    return { x: box.x + (box.w - w) * pctOf(pos[0]),
             y: box.y + (box.h - h) * pctOf(pos.length > 1 ? pos[1] : pos[0]),
             w: w, h: h };
  }


  function harvestImages(rootEl, org, imgs) {
    var list = rootEl.querySelectorAll('img');
    for (var i = 0; i < list.length; i++) {
      var im = list[i];
      var r = im.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (!im.complete || !im.naturalWidth) { IMGSKIP++; continue; }
      var cs = getComputedStyle(im);
      var box = { x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height };
      var draw = fitBox(im, cs, box);
      var cl = clipOf(im);
      var clip = cl ? { x: cl.r.left - org.left, y: cl.r.top - org.top,
                        w: cl.r.width, h: cl.r.height, rad: cl.rad } : null;
      imgs.push({ el: im, x: draw.x, y: draw.y, w: draw.w, h: draw.h,
                  clip: clip, cy: box.y, ch: box.h });
    }
  }

  /*@3.NOPJ2.76*/
  var VEC_MAX_PX = 4200000;

  function isVector(img) {
    var s = String(img.currentSrc || img.src || '');
    return /^data:image\/svg\+xml/i.test(s) || /\.svg(\?|#|$)/i.test(s);
  }

  function paperOf(img) {
    var e = img, cs, bg;
    for (var g = 0; e && g < 6; g++, e = e.parentElement) {
      try { cs = getComputedStyle(e); } catch (e0) { break; }
      bg = rgbOf(cs.backgroundColor);
      if (bg) {
        return 'rgb(' + Math.round(bg[0] * 255) + ',' + Math.round(bg[1] * 255) +
               ',' + Math.round(bg[2] * 255) + ')';
      }
    }
    return '#fff';
  }

  /*@3.NOPJ2.45*/
  function jpegOf(img, shownPx) {
    try {
      var vec = isVector(img);
      var cap = Math.max(320, Math.min(vec ? 2600 : 1600, Math.round((shownPx || 400) * 3)));
      var big = Math.max(img.naturalWidth, img.naturalHeight);
      var sc = vec ? (cap / big) : Math.min(1, cap / big);
      var cw = Math.max(1, Math.round(img.naturalWidth * sc));
      var ch = Math.max(1, Math.round(img.naturalHeight * sc));
      if (vec && cw * ch > VEC_MAX_PX) {
        var kk = Math.sqrt(VEC_MAX_PX / (cw * ch));
        cw = Math.max(1, Math.round(cw * kk));
        ch = Math.max(1, Math.round(ch * kk));
      }
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var cx = cv.getContext('2d');
      cx.fillStyle = vec ? paperOf(img) : '#fff';
      cx.fillRect(0, 0, cw, ch);
      cx.drawImage(img, 0, 0, cw, ch);
      if (vec) {
        var px = cx.getImageData(0, 0, cw, ch).data;
        var rgb = new Uint8Array(cw * ch * 3);
        for (var q = 0, w = 0; q < px.length; q += 4) {
          rgb[w++] = px[q]; rgb[w++] = px[q + 1]; rgb[w++] = px[q + 2];
        }
        return { data: rgb, w: cw, h: ch, raw: 1 };
      }
      var url = cv.toDataURL('image/jpeg', 0.82);
      var b64 = url.slice(url.indexOf(',') + 1);
      var raw = atob(b64);
      var u8 = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
      return { data: u8, w: cw, h: ch };
    } catch (e) { return null; }
  }

  /*@3.NOPJ2.10*/

  /*@3.NOPJ2.11*/
  function classOf(cp) {
    if ((cp >= 0x0600 && cp <= 0x08FF) || (cp >= 0xFB50 && cp <= 0xFEFF) ||
        (cp >= 0x0590 && cp <= 0x05FF)) return 'R';
    if ((cp >= 0x0041 && cp <= 0x005A) || (cp >= 0x0061 && cp <= 0x007A) ||
        (cp >= 0x0030 && cp <= 0x0039) || (cp >= 0x00C0 && cp <= 0x024F) ||
        (cp >= 0x0660 && cp <= 0x0669)) return 'L';
    return 'N';
  }

  function orderClusters(gl, rtl) {
    var cl = [], cur = null, i;
    for (i = 0; i < gl.length; i++) {
      var cp = gl[i].u[0];
      if (cur && isMark(cp)) { cur.push(gl[i]); continue; }
      cur = [gl[i]];
      cur.cls = classOf(cp);
      cl.push(cur);
    }
    if (rtl) bidiReverse(cl);
    return cl;
  }

  function bidiReverse(cl) {
    var i, k;
    for (i = 0; i < cl.length; i++) {
      if (cl[i].cls !== 'N') continue;
      var pv = 'R', nx = 'R';
      for (k = i - 1; k >= 0; k--) { if (cl[k].cls !== 'N') { pv = cl[k].cls; break; } }
      for (k = i + 1; k < cl.length; k++) { if (cl[k].cls !== 'N') { nx = cl[k].cls; break; } }
      cl[i].run = (pv === 'L' && nx === 'L') ? 'L' : 'R';
    }
    for (i = 0; i < cl.length; i++) if (!cl[i].run) cl[i].run = cl[i].cls;
    cl.reverse();
    i = 0;
    while (i < cl.length) {
      if (cl[i].run !== 'L') { i++; continue; }
      var j = i;
      while (j + 1 < cl.length && cl[j + 1].run === 'L') j++;
      for (k = 0; k < (j - i + 1) >> 1; k++) {
        var t = cl[i + k]; cl[i + k] = cl[j - k]; cl[j - k] = t;
      }
      i = j + 1;
    }
  }

  /*@3.NOPJ2.26*/
  var LIG_SPLIT = {
    0xFEF5: [0xFEDF, 0xFE82], 0xFEF6: [0xFEE0, 0xFE82],
    0xFEF7: [0xFEDF, 0xFE84], 0xFEF8: [0xFEE0, 0xFE84],
    0xFEF9: [0xFEDF, 0xFE88], 0xFEFA: [0xFEE0, 0xFE88],
    0xFEFB: [0xFEDF, 0xFE8E], 0xFEFC: [0xFEE0, 0xFE8E]
  };

  /*@3.NOPJ2.48*/
  var SYMFA = {
    0x2705: 0xF058, 0x2714: 0xF00C, 0x2713: 0xF00C, 0x2611: 0xF14A,
    0x274C: 0xF057, 0x274E: 0xF057, 0x2716: 0xF00D, 0x2717: 0xF00D,
    0x2718: 0xF00D, 0x26A0: 0xF071, 0x2757: 0xF071, 0x2755: 0xF071,
    0x2764: 0xF004, 0x2665: 0xF004, 0x2605: 0xF005, 0x2B50: 0xF005,
    0x21A9: 0xF3E5, 0x26A1: 0xF0E7, 0x1F680: 0xF135, 0x1F6AB: 0xF05E,
    0x26D4: 0xF05E, 0x2139: 0xF05A, 0x1F525: 0xF0E7, 0x1F4A1: 0xF0EB
  };
  var SYMFACE = 'fa-solid-900';

  /*@3.NOPJ2.52*/
  var SYMCOL = {
    0x2705: '#2ea043', 0x2714: '#2ea043', 0x2713: '#2ea043', 0x2611: '#2ea043',
    0x274C: '#e5484d', 0x274E: '#e5484d', 0x2716: '#e5484d', 0x2717: '#e5484d',
    0x2718: '#e5484d', 0x26A0: '#e3a008', 0x2757: '#e5484d', 0x2755: '#e5484d',
    0x2764: '#e5484d', 0x2665: '#e5484d', 0x2605: '#eab308', 0x2B50: '#eab308',
    0x26A1: '#e3a008', 0x1F680: '#ef4444', 0x1F6AB: '#e5484d',
    0x26D4: '#e5484d', 0x2139: '#3b82f6', 0x1F525: '#f97316', 0x1F4A1: '#f59e0b'
  };

  /*@3.NOPJ2.49*/
  function symNeed(runs) {
    var hit = {}, out = [], i, k, q, z;
    for (i = 0; i < runs.length; i++) {
      var t = runs[i].t;
      for (k = 0; k < t.length; k++) {
        var c = t.charCodeAt(k);
        if (c < 0x0100) continue;
        for (q = 0; q < SYMFACES.length; q++) {
          if (hit[SYMFACES[q].id]) continue;
          for (z = 0; z < SYMFACES[q].r.length; z++) {
            if (c >= SYMFACES[q].r[z][0] && c <= SYMFACES[q].r[z][1]) {
              hit[SYMFACES[q].id] = 1;
              out.push(SYMFACES[q].id);
              break;
            }
          }
        }
      }
    }
    return out;
  }

  function symfaIn(runs) {
    for (var i = 0; i < runs.length; i++) {
      var t = runs[i].t, k;
      for (k = 0; k < t.length; k++) {
        var c = t.codePointAt(k);
        if (c > 0xFFFF) k++;
        if (SYMFA[c]) return true;
      }
    }
    return false;
  }

  /*@3.NOPJ2.25*/
  function resolve(cp, faces) {
    for (var i = 0; i < faces.length; i++) {
      if (!faces[i]) continue;
      var g = faces[i].gid(cp);
      if (g) return { f: faces[i], g: g };
    }
    return null;
  }

  function resolveSeq(cp, faces) {
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      if (!f) continue;
      var sq = f.shape ? f.shape(cp) : null;
      if (sq && sq.length) return { f: f, g: sq.slice() };
      var g = f.gid(cp);
      if (g) return { f: f, g: [g] };
    }
    return null;
  }

  function faceChain(run, faceMap) {
    var out = [], seen = {}, k;
    function add(id) {
      if (!id || seen[id] || !faceMap[id]) return;
      seen[id] = 1; out.push(faceMap[id]);
    }
    add(run.face);
    add(FALLBACK.a); add(FALLBACK.b);
    for (k = 0; k < SYMFACES.length; k++) add(SYMFACES[k].id);
    var ks = Object.keys(faceMap);
    for (k = 0; k < ks.length; k++) add(ks[k]);
    return out;
  }

  /*@3.NOPJ2.40*/
  var MEASCV = null, MEASCACHE = {};
  function measureAdv(chars, run) {
    if (!chars || !chars.length || !run || !run.fam) return 0;
    var txt = String.fromCharCode.apply(String, chars);
    var key = run.wgt + '|' + run.fam + '|' + txt;
    if (MEASCACHE[key] != null) return MEASCACHE[key];
    var v = 0;
    try {
      if (!MEASCV) MEASCV = document.createElement('canvas').getContext('2d');
      MEASCV.font = (run.wgt || 400) + ' 1000px ' + run.fam;
      v = MEASCV.measureText(txt).width;
      if (!(v > 0) || v > 4000) v = 0;
    } catch (e) { v = 0; }
    MEASCACHE[key] = v;
    return v;
  }

  /*@3.NOPJ2.55*/
  function isEmojiCp(cp) {
    return (cp >= 0x1F000 && cp <= 0x1FAFF) ||
           (cp >= 0x2600 && cp <= 0x27BF) ||
           (cp >= 0x2B00 && cp <= 0x2BFF) ||
           cp === 0x2139 || cp === 0x2122 || cp === 0x00A9 || cp === 0x00AE ||
           (cp >= 0x2190 && cp <= 0x21FF && false);
  }

  var EMOCACHE = {};

  function emoBits(cp, px) {
    var key = cp + '@' + px;
    if (EMOCACHE[key] !== undefined) return EMOCACHE[key];
    var out = null;
    try {
      var s = Math.max(48, Math.min(192, Math.round((px || 16) * 3)));
      var cv = document.createElement('canvas');
      cv.width = s; cv.height = s;
      var cx = cv.getContext('2d', { willReadFrequently: true });
      cx.clearRect(0, 0, s, s);
      cx.font = Math.round(s * 0.84) + 'px "Segoe UI Emoji","Apple Color Emoji",' +
                '"Noto Color Emoji","Segoe UI Symbol",sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(String.fromCodePoint(cp), s / 2, s / 2 + s * 0.04);
      var d = cx.getImageData(0, 0, s, s).data;
      var rgb = new Uint8Array(s * s * 3), al = new Uint8Array(s * s);
      var ink = 0, i, q;
      for (i = 0, q = 0; i < s * s; i++) {
        rgb[q++] = d[i * 4]; rgb[q++] = d[i * 4 + 1]; rgb[q++] = d[i * 4 + 2];
        al[i] = d[i * 4 + 3];
        if (d[i * 4 + 3] > 8) ink++;
      }
      if (ink > 4) out = { w: s, h: s, rgb: rgb, al: al };
    } catch (e) { out = null; }
    EMOCACHE[key] = out;
    return out;
  }

  function emoAdv(cps, run) {
    if (!cps || !cps.length || !run || !run.fam) return 0;
    var txt = '', i;
    for (i = 0; i < cps.length; i++) txt += String.fromCodePoint(cps[i]);
    var key = 'E|' + run.wgt + '|' + run.fam + '|' + txt;
    if (MEASCACHE[key] != null) return MEASCACHE[key];
    var v = 0;
    try {
      if (!MEASCV) MEASCV = document.createElement('canvas').getContext('2d');
      MEASCV.font = (run.wgt || 400) + ' 1000px ' + run.fam;
      v = MEASCV.measureText(txt).width;
      if (!(v > 0) || v > 4000) v = 0;
    } catch (e) { v = 0; }
    MEASCACHE[key] = v;
    return v;
  }

  function textOps(run, faceMap) {
    var single = !!(faceMap && faceMap.gid);
    var chain = single ? [faceMap] : faceChain(run, faceMap);
    var primary = chain[0];
    if (!primary) return { segs: [], empty: true };

    var gl = shape(run.t), i, k;
    var rtl = (run.dir === 'rtl');
    for (i = 0; i < run.t.length; i++) {
      var k0 = classOf(run.t.charCodeAt(i));
      if (k0 === 'R') { rtl = true; break; }
      if (k0 === 'L') { rtl = false; break; }
    }
    var cl = orderClusters(gl, rtl);

    /*@3.NOPJ2.29*/
    var items = [], natural = 0;
    for (i = 0; i < cl.length; i++) {
      var seq = cl[i];
      var cp = seq[0].g;
      var hit = resolveSeq(cp, chain);
      var glyphs = null, fUse = null, uni = null, measured = 0;
      if (hit) {
        fUse = hit.f; glyphs = hit.g;
        if (glyphs.length > 1) {
          /*@3.NOPJ2.51*/
          uni = [];
          for (k = 0; k < glyphs.length; k++) uni.push([]);
          uni[0] = seq[0].u;
        }
      } else if (LIG_SPLIT[cp]) {
        /*@3.NOPJ2.39*/
        var pair = LIG_SPLIT[cp];
        var h1 = resolve(pair[0], chain), h2 = resolve(pair[1], chain);
        if (h1 && h2 && h1.f === h2.f) {
          fUse = h1.f;
          glyphs = rtl ? [h2.g, h1.g] : [h1.g, h2.g];
          uni = rtl ? [[], seq[0].u] : [seq[0].u, []];
          measured = measureAdv(seq[0].u, run);
        }
      }
      var symCol = null;
      /*@3.NOPJ2.56*/
      if (!glyphs && isEmojiCp(cp)) {
        var advE = Math.round(emoAdv(seq[0].u, run));
        if (advE > 0) {
          items.push({ f: primary, g: [], adv: advE, marks: [], col: null });
          natural += advE;
          continue;
        }
      }
      if (!glyphs && SYMFA[cp]) {
        var hs = resolve(SYMFA[cp], chain);
        if (hs) {
          fUse = hs.f;
          glyphs = [hs.g];
          uni = [seq[0].u];
          symCol = SYMCOL[cp] || null;
        }
      }
      if (!glyphs) {
        MISSING[seq[0].u[0]] = (MISSING[seq[0].u[0]] || 0) + 1;
        continue;
      }
      var advB = 0;
      for (k = 0; k < glyphs.length; k++) advB += fUse.adv1(glyphs[k]);
      if (measured > 0) advB = measured;
      for (k = 0; k < glyphs.length; k++) {
        fUse.used[glyphs[k]] = uni ? (uni[k] || []) : ((k === 0) ? seq[0].u : []);
      }
      var marks = [];
      for (k = 1; k < seq.length; k++) {
        var mh = resolve(seq[k].g, [fUse]) || resolve(seq[k].g, chain);
        if (!mh || mh.f !== fUse) {
          MISSING[seq[k].u[0]] = (MISSING[seq[k].u[0]] || 0) + 1;
          continue;
        }
        fUse.used[mh.g] = seq[k].u;
        marks.push({ g: mh.g, w: fUse.markw[mh.g] || 0, adv: fUse.adv1(mh.g) });
      }
      items.push({ f: fUse, g: glyphs, adv: advB, marks: marks, col: symCol });
      natural += advB;
      for (k = 0; k < marks.length; k++) natural += marks[k].adv;
    }
    if (!items.length) return { segs: [], empty: true };

    /*@3.NOPJ2.30*/
    var wantPt = run.w * PT;
    var naturalPt = natural / 1000 * run.size * PT;
    var tz = (run.fit === false || !(naturalPt > 0.5) || !(wantPt > 0.5))
      ? 100 : (wantPt / naturalPt * 100);
    if (tz < 55 || tz > 190) tz = 100;
    var unit = run.size * PT * tz / 100000;
    var lead = 0;
    if (run.align && naturalPt > 0 && wantPt > naturalPt) {
      lead = (wantPt - naturalPt) * (run.align === 'c' ? 0.5 : 1);
    }

    /*@3.NOPJ2.31*/
    var segs = [], cur = null, penX = 0;
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (!cur || cur.face !== it.f || cur.col !== (it.col || null)) {
        cur = { face: it.f, col: it.col || null,
                dx: lead + penX * unit, parts: [], open: '' };
        segs.push(cur);
      }
      if (!it.g.length) {
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(-it.adv));
        penX += it.adv;
        continue;
      }
      for (k = 0; k < it.g.length; k++) cur.open += hx(it.g[k]);
      penX += it.adv;
      if (it.marks.length) {
        var wide = 0;
        for (k = 0; k < it.marks.length; k++) {
          if (it.marks[k].w > wide) wide = it.marks[k].w;
        }
        var shift = Math.max(0, Math.round((it.adv - wide) / 2));
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(it.adv - shift));
        var back = 0;
        for (k = 0; k < it.marks.length; k++) {
          cur.open += hx(it.marks[k].g);
          back += it.marks[k].adv;
        }
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(-(it.adv - shift - back)));
        penX += back;
      }
    }
    for (i = 0; i < segs.length; i++) {
      if (segs[i].open) { segs[i].parts.push('<' + segs[i].open + '>'); segs[i].open = ''; }
    }
    return { segs: segs, tz: tz, empty: false };
  }

  function alphaName(op) {
    return String(Math.max(1, Math.min(100, Math.round(op * 100))));
  }

  function alphasIn(pages) {
    var seen = { 100: 1 }, p, i;
    for (p = 0; p < pages.length; p++) {
      for (i = 0; i < pages[p].inks.length; i++) {
        var op = pages[p].inks[i].op;
        seen[alphaName(op == null ? 1 : op)] = 1;
      }
      for (i = 0; i < pages[p].boxes.length; i++) {
        seen[alphaName(pages[p].boxes[i].col[3])] = 1;
      }
      for (i = 0; i < pages[p].runs.length; i++) {
        seen[alphaName(pages[p].runs[i].col[3])] = 1;
      }
    }
    return Object.keys(seen);
  }

  function pageContent(page, faceMap, imgs, pxTop, pageHpx, pageHpt) {
    var imgMap = imgs.imgMap;
    var s = ['q\n'], i;
    var lastCol = null, lastAlpha = '100';

    function setAlpha(a) {
      var nm = alphaName(a == null ? 1 : a);
      if (nm === lastAlpha) return;
      lastAlpha = nm;
      s.push('/GA' + nm + ' gs\n');
    }

    function setFill(c) {
      setAlpha(c[3]);
      var key = c[0] + ',' + c[1] + ',' + c[2];
      if (lastCol === key) return;
      lastCol = key;
      s.push(num(c[0]) + ' ' + num(c[1]) + ' ' + num(c[2]) + ' rg\n');
    }

    for (i = 0; i < page.boxes.length; i++) {
      var b = page.boxes[i];
      var by = pageHpt - (b.y - pxTop + b.h) * PT;
      setFill(b.col);
      s.push(roundRect(b.x * PT, by, b.w * PT, b.h * PT, (b.rad || 0) * PT));
      s.push('f\n');
    }

    for (i = 0; i < page.imgs.length; i++) {
      var im = page.imgs[i];
      var nm = imgMap.get(im.el);
      if (!nm) continue;
      var iy = pageHpt - (im.y - pxTop + im.h) * PT;
      s.push('q\n');
      if (im.clip) {
        s.push(roundRect(im.clip.x * PT, pageHpt - (im.clip.y - pxTop + im.clip.h) * PT,
                         im.clip.w * PT, im.clip.h * PT, (im.clip.rad || 0) * PT));
        s.push('W n\n');
      }
      s.push(num(im.w * PT) + ' 0 0 ' + num(im.h * PT) + ' ' +
             num(im.x * PT) + ' ' + num(iy) + ' cm /' + nm + ' Do Q\n');
    }

    /*@3.NOPJ2.66*/
    for (i = 0; i < (page.emo || []).length; i++) {
      var em = page.emo[i];
      var enm2 = imgs.emoMap[em.cp];
      if (!enm2) continue;
      var side = Math.min(em.w, em.h);
      var ex = em.x + (em.w - side) / 2;
      var ey = pageHpt - (em.y - pxTop + (em.h - side) / 2 + side) * PT;
      s.push('q\n' + num(side * PT) + ' 0 0 ' + num(side * PT) + ' ' +
             num(ex * PT) + ' ' + num(ey) + ' cm /' + enm2 + ' Do Q\n');
    }

    var lastFace = '', lastSize = 0, lastTz = -1;
    s.push('BT\n');
    for (i = 0; i < page.runs.length; i++) {
      var r = page.runs[i];
      var t = textOps(r, faceMap);
      if (t.empty) continue;
      var y = pageHpt - (r.yBase - pxTop) * PT;
      if (Math.abs(lastTz - t.tz) > 0.4) { s.push(num(t.tz) + ' Tz\n'); lastTz = t.tz; }
      setFill(r.col);
      for (var sg = 0; sg < t.segs.length; sg++) {
        var seg = t.segs[sg];
        var fname = 'F_' + seg.face.id.replace(/[^\w]/g, '');
        if (lastFace !== fname || lastSize !== r.size) {
          s.push('/' + fname + ' ' + num(r.size * PT) + ' Tf\n');
          lastFace = fname; lastSize = r.size;
        }
        setFill(seg.col || r.col);
        s.push('1 0 0 1 ' + num(r.x * PT + seg.dx) + ' ' + num(y) +
               ' Tm [' + seg.parts.join(' ') + '] TJ\n');
      }
    }
    s.push('ET\n');

    for (i = 0; i < page.runs.length; i++) {
      var u = page.runs[i];
      if (!u.under && !u.strike) continue;
      setFill(u.col);
      var uy = u.under
        ? pageHpt - (u.yBase - pxTop + u.size * 0.12) * PT
        : pageHpt - (u.yBase - pxTop - u.size * 0.28) * PT;
      s.push(num(u.x * PT) + ' ' + num(uy) + ' ' + num(u.w * PT) + ' ' +
             num(Math.max(0.5, u.size * 0.055 * PT)) + ' re f\n');
    }

    /*@3.NOPJ2.43*/
    for (i = 0; i < page.inks.length; i++) {
      var k = page.inks[i];
      setAlpha(k.op);
      if (k.fill) {
        s.push(num(k.col[0]) + ' ' + num(k.col[1]) + ' ' + num(k.col[2]) + ' rg\n');
      } else {
        s.push(num(k.col[0]) + ' ' + num(k.col[1]) + ' ' + num(k.col[2]) + ' RG\n');
        s.push(num(k.w * PT) + ' w 1 J 1 j\n');
      }
      var cm = k.cmds, cc, cq;
      for (var p = 0; p < cm.length; p++) {
        cc = cm[p];
        if (cc[0] === 'h') { s.push('h\n'); continue; }
        var seg = '';
        for (cq = 1; cq + 1 < cc.length; cq += 2) {
          seg += num(cc[cq] * PT) + ' ' + num(pageHpt - (cc[cq + 1] - pxTop) * PT) + ' ';
        }
        s.push(seg + cc[0] + '\n');
      }
      s.push(k.fill ? 'f\n' : 'S\n');
    }
    setAlpha(1);

    s.push('Q\n');
    return s.join('');
  }

  /*@3.NOPJ2.14*/

  function mount(meta) {
    return new Promise(function (res, rej) {
      var ifr = document.createElement('iframe');
      ifr.setAttribute('aria-hidden', 'true');
      ifr.setAttribute('tabindex', '-1');
      ifr.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:0;' +
        'inline-size:' + (meta.pageW + 8) + 'px;block-size:600px;opacity:.01;' +
        'pointer-events:none;z-index:-1;border:0';
      document.body.appendChild(ifr);
      var d = ifr.contentDocument;
      var sheets = (meta.css || []).map(function (h) {
        return '<link rel="stylesheet" href="' + h.replace(/"/g, '&quot;') + '">';
      }).join('');
      var pw = meta.pageW;
      /*@3.NOPJ2.77*/
      var PT = window.GardenPrintTheme;
      var mode = meta.printMode || (PT ? PT.readMode() : 'paper');
      var tkey = PT ? PT.resolve(mode) : 'paper';
      var dark = PT ? PT.isDark(mode) : false;
      var pset = PT ? PT.set(mode) : null;
      var page = pset ? pset.bg : '#ffffff';
      var css = (PT ? PT.vars(mode) : '') +
        'html,body{margin:0;padding:0;background:' + page + '}' +
        '.pgi{position:relative;inline-size:' + pw + 'px}' +
        '.pgi .na,.pgi .na-zoom,.pgi .na-page{display:block;block-size:auto;' +
        'min-block-size:0;inline-size:' + pw + 'px;max-inline-size:none;' +
        'overflow:visible;zoom:1}' +
        '.pgi > .na{background:transparent}' +
        '.pgi .na-page{margin:0}' +
        '.pgi .na-sheet{border-color:transparent;border-radius:0;box-shadow:none}' +
        '.pgi .ne-rail,.pgi .ne-wgrip,.pgi .ne-rgrip,.pgi .ne-selhint,.pgi .na-pgbar,' +
        '.pgi .ne-code-bar,.pgi .ne-menu,.pgi .ne-img-ed,.pgi .ne-tex,.pgi .ne-tbl-bar,' +
        '.pgi .ne-cap-ed,.pgi .nc-selbar,.pgi .na-quota{visibility:hidden !important}' +
        '.pgi .ne-tail,.pgi .ne-addbar{visibility:hidden !important}' +
        /*@3.NOPJ2.53*/
        'mjx-assistive-mml{display:none !important}' +
      '.pgi [data-ph]::before{content:"" !important}' +
        /*@3.NOPJ2.78*/
        '.pgi .ne-dgm{border-color:transparent !important;background:transparent !important}' +
        '.pgi .ne-dgm-fix{visibility:hidden !important}' +
        '.pgi *{caret-color:transparent}';
      /*@3.NOPJ2.35*/
      var rootAttr = '';
      var ra = meta.rootAttrs || {}, rk;
      for (rk in ra) {
        if (rk === 'dir' || rk === 'lang' || rk === 'data-theme') continue;
        rootAttr += ' ' + rk + '="' + String(ra[rk]).replace(/"/g, '&quot;') + '"';
      }
      d.open();
      d.write('<!DOCTYPE html><html dir="' + (meta.dir === 'rtl' ? 'rtl' : 'ltr') +
        '" lang="' + (meta.dir === 'rtl' ? 'ar' : 'en') +
        '" data-theme="' + (tkey === 'paper' ? 'light' : tkey) +
        '" data-print-mode="' + mode + '" data-print-dark="' + (dark ? '1' : '0') + '"' +
        rootAttr + '>' +
        '<head><meta charset="UTF-8">' + sheets + '</head>' +
        '<body><div class="pgi">' + String(meta.html || '').replace('<!--@3.NOPJ2.75-->', '') +
        '</div></body></html>');
      d.close();
      var incss = (meta.inlineCss || []).concat([css]);
      for (var ic = 0; ic < incss.length; ic++) {
        var st = d.createElement('style');
        st.textContent = String(incss[ic]);
        d.head.appendChild(st);
      }

      var done = false;
      var fin = function () {
        if (done) return;
        done = true;
        var jobs = [];
        /*@3.NOPJ2.23*/
        var links = d.querySelectorAll('link[rel="stylesheet"]');
        for (var L = 0; L < links.length; L++) {
          if (links[L].sheet) continue;
          (function (lk) {
            jobs.push(new Promise(function (r3) {
              var t2 = setTimeout(r3, 6000);
              var k2 = function () { clearTimeout(t2); r3(); };
              lk.addEventListener('load', k2); lk.addEventListener('error', k2);
            }));
          }(links[L]));
        }
        /*@3.NOPJ2.36*/
        var imgs = [].slice.call(d.images || []);
        for (var i = 0; i < imgs.length; i++) {
          (function (im) {
            var src = im.currentSrc || im.src;
            im.setAttribute('loading', 'eager');
            im.setAttribute('decoding', 'sync');
            var sameOrigin = true;
            try { sameOrigin = (new URL(src, d.baseURI).origin === location.origin); }
            catch (e0) { sameOrigin = true; }
            var wait = function (retry) {
              return new Promise(function (r2) {
                var t = setTimeout(function () { r2(false); }, 9000);
                var ok = function () { clearTimeout(t); r2(true); };
                var bad = function () { clearTimeout(t); r2(false); };
                im.addEventListener('load', ok, { once: true });
                im.addEventListener('error', bad, { once: true });
                if (retry) { im.removeAttribute('crossorigin'); im.src = src; }
                else if (!sameOrigin) { im.crossOrigin = 'anonymous'; im.src = src; }
                else if (im.complete) { clearTimeout(t); r2(true); }
              });
            };
            jobs.push(wait(false).then(function (good) {
              if (good || sameOrigin) return null;
              return wait(true);
            }));
          }(imgs[i]));
        }
        Promise.all(jobs).then(function () {
          /*@3.NOPJ2.32*/
          var f2 = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
          return f2;
        }).then(function () {
          /*@3.NOPJ2.24*/
          return new Promise(function (r4) { setTimeout(r4, 160); });
        }).then(function () { res({ ifr: ifr, doc: d }); },
                function () { res({ ifr: ifr, doc: d }); });
      };
      setTimeout(fin, 60);
      setTimeout(function () { if (!done) { done = true; rej(new Error('mount timeout')); } }, 30000);
    });
  }

  /*@3.NOPJ2.17*/
  function geomOf(d, meta) {
    var page = d.querySelector('.na-page');
    var host = d.querySelector('.pgi');
    var el = page || host;
    var cs = d.defaultView.getComputedStyle(el);
    function pv(name, dflt) {
      var v = parseFloat(cs.getPropertyValue(name));
      return (isFinite(v) && v > 1) ? v : dflt;
    }
    var ph = pv('--na-sheeth', pv('--na-a4h', meta.pageH || 1123));
    var pw = Math.round(el.getBoundingClientRect().width) || (meta.pageW || 794);
    var np = parseInt(page && page.getAttribute('data-pages'), 10);
    if (!(np > 0)) np = 0;
    return { el: el, org: el.getBoundingClientRect(), ph: ph, pw: pw, pages: np };
  }

  function harvest(d, meta) {
    var host = d.querySelector('.pgi');
    var sheet = d.querySelector('.na-sheet') || host;
    var g = geomOf(d, meta);
    var org = g.org;
    var runs = [], boxes = [], links = [], imgs = [], marks = [], emo = [];
    var dests = {};

    harvestBoxes(host, org, boxes);
    harvestImages(host, org, imgs);
    harvestLinks(host, org, links, dests);
    harvestOutline(host, org, marks);

    harvestPseudo(host, org, runs);

    var walker = d.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) harvestText(n, org, runs, emo);

    /*@3.NOPJ2.15*/
    var far = host.getBoundingClientRect().height;
    var sr = sheet.getBoundingClientRect();
    if (sr.bottom - org.top > far) far = sr.bottom - org.top;
    var q;
    for (q = 0; q < boxes.length; q++) {
      if (boxes[q].y + boxes[q].h > far) far = boxes[q].y + boxes[q].h;
    }
    for (q = 0; q < runs.length; q++) {
      if (runs[q].yTop + runs[q].h > far) far = runs[q].yTop + runs[q].h;
    }
    return { runs: runs, boxes: boxes, links: links, imgs: imgs, marks: marks,
             emo: emo, dests: dests, height: far, sheetH: sr.height, org: org,
             ph: g.ph, pw: g.pw, pages: g.pages };
  }

  function sliceRange(pages, range) {
    if (!range) return pages;
    var a = Math.max(1, Math.min(pages.length, range.from | 0));
    var b = Math.max(a, Math.min(pages.length, range.to | 0));
    return pages.slice(a - 1, b);
  }

  function paginate(h, meta) {
    var ph = h.ph || meta.pageH || 1123;
    /*@3.NOPJ2.33*/
    var need = Math.ceil(h.height / ph - 0.02);
    var n = Math.max(1, h.pages || 0, need);
    n = Math.min(400, n);
    var pages = [];
    for (var i = 0; i < n; i++) {
      pages.push({ top: i * ph, oi: i, runs: [], boxes: [], imgs: [], inks: [], links: [],
                   emo: [] });
    }
    function place(list, key, getY, getH) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        var y0 = getY(it), y1 = y0 + getH(it);
        var a = Math.max(0, Math.floor(y0 / ph));
        var b = Math.min(n - 1, Math.floor((y1 - 0.5) / ph));
        for (var p = a; p <= b; p++) pages[p][key].push(it);
      }
    }
    place(h.boxes, 'boxes', function (b) { return b.y; }, function (b) { return b.h; });
    place(h.imgs, 'imgs', function (b) { return Math.min(b.y, b.cy); },
          function (b) { return Math.max(b.h, b.ch) + Math.abs(b.cy - b.y); });
    place(h.links, 'links', function (b) { return b.y; }, function (b) { return b.h; });
    place(h.emo || [], 'emo', function (b) { return b.y; }, function (b) { return b.h; });
    for (var i = 0; i < h.runs.length; i++) {
      var r = h.runs[i];
      var p = Math.max(0, Math.min(n - 1, Math.floor(r.yBase / ph)));
      pages[p].runs.push(r);
    }
    return pages;
  }

  /*@3.NOPJ2.73*/
  function trimBlank(pages, inks, meta) {
    var floorN = Math.max(1, (meta && meta.pages) || 0);
    var far = 0, i;
    for (i = 0; i < (inks || []).length; i++) {
      if ((inks[i].y1 || 0) > far) far = inks[i].y1 || 0;
    }
    while (pages.length > floorN) {
      var lp = pages[pages.length - 1];
      if (lp.runs.length || lp.boxes.length || lp.imgs.length ||
          lp.links.length || lp.emo.length) break;
      if (far > lp.top) break;
      pages.pop();
    }
  }

  /*@3.NOPJ2.18*/
  function inkHex(name) {
    var K = window.GardenCanvas;
    if (K && K.TONES && K.TONES[name] && K.TONES[name].light) return K.TONES[name].light;
    if (K && K.hexOf) { try { return K.hexOf(name); } catch (e) {} }
    return '#111827';
  }

  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) +
                            h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    if (!isFinite(n)) return [0.07, 0.09, 0.15];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function strokesOf(src) {
    var C = window.GardenInkCodec;
    var shapes = (src && src.shapes) || [];
    if (!src || !src.ink) return Promise.resolve(shapes.slice());
    if (!C || !C.unpack) return Promise.resolve(shapes.slice());
    return C.unpack(src.ink).then(function (list) {
      return shapes.concat((list || []).map(function (st) {
        return { ty: 'st', c: st.color || 'ink', w: st.w || 2.4, nib: st.nib,
                 o: st.tool === 'hi' ? 0.32 : 1, pts: st.pts || [] };
      }));
    })['catch'](function () { return shapes.slice(); });
  }

  /*@3.NOPJ2.41*/
  function inkCmds(el, box, k) {
    var K = window.GardenCanvas;
    if (!K || !K.inkGeom || !K.inkPaints) return null;
    var geom = K.inkGeom(el, k, function (x, y) {
      return { x: box.x + x * k, y: box.y + y * k };
    });
    if (!geom) return null;
    var cmds = [], cur = null;
    var api = {
      move: function (x, y) { cur = [x, y]; cmds.push(['m', x, y]); },
      line: function (x, y) { cur = [x, y]; cmds.push(['l', x, y]); },
      quad: function (cx, cy, x, y) {
        var x0 = cur ? cur[0] : cx, y0 = cur ? cur[1] : cy;
        cmds.push(['c', x0 + 2 / 3 * (cx - x0), y0 + 2 / 3 * (cy - y0),
                   x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), x, y]);
        cur = [x, y];
      },
      close: function () { cmds.push(['h']); },
      circle: function (x, y, r) {
        var c = r * 0.5523;
        cmds.push(['m', x - r, y]);
        cmds.push(['c', x - r, y - c, x - c, y - r, x, y - r]);
        cmds.push(['c', x + c, y - r, x + r, y - c, x + r, y]);
        cmds.push(['c', x + r, y + c, x + c, y + r, x, y + r]);
        cmds.push(['c', x - c, y + r, x - r, y + c, x - r, y]);
        cmds.push(['h']);
        cur = [x - r, y];
      }
    };
    /*@3.NOPJ2.79*/
    var lay = K.inkPaints(geom), out = [], i;
    for (i = 0; i < lay.length; i++) {
      cmds = []; cur = null;
      lay[i].emit(api);
      if (!cmds.length) continue;
      out.push({ cmds: cmds, fill: !!lay[i].fill,
                 w: lay[i].w || 0, op: lay[i].alpha });
    }
    return out;
  }

  function inkFrom(src, box, scale) {
    return strokesOf(src).then(function (els) {
      var out = [], i, g, p;
      var k = scale || 1;
      for (i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.ty !== 'st' || !e.pts || !e.pts.length) continue;
        var lay = inkCmds(e, box, k);
        if (!lay || !lay.length) continue;
        for (p = 0; p < lay.length; p++) {
          g = lay[p];
          var xs = [], ys = [], c, j;
          for (j = 0; j < g.cmds.length; j++) {
            c = g.cmds[j];
            for (var q = 1; q + 1 < c.length; q += 2) { xs.push(c[q]); ys.push(c[q + 1]); }
          }
          if (!xs.length) continue;
          out.push({ cmds: g.cmds, fill: g.fill, col: hexRgb(inkHex(e.c)),
                     w: Math.max(0.4, g.w), op: g.op,
                     y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) });
        }
      }
      return out;
    });
  }

  /*@3.NOPJ2.19*/
  function inkLayers(d, meta, docModel, org) {
    var jobs = [];
    var ov = docModel && docModel.ov;
    if (ov && (ov.ink || (ov.shapes && ov.shapes.length))) {
      var host = d.querySelector('.mink');
      var box = null, k = 1;
      /*@3.NOPJ2.80*/
      var bd = meta.board;
      if (bd && bd.w > 0 && bd.h > 0) {
        var shb = d.querySelector('.na-sheet');
        if (shb) {
          var srb = shb.getBoundingClientRect();
          k = srb.width / bd.w;
          box = { x: (srb.left - org.left) - bd.x * k,
                  y: (srb.top - org.top) - bd.y * k };
        }
      } else if (host) {
        var r = host.getBoundingClientRect();
        box = { x: r.left - org.left, y: r.top - org.top };
        k = (meta.inkBox && meta.inkBox.w) ? (r.width / meta.inkBox.w) : 1;
      } else if (meta.inkBox) {
        /*@3.NOPJ2.34*/
        var sh = d.querySelector('.na-sheet');
        if (sh) {
          var sr2 = sh.getBoundingClientRect();
          var rtlDoc = (meta.dir !== 'ltr');
          var left = rtlDoc
            ? (sr2.width - (meta.inkBox.start || 0) - (meta.inkBox.w || sr2.width))
            : (meta.inkBox.start || 0);
          box = { x: (sr2.left - org.left) + left,
                  y: (sr2.top - org.top) + (meta.inkBox.top || 0) };
        }
      }
      if (box) jobs.push(inkFrom(ov, box, k || 1));
    }
    var blocks = d.querySelectorAll('[data-ty="ink"]');
    var byId = {};
    if (docModel && docModel.blocks) {
      for (var q = 0; q < docModel.blocks.length; q++) {
        byId[docModel.blocks[q].id] = docModel.blocks[q];
      }
    }
    for (var i = 0; i < blocks.length; i++) {
      var bid = blocks[i].getAttribute('data-bid');
      var mb = byId[bid];
      if (!mb) continue;
      var host2 = blocks[i].querySelector('img, canvas, svg, .ne-ink') || blocks[i];
      var rr = host2.getBoundingClientRect();
      if (rr.width < 2 || rr.height < 2) continue;
      var sc = (mb.w > 0) ? (rr.width / mb.w) : 1;
      jobs.push(inkFrom(mb, { x: rr.left - org.left, y: rr.top - org.top }, sc));
    }
    if (!jobs.length) return Promise.resolve([]);
    return Promise.all(jobs).then(function (lists) {
      var all = [];
      for (var i = 0; i < lists.length; i++) {
        for (var j = 0; j < lists[i].length; j++) all.push(lists[i][j]);
      }
      return all;
    });
  }

  function encodeImages(h) {
    var imgMap = new Map(), jpegs = [], emoMap = {}, emos = [];
    IMGFAIL = 0;
    /*@3.NOPJ2.67*/
    var big = {}, q, e;
    for (q = 0; q < (h.emo || []).length; q++) {
      e = h.emo[q];
      if (!big[e.cp] || e.h > big[e.cp]) big[e.cp] = e.h;
    }
    var cps = Object.keys(big);
    for (q = 0; q < cps.length; q++) {
      var bits = emoBits(parseInt(cps[q], 10), big[cps[q]]);
      if (!bits) continue;
      var enm = 'Em' + (emos.length + 1);
      emos.push({ nm: enm, b: bits });
      emoMap[cps[q]] = enm;
    }
    for (var i = 0; i < h.imgs.length; i++) {
      var rec = h.imgs[i];
      if (imgMap.has(rec.el)) continue;
      var j = jpegOf(rec.el, Math.max(rec.w, rec.h));
      if (!j) { IMGFAIL++; continue; }
      var nm = 'Im' + (jpegs.length + 1);
      jpegs.push({ nm: nm, j: j });
      imgMap.set(rec.el, nm);
    }
    return { imgMap: imgMap, jpegs: jpegs, emoMap: emoMap, emos: emos };
  }

  function zipEmos(imgs) {
    var jobs = imgs.emos.map(function (e) {
      return Promise.all([deflate(e.b.rgb), deflate(e.b.al)]).then(function (r) {
        e.rgz = r[0]; e.alz = r[1];
      });
    });
    imgs.jpegs.forEach(function (e) {
      if (!e.j || !e.j.raw) return;
      jobs.push(deflate(e.j.data).then(function (z) { if (z) e.j.z = z; }));
    });
    return Promise.all(jobs);
  }

  var PAD1 = new Uint8Array(1);

  /*@3.NOPJ2.69*/
  function u16(d, p) { return (d[p] << 8) | d[p + 1]; }
  function i16(d, p) { var v = u16(d, p); return v > 32767 ? v - 65536 : v; }
  function u32(d, p) {
    return ((d[p] << 24) | (d[p + 1] << 16) | (d[p + 2] << 8) | d[p + 3]) >>> 0;
  }
  function put32(d, p, v) {
    d[p] = (v >>> 24) & 255; d[p + 1] = (v >>> 16) & 255;
    d[p + 2] = (v >>> 8) & 255; d[p + 3] = v & 255;
  }

  function sfntTables(d) {
    var n = u16(d, 4), out = {}, i, p, tag;
    for (i = 0; i < n; i++) {
      p = 12 + i * 16;
      tag = String.fromCharCode(d[p], d[p + 1], d[p + 2], d[p + 3]);
      out[tag] = { off: u32(d, p + 8), len: u32(d, p + 12) };
    }
    return out;
  }

  /*@3.NOPJ2.59*/
  function compClose(d, glyf, loca, gid, want, depth) {
    if (depth > 5) return;
    var a = loca[gid], b = loca[gid + 1];
    if (b - a < 10) return;
    var p = glyf + a;
    if (i16(d, p) >= 0) return;
    p += 10;
    for (;;) {
      var flags = u16(d, p), idx = u16(d, p + 2);
      p += 4;
      p += (flags & 0x0001) ? 4 : 2;
      if (flags & 0x0008) p += 2;
      else if (flags & 0x0040) p += 4;
      else if (flags & 0x0080) p += 8;
      if (!want[idx]) { want[idx] = 1; compClose(d, glyf, loca, idx, want, depth + 1); }
      if (!(flags & 0x0020)) break;
      if (p >= glyf + b) break;
    }
  }

  function subsetGlyf(d, used) {
    try {
      if (u32(d, 0) === 0x4F54544F) return d;
      var t = sfntTables(d);
      if (!t.glyf || !t.loca || !t.head || !t.maxp) return d;
      var nG = u16(d, t.maxp.off + 4);
      var longLoca = i16(d, t.head.off + 50) === 1;
      var loca = new Uint32Array(nG + 1), i;
      for (i = 0; i <= nG; i++) {
        loca[i] = longLoca ? u32(d, t.loca.off + i * 4)
                           : (u16(d, t.loca.off + i * 2) * 2);
      }
      var want = {};
      want[0] = 1;
      for (i in used) if (used.hasOwnProperty(i)) want[i | 0] = 1;
      var keys = Object.keys(want);
      for (i = 0; i < keys.length; i++) {
        compClose(d, t.glyf.off, loca, keys[i] | 0, want, 0);
      }

      var nl = new Uint32Array(nG + 1), body = [], at = 0, g, a, b, ln;
      for (g = 0; g < nG; g++) {
        nl[g] = at;
        if (!want[g]) continue;
        a = loca[g]; b = loca[g + 1];
        ln = b - a;
        if (ln <= 0) continue;
        body.push(d.subarray(t.glyf.off + a, t.glyf.off + b));
        at += ln;
        while (at & 3) { body.push(PAD1); at++; }
      }
      nl[nG] = at;
      if (at >= t.glyf.len) return d;

      var glyfNew = concat(body);
      var locaNew = new Uint8Array((nG + 1) * 4);
      for (i = 0; i <= nG; i++) put32(locaNew, i * 4, nl[i]);

      var tags = Object.keys(t).sort();
      var head = d.subarray(t.head.off, t.head.off + t.head.len).slice();
      head[50] = 0; head[51] = 1;
      put32(head, 8, 0);
      var parts = {};
      for (i = 0; i < tags.length; i++) {
        var tg = tags[i];
        if (tg === 'glyf') parts[tg] = glyfNew;
        else if (tg === 'loca') parts[tg] = locaNew;
        else if (tg === 'head') parts[tg] = head;
        else parts[tg] = d.subarray(t[tg].off, t[tg].off + t[tg].len);
      }

      var nT = tags.length;
      var dirLen = 12 + nT * 16;
      var total = dirLen, offs = {};
      for (i = 0; i < nT; i++) {
        offs[tags[i]] = total;
        total += parts[tags[i]].length;
        while (total & 3) total++;
      }
      var out = new Uint8Array(total);
      out.set(d.subarray(0, 12), 0);
      var sr = 1, es = 0;
      while (sr * 2 <= nT) { sr *= 2; es++; }
      out[4] = (nT >> 8) & 255; out[5] = nT & 255;
      var sr16 = sr * 16;
      out[6] = (sr16 >> 8) & 255; out[7] = sr16 & 255;
      out[8] = (es >> 8) & 255; out[9] = es & 255;
      var rng = nT * 16 - sr16;
      out[10] = (rng >> 8) & 255; out[11] = rng & 255;
      for (i = 0; i < nT; i++) {
        var p2 = 12 + i * 16, tg2 = tags[i], buf = parts[tg2];
        out[p2] = tg2.charCodeAt(0); out[p2 + 1] = tg2.charCodeAt(1);
        out[p2 + 2] = tg2.charCodeAt(2); out[p2 + 3] = tg2.charCodeAt(3);
        var sum = 0, q;
        for (q = 0; q + 3 < buf.length; q += 4) sum = (sum + u32(buf, q)) >>> 0;
        if (q < buf.length) {
          var tail = 0, z;
          for (z = 0; z < 4; z++) tail = ((tail << 8) | (q + z < buf.length ? buf[q + z] : 0)) >>> 0;
          sum = (sum + tail) >>> 0;
        }
        put32(out, p2 + 4, sum);
        put32(out, p2 + 8, offs[tg2]);
        put32(out, p2 + 12, buf.length);
        out.set(buf, offs[tg2]);
      }
      return out;
    } catch (e) {
      return d;
    }
  }

  function assemble(h, pages, meta, faceMap, streams, imgs) {
    var doc = new Doc(), i;
    var pagesId = doc.reserve();
    var pageIds = [];
    for (i = 0; i < pages.length; i++) pageIds.push(doc.reserve());

    var ph = h.ph || meta.pageH || 1123;
    var pw = (h.pw || meta.pageW || 794) * PT, phPt = ph * PT;

    var fontRefs = {};
    /*@3.NOPJ2.54*/
    var faceKeys = Object.keys(faceMap).filter(function (k) {
      return Object.keys(faceMap[k].used || {}).length > 0;
    });
    if (!faceKeys.length) faceKeys = Object.keys(faceMap).slice(0, 1);
    for (i = 0; i < faceKeys.length; i++) {
      var fid = faceKeys[i], f = faceMap[fid], tag = fid.replace(/[^\w]/g, '');
      /*@3.NOPJ2.68*/
      var tt = subsetGlyf(f.ttf, f.used);
      var ff = doc.add(concat([
        bytes('<< /Length ' + tt.length + ' /Length1 ' + tt.length + ' >>\nstream\n'),
        tt, bytes('\nendstream')
      ]));
      var fd = doc.add('<< /Type /FontDescriptor /FontName /GRDN+' + tag +
        ' /Flags 4 /FontBBox [' + f.bbox.join(' ') + '] /ItalicAngle 0 /Ascent ' + f.ascent +
        ' /Descent ' + f.descent + ' /CapHeight 700 /StemV 80 /FontFile2 ' + ff + ' 0 R >>');
      var used = Object.keys(f.used).map(Number).sort(function (a, b) { return a - b; });
      var w = [], bf = [];
      for (var u = 0; u < used.length; u++) {
        var g = used[u];
        w.push(g + ' [' + f.adv1(g) + ']');
        var cps = f.used[g] || [];
        var hexU = '';
        for (var z = 0; z < cps.length; z++) hexU += hx(cps[z]);
        bf.push('<' + hx(g) + '> <' + (hexU || hx(0x20)) + '>');
      }
      var tou = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n' +
        '/CMapName /GRDN def /CMapType 2 def\n' +
        '1 begincodespacerange <0000> <FFFF> endcodespacerange\n' +
        (bf.length ? (bf.length + ' beginbfchar\n' + bf.join('\n') + '\nendbfchar\n') : '') +
        'endcmap CMapName currentdict /CMap defineresource pop end end';
      var tu = doc.add('<< /Length ' + tou.length + ' >>\nstream\n' + tou + '\nendstream');
      var cid = doc.add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /GRDN+' + tag +
        ' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>' +
        ' /FontDescriptor ' + fd + ' 0 R /DW 500 /W [' + w.join(' ') + ']' +
        ' /CIDToGIDMap /Identity >>');
      fontRefs['F_' + tag] = doc.add('<< /Type /Font /Subtype /Type0 /BaseFont /GRDN+' + tag +
        ' /Encoding /Identity-H /DescendantFonts [' + cid + ' 0 R] /ToUnicode ' + tu + ' 0 R >>');
    }

    var imgRefs = {};
    for (i = 0; i < imgs.jpegs.length; i++) {
      var e = imgs.jpegs[i];
      var buf = e.j.raw ? (e.j.z || e.j.data) : e.j.data;
      var filt = e.j.raw ? (e.j.z ? ' /Filter /FlateDecode' : '') : ' /Filter /DCTDecode';
      imgRefs[e.nm] = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + e.j.w + ' /Height ' + e.j.h +
              ' /ColorSpace /DeviceRGB /BitsPerComponent 8' + filt + ' /Length ' +
              buf.length + ' >>\nstream\n'),
        buf, bytes('\nendstream')
      ]));
    }

    /*@3.NOPJ2.58*/
    for (i = 0; i < imgs.emos.length; i++) {
      var eo = imgs.emos[i], eb = eo.b;
      var alBuf = eo.alz || eb.al, rgBuf = eo.rgz || eb.rgb;
      var alF = eo.alz ? ' /Filter /FlateDecode' : '';
      var rgF = eo.rgz ? ' /Filter /FlateDecode' : '';
      var smId = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + eb.w + ' /Height ' + eb.h +
              ' /ColorSpace /DeviceGray /BitsPerComponent 8' + alF +
              ' /Length ' + alBuf.length + ' >>\nstream\n'),
        alBuf, bytes('\nendstream')
      ]));
      imgRefs[eo.nm] = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + eb.w + ' /Height ' + eb.h +
              ' /ColorSpace /DeviceRGB /BitsPerComponent 8' + rgF +
              ' /SMask ' + smId + ' 0 R /Length ' + rgBuf.length + ' >>\nstream\n'),
        rgBuf, bytes('\nendstream')
      ]));
    }

    var nAll = h.nAll || pages.length;
    var oiMap = h.oiMap || null;
    var destOf = {}, dk = Object.keys(h.dests);
    for (i = 0; i < dk.length; i++) {
      var dd = h.dests[dk[i]];
      var pi = Math.max(0, Math.min(nAll - 1, Math.floor(dd.y / ph)));
      destOf[dk[i]] = { p: pi, y: phPt - (dd.y - pi * ph) * PT };
    }

    var resFont = Object.keys(fontRefs).map(function (n) {
      return '/' + n + ' ' + fontRefs[n] + ' 0 R';
    }).join(' ');
    var resImg = Object.keys(imgRefs).map(function (n) {
      return '/' + n + ' ' + imgRefs[n] + ' 0 R';
    }).join(' ');
    var gsRefs = [];
    var alphas = alphasIn(pages);
    for (i = 0; i < alphas.length; i++) {
      var av = parseInt(alphas[i], 10) / 100;
      gsRefs.push('/GA' + alphas[i] + ' ' +
        doc.add('<< /Type /ExtGState /ca ' + num(av) + ' /CA ' + num(av) + ' >>') + ' 0 R');
    }
    var res = '<< /Font << ' + resFont + ' >>' +
      (resImg ? (' /XObject << ' + resImg + ' >>') : '') +
      ' /ExtGState << ' + gsRefs.join(' ') + ' >> >>';

    return Promise.all(streams.map(function (str) {
      var raw = bytes(str);
      return deflate(raw).then(function (z) { return z ? { d: z, f: true } : { d: raw, f: false }; });
    })).then(function (packed) {
      for (var p = 0; p < pages.length; p++) {
        var cs = doc.add(concat([
          bytes('<< /Length ' + packed[p].d.length +
                (packed[p].f ? ' /Filter /FlateDecode' : '') + ' >>\nstream\n'),
          packed[p].d, bytes('\nendstream')
        ]));
        var an = [], pl = pages[p].links;
        for (var k = 0; k < pl.length; k++) {
          var lk = pl[k];
          var y0 = phPt - (lk.y - pages[p].top + lk.h) * PT;
          if (y0 < -40 || y0 > phPt + 40) continue;
          var rect = '[' + num(lk.x * PT) + ' ' + num(y0) + ' ' +
                     num((lk.x + lk.w) * PT) + ' ' + num(y0 + lk.h * PT) + ']';
          if (lk.kind === 'uri') {
            an.push(doc.add('<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ' + rect +
              ' /A << /S /URI /URI ' + pdfStr(lk.uri) + ' >> >>'));
          } else {
            var t = destOf[lk.to];
            if (!t) continue;
            /*@3.NOPJ2.71*/
            var tp = oiMap ? oiMap[t.p] : t.p;
            if (tp == null) continue;
            an.push(doc.add('<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ' + rect +
              ' /Dest [' + pageIds[tp] + ' 0 R /XYZ 0 ' + num(t.y) + ' null] >>'));
          }
        }
        /*@3.NOPJ2.44*/
        doc.set(pageIds[p], '<< /Type /Page /Parent ' + pagesId +
          ' 0 R /Contents ' + cs + ' 0 R' +
          (an.length ? (' /Annots [' + an.map(function (x) { return x + ' 0 R'; }).join(' ') + ']') : '') +
          ' >>');
      }
      doc.set(pagesId, '<< /Type /Pages /Count ' + pages.length +
        ' /MediaBox [0 0 ' + num(pw) + ' ' + num(phPt) + '] /Resources ' + res +
        ' /Kids [' +
        pageIds.map(function (x) { return x + ' 0 R'; }).join(' ') + '] >>');

      var outlineId = 0;
      var marks = h.marks.slice().sort(function (a, b) { return a.y - b.y; });
      /*@3.NOPJ2.72*/
      marks = marks.filter(function (mk) {
        var pi2 = Math.max(0, Math.min(nAll - 1, Math.floor(mk.y / ph)));
        return !oiMap || oiMap[pi2] != null;
      });
      if (marks.length) {
        outlineId = doc.reserve();
        var itemIds = marks.map(function () { return doc.reserve(); });
        for (var mi = 0; mi < marks.length; mi++) {
          var mk = marks[mi];
          var pAbs = Math.max(0, Math.min(nAll - 1, Math.floor(mk.y / ph)));
          var pIdx = oiMap ? oiMap[pAbs] : pAbs;
          var my = phPt - (mk.y - pAbs * ph) * PT;
          doc.set(itemIds[mi], '<< /Title ' + utf16be(mk.t) + ' /Parent ' + outlineId + ' 0 R' +
            (mi > 0 ? (' /Prev ' + itemIds[mi - 1] + ' 0 R') : '') +
            (mi < marks.length - 1 ? (' /Next ' + itemIds[mi + 1] + ' 0 R') : '') +
            ' /Dest [' + pageIds[pIdx] + ' 0 R /XYZ 0 ' + num(my) + ' null] >>');
        }
        doc.set(outlineId, '<< /Type /Outlines /First ' + itemIds[0] + ' 0 R /Last ' +
          itemIds[itemIds.length - 1] + ' 0 R /Count ' + marks.length + ' >>');
      }

      var info = doc.add('<< /Title ' + utf16be(String(meta.title || 'Note')) +
        ' /Producer ' + pdfStr('Byte Notes') + ' >>');
      var cat = doc.add('<< /Type /Catalog /Pages ' + pagesId + ' 0 R' +
        (outlineId ? (' /Outlines ' + outlineId + ' 0 R /PageMode /UseOutlines') : '') +
        ' /Lang ' + pdfStr(meta.dir === 'rtl' ? 'ar' : 'en') + ' >>');
      return doc.build(cat, info);
    });
  }

  function build(meta, docModel) {
    var mounted = null, t0 = Date.now();
    MISSING = {}; IMGFAIL = 0; IMGSKIP = 0;
    COLC = {};
    return loadIndex().then(function () {
      return mount(meta);
    }).then(function (m) {
      mounted = m;
      var h = harvest(m.doc, meta);
      /*@3.NOPJ2.70*/
      var all = paginate(h, meta);
      var ph = h.ph || meta.pageH || 1123;
      return inkLayers(m.doc, meta, docModel, h.org).then(function (inks) {
      /*@3.NOPJ2.81*/
      var farInk = 0, gq;
      for (gq = 0; gq < inks.length; gq++) {
        if ((inks[gq].y1 || 0) > farInk) farInk = inks[gq].y1;
      }
      var wantN = Math.min(400, Math.ceil(farInk / ph - 0.02));
      while (all.length < wantN) {
        all.push({ top: all.length * ph, oi: all.length, runs: [], boxes: [], imgs: [],
                   inks: [], links: [], emo: [] });
      }
      trimBlank(all, inks, meta);
      h.nAll = all.length;
      var pages = sliceRange(all, meta.range);
      h.oiMap = {};
      for (var oq = 0; oq < pages.length; oq++) h.oiMap[pages[oq].oi] = oq;
      for (var ii = 0; ii < inks.length; ii++) {
        var yTop = inks[ii].y0, yBot = inks[ii].y1, q;
        var a = Math.max(0, Math.floor(yTop / ph));
        var b = Math.min(h.nAll - 1, Math.floor(yBot / ph));
        for (q = a; q <= b; q++) {
          var np = h.oiMap[q];
          if (np != null) pages[np].inks.push(inks[ii]);
        }
      }

      var need = {};
      for (var i = 0; i < h.runs.length; i++) need[h.runs[i].face] = 1;
      need[FALLBACK.a] = 1; need[FALLBACK.b] = 1;
      var symIds = symNeed(h.runs);
      for (var sI = 0; sI < symIds.length; sI++) need[symIds[sI]] = 1;
      if (symfaIn(h.runs)) need[SYMFACE] = 1;
      var ids = Object.keys(need);
      if (!ids.length) ids = [FALLBACK.a];
      return Promise.all(ids.map(loadFace)).then(function (list) {
        var faceMap = {};
        for (var k = 0; k < ids.length; k++) { list[k].used = {}; faceMap[ids[k]] = list[k]; }
        var imgs = encodeImages(h);
        return zipEmos(imgs).then(function () {
        var phPt = ph * PT;
        var streams = [];
        for (var p = 0; p < pages.length; p++) {
          streams.push(pageContent(pages[p], faceMap, imgs, pages[p].top, ph, phPt));
        }
        return assemble(h, pages, meta, faceMap, streams, imgs).then(function (u8) {
          return { bytes: u8, pages: pages.length, ms: Date.now() - t0,
                   runs: h.runs.length, marks: h.marks.length, docH: Math.round(h.height),
                   missing: MISSING, imgFail: IMGFAIL + IMGSKIP,
                   dbg: (function () {
                     var mr = 0, mb = 0, q;
                     for (q = 0; q < h.runs.length; q++) if (h.runs[q].yBase > mr) mr = h.runs[q].yBase;
                     for (q = 0; q < h.boxes.length; q++) if (h.boxes[q].y + h.boxes[q].h > mb) mb = h.boxes[q].y + h.boxes[q].h;
                     var fset = {};
                     for (q = 0; q < h.runs.length; q++) fset[h.runs[q].face] = (fset[h.runs[q].face] || 0) + 1;
                     var fams = {};
                     for (q = 0; q < h.runs.length; q++) fams[h.runs[q].famDbg || '?'] = 1;
                     return { maxRun: Math.round(mr), maxBox: Math.round(mb), ph: h.ph, pw: h.pw,
                              pages: h.pages, idx: FIDX ? FIDX.length : -1, faces: fset,
                              fams: Object.keys(fams) };
                   }()) };
        });
        });
      });
      });
    })['finally'](function () {
      if (mounted && mounted.ifr && mounted.ifr.parentNode) mounted.ifr.remove();
    });
  }

  function save(meta, docModel) {
    return build(meta, docModel).then(function (r) {
      var blob = new Blob([r.bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var name = String(meta.title || L('ملاحظة', 'Note'))
        .replace(/[\\/:*?"<>|]/g, '-').slice(0, 60).trim() || 'note';
      var rg = meta.range ? ('-p' + meta.range.from + '-' + meta.range.to) : '';
      a.href = url; a.download = name + rg + '.pdf';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
      return { size: r.bytes.length, pages: r.pages, ms: r.ms };
    });
  }

  /*@3.NOPJ2.16*/
  function visual(text, dir) {
    var cl = orderClusters(shape(text), dir === 'rtl'), i;
    var out = [];
    for (i = 0; i < cl.length; i++) {
      for (var k = 0; k < cl[i].length; k++) out.push(cl[i][k].g);
    }
    return out;
  }

  window.GardenNotesPdf = { build: build, save: save, shape: shape, loadFace: loadFace,
                            visual: visual, ops: textOps, classOf: classOf,
                            faceIdFor: faceIdFor, loadIndex: loadIndex,
                            _diag: { mount: mount, harvest: harvest, geom: geomOf } };
})();
