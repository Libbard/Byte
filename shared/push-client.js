 
;(function () {
  'use strict';

  var ENDPOINT = (window.GardenEndpoints && window.GardenEndpoints.push) || '';
  var PUBLIC_KEY = 'BHC2o0fR-Y1xT2JG_1wW_4trj8QNmJyzfXlHQHzNyZyI6PkLZ1gAnumHSI6XqIDtwT7G_oURepoHnHXJkAKexAw';

  var DEVICE_LS = 'garden_push_device';
  var STATE_LS = 'garden_push_state';   
  var MAX_WAKES = 60;

   

  function vaultId() {
    try {
      var k = localStorage.getItem('garden_sync_key');
      if (k && /^[A-Za-z0-9_-]{8,64}$/.test(k)) return k;
    } catch (e) {}
    return deviceId();          
  }

  function deviceId() {
    var id = null;
    try { id = localStorage.getItem(DEVICE_LS); } catch (e) {}
    if (id && /^[A-Za-z0-9_-]{8,64}$/.test(id)) return id;
    var b = new Uint8Array(16);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.fill(0);
    id = 'd' + Array.prototype.map.call(b, function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
    try { localStorage.setItem(DEVICE_LS, id); } catch (e) {}
    return id;
  }

   

  function urlB64ToU8(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4);
    var b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(b64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function post(path, body) {
    if (!ENDPOINT) return Promise.reject(new Error('no-endpoint'));
    return fetch(ENDPOINT + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('http-' + r.status);
      return r.json();
    });
  }

  function swReg() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no-sw'));
     
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise(function (_, rej) {
        setTimeout(function () { rej(new Error('sw-timeout')); }, 5000);
      })
    ]);
  }

  function supported() {
    return ('serviceWorker' in navigator) && ('PushManager' in window) && !!ENDPOINT;
  }

   

  function subscribe() {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return Promise.resolve({ ok: false, reason: 'not-granted' });
    }

    return swReg().then(function (reg) {
      return reg.pushManager.getSubscription().then(function (existing) {
        if (existing) {
           
          var cur = existing.options && existing.options.applicationServerKey;
          if (cur && !sameKey(cur, PUBLIC_KEY)) {
            return existing.unsubscribe().then(function () { return fresh(reg); });
          }
          return existing;
        }
        return fresh(reg);
      });
    }).then(function (sub) {
      var j = sub.toJSON();
      return post('/v1/subscribe', {
        vault_id: vaultId(),
        device_id: deviceId(),
        subscription: { endpoint: j.endpoint, keys: j.keys }
      }).then(function () { return { ok: true }; });
    }).catch(function (e) {
      return { ok: false, reason: String(e && e.message || e) };
    });
  }

  function fresh(reg) {
     
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToU8(PUBLIC_KEY)
    });
  }

  function sameKey(bufOrStr, b64) {
    try {
      var a = new Uint8Array(bufOrStr);
      var b = urlB64ToU8(b64);
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    } catch (e) { return true; }   
  }

  function unsubscribe() {
    var done = post('/v1/unsubscribe', { vault_id: vaultId(), device_id: deviceId() })
      .catch(function () {});
    return swReg().then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (s) {
      return s ? s.unsubscribe() : null;
    }).catch(function () {}).then(function () {
      try { localStorage.removeItem(STATE_LS); } catch (e) {}
      return done;
    });
  }

   

   
  function wakeTimes(items) {
    var now = Date.now();
    var set = {};
    (items || []).forEach(function (i) {
      if (!i || typeof i.fireAt !== 'number' || i.fireAt <= now) return;
      set[Math.floor(i.fireAt / 60000) * 60000] = 1;
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; })
      .slice(0, MAX_WAKES);
  }

  function syncWakes(items) {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    var wakes = wakeTimes(items);
    var sig = vaultId() + '|' + wakes.join(',');
    var last = null;
    try { last = localStorage.getItem(STATE_LS); } catch (e) {}
    if (sig === last) return Promise.resolve({ ok: true, skipped: true });

    return post('/v1/wakes', { vault_id: vaultId(), device_id: deviceId(), wakes: wakes })
      .then(function (r) {
         
        try { localStorage.setItem(STATE_LS, sig); } catch (e) {}
        return { ok: true, accepted: r && r.accepted };
      })
      .catch(function (e) {
        try { localStorage.removeItem(STATE_LS); } catch (e2) {}
        return { ok: false, reason: String(e && e.message || e) };
      });
  }

  window.GardenPush = {
    supported: supported,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    syncWakes: syncWakes,
    vaultId: vaultId,
    deviceId: deviceId,
    publicKey: PUBLIC_KEY
  };
})();
