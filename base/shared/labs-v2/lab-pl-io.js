/*@4.LAPIJ2.1*/
(function (global) {
  'use strict';

  var SESSION_KIND = 'garden-pl-session';
  var SESSION_VERSION = 1;

  function download(name, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url; anchor.download = name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    /*@4.LAPIJ2.2*/
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportSession(payload) {
    download('garden-session.gardenpl.json', JSON.stringify({
      kind: SESSION_KIND, version: SESSION_VERSION,
      createdAt: new Date().toISOString(), payload: payload
    }, null, 1), 'application/json');
  }

  /** @returns {{ok:boolean, payload?:Object, reason?:string}} */
  function parseSession(text) {
    try {
      var parsed = JSON.parse(text);
      if (!parsed || parsed.kind !== SESSION_KIND) return { ok: false, reason: 'kind' };
      if (parsed.version !== SESSION_VERSION) return { ok: false, reason: 'version' };
      if (!parsed.payload || typeof parsed.payload !== 'object') return { ok: false, reason: 'shape' };
      return { ok: true, payload: parsed.payload };
    } catch (error) { return { ok: false, reason: 'json' }; }
  }

  function exportSource(name, code) { download(name, code, 'text/plain'); }

  /*@4.LAPIJ2.3*/
  function exportNotebook(code, outputs) {
    var notebook = {
      cells: [{
        cell_type: 'code', execution_count: 1, id: 'garden-cell', metadata: {},
        source: String(code).split('\n').map(function (line, index, all) {
          return index === all.length - 1 ? line : line + '\n';
        }),
        outputs: (outputs && outputs.length) ? [{
          output_type: 'stream', name: 'stdout',
          text: outputs.map(function (line) { return line + '\n'; })
        }] : []
      }],
      metadata: {
        kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
        language_info: { name: 'python', version: '3.12' }
      },
      nbformat: 4, nbformat_minor: 5
    };
    download('garden-notebook.ipynb', JSON.stringify(notebook, null, 1), 'application/json');
  }

  /**
   * يقرأ خلايا الكود من دفتر.
   * @returns {{ok:boolean, code?:string, cells?:number, reason?:string}}
   */
  function parseNotebook(text) {
    try {
      var book = JSON.parse(text);
      if (!book || !Array.isArray(book.cells)) return { ok: false, reason: 'shape' };
      if (!(book.nbformat >= 4)) return { ok: false, reason: 'version' };
      var chunks = [];
      book.cells.forEach(function (cell) {
        if (cell.cell_type !== 'code') return;
        /*@4.LAPIJ2.4*/
        var body = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');
        if (body.trim()) chunks.push(body.replace(/\n+$/, ''));
      });
      if (!chunks.length) return { ok: false, reason: 'empty' };
      /*@4.LAPIJ2.5*/
      return { ok: true, code: chunks.join('\n\n# ── \n\n'), cells: chunks.length };
    } catch (error) { return { ok: false, reason: 'json' }; }
  }

  /*@4.LAPIJ2.6*/
  function pickFile(accept) {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = accept || '';
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) { resolve(null); return; }
        var reader = new FileReader();
        reader.onload = function () { resolve({ name: file.name, text: String(reader.result) }); };
        reader.onerror = function () { resolve(null); };
        reader.readAsText(file);
      });
      input.click();
    });
  }

  global.GardenPLIO = {
    exportSession: exportSession, parseSession: parseSession,
    exportSource: exportSource,
    exportNotebook: exportNotebook, parseNotebook: parseNotebook,
    pickFile: pickFile, download: download
  };
})(window);
