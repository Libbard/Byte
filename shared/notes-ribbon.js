;(function () {
  'use strict';

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var TONES = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky',
               'lime', 'orange', 'red', 'pink', 'teal', 'indigo'];

  var TONE_AR = {
    ink: 'الحبر', amber: 'كهرماني', rose: 'وردي', violet: 'بنفسجي',
    emerald: 'زمردي', sky: 'سماوي', lime: 'ليموني', orange: 'برتقالي',
    red: 'أحمر', pink: 'زهري', teal: 'فيروزي', indigo: 'نيلي'
  };
  var TONE_EN = {
    ink: 'Ink', amber: 'Amber', rose: 'Rose', violet: 'Violet',
    emerald: 'Emerald', sky: 'Sky', lime: 'Lime', orange: 'Orange',
    red: 'Red', pink: 'Pink', teal: 'Teal', indigo: 'Indigo'
  };

  /*@3.NORJ.4*/
  /*@3.NORJ.24*/
  var STYLES = [
    { ty: 'p',            ar: 'نصّ عادي',    en: 'Normal text' },
    { ty: 'h', lv: 1,     ar: 'عنوان ١',     en: 'Heading 1' },
    { ty: 'h', lv: 2,     ar: 'عنوان ٢',     en: 'Heading 2' },
    { ty: 'h', lv: 3,     ar: 'عنوان ٣',     en: 'Heading 3' },
    { ty: 'quote',        ar: 'اقتباس',      en: 'Quote' },
    { ty: 'callout',      ar: 'تنبيه',       en: 'Callout' },
    { ty: 'ul',           ar: 'قائمة نقطية', en: 'Bulleted list' },
    { ty: 'ol',           ar: 'قائمة رقمية', en: 'Numbered list' },
    { ty: 'todo',         ar: 'مهمّة',       en: 'To-do' },
    { ty: 'code',         ar: 'كود',         en: 'Code' },
    { ty: 'math',         ar: 'معادلة',      en: 'Equation' }
  ];

  /*@3.NORJ.28*/
  var MMD_EG = 'graph TD\n  A[البداية] --> ' +
    'B{شرط؟}\n  B -->|نعم| ' +
    'C[نفّذ]\n  B -->|لا| ' +
    'D[توقّف]';

  /*@3.NORJ.5*/
  var INSERTS = [
    { ty: 'tbl',  icon: 'fa-table',                 ar: 'جدول',       en: 'Table' },
    { ty: 'math', icon: 'fa-square-root-variable',  ar: 'معادلة',     en: 'Equation' },
    { ty: 'mlib', icon: 'fa-book-open',            ar: 'مكتبة المعادلات', en: 'Equation library' },
    { ty: 'img',  icon: 'fa-image',                 ar: 'صورة برابط', en: 'Image by URL' },
    { ty: 'code', icon: 'fa-code',                  ar: 'كود',        en: 'Code' },
    { ty: 'code', icon: 'fa-diagram-project',       ar: 'مخطّط ميرمايد', en: 'Mermaid diagram',
      extra: { lang: 'mermaid', dgm: 1, src: MMD_EG } },
    { ty: 'hr',   icon: 'fa-minus',                 ar: 'فاصل',       en: 'Divider' }
  ];

  function btn(act, icon, ar, en, extra) {
    return '<button type="button" class="nr-b' + (extra ? ' ' + extra : '') +
      '" data-act="' + esc(act) + '" aria-label="' + esc(L(ar, en)) + '"' +
      ' data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i></button>';
  }

  function styleName(st) {
    if (!st || !st.ty) return L('نصّ', 'Text');
    for (var i = 0; i < STYLES.length; i++) {
      if (STYLES[i].ty === st.ty && (st.ty !== 'h' || STYLES[i].lv === st.lv)) {
        return L(STYLES[i].ar, STYLES[i].en);
      }
    }
    var other = { ul: ['قائمة نقطية', 'Bullet list'], ol: ['قائمة رقمية', 'Numbered list'],
                  todo: ['مربع مهمة', 'To-do'], tbl: ['جدول', 'Table'],
                  math: ['معادلة', 'Equation'], img: ['صورة', 'Image'],
                  ink: ['رسم', 'Drawing'], hr: ['فاصل', 'Divider'] }[st.ty];
    return other ? L(other[0], other[1]) : L('نصّ', 'Text');
  }

  /*@3.NORJ.1*/
  function fontCatalog() {
    var NB = window.GardenNotesBlocks;
    return (NB && NB.fontCatalog) ? NB.fontCatalog() : [];
  }

  /*@3.NORJ.17*/
  var SAMPLE = 'أبجد هوّز Abc 123';
  var _warmed = false;

  function warmFonts() {
    if (_warmed || !document.fonts || !document.fonts.load) return;
    _warmed = true;
    fontCatalog().forEach(function (f) {
      if (!f.css) return;
      try { document.fonts.load('400 16px "' + f.css + '"', SAMPLE); } catch (e) {}
    });
  }

  function fontLabel(id) {
    var NB = window.GardenNotesBlocks;
    if (!id) id = (NB && NB.FONT_DEFAULT) || 'thmanyah';
    var all = fontCatalog();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return L(all[i].ar, all[i].en);
    return id;
  }

  function Ribbon(host, opts) {
    this.host = host;
    host.__bar = this;
    this.opts = opts || {};
    this.ed = null;
    this.pop = null;
    this.build();
    this.bind();
  }

  Ribbon.prototype.build = function () {
    var h = '';
    h += '<div class="nr-grp nr-grp--pen">' +
      btn('draw', 'fa-pen-nib', 'القلم والرسم', 'Pen and drawing', 'nr-b--pen') +
      '</div>';

    /*@3.NORJ.27*/
    h += '<div class="nr-grp nr-grp--hist">' +
      btn('undo', 'fa-rotate-left', 'تراجع', 'Undo') +
      btn('redo', 'fa-rotate-right', 'إعادة', 'Redo') +
      '</div>';

    h += '<div class="nr-grp">' +
      '<button type="button" class="nr-sel" data-pop="style" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('نمط الفقرة', 'Paragraph style')) + '"' +
      ' data-ar-title="نمط الفقرة" data-en-title="Paragraph style">' +
      '<span class="nr-sel-t" data-role="style-name">' + esc(L('نصّ عادي', 'Normal text')) + '</span>' +
      '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      /*@3.NORJ.21*/
      '<input type="number" class="nr-fsize" data-role="fsize" min="8" max="96" step="1"' +
      ' inputmode="numeric"' +
      ' aria-label="' + esc(L('مقاس خطّ الكتلة', 'Block font size')) + '"' +
      ' data-ar-title="مقاس خطّ الكتلة" data-en-title="Block font size">' +
      '<button type="button" class="nr-sel nr-font" data-pop="font" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('خطُّ الكتلة', 'Block font')) + '"' +
      ' data-ar-title="خطُّ الكتلة" data-en-title="Block font">' +
      '<span class="nr-sel-t" data-role="font-name">' + esc(fontLabel('')) + '</span>' +
      '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '</div>';

    h += '<div class="nr-grp">' +
      btn('bold', 'fa-bold', 'غامق', 'Bold') +
      btn('italic', 'fa-italic', 'مائل', 'Italic') +
      btn('underline', 'fa-underline', 'تسطير', 'Underline') +
      btn('strike', 'fa-strikethrough', 'شطب', 'Strikethrough') +
      btn('code', 'fa-terminal', 'رمز سطري', 'Inline code') +
      '</div>';

    h += '<div class="nr-grp">' +
      '<button type="button" class="nr-b nr-b--tone" data-pop="fg" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('لون النص', 'Text colour')) + '"' +
      ' data-ar-title="لون النص" data-en-title="Text colour">' +
      '<i class="fa-solid fa-a" aria-hidden="true"></i>' +
      '<span class="nr-tone-bar" data-role="fg-bar"></span></button>' +
      '<button type="button" class="nr-b nr-b--tone" data-pop="hl" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('تظليل', 'Highlight')) + '"' +
      ' data-ar-title="تظليل" data-en-title="Highlight">' +
      '<i class="fa-solid fa-highlighter" aria-hidden="true"></i>' +
      '<span class="nr-tone-bar" data-role="hl-bar"></span></button>' +
      btn('clear', 'fa-eraser', 'إزالة التنسيق', 'Clear formatting') +
      '</div>';

    /*@3.NORJ.18*/
    var ar = isAr();
    h += '<div class="nr-grp">' +
      btn('align:start', ar ? 'fa-align-right' : 'fa-align-left',
          'محاذاة إلى البداية', 'Align to start') +
      btn('align:center', 'fa-align-center', 'توسيط', 'Centre') +
      btn('align:end', ar ? 'fa-align-left' : 'fa-align-right',
          'محاذاة إلى النهاية', 'Align to end') +
      btn('align:justify', 'fa-align-justify', 'ضبط', 'Justify') +
      '</div>';

    h += '<div class="nr-grp">' +
      btn('painter', 'fa-paintbrush', 'ناسخ التنسيق (ضغطتان للتثبيت)',
          'Format painter (double-click to keep)') +
      btn('dir', 'fa-right-left', 'اتّجاه الكتلة', 'Block direction') +
      '</div>';

    h += '<div class="nr-grp">' +
      btn('list:ul', 'fa-list-ul', 'قائمة نقطية', 'Bullet list') +
      btn('list:ol', 'fa-list-ol', 'قائمة رقمية', 'Numbered list') +
      btn('list:todo', 'fa-square-check', 'مربع مهمة', 'To-do') +
      '</div>';

    h += '<div class="nr-grp">' +
      btn('link', 'fa-link', 'رابط', 'Link') +
      '<button type="button" class="nr-ins" data-pop="ins" aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(L('إدراج كتلة جديدة', 'Insert a new block')) + '"' +
      ' data-ar-title="إدراج" data-en-title="Insert">' +
      '<i class="fa-solid fa-plus" aria-hidden="true"></i>' +
      '<span data-ar="إدراج" data-en="Insert">' + esc(L('إدراج', 'Insert')) + '</span>' +
      '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '</div>';

    /*@3.NORJ.6*/
    h += '<div class="nr-grp">' +
      btn('bsel', 'fa-object-ungroup', 'وضع تحديد الكتل', 'Block select mode') +
      btn('copy', 'fa-copy', 'نسخ', 'Copy') +
      btn('cut', 'fa-scissors', 'قصّ', 'Cut') +
      btn('paste', 'fa-paste', 'لصق', 'Paste') +
      btn('erase', 'fa-trash-can', 'حذف المحدَّد', 'Delete selection') +
      '</div>';

    h += '<div class="nr-grp nr-grp--end">' +
      btn('up', 'fa-arrow-up', 'تحريك الكتلة لأعلى', 'Move block up') +
      btn('down', 'fa-arrow-down', 'تحريك الكتلة لأسفل', 'Move block down') +
      '</div>';

    this.host.innerHTML = h;
    i18n(this.host);
    this.host.setAttribute('role', 'toolbar');
    this.host.setAttribute('aria-label', L('أدوات التحرير', 'Editing tools'));
  };

  Ribbon.prototype.attach = function (ed) {
    this.ed = ed;
    this.closePop();
    this.disarmPainter();
    var self = this;
    if (ed && ed.root && !ed.root.__painterBound) {
      ed.root.__painterBound = 1;
      ed.root.addEventListener('pointerup', function () {
        if (!self._fmt) return;
        setTimeout(function () { self.applyPainter(); }, 0);
      });
    }
    this.setState(ed ? ed.selState() : null);
  };

  /*@3.NORJ.22*/
  Ribbon.prototype.armPainter = function (lock) {
    var ed = this.ed;
    if (!ed || !ed.copyFormat) return;
    var fmt = ed.copyFormat();
    if (!fmt) return;
    this._fmt = fmt;
    this._fmtLock = !!lock;
    this.paintPainter();
  };

  Ribbon.prototype.disarmPainter = function () {
    this._fmt = null;
    this._fmtLock = false;
    this.paintPainter();
  };

  Ribbon.prototype.paintPainter = function () {
    var b = this.host.querySelector('[data-act="painter"]');
    if (!b) return;
    b.classList.toggle('on', !!this._fmt);
    b.setAttribute('data-lock', this._fmtLock ? '1' : '0');
    var root = this.ed && this.ed.root;
    if (root) root.classList.toggle('ne-painting', !!this._fmt);
  };

  Ribbon.prototype.applyPainter = function () {
    if (!this._fmt || !this.ed || !this.ed.pasteFormat) return false;
    var done = this.ed.pasteFormat(this._fmt);
    if (!this._fmtLock) this.disarmPainter();
    return done;
  };

  /*@3.NORJ.23*/
  Ribbon.prototype.setKind = function (kind) {
    this.host.setAttribute('data-kind', kind === 'board' ? 'board' : 'doc');
  };

  Ribbon.prototype.setInkHidden = function (off) {
    this._inkOff = !!off;
    var b = this.host.querySelector('[data-act="draw"]');
    if (b) b.classList.toggle('is-muted', !!off);
  };

  Ribbon.prototype.setDrawing = function (on) {
    var b = this.host.querySelector('[data-act="draw"]');
    if (b) b.classList.toggle('on', !!on);
  };

  Ribbon.prototype.setState = function (st) {
    var on = !!st && st.hasBlock;
    var fsIn = this.host.querySelector('[data-role="fsize"]');
    if (fsIn) fsIn.disabled = !on;
    var q = this.host.querySelectorAll('.nr-b, .nr-sel, .nr-ins');
    for (var i = 0; i < q.length; i++) {
      var b = q[i], act = b.getAttribute('data-act');
      var dis = !on;
      if (act === 'undo') dis = !st || !st.canUndo;
      else if (act === 'redo') dis = !st || !st.canRedo;
      else if (act === 'up') dis = !st || !st.canUp;
      else if (act === 'down') dis = !st || !st.canDown;
      else if (act === 'draw') dis = false;
      else if (act === 'bsel') dis = false;
      else if (act === 'copy' || act === 'cut' || act === 'erase') dis = !this.hasPick(st);
      else if (act === 'paste') dis = !this.canPaste(st);
      b.disabled = dis;
      b.classList.remove('on');
    }
    var bs = this.host.querySelector('[data-act="bsel"]');
    var ovS = this.opts.overlay ? this.opts.overlay() : null;
    if (bs) {
      var cvS = this.inkCv();
      bs.classList.toggle('on', !!(st && st.selMode) || !!(ovS && ovS.pick) ||
                                !!(cvS && cvS.tool === 'sel'));
    }
    var db = this.host.querySelector('[data-act="draw"]');
    if (db) db.classList.toggle('on', !!(ovS && ovS.on));
    if (!on) return;

    var m = st.marks || {};
    var map = { bold: 'b', italic: 'i', underline: 'u', strike: 'st', code: 'c' };
    for (var k in map) {
      var el2 = this.host.querySelector('[data-act="' + k + '"]');
      if (el2 && m[map[k]]) el2.classList.add('on');
    }
    var lb = this.host.querySelector('[data-act="list:' + st.ty + '"]');
    if (lb) lb.classList.add('on');
    var db = this.host.querySelector('[data-act="dir"]');
    if (db) {
      var explicit = st.dir === 'rtl' || st.dir === 'ltr';
      db.classList.toggle('on', explicit);
      var shown = explicit ? st.dir : (isAr() ? 'rtl' : 'ltr');
      var dAr = shown === 'rtl' ? 'الاتّجاه: من اليمين إلى اليسار' : 'الاتّجاه: من اليسار إلى اليمين';
      var dEn = shown === 'rtl' ? 'Direction: right to left' : 'Direction: left to right';
      db.setAttribute('aria-label', L(dAr, dEn));
      db.setAttribute('data-ar-title', dAr);
      db.setAttribute('data-en-title', dEn);
      db.setAttribute('title', L(dAr, dEn));
    }
    var ab = this.host.querySelector('[data-act="align:' + (st.al || 'start') + '"]');
    if (ab) ab.classList.add('on');
    var fn = this.host.querySelector('[data-role="font-name"]');
    if (fn) fn.textContent = fontLabel(m.ff || st.ff);
    var fsz = this.host.querySelector('[data-role="fsize"]');
    /*@3.NORJ.25*/
    if (fsz && document.activeElement !== fsz) {
      fsz.value = String(st.fs || st.fsEff || '');
      fsz.setAttribute('data-set', st.fs ? '1' : '0');
    }

    var nm = this.host.querySelector('[data-role="style-name"]');
    if (nm) nm.textContent = styleName(st);

    this.paintBar('fg-bar', m.fg);
    this.paintBar('hl-bar', m.hl);
  };

  Ribbon.prototype.hasPick = function (st) {
    var cv = this.inkCv();
    if (cv && cv.selected().length) return true;
    return !!(st && st.bsel);
  };

  Ribbon.prototype.canPaste = function (st) {
    var cv = this.inkCv();
    if (cv && cv.clip && cv.clip.length) return true;
    return !!(st && st.canPaste);
  };

  Ribbon.prototype.paintBar = function (role, tone) {
    var bar = this.host.querySelector('[data-role="' + role + '"]');
    if (!bar) return;
    bar.style.background = tone ? hexOf(tone) : 'transparent';
    bar.setAttribute('data-tone', tone || '');
  };

  /*@3.NORJ.2*/
  function hexOf(tone) {
    if (window.GardenCanvas && GardenCanvas.hexOf) return GardenCanvas.hexOf(tone);
    if (window.GardenInk && GardenInk.hexOf) return GardenInk.hexOf(tone);
    return '#888';
  }

  /*@3.NORJ.3*/
  function i18n(node) {
    if (node && window.Garden && Garden.localize) {
      try { Garden.localize(node); } catch (e) {}
    }
    return node;
  }

  /*@3.NORJ.15*/
  function SW(kind) {
    return (window.GardenSwatch && GardenSwatch.html) ? GardenSwatch.html(kind) : '';
  }

  Ribbon.prototype.popHtml = function (kind) {
    var h = '';
    if (kind === 'style') {
      h = STYLES.map(function (s) {
        return '<button type="button" class="nr-pi" data-turn="' + s.ty +
          (s.lv ? ':' + s.lv : '') + '"><span class="nr-pi-s nr-pi-s--' + s.ty +
          (s.lv ? s.lv : '') + '">' + esc(L(s.ar, s.en)) + '</span></button>';
      }).join('');
    } else if (kind === 'font') {
      var all = fontCatalog();
      h = '';
      for (var f = 0; f < all.length; f++) {
        h += '<button type="button" class="nr-pi" data-font="' + esc(all[f].id) + '"' +
             (all[f].css ? ' style="font-family:&quot;' + esc(all[f].css) + '&quot;,sans-serif"' : '') +
             '><span>' + esc(L(all[f].ar, all[f].en)) + '</span></button>';
      }
    } else if (kind === 'ins') {
      h = INSERTS.map(function (s, k) {
        return '<button type="button" class="nr-pi" data-ins="' + k + '">' +
          '<i class="fa-solid ' + s.icon + '" aria-hidden="true"></i>' +
          '<span>' + esc(L(s.ar, s.en)) + '</span></button>';
      }).join('');
    } else {
      /*@3.NORJ.9*/
      var isFg = kind === 'fg';
      h = '<div class="nr-tones"' + (isFg ? '' : ' data-mix="hl"') + '>' + TONES.map(function (t) {
        return '<button type="button" class="nr-tone" data-tone="' + t + '"' +
          ' style="--t:' + hexOf(t) + '" aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
          ' data-ar-title="' + esc(TONE_AR[t]) + '" data-en-title="' + esc(TONE_EN[t]) + '"></button>';
      }).join('') + '</div>' +
      SW(kind) +
      '<button type="button" class="nr-pi" data-tone="">' +
        '<i class="fa-solid fa-ban" aria-hidden="true"></i><span>' +
        esc(isFg ? L('بلا لون', 'No colour') : L('بلا تظليل', 'No highlight')) +
      '</span></button>';
      if (!isFg) {
        h += '<div class="nr-pop-h">' + esc(L('تظليل الحقل كاملاً', 'Highlight the whole block')) + '</div>' +
          '<div class="nr-tones" data-mix="blk">' + TONES.map(function (t) {
            return '<button type="button" class="nr-tone" data-blk="' + t + '"' +
              ' style="--t:' + hexOf(t) + '" aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
              ' data-ar-title="' + esc(TONE_AR[t]) + '" data-en-title="' + esc(TONE_EN[t]) + '"></button>';
          }).join('') + '</div>' +
          SW('blk') +
          '<button type="button" class="nr-pi" data-blk="">' +
            '<i class="fa-solid fa-ban" aria-hidden="true"></i><span>' +
            esc(L('بلا تظليل للحقل', 'No block highlight')) + '</span></button>';
      }
    }
    return h;
  };

  Ribbon.prototype.openPop = function (kind, anchor) {
    this.closePop();
    var p = document.createElement('div');
    p.className = 'nr-pop nr-pop--' + kind;
    p.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    if (kind === 'font') {
      if (window.GardenTint && GardenTint.fontSheet) {
        try { GardenTint.fontSheet(); } catch (e) {}
      }
      warmFonts();
    }
    p.innerHTML = this.popHtml(kind);
    /*@3.NORJ.13*/
    var page = document.getElementById('na-page');
    var under = '';
    if (page) {
      under = getComputedStyle(page).getPropertyValue('--na-paper').trim() ||
              getComputedStyle(page).backgroundColor;
    }
    if (under) p.style.setProperty('--ne-under', under);
    if (page) p.setAttribute('data-paper', page.getAttribute('data-paper') || '');
    document.body.appendChild(p);
    i18n(p);

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
    /*@3.NORJ.16*/
    if (window.GardenSwatch) {
      [].forEach.call(p.querySelectorAll('.nsw'), function (host) {
        var k = host.getAttribute('data-swkind');
        GardenSwatch.bind(host, k, function (hex, done) {
          /*@3.NORJ.20*/
          if (!self.ed) return;
          if (k === 'blk') {
            if (done === false) return;
            self.ed.exec('blockHl', hex);
            self.closePop();
            return;
          }
          if (self.ed.liveMark) self.ed.liveMark(k === 'hl' ? 'hl' : 'fg', hex, done !== false);
          else if (done !== false) self.ed.exec(k === 'hl' ? 'hl' : 'fg', hex);
          if (done !== false) self.closePop();
        }, function () { self.openPop(kind, anchor); });
      });
    }
    /*@3.NORJ.10*/
    p.addEventListener('click', function (e) {
      if (e.target.closest('.nsw-row, .nsw-hex')) return;
      var blk = e.target.closest('[data-blk]');
      if (blk && self.ed) {
        self.ed.exec('blockHl', blk.getAttribute('data-blk'));
        self.closePop();
        return;
      }
      var t = e.target.closest('[data-turn],[data-ins],[data-tone],[data-font]');
      if (!t) return;
      var ed = self.ed;
      self.closePop();
      if (!ed) return;
      if (t.hasAttribute('data-font')) {
        ed.exec('font', t.getAttribute('data-font'));
      } else if (t.hasAttribute('data-turn')) {
        var parts = t.getAttribute('data-turn').split(':');
        ed.exec('turn', { ty: parts[0], lv: parts[1] ? Number(parts[1]) : null });
      } else if (t.hasAttribute('data-ins')) {
        var item = INSERTS[Number(t.getAttribute('data-ins'))];
        if (!item) return;
        if (item.ty === 'mlib') {
          if (window.GardenNotesMathLib) {
            GardenNotesMathLib.open(function (tex) {
              ed.exec('insert', { ty: 'math', extra: { tex: tex, display: 1 } });
            });
          }
          return;
        }
        ed.exec('insert', item.extra
          ? { ty: item.ty, extra: JSON.parse(JSON.stringify(item.extra)) }
          : { ty: item.ty });
      } else {
        ed.exec(kind === 'hl' ? 'hl' : 'fg', t.getAttribute('data-tone'));
      }
    });
  };

  Ribbon.prototype.flash = function (btn) {
    if (!btn) return;
    btn.classList.remove('nr-flash');
    void btn.offsetWidth;
    btn.classList.add('nr-flash');
    setTimeout(function () { btn.classList.remove('nr-flash'); }, 320);
  };

  Ribbon.prototype.closePop = function () {
    if (this.pop) { this.pop.remove(); this.pop = null; }
    if (this.popAnchor) { this.popAnchor.setAttribute('aria-expanded', 'false'); this.popAnchor = null; }
  };

  Ribbon.prototype.bind = function () {
    var self = this;

    this.host.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.nr-b, .nr-sel, .nr-ins')) e.preventDefault();
    });

    this.host.addEventListener('click', function (e) {
      var pb = e.target.closest('[data-pop]');
      if (pb) {
        var kind = pb.getAttribute('data-pop');
        if (self.pop && self.popAnchor === pb) self.closePop();
        else self.openPop(kind, pb);
        return;
      }
      var b = e.target.closest('.nr-b');
      if (!b || b.disabled) return;
      var act = b.getAttribute('data-act');
      self.flash(b);
      var ed = self.ed;
      if (!ed) return;
      self.closePop();
      if (act === 'dir') {
        var sd = ed.selState();
        var here = sd.dir === 'rtl' || sd.dir === 'ltr'
          ? sd.dir : (isAr() ? 'rtl' : 'ltr');
        ed.exec('dir', here === 'rtl' ? 'ltr' : 'rtl');
        return;
      }
      if (act.indexOf('align:') === 0) {
        var av = act.slice(6), sa = ed.selState();
        ed.exec('align', sa.al === av ? 'start' : av);
        return;
      }
      if (act.indexOf('list:') === 0) {
        var ty = act.slice(5);
        var st = ed.selState();
        ed.exec('turn', { ty: st.ty === ty ? 'p' : ty });
        return;
      }
      if (act === 'draw') {
        if (self.opts.onDraw) self.opts.onDraw();
        return;
      }
      if (act === 'link') { self.askLink(); return; }
      if (act === 'painter') {
        if (self._fmt) self.disarmPainter();
        else self.armPainter(false);
        return;
      }
      /*@3.NORJ.7*/
      if (act === 'bsel' || act === 'copy' || act === 'cut' ||
          act === 'paste' || act === 'erase') {
        self.clipAct(act);
        return;
      }
      ed.exec(act);
    });

    this.host.addEventListener('dblclick', function (e) {
      var b = e.target.closest('[data-act="painter"]');
      if (!b || b.disabled) return;
      e.preventDefault();
      self.armPainter(true);
    });

    this.host.addEventListener('change', function (e) {
      var f = e.target.closest('[data-role="fsize"]');
      if (!f || !self.ed) return;
      self.ed.exec('fsize', f.value);
    });
    this.host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var f = e.target.closest('[data-role="fsize"]');
      if (!f || !self.ed) return;
      e.preventDefault();
      self.ed.exec('fsize', f.value);
    });

    this._onDoc = function (e) {
      if (self.pop && !e.target.closest('.nr-pop') && !e.target.closest('[data-pop]')) self.closePop();
    };
    document.addEventListener('click', this._onDoc);
    this._onKey = function (e) {
      if (e.key !== 'Escape') return;
      self.closePop();
      if (self._fmt) self.disarmPainter();
    };
    document.addEventListener('keydown', this._onKey);
    /*@3.NORJ.14*/
    this._onScroll = function (e) {
      if (!self.pop) return;
      var t = e && e.target;
      if (t && t.nodeType === 1 && (t === self.pop || self.pop.contains(t))) return;
      self.closePop();
    };
    window.addEventListener('scroll', this._onScroll, true);
  };

  /*@3.NORJ.8*/
  Ribbon.prototype.inkCv = function () {
    var ov = this.opts.overlay ? this.opts.overlay() : null;
    return (ov && ov.cv && (ov.on || ov.pick)) ? ov.cv : null;
  };

/*@3.NORJ.12*/
  Ribbon.prototype.clipAct = function (act) {
    var ed = this.ed;
    var ov = this.opts.overlay ? this.opts.overlay() : null;
    var cv = this.inkCv();

    if (act === 'bsel') {
      /*@3.NORJ.29*/
      if (ov && ov.on && this.opts.onDraw) this.opts.onDraw();
      var want = ed ? !ed._selMode : !(ov && ov.pick);
      if (ed) ed.setSelectMode(want);
      if (ov && ov.setPick) ov.setPick(want);
      this.setState(ed ? ed.selState() : null);
      return;
    }

    var inkPick = !!(cv && cv.selected().length);
    var blockPick = !!(ed && Object.keys(ed.blockSel()).length);

    var hist = ed ? ed.hist : null;
    if (hist) hist.begin();
    try {
      if (act === 'copy') {
        if (inkPick) cv.copySelected();
        if (blockPick) ed.copyBlocks();
      } else if (act === 'cut') {
        if (inkPick) cv.cutSelected();
        if (blockPick) ed.cutBlocks();
      } else if (act === 'paste') {
        if (cv && cv.clip && cv.clip.length) cv.paste();
        if (ed && window.GardenNotesEditor && GardenNotesEditor.hasClip &&
            GardenNotesEditor.hasClip()) ed.pasteBlocks();
      } else if (act === 'erase') {
        if (inkPick) cv.deleteSelected();
        if (blockPick) ed.deleteBlocks();
      }
    } finally { if (hist) hist.end(); }
    if (ed) this.setState(ed.selState());
  };

  Ribbon.prototype.askLink = function () {
    var dlg = document.getElementById('na-link');
    var ed = this.ed;
    if (!dlg || !ed) return;
    /*@3.NORJ.19*/
    var ctx = ed.linkCtx ? ed.linkCtx() : null;
    var input = dlg.querySelector('[data-role="url"]');
    var label = dlg.querySelector('[data-role="ltext"]');
    if (input) input.value = (ctx && ctx.url) || '';
    if (label) label.value = (ctx && ctx.text) || '';
    dlg.__ed = ed;
    dlg.__ctx = ctx;
    /*@3.NORJ.26*/
    try { dlg.dispatchEvent(new CustomEvent('garden:notesLinkOpen', { bubbles: true })); }
    catch (eE) {}
    try { dlg.showModal(); } catch (e) {}
    setTimeout(function () { if (input) input.focus(); }, 40);
  };

  document.addEventListener('garden:languageChanged', function () {
    var hosts = document.querySelectorAll('.nr');
    for (var i = 0; i < hosts.length; i++) {
      var bar = hosts[i].__bar;
      if (!bar) continue;
      bar.closePop();
      bar.build();
      if (bar.ed) bar.setState(bar.ed.selState());
    }
  });

  window.GardenNotesRibbon = {
    mount: function (host, opts) { return new Ribbon(host, opts); },
    TONES: TONES,
    STYLES: STYLES
  };
})();
