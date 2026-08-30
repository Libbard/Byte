(function () {
  'use strict';

  function L(ar, en) {
    var lang = 'ar';
    try { lang = localStorage.getItem('garden_lang') || 'ar'; } catch (e) {}
    return lang === 'en' ? en : ar;
  }

  /*@3.NOMJ4.1*/
  var _lib = null;
  var _seq = 0;

  /*@3.NOMJ4.9*/
  var TOK = {
    bg: '#e01001', bd: '#e01002', tx: '#e01003', ln: '#e01004',
    lb: '#e01005', cl: '#e01006', cb: '#e01007', alt: '#e01008',
    s1: '#e01011', s2: '#e01012', s3: '#e01013', s4: '#e01014',
    s5: '#e01015', s6: '#e01016', s7: '#e01017', s8: '#e01018',
    s9: '#e01019', s10: '#e01020', s11: '#e01021', s12: '#e01022',
    stx: '#e01023'
  };

  var SERIES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];

  function seriesVars(prefix, from) {
    var out = {}, i;
    for (i = 0; i < 12; i++) out[prefix + (i + from)] = TOK[SERIES[i]];
    return out;
  }

  function palette() {
    var v = {
      background: 'transparent',
      primaryColor: TOK.bg, primaryBorderColor: TOK.bd, primaryTextColor: TOK.tx,
      secondaryColor: TOK.cl, secondaryBorderColor: TOK.cb, secondaryTextColor: TOK.tx,
      tertiaryColor: TOK.alt, tertiaryBorderColor: TOK.cb, tertiaryTextColor: TOK.tx,
      mainBkg: TOK.bg, nodeBorder: TOK.bd, nodeTextColor: TOK.tx,
      lineColor: TOK.ln, textColor: TOK.tx, titleColor: TOK.tx,
      clusterBkg: TOK.cl, clusterBorder: TOK.cb,
      edgeLabelBackground: TOK.lb, labelBoxBkgColor: TOK.lb, labelBoxBorderColor: TOK.bd,
      labelTextColor: TOK.tx, defaultLinkColor: TOK.ln,
      altBackground: TOK.alt, compositeBackground: TOK.cl, compositeBorder: TOK.cb,
      compositeTitleBackground: TOK.cl,
      classText: TOK.tx, attributeBackgroundColorOdd: TOK.bg,
      attributeBackgroundColorEven: TOK.alt,
      actorBkg: TOK.bg, actorBorder: TOK.bd, actorTextColor: TOK.tx, actorLineColor: TOK.ln,
      signalColor: TOK.ln, signalTextColor: TOK.tx,
      noteBkgColor: TOK.alt, noteBorderColor: TOK.cb, noteTextColor: TOK.tx,
      activationBkgColor: TOK.cl, activationBorderColor: TOK.cb,
      sequenceNumberColor: TOK.lb, loopTextColor: TOK.tx,
      taskBkgColor: TOK.bg, taskBorderColor: TOK.bd, taskTextColor: TOK.tx,
      taskTextOutsideColor: TOK.tx, taskTextDarkColor: TOK.tx, taskTextLightColor: TOK.lb,
      activeTaskBkgColor: TOK.s1, activeTaskBorderColor: TOK.bd,
      doneTaskBkgColor: TOK.alt, doneTaskBorderColor: TOK.cb,
      critBkgColor: TOK.s4, critBorderColor: TOK.s4,
      gridColor: TOK.cb, todayLineColor: TOK.s4,
      sectionBkgColor: TOK.cl, sectionBkgColor2: TOK.alt,
      altSectionBkgColor: TOK.alt,
      stateBkg: TOK.bg, stateBorder: TOK.bd, transitionColor: TOK.ln,
      transitionLabelColor: TOK.tx, stateLabelColor: TOK.tx,
      innerEndBackground: TOK.bd, specialStateColor: TOK.tx,
      errorBkgColor: TOK.s4, errorTextColor: TOK.tx,
      fillType0: TOK.s1, fillType1: TOK.s2, fillType2: TOK.s3, fillType3: TOK.s4,
      fillType4: TOK.s5, fillType5: TOK.s6, fillType6: TOK.s7, fillType7: TOK.s8,
      pieTitleTextColor: TOK.tx, pieSectionTextColor: TOK.stx,
      pieLegendTextColor: TOK.tx, pieStrokeColor: TOK.lb, pieOuterStrokeColor: TOK.lb,
      quadrant1Fill: TOK.cl, quadrant2Fill: TOK.alt, quadrant3Fill: TOK.cl,
      quadrant4Fill: TOK.alt, quadrantTitleFill: TOK.tx,
      quadrantPointFill: TOK.s1, quadrantPointTextFill: TOK.tx,
      quadrantXAxisTextFill: TOK.tx, quadrantYAxisTextFill: TOK.tx,
      quadrantInternalBorderStrokeFill: TOK.cb, quadrantExternalBorderStrokeFill: TOK.cb,
      fontSize: '14px'
    };
    var add = [seriesVars('pie', 1), seriesVars('cScale', 0), seriesVars('git', 0)];
    for (var a = 0; a < add.length; a++) {
      for (var k in add[a]) if (Object.prototype.hasOwnProperty.call(add[a], k)) v[k] = add[a][k];
    }
    for (var c = 0; c < 12; c++) {
      v['cScaleLabel' + c] = TOK.stx;
      v['cScaleInv' + c] = TOK.tx;
    }
    return v;
  }

  var NEUTRAL = palette();

  var TOKEN_RE = /#e010([0-9]{2})|rgba?\(\s*224\s*,\s*16\s*,\s*([0-9]{1,3})\s*(?:,[^)]*)?\)/gi;
  /*@3.NOMJ4.7*/
  var VAR_OF = (function () {
    var m = {};
    for (var k in TOK) if (Object.prototype.hasOwnProperty.call(TOK, k)) {
      m[parseInt(TOK[k].slice(5), 16)] = 'var(--nd-' + k + ')';
    }
    return m;
  })();

  function deToken(text) {
    return String(text == null ? '' : text).replace(TOKEN_RE, function (hit, hx, rg) {
      var n = hx != null ? parseInt(hx, 16) : parseInt(rg, 10);
      return VAR_OF[n] || hit;
    });
  }

  function hasToken(v) {
    if (!v) return false;
    TOKEN_RE.lastIndex = 0;
    var hit = TOKEN_RE.test(v);
    TOKEN_RE.lastIndex = 0;
    return hit;
  }

  /*@3.NOMJ4.10*/
  var HARD = {
    '#f5f5f5': 'alt', 'whitesmoke': 'alt', '#eeeeee': 'alt', '#eee': 'alt',
    '#ffffff': 'bg', '#fff': 'bg', 'white': 'bg',
    '#000000': 'tx', '#000': 'tx', 'black': 'tx',
    '#333333': 'tx', '#333': 'tx', '#003163': 'tx',
    '#666666': 'ln', '#666': 'ln', '#999999': 'ln', '#999': 'ln', 'grey': 'ln', 'gray': 'ln',
    '#d3d3d3': 'cb', 'lightgrey': 'cb', 'lightgray': 'cb',
    'darkseagreen': 's2', '#8fbc8f': 's2', '#fff8dc': 's3', 'cornsilk': 's3',
    '#808080': 'ln', '#a9a9a9': 'ln', 'darkgrey': 'ln', 'darkgray': 'ln'
  };
  var HARD_RE = /#[0-9a-f]{3,6}\b|\b(?:whitesmoke|white|black|grey|gray|lightgrey|lightgray|darkgrey|darkgray|darkseagreen|cornsilk)\b/gi;

  /*@3.NOMJ4.21*/
  function deHard(text, forText) {
    return String(text == null ? '' : text).replace(HARD_RE, function (hit) {
      var k = HARD[hit.toLowerCase()];
      if (!k) return hit;
      return 'var(--nd-' + (forText ? 'tx' : k) + ')';
    });
  }

  var PAINT = ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'];

  /*@3.NOMJ4.12*/
  var FREE_RE = /#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/gi;

  /*@3.NOMJ4.13*/
  var MIX = {
    fill: ['26%', 'bg'], stroke: ['62%', 'bd'], color: ['70%', 'tx'],
    'stop-color': ['26%', 'bg'], 'flood-color': ['26%', 'bg'], 'lighting-color': ['26%', 'bg']
  };

  function freeOf(prop, val, forText) {
    if (!val) return val;
    var v = String(val);
    if (v.indexOf('var(') !== -1) return v;
    var mix = forText ? MIX.color : MIX[prop];
    if (!mix) return v;
    return v.replace(FREE_RE, function (hit) {
      return 'color-mix(in oklab, ' + hit + ' ' + mix[0] + ', var(--nd-' + mix[1] + '))';
    });
  }

  var DECL_RE = /(^|[;{\s])(fill|stroke|color|stop-color|flood-color|lighting-color)(\s*:\s*)([^;}]+)/gi;

  function deFree(text, forceText) {
    return String(text == null ? '' : text).replace(DECL_RE, function (hit, lead, prop, sep, val) {
      var p = prop.toLowerCase();
      var forText = !!forceText || p === 'color';
      var body = val, tail = '';
      var imp = /\s*!important\s*$/i.exec(body);
      if (imp) { tail = body.slice(imp.index); body = body.slice(0, imp.index); }
      var fixed = freeOf(p, deHard(body, forText), forText);
      return fixed === body ? hit : (lead + prop + sep + fixed + tail);
    });
  }

  function deTokenSvg(svg) {
    if (!svg) return;
    var styles = svg.querySelectorAll('style'), i;
    for (i = 0; i < styles.length; i++) {
      styles[i].textContent = deFree(deToken(styles[i].textContent));
    }
    var all = svg.querySelectorAll('*'), j, n, p, val;
    for (i = 0; i < all.length; i++) {
      n = all[i];
      var inky = /^(?:text|tspan)$/i.test(String(n.tagName || ''));
      for (j = 0; j < PAINT.length; j++) {
        p = PAINT[j];
        var asText = inky && (p === 'fill' || p === 'color');
        val = n.getAttribute(p);
        if (hasToken(val)) {
          n.removeAttribute(p);
          n.style.setProperty(p, deToken(val));
        } else if (val && HARD[String(val).trim().toLowerCase()]) {
          n.removeAttribute(p);
          n.style.setProperty(p, 'var(--nd-' +
            (asText ? 'tx' : HARD[String(val).trim().toLowerCase()]) + ')');
        } else if (val && FREE_RE.test(val)) {
          FREE_RE.lastIndex = 0;
          n.removeAttribute(p);
          n.style.setProperty(p, freeOf(p, val, asText));
        }
        FREE_RE.lastIndex = 0;
      }
      val = n.getAttribute('style');
      if (val) {
        var fixed = deFree(deToken(val), inky);
        if (fixed !== val) n.setAttribute('style', fixed);
      }
    }
    var inks = svg.querySelectorAll('text, tspan'), q, e2, cur;
    for (q = 0; q < inks.length; q++) {
      e2 = inks[q];
      if (e2.closest && e2.closest('.slice')) continue;
      cur = e2.style.getPropertyValue('fill');
      if (cur && cur.indexOf('var(--nd-') === 0) continue;
      e2.style.setProperty('fill', 'var(--nd-tx)', 'important');
    }
  }

  function baseUrl() {
    var probe = document.querySelector('script[src*="notes-mermaid.js"]') ||
                document.querySelector('script[src*="notes-editor.js"]');
    var src = probe ? (probe.getAttribute('src') || '') : '';
    return { dir: src.replace(/notes-[a-z]+\.js.*$/, ''), v: src.split('?')[1] || '' };
  }

  /*@3.NOMJ4.2*/
  function ensure() {
    if (_lib) return _lib;
    if (window.mermaid) {
      _lib = Promise.resolve(init(window.mermaid));
      return _lib;
    }
    _lib = new Promise(function (res) {
      var b = baseUrl();
      var tag = document.createElement('script');
      tag.src = b.dir + 'vendor/mermaid/mermaid.min.js' + (b.v ? ('?' + b.v) : '');
      tag.onload = function () {
        res(window.mermaid ? init(window.mermaid) : { ok: false, why: 'no-api' });
      };
      tag.onerror = function () { res({ ok: false, why: 'missing' }); };
      document.head.appendChild(tag);
    });
    return _lib;
  }

  /*@3.NOMJ4.3*/
  function themeIsDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'light') return false;
    if (t) return true;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch (e) { return false; }
  }

  function init(m) {
    try {
      /*@3.NOMJ4.6*/
      m.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        /*@3.NOMJ4.8*/
        themeVariables: NEUTRAL,
        fontFamily: '"Thmanyah Sans","Tajawal","Segoe UI",system-ui,sans-serif',
        curve: 'basis',
        htmlLabels: false,
        flowchart: { htmlLabels: false, useMaxWidth: true, padding: 14, nodeSpacing: 46, rankSpacing: 54 },
        class: { htmlLabels: false, useMaxWidth: true },
        er: { useMaxWidth: true },
        sequence: { useMaxWidth: true, actorMargin: 46, boxMargin: 12 },
        state: { useMaxWidth: true },
        pie: { useMaxWidth: true, textPosition: 0.62 },
        gantt: { useMaxWidth: true },
        /*@3.NOMJ4.18*/
        maxEdges: 2000,
        maxTextSize: 300000
      });
      return { ok: true, api: m };
    } catch (e) {
      return { ok: false, why: 'init' };
    }
  }

  /*@3.NOMJ4.15*/
  function tailCut(line) {
    var t = line.replace(/^[\s\t]+/, '');
    if (t.indexOf('%%') === 0) return -1;
    var q = 0, tick = 0, i, c;
    for (i = 0; i + 1 < line.length; i++) {
      c = line.charAt(i);
      if (c === '"' && !tick) { q = q ? 0 : 1; continue; }
      if (c === '`' && !q) { tick = tick ? 0 : 1; continue; }
      if (q || tick) continue;
      if (c === '%' && line.charAt(i + 1) === '%') return i;
    }
    return -1;
  }

  var LINKSTYLE_RE = /^\s*linkStyle\b/;

  function repair(src) {
    var lines = String(src == null ? '' : src).replace(/\r\n?/g, '\n').split('\n');
    var cmt = 0, semi = 0, i, ln, cut;
    for (i = 0; i < lines.length; i++) {
      ln = lines[i];
      cut = tailCut(ln);
      if (cut > 0) { ln = ln.slice(0, cut).replace(/\s+$/, ''); cmt++; }
      if (LINKSTYLE_RE.test(ln) && /;\s*$/.test(ln)) { ln = ln.replace(/;\s*$/, ''); semi++; }
      lines[i] = ln;
    }
    return { src: lines.join('\n'), cmt: cmt, semi: semi };
  }

  /*@3.NOMJ4.20*/
  var MD_LABEL_RE = /"`([^`]*)`"/g;
  var BR_RE = /<br\s*\/?>/gi;

  function dropBr(src) {
    var n = 0;
    var out = src.replace(MD_LABEL_RE, function (hit, inner) {
      if (!BR_RE.test(inner)) { BR_RE.lastIndex = 0; return hit; }
      BR_RE.lastIndex = 0;
      n++;
      return '"' + '`' + inner.replace(BR_RE, ' ') + '`' + '"';
    });
    return { src: out, n: n };
  }

  function dropLinkStyle(src) {
    var lines = src.split('\n'), out = [], n = 0, i;
    for (i = 0; i < lines.length; i++) {
      if (LINKSTYLE_RE.test(lines[i])) { n++; continue; }
      out.push(lines[i]);
    }
    return { src: out.join('\n'), n: n };
  }

  /*@3.NOMJ4.17*/
  function detail(err, code) {
    var msg = String((err && err.message) || err || '');
    var head = msg.split('\n')[0].slice(0, 220);
    var m = /line (\d+)/i.exec(msg);
    if (!m) return head;
    var ln = code.split('\n')[Number(m[1]) - 1];
    if (ln == null) return head;
    return head + '\n' + m[1] + ' │ ' + ln.trim().slice(0, 160);
  }

  function fixedNote(r) {
    var bits = [];
    if (r.cmt) {
      bits.push(L('‏' + r.cmt + ' تعليقاً في ذيل سطر', r.cmt + ' trailing comments'));
    }
    if (r.semi) {
      bits.push(L('‏' + r.semi + ' فاصلةً منقوطةً بعد linkStyle',
                  r.semi + ' semicolons after linkStyle'));
    }
    if (r.br) {
      bits.push(L('‏' + r.br + ' لافتةً فيها <br> داخلَ نصٍّ منسّق',
                  r.br + ' labels with <br> inside formatted text'));
    }
    if (r.dropped) {
      bits.push(L('‏' + r.dropped + ' سطرَ linkStyle تعذّر تطبيقُه',
                  r.dropped + ' linkStyle lines that could not apply'));
    }
    if (!bits.length) return '';
    return L('صُحّح تلقائيّاً: ', 'Auto-fixed: ') + bits.join(' · ');
  }

  function reason(why) {
    if (why === 'missing') {
      return L('محرّكُ المخطّطات غير مثبَّتٍ بعد — الشِفرةُ محفوظةٌ كما هي.',
               'The diagram engine is not installed yet — your code is kept as written.');
    }
    return L('تعذّر تشغيلُ محرّكِ المخطّطات.', 'Could not start the diagram engine.');
  }

  /*@3.NOMJ4.4*/
  /*@3.NOMJ4.14*/
  var BAKE = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
              'stroke-linejoin', 'stroke-opacity', 'fill-opacity', 'opacity', 'color',
              'stop-color', 'stop-opacity', 'flood-color', 'font-family', 'font-size',
              'font-weight', 'font-style', 'text-anchor', 'dominant-baseline',
              'letter-spacing', 'direction', 'display', 'visibility'];

  /*@3.NOMJ4.19*/
  function ndVars(theme) {
    var probe = document.createElement('div');
    probe.setAttribute('data-theme', theme);
    probe.style.cssText = 'position:absolute;inset-block-start:-9999px;visibility:hidden';
    var inner = document.createElement('div');
    inner.className = 'ne-dgm';
    probe.appendChild(inner);
    document.body.appendChild(probe);
    var cs = getComputedStyle(inner), out = {}, k, v;
    for (k in TOK) {
      if (!Object.prototype.hasOwnProperty.call(TOK, k)) continue;
      v = cs.getPropertyValue('--nd-' + k).trim();
      if (v) out['--nd-' + k] = v;
    }
    probe.remove();
    return out;
  }

  function wearTheme(el, theme) {
    if (!el || !theme) return null;
    var now = themeIsDark() ? 'dark' : 'light';
    if (theme === now) return null;
    var vars = ndVars(theme), k, had = {};
    for (k in vars) {
      if (!Object.prototype.hasOwnProperty.call(vars, k)) continue;
      had[k] = el.style.getPropertyValue(k);
      el.style.setProperty(k, vars[k]);
    }
    return had;
  }

  function shedTheme(el, had) {
    if (!el || !had) return;
    for (var k in had) {
      if (!Object.prototype.hasOwnProperty.call(had, k)) continue;
      if (had[k]) el.style.setProperty(k, had[k]);
      else el.style.removeProperty(k);
    }
  }

  function bake(live, w, h, theme) {
    if (!live || !live.cloneNode) return null;
    var win = live.ownerDocument && live.ownerDocument.defaultView;
    if (!win) return null;
    var worn = wearTheme(live, theme);
    try { return bakeNow(live, w, h, win); }
    finally { shedTheme(live, worn); }
  }

  function bakeNow(live, w, h, win) {
    var r = live.getBoundingClientRect();
    var bw = Math.round(w || r.width), bh = Math.round(h || r.height);
    if (bw < 2 || bh < 2) return null;
    var copy;
    try { copy = live.cloneNode(true); } catch (e) { return null; }
    var a = [live].concat([].slice.call(live.querySelectorAll('*')));
    var b = [copy].concat([].slice.call(copy.querySelectorAll('*')));
    if (a.length !== b.length) return null;
    for (var i = 0; i < a.length; i++) {
      if (b[i].tagName && String(b[i].tagName).toLowerCase() === 'style') continue;
      var cs = win.getComputedStyle(a[i]);
      var css = '', k, v;
      for (k = 0; k < BAKE.length; k++) {
        v = cs.getPropertyValue(BAKE[k]);
        if (v) css += BAKE[k] + ':' + v + ';';
      }
      if (css) b[i].setAttribute('style', css);
    }
    var st = copy.querySelectorAll('style'), q;
    for (q = st.length - 1; q >= 0; q--) if (st[q].parentNode) st[q].parentNode.removeChild(st[q]);
    copy.setAttribute('width', String(bw));
    copy.setAttribute('height', String(bh));
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!copy.getAttribute('viewBox')) copy.setAttribute('viewBox', '0 0 ' + bw + ' ' + bh);
    try { return { svg: new XMLSerializer().serializeToString(copy), w: bw, h: bh }; }
    catch (e2) { return null; }
  }

  function paint(host, svg, note) {
    host.setAttribute('data-state', 'ok');
    host.innerHTML = String(svg);
    var el = host.querySelector('svg');
    if (el) {
      deTokenSvg(el);
      el.setAttribute('data-nmd', '1');
      el.removeAttribute('width');
      el.setAttribute('role', 'img');
      if (!el.getAttribute('aria-label')) {
        el.setAttribute('aria-label', L('مخطّط', 'Diagram'));
      }
    }
    if (note) {
      var tag = document.createElement('div');
      tag.className = 'ne-dgm-fix';
      tag.textContent = note;
      host.appendChild(tag);
    }
  }

  /*@3.NOMJ4.16*/
  function render(host, src) {
    if (!host) return Promise.resolve(false);
    var raw = String(src == null ? '' : src).trim();
    host.textContent = '';
    if (!raw) return Promise.resolve(false);
    host.setAttribute('data-state', 'busy');
    return ensure().then(function (lib) {
      if (!lib || !lib.ok) {
        host.setAttribute('data-state', 'off');
        host.textContent = reason(lib && lib.why);
        return false;
      }
      var fix = repair(raw);
      var steps = [{ code: fix.src, cmt: fix.cmt, semi: fix.semi, dropped: 0, br: 0 }];
      var noBr = dropBr(fix.src);
      if (noBr.n) {
        steps.push({ code: noBr.src, cmt: fix.cmt, semi: fix.semi, dropped: 0, br: noBr.n });
      }
      var last = steps[steps.length - 1];
      if (/(^|\n)\s*linkStyle\b/.test(last.code)) {
        var less = dropLinkStyle(last.code);
        if (less.n) {
          steps.push({ code: less.src, cmt: fix.cmt, semi: fix.semi,
                       dropped: less.n, br: last.br });
        }
      }
      var at = 0;
      function attempt() {
        var step = steps[at];
        var id = 'nmd' + (++_seq);
        return Promise.resolve(lib.api.render(id, step.code)).then(function (out) {
          paint(host, (out && out.svg) || out, fixedNote(step));
          return true;
        })['catch'](function (err) {
          at++;
          if (at < steps.length) return attempt();
          /*@3.NOMJ4.5*/
          host.setAttribute('data-state', 'bad');
          host.textContent = L('خطأٌ في وصف المخطّط\n', 'Diagram syntax error\n') +
            detail(err, steps[0].code);
          return false;
        });
      }
      return attempt();
    });
  }

  window.GardenNotesMermaid = { ensure: ensure, render: render, isDark: themeIsDark,
                                bake: bake, repair: repair };
})();
