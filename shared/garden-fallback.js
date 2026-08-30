;(function () {
  'use strict';

  /*@3.GAFJ.1*/

  /*@3.GAFJ.2*/
  var DB_NAME = 'byte-fallback';
  var DB_VER = 1;
  var STORE = 'snap';

  /*@3.GAFJ.4*/
  var MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  /*@3.GAFJ.8*/
  var RETRY_MS = [4000, 10000, 25000, 60000, 120000, 300000];

  var BAR_ID = 'gfb-bar';

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!self.indexedDB) { rej(new Error('no-idb')); return; }
      var q = self.indexedDB.open(DB_NAME, DB_VER);
      q.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'k' });
      };
      q.onsuccess = function () { res(q.result); };
      q.onerror = function () { rej(q.error); };
    });
    dbp.catch(function () { dbp = null; });
    return dbp;
  }

  /*@3.GAFJ.3*/
  function hasZip() {
    return typeof self.CompressionStream === 'function' &&
           typeof self.DecompressionStream === 'function' &&
           typeof Response === 'function';
  }

  function zip(text) {
    if (!hasZip()) return Promise.resolve(null);
    try {
      var s = new Blob([text]).stream().pipeThrough(new self.CompressionStream('gzip'));
      return new Response(s).blob();
    } catch (e) { return Promise.resolve(null); }
  }

  function unzip(blob) {
    try {
      var s = blob.stream().pipeThrough(new self.DecompressionStream('gzip'));
      return new Response(s).text();
    } catch (e) { return Promise.reject(e); }
  }

  function put(rec) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(rec);
        tx.oncomplete = function () { res(true); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error); };
      });
    });
  }

  function save(key, data) {
    var text;
    try { text = JSON.stringify(data); } catch (e) { return Promise.resolve(false); }
    if (!text) return Promise.resolve(false);
    return zip(text).then(function (blob) {
      return put(blob ? { k: key, at: Date.now(), z: blob }
                      : { k: key, at: Date.now(), t: text });
    }).catch(function () { return false; });
  }

  function load(key) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(STORE, 'readonly');
        var q = tx.objectStore(STORE).get(key);
        q.onsuccess = function () { res(q.result || null); };
        q.onerror = function () { rej(q.error); };
      });
    }).then(function (rec) {
      if (!rec) return null;
      if (Date.now() - rec.at > MAX_AGE_MS) return null;
      var text = rec.z ? unzip(rec.z) : Promise.resolve(rec.t);
      return Promise.resolve(text).then(function (s) {
        return { at: rec.at, data: JSON.parse(s) };
      });
    }).catch(function () { return null; });
  }

  function drop(key) {
    return db().then(function (d) {
      return new Promise(function (res) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE)['delete'](key);
        tx.oncomplete = function () { res(true); };
        tx.onerror = function () { res(false); };
      });
    }).catch(function () { return false; });
  }

  /*@3.GAFJ.11*/
  function arCount(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n <= 10) return n + ' ' + few;
    return n + ' ' + many;
  }

  function ago(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 90) return t('قبل لحظات', 'moments ago');
    var m = Math.round(s / 60);
    if (m < 60) return t('قبل ' + arCount(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة'), m + ' min ago');
    var h = Math.round(m / 60);
    if (h < 24) return t('قبل ' + arCount(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'), h + ' h ago');
    var d = Math.round(h / 24);
    return t('قبل ' + arCount(d, 'يوم', 'يومين', 'أيّام', 'يوماً'), d + ' d ago');
  }

  /*@3.GAFJ.6*/
  function offline() { return navigator.onLine === false; }

  var live = { kind: '', at: 0, retry: null, step: 0, again: null };

  function host() {
    return document.querySelector('.main-content') ||
           document.querySelector('main') ||
           document.body;
  }

  /*@3.GAFJ.5*/
  function bar() {
    var el = document.getElementById(BAR_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BAR_ID;
    el.className = 'gfb';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    var h = host();
    h.insertBefore(el, h.firstChild);
    return el;
  }

  function words(kind, at) {
    if (kind === 'offline') {
      return {
        ar: 'لا اتصالَ بالإنترنت عندك الآن. نعرض لك آخرَ نسخةٍ محفوظةٍ في جهازك' +
            (at ? ' — ' + 'حُفظت ' + ago(at) : '') + '.',
        en: 'You are offline. Showing the last copy saved on your device' +
            (at ? ' — saved ' + ago(at) : '') + '.'
      };
    }
    if (kind === 'stale') {
      return {
        ar: 'الخادمُ متوقّفٌ مؤقّتاً للصيانة وسيعود قريباً. نعرض لك آخرَ نسخةٍ محفوظةٍ' +
            (at ? ' — ' + 'حُفظت ' + ago(at) : '') + '، وقد تغيّرت بعضُ المقاعد منذها.',
        en: 'The server is briefly down for maintenance and will be back soon. ' +
            'Showing your last saved copy' + (at ? ' — saved ' + ago(at) : '') +
            '; some seats may have changed since.'
      };
    }
    if (kind === 'empty') {
      return {
        ar: 'الخادمُ متوقّفٌ مؤقّتاً للصيانة وسيعود قريباً، ولا نسخةَ محفوظةً في جهازك بعد. ' +
            'وبقيّةُ الحديقة تعمل.',
        en: 'The server is briefly down for maintenance and will be back soon, and there is ' +
            'no saved copy on this device yet. The rest of the Garden keeps working.'
      };
    }
    return {
      ar: 'عاد الخادمُ — البياناتُ محدَّثةٌ الآن.',
      en: 'The server is back — data is up to date.'
    };
  }

  function paint() {
    var el = bar();
    if (!live.kind) { el.hidden = true; el.textContent = ''; return; }
    var w = words(live.kind, live.at);
    var tone = live.kind === 'empty' ? 'bad' : (live.kind === 'back' ? 'ok' : 'warn');
    var icon = live.kind === 'offline' ? 'fa-cloud'
             : (live.kind === 'back' ? 'fa-rotate' : 'fa-triangle-exclamation');
    el.setAttribute('data-tone', tone);
    el.innerHTML =
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      /*@3.GAFJ.7*/
      '<span class="gfb-t" data-ar="' + esc(w.ar) + '" data-en="' + esc(w.en) + '">' +
        esc(t(w.ar, w.en)) + '</span>' +
      (live.kind === 'back' ? '' :
        '<button type="button" class="gfb-go" data-ar="أعِدِ المحاولة" data-en="Try again" ' +
        'aria-label="' + esc(t('أعِدِ المحاولة', 'Try again')) + '">' +
        esc(t('أعِدِ المحاولة', 'Try again')) + '</button>');
    el.hidden = false;
    var b = el.querySelector('.gfb-go');
    if (b) b.addEventListener('click', function () { retryNow(); });
  }

  function show(kind, at) {
    live.kind = kind;
    live.at = at || 0;
    paint();
  }

  function hide() {
    live.kind = '';
    live.step = 0;
    if (live.retry) { clearTimeout(live.retry); live.retry = null; }
    paint();
  }

  /*@3.GAFJ.10*/
  function backToLife() {
    live.step = 0;
    if (live.retry) { clearTimeout(live.retry); live.retry = null; }
    show('back', 0);
    setTimeout(function () { if (live.kind === 'back') hide(); }, 4000);
  }

  function retryNow() {
    if (typeof live.again !== 'function') return;
    if (live.retry) { clearTimeout(live.retry); live.retry = null; }
    live.again();
  }

  function armRetry() {
    if (typeof live.again !== 'function') return;
    if (live.retry) clearTimeout(live.retry);
    var ms = RETRY_MS[Math.min(live.step, RETRY_MS.length - 1)];
    live.step++;
    live.retry = setTimeout(function () { live.retry = null; live.again(); }, ms);
  }

  function through(key, fetcher, opts) {
    opts = opts || {};
    live.again = function () { through(key, fetcher, opts); };
    return Promise.resolve().then(fetcher).then(function (data) {
      /*@3.GAFJ.9*/
      save(key, data);
      if (live.kind && live.kind !== 'back') backToLife();
      else { live.step = 0; if (live.retry) { clearTimeout(live.retry); live.retry = null; } }
      if (typeof opts.onData === 'function') opts.onData(data, { stale: false, at: Date.now() });
      return { data: data, stale: false, at: Date.now() };
    }, function (err) {
      return load(key).then(function (rec) {
        if (rec) {
          show(offline() ? 'offline' : 'stale', rec.at);
          armRetry();
          if (typeof opts.onData === 'function') opts.onData(rec.data, { stale: true, at: rec.at });
          return { data: rec.data, stale: true, at: rec.at };
        }
        show(offline() ? 'offline' : 'empty', 0);
        armRetry();
        throw err;
      });
    });
  }

  document.addEventListener('garden:languageChanged', function () { if (live.kind) paint(); });
  window.addEventListener('online', function () { if (live.kind && live.kind !== 'back') retryNow(); });

  window.GardenFallback = {
    through: through,
    save: save,
    load: load,
    drop: drop,
    ago: ago,
    show: show,
    hide: hide,
    offline: offline,
    state: function () { return { kind: live.kind, at: live.at }; }
  };
})();
