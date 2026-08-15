/*@4.LAPSJ.1*/
(function (global) {
  'use strict';

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  var SCRIPT_SRI = 'sha384-8D3Rsfo535FqoC1pHCCQMrNf75UgzyoG/HQm9zOzITRrz3QKzecc2E7JXKGCXoWu';
  var loading = null;
  var engine = null;

  /*@4.LAPSJ.2*/
  function load() {
    if (engine) return Promise.resolve(engine);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var tag = document.createElement('script');
      tag.src = CDN + 'sql-wasm.js';
      tag.integrity = SCRIPT_SRI;
      tag.crossOrigin = 'anonymous';
      tag.onerror = function () {
        loading = null;
        reject(new Error('offline'));
      };
      tag.onload = function () {
        if (typeof global.initSqlJs !== 'function') { loading = null; reject(new Error('missing')); return; }
        global.initSqlJs({ locateFile: function (file) { return CDN + file; } })
          .then(function (sql) { engine = sql; resolve(sql); })
          .catch(function () { loading = null; reject(new Error('wasm')); });
      };
      document.head.appendChild(tag);
    });
    return loading;
  }

  /**
   * يُنفّذ نصَّ SQL كاملاً على قاعدةٍ **جديدةٍ في الذاكرة** لكل تشغيل.
   * قاعدةٌ جديدةٌ في كل مرّة = نتيجةٌ حتمية: لا يرث التشغيلُ جداولَ سابقةً
   * فيرى الطالبُ «الجدول موجودٌ سلفاً» من عمله هو.
   *
   * @returns {Promise<{ok:boolean, results?:Array, error?:string, ms:number}>}
   */
  function run(source) {
    var started = performance.now();
    return load().then(function (sql) {
      var database = new sql.Database();
      try {
        /*@4.LAPSJ.3*/
        var results = database.exec(source);
        var changes = database.getRowsModified();
        return { ok: true, results: results, changes: changes, ms: Math.round(performance.now() - started) };
      } catch (error) {
        return { ok: false, error: String(error && error.message ? error.message : error), ms: Math.round(performance.now() - started) };
      } finally {
        /*@4.LAPSJ.4*/
        try { database.close(); } catch (ignored) { /*@4.LAPSJ.5*/ }
      }
    });
  }

  global.GardenSQL = { run: run, load: load, isReady: function () { return !!engine; } };
})(window);
