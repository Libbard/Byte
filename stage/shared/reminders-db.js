/*@3.REDJ.1*/
;(function () {
  'use strict';

  var DB_NAME = '__stage__byte-reminders';
  var DB_VER = 1;
  var S_QUEUE = 'queue';
  var S_FIRED = 'fired';
  var S_META = 'meta';

  var FIRED_TTL_MS = 14 * 24 * 60 * 60 * 1000;

  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!self.indexedDB) { reject(new Error('no-idb')); return; }
      var req = self.indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(S_QUEUE)) {
          var q = db.createObjectStore(S_QUEUE, { keyPath: 'id' });
          q.createIndex('fireAt', 'fireAt');
        }
        if (!db.objectStoreNames.contains(S_FIRED)) {
          db.createObjectStore(S_FIRED, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(S_META)) {
          db.createObjectStore(S_META, { keyPath: 'k' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    /*@3.REDJ.2*/
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(store, mode);
        var out = fn(t.objectStore(store));
        /*@3.REDJ.3*/
        t.oncomplete = function () {
          resolve(out instanceof IDBRequest ? out.result : out);
        };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function reqAll(store) {
    return tx(store, 'readonly', function (os) { return os.getAll(); })
      .then(function (r) { return r || []; })
      .catch(function () { return []; });
  }

  /*@3.REDJ.4*/

  /*@3.REDJ.5*/
  function replaceQueue(items) {
    return reqAll(S_QUEUE).then(function (old) {
      var snoozed = {};
      old.forEach(function (o) { if (o && o.snoozedTo) snoozed[o.id] = o; });
      return tx(S_QUEUE, 'readwrite', function (os) {
        os.clear();
        items.forEach(function (it) {
          var keep = snoozed[it.id];
          if (keep) {
            it.fireAt = keep.fireAt;
            it.snoozedTo = keep.snoozedTo;
            it.snoozeCount = keep.snoozeCount || 0;
          }
          os.put(it);
        });
        /*@3.REDJ.6*/
        Object.keys(snoozed).forEach(function (id) {
          if (!items.some(function (i) { return i.id === id; })) os.put(snoozed[id]);
        });
      });
    }).catch(function () {});
  }

  function getQueue() { return reqAll(S_QUEUE); }

  /*@3.REDJ.7*/
  function clearAll() {
    return tx(S_QUEUE, 'readwrite', function (os) { os.clear(); }).catch(function () {});
  }

  function getItem(id) {
    return tx(S_QUEUE, 'readonly', function (os) { return os.get(id); })
      .catch(function () { return null; });
  }

  function putItem(item) {
    return tx(S_QUEUE, 'readwrite', function (os) { os.put(item); }).catch(function () {});
  }

  function removeItem(id) {
    return tx(S_QUEUE, 'readwrite', function (os) { os['delete'](id); }).catch(function () {});
  }

  /*@3.REDJ.8*/

  /*@3.REDJ.9*/
  function markFired(id, how, meta) {
    var rec = { id: id, at: Date.now(), how: how || 'fired' };
    if (meta && meta.title) rec.title = String(meta.title).slice(0, 160);
    if (meta && meta.body) rec.body = String(meta.body).slice(0, 240);
    return tx(S_FIRED, 'readwrite', function (os) { os.put(rec); })
      .then(function () { return removeItem(id); })
      .catch(function () {});
  }

  /*@3.REDJ.10*/
  function firedList() {
    return firedMap().then(function (map) {
      return Object.keys(map).map(function (k) { return map[k]; })
        .sort(function (a, b) { return b.at - a.at; });
    }).catch(function () { return []; });
  }

  function firedMap() {
    return reqAll(S_FIRED).then(function (list) {
      var cut = Date.now() - FIRED_TTL_MS;
      var map = {};
      var stale = [];
      list.forEach(function (r) {
        if (!r) return;
        if (r.at < cut) stale.push(r.id); else map[r.id] = r;
      });
      if (stale.length) {
        tx(S_FIRED, 'readwrite', function (os) {
          stale.forEach(function (id) { os['delete'](id); });
        }).catch(function () {});
      }
      return map;
    });
  }

  /*@3.REDJ.11*/

  function setMeta(k, v) {
    return tx(S_META, 'readwrite', function (os) { os.put({ k: k, v: v }); }).catch(function () {});
  }

  function getMeta(k) {
    return tx(S_META, 'readonly', function (os) { return os.get(k); })
      .then(function (r) { return r ? r.v : null; })
      .catch(function () { return null; });
  }

  self.ReminderDB = {
    open: open,
    replaceQueue: replaceQueue,
    clearAll: clearAll,
    getQueue: getQueue,
    getItem: getItem,
    putItem: putItem,
    removeItem: removeItem,
    markFired: markFired,
    firedMap: firedMap,
    firedList: firedList,
    setMeta: setMeta,
    getMeta: getMeta
  };
})();
