/*@3.NOSJ.1*/
;(function () {
  'use strict';

  var DB_NAME = 'byte-notes';
  var DB_VER = 1;
  var S_DOCS = 'docs';
  var S_META = 'meta';

  var MAX_DOC_BYTES = 1024 * 1024;
  var WARN_DOC_BYTES = 700 * 1024;
  var MAX_TOTAL_BYTES = 25 * 1024 * 1024;
  var WARN_TOTAL_BYTES = 20 * 1024 * 1024;

  var dbPromise = null;
  /*@3.NOSJ.2*/
  var idbBroken = false;

  function open() {
    if (idbBroken) return Promise.reject(new Error('no-idb'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!self.indexedDB) { reject(new Error('no-idb')); return; }
      var req;
      try { req = self.indexedDB.open(DB_NAME, DB_VER); }
      catch (e) { reject(e); return; }
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(S_DOCS)) {
          var d = db.createObjectStore(S_DOCS, { keyPath: 'id' });
          /*@3.NOSJ.3*/
          d.createIndex('dirty', 'dirty');
        }
        if (!db.objectStoreNames.contains(S_META)) {
          db.createObjectStore(S_META, { keyPath: 'k' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () { reject(new Error('idb-blocked')); };
    });
    dbPromise.catch(function () { dbPromise = null; idbBroken = true; });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(store, mode);
        var out = fn(t.objectStore(store));
        t.oncomplete = function () {
          resolve(out instanceof IDBRequest ? out.result : out);
        };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  /*@3.NOSJ.5*/
  function byteLen(str) {
    try { return new TextEncoder().encode(str).length; }
    catch (e) { return str.length * 2; }
  }

  function serialize(doc) {
    return (typeof doc === 'string') ? doc : JSON.stringify(doc);
  }

  function parse(raw) {
    if (raw == null) return null;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function getRow(id) {
    return tx(S_DOCS, 'readonly', function (os) { return os.get(String(id)); })
      .catch(function () { return null; });
  }

  function getDoc(id) {
    return getRow(id).then(function (row) {
      if (!row) return null;
      return { id: row.id, doc: parse(row.raw), t: row.t || 0, bytes: row.bytes || 0 };
    });
  }

  function putDoc(id, doc, t, opts) {
    var o = opts || {};
    var raw = serialize(doc);
    var bytes = byteLen(raw);
    if (bytes > MAX_DOC_BYTES) {
      return Promise.reject(mkErr('doc_too_large', { bytes: bytes, max: MAX_DOC_BYTES }));
    }
    var row = {
      id: String(id),
      raw: raw,
      t: Number(t) || Date.now(),
      bytes: bytes,
      dirty: o.clean ? 0 : 1,
      saved_at: Date.now()
    };
    return tx(S_DOCS, 'readwrite', function (os) { return os.put(row); })
      .then(function () { return { bytes: bytes, t: row.t }; });
  }

  function delDoc(id) {
    return tx(S_DOCS, 'readwrite', function (os) { return os.delete(String(id)); })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function allRows() {
    return tx(S_DOCS, 'readonly', function (os) { return os.getAll(); })
      .then(function (r) { return r || []; })
      .catch(function () { return []; });
  }

  function manifest() {
    return allRows().then(function (rows) {
      var out = {};
      for (var i = 0; i < rows.length; i++) {
        out[rows[i].id] = { t: rows[i].t || 0, bytes: rows[i].bytes || 0, dirty: rows[i].dirty ? 1 : 0 };
      }
      return out;
    });
  }

  function dirtyIds() {
    return allRows().then(function (rows) {
      var out = [];
      for (var i = 0; i < rows.length; i++) if (rows[i].dirty) out.push(rows[i].id);
      return out;
    });
  }

  function markClean(id, t) {
    return getRow(id).then(function (row) {
      if (!row) return false;
      /*@3.NOSJ.4*/
      if (t != null && Number(t) !== Number(row.t)) return false;
      row.dirty = 0;
      return tx(S_DOCS, 'readwrite', function (os) { return os.put(row); })
        .then(function () { return true; });
    }).catch(function () { return false; });
  }

  function totalBytes() {
    return allRows().then(function (rows) {
      var n = 0;
      for (var i = 0; i < rows.length; i++) n += rows[i].bytes || 0;
      return n;
    });
  }

  function quota() {
    return totalBytes().then(function (b) {
      return {
        bytes: b,
        max: MAX_TOTAL_BYTES,
        warn: WARN_TOTAL_BYTES,
        pct: Math.min(100, Math.round((b / MAX_TOTAL_BYTES) * 100)),
        state: b >= MAX_TOTAL_BYTES ? 'full' : (b >= WARN_TOTAL_BYTES ? 'warn' : 'ok')
      };
    });
  }

  function docState(bytes) {
    if (bytes >= MAX_DOC_BYTES) return 'full';
    if (bytes >= WARN_DOC_BYTES) return 'warn';
    return 'ok';
  }

  function getMeta(k, fallback) {
    return tx(S_META, 'readonly', function (os) { return os.get(String(k)); })
      .then(function (row) { return row ? row.v : fallback; })
      .catch(function () { return fallback; });
  }

  function setMeta(k, v) {
    return tx(S_META, 'readwrite', function (os) { return os.put({ k: String(k), v: v }); })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function mkErr(code, extra) {
    var e = new Error(code);
    e.code = code;
    if (extra) for (var k in extra) e[k] = extra[k];
    return e;
  }

  function available() {
    return open().then(function () { return true; }).catch(function () { return false; });
  }

  window.GardenNotesStore = {
    available: available,
    getDoc: getDoc,
    putDoc: putDoc,
    delDoc: delDoc,
    manifest: manifest,
    dirtyIds: dirtyIds,
    markClean: markClean,
    totalBytes: totalBytes,
    quota: quota,
    docState: docState,
    meta: getMeta,
    setMeta: setMeta,
    byteLen: byteLen,
    LIMITS: {
      doc: MAX_DOC_BYTES,
      docWarn: WARN_DOC_BYTES,
      total: MAX_TOTAL_BYTES,
      totalWarn: WARN_TOTAL_BYTES
    }
  };
})();
