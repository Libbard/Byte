/*@3.PRTJ.1*/
;(function () {
  'use strict';
  if (window.GardenPrintTheme) return;

  /*@3.PRTJ.2*/
  var SETS = {
    /*@3.PRTJ.3*/
    paper: {
      bg: '#ffffff', bg2: '#fbfcfe', card: '#ffffff',
      fg: '#0f172a', fg1: '#334155', fg2: '#64748b', fg3: '#94a3b8', fg4: '#a8b3c2',
      line: '#cbd5e1', line2: '#e8edf3', line3: '#f4f7fa',
      ac: '#0d9488', ac2: '#0f766e', acw: '#99f6e4', acs: '#f1faf5',
      dg: '#be123c', dgl: '#fbd0d7', dgw: '#fff7f8',
      wn: '#b8730a', wnw: '#fdf8ef', lk: '#1273cc', lkw: '#f2f7fd',
      ok: '#0a8f4d', hl: '#fef3c7', code: '#f3f4f6', quote: '#4338ca'
    },
    light: {
      bg: '#ffffff', bg2: '#f8fafc', card: '#ffffff',
      fg: '#0f172a', fg1: '#1e293b', fg2: '#475569', fg3: '#64748b', fg4: '#94a3b8',
      line: '#cbd5e1', line2: '#e2e8f0', line3: '#f1f5f9',
      ac: '#0d9488', ac2: '#0f766e', acw: '#99f6e4', acs: '#ecfdf5',
      dg: '#be123c', dgl: '#fbd0d7', dgw: '#fff1f2',
      wn: '#b45309', wnw: '#fffbeb', lk: '#1d4ed8', lkw: '#eff6ff',
      ok: '#047857', hl: '#fef3c7', code: '#f1f5f9', quote: '#4338ca'
    },
    dim: {
      bg: '#1c2333', bg2: '#222b3d', card: '#232c3e',
      fg: '#eef2f8', fg1: '#dae1ec', fg2: '#aab6c8', fg3: '#8d9ab0', fg4: '#75839a',
      line: '#3d4859', line2: '#333d4e', line3: '#2a3343',
      ac: '#2dd4bf', ac2: '#5eead4', acw: '#115e59', acs: '#17332f',
      dg: '#fb7185', dgl: '#7f1d33', dgw: '#33202a',
      wn: '#fbbf24', wnw: '#33291a', lk: '#7aa2f7', lkw: '#1c2740',
      ok: '#34d399', hl: '#4a3b13', code: '#28313f', quote: '#a5b4fc'
    },
    dark: {
      bg: '#0d131f', bg2: '#131b28', card: '#141d2b',
      fg: '#e9eff8', fg1: '#d3dbe7', fg2: '#a0adc0', fg3: '#8390a5', fg4: '#6b788d',
      line: '#334155', line2: '#26313f', line3: '#1b2431',
      ac: '#2dd4bf', ac2: '#5eead4', acw: '#0f4c47', acs: '#0f2a28',
      dg: '#fb7185', dgl: '#72182c', dgw: '#2a1620',
      wn: '#fbbf24', wnw: '#2c2315', lk: '#7aa2f7', lkw: '#152238',
      ok: '#34d399', hl: '#43360f', code: '#1b2432', quote: '#a5b4fc'
    }
  };

  var MODE_KEY = 'garden_print_theme';

  function siteTheme() {
    var t = '';
    try { t = localStorage.getItem('garden_theme') || ''; } catch (e) {}
    if (!t) t = document.documentElement.getAttribute('data-theme') || 'dark';
    return SETS[t] ? t : 'dark';
  }

  /*@3.PRTJ.4*/
  function resolve(mode) {
    var m = mode || readMode();
    if (m === 'theme') return siteTheme();
    return SETS[m] ? m : 'paper';
  }

  function readMode() {
    var m = '';
    try { m = localStorage.getItem(MODE_KEY) || ''; } catch (e) {}
    return (m === 'theme' || SETS[m]) ? m : 'paper';
  }

  function writeMode(m) {
    try { localStorage.setItem(MODE_KEY, (m === 'theme' || SETS[m]) ? m : 'paper'); } catch (e) {}
  }

  function isDark(mode) {
    var k = resolve(mode);
    return k === 'dark' || k === 'dim';
  }

  /*@3.PRTJ.5*/
  function vars(mode) {
    var s = SETS[resolve(mode)];
    var out = ':root{';
    for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) out += '--pr-' + k + ':' + s[k] + ';';
    out += 'color-scheme:' + (isDark(mode) ? 'dark' : 'light') + '}';
    out += 'html,body{background:var(--pr-bg);color:var(--pr-fg1)}';
    out += '@media print{html,body{background:var(--pr-bg) !important}}';
    return out;
  }

  /*@3.PRTJ.6*/
  function pageRule(mode, sizeCss, marginCss) {
    var size = sizeCss || 'A4 portrait';
    var mar = marginCss || '9mm 10mm';
    if (!isDark(mode)) return '@page{size:' + size + ';margin:' + mar + '}';
    return '@page{size:' + size + ';margin:0}' +
      'body{padding:' + mar + '}' +
      /*@3.PRTJ.7*/
      'html::before{content:"";position:fixed;inset:0;background:var(--pr-bg);z-index:-1}';
  }

  function set(mode) { return SETS[resolve(mode)]; }

  function labels(ar) {
    return [
      { v: 'paper', t: ar ? 'ورقيّ — يوفّر الحبر' : 'Paper — saves ink' },
      { v: 'theme', t: ar ? 'مثلُ ثيمِ الصفحة' : 'Match the page theme' },
      { v: 'light', t: ar ? 'فاتح' : 'Light' },
      { v: 'dim', t: ar ? 'خافت' : 'Dim' },
      { v: 'dark', t: ar ? 'داكن' : 'Dark' }
    ];
  }

  window.GardenPrintTheme = {
    SETS: SETS, MODE_KEY: MODE_KEY, pageRule: pageRule,
    siteTheme: siteTheme, resolve: resolve, isDark: isDark,
    readMode: readMode, writeMode: writeMode,
    vars: vars, set: set, labels: labels
  };
})();
