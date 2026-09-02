/*@3.NOEJ.1*/
;(function () {
  'use strict';

  var B = function () { return window.GardenNotesBlocks; };
  var SAN = function () { return window.GardenNotesSanitize; };

  /*@3.NOEJ.45*/
  var TEXTY = { p: 1, h: 1, quote: 1, callout: 1, todo: 1 };
  /*@3.NOEJ.204*/
  var LISTY = { ul: 1, ol: 1, dl: 1 };
  var KEEP = ['dir', 'al', 'ff', 'fs', 'hlb', 'fp', 'wm', 'z', 'zi', 'csc', 'rot', 'ls', 'lsb'];
  /*@3.NOEJ.70*/
  var WIDE = { hr: 1, tbl: 1, ink: 1, gap: 1 };
  var AUTOSAVE_MS = 2000;
  /*@3.NOEJ.214*/
  var PBV = 5;
  /*@3.NOEJ.220*/
  var CUT_SAFE = 10;
  /*@3.NOEJ.281*/
  var WIN_MIN = 300;
  function winSwitch() {
    try {
      var v = localStorage.getItem('garden_notes_win');
      return v === '0' ? 0 : 1;
    } catch (e) { return 1; }
  }
  var WIN_PAD = 1600;
  var WIN_SPAN = 70;
  var TYPE_GROUP_MS = 900;
  var TYPE_GROUP_MAX = 4000;
  var UNDO_MAX = 120;
  /*@3.NOEJ.246*/
  var UNDO_BYTES = 8 * 1024 * 1024;
  var UNDO_MIN = 12;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  /*@3.NOEJ.227*/
  var CAL = {
    note:      { icon: 'fa-circle-info',          ar: 'ملاحظة', en: 'Note' },
    tip:       { icon: 'fa-lightbulb',            ar: 'فائدة',  en: 'Tip' },
    important: { icon: 'fa-star',                 ar: 'مهمّ',    en: 'Important' },
    warning:   { icon: 'fa-triangle-exclamation', ar: 'تحذير',  en: 'Warning' },
    caution:   { icon: 'fa-circle-exclamation',   ar: 'تنبيه',  en: 'Caution' }
  };
  var CAL_ORDER = ['note', 'tip', 'important', 'warning', 'caution'];
  function calKind(b) {
    var k = String((b && b.cal) || 'note').toLowerCase();
    return CAL[k] ? k : 'note';
  }

  var TURN = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph' },
    { ty: 'h', lv: 1, icon: 'fa-heading',        ar: 'عنوان كبير',  en: 'Heading 1' },
    { ty: 'h', lv: 2, icon: 'fa-heading',        ar: 'عنوان متوسط', en: 'Heading 2' },
    { ty: 'h', lv: 3, icon: 'fa-heading',        ar: 'عنوان صغير',  en: 'Heading 3' },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list' },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list' },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do' },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote' },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'صندوق ملاحظة', en: 'Note box',
      extra: { cal: 'note' } },
    { ty: 'callout', icon: 'fa-lightbulb',       ar: 'صندوق فائدة',  en: 'Tip box',
      extra: { cal: 'tip' } },
    { ty: 'callout', icon: 'fa-triangle-exclamation', ar: 'صندوق تحذير', en: 'Warning box',
      extra: { cal: 'warning' } },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code' }
  ];

  /*@3.NOEJ.229*/
  var MMD_EG = 'graph TD\n  A[\u0627\u0644\u0628\u062f\u0627\u064a\u0629] --> ' +
    'B{\u0634\u0631\u0637\u061f}\n  B -->|\u0646\u0639\u0645| ' +
    'C[\u0646\u0641\u0651\u0630]\n  B -->|\u0644\u0627| ' +
    'D[\u062a\u0648\u0642\u0651\u0641]';

  var INSERT = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph',
      eg: { ar: 'نصٌّ عاديّ', en: 'Plain text' } },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list',
      eg: { ar: '• بندٌ أوّل', en: '• First item' } },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list',
      eg: { ar: '١. بندٌ أوّل', en: '1. First item' } },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do',
      eg: { ar: '\u2610 مهمّةٌ تُشطب', en: '\u2610 A task to tick' } },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote',
      eg: { ar: 'كلامٌ منقولٌ عن غيرك', en: 'Words quoted from someone else' } },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'صندوق ملاحظة', en: 'Note box',
      extra: { cal: 'note' },
      eg: { ar: 'أزرق — معلومةٌ جانبيّة', en: 'Blue — a side note' } },
    { ty: 'callout', icon: 'fa-lightbulb',       ar: 'صندوق فائدة',  en: 'Tip box',
      extra: { cal: 'tip' },
      eg: { ar: 'أخضر — حيلةٌ تختصر عليك', en: 'Green — a shortcut' } },
    { ty: 'callout', icon: 'fa-star',            ar: 'صندوق مهمّ',    en: 'Important box',
      extra: { cal: 'important' },
      eg: { ar: 'بنفسجيّ — لا تنسَ هذا', en: 'Violet — do not miss this' } },
    { ty: 'callout', icon: 'fa-triangle-exclamation', ar: 'صندوق تحذير', en: 'Warning box',
      extra: { cal: 'warning' },
      eg: { ar: 'كهرمانيّ — انتبه قبل أن تمضي', en: 'Amber — check before you go on' } },
    { ty: 'callout', icon: 'fa-circle-exclamation', ar: 'صندوق تنبيه', en: 'Caution box',
      extra: { cal: 'caution' },
      eg: { ar: 'أحمر — خطأٌ شائعٌ هنا', en: 'Red — a common mistake' } },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code',
      eg: { ar: 'شِفرةٌ ملوَّنةٌ بلغتها', en: 'Code, coloured by language' } },
    { ty: 'code',    icon: 'fa-diagram-project', ar: 'مخطّط ميرمايد', en: 'Mermaid diagram',
      extra: { lang: 'mermaid', dgm: 1, src: MMD_EG },
      eg: { ar: 'يُرسم فوراً — تدفّقٌ أو تسلسل', en: 'Drawn at once — flow or sequence' } },
    { ty: 'tbl',     icon: 'fa-table',           ar: 'جدول',        en: 'Table',
      eg: { ar: 'رأسُه يتكرّر عند الطباعة', en: 'Its header repeats when printed' } },
    { ty: 'math',    icon: 'fa-square-root-variable', ar: 'معادلة', en: 'Equation',
      eg: { ar: 'LaTeX \u2014 \\sum_{i=1}^{n} i^2', en: 'LaTeX \u2014 \\sum_{i=1}^{n} i^2' } },
    { ty: 'img',     icon: 'fa-image',           ar: 'صورة برابط',  en: 'Image by URL',
      eg: { ar: 'https://\u2026 — لا رفعَ ملفّات', en: 'https://\u2026 — no uploads' } },
    { ty: 'hr',      icon: 'fa-minus',           ar: 'فاصل',        en: 'Divider',
      eg: { ar: 'خطٌّ يفصل قسمين', en: 'A line between sections' } },
    { ty: 'gap',     icon: 'fa-arrows-up-down',  ar: 'فراغ',         en: 'Spacer',
      eg: { ar: 'مسافةٌ بيضاءُ بارتفاعٍ تختاره', en: 'White space you size' } }
  ];

  var MENU = INSERT;

  function clone(o) {
    var out = {}, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    return out;
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /*@3.NOEJ.6*/
  function offsetIn(root, node, off) {
    var n = 0, done = false, res = 0;
    function rec(host) {
      var kids = host.childNodes;
      for (var i = 0; i < kids.length; i++) {
        if (done) return;
        if (host === node && i === off) { res = n; done = true; return; }
        var c = kids[i];
        if (c.nodeType === 3) {
          if (c === node) { res = n + off; done = true; return; }
          n += c.nodeValue.length;
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { n += 1; }
          else rec(c);
        }
      }
      if (!done && host === node && off >= kids.length) { res = n; done = true; }
    }
    if (node === root && off === 0) return 0;
    rec(root);
    return done ? res : n;
  }

  function pointAt(root, pos) {
    var n = 0, hit = null;
    function rec(host) {
      var kids = host.childNodes;
      for (var i = 0; i < kids.length && !hit; i++) {
        var c = kids[i];
        if (c.nodeType === 3) {
          var len = c.nodeValue.length;
          if (pos <= n + len) { hit = { node: c, off: pos - n }; return; }
          n += len;
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') {
            if (pos <= n) { hit = { node: host, off: i }; return; }
            n += 1;
          } else rec(c);
        }
      }
    }
    rec(root);
    if (hit) return hit;
    return { node: root, off: root.childNodes.length };
  }

  /*@3.NOEJ.105*/
  var ANCHOR_SEL = '.ne-text, .ne-li, .ne-cell, .ne-code';
  function selectRange(root, a, b) {
    var p1 = pointAt(root, a), p2 = pointAt(root, b);
    var r = document.createRange();
    try {
      r.setStart(p1.node, p1.off);
      r.setEnd(p2.node, p2.off);
    } catch (e) { return; }
    var s = window.getSelection();
    s.removeAllRanges(); s.addRange(r);
  }

  function runsLen(rt) {
    var n = 0;
    for (var i = 0; i < (rt || []).length; i++) n += (rt[i].s || '').length;
    return n;
  }

  /*@3.NOEJ.7*/
  function sliceRuns(rt, a, b) {
    var before = [], mid = [], after = [], pos = 0;
    for (var i = 0; i < (rt || []).length; i++) {
      var r = rt[i], s = r.s || '', len = s.length;
      var st = pos, en = pos + len;
      pos = en;
      if (en <= a) { before.push(r); continue; }
      if (st >= b) { after.push(r); continue; }
      if (st < a) before.push(Object.assign({}, r, { s: s.slice(0, a - st) }));
      var ms = Math.max(a, st), me = Math.min(b, en);
      if (me > ms) mid.push(Object.assign({}, r, { s: s.slice(ms - st, me - st) }));
      if (en > b) after.push(Object.assign({}, r, { s: s.slice(b - st) }));
    }
    return [before, mid, after];
  }

  function joinRuns(parts) {
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var arr = parts[i];
      for (var j = 0; j < arr.length; j++) {
        var r = arr[j];
        if (!r.s) continue;
        var last = out[out.length - 1];
        if (last && sameStyle(last, r)) { last.s += r.s; continue; }
        out.push(Object.assign({}, r));
      }
    }
    return out;
  }

  /*@3.NOEJ.108*/
  function sameStyle(a, b) { return B().sameRun(a, b); }

  function wordBounds(rt, pos) {
    var txt = B().runsToText(rt);
    if (!txt) return null;
    var a = pos, b = pos;
    var isW = function (ch) { return ch && !/[\s.,;:!?()[\]{}"'،؛؟—–-]/.test(ch); };
    while (a > 0 && isW(txt.charAt(a - 1))) a--;
    while (b < txt.length && isW(txt.charAt(b))) b++;
    return b > a ? [a, b] : null;
  }

  function Editor(host, doc, opts) {
    this.host = host;
    this.opts = opts || {};
    this.doc = B().normalize(doc);
    this.hist = this.opts.hist || null;
    this.undo = [];
    this.redo = [];
    this.saveTimer = null;
    this.dirty = false;
    this.focusEd = null;
    this.lastSel = null;
    this.root = el('div', 'ne-root');
    this.root.__ed = this;
    this.host.innerHTML = '';
    this.host.appendChild(this.root);
    this.render();
    var selfE = this;
    needEmoji().then(function () { selfE.emojiSweep(); });
    if (document.fonts && document.fonts.ready) {
      /*@3.NOEJ.156*/
      var engSettle = function () {
        if (selfE._engRecap) {
          selfE._engRecap = false;
          selfE.captureEng();
          if (selfE.doc.eng && selfE.opts.onSave) selfE.opts.onSave(selfE.doc, true);
        } else {
          selfE.applyEng();
        }
      };
      this._onFaces = engSettle;
      document.fonts.ready.then(function () { if (selfE._onFaces) engSettle(); });
      try { document.fonts.addEventListener('loadingdone', engSettle); } catch (eL) {}
    }
    this.bind();
    this.watch();
    this.bindDrag();
    this.bindImgPan();
    this.bindFreeCleanup();
  }

  /*@3.NOEJ.235*/
  Editor.prototype.settled = function () {
    var self = this;
    clearTimeout(this._setT);
    this._setT = setTimeout(function () {
      if (self._destroyed || !self.root || !self.root.isConnected) return;
      self._engStale = true;
      self.captureEng();
      if (self.doc.eng && self.opts.onSave) self.opts.onSave(self.doc, true);
    }, 180);
  };

  Editor.prototype.snapshot = function () { return JSON.stringify(this.doc); };

  /*@3.NOEJ.2*/
  Editor.prototype.pushUndo = function (before) {
    this.undo.push(before);
    if (this.undo.length > UNDO_MAX) this.undo.shift();
    this._undoB = (this._undoB || 0) + (before ? before.length : 0);
    while (this._undoB > UNDO_BYTES && this.undo.length > UNDO_MIN) {
      var gone = this.undo.shift();
      this._undoB -= gone ? gone.length : 0;
    }
    this.redo.length = 0;
    this._tg = null;
    if (this.hist) this.hist.note('ed');
  };

  Editor.prototype.typeGroup = function (bid) {
    var now = Date.now(), g = this._tg;
    if (g && g.bid === bid && (now - g.last) < TYPE_GROUP_MS &&
        (now - g.start) < TYPE_GROUP_MAX) { g.last = now; return; }
    this.pushUndo(this.snapshot());
    this._tg = { bid: bid, start: now, last: now };
  };

  /*@3.NOEJ.320*/
  Editor.prototype.renderMany = function (ids) {
    if (!ids || !ids.length) return true;
    var fresh = [], i, id, node, hit, anyFree = false;
    this._sw = 0;
    this.sheetW();
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      hit = this.blockAt(id);
      if (!hit) return false;
      node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
      if (!node) {
        if (this._win) continue;
        return false;
      }
      this.dropCanvas(id);
      var made = this.renderBlock(hit.b);
      this.roDrop(node);
      this.root.replaceChild(made, node);
      this.roAdd(made);
      fresh.push(made);
      if (hit.b.fp) anyFree = true;
    }
    if (this.natSync(fresh) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    if (anyFree) this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.319*/
  function shellSig(doc) {
    var out = {}, k;
    for (k in doc) {
      if (!Object.prototype.hasOwnProperty.call(doc, k)) continue;
      if (k === 'blocks' || k === 'eng') continue;
      out[k] = doc[k];
    }
    try { return JSON.stringify(out); } catch (e) { return null; }
  }

  var PATCH_SPAN = 400;
  var PATCH_EDIT = 60;

  Editor.prototype.applyDoc = function (next) {
    if (!next || !Array.isArray(next.blocks) || !next.blocks.length) return false;
    if (this.doc.kind !== next.kind) return false;
    /*@3.NOEJ.322*/
    if (!this._nat || !this.natOk()) return false;
    var sh = shellSig(this.doc);
    if (sh == null || sh !== shellSig(next)) return false;

    var a = this.doc.blocks, b = next.blocks;
    var n = a.length, m = b.length, i, j;
    var p = 0;
    while (p < n && p < m && a[p].id === b[p].id) p++;
    var s = 0;
    while (s < n - p && s < m - p && a[n - 1 - s].id === b[m - 1 - s].id) s++;
    var delN = n - p - s, addN = m - p - s;
    if (delN + addN > PATCH_SPAN) return false;

    var changed = [];
    for (i = 0; i < p; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) changed.push(b[i].id);
      if (changed.length > PATCH_EDIT) return false;
    }
    for (j = 0; j < s; j++) {
      if (JSON.stringify(a[n - 1 - j]) !== JSON.stringify(b[m - 1 - j])) {
        changed.push(b[m - 1 - j].id);
      }
      if (changed.length > PATCH_EDIT) return false;
    }

    var delIds = [], addIds = [], addBlocks = [];
    for (i = p; i < p + delN; i++) delIds.push(a[i].id);
    for (i = p; i < p + addN; i++) { addIds.push(b[i].id); addBlocks.push(b[i]); }

    /*@3.NOEJ.323*/
    this.doc = next;

    for (i = 0; i < delIds.length; i++) {
      var gone = this.root.querySelector(':scope > [data-bid="' + delIds[i] + '"]');
      if (!gone) continue;
      this.dropCanvas(delIds[i]);
      this.roDrop(gone);
      gone.parentNode.removeChild(gone);
    }

    if (!this.natSplice(p, delN, addIds)) {
      this._nat = null;
      this._engStale = true;
      this.render();
      return true;
    }
    for (i = 0; i < addBlocks.length; i++) {
      if (!addBlocks[i].fp) continue;
      this._nat.gap[p + i] = null;
      this._nat.hgt[p + i] = 0;
    }

    if (this._win) {
      this.reflowEng();
      this.winApply(true);
    } else {
      this._sw = 0;
      this.sheetW();
      var frag = document.createDocumentFragment();
      for (i = 0; i < addBlocks.length; i++) frag.appendChild(this.renderBlock(addBlocks[i]));
      var fresh = [].slice.call(frag.children);
      var nx = this.doc.blocks[p + addN];
      var anchor = nx
        ? this.root.querySelector(':scope > [data-bid="' + nx.id + '"]')
        : null;
      if (!anchor) {
        anchor = (this._winB && this._winB.parentNode === this.root)
          ? this._winB : this.root.querySelector(':scope > .ne-tail');
      }
      if (anchor) this.root.insertBefore(frag, anchor);
      else this.root.appendChild(frag);
      for (i = 0; i < fresh.length; i++) this.roAdd(fresh[i]);
      if (this.natSync(fresh) && this.natOk()) this.reflowEng();
      else this.applyEng();
    }

    if (!this.renderMany(changed)) { this.render(); return true; }
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.321*/
  Editor.prototype.diffSite = function (a, b) {
    var n = a.length, m = b.length, p = 0;
    while (p < n && p < m && a[p].id === b[p].id) p++;
    if (p < m) return b[p].id;
    /*@3.NOEJ.324*/
    if (p < n) return '';
    for (var i = 0; i < m; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return b[i].id;
    }
    return '';
  };

  Editor.prototype.swapDoc = function (next) {
    var site = '';
    try { site = this.diffSite(this.doc.blocks, next.blocks); } catch (eS) { site = ''; }
    if (!this.applyDoc(next)) {
      this.doc = next;
      this.render();
    }
    if (site && this.blockAt(site)) {
      this.touchAct(site);
      this.focusBlock(site);
    }
  };

  Editor.prototype.doUndo = function () {
    this._tg = null;
    if (!this.undo.length) return false;
    var cur = this.snapshot();
    this.redo.push(cur);
    var popped = this.undo.pop();
    this._undoB = Math.max(0, (this._undoB || 0) - (popped ? popped.length : 0));
    this.swapDoc(JSON.parse(popped));
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.doRedo = function () {
    this._tg = null;
    if (!this.redo.length) return false;
    var cur = this.snapshot();
    this.undo.push(cur);
    this._undoB = (this._undoB || 0) + cur.length;
    this.swapDoc(JSON.parse(this.redo.pop()));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.253*/
  Editor.prototype.softTouch = function () {
    if (!this._ro || !this.natOk() || !this.doc.eng || this._engStale) {
      this.touch();
      return;
    }
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    if (this.opts.onLayout) this.opts.onLayout();
    this.mark();
  };

  Editor.prototype.touch = function (soft) {
    this._engStale = true;
    /*@3.NOEJ.181*/
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    if (this._engOn) this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
    this.mark(soft);
  };

  /*@3.NOEJ.211*/
  Editor.prototype.mark = function (soft) {
    this.dirty = true;
    if (!soft) {
      this._loud = 1;
      if (this.opts.onDirty) this.opts.onDirty();
    }
    this.arm();
  };

  /*@3.NOEJ.212*/
  Editor.prototype.arm = function () {
    clearTimeout(this.saveTimer);
    var self = this;
    this.saveTimer = setTimeout(function () {
      if (self.opts.busy && self.opts.busy()) { self.arm(); return; }
      self.save();
    }, AUTOSAVE_MS);
  };

  Editor.prototype.save = function () {
    clearTimeout(this.saveTimer);
    this.readAll();
    for (var pi = this.doc.blocks.length - 1; pi >= 0; pi--) {
      var pb = this.doc.blocks[pi];
      if (!pb.prov) continue;
      if (this.blockHolds(pb, null)) delete pb.prov;
      else if (!this.caretInside(pb, null)) this.doc.blocks.splice(pi, 1);
    }
    if (!this.doc.blocks.length) this.doc.blocks.push(B().blank('p'));
    this.dirty = false;
    this.captureEng();
    var loud = !!this._loud;
    this._loud = 0;
    if (this.opts.onSave) this.opts.onSave(this.doc, !loud);
    return this.doc;
  };

  /*@3.NOEJ.230*/
  Editor.prototype.blockAt = function (id) {
    var bs = this.doc.blocks, i;
    var ix = this._bidx;
    if (ix && ix.n === bs.length) {
      i = ix.m[id];
      if (i != null && bs[i] && bs[i].id === id) return { b: bs[i], i: i };
    }
    var m = {};
    for (i = 0; i < bs.length; i++) m[bs[i].id] = i;
    this._bidx = { n: bs.length, m: m };
    i = m[id];
    return (i == null) ? null : { b: bs[i], i: i };
  };

  /*@3.NOEJ.225*/
  var LIVE_TY = { img: 1, code: 1, math: 1, ink: 1, free: 1 };

  Editor.prototype.watch = function () {
    if (this._mo || typeof MutationObserver !== 'function') return;
    var self = this;
    this._dirty = null;
    this._mo = new MutationObserver(function (recs) { self.soil(recs); });
    this._mo.observe(this.root, { subtree: true, childList: true,
                                  characterData: true, attributes: true });
  };

  Editor.prototype.soil = function (recs) {
    if (this._dirty === null) return;
    for (var i = 0; i < recs.length; i++) {
      if (recs[i].type === 'attributes' &&
          (recs[i].attributeName === 'style' ||
           recs[i].attributeName === 'data-brk-sig')) continue;
      var t = recs[i].target;
      if (t && t.nodeType !== 1) t = t.parentNode;
      var n = (t && t.closest) ? t.closest('[data-bid]') : null;
      if (!n) {
        if (recs[i].type !== 'childList') continue;
        this._dirty = null;
        return;
      }
      this._dirty[n.getAttribute('data-bid')] = 1;
    }
  };

  Editor.prototype.readAll = function () {
    if (this._mo) { try { this.soil(this._mo.takeRecords()); } catch (eM) {} }
    var dirt = this._dirty, i;
    if (dirt) {
      var live = [], bs = this.doc.blocks;
      for (i = 0; i < bs.length; i++) {
        if (dirt[bs[i].id] || LIVE_TY[bs[i].ty] || bs[i].prov) live.push(bs[i].id);
      }
      for (i = 0; i < live.length; i++) {
        var one = this.root.querySelector('[data-bid="' + live[i] + '"]');
        if (one) this.readBlock(one);
      }
    } else {
      var nodes = this.root.querySelectorAll('[data-bid]');
      for (i = 0; i < nodes.length; i++) this.readBlock(nodes[i]);
    }
    if (this._mo) {
      try { this._mo.takeRecords(); } catch (eR) {}
      this._dirty = {};
    }
    return this.doc;
  };

  /*@3.NOEJ.223*/
  Editor.prototype.bidMap = function () {
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    var m = {}, i;
    for (i = 0; i < nodes.length; i++) m[nodes[i].getAttribute('data-bid')] = nodes[i];
    return m;
  };

  /*@3.NOEJ.224*/
  Editor.prototype.scroller = function () {
    var n = this.root.parentNode;
    while (n && n.nodeType === 1) {
      if (n.scrollHeight - n.clientHeight > 4) {
        var ov = '';
        try { ov = getComputedStyle(n).overflowY; } catch (e) {}
        if (ov === 'auto' || ov === 'scroll' || ov === 'overlay') return n;
      }
      n = n.parentNode;
    }
    return null;
  };

  Editor.prototype.readBlock = function (node) {
    if (!node) return;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return;
    var b = hit.b;
    if (b.prov && this.blockHolds(b, node)) this.commitProv(b.id);
    if (TEXTY[b.ty]) {
      var t = node.querySelector('.ne-text');
      if (t) b.rt = B().readRuns(t);
      if (b.ty === 'todo') {
        var cb = node.querySelector('.ne-check');
        b.done = cb && cb.getAttribute('aria-checked') === 'true' ? 1 : 0;
      }
    } else if (LISTY[b.ty]) {
      /*@3.NOEJ.83*/
      var lis = node.querySelectorAll('.ne-li');
      b.items = [].map.call(lis, function (li) {
        var lv = parseInt(li.getAttribute('data-lv') || '0', 10);
        var it = { rt: B().readRuns(li) };
        if (lv > 0) it.lv = Math.min(5, lv);
        /*@3.NOEJ.171*/
        if (li.hasAttribute('data-o')) it.o = li.getAttribute('data-o') === '1' ? 1 : 0;
        return it;
      });
      if (!b.items.length) b.items = [{ rt: [] }];
    } else if (b.ty === 'code') {
      var pre = node.querySelector('.ne-code');
      if (pre) b.src = pre.textContent || '';
      var sel = node.querySelector('.ne-lang');
      if (sel) b.lang = sel.value || '';
    } else if (b.ty === 'math') {
      var ta = node.querySelector('.ne-tex');
      if (ta) b.tex = ta.value || '';
    } else if (b.ty === 'tbl') {
      /*@3.NOEJ.218*/
      var trs = node.querySelectorAll('tr:not([data-brk])');
      b.rows = [].map.call(trs, function (tr) {
        return [].map.call(tr.querySelectorAll('.ne-cell'), function (td) {
          var cell = { rt: B().readRuns(td) };
          var ca = td.getAttribute('data-cal');
          var cvv = td.getAttribute('data-cva');
          if (ca) cell.al = ca;
          if (cvv) cell.va = cvv;
          return cell;
        });
      });
      b.cols = b.rows[0] ? b.rows[0].length : 2;
    } else if (b.ty === 'img') {
      var inp = node.querySelector('.ne-img-url');
      if (inp) b.url = B().httpsOnly(inp.value);
      var alt = node.querySelector('.ne-img-alt');
      if (alt) b.alt = alt.value || '';
    }
  };

  /*@3.NOEJ.35*/
  /*@3.NOEJ.346*/
  function isDiagram(b) {
    if (!b || b.ty !== 'code') return false;
    var raw = String(b.lang || '').trim();
    if (!raw) return false;
    var C = window.GardenNotesCode;
    if (C && C.isMermaid) return C.isMermaid(raw);
    return /^(mermaid|mmd)$/i.test(raw);
  }

  /*@3.NOEJ.348*/
  function langList() {
    if (document.getElementById('ne-langs')) return;
    var C = window.GardenNotesCode;
    var all = (C && C.languages) ? C.languages() : [];
    if (!all.length) return;
    var dl = document.createElement('datalist');
    dl.id = 'ne-langs';
    all.sort();
    for (var i = 0; i < all.length; i++) {
      var o = document.createElement('option');
      o.value = all[i];
      dl.appendChild(o);
    }
    document.body.appendChild(dl);
  }

  var _mmdMod = null;
  function needMermaid() {
    if (window.GardenNotesMermaid) return Promise.resolve(window.GardenNotesMermaid);
    if (_mmdMod) return _mmdMod;
    _mmdMod = new Promise(function (res) {
      var probe = document.querySelector('script[src*="notes-editor.js"]');
      var src = probe ? (probe.getAttribute('src') || '') : '';
      var tag = document.createElement('script');
      tag.src = src.replace(/notes-editor\.js/, 'notes-mermaid.js');
      tag.onload = function () { res(window.GardenNotesMermaid || null); };
      tag.onerror = function () { res(null); };
      document.head.appendChild(tag);
    });
    return _mmdMod;
  }

  /*@3.NOEJ.205*/
  var _emoMod = null;
  function needEmoji() {
    if (window.GardenNotesEmoji) return Promise.resolve(window.GardenNotesEmoji);
    if (_emoMod) return _emoMod;
    _emoMod = new Promise(function (res) {
      var probe = document.querySelector('script[src*="notes-editor.js"]');
      var src = probe ? (probe.getAttribute('src') || '') : '';
      var base = src.replace(/notes-editor\.js.*$/, '');
      var v = src.split('?')[1] || '';
      var tag = document.createElement('script');
      tag.src = base + 'notes-emoji.js' + (v ? ('?' + v) : '');
      tag.onload = function () { res(window.GardenNotesEmoji || null); };
      tag.onerror = function () { res(null); };
      document.head.appendChild(tag);
    });
    return _emoMod;
  }

  /*@3.NOEJ.206*/
  Editor.prototype.emojiSweep = function () {
    var EM = window.GardenNotesEmoji;
    if (!EM || !this.doc || !this.doc.blocks) return false;
    var hit = false;
    function sweep(rt) {
      if (!Array.isArray(rt)) return;
      for (var i = 0; i < rt.length; i++) {
        var was = rt[i].s;
        if (was == null || was.indexOf(':') < 0) continue;
        var now = EM.replaceIn(was);
        if (now !== was) { rt[i].s = now; hit = true; }
      }
    }
    var bs = this.doc.blocks, i, k, r;
    for (i = 0; i < bs.length; i++) {
      var b = bs[i];
      sweep(b.rt);
      if (b.items) for (k = 0; k < b.items.length; k++) sweep(b.items[k].rt);
      if (b.rows) {
        for (k = 0; k < b.rows.length; k++) {
          for (r = 0; r < b.rows[k].length; r++) sweep(b.rows[k][r].rt);
        }
      }
    }
    if (hit) { this.render(); this.touch(true); }
    return hit;
  };

  /*@3.NOEJ.244*/
  Editor.prototype.render = function () {
    this._ancSeen = {};
    var self = this;
    this.closeMenu();
    this.closeMention();
    /*@3.NOEJ.197*/
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    /*@3.NOEJ.15*/
    for (var cid in (this.canvases || {})) {
      try { this.canvases[cid].destroy(); } catch (e) {}
    }
    this.canvases = {};
    /*@3.NOEJ.146*/
    this._sw = 0;
    this.sheetW();
    /*@3.NOEJ.302*/
    this._win = null;
    this._winA = null;
    this._winB = null;
    this.root.innerHTML = '';
    /*@3.NOEJ.252*/
    this._nat = null;
    this._natIdx = null;
    this._engStale = true;
    var rng = null;
    if (this.natLoad()) {
      this._engStale = false;
      if (this.winOk()) rng = this.winPin(this.winRange());
    }
    var frag = document.createDocumentFragment();
    if (!rng) this.doc.blocks.forEach(function (b) { frag.appendChild(self.renderBlock(b)); });
    frag.appendChild(this.renderTail());
    this.root.appendChild(frag);
    if (rng) { this.winBind(); this.winSet(rng[0], rng[1]); this.freeSync(); }
    /*@3.NOEJ.254*/
    this.roLater();
    this.paintBlockSel();
    this.layoutFree();
    this.applyReadOnly();
    this.reAct();
    if (this.opts.onLayout) this.opts.onLayout();
  };

  /*@3.NOEJ.147*/
  Editor.prototype.renderInsert = function (at, blocks) {
    var self = this;
    this._sw = 0;
    this.sheetW();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < blocks.length; i++) frag.appendChild(this.renderBlock(blocks[i]));
    var next = this.doc.blocks[at + blocks.length];
    var anchor = next
      ? this.root.querySelector(':scope > [data-bid="' + next.id + '"]')
      : (this._winB && this._winB.parentNode === this.root
         ? this._winB : this.root.querySelector(':scope > .ne-tail'));
    /*@3.NOEJ.301*/
    if (!anchor && this._win) {
      var ids0 = [];
      for (var w = 0; w < blocks.length; w++) ids0.push(blocks[w].id);
      if (!this.natSplice(at, 0, ids0)) { this._nat = null; this._engStale = true; this.settled(); }
      else this.reflowEng();
      this.winApply(true);
      return;
    }
    if (!anchor) { this.render(); return; }
    var fresh = [].slice.call(frag.children);
    this.root.insertBefore(frag, anchor);
    var ids = [];
    for (i = 0; i < blocks.length; i++) ids.push(blocks[i].id);
    if (!this.natSplice(at, 0, ids)) { this._nat = null; this._engStale = true; this.settled(); }
    for (i = 0; i < fresh.length; i++) this.roAdd(fresh[i]);
    /*@3.NOEJ.268*/
    if (this.natSync(fresh) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    if (this.opts.onLayout) this.opts.onLayout();
  };

  /*@3.NOEJ.231*/
  Editor.prototype.renderOne = function (id) {
    var hit = this.blockAt(id);
    if (!hit) { this.render(); return false; }
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    /*@3.NOEJ.291*/
    if (!node && this._win) return true;
    if (!node) { this.render(); return false; }
    this.dropCanvas(id);
    this._sw = 0;
    this.sheetW();
    var fresh = this.renderBlock(hit.b);
    this.roDrop(node);
    this.root.replaceChild(fresh, node);
    this.roAdd(fresh);
    /*@3.NOEJ.269*/
    if (this.natSync([fresh]) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    if (hit.b.fp) this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.232*/
  Editor.prototype.renderDrop = function (id) {
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    /*@3.NOEJ.292*/
    if (!node && this._win) {
      var ixW = this.natIdx();
      var atW = ixW ? ixW[id] : null;
      if (atW != null && this.natSplice(atW, 1, [])) { this.reflowEng(); this.winApply(true); return true; }
      this._nat = null; this._engStale = true; this.settled();
      return true;
    }
    if (!node) { this.render(); return false; }
    this.dropCanvas(id);
    this.roDrop(node);
    node.parentNode.removeChild(node);
    var ix = this.natIdx();
    var at = ix ? ix[id] : null;
    if (at != null && this.natSplice(at, 1, [])) {
      if (this.reflowEng()) return true;
    } else { this._nat = null; this._engStale = true; this.settled(); }
    this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  Editor.prototype.dropCanvas = function (id) {
    if (!this.canvases || !this.canvases[id]) return;
    try { this.canvases[id].destroy(); } catch (e) {}
    delete this.canvases[id];
  };

  /*@3.NOEJ.8*/
  Editor.prototype.renderTail = function () {
    var tail = el('button', 'ne-tail', {
      type: 'button',
      'aria-label': L('أضف كتلة في النهاية', 'Add a block at the end')
    });
    tail.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>' +
      B().esc(L('أضف كتلة', 'Add block')) + '</span>';
    return tail;
  };

  /*@3.NOEJ.19*/
  /*@3.NOEJ.29*/
  function appDir() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar' ? 'rtl' : 'ltr'; }
    catch (e) { return 'rtl'; }
  }
  /*@3.NOEJ.153*/
  var DIR_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
  function firstStrong(s, out) {
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFD) ||
          (c >= 0xFE70 && c <= 0xFEFC)) { out.d = 'rtl'; return true; }
      if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) { out.d = 'ltr'; return true; }
    }
    return false;
  }
  function scanRt(rt, out) {
    if (!Array.isArray(rt)) return false;
    for (var i = 0; i < rt.length; i++) {
      if (rt[i] && typeof rt[i].s === 'string' && firstStrong(rt[i].s, out)) return true;
    }
    return false;
  }
  /*@3.NOEJ.183*/
  function blockContentDir(b) {
    if (!b || b.ty === 'code' || b.ty === 'math') return '';
    var out = { d: '' }, j, k;
    if (scanRt(b.rt, out)) return out.d;
    if (Array.isArray(b.items)) {
      for (j = 0; j < b.items.length && !out.d; j++) scanRt(b.items[j] && b.items[j].rt, out);
    }
    if (!out.d && Array.isArray(b.rows)) {
      for (j = 0; j < b.rows.length && !out.d; j++) {
        var row = b.rows[j] || [];
        for (k = 0; k < row.length && !out.d; k++) scanRt(row[k] && row[k].rt, out);
      }
    }
    return out.d;
  }

  /*@3.NOEJ.180*/
  function contentDir(d) {
    if (!d) return '';
    /*@3.NOEJ.184*/
    if (DIR_CACHE && DIR_CACHE.has(d)) return DIR_CACHE.get(d);
    var bs = d.blocks || [], dir = '';
    for (var i = 0; i < bs.length && !dir; i++) dir = blockContentDir(bs[i]);
    if (DIR_CACHE && dir) DIR_CACHE.set(d, dir);
    return dir;
  }

  function docDir(d) {
    if (!d) return appDir();
    if (d.bd === 'rtl' || d.bd === 'ltr') return d.bd;
    return contentDir(d) || appDir();
  }
  /*@3.NOEJ.242*/
  function blockDir(b, d) {
    if (b.ty === 'code') return 'ltr';
    if (b.dir === 'rtl' || b.dir === 'ltr') return b.dir;
    return blockContentDir(b) || docDir(d);
  }

  Editor.prototype.applyStyleAttrs = function (wrap, b) {
    var bd = wrap.querySelector(':scope > .ne-body');
    if (bd) bd.setAttribute('dir', blockDir(b, this.doc));
    if (b.dir && b.dir !== 'auto') wrap.setAttribute('data-dir', b.dir);
    else wrap.removeAttribute('data-dir');
    if (b.al && b.al !== 'start') wrap.setAttribute('data-al', b.al);
    else wrap.removeAttribute('data-al');
    if (b.fs) {
      wrap.setAttribute('data-fs', String(b.fs));
      wrap.style.setProperty('--ne-fs', b.fs + 'px');
    } else {
      wrap.removeAttribute('data-fs');
      wrap.style.removeProperty('--ne-fs');
    }
    if (b.ff) {
      wrap.setAttribute('data-ff', b.ff);
      var css = fontCss(b.ff);
      if (css) wrap.style.setProperty('--ne-ff', '"' + css + '"');
      if (window.GardenTint && GardenTint.fontSheet) { try { GardenTint.fontSheet(); } catch (e) {} }
      /*@3.NOEJ.63*/
      if (css && document.fonts && document.fonts.load) {
        try { document.fonts.load('400 16px "' + css + '"', 'أبجد Abc'); } catch (e) {}
        try { document.fonts.load('700 16px "' + css + '"', 'أبجد Abc'); } catch (e) {}
      }
    } else {
      wrap.removeAttribute('data-ff');
      wrap.style.removeProperty('--ne-ff');
    }
    if (b.ty === 'tbl') wrap.setAttribute('data-tst', b.st || 'head');
    this.applyFree(wrap, b);
    /*@3.NOEJ.38*/
    if (b.ty === 'tbl') {
      if (b.tc) {
        wrap.setAttribute('data-tc', '1');
        wrap.style.setProperty('--ne-tc', toneHex(b.tc));
      } else {
        wrap.removeAttribute('data-tc');
        wrap.style.removeProperty('--ne-tc');
      }
    }
    if (b.hlb) {
      wrap.setAttribute('data-hlb', '1');
      wrap.style.setProperty('--ne-hlb', toneHex(b.hlb));
    } else {
      wrap.removeAttribute('data-hlb');
      wrap.style.removeProperty('--ne-hlb');
    }
  };

  function toneHex(t) {
    if (typeof t === 'string' && t.charAt(0) === '#') {
      return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : t;
    }
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '#888';
  }

  function fontCss(id) { return B().fontCss ? B().fontCss(id) : null; }

  var BULLETS = ['\u2022', '\u25E6', '\u25AA'];

  var AR_ABJAD = ('\u0623\u0628\u062C\u062F\u0647\u0648\u0632\u062D\u0637\u064A' +
                  '\u0643\u0644\u0645\u0646\u0633\u0639\u0641\u0635\u0642\u0631' +
                  '\u0634\u062A\u062B\u062E\u0630\u0636\u0638\u063A').split('');

  function alphaMark(n, ar) {
    if (ar) return AR_ABJAD[(Math.max(1, n) - 1) % AR_ABJAD.length];
    var s = '', k = Math.max(1, n);
    while (k > 0) { k--; s = String.fromCharCode(97 + (k % 26)) + s; k = Math.floor(k / 26); }
    return s;
  }

  var ROMAN = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];

  function romanMark(n) {
    var k = Math.max(1, Math.min(399, n)), s = '', i, guard = 0;
    while (k > 0 && guard++ < 40) {
      for (i = 0; i < ROMAN.length; i++) {
        if (k >= ROMAN[i][0]) { s += ROMAN[i][1]; k -= ROMAN[i][0]; break; }
      }
    }
    return s;
  }

  var OL_SEQ = {
    num:   ['num', 'alpha', 'roman'],
    arnum: ['arnum', 'alpha', 'num'],
    abjad: ['abjad', 'num', 'roman'],
    roman: ['roman', 'num', 'alpha']
  };

  var AR_DIGITS = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';

  function arNum(n) {
    return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }

  var UL_SETS = {
    dot:     ['\u2022', '\u25E6', '\u25AA'],
    dash:    ['\u2013', '\u2013', '\u2013'],
    diamond: ['\u25C6', '\u25C7', '\u25B8']
  };

  /*@3.NOEJ.121*/
  function olMark(n, lv, ar, ls) {
    var seq = OL_SEQ[ls] || OL_SEQ.num;
    var kind = seq[lv % 3], g;
    if (kind === 'num') g = String(n);
    else if (kind === 'arnum') g = arNum(n);
    else if (kind === 'abjad') g = alphaMark(n, true);
    else if (kind === 'alpha') g = alphaMark(n, ar);
    else g = romanMark(n);
    /*@3.NOEJ.134*/
    var tail = (lv >= 3) ? ')' : '.';
    return g + tail;
  }

  function markIsAr(b, dc) {
    var d = blockDir(b, dc);
    if (d === 'rtl') return true;
    if (d === 'ltr') return false;
    return isAr();
  }

  Editor.prototype.renderBlock = function (b) {
    var self = this;
    var dd = this.doc;
    var wrap = el('div', 'ne-b ne-b-' + b.ty, { 'data-bid': b.id, 'data-ty': b.ty });
    /*@3.NOEJ.198*/
    var anc = (b.anc || b.ty === 'h') ? B().anchorOf(b) : '';
    if (anc) {
      if (!this._ancSeen) this._ancSeen = {};
      if (!this._ancSeen[anc]) { this._ancSeen[anc] = 1; wrap.id = anc; }
    }
    this.applyStyleAttrs(wrap, b);


    var body = el('div', 'ne-body');
    /*@3.NOEJ.30*/
    body.setAttribute('dir', blockDir(b, dd));
    wrap.appendChild(body);

    if (TEXTY[b.ty]) {
      if (b.ty === 'callout') {
        var ck = calKind(b);
        wrap.setAttribute('data-cal', ck);
        var chd = el('button', 'ne-cal-h', { type: 'button', contenteditable: 'false',
                                             'data-calh': '1' });
        paintCalHead(chd, ck);
        body.appendChild(chd);
        if (b.rt && b.rt.length && b.rt[0] && b.rt[0].cl) b.rt = b.rt.slice(1);
      }
      if (b.ty === 'todo') {
        var cb = el('button', 'ne-check', {
          type: 'button', role: 'checkbox',
          'aria-checked': b.done ? 'true' : 'false',
          'aria-label': L('تم', 'Done')
        });
        cb.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        body.appendChild(cb);
      }
      /*@3.NOEJ.3*/
      var tag = b.ty === 'h' ? ('h' + (b.lv || 2)) : 'div';
      var t = el(tag, 'ne-text', {
        contenteditable: 'true', dir: blockDir(b, dd),
        spellcheck: 'false', 'data-ph': placeholderFor(b)
      });
      t.innerHTML = B().runsToHtmlBidi(b.rt);
      body.appendChild(t);

    } else if (LISTY[b.ty]) {
      /*@3.NOEJ.81*/
      var isDl = (b.ty === 'dl');
      var list = el(isDl ? 'dl' : (b.ty === 'ul' ? 'ul' : 'ol'),
                    isDl ? 'ne-list ne-dl' : 'ne-list');
      if (b.lsb) list.setAttribute('data-lsb', '1');
      var run = [];
      var arL = markIsAr(b, dd);
      (b.items || []).forEach(function (it) {
        var lv = Math.max(0, Math.min(5, it.lv || 0));
        var li = el(isDl ? (lv ? 'dd' : 'dt') : 'li',
          isDl ? ('ne-li ' + (lv ? 'ne-dd' : 'ne-dt')) : 'ne-li',
          { contenteditable: 'true', dir: blockDir(b, dd),
            spellcheck: 'false', 'data-lv': String(lv) });
        /*@3.NOEJ.170*/
        if (it.o != null) li.setAttribute('data-o', it.o ? '1' : '0');
        li.innerHTML = B().runsToHtmlBidi(it.rt);
        /*@3.NOEJ.109*/
        var blank = B().runsToText(it.rt || []) === '';
        /*@3.NOEJ.169*/
        var ord = (it.o != null) ? !!it.o : (b.ty === 'ol');
        if (isDl) {
          li.removeAttribute('data-n');
        } else if (ord) {
          var n = (run[lv] || (lv ? 0 : (b.start || 1) - 1)) + 1;
          if (!blank) {
            run[lv] = n;
            for (var d = lv + 1; d < run.length; d++) run[d] = 0;
          }
          var mk = olMark(n, lv, arL, b.ls);
          li.setAttribute('data-n', mk);
        } else {
          var bset = UL_SETS[b.ls] || UL_SETS.dot;
          li.setAttribute('data-n', bset[lv % bset.length]);
        }
        if (blank) li.setAttribute('data-blank', '1');
        list.appendChild(li);
      });
      body.appendChild(list);

    } else if (b.ty === 'code') {
      var bar = el('div', 'ne-code-bar');
      langList();
      var lang = el('input', 'ne-lang', {
        type: 'text', value: b.lang || '', placeholder: L('اللغة', 'Language'),
        'aria-label': L('لغة الكود', 'Code language'), dir: 'ltr', spellcheck: 'false',
        list: 'ne-langs'
      });
      bar.appendChild(lang);
      body.appendChild(bar);
      var pre = el('pre', 'ne-code', {
        contenteditable: 'true', dir: 'ltr', spellcheck: 'false',
        'data-ph': L('اكتب الكود…', 'Type code…')
      });
      pre.textContent = b.src || '';
      body.appendChild(pre);
      paintCode(pre, b);
      /*@3.NOEJ.207*/
      if (isDiagram(b)) {
        /*@3.NOEJ.228*/
        var dOn = (b.dgm == null) ? true : !!b.dgm;
        var dBtn = el('button', 'ne-mini ne-dgm-t', {
          type: 'button', 'data-dgm': '1',
          'aria-pressed': dOn ? 'true' : 'false',
          'aria-label': L('اعرضِ المخطّط', 'Show diagram')
        });
        dBtn.innerHTML = '<i class="fa-solid fa-diagram-project" aria-hidden="true"></i>' +
          '<span>' + B().esc(L('مخطّط', 'Diagram')) + '</span>';
        bar.appendChild(dBtn);
        var dHost = el('div', 'ne-dgm', { dir: 'ltr' });
        dHost.hidden = !dOn;
        body.appendChild(dHost);
        pre.hidden = dOn;
        if (dOn) needMermaid().then(function (M) {
          if (!M) return;
          return M.render(dHost, b.src || '');
        }).then(function () { self.settled(); });
      }

    } else if (b.ty === 'math') {
      /*@3.NOEJ.31*/
      var mbox = el('div', 'ne-mathx');
      var out = el('div', 'ne-math-out', { dir: 'ltr', role: 'button', tabindex: '0',
        'aria-label': L('عدّل المعادلة', 'Edit equation') });
      mbox.appendChild(out);
      var ta = el('textarea', 'ne-tex', {
        dir: 'ltr', spellcheck: 'false', rows: '2',
        placeholder: '\\sum_{i=1}^{n} i^2',
        'aria-label': L('معادلة LaTeX', 'LaTeX equation')
      });
      ta.value = b.tex || '';
      ta.hidden = !!String(b.tex || '').trim();
      mbox.appendChild(ta);
      out.hidden = !String(b.tex || '').trim();
      body.appendChild(mbox);
      renderMath(out, b.tex);

    } else if (b.ty === 'tbl') {
      var tbl = el('table', 'ne-tbl');
      (b.rows || []).forEach(function (row) {
        var tr = el('tr');
        row.forEach(function (c) {
          var td = el('td', 'ne-cell', { contenteditable: 'true',
            dir: blockDir(b, dd), spellcheck: 'false' });
          /*@3.NOEJ.93*/
          if (c.al) td.setAttribute('data-cal', c.al);
          if (c.va) td.setAttribute('data-cva', c.va);
          td.innerHTML = B().runsToHtmlBidi(c.rt);
          tr.appendChild(td);
        });
        tbl.appendChild(tr);
      });
      body.appendChild(tbl);
      var tb = el('div', 'ne-tbl-bar');
      tb.innerHTML =
        '<button type="button" class="ne-mini" data-tbl="row+">' + L('+ صف', '+ Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col+">' + L('+ عمود', '+ Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="row-">' + L('− صف', '− Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col-">' + L('− عمود', '− Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="style">' + L('نمط الجدول', 'Table style') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="tone">' + L('لون الجدول', 'Table colour') + '</button>' +
        '<span class="ne-tbl-sep" aria-hidden="true"></span>' +
        '<button type="button" class="ne-mini ne-mini--sc" data-tbl="scope"' +
        ' aria-pressed="' + (b.csc === 'all' ? 'true' : 'false') + '">' +
        L(b.csc === 'all' ? 'كلُّ الخلايا' : 'الخليّة',
          b.csc === 'all' ? 'All cells' : 'This cell') + '</button>' +
        TBL_ALIGN.map(function (a) {
          return '<button type="button" class="ne-mini ne-mini--i" data-tbl="' + a.k + '"' +
            ' aria-label="' + B().esc(L(a.ar, a.en)) + '" title="' + B().esc(L(a.ar, a.en)) + '">' +
            '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i></button>';
        }).join('');
      body.appendChild(tb);

    } else if (b.ty === 'img') {
      body.appendChild(this.renderImg(b));

    } else if (b.ty === 'ink') {
      body.appendChild(this.renderInk(b));

    } else if (b.ty === 'hr') {
      body.appendChild(el('hr', 'ne-hr'));

    } else if (b.ty === 'gap') {
      /*@3.NOEJ.17*/
      var gap = el('div', 'ne-gap');
      gap.style.blockSize = (b.h || 40) + 'px';
      var ctl = el('div', 'ne-gap-c');
      var less = el('button', 'ne-gap-b', { type: 'button', 'aria-label': L('أقل فراغاً', 'Less space') });
      less.textContent = '−';
      var more = el('button', 'ne-gap-b', { type: 'button', 'aria-label': L('أكثر فراغاً', 'More space') });
      more.textContent = '+';
      ctl.appendChild(less); ctl.appendChild(more);
      gap.appendChild(ctl);
      body.appendChild(gap);
    }

    return wrap;
  };

  /*@3.NOEJ.22*/
  Editor.prototype.renderImg = function (b) {
    var box = el('div', 'ne-imgx');
    var fig = el('figure', 'ne-fig');
    var view = el('div', 'ne-img-view');
    fig.appendChild(view);
    var cap = el('figcaption', 'ne-cap');
    cap.textContent = b.alt || '';
    cap.hidden = !(b.cap && b.alt);
    fig.appendChild(cap);
    box.appendChild(fig);

    var edit = el('div', 'ne-img-edit');
    edit.hidden = !!B().httpsOnly(b.url);

    var urlIn = el('input', 'ne-img-url', {
      type: 'url', value: b.url || '', dir: 'ltr', spellcheck: 'false',
      placeholder: 'https://i.imgur.com/…',
      'aria-label': L('رابط الصورة المباشر', 'Direct image link')
    });
    edit.appendChild(urlIn);
    var unsBtn = el('button', 'ne-mini ne-img-uns', {
      type: 'button', 'data-imguns': '1',
      'aria-label': L('ابحثْ في أنسبلاش', 'Search Unsplash')
    });
    unsBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<span>' + B().esc(L('ابحثْ في أنسبلاش', 'Unsplash')) + '</span>';
    edit.appendChild(unsBtn);

    var capRow = el('div', 'ne-img-row');
    var altIn = el('input', 'ne-img-alt', {
      type: 'text', value: b.alt || '', dir: 'auto',
      placeholder: L('عنوان الصورة', 'Image caption'),
      'aria-label': L('عنوان الصورة', 'Image caption')
    });
    capRow.appendChild(altIn);
    var capBtn = el('button', 'ne-mini', {
      type: 'button', 'data-imgc': '1',
      'aria-pressed': b.cap ? 'true' : 'false',
      'aria-label': L('إظهار العنوان تحت الصورة', 'Show caption under image')
    });
    capBtn.innerHTML = '<i class="fa-solid fa-' + (b.cap ? 'eye' : 'eye-slash') +
      '" aria-hidden="true"></i>';
    capRow.appendChild(capBtn);
    edit.appendChild(capRow);

    /*@3.NOEJ.42*/
    var dims = [
      { k: 'iw', min: 20, max: 100, ar: 'الحجم', en: 'Size', d: 100 },
      { k: 'zm', min: 40, max: 320, ar: 'حجم الصورة داخل الإطار', en: 'Image size inside frame', d: 0 },
      { k: 'br', min: 20, max: 150, ar: 'السطوع', en: 'Brightness', d: 100 },
      { k: 'op', min: 15, max: 100, ar: 'الوضوح', en: 'Opacity', d: 100 }
    ];
    dims.forEach(function (d) {
      var row = el('label', 'ne-img-sl');
      var lab = el('span', 'ne-img-sl-t');
      lab.textContent = L(d.ar, d.en);
      row.appendChild(lab);
      var sl = el('input', '', {
        type: 'range', min: String(d.min), max: String(d.max), step: '5',
        value: String(b[d.k] == null ? d.d : b[d.k]), 'data-imgk': d.k,
        'aria-label': L(d.ar, d.en)
      });
      row.appendChild(sl);
      edit.appendChild(row);
    });

    /*@3.NOEJ.41*/
    var shRow = el('div', 'ne-img-row');
    [['rect', 'fa-square', 'مستطيل', 'Rectangle'],
     ['soft', 'fa-square-full', 'حوافّ منحنية', 'Rounded'],
     ['circle', 'fa-circle', 'دائريّة', 'Circle']].forEach(function (sh) {
      var sb = el('button', 'ne-mini', {
        type: 'button', 'data-imgs': sh[0],
        'aria-pressed': (b.sh || 'rect') === sh[0] ? 'true' : 'false',
        'aria-label': L(sh[2], sh[3]),
        'data-ar-title': sh[2], 'data-en-title': sh[3]
      });
      sb.innerHTML = '<i class="fa-solid ' + sh[1] + '" aria-hidden="true"></i>';
      shRow.appendChild(sb);
    });
    var sep = el('span', 'ne-img-sep');
    shRow.appendChild(sep);
    [['start', 'fa-align-left', 'إلى البداية', 'To the start'],
     ['center', 'fa-align-center', 'توسيط', 'Centre'],
     ['end', 'fa-align-right', 'إلى النهاية', 'To the end']].forEach(function (al) {
      var ab = el('button', 'ne-mini', {
        type: 'button', 'data-imga': al[0],
        'aria-pressed': (b.al || 'start') === al[0] ? 'true' : 'false',
        'aria-label': L(al[2], al[3]),
        'data-ar-title': al[2], 'data-en-title': al[3]
      });
      ab.innerHTML = '<i class="fa-solid ' + al[1] + '" aria-hidden="true"></i>';
      shRow.appendChild(ab);
    });
    edit.appendChild(shRow);

    var rst = el('button', 'ne-mini', { type: 'button', 'data-imgr': '1' });
    rst.textContent = L('إعادة للأصل', 'Reset');
    edit.appendChild(rst);

    var hint = el('p', 'ne-hint');
    hint.innerHTML = L(
      'الصق رابطاً مباشراً للصورة. وللتصدير إلى PDF يلزم مستضيفٌ يأذن بقراءتها — ' +
      '<a href="https://imgur.com" target="_blank" rel="noopener noreferrer">imgur</a> أو ' +
      '<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> يأذنان، ' +
      'و<span dir="ltr">i.ibb.co</span> و<span dir="ltr">postimg</span> يُعرضان ولا يُصدَّران. ' +
      'والصورةُ تُعرض من موقعها ولا تُحفظ عندنا — فلا تظهر بلا إنترنت، وموقعُها يرى اتّصالك.',
      'Paste a direct image link. Exporting to PDF needs a host that permits reading it — ' +
      '<a href="https://imgur.com" target="_blank" rel="noopener noreferrer">imgur</a> and ' +
      '<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> do; ' +
      'i.ibb.co and postimg show but will not export. ' +
      'The image is shown from its host and is not stored here — it will not appear offline, and that host can see your connection.');
    edit.appendChild(hint);

    box.appendChild(edit);
    applyImgStyle(fig, b);
    /*@3.NOEJ.249*/
    paintImg(view, b.url, b.alt, b.lk);
    return box;
  };

  /*@3.NOEJ.23*/
  function applyImgStyle(fig, b) {
    if (!fig) return;
    fig.style.inlineSize = (b.iw == null ? 100 : b.iw) + '%';
    var br = b.br == null ? 100 : b.br;
    fig.style.filter = br === 100 ? '' : ('brightness(' + (br / 100) + ')');
    var op = b.op == null ? 100 : b.op;
    fig.style.opacity = op === 100 ? '' : String(op / 100);
    fig.setAttribute('data-sh', b.sh || 'rect');
    /*@3.NOEJ.43*/
    var im = fig.querySelector('.ne-img-view img');
    if (im) {
      var fx = b.fx == null ? 50 : b.fx;
      var fy = b.fy == null ? 50 : b.fy;
      if ((b.sh || 'rect') === 'circle') {
        var cover = coverPct(im);
        var z = b.zm == null ? cover : b.zm;
        im.style.objectPosition = fx + '% ' + fy + '%';
        im.style.transform = 'scale(' + (z / 100) + ')';
        var sl = fig.parentNode ? fig.parentNode.querySelector('[data-imgk="zm"]') : null;
        if (sl && document.activeElement !== sl) sl.value = String(Math.round(z));
      } else {
        im.style.objectPosition = '';
        im.style.transform = '';
      }
    }
  }

/*@3.NOEJ.52*/
  function coverPct(im) {
    var iw = im.naturalWidth, ih = im.naturalHeight;
    var box = im.parentNode ? im.parentNode.getBoundingClientRect() : null;
    if (!iw || !ih || !box || !box.width || !box.height) return 100;
    var fit = Math.min(box.width / iw, box.height / ih);
    var cov = Math.max(box.width / iw, box.height / ih);
    if (!isFinite(fit) || fit <= 0) return 100;
    return Math.min(320, Math.max(100, Math.round((cov / fit) * 100)));
  }

  Editor.prototype.renderInk = function (b) {
    var box = el('div', 'ne-ink-box');
    var bar = el('div', 'nc-bar');
    var canvasHost = el('div', 'nc-host');
    box.appendChild(bar);
    box.appendChild(canvasHost);

    var self = this;
    if (!window.GardenCanvas) return box;

    setTimeout(function () {
      var cv = GardenCanvas.mount(canvasHost, {
        height: b.h || 300,
        onChange: function (d) {
          b.ink = d.ink; b.w = d.w; b.h = d.h;
          b.shapes = d.shapes && d.shapes.length ? d.shapes : null;
          self.touch();
        },
        onState: function (st) { if (barUI) barUI.sync(st); }
      });
      var barUI = window.GardenCanvasBar ? GardenCanvasBar.mount(bar, cv) : null;
      self.canvases = self.canvases || {};
      self.canvases[b.id] = cv;
      cv.setTool(GardenCanvas.lastTool ? GardenCanvas.lastTool() : 'pen');
      if (b.ink || (b.shapes && b.shapes.length)) cv.load(b.ink, b.h, b.shapes);
      cv.emit();
    }, 0);

    return box;
  };

  function placeholderFor(b) {
    if (b.ty === 'h') return L('عنوان', 'Heading');
    if (b.ty === 'quote') return L('اقتباس', 'Quote');
    if (b.ty === 'callout') return L('تنبيه', 'Callout');
    if (b.ty === 'todo') return L('مهمة', 'To-do');
    return L('اكتب، أو اضغط / للأوامر…', 'Type, or press / for commands…');
  }

  /*@3.NOEJ.210*/
  var CORSQ = {};

  function corsOk(u) {
    var o;
    try { o = new URL(u, location.href).origin; } catch (e) { return Promise.resolve(true); }
    if (CORSQ[o]) return CORSQ[o];
    CORSQ[o] = new Promise(function (res) {
      var probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.referrerPolicy = 'no-referrer';
      var t = setTimeout(function () { res(false); }, 9000);
      probe.onload = function () { clearTimeout(t); res(true); };
      probe.onerror = function () { clearTimeout(t); res(false); };
      probe.src = u;
    });
    return CORSQ[o];
  }

  function paintImg(host, url, alt, lk) {
    host.innerHTML = '';
    var u = B().httpsOnly(url);
    if (!u) return;
    var img = el('img', 'ne-img', {
      src: u, alt: alt || '', loading: 'lazy', referrerpolicy: 'no-referrer'
    });
    var wrapA = null, lku = lk ? B().normUrl(lk) : '';
    if (lku) {
      wrapA = el('a', 'ne-img-a', {
        href: lku, target: '_blank', rel: 'noopener noreferrer nofollow',
        'aria-label': L('افتحْ وجهةَ الصورة', 'Open the image target')
      });
    }
    img.addEventListener('load', function () {
      var ed = host.closest ? host.closest('.ne-root') : null;
      if (ed && ed.__ed && ed.__ed.settled) ed.__ed.settled();
      corsOk(u).then(function (ok) {
        if (ok || !img.parentNode || host.querySelector('.ne-img-warn')) return;
        var w = el('div', 'ne-img-warn');
        w.textContent = L(
          'تُعرض هنا ولا تخرج في PDF — مستضيفُها لا يأذن بقراءتها. جرّب imgur أو GitHub.',
          'Shows here but will not export to PDF — its host forbids reading it. Try imgur or GitHub.');
        host.appendChild(w);
      });
    });
    img.addEventListener('error', function () {
      var edE = host.closest ? host.closest('.ne-root') : null;
      if (edE && edE.__ed && edE.__ed.settled) edE.__ed.settled();
      host.innerHTML = '';
      var bad = el('div', 'ne-img-bad');
      bad.textContent = L('تعذّر تحميل الصورة من هذا الرابط.', 'Could not load the image from this link.');
      host.appendChild(bad);
    });
    if (wrapA) { wrapA.appendChild(img); host.appendChild(wrapA); }
    else host.appendChild(img);
  }

  /*@3.NOEJ.21*/
  function paintCode(pre, b) {
    if (!pre || !window.GardenNotesCode) return;
    if (document.activeElement === pre) return;
    var C = window.GardenNotesCode;
    if (!C.norm(b.lang)) { pre.textContent = b.src || ''; return; }
    C.paint(pre, b.src || '', b.lang);
  }

  /*@3.NOEJ.5*/
  function renderMath(host, tex) {
    host.textContent = tex ? ('\\[' + tex + '\\]') : '';
    if (!tex) return;
    if (window.GardenMath && GardenMath.typeset) {
      try { GardenMath.typeset(host); } catch (e) {}
    }
  }


  Editor.prototype.insertAfter = function (id, block) {
    var hit = this.blockAt(id);
    var at = hit ? hit.i + 1 : this.doc.blocks.length;
    this.doc.blocks.splice(at, 0, block);
    return at;
  };

  /*@3.NOEJ.9*/
  Editor.prototype.addBlock = function (ty, afterId, lv, extra) {
    var before = this.snapshot();
    this.readAll();
    var nb = B().blank(ty, lv ? { lv: lv } : null);
    if (extra) Object.assign(nb, extra);
    /*@3.NOEJ.55*/
    var src = afterId ? this.blockAt(afterId) : null;
    if (src && src.b.fp) {
      nb.fp = this.fpUnder(src.b, afterId);
      /*@3.NOEJ.69*/
      if (nb.wm == null) nb.wm = WIDE[ty] ? 'full' : (src.b.wm || 'fit');
      nb.z = this.topZ() + 1;
    }
    /*@3.NOEJ.353*/
    var fresh = isDiagram(nb);
    if (fresh) nb.dgm = 0;
    this.insertAfter(afterId || this.lastBlockId(), nb);
    this.pushUndo(before);
    var nAt = this.blockAt(nb.id);
    if (nAt && !nb.fp) this.renderInsert(nAt.i, [nb]); else this.render();
    if (fresh) { this._mmdFresh = nb.id; this.openCode(nb.id); }
    else this.focusBlock(nb.id);
    this.touch();
    this.emitState();
    return nb.id;
  };

  Editor.prototype.openCode = function (id) {
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    var pre = node ? node.querySelector('.ne-code') : null;
    if (!pre) { this.focusBlock(id); return false; }
    pre.hidden = false;
    try {
      pre.focus({ preventScroll: false });
      var r = document.createRange();
      r.selectNodeContents(pre);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) {}
    return true;
  };

  Editor.prototype.lastBlockId = function () {
    var bs = this.doc.blocks;
    return bs.length ? bs[bs.length - 1].id : null;
  };

  Editor.prototype.convert = function (id, ty, lv, extra) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var old = hit.b;
    if (old.ty === ty && (ty !== 'h' || (old.lv || 2) === (lv || 2)) &&
        !(extra && extra.cal && calKind(old) !== extra.cal)) return;
    var rt = old.rt || null;
    if (!rt && old.items) {
      rt = [];
      for (var i = 0; i < old.items.length; i++) {
        if (i) rt.push({ s: '\n' });
        rt = rt.concat(old.items[i].rt || []);
      }
    }
    /*@3.NOEJ.59*/
    if (!rt || !rt.length) {
      if (old.ty === 'code') rt = [{ s: old.src || '' }];
      else if (old.ty === 'math') rt = [{ s: old.tex || '' }];
      else if (old.ty === 'img') rt = [{ s: old.url || old.alt || '' }];
      else if (old.ty === 'tbl') {
        var cells = [];
        (old.rows || []).forEach(function (row) {
          var line = row.map(function (c) { return B().runsToText(c.rt || []); })
                        .filter(function (x) { return x; }).join(' | ');
          if (line) cells.push(line);
        });
        rt = cells.length ? [{ s: cells.join('\n') }] : rt;
      }
    }
    var nb = B().blank(ty, lv ? { lv: lv } : null);
    /*@3.NOEJ.60*/
    KEEP.forEach(function (k) { if (old[k] != null) nb[k] = old[k]; });
    nb.id = old.id;
    /*@3.NOEJ.56*/
    if (old.fp) nb.fp = old.fp;
    if (TEXTY[ty]) nb.rt = rt || [];
    else if (LISTY[ty]) {
      if (old.items && old.items.length) nb.items = old.items;
      else nb.items = splitLines(rt || []);
    } else if (ty === 'code') nb.src = B().runsToText(rt || []);
    /*@3.NOEJ.32*/
    else if (ty === 'math') nb.tex = B().runsToText(rt || []).trim();
    else if (ty === 'tbl') { if (rt && rt.length) nb.rows[0][0] = { rt: rt }; }
    else if (ty === 'img') {
      var maybe = B().httpsOnly(B().runsToText(rt || []).trim());
      if (maybe) nb.url = maybe;
      else nb.alt = B().runsToText(rt || []).trim();
    }
    if (extra) for (var xk in extra) nb[xk] = extra[xk];
    this.doc.blocks[hit.i] = nb;
    this.pushUndo(before);
    this.renderOne(nb.id);
    this.focusBlock(nb.id);
    this.touch();
    this.emitState();
  };

  Editor.prototype.setCallout = function (id, kind) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'callout') return;
    if (!CAL[kind]) return;
    var before = this.snapshot();
    hit.b.cal = kind;
    this.pushUndo(before);
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (node) {
      node.setAttribute('data-cal', kind);
      var hd = node.querySelector('.ne-cal-h');
      if (hd) paintCalHead(hd, kind);
    }
    this.touch();
    this.emitState();
  };

  function paintCalHead(hd, kind) {
    var c = CAL[kind] || CAL.note;
    hd.innerHTML = '<i class="fa-solid ' + c.icon + '" aria-hidden="true"></i>' +
      '<span>' + B().esc(L(c.ar, c.en)) + '</span>';
    hd.setAttribute('aria-label',
      L('نوعُ الصندوق: ', 'Box kind: ') + L(c.ar, c.en) +
      L(' — اضغطْ لتغييره', ' — click to change'));
  }

  function splitLines(rt) {
    var items = [], cur = [];
    for (var i = 0; i < rt.length; i++) {
      var parts = String(rt[i].s || '').split('\n');
      for (var j = 0; j < parts.length; j++) {
        if (j) { items.push({ rt: cur }); cur = []; }
        if (parts[j]) cur.push(Object.assign({}, rt[i], { s: parts[j] }));
      }
    }
    items.push({ rt: cur });
    return items.length ? items : [{ rt: [] }];
  }

  /*@3.NOEJ.250*/
  function runSlot(b, which) {
    if (TEXTY[b.ty]) {
      return { k: -1, get: function () { return b.rt || []; },
               set: function (v) { b.rt = v; } };
    }
    if (LISTY[b.ty] && b.items && b.items.length) {
      var k = which === 'head' ? 0 : b.items.length - 1;
      var it = b.items[k];
      return { k: k, get: function () { return it.rt || []; },
               set: function (v) { it.rt = v; } };
    }
    return null;
  }

  Editor.prototype.caretIn = function (id, slotK, at) {
    /*@3.NOEJ.300*/
    if (this._win) this.winShow(id);
    var fresh = this.root.querySelector('[data-bid="' + id + '"]');
    if (!fresh) return;
    var t = slotK >= 0
      ? fresh.querySelectorAll('.ne-li')[slotK]
      : fresh.querySelector('.ne-text');
    if (!t) { this.focusBlock(id); return; }
    try { t.focus({ preventScroll: true }); } catch (eC) { t.focus(); }
    this.keepInView(t);
    selectRange(t, at, at);
  };

  Editor.prototype.joinItems = function (id, k) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items) return false;
    if (k < 1 || k >= hit.b.items.length) return false;
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return false;
    var before = this.snapshot();
    this.readBlock(node);
    var b = hit.b;
    var prevIt = b.items[k - 1], mine = b.items[k];
    var at = runsLen(prevIt.rt);
    prevIt.rt = joinRuns([prevIt.rt || [], mine.rt || []]);
    b.items.splice(k, 1);
    this.pushUndo(before);
    this.renderOne(id);
    this.caretIn(id, k - 1, at);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.joinBlocks = function (prevId, curId) {
    var ph = this.blockAt(prevId), ch = this.blockAt(curId);
    if (!ph || !ch || ph.i >= ch.i) return false;
    if (ph.b.fp || ch.b.fp) return false;
    var pslot = runSlot(ph.b, 'tail');
    var mslot = runSlot(ch.b, 'head');
    if (!pslot || !mslot) return false;
    var pnode = this.root.querySelector(':scope > [data-bid="' + prevId + '"]');
    var cnode = this.root.querySelector(':scope > [data-bid="' + curId + '"]');
    if (!pnode || !cnode) return false;
    var before = this.snapshot();
    this.readBlock(pnode);
    this.readBlock(cnode);
    pslot = runSlot(ph.b, 'tail');
    mslot = runSlot(ch.b, 'head');
    if (!pslot || !mslot) return false;
    var at = runsLen(pslot.get());
    pslot.set(joinRuns([pslot.get(), mslot.get()]));
    var keep = LISTY[ch.b.ty] && ch.b.items && ch.b.items.length > 1;
    if (keep) ch.b.items.splice(0, 1);
    else this.doc.blocks.splice(ch.i, 1);
    this.pushUndo(before);
    this.renderOne(prevId);
    if (keep) this.renderOne(curId); else this.renderDrop(curId);
    this.caretIn(prevId, pslot.k, at);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.266*/
  Editor.prototype.unlistItem = function (id, k) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items || !hit.b.items[k]) return false;
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return false;
    this.readBlock(node);
    var b = hit.b;
    if (b.items.length < 2) {
      this.convert(id, 'p');
      this.caretIn(id, -1, 0);
      return true;
    }
    var before = this.snapshot();
    var p = B().blank('p');
    p.rt = joinRuns([b.items[k].rt || []]);
    var key = ['ff', 'dir', 'al', 'fs'], q;
    for (q = 0; q < key.length; q++) if (b[key[q]] != null) p[key[q]] = b[key[q]];
    b.items.splice(k, 1);
    this.doc.blocks.splice(hit.i, 0, p);
    this.pushUndo(before);
    this.renderOne(id);
    var pAt = this.blockAt(p.id);
    if (pAt) this.renderInsert(pAt.i, [p]); else this.render();
    this.caretIn(p.id, -1, 0);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.flowNeighbour = function (i, dir) {
    var bs = this.doc.blocks, j = i + dir;
    while (j >= 0 && j < bs.length && bs[j].fp) j += dir;
    return (j >= 0 && j < bs.length) ? bs[j] : null;
  };

  Editor.prototype.joinAt = function (id, edn, dir) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.fp) return false;
    if (edn && edn.classList.contains('ne-li')) {
      var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
      var lis = node ? [].slice.call(node.querySelectorAll('.ne-li')) : [];
      var k = lis.indexOf(edn);
      if (k < 0) return false;
      /*@3.NOEJ.258*/
      if (dir < 0) {
        if (parseInt(edn.getAttribute('data-lv') || '0', 10) > 0) {
          return this.indentItem(node, hit.b, edn, -1);
        }
        if (k > 0) return this.joinItems(id, k);
        return this.unlistItem(id, 0);
      }
      if (k < lis.length - 1) return this.joinItems(id, k + 1);
      return false;
    }
    var nb = this.flowNeighbour(hit.i, dir < 0 ? -1 : 1);
    if (!nb) return false;
    return dir < 0 ? this.joinBlocks(nb.id, id) : this.joinBlocks(id, nb.id);
  };

  /*@3.NOEJ.251*/
  Editor.prototype.pasteHost = function () {
    var ed = this.focusEd && this.root.contains(this.focusEd) ? this.focusEd : null;
    var node = ed && ed.closest ? ed.closest('[data-bid]') : null;
    if (node) return node;
    var kids = this.root.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      var k = kids[i];
      if (!k.hasAttribute || !k.hasAttribute('data-bid')) continue;
      if (k.hasAttribute('data-fp')) continue;
      return k;
    }
    return null;
  };

  /*@3.NOEJ.337*/
  function snapClip(cd) {
    if (!cd) return null;
    var html = '', txt = '';
    try { html = cd.getData('text/html') || ''; } catch (e) {}
    try { txt = cd.getData('text/plain') || ''; } catch (e) {}
    if (!html && !txt) return null;
    return {
      html: html, txt: txt,
      getData: function (t) {
        if (t === 'text/html') return this.html;
        if (t === 'text/plain') return this.txt;
        return '';
      },
      files: null, items: null
    };
  }

  Editor.prototype.pasteRun = function (cd, node, mode) {
    var self = this;
    if (!node) node = this.pasteHost();
    if (!node) return false;
    needEmoji().then(function () { self.emojiSweep(); });
    var snap = (cd && cd.__snap) ? cd : snapClip(cd);
    if (!mode && this._plainNext) { mode = 'text'; this._plainNext = false; }
    /*@3.NOEJ.352*/
    var flat0 = '';
    try { flat0 = (snap ? snap.txt : (cd ? cd.getData('text/plain') : '')) || ''; }
    catch (e0) { flat0 = ''; }
    var CC0 = window.GardenNotesCode;
    var asMmd = mode !== 'text' && !!(CC0 && CC0.looksMermaid && CC0.looksMermaid(flat0));
    var res;
    if (asMmd) {
      res = { blocks: [B().blank('code', { lang: 'mermaid', dgm: 1,
        src: flat0.replace(/\r\n?/g, '\n').replace(/\s+$/, '') })] };
    } else if (mode === 'text' && snap) {
      res = { blocks: SAN().fromPlain ? SAN().fromPlain(snap.txt) : [] };
    } else {
      res = SAN().fromClipboard(snap || cd);
    }
    if (res.rejectedImage) {
      if (this.opts.onImagePaste) this.opts.onImagePaste();
      return false;
    }
    var blocks = res.blocks || [];
    /*@3.NOEJ.96*/
    var hasHtml = false;
    try { hasHtml = !!(cd && cd.getData('text/html')); } catch (eh) {}
    if (!hasHtml && !asMmd) {
      var flat = cd ? cd.getData('text/plain') : '';
      if (flat && B().looksMarkdown && B().looksMarkdown(flat)) {
        blocks = B().fromMarkdown(flat);
      }
    }
    if (!blocks.length) return false;
    /*@3.NOEJ.186*/
    this.stampDir(blocks);

    var before = this.snapshot();
    this.readBlock(node);
    var id = node.getAttribute('data-bid');
    var hit = this.blockAt(id);
    var at = hit ? hit.i + 1 : this.doc.blocks.length;

    /*@3.NOEJ.116*/
    var host = hit && hit.b.fp ? hit.b : null;
    /*@3.NOEJ.138*/
    if (hit) {
      for (var s = 0; s < blocks.length; s++) {
        if (hit.b.ff && blocks[s].ff == null) blocks[s].ff = hit.b.ff;
        if (hit.b.dir && blocks[s].dir == null) blocks[s].dir = hit.b.dir;
        if (hit.b.al && blocks[s].al == null) blocks[s].al = hit.b.al;
        if (hit.b.fs && blocks[s].fs == null) blocks[s].fs = hit.b.fs;
      }
    }
    if (hit && TEXTY[hit.b.ty] && !B().runsToText(hit.b.rt).trim() && blocks.length) {
      this.doc.blocks.splice(hit.i, 1);
      at = hit.i;
    }
    if (host) {
      var py = host.fp.y, px = host.fp.x, zTop = this.topZ();
      for (var q = 0; q < blocks.length; q++) {
        blocks[q].fp = { x: px, y: py };
        blocks[q].wm = host.wm || 'fit';
        blocks[q].z = zTop + 1 + q;
        py += 34;
      }
    }
    for (var i = 0; i < blocks.length; i++) this.doc.blocks.splice(at + i, 0, blocks[i]);
    this.pushUndo(before);
    /*@3.NOEJ.149*/
    if (hit && this.doc.blocks.indexOf(hit.b) === -1) {
      var goneN = this.root.querySelector(':scope > [data-bid="' + hit.b.id + '"]');
      if (goneN) goneN.remove();
    }
    this.renderInsert(at, blocks);
    /*@3.NOEJ.255*/
    if (!this.natOk()) { this._nat = null; this._engStale = true; this.settled(); }
    if (host) this.layoutFree();
    this.focusBlock(blocks[blocks.length - 1].id);
    this.touch();
    this.emitState();
    if (snap) {
      this._pasteOpt = {
        before: before, at: at, n: blocks.length,
        nodeId: id, snap: snap, mode: mode || 'full',
        last: blocks[blocks.length - 1].id
      };
      this.showPasteOpts();
    }
    return true;
  };

  /*@3.NOEJ.338*/
  /*@3.NOEJ.343*/
  var CB_OK = !!(window.navigator && navigator.clipboard &&
                 (navigator.clipboard.read || navigator.clipboard.readText));

  Editor.prototype.pasteFromClipboard = function (mode, atId) {
    var self = this;
    var ar = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
    function say(m) { if (self.opts && self.opts.onNote) self.opts.onNote(m); }
    if (!CB_OK) {
      say(ar ? 'متصفّحُك لا يتيح قراءةَ الحافظة' : 'This browser cannot read the clipboard');
      return Promise.resolve(false);
    }
    var node = atId ? this.root.querySelector(':scope > [data-bid="' + atId + '"]') : null;
    if (!node) node = this.pasteHost();

    function run(html, txt) {
      if (!html && !txt) {
        say(ar ? 'الحافظةُ فارغة' : 'The clipboard is empty');
        return false;
      }
      var snap = { html: html || '', txt: txt || '', __snap: true,
                   files: null, items: null,
                   getData: function (t) {
                     if (t === 'text/html') return this.html;
                     if (t === 'text/plain') return this.txt;
                     return '';
                   } };
      var okp = self.pasteRun(snap, node, mode === 'text' ? 'text' : undefined);
      if (!okp) say(ar ? 'تعذّر اللصق' : 'Could not paste');
      return okp;
    }

    if (navigator.clipboard.read) {
      return navigator.clipboard.read().then(function (items) {
        var jobs = [], html = '', txt = '';
        (items || []).forEach(function (it) {
          (it.types || []).forEach(function (ty) {
            if (ty === 'text/html') jobs.push(it.getType(ty).then(function (b) { return b.text(); })
              .then(function (s) { html = html || s; }));
            else if (ty === 'text/plain') jobs.push(it.getType(ty).then(function (b) { return b.text(); })
              .then(function (s) { txt = txt || s; }));
          });
        });
        return Promise.all(jobs).then(function () { return run(html, txt); });
      })['catch'](function () {
        /*@3.NOEJ.344*/
        if (!navigator.clipboard.readText) { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; }
        return navigator.clipboard.readText().then(function (s) { return run('', s); })
          ['catch'](function () { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; });
      });
    }
    return navigator.clipboard.readText().then(function (s) { return run('', s); })
      ['catch'](function () { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; });
  };

  Editor.prototype.hidePasteOpts = function () {
    if (this._pasteBar && this._pasteBar.parentNode) this._pasteBar.parentNode.removeChild(this._pasteBar);
    this._pasteBar = null;
  };

  Editor.prototype.showPasteOpts = function () {
    var self = this;
    var st = this._pasteOpt;
    if (!st || this.readOnly) return;
    this.hidePasteOpts();
    var ar = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
    function L(a, e) { return ar ? a : e; }

    var bar = document.createElement('div');
    bar.className = 'ne-pasteopt';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', L('خيارات اللصق', 'Paste options'));
    var opts = [
      { m: 'full', i: 'fa-paste', ar: 'لصقٌ كامل', en: 'Keep formatting' },
      { m: 'text', i: 'fa-font', ar: 'النصُّ فقط', en: 'Text only' }
    ];
    if (clipAny()) opts.push({ m: 'blocks', i: 'fa-cubes', ar: 'العناصرُ المنسوخة', en: 'Copied blocks' });

    var h = '';
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      h += '<button type="button" class="ne-po-b' + (o.m === st.mode ? ' on' : '') +
        '" data-pm="' + o.m + '" aria-pressed="' + (o.m === st.mode ? 'true' : 'false') +
        '" aria-label="' + L(o.ar, o.en) + '" title="' + L(o.ar, o.en) + '">' +
        '<i class="fa-solid ' + o.i + '" aria-hidden="true"></i>' +
        '<span>' + L(o.ar, o.en) + '</span></button>';
    }
    bar.innerHTML = h;

    var anchor = this.root.querySelector(':scope > [data-bid="' + st.last + '"]');
    if (!anchor) return;
    anchor.appendChild(bar);
    this._pasteBar = bar;

    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pm]');
      if (!b) return;
      e.preventDefault();
      self.repaste(b.getAttribute('data-pm'));
    });

    if (this._poTimer) clearTimeout(this._poTimer);
    this._poTimer = setTimeout(function () { self.hidePasteOpts(); }, 12000);
  };

  Editor.prototype.repaste = function (mode) {
    var st = this._pasteOpt;
    if (!st || mode === st.mode) { this.hidePasteOpts(); return; }
    this.hidePasteOpts();
    /*@3.NOEJ.339*/
    this.swapDoc(JSON.parse(st.before));
    var popped = this.undo.pop();
    this._undoB = Math.max(0, (this._undoB || 0) - (popped ? popped.length : 0));

    var node = st.nodeId
      ? this.root.querySelector(':scope > [data-bid="' + st.nodeId + '"]')
      : null;
    if (!node) node = this.pasteHost();

    if (mode === 'blocks') {
      this.pasteBlocks();
      this._pasteOpt = null;
      return;
    }
    st.snap.__snap = true;
    this.pasteRun(st.snap, node, mode);
  };

  Editor.prototype.remove = function (id) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.doc.blocks.splice(hit.i, 1);
    var grew = false;
    if (!this.doc.blocks.length) { this.doc.blocks.push(B().blank('p')); grew = true; }
    this.pushUndo(before);
    if (grew) this.render(); else this.renderDrop(id);
    var next = this.doc.blocks[Math.max(0, hit.i - 1)];
    if (next) this.focusBlock(next.id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.10*/
  Editor.prototype.move = function (id, dir) {
    var hit = this.blockAt(id);
    if (!hit) return false;
    var to = hit.i + (dir < 0 ? -1 : 1);
    if (to < 0 || to >= this.doc.blocks.length) return false;
    var before = this.snapshot();
    this.readAll();
    var bs = this.doc.blocks;
    var moved = bs.splice(hit.i, 1)[0];
    bs.splice(to, 0, moved);
    this.pushUndo(before);
    /*@3.NOEJ.247*/
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) { this.render(); }
    else {
      var nxt = bs[to + 1];
      var anchor = nxt
        ? this.root.querySelector(':scope > [data-bid="' + nxt.id + '"]')
        : this.root.querySelector(':scope > .ne-tail');
      if (anchor) this.root.insertBefore(node, anchor);
      else this.root.appendChild(node);
      if (this.natMove(hit.i, to)) this.reflowEng();
      else { this._nat = null; this._engStale = true; this.settled(); }
      this.applyEng();
      if (this.opts.onLayout) this.opts.onLayout();
    }
    this.focusBlock(id);
    if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.duplicate = function (id) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.readAll();
    var copy = JSON.parse(JSON.stringify(hit.b));
    copy.id = B().uid();
    this.doc.blocks.splice(hit.i + 1, 0, copy);
    this.pushUndo(before);
    this.renderInsert(hit.i + 1, [copy]);
    this.focusBlock(copy.id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.33*/
  Editor.prototype.blockSel = function () {
    if (!this._bsel) this._bsel = {};
    return this._bsel;
  };

  Editor.prototype.selectedBlocks = function () {
    var sel = this.blockSel(), out = [];
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (sel[this.doc.blocks[i].id]) out.push({ b: this.doc.blocks[i], i: i });
    }
    return out;
  };

  /*@3.NOEJ.199*/
  Editor.prototype.ensureChrome = function () {
    if (this._chrome) return this._chrome;
    var rail = el('div', 'ne-rail');
    var tick = el('button', 'ne-tick', {
      type: 'button', tabindex: '-1', 'aria-pressed': 'false',
      'aria-label': L('حدّدْ هذه الكتلة', 'Select this block')
    });
    tick.innerHTML = '<i class="fa-regular fa-square" aria-hidden="true"></i>';
    var plus = el('button', 'ne-plus', {
      type: 'button', 'aria-label': L('أضف كتلة بعدها', 'Add a block after'), tabindex: '-1'
    });
    plus.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
    var grip = el('button', 'ne-grip', {
      type: 'button', tabindex: '-1',
      'aria-label': L('اسحبْ لنقلها، أو اضغطْ لخياراتها', 'Drag to move, or click for options')
    });
    grip.innerHTML = '<i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>';
    rail.appendChild(tick); rail.appendChild(plus); rail.appendChild(grip);

    var spin = el('button', 'ne-rgrip', {
      type: 'button', tabindex: '-1', 'aria-label': L('اسحبْ لتدويرها', 'Drag to rotate')
    });
    spin.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i>';
    var edges = ['s', 'e'].map(function (sd) {
      return el('button', 'ne-wgrip', {
        type: 'button', tabindex: '-1', 'data-side': sd,
        'aria-label': L('اسحبْ لضبط العرض', 'Drag to set the width')
      });
    });
    this._chrome = { rail: rail, tick: tick, spin: spin, edges: edges, host: null };
    return this._chrome;
  };

  Editor.prototype.chromeTo = function (node) {
    var c = this.ensureChrome();
    if (c.host === node) return;
    c.host = node || null;
    if (!node) {
      if (c.rail.parentNode) c.rail.parentNode.removeChild(c.rail);
      if (c.spin.parentNode) c.spin.parentNode.removeChild(c.spin);
      for (var q = 0; q < c.edges.length; q++) {
        if (c.edges[q].parentNode) c.edges[q].parentNode.removeChild(c.edges[q]);
      }
      return;
    }
    node.insertBefore(c.rail, node.firstChild);
    node.appendChild(c.spin);
    for (var k = 0; k < c.edges.length; k++) node.appendChild(c.edges[k]);
    this.paintTick(node);
  };

  /*@3.NOEJ.200*/
  Editor.prototype.paintTick = function (node) {
    var c = this._chrome;
    if (!c || !node) return;
    var on = !!this.blockSel()[node.getAttribute('data-bid')];
    c.tick.setAttribute('aria-pressed', on ? 'true' : 'false');
    c.tick.innerHTML = '<i class="fa-' + (on ? 'solid fa-square-check' : 'regular fa-square') +
                       '" aria-hidden="true"></i>';
  };

  Editor.prototype.paintBlockSel = function () {
    var sel = this.blockSel();
    var nodes = this.root.querySelectorAll('[data-bid]');
    for (var i = 0; i < nodes.length; i++) {
      var on = !!sel[nodes[i].getAttribute('data-bid')];
      if (on) nodes[i].setAttribute('data-bsel', '1');
      else nodes[i].removeAttribute('data-bsel');
    }
    /*@3.NOEJ.164*/
    if (this._chrome && this._chrome.host) this.paintTick(this._chrome.host);
    if (this._selMode) this.paintSelHint();
  };

  Editor.prototype.toggleBlockSel = function (id, only) {
    var sel = this.blockSel();
    if (only) { this._bsel = {}; sel = this._bsel; sel[id] = 1; }
    else if (sel[id]) delete sel[id];
    else sel[id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

  Editor.prototype.selectBlockRange = function (id) {
    var sel = this.blockSel();
    var last = this._bselLast, a = -1, b = -1, i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].id === last) a = i;
      if (this.doc.blocks[i].id === id) b = i;
    }
    if (a < 0 || b < 0) { this.toggleBlockSel(id); this._bselLast = id; return; }
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (i = lo; i <= hi; i++) sel[this.doc.blocks[i].id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

  /*@3.NOEJ.161*/
  /*@3.NOEJ.185*/
  Editor.prototype.stampDir = function (blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return blocks;
    var docD = contentDir(this.doc);
    if (!docD) return blocks;
    var inD = '';
    for (var k = 0; k < blocks.length && !inD; k++) inD = blockContentDir(blocks[k]);
    if (!inD || inD === docD) return blocks;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.dir === 'rtl' || b.dir === 'ltr') continue;
      var bd = blockContentDir(b) || inD;
      if (bd && bd !== docD) b.dir = bd;
    }
    return blocks;
  };

  /*@3.NOEJ.192*/
  function fold(t) {
    return String(t == null ? '' : t).toLowerCase()
      .replace(/[\u064b-\u0652\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/\u0629/g, '\u0647').replace(/[\u064a\u0649]/g, '\u064a')
      .replace(/\s+/g, ' ').trim();
  }

  Editor.prototype.mentionAt = function (edn) {
    if (!edn) return null;
    /*@3.NOEJ.245*/
    var txt = edn.textContent || '';
    if (txt.indexOf('@') < 0) return null;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    var r = sel.getRangeAt(0);
    if (!edn.contains(r.startContainer)) return null;
    var at = offsetIn(edn, r.startContainer, r.startOffset);
    var head = txt.slice(0, at);
    var m = head.match(/(^|[\s(\u060c\u061b])@([^@\s]{0,40})$/);
    if (!m) return null;
    return { from: at - (m[2].length + 1), to: at, q: m[2] };
  };

  Editor.prototype.mentionItems = function (q) {
    var out = [], i, f = fold(q);
    var anc = this.anchors();
    for (i = 0; i < anc.length; i++) {
      if (f && fold(anc[i].t).indexOf(f) < 0) continue;
      out.push({ k: 'h', t: anc[i].t, v: '#' + anc[i].a, lv: anc[i].lv });
      if (out.length > 24) return out;
    }
    var notes = (this.opts.noteList ? this.opts.noteList() : []) || [];
    for (i = 0; i < notes.length; i++) {
      var t = notes[i].t || '';
      if (!t) continue;
      if (f && fold(t).indexOf(f) < 0) continue;
      out.push({ k: 'n', t: t, v: 'note:' + notes[i].id });
      if (out.length > 24) return out;
    }
    return out;
  };

  /*@3.NOEJ.193*/
  Editor.prototype.closeMention = function () {
    if (!this._mn) return;
    if (this._mn.el && this._mn.el.parentNode) this._mn.el.remove();
    this._mn = null;
  };

  Editor.prototype.openMention = function (edn, span) {
    var items = this.mentionItems(span.q);
    if (!items.length) { this.closeMention(); return; }
    var self = this;
    var m = this._mn && this._mn.el;
    if (!m) {
      m = el('div', 'ne-menu ne-mn', { role: 'menu' });
      m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
      document.body.appendChild(m);
      m.addEventListener('mousedown', function (e) { e.preventDefault(); });
      m.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mv]');
        if (!b) return;
        self.pickMention(b.getAttribute('data-mv'), b.getAttribute('data-mt'));
      });
    }
    this._mn = { el: m, ed: edn, from: span.from, to: span.to, i: 0 };
    m.innerHTML =
      '<div class="ne-menu-h">' + B().esc(L('اربطْ بـ', 'Link to')) + '</div>' +
      items.map(function (it, k) {
        return '<button type="button" class="ne-menu-i" role="menuitem"' +
          (k ? '' : ' data-on="1"') +
          ' data-mv="' + B().esc(it.v) + '" data-mt="' + B().esc(it.t) + '">' +
          '<i class="fa-solid ' + (it.k === 'h' ? 'fa-hashtag' : 'fa-note-sticky') +
          '" aria-hidden="true"></i><span>' + B().esc(it.t) + '</span></button>';
      }).join('');
    this.placeMention(m, edn);
  };

  Editor.prototype.placeMention = function (m, edn) {
    var r = null;
    try {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        var rects = sel.getRangeAt(0).getClientRects();
        if (rects && rects.length) r = rects[rects.length - 1];
      }
    } catch (e) {}
    if (!r || (!r.width && !r.height)) r = edn.getBoundingClientRect();
    var mr = m.getBoundingClientRect();
    var pad = 8;
    var top = r.bottom + 4;
    if (top + mr.height > window.innerHeight - pad) top = Math.max(pad, r.top - mr.height - 4);
    m.style.insetBlockStart = Math.round(top) + 'px';
    m.style.left = Math.round(Math.max(pad,
      Math.min(r.left, window.innerWidth - mr.width - pad))) + 'px';
  };

  Editor.prototype.moveMention = function (dir) {
    if (!this._mn) return false;
    var list = [].slice.call(this._mn.el.querySelectorAll('[data-mv]'));
    if (!list.length) return false;
    var at = list.findIndex(function (b) { return b.hasAttribute('data-on'); });
    if (at < 0) at = 0; else list[at].removeAttribute('data-on');
    var next = (at + dir + list.length) % list.length;
    list[next].setAttribute('data-on', '1');
    try { list[next].scrollIntoView({ block: 'nearest' }); } catch (e) {}
    return true;
  };

  /*@3.NOEJ.194*/
  Editor.prototype.pickMention = function (target, label) {
    var st = this._mn;
    this.closeMention();
    if (!st || !target) return false;
    var edn = st.ed;
    if (!edn || !this.root.contains(edn)) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var rt = ref.get();
    var txt = String(label || target);
    var before = this.snapshot();
    var parts = sliceRuns(rt, st.from, st.to);
    var out = joinRuns([parts[0], [{ s: txt, lk: target }], parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    try { edn.focus(); } catch (e) {}
    selectRange(edn, st.from + txt.length, st.from + txt.length);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.pickMentionActive = function () {
    if (!this._mn) return false;
    var b = this._mn.el.querySelector('[data-mv][data-on]') ||
            this._mn.el.querySelector('[data-mv]');
    if (!b) return false;
    return this.pickMention(b.getAttribute('data-mv'), b.getAttribute('data-mt'));
  };

  Editor.prototype.selectRangeBetween = function (aId, bId) {
    var a = -1, b = -1, i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].id === aId) a = i;
      if (this.doc.blocks[i].id === bId) b = i;
    }
    if (a < 0 || b < 0) return 0;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var sel = (this._bsel = {});
    for (i = lo; i <= hi; i++) sel[this.doc.blocks[i].id] = 1;
    this._bselLast = bId;
    this.paintBlockSel();
    this.emitState();
    return (hi - lo) + 1;
  };

  Editor.prototype.endBlockDrag = function () {
    var st = this._bdrag;
    this._bdrag = null;
    if (!st || !st.on) return;
    this.root.removeAttribute('data-bdrag');
    try { window.getSelection().removeAllRanges(); } catch (e) {}
  };

  /*@3.NOEJ.173*/
  /*@3.NOEJ.187*/
  Editor.prototype.findAnchor = function (slug) {
    var M = window.GardenNotesMd;
    var raw = String(slug || '').replace(/^#/, '');
    try { raw = decodeURIComponent(raw); } catch (eD) {}
    var want = (M && M.slug) ? M.slug(raw) : raw.toLowerCase();
    if (!want) return null;
    var bs = this.doc.blocks || [], i, a;

    /*@3.NOEJ.188*/
    for (i = 0; i < bs.length; i++) if (bs[i].anc && String(bs[i].anc) === want) return bs[i].id;

    /*@3.NOEJ.189*/
    var heads = [];
    for (i = 0; i < bs.length; i++) {
      if (bs[i].ty !== 'h') continue;
      a = B().anchorOf(bs[i]);
      if (!a) continue;
      if (a === want) return bs[i].id;
      heads.push({ id: bs[i].id, a: a });
    }

    /*@3.NOEJ.190*/
    var only = null, hits = 0, h;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a === want + 's' || want === h.a + 's' ||
          h.a === want + 'es' || want === h.a + 'es') { only = h; hits++; }
    }
    if (hits === 1) return only.id;

    /*@3.NOEJ.191*/
    only = null; hits = 0;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a.indexOf(want + '-') === 0) { only = h; hits++; }
    }
    if (hits === 1) return only.id;
    if (want.length < 2) return null;
    only = null; hits = 0;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a.indexOf(want) === 0) { only = h; hits++; }
    }
    return hits === 1 ? only.id : null;
  };

  /*@3.NOEJ.174*/
  Editor.prototype.flashBlock = function (id) {
    /*@3.NOEJ.299*/
    if (this._win) this.winShow(String(id).replace(/"/g, ''));
    var node = this.root.querySelector('[data-bid="' + String(id).replace(/"/g, '') + '"]');
    if (!node) return false;
    try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    catch (e) { node.scrollIntoView(); }
    node.setAttribute('data-flash', '1');
    setTimeout(function () { node.removeAttribute('data-flash'); }, 1500);
    return true;
  };

  Editor.prototype.followLink = function (target) {
    var t = String(target || '');
    if (!t) return false;
    if (t.charAt(0) === '#') {
      var id = this.findAnchor(t);
      if (id) return this.flashBlock(id);
      if (this.opts.onLinkMiss) this.opts.onLinkMiss(t);
      return false;
    }
    if (/^note:/i.test(t)) {
      if (this.opts.onNoteLink) { this.opts.onNoteLink(t); return true; }
      return false;
    }
    return false;
  };

  /*@3.NOEJ.175*/
  Editor.prototype.anchors = function () {
    var out = [], bs = this.doc.blocks || [];
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].ty !== 'h') continue;
      var a = B().anchorOf(bs[i]);
      var t = B().runsToText(bs[i].rt || []).trim();
      if (a && t) out.push({ a: a, t: t, lv: bs[i].lv || 2 });
    }
    return out;
  };

  Editor.prototype.clearBlockSel = function () {
    if (!this._bsel || !Object.keys(this._bsel).length) return;
    this._bsel = {};
    this.paintBlockSel();
    this.emitState();
  };

/*@3.NOEJ.53*/
  Editor.prototype.blocksInRect = function (rect, add) {
    var sel = add ? this.blockSel() : (this._bsel = {});
    var rr = this.root.getBoundingClientRect();
    var x1 = rr.left + rect.x, y1 = rr.top + rect.y;
    var x2 = x1 + rect.w, y2 = y1 + rect.h;
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      var b = nodes[i].getBoundingClientRect();
      if (b.right < x1 || b.left > x2 || b.bottom < y1 || b.top > y2) continue;
      sel[nodes[i].getAttribute('data-bid')] = 1;
      n++;
    }
    this.paintBlockSel();
    this.emitState();
    return n;
  };

  Editor.prototype.blockAtPoint = function (x, y) {
    var rr = this.root.getBoundingClientRect();
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    for (var i = nodes.length - 1; i >= 0; i--) {
      var b = nodes[i].getBoundingClientRect();
      if (rr.left + x >= b.left && rr.left + x <= b.right &&
          rr.top + y >= b.top && rr.top + y <= b.bottom) {
        return nodes[i].getAttribute('data-bid');
      }
    }
    return null;
  };

  Editor.prototype.setSelectMode = function (on, tell) {
    this._selMode = !!on;
    this.root.setAttribute('data-selmode', this._selMode ? '1' : '0');
    if (!this._selMode) this.clearBlockSel();
    this.paintSelHint();
    /*@3.NOEJ.163*/
    if (tell && this.opts.onSelMode) this.opts.onSelMode(this._selMode);
    this.emitState();
  };

  /*@3.NOEJ.61*/
  Editor.prototype.paintSelHint = function () {
    var host = this.root.parentNode;
    if (!host) return;
    var bar = host.querySelector('.ne-selhint');
    if (!this._selMode) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = el('div', 'ne-selhint', { role: 'status' });
      bar.innerHTML =
        '<i class="fa-solid fa-object-ungroup" aria-hidden="true"></i>' +
        '<span class="ne-selhint-t">' +
        B().esc(L('اضغطْ على الكتل لتحديدها — والزرُّ نفسُه يُخرجك، أو Esc.',
                  'Tap blocks to select them — the same button exits, or press Esc.')) +
        '</span>' +
        '<button type="button" class="ne-selhint-b" data-selall="1">' +
        B().esc(L('حدّدِ الكلّ', 'Select all')) + '</button>';
      host.insertBefore(bar, this.root);
      var self = this;
      bar.addEventListener('click', function (e) {
        if (!e.target.closest('[data-selall]')) return;
        /*@3.NOEJ.92*/
        if (self.opts.onSelectAll) self.opts.onSelectAll();
        else self.selectAllBlocks();
      });
    }
    var n = this.selectedBlocks().length;
    var t = bar.querySelector('.ne-selhint-t');
    if (t && n) {
      t.textContent = L('حُدِّدت ', 'Selected ') + n +
        L(' كتلة — والزرُّ نفسُه يُخرجك، أو Esc.', ' blocks — the same button exits, or press Esc.');
    }
  };

  Editor.prototype.selectAllBlocks = function () {
    var sel = this.blockSel();
    for (var i = 0; i < this.doc.blocks.length; i++) sel[this.doc.blocks[i].id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

  /*@3.NOEJ.34*/
  /*@3.NOEJ.132*/
  var CLIP_KEY = 'garden_notes_clip';
  function clipStore(list) {
    try {
      var raw = JSON.stringify(list || []);
      if (raw.length < 400000) localStorage.setItem(CLIP_KEY, raw);
    } catch (e) {}
  }
  function clipLoad() {
    try { return JSON.parse(localStorage.getItem(CLIP_KEY) || 'null') || []; }
    catch (e) { return []; }
  }
  function clipAny() {
    if (Editor.clip && Editor.clip.length) return true;
    try { return (localStorage.getItem(CLIP_KEY) || '').length > 2; }
    catch (e) { return false; }
  }

  Editor.prototype.copyBlocks = function () {
    var picked = this.selectedBlocks();
    if (!picked.length) return 0;
    this.readAll();
    Editor.clip = JSON.parse(JSON.stringify(picked.map(function (h) { return h.b; })));
    clipStore(Editor.clip);
    var B2 = B();
    try {
      var txt = Editor.clip.map(function (b) { return B2.blockToText ? B2.blockToText(b) : ''; })
        .filter(Boolean).join('\n');
      if (txt && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt)['catch'](function () {});
      }
    } catch (e) {}
    return Editor.clip.length;
  };

  Editor.prototype.cutBlocks = function () {
    var n = this.copyBlocks();
    if (n) this.deleteBlocks();
    return n;
  };

  Editor.prototype.pasteBlocks = function () {
    if (!Editor.clip || !Editor.clip.length) Editor.clip = clipLoad();
    if (!Editor.clip || !Editor.clip.length) return 0;
    var before = this.snapshot();
    this.readAll();
    var picked = this.selectedBlocks();
    var at = picked.length ? picked[picked.length - 1].i + 1 : this.doc.blocks.length;
    var made = Editor.clip.map(function (b) {
      var c = JSON.parse(JSON.stringify(b));
      c.id = B().uid();
      return c;
    });
    var args = [at, 0].concat(made);
    Array.prototype.splice.apply(this.doc.blocks, args);
    this.pushUndo(before);
    this._bsel = {};
    for (var i = 0; i < made.length; i++) this._bsel[made[i].id] = 1;
    /*@3.NOEJ.151*/
    this.renderInsert(at, made);
    this.paintBlockSel();
    this.touch();
    this.emitState();
    return made.length;
  };

  Editor.prototype.deleteBlocks = function () {
    var picked = this.selectedBlocks();
    if (!picked.length) return 0;
    var before = this.snapshot();
    for (var i = picked.length - 1; i >= 0; i--) this.doc.blocks.splice(picked[i].i, 1);
    if (!this.doc.blocks.length) this.doc.blocks.push(B().blank('p'));
    this.pushUndo(before);
    this._bsel = {};
    this.render();
    this.touch();
    this.emitState();
    return picked.length;
  };

  /*@3.NOEJ.46*/
  /*@3.NOEJ.100*/
  /*@3.NOEJ.145*/
  Editor.prototype.sheetW = function () {
    if (this._sw > 0) return this._sw;
    var w = this.root.offsetWidth ||
            Math.round(this.root.getBoundingClientRect().width) || 794;
    if (w > 0) this._sw = w;
    return w;
  };

  Editor.prototype.zoomOf = function () {
    var w = this.root.offsetWidth;
    if (!w) return 1;
    var z = this.root.getBoundingClientRect().width / w;
    return (isFinite(z) && z > 0.05) ? z : 1;
  };

  Editor.prototype.isRtl = function () {
    try { return getComputedStyle(this.root).direction === 'rtl'; }
    catch (e) { return false; }
  };

  Editor.prototype.localPoint = function (clientX, clientY) {
    var r = this.root.getBoundingClientRect();
    var z = this.zoomOf();
    var x = this.isRtl() ? (r.right - clientX) : (clientX - r.left);
    return { x: x / z, y: (clientY - r.top) / z, w: this.sheetW() };
  };

  /*@3.NOEJ.64*/
  Editor.prototype.applyWidth = function (node, b) {
    var W = this.sheetW() || 794;
    var wm = b.wm;
    node.style.inlineSize = '';
    node.style.maxInlineSize = '';
    if (b.fp) {
      var room = Math.max(0.08, 1 - (b.fp.x || 0));
      if (typeof wm === 'number' && wm > 0) {
        node.setAttribute('data-wm', 'px');
        node.style.inlineSize = (Math.min(wm, room) * W) + 'px';
      } else if (wm === 'full') {
        /*@3.NOEJ.89*/
        node.setAttribute('data-wm', 'full');
        node.style.insetInlineStart = '0px';
        node.style.inlineSize = W + 'px';
      } else {
        node.setAttribute('data-wm', 'fit');
        node.style.maxInlineSize = (room * W) + 'px';
      }
      return;
    }
    if (typeof wm === 'number' && wm > 0) {
      node.setAttribute('data-wm', 'px');
      node.style.inlineSize = (Math.min(1, wm) * W) + 'px';
    } else if (wm === 'fit') {
      node.setAttribute('data-wm', 'fit');
    } else {
      node.removeAttribute('data-wm');
    }
  };

  /*@3.NOEJ.101*/
  Editor.prototype.applyFree = function (node, b) {
    if (!node) return;
    if (!b.fp) {
      node.removeAttribute('data-fp');
      node.style.insetInlineStart = ''; node.style.left = ''; node.style.right = '';
      node.style.top = ''; node.style.zIndex = '';
      this.applyWidth(node, b);
      return;
    }
    var W = this.sheetW();
    node.setAttribute('data-fp', '1');
    node.style.left = ''; node.style.right = '';
    node.style.insetInlineStart = Math.round(b.fp.x * W) + 'px';
    node.style.top = Math.round(b.fp.y) + 'px';
    /*@3.NOEJ.65*/
    /*@3.NOEJ.135*/
    node.style.zIndex = String((b.zi ? 31 : 4) + (b.z || 0));
    /*@3.NOEJ.123*/
    node.style.transform = b.rot ? ('rotate(' + b.rot + 'deg)') : '';
    node.style.transformOrigin = b.rot ? 'center center' : '';
    /*@3.NOEJ.57*/
    this.applyWidth(node, b);
  };

  /*@3.NOEJ.71*/
  Editor.prototype.topZ = function () {
    var top = 0;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var z = this.doc.blocks[i].z;
      if (typeof z === 'number' && z > top) top = z;
    }
    return top;
  };

  Editor.prototype.setZ = function (id, how) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    if (how !== 'front' && how !== 'back' && how !== 'up' && how !== 'down') return false;
    var before = this.snapshot();
    /*@3.NOEJ.133*/
    var frees = this.doc.blocks.filter(function (b) { return b.fp; });
    frees.sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    for (var i = 0; i < frees.length; i++) frees[i].z = i + 1;
    var at = frees.indexOf(hit.b);
    if (how === 'front') { hit.b.z = frees.length + 1; hit.b.zi = 1; }
    else if (how === 'back') { hit.b.z = 0; delete hit.b.zi; }
    else if (how === 'up') {
      if (at >= 0 && at < frees.length - 1) {
        hit.b.z = at + 2; frees[at + 1].z = at + 1;
      } else if (!hit.b.zi) hit.b.zi = 1;
    } else if (how === 'down') {
      if (hit.b.zi) delete hit.b.zi;
      else if (at > 0) { hit.b.z = at; frees[at - 1].z = at + 1; }
    }
    this.pushUndo(before);
    for (var j = 0; j < frees.length; j++) {
      var n = this.root.querySelector('[data-bid="' + frees[j].id + '"]');
      if (n) this.applyFree(n, frees[j]);
    }
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.bottomZ = function () {
    var low = 0;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var z = this.doc.blocks[i].z;
      if (typeof z === 'number' && z < low) low = z;
    }
    return low;
  };

  /*@3.NOEJ.80*/
  Editor.prototype.unfree = function (id) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var before = this.snapshot();
    this.readAll();
    delete hit.b.fp;
    delete hit.b.z;
    if (hit.b.wm === 'fit') delete hit.b.wm;
    this.pushUndo(before);
    this.render();
    this.focusBlock(id);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.setFreeAlign = function (id, how) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return false;
    var W = this.sheetW();
    var w = (node.offsetWidth || 120) / W;
    var before = this.snapshot();
    var x = 0;
    if (how === 'center') x = Math.max(0, (1 - w) / 2);
    else if (how === 'end') x = Math.max(0, 1 - w);
    hit.b.fp.x = x;
    this.pushUndo(before);
    this.applyFree(node, hit.b);
    this.dropTail();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.256*/
  Editor.prototype.coarse = function () {
    if (this._coarse == null) {
      try { this._coarse = !!(window.matchMedia && matchMedia('(hover: none)').matches); }
      catch (e) { this._coarse = false; }
    }
    return this._coarse;
  };

  Editor.prototype.touchAct = function (id) {
    var prev = this._actId
      ? this.root.querySelector(':scope > [data-bid="' + this._actId + '"]') : null;
    if (prev) prev.removeAttribute('data-act');
    this._actId = id || '';
    if (!id) { this.chromeTo(null); return; }
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return;
    node.setAttribute('data-act', '1');
    this.chromeTo(node);
  };

  /*@3.NOEJ.257*/
  Editor.prototype.reAct = function () {
    if (!this._actId) return;
    var node = this.root.querySelector(':scope > [data-bid="' + this._actId + '"]');
    if (!node) { this._actId = ''; return; }
    node.setAttribute('data-act', '1');
    this.chromeTo(node);
  };

  Editor.prototype.makeFree = function (id) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.fp) return false;
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return false;
    var before = this.snapshot();
    this.readAll();
    var r = this.root.getBoundingClientRect();
    var nr = node.getBoundingClientRect();
    var z = this.zoomOf(), W = this.sheetW();
    hit.b.fp = {
      x: Math.max(0, Math.min(0.9,
         (this.isRtl() ? (r.right - nr.right) : (nr.left - r.left)) / z / W)),
      y: Math.max(0, Math.round((nr.top - r.top) / z))
    };
    if (hit.b.wm == null) hit.b.wm = WIDE[hit.b.ty] ? 'full' : 'fit';
    hit.b.z = this.topZ() + 1;
    this.pushUndo(before);
    this.render();
    this.focusBlock(id);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.72*/
  Editor.prototype.setWidth = function (id, mode) {
    var picked = this.selectedBlocks();
    if (!picked.length) {
      var h0 = this.blockAt(id);
      if (!h0) return false;
      picked = [h0];
    }
    var before = this.snapshot();
    var self = this;
    picked.forEach(function (hit) {
      if (mode == null || mode === 'auto') delete hit.b.wm;
      else hit.b.wm = mode;
      if (mode === 'full' && hit.b.fp) hit.b.fp.x = 0;
      if (mode === 'fit' && hit.b.fp) hit.b.fp.x = Math.min(hit.b.fp.x || 0, 0.9);
      var node = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (node) self.applyFree(node, hit.b);
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.66*/
  Editor.prototype.freeH = function (id) {
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    return node ? (node.offsetHeight || node.getBoundingClientRect().height / this.zoomOf()) : 40;
  };

  /*@3.NOEJ.127*/
  Editor.prototype.freeGroup = function (b) {
    var sel = this._bsel || {}, out = [], i, o, n;
    if (sel[b.id]) {
      for (i = 0; i < this.doc.blocks.length; i++) {
        o = this.doc.blocks[i];
        if (!o.fp || !sel[o.id]) continue;
        n = this.root.querySelector('[data-bid="' + o.id + '"]');
        if (n) out.push({ b: o, node: n, ox: o.fp.x || 0, oy: o.fp.y || 0 });
      }
    }
    if (out.length > 1) return out;
    n = this.root.querySelector('[data-bid="' + b.id + '"]');
    return [{ b: b, node: n, ox: b.fp.x || 0, oy: b.fp.y || 0 }];
  };

  Editor.prototype.fpUnder = function (b, id) {
    var x = b.fp.x;
    var y = b.fp.y + this.freeH(id) + 8;
    /*@3.NOEJ.67*/
    for (var guard = 0; guard < 40; guard++) {
      var hit = null;
      for (var i = 0; i < this.doc.blocks.length; i++) {
        var o = this.doc.blocks[i];
        if (!o.fp || o.id === id) continue;
        if (Math.abs((o.fp.x || 0) - x) > 0.22) continue;
        if (Math.abs((o.fp.y || 0) - y) > 14) continue;
        hit = o;
        break;
      }
      if (!hit) break;
      y = hit.fp.y + this.freeH(hit.id) + 8;
    }
    return { x: x, y: y };
  };

  Editor.prototype.layoutFree = function () {
    /*@3.NOEJ.148*/
    this._sw = 0;
    if (this.doc.fpv !== 2) this.migrateFp();
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (!b.fp) continue;
      this.applyFree(this.root.querySelector('[data-bid="' + b.id + '"]'), b);
    }
    this.dropTail();
    this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
  };

  Editor.prototype.migrateFp = function () {
    /*@3.NOEJ.102*/
    var W = this.sheetW(), z = this.zoomOf(), rtl = this.isRtl();
    var r = this.root.getBoundingClientRect();
    var list = [], i, b, node;
    for (i = 0; i < this.doc.blocks.length; i++) {
      b = this.doc.blocks[i];
      if (!b.fp) continue;
      node = this.root.querySelector('[data-bid="' + b.id + '"]');
      if (!node) continue;
      node.style.insetInlineStart = ''; node.style.right = '';
      node.style.left = (b.fp.x * W) + 'px';
      node.style.top = (b.fp.y * W) + 'px';
      list.push([b, node]);
    }
    for (i = 0; i < list.length; i++) {
      var nr = list[i][1].getBoundingClientRect();
      var fp = list[i][0].fp;
      fp.x = Math.max(0, Math.min(0.96,
        (rtl ? (r.right - nr.right) : (nr.left - r.left)) / z / W));
      fp.y = Math.max(0, Math.round((nr.top - r.top) / z));
      list[i][1].style.left = '';
    }
    this.doc.fpv = 2;
    if (list.length) this.mark(true);
  };

  function offRel(node, base) {
    var r1 = node.getBoundingClientRect(), r0 = base.getBoundingClientRect();
    return r1.top - r0.top;
  }

  Editor.prototype.stripBreaks = function (tbl) {
    var rs = tbl.querySelectorAll('tr[data-brk]'), i;
    for (i = 0; i < rs.length; i++) rs[i].parentNode.removeChild(rs[i]);
  };

  Editor.prototype.clearTableBreaks = function () {
    var ts = this.root.querySelectorAll('table.ne-tbl'), i;
    for (i = 0; i < ts.length; i++) {
      this.stripBreaks(ts[i]);
      ts[i].removeAttribute('data-brk-sig');
    }
  };

  /*@3.NOEJ.217*/
  Editor.prototype.fitTable = function (tbl, top0, ph, pad, z) {
    this.stripBreaks(tbl);
    var body = tbl.tBodies[0] || tbl;
    var rows = [].slice.call(tbl.rows);
    if (rows.length < 2) { tbl.removeAttribute('data-brk-sig'); return false; }

    var hdrH = rows[0].getBoundingClientRect().height / z;
    var cols = rows[0].cells.length;
    var tblTop = tbl.getBoundingClientRect().top;
    var cuts = [], acc = 0, i;

    for (i = 1; i < rows.length; i++) {
      var r = rows[i].getBoundingClientRect();
      var rt = top0 + (r.top - tblTop) / z + acc;
      var rh = r.height / z;
      var pg = Math.floor(rt / ph);
      var limit = (pg + 1) * ph - pad - CUT_SAFE;
      if (rt + rh <= limit + 0.5) continue;
      var gap = Math.round((pg + 1) * ph + pad - rt);
      if (gap <= 0) continue;
      cuts.push({ i: i, gap: gap });
      acc += gap + hdrH;
    }

    var sig = cuts.map(function (c) { return c.i + ':' + c.gap; }).join(',') +
      '|' + Math.round(hdrH) + '|' + cols;
    var same = tbl.getAttribute('data-brk-sig') === sig;
    tbl.setAttribute('data-brk-sig', sig);
    if (!cuts.length) return !same;

    for (i = cuts.length - 1; i >= 0; i--) {
      var at = rows[cuts[i].i];
      var host = at.parentNode || body;
      var hc = rows[0].cloneNode(true);
      hc.setAttribute('data-brk', 'h');
      var hcs = hc.querySelectorAll('td,th'), k;
      for (k = 0; k < hcs.length; k++) {
        hcs[k].removeAttribute('contenteditable');
        hcs[k].removeAttribute('data-bid');
      }
      hc.setAttribute('aria-hidden', 'true');
      host.insertBefore(hc, at);

      var gp = document.createElement('tr');
      gp.setAttribute('data-brk', 'g');
      gp.setAttribute('aria-hidden', 'true');
      var gtd = document.createElement('td');
      gtd.colSpan = cols;
      gtd.className = 'ne-brk-g';
      gtd.style.height = cuts[i].gap + 'px';
      gp.appendChild(gtd);
      host.insertBefore(gp, hc);
    }
    return !same;
  };

  Editor.prototype.tableGuard = function (a, map) {
    var ph = this.pageH(), off = this.root.offsetTop || 0;
    var pad = off > 0 ? off : 16;
    var z = this.zoomOf() || 1;
    var changed = false, i;
    if (!map) map = this.bidMap();
    for (i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (!b || b.ty !== 'tbl' || b.fp) continue;
      var node = map[b.id];
      var tbl = node && node.querySelector('table.ne-tbl');
      if (!tbl || a[i] == null) continue;
      var inner = offRel(tbl, node) / z;
      if (this.fitTable(tbl, a[i] + off + inner, ph, pad, z)) changed = true;
    }
    return changed;
  };

  /*@3.NOEJ.154*/
  /*@3.NOEJ.238*/
  Editor.prototype.captureEng = function (full) {
    if (this.doc.kind === 'board') return;
    /*@3.NOEJ.311*/
    if (this._engIn) { if (full) this._engStale = true; return; }
    this._engIn = 1;
    try { this.engPass(full); } finally { this._engIn = 0; }
  };

  Editor.prototype.engPass = function (full) {
    /*@3.NOEJ.284*/
    if (this._win) {
      if (!full) { this.winSettle(); return; }
      this.winClear();
    }
    /*@3.NOEJ.213*/
    if (!this._engStale && !this._engVerify && this._nat &&
        this.doc.eng && this.doc.eng.pbv === PBV) {
      this.winBind();
      if (this.winOk()) this.winApply(false);
      return;
    }
    this._engVerify = false;
    /*@3.NOEJ.157*/
    var faceOk = true;
    try {
      faceOk = document.fonts.status === 'loaded' &&
               document.fonts.check('16px "Thmanyah Sans"');
    } catch (eF) {}
    if (!faceOk) { this._engRecap = true; return; }

    /*@3.NOEJ.203*/
    var i, b, node;
    var map = this.bidMap();
    var bs = this.doc.blocks, n = bs.length;
    var top = new Array(n), hgt = new Array(n), nds = new Array(n);
    var mine = new Array(n), live = 0;
    /*@3.NOEJ.241*/
    var r0 = this.root.getBoundingClientRect().top;
    /*@3.NOEJ.279*/
    var z = this.zoomOf() || 1;
    for (i = 0; i < n; i++) {
      b = bs[i];
      node = b.fp ? null : map[b.id];
      if (!node) { top[i] = null; hgt[i] = 0; nds[i] = null; mine[i] = 0; continue; }
      var rr = node.getBoundingClientRect();
      top[i] = (rr.top - r0) / z;
      hgt[i] = rr.height / z;
      nds[i] = node;
      /*@3.NOEJ.239*/
      mine[i] = node.__bd || 0;
      live++;
    }
    if (!live) {
      delete this.doc.eng;
      this.clearTableBreaks();
      this.clearMargins();
      return;
    }

    var oldA = (this.doc.eng && this.doc.eng.v === 3 &&
                Array.isArray(this.doc.eng.a) && this.doc.eng.a.length === n)
               ? this.doc.eng.a : null;
    var oldPb = (this.doc.eng && Array.isArray(this.doc.eng.pb) &&
                 this.doc.eng.pb.length === n) ? this.doc.eng.pb : null;

    var out = this.breakGuard(top, hgt, nds, mine);
    /*@3.NOEJ.182*/
    var cd = contentDir(this.doc);
    if (cd) this.doc.bd = cd; else delete this.doc.bd;
    var pad0 = this.root.offsetTop || 16;
    /*@3.NOEJ.158*/
    var mk = {};
    for (i = 0; i < n; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
    this.doc.eng = { v: 3, w: 794, h: Math.round(this._engBot + pad0),
                     a: out.a, pb: out.pb, mk: mk, pbv: PBV, nat: this.natPack() };
    this._engStale = false;
    this.applyEng();
    this.mkFix(out, nds, r0, z);
    this._engBot = 0;
    for (i = 0; i < n; i++) {
      if (!nds[i] || out.a[i] == null) continue;
      out.a[i] = (nds[i].getBoundingClientRect().top - r0) / z;
      var bot = out.a[i] + hgt[i];
      if (bot > this._engBot) this._engBot = bot;
    }
    this.doc.eng.h = Math.round(this._engBot + pad0);
    /*@3.NOEJ.226*/
    if (this.root.querySelector('table.ne-tbl')) {
      /*@3.NOEJ.219*/
      var pass = (this._engPass || 0) + 1;
      /*@3.NOEJ.222*/
      if (pass < 3 && this.tableGuard(out.a, map)) {
        this._engPass = pass;
        this._engStale = true;
        this.engPass(true);
        this._engPass = 0;
        return;
      }
      this._engPass = 0;
    }
    /*@3.NOEJ.209*/
    if (this.opts.onEngShift && oldA) this.emitShift(oldA, oldPb, out);
    /*@3.NOEJ.298*/
    this.winBind();
    if (this.winOk()) this.winApply(true);
  };

  /*@3.NOEJ.277*/
  Editor.prototype.mkFix = function (out, nds, r0, z) {
    var bs = this.doc.blocks, n = Math.min(bs.length, out.m.length);
    var map = nds ? null : this.bidMap();
    var round, carry, worst, i, node, act, e2, mk, any = false;
    if (r0 == null) r0 = this.root.getBoundingClientRect().top;
    if (!(z > 0.05)) z = this.zoomOf() || 1;
    for (round = 0; round < 2; round++) {
      carry = 0; worst = 0;
      for (i = 0; i < n; i++) {
        if (!(out.m[i] > 0) || out.a[i] == null) continue;
        node = nds ? nds[i] : map[bs[i].id];
        if (!node) continue;
        act = (node.getBoundingClientRect().top - r0) / z;
        e2 = (act - out.a[i]) - carry;
        if (Math.abs(e2) <= 0.4) continue;
        out.m[i] = Math.max(0, Math.round((out.m[i] - e2) * 100) / 100);
        carry += e2;
        any = true;
        if (Math.abs(e2) > worst) worst = Math.abs(e2);
      }
      if (!worst) break;
      mk = {};
      for (i = 0; i < bs.length; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
      this.doc.eng.mk = mk;
      this.applyEng();
    }
    return any;
  };

  Editor.prototype.emitShift = function (oldA, oldPb, out) {
    var off = this.root.offsetTop || 0, regs = [], any = false, i;
    var n = Math.min(oldA.length, out.a.length);
    for (i = 0; i < n; i++) {
      if (oldA[i] == null || out.a[i] == null) continue;
      var dz = out.pb[i] - (oldPb ? oldPb[i] : 0);
      if (!regs.length || regs[regs.length - 1].by !== dz) {
        regs.push({ from: oldA[i] + off, by: dz });
      }
      if (dz) any = true;
    }
    if (any) this.opts.onEngShift(regs);
  };

  /*@3.NOEJ.208*/
  Editor.prototype.breakGuard = function (top, hgt, nds, mine) {
    var n = top.length, i;
    var gap = new Array(n), lh = new Array(n), ids = new Array(n);
    var prevBot = 0, first = true, std = 0;
    var bs = this.doc.blocks;
    for (i = 0; i < n; i++) {
      ids[i] = bs[i] ? bs[i].id : '';
      lh[i] = 0;
      if (top[i] == null) { gap[i] = null; continue; }
      var g = (first ? top[i] : (top[i] - prevBot)) - (mine[i] || 0);
      gap[i] = g > 0 ? g : 0;
      if (!first && !std && gap[i] > 0) std = gap[i];
      first = false;
      prevBot = top[i] + (hgt[i] || 0);
    }
    this._nat = { gap: gap, hgt: hgt.slice(), lh: lh, ids: ids,
                  std: std, n: n,
                  ph: this.pageH(), pad: this.root.offsetTop || 0 };
    this._natIdx = null;
    return this.breakCalc();
  };

  Editor.prototype.breakCalc = function () {
    var nat = this._nat;
    if (!nat) return null;
    var ph = nat.ph || this.pageH();
    var off = nat.pad == null ? (this.root.offsetTop || 0) : nat.pad;
    var pad = off > 0 ? off : 16;
    var room = ph - pad * 2;
    var gap = nat.gap, hgt = nat.hgt, lh = nat.lh;
    var bs = this.doc.blocks, n = gap.length, i;
    var a = new Array(n), pb = new Array(n), m = new Array(n);
    var y = 0, acc = 0;
    this._engBot = 0;
    for (i = 0; i < n; i++) {
      if (gap[i] == null) { a[i] = null; pb[i] = acc; m[i] = 0; continue; }
      y += gap[i];
      var t = y + off, h = hgt[i] || 0;
      var pg = Math.floor(t / ph);
      var limit = (pg + 1) * ph - pad - CUT_SAFE;
      var d = 0;
      if (h > 0 && t + h > limit + 0.5) {
        if (h <= room) {
          /*@3.NOEJ.215*/
          d = (pg + 1) * ph + pad - t;
        } else if (bs[i] && bs[i].ty === 'tbl') {
          /*@3.NOEJ.221*/
          d = 0;
        } else {
          /*@3.NOEJ.216*/
          var L = lh[i];
          if (!L) {
            L = lineOf(bs[i]
              ? this.root.querySelector(':scope > [data-bid="' + bs[i].id + '"]')
              : null);
            lh[i] = L;
          }
          if (L > 4) {
            var over = (limit - t) % L;
            if (over > 0.5) d = L - over;
          }
        }
      }
      if (d > 0.5) { y += d; acc += d; m[i] = Math.round(d * 100) / 100; }
      else { d = 0; m[i] = 0; }
      a[i] = y;
      pb[i] = acc;
      y += h;
      if (y > this._engBot) this._engBot = y;
    }
    return { a: a, pb: pb, m: m };
  };

  function rleOut(arr) {
    var out = [], i, v, n = 0, cur;
    for (i = 0; i < arr.length; i++) {
      v = arr[i];
      if (n && v === cur) { n++; continue; }
      if (n) out.push(n === 1 ? cur : [n, cur]);
      cur = v; n = 1;
    }
    if (n) out.push(n === 1 ? cur : [n, cur]);
    return out;
  }

  function rleIn(src, len) {
    if (!Array.isArray(src)) return null;
    var out = [], i, e, k;
    for (i = 0; i < src.length; i++) {
      e = src[i];
      if (Array.isArray(e)) {
        if (!(e[0] > 0)) return null;
        for (k = 0; k < e[0]; k++) out.push(e[1]);
      } else out.push(e);
      if (out.length > len) return null;
    }
    return out.length === len ? out : null;
  }

  /*@3.NOEJ.312*/
  Editor.prototype.natPack = function () {
    var nat = this._nat, bs = this.doc.blocks;
    if (!nat || nat.ids.length !== bs.length) return null;
    var g = new Array(bs.length), h = new Array(bs.length), i, v;
    for (i = 0; i < bs.length; i++) {
      v = nat.gap[i];
      g[i] = (v == null) ? null : Math.round(v * 100) / 100;
      v = nat.hgt[i];
      h[i] = (v == null) ? 0 : Math.round(v * 100) / 100;
    }
    return { n: bs.length, g: rleOut(g), h: rleOut(h),
             std: Math.round((nat.std || 0) * 100) / 100,
             ph: Math.round(nat.ph || 0), pad: Math.round(nat.pad || 0) };
  };

  Editor.prototype.natLoad = function () {
    var eng = this.doc.eng, bs = this.doc.blocks;
    if (!eng || eng.v !== 3 || eng.pbv !== PBV || eng.w !== 794) return false;
    if (!Array.isArray(eng.a) || eng.a.length !== bs.length) return false;
    if (this.doc.kind === 'board') return false;
    var nt = eng.nat;
    if (!nt || nt.n !== bs.length) return false;
    if (!(nt.ph > 200) || Math.abs(nt.ph - this.pageH()) > 1) return false;
    var gap = rleIn(nt.g, bs.length), hgt = rleIn(nt.h, bs.length);
    if (!gap || !hgt) return false;
    var i;
    var ids = new Array(bs.length), lh = new Array(bs.length);
    for (i = 0; i < bs.length; i++) { ids[i] = bs[i].id; lh[i] = 0; }
    this._nat = { gap: gap, hgt: hgt, lh: lh, ids: ids,
                  std: nt.std || 2.4, n: bs.length,
                  ph: nt.ph, pad: nt.pad || 0 };
    this._natIdx = null;
    return true;
  };

  Editor.prototype.natIdx = function () {
    var nat = this._nat;
    if (!nat) return null;
    if (this._natIdx && this._natIdx.n === nat.ids.length) return this._natIdx.m;
    var m = {}, i;
    for (i = 0; i < nat.ids.length; i++) m[nat.ids[i]] = i;
    this._natIdx = { n: nat.ids.length, m: m };
    return m;
  };

  Editor.prototype.natSplice = function (at, del, ids) {
    var nat = this._nat;
    if (!nat) return false;
    if (at < 0 || at > nat.ids.length) return false;
    var add = ids ? ids.length : 0, i;
    var g = nat.std || 2.4;
    var ng = [], nh = [], nl = [];
    for (i = 0; i < add; i++) { ng.push(g); nh.push(0); nl.push(0); }
    if (at === 0 && add && nat.gap.length && nat.gap[0] != null) {
      ng[0] = nat.gap[0];
      if (del < nat.gap.length) nat.gap[del] = g;
    }
    Array.prototype.splice.apply(nat.gap, [at, del].concat(ng));
    Array.prototype.splice.apply(nat.hgt, [at, del].concat(nh));
    Array.prototype.splice.apply(nat.lh, [at, del].concat(nl));
    Array.prototype.splice.apply(nat.ids, [at, del].concat(ids || []));
    nat.n = nat.ids.length;
    this._natIdx = null;
    return true;
  };

  Editor.prototype.natMove = function (from, to) {
    var nat = this._nat;
    if (!nat || from === to) return false;
    if (from < 0 || from >= nat.ids.length || to < 0 || to >= nat.ids.length) return false;
    var keys = ['gap', 'hgt', 'lh', 'ids'], k;
    for (k = 0; k < keys.length; k++) {
      var arr = nat[keys[k]];
      arr.splice(to, 0, arr.splice(from, 1)[0]);
    }
    this._natIdx = null;
    return true;
  };

  /*@3.NOEJ.262*/
  Editor.prototype.natSync = function (nodes) {
    var nat = this._nat, idx = this.natIdx();
    if (!nat || !idx || !nodes) return false;
    var i, id, k, h, hit = false;
    var zn = this.zoomOf() || 1;
    for (i = 0; i < nodes.length; i++) {
      if (!nodes[i] || !nodes[i].getAttribute) continue;
      if (nodes[i].hasAttribute('data-fp')) continue;
      id = nodes[i].getAttribute('data-bid');
      k = idx[id];
      if (k == null || nat.ids[k] !== id) continue;
      h = nodes[i].getBoundingClientRect().height / zn;
      if (Math.abs((nat.hgt[k] || 0) - h) < 0.5) continue;
      nat.hgt[k] = h;
      nat.lh[k] = 0;
      hit = true;
    }
    return hit;
  };

  Editor.prototype.natOk = function () {
    var nat = this._nat, bs = this.doc.blocks;
    if (!nat || nat.ids.length !== bs.length) return false;
    if (this.doc.kind === 'board') return false;
    return true;
  };

  Editor.prototype.reflowEng = function () {
    if (!this.natOk()) return false;
    var out = this.breakCalc();
    if (!out) return false;
    var bs = this.doc.blocks, mk = {}, i;
    for (i = 0; i < bs.length; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
    var nat0 = this._nat;
    var pad0 = (nat0 && nat0.pad > 0) ? nat0.pad : (this.root.offsetTop || 16);
    var oldA = (this.doc.eng && Array.isArray(this.doc.eng.a) &&
                this.doc.eng.a.length === bs.length) ? this.doc.eng.a : null;
    var oldPb = (this.doc.eng && Array.isArray(this.doc.eng.pb) &&
                 this.doc.eng.pb.length === bs.length) ? this.doc.eng.pb : null;
    this.doc.eng = { v: 3, w: 794, h: Math.round(this._engBot + pad0),
                     a: out.a, pb: out.pb, mk: mk, pbv: PBV, nat: this.natPack() };
    this._engStale = false;
    this._natRe = (this._natRe || 0) + 1;
    if (this._natRe > 300) { this._natRe = 0; this._engVerify = true; }
    this._roOff = true;
    this.applyEng();
    this._roOff = false;
    if (this.opts.onEngShift && oldA) this.emitShift(oldA, oldPb, out);
    if (this.opts.onLayout) this.opts.onLayout();
    if (this.opts.onGeom) this.opts.onGeom();
    return true;
  };

  /*@3.NOEJ.280*/
  Editor.prototype.winOk = function () {
    /*@3.NOEJ.307*/
    if (this.opts.win === false) return false;
    if (this.opts.win !== true && !winSwitch()) return false;
    if (this.doc.kind === 'board') return false;
    if (!this.natOk()) return false;
    var eng = this.doc.eng, bs = this.doc.blocks;
    if (!eng || eng.v !== 3 || !Array.isArray(eng.a) || eng.a.length !== bs.length) return false;
    if (bs.length < WIN_MIN) return false;
    if (this._bdrag || this._drag || this._wdrag || this._rdrag) return false;
    if (this._bsel) { for (var q in this._bsel) if (this._bsel[q]) return false; }
    return !!this.scroller();
  };

  /*@3.NOEJ.285*/
  Editor.prototype.winBase = function (sc) {
    return this.root.getBoundingClientRect().top -
           sc.getBoundingClientRect().top + sc.scrollTop;
  };

  Editor.prototype.winRange = function () {
    var sc = this.scroller();
    if (!sc) return null;
    var eng = this.doc.eng, nat = this._nat, n = this.doc.blocks.length;
    var z = this.zoomOf() || 1;
    var base = this.winBase(sc);
    var top = (sc.scrollTop - base) / z - WIN_PAD;
    var bot = (sc.scrollTop - base + sc.clientHeight) / z + WIN_PAD;
    var from = -1, to = -1, i, y0, y1;
    for (i = 0; i < n; i++) {
      if (eng.a[i] == null) continue;
      y0 = eng.a[i];
      y1 = y0 + (nat.hgt[i] || 0);
      if (y1 < top) continue;
      if (y0 > bot) break;
      if (from < 0) from = i;
      to = i;
    }
    if (from < 0) { from = 0; to = Math.min(n - 1, WIN_SPAN); }
    return [from, to];
  };

  /*@3.NOEJ.282*/
  Editor.prototype.winKeep = function () {
    /*@3.NOEJ.314*/
    var out = [], self = this, ce = this.currentEditable();
    var nd = ce && ce.closest ? ce.closest('[data-bid]') : null;
    if (nd && nd.parentNode === this.root) out.push(nd.getAttribute('data-bid'));
    if (this._actId) out.push(this._actId);
    var bs = this.doc.blocks, i;
    for (i = 0; i < bs.length; i++) if (bs[i].prov) out.push(bs[i].id);
    return out.filter(function (id) {
      var hit = self.blockAt(id);
      return !!hit && !hit.b.fp;
    });
  };

  Editor.prototype.winPin = function (rng) {
    var keep = this.winKeep(), i, hit, k;
    for (i = 0; i < keep.length; i++) {
      hit = this.blockAt(keep[i]);
      if (!hit) continue;
      k = hit.i;
      if (k >= rng[0] && k <= rng[1]) continue;
      if (k < rng[0] && rng[0] - k <= WIN_SPAN) { rng[0] = k; continue; }
      if (k > rng[1] && k - rng[1] <= WIN_SPAN) { rng[1] = k; continue; }
      /*@3.NOEJ.303*/
      var ce = this.currentEditable();
      if (ce && ce.closest && ce.closest('[data-bid="' + keep[i] + '"]')) {
        try { ce.blur(); } catch (eB) {}
      }
    }
    return rng;
  };

  /*@3.NOEJ.283*/
  Editor.prototype.winPad = function (which) {
    var key = which === 'a' ? '_winA' : '_winB';
    if (this[key] && this[key].parentNode === this.root) return this[key];
    var el = document.createElement('div');
    el.className = 'ne-win';
    el.setAttribute('data-win', which);
    el.setAttribute('aria-hidden', 'true');
    this[key] = el;
    return el;
  };

  /*@3.NOEJ.286*/
  Editor.prototype.winSet = function (from, to) {
    var bs = this.doc.blocks, root = this.root, eng = this.doc.eng, nat = this._nat;
    var i, node, id, k;
    var idx = {}, live = {};
    for (i = 0; i < bs.length; i++) idx[bs[i].id] = i;
    var kids = root.querySelectorAll(':scope > [data-bid]');
    var out = [];
    for (i = 0; i < kids.length; i++) {
      id = kids[i].getAttribute('data-bid');
      k = idx[id];
      if (k != null && (bs[k].fp || (k >= from && k <= to))) { live[id] = kids[i]; continue; }
      out.push(kids[i]);
    }
    /*@3.NOEJ.304*/
    for (i = 0; i < out.length; i++) {
      id = out[i].getAttribute('data-bid');
      this.readBlock(out[i]);
      this.dropCanvas(id);
      this.roDrop(out[i]);
      out[i].remove();
    }
    this._sw = 0;
    this.sheetW();
    var padB = this.winPad('b');
    if (padB.parentNode !== root) {
      var tail = root.querySelector(':scope > .ne-tail');
      if (tail) root.insertBefore(padB, tail); else root.appendChild(padB);
    }
    var anchor = padB;
    for (i = to; i >= from; i--) {
      node = live[bs[i].id];
      if (!node) {
        node = this.renderBlock(bs[i]);
        root.insertBefore(node, anchor);
        this.roAdd(node);
      } else if (node.nextSibling !== anchor) {
        root.insertBefore(node, anchor);
      }
      node.classList.remove('ne-w0');
      anchor = node;
    }
    var padA = this.winPad('a');
    if (padA.nextSibling !== anchor || padA.parentNode !== root) {
      root.insertBefore(padA, anchor);
    }
    /*@3.NOEJ.305*/
    var a0 = eng.a[0] || 0;
    var aH = Math.max(0, (eng.a[from] || 0) - a0);
    var bot = (eng.a[to] || 0) + (nat.hgt[to] || 0);
    var pad0 = (nat && nat.pad > 0) ? nat.pad : (root.offsetTop || 16);
    var bH = Math.max(0, (eng.h - pad0) - bot);
    padA.style.blockSize = aH.toFixed(2) + 'px';
    padB.style.blockSize = bH.toFixed(2) + 'px';
    if (anchor && anchor.classList) anchor.classList.add('ne-w0');
    this.freeSync();
    this._win = { from: from, to: to };
    /*@3.NOEJ.308*/
    if (!this._winSaid) {
      this._winSaid = 1;
      try {
        console.info('[notes] نافذةُ الرسم: ' + ((to - from) + 1) + ' من ' +
          bs.length + ' كتلة · العتبة ' + WIN_MIN + ' · التصديرُ والطباعةُ ' +
          'من النموذجِ كاملاً');
      } catch (eL) {}
    }
    this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.287*/
  Editor.prototype.winApply = function (force) {
    if (!this.winOk()) { if (this._win) this.winClear(); return false; }
    var rng = this.winRange();
    if (!rng) return false;
    rng = this.winPin(rng);
    var cur = this._win;
    if (!force && cur && cur.from === rng[0] && cur.to === rng[1]) return false;
    return this.winSet(rng[0], rng[1]);
  };

  /*@3.NOEJ.288*/
  Editor.prototype.winClear = function () {
    if (!this._win) return false;
    var bs = this.doc.blocks, root = this.root, i, node;
    var live = this.bidMap();
    var padB = (this._winB && this._winB.parentNode === root) ? this._winB : null;
    var anchor = padB || root.querySelector(':scope > .ne-tail');
    this._sw = 0;
    this.sheetW();
    for (i = bs.length - 1; i >= 0; i--) {
      node = live[bs[i].id];
      if (!node) {
        node = this.renderBlock(bs[i]);
        root.insertBefore(node, anchor);
        this.roAdd(node);
      } else if (node.nextSibling !== anchor) {
        root.insertBefore(node, anchor);
      }
      node.classList.remove('ne-w0');
      anchor = node;
    }
    if (this._winA && this._winA.parentNode) this._winA.remove();
    if (this._winB && this._winB.parentNode) this._winB.remove();
    this._win = null;
    this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    return true;
  };

  /*@3.NOEJ.289*/
  Editor.prototype.winShow = function (id) {
    if (!this._win) return true;
    var hit = this.blockAt(id);
    if (!hit) return false;
    if (hit.b.fp) return this.freeIn(hit.b);
    var k = hit.i;
    if (k >= this._win.from && k <= this._win.to) return true;
    var n = this.doc.blocks.length;
    this.winSet(Math.max(0, k - WIN_SPAN), Math.min(n - 1, k + WIN_SPAN));
    return true;
  };

  /*@3.NOEJ.306*/
  Editor.prototype.winSettle = function () {
    var live = this.root.querySelectorAll(':scope > [data-bid]');
    var arr = [], i;
    for (i = 0; i < live.length; i++) arr.push(live[i]);
    if (this.natSync(arr)) this.reflowEng();
    else this.applyEng();
  };

  /*@3.NOEJ.290*/
  Editor.prototype.winBind = function () {
    if (this._winTie) return;
    var self = this;
    this._winTie = function () {
      if (self._winQ) return;
      self._winQ = requestAnimationFrame(function () {
        self._winQ = 0;
        if (!self.root || !self.root.isConnected) return;
        self.winApply(false);
      });
    };
    var sc = this.scroller();
    if (sc) { sc.addEventListener('scroll', this._winTie, { passive: true }); this._winSc = sc; }
    window.addEventListener('resize', this._winTie, { passive: true });
  };

  Editor.prototype.roBind = function () {
    if (!window.ResizeObserver || this._ro) return;
    var self = this;
    this._ro = new ResizeObserver(function (ents) { self.onSizes(ents); });
  };

  Editor.prototype.roLater = function () {
    if (!window.ResizeObserver || this._roQ) return;
    var self = this;
    var run = function () {
      self._roQ = 0;
      if (!self.root || !self.root.isConnected) return;
      self.roAll();
    };
    this._roQ = window.requestAnimationFrame
      ? requestAnimationFrame(run) : setTimeout(run, 0);
  };

  Editor.prototype.roAll = function () {
    this.roBind();
    if (!this._ro) return;
    this._ro.disconnect();
    var kids = this.root.children, i, k;
    for (i = 0; i < kids.length; i++) {
      k = kids[i];
      if (!k.hasAttribute || !k.hasAttribute('data-bid')) continue;
      if (k.hasAttribute('data-fp')) continue;
      this._ro.observe(k);
    }
  };

  Editor.prototype.roAdd = function (node) {
    this.roBind();
    if (!this._ro || !node || !node.hasAttribute) return;
    if (!node.hasAttribute('data-bid') || node.hasAttribute('data-fp')) return;
    this._ro.observe(node);
  };

  Editor.prototype.roDrop = function (node) {
    if (!this._ro || !node) return;
    try { this._ro.unobserve(node); } catch (eU) {}
  };

  Editor.prototype.onSizes = function (ents) {
    if (this._roOff || !this.natOk()) return;
    var eng = this.doc.eng;
    if (!eng || eng.v !== 3) return;
    var nat = this._nat, idx = this.natIdx();
    if (!idx) return;
    var changed = false, e, node, id, i, h;
    var zo = this.zoomOf() || 1;
    for (e = 0; e < ents.length; e++) {
      node = ents[e].target;
      if (!node.parentNode || node.hasAttribute('data-fp')) continue;
      id = node.getAttribute('data-bid');
      i = idx[id];
      /*@3.NOEJ.261*/
      if (i == null || nat.ids[i] !== id) continue;
      h = node.getBoundingClientRect().height / zo;
      if (Math.abs((nat.hgt[i] || 0) - h) < 0.5) continue;
      nat.hgt[i] = h;
      nat.lh[i] = 0;
      changed = true;
    }
    if (!changed) return;
    this.reflowEng();
  };

  /*@3.NOEJ.240*/
  Editor.prototype.clearMargins = function () {
    var list = this.root.querySelectorAll(':scope > [data-bid]'), i;
    for (i = 0; i < list.length; i++) {
      if (!list[i].__bd) continue;
      list[i].__bd = 0;
      /*@3.NOEJ.243*/
      list[i].style.removeProperty('--ne-pb');
      list[i].removeAttribute('data-brkm');
    }
    this.root.style.minBlockSize = '';
    this._mbSet = '';
    this._engOn = false;
  };

  function lineOf(node) {
    if (!node) return 0;
    var v = 0;
    try {
      var cs = getComputedStyle(node);
      v = parseFloat(cs.lineHeight);
      if (!isFinite(v) || v <= 0) v = parseFloat(cs.fontSize) * 1.5;
    } catch (e) {}
    return isFinite(v) ? v : 0;
  }

  Editor.prototype.pageH = function () {
    var v = 0;
    try {
      v = parseFloat(getComputedStyle(this.root)
        .getPropertyValue('--na-sheeth')) || 0;
    } catch (e) {}
    return v > 200 ? v : 1123;
  };

  /*@3.NOEJ.155*/
  Editor.prototype.applyEng = function () {
    var eng = this.doc.eng;
    /*@3.NOEJ.159*/
    var ok = !!(eng && eng.v === 3 && eng.mk && eng.w === 794 &&
                this.doc.kind !== 'board');
    /*@3.NOEJ.234*/
    if (!ok) { if (this._engOn) this.clearMargins(); return; }
    this._engOn = true;
    var kids = this.root.children, i, node, want, id;
    for (i = 0; i < kids.length; i++) {
      node = kids[i];
      if (!node.hasAttribute || !node.hasAttribute('data-bid')) continue;
      if (node.hasAttribute('data-fp')) continue;
      id = node.getAttribute('data-bid');
      want = eng.mk[id] || 0;
      if ((node.__bd || 0) === want) continue;
      node.__bd = want;
      if (want > 0) {
        node.style.setProperty('--ne-pb', want.toFixed(2) + 'px');
        node.setAttribute('data-brkm', '1');
      } else {
        node.style.removeProperty('--ne-pb');
        node.removeAttribute('data-brkm');
      }
    }
    var mb = (eng.h > 0) ? (eng.h + 'px') : '';
    if (this._mbSet !== mb) { this._mbSet = mb; this.root.style.minBlockSize = mb; }
  };

  Editor.prototype.docDir = function () { return docDir(this.doc); };

  /*@3.NOEJ.90*/
  Editor.prototype.dropTail = function () {
    var tail = this.root.querySelector(':scope > .ne-tail');
    if (!tail) return;
    tail.style.marginBlockStart = '';
    var free = this.root.querySelectorAll(':scope > [data-bid][data-fp]');
    if (!free.length) return;
    var rootTop = this.root.getBoundingClientRect().top;
    var z = this.zoomOf();
    var low = 0, i;
    for (i = 0; i < free.length; i++) {
      low = Math.max(low, (free[i].getBoundingClientRect().bottom - rootTop) / z);
    }
    var at = (tail.getBoundingClientRect().top - rootTop) / z;
    var gap = Math.round(low + 14 - at);
    if (gap > 0) tail.style.marginBlockStart = gap + 'px';
  };

  /*@3.NOEJ.47*/
  Editor.prototype.freeIn = function (b) {
    if (!b || !b.fp || !this.root) return false;
    if (this.root.querySelector(':scope > [data-bid="' + b.id + '"]')) return true;
    var anchor = (this._winB && this._winB.parentNode === this.root)
      ? this._winB : this.root.querySelector(':scope > .ne-tail');
    var node = this.renderBlock(b);
    this._sw = 0;
    this.sheetW();
    if (anchor) this.root.insertBefore(node, anchor);
    else this.root.appendChild(node);
    this.applyReadOnly();
    return true;
  };

  Editor.prototype.freeSync = function () {
    var bs = this.doc.blocks, i, any = false;
    for (i = 0; i < bs.length; i++) {
      if (!bs[i].fp) continue;
      if (this.freeIn(bs[i])) any = true;
    }
    return any;
  };

  /*@3.NOEJ.318*/
  Editor.prototype.addFree = function (ty, xPx, yPx, extra) {
    var W = this.sheetW();
    xPx = Math.max(0, xPx - 6);
    yPx = Math.max(0, yPx - 12);
    var x = Math.max(0, Math.min(0.92, xPx / W));
    var b = B().blank(ty, extra);
    /*@3.NOEJ.58*/
    b.fp = { x: x, y: Math.max(0, Math.round(yPx)) };
    /*@3.NOEJ.68*/
    if (b.wm == null) b.wm = WIDE[ty] ? 'full' : 'fit';
    b.z = this.topZ() + 1;
    var before = this.snapshot();
    this.readAll();
    this.doc.blocks.push(b);
    /*@3.NOEJ.104*/
    this.pushUndo(before);
    if (!this.freeIn(b)) { this.render(); }
    else if (this.natSplice(this.doc.blocks.length - 1, 0, [b.id])) {
      /*@3.NOEJ.313*/
      var atF = this.doc.blocks.length - 1;
      this._nat.gap[atF] = null;
      this._nat.hgt[atF] = 0;
      this.reflowEng();
    } else {
      this._nat = null; this._engStale = true; this.settled();
    }
    this.layoutFree();
    this.focusBlock(b.id);
    this.touch();
    this.emitState();
    return b;
  };

  /*@3.NOEJ.129*/
  Editor.prototype.setListStyle = function (id, key, val) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty]) return;
    var before = this.snapshot();
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (node) this.readBlock(node);
    if (key === 'lsb') {
      if (hit.b.lsb) delete hit.b.lsb; else hit.b.lsb = 1;
    } else if (val && val !== 'num' && val !== 'dot') {
      hit.b.ls = val;
    } else {
      delete hit.b.ls;
    }
    this.pushUndo(before);
    this.renderOne(id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.131*/
  Editor.prototype.blockHolds = function (b, node) {
    if (!b) return false;
    if (B().runsToText(b.rt || []).trim()) return true;
    if (b.items && b.items.length && b.items.some(function (it) {
      return B().runsToText(it.rt || []).trim();
    })) return true;
    if (b.rows && b.rows.length) return true;
    if (b.url || b.src || b.tex || b.ink || (b.shapes && b.shapes.length)) return true;
    var n = node || this.root.querySelector('[data-bid="' + b.id + '"]');
    return !!(n && (n.textContent || '').trim());
  };

  Editor.prototype.caretInside = function (b, node) {
    var n = node || (b ? this.root.querySelector('[data-bid="' + b.id + '"]') : null);
    return !!(n && document.activeElement && n.contains(document.activeElement));
  };

  Editor.prototype.commitProv = function (id) {
    var hit = id ? this.blockAt(id) : null;
    if (!hit || !hit.b.prov) return false;
    delete hit.b.prov;
    return true;
  };

  Editor.prototype.dropProv = function () {
    var i, b, hit = null;
    for (i = 0; i < this.doc.blocks.length; i++) {
      b = this.doc.blocks[i];
      if (!b.prov) continue;
      var node = this.root.querySelector('[data-bid="' + b.id + '"]');
      if (node) this.readBlock(node);
      if (this.blockHolds(b, node)) { delete b.prov; continue; }
      if (this.caretInside(b, node)) continue;
      hit = { b: b, i: i };
    }
    if (!hit) return false;
    this.doc.blocks.splice(hit.i, 1);
    this.render();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.62*/
  Editor.prototype.dropAllEmptyFree = function () {
    var ids = [], i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (b.fp && b.ty === 'p') ids.push(b.id);
    }
    if (!ids.length) return 0;
    var n = 0;
    for (i = 0; i < ids.length; i++) {
      var node = this.root.querySelector('[data-bid="' + ids[i] + '"]');
      if (node) this.readBlock(node);
      if (this.dropEmptyFree(ids[i])) n++;
    }
    if (n) { this.touch(); this.emitState(); }
    return n;
  };

  Editor.prototype.dropEmptyFree = function (id) {
    if (this.menuFor === id) return false;
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var b = hit.b;
    if (b.ty !== 'p') return false;
    /*@3.NOEJ.115*/
    var node0 = this.root.querySelector('[data-bid="' + id + '"]');
    if (this.blockHolds(b, node0) || this.caretInside(b, node0)) return false;
    this.doc.blocks.splice(hit.i, 1);
    this.render();
    this.layoutFree();
    this.touch();
    return true;
  };

  Editor.prototype.focusBlock = function (id, atEnd) {
    /*@3.NOEJ.297*/
    if (this._win) this.winShow(id);
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return;
    var t = node.querySelector('.ne-text, .ne-li, .ne-code, .ne-tex, .ne-img-url, .ne-cell');
    if (!t) return;
    /*@3.NOEJ.233*/
    try { t.focus({ preventScroll: true }); } catch (eF) { t.focus(); }
    this.keepInView(t);
    if (t.isContentEditable && atEnd !== false) {
      var r = document.createRange();
      r.selectNodeContents(t); r.collapse(false);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  };


  /*@3.NOEJ.260*/
  Editor.prototype.seenBox = function (sc) {
    var s = sc.getBoundingClientRect();
    var top = s.top, bot = s.bottom;
    var vv = window.visualViewport;
    if (vv && vv.height > 0) {
      var vTop = vv.offsetTop || 0, vBot = vTop + vv.height;
      if (vTop > top) top = vTop;
      if (vBot < bot) bot = vBot;
    }
    return { top: top, bottom: bot };
  };

  Editor.prototype.keepInView = function (t) {
    var sc = this.scroller();
    if (!sc || !t) return;
    var r = t.getBoundingClientRect(), s = this.seenBox(sc);
    if (s.bottom - s.top < 40) return;
    if (r.bottom > s.top + 4 && r.top < s.bottom - 4) return;
    try { t.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    /*@3.NOEJ.264*/
    var r2 = t.getBoundingClientRect();
    var over = r2.bottom - (s.bottom - 6);
    if (over > 0) sc.scrollTop += over;
  };

  /*@3.NOEJ.265*/
  Editor.prototype.caretSeen = function () {
    var sc = this.scroller();
    if (!sc) return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var edn = this.currentEditable();
    if (!edn || !this.root.contains(edn)) return;
    var r = sel.getRangeAt(0).getBoundingClientRect();
    if (!r || (!r.height && !r.top)) r = edn.getBoundingClientRect();
    var s = this.seenBox(sc);
    if (s.bottom - s.top < 40) return;
    var pad = 24;
    if (r.bottom > s.bottom - pad) sc.scrollTop += (r.bottom - (s.bottom - pad));
    else if (r.top < s.top + pad) sc.scrollTop -= ((s.top + pad) - r.top);
  };

  Editor.prototype.runsRef = function (edn) {
    var node = edn.closest('[data-bid]');
    if (!node) return null;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return null;
    var b = hit.b;
    if (edn.classList.contains('ne-text')) {
      return { get: function () { return b.rt || []; }, set: function (v) { b.rt = v; } };
    }
    if (edn.classList.contains('ne-li')) {
      var lis = [].slice.call(node.querySelectorAll('.ne-li'));
      var k = lis.indexOf(edn);
      if (k < 0 || !b.items || !b.items[k]) return null;
      return { get: function () { return b.items[k].rt || []; }, set: function (v) { b.items[k].rt = v; } };
    }
    if (edn.classList.contains('ne-cell')) {
      var tr = edn.closest('tr');
      var rows = [].slice.call(node.querySelectorAll('tr:not([data-brk])'));
      var ri = rows.indexOf(tr);
      var ci = [].slice.call(tr.querySelectorAll('.ne-cell')).indexOf(edn);
      if (ri < 0 || ci < 0 || !b.rows || !b.rows[ri] || !b.rows[ri][ci]) return null;
      return { get: function () { return b.rows[ri][ci].rt || []; },
               set: function (v) { b.rows[ri][ci].rt = v; } };
    }
    return null;
  };

  Editor.prototype.currentEditable = function () {
    var a = document.activeElement;
    if (a && this.root.contains(a) &&
        (a.classList.contains('ne-text') || a.classList.contains('ne-li') ||
         a.classList.contains('ne-cell'))) return a;
    return this.focusEd && this.root.contains(this.focusEd) ? this.focusEd : null;
  };

  Editor.prototype.selBounds = function (edn) {
    var s = window.getSelection();
    if (s && s.rangeCount) {
      var r = s.getRangeAt(0);
      if (edn.contains(r.startContainer) && edn.contains(r.endContainer)) {
        return [offsetIn(edn, r.startContainer, r.startOffset),
                offsetIn(edn, r.endContainer, r.endOffset)];
      }
    }
    if (this.lastSel && this.lastSel.ed === edn) return [this.lastSel.a, this.lastSel.b];
    return null;
  };

  /*@3.NOEJ.11*/
  var PEND_CMD = { b: 'bold', i: 'italic', u: 'underline', st: 'strikeThrough' };

  /*@3.NOEJ.27*/
  function tagMode() {
    try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
  }

  Editor.prototype.pendMark = function (mark) {
    var cmd = PEND_CMD[mark];
    if (!cmd) return false;
    var edn = this.currentEditable();
    if (!edn) return false;
    tagMode();
    var ok = false;
    try { ok = document.execCommand(cmd, false, null); } catch (e) { ok = false; }
    if (!ok) return false;
    this.emitState();
    return true;
  };

  Editor.prototype.pendState = function () {
    var out = null;
    for (var m in PEND_CMD) {
      var v = false;
      try { v = document.queryCommandState(PEND_CMD[m]); } catch (e) { return null; }
      (out = out || {})[m] = !!v;
    }
    return out;
  };

  Editor.prototype.applyMark = function (mark, value) {
    /*@3.NOEJ.112*/
    var picked = this.selectedBlocks();
    if (picked.length) return this.markBlocks(picked, mark, value);
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;

    var node = edn.closest('[data-bid]');
    this.readBlock(node);

    var bounds = this.selBounds(edn);
    var rt = ref.get();
    var total = runsLen(rt);
    if (!bounds) bounds = [0, total];
    var a = Math.max(0, Math.min(bounds[0], bounds[1]));
    var b = Math.min(total, Math.max(bounds[0], bounds[1]));

    if (a === b) {
      /*@3.NOEJ.26*/
      if (PEND_CMD[mark]) return this.pendMark(mark);
      if (!total) return this.pendRun(mark, value);
      var w = wordBounds(rt, a);
      if (w) { a = w[0]; b = w[1]; }
      else { a = 0; b = total; }
    }

    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1];
    if (!mid.length) return false;

    var allHave = true;
    for (var i = 0; i < mid.length; i++) {
      var have = (mark === 'fg' || mark === 'hl') ? (mid[i][mark] || '') === value : !!mid[i][mark];
      if (!have) { allHave = false; break; }
    }
    var next = allHave ? null : value;
    for (var j = 0; j < mid.length; j++) {
      if (next == null || next === '') delete mid[j][mark];
      else mid[j][mark] = next;
    }

    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.lastSel = { ed: edn, a: a, b: b };
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.markBlocks = function (picked, mark, value) {
    var before = this.snapshot();
    var self = this, did = 0;
    this.readAll();
    picked.forEach(function (hit) {
      var lists = [];
      if (hit.b.rt) lists.push(function (v) { hit.b.rt = v; return hit.b.rt; });
      (hit.b.items || []).forEach(function (it) {
        lists.push(function (v) { if (v) it.rt = v; return it.rt; });
      });
      (hit.b.rows || []).forEach(function (row) {
        row.forEach(function (c) { lists.push(function (v) { if (v) c.rt = v; return c.rt; }); });
      });
      lists.forEach(function (ref) {
        var rt = ref(null) || [];
        if (!rt.length) return;
        var out = rt.map(function (r) {
          var c = Object.assign({}, r);
          if (value === '' || value == null) delete c[mark]; else c[mark] = value;
          return c;
        });
        ref(out);
        did++;
      });
    });
    if (!did) return false;
    this.pushUndo(before);
    this.render();
    this.paintBlockSel();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.111*/
  Editor.prototype.pendRun = function (mark, value) {
    if (mark !== 'fg' && mark !== 'hl' && mark !== 'ff') return false;
    var edn = this.currentEditable();
    if (!edn || !value) return false;
    var s = window.getSelection();
    if (!s || !s.rangeCount) return false;
    var r = s.getRangeAt(0);
    if (!edn.contains(r.startContainer) || !r.collapsed) return false;
    var run = {}; run.s = '\u200b'; run[mark] = value;
    var box = document.createElement('span');
    box.innerHTML = B().runsToHtml([run]);
    var node = box.firstElementChild;
    if (!node) return false;
    r.insertNode(node);
    var txt = node.firstChild;
    if (txt) {
      var rr = document.createRange();
      rr.setStart(txt, txt.nodeValue.length);
      rr.collapse(true);
      s.removeAllRanges(); s.addRange(rr);
    }
    this.readBlock(edn.closest('[data-bid]'));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.114*/
  Editor.prototype.liveMark = function (mark, value, done) {
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var L = this._live;
    if (!L || L.ed !== edn || L.mark !== mark) {
      var node0 = edn.closest('[data-bid]');
      this.readBlock(node0);
      var rt0 = ref.get() || [];
      var total0 = runsLen(rt0);
      var bn = this.selBounds(edn);
      var a0, b0;
      if (bn && bn[0] !== bn[1]) { a0 = Math.min(bn[0], bn[1]); b0 = Math.max(bn[0], bn[1]); }
      else {
        var w0 = bn ? wordBounds(rt0, bn[0]) : null;
        if (w0) { a0 = w0[0]; b0 = w0[1]; } else { a0 = 0; b0 = total0; }
      }
      if (a0 === b0) return false;
      L = this._live = { ed: edn, mark: mark, a: a0, b: b0,
                         snap: this.snapshot(), pushed: false };
    }
    var rt = ref.get() || [];
    var parts = sliceRuns(rt, L.a, L.b);
    var mid = parts[1];
    if (!mid.length) return false;
    for (var i = 0; i < mid.length; i++) {
      if (!value) delete mid[i][mark]; else mid[i][mark] = value;
    }
    ref.set(joinRuns([parts[0], mid, parts[2]]));
    if (!L.pushed) { this.pushUndo(L.snap); L.pushed = true; }
    edn.innerHTML = B().runsToHtmlBidi(ref.get());
    selectRange(edn, L.a, L.b);
    this.lastSel = { ed: edn, a: L.a, b: L.b };
    if (done) { this._live = null; this.touch(); }
    this.emitState();
    return true;
  };

  Editor.prototype.clearMarks = function () {
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    this.readBlock(edn.closest('[data-bid]'));
    var rt = ref.get();
    var total = runsLen(rt);
    var bounds = this.selBounds(edn) || [0, total];
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    if (a === b) { a = 0; b = total; }
    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1].map(function (r) { return { s: r.s }; });
    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.setLink = function (url) {
    var edn = this.currentEditable();
    if (!edn) return false;
    var href = url ? B().normUrl(url) : '';
    return this.applyMarkForce(edn, 'lk', href);
  };

  /*@3.NOEJ.91*/
  Editor.prototype.linkCtx = function () {
    var edn = this.currentEditable();
    if (!edn) return null;
    var ref = this.runsRef(edn);
    if (!ref) return null;
    this.readBlock(edn.closest('[data-bid]'));
    var bounds = this.selBounds(edn) || [0, 0];
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    var rt = ref.get();
    var text = '', url = '', pos = 0, i;
    for (i = 0; i < (rt || []).length; i++) {
      var r = rt[i], sv = r.s || '', st = pos, en = pos + sv.length;
      pos = en;
      if (en <= a || st >= b) {
        if (a === b && st <= a && a <= en && r.lk && !url) url = r.lk;
        continue;
      }
      text += sv.slice(Math.max(0, a - st), Math.min(sv.length, b - st));
      if (r.lk && !url) url = r.lk;
    }
    return { ed: edn, a: a, b: b, text: text, url: url };
  };

  Editor.prototype.applyLink = function (ctx, url, label) {
    if (!ctx || !ctx.ed || !this.root.contains(ctx.ed)) {
      return this.setLink(url);
    }
    var edn = ctx.ed;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var href = url ? B().normUrl(url) : '';
    if (url && !href) return false;
    var rt = ref.get();
    var a = ctx.a, b = ctx.b;
    var txt = String(label == null ? '' : label);
    var before = this.snapshot();
    var out, caret;

    if (a === b && !href) return false;

    if (a === b) {
      var shown = txt || href;
      var parts0 = sliceRuns(rt, a, a);
      out = joinRuns([parts0[0], [{ s: shown, lk: href }], parts0[2]]);
      caret = a + shown.length;
    } else {
      var parts = sliceRuns(rt, a, b);
      var mid = parts[1];
      if (txt && txt !== ctx.text) {
        var style = Object.assign({}, mid[0] || {});
        delete style.s;
        mid = [Object.assign(style, { s: txt })];
      }
      for (var i = 0; i < mid.length; i++) {
        if (href) mid[i].lk = href; else delete mid[i].lk;
      }
      out = joinRuns([parts[0], mid, parts[2]]);
      caret = a + (txt || ctx.text || '').length;
    }
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    try { edn.focus(); } catch (e) {}
    selectRange(edn, caret, caret);
    this.lastSel = { ed: edn, a: caret, b: caret };
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.applyMarkForce = function (edn, mark, value) {
    var ref = this.runsRef(edn);
    if (!ref) return false;
    this.readBlock(edn.closest('[data-bid]'));
    var rt = ref.get();
    var total = runsLen(rt);
    var bounds = this.selBounds(edn);
    if (!bounds) return false;
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    if (a === b) {
      var w = wordBounds(rt, a);
      if (!w) return false;
      a = w[0]; b = w[1];
    }
    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1];
    for (var i = 0; i < mid.length; i++) {
      if (!value) delete mid[i][mark]; else mid[i][mark] = value;
    }
    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.touch();
    this.emitState();
    return true;
  };


  /*@3.NOEJ.176*/
  Editor.prototype.hasLiveFocus = function () {
    var a = document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return false;
    if (this.root.contains(a)) return true;
    if (!a.closest) return false;
    return !!a.closest('.nr, .ne-menu, .ne-selhint, .nov-host, .nc-wrap, dialog[open]');
  };

  Editor.prototype.selState = function () {
    var edn = this.currentEditable();
    var st = { ty: null, lv: null, marks: {}, canUndo: this.hist ? this.hist.canUndo() : !!this.undo.length,
      canRedo: this.hist ? this.hist.canRedo() : !!this.redo.length,
               canUp: false, canDown: false, hasBlock: false,
               selMode: !!this._selMode,
               bsel: this.selectedBlocks().length,
               canPaste: clipAny() };
    /*@3.NOEJ.178*/
    if (!st.bsel && !this.hasLiveFocus()) return st;
    var bid = this.activeBid();
    var node = edn ? edn.closest('[data-bid]')
                   : (bid ? this.root.querySelector('[data-bid="' + bid + '"]') : null);
    if (!node) return st;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return st;
    st.hasBlock = true;
    st.ty = hit.b.ty;
    st.lv = hit.b.lv || null;
    st.canUp = hit.i > 0;
    st.canDown = hit.i < this.doc.blocks.length - 1;
    st.dir = hit.b.dir || 'auto';
    st.al = hit.b.al || 'start';
    st.fs = hit.b.fs || 0;
    st.ff = hit.b.ff || '';
    var fsNode = edn || node.querySelector(ANCHOR_SEL);
    if (fsNode) st.fsEff = Math.round(parseFloat(getComputedStyle(fsNode).fontSize) || 0);
    if (!edn) return st;
    var ref = this.runsRef(edn);
    if (!ref) return st;
    var rt = ref.get();
    var bounds = this.selBounds(edn);
    if (!bounds) return st;
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    /*@3.NOEJ.28*/
    var pend = (a === b) ? this.pendState() : null;
    if (a === b) {
      var w = wordBounds(rt, a);
      if (w) { a = w[0]; b = w[1]; }
    }
    var mid = sliceRuns(rt, a, b)[1];
    if (!mid.length) {
      if (pend) for (var pk in pend) st.marks[pk] = pend[pk];
      return st;
    }
    var keys = ['b', 'i', 'u', 'st', 'c'];
    for (var k = 0; k < keys.length; k++) {
      var all = true;
      for (var i = 0; i < mid.length; i++) if (!mid[i][keys[k]]) { all = false; break; }
      st.marks[keys[k]] = all;
    }
    if (pend) for (var pk2 in pend) st.marks[pk2] = pend[pk2];
    var fg = mid[0].fg || '', hl = mid[0].hl || '';
    for (var j = 1; j < mid.length; j++) {
      if ((mid[j].fg || '') !== fg) fg = '';
      if ((mid[j].hl || '') !== hl) hl = '';
    }
    st.marks.fg = fg; st.marks.hl = hl;
    var rff = mid[0].ff || '';
    for (var q = 1; q < mid.length; q++) if ((mid[q].ff || '') !== rff) rff = '';
    st.marks.ff = rff;
    if (rff) st.ff = rff;
    var rfz = mid[0].fz || 0;
    for (var q2 = 1; q2 < mid.length; q2++) if ((mid[q2].fz || 0) !== rfz) rfz = 0;
    st.marks.fz = rfz;
    if (rfz) st.fs = rfz;
    return st;
  };

  /*@3.NOEJ.49*/
  Editor.prototype.bindFreeCleanup = function () {
    var self = this;
    this.root.addEventListener('focusout', function (e) {
      var node = e.target.closest ? e.target.closest('[data-bid][data-fp]') : null;
      if (!node) return;
      var id = node.getAttribute('data-bid');
      setTimeout(function () {
        var a = document.activeElement;
        if (a && self.root.contains(a) && a.closest('[data-bid]') === node) return;
        /*@3.NOEJ.113*/
        if (a && a !== document.body && !self.root.contains(a)) return;
        self.readBlock(node);
        self.dropEmptyFree(id);
      }, 0);
    });
  };

  Editor.prototype.emitState = function () {
    if (this.opts.onSelState) {
      var self = this;
      clearTimeout(this._stT);
      this._stT = setTimeout(function () { self.opts.onSelState(self.selState()); }, 0);
    }
  };


  /*@3.NOEJ.14*/
  Editor.prototype.activeBid = function () {
    var edn = this.currentEditable();
    var node = edn ? edn.closest('[data-bid]') : null;
    if (node) return node.getAttribute('data-bid');
    if (this.focusBid && this.blockAt(this.focusBid)) return this.focusBid;
    return this.lastBlockId();
  };

  /*@3.NOEJ.354*/
  Editor.prototype.selLink = function () {
    var s;
    try { s = window.getSelection(); } catch (e) { return null; }
    if (!s || !s.rangeCount) return null;
    var pick = function (n) {
      if (!n) return null;
      var el = (n.nodeType === 1) ? n : n.parentNode;
      return (el && el.closest) ? el.closest('a[href], a[data-nl]') : null;
    };
    var a = pick(s.anchorNode);
    if (!a || !this.root.contains(a)) return null;
    var b = pick(s.focusNode);
    return (b === a) ? a : null;
  };

  Editor.prototype.underline = function () {
    var a = this.selLink();
    if (!a) return this.applyMark('u', 1);
    this._ctxLink = a;
    return this.linkAct(a, 'lkline');
  };

  Editor.prototype.exec = function (cmd, val) {
    var bid = this.activeBid();
    switch (cmd) {
      case 'undo': return this.hist ? this.hist.undo() : this.doUndo();
      case 'redo': return this.hist ? this.hist.redo() : this.doRedo();
      case 'bold': return this.applyMark('b', 1);
      case 'italic': return this.applyMark('i', 1);
      case 'underline': return this.underline();
      case 'strike': return this.applyMark('st', 1);
      case 'code': return this.applyMark('c', 1);
      case 'fg': return this.applyMark('fg', val);
      case 'hl': return this.applyMark('hl', val);
      case 'clear': return this.clearMarks();
      case 'link': return this.setLink(val);
      case 'turn':
        if (!bid) return;
        return this.convert(bid, val.ty, val.lv);
      case 'insert':
        return this.addBlock(val.ty, bid, val.lv, val.extra);
      case 'up': return this.move(bid, -1);
      case 'down': return this.move(bid, 1);
      case 'dup': return this.duplicate(bid);
      case 'del': return this.remove(bid);
      case 'blockHl': return this.setBlockStyle('hlb', val);
      case 'dir': return this.setBlockStyle('dir', val);
      case 'align':
        if (this.cellNode()) return this.setCellAlign('h', val === 'start' ? '' : val, null);
        return this.setBlockStyle('al', val);
      case 'font': {
        var ednF = this.currentEditable();
        var bnd = ednF ? this.selBounds(ednF) : null;
        if (ednF && bnd && bnd[0] !== bnd[1]) return this.applyMarkForce(ednF, 'ff', val || '');
        return this.setBlockStyle('ff', val);
      }
      case 'fsize': {
        var ednZ = this.currentEditable();
        var bz = ednZ ? this.selBounds(ednZ) : null;
        if (ednZ && bz && bz[0] !== bz[1]) {
          var v = parseFloat(val);
          return this.applyMarkForce(ednZ, 'fz',
            (val === '' || !isFinite(v) || v <= 0) ? '' : Math.max(8, Math.min(96, v)));
        }
        return this.setFontSize(val);
      }
      case 'save': return this.save();
    }
  };


  /*@3.NOEJ.20*/
  /*@3.NOEJ.39*/
  Editor.prototype.setBlockStyle = function (key, val) {
    var picked = this.selectedBlocks();
    if (!picked.length) {
      var bid0 = this.activeBid();
      var h0 = bid0 ? this.blockAt(bid0) : null;
      if (!h0) return false;
      picked = [h0];
    }
    var before = this.snapshot();
    var self = this;
    picked.forEach(function (hit) {
      var node0 = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (node0) self.readBlock(node0);
      if (!val || val === 'auto' || val === 'start') delete hit.b[key];
      else hit.b[key] = val;
      var node = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (!node) return;
      self.applyStyleAttrs(node, hit.b);
      var eds = node.querySelectorAll('.ne-text, .ne-li, .ne-cell');
      for (var i = 0; i < eds.length; i++) eds[i].setAttribute('dir', blockDir(hit.b, self.doc));
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.95*/
  var FMT_MARKS = ['b', 'i', 'u', 'st', 'c', 'fg', 'hl'];
  var FMT_BLOCK = ['al', 'dir', 'ff', 'fs', 'hlb'];

  Editor.prototype.copyFormat = function () {
    var edn = this.currentEditable();
    if (!edn) return null;
    var ref = this.runsRef(edn);
    var node = edn.closest('[data-bid]');
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    if (!hit) return null;
    this.readBlock(node);
    var marks = {};
    if (ref) {
      var rt = ref.get() || [];
      var bounds = this.selBounds(edn) || [0, 0];
      var at = Math.min(bounds[0], bounds[1]);
      var pos = 0, pick = null, i;
      for (i = 0; i < rt.length; i++) {
        var len = (rt[i].s || '').length;
        if (at <= pos + len && len) { pick = rt[i]; break; }
        pos += len;
      }
      if (!pick) pick = rt[rt.length - 1] || null;
      if (pick) {
        for (i = 0; i < FMT_MARKS.length; i++) {
          if (pick[FMT_MARKS[i]]) marks[FMT_MARKS[i]] = pick[FMT_MARKS[i]];
        }
      }
    }
    var blk = { ty: hit.b.ty, lv: hit.b.lv || 0 };
    for (var k = 0; k < FMT_BLOCK.length; k++) {
      if (hit.b[FMT_BLOCK[k]]) blk[FMT_BLOCK[k]] = hit.b[FMT_BLOCK[k]];
    }
    return { marks: marks, block: blk };
  };

  Editor.prototype.pasteFormat = function (fmt) {
    if (!fmt) return false;
    var edn = this.currentEditable();
    if (!edn) return false;
    var node = edn.closest('[data-bid]');
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    if (!hit) return false;
    var before = this.snapshot();
    this.readBlock(node);

    var ref = this.runsRef(edn);
    if (ref) {
      var rt = ref.get() || [];
      var total = runsLen(rt);
      var bounds = this.selBounds(edn);
      var a = 0, b = total;
      if (bounds) {
        a = Math.min(bounds[0], bounds[1]);
        b = Math.max(bounds[0], bounds[1]);
        /*@3.NOEJ.144*/
        if (a === b) return false;
      }
      if (b > a) {
        var parts = sliceRuns(rt, a, b);
        var mid = parts[1];
        for (var i = 0; i < mid.length; i++) {
          for (var m = 0; m < FMT_MARKS.length; m++) delete mid[i][FMT_MARKS[m]];
          for (var k in fmt.marks) mid[i][k] = fmt.marks[k];
        }
        var out = joinRuns([parts[0], mid, parts[2]]);
        ref.set(out);
        edn.innerHTML = B().runsToHtmlBidi(out);
        selectRange(edn, a, b);
        this.lastSel = { ed: edn, a: a, b: b };
      }
    }

    var blk = fmt.block || {};
    for (var j = 0; j < FMT_BLOCK.length; j++) {
      var key = FMT_BLOCK[j];
      if (blk[key]) hit.b[key] = blk[key]; else delete hit.b[key];
    }
    var live = this.root.querySelector('[data-bid="' + hit.b.id + '"]');
    if (live) this.applyStyleAttrs(live, hit.b);
    if (blk.ty && (blk.ty !== hit.b.ty || (blk.ty === 'h' && (blk.lv || 0) !== (hit.b.lv || 0)))) {
      if (blk.ty === 'p' || blk.ty === 'h' || blk.ty === 'quote' || blk.ty === 'callout') {
        this.convert(hit.b.id, blk.ty, blk.lv || 0);
      }
    }
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.98*/
  Editor.prototype.moveItem = function (bid, from, to) {
    var hit = this.blockAt(bid);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items) return false;
    var n = hit.b.items.length;
    if (from < 0 || from >= n || to < 0 || to > n || from === to) return false;
    var node = this.root.querySelector('[data-bid="' + bid + '"]');
    var before = this.snapshot();
    if (node) this.readBlock(node);
    var it = hit.b.items.splice(from, 1)[0];
    if (!it) return false;
    hit.b.items.splice(to > from ? to - 1 : to, 0, it);
    this.pushUndo(before);
    this.render();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.99*/
  Editor.prototype.setReadOnly = function (on) {
    this.readOnly = !!on;
    this.applyReadOnly();
  };

  Editor.prototype.applyReadOnly = function () {
    if (!this.readOnly) return;
    this.root.setAttribute('data-ro', '1');
    var q = this.root.querySelectorAll('[contenteditable="true"]');
    for (var i = 0; i < q.length; i++) q[i].setAttribute('contenteditable', 'false');
    var f = this.root.querySelectorAll('input, textarea, select, button');
    for (var j = 0; j < f.length; j++) {
      if (f[j].classList.contains('ne-check')) continue;
      f[j].disabled = true;
    }
  };

  /*@3.NOEJ.97*/
  Editor.prototype.appendBlocks = function (blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return 0;
    this.stampDir(blocks);
    var before = this.snapshot();
    this.readAll();
    var live = B().liveBlocks ? B().liveBlocks(this.doc) : this.doc.blocks;
    /*@3.NOEJ.150*/
    var wiped = !live.length;
    if (wiped) this.doc.blocks.length = 0;
    var at = this.doc.blocks.length;
    for (var i = 0; i < blocks.length; i++) this.doc.blocks.push(blocks[i]);
    this.pushUndo(before);
    if (wiped) this.render();
    else this.renderInsert(at, blocks);
    this.focusBlock(blocks[blocks.length - 1].id);
    this.touch();
    this.emitState();
    return blocks.length;
  };

  /*@3.NOEJ.94*/
  Editor.prototype.setFontSize = function (px) {
    var v = parseFloat(px);
    if (px === '' || px == null || !isFinite(v) || v <= 0) return this.setBlockStyle('fs', 0);
    v = Math.max(8, Math.min(96, Math.round(v * 10) / 10));
    return this.setBlockStyle('fs', v);
  };

  /*@3.NOEJ.12*/
  Editor.prototype.placeMenu = function (m, anchor) {
    var pad = 8, gap = 6;
    m.style.position = 'fixed';
    m.style.maxBlockSize = '';
    var r = (anchor && anchor.getBoundingClientRect)
      ? anchor.getBoundingClientRect()
      : { top: anchor.y, bottom: anchor.y, left: anchor.x, right: anchor.x,
          width: 0, height: 0 };
    var vh = window.innerHeight, vw = window.innerWidth;
    var mr = m.getBoundingClientRect();
    var h = mr.height, w = mr.width;

    var roomBelow = vh - r.bottom - gap - pad;
    var roomAbove = r.top - gap - pad;
    var top;
    if (h <= roomBelow) top = r.bottom + gap;
    else if (h <= roomAbove) top = r.top - h - gap;
    else if (roomBelow >= roomAbove) { top = r.bottom + gap; m.style.maxBlockSize = roomBelow + 'px'; }
    else { m.style.maxBlockSize = roomAbove + 'px'; top = pad; }
    m.style.insetBlockStart = Math.max(pad, top) + 'px';

    var left = isAr() ? (r.right - w) : r.left;
    left = Math.max(pad, Math.min(left, vw - w - pad));
    m.style.insetInlineStart = '';
    m.style.left = left + 'px';
    m.style.right = 'auto';
  };

  /*@3.NOEJ.349*/
  Editor.prototype.grabSel = function () {
    this._ctxSel = null;
    this._ctxSelTxt = '';
    try {
      var s = window.getSelection();
      if (!s || !s.rangeCount || s.isCollapsed) return;
      if (!this.root.contains(s.anchorNode) || !this.root.contains(s.focusNode)) return;
      var r = s.getRangeAt(0);
      var txt = String(s).replace(/\u200b/g, '');
      if (!txt) return;
      this._ctxSel = r.cloneRange();
      this._ctxSelTxt = txt;
    } catch (e) {}
  };

  Editor.prototype.putSel = function () {
    var r = this._ctxSel;
    if (!r) return null;
    var host = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    var edn = (host && host.closest) ? host.closest('[contenteditable="true"]') : null;
    if (edn) { try { edn.focus({ preventScroll: true }); } catch (e) {} }
    try {
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e2) { return null; }
    return edn;
  };

  Editor.prototype.copySel = function (cut) {
    var edn = this.putSel();
    if (!this._ctxSel) return false;
    var before = cut ? this.snapshot() : null;
    var done = false;
    try { done = document.execCommand(cut ? 'cut' : 'copy'); } catch (e) { done = false; }
    if (!done) {
      var box = document.createElement('div');
      try { box.appendChild(this._ctxSel.cloneContents()); } catch (e1) {}
      var txt = box.textContent || this._ctxSelTxt || '';
      if (txt && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt)['catch'](function () {});
        done = true;
      }
    }
    if (cut && done) {
      var node = edn ? edn.closest('[data-bid]') : null;
      while (node && node.parentNode !== this.root) {
        node = (node.parentNode && node.parentNode.closest)
          ? node.parentNode.closest('[data-bid]') : null;
      }
      if (node) this.readBlock(node);
      this.pushUndo(before);
      this.touch();
      this.emitState();
    }
    return done;
  };

  /*@3.NOEJ.350*/
  Editor.prototype.linkHost = function (a) {
    var node = a && a.closest ? a.closest('[data-bid]') : null;
    while (node && node.parentNode !== this.root) {
      node = (node.parentNode && node.parentNode.closest)
        ? node.parentNode.closest('[data-bid]') : null;
    }
    return node;
  };

  Editor.prototype.linkAct = function (a, act) {
    if (!a) return false;
    var href = a.getAttribute('data-nl') || a.getAttribute('href') || '';
    if (act === 'lkopen') {
      if (/^https:/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
      else if (this.opts.onNoteLink) this.opts.onNoteLink(href);
      return true;
    }
    if (act === 'lkcopy') {
      if (href && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(href)['catch'](function () {});
      }
      if (this.opts.onNote) {
        this.opts.onNote(L('نُسخ عنوانُ الرابط', 'Link address copied'));
      }
      return true;
    }
    if (act === 'lksel' || act === 'lkedit') {
      try {
        var r = document.createRange();
        r.selectNodeContents(a);
        var host0 = a.closest('[contenteditable="true"]');
        if (host0) { try { host0.focus({ preventScroll: true }); } catch (eF) {} }
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
      } catch (e) {}
      if (act === 'lkedit' && this.opts.onAskLink) this.opts.onAskLink();
      return true;
    }
    var node = this.linkHost(a);
    if (!node) return false;
    var before = this.snapshot();
    if (act === 'lkoff') {
      var pa = a.parentNode;
      while (a.firstChild) pa.insertBefore(a.firstChild, a);
      pa.removeChild(a);
    } else if (act === 'lkline') {
      if (a.getAttribute('data-lu') === '0') a.removeAttribute('data-lu');
      else a.setAttribute('data-lu', '0');
    } else { return false; }
    this.readBlock(node);
    this.pushUndo(before);
    this.renderOne(node.getAttribute('data-bid'));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.316*/
  Editor.prototype.openCtx = function (target, cx, cy) {
    if (this.readOnly) return false;
    if (!target || !this.root.contains(target)) return false;
    if (target.closest('.ne-menu') || target.closest('.ne-rail') ||
        target.closest('.ne-dgm-ed')) return false;
    this.grabSel();
    this._ctxLink = target.closest ? target.closest('a[href], a[data-nl]') : null;
    var node = target.closest ? target.closest('[data-bid]') : null;
    while (node && node.parentNode !== this.root) {
      node = (node.parentNode && node.parentNode.closest)
        ? node.parentNode.closest('[data-bid]') : null;
    }
    this.closeMenu();
    var at = { x: cx, y: cy };
    if (node) {
      var bid = node.getAttribute('data-bid');
      this.touchAct(bid);
      this.openMenu(bid, at, 'block');
    } else {
      this.dropProv();
      var lp = this.localPoint(cx, cy);
      this.openMenu(null, at, 'paper', { x: lp.x, y: Math.max(0, lp.y) });
    }
    return true;
  };

  Editor.prototype.hintCtx = function () {
    if (this._ctxSaid || this.readOnly) return;
    this._ctxSaid = 1;
    this.say(this.coarse()
      ? L('المسِ الورقةَ مطوّلاً لإضافةِ حقلٍ هنا أو تغييرِ عنصر.',
          'Touch and hold the page to add a field here or change an element.')
      : L('اضغطْ بالزرِّ الأيمن لإضافةِ حقلٍ هنا أو تغييرِ عنصر.',
          'Right-click to add a field here or change an element.'));
  };

  Editor.prototype.selHtml = function () {
    var n = (this._ctxSelTxt || '').replace(/\s+/g, ' ').trim();
    if (!n) return '';
    var cut = n.length > 26 ? (n.slice(0, 26) + '…') : n;
    return '<div class="ne-menu-h">' + B().esc(L('النصُّ المحدَّد', 'Selected text')) +
      ' — <span class="ne-menu-q">' + B().esc(cut) + '</span></div>' +
      mItem('selcopy', 'fa-copy', L('نسخُ النصّ', 'Copy text')) +
      mItem('selcut', 'fa-scissors', L('قصُّ النصّ', 'Cut text'));
  };

  Editor.prototype.lkHtml = function () {
    var a = this._ctxLink;
    if (!a) return '';
    var href = a.getAttribute('data-nl') || a.getAttribute('href') || '';
    var off = a.getAttribute('data-lu') === '0';
    var show = href.replace(/^https:\/\//i, '');
    if (show.length > 30) show = show.slice(0, 30) + '…';
    return '<div class="ne-menu-h">' + B().esc(L('الرابط', 'Link')) +
      ' — <span class="ne-menu-q" dir="ltr">' + B().esc(show) + '</span></div>' +
      mItem('lkopen', 'fa-arrow-up-right-from-square',
            L('فتحٌ في نافذةٍ جديدة', 'Open in a new tab')) +
      mItem('lkcopy', 'fa-link', L('نسخُ العنوان', 'Copy address')) +
      mItem('lkedit', 'fa-pen', L('تعديلُ الرابط', 'Edit the link')) +
      mItem('lksel', 'fa-highlighter', L('حدِّدْ نصَّه لتلوينه', 'Select its text to colour it')) +
      mItem('lkline', 'fa-underline',
            off ? L('أعِدِ الخطَّ السفليّ', 'Bring the underline back')
                : L('أخفِ الخطَّ السفليّ', 'Hide the underline'),
            false, off ? '' : 'is-on') +
      mItem('lkoff', 'fa-link-slash', L('انزعِ الرابطَ وأبقِ النصّ', 'Remove the link, keep the text'));
  };

  /*@3.NOEJ.351*/
  Editor.prototype.pasteHtml = function () {
    var n = (Editor.clip && Editor.clip.length) ? Editor.clip.length
          : (clipAny() ? (clipLoad().length || 0) : 0);
    return '<div class="ne-menu-h">' + B().esc(L('اللصق', 'Paste')) + '</div>' +
      mItem('cbfull', 'fa-paste', L('من الحافظة — بتنسيقه', 'From the clipboard — keep formatting'),
            !CB_OK) +
      mItem('cbtext', 'fa-font', L('من الحافظة — النصُّ فقط', 'From the clipboard — text only'),
            !CB_OK) +
      mItem('paste', 'fa-cubes',
            n ? L('العناصرُ المنسوخة (' + n + ')', 'Copied blocks (' + n + ')')
              : L('العناصرُ المنسوخة', 'Copied blocks'),
            !clipAny());
  };

  Editor.prototype.openMenu = function (id, anchor, kind, pt) {
    var self = this;
    this.closeMenu();
    var mode = kind || 'insert';
    var m = el('div', 'ne-menu');
    m.setAttribute('role', 'menu');
    m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');

    var html = '';
    if (mode === 'block') {
      var hit = this.blockAt(id);
      var bb0 = hit ? hit.b : null;
      var i = hit ? hit.i : 0;
      var last = this.doc.blocks.length - 1;
      html += this.selHtml();
      html += this.lkHtml();
      html += '<div class="ne-menu-h">' + B().esc(L('هذه الكتلة', 'This block')) + '</div>';
      html += mItem('up', 'fa-arrow-up', L('تحريك لأعلى', 'Move up'), i <= 0);
      html += mItem('down', 'fa-arrow-down', L('تحريك لأسفل', 'Move down'), i >= last);
      /*@3.NOEJ.130*/
      if (bb0 && LISTY[bb0.ty]) {
        html += '<div class="ne-menu-h">' + B().esc(L('شكلُ العلامة', 'Marker style')) + '</div>';
        var lsNow = bb0.ls || (bb0.ty === 'ol' ? 'num' : 'dot');
        var lsOpts = bb0.ty === 'ol'
          ? [['num', '1. 2. 3.'], ['arnum', '\u0661. \u0662. \u0663.'],
             ['abjad', '\u0623- \u0628- \u062C-'], ['roman', 'i. ii. iii.']]
          : [['dot', L('نقطة \u2022', 'Dot \u2022')], ['dash', L('شرطة \u2013', 'Dash \u2013')],
             ['diamond', L('معيّن \u25C6', 'Diamond \u25C6')]];
        for (var lo = 0; lo < lsOpts.length; lo++) {
          html += mItem('ls:' + lsOpts[lo][0], 'fa-list-ol', lsOpts[lo][1],
                        false, lsNow === lsOpts[lo][0] ? 'is-on' : '');
        }
        html += mItem('lsb', 'fa-bold', L('علامةٌ بارزة', 'Bold marker'),
                      false, bb0.lsb ? 'is-on' : '');
      }
      /*@3.NOEJ.166*/
      html += mItem('sel', 'fa-square-check', L('تحديدُ الكتل', 'Select blocks'));
      html += mItem('dup', 'fa-clone', L('تكرار', 'Duplicate'));
      html += mItem('copy', 'fa-copy', L('نسخُ الكتلة', 'Copy the block'));
      html += mItem('del', 'fa-trash', L('حذف', 'Delete'), false, 'ne-menu-i--danger');
      html += this.pasteHtml();
      /*@3.NOEJ.79*/
      var bb = hit ? hit.b : null;
      var wm = bb ? bb.wm : null;
      html += '<div class="ne-menu-h">' + B().esc(L('العرض', 'Width')) + '</div>';
      html += mItem('w:full', 'fa-arrows-left-right-to-line', L('كامل السطر', 'Full width'),
                    false, wm === 'full' || (!bb.fp && wm == null) ? 'is-on' : '');
      html += mItem('w:fit', 'fa-arrows-left-right', L('بمقدار المحتوى', 'Fit the content'),
                    false, wm === 'fit' || (bb.fp && wm == null) ? 'is-on' : '');
      html += mItem('w:auto', 'fa-rotate-left', L('أعِدْه إلى الأصل', 'Reset the width'),
                    wm == null);
      if (bb && bb.fp) {
        var arM = isAr();
        html += '<div class="ne-menu-h">' + B().esc(L('الموضع', 'Position')) + '</div>';
        html += mItem('fx:start', arM ? 'fa-align-right' : 'fa-align-left',
                      L('إلى بداية السطر', 'To the start'));
        html += mItem('fx:center', 'fa-align-center', L('في المنتصف', 'Centred'));
        html += mItem('fx:end', arM ? 'fa-align-left' : 'fa-align-right',
                      L('إلى نهاية السطر', 'To the end'));
        html += '<div class="ne-menu-h">' + B().esc(L('الظهور', 'Stacking')) + '</div>';
        html += mItem('z:front', 'fa-arrow-up-wide-short', L('إلى المقدّمة', 'Bring to front'));
        html += mItem('z:up', 'fa-angle-up', L('خطوةً للأمام', 'Forward one step'));
        html += mItem('z:down', 'fa-angle-down', L('خطوةً للخلف', 'Backward one step'));
        html += mItem('z:back', 'fa-arrow-down-wide-short', L('إلى الخلف', 'Send to back'));
        html += mItem('anchor', 'fa-thumbtack', L('أعِدْها إلى التراتب', 'Return it to the order'));
      } else if (bb) {
        html += '<div class="ne-menu-h">' + B().esc(L('الموضع', 'Position')) + '</div>';
        html += mItem('free', 'fa-arrows-up-down-left-right',
                      L('اجعلها حرّةَ الموضع', 'Make it free-floating'));
      }
      if (bb && bb.ty === 'callout') {
        html += '<div class="ne-menu-h">' + B().esc(L('نوعُ الصندوق', 'Box kind')) + '</div>';
        for (var ci = 0; ci < CAL_ORDER.length; ci++) {
          var ck2 = CAL_ORDER[ci];
          html += mItem('cal:' + ck2, CAL[ck2].icon, L(CAL[ck2].ar, CAL[ck2].en),
                        calKind(bb) === ck2);
        }
      }
      html += '<div class="ne-menu-h">' + B().esc(L('حوّل إلى', 'Turn into')) + '</div>';
      html += TURN.map(function (it, k) {
        return mItem('turn:' + k, it.icon, L(it.ar, it.en));
      }).join('');
    } else if (mode === 'paper') {
      html += '<div class="ne-menu-h">' + B().esc(L('أضِفْ هنا', 'Add here')) + '</div>';
      html += INSERT.map(function (it, k) {
        return mItem('here:' + k, it.icon, L(it.ar, it.en), false, '',
                     it.eg ? L(it.eg.ar, it.eg.en) : '');
      }).join('');
      /*@3.NOEJ.345*/
      html = this.selHtml() + this.lkHtml() + html + this.pasteHtml();
      html += '<div class="ne-menu-h">' + B().esc(L('الورقة', 'The page')) + '</div>';
      html += mItem('phere', 'fa-cubes', L('العناصرُ المنسوخةُ في آخرِ الوثيقة',
                                           'Copied blocks at the end'), !clipAny());
      html += mItem('pend', 'fa-arrow-down', L('أضِفْ فقرةً في آخرِ الوثيقة',
                                                    'Add a paragraph at the end'));
      html += mItem('sel', 'fa-square-check', L('تحديدُ الكتل', 'Select blocks'));
    } else {
      html += '<div class="ne-menu-h">' + B().esc(L('أضِف بعدها', 'Add after')) + '</div>';
      html += INSERT.map(function (it, k) {
        return mItem('ins:' + k, it.icon, L(it.ar, it.en), false, '',
                     it.eg ? L(it.eg.ar, it.eg.en) : '');
      }).join('');
    }
    m.innerHTML = html;
    document.body.appendChild(m);
    this.placeMenu(m, anchor);
    this.menu = m;
    /*@3.NOEJ.54*/
    this.menuFor = id;

    var first = m.querySelector('.ne-menu-i:not([disabled])');
    if (first) first.focus();

    m.addEventListener('click', function (e) {
      var btn = e.target.closest('.ne-menu-i');
      if (!btn || btn.disabled) return;
      var act = btn.getAttribute('data-act');
      self.closeMenu();
      if (act.indexOf('here:') === 0) {
        var itH = INSERT[Number(act.slice(5))];
        if (itH && pt) {
          var exH = itH.extra ? clone(itH.extra) : {};
          if (itH.lv) exH.lv = itH.lv;
          self.addFree(itH.ty, pt.x, pt.y, exH);
        }
      } else if (act === 'phere') {
        self.clearBlockSel();
        self.pasteBlocks();
      } else if (act === 'pend') {
        self.addBlock('p', self.lastBlockId());
      } else if (act.indexOf('ins:') === 0) {
        var it = INSERT[Number(act.slice(4))];
        if (it) self.addBlock(it.ty, id, it.lv, it.extra ? clone(it.extra) : null);
      } else if (act.indexOf('turn:') === 0) {
        var t = TURN[Number(act.slice(5))];
        if (t) self.convert(id, t.ty, t.lv, t.extra ? clone(t.extra) : null);
      } else if (act.indexOf('cal:') === 0) {
        self.setCallout(id, act.slice(4));
      } else if (act.indexOf('w:') === 0) {
        var wv = act.slice(2);
        self.setWidth(id, wv === 'auto' ? null : wv);
      } else if (act.indexOf('z:') === 0) {
        self.setZ(id, act.slice(2));
      } else if (act.indexOf('fx:') === 0) {
        self.setFreeAlign(id, act.slice(3));
      } else if (act.indexOf('ls:') === 0) {
        self.setListStyle(id, 'ls', act.slice(3));
      } else if (act === 'lsb') {
        self.setListStyle(id, 'lsb');
      } else if (act === 'free') {
        self.makeFree(id);
      } else if (act === 'anchor') {
        self.unfree(id);
      } else if (act === 'up') self.move(id, -1);
      else if (act === 'down') self.move(id, 1);
      else if (act === 'sel') {
        /*@3.NOEJ.168*/
        self.setSelectMode(true, 1);
        if (id) { self.toggleBlockSel(id, true); self._bselLast = id; }
      }
      else if (act === 'dup') self.duplicate(id);
      else if (act === 'selcopy' || act === 'selcut') {
        if (!self.copySel(act === 'selcut') && self.opts.onNote) {
          self.opts.onNote(L('تعذّر النسخُ من هنا — جرّبْ Ctrl+C.',
                             'Could not copy from here — try Ctrl+C.'));
        }
      }
      else if (act.indexOf('lk') === 0) self.linkAct(self._ctxLink, act);
      else if (act === 'copy') { self.toggleBlockSel(id, true); self.copyBlocks(); }
      else if (act === 'paste') {
        if (id) self.toggleBlockSel(id, true); else self.clearBlockSel();
        self.pasteBlocks();
      }
      else if (act === 'cbfull' || act === 'cbtext') {
        self.pasteFromClipboard(act === 'cbtext' ? 'text' : 'full', id);
      }
      else if (act === 'del') self.remove(id);
    });
    /*@3.NOEJ.110*/
    var items = function () {
      return [].slice.call(m.querySelectorAll('.ne-menu-i:not([disabled])'))
               .filter(function (b) { return !b.hidden; });
    };
    var step = function (dir) {
      var list = items();
      if (!list.length) return;
      var at = list.indexOf(document.activeElement);
      var next = list[(at + dir + list.length + (at < 0 ? 1 : 0)) % list.length];
      if (next) next.focus();
    };
    var filter = '';
    var applyFilter = function () {
      var q = filter.toLowerCase();
      var shown = 0;
      [].forEach.call(m.querySelectorAll('.ne-menu-i'), function (b) {
        var txt = (b.textContent || '').toLowerCase();
        var hit = !q || txt.indexOf(q) >= 0;
        b.hidden = !hit;
        if (hit) shown++;
      });
      [].forEach.call(m.querySelectorAll('.ne-menu-h'), function (h) {
        var nx = h.nextElementSibling, any = false;
        while (nx && !nx.classList.contains('ne-menu-h')) {
          if (!nx.hidden) { any = true; break; }
          nx = nx.nextElementSibling;
        }
        h.hidden = !any;
      });
      m.setAttribute('data-q', filter);
      var first = items()[0];
      if (first) first.focus();
      return shown;
    };
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault(); self.closeMenu();
        if (id) self.focusBlock(id);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); step(e.key === 'ArrowDown' ? 1 : -1); return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        var list = items();
        if (list.length) list[e.key === 'Home' ? 0 : list.length - 1].focus();
        return;
      }
      if (e.key === 'Backspace') {
        if (!filter) return;
        e.preventDefault(); filter = filter.slice(0, -1); applyFilter(); return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault(); filter += e.key; applyFilter(); return;
      }
    });
  };

  function mItem(act, icon, label, disabled, extra, eg) {
    return '<button type="button" class="ne-menu-i' + (extra ? ' ' + extra : '') +
      (eg ? ' ne-menu-i--eg' : '') +
      '" role="menuitem" data-act="' + act + '"' + (disabled ? ' disabled' : '') + '>' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + B().esc(label) +
      (eg ? '<em class="ne-menu-eg">' + B().esc(eg) + '</em>' : '') +
      '</span></button>';
  }

  /*@3.NOEJ.237*/
  Editor.prototype.editDiagramLabel = function (id, lbl) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'code') return;
    var was = (lbl.textContent || '').trim();
    if (!was) return;
    var src = String(hit.b.src || '');
    var at = src.indexOf(was);
    if (at < 0) {
      this.say(L('هذه التسميةُ محسوبةٌ ولا توجد نصّاً في الشِفرة — افتحِ الشِفرةَ وعدّلها.',
                 'That label is computed, not literal in the source — open the source to edit it.'));
      return;
    }
    if (src.indexOf(was, at + was.length) >= 0) {
      this.say(L('هذه التسميةُ مكرّرةٌ في الشِفرة — افتحِ الشِفرةَ وعدّل ما تريد بعينه.',
                 'That label appears more than once — open the source and edit the one you mean.'));
      return;
    }
    var self = this;
    var box = el('input', 'ne-dgm-ed', {
      type: 'text', value: was, dir: 'auto', spellcheck: 'false',
      'aria-label': L('عدّلْ تسميةَ العنصر', 'Edit the element label')
    });
    var host = lbl.closest('.ne-dgm');
    var r = lbl.getBoundingClientRect(), hr = host.getBoundingClientRect();
    box.style.insetBlockStart = Math.round(r.top - hr.top - 4) + 'px';
    box.style.insetInlineStart = Math.round(r.left - hr.left - 6) + 'px';
    box.style.inlineSize = Math.max(70, Math.round(r.width) + 24) + 'px';
    host.appendChild(box);
    box.focus();
    box.select();
    var done = false;
    function shut(save) {
      if (done) return;
      done = true;
      var now = box.value.trim();
      if (box.parentNode) box.parentNode.removeChild(box);
      if (!save || !now || now === was) return;
      if (/[\[\]{}()|"'`<>\n]/.test(now)) {
        self.say(L('تجنّبِ الأقواسَ والعلاماتِ الخاصّة في التسمية.',
                   'Avoid brackets and special marks inside a label.'));
        return;
      }
      var before = self.snapshot();
      hit.b.src = src.slice(0, at) + now + src.slice(at + was.length);
      self.pushUndo(before);
      self.renderOne(id);
      self.touch();
    }
    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); shut(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); shut(false); }
      ev.stopPropagation();
    });
    box.addEventListener('blur', function () { shut(true); });
  };

  Editor.prototype.say = function (msg) {
    if (this.opts.onNote) { this.opts.onNote(msg); return; }
    if (window.Garden && Garden.toast) { try { Garden.toast(msg); return; } catch (e) {} }
  };

  /*@3.NOEJ.202*/
  Editor.prototype.closeImgPanels = function (keep) {
    if (!this.root) return;
    var list = this.root.querySelectorAll('.ne-img-edit');
    for (var i = 0; i < list.length; i++) {
      var pan = list[i];
      if (pan.hidden) continue;
      if (keep && keep.contains(pan)) continue;
      var url = pan.querySelector('.ne-img-url');
      if (url && !String(url.value || '').trim()) continue;
      pan.hidden = true;
    }
  };

  Editor.prototype.closeMenu = function () {
    if (this.menu) { this.menu.remove(); this.menu = null; }
    this.menuFor = null;
  };


  /*@3.NOEJ.13*/
  /*@3.NOEJ.85*/
  Editor.prototype.indentItem = function (node, b, li, dir) {
    var lis = [].slice.call(node.querySelectorAll('.ne-li'));
    var k = lis.indexOf(li);
    if (k < 0) return false;
    var before = this.snapshot();
    this.readBlock(node);
    var cur = b.items[k].lv || 0;
    var prev = k > 0 ? (b.items[k - 1].lv || 0) : -1;
    /*@3.NOEJ.86*/
    var want = Math.max(0, Math.min(5, cur + dir));
    if (dir > 0 && want > prev + 1) return false;
    if (want === cur) return false;
    var drop = cur - want;
    b.items[k].lv = want;
    if (!want) delete b.items[k].lv;
    for (var j = k + 1; j < b.items.length; j++) {
      var lv = b.items[j].lv || 0;
      if (lv <= cur) break;
      var nl = Math.max(0, Math.min(5, lv - drop));
      if (nl) b.items[j].lv = nl; else delete b.items[j].lv;
    }
    var pos = offsetIn(li, window.getSelection().anchorNode || li,
                       window.getSelection().anchorOffset || 0);
    this.pushUndo(before);
    this.renderOne(b.id);
    var fresh = this.root.querySelector('[data-bid="' + b.id + '"]');
    var back = fresh ? fresh.querySelectorAll('.ne-li')[k] : null;
    if (back) { back.focus(); selectRange(back, pos, pos); }
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.splitListItem = function (node, li, b) {
    var lis = [].slice.call(node.querySelectorAll('.ne-li'));
    var k = lis.indexOf(li);
    if (k < 0) return;
    var before = this.snapshot();
    this.readBlock(node);
    var bounds = this.selBounds(li) || [runsLen(b.items[k].rt), runsLen(b.items[k].rt)];
    var at = Math.min(bounds[0], bounds[1]);
    var parts = sliceRuns(b.items[k].rt || [], 0, at);
    b.items[k].rt = joinRuns([parts[0], parts[1]]);
    /*@3.NOEJ.87*/
    var nit = { rt: joinRuns([parts[2]]) };
    if (b.items[k].lv) nit.lv = b.items[k].lv;
    b.items.splice(k + 1, 0, nit);
    this.pushUndo(before);
    this.renderOne(b.id);
    var fresh = this.root.querySelector('[data-bid="' + b.id + '"]');
    var next = fresh ? fresh.querySelectorAll('.ne-li')[k + 1] : null;
    if (next) { next.focus(); selectRange(next, 0, 0); }
    this.touch();
    this.emitState();
  };

  Editor.prototype.exitList = function (node, b) {
    var before = this.snapshot();
    this.readBlock(node);
    b.items = (b.items || []).filter(function (x) { return B().runsToText(x.rt).trim(); });
    if (!b.items.length) b.items = [{ rt: [] }];
    var np = B().blank('p');
    this.insertAfter(b.id, np);
    this.pushUndo(before);
    this.renderOne(b.id);
    var npAt = this.blockAt(np.id);
    if (npAt) this.renderInsert(npAt.i, [np]); else this.render();
    this.focusBlock(np.id);
    this.touch();
    this.emitState();
  };


  /*@3.NOEJ.267*/
  var BIN_KEY = {
    deleteContentBackward: 'Backspace',
    deleteContentForward: 'Delete',
    insertParagraph: 'Enter'
  };

  function keyOf(e) {
    var I = window.GardenInkInput;
    return (I && I.keyOf) ? I.keyOf(e) : String(e.key || '').toLowerCase();
  }

  Editor.prototype.bind = function () {
    var self = this;
    var root = this.root;

    root.addEventListener('contextmenu', function (e) {
      if (self.readOnly) return;
      if (self._selMode) return;
      self._ctxAt = Date.now();
      self.lpDrop();
      if (self.openCtx(e.target, e.clientX, e.clientY)) e.preventDefault();
    });

    /*@3.NOEJ.317*/
    this.lpDrop = function () {
      if (self._lpT) { clearTimeout(self._lpT); self._lpT = 0; }
      self._lpAt = null;
    };
    root.addEventListener('pointerdown', function (e) {
      self.lpDrop();
      if (e.pointerType === 'mouse' || self._selMode || self.readOnly) return;
      if (e.isPrimary === false) return;
      var tgt = e.target, sx = e.clientX, sy = e.clientY;
      self._lpAt = { x: sx, y: sy };
      self._lpT = setTimeout(function () {
        self._lpT = 0;
        if (!self._lpAt) return;
        if (self._ctxAt && Date.now() - self._ctxAt < 1200) return;
        if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
        if (self.openCtx(tgt, sx, sy)) {
          self._eatClick = 1;
          try { window.getSelection().removeAllRanges(); } catch (eS) {}
        }
      }, 520);
    }, true);
    ['pointermove', 'pointercancel'].forEach(function (ty) {
      root.addEventListener(ty, function (e) {
        if (!self._lpAt) return;
        if (ty === 'pointercancel') { self.lpDrop(); return; }
        if (Math.hypot(e.clientX - self._lpAt.x, e.clientY - self._lpAt.y) > 10) self.lpDrop();
      }, true);
    });
    root.addEventListener('pointerup', function () { self.lpDrop(); }, true);

    root.addEventListener('pointerdown', function (e) {
      /*@3.NOEJ.139*/
      self._pdAt = { x: e.clientX, y: e.clientY };
      self._imgDragged = false;
      var node = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (node) self.focusBid = node.getAttribute('data-bid');
      var t = e.target;
      if (t.classList && (t.classList.contains('ne-text') || t.classList.contains('ne-li') ||
                          t.classList.contains('ne-cell'))) self.focusEd = t;
    }, true);

    /*@3.NOEJ.160*/
    this._bdrag = null;
    this._onBdragMove = function (e) {
      var st = self._bdrag;
      if (!st) return;
      if (!(e.buttons & 1)) { self.endBlockDrag(); return; }
      var hitEl = document.elementFromPoint(e.clientX, e.clientY);
      var node = (hitEl && hitEl.closest) ? hitEl.closest('[data-bid]') : null;
      if (!node || !root.contains(node)) return;
      var id = node.getAttribute('data-bid');
      if (!st.on) {
        if (id === st.id) return;
        if (Math.abs(e.clientY - st.y) < 6 && Math.abs(e.clientX - st.x) < 6) return;
        st.on = true;
        root.setAttribute('data-bdrag', '1');
        var ae = document.activeElement;
        if (ae && ae.blur && root.contains(ae)) { try { ae.blur(); } catch (eB) {} }
      }
      try { window.getSelection().removeAllRanges(); } catch (eS) {}
      if (id !== st.at) { st.at = id; self.selectRangeBetween(st.id, id); }
    };
    this._onBdragStop = function () { self.endBlockDrag(); };
    document.addEventListener('pointermove', this._onBdragMove);
    document.addEventListener('pointerup', this._onBdragStop);
    document.addEventListener('pointercancel', this._onBdragStop);

    root.addEventListener('pointerdown', function (e) {
      self.endBlockDrag();
      if (self._selMode || e.button !== 0 || e.pointerType === 'touch') return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      var ce = e.target.closest ? e.target.closest('[contenteditable="true"]') : null;
      if (!ce) return;
      var bn = ce.closest('[data-bid]');
      if (!bn) return;
      self._bdrag = { id: bn.getAttribute('data-bid'), at: null,
                      x: e.clientX, y: e.clientY, on: false };
    });

    /*@3.NOEJ.177*/
    root.addEventListener('focusout', function () {
      clearTimeout(self._blurT);
      self._blurT = setTimeout(function () { self.emitState(); }, 0);
    });

    root.addEventListener('focusout', function (e) {
      if (!e.target.classList) return;
      var node = e.target.closest('[data-bid]');
      if (!node) return;

      if (e.target.classList.contains('ne-code')) {
        self.readBlock(node);
        var hit = self.blockAt(node.getAttribute('data-bid'));
        if (hit && self._mmdFresh === hit.b.id && isDiagram(hit.b)) {
          self._mmdFresh = null;
          hit.b.dgm = 1;
          self.renderOne(hit.b.id);
          self.touch();
          return;
        }
        if (hit) paintCode(e.target, hit.b);
        return;
      }

      if (e.target.classList.contains('ne-tex')) {
        self.readBlock(node);
        var mx = e.target.parentNode;
        var mout = mx.querySelector('.ne-math-out');
        var has = !!String(e.target.value || '').trim();
        if (mout) {
          renderMath(mout, e.target.value);
          mout.hidden = !has;
        }
        e.target.hidden = has;
      }
    });

    root.addEventListener('focusin', function (e) {
      if (e.target.classList && e.target.classList.contains('ne-code')) {
        var n2 = e.target.closest('[data-bid]');
        var h2 = n2 ? self.blockAt(n2.getAttribute('data-bid')) : null;
        if (h2) e.target.textContent = h2.b.src || '';
      }
      var t = e.target;
      if (t.classList && (t.classList.contains('ne-text') || t.classList.contains('ne-li') ||
                          t.classList.contains('ne-cell'))) {
        self.focusEd = t;
      }
      var node = t.closest ? t.closest('[data-bid]') : null;
      if (node) self.focusBid = node.getAttribute('data-bid');
      self.emitState();
    });

    /*@3.NOEJ.141*/
    this._onSelChange = function () {
      var edn = self.currentEditable();
      if (!edn) return;
      var s = window.getSelection();
      if (!s || !s.rangeCount) return;
      var r = s.getRangeAt(0);
      if (!edn.contains(r.startContainer)) return;
      self.lastSel = { ed: edn,
        a: offsetIn(edn, r.startContainer, r.startOffset),
        b: offsetIn(edn, r.endContainer, r.endOffset) };
      self.emitState();
    };
    document.addEventListener('selectionchange', this._onSelChange);

    /*@3.NOEJ.259*/
    root.addEventListener('beforeinput', function (e) {
      var bn = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (bn) self.typeGroup(bn.getAttribute('data-bid'));
      var key = BIN_KEY[e.inputType];
      if (!key || self._binGo) return;
      var t = e.target;
      if (!t || !t.isContentEditable) return;
      if (!(t.classList.contains('ne-text') || t.classList.contains('ne-li'))) return;
      self._binGo = 1;
      var took = false;
      try {
        took = !t.dispatchEvent(new KeyboardEvent('keydown', {
          key: key, code: key, bubbles: true, cancelable: true
        }));
      } catch (eB) { took = false; }
      self._binGo = 0;
      if (took) e.preventDefault();
    });

    /*@3.NOEJ.273*/
    root.addEventListener('input', function () { self.caretSeen(); });

    root.addEventListener('input', function (e) {
      var node = e.target.closest('[data-bid]');
      if (node) { self.readBlock(node); self.commitProv(node.getAttribute('data-bid')); }
      /*@3.NOEJ.125*/
      var liI = e.target.closest ? e.target.closest('.ne-li') : null;
      if (liI) {
        if (liI.textContent === '') liI.setAttribute('data-blank', '1');
        else liI.removeAttribute('data-blank');
      }
      if (e.target.classList.contains('ne-tex')) {
        var out = node.querySelector('.ne-math-out');
        if (out) renderMath(out, e.target.value);
      }
      if (e.target.classList.contains('ne-img-url')) {
        var vw = node.querySelector('.ne-img-view');
        if (vw) paintImg(vw, e.target.value, '');
      }
      if (e.target.classList.contains('ne-img-alt')) {
        var hitA = self.blockAt(node.getAttribute('data-bid'));
        var capA = node.querySelector('.ne-cap');
        if (capA && hitA) {
          capA.textContent = e.target.value || '';
          capA.hidden = !(hitA.b.cap && e.target.value);
        }
      }
      var slk = e.target.getAttribute && e.target.getAttribute('data-imgk');
      if (slk) {
        var hitS = self.blockAt(node.getAttribute('data-bid'));
        if (hitS) {
          hitS.b[slk] = parseInt(e.target.value, 10);
          applyImgStyle(node.querySelector('.ne-fig'), hitS.b);
        }
      }
      if (e.target.classList.contains('ne-lang')) {
        /*@3.NOEJ.347*/
        var hitL = self.blockAt(node.getAttribute('data-bid'));
        var preL = node.querySelector('.ne-code');
        if (hitL) {
          var wasD = !!node.querySelector('.ne-dgm');
          hitL.b.lang = e.target.value || '';
          if (isDiagram(hitL.b) !== wasD) {
            var caret = e.target.selectionStart;
            if (preL) hitL.b.src = preL.textContent || '';
            self.renderOne(hitL.b.id);
            var back = self.root.querySelector(
              ':scope > [data-bid="' + hitL.b.id + '"] .ne-lang');
            if (back) {
              back.focus();
              try { back.setSelectionRange(caret, caret); } catch (eR) {}
            }
            self.softTouch();
            return;
          }
          if (preL && document.activeElement !== preL) paintCode(preL, hitL.b);
        }
      }
      self.softTouch();
    });

    /*@3.NOEJ.201*/
    root.addEventListener('pointerover', function (e) {
      /*@3.NOEJ.309*/
      if ((e.pointerType && e.pointerType !== 'mouse') || self.coarse()) return;
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.ne-rail') || t.closest('.ne-rgrip') || t.closest('.ne-wgrip')) return;
      var nb = t.closest(':scope > [data-bid]');
      if (!nb) {
        nb = t.closest('[data-bid]');
        while (nb && nb.parentNode !== root) nb = nb.parentNode.closest ? nb.parentNode.closest('[data-bid]') : null;
      }
      if (nb && nb.parentNode === root) self.chromeTo(nb);
    });

    root.addEventListener('pointerleave', function (e) {
      /*@3.NOEJ.310*/
      if ((e && e.pointerType && e.pointerType !== 'mouse') || self.coarse()) return;
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      self.chromeTo(null);
    });

    /*@3.NOEJ.48*/
    root.addEventListener('click', function (e) {
      if (self._eatClick) { self._eatClick = 0; e.preventDefault(); e.stopPropagation(); return; }
      /*@3.NOEJ.140*/
      if (self._pdAt && e.detail > 0 &&
          Math.hypot(e.clientX - self._pdAt.x, e.clientY - self._pdAt.y) > 8) {
        return;
      }
      var lnk = e.target.closest ? e.target.closest('a[href]') : null;
      /*@3.NOEJ.172*/
      if (lnk && lnk.hasAttribute('data-nl') && !self._selMode && !e.shiftKey) {
        e.preventDefault();
        self.followLink(lnk.getAttribute('data-nl'));
        return;
      }
      if (lnk && !self._selMode && !e.shiftKey) {
        var hrefC = B().normUrl(lnk.getAttribute('href'));
        if (hrefC) {
          e.preventDefault();
          window.open(hrefC, '_blank', 'noopener');
          return;
        }
      }
      if (e.target.closest('.ne-tail')) {
        self.addBlock('p', self.lastBlockId());
        return;
      }
      if (e.target === root) {
        /*@3.NOEJ.315*/
        self.dropProv();
        self.hintCtx();
        return;
      }
      /*@3.NOEJ.128*/
      var frame = e.target.closest('[data-bid][data-fp]');
      if (frame && e.target === frame && !self._selMode) {
        e.preventDefault();
        self.toggleBlockSel(frame.getAttribute('data-bid'), true);
        try { window.getSelection().removeAllRanges(); } catch (eF) {}
        return;
      }
      var node = e.target.closest('[data-bid]');
      if (!node) return;
      var id = node.getAttribute('data-bid');
      self.focusBid = id;

      /*@3.NOEJ.165*/
      if (e.target.closest('.ne-tick')) {
        e.preventDefault();
        if (!self._selMode) self.setSelectMode(true, 1);
        self.toggleBlockSel(id);
        self._bselLast = id;
        try { window.getSelection().removeAllRanges(); } catch (eT) {}
        return;
      }

      /*@3.NOEJ.36*/
      if (self._selMode || e.ctrlKey || e.metaKey || e.shiftKey) {
        if (e.target.closest('.ne-plus')) { self.openMenu(id, e.target.closest('.ne-plus'), 'insert'); return; }
        e.preventDefault();
        if (e.shiftKey && self._bselLast) self.selectBlockRange(id);
        else { self.toggleBlockSel(id, !(self._selMode || e.ctrlKey || e.metaKey)); self._bselLast = id; }
        return;
      }
      if (self.selectedBlocks().length) self.clearBlockSel();

      var grip = e.target.closest('.ne-grip');
      if (grip) { self.openMenu(id, grip, 'block'); return; }
      var plus = e.target.closest('.ne-plus');
      if (plus) { self.openMenu(id, plus, 'insert'); return; }

      var cb = e.target.closest('.ne-check');
      if (cb) {
        var on = cb.getAttribute('aria-checked') === 'true';
        cb.setAttribute('aria-checked', on ? 'false' : 'true');
        self.readBlock(node);
        self.touch();
        return;
      }

      var chb = e.target.closest('[data-calh]');
      if (chb) {
        var hb = self.blockAt(id);
        var cur = CAL_ORDER.indexOf(calKind(hb ? hb.b : null));
        self.setCallout(id, CAL_ORDER[(cur + 1) % CAL_ORDER.length]);
        return;
      }

      var tb = e.target.closest('[data-tbl]');
      if (tb) { self.tableOp(id, tb.getAttribute('data-tbl')); return; }

      var mo = e.target.closest('.ne-math-out');
      if (mo) {
        var mx = mo.parentNode;
        var mta = mx.querySelector('.ne-tex');
        if (mta) { mta.hidden = false; mo.hidden = true; mta.focus(); }
        return;
      }

      var inD = e.target.closest ? e.target.closest('.ne-dgm') : null;
      var lbl = inD && e.target.closest ? e.target.closest('text, .nodeLabel, .edgeLabel') : null;
      if (inD && lbl) { self.editDiagramLabel(id, lbl); return; }

      var dgb = e.target.closest('[data-dgm]');
      if (dgb) {
        var hitD = self.blockAt(id);
        if (!hitD) return;
        /*@3.NOEJ.236*/
        var wasOn = (hitD.b.dgm == null) ? 1 : (hitD.b.dgm ? 1 : 0);
        hitD.b.dgm = wasOn ? 0 : 1;
        self.renderOne(id);
        if (!hitD.b.dgm) {
          var preT = self.root.querySelector('[data-bid="' + id + '"] .ne-code');
          if (preT) { try { preT.focus({ preventScroll: true }); } catch (eT) { preT.focus(); } }
        }
        self.touch();
        return;
      }

      var imf = e.target.closest('.ne-fig');
      if (imf && imf.getAttribute('data-sh') === 'circle' && self._imgDragged) {
        self._imgDragged = false;
        return;
      }
      if (imf && !e.target.closest('.ne-cap')) {
        var pan = node.querySelector('.ne-img-edit');
        if (pan) pan.hidden = !pan.hidden;
        return;
      }
      var iun = e.target.closest('[data-imguns]');
      if (iun) {
        if (!window.GardenUnsplash) return;
        GardenUnsplash.open(function (p) {
          var hitU = self.blockAt(id);
          if (!hitU || !p || !p.url) return;
          var beforeU = self.snapshot();
          hitU.b.url = B().httpsOnly(p.url);
          if (!hitU.b.alt) hitU.b.alt = p.alt || '';
          hitU.b.by = p.by || '';
          hitU.b.byLink = p.byLink || '';
          self.pushUndo(beforeU);
          self.render();
          self.touch();
          self.emitState();
        });
        return;
      }
      var imc = e.target.closest('[data-imgc]');
      if (imc) {
        var hitC = self.blockAt(id);
        if (!hitC) return;
        hitC.b.cap = hitC.b.cap ? 0 : 1;
        imc.setAttribute('aria-pressed', hitC.b.cap ? 'true' : 'false');
        imc.innerHTML = '<i class="fa-solid fa-' + (hitC.b.cap ? 'eye' : 'eye-slash') +
          '" aria-hidden="true"></i>';
        var capC = node.querySelector('.ne-cap');
        if (capC) capC.hidden = !(hitC.b.cap && capC.textContent);
        self.touch();
        return;
      }
      var ims = e.target.closest('[data-imgs]');
      if (ims) {
        var hitS = self.blockAt(id);
        if (!hitS) return;
        hitS.b.sh = ims.getAttribute('data-imgs');
        [].forEach.call(node.querySelectorAll('[data-imgs]'), function (x) {
          x.setAttribute('aria-pressed', x === ims ? 'true' : 'false');
        });
        applyImgStyle(node.querySelector('.ne-fig'), hitS.b);
        self.touch();
        return;
      }
      var ima = e.target.closest('[data-imga]');
      if (ima) {
        var hitA = self.blockAt(id);
        if (!hitA) return;
        hitA.b.al = ima.getAttribute('data-imga');
        [].forEach.call(node.querySelectorAll('[data-imga]'), function (x) {
          x.setAttribute('aria-pressed', x === ima ? 'true' : 'false');
        });
        self.applyStyleAttrs(node, hitA.b);
        self.touch();
        return;
      }
      var imr = e.target.closest('[data-imgr]');
      if (imr) {
        var hitR = self.blockAt(id);
        if (!hitR) return;
        hitR.b.iw = 100; hitR.b.br = 100; hitR.b.op = 100;
        delete hitR.b.sh; delete hitR.b.al;
        [].forEach.call(node.querySelectorAll('[data-imgs]'), function (x) {
          x.setAttribute('aria-pressed', x.getAttribute('data-imgs') === 'rect' ? 'true' : 'false');
        });
        [].forEach.call(node.querySelectorAll('[data-imga]'), function (x) {
          x.setAttribute('aria-pressed', x.getAttribute('data-imga') === 'start' ? 'true' : 'false');
        });
        self.applyStyleAttrs(node, hitR.b);
        [].forEach.call(node.querySelectorAll('[data-imgk]'), function (sl) {
          sl.value = String(hitR.b[sl.getAttribute('data-imgk')]);
        });
        applyImgStyle(node.querySelector('.ne-fig'), hitR.b);
        self.touch();
        return;
      }

      var gb = e.target.closest('.ne-gap-b');
      if (gb) {
        var hitG = self.blockAt(id);
        if (!hitG || hitG.b.ty !== 'gap') return;
        var beforeG = self.snapshot();
        var cur = hitG.b.h || 40;
        hitG.b.h = Math.max(12, Math.min(320, cur + (gb.textContent === '+' ? 20 : -20)));
        self.pushUndo(beforeG);
        var gEl = node.querySelector('.ne-gap');
        if (gEl) gEl.style.blockSize = hitG.b.h + 'px';
        self.touch();
        return;
      }
    });

    /*@3.NOEJ.196*/
    root.addEventListener('keydown', function (e) {
      if (!self._mn) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); self.closeMention(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); self.moveMention(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); self.moveMention(-1); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        self.pickMentionActive();
        return;
      }
    }, true);

    root.addEventListener('focusout', function () { self.closeMention(); });

    /*@3.NOEJ.37*/
    root.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      var picked = self.selectedBlocks().length;
      if (picked) {
        var k = keyOf(e);
        if (mod && k === 'c') { e.preventDefault(); self.copyBlocks(); return; }
        if (mod && k === 'x') { e.preventDefault(); self.cutBlocks(); return; }
        if (mod && k === 'v') { e.preventDefault(); self.pasteBlocks(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); self.deleteBlocks(); return; }
        if (e.key === 'Escape') { e.preventDefault(); self.clearBlockSel(); return; }
      } else if (mod && e.shiftKey && keyOf(e) === 'v') {
        /*@3.NOEJ.340*/
        self._plainNext = true;
        setTimeout(function () { self._plainNext = false; }, 1200);
      } else if (mod && keyOf(e) === 'v' && Editor.clip && Editor.clip.length) {
        var here = e.target.closest('[data-bid]');
        if (here && !e.target.isContentEditable) { e.preventDefault(); self.pasteBlocks(); return; }
      }

      var node = e.target.closest('[data-bid]');
      if (!node) return;
      if (e.key === 'Escape') {
        var pnl = node.querySelector('.ne-img-edit');
        if (pnl && !pnl.hidden) { e.preventDefault(); self.closeImgPanels(null); return; }
      }
      var id = node.getAttribute('data-bid');
      var hit = self.blockAt(id);
      if (!hit) return;
      var b = hit.b;
      var mod = e.ctrlKey || e.metaKey;

      if (mod && !e.shiftKey && keyOf(e) === 'z') {
        e.preventDefault();
        if (self.hist) self.hist.undo(); else self.doUndo();
        return;
      }
      if (mod && (keyOf(e) === 'y' || (e.shiftKey && keyOf(e) === 'z'))) {
        e.preventDefault();
        if (self.hist) self.hist.redo(); else self.doRedo();
        return;
      }
      if (mod && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault(); self.move(id, e.key === 'ArrowUp' ? -1 : 1); return;
      }
      if (mod && !e.shiftKey && 'biu'.indexOf(keyOf(e)) !== -1) {
        e.preventDefault();
        self.exec({ b: 'bold', i: 'italic', u: 'underline' }[keyOf(e)]);
        return;
      }
      if (mod && e.key === 'Enter') { e.preventDefault(); self.save(); return; }

      if (e.key === 'Enter' && !e.shiftKey && TEXTY[b.ty]) {
        e.preventDefault();
        var before = self.snapshot();
        self.readBlock(node);
        /*@3.NOEJ.248*/
        var ednE = (e.target.closest && e.target.closest('.ne-text')) || null;
        var cutA = null, cutB = null;
        if (ednE) {
          var bnd = self.selBounds(ednE);
          if (bnd) { cutA = Math.min(bnd[0], bnd[1]); cutB = Math.max(bnd[0], bnd[1]); }
        }
        var rtE = b.rt || [];
        var lenE = runsLen(rtE);
        if (cutA === 0 && cutB === 0 && lenE > 0 && !b.fp) {
          var up = B().blank('p');
          var hitE = self.blockAt(id);
          var atUp = hitE ? hitE.i : 0;
          self.doc.blocks.splice(atUp, 0, up);
          self.pushUndo(before);
          self.renderInsert(atUp, [up]);
          self.focusBlock(id, false);
          self.touch();
          self.emitState();
          return;
        }
        var nb = B().blank(b.ty === 'h' ? 'p' : b.ty);
        if (b.ty === 'todo') nb.done = 0;
        var tailE = null;
        if (cutA != null && cutA < lenE) {
          var prtE = sliceRuns(rtE, cutA, cutB);
          b.rt = joinRuns([prtE[0]]);
          tailE = joinRuns([prtE[2]]);
          nb.rt = tailE;
        } else if (cutA != null && cutB > cutA) {
          b.rt = joinRuns([sliceRuns(rtE, cutA, cutB)[0]]);
        }
        /*@3.NOEJ.73*/
        if (b.fp) {
          nb.fp = self.fpUnder(b, id);
          nb.wm = b.wm || 'fit';
          nb.z = self.topZ() + 1;
          if (b.ff) nb.ff = b.ff;
          if (b.dir) nb.dir = b.dir;
          if (b.al) nb.al = b.al;
          /*@3.NOEJ.126*/
          if (b.rot) {
            nb.rot = b.rot;
            var th = b.rot * Math.PI / 180;
            var dd = self.freeH(id) + 8;
            var WR = self.sheetW() || 794;
            var sgr = self.isRtl() ? -1 : 1;
            nb.fp = {
              x: Math.max(0, Math.min(0.96, (b.fp.x || 0) + sgr * (-Math.sin(th) * dd) / WR)),
              y: Math.max(0, Math.round((b.fp.y || 0) + Math.cos(th) * dd))
            };
          }
        }
        self.insertAfter(id, nb);
        self.pushUndo(before);
        if (tailE) self.renderOne(id);
        /*@3.NOEJ.152*/
        var nbAt = self.blockAt(nb.id);
        if (nbAt) self.renderInsert(nbAt.i, [nb]); else self.render();
        if (tailE) {
          var fresh = self.root.querySelector('[data-bid="' + nb.id + '"]');
          var edF = fresh ? fresh.querySelector('.ne-text') : null;
          if (edF) { edF.focus(); selectRange(edF, 0, 0); }
          else self.focusBlock(nb.id);
        } else self.focusBlock(nb.id);
        self.touch();
        self.emitState();
        return;
      }

      /*@3.NOEJ.84*/
      if (e.key === 'Tab' && LISTY[b.ty]) {
        var liT = e.target.closest('.ne-li');
        if (liT) {
          e.preventDefault();
          self.indentItem(node, b, liT, e.shiftKey ? -1 : 1);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey && LISTY[b.ty]) {
        var li = e.target.closest('.ne-li');
        if (!li) return;
        e.preventDefault();
        if (!li.textContent.trim()) {
          /*@3.NOEJ.88*/
          if (parseInt(li.getAttribute('data-lv') || '0', 10) > 0) {
            self.indentItem(node, b, li, -1);
            return;
          }
          /*@3.NOEJ.122*/
          var allLi = [].slice.call(node.querySelectorAll('.ne-li'));
          var at = allLi.indexOf(li);
          var prevBlank = at > 0 && !allLi[at - 1].textContent.trim();
          if (prevBlank) { self.exitList(node, b); return; }
          self.splitListItem(node, li, b);
          return;
        }
        self.splitListItem(node, li, b);
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && !mod &&
          e.target.isContentEditable &&
          (e.target.classList.contains('ne-text') ||
           e.target.classList.contains('ne-li'))) {
        var selJ = window.getSelection();
        if (selJ && selJ.isCollapsed) {
          var bndJ = self.selBounds(e.target);
          var dirJ = e.key === 'Backspace' ? -1 : 1;
          var lenJ = (e.target.textContent || '').length;
          if (bndJ && bndJ[0] === bndJ[1] &&
              (dirJ < 0 ? bndJ[0] === 0 : bndJ[0] >= lenJ) &&
              self.joinAt(id, e.target, dirJ)) {
            e.preventDefault();
            return;
          }
        }
      }

      if (e.key === 'Backspace' && TEXTY[b.ty]) {
        var t = node.querySelector('.ne-text');
        if (t && !t.textContent && self.doc.blocks.length > 1) {
          e.preventDefault();
          self.remove(id);
          return;
        }
      }

      if (e.key === 'Backspace' && LISTY[b.ty]) {
        var li2 = e.target.closest('.ne-li');
        var lis = [].slice.call(node.querySelectorAll('.ne-li'));
        if (li2 && !li2.textContent && lis.length > 1) {
          e.preventDefault();
          var k = lis.indexOf(li2);
          var before2 = self.snapshot();
          self.readBlock(node);
          b.items.splice(k, 1);
          self.pushUndo(before2);
          self.render();
          var fresh = self.root.querySelector('[data-bid="' + id + '"]');
          var prev = fresh ? fresh.querySelectorAll('.ne-li')[Math.max(0, k - 1)] : null;
          if (prev) { prev.focus(); selectRange(prev, runsLen(b.items[Math.max(0, k - 1)].rt), runsLen(b.items[Math.max(0, k - 1)].rt)); }
          self.touch();
          return;
        }
      }

      if (e.key === 'Escape' && b.prov) {
        e.preventDefault();
        e.stopPropagation();
        try { e.target.blur(); } catch (x9) {}
        self.dropProv();
        return;
      }

      if (e.key === '/' && TEXTY[b.ty]) {
        var tt = node.querySelector('.ne-text');
        if (tt && !tt.textContent.trim()) {
          e.preventDefault();
          self.openMenu(id, tt, 'insert');
        }
      }
    });

    /*@3.NOEJ.195*/
    root.addEventListener('input', function (e) {
      var t0 = e.target;
      if (!t0 || !t0.classList) return;
      if (!(t0.classList.contains('ne-text') || t0.classList.contains('ne-li') ||
            t0.classList.contains('ne-cell'))) { self.closeMention(); return; }
      var span = self.mentionAt(t0);
      if (span) self.openMention(t0, span);
      else self.closeMention();
    });

    /*@3.NOEJ.136*/
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('ne-text')) return;
      if (t.textContent !== '/') return;
      var node2 = t.closest('[data-bid]');
      if (!node2) return;
      var id2 = node2.getAttribute('data-bid');
      var hit2 = self.blockAt(id2);
      if (!hit2 || !TEXTY[hit2.b.ty]) return;
      t.textContent = '';
      self.openMenu(id2, t, 'insert');
    });

    /*@3.NOEJ.341*/
    function elOf(t) {
      if (t && t.nodeType !== 1) t = t.parentElement;
      return (t && t.nodeType === 1) ? t : null;
    }

    root.addEventListener('paste', function (e) {
      var tgt = elOf(e.target);
      if (!tgt) return;
      var node = tgt.closest('[data-bid]');
      if (!node) return;
      /*@3.NOEJ.4*/
      if (tgt.classList.contains('ne-code') ||
          tgt.classList.contains('ne-tex')) {
        /*@3.NOEJ.137*/
        e.preventDefault();
        var flatTxt = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (flatTxt) {
          try { document.execCommand('insertText', false, flatTxt); }
          catch (ep) {
            tgt.textContent += flatTxt;
          }
        }
        return;
      }
      if (tgt.tagName === 'INPUT') return;

      e.preventDefault();
      self.pasteRun(e.clipboardData, node);
    });

    /*@3.NOEJ.342*/
    root.addEventListener('input', function () { self.hidePasteOpts(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self._pasteBar) { e.stopPropagation(); self.hidePasteOpts(); }
    }, true);
    document.addEventListener('pointerdown', function (e) {
      if (!self._pasteBar) return;
      if (e.target && e.target.closest && e.target.closest('.ne-pasteopt')) return;
      self.hidePasteOpts();
    }, true);

    root.addEventListener('beforeinput', function (e) {
      if (e.inputType !== 'insertFromPaste' && e.inputType !== 'insertFromPasteAsQuotation') return;
      var dt = e.dataTransfer;
      if (!dt || typeof dt.getData !== 'function') return;
      var tgt = elOf(e.target);
      if (!tgt) return;
      if (tgt.classList.contains('ne-code') || tgt.classList.contains('ne-tex')) return;
      if (tgt.tagName === 'INPUT') return;
      var node = tgt.closest('[data-bid]');
      if (!node) return;
      var html = '', txt = '';
      try { html = dt.getData('text/html') || ''; } catch (eh) {}
      try { txt = dt.getData('text/plain') || ''; } catch (et) {}
      if (!html && !txt) return;
      e.preventDefault();
      self.pasteRun(dt, node);
    });

    this._onDocPaste = function (e) {
      if (!self.root || !self.root.isConnected) return;
      var t = e.target;
      if (t && t.nodeType !== 1) t = t.parentElement;
      if (t && self.root.contains(t)) return;
      if (t && t.closest && (t.closest('[contenteditable="true"]') ||
          t.closest('input, textarea, select, dialog'))) return;
      if (self.readOnly) return;
      var host = self.pasteHost();
      if (!host) return;
      e.preventDefault();
      if (!self.pasteRun(e.clipboardData, host) && clipAny()) self.pasteBlocks();
    };
    /*@3.NOEJ.355*/
    if (!this.opts.noDocPaste) document.addEventListener('paste', this._onDocPaste);

    /*@3.NOEJ.143*/
    root.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    });
    root.addEventListener('drop', function (e) { e.preventDefault(); });

    this._onDocClick = function (e) {
      if (self.menu && !e.target.closest('.ne-menu') &&
          !e.target.closest('.ne-grip') && !e.target.closest('.ne-plus')) {
        self.closeMenu();
      }
      self.closeImgPanels(e.target.closest('.ne-b[data-ty="img"]'));
    };
    document.addEventListener('click', this._onDocClick);

    /*@3.NOEJ.16*/
    this._onScroll = function (e) {
      if (!self.menu) return;
      if (e.target && e.target.nodeType === 1 && self.menu.contains(e.target)) return;
      if (e.target === self.menu) return;
      self.closeMenu();
    };
    window.addEventListener('scroll', this._onScroll, true);
  };

  var DRAG_PX = 6;

  /*@3.NOEJ.24*/
  /*@3.NOEJ.44*/
  Editor.prototype.bindImgPan = function () {
    var self = this, root = this.root;
    var P = null;

    root.addEventListener('pointerdown', function (e) {
      var view = e.target.closest('.ne-fig[data-sh="circle"] .ne-img-view');
      if (!view) return;
      var node = view.closest('[data-bid]');
      var hit = node ? self.blockAt(node.getAttribute('data-bid')) : null;
      if (!hit) return;
      var r = view.getBoundingClientRect();
      P = { id: e.pointerId, b: hit.b, view: view, w: r.width || 1, h: r.height || 1,
            x: e.clientX, y: e.clientY,
            fx: hit.b.fx == null ? 50 : hit.b.fx,
            fy: hit.b.fy == null ? 50 : hit.b.fy, moved: false };
      try { view.setPointerCapture(e.pointerId); } catch (e2) {}
      e.preventDefault();
    });

    root.addEventListener('pointermove', function (e) {
      if (!P || e.pointerId !== P.id) return;
      var dx = e.clientX - P.x, dy = e.clientY - P.y;
      if (!P.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      P.moved = true;
      self._imgDragged = true;
      P.b.fx = Math.max(0, Math.min(100, P.fx - (dx / P.w) * 100));
      P.b.fy = Math.max(0, Math.min(100, P.fy - (dy / P.h) * 100));
      var im = P.view.querySelector('img');
      if (im) im.style.objectPosition = P.b.fx + '% ' + P.b.fy + '%';
    });

    var stop = function (e) {
      if (!P || e.pointerId !== P.id) return;
      try { P.view.releasePointerCapture(P.id); } catch (e2) {}
      if (P.moved) self.touch();
      P = null;
    };
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
  };

  Editor.prototype.bindDrag = function () {
    var self = this, root = this.root;
    var D = null;

    /*@3.NOEJ.124*/
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      if (!self.coarse()) return;
      var bn = e.target.closest ? e.target.closest(':scope > [data-bid]') : null;
      if (!bn) bn = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (bn && bn.parentNode === self.root) self.touchAct(bn.getAttribute('data-bid'));
    }, true);

    root.addEventListener('pointerdown', function (e) {
      var rg = e.target.closest('.ne-rgrip');
      if (!rg) return;
      var rnode = rg.closest('[data-bid][data-fp]');
      var rhit = rnode ? self.blockAt(rnode.getAttribute('data-bid')) : null;
      if (!rhit) return;
      var rr = rnode.getBoundingClientRect();
      var cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
      D = { spin: 1, b: rhit.b, node: rnode, cx: cx, cy: cy,
            a0: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI,
            r0: rhit.b.rot || 0, pid: e.pointerId, snap: self.snapshot() };
      try { rg.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
      e.stopPropagation();
    }, true);

    /*@3.NOEJ.77*/
    root.addEventListener('pointerdown', function (e) {
      var wg = e.target.closest('.ne-wgrip');
      if (!wg) return;
      var wnode = wg.closest('[data-bid]');
      var whit = wnode ? self.blockAt(wnode.getAttribute('data-bid')) : null;
      if (!whit) return;
      var WW = self.sheetW() || 794;
      /*@3.NOEJ.103*/
      var side = wg.getAttribute('data-side') === 's' ? 's' : 'e';
      if (side === 's' && !whit.b.fp) return;
      D = { wide: 1, side: side, b: whit.b, node: wnode, W: WW,
            sgn: self.isRtl() ? -1 : 1, x: e.clientX,
            ow: (wnode.offsetWidth || wnode.getBoundingClientRect().width) / WW,
            ox: whit.b.fp ? (whit.b.fp.x || 0) : 0,
            pid: e.pointerId, snap: self.snapshot() };
      try { wg.setPointerCapture(e.pointerId); } catch (x) {}
      wnode.classList.add('ne-sizing');
      e.preventDefault();
      e.stopPropagation();
    }, true);

    /*@3.NOEJ.50*/
    root.addEventListener('pointerdown', function (e) {
      var fgrip = e.target.closest('.ne-grip');
      var fnode = fgrip ? fgrip.closest('[data-bid][data-fp]') : null;
      if (fnode) {
        var fhit = self.blockAt(fnode.getAttribute('data-bid'));
        if (!fhit) return;
        var W = self.sheetW();
        D = { free: 1, b: fhit.b, node: fnode, W: W,
              x: e.clientX, y: e.clientY, grp: self.freeGroup(fhit.b),
              ox: fhit.b.fp.x, oy: fhit.b.fp.y, pid: e.pointerId,
              snap: self.snapshot() };
        try { fgrip.setPointerCapture(e.pointerId); } catch (e3) {}
        for (var gk = 0; gk < D.grp.length; gk++) D.grp[gk].node.classList.add('ne-dragging');
        e.preventDefault();
        return;
      }
      var li = e.target.closest ? e.target.closest('.ne-li') : null;
      if (li) {
        var lr = li.getBoundingClientRect();
        /*@3.NOEJ.106*/
        var onMark = self.isRtl() ? (e.clientX > lr.right - 1) : (e.clientX < lr.left + 1);
        var lnode = onMark ? li.closest('[data-bid]') : null;
        if (lnode) {
          var all = [].slice.call(lnode.querySelectorAll('.ne-li'));
          D = { item: 1, bid: lnode.getAttribute('data-bid'), li: li, node: lnode,
                from: all.indexOf(li), to: -1, x: e.clientX, y: e.clientY,
                on: false, pid: e.pointerId, grip: li };
          try { li.setPointerCapture(e.pointerId); } catch (x0) {}
          e.preventDefault();
          return;
        }
      }
      var grip = e.target.closest('.ne-grip');
      if (!grip) return;
      var node = grip.closest('[data-bid]');
      if (!node) return;
      D = { id: node.getAttribute('data-bid'), x: e.clientX, y: e.clientY,
            on: false, tgt: null, before: false, pid: e.pointerId, node: node };
      try { grip.setPointerCapture(e.pointerId); } catch (x) {}
      D.grip = grip;
    });

    root.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      /*@3.NOEJ.78*/
      if (D.spin) {
        e.preventDefault();
        var ang = Math.atan2(e.clientY - D.cy, e.clientX - D.cx) * 180 / Math.PI;
        var next = D.r0 + (ang - D.a0);
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        D.b.rot = Math.round(next * 10) / 10;
        D.node.style.transform = 'rotate(' + D.b.rot + 'deg)';
        D.node.style.transformOrigin = 'center center';
        D.moved = true;
        return;
      }
      if (D.wide) {
        e.preventDefault();
        var zw = self.zoomOf();
        var dw = D.sgn * (e.clientX - D.x) / (zw * D.W);
        if (D.side === 's' && D.b.fp) {
          var nx = Math.max(0, Math.min(0.96, D.ox + dw));
          D.b.wm = Math.max(0.06, Math.min(1 - nx, D.ow - (nx - D.ox)));
          D.b.fp.x = nx;
        } else {
          var room = D.b.fp ? Math.max(0.08, 1 - (D.b.fp.x || 0)) : 1;
          D.b.wm = Math.max(0.06, Math.min(room, D.ow + dw));
        }
        self.applyFree(D.node, D.b);
        D.moved = true;
        return;
      }
      if (D.free) {
        e.preventDefault();
        /*@3.NOEJ.74*/
        var zf = self.zoomOf();
        var sg = self.isRtl() ? -1 : 1;
        var dxN = sg * (e.clientX - D.x) / (zf * D.W);
        var dyN = (e.clientY - D.y) / zf;
        var lo = -Infinity, hi = Infinity, dLo = -Infinity, gi, g, gw;
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          gw = (g.node.offsetWidth || 120) / D.W;
          lo = Math.max(lo, -g.ox);
          hi = Math.min(hi, Math.max(0.04, 1 - gw) - g.ox);
          dLo = Math.max(dLo, -g.oy);
        }
        if (lo > hi) hi = lo;
        dxN = Math.max(lo, Math.min(hi, dxN));
        dyN = Math.max(dLo, dyN);
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          g.b.fp.x = g.ox + dxN;
          g.b.fp.y = Math.max(0, Math.round(g.oy + dyN));
          self.applyFree(g.node, g.b);
        }
        D.moved = true;
        return;
      }
      if (D.item) {
        if (!D.on) {
          if (Math.abs(e.clientX - D.x) < DRAG_PX && Math.abs(e.clientY - D.y) < DRAG_PX) return;
          D.on = true;
          self.closeMenu();
          D.li.classList.add('ne-li-dragging');
          root.classList.add('ne-dragging-on');
        }
        e.preventDefault();
        aimItem(e.clientY);
        return;
      }
      if (!D.on) {
        if (Math.abs(e.clientX - D.x) < DRAG_PX && Math.abs(e.clientY - D.y) < DRAG_PX) return;
        D.on = true;
        self.closeMenu();
        D.node.classList.add('ne-dragging');
        root.classList.add('ne-dragging-on');
      }
      e.preventDefault();
      aim(e.clientX, e.clientY);
    });

    function aimItem(y) {
      clearMark();
      var lis = [].slice.call(D.node.querySelectorAll('.ne-li'));
      D.to = -1;
      for (var i = 0; i < lis.length; i++) {
        var r = lis[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { D.to = i; lis[i].setAttribute('data-drop', 'b'); return; }
      }
      D.to = lis.length;
      if (lis.length) lis[lis.length - 1].setAttribute('data-drop', 'a');
    }

    function clearMark() {
      [].forEach.call(root.querySelectorAll('[data-drop]'), function (n) {
        n.removeAttribute('data-drop');
      });
    }

    /*@3.NOEJ.25*/
    function aim(x, y) {
      clearMark();
      D.tgt = null;
      var nodes = root.querySelectorAll('[data-bid]');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.getAttribute('data-bid') === D.id) continue;
        var r = n.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) {
          D.tgt = n;
          D.before = (y < r.top + r.height / 2);
          n.setAttribute('data-drop', D.before ? 'b' : 'a');
          return;
        }
      }
      var last = nodes[nodes.length - 1];
      if (last && y > last.getBoundingClientRect().bottom &&
          last.getAttribute('data-bid') !== D.id) {
        D.tgt = last; D.before = false;
        last.setAttribute('data-drop', 'a');
      }
    }

    function finish(commit) {
      if (!D) return;
      var d = D; D = null;
      try { d.grip.releasePointerCapture(d.pid); } catch (x) {}
      clearMark();
      root.classList.remove('ne-dragging-on');
      if (d.node) d.node.classList.remove('ne-dragging');
      if (!d.on) return;
      if (commit && d.tgt) self.moveTo(d.id, d.tgt.getAttribute('data-bid'), d.before);
    }

    root.addEventListener('pointerup', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      if (D.spin) {
        if (D.moved) { self.pushUndo(D.snap); self._eatClick = 1; self.touch(); self.emitState(); }
        D = null;
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (D.wide) {
        D.node.classList.remove('ne-sizing');
        if (D.moved) { self.pushUndo(D.snap); self.touch(); self.emitState(); }
        D = null;
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (D.free) {
        for (var gu = 0; gu < D.grp.length; gu++) D.grp[gu].node.classList.remove('ne-dragging');
        if (D.moved) {
          /*@3.NOEJ.117*/
          self._eatClick = 1;
          self.pushUndo(D.snap);
          self.touch(); self.emitState();
          e.preventDefault(); e.stopPropagation();
        }
        D = null;
        return;
      }
      if (D.item) {
        var di = D; D = null;
        try { di.grip.releasePointerCapture(di.pid); } catch (x2) {}
        clearMark();
        root.classList.remove('ne-dragging-on');
        di.li.classList.remove('ne-li-dragging');
        if (di.on && di.to >= 0) {
          self.moveItem(di.bid, di.from, di.to);
          e.preventDefault(); e.stopPropagation();
        }
        return;
      }
      var was = D.on;
      finish(true);
      if (was) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    root.addEventListener('pointercancel', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      if (D.spin) { D = null; return; }
      if (D.wide) { D.node.classList.remove('ne-sizing'); D = null; return; }
      if (D.free) { D.node.classList.remove('ne-dragging'); D = null; return; }
      if (D.item) {
        clearMark();
        root.classList.remove('ne-dragging-on');
        D.li.classList.remove('ne-li-dragging');
        D = null;
        return;
      }
      finish(false);
    });
  };

  Editor.prototype.moveTo = function (id, targetId, before) {
    if (!id || !targetId || id === targetId) return false;
    var from = this.blockAt(id);
    if (!from) return false;
    var snap = this.snapshot();
    this.readAll();
    var bs = this.doc.blocks;
    var i = -1, j = -1, k;
    for (k = 0; k < bs.length; k++) {
      if (bs[k].id === id) i = k;
      if (bs[k].id === targetId) j = k;
    }
    if (i < 0 || j < 0) return false;
    var moved = bs.splice(i, 1)[0];
    var at = 0;
    for (k = 0; k < bs.length; k++) if (bs[k].id === targetId) { at = k; break; }
    bs.splice(before ? at : at + 1, 0, moved);
    this.pushUndo(snap);
    this.render();
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.destroy = function () {
    /*@3.NOEJ.296*/
    if (this._winTie) {
      if (this._winSc) { try { this._winSc.removeEventListener('scroll', this._winTie); } catch (eW) {} }
      try { window.removeEventListener('resize', this._winTie); } catch (eW2) {}
      if (this._winQ) { try { cancelAnimationFrame(this._winQ); } catch (eW3) {} this._winQ = 0; }
      this._winTie = null;
      this._winSc = null;
    }
    this.closeMenu();
    this.closeMention();
    /*@3.NOEJ.142*/
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    /*@3.NOEJ.179*/
    if (this._blurT) { clearTimeout(this._blurT); this._blurT = null; }
    for (var cid in (this.canvases || {})) {
      try { this.canvases[cid].destroy(); } catch (e) {}
    }
    this.canvases = {};
    document.removeEventListener('click', this._onDocClick);
    if (this._onDocPaste) document.removeEventListener('paste', this._onDocPaste);
    if (this._ro) { try { this._ro.disconnect(); } catch (eR) {} this._ro = null; }
    document.removeEventListener('selectionchange', this._onSelChange);
    /*@3.NOEJ.167*/
    document.removeEventListener('pointermove', this._onBdragMove);
    document.removeEventListener('pointerup', this._onBdragStop);
    document.removeEventListener('pointercancel', this._onBdragStop);
    window.removeEventListener('scroll', this._onScroll, true);
    if (this._onFaces) {
      try { document.fonts.removeEventListener('loadingdone', this._onFaces); } catch (eF) {}
      this._onFaces = null;
    }
    if (this._mo) { try { this._mo.disconnect(); } catch (eM) {} this._mo = null; }
    if (this._setT) { clearTimeout(this._setT); this._setT = null; }
    if (this._lpT) { clearTimeout(this._lpT); this._lpT = 0; }
    this._lpAt = null;
    if (this._roQ) {
      try { cancelAnimationFrame(this._roQ); } catch (eQ) {}
      this._roQ = 0;
    }
    this._dirty = null;
    this._bidx = null;
    this._natIdx = null;
    this._nat = null;
    this.undo.length = 0;
    this.redo.length = 0;
    this._undoB = 0;
    this.root.__ed = null;
    this._winA = null;
    this._winB = null;
    this._destroyed = 1;
  };

  var TBL_ALIGN = [
    { k: 'ah:start',  icon: 'fa-align-left',    ar: 'كلُّ الخلايا إلى البداية', en: 'All cells to start' },
    { k: 'ah:center', icon: 'fa-align-center',  ar: 'توسيطُ كلِّ الخلايا',      en: 'Centre all cells' },
    { k: 'ah:end',    icon: 'fa-align-right',   ar: 'كلُّ الخلايا إلى النهاية', en: 'All cells to end' },
    { k: 'av:top',    icon: 'fa-angles-up',     ar: 'كلُّ الخلايا إلى الأعلى',  en: 'All cells to top' },
    { k: 'av:middle', icon: 'fa-bars',          ar: 'توسيطٌ عموديّ',            en: 'Middle vertically' },
    { k: 'av:bottom', icon: 'fa-angles-down',   ar: 'كلُّ الخلايا إلى الأسفل',  en: 'All cells to bottom' }
  ];

  Editor.prototype.cellNode = function () {
    var edn = this.currentEditable();
    return (edn && edn.classList.contains('ne-cell')) ? edn : null;
  };

  /*@3.NOEJ.107*/
  Editor.prototype.setCellAlign = function (axis, val, fallback, all) {
    var td = this.cellNode();
    var node = td ? td.closest('[data-bid]') : null;
    if (!node && fallback) {
      node = this.root.querySelector('[data-bid="' + fallback + '"]');
    }
    if (!node) return false;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit || hit.b.ty !== 'tbl') return false;
    var before = this.snapshot();
    this.readBlock(node);
    var attr = axis === 'v' ? 'data-cva' : 'data-cal';
    var key = axis === 'v' ? 'va' : 'al';
    var cells = (all || !td) ? [].slice.call(node.querySelectorAll('.ne-cell')) : [td];
    var rows = [].slice.call(node.querySelectorAll('tr'));
    cells.forEach(function (c) {
      if (val) c.setAttribute(attr, val); else c.removeAttribute(attr);
      var tr = c.closest('tr');
      var ri = rows.indexOf(tr);
      var ci = [].slice.call(tr.querySelectorAll('.ne-cell')).indexOf(c);
      var cell = hit.b.rows && hit.b.rows[ri] && hit.b.rows[ri][ci];
      if (!cell) return;
      if (val) cell[key] = val; else delete cell[key];
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.tableOp = function (id, op) {
    var hitS = this.blockAt(id);
    var scope = (hitS && hitS.b.csc === 'all');
    if (op.indexOf('ah:') === 0) return this.setCellAlign('h', op.slice(3), id, scope);
    if (op.indexOf('av:') === 0) return this.setCellAlign('v', op.slice(3), id, scope);
    if (op === 'scope') {
      if (!hitS || hitS.b.ty !== 'tbl') return;
      hitS.b.csc = scope ? 'one' : 'all';
      var nodeS = this.root.querySelector('[data-bid="' + id + '"]');
      var btnS = nodeS && nodeS.querySelector('[data-tbl="scope"]');
      if (btnS) {
        btnS.textContent = L(scope ? 'الخليّة' : 'كلُّ الخلايا',
                             scope ? 'This cell' : 'All cells');
        btnS.setAttribute('aria-pressed', scope ? 'false' : 'true');
      }
      this.touch();
      return true;
    }
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'tbl') return;
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var b = hit.b;
    var cols = b.rows[0] ? b.rows[0].length : 2;
    if (op === 'row+') {
      var r = []; for (var i = 0; i < cols; i++) r.push({ rt: [] });
      b.rows.push(r);
    } else if (op === 'row-' && b.rows.length > 1) {
      b.rows.pop();
    } else if (op === 'col+') {
      b.rows.forEach(function (row) { row.push({ rt: [] }); });
    } else if (op === 'col-' && cols > 1) {
      b.rows.forEach(function (row) { row.pop(); });
    } else if (op === 'style') {
      var ST = B().TBL_STYLES;
      var at = ST.indexOf(b.st || 'head');
      b.st = ST[(at + 1) % ST.length];
    } else if (op === 'tone') {
      /*@3.NOEJ.40*/
      var TC = ['', 'violet', 'emerald', 'sky', 'amber', 'rose', 'teal'];
      var ac = TC.indexOf(b.tc || '');
      b.tc = TC[(ac + 1) % TC.length];
    }
    b.cols = b.rows[0] ? b.rows[0].length : 1;
    this.pushUndo(before);
    this.renderOne(id);
    this.touch();
  };

  /*@3.NOEJ.18*/
  document.addEventListener('garden:languageChanged', function () {
    var all = document.querySelectorAll('.ne-root');
    for (var i = 0; i < all.length; i++) {
      var inst = all[i].__ed;
      if (inst) { inst.readAll(); inst.render(); inst.emitState(); }
    }
  });

  window.GardenNotesEditor = { PBV: PBV,
    mount: function (host, doc, opts) { return new Editor(host, doc, opts); },
    hasClip: function () { return clipAny(); },
    MENU: MENU,
    TURN: TURN,
    INSERT: INSERT
  };
})();
