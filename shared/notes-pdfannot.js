/*@3.NOPAJ.1*/
;(function () {
  'use strict';

  var USER = 'Byte';

  function rgb(hex) {
    var s = String(hex || '#111827').replace('#', '');
    if (s.length !== 6) s = '111827';
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  function hexOfRgb(c) {
    if (!c || c.length < 3) return '#111827';
    var two = function (n) { var h = (n & 255).toString(16); return h.length < 2 ? '0' + h : h; };
    return '#' + two(c[0]) + two(c[1]) + two(c[2]);
  }

  function colourOf(el) {
    var K = window.GardenCanvas;
    if (!K) return '#111827';
    return el.hi || el.ty === 'hl' ? K.hiHexOf(el.c) : K.hexOf(el.c);
  }

  /*@3.NOPAJ.2*/
  function strokeEntry(el, pageIx) {
    var pts = el.pts || [];
    if (pts.length < 1) return null;
    var flat = [], bez = [], i;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (i = 0; i < pts.length; i++) {
      var p = pts[i];
      flat.push(p.x, p.y);
      if (i === 0) bez.push(p.x, p.y);
      else bez.push(pts[i - 1].x, pts[i - 1].y, p.x, p.y, p.x, p.y);
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    if (pts.length === 1) { flat.push(pts[0].x, pts[0].y); bez.push(pts[0].x, pts[0].y, pts[0].x, pts[0].y, pts[0].x, pts[0].y); }
    var w = el.w > 0 ? el.w : 2;
    var pad = w / 2 + 1;
    return {
      annotationType: 15,
      color: rgb(colourOf(el)),
      thickness: w,
      opacity: el.hi ? 0.42 : 1,
      paths: [{ bezier: bez, points: flat }],
      pageIndex: pageIx,
      rect: [x0 - pad, y0 - pad, x1 + pad, y1 + pad],
      rotation: 0,
      structTreeParentId: null,
      user: USER
    };
  }

  function markEntries(el, pageIx) {
    var out = [], i;
    var col = rgb(colourOf(el));
    for (i = 0; i < (el.r || []).length; i++) {
      var r = el.r[i];
      if (!(r.w > 0.5) || !(r.h > 0.5)) continue;
      var x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
      out.push({
        annotationType: 9,
        color: col,
        opacity: 1,
        quadPoints: [x0, y1, x1, y1, x0, y0, x1, y0],
        outlines: [[x0, y0, x1, y0, x1, y1, x0, y1]],
        pageIndex: pageIx,
        rect: [x0, y0, x1, y1],
        rotation: 0,
        structTreeParentId: null,
        user: USER
      });
    }
    return out;
  }

  function fieldText(el) {
    if (el.doc && window.GardenNotesBlocks && GardenNotesBlocks.toText) {
      try { return String(GardenNotesBlocks.toText(el.doc) || ''); } catch (e) {}
    }
    return String(el.t || '');
  }

  function fieldEntry(el, pageIx) {
    var t = fieldText(el);
    if (!t.trim()) return null;
    var K = window.GardenCanvas;
    return {
      annotationType: 3,
      color: rgb(K ? K.hexOf(el.c) : '#111827'),
      fontSize: el.fs > 0 ? el.fs : 12,
      value: t,
      pageIndex: pageIx,
      rect: [el.x, el.y, el.x + (el.w > 0 ? el.w : 120), el.y + (el.h > 0 ? el.h : 18)],
      rotation: 0,
      structTreeParentId: null,
      user: USER
    };
  }

  /*@3.NOPAJ.3*/
  function entriesOf(els, pageIx) {
    var out = [], i, sealed = false, inked = false;
    for (i = 0; i < (els || []).length; i++) {
      var e = els[i];
      if (!e) continue;
      if (e.ty === 'st') { var s = strokeEntry(e, pageIx); if (s) { out.push(s); inked = true; } }
      else if (e.ty === 'hl') { var m = markEntries(e, pageIx); if (m.length) sealed = true; out = out.concat(m); }
      else if (e.ty === 'tx') { var f = fieldEntry(e, pageIx); if (f) { out.push(f); sealed = true; } }
    }
    /*@3.NOPAJ.7*/
    if (inked && !sealed) out.push(seal(pageIx));
    return out;
  }

  function seal(pageIx) {
    return {
      annotationType: 9,
      color: [255, 255, 255],
      opacity: 0,
      quadPoints: [0, 0.6, 0.6, 0.6, 0, 0, 0.6, 0],
      outlines: [[0, 0, 0.6, 0, 0.6, 0.6, 0, 0.6]],
      pageIndex: pageIx,
      rect: [0, 0, 0.6, 0.6],
      rotation: 0,
      structTreeParentId: null,
      user: USER
    };
  }

  /*@3.NOPAJ.4*/
  function build(handle, pages) {
    var doc = handle && handle.doc;
    if (!doc || !doc.annotationStorage || !doc.saveDocument) {
      return Promise.reject(new Error('no-doc'));
    }
    var st = doc.annotationStorage;
    var keys = [], n = 0, k, total = 0;
    for (k in pages) {
      var ix = (+k) - 1;
      if (!(ix >= 0)) continue;
      var list = entriesOf(pages[k], ix);
      for (var i = 0; i < list.length; i++) {
        /*@3.NOPAJ.6*/
        var key = 'pdfjs_internal_editor_9' + String(100000 + (n++));
        st.setValue(key, list[i]);
        keys.push(key);
        total++;
      }
    }
    var clean = function () {
      for (var j = 0; j < keys.length; j++) { try { st.remove(keys[j]); } catch (e) {} }
    };
    return doc.saveDocument().then(function (bytes) {
      clean();
      return { bytes: bytes, count: total };
    }, function (e) { clean(); throw e; });
  }

  /*@3.NOPAJ.5*/
  function harvest(list) {
    var els = [], mine = 0, i, sealed = false;
    for (i = 0; i < (list || []).length; i++) {
      var s0 = list[i];
      if (s0 && s0.titleObj && s0.titleObj.str === USER) { sealed = true; break; }
    }
    for (i = 0; i < (list || []).length; i++) {
      var a = list[i];
      if (!a) continue;
      var own = !!(a.titleObj && a.titleObj.str === USER);
      if (!own && !(sealed && a.subtype === 'Ink')) continue;
      mine++;
      if (a.subtype === 'Highlight' && a.opacity != null && a.opacity < 0.01) continue;
      var col = hexOfRgb(a.color);
      if (a.subtype === 'Ink' && a.inkLists) {
        for (var q = 0; q < a.inkLists.length; q++) {
          var raw = a.inkLists[q], pts = [];
          for (var z = 0; z + 1 < raw.length; z += 2) pts.push({ x: raw[z], y: raw[z + 1], p: 0.6 });
          if (pts.length) {
            var hi = a.opacity != null && a.opacity < 0.9;
            els.push({ ty: 'st', pts: pts, c: col, w: (a.borderStyle && a.borderStyle.width) || 2,
                       nib: hi ? 'marker' : 'round', o: 1, hi: hi ? 1 : 0 });
          }
        }
      } else if (a.subtype === 'Highlight' && a.quadPoints) {
        var rects = [], qp = a.quadPoints;
        for (var m = 0; m + 7 < qp.length; m += 8) {
          var xs = [qp[m], qp[m + 2], qp[m + 4], qp[m + 6]], ys = [qp[m + 1], qp[m + 3], qp[m + 5], qp[m + 7]];
          var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
          var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
          rects.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        }
        if (rects.length) els.push({ ty: 'hl', c: col, r: rects });
      } else if (a.subtype === 'FreeText' && a.rect) {
        var r = a.rect;
        var da = a.defaultAppearanceData || {};
        els.push({ ty: 'tx', x: Math.min(r[0], r[2]), y: Math.min(r[1], r[3]),
                   w: Math.abs(r[2] - r[0]), h: Math.abs(r[3] - r[1]),
                   t: (a.contentsObj && a.contentsObj.str) || '',
                   c: da.fontColor ? hexOfRgb(da.fontColor) : col,
                   fs: da.fontSize > 0 ? da.fontSize : 12 });
      }
    }
    return { els: els, mine: mine };
  }

  window.GardenPdfAnnot = {
    USER: USER,
    build: build,
    harvest: harvest,
    entriesOf: entriesOf
  };
})();
