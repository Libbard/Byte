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
  function hexOf(t) {
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '#888';
  }

  /*@3.NODJ.38*/
  var TONES = ['ink', 'red', 'orange', 'yellow', 'lime', 'emerald',
               'teal', 'sky', 'indigo', 'violet', 'pink', 'brown'];
  var TONE_AR = {
    ink: 'الحبر', red: 'أحمر', orange: 'برتقالي', yellow: 'أصفر',
    lime: 'ليموني', emerald: 'أخضر', teal: 'فيروزي', sky: 'أزرق',
    indigo: 'نيلي', violet: 'بنفسجي', pink: 'زهري', brown: 'بنّي',
    amber: 'كهرماني', rose: 'وردي', white: 'أبيض', black: 'أسود'
  };
  var TONE_EN = {
    ink: 'Ink', red: 'Red', orange: 'Orange', yellow: 'Yellow',
    lime: 'Lime', emerald: 'Green', teal: 'Teal', sky: 'Blue',
    indigo: 'Indigo', violet: 'Violet', pink: 'Pink', brown: 'Brown',
    amber: 'Amber', rose: 'Rose', white: 'White', black: 'Black'
  };

  /*@3.NODJ.54*/
  var MAIN_TONES = ['ink', 'red', 'sky', 'emerald'];
  /*@3.NODJ.66*/
  var EDGE_TONES = [
    { k: 'white', ar: 'أبيض', en: 'White' },
    { k: 'black', ar: 'أسود', en: 'Black' }
  ];
  var ALL_TONES = TONES.concat(['white', 'black']);
  var ORDER_KEY = 'garden_ink_tone_order', PIN_KEY = 'garden_ink_pin_colors';

  function toneOrder() {
    var out = [], seen = {};
    try {
      var a = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null');
      if (Array.isArray(a)) {
        a.forEach(function (t) {
          if (ALL_TONES.indexOf(t) >= 0 && !seen[t]) { seen[t] = 1; out.push(t); }
        });
      }
    } catch (e) {}
    ALL_TONES.forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } });
    return out;
  }

  function setToneOrder(a) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(a)); } catch (e) {}
  }

  function colorsPinned() {
    try { return localStorage.getItem(PIN_KEY) === '1'; } catch (e) { return false; }
  }

  function setColorsPinned(on) {
    try { localStorage.setItem(PIN_KEY, on ? '1' : '0'); } catch (e) {}
  }

  var PEN_W = [1.2, 2.4, 4, 7, 12];
  /*@3.NODJ.55*/
  var HI_W = [6, 10, 14, 20, 28, 38];
  var NIBS = [
    { k: 'round',  ar: 'مدوّرة',  en: 'Round' },
    { k: 'fine',   ar: 'رفيعة',   en: 'Fine' },
    { k: 'marker', ar: 'ثابتة',   en: 'Marker' },
    { k: 'flat',   ar: 'مشطوفة',  en: 'Chisel' },
    { k: 'pencil', ar: 'رصاص',    en: 'Pencil' },
    { k: 'chalk',  ar: 'طباشير',  en: 'Chalk', hide: 1 }
  ];
  function pickNibs() {
    return NIBS.filter(function (n) { return !n.hide; });
  }
  var SHAPES = [
    { k: 'rect', icon: 'fa-square',           ar: 'مستطيل', en: 'Rectangle' },
    { k: 'ell',  icon: 'fa-circle',           ar: 'دائرة',  en: 'Ellipse' },
    { k: 'line', icon: 'fa-minus',            ar: 'خط',     en: 'Line' },
    { k: 'arr',  icon: 'fa-arrow-right-long', ar: 'سهم',    en: 'Arrow' }
  ];

  var ICONS = window.GardenNotesIcons || {};

  var NIB_ICON = {
    round: ICONS.nibRound, fine: ICONS.nibFine,
    marker: ICONS.nibMarker, flat: ICONS.nibChisel,
    pencil: '<i class="fa-solid fa-pencil" aria-hidden="true"></i>',
    chalk: '<i class="fa-solid fa-brush" aria-hidden="true"></i>'
  };

  var LASSO_SVG = (window.GardenNotesIcons || {}).lasso || '';

  /*@3.NODJ.1*/
  var RING1 = [
    { k: 'pen',   icon: 'fa-pen',           ar: 'قلم',        en: 'Pen',         tool: 'pen' },
    /*@3.NODJ.39*/
    { k: 'nib',   icon: 'fa-pen-nib',       ar: 'رأسُ القلم', en: 'Pen tip',     ring: 'nib' },
    { k: 'color', icon: 'fa-palette',       ar: 'اللون',      en: 'Colour',      ring: 'color' },
    { k: 'size',  html: ICONS.width,        ar: 'السماكة',    en: 'Thickness',   ring: 'size' },
    { k: 'hi',    icon: 'fa-highlighter',   ar: 'فسفوري',     en: 'Highlighter', tool: 'hi',    ring: 'hiw' },
    { k: 'era',   html: ICONS.eraser,       ar: 'ممحاة',      en: 'Eraser',      tool: 'era', ring: 'era' },
    { k: 'shape', icon: 'fa-shapes',        ar: 'أشكال',      en: 'Shapes',      ring: 'shape' },
    /*@3.NODJ.63*/
    { k: 'text',  icon: 'fa-i-cursor',      ar: 'حقلُ نصّ',    en: 'Text field',  tool: 'text',
      cap: 'canText' },
    /*@3.NODJ.9*/
    { k: 'lasso', html: LASSO_SVG,          ar: 'لاسو حرّ',   en: 'Free lasso',  tool: 'lasso' },
    { k: 'sel',   icon: 'fa-arrow-pointer', ar: 'تحديد',      en: 'Select',      tool: 'sel' },
    { k: 'hand',  icon: 'fa-hand',          ar: 'تمرير الصفحة', en: 'Scroll page', tool: 'hand' },
    { k: 'undo',  icon: 'fa-rotate-left',   ar: 'تراجع',      en: 'Undo' },
    { k: 'redo',  icon: 'fa-rotate-right',  ar: 'إعادة',      en: 'Redo' },
    { k: 'exit',  icon: 'fa-xmark',         ar: 'إنهاء الرسم', en: 'Exit drawing' }
  ];

  var R1 = 78, R2 = 128, POS_KEY = 'garden_ink_dial', FAV_KEY = 'garden_ink_favs2';
  /*@3.NODJ.59*/
  var FAV_KEY3 = 'garden_ink_favs3', FAV_MAX = 14;

  /*@3.NODJ.56*/
  var FAV_FIXED = [
    { tool: 'hand',  color: 'ink', width: 4, nib: 'round' },
    { tool: 'sel',   color: 'ink', width: 4, nib: 'round' },
    { tool: 'era',   color: 'ink', width: 4, nib: 'round', mode: 'part' },
    { tool: 'era',   color: 'ink', width: 4, nib: 'round', mode: 'whole' }
  ];

  /*@3.NODJ.20*/
  var INKY = { pen: 1, hi: 1 };

  var PALM_ORDER = ['auto', 'always', 'never'];
  var PALM_UI = {
    auto:   { icon: 'palmAuto',   ar: 'رفضُ راحة اليد: تلقائيّ — إن رأى قلماً منع اليد',
                                  en: 'Palm rejection: automatic — hand ignored once a pen is seen' },
    always: { icon: 'palmAlways', ar: 'رفضُ راحة اليد: دائماً — القلمُ وحدَه يكتب',
                                  en: 'Palm rejection: always — only the pen writes' },
    never:  { icon: 'palmNever',  ar: 'رفضُ راحة اليد: مطفأ — الإصبعُ يكتب أيضاً',
                                  en: 'Palm rejection: off — finger writes too' }
  };

  /*@3.NODJ.47*/
  function tiltNow() {
    var I = window.GardenInkInput;
    return (I && I.tiltMode && I.tiltMode() === 'off') ? 'off' : 'auto';
  }

  function tiltSeen() {
    var I = window.GardenInkInput;
    return !!(I && I.tiltSeen && I.tiltSeen());
  }

  function tiltLabel() {
    if (tiltNow() === 'off') {
      return ['ميلُ القلم: مطفأ — زاويةُ الرأسِ ثابتة',
              'Pen tilt: off — the nib keeps a fixed angle'];
    }
    if (tiltSeen()) {
      return ['ميلُ القلم: يعمل — قلمُك يبلّغ ميلَه والرأسُ يدور معه',
              'Pen tilt: live — your pen reports tilt and the nib follows it'];
    }
    return ['ميلُ القلم: جاهز — لم يبلّغ قلمُك ميلاً بعدُ',
            'Pen tilt: ready — your pen has not reported tilt yet'];
  }

  function palmNow(cv) {
    var I = window.GardenInkInput;
    var d = (cv && cv.palmDefault) || 'auto';
    var m = I && I.palmMode ? I.palmMode(d) : d;
    return PALM_ORDER.indexOf(m) >= 0 ? m : 'auto';
  }

  var PEN_ACTS = [
    { k: 'era',   ar: 'ممحاة',        en: 'Eraser' },
    { k: 'sel',   ar: 'تحديد',        en: 'Select' },
    { k: 'lasso', ar: 'لاسو',         en: 'Lasso' },
    { k: 'hand',  ar: 'تمرير',        en: 'Scroll' },
    { k: 'hi',    ar: 'تظليل',        en: 'Highlight' },
    { k: 'none',  ar: 'بلا فعل',      en: 'Nothing' }
  ];

  function isFixed(f) {
    if (!f) return false;
    for (var i = 0; i < FAV_FIXED.length; i++) {
      if (favKey(FAV_FIXED[i]) === favKey(f)) return true;
    }
    return false;
  }

  /*@3.NODJ.10*/
  var FAV_DEFAULTS = [
    { tool: 'pen', color: 'ink',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'red',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'sky',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'ink',     width: 4, nib: 'pencil' },
    { tool: 'hi',  color: 'yellow',  width: 26, nib: 'marker', straight: 1 },
    { tool: 'lasso', color: 'ink',   width: 4, nib: 'round' }
  ];

  /*@3.NODJ.35*/
  var RECENT_KEY = 'garden_ink_recent', RECENT_MAX = 5;

  function recents() {
    try {
      var a = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
      if (Array.isArray(a)) return a.slice(0, RECENT_MAX);
    } catch (e) {}
    return [];
  }

  function knownFav(f) {
    if (isFixed(f)) return true;
    var list = favs(), k = favKey(f), i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === k) return true;
    return false;
  }

  function noteRecent(cv) {
    if (!cv) return false;
    if (cv.tool === 'hand' || cv.tool === 'era') return false;
    var f = { tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib };
    if (cv.tool === 'hi') f.straight = cv.straight ? 1 : 0;
    if (knownFav(f)) return false;
    var list = recents().filter(function (x) { return favKey(x) !== favKey(f); });
    list.unshift(f);
    list = list.slice(0, RECENT_MAX);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
    return true;
  }

  /*@3.NODJ.36*/
  function legacyFavs() {
    var out = FAV_DEFAULTS.slice(), i;
    var seen = {};
    for (i = 0; i < out.length; i++) seen[favKey(out[i])] = 1;
    try {
      var a = JSON.parse(localStorage.getItem(FAV_KEY) || 'null');
      if (Array.isArray(a)) {
        for (i = 0; i < a.length && out.length < 12; i++) {
          if (!a[i] || seen[favKey(a[i])]) continue;
          seen[favKey(a[i])] = 1;
          out.push(a[i]);
        }
      }
    } catch (e) {}
    return out;
  }

  function favs() {
    try {
      var a = JSON.parse(localStorage.getItem(FAV_KEY3) || 'null');
      if (Array.isArray(a)) {
        var out = [], i;
        for (i = 0; i < a.length && out.length < FAV_MAX; i++) {
          if (a[i] && a[i].tool) out.push(a[i]);
        }
        return out;
      }
    } catch (e) {}
    return legacyFavs();
  }

  function setFavs(a) {
    var out = [], seen = {}, i;
    for (i = 0; i < a.length && out.length < FAV_MAX; i++) {
      if (!a[i] || !a[i].tool) continue;
      var k = favKey(a[i]);
      if (seen[k]) continue;
      seen[k] = 1;
      out.push(a[i]);
    }
    try { localStorage.setItem(FAV_KEY3, JSON.stringify(out)); } catch (e) {}
    return out;
  }

  function resetFavs() {
    try { localStorage.removeItem(FAV_KEY3); } catch (e) {}
    try { localStorage.removeItem(FAV_KEY); } catch (e) {}
  }
  /*@3.NODJ.14*/
  function favKey(f) {
    return [f.tool, f.color, f.width, f.nib,
            f.tool === 'era' ? (f.mode || 'whole') : '',
            f.tool === 'hi' ? (f.straight ? 1 : 0) : ''].join('|');
  }
  function favName(f) {
    var t = null, i;
    for (i = 0; i < RING1.length; i++) if (RING1[i].tool === f.tool) t = RING1[i];
    var tn = t ? L(t.ar, t.en) : f.tool;
    if (f.tool === 'era') {
      return (f.mode === 'part') ? L('ممحاة القلم', 'Pen eraser')
                                 : L('ممحاة ذكيّة', 'Smart eraser');
    }
    if (f.tool === 'lasso' || f.tool === 'sel' || f.tool === 'hand') return tn;
    /*@3.NODJ.50*/
    if (f.tool === 'pen') {
      var nn = null;
      for (i = 0; i < NIBS.length; i++) if (NIBS[i].k === f.nib) nn = L(NIBS[i].ar, NIBS[i].en);
      return (nn || tn) + ' · ' +
             (TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color) +
             ' · ' + f.width;
    }
    if (f.tool === 'hi') {
      return L('تظليل', 'Highlight') + ' · ' +
        (TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color) + ' · ' +
        (f.straight ? L('مستقيم', 'straight') : L('حرّ', 'freehand'));
    }
    var cn = TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color;
    return tn + ' · ' + cn + ' · ' + f.width;
  }

  function readPos() {
    try {
      var p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (p && isFinite(p.x) && isFinite(p.y)) return p;
    } catch (e) {}
    return null;
  }
  function writePos(p) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {}
  }

  function Dial(opts) {
    var o = opts || {};
    this.getCv = o.canvas || function () { return null; };
    this.onExit = o.onExit || function () {};
    this.favHost = o.favHost || null;
    this.open = false;
    this.sub = null;
    this.build();
    this.buildFavs();
    this.place(readPos());
    this.sync();
  }

  /*@3.NODJ.11*/
  Dial.prototype.buildFavs = function () {
    if (!this.favHost) return;
    var dock = document.createElement('div');
    dock.className = 'ndl-dock';
    dock.hidden = true;
    var bar = document.createElement('div');
    bar.className = 'ndl-favs';
    bar.hidden = true;
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', L('مفضّلة القلم', 'Pen favourites'));
    dock.appendChild(bar);
    /*@3.NODJ.67*/
    var cbar = document.createElement('div');
    cbar.className = 'ndl-favs ndl-favs--colors';
    cbar.hidden = !colorsPinned();
    cbar.setAttribute('role', 'toolbar');
    cbar.setAttribute('aria-label', L('ألوانُ القلم', 'Pen colours'));
    dock.appendChild(cbar);
    this.favHost.appendChild(dock);
    this.dock = dock;
    this.favBar = bar;
    this.colorBar = cbar;
    this.paintFavs();
    this.paintColors();

    var self = this;
    cbar.addEventListener('click', function (e) {
      if (self._justSorted) return;
      var cv = self.getCv();
      var sw = e.target.closest('[data-tone]');
      if (sw && cv) { cv.setColor(sw.getAttribute('data-tone')); self.sync(); return; }
      if (e.target.closest('[data-pal]')) { self.cyclePalette(); return; }
      if (e.target.closest('[data-custom]')) { self.pickCustom(e.target.closest('[data-custom]')); }
    });
    this.bindSort();

    bar.addEventListener('click', function (e) {
      if (self._justSorted) return;
      if (e.target.closest('[data-pincol]')) { self.togglePin(); return; }
      var star = e.target.closest('[data-fav-star]');
      if (star) { self.toggleFav(); return; }
      var hb = e.target.closest('[data-hist]');
      if (hb) {
        var hcv = self.getCv();
        if (hcv) {
          if (hb.getAttribute('data-hist') === 'undo') {
            if (hcv.hist) hcv.hist.undo(); else if (hcv.undo) hcv.undo();
          } else if (hcv.hist) { hcv.hist.redo(); } else if (hcv.redo) { hcv.redo(); }
        }
        self.sync();
        return;
      }
      if (e.target.closest('[data-palm]')) { self.cyclePalm(); return; }
      if (e.target.closest('[data-tilt]')) { self.toggleTilt(); return; }
      if (e.target.closest('[data-penbtn]')) { self.penBtnDialog(); return; }
      var szb = e.target.closest('[data-fixsize]');
      if (szb) { self.sizePop(szb); return; }
      /*@3.NODJ.42*/
      var clb = e.target.closest('[data-fixcol]');
      if (clb) { self.colorPop(clb); return; }
      var fix = e.target.closest('[data-fix]');
      var rec = fix ? null : e.target.closest('[data-recent]');
      var chip = fix || rec || e.target.closest('[data-fav]');
      if (!chip) return;
      var f = fix ? FAV_FIXED[Number(fix.getAttribute('data-fix'))]
            : rec ? recents()[Number(rec.getAttribute('data-recent'))]
                  : favs()[Number(chip.getAttribute('data-fav'))];
      var cv = self.getCv();
      if (!f || !cv) return;
      if (f.tool === 'era' && cv.setEraseMode) cv.setEraseMode(f.mode || 'whole');
      if (f.tool === 'hi' && cv.setStraight) cv.setStraight(!!f.straight);
      cv.setTool(f.tool);
      /*@3.NODJ.19*/
      if (!INKY[f.tool]) { self.sync(); return; }
      cv.setColor(f.color);
      cv.setWidth(f.width);
      cv.setNib(f.nib);
      self.sync();
    });

    /*@3.NODJ.60*/
    bar.addEventListener('contextmenu', function (e) {
      if (e.target.closest('[data-hist],[data-palm],[data-tilt],[data-penbtn]')) return;
      e.preventDefault();
      self.favPop(e.target.closest('[data-fav],[data-recent]'), e.clientX, e.clientY);
    });
    var hold = null, hx = 0, hy = 0;
    bar.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      if (e.target.closest('[data-hist],[data-palm],[data-tilt],[data-penbtn]')) return;
      hx = e.clientX; hy = e.clientY;
      var chip = e.target.closest('[data-fav],[data-recent]');
      if (hold) clearTimeout(hold);
      hold = setTimeout(function () {
        hold = null;
        if (self._sorting) return;
        self.favPop(chip, hx, hy);
      }, 520);
    }, { passive: true });
    var drop = function (e) {
      if (!hold) return;
      if (e && e.clientX != null &&
          (Math.abs(e.clientX - hx) > 10 || Math.abs(e.clientY - hy) > 10)) {
        clearTimeout(hold); hold = null; return;
      }
      if (e && e.type !== 'pointermove') { clearTimeout(hold); hold = null; }
    };
    bar.addEventListener('pointermove', drop, { passive: true });
    bar.addEventListener('pointerup', drop, { passive: true });
    bar.addEventListener('pointercancel', drop, { passive: true });
  };

  /*@3.NODJ.61*/
  function favRow(act, icon, ar, en, off) {
    return '<button type="button" class="ndl-favp-i" data-fx="' + act + '"' +
      (off ? ' disabled' : '') + '>' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + esc(L(ar, en)) + '</span></button>';
  }

  Dial.prototype.closeFavPop = function () {
    if (!this._fvPop) return;
    if (this._fvPop.parentNode) this._fvPop.parentNode.removeChild(this._fvPop);
    this._fvPop = null;
    if (this._fvOut) { document.removeEventListener('pointerdown', this._fvOut, true); this._fvOut = null; }
  };

  Dial.prototype.favPop = function (chip, x, y) {
    var self = this;
    this.closeFavPop();
    this.closeSizePop();
    this.closeColorPop();
    var list = favs();
    var isRec = !!(chip && chip.hasAttribute('data-recent'));
    var ix = chip ? Number(chip.getAttribute(isRec ? 'data-recent' : 'data-fav')) : -1;
    var cur = this.current();
    var h = '';
    if (isRec) {
      h += favRow('add', 'fa-star', 'أضِفْ إلى المفضّلة', 'Add to favourites');
    } else if (ix >= 0 && list[ix]) {
      h += '<div class="ndl-favp-h">' + esc(favName(list[ix])) + '</div>';
      h += favRow('put', 'fa-arrow-down-to-line',
                  'ضَعِ الأداةَ الحاليّةَ مكانَها', 'Replace with current tool', !cur);
      h += favRow('back', 'fa-arrow-right-long', 'حرّكْ قبلَها', 'Move earlier', ix <= 0);
      h += favRow('fwd', 'fa-arrow-left-long', 'حرّكْ بعدَها', 'Move later',
                  ix >= list.length - 1);
      h += favRow('del', 'fa-trash', 'أزِلْها', 'Remove');
      h += '<div class="ndl-favp-sep" aria-hidden="true"></div>';
    }
    if (!isRec) {
      h += favRow('add', 'fa-plus', 'أضِفِ الأداةَ الحاليّة', 'Add current tool', !cur);
      h += favRow('reset', 'fa-rotate-left', 'أعِدِ المفضّلةَ الافتراضيّة', 'Reset favourites');
    }
    var pop = document.createElement('div');
    pop.className = 'ndl-favpop';
    pop.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    pop.innerHTML = h;
    document.body.appendChild(pop);
    var w = pop.offsetWidth || 210, hh = pop.offsetHeight || 120;
    pop.style.insetBlockStart = Math.round(Math.max(8, Math.min(innerHeight - hh - 8, y + 6))) + 'px';
    pop.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, x - w / 2))) + 'px';
    pop.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fx]');
      if (!b || b.disabled) return;
      self.favAct(b.getAttribute('data-fx'), ix, isRec);
      self.closeFavPop();
    });
    this._fvPop = pop;
    this._fvOut = function (e) { if (pop && !pop.contains(e.target)) self.closeFavPop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._fvOut, true); }, 0);
    return pop;
  };

  /*@3.NODJ.62*/
  Dial.prototype.favAct = function (act, ix, isRec) {
    var list = favs();
    if (act === 'reset') {
      resetFavs();
    } else if (act === 'add') {
      var f = isRec ? recents()[ix] : this.current();
      if (!f) return false;
      var key = favKey(f), i;
      for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) return false;
      list.splice(ix >= 0 && !isRec ? ix : list.length, 0, f);
      setFavs(list);
    } else if (act === 'del') {
      if (!(ix >= 0) || !list[ix]) return false;
      list.splice(ix, 1);
      setFavs(list);
    } else if (act === 'put') {
      var c = this.current();
      if (!c || !(ix >= 0)) return false;
      list[ix] = c;
      setFavs(list);
    } else if (act === 'back' || act === 'fwd') {
      var to = act === 'back' ? ix - 1 : ix + 1;
      if (!(ix >= 0) || to < 0 || to >= list.length) return false;
      var t = list[ix]; list[ix] = list[to]; list[to] = t;
      setFavs(list);
    } else return false;
    this.paintFavs();
    this.sync();
    return true;
  };

  /*@3.NODJ.15*/
  /*@3.NODJ.49*/
  function favIcon(f) {
    if (f.tool === 'era') return f.mode === 'part' ? ICONS.eraserPen : ICONS.eraserSmart;
    if (f.tool === 'hi') return f.straight ? ICONS.hiStraight : ICONS.hiWave;
    if (f.tool === 'lasso') return LASSO_SVG;
    if (f.tool === 'pen') return NIB_ICON[f.nib] || NIB_ICON.round;
    var t = null, k;
    for (k = 0; k < RING1.length; k++) if (RING1[k].tool === f.tool) t = RING1[k];
    if (t && t.html) return t.html;
    return '<i class="fa-solid ' + ((t && t.icon) || 'fa-pen') + '" aria-hidden="true"></i>';
  }

  /*@3.NODJ.44*/
  function sizeChip(cv) {
    var w = (cv && cv.width) || 4;
    var nib = (cv && cv.nib) || 'round';
    var bar = Math.max(1.5, Math.min(7, w * 0.55));
    var nm = null, i;
    for (i = 0; i < NIBS.length; i++) if (NIBS[i].k === nib) nm = NIBS[i];
    var name = L('رأسُ القلم وسماكتُه', 'Pen nib and thickness') +
      (nm ? ' — ' + L(nm.ar, nm.en) + ' · ' + w : '');
    return '<button type="button" class="ndl-fav ndl-fav-size" data-fixsize="1"' +
      ' aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      '<span class="ndl-nib-i" aria-hidden="true">' + (NIB_ICON[nib] || NIB_ICON.round) + '</span>' +
      '<span class="ndl-nib-w" aria-hidden="true" style="block-size:' + bar.toFixed(1) + 'px"></span>' +
      '</button>';
  }

  function curHex(cv) {
    if (!cv) return hexOf('ink');
    var K = window.GardenCanvas;
    if (cv.tool === 'hi' && K && K.hiHexOf) return K.hiHexOf(cv.color);
    return hexOf(cv.color);
  }

  function colorChip(cv) {
    var name = L('لونُ القلم', 'Pen colour');
    return '<button type="button" class="ndl-fav ndl-fav-col" data-fixcol="1"' +
      ' aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      '<span class="ndl-col-dot" style="--t:' + curHex(cv) + '"></span>' +
      '</button>';
  }

  /*@3.NODJ.43*/
  var RAMP = [0.78, 0.58, 0.40, 0.22, 0, -0.18, -0.34, -0.50, -0.66];

  function shadesOf(tone, cv) {
    var K = window.GardenCanvas;
    var base = (cv && cv.tool === 'hi' && K && K.hiHexOf) ? K.hiHexOf(tone) : hexOf(tone);
    var mix = K && K.mixHex;
    return RAMP.map(function (k) {
      if (!k) return { hex: base, base: 1 };
      if (!mix) return { hex: base, base: 0 };
      return { hex: mix(base, k > 0 ? '#ffffff' : '#000000', Math.abs(k)), base: 0 };
    });
  }

  /*@3.NODJ.21*/
  /*@3.NODJ.51*/
  function favChip(f, attr, i) {
    var plain = f.tool === 'era' || f.tool === 'lasso' || f.tool === 'sel' || f.tool === 'hand';
    var inky = f.tool === 'pen' || f.tool === 'hi';
    var bar = inky
      ? '<span class="ndl-nib-w" aria-hidden="true" style="block-size:' +
        Math.max(1.5, Math.min(7, (f.width || 4) * (f.tool === 'hi' ? 0.16 : 0.55))).toFixed(1) +
        'px"></span>'
      : '';
    return '<button type="button" class="ndl-fav' + (inky ? ' ndl-fav-ink' : '') + '" ' +
      attr + '="' + i + '"' +
      (plain ? '' : ' data-tint="1" style="--t:' + hexOf(f.color) + '"') +
      ' aria-label="' + esc(favName(f)) + '" title="' + esc(favName(f)) + '">' +
      '<span class="ndl-nib-i" aria-hidden="true">' + favIcon(f) + '</span>' + bar +
      '</button>';
  }

  /*@3.NODJ.17*/
  function histChip(k, icon, ar, en) {
    return '<button type="button" class="ndl-fav ndl-fav-opt" data-hist="' + k + '" disabled' +
      ' aria-label="' + esc(L(ar, en)) + '" title="' + esc(L(ar, en)) + '"' +
      ' data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i></button>';
  }

  Dial.prototype.paintFavs = function () {
    if (!this.favBar) return;
    var h = '<span class="ndl-fav-hist">' +
      histChip('undo', 'fa-rotate-left', 'تراجع', 'Undo') +
      histChip('redo', 'fa-rotate-right', 'إعادة', 'Redo') +
      '</span><span class="ndl-fav-sep" aria-hidden="true"></span>';
    h += FAV_FIXED.map(function (f, i) { return favChip(f, 'data-fix', i); }).join('');
    h += colorChip(this.getCv());
    h += sizeChip(this.getCv());
    h += '<span class="ndl-fav-sep" aria-hidden="true"></span>';
    h += favs().map(function (f, i) { return favChip(f, 'data-fav', i); }).join('');
    var rec = recents();
    if (rec.length) {
      h += '<span class="ndl-fav-sep" aria-hidden="true"></span>';
      h += rec.map(function (f, i) { return favChip(f, 'data-recent', i); }).join('');
    }
    var pm = palmNow(this.getCv()), pu = PALM_UI[pm];
    h += '<span class="ndl-fav-tail">';
    var tl = tiltLabel();
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-tilt="1"' +
      ' aria-pressed="' + (tiltNow() === 'auto' ? 'true' : 'false') + '"' +
      ' data-live="' + (tiltNow() === 'auto' && tiltSeen() ? '1' : '0') + '"' +
      ' aria-label="' + esc(L(tl[0], tl[1])) + '" title="' + esc(L(tl[0], tl[1])) + '">' +
      (ICONS.tilt || '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i>') + '</button>';
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-palm="1"' +
      ' aria-label="' + esc(L(pu.ar, pu.en)) + '" title="' + esc(L(pu.ar, pu.en)) + '">' +
      ICONS[pu.icon] + '</button>';
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-penbtn="1"' +
      ' aria-label="' + esc(L('أزرارُ القلم', 'Pen buttons')) + '"' +
      ' title="' + esc(L('أزرارُ القلم', 'Pen buttons')) + '">' + ICONS.penBtn + '</button>';
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-pincol="1"' +
      ' aria-pressed="' + (colorsPinned() ? 'true' : 'false') + '"' +
      ' aria-label="' + esc(L('شريطُ الألوان', 'Colour strip')) + '"' +
      ' title="' + esc(L('شريطُ الألوان — يثبت تحت المفضّلة', 'Colour strip — pinned under favourites')) + '">' +
      '<i class="fa-solid fa-palette" aria-hidden="true"></i></button>';
    h += '<button type="button" class="ndl-fav-star" data-fav-star="1"' +
      ' aria-pressed="false" aria-label="' + esc(L('أضِف للمفضّلة', 'Add to favourites')) + '"' +
      ' title="' + esc(L('أضِف للمفضّلة', 'Add to favourites')) + '">' +
      ICONS.star + '</button></span>';
    this.favBar.innerHTML = h;
    i18n(this.favBar);
  };

  /*@3.NODJ.68*/
  Dial.prototype.paintColors = function () {
    if (!this.colorBar) return;
    var cv = this.getCv();
    var K = window.GardenCanvas;
    var pm = (K && K.paletteMode) ? K.paletteMode() : '';
    var h = toneOrder().map(function (t) {
      var hx = (cv && cv.tool === 'hi' && K && K.hiHexOf) ? K.hiHexOf(t) : hexOf(t);
      var nm = L(TONE_AR[t] || t, TONE_EN[t] || t);
      return '<button type="button" class="ndl-fav ndl-fav-sw" data-tone="' + t + '"' +
        ' style="--t:' + hx + '"' +
        ' aria-pressed="' + (cv && cv.color === t ? 'true' : 'false') + '"' +
        ' aria-label="' + esc(nm) + '" title="' + esc(nm) + '"></button>';
    }).join('');
    h += '<span class="ndl-fav-sep" aria-hidden="true"></span>';
    var pal = pm === 'night'
      ? ['ألوانُ الليل — اضغط لألوانِ النهار', 'Night colours — tap for day colours', 'fa-moon']
      : (pm === 'day'
        ? ['ألوانُ النهار — اضغط للتلقائيّ', 'Day colours — tap for automatic', 'fa-sun']
        : ['الألوانُ تتبع الورقةَ — اضغط لألوانِ الليل', 'Colours follow the paper — tap for night colours',
           'fa-circle-half-stroke']);
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-pal="1"' +
      ' aria-pressed="' + (pm ? 'true' : 'false') + '"' +
      ' aria-label="' + esc(L(pal[0], pal[1])) + '" title="' + esc(L(pal[0], pal[1])) + '">' +
      '<i class="fa-solid ' + pal[2] + '" aria-hidden="true"></i></button>';
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-custom="1"' +
      ' aria-label="' + esc(L('لون مخصّص', 'Custom colour')) + '"' +
      ' title="' + esc(L('لون مخصّص', 'Custom colour')) + '">' +
      '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button>';
    this.colorBar.innerHTML = h;
  };

  Dial.prototype.cyclePalette = function () {
    var K = window.GardenCanvas;
    if (!K || !K.setPalette) return;
    var pm = K.paletteMode();
    K.setPalette(pm === '' ? 'night' : (pm === 'night' ? 'day' : ''));
    var cv = this.getCv();
    if (cv && cv.paint) { try { cv.paint(); } catch (e) {} }
    this.paintFavs();
    this.paintColors();
    this.sync();
  };

  Dial.prototype.togglePin = function () {
    var on = !colorsPinned();
    setColorsPinned(on);
    if (this.colorBar) this.colorBar.hidden = !on;
    var b = this.favBar ? this.favBar.querySelector('[data-pincol]') : null;
    if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  /*@3.NODJ.69*/
  Dial.prototype.bindSort = function () {
    var self = this;
    function wire(bar, sel, onDrop) {
      var st = null, hold = null;
      function start() {
        if (!st || !st.it || st.on) return;
        st.on = true;
        self._sorting = true;
        try { bar.setPointerCapture(st.id); } catch (e2) {}
        var r = st.it.getBoundingClientRect();
        var g = st.it.cloneNode(true);
        g.className += ' ndl-ghost';
        g.style.inlineSize = r.width + 'px';
        g.style.blockSize = r.height + 'px';
        g.style.left = r.left + 'px';
        g.style.top = r.top + 'px';
        document.body.appendChild(g);
        st.g = g;
        st.it.classList.add('is-lifted');
        bar.classList.add('is-sorting');
      }
      function mark(to) {
        var items = [].slice.call(bar.querySelectorAll(sel));
        for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-drop', i === to);
      }
      bar.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        var it = e.target.closest(sel);
        var items = [].slice.call(bar.querySelectorAll(sel));
        st = { id: e.pointerId, it: it, from: it ? items.indexOf(it) : -1,
               x: e.clientX, y: e.clientY, sx: bar.scrollLeft, on: false,
               touch: e.pointerType !== 'mouse', to: null };
        if (hold) clearTimeout(hold);
        hold = null;
        /*@3.NODJ.70*/
        if (it && st.touch) hold = setTimeout(function () { hold = null; if (st) st.armed = true; }, 320);
      });
      bar.addEventListener('pointermove', function (e) {
        if (!st || e.pointerId !== st.id) return;
        var dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!st.on) {
          if (st.touch) {
            if (st.armed && st.it && !self._fvPop && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) { start(); }
            else {
              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                if (hold) { clearTimeout(hold); hold = null; }
                st.armed = false;
                bar.scrollLeft = st.sx - dx;
              }
              return;
            }
          } else {
            if (!st.it || Math.abs(dx) + Math.abs(dy) < 6) return;
            start();
          }
        }
        e.preventDefault();
        st.g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        var items = [].slice.call(bar.querySelectorAll(sel));
        var rtl = getComputedStyle(bar).direction === 'rtl';
        var to = items.length;
        for (var i = 0; i < items.length; i++) {
          var q = items[i].getBoundingClientRect();
          var mid = q.left + q.width / 2;
          if (rtl ? e.clientX > mid : e.clientX < mid) { to = i; break; }
        }
        st.to = to;
        mark(to);
      });
      function end(e) {
        if (!st || e.pointerId !== st.id) return;
        if (hold) { clearTimeout(hold); hold = null; }
        var was = st;
        st = null;
        try { bar.releasePointerCapture(was.id); } catch (e2) {}
        if (!was.on) return;
        self._sorting = false;
        if (was.g && was.g.parentNode) was.g.parentNode.removeChild(was.g);
        bar.classList.remove('is-sorting');
        var items = [].slice.call(bar.querySelectorAll(sel));
        for (var i = 0; i < items.length; i++) items[i].classList.remove('is-drop', 'is-lifted');
        self._justSorted = true;
        setTimeout(function () { self._justSorted = false; }, 0);
        if (e.type !== 'pointerup' || was.to == null) return;
        var to = was.to > was.from ? was.to - 1 : was.to;
        if (to !== was.from) onDrop(was.from, to);
      }
      bar.addEventListener('pointerup', end);
      bar.addEventListener('pointercancel', end);
    }
    if (this.favBar) {
      wire(this.favBar, '[data-fav]', function (from, to) {
        var list = favs();
        var it = list.splice(from, 1)[0];
        list.splice(to, 0, it);
        setFavs(list);
        self.paintFavs();
        self.sync();
      });
    }
    if (this.colorBar) {
      wire(this.colorBar, '[data-tone]', function (from, to) {
        var list = toneOrder();
        var it = list.splice(from, 1)[0];
        list.splice(to, 0, it);
        setToneOrder(list);
        self.paintColors();
      });
    }
  };

  /*@3.NODJ.46*/
  Dial.prototype.rec = function (used) {
    if (!used) return;
    var k = favKey(used);
    if (k === this._lastUsed) return;
    this._lastUsed = k;
    if (noteRecent(used)) this.paintFavs();
  };

  /*@3.NODJ.30*/
  Dial.prototype.sizePop = function (btn) {
    var self = this, cv = this.getCv();
    if (this._szPop) { this.closeSizePop(); return; }
    if (!cv) return;
    var ws = (cv.tool === 'hi') ? HI_W : PEN_W;
    var pop = document.createElement('div');
    pop.className = 'ndl-szpop';
    pop.innerHTML =
      '<div class="ndl-szrow">' + ws.map(function (w) {
        var d = Math.max(4, Math.min(18, w * 1.35));
        return '<button type="button" class="ndl-szb" data-w="' + w + '"' +
          ' aria-pressed="' + (Math.abs(cv.width - w) < 0.01 ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L('سماكة ', 'Width ') + w) + '">' +
          '<span class="ndl-fav-dot" style="inline-size:' + d + 'px;block-size:' + d + 'px"></span>' +
          '</button>';
      }).join('') + '</div>' +
      '<div class="ndl-szrow">' + pickNibs().map(function (n) {
        return '<button type="button" class="ndl-szb" data-nib="' + n.k + '"' +
          ' aria-pressed="' + (cv.nib === n.k ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(n.ar, n.en)) + '" title="' + esc(L(n.ar, n.en)) + '">' +
          (NIB_ICON[n.k] || '') + '</button>';
      }).join('') + '</div>';
    (btn.parentNode || document.body).appendChild(pop);
    var r = btn.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.insetBlockStart = Math.round(Math.min(innerHeight - 110, r.bottom + 6)) + 'px';
    pop.style.left = Math.round(Math.max(8, Math.min(innerWidth - 200, r.left - 70))) + 'px';
    pop.addEventListener('click', function (e) {
      var wb = e.target.closest('[data-w]');
      if (wb) { cv.setWidth(parseFloat(wb.getAttribute('data-w'))); self.closeSizePop(); self.sync(); self.paintFavs(); return; }
      var nb = e.target.closest('[data-nib]');
      if (nb) { cv.setNib(nb.getAttribute('data-nib')); self.closeSizePop(); self.sync(); self.paintFavs(); }
    });
    btn.setAttribute('aria-expanded', 'true');
    this._szPop = pop;
    this._szOut = function (e) { if (pop && !pop.contains(e.target)) self.closeSizePop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._szOut, true); }, 0);
  };

  Dial.prototype.colorPop = function (btn) {
    var self = this, cv = this.getCv();
    if (this._clPop) { this.closeColorPop(); return; }
    if (!cv) return;
    var pop = document.createElement('div');
    pop.className = 'ndl-clpop';
    pop.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    pop.innerHTML =
      '<div class="ndl-clrow" data-role="base">' + MAIN_TONES.map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t + '"' +
          ' style="--t:' + (cv.tool === 'hi' && window.GardenCanvas && GardenCanvas.hiHexOf
                            ? GardenCanvas.hiHexOf(t) : hexOf(t)) + '"' +
          ' aria-pressed="' + (cv.color === t ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
          ' title="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"></button>';
      }).join('') +
      EDGE_TONES.map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t.k + '"' +
          ' style="--t:' + hexOf(t.k) + '"' +
          ' aria-pressed="' + (cv.color === t.k ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(t.ar, t.en)) + '"' +
          ' title="' + esc(L(t.ar, t.en)) + '"></button>';
      }).join('') +
      '<button type="button" class="ndl-clb ndl-clb--more" data-more="1"' +
      ' aria-label="' + esc(L('بقيّةُ الألوان', 'More colours')) + '"' +
      ' title="' + esc(L('بقيّةُ الألوان', 'More colours')) + '">' +
      '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
      '<button type="button" class="ndl-clb ndl-clb--pick" data-custom="1"' +
      ' aria-label="' + esc(L('لون مخصّص', 'Custom colour')) + '"' +
      ' title="' + esc(L('لون مخصّص', 'Custom colour')) + '">' +
      '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button></div>' +
      '<div class="ndl-clrow ndl-clrow--more" data-role="rest" hidden>' +
      TONES.filter(function (t) { return MAIN_TONES.indexOf(t) < 0; }).map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t + '"' +
          ' style="--t:' + (cv.tool === 'hi' && window.GardenCanvas && GardenCanvas.hiHexOf
                            ? GardenCanvas.hiHexOf(t) : hexOf(t)) + '"' +
          ' aria-pressed="' + (cv.color === t ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
          ' title="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"></button>';
      }).join('') + '</div>' +
      '<div class="ndl-clramp" data-role="ramp" hidden></div>';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    var pr = pop.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.insetBlockStart = Math.round(Math.min(innerHeight - pr.height - 8,
                                                    r.bottom + 6)) + 'px';
    pop.style.insetInlineStart = '';
    var left = isAr() ? (r.right - pr.width) : r.left;
    pop.style.left = Math.round(Math.max(8, Math.min(left, innerWidth - pr.width - 8))) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    this._clPop = pop;

    var paintRamp = function (tone) {
      var box = pop.querySelector('[data-role="ramp"]');
      if (!box) return;
      box.hidden = false;
      box.innerHTML = '<span class="ndl-clname">' +
        esc(L(TONE_AR[tone], TONE_EN[tone])) + '</span>' +
        shadesOf(tone, cv).map(function (s) {
          return '<button type="button" class="ndl-clb ndl-clb--sh' + (s.base ? ' is-base' : '') +
            '" data-hex="' + (s.base ? tone : s.hex) + '" style="--t:' + s.hex + '"' +
            ' aria-pressed="' + (cv.color === (s.base ? tone : s.hex) ? 'true' : 'false') + '"' +
            ' aria-label="' + esc(L(TONE_AR[tone], TONE_EN[tone])) + ' ' + s.hex + '"></button>';
        }).join('');
      i18n(box);
    };

    pop.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tone]');
      if (t) {
        var tone = t.getAttribute('data-tone');
        cv.setColor(tone);
        self.sync();
        paintRamp(tone);
        var q = pop.querySelectorAll('[data-tone]');
        for (var i = 0; i < q.length; i++) {
          q[i].setAttribute('aria-pressed', q[i] === t ? 'true' : 'false');
        }
        return;
      }
      var sh = e.target.closest('[data-hex]');
      if (sh) {
        cv.setColor(sh.getAttribute('data-hex'));
        self.sync();
        self.closeColorPop();
        return;
      }
      /*@3.NODJ.57*/
      if (e.target.closest('[data-more]')) {
        var rest = pop.querySelector('[data-role="rest"]');
        if (rest) rest.hidden = !rest.hidden;
        return;
      }
      if (e.target.closest('[data-custom]')) {
        self.closeColorPop();
        self.pickCustom(btn);
      }
    });
    if (typeof cv.color === 'string' && cv.color.charAt(0) !== '#') paintRamp(cv.color);
    this._clOut = function (e) { if (pop && !pop.contains(e.target)) self.closeColorPop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._clOut, true); }, 0);
  };

  Dial.prototype.closeColorPop = function () {
    if (this._clOut) { document.removeEventListener('pointerdown', this._clOut, true); this._clOut = null; }
    if (this._clPop) { try { this._clPop.remove(); } catch (e) {} this._clPop = null; }
    if (this.favBar) {
      var b = this.favBar.querySelector('[data-fixcol]');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  };

  Dial.prototype.closeSizePop = function () {
    if (this._szOut) { document.removeEventListener('pointerdown', this._szOut, true); this._szOut = null; }
    if (this._szPop) { try { this._szPop.remove(); } catch (e) {} this._szPop = null; }
    if (this.favBar) {
      var b = this.favBar.querySelector('[data-fixsize]');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  };

  /*@3.NODJ.48*/
  Dial.prototype.toggleTilt = function () {
    var I = window.GardenInkInput;
    if (!I || !I.setTiltMode) return;
    var next = tiltNow() === 'auto' ? 'off' : 'auto';
    I.setTiltMode(next);
    this.paintFavs();
    this.syncFavs();
    var cv = this.getCv();
    if (cv && cv.paint) cv.paint();
    return next;
  };

  Dial.prototype.cyclePalm = function () {
    var I = window.GardenInkInput;
    if (!I || !I.setPalmMode) return;
    var i = PALM_ORDER.indexOf(palmNow(this.getCv()));
    var next = PALM_ORDER[(i + 1) % PALM_ORDER.length];
    I.setPalmMode(next);
    this.paintFavs();
    this.syncFavs();
    return next;
  };

  /*@3.NODJ.18*/
  /*@3.NODJ.27*/
  Dial.prototype.applyAct = function (act) {
    var cv = this.getCv();
    if (!cv || !act || act === 'none') return false;
    /*@3.NODJ.31*/
    if (!cv.toggleAct) return false;
    var done = cv.toggleAct(act);
    if (done) this.sync();
    return done;
  };

  Dial.prototype.penBtnDialog = function () {
    var I = window.GardenInkInput;
    if (!I || !I.penButtons) return null;
    var map = I.penButtons();
    /*@3.NODJ.34*/
    var stale = document.getElementById('ndl-penbtn');
    if (stale) { try { stale.close(); } catch (e0) {} stale.remove(); }
    var dlg = document.createElement('dialog');
    dlg.id = 'ndl-penbtn';
    dlg.className = 'gsf ndl-penbtn';
    document.body.appendChild(dlg);
    function row(key, ar, en, hint) {
      var opts = PEN_ACTS.map(function (a2) {
        return '<option value="' + a2.k + '"' + (map[key] === a2.k ? ' selected' : '') +
          ' data-gs-name-ar="' + esc(a2.ar) + '" data-gs-name-en="' + esc(a2.en) + '">' +
          esc(L(a2.ar, a2.en)) + '</option>';
      }).join('');
      /*@3.NODJ.22*/
      return '<div class="ndl-pb-row"><span class="ndl-pb-k">' + esc(L(ar, en)) + '</span>' +
        '<select data-gs data-pb="' + key + '" class="gsf-in" aria-label="' +
        esc(L(ar, en)) + '">' + opts + '</select>' +
        '<button type="button" class="ndl-pb-rec" data-rec="' + key + '">' +
        '<i class="fa-solid fa-circle-dot" aria-hidden="true"></i>' +
        '<span>' + esc(L('سجّلْ زرّاً', 'Record a button')) + '</span></button>' +
        '<span class="ndl-pb-h">' + esc(hint) + '</span></div>';
    }

    /*@3.NODJ.23*/
    function keyRow(a2) {
      var k = I.keyFor ? I.keyFor(a2.k) : '';
      return '<div class="ndl-pb-row ndl-pb-row--k"><span class="ndl-pb-k">' +
        esc(L(a2.ar, a2.en)) + '</span>' +
        '<kbd class="ndl-pb-kbd" data-kbd="' + a2.k + '">' +
        esc(k ? k.toUpperCase() : L('—', '—')) + '</kbd>' +
        '<button type="button" class="ndl-pb-rec" data-reck="' + a2.k + '">' +
        '<i class="fa-solid fa-keyboard" aria-hidden="true"></i>' +
        '<span>' + esc(L('سجّلْ مفتاحاً', 'Record a key')) + '</span></button>' +
        '<button type="button" class="ndl-pb-clr" data-clrk="' + a2.k + '" aria-label="' +
        esc(L('امسحِ الاختصار', 'Clear the shortcut')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
    }
    /*@3.NODJ.32*/
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
        esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></form>' +
      '<div class="gsf-body">' +
      '<h3 class="ndl-pb-t">' + esc(L('أزرارُ القلم', 'Pen buttons')) + '</h3>' +
      '<p class="ndl-pb-p">' + esc(L(
        'اضغطْ زرَّ قلمِك مرّةً فتعمل الأداةُ المربوطةُ به، واضغطْه ثانيةً فتعود أداتُك.',
        'Press your pen button once and its tool takes over; press again and your tool returns.')) + '</p>' +
      '<p class="ndl-pb-p">' + esc(L(
        'ولستَ بحاجةٍ لمعرفة اسم زرِّك: اضغطْ «سجّلْ زرّاً» ثمّ اضغطِ الزرَّ نفسَه، ونحن نعرفه.',
        'You need not know which button is which: tap “Record a button”, then press it — we will name it.')) + '</p>' +
      '<p class="ndl-pb-st" data-role="rec-st" role="status" aria-live="polite"></p>' +
      row('barrel', 'الزرُّ الجانبيّ', 'Side button',
          L('الزرُّ الذي يقع تحت الإبهام، وهو أشهرُ ما في الأقلام.',
            'The button under your thumb — the one most pens have.')) +
      row('tip', 'رأسُ الممحاة', 'Eraser end',
          L('في الأقلامِ التي يُقلَبُ طرفُها الخلفيُّ فيمحو.',
            'For pens whose back end erases when you flip them over.')) +
      row('second', 'الزرُّ الثاني', 'Second button',
          L('زرٌّ إضافيٌّ في بعض الأقلام، وقد يلزمه ضبطٌ في برنامجِ القلم.',
            'An extra button on some pens; it may need setting up in the pen’s own software.')) +
      '<p class="ndl-pb-w">' + esc(L(
        'وبعضُ الأقلامِ تُبقي أزرارَها داخلَ عتادِها فلا يصلُ المتصفّحَ منها شيء — فإن لم يُسجَّل زرُّك بعد محاولتين، اربطْ مفتاحاً من لوحة المفاتيح أسفلَه.',
        'Some pens keep their buttons inside their own hardware, so nothing reaches the browser. If yours does not register after two tries, bind a keyboard key below instead.')) + '</p>' +
      /*@3.NODJ.24*/
      '<h3 class="ndl-pb-t">' + esc(L('اختصاراتُ لوحة المفاتيح', 'Keyboard shortcuts')) + '</h3>' +
      '<p class="ndl-pb-p">' + esc(L(
        'مفتاحٌ واحدٌ بلا مُعدِّل، يعمل حين لا تكون تكتب — وهو يبدّل ويعود مثل زرِّ القلم تماماً.',
        'A single key with no modifier, active while you are not typing — it toggles and returns just like a pen button.')) + '</p>' +
      PEN_ACTS.filter(function (a3) { return a3.k !== 'none'; }).map(keyRow).join('') +
      '</div>';
    dlg.addEventListener('change', function (e) {
      var sel = e.target.closest('[data-pb]');
      if (!sel) return;
      var m = {};
      m[sel.getAttribute('data-pb')] = sel.value;
      I.setPenButtons(m);
    });

    /*@3.NODJ.25*/
    var self = this;
    var stopCap = null;
    var capT = null;

    /*@3.NODJ.33*/
    function say(kind, msg) {
      var st = dlg.querySelector('[data-role="rec-st"]');
      if (!st) return;
      st.textContent = msg || '';
      st.setAttribute('data-k', kind || '');
    }

    function arm(btn, kind, done) {
      if (stopCap) { stopCap(); stopCap = null; }
      if (capT) { clearTimeout(capT); capT = null; }
      var span = btn.querySelector('span');
      var was = span ? span.textContent : '';
      btn.classList.add('is-rec');
      if (span) span.textContent = L('في انتظارك…', 'Waiting…');
      say('wait', kind === 'key'
        ? L('اضغطْ أيَّ مفتاحٍ الآن — و‏Esc يلغي.', 'Press any key now — Esc cancels.')
        : L('اضغطْ زرَّ قلمِك الآن — و‏Esc يلغي.', 'Press your pen button now — Esc cancels.'));

      function unarm() {
        if (capT) { clearTimeout(capT); capT = null; }
        stopCap = null;
        btn.classList.remove('is-rec');
        if (span) span.textContent = was;
      }

      capT = setTimeout(function () {
        if (stopCap) { stopCap(); }
        unarm();
        say('warn', kind === 'key'
          ? L('لم تصلْ ضغطةٌ. جرّبْ مرّةً أخرى.', 'No key arrived. Try once more.')
          : L('لم تصلْ ضغطةٌ من قلمك. جرّبْ مرّةً أخرى، أو اربطْ مفتاحاً من لوحة المفاتيح.',
              'Nothing arrived from your pen. Try again, or bind a keyboard key instead.'));
      }, 12000);

      stopCap = I.capture(kind, function (got) {
        unarm();
        if (!got) { say('', L('أُلغي التسجيل.', 'Recording cancelled.')); return; }
        done(got);
      });
    }

    function actName(k) {
      for (var i = 0; i < PEN_ACTS.length; i++) {
        if (PEN_ACTS[i].k === k) return L(PEN_ACTS[i].ar, PEN_ACTS[i].en);
      }
      return k;
    }

    var MOD_NAME = {
      barrel: ['الزرُّ الجانبيّ', 'Side button'],
      tip:    ['رأسُ الممحاة', 'Eraser end'],
      second: ['الزرُّ الثاني', 'Second button']
    };
    function modName(m) {
      var n = MOD_NAME[m];
      return n ? L(n[0], n[1]) : m;
    }

    dlg.addEventListener('click', function (e) {
      var rec = e.target.closest('[data-rec]');
      if (rec) {
        e.preventDefault();
        var forKey = rec.getAttribute('data-rec');
        arm(rec, 'pen', function (got) {
          var cur = dlg.querySelector('[data-pb="' + forKey + '"]');
          var act = cur ? cur.value : 'era';
          var m2 = {};
          m2[got.mod] = act;
          I.setPenButtons(m2);
          var msg = L('سُجِّل: ', 'Recorded: ') + modName(got.mod) +
                    L(' ⇐ ', ' → ') + actName(act);
          var fresh = self.penBtnDialog();
          var st2 = fresh && fresh.querySelector('[data-role="rec-st"]');
          if (st2) { st2.textContent = msg; st2.setAttribute('data-k', 'ok'); }
        });
        return;
      }
      var reck = e.target.closest('[data-reck]');
      if (reck) {
        e.preventDefault();
        var act2 = reck.getAttribute('data-reck');
        arm(reck, 'key', function (got) {
          I.setPenKey(got.key, act2);
          var kb = dlg.querySelector('[data-kbd="' + act2 + '"]');
          if (kb) kb.textContent = got.key.toUpperCase();
          say('ok', L('سُجِّل: ', 'Recorded: ') + got.key.toUpperCase() +
                    L(' ⇐ ', ' → ') + actName(act2));
        });
        return;
      }
      var clr = e.target.closest('[data-clrk]');
      if (clr) {
        e.preventDefault();
        var act3 = clr.getAttribute('data-clrk');
        I.clearPenKey(act3);
        var kb2 = dlg.querySelector('[data-kbd="' + act3 + '"]');
        if (kb2) kb2.textContent = '—';
      }
    });
    dlg.addEventListener('close', function () {
      if (stopCap) { stopCap(); stopCap = null; }
      if (capT) { clearTimeout(capT); capT = null; }
    });
    if (window.GardenSelect && GardenSelect.enhance) {
      try { GardenSelect.enhance(dlg); } catch (e2) {}
    }
    try { dlg.showModal(); } catch (e3) {}
    return dlg;
  };

  Dial.prototype.current = function () {
    var cv = this.getCv();
    if (!cv) return null;
    var f = { tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib };
    if (cv.tool === 'era') f.mode = cv.eraseMode || 'whole';
    if (cv.tool === 'hi') f.straight = cv.hiStraight ? 1 : 0;
    return f;
  };

  Dial.prototype.toggleFav = function () {
    var cur = this.current();
    if (!cur || isFixed(cur)) return;
    var list = favs(), key = favKey(cur), at = -1, i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) at = i;
    if (at >= 0) list.splice(at, 1);
    else list.unshift(cur);
    setFavs(list);
    this.paintFavs();
    this.sync();
  };

  Dial.prototype.syncFavs = function (st) {
    if (!this.favBar) return;
    /*@3.NODJ.52*/
    if (st) {
      var hu = this.favBar.querySelector('[data-hist="undo"]');
      var hr = this.favBar.querySelector('[data-hist="redo"]');
      if (hu) hu.disabled = !st.canUndo;
      if (hr) hr.disabled = !st.canRedo;
    }
    var cur = this.current();
    if (!cur) return;
    var key = favKey(cur), list = favs(), on = false, i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) on = true;
    var chips = this.favBar.querySelectorAll('[data-fav]');
    for (i = 0; i < chips.length; i++) {
      chips[i].setAttribute('aria-pressed',
        favKey(list[Number(chips[i].getAttribute('data-fav'))] || {}) === key ? 'true' : 'false');
    }
    var fixed = this.favBar.querySelectorAll('[data-fix]');
    for (i = 0; i < fixed.length; i++) {
      chips = FAV_FIXED[Number(fixed[i].getAttribute('data-fix'))];
      fixed[i].setAttribute('aria-pressed', favKey(chips) === key ? 'true' : 'false');
    }
    /*@3.NODJ.45*/
    var cb = this.favBar.querySelector('[data-fixcol]');
    if (cb) {
      var tmp = document.createElement('div');
      tmp.innerHTML = colorChip(cur);
      cb.replaceWith(tmp.firstChild);
    }
    var sb = this.favBar.querySelector('[data-fixsize]');
    if (sb) {
      var tmp2 = document.createElement('div');
      tmp2.innerHTML = sizeChip(cur);
      sb.replaceWith(tmp2.firstChild);
    }
    if (this.colorBar) {
      var sws = this.colorBar.querySelectorAll('[data-tone]');
      for (i = 0; i < sws.length; i++) {
        sws[i].setAttribute('aria-pressed', sws[i].getAttribute('data-tone') === cur.color ? 'true' : 'false');
      }
    }
    var star = this.favBar.querySelector('[data-fav-star]');
    if (star) star.hidden = isFixed(cur);
    if (star && !star.hidden) {
      star.setAttribute('aria-pressed', on ? 'true' : 'false');
      star.innerHTML = on ? ICONS.starOff : ICONS.star;
      var lab = on ? ['أزِلْ هذا الإعداد من المفضّلة', 'Remove this setup from favourites']
                   : ['أضِف الإعداد الحاليّ للمفضّلة', 'Add the current setup to favourites'];
      star.setAttribute('aria-label', L(lab[0], lab[1]));
      star.setAttribute('title', L(lab[0], lab[1]));
    }
  };

  Dial.prototype.build = function () {
    var d = document.createElement('div');
    d.className = 'ndl';
    d.setAttribute('data-open', '0');
    d.hidden = true;
    d.innerHTML =
      '<button type="button" class="ndl-hub" aria-expanded="false"' +
      ' aria-label="' + esc(L('لوحة القلم', 'Pen palette')) + '"' +
      ' data-ar-title="لوحة القلم — اسحبها لأيّ مكان"' +
      ' data-en-title="Pen palette — drag it anywhere">' +
      '<i class="fa-solid fa-pen" aria-hidden="true" data-role="hub-i"></i></button>' +
      '<button type="button" class="ndl-z" data-role="zoom" aria-live="polite"' +
      ' aria-label="' + esc(L('التكبير', 'Zoom')) + '"' +
      ' data-ar-title="التكبير" data-en-title="Zoom">100%</button>' +
      '<div class="ndl-ring ndl-ring--1" data-role="r1" hidden></div>' +
      '<div class="ndl-ring ndl-ring--2" data-role="r2" hidden></div>' +
      '<span class="ndl-tip" data-role="tip"></span>';
    document.body.appendChild(d);
    this.el = d;
    this.hub = d.querySelector('.ndl-hub');
    this.zoomBtn = d.querySelector('[data-role="zoom"]');
    this.r1 = d.querySelector('[data-role="r1"]');
    this.r2 = d.querySelector('[data-role="r2"]');
    this.tip = d.querySelector('[data-role="tip"]');
    i18n(d);
    this.paintRing1();
    this.bind();

    var self = this;
    this._themeObs = new MutationObserver(function () {
      self.paintFavs();
      self.paintColors();
      var sub = self.sub;
      if (sub) { self.sub = null; self.openSub(sub); }
      self.sync();
    });
    this._themeObs.observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'data-tinted'] });
  };

  /*@3.NODJ.2*/
  Dial.prototype.arc = function (host, items, radius, cls) {
    var n = items.length;
    var step = 360 / n;
    host.innerHTML = items.map(function (it, i) {
      var a = (-90 + i * step) * Math.PI / 180;
      var x = Math.cos(a) * radius, y = Math.sin(a) * radius;
      return '<button type="button" class="ndl-i' + (it.cls ? ' ' + it.cls : '') + '"' +
        ' style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px' +
        (it.style ? ';' + it.style : '') + '"' +
        ' data-k="' + esc(it.k) + '" data-ar="' + esc(it.ar) + '" data-en="' + esc(it.en) + '"' +
        ' aria-label="' + esc(L(it.ar, it.en)) + '"' +
        (it.pressed ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
        (it.html || '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>') +
        '</button>';
    }).join('');
    if (cls) host.setAttribute('data-kind', cls);
  };

  /*@3.NODJ.64*/
  Dial.prototype.paintRing1 = function () {
    var cv = this.getCv();
    this.arc(this.r1, RING1.filter(function (t) {
      return !t.cap || !!(cv && cv[t.cap]);
    }).map(function (t) {
      return { k: t.k, icon: t.icon, html: t.html, ar: t.ar, en: t.en,
               cls: t.k === 'exit' ? 'ndl-i--danger' : '' };
    }), R1);
  };

  /*@3.NODJ.3*/
  Dial.prototype.subItems = function (kind) {
    var cv = this.getCv();
    if (kind === 'nib') {
      return pickNibs().map(function (n) {
        return { k: 'nib:' + n.k, ar: n.ar, en: n.en,
                 pressed: cv && cv.nib === n.k,
                 html: NIB_ICON[n.k] || ICONS.nibRound };
      });
    }
    if (kind === 'size' || kind === 'hiw') {
      var ws = kind === 'hiw' ? HI_W : PEN_W;
      var out2 = ws.map(function (w) {
        var d = Math.max(4, Math.min(20, kind === 'hiw' ? w * 0.5 : w * 1.5));
        return { k: 'w:' + w, ar: 'سماكة ' + w, en: 'Width ' + w,
                 pressed: cv && cv.width === w,
                 html: '<span class="ndl-dot" style="inline-size:' + d + 'px;block-size:' + d + 'px"></span>' };
      });
      /*@3.NODJ.12*/
      if (kind === 'hiw') {
        /*@3.NODJ.40*/
        var hm = (cv && cv.hiMode) || 'text';
        out2.push({ k: 'hm:text', ar: 'يلتقط سطرَ النصّ ويظلّله', en: 'Snaps to the line of text',
                    pressed: hm === 'text', icon: 'fa-align-center' });
        out2.push({ k: 'hm:line', ar: 'تظليل مستقيم حيثما رسمت', en: 'Straight, wherever you draw',
                    pressed: hm === 'line', html: ICONS.hiStraight });
        out2.push({ k: 'hm:free', ar: 'تظليل حرّ يتبع يدك', en: 'Free highlight that follows your hand',
                    pressed: hm === 'free', html: ICONS.hiWave });
      }
      return out2;
    }
    /*@3.NODJ.13*/
    if (kind === 'era') {
      return [
        { k: 'era:part', html: ICONS.eraserPen, ar: 'ممحاة القلم — تمحو ما تمرّ عليه',
          en: 'Pen eraser — rubs out what it touches',
          pressed: !!(cv && cv.eraseMode === 'part') },
        { k: 'era:whole', html: ICONS.eraserSmart, ar: 'ممحاة ذكيّة — تحذف العنصر كاملاً',
          en: 'Smart eraser — deletes the whole element',
          pressed: !!(cv && cv.eraseMode !== 'part') }
      ];
    }
    if (kind === 'shape') {
      return SHAPES.map(function (s) {
        return { k: 'tool:' + s.k, icon: s.icon, ar: s.ar, en: s.en,
                 pressed: cv && cv.tool === s.k };
      });
    }
    if (kind === 'color') {
      var isHi = !!(cv && cv.tool === 'hi');
      var swHex = function (t) {
        if (isHi && window.GardenCanvas && GardenCanvas.hiHexOf) return GardenCanvas.hiHexOf(t);
        return hexOf(t);
      };
      var out = TONES.map(function (t) {
        return { k: 'c:' + t, ar: TONE_AR[t], en: TONE_EN[t],
                 cls: 'ndl-sw', style: '--t:' + swHex(t),
                 pressed: cv && cv.color === t, html: '' };
      });
      out.push({ k: 'c:custom', icon: 'fa-eye-dropper',
                 ar: 'لون مخصّص', en: 'Custom colour',
                 pressed: !!(cv && typeof cv.color === 'string' && cv.color.charAt(0) === '#') });
      return out;
    }
    if (kind === 'zoom') {
      /*@3.NODJ.8*/
      if (cv && cv.bound) return [];
      return [
        { k: 'z:out', icon: 'fa-magnifying-glass-minus', ar: 'تصغير', en: 'Zoom out' },
        { k: 'z:100', ar: 'حجم أصلي', en: 'Actual size',
          html: '<span class="ndl-n">100%</span>' },
        { k: 'z:in',  icon: 'fa-magnifying-glass-plus', ar: 'تكبير', en: 'Zoom in' },
        { k: 'z:fit', icon: 'fa-crop-simple', ar: 'ملاءمة الصفحة', en: 'Fit page' }
      ];
    }
    return [];
  };

  Dial.prototype.openSub = function (kind) {
    if (this.sub === kind) { this.closeSub(); return; }
    var items = this.subItems(kind);
    if (!items.length) { this.closeSub(); return; }
    this.arc(this.r2, items, R2, kind);
    this.r2.hidden = false;
    this.sub = kind;
    this.clamp();
  };

  Dial.prototype.closeSub = function () {
    this.r2.hidden = true;
    this.r2.innerHTML = '';
    this.sub = null;
  };

  Dial.prototype.setOpen = function (on) {
    this.open = !!on;
    this.el.setAttribute('data-open', this.open ? '1' : '0');
    this.hub.setAttribute('aria-expanded', this.open ? 'true' : 'false');
    this.r1.hidden = !this.open;
    if (!this.open) this.closeSub();
    this.clamp();
  };

  /*@3.NODJ.4*/
  Dial.prototype.place = function (p) {
    var pad = 10;
    var reach = (this.open ? (this.sub ? R2 : R1) : 0) + 26;
    var vw = window.innerWidth, vh = window.innerHeight;
    var x, y;
    if (p) { x = p.x; y = p.y; }
    else { x = isAr() ? (vw - 76) : 76; y = vh - 110; }
    x = Math.max(pad + reach, Math.min(x, vw - pad - reach));
    y = Math.max(pad + reach, Math.min(y, vh - pad - reach));
    if (vw < 2 * (pad + reach)) x = vw / 2;
    if (vh < 2 * (pad + reach)) y = vh / 2;
    this.pos = { x: x, y: y };
    this.el.style.left = Math.round(x) + 'px';
    this.el.style.top = Math.round(y) + 'px';
  };

  Dial.prototype.clamp = function () { this.place(this.pos); };

  Dial.prototype.bind = function () {
    var self = this;

    /*@3.NODJ.26*/
    this._keys = function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || t.tagName === 'INPUT' ||
                t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (t && t.closest && t.closest('dialog[open]')) return;
      var I2 = window.GardenInkInput;
      if (!I2 || !I2.penKeys) return;
      var act = I2.penKeys()[String(e.key || '').toLowerCase()];
      if (!act || act === 'none') return;
      var cv = self.getCv();
      if (!cv) return;
      e.preventDefault();
      self.applyAct(act);
    };
    document.addEventListener('keydown', this._keys);

    /*@3.NODJ.5*/
    var st = null;
    this.hub.addEventListener('pointerdown', function (e) {
      st = { x: e.clientX, y: e.clientY, ox: self.pos.x, oy: self.pos.y, moved: false, id: e.pointerId };
      try { self.hub.setPointerCapture(e.pointerId); } catch (e2) {}
      e.preventDefault();
    });
    this.hub.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && (Math.abs(dx) + Math.abs(dy)) < 6) return;
      st.moved = true;
      self.place({ x: st.ox + dx, y: st.oy + dy });
    });
    var end = function (e) {
      if (!st || e.pointerId !== st.id) return;
      try { self.hub.releasePointerCapture(st.id); } catch (e2) {}
      if (st.moved) writePos(self.pos);
      else self.setOpen(!self.open);
      st = null;
    };
    this.hub.addEventListener('pointerup', end);
    this.hub.addEventListener('pointercancel', function (e) { if (st && e.pointerId === st.id) st = null; });

    this.zoomBtn.addEventListener('click', function () {
      if (!self.open) self.setOpen(true);
      self.openSub('zoom');
    });

    this.r1.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      self.pick(b.getAttribute('data-k'), b);
    });
    this.r2.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      self.pick(b.getAttribute('data-k'), b);
    });

    var hov = function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) { self.tip.setAttribute('data-on', '0'); return; }
      self.tip.textContent = L(b.getAttribute('data-ar') || '', b.getAttribute('data-en') || '');
      self.tip.setAttribute('data-on', '1');
    };
    this.el.addEventListener('pointerover', hov);
    this.el.addEventListener('pointerout', function () { self.tip.setAttribute('data-on', '0'); });

    this._onKey = function (e) {
      if (e.key !== 'Escape' || self.el.hidden) return;
      if (self.sub) { self.closeSub(); return; }
      if (self.open) { self.setOpen(false); }
    };
    document.addEventListener('keydown', this._onKey);

    this._onRestore = function () { self.restore(); };
    this.el.addEventListener('pointerenter', this._onRestore);
    this.hub.addEventListener('click', this._onRestore);

    this._onRz = function () { self.clamp(); };
    window.addEventListener('resize', this._onRz);

    this._onLang = function () {
      i18n(self.el);
      self.paintRing1();
      self.paintFavs();
      if (self.sub) self.openSub(self.sub);
      self.sync();
    };
    document.addEventListener('garden:languageChanged', this._onLang);
  };

  /*@3.NODJ.6*/
  Dial.prototype.pick = function (k, btn) {
    var cv = this.getCv();
    var item = null, i;
    for (i = 0; i < RING1.length; i++) if (RING1[i].k === k) item = RING1[i];

    if (item) {
      if (item.k === 'exit') { this.setOpen(false); this.onExit(); return; }
      if (item.k === 'undo') { if (cv) { if (cv.hist) cv.hist.undo(); else cv.undo(); } this.sync(); return; }
      if (item.k === 'redo') { if (cv) { if (cv.hist) cv.hist.redo(); else cv.redo(); } this.sync(); return; }
      /*@3.NODJ.58*/
      if (item.tool && cv) {
        cv.setTool(item.tool);
        if (item.tool === 'hi' && typeof cv.color === 'string' &&
            cv.color.charAt(0) !== '#') {
          var C1 = window.GardenCanvas;
          var hx = (C1 && C1.hiHexOf) ? C1.hiHexOf(cv.color) : '';
          var pn = (C1 && C1.hexOf) ? C1.hexOf(cv.color) : '';
          if (!hx || hx === pn) cv.setColor('yellow');
        }
      }
      if (item.ring) this.openSub(item.ring);
      else this.closeSub();
      this.sync();
      return;
    }

    if (!cv) return;
    if (k.indexOf('nib:') === 0) { cv.setNib(k.slice(4)); }
    else if (k.indexOf('w:') === 0) { cv.setWidth(parseFloat(k.slice(2))); }
    else if (k.indexOf('tool:') === 0) { cv.setTool(k.slice(5)); }
    else if (k === 'c:custom') this.pickCustom(btn);
    else if (k.indexOf('c:') === 0) { cv.setColor(k.slice(2)); }
    else if (k === 'z:in') cv.setUserZoom(cv.userZ * 1.25);
    else if (k === 'z:out') cv.setUserZoom(cv.userZ / 1.25);
    else if (k.indexOf('era:') === 0) cv.setEraseMode(k.slice(4));
    else if (k.indexOf('str:') === 0) cv.setStraight(k.slice(4) === '1');
    else if (k.indexOf('hm:') === 0 && cv.setHiMode) cv.setHiMode(k.slice(3));
    else if (k === 'z:100') cv.resetZoom();
    else if (k === 'z:fit') cv.resetZoom();
    this.sync();
  };

  /*@3.NODJ.7*/
  Dial.prototype.pickCustom = function (btn) {
    var self = this, cv = this.getCv();
    if (!cv) return;
    var cur = (typeof cv.color === 'string' && cv.color.charAt(0) === '#') ? cv.color : hexOf(cv.color);
    /*@3.NODJ.29*/
    var S = window.GardenSwatch;
    if (S && S.board) {
      S.board(btn || null, cur, function (v, done) {
        cv.setColor(v);
        self.sync();
      });
      return;
    }
    cv.setColor(cur);
    self.sync();
  };

  Dial.prototype.sync = function (st) {
    var cv = this.getCv();
    var s = st || (cv ? {
      tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib,
      zoom: cv.userZ, fit: cv.fitZ, used: cv.used || null,
      canUndo: cv.hist ? cv.hist.canUndo() : !!(cv.undoS && cv.undoS.length),
      canRedo: cv.hist ? cv.hist.canRedo() : !!(cv.redoS && cv.redoS.length)
    } : null);
    if (!s) return;
    if (s.used) this.rec(s.used);

    var hi = this.el.querySelector('[data-role="hub-i"]');
    if (hi) {
      var ic = 'fa-pen', svg = null;
      for (var i = 0; i < RING1.length; i++) {
        if (RING1[i].tool === s.tool) { ic = RING1[i].icon; svg = RING1[i].html || null; }
      }
      for (var j = 0; j < SHAPES.length; j++) if (SHAPES[j].k === s.tool) { ic = SHAPES[j].icon; svg = null; }
      if (s.tool === 'era') {
        svg = (cv && cv.eraseMode === 'part') ? ICONS.eraserPen : ICONS.eraserSmart;
      }
      if (s.tool === 'hi') {
        svg = (cv && cv.hiStraight) ? ICONS.hiStraight : ICONS.hiWave;
      }
      if (svg) hi.outerHTML = '<span class="ni-host" data-role="hub-i">' + svg + '</span>';
      else hi.outerHTML = '<i class="fa-solid ' + ic + '" aria-hidden="true" data-role="hub-i"></i>';
    }
    /*@3.NODJ.53*/
    this.hub.style.color = hexOf(s.color);
    var C0 = window.GardenCanvas;
    var paper = (C0 && C0.paperHex) ? C0.paperHex() : null;
    this.hub.style.setProperty('--ndl-paper', paper || '');
    this.el.style.setProperty('--ndl-paper', paper || '');

    var z = this.zoomBtn;
    if (z) {
      var bound = !!(cv && cv.bound);
      z.textContent = Math.round((bound ? (s.fit || 1) : (s.zoom || 1)) * 100) + '%';
      z.setAttribute('data-ar-title', bound ? 'حجمُ الورقة نسبةً إلى A4' : 'التكبير');
      z.setAttribute('data-en-title', bound ? 'Page size relative to A4' : 'Zoom');
      z.setAttribute('title', L(bound ? 'حجمُ الورقة نسبةً إلى A4' : 'التكبير',
                                bound ? 'Page size relative to A4' : 'Zoom'));
      z.style.cursor = bound ? 'default' : 'pointer';
      /*@3.NODJ.37*/
      z.hidden = bound;
    }

    var q = this.r1.querySelectorAll('[data-k]');
    for (var m = 0; m < q.length; m++) {
      var kk = q[m].getAttribute('data-k'), on = false;
      for (var n = 0; n < RING1.length; n++) {
        if (RING1[n].k === kk && RING1[n].tool && RING1[n].tool === s.tool) on = true;
      }
      if (kk === 'shape') {
        for (var p = 0; p < SHAPES.length; p++) if (SHAPES[p].k === s.tool) on = true;
      }
      if (kk === 'undo') q[m].disabled = !s.canUndo;
      if (kk === 'redo') q[m].disabled = !s.canRedo;
      q[m].setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    this.syncFavs(s);

    if (this.sub) {
      var items = this.subItems(this.sub);
      var sq = this.r2.querySelectorAll('[data-k]');
      for (var t = 0; t < sq.length && t < items.length; t++) {
        sq[t].setAttribute('aria-pressed', items[t].pressed ? 'true' : 'false');
        if (this.sub === 'color') sq[t].style.setProperty('--t', hexOf(s.color === items[t].k.slice(2)
          ? s.color : items[t].k.slice(2)));
      }
    }
  };

  Dial.prototype.show = function (on, drawing) {
    this.el.hidden = !on;
    this.el.setAttribute('data-drawing', drawing ? '1' : '0');
    if (this.dock) this.dock.hidden = !on;
    if (this.favBar) this.favBar.hidden = !on;
    if (on) { this.paintRing1(); this.paintColors(); this.clamp(); this.sync(); }
    else { this.setOpen(false); }
  };

  /*@3.NODJ.16*/
  Dial.prototype.dim = function (on) {
    if (!on) return;
    if (this.open) { this._wasOpen = { open: true, sub: this.sub }; this.setOpen(false); }
  };

  Dial.prototype.restore = function () {
    var w = this._wasOpen;
    if (!w) return;
    this._wasOpen = null;
    this.setOpen(true);
    if (w.sub) this.openSub(w.sub);
  };

  Dial.prototype.destroy = function () {
    if (this._themeObs) { try { this._themeObs.disconnect(); } catch (e) {} }
    document.removeEventListener('keydown', this._onKey);
    /*@3.NODJ.28*/
    if (this._keys) document.removeEventListener('keydown', this._keys);
    if (this._onRestore) this.el.removeEventListener('pointerenter', this._onRestore);
    window.removeEventListener('resize', this._onRz);
    document.removeEventListener('garden:languageChanged', this._onLang);
    if (this.el && this.el.parentNode) this.el.remove();
    if (this.dock && this.dock.parentNode) this.dock.remove();
    else if (this.favBar && this.favBar.parentNode) this.favBar.remove();
  };

  window.GardenNotesDial = {
    mount: function (opts) { return new Dial(opts); },
    RING1: RING1,
    TONES: TONES
  };
})();
