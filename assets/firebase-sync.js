/* ═══════════════════════════════════════════════════════════════
   CS Level 5 · Digital Garden · firebase-sync.js v1.0
   
   وحدة مزامنة مستقلة كلياً — لا تُعدّل garden.js
   
   الاستخدام: أضف هذا السطر قبل </body> في أي صفحة:
     <script src="assets/firebase-sync.js"></script>
   
   المزامنة: Hybrid (تلقائي عند التحميل + عند كل تغيير)
   التعارض: Last-write-wins بالـ timestamp
   ═══════════════════════════════════════════════════════════════ */

; (function () {
  'use strict';

  /* ════════════════════════════════════════════════════
     🔧 إعدادات Firebase — استبدل بقيم مشروعك
     ════════════════════════════════════════════════════ */
  const WORKER_URL = 'https://garden-ai.xxli50xx.workers.dev';

  async function getFirebaseConfig() {
    const res = await fetch(`${WORKER_URL}/api/firebase-config`);
    return res.json();
  }

  const FIREBASE_VER = '10.12.2';

  /* ════════════════════════════════════════════════════
     📦 مفاتيح localStorage التي تُزامَن
     ════════════════════════════════════════════════════ */
  // مفاتيح ثابتة (planner)
  const FIXED_SYNC_KEYS = [
    'study_plan_midterm',
    'study_plan_final',
    'study_plan_general',
    'planner_config',
  ];
  // أنماط ديناميكية (تقدم + بطاقات + نوتس + نشاط)
  const DYNAMIC_PATTERNS = [
    /^garden_[A-Z0-9]+_m\d+_fc$/,
    /^garden_[A-Z0-9]+_m\d+_quiz$/,
    /^garden_[A-Z0-9]+_m\d+_notes$/,
    /^garden_[A-Z0-9]+_m\d+_ret$/,
    /^garden_[A-Z0-9]+_activity$/,
    /^garden_daily_new_limit$/,
  ];
  // هذه لا تُزامَن أبداً (تفضيلات الجهاز)
  const NEVER_SYNC = new Set([
    'garden_lang', 'garden_theme', 'garden_font_size', 'garden_mobile_3d', 'garden_sync_key',
  ]);

  /* ════════════════════════════════════════════════════
     ⚙️  ثوابت
     ════════════════════════════════════════════════════ */
  const SYNC_KEY_LS = 'garden_sync_key';
  const KEY_REGEX = /^[A-Z]{3}[0-9]{5,}$/;
  const COLLECTION = 'users';
  const AUTO_PUSH_DEBOUNCE_MS = 1500; // تأخير قبل الرفع التلقائي

  /* ════════════════════════════════════════════════════
     🗂️  الحالة الداخلية
     ════════════════════════════════════════════════════ */
  let db = null;
  let userKey = null;
  let syncStatus = 'offline';   // offline | loading | synced | error
  let pushTimer = null;
  let fabBtn = null;
  let statusDot = null;
  let isSyncing = false;

  /* ════════════════════════════════════════════════════
     🌍  i18n بسيط
     ════════════════════════════════════════════════════ */
  const T = {
    ar: {
      firstTitle: '☁️ مزامنة الأجهزة',
      firstBody: 'أنشئ مفتاحاً شخصياً لحفظ بياناتك على السحابة ومزامنتها بين أجهزتك — بدون تسجيل.',
      keyLabel: 'مفتاحك (3 أحرف + 5 أرقام على الأقل)',
      keyPlaceholder: 'مثال: ABD92847',
      randomBtn: '🎲 توليد عشوائي',
      saveBtn: '☁️ حفظ وتفعيل المزامنة',
      skipBtn: 'تخطي — تعمل بدون مزامنة',
      keyError: 'المفتاح يجب أن يكون 3 أحرف كبيرة + 5 أرقام على الأقل (مثال: ABD92847)',
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
      keyLabel: 'Your key (3 letters + 5+ digits)',
      keyPlaceholder: 'Example: ABD92847',
      randomBtn: '🎲 Random',
      saveBtn: '☁️ Save & Enable Sync',
      skipBtn: 'Skip — work without sync',
      keyError: 'Key must be 3 uppercase letters + 5+ digits (e.g. ABD92847)',
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

  /* ════════════════════════════════════════════════════
     💉  حقن CSS
     ════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('garden-sync-css')) return;
    const style = document.createElement('style');
    style.id = 'garden-sync-css';
    style.textContent = `
/* ── Sync FAB ── */
.sync-fab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 42px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  cursor: pointer;
  opacity: 0.45;
  transition: all 0.25s ease;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  flex-shrink: 0;
}
[dir="rtl"] .sync-fab {
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  border-right: none;
  box-shadow: -2px 2px 8px var(--shadow-base);
}
[dir="ltr"] .sync-fab {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  border-left: none;
  box-shadow: 2px 2px 8px var(--shadow-base);
}
.sync-fab:hover, .sync-fab:active { opacity: 1; width: 46px; }
.sync-fab .sync-status-dot {
  position: absolute;
  bottom: 6px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--gray-500);
  transition: background 0.3s;
}
[dir="rtl"] .sync-fab .sync-status-dot { left: 5px; }
[dir="ltr"] .sync-fab .sync-status-dot { right: 5px; }
.sync-fab .sync-status-dot.synced,
.sync-header-btn .sync-status-dot.synced { background: #10b981; }

.sync-fab .sync-status-dot.loading,
.sync-header-btn .sync-status-dot.loading { background: #fbbf24; animation: syncPulse 1s ease-in-out infinite; }

.sync-fab .sync-status-dot.error,
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

  /* ════════════════════════════════════════════════════
     🔑  إدارة المفتاح
     ════════════════════════════════════════════════════ */
  function getKey() { return localStorage.getItem(SYNC_KEY_LS) || null; }

  function validateKey(k) { return KEY_REGEX.test(k); }

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

  /* ════════════════════════════════════════════════════
     🔥  تحميل Firebase SDK ديناميكياً
     ════════════════════════════════════════════════════ */
  async function loadFirebase(callback) {
    if (window.firebase?.firestore) { callback(); return; }

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
          db.settings({ experimentalForceLongPolling: false });
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

  /* ════════════════════════════════════════════════════
     📊  حالة المزامنة (UI)
     ════════════════════════════════════════════════════ */
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

  /* ════════════════════════════════════════════════════
     📤📥  جوهر المزامنة
     ════════════════════════════════════════════════════ */

  /** استخرج كل مفاتيح localStorage التي يجب مزامنتها */
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

  /** ارفع كل المفاتيح المتاحة إلى Firestore */
  async function pushAll(key) {
    if (!db || !key) return;
    setStatus('loading');
    try {
      const now = Date.now();
      const batch = db.batch();
      const ref = db.collection(COLLECTION).doc(key);

      const syncableKeys = getSyncableKeys();
      if (syncableKeys.length === 0) { setStatus('synced'); return; }

      const payload = {};
      syncableKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          payload[_fireKey(k)] = { v: raw, t: now };
        }
      });

      // استخدم merge حتى لا نحذف مفاتيح موجودة في Firebase لكن مش عندنا
      await ref.set({ sync: payload, last_seen: now }, { merge: true });
      setStatus('synced');
      localStorage.setItem('garden_sync_last', String(now));
    } catch (e) {
      console.warn('[Sync] Push failed:', e);
      setStatus('error');
    }
  }

  /** اسحب من Firestore وادمج مع localStorage (last-write-wins) */
  async function pullAll(key) {
    if (!db || !key) return;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await db.collection(COLLECTION).doc(key).get();
      if (!doc.exists) {
        // مفتاح جديد — ارفع بياناتنا الحالية
        await pushAll(key);
        return;
      }

      const remote = doc.data()?.sync || {};
      let changed = false;
      let localHasNewer = false;

      Object.entries(remote).forEach(([fk, entry]) => {
        const lsKey = _localKey(fk);
        if (!lsKey || NEVER_SYNC.has(lsKey)) return;

        const localRaw = localStorage.getItem(lsKey);
        const remoteT = entry.t || 0;
        const remoteV = entry.v;

        // تجاهل القيم المتطابقة فوراً لتفادي دوران التحديثات
        if (localRaw === remoteV) return;

        if (localRaw === null) {
          // مفتاح جديد عندنا — خذه من Firebase
          localStorage.setItem(lsKey, remoteV);
          changed = true;
          return;
        }

        // قارن الـ timestamp
        let localT = 0;
        try {
          const parsed = JSON.parse(localRaw);
          if (parsed && typeof parsed === 'object' && parsed.updated_at) {
            localT = new Date(parsed.updated_at).getTime();
          }
        } catch (e) { /* not JSON, استخدم 0 */ }

        if (remoteT > localT) {
          localStorage.setItem(lsKey, remoteV);
          changed = true;
        } else if (localT > remoteT) {
          localHasNewer = true;
        }
      });

      // تحقق من وجود مفاتيح محلية لم ترفع بعد
      const syncableKeys = getSyncableKeys();
      const localHasMissingRemote = syncableKeys.some(k => remote[_fireKey(k)] === undefined);

      // إذا عندنا بيانات أحدث أو بيانات تنقص السحابة — ارفعها
      if (localHasNewer || localHasMissingRemote) {
        await pushAll(key);
      }

      setStatus('synced');
      localStorage.setItem('garden_sync_last', String(Date.now()));

      if (changed) {
        // تحديث بالخلفية بدون مقاطعة أو تحميل الصفحة
        window.dispatchEvent(new CustomEvent('garden:syncCompleted'));
      }
    } catch (e) {
      console.warn('[Sync] Pull failed:', e);
      setStatus('error');
    } finally {
      isSyncing = false;
    }
  }

  /** استيراد بيانات مفتاح آخر (وادمجها) */
  async function importFromKey(otherKey) {
    if (!db || !otherKey) return false;
    setStatus('loading');
    isSyncing = true;
    try {
      const doc = await db.collection(COLLECTION).doc(otherKey).get();
      if (!doc.exists) { setStatus('synced'); return false; }

      const remote = doc.data()?.sync || {};
      if (Object.keys(remote).length === 0) { setStatus('synced'); return false; }

      // استورد كل مفاتيح المصدر بلا مقارنة (المستخدم طلب ذلك صراحةً)
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

  // Firebase لا يقبل '.' أو '/'. نبدّل '_' بـ '__' و'-' بـ'--'
  function _fireKey(k) { return k.replace(/__/g, '____').replace(/_/g, '__').replace(/-/g, '--'); }
  function _localKey(fk) { return fk.replace(/--/g, '-').replace(/____/g, '__PLACEHOLDER__').replace(/__/g, '_').replace(/__PLACEHOLDER__/g, '__'); }

  /* ════════════════════════════════════════════════════
     🔄  Push تلقائي — debounced
     ════════════════════════════════════════════════════ */
  function schedulePush() {
    if (!userKey || !db) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushAll(userKey), AUTO_PUSH_DEBOUNCE_MS);
  }

  /** اعترض localStorage.setItem وlocalStorage.removeItem */
  function patchLocalStorage() {
    const origSet = Storage.prototype.setItem;
    const origRemove = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
      origSet.call(this, key, value);
      if (this === localStorage && !NEVER_SYNC.has(key) && !isSyncing) {
        const isSyncable = FIXED_SYNC_KEYS.includes(key) ||
          DYNAMIC_PATTERNS.some(p => p.test(key));
        if (isSyncable) schedulePush();
      }
    };

    Storage.prototype.removeItem = function (key) {
      origRemove.call(this, key);
      if (this === localStorage && !isSyncing) schedulePush();
    };
  }

  /* ════════════════════════════════════════════════════
     🎨  Modal: أول استخدام — إنشاء مفتاح
     ════════════════════════════════════════════════════ */
  function showFirstRunModal() {
    const overlay = document.createElement('div');
    overlay.className = 'sync-overlay';
    overlay.id = 'sync-first-overlay';

    const suggested = generateRandomKey();

    overlay.innerHTML = `
      <div class="sync-modal" role="dialog" aria-modal="true">
        <div class="sync-modal-title">${t('firstTitle')}</div>
        <div class="sync-modal-body">${t('firstBody')}</div>

        <label class="sync-input-label">${t('keyLabel')}</label>
        <div class="sync-first-random-row">
          <input class="sync-input" id="sync-first-input"
                 placeholder="${t('keyPlaceholder')}"
                 maxlength="12" value="${suggested}"
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
      input.value = generateRandomKey();
      errorEl.textContent = '';
      input.classList.remove('error');
    });

    saveBtn.addEventListener('click', async () => {
      const k = input.value.trim();
      if (!validateKey(k)) {
        errorEl.textContent = t('keyError');
        input.classList.add('error');
        return;
      }
      saveKey(k);
      overlay.remove();
      await initSync();
    });

    skipBtn.addEventListener('click', () => overlay.remove());

    // إغلاق بالضغط خارج Modal
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ════════════════════════════════════════════════════
     🎨  Modal: الرئيسي (مفتاحي + مزامنة + استيراد)
     ════════════════════════════════════════════════════ */
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
        <button class="sync-btn sync-btn-danger" id="sync-change-key-btn">
          ${t('changeKeyBtn')}
        </button>

        <button class="sync-btn sync-btn-secondary" id="sync-close-btn" style="margin-top:0.25rem">
          ${t('closeBtn')}
        </button>

        <div class="sync-warning">${t('warning')}</div>
      </div>`;

    document.body.appendChild(overlay);

    // نسخ المفتاح
    overlay.querySelector('#sync-copy-btn').addEventListener('click', function () {
      if (key) {
        navigator.clipboard?.writeText(key).catch(() => { });
        this.textContent = t('copied');
        setTimeout(() => { this.textContent = t('copyBtn'); }, 2000);
      }
    });

    // مزامنة فورية
    overlay.querySelector('#sync-now-btn').addEventListener('click', async () => {
      if (key && db) await pullAll(key);
    });

    // استيراد من مفتاح آخر
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

    // تغيير مفتاحي
    overlay.querySelector('#sync-change-key-btn').addEventListener('click', () => {
      if (!confirm(t('changeKeyWarn'))) return;
      overlay.remove();
      localStorage.removeItem(SYNC_KEY_LS);
      userKey = null;
      showFirstRunModal();
    });

    // إغلاق
    overlay.querySelector('#sync-close-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ════════════════════════════════════════════════════
     🏠  إضافة زر الـ FAB للجوال
     ════════════════════════════════════════════════════ */
  function addMobileFAB() {
    if (window.innerWidth > 1024) return;

    function _inject() {
      if (document.getElementById('sync-mob-fab')) return;

      const btn = document.createElement('button');
      btn.className = 'mobile-fab sync-fab';
      btn.id = 'sync-mob-fab';
      btn.innerHTML = '☁️';
      btn.title = t('modalTitle');

      const dot = document.createElement('span');
      dot.className = 'sync-status-dot ' + syncStatus;
      btn.appendChild(dot);
      statusDot = dot;
      fabBtn = btn;

      btn.addEventListener('click', showSyncModal);

      // أضفه لـ mobile-fabs الموجود إن وُجد
      const existing = document.getElementById('mobile-fabs');
      if (existing) {
        existing.appendChild(btn);
      } else {
        // أنشئ container مستقل
        const ctn = document.createElement('div');
        ctn.className = 'mobile-fab-container';
        ctn.id = 'sync-fabs-container';
        ctn.appendChild(btn);
        document.body.appendChild(ctn);

        // scroll hide
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
          const y = window.scrollY;
          ctn.classList.toggle('scrolling-down', y > lastY && y > 150);
          lastY = y;
        }, { passive: true });
      }
    }

    // انتظر garden.js يكمل initMobileFabs
    if (document.readyState === 'complete') {
      setTimeout(_inject, 100);
    } else {
      window.addEventListener('load', () => setTimeout(_inject, 100));
    }
  }

  /* ════════════════════════════════════════════════════
     🖥️  إضافة زر ☁️ للهيدر على الديسكتوب
     ════════════════════════════════════════════════════ */
  function addDesktopHeaderBtn() {
    if (window.innerWidth <= 1024) return;
    if (document.getElementById('sync-header-btn')) return;

    // ابحث عن منطقة الأزرار في الهيدر
    const targets = [
      '.module-header-actions',
      '.dash-actions',
      '.planner-header-actions',
      '.planner-actions',
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

    // أضفه قبل زر الـ lang
    const langBtn = container.querySelector('[onclick*="toggleLanguage"], #lang-label');
    const refBtn = langBtn ? langBtn.closest('button') || langBtn : null;
    if (refBtn) container.insertBefore(btn, refBtn);
    else container.prepend(btn);
  }

  /* ════════════════════════════════════════════════════
     🚀  تهيئة المزامنة الكاملة
     ════════════════════════════════════════════════════ */
  async function initSync() {
    userKey = getKey();
    if (!userKey) return; // لم يختر المستخدم مفتاحاً بعد

    loadFirebase(async () => {
      patchLocalStorage();
      await pullAll(userKey);

      // مزامنة دورية كل 5 دقائق
      setInterval(() => {
        if (document.hasFocus()) pullAll(userKey);
      }, 5 * 60 * 1000);

      // مزامنة عند عودة الفوكس للصفحة (التبديل بين التبويبات)
      window.addEventListener('focus', () => {
        const last = Number(localStorage.getItem('garden_sync_last') || 0);
        if (Date.now() - last > 60000) pullAll(userKey);
      });
    });
  }

  /* ════════════════════════════════════════════════════
     🔊  API عام
     ════════════════════════════════════════════════════ */
  window.GardenSync = {
    showModal: showSyncModal,
    syncNow: () => userKey && db && pullAll(userKey),
    getKey,
    setStatus,
  };

  /* ════════════════════════════════════════════════════
     ▶️  Entry Point
     ════════════════════════════════════════════════════ */
  function boot() {
    injectCSS();
    addMobileFAB();
    addDesktopHeaderBtn();

    const key = getKey();
    if (!key) {
      // أول زيارة — أظهر modal بعد ثانية (حتى تكتمل الصفحة)
      setTimeout(showFirstRunModal, 1200);
    } else {
      initSync();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
