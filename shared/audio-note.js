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
  /*@3.AUNJ.75*/
  function shortStamp(t) {
    var d = new Date(Number(t) || 0);
    if (!d.getTime()) return '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
           p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function A() { return window.GardenAudioRec || null; }
  function stayAwake() {
    var f = F();
    return (f && f.awake) ? f.awake() : function () {};
  }
  function F() { return window.GardenFiles || null; }
  function GDx() {
    var g = window.GardenDrive;
    return (g && g.enabled()) ? g : null;
  }
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

  /*@3.AUNJ.98*/
  function byK(a, b) { return (a.k || 0) - (b.k || 0); }

  function partsOf(refId) {
    var list = items();
    var me = null, i;
    for (i = 0; i < list.length; i++) if (list[i].i === refId) { me = list[i]; break; }
    if (!me) return [];
    if (!me.g) return [me];
    return list.filter(function (x) { return x.g === me.g; }).sort(byK);
  }

  function rows() {
    var list = items();
    var out = [], seen = {};
    list.forEach(function (x) {
      if (!x.g) { out.push([x]); return; }
      if (seen[x.g]) return;
      seen[x.g] = 1;
      out.push(list.filter(function (y) { return y.g === x.g; }).sort(byK));
    });
    return out;
  }

  function sum(part, key) {
    return part.reduce(function (a, x) { return a + (Number(x[key]) || 0); }, 0);
  }

  function weakest(part) {
    var w = part[0];
    part.forEach(function (x) {
      var rank = function (y) { return y.aup ? 3 : (y.gd ? 2 : (y.lo ? 1 : 0)); };
      if (rank(x) < rank(w)) w = x;
    });
    return w;
  }

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
  var cap = null, guard = null, unsettle = null;
  var view = 'main';

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
    if (side !== 'cap') {
      var P = window.GardenPop;
      if (P) { P.place(el, micBtn(), host()); return; }
    }
    if (side === 'cap') {
      /*@3.AUNJ.50*/
      el.style.top = (r.top + pad) + 'px';
      if (rtl) { el.style.right = (window.innerWidth - r.right + pad) + 'px'; el.style.left = 'auto'; }
      else     { el.style.left = (r.left + pad) + 'px'; el.style.right = 'auto'; }
      return;
    }
    /*@3.AUNJ.49*/
    var b = micBtn();
    var br = b ? b.getBoundingClientRect() : r;
    var w = el.offsetWidth || 256;
    var room = Math.max(8, window.innerWidth - w - 8);
    /*@3.AUNJ.57*/
    /*@3.AUNJ.74*/
    if (!br.width && !br.height) {
      if (el.style.top) return;
      br = { top: r.top, bottom: r.top, left: r.left, right: r.right,
             width: r.width, height: r.height };
      if (!br.width && !br.height) return;
    }
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
    if (panel) place(panel, r, 'pop');
  }
  window.addEventListener('resize', reflow);

  function close() {
    if (guard) { guard.off(); guard = null; }
    if (unsettle) { unsettle(); unsettle = null; }
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    view = 'main';
    var b = micBtn();
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /*@3.AUNJ.4*/
  function shell() {
    var r = anchorRect();
    if (!r) return null;
    if (panel && panel.parentNode) return panel;
    panel = document.createElement('div');
    panel.className = 'gsf-pop nrp';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', L('تسجيلُ الصوت', 'Voice recording'));
    panel.innerHTML =
      '<div class="nrp-b"></div><div class="nrp-f"></div>';
    document.body.appendChild(panel);
    var P = window.GardenPop;
    var b = micBtn();
    /*@3.AUNJ.56*/
    /*@3.AUNJ.61*/
    /*@3.AUNJ.43*/
    if (P) {
      P.place(panel, b, host());
      unsettle = P.settle(panel, b, host());
      guard = P.watch(panel, {
        locked: function () { return busy; },
        skip: function (x) { return !!(b && b.contains(x)); },
        close: function () {
          if (view === 'list' && !rec) { view = 'main'; render(); return; }
          close();
        }
      });
    }
    if (b) b.setAttribute('aria-expanded', 'true');
    return panel;
  }

  function render() {
    if (rec) { drawLive(); if (panel && view === 'list') drawList(); return; }
    var el = shell();
    if (!el) return;
    if (view === 'list' && items().length) drawList(); else drawIdle();
  }

  /*@3.AUNJ.45*/
  function mode(cls) {
    if (!panel) shell();
    if (!panel) return;
    panel.className = 'gsf-pop nrp' + (cls ? ' ' + cls : '');
    /*@3.AUNJ.53*/
    place(panel, anchorRect(), 'pop');
  }

  /*@3.AUNJ.54*/
  function settled(refId) {
    busy = false;
    openList();
    var row = panel && panel.querySelector('.nrr[data-ref="' + refId + '"]');
    if (!row) return;
    row.classList.add('on');
    /*@3.AUNJ.107*/
    askName(row, refId);
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
    var wip = wipOffer();
    if (!s.secure) {
      panel.className = 'gsf-pop nrp nrp--bad';
      msg('<b class="nrp-t">' + esc(L('التسجيلُ يحتاج اتّصالاً آمناً',
                        'Recording needs a secure connection')) + '</b>');
      acts(shutBtn());
      bindShut();
      return;
    }
    if (!s.mic || !s.recorder || !s.type) {
      panel.className = 'gsf-pop nrp nrp--bad';
      msg('<b class="nrp-t">' + esc(L('هذا المتصفّحُ لا يسجّل الصوت',
                        'This browser cannot record audio')) + '</b>' +
          '<span class="nrp-s">' +
          esc(L('جرّبْ كروم أو فَيَرفُكس.', 'Try Chrome or Firefox.')) + '</span>');
      acts(shutBtn());
      bindShut();
      return;
    }
    panel.className = 'gsf-pop nrp';
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
    msg(wip +
        '<b class="nrp-t">' + esc(L('سجّلِ المحاضرة', 'Record the lecture')) + '</b>' +
        '<span class="nrp-s">' +
        esc(L('يُحفظ مع الملاحظةِ حتى نهايةِ الفصل.',
              'Kept with the note until the term ends.')) + '</span>' +
        srcPick +
        '<span class="nrp-hint"></span>');
    acts('<button type="button" class="gsf-btn gsf-btn--pri nrec-go nrp-go">' +
         '<span class="nrp-live" aria-hidden="true"></span> ' +
         esc(L('ابدأِ التسجيل', 'Start recording')) + '</button>' + listLink() +
         '<button type="button" class="gsf-btn gsf-btn--ghost nrp-file">' +
         '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
         esc(L('من جهازك', 'From your device')) + '</button>');
    bindList();
    wipBind();
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
  /*@3.AUNJ.60*/
  function bindList() {
    var b = panel && panel.querySelector('.nrp-list');
    if (b) b.addEventListener('click', openList);
  }

  /*@3.AUNJ.6*/
  /*@3.AUNJ.28*/
  /*@3.AUNJ.44*/
  /*@3.AUNJ.84*/
  var open1 = false;

  function dockOpen(on) {
    open1 = !!on;
    if (cap) cap.setAttribute('data-open', open1 ? '1' : '0');
  }

  function drawLive() {
    var r = anchorRect();
    if (!r) return;
    if (cap && cap.parentNode) { beat(); return; }
    cap = document.createElement('div');
    cap.className = 'nrc';
    cap.setAttribute('role', 'group');
    cap.setAttribute('data-open', open1 ? '1' : '0');
    cap.setAttribute('aria-label', L('يجري التسجيل', 'Recording'));
    var i, bars = '';
    for (i = 0; i < 14; i++) bars += '<i style="--h:.10"></i>';
    cap.innerHTML =
      '<button type="button" class="nrc-face" aria-label="' +
        esc(L('تفاصيلُ التسجيل', 'Recording details')) + '"' +
        ' data-ar-title="تفاصيلُ التسجيل" data-en-title="Recording details">' +
        '<span class="nrc-dot" aria-hidden="true"></span>' +
        '<b class="nrec-clock">0:00</b>' +
        '<span class="nrec-wave" role="img" aria-label="' +
          esc(L('مستوى الصوت', 'Audio level')) + '"' +
          ' data-ar-title="مستوى الصوت" data-en-title="Audio level">' + bars + '</span>' +
      '</button>' +
      /*@3.AUNJ.96*/
      '<span class="nrc-more">' +
        '<span class="nrc-sep"></span>' +
        '<span class="nrec-say">' + esc(srcName()) + '</span>' +
        '<span class="nfo-dim nrec-meta"></span>' +
        '<span class="nrc-sep"></span>' +
        '<button type="button" class="nrc-ic nrec-hold" aria-label="' +
          esc(L('أوقفْ مؤقّتاً', 'Pause')) + '"' +
          ' data-ar-title="أوقفْ مؤقّتاً" data-en-title="Pause">' +
          '<i class="fa-solid fa-pause" aria-hidden="true"></i></button>' +
        '<button type="button" class="nrc-ic nrc-ic--stop nrec-stop" aria-label="' +
          esc(L('أنهِ التسجيلَ واحفظْ', 'End the recording and save')) + '"' +
          ' data-ar-title="أنهِ التسجيلَ واحفظْ"' +
          ' data-en-title="End the recording and save">' +
          '<i class="fa-solid fa-stop" aria-hidden="true"></i></button>' +
        '<button type="button" class="nrc-ic nrec-kill" aria-label="' +
          esc(L('ألغِ التسجيل', 'Discard the recording')) + '"' +
          ' data-ar-title="ألغِ التسجيل" data-en-title="Discard the recording">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<button type="button" class="nrc-ic nrec-list" aria-label="' +
          esc(L('تسجيلاتُ هذه الملاحظة', 'Recordings in this note')) + '"' +
          ' data-ar-title="تسجيلاتُ هذه الملاحظة"' +
          ' data-en-title="Recordings in this note">' +
          '<i class="fa-solid fa-list-ul" aria-hidden="true"></i></button>' +
      '</span>' +
      '<div class="nrc-ask" hidden></div>';
    document.body.appendChild(cap);
    place(cap, r, 'cap');
    cap.querySelector('.nrec-stop').addEventListener('click', function (e) {
      e.stopPropagation();
      askEnd(true);
    });
    cap.querySelector('.nrec-kill').addEventListener('click', function (e) {
      e.stopPropagation();
      askEnd(false);
    });
    cap.querySelector('.nrc-face').addEventListener('click', function () {
      dockOpen(!open1);
    });
    cap.querySelector('.nrec-hold').addEventListener('click', function (e) {
      e.stopPropagation();
      holdToggle();
    });
    cap.querySelector('.nrec-list').addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel && panel.parentNode && view === 'list') { close(); return; }
      openList();
    });
    beat();
  }

  /*@3.AUNJ.97*/
  var HUSH_LS = '__audioStopHush';

  function hushed() {
    try { return localStorage.getItem(HUSH_LS) === '1'; } catch (e) { return false; }
  }

  function askEnd(keep) {
    if (!cap || !rec) return;
    if (keep && hushed()) { stop(true); return; }
    var box = cap.querySelector('.nrc-ask');
    if (!box) { stop(keep); return; }
    dockOpen(true);
    var st = rec.stats();
    box.innerHTML =
      '<b>' + esc(keep ? L('أُنهي التسجيل؟', 'End the recording?')
                       : L('أُلغي التسجيل؟', 'Discard the recording?')) + '</b>' +
      '<span class="nfo-dim">' +
        (keep
          ? esc(L('ما سُجّل ', 'Recorded so far ')) +
            '<span dir="ltr">' + esc(clock(st.sec)) + '</span>' +
            esc(L(' — يُحفظ ولا يُحذف.',
                  ' — it will be saved, not deleted.'))
          : '<span dir="ltr">' + esc(clock(st.sec)) + '</span>' +
            esc(L(' يُمحى ولا رجوع.', ' will be erased. No undo.'))) +
      '</span>' +
      '<span class="nrc-ask-a">' +
        '<button type="button" class="gsf-btn gsf-btn--sm nrc-ask-go">' +
          esc(keep ? L('أنهِ التسجيل', 'End it')
                   : L('ألغِ', 'Discard')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm nrc-ask-no">' +
          esc(L('تراجعْ', 'Keep recording')) + '</button>' +
      '</span>' +
      (keep
        ? '<label class="nrc-ask-h"><input type="checkbox" class="nrc-ask-hush">' +
          '<span>' + esc(L('لا تسألني ثانيةً', "Don't ask me again")) +
          '</span></label>'
        : '');
    box.hidden = false;
    cap.setAttribute('data-ask', '1');
    box.querySelector('.nrc-ask-go').addEventListener('click', function (e) {
      e.stopPropagation();
      var h = box.querySelector('.nrc-ask-hush');
      if (h && h.checked) { try { localStorage.setItem(HUSH_LS, '1'); } catch (e2) {} }
      shutAsk();
      stop(keep);
    });
    box.querySelector('.nrc-ask-no').addEventListener('click', function (e) {
      e.stopPropagation();
      shutAsk();
    });
  }

  function shutAsk() {
    if (!cap) return;
    var box = cap.querySelector('.nrc-ask');
    if (box) { box.hidden = true; box.innerHTML = ''; }
    cap.removeAttribute('data-ask');
  }

  /*@3.AUNJ.87*/
  function holdToggle() {
    if (!rec || !rec.hold) return;
    if (rec.paused()) rec.resume(); else rec.hold();
    paintHold();
    beat();
  }

  function paintHold() {
    if (!cap || !rec) return;
    var off = !!(rec.paused && rec.paused());
    var b = cap.querySelector('.nrec-hold');
    cap.setAttribute('data-held', off ? '1' : '0');
    if (!b) return;
    b.innerHTML = '<i class="fa-solid fa-' + (off ? 'play' : 'pause') +
                  '" aria-hidden="true"></i>';
    var ar = off ? 'تابعِ التسجيل' : 'أوقفْ مؤقّتاً';
    var en = off ? 'Resume' : 'Pause';
    b.setAttribute('aria-label', L(ar, en));
    b.setAttribute('data-ar-title', ar);
    b.setAttribute('data-en-title', en);
  }

  function srcName() {
    var s = rec && rec.source;
    if (s === 'system') return L('صوتُ الجهاز', 'Device audio');
    if (s === 'both') return L('كلاهما', 'Both');
    return L('الميكروفون', 'Microphone');
  }

  /*@3.AUNJ.88*/
  function capGone() {
    shutAsk();
    if (cap && cap.parentNode) cap.parentNode.removeChild(cap);
    cap = null;
    open1 = false;
  }

  function beat() {
    if (!rec || !cap) return;
    var st = rec.stats();
    var c = cap.querySelector('.nrec-clock');
    var m = cap.querySelector('.nrec-meta');
    if (c) c.textContent = clock(st.sec);
    if (m) m.textContent = size(st.bytes);
    paintHold();
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
    /*@3.AUNJ.85*/
    var held = !!lv.held;
    var lvl = held ? 'held'
            : (lv.peak < 0.02 ? 'hush'
              : (lv.peak > 0.86 ? 'hot' : (v > 0.55 ? 'loud' : 'talk')));
    w.setAttribute('data-lv', lvl);
    cap.setAttribute('data-lv', lvl);
    /*@3.AUNJ.31*/
    hush = (!held && lv.peak < 0.008) ? hush + 1 : 0;
    var quiet = hush > 24;
    w.setAttribute('data-hush', quiet ? '1' : '0');
    cap.setAttribute('data-hush', quiet ? '1' : '0');
    var say = cap.querySelector('.nrec-say');
    if (!say) return;
    var word = held ? L('موقوفٌ مؤقّتاً', 'Paused')
             : (quiet ? L('لا أسمع شيئاً', 'No sound')
               : (lvl === 'hot' ? L('الصوتُ عالٍ جدّاً', 'Too loud') : ''));
    if (word) {
      say.textContent = word;
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

  /*@3.AUNJ.91*/
  var WIP_LS = '__audioWip';
  var wipId = '';

  function noteNow() {
    var A2 = App();
    return (A2 && A2.noteId) ? String(A2.noteId() || '') : '';
  }
  function wipRead() {
    try { return JSON.parse(localStorage.getItem(WIP_LS) || 'null'); }
    catch (e) { return null; }
  }
  function wipWrite(o) {
    try {
      if (o) localStorage.setItem(WIP_LS, JSON.stringify(o));
      else localStorage.removeItem(WIP_LS);
    } catch (e) {}
  }
  function wipKey(id, k) { return 'wip_' + id + '_' + k; }

  function wipBegin(src, mime) {
    wipId = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    wipWrite({ id: wipId, n: 0, t0: Date.now(), src: src || 'mic',
               m: mime || 'audio/webm', note: noteNow() });
  }
  function wipPut(blob, i) {
    var st = D();
    var o = wipRead();
    if (!st || !o || o.id !== wipId) return;
    st.put(wipKey(wipId, i), blob, { name: 'wip' })['catch'](function () {});
    o.n = i + 1;
    o.at = Date.now();
    wipWrite(o);
  }
  function wipClear(o) {
    var st = D();
    var w = o || wipRead();
    wipId = '';
    wipWrite(null);
    if (!st || !w) return;
    for (var i = 0; i < (w.n || 0); i++) {
      st.drop(wipKey(w.id, i))['catch'](function () {});
    }
  }
  function wipJoin(w) {
    var st = D();
    if (!st || !w || !w.n) return Promise.resolve(null);
    var parts = [], i = 0;
    var next = function () {
      if (i >= w.n) {
        return parts.length ? new Blob(parts, { type: w.m || 'audio/webm' }) : null;
      }
      return st.get(wipKey(w.id, i++)).then(function (b) {
        if (b && b.size) parts.push(b);
        return next();
      }, next);
    };
    return Promise.resolve(next());
  }

  /*@3.AUNJ.92*/
  function wipOffer() {
    var w = wipRead();
    if (!w || !w.n || rec || busy) return '';
    var secs = Math.max(0, Math.round(((w.at || w.t0) - w.t0) / 1000));
    var mine = !w.note || w.note === noteNow();
    return '<div class="nrp-wip" data-mine="' + (mine ? '1' : '0') + '">' +
      '<b>' + esc(L('تسجيلٌ لم يُختم', 'An unfinished recording')) + '</b>' +
      '<span class="nfo-dim"><span dir="ltr">' + esc(clock(secs)) + '</span>' +
      ' · ' + esc(stamp(w.t0)) +
      (mine ? '' : ' · ' + esc(L('من ملاحظةٍ أخرى', 'from another note'))) + '</span>' +
      '<span class="nrp-wip-a">' +
      /*@3.AUNJ.103*/
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--pri nrp-wip-on">' +
      '<i class="fa-solid fa-microphone" aria-hidden="true"></i> ' +
      esc(L('أكملِ التسجيل', 'Continue recording')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--sm nrp-wip-yes">' +
      esc(L('احفظْه', 'Save it')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm nrp-wip-no">' +
      esc(L('ألغِه', 'Discard')) + '</button></span></div>';
  }

  function wipBind() {
    if (!panel) return;
    var yes = panel.querySelector('.nrp-wip-yes');
    var on = panel.querySelector('.nrp-wip-on');
    var no = panel.querySelector('.nrp-wip-no');
    if (no) no.addEventListener('click', function () { wipClear(); render(); });
    if (yes) yes.addEventListener('click', function () {
      wipTake(yes, L('يُجمع…', 'Assembling…'), function (blob, secs, w) {
        upload({ blob: blob, sec: secs, bytes: blob.size, type: w.m || 'audio/webm' });
      });
    });
    /*@3.AUNJ.105*/
    if (on) on.addEventListener('click', function () {
      wipTake(on, L('يُهيَّأ…', 'Preparing…'), function (blob, secs, w) {
        var gid = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        var it = newItem({ blob: blob, sec: secs, type: w.m || 'audio/webm' });
        it.g = gid;
        it.k = 0;
        keepQuiet(it, blob).then(function () {
          start(w.src || 'mic', { g: gid, k: 1 });
        });
      });
    });
  }

  function wipTake(btn, word, use) {
    var w = wipRead();
    if (!w) { render(); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + esc(word);
    wipJoin(w).then(function (blob) {
      if (!blob || blob.size < 1024) { wipClear(w); render(); return; }
      var secs = Math.max(1, Math.round(((w.at || w.t0) - w.t0) / 1000));
      wipClear(w);
      use(blob, secs, w);
    })['catch'](function () { wipClear(w); render(); });
  }

  /*@3.AUNJ.104*/
  function keepQuiet(it, blob) {
    var st = D();
    var held = st
      ? st.put(it.i, blob, { name: it.n })['catch'](function () { return false; })
      : Promise.resolve(false);
    return held.then(function (okLocal) {
      it.lo = okLocal ? 1 : 0;
      addItem(it);
      return okLocal;
    });
  }

  /*@3.AUNJ.7*/
  var starting = false;
  var wake = null;
  var pendGroup = null;
  function start(source, grp) {
    var R = A();
    /*@3.AUNJ.89*/
    if (!R || rec || starting) return;
    starting = true;
    pendGroup = grp || null;
    mode('nrp--busy');
    msg('<b>' + esc(L('يُطلب إذنُ الميكروفون…', 'Asking for microphone permission…')) + '</b>');
    acts('');
    /*@3.AUNJ.29*/
    var r = new R.Recorder({ bps: bpsFor(source), source: source || 'mic' });
    r.open().then(function () {
      starting = false;
      rec = r;
      hush = 0;
      /*@3.AUNJ.94*/
      wipBegin(source || 'mic', r.type || '');
      r.onData = wipPut;
      rec.start();
      if (wake) wake();
      wake = stayAwake();
      wipWrite(Object.assign(wipRead() || {}, { m: r.type || 'audio/webm' }));
      markStart(rec.t0 || Date.now());
      close();
      dockOpen(false);
      render();
      timer = setInterval(beat, 500);
      var b = micBtn();
      if (b) b.classList.add('na-icb--rec');
    })['catch'](function (e) {
      starting = false;
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
      acts('<button type="button" class="gsf-btn gsf-btn--pri nrec-again">' +
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
    if (wake) { wake(); wake = null; }
    r.stop().then(function (out) {
      wipClear();
      var grp = pendGroup;
      pendGroup = null;
      if (!keep || !out || !out.blob || out.blob.size < 1024) {
        /*@3.AUNJ.40*/
        markStop();
        render(); return;
      }
      upload(out, grp);
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
  var EXT_MIME = { m4a: 'audio/x-m4a', m4b: 'audio/x-m4a', mp3: 'audio/mpeg',
                   wav: 'audio/wav', aac: 'audio/aac', amr: 'audio/amr',
                   '3gp': 'audio/3gpp', '3gpp': 'audio/3gpp', ogg: 'audio/ogg',
                   opus: 'audio/opus', oga: 'audio/ogg', webm: 'audio/webm',
                   mp4: 'video/mp4', flac: 'audio/flac', caf: 'audio/x-caf',
                   mkv: 'video/x-matroska', mov: 'video/quicktime' };
  var EXT_MAX = 250 * 1024 * 1024;

  function pickExternal() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'audio/*,video/*,.m4a,.mp3,.wav,.aac,.amr,.3gp,.3gpp,.ogg,.oga,.opus,'
               + '.webm,.mp4,.m4b,.flac,.mov,.mkv,.caf';
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

  /*@3.AUNJ.62*/
  function judgeMime(file, x) {
    var f = F();
    var norm = (f && f.normMime) ? f.normMime : function (m) {
      var v = String(m || '').split(';')[0].trim().toLowerCase();
      return /^audio\/|^video\//.test(v) ? v : '';
    };
    return norm(file.type) || norm(EXT_MIME[x]) || '';
  }

  function fromFile(file) {
    if (!doc()) return;
    var x = extOf(file.name);
    var mime = judgeMime(file, x);
    if (!mime) {
      mode('nrp--bad');
      msg('<b>' + esc(L('هذه ليست صيغةَ صوتٍ نعرفها', 'This is not an audio format we know')) +
          '</b> ' + esc(L('· جرّبْ m4a أو mp3 أو wav أو m4a من الآيفون أو تسجيلَ شاشة.',
                          '· try m4a, mp3, wav, an iPhone m4a, or a screen recording.')) +
          (file.type ? ' <span class="nfo-dim">' + esc(file.type) + '</span>' : ''));
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
  function newItem(out) {
    var refId = REF_PREFIX + Date.now().toString(36) + '_' +
                Math.random().toString(36).slice(2, 8);
    /*@3.AUNJ.34*/
    /*@3.AUNJ.41*/
    var mk = markStop();
    return { i: refId, n: nameFor(out.sec), t: Date.now(),
             s0: Math.round(Date.now() - out.sec * 1000),
             mk: mk,
             ms: Math.round(out.sec * 1000), b: out.blob.size,
             m: (out.blob.type || 'audio/webm').split(';')[0], aup: 0 };
  }

  function upload(out, grp) {
    var it = newItem(out);
    if (grp && grp.g) { it.g = grp.g; it.k = grp.k || 0; }
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
      /*@3.AUNJ.77*/
      var pref = homePref();
      if (!F() && !GDx()) { busy = false; settled(it.i); return; }
      if (pref === 'us' && F()) { send(it, blob); return; }
      if (pref === 'gd' && GDx()) { sendDrive(it, blob, null); return; }
      if (pref === 'here') { busy = false; it.aup = 0; touch(true); settled(it.i); return; }
      consent(it, blob);
    });
  }

  /*@3.AUNJ.38*/
  var ASK_LS = '__audioVow';
  var HOME_LS = '__audioHome';

  function homePref() {
    try {
      var v = localStorage.getItem(HOME_LS);
      if (v === 'us' || v === 'gd' || v === 'here') return v;
      return localStorage.getItem(ASK_LS) === '1' ? 'us' : '';
    } catch (e) { return ''; }
  }
  function homeSet(v) {
    try { localStorage.setItem(HOME_LS, v); localStorage.setItem(ASK_LS, '1'); } catch (e) {}
  }

  function consent(it, blob) {
    var gd = GDx();
    var us = !!F();
    busy = false;
    mode('nrp--vow');
    msg('<b>' + esc(L('حُفظ التسجيلُ على هذا الجهاز',
                      'The recording is saved on this device')) + '</b> ' +
        '<span class="nfo-dim" dir="ltr">' + esc(size(blob.size)) + '</span>' +
        '<span class="nfo-vow">' +
        esc(L('أين تريد نسخةً تفتح على أجهزتك؟ نسألك مرّةً واحدة، وتغيّره لكلِّ ' +
              'تسجيلٍ من قائمتِه.',
              'Where would you like a copy that opens on your devices? We ask once, ' +
              'and you can change it per recording from its list.')) +
        '<br><b>' +
        esc(L('عندنا: يبقى هذا الفصلَ الدراسيَّ ثمّ يُحذف مع بدايةِ الفصلِ الجديد، ' +
              'وننبّهك قبلَه بثلاثةِ أيّام. وفي درايفك: في مجلّد «Digital Garden» ' +
              'بحسابك، بلا حدٍّ منّا.',
              'With us: it stays for this term, then is removed when the new term ' +
              'starts — we warn you three days before. In your Drive: in the ' +
              '"Digital Garden" folder in your account, with no limit from us.')) +
        '</b></span>');
    acts((us ? '<button type="button" class="gsf-btn gsf-btn--pri nrec-vow-up">' +
               '<i class="fa-solid fa-cloud" aria-hidden="true"></i> ' +
               esc(L('عندنا', 'With us')) + '</button>' : '') +
         (gd ? '<button type="button" class="gsf-btn nrec-vow-gd">' +
               '<i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
               esc(L('في درايفي', 'In my Drive')) + '</button>' : '') +
         '<button type="button" class="gsf-btn gsf-btn--ghost nrec-vow-no">' +
         esc(L('هذا الجهازُ وحدَه', 'This device only')) + '</button>');
    var bUs = panel.querySelector('.nrec-vow-up');
    if (bUs) bUs.addEventListener('click', function () {
      homeSet('us');
      send(it, blob);
    });
    var bGd = panel.querySelector('.nrec-vow-gd');
    if (bGd) bGd.addEventListener('click', function () {
      homeSet('gd');
      sendDrive(it, blob, null);
    });
    panel.querySelector('.nrec-vow-no').addEventListener('click', function () {
      homeSet('here');
      it.aup = 0;
      touch(true);
      settled(it.i);
    });
  }

  /*@3.AUNJ.17*/
  function send(it, blob) { sendThen(it, blob, null); }

  /*@3.AUNJ.64*/
  function sendThen(it, blob, after, quiet) {
    var f = F();
    var refId = it.i;
    if (!f) { if (!quiet) { busy = false; render(); } if (after) after(); return; }
    /*@3.AUNJ.95*/
    if (!quiet) {
      busy = true;
      mode('nrp--busy');
      msg('<b>' + esc(L('يُرفع التسجيل…', 'Uploading the recording…')) + '</b> ' +
          '<span class="nfo-dim">' + esc(size(blob.size)) + '</span>');
      acts('<span class="nfo-track"><span class="nfo-fill nrec-fill"></span></span>');
    }

    var on = function (e) {
      var d = e.detail || {};
      if (d.ref_id !== refId) return;
      var fill = panel && panel.querySelector('.nrec-fill');
      if (fill && d.of) fill.style.width = Math.round((d.at / d.of) * 100) + '%';
    };
    window.addEventListener('garden:fileProgress', on);

    /*@3.AUNJ.63*/
    f.upload(blob, { refId: refId, name: it.n + ext(it.m, it), mime: it.m })
      .then(function (r) {
        window.removeEventListener('garden:fileProgress', on);
        if (!quiet) busy = false;
        it.aup = 1;
        it.b = r.bytes || it.b;
        /*@3.AUNJ.18*/
        var st = D();
        if (st && it.lo) { st.drop(refId)['catch'](function () {}); it.lo = 0; }
        touch(true);
        if (after) { after(); return; }
        settled(refId);
      }, function (e) {
        window.removeEventListener('garden:fileProgress', on);
        if (!quiet) busy = false;
        /*@3.AUNJ.10*/
        it.aup = 0;
        touch(true);
        if (quiet) { if (after) after(); return; }
        render();
        mode('nrp--bad');
        /*@3.AUNJ.65*/
        msg('<b>' + esc(L('لم يُرفع التسجيل', 'The recording was not uploaded')) + '</b> ' +
            esc(sendWhy(e)) + ' ' +
            esc(it.lo
              ? L('وهو محفوظٌ على هذا الجهازِ وحدَه — أعِدِ الرفعَ متى شئت.',
                  'It is stored on this device only — retry whenever you like.')
              : L('ولم يُحفظ على الجهازِ أيضاً — التسجيلُ ضاع.',
                  'And it was not stored on this device either — the recording is lost.')));
        acts((it.lo
              ? '<button type="button" class="gsf-btn gsf-btn--pri nrec-again2">' +
                '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' +
                esc(L('أعِدِ الرفع', 'Retry')) + '</button>'
              : '') + shutBtn());
        bindShut();
        var ag = panel && panel.querySelector('.nrec-again2');
        if (ag) ag.addEventListener('click', function () { retry(refId); });
      });
  }

  /*@3.AUNJ.78*/
  function sendDrive(it, blob, after) {
    var gd = GDx();
    if (!gd) { busy = false; render(); return; }
    busy = true;
    mode('nrp--busy');
    msg('<b>' + esc(L('يُرفع إلى درايفك…', 'Uploading to your Drive…')) + '</b> ' +
        '<span class="nfo-dim" dir="ltr">' + esc(size(blob.size)) + '</span>');
    acts('<span class="nfo-track"><span class="nfo-fill nrec-fill"></span></span>');
    gd.upload(blob, {
      name: it.n + ext(it.m, it),
      mime: it.m,
      tag: 'aud',
      onProgress: function (at, of) {
        var fill = panel && panel.querySelector('.nrec-fill');
        if (fill && of) fill.style.width = Math.round((at / of) * 100) + '%';
      }
    }).then(function (r) {
      busy = false;
      it.gd = (r && r.id) || '';
      it.aup = 0;
      touch(true);
      if (after) { after(); return; }
      settled(it.i);
    }, function (e) {
      busy = false;
      touch(true);
      render();
      mode('nrp--bad');
      msg('<b>' + esc(L('لم يُرفع إلى درايف', 'It was not uploaded to Drive')) + '</b> ' +
          esc(gd.reason(e)) + ' ' +
          esc(it.lo ? L('وهو محفوظٌ على هذا الجهازِ — أعِدِ الرفعَ متى شئت.',
                        'It is stored on this device — retry whenever you like.')
                    : L('ولم يُحفظ على الجهازِ أيضاً — التسجيلُ ضاع.',
                        'And it was not stored on this device either — it is lost.')));
      acts((it.lo ? '<button type="button" class="gsf-btn gsf-btn--pri nrec-again3">' +
                    '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' +
                    esc(L('أعِدِ الرفع', 'Retry')) + '</button>' : '') + shutBtn());
      bindShut();
      var ag = panel && panel.querySelector('.nrec-again3');
      if (ag) ag.addEventListener('click', function () { retryDrive(it.i); });
    });
  }

  function retryDrive(refId) {
    var st = D();
    var it = items().filter(function (x) { return x.i === refId; })[0];
    if (!it) return;
    if (!st || !it.lo) { gone(); return; }
    st.get(refId).then(function (b) {
      if (!b || !b.size) { it.lo = 0; touch(true); gone(); return; }
      sendDrive(it, b, null);
    })['catch'](function () { it.lo = 0; touch(true); gone(); });
  }

  /*@3.AUNJ.80*/
  function pullDrive(refId, then) {
    var gd = GDx();
    var it = items().filter(function (x) { return x.i === refId; })[0];
    if (!gd || !it || !it.gd) { if (then) then(null); return; }
    gd.download(it.gd).then(function (blob) {
      if (!blob || !blob.size) throw new Error('empty');
      var st = D();
      var held = st ? st.put(refId, blob, { name: it.n })['catch'](function () { return false; })
                    : Promise.resolve(false);
      return held.then(function (okLocal) {
        it.lo = okLocal ? 1 : 0;
        it.b = blob.size || it.b;
        touch(true);
        if (then) then(blob);
      });
    })['catch'](function (e) {
      if (then) then(null);
      mode('nrp--bad');
      msg('<b>' + esc(L('تعذّر جلبُه من درايف', 'It could not be fetched from Drive')) +
          '</b> ' + esc(gd.reason(e)));
      acts(shutBtn());
      bindShut();
    });
  }

  /*@3.AUNJ.66*/
  function sendWhy(e) {
    var k = (e && (e.error || e.message)) || '';
    if (k === 'no_vault') {
      return L('· فعّلِ المزامنةَ أوّلاً (⚙ الإعدادات ← المزامنة).',
               '· turn sync on first (Settings ⚙ → Sync).');
    }
    if (k === 'bad_mime') {
      return L('· صيغةٌ لا نقبلها بعد' + (e && e.mime ? ' (' + e.mime + ')' : '') + '.',
               '· a format we do not accept yet' +
               (e && e.mime ? ' (' + e.mime + ')' : '') + '.');
    }
    if (k === 'too_large') {
      return L('· أكبرُ من الحدِّ المسموح.', '· larger than the allowed limit.');
    }
    if (k === 'vault_full') {
      return L('· امتلأت مساحتُك عندنا؛ احذفْ تسجيلاً قديماً.',
               '· your space with us is full; remove an old recording.');
    }
    if (k === 'too_many_files') {
      return L('· بلغتَ عددَ الملفّاتِ المسموح.', '· you reached the file-count limit.');
    }
    if (/^put_/.test(k)) {
      return L('· انقطع الاتّصالُ أثناء الرفع.', '· the connection dropped mid-upload.');
    }
    return L('· تعذّر الوصولُ إلى الخادم.', '· the server could not be reached.') +
           (k ? ' (' + k + ')' : '');
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

  /*@3.AUNJ.106*/
  function titleOf(x) {
    var v = String((x && x.nm) || '').trim();
    return v || shortName(x && x.n);
  }

  /*@3.AUNJ.46*/
  function openList() {
    view = 'list';
    if (!panel) shell();
    drawList();
    reflow();
  }

  function shutList() { if (view === 'list') { view = 'main'; render(); } }

  /*@3.AUNJ.11*/
  /*@3.AUNJ.59*/
  function drawList() {
    if (!panel) shell();
    if (!panel) return;
    view = 'list';
    panel.className = 'gsf-pop nrp nrp--list';
    var list = items();
    msg('<div class="nrp-head">' +
        '<button type="button" class="nrp-back" aria-label="' +
          esc(L('رجوع', 'Back')) + '"' +
          ' data-ar-title="رجوع" data-en-title="Back">' +
          '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
        '<b class="nrp-t">' + esc(L('تسجيلاتُ هذه الملاحظة', 'Recordings in this note')) +
        '</b><span class="nrp-n">' + rows().length + '</span></div>' +
        '<div class="nrp-list-box"></div>');
    acts('');
    var back = panel.querySelector('.nrp-back');
    if (back) back.addEventListener('click', function () { view = 'main'; render(); });
    var box = panel.querySelector('.nrp-list-box');
    if (!box) return;
    /*@3.AUNJ.67*/
    if (!list.length) {
      box.innerHTML = '<p class="nrp-empty">' +
        '<i class="fa-solid fa-microphone" aria-hidden="true"></i>' +
        esc(L('لا تسجيلَ في هذه الملاحظةِ بعد.',
              'No recordings in this note yet.')) + '</p>';
      acts('<button type="button" class="gsf-btn gsf-btn--pri nrp-back2">' +
           esc(L('سجّلْ الآن', 'Record now')) + '</button>');
      var b2 = panel.querySelector('.nrp-back2');
      if (b2) b2.addEventListener('click', function () { view = 'main'; render(); });
      reflow();
      return;
    }
    /*@3.AUNJ.68*/
    /*@3.AUNJ.100*/
    box.innerHTML = rows().slice().reverse().map(function (part) {
      var x = part[0];
      var w = whereOf(weakest(part));
      var can = part.every(function (y) { return !!(y.aup || y.lo || y.gd); });
      var ms = sum(part, 'ms');
      var bytes = sum(part, 'b');
      return '<div class="nrr' + (can ? '' : ' nrr--gone') + '" data-ref="' + esc(x.i) + '">' +
        '<button type="button" class="nrr-hit nrec-play"' + (can ? '' : ' disabled') +
          ' aria-label="' + esc(can ? L('شغّلْ أو أوقفْ ', 'Play or pause ') + titleOf(x)
                                    : w.t) + '"' +
          ' title="' + esc(titleOf(x) + ' — ' + w.t + ' · ' +
                            size(bytes) + ' · ' + stamp(x.t)) + '">' +
          '<span class="nrr-p" aria-hidden="true">' +
            '<i class="fa-solid ' + (can ? 'fa-play' : 'fa-link-slash') + '"></i></span>' +
          '<span class="nrr-txt">' +
            '<span class="nrr-n">' + esc(titleOf(x)) + '</span>' +
            '<span class="nrr-m">' +
              '<i class="' + w.i + '" aria-hidden="true"></i>' +
              esc(w.s) + ' · <span dir="ltr">' + esc(size(bytes)) + '</span>' +
              ' · <span dir="ltr">' + esc(shortStamp(x.t)) + '</span>' +
              '</span>' +
          '</span>' +
          '<span class="nrr-d">' + esc(clock(ms / 1000)) + '</span>' +
        '</button>' +
        '<button type="button" class="nrr-x nrec-ren" aria-label="' +
          esc(L('أعِدْ تسميةَ التسجيل', 'Rename recording')) + '"' +
          ' data-ar-title="أعِدْ تسميةَ التسجيل" data-en-title="Rename recording">' +
          '<i class="fa-solid fa-pen" aria-hidden="true"></i></button>' +
        '<button type="button" class="nrr-x nrec-del" aria-label="' +
          esc(L('حذفُ التسجيل', 'Delete recording')) + '"' +
          ' data-ar-title="حذفُ التسجيل" data-en-title="Delete recording">' +
          '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '<div class="nrr-s nrec-row-p">' +
          /*@3.AUNJ.76*/
          ((x.aup || x.gd || !x.lo) ? '' :
            '<button type="button" class="gsf-btn gsf-btn--sm nrec-retry">' +
            '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> ' +
            esc(L('احفظْه عندنا', 'Keep it with us')) + '</button>' +
            (GDx() ? '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm nrec-togd">' +
                     '<i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
                     esc(L('في درايفي', 'In my Drive')) + '</button>' : '')) +
          ((x.gd && !x.lo && !x.aup)
            ? '<button type="button" class="gsf-btn gsf-btn--sm nrec-link">' +
              '<i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
              esc(L('اربطْ درايف هنا', 'Link Drive here')) + '</button>' : '') +
        '</div></div>';
    }).join('');

    /*@3.AUNJ.69*/
    var groups = rows();
    var up = list.filter(function (x) { return !x.aup && !x.gd && x.lo; }).length;
    var tot = list.reduce(function (a, x) { return a + (Number(x.b) || 0); }, 0);
    var upn = groups.filter(function (g) {
      return g.every(function (x) { return x.aup || x.gd; });
    }).length;
    acts('<span class="nrp-sum">' +
         esc(L('على أجهزتك جميعاً ', 'On all your devices ')) +
         '<b dir="ltr">' + upn + '/' + groups.length + '</b>' +
         ' · <span dir="ltr">' + esc(size(tot)) + '</span></span>' +
         (up ? '<button type="button" class="gsf-btn gsf-btn--sm nrp-all">' +
               '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> ' +
               esc(L('احفظِ الباقيَ عندنا', 'Keep the rest with us')) + ' <b>' + up +
               '</b></button>' : ''));
    var all = panel.querySelector('.nrp-all');
    if (all) all.addEventListener('click', function () { sendRest(); });

    reflow();
    Array.prototype.forEach.call(box.querySelectorAll('.nrr'), function (row) {
      var ref = row.getAttribute('data-ref');
      /*@3.AUNJ.70*/
      var ren = row.querySelector('.nrec-ren');
      if (ren) ren.addEventListener('click', function (e) {
        e.stopPropagation();
        askName(row, ref);
      });
      var del = row.querySelector('.nrec-del');
      if (del) del.addEventListener('click', function (e) {
        e.stopPropagation();
        askDrop(row, ref);
      });
      var play = row.querySelector('.nrec-play');
      if (play) play.addEventListener('click', function (e) {
        e.stopPropagation();
        if (play.disabled) return;
        hit(ref, row, box);
      });
      var again = row.querySelector('.nrec-retry');
      if (again) again.addEventListener('click', function (e) {
        e.stopPropagation(); retry(ref);
      });
      var togd = row.querySelector('.nrec-togd');
      if (togd) togd.addEventListener('click', function (e) {
        e.stopPropagation(); retryDrive(ref);
      });
      var link = row.querySelector('.nrec-link');
      if (link) link.addEventListener('click', function (e) {
        e.stopPropagation();
        link.disabled = true;
        link.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' +
                         esc(L('يُجلب…', 'Fetching…'));
        pullDrive(ref, function (blob) { if (blob) drawList(); });
      });
    });
  }

  /*@3.AUNJ.20*/
  function whereOf(x) {
    if (x.aup) {
      return { i: 'fa-solid fa-cloud', s: L('عندنا', 'With us'),
               t: L('محفوظٌ عندنا · يفتح على أجهزتك جميعاً',
                    'Kept with us — opens on all your devices') };
    }
    if (x.gd) {
      return { i: 'fa-brands fa-google-drive', s: L('في درايفك', 'In your Drive'),
               t: x.lo ? L('في درايفك وعلى هذا الجهاز', 'In your Drive and on this device')
                       : L('في درايفك — على جهازٍ آخر', 'In your Drive — on another device') };
    }
    if (x.lo) {
      return { i: 'fa-solid fa-mobile-screen', s: L('هذا الجهاز', 'This device'),
               t: L('على هذا الجهازِ وحدَه — لا يفتح على غيره',
                    'On this device only — will not open elsewhere') };
    }
    return { i: 'fa-solid fa-link-slash', s: L('لا نسخة', 'No copy'),
             t: L('مضت نسختُه من هذا الجهازِ ولم يصل الخادم',
                  'The device copy is gone and it never reached the server') };
  }

  /*@3.AUNJ.82*/
  function hit(ref, row, box) {
    var slot = row.querySelector('.nrec-row-p');
    if (slot && slot._audio && row.classList.contains('on')) {
      var a = slot._audio;
      if (a.paused) { a.play()['catch'](function () {}); } else { a.pause(); }
      return;
    }
    Array.prototype.forEach.call(box.querySelectorAll('.nrr'), function (o) {
      if (o !== row) { o.classList.remove('on'); stopRow(o); }
    });
    row.classList.add('on');
    play_(ref, row);
  }

  /*@3.AUNJ.72*/
  function stopRow(row) {
    var slot = row && row.querySelector('.nrec-row-p');
    if (slot && slot._audio) { try { slot._audio.pause(); } catch (e) {} }
  }

  /*@3.AUNJ.108*/
  function askName(row, ref) {
    if (!row || row.getAttribute('data-ask')) return;
    var it = items().filter(function (x) { return x.i === ref; })[0];
    var slot = row.querySelector('.nrec-row-p');
    if (!it || !slot) return;
    row.setAttribute('data-ask', '1');
    stopRow(row);
    row.classList.add('on', 'nrr--ask');
    slot.innerHTML = '<input type="text" class="nrr-name" maxlength="80"' +
      ' aria-label="' + esc(L('اسمُ التسجيل', 'Recording name')) + '"' +
      ' placeholder="' + esc(shortName(it.n)) + '" value="' +
      esc(String(it.nm || '')) + '">' +
      '<button type="button" class="gsf-btn gsf-btn--sm nrr-name-ok">' +
      esc(L('احفظْ', 'Save')) + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm nrr-name-no">' +
      esc(L('تراجعْ', 'Cancel')) + '</button>';
    var box = slot.querySelector('.nrr-name');
    var shut = function () {
      row.removeAttribute('data-ask');
      row.classList.remove('on', 'nrr--ask');
      slot.innerHTML = '';
      drawList();
    };
    var save = function () {
      var v = String(box.value || '').trim().slice(0, 80);
      if (v) it.nm = v; else delete it.nm;
      touch(true);
      shut();
    };
    slot.querySelector('.nrr-name-ok').addEventListener('click', function (e) {
      e.stopPropagation(); save();
    });
    slot.querySelector('.nrr-name-no').addEventListener('click', function (e) {
      e.stopPropagation(); shut();
    });
    box.addEventListener('click', function (e) { e.stopPropagation(); });
    box.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      else if (e.key === 'Escape') { e.preventDefault(); shut(); }
    });
    try { box.focus(); box.select(); } catch (e) {}
  }

  /*@3.AUNJ.71*/
  function askDrop(row, ref) {
    if (row.getAttribute('data-ask')) return;
    row.setAttribute('data-ask', '1');
    var it = items().filter(function (x) { return x.i === ref; })[0];
    var slot = row.querySelector('.nrec-row-p');
    if (!slot) { remove(ref, row); return; }
    stopRow(row);
    row.classList.add('on', 'nrr--ask');
    /*@3.AUNJ.83*/
    var part = partsOf(ref);
    var onGd = part.some(function (x) { return !!x.gd; });
    var say = onGd
      ? L('لك نسخةٌ في درايف — أتبقى هناك؟',
          'You have a copy in Drive — keep it there?')
      : (part.length > 1
          ? L('يُحذف بمقاطعِه كلِّها. لا رجوع.',
              'This deletes it with all its parts. No undo.')
          : (it && it.aup
              ? L('يُحذف من هنا ومن أجهزتك جميعاً. لا رجوع.',
                  'This deletes it here and on all your devices. No undo.')
              : L('يُحذف من هذا الجهاز. لا رجوع.',
                  'This deletes it from this device. No undo.')));
    slot.innerHTML = '<span class="nrr-ask">' + esc(say) + '</span>' +
      '<button type="button" class="gsf-btn gsf-btn--sm nrr-yes">' +
      esc(onGd ? L('من هنا فقط', 'Here only') : L('احذفْ', 'Delete')) +
      '</button>' +
      (onGd ? '<button type="button" class="gsf-btn gsf-btn--sm nrr-both">' +
              esc(L('ومن درايف أيضاً', 'And from Drive')) + '</button>' : '') +
      '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm nrr-nope">' +
      esc(L('تراجعْ', 'Keep')) + '</button>';
    slot.querySelector('.nrr-yes').addEventListener('click', function (e) {
      e.stopPropagation(); remove(ref, row, false);
    });
    var both = slot.querySelector('.nrr-both');
    if (both) both.addEventListener('click', function (e) {
      e.stopPropagation(); remove(ref, row, true);
    });
    slot.querySelector('.nrr-nope').addEventListener('click', function (e) {
      e.stopPropagation();
      row.removeAttribute('data-ask');
      row.classList.remove('on', 'nrr--ask');
      slot.innerHTML = '';
      drawList();
    });
  }

  /*@3.AUNJ.73*/
  function sendRest() {
    var rest = items().filter(function (x) { return !x.aup && !x.gd && x.lo; });
    if (!rest.length || busy) return;
    var i = 0;
    var next = function () {
      if (i >= rest.length) { openList(); return; }
      var it = rest[i++];
      var st = D();
      if (!st) { next(); return; }
      st.get(it.i).then(function (b) {
        if (!b || !b.size) { it.lo = 0; touch(true); next(); return; }
        sendThen(it, b, next);
      })['catch'](next);
    };
    next();
  }

  /*@3.AUNJ.12*/
  /*@3.AUNJ.101*/
  function linkOne(it) {
    var refId = it.i;
    if (urls[refId]) return Promise.resolve(urls[refId]);
    var st = D();
    /*@3.AUNJ.21*/
    if (!it.aup && it.lo && st) {
      return st.get(refId).then(function (b) {
        if (!b || !b.size) throw new Error('gone');
        urls[refId] = URL.createObjectURL(b);
        return urls[refId];
      });
    }
    if (it.gd && !it.aup) {
      return new Promise(function (ok, no) {
        pullDrive(refId, function (blob) {
          if (!blob) { no(new Error('gone')); return; }
          urls[refId] = URL.createObjectURL(blob);
          ok(urls[refId]);
        });
      });
    }
    var f = F();
    if (!f) return Promise.reject(new Error('gone'));
    return f.link(refId).then(function (l) { urls[refId] = l.url; return l.url; });
  }

  function play_(refId, row) {
    var slot = row.querySelector('.nrec-row-p');
    if (!slot) return;
    var part = partsOf(refId);
    if (!part.length) return;
    var ready = part.every(function (x) { return !!urls[x.i]; });
    if (ready) {
      mountAudio(slot, part.map(function (x) { return urls[x.i]; }), part);
      return;
    }
    slot.innerHTML = '<span class="nfo-dim">' + esc(L('يُجهَّز…', 'Preparing…')) + '</span>';
    var out = [], k = 0;
    var next = function () {
      if (k >= part.length) { mountAudio(slot, out, part); return; }
      linkOne(part[k++]).then(function (u) { out.push(u); next(); }, function () {
        slot.innerHTML = '<span class="nfo-dim">' +
          esc(part.length > 1
            ? L('تعذّر جلبُ أحدِ المقاطع.', 'One of the parts could not be fetched.')
            : L('تعذّر جلبُ التسجيل.', 'The recording could not be fetched.')) + '</span>';
      });
    };
    next();
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

  /*@3.AUNJ.90*/
  var MARK_GAP_S = 4;

  function moments(part) {
    var out = [], base = 0, last = -99;
    part.forEach(function (it) {
      var raw = it.mk || [];
      var secs = Math.max(1, Math.round((it.ms || 0) / 1000));
      raw.forEach(function (m) {
        var at = Number(m && m[0]);
        if (!(at >= 0) || at > secs) return;
        var abs = base + at;
        if (abs - last < MARK_GAP_S) return;
        last = abs;
        if (out.length < 60) out.push({ at: abs, page: (m[1] | 0) + 1 });
      });
      base += secs;
    });
    return out;
  }

  function markBar(part, total) {
    var m = moments(part);
    if (!m.length || !(total > 0)) return '';
    return '<span class="nrec-pl-mk">' + m.map(function (x) {
      var pc = Math.max(0, Math.min(100, x.at / total * 100));
      return '<button type="button" class="nrec-mk" style="--at:' + pc.toFixed(2) + '%"' +
        ' data-at="' + x.at + '" aria-label="' +
        esc(L('انتقلْ إلى ', 'Jump to ') + clock(x.at) +
            L(' — رسمٌ في صفحة ', ' \u2014 ink on page ') + x.page) + '"' +
        ' title="' + esc(clock(x.at) + ' \u00b7 ' +
                         L('صفحة ', 'page ') + x.page) + '"></button>';
    }).join('') + '</span>';
  }

  /*@3.AUNJ.79*/
  /*@3.AUNJ.99*/
  function mountAudio(slot, srcs, part) {
    var list = [].concat(srcs || []);
    var pcs = [].concat(part || []);
    if (!list.length) return;
    var durs = pcs.map(function (x) { return Math.max(0, (Number(x && x.ms) || 0) / 1000); });
    while (durs.length < list.length) durs.push(0);
    var base = [], run = 0, i;
    for (i = 0; i < list.length; i++) { base.push(run); run += durs[i]; }
    var total = run;

    slot.innerHTML =
      '<div class="nrec-pl">' +
        '<button type="button" class="nrec-pl-b nrec-pl-go" aria-label="' +
          esc(L('تشغيل', 'Play')) + '"' +
          ' data-ar-title="تشغيل" data-en-title="Play">' +
          '<i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
        '<input type="range" class="nrec-pl-seek" value="0" min="0" max="1000"' +
          ' step="1" aria-label="' + esc(L('موضعُ التشغيل', 'Playback position')) + '"' +
          ' data-ar-title="موضعُ التشغيل" data-en-title="Playback position">' +
        markBar(pcs, total) +
        '<span class="nrec-pl-t">0:00 / 0:00</span>' +
        '<button type="button" class="nrec-pl-x" aria-label="' +
          esc(L('سرعةُ التشغيل', 'Playback speed')) + '"' +
          ' data-ar-title="سرعةُ التشغيل" data-en-title="Playback speed">' +
          esc(rateTxt(rateGet())) + '</button>' +
      '</div>';

    var a = new Audio();
    a.preload = 'metadata';
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
    var ci = -1;
    var want = 0;
    var goOn = false;

    function span() {
      if (total > 0) return total;
      return isFinite(a.duration) ? a.duration : 0;
    }
    function at() {
      return (base[ci] || 0) + (isFinite(a.currentTime) ? a.currentTime : 0);
    }
    function load(k, off, play) {
      if (k < 0 || k >= list.length) return;
      goOn = !!play;
      if (ci === k) {
        try { a.currentTime = off || 0; } catch (e) {}
        if (play) a.play()['catch'](function () {});
        return;
      }
      ci = k;
      want = off || 0;
      a.src = list[k];
      a.load();
    }
    a.addEventListener('loadedmetadata', function () {
      if (want) { try { a.currentTime = want; } catch (e) {} want = 0; }
      if (goOn) { goOn = false; a.play()['catch'](function () {}); }
      time();
    });
    function seekTo(sec) {
      var s = Math.max(0, sec);
      var k = 0, off = s;
      for (var q = list.length - 1; q >= 0; q--) {
        if (s >= base[q]) { k = q; off = s - base[q]; break; }
      }
      load(k, off, !a.paused || goOn);
    }
    function icon() {
      go.innerHTML = '<i class="fa-solid fa-' + (a.paused ? 'play' : 'pause') +
                     '" aria-hidden="true"></i>';
    }
    function time() {
      var d = span();
      lbl.textContent = clock(at()) + ' / ' + clock(d);
      if (!held && d) seek.value = String(Math.round(at() / d * 1000));
    }
    go.addEventListener('click', function () {
      if (a.paused) { a.play()['catch'](function () {}); } else { a.pause(); }
    });
    a.addEventListener('play', icon);
    a.addEventListener('pause', icon);
    a.addEventListener('timeupdate', time);
    a.addEventListener('ended', function () {
      if (ci + 1 < list.length) { load(ci + 1, 0, true); return; }
      icon();
    });
    seek.addEventListener('input', function () { held = true; });
    seek.addEventListener('change', function () {
      held = false;
      var d = span();
      if (d) seekTo(d * (Number(seek.value) / 1000));
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
      var k2 = SPEEDS.indexOf(a.playbackRate);
      var nv = SPEEDS[(k2 < 0 ? SPEEDS.indexOf(1) : k2) + 1] || SPEEDS[0];
      a.playbackRate = nv; rateSet(nv); xb.textContent = rateTxt(nv);
    });
    Array.prototype.forEach.call(pl.querySelectorAll('.nrec-mk'), function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        goOn = true;
        seekTo(Number(b.getAttribute('data-at')) || 0);
        time();
      });
    });
    icon();
    load(0, 0, true);
    time();
    slot._audio = a;
    live = a;
  }

  /*@3.AUNJ.81*/
  var live = null;

  function typing(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    var n = (el.tagName || '').toLowerCase();
    return n === 'input' || n === 'textarea' || n === 'select' || n === 'button';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' && e.key !== 'Spacebar') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!live || !live.src) return;
    if (typing(e.target) || typing(document.activeElement)) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return;
    e.preventDefault();
    if (live.paused) { live.play()['catch'](function () {}); } else { live.pause(); }
  });

  function remove(refId, row, alsoDrive) {
    var f = F();
    var st = D();
    var gd = GDx();
    /*@3.AUNJ.102*/
    var part = partsOf(refId);
    if (row && row.parentNode) row.parentNode.removeChild(row);
    part.forEach(function (it) {
      var id = it.i;
      dropItem(id);
      if (urls[id]) { try { URL.revokeObjectURL(urls[id]); } catch (e0) {} }
      delete urls[id];
      if (f && it.aup) { try { f.remove(id); } catch (e) {} }
      if (alsoDrive && it.gd && gd && gd.trash) { try { gd.trash(it.gd); } catch (e2) {} }
      /*@3.AUNJ.22*/
      if (st && it.lo) st.drop(id)['catch'](function () {});
    });
    if (panel && view === 'list') drawList();
  }

  /*@3.AUNJ.13*/
  /*@3.AUNJ.47*/
  function toggle() {
    /*@3.AUNJ.86*/
    if (rec) {
      if (panel && panel.parentNode) { close(); return; }
      dockOpen(!open1);
      return;
    }
    /*@3.AUNJ.52*/
    if (panel && panel.parentNode) {
      if (busy) return;
      close();
      return;
    }
    render();
  }

  function wire() {
    resumeSoon();
    var b = micBtn();
    if (!b || b.getAttribute('data-wired')) return;
    b.setAttribute('data-wired', '1');
    b.addEventListener('click', toggle);
  }

  /*@3.AUNJ.93*/
  var resumeT = 0;

  function resumePending() {
    if (rec || busy) return;
    var want = homePref();
    if (want !== 'us' && want !== 'gd') return;
    var rest = items().filter(function (x) { return !x.aup && !x.gd && x.lo; });
    if (!rest.length) return;
    var it = rest[0];
    var st = D();
    if (!st) return;
    var free = stayAwake();
    st.get(it.i).then(function (b) {
      if (!b || !b.size) { it.lo = 0; touch(true); free(); return; }
      sendThen(it, b, function () {
        free();
        if (panel && view === 'list' && !rec && !busy) drawList();
        badge();
        resumeSoon();
      }, true);
    })['catch'](function () { free(); });
  }

  function resumeSoon() {
    clearTimeout(resumeT);
    resumeT = setTimeout(resumePending, 1500);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') resumeSoon();
  });

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
    openList: openList,
    shutList: shutList,
    sync: sync,
    recording: function () { return !!rec; }
  };
})();
