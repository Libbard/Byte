/*@3.AUNJ.1*/
;(function () {
  'use strict';

  /*@3.AUNJ.2*/
  /*@3.AUNJ.23*/
  var DEFAULT_BPS = 12000;
  var MAX_SEC     = 3 * 3600;
  var REF_PREFIX  = 'aud_';

  function isAr() {
    return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0;
  }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function size(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    if (v < 1048576) return Math.round(v / 1024) + ' KB';
    var mb = v / 1048576;
    return (mb < 100 ? mb.toFixed(1) : Math.round(mb)) + ' MB';
  }
  function clock(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + p(m) : m) + ':' + p(r);
  }
  function stamp(t) {
    var d = new Date(Number(t) || 0);
    if (!d.getTime()) return '';
    return d.toLocaleString(isAr() ? 'ar' : 'en', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function A() { return window.GardenAudioRec || null; }
  function F() { return window.GardenFiles || null; }
  function D() { return window.GardenPdfDoc || null; }
  function App() { return window.GardenNotesApp || null; }

  function doc() { var a = App(); return (a && a.doc) ? a.doc() : null; }
  function touch(quiet) {
    var a = App();
    if (a && a.save) { try { a.save(quiet); } catch (e) {} }
    badge();
  }
  function badge() {
    var b = document.getElementById('na-mic');
    if (b) b.classList.toggle('na-icb--has', items().length > 0);
  }
  function items() { var d = doc(); return (d && d.aud) || []; }

  /*@3.AUNJ.3*/
  function addItem(it) {
    var d = doc();
    if (!d) return false;
    if (!d.aud) d.aud = [];
    d.aud.push(it);
    touch();
    return true;
  }
  function dropItem(refId) {
    var d = doc();
    if (!d || !d.aud) return;
    d.aud = d.aud.filter(function (x) { return x.i !== refId; });
    touch();
  }

  var rec = null, timer = null, panel = null, busy = false, urls = {};

  function host() { return document.getElementById('na-doc-body'); }

  function close() {
    if (rec) return;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    var b = document.getElementById('na-mic');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /*@3.AUNJ.4*/
  function shell() {
    var h = host();
    if (!h) return null;
    if (panel && panel.parentNode === h) return panel;
    panel = document.createElement('div');
    panel.className = 'nfo nrec';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', L('تسجيلُ الصوت', 'Voice recording'));
    h.insertBefore(panel, h.firstChild);
    return panel;
  }

  function render() {
    var el = shell();
    if (!el) return;
    el.innerHTML =
      '<div class="nrec-head">' +
        '<i class="fa-solid fa-microphone nfo-i" aria-hidden="true"></i>' +
        '<div class="nfo-txt nrec-msg"></div>' +
        '<div class="nfo-acts nrec-acts"></div>' +
      '</div>' +
      '<div class="nrec-list"></div>';
    if (rec) drawLive(); else drawIdle();
    drawList();
  }

  function msg(html) {
    var m = panel && panel.querySelector('.nrec-msg');
    if (m) m.innerHTML = html;
  }
  function acts(html) {
    var a = panel && panel.querySelector('.nrec-acts');
    if (a) a.innerHTML = html;
    return a;
  }

  function shutBtn() {
    return '<button type="button" class="gsf-btn gsf-btn--ghost nfo-no" aria-label="' +
      esc(L('إغلاق', 'Dismiss')) + '">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
  }
  function bindShut() {
    var x = panel && panel.querySelector('.nfo-no');
    if (x) x.addEventListener('click', close);
  }

  /*@3.AUNJ.5*/
  function drawIdle() {
    var s = A() ? A().support() : { mic: false };
    if (!s.secure) {
      panel.className = 'nfo nrec nfo--bad';
      msg('<b>' + esc(L('التسجيلُ يحتاج اتّصالاً آمناً',
                        'Recording needs a secure connection')) + '</b>');
      acts(shutBtn());
      bindShut();
      return;
    }
    if (!s.mic || !s.recorder || !s.type) {
      panel.className = 'nfo nrec nfo--bad';
      msg('<b>' + esc(L('هذا المتصفّحُ لا يسجّل الصوت',
                        'This browser cannot record audio')) + '</b> ' +
          esc(L('· جرّبْ كروم أو فَيَرفُكس.', '· try Chrome or Firefox.')));
      acts(shutBtn());
      bindShut();
      return;
    }
    panel.className = 'nfo nrec';
    msg('<b>' + esc(L('سجّلِ المحاضرة', 'Record the lecture')) + '</b> ' +
        '<span class="nfo-dim">' +
        esc(L('· الصوتُ يُحفظ مع الملاحظةِ ويفتح على أجهزتك الأخرى.',
              '· the audio is saved with the note and opens on your other devices.')) +
        '</span>');
    var srcPick = s.system
      ? '<span class="nrec-src" role="group" aria-label="' +
        esc(L('مصدرُ الصوت', 'Audio source')) + '">' +
        '<button type="button" class="gsf-chip on" data-src="mic">' +
          esc(L('الميكروفون', 'Microphone')) + '</button>' +
        '<button type="button" class="gsf-chip" data-src="both">' +
          esc(L('الميكروفون وصوتُ الجهاز', 'Mic + device audio')) + '</button>' +
        '</span>'
      : '';
    acts(srcPick +
      '<button type="button" class="gsf-btn gsf-btn--go nrec-go">' +
      '<i class="fa-solid fa-circle-dot" aria-hidden="true"></i> ' +
      esc(L('ابدأ', 'Start')) + '</button>' + shutBtn());
    bindShut();
    var chips = panel.querySelectorAll('.nrec-src .gsf-chip');
    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener('click', function () {
        Array.prototype.forEach.call(chips, function (x) { x.classList.remove('on'); });
        c.classList.add('on');
      });
    });
    var go = panel.querySelector('.nrec-go');
    if (go) go.addEventListener('click', function () {
      var on = panel.querySelector('.nrec-src .gsf-chip.on');
      start(on ? on.getAttribute('data-src') : 'mic');
    });
  }

  /*@3.AUNJ.6*/
  function drawLive() {
    panel.className = 'nfo nrec nfo--busy nrec--live';
    var st = rec.stats();
    msg('<span class="nrec-dot" aria-hidden="true"></span>' +
        '<b class="nrec-clock">' + esc(clock(st.sec)) + '</b> ' +
        '<span class="nfo-dim nrec-meta">' + esc(size(st.bytes)) + '</span> ' +
        '<span class="nfo-dim">' +
        esc(L('· تابعْ كتابتَك ورسمَك، فالتسجيلُ يجري في الخلفيّة.',
              '· keep writing and drawing — recording continues in the background.')) +
        '</span>');
    acts('<button type="button" class="gsf-btn gsf-btn--go nrec-stop">' +
         '<i class="fa-solid fa-stop" aria-hidden="true"></i> ' +
         esc(L('أوقفْ واحفظْ', 'Stop &amp; save')) + '</button>' +
         '<button type="button" class="gsf-btn gsf-btn--ghost nrec-kill">' +
         esc(L('ألغِ', 'Discard')) + '</button>');
    panel.querySelector('.nrec-stop').addEventListener('click', function () { stop(true); });
    panel.querySelector('.nrec-kill').addEventListener('click', function () { stop(false); });
  }

  function beat() {
    if (!rec || !panel) return;
    var st = rec.stats();
    var c = panel.querySelector('.nrec-clock');
    var m = panel.querySelector('.nrec-meta');
    if (c) c.textContent = clock(st.sec);
    if (m) m.textContent = size(st.bytes);
    if (st.sec >= MAX_SEC) stop(true);
  }

  /*@3.AUNJ.7*/
  function start(source) {
    var R = A();
    if (!R || rec) return;
    panel.className = 'nfo nrec nfo--busy';
    msg('<b>' + esc(L('يُطلب إذنُ الميكروفون…', 'Asking for microphone permission…')) + '</b>');
    acts('');
    var r = new R.Recorder({ bps: DEFAULT_BPS, source: source || 'mic' });
    r.open().then(function () {
      rec = r;
      rec.start();
      render();
      timer = setInterval(beat, 500);
      var b = document.getElementById('na-mic');
      if (b) b.classList.add('na-icb--rec');
    })['catch'](function (e) {
      var why = String((e && e.message) || e || '');
      var noSys = /no_system_audio/.test(why);
      panel.className = 'nfo nrec nfo--bad';
      msg('<b>' + esc(
        noSys ? L('لم يُشارَك صوتُ الجهاز', 'The device audio was not shared')
              : (/NotAllowed|Permission/i.test(why)
                  ? L('الإذنُ مرفوض', 'Permission denied')
                  : L('تعذّر فتحُ الميكروفون', 'The microphone could not be opened'))) + '</b> ' +
        esc(noSys
          ? L('· اختَرْ «مشاركةُ صوتِ النظام» في نافذةِ المتصفّح، أو سجّلِ الميكروفونَ وحدَه.',
              '· tick "share system audio" in the browser dialog, or record the mic alone.')
          : L('· اسمحْ للموقع بالميكروفون من إعداداتِ المتصفّح ثمّ أعِدِ المحاولة.',
              '· allow the microphone for this site in your browser settings, then try again.')));
      acts('<button type="button" class="gsf-btn gsf-btn--go nrec-again">' +
           esc(L('أعِدِ المحاولة', 'Try again')) + '</button>' + shutBtn());
      bindShut();
      panel.querySelector('.nrec-again').addEventListener('click', render);
    });
  }

  /*@3.AUNJ.8*/
  function stop(keep) {
    if (!rec) return;
    var r = rec;
    rec = null;
    if (timer) { clearInterval(timer); timer = null; }
    var b = document.getElementById('na-mic');
    if (b) b.classList.remove('na-icb--rec');
    r.stop().then(function (out) {
      if (!keep || !out || !out.blob || out.blob.size < 1024) { render(); return; }
      upload(out);
    });
  }

  function nameFor(sec) {
    var d = doc();
    var base = (d && d.pdf && d.pdf.n) ? String(d.pdf.n).replace(/\.pdf$/i, '') : '';
    var t = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var when = t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) +
               '_' + p(t.getHours()) + p(t.getMinutes());
    return (base ? base + '_' : 'rec_') + when + '_' + Math.round(sec) + 's';
  }

  function ext(mime) {
    if (/ogg/.test(mime)) return '.ogg';
    if (/mp4/.test(mime)) return '.m4a';
    return '.webm';
  }

  /*@3.AUNJ.9*/
  function upload(out) {
    var refId = REF_PREFIX + Date.now().toString(36) + '_' +
                Math.random().toString(36).slice(2, 8);
    var it = { i: refId, n: nameFor(out.sec), t: Date.now(),
               ms: Math.round(out.sec * 1000), b: out.blob.size,
               m: (out.blob.type || 'audio/webm').split(';')[0], aup: 0 };
    var st = D();
    busy = true;
    panel.className = 'nfo nrec nfo--busy';
    msg('<b>' + esc(L('يُحفظ التسجيل…',
                      'Saving the recording…')) + '</b>');
    acts('');
    /*@3.AUNJ.15*/
    var keep = st
      ? st.put(refId, out.blob, { name: it.n })['catch'](function () { return false; })
      : Promise.resolve(false);
    keep.then(function (okLocal) {
      if (!okLocal && !F()) {
        /*@3.AUNJ.16*/
        busy = false;
        panel.className = 'nfo nrec nfo--bad';
        msg('<b>' + esc(L('ضاع التسجيل',
                          'The recording was lost')) + '</b> ' +
            esc(L('· لم يُحفظ على الجهازِ ولا سبيلَ للرفعِ الآن. ' +
                  'أفرِغْ مساحةً ثمَّ أعِدْ التسجيل.',
                  '· it was neither stored on this device nor uploadable. ' +
                  'Free some space and record again.')));
        acts(shutBtn());
        bindShut();
        return;
      }
      it.lo = okLocal ? 1 : 0;
      if (!addItem(it)) { busy = false; return; }
      send(it, out.blob);
    });
  }

  /*@3.AUNJ.17*/
  function send(it, blob) {
    var f = F();
    var refId = it.i;
    if (!f) { busy = false; render(); return; }
    busy = true;
    panel.className = 'nfo nrec nfo--busy';
    msg('<b>' + esc(L('يُرفع التسجيل…', 'Uploading the recording…')) + '</b> ' +
        '<span class="nfo-dim">' + esc(size(blob.size)) + '</span>');
    acts('<span class="nfo-track"><span class="nfo-fill nrec-fill"></span></span>');

    var on = function (e) {
      var d = e.detail || {};
      if (d.ref_id !== refId) return;
      var fill = panel && panel.querySelector('.nrec-fill');
      if (fill && d.of) fill.style.width = Math.round((d.at / d.of) * 100) + '%';
    };
    window.addEventListener('garden:fileProgress', on);

    f.upload(blob, { refId: refId, name: it.n + ext(it.m), mime: it.m })
      .then(function (r) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        it.aup = 1;
        it.b = r.bytes || it.b;
        /*@3.AUNJ.18*/
        var st = D();
        if (st && it.lo) { st.drop(refId)['catch'](function () {}); it.lo = 0; }
        touch(true);
        render();
      }, function (e) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        /*@3.AUNJ.10*/
        it.aup = 0;
        touch(true);
        render();
        panel.className = 'nfo nrec nfo--bad';
        msg('<b>' + esc(L('لم يُرفع التسجيل', 'The recording was not uploaded')) + '</b> ' +
            esc(it.lo
              ? L('· وهو محفوظٌ على هذا الجهازِ وحدَه. أعِدِ الرفعَ متى شئت.',
                  '· it is stored on this device only. Retry the upload whenever you like.')
              : L('· ولم يُحفظ على الجهازِ أيضاً — التسجيلُ ضاع.',
                  '· and it was not stored on this device either — the recording is lost.')) +
            (e && e.message ? ' <span class="nfo-dim">' + esc(e.message) + '</span>' : ''));
        acts(shutBtn());
        bindShut();
      });
  }

  /*@3.AUNJ.19*/
  function retry(refId) {
    var st = D();
    var it = items().filter(function (x) { return x.i === refId; })[0];
    if (!it) return;
    if (!st || !it.lo) { gone(); return; }
    st.get(refId).then(function (b) {
      if (!b || !b.size) { it.lo = 0; touch(true); gone(); return; }
      send(it, b);
    })['catch'](function () { it.lo = 0; touch(true); gone(); });
  }

  function gone() {
    render();
    panel.className = 'nfo nrec nfo--bad';
    msg('<b>' + esc(L('لا نسخةَ لهذا التسجيل',
                      'No copy of this recording')) + '</b> ' +
        esc(L('· مضت نسختُه من هذا الجهازِ ولم يصل الخادم. ' +
              'احذفِ القيدَ أو سجِّلْ من جديد.',
              '· the device copy is gone and it never reached the server. ' +
              'Delete the entry or record again.')));
    acts(shutBtn());
    bindShut();
  }

  /*@3.AUNJ.11*/
  function drawList() {
    var box = panel && panel.querySelector('.nrec-list');
    if (!box) return;
    var list = items();
    if (!list.length) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = list.slice().reverse().map(function (x) {
      return '<div class="nrec-row" data-ref="' + esc(x.i) + '">' +
        '<div class="nrec-row-h">' +
          '<i class="fa-solid ' + (x.aup ? 'fa-cloud' : 'fa-mobile-screen') +
            ' nrec-row-i" aria-hidden="true"></i>' +
          '<span class="nrec-row-t">' + esc(clock((x.ms || 0) / 1000)) + '</span>' +
          '<span class="nfo-dim">' + esc(size(x.b)) + ' · ' + esc(stamp(x.t)) + '</span>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost nrec-del" aria-label="' +
            esc(L('حذفُ التسجيل', 'Delete recording')) + '">' +
            '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="nrec-row-p">' +
          /*@3.AUNJ.20*/
          (x.aup || x.lo
            ? '<button type="button" class="gsf-btn nrec-play">' +
              '<i class="fa-solid fa-play" aria-hidden="true"></i> ' +
              esc(L('استمعْ', 'Play')) + '</button>'
            : '') +
          (x.aup ? '' :
            '<button type="button" class="gsf-btn gsf-btn--go nrec-retry">' +
            '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> ' +
            esc(L('ارفعْه', 'Upload')) + '</button>' +
            ' <span class="nfo-dim">' +
            esc(x.lo ? L('· على هذا الجهاز وحدَه.', '· on this device only.')
                     : L('· لا نسخةَ له.', '· no copy left.')) + '</span>') +
        '</div></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('.nrec-row'), function (row) {
      var ref = row.getAttribute('data-ref');
      var del = row.querySelector('.nrec-del');
      if (del) del.addEventListener('click', function () { remove(ref, row); });
      var play = row.querySelector('.nrec-play');
      if (play) play.addEventListener('click', function () { play_(ref, row); });
      var again = row.querySelector('.nrec-retry');
      if (again) again.addEventListener('click', function () { retry(ref); });
    });
  }

  /*@3.AUNJ.12*/
  function play_(refId, row) {
    var slot = row.querySelector('.nrec-row-p');
    if (!slot) return;
    if (urls[refId]) { mountAudio(slot, urls[refId]); return; }
    slot.innerHTML = '<span class="nfo-dim">' + esc(L('يُجهَّز…', 'Preparing…')) + '</span>';
    var it = items().filter(function (x) { return x.i === refId; })[0];
    var st = D();
    /*@3.AUNJ.21*/
    if (it && !it.aup && it.lo && st) {
      st.get(refId).then(function (b) {
        if (!b || !b.size) throw new Error('gone');
        urls[refId] = URL.createObjectURL(b);
        mountAudio(slot, urls[refId]);
      })['catch'](function () {
        slot.innerHTML = '<span class="nfo-dim">' +
          esc(L('مضت نسختُه من هذا الجهاز.', 'The device copy is gone.')) + '</span>';
      });
      return;
    }
    var f = F();
    if (!f) { slot.innerHTML = ''; return; }
    f.link(refId).then(function (l) {
      urls[refId] = l.url;
      mountAudio(slot, l.url);
    })['catch'](function () {
      slot.innerHTML = '<span class="nfo-dim">' +
        esc(L('تعذّر جلبُ التسجيل.', 'The recording could not be fetched.')) + '</span>';
    });
  }
  function mountAudio(slot, url) {
    slot.innerHTML = '';
    var a = document.createElement('audio');
    a.controls = true;
    a.preload = 'metadata';
    a.className = 'nrec-audio';
    a.src = url;
    slot.appendChild(a);
    try { a.play(); } catch (e) {}
  }

  function remove(refId, row) {
    var f = F();
    var it = items().filter(function (x) { return x.i === refId; })[0];
    dropItem(refId);
    if (urls[refId]) { try { URL.revokeObjectURL(urls[refId]); } catch (e0) {} }
    delete urls[refId];
    if (row && row.parentNode) row.parentNode.removeChild(row);
    if (f && it && it.aup) { try { f.remove(refId); } catch (e) {} }
    /*@3.AUNJ.22*/
    var st = D();
    if (st && it && it.lo) st.drop(refId)['catch'](function () {});
    if (!items().length) drawList();
  }

  /*@3.AUNJ.13*/
  function toggle() {
    if (panel && panel.parentNode) {
      if (rec || busy) return;
      close();
      return;
    }
    render();
    var b = document.getElementById('na-mic');
    if (b) b.setAttribute('aria-expanded', 'true');
  }

  function wire() {
    var b = document.getElementById('na-mic');
    if (!b || b.getAttribute('data-wired')) return;
    b.setAttribute('data-wired', '1');
    b.addEventListener('click', toggle);
  }

  /*@3.AUNJ.14*/
  function sync() {
    badge();
    if (panel && panel.parentNode && !rec && !busy) render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }

  window.GardenAudioNote = {
    toggle: toggle,
    close: close,
    sync: sync,
    recording: function () { return !!rec; }
  };
})();
