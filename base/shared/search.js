/*@3.SEAJ.1*/

;(function () {
  'use strict';

  var thisScript = document.currentScript;
  /*@3.SEAJ.2*/
  function _deriveRoot() {
    if (thisScript && thisScript.src) return thisScript.src.replace(/shared\/search\.js(\?.*)?$/, '');
    var s = document.querySelector('script[src*="shared/search.js"]');
    if (s && s.src) return s.src.replace(/shared\/search\.js(\?.*)?$/, '');
    if (window.GARDEN_HEADER_ROOT) return window.GARDEN_HEADER_ROOT;
    return '';
  }
  var ROOT = _deriveRoot();

  var INDEX_URL = ROOT + 'shared/data/search_index.json';
  var LABS_URL = ROOT + 'shared/labs-v2/registry.json';
  var MAX_RESULTS = 36;
  /*@3.SEAJ.31*/
  var GROUP_CAP = 6;
  var MIN_CHARS = 2;

  var index = null;
  var loading = null;
  var box = null, input = null, panel = null;
  var results = [];
  var active = -1;

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.SEAJ.3*/
  var AR_DIACRITICS = /[ً-ٰٟـ]/g;   /*@3.SEAJ.4*/
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(AR_DIACRITICS, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىی]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /*@3.SEAJ.32*/
  function lsJSON(k, fb) {
    try {
      var v = JSON.parse(localStorage.getItem(k) || 'null');
      return (v === null || v === undefined) ? fb : v;
    } catch (e) { return fb; }
  }
  /*@3.SEAJ.33*/
  function lsKeys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); }
    catch (e) { return []; }
    return out;
  }

  /*@3.SEAJ.34*/
  var TYPE_AR = { hw: 'واجب', project: 'مشروع', quiz: 'كويز', exam: 'اختبار',
                  midterm: 'نصفي', final: 'نهائي', assignment: 'تسليم', reading: 'قراءة',
                  discussion: 'مناقشة', task: 'مهمة', note: 'تذكير', other: 'مهمة' };
  var TYPE_EN = { hw: 'Homework', project: 'Project', quiz: 'Quiz', exam: 'Exam',
                  midterm: 'Midterm', final: 'Final', assignment: 'Assignment', reading: 'Reading',
                  discussion: 'Discussion', task: 'Task', note: 'Reminder', other: 'Task' };
  function typeWord(x) { return (isAr() ? TYPE_AR : TYPE_EN)[x] || (isAr() ? TYPE_AR.other : TYPE_EN.other); }

  /*@3.SEAJ.35*/
  var CRN_RE = /^\d{4,6}$/;

  /*@3.SEAJ.36*/

  var labs = null, labsBusy = false;
  function loadLabs() {
    if (labs || labsBusy) return;
    labsBusy = true;
    fetch(LABS_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        /*@3.SEAJ.37*/
        labs = ((j && j.labs) || [])
          .filter(function (l) { return l && (!l.lifecycle || l.lifecycle === 'published'); })
          .map(function (l) {
            var tags = []
              .concat((l.tags && l.tags.ar) || [], (l.tags && l.tags.en) || [])
              .concat((l.search && l.search.aliases && l.search.aliases.ar) || [],
                      (l.search && l.search.aliases && l.search.aliases.en) || []);
            var codes = (l.curriculumLinks || []).map(function (c) { return c.courseCode || ''; });
            return {
              lab: l, codes: codes,
              nar: norm((l.title && l.title.ar) || ''),
              nen: norm((l.title && l.title.en) || ''),
              nkw: norm(tags.concat(codes).join(' ') + ' ' +
                        ((l.summary && l.summary.ar) || '') + ' ' + ((l.summary && l.summary.en) || ''))
            };
          });
        labsBusy = false;
        reflow();
      })
      .catch(function () { labs = []; labsBusy = false; });
  }

  /*@3.SEAJ.38*/
  var fac = null, facBusy = false;
  function loadFaculty() {
    if (fac || facBusy) return;
    var api = window.GardenEndpoints && window.GardenEndpoints.publicData;
    /*@3.SEAJ.39*/
    if (!api) { needEndpoints(); return; }
    facBusy = true;
    fetch(api + '/v1/faculty/index.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        fac = ((d && d.faculty) || []).map(function (f) {
          return { f: f, n: norm(f.name || ''), e: norm(f.en || ''),
                   c: (f.c || []).join(' ').toLowerCase() };
        });
        facBusy = false;
        reflow();
      })
      .catch(function () { fac = []; facBusy = false; });
  }
  /*@3.SEAJ.40*/
  var epBusy = false;
  function needEndpoints() {
    if (epBusy || window.GardenEndpoints) return;
    epBusy = true;
    var s = document.createElement('script');
    s.src = ROOT + 'shared/endpoints.js';
    s.onload = function () { epBusy = false; loadFaculty(); };
    s.onerror = function () { epBusy = false; fac = []; };
    document.head.appendChild(s);
  }

  /*@3.SEAJ.41*/
  function reflow() {
    if (!panel || panel.hidden || !input) return;
    render(input.value);
  }

  /*@3.SEAJ.5*/

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(INDEX_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = (j && j.entries) || [];
        /*@3.SEAJ.6*/
        index = list.map(function (e) {
          var kw = (e.kw || []).join(' ');
          /*@3.SEAJ.7*/
          var code = norm(e.code || '');
          var mod = e.m ? (code + ' m' + e.m + ' ' + code + e.m) : '';
          return {
            e: e,
            nar: norm(e.ar), nen: norm(e.en), nkw: norm(kw),
            ncode: (code + ' ' + mod).trim()
          };
        });
        return index;
      })
      .catch(function () { index = []; return index; });
    return loading;
  }

  /*@3.SEAJ.8*/

  /*@3.SEAJ.9*/
  var modUrlMap = null;
  function moduleUrl(code, m) {
    if (!modUrlMap) {
      modUrlMap = {};
      (index || []).forEach(function (it) {
        var e = it.e;
        if (e && e.t === 'module' && e.code && e.m && e.url) modUrlMap[e.code + '|' + e.m] = e.url;
      });
    }
    return modUrlMap[code + '|' + m] || null;
  }

  /*@3.SEAJ.42*/
  function searchMine(q) {
    var nq = norm(q);
    var out = [];
    if (!nq) return out;
    searchNotes(q).forEach(function (x) { out.push(x); });
    searchTasks(nq, out);
    searchCourseDates(nq, out);
    searchSections(nq, out);
    searchInstructors(nq, out);
    searchLabs(nq, out);
    return out;
  }

  /*@3.SEAJ.43*/
  function searchTasks(nq, out) {
    var list = lsJSON('my_tasks', []);
    if (!Array.isArray(list)) return;
    list.forEach(function (t) {
      if (!t) return;
      var title = String(t.title || '').trim();
      var s = Math.max(scoreField(norm(title), nq),
                       scoreField(norm(t.note || ''), nq) * 0.7,
                       scoreField(norm(t.course || ''), nq) * 0.8);
      if (!s) return;
      out.push({
        t: 'task', code: t.course || '', kind: t.type || 'other',
        due: t.due || '', done: !!t.done,
        ar: title || typeWord(t.type), en: title || typeWord(t.type),
        url: 'index.html#tasks',
        /*@3.SEAJ.44*/
        score: s * (t.done ? 0.45 : 1)
      });
    });
  }

  /*@3.SEAJ.45*/
  function searchCourseDates(nq, out) {
    lsKeys().forEach(function (k) {
      var m = /^course_meta_([A-Z0-9_]+)$/.exec(k || '');
      if (!m) return;
      var meta = lsJSON(k, null);
      ((meta && meta.dates) || []).forEach(function (d) {
        if (!d || !d.title) return;
        var s = scoreField(norm(d.title), nq);
        if (!s) return;
        out.push({
          t: 'task', code: m[1], kind: d.type || 'assignment',
          due: d.date || '', done: !!d.done,
          ar: d.title, en: d.title,
          url: 'hub/course.html?code=' + encodeURIComponent(m[1]),
          score: s * (d.done ? 0.45 : 1)
        });
      });
    });
  }

  /*@3.SEAJ.46*/
  function searchSections(nq, out) {
    var d = lsJSON('weekly_schedule', null);
    if (!d || typeof d !== 'object') return;
    var boxes = [d];
    Object.keys(d.archived || {}).forEach(function (k) { boxes.push(d.archived[k]); });
    var seen = {};
    boxes.forEach(function (b) {
      if (!b) return;
      (b.lectures || []).concat(b.exams || []).forEach(function (r) {
        if (!r || !r.sx_crn) return;
        var key = (r.course_code || '') + '|' + r.sx_crn;
        if (seen[key]) return;
        seen[key] = 1;
        var s = Math.max(scoreField(norm(r.sx_crn), nq), scoreField(norm(r.course_code || ''), nq));
        if (!s) return;
        out.push({
          t: 'section', code: r.course_code || '', crn: r.sx_crn,
          ar: 'شعبة ' + r.sx_crn, en: 'Section ' + r.sx_crn,
          url: 'hub/sections.html?q=' + encodeURIComponent(r.sx_crn),
          score: s
        });
      });
    });
  }

  /*@3.SEAJ.47*/
  function searchInstructors(nq, out) {
    var seen = {};
    lsKeys().forEach(function (k) {
      var m = /^course_meta_([A-Z0-9_]+)$/.exec(k || '');
      if (!m) return;
      var meta = lsJSON(k, null);
      ((meta && meta.instructors) || []).forEach(function (ins) {
        if (!ins || !ins.name) return;
        var s = Math.max(scoreField(norm(ins.name), nq), scoreField(norm(ins.email || ''), nq));
        if (!s) return;
        seen[norm(ins.name)] = 1;
        out.push({
          t: 'instructor', code: m[1], mine: true,
          ar: ins.name, en: ins.name,
          url: 'hub/course.html?code=' + encodeURIComponent(m[1]),
          /*@3.SEAJ.48*/
          score: s + 20
        });
      });
    });

    loadFaculty();
    (fac || []).forEach(function (row) {
      var s = Math.max(scoreField(row.n, nq), scoreField(row.e, nq));
      if (!s) s = scoreField(row.c, nq) * 0.5;
      if (!s) return;
      /*@3.SEAJ.49*/
      if (seen[row.n]) return;
      var f = row.f;
      out.push({
        t: 'instructor', code: (f.c || [])[0] || '',
        rate: f.idx, n: f.n,
        ar: f.name, en: f.en || f.name,
        url: 'hub/faculty.html#' + encodeURIComponent(f.id),
        score: s
      });
    });
  }

  /*@3.SEAJ.50*/
  function searchLabs(nq, out) {
    loadLabs();
    (labs || []).forEach(function (row) {
      var s = Math.max(scoreField(row.nar, nq), scoreField(row.nen, nq));
      if (!s) s = scoreField(row.nkw, nq) * 0.55;
      if (!s) return;
      var l = row.lab;
      out.push({
        t: 'lab', code: row.codes[0] || '',
        ar: (l.title && l.title.ar) || '', en: (l.title && l.title.en) || (l.title && l.title.ar) || '',
        url: l.route || ('labs/' + l.id + '.html'),
        score: s
      });
    });
  }

  function searchNotes(q) {
    var out = [];
    var nq = norm(q);
    if (!nq) return out;

    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var m = /^garden_([A-Z0-9]+)_m(\d+)_notes$/.exec(k || '');
      if (m) {
        var data = null;
        try { data = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        var arr = Array.isArray(data) ? data : Object.values(data || {});
        arr.forEach(function (n) {
          if (!n) return;
          var body = n.note || n.text || n.body || '';
          var quote = n.quote || n.selection || '';
          if (norm(body).indexOf(nq) === -1 && norm(quote).indexOf(nq) === -1) return;
          var mn = parseInt(m[2], 10);
          /*@3.SEAJ.10*/
          out.push({
            t: 'note', code: m[1], m: mn,
            ar: body || quote, en: body || quote,
            url: moduleUrl(m[1], mn), score: 40
          });
        });
        continue;
      }

      var cm = /^course_meta_([A-Z0-9_]+)$/.exec(k || '');
      if (cm) {
        var meta = null;
        try { meta = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        (meta && meta.notes || []).forEach(function (n) {
          var t = (n.title || '') + ' ' + (n.body || '');
          if (norm(t).indexOf(nq) === -1) return;
          out.push({
            t: 'note', code: cm[1], ar: n.title || n.body, en: n.title || n.body,
            url: 'hub/course.html?code=' + encodeURIComponent(cm[1]), score: 40
          });
        });
      }
    }

    try {
      (JSON.parse(localStorage.getItem('quick_notes') || '[]') || []).forEach(function (n) {
        if (!n || !n.body) return;
        if (norm(n.body).indexOf(nq) === -1) return;
        out.push({ t: 'note', code: '', ar: n.body, en: n.body, url: 'index.html', score: 40 });
      });
    } catch (e) {}

    return out;
  }

  /*@3.SEAJ.11*/

  var semCodes = null;
  function mySemesterCodes() {
    if (semCodes) return semCodes;
    semCodes = {};
    try {
      var s = JSON.parse(localStorage.getItem('my_semester') || 'null');
      (s && s.courses || []).forEach(function (c) { if (c && c.code) semCodes[c.code] = true; });
    } catch (e) {}
    return semCodes;
  }

  function scoreField(hay, nq) {
    if (!hay) return 0;
    var i = hay.indexOf(nq);
    if (i === -1) return 0;
    if (i === 0) return 100;                                   /*@3.SEAJ.12*/
    if (hay.charAt(i - 1) === ' ') return 70;                  /*@3.SEAJ.13*/
    return 40;                                                 /*@3.SEAJ.14*/
  }

  /*@3.SEAJ.51*/
  var TYPE_WEIGHT = { course: 12, module: 6, concept: 0, note: 3,
                      task: 10, section: 11, instructor: 8, lab: 7 };

  function search(q) {
    var nq = norm(q);
    if (nq.length < MIN_CHARS) return [];
    var mine = mySemesterCodes();
    var out = [];

    (index || []).forEach(function (it) {
      var s = Math.max(scoreField(it.nar, nq), scoreField(it.nen, nq));
      if (!s) s = scoreField(it.ncode, nq);          /*@3.SEAJ.15*/
      if (!s) {
        var k = scoreField(it.nkw, nq);
        if (!k) return;
        s = k * 0.55;                    /*@3.SEAJ.16*/
      }
      s += TYPE_WEIGHT[it.e.t] || 0;
      if (mine[it.e.code]) s += 25;
      out.push({ e: it.e, score: s });
    });

    var seenCrn = {};
    searchMine(q).forEach(function (n) {
      if (n.t === 'section') seenCrn[n.crn] = 1;
      out.push({ e: n, score: n.score + (TYPE_WEIGHT[n.t] || 0) + (mine[n.code] ? 25 : 0) });
    });

    /*@3.SEAJ.52*/
    if (CRN_RE.test(q.trim()) && !seenCrn[q.trim()]) {
      var crn = q.trim();
      out.push({
        e: { t: 'crn', code: '', crn: crn,
             ar: 'افتح الشعبة ' + crn, en: 'Open section ' + crn,
             url: 'hub/sections.html?q=' + crn },
        score: 400
      });
    }

    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (a.e.ar || '').length - (b.e.ar || '').length;   /*@3.SEAJ.17*/
    });
    return out.slice(0, MAX_RESULTS);
  }

  /*@3.SEAJ.18*/

  /*@3.SEAJ.53*/
  var GROUP = {
    crn:        ['<i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>', 'رقم شعبة', 'CRN'],
    course:     ['<i class="fa-solid fa-book" aria-hidden="true"></i>', 'مواد', 'Courses'],
    task:       ['<i class="fa-solid fa-list-check" aria-hidden="true"></i>', 'مهامي وواجباتي', 'My tasks'],
    section:    ['<i class="fa-solid fa-layer-group" aria-hidden="true"></i>', 'شعبي', 'My sections'],
    instructor: ['<i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i>', 'أساتذة', 'Instructors'],
    lab:        ['<i class="fa-solid fa-flask" aria-hidden="true"></i>', 'مختبرات', 'Labs'],
    module:     ['<i class="fa-solid fa-book-open" aria-hidden="true"></i>', 'وحدات', 'Modules'],
    concept:    ['<i class="fa-solid fa-lightbulb" aria-hidden="true"></i>', 'مفاهيم', 'Concepts'],
    note:       ['<i class="fa-solid fa-note-sticky" aria-hidden="true"></i>', 'ملاحظاتي', 'My notes']
  };
  var ORDER = ['crn', 'course', 'task', 'section', 'instructor', 'lab', 'module', 'concept', 'note'];

  function highlight(text, nq) {
    var n = norm(text);
    var i = n.indexOf(nq);
    if (i === -1) return esc(text);
    /*@3.SEAJ.19*/
    var raw = String(text);
    if (raw.length !== n.length) return esc(raw);   /*@3.SEAJ.20*/
    return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + nq.length)) +
           '</mark>' + esc(raw.slice(i + nq.length));
  }

  function render(q) {
    var nq = norm(q);
    if (!panel) return;

    if (nq.length < MIN_CHARS) { close(); return; }
    results = search(q);
    active = -1;

    if (!results.length) {
      panel.innerHTML = '<div class="gs-empty">' +
        esc(tx('لا نتائج لـ «' + q + '»', 'No results for “' + q + '”')) + '</div>';
      open();
      return;
    }

    /*@3.SEAJ.21*/
    var buckets = {};
    ORDER.forEach(function (t) { buckets[t] = []; });
    results.forEach(function (r) { (buckets[r.e.t] || buckets.concept).push(r.e); });

    var html = '';
    var idx = 0;
    ORDER.forEach(function (t) {
      var list = buckets[t];
      if (!list.length) return;
      var g = GROUP[t];
      html += '<div class="gs-group">' + g[0] + ' ' + esc(tx(g[1], g[2])) + '</div>';
      /*@3.SEAJ.54*/
      list.slice(0, GROUP_CAP).forEach(function (e) {
        var title = isAr() ? (e.ar || e.en) : (e.en || e.ar);
        var sub = subOf(e);
        html += '<a class="gs-item" data-i="' + (idx++) + '" href="' + esc(hrefFor(e)) + '" role="option">' +
          '<span class="gs-item-title">' + highlight(title, nq) + '</span>' +
          (sub ? '<span class="gs-item-sub">' + esc(sub) + '</span>' : '') +
        '</a>';
      });
    });
    panel.innerHTML = html;
    open();
  }

  /*@3.SEAJ.55*/
  function subOf(e) {
    if (e.t === 'crn') return tx('في صفحة الشعب', 'in Sections');
    if (e.t === 'course') return e.code || '';
    if (e.t === 'task') {
      var bits = [typeWord(e.kind)];
      if (e.code) bits.push(e.code);
      if (e.due) bits.push(e.due);
      if (e.done) bits.push(tx('منجزة', 'done'));
      return bits.join(' · ');
    }
    if (e.t === 'section') return e.code || '';
    if (e.t === 'instructor') {
      /*@3.SEAJ.56*/
      if (e.mine) return (e.code ? e.code + ' · ' : '') + tx('دكتور مادتك', 'your instructor');
      if (e.rate != null) return tx('التقييم ' + Math.round(e.rate) + '٪', Math.round(e.rate) + '% rating') +
        (e.n ? ' · ' + tx('من ' + e.n, 'of ' + e.n) : '');
      return e.code || tx('لا تقييمات بعد', 'no ratings yet');
    }
    if (e.t === 'lab') return tx('مختبر تفاعلي', 'Interactive lab') + (e.code ? ' · ' + e.code : '');
    if (e.m) return e.code + ' · ' + tx('وحدة ' + e.m, 'Module ' + e.m);
    return e.code || '';
  }

  function hrefFor(e) {
    if (!e.url) return '#';
    if (/^(https?:)?\/\//.test(e.url)) return e.url;
    return ROOT + e.url;
  }

  function open() { if (panel) { panel.hidden = false; box.classList.add('gs-open'); input.setAttribute('aria-expanded', 'true'); } }
  function close() { if (panel) { panel.hidden = true; box.classList.remove('gs-open'); input.setAttribute('aria-expanded', 'false'); active = -1; } }

  function setActive(i) {
    var items = panel.querySelectorAll('.gs-item');
    if (!items.length) return;
    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;
    active = i;
    items.forEach(function (el, j) {
      el.classList.toggle('is-active', j === i);
      if (j === i) {
        el.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', 'gs-opt-' + j);
        el.id = 'gs-opt-' + j;
      }
    });
  }

  /*@3.SEAJ.22*/

  var timer = null;
  function onInput() {
    clearTimeout(timer);
    var q = input.value;
    timer = setTimeout(function () {
      loadIndex().then(function () { render(q); });
    }, 90);
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); input.blur(); return; }
    if (panel.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      var items = panel.querySelectorAll('.gs-item');
      if (active > -1 && items[active]) { e.preventDefault(); items[active].click(); }
    }
  }

  function init() {
    box = document.getElementById('gs-box');
    input = document.getElementById('gs-input');
    panel = document.getElementById('gs-panel');
    if (!box || !input || !panel) return;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'listbox');

    /*@3.SEAJ.23*/
    input.addEventListener('focus', function () { loadIndex(); }, { once: true });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);

    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) close();
    });

    /*@3.SEAJ.24*/
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault(); input.focus(); input.select();
      } else if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault(); input.focus();
      }
    });

    document.addEventListener('garden:languageChanged', function () {
      semCodes = null;
      if (!panel.hidden) render(input.value);
      refreshPlaceholder();
    });

    setupPlaceholder();
  }

  /*@3.SEAJ.25*/
  var _ph, _phMask;
  function isArLang() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function setupPlaceholder() {
    _ph = document.getElementById('gs-ph');
    _phMask = box ? box.querySelector('.dash-search-ph-mask') : null;
    if (!_ph || !_phMask) return;
    input.addEventListener('focus', function () { _ph.classList.add('is-paused'); });
    input.addEventListener('blur', function () { if (!input.value) _ph.classList.remove('is-paused'); refreshPlaceholder(); });
    input.addEventListener('input', function () { togglePlaceholder(); });
    var rt = null;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(refreshPlaceholder, 200); });
    /*@3.SEAJ.26*/
    if (window.ResizeObserver) {
      try { new ResizeObserver(function () { refreshPlaceholder(); }).observe(_phMask); } catch (e) {}
    }
    refreshPlaceholder();
  }
  function togglePlaceholder() {
    if (!_ph) return;
    _ph.hidden = !!input.value;   /*@3.SEAJ.27*/
  }
  function refreshPlaceholder() {
    if (!_ph || !_phMask) return;
    _ph.textContent = _ph.getAttribute(isArLang() ? 'data-ar' : 'data-en') || '';
    togglePlaceholder();
    _ph.classList.remove('is-marquee');
    _ph.style.removeProperty('--mq-shift');
    if (input.value || reducedMotion()) return;
    /*@3.SEAJ.28*/
    var overflow = _ph.scrollWidth - _phMask.clientWidth;
    if (overflow <= 4) return;                 /*@3.SEAJ.29*/
    var sign = isArLang() ? 1 : -1;            /*@3.SEAJ.30*/
    _ph.style.setProperty('--mq-shift', (sign * overflow) + 'px');
    _ph.classList.add('is-marquee');
  }

  window.GardenSearch = { load: loadIndex, query: search, norm: norm };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
