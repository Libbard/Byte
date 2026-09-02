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
    return (i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
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

  /*@3.FIPJ.17*/
  var liveRoot = null, liveT = 0, liveOn = null;

  function clearT() { if (liveT) { clearTimeout(liveT); liveT = 0; } }

  /*@3.FIPJ.18*/
  function ttl(el, ms) {
    clearT();
    if (!el || !(ms > 0)) return;
    var left = ms, from = Date.now();
    var tick = function () { liveT = setTimeout(function () { close(liveRoot); }, left); };
    var hold = function () {
      left = Math.max(1200, left - (Date.now() - from));
      clearT();
    };
    var go = function () { from = Date.now(); tick(); };
    el.addEventListener('pointerenter', hold);
    el.addEventListener('focusin', hold);
    el.addEventListener('pointerleave', go);
    el.addEventListener('focusout', go);
    tick();
  }

  function watch(root) {
    liveRoot = root;
    if (liveOn) return;
    liveOn = {
      key: function (e) {
        if (e.key !== 'Escape' || !liveRoot) return;
        var el = liveRoot.querySelector('.nfo');
        if (!el || el.classList.contains('nfo--busy')) return;
        e.stopPropagation();
        close(liveRoot);
      },
      out: function (e) {
        if (!liveRoot) return;
        var el = liveRoot.querySelector('.nfo');
        if (!el || el.contains(e.target)) return;
        if (el.classList.contains('nfo--busy')) return;
        close(liveRoot);
      }
    };
    document.addEventListener('keydown', liveOn.key, true);
    document.addEventListener('pointerdown', liveOn.out, true);
  }

  function bar(root) {
    var el = root.querySelector('.nfo');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'nfo';
    el.setAttribute('role', 'status');
    root.insertBefore(el, root.firstChild);
    watch(root);
    return el;
  }

  function close(root) {
    clearT();
    if (!root) return;
    var el = root.querySelector('.nfo');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /*@3.FIPJ.12*/
  var last = null;

  /*@3.FIPJ.16*/
  var VOW_LS = '__filesVow';

  function vowed() {
    try { return localStorage.getItem(VOW_LS) === '1'; } catch (e) { return false; }
  }

  function promise(root, r) {
    if (!last || !last.line) return;
    var head = (r && r.deduped)
      ? L('كان عندنا سلفاً — لم نحتج إلى رفعه',
          'It was already here — no upload was needed')
      : L('حُفظت نسخةٌ عندنا', 'A copy is now kept with us');
    var said = vowed();
    var el = last.line('fa-cloud', 'nfo--ok' + (said ? '' : ' nfo--vow'),
      '<b>' + esc(head) + '</b> ' +
      esc(L('· يفتح الآن على أجهزتك الأخرى.',
            '· it now opens on your other devices.')) +
      ((r && r.bytes) ? ' <span class="nfo-dim">' + esc(size(r.bytes)) + '</span>' : '') +
      (said ? '' :
        '<span class="nfo-vow">' +
        '<b>' + esc(L('نضمن حفظَ الملفِّ ثلاثةَ أيّامٍ على الأقلّ.',
                      'We guarantee this file for at least three days.')) + '</b> ' +
        esc(L('وبعدها — إذا امتلأت مساحتُنا — نحذف الأقدمَ أوّلاً.',
              'After that, if our space fills up, we remove the oldest first.')) +
        '<br>' +
        esc(L('أمّا رسومُك وملاحظاتُك فمحفوظةٌ باستمرارٍ إن شاء الله ولا تُحذف. ' +
              'الملفُّ الأصلُ وحدَه هو ما قد يُحذف، وتستطيع اختيارَه من جهازك متى شئت.',
              'Your drawings and notes are kept continuously and are never deleted. ' +
              'Only the original file may be removed, and you can pick it again from ' +
              'your device whenever you like.')) +
        '</span>'));
    /*@3.FIPJ.29*/
    if (said) { ttl(el, 7000); return; }
    try { localStorage.setItem(VOW_LS, '1'); } catch (e) {}
    if (el) { el.setAttribute('role', 'alert'); ttl(el, 20000); }
  }

  /*@3.FIPJ.23*/
  function excuse(why) {
    if (why === 'no_vault') {
      return L('فعّلِ المزامنةَ أوّلاً — من ⚙ الإعدادات ← المزامنة. عندها يُحفظ الملفُّ '
               + 'عندنا ويفتح على بقيّةِ أجهزتك.',
               'Turn sync on first — Settings ⚙ → Sync. Then the file is kept with us '
               + 'and opens on your other devices.');
    }
    if (why === 'locked') {
      return L('خزنتُك مقفلةٌ على هذا الجهاز. افتحْها من المزامنةِ ثمَّ أعِدْ المحاولة.',
               'Your vault is locked on this device. Unlock it from Sync, then try again.');
    }
    if (why === 'not_enrolled') {
      return L('حفظُ الملفّاتِ عندنا ما زال في التجربةِ ولم يُفتح لحسابك بعد. '
               + 'ورسومُك وملاحظاتُك تُزامَن كالمعتاد.',
               'Keeping files with us is still in testing and is not open to your '
               + 'account yet. Your drawings and notes sync as usual.');
    }
    if (why === 'not_configured') {
      return L('خدمةُ الملفّاتِ متوقّفةٌ الآن عندنا — لا عندك. جرّبْ بعد قليل.',
               'Our file service is down right now — not yours. Try again shortly.');
    }
    if (why === 'rate_limited') {
      return L('محاولاتٌ كثيرةٌ في وقتٍ قصير. انتظرْ دقيقةً ثمَّ أعِدْ المحاولة.',
               'Too many attempts in a short time. Wait a minute, then try again.');
    }
    if (why === 'offline') {
      return L('لا اتّصالَ بالشبكةِ الآن. عملُك محفوظٌ على هذا الجهازِ ويُرفع حين تعود.',
               'You are offline. Your work is saved on this device and will upload '
               + 'when you are back.');
    }
    return L('تعذّر الوصولُ إلى خدمةِ الملفّات', 'The file service could not be reached') +
           (why ? ' (' + why + ')' : '') + '.';
  }

  /*@3.FIPJ.11*/
  /*@3.FIPJ.24*/
  function ask() {
    if (!last) return false;
    var f = F();
    if (!f) return false;
    var h = last.h, mine = last;
    mine.wait();
    f.state().then(function (a) {
      if (mine !== last) return;
      if (!a.ok) { mine.no(a.why); return; }
      var row = (a.files || []).filter(function (x) {
        return x.ref_id === refIdOf(h);
      })[0];
      if (row) { mine.have(row.stored_bytes); return; }
      mine.draw();
    })['catch'](function (e) {
      if (mine === last) mine.no((e && e.message) || '');
    });
    return true;
  }

  /*@3.FIPJ.25*/
  function forget() {
    if (last && last.root) close(last.root);
    last = null;
    liveRoot = null;
  }

  function state(h) {
    return !!(last && last.h === h);
  }

  /*@3.FIPJ.5*/
  /*@3.FIPJ.26*/
  function offer(root, h, name, getFile) {
    var f = F();
    if (!f || !h || !root) return;

    f.state().then(function (a) {
      if (!a.ok) return;
      var mine = (a.files || []).filter(function (x) { return x.ref_id === refIdOf(h); })[0];
      /*@3.FIPJ.8*/
      /*@3.FIPJ.14*/
      if (mine) { markSeen(h); return; }
      if (seen()[refIdOf(h)]) return;
      draw();
    })['catch'](function () {});

    /*@3.FIPJ.19*/
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
      /*@3.FIPJ.20*/
      var asks = !!(acts && acts.indexOf('<button') >= 0);
      var busyNow = /nfo--busy/.test(cls || '');
      if (!asks && !busyNow) ttl(el, /nfo--bad/.test(cls || '') ? 12000 : 6000);
      else clearT();
      return el;
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

    /*@3.FIPJ.13*/
    last = {
      root: root, h: h,
      draw: draw,
      line: line,
      /*@3.FIPJ.21*/
      wait: function () {
        line('fa-circle-notch fa-spin', 'nfo--wait',
             '<span class="nfo-msg">' + esc(L('يُسأل عنه…', 'Checking…')) + '</span>');
      },
      have: function (b) {
        line('fa-cloud', 'nfo--ok',
          '<b>' + esc(L('نسخةٌ محفوظةٌ عندنا', 'A copy is kept with us')) + '</b> ' +
          esc(L('· يفتح على أجهزتك الأخرى.', '· it opens on your other devices.')) +
          (b ? ' <span class="nfo-dim">' + esc(size(b)) + '</span>' : ''));
      },
      /*@3.FIPJ.22*/
      no: function (why) { line('fa-triangle-exclamation', 'nfo--bad', esc(excuse(why))); }
    };

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

      /*@3.FIPJ.27*/
      F().upload(file, { refId: refIdOf(h), name: name || file.name || 'file.pdf',
                         mime: 'application/pdf',
                         over: !!over, signal: ac ? ac.signal : null })
        .then(function (r) {
          window.removeEventListener('garden:fileProgress', on);
          markSeen(h);
          try {
            window.dispatchEvent(new CustomEvent('garden:fileUploaded',
              { detail: { ref_id: refIdOf(h), h: h, bytes: r.bytes } }));
          } catch (e) {}
          /*@3.FIPJ.15*/
          promise(root, r);
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
        return excuse(k === 'not_found' ? 'not_enrolled' : 'not_configured');
      }
      /*@3.FIPJ.28*/
      if (k === 'no_vault') return excuse('no_vault');
      if (k === 'bad_mime') {
        return L('هذه الصيغةُ لا نقبلها بعد' + (e && e.mime ? ' (' + e.mime + ')' : '') + '.',
                 'We do not accept this format yet' +
                 (e && e.mime ? ' (' + e.mime + ')' : '') + '.');
      }
      if (k === 'vault_full') {
        return L('امتلأت مساحتُك عندنا. احذفْ ملفّاً قديماً ثمَّ أعِدْ المحاولة.',
                 'Your space with us is full. Remove an old file, then try again.');
      }
      if (k === 'not_uploaded') {
        return L('انقطع الرفعُ قبل أن يصل شيء — أعِدْ المحاولة.',
                 'The upload stopped before anything arrived — please try again.');
      }
      if (k === 'rate_limited') return excuse('rate_limited');
      if (/^put_/.test(k)) {
        return L('انقطع الاتّصالُ أثناء الرفع — أعِدْ المحاولة.',
                 'The connection dropped during upload — please try again.');
      }
      return L('تعذّر الرفع.', 'Upload failed.');
    }
  }

  window.GardenFilesPdf = { restore: restore, offer: offer, refIdOf: refIdOf,
                            ask: ask, state: state, forget: forget };
})();
