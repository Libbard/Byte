;(function () {
  'use strict';

  function i18n(node) {
    if (node && window.Garden && Garden.localize) {
      try { Garden.localize(node); } catch (e) {}
    }
    return node;
  }

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var TOOLS = [
    { k: 'pen',   icon: 'fa-pen',          ar: 'قلم',        en: 'Pen' },
    { k: 'hi',    icon: 'fa-highlighter',  ar: 'فسفوري',     en: 'Highlighter' },
    { k: 'era',   icon: 'fa-eraser',       ar: 'ممحاة',      en: 'Eraser' },
    { k: 'sel',   icon: 'fa-arrow-pointer', ar: 'تحديد',     en: 'Select' },
    { k: 'lasso', icon: 'fa-draw-polygon', ar: 'لاسو',       en: 'Lasso',
      html: (window.GardenNotesIcons || {}).lasso },
    { k: 'hand',  icon: 'fa-hand',         ar: 'يد للتحريك', en: 'Pan' }
  ];

  var SHAPES = [
    { k: 'rect', icon: 'fa-square',        ar: 'مستطيل', en: 'Rectangle' },
    { k: 'ell',  icon: 'fa-circle',        ar: 'دائرة',  en: 'Ellipse' },
    { k: 'line', icon: 'fa-minus',         ar: 'خط',     en: 'Line' },
    { k: 'arr',  icon: 'fa-arrow-right-long', ar: 'سهم', en: 'Arrow' }
  ];

  var NIBS = [
    { k: 'round',  ar: 'مدوّر',  en: 'Round' },
    { k: 'fine',   ar: 'رفيع',   en: 'Fine' },
    { k: 'marker', ar: 'ثابت',   en: 'Marker' },
    { k: 'flat',   ar: 'مشطوف',  en: 'Chisel' }
  ];

  var WIDTHS = [1.2, 2.4, 4, 7, 12];

  var TONES = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky',
               'lime', 'orange', 'red', 'pink', 'teal', 'indigo'];

  var PIN_KEY = 'garden_ink_pins';

  function pins() {
    try {
      var a = JSON.parse(localStorage.getItem(PIN_KEY) || 'null');
      if (Array.isArray(a) && a.length) return a.slice(0, 6);
    } catch (e) {}
    return ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky'];
  }
  function setPins(a) {
    try { localStorage.setItem(PIN_KEY, JSON.stringify(a.slice(0, 6))); } catch (e) {}
  }

  function hexOf(t) {
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '#888';
  }

  function tb(k, icon, ar, en, group, html) {
    return '<button type="button" class="nc-b" data-' + group + '="' + k + '"' +
      ' aria-label="' + esc(L(ar, en)) + '" aria-pressed="false"' +
      ' data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' +
      (html || '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>') + '</button>';
  }

  function Bar(host, canvas) {
    this.host = host;
    this.cv = canvas;
    this.build();
    this.bind();
    this.sync(canvas ? {
      tool: canvas.tool, color: canvas.color, width: canvas.width,
      nib: canvas.nib, zoom: canvas.cam.z, selection: 0,
      canUndo: false, canRedo: false, expanded: false
    } : null);
  }

  Bar.prototype.build = function () {
    var h = '';
    h += '<div class="nc-grp">' + TOOLS.map(function (t) {
      return tb(t.k, t.icon, t.ar, t.en, 'tool', t.html);
    }).join('') + '</div>';

    h += '<div class="nc-grp">' +
      '<button type="button" class="nc-b" data-pop="shape" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('أشكال', 'Shapes')) + '"' +
      ' data-ar-title="أشكال" data-en-title="Shapes">' +
      '<i class="fa-solid fa-shapes" aria-hidden="true"></i></button>' +
      '</div>';

    h += '<div class="nc-grp nc-pins" data-role="pins"></div>';

    h += '<div class="nc-grp">' +
      '<button type="button" class="nc-b nc-size" data-pop="size" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('سماكة القلم', 'Pen size')) + '"' +
      ' data-ar-title="سماكة القلم" data-en-title="Pen size">' +
      '<span class="nc-dot" data-role="size-dot"></span></button>' +
      '<button type="button" class="nc-b" data-pop="adv" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('إعدادات متقدّمة', 'Advanced settings')) + '"' +
      ' data-ar-title="إعدادات متقدّمة" data-en-title="Advanced">' +
      '<i class="fa-solid fa-sliders" aria-hidden="true"></i></button>' +
      '</div>';

    h += '<div class="nc-grp">' +
      tb('undo', 'fa-rotate-left', 'تراجع', 'Undo', 'act') +
      tb('redo', 'fa-rotate-right', 'إعادة', 'Redo', 'act') +
      tb('del', 'fa-trash', 'حذف المحدَّد', 'Delete selection', 'act') +
      '</div>';

    h += '<div class="nc-grp nc-grp--end">' +
      '<span class="nc-zoom" data-role="zoom" aria-live="polite"></span>' +
      tb('zoomout', 'fa-magnifying-glass-minus', 'تصغير', 'Zoom out', 'act') +
      tb('zoomin', 'fa-magnifying-glass-plus', 'تكبير', 'Zoom in', 'act') +
      tb('fit', 'fa-crop-simple', 'إعادة العرض', 'Reset view', 'act') +
      tb('expand', 'fa-up-right-and-down-left-from-center', 'ملء الشاشة', 'Full screen', 'act') +
      '</div>';

    this.host.innerHTML = h;
    i18n(this.host);
    this.host.setAttribute('role', 'toolbar');
    this.host.setAttribute('aria-label', L('أدوات الرسم', 'Drawing tools'));
    this.paintPins();
  };

  Bar.prototype.paintPins = function () {
    var box = this.host.querySelector('[data-role="pins"]');
    if (!box) return;
    box.innerHTML = pins().map(function (t) {
      return '<button type="button" class="nc-sw" data-tone="' + t + '"' +
        ' style="--t:' + hexOf(t) + '" aria-label="' + esc(t) + '"' +
        ' aria-pressed="false"></button>';
    }).join('') +
    '<button type="button" class="nc-b" data-pop="tone" aria-haspopup="true" aria-expanded="false"' +
    ' aria-label="' + esc(L('كل الألوان', 'All colours')) + '"' +
    ' data-ar-title="كل الألوان" data-en-title="All colours">' +
    '<i class="fa-solid fa-palette" aria-hidden="true"></i></button>';
  };

  Bar.prototype.sync = function (st) {
    if (!st) return;
    var q = this.host.querySelectorAll('[data-tool]');
    for (var i = 0; i < q.length; i++) {
      q[i].setAttribute('aria-pressed', q[i].getAttribute('data-tool') === st.tool ? 'true' : 'false');
    }
    var sw = this.host.querySelectorAll('[data-tone]');
    for (var j = 0; j < sw.length; j++) {
      sw[j].setAttribute('aria-pressed', sw[j].getAttribute('data-tone') === st.color ? 'true' : 'false');
    }
    var dot = this.host.querySelector('[data-role="size-dot"]');
    if (dot) {
      var d = Math.max(4, Math.min(18, st.width * 1.6));
      dot.style.inlineSize = d + 'px';
      dot.style.blockSize = d + 'px';
      dot.style.background = hexOf(st.color);
    }
    var z = this.host.querySelector('[data-role="zoom"]');
    if (z) z.textContent = Math.round((st.zoom || 1) * 100) + '%';
    var u = this.host.querySelector('[data-act="undo"]');
    if (u) u.disabled = !st.canUndo;
    var r = this.host.querySelector('[data-act="redo"]');
    if (r) r.disabled = !st.canRedo;
    var dl = this.host.querySelector('[data-act="del"]');
    if (dl) dl.disabled = !st.selection;
    var ex = this.host.querySelector('[data-act="expand"] i');
    if (ex) {
      ex.className = 'fa-solid ' + (st.expanded
        ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center');
    }
  };

  Bar.prototype.popHtml = function (kind) {
    if (kind === 'shape') {
      return SHAPES.map(function (s) {
        return '<button type="button" class="nc-pi" data-tool="' + s.k + '">' +
          '<i class="fa-solid ' + s.icon + '" aria-hidden="true"></i><span>' +
          esc(L(s.ar, s.en)) + '</span></button>';
      }).join('');
    }
    if (kind === 'size') {
      return WIDTHS.map(function (w) {
        return '<button type="button" class="nc-pi" data-w="' + w + '">' +
          '<span class="nc-dot" style="inline-size:' + Math.max(4, w * 1.6) + 'px;block-size:' +
          Math.max(4, w * 1.6) + 'px"></span><span>' + w + '</span></button>';
      }).join('');
    }
    if (kind === 'tone') {
      return '<div class="nc-tones">' + TONES.map(function (t) {
        return '<button type="button" class="nc-sw" data-tone="' + t + '" style="--t:' + hexOf(t) +
          '" aria-label="' + esc(t) + '"></button>';
      }).join('') + '</div>' +
      '<p class="nc-hint">' + esc(L('اضغط مطوّلاً على لونٍ لتثبيته في الشريط.',
                                    'Long-press a colour to pin it to the bar.')) + '</p>';
    }
    var nibNow = this.cv ? this.cv.nib : 'round';
    var palm = (window.GardenInkInput ? GardenInkInput.palmMode() : 'auto');
    return '<div class="nc-pop-h">' + esc(L('الريشة', 'Nib')) + '</div>' +
      NIBS.map(function (n) {
        return '<button type="button" class="nc-pi' + (n.k === nibNow ? ' on' : '') +
          '" data-nib="' + n.k + '"><span>' + esc(L(n.ar, n.en)) + '</span></button>';
      }).join('') +
      '<div class="nc-pop-h">' + esc(L('راحة اليد', 'Palm')) + '</div>' +
      [['auto', 'تلقائي', 'Automatic'], ['always', 'ارفض اللمس', 'Reject touch'],
       ['never', 'اليد ترسم', 'Finger draws']].map(function (m) {
        return '<button type="button" class="nc-pi' + (m[0] === palm ? ' on' : '') +
          '" data-palm="' + m[0] + '"><span>' + esc(L(m[1], m[2])) + '</span></button>';
      }).join('') +
      '<p class="nc-hint">' + esc(L(
        'على جهازٍ بلا قلم لا يمكن تمييزُ راحةِ اليد من الإصبع دائماً — بدّل يدوياً إن لزم.',
        'On a pen-less device a palm cannot always be told from a finger — switch manually if needed.')) + '</p>';
  };

  Bar.prototype.openPop = function (kind, anchor) {
    this.closePop();
    var p = document.createElement('div');
    p.className = 'nc-pop nc-pop--' + kind;
    p.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    p.innerHTML = this.popHtml(kind);
    i18n(p);
    document.body.appendChild(p);

    var pad = 8, gap = 6;
    var r = anchor.getBoundingClientRect();
    var pr = p.getBoundingClientRect();
    var vh = window.innerHeight, vw = window.innerWidth;
    var below = vh - r.bottom - gap - pad, above = r.top - gap - pad;
    var top;
    if (pr.height <= below) top = r.bottom + gap;
    else if (pr.height <= above) top = r.top - pr.height - gap;
    else { top = r.bottom + gap; p.style.maxBlockSize = Math.max(below, 140) + 'px'; }
    p.style.insetBlockStart = Math.max(pad, top) + 'px';
    var left = isAr() ? (r.right - pr.width) : r.left;
    p.style.left = Math.max(pad, Math.min(left, vw - pr.width - pad)) + 'px';

    this.pop = p;
    this.popAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');

    var self = this;
    p.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tool],[data-w],[data-tone],[data-nib],[data-palm]');
      if (!t || !self.cv) return;
      if (t.hasAttribute('data-tool')) { self.cv.setTool(t.getAttribute('data-tool')); self.closePop(); }
      else if (t.hasAttribute('data-w')) { self.cv.setWidth(parseFloat(t.getAttribute('data-w'))); self.closePop(); }
      else if (t.hasAttribute('data-tone')) { self.cv.setColor(t.getAttribute('data-tone')); self.closePop(); }
      else if (t.hasAttribute('data-nib')) { self.cv.setNib(t.getAttribute('data-nib')); self.closePop(); }
      else if (t.hasAttribute('data-palm')) {
        if (window.GardenInkInput) GardenInkInput.setPalmMode(t.getAttribute('data-palm'));
        self.closePop();
      }
    });

    /*@3.NOCUJ.1*/
    var holdT = null, holdTone = null;
    p.addEventListener('pointerdown', function (e) {
      var sw = e.target.closest('[data-tone]');
      if (!sw) return;
      holdTone = sw.getAttribute('data-tone');
      clearTimeout(holdT);
      holdT = setTimeout(function () {
        var cur = pins();
        if (cur.indexOf(holdTone) === -1) {
          cur.unshift(holdTone);
          setPins(cur);
          self.paintPins();
          if (self.cv) self.sync({ tool: self.cv.tool, color: self.cv.color, width: self.cv.width,
                                   nib: self.cv.nib, zoom: self.cv.cam.z, selection: self.cv.selected().length,
                                   canUndo: !!self.cv.undoS.length, canRedo: !!self.cv.redoS.length,
                                   expanded: self.cv.expanded });
        }
        holdT = null;
      }, 520);
    });
    var stop = function () { clearTimeout(holdT); holdT = null; };
    p.addEventListener('pointerup', stop);
    p.addEventListener('pointercancel', stop);
    p.addEventListener('pointerleave', stop);
  };

  Bar.prototype.closePop = function () {
    if (this.pop) { this.pop.remove(); this.pop = null; }
    if (this.popAnchor) { this.popAnchor.setAttribute('aria-expanded', 'false'); this.popAnchor = null; }
  };

  Bar.prototype.bind = function () {
    var self = this;
    this.host.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) e.preventDefault();
    });
    this.host.addEventListener('click', function (e) {
      var cv = self.cv;
      var pb = e.target.closest('[data-pop]');
      if (pb) {
        var kind = pb.getAttribute('data-pop');
        if (self.pop && self.popAnchor === pb) self.closePop();
        else self.openPop(kind, pb);
        return;
      }
      self.closePop();
      if (!cv) return;
      var tl = e.target.closest('[data-tool]');
      if (tl) { cv.setTool(tl.getAttribute('data-tool')); return; }
      var tn = e.target.closest('[data-tone]');
      if (tn) { cv.setColor(tn.getAttribute('data-tone')); return; }
      var ac = e.target.closest('[data-act]');
      if (!ac || ac.disabled) return;
      var a = ac.getAttribute('data-act');
      if (a === 'undo') cv.undo();
      else if (a === 'redo') cv.redo();
      else if (a === 'del') cv.deleteSelected();
      else if (a === 'zoomin') cv.setZoom(cv.cam.z * 1.25);
      else if (a === 'zoomout') cv.setZoom(cv.cam.z / 1.25);
      else if (a === 'fit') cv.resetView();
      else if (a === 'expand') cv.expand(!cv.expanded);
    });
    this._onDoc = function (e) {
      if (self.pop && !e.target.closest('.nc-pop') && !e.target.closest('[data-pop]')) self.closePop();
    };
    document.addEventListener('click', this._onDoc);
    this._onEsc = function (e) { if (e.key === 'Escape') self.closePop(); };
    document.addEventListener('keydown', this._onEsc);
  };

  Bar.prototype.destroy = function () {
    this.closePop();
    document.removeEventListener('click', this._onDoc);
    document.removeEventListener('keydown', this._onEsc);
  };

  window.GardenCanvasBar = {
    mount: function (host, canvas) { return new Bar(host, canvas); },
    pins: pins,
    setPins: setPins,
    TOOLS: TOOLS,
    WIDTHS: WIDTHS
  };
})();
