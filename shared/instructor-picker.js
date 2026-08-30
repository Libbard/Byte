/*@3.INPJ.1*/

;(function () {
  'use strict';

  var HEAD = 6;      /*@3.INPJ.2*/
  var MAX  = 40;     /*@3.INPJ.3*/

  var dlg = null, code = null, opts = {}, wired = false;

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function q(sel) { return dlg ? dlg.querySelector(sel) : null; }

  /*@3.INPJ.4*/
  function nrm(s) {
    return String(s || '')
      .replace(/[ً-ْٰ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/ؤ/g, 'و')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim().toLowerCase();
  }

  function facultyList() {
    var d = window.GardenFaculty && GardenFaculty.data();
    return (d && d.faculty) || [];
  }

  function tone(v) {
    if (v == null) return '';
    if (v >= 80) return 'ok';
    if (v >= 55) return 'mid';
    return 'bad';
  }

  function current(c) {
    if (!window.GardenData) return null;
    var m = GardenData.courseMeta(c);
    return (m.instructors || [])[0] || null;
  }

  /*@3.INPJ.5*/
  function build() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'gip-dlg';
    dlg.id = 'gip-dlg';
    dlg.setAttribute('aria-labelledby', 'gip-t');
    dlg.innerHTML =
      '<div class="gip-h">' +
        '<h2 class="gip-t" id="gip-t">' + esc(L('دكتور المادة', 'Course instructor')) + '</h2>' +
        '<button class="gip-ico" type="button" data-gip-close ' +
          'aria-label="' + esc(L('إغلاق', 'Close')) + '" title="' + esc(L('إغلاق', 'Close')) + '">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="gip-b">' +
        '<input type="search" class="gip-in" id="gip-q" autocomplete="off" spellcheck="false" ' +
          'aria-label="' + esc(L('ابحث عن أستاذ', 'Search instructors')) + '" aria-controls="gip-list">' +
        '<div class="gip-list" id="gip-list" role="listbox"></div>' +
      '</div>' +
      '<div class="gip-f">' +
        '<button class="gip-btn gip-btn--danger" type="button" id="gip-clear" hidden></button>' +
        '<button class="gip-btn" type="button" data-gip-close></button>' +
      '</div>';
    document.body.appendChild(dlg);
    wire();
  }

  /*@3.INPJ.6*/
  function relabel() {
    if (!dlg) return;
    q('#gip-q').placeholder = L('اكتب اسم الأستاذ… (عربي أو إنجليزي)',
                                'Type the instructor’s name… (Arabic or English)');
    q('#gip-clear').textContent = L('أزِل الدكتور', 'Remove instructor');
    dlg.querySelector('.gip-f [data-gip-close]').textContent = L('إلغاء', 'Cancel');
    var ico = dlg.querySelector('.gip-h [data-gip-close]');
    ico.setAttribute('aria-label', L('إغلاق', 'Close'));
    ico.setAttribute('title', L('إغلاق', 'Close'));
  }

  function render() {
    var host = q('#gip-list');
    if (!host) return;
    var GFQ = window.GardenFaculty && window.GardenFaculty.qPerson
      ? window.GardenFaculty : null;
    var raw = q('#gip-q').value;
    var query = GFQ ? GFQ.qPerson(raw) : nrm(raw).split(' ').filter(Boolean);
    var all = facultyList();
    var cur = current(code);

    if (!all.length) {
      host.innerHTML =
        '<div class="gip-empty"><i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>' +
        '<p>' + esc(L('لم تصل قائمةُ الأساتذة — اكتب الاسمَ يدوياً.',
                      'The faculty list hasn’t loaded — type the name manually.')) + '</p></div>' +
        manualRow(q('#gip-q').value);
      return;
    }

    var rows;
    if (!query.length) {
      /*@3.INPJ.7*/
      rows = all.filter(function (f) { return f.courses && f.courses[code]; })
        .sort(function (a, b) { return (b.courses[code] || 0) - (a.courses[code] || 0); })
        .slice(0, HEAD);
    } else {
      /*@3.INPJ.12*/
      rows = all.filter(function (f) {
        return GFQ ? GFQ.hitPerson(f._s || GFQ.hayPerson(f), query)
                   : nrm(f.name).indexOf(query.join(' ')) >= 0;
      }).sort(function (a, b) {
        /*@3.INPJ.8*/
        var ac = (a.courses && a.courses[code]) ? 1 : 0;
        var bc = (b.courses && b.courses[code]) ? 1 : 0;
        if (ac !== bc) return bc - ac;
        return (b.n || 0) - (a.n || 0);
      }).slice(0, MAX);
    }

    var html = '';
    if (!query.length && rows.length) {
      html += '<div class="gip-lbl">' + esc(L('أساتذةُ هذه المادة', 'Taught this course')) + '</div>';
    }
    if (!rows.length) {
      html += '<div class="gip-empty"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<p>' + esc(query.length ? L('لا أستاذ بهذا الاسم', 'No instructor by that name')
                          : L('لا نعرف من يدرّس هذه المادة — ابحث بالاسم.',
                              'We don’t know who teaches this course — search by name.')) + '</p></div>';
    }
    rows.forEach(function (f) {
      var nm = isAr() ? f.name : (f.en || f.name);
      var alt = isAr() ? f.en : f.name;
      var taught = f.courses && f.courses[code];
      var on = cur && (
        (cur.email && f.link && f.link.e && cur.email.toLowerCase() === String(f.link.e).toLowerCase()) ||
        nrm(cur.name) === nrm(f.name) || nrm(cur.name) === nrm(f.en));
      html += '<button class="gip-i" type="button" role="option" aria-selected="' + (on ? 'true' : 'false') + '"' +
          ' data-gip-id="' + esc(f.id) + '"' + (on ? ' data-on="1"' : '') + '>' +
        '<span class="gip-i-b">' +
          '<span class="gip-i-n">' + esc(nm) + '</span>' +
          '<span class="gip-i-m">' + (alt ? '<span class="ltr">' + esc(alt) + '</span>' : '') +
            (taught ? (alt ? ' · ' : '') + esc(L('درّسها ' + taught + ' مرّة', taught + '× this course')) : '') +
          '</span>' +
        '</span>' +
        /*@3.INPJ.13*/
        ((window.GardenRating && GardenRating.facultyShown(f))
          ? '<span class="gip-rate" data-tone="' + tone(f.idx) + '"><b>' + Math.round(f.idx) +
            '%</b><small>(' + (f.n || 0) + ')</small></span>'
          : (f.n
            ? '<span class="gip-rate gd-rate-few" title="' +
              esc(GardenRating ? GardenRating.facultyWhy(f) : '') + '">' +
              '<i class="fa-solid fa-users" aria-hidden="true"></i>' +
              '<small>' + (f.n || 0) + '</small></span>'
            : '')) +
        (on ? '<i class="fa-solid fa-check" aria-hidden="true" style="color:var(--st-ok,#10b981)"></i>' : '') +
      '</button>';
    });
    /*@3.INPJ.9*/
    html += manualRow(q('#gip-q').value);
    host.innerHTML = html;
  }

  function manualRow(raw) {
    var v = String(raw || '').trim();
    if (!v) return '';
    return '<div class="gip-lbl">' + esc(L('أو', 'Or')) + '</div>' +
      '<button class="gip-i" type="button" data-gip-manual="1">' +
      '<i class="fa-solid fa-pen" aria-hidden="true" style="color:var(--text-muted)"></i>' +
      '<span class="gip-i-b"><span class="gip-i-n">' + esc(v) + '</span>' +
      '<span class="gip-i-m">' + esc(L('استخدم ما كتبتَه كما هو', 'Use exactly what you typed')) + '</span></span></button>';
  }

  /*@3.INPJ.10*/
  function save(rec) {
    var m = GardenData.courseMeta(code);
    var rest = (m.instructors || []).slice(1);
    m.instructors = rec ? [rec].concat(rest) : rest;
    GardenData.saveCourseMeta(code, m);
    try { dlg.close(); } catch (e) {}
    if (typeof opts.onSave === 'function') opts.onSave(rec);
  }

  function pick(f) {
    save({
      id: (current(code) || {}).id || ('ins_' + Date.now()),
      name: isAr() ? f.name : (f.en || f.name),
      email: (f.link && f.link.e) || '',
      faculty_id: f.id || '',
      office_hours: (current(code) || {}).office_hours || '',
      location: (current(code) || {}).location || '',
      note: (current(code) || {}).note || ''
    });
  }

  function wire() {
    if (wired) return;
    wired = true;

    dlg.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-gip-close]')) { dlg.close(); return; }

      var item = t.closest('[data-gip-id]');
      if (item) {
        var f = facultyList().filter(function (x) { return x.id === item.getAttribute('data-gip-id'); })[0];
        if (f) pick(f);
        return;
      }
      if (t.closest('[data-gip-manual]')) {
        var v = (q('#gip-q').value || '').trim();
        if (v) save({ id: (current(code) || {}).id || ('ins_' + Date.now()), name: v, email: '' });
        return;
      }
    });

    q('#gip-q').addEventListener('input', render);
    q('#gip-clear').addEventListener('click', function () { save(null); });

    document.addEventListener('garden:languageChanged', function () {
      if (!dlg) return;
      relabel();
      if (dlg.open) render();
    });
  }

  function open(c, o) {
    if (!window.GardenData) return;
    code = String(c || '').toUpperCase();
    opts = o || {};
    build();
    relabel();
    q('#gip-q').value = '';
    q('#gip-clear').hidden = !current(code);
    q('#gip-t').textContent = opts.courseName
      ? L('دكتور ', 'Instructor for ') + opts.courseName
      : L('دكتور المادة', 'Course instructor');

    /*@3.INPJ.11*/
    if (window.GardenFaculty && !facultyList().length) {
      GardenFaculty.load(function () { if (dlg && dlg.open) render(); });
    }
    render();
    dlg.showModal();
    setTimeout(function () { try { q('#gip-q').focus(); } catch (e) {} }, 30);
  }

  window.GardenInsPicker = { open: open, current: current, nrm: nrm };
})();
