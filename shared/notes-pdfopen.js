;(function () {
  'use strict';

  var MAX_PAGES = 900;
  var SOFT_BYTES = 150 * 1024 * 1024;
  var HARD_BYTES = 500 * 1024 * 1024;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(a, b) { return isAr() ? a : b; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function size(n) {
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = Number(n) || 0;
    while (v >= 1024 && i < 3) { v /= 1024; i++; }
    return (i ? v.toFixed(1) : String(Math.round(v))) + ' ' + u[i];
  }

  function num(txt) {
    return '<span class="npo-num">' + esc(txt) + '</span>';
  }

  function pickFile() {
    return new Promise(function (ok) {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/pdf,.pdf';
      inp.className = 'npo-file';
      document.body.appendChild(inp);
      var done = false;
      function fin(f) {
        if (done) return;
        done = true;
        if (inp.parentNode) inp.parentNode.removeChild(inp);
        ok(f || null);
      }
      inp.addEventListener('change', function () { fin(inp.files && inp.files[0]); });
      inp.addEventListener('cancel', function () { fin(null); });
      /*@3.NOPJ5.2*/
      window.addEventListener('focus', function () {
        setTimeout(function () { if (!inp.files || !inp.files.length) fin(null); }, 600);
      }, { once: true });
      inp.click();
    });
  }

  function parse(file, pass) {
    var V = window.GardenPdfView;
    if (!V) return Promise.reject(new Error('no-view'));
    var url = URL.createObjectURL(file);
    return V.load(url, pass ? { password: pass } : null).then(function (h) {
      return { handle: h, url: url, pages: h.pages };
    }, function (e) {
      try { URL.revokeObjectURL(url); } catch (e2) {}
      throw e;
    });
  }

  /*@3.NOPJ5.14*/
  function locked(e) {
    return !!(e && (e.name === 'PasswordException' || e.code === 1 || e.code === 2));
  }

  function askPass(name, again) {
    return new Promise(function (done) {
      var dlg = document.createElement('dialog');
      dlg.className = 'gsf gsf--snug npo-lock';
      dlg.setAttribute('data-keep-open', '');
      dlg.innerHTML =
        '<div class="gsf-body"><div class="gsf-head">' +
        '<h2 class="gsf-title">' +
        esc(L('هذا الملفُّ محميٌّ بكلمةِ مرور', 'This file is password protected')) + '</h2>' +
        '<p class="gsf-sub">' +
        esc(again
          ? L('كلمةُ المرورِ غيرُ صحيحة — جرّبْ مرّةً أخرى.',
              'That password is not right — try again.')
          : L('اكتبْ كلمةَ مرورِ الملفِّ ليُفتَح. لا تُحفَظ ولا تُرسَل إلى أحد.',
              'Type the file password to open it. It is never stored or sent anywhere.')) +
        '</p>' + (name ? '<p class="gsf-sub"><span class="gsf-code">' + esc(name) + '</span></p>' : '') +
        '<input type="password" class="gsf-in npo-pw" autocomplete="off" ' +
        'aria-label="' + esc(L('كلمةُ مرورِ الملفّ', 'File password')) + '">' +
        '</div></div>' +
        '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="no">' +
        esc(L('إلغاء', 'Cancel')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="go">' +
        esc(L('افتحْ', 'Open')) + '</button>' +
        '</div></div>';
      document.body.appendChild(dlg);
      var inp = dlg.querySelector('.npo-pw');
      function shut(v) {
        try { dlg.close(); } catch (e) {}
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        done(v);
      }
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-a]') : null;
        if (!b) return;
        shut(b.getAttribute('data-a') === 'go' ? (inp.value || '') : null);
      });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); shut(null); });
      if (inp) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); shut(inp.value || ''); }
        });
      }
      try { dlg.showModal(); } catch (e2) { shut(null); }
      if (inp) { try { inp.focus(); } catch (e3) {} }
    });
  }

  /*@3.NOPJ5.15*/
  function unlock(file, tries) {
    var left = tries == null ? 4 : tries;
    var name = (file && file.name) || '';
    var step = function (pass, again) {
      return parse(file, pass).catch(function (e) {
        if (!locked(e) || left-- <= 0) throw e;
        return askPass(name, again).then(function (v) {
          if (v === null) { var q = new Error('cancelled'); q.cancelled = true; throw q; }
          return step(v, true);
        });
      });
    };
    return step('', false);
  }

  function drop(pre) {
    if (!pre) return;
    if (pre.handle && pre.handle.doc) { try { pre.handle.doc.destroy(); } catch (e) {} }
    if (pre.url) { try { URL.revokeObjectURL(pre.url); } catch (e2) {} }
  }

  function spec(r, file, pages) {
    return { h: r.hash, n: (file && file.name) || '', sz: r.size, pg: pages };
  }

  /*@3.NOPJ5.9*/
  function weigh(file) {
    var n = (file && file.size) || 0;
    if (n > HARD_BYTES) return { ok: false, heavy: true, size: n };
    return { ok: true, heavy: n > SOFT_BYTES, size: n };
  }

  function adopt(file, onProgress) {
    var D = window.GardenPdfDoc;
    if (!D) return Promise.reject(new Error('no-doc'));
    var w = weigh(file);
    if (!w.ok) {
      var big = new Error('too-large');
      big.bytes = w.size;
      return Promise.reject(big);
    }
    return D.hash(file, onProgress).then(function (r) {
      return unlock(file).then(function (pre) {
        if (pre.pages > MAX_PAGES) {
          drop(pre);
          var e = new Error('too-many-pages');
          e.pages = pre.pages;
          throw e;
        }
        return D.has(r.hash).then(function (had) {
          if (had) return { spec: spec(r, file, pre.pages), pre: pre, stored: true };
          return D.put(r.hash, file, { name: file.name || '' }).then(function (okd) {
            return { spec: spec(r, file, pre.pages), pre: pre, stored: !!okd };
          });
        });
      });
    });
  }

  function open(host, want, o) {
    o = o || {};
    var st = { dead: false, view: null, url: null, h: null, scale: 1, zm: 'page', page: 1, total: 0,
               find: null,
               mode: (o.mode === 2 || o.mode === 4) ? o.mode : 1,
               order: o.order === 'col' ? 'col' : 'row',
               side: o.side === 'rtl' ? 'rtl' : (o.side === 'ltr' ? 'ltr' : ''),
               flow: o.flow === 'page' ? 'page' : 'cont' };
    var sp = want || {};

    host.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'npo';
    var stage = document.createElement('div');
    stage.className = 'npo-stage';
    root.appendChild(stage);
    host.appendChild(root);

    function scroller() { return o.scroller || host; }

    function card(icon, title, body, acts) {
      stage.innerHTML =
        '<div class="npo-card">' +
        '<i class="fa-solid ' + esc(icon) + ' npo-card-i" aria-hidden="true"></i>' +
        '<p class="npo-card-t" dir="auto">' + title + '</p>' +
        (body ? '<p class="npo-card-b">' + body + '</p>' : '') +
        (acts || '') + '</div>';
    }

    function busy(msg) {
      stage.innerHTML =
        '<div class="na-opening" role="status">' +
        '<span class="na-opening-spin" aria-hidden="true"></span>' +
        '<p class="npo-msg">' + esc(msg) + '</p></div>';
    }

    function step(pct) {
      var p = stage.querySelector('.npo-msg');
      if (p) p.textContent = L('تُقرأ بصمةُ الملفّ… ', 'Reading the file fingerprint… ') + pct + '%';
    }

    /*@3.NOPJ5.10*/
    function keepNote(why) {
      if (why === 'insecure') {
        return L('لن يُحفَظ هذا الملفُّ على هذا الجهاز لأن الصفحةَ مفتوحةٌ باتّصالٍ غيرِ آمنٍ (‏http). ' +
                 'افتحِ الموقعَ بعنوانه الرسميِّ ليبقى الملفُّ محفوظاً.',
                 'This file will not be kept on this device because the page is open over an ' +
                 'insecure connection (http). Open the site at its official address to keep it.');
      }
      return L('تعذّر حفظُ الملفِّ على هذا الجهاز — المتصفّحُ لا يسمح بالتخزين هنا. ' +
               'سيُطلَب منك اختيارُه في كلِّ مرّة.',
               'The file could not be kept on this device — the browser is blocking storage here. ' +
               'You will be asked to pick it every time.');
    }

    function ask(note) {
      card('fa-file-lines',
        esc(sp.n || L('ملفُّ PDF', 'PDF file')),
        (note ? esc(note) + '<br>' : '') +
        esc(L('هذا الملفُّ ليس على هذا الجهاز — اخترْه من جهازك ليُفتح.',
              'This file is not on this device — pick it to open it.')) +
        (sp.sz ? '<br>' + num(size(sp.sz)) +
          (sp.pg ? ' · ' + num(String(sp.pg)) + ' ' + esc(L('صفحة', 'pages')) : '') : ''),
        '<button type="button" class="gsf-btn gsf-btn--go npo-pick">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
        esc(L('اخترِ الملفّ', 'Choose the file')) + '</button>');
      var b = stage.querySelector('.npo-pick');
      if (b) b.addEventListener('click', take);
      if (!note && window.GardenPdfDoc) {
        window.GardenPdfDoc.available().then(function (a) {
          if (st.dead || a.ok) return;
          var el = stage.querySelector('.npo-card-b');
          if (el) {
            el.insertAdjacentHTML('beforeend',
              '<span class="npo-warnline"><i class="fa-solid fa-triangle-exclamation" ' +
              'aria-hidden="true"></i> ' + esc(keepNote(a.why)) + '</span>');
          }
        });
      }
    }

    function fail(msg) {
      card('fa-triangle-exclamation', esc(msg), '',
        '<button type="button" class="gsf-btn npo-pick">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
        esc(L('اخترْ ملفاً آخر', 'Pick another file')) + '</button>');
      var b = stage.querySelector('.npo-pick');
      if (b) b.addEventListener('click', take);
    }

    function tooMany(n) {
      return L('هذا الملفُّ ' + n + ' صفحةً، والحدُّ المدعوم ' + MAX_PAGES + '.',
               'This file has ' + n + ' pages; the supported limit is ' + MAX_PAGES + '.');
    }

    function broken() {
      return L('تعذّر فتحُ هذا الملفّ — قد يكون تالفاً.',
               'Could not open this file — it may be damaged.');
    }

    function sealed() {
      return L('هذا الملفُّ محميٌّ بكلمةِ مرور، ولم تُقبَل الكلمةُ التي أُدخلت.',
               'This file is password protected, and the password entered was not accepted.');
    }

    /*@3.NOPJ5.1*/
    function warn(got, file, pre) {
      var dlg = document.createElement('dialog');
      dlg.className = 'gsf gsf--snug npo-warn';
      dlg.setAttribute('data-keep-open', '');
      dlg.innerHTML =
        '<div class="gsf-body">' +
        '<div class="gsf-head"><h2 class="gsf-title">' +
        esc(L('هذا ليس الملفَّ نفسَه', 'This is not the same file')) + '</h2>' +
        '<p class="gsf-sub">' +
        esc(L('بصمةُ الملفِّ الذي اخترتَه تخالف بصمةَ الملفِّ المرتبطِ بهذه الوثيقة. ' +
              'قد يكون ملفاً آخر، أو النسخةَ نفسَها وقد عُدِّلت.',
              'The fingerprint of the file you picked differs from the one bound to this ' +
              'document. It may be a different file, or the same one after an edit.')) +
        '</p><p class="gsf-sub npo-hashes">' +
        esc(L('المرتبطة: ', 'Bound: ')) + '<span class="gsf-code">' +
        esc(String(sp.h || '').slice(0, 12)) + '</span><br>' +
        esc(L('المختارة: ', 'Picked: ')) + '<span class="gsf-code">' +
        esc(String(got.hash || '').slice(0, 12)) + '</span>' +
        '</p></div></div>' +
        '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="no">' +
        esc(L('ملفٌّ آخر — ألغِ', 'Different file — cancel')) + '</button>' +
        '<button type="button" class="gsf-btn" data-a="once">' +
        esc(L('افتحه هذه المرّة فقط', 'Open it just this once')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="link">' +
        esc(L('هو نفسه وقد حُدِّث — اربطْ به', 'Same file, updated — bind to it')) + '</button>' +
        '</div></div>';
      document.body.appendChild(dlg);
      function close(a) {
        try { dlg.close(); } catch (e) {}
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        if (st.dead) { drop(pre); return; }
        if (a === 'no') { drop(pre); ask(); return; }
        if (a === 'link' && o.onRelink) {
          sp = spec(got, file, pre.pages);
          o.onRelink(sp, (want && want.h) || null);
        }
        show(file, pre);
      }
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-a]') : null;
        if (b) close(b.getAttribute('data-a'));
      });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); close('no'); });
      try { dlg.showModal(); } catch (e2) { close('once'); }
    }

    function take() {
      pickFile().then(function (file) {
        if (!file || st.dead) return;
        var D = window.GardenPdfDoc;
        if (!D) { fail(broken()); return; }
        busy(L('تُقرأ بصمةُ الملفّ…', 'Reading the file fingerprint…'));
        D.hash(file, function (at, of) {
          if (of) step(Math.round(at * 100 / of));
        }).then(function (r) {
          if (st.dead) return null;
          return unlock(file).then(function (pre) {
            if (st.dead) { drop(pre); return null; }
            if (pre.pages > MAX_PAGES) { drop(pre); fail(tooMany(pre.pages)); return null; }
            D.put(r.hash, file, { name: file.name || '' });
            if (sp.h && r.hash !== sp.h) { warn(r, file, pre); return null; }
            if (!sp.h && o.onRelink) {
              sp = spec(r, file, pre.pages);
              o.onRelink(sp, null);
            }
            show(file, pre);
            return null;
          });
        })['catch'](function (e) {
          if (st.dead) return;
          if (e && e.cancelled) { ask(); return; }
          fail(locked(e) ? sealed() : broken());
        });
      });
    }

    function show(file, pre) {
      busy(L('يُفتح الملفّ…', 'Opening the file…'));
      var p = pre ? Promise.resolve(pre) : unlock(file);
      p.then(function (h) {
        if (st.dead) { drop(h); return; }
        if (h.pages > MAX_PAGES) { drop(h); fail(tooMany(h.pages)); return; }
        st.url = h.url;
        st.h = h.handle;
        st.total = h.pages;
        build();
      }, function (e) {
        if (st.dead) return;
        if (e && e.cancelled) { ask(); return; }
        fail(locked(e) ? sealed() : broken());
      });
    }

    function build() {
      stage.innerHTML = '';
      settle(function () {
        if (st.dead) return;
        var V = window.GardenPdfView;
        /*@3.NOPJ5.3*/
        /*@3.NOPJ5.7*/
        var want = (o.pos && o.pos.z) || 'page';
        st.zm = (want === 'page' || want === 'fit') ? want : '';
        var seed = st.zm ? V.fitScale(st.h, room(), st.mode, tall(), st.zm === 'page')
                         : Promise.resolve(want > 0 ? want : 1);
        seed.then(function (n) {
          if (st.dead) return null;
          st.scale = clamp(n);
          makeInk();
          return V.mount(stage, st.h, {
            scroller: scroller(),
            scale: st.scale,
            mode: st.mode,
            order: st.order,
            flow: st.flow,
            side: st.side || guessSide(),
            stamp: o.stamp || null,
            onAsk: o.onAsk || null,
            onFocus: onFocus,
            /*@3.NOPJ5.20*/
            onLayer: function (n, el, geo) {
              if (st.ink) st.ink.layer(n, el, geo);
              if (o.onLayer) o.onLayer(n, el, geo);
            },
            offLayer: function (n, el) {
              if (st.ink) st.ink.off(n);
              if (o.offLayer) o.offLayer(n, el);
            },
            onText: function (n, td) { if (st.find) st.find.paint(n, td); },
            onPinch: function (n) {
              /*@3.NOPJ5.18*/
              /*@3.NOPJ5.27*/
              if (st.fitT) { clearTimeout(st.fitT); st.fitT = 0; }
              st.zm = ''; st.scale = n;
              save();
              if (o.onZoom) o.onZoom(n, '');
            },
            onView: function (p) { st.page = p; tell(); },
            /*@3.NOPJ5.25*/
            onTapZoom: tapZoom
          });
        }).then(function (v) {
          if (!v) return;
          if (st.dead) { try { v.destroy(); } catch (e) {} return; }
          st.view = v;
          if (st.ink) st.ink.setView(v);
          var pos = o.pos || null;
          if (pos && (pos.p > 1 || pos.f)) v.goTo(pos.p || 1, pos.f || 0);
          makeFind();
          watch();
          tell();
          if (o.onReady) o.onReady({ pages: st.total, spec: sp, scale: st.scale, zoom: st.zm });
        });
      });
    }

    /*@3.NOPJ5.5*/
    function settle(go) {
      var tries = 0;
      var tick = function () {
        if (st.dead) return;
        if (room() > 200 || ++tries > 10) { go(); return; }
        st.settleT = setTimeout(tick, 40);
      };
      tick();
    }

    function clamp(n) {
      if (!(n > 0)) return 1;
      return n < 0.25 ? 0.25 : (n > 4 ? 4 : n);
    }

    function room() {
      if (o.room) {
        var r = o.room();
        if (r > 40) return r;
      }
      var s = scroller();
      var w = (s && s.clientWidth) || 0;
      if (!w) return 0;
      var cs = getComputedStyle(s);
      return Math.max(0, w - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    }

    function tell() {
      if (o.onPage) o.onPage(st.page, st.total);
    }

    function watch() {
      var s = scroller();
      st.onScroll = function () {
        if (st.posT) clearTimeout(st.posT);
        st.posT = setTimeout(save, 500);
      };
      (s === document.scrollingElement || s === document.body ? window : s)
        .addEventListener('scroll', st.onScroll, { passive: true });
      if (window.ResizeObserver) {
        st.ro = new ResizeObserver(function () {
          if (!st.zm || !st.view) return;
          if (st.fitT) clearTimeout(st.fitT);
          st.fitT = setTimeout(refit, 180);
        });
        try { st.ro.observe(host); } catch (e) {}
      }
    }

    /*@3.NOPJ5.4*/
    function save() {
      if (st.dead || !st.view || !o.onPos) return;
      var w = st.view.where();
      o.onPos({ p: w.p, f: Math.round(w.f * 1000) / 1000,
                z: st.zm || st.scale, m: st.mode, r: st.order, fl: st.flow,
                sd: st.side || '' });
    }

    function destroy() {
      st.dead = true;
      if (st.posT) { clearTimeout(st.posT); st.posT = 0; }
      if (st.fitT) { clearTimeout(st.fitT); st.fitT = 0; }
      if (st.settleT) { clearTimeout(st.settleT); st.settleT = 0; }
      if (st.onScroll) {
        var s = scroller();
        (s === document.scrollingElement || s === document.body ? window : s)
          .removeEventListener('scroll', st.onScroll);
        st.onScroll = null;
      }
      if (st.ro) { try { st.ro.disconnect(); } catch (e) {} st.ro = null; }
      if (st.ink) {
        try { st.ink.flushAll(); } catch (e6) {}
        try { st.ink.destroy(); } catch (e7) {}
        st.ink = null;
      }
      if (st.find) { try { st.find.destroy(); } catch (e0) {} st.find = null; }
      if (st.view) { try { st.view.destroy(); } catch (e2) {} st.view = null; }
      else if (st.h && st.h.doc) { try { st.h.doc.destroy(); } catch (e3) {} }
      st.h = null;
      if (st.url) { try { URL.revokeObjectURL(st.url); } catch (e4) {} st.url = null; }
      var d = document.querySelector('dialog.npo-warn');
      if (d) { try { d.close(); } catch (e5) {} if (d.parentNode) d.parentNode.removeChild(d); }
    }

    if (o.pre) show(null, o.pre);
    else if (!sp.h || !window.GardenPdfDoc) ask();
    else {
      busy(L('يُفتح الملفّ…', 'Opening the file…'));
      window.GardenPdfDoc.get(sp.h).then(function (f) {
        if (st.dead) return;
        if (f) show(f, null);
        else ask();
      }, function () { if (!st.dead) ask(); });
    }

    /*@3.NOPJ5.6*/
    function apply(n, at) {
      if (st.dead || !st.view || !(n > 0)) return st.scale;
      st.scale = clamp(n);
      st.view.setScale(st.scale, at || null);
      save();
      if (o.onZoom) o.onZoom(st.scale, st.zm);
      return st.scale;
    }

    /*@3.NOPJ5.11*/
    function refit(mode) {
      if (st.dead || !st.view) return Promise.resolve(st.scale);
      if (mode === 'page' || mode === 'fit') st.zm = mode;
      else if (!st.zm) st.zm = 'page';
      /*@3.NOPJ5.28*/
      return window.GardenPdfView
        .fitScale(st.h, room(), st.mode, tall(), st.zm === 'page', st.view.grid())
        .then(function (n) { return apply(n, { fit: 1 }); });
    }

    /*@3.NOPJ5.22*/
    function tall() {
      var s = scroller();
      var h = (s && s.clientHeight) || 0;
      if (!h) return 0;
      var vv = window.visualViewport;
      if (vv && s.getBoundingClientRect) {
        var top = s.getBoundingClientRect().top;
        var seen = vv.height - Math.max(0, top - (vv.offsetTop || 0));
        if (seen > 80 && seen < h) h = seen;
      }
      var cs = getComputedStyle(s);
      return Math.max(0, h - (parseFloat(cs.paddingTop) || 0) -
        (parseFloat(cs.paddingBottom) || 0) - 14);
    }

    /*@3.NOPJ5.12*/
    function guessSide() {
      if (st.side) return st.side;
      try {
        return (localStorage.getItem('garden_lang') || 'ar') === 'ar' ? 'rtl' : 'ltr';
      } catch (e) { return 'rtl'; }
    }

    function setSide(v) {
      st.side = v === 'rtl' ? 'rtl' : 'ltr';
      if (st.view) st.view.setSide(st.side);
      save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.side;
    }

    /*@3.NOPJ5.21*/
    function makeInk() {
      var K = window.GardenPdfInk;
      if (!K || st.ink) return null;
      st.ink = K.create({
        id: sp.h || '',
        view: st.view,
        t0: Date.now(),
        onState: function (s2) { if (o.onInk) o.onInk(s2); },
        onZoom: function (z) { setScale(z); },
        onFit: function () { refit('page'); },
        onExpand: function (on) { if (o.onExpand) o.onExpand(on); },
        onDirty: function () { if (o.onInkDirty) o.onInkDirty(); },
        /*@3.NOPJ5.23*/
        onGesture: function (phase, g) { if (o.onInkGesture) o.onInkGesture(phase, g); }
      });
      return st.ink;
    }

    /*@3.NOPJ5.13*/
    function makeFind() {
      var F = window.GardenPdfFind;
      if (!F || !st.h || st.find) return;
      st.find = F.create({
        handle: st.h,
        view: st.view,
        onState: function (s2) { if (o.onFind) o.onFind(s2); }
      });
      st.find.scan(st.page);
    }

    /*@3.NOPJ5.8*/
    function setView(mode, order) {
      var was = st.mode + st.order;
      st.mode = (mode === 2 || mode === 4) ? mode : 1;
      st.order = order === 'col' ? 'col' : 'row';
      if (!st.view) return st.mode;
      st.view.setView(st.mode, st.order);
      /*@3.NOPJ5.19*/
      if (was !== st.mode + st.order) refit('page');
      else if (st.zm) refit(); else save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.mode;
    }

    /*@3.NOPJ5.17*/
    /*@3.NOPJ5.26*/
    function onFocus(on, page, was) {
      if (!st.view) return;
      if (on) {
        st.back = { mode: st.mode, order: st.order, zm: st.zm, scale: st.scale,
                    flow: st.flow, where: (was && was.where) || st.view.where() };
        st.mode = 1;
        st.view.setView(1, st.order);
        return window.GardenPdfView
          .fitScale(st.h, room(), 1, tall(), false)
          .then(function (n2) {
            if (st.dead || !st.view) return;
            st.zm = '';
            apply(n2, (was && was.grip) ? { grip: was.grip } : { keep: 1 });
            if (!(was && was.grip)) st.view.goTo(page, 0);
            tell();
            if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
          });
      }
      var b = st.back || { mode: 2, order: st.order, zm: 'page',
                           scale: st.scale, flow: st.flow, where: null };
      st.back = null;
      st.mode = b.mode;
      st.view.setView(b.mode, b.order);
      st.zm = b.zm;
      apply(b.scale, { keep: 1 });
      if (b.where) st.view.goTo(b.where.p, b.where.f);
      else st.view.goTo(page, 0);
      tell();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
    }

    function focused() { return !!(st.view && st.view.focus); }

    function unfocus() { return st.view ? st.view.unfocus() : false; }

    /*@3.NOPJ5.16*/
    function setFlow(f) {
      var was = st.flow;
      st.flow = f === 'page' ? 'page' : 'cont';
      if (st.view) st.view.setFlow(st.flow);
      if (st.flow === 'page' && was !== 'page') refit('page');
      save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.flow;
    }

    function step(dir) {
      if (!st.view) return st.page;
      return st.view.step(dir > 0 ? 1 : -1);
    }

    function setScale(n, at) {
      st.zm = '';
      return apply(n, at || null);
    }

    /*@3.NOPJ5.24*/
    function tapZoom(cx, cy) {
      if (st.dead || !st.view) return st.scale;
      if (st.zm) {
        var want = Math.min(4, Math.max((st.scale || 1) * 2.4, 1));
        if (want <= (st.scale || 1) * 1.05) want = Math.min(4, (st.scale || 1) * 2);
        return setScale(want, { cx: cx, cy: cy });
      }
      refit('page');
      return st.scale;
    }

    return {
      destroy: destroy,
      view: function () { return st.view; },
      ready: function () { return !!st.view; },
      page: function () { return st.page; },
      pages: function () { return st.total; },
      scale: function () { return st.scale; },
      zoomMode: function () { return st.zm; },
      isFit: function () { return !!st.zm; },
      side: function () { return st.side || guessSide(); },
      focused: focused,
      unfocus: unfocus,
      selectPage: function (n) { return st.view ? st.view.selectPage(n) : false; },
      setSide: setSide,
      find: function () { return st.find; },
      ink: function () { return st.ink; },
      draw: function (on) {
        if (!st.ink) return false;
        return st.ink.arm(on === undefined ? !st.ink.armed : !!on);
      },
      drawing: function () { return !!(st.ink && st.ink.armed); },
      goTo: function (n, f) { if (st.view) st.view.goTo(n, f || 0); return st.page; },
      step: step,
      mode: function () { return st.mode; },
      order: function () { return st.order; },
      flow: function () { return st.flow; },
      setView: setView,
      setFlow: setFlow,
      refit: refit,
      setScale: setScale,
      spec: function () { return sp; },
      pick: take
    };
  }

  window.GardenPdfOpen = {
    unlock: unlock,
    MAX_PAGES: MAX_PAGES,
    SOFT_BYTES: SOFT_BYTES,
    HARD_BYTES: HARD_BYTES,
    size: size,
    weigh: weigh,
    pickFile: pickFile,
    adopt: adopt,
    parse: parse,
    drop: drop,
    open: open
  };
})();
