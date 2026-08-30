/*@3.QRJ.1*/
;(function (root) {
  'use strict';

  /*@3.QRJ.2*/
  var VER = {
    1:  [26,  10, 1, 16, 0, 0],
    2:  [44,  16, 1, 28, 0, 0],
    3:  [70,  26, 1, 44, 0, 0],
    4:  [100, 18, 2, 32, 0, 0],
    5:  [134, 24, 2, 43, 0, 0],
    6:  [172, 16, 4, 27, 0, 0],
    7:  [196, 18, 4, 31, 0, 0],
    8:  [242, 22, 2, 38, 2, 39],
    9:  [292, 22, 3, 36, 2, 37],
    10: [346, 26, 4, 43, 1, 44],
  };
  /*@3.QRJ.3*/
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };

  /*@3.QRJ.4*/
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /*@3.QRJ.5*/
  function genPoly(n) {
    var p = [1];
    for (var i = 0; i < n; i++) {
      var q = new Array(p.length + 1).fill(0);
      /*@3.QRJ.6*/
      for (var j = 0; j < p.length; j++) {
        q[j] ^= p[j];
        q[j + 1] ^= gmul(p[j], EXP[i]);
      }
      p = q;
    }
    return p;
  }

  /*@3.QRJ.7*/
  function ecc(data, n) {
    var g = genPoly(n);
    var r = new Array(data.length + n).fill(0);
    for (var i = 0; i < data.length; i++) r[i] = data[i];
    for (var k = 0; k < data.length; k++) {
      var f = r[k];
      if (!f) continue;
      for (var j = 0; j < g.length; j++) r[k + j] ^= gmul(g[j], f);
    }
    return r.slice(data.length);
  }

  /*@3.QRJ.8*/
  function encodeData(bytes, version) {
    var v = VER[version];
    var eccLen = v[1], g1 = v[2], d1 = v[3], g2 = v[4], d2 = v[5];
    var totalData = g1 * d1 + g2 * d2;

    /*@3.QRJ.9*/
    var bits = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(4, 4);
    push(bytes.length, version < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    /*@3.QRJ.10*/
    var cap = totalData * 8;
    for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);

    var words = [];
    for (var b = 0; b < bits.length; b += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | bits[b + k];
      words.push(byte);
    }
    /*@3.QRJ.11*/
    var pad = [0xec, 0x11], pi = 0;
    while (words.length < totalData) words.push(pad[pi++ % 2]);

    /*@3.QRJ.12*/
    var blocks = [], eccs = [], p = 0;
    function take(count, size) {
      for (var i = 0; i < count; i++) {
        var d = words.slice(p, p + size); p += size;
        blocks.push(d); eccs.push(ecc(d, eccLen));
      }
    }
    take(g1, d1); take(g2, d2);

    var out = [], maxD = Math.max(d1, d2 || 0);
    for (var c = 0; c < maxD; c++) {
      for (var bI = 0; bI < blocks.length; bI++) if (c < blocks[bI].length) out.push(blocks[bI][c]);
    }
    for (var e = 0; e < eccLen; e++) {
      for (var bJ = 0; bJ < eccs.length; bJ++) out.push(eccs[bJ][e]);
    }
    return out;
  }

  /*@3.QRJ.13*/
  function newMatrix(size) {
    var m = [], r;
    for (r = 0; r < size; r++) m.push(new Int8Array(size).fill(-1));  /*@3.QRJ.14*/
    return m;
  }
  function placeFinder(m, r, c) {
    for (var i = -1; i <= 7; i++) {
      for (var j = -1; j <= 7; j++) {
        var y = r + i, x = c + j;
        if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
        var on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                 (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                 (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        m[y][x] = on ? 1 : 0;
      }
    }
  }
  function placeAlign(m, version) {
    var pos = ALIGN[version], n = m.length;
    for (var a = 0; a < pos.length; a++) {
      for (var b = 0; b < pos.length; b++) {
        var r = pos[a], c = pos[b];
        /*@3.QRJ.15*/
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8)) continue;
        for (var i = -2; i <= 2; i++) {
          for (var j = -2; j <= 2; j++) {
            m[r + i][c + j] = (Math.max(Math.abs(i), Math.abs(j)) !== 1) ? 1 : 0;
          }
        }
      }
    }
  }
  /*@3.QRJ.16*/
  function reservedMap(n, version) {
    var g = [], r, c;
    for (r = 0; r < n; r++) g.push(new Uint8Array(n));
    function box(r0, c0, h, w) {
      for (var i = 0; i < h; i++) for (var j = 0; j < w; j++) {
        var y = r0 + i, x = c0 + j;
        if (y >= 0 && x >= 0 && y < n && x < n) g[y][x] = 1;
      }
    }
    box(0, 0, 9, 9); box(0, n - 8, 9, 8); box(n - 8, 0, 8, 9);   /*@3.QRJ.17*/
    for (c = 0; c < n; c++) { g[6][c] = 1; g[c][6] = 1; }        /*@3.QRJ.18*/
    var pos = ALIGN[version];
    for (var a = 0; a < pos.length; a++) for (var b = 0; b < pos.length; b++) {
      var ar = pos[a], ac = pos[b];
      if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= n - 9) || (ar >= n - 9 && ac <= 8)) continue;
      box(ar - 2, ac - 2, 5, 5);
    }
    if (version >= 7) { box(0, n - 11, 6, 3); box(n - 11, 0, 3, 6); }
    return g;
  }

  var MASKS = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r) { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
    function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
    function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; },
  ];

  /*@3.QRJ.19*/
  function formatBits(mask) {
    var data = (0 << 3) | mask;                  /*@3.QRJ.20*/
    var v = data << 10;
    for (var i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= 0x537 << (i - 10);
    return ((data << 10) | v) ^ 0x5412;
  }
  function versionBits(version) {
    var v = version << 12;
    for (var i = 17; i >= 12; i--) if ((v >> i) & 1) v ^= 0x1f25 << (i - 12);
    return (version << 12) | v;
  }

  function penalty(m) {
    var n = m.length, score = 0, r, c, i;
    /*@3.QRJ.21*/
    for (var dir = 0; dir < 2; dir++) {
      for (r = 0; r < n; r++) {
        var run = 1, prev = -1;
        for (c = 0; c < n; c++) {
          var val = dir ? m[c][r] : m[r][c];
          if (val === prev) { run++; if (run === 5) score += 3; else if (run > 5) score += 1; }
          else { run = 1; prev = val; }
        }
      }
    }
    /*@3.QRJ.22*/
    for (r = 0; r < n - 1; r++) {
      for (c = 0; c < n - 1; c++) {
        var a = m[r][c];
        if (a === m[r][c + 1] && a === m[r + 1][c] && a === m[r + 1][c + 1]) score += 3;
      }
    }
    /*@3.QRJ.23*/
    var P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function look(get) {
      for (var s = 0; s + 11 <= n; s++) {
        var ok1 = true, ok2 = true;
        for (i = 0; i < 11; i++) {
          if (get(s + i) !== P1[i]) ok1 = false;
          if (get(s + i) !== P2[i]) ok2 = false;
        }
        if (ok1 || ok2) score += 40;
      }
    }
    for (r = 0; r < n; r++) look((function (rr) { return function (k) { return m[rr][k]; }; })(r));
    for (c = 0; c < n; c++) look((function (cc) { return function (k) { return m[k][cc]; }; })(c));
    /*@3.QRJ.24*/
    var dark = 0;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
    return score;
  }

  function build(text, opts) {
    opts = opts || {};
    var bytes = [];
    /*@3.QRJ.25*/
    var enc = new TextEncoder().encode(String(text));
    for (var i = 0; i < enc.length; i++) bytes.push(enc[i]);

    var version = opts.version || 0;
    if (!version) {
      for (var v = 1; v <= 10; v++) {
        var t = VER[v];
        var capBytes = (t[2] * t[3] + t[4] * t[5]) - (v < 10 ? 2 : 3);
        if (bytes.length <= capBytes) { version = v; break; }
      }
      if (!version) throw new Error('qr: النصّ أطولُ من النسخة ١٠');
    }

    var words = encodeData(bytes, version);
    var n = version * 4 + 17;
    var m = newMatrix(n);

    placeFinder(m, 0, 0); placeFinder(m, 0, n - 7); placeFinder(m, n - 7, 0);
    placeAlign(m, version);
    for (var k = 8; k < n - 8; k++) { m[6][k] = k % 2 ? 0 : 1; m[k][6] = k % 2 ? 0 : 1; }
    m[n - 8][8] = 1;                                   /*@3.QRJ.26*/

    /*@3.QRJ.27*/
    var bitStr = [];
    for (var w = 0; w < words.length; w++) for (var b = 7; b >= 0; b--) bitStr.push((words[w] >> b) & 1);
    var RES = reservedMap(n, version);
    var bi = 0, up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;                            /*@3.QRJ.28*/
      for (var t2 = 0; t2 < n; t2++) {
        var row = up ? n - 1 - t2 : t2;
        for (var d = 0; d < 2; d++) {
          var cc2 = col - d;
          if (RES[row][cc2]) continue;
          m[row][cc2] = bi < bitStr.length ? bitStr[bi++] : 0;
        }
      }
      up = !up;
    }

    /*@3.QRJ.29*/
    var best = null, bestScore = Infinity, bestMask = 0;
    for (var mask = 0; mask < 8; mask++) {
      var cand = m.map(function (row) { return Int8Array.from(row); });
      for (var r2 = 0; r2 < n; r2++) {
        for (var c2 = 0; c2 < n; c2++) {
          if (RES[r2][c2]) continue;
          if (MASKS[mask](r2, c2)) cand[r2][c2] ^= 1;
        }
      }
      applyFormat(cand, n, mask, version);
      var sc = penalty(cand);
      if (sc < bestScore) { bestScore = sc; best = cand; bestMask = mask; }
    }
    return { modules: best, size: n, version: version, mask: bestMask };
  }

  /*@3.QRJ.30*/
  function applyFormat(m, n, mask, version) {
    var f = formatBits(mask), i;
    var bit = function (k) { return (f >> (14 - k)) & 1; };   /*@3.QRJ.31*/

    /*@3.QRJ.32*/
    for (i = 0; i <= 5; i++) m[8][i] = bit(i);
    m[8][7] = bit(6);
    m[8][8] = bit(7);
    m[7][8] = bit(8);
    for (i = 0; i <= 5; i++) m[5 - i][8] = bit(9 + i);

    /*@3.QRJ.33*/
    for (i = 0; i <= 6; i++) m[n - 1 - i][8] = bit(i);
    for (i = 0; i <= 7; i++) m[8][n - 8 + i] = bit(7 + i);
    m[n - 8][8] = 1;

    if (version >= 7) {
      var vb = versionBits(version);
      for (i = 0; i < 18; i++) {
        var b = (vb >> i) & 1, r = Math.floor(i / 3), c = i % 3;
        m[r][n - 11 + c] = b; m[n - 11 + c][r] = b;
      }
    }
  }


  /*@3.QRJ.34*/
  function _esc(v) {
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /*@3.QRJ.35*/
  function svg(text, opts) {
    opts = opts || {};
    var q = build(text, opts);
    var quiet = opts.quiet == null ? 4 : opts.quiet;      /*@3.QRJ.36*/
    var total = q.size + quiet * 2;
    var dark = opts.dark || '#111827', light = opts.light || '#ffffff';
    var d = '';
    for (var r = 0; r < q.size; r++) {
      for (var c = 0; c < q.size; c++) {
        if (q.modules[r][c]) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total +
      '" shape-rendering="crispEdges" role="img" aria-label="' +
      _esc(opts.label || 'رمز اقتران') + '">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
      '<path d="' + d + '" fill="' + dark + '"/></svg>';
  }

  root.GardenQR = { build: build, svg: svg, _ecc: ecc, _encodeData: encodeData,
                    _gmul: gmul, _reserved: reservedMap, _masks: MASKS, _ver: VER };
})(typeof window !== 'undefined' ? window : globalThis);
