;(function () {
  'use strict';

  var sc = document.currentScript;
  var ROOT = (sc && sc.src)
    ? sc.src.replace(/shared\/notes-quick\.js(\?.*)?$/, '')
    : '';

  var LS = 'quick_notes';
  var dlg = null, els = {}, opener = null;
  var editing = null;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  function readArr() {
    try {
      var v = JSON.parse(localStorage.getItem(LS) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function writeArr(a) {
    try { localStorage.setItem(LS, JSON.stringify(a)); return true; }
    catch (e) { return false; }
  }

  function needCss(href) {
    var have = [].slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(function (l) { return (l.getAttribute('href') || '').indexOf(href) >= 0; });
    if (have) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + href;
    document.head.appendChild(l);
  }

  /*@3.NOQJ.5*/
  var Q_DROP = /^(t|v|r|fix|ts|cb|_|ref|src|from|utm_[a-z]+|fbclid|gclid|msclkid)$/i;

  function normQuery(q) {
    var s2 = String(q || '').replace(/^\?/, '');
    if (!s2) return '';
    var keep = [];
    s2.split('&').forEach(function (pair) {
      if (!pair) return;
      var k = pair.split('=')[0];
      if (Q_DROP.test(decodeURIComponent(k))) return;
      keep.push(pair);
    });
    keep.sort();
    return keep.length ? ('?' + keep.join('&')) : '';
  }

  function pageKey(raw) {
    var s2 = String(raw == null ? '' : raw);
    var q = s2.indexOf('?');
    var path = q < 0 ? s2 : s2.slice(0, q);
    return path + normQuery(q < 0 ? '' : s2.slice(q));
  }

  function pagePath() {
    try {
      var base = new URL(ROOT || './', location.href).pathname;
      var p = location.pathname;
      if (base && p.indexOf(base) === 0) p = p.slice(base.length);
      p = p.replace(/^\//, '');
      if (!p || /\/$/.test(p)) p += 'index.html';
      return pageKey(p + (location.search || ''));
    } catch (e) { return ''; }
  }

  function hashId(h) {
    var m = /(?:^|[#&])qn-([A-Za-z0-9_.-]+)/.exec(String(h == null ? '' : h));
    return m ? m[1] : '';
  }

  function pageTitles() {
    var b = document.body;
    var ar = b.getAttribute('data-page-title') || document.title || '';
    var en = b.getAttribute('data-page-title-en') || ar;
    return { ar: ar, en: en };
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function bi(n, ar, en) {
    n.setAttribute('data-ar', ar);
    n.setAttribute('data-en', en);
    n.textContent = L(ar, en);
    return n;
  }

  function build() {
    if (dlg) return;
    needCss('shared/surface.css');
    needCss('shared/notes-quick.css');

    dlg = document.createElement('dialog');
    dlg.className = 'gsf gqn';
    dlg.setAttribute('data-keep-open', '');
    dlg.setAttribute('aria-labelledby', 'gqn-title');

    dlg.appendChild(el('div', 'gsf-grip')).setAttribute('aria-hidden', 'true');

    var x = el('div', 'gsf-x');
    var close = el('button', 'gsf-close');
    close.type = 'button';
    close.setAttribute('data-ar-title', 'إغلاق');
    close.setAttribute('data-en-title', 'Close');
    close.setAttribute('aria-label', L('إغلاق', 'Close'));
    close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    close.addEventListener('click', function () { tryClose(); });
    x.appendChild(close);
    dlg.appendChild(x);

    var body = el('div', 'gsf-body');

    var head = el('div', 'gsf-head');
    var h = el('h3', 'gsf-title');
    h.id = 'gqn-title';
    bi(h, 'ملاحظة سريعة', 'Quick note');
    head.appendChild(h);

    var sub = el('p', 'gsf-sub gqn-origin');
    sub.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>';
    els.origin = el('span', 'gqn-origin-t');
    sub.appendChild(els.origin);
    head.appendChild(sub);
    body.appendChild(head);

    els.editBar = el('div', 'gqn-edit');
    els.editBar.hidden = true;
    var ei = el('i', 'fa-solid fa-pen');
    ei.setAttribute('aria-hidden', 'true');
    els.editBar.appendChild(ei);
    els.editBar.appendChild(bi(el('span'), 'تُحرّر ملاحظةً محفوظة.', 'Editing a saved note.'));
    els.editX = el('button', 'gqn-edit-x');
    els.editX.type = 'button';
    bi(els.editX, 'ملاحظةٌ جديدة', 'New note');
    els.editX.addEventListener('click', function () { clearForm(); els.body.focus(); });
    els.editBar.appendChild(els.editX);
    body.appendChild(els.editBar);

    els.body = el('textarea', 'gsf-in gsf-ta gqn-body');
    els.body.id = 'gqn-body';
    els.body.rows = 5;
    els.body.setAttribute('data-ar-placeholder', 'اكتبْ ما تريد تذكّرَه عن هذه الصفحة…');
    els.body.setAttribute('data-en-placeholder', 'Write what you want to remember about this page…');
    els.body.placeholder = L('اكتبْ ما تريد تذكّرَه عن هذه الصفحة…',
                             'Write what you want to remember about this page…');
    body.appendChild(els.body);

    var tagLab = el('label', 'gqn-lab');
    tagLab.setAttribute('for', 'gqn-tags');
    bi(tagLab, 'وسوم', 'Tags');
    body.appendChild(tagLab);

    els.tags = el('input', 'gsf-in');
    els.tags.id = 'gqn-tags';
    els.tags.type = 'text';
    els.tags.setAttribute('data-ar-placeholder', 'مهم، مراجعة');
    els.tags.setAttribute('data-en-placeholder', 'important, revise');
    els.tags.placeholder = L('مهم، مراجعة', 'important, revise');
    body.appendChild(els.tags);

    var whenLab = el('label', 'gqn-lab');
    bi(whenLab, 'تذكير (اختياريّ)', 'Reminder (optional)');
    body.appendChild(whenLab);

    var when = el('div', 'gqn-when');
    els.date = el('input', 'gsf-in');
    els.date.type = 'date';
    els.date.id = 'gqn-date';
    els.date.setAttribute('aria-label', L('تاريخ التذكير', 'Reminder date'));
    els.date.setAttribute('data-ar-title', 'تاريخ التذكير');
    els.date.setAttribute('data-en-title', 'Reminder date');
    els.time = el('input', 'gsf-in');
    els.time.type = 'time';
    els.time.id = 'gqn-time';
    els.time.setAttribute('aria-label', L('وقت التذكير', 'Reminder time'));
    els.time.setAttribute('data-ar-title', 'وقت التذكير');
    els.time.setAttribute('data-en-title', 'Reminder time');
    when.appendChild(els.date);
    when.appendChild(els.time);
    body.appendChild(when);

    var hint = el('p', 'gqn-hint');
    bi(hint, 'الموعدُ يُنشئ مهمّةً مرتبطة — والملاحظةُ تبقى كما هي.',
             'A date adds a linked task — the note itself stays.');
    body.appendChild(hint);

    /*@3.NOQJ.2*/
    els.listWrap = el('div', 'gqn-listw');
    els.listWrap.hidden = true;
    var lh = el('div', 'gqn-listh');
    var lhT = el('span', 'gqn-listh-t');
    bi(lhT, 'ملاحظاتُ هذه الصفحة', 'Notes on this page');
    lh.appendChild(lhT);
    els.listN = el('span', 'gqn-listn');
    lh.appendChild(els.listN);
    els.listWrap.appendChild(lh);
    els.list = el('div', 'gqn-list');
    els.listWrap.appendChild(els.list);
    body.appendChild(els.listWrap);

    dlg.appendChild(body);

    var foot = el('div', 'gsf-foot');

    els.guard = el('div', 'gsf-guard');
    els.guard.hidden = true;
    var gi = el('i', 'fa-solid fa-triangle-exclamation');
    gi.setAttribute('aria-hidden', 'true');
    els.guard.appendChild(gi);
    els.guard.appendChild(bi(el('p'), 'كتبتَ ولم تحفظ.', 'You wrote something and did not save.'));
    var drop = el('button', 'gsf-btn gsf-btn--ghost');
    drop.type = 'button';
    bi(drop, 'تجاهلْ', 'Discard');
    drop.addEventListener('click', function () { close_(true); });
    var keep = el('button', 'gsf-btn gsf-btn--go');
    keep.type = 'button';
    bi(keep, 'احفظْ', 'Save');
    keep.addEventListener('click', function () { save(false); });
    els.guard.appendChild(drop);
    els.guard.appendChild(keep);
    foot.appendChild(els.guard);

    var acts = el('div', 'gsf-acts');
    els.more = el('button', 'gsf-btn gsf-btn--ghost');
    els.more.type = 'button';
    els.more.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i> ';
    var moreT = el('span');
    bi(moreT, 'افتحْها في الملاحظات', 'Open in Notes');
    els.more.appendChild(moreT);
    els.more.addEventListener('click', function () { save(true); });

    els.save = el('button', 'gsf-btn gsf-btn--go');
    els.save.type = 'button';
    bi(els.save, 'حفظ', 'Save');
    els.save.addEventListener('click', function () { save(false); });

    acts.appendChild(els.more);
    acts.appendChild(els.save);
    foot.appendChild(acts);
    dlg.appendChild(foot);

    document.body.appendChild(dlg);

    dlg.addEventListener('cancel', function (e) { e.preventDefault(); tryClose(); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) tryClose();
    });
    els.body.addEventListener('input', function () { els.guard.hidden = true; });

    if (window.Garden && Garden.localize) {
      try { Garden.localize(dlg); } catch (e) {}
    }
  }

  function formSig() {
    return [els.body.value.trim(), els.tags.value.trim(),
            els.date.value, els.time.value].join('\u0001');
  }

  var baseline = '';

  function typed() {
    return formSig() !== baseline;
  }

  function firstLine(t, max) {
    var s2 = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
    if (!s2) return L('(فارغة)', '(empty)');
    return s2.length > max ? s2.slice(0, max) + '…' : s2;
  }

  function pageNotes() {
    var here = pagePath(), out = [], arr = readArr(), i;
    for (i = 0; i < arr.length; i++) {
      var n = arr[i];
      if (!n || n.archived) continue;
      if (!n.origin || pageKey(n.origin.page) !== here) continue;
      out.push(n);
    }
    out.sort(function (a, b) {
      return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
    });
    return out;
  }

  function dayLabel(ts) {
    var d = new Date(Number(ts) || 0);
    if (!isFinite(d.getTime()) || !ts) return '';
    try {
      return d.toLocaleDateString(isAr() ? 'ar-SA' : 'en-GB',
        { day: 'numeric', month: 'short' });
    } catch (e) { return ''; }
  }

  function clearForm() {
    editing = null;
    els.body.value = '';
    els.tags.value = '';
    els.date.value = '';
    els.time.value = '';
    els.guard.hidden = true;
    els.editBar.hidden = true;
    baseline = formSig();
    syncSaveLabel();
    markRow(null);
  }

  function syncSaveLabel() {
    var ar = editing ? 'حفظ التعديل' : 'حفظ';
    var en = editing ? 'Save changes' : 'Save';
    els.save.setAttribute('data-ar', ar);
    els.save.setAttribute('data-en', en);
    els.save.textContent = L(ar, en);
    els.more.hidden = !!editing;
  }

  function markRow(id) {
    var rows = els.list.querySelectorAll('[data-qid]');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('on', id != null && rows[i].getAttribute('data-qid') === id);
    }
  }

  function loadNote(id) {
    var arr = readArr(), i;
    for (i = 0; i < arr.length; i++) {
      if (String(arr[i] && arr[i].id) !== String(id)) continue;
      var n = arr[i];
      editing = String(n.id);
      els.body.value = String(n.body == null ? '' : n.body);
      els.tags.value = (Array.isArray(n.tags) ? n.tags : []).join('، ');
      var r = String(n.remind_at || '');
      els.date.value = r ? r.slice(0, 10) : '';
      els.time.value = (r.indexOf('T') > 0) ? r.slice(11, 16) : '';
      els.guard.hidden = true;
      els.editBar.hidden = false;
      baseline = formSig();
      syncSaveLabel();
      markRow(editing);
      return true;
    }
    return false;
  }

  function delNote(id) {
    var arr = readArr(), out = [], i, hit = false;
    for (i = 0; i < arr.length; i++) {
      if (String(arr[i] && arr[i].id) === String(id)) { hit = true; continue; }
      out.push(arr[i]);
    }
    /*@3.NOQJ.6*/
    if (!hit || !writeArr(out)) return;
    if (editing === String(id)) clearForm();
    renderList();
    toast(L('حُذفت الملاحظة.', 'Note deleted.'));
  }

  function renderList() {
    var list = pageNotes();
    els.list.textContent = '';
    if (!list.length) { els.listWrap.hidden = true; return; }
    els.listWrap.hidden = false;
    els.listN.textContent = String(list.length);
    for (var i = 0; i < list.length; i++) {
      (function (n) {
        var row = el('div', 'gqn-row');
        row.setAttribute('data-qid', String(n.id));
        var go = el('button', 'gqn-row-go');
        go.type = 'button';
        var t = firstLine(n.body, 64);
        go.appendChild(el('span', 'gqn-row-t', t));
        var meta = el('span', 'gqn-row-m');
        var dl = dayLabel(n.updated_at || n.created_at);
        if (dl) meta.appendChild(el('span', 'gqn-row-d', dl));
        if (n.remind_at) {
          var ri = el('i', 'fa-solid fa-bell');
          ri.setAttribute('aria-hidden', 'true');
          meta.appendChild(ri);
        }
        go.appendChild(meta);
        go.setAttribute('aria-label', L('حرّرْ: ', 'Edit: ') + t);
        go.addEventListener('click', function () { loadNote(n.id); els.body.focus(); });
        row.appendChild(go);
        var del = el('button', 'gqn-row-x');
        del.type = 'button';
        del.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
        del.setAttribute('aria-label', L('احذفْ: ', 'Delete: ') + t);
        del.setAttribute('data-ar-title', 'احذفْ');
        del.setAttribute('data-en-title', 'Delete');
        del.addEventListener('click', function () { delNote(n.id); });
        row.appendChild(del);
        els.list.appendChild(row);
      })(list[i]);
    }
    markRow(editing);
  }

  function tryClose() {
    if (!typed()) { close_(true); return; }
    els.guard.hidden = false;
    els.body.focus();
  }

  function close_(force) {
    if (!dlg) return;
    if (!force && typed()) { tryClose(); return; }
    els.guard.hidden = true;
    try { dlg.close(); } catch (e) {}
    if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
    opener = null;
  }

  function tagList() {
    return els.tags.value.split(/[,،\n]+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return !!s; })
      .slice(0, 8);
  }

  function remindAt() {
    var d = els.date.value;
    if (!d) return null;
    return els.time.value ? (d + 'T' + els.time.value) : d;
  }

  function toast(msg) {
    if (window.Garden && Garden.toast) { try { Garden.toast(msg); return; } catch (e) {} }
    if (window.GardenToast) { try { GardenToast(msg); return; } catch (e2) {} }
  }

  /*@3.NOQJ.1*/
  function needData(cb) {
    if (window.GardenData && GardenData.linkNoteToTask) { cb(true); return; }
    var s = document.createElement('script');
    s.src = ROOT + 'shared/garden-data.js';
    s.onload = function () { cb(!!(window.GardenData && GardenData.linkNoteToTask)); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  function save(andOpen) {
    var txt = els.body.value.trim();
    if (!txt) { els.body.focus(); return; }

    var now = Date.now();
    var t = pageTitles();
    var arr = readArr();
    var rec = null, i;

    /*@3.NOQJ.3*/
    if (editing) {
      for (i = 0; i < arr.length; i++) {
        if (String(arr[i] && arr[i].id) === editing) { rec = arr[i]; break; }
      }
    }
    var wasEdit = !!rec;
    if (rec) {
      rec.body = txt;
      rec.tags = tagList();
      rec.remind_at = remindAt();
      rec.updated_at = now;
      if (!rec.origin) rec.origin = { page: pagePath(), title: t.ar, title_en: t.en };
    } else {
      rec = {
        id: 'n' + now + Math.random().toString(36).slice(2, 6),
        body: txt,
        remind_at: remindAt(),
        archived: false,
        pinned: false,
        tags: tagList(),
        created_at: now,
        updated_at: now,
        origin: { page: pagePath(), title: t.ar, title_en: t.en }
      };
      arr.unshift(rec);
    }

    if (!writeArr(arr)) {
      toast(L('تعذّر الحفظُ — مساحةُ المتصفّح ممتلئة.', 'Could not save — browser storage is full.'));
      return;
    }

    clearForm();
    renderList();

    var done = function (linked) {
      try {
        document.dispatchEvent(new CustomEvent('garden:quickNoteSaved', { detail: { id: rec.id } }));
      } catch (e3) {}
      if (andOpen) {
        location.href = ROOT + 'hub/notes.html?adopt=' + encodeURIComponent(rec.id);
        return;
      }
      if (!rec.remind_at) {
        toast(wasEdit ? L('حُفظ التعديل.', 'Changes saved.') : L('حُفظت الملاحظة.', 'Note saved.'));
        return;
      }
      toast(linked
        ? L('حُفظت الملاحظةُ وأُضيفت مهمّةٌ مرتبطة.', 'Note saved and a linked task was added.')
        : L('حُفظت الملاحظة — وتعذّر إنشاءُ المهمّةِ المرتبطة.',
            'Note saved — the linked task could not be created.'));
    };

    if (!rec.remind_at) { done(false); return; }
    needData(function (ok) {
      var linked = false;
      if (ok) {
        try { GardenData.linkNoteToTask(rec); linked = true; } catch (e4) {}
      }
      done(linked);
    });
  }

  function open(opts) {
    build();
    opener = (opts && opts.opener) || null;
    var t = pageTitles();
    els.origin.textContent = L('من: ', 'From: ') + (isAr() ? t.ar : t.en);
    els.origin.setAttribute('data-ar', 'من: ' + t.ar);
    els.origin.setAttribute('data-en', 'From: ' + t.en);
    clearForm();
    renderList();

    /*@3.NOQJ.4*/
    var want = opts && opts.id ? String(opts.id) : '';
    if (want && !loadNote(want)) {
      toast(L('لم تُعثر على هذه الملاحظة — لعلّها حُذفت من جهازٍ آخر.',
              'That note was not found — it may have been deleted on another device.'));
    }

    if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } }
    setTimeout(function () {
      try {
        els.body.focus();
        var row = want ? els.list.querySelector('[data-qid="' + want + '"]') : null;
        if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
      } catch (e) {}
    }, 30);
  }

  window.GardenQuickNote = {
    open: open,
    close: function () { close_(true); },
    hashId: hashId
  };
})();
