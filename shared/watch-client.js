/*@3.WACJ.1*/
;(function () {
  'use strict';

  var API = String((window.GardenEndpoints && window.GardenEndpoints.publicData) || '')
    .replace(/\/+$/, '');
  var LOCAL_WID = 'garden_watch_id';
  var CACHE_LS = 'garden_watch_cache';

  /*@3.WACJ.2*/
  var S = { wid: null, push: null, watches: [], alerts: [], at: 0, loaded: false };
  var listeners = [];

  function emit() {
    listeners.forEach(function (f) { try { f(S); } catch (e) {} });
  }

  /*@3.WACJ.3*/

  function hex(n) {
    var b = new Uint8Array(n);
    if (self.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(b, function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
  }

  function localWid() {
    var v = null;
    try { v = localStorage.getItem(LOCAL_WID); } catch (e) {}
    if (v && /^w[0-9a-f]{32}$/.test(v)) return v;
    v = 'w' + hex(16);
    try { localStorage.setItem(LOCAL_WID, v); } catch (e) {}
    return v;
  }

  /*@3.WACJ.4*/
  function pushId() {
    var P = window.GardenPush;
    if (P && typeof P.vaultId === 'function') {
      try { return P.vaultId() || null; } catch (e) {}
    }
    return null;
  }

  function wid() {
    if (S.wid) return Promise.resolve(S.wid);
    var G = window.GardenSync;
    var p = (G && typeof G.vaultDocId === 'function')
      ? G.vaultDocId() : Promise.resolve(null);
    return Promise.resolve(p).then(function (v) {
      S.wid = (v && /^v[0-9a-f]{32}$/.test(v)) ? v : localWid();
      return S.wid;
    }, function () { S.wid = localWid(); return S.wid; });
  }

  /*@3.WACJ.5*/
  function synced() { return !!(S.wid && S.wid.charAt(0) === 'v'); }

  /*@3.WACJ.6*/

  function saveCache() {
    try {
      localStorage.setItem(CACHE_LS, JSON.stringify({
        wid: S.wid, watches: S.watches, alerts: S.alerts.slice(0, 30), at: Date.now()
      }));
    } catch (e) {}
  }

  function loadCache() {
    try {
      var d = JSON.parse(localStorage.getItem(CACHE_LS) || 'null');
      if (d && d.wid && d.wid === S.wid) {
        S.watches = d.watches || [];
        S.alerts = d.alerts || [];
        S.at = d.at || 0;
        return true;
      }
    } catch (e) {}
    return false;
  }

  /*@3.WACJ.7*/

  /*@3.WACJ.15*/
  function api(path, opts) {
    if (!API) return Promise.reject(new Error('no-endpoint'));
    var o = Object.assign({}, opts || {});
    var SY = window.GardenSync;
    o.headers = (SY && SY.vaultHeaders)
      ? SY.vaultHeaders(SY.getKey && SY.getKey(), o.headers || {})
      : (o.headers || {});
    return fetch(API + path, o).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (r.ok) return j || {};
        var e = new Error((j && j.error) || ('http-' + r.status));
        e.status = r.status;
        throw e;
      });
    });
  }

  /*@3.WACJ.8*/
  function load(force) {
    return wid().then(function (id) {
      var had = S.loaded || loadCache();
      if (had) { S.loaded = true; emit(); }
      if (!force && S.at && Date.now() - S.at < 60000) return S;
      return api('/v1/watch/' + id).then(function (d) {
        S.watches = d.watches || [];
        S.alerts = d.alerts || [];
        S.at = Date.now();
        S.loaded = true;
        saveCache();
        emit();
        return S;
      }, function (e) {
        S.error = e && e.message;
        S.loaded = true;
        emit();
        return S;
      });
    });
  }

  function keyOf(kind, term, target) {
    return kind + '|' + term + '|' + String(target).toUpperCase();
  }

  function has(kind, term, target) {
    var k = keyOf(kind, term, target);
    return S.watches.some(function (w) { return keyOf(w.kind, w.term, w.target) === k; });
  }

  function find(kind, term, target) {
    var k = keyOf(kind, term, target);
    return S.watches.filter(function (w) { return keyOf(w.kind, w.term, w.target) === k; })[0] || null;
  }

  function countFor(term) {
    return S.watches.filter(function (w) { return !term || w.term === term; }).length;
  }

  function unread() {
    return S.alerts.filter(function (a) { return !a.read; }).length;
  }

  /*@3.WACJ.9*/
  function toggle(kind, term, target) {
    target = String(target).toUpperCase();
    var on = has(kind, term, target);
    window.GardenEv('sect_watch', { kind: kind, off: on ? 1 : 0 });
    var row = { kind: kind, term: term, target: target, armed: true, fires: 0,
                created_at: new Date().toISOString(), pending: true };

    if (on) S.watches = S.watches.filter(function (w) {
      return keyOf(w.kind, w.term, w.target) !== keyOf(kind, term, target);
    });
    else S.watches = S.watches.concat([row]);
    emit();

    var want = !on;
    return wid().then(function (id) {
      var body = { wid: id, push_id: pushId() };
      body[want ? 'add' : 'del'] = [{ kind: kind, term: term, target: target }];
      return api('/v1/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }).then(function (d) {
      /*@3.WACJ.10*/
      var rej = (d && d.rejected || [])[0];
      if (want && rej) {
        S.watches = S.watches.filter(function (w) {
          return keyOf(w.kind, w.term, w.target) !== keyOf(kind, term, target);
        });
        emit(); saveCache();
        return { on: false, error: rej.why || 'rejected' };
      }
      S.watches.forEach(function (w) {
        if (keyOf(w.kind, w.term, w.target) === keyOf(kind, term, target)) delete w.pending;
      });
      S.at = 0;                       /*@3.WACJ.11*/
      saveCache(); emit();
      return { on: want };
    }, function (e) {
      /*@3.WACJ.12*/
      if (want) S.watches = S.watches.filter(function (w) {
        return keyOf(w.kind, w.term, w.target) !== keyOf(kind, term, target);
      });
      else S.watches = S.watches.concat([row]);
      emit();
      return { on: on, error: (e && e.message) || 'network' };
    });
  }

  /*@3.WACJ.13*/
  function syncCourses(term, codes) {
    if (!term) return Promise.resolve(null);
    var want = {}, i;
    (codes || []).forEach(function (c) { want[String(c).toUpperCase()] = 1; });
    var have = {};
    S.watches.forEach(function (w) {
      if (w.kind === 'course' && w.term === term) have[w.target] = 1;
    });
    var add = [], del = [];
    for (i in want) if (!have[i]) add.push({ kind: 'course', term: term, target: i });
    for (i in have) if (!want[i]) del.push({ kind: 'course', term: term, target: i });
    if (!add.length && !del.length) return Promise.resolve(null);
    return wid().then(function (id) {
      return api('/v1/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wid: id, push_id: pushId(), add: add, del: del })
      });
    }).then(function (d) { S.at = 0; return load(true).then(function () { return d; }); },
            function () { return null; });
  }

  function markSeen() {
    if (!unread()) return Promise.resolve(null);
    S.alerts.forEach(function (a) { a.read = true; });
    saveCache(); emit();
    return wid().then(function (id) {
      return api('/v1/watch/' + id + '/seen', { method: 'POST' });
    }).catch(function () { return null; });
  }

  /*@3.WACJ.14*/
  function refreshPush() {
    var p = pushId();
    if (!p) return Promise.resolve(null);
    return wid().then(function (id) {
      return api('/v1/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wid: id, push_id: p, touch: 1 })
      });
    }).catch(function () { return null; });
  }

  window.GardenWatch = {
    load: load, has: has, find: find, toggle: toggle, syncCourses: syncCourses,
    markSeen: markSeen, refreshPush: refreshPush, unread: unread, countFor: countFor,
    wid: wid, synced: synced, pushId: pushId,
    state: function () { return S; },
    on: function (f) { listeners.push(f); if (S.loaded) f(S); },
    ready: function () { return !!API; }
  };
})();
