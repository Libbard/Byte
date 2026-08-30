'use strict';

var K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function Sha() {
  this.h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  this.buf = new Uint8Array(64);
  this.len = 0;
  this.total = 0;
  this.w = new Int32Array(64);
}

Sha.prototype.block = function (b, off) {
  var w = this.w, i, t1, t2, s0, s1, ch, maj;
  for (i = 0; i < 16; i++) {
    w[i] = (b[off + i * 4] << 24) | (b[off + i * 4 + 1] << 16) |
           (b[off + i * 4 + 2] << 8) | b[off + i * 4 + 3];
  }
  for (i = 16; i < 64; i++) {
    var x = w[i - 15], y = w[i - 2];
    s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
    s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
    w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
  }
  var a = this.h[0], bb = this.h[1], c = this.h[2], d = this.h[3];
  var e = this.h[4], f = this.h[5], g = this.h[6], hh = this.h[7];
  for (i = 0; i < 64; i++) {
    s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    ch = (e & f) ^ (~e & g);
    t1 = (hh + s1 + ch + K[i] + w[i]) | 0;
    s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    maj = (a & bb) ^ (a & c) ^ (bb & c);
    t2 = (s0 + maj) | 0;
    hh = g; g = f; f = e; e = (d + t1) | 0;
    d = c; c = bb; bb = a; a = (t1 + t2) | 0;
  }
  this.h[0] = (this.h[0] + a) | 0; this.h[1] = (this.h[1] + bb) | 0;
  this.h[2] = (this.h[2] + c) | 0; this.h[3] = (this.h[3] + d) | 0;
  this.h[4] = (this.h[4] + e) | 0; this.h[5] = (this.h[5] + f) | 0;
  this.h[6] = (this.h[6] + g) | 0; this.h[7] = (this.h[7] + hh) | 0;
};

Sha.prototype.push = function (chunk) {
  var i = 0, n = chunk.length;
  this.total += n;
  if (this.len) {
    while (this.len < 64 && i < n) this.buf[this.len++] = chunk[i++];
    if (this.len === 64) { this.block(this.buf, 0); this.len = 0; }
  }
  while (i + 64 <= n) { this.block(chunk, i); i += 64; }
  while (i < n) this.buf[this.len++] = chunk[i++];
};

Sha.prototype.hex = function () {
  var bits = this.total * 8;
  var pad = new Uint8Array(this.len < 56 ? 64 : 128);
  pad.set(this.buf.subarray(0, this.len));
  pad[this.len] = 0x80;
  var hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
  var p = pad.length;
  pad[p - 8] = (hi >>> 24) & 255; pad[p - 7] = (hi >>> 16) & 255;
  pad[p - 6] = (hi >>> 8) & 255;  pad[p - 5] = hi & 255;
  pad[p - 4] = (lo >>> 24) & 255; pad[p - 3] = (lo >>> 16) & 255;
  pad[p - 2] = (lo >>> 8) & 255;  pad[p - 1] = lo & 255;
  for (var o = 0; o < pad.length; o += 64) this.block(pad, o);
  var out = '';
  for (var i = 0; i < 8; i++) out += ('00000000' + (this.h[i] >>> 0).toString(16)).slice(-8);
  return out;
};

self.onmessage = function (e) {
  var d = e.data || {};
  var id = d.id;
  var blob = d.blob;
  if (!blob || !blob.stream) { self.postMessage({ id: id, err: 'no-blob' }); return; }
  var sha = new Sha();
  var total = blob.size || 0;
  var done = 0, sent = 0;
  var rd = blob.stream().getReader();
  var t0 = Date.now();
  function step() {
    rd.read().then(function (r) {
      if (r.done) {
        self.postMessage({ id: id, hash: sha.hex(), size: total, ms: Date.now() - t0 });
        return;
      }
      sha.push(r.value);
      done += r.value.length;
      if (total && done - sent > total / 20) {
        sent = done;
        self.postMessage({ id: id, at: done, of: total });
      }
      step();
    }).catch(function (x) {
      self.postMessage({ id: id, err: String((x && x.message) || x) });
    });
  }
  step();
};
