/*@3.NOSJ3.1*/
;(function () {
  'use strict';

  var B = function () { return window.GardenNotesBlocks; };

  var INLINE_OK = {
    b: 1, strong: 1, i: 1, em: 1, u: 1, s: 1, strike: 1, del: 1,
    code: 1, mark: 1, a: 1, br: 1, span: 1, sub: 1, sup: 1, font: 1
  };

  var BLOCK_MAP = {
    h1: { ty: 'h', lv: 1 }, h2: { ty: 'h', lv: 2 }, h3: { ty: 'h', lv: 3 },
    h4: { ty: 'h', lv: 4 }, h5: { ty: 'h', lv: 5 }, h6: { ty: 'h', lv: 6 },
    p: { ty: 'p' }, div: { ty: 'p' }, section: { ty: 'p' }, article: { ty: 'p' },
    blockquote: { ty: 'quote' }, pre: { ty: 'code' }, hr: { ty: 'hr' },
    ul: { ty: 'ul' }, ol: { ty: 'ol' }, table: { ty: 'tbl' }, img: { ty: 'img' }
  };

  var BLOCK_SEL = 'p,div,section,article,h1,h2,h3,h4,h5,h6,ul,ol,table,pre,blockquote,hr,img';

  /*@3.NOSJ3.9*/
  function keepBeforeStrip(root) {
    var codes = root.querySelectorAll('pre,code');
    for (var c = 0; c < codes.length; c++) {
      var cls = codes[c].getAttribute('class') || '';
      var m = cls.match(/(?:language|lang|highlight)[-_]([A-Za-z0-9+#.]+)/);
      if (m) {
        var host = codes[c].closest('pre') || codes[c];
        if (!host.getAttribute('data-lang')) host.setAttribute('data-lang', m[1].toLowerCase());
      }
    }
    var lis = root.querySelectorAll('li');
    for (var l = 0; l < lis.length; l++) {
      var box = lis[l].querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]');
      if (box) lis[l].setAttribute('data-done', box.checked || box.hasAttribute('checked') ? '1' : '0');
    }
    var cells = root.querySelectorAll('td,th');
    for (var d = 0; d < cells.length; d++) {
      var st = (cells[d].getAttribute('style') || '') + ' ' + (cells[d].getAttribute('align') || '');
      var a = /center/i.test(st) ? 'center'
            : /right|end/i.test(st) ? 'end'
            : /left|start/i.test(st) ? 'start' : '';
      if (a) cells[d].setAttribute('data-al', a);
    }
    return root;
  }

  function stripDangerous(root) {
    keepBeforeStrip(root);
    var kill = root.querySelectorAll('script,style,link,meta,iframe,object,embed,form,input,button,svg,noscript,template');
    for (var i = kill.length - 1; i >= 0; i--) kill[i].remove();

    var all = root.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var attrs = el.attributes;
      for (var k = attrs.length - 1; k >= 0; k--) {
        var name = attrs[k].name.toLowerCase();
        var keep = false;
        if (el.tagName.toLowerCase() === 'a' && name === 'href') keep = true;
        else if (el.tagName.toLowerCase() === 'img' && (name === 'src' || name === 'alt')) keep = true;
        else if (name === 'data-hl' || name === 'data-nl') keep = true;
        /*@3.NOSJ3.13*/
        else if (name === 'data-lang' || name === 'data-done' || name === 'data-al') keep = true;
        /*@3.NOSJ3.6*/
        else if (el.tagName.toLowerCase() === 'span' &&
                 (name === 'data-fg' || name === 'data-ff' || name === 'data-fz')) keep = true;
        if (!keep) el.removeAttribute(attrs[k].name);
      }
    }
    return root;
  }

  function cellsOf(tr) {
    return [].slice.call(tr.children).filter(function (c) {
      var t = c.tagName.toLowerCase();
      return t === 'td' || t === 'th';
    });
  }

  function fromTable(el) {
    var trs = [].slice.call(el.querySelectorAll('tr'));
    if (!trs.length) return null;
    var rows = trs.map(function (tr) {
      return cellsOf(tr).map(function (c) {
        var cell = { rt: B().readRuns(c) };
        var al = c.getAttribute('data-al');
        if (al) cell.al = al;
        return cell;
      });
    }).filter(function (r) { return r.length; });
    if (!rows.length) return null;
    var cols = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    rows.forEach(function (r) { while (r.length < cols) r.push({ rt: [] }); });
    /*@3.NOSJ3.16*/
    for (var c2 = 0; c2 < cols; c2++) {
      var al = rows[0][c2] && rows[0][c2].al;
      if (!al) continue;
      for (var r2 = 1; r2 < rows.length; r2++) if (!rows[r2][c2].al) rows[r2][c2].al = al;
    }
    return B().blank('tbl', { cols: cols, rows: rows });
  }

  /*@3.NOSJ3.10*/
  function readList(listEl, ord, lv, out) {
    var kids = [].slice.call(listEl.children);
    for (var i = 0; i < kids.length; i++) {
      var li = kids[i];
      if (li.tagName.toLowerCase() !== 'li') continue;
      var subs = [].slice.call(li.children).filter(function (c) {
        var t = c.tagName.toLowerCase();
        return t === 'ul' || t === 'ol';
      });
      var clone = li.cloneNode(true);
      [].slice.call(clone.children).forEach(function (c) {
        var t = c.tagName.toLowerCase();
        if (t === 'ul' || t === 'ol') c.remove();
      });
      var it = { rt: B().readRuns(clone) };
      if (lv) it.lv = Math.min(5, lv);
      var dn = li.getAttribute('data-done');
      if (dn != null) it.dn = dn === '1' ? 1 : 0;
      if (ord !== (listEl.tagName.toLowerCase() === 'ol')) it.o = ord ? 0 : 1;
      out.push(it);
      for (var k = 0; k < subs.length; k++) {
        readList(subs[k], subs[k].tagName.toLowerCase() === 'ol', lv + 1, out);
      }
    }
    return out;
  }

  function walk(node, out) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];

      if (n.nodeType === 3) {
        var txt = n.nodeValue;
        if (txt && txt.trim()) out.push(B().blank('p', { rt: [{ s: txt.replace(/\s+/g, ' ') }] }));
        continue;
      }
      if (n.nodeType !== 1) continue;

      var tag = n.tagName.toLowerCase();

      if (INLINE_OK[tag]) {
        var runs = B().readRuns(n);
        if (runs.length) out.push(B().blank('p', { rt: runs }));
        continue;
      }

      var map = BLOCK_MAP[tag];
      if (!map) { walk(n, out); continue; }

      if (map.ty === 'hr') { out.push(B().blank('hr')); continue; }

      if (map.ty === 'img') {
        var url = B().httpsOnly(n.getAttribute('src'));
        if (url) out.push(B().blank('img', { url: url, alt: n.getAttribute('alt') || '' }));
        continue;
      }

      if (map.ty === 'tbl') {
        var t = fromTable(n);
        if (t) out.push(t);
        continue;
      }

      if (map.ty === 'ul' || map.ty === 'ol') {
        /*@3.NOSJ3.14*/
        var items = [];
        readList(n, map.ty === 'ol', 0, items);
        items = items.filter(function (it) { return B().runsToText(it.rt).trim(); });
        if (!items.length) continue;
        /*@3.NOSJ3.11*/
        if (items.every(function (it) { return it.dn != null; })) {
          items.forEach(function (it) {
            out.push(B().blank('todo', { done: it.dn ? 1 : 0, rt: it.rt }));
          });
          continue;
        }
        items.forEach(function (it) {
          if (it.dn == null) return;
          it.rt = [{ s: it.dn ? '\u2611 ' : '\u2610 ' }].concat(it.rt || []);
          delete it.dn;
        });
        out.push(B().blank(map.ty, { items: items }));
        continue;
      }

      if (map.ty === 'code') {
        var src = n.textContent || '';
        /*@3.NOSJ3.12*/
        var lang = n.getAttribute('data-lang') || '';
        if (!lang) {
          var inner = n.querySelector('code[data-lang]');
          if (inner) lang = inner.getAttribute('data-lang') || '';
        }
        if (src.trim()) out.push(B().blank('code', { src: src.replace(/\s+$/, ''), lang: lang }));
        continue;
      }

      /*@3.NOSJ3.2*/
      if (n.querySelector(BLOCK_SEL)) {
        /*@3.NOSJ3.15*/
        if (map.ty === 'quote') {
          var inner = walk(n, []);
          for (var w = 0; w < inner.length; w++) {
            if (inner[w].ty === 'p') inner[w].ty = 'quote';
            out.push(inner[w]);
          }
          continue;
        }
        walk(n, out);
        continue;
      }

      var rt = B().readRuns(n);
      if (B().runsToText(rt).trim()) {
        out.push(B().blank(map.ty, map.lv ? { rt: rt, lv: map.lv } : { rt: rt }));
      } else {
        walk(n, out);
      }
    }
    return out;
  }

  function fromHtml(html) {
    var doc;
    try { doc = new DOMParser().parseFromString(String(html || ''), 'text/html'); }
    catch (e) { return []; }
    if (!doc || !doc.body) return [];
    stripDangerous(doc.body);
    var blocks = walk(doc.body, []);
    return merge(blocks);
  }

  function merge(blocks) {
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], last = out[out.length - 1];
      if (b.ty === 'p' && last && last.ty === 'p') {
        var lastTxt = B().runsToText(last.rt);
        if (lastTxt && !/\s$/.test(lastTxt)) last.rt.push({ s: ' ' });
        last.rt = last.rt.concat(b.rt);
        continue;
      }
      out.push(b);
    }
    return out;
  }

  /*@3.NOSJ3.8*/
  function mdRuns(s0) {
    var M = window.GardenNotesMd;
    return M ? M.inline(s0) : [{ s: String(s0 == null ? '' : s0) }];
  }

  /*@3.NOSJ3.7*/
  function fromText(text) {
    var M = window.GardenNotesMd;
    if (M) return M.parse(text);
    var t = String(text == null ? '' : text).trim();
    return t ? [B().blank('p', { rt: [{ s: t }] })] : [];
  }

  /*@3.NOSJ3.19*/
  function fromPlain(text) {
    var t = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    var lines = t.split('\n');
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i];
      if (!s.trim()) continue;
      out.push(B().blank('p', { rt: [{ s: s }] }));
    }
    if (!out.length && t.trim()) out.push(B().blank('p', { rt: [{ s: t }] }));
    return out;
  }

  function fromClipboard(dt) {
    if (!dt) return [];
    /*@3.NOSJ3.3*/
    var files = dt.files;
    if (files && files.length) {
      for (var i = 0; i < files.length; i++) {
        if (/^image\//.test(files[i].type)) return { rejectedImage: true, blocks: [] };
      }
    }
    var items = dt.items;
    if (items) {
      for (var j = 0; j < items.length; j++) {
        if (items[j].kind === 'file' && /^image\//.test(items[j].type)) {
          return { rejectedImage: true, blocks: [] };
        }
      }
    }
    var html = dt.getData('text/html');
    var plain = dt.getData('text/plain');
    /*@3.NOSJ3.5*/
    if (html && html.trim()) {
      if (plain && mdish(plain) && styledSoupOnly(html)) {
        return { blocks: fromText(plain) };
      }
      return { blocks: fromHtml(html) };
    }
    return { blocks: fromText(plain) };
  }

  function mdish(txt) {
    return /`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|^#{1,3}\s|^```|^>\s/m.test(String(txt || ''));
  }

  function styledSoupOnly(html) {
    var doc;
    try { doc = new DOMParser().parseFromString(String(html), 'text/html'); }
    catch (e) { return false; }
    if (!doc || !doc.body) return false;
    return !doc.body.querySelector(
      'b,strong,em,i,u,s,del,code,mark,a,h1,h2,h3,h4,h5,h6,li,table,img,blockquote,pre'
    );
  }

  window.GardenNotesSanitize = {
    fromHtml: fromHtml,
    fromText: fromText,
    fromPlain: fromPlain,
    fromClipboard: fromClipboard,
    stripDangerous: stripDangerous
  };
})();
