/*@3.SXLJ.1*/

;(function () {
  'use strict';

  var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  var SCH_KEY = 'weekly_schedule';
  var PREF_KEY = 'sx_prefs';

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }

  /*@3.SXLJ.2*/
  var _dec = null;
  function unent(s) {
    if (typeof document === 'undefined' || !document.createElement) return String(s == null ? '' : s);
    if (!_dec) _dec = document.createElement('textarea');
    _dec.innerHTML = String(s == null ? '' : s);
    return _dec.value;
  }

  /*@3.SXLJ.3*/

  function schLoad(create) {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(SCH_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') {
      if (!create) return null;
      d = { version: 2, lectures: [], study_blocks: [], exams: [],
            general_events: [], week_overrides: {}, archived: {} };
    }
    if (!Array.isArray(d.lectures)) d.lectures = [];
    if (!Array.isArray(d.exams)) d.exams = [];
    return d;
  }

  function schSave(d) {
    d.updated_at = new Date().toISOString();
    try { localStorage.setItem(SCH_KEY, JSON.stringify(d)); }
    catch (e) { return false; }
    /*@3.SXLJ.4*/
    try { localStorage.setItem('__syncT_' + SCH_KEY, String(Date.now())); } catch (e) {}
    return true;
  }

  /*@3.SXLJ.5*/
  function hm24(v) {
    var x = String(v == null ? '' : v);
    if (x.length < 3) return '';
    return ('0' + x.slice(0, x.length - 2)).slice(-2) + ':' + x.slice(-2);
  }
  /*@3.SXLJ.6*/
  function iso(v) {
    var p = String(v || '').split('/');
    if (p.length !== 3) return '';
    return p[2] + '-' + ('0' + p[0]).slice(-2) + '-' + ('0' + p[1]).slice(-2);
  }
  var EXAM_KIND = { MEXM: 'midterm', FEXM: 'final' };
  /*@3.SXLJ.7*/
  function examHM(v) {
    var x = hm24(v);
    if (!x) return '';
    var h = parseInt(x.slice(0, 2), 10);
    if (h >= 1 && h <= 11) h += 12;
    return ('0' + h).slice(-2) + x.slice(2);
  }

  /*@3.SXLJ.8*/
  function lecSnap(l) {
    return [l.day || '', l.start_time || '', l.end_time || '',
            l.room || '', l.attendance || '', l.kind || ''].join('|');
  }
  function exSnap(x) {
    return [x.date || '', x.start_time || '', x.end_time || '',
            x.room || '', x.exam_type || ''].join('|');
  }

  /*@3.SXLJ.9*/
  function rowsFor(sec) {
    var lec = [], ex = [];
    (sec.mg || []).forEach(function (m, mi) {
      var kind = EXAM_KIND[m.type];
      if (kind) {
        var dt = iso(m.start_date);
        if (!dt) return;
        /*@3.SXLJ.10*/
        var raw = examHM(m.begin);
        ex.push({
          id: 'sx_' + sec.crn + '_x' + mi,
          course_code: sec.c, date: dt,
          start_time: raw, end_time: examHM(m.end), all_day: false,
          exam_type: kind, room: m.room || '',
          notes: t('شعبة ', 'Section ') + sec.crn,
          sx_crn: String(sec.crn)
        });
        ex[ex.length - 1].sx_snap = exSnap(ex[ex.length - 1]);
        return;
      }
      if (m.type !== 'CLAS' && m.type !== 'VRTL') return;
      (m.days || []).forEach(function (day) {
        lec.push({
          id: 'sx_' + sec.crn + '_' + mi + '_' + day,
          course_code: sec.c, day: day,
          start_time: hm24(m.begin), end_time: hm24(m.end),
          room: m.type === 'CLAS' ? (m.room || '') : '',
          kind: 'lecture',
          attendance: m.type === 'CLAS' ? 'in_person' : 'remote',
          start_date: iso(m.start_date) || '',
          end_date: iso(m.end_date) || '',
          recurring: true, sx_crn: String(sec.crn)
        });
        lec[lec.length - 1].sx_snap = lecSnap(lec[lec.length - 1]);
      });
    });
    return { lectures: lec, exams: ex };
  }

  /*@3.SXLJ.11*/
  function matcher(crn, sec) {
    var lecKey = {}, exKey = {};
    if (sec) {
      var rows = rowsFor(sec);
      rows.lectures.forEach(function (l) {
        lecKey[l.course_code + '|' + l.day + '|' + l.start_time] = 1;
      });
      rows.exams.forEach(function (x) {
        exKey[x.course_code + '|' + x.date + '|' + x.exam_type] = 1;
      });
    }
    crn = String(crn);
    return {
      code: sec ? sec.c : null,
      lec: function (r) {
        return r.sx_crn === crn ||
               (!r.sx_crn && !!lecKey[r.course_code + '|' + r.day + '|' + r.start_time]);
      },
      ex: function (r) {
        return r.sx_crn === crn ||
               (!r.sx_crn && !!exKey[r.course_code + '|' + r.date + '|' + r.exam_type]);
      }
    };
  }

  /*@3.SXLJ.12*/
  function boxes(d) {
    var out = [d];
    Object.keys(d.archived || {}).forEach(function (k) { out.push(d.archived[k]); });
    return out;
  }

  function has(crn, sec) {
    var d = schLoad();
    if (!d) return false;
    var m = matcher(crn, sec), hit = false;
    boxes(d).forEach(function (b) {
      (b.lectures || []).forEach(function (r) { if (m.lec(r)) hit = true; });
      (b.exams || []).forEach(function (r) { if (m.ex(r)) hit = true; });
    });
    return hit;
  }

  /*@3.SXLJ.13*/
  function registered() {
    var d = schLoad(), out = {};
    if (!d) return out;
    boxes(d).forEach(function (b) {
      (b.lectures || []).concat(b.exams || []).forEach(function (r) {
        if (r.sx_crn) out[r.sx_crn] = 1;
      });
    });
    return out;
  }

  /*@3.SXLJ.14*/
  function crnsOfCourse(code) {
    var d = schLoad(), out = [];
    if (!d || !code) return out;
    boxes(d).forEach(function (b) {
      (b.lectures || []).concat(b.exams || []).forEach(function (r) {
        if (r && r.course_code === code && r.sx_crn && out.indexOf(r.sx_crn) < 0) out.push(r.sx_crn);
      });
    });
    return out;
  }

  function toMin(hm) {
    var p = String(hm || '').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function hhmm(min) {
    var h = Math.floor(min / 60), m = min % 60, h12 = h % 12 || 12;
    return isAr() ? (h12 + ':' + ('0' + m).slice(-2) + ' ' + (h >= 12 ? 'م' : 'ص'))
                  : (h12 + ':' + ('0' + m).slice(-2) + (h >= 12 ? ' PM' : ' AM'));
  }

  /*@3.SXLJ.15*/
  function normName(v) {
    return String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function mergeInstructors(code, list) {
    if (!code || !Array.isArray(list) || !list.length) return 0;
    var key = 'course_meta_' + code, meta;
    try { meta = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { meta = {}; }
    if (!Array.isArray(meta.instructors)) meta.instructors = [];

    var byMail = {}, byName = {};
    meta.instructors.forEach(function (x) {
      if (!x) return;
      if (x.email) byMail[String(x.email).toLowerCase()] = 1;
      if (x.name) byName[normName(x.name)] = 1;
    });

    var n = 0;
    list.forEach(function (p) {
      var name = (p && (p.n || p)) || '';
      var mail = (p && p.e) || '';
      if (typeof name !== 'string' || !name.trim()) return;
      if (mail && byMail[String(mail).toLowerCase()]) return;
      if (byName[normName(name)]) return;
      meta.instructors.push({
        id: 'ins_sx_' + normName(mail || name).replace(/[^a-z0-9]+/g, '').slice(0, 24),
        name: String(name).trim(),
        email: String(mail || ''),
        office_hours: '', location: '', note: '',
        from_sections: true
      });
      if (mail) byMail[String(mail).toLowerCase()] = 1;
      byName[normName(name)] = 1;
      n++;
    });

    if (!n) return 0;
    meta.updated_at = Date.now();
    try { localStorage.setItem(key, JSON.stringify(meta)); } catch (e) { return 0; }
    return n;
  }

  function register(secs) {
    var d = schLoad(true);
    var have = {}, seenEx = {};
    d.lectures.concat(d.exams).forEach(function (r) { if (r.id) have[r.id] = 1; });
    d.exams.forEach(function (x) {
      seenEx[x.course_code + '|' + x.date + '|' + x.exam_type] = 1;
    });

    /*@3.SXLJ.16*/
    var byId = {};
    d.lectures.forEach(function (r) { if (r && r.id) byId[r.id] = r; });
    d.exams.forEach(function (r) { if (r && r.id) byId[r.id] = r; });

    /*@3.SXLJ.17*/
    var rep = { added: 0, updated: 0, kept: [] };
    var snapStamped = false;      /*@3.SXLJ.18*/

    /*@3.SXLJ.19*/
    function reconcile(fresh, snapOf, apply) {
      var cur = byId[fresh.id];
      if (!cur) return 'add';
      var stored = cur.sx_snap;
      if (!stored) {
        /*@3.SXLJ.20*/
        if (snapOf(cur) === snapOf(fresh)) { cur.sx_snap = snapOf(fresh); snapStamped = true; return 'same'; }
        return 'keep';
      }
      if (snapOf(cur) !== stored) return 'keep';        /*@3.SXLJ.21*/
      if (stored === snapOf(fresh)) return 'same';      /*@3.SXLJ.22*/
      apply(cur, fresh);                                /*@3.SXLJ.23*/
      cur.sx_snap = snapOf(fresh);
      return 'update';
    }

    /*@3.SXLJ.24*/
    function describeLec(cur, fresh) {
      var bits = [];
      if ((cur.room || '') !== (fresh.room || '')) {
        bits.push(t('القاعة ', 'Room ') + (fresh.room || '—'));
      }
      if ((cur.start_time || '') !== (fresh.start_time || '') ||
          (cur.end_time || '') !== (fresh.end_time || '')) {
        bits.push(t('الوقت ', 'Time ') + hhmm(toMin(fresh.start_time)) + ' – ' + hhmm(toMin(fresh.end_time)));
      }
      if ((cur.attendance || '') !== (fresh.attendance || '')) {
        bits.push(fresh.attendance === 'remote' ? t('صار عن بُعد', 'now remote') : t('صار حضورياً', 'now in-person'));
      }
      return bits.join(' · ');
    }

    var n = 0, courses = {};
    (secs || []).forEach(function (sec) {
      if (!sec || !sec.crn) return;
      var crn = String(sec.crn);
      var rows = rowsFor(sec), added = 0;
      rows.lectures.forEach(function (l) {
        var verdict = reconcile(l, lecSnap, function (cur, fresh) {
          cur.day = fresh.day;
          cur.start_time = fresh.start_time; cur.end_time = fresh.end_time;
          cur.room = fresh.room; cur.attendance = fresh.attendance; cur.kind = fresh.kind;
          /*@3.SXLJ.25*/
        });
        if (verdict === 'add') {
          d.lectures.push(l); byId[l.id] = l; have[l.id] = 1; added++; rep.added++;
        } else if (verdict === 'update') {
          rep.updated++; added++;
        } else if (verdict === 'keep') {
          var why = describeLec(byId[l.id], l);
          if (why) rep.kept.push({ code: l.course_code, crn: crn, why: why });
        }
      });
      rows.exams.forEach(function (x) {
        /*@3.SXLJ.26*/
        if (byId[x.id]) {
          var v = reconcile(x, exSnap, function (cur, fresh) {
            cur.date = fresh.date;
            cur.start_time = fresh.start_time; cur.end_time = fresh.end_time;
            cur.room = fresh.room; cur.exam_type = fresh.exam_type;
          });
          if (v === 'update') { rep.updated++; added++; }
          else if (v === 'keep') {
            var cur2 = byId[x.id];
            var bits2 = [];
            if ((cur2.date || '') !== (x.date || '')) bits2.push(t('التاريخ ', 'Date ') + x.date);
            if ((cur2.room || '') !== (x.room || '')) bits2.push(t('القاعة ', 'Room ') + (x.room || '—'));
            if (bits2.length) rep.kept.push({ code: x.course_code, crn: crn, why: bits2.join(' · ') });
          }
          return;
        }
        if (have[x.id]) return;
        /*@3.SXLJ.27*/
        var k = x.course_code + '|' + x.date + '|' + x.exam_type;
        if (seenEx[k]) return;
        seenEx[k] = 1;
        d.exams.push(x); have[x.id] = 1; added++;
      });
      /*@3.SXLJ.42*/
      if (added) { n++; courses[sec.c] = { sec: sec, crn: crn }; }
      mergeInstructors(sec.c, sec.f);
    });

    /*@3.SXLJ.28*/
    var dirty = rep.added || rep.updated || snapStamped;
    if (!dirty) return { n: 0, report: rep, saved: true };
    if (!n) { return { n: 0, report: rep, saved: schSave(d) }; }   /*@3.SXLJ.29*/

    var pend = (d.sx_pending && typeof d.sx_pending === 'object') ? d.sx_pending : null;
    var keep = (pend && Array.isArray(pend.courses)) ? pend.courses : [];
    Object.keys(courses).forEach(function (code) {
      var sec = courses[code].sec;
      var old = null;
      keep.forEach(function (x) { if (x.code === code) old = x; });
      if (!old) {
        old = { code: code, title: unent(sec.t || ''), ch: parseFloat(sec.ch) || 0, crns: [] };
        keep.push(old);
      }
      if (old.crns.indexOf(courses[code].crn) < 0) old.crns.push(courses[code].crn);
    });
    d.sx_pending = { at: new Date().toISOString(), courses: keep };
    if (!schSave(d)) return { n: 0, report: rep, saved: false };
    return { n: n, report: rep, saved: true };
  }

  /*@3.SXLJ.30*/
  function unregister(crn, sec) {
    var d = schLoad();
    if (!d) return 0;
    crn = String(crn);
    var m = matcher(crn, sec), code = m.code, n = 0;
    boxes(d).forEach(function (box) {
      if (Array.isArray(box.lectures)) {
        var l0 = box.lectures.length;
        box.lectures = box.lectures.filter(function (r) { return !m.lec(r); });
        n += l0 - box.lectures.length;
      }
      if (Array.isArray(box.exams)) {
        var x0 = box.exams.length;
        box.exams = box.exams.filter(function (r) { return !m.ex(r); });
        n += x0 - box.exams.length;
      }
    });

    /*@3.SXLJ.31*/
    if (d.sx_pending && Array.isArray(d.sx_pending.courses)) {
      d.sx_pending.courses = d.sx_pending.courses.filter(function (c) {
        c.crns = (c.crns || []).filter(function (x) { return String(x) !== crn; });
        return c.crns.length;
      });
      if (!d.sx_pending.courses.length) delete d.sx_pending;
    }

    /*@3.SXLJ.32*/
    if (code && !anyEventFor(d, code)) {
      if (d.archived && d.archived[code] &&
          !(d.archived[code].lectures || []).length &&
          !(d.archived[code].exams || []).length &&
          !(d.archived[code].study_blocks || []).length) delete d.archived[code];
      dropFromSemester(code);
    }
    if (n) schSave(d);
    return n;
  }

  function anyEventFor(d, code) {
    var hit = false;
    ['lectures', 'study_blocks', 'exams'].forEach(function (k) {
      (d[k] || []).forEach(function (e) { if (e.course_code === code) hit = true; });
    });
    Object.keys(d.archived || {}).forEach(function (a) {
      ['lectures', 'study_blocks', 'exams'].forEach(function (k) {
        ((d.archived[a] || {})[k] || []).forEach(function (e) {
          if (e.course_code === code) hit = true;
        });
      });
    });
    return hit;
  }

  function dropFromSemester(code) {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) { return; }
    if (!sem || !Array.isArray(sem.courses)) return;
    var keep = sem.courses.filter(function (c) {
      return !(c.code === code && c.from_sections);
    });
    if (keep.length === sem.courses.length) return;
    sem.courses = keep;
    sem.updated_at = new Date().toISOString();
    try { localStorage.setItem('my_semester', JSON.stringify(sem)); } catch (e) { return; }
    try { localStorage.setItem('__syncT_my_semester', String(Date.now())); } catch (e) {}
  }

  /*@3.SXLJ.39*/
  var CITY_AR = {
    'Riyadh': 'الرياض', 'Jeddah': 'جدة', 'Dammam': 'الدمام', 'Online': 'عن بعد',
    'Abha': 'أبها', 'Medinah': 'المدينة المنورة', 'Qasim': 'القصيم', 'Jazan': 'جازان',
    'Ahasa': 'الأحساء', 'Tabuk': 'تبوك', 'Najran': 'نجران', 'Jubail': 'الجبيل',
    'Hail': 'حائل', 'Yanbu': 'ينبع', 'Jouf': 'الجوف', 'Taif': 'الطائف',
    'Ula': 'العلا', 'Qurayyat': 'القريات', 'Undetermined': 'غير محدّد',
    'RI Online': 'عن بعد — RI', 'Riyadh-Online': 'الرياض · عن بعد',
    'Dammam-Online': 'الدمام · عن بعد', 'Jeddah-Online': 'جدة · عن بعد'
  };
  /*@3.SXLJ.40*/
  var _cc = {};
  function campusOf(raw) {
    var k = raw || '';
    if (_cc[k]) return _cc[k];
    var m = k.match(/^(.*?)[-\s](Males|Females)$/);
    var o = m ? { city: m[1], g: m[2] } : { city: k || 'Undetermined', g: '' };
    o.ar = CITY_AR[o.city] || o.city;
    _cc[k] = o;
    return o;
  }
  function campusLabel(raw) {
    var c = campusOf(raw);
    var city = isAr() ? c.ar : c.city;
    if (!c.g) return city;
    return city + ' · ' + (isAr() ? (c.g === 'Males' ? 'طلاب' : 'طالبات') : c.g);
  }
  function resetCampus() { _cc = {}; }

  /*@3.SXLJ.33*/

  var ACTIVE_PHASES = ['EMPTY', 'ARMED', 'LIVE', 'QUIET', 'POST'];
  var _termsP = null;

  function terms() {
    if (_termsP) return _termsP;
    if (!API) return Promise.reject(new Error('no-api'));
    _termsP = fetch(API + '/v1/terms')
      .then(function (r) { return r.ok ? r.json() : { terms: [] }; })
      .then(function (d) {
        var ts = (d.terms || []).filter(function (x) { return x.sections > 0; });
        if (!ts.length) throw new Error('no-terms');
        return ts;
      })
      .catch(function (e) { _termsP = null; throw e; });
    return _termsP;
  }

  /*@3.SXLJ.34*/
  function savedTerm() {
    try {
      var p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      return p && p.term ? String(p.term) : null;
    } catch (e) { return null; }
  }

  /*@3.SXLJ.35*/
  function rankedTerms(ts) {
    function bySize(a, b) { return b.sections - a.sections; }
    function isLive(x) { return ACTIVE_PHASES.indexOf(x.phase) >= 0; }
    /*@3.SXLJ.41*/
    var order = ts.filter(isLive).sort(bySize)
      .concat(ts.filter(function (x) { return !isLive(x); }).sort(bySize));
    var saved = savedTerm();
    if (saved) {
      var hit = ts.filter(function (x) { return x.term === saved; })[0];
      if (hit) {
        order = order.filter(function (x) { return x.term !== saved; });
        order.unshift(hit);
      }
    }
    return order;
  }

  var _cat = {};
  function catalog(term) {
    term = String(term);
    if (_cat[term]) return _cat[term];
    if (!API) return Promise.reject(new Error('no-api'));
    _cat[term] = fetch(API + '/v1/catalog/' + term + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('catalog-' + r.status);
        return r.json();
      })
      .then(function (d) { return d.sections || []; })
      .catch(function (e) { delete _cat[term]; throw e; });
    return _cat[term];
  }

  /*@3.SXLJ.36*/
  function cachedCatalog(term) {
    return !!_cat[String(term)];
  }

  /*@3.SXLJ.37*/
  function find(crn, opts) {
    opts = opts || {};
    crn = String(crn);
    return terms().then(function (ts) {
      var order = rankedTerms(ts);
      var limit = opts.all ? order.length : 1;
      var i = 0;
      function step() {
        if (i >= limit) return { sec: null, term: null, more: order.length > limit };
        var row = order[i++];
        return catalog(row.term).then(function (list) {
          var hit = null;
          list.forEach(function (s) { if (String(s.crn) === crn) hit = s; });
          if (hit) return { sec: hit, term: row.term, termRow: row, more: false };
          return step();
        }, function () { return step(); });
      }
      return step();
    });
  }

  /*@3.SXLJ.38*/
  window.GardenSXLink = {
    SCH_KEY: SCH_KEY,
    EXAM_KIND: EXAM_KIND,
    schLoad: schLoad, schSave: schSave,
    hm24: hm24, iso: iso, examHM: examHM,
    lecSnap: lecSnap, exSnap: exSnap,
    rowsFor: rowsFor, matcher: matcher, boxes: boxes,
    has: has, registered: registered, crnsOfCourse: crnsOfCourse,
    register: register, unregister: unregister,
    anyEventFor: anyEventFor, dropFromSemester: dropFromSemester,
    CITY_AR: CITY_AR,
    campusOf: campusOf, campusLabel: campusLabel, resetCampus: resetCampus,
    terms: terms, rankedTerms: rankedTerms, savedTerm: savedTerm,
    catalog: catalog, cachedCatalog: cachedCatalog, find: find,
    ready: function () { return !!API; }
  };
})();
