;(function () {
  'use strict';

  var DIR = 'pdf';
  var IDX = 'pdfCache';
  var DB = 'byte-pdf';
  var BIN = 'bin';
  var _root = null;
  var _db = null;
  var _tier = null;
  var _wk = null;
  var _seq = 0;
  var _jobs = {};
  var _mem = {};

  function base() {
    var probe = document.querySelector('script[src*="notes-pdfdoc.js"]') ||
                document.querySelector('script[src*="notes-app.js"]');
    var src = probe ? (probe.getAttribute('src') || '') : '';
    return { dir: src.replace(/notes-[a-z]+\.js.*$/, ''), v: src.split('?')[1] || '' };
  }

  function worker() {
    if (_wk !== null) return _wk;
    try {
      var b = base();
      _wk = new Worker(b.dir + 'notes-pdfhash.worker.js' + (b.v ? '?' + b.v : ''));
      _wk.onmessage = function (e) {
        var d = e.data || {};
        var j = _jobs[d.id];
        if (!j) return;
        if (d.at != null) { if (j.on) j.on(d.at, d.of); return; }
        delete _jobs[d.id];
        if (d.err) j.no(new Error(d.err));
        else j.ok({ hash: d.hash, size: d.size, ms: d.ms });
      };
      _wk.onerror = function () { _wk = false; };
    } catch (e) { _wk = false; }
    return _wk;
  }

  function hash(blob, onProgress) {
    var w = worker();
    if (!w) return hashHere(blob, onProgress);
    return new Promise(function (ok, no) {
      var id = ++_seq;
      _jobs[id] = { ok: ok, no: no, on: onProgress };
      try { w.postMessage({ id: id, blob: blob }); }
      catch (e) { delete _jobs[id]; hashHere(blob, onProgress).then(ok, no); }
    });
  }

  /*@3.NOPJ4.1*/
  function hashHere(blob, onProgress) {
    if (!self.crypto || !self.crypto.subtle) return Promise.reject(new Error('no-crypto'));
    return blob.arrayBuffer().then(function (buf) {
      var t0 = Date.now();
      return self.crypto.subtle.digest('SHA-256', buf).then(function (d) {
        var v = new Uint8Array(d), s = '';
        for (var i = 0; i < v.length; i++) s += ('0' + v[i].toString(16)).slice(-2);
        if (onProgress) onProgress(blob.size, blob.size);
        return { hash: s, size: blob.size, ms: Date.now() - t0 };
      });
    });
  }

  function opfsRoot() {
    if (_root) return _root;
    _root = (navigator.storage && navigator.storage.getDirectory)
      ? navigator.storage.getDirectory().then(function (d) {
          return d.getDirectoryHandle(DIR, { create: true });
        })
      : Promise.reject(new Error('no-opfs'));
    _root.catch(function () { _root = null; });
    return _root;
  }

  function idb() {
    if (_db) return _db;
    _db = new Promise(function (ok, no) {
      if (!window.indexedDB) { no(new Error('no-idb')); return; }
      var rq;
      try { rq = indexedDB.open(DB, 1); } catch (e) { no(e); return; }
      rq.onupgradeneeded = function () {
        try { rq.result.createObjectStore(BIN); } catch (e2) {}
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
        try { tx = db.transaction(BIN, mode); } catch (e) { no(e); return; }
        var out = null;
        tx.oncomplete = function () { ok(out); };
        tx.onerror = function () { no(tx.error || new Error('idb-tx')); };
        tx.onabort = function () { no(tx.error || new Error('idb-abort')); };
        try { run(tx.objectStore(BIN), function (v) { out = v; }); }
        catch (e2) { try { tx.abort(); } catch (e3) {} no(e2); }
      });
    });
  }

  /*@3.NOPJ4.6*/
  function tier() {
    if (_tier) return _tier;
    _tier = opfsRoot().then(function (d) {
      var probe = '.probe';
      return d.getFileHandle(probe, { create: true }).then(function (fh) {
        if (!fh.createWritable) throw new Error('no-writable');
        return fh.createWritable().then(function (w) {
          return w.write(new Blob([new Uint8Array([1])])).then(function () { return w.close(); });
        }).then(function () {
          return d.removeEntry(probe).catch(function () { return null; });
        });
      }).then(function () { return 'opfs'; });
    }).catch(function () {
      return idb().then(function () { return 'idb'; }).catch(function () { return 'none'; });
    });
    return _tier;
  }

  function why() {
    if (!window.isSecureContext) return 'insecure';
    if (!(navigator.storage && navigator.storage.getDirectory)) return 'no-opfs';
    return 'blocked';
  }

  function available() {
    return tier().then(function (t) {
      return { ok: t !== 'none', tier: t, why: t === 'none' ? why() : '' };
    });
  }

  function S() { return window.GardenNotesStore || null; }

  function index() {
    var s = S();
    if (!s) return Promise.resolve(_mem);
    return s.meta(IDX, null).then(function (v) {
      if (v && typeof v === 'object') { _mem = v; return v; }
      return _mem;
    }).catch(function () { return _mem; });
  }

  function saveIndex(o) {
    _mem = o;
    var s = S();
    if (!s) return Promise.resolve(false);
    return s.setMeta(IDX, o).catch(function () { return false; });
  }

  function name(h) { return h + '.pdf'; }

  function writeBytes(h, blob) {
    return tier().then(function (t) {
      if (t === 'opfs') {
        return opfsRoot().then(function (d) {
          return d.getFileHandle(name(h), { create: true });
        }).then(function (fh) {
          return fh.createWritable();
        }).then(function (w) {
          return w.write(blob).then(function () { return w.close(); });
        }).then(function () { return 'opfs'; });
      }
      if (t === 'idb') {
        return idbDo('readwrite', function (st) { st.put(blob, h); }).then(function () { return 'idb'; });
      }
      throw new Error('no-store');
    });
  }

  function readBytes(h, where) {
    if (where === 'idb') {
      return idbDo('readonly', function (st, set) {
        var rq = st.get(h);
        rq.onsuccess = function () { set(rq.result || null); };
      });
    }
    return opfsRoot().then(function (d) {
      return d.getFileHandle(name(h), { create: false });
    }).then(function (fh) { return fh.getFile(); });
  }

  /*@3.NOPJ4.2*/
  /*@3.NOPJ4.7*/
  function put(h, blob, extra) {
    return writeBytes(h, blob).then(function (t) {
      return index().then(function (o) {
        o[h] = { size: blob.size, at: Date.now(), n: (extra && extra.name) || '', w: t };
        return saveIndex(o);
      }).then(function () { return true; });
    }).catch(function () { return false; });
  }

  function get(h) {
    return index().then(function (o) {
      var row = o[h];
      if (!row) return null;
      return readBytes(h, row.w).catch(function () {
        return readBytes(h, row.w === 'idb' ? 'opfs' : 'idb').catch(function () { return null; });
      });
    });
  }

  function has(h) {
    return index().then(function (o) { return !!o[h]; });
  }

  function list() {
    return index().then(function (o) {
      var out = [];
      for (var k in o) out.push({ hash: k, size: o[k].size || 0, at: o[k].at || 0, name: o[k].n || '' });
      out.sort(function (a, b) { return b.at - a.at; });
      return out;
    });
  }

  function drop(h) {
    return opfsRoot().then(function (d) { return d.removeEntry(name(h)); })
      .catch(function () { return null; })
      .then(function () {
        return idbDo('readwrite', function (st) { st['delete'](h); }).catch(function () { return null; });
      })
      .then(function () {
        return index().then(function (o) { delete o[h]; return saveIndex(o); });
      }).then(function () { return true; });
  }

  /*@3.NOPJ4.3*/
  function adopt(file, onProgress) {
    return hash(file, onProgress).then(function (r) {
      return has(r.hash).then(function (had) {
        if (had) return { hash: r.hash, size: r.size, ms: r.ms, cached: true, fresh: false };
        return put(r.hash, file, { name: file.name || '' }).then(function (okd) {
          return available().then(function (a) {
            return { hash: r.hash, size: r.size, ms: r.ms, cached: okd, fresh: true,
                     tier: a.tier, why: okd ? '' : (a.why || 'blocked') };
          });
        });
      });
    });
  }

  /*@3.NOPJ4.4*/
  function match(expect, file, onProgress) {
    return hash(file, onProgress).then(function (r) {
      return { hash: r.hash, size: r.size, same: !!expect && r.hash === expect, was: expect || null };
    });
  }

  function quota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return Promise.resolve({ usage: 0, quota: 0, persisted: false, known: false });
    }
    return navigator.storage.estimate().then(function (e) {
      var p = navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false);
      return Promise.resolve(p).then(function (on) {
        return { usage: e.usage || 0, quota: e.quota || 0, persisted: !!on, known: true };
      });
    }).catch(function () {
      return { usage: 0, quota: 0, persisted: false, known: false };
    });
  }

  /*@3.NOPJ4.5*/
  function persist() {
    if (!navigator.storage || !navigator.storage.persist) return Promise.resolve(false);
    return navigator.storage.persist().then(function (v) { return !!v; })
      .catch(function () { return false; });
  }

  function sweep(keep) {
    return list().then(function (rows) {
      var n = keep == null ? 12 : keep;
      var doomed = rows.slice(n);
      return Promise.all(doomed.map(function (r) { return drop(r.hash); }))
        .then(function () { return doomed.length; });
    });
  }

  window.GardenPdfDoc = {
    hash: hash,
    put: put,
    get: get,
    has: has,
    list: list,
    drop: drop,
    adopt: adopt,
    match: match,
    quota: quota,
    persist: persist,
    sweep: sweep,
    available: available
  };
})();
