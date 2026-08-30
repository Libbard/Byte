;(function () {
  'use strict';

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(a, e) { return isAr() ? a : e; }
  function B() { return window.GardenNotesBlocks; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var LIGHT = {};
  function lightHex(name) {
    if (!LIGHT.ink && window.GardenCanvas && GardenCanvas.TONES) {
      var T = GardenCanvas.TONES;
      for (var k in T) LIGHT[k] = T[k].light;
    }
    return LIGHT[name] || LIGHT.ink || '#111827';
  }

  function inkSvg(b) {
    var C = window.GardenInkCodec, K = window.GardenCanvas;
    if (!K || !K.toSvg) return Promise.resolve('');
    var shapes = (b.shapes || []).slice();
    var w = b.w || 720, h = b.h || 300;
    if (!b.ink) {
      if (!shapes.length) return Promise.resolve('');
      return Promise.resolve(K.toSvg(shapes, w, h, { hex: lightHex }));
    }
    if (!C || !C.unpack) return Promise.resolve('');
    return C.unpack(b.ink).then(function (strokes) {
      var els = shapes.concat((strokes || []).map(function (st) {
        return {
          ty: 'st', c: st.color || 'ink', w: st.w || 2.4, nib: st.nib || 'round',
          o: st.tool === 'hi' ? 0.32 : 1, pts: st.pts
        };
      }));
      if (!els.length) return '';
      return K.toSvg(els, w, h, { hex: lightHex });
    })['catch'](function () { return ''; });
  }

  function styleOf(b) {
    var st = [];
    if (b.dir === 'rtl' || b.dir === 'ltr') st.push('direction:' + b.dir);
    if (b.al) st.push('text-align:' + b.al);
    /*@3.NOSJ4.5*/
    if (b.ff) {
      var fc = (B().fontCss && B().fontCss(b.ff)) || b.ff;
      st.push('font-family:&quot;' + String(fc).replace(/["'<>;&]/g, '') + '&quot;,sans-serif');
    }
    return st.length ? ' style="' + st.join(';') + '"' : '';
  }

  function runs(rt) {
    var M = B();
    if (!M) return '';
    return M.runsToHtmlBidi ? M.runsToHtmlBidi(rt) : esc(M.runsToText(rt));
  }

  function tblHtml(b, s) {
    var st = b.st || 'head';
    var rows = (b.rows || []).map(function (r, i) {
      var tag = (i === 0 && st === 'head') ? 'th' : 'td';
      return '<tr>' + r.map(function (c) {
        return '<' + tag + '>' + runs(c.rt) + '</' + tag + '>';
      }).join('') + '</tr>';
    }).join('');
    return '<table data-tst="' + esc(st) + '"' + s + '>' + rows + '</table>';
  }

  function imgHtml(b) {
    var u = B() ? B().httpsOnly(b.url) : '';
    if (!u) return '';
    var f = ['width:' + (b.iw == null ? 100 : b.iw) + '%'];
    var br = b.br == null ? 100 : b.br;
    if (br !== 100) f.push('filter:brightness(' + (br / 100) + ')');
    var op = b.op == null ? 100 : b.op;
    if (op !== 100) f.push('opacity:' + (op / 100));
    return '<figure style="' + f.join(';') + '">' +
      '<img src="' + esc(u) + '" alt="' + esc(b.alt || '') + '" referrerpolicy="no-referrer" loading="lazy">' +
      ((b.cap && b.alt) ? '<figcaption>' + esc(b.alt) + '</figcaption>' : '') + '</figure>';
  }

  /*@3.NOSJ4.2*/
  function hid(b) {
    var B = window.GardenNotesBlocks;
    var a = (b.anc || b.ty === 'h') && B && B.anchorOf ? B.anchorOf(b) : '';
    return a ? ' id="' + esc(a) + '"' : '';
  }


  /*@3.NOSJ4.7*/
  var CAL_UI = {
    note:      { t: '#1273cc', ar: 'ملاحظة', en: 'Note' },
    tip:       { t: '#0a8f4d', ar: 'فائدة',  en: 'Tip' },
    important: { t: '#3f4d63', ar: 'مهمّ',    en: 'Important' },
    warning:   { t: '#b8730a', ar: 'تحذير',  en: 'Warning' },
    caution:   { t: '#cc2f2f', ar: 'تنبيه',  en: 'Caution' }
  };

  function calHtml(b, s) {
    var k = String(b.cal || 'note').toLowerCase();
    var c = CAL_UI[k] || CAL_UI.note;
    var rt = (b.rt || []).slice();
    if (rt.length && rt[0] && rt[0].cl) rt = rt.slice(1);
    var isar = true;
    try { isar = (localStorage.getItem('garden_lang') || 'ar') === 'ar'; } catch (e) {}
    return '<div class="cal cal-' + k + '"' + s + '>' +
      '<div class="cal-h">' + esc(isar ? c.ar : c.en) + '</div>' +
      '<div class="cal-b">' + runs(rt) + '</div></div>';
  }

  function blockHtml(b) {
    var s = styleOf(b);
    var lv = b.lv || 2;
    switch (b.ty) {
      /*@3.NOSJ4.6*/
      case 'h':       return '<h' + lv + s + hid(b) + '>' + runs(b.rt) + '</h' + lv + '>';
      case 'p':       return '<p' + s + '>' + runs(b.rt) + '</p>';
      case 'quote':   return '<blockquote' + s + '>' + runs(b.rt) + '</blockquote>';
      case 'callout': return calHtml(b, s);
      case 'todo':    return '<p class="td"' + s + '><span class="bx">' +
                        (b.done ? '&#10003;' : '&#160;') + '</span>' + runs(b.rt) + '</p>';
      case 'ul':
      case 'ol':      return '<div' + s + '>' + B().listHtml(b, runs) + '</div>';
      case 'code':    return '<pre dir="ltr" data-lang="' + esc(b.lang || '') + '">' +
                        esc(b.src || '') + '</pre>';
      case 'math':    return '<p class="mth" dir="ltr">' +
                        esc(b.display ? ('\\[' + (b.tex || '') + '\\]') : ('\\(' + (b.tex || '') + '\\)')) + '</p>';
      case 'tbl':     return tblHtml(b, s);
      case 'img':     return imgHtml(b);
      case 'gap':     return '<div style="height:' + (b.h || 40) + 'px"></div>';
      case 'hr':      return '<hr>';
      default:        return '';
    }
  }

  var CSS =
    ':root{color-scheme:light}' +
    'body{margin:0;padding:2rem 1.25rem;background:#fff;color:#1f2937;' +
      'font-family:"Tajawal","Segoe UI",system-ui,sans-serif;font-size:16px;line-height:1.9;' +
      'max-width:46rem;margin-inline:auto}' +
    'h1,h2,h3{line-height:1.4;margin:1.4rem 0 .5rem}' +
    '.hd{border-bottom:1px solid #e5e7eb;padding-bottom:.6rem;margin-bottom:1.2rem}' +
    '.hd h1{margin:0;font-size:1.6rem}.hd .sub{font-size:.8rem;color:#9ca3af;margin-top:.2rem}' +
    'p{margin:0 0 .6rem}ul,ol{margin:0 0 .6rem;padding-inline-start:1.4rem}' +
    'blockquote{margin:0 0 .7rem;padding-inline-start:.7rem;border-inline-start:3px solid #d1d5db;color:#4b5563}' +
    '.cal{margin:0 0 .7rem;padding:.55rem .9rem;border:0;border-inline-start:3px solid #9ca3af;border-radius:12px;background:#fafbfc}' +
    '.cal .cal-h{font-weight:800;font-size:.8rem;margin-bottom:.22rem;letter-spacing:.01em}' +
    '.cal .cal-b{margin:0}' +
    '.cal-note{border-inline-start-color:#1273cc;background:#f2f7fd}.cal-note .cal-h{color:#1273cc}' +
    '.cal-tip{border-inline-start-color:#0a8f4d;background:#f1faf5}.cal-tip .cal-h{color:#0a8f4d}' +
    '.cal-important{border-inline-start-color:#3f4d63;background:#f5f6f8}.cal-important .cal-h{color:#3f4d63}' +
    '.cal-warning{border-inline-start-color:#b8730a;background:#fdf8ef}.cal-warning .cal-h{color:#b8730a}' +
    '.cal-caution{border-inline-start-color:#cc2f2f;background:#fdf3f3}.cal-caution .cal-h{color:#cc2f2f}' +
    '.td .bx{display:inline-block;inline-size:1em;block-size:1em;border:1px solid #9ca3af;' +
      'border-radius:.2rem;margin-inline-end:.4rem;text-align:center;line-height:1em;font-size:.8em}' +
    'pre{font-family:ui-monospace,Consolas,monospace;font-size:.86rem;line-height:1.6;' +
      'background:#f6f7f9;border:1px solid #e5e7eb;border-radius:.5rem;padding:.7rem .9rem;' +
      'margin:0 0 .7rem;white-space:pre-wrap;word-break:break-word}' +
    'table{width:100%;border-collapse:collapse;margin:0 0 .8rem;font-size:.94rem}' +
    'td,th{border:1px solid #d1d5db;padding:.35rem .5rem;text-align:start}' +
    'th{background:#f3f4f6;font-weight:700}' +
    'table[data-tst="lines"] td,table[data-tst="lines"] th{border-inline:0}' +
    'table[data-tst="plain"] td,table[data-tst="plain"] th{border:0}' +
    'figure{margin:0 auto .8rem}figure img{max-width:100%;display:block;border-radius:.4rem}' +
    'figcaption{font-size:.82rem;color:#6b7280;text-align:center;margin-top:.25rem}' +
    '.ink{margin:0 0 .8rem}.ink svg{max-width:100%;height:auto;display:block}' +
    '.ovl{border-top:1px dashed #e5e7eb;padding-top:.6rem;margin-top:1rem}' +
    '.ovl-t{font-size:.78rem;color:#9ca3af;margin-bottom:.3rem}' +
    '.mth{text-align:center}mark{background:#fef3c7;color:inherit}' +
    'code{font-family:ui-monospace,Consolas,monospace;background:#f3f4f6;' +
      'border-radius:.2rem;padding:.05rem .2rem;unicode-bidi:isolate;direction:ltr}' +
    'a{color:#4338ca}hr{border:0;border-top:1px solid #e5e7eb;margin:1rem 0}' +
    '.note+.note{margin-top:2.5rem;border-top:2px solid #e5e7eb;padding-top:1.5rem}';

  function bodyHtml(doc) {
    var blocks = (doc && doc.blocks) || [];
    var jobs = blocks.map(function (b) {
      if (b.ty === 'ink') {
        return inkSvg(b).then(function (svg) {
          return svg ? '<div class="ink">' + svg + '</div>' : '';
        });
      }
      return Promise.resolve(blockHtml(b));
    });
    var ov = doc && doc.ov;
    if (ov && (ov.ink || (ov.shapes && ov.shapes.length))) {
      jobs.push(inkSvg({ ink: ov.ink, shapes: ov.shapes, w: ov.w, h: ov.h }).then(function (svg) {
        if (!svg) return '';
        return '<div class="ink ovl"><div class="ovl-t">' +
          esc(L('طبقة الرسم فوق الملاحظة', 'Drawing layer over the note')) + '</div>' + svg + '</div>';
      }));
    }
    return Promise.all(jobs).then(function (parts) {
      return parts.filter(function (x) { return x; }).join('\n');
    });
  }

  function noteSection(doc, meta) {
    var m = meta || {};
    return bodyHtml(doc).then(function (inner) {
      var sub = [m.course, m.date].filter(function (x) { return x; }).join(' · ');
      return '<article class="note"><header class="hd"><h1>' +
        esc(m.title || L('بلا عنوان', 'Untitled')) + '</h1>' +
        (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</header>' + inner + '</article>';
    });
  }

  function wrapHtml(title, inner) {
    var a = isAr();
    return '<!DOCTYPE html>\n<html dir="' + (a ? 'rtl' : 'ltr') + '" lang="' + (a ? 'ar' : 'en') + '">\n' +
      '<head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(title) + '</title><style>' + CSS + '</style></head>\n' +
      '<body>\n' + inner + '\n</body>\n</html>\n';
  }

  function toHtml(doc, meta) {
    var m = meta || {};
    return noteSection(doc, m).then(function (sec) {
      return wrapHtml(m.title || L('ملاحظة', 'Note'), sec);
    });
  }

  function toHtmlMany(items, title) {
    var jobs = (items || []).map(function (it) { return noteSection(it.doc, it.meta); });
    return Promise.all(jobs).then(function (parts) {
      return wrapHtml(title || L('ملاحظاتي', 'My notes'), parts.join('\n'));
    });
  }

  function toJson(doc, meta) {
    var m = meta || {};
    return JSON.stringify({
      format: 'garden-notes', v: 1,
      title: m.title || '', course: m.course || '', exported: m.date || '',
      doc: B() ? B().normalize(doc) : doc
    }, null, 2);
  }

  function toJsonMany(items) {
    return JSON.stringify({
      format: 'garden-notes-bundle', v: 1,
      notes: (items || []).map(function (it) {
        var m = it.meta || {};
        return { title: m.title || '', course: m.course || '',
                 doc: B() ? B().normalize(it.doc) : it.doc };
      })
    }, null, 2);
  }

  function fromJson(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return null; }
    if (!o || typeof o !== 'object') return null;
    if (o.format === 'garden-notes' && o.doc) {
      return [{ title: o.title || '', doc: B() ? B().normalize(o.doc) : o.doc }];
    }
    if (o.format === 'garden-notes-bundle' && Array.isArray(o.notes)) {
      return o.notes.filter(function (n) { return n && n.doc; }).map(function (n) {
        return { title: n.title || '', doc: B() ? B().normalize(n.doc) : n.doc };
      });
    }
    if (Array.isArray(o.blocks)) {
      return [{ title: '', doc: B() ? B().normalize(o) : o }];
    }
    return null;
  }

  var FORMATS = {
    txt:  { mime: 'text/plain;charset=utf-8',    ext: 'txt',  ar: 'نصّ عاديّ',  en: 'Plain text' },
    md:   { mime: 'text/markdown;charset=utf-8', ext: 'md',   ar: 'ماركداون',  en: 'Markdown' },
    html: { mime: 'text/html;charset=utf-8',     ext: 'html', ar: 'صفحة ويب',  en: 'Web page' },
    json: { mime: 'application/json;charset=utf-8', ext: 'json', ar: 'JSON (يُستورَد)', en: 'JSON (re-importable)' }
  };

  function safeName(s) {
    var n = String(s || '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/[\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ').trim();
    return (n || 'note').slice(0, 60);
  }

  /*@3.NOSJ4.3*/
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function render(fmt, doc, meta) {
    var M = B();
    if (fmt === 'txt') return Promise.resolve(M ? M.toText(doc) : '');
    if (fmt === 'md') return Promise.resolve(M ? M.toMarkdown(doc) : '');
    if (fmt === 'json') return Promise.resolve(toJson(doc, meta));
    return toHtml(doc, meta);
  }

  function renderMany(fmt, items, title) {
    var M = B();
    var join = function (fn, sep) {
      return Promise.resolve((items || []).map(function (it) {
        var head = (it.meta && it.meta.title) || L('بلا عنوان', 'Untitled');
        return head + '\n' + new Array(head.length + 1).join('=') + '\n\n' + fn(it.doc);
      }).join(sep));
    };
    if (fmt === 'txt') return join(function (d) { return M ? M.toText(d) : ''; }, '\n\n\n');
    if (fmt === 'md') return Promise.resolve((items || []).map(function (it) {
      return '# ' + ((it.meta && it.meta.title) || L('بلا عنوان', 'Untitled')) + '\n\n' +
        (M ? M.toMarkdown(it.doc) : '');
    }).join('\n\n---\n\n'));
    if (fmt === 'json') return Promise.resolve(toJsonMany(items));
    return toHtmlMany(items, title);
  }

  /*@3.NOSJ4.4*/
  function isEmptyDoc(doc) {
    var M = B();
    if (!M || !M.liveBlocks) return false;
    var ov = doc && doc.ov;
    if (ov && (ov.ink || (ov.shapes && ov.shapes.length))) return false;
    try { return M.liveBlocks(doc).length === 0; } catch (e) { return false; }
  }

  function exportNote(fmt, doc, meta) {
    var f = FORMATS[fmt];
    if (!f) return Promise.resolve(false);
    var m = meta || {};
    if (fmt !== 'json' && isEmptyDoc(doc)) return Promise.resolve(false);
    return render(fmt, doc, m).then(function (text) {
      download(safeName(m.title || L('ملاحظة', 'note')) + '.' + f.ext, f.mime, text);
      return true;
    });
  }

  function exportMany(fmt, items, title) {
    var f = FORMATS[fmt];
    if (!f) return Promise.resolve(false);
    if (!items || !items.length) return Promise.resolve(false);
    var live = (fmt === 'json') ? items : items.filter(function (it) { return !isEmptyDoc(it.doc); });
    if (!live.length) return Promise.resolve(false);
    return renderMany(fmt, live, title).then(function (text) {
      download(safeName(title || L('ملاحظاتي', 'my-notes')) + '.' + f.ext, f.mime, text);
      return true;
    });
  }

  /*@3.NOSJ4.1*/
  window.GardenNotesSerialize = {
    FORMATS: FORMATS,
    inkSvg: inkSvg,
    lightHex: lightHex,
    toHtml: toHtml,
    toHtmlMany: toHtmlMany,
    toJson: toJson,
    toJsonMany: toJsonMany,
    fromJson: fromJson,
    render: render,
    renderMany: renderMany,
    exportNote: exportNote,
    exportMany: exportMany,
    download: download,
    safeName: safeName
  };
})();
