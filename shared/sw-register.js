;(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

   
  var thisScript = document.currentScript;
  if (!thisScript || !thisScript.src) return;
  var ROOT = thisScript.src.replace(/shared\/sw-register\.js(\?.*)?$/, '');
  if (ROOT === thisScript.src) return;

  function tx(ar, en) {
    var lang = document.documentElement.lang || localStorage.getItem('garden_lang') || 'ar';
    return lang === 'ar' ? ar : en;
  }

  function injectStyles() {
    if (document.getElementById('sw-update-styles')) return;
    var st = document.createElement('style');
    st.id = 'sw-update-styles';
    st.textContent = [
      '.sw-update-toast {',
      '  position: fixed;',
      '  bottom: 1.5rem;',
       
      '  left: 50%;',
      '  transform: translateX(-50%) translateY(12px);',
      '  z-index: 3001;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 0.75rem;',
      '  background: var(--bg-elevated);',
      '  border: 1px solid var(--border-color);',
      '  border-radius: var(--radius-pill);',
      '  padding: 0.55rem 0.7rem 0.55rem 1.1rem;',
      '  box-shadow: 0 8px 24px var(--shadow-base);',
      '  opacity: 0;',
      '  transition: opacity 0.25s, transform 0.25s;',
      '}',
      '[dir="ltr"] .sw-update-toast { padding: 0.55rem 1.1rem 0.55rem 0.7rem; }',
      '.sw-update-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '.sw-update-toast-text {',
      '  font-size: 0.82rem;',
      '  font-weight: 700;',
      '  color: var(--text-primary);',
      '  white-space: nowrap;',
      '}',
      '.sw-update-toast-btn {',
      '  font-family: inherit;',
      '  font-size: 0.78rem;',
      '  font-weight: 800;',
      '  cursor: pointer;',
      '  border: none;',
      '  border-radius: var(--radius-pill);',
      '  padding: 0.35rem 0.85rem;',
      '  background: #a78bfa;',
      '  color: #fff;',
      '  white-space: nowrap;',
      '}',
      '.sw-update-toast-btn:hover { background: #9167f5; }',
      '.sw-update-toast-close {',
      '  font-family: inherit;',
      '  font-size: 0.9rem;',
      '  line-height: 1;',
      '  cursor: pointer;',
      '  border: none;',
      '  background: none;',
      '  color: var(--text-muted);',
      '  padding: 0.25rem;',
      '}',
      '.sw-update-toast-close:hover { color: var(--text-primary); }',
       
      '@media (max-width: 768px) {',
      '  .sw-update-toast { bottom: calc(56px + 1rem); max-width: calc(100vw - 2rem); }',
      '  .sw-update-toast-text { white-space: normal; }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .sw-update-toast { transition: none; transform: translateX(-50%); }',
      '  .sw-update-toast.show { transform: translateX(-50%); }',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  }

  var toastEl = null;

  function showUpdateToast(worker) {
    if (toastEl) return;
    injectStyles();

    toastEl = document.createElement('div');
    toastEl.className = 'sw-update-toast';
    toastEl.setAttribute('role', 'status');

    var text = document.createElement('span');
    text.className = 'sw-update-toast-text';
    text.setAttribute('data-ar', 'تحديث متاح');
    text.setAttribute('data-en', 'Update available');
    text.textContent = tx('تحديث متاح', 'Update available');

    var btn = document.createElement('button');
    btn.className = 'sw-update-toast-btn';
    btn.setAttribute('data-ar', 'تحديث');
    btn.setAttribute('data-en', 'Update');
    btn.textContent = tx('تحديث', 'Update');

    var close = document.createElement('button');
    close.className = 'sw-update-toast-close';
    close.setAttribute('aria-label', tx('إغلاق', 'Dismiss'));
    close.textContent = '✕';

    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = tx('جارٍ التحديث…', 'Updating…');
      worker.postMessage({ type: 'SKIP_WAITING' });
    });

    close.addEventListener('click', dismiss);

    toastEl.appendChild(text);
    toastEl.appendChild(btn);
    toastEl.appendChild(close);
    document.body.appendChild(toastEl);

     
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    document.addEventListener('garden:languageChanged', applyLang);
  }

  function applyLang() {
    if (!toastEl) return;
    toastEl.querySelectorAll('[data-ar]').forEach(function (el) {
      el.textContent = tx(el.getAttribute('data-ar'), el.getAttribute('data-en'));
    });
    var c = toastEl.querySelector('.sw-update-toast-close');
    if (c) c.setAttribute('aria-label', tx('إغلاق', 'Dismiss'));
  }

  function dismiss() {
    if (!toastEl) return;
    var el = toastEl;
    toastEl = null;
    document.removeEventListener('garden:languageChanged', applyLang);
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode) el.remove(); }, 260);
  }

   
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).then(function (reg) {
       
      if (reg.waiting && navigator.serviceWorker.controller) {
        showUpdateToast(reg.waiting);
        return;
      }

      reg.addEventListener('updatefound', function () {
        var incoming = reg.installing;
        if (!incoming) return;
        incoming.addEventListener('statechange', function () {
          if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(incoming);
          }
        });
      });
    }).catch(function () {   });
  });
})();
