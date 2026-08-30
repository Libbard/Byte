/*@3.FIPJ.1*/
;(function () {
  'use strict';

  var SEEN_LS = '__filesOffer';

  function isAr() {
    return (document.documentElement.lang ||
            localStorage.getItem('garden_lang') || 'ar') === 'ar';
  }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function size(n) {
    if (!(n > 0)) return '';
    var u = ['B', 'KB', 'MB'], i = 0, v = n;
    while (v >= 1024 && i < 2) { v /= 1024; i++; }
    return (v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
  }

  /*@3.FIPJ.2*/
  function refIdOf(h) { return 'pdf_' + String(h || '').slice(0, 40); }

  function F() { return window.GardenFiles || null; }

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN_LS) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function markSeen(h) {
    try {
      var o = seen(); o[refIdOf(h)] = 1;
      localStorage.setItem(SEEN_LS, JSON.stringify(o));
    } catch (e) {}
  }

  /*@3.FIPJ.3*/
  function restore(h, name, onProgress) {
    var f = F();
    if (!f || !h) return Promise.resolve(null);
    return f.fetchBytes(refIdOf(h), onProgress).then(function (got) {
      if (!got || !got.blob) return null;
      var file = new File([got.blob], got.name || name || 'file.pdf',
                          { type: got.mime || 'application/pdf' });
      /*@3.FIPJ.4*/
      var D = window.GardenPdfDoc;
      if (D && D.put) { try { D.put(h, file, { name: file.name }); } catch (e) {} }
      return file;
    })['catch'](function () { return null; });
  }

  function bar(root) {
    var el = root.querySelector('.nfo');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'nfo';
    el.setAttribute('role', 'status');
    root.insertBefore(el, root.firstChild);
    return el;
  }

  function close(root) {
    var el = root.querySelector('.nfo');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /*@3.FIPJ.5*/
  function offer(root, h, name, getFile, src) {
    var f = F();
    if (!f || !h || !root) return;
    /*@3.FIPJ.7*/
    if (src === 'drive' || src === 'cloud') return;
    if (seen()[refIdOf(h)]) return;

    f.available().then(function (a) {
      if (!a.ok) return;
      return f.list().then(function (r) {
        var have = (r.files || []).some(function (x) { return x.ref_id === refIdOf(h); });
        if (have) { markSeen(h); return; }
        draw();
      });
    })['catch'](function () {});

    function draw() {
      var el = bar(root);
      el.innerHTML =
        '<i class="fa-solid fa-cloud-arrow-up nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt"><b>' +
        esc(L('الملفُّ غيرُ محفوظٍ عندنا · ورسومُك عليه محفوظةٌ ومتزامنة.',
              'The file is not saved with us · your drawings on it are saved and synced.')) +
        '</b> ' +
        esc(L('ولحفظِه مؤقّتاً لتفتحه وتحمّله على أجهزتك الأخرى:',
              'To keep it temporarily so you can open and download it on your other devices:')) +
        '</div>' +
        '<div class="nfo-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--go nfo-up">' +
        esc(L('ارفعْه', 'Upload')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost nfo-no" aria-label="' +
        esc(L('إغلاق', 'Dismiss')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
        '</button></div>';

      el.querySelector('.nfo-no').addEventListener('click', function () {
        markSeen(h); close(root);
      });
      el.querySelector('.nfo-up').addEventListener('click', function () {
        Promise.resolve(getFile()).then(function (file) {
          if (!file) { done(L('تعذّر قراءةُ الملفّ.', 'Could not read the file.'), false); return; }
          run(file);
        });
      });
    }

    function run(file) {
      var el = bar(root);
      el.className = 'nfo nfo--busy';
      el.innerHTML =
        '<i class="fa-solid fa-cloud-arrow-up nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt"><span class="nfo-msg">' +
        esc(L('يُهيَّأ…', 'Preparing…')) + '</span>' +
        '<span class="nfo-track"><span class="nfo-fill"></span></span></div>';
      var msg = el.querySelector('.nfo-msg');
      var fill = el.querySelector('.nfo-fill');

      function on(e) {
        var d = e.detail || {};
        if (d.ref_id !== refIdOf(h)) return;
        var pct = d.of ? Math.round(d.at * 100 / d.of) : null;
        if (fill && pct != null) fill.style.width = pct + '%';
        if (!msg) return;
        if (d.stage === 'hash') {
          msg.textContent = L('تُقرأ بصمةُ الملفّ… ', 'Reading fingerprint… ') + (pct || 0) + '%';
        } else if (d.stage === 'probe') {
          msg.textContent = L('يُسأل عنه…', 'Checking…');
        } else if (d.stage === 'deduped') {
          if (fill) fill.style.width = '100%';
          msg.textContent = L('موجودٌ عندنا سلفاً — لا حاجةَ لرفعه.',
                              'Already here — no upload needed.');
        } else if (d.stage === 'upload') {
          msg.textContent = L('يُرفع… ', 'Uploading… ') + (pct || 0) + '%';
        } else if (d.stage === 'commit') {
          msg.textContent = L('يُثبَّت…', 'Finishing…');
        }
      }
      window.addEventListener('garden:fileProgress', on);

      F().upload(file, { refId: refIdOf(h), name: name || file.name || 'file.pdf' })
        .then(function (r) {
          window.removeEventListener('garden:fileProgress', on);
          markSeen(h);
          done(r.deduped
            ? L('كان عندنا سلفاً — ويفتح الآن على أجهزتك.',
                'It was already here — it opens on your devices now.')
            : L('حُفظ — ويفتح الآن على أجهزتك. ' + size(r.bytes),
                'Saved — it opens on your devices now. ' + size(r.bytes)), true);
        }, function (e) {
          window.removeEventListener('garden:fileProgress', on);
          done(reason(e), false);
        });
    }

    /*@3.FIPJ.6*/
    function reason(e) {
      var k = (e && (e.error || e.message)) || '';
      if (k === 'too_large') {
        return L('الملفُّ أكبرُ من الحدِّ المسموح.', 'The file is over the size limit.');
      }
      if (k === 'too_many_files') {
        return L('بلغتَ عددَ الملفّاتِ المسموح.', 'You have reached your file count limit.');
      }
      if (k === 'hash_mismatch') {
        return L('ما وصلنا يخالف ما أُرسل — أعِدْ المحاولة.',
                 'What arrived differs from what was sent — try again.');
      }
      if (k === 'not_found' || k === 'files_not_configured') {
        return L('رفعُ الملفّات غيرُ متاحٍ في حسابك بعد.',
                 'File upload is not available on your account yet.');
      }
      if (/^put_/.test(k) || k === 'put_network') {
        return L('انقطع الاتّصالُ أثناء الرفع.', 'The connection dropped during upload.');
      }
      return L('تعذّر الرفع.', 'Upload failed.');
    }

    function done(text, ok) {
      var el = bar(root);
      el.className = 'nfo ' + (ok ? 'nfo--ok' : 'nfo--bad');
      el.innerHTML =
        '<i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-triangle-exclamation') +
        ' nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt">' + esc(text) + '</div>' +
        '<div class="nfo-acts"><button type="button" class="gsf-btn gsf-btn--ghost nfo-no" ' +
        'aria-label="' + esc(L('إغلاق', 'Dismiss')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
      el.querySelector('.nfo-no').addEventListener('click', function () { close(root); });
      if (ok) setTimeout(function () { close(root); }, 6000);
    }
  }

  window.GardenFilesPdf = { restore: restore, offer: offer, refIdOf: refIdOf };
})();
