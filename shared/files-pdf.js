/*@3.FIPJ.1*/
;(function () {
  'use strict';

  var SEEN_LS = '__filesOffer';
  var VOW_LS = '__filesVow';

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
  function day(t) {
    var d = new Date(t);
    if (!d.getTime()) return '';
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  /*@3.FIPJ.2*/
  function refIdOf(h) { return 'pdf_' + String(h || '').slice(0, 40); }

  function F() { return window.GardenFiles || null; }
  function GD() { return window.GardenDrive || null; }
  function P() { return window.GardenPop || null; }

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
  function vowed() {
    try { return localStorage.getItem(VOW_LS) === '1'; } catch (e) { return false; }
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

  /*@3.FIPJ.13*/
  var cur = null;
  var pop = null;
  var guard = null;
  var unsettle = null;
  var busy = false;
  var prog = 0;
  var ac = null;
  var doneT = 0;

  function anchor() { return document.getElementById('na-cloud'); }

  function repaint() {
    var A = window.GardenNotesApp;
    if (A && A.repaintCloud) { try { A.repaintCloud(); } catch (e) {} }
  }

  /*@3.FIPJ.34*/
  function flash() {
    var b = anchor();
    if (!b) return;
    clearTimeout(doneT);
    b.setAttribute('data-done', '1');
    doneT = setTimeout(function () {
      var c = anchor();
      if (c) c.removeAttribute('data-done');
    }, 3000);
  }

  function shut() {
    if (guard) { guard.off(); guard = null; }
    if (unsettle) { unsettle(); unsettle = null; }
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null;
    var b = anchor();
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function open() {
    if (pop && pop.parentNode) return pop;
    pop = document.createElement('div');
    pop.className = 'gsf-pop nfp';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', L('نسخةُ الملفّ', 'File copy'));
    document.body.appendChild(pop);
    var b = anchor();
    var fb = (cur && cur.root) || null;
    var pp = P();
    if (pp) {
      pp.place(pop, b, fb);
      unsettle = pp.settle(pop, b, fb);
    }
    if (b) b.setAttribute('aria-expanded', 'true');
    return pop;
  }

  /*@3.FIPJ.30*/
  function paint(cls, html, ttl) {
    var el = open();
    el.className = 'gsf-pop nfp ' + cls;
    el.innerHTML = html;
    var b = anchor();
    var pp = P();
    if (pp) pp.place(el, b, (cur && cur.root) || null);
    if (guard) { guard.off(); guard = null; }
    if (pp) {
      guard = pp.watch(el, {
        close: shut,
        ttl: ttl || 0,
        skip: function (t) { return !!(b && b.contains(t)); }
      });
    }
    var x = el.querySelector('.nfp-no');
    if (x) x.addEventListener('click', shut);
    return el;
  }

  function shutBtn(label) {
    return '<button type="button" class="gsf-btn gsf-btn--ghost nfp-no" aria-label="' +
      esc(label || L('إغلاق', 'Dismiss')) + '"' +
      ' data-ar-title="إغلاق" data-en-title="Dismiss">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
  }

  function markIcon(kind) {
    if (kind === 'us') {
      return '<i class="fa-solid fa-cloud nfp-i" aria-hidden="true"></i>';
    }
    if (kind === 'drive') {
      return '<i class="fa-brands fa-google-drive nfp-i" aria-hidden="true"></i>';
    }
    if (kind === 'up') {
      return '<i class="fa-solid fa-cloud-arrow-up nfp-i" aria-hidden="true"></i>';
    }
    if (kind === 'bad') {
      return '<i class="fa-solid fa-triangle-exclamation nfp-i" aria-hidden="true"></i>';
    }
    if (kind === 'wait') {
      return '<i class="fa-solid fa-circle-notch fa-spin nfp-i" aria-hidden="true"></i>';
    }
    return '<i class="fa-solid fa-cloud nfp-i na-hollow" aria-hidden="true"></i>';
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

  /*@3.FIPJ.19*/
  function sayDevice() {
    var gd = GD();
    var can = !!(gd && gd.enabled());
    if (can && gd.warm) { try { gd.warm(); } catch (e) {} }
    paint('nfp--say',
      markIcon('here') +
      '<div class="nfp-txt"><b>' +
      esc(L('على هذا الجهازِ وحدَه', 'On this device only')) + '</b>' +
      '<span>' + esc(L('احفظْ نسخةً لتفتحه على أجهزتك',
                       'Keep a copy to open it on your devices')) + '</span></div>' +
      '<button type="button" class="gsf-btn gsf-btn--pri nfp-us">' +
      esc(L('احفظْ عندنا', 'Keep with us')) + '</button>' +
      (can ? '<button type="button" class="gsf-btn nfp-gd" aria-label="' +
             esc(L('احفظْ في درايفي', 'Save to my Drive')) + '"' +
             ' data-ar-title="احفظْ في درايفي" data-en-title="Save to my Drive">' +
             '<i class="fa-brands fa-google-drive" aria-hidden="true"></i></button>' : '') +
      shutBtn());
    bind('.nfp-us', function () { toUs(false); });
    bind('.nfp-gd', toDrive);
  }

  /*@3.FIPJ.11*/
  function sayUp() {
    var pc = Math.round(prog * 100);
    var el = paint('nfp--say nfp--prog',
      markIcon('up') +
      '<div class="nfp-txt"><b>' +
      esc(L('يُرفع ', 'Uploading ')) + '<span dir="ltr">' + pc + '%</span></b>' +
      '<span>' + esc(L('واصِلْ عملَك — رسومُك مستقلّةٌ عن أصلِ الملفّ.',
                       'Keep working — your drawings are independent of the file.')) +
      '</span></div>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nfp-kill">' +
      esc(L('ألغِ', 'Cancel')) + '</button>');
    el.style.setProperty('--p', pc + '%');
    bind('.nfp-kill', function () {
      if (ac) { try { ac.abort(); } catch (e) {} }
      busy = false;
      repaint();
      shut();
    });
    return el;
  }

  function tick() {
    if (!pop || !busy) return;
    var pc = Math.round(prog * 100);
    pop.style.setProperty('--p', pc + '%');
    var b = pop.querySelector('.nfp-txt b span');
    if (b) b.textContent = pc + '%';
  }

  /*@3.FIPJ.33*/
  function cardUs(bytes, when, both) {
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon(both ? 'us' : 'us') + '<b>' +
      esc(both ? L('محفوظٌ عندنا وفي درايفك', 'Kept with us and in your Drive')
               : L('نسخةٌ محفوظةٌ عندنا', 'A copy is kept with us')) + '</b>' +
      shutBtn() + '</div>' +
      '<span class="nfp-sub">' +
      (bytes ? '<span dir="ltr">' + esc(size(bytes)) + '</span> · ' : '') +
      (when ? esc(L('منذ ', 'since ')) + '<span dir="ltr">' + esc(day(when)) + '</span> · ' : '') +
      esc(L('يفتح على أجهزتك جميعاً.', 'it opens on all your devices.')) + '</span>' +
      '<div class="nfp-acts">' +
      '<button type="button" class="gsf-btn nfp-swap">' +
      '<i class="fa-solid fa-rotate" aria-hidden="true"></i> ' +
      esc(L('استبدلْه', 'Replace it')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nfp-drop">' +
      esc(L('احذفِ النسخة', 'Delete the copy')) + '</button></div>');
    bind('.nfp-swap', swap);
    bind('.nfp-drop', askDrop);
  }

  function cardDrive() {
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon('drive') + '<b>' +
      esc(L('نسخةٌ في درايفك', 'A copy is in your Drive')) + '</b>' + shutBtn() + '</div>' +
      '<span class="nfp-sub">' +
      esc(L('في مجلّد «الحديقة الرقمية» بحسابك — ولا نرى من درايفك إلا ما أنشأناه.',
            'In the "Digital Garden" folder in your account — we only ever see what '
            + 'we created there.')) + '</span>' +
      '<div class="nfp-acts">' +
      '<button type="button" class="gsf-btn gsf-btn--pri nfp-us">' +
      '<i class="fa-solid fa-cloud" aria-hidden="true"></i> ' +
      esc(L('احفظْ عندنا أيضاً', 'Keep with us too')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nfp-swap">' +
      esc(L('استبدلْه', 'Replace it')) + '</button></div>');
    bind('.nfp-us', function () { toUs(false); });
    bind('.nfp-swap', swap);
  }

  /*@3.FIPJ.22*/
  function bad(why) {
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon('bad') + '<b>' +
      esc(L('لم تُحفظِ النسخة', 'The copy was not saved')) + '</b>' + shutBtn() + '</div>' +
      '<span class="nfp-sub">' + esc(why) + '</span>', 12000);
  }

  /*@3.FIPJ.21*/
  function wait() {
    paint('nfp--say', markIcon('wait') +
      '<div class="nfp-txt"><b>' + esc(L('يُسأل عنه…', 'Checking…')) + '</b></div>');
  }

  function bind(sel, fn) {
    var b = pop && pop.querySelector(sel);
    if (b) b.addEventListener('click', fn);
  }

  /*@3.FIPJ.15*/
  /*@3.FIPJ.16*/
  function vow() {
    if (vowed()) return false;
    try { localStorage.setItem(VOW_LS, '1'); } catch (e) {}
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon('us') + '<b>' +
      esc(L('حُفظت نسخةٌ عندنا', 'A copy is now kept with us')) + '</b>' +
      shutBtn() + '</div>' +
      '<span class="nfp-sub">' +
      '<b>' + esc(L('نضمن حفظَ الملفِّ ثلاثةَ أيّامٍ على الأقلّ.',
                    'We guarantee this file for at least three days.')) + '</b> ' +
      esc(L('وبعدها — إذا امتلأت مساحتُنا — نحذف الأقدمَ أوّلاً. أمّا رسومُك وملاحظاتُك '
            + 'فمحفوظةٌ باستمرارٍ ولا تُحذف، والأصلُ وحدَه هو ما قد يُحذف وتختاره من '
            + 'جهازك متى شئت.',
            'After that, if our space fills up, we remove the oldest first. Your '
            + 'drawings and notes are kept continuously and are never deleted — only '
            + 'the original file may go, and you can pick it again any time.')) +
      '</span>', 20000);
    return true;
  }

  function grab() {
    if (!cur || !cur.getFile) return Promise.resolve(null);
    try { return Promise.resolve(cur.getFile())['catch'](function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }

  /*@3.FIPJ.27*/
  function toUs(over) {
    grab().then(function (file) {
      if (!file) {
        bad(L('تعذّرت قراءةُ الملفِّ من هذا الجهاز.',
              'The file could not be read from this device.'));
        return;
      }
      run(file, over);
    });
  }

  function run(file, over) {
    var h = cur.h;
    var refId = refIdOf(h);
    busy = true; prog = 0;
    repaint();
    shut();
    ac = window.AbortController ? new AbortController() : null;

    /*@3.FIPJ.10*/
    function on(e) {
      var d = e.detail || {};
      if (d.ref_id !== refId) return;
      if (d.of) prog = Math.max(0, Math.min(1, d.at / d.of));
      if (d.stage === 'deduped' || d.stage === 'commit') prog = 1;
      tick();
    }
    window.addEventListener('garden:fileProgress', on);

    F().upload(file, { refId: refId, name: cur.name || file.name || 'file.pdf',
                       mime: 'application/pdf',
                       over: !!over, signal: ac ? ac.signal : null })
      .then(function (r) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        markSeen(h);
        try {
          window.dispatchEvent(new CustomEvent('garden:fileUploaded',
            { detail: { ref_id: refId, h: h, bytes: r.bytes, to: 'us' } }));
        } catch (e) {}
        repaint();
        flash();
        if (!vow()) shut();
      }, function (e) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        repaint();
        if (e && (e.error === 'too_large' || e.error === 'over_exhausted')) {
          big(e, file); return;
        }
        if (e && /aborted/.test(e.message || '')) { shut(); return; }
        bad(reason(e));
      });
  }

  /*@3.FIPJ.32*/
  function toDrive() {
    var gd = GD();
    if (!gd || !gd.enabled()) return;
    grab().then(function (file) {
      if (!file) {
        bad(L('تعذّرت قراءةُ الملفِّ من هذا الجهاز.',
              'The file could not be read from this device.'));
        return;
      }
      var h = cur.h;
      busy = true; prog = 0;
      repaint();
      shut();
      ac = window.AbortController ? new AbortController() : null;
      gd.upload(file, {
        name: cur.name || file.name || 'file.pdf',
        mime: 'application/pdf',
        sha: h,
        tag: 'pdf',
        signal: ac ? ac.signal : null,
        onProgress: function (at, of) {
          if (of) { prog = Math.max(0, Math.min(1, at / of)); tick(); }
        }
      }).then(function (r) {
        busy = false;
        if (cur && cur.h === h) cur.gd = (r && r.id) || null;
        try {
          window.dispatchEvent(new CustomEvent('garden:fileDrive',
            { detail: { h: h, id: r && r.id, name: r && r.name } }));
        } catch (e) {}
        repaint();
        flash();
        shut();
      }, function (e) {
        busy = false;
        repaint();
        var k = (e && (e.code || e.message)) || '';
        if (/aborted/.test(k)) { shut(); return; }
        bad(gd.reason(e));
      });
    });
  }

  /*@3.FIPJ.31*/
  function swap() {
    var A = window.GardenNotesApp;
    shut();
    if (A && A.relinkPdf) { try { A.relinkPdf(); return; } catch (e) {} }
    var O = window.GardenPdfOpen;
    if (!O) return;
    O.pickFile().then(function (f) { if (f) toUs(true); });
  }

  function askDrop() {
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon('us') + '<b>' +
      esc(L('تُحذف النسخةُ من عندنا؟', 'Delete the copy kept with us?')) + '</b>' +
      shutBtn() + '</div>' +
      '<span class="nfp-sub">' +
      esc(L('يبقى الملفُّ على هذا الجهازِ ورسومُك كما هي — ولن يفتح على أجهزتك الأخرى.',
            'The file stays on this device and your drawings are untouched — it just '
            + 'will not open on your other devices.')) + '</span>' +
      '<div class="nfp-acts">' +
      '<button type="button" class="gsf-btn nfp-yes">' +
      esc(L('احذفْ', 'Delete')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nfp-nope">' +
      esc(L('تراجعْ', 'Keep')) + '</button></div>');
    bind('.nfp-nope', function () { ask(true); });
    bind('.nfp-yes', function () {
      var f = F();
      var h = cur && cur.h;
      if (!f || !h) { shut(); return; }
      wait();
      f.remove(refIdOf(h)).then(function () {
        try {
          window.dispatchEvent(new CustomEvent('garden:fileDropped',
            { detail: { ref_id: refIdOf(h), h: h } }));
        } catch (e) {}
        repaint();
        if (cur && cur.gd) cardDrive(); else sayDevice();
      }, function (e) { bad(reason(e)); });
    });
  }

  /*@3.FIPJ.9*/
  function big(e, file) {
    if (e.error === 'too_large' && !e.over_max) {
      bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' ويتجاوز الحدَّ الأقصى ' + size(e.max) + '.',
            'The file is ' + size(e.bytes) + ', over the hard limit of ' + size(e.max) + '.'));
      return;
    }
    if (e.error === 'over_exhausted' || !(e.over_left > 0)) {
      bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' والحدُّ ' + size(e.max) +
            ' · وقد استنفدتَ تجاوزاتِ هذا الفصل.',
            'The file is ' + size(e.bytes) + ' and the limit is ' + size(e.max) +
            ' · you have used all of this term’s exceptions.'));
      return;
    }
    paint('nfp--card',
      '<div class="nfp-head">' + markIcon('bad') + '<b>' +
      esc(L('حجمُ الملفِّ ' + size(e.bytes) + ' والحدُّ ' + size(e.max),
            'The file is ' + size(e.bytes) + '; the limit is ' + size(e.max))) + '</b>' +
      shutBtn() + '</div>' +
      '<span class="nfp-sub">' +
      esc(L('ولك في كلِّ فصلٍ ' + e.over_of + ' ملفّاتٍ حتى ' + size(e.over_max) +
            '، بقي لك ' + e.over_left + '.',
            'Each term you may upload ' + e.over_of + ' files up to ' + size(e.over_max) +
            '; ' + e.over_left + ' left.')) + '</span>' +
      '<div class="nfp-acts">' +
      '<button type="button" class="gsf-btn gsf-btn--pri nfp-go">' +
      esc(L('ارفعْه واحسبْها', 'Use one and upload')) + '</button></div>');
    bind('.nfp-go', function () { run(file, true); });
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

  /*@3.FIPJ.24*/
  function ask(force) {
    if (!cur) return false;
    if (pop && pop.parentNode && !force) { shut(); return true; }
    if (busy) { sayUp(); return true; }
    var f = F();
    var gdId = cur.gd || null;
    if (!f) {
      if (gdId) cardDrive(); else sayDevice();
      return true;
    }
    var mine = cur;
    wait();
    f.state().then(function (a) {
      /*@3.FIPJ.12*/
      if (mine !== cur || !pop) return;
      if (!a.ok) {
        if (gdId) { cardDrive(); return; }
        bad(excuse(a.why));
        return;
      }
      var row = (a.files || []).filter(function (x) {
        return x.ref_id === refIdOf(mine.h);
      })[0];
      if (row) { cardUs(row.stored_bytes, row.created_at, !!gdId); return; }
      if (gdId) { cardDrive(); return; }
      sayDevice();
    })['catch'](function (e) {
      if (mine !== cur || !pop) return;
      bad(reason(e));
    });
    return true;
  }

  /*@3.FIPJ.25*/
  function forget() {
    shut();
    cur = null;
    busy = false;
    prog = 0;
    clearTimeout(doneT);
    var b = anchor();
    if (b) b.removeAttribute('data-done');
  }

  function state(h) { return !!(cur && cur.h === h); }

  /*@3.FIPJ.5*/
  /*@3.FIPJ.8*/
  /*@3.FIPJ.14*/
  /*@3.FIPJ.26*/
  function offer(root, h, name, getFile, gd) {
    var f = F();
    if (!h) return;
    cur = { root: root || null, h: h, name: name || '', getFile: getFile, gd: gd || null };
    busy = false;
    prog = 0;
    repaint();
    if (!f) return;

    f.state().then(function (a) {
      if (!cur || cur.h !== h) return;
      if (!a.ok) return;
      var mine = (a.files || []).filter(function (x) { return x.ref_id === refIdOf(h); })[0];
      if (mine) { markSeen(h); repaint(); return; }
      if (cur.gd) return;
      if (seen()[refIdOf(h)]) return;
      markSeen(h);
      /*@3.FIPJ.18*/
      /*@3.FIPJ.20*/
      /*@3.FIPJ.29*/
      sayDevice();
      if (guard) guard.ttl(9000);
    })['catch'](function () {});
  }

  /*@3.FIPJ.17*/
  window.GardenFilesPdf = {
    restore: restore, offer: offer, refIdOf: refIdOf,
    ask: ask, state: state, forget: forget, close: shut,
    busy: function () { return busy; },
    drive: function (id) { if (cur) cur.gd = id || null; }
  };
})();
