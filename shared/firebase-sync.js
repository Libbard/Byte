 

; (function () {
  'use strict';

   
  const WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';

   
  function syncEndpoint() {
    const e = (window.GardenEndpoints && window.GardenEndpoints.sync) || '';
    return String(e).replace(/\/+$/, '');
  }

  async function getFirebaseConfig() {
     
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

   
  
  const FIXED_SYNC_KEYS = [];

  
  const DYNAMIC_PATTERNS = [
    
    /^garden_[A-Z0-9]+_m\d+_fc$/,
    /^garden_[A-Z0-9]+_m\d+_quiz$/,
    /^garden_[A-Z0-9]+_m\d+_notes$/,
    /^garden_[A-Z0-9]+_m\d+_ret$/,
    /^garden_[A-Z0-9]+_activity$/,
    /^garden_daily_new_limit$/,
    
    /^my_semester$/,
    /^semester_archive$/,
    
    /^gpa_grades$/,
    /^gpa_settings$/,
    
    /^weekly_schedule$/,
     
    
    /^dashboard_prefs$/,
    /^student_profile$/,
    /^quick_notes$/,
    
    /^course_meta_[A-Z0-9_]+$/,
    
    /^my_tasks$/,
    
    /^gpa_plan$/,
     
    /^__tomb_(quick_notes|my_tasks)$/,
  ];
  
  const NEVER_SYNC = new Set([
    'garden_lang', 'garden_theme', 'garden_font_size', 'garden_mobile_3d', 'garden_sync_key',
    'garden_semester_meta',
    
    'dash_view',
    
    'gpa_scenario',
  ]);

   
  const SYNC_KEY_LS = 'garden_sync_key';
  const SYNC_DECLINED_LS = 'garden_sync_declined'; 
  const SYNC_SEEN_LS = 'garden_sync_modal_seen';   
  const KEY_REGEX = /^[A-Z]{3}[0-9]{5,}$/;
   
  function collectionName() { return usingOracle() ? 'vaults' : 'users'; }

   
   
  let forceFirestore = false;
  function usingOracle() { return !!syncEndpoint() && !forceFirestore; }
  let storeReady = false;
  let pushPending = false;   

   

  function vaultUrl(docId) {
    return syncEndpoint() + '/v1/vault/' + encodeURIComponent(docId);
  }

   
  const VAULT_MAP_LS = 'garden_vault_docid:';
  const ORACLE_ID = /^v[0-9a-f]{32}$/;

  async function oracleDocId(docId) {
    const id = String(docId || '');
    if (ORACLE_ID.test(id)) return id;                       
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

   
  async function storeGet(docId) {
    if (usingOracle()) {
      const r = await fetch(vaultUrl(await oracleDocId(docId)), { cache: 'no-store' });
      if (!r.ok) throw new Error('oracle-get-' + r.status);
      const j = await r.json();
      return { exists: !!j.exists, sync: j.sync || {}, data: j };
    }
    const snap = await db.collection(collectionName()).doc(docId).get();
    const d = snap.exists ? (snap.data() || {}) : {};
    return { exists: !!snap.exists, sync: d.sync || {}, data: d };
  }

   
  async function storeMerge(docId, payload, extra) {
    if (usingOracle()) {
      const r = await fetch(vaultUrl(await oracleDocId(docId)), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: payload })
      });
      if (!r.ok) throw new Error('oracle-post-' + r.status);
      return r.json();
    }
    await db.collection(collectionName()).doc(docId).set(
      Object.assign({ sync: payload, last_seen: Date.now() }, extra || {}),
      { merge: true }
    );
    return null;
  }
  const AUTO_PUSH_DEBOUNCE_MS = 1500; 

   
  const TS_PREFIX = '__syncT_';
  const _rawSet = Storage.prototype.setItem;
  function stampLocal(key, t) {
    try { _rawSet.call(localStorage, TS_PREFIX + key, String(t || hlcNow())); } catch (e) {}
  }
  function localStamp(key) {
    const v = Number(localStorage.getItem(TS_PREFIX + key) || 0);
    return isFinite(v) ? v : 0;
  }

   
  const HLC_LS = '__hlc';
  let _hlc = (function () {
    try { const v = Number(localStorage.getItem(HLC_LS) || 0); return isFinite(v) ? v : 0; }
    catch (e) { return 0; }
  })();

  function _hlcSave() {
    try { _rawSet.call(localStorage, HLC_LS, String(_hlc)); } catch (e) {}
  }

   
  function hlcObserve(t) {
    const n = Number(t);
    if (isFinite(n) && n > _hlc) { _hlc = n; _hlcSave(); }
  }

   
  function hlcNow() {
    const p = Date.now();
    _hlc = (p > _hlc) ? p : _hlc + 1;
    _hlcSave();
    return _hlc;
  }

   
  function hlcObserveItems(raw) {
    try {
      const arr = JSON.parse(raw || '[]');
      if (Array.isArray(arr)) arr.forEach(x => { if (x) hlcObserve(x.updated_at); });
    } catch (e) {}
  }

   
  function hlcSeedFromLocal() {
    if (_hlc) return;                      
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

   
  const MERGE_BY_ID = new Set(['quick_notes', 'my_tasks']);
  const TOMB_PREFIX = '__tomb_';
  const TOMB_TTL_MS = 90 * 24 * 3600 * 1000;   

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

  function mergeById(localRaw, localT, remoteRaw, remoteT, tomb) {
    let a, b;
    try { a = JSON.parse(localRaw); b = JSON.parse(remoteRaw); } catch (e) { return null; }
    if (!Array.isArray(a) || !Array.isArray(b)) return null;   
    const dead = tomb || {};

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
           
          const ls = JSON.stringify(e.l), rs = JSON.stringify(e.r);
          win = ls >= rs ? e.l : e.r;
        }
        at = Math.max(lt, rt);
      } else {
        win = e.l || e.r;
        at = _itemStamp(win, e.l ? localT : remoteT);
      }
       
      if ((dead[id] || 0) >= at) continue;
      out.push(win);
    }
    out.sort((x, y) => String(x.id).localeCompare(String(y.id)));
    return JSON.stringify(out);
  }

   
  let db = null;
  let userKey = null;
  let syncStatus = 'offline';   
  let pushTimer = null;
  let statusDot = null;
  let isSyncing = false;

   
  const T = {
    ar: {
      firstTitle: '☁️ مزامنة الأجهزة',
      firstBody: 'أنشئ مفتاحاً شخصياً لحفظ بياناتك على السحابة ومزامنتها بين أجهزتك — بدون تسجيل.',
      keyLabel: 'مفتاح خزنتك — انسخه واحفظه',
      keyPlaceholder: 'الصق مفتاحاً موجوداً، أو استعمل المولَّد',
      randomBtn: '🎲 توليد عشوائي',
      saveBtn: '☁️ حفظ وتفعيل المزامنة',
      skipBtn: 'تخطي — تعمل بدون مزامنة',
      keyError: 'مفتاح غير صالح. استعمل زرّ التوليد، أو الصق مفتاح خزنتك كاملاً.',
      modalTitle: '☁️ مزامنة الأجهزة',
      yourKey: 'مفتاحك الحالي',
      copyBtn: '📋 نسخ',
      copied: '✓ تم النسخ',
      statusOnline: 'متصل',
      statusOffline: 'غير متصل',
      statusSyncing: 'جاري المزامنة...',
      statusError: 'خطأ في الاتصال',
      lastSync: 'آخر مزامنة',
      syncNowBtn: '🔄 مزامنة الآن',
      changeTitle: 'انتقل لجهاز آخر',
      changeBody: 'أدخل مفتاح جهازك الآخر لاستيراد بياناته:',
      changeInput: 'المفتاح (ABD12345)',
      importBtn: '⬇️ استيراد من هذا المفتاح',
      importConfirm: 'هذا سيستبدل بياناتك الحالية بيانات المفتاح الآخر. تأكد؟',
      importDone: '✅ تم الاستيراد بنجاح',
      importFail: '❌ لم يُعثر على بيانات لهذا المفتاح',
      changeKeyBtn: '🔑 تغيير مفتاحي',
      changeKeyWarn: 'تغيير المفتاح لن يحذف بياناتك القديمة من السحابة. تأكد؟',
      warning: '⚠️ المفتاح هو وصولك الوحيد — احفظه بأمان',
      closeBtn: 'إغلاق',
      never: 'لم يتم بعد',
    },
    en: {
      firstTitle: '☁️ Device Sync',
      firstBody: 'Create a personal key to save your data to the cloud and sync across devices — no registration needed.',
      keyLabel: 'Your vault key — copy and keep it',
      keyPlaceholder: 'Paste an existing key, or use the generator',
      randomBtn: '🎲 Random',
      saveBtn: '☁️ Save & Enable Sync',
      skipBtn: 'Skip — work without sync',
      keyError: 'Invalid key. Use the generate button, or paste your full vault key.',
      modalTitle: '☁️ Device Sync',
      yourKey: 'Your current key',
      copyBtn: '📋 Copy',
      copied: '✓ Copied',
      statusOnline: 'Connected',
      statusOffline: 'Offline',
      statusSyncing: 'Syncing...',
      statusError: 'Connection error',
      lastSync: 'Last sync',
      syncNowBtn: '🔄 Sync Now',
      changeTitle: 'Switch to another device',
      changeBody: 'Enter the key from your other device to import its data:',
      changeInput: 'Key (ABD12345)',
      importBtn: '⬇️ Import from this key',
      importConfirm: 'This will replace your current data with data from the other key. Confirm?',
      importDone: '✅ Import successful',
      importFail: '❌ No data found for this key',
      changeKeyBtn: '🔑 Change my key',
      changeKeyWarn: 'Changing your key won\'t delete your old cloud data. Confirm?',
      warning: '⚠️ Your key is your only access — keep it safe',
      closeBtn: 'Close',
      never: 'Never',
    },
  };
  function t(k) {
    const lang = localStorage.getItem('garden_lang') || 'ar';
    return T[lang]?.[k] || T.ar[k] || k;
  }
  function isRTL() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }

   
  function injectCSS() {
    if (document.getElementById('garden-sync-css')) return;
    const style = document.createElement('style');
    style.id = 'garden-sync-css';
    style.textContent = `
/* ── حالة نقطة المزامنة (زر هيدر سطح المكتب) — و-05: أُزيل .sync-fab الميت ── */
.sync-header-btn .sync-status-dot.synced { background: #10b981; }
.sync-header-btn .sync-status-dot.loading { background: #fbbf24; animation: syncPulse 1s ease-in-out infinite; }
.sync-header-btn .sync-status-dot.error { background: #ef4444; }

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

   
  function getKey() { return localStorage.getItem(SYNC_KEY_LS) || null; }

  function validateKey(k) { return KEY_REGEX.test(k) || VAULT_REGEX.test(normalizeVault(k)); }

   
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

   
  const VAULT_SECRET_LS = 'garden_vault_secret';
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const VAULT_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

  function normalizeVault(s) {
    return String(s || '').toUpperCase().replace(/[\s-]/g, '')
       
      .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  }

  function newVaultSecret() {
    const b = new Uint8Array(16);                 
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
    return normalizeVault(s).replace(/(.{5})(?=.)/g, '$1-');   
  }

   
  async function vaultDocId(secret) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('garden-vault:' + normalizeVault(secret)));
    return 'v' + [...new Uint8Array(d)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
  }

   
  async function adoptVaultSecret(secret) {
    const s = normalizeVault(secret);
    if (!VAULT_REGEX.test(s)) throw new Error('bad-secret');
    const id = await vaultDocId(s);
    localStorage.setItem(VAULT_SECRET_LS, s);
    saveKey(id);
    return { secret: s, docId: id };
  }

  function currentVaultSecret() {
    const s = normalizeVault(localStorage.getItem(VAULT_SECRET_LS));
    return VAULT_REGEX.test(s) ? s : null;
  }

   
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
     
    if (usingOracle()) throw new Error('not-applicable-on-oracle');
    if (!db) throw new Error('offline');
    if (!oldId || currentVaultSecret()) throw new Error('not-legacy');

     
    await pullAll(oldId);

    const secret = newVaultSecret();
    const newId = await vaultDocId(secret);

     
    const snap = await db.collection(collectionName()).doc(oldId).get();
    const data = snap.exists ? (snap.data() || {}) : {};
    await db.collection(collectionName()).doc(newId).set(
      Object.assign({}, data, { migrated_from: oldId, migrated_at: Date.now() }),
      { merge: true }
    );

     
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

   
  async function pendingVaultMove() {
    const id = getKey();
    if (usingOracle() || !db || !id || currentVaultSecret()) return null;
    try {
      const snap = await db.collection(collectionName()).doc(id).get();
      const to = snap.exists && snap.data() && snap.data().moved_to;
      return (to && to !== id) ? String(to) : null;
    } catch (e) { return null; }
  }

   
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

   
  async function loadFirebase(callback) {
     
    if (usingOracle()) { storeReady = true; callback(); return; }

    if (window.firebase?.firestore) { storeReady = !!db; callback(); return; }

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
          
          
          db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
          callback();
        } catch (e) {
          console.warn('[Sync] Firebase init failed:', e);
          setStatus('error');
        }
      })();
    }

    scripts.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = tryInit;
      s.onerror = () => { console.warn('[Sync] Failed to load:', src); setStatus('error'); };
      document.head.appendChild(s);
    });
  }

   
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

   
  async function pushAll(key) {
    if (!storeReady || !key) return;
    setStatus('loading');
    try {
      const now = Date.now();

      const syncableKeys = getSyncableKeys();
      if (syncableKeys.length === 0) { setStatus('synced'); return; }

       
      const payload = {};
      syncableKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw === null) return;
        let t = localStamp(k);
        if (!t) { t = hlcNow(); stampLocal(k, t); }   
        payload[_fireKey(k)] = { v: raw, t: t };
      });

       
      await storeMerge(key, payload);

       
      const mirror = legacyMirror();
      if (mirror && mirror !== key) {
        try {
          await storeMerge(mirror, payload, { mirrored_from: key });
        } catch (e) { console.warn('[Sync] legacy mirror failed:', e); }
      }
      setStatus('synced');
      pushPending = false;
      localStorage.setItem('garden_sync_last', String(now));
    } catch (e) {
       
      pushPending = true;
      console.warn('[Sync] Push failed:', e);
      setStatus('error');
    }
  }

   
  async function pullAll(key) {
    if (!storeReady || !key) return;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await storeGet(key);
      if (!doc.exists) {
        
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
        const remoteV = entry.v;

         
        hlcObserve(remoteT);
        if (MERGE_BY_ID.has(lsKey)) hlcObserveItems(remoteV);
        else if (lsKey.indexOf(TOMB_PREFIX) === 0) {
          const rt = _readTomb(remoteV);
          for (const id in rt) hlcObserve(rt[id]);
        }

        
        if (localRaw === remoteV) return;

        if (localRaw === null) {
          
          localStorage.setItem(lsKey, remoteV);
          stampLocal(lsKey, remoteT);
          changed = true;
          return;
        }

         
        let localT = localStamp(lsKey);
        if (!localT) {
          try {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed === 'object' && parsed.updated_at) {
              localT = new Date(parsed.updated_at).getTime();
            }
          } catch (e) {   }
        }

         
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

         
        if (MERGE_BY_ID.has(lsKey)) {
           
          const tombRemote = (remote[_fireKey(TOMB_PREFIX + lsKey)] || {}).v;
          const tomb = mergeTombs(localStorage.getItem(TOMB_PREFIX + lsKey), tombRemote);
          const merged = mergeById(localRaw, localT, remoteV, remoteT, tomb);
          if (merged !== null) {
            if (merged !== localRaw) {
              localStorage.setItem(lsKey, merged);
               
              stampLocal(lsKey, Math.max(localT, remoteT));
              changed = true;
            }
             
            if (merged !== remoteV) localHasNewer = true;
            return;
          }
           
        }

        if (remoteT > localT) {
          localStorage.setItem(lsKey, remoteV);
          stampLocal(lsKey, remoteT);   
          changed = true;
        } else if (localT > remoteT) {
          localHasNewer = true;
        }
      });

      
      const syncableKeys = getSyncableKeys();
      const localHasMissingRemote = syncableKeys.some(k => remote[_fireKey(k)] === undefined);

      
      if (localHasNewer || localHasMissingRemote) {
        await pushAll(key);
      }

      setStatus('synced');
      localStorage.setItem('garden_sync_last', String(Date.now()));

      if (changed) {
        
        window.dispatchEvent(new CustomEvent('garden:syncCompleted'));
      }
    } catch (e) {
      console.warn('[Sync] Pull failed:', e);
      setStatus('error');
    } finally {
      isSyncing = false;
    }
  }

   
  async function importFromKey(otherKey) {
    if (!storeReady || !otherKey) return false;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await storeGet(otherKey);
      if (!doc.exists) { setStatus('synced'); return false; }

      const remote = doc.sync || {};
      if (Object.keys(remote).length === 0) { setStatus('synced'); return false; }

      
      Object.entries(remote).forEach(([fk, entry]) => {
        const lsKey = _localKey(fk);
        if (lsKey && !NEVER_SYNC.has(lsKey) && entry.v !== undefined) {
          if (localStorage.getItem(lsKey) !== entry.v) {
            localStorage.setItem(lsKey, entry.v);
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

  
  function _fireKey(k) { return k.replace(/__/g, '____').replace(/_/g, '__').replace(/-/g, '--'); }
  function _localKey(fk) { return fk.replace(/--/g, '-').replace(/____/g, '__PLACEHOLDER__').replace(/__/g, '_').replace(/__PLACEHOLDER__/g, '__'); }

   
  function schedulePush() {
    if (!userKey || !storeReady) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushAll(userKey), AUTO_PUSH_DEBOUNCE_MS);
  }

   
  function trackCollection(key, nextRaw) {
    let before, after;
    try {
      before = JSON.parse(localStorage.getItem(key) || '[]');
      after = JSON.parse(nextRaw);
    } catch (e) { return nextRaw; }
    if (!Array.isArray(before) || !Array.isArray(after)) return nextRaw;

    const prev = {};
    before.forEach(x => { if (x && x.id != null) prev[String(x.id)] = JSON.stringify(x); });

     
    const now = hlcNow();
    let touched = false;
    const alive = new Set();
    after.forEach(x => {
      if (!x || x.id == null) return;
      const id = String(x.id);
      alive.add(id);
      const was = prev[id];
      if (was === undefined) {                      
        if (!x.updated_at) { x.updated_at = now; touched = true; }
      } else if (JSON.stringify(x) !== was) {       
        x.updated_at = now; touched = true;
      }
    });

    const gone = Object.keys(prev).filter(id => !alive.has(id));
    if (gone.length) {
      const tk = TOMB_PREFIX + key;
      const tomb = _readTomb(localStorage.getItem(tk));
      gone.forEach(id => { tomb[id] = now; });
       
      const floor = now - TOMB_TTL_MS;
      for (const id in tomb) if ((Number(tomb[id]) || 0) <= floor) delete tomb[id];
      try {
         
        _rawSet.call(localStorage, tk, JSON.stringify(tomb));
        stampLocal(tk, now);
        schedulePush();
      } catch (e) {   }
    }

    return touched ? JSON.stringify(after) : nextRaw;
  }

   
  function patchLocalStorage() {
    const origSet = Storage.prototype.setItem;
    const origRemove = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
       
      if (this === localStorage && !isSyncing && MERGE_BY_ID.has(key)) {
        value = trackCollection(key, value);
      }
      origSet.call(this, key, value);
      if (this === localStorage && !NEVER_SYNC.has(key) && !isSyncing) {
        const isSyncable = FIXED_SYNC_KEYS.includes(key) ||
          DYNAMIC_PATTERNS.some(p => p.test(key));
         
        if (isSyncable) { stampLocal(key, hlcNow()); schedulePush(); }
      }
    };

    Storage.prototype.removeItem = function (key) {
      origRemove.call(this, key);
      if (this === localStorage && !isSyncing) {
         
        if (!NEVER_SYNC.has(key) &&
            (FIXED_SYNC_KEYS.includes(key) || DYNAMIC_PATTERNS.some(p => p.test(key)))) {
          stampLocal(key, hlcNow());
        }
        schedulePush();
      }
    };
  }

   
  function showFirstRunModal() {
    const overlay = document.createElement('div');
    overlay.className = 'sync-overlay';
    overlay.id = 'sync-first-overlay';

    const suggested = newVaultSecret();

    overlay.innerHTML = `
      <div class="sync-modal" role="dialog" aria-modal="true">
        <div class="sync-modal-title">${t('firstTitle')}</div>
        <div class="sync-modal-body">${t('firstBody')}</div>

        <label class="sync-input-label">${t('keyLabel')}</label>
        <div class="sync-first-random-row">
          <input class="sync-input" id="sync-first-input"
                 placeholder="${t('keyPlaceholder')}"
                 
                 maxlength="32" value="${suggested}"
                 autocomplete="off" autocorrect="off" spellcheck="false">
          <button class="sync-btn sync-btn-secondary sync-btn-sm" id="sync-random-btn">
            ${t('randomBtn')}
          </button>
        </div>
        <div class="sync-input-error" id="sync-first-error"></div>

        <button class="sync-btn sync-btn-primary" id="sync-first-save">
          ${t('saveBtn')}
        </button>
        <button class="sync-btn sync-btn-secondary" id="sync-first-skip">
          ${t('skipBtn')}
        </button>
        <div class="sync-warning">${t('warning')}</div>
      </div>`;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#sync-first-input');
    const errorEl = overlay.querySelector('#sync-first-error');
    const saveBtn = overlay.querySelector('#sync-first-save');
    const skipBtn = overlay.querySelector('#sync-first-skip');
    const randBtn = overlay.querySelector('#sync-random-btn');

    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      errorEl.textContent = '';
      input.classList.remove('error');
    });

    randBtn.addEventListener('click', () => {
      input.value = newVaultSecret();          
      errorEl.textContent = '';
      input.classList.remove('error');
    });

    saveBtn.addEventListener('click', async () => {
      const k = input.value.trim();
      const asVault = normalizeVault(k);

       
      if (VAULT_REGEX.test(asVault)) {
        try { await adoptVaultSecret(asVault); }
        catch (e) { errorEl.textContent = t('keyError'); input.classList.add('error'); return; }
      } else if (KEY_REGEX.test(k)) {
        saveKey(k);
      } else {
        errorEl.textContent = t('keyError');
        input.classList.add('error');
        return;
      }
      overlay.remove();
      await initSync();
    });

    skipBtn.addEventListener('click', () => {
      localStorage.setItem(SYNC_DECLINED_LS, '1');
      overlay.remove();
    });

    
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
  }

   
  function showSyncModal() {
    const existingOverlay = document.getElementById('sync-modal-overlay');
    if (existingOverlay) { existingOverlay.remove(); return; }

    const key = getKey();
    const lastStr = (() => {
      const ts = localStorage.getItem('garden_sync_last');
      if (!ts) return t('never');
      const diff = Math.round((Date.now() - Number(ts)) / 60000);
      if (diff < 1) return (isRTL() ? 'الآن' : 'just now');
      if (diff < 60) return isRTL() ? `منذ ${diff} دقيقة` : `${diff}m ago`;
      return isRTL() ? `منذ ${Math.floor(diff / 60)} ساعة` : `${Math.floor(diff / 60)}h ago`;
    })();

    const statusLabel = {
      synced: t('statusOnline'),
      loading: t('statusSyncing'),
      error: t('statusError'),
      offline: t('statusOffline'),
    }[syncStatus] || t('statusOffline');

    const keyParts = key ? [key.slice(0, 3), key.slice(3)] : ['---', '-----'];

    const overlay = document.createElement('div');
    overlay.className = 'sync-overlay';
    overlay.id = 'sync-modal-overlay';

    overlay.innerHTML = `
      <div class="sync-modal" role="dialog" aria-modal="true">
        <div class="sync-modal-title">${t('modalTitle')}</div>

        <!-- مفتاحك -->
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:0.35rem">
          ${t('yourKey')}
        </div>
        <div class="sync-key-box">
          <div class="sync-key-display">
            ${key
        ? `<span class="sync-key-part">${keyParts[0]}</span><span class="sync-key-sep">·</span><span class="sync-key-part">${keyParts[1]}</span>`
        : '—'}
          </div>
          <button class="sync-btn sync-btn-secondary sync-btn-sm" id="sync-copy-btn">
            ${t('copyBtn')}
          </button>
        </div>

        <!-- حالة الاتصال -->
        <div class="sync-status-row">
          <span class="sync-status-dot ${syncStatus}"></span>
          <span class="sync-status-label ${syncStatus}">${statusLabel}</span>
          <span style="font-size:0.72rem">${t('lastSync')}: ${lastStr}</span>
        </div>

        <!-- زر مزامنة فورية -->
        <button class="sync-btn sync-btn-primary" id="sync-now-btn">
          ${t('syncNowBtn')}
        </button>

        <div class="sync-divider">${isRTL() ? 'أو' : 'or'}</div>

        <!-- استيراد من جهاز آخر -->
        <div class="sync-import-section">
          <label class="sync-input-label">${t('changeBody')}</label>
          <div class="sync-first-random-row" style="margin-bottom:0.3rem">
            <input class="sync-input" id="sync-import-input"
                   placeholder="${t('changeInput')}"
                   maxlength="12"
                   autocomplete="off" autocorrect="off" spellcheck="false">
            <button class="sync-btn sync-btn-secondary sync-btn-sm" id="sync-import-btn">
              ${t('importBtn')}
            </button>
          </div>
          <div class="sync-input-error" id="sync-import-error"></div>
        </div>

        <!-- تغيير مفتاحي -->
        <button class="sync-btn sync-btn-secondary" id="sync-change-key-btn">
          ${t('changeKeyBtn')}
        </button>

        
        ${key ? `<button class="sync-btn sync-btn-danger" id="sync-disconnect-btn">
          ${isRTL() ? '⏻ إيقاف المزامنة على هذا الجهاز' : '⏻ Stop sync on this device'}
        </button>` : ''}

        <button class="sync-btn sync-btn-secondary" id="sync-close-btn" style="margin-top:0.25rem">
          ${t('closeBtn')}
        </button>

        <div class="sync-warning">${t('warning')}</div>
      </div>`;

    document.body.appendChild(overlay);

    
    overlay.querySelector('#sync-copy-btn').addEventListener('click', function () {
      if (key) {
        navigator.clipboard?.writeText(key).catch(() => { });
        this.textContent = t('copied');
        setTimeout(() => { this.textContent = t('copyBtn'); }, 2000);
      }
    });

    
    overlay.querySelector('#sync-now-btn').addEventListener('click', async () => {
      if (key && storeReady) await pullAll(key);
    });

    
    const importInput = overlay.querySelector('#sync-import-input');
    const importError = overlay.querySelector('#sync-import-error');
    importInput.addEventListener('input', () => {
      importInput.value = importInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      importError.textContent = '';
      importInput.classList.remove('error');
    });
    overlay.querySelector('#sync-import-btn').addEventListener('click', async () => {
      const k = importInput.value.trim();
      if (!validateKey(k)) {
        importError.textContent = t('keyError');
        importInput.classList.add('error');
        return;
      }
      if (!confirm(t('importConfirm'))) return;
      overlay.remove();
      const ok = await importFromKey(k);
      showToast(ok ? t('importDone') : t('importFail'), ok ? 'success' : 'error');
      if (ok) setTimeout(() => window.location.reload(), 1000);
    });

    
    overlay.querySelector('#sync-change-key-btn').addEventListener('click', () => {
      if (!confirm(t('changeKeyWarn'))) return;
      overlay.remove();
      localStorage.removeItem(SYNC_KEY_LS);
      localStorage.removeItem(SYNC_DECLINED_LS); 
      userKey = null;
      showFirstRunModal();
    });

    
    const disconnectBtn = overlay.querySelector('#sync-disconnect-btn');
    if (disconnectBtn) disconnectBtn.addEventListener('click', () => {
      if (!confirm(isRTL()
        ? 'إيقاف المزامنة وفصل هذا الجهاز؟ بياناتك المحلية تبقى كما هي، ويمكنك إعادة الربط لاحقاً بالمفتاح نفسه.'
        : 'Stop sync and disconnect this device? Your local data stays intact; you can reconnect later with the same key.')) return;
      localStorage.removeItem(SYNC_KEY_LS);
      userKey = null; db = null;
      setStatus('offline');
      overlay.remove();
      showToast(isRTL() ? 'أُوقفت المزامنة على هذا الجهاز' : 'Sync stopped on this device', 'success');
       
      setTimeout(() => window.location.reload(), 900);
    });

    
    overlay.querySelector('#sync-close-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

   

   
  function addDesktopHeaderBtn() {
    if (window.innerWidth <= 1024) return;
    if (document.getElementById('sync-header-btn')) return;

    
    const targets = [
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
    btn.innerHTML = '☁️';

    const dot = document.createElement('span');
    dot.className = 'sync-status-dot ' + syncStatus;
    btn.appendChild(dot);
    statusDot = dot;

    btn.addEventListener('click', showSyncModal);

    
    const langBtn = container.querySelector('[onclick*="toggleLanguage"], #lang-label');
    const refBtn = langBtn ? langBtn.closest('button') || langBtn : null;
    if (refBtn) container.insertBefore(btn, refBtn);
    else container.prepend(btn);
  }

   
   
  const MIGRATED_LS = 'garden_oracle_imported';

  async function importLegacyOnce(key) {
    if (!usingOracle() || localStorage.getItem(MIGRATED_LS) === '1') return;
    try {
      forceFirestore = true;                      
      storeReady = false;
      await new Promise((res) => { loadFirebase(res); });
      if (db) await pullAll(key);                 
      localStorage.setItem(MIGRATED_LS, '1');
    } catch (e) {
      console.warn('[Sync] legacy import skipped:', e);
    } finally {
      forceFirestore = false;
      storeReady = true;                          
    }
    await pushAll(key);                           
  }

  async function initSync() {
     
    try { await consumeVaultLink(); } catch (e) {}

    userKey = getKey();
    if (!userKey) return; 

     
    hlcSeedFromLocal();

    loadFirebase(async () => {
      patchLocalStorage();
       
      await importLegacyOnce(userKey);
      await pullAll(userKey);

       
      setInterval(() => {
        if (!document.hasFocus()) return;
        if (pushPending) pushAll(userKey).then(() => pullAll(userKey));
        else pullAll(userKey);
      }, 5 * 60 * 1000);

      
      window.addEventListener('focus', () => {
        const last = Number(localStorage.getItem('garden_sync_last') || 0);
        if (pushPending) { pushAll(userKey).then(() => pullAll(userKey)); return; }
        if (Date.now() - last > 60000) pullAll(userKey);
      });

       
      window.addEventListener('online', () => {
        if (pushPending) pushAll(userKey).then(() => pullAll(userKey));
      });
    });
  }

   
  window.GardenSync = {
    showModal: showSyncModal,
    syncNow: () => userKey && storeReady && pullAll(userKey),
    getKey,
    setStatus,

     
    vaultSecret: currentVaultSecret,
    vaultPretty: () => { const s = currentVaultSecret(); return s ? prettyVault(s) : null; },
    newVaultSecret,
    adoptVaultSecret,
     
    vaultLink: () => {
      const s = currentVaultSecret();
      if (!s) return null;
      return location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html#vault=' + s;
    },
    isLegacyKey: () => { const k = getKey(); return !!k && !currentVaultSecret() && KEY_REGEX.test(k); },

     
    upgradeVault: upgradeLegacyVault,
    pendingMove: pendingVaultMove,
    followMove: async (toId) => { saveKey(String(toId)); await pullAll(getKey()); return getKey(); },
    mirrorUntil: () => Number(localStorage.getItem(LEGACY_UNTIL_LS) || 0)
  };

   
  function boot() {
    injectCSS();
     
    addDesktopHeaderBtn();

     
    if (/vault=/.test(location.hash)) {
      consumeVaultLink().then(ok => { if (ok || getKey()) initSync(); });
    } else if (getKey()) {
      initSync();
    }
     
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
