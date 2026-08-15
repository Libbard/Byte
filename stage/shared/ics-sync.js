/*@3.ICSJ.1*/
;(function () {
  'use strict';

  var LS_KEY = 'garden_ics';
  var VERSION = 1;

  /*@3.ICSJ.2*/
  var FRESH_MS = 6 * 60 * 60 * 1000;

  /*@3.ICSJ.3*/
  var FEED_RE = /^https:\/\/lms\.seu\.edu\.sa\/webapps\/calendar\/calendarFeed\/[0-9a-fA-F]{16,64}\/learn\.ics$/;

  /*@3.ICSJ.4*/

  function blank() {
    return {
      v: VERSION,
      url: '',              /*@3.ICSJ.5*/
      on_server: false,     /*@3.ICSJ.6*/
      auto: true,           /*@3.ICSJ.7*/
      lead_days: 2,         /*@3.ICSJ.8*/
      last_try: 0,
      last_ok: 0,
      last_err: '',
      stamp: '',            /*@3.ICSJ.9*/
      links: {},            /*@3.ICSJ.10*/
      uid_map: {},          /*@3.ICSJ.11*/
      ranges: [],           /*@3.ICSJ.12*/
      inbox: [],            /*@3.ICSJ.13*/
      skip: {},             /*@3.ICSJ.14*/
      count: 0              /*@3.ICSJ.15*/
    };
  }

  var state = null;

  /*@3.ICSJ.68*/
  var RUN_KEY = 'garden_ics_run';
  var RUN_FIELDS = ['stamp', 'last_try', 'last_ok', 'last_err', 'count', 'inbox'];

  function isRun(k) { return RUN_FIELDS.indexOf(k) > -1; }

  var lastDur = '';

  function load() {
    if (state) return state;
    var raw = null, run = null;
    try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
    try { run = JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); } catch (e) {}
    if (!raw || typeof raw !== 'object') raw = {};
    if (run && typeof run === 'object') {
      RUN_FIELDS.forEach(function (k) { if (run[k] !== undefined) raw[k] = run[k]; });
    }
    state = repair(raw);
    lastDur = '';
    return state;
  }

  /*@3.ICSJ.16*/
  function repair(s) {
    var d = blank();
    if (!s || typeof s !== 'object') return d;
    Object.keys(d).forEach(function (k) { if (s[k] === undefined) s[k] = d[k]; });
    if (typeof s.url !== 'string' || !FEED_RE.test(s.url)) s.url = '';
    if (!s.links || typeof s.links !== 'object') s.links = {};
    if (!s.uid_map || typeof s.uid_map !== 'object') s.uid_map = {};
    if (!s.skip || typeof s.skip !== 'object') s.skip = {};
    if (!Array.isArray(s.ranges)) s.ranges = [];
    if (!Array.isArray(s.inbox)) s.inbox = [];
    if (typeof s.lead_days !== 'number' || s.lead_days < 0 || s.lead_days > 14) s.lead_days = 2;
    s.v = VERSION;
    return s;
  }

  /*@3.ICSJ.69*/
  function save() {
    if (!state) return false;
    var dur = {}, run = {};
    Object.keys(state).forEach(function (k) {
      if (isRun(k)) run[k] = state[k]; else dur[k] = state[k];
    });
    try {
      /*@3.ICSJ.70*/
      var js = JSON.stringify(dur);
      if (js !== lastDur) { localStorage.setItem(LS_KEY, js); lastDur = js; }
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
      return true;
    } catch (e) { return false; }
  }

  /*@3.ICSJ.71*/
  try {
    window.addEventListener('garden:syncCompleted', function () {
      state = null; lastDur = '';
    });
  } catch (e) {}

  /*@3.ICSJ.18*/

  /*@3.ICSJ.19*/
  function unfold(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '');
  }

  function unescapeVal(v) {
    return String(v || '')
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .trim();
  }

  /*@3.ICSJ.20*/
  function parseDT(val, tzid) {
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(val || '').trim());
    if (!m) return null;
    var Y = +m[1], Mo = +m[2], D = +m[3];
    var H = m[4] === undefined ? null : +m[4];
    var Mi = m[5] === undefined ? 0 : +m[5];
    var dateOnly = (H === null);
    if (dateOnly) return { date: pad4(Y) + '-' + pad2(Mo) + '-' + pad2(D), time: '', all_day: true };

    var ms;
    if (m[7] === 'Z') ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0);
    else if (/riyadh|\+03/i.test(tzid || '')) ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0) - 3 * 3600e3;
    else if (tzid) ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0) - 3 * 3600e3;  /*@3.ICSJ.21*/
    else return { date: pad4(Y) + '-' + pad2(Mo) + '-' + pad2(D), time: pad2(H) + ':' + pad2(Mi), all_day: false };

    var d = new Date(ms);
    return {
      date: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
      time: pad2(d.getHours()) + ':' + pad2(d.getMinutes()),
      all_day: false
    };
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function pad4(n) { return String(n).padStart(4, '0'); }

  function parseICS(text) {
    var lines = unfold(text).split('\n');
    var out = [], cur = null, i, line, colon, left, val, name, params, semi, tzid;

    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (!line) continue;
      if (line.indexOf('BEGIN:VEVENT') === 0) { cur = { uid: '', summary: '', dtstart: null, dtend: null, status: '' }; continue; }
      if (line.indexOf('END:VEVENT') === 0) {
        if (cur && cur.uid && cur.dtstart) out.push(cur);
        cur = null; continue;
      }
      if (!cur) continue;

      colon = line.indexOf(':');
      if (colon < 0) continue;
      left = line.slice(0, colon);
      val  = line.slice(colon + 1);
      semi = left.indexOf(';');
      name = (semi < 0 ? left : left.slice(0, semi)).toUpperCase();
      params = semi < 0 ? '' : left.slice(semi + 1);
      tzid = /TZID=([^;]+)/i.exec(params);
      tzid = tzid ? tzid[1] : '';

      if (name === 'UID') cur.uid = unescapeVal(val);
      else if (name === 'SUMMARY') cur.summary = unescapeVal(val);
      else if (name === 'STATUS') cur.status = unescapeVal(val).toUpperCase();
      else if (name === 'DTSTART') cur.dtstart = parseDT(val, tzid);
      else if (name === 'DTEND') cur.dtend = parseDT(val, tzid);
    }
    return out.filter(function (e) { return e.status !== 'CANCELLED'; });
  }

  /*@3.ICSJ.22*/

  /*@3.ICSJ.23*/
  var KINDS = [
    { k: 'midterm',    re: /\bmid[\s\-_]?term\b|نصفي|النصفي/i },
    /*@3.ICSJ.24*/
    { k: 'final',      re: /\bfinal\s*(exam|test)\b|(?:[اإ]ختبار|امتحان)\s+(?:[ء-ي]+\s+)?(?:ال)?نهائي/i },
    { k: 'project',    re: /\bproject\b|مشروع/i },
    { k: 'assignment', re: /\bassign(ment)?\b|\bhomework\b|\bhw\s*\d|واجب/i },
    { k: 'quiz',       re: /\bquiz(zes)?\b|كويز|اختبار\s*قصير/i },
    { k: 'discussion', re: /\bdiscussion\b|\bforum\b|\bblog\b|مناقشة/i },
    { k: 'exam',       re: /\bexam\b|\btest\b|اختبار/i }
  ];

  /*@3.ICSJ.25*/
  var CODE_RE = /(?:^|[^A-Za-z0-9])([A-Za-z]{2,4})[\s_-]?(\d{3})(?![0-9])/;
  var CODE_G  = /(?:^|[^A-Za-z0-9])[A-Za-z]{2,4}[\s_-]?\d{3}(?![0-9])/g;

  function readSummary(sum) {
    var s = String(sum || '').trim();
    var kind = 'other', i;
    for (i = 0; i < KINDS.length; i++) { if (KINDS[i].re.test(s)) { kind = KINDS[i].k; break; } }

    /*@3.ICSJ.26*/
    var code = null;
    var cm = CODE_RE.exec(s);
    if (cm) code = (cm[1] + cm[2]).toUpperCase();

    /*@3.ICSJ.27*/
    var topic = s.replace(CODE_G, ' ')
                 .split(/[_–\-–—:]/).slice(1).join(' ').trim();
    if (!topic) topic = s.replace(/^\s*(quiz|assignment|exam|test|midterm|final|project|discussion)\s*\d*\s*/i, '').trim();

    var num = /(\d{1,2})/.exec(s.replace(CODE_G, ' '));
    return { kind: kind, code: code, topic: topic, num: num ? +num[1] : null, raw: s };
  }

  /*@3.ICSJ.28*/
  function itemNo(uid) {
    var m = /GradableItem[-_]+(\d{3,})/i.exec(String(uid || ''));
    return m ? +m[1] : null;
  }

  /*@3.ICSJ.29*/
  var CLUSTER_GAP = 12;

  function cluster(items) {
    var nums = items.map(function (e) { return e.no; }).filter(function (n) { return n !== null; })
                    .sort(function (a, b) { return a - b; });
    var groups = [], g = null, i;
    for (i = 0; i < nums.length; i++) {
      if (!g || nums[i] - g.hi > CLUSTER_GAP) { g = { lo: nums[i], hi: nums[i] }; groups.push(g); }
      else g.hi = nums[i];
    }
    return groups;
  }

  /*@3.ICSJ.30*/

  /*@3.ICSJ.31*/

  var idx = null, idxLoading = null;

  function loadIndex() {
    if (idx) return Promise.resolve(idx);
    if (idxLoading) return idxLoading;
    var root = (location.pathname.indexOf('/hub/') > -1 || location.pathname.indexOf('/labs/') > -1) ? '../' : '';
    idxLoading = fetch(root + 'shared/data/search_index.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = (j && j.entries) || [];
        idx = list.filter(function (e) { return e && e.code && (e.t === 'module' || e.t === 'concept'); })
                  .map(function (e) { return { code: e.code, en: norm(e.en), ar: norm(e.ar) }; });
        return idx;
      })
      .catch(function () { idx = []; return idx; });
    return idxLoading;
  }

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[^a-z0-9؀-ۿ ]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  /*@3.ICSJ.32*/
  var STOP = (' and the of to in for a an is are on with introduction intro basic basics ' +
              'chapter unit lesson part week من في إلى على عن مقدمة الفصل الوحدة ' +
              'quiz quizzes assignment assignments homework exam exams test tests ' +
              'midterm final project discussion forum blog due submission ' +
              'كويز واجب واجبات اختبار مشروع مناقشة تسليم ').split(' ');

  function words(s) {
    return norm(s).split(' ').filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; });
  }

  /*@3.ICSJ.33*/
  function guessCourse(topic, codes) {
    var w = words(topic);
    if (!w.length || !idx || !idx.length) return null;
    var score = {}, i, e, hit, j;
    for (i = 0; i < idx.length; i++) {
      e = idx[i];
      if (codes.indexOf(e.code) < 0) continue;      /*@3.ICSJ.34*/
      hit = 0;
      for (j = 0; j < w.length; j++) if (e.en.indexOf(w[j]) > -1 || e.ar.indexOf(w[j]) > -1) hit++;
      if (!hit) continue;
      /*@3.ICSJ.35*/
      var v = hit / w.length;
      if (!score[e.code] || score[e.code] < v) score[e.code] = v;
    }
    var best = null, second = 0;
    Object.keys(score).forEach(function (c) {
      if (!best || score[c] > score[best]) { second = best ? score[best] : 0; best = c; }
      else if (score[c] > second) second = score[c];
    });
    if (!best) return null;
    return { code: best, score: score[best], gap: score[best] - second };
  }

  /*@3.ICSJ.36*/
  var GUESS_MIN = 0.6;    /*@3.ICSJ.37*/
  var GUESS_GAP = 0.25;   /*@3.ICSJ.38*/

  function resolve(ev, codes) {
    var s = load();
    /*@3.ICSJ.39*/
    if (s.uid_map[ev.uid] && codes.indexOf(s.uid_map[ev.uid]) > -1) {
      return { code: s.uid_map[ev.uid], why: 'saved', sure: true };
    }
    /*@3.ICSJ.40*/
    if (ev.no !== null) {
      for (var i = 0; i < s.ranges.length; i++) {
        var r = s.ranges[i];
        if (ev.no >= r.lo - CLUSTER_GAP && ev.no <= r.hi + CLUSTER_GAP && codes.indexOf(r.code) > -1) {
          return { code: r.code, why: 'cluster', sure: true };
        }
      }
    }
    /*@3.ICSJ.41*/
    if (ev.code && codes.indexOf(ev.code) > -1) return { code: ev.code, why: 'code', sure: true };
    /*@3.ICSJ.42*/
    var g = guessCourse(ev.topic, codes);
    if (g && g.score >= GUESS_MIN && g.gap >= GUESS_GAP) {
      return { code: g.code, why: 'topic', sure: true, score: g.score };
    }
    return { code: g ? g.code : null, why: g ? 'weak' : 'none', sure: false, score: g ? g.score : 0 };
  }

  /*@3.ICSJ.43*/

  function api() {
    var E = window.GardenEndpoints || {};
    return String(E.sync || '').replace(/\/+$/, '');
  }

  function fetchFeed(url) {
    var base = api();
    if (!base) return Promise.reject(new Error('no_endpoint'));
    if (!FEED_RE.test(url)) return Promise.reject(new Error('bad_url'));
    return fetch(base + '/v1/ics/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || ('http_' + r.status));
        return j;
      });
    });
  }

  /*@3.ICSJ.44*/

  /*@3.ICSJ.45*/
  function snapOf(rec) {
    return [rec.date || '', rec.time || rec.start_time || '', rec.title || ''].join('|');
  }

  function myCourses() {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) {}
    var list = (sem && sem.courses ? sem.courses : []).filter(Boolean)
      .map(function (c) { return c.code; }).filter(Boolean);
    return list;
  }

  function schedRaw() {
    try { return JSON.parse(localStorage.getItem('weekly_schedule') || 'null'); } catch (e) { return null; }
  }
  function schedWrite(s) {
    s.updated_at = new Date().toISOString();
    try {
      localStorage.setItem('weekly_schedule', JSON.stringify(s));
      localStorage.setItem('__syncT_weekly_schedule', String(Date.now()));
      return true;
    } catch (e) { return false; }
  }

  var EXAMISH = { quiz: 1, exam: 1, midterm: 1, final: 1 };

  /*@3.ICSJ.46*/
  function applyOne(ev, code) {
    var s = load();
    var link = s.links[ev.uid] || null;
    var isExam = !!EXAMISH[ev.kind];
    var title = ev.raw;
    var when = ev.dtstart;

    /*@3.ICSJ.47*/
    if (link && link.store === 'exam' && !isExam) {
      var oldSch = schedRaw(), oldRow = null, q;
      if (oldSch && Array.isArray(oldSch.exams)) {
        for (q = 0; q < oldSch.exams.length; q++) {
          if (oldSch.exams[q] && oldSch.exams[q].id === link.id) { oldRow = oldSch.exams[q]; break; }
        }
      }
      if (!oldRow || !link.snap || link.snap === snapOf(oldRow)) removeLink(ev.uid);
      else delete s.links[ev.uid];
      link = null;
    }

    if (isExam) {
      var sch = schedRaw();
      if (!sch || !Array.isArray(sch.exams)) return false;
      var id = (link && link.store === 'exam') ? link.id : ('exam_ics_' + hash(ev.uid));
      var i = -1, k;
      for (k = 0; k < sch.exams.length; k++) if (sch.exams[k] && sch.exams[k].id === id) { i = k; break; }

      if (i > -1 && link && link.snap && link.snap !== snapOf(sch.exams[i])) return 'touched';

      /*@3.ICSJ.48*/
      var deadline = !ev.dtend || (ev.dtend.date === when.date && ev.dtend.time === when.time);
      var rec = {
        id: id,
        course_code: code,
        date: when.date,
        start_time: deadline ? '' : (when.time || ''),
        end_time: deadline ? '' : ((ev.dtend && ev.dtend.time) || ''),
        exam_type: (ev.kind === 'quiz' || ev.kind === 'midterm' || ev.kind === 'final') ? ev.kind : 'exam',
        room: '',
        notes: title,
        all_day: deadline,        /*@3.ICSJ.49*/
        ics_uid: ev.uid
      };
      if (i > -1) sch.exams[i] = rec; else sch.exams.push(rec);
      schedWrite(sch);
      s.links[ev.uid] = { store: 'exam', id: id, code: code, snap: snapOf(rec) };
      return true;
    }

    /*@3.ICSJ.50*/
    if (!window.GardenData || !GardenData.courseMeta) return false;
    var meta = GardenData.courseMeta(code);
    var did = (link && link.store === 'date') ? link.id : ('ics_' + hash(ev.uid));
    var j = -1, n;
    for (n = 0; n < meta.dates.length; n++) if (meta.dates[n] && meta.dates[n].id === did) { j = n; break; }

    if (j > -1 && link && link.snap && link.snap !== snapOf(meta.dates[j])) return 'touched';

    var d = {
      id: did,
      title: title,
      date: when.date,
      time: when.time || '',
      type: (ev.kind === 'assignment' || ev.kind === 'project' || ev.kind === 'discussion') ? ev.kind : 'assignment',
      done: (j > -1 && meta.dates[j].done) || false,   /*@3.ICSJ.51*/
      note: ''
    };
    if (j > -1) meta.dates[j] = d; else meta.dates.push(d);
    GardenData.saveCourseMeta(code, meta);
    s.links[ev.uid] = { store: 'date', id: did, code: code, snap: snapOf(d) };
    return true;
  }

  /*@3.ICSJ.52*/
  function hash(s) {
    var h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function removeLink(uid) {
    var s = load();
    var link = s.links[uid];
    if (!link) return false;
    if (link.store === 'exam') {
      var sch = schedRaw();
      if (sch && Array.isArray(sch.exams)) {
        var before = sch.exams.length;
        sch.exams = sch.exams.filter(function (e) { return !e || e.id !== link.id; });
        if (sch.exams.length !== before) schedWrite(sch);
      }
    } else if (link.store === 'date' && window.GardenData && GardenData.courseMeta) {
      var meta = GardenData.courseMeta(link.code);
      var n = meta.dates.length;
      meta.dates = meta.dates.filter(function (d) { return !d || d.id !== link.id; });
      if (meta.dates.length !== n) GardenData.saveCourseMeta(link.code, meta);
    }
    delete s.links[uid];
    return true;
  }

  /*@3.ICSJ.53*/

  /*@3.ICSJ.54*/
  function sync(opts) {
    opts = opts || {};
    var s = load();
    if (!s.url) return Promise.resolve({ ok: false, error: 'no_url' });

    s.last_try = Date.now(); save();

    return Promise.all([fetchFeed(s.url), loadIndex()]).then(function (r) {
      var body = r[0] && r[0].ics;
      if (!body) throw new Error('empty');

      var stamp = hash(body);
      var events = parseICS(body).map(function (e) {
        var head = readSummary(e.summary);
        return {
          uid: e.uid, raw: e.summary, kind: head.kind, code: head.code,
          topic: head.topic, num: head.num, no: itemNo(e.uid),
          dtstart: e.dtstart, dtend: e.dtend
        };
      }).filter(function (e) { return e.dtstart && e.dtstart.date; });

      s.count = events.length;

      /*@3.ICSJ.55*/
      var same = (stamp === s.stamp);
      s.stamp = stamp;

      var codes = myCourses();
      var rep = { ok: true, added: 0, updated: 0, touched: 0, pending: 0, gone: 0, unchanged: same, total: events.length };
      var seen = {}, inbox = [];

      events.forEach(function (ev) {
        seen[ev.uid] = 1;
        if (s.skip[ev.uid]) return;

        var r2 = resolve(ev, codes);
        if (!r2.sure || !r2.code) {
          rep.pending++;
          inbox.push({
            uid: ev.uid, raw: ev.raw, kind: ev.kind, no: ev.no,
            date: ev.dtstart.date, time: ev.dtstart.time,
            guess: r2.code || '', score: Math.round((r2.score || 0) * 100), why: r2.why
          });
          return;
        }
        var had = !!s.links[ev.uid];
        var out = applyOne(ev, r2.code);
        if (out === 'touched') rep.touched++;
        else if (out === true) { if (had) rep.updated++; else rep.added++; }
      });

      /*@3.ICSJ.56*/
      Object.keys(s.links).forEach(function (uid) { if (!seen[uid]) rep.gone++; });

      s.inbox = inbox;
      s.last_ok = Date.now();
      s.last_err = '';
      save();
      emit('ics:sync', rep);
      return rep;
    }).catch(function (e) {
      s.last_err = String((e && e.message) || e || 'error');
      save();
      emit('ics:sync', { ok: false, error: s.last_err });
      return { ok: false, error: s.last_err };
    });
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
  }

  /*@3.ICSJ.57*/

  /*@3.ICSJ.58*/
  function assign(uid, code, alsoCluster) {
    var s = load();
    if (!code) return false;
    s.uid_map[uid] = code;
    if (alsoCluster !== false) {
      var no = itemNo(uid);
      if (no !== null) {
        var g = null;
        s.inbox.forEach(function (it) {
          if (it.no === null) return;
          if (Math.abs(it.no - no) <= CLUSTER_GAP) { g = g || { lo: no, hi: no }; g.lo = Math.min(g.lo, it.no); g.hi = Math.max(g.hi, it.no); }
        });
        if (!g) g = { lo: no, hi: no };
        s.ranges.push({ lo: g.lo, hi: g.hi, code: code });
      }
    }
    save();
    return true;
  }

  function skip(uid) { var s = load(); s.skip[uid] = 1; save(); return true; }

  function unskip(uid) { var s = load(); delete s.skip[uid]; save(); return true; }

  /*@3.ICSJ.59*/
  function disconnect(alsoWipe) {
    var s = load();
    var url = s.url;
    if (alsoWipe) Object.keys(s.links).forEach(removeLink);
    s.url = ''; s.on_server = false; s.stamp = ''; s.inbox = []; s.last_ok = 0; s.last_err = '';
    save();
    var base = api();
    if (!base || !url) return Promise.resolve(true);
    return unregister().then(function () { return true; }, function () { return true; });
  }

  /*@3.ICSJ.60*/

  /*@3.ICSJ.72*/
  function vh(extra) {
    var S = window.GardenSync;
    if (S && S.vaultHeaders) return S.vaultHeaders(null, extra || {});
    return Object.assign({}, extra || {});
  }

  /*@3.ICSJ.61*/
  function register(pushId) {
    var s = load();
    var base = api();
    if (!base || !s.url) return Promise.resolve(false);
    return vaultId().then(function (vid) {
      if (!vid) return 'no-vault';
      return fetch(base + '/v1/ics/feed', {
        method: 'POST',
        headers: vh({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          vault_id: vid, url: s.url,
          push_id: pushId || vid, lead_days: s.lead_days
        })
      }).then(function (r) { return r.ok; }, function () { return false; });
    }).then(function (ok) {
      s.on_server = ok === true; save(); return ok;
    });
  }

  function unregister() {
    var base = api();
    if (!base) return Promise.resolve(false);
    return vaultId().then(function (vid) {
      if (!vid) return false;
      return fetch(base + '/v1/ics/feed?vault_id=' + encodeURIComponent(vid),
                   { method: 'DELETE', headers: vh() })
        .then(function (r) { return r.ok; }, function () { return false; });
    });
  }

  /*@3.ICSJ.67*/
  var VAULT_RE = /^v[0-9a-f]{32}$/;

  function vaultId() {
    try {
      if (window.GardenSync && GardenSync.vaultDocId) {
        return Promise.resolve(GardenSync.vaultDocId()).then(function (v) {
          return VAULT_RE.test(String(v || '')) ? String(v) : '';
        }, function () { return ''; });
      }
      var k = (window.GardenSync && GardenSync.getKey && GardenSync.getKey()) || '';
      return Promise.resolve(VAULT_RE.test(k) ? k : '');
    } catch (e) { return Promise.resolve(''); }
  }

  /*@3.ICSJ.62*/

  /*@3.ICSJ.63*/
  function bootSync() {
    var s = load();
    if (!s.url || !s.auto) return;
    if (Date.now() - s.last_ok < FRESH_MS) return;
    sync({ quiet: true });
  }

  window.GardenICS = {
    KEY: LS_KEY,
    FEED_RE: FEED_RE,
    state: load,
    save: save,
    setUrl: function (u) {
      var s = load();
      if (!FEED_RE.test(u || '')) return false;
      if (s.url !== u) { s.stamp = ''; s.inbox = []; }
      s.url = u; save(); return true;
    },
    setLead: function (n) { var s = load(); s.lead_days = Math.max(0, Math.min(14, n | 0)); save(); return s.lead_days; },
    setAuto: function (b) { var s = load(); s.auto = !!b; save(); return s.auto; },
    sync: sync,
    bootSync: bootSync,
    register: register,
    unregister: unregister,
    disconnect: disconnect,
    assign: assign,
    skip: skip,
    unskip: unskip,
    removeLink: removeLink,
    myCourses: myCourses,
    /*@3.ICSJ.64*/
    _parse: parseICS,
    _read: readSummary,
    _itemNo: itemNo,
    _cluster: cluster,
    _guess: guessCourse,
    _loadIndex: loadIndex,
    /*@3.ICSJ.65*/
    _setIndex: function (list) {
      idx = (list || []).filter(function (e) { return e && e.code && (e.t === 'module' || e.t === 'concept'); })
        .map(function (e) { return { code: e.code, en: norm(e.en), ar: norm(e.ar) }; });
      return idx.length;
    },
    _resolve: resolve,
    /*@3.ICSJ.66*/
    _applyOne: applyOne,
    _load: load,
    _snap: snapOf
  };

})();
