/*@3.NOBJ.1*/
;(function () {
  'use strict';

  var MARKS = { b: 'b', i: 'i', u: 'u', st: 's', c: 'code', sb: 'sub', sp: 'sup' };

  var uidN = 0;
  function uid(p) {
    uidN += 1;
    return (p || 'b') + Date.now().toString(36) + uidN.toString(36);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /*@3.NOBJ.2*/
  function httpsOnly(u) {
    var s = String(u == null ? '' : u).trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
  }

  /*@3.NOBJ.16*/
  function normUrl(u) {
    var s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s)) return httpsOnly(s);
    if (/^http:\/\//i.test(s)) return httpsOnly('https://' + s.slice(7));
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';
    return httpsOnly('https://' + s);
  }

  /*@3.NOBJ.11*/
  var AR = '؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿';
  var BIDI_RUN = new RegExp('[A-Za-z](?:[^' + AR + '<>&]*[^\\s' + AR + '<>&])?', 'g');

  /*@3.NOBJ.24*/
  var PAIR = { '(': ')', '[': ']', '{': '}',
               '\u00ab': '\u00bb', '\u201c': '\u201d', '\u2039': '\u203a' };
  var SHUT = (function () {
    var m = {}, k;
    for (k in PAIR) if (Object.prototype.hasOwnProperty.call(PAIR, k)) m[PAIR[k]] = k;
    return m;
  })();

  function evenPair(s, open, shut) {
    var d = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === open) d++;
      else if (c === shut) { d--; if (d < 0) return false; }
    }
    return d === 0;
  }

  /*@3.NOBJ.25*/
  var TAIL_PUNCT = ':;,.!?،؛؟…';

  function pairSpan(txt, a, b) {
    var ch;
    while (b > a + 1) {
      ch = txt.charAt(b - 1);
      if (TAIL_PUNCT.indexOf(ch) >= 0) { b--; continue; }
      if (SHUT[ch] && !evenPair(txt.slice(a, b), SHUT[ch], ch)) { b--; continue; }
      if (PAIR[ch] && !evenPair(txt.slice(a, b), ch, PAIR[ch])) { b--; continue; }
      break;
    }
    return [a, b];
  }

  function wrapRuns(txt) {
    BIDI_RUN.lastIndex = 0;
    var out = '', at = 0, m, sp, a, b;
    while ((m = BIDI_RUN.exec(txt)) !== null) {
      sp = pairSpan(txt, m.index, m.index + m[0].length);
      a = sp[0] < at ? at : sp[0];
      b = sp[1];
      if (b <= a) continue;
      out += txt.slice(at, a) + '<bdi>' + txt.slice(a, b) + '</bdi>';
      at = b;
      BIDI_RUN.lastIndex = b;
    }
    return out + txt.slice(at);
  }

  function isolate(html) {
    var out = '', i = 0;
    while (i <= html.length) {
      var lt = html.indexOf('<', i);
      var amp = html.indexOf('&', i);
      var stop = (lt < 0) ? amp : (amp < 0 ? lt : Math.min(lt, amp));
      var chunk = stop < 0 ? html.slice(i) : html.slice(i, stop);
      out += wrapRuns(chunk);
      if (stop < 0) break;
      var end = html.indexOf(html.charAt(stop) === '<' ? '>' : ';', stop);
      if (end < 0) { out += html.slice(stop); break; }
      out += html.slice(stop, end + 1);
      i = end + 1;
    }
    return out;
  }

  /*@3.NOBJ.10*/
  function hexVar(name, v) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(s) ? ' style="' + name + ':' + s + '"' : '';
  }

  function runsToHtml(rt) {
    if (!Array.isArray(rt) || !rt.length) return '';
    return rt.map(function (r) {
      /*@3.NOBJ.8*/
      var txt = esc(r.s == null ? '' : r.s).replace(/\n/g, '<br>');
      if (!txt) return '';
      var open = '', close = '';
      for (var k in MARKS) {
        if (r[k]) { open += '<' + MARKS[k] + '>'; close = '</' + MARKS[k] + '>' + close; }
      }
      /*@3.NOBJ.9*/
      if (r.hl) {
        open += '<mark class="ne-hl" data-hl="' + esc(r.hl) + '"' + hexVar('--ne-hlx', r.hl) + '>';
        close = '</mark>' + close;
      }
      if (r.fg) {
        open += '<span class="ne-fg" data-fg="' + esc(r.fg) + '"' + hexVar('--ne-fgx', r.fg) + '>';
        close = '</span>' + close;
      }
      /*@3.NOBJ.17*/
      if (r.fz) {
        var fzv = Math.max(8, Math.min(96, parseFloat(r.fz) || 0));
        if (fzv) {
          open += '<span class="ne-rz" data-fz="' + fzv + '" style="font-size:' + fzv + 'px">';
          close = '</span>' + close;
        }
      }
      /*@3.NOBJ.15*/
      if (r.ff) {
        var fcss = fontCss(r.ff);
        open += '<span class="ne-rf" data-ff="' + esc(r.ff) + '"' +
                (fcss ? ' style="font-family:&quot;' + esc(fcss) + '&quot;,sans-serif"' : '') + '>';
        close = '</span>' + close;
      }
      /*@3.NOBJ.20*/
      /*@3.NOBJ.26*/
      var body = open + txt + close;
      if (r.lk) {
        var lkv = String(r.lk);
        var lu = (r.lu === 0 || r.lu === '0') ? ' data-lu="0"' : '';
        if (lkv.charAt(0) === '#') {
          return '<a class="ne-xl" href="' + esc(lkv) + '" data-nl="' + esc(lkv) + '"' +
                 lu + '>' + body + '</a>';
        }
        if (/^note:/i.test(lkv) && !/["'<>\s]/.test(lkv)) {
          return '<a class="ne-xl ne-xl--note" href="#" data-nl="' + esc(lkv) + '"' +
                 lu + '>' + body + '</a>';
        }
        var href = httpsOnly(lkv);
        if (href) {
          return '<a href="' + esc(href) + '" target="_blank"' + lu +
                 ' rel="noopener noreferrer nofollow">' + body + '</a>';
        }
      }
      return body;
    }).join('');
  }

  /*@3.NOBJ.12*/
  function runsToHtmlBidi(rt) { return isolate(runsToHtml(rt)); }

  function nodeRuns(node, inherit, out) {
    var st = inherit || {};
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) {
        if (n.nodeValue) out.push(Object.assign({}, st, { s: n.nodeValue }));
        continue;
      }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName.toLowerCase();
      var next = Object.assign({}, st);
      if (tag === 'b' || tag === 'strong') next.b = 1;
      else if (tag === 'i' || tag === 'em') next.i = 1;
      else if (tag === 'u') next.u = 1;
      else if (tag === 's' || tag === 'strike' || tag === 'del') next.st = 1;
      else if (tag === 'code') next.c = 1;
      else if (tag === 'sub') next.sb = 1;
      else if (tag === 'sup') next.sp = 1;
      else if (tag === 'mark') next.hl = n.getAttribute('data-hl') || 'amber';
      else if (tag === 'span' && n.hasAttribute('data-fg')) next.fg = n.getAttribute('data-fg') || '';
      else if (tag === 'span' && n.hasAttribute('data-ff')) next.ff = n.getAttribute('data-ff') || '';
      else if (tag === 'span' && n.hasAttribute('data-fz')) next.fz = parseFloat(n.getAttribute('data-fz')) || 0;
      else if (tag === 'a') {
        /*@3.NOBJ.21*/
        var nl = n.getAttribute('data-nl');
        if (nl) next.lk = nl;
        else { var h = httpsOnly(n.getAttribute('href')); if (h) next.lk = h; }
        if (next.lk && n.getAttribute('data-lu') === '0') next.lu = 0;
      }
      else if (tag === 'br') { out.push(Object.assign({}, st, { s: '\n' })); continue; }
      nodeRuns(n, next, out);
    }
    return out;
  }

  function readRuns(el) {
    var raw = nodeRuns(el, {}, []);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i], last = out[out.length - 1];
      if (r.s) r.s = r.s.replace(/\u200b/g, '');
      if (!r.s) continue;
      if (last && sameMarks(last, r)) { last.s += r.s; continue; }
      out.push(r);
    }
    return out;
  }

  function sameMarks(a, b) {
    return !!a.b === !!b.b && !!a.i === !!b.i && !!a.u === !!b.u &&
           !!a.st === !!b.st && !!a.c === !!b.c &&
           !!a.sb === !!b.sb && !!a.sp === !!b.sp &&
           (a.hl || '') === (b.hl || '') && (a.lk || '') === (b.lk || '') &&
           (a.lu == null ? 1 : a.lu) === (b.lu == null ? 1 : b.lu) &&
           (a.fg || '') === (b.fg || '') && (a.ff || '') === (b.ff || '') &&
           (a.fz || 0) === (b.fz || 0);
  }

  function runsToText(rt) {
    if (!Array.isArray(rt)) return '';
    return rt.map(function (r) { return r.s == null ? '' : r.s; }).join('');
  }

  function runsToMd(rt) {
    var M = window.GardenNotesMd;
    return M ? M.runsToMd(rt) : runsToText(rt);
  }

  function blank(ty, extra) {
    var b = { id: uid(), ty: ty || 'p' };
    if (ty === 'h') b.lv = 2;
    if (ty === 'ul' || ty === 'ol' || ty === 'dl') b.items = [{ rt: [] }];
    else if (ty === 'code') { b.lang = ''; b.src = ''; }
    else if (ty === 'tbl') { b.cols = 2; b.st = 'head'; b.rows = [[{ rt: [] }, { rt: [] }], [{ rt: [] }, { rt: [] }]]; }
    else if (ty === 'math') { b.tex = ''; b.display = 1; }
    else if (ty === 'img') { b.url = ''; b.alt = ''; b.cap = 1; b.iw = 100; b.br = 100; b.op = 100; }
    else if (ty === 'ink') { b.w = 0; b.h = 300; b.ink = ''; b.shapes = null; }
    else if (ty === 'gap') { b.h = 40; }
    else if (ty === 'todo') { b.done = 0; b.rt = []; }
    else if (ty !== 'hr') b.rt = [];
    return Object.assign(b, extra || {});
  }

  /*@3.NOBJ.22*/
  function anchorOf(b) {
    if (!b) return '';
    if (b.anc) return String(b.anc);
    var M = window.GardenNotesMd;
    var t = runsToText(b.rt || []);
    return (M && M.slug) ? M.slug(t) : '';
  }

  /*@3.NOBJ.19*/
  function listHtml(b, runsFn, liAttr) {
    var items = b.items || [];
    var rootOrd = (b.ty === 'ol');
    var out = '', open = [];
    function tagOf(o) { return o ? 'ol' : 'ul'; }
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var lv = Math.max(0, Math.min(5, it.lv || 0));
      var ord = (it.o != null) ? !!it.o : rootOrd;
      while (open.length > lv + 1) { out += '</li></' + tagOf(open.pop()) + '>'; }
      if (!open.length) { out += '<' + tagOf(ord) + '>'; open.push(ord); }
      else if (open.length < lv + 1) { out += '<' + tagOf(ord) + '>'; open.push(ord); }
      else {
        out += '</li>';
        if (open[open.length - 1] !== ord) {
          out += '</' + tagOf(open.pop()) + '><' + tagOf(ord) + '>';
          open.push(ord);
        }
      }
      out += '<li' + (liAttr ? liAttr(it, i) : '') + '>' + runsFn(it.rt);
    }
    while (open.length) { out += '</li></' + tagOf(open.pop()) + '>'; }
    return out;
  }

  /*@3.NOBJ.5*/
  function normalize(doc) {
    var d = (doc && typeof doc === 'object') ? doc : {};
    var blocks = Array.isArray(d.blocks) ? d.blocks : [];
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b || !b.ty) continue;
      if (!b.id) b.id = uid();
      /*@3.NOBJ.7*/
      if (b.ty === 'sticky') { b.ty = 'p'; if (!Array.isArray(b.rt)) b.rt = []; delete b.tone; }
      if (b.ty === 'img') {
        b.url = httpsOnly(b.url);
        /*@3.NOBJ.23*/
        if (b.lk != null) { var lkN = normUrl(b.lk); if (lkN) b.lk = lkN; else delete b.lk; }
      }
      out.push(b);
    }
    if (!out.length) out.push(blank('p'));
    /*@3.NOBJ.6*/
    var doc2 = {};
    for (var k in d) {
      if (Object.prototype.hasOwnProperty.call(d, k)) doc2[k] = d[k];
    }
    doc2.v = 1;
    doc2.blocks = out;
    return doc2;
  }

  /*@3.NOBJ.3*/
  function isEmptyBlock(b) {
    if (!b) return true;
    if (b.ty === 'hr' || b.ty === 'ink') return false;
    if (b.ty === 'gap') return true;
    if (b.ty === 'img') return !b.url;
    if (b.ty === 'code') return !String(b.src || '').trim();
    if (b.ty === 'math') return !String(b.tex || '').trim();
    if (b.ty === 'ul' || b.ty === 'ol' || b.ty === 'dl') {
      return !(b.items || []).some(function (it) { return runsToText(it.rt).trim(); });
    }
    if (b.ty === 'tbl') {
      return !(b.rows || []).some(function (r) {
        return r.some(function (c) { return runsToText(c.rt).trim(); });
      });
    }
    return !runsToText(b.rt).trim();
  }

  function liveBlocks(doc) {
    return normalize(doc).blocks.filter(function (b) { return !isEmptyBlock(b); });
  }

  function toText(doc) {
    return liveBlocks(doc).map(function (b) {
      switch (b.ty) {
        case 'h':     return runsToText(b.rt);
        case 'p':     return runsToText(b.rt);
        case 'quote': return runsToText(b.rt);
        case 'callout': return runsToText(b.rt);
        case 'todo':  return (b.done ? '[x] ' : '[ ] ') + runsToText(b.rt);
        case 'dl':    return (b.items || []).map(function (it) {
          return (it.lv ? ': ' : '') + runsToText(it.rt); }).join('\n');
        case 'ul':    return (b.items || []).map(function (it) { return '- ' + runsToText(it.rt); }).join('\n');
        case 'ol':    return (b.items || []).map(function (it, i) { return (i + 1) + '. ' + runsToText(it.rt); }).join('\n');
        case 'code':  return b.src || '';
        case 'math':  return b.tex || '';
        case 'tbl':   return (b.rows || []).map(function (r) {
                        return r.map(function (c) { return runsToText(c.rt); }).join(' | '); }).join('\n');
        case 'img':   return b.alt ? '[' + b.alt + ']' : '[image]';
        case 'ink':   return '[drawing]';
        case 'hr':    return '---';
        default:      return '';
      }
    }).filter(function (x) { return x !== ''; }).join('\n\n');
  }

  function toMarkdown(doc) {
    var M = window.GardenNotesMd;
    return M ? M.toMarkdown(doc) : toText(doc);
  }

  var TONES = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky',
               'lime', 'orange', 'red', 'pink', 'teal', 'indigo'];


  /*@3.NOBJ.18*/
  function mdInline(text) {
    var M = window.GardenNotesMd;
    return M ? M.inline(text) : [{ s: String(text == null ? '' : text) }];
  }

  function looksMarkdown(text) {
    var M = window.GardenNotesMd;
    return M ? M.looksMarkdown(text) : false;
  }

  function fromMarkdown(text) {
    var M = window.GardenNotesMd;
    if (M) return M.parse(text);
    return [blank('p', { rt: [{ s: String(text == null ? '' : text) }] })];
  }

  var DIRS = ['auto', 'rtl', 'ltr'];
  var ALIGNS = ['start', 'center', 'end', 'justify'];
  var TBL_STYLES = ['head', 'lines', 'stripe', 'plain'];

  /*@3.NOBJ.13*/
  var FONT_HEAD = [
    { id: 'thmanyah', css: 'Thmanyah Sans', star: 1, ar: 'ثمانية',  en: 'Thmanyah Sans' },
    { id: 'cairo',    css: 'Cairo',         star: 1, ar: 'القاهرة', en: 'Cairo' }
  ];
  var FONT_DEFAULT = 'thmanyah';

  function fontCatalog() {
    var out = FONT_HEAD.slice();
    var seen = { thmanyah: 1, cairo: 1 };
    try {
      var M = window.GardenModuleTheme;
      [(M && M.FONTS) || [], (M && M.FONTS_LAT) || []].forEach(function (list) {
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          if (!f || !f.id || !f.css || seen[f.id]) continue;
          seen[f.id] = 1;
          out.push(f);
        }
      });
    } catch (e) {}
    return out;
  }

  function fontCss(id) {
    if (!id) return null;
    var all = fontCatalog();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i].css;
    return null;
  }

  window.GardenNotesBlocks = {
    TONES: TONES,
    DIRS: DIRS,
    ALIGNS: ALIGNS,
    FONT_DEFAULT: FONT_DEFAULT,
    fontCatalog: fontCatalog,
    fontCss: fontCss,
    fromMarkdown: fromMarkdown,
    looksMarkdown: looksMarkdown,
    mdInline: mdInline,
    TBL_STYLES: TBL_STYLES,
    isEmptyBlock: isEmptyBlock,
    liveBlocks: liveBlocks,
    uid: uid,
    blank: blank,
    normalize: normalize,
    runsToHtml: runsToHtml,
    runsToHtmlBidi: runsToHtmlBidi,
    readRuns: readRuns,
    runsToText: runsToText,
    runsToMd: runsToMd,
    listHtml: listHtml,
    anchorOf: anchorOf,
    httpsOnly: httpsOnly,
    normUrl: normUrl,
    esc: esc,
    toText: toText,
    toMarkdown: toMarkdown,
    sameRun: sameMarks,
    MARKS: MARKS
  };
})();
