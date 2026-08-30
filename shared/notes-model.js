/*@3.NOMJ.1*/
;(function () {
  'use strict';

  var LS_RICH = 'notes_index';
  var LS_QUICK = 'quick_notes';
  var MOD_RE = /^garden_([A-Z0-9]+)_m(\d+)_notes$/;
  var COURSE_RE = /^course_meta_([A-Z0-9_]+)$/;

  var sc = document.currentScript;
  var ROOT = (sc && sc.src)
    ? sc.src.replace(/shared\/notes-model\.js(\?.*)?$/, '')
    : (location.origin + '/');

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return (v == null) ? fallback : v;
    } catch (e) { return fallback; }
  }

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  function stamp(v, fallback) {
    if (v == null) return fallback || 0;
    if (typeof v === 'number') return v;
    var n = Date.parse(v);
    return isFinite(n) ? n : (fallback || 0);
  }

  /*@3.NOMJ.8*/
  function dayStamp(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v == null ? '' : v));
    if (!m) return stamp(v, 0);
    return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0).getTime();
  }

  function firstLine(s, max) {
    var t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (!t) return '';
    var lim = max || 90;
    return t.length > lim ? t.slice(0, lim) + '…' : t;
  }

  function courseName(code) {
    try {
      var c = (window.GardenData && GardenData.courseInfo) ? GardenData.courseInfo(code) : null;
      if (c && (c.name_ar || c.name_en)) return L(c.name_ar || code, c.name_en || code);
    } catch (e) {}
    return code;
  }

  function moduleHref(code, m) {
    var rel = null;
    try {
      if (window.GardenSearch && GardenSearch.moduleUrl) rel = GardenSearch.moduleUrl(code, Number(m));
    } catch (e) {}
    if (rel) return ROOT + rel;
    /*@3.NOMJ.4*/
    return ROOT + 'hub/course.html?code=' + encodeURIComponent(code);
  }

  function fromQuick() {
    var arr = readJSON(LS_QUICK, []);
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var n = arr[i];
      if (!n || n.id == null) continue;
      var body = String(n.body == null ? '' : n.body);
      var o = n.origin || null;
      /*@3.NOMJ.6*/
      var label = o && o.title
        ? (isAr() ? o.title : (o.title_en || o.title))
        : (n.course ? courseName(n.course) : L('ملاحظة سريعة', 'Quick note'));
      out.push({
        uid: 'quick:' + n.id,
        src: 'quick',
        id: String(n.id),
        title: firstLine(body, 60) || L('(فارغة)', '(empty)'),
        excerpt: firstLine(body, 160),
        color: n.color || null,
        pinned: !!n.pinned,
        archived: !!n.archived,
        remind_at: n.remind_at || null,
        tags: Array.isArray(n.tags) ? n.tags.slice() : [],
        origin: {
          kind: o && o.page ? 'page' : (n.course ? 'course' : 'quick'),
          label: label,
          course: n.course || null,
          module: (n.module != null ? n.module : null),
          page: (o && o.page) || null
        },
        updated_at: stamp(n.updated_at, stamp(n.created_at, 0)),
        created_at: stamp(n.created_at, 0),
        /*@3.NOMJ.7*/
        href: (o && o.page) ? (ROOT + o.page + '#qn-' + n.id) : (ROOT + 'index.html'),
        editable: true
      });
    }
    return out;
  }

  function fromModules() {
    var out = [];
    /*@3.NOMJ.3*/
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    } catch (e) { return out; }

    for (var k = 0; k < keys.length; k++) {
      var m = MOD_RE.exec(keys[k] || '');
      if (!m) continue;
      var code = m[1], mod = parseInt(m[2], 10);
      var arr = readJSON(keys[k], []);
      if (!Array.isArray(arr)) continue;

      for (var j = 0; j < arr.length; j++) {
        var n = arr[j];
        if (!n || n.id == null) continue;
        var body = String(n.body != null ? n.body : (n.note || ''));
        /*@3.NOMJ.2*/
        if (n.highlightOnly || !body.trim()) continue;
        var title = n.title || (n.highlight ? firstLine(n.highlight, 46) : '');
        out.push({
          uid: 'mod:' + code + ':' + mod + ':' + n.id,
          src: 'module',
          id: String(n.id),
          title: title || firstLine(body, 60) || L('ملاحظة', 'Note'),
          excerpt: firstLine(body, 160),
          color: n.color || 'amber',
          pinned: false,
          archived: false,
          remind_at: null,
          tags: [],
          origin: {
            kind: 'module',
            label: courseName(code) + ' · ' + L('الوحدة ', 'Module ') + mod,
            course: code,
            module: mod,
            page: null
          },
          highlight: n.highlight || '',
          updated_at: stamp(n.ut || n.ts, dayStamp(n.date)),
          created_at: stamp(n.ts, dayStamp(n.date)),
          approx: !(n.ut || n.ts),
          href: moduleHref(code, mod) + '#note-' + encodeURIComponent(n.id),
          editable: false
        });
      }
    }
    return out;
  }

  function fromCourses() {
    var out = [];
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    } catch (e) { return out; }

    for (var k = 0; k < keys.length; k++) {
      var cm = COURSE_RE.exec(keys[k] || '');
      if (!cm) continue;
      var code = cm[1];
      var meta = readJSON(keys[k], null);
      var list = (meta && Array.isArray(meta.notes)) ? meta.notes : [];
      for (var j = 0; j < list.length; j++) {
        var n = list[j];
        if (!n || n.id == null) continue;
        var body = String(n.body == null ? '' : n.body);
        out.push({
          uid: 'course:' + code + ':' + n.id,
          src: 'course',
          id: String(n.id),
          title: n.title || firstLine(body, 60) || L('ملاحظة', 'Note'),
          excerpt: firstLine(body, 160),
          color: null,
          pinned: false,
          archived: false,
          remind_at: null,
          tags: [],
          origin: {
            kind: 'course',
            label: courseName(code),
            course: code,
            module: null,
            page: null
          },
          updated_at: stamp(n.updated_at, 0),
          created_at: stamp(n.created_at, stamp(n.updated_at, 0)),
          href: ROOT + 'hub/course.html?code=' + encodeURIComponent(code) +
                '#note-' + encodeURIComponent(n.id),
          editable: false
        });
      }
    }
    return out;
  }

  function richIndex() {
    var arr = readJSON(LS_RICH, []);
    return Array.isArray(arr) ? arr : [];
  }

  function fromRich() {
    var arr = richIndex();
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      if (!r || !r.id) continue;
      var o = r.o || {};
      var label = o.c
        ? (courseName(o.c) + (o.m != null ? ' · ' + L('الوحدة ', 'Module ') + o.m : ''))
        : (o.t || L('ملاحظة', 'Note'));
      out.push({
        uid: 'rich:' + r.id,
        src: 'rich',
        id: String(r.id),
        title: r.t || L('بلا عنوان', 'Untitled'),
        /*@3.NOMJ.9*/
        excerpt: r.x || '',
        color: r.c || null,
        pinned: !!r.p,
        archived: !!r.a,
        remind_at: r.r || null,
        reminder_done: !!r.rd,
        tags: Array.isArray(r.g) ? r.g.slice() : [],
        kind: r.k || 'rich',
        bytes: r.sz || 0,
        origin: {
          kind: o.p ? 'page' : (o.c ? (o.m != null ? 'module' : 'course') : 'rich'),
          label: label,
          course: o.c || null,
          module: (o.m != null ? o.m : null),
          page: o.p || null
        },
        updated_at: stamp(r.updated_at, 0),
        created_at: stamp(r.ca, 0),
        href: ROOT + 'hub/notes.html?id=' + encodeURIComponent(r.id),
        editable: true
      });
    }
    return out;
  }

  function all(opts) {
    var o = opts || {};
    var out = [];
    if (o.rich !== false) out = out.concat(fromRich());
    if (o.quick !== false) out = out.concat(fromQuick());
    if (o.modules !== false) out = out.concat(fromModules());
    if (o.courses !== false) out = out.concat(fromCourses());
    if (!o.withArchived) out = out.filter(function (x) { return !x.archived; });
    out.sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (b.updated_at || 0) - (a.updated_at || 0);
    });
    return out;
  }

  function groupBy(list, key) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
      var g = key(list[i]);
      (map[g] || (map[g] = [])).push(list[i]);
    }
    return map;
  }

  function counts(list) {
    var c = { all: list.length, rich: 0, quick: 0, module: 0, course: 0 };
    for (var i = 0; i < list.length; i++) if (c[list[i].src] != null) c[list[i].src]++;
    return c;
  }

  function tagCloud(list) {
    var m = {};
    for (var i = 0; i < list.length; i++) {
      var t = list[i].tags || [];
      for (var j = 0; j < t.length; j++) m[t[j]] = (m[t[j]] || 0) + 1;
    }
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; })
      .map(function (k) { return { tag: k, n: m[k] }; });
  }

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function search(list, q) {
    var nq = norm(q);
    if (!nq) return list;
    return list.filter(function (x) {
      return norm(x.title + ' ' + x.excerpt + ' ' + (x.tags || []).join(' ') +
                  ' ' + (x.origin && x.origin.label || '')).indexOf(nq) !== -1;
    });
  }

  /*@3.NOMJ.5*/
  var readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = new Promise(function (resolve) {
      var jobs = [];
      try {
        if (window.GardenSearch && GardenSearch.load) jobs.push(GardenSearch.load());
      } catch (e) {}
      try {
        if (window.GardenData && GardenData.ready) jobs.push(GardenData.ready());
      } catch (e2) {}
      if (!jobs.length) { resolve(false); return; }
      Promise.all(jobs.map(function (j) {
        return Promise.resolve(j).catch(function () { return false; });
      })).then(function () { resolve(true); }, function () { resolve(false); });
    });
    return readyP;
  }

  window.GardenNotesModel = {
    ready: ready,
    all: all,
    fromQuick: fromQuick,
    fromModules: fromModules,
    fromCourses: fromCourses,
    fromRich: fromRich,
    richIndex: richIndex,
    groupBy: groupBy,
    counts: counts,
    tagCloud: tagCloud,
    search: search,
    norm: norm,
    moduleHref: moduleHref,
    ROOT: ROOT,
    KEYS: { rich: LS_RICH, quick: LS_QUICK }
  };
})();
