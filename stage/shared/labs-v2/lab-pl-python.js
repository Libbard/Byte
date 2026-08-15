/*@4.LAPPJ.1*/
(function (global) {
  'use strict';

  var VERSION = 'v0.28.0';
  var CDN = 'https://cdn.jsdelivr.net/pyodide/' + VERSION + '/full/';
  var LOADER_SRI = 'sha384-aD6ek5pFVnSSMGK0qubk9ZJdMYGjPs8F6jdJaDJiyZbTcH9jLWR4LJNJ7yY430qI';
  var loading = null;
  var runtime = null;

  function load(onProgress) {
    if (runtime) return Promise.resolve(runtime);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (onProgress) onProgress('script');
      var tag = document.createElement('script');
      tag.src = CDN + 'pyodide.js';
      tag.integrity = LOADER_SRI;
      tag.crossOrigin = 'anonymous';
      tag.onerror = function () { loading = null; reject(new Error('offline')); };
      tag.onload = function () {
        if (typeof global.loadPyodide !== 'function') { loading = null; reject(new Error('missing')); return; }
        if (onProgress) onProgress('runtime');
        global.loadPyodide({ indexURL: CDN })
          .then(function (py) { runtime = py; resolve(py); })
          .catch(function () { loading = null; reject(new Error('wasm')); });
      };
      document.head.appendChild(tag);
    });
    return loading;
  }

  /*@4.LAPPJ.2*/
  function studentTraceback(message) {
    var lines = String(message).split('\n');
    var first = -1;
    for (var i = 0; i < lines.length; i += 1) {
      if (lines[i].indexOf('File "<exec>"') !== -1) { first = i; break; }
    }
    if (first === -1) return message.trim();
    var kept = lines.slice(first).filter(function (line) { return line.trim().length; });
    kept.unshift('Traceback (most recent call last):');
    return kept.join('\n');
  }

  /**
   * يُنفّذ برنامجاً كاملاً ويلتقط stdout/stderr.
   *
   * 🔴 **مساحةُ أسماءٍ جديدةٌ لكل تشغيل**: بدونها يرث التشغيلُ متغيّراتِ
   *    ما قبله، فيعمل كودٌ ناقصٌ عند الطالب ويفشل عند غيره — وهو أسوأُ
   *    أنواع الخطأ لأنه يُعلّم الخطأ.
   *
   * @param {string} source
   * @param {string} stdin ما يقرؤه `input()`
   */
  /*@4.LAPPJ.3*/
  var PACKAGES = {
    numpy: 'numpy', pandas: 'pandas', scipy: 'scipy', sympy: 'sympy',
    matplotlib: 'matplotlib', networkx: 'networkx', regex: 'regex',
    PIL: 'pillow', bs4: 'beautifulsoup4', sklearn: 'scikit-learn',
    lxml: 'lxml', yaml: 'pyyaml', dateutil: 'python-dateutil',
    pytz: 'pytz', six: 'six', attr: 'attrs'
  };

  /*@4.LAPPJ.4*/
  function neededPackages(source) {
    var clean = String(source)
      .replace(/#[^\n]*/g, ' ')
      .replace(/"""[\s\S]*?"""/g, ' ')
      .replace(/'''[\s\S]*?'''/g, ' ');
    var wanted = {};
    var pattern = /^[ \t]*(?:import|from)[ \t]+([A-Za-z_][\w.]*)/gm;
    var hit;
    while ((hit = pattern.exec(clean))) {
      var root = hit[1].split('.')[0];
      if (PACKAGES[root]) wanted[PACKAGES[root]] = true;
    }
    return Object.keys(wanted);
  }

  function run(source, stdin, onProgress) {
    var started = performance.now();
    return load(onProgress).then(function (py) {
      var wanted = neededPackages(source);
      if (!wanted.length) return py;
      if (onProgress) onProgress('packages', wanted);
      /*@4.LAPPJ.5*/
      return py.loadPackage(wanted).then(function () { return py; }, function () { return py; });
    }).then(function (py) {
      var out = [];
      var lines = String(stdin || '').split('\n');
      var at = 0;
      py.setStdout({ batched: function (text) { out.push({ text: text }); } });
      py.setStderr({ batched: function (text) { out.push({ text: text, kind: 'err' }); } });
      py.setStdin({
        stdin: function () { return at < lines.length ? lines[at++] : null; }
      });
      var namespace = py.globals.get('dict')();
      try {
        py.runPython(source, { globals: namespace });
        return { ok: true, out: out, ms: Math.round(performance.now() - started) };
      } catch (error) {
        var message = String(error && error.message ? error.message : error);
        return { ok: false, out: out, error: studentTraceback(message), ms: Math.round(performance.now() - started) };
      } finally {
        try { namespace.destroy(); } catch (ignored) { /*@4.LAPPJ.6*/ }
      }
    });
  }

  global.GardenPython = { run: run, load: load, isReady: function () { return !!runtime; }, version: VERSION };
})(window);
