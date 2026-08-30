/*@3.FISJ.1*/

; (function () {
  'use strict';

  /*@3.FISJ.2*/
  const WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';

  /*@3.FISJ.3*/
  function syncEndpoint() {
    const e = (window.GardenEndpoints && window.GardenEndpoints.sync) || '';
    return String(e).replace(/\/+$/, '');
  }

  /*@3.FISJ.4*/
  const ROOT = (function () {
    const s = document.currentScript;
    return (s && s.src) ? s.src.replace(/shared\/firebase-sync\.js(\?.*)?$/, '')
                        : (location.origin + '/');
  })();

  let _endpointsP = null;
  function ensureEndpoints() {
    if (window.GardenEndpoints) return Promise.resolve(true);
    if (_endpointsP) return _endpointsP;
    _endpointsP = new Promise(resolve => {
      /*@3.FISJ.5*/
      let el = document.querySelector('script[data-garden-endpoints]');
      if (!el) {
        el = document.createElement('script');
        el.src = ROOT + 'shared/endpoints.js';
        el.async = false;
        el.setAttribute('data-garden-endpoints', '1');
        document.head.appendChild(el);
      }
      const done = () => resolve(!!window.GardenEndpoints);
      el.addEventListener('load', done);
      el.addEventListener('error', done);
      setTimeout(done, 4000);            /*@3.FISJ.6*/
    });
    return _endpointsP;
  }

  async function getFirebaseConfig() {
    /*@3.FISJ.7*/
    const own = usingOracle() ? syncEndpoint() : '';
    if (own) {
      const r = await fetch(own + '/v1/config');
      if (!r.ok) throw new Error('byte-config-' + r.status);
      return r.json();
    }
    const res = await fetch(`${WORKER_URL}/api/firebase-config`);
    return res.json();
  }

  const FIREBASE_VER = '10.12.2';

  /*@3.FISJ.8*/
  const FIXED_SYNC_KEYS = [];

  /*@3.FISJ.9*/
  const DYNAMIC_PATTERNS = [
    /*@3.FISJ.10*/
    /^garden_[A-Z0-9]+_m\d+_fc$/,
    /^garden_[A-Z0-9]+_m\d+_quiz$/,
    /^garden_[A-Z0-9]+_m\d+_notes$/,
    /^garden_[A-Z0-9]+_m\d+_ret$/,
    /^garden_[A-Z0-9]+_activity$/,
    /^garden_daily_new_limit$/,
    /*@3.FISJ.11*/
    /^[A-Z0-9]+_(midterm|final)_score$/,
    /*@3.FISJ.12*/
    /^garden_[A-Z0-9]+_quizlog$/,
    /*@3.FISJ.13*/
    /^my_semester$/,
    /^semester_archive$/,
    /*@3.FISJ.14*/
    /^gpa_grades$/,
    /^gpa_settings$/,
    /*@3.FISJ.15*/
    /^weekly_schedule$/,
    /*@3.FISJ.16*/
    /^dashboard_prefs$/,
    /^student_profile$/,
    /^quick_notes$/,
    /*@3.FISJ.17*/
    /^course_meta_[A-Z0-9_]+$/,
    /*@3.FISJ.18*/
    /^my_tasks$/,
    /*@3.FISJ.19*/
    /^gpa_plan$/,
    /*@3.FISJ.237*/
    /^notes_index$/,
    /^notes_folders$/,
    /*@3.FISJ.20*/
    /^__tomb_[A-Za-z0-9_.:-]+$/,
    /*@3.FISJ.21*/
    /^garden_labs_[a-z0-9-]+:(artifact|slots|slot:[a-z0-9]+)$/,
    /*@3.FISJ.204*/
    /^garden_ics$/,
    /^garden_module_visits$/,
  ];
  /*@3.FISJ.22*/
  const NEVER_SYNC = new Set([
    'garden_lang', 'garden_theme', 'garden_font_size', 'garden_mobile_3d', 'garden_sync_key',
    'garden_semester_meta',
    'garden_ics_run', 'garden_ics_boot',
    /*@3.FISJ.23*/
    'dash_view',
    /*@3.FISJ.24*/
    'gpa_scenario',
  ]);

  /*@3.FISJ.25*/
  const SYNC_KEY_LS = 'garden_sync_key';
  const SYNC_DECLINED_LS = 'garden_sync_declined'; /*@3.FISJ.26*/
  const SYNC_SEEN_LS = 'garden_sync_modal_seen';   /*@3.FISJ.27*/
  const KEY_REGEX = /^[A-Z]{3}[0-9]{5,}$/;
  /*@3.FISJ.28*/
  function collectionName() { return usingOracle() ? 'vaults' : 'users'; }

  /*@3.FISJ.29*/
  let forceFirestore = false;
  function usingOracle() { return !!syncEndpoint() && !forceFirestore; }
  let storeReady = false;
  /*@3.FISJ.30*/
  const PUSH_PENDING_LS = '__pushPending';
  let pushPending = (function () {
    try { return localStorage.getItem(PUSH_PENDING_LS) === '1'; } catch (e) { return false; }
  })();
  let pushQuota = null;
  function setPushPending(v) {
    pushPending = !!v;
    try {
      if (v) _rawSet.call(localStorage, PUSH_PENDING_LS, '1');
      else _rawRemove.call(localStorage, PUSH_PENDING_LS);
    } catch (e) {}
  }

  /*@3.FISJ.31*/

  function vaultUrl(docId) {
    return syncEndpoint() + '/v1/vault/' + encodeURIComponent(docId);
  }

  /*@3.FISJ.32*/
  const VAULT_MAP_LS = 'garden_vault_docid:';
  const ORACLE_ID = /^v[0-9a-f]{32}$/;

  async function oracleDocId(docId) {
    const id = String(docId || '');
    if (ORACLE_ID.test(id)) return id;                       /*@3.FISJ.33*/
    const cached = localStorage.getItem(VAULT_MAP_LS + id);
    if (cached && ORACLE_ID.test(cached)) return cached;

    const r = await fetch(syncEndpoint() + '/v1/legacy-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legacy_key: id })
    });
    if (!r.ok) throw new Error('legacy-map-' + r.status);
    const j = await r.json();
    if (!j || !ORACLE_ID.test(j.vault_id || '')) throw new Error('legacy-map-shape');
    localStorage.setItem(VAULT_MAP_LS + id, j.vault_id);
    return j.vault_id;
  }

  /*@3.FISJ.205*/
  const VAULT_TOK_LS = 'garden_vault_tok:';
  function vaultTok(id) {
    try { return localStorage.getItem(VAULT_TOK_LS + String(id || getKey() || '')) || ''; }
    catch (e) { return ''; }
  }
  function setVaultTok(id, tok) {
    try {
      const k = VAULT_TOK_LS + String(id || getKey() || '');
      if (tok) localStorage.setItem(k, String(tok));
      else localStorage.removeItem(k);
    } catch (e) {}
  }

  /*@3.FISJ.206*/
  function guardHeaders(id, extra) {
    const h = Object.assign({}, extra || {});
    const t = vaultTok(id);
    if (t) h['x-garden-vault'] = t;
    return h;
  }

  /*@3.FISJ.207*/
  let lock = { armed: false, pw: false, google: false, locked: false };
  let lockAnnounced = false;
  function lockFrom(j) {
    lock = { armed: true, pw: !!(j && j.pw), google: !!(j && j.google), locked: true };
    /*@3.FISJ.214*/
    if (!lockAnnounced) {
      lockAnnounced = true;
      try {
        window.dispatchEvent(new CustomEvent('garden:vaultLocked',
          { detail: { pw: lock.pw, google: lock.google } }));
      } catch (e) {}
    }
    setStatus('locked');
    return new Error('vault-locked');
  }
  function lockClear() {
    lock = { armed: lock.armed, pw: lock.pw, google: lock.google, locked: false };
    lockAnnounced = false;
  }

  /*@3.FISJ.208*/
  async function guardThrow(r) {
    let j = null;
    try { j = await r.json(); } catch (e) {}
    if (j && j.error === 'vault_locked') throw lockFrom(j);
    return j;
  }

  /*@3.FISJ.34*/
  async function storeGet(docId) {
    if (usingOracle()) {
      const id = await oracleDocId(docId);
      const r = await fetch(vaultUrl(id), { cache: 'no-store', headers: guardHeaders(id) });
      if (r.status === 401) await guardThrow(r);
      if (!r.ok) throw new Error('oracle-get-' + r.status);
      const j = await r.json();
      lockClear();
      return { exists: !!j.exists, sync: j.sync || {}, data: j };
    }
    const snap = await db.collection(collectionName()).doc(docId).get();
    const d = snap.exists ? (snap.data() || {}) : {};
    return { exists: !!snap.exists, sync: d.sync || {}, data: d };
  }

  /*@3.FISJ.35*/
  async function storeMerge(docId, payload, extra) {
    if (usingOracle()) {
      const id = await oracleDocId(docId);
      const r = await fetch(vaultUrl(id), {
        method: 'POST',
        headers: guardHeaders(id, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sync: payload })
      });
      if (r.status === 401) await guardThrow(r);
      /*@3.FISJ.239*/
      if (r.status === 413) {
        let info = null;
        try { info = await r.json(); } catch (e) {}
        const q = new Error('quota-' + ((info && info.error) || 'unknown'));
        q.quota = true;
        q.code = (info && info.error) || 'unknown';
        q.key = (info && info.key) || null;
        q.bytes = (info && info.bytes) || 0;
        q.max = (info && info.max) || 0;
        throw q;
      }
      if (!r.ok) throw new Error('oracle-post-' + r.status);
      lockClear();
      return r.json();
    }
    await db.collection(collectionName()).doc(docId).set(
      Object.assign({ sync: payload, last_seen: Date.now() }, extra || {}),
      { merge: true }
    );
    return null;
  }
  const AUTO_PUSH_DEBOUNCE_MS = 1500; /*@3.FISJ.36*/

  /*@3.FISJ.37*/
  const TS_PREFIX = '__syncT_';
  const _rawSet = Storage.prototype.setItem;
  /*@3.FISJ.242*/
  const _rawRemove = Storage.prototype.removeItem;
  function stampLocal(key, t) {
    try { _rawSet.call(localStorage, TS_PREFIX + key, String(t || hlcNow())); } catch (e) {}
  }
  function localStamp(key) {
    const v = Number(localStorage.getItem(TS_PREFIX + key) || 0);
    return isFinite(v) ? v : 0;
  }

  /*@3.FISJ.38*/
  const HLC_LS = '__hlc';
  let _hlc = (function () {
    try { const v = Number(localStorage.getItem(HLC_LS) || 0); return isFinite(v) ? v : 0; }
    catch (e) { return 0; }
  })();

  function _hlcSave() {
    try { _rawSet.call(localStorage, HLC_LS, String(_hlc)); } catch (e) {}
  }

  /*@3.FISJ.39*/
  function hlcObserve(t) {
    const n = Number(t);
    if (isFinite(n) && n > _hlc) { _hlc = n; _hlcSave(); }
  }

  /*@3.FISJ.40*/
  function hlcNow() {
    const p = Date.now();
    _hlc = (p > _hlc) ? p : _hlc + 1;
    _hlcSave();
    return _hlc;
  }

  /*@3.FISJ.41*/
  function hlcObserveItems(raw) {
    try { _hlcWalk(JSON.parse(raw || 'null')); } catch (e) {}
  }
  function _hlcWalk(x, depth) {
    if (!x || typeof x !== 'object' || (depth || 0) > 6) return;
    if (Array.isArray(x)) { x.forEach(e => _hlcWalk(e, (depth || 0) + 1)); return; }
    if (x.updated_at != null) hlcObserve(x.updated_at);
    for (const k in x) _hlcWalk(x[k], (depth || 0) + 1);
  }

  /*@3.FISJ.42*/
  function hlcSeedFromLocal() {
    if (_hlc) return;                      /*@3.FISJ.43*/
    let hi = 0;
    const bump = t => { const n = Number(t); if (isFinite(n) && n > hi) hi = n; };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf(TS_PREFIX) === 0) bump(localStorage.getItem(k));
        else if (MERGE_BY_ID.has(k)) {
          try {
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(arr)) arr.forEach(x => { if (x) bump(x.updated_at); });
          } catch (e) {}
        } else if (k.indexOf(TOMB_PREFIX) === 0) {
          const t = _readTomb(localStorage.getItem(k));
          for (const id in t) bump(t[id]);
        }
      }
    } catch (e) {}
    if (hi > _hlc) { _hlc = hi; _hlcSave(); }
  }

  /*@3.FISJ.44*/
  /*@3.FISJ.238*/
  const MERGE_BY_ID = new Set(['quick_notes', 'my_tasks', 'notes_index', 'notes_folders']);

  /*@3.FISJ.45*/
  const MERGE_DEEP = new Set([
    'weekly_schedule',    /*@3.FISJ.46*/
    'my_semester',
    'semester_archive',
    'gpa_grades',
    'gpa_plan',
    'gpa_settings',
    'dashboard_prefs',
    'student_profile',
    'garden_ics',
  ]);
  const MERGE_DEEP_PATTERNS = [
    /^course_meta_[A-Z0-9_]+$/,
    /*@3.FISJ.47*/
    /^garden_[A-Z0-9]+_m\d+_(fc|quiz|ret)$/,
    /*@3.FISJ.48*/
    /^garden_[A-Z0-9]+_quizlog$/,
    /^garden_module_visits$/,
  ];
  function isDeepKey(k) {
    return MERGE_DEEP.has(k) || MERGE_DEEP_PATTERNS.some(p => p.test(k));
  }

  const TOMB_PREFIX = '__tomb_';
  const TOMB_TTL_MS = 90 * 24 * 3600 * 1000;   /*@3.FISJ.49*/

  function _itemStamp(x, fallback) {
    const v = x && x.updated_at;
    const n = (typeof v === 'number') ? v : (v ? Date.parse(v) : NaN);
    return (isFinite(n) && n > 0) ? n : fallback;
  }

  function _readTomb(raw) {
    try {
      const o = JSON.parse(raw || '{}');
      return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }

  /*@3.FISJ.50*/
  function mergeTombs(aRaw, bRaw) {
    const a = _readTomb(aRaw), b = _readTomb(bRaw);
    const out = {}, floor = Date.now() - TOMB_TTL_MS;
    for (const src of [a, b]) {
      for (const id in src) {
        const t = Number(src[id]) || 0;
        if (t > floor && t > (out[id] || 0)) out[id] = t;
      }
    }
    return out;
  }

  function _isArr(x) { return Array.isArray(x); }
  function _isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  /*@3.FISJ.51*/
  function _isIdArr(x) {
    return _isArr(x) && x.length > 0 &&
           x.every(e => !!e && typeof e === 'object' && !Array.isArray(e) && e.id != null);
  }

  /*@3.FISJ.52*/
  function _canon(x) {
    if (_isArr(x)) return x.map(_canon);
    if (_isObj(x)) {
      const o = {};
      Object.keys(x).sort().forEach(k => { o[k] = _canon(x[k]); });
      return o;
    }
    return x;
  }
  function _canonStr(x) { return JSON.stringify(_canon(x)); }

  /*@3.FISJ.245*/
  const BOOKKEEP = { notes_index: ['sz', 'x'] };
  function _canonBk(x, bk) {
    if (!bk || !bk.length || !_isObj(x)) return _canonStr(x);
    const o = {};
    for (const k in x) {
      if (!Object.prototype.hasOwnProperty.call(x, k)) continue;
      if (bk.indexOf(k) >= 0) continue;
      o[k] = x[k];
    }
    return _canonStr(o);
  }

  /*@3.FISJ.53*/
  function _tk(path, id) { return path ? path + '/' + id : String(id); }

  function _mergeIdArr(a, b, localT, remoteT, dead, path) {
    const map = new Map();
    const put = (side, x) => {
      if (!x || x.id == null) return;
      const id = String(x.id);
      const e = map.get(id) || {};
      e[side] = x;
      map.set(id, e);
    };
    a.forEach(x => put('l', x));
    b.forEach(x => put('r', x));

    const out = [];
    for (const [id, e] of map) {
      let win, at;
      if (e.l && e.r) {
        const lt = _itemStamp(e.l, localT), rt = _itemStamp(e.r, remoteT);
        if (lt !== rt) {
          win = lt > rt ? e.l : e.r;
        } else {
          /*@3.FISJ.54*/
          win = _canonStr(e.l) >= _canonStr(e.r) ? e.l : e.r;
        }
        at = Math.max(lt, rt);
      } else {
        win = e.l || e.r;
        at = _itemStamp(win, e.l ? localT : remoteT);
      }
      /*@3.FISJ.55*/
      const buried = dead[_tk(path, id)];
      if (buried != null && Number(buried) >= at) continue;
      out.push(win);
    }
    out.sort((x, y) => String(x.id).localeCompare(String(y.id)));
    return out;
  }

  function mergeById(localRaw, localT, remoteRaw, remoteT, tomb) {
    let a, b;
    try { a = JSON.parse(localRaw); b = JSON.parse(remoteRaw); } catch (e) { return null; }
    if (!Array.isArray(a) || !Array.isArray(b)) return null;   /*@3.FISJ.56*/
    return JSON.stringify(_mergeIdArr(a, b, localT, remoteT, tomb || {}, ''));
  }

  /*@3.FISJ.57*/
  const ENV_PLAIN = 0;

  /*@3.FISJ.58*/
  function unwrap(raw) {
    if (typeof raw !== 'string' || raw.charCodeAt(0) !== 123) return raw;   /*@3.FISJ.59*/
    try {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && typeof o.e === 'number' && 'v' in o) {
        if (o.e === ENV_PLAIN) return o.v;
        return null;      /*@3.FISJ.60*/
      }
    } catch (e) {}
    return raw;           /*@3.FISJ.61*/
  }
  /*@3.FISJ.62*/
  function wrap(raw) { return raw; }

  /*@3.FISJ.63*/
  function _deepMerge(l, r, localT, remoteT, dead, path) {
    if (_isIdArr(l) && _isIdArr(r)) return _mergeIdArr(l, r, localT, remoteT, dead, path);

    if (_isObj(l) && _isObj(r)) {
      const out = {};
      const keys = Object.keys(l).concat(Object.keys(r).filter(k => !(k in l))).sort();
      for (const k of keys) {
        const hasL = Object.prototype.hasOwnProperty.call(l, k);
        const hasR = Object.prototype.hasOwnProperty.call(r, k);
        const p = path ? path + '/' + k : k;
        if (hasL && hasR) { out[k] = _deepMerge(l[k], r[k], localT, remoteT, dead, p); continue; }

        /*@3.FISJ.64*/
        const side = hasL ? l[k] : r[k];
        const at = hasL ? localT : remoteT;
        const gone = dead[p];   /*@3.FISJ.65*/
        if ((_isObj(side) || _isArr(side)) && gone != null && Number(gone) >= at) continue;
        out[k] = side;
      }
      return out;
    }

    if (localT !== remoteT) return localT > remoteT ? l : r;
    return _canonStr(l) >= _canonStr(r) ? l : r;
  }

  /*@3.FISJ.66*/
  function mergeDeep(localRaw, localT, remoteRaw, remoteT, tomb) {
    let a, b;
    try { a = JSON.parse(localRaw); b = JSON.parse(remoteRaw); } catch (e) { return null; }
    if (!((_isObj(a) && _isObj(b)) || (_isIdArr(a) && _isIdArr(b)))) return null;
    return _canonStr(_deepMerge(a, b, localT, remoteT, tomb || {}, ''));
  }

  /*@3.FISJ.67*/
  let db = null;
  let pushLastError = null;
  let userKey = null;
  let syncStatus = 'offline';   /*@3.FISJ.68*/
  let pushTimer = null;
  let statusDot = null;
  let isSyncing = false;

  /*@3.FISJ.69*/
  const T = {
    ar: {
      firstTitle: 'مزامنة الأجهزة',
      firstBody: 'أنشئ مفتاحاً شخصياً لحفظ بياناتك على السحابة ومزامنتها بين أجهزتك — بدون تسجيل.',
      keyLabel: 'مفتاح خزنتك — انسخه واحفظه',
      keyPlaceholder: 'الصق مفتاحاً موجوداً، أو استعمل المولَّد',
      randomBtn: 'توليد عشوائي',
      saveBtn: 'حفظ وتفعيل المزامنة',
      skipBtn: 'تخطي — تعمل بدون مزامنة',
      keyError: 'مفتاح غير صالح. استعمل زرّ التوليد، أو الصق مفتاح خزنتك كاملاً.',
      modalTitle: 'مزامنة الأجهزة',
      yourKey: 'مفتاحك الحالي',
      copyBtn: 'نسخ',
      copied: 'تم النسخ',
      statusOnline: 'متصل',
      statusOffline: 'غير متصل',
      statusSyncing: 'جاري المزامنة...',
      statusError: 'خطأ في الاتصال',
      statusPending: 'تغييراتٌ لم تُرفع بعد',
      lastSync: 'آخر مزامنة',
      syncNowBtn: 'مزامنة الآن',
      changeTitle: 'انتقل لجهاز آخر',
      changeBody: 'أدخل مفتاح جهازك الآخر لاستيراد بياناته:',
      changeInput: 'المفتاح (ABD12345)',
      importBtn: 'استيراد من هذا المفتاح',
      importConfirm: 'هذا سيستبدل بياناتك الحالية بيانات المفتاح الآخر. تأكد؟',
      importDone: 'تم الاستيراد بنجاح',
      importFail: 'لم يُعثر على بيانات لهذا المفتاح',
      changeKeyBtn: 'تغيير مفتاحي',
      changeKeyWarn: 'تغيير المفتاح لن يحذف بياناتك القديمة من السحابة. تأكد؟',
      warning: 'المفتاح هو وصولك الوحيد — احفظه بأمان',
      closeBtn: 'إغلاق',
      never: 'لم يتم بعد',
    },
    en: {
      firstTitle: 'Device Sync',
      firstBody: 'Create a personal key to save your data to the cloud and sync across devices — no registration needed.',
      keyLabel: 'Your vault key — copy and keep it',
      keyPlaceholder: 'Paste an existing key, or use the generator',
      randomBtn: 'Random',
      saveBtn: 'Save & Enable Sync',
      skipBtn: 'Skip — work without sync',
      keyError: 'Invalid key. Use the generate button, or paste your full vault key.',
      modalTitle: 'Device Sync',
      yourKey: 'Your current key',
      copyBtn: 'Copy',
      copied: 'Copied',
      statusOnline: 'Connected',
      statusOffline: 'Offline',
      statusSyncing: 'Syncing...',
      statusError: 'Connection error',
      statusPending: 'Changes not uploaded yet',
      lastSync: 'Last sync',
      syncNowBtn: 'Sync Now',
      changeTitle: 'Switch to another device',
      changeBody: 'Enter the key from your other device to import its data:',
      changeInput: 'Key (ABD12345)',
      importBtn: 'Import from this key',
      importConfirm: 'This will replace your current data with data from the other key. Confirm?',
      importDone: 'Import successful',
      importFail: 'No data found for this key',
      changeKeyBtn: 'Change my key',
      changeKeyWarn: 'Changing your key won\'t delete your old cloud data. Confirm?',
      warning: 'Your key is your only access — keep it safe',
      closeBtn: 'Close',
      never: 'Never',
    },
  };
  function t(k) {
    const lang = localStorage.getItem('garden_lang') || 'ar';
    return T[lang]?.[k] || T.ar[k] || k;
  }
  function isRTL() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }

  /*@3.FISJ.70*/
  function injectCSS() {
    if (document.getElementById('garden-sync-css')) return;
    const style = document.createElement('style');
    style.id = 'garden-sync-css';
    style.textContent = `
.sync-header-btn .sync-status-dot.synced { background: #10b981; }
.sync-header-btn .sync-status-dot.loading { background: #fbbf24; animation: syncPulse 1s ease-in-out infinite; }
.sync-header-btn .sync-status-dot.error { background: #ef4444; }
.sync-header-btn .sync-status-dot.pending { background: #f59e0b; }
.sync-header-btn .sync-status-dot.locked { background: #a78bfa; }

/* ── Desktop header sync icon ── */
.sync-header-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0.3rem;
  border-radius: var(--radius-md);
  transition: opacity 0.2s;
  opacity: 0.7;
  -webkit-tap-highlight-color: transparent;
}
.sync-header-btn:hover { opacity: 1; }
.sync-header-btn .sync-status-dot {
  position: absolute;
  bottom: 1px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--gray-500);
}
[dir="rtl"] .sync-header-btn .sync-status-dot { left: 1px; }
[dir="ltr"] .sync-header-btn .sync-status-dot { right: 1px; }

@keyframes syncPulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

/* ── Overlay ── */
.sync-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: syncFadeIn 0.2s ease;
}
@keyframes syncFadeIn { from { opacity:0 } to { opacity:1 } }

/* ── Modal ── */
.sync-modal {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  animation: syncSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes syncSlideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }

.sync-modal-title {
  font-size: 1.1rem;
  font-weight: 900;
  margin-bottom: 0.25rem;
}
.sync-modal-body {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.6;
}

/* Key display box */
.sync-key-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}
.sync-key-display {
  flex: 1;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  font-family: 'JetBrains Mono', monospace;
  color: #a78bfa;
}
.sync-key-part { color: var(--text-primary); }
.sync-key-sep  { color: var(--text-muted); margin: 0 0.1em; }

/* Status row */
.sync-status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
}
.sync-status-label { flex: 1; }
.sync-status-label.synced  { color: #10b981; }
.sync-status-label.loading { color: #fbbf24; }
.sync-status-label.error   { color: #ef4444; }
.sync-status-label.pending { color: #f59e0b; }

/* Input */
.sync-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  transition: border-color 0.2s;
}
.sync-input:focus { outline: none; border-color: #a78bfa; }
.sync-input.error { border-color: #ef4444; }

.sync-input-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}
.sync-input-error {
  font-size: 0.75rem;
  color: #ef4444;
  min-height: 18px;
  margin-bottom: 0.5rem;
}

/* Divider */
.sync-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 700;
}
.sync-divider::before, .sync-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* Import section */
.sync-import-section {
  margin-bottom: 1rem;
}
.sync-import-section .sync-input-label {
  margin-top: 0;
}

/* Warning */
.sync-warning {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 0.75rem;
  padding: 0.4rem 0.5rem;
  background: rgba(251,191,36,0.07);
  border-radius: var(--radius-sm);
}

/* Buttons */
.sync-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  margin-bottom: 0.4rem;
}
.sync-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sync-btn-primary  { background: #a78bfa; color: #fff; }
.sync-btn-primary:hover:not(:disabled)  { background: #9167f5; }
.sync-btn-secondary { background: var(--bg-elevated); color: var(--text-secondary); border: 1.5px solid var(--border-color); }
.sync-btn-secondary:hover:not(:disabled) { border-color: var(--border-hover); color: var(--text-primary); }
.sync-btn-danger  { background: rgba(239,68,68,0.1); color: #ef4444; border: 1.5px solid rgba(239,68,68,0.3); }
.sync-btn-danger:hover:not(:disabled)  { background: rgba(239,68,68,0.18); }
.sync-btn-sm      { padding: 0.4rem 0.75rem; font-size: 0.78rem; width: auto; margin-bottom: 0; }

/* Toast */
.sync-toast {
  position: fixed;
  bottom: 1.5rem;
  z-index: 3000;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 4px 20px var(--shadow-base);
  animation: syncFadeIn 0.2s ease;
  pointer-events: none;
}
[dir="rtl"] .sync-toast { left: 50%; transform: translateX(-50%); }
[dir="ltr"] .sync-toast { left: 50%; transform: translateX(-50%); }
.sync-toast.success { border-color: #10b981; color: #10b981; }
.sync-toast.error   { border-color: #ef4444; color: #ef4444; }

/* First-visit modal specific */
.sync-first-random-row {
  display: flex;
  gap: 0.4rem;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}
.sync-first-random-row .sync-input {
  margin-bottom: 0;
  flex: 1;
}
    `;
    document.head.appendChild(style);
  }

  /*@3.FISJ.71*/
  function getKey() { return localStorage.getItem(SYNC_KEY_LS) || null; }

  function validateKey(k) { return KEY_REGEX.test(k) || VAULT_REGEX.test(normalizeVault(k)); }

  /*@3.FISJ.72*/
  function generateRandomKey() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '0123456789';
    let k = '';
    for (let i = 0; i < 3; i++) k += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 5; i++) k += digits[Math.floor(Math.random() * digits.length)];
    return k;
  }

  function saveKey(k) {
    localStorage.setItem(SYNC_KEY_LS, k);
    userKey = k;
  }

  /*@3.FISJ.73*/
  const VAULT_SECRET_LS = 'garden_vault_secret';
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const VAULT_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

  function normalizeVault(s) {
    return String(s || '').toUpperCase().replace(/[\s-]/g, '')
      /*@3.FISJ.74*/
      .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  }

  function newVaultSecret() {
    const b = new Uint8Array(16);                 /*@3.FISJ.75*/
    crypto.getRandomValues(b);
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < b.length; i++) {
      val = (val << 8) | b[i]; bits += 8;
      while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out.slice(0, 26);
  }

  function prettyVault(s) {
    return normalizeVault(s).replace(/(.{5})(?=.)/g, '$1-');   /*@3.FISJ.76*/
  }

  /*@3.FISJ.77*/
  async function vaultDocId(secret) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('garden-vault:' + normalizeVault(secret)));
    return 'v' + [...new Uint8Array(d)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /*@3.FISJ.78*/
  async function adoptVaultSecret(secret) {
    const s = normalizeVault(secret);
    if (!VAULT_REGEX.test(s)) throw new Error('bad-secret');
    const id = await vaultDocId(s);
    localStorage.setItem(VAULT_SECRET_LS, s);
    saveKey(id);
    /*@3.FISJ.215*/
    lock = { armed: false, pw: false, google: false, locked: false };
    lockAnnounced = false;
    /*@3.FISJ.79*/
    try {
      localStorage.removeItem(DEV_TOUCH_LS);
      touchDevice().then(ok => {
        if (ok) localStorage.setItem(DEV_TOUCH_LS, String(Date.now()));
      }).catch(() => {});
    } catch (e) {}
    return { secret: s, docId: id };
  }

  function currentVaultSecret() {
    const s = normalizeVault(localStorage.getItem(VAULT_SECRET_LS));
    return VAULT_REGEX.test(s) ? s : null;
  }

  /*@3.FISJ.80*/
  const PAIR_LEN = 12;
  const PAIR_TTL_MS = 180 * 1000;

  function newPairCode() {
    const b = new Uint8Array(PAIR_LEN);
    crypto.getRandomValues(b);
    let out = '';
    for (let i = 0; i < PAIR_LEN; i++) out += B32[b[i] % 32];
    return out;
  }
  function prettyPair(c) { return String(c || '').replace(/(.{4})(?=.)/g, '$1-'); }

  const _te = new TextEncoder();
  function _b64u(buf) {
    let s = '';
    new Uint8Array(buf).forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function _unb64u(s) {
    const t = String(s).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(t + '='.repeat((4 - t.length % 4) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function _sha256hex(s) {
    const d = await crypto.subtle.digest('SHA-256', _te.encode(s));
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function _pairKey(code, pid) {
    const base = await crypto.subtle.importKey('raw', _te.encode(code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: _te.encode(pid), iterations: 100000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  /*@3.FISJ.81*/
  async function startPairing() {
    const secret = currentVaultSecret();
    if (!secret) throw new Error('no-vault');
    await ensureEndpoints();
    const code = newPairCode();
    const pid = 'p' + (await _sha256hex('garden-pair:' + code)).slice(0, 32);
    const key = await _pairKey(code, pid);
    /*@3.FISJ.82*/
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, _te.encode(secret));
    /*@3.FISJ.83*/
    const blob = _b64u(iv) + _b64u(ct);
    /*@3.FISJ.222*/
    const vid = getKey() || '';
    const r = await fetch(syncEndpoint() + '/v1/pair', {
      method: 'POST', cache: 'no-store',
      headers: guardHeaders(vid, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ pid, blob, vault_id: vid }),
    });
    if (r.status === 401) await guardThrow(r);
    if (!r.ok) throw new Error('pair-store-failed');
    const pj = await r.json().catch(() => ({}));
    return {
      code, pretty: prettyPair(code), carriesUnlock: !!(pj && pj.carries_unlock),
      link: location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html#pair=' + code,
      expiresAt: Date.now() + PAIR_TTL_MS,
    };
  }

  /*@3.FISJ.84*/
  async function claimPairing(codeRaw) {
    const code = normalizeVault(codeRaw);
    if (code.length !== PAIR_LEN) throw new Error('bad-code');
    await ensureEndpoints();
    const pid = 'p' + (await _sha256hex('garden-pair:' + code)).slice(0, 32);
    const r = await fetch(syncEndpoint() + '/v1/pair/' + pid, { cache: 'no-store' });
    if (r.status === 404) throw new Error('pair-expired');
    if (!r.ok) throw new Error('pair-failed');
    const j = await r.json();
    const blob = String(j.blob || '');
    if (blob.length <= 16) throw new Error('pair-corrupt');
    const ivs = blob.slice(0, 16), cts = blob.slice(16);
    const key = await _pairKey(code, pid);
    let plain;
    try {
      plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: _unb64u(ivs) }, key, _unb64u(cts));
    } catch (e) {
      /*@3.FISJ.85*/
      throw new Error('bad-code');
    }
    const adopted = await adoptVaultSecret(new TextDecoder().decode(plain));
    /*@3.FISJ.223*/
    if (j.token) {
      setVaultTok(adopted.docId, j.token);
      lock = { armed: true, pw: lock.pw, google: lock.google, locked: false };
      lockAnnounced = false;
      /*@3.FISJ.231*/
      try {
        localStorage.removeItem(DEV_TOUCH_LS);
        touchDevice().then(function (ok) {
          if (ok) localStorage.setItem(DEV_TOUCH_LS, String(Date.now()));
        }).catch(function () {});
      } catch (e) {}
    }
    return adopted;
  }

  /*@3.FISJ.86*/
  const REC_ITER = 600000;

  function normEmail(e) { return String(e || '').trim().toLowerCase(); }

  async function _hkdf(keyBytes, info, bits) {
    const k = await crypto.subtle.importKey('raw', keyBytes, 'HKDF', false, ['deriveBits']);
    return crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: _te.encode(info) },
      k, bits);
  }
  function _hex(buf) {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function _unhex(h) {
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }

  /*@3.FISJ.87*/
  async function _recDerive(email, pass) {
    const eidHex = await _sha256hex('garden-rec:' + normEmail(email));
    const eid = 'e' + eidHex.slice(0, 32);
    const salt = await _hkdf(_unhex(eidHex), 'garden-recovery-salt-v1', 256);
    const base = await crypto.subtle.importKey('raw', _te.encode(String(pass)),
                                               'PBKDF2', false, ['deriveBits']);
    const K = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: REC_ITER, hash: 'SHA-256' },
      base, 256);
    const authBits = await _hkdf(new Uint8Array(K), 'auth', 256);
    const wrapBits = await _hkdf(new Uint8Array(K), 'wrap', 256);
    const authHash = await crypto.subtle.digest('SHA-256', authBits);
    const wrap = await crypto.subtle.importKey('raw', wrapBits, { name: 'AES-GCM' },
                                               false, ['encrypt', 'decrypt']);
    /*@3.FISJ.209*/
    const proofBits = await _hkdf(new Uint8Array(K), 'garden-sync-auth-v1', 256);
    return { eid, authHash: _hex(authHash), wrap, proof: _hex(proofBits) };
  }

  /*@3.FISJ.88*/
  const WEAK = ['12345678', '123456789', '1234567890', 'password', 'qwerty123',
                'iloveyou', 'sunshine', 'princess', 'football', 'password1',
                'abc12345', '11111111', '00000000', 'qwertyui'];
  function passIssue(p) {
    const v = String(p || '');
    if (v.length < 8) return 'short';
    if (WEAK.indexOf(v.toLowerCase()) >= 0) return 'weak';
    if (/^(.)\1+$/.test(v)) return 'weak';
    return null;
  }

  /*@3.FISJ.89*/
  async function saveRecEnvelope(email, pass) {
    const secret = currentVaultSecret();
    if (!secret) throw new Error('no-vault');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail(email))) throw new Error('bad-email');
    const issue = passIssue(pass);
    if (issue) throw new Error('weak-pass:' + issue);
    await ensureEndpoints();
    const d = await _recDerive(email, pass);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, d.wrap, _te.encode(secret));
    const r = await fetch(syncEndpoint() + '/v1/recovery', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      /*@3.FISJ.90*/
      body: JSON.stringify({ eid: d.eid, auth_hash: d.authHash,
                             blob: _b64u(iv) + _b64u(ct), vault_id: getKey() || '' }),
    });
    if (r.status === 429) throw new Error('eid-full');
    if (!r.ok) throw new Error('save-failed');
    localStorage.setItem('garden_recovery_set', String(Date.now()));
    return true;
  }

  /*@3.FISJ.91*/
  async function openRecovery(email, pass) {
    await ensureEndpoints();
    const d = await _recDerive(email, pass);
    const r = await fetch(syncEndpoint() + '/v1/recovery/open', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eid: d.eid, auth_hash: d.authHash }),
    });
    if (r.status === 429) throw new Error('too-many');
    /*@3.FISJ.92*/
    if (!r.ok) throw new Error('no-match');
    const j = await r.json();
    const blob = String(j.blob || '');
    if (blob.length <= 16) throw new Error('no-match');
    let plain;
    try {
      plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: _unb64u(blob.slice(0, 16)) }, d.wrap, _unb64u(blob.slice(16)));
    } catch (e) { throw new Error('no-match'); }
    const adopted = await adoptVaultSecret(new TextDecoder().decode(plain));
    /*@3.FISJ.216*/
    try { await guardPost('unlock', { method: 'pw', proof: d.proof, name: deviceName() }); }
    catch (e) {}
    return adopted;
  }

  /*@3.FISJ.93*/
  const GSI_SRC = 'https://accounts.google.com/gsi/client';
  function googleClientId() {
    return (window.GardenEndpoints && window.GardenEndpoints.googleClientId) || '';
  }
  function googleAvailable() { return !!googleClientId(); }

  let _gsiP = null;
  function ensureGSI() {
    if (window.google && window.google.accounts) return Promise.resolve(true);
    if (!googleAvailable()) return Promise.resolve(false);
    if (_gsiP) return _gsiP;
    _gsiP = new Promise(resolve => {
      const el = document.createElement('script');
      el.src = GSI_SRC;
      el.async = true;
      el.onload = () => resolve(!!(window.google && window.google.accounts));
      el.onerror = () => resolve(false);
      document.head.appendChild(el);
      setTimeout(() => resolve(!!(window.google && window.google.accounts)), 8000);
    });
    return _gsiP;
  }

  /*@3.FISJ.94*/
  function googleIdToken() {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.accounts) return reject(new Error('gsi-unavailable'));
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId(),
          callback: (r) => (r && r.credential) ? resolve(r.credential) : reject(new Error('gsi-cancelled')),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt();
      } catch (e) { reject(e); }
    });
  }

  /*@3.FISJ.95*/
  async function googleRender(box, done, opts) {
    if (!box) return false;
    if (!(await ensureGSI())) { done && done(new Error('gsi-unavailable')); return false; }
    await ensureEndpoints();
    var busy = false;
    window.google.accounts.id.initialize({
      client_id: googleClientId(),
      auto_select: false,
      cancel_on_tap_outside: true,
      /*@3.FISJ.220*/
      callback: function (r) {
        if (busy) return;
        if (!r || !r.credential) { done && done(new Error('gsi-cancelled')); return; }
        busy = true;
        var work = (opts && opts.mode === 'unlock')
          ? guardPost('unlock', { method: 'google', id_token: r.credential, name: deviceName() })
          : gsiExchange(r.credential);
        Promise.resolve(work).then(function () { done && done(null); })
          .catch(function (e) { done && done(e); })
          .then(function () { busy = false; });
      },
    });
    box.innerHTML = '';
    window.google.accounts.id.renderButton(box, {
      type: 'standard', shape: 'pill', size: 'large',
      text: 'continue_with', logo_alignment: 'center',
      theme: (opts && opts.theme) || 'filled_black',
      locale: (localStorage.getItem('garden_lang') === 'en') ? 'en' : 'ar',
    });
    return true;
  }

  /*@3.FISJ.96*/
  async function gsiExchange(token) {
    const secret = currentVaultSecret();
    if (secret) {
      await saveRecoveryGoogleWith(token);
      /*@3.FISJ.217*/
      await guardPost('arm', { door: 'google', id_token: token, name: deviceName() });
      return true;
    }
    const r = await fetch(syncEndpoint() + '/v1/recovery/google/open', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: token }),
    });
    if (!r.ok) throw new Error('no-match');
    const j = await r.json();
    if (!j.secret) throw new Error('no-match');
    const adopted = await adoptVaultSecret(j.secret);
    /*@3.FISJ.218*/
    try { await guardPost('unlock', { method: 'google', id_token: token, name: deviceName() }); }
    catch (e) {}
    return adopted;
  }

  async function saveRecoveryGoogleWith(token) {
    const secret = currentVaultSecret();
    if (!secret) throw new Error('no-vault');
    await ensureEndpoints();
    const r = await fetch(syncEndpoint() + '/v1/recovery/google', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: token, secret }),
    });
    if (!r.ok) throw new Error('save-failed');
    localStorage.setItem('garden_recovery_set', String(Date.now()));
    return true;
  }

  async function saveRecoveryGoogle() {
    if (!currentVaultSecret()) throw new Error('no-vault');
    if (!(await ensureGSI())) throw new Error('gsi-unavailable');
    await ensureEndpoints();
    return await gsiExchange(await googleIdToken());
  }

  async function openRecoveryGoogle() {
    if (!(await ensureGSI())) throw new Error('gsi-unavailable');
    await ensureEndpoints();
    return await gsiExchange(await googleIdToken());
  }

  /*@3.FISJ.219*/

  async function guardUrl(act) {
    await ensureEndpoints();
    const id = await oracleDocId(getKey() || '');
    return { id, url: syncEndpoint() + '/v1/vault/' + encodeURIComponent(id) + '/' + act };
  }

  /*@3.FISJ.213*/
  async function guardState() {
    if (!getKey()) return { armed: false, pw: false, google: false, unlocked: false, sessions: 0 };
    const g = await guardUrl('guard');
    const r = await fetch(g.url, { cache: 'no-store', headers: guardHeaders(g.id) });
    if (!r.ok) throw new Error('guard-' + r.status);
    const j = await r.json();
    lock = { armed: !!j.armed, pw: !!j.pw, google: !!j.google,
             locked: !!j.armed && !j.unlocked };
    if (!lock.locked) lockAnnounced = false;
    return j;
  }

  async function guardPost(act, body) {
    const g = await guardUrl(act);
    /*@3.FISJ.230*/
    const r = await fetch(g.url, {
      method: 'POST', cache: 'no-store',
      headers: guardHeaders(g.id, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(Object.assign({ dev: deviceId() }, body || {})),
    });
    let j = null;
    try { j = await r.json(); } catch (e) {}
    if (r.status === 401 && j && j.error === 'vault_locked') throw lockFrom(j);
    if (r.status === 401) throw new Error('no-match');
    if (r.status === 409) throw new Error('google-in-use');
    if (r.status === 429) throw new Error('too-many');
    if (r.status === 503) throw new Error('guard-unavailable');
    if (!r.ok) throw new Error('guard-' + r.status);
    /*@3.FISJ.211*/
    if (j && j.token) {
      setVaultTok(g.id, j.token);
      lockClear();
      setStatus(pushPending ? 'pending' : 'synced');
    }
    return j || {};
  }

  /*@3.FISJ.210*/
  async function saveRecovery(email, pass) {
    await saveRecEnvelope(email, pass);
    const d = await _recDerive(email, pass);
    return await guardPost('arm', { door: 'pw', proof: d.proof, name: deviceName() });
  }
  const armPassword = saveRecovery;

  async function unlockPassword(email, pass) {
    const d = await _recDerive(email, pass);
    return await guardPost('unlock', { method: 'pw', proof: d.proof, name: deviceName() });
  }

  /*@3.FISJ.212*/
  async function armGoogle() {
    if (!currentVaultSecret()) throw new Error('no-vault');
    if (!(await ensureGSI())) throw new Error('gsi-unavailable');
    const token = await googleIdToken();
    await saveRecoveryGoogleWith(token);
    return await guardPost('arm', { door: 'google', id_token: token, name: deviceName() });
  }

  async function unlockGoogle() {
    if (!(await ensureGSI())) throw new Error('gsi-unavailable');
    const token = await googleIdToken();
    return await guardPost('unlock', { method: 'google', id_token: token, name: deviceName() });
  }

  async function disarmGuard(door) {
    const j = await guardPost('disarm', { door: door || 'all' });
    if (j.state && !j.state.armed) {
      const g = await guardUrl('guard');
      setVaultTok(g.id, '');
      lock = { armed: false, pw: false, google: false, locked: false };
    }
    return j;
  }

  async function revokeSessions(all) {
    const j = await guardPost('revoke', { all: !!all });
    if (all) {
      const g = await guardUrl('guard');
      setVaultTok(g.id, '');
      lock.locked = true;
    }
    return j;
  }

  /*@3.FISJ.226*/
  async function revokeSession(sid) {
    if (!/^[0-9a-f]{12}$/.test(String(sid || ''))) throw new Error('bad-sid');
    const j = await guardPost('revoke', { sid: String(sid) });
    /*@3.FISJ.227*/
    if (j && j.state && !j.state.unlocked && j.state.armed) {
      const g = await guardUrl('guard');
      setVaultTok(g.id, '');
      lock.locked = true;
    }
    return j;
  }

  function lockInfo() {
    return { armed: lock.armed, pw: lock.pw, google: lock.google, locked: lock.locked };
  }

  /*@3.FISJ.97*/
  async function forgetRecovery() {
    const secret = currentVaultSecret();
    if (!secret) throw new Error('no-vault');
    await ensureEndpoints();
    const r = await fetch(syncEndpoint() + '/v1/recovery/forget', {
      method: 'POST', cache: 'no-store',
      headers: guardHeaders(getKey(), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ secret, vault_id: getKey() || '' }),
    });
    if (!r.ok) throw new Error('forget-failed');
    localStorage.removeItem('garden_recovery_set');
    return true;
  }

  /*@3.FISJ.98*/
  function disconnectDevice() {
    try {
      /*@3.FISJ.224*/
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.indexOf(VAULT_TOK_LS) === 0 || k.indexOf(VAULT_MAP_LS) === 0)) kill.push(k);
      }
      kill.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(SYNC_KEY_LS);
      localStorage.removeItem(VAULT_SECRET_LS);
      localStorage.removeItem('garden_recovery_set');
      localStorage.removeItem(DEV_TOUCH_LS);
      localStorage.setItem(SYNC_DECLINED_LS, '1');
    } catch (e) {}
    setPushPending(false);
    /*@3.FISJ.225*/
    lock = { armed: false, pw: false, google: false, locked: false };
    lockAnnounced = false;
    userKey = null;
    setStatus('offline');
    return true;
  }

  /*@3.FISJ.99*/
  function recoveryFileText() {
    const s = currentVaultSecret();
    if (!s) return null;
    return [
      'الحديقة الرقمية — مفتاحُ الاسترجاع',
      '═══════════════════════════════════',
      '',
      '   ' + prettyVault(s),
      '',
      'هذا المفتاحُ هو حسابُك. من يملكه يفتح بياناتك.',
      'ولا نملك نحن نسخةً منه — فاحتفظ بهذا الملفِّ في مكانٍ آمن.',
      '',
      'لاستعادة بياناتك على جهازٍ جديد: افتح الموقع ⇐ الإعدادات ⇐',
      'المزامنة ⇐ «عندي مفتاح» ⇐ ألصق المفتاحَ أعلاه.',
      '',
      'أُنشئ في: ' + new Date().toISOString().slice(0, 10),
      'https://libbard.github.io/',
      '',
    ].join('\n');
  }
  function downloadRecoveryFile() {
    const txt = recoveryFileText();
    if (!txt) return false;
    /*@3.FISJ.100*/
    const blob = new Blob(['\ufeff' + txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'الحديقة-الرقمية-مفتاح-الاسترجاع.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  /*@3.FISJ.101*/
  let _qrP = null;
  function ensureQR() {
    if (window.GardenQR) return Promise.resolve(true);
    if (_qrP) return _qrP;
    _qrP = new Promise(resolve => {
      let el = document.querySelector('script[data-garden-qr]');
      if (!el) {
        el = document.createElement('script');
        el.src = ROOT + 'shared/qr.js';
        el.setAttribute('data-garden-qr', '1');
        document.head.appendChild(el);
      }
      const done = () => resolve(!!window.GardenQR);
      el.addEventListener('load', done);
      el.addEventListener('error', done);
      setTimeout(done, 6000);
    });
    return _qrP;
  }

  /*@3.FISJ.102*/
  async function recoveryQR(opts) {
    const s = currentVaultSecret();
    if (!s) return null;
    if (!(await ensureQR())) return null;
    return window.GardenQR.svg(
      location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html#vault=' + s,
      Object.assign({ label: 'مفتاح الاسترجاع' }, opts || {}));
  }

  /*@3.FISJ.103*/
  async function pairQR(link, opts) {
    if (!link || !(await ensureQR())) return null;
    return window.GardenQR.svg(link, Object.assign({ label: 'رمز اقتران' }, opts || {}));
  }

  /*@3.FISJ.104*/
  const DEVICE_LS = 'garden_device_id';
  /*@3.FISJ.234*/
  const DEV_TOUCH_LS = 'garden_device_touch2';
  function deviceId() {
    let d = localStorage.getItem(DEVICE_LS);
    if (!/^d[0-9a-f]{16}$/.test(d || '')) {
      const b = new Uint8Array(8);
      crypto.getRandomValues(b);
      d = 'd' + [...b].map(x => x.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_LS, d);
    }
    return d;
  }
  /*@3.FISJ.105*/
  function deviceName() {
    const ua = navigator.userAgent || '';
    const br = /Edg\//.test(ua) ? 'إيدج' : /OPR\//.test(ua) ? 'أوبرا'
             : /Firefox\//.test(ua) ? 'فايرفوكس'
             : /Chrome\//.test(ua) ? 'كروم'
             : /Safari\//.test(ua) ? 'سفاري' : 'متصفّح';
    const os = /Android/.test(ua) ? 'أندرويد'
             : /iPhone|iPad|iPod/.test(ua) ? 'آيفون'
             : /Windows/.test(ua) ? 'ويندوز'
             : /Mac OS X/.test(ua) ? 'ماك'
             : /Linux/.test(ua) ? 'لينكس' : '';
    return os ? br + ' · ' + os : br;
  }
  async function touchDevice() {
    const id = getKey();
    if (!id || !usingOracle() || !ORACLE_ID.test(String(id))) return false;
    try {
      const r = await fetch(syncEndpoint() + '/v1/devices/' + id, {
        method: 'POST', cache: 'no-store',
        headers: guardHeaders(id, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ device_id: deviceId(), name: deviceName() }),
      });
      return r.ok;
    } catch (e) { return false; }
  }
  /*@3.FISJ.233*/
  const NO_DEVS = { devices: [], armed: false, orphans: 0 };
  async function listDevices() {
    const id = getKey();
    if (!id || !usingOracle() || !ORACLE_ID.test(String(id))) return NO_DEVS;
    try {
      const r = await fetch(syncEndpoint() + '/v1/devices/' + id,
                            { cache: 'no-store', headers: guardHeaders(id) });
      if (!r.ok) return NO_DEVS;
      const j = await r.json();
      const me = deviceId();
      return {
        devices: (j.devices || []).map(d => Object.assign({ isMe: d.device_id === me }, d)),
        armed: !!j.armed,
        orphans: Number(j.orphans || 0),
      };
    } catch (e) { return NO_DEVS; }
  }
  /*@3.FISJ.232*/
  async function forgetDevice(did) {
    const id = getKey();
    if (!id || !usingOracle()) return { ok: false, revoked: 0, armed: false };
    try {
      const r = await fetch(syncEndpoint() + '/v1/devices/' + id + '/' + did,
                            { method: 'DELETE', cache: 'no-store', headers: guardHeaders(id) });
      let j = null;
      try { j = await r.json(); } catch (e) {}
      if (!r.ok) return { ok: false, revoked: 0, armed: !!(j && j.armed) };
      return { ok: true, revoked: Number((j && j.revoked) || 0), armed: !!(j && j.armed) };
    } catch (e) { return { ok: false, revoked: 0, armed: false }; }
  }

  /*@3.FISJ.106*/
  const LEGACY_DOC_LS = 'garden_vault_legacy';
  const LEGACY_UNTIL_LS = 'garden_vault_legacy_until';
  const DUAL_WRITE_MS = 14 * 24 * 3600 * 1000;

  function legacyMirror() {
    const id = localStorage.getItem(LEGACY_DOC_LS);
    const until = Number(localStorage.getItem(LEGACY_UNTIL_LS) || 0);
    return (id && until > Date.now()) ? id : null;
  }

  async function upgradeLegacyVault() {
    const oldId = getKey();
    /*@3.FISJ.107*/
    if (usingOracle()) throw new Error('not-applicable-on-oracle');
    if (!db) throw new Error('offline');
    if (!oldId || currentVaultSecret()) throw new Error('not-legacy');

    /*@3.FISJ.108*/
    await pullAll(oldId);

    const secret = newVaultSecret();
    const newId = await vaultDocId(secret);

    /*@3.FISJ.109*/
    const snap = await db.collection(collectionName()).doc(oldId).get();
    const data = snap.exists ? (snap.data() || {}) : {};
    await db.collection(collectionName()).doc(newId).set(
      Object.assign({}, data, { migrated_from: oldId, migrated_at: Date.now() }),
      { merge: true }
    );

    /*@3.FISJ.110*/
    await db.collection(collectionName()).doc(oldId).set(
      { moved_to: newId, moved_at: Date.now() }, { merge: true }
    );

    localStorage.setItem(LEGACY_DOC_LS, oldId);
    localStorage.setItem(LEGACY_UNTIL_LS, String(Date.now() + DUAL_WRITE_MS));
    localStorage.setItem(VAULT_SECRET_LS, secret);
    saveKey(newId);
    await pullAll(newId);

    return { secret: secret, pretty: prettyVault(secret), docId: newId, mirrorUntil: Date.now() + DUAL_WRITE_MS };
  }

  /*@3.FISJ.111*/
  async function pendingVaultMove() {
    const id = getKey();
    if (usingOracle() || !db || !id || currentVaultSecret()) return null;
    try {
      const snap = await db.collection(collectionName()).doc(id).get();
      const to = snap.exists && snap.data() && snap.data().moved_to;
      return (to && to !== id) ? String(to) : null;
    } catch (e) { return null; }
  }

  /*@3.FISJ.112*/
  async function consumeVaultLink() {
    const m = String(location.hash || '').match(/vault=([0-9A-Za-z-]{20,40})/);
    if (!m) return false;
    try {
      await adoptVaultSecret(m[1]);
      history.replaceState(null, '', location.pathname + location.search);
      return true;
    } catch (e) {
      history.replaceState(null, '', location.pathname + location.search);
      return false;
    }
  }

  /*@3.FISJ.113*/
  let pairLinkError = '';
  async function consumePairLink() {
    const m = String(location.hash || '').match(/[#&]pair=([0-9A-Za-z-]{10,20})/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search);
    try { await claimPairing(m[1]); return true; }
    catch (e) {
      /*@3.FISJ.228*/
      pairLinkError = (e && e.message) || 'pair-failed';
      return false;
    }
  }

  /*@3.FISJ.114*/
  async function loadFirebase(callback) {
    /*@3.FISJ.115*/
    if (usingOracle()) { storeReady = true; callback(); return; }

    if (window.firebase?.firestore) { storeReady = !!db; callback(); return; }

    /*@3.FISJ.116*/
    let answered = false;
    const answer = () => { if (!answered) { answered = true; callback(); } };

    const BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VER}/`;
    let loaded = 0;
    const scripts = [
      BASE + 'firebase-app-compat.js',
      BASE + 'firebase-firestore-compat.js',
    ];

    function tryInit() {
      loaded++;
      if (loaded < scripts.length) return;
      (async () => {
        try {
          const config = await getFirebaseConfig();
          if (!firebase.apps.length) firebase.initializeApp(config);
          db = firebase.firestore();
          storeReady = true;
          /*@3.FISJ.117*/
          db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
        } catch (e) {
          console.warn('[Sync] Firebase init failed:', e);
          db = null;
          storeReady = false;
          setStatus('error');
        }
        answer();
      })();
    }

    scripts.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = tryInit;
      s.onerror = () => {
        console.warn('[Sync] Failed to load:', src);
        setStatus('error');
        answer();                 /*@3.FISJ.118*/
      };
      document.head.appendChild(s);
    });
    /*@3.FISJ.119*/
    setTimeout(answer, 15000);
  }

  /*@3.FISJ.120*/
  function setStatus(status) {
    syncStatus = status;
    document.querySelectorAll('.sync-status-dot').forEach(dot => {
      dot.className = 'sync-status-dot ' + status;
    });
  }

  function showToast(msg, type = 'success') {
    const old = document.getElementById('sync-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'sync-toast';
    el.className = `sync-toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), 2800);
  }

  /*@3.FISJ.121*/

  /*@3.FISJ.122*/
  function getSyncableKeys() {
    const result = new Set(FIXED_SYNC_KEYS);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || NEVER_SYNC.has(k)) continue;
      for (const pat of DYNAMIC_PATTERNS) {
        if (pat.test(k)) { result.add(k); break; }
      }
    }
    return [...result].filter(k => localStorage.getItem(k) !== null);
  }

  /*@3.FISJ.201*/
  const PUSH_MAX_KEYS  = 120;
  const PUSH_MAX_BYTES = 240 * 1024;
  const PUSH_MAX_VALUE = 200 * 1024;

  function chunkPayload(payload) {
    const out = [];
    let cur = {}, n = 0, b = 0;
    const flush = () => { if (n > 0) { out.push(cur); cur = {}; n = 0; b = 0; } };
    for (const fk of Object.keys(payload)) {
      const size = fk.length + String(payload[fk].v).length + 32;
      const lone = size > PUSH_MAX_VALUE;
      if (lone || n + 1 > PUSH_MAX_KEYS || b + size > PUSH_MAX_BYTES) flush();
      cur[fk] = payload[fk]; n++; b += size;
      if (lone) flush();
    }
    flush();
    return out;
  }

  /*@3.FISJ.123*/
  async function pushAll(key) {
    if (!storeReady || !key) return;
    setStatus('loading');
    const now = Date.now();

    const syncableKeys = getSyncableKeys();
    if (syncableKeys.length === 0) { setStatus('synced'); return; }

    /*@3.FISJ.124*/
    const payload = {};
    syncableKeys.forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw === null) return;
      let t = localStamp(k);
      if (!t) { t = hlcNow(); stampLocal(k, t); }   /*@3.FISJ.125*/
      payload[_fireKey(k)] = { v: wrap(raw), t: t };
    });

    const batches = chunkPayload(payload);
    let failed = 0, lastErr = null;

    for (const batch of batches) {
      try {
        /*@3.FISJ.126*/
        await storeMerge(key, batch);

        /*@3.FISJ.127*/
        const mirror = legacyMirror();
        if (mirror && mirror !== key) {
          try {
            await storeMerge(mirror, batch, { mirrored_from: key });
          } catch (e) { console.warn('[Sync] legacy mirror failed:', e); }
        }
      } catch (e) {
        failed++; lastErr = e;
        console.warn('[Sync] Push batch failed:', e && e.message);
      }
    }

    if (failed) {
      /*@3.FISJ.128*/
      if (lastErr && lastErr.quota) {
        setPushPending(false);
        pushLastError = lastErr.message;
        /*@3.FISJ.244*/
        pushQuota = { code: lastErr.code, key: lastErr.key,
                      bytes: lastErr.bytes, max: lastErr.max };
        setStatus('error');
        try {
          window.dispatchEvent(new CustomEvent('garden:syncQuota', { detail: {
            code: lastErr.code, key: lastErr.key, bytes: lastErr.bytes, max: lastErr.max
          } }));
        } catch (e) {}
        return;
      }
      setPushPending(true);
      pushLastError = String((lastErr && lastErr.message) || lastErr || 'push-failed');
      setStatus('error');
      return;
    }
    pushLastError = null;
    pushQuota = null;
    setStatus('synced');
    setPushPending(false);
    localStorage.setItem('garden_sync_last', String(now));
  }

  /*@3.FISJ.129*/
  async function pullAll(key) {
    if (!storeReady || !key) return;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await storeGet(key);
      if (!doc.exists) {
        /*@3.FISJ.130*/
        await pushAll(key);
        return;
      }

      const remote = doc.sync || {};
      let changed = false;
      let localHasNewer = false;

      Object.entries(remote).forEach(([fk, entry]) => {
        const lsKey = _localKey(fk);
        if (!lsKey || NEVER_SYNC.has(lsKey)) return;

        const localRaw = localStorage.getItem(lsKey);
        const remoteT = entry.t || 0;
        /*@3.FISJ.131*/
        const remoteV = unwrap(entry.v);
        if (remoteV === null) return;

        /*@3.FISJ.132*/
        hlcObserve(remoteT);
        if (MERGE_BY_ID.has(lsKey) || isDeepKey(lsKey)) hlcObserveItems(remoteV);
        else if (lsKey.indexOf(TOMB_PREFIX) === 0) {
          const rt = _readTomb(remoteV);
          for (const id in rt) hlcObserve(rt[id]);
        }

        /*@3.FISJ.133*/
        if (localRaw === remoteV) return;

        if (localRaw === null) {
          /*@3.FISJ.134*/
          localStorage.setItem(lsKey, remoteV);
          stampLocal(lsKey, remoteT);
          changed = true;
          return;
        }

        /*@3.FISJ.135*/
        let localT = localStamp(lsKey);
        if (!localT) {
          try {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed === 'object' && parsed.updated_at) {
              localT = new Date(parsed.updated_at).getTime();
            }
          } catch (e) { /*@3.FISJ.136*/ }
        }

        /*@3.FISJ.137*/
        if (lsKey.indexOf(TOMB_PREFIX) === 0) {
          const union = JSON.stringify(mergeTombs(localRaw, remoteV));
          if (union !== localRaw) {
            localStorage.setItem(lsKey, union);
            stampLocal(lsKey, Math.max(localT, remoteT));
            changed = true;
          }
          if (union !== remoteV) localHasNewer = true;
          return;
        }

        /*@3.FISJ.138*/
        if (MERGE_BY_ID.has(lsKey) || isDeepKey(lsKey)) {
          /*@3.FISJ.139*/
          const tombRemote = (remote[_fireKey(TOMB_PREFIX + lsKey)] || {}).v;
          const tomb = mergeTombs(localStorage.getItem(TOMB_PREFIX + lsKey), tombRemote);
          const merged = MERGE_BY_ID.has(lsKey)
            ? mergeById(localRaw, localT, remoteV, remoteT, tomb)
            : mergeDeep(localRaw, localT, remoteV, remoteT, tomb);
          if (merged !== null) {
            if (merged !== localRaw) {
              localStorage.setItem(lsKey, merged);
              /*@3.FISJ.140*/
              stampLocal(lsKey, Math.max(localT, remoteT));
              changed = true;
            }
            /*@3.FISJ.141*/
            if (merged !== remoteV) localHasNewer = true;
            return;
          }
          /*@3.FISJ.142*/
        }

        if (remoteT > localT) {
          localStorage.setItem(lsKey, remoteV);
          stampLocal(lsKey, remoteT);   /*@3.FISJ.143*/
          changed = true;
        } else if (localT > remoteT) {
          localHasNewer = true;
        }
      });

      /*@3.FISJ.144*/
      const syncableKeys = getSyncableKeys();
      const localHasMissingRemote = syncableKeys.some(k => remote[_fireKey(k)] === undefined);

      /*@3.FISJ.145*/
      if (localHasNewer || localHasMissingRemote) {
        await pushAll(key);
      }

      localStorage.setItem('garden_sync_last', String(Date.now()));
      /*@3.FISJ.146*/
      setStatus(pushPending ? 'pending' : 'synced');

      if (changed) {
        /*@3.FISJ.147*/
        window.dispatchEvent(new CustomEvent('garden:syncCompleted'));
      }
    } catch (e) {
      console.warn('[Sync] Pull failed:', e);
      setStatus('error');
    } finally {
      isSyncing = false;
    }
  }

  /*@3.FISJ.148*/
  async function importFromKey(otherKey) {
    if (!storeReady || !otherKey) return false;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await storeGet(otherKey);
      if (!doc.exists) { setStatus('synced'); return false; }

      const remote = doc.sync || {};
      if (Object.keys(remote).length === 0) { setStatus('synced'); return false; }

      /*@3.FISJ.149*/
      Object.entries(remote).forEach(([fk, entry]) => {
        const lsKey = _localKey(fk);
        /*@3.FISJ.150*/
        const impV = entry.v === undefined ? undefined : unwrap(entry.v);
        if (lsKey && !NEVER_SYNC.has(lsKey) && impV !== undefined && impV !== null) {
          if (localStorage.getItem(lsKey) !== impV) {
            localStorage.setItem(lsKey, impV);
          }
        }
      });

      setStatus('synced');
      window.dispatchEvent(new CustomEvent('garden:syncCompleted'));
      return true;
    } catch (e) {
      console.warn('[Sync] Import failed:', e);
      setStatus('error');
      return false;
    } finally {
      isSyncing = false;
    }
  }

  /*@3.FISJ.151*/
  function _fireKey(k) { return k.replace(/__/g, '____').replace(/_/g, '__').replace(/-/g, '--'); }
  /*@3.FISJ.236*/
  function _localKey(fk) { return fk.replace(/--/g, '-').replace(/__/g, '_').replace(/____/g, '__'); }

  /*@3.FISJ.152*/
  function schedulePush() {
    if (!userKey || !storeReady) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushAll(userKey), AUTO_PUSH_DEBOUNCE_MS);
  }

  /*@3.FISJ.153*/
  function _walkTrack(before, after, now, path, tomb, ctx, depth, bk) {
    if ((depth || 0) > 6) return;

    if (_isIdArr(after) && Array.isArray(before)) {
      const prev = {};
      before.forEach(x => { if (x && x.id != null) prev[String(x.id)] = _canonBk(x, bk); });
      const alive = new Set();
      after.forEach(x => {
        if (!x || x.id == null) return;
        const id = String(x.id);
        alive.add(id);
        const was = prev[id];
        if (was === undefined) {                    /*@3.FISJ.154*/
          if (!x.updated_at) { x.updated_at = now; ctx.touched = true; }
        } else if (_canonBk(x, bk) !== was) {       /*@3.FISJ.155*/
          x.updated_at = now; ctx.touched = true;
        }
      });
      Object.keys(prev).forEach(id => {
        if (!alive.has(id)) { tomb[_tk(path, id)] = now; ctx.gone = true; }
      });
      return;
    }

    if (_isObj(before) && _isObj(after)) {
      for (const k in before) {
        if (!Object.prototype.hasOwnProperty.call(before, k)) continue;
        const p = path ? path + '/' + k : k;
        if (!Object.prototype.hasOwnProperty.call(after, k)) {
          /*@3.FISJ.156*/
          if (_isObj(before[k]) || _isArr(before[k])) { tomb[p] = now; ctx.gone = true; }
          continue;
        }
        _walkTrack(before[k], after[k], now, p, tomb, ctx, (depth || 0) + 1);
      }
    }
  }

  function trackCollection(key, nextRaw) {
    let before, after;
    try {
      const raw = localStorage.getItem(key);
      after = JSON.parse(nextRaw);
      /*@3.FISJ.157*/
      before = (raw === null || raw === undefined)
        ? (Array.isArray(after) ? [] : {})
        : JSON.parse(raw);
    } catch (e) { return nextRaw; }
    if (!after || typeof after !== 'object') return nextRaw;

    /*@3.FISJ.158*/
    const now = hlcNow();
    const tk = TOMB_PREFIX + key;
    const tomb = _readTomb(localStorage.getItem(tk));
    const ctx = { touched: false, gone: false };

    _walkTrack(before, after, now, '', tomb, ctx, 0, BOOKKEEP[key] || null);

    if (ctx.gone) {
      /*@3.FISJ.159*/
      const floor = now - TOMB_TTL_MS;
      for (const id in tomb) if ((Number(tomb[id]) || 0) <= floor) delete tomb[id];
      try {
        /*@3.FISJ.160*/
        _rawSet.call(localStorage, tk, JSON.stringify(tomb));
        stampLocal(tk, now);
        schedulePush();
      } catch (e) { /*@3.FISJ.161*/ }
    }

    return ctx.touched ? JSON.stringify(after) : nextRaw;
  }

  /*@3.FISJ.162*/
  function patchLocalStorage() {
    const origSet = Storage.prototype.setItem;
    const origRemove = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
      /*@3.FISJ.163*/
      if (this === localStorage && !isSyncing && String(key).indexOf(TS_PREFIX) === 0) {
        const want = Number(value) || 0;
        const now = hlcNow();
        if (want < now) value = String(now); else hlcObserve(want);
      }

      /*@3.FISJ.164*/
      if (this === localStorage && !isSyncing && (MERGE_BY_ID.has(key) || isDeepKey(key))) {
        value = trackCollection(key, value);
      }
      origSet.call(this, key, value);
      if (this === localStorage && !NEVER_SYNC.has(key) && !isSyncing) {
        const isSyncable = FIXED_SYNC_KEYS.includes(key) ||
          DYNAMIC_PATTERNS.some(p => p.test(key));
        /*@3.FISJ.165*/
        if (isSyncable) { stampLocal(key, hlcNow()); schedulePush(); }
      }
    };

    Storage.prototype.removeItem = function (key) {
      origRemove.call(this, key);
      /*@3.FISJ.243*/
      if (this === localStorage && !isSyncing) {
        /*@3.FISJ.166*/
        if (!NEVER_SYNC.has(key) &&
            (FIXED_SYNC_KEYS.includes(key) || DYNAMIC_PATTERNS.some(p => p.test(key)))) {
          stampLocal(key, hlcNow());
          schedulePush();
        }
      }
    };
  }

  /*@3.FISJ.167*/

  /*@3.FISJ.168*/
  let _panelP = null;
  function ensurePanel() {
    if (window.GardenSyncPanel) return Promise.resolve(true);
    if (_panelP) return _panelP;
    _panelP = new Promise(resolve => {
      let el = document.querySelector('script[data-sync-panel-js]');
      if (!el) {
        el = document.createElement('script');
        el.src = ROOT + 'shared/sync-panel.js';
        el.setAttribute('data-sync-panel-js', '1');
        document.head.appendChild(el);
      }
      const done = () => resolve(!!window.GardenSyncPanel);
      el.addEventListener('load', done);
      el.addEventListener('error', done);
      setTimeout(done, 6000);
    });
    return _panelP;
  }

  function showSyncModal() {
    ensurePanel().then(ok => {
      if (ok) window.GardenSyncPanel.openModal({ allowSkip: false });
      else showToast(t('statusError'), 'error');
    });
  }

  /*@3.FISJ.169*/
  function addDesktopHeaderBtn() {
    if (window.innerWidth <= 1024) return;
    if (document.getElementById('sync-header-btn')) return;

    /*@3.FISJ.203*/
    /*@3.FISJ.170*/
    const targets = [
      '.g-tail',
      '.module-header-actions',
      '.dash-actions',
    ];

    let container = null;
    for (const sel of targets) {
      container = document.querySelector(sel);
      if (container) break;
    }
    if (!container) return;

    const btn = document.createElement('button');
    btn.className = 'toggle-btn sync-header-btn';
    btn.id = 'sync-header-btn';
    btn.title = t('modalTitle');
    btn.innerHTML = '<i class="fa-solid fa-cloud" aria-hidden="true"></i>';

    const dot = document.createElement('span');
    dot.className = 'sync-status-dot ' + syncStatus;
    btn.appendChild(dot);
    statusDot = dot;

    btn.addEventListener('click', showSyncModal);

    /*@3.FISJ.171*/
    const langBtn = container.querySelector('.g-lang, [onclick*="toggleLanguage"], #lang-label');
    const refBtn = langBtn ? langBtn.closest('button') || langBtn : null;
    if (refBtn && refBtn.parentNode === container) container.insertBefore(btn, refBtn);
    else if (refBtn) refBtn.parentNode.insertBefore(btn, refBtn);
    else container.prepend(btn);
  }

  /*@3.FISJ.172*/
  const MIGRATED_LS = 'garden_oracle_imported';
  const MIGRATE_TRIES_LS = 'garden_oracle_import_tries';
  const MIGRATE_MAX_TRIES = 5;

  /*@3.FISJ.202*/
  function legacyState() {
    return {
      done: localStorage.getItem(MIGRATED_LS) === '1',
      tries: Number(localStorage.getItem(MIGRATE_TRIES_LS) || 0),
      applicable: (function () {
        const k = getKey();
        return !!k && !currentVaultSecret() && KEY_REGEX.test(k);
      })(),
    };
  }

  async function importLegacyOnce(key) {
    if (!usingOracle()) return false;
    if (localStorage.getItem(MIGRATED_LS) === '1') return false;

    if (!KEY_REGEX.test(String(key))) {
      localStorage.setItem(MIGRATED_LS, '1');
      return false;
    }

    const tries = Number(localStorage.getItem(MIGRATE_TRIES_LS) || 0);
    if (tries >= MIGRATE_MAX_TRIES) return false;
    localStorage.setItem(MIGRATE_TRIES_LS, String(tries + 1));

    let pulled = false;
    try {
      forceFirestore = true;                      /*@3.FISJ.173*/
      storeReady = false;
      await new Promise((res) => { loadFirebase(res); });
      if (db) {
        await pullAll(key);                       /*@3.FISJ.174*/
        pulled = true;
      }
    } catch (e) {
      console.warn('[Sync] legacy import failed:', e && e.message);
    } finally {
      forceFirestore = false;
      storeReady = true;                          /*@3.FISJ.175*/
    }

    if (pulled) {
      localStorage.setItem(MIGRATED_LS, '1');
      localStorage.removeItem(MIGRATE_TRIES_LS);
    }
    await pushAll(key);                           /*@3.FISJ.176*/
    return pulled;
  }

  async function initSync() {
    /*@3.FISJ.177*/
    try { await ensureEndpoints(); } catch (e) {}

    /*@3.FISJ.178*/
    try { await consumeVaultLink(); } catch (e) {}

    userKey = getKey();
    if (!userKey) return; /*@3.FISJ.179*/

    /*@3.FISJ.180*/
    hlcSeedFromLocal();

    loadFirebase(async () => {
      patchLocalStorage();
      /*@3.FISJ.181*/
      const justImported = await importLegacyOnce(userKey);

      /*@3.FISJ.182*/
      const PULL_FRESH_MS = 60 * 1000;
      const lastPull = Number(localStorage.getItem('garden_sync_last') || 0);
      if (justImported || pushPending || Date.now() - lastPull > PULL_FRESH_MS) {
        await pullAll(userKey);
      } else {
        setStatus('synced');
      }

      /*@3.FISJ.183*/
      setInterval(() => {
        if (!document.hasFocus()) return;
        if (pushPending) pushAll(userKey).then(() => pullAll(userKey));
        else pullAll(userKey);
      }, 5 * 60 * 1000);

      /*@3.FISJ.184*/
      window.addEventListener('focus', () => {
        const last = Number(localStorage.getItem('garden_sync_last') || 0);
        if (pushPending) { pushAll(userKey).then(() => pullAll(userKey)); return; }
        if (Date.now() - last > 60000) pullAll(userKey);
      });

      /*@3.FISJ.185*/
      window.addEventListener('online', () => {
        if (pushPending) pushAll(userKey).then(() => pullAll(userKey));
      });

      /*@3.FISJ.186*/
      try {
        const DT = DEV_TOUCH_LS;
        if (Date.now() - Number(localStorage.getItem(DT) || 0) > 24 * 3600 * 1000) {
          touchDevice().then(ok => { if (ok) localStorage.setItem(DT, String(Date.now())); });
        }
      } catch (e) {}
    });
  }

  /*@3.FISJ.187*/
  /*@3.FISJ.241*/
  const QUOTA_TEXT = {
    value_too_large: [
      'عنصرٌ واحدٌ أكبرُ من الحدّ — أزِلْ رسماً أو صورةً من آخرِ ما حرّرتَه.',
      'One item is over the limit — remove a drawing or image from what you last edited.'
    ],
    too_many_keys: [
      'عددُ العناصر بلغ السقف — أرشِفْ قديمَك أو صدّرْه ثمّ احذفه.',
      'You have hit the item count limit — archive or export older items, then delete them.'
    ],
    vault_quota: [
      'مساحتُك ممتلئة — صدّرْ ما لا تحتاجه ثمّ احذفه لتعود المزامنة.',
      'Your storage is full — export what you no longer need, then delete it to resume syncing.'
    ]
  };

  function quotaMessage(d) {
    const ar = document.documentElement.lang !== 'en';
    const t = QUOTA_TEXT[(d && d.code) || ''] ||
      ['توقّفت المزامنة لبلوغ حدٍّ — صدّرْ أو أرشِفْ ثمّ أعِدِ المحاولة.',
       'Syncing stopped at a limit — export or archive, then try again.'];
    let out = ar ? t[0] : t[1];
    if (d && d.bytes && d.max) {
      const k = (n) => Math.round(n / 1024) + (ar ? 'ك' : 'K');
      out += ar ? ('  (' + k(d.bytes) + ' من ' + k(d.max) + ')')
                : ('  (' + k(d.bytes) + ' of ' + k(d.max) + ')');
    }
    return out;
  }

  window.GardenSync = {
    quotaMessage: quotaMessage,
    showModal: showSyncModal,
    syncNow: () => userKey && storeReady && pullAll(userKey),
    getKey,
    setStatus,

    /*@3.FISJ.188*/
    status: () => syncStatus,
    pending: () => !!pushPending,
    quotaBlock: () => pushQuota,
    lastSync: () => Number(localStorage.getItem('garden_sync_last') || 0) || null,

    /*@3.FISJ.189*/
    vaultSecret: currentVaultSecret,
    vaultPretty: () => { const s = currentVaultSecret(); return s ? prettyVault(s) : null; },
    newVaultSecret,
    adoptVaultSecret,
    /*@3.FISJ.190*/
    saveRecovery, openRecovery, passIssue,
    guardState, lockInfo, armPassword, armGoogle, unlockPassword, unlockGoogle,
    disarmGuard, revokeSessions, revokeSession,
    hasToken: () => !!vaultTok(),
    hasRecovery: () => !!localStorage.getItem('garden_recovery_set'),
    downloadRecoveryFile, recoveryFileText, recoveryQR, pairQR,
    forgetRecovery, disconnect: disconnectDevice,
    googleAvailable, googleRender, saveRecoveryGoogle, openRecoveryGoogle,

    /*@3.FISJ.191*/
    startPairing, claimPairing,
    prettyPair,
    /*@3.FISJ.235*/
    vaultHeaders: guardHeaders,
    /*@3.FISJ.240*/
    vaultId: () => { const k = getKey(); return k ? oracleDocId(k) : Promise.resolve(null); },
    devices: listDevices,
    forgetDevice,
    deviceId, deviceName,

    /*@3.FISJ.192*/
    vaultLink: () => {
      const s = currentVaultSecret();
      if (!s) return null;
      return location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html#vault=' + s;
    },
    isLegacyKey: () => { const k = getKey(); return !!k && !currentVaultSecret() && KEY_REGEX.test(k); },

    /*@3.FISJ.193*/
    vaultDocId: async () => {
      const k = getKey();
      if (!k) return null;
      /*@3.FISJ.194*/
      try { await ensureEndpoints(); } catch (e) {}
      try { return await oracleDocId(k); } catch (e) { return null; }
    },

    /*@3.FISJ.195*/
    legacyState,
    pushError: () => pushLastError,

    _test: { mergeById, mergeDeep, mergeTombs, trackCollection, isDeepKey, canon: _canonStr, wrap, unwrap,
             patchLocalStorage, hlcNow, stampLocal, localStamp,
             chunkPayload, pushAll, pullAll, importLegacyOnce, initSync, loadFirebase, getSyncableKeys,
             PUSH_MAX_KEYS, PUSH_MAX_BYTES, PUSH_MAX_VALUE },

    upgradeVault: upgradeLegacyVault,
    pendingMove: pendingVaultMove,
    followMove: async (toId) => { saveKey(String(toId)); await pullAll(getKey()); return getKey(); },
    mirrorUntil: () => Number(localStorage.getItem(LEGACY_UNTIL_LS) || 0)
  };

  /*@3.FISJ.196*/
  function boot() {
    injectCSS();
    /*@3.FISJ.197*/
    addDesktopHeaderBtn();

    /*@3.FISJ.198*/
    if (/[#&]pair=/.test(location.hash)) {
      /*@3.FISJ.199*/
      /*@3.FISJ.229*/
      consumePairLink().then((ok) => {
        if (getKey()) initSync();
        ensurePanel().then((has) => {
          if (has) window.GardenSyncPanel.openModal({ allowSkip: false, notice: ok ? '' : pairLinkError });
        });
      });
    } else if (/vault=/.test(location.hash)) {
      consumeVaultLink().then(ok => { if (ok || getKey()) initSync(); });
    } else if (getKey()) {
      initSync();
    }
    /*@3.FISJ.200*/
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
