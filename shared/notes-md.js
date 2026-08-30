/*@3.NOMJ3.25*/
;(function () {
  'use strict';

  function B() { return window.GardenNotesBlocks; }
  function blank(ty, ex) { return B().blank(ty, ex); }

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') !== 'en'; }
    catch (e) { return true; }
  }

  function extUrl(u) {
    var s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s)) return B().httpsOnly(s);
    if (/^http:\/\//i.test(s)) return B().httpsOnly('https://' + s.slice(7));
    if (/^(mailto|tel):/i.test(s)) return /["'<>\s]/.test(s) ? '' : s;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(s)) return '';
    return '';
  }

  function slug(s) {
    return String(s == null ? '' : s)
      .trim().toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[^\p{L}\p{N}\s\-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/\-+/g, '-')
      .replace(/^\-|\-$/g, '');
  }

  function anyUrl(u) {
    var s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (s.charAt(0) === '#') { var g = slug(s.slice(1)); return g ? '#' + g : ''; }
    if (/^note:/i.test(s)) return /["'<>\s]/.test(s) ? '' : s;
    return extUrl(s);
  }

  function frontMatter(lines) {
    var out = { title: '', tags: [], at: 0 };
    if (lines[0] == null || !/^---\s*$/.test(lines[0])) return out;
    var i = 1;
    while (i < lines.length && !/^(---|\.\.\.)\s*$/.test(lines[i])) i++;
    if (i >= lines.length) return out;
    for (var k = 1; k < i; k++) {
      var m = lines[k].match(/^([A-Za-z_][\w\-]*)\s*:\s*(.*)$/);
      if (!m) continue;
      var key = m[1].toLowerCase(), val = m[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'title') out.title = val;
      else if (key === 'tags' || key === 'keywords') {
        out.tags = val.replace(/^\[|\]$/g, '').split(/[,،]/)
          .map(function (t) { return t.trim().replace(/^["']|["']$/g, ''); })
          .filter(Boolean);
      }
    }
    out.at = i + 1;
    return out;
  }

  /*@3.NOMJ3.33*/
  var FNUM = {}, FSEQ = 0, FPEND = '', FPENDL = [], FBACK = {};

  function harvest(lines) {
    var refs = {}, foot = {}, keep = [], i = 0;
    while (i < lines.length) {
      var ln = lines[i];
      var fd = ln.match(/^ {0,3}\[\^([^\]]+)\]:\s*(.*)$/);
      if (fd) {
        var body = [fd[2]];
        i++;
        while (i < lines.length && /^ {4,}\S/.test(lines[i])) {
          body.push(lines[i].replace(/^ {4}/, '')); i++;
        }
        foot[fd[1].toLowerCase()] = body.join('\n').trim();
        continue;
      }
      var rd = ln.match(/^ {0,3}\[([^\^\]][^\]]*)\]:\s*(\S+)(?:\s+["'(](.*)["')])?\s*$/);
      if (rd) { refs[rd[1].toLowerCase().trim()] = { u: rd[2], t: rd[3] || '' }; i++; continue; }
      keep.push(ln); i++;
    }
    return { lines: keep, refs: refs, foot: foot };
  }

  var BARE = /^(?:https?:\/\/|www\.)[^\s<>"'`)\]]+[^\s<>"'`)\].,;:!?؟]/i;

  var HTML_MARK = {
    b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 'st', del: 'st',
    strike: 'st', mark: 'hl', code: 'c', sub: 'sb', sup: 'sp'
  };

  function push(out, s, st) {
    if (!s) return;
    var last = out[out.length - 1];
    var probe = Object.assign({ s: '' }, st || {});
    if (last && B().sameRun(last, probe) && !!last.mth === !!probe.mth) { last.s += s; return; }
    out.push(Object.assign({ s: s }, st || {}));
  }

  function delimAt(s, i) {
    var c = s.charAt(i);
    if (c === '`') { var n = 0; while (s.charAt(i + n) === '`') n++; return { k: 'c', n: n, ch: c }; }
    if (c === '=' && s.charAt(i + 1) === '=') return { k: 'hl', n: 2, ch: c };
    if (c === '~' && s.charAt(i + 1) === '~') return { k: 'st', n: 2, ch: c };
    /*@3.NOMJ3.37*/
    if (c === '~') return { k: 'sb', n: 1, ch: c };
    if (c === '^') return { k: 'sp', n: 1, ch: c };
    if (c === '*' || c === '_') {
      var m = 0; while (s.charAt(i + m) === c) m++;
      if (m > 3) m = 3;
      return { k: (m >= 3 ? 'bi' : (m === 2 ? 'b' : 'i')), n: m, ch: c };
    }
    return null;
  }

  /*@3.NOMJ3.1*/
  function intraWord(s, i, ch) {
    if (ch !== '_') return false;
    var before = i > 0 ? s.charAt(i - 1) : '';
    return /[\p{L}\p{N}]/u.test(before);
  }

  function matchBracket(s, at) {
    var depth = 0;
    for (var i = at; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '\\') { i++; continue; }
      if (c === '[') depth++;
      else if (c === ']') { depth--; if (!depth) return i; }
    }
    return -1;
  }

  function matchParen(s, at) {
    var depth = 0;
    for (var i = at; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '\\') { i++; continue; }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (!depth) return i; }
    }
    return -1;
  }

  function inline(text, ctx) {
    var s = String(text == null ? '' : text);
    var out = [], i = 0, buf = '';
    var refs = (ctx && ctx.refs) || {}, foot = (ctx && ctx.foot) || {};
    var st = (ctx && ctx.st) || {};
    function flush() { if (buf) { push(out, buf, st); buf = ''; } }

    while (i < s.length) {
      var ch = s.charAt(i);

      if (ch === '\\' && i + 1 < s.length) {
        if (s.charAt(i + 1) === '\n') { flush(); push(out, '\n', st); i += 2; continue; }
        buf += s.charAt(i + 1); i += 2; continue;
      }

      /*@3.NOMJ3.2*/
      if (ch === ' ' && /^ {2,}\n/.test(s.slice(i))) {
        flush(); push(out, '\n', st); i = s.indexOf('\n', i) + 1; continue;
      }

      /*@3.NOMJ3.3*/
      var tag = s.slice(i).match(/^<(\/?)(b|strong|i|em|u|s|del|strike|mark|code|sub|sup|br)\s*\/?>/i);
      if (tag) {
        var nm = tag[2].toLowerCase();
        if (nm === 'br') { flush(); push(out, '\n', st); i += tag[0].length; continue; }
        var key = HTML_MARK[nm];
        flush();
        var nextSt = Object.assign({}, st);
        if (tag[1]) delete nextSt[key];
        else nextSt[key] = (key === 'hl') ? 'amber' : 1;
        var rest = inline(s.slice(i + tag[0].length), { refs: refs, foot: foot, st: nextSt });
        for (var q = 0; q < rest.length; q++) out.push(rest[q]);
        return out.filter(function (r) { return r.s; });
      }

      /*@3.NOMJ3.4*/
      var auto = s.slice(i).match(/^<((?:https?:\/\/|mailto:)[^>\s]+)>/i);
      if (auto) {
        var au = extUrl(auto[1]);
        flush();
        push(out, auto[1].replace(/^mailto:/i, ''), au ? Object.assign({}, st, { lk: au }) : st);
        i += auto[0].length; continue;
      }

      /*@3.NOMJ3.31*/
      if (ch === '<' && s.slice(i, i + 4) === '<!--') {
        var ce = s.indexOf('-->', i + 4);
        flush();
        i = ce < 0 ? s.length : ce + 3;
        continue;
      }

      /*@3.NOMJ3.5*/
      if (ch === '<' && /^<\/?[a-z][^<>]*>/i.test(s.slice(i))) {
        i += s.slice(i).match(/^<\/?[a-z][^<>]*>/i)[0].length; continue;
      }

      /*@3.NOMJ3.42*/
      if (ch === ':') {
        var EM = window.GardenNotesEmoji;
        var sc = EM ? s.slice(i).match(EM.RE) : null;
        var hit = sc ? EM.get(sc[1]) : '';
        if (hit) { buf += hit; i += sc[0].length; continue; }
      }

      /*@3.NOMJ3.6*/
      var fr = s.slice(i).match(/^\[\^([^\]]+)\]/);
      if (fr && foot[fr[1].toLowerCase()] != null) {
        /*@3.NOMJ3.34*/
        var flab = fr[1].toLowerCase();
        if (!FNUM[flab]) FNUM[flab] = ++FSEQ;
        if (!FPEND) FPEND = slug('fnref-' + flab);
        if (FPENDL.indexOf(flab) < 0) FPENDL.push(flab);
        flush();
        push(out, '\u2066[' + FNUM[flab] + ']\u2069',
             Object.assign({}, st, { lk: '#' + slug('fn-' + flab) }));
        i += fr[0].length; continue;
      }

      /*@3.NOMJ3.7*/
      if (s.substr(i, 2) === '[[') {
        var wc = s.indexOf(']]', i + 2);
        if (wc > i) {
          var parts = s.slice(i + 2, wc).split('|');
          var target = parts[0].trim();
          var label = (parts[1] != null ? parts[1] : parts[0]).trim();
          flush();
          push(out, label, Object.assign({}, st, { lk: 'note:?t=' + encodeURIComponent(target) }));
          i = wc + 2; continue;
        }
      }

      /*@3.NOMJ3.8*/
      if (ch === '[' || (ch === '!' && s.charAt(i + 1) === '[')) {
        var img = (ch === '!');
        var open = i + (img ? 2 : 1);
        var close = matchBracket(s, open - 1);
        if (close > 0) {
          var label2 = s.slice(open, close);
          /*@3.NOMJ3.18*/
          var gap = (s.charAt(close + 1) === ' ' && s.charAt(close + 2) === '[') ? 1 : 0;
          var after = s.charAt(close + 1 + gap);
          var href = null, end = -1;
          if (after === '(') {
            var p = matchParen(s, close + 1);
            if (p > 0) {
              var rawUrl = s.slice(close + 2, p).trim().replace(/\s+["'(][\s\S]*$/, '');
              href = img ? extUrl(rawUrl) : anyUrl(rawUrl);
              end = p + 1;
            }
          } else if (after === '[') {
            var rc = s.indexOf(']', close + 2 + gap);
            if (rc > 0) {
              var kk = (s.slice(close + 2 + gap, rc) || label2).toLowerCase().trim();
              if (refs[kk]) { href = anyUrl(refs[kk].u); end = rc + 1; }
            }
          } else if (refs[label2.toLowerCase().trim()]) {
            href = anyUrl(refs[label2.toLowerCase().trim()].u);
            end = close + 1;
          }
          if (href && end > 0) {
            flush();
            var kids = inline(label2 || href, { refs: refs, foot: foot,
                                                st: Object.assign({}, st, { lk: href }) });
            for (var d = 0; d < kids.length; d++) out.push(kids[d]);
            i = end; continue;
          }
        }
      }

      /*@3.NOMJ3.9*/
      if (ch === '$' && s.charAt(i + 1) !== '$' && i + 1 < s.length) {
        var mEnd = s.indexOf('$', i + 1);
        if (mEnd > i + 1 && !/[\s\d]/.test(s.charAt(i + 1)) && s.charAt(mEnd - 1) !== ' ') {
          flush();
          push(out, s.slice(i + 1, mEnd), Object.assign({}, st, { c: 1, mth: 1 }));
          i = mEnd + 1; continue;
        }
      }

      /*@3.NOMJ3.10*/
      if ((ch === 'h' || ch === 'w' || ch === 'H' || ch === 'W') &&
          (i === 0 || /[\s(\[؀-ۿ]/.test(s.charAt(i - 1)))) {
        var bare = s.slice(i).match(BARE);
        if (bare) {
          var bu = extUrl(bare[0]);
          if (bu) {
            flush();
            push(out, bare[0], Object.assign({}, st, { lk: bu }));
            i += bare[0].length; continue;
          }
        }
      }

      var d0 = delimAt(s, i);
      if (d0 && !intraWord(s, i, d0.ch)) {
        var mark = s.substr(i, d0.n);
        var stop = -1, j = i + d0.n;
        if (d0.k === 'c') {
          while (j < s.length) {
            if (s.charAt(j) === '`') {
              var run = 0; while (s.charAt(j + run) === '`') run++;
              if (run === d0.n) { stop = j; break; }
              j += run; continue;
            }
            j++;
          }
        } else {
          while (j < s.length) {
            if (s.charAt(j) === '\\') { j += 2; continue; }
            if (s.substr(j, d0.n) === mark && j > i + d0.n &&
                !/\s/.test(s.charAt(j - 1)) &&
                !(d0.ch === '_' && /[\p{L}\p{N}]/u.test(s.charAt(j + d0.n) || ''))) {
              stop = j; break;
            }
            j++;
          }
        }
        if (stop > 0 && (d0.k !== 'sb' && d0.k !== 'sp' ||
                        !/(^|[^\\])\s/.test(s.slice(i + d0.n, stop)))) {
          flush();
          var body2 = s.slice(i + d0.n, stop);
          if (d0.k === 'c') {
            push(out, body2.replace(/^ | $/g, ''), Object.assign({}, st, { c: 1 }));
          } else {
            var nx = Object.assign({}, st);
            if (d0.k === 'bi') { nx.b = 1; nx.i = 1; }
            else if (d0.k === 'hl') nx.hl = 'amber';
            else nx[d0.k] = 1;
            var kids2 = inline(body2, { refs: refs, foot: foot, st: nx });
            for (var e = 0; e < kids2.length; e++) out.push(kids2[e]);
          }
          i = stop + d0.n; continue;
        }
      }

      buf += ch;
      i++;
    }
    flush();
    return out.filter(function (r) { return r.s; });
  }

  var ALERT = {
    note: { ar: 'ملاحظة', en: 'Note' }, tip: { ar: 'فائدة', en: 'Tip' },
    important: { ar: 'مهمّ', en: 'Important' }, warning: { ar: 'تحذير', en: 'Warning' },
    caution: { ar: 'تنبيه', en: 'Caution' }
  };

  var HTML_BLOCK = /^ {0,3}<\/?(div|p|section|article|table|thead|tbody|tr|td|th|ul|ol|li|h[1-6]|pre|blockquote|details|summary|figure|figcaption|span|center|font)\b/i;

  var ALIGN_CLS = {
    center: 'center', centre: 'center', middle: 'center',
    start: 'start', end: 'end', justify: 'justify'
  };

  /*@3.NOMJ3.26*/
  function takeAnchor(line, hold) {
    var t = String(line == null ? '' : line);
    var got = '';
    t = t.replace(/<a\s+(?:name|id)\s*=\s*["']?([^"'>\s]+)["']?[^>]*>\s*(?:<\/a>)?/gi,
      function (all, id) { if (!got) got = id; return ''; });
    /*@3.NOMJ3.39*/
    t = t.replace(/\s*\{([#.][^}]*)\}\s*$/, function (all, body) {
      var toks = String(body).split(/\s+/), q;
      for (q = 0; q < toks.length; q++) {
        var tk = toks[q];
        if (tk.charAt(0) === '#') { if (!got) got = tk.slice(1); }
        else if (tk.charAt(0) === '.' && hold) {
          var cls = tk.slice(1).toLowerCase();
          if (ALIGN_CLS[cls]) hold.al = ALIGN_CLS[cls];
        }
      }
      return '';
    });
    if (got && hold) hold.a = slug(got);
    return t;
  }

  function indentOf(ln) {
    var n = 0;
    for (var i = 0; i < ln.length; i++) {
      if (ln.charAt(i) === ' ') n++;
      else if (ln.charAt(i) === '\t') n += 4;
      else break;
    }
    return n;
  }

  function isBreak(t) { return /^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(t); }
  function fenceAt(t) { return t.match(/^ {0,3}(`{3,}|~{3,})\s*([^`]*)$/); }
  /*@3.NOMJ3.46*/
  var CAL_ALIAS = {
    note: 'note', info: 'note', abstract: 'note', summary: 'note',
    tip: 'tip', hint: 'tip', success: 'tip', check: 'tip',
    important: 'important', question: 'important', example: 'important',
    warning: 'warning', warn: 'warning', attention: 'warning',
    caution: 'caution', danger: 'caution', error: 'caution', bug: 'caution'
  };
  function dirAt(t) { return t.match(/^ {0,3}(:{3,})[ 	]*(.*)$/); }
  function dirKind(info) {
    var s0 = String(info || '').trim();
    if (!s0) return '';
    var w = s0.match(/^\{?\.?([A-Za-z]+)/);
    if (!w) return '';
    return CAL_ALIAS[w[1].toLowerCase()] || '';
  }
  function bulletAt(t) { return t.match(/^ {0,9}([\-*+])[ \t]+(.*)$/); }
  function defAt(t) {
    var m = String(t == null ? '' : t).match(/^ {0,3}:[ \t]+(.*)$/);
    return m ? m[1] : null;
  }
  function numberAt(t) { return t.match(/^ {0,9}(\d{1,9})([.)])[ \t]+(.*)$/); }
  function tableSep(t) { return !!t && /\|/.test(t) && /^ {0,3}\|?[\s:|\-]*\-[\s:|\-]*\|?\s*$/.test(t); }

  function cells(line) {
    var t = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
    var out = [], cur = '', i;
    for (i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      if (c === '\\' && t.charAt(i + 1) === '|') { cur += '|'; i++; continue; }
      if (c === '|') { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }

  function aligns(line) {
    return cells(line).map(function (c) {
      var t = c.trim();
      if (/^:\-+:$/.test(t)) return 'center';
      if (/^:\-+$/.test(t)) return 'start';
      if (/^\-+:$/.test(t)) return 'end';
      return null;
    });
  }

  function parseBlocks(lines, ctx, base) {
    var out = [], i = 0;
    var ind = base || 0;
    /*@3.NOMJ3.27*/
    var pendAnc = '';
    function add(b) {
      if (pendAnc && b && !b.anc) { b.anc = pendAnc; pendAnc = ''; }
      /*@3.NOMJ3.35*/
      if (FPEND && b && !b.anc) { b.anc = FPEND; }
      if (FPENDL.length) {
        for (var fb = 0; fb < FPENDL.length; fb++) {
          if (b && b.anc) FBACK[FPENDL[fb]] = b.anc;
        }
        FPENDL = [];
      }
      FPEND = '';
      out.push(b);
      return b;
    }

    while (i < lines.length) {
      var raw = lines[i];
      var t = raw.trim();

      if (!t) { i++; continue; }

      var f = fenceAt(t);
      if (f) {
        var mark = f[1].charAt(0), len = f[1].length;
        var lang = (f[2] || '').trim().split(/\s+/)[0].toLowerCase().replace(/[^\w+#.\-]/g, '');
        var src = [], strip = indentOf(raw);
        var closer = new RegExp('^\\' + mark + '{' + len + ',}\\s*$');
        i++;
        while (i < lines.length && !closer.test(lines[i].trim())) {
          src.push(lines[i].slice(Math.min(strip, indentOf(lines[i])))); i++;
        }
        i++;
        var cbk = blank('code', { lang: lang, src: src.join('\n') });
        /*@3.NOMJ3.44*/
        var CC = window.GardenNotesCode;
        if (CC && CC.isMermaid ? CC.isMermaid(lang)
                               : /^(mermaid|mmd)$/i.test(String(lang || '').trim())) cbk.dgm = 1;
        add(cbk);
        continue;
      }

      var dm = dirAt(t);
      if (dm && dm[2]) {
        var dlen = dm[1].length, depth = 1, body = [];
        i++;
        while (i < lines.length) {
          var dt = lines[i].trim();
          var dn = dirAt(dt);
          if (dn && dn[1].length >= dlen) {
            if (!dn[2]) { depth--; if (!depth) { i++; break; } }
            else depth++;
          }
          body.push(lines[i]); i++;
        }
        var dkind = dirKind(dm[2]);
        var dinner = parseBlocks(body, ctx, 0);
        for (var dz = 0; dz < dinner.length; dz++) {
          var db = dinner[dz];
          if (dkind && db.ty === 'p') { db.ty = 'callout'; db.cal = dkind; }
          add(db);
        }
        continue;
      }

      /*@3.NOMJ3.11*/
      var prev = out[out.length - 1];
      if (indentOf(raw) - ind >= 4 && !(prev && prev.ty === 'p' && i > 0 && lines[i - 1].trim())) {
        var isrc = [];
        while (i < lines.length && (!lines[i].trim() || indentOf(lines[i]) - ind >= 4)) {
          isrc.push(lines[i].slice(Math.min(ind + 4, indentOf(lines[i])))); i++;
        }
        while (isrc.length && !isrc[isrc.length - 1].trim()) isrc.pop();
        add(blank('code', { lang: '', src: isrc.join('\n') }));
        continue;
      }

      /*@3.NOMJ3.30*/
      if (t.slice(0, 4) === '<!--') {
        var cEnd = t.indexOf('-->');
        var cTail = '';
        if (cEnd >= 0) { cTail = t.slice(cEnd + 3).trim(); i++; }
        else {
          i++;
          while (i < lines.length && lines[i].indexOf('-->') < 0) i++;
          if (i < lines.length) {
            cTail = lines[i].slice(lines[i].indexOf('-->') + 3).trim();
            i++;
          }
        }
        if (cTail) { lines = lines.slice(0, i).concat([cTail], lines.slice(i)); }
        continue;
      }

      /*@3.NOMJ3.14*/
      if (i + 1 < lines.length && /^ {0,3}(=+|\-+)\s*$/.test(lines[i + 1]) &&
          !/^ {0,3}(=+|\-+)\s*$/.test(raw) && !isBreak(t) &&
          !bulletAt(raw) && !numberAt(raw) && !/^ {0,3}>/.test(raw) && !fenceAt(t) &&
          !/^#{1,6}\s/.test(t) && !/^\$\$/.test(t) && !HTML_BLOCK.test(t)) {
        add(blank('h', { lv: lines[i + 1].trim().charAt(0) === '=' ? 1 : 2, rt: inline(t, ctx) }));
        i += 2;
        continue;
      }

      if (isBreak(t)) { add(blank('hr')); i++; continue; }

      if (/^\$\$/.test(t)) {
        var tex = [];
        if (/\$\$$/.test(t) && t.length > 4) { tex.push(t.slice(2, -2)); i++; }
        else {
          tex.push(t.slice(2)); i++;
          while (i < lines.length && !/\$\$\s*$/.test(lines[i])) { tex.push(lines[i]); i++; }
          if (i < lines.length) { tex.push(lines[i].replace(/\$\$\s*$/, '')); i++; }
        }
        add(blank('math', { tex: tex.join('\n').trim(), display: 1 }));
        continue;
      }

      var h = t.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) {
        /*@3.NOMJ3.28*/
        var hold = { a: '' };
        var htxt = takeAnchor(h[2], hold).trim();
        var hb = blank('h', { lv: h[1].length, rt: inline(htxt, ctx) });
        if (hold.a) hb.anc = hold.a;
        if (hold.al) hb.al = hold.al;
        add(hb);
        i++;
        continue;
      }

      if (/^ {0,3}>/.test(raw)) {
        var qs = [];
        while (i < lines.length) {
          if (/^ {0,3}>/.test(lines[i])) {
            qs.push(lines[i].replace(/^ {0,3}>[ \t]?/, '')); i++;
            continue;
          }
          /*@3.NOMJ3.15*/
          var lz = lines[i], lzt = lz.trim();
          if (!lzt || !qs.length) break;
          if (fenceAt(lzt) || isBreak(lzt) || /^#{1,6}\s/.test(lzt) ||
              bulletAt(lz) || numberAt(lz) || /^\$\$/.test(lzt) || HTML_BLOCK.test(lzt)) break;
          qs.push(lzt); i++;
        }
        var alert = qs.length && qs[0].trim().match(/^\[!(\w+)\]\s*$/);
        var kind = alert ? String(alert[1]).toLowerCase() : '';
        if (alert) qs.shift();
        var inner = parseBlocks(qs, ctx, 0);
        for (var z = 0; z < inner.length; z++) {
          var ib = inner[z];
          if (ib.ty === 'p') {
            ib.ty = (alert && ALERT[kind]) ? 'callout' : 'quote';
            /*@3.NOMJ3.21*/
            /*@3.NOMJ3.45*/
            if (alert && ALERT[kind]) ib.cal = kind;
          }
          add(ib);
        }
        continue;
      }

      if (/\|/.test(t) && tableSep(lines[i + 1])) {
        var al = aligns(lines[i + 1]);
        var rows = [cells(lines[i]).map(function (c) { return { rt: inline(c.trim(), ctx) }; })];
        i += 2;
        while (i < lines.length && lines[i].trim() && /\|/.test(lines[i]) && !tableSep(lines[i])) {
          rows.push(cells(lines[i]).map(function (c) { return { rt: inline(c.trim(), ctx) }; }));
          i++;
        }
        var cols = 0, r;
        for (r = 0; r < rows.length; r++) cols = Math.max(cols, rows[r].length);
        for (r = 0; r < rows.length; r++) {
          while (rows[r].length < cols) rows[r].push({ rt: [] });
          for (var c2 = 0; c2 < cols; c2++) if (al[c2]) rows[r][c2].al = al[c2];
        }
        add(blank('tbl', { cols: cols, st: 'head', rows: rows }));
        continue;
      }

      /*@3.NOMJ3.40*/
      if (t && !defAt(t) && defAt((lines[i + 1] || '').trim()) &&
          !/^#{1,6}\s/.test(t) && !/^ {0,3}>/.test(t) && !isBreak(t) && !fenceAt(t) &&
          !bulletAt(raw) && !numberAt(raw) && !tableSep(lines[i + 1] || '')) {
        var dItems = [];
        while (i < lines.length) {
          var dt = lines[i].trim();
          if (!dt) break;
          var dm = defAt(dt);
          if (dm) dItems.push({ rt: inline(dm, ctx), lv: 1 });
          else if (defAt((lines[i + 1] || '').trim()) &&
                   !bulletAt(lines[i]) && !numberAt(lines[i])) dItems.push({ rt: inline(dt, ctx) });
          else break;
          i++;
        }
        if (dItems.length > 1) { add(blank('dl', { items: dItems })); continue; }
        i -= dItems.length;
      }

      if (bulletAt(raw) || numberAt(raw)) { i = readList(lines, i, out, ctx); continue; }

      var im = t.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)\s*$/);
      if (im) {
        var iu = extUrl(im[2]);
        if (iu) { add(blank('img', { url: iu, alt: im[1] || '' })); i++; continue; }
      }

      /*@3.NOMJ3.48*/
      var iml = t.match(/^\[!\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)\]\(\s*([^)\s]+)[^)]*\)\s*$/);
      if (iml) {
        var ilu = extUrl(iml[2]);
        var ilh = anyUrl(iml[3]);
        if (ilu) {
          add(blank('img', ilh ? { url: ilu, alt: iml[1] || '', lk: ilh }
                                : { url: ilu, alt: iml[1] || '' }));
          i++; continue;
        }
      }

      /*@3.NOMJ3.47*/
      var imr = t.match(/^!\[([^\]]*)\](?:[ ]?\[([^\]]*)\])?\s*$/);
      if (imr) {
        var rk = (imr[2] || imr[1] || '').toLowerCase().trim();
        var rdef = rk && ctx && ctx.refs ? ctx.refs[rk] : null;
        var ru = rdef ? extUrl(rdef.u) : '';
        if (ru) { add(blank('img', { url: ru, alt: imr[1] || '' })); i++; continue; }
      }

      /*@3.NOMJ3.12*/
      if (HTML_BLOCK.test(t)) {
        var htm = [];
        while (i < lines.length && lines[i].trim()) { htm.push(lines[i]); i++; }
        peel(htm.join('\n'), ctx).forEach(add);
        continue;
      }

      /*@3.NOMJ3.29*/
      var pHold = { a: '' };
      var pFirst = takeAnchor(t, pHold).trim();
      if (pHold.a && !pFirst) { pendAnc = pHold.a; i++; continue; }
      var para = [pFirst || t];
      i++;
      while (i < lines.length) {
        var nt = lines[i].trim();
        if (!nt) break;
        if (fenceAt(nt) || isBreak(nt) || /^#{1,6}\s/.test(nt) || /^ {0,3}>/.test(nt) ||
            bulletAt(lines[i]) || numberAt(lines[i]) || /^\$\$/.test(nt) ||
            HTML_BLOCK.test(nt) || /^ {0,3}(=+|\-+)\s*$/.test(nt) ||
            (/\|/.test(nt) && tableSep(lines[i + 1]))) break;
        para.push(lines[i].replace(/^\s+/, '')); i++;
      }
      var pb = blank('p', { rt: inline(para.join('\n'), ctx) });
      if (pHold.a) pb.anc = pHold.a;
      add(pb);
    }

    return out;
  }

  /*@3.NOMJ3.43*/
  function peel(html, ctx) {
    var SAN = window.GardenNotesSanitize;
    if (SAN && SAN.fromHtml) {
      try {
        var got = SAN.fromHtml(String(html));
        if (got && got.length) return got;
      } catch (eH) {}
    }
    return peelFlat(html, ctx);
  }

  function peelFlat(html, ctx) {
    var txt = String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6]|blockquote|section|article)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    var out = [];
    txt.split('\n').forEach(function (ln) {
      var s = ln.trim();
      if (!s) return;
      var bl = bulletAt(s);
      if (bl) out.push(blank('ul', { items: [{ rt: inline(bl[2], ctx) }] }));
      else out.push(blank('p', { rt: inline(s, ctx) }));
    });
    return out;
  }

  /*@3.NOMJ3.13*/
  function readList(lines, start, out, ctx) {
    var i = start;
    var firstNum = numberAt(lines[i]);
    var firstBul = bulletAt(lines[i]);
    var first = firstNum ? 'ol' : 'ul';
    var rootMark = firstNum ? firstNum[2] : firstBul[1];
    var items = [], stack = [{ ind: indentOf(lines[i]), lv: 0 }];
    var anyTodo = false, mixed = false, contentInd = 0;

    function flushItems() {
      if (!items.length) return null;
      var allTodo = anyTodo && items.every(function (x) { return x.dn != null; });
      if (allTodo) {
        for (var k = 0; k < items.length; k++) {
          out.push(blank('todo', { done: items[k].dn ? 1 : 0, rt: items[k].rt }));
        }
      } else {
        for (var m = 0; m < items.length; m++) {
          if (items[m].dn != null) {
            items[m].rt = [{ s: (items[m].dn ? '\u2611 ' : '\u2610 ') }].concat(items[m].rt || []);
            delete items[m].dn;
          }
        }
        var b = blank(first, { items: items });
        if (firstNum && Number(firstNum[1]) !== 1) b.start = Number(firstNum[1]);
        /*@3.NOMJ3.20*/
        b.mk = rootMark;
        if (mixed) b.mx = 1;
        out.push(b);
      }
      items = []; anyTodo = false; mixed = false;
      return true;
    }

    while (i < lines.length) {
      var raw = lines[i];

      if (!raw.trim()) {
        /*@3.NOMJ3.16*/
        var nxt = i + 1;
        while (nxt < lines.length && !lines[nxt].trim()) nxt++;
        if (nxt >= lines.length) break;
        var nInd = indentOf(lines[nxt]);
        var nb = bulletAt(lines[nxt]), nn = numberAt(lines[nxt]);
        if ((nb || nn) && nInd >= stack[0].ind) {
          /*@3.NOMJ3.19*/
          if (nInd === stack[0].ind && (nn ? nn[2] : nb[1]) !== rootMark) break;
          i = nxt; continue;
        }
        if (!items.length || !contentInd || nInd < contentInd) break;
        var body = [];
        i = nxt;
        while (i < lines.length && (!lines[i].trim() || indentOf(lines[i]) >= contentInd)) {
          if (lines[i].trim() && (bulletAt(lines[i]) || numberAt(lines[i])) &&
              indentOf(lines[i]) <= stack[0].ind) break;
          body.push(lines[i].trim() ? lines[i].slice(contentInd) : '');
          i++;
        }
        while (body.length && !body[body.length - 1].trim()) body.pop();
        var kids = parseBlocks(body, ctx, 0);
        if (kids.length === 1 && kids[0].ty === 'p') {
          var tailR = items[items.length - 1].rt || [];
          items[items.length - 1].rt = tailR.concat([{ s: '\n\n' }]).concat(kids[0].rt || []);
        } else {
          flushItems();
          for (var z = 0; z < kids.length; z++) out.push(kids[z]);
        }
        continue;
      }

      var bl = bulletAt(raw), nu = numberAt(raw);
      if (!bl && !nu) {
        var rt2 = raw.trim();
        /*@3.NOMJ3.17*/
        if (items.length && !isBreak(rt2) && !fenceAt(rt2) && !/^#{1,6}\s/.test(rt2) &&
            !/^ {0,3}>/.test(raw) && !HTML_BLOCK.test(rt2)) {
          var tail = items[items.length - 1].rt || [];
          items[items.length - 1].rt = tail.concat([{ s: '\n' }]).concat(inline(rt2, ctx));
          i++;
          continue;
        }
        break;
      }

      var ind = indentOf(raw);
      if (ind < stack[0].ind) break;
      var ord = !!nu;
      var text = (bl ? bl[2] : nu[3]).replace(/\s+$/, '');
      contentInd = raw.length - (bl ? bl[2] : nu[3]).length;

      while (stack.length > 1 && ind < stack[stack.length - 1].ind) stack.pop();
      if (ind > stack[stack.length - 1].ind) {
        stack.push({ ind: ind, lv: Math.min(5, stack[stack.length - 1].lv + 1) });
      }
      var lv = stack[stack.length - 1].lv;

      var td = text.match(/^\[([ xX])\]\s+(.*)$/);
      if (td) anyTodo = true;
      var it = { rt: inline(td ? td[2] : text, ctx) };
      if (lv) it.lv = lv;
      if (td) it.dn = /[xX]/.test(td[1]) ? 1 : 0;
      if (ord !== (first === 'ol')) { it.o = ord ? 1 : 0; mixed = true; }
      items.push(it);
      i++;
    }

    flushItems();
    return i;
  }

  function parse(text) {
    var lines = String(text == null ? '' : text)
      .replace(/\r\n?/g, '\n')
      .replace(/ /g, ' ')
      .split('\n');
    FNUM = {}; FSEQ = 0; FPEND = ''; FPENDL = []; FBACK = {};
    var fm = frontMatter(lines);
    if (fm.at) lines = lines.slice(fm.at);
    var h = harvest(lines);
    var ctx = { refs: h.refs, foot: h.foot };
    var out = parseBlocks(h.lines, ctx, 0);

    var keys = Object.keys(h.foot).filter(function (kk) { return FNUM[kk]; })
      .sort(function (a, b) { return FNUM[a] - FNUM[b]; })
      .concat(Object.keys(h.foot).filter(function (kk) { return !FNUM[kk]; }));
    if (keys.length) {
      out.push(blank('hr'));
      out.push(blank('h', { lv: 3, rt: [{ s: isAr() ? 'الحواشي' : 'Footnotes' }] }));
      for (var k = 0; k < keys.length; k++) {
        /*@3.NOMJ3.36*/
        var fno = FNUM[keys[k]] || (++FSEQ);
        out.push(blank('p', {
          anc: slug('fn-' + keys[k]),
          rt: [{ s: '\u2066[' + fno + ']\u2069 ', b: 1 }]
            .concat(inline(h.foot[keys[k]], ctx))
            .concat(FBACK[keys[k]]
              ? [{ s: ' ' }, { s: '\u2066\u21a9\u2069', lk: '#' + FBACK[keys[k]] }]
              : [])
        }));
      }
    }
    /*@3.NOMJ3.32*/
    if (fm.title) {
      var head0 = out[0], htx = '';
      if (head0 && head0.ty === 'h') {
        htx = (head0.rt || []).map(function (r) { return r.s || ''; }).join('').trim();
      }
      if (htx !== String(fm.title).trim()) {
        out.unshift(blank('h', { lv: 1, rt: [{ s: fm.title }] }));
      }
    }
    if (!out.length) out.push(blank('p'));
    return out;
  }

  function looksMarkdown(text) {
    var s = String(text || '');
    if (!s) return false;
    return /(^|\n) {0,3}#{1,6}\s/.test(s) || /(^|\n) {0,9}[\-*+][ \t]/.test(s) ||
           /(^|\n) {0,9}\d{1,9}[.)][ \t]/.test(s) || /(^|\n) {0,3}>[ \t]?/.test(s) ||
           /(^|\n) {0,3}(```|~~~)/.test(s) || /(^|\n)\s*\|.*\|/.test(s) ||
           /\*\*[^*\n]+\*\*/.test(s) || /__[^_\n]+__/.test(s) ||
           /~~[^~\n]+~~/.test(s) || /==[^=\n]+==/.test(s) ||
           /(^|\n) {0,3}(\-{3,}|\*{3,}|_{3,})\s*$/.test(s) ||
           /!\[[^\]]*\]\(/.test(s) || /\[[^\]]+\]\([^)\s]+\)/.test(s) ||
           /\[\[[^\]]+\]\]/.test(s) || /^---\s*\n[A-Za-z_][\w\-]*\s*:/.test(s);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/([\\`*_\[\]<>])/g, '\\$1');
  }

  function runsToMd(rt) {
    if (!Array.isArray(rt)) return '';
    return rt.map(function (r) {
      var src = r.s == null ? '' : r.s;
      if (!src.trim()) return src;
      var lead = src.match(/^\s*/)[0];
      var tail = src.match(/\s*$/)[0];
      var t = src.slice(lead.length, src.length - tail.length);
      if (r.mth) return lead + '$' + t + '$' + tail;
      if (r.c) t = '`' + t + '`';
      else t = esc(t);
      if (r.b && r.i) t = '***' + t + '***';
      else if (r.b) t = '**' + t + '**';
      else if (r.i) t = '*' + t + '*';
      if (r.u) t = '<u>' + t + '</u>';
      if (r.st) t = '~~' + t + '~~';
      /*@3.NOMJ3.38*/
      if (r.sb) t = '~' + t + '~';
      if (r.sp) t = '^' + t + '^';
      if (r.hl) t = '==' + t + '==';
      if (r.lk) t = '[' + t + '](' + r.lk + ')';
      return lead + t + tail;
    }).join('')
      .replace(/\n{2,}/g, '\u0001')
      .replace(/\n/g, '  \n')
      .replace(/\u0001/g, '\n\n');
  }

  function cellMd(c) {
    return (runsToMd(c.rt) || ' ').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  function tableMd(b) {
    var rows = b.rows || [];
    if (!rows.length) return '';
    var head = rows[0].map(cellMd);
    var sep = rows[0].map(function (c) {
      if (c.al === 'center') return ':---:';
      if (c.al === 'end') return '---:';
      if (c.al === 'start') return ':---';
      return '---';
    });
    var body = rows.slice(1).map(function (r) {
      return '| ' + r.map(cellMd).join(' | ') + ' |';
    });
    return ['| ' + head.join(' | ') + ' |', '| ' + sep.join(' | ') + ' |'].concat(body).join('\n');
  }

  /*@3.NOMJ3.23*/
  function listMd(b, alt) {
    var run = [], start = b.start || 1;
    var bul = (b.mk && '*+-'.indexOf(b.mk) > -1) ? b.mk : (alt ? '*' : '-');
    var dot = (b.mk === ')') ? ')' : (alt && !b.mk ? ')' : '.');
    return (b.items || []).map(function (it) {
      var lv = Math.max(0, Math.min(5, it.lv || 0));
      var ord = (it.o != null) ? !!it.o : (b.ty === 'ol');
      var pad = new Array(lv * 2 + 1).join(' ');
      var mark;
      if (ord) {
        run[lv] = (run[lv] || (lv ? 0 : start - 1)) + 1;
        for (var d = lv + 1; d < run.length; d++) run[d] = 0;
        mark = run[lv] + dot;
      } else mark = bul;
      var cont = pad + new Array(mark.length + 2).join(' ');
      return pad + mark + ' ' + runsToMd(it.rt).replace(/\n/g, '\n' + cont);
    }).join('\n');
  }

  function toMarkdown(doc) {
    var prev = null, alt = false;
    return B().liveBlocks(doc).map(function (b) {
      /*@3.NOMJ3.22*/
      if (b.ty === 'ul' || b.ty === 'ol') {
        alt = (prev === b.ty) ? !alt : false;
        prev = b.ty;
      } else prev = null;
      switch (b.ty) {
        case 'h': {
          /*@3.NOMJ3.41*/
          var at = [];
          if (b.anc) at.push('#' + b.anc);
          if (b.al && b.al !== 'start') at.push('.' + b.al);
          return new Array(Math.min(6, b.lv || 2) + 1).join('#') + ' ' + runsToMd(b.rt) +
                 (at.length ? ' {' + at.join(' ') + '}' : '');
        }
        case 'p':     return runsToMd(b.rt);
        case 'quote': return '> ' + runsToMd(b.rt).replace(/\n/g, '\n> ');
        case 'callout': {
          /*@3.NOMJ3.24*/
          var crt = (b.rt || []).slice();
          if (b.cal && crt.length && crt[0].cl) crt.shift();
          return '> [!' + String(b.cal || 'note').toUpperCase() + ']\n> ' +
                 runsToMd(crt).replace(/\n/g, '\n> ');
        }
        case 'todo':  return '- [' + (b.done ? 'x' : ' ') + '] ' + runsToMd(b.rt);
        case 'dl':    return (b.items || []).map(function (it) {
          return (it.lv ? ': ' : '') + runsToMd(it.rt).replace(/\n/g, ' ');
        }).join('\n');
        case 'ul':
        case 'ol':    return listMd(b, alt);
        case 'code':  return '```' + (b.lang || '') + '\n' + (b.src || '') + '\n```';
        case 'math':  return b.display ? '$$\n' + (b.tex || '') + '\n$$' : '$' + (b.tex || '') + '$';
        case 'tbl':   return tableMd(b);
        case 'img':   return b.url
          ? (b.lk ? '[![' + (b.alt || '') + '](' + b.url + ')](' + b.lk + ')'
                  : '![' + (b.alt || '') + '](' + b.url + ')')
          : '';
        case 'ink':   return '_[drawing]_';
        case 'hr':    return '---';
        default:      return '';
      }
    }).filter(function (x) { return x !== ''; }).join('\n\n');
  }

  window.GardenNotesMd = {
    parse: parse,
    toMarkdown: toMarkdown,
    looksMarkdown: looksMarkdown,
    inline: inline,
    runsToMd: runsToMd,
    slug: slug,
    anyUrl: anyUrl,
    extUrl: extUrl,
    ALERT: ALERT
  };
})();
