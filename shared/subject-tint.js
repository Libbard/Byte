/*@3.SUTJ.1*/

;(function () {
  'use strict';

  /*@3.SUTJ.2*/
  var LADDER = [
    ['900',  0.340, 0.517],
    ['800',  0.269, 0.648],
    ['700',  0.178, 0.811],
    ['600',  0.090, 0.959],
    ['500',  0.000, 1.000],
    ['400', -0.087, 0.891],
    ['300', -0.163, 0.617]
  ];
  var SPAN_DN = 0.340, SPAN_UP = 0.163;
  /*@3.SUTJ.3*/
  var L_MIN = 0.50, L_MAX = 0.85;
  /*@3.SUTJ.4*/
  var L_FLOOR = 0.15, L_CEIL = 0.98;

  /*@3.SUTJ.5*/
  function toLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(c) {
    c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    /*@3.SUTJ.6*/
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  }
  function hex2rgb(h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  function rgb2lch(rgb) {
    var r = toLin(rgb[0]), g = toLin(rgb[1]), b = toLin(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: L, C: Math.sqrt(A * A + B * B), h: Math.atan2(B, A) };
  }
  function lch2hex(L, C, h) {
    var A = C * Math.cos(h), B = C * Math.sin(h);
    var l = L + 0.3963377774 * A + 0.2158037573 * B;
    var m = L - 0.1055613458 * A - 0.0638541728 * B;
    var s = L - 0.0894841775 * A - 1.2914855480 * B;
    l = l * l * l; m = m * m * m; s = s * s * s;
    var r = toSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
    var g = toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
    var b = toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
    return { hex: '#' + [r, g, b].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''),
             rgb: [r, g, b] };
  }

  /*@3.SUTJ.7*/
  function scale(hex) {
    var base = rgb2lch(hex2rgb(hex));
    var bL = Math.max(L_MIN, Math.min(L_MAX, base.L));
    /*@3.SUTJ.8*/
    var fDn = Math.min(1, (bL - L_FLOOR) / SPAN_DN);
    var fUp = Math.min(1, (L_CEIL - bL) / SPAN_UP);
    var out = {};
    for (var i = 0; i < LADDER.length; i++) {
      var step = LADDER[i][0], d = LADDER[i][1], cr = LADDER[i][2];
      /*@3.SUTJ.9*/
      if (step === '500') { out[step] = (bL === base.L) ? hex : lch2hex(bL, base.C, base.h).hex; continue; }
      out[step] = lch2hex(bL - d * (d > 0 ? fDn : fUp), base.C * cr, base.h).hex;
    }
    return out;
  }

  function apply(hex) {
    var g = scale(hex);
    var root = document.documentElement, st = root.style;
    for (var k in g) if (g.hasOwnProperty(k)) st.setProperty('--brand-' + k, g[k]);
    var rgb = hex2rgb(hex);
    /*@3.SUTJ.10*/
    st.setProperty('--brand-glow', 'rgba(' + rgb.join(', ') + ', 0.15)');
    /*@3.SUTJ.11*/
    st.setProperty('--course-color', hex);
    root.setAttribute('data-tinted', hex);
    return g;
  }

  function chosen(code) {
    if (!code) return '';
    var raw;
    try { raw = localStorage.getItem('dashboard_prefs'); } catch (e) { return ''; }
    if (!raw || raw.indexOf('courseStyle') < 0) return '';   /*@3.SUTJ.12*/
    var p;
    try { p = JSON.parse(raw); } catch (e) { return ''; }
    var c = p && p.courseStyle && p.courseStyle[code] && p.courseStyle[code].color;
    c = String(c == null ? '' : c).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(c)) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return /^[0-9a-fA-F]{6}$/.test(c) ? '#' + c.toLowerCase() : '';
  }

  /*@3.SUTJ.13*/
  var MT_BASE = {
    paper: 'light', github: 'light', solar: 'light', latte: 'light', everlight: 'light',
    onedark: 'dark', dracula: 'dark', nord: 'dark', gruvbox: 'dark',
    mocha: 'dark', rosepine: 'dark', everforest: 'dark',
    oled: 'dim', tokyo: 'dim', amber: 'dim', nightowl: 'dim', ayu: 'dim', carbon: 'dim'
  };
  var MT_IDS = Object.keys(MT_BASE);

  function readPrefs() {
    try { return JSON.parse(localStorage.getItem('dashboard_prefs') || 'null') || {}; }
    catch (e) { return {}; }
  }
  function siteTheme() {
    try { return localStorage.getItem('garden_theme') || 'dark'; } catch (e) { return 'dark'; }
  }

  function modTheme() {
    var root = document.documentElement, raw;
    try { raw = localStorage.getItem('dashboard_prefs'); } catch (e) { return; }
    var id = '';
    /*@3.SUTJ.14*/
    if (raw && raw.indexOf('moduleTheme') > -1) {
      var p = null;
      try { p = JSON.parse(raw); } catch (e) {}
      id = (p && typeof p.moduleTheme === 'string') ? p.moduleTheme : '';
    }
    var base = MT_BASE[id];
    if (!base) {
      /*@3.SUTJ.15*/
      root.removeAttribute('data-mod-theme');
      return;
    }
    root.setAttribute('data-mod-theme', id);
    if (root.getAttribute('data-theme') !== base) root.setAttribute('data-theme', base);
  }

  /*@3.SUTJ.20*/
  /*@3.SUTJ.21*/
  var MF_AR = {
    plex: 'IBM Plex Sans Arabic', readex: 'Readex Pro', notosans: 'Noto Sans Arabic',
    amiri: 'Amiri', naskh: 'Noto Naskh Arabic', tajawal: 'Tajawal', almarai: 'Almarai',
    alexandria: 'Alexandria', vazir: 'Vazirmatn', kufi: 'Noto Kufi Arabic',
    messiri: 'El Messiri', zain: 'Zain', rubik: 'Rubik',
    /*@3.SUTJ.24*/
    thmanyah: 'Thmanyah Sans', thmanyahserif: 'Thmanyah Serif Text'
  };
  var MF_LAT = {
    sourceserif: 'Source Serif 4', newsreader: 'Newsreader', literata: 'Literata',
    atkinson: 'Atkinson Hyperlegible', merriweather: 'Merriweather', lora: 'Lora',
    garamond: 'EB Garamond', spectral: 'Spectral', fraunces: 'Fraunces',
    plexsans: 'IBM Plex Sans', sourcesans: 'Source Sans 3', geist: 'Geist'
  };

  var _fontBase = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared\/subject-tint\.js(\?.*)?$/, '') : '';
  })();

  function fontSheet() {
    if (document.querySelector('link[data-garden-fonts]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = _fontBase + 'shared/vendor/fonts/garden/garden-fonts.css';
    l.setAttribute('data-garden-fonts', '');
    document.head.appendChild(l);
  }

  function modFont() {
    var root = document.documentElement, raw;
    try { raw = localStorage.getItem('dashboard_prefs'); } catch (e) { return; }
    var p = null;
    if (raw && raw.indexOf('moduleFont') > -1) {
      try { p = JSON.parse(raw); } catch (e) {}
    }
    var ar = (p && MF_AR[p.moduleFont]) || '';
    var lat = (p && MF_LAT[p.moduleFontLat]) || '';
    if (!ar && !lat) {
      root.removeAttribute('data-mod-font');
      root.style.removeProperty('--mt-font');
      return;
    }
    var stack = [];
    if (lat) stack.push('"' + lat + '"');
    if (ar) stack.push('"' + ar + '"');
    /*@3.SUTJ.22*/
    root.style.setProperty('--mt-font', stack.join(', '));
    root.setAttribute('data-mod-font', (lat ? p.moduleFontLat : '-') + '.' + (ar ? p.moduleFont : '-'));
    fontSheet();
  }

  function clearFont(which) {
    var p = readPrefs();
    var k = which === 'lat' ? 'moduleFontLat' : 'moduleFont';
    if (p[k] === undefined) return false;
    delete p[k];
    try { localStorage.setItem('dashboard_prefs', JSON.stringify(p)); } catch (e) {}
    modFont();
    return true;
  }

  /*@3.SUTJ.16*/
  function clearTheme() {
    var p = readPrefs();
    if (p.moduleTheme === undefined) return false;
    delete p.moduleTheme;
    try { localStorage.setItem('dashboard_prefs', JSON.stringify(p)); } catch (e) {}
    document.documentElement.removeAttribute('data-mod-theme');
    document.documentElement.setAttribute('data-theme', siteTheme());
    return true;
  }

  function run() {
    var root = document.documentElement;
    modTheme();
    modFont();
    var code = root.getAttribute('data-subject');
    var hex = chosen(code);
    /*@3.SUTJ.17*/
    if (!hex) { root.removeAttribute('data-tinted'); clear(root); return; }
    apply(hex);
  }

  function clear(root) {
    var st = root.style;
    for (var i = 0; i < LADDER.length; i++) st.removeProperty('--brand-' + LADDER[i][0]);
    st.removeProperty('--brand-glow');
    st.removeProperty('--course-color');
  }

  try { run(); } catch (e) {}

  /*@3.SUTJ.18*/
  try {
    window.addEventListener('storage', function (e) {
      if (e && e.key && e.key !== 'dashboard_prefs') return;
      try { run(); } catch (err) {}
    });
  } catch (e) {}

  /*@3.SUTJ.19*/
  window.GardenTint = {
    scale: scale, apply: apply, chosen: chosen, refresh: run,
    THEMES: MT_IDS, THEME_BASE: MT_BASE, applyTheme: modTheme, clearTheme: clearTheme,
    FONTS: MF_AR, FONTS_LAT: MF_LAT, applyFont: modFont, fontSheet: fontSheet, clearFont: clearFont
  };
})();
