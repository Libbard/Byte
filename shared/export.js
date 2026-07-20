;(function () {
  'use strict';
   

  function isDark() { return document.documentElement.getAttribute('data-theme') !== 'light'; }
  function pageBg() {
    try {
      var c = getComputedStyle(document.body).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
    } catch (e) {}
    return isDark() ? '#0f1117' : '#ffffff';
  }

  function ensureLibs() {
    return (typeof window.html2canvas === 'function') && window.jspdf && window.jspdf.jsPDF;
  }

   
  var COLOR_PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor'];
  var KEBAB = { backgroundColor: 'background-color', color: 'color', borderTopColor: 'border-top-color', borderRightColor: 'border-right-color', borderBottomColor: 'border-bottom-color', borderLeftColor: 'border-left-color', outlineColor: 'outline-color' };
  function colorToRgba(v) {
    if (!v || v.indexOf('color(') !== 0) return null;
    var m = v.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    var r = Math.round(parseFloat(m[1]) * 255), g = Math.round(parseFloat(m[2]) * 255), b = Math.round(parseFloat(m[3]) * 255);
    var a = (m[4] !== undefined) ? parseFloat(m[4]) : 1;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function neutralizeColorFns(root) {
    var reverts = [];
    var all = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    all.forEach(function (el) {
      var cs;
      try { cs = getComputedStyle(el); } catch (e) { return; }
      COLOR_PROPS.forEach(function (prop) {
        var rgba = colorToRgba(cs[prop]);
        if (rgba) {
          reverts.push([el, KEBAB[prop], el.style.getPropertyValue(KEBAB[prop])]);
          el.style.setProperty(KEBAB[prop], rgba, 'important');
        }
      });
    });
    return reverts;
  }

   
  function neutralizeTextSpacing(root) {
    var reverts = [];
    var all = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    all.forEach(function (el) {
      var cs;
      try { cs = getComputedStyle(el); } catch (e) { return; }
      var ls = cs.letterSpacing;
      if (ls && ls !== 'normal' && parseFloat(ls) !== 0) {
        reverts.push([el, 'letter-spacing', el.style.getPropertyValue('letter-spacing')]);
        el.style.setProperty('letter-spacing', 'normal', 'important');
      }
      var ws = cs.wordSpacing;
      if (ws && ws !== 'normal' && parseFloat(ws) !== 0) {
        reverts.push([el, 'word-spacing', el.style.getPropertyValue('word-spacing')]);
        el.style.setProperty('word-spacing', 'normal', 'important');
      }
    });
    return reverts;
  }

  async function capture(element, opts) {
    opts = opts || {};
    if (typeof window.html2canvas !== 'function') {
      throw new Error('html2canvas غير محمّل');
    }
     
    if (!element || !element.offsetHeight) {
      throw new Error('العنصر غير مرئي — تعذّر الالتقاط');
    }
    var reverts = neutralizeColorFns(element).concat(neutralizeTextSpacing(element));
    try {
      return await window.html2canvas(element, {
        backgroundColor: opts.background || pageBg(),
        scale: opts.scale || 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        onclone: opts.onclone || null
      });
    } finally {
      reverts.forEach(function (r) {
        if (r[2]) r[0].style.setProperty(r[1], r[2]); else r[0].style.removeProperty(r[1]);
      });
    }
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() { return new Date().toISOString().slice(0, 10); }

  async function toPNG(element, filename, opts) {
    var canvas = await capture(element, opts);
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        download(blob, filename || ('Garden_' + stamp() + '.png'));
        resolve(true);
      }, 'image/png');
    });
  }

  async function toPDF(element, filename, opts) {
    opts = opts || {};
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF غير محمّل');
    var canvas = await capture(element, opts);
    var JsPDF = window.jspdf.jsPDF;
    var scale = opts.scale || 2;
    var margin = 16;
    
    var pxToPt = 0.75 / scale;
    var imgWpt = canvas.width * pxToPt;
    var imgHpt = canvas.height * pxToPt;
    var pageW = imgWpt + margin * 2;
    var pageH = imgHpt + margin * 2;
    var JSPDF_MAX = 14000; 

    
    if (pageH <= JSPDF_MAX && pageW <= JSPDF_MAX) {
      var orientation = pageW > pageH ? 'landscape' : 'portrait';
      var pdf = new JsPDF({ orientation: orientation, unit: 'pt', format: [pageW, pageH] });
      
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgWpt, imgHpt);
      pdf.save(filename || ('Garden_' + stamp() + '.pdf'));
      return true;
    }

    
    var pdf2 = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    var pw = pdf2.internal.pageSize.getWidth();
    var ph = pdf2.internal.pageSize.getHeight();
    var contentW = pw - margin * 2;
    var pxPerPt = canvas.width / contentW;
    var pageContentHpx = (ph - margin * 2) * pxPerPt;
    var slice = document.createElement('canvas');
    var sctx = slice.getContext('2d');
    var offset = 0, page = 0;
    while (offset < canvas.height) {
      var h = Math.min(pageContentHpx, canvas.height - offset);
      slice.width = canvas.width; slice.height = h;
      sctx.fillStyle = opts.background || pageBg();
      sctx.fillRect(0, 0, slice.width, slice.height);
      sctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
      if (page > 0) pdf2.addPage();
      pdf2.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentW, h / pxPerPt);
      offset += h; page++;
    }
    pdf2.save(filename || ('Garden_' + stamp() + '.pdf'));
    return true;
  }

  window.Export = { toPNG: toPNG, toPDF: toPDF, capture: capture, ensureLibs: ensureLibs };
})();
