/*@3.AUNJ.1*/
;(function () {
  'use strict';

  /*@3.AUNJ.2*/
  /*@3.AUNJ.23*/
  /*@3.AUNJ.27*/
  var BPS = { mic: 12000, system: 32000, both: 32000 };
  function bpsFor(src) { return BPS[src] || BPS.mic; }
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
  var cap = null, drawer = null, escOn = null, settleOn = null;

  function host() { return document.getElementById('na-doc-body'); }
  function micBtn() { return document.getElementById('na-mic'); }

  /*@3.AUNJ.42*/
  function anchorRect() {
    var h = host();
    return h ? h.getBoundingClientRect() : null;
  }

  function place(el, r, side) {
    if (!el || !r) return;
    var rtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
    var pad = 12;
    if (side === 'cap') {
      /*@3.AUNJ.50*/
      var wide = window.innerWidth > 640;
      var off = pad + ((wide && drawer && drawer.offsetWidth) || 0);
      el.style.top = (r.top + pad) + 'px';
      if (rtl) { el.style.right = (window.innerWidth - r.right + off) + 'px'; el.style.left = 'auto'; }
      else     { el.style.left = (r.left + off) + 'px'; el.style.right = 'auto'; }
      return;
    }
    if (side === 'drawer') {
      el.style.top = r.top + 'px';
      el.style.height = r.height + 'px';
      /*@3.AUNJ.51*/
      if (rtl) { el.style.right = (window.innerWidth - r.right) + 'px'; el.style.left = 'auto'; }
      else     { el.style.left = r.left + 'px'; el.style.right = 'auto'; }
      return;
    }
    /*@3.AUNJ.49*/
    var b = micBtn();
    var br = b ? b.getBoundingClientRect() : r;
    var w = el.offsetWidth || 256;
    var room = Math.max(8, window.innerWidth - w - 8);
    /*@3.AUNJ.57*/
    if (!br.width && !br.height) return;
    el.style.top = Math.max(8, br.bottom + 8) + 'px';
    if (rtl) {
      el.style.right = Math.min(room, Math.max(8, window.innerWidth - br.right)) + 'px';
      el.style.left = 'auto';
    } else {
      el.style.left = Math.min(room, Math.max(8, br.left)) + 'px';
      el.style.right = 'auto';
    }
  }

  function reflow() {
    var r = anchorRect();
    if (!r) return;
    if (cap) place(cap, r, 'cap');
    if (drawer) place(drawer, r, 'drawer');
    if (panel) place(panel, r, 'pop');
  }
  window.addEventListener('resize', reflow);

  function close() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    var b = micBtn();
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /*@3.AUNJ.4*/
  function shell() {
    var r = anchorRect();
    if (!r) return null;
    if (panel && panel.parentNode) return panel;
    panel = document.createElement('div');
    panel.className = 'nrp';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', L('تسجيلُ الصوت', 'Voice recording'));
    panel.innerHTML =
      '<div class="nrp-b"></div><div class="nrp-f"></div>';
    document.body.appendChild(panel);
    place(panel, r, 'pop');
    /*@3.AUNJ.56*/
    [0, 120, 300, 600, 1000].forEach(function (ms) {
      setTimeout(function () { if (panel) place(panel, anchorRect(), 'pop'); }, ms);
    });
    if (!settleOn) {
      settleOn = function () { if (panel) place(panel, anchorRect(), 'pop'); };
      document.addEventListener('transitionend', settleOn, true);
    }
    var b = micBtn();
    if (b) b.setAttribute('aria-expanded', 'true');
    return panel;
  }

  /*@3.AUNJ.43*/
  var awayOn = null;
  function away() {
    if (awayOn) return;
    awayOn = function (e) {
      if (!panel) return;
      if (panel.contains(e.target)) return;
      var b = micBtn();
      if (b && b.contains(e.target)) return;
      if (busy || rec) return;
      close();
    };
    document.addEventListener('pointerdown', awayOn, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel && !busy && !rec) close();
    });
  }

  function render() {
    if (rec) { drawLive(); drawList(); return; }
    var el = shell();
    if (!el) return;
    away();
    drawIdle();
    drawList();
  }

  /*@3.AUNJ.45*/
  function mode(cls) {
    if (!panel) { shell(); away(); }
    if (!panel) return;
    panel.className = 'nrp' + (cls ? ' ' + cls : '');
    /*@3.AUNJ.53*/
    place(panel, anchorRect(), 'pop');
  }

  /*@3.AUNJ.54*/
  function settled(refId) {
    close();
    openDrawer();
    var row = drawer && drawer.querySelector('.nrr[data-ref="' + refId + '"]');
    if (row) row.classList.add('on');
  }

  function msg(html) {
    var m = panel && panel.querySelector('.nrp-b');
    if (m) m.innerHTML = html;
  }
  function acts(html) {
    var a = panel && panel.querySelector('.nrp-f');
    if (a) a.innerHTML = html;
    return a;
  }

  function shutBtn() {
    return '<button type="button" class="gsf-btn gsf-btn--ghost nfo-no">' +
      esc(L('حسناً', 'OK')) + '</button>';
  }
  function bindShut() {
    var x = panel && panel.querySelector('.nfo-no');
    if (x) x.addEventListener('click', close);
  }

  /*@3.AUNJ.5*/
  function drawIdle() {
    var s = A() ? A().support() : { mic: false };
    if (!s.secure) {
      panel.className = 'nrp nrp--bad';
      msg('<b class="nrp-t">' + esc(L('التسجيلُ يحتاج اتّصالاً آمناً',
                        'Recording needs a secure connection')) + '</b>');
      acts(shutBtn());
      bindShut();
      return;
    }
    if (!s.mic || !s.recorder || !s.type) {
      panel.className = 'nrp nrp--bad';
      msg('<b class="nrp-t">' + esc(L('هذا المتصفّحُ لا يسجّل الصوت',
                        'This browser cannot record audio')) + '</b>' +
          '<span class="nrp-s">' +
          esc(L('جرّبْ كروم أو فَيَرفُكس.', 'Try Chrome or Firefox.')) + '</span>');
      acts(shutBtn());
      bindShut();
      return;
    }
    panel.className = 'nrp';
    /*@3.AUNJ.24*/
    var srcPick = s.system
      ? '<div class="nrp-seg" role="group" aria-label="' +
        esc(L('مصدرُ الصوت', 'Audio source')) + '">' +
        '<button type="button" class="on" data-src="mic">' +
          '<i class="fa-solid fa-microphone" aria-hidden="true"></i>' +
          esc(L('الميكروفون', 'Microphone')) + '</button>' +
        '<button type="button" data-src="system">' +
          '<i class="fa-solid fa-display" aria-hidden="true"></i>' +
          esc(L('صوتُ الجهاز', 'Device audio')) + '</button>' +
        '<button type="button" data-src="both">' +
          '<i class="fa-solid fa-sliders" aria-hidden="true"></i>' +
          esc(L('كلاهما', 'Both')) + '</button>' +
        '</div>'
      : '';
    msg('<b class="nrp-t">' + esc(L('سجّلِ المحاضرة', 'Record the lecture')) + '</b>' +
        '<span class="nrp-s">' +
        esc(L('يُحفظ مع الملاحظةِ حتى نهايةِ الفصل.',
              'Kept with the note until the term ends.')) + '</span>' +
        srcPick +
        '<span class="nrp-hint"></span>');
    acts('<button type="button" class="gsf-btn gsf-btn--go nrec-go nrp-go">' +
         '<i class="fa-solid fa-circle-dot" aria-hidden="true"></i> ' +
         esc(L('ابدأِ التسجيل', 'Start recording')) + '</button>' + listLink() +
         '<button type="button" class="gsf-btn gsf-btn--ghost nrp-file">' +
         '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
         esc(L('من جهازك', 'From your device')) + '</button>');
    bindList();
    var fb = panel.querySelector('.nrp-file');
    if (fb) fb.addEventListener('click', pickExternal);
    var chips = panel.querySelectorAll('.nrp-seg button');
    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener('click', function () {
        Array.prototype.forEach.call(chips, function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        srcHint(c.getAttribute('data-src'));
      });
    });

    /*@3.AUNJ.25*/
    function srcHint(src) {
      var e = panel.querySelector('.nrp-hint');
      if (!e) return;
      if (src !== 'system' && src !== 'both') { e.innerHTML = ''; return; }
      e.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>' +
        esc(L('ستفتح نافذةُ مشاركةِ الشاشة. اخترْ «الشاشةُ بأكملها» ثمّ فعّلْ ' +
              '«مشاركةُ صوتِ النظام» قبل الموافقة.',
              'A screen-sharing dialog opens. Pick "Entire screen", then tick ' +
              '"Share system audio" before you confirm.')) +
        (s.systemLikely ? '' : ' <b>' +
          esc(L('ومتصفّحُك لا يشاركه حتى اليوم — استعملْ كروم أو إيدج.',
                'Your browser cannot share it yet — use Chrome or Edge.')) +
          '</b>') + '</span>';
    }
    var go = panel.querySelector('.nrp-go');
    if (go) go.addEventListener('click', function () {
      var on = panel.querySelector('.nrp-seg button.on');
      start(on ? on.getAttribute('data-src') : 'mic');
    });
  }

  function listLink() {
    var n = items().length;
    if (!n) return '';
    return '<button type="button" class="gsf-btn gsf-btn--ghost nrp-list">' +
      esc(L('التسجيلات', 'Recordings')) + ' <b>' + n + '</b></button>';
  }
  function bindList() {
    var b = panel && panel.querySelector('.nrp-list');
    if (b) b.addEventListener('click', function () { openDrawer(); close(); });
  }

  /*@3.AUNJ.6*/
  /*@3.AUNJ.28*/
  /*@3.AUNJ.44*/
  function drawLive() {
    close();
    var r = anchorRect();
    if (!r) return;
    if (!cap) {
      cap = document.createElement('div');
      cap.className = 'nrc';
      cap.setAttribute('role', 'status');
      cap.setAttribute('aria-label', L('يجري التسجيل', 'Recording'));
      document.body.appendChild(cap);
    }
    place(cap, r, 'cap');
    var st = rec.stats();
    var i, bars = '';
    for (i = 0; i < 14; i++) bars += '<i style="--h:.10"></i>';
    cap.innerHTML =
      '<span class="nrc-dot" aria-hidden="true"></span>' +
      '<b class="nrec-clock">' + esc(clock(st.sec)) + '</b>' +
      '<span class="nrec-wave" role="img" aria-label="' +
        esc(L('مستوى الصوت', 'Audio level')) + '"' +
        ' data-ar-title="مستوى الصوت" data-en-title="Audio level">' + bars + '</span>' +
      '<span class="nrc-more">' +
        '<span class="nrc-sep"></span>' +
        '<span class="nrec-say">' + esc(srcName()) + '</span>' +
        '<span class="nfo-dim nrec-meta">' + esc(size(st.bytes)) + '</span>' +
        '<span class="nrc-sep"></span>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost nrec-kill">' +
          esc(L('ألغِ', 'Discard')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go nrec-stop">' +
          esc(L('أوقفْ واحفظ', 'Stop & save')) + '</button>' +
      '</span>';
    cap.querySelector('.nrec-stop').addEventListener('click', function () { stop(true); });
    cap.querySelector('.nrec-kill').addEventListener('click', function () { stop(false); });
  }

  function srcName() {
    var s = rec && rec.source;
    if (s === 'system') return L('صوتُ الجهاز', 'Device audio');
    if (s === 'both') return L('كلاهما', 'Both');
    return L('الميكروفون', 'Microphone');
  }

  function capGone() {
    if (cap && cap.parentNode) cap.parentNode.removeChild(cap);
    cap = null;
  }

  function beat() {
    if (!rec || !cap) return;
    var st = rec.stats();
    var c = cap.querySelector('.nrec-clock');
    var m = cap.querySelector('.nrec-meta');
    if (c) c.textContent = clock(st.sec);
    if (m) m.textContent = size(st.bytes);
    wave();
    if (st.sec >= MAX_SEC) stop(true);
  }

  /*@3.AUNJ.32*/
  var hush = 0;
  function wave() {
    var w = cap && cap.querySelector('.nrec-wave');
    if (!w || !rec || !rec.level) return;
    var lv = rec.level();
    if (!lv || lv === -1) { w.setAttribute('data-off', '1'); return; }
    /*@3.AUNJ.30*/
    var db = 20 * Math.log10(Math.max(lv.rms, 1e-5));
    var v = Math.max(0, Math.min(1, (db + 55) / 50));
    var bars = w.children, i;
    for (i = bars.length - 1; i > 0; i--) {
      bars[i].style.setProperty('--h',
        bars[i - 1].style.getPropertyValue('--h') || '.10');
    }
    if (bars[0]) bars[0].style.setProperty('--h', (0.10 + v * 0.90).toFixed(3));
    /*@3.AUNJ.31*/
    hush = lv.peak < 0.008 ? hush + 1 : 0;
    var quiet = hush > 24;
    w.setAttribute('data-hush', quiet ? '1' : '0');
    cap.setAttribute('data-hush', quiet ? '1' : '0');
    var say = cap.querySelector('.nrec-say');
    if (!say) return;
    if (quiet) {
      say.textContent = L('لا أسمع شيئاً', 'No sound');
      say.setAttribute('data-warn', '1');
    } else if (say.getAttribute('data-warn')) {
      say.textContent = srcName();
      say.removeAttribute('data-warn');
    }
  }


  /*@3.AUNJ.39*/
  var MARK_MAX = 4000;
  var marks = null;
  var markOn = null;

  function markStart(t0) {
    marks = [];
    markOn = function (e) {
      var d = (e && e.detail) || {};
      if (!marks || !d.t) return;
      var at = Math.round((d.t - t0) / 1000);
      if (at < 0) at = 0;
      if (marks.length >= MARK_MAX) marks.splice(MARK_MAX / 2, 1);
      marks.push([at, d.page | 0, d.x | 0, d.y | 0]);
    };
    window.addEventListener('garden:inkMark', markOn);
  }

  function markStop() {
    if (markOn) window.removeEventListener('garden:inkMark', markOn);
    markOn = null;
    var out = marks;
    marks = null;
    return (out && out.length) ? out : null;
  }

  /*@3.AUNJ.7*/
  function start(source) {
    var R = A();
    if (!R || rec) return;
    mode('nrp--busy');
    msg('<b>' + esc(L('يُطلب إذنُ الميكروفون…', 'Asking for microphone permission…')) + '</b>');
    acts('');
    /*@3.AUNJ.29*/
    var r = new R.Recorder({ bps: bpsFor(source), source: source || 'mic' });
    r.open().then(function () {
      rec = r;
      hush = 0;
      rec.start();
      markStart(rec.t0 || Date.now());
      render();
      timer = setInterval(beat, 500);
      var b = micBtn();
      if (b) b.classList.add('na-icb--rec');
    })['catch'](function (e) {
      var why = String((e && e.message) || e || '');
      /*@3.AUNJ.26*/
      var noSys = /no_system_audio/.test(why);
      var cant = /system_audio_unsupported|no_display_media/.test(why);
      var head, body;
      if (cant) {
        head = L('متصفّحُك لا يشارك صوتَ النظام',
                 'Your browser cannot share system audio');
        body = L('· هذا حدُّ المتصفّحِ لا حدُّنا. استعملْ كروم أو إيدج لتسجيلِ ' +
                 'صوتِ الجهاز، أو سجّلِ الميكروفونَ هنا.',
                 '· this is a browser limitation, not ours. Use Chrome or Edge for ' +
                 'device audio, or record the microphone here.');
      } else if (noSys) {
        head = L('شاركتَ الشاشةَ بلا صوت', 'You shared the screen without audio');
        body = L('· أعِدِ المحاولةَ وفعّلْ مربّعَ «مشاركةُ صوتِ النظام» في نافذةِ ' +
                 'المتصفّحِ قبل الموافقة.',
                 '· try again and tick "Share system audio" in the browser dialog ' +
                 'before confirming.');
      } else if (/NotAllowed|Permission/i.test(why)) {
        head = L('الإذنُ مرفوض', 'Permission denied');
        body = L('· اسمحْ للموقع بالميكروفون من إعداداتِ المتصفّح ثمّ أعِدِ المحاولة.',
                 '· allow the microphone for this site in your browser settings, ' +
                 'then try again.');
      } else {
        head = L('تعذّر فتحُ الميكروفون', 'The microphone could not be opened');
        body = L('· تأكّدْ من وجودِ ميكروفونٍ موصول، أو سجّلْ صوتَ الجهازِ وحدَه.',
                 '· check that a microphone is connected, or record device audio alone.');
      }
      mode('nrp--bad');
      msg('<b>' + esc(head) + '</b> ' + esc(body));
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
    var b = micBtn();
    if (b) b.classList.remove('na-icb--rec');
    capGone();
    r.stop().then(function (out) {
      if (!keep || !out || !out.blob || out.blob.size < 1024) {
        /*@3.AUNJ.40*/
        markStop();
        render(); return;
      }
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

  function ext(mime, it) {
    if (it && it.x) return '.' + it.x;
    if (/ogg/.test(mime)) return '.ogg';
    if (/mp4/.test(mime)) return '.m4a';
    return '.webm';
  }

  /*@3.AUNJ.55*/
  var EXT_MIME = { m4a: 'audio/x-m4a', mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac',
                   amr: 'audio/amr', '3gp': 'audio/3gpp', ogg: 'audio/ogg', opus: 'audio/opus',
                   oga: 'audio/ogg', webm: 'audio/webm', mp4: 'video/mp4', flac: 'audio/flac',
                   mkv: 'video/webm', mov: 'video/mp4' };
  var EXT_MAX = 250 * 1024 * 1024;

  function pickExternal() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'audio/*,video/*,.m4a,.mp3,.wav,.aac,.amr,.3gp,.ogg,.opus,.webm,.mp4,.flac';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      if (f) fromFile(f);
    });
    inp.click();
  }

  function extOf(name) {
    var m = /\.([a-z0-9]{2,4})$/i.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }

  function durationOf(blob) {
    return new Promise(function (ok) {
      var a = document.createElement('audio');
      var url = URL.createObjectURL(blob);
      var done = false;
      var fin = function (ms) {
        if (done) return;
        done = true;
        try { URL.revokeObjectURL(url); } catch (e) {}
        ok(ms);
      };
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () {
        fin(isFinite(a.duration) ? Math.round(a.duration * 1000) : 0);
      });
      a.addEventListener('error', function () { fin(0); });
      setTimeout(function () { fin(0); }, 4000);
      a.src = url;
    });
  }

  function fromFile(file) {
    if (!doc()) return;
    var x = extOf(file.name);
    var mime = (file.type || '').split(';')[0] || EXT_MIME[x] || '';
    if (!mime || !(/^audio\//.test(mime) || /^video\//.test(mime))) {
      mode('nrp--bad');
      msg('<b>' + esc(L('هذه ليست صيغةَ صوتٍ نعرفها', 'This is not an audio format we know')) +
          '</b> ' + esc(L('· جرّبْ m4a أو mp3 أو wav أو تسجيلَ شاشة.',
                          '· try m4a, mp3, wav, or a screen recording.')));
      acts(shutBtn()); bindShut();
      return;
    }
    if (file.size > EXT_MAX) {
      mode('nrp--bad');
      msg('<b>' + esc(L('الملفُّ أكبرُ من الحدّ', 'The file is over the limit')) + '</b> ' +
          esc(L('· ' + size(file.size) + ' والحدُّ ' + size(EXT_MAX) + '.',
                '· ' + size(file.size) + '; the limit is ' + size(EXT_MAX) + '.')));
      acts(shutBtn()); bindShut();
      return;
    }
    var refId = REF_PREFIX + Date.now().toString(36) + '_' +
                Math.random().toString(36).slice(2, 8);
    var base = String(file.name || '').replace(/\.[a-z0-9]{2,4}$/i, '') || L('تسجيل', 'Recording');
    busy = true;
    mode('nrp--busy');
    msg('<b>' + esc(L('يُقرأ التسجيل…', 'Reading the recording…')) + '</b>');
    acts('');
    durationOf(file).then(function (ms) {
      var it = { i: refId, n: base, t: Date.now(), s0: 0, mk: null, x: x,
                 ms: ms, b: file.size, m: mime, aup: 0, ext: 1 };
      keep(it, file);
    });
  }

  /*@3.AUNJ.9*/
  function upload(out) {
    var refId = REF_PREFIX + Date.now().toString(36) + '_' +
                Math.random().toString(36).slice(2, 8);
    /*@3.AUNJ.34*/
    /*@3.AUNJ.41*/
    var mk = markStop();
    var it = { i: refId, n: nameFor(out.sec), t: Date.now(),
               s0: Math.round(Date.now() - out.sec * 1000),
               mk: mk,
               ms: Math.round(out.sec * 1000), b: out.blob.size,
               m: (out.blob.type || 'audio/webm').split(';')[0], aup: 0 };
    keep(it, out.blob);
  }

  function keep(it, blob) {
    var refId = it.i;
    var st = D();
    busy = true;
    mode('nrp--busy');
    msg('<b>' + esc(L('يُحفظ التسجيل…',
                      'Saving the recording…')) + '</b>');
    acts('');
    /*@3.AUNJ.15*/
    var held = st
      ? st.put(refId, blob, { name: it.n })['catch'](function () { return false; })
      : Promise.resolve(false);
    held.then(function (okLocal) {
      if (!okLocal && !F()) {
        /*@3.AUNJ.16*/
        busy = false;
        mode('nrp--bad');
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
      /*@3.AUNJ.37*/
      if (asked() || !F()) { send(it, blob); return; }
      consent(it, blob);
    });
  }

  /*@3.AUNJ.38*/
  var ASK_LS = '__audioVow';

  function asked() {
    try { return localStorage.getItem(ASK_LS) === '1'; } catch (e) { return false; }
  }
  function markAsked() {
    try { localStorage.setItem(ASK_LS, '1'); } catch (e) {}
  }

  function consent(it, blob) {
    busy = false;
    mode('nrp--vow');
    msg('<b>' + esc(L('حُفظ التسجيلُ على هذا الجهاز',
                      'The recording is saved on this device')) + '</b> ' +
        '<span class="nfo-dim">' + esc(size(blob.size)) + '</span>' +
        '<span class="nfo-vow">' +
        esc(L('أتريد حفظَ نسخةٍ عندنا ليفتح على أجهزتك الأخرى؟',
              'Would you like a copy kept with us so it opens on your other devices?')) +
        '<br><b>' +
        esc(L('إن حفظتَه عندنا: نحتفظ به طوالَ هذا الفصلِ الدراسيّ، ثمّ يُحذف مع ' +
              'بدايةِ الفصلِ الجديد — وننبّهك قبل الحذفِ بثلاثةِ أيّامٍ لتصدّر ' +
              'بياناتِك كاملة.',
              'If you keep it with us: we hold it for this whole term, then it is ' +
              'removed when the new term starts — and we warn you three days before ' +
              'so you can export everything.')) + '</b> ' +
        esc(L('وإن اخترتَ هذا الجهازَ وحدَه، يبقى التسجيلُ عندك ولا يخرج منه، ' +
              'ويمكنك رفعُه لاحقاً متى شئت.',
              'If you choose this device only, the recording stays with you and ' +
              'never leaves it — and you can upload it later whenever you like.')) +
        '</span>');
    acts('<button type="button" class="gsf-btn gsf-btn--go nrec-vow-up">' +
         '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> ' +
         esc(L('احفظْ نسخةً عندنا', 'Keep a copy with us')) + '</button>' +
         '<button type="button" class="gsf-btn gsf-btn--ghost nrec-vow-no">' +
         esc(L('هذا الجهازُ وحدَه', 'This device only')) + '</button>');
    panel.querySelector('.nrec-vow-up').addEventListener('click', function () {
      markAsked();
      send(it, blob);
    });
    panel.querySelector('.nrec-vow-no').addEventListener('click', function () {
      markAsked();
      it.aup = 0;
      touch(true);
      settled(it.i);
    });
  }

  /*@3.AUNJ.17*/
  function send(it, blob) {
    var f = F();
    var refId = it.i;
    if (!f) { busy = false; render(); return; }
    busy = true;
    mode('nrp--busy');
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

    f.upload(blob, { refId: refId, name: it.n + ext(it.m, it), mime: it.m })
      .then(function (r) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        it.aup = 1;
        it.b = r.bytes || it.b;
        /*@3.AUNJ.18*/
        var st = D();
        if (st && it.lo) { st.drop(refId)['catch'](function () {}); it.lo = 0; }
        touch(true);
        settled(refId);
      }, function (e) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        /*@3.AUNJ.10*/
        it.aup = 0;
        touch(true);
        render();
        mode('nrp--bad');
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
    mode('nrp--bad');
    msg('<b>' + esc(L('لا نسخةَ لهذا التسجيل',
                      'No copy of this recording')) + '</b> ' +
        esc(L('· مضت نسختُه من هذا الجهازِ ولم يصل الخادم. ' +
              'احذفِ القيدَ أو سجِّلْ من جديد.',
              '· the device copy is gone and it never reached the server. ' +
              'Delete the entry or record again.')));
    acts(shutBtn());
    bindShut();
  }

  /*@3.AUNJ.48*/
  function shortName(n) {
    var v = String(n || '').replace(/_\d{4}-\d{2}-\d{2}_\d{4}_\d+s$/, '');
    return v || L('تسجيل', 'Recording');
  }

  /*@3.AUNJ.46*/
  function openDrawer() {
    var r = anchorRect();
    if (!r) return;
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'nrd';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-label', L('تسجيلاتُ الملاحظة', 'Note recordings'));
      drawer.innerHTML =
        '<div class="nrd-h">' +
          '<b>' + esc(L('تسجيلاتُ هذه الملاحظة', 'Recordings in this note')) + '</b>' +
          '<span class="nrd-n"></span>' +
          '<button type="button" class="nrd-x" aria-label="' +
            esc(L('إغلاق', 'Close')) + '"' +
            ' data-ar-title="إغلاق" data-en-title="Close">' +
            '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div><div class="nrd-b nrec-list"></div>';
      document.body.appendChild(drawer);
      drawer.querySelector('.nrd-x').addEventListener('click', shutDrawer);
      if (!escOn) {
        escOn = function (e) { if (e.key === 'Escape' && drawer) shutDrawer(); };
        document.addEventListener('keydown', escOn);
      }
    }
    place(drawer, r, 'drawer');
    drawList();
    reflow();
  }

  function shutDrawer() {
    if (drawer && drawer.parentNode) drawer.parentNode.removeChild(drawer);
    drawer = null;
    reflow();
  }

  /*@3.AUNJ.11*/
  function drawList() {
    var box = drawer && drawer.querySelector('.nrd-b');
    var n = drawer && drawer.querySelector('.nrd-n');
    if (!box) return;
    var list = items();
    if (n) n.textContent = String(list.length);
    if (!list.length) {
      box.innerHTML = '<p class="nrd-e">' +
        esc(L('لا تسجيلَ بعد. ابدأْ من زرِّ الميكروفون.',
              'No recordings yet — start from the microphone button.')) + '</p>';
      return;
    }
    box.innerHTML = list.slice().reverse().map(function (x) {
      /*@3.AUNJ.20*/
      var can = x.aup || x.lo;
      return '<div class="nrr" data-ref="' + esc(x.i) + '">' +
        (can
          ? '<button type="button" class="nrr-p nrec-play" aria-label="' +
            esc(L('استمعْ', 'Play')) + '"' +
            ' data-ar-title="استمعْ" data-en-title="Play">' +
            '<i class="fa-solid fa-play" aria-hidden="true"></i></button>'
          : '<span class="nrr-p nrr-p--no" aria-hidden="true">' +
            '<i class="fa-solid fa-link-slash"></i></span>') +
        '<span class="nrr-d">' + esc(clock((x.ms || 0) / 1000)) + '</span>' +
        '<span class="nrr-n" title="' + esc(x.n || '') + '">' +
          esc(shortName(x.n)) + '</span>' +
        '<button type="button" class="nrr-x nrec-del" aria-label="' +
          esc(L('حذفُ التسجيل', 'Delete recording')) + '"' +
          ' data-ar-title="حذفُ التسجيل" data-en-title="Delete recording">' +
          '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '<span class="nrr-m">' +
          '<i class="fa-solid ' + (x.aup ? 'fa-cloud' : 'fa-mobile-screen') +
            '" aria-hidden="true"></i> ' +
          esc(size(x.b)) + ' · ' + esc(stamp(x.t)) + '</span>' +
        '<div class="nrr-s nrec-row-p">' +
          (x.aup ? '' :
            '<button type="button" class="gsf-btn gsf-btn--go gsf-btn--sm nrec-retry">' +
            '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> ' +
            esc(L('ارفعْه', 'Upload')) + '</button>' +
            '<span class="nfo-dim">' +
            esc(x.lo ? L('على هذا الجهاز وحدَه.', 'On this device only.')
                     : L('لا نسخةَ له.', 'No copy left.')) + '</span>') +
        '</div></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('.nrr'), function (row) {
      var ref = row.getAttribute('data-ref');
      var del = row.querySelector('.nrec-del');
      if (del) del.addEventListener('click', function (e) {
        e.stopPropagation(); remove(ref, row);
      });
      var play = row.querySelector('.nrec-play');
      if (play) play.addEventListener('click', function (e) {
        e.stopPropagation();
        Array.prototype.forEach.call(box.querySelectorAll('.nrr'), function (o) {
          if (o !== row) o.classList.remove('on');
        });
        row.classList.add('on');
        play_(ref, row);
      });
      var again = row.querySelector('.nrec-retry');
      if (again) again.addEventListener('click', function (e) {
        e.stopPropagation(); retry(ref);
      });
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
  /*@3.AUNJ.33*/
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  var SPEED_LS = '__audioRate';

  function rateGet() {
    var v = parseFloat(localStorage.getItem(SPEED_LS) || '1');
    return (v > 0.2 && v <= 4) ? v : 1;
  }
  function rateSet(v) {
    try { localStorage.setItem(SPEED_LS, String(v)); } catch (e) {}
  }
  function rateTxt(v) {
    return (Math.round(v * 100) / 100).toString().replace(/\.00?$/, '') + '\u00d7';
  }

  function mountAudio(slot, url) {
    slot.innerHTML =
      '<div class="nrec-pl">' +
        '<button type="button" class="nrec-pl-b nrec-pl-go" aria-label="' +
          esc(L('تشغيل', 'Play')) + '"' +
          ' data-ar-title="تشغيل" data-en-title="Play">' +
          '<i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
        '<input type="range" class="nrec-pl-seek" value="0" min="0" max="1000"' +
          ' step="1" aria-label="' + esc(L('موضعُ التشغيل', 'Playback position')) + '"' +
          ' data-ar-title="موضعُ التشغيل" data-en-title="Playback position">' +
        '<span class="nrec-pl-t">0:00 / 0:00</span>' +
        '<button type="button" class="nrec-pl-x" aria-label="' +
          esc(L('سرعةُ التشغيل', 'Playback speed')) + '"' +
          ' data-ar-title="سرعةُ التشغيل" data-en-title="Playback speed">' +
          esc(rateTxt(rateGet())) + '</button>' +
      '</div>';
    var a = new Audio();
    a.preload = 'metadata';
    a.src = url;
    /*@3.AUNJ.35*/
    a.preservesPitch = true;
    a.mozPreservesPitch = true;
    a.webkitPreservesPitch = true;
    a.playbackRate = rateGet();

    var pl = slot.querySelector('.nrec-pl');
    var go = pl.querySelector('.nrec-pl-go');
    var seek = pl.querySelector('.nrec-pl-seek');
    var lbl = pl.querySelector('.nrec-pl-t');
    var xb = pl.querySelector('.nrec-pl-x');
    var held = false;

    function icon() {
      go.innerHTML = '<i class="fa-solid fa-' + (a.paused ? 'play' : 'pause') +
                     '" aria-hidden="true"></i>';
    }
    function time() {
      var d = isFinite(a.duration) ? a.duration : 0;
      lbl.textContent = clock(a.currentTime) + ' / ' + clock(d);
      if (!held && d) seek.value = String(Math.round(a.currentTime / d * 1000));
    }
    go.addEventListener('click', function () {
      if (a.paused) { a.play()['catch'](function () {}); } else { a.pause(); }
    });
    a.addEventListener('play', icon);
    a.addEventListener('pause', icon);
    a.addEventListener('timeupdate', time);
    a.addEventListener('loadedmetadata', time);
    a.addEventListener('ended', icon);
    seek.addEventListener('input', function () { held = true; });
    seek.addEventListener('change', function () {
      held = false;
      var d = isFinite(a.duration) ? a.duration : 0;
      if (d) a.currentTime = d * (Number(seek.value) / 1000);
    });
    xb.addEventListener('click', function (ev) {
      /*@3.AUNJ.36*/
      if (ev.altKey) {
        var v = parseFloat(window.prompt(L('سرعةٌ خاصّة (0.5 إلى 4):',
                                           'Custom speed (0.5 to 4):'),
                                         String(a.playbackRate)) || '');
        if (!(v > 0.2 && v <= 4)) return;
        a.playbackRate = v; rateSet(v); xb.textContent = rateTxt(v);
        return;
      }
      var i = SPEEDS.indexOf(a.playbackRate);
      var nv = SPEEDS[(i < 0 ? SPEEDS.indexOf(1) : i) + 1] || SPEEDS[0];
      a.playbackRate = nv; rateSet(nv); xb.textContent = rateTxt(nv);
    });
    icon();
    time();
    slot._audio = a;
    a.play()['catch'](function () {});
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
  /*@3.AUNJ.47*/
  function toggle() {
    /*@3.AUNJ.52*/
    if (rec) { if (drawer) shutDrawer(); else openDrawer(); return; }
    if (panel && panel.parentNode) {
      if (busy) return;
      close();
      return;
    }
    render();
  }

  function wire() {
    var b = micBtn();
    if (!b || b.getAttribute('data-wired')) return;
    b.setAttribute('data-wired', '1');
    b.addEventListener('click', toggle);
  }

  /*@3.AUNJ.14*/
  function sync() {
    badge();
    if (panel && panel.parentNode && !rec && !busy) render();
    if (drawer) drawList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }

  window.GardenAudioNote = {
    toggle: toggle,
    close: close,
    openDrawer: openDrawer,
    shutDrawer: shutDrawer,
    sync: sync,
    recording: function () { return !!rec; }
  };
})();
