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

    f.available().then(function (a) {
      if (!a.ok) return;
      return f.list().then(function (r) {
        var mine = (r.files || []).filter(function (x) { return x.ref_id === refIdOf(h); })[0];
        /*@3.FIPJ.8*/
        if (mine) { markSeen(h); saved(mine.stored_bytes); return; }
        if (seen()[refIdOf(h)]) return;
        draw();
      });
    })['catch'](function () {});

    function line(icon, cls, html, acts, label) {
      var el = bar(root);
      el.className = 'nfo' + (cls ? ' ' + cls : '');
      el.innerHTML =
        '<i class="fa-solid ' + icon + ' nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt">' + html + '</div>' +
        '<div class="nfo-acts">' + (acts || '') +
        '<button type="button" class="gsf-btn gsf-btn--ghost nfo-no" aria-label="' +
        esc(label || L('إغلاق', 'Dismiss')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
      el.querySelector('.nfo-no').addEventListener('click', function () { close(root); });
      return el;
    }

    function saved(bytes) {
      line('fa-cloud', 'nfo--ok',
        '<b>' + esc(L('محفوظٌ في الحديقة', 'Saved in the garden')) + '</b> ' +
        esc(L('· يفتح على أجهزتك الأخرى.', '· it opens on your other devices.')) +
        (bytes ? ' <span class="nfo-dim">' + esc(size(bytes)) + '</span>' : ''));
      setTimeout(function () { close(root); }, 7000);
    }

    function draw() {
      line('fa-cloud-arrow-up', '',
        '<b>' + esc(L('الملفُّ على هذا الجهاز وحدَه',
                      'This file is on this device only')) + '</b> ' +
        esc(L('· ورسومُك عليه محفوظةٌ ومتزامنة. ولتفتحه وتحمّله على أجهزتك الأخرى، ارفعْه إلينا.',
              '· your drawings on it are saved and synced. To open and download it on your ' +
              'other devices, upload it to us.')),
        '<button type="button" class="gsf-btn gsf-btn--go nfo-up">' +
        esc(L('ارفعْه', 'Upload')) + '</button>')
        .querySelector('.nfo-up').addEventListener('click', function () { pick(false); });
    }

    function pick(over) {
      Promise.resolve(getFile()).then(function (file) {
        if (!file) {
          line('fa-triangle-exclamation', 'nfo--bad',
               esc(L('تعذّرت قراءةُ الملفِّ من هذا الجهاز.',
                     'The file could not be read from this device.')));
          return;
        }
        run(file, over);
      });
    }

    /*@3.FIPJ.9*/
    function big(e, file) {
      if (e.error === 'too_large' && !e.over_max) {
        line('fa-triangle-exclamation', 'nfo--bad',
          esc(L('حجمُ الملفِّ ' + size(e.bytes) + ' ويتجاوز الحدَّ الأقصى ' + size(e.max) + '.',
                'The file is ' + size(e.bytes) + ', over the hard limit of ' +
                size(e.max) + '.')));
        return;
      }
      if (e.error === 'over_exhausted' || !(e.over_left > 0)) {
        line('fa-triangle-exclamation', 'nfo--bad',
          esc(L('حجمُ الملفِّ ' + size(e.bytes) + ' والحدُّ ' + size(e.max) +
                ' · وقد استنفدتَ تجاوزاتِ هذا الفصل.',
                'The file is ' + size(e.bytes) + ' and the limit is ' + size(e.max) +
                ' · you have used all of this term’s exceptions.')));
        return;
      }
      line('fa-circle-question', '',
        '<b>' + esc(L('حجمُ الملفِّ ' + size(e.bytes) + ' والحدُّ ' + size(e.max),
                      'The file is ' + size(e.bytes) + '; the limit is ' + size(e.max))) +
        '</b> ' +
        esc(L('· ولك في كلِّ فصلٍ ' + e.over_of + ' ملفّاتٍ حتى ' + size(e.over_max) +
              '، بقي لك ' + e.over_left + '.',
              '· each term you may upload ' + e.over_of + ' files up to ' + size(e.over_max) +
              '; ' + e.over_left + ' left.')),
        '<button type="button" class="gsf-btn gsf-btn--go nfo-up">' +
        esc(L('ارفعْه واحسبْها', 'Use one and upload')) + '</button>')
        .querySelector('.nfo-up').addEventListener('click', function () { run(file, true); });
    }

    function run(file, over) {
      var el = bar(root);
      el.className = 'nfo nfo--busy';
      el.innerHTML =
        '<i class="fa-solid fa-cloud-arrow-up nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt"><span class="nfo-msg">' +
        esc(L('يُهيَّأ…', 'Preparing…')) + '</span> ' +
        '<span class="nfo-dim">' +
        esc(L('واصِلْ عملَك — رسومُك وتعديلاتُك مستقلّةٌ عن أصلِ الملفّ، ويمكن استبدالُه متى شئت.',
              'Keep working — your drawings and edits are independent of the original file, ' +
              'which you can replace at any time.')) + '</span></div>' +
        '<span class="nfo-track"><span class="nfo-fill"></span></span>' +
        '<div class="nfo-acts"><button type="button" class="gsf-btn gsf-btn--ghost nfo-no" ' +
        'aria-label="' + esc(L('إلغاء الرفع', 'Cancel upload')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
      var msg = el.querySelector('.nfo-msg');
      var fill = el.querySelector('.nfo-fill');
      var ac = window.AbortController ? new AbortController() : null;
      el.querySelector('.nfo-no').addEventListener('click', function () {
        if (ac) { try { ac.abort(); } catch (e) {} }
        close(root);
      });

      function on(e) {
        var d = e.detail || {};
        if (d.ref_id !== refIdOf(h)) return;
        var pct = d.of ? Math.round(d.at * 100 / d.of) : null;
        if (fill && pct != null) fill.style.width = pct + '%';
        if (!msg) return;
        if (d.stage === 'hash') {
          msg.textContent = L('تُقرأ بصمةُ الملفّ ', 'Reading fingerprint ') + (pct || 0) + '%';
        } else if (d.stage === 'probe') {
          msg.textContent = L('يُسأل عنه…', 'Checking…');
        } else if (d.stage === 'deduped') {
          if (fill) fill.style.width = '100%';
          msg.textContent = L('موجودٌ عندنا سلفاً', 'Already here');
        } else if (d.stage === 'upload') {
          msg.textContent = L('يُرفع ', 'Uploading ') + (pct || 0) + '%';
        } else if (d.stage === 'commit') {
          /*@3.FIPJ.10*/
          if (fill) fill.style.width = '100%';
          msg.textContent = L('يُتحقَّق من سلامةِ ما وصل…', 'Verifying what arrived…');
        }
      }
      window.addEventListener('garden:fileProgress', on);

      F().upload(file, { refId: refIdOf(h), name: name || file.name || 'file.pdf',
                         over: !!over, signal: ac ? ac.signal : null })
        .then(function (r) {
          window.removeEventListener('garden:fileProgress', on);
          markSeen(h);
          line('fa-cloud', 'nfo--ok',
            '<b>' + esc(r.deduped
              ? L('كان محفوظاً عندنا سلفاً', 'It was already saved with us')
              : L('حُفظ في الحديقة', 'Saved to the garden')) + '</b> ' +
            esc(L('· يفتح الآن على أجهزتك الأخرى.', '· it now opens on your other devices.')) +
            (r.bytes ? ' <span class="nfo-dim">' + esc(size(r.bytes)) + '</span>' : ''));
          setTimeout(function () { close(root); }, 7000);
        }, function (e) {
          window.removeEventListener('garden:fileProgress', on);
          if (e && (e.error === 'too_large' || e.error === 'over_exhausted')) {
            big(e, file); return;
          }
          if (e && /aborted/.test(e.message || '')) { close(root); return; }
          line('fa-triangle-exclamation', 'nfo--bad', esc(reason(e)));
        });
    }

    /*@3.FIPJ.6*/
    function reason(e) {
      var k = (e && (e.error || e.message)) || '';
      if (k === 'too_many_files') {
        return L('بلغتَ عددَ الملفّاتِ المسموحِ في حسابك.',
                 'You have reached the file count limit on your account.');
      }
      if (k === 'hash_mismatch') {
        return L('ما وصلنا يخالف ما أُرسل — أعِدْ المحاولة.',
                 'What arrived differs from what was sent — please try again.');
      }
      if (k === 'not_found' || k === 'files_not_configured') {
        return L('رفعُ الملفّات غيرُ متاحٍ في حسابك بعد.',
                 'File upload is not available on your account yet.');
      }
      if (/^put_/.test(k)) {
        return L('انقطع الاتّصالُ أثناء الرفع — أعِدْ المحاولة.',
                 'The connection dropped during upload — please try again.');
      }
      return L('تعذّر الرفع.', 'Upload failed.');
    }
  }

  window.GardenFilesPdf = { restore: restore, offer: offer, refIdOf: refIdOf };
})();
