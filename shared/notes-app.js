;(function () {
  'use strict';

  function i18n(node) {
    if (node && window.Garden && Garden.localize) {
      try { Garden.localize(node); } catch (e) {}
    }
    return node;
  }

  var LS_IDX = 'notes_index';
  var LS_TOMB = '__tomb_notes_index';
  var LS_FOLDERS = 'notes_folders';
  var LS_UI = 'notes_ui';

  var els = {};
  var ed = null;
  var ribbon = null;
  var overlay = null;
  var pdfUi = null;
  var pdfPre = null;
  var pdfDial = null;
  var hist = window.GardenNotesHistory ? GardenNotesHistory.create() : null;
  var edId = null;
  var edSaveT = null;
  var findT = null;

  var S = {
    view: { k: 'recent' },
    q: '',
    all: [],
    list: [],
    open: {},
    panel: true,
    acc: 'folders',
    reading: false,
    width: 'wide',
    blanks: [],
    blanksHid: false
  };

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readJSON(k, f) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? f : v; }
    catch (e) { return f; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  function ui() { var o = readJSON(LS_UI, {}); return (o && typeof o === 'object') ? o : {}; }
  function uiSet(k, v) { var o = ui(); o[k] = v; writeJSON(LS_UI, o); }

  /*@3.NOAJ.182*/
  function whenOf(n) { return when(n.updated_at, n.approx); }

  function when(ms, approx) {
    if (!ms) return '';
    if (approx) {
      var t0 = new Date(ms); t0.setHours(0, 0, 0, 0);
      var nowD = new Date(); nowD.setHours(0, 0, 0, 0);
      var days = Math.round((nowD - t0) / 86400000);
      if (days <= 0) return L('اليوم', 'today');
      if (days === 1) return L('أمس', 'yesterday');
      if (days < 7) return L('قبل ' + days + ' ي', days + 'd');
      var q = function (x) { return x < 10 ? '0' + x : String(x); };
      return t0.getFullYear() + '-' + q(t0.getMonth() + 1) + '-' + q(t0.getDate());
    }
    var d = Date.now() - ms;
    var m = Math.floor(d / 60000);
    if (m < 1) return L('الآن', 'now');
    if (m < 60) return L('قبل ' + m + ' د', m + 'm');
    var h = Math.floor(m / 60);
    if (h < 24) return L('قبل ' + h + ' س', h + 'h');
    var dd = Math.floor(h / 24);
    if (dd < 7) return L('قبل ' + dd + ' ي', dd + 'd');
    var t = new Date(ms);
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }


  function foldersRead() {
    var a = readJSON(LS_FOLDERS, []);
    if (!Array.isArray(a)) return [];
    return a.filter(function (f) { return f && f.id; })
            .sort(function (x, y) { return (x.ord || 0) - (y.ord || 0); });
  }
  function foldersWrite(a) {
    a.sort(function (x, y) { return String(x.id).localeCompare(String(y.id)); });
    writeJSON(LS_FOLDERS, a);
  }
  function folderPut(rec) {
    var a = foldersRead(), hit = false;
    for (var i = 0; i < a.length; i++) if (a[i].id === rec.id) { a[i] = rec; hit = true; break; }
    if (!hit) a.push(rec);
    foldersWrite(a);
  }
  function folderDrop(id) {
    var all = foldersRead(), gone = null, k;
    for (k = 0; k < all.length; k++) if (all[k].id === id) { gone = all[k]; break; }
    var up = (gone && gone.p) || '';
    var kept = all.filter(function (f) { return f.id !== id; });
    for (k = 0; k < kept.length; k++) if (kept[k].p === id) { kept[k].p = up; kept[k].updated_at = Date.now(); }
    foldersWrite(kept);
    var idx = idxRead(), touched = false;
    for (var i = 0; i < idx.length; i++) {
      if (idx[i].f === id) { idx[i].f = null; idx[i].updated_at = Date.now(); touched = true; }
    }
    if (touched) idxWrite(idx);
  }
  function folderName(id) {
    var a = foldersRead();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i].n || '';
    return '';
  }

  var MAX_DEPTH = 4;

  /*@3.NOAJ.8*/
  function folderTree() {
    var all = foldersRead();
    var byId = {}, i;
    for (i = 0; i < all.length; i++) byId[all[i].id] = all[i];
    var kids = {};
    for (i = 0; i < all.length; i++) {
      var f = all[i];
      var par = (f.p && byId[f.p] && f.p !== f.id) ? f.p : '';
      kids[par] = kids[par] || [];
      kids[par].push(f);
    }
    return { all: all, byId: byId, kids: kids };
  }

  function folderPath(id) {
    var T = folderTree(), out = [], cur = T.byId[id], guard = 0;
    while (cur && guard++ < MAX_DEPTH + 2) {
      out.unshift(cur.n || L('مجلّد', 'Folder'));
      cur = (cur.p && T.byId[cur.p] && cur.p !== cur.id) ? T.byId[cur.p] : null;
    }
    return out;
  }

  function folderDepth(id, T) {
    var t = T || folderTree();
    var d = 0, cur = t.byId[id], guard = 0;
    while (cur && cur.p && t.byId[cur.p] && cur.p !== cur.id && guard++ < MAX_DEPTH + 2) {
      d++; cur = t.byId[cur.p];
    }
    return d;
  }

  /*@3.NOAJ.9*/
  function folderCounts() {
    var T = folderTree(), own = {}, i;
    for (i = 0; i < S.all.length; i++) {
      var n = S.all[i];
      if (n.archived || !n.folder) continue;
      own[n.folder] = (own[n.folder] || 0) + 1;
    }
    var total = {};
    for (var id in own) {
      var cur = T.byId[id], guard = 0;
      while (cur && guard++ < MAX_DEPTH + 2) {
        total[cur.id] = (total[cur.id] || 0) + own[id];
        cur = (cur.p && T.byId[cur.p] && cur.p !== cur.id) ? T.byId[cur.p] : null;
      }
    }
    return { own: own, total: total };
  }

  /*@3.NOAJ.10*/
  function isDescendant(id, maybeAncestor) {
    if (!id || !maybeAncestor) return false;
    if (id === maybeAncestor) return true;
    var T = folderTree(), cur = T.byId[id], guard = 0;
    while (cur && cur.p && guard++ < MAX_DEPTH + 4) {
      if (cur.p === maybeAncestor) return true;
      cur = T.byId[cur.p];
    }
    return false;
  }

  function folderReparent(id, parent) {
    var T = folderTree(), f = T.byId[id];
    if (!f) return false;
    if (parent && isDescendant(parent, id)) return false;
    if (parent && folderDepth(parent, T) + 1 >= MAX_DEPTH) return false;
    f.p = parent || '';
    f.updated_at = Date.now();
    folderPut(f);
    return true;
  }


  function idxRead() {
    var a = readJSON(LS_IDX, []);
    return Array.isArray(a) ? a : [];
  }
  function idxWrite(a) {
    a.sort(function (x, y) { return String(x.id).localeCompare(String(y.id)); });
    writeJSON(LS_IDX, a);
  }
  function idxFind(id) {
    var a = idxRead();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function idxPut(rec) {
    var a = idxRead(), hit = false;
    for (var i = 0; i < a.length; i++) if (a[i].id === rec.id) { a[i] = rec; hit = true; break; }
    if (!hit) a.push(rec);
    idxWrite(a);
  }
  function idxDrop(id) {
    idxWrite(idxRead().filter(function (x) { return x.id !== id; }));
    var t = readJSON(LS_TOMB, {});
    if (t && typeof t === 'object') { t[id] = Date.now(); writeJSON(LS_TOMB, t); }
  }
  function newId(p) {
    return (p || 'rn') + '_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 7);
  }


  function info(code) {
    try {
      if (window.GardenData && GardenData.courseInfo) return GardenData.courseInfo(code);
    } catch (e) {}
    return null;
  }
  function courseLabel(code) {
    var c = info(code);
    if (!c) return code;
    return code + ' · ' + (isAr() ? (c.name_ar || code) : (c.name_en || code));
  }
  function courseTone(code) {
    var c = info(code);
    return (c && c.brand_color) || null;
  }
  function levelOf(code) {
    var c = info(code);
    return (c && c.level) || null;
  }
  function levelLabel(lv) {
    var list = [];
    try { list = (window.GardenData && GardenData.catalogList) ? GardenData.catalogList() : []; }
    catch (e) {}
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].level === lv) {
        return isAr() ? (list[i].level_name_ar || lv) : (list[i].level_name_en || lv);
      }
    }
    return lv;
  }


  function vKey(v) {
    return v.k + (v.code ? ':' + v.code : '') + (v.lv ? ':' + v.lv : '') +
           (v.id ? ':' + v.id : '') + (v.tag ? ':' + v.tag : '') + (v.src ? ':' + v.src : '') +
           (v.m != null && v.m !== '' ? ':m' + v.m : '');
  }

  function moduleLabel(m) { return isAr() ? ('الوحدة ' + m) : ('Module ' + m); }

  function vName(v) {
    switch (v.k) {
      case 'recent':  return L('الأخيرة', 'Recent');
      case 'pinned':  return L('المثبَّتة', 'Pinned');
      case 'remind':  return L('لها تنبيه', 'With reminder');
      case 'general': return L('ملاحظات عامّة', 'General notes');
      case 'archive': return L('الأرشيف', 'Archive');
      case 'course':  return courseLabel(v.code);
      case 'level':   return v.lv === '~' ? L('بلا مستوى', 'No level') : levelLabel(v.lv);
      case 'module':  return moduleLabel(v.m) + ' · ' + v.code;
      case 'folder':  return folderName(v.id) || L('مجلّد', 'Folder');
      case 'tag':     return '#' + v.tag;
      case 'src':     return srcName(v.src);
    }
    return L('ملاحظاتي', 'My notes');
  }

  function srcName(s) {
    if (s === 'rich') return L('ملاحظات كاملة', 'Full notes');
    if (s === 'quick') return L('ملاحظات سريعة', 'Quick notes');
    if (s === 'module') return L('من الدروس', 'From lessons');
    if (s === 'course') return L('من المواد', 'From courses');
    return s;
  }

  function matches(n, v) {
    switch (v.k) {
      case 'recent':  return !n.archived;
      case 'pinned':  return !n.archived && !!n.pinned;
      case 'remind':  return !n.archived && !!n.remind_at;
      case 'archive': return !!n.archived;
      case 'general': return !n.archived && !(n.origin && n.origin.course);
      case 'course':  return !n.archived && n.origin && n.origin.course === v.code;
      case 'level':   return !n.archived && n.origin && n.origin.course &&
                             (levelOf(n.origin.course) || '~') === v.lv;
      case 'module':  return !n.archived && n.origin && n.origin.course === v.code &&
                             n.origin.module != null &&
                             String(n.origin.module) === String(v.m);
      case 'folder':  return !n.archived && n.folder === v.id;
      case 'tag':     return !n.archived && (n.tags || []).indexOf(v.tag) !== -1;
      case 'src':     return !n.archived && n.src === v.src;
    }
    return !n.archived;
  }

  function inView(v) {
    var out = [];
    for (var i = 0; i < S.all.length; i++) if (matches(S.all[i], v)) out.push(S.all[i]);
    return out;
  }


  function itemHtml(v, label, icon, n, tone) {
    var cur = vKey(v) === vKey(S.view);
    var mark = tone
      ? '<span class="na-dot" style="--na-tone:' + esc(tone) + '"></span>'
      : '<i class="na-ic2 fa-solid ' + esc(icon) + '" aria-hidden="true"></i>';
    return '<button type="button" class="na-item" data-v="' + esc(JSON.stringify(v)) + '"' +
           (cur ? ' aria-current="true"' : '') + '>' + mark +
           '<span class="na-lbl">' + esc(label) + '</span>' +
           (n ? '<span class="na-n">' + n + '</span>' : '') + '</button>';
  }

  function grpHtml(key, label, body, addBtn) {
    var open = ui()['g_' + key] !== 0;
    return '<div class="na-grp" data-g="' + esc(key) + '" data-open="' + (open ? 1 : 0) + '">' +
      '<button type="button" class="na-grp-h" data-grp="' + esc(key) + '" aria-expanded="' + open + '">' +
        '<i class="na-caret fa-solid fa-chevron-down" aria-hidden="true"></i>' +
        '<span>' + esc(label) + '</span>' +
        (addBtn ? '<span class="na-grp-add" data-add="' + esc(key) + '" role="button" tabindex="0" ' +
                  'aria-label="' + esc(L('مجلّد جديد', 'New folder')) + '">' +
                  '<i class="fa-solid fa-plus" aria-hidden="true"></i></span>' : '') +
      '</button><div class="na-grp-b">' + body + '</div></div>';
  }

  function folderOpen(id) { return ui()['f_' + id] !== 0; }

  function folderBranch(parent, depth, T, C) {
    var list = T.kids[parent] || [];
    var h = '';
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var kids = T.kids[f.id] || [];
      var open = folderOpen(f.id);
      var cur = vKey({ k: 'folder', id: f.id }) === vKey(S.view);
      h += '<div class="na-f" data-fid="' + esc(f.id) + '" data-open="' + (open ? 1 : 0) +
           '" style="--d:' + depth + '">' +
        '<div class="na-f-row' + (cur ? ' on' : '') + '">' +
          (kids.length
            ? '<button type="button" class="na-f-tw" data-ftog="' + esc(f.id) + '"' +
              ' aria-expanded="' + (open ? 'true' : 'false') + '"' +
              ' aria-label="' + esc(open ? L('طيّ المجلّد', 'Collapse folder')
                                         : L('فتح المجلّد', 'Expand folder')) + '"' +
              ' data-ar-title="' + (open ? 'طيّ المجلّد' : 'فتح المجلّد') + '"' +
              ' data-en-title="' + (open ? 'Collapse folder' : 'Expand folder') + '">' +
              '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>'
            : '<span class="na-f-tw na-f-tw--none" aria-hidden="true"></span>') +
          '<button type="button" class="na-item na-f-b" data-v="' +
            esc(JSON.stringify({ k: 'folder', id: f.id })) + '"' + (cur ? ' aria-current="true"' : '') + '>' +
            '<i class="na-ic2 fa-solid fa-folder" aria-hidden="true"></i>' +
            '<span class="na-lbl">' + esc(f.n || L('مجلّد', 'Folder')) + '</span>' +
            ((C.total[f.id] || 0) ? '<span class="na-n">' + C.total[f.id] + '</span>' : '') +
          '</button>' +
          '<button type="button" class="na-f-m" data-fmenu="' + esc(f.id) + '"' +
            ' aria-label="' + esc(L('خيارات المجلّد', 'Folder options')) + '"' +
            ' data-ar-title="خيارات المجلّد" data-en-title="Folder options">' +
            '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
        '</div>';
      if (kids.length && open) h += folderBranch(f.id, depth + 1, T, C);
      h += '</div>';
    }
    return h;
  }

  /*@3.NOAJ.184*/
  function levelTree() {
    var out = {};
    for (var i = 0; i < S.all.length; i++) {
      var x = S.all[i];
      if (x.archived) continue;
      var code = x.origin && x.origin.course;
      if (!code) continue;
      var lv = levelOf(code) || '~';
      var LO = out[lv] || (out[lv] = { n: 0, codes: {} });
      var CO = LO.codes[code] || (LO.codes[code] = { n: 0, mods: {} });
      LO.n++; CO.n++;
      var m = x.origin.module;
      if (m != null && m !== '') CO.mods[m] = (CO.mods[m] || 0) + 1;
    }
    return out;
  }

  function branchRow(depth, open, key, view, icon, label, count, tone, kids) {
    var cur = vKey(view) === vKey(S.view);
    return '<div class="na-f" data-open="' + (open ? 1 : 0) + '" style="--d:' + depth + '">' +
      '<div class="na-f-row' + (cur ? ' on' : '') + '">' +
        (kids
          ? '<button type="button" class="na-f-tw" data-ntog="' + esc(key) + '"' +
            ' aria-expanded="' + (open ? 'true' : 'false') + '"' +
            ' aria-label="' + esc(open ? L('طيّ', 'Collapse') : L('فتح', 'Expand')) + '"' +
            ' data-ar-title="' + (open ? 'طيّ' : 'فتح') + '"' +
            ' data-en-title="' + (open ? 'Collapse' : 'Expand') + '">' +
            '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>'
          : '<span class="na-f-tw na-f-tw--none" aria-hidden="true"></span>') +
        '<button type="button" class="na-item na-f-b" data-v="' + esc(JSON.stringify(view)) + '"' +
          (cur ? ' aria-current="true"' : '') + '>' +
          (tone ? '<span class="na-dot" style="--na-tone:' + esc(tone) + '"></span>'
                : '<i class="na-ic2 fa-solid ' + esc(icon) + '" aria-hidden="true"></i>') +
          '<span class="na-lbl">' + esc(label) + '</span>' +
          (count ? '<span class="na-n">' + count + '</span>' : '') +
        '</button>' +
      '</div>';
  }

  function levelBody() {
    var T = levelTree();
    var lvs = Object.keys(T).sort();
    if (!lvs.length) return '';
    var U = ui(), h = '';
    for (var i = 0; i < lvs.length; i++) {
      var lv = lvs[i], LO = T[lv];
      var codes = Object.keys(LO.codes).sort();
      var open = U['lv_' + lv] === 1;
      h += branchRow(0, open, 'lv_' + lv, { k: 'level', lv: lv }, 'fa-layer-group',
                     lv === '~' ? L('بلا مستوى', 'No level') : levelLabel(lv),
                     LO.n, null, codes.length > 0);
      if (open) {
        for (var j = 0; j < codes.length; j++) {
          var code = codes[j], CO = LO.codes[code];
          var mods = Object.keys(CO.mods).sort(function (a, b) { return (+a) - (+b); });
          var co = U['cs_' + code] === 1;
          h += branchRow(1, co, 'cs_' + code, { k: 'course', code: code }, 'fa-book',
                         courseLabel(code), CO.n, courseTone(code), mods.length > 0);
          if (co) {
            for (var k = 0; k < mods.length; k++) {
              h += branchRow(2, false, '', { k: 'module', code: code, m: mods[k] },
                             'fa-graduation-cap', moduleLabel(mods[k]), CO.mods[mods[k]], null, false);
              h += '</div>';
            }
          }
          h += '</div>';
        }
      }
      h += '</div>';
    }
    return h;
  }

  function renderRail() {
    if (!els.tree) return;
    var h = '';

    /*@3.NOAJ.183*/
    h += itemHtml({ k: 'recent' }, L('الأخيرة', 'Recent'), 'fa-clock', inView({ k: 'recent' }).length);
    h += itemHtml({ k: 'pinned' }, L('المثبَّتة', 'Pinned'), 'fa-thumbtack', inView({ k: 'pinned' }).length);
    var nr = inView({ k: 'remind' }).length;
    if (nr) h += itemHtml({ k: 'remind' }, L('لها تنبيه', 'With reminder'), 'fa-bell', nr);

    var fb = folderBranch('', 0, folderTree(), folderCounts());
    if (!fb) {
      fb = '<p class="na-empty-hint" style="padding:.35rem .6rem;margin:0;font-size:.72rem;color:var(--text-muted)">' +
           esc(L('أنشئ مجلّداً لتجمع ملاحظاتك كما تحبّ.', 'Create a folder to group notes your way.')) + '</p>';
    }
    h += grpHtml('folder', L('مجلّداتي', 'My folders'), fb, true);

    var srcs = ['rich', 'quick', 'module', 'course'];
    var sb = '', sIcons = { rich: 'fa-file-lines', quick: 'fa-bolt', module: 'fa-graduation-cap', course: 'fa-folder-open' };
    for (var d = 0; d < srcs.length; d++) {
      var cnt = inView({ k: 'src', src: srcs[d] }).length;
      if (cnt) sb += itemHtml({ k: 'src', src: srcs[d] }, srcName(srcs[d]), sIcons[srcs[d]], cnt);
    }
    if (sb) h += grpHtml('src', L('حسب النوع', 'By type'), sb, false);

    var lb = levelBody();
    if (lb) h += grpHtml('level', L('حسب المستوى', 'By level'), lb, false);

    var tags = [];
    try { tags = window.GardenNotesModel.tagCloud(S.all).slice(0, 12); } catch (e2) {}
    if (tags.length) {
      var tb = '';
      for (var f = 0; f < tags.length; f++) {
        tb += itemHtml({ k: 'tag', tag: tags[f].tag }, '#' + tags[f].tag, 'fa-hashtag', tags[f].n);
      }
      h += grpHtml('tag', L('الوسوم', 'Tags'), tb, false);
    }

    h += '<div class="na-grp"><div class="na-grp-b">';
    h += itemHtml({ k: 'general' }, L('ملاحظات عامّة', 'General'), 'fa-note-sticky', inView({ k: 'general' }).length);
    h += itemHtml({ k: 'archive' }, L('الأرشيف', 'Archive'), 'fa-box-archive', inView({ k: 'archive' }).length);
    h += '</div></div>';

    els.tree.innerHTML = h;
    i18n(els.tree);
  }


  /*@3.NOAJ.69*/
  var PANEL_MIN = 200, PANEL_MAX = 520, PANEL_DEF = 288;

  function panelW() {
    var v = parseFloat(ui().pw);
    return (isFinite(v) && v >= PANEL_MIN && v <= PANEL_MAX) ? v : PANEL_DEF;
  }

  function applyPanelW() {
    var shell = document.querySelector('.na');
    if (!shell) return;
    var w = panelW();
    if (w === PANEL_DEF) shell.style.removeProperty('--na-panel');
    else shell.style.setProperty('--na-panel', Math.round(w) + 'px');
  }

  function bindPanelResize() {
    var panel = document.getElementById('na-panel');
    var shell = document.querySelector('.na');
    if (!panel || !shell || panel.querySelector('.na-panel-grip')) return;
    var grip = document.createElement('div');
    grip.className = 'na-panel-grip';
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-orientation', 'vertical');
    grip.setAttribute('aria-label', L('اسحبْ لضبط عرض القائمة', 'Drag to set the list width'));
    grip.setAttribute('data-ar-title', 'اسحبْ لضبط العرض · ضغطتان للإرجاع');
    grip.setAttribute('data-en-title', 'Drag to resize · double-click to reset');
    grip.setAttribute('tabindex', '0');
    panel.appendChild(grip);

    var D = null;
    grip.addEventListener('pointerdown', function (e) {
      var rtl = getComputedStyle(shell).direction === 'rtl';
      D = { id: e.pointerId, x: e.clientX, w: panel.getBoundingClientRect().width, rtl: rtl };
      try { grip.setPointerCapture(e.pointerId); } catch (x) {}
      shell.classList.add('na-resizing');
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.id) return;
      var dx = e.clientX - D.x;
      if (D.rtl) dx = -dx;
      var w = Math.max(PANEL_MIN, Math.min(PANEL_MAX, D.w + dx));
      shell.style.setProperty('--na-panel', Math.round(w) + 'px');
      D.last = w;
      e.preventDefault();
    });
    var stop = function (e) {
      if (!D || e.pointerId !== D.id) return;
      try { grip.releasePointerCapture(D.id); } catch (x) {}
      shell.classList.remove('na-resizing');
      if (D.last) { uiSet('pw', Math.round(D.last)); applyPanelW(); }
      D = null;
    };
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
    grip.addEventListener('dblclick', function () {
      uiSet('pw', PANEL_DEF);
      applyPanelW();
    });
    grip.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 32 : 8;
      var w = panelW();
      if (e.key === 'ArrowRight') w += step;
      else if (e.key === 'ArrowLeft') w -= step;
      else if (e.key === 'Home' || e.key === 'Enter') w = PANEL_DEF;
      else return;
      e.preventDefault();
      uiSet('pw', Math.max(PANEL_MIN, Math.min(PANEL_MAX, w)));
      applyPanelW();
    });
  }


  /*@3.NOAJ.72*/
  var shareCur = null;

  function shareUrl(sid) {
    return location.origin + location.pathname + '?s=' + encodeURIComponent(sid);
  }

  function shareSay(kind, msg) {
    var dlg = document.getElementById('na-share');
    var el = dlg && dlg.querySelector('[data-role="state"]');
    if (!el) return;
    el.textContent = msg || '';
    el.setAttribute('data-k', kind || '');
  }

  function paintShare() {
    var dlg = document.getElementById('na-share');
    if (!dlg) return;
    var box = dlg.querySelector('[data-role="linkbox"]');
    var link = dlg.querySelector('[data-role="link"]');
    var rev = dlg.querySelector('[data-role="revoke"]');
    var mk = dlg.querySelector('[data-role="make"]');
    var on = !!(shareCur && shareCur.sid);
    if (box) box.hidden = !on;
    if (rev) rev.hidden = !on;
    if (link && on) link.value = shareUrl(shareCur.sid);
    if (mk) {
      var ar = on ? 'حدِّثِ اللقطة' : 'أنشئ الرابط';
      var en = on ? 'Refresh snapshot' : 'Create link';
      mk.textContent = L(ar, en);
      mk.setAttribute('data-ar', ar);
      mk.setAttribute('data-en', en);
    }
    var mode = (shareCur && shareCur.mode) || 'view';
    [].forEach.call(dlg.querySelectorAll('[data-shmode]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-shmode') === mode ? 'true' : 'false');
    });
  }

  function openShare() {
    var dlg = document.getElementById('na-share');
    if (!dlg || !edId) return;
    var Sy = window.GardenNotesSync;
    shareCur = { sid: null, mode: 'view' };
    paintShare();
    shareSay('', L('يُقرأ…', 'Loading…'));
    try { dlg.showModal(); } catch (e) {}
    if (!Sy || !Sy.shareState) {
      shareSay('warn', L('المشاركةُ تحتاج مزامنةً مفعَّلة.', 'Sharing needs sync to be on.'));
      return;
    }
    var want = edId;
    Sy.shareState(want).then(function (r) {
      if (edId !== want) return;
      if (!r.ok) {
        shareSay('warn', r.reason === 'no-vault'
          ? L('فعّلِ المزامنةَ أوّلاً لتشاركَ ملاحظاتِك.', 'Turn sync on first to share notes.')
          : L('تعذّرت قراءةُ حالِ المشاركة.', 'The share status could not be read.'));
        return;
      }
      shareCur = { sid: r.shared ? r.sid : null, mode: r.mode || 'view', views: r.views || 0 };
      paintShare();
      shareSay('', r.shared
        ? (L('الرابطُ قائم · شوهد ', 'Link is live · viewed ') + (r.views || 0) +
           L(' مرّة', ' times'))
        : '');
    });
  }

  function shareMake(mode) {
    var Sy = window.GardenNotesSync;
    if (!Sy || !Sy.shareSet || !ed || !edId) return;
    var want = edId;
    var rec = idxFind(want);
    ed.save();
    shareSay('', L('يُرسَل…', 'Sending…'));
    Sy.shareSet(want, ed.doc, (rec && rec.t) || '', mode || (shareCur && shareCur.mode) || 'view')
      .then(function (r) {
        if (edId !== want) return;
        if (!r.ok) {
          shareSay('warn', r.status === 413
            ? L('الملاحظةُ أكبرُ من حدِّ المشاركة.', 'This note is over the share size limit.')
            : L('تعذّر إنشاءُ الرابط.', 'The link could not be created.'));
          return;
        }
        shareCur = { sid: r.sid, mode: r.mode, views: (shareCur && shareCur.views) || 0 };
        paintShare();
        shareSay('ok', r.created ? L('أُنشئ الرابط.', 'Link created.')
                                 : L('حُدِّثت اللقطة.', 'Snapshot refreshed.'));
      });
  }

  function shareRevoke() {
    var Sy = window.GardenNotesSync;
    if (!Sy || !Sy.shareDrop || !edId) return;
    var want = edId;
    shareSay('', L('يُبطَل…', 'Revoking…'));
    Sy.shareDrop(want).then(function (r) {
      if (edId !== want) return;
      shareCur = { sid: null, mode: (shareCur && shareCur.mode) || 'view' };
      paintShare();
      shareSay('ok', r.ok ? L('أُبطل الرابط.', 'The link was revoked.')
                          : L('تعذّر الإبطال.', 'The link could not be revoked.'));
    });
  }

  function shareRefreshQuiet(noteId) {
    var Sy = window.GardenNotesSync;
    if (!Sy || !Sy.shareState || !Sy.shareSet || !ed) return;
    Sy.shareState(noteId).then(function (r) {
      if (!r || !r.ok || !r.shared || edId !== noteId || !ed) return;
      var rec = idxFind(noteId);
      Sy.shareSet(noteId, ed.doc, (rec && rec.t) || '', r.mode);
    });
  }

  function bindShare() {
    var btn = document.getElementById('na-share-btn');
    if (btn) btn.addEventListener('click', openShare);
    var dlg = document.getElementById('na-share');
    if (!dlg) return;
    dlg.addEventListener('click', function (e) {
      var m = e.target.closest('[data-shmode]');
      if (m) {
        var mode = m.getAttribute('data-shmode');
        if (shareCur) shareCur.mode = mode;
        paintShare();
        if (shareCur && shareCur.sid) shareMake(mode);
        return;
      }
      if (e.target.closest('[data-role="make"]')) { shareMake(); return; }
      if (e.target.closest('[data-role="revoke"]')) { shareRevoke(); return; }
      if (e.target.closest('[data-role="copy"]')) {
        var inp = dlg.querySelector('[data-role="link"]');
        if (!inp || !inp.value) return;
        inp.select();
        var done = function () { shareSay('ok', L('نُسخ الرابط.', 'Link copied.')); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(inp.value).then(done, function () {
            try { document.execCommand('copy'); done(); } catch (e2) {}
          });
        } else {
          try { document.execCommand('copy'); done(); } catch (e3) {}
        }
      }
    });
  }


  /*@3.NOAJ.74*/
  var guestShare = null;

  function openShared(sid) {
    var Sy = window.GardenNotesSync;
    if (!Sy || !Sy.shareRead || !els.docBody) return;
    document.documentElement.classList.add('na-guest');
    setPanel(false);
    setDocActions(false);
    saveState('', L('يُقرأ…', 'Loading…'));
    renderOpening();
    if (els.docTitle) { els.docTitle.value = ''; els.docTitle.disabled = true; }

    Sy.shareRead(sid).then(function (r) {
      if (!r.ok || !r.doc) {
        els.docBody.innerHTML = '<div class="na-guest-miss">' +
          esc(L('هذا الرابطُ لم يعد يعمل — ربّما أبطله صاحبُه.',
                'This link no longer works — its owner may have revoked it.')) + '</div>';
        saveState('error', L('رابطٌ غيرُ صالح', 'Invalid link'));
        return;
      }
      guestShare = { sid: sid, mode: r.mode, title: r.title, doc: r.doc };
      setMob('doc');
      if (els.docTitle) els.docTitle.value = r.title || '';
      var doc = window.GardenNotesBlocks.normalize(r.doc);
      var isBoard = doc.kind === 'board';
      els.docBody.innerHTML =
        '<div class="na-zoom" id="na-zoom">' +
        '<div class="na-tf" id="na-tf">' +
        '<div class="na-page" id="na-page" data-pages="1" data-kind="' +
          (isBoard ? 'board' : 'doc') + '">' +
        '<div class="na-cover" id="na-cover" hidden></div>' +
        '<div class="na-sheet" id="na-sheet"></div>' +
        '</div></div></div>';
      var host = document.getElementById('na-sheet');
      applyPage(doc);
      applyFs();
      ed = GardenNotesEditor.mount(host, doc, { readOnly: true });
      if (ed.setReadOnly) ed.setReadOnly(true);
      edId = null;
      if (els.ribbonHost) els.ribbonHost.hidden = true;
      showGuestBar(r);
      if (doc.ov && (doc.ov.ink || (doc.ov.shapes && doc.ov.shapes.length)) &&
          window.GardenNotesOverlay) {
        overlay = GardenNotesOverlay.mount({
          scroller: els.docBody,
          stage: tfEl(),
          bound: !isBoard,
          sheet: host,
          data: doc.ov,
          onPinch: docPinch,
          onChange: function () {}
        });
        try { overlay.show(); } catch (e) {}
      }
      /*@3.NOAJ.121*/
      applyWidth();
      watchPage();
      growPages();
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () { applyWidth(); });
      }
      saveState('', '');
    });
  }

  function showGuestBar(r) {
    var bar = document.createElement('div');
    bar.className = 'na-guest-bar';
    bar.innerHTML =
      '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>' +
      '<span>' + esc(L('ملاحظةٌ شاركها معك أحدُهم — أنت تقرؤها فقط.',
                       'A note someone shared with you — you are reading it only.')) + '</span>' +
      (r.mode === 'copy'
        ? '<button type="button" class="na-guest-copy">' +
          esc(L('انسخْها إلى ملاحظاتي', 'Copy into my notes')) + '</button>'
        : '') +
      '<a class="na-guest-out" href="' + esc(location.pathname) + '">' +
      esc(L('ملاحظاتي', 'My notes')) + '</a>';
    if (els.docBody && els.docBody.parentNode) {
      els.docBody.parentNode.insertBefore(bar, els.docBody);
    }
    var cb = bar.querySelector('.na-guest-copy');
    if (cb) cb.addEventListener('click', copyShared);
  }

  function copyShared() {
    if (!guestShare || !guestShare.doc) return;
    var id = newId('rn');
    var now = Date.now();
    var rec = { id: id, t: guestShare.title || L('ملاحظةٌ مشتركة', 'Shared note'),
                k: guestShare.doc.kind === 'board' ? 'board' : 'rich',
                o: {}, g: [], c: null, f: null, p: 0, a: 0,
                ca: now, updated_at: now, sz: 0 };
    idxPut(rec);
    var St = window.GardenNotesStore;
    var go = function () { location.href = location.pathname + '?id=' + encodeURIComponent(id); };
    if (St) St.putDoc(id, guestShare.doc, now).then(go, go); else go();
  }

  /*@3.NOAJ.112*/
  var SHEET_FACE = 'Thmanyah Sans';
  function warmSheetFont(tries) {
    if (!document.fonts || !document.fonts.load) return;
    var has = false;
    try {
      document.fonts.forEach(function (ff) { if (ff.family === SHEET_FACE) has = true; });
    } catch (e) {}
    if (!has) {
      if (tries > 20) return;
      setTimeout(function () { warmSheetFont(tries + 1); }, 120);
      return;
    }
    ['400', '500', '700'].forEach(function (w) {
      try { document.fonts.load(w + ' 16px "' + SHEET_FACE + '"', 'أبجد Abc'); } catch (e2) {}
    });
  }

  /*@3.NOAJ.215*/
  function syncTitleWord() {
    var t = els.docTitle;
    if (!t) return;
    var pdf = pdfOn() || (els.app && els.app.getAttribute('data-kind') === 'pdf');
    var ar = pdf ? 'اسم الملفّ' : 'عنوان الملاحظة';
    var en = pdf ? 'File name' : 'Note title';
    t.setAttribute('placeholder', L(ar, en));
    t.setAttribute('data-ar-placeholder', ar);
    t.setAttribute('data-en-placeholder', en);
    t.setAttribute('data-ar-title', ar);
    t.setAttribute('data-en-title', en);
    t.setAttribute('aria-label', L(ar, en));
  }

  /*@3.NOAJ.27*/
  function syncTitleDir() {
    /*@3.NOAJ.145*/
    var d = (ed && ed.docDir) ? ed.docDir() : (isAr() ? 'rtl' : 'ltr');
    if (els.docTitle) els.docTitle.setAttribute('dir', d);
  }

  /*@3.NOAJ.216*/
  function serverQuota() {
    var Sy = window.GardenNotesSync;
    var q = (Sy && Sy.quota) ? Sy.quota() : null;
    if (!q || q.note_bytes == null || !q.max) return null;
    return { bytes: q.note_bytes, max: q.max, remote: 1 };
  }

  function renderQuota() {
    if (!els.quota) return;
    var St = window.GardenNotesStore;
    if (!St || !St.quota) { els.quota.hidden = true; return; }
    var srv = serverQuota();
    (srv ? Promise.resolve(srv) : St.quota()).then(function (q) {
      if (!q || !q.max) { els.quota.hidden = true; return; }
      var pct = Math.min(100, Math.round((q.bytes / q.max) * 100));
      var mb = function (b) { return (b / 1048576).toFixed(1); };
      els.quota.hidden = false;
      els.quota.setAttribute('data-warn', pct >= 92 ? '2' : (pct >= 78 ? '1' : '0'));
      var full = mb(q.bytes) + ' / ' + mb(q.max) + ' MB';
      els.quota.setAttribute('data-src', q.remote ? 'srv' : 'loc');
      els.quota.setAttribute('aria-label',
        (q.remote ? L('المزامَنُ إلى حسابك: ', 'Synced to your account: ')
                  : L('على هذا الجهاز — لم يُزامَن بعد: ', 'On this device — not synced yet: ')) + full);
      els.quota.setAttribute('title', full);
      els.quota.innerHTML =
        '<div style="unicode-bidi:isolate;direction:ltr">' + mb(q.bytes) + ' MB</div>' +
        '<div class="na-quota-bar"><div class="na-quota-fill" style="inline-size:' + pct + '%"></div></div>';
    }).catch(function () { els.quota.hidden = true; });
  }


  /*@3.NOAJ.186*/
  function vmode() { return ui().vm === 'rows' ? 'rows' : 'cards'; }

  function syncVm() {
    var b = document.getElementById('na-vm');
    if (els.items) els.items.setAttribute('data-vm', vmode());
    if (!b) return;
    var cards = vmode() === 'cards';
    b.setAttribute('aria-pressed', cards ? 'true' : 'false');
    b.setAttribute('aria-label', cards ? L('عرضٌ تفصيليّ', 'Detailed view') : L('عرضٌ مربّع', 'Compact view'));
    b.setAttribute('data-ar-title', cards ? 'عرضٌ تفصيليّ' : 'عرضٌ مربّع');
    b.setAttribute('data-en-title', cards ? 'Detailed view' : 'Compact view');
    b.innerHTML = '<i class="fa-solid ' + (cards ? 'fa-list' : 'fa-table-cells-large') + '" aria-hidden="true"></i>';
  }

  function rowHtml(n) {
    var cur = (n.src === 'rich' && n.id === edId);
    var badges = '';
    if (n.pinned) badges += '<i class="na-row-badge on fa-solid fa-thumbtack" aria-hidden="true"></i>';
    if (n.remind_at) badges += '<i class="na-row-badge fa-solid fa-bell" aria-hidden="true"></i>';
    if (n.kind === 'ink' || n.kind === 'board') badges += '<i class="na-row-badge fa-solid fa-pen-nib" aria-hidden="true"></i>';
    /*@3.NOAJ.209*/
    if (n.kind === 'pdf') badges += '<i class="na-row-badge fa-solid fa-file-lines" aria-hidden="true"></i>';
    if (!n.editable) badges += '<i class="na-row-badge fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>';

    var org = (n.origin && n.origin.label) ? n.origin.label : '';
    if (n.kind === 'board') org = L('لوح رسم', 'Drawing board');
    if (n.kind === 'pdf') org = L('ملفُّ PDF', 'PDF file');
    var tone = (n.origin && n.origin.course) ? courseTone(n.origin.course) : null;

    return '<button type="button" class="na-row" data-uid="' + esc(n.uid) + '"' +
      (cur ? ' aria-current="true"' : '') + '>' +
      '<span class="na-row-t">' +
        (tone ? '<span class="na-dot" style="--na-tone:' + esc(tone) + '"></span>' : '') +
        '<span class="na-row-title" dir="auto">' + esc(n.title) + '</span>' + badges +
      '</span>' +
      (n.excerpt ? '<span class="na-row-x" dir="auto">' + esc(n.excerpt) + '</span>' : '') +
      '<span class="na-row-m">' +
        (org ? '<span class="na-org">' + esc(org) + '</span>' : '') +
        '<span class="na-when">' + esc(whenOf(n)) + '</span>' +
      '</span></button>';
  }

  function emptyHtml() {
    if (S.q) {
      return '<div class="na-empty"><i class="fa-solid fa-magnifying-glass"></i>' +
        '<p>' + esc(L('لا نتيجة لبحثك.', 'Nothing matched.')) + '</p>' +
        '<p class="na-empty-hint">' + esc(L('جرّب كلمةً أقصر أو ابحث في «الأخيرة».',
                                            'Try a shorter word, or search in Recent.')) + '</p></div>';
    }
    if (S.view.k === 'archive') {
      return '<div class="na-empty"><i class="fa-solid fa-box-archive"></i>' +
        '<p>' + esc(L('الأرشيف فارغ.', 'Archive is empty.')) + '</p></div>';
    }
    return '<div class="na-empty"><i class="fa-solid fa-feather"></i>' +
      '<p>' + esc(L('لا ملاحظات هنا بعد.', 'No notes here yet.')) + '</p>' +
      '<p class="na-empty-hint">' + esc(L('اضغط «ملاحظة جديدة» لتبدأ.', 'Press New note to start.')) + '</p></div>';
  }

  function renderList() {
    if (!els.items) return;
    var list = inView(S.view);
    if (S.q) {
      try { list = window.GardenNotesModel.search(list, S.q); } catch (e) {}
    }
    S.list = list;
    if (els.vname) els.vname.textContent = vName(S.view);
    if (els.count) {
      /*@3.NOAJ.217*/
      els.count.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
      els.count.textContent = list.length
        ? (isAr() ? list.length + ' ملاحظة' : list.length + ' notes') : '';
    }
    syncVm();
    els.items.innerHTML = blanksBar() + (list.length
      ? list.map(rowHtml).join('')
      : emptyHtml());
    /*@3.NOAJ.57*/
    paintPicked();
    paintAlt();
    altWatch();
  }

  /*@3.NOAJ.194*/
  function altCols() {
    if (!els.items) return 1;
    var n = 1;
    try {
      var g = getComputedStyle(els.items).gridTemplateColumns;
      if (g && g !== 'none') n = g.trim().split(/\s+/).length;
    } catch (e) {}
    return n > 0 ? n : 1;
  }

  function paintAlt() {
    if (!els.items) return;
    var rows = els.items.querySelectorAll('.na-row');
    var cols = altCols(), i, r, c;
    for (i = 0; i < rows.length; i++) {
      r = Math.floor(i / cols);
      c = i % cols;
      if ((r + c) % 2) rows[i].setAttribute('data-alt', '1');
      else rows[i].setAttribute('data-alt', '0');
    }
    els.items.setAttribute('data-cols', String(cols));
  }

  var _altRo = null, _altN = 0;
  function altWatch() {
    if (!els.items || !window.ResizeObserver) return;
    if (!_altRo) {
      _altRo = new ResizeObserver(function () {
        if (_altN) return;
        _altN = requestAnimationFrame(function () { _altN = 0; paintAlt(); });
      });
    }
    try { _altRo.disconnect(); _altRo.observe(els.items); } catch (e) {}
  }


  /*@3.NOAJ.197*/
  var _noteT = 0;
  function edNote(msg) {
    if (!msg) return;
    saveState('', String(msg));
    clearTimeout(_noteT);
    _noteT = setTimeout(function () {
      if (els.save && !els.save.getAttribute('data-s')) saveState('', '');
    }, 5200);
  }

  function saveState(s, txt) {
    /*@3.NOAJ.105*/
    /*@3.NOAJ.138*/
    if (els.saveDot) {
      els.saveDot.setAttribute('data-s', s || '');
      els.saveDot.setAttribute('title', txt || '');
    }
    if (!els.save) return;
    els.save.setAttribute('data-s', s || '');
    els.save.textContent = txt || '';
  }

  /*@3.NOAJ.106*/
  var _posT = 0;

  function posMap() {
    var m = ui().pos;
    return (m && typeof m === 'object') ? m : {};
  }

  function rememberPos() {
    if (!edId || !els.docBody) return;
    if (_posT) return;
    var id = edId, body = els.docBody;
    _posT = setTimeout(function () {
      _posT = 0;
      if (!id || edId !== id) return;
      /*@3.NOAJ.110*/
      var y = body ? body.scrollTop : 0;
      var m = posMap(), keys;
      if (y > 24) m[id] = Math.round(y); else delete m[id];
      keys = Object.keys(m);
      if (keys.length > 60) {
        keys.slice(0, keys.length - 60).forEach(function (k) { delete m[k]; });
      }
      uiSet('pos', m);
    }, 600);
  }

  function restorePos(id) {
    var y = posMap()[id];
    if (!y || !els.docBody) return;
    var body = els.docBody, tries = 0;
    var put = function () {
      if (edId !== id) return;
      body.scrollTop = y;
      if (++tries < 4 && Math.abs(body.scrollTop - y) > 2) setTimeout(put, 60 * tries);
    };
    put();
  }

  function docEmpty() {
    dropPre(null);
    dropPdf();
    /*@3.NOAJ.195*/
    if (window.GardenNotesFind) GardenNotesFind.show(false);
    if (!els.docBody) return;
    els.docBody.innerHTML =
      '<button type="button" class="na-empty na-empty-new" style="min-block-size:60vh">' +
      '<i class="fa-solid fa-book-open"></i>' +
      '<p>' + esc(L('اختر ملاحظةً لعرضها.', 'Pick a note to open it.')) + '</p>' +
      '<p class="na-empty-hint">' + esc(L('أو اضغط هنا لملاحظةٍ جديدة.',
                                          'Or click here for a new note.')) + '</p></button>';
    if (els.docTitle) {
      els.docTitle.value = '';
      els.docTitle.disabled = true;
      syncTitleDir();
      syncTitleWord();
    }
    if (els.origin) els.origin.hidden = true;
    if (els.ribbonHost) els.ribbonHost.hidden = true;
    if (ribbon) ribbon.attach(null);
    if (overlay) { try { overlay.destroy(); } catch (e) {} overlay = null; }
    setDocActions(false);
    saveState('', '');
  }

  /*@3.NOAJ.63*/
  var _docActsBound = false;

  function bindDocActs() {
    if (_docActsBound) return;
    _docActsBound = true;
    var fb = document.getElementById('na-full');
    if (fb) fb.addEventListener('click', toggleFull);
    var hb = document.getElementById('na-inkhide');
    if (hb) hb.addEventListener('click', toggleInkHidden);
    document.addEventListener('fullscreenchange', paintFull);
    document.addEventListener('webkitfullscreenchange', paintFull);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (fsOn()) return;
      if (!document.documentElement.classList.contains('na-full')) return;
      if (document.querySelector('dialog[open]')) return;
      document.documentElement.classList.remove('na-full');
      var b2 = document.getElementById('na-full');
      if (b2) b2.setAttribute('aria-pressed', 'false');
      applyWidth();
    });
  }

  function setDocActions(on) {
    var shb = document.getElementById('na-share-btn');
    if (shb) shb.disabled = !on;
    /*@3.NOAJ.143*/
    var rb0 = document.getElementById('na-remind-btn');
    if (rb0) rb0.disabled = !on;
    ['naDel', 'naPin', 'naMove', 'naPage'].forEach(function (k) {
      if (els[k]) els[k].disabled = !on;
    });
    if (els.naPdf) els.naPdf.disabled = false;
    bindDocActs();
    var ih = document.getElementById('na-inkhide');
    if (ih) ih.disabled = !on;
    var mb = document.getElementById('na-more');
    if (mb) mb.disabled = !on;
    /*@3.NOAJ.189*/
    var fb = document.getElementById('na-find-btn');
    if (fb) fb.disabled = !on;
    if (!on && window.GardenNotesFind) GardenNotesFind.show(false);
  }

  /*@3.NOAJ.16*/
  /*@3.NOAJ.139*/
  var MORE = [
    { id: 'na-pin',      icon: 'fa-thumbtack',   ar: 'تثبيت',        en: 'Pin' },
    { id: 'na-remind-btn', icon: 'fa-bell',      ar: 'تنبيهٌ لهذه الملاحظة', en: 'Remind me' },
    { id: 'na-export',   icon: 'fa-file-export', ar: 'تصدير واستيراد', en: 'Export & import' },
    { id: 'na-move-btn', icon: 'fa-folder-open', ar: 'نقل إلى مجلّد', en: 'Move to folder' },
    { id: 'na-del',      icon: 'fa-trash',       ar: 'حذف',          en: 'Delete', danger: 1 }
  ];
  var moreMenu = null;

  function closeMore() {
    if (!moreMenu) return;
    moreMenu.remove();
    moreMenu = null;
    var b = document.getElementById('na-more');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function openMore(anchor) {
    closeMore();
    var m = document.createElement('div');
    m.className = 'ne-menu';
    m.setAttribute('role', 'menu');
    m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    m.innerHTML = MORE.map(function (it) {
      var src = it.id ? document.getElementById(it.id) : null;
      return '<button type="button" class="ne-menu-i' + (it.danger ? ' ne-menu-i--danger' : '') +
        '" role="menuitem" data-for="' + (it.id || '') + '"' +
        ((it.id && src && src.disabled) ? ' disabled' : '') + '>' +
        '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>' +
        '<span data-ar="' + esc(it.ar) + '" data-en="' + esc(it.en) + '">' +
        esc(L(it.ar, it.en)) + '</span></button>';
    }).join('');
    document.body.appendChild(m);

    var r = anchor.getBoundingClientRect();
    var mr = m.getBoundingClientRect();
    var pad = 8;
    m.style.insetBlockStart = Math.min(r.bottom + 6, window.innerHeight - mr.height - pad) + 'px';
    m.style.left = Math.max(pad, Math.min(r.right - mr.width, window.innerWidth - mr.width - pad)) + 'px';
    moreMenu = m;
    anchor.setAttribute('aria-expanded', 'true');

    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-for]');
      if (!b || b.disabled) return;
      closeMore();
      var src = document.getElementById(b.getAttribute('data-for'));
      if (src) src.click();
    });
  }

  /*@3.NOAJ.67*/
  /*@3.NOAJ.140*/
  function withEditor(fn) {
    if (ed) { fn(); return; }
    createNote();
    var tries = 0;
    (function wait() {
      if (ed) { fn(); return; }
      if (++tries > 60) return;
      setTimeout(wait, 100);
    })();
  }

  function importMarkdown() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.md,.markdown,.txt,text/markdown,text/plain';
    inp.style.cssText = 'position:fixed;inline-size:1px;block-size:1px;opacity:0;pointer-events:none';
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      var done = function () { setTimeout(function () { try { inp.remove(); } catch (e) {} }, 0); };
      if (!f) { done(); return; }
      var fr = new FileReader();
      fr.onerror = function () {
        saveState('error', L('تعذّرت قراءةُ الملفّ.', 'The file could not be read.'));
        done();
      };
      fr.onload = function () {
        var text = String(fr.result || '');
        var B2 = window.GardenNotesBlocks;
        if (!text.trim() || !B2 || !B2.fromMarkdown) {
          saveState('error', L('الملفُّ فارغ.', 'The file is empty.'));
          done();
          return;
        }
        withEditor(function () {
          var blocks = B2.fromMarkdown(text);
          var n = ed.appendBlocks(blocks);
          if (n && els.docTitle && !els.docTitle.value.trim()) {
            els.docTitle.value = f.name.replace(/\.(md|markdown|txt)$/i, '');
            els.docTitle.dispatchEvent(new Event('input', { bubbles: true }));
          }
          saveState('saved', L('استُورد ', 'Imported ') + n + L(' كتلة', ' blocks'));
          done();
        });
      };
      fr.readAsText(f, 'utf-8');
    });
    inp.click();
  }

  function deriveTitle(doc) {
    var B = window.GardenNotesBlocks;
    if (!B || !doc || !doc.blocks) return '';
    for (var i = 0; i < doc.blocks.length; i++) {
      var b = doc.blocks[i];
      if (b.rt) {
        var t = B.runsToText(b.rt).trim();
        if (t) return t.length > 70 ? t.slice(0, 70) + '…' : t;
      }
    }
    return '';
  }

  var TEXT_TY = { p: 1, h: 1, quote: 1, callout: 1, todo: 1, ul: 1, ol: 1, dl: 1 };

  /*@3.NOAJ.169*/
  function docHasContent(doc) {
    var B = window.GardenNotesBlocks;
    if (!doc) return false;
    if (doc.ov && (doc.ov.ink || (doc.ov.shapes && doc.ov.shapes.length))) return true;
    var bl = doc.blocks || [], i, k;
    for (i = 0; i < bl.length; i++) {
      var b = bl[i];
      if (!b) continue;
      if (!TEXT_TY[b.ty]) return true;
      if (b.rt && B && B.runsToText(b.rt).trim()) return true;
      var it = b.items || [];
      for (k = 0; k < it.length; k++) {
        if (it[k] && it[k].rt && B && B.runsToText(it[k].rt).trim()) return true;
        if (it[k] && it[k].dt && B && B.runsToText(it[k].dt).trim()) return true;
        if (it[k] && it[k].dd && B && B.runsToText(it[k].dd).trim()) return true;
      }
    }
    return false;
  }

  function notPh(v) {
    v = String(v == null ? '' : v).trim();
    return (v === 'بلا عنوان' || v === 'Untitled') ? '' : v;
  }

  function isBlankRec(rec, doc) {
    if (!rec) return false;
    if (notPh(rec.t)) return false;
    return !docHasContent(doc);
  }

  function dropBlank(id) {
    var Sy = window.GardenNotesSync;
    idxDrop(id);
    if (Sy) Sy.remove(id);
    else if (window.GardenNotesStore) window.GardenNotesStore.delDoc(id);
    delete lastSaved[id];
    delete lastSig[id];
  }

  function leaveProvisional(id, doc) {
    var rec = id ? idxFind(id) : null;
    if (!rec || !rec.pv) return false;
    if (!isBlankRec(rec, doc)) return false;
    dropBlank(id);
    return true;
  }

  /*@3.NOAJ.170*/
  function scanBlanks() {
    var St = window.GardenNotesStore;
    if (!St || !St.getDoc) return;
    var cand = idxRead().filter(function (r) {
      if (!r || r.pv || r.id === edId) return false;
      if ((r.sz | 0) > 400) return false;
      var t = String(r.t || '').trim();
      return !t || t === 'بلا عنوان' || t === 'Untitled';
    }).slice(0, 200);
    if (!cand.length) { S.blanks = []; return; }
    var hits = [];
    cand.reduce(function (chain, r) {
      return chain.then(function () {
        return St.getDoc(r.id).then(function (row) {
          /*@3.NOAJ.171*/
          if (row && row.doc && isBlankRec(r, row.doc)) hits.push(r.id);
        })['catch'](function () {});
      });
    }, Promise.resolve()).then(function () {
      S.blanks = hits;
      if (hits.length) renderList();
    });
  }

  function blanksBar() {
    var n = S.blanks.length;
    if (!n || S.blanksHid) return '';
    return '<div class="na-sweep" role="status">' +
      '<i class="fa-solid fa-broom" aria-hidden="true"></i>' +
      '<span>' + esc(L(n + ' ملاحظةً فارغةً بلا عنوانٍ ولا محتوى.',
                       n + ' notes are empty — no title, no content.')) + '</span>' +
      '<button type="button" class="na-sweep-go" data-role="sweep">' +
      esc(L('أزِلْها', 'Remove them')) + '</button>' +
      '<button type="button" class="na-sweep-x" data-role="sweep-x" aria-label="إخفاء" ' +
      'data-ar-title="إخفاء" data-en-title="Dismiss">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
  }

  function sweepBlanks() {
    var ids = S.blanks.slice(), i;
    for (i = 0; i < ids.length; i++) dropBlank(ids[i]);
    S.blanks = [];
    reload({ keepOpen: true });
    saveState('saved', L('أُزيلت ' + ids.length, ids.length + ' removed'));
    setTimeout(function () {
      if (els.save && els.save.getAttribute('data-s') === 'saved') saveState('', '');
    }, 2200);
  }

  /*@3.NOAJ.26*/
  var lastSaved = {};
  /*@3.NOAJ.196*/
  var lastSig = {};
  var DERIVED = { eng: 1, fpv: 1 };
  function contentSig(doc) {
    try {
      return JSON.stringify(doc, function (k, v) {
        return DERIVED[k] ? undefined : v;
      });
    } catch (e) { return null; }
  }

  /*@3.NOAJ.192*/
  function docPreview(doc) {
    var M = window.GardenNotesBlocks;
    var bs = (doc && doc.blocks) || [];
    var out = '', i, s;
    for (i = 0; i < bs.length && out.length < 150; i++) {
      var b = bs[i];
      if (b.ty === 'h') continue;
      if (Array.isArray(b.rt)) s = M.runsToText(b.rt);
      else if (Array.isArray(b.items)) s = b.items.map(function (x) { return M.runsToText(x.rt || []); }).join(' · ');
      else if (b.ty === 'code') s = String(b.src || '');
      else if (b.ty === 'math') s = String(b.tex || '');
      else continue;
      s = String(s).replace(/\s+/g, ' ').trim();
      if (!s) continue;
      out = out ? (out + ' · ' + s) : s;
    }
    return out.slice(0, 150);
  }

  function persist(id, doc, quiet) {
    var St = window.GardenNotesStore, Sy = window.GardenNotesSync;
    if (!St) return;
    /*@3.NOAJ.146*/
    if (edId === id && ed && ed.captureEng && ed.doc === doc) {
      try { ed.captureEng(); } catch (eG) {}
    }
    var body = JSON.stringify(doc);
    if (lastSaved[id] === body) { saveState('', ''); return; }
    var sig = contentSig(doc);
    var moved = (sig == null) || (lastSig[id] !== sig);
    var mine = (edId === id);
    var typed = mine && els.docTitle ? els.docTitle.value.trim() : '';
    var t = Date.now();
    St.putDoc(id, body, t).then(function (res) {
      lastSaved[id] = body;
      lastSig[id] = sig;
      var rec = idxFind(id);
      if (rec) {
        /*@3.NOAJ.172*/
        rec.t = notPh(typed) || notPh(rec.t) || deriveTitle(doc) || '';
        if (rec.pv && (typed || docHasContent(doc))) delete rec.pv;
        /*@3.NOAJ.166*/
        if (!quiet && moved) rec.updated_at = t;
        rec.sz = res.bytes;
        /*@3.NOAJ.193*/
        rec.x = docPreview(doc);
        idxPut(rec);
      }
      /*@3.NOAJ.119*/
      if (Sy) {
        if (!quiet) saveState('saving', L('يُزامَن…', 'Syncing…'));
        Sy.schedule(id);
      } else if (quiet) {
        saveState('', '');
      } else {
        saveState('saved', L('محفوظة', 'Saved'));
        setTimeout(function () { if (els.save && els.save.getAttribute('data-s') === 'saved') saveState('', ''); }, 1800);
      }
      /*@3.NOAJ.73*/
      shareRefreshQuiet(id);
      reload({ keepOpen: true });
    }).catch(function (e) {
      saveState('error', (e && e.code === 'doc_too_large')
        ? L('كبيرة جدّاً', 'Too large')
        : L('تعذّر الحفظ', 'Save failed'));
    });
  }

  var BG_PATTERNS = ['none', 'dot', 'grid', 'line'];

  /*@3.NOAJ.18*/
  /*@3.NOAJ.76*/
  var PAPER = {
    ivory:  { dark: '#2c2620', light: '#fdf6e3', id: '#e0b96a', ar: 'عاجيّ', en: 'Ivory' },
    sand:   { dark: '#302819', light: '#f6ecd6', id: '#d8a24a', ar: 'رمليّ', en: 'Sand' },
    blush:  { dark: '#33222a', light: '#fdeef1', id: '#ef7f92', ar: 'ورديّ', en: 'Blush' },
    mint:   { dark: '#16302a', light: '#e6f7ee', id: '#34d399', ar: 'نعناعيّ', en: 'Mint' },
    sky:    { dark: '#17293a', light: '#e7f1fd', id: '#56a8ef', ar: 'سماويّ', en: 'Sky' },
    lilac:  { dark: '#2b2340', light: '#f0eafd', id: '#a78bfa', ar: 'خزاميّ', en: 'Lilac' },
    slate:  { dark: '#23282d', light: '#eef1f4', id: '#94a3b8', ar: 'رماديّ', en: 'Slate' },
    olive:  { dark: '#262e1b', light: '#eef4e0', id: '#a3b545', ar: 'زيتونيّ', en: 'Olive' }
  };
  var PAPER_KEYS = Object.keys(PAPER);

  /*@3.NOAJ.188*/
  var TONE_DARK = {
    '--tn-ink': '#e5e7eb', '--tn-amber': '#fbbf24', '--tn-rose': '#fb7185',
    '--tn-violet': '#c084fc', '--tn-emerald': '#34d399', '--tn-sky': '#38bdf8',
    '--tn-lime': '#a3e635', '--tn-orange': '#fb923c', '--tn-red': '#f87171',
    '--tn-pink': '#f472b6', '--tn-teal': '#2dd4bf', '--tn-indigo': '#818cf8',
    '--cd-kw': '#c084fc', '--cd-st': '#86efac', '--cd-cm': '#6b7280',
    '--cd-nu': '#fbbf24', '--cd-fn': '#60a5fa', '--cd-ty': '#2dd4bf', '--cd-op': '#f472b6'
  };
  var TONE_LIGHT = {
    '--tn-ink': '#111827', '--tn-amber': '#b45309', '--tn-rose': '#be123c',
    '--tn-violet': '#6d28d9', '--tn-emerald': '#047857', '--tn-sky': '#0369a1',
    '--tn-lime': '#4d7c0f', '--tn-orange': '#c2410c', '--tn-red': '#b91c1c',
    '--tn-pink': '#be185d', '--tn-teal': '#0f766e', '--tn-indigo': '#4338ca',
    '--cd-kw': '#7e22ce', '--cd-st': '#15803d', '--cd-cm': '#9ca3af',
    '--cd-nu': '#b45309', '--cd-fn': '#1d4ed8', '--cd-ty': '#0f766e', '--cd-op': '#be185d'
  };

  function syncToneClass() {
    try {
      var lt = isLightTheme();
      var st = document.documentElement.style, k;
      var pal = lt ? TONE_LIGHT : TONE_DARK;
      for (k in pal) if (Object.prototype.hasOwnProperty.call(pal, k)) st.setProperty(k, pal[k]);
      document.documentElement.setAttribute('data-lighttone', lt ? '1' : '0');
    } catch (e) {}
  }

  /*@3.NOAJ.35*/
  function isLightTheme() {
    if (window.GardenCanvas && GardenCanvas.themeIsLight) return GardenCanvas.themeIsLight();
    try { return document.documentElement.getAttribute('data-theme') === 'light'; }
    catch (e) { return false; }
  }

  function paperHex(k) {
    if (typeof k === 'string' && k.charAt(0) === '#') {
      return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(k) : k;
    }
    var c = PAPER[k];
    if (!c) return '';
    return isLightTheme() ? c.light : c.dark;
  }
  var COVER_GROUPS = [
    { ar: 'لونٌ صافٍ', en: 'Solid colour', keys: ['ash', 'clay', 'sage', 'denim', 'plum', 'ochre', 'teal', 'brick'] },
    { ar: 'تدرّجٌ هادئ', en: 'Soft gradient', keys: ['dawn', 'moss', 'dusk', 'sand', 'ink', 'sea', 'hearth', 'frost'] },
    { ar: 'نسيجٌ مولَّد', en: 'Generated texture', keys: ['grain', 'linen', 'paper', 'slateT'] }
  ];
  var COVER_ART = COVER_GROUPS.reduce(function (a, g) { return a.concat(g.keys); }, []);

  function toneHex(t) {
    if (!t) return '';
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '';
  }

  /*@3.NOAJ.6*/
  function applyPage(doc) {
    var page = document.getElementById('na-page');
    var cov = document.getElementById('na-cover');
    if (!page) return;
    var bg = (doc && doc.bg && typeof doc.bg === 'object') ? doc.bg : {};
    var pat = BG_PATTERNS.indexOf(bg.p) >= 0 ? bg.p : 'dot';
    page.setAttribute('data-bgp', pat);
    /*@3.NOAJ.19*/
    var hex = paperHex(bg.c);
    if (hex) page.style.setProperty('--na-paper', hex);
    else page.style.removeProperty('--na-paper');
    page.setAttribute('data-tinted', hex ? '1' : '0');
    /*@3.NOAJ.36*/
    if (hex) {
      var lum = (window.GardenCanvas && GardenCanvas.lumOf) ? GardenCanvas.lumOf(hex) : null;
      page.setAttribute('data-paper', (lum != null && lum > 0.34) ? 'light' : 'dark');
    } else {
      page.removeAttribute('data-paper');
    }
    setCovVar();
    requestAnimationFrame(function () { setCovVar(); growPages(); });
    if (window.GardenCanvas && GardenCanvas.setPaper) {
      if (GardenCanvas.setPaper(hex) && overlay && overlay.cv) {
        try { overlay.cv.paint(); } catch (e0) {}
      }
    }
    setTimeout(alignRules, 0);
    var op = (typeof bg.o === 'number' && bg.o >= 0 && bg.o <= 100) ? bg.o : 10;
    page.style.setProperty('--na-bgo', String(op / 100));
    var gap = (typeof bg.g === 'number' && bg.g >= 14 && bg.g <= 48) ? bg.g : 22;
    page.style.setProperty('--na-bgg', gap + 'px');

    queueFit();
    if (!cov) return;
    var c = (doc && doc.cover && typeof doc.cover === 'object') ? doc.cover : null;
    var url = c ? httpsOnly(c.url) : '';
    var art = (c && COVER_ART.indexOf(c.g) >= 0) ? c.g : '';
    if (!url && !art) { cov.hidden = true; cov.style.backgroundImage = ''; cov.removeAttribute('data-art'); return; }
    cov.hidden = false;
    if (art) { cov.setAttribute('data-art', art); cov.style.backgroundImage = ''; }
    else { cov.removeAttribute('data-art'); cov.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")'; }
    /*@3.NOAJ.79*/
    var cy = (c && typeof c.py === 'number') ? c.py : 50;
    var cz = (c && typeof c.zm === 'number') ? c.zm : 100;
    cov.style.backgroundPosition = '50% ' + cy + '%';
    cov.style.backgroundSize = art ? '' : (cz > 100 ? (cz + '% auto') : 'cover');
  }

  function httpsOnly(u) {
    var B = window.GardenNotesBlocks;
    if (B && B.httpsOnly) return B.httpsOnly(u);
    return /^https:\/\//i.test(String(u || '')) ? String(u) : '';
  }

  var PATS = [
    { k: 'none', ar: 'سادة',  en: 'Plain' },
    { k: 'dot',  ar: 'نقطية', en: 'Dots' },
    { k: 'grid', ar: 'شبكة',  en: 'Grid' },
    { k: 'line', ar: 'مسطّرة', en: 'Ruled' }
  ];
  var ART_LABEL = {
    ash: ['رماديّ', 'Ash'],
    clay: ['طينيّ', 'Clay'],
    sage: ['مريميّ', 'Sage'],
    denim: ['نيليّ', 'Denim'],
    plum: ['برقوقيّ', 'Plum'],
    ochre: ['مغرة', 'Ochre'],
    teal: ['فيروزيّ', 'Teal'],
    brick: ['قرميديّ', 'Brick'],
    dawn: ['الفجر', 'Dawn'],
    moss: ['الطحلب', 'Moss'],
    dusk: ['الغسق', 'Dusk'],
    sand: ['الرمل', 'Sand'],
    ink: ['الحبر', 'Ink'],
    sea: ['البحر', 'Sea'],
    ember: ['الجمر', 'Ember'],
    frost: ['الصقيع', 'Frost'],
    grain: ['حبيبات', 'Grain'],
    linen: ['كتّان', 'Linen'],
    paper: ['ورق', 'Paper'],
    slateT: ['صخر', 'Slate']
  };

  function docBg() {
    if (!ed || !ed.doc) return null;
    if (!ed.doc.bg || typeof ed.doc.bg !== 'object') ed.doc.bg = {};
    return ed.doc.bg;
  }

  /*@3.NOAJ.7*/
  function buildPageDlg() {
    var dlg = document.getElementById('na-pagedlg');
    if (!dlg) return;

    var arts = dlg.querySelector('#na-cover-arts');
    if (arts) {
      arts.innerHTML = COVER_GROUPS.map(function (g) {
        return '<div class="na-pg-gh">' + esc(L(g.ar, g.en)) + '</div>' +
          '<div class="na-pg-arts">' + g.keys.map(function (a) {
            var lab = ART_LABEL[a] || [a, a];
            return '<button type="button" class="na-pg-art" data-art="' + a + '"' +
              ' aria-pressed="false" aria-label="' + esc(L(lab[0], lab[1])) + '"' +
              ' data-ar-title="' + esc(lab[0]) + '" data-en-title="' + esc(lab[1]) + '"></button>';
          }).join('') + '</div>';
      }).join('');
    }
    var pats = dlg.querySelector('#na-bg-pats');
    if (pats) {
      pats.innerHTML = PATS.map(function (pt) {
        return '<button type="button" class="gsf-chip" data-pat="' + pt.k + '"' +
          ' aria-pressed="false" data-ar="' + esc(pt.ar) + '" data-en="' + esc(pt.en) + '">' +
          esc(L(pt.ar, pt.en)) + '</button>';
      }).join('');
    }
    var tones = dlg.querySelector('#na-bg-tones');
    if (tones) {
      tones.innerHTML =
        '<button type="button" class="na-pg-tone na-pg-tone--off" data-tone=""' +
        ' aria-pressed="false" aria-label="' + esc(L('بلا لون', 'No colour')) + '"' +
        ' data-ar-title="بلا لون" data-en-title="No colour"></button>' +
        PAPER_KEYS.map(function (k) {
          return '<button type="button" class="na-pg-tone" data-tone="' + k + '"' +
            ' style="--t:' + (PAPER[k].id || paperHex(k)) +
            ';--tp:' + paperHex(k) + '" aria-pressed="false"' +
            ' aria-label="' + esc(L(PAPER[k].ar, PAPER[k].en)) + '"' +
            ' data-ar-title="' + esc(PAPER[k].ar) + '" data-en-title="' + esc(PAPER[k].en) + '"></button>';
        }).join('') +
        '<button type="button" class="na-pg-tone na-pg-tone--pick" data-paper-pick="1"' +
        ' aria-label="' + esc(L('لون مخصّص', 'Custom colour')) + '"' +
        ' data-ar-title="لون مخصّص" data-en-title="Custom colour">' +
        '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button>';
    }

    dlg.addEventListener('click', function (e) {
      if (!ed || !ed.doc) return;
      var a = e.target.closest('[data-art]');
      if (a) {
        ed.doc.cover = { g: a.getAttribute('data-art') };
        var ui = dlg.querySelector('#na-cover-url');
        if (ui) ui.value = '';
        applyPage(ed.doc); ed.touch(); syncPageDlg(); return;
      }
      var pt = e.target.closest('[data-pat]');
      if (pt) {
        var bg = docBg(); if (!bg) return;
        bg.p = pt.getAttribute('data-pat');
        applyPage(ed.doc); ed.touch(); syncPageDlg(); return;
      }
      var tn = e.target.closest('[data-tone]');
      if (tn) {
        var bg2 = docBg(); if (!bg2) return;
        bg2.c = tn.getAttribute('data-tone') || '';
        applyPage(ed.doc); ed.touch(); syncPageDlg(); return;
      }
      /*@3.NOAJ.20*/
      var pk = e.target.closest('[data-paper-pick]');
      if (pk) {
        var bgP = docBg(); if (!bgP) return;
        /*@3.NOAJ.60*/
        var cur = paperHex(bgP.c) || (isLightTheme() ? '#fdf8ec' : '#2a2620');
        var S = window.GardenSwatch;
        if (S && S.board) {
          S.board(pk, cur, function (v) {
            bgP.c = v;
            applyPage(ed.doc); ed.touch(); syncPageDlg();
          });
        }
        return;
      }
      var sl = e.target.closest('[data-bgk]');
      if (sl) return;
      if (e.target.closest('#na-cover-off')) {
        ed.doc.cover = null;
        var ui2 = dlg.querySelector('#na-cover-url');
        if (ui2) ui2.value = '';
        applyPage(ed.doc); ed.touch(); syncPageDlg();
      }
    });

    var prev = dlg.querySelector('#na-cover-prev');
    var pimg = dlg.querySelector('#na-cover-img');
    var pzoom = dlg.querySelector('#na-cover-zoom');
    if (pimg) {
      var drag = null;
      pimg.addEventListener('pointerdown', function (e) {
        var c0 = ed && ed.doc && ed.doc.cover;
        if (!c0 || !c0.url) return;
        drag = { y: e.clientY, py: (typeof c0.py === 'number') ? c0.py : 50 };
        try { pimg.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
      });
      pimg.addEventListener('pointermove', function (e) {
        if (!drag || !ed || !ed.doc || !ed.doc.cover) return;
        var d = (drag.y - e.clientY) / 2;
        ed.doc.cover.py = Math.max(0, Math.min(100, Math.round(drag.py + d)));
        applyPage(ed.doc);
        syncCoverPrev();
      });
      var stopDrag = function () {
        if (!drag) return;
        drag = null;
        if (ed) ed.touch();
      };
      pimg.addEventListener('pointerup', stopDrag);
      pimg.addEventListener('pointercancel', stopDrag);
    }
    if (pzoom) pzoom.addEventListener('input', function () {
      if (!ed || !ed.doc || !ed.doc.cover) return;
      ed.doc.cover.zm = parseInt(pzoom.value, 10) || 100;
      applyPage(ed.doc);
      syncCoverPrev();
      ed.touch();
    });

    var uns = dlg.querySelector('#na-cover-uns');
    if (uns) uns.addEventListener('click', function () {
      if (!window.GardenUnsplash) return;
      GardenUnsplash.open(function (p) {
        if (!ed || !ed.doc || !p || !p.url) return;
        ed.doc.cover = { url: p.url, by: p.by || '', byLink: p.byLink || '' };
        applyPage(ed.doc); ed.touch(); syncPageDlg();
      });
    });

    var url = dlg.querySelector('#na-cover-url');
    if (url) url.addEventListener('input', function () {
      if (!ed || !ed.doc) return;
      var v = httpsOnly(url.value);
      ed.doc.cover = v ? { url: v } : null;
      applyPage(ed.doc); ed.touch(); syncPageDlg();
    });
  }

  function syncCoverPrev() {
    var dlg = document.getElementById('na-page-dlg') || document.getElementById('na-pagedlg');
    var prev = document.getElementById('na-cover-prev');
    var pimg = document.getElementById('na-cover-img');
    var pz = document.getElementById('na-cover-zoom');
    if (!prev || !pimg) return;
    var c = (ed && ed.doc && ed.doc.cover) ? ed.doc.cover : null;
    var url = c ? httpsOnly(c.url) : '';
    prev.hidden = !url;
    if (!url) return;
    pimg.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
    var py = (typeof c.py === 'number') ? c.py : 50;
    var zm = (typeof c.zm === 'number') ? c.zm : 100;
    pimg.style.backgroundPosition = '50% ' + py + '%';
    pimg.style.backgroundSize = zm > 100 ? (zm + '% auto') : 'cover';
    if (pz) pz.value = String(zm);
  }

  function syncPageDlg() {
    syncCoverPrev();
    var dlg = document.getElementById('na-pagedlg');
    if (!dlg || !ed || !ed.doc) return;
    var bg = (ed.doc.bg && typeof ed.doc.bg === 'object') ? ed.doc.bg : {};
    var cv = (ed.doc.cover && typeof ed.doc.cover === 'object') ? ed.doc.cover : {};
    [].forEach.call(dlg.querySelectorAll('[data-pat]'), function (b) {
      var on = (b.getAttribute('data-pat') === (bg.p || 'dot'));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
    [].forEach.call(dlg.querySelectorAll('[data-tone]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-tone') === (bg.c || '') ? 'true' : 'false');
    });
    [].forEach.call(dlg.querySelectorAll('[data-art]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-art') === (cv.g || '') ? 'true' : 'false');
    });
    var pick = dlg.querySelector('[data-paper-pick]');
    if (pick) {
      var isHex = typeof bg.c === 'string' && bg.c.charAt(0) === '#';
      pick.setAttribute('aria-pressed', isHex ? 'true' : 'false');
      if (isHex) pick.style.setProperty('--t', paperHex(bg.c));
      else pick.style.removeProperty('--t');
    }
    var op = dlg.querySelector('#na-bg-op'), opv = dlg.querySelector('[data-role="opv"]');
    if (op) { op.value = String(typeof bg.o === 'number' ? bg.o : 10); if (opv) opv.textContent = op.value + '%'; }
    var gp = dlg.querySelector('#na-bg-gap'), gpv = dlg.querySelector('[data-role="gapv"]');
    if (gp) { gp.value = String(typeof bg.g === 'number' ? bg.g : 22); if (gpv) gpv.textContent = gp.value + 'px'; }
    var noPat = (bg.p || 'none') === 'none';
    if (op) op.disabled = noPat;
    if (gp) gp.disabled = noPat || bg.p === 'line' ? noPat : false;
  }

  /*@3.NOAJ.21*/
  function bindPageSliders() {
    var dlg = document.getElementById('na-pagedlg');
    if (!dlg) return;
    dlg.addEventListener('input', function (e) {
      var sl = e.target.closest('[data-bgk]');
      if (!sl || !ed || !ed.doc) return;
      var bg = docBg(); if (!bg) return;
      var k = sl.getAttribute('data-bgk');
      bg[k] = Number(sl.value);
      var out = sl.parentNode.querySelector('output');
      if (out) out.textContent = sl.value + (k === 'o' ? '%' : 'px');
      applyPage(ed.doc);
      ed.touch();
    });
  }

  function openPageDlg() {
    var dlg = document.getElementById('na-pagedlg');
    if (!dlg || !ed || !ed.doc) return;
    var url = dlg.querySelector('#na-cover-url');
    var cv = (ed.doc.cover && typeof ed.doc.cover === 'object') ? ed.doc.cover : {};
    if (url) url.value = cv.url || '';
    syncPageDlg();
    try { dlg.showModal(); } catch (e) {}
  }

  var EXP_SCOPE = 'one';
  var EXP_RNG = { on: false, a: 1, b: 1 };

  /*@3.NOAJ.168*/
  function pageRange() {
    if (EXP_SCOPE !== 'one' || !EXP_RNG.on) return null;
    var n = expTotalPages();
    var a = Math.max(1, Math.min(n, EXP_RNG.a | 0));
    var b = Math.max(a, Math.min(n, EXP_RNG.b | 0));
    if (a === 1 && b >= n) return null;
    return { from: a, to: b };
  }

  function expTotalPages() {
    var n = 1;
    try { n = growPages(); } catch (e) {}
    return Math.max(1, n | 0);
  }

  function syncRange() {
    var dlg = document.getElementById('na-exp');
    if (!dlg) return;
    var box = dlg.querySelector('#na-exp-rng');
    if (!box) return;
    var one = (EXP_SCOPE === 'one') && !!ed;
    box.hidden = !one;
    if (!one) return;
    var n = expTotalPages();
    if (EXP_RNG.b < 1 || EXP_RNG.b > n) EXP_RNG.b = n;
    if (EXP_RNG.a < 1 || EXP_RNG.a > n) EXP_RNG.a = 1;
    [].forEach.call(box.querySelectorAll('[data-rng]'), function (b) {
      var on = (b.getAttribute('data-rng') === 'pick') === EXP_RNG.on;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var row = box.querySelector('#na-rng-row');
    if (row) row.hidden = !EXP_RNG.on;
    var ia = box.querySelector('#na-rng-a'), ib = box.querySelector('#na-rng-b');
    if (ia) { ia.max = String(n); if (document.activeElement !== ia) ia.value = String(EXP_RNG.a); }
    if (ib) { ib.max = String(n); if (document.activeElement !== ib) ib.value = String(EXP_RNG.b); }
    var tot = box.querySelector('#na-rng-tot');
    if (tot) tot.textContent = L('من ' + n + ' صفحة', 'of ' + n + ' pages');
  }

  function metaOf(rec) {
    return {
      title: (rec && rec.t) || L('بلا عنوان', 'Untitled'),
      course: (rec && rec.o && rec.o.c) ? courseLabel(rec.o.c) : '',
      date: new Date().toLocaleDateString(isAr() ? 'ar-SA' : 'en-GB')
    };
  }

  /*@3.NOAJ.80*/
  /*@3.NOAJ.93*/
  function printSpans() {
    var sheet = document.getElementById('na-sheet');
    var root = sheet && sheet.querySelector('.ne-root');
    var stage = document.getElementById('na-zoom');
    if (!sheet || !root || !stage) return null;
    var z = stageZoom() || 1;
    var stR = stage.getBoundingClientRect();
    var rtR = root.getBoundingClientRect();
    var rtl = false;
    try { rtl = getComputedStyle(root).direction === 'rtl'; } catch (e) {}
    var shR = sheet.getBoundingClientRect();
    var out = { rootTop: (rtR.top - stR.top) / z, rootH: rtR.height / z,
                sheetTop: (shR.top - stR.top) / z, map: {} };
    var kids = root.children, i;
    for (i = 0; i < kids.length; i++) {
      var k = kids[i];
      var bid = k.getAttribute && k.getAttribute('data-bid');
      if (!bid) continue;
      var r = k.getBoundingClientRect();
      out.map[bid] = {
        t: (r.top - rtR.top) / z,
        s: (rtl ? (rtR.right - r.right) : (r.left - rtR.left)) / z,
        w: r.width / z,
        h: r.height / z
      };
    }
    return out;
  }

  function printClone() {
    var stage = document.getElementById('na-zoom');
    var page = document.getElementById('na-page');
    if (!stage || !page) return null;
    var clone = stage.cloneNode(true);
    clone.removeAttribute('id');
    /*@3.NOAJ.135*/
    clone.style.setProperty('--na-z', '1');
    clone.style.inlineSize = '';
    clone.style.blockSize = '';
    var tfc = clone.querySelector('.na-tf');
    if (tfc) {
      tfc.removeAttribute('id');
      tfc.style.transform = 'none';
      tfc.style.willChange = '';
      tfc.style.position = 'static';
    }
    var i, n, list;
    list = clone.querySelectorAll('.nov-host');
    for (i = 0; i < list.length; i++) list[i].remove();
    /*@3.NOAJ.81*/
    /*@3.NOAJ.157*/
    var srcAll = stage.querySelectorAll('canvas');
    var srcC = [];
    for (i = 0; i < srcAll.length; i++) {
      if (!srcAll[i].closest || !srcAll[i].closest('.nov-host')) srcC.push(srcAll[i]);
    }
    var dstC = clone.querySelectorAll('canvas');
    var zc = stageZoom() || 1;
    for (i = 0; i < dstC.length && i < srcC.length; i++) {
      var cr = srcC[i].getBoundingClientRect();
      var img = document.createElement('img');
      img.className = dstC[i].className;
      img.setAttribute('alt', '');
      img.style.cssText = 'display:block;inline-size:' + Math.round(cr.width / zc) +
        'px;block-size:' + Math.round(cr.height / zc) + 'px';
      try { img.src = srcC[i].toDataURL('image/png'); } catch (eC) {}
      dstC[i].parentNode.replaceChild(img, dstC[i]);
    }
    /*@3.NOAJ.175*/
    var srcD = stage.querySelectorAll('.ne-dgm');
    var dstD = clone.querySelectorAll('.ne-dgm');
    for (i = 0; i < dstD.length && i < srcD.length; i++) {
      var sv = srcD[i].querySelector('svg');
      var host = dstD[i];
      if (!sv) {
        var preF = host.parentNode ? host.parentNode.querySelector('.ne-code') : null;
        if (preF) preF.hidden = false;
        host.remove();
        continue;
      }
      var dr = sv.getBoundingClientRect();
      var dw = Math.max(1, Math.round(dr.width / zc));
      var dh = Math.max(1, Math.round(dr.height / zc));
      var dimg = document.createElement('img');
      dimg.setAttribute('alt', sv.getAttribute('aria-label') || '');
      dimg.style.cssText = 'display:block;margin:0 auto;inline-size:' + dw +
        'px;block-size:' + dh + 'px';
      /*@3.NOAJ.198*/
      /*@3.NOAJ.201*/
      var baked = null;
      try {
        var Mm = window.GardenNotesMermaid;
        baked = (Mm && Mm.bake) ? Mm.bake(sv, dw, dh, printDark() ? 'dark' : 'light') : null;
      } catch (eD) { baked = null; }
      if (!baked) {
        var preB = host.parentNode ? host.parentNode.querySelector('.ne-code') : null;
        if (preB) preB.hidden = false;
        host.remove();
        continue;
      }
      dimg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(baked.svg);
      host.textContent = '';
      host.appendChild(dimg);
    }

    /*@3.NOAJ.82*/
    list = clone.querySelectorAll('[contenteditable]');
    for (i = 0; i < list.length; i++) list[i].removeAttribute('spellcheck');
    list = clone.querySelectorAll('[data-bsel],[data-drop],.ne-dragging,.ne-sizing');
    for (i = 0; i < list.length; i++) {
      list[i].removeAttribute('data-bsel');
      list[i].removeAttribute('data-drop');
      list[i].classList.remove('ne-dragging');
      list[i].classList.remove('ne-sizing');
    }
    /*@3.NOAJ.83*/
    /*@3.NOAJ.200*/
    n = clone.querySelector('.na-page');
    if (n) {
      var bg = (ed && ed.doc && ed.doc.bg) || {};
      var lit = (typeof bg.c === 'string' && bg.c.charAt(0) === '#')
        ? paperHex(bg.c)
        : (PAPER[bg.c] ? (printDark() ? PAPER[bg.c].dark : PAPER[bg.c].light) : '');
      if (lit) {
        n.style.setProperty('--na-paper', lit);
        n.setAttribute('data-tinted', '1');
        var plum = (window.GardenCanvas && GardenCanvas.lumOf) ? GardenCanvas.lumOf(lit) : null;
        n.setAttribute('data-paper', (plum != null && plum > 0.34) ? 'light' : 'dark');
      } else {
        n.style.removeProperty('--na-paper');
        n.setAttribute('data-tinted', '0');
        n.removeAttribute('data-paper');
      }
      n.removeAttribute('id');
    }
    var box = printInkBox();
    var sh = clone.querySelector('.na-sheet');
    if (box && sh) {
      var slot = document.createElement('div');
      slot.className = 'mink';
      slot.style.cssText = 'position:absolute;inset-block-start:' + box.top +
        'px;inset-inline-start:' + box.start + 'px;inline-size:' + box.w +
        'px;block-size:' + box.h + 'px';
      slot.innerHTML = '<!--INKSLOT-->';
      sh.appendChild(slot);
    }
    return '<div class="na" data-width="a4">' + clone.outerHTML + '</div>';
  }

  function printMode() {
    var PT = window.GardenPrintTheme;
    return PT ? PT.readMode() : 'paper';
  }

  function printDark() {
    var PT = window.GardenPrintTheme;
    return !!(PT && PT.isDark(PT.readMode()));
  }

  /*@3.NOAJ.84*/
  function printInkBox() {
    var host = document.querySelector('.nov-host');
    var sheet = document.getElementById('na-sheet');
    if (!host || !sheet) return null;
    var z = stageZoom();
    var hr = host.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    return {
      w: Math.round(hr.width / z), h: Math.round(hr.height / z),
      top: Math.round((hr.top - sr.top) / z),
      start: Math.round((isAr() ? (sr.right - hr.right) : (hr.left - sr.left)) / z)
    };
  }

  /*@3.NOAJ.161*/
  var _pdfMod = null;
  function needPdf() {
    if (window.GardenNotesPdf) return Promise.resolve(window.GardenNotesPdf);
    if (_pdfMod) return _pdfMod;
    _pdfMod = new Promise(function (res, rej) {
      var base = '';
      var probe = document.querySelector('script[src*="notes-app.js"]');
      if (probe) base = (probe.getAttribute('src') || '').replace(/notes-app\.js.*$/, '');
      var v = (probe && (probe.getAttribute('src') || '').split('?')[1]) || '';
      var el = document.createElement('script');
      el.src = base + 'notes-pdf.js' + (v ? ('?' + v) : '');
      el.onload = function () {
        if (window.GardenNotesPdf) res(window.GardenNotesPdf);
        else rej(new Error('no api'));
      };
      el.onerror = function () { _pdfMod = null; rej(new Error('load')); };
      document.head.appendChild(el);
    });
    return _pdfMod;
  }

  function pdfMeta() {
    var pm = metaOf(idxFind(edId));
    pm.land = false;
    pm.pageW = Math.round(pageWpx());
    pm.pageH = Math.round(pageH());
    pm.pages = growPages();
    pm.html = printClone();
    pm.inkBox = printInkBox();
    pm.css = printCss();
    pm.inlineCss = printInlineCss();
    pm.rootAttrs = printRootAttrs();
    pm.dir = isAr() ? 'rtl' : 'ltr';
    pm.range = pageRange();
    pm.printMode = printMode();
    pm.board = boardBox();
    return pm;
  }

  /*@3.NOAJ.204*/
  function boardBox() {
    if (!ed || !ed.doc || ed.doc.kind !== 'board') return null;
    var cv = inkCv();
    var bb = cv && cv.contentBox ? cv.contentBox() : null;
    if (!bb || !(bb.w > 0) || !(bb.h > 0)) return null;
    var pad = 28;
    return { x: Math.round(bb.x - pad), y: Math.round(bb.y - pad),
             w: Math.round(bb.w + pad * 2), h: Math.round(bb.h + pad * 2) };
  }

  function expMsg(txt) {
    var p = document.querySelector('#na-exp .na-pg-hint');
    if (p) p.textContent = txt;
  }

  function wirePrintTheme() {
    var sel = document.getElementById('na-prt-theme');
    var PT = window.GardenPrintTheme;
    if (!sel || !PT) return;
    sel.value = PT.readMode();
    if (window.GardenSelect && GardenSelect.sync) GardenSelect.sync(sel);
    if (sel._ptWired) return;
    sel._ptWired = true;
    sel.addEventListener('change', function () { PT.writeMode(this.value); });
  }

  /*@3.NOAJ.162*/
  function exportPdfNative() {
    if (!ed || !ed.doc) return;
    try { ed.save(); } catch (e) {}
    var dlg = document.getElementById('na-exp');
    var keep = dlg ? dlg.querySelector('.na-pg-hint') : null;
    var was = keep ? keep.textContent : '';
    var btns = dlg ? dlg.querySelectorAll('.na-exp-f') : [];
    var q;
    for (q = 0; q < btns.length; q++) btns[q].disabled = true;
    expMsg(L('يُكتب ملفُّ PDF… قد يستغرق ثوانيَ في الملاحظات الطويلة.',
             'Writing the PDF… long notes take a few seconds.'));
    needPdf().then(function (api) {
      return api.save(pdfMeta(), ed.doc);
    }).then(function (r) {
      /*@3.NOAJ.163*/
      var miss = 0, k;
      for (k in (r.missing || {})) miss += r.missing[k];
      var kb = Math.round(r.size / 1024);
      expMsg(L('حُفظ الملفّ: ' + r.pages + ' صفحة · ' + kb + ' كيلوبايت.',
               'Saved: ' + r.pages + ' pages · ' + kb + ' KB.') +
             (miss ? L(' و' + miss + ' رمزاً لم يحمله الخطُّ فلم يُرسم.',
                       ' ' + miss + ' glyphs the font lacks were skipped.') : '') +
             (r.imgFail ? L(' و' + r.imgFail + ' صورةً تعذّر تضمينُها (‏موقعُها يمنع القراءة).',
                            ' ' + r.imgFail + ' images could not be embedded (host blocks reading).') : ''));
      setTimeout(function () {
        try { dlg.close(); } catch (e2) {}
        if (keep) keep.textContent = was;
      }, 1800);
    })['catch'](function (e) {
      expMsg(L('تعذّر كتابةُ الملفّ. ' + (e && e.message ? e.message : ''),
               'Could not write the file. ' + (e && e.message ? e.message : '')));
    })['finally'](function () {
      for (var z = 0; z < btns.length; z++) btns[z].disabled = false;
      syncExport();
    });
  }

  function exportPdf() {
    if (!ed || !ed.doc || !window.GardenNotesPrint) return;
    try { ed.save(); } catch (e) {}
    var pm = metaOf(idxFind(edId));
    pm.land = false;
    pm.pageW = Math.round(pageWpx());
    pm.pageH = Math.round(pageH());
    pm.pages = growPages();
    pm.range = pageRange();
    pm.spans = printSpans();
    pm.html = printClone();
    pm.inkBox = printInkBox();
    if (pm.spans && pm.inkBox) {
      pm.spans.inkTop = pm.inkBox.top;
      pm.spans.inkH = pm.inkBox.h;
    }
    /*@3.NOAJ.97*/
    if (ed.doc.kind === 'board') {
      var cvP = inkCv();
      var bbP = cvP && cvP.contentBox && cvP.contentBox();
      var stgP = document.getElementById('na-zoom');
      if (bbP && stgP && cvP.wet) {
        var zP = stageZoom() || 1;
        var wrP = cvP.wet.getBoundingClientRect(), strP = stgP.getBoundingClientRect();
        var cTop = (wrP.top - strP.top) / zP;
        var cy0 = cTop + (bbP.y * cvP.cam.z + cvP.cam.y) - 30;
        var chP = bbP.h * cvP.cam.z + 60;
        pm.crop = { y0: Math.max(0, Math.round(cy0)), h: Math.max(160, Math.round(chP)) };
      }
    }
    pm.css = printCss();
    pm.inlineCss = printInlineCss();
    pm.rootAttrs = printRootAttrs();
    pm.dir = isAr() ? 'rtl' : 'ltr';
    GardenNotesPrint.print(ed.doc, pm);
  }

  /*@3.NOAJ.85*/
  function printCss() {
    var out = [], links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href') || '';
      if (/garden-header\.css|bottom-nav\.css/.test(h)) continue;
      out.push(links[i].href);
    }
    return out;
  }

  /*@3.NOAJ.164*/
  function printInlineCss() {
    var out = [], tags = document.querySelectorAll('style');
    for (var i = 0; i < tags.length; i++) {
      var id = tags[i].id || '';
      if (/^claude-|^grammarly|-extension$/.test(id)) continue;
      var t = tags[i].textContent || '';
      if (t) out.push(t);
    }
    return out;
  }

  function printRootAttrs() {
    var out = {}, a = document.documentElement.attributes, i;
    for (i = 0; i < a.length; i++) {
      var n = a[i].name;
      if (n === 'dir' || n === 'lang' || n === 'data-theme') continue;
      out[n] = a[i].value;
    }
    return out;
  }

  /*@3.NOAJ.141*/
  function setExpTab(which) {
    var dlg = document.getElementById('na-exp');
    if (!dlg) return;
    var w = which === 'in' ? 'in' : 'out';
    [].forEach.call(dlg.querySelectorAll('[data-xtab]'), function (b) {
      var on = b.getAttribute('data-xtab') === w;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var po = dlg.querySelector('#na-exp-pane-out');
    var pi = dlg.querySelector('#na-exp-pane-in');
    if (po) po.hidden = w !== 'out';
    if (pi) pi.hidden = w !== 'in';
  }

  function openExport() {
    var dlg = document.getElementById('na-exp');
    if (!dlg) return;
    EXP_SCOPE = ed ? 'one' : 'all';
    EXP_RNG = { on: false, a: 1, b: expTotalPages() };
    setExpTab('out');
    impMsg('', '');
    wirePrintTheme();    var fmts = dlg.querySelector('#na-exp-fmts');
    var Sz = window.GardenNotesSerialize;
    if (fmts && Sz) {
      /*@3.NOAJ.156*/
      var h = '<button type="button" class="na-exp-f" data-fmt="pdf">' +
        '<i class="fa-solid fa-print" aria-hidden="true"></i><span>' +
        esc(L('طباعة', 'Print')) + '</span></button>';
      h += '<button type="button" class="na-exp-f" data-fmt="pdfx">' +
        '<i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i><span>' +
        esc(L('تصدير PDF', 'Export PDF')) + '</span></button>';
      var order = ['html', 'md', 'txt', 'json'];
      var ic = { html: 'fa-code', md: 'fa-hashtag', txt: 'fa-align-left', json: 'fa-file-arrow-down' };
      for (var i = 0; i < order.length; i++) {
        var f = Sz.FORMATS[order[i]];
        h += '<button type="button" class="na-exp-f" data-fmt="' + order[i] + '">' +
          '<i class="fa-solid ' + ic[order[i]] + '" aria-hidden="true"></i>' +
          '<span>' + esc(L(f.ar, f.en)) + '</span></button>';
      }
      fmts.innerHTML = h;
      i18n(fmts);
    }
    syncExport();
    try { dlg.showModal(); } catch (e) {}
  }

  function syncExport() {
    var dlg = document.getElementById('na-exp');
    if (!dlg) return;
    [].forEach.call(dlg.querySelectorAll('[data-scope]'), function (b) {
      var on = b.getAttribute('data-scope') === EXP_SCOPE;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var sub = dlg.querySelector('[data-role="scope"]');
    if (sub) {
      sub.textContent = (EXP_SCOPE === 'one')
        ? ((idxFind(edId) || {}).t || L('بلا عنوان', 'Untitled'))
        : vName(S.view) + ' — ' + richInView().length + ' ' + L('ملاحظة', 'notes');
    }
    var pdf = dlg.querySelector('[data-fmt="pdf"]');
    if (pdf) pdf.disabled = (EXP_SCOPE !== 'one');
    var pdfx = dlg.querySelector('[data-fmt="pdfx"]');
    if (pdfx) pdfx.disabled = (EXP_SCOPE !== 'one');
    syncRange();
  }

  function richInView() {
    return inView(S.view).filter(function (n) { return n.src === 'rich'; });
  }

  /*@3.NOAJ.14*/
  function collectDocs(list) {
    var St = window.GardenNotesStore;
    if (!St) return Promise.resolve([]);
    var out = [];
    return list.reduce(function (chain, n) {
      return chain.then(function () {
        return St.getDoc(n.id).then(function (row) {
          if (row && row.doc) out.push({ doc: row.doc, meta: metaOf(idxFind(n.id)) });
        })['catch'](function () {});
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  /*@3.NOAJ.22*/
  function impMsg(kind, txt) {
    var m = document.getElementById('na-imp-msg');
    if (!m) return;
    m.hidden = !txt;
    m.textContent = txt || '';
    m.setAttribute('data-s', kind || '');
  }

  function runImport(file) {
    var Sz = window.GardenNotesSerialize;
    var St = window.GardenNotesStore;
    if (!Sz || !Sz.fromJson || !file) return;
    if (file.size > 8 * 1024 * 1024) {
      impMsg('error', L('الملفُّ أكبر من ٨ ميجابايت.', 'The file is larger than 8 MB.'));
      return;
    }
    impMsg('', L('يُقرأ…', 'Reading…'));
    var fr = new FileReader();
    fr.onerror = function () {
      impMsg('error', L('تعذّرت قراءةُ الملفّ.', 'The file could not be read.'));
    };
    fr.onload = function () {
      var list = null;
      try { list = Sz.fromJson(String(fr.result || '')); } catch (e) { list = null; }
      if (!list || !list.length) {
        impMsg('error', L('هذا ليس ملفَّ ملاحظاتٍ صُدِّر من هنا.',
                          'This is not a notes file exported from here.'));
        return;
      }
      var now = Date.now();
      var made = [];
      list.forEach(function (n, k) {
        var id = newId('rn');
        var t = (n.title || '').trim() ||
                deriveTitle(n.doc) ||
                L('ملاحظة مستورَدة', 'Imported note');
        var rec = { id: id, t: t.slice(0, 80), k: 'rich', o: {}, g: [], c: null,
                    f: (S.view.k === 'folder') ? S.view.id : null,
                    p: 0, a: 0, ca: now + k, updated_at: now + k, sz: 0 };
        idxPut(rec);
        made.push({ id: id, doc: n.doc });
      });
      var jobs = made.map(function (m2) {
        return St ? St.putDoc(m2.id, m2.doc, now) : Promise.resolve();
      });
      Promise.all(jobs).then(function () {
        impMsg('ok', made.length === 1
          ? L('استُوردت ملاحظةٌ واحدة.', 'One note imported.')
          : L('استُوردت ' + made.length + ' ملاحظات.', made.length + ' notes imported.'));
        reload({ keepOpen: true });
        if (made.length === 1) openNote(made[0].id);
        closeExport(1500);
      }, function () {
        impMsg('error', L('تعذّر حفظُ الملاحظات المستورَدة.', 'The imported notes could not be saved.'));
      });
    };
    fr.readAsText(file);
  }

  function closeExport(wait) {
    var dlg = document.getElementById('na-exp');
    if (!dlg) return;
    setTimeout(function () { try { if (dlg.open) dlg.close(); } catch (e) {} },
               Math.max(0, wait || 0));
  }

  function runExport(fmt) {
    var Sz = window.GardenNotesSerialize;
    var dlg = document.getElementById('na-exp');
    if (!Sz) return;
    if (fmt === 'pdfx') { exportPdfNative(); return; }
    if (fmt === 'pdf') { try { dlg.close(); } catch (e) {} exportPdf(); return; }

    if (EXP_SCOPE === 'one') {
      if (!ed || !ed.doc) return;
      try { ed.save(); } catch (e1) {}
      Sz.exportNote(fmt, ed.doc, metaOf(idxFind(edId))).then(function (ok) {
        if (!ok) {
          saveState('error', L('الملاحظة فارغة', 'The note is empty'));
          setTimeout(function () { saveState('', ''); }, 2200);
        }
      });
      try { dlg.close(); } catch (e2) {}
      return;
    }

    var list = richInView();
    if (!list.length) return;
    saveState('saving', L('يُجهَّز…', 'Preparing…'));
    collectDocs(list).then(function (items) {
      if (!items.length) { saveState('error', L('لا شيء للتصدير', 'Nothing to export')); return; }
      return Sz.exportMany(fmt, items, vName(S.view)).then(function (ok) {
        if (ok) saveState('saved', L('صُدِّرت ' + items.length, items.length + ' exported'));
        else saveState('error', L('لا محتوى للتصدير', 'Nothing to export'));
        setTimeout(function () { saveState('', ''); }, 2200);
        /*@3.NOAJ.203*/
        if (ok) closeExport(900);
      });
    })['catch'](function () { saveState('error', L('تعذّر التصدير', 'Export failed')); });
  }

  /*@3.NOAJ.136*/
  function renderOpening(kind) {
    if (!els.docBody) return;
    /*@3.NOAJ.231*/
    var say = kind === 'pdf'
      ? L('يُفتح ملفُّ PDF…', 'Opening the PDF file…')
      : L('تُفتح الملاحظة…', 'Opening the note…');
    els.docBody.innerHTML =
      '<div class="na-opening" role="status">' +
      '<span class="na-opening-spin" aria-hidden="true"></span>' +
      '<p>' + esc(say) + '</p></div>';
  }

  /*@3.NOAJ.118*/
  function renderLoadError(id) {
    if (!els.docBody) return;
    els.docBody.innerHTML = '<div class="na-loadfail"><p>' +
      esc(L('تعذّر جلبُ محتوى الملاحظة من السحابة — المحتوى ليس على هذا الجهاز بعد.',
            'Could not fetch this note from the cloud — its content is not on this device yet.')) +
      '</p><button type="button" class="na-loadfail-retry">' +
      esc(L('أعد المحاولة', 'Retry')) + '</button></div>';
    var b = els.docBody.querySelector('.na-loadfail-retry');
    if (b) b.addEventListener('click', function () { openNote(id, { remount: true }); });
    saveState('error', L('تعذّر الجلب', 'Fetch failed'));
  }

  function openNote(id, opts) {
    var rec = idxFind(id);
    if (!rec) { closeNote(); return; }
    /*@3.NOAJ.116*/
    if (ed && edId === id && !(opts && opts.remount)) { setMob('doc'); return; }
    setMob('doc');
    if (ed && edId && edId !== id) {
      if (!leaveProvisional(edId, ed.doc)) { try { ed.save(); } catch (e) {} }
    }
    if (overlay) { try { overlay.destroy(); } catch (e3) {} overlay = null; }
    dropEditor();
    edId = id;

    if (els.docTitle) {
      els.docTitle.disabled = false;
      els.docTitle.value = notPh(rec.t);
      syncTitleDir();
      syncTitleWord();
    }
    setDocActions(true);
    syncPinBtn(rec);

    if (els.origin) {
      var o = rec.o || {};
      var label = o.c ? courseLabel(o.c) + (o.m != null ? ' · ' + L('الوحدة ', 'Module ') + o.m : '')
                      : (o.t || '');
      if (label) {
        var href = o.p ? o.p : null;
        els.origin.innerHTML =
          '<i class="fa-solid fa-link" aria-hidden="true"></i><span>' + esc(L('من: ', 'From: ')) + '</span>' +
          (href ? '<a href="' + esc(href) + '">' + esc(label) + '</a>' : '<span>' + esc(label) + '</span>');
        els.origin.hidden = false;
      } else { els.origin.hidden = true; }
    }

    if (!els.docBody || !window.GardenNotesEditor) return;
    saveState('', L('يُقرأ…', 'Loading…'));
    renderOpening(rec.k === 'pdf' ? 'pdf' : '');

    var St = window.GardenNotesStore;
    var p = St ? St.getDoc(id) : Promise.resolve(null);
    p.then(function (row) {
      if (edId !== id) return null;
      if (row && row.doc) return row;
      /*@3.NOAJ.117*/
      var Sy = window.GardenNotesSync;
      if (!Sy || !St) return row;
      saveState('', L('يُجلب من السحابة…', 'Fetching from the cloud…'));
      return Sy.pull(id).then(function (res) {
        if (edId !== id) return null;
        if (res && res.ok) return St.getDoc(id);
        if (res && (res.reason === 'not-found' || res.reason === 'no-endpoint' ||
                    res.reason === 'no-vault')) return row;
        return { loadFail: true };
      });
    }).then(function (row) {
      if (edId !== id) return null;
      /*@3.NOAJ.165*/
      return new Promise(function (go) { setTimeout(function () { go(row); }, 0); });
    }).then(function (row) {
      if (edId !== id) return;
      if (row && row.loadFail) { renderLoadError(id); return; }
      var doc = (row && row.doc) || { v: 1, blocks: [] };
      lastSaved[id] = JSON.stringify(doc);
      lastSig[id] = contentSig(doc);
      /*@3.NOAJ.205*/
      if (doc.kind === 'pdf' || (rec && rec.k === 'pdf')) {
        doc.kind = 'pdf';
        openPdf(id, doc);
        return;
      }
      /*@3.NOAJ.5*/
      els.docBody.innerHTML =
        '<div class="na-zoom" id="na-zoom">' +
        '<div class="na-tf" id="na-tf">' +
        '<div class="na-page" id="na-page" data-pages="1">' +
        '<div class="na-cover" id="na-cover" hidden></div>' +
        '<div class="na-sheet" id="na-sheet"></div>' +
        '<div class="na-pgbar">' +
        '<button type="button" class="na-delpg" id="na-delpg">' +
        '<i class="fa-solid fa-minus" aria-hidden="true"></i><span>' +
        esc(L('احذف الصفحة الأخيرة', 'Delete last page')) + '</span></button>' +
        '<button type="button" class="na-addpg" id="na-addpg">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>' +
        esc(L('أضِف صفحةً', 'Add a page')) + '</span></button>' +
        '</div></div></div></div>';
      var host = document.getElementById('na-sheet');
      var isBoard = doc.kind === 'board' || (rec && rec.k === 'board');
      if (isBoard) doc.kind = 'board';
      var pageEl0 = document.getElementById('na-page');
      if (pageEl0) pageEl0.setAttribute('data-kind', isBoard ? 'board' : 'doc');
      if (els.app) els.app.setAttribute('data-kind', isBoard ? 'board' : 'doc');
      if (ribbon && ribbon.setKind) ribbon.setKind(isBoard ? 'board' : 'doc');
      applyPage(doc);
      applyFs();
      if (hist) hist.reset();
      ed = GardenNotesEditor.mount(host, doc, {
        hist: hist,
        onDirty: function () {
          saveState('saving', L('يُحفظ…', 'Saving…'));
          /*@3.NOAJ.177*/
          queueGrow();
        },
        /*@3.NOAJ.174*/
        onSave: function (d, q) {
          persist(id, d, !!q);
          /*@3.NOAJ.190*/
          if (window.GardenNotesFind) GardenNotesFind.soil();
        },
        onSelState: function (st) { if (ribbon) ribbon.setState(st); },
        onSelectAll: function () { selectEverything(); },
        onNoteLink: function (t) { resolveNoteLink(t); },
        noteList: function () {
          return idxRead().filter(function (r) { return r.id !== edId && !r.a && r.t; })
            .sort(function (x, y) { return (y.updated_at || 0) - (x.updated_at || 0); })
            .slice(0, 80);
        },
        onAskLink: function () { if (ribbon && ribbon.askLink) ribbon.askLink(); },
        onLinkMiss: function () {
          saveState('error', L('لا يوجد عنوانٌ بهذا الاسم في الملاحظة.',
                               'No heading with that name in this note.'));
        },
        onNote: function (m) { edNote(m); },
        /*@3.NOAJ.147*/
        onSelMode: function (on) {
          if (overlay && overlay.setPick) overlay.setPick(!!on);
          if (ribbon && ed) ribbon.setState(ed.selState());
        },
        busy: function () { return !!(overlay && overlay.drawing); },
        onLayout: function () {
          queueFit();
          if (window.GardenNotesFind) GardenNotesFind.relayout();
        },
        /*@3.NOAJ.180*/
        onGeom: function () {
          growPages();
          if (window.GardenNotesFind) GardenNotesFind.relayout();
        },
        onEngShift: function (regs) {
          if (overlay && overlay.shiftY) overlay.shiftY(regs);
        },
        onImagePaste: function () {
          saveState('error', L('الصور برابط خارجيّ', 'Images by link only'));
        }
      });
      if (hist) {
        hist.register('ed', { undo: function () { return ed ? ed.doUndo() : false; },
                             redo: function () { return ed ? ed.doRedo() : false; } });
        hist.onChange = histChanged;
      }
      if (els.ribbonHost) els.ribbonHost.hidden = false;
      if (ribbon) ribbon.attach(ed);
      applyWidth();
      applyPages(1);
      syncTitleDir();
      syncTitleWord();
      /*@3.NOAJ.173*/
      if (!notPh(rec.t) && docHasContent(doc)) {
        var dt = deriveTitle(doc);
        if (dt) {
          rec.t = dt;
          idxPut(rec);
          if (els.docTitle) els.docTitle.value = dt;
          reload({ keepOpen: true });
        }
      }
      /*@3.NOAJ.144*/
      if ((!doc.eng || doc.eng.pbv !== GardenNotesEditor.PBV) &&
          !isBoard && document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          if (edId !== id || !ed) return;
          ed.captureEng();
          persist(id, ed.doc, true);
        });
      }
      /*@3.NOAJ.86*/
      try {
        var d0 = ed.readAll();
        lastSaved[id] = JSON.stringify(d0);
        lastSig[id] = contentSig(d0);
      } catch (eB) {}
      var addBtn = document.getElementById('na-addpg');
      if (addBtn) addBtn.addEventListener('click', addPage);
      var delBtn = document.getElementById('na-delpg');
      if (delBtn) delBtn.addEventListener('click', function () { delPage(delBtn); });
      /*@3.NOAJ.4*/
      if (overlay) { try { overlay.destroy(); } catch (e2) {} overlay = null; }
      if (window.GardenNotesOverlay) {
        overlay = GardenNotesOverlay.mount({
          hist: hist,
          scroller: els.docBody,
          stage: tfEl(),
          bound: !isBoard,
          sheet: host,
          favHost: document.getElementById('na-favs'),
          data: doc.ov || null,
          onChange: function (d, quiet) {
            var cur = ed ? ed.doc : null;
            if (!cur) return;
            cur.ov = (d.ink || (d.shapes && d.shapes.length)) ? d : null;
            /*@3.NOAJ.167*/
            ed.mark(!!quiet);
            growPages();
          },
          onPinch: docPinch,
          onBand: function (r) {
            var b = toRootRect(r);
            if (b && ed) ed.blocksInRect(b, true);
          },
          onTap: function (pt) {
            var b = toRootRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
            if (!b || !ed) return;
            var id = ed.blockAtPoint(b.x, b.y);
            if (id) ed.toggleBlockSel(id);
            else ed.clearBlockSel();
          }
        });
      }
      if (overlay && overlay.show) { try { overlay.show(); } catch (e3) {} }
      watchPage();
      applyInkHidden();
      if (isBoard && overlay && !overlay.on) {
        if (inkHidden()) { uiSet('inkOff', 0); applyInkHidden(); }
        try { overlay.toggle(true); } catch (e5) {}
        if (ribbon && ed) ribbon.setState(ed.selState());
      }
      growPages();
      /*@3.NOAJ.122*/
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () {
          if (edId !== id) return;
          alignRules();
          growPages();
          queueFit();
        });
      }
      if (ribbon) ribbon.setDrawing(false);
      saveState('', '');
      if (opts && opts.focus) {
        setTimeout(function () {
          var t = host.querySelector('.ne-text');
          if (t) t.focus();
        }, 60);
      } else {
        restorePos(id);
      }
    });

    history.replaceState(null, '', location.pathname + '?id=' + encodeURIComponent(id));
    setReading(true);
    renderList();
  }

  function histChanged() {
    if (ribbon && ed) { try { ribbon.setState(ed.selState()); } catch (e) {} }
    if (overlay && overlay.sync) { try { overlay.sync(); } catch (e2) {} }
  }

  function dropEditor() {
    dropPdf();
    if (ed) { try { ed.destroy(); } catch (e) {} }
    ed = null;
    if (window.GardenNotesFind) { try { GardenNotesFind.show(false); } catch (e2) {} }
  }

  function closeNote() {
    var gone = leaveProvisional(edId, ed && ed.doc);
    if (ed && !gone) { try { ed.save(); } catch (e) {} }
    if (hist) { hist.onChange = null; hist.reset(); }
    dropEditor(); edId = null;
    if (els.app) els.app.removeAttribute('data-kind');
    docEmpty();
    history.replaceState(null, '', location.pathname);
    setReading(false);
    setMob('list');
    showPanel('list');
    renderList();
  }

  function pdfPos(id, v) {
    var m = ui().pdfpos || {};
    if (v === undefined) return m[id] || null;
    if (v) m[id] = v; else delete m[id];
    var keys = Object.keys(m);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(function (k) { delete m[k]; });
    uiSet('pdfpos', m);
    return v;
  }

  /*@3.NOAJ.226*/
  function dropPre(keepId) {
    if (!pdfPre) return;
    if (keepId && pdfPre.id === keepId) return;
    try { GardenPdfOpen.drop(pdfPre.pre); } catch (e) {}
    pdfPre = null;
  }

  function dropPdf() {
    if (window.GardenNotesFind) { try { GardenNotesFind.show(false); } catch (e0) {} }
    if (pdfDial) { try { pdfDial.destroy(); } catch (eD) {} pdfDial = null; }
    if (!pdfUi) return;
    try { pdfUi.destroy(); } catch (e) {}
    pdfUi = null;
    updatePgNav();
    paintPdfBtns();
    syncTitleWord();
  }

  /*@3.NOAJ.250*/
  var PDF_LONG = 520;

  function pdfInverted() { return ui().pdfInv === 1; }

  function applyPdfInv() {
    var wrap = document.querySelector('.gpv');
    if (wrap) wrap.setAttribute('data-inv', pdfInverted() ? '1' : '0');
  }

  function togglePdfInv() {
    uiSet('pdfInv', pdfInverted() ? 0 : 1);
    applyPdfInv();
  }

  function applyPdfInkOff() {
    var wrap = document.querySelector('.gpv');
    if (wrap) wrap.setAttribute('data-inkoff', inkHidden() ? '1' : '0');
  }

  /*@3.NOAJ.251*/
  function pdfMenu(x, y) {
    if (!pdfOn()) return false;
    var sel = '';
    try { sel = String(window.getSelection() || '').trim(); } catch (e) { sel = ''; }
    var h = '';
    var ik = (pdfUi && pdfUi.ink) ? pdfUi.ink() : null;
    var nSel = (ik && ik.pick && ik.pick.ids) ? ik.pick.ids.length : 0;
    if (nSel) {
      h += ctxItem('psdup', 'fa-clone', L('كرِّرِ المحدَّد', 'Duplicate selection'));
      h += ctxItem('pscopy', 'fa-copy', L('انسخِ المحدَّد', 'Copy selection'));
      h += ctxItem('psrot', 'fa-rotate-right', L('أدِرْ ١٥°', 'Rotate 15°'));
      h += ctxItem('psdel', 'fa-trash', L('احذفِ المحدَّد', 'Delete selection'), 1);
      h += '<div class="na-ctx-sep" aria-hidden="true"></div>';
    } else if (ik && ik.armed && ik.canPaste && ik.canPaste()) {
      h += ctxItem('pspaste', 'fa-paste', L('ألصِقْ رسماً منسوخاً', 'Paste drawing'));
      h += '<div class="na-ctx-sep" aria-hidden="true"></div>';
    }
    if (sel) {
      var cut = sel.length > 28 ? sel.slice(0, 28) + '…' : sel;
      h += ctxItem('pcopy', 'fa-copy', L('انسخِ المحدَّد', 'Copy selection'));
      h += ctxItem('pfind', 'fa-magnifying-glass',
        L('ابحثْ عن «' + cut + '»', 'Search for “' + cut + '”'));
      h += '<div class="na-ctx-sep" aria-hidden="true"></div>';
    }
    h += ctxItem('pinv', pdfInverted() ? 'fa-sun' : 'fa-moon',
      pdfInverted() ? L('أعِدْ ألوانَ الملفّ', 'Restore file colours')
                    : L('اقلبْ ألوانَ الملفّ', 'Invert file colours'));
    h += ctxItem('pink', inkHidden() ? 'fa-eye' : 'fa-eye-slash',
      inkHidden() ? L('أظهرِ الرسم', 'Show drawings') : L('أخفِ الرسم', 'Hide drawings'));
    h += ctxItem('ppen', 'fa-pen-nib',
      pdfUi.drawing() ? L('أغلقِ القلم', 'Close the pen') : L('افتحِ القلم', 'Open the pen'));
    h += '<div class="na-ctx-sep" aria-hidden="true"></div>';
    h += ctxItem('pgoto', 'fa-hashtag', L('اذهبْ إلى صفحة…', 'Go to page…'));
    h += ctxItem('pfit', 'fa-expand', L('لائمِ الصفحةَ كاملةً', 'Fit whole page'));
    openMenuAt(x, y, h, pdfMenuAct);
    return true;
  }

  function pdfMenuAct(act) {
    var ik = (pdfUi && pdfUi.ink) ? pdfUi.ink() : null;
    if (act === 'psdup') { if (ik) ik.dupPick(); return; }
    if (act === 'pscopy') { if (ik) ik.copyPick(); return; }
    if (act === 'psrot') { if (ik) ik.rotatePick(15); return; }
    if (act === 'psdel') { if (ik) ik.dropPick(); return; }
    if (act === 'pspaste') { if (ik) ik.pastePick(); return; }
    if (act === 'pcopy') {
      var t = '';
      try { t = String(window.getSelection() || ''); } catch (e) { t = ''; }
      if (t && navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
      return;
    }
    if (act === 'pfind') {
      var q = '';
      try { q = String(window.getSelection() || '').trim(); } catch (e) { q = ''; }
      if (!q) return;
      var fb2 = document.getElementById('na-find-btn');
      if (fb2 && fb2.getAttribute('aria-expanded') !== 'true') fb2.click();
      var qi = document.querySelector('#na-find-bar [data-nf="q"]');
      if (qi) {
        qi.value = q;
        qi.dispatchEvent(new Event('input', { bubbles: true }));
        qi.focus();
      }
      return;
    }
    if (act === 'pinv') { togglePdfInv(); return; }
    if (act === 'pink') { uiSet('inkOff', inkHidden() ? 0 : 1); applyInkHidden(); return; }
    if (act === 'ppen') { pdfDraw(!pdfUi.drawing()); return; }
    if (act === 'pgoto') {
      var cur = document.getElementById('na-pgnav-cur');
      if (cur) cur.click();
      return;
    }
    if (act === 'pfit') { pdfUi.refit('page'); applyFs(); return; }
  }

  /*@3.NOAJ.252*/
  function bindPdfMenu() {
    var box = els.docBody;
    if (!box || box.__pdfctx) return;
    box.__pdfctx = 1;
    box.addEventListener('contextmenu', function (e) {
      if (!pdfOn()) return;
      if (e.target.closest && e.target.closest('.na-ctx, .ndl, dialog[open]')) return;
      e.preventDefault();
      pdfMenu(e.clientX, e.clientY);
    });
    var hold = null, hx = 0, hy = 0;
    box.addEventListener('pointerdown', function (e) {
      if (!pdfOn() || e.pointerType === 'mouse') return;
      if (pdfUi.drawing()) return;
      hx = e.clientX; hy = e.clientY;
      if (hold) clearTimeout(hold);
      hold = setTimeout(function () {
        hold = null;
        pdfMenu(hx, hy);
      }, PDF_LONG);
    }, { passive: true });
    var drop = function (e) {
      if (!hold) return;
      if (e && e.clientX != null &&
          (Math.abs(e.clientX - hx) > 12 || Math.abs(e.clientY - hy) > 12)) {
        clearTimeout(hold); hold = null; return;
      }
      if (e && e.type !== 'pointermove') { clearTimeout(hold); hold = null; }
    };
    box.addEventListener('pointermove', drop, { passive: true });
    box.addEventListener('pointerup', drop, { passive: true });
    box.addEventListener('pointercancel', drop, { passive: true });
    box.addEventListener('scroll', function () {
      if (hold) { clearTimeout(hold); hold = null; }
    }, { passive: true });
  }

  function pdfActions() {
    setDocActions(true);
    /*@3.NOAJ.218*/
    var shb2 = document.getElementById('na-share-btn');
    if (shb2) shb2.disabled = true;
    /*@3.NOAJ.253*/
    var ihb = document.getElementById('na-inkhide');
    if (ihb) ihb.disabled = false;
    bindPdfMenu();
    applyPdfInv();
    applyPdfInkOff();
    var fpb = document.getElementById('na-find-btn');
    if (fpb) fpb.disabled = false;
    if (els.naPdf) els.naPdf.disabled = true;
    if (els.naPage) els.naPage.disabled = true;
    if (window.GardenNotesFind) { try { GardenNotesFind.show(false); } catch (e) {} }
  }

  function openPdf(id, doc) {
    /*@3.NOAJ.206*/
    dropPre(id);
    var pre = pdfPre ? pdfPre.pre : null;
    pdfPre = null;
    dropPdf();
    if (els.app) els.app.setAttribute('data-kind', 'pdf');
    if (els.ribbonHost) els.ribbonHost.hidden = true;
    if (ribbon) { try { ribbon.attach(null); } catch (e) {} }
    pdfActions();
    syncTitleWord();
    if (!window.GardenPdfOpen || !els.docBody) { renderLoadError(id); return; }
    saveState('', '');
    /*@3.NOAJ.219*/
    setPanel(false);
    var pos0 = pdfPos(id);
    pdfUi = GardenPdfOpen.open(els.docBody, doc.pdf || null, {
      scroller: els.docBody,
      pos: pos0,
      pre: pre,
      room: widthRoom,
      mode: pos0 && pos0.m,
      order: pos0 && pos0.r,
      side: (pos0 && pos0.sd) || '',
      flow: pos0 && pos0.fl,
      /*@3.NOAJ.229*/
      stamp: function (n, of) { return isAr() ? (n + ' من ' + of) : (n + ' of ' + of); },
      onAsk: function () {
        var cur = document.getElementById('na-pgnav-cur');
        if (cur) cur.click();
      },
      onFind: function () {
        if (window.GardenNotesFind && GardenNotesFind.tell) GardenNotesFind.tell();
      },
      /*@3.NOAJ.235*/
      onInk: function () { if (pdfDial) { try { pdfDial.sync(); } catch (e) {} } },
      onExpand: function () { toggleFull(); },
      onPage: function () { updatePgNav(); },
      onZoom: function () { applyFs(); },
      onView: function () { applyFs(); },
      onReady: function () {
        if (edId !== id) return;
        applyFs();
        applyPdfInv();
        applyPdfInkOff();
      },
      onPos: function (p) { if (edId === id) pdfPos(id, p); },
      onRelink: function (next, was) {
        if (edId !== id) return;
        if (was && was !== next.h) {
          doc.was = (doc.was || []).filter(function (h) { return h !== was; }).concat([was]);
        }
        doc.pdf = next;
        persist(id, doc, true);
      }
    });
  }

  function createPdf() {
    var O = window.GardenPdfOpen;
    if (!O) return;
    O.pickFile().then(function (file) {
      if (!file) return;
      adoptPdf(file);
    });
  }

  function adoptPdf(file) {
    var O = window.GardenPdfOpen;
    if (!O || !file) return;
    (function (file) {
      setMob('doc');
      setReading(true);
      renderOpening('pdf');
      saveState('saving', L('يُقرأ الملفّ…', 'Reading the file…'));
      /*@3.NOAJ.208*/
      O.adopt(file, function (at, of) {
        if (!of) return;
        var pc = Math.round(at * 100 / of);
        saveState('saving', L('يُقرأ الملفّ… ', 'Reading the file… ') + pc + '%');
      }).then(function (res) {
        /*@3.NOAJ.214*/
        /*@3.NOAJ.227*/
        if (!res.stored && window.GardenPdfDoc) {
          GardenPdfDoc.available().then(function (av) {
            if (av.ok) return;
            saveState('error', av.why === 'insecure'
              ? L('لن يُحفَظ الملفُّ على هذا الجهاز — الصفحةُ مفتوحةٌ باتّصالٍ غيرِ آمن.',
                  'The file will not be kept here — the page is on an insecure connection.')
              : L('تعذّر حفظُ الملفِّ على هذا الجهاز — سيُطلَب منك اختيارُه في كلِّ مرّة.',
                  'Could not keep the file on this device — you will be asked for it each time.'));
          });
        }
        var now = Date.now();
        var id = newId('rp');
        var base = String(file.name || '').replace(/\.pdf$/i, '').trim();
        var rec = { id: id, t: base || L('ملفُّ PDF', 'PDF file'), k: 'pdf', o: {}, g: [],
                    c: null, f: null, p: 0, a: 0, ca: now, updated_at: now, sz: 0 };
        if (S.view.k === 'folder') rec.f = S.view.id;
        if (S.view.k === 'course') rec.o.c = S.view.code;
        if (S.view.k === 'tag') rec.g = [S.view.tag];
        idxPut(rec);
        var doc = { v: 1, kind: 'pdf', pdf: res.spec, blocks: [] };
        var St = window.GardenNotesStore;
        var go = function () {
          pdfPre = { id: id, pre: res.pre };
          reload({ keepOpen: true });
          openNote(id);
        };
        if (St) St.putDoc(id, doc, now).then(go, go); else go();
      }, function (e) {
        O.drop(null);
        if (e && e.cancelled) { saveState('', ''); docEmpty(); setReading(false); setMob('list'); return; }
        var many = e && e.pages;
        var heavy = e && e.bytes;
        saveState('error', many
          ? L('هذا الملفُّ ' + many + ' صفحةً، والحدُّ المدعوم ' + O.MAX_PAGES + '.',
              'This file has ' + many + ' pages; the supported limit is ' + O.MAX_PAGES + '.')
          : (heavy
            ? L('هذا الملفُّ ' + O.size(heavy) + '، والحدُّ المدعوم ' + O.size(O.HARD_BYTES) + '.',
                'This file is ' + O.size(heavy) + '; the supported limit is ' + O.size(O.HARD_BYTES) + '.')
            : L('تعذّر قراءةُ هذا الملفّ.', 'Could not read this file.')));
        docEmpty();
        setReading(false);
        setMob('list');
      });
    }(file));
  }

  /*@3.NOAJ.237*/
  function intake(file) {
    if (!file) return false;
    var name = String(file.name || '').toLowerCase();
    var type = String(file.type || '').toLowerCase();
    if (type === 'application/pdf' || /\.pdf$/.test(name)) { adoptPdf(file); return true; }
    if (type === 'application/json' || /\.json$/.test(name)) { runImport(file); return true; }
    if (/\.(md|markdown|mdown|txt|text)$/.test(name) || type.indexOf('text/') === 0) {
      takeText(file);
      return true;
    }
    saveState('error', L('هذا النوعُ غيرُ مدعوم — الملفّاتُ المقبولة: PDF وMarkdown وJSON.',
                         'Unsupported file — accepted types are PDF, Markdown and JSON.'));
    setTimeout(function () { saveState('', ''); }, 2600);
    return false;
  }

  /*@3.NOAJ.238*/
  function takeText(file) {
    var Md = window.GardenNotesMd;
    var St = window.GardenNotesStore;
    if (!Md || !Md.parse) return;
    if (file.size > 8 * 1024 * 1024) {
      saveState('error', L('الملفُّ أكبر من ٨ ميجابايت.', 'The file is larger than 8 MB.'));
      return;
    }
    saveState('saving', L('يُقرأ الملفّ…', 'Reading the file…'));
    var fr = new FileReader();
    fr.onerror = function () {
      saveState('error', L('تعذّرت قراءةُ الملفّ.', 'The file could not be read.'));
    };
    fr.onload = function () {
      var doc = null;
      try {
        var blocks = Md.parse(String(fr.result || ''));
        if (blocks && blocks.length) doc = { v: 1, blocks: blocks };
        var B2 = window.GardenNotesBlocks;
        if (doc && B2 && B2.normalize) doc = B2.normalize(doc);
      } catch (e) { doc = null; }
      if (!doc || !doc.blocks || !doc.blocks.length) {
        saveState('error', L('لا محتوى في هذا الملفّ.', 'This file has no content.'));
        return;
      }
      var now = Date.now();
      var id = newId('rn');
      var base = String(file.name || '').replace(/\.[a-z]+$/i, '').trim();
      var rec = { id: id, t: (base || deriveTitle(doc) || L('ملاحظة مستورَدة', 'Imported note')).slice(0, 80),
                  k: 'rich', o: {}, g: [], c: null,
                  f: (S.view.k === 'folder') ? S.view.id : null,
                  p: 0, a: 0, ca: now, updated_at: now, sz: 0 };
      if (S.view.k === 'course') rec.o.c = S.view.code;
      if (S.view.k === 'tag') rec.g = [S.view.tag];
      idxPut(rec);
      var go = function () {
        saveState('', '');
        reload({ keepOpen: true });
        openNote(id);
      };
      if (St) St.putDoc(id, doc, now).then(go, go); else go();
    };
    fr.readAsText(file);
  }

  /*@3.NOAJ.239*/
  var NEW_ITEMS = [
    { k: 'note',  icon: 'fa-file-lines', ar: 'ملاحظةٌ جديدة', en: 'New note' },
    { k: 'board', icon: 'fa-pen-to-square', ar: 'لوحُ رسم', en: 'Whiteboard' },
    { k: 'pdf',   icon: 'fa-file-import', ar: 'افتحْ ملفَّ PDF', en: 'Open a PDF' },
    { k: 'md',    icon: 'fa-file-code', ar: 'استوردْ ماركداون', en: 'Import Markdown' },
    { k: 'json',  icon: 'fa-file-arrow-down', ar: 'استوردْ JSON', en: 'Import JSON' }
  ];

  var newPop = null;

  function newMenu(anchor) {
    if (newPop) { shutNew(true); return; }
    var p = document.createElement('div');
    p.className = 'na-newpop';
    p.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    p.setAttribute('role', 'menu');
    p.innerHTML = NEW_ITEMS.map(function (it) {
      return '<button type="button" class="na-newpop-i" role="menuitem" data-new="' + it.k + '">' +
        '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i><span>' +
        esc(L(it.ar, it.en)) + '</span></button>';
    }).join('');
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect();
    var pad = 8;
    /*@3.NOAJ.243*/
    p.style.left = '0px';
    p.style.insetBlockStart = pad + 'px';
    var pr = p.getBoundingClientRect();
    var de = document.documentElement;
    var vw = window.innerWidth || de.clientWidth || 320;
    var vh = window.innerHeight || de.clientHeight || 480;
    var gap = 6;
    var below = vh - r.bottom - gap - pad, above = r.top - gap - pad;
    var top;
    if (pr.height <= below) top = r.bottom + gap;
    else if (pr.height <= above) top = r.top - pr.height - gap;
    else { top = r.bottom + gap; p.style.maxBlockSize = Math.max(below, 160) + 'px'; }
    p.style.insetBlockStart = Math.round(Math.max(pad, top)) + 'px';
    var left = isAr() ? (r.right - pr.width) : r.left;
    p.style.left = Math.round(Math.max(pad, Math.min(left, vw - pr.width - pad))) + 'px';
    newPop = p;
    anchor.setAttribute('aria-expanded', 'true');
    p.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-new]') : null;
      if (!b) return;
      var k = b.getAttribute('data-new');
      shutNew(true);
      if (k === 'note') createNote();
      else if (k === 'board') createNote('board');
      else if (k === 'pdf') createPdf();
      else askFile(k);
    });
    /*@3.NOAJ.244*/
    setTimeout(function () {
      if (newPop !== p) return;
      document.addEventListener('pointerdown', outsideNew, true);
      document.addEventListener('keydown', keyNew, true);
    }, 0);
  }

  /*@3.NOAJ.240*/
  function outsideNew(e) {
    if (!newPop) return;
    if (newPop.contains(e.target)) return;
    shutNew(true);
    createNote();
  }

  function keyNew(e) {
    if (e.key !== 'Escape' || !newPop) return;
    e.preventDefault();
    shutNew(true);
  }

  function shutNew(quiet) {
    document.removeEventListener('pointerdown', outsideNew, true);
    document.removeEventListener('keydown', keyNew, true);
    if (newPop) { newPop.remove(); newPop = null; }
    var b = document.getElementById('na-new');
    if (b) b.setAttribute('aria-expanded', 'false');
    void quiet;
  }

  /*@3.NOAJ.241*/
  function askFile(kind) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = kind === 'json' ? 'application/json,.json' : '.md,.markdown,.txt,text/markdown';
    inp.className = 'npo-file';
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      if (f) intake(f);
    });
    inp.click();
  }

  /*@3.NOAJ.242*/
  function bindDrop() {
    var root = els.app || document.getElementById('na');
    if (!root || root.__drop) return;
    root.__drop = 1;
    var depth = 0;
    var has = function (e) {
      var d = e.dataTransfer;
      if (!d || !d.types) return false;
      for (var i = 0; i < d.types.length; i++) if (d.types[i] === 'Files') return true;
      return false;
    };
    root.addEventListener('dragenter', function (e) {
      if (!has(e) || isPhone()) return;
      e.preventDefault();
      depth++;
      root.setAttribute('data-drop', '1');
    });
    root.addEventListener('dragover', function (e) {
      if (!has(e) || isPhone()) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    root.addEventListener('dragleave', function (e) {
      if (!has(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) root.removeAttribute('data-drop');
    });
    root.addEventListener('drop', function (e) {
      if (!has(e) || isPhone()) return;
      e.preventDefault();
      depth = 0;
      root.removeAttribute('data-drop');
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) intake(f);
    });
  }

  function createNote(kind) {
    /*@3.NOAJ.70*/
    var board = kind === 'board';
    var id = newId(board ? 'rb' : 'rn');
    var now = Date.now();
    var origin = {};
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('from')) origin.p = q.get('from');
      if (q.get('title')) origin.t = q.get('title');
      if (q.get('course')) origin.c = q.get('course');
      if (q.get('module')) origin.m = Number(q.get('module'));
    } catch (e) {}

    var rec = { id: id, t: '', k: board ? 'board' : 'rich', o: origin, g: [], c: null, f: null,
                p: 0, a: 0, ca: now, updated_at: now, sz: 0, pv: 1 };
    if (S.view.k === 'folder') rec.f = S.view.id;
    if (S.view.k === 'course' && !rec.o.c) rec.o.c = S.view.code;
    if (S.view.k === 'tag') rec.g = [S.view.tag];
    idxPut(rec);

    var St = window.GardenNotesStore;
    var doc = { v: 1, blocks: board ? [] : [window.GardenNotesBlocks.blank('p')] };
    if (board) doc.kind = 'board';
    var go = function () { reload({ keepOpen: true }); openNote(id, { focus: !board }); };
    if (St) St.putDoc(id, doc, now).then(go, go); else go();
  }

  /*@3.NOAJ.148*/
  function normTitle(t) {
    return String(t == null ? '' : t).trim().toLowerCase()
      .replace(/[\u064b-\u0652\u0640]/g, '').replace(/\s+/g, ' ');
  }

  function resolveNoteLink(target) {
    var t = String(target || '').replace(/^note:/i, '');
    if (!t) return;
    if (t.charAt(0) !== '?') {
      if (idxFind(t)) { openNote(t); return; }
      saveState('error', L('الملاحظةُ المرتبطةُ لم تعد موجودة.', 'The linked note no longer exists.'));
      return;
    }
    var want = '';
    try { want = new URLSearchParams(t.slice(1)).get('t') || ''; } catch (e) { return; }
    if (!want) return;
    var all = idxRead(), i;
    for (i = 0; i < all.length; i++) if ((all[i].t || '') === want) { openNote(all[i].id); return; }
    var soft = normTitle(want);
    for (i = 0; i < all.length; i++) if (normTitle(all[i].t) === soft) { openNote(all[i].id); return; }
    askMakeNote(want);
  }

  function askMakeNote(title) {
    var dlg = document.getElementById('na-confirm');
    if (!dlg) { createNamed(title); return; }
    pendDelete = null; pendMany = null; pendFolder = null;
    pendMake = String(title).slice(0, 80);
    confirmTitle('لا توجد ملاحظةٌ بهذا العنوان', 'No note with that title');
    confirmSub('أتُنشئها الآن بهذا العنوان؟ ويبقى الرابطُ عاملاً بعدها.',
               'Create it now with that title? The link will work from then on.');
    confirmOkLabel('أنشئها', 'Create it');
    var w = dlg.querySelector('[data-role="what"]');
    if (w) w.textContent = pendMake;
    try { dlg.showModal(); } catch (e) {}
  }

  function createNamed(title) {
    var B0 = window.GardenNotesBlocks;
    var id = newId('rn');
    var now = Date.now();
    var rec = { id: id, t: String(title).slice(0, 80), k: 'rich', o: {}, g: [], c: null,
                f: (S.view.k === 'folder') ? S.view.id : null,
                p: 0, a: 0, ca: now, updated_at: now, sz: 0 };
    idxPut(rec);
    var doc = { v: 1, blocks: [B0.blank('h', { lv: 1, rt: [{ s: rec.t }] }), B0.blank('p')] };
    var St = window.GardenNotesStore;
    var go = function () { reload({ keepOpen: true }); openNote(id, { focus: true }); };
    if (St) St.putDoc(id, doc, now).then(go, go); else go();
  }

  /*@3.NOAJ.149*/
  function setRemind(id, iso) {
    var rec = idxFind(id);
    if (!rec) return false;
    if (iso) rec.r = iso; else { delete rec.r; delete rec.rd; }
    rec.updated_at = Date.now();
    idxPut(rec);
    syncRemindTask(rec);
    var Sy = window.GardenNotesSync;
    if (Sy && Sy.schedule) Sy.schedule(id);
    reload({ keepOpen: true });
    return true;
  }

  /*@3.NOAJ.150*/
  function syncRemindTask(rec) {
    var G = window.GardenData;
    if (!G || !G.linkRichNote) return;
    var title = (rec.t || '').trim();
    if (!title && ed && edId === rec.id) title = deriveTitle(ed.doc) || '';
    try {
      G.linkRichNote({ id: rec.id, title: title || L('ملاحظة', 'Note'),
                       remind_at: rec.r || '', course: (rec.o && rec.o.c) || null,
                       created_at: rec.ca || Date.now() });
    } catch (e) {}
  }

  /*@3.NOAJ.113*/
  function adoptQuick(qid) {
    var arr = [];
    try {
      var raw = JSON.parse(localStorage.getItem('quick_notes') || '[]');
      if (Array.isArray(raw)) arr = raw;
    } catch (e) {}
    var src = null;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && String(arr[i].id) === String(qid)) { src = arr[i]; break; }
    }
    if (!src) { createNote(); return; }

    var B = window.GardenNotesBlocks;
    var txt = String(src.body || '');
    var blocks = null;
    try { blocks = B.fromMarkdown(txt); } catch (e2) { blocks = null; }
    if (!blocks || !blocks.length) blocks = [B.blank('p', { rt: txt ? [{ s: txt }] : [] })];

    var id = newId('rn'), now = Date.now();
    var o = src.origin || {};
    var rec = { id: id, t: '', k: 'rich',
                o: { p: o.page || '', t: o.title || '', c: src.course || '', m: (src.module != null ? Number(src.module) : undefined) },
                g: Array.isArray(src.tags) ? src.tags.slice() : [],
                c: src.color || null, f: null, p: 0, a: 0,
                ca: src.created_at || now, updated_at: now, sz: 0 };
    if (rec.o.m === undefined) delete rec.o.m;
    if (!rec.o.c) delete rec.o.c;
    if (!rec.o.p) delete rec.o.p;
    if (!rec.o.t) delete rec.o.t;
    idxPut(rec);

    var St = window.GardenNotesStore;
    var doc = { v: 1, blocks: blocks };
    var go = function () {
      var rest = arr.filter(function (n) { return !n || String(n.id) !== String(qid); });
      try { localStorage.setItem('quick_notes', JSON.stringify(rest)); } catch (e3) {}
      reload({ keepOpen: true });
      openNote(id, { focus: true });
    };
    if (St) St.putDoc(id, doc, now).then(go, go); else go();
  }

  /*@3.NOAJ.68*/
  var NOTE_T_AR = 'حذف الملاحظة؟';
  var NOTE_T_EN = 'Delete this note?';
  var NOTE_SUB_AR = 'سيُحذف نصُّها ورسمُها من كلّ أجهزتك، ولا يمكن التراجع.';
  var NOTE_SUB_EN = 'Its text and drawings are removed from all your devices. This cannot be undone.';
  var NOTE_OK_AR = 'احذفها';
  var NOTE_OK_EN = 'Delete';
  var FOLD_T_AR = 'حذف المجلّد؟';
  var FOLD_T_EN = 'Delete this folder?';
  var FOLD_SUB_AR = 'الملاحظاتُ لا تُحذَف — تخرج من المجلّد وتبقى في «ملاحظات عامّة».';
  var FOLD_SUB_EN = 'The notes are not deleted — they leave the folder and stay in “General”.';
  var FOLD_KIDS_AR = ' والمجلّداتُ التي بداخله تصعد معها.';
  var FOLD_KIDS_EN = ' Any folders inside it move up too.';
  var FOLD_OK_AR = 'احذفِ المجلّد';
  var FOLD_OK_EN = 'Delete folder';

  var pendDelete = null;
  var pendMany = null;
  var pendFolder = null;
  var pendMake = null;

  function confirmDelete(id, title) {
    var dlg = document.getElementById('na-confirm');
    if (!dlg) return;
    resetConfirm();
    pendDelete = id;
    pendFolder = null;
    var t = dlg.querySelector('[data-role="what"]');
    if (t) t.textContent = title || L('هذه الملاحظة', 'this note');
    try { dlg.showModal(); } catch (e) {}
  }

  function doDelete(id) {
    var Sy = window.GardenNotesSync;
    idxDrop(id);
    if (Sy) Sy.remove(id);
    else if (window.GardenNotesStore) window.GardenNotesStore.delDoc(id);
    dropEditor(); edId = null;
    docEmpty();
    history.replaceState(null, '', location.pathname);
    setReading(false);
    showPanel('list');
    reload();
  }

  function syncPinBtn(rec) {
    if (!els.naPin) return;
    var on = !!(rec && rec.p);
    els.naPin.setAttribute('aria-pressed', on ? 'true' : 'false');
    els.naPin.setAttribute('aria-label', on ? L('إلغاء التثبيت', 'Unpin') : L('تثبيت', 'Pin'));
  }

  function togglePin() {
    if (!edId) return;
    var rec = idxFind(edId);
    if (!rec) return;
    rec.p = rec.p ? 0 : 1;
    rec.updated_at = Date.now();
    idxPut(rec);
    syncPinBtn(rec);
    reload({ keepOpen: true });
  }


  var fEdit = null;

  function parentOptions(dlg, selfId, selected) {
    var sel = dlg.querySelector('[data-role="parent"]');
    if (!sel) return;
    var T = folderTree();
    var h = '<option value="" data-gs-name-ar="الجذر" data-gs-name-en="Top level">' +
            esc(L('الجذر', 'Top level')) + '</option>';
    function walk(parent, depth) {
      var list = T.kids[parent] || [];
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        if (selfId && isDescendant(f.id, selfId)) continue;
        if (depth + 1 >= MAX_DEPTH) continue;
        var lab = new Array(depth + 1).join('— ') + (f.n || L('مجلّد', 'Folder'));
        h += '<option value="' + esc(f.id) + '"' + (f.id === selected ? ' selected' : '') +
             ' data-gs-name-ar="' + esc(lab) + '" data-gs-name-en="' + esc(lab) + '">' +
             esc(lab) + '</option>';
        walk(f.id, depth + 1);
      }
    }
    walk('', 0);
    sel.innerHTML = h;
    sel.value = selected || '';
    if (window.GardenSelect && GardenSelect.enhance) {
      try { GardenSelect.enhance(dlg); } catch (e) {}
    }
  }

  function folderDlg(mode, id, parent) {
    var dlg = document.getElementById('na-folder');
    if (!dlg) return;
    fEdit = (mode === 'edit') ? id : null;
    var f = fEdit ? folderTree().byId[fEdit] : null;
    if (mode === 'edit' && !f) return;

    var input = dlg.querySelector('[data-role="name"]');
    var ok = dlg.querySelector('[data-role="ok"]');
    var del = dlg.querySelector('[data-role="del"]');
    var hint = dlg.querySelector('[data-role="delhint"]');
    var title = dlg.querySelector('#na-folder-t');

    if (input) input.value = f ? (f.n || '') : '';
    if (title) {
      title.textContent = f ? L('تعديل المجلّد', 'Edit folder') : L('مجلّد جديد', 'New folder');
      title.setAttribute('data-ar', f ? 'تعديل المجلّد' : 'مجلّد جديد');
      title.setAttribute('data-en', f ? 'Edit folder' : 'New folder');
    }
    if (ok) {
      ok.textContent = f ? L('احفظ', 'Save') : L('أنشئ', 'Create');
      ok.setAttribute('data-ar', f ? 'احفظ' : 'أنشئ');
      ok.setAttribute('data-en', f ? 'Save' : 'Create');
    }
    if (del) {
      del.hidden = !f;
      del.textContent = L('حذف المجلّد', 'Delete folder');
      del.removeAttribute('data-armed');
    }
    if (hint) hint.hidden = !f;

    parentOptions(dlg, fEdit, f ? (f.p || '') : (parent || ''));
    try { dlg.showModal(); } catch (e) {}
    setTimeout(function () { if (input) input.focus(); }, 40);
  }

  function newFolder(parent) { folderDlg('new', null, parent); }
  function editFolder(id) { folderDlg('edit', id); }

  function commitFolder() {
    var dlg = document.getElementById('na-folder');
    if (!dlg) return;
    var input = dlg.querySelector('[data-role="name"]');
    var sel = dlg.querySelector('[data-role="parent"]');
    var n = ((input && input.value) || '').trim();
    if (!n) { if (input) input.focus(); return; }
    var par = (sel && sel.value) || '';

    if (fEdit) {
      var f = folderTree().byId[fEdit];
      if (!f) { try { dlg.close(); } catch (e0) {} return; }
      f.n = n;
      f.updated_at = Date.now();
      folderPut(f);
      if ((f.p || '') !== par) folderReparent(fEdit, par);
      fEdit = null;
      try { dlg.close(); } catch (e1) {}
      reload({ keepOpen: true });
      return;
    }

    var id = newId('nf');
    if (par && folderDepth(par) + 1 >= MAX_DEPTH) par = '';
    folderPut({ id: id, n: n, p: par, ord: foldersRead().length, updated_at: Date.now() });
    try { dlg.close(); } catch (e2) {}
    /*@3.NOAJ.42*/
    if (S.afterFolder) {
      var nid = S.afterFolder;
      S.afterFolder = null;
      var rec = idxFind(nid);
      if (rec) {
        rec.f = id;
        rec.updated_at = Date.now();
        idxPut(rec);
        reload({ keepOpen: true });
        return;
      }
    }
    S.view = { k: 'folder', id: id };
    uiSet('view', S.view);
    reload();
  }

  /*@3.NOAJ.11*/
  function deleteFolderStep(btn) {
    if (!fEdit || !btn) return;
    if (btn.getAttribute('data-armed') !== '1') {
      btn.setAttribute('data-armed', '1');
      btn.textContent = L('اضغط للتأكيد', 'Press to confirm');
      return;
    }
    var gone = fEdit;
    fEdit = null;
    folderDrop(gone);
    var dlg = document.getElementById('na-folder');
    try { dlg.close(); } catch (e) {}
    if (S.view.k === 'folder' && S.view.id === gone) {
      S.view = { k: 'recent' };
      uiSet('view', S.view);
    }
    reload({ keepOpen: true });
  }

  function moveNote() {
    if (!edId) return;
    var rec = idxFind(edId);
    if (!rec) return;
    var dlg = document.getElementById('na-move');
    if (!dlg) return;
    var box = dlg.querySelector('[data-role="list"]');
    function row(id, icon, label, on) {
      return '<button type="button" class="gsf-row" data-f="' + esc(id) + '"' +
        (on ? ' aria-current="true"' : '') + '>' +
        '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
        '<span>' + esc(label) + '</span>' +
        (on ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '') + '</button>';
    }
    var T = folderTree();
    var h = row('', 'fa-inbox', L('بلا مجلّد', 'No folder'), !rec.f);
    (function walk(parent) {
      var list = T.kids[parent] || [];
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        h += row(f.id, 'fa-folder', folderPath(f.id).join(' / '), rec.f === f.id);
        walk(f.id);
      }
    })('');
    /*@3.NOAJ.40*/
    h += '<button type="button" class="gsf-row na-move-new" data-newf="1">' +
      '<i class="fa-solid fa-folder-plus" aria-hidden="true"></i>' +
      '<span data-ar="مجلّدٌ جديد…" data-en="New folder…">' +
      esc(L('مجلّدٌ جديد…', 'New folder…')) + '</span></button>';
    box.innerHTML = h;
    i18n(box);
    try { dlg.showModal(); } catch (e) {}
  }

  function onMovePick(e) {
    /*@3.NOAJ.56*/
    var many = e.target.closest('[data-fmany]');
    if (many) {
      var to = many.getAttribute('data-fmany') || null;
      (S.moveMany || []).forEach(function (id) {
        var r2 = idxFind(id);
        if (!r2) return;
        r2.f = to;
        r2.updated_at = Date.now();
        idxPut(r2);
      });
      S.moveMany = null;
      clearPicked();
      var d2 = document.getElementById('na-move');
      if (d2) { try { d2.close(); } catch (e4) {} }
      reload({ keepOpen: true });
      return;
    }
    /*@3.NOAJ.41*/
    if (e.target.closest('[data-newf]')) {
      var mv = document.getElementById('na-move');
      if (mv) { try { mv.close(); } catch (e3) {} }
      S.afterFolder = edId;
      newFolder('');
      return;
    }
    var b = e.target.closest('[data-f]');
    if (!b || !edId) return;
    var rec = idxFind(edId);
    if (!rec) return;
    rec.f = b.getAttribute('data-f') || null;
    rec.updated_at = Date.now();
    idxPut(rec);
    var dlg = document.getElementById('na-move');
    if (dlg) { try { dlg.close(); } catch (e2) {} }
    reload({ keepOpen: true });
  }


  /*@3.NOAJ.2*/
  /*@3.NOAJ.43*/
  function panelPinned() { return ui().pin === 1; }

  function setPinned(on) {
    uiSet('pin', on ? 1 : 0);
    var b = document.getElementById('na-pin-panel');
    if (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on
        ? L('القائمةُ مثبَّتة — اضغطْ لتُصفَط تلقائيّاً', 'Panel pinned — click to auto-collapse')
        : L('ثبِّتِ القائمةَ فلا تُصفَط', 'Pin the panel so it stays open'));
    }
  }

  /*@3.NOAJ.44*/
  function autoCollapse() {
    if (panelPinned() || !S.panel) return false;
    setPanel(false);
    return true;
  }

  function setPanel(on) {
    S.panel = !!on;
    if (els.app) els.app.setAttribute('data-panel', on ? '1' : '0');
    syncIcons();
  }

  function isPhone() {
    try { return window.matchMedia('(max-width: 768px)').matches; }
    catch (e) { return false; }
  }

  /*@3.NOAJ.99*/
  function setMob(m) {
    if (!els.app) return;
    els.app.setAttribute('data-mob', m);
    if (!isPhone()) return;
    if (m === 'doc') {
      setPanel(false);
      document.documentElement.classList.add('na-full');
    } else {
      document.documentElement.classList.remove('na-full');
    }
  }

  function setAcc(which) {
    S.acc = which;
    var f = document.getElementById('na-acc-folders');
    var l = document.getElementById('na-acc-list');
    if (f) { f.setAttribute('data-open', which === 'folders' ? '1' : '0');
             f.querySelector('.na-acc-h').setAttribute('aria-expanded', which === 'folders'); }
    if (l) { l.setAttribute('data-open', which === 'list' ? '1' : '0');
             l.querySelector('.na-acc-h').setAttribute('aria-expanded', which === 'list'); }
    uiSet('acc', which);
    syncIcons();
  }

  /*@3.NOAJ.3*/
  /*@3.NOAJ.29*/
  function panelIsDrawer() {
    try { return window.matchMedia('(max-width: 900px)').matches; }
    catch (e) { return window.innerWidth <= 900; }
  }

  function setReading(on) {
    S.reading = !!on;
    if (els.app) els.app.setAttribute('data-reading', on ? '1' : '0');
    if (on && panelIsDrawer()) setPanel(false);
  }

  /*@3.NOAJ.23*/
  function fsOn() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function paintFull() {
    var on = fsOn();
    document.documentElement.classList.toggle('na-full', on);
    var b = document.getElementById('na-full');
    if (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var i = b.querySelector('i');
      if (i) i.className = 'fa-solid ' + (on ? 'fa-compress' : 'fa-expand');
      var lab = on ? ['إنهاء ملء الشاشة', 'Exit full screen']
                   : ['ملء الشاشة (Esc للخروج)', 'Full screen (Esc to exit)'];
      b.setAttribute('aria-label', L(lab[0], lab[1]));
      b.setAttribute('data-ar-title', lab[0]);
      b.setAttribute('data-en-title', lab[1]);
      b.setAttribute('title', L(lab[0], lab[1]));
    }
    applyWidth();
  }

  function toggleFull() {
    var el = document.documentElement;
    if (fsOn()) {
      var x = document.exitFullscreen || document.webkitExitFullscreen;
      if (x) { try { x.call(document); } catch (e) {} }
      return;
    }
    var r = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!r) {
      document.documentElement.classList.toggle('na-full');
      var b = document.getElementById('na-full');
      if (b) b.setAttribute('aria-pressed',
        document.documentElement.classList.contains('na-full') ? 'true' : 'false');
      applyWidth();
      return;
    }
    try { r.call(el); } catch (e2) {}
  }

  var WIDTHS = ['a4', 'land', 'full'];
  /*@3.NOAJ.181*/
  var PAGE_MAX = 900;

  var VIEW_FS = { a4: 'auto', land: 'wide', full: 'fit' };

  var FS_STEPS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2, 2.5];

  function pageWpx() {
    return pxVar('--na-a4', 794);
  }

  function fitZoom() {
    var room = widthRoom(), pw = pageWpx();
    if (!isFinite(room) || room <= 40 || !(pw > 40)) return 1;
    return Math.max(0.2, Math.min(4, room / pw));
  }

  function fsMode() {
    var v = ui().fs;
    if (v === 'fit' || v === 'auto' || v === 'wide') return v;
    var n = parseFloat(v);
    /*@3.NOAJ.130*/
    if (FS_STEPS.indexOf(n) >= 0) return n;
    if (isFinite(n) && n >= PINCH_MIN && n <= PINCH_MAX) return n;
    return 'auto';
  }

  function isBoardOpen() {
    var pg = document.getElementById('na-page');
    return !!(pg && pg.getAttribute('data-kind') === 'board');
  }

  function fsNow() {
    var m = fsMode();
    /*@3.NOAJ.210*/
    if (pdfOn()) return pdfUi.scale() || 1;
    /*@3.NOAJ.102*/
    if (isBoardOpen() && (m === 'auto' || m === 'fit' || m === 'wide')) return 1;
    if (m === 'fit') return fitZoom();
    if (m === 'wide') return pxVar('--na-a4h', 1123) / pxVar('--na-a4', 794);
    if (m === 'auto') {
      var f = Math.min(1, fitZoom());
      /*@3.NOAJ.100*/
      if (f < 0.85 && isPhone()) f = 0.85;
      return f;
    }
    return m;
  }

  /*@3.NOAJ.58*/
  function zoomStage() { return document.getElementById('na-zoom'); }

  /*@3.NOAJ.131*/
  function tfEl() { return document.getElementById('na-tf'); }

  function stageZoom() {
    var pg = document.getElementById('na-page');
    if (!pg || !pg.offsetWidth) return 1;
    var z = pg.getBoundingClientRect().width / pg.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  }

  /*@3.NOAJ.132*/
  function sizeStage() {
    var stg = zoomStage(), tf = tfEl();
    var page = document.getElementById('na-page');
    if (!stg || !tf || !page) return;
    var z = parseFloat(stg.style.getPropertyValue('--na-z')) || 1;
    if (page.getAttribute('data-kind') === 'board') {
      var bw = Math.max(200, Math.round(widthRoom()));
      var ww = Math.max(120, Math.round(bw / z));
      if (tf.__bw !== ww) { tf.__bw = ww; tf.style.inlineSize = ww + 'px'; }
    } else if (tf.__bw != null) {
      tf.__bw = null;
      tf.style.inlineSize = '';
    }
    var w = Math.round(page.offsetWidth * z);
    var h = Math.round(page.offsetHeight * z);
    if (stg.__w !== w) { stg.__w = w; stg.style.inlineSize = w + 'px'; }
    if (stg.__h !== h) { stg.__h = h; stg.style.blockSize = h + 'px'; }
  }

  var ZOOM_LABEL = {
    auto: ['تلقائيّ', 'Automatic'],
    wide: ['عرضُ الأفقيّة', 'Landscape width'],
    fit:  ['ملء العرض', 'Fit width']
  };

  function paintZoom(v, m) {
    var lbl = document.getElementById('na-zoom-lbl');
    if (lbl) {
      lbl.textContent = Math.round(v * 100) + '%';
      var zt = (m === 'fit' || m === 'auto')
        ? L(ZOOM_LABEL[m][0], ZOOM_LABEL[m][1])
        : L('تكبيرٌ ثابت', 'Fixed zoom');
      lbl.setAttribute('title', zt);
      lbl.setAttribute('aria-label', zt);
      lbl.setAttribute('data-zm', String(m));
    }
    var oi = document.getElementById('na-zoom-in');
    var oo = document.getElementById('na-zoom-out');
    if (oi) oi.disabled = v >= FS_STEPS[FS_STEPS.length - 1] - 0.001;
    if (oo) oo.disabled = v <= FS_STEPS[0] + 0.001;
  }

  function applyFs() {
    var v = fsNow(), m = fsMode();
    if (pdfOn()) {
      paintZoom(pdfUi.scale(), pdfUi.isFit() ? 'fit' : pdfUi.scale());
      paintWidthBtn();
      paintPdfBtns();
      updatePgNav();
      return;
    }
    var stg = zoomStage();
    if (stg) stg.style.setProperty('--na-z', String(Math.round(v * 10000) / 10000));
    var page = document.getElementById('na-page');
    if (page) page.style.setProperty('--na-fs', '1');
    paintZoom(v, m);
    /*@3.NOAJ.34*/
    alignRules();
    growPages();
    sizeStage();
    if (overlay && overlay.fit) { try { overlay.fit(); } catch (e) {} }
  }

  function stepFs(dir, at) {
    var cur = fsNow(), i = 0, k;
    if (pdfOn()) {
      for (k = 0; k < FS_STEPS.length; k++) if (FS_STEPS[k] <= cur + 0.001) i = k;
      if (dir > 0 && FS_STEPS[i] < cur - 0.001) i = Math.min(FS_STEPS.length - 1, i + 1);
      var j2 = Math.max(0, Math.min(FS_STEPS.length - 1, i + dir));
      /*@3.NOAJ.232*/
      pdfUi.setScale(FS_STEPS[j2], at || null);
      applyFs();
      return FS_STEPS[j2];
    }
    for (k = 0; k < FS_STEPS.length; k++) if (FS_STEPS[k] <= cur + 0.001) i = k;
    if (dir > 0 && FS_STEPS[i] < cur - 0.001) i = Math.min(FS_STEPS.length - 1, i + 1);
    var j = Math.max(0, Math.min(FS_STEPS.length - 1, i + dir));
    uiSet('fs', FS_STEPS[j]);
    applyFs();
    return FS_STEPS[j];
  }

  /*@3.NOAJ.123*/
  /*@3.NOAJ.129*/
  var PINCH_MIN = 0.35, PINCH_MAX = 3;
  var pz = null;
  var pzQ = 0, pzEndT = 0;

  function pinchBegin(cx, cy) {
    var body = els.docBody, stg = zoomStage(), tf = tfEl();
    if (!body || !stg || !tf) return;
    if (pz) pinchEnd();
    var z0 = parseFloat(stg.style.getPropertyValue('--na-z')) || fsNow();
    var r0 = tf.getBoundingClientRect();
    var br = body.getBoundingClientRect();
    pz = {
      body: body, stg: stg, tf: tf, z0: z0, s: 1,
      u0x: cx - r0.left, u0y: cy - r0.top,
      k0x: r0.left - br.left + body.scrollLeft,
      k0y: r0.top - br.top + body.scrollTop,
      brL: br.left, brT: br.top,
      cx: cx, cy: cy
    };
    tf.style.willChange = 'transform';
  }

  function pinchMove(factor, cx, cy) {
    if (!pz) { pinchBegin(cx, cy); if (!pz) return; }
    if (isFinite(factor) && factor > 0) {
      pz.s = Math.max(PINCH_MIN / pz.z0, Math.min(PINCH_MAX / pz.z0, pz.s * factor));
    }
    pz.cx = cx; pz.cy = cy;
    clearTimeout(pzEndT);
    /*@3.NOAJ.133*/
    pzEndT = setTimeout(pinchEnd, 900);
    if (pzQ) return;
    pzQ = requestAnimationFrame(function () {
      pzQ = 0;
      if (!pz) return;
      var tx = (pz.cx - pz.brL - (pz.k0x - pz.body.scrollLeft)) - pz.u0x * pz.s;
      var ty = (pz.cy - pz.brT - (pz.k0y - pz.body.scrollTop)) - pz.u0y * pz.s;
      /*@3.NOAJ.134*/
      pz.tf.style.transform =
        'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' +
        (pz.z0 * pz.s) + ')';
      var lbl = document.getElementById('na-zoom-lbl');
      if (lbl) lbl.textContent = Math.round(pz.z0 * pz.s * 100) + '%';
    });
  }

  function pinchEnd() {
    clearTimeout(pzEndT);
    if (pzQ) { cancelAnimationFrame(pzQ); pzQ = 0; }
    var p = pz;
    pz = null;
    if (!p) return;
    var z1 = Math.round(p.z0 * p.s * 10000) / 10000;
    p.tf.style.transform = '';
    p.tf.style.willChange = '';
    if (Math.abs(z1 - p.z0) < 0.001) return;
    p.stg.style.setProperty('--na-z', String(z1));
    sizeStage();
    /*@3.NOAJ.137*/
    var r1 = p.tf.getBoundingClientRect();
    p.body.scrollLeft += r1.left - (p.cx - p.u0x * p.s);
    p.body.scrollTop += r1.top - (p.cy - p.u0y * p.s);
    uiSet('fs', z1);
    applyFs();
  }

  function docPinch(phase, factor, cx, cy) {
    if (phase === 'begin') pinchBegin(cx, cy);
    else if (phase === 'end') pinchEnd();
    else pinchMove(factor, cx, cy);
  }

  /*@3.NOAJ.124*/
  function bindDocPinch() {
    var body = els.docBody;
    if (!body) return;
    var pts = {};
    var prev = null;
    function overInk(e) {
      /*@3.NOAJ.220*/
      if (pdfOn()) return true;
      return e.target && e.target.closest && e.target.closest('.nov-host');
    }
    body.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch' || overInk(e)) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    });
    body.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length < 2) return;
      var a = pts[ids[0]], b = pts[ids[1]];
      var d = Math.hypot(b.x - a.x, b.y - a.y);
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      if (!prev) pinchBegin(cx, cy);
      else if (prev.d) pinchMove(d / Math.max(1e-3, prev.d), cx, cy);
      prev = { d: d, x: cx, y: cy };
    });
    function clearPt(e) {
      if (pts[e.pointerId] == null) return;
      delete pts[e.pointerId];
      if (Object.keys(pts).length < 2 && prev) { prev = null; pinchEnd(); }
    }
    body.addEventListener('pointerup', clearPt);
    body.addEventListener('pointercancel', clearPt);
    function twoFingerBlock(e) {
      if (e.touches && e.touches.length >= 2) e.preventDefault();
    }
    body.addEventListener('touchstart', twoFingerBlock, { passive: false });
    body.addEventListener('touchmove', twoFingerBlock, { passive: false });
  }

  var FS_MODES = ['auto', 'fit', 1];

  function resetFs() {
    if (pdfOn()) { pdfUi.refit('page'); applyFs(); return 1; }
    var m = fsMode();
    var i = FS_MODES.indexOf(m);
    uiSet('fs', FS_MODES[(i + 1) % FS_MODES.length]);
    applyFs();
  }

  var WIDTH_LABEL = {
    a4:   ['المقاسُ الأصليّ', 'Actual size'],
    land: ['عرضٌ موسَّع (كالأفقيّة)', 'Wide (landscape width)'],
    full: ['ملءُ العرض', 'Fit width']
  };

  /*@3.NOAJ.15*/
  function pxVar(name, fallback) {
    if (!els.app) return fallback;
    var raw = getComputedStyle(els.app).getPropertyValue(name);
    var n = parseFloat(raw);
    if (!isFinite(n)) return fallback;
    if (/rem\s*$/.test(raw)) {
      var root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return n * root;
    }
    return n;
  }

  function widthRoom() {
    var host = els.docBody;
    if (!host) return Infinity;
    var cs = getComputedStyle(host);
    var pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    return host.clientWidth - pad;
  }

  function effWidth() {
    var m = fsMode();
    if (m === 'wide') return 'land';
    if (m === 'fit') return 'full';
    return 'a4';
  }

  /*@3.NOAJ.17*/
  var pages = 1;

  function pageH() {
    return pxVar('--na-a4h', 1123);
  }

  function toRootRect(r) {
    var sheet = document.getElementById('na-sheet');
    var root = sheet && sheet.querySelector('.ne-root');
    if (!root) return null;
    var sr = sheet.getBoundingClientRect(), rr = root.getBoundingClientRect();
    var z = stageZoom();
    return { x: r.x - (rr.left - sr.left) / z, y: r.y - (rr.top - sr.top) / z,
             w: r.w, h: r.h };
  }

  function manualPages() {
    var d = ed && ed.doc;
    var n = (d && d.pg) ? Math.round(d.pg) : 1;
    if (!isFinite(n)) n = 1;
    return Math.max(1, Math.min(PAGE_MAX, n));
  }

  function setManualPages(n) {
    if (!ed || !ed.doc) return;
    var v = Math.max(1, Math.min(PAGE_MAX, Math.round(n) || 1));
    if (manualPages() === v) return;
    ed.doc.pg = v;
    ed.touch();
  }

  /*@3.NOAJ.91*/
  function covH() {
    var cov = document.getElementById('na-cover');
    if (!cov || cov.hidden || !cov.offsetHeight) return 0;
    var mb = parseFloat(getComputedStyle(cov).marginBlockEnd) || 0;
    return cov.offsetHeight + mb;
  }

  function setCovVar() {
    var page = document.getElementById('na-page');
    if (page) page.style.setProperty('--na-covh', Math.round(covH()) + 'px');
  }

/*@3.NOAJ.31*/
  function contentBottom() {
    var sheet = document.getElementById('na-sheet');
    var root = sheet && sheet.querySelector('.ne-root');
    if (!sheet) return 0;
    /*@3.NOAJ.65*/
    var z = stageZoom();
    var sTop = sheet.getBoundingClientRect().top;
    var used = 0, i;
    if (root) {
      /*@3.NOAJ.176*/
      var kids = root.children, k;
      for (i = kids.length - 1; i >= 0; i--) {
        k = kids[i];
        if (k.classList && k.classList.contains('ne-tail')) continue;
        if (k.hasAttribute && k.hasAttribute('data-fp')) continue;
        used = (k.getBoundingClientRect().bottom - sTop) / z;
        break;
      }
      var free = root.querySelectorAll(':scope > [data-bid][data-fp]');
      for (i = 0; i < free.length; i++) {
        used = Math.max(used, (free[i].getBoundingClientRect().bottom - sTop) / z);
      }
    }
    /*@3.NOAJ.24*/
    var d = ed && ed.doc;
    if (d && d.ov && d.ov.ch > 0 && d.ov.rw > 0) {
      var scale = (sheet.offsetWidth || sheet.getBoundingClientRect().width) / d.ov.rw;
      if (!isFinite(scale) || scale <= 0 || scale > 6) scale = 1;
      used = Math.max(used, d.ov.ch * scale);
    }
    return used;
  }

  /*@3.NOAJ.178*/
  function engBottom() {
    var d = ed && ed.doc;
    if (d && d.eng && d.eng.h > 0 && !ed._engStale) {
      var ovh = 0;
      if (d.ov && d.ov.ch > 0 && d.ov.rw > 0) {
        var sh = document.getElementById('na-sheet');
        var sc = sh ? ((sh.offsetWidth || sh.getBoundingClientRect().width) / d.ov.rw) : 1;
        if (!isFinite(sc) || sc <= 0 || sc > 6) sc = 1;
        ovh = d.ov.ch * sc;
      }
      return Math.max(d.eng.h, ovh);
    }
    return contentBottom();
  }

  function neededPages() {
    var sheet = document.getElementById('na-sheet');
    if (!sheet) return 1;
    var h = pageH();
    if (h < 40) return 1;
    var used = engBottom() + covH();
    var n = Math.ceil((used - 4) / h);
    if (!isFinite(n) || n < 1) n = 1;
    return Math.min(PAGE_MAX, n);
  }

  function applyPages(n) {
    var page = document.getElementById('na-page');
    if (!page) return;
    pages = Math.max(1, Math.min(PAGE_MAX, Math.round(n) || 1));
    page.style.setProperty('--na-pages', String(pages));
    page.setAttribute('data-pages', String(pages));
    var btn = document.getElementById('na-addpg');
    if (btn) {
      var lab = L('صفحة ' + (pages + 1), 'Page ' + (pages + 1));
      var sp = btn.querySelector('span');
      if (sp) sp.textContent = L('أضِف صفحةً — ' + lab, 'Add a page — ' + lab);
    }
    paintDelPage();
    updatePgNav();
    sizeStage();
    if (overlay && overlay.fit) { try { overlay.fit(); } catch (e) {} }
  }

  function pdfOn() { return !!(pdfUi && pdfUi.ready()); }

  function pgTotal() {
    if (pdfOn()) return Math.max(1, pdfUi.pages());
    return pages;
  }

  /*@3.NOAJ.95*/
  function pgCurPage() {
    if (pdfOn()) return pdfUi.page();
    var sheet = document.getElementById('na-sheet');
    if (!sheet || !els.docBody) return 1;
    var scR = els.docBody.getBoundingClientRect();
    var shR = sheet.getBoundingClientRect();
    var z = stageZoom() || 1;
    var mid = (scR.top + scR.height / 2 - shR.top) / z + covH();
    var n = Math.floor(mid / Math.max(40, pageH())) + 1;
    return Math.max(1, Math.min(pages, n));
  }

  function pgGoto(n) {
    if (pdfOn()) {
      pdfUi.goTo(Math.max(1, Math.min(pgTotal(), Math.round(n) || 1)), 0);
      updatePgNav();
      return;
    }
    var sheet = document.getElementById('na-sheet');
    if (!sheet || !els.docBody) return;
    n = Math.max(1, Math.min(pages, Math.round(n) || 1));
    var z = stageZoom() || 1;
    var y = Math.max(0, (n - 1) * pageH() - covH());
    var shR = sheet.getBoundingClientRect();
    var scR = els.docBody.getBoundingClientRect();
    els.docBody.scrollTop += (shR.top - scR.top) + y * z - 8;
    updatePgNav();
  }

  function updatePgNav() {
    if (!els.pgnav) return;
    var tot = pgTotal(), on;
    if (pdfOn()) {
      on = tot > 1;
    } else {
      var sheet = document.getElementById('na-sheet');
      var pageEl = document.getElementById('na-page');
      var isBoard = pageEl && pageEl.getAttribute('data-kind') === 'board';
      on = !!sheet && pages > 1 && !isBoard;
    }
    els.pgnavT.textContent = pgCurPage() + ' / ' + tot;
    els.pgnav.hidden = !on;
  }

  function buildPgNav() {
    var doc = document.querySelector('.na-doc');
    if (!doc || !els.docBody || els.pgnav) return;
    /*@3.NOAJ.104*/
    var railSlot = document.getElementById('na-pgslot');
    var nav = document.createElement('div');
    nav.className = 'na-pgnav';
    nav.hidden = true;
    nav.innerHTML =
      '<button type="button" class="na-pgnav-b" data-go="first"' +
        ' aria-label="\u0623\u0648\u0651\u0644\u064f\u0020\u0627\u0644\u0645\u0644\u0641\u0651"' +
        ' data-ar-title="\u0623\u0648\u0651\u0644\u064f\u0020\u0627\u0644\u0645\u0644\u0641\u0651" data-en-title="First page">' +
        '<i class="fa-solid fa-angles-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="na-pgnav-b" data-go="-1"' +
        ' aria-label="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629"' +
        ' data-ar-title="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629" data-en-title="Previous page">' +
        '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="na-pgnav-cur" id="na-pgnav-cur"' +
        ' aria-label="\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0635\u0641\u062d\u0629"' +
        ' data-ar-title="\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0635\u0641\u062d\u0629" data-en-title="Go to page">' +
        '<span id="na-pgnav-t">1 / 1</span></button>' +
      '<div class="na-pgnav-ask" id="na-pgnav-ask" hidden>' +
        '<input type="number" id="na-pgnav-in" min="1" step="1" inputmode="numeric"' +
        ' aria-label="\u0631\u0642\u0645 \u0627\u0644\u0635\u0641\u062d\u0629"' +
        ' data-ar-title="\u0631\u0642\u0645 \u0627\u0644\u0635\u0641\u062d\u0629" data-en-title="Page number">' +
      '</div>' +
      '<button type="button" class="na-pgnav-b" data-go="1"' +
        ' aria-label="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629"' +
        ' data-ar-title="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629" data-en-title="Next page">' +
        '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<button type="button" class="na-pgnav-b" data-go="last"' +
        ' aria-label="\u0622\u062e\u0631\u064f\u0020\u0627\u0644\u0645\u0644\u0641\u0651"' +
        ' data-ar-title="\u0622\u062e\u0631\u064f\u0020\u0627\u0644\u0645\u0644\u0641\u0651" data-en-title="Last page">' +
        '<i class="fa-solid fa-angles-down" aria-hidden="true"></i></button>';
    (railSlot || doc).appendChild(nav);
    els.pgnav = nav;
    els.pgnavT = nav.querySelector('#na-pgnav-t');
    var ask = nav.querySelector('#na-pgnav-ask');
    var inp = nav.querySelector('#na-pgnav-in');
    /*@3.NOAJ.245*/
    var runT = null, runF = 0, runDir = 0, runOn = false, runLast = 0, runSped = 0;
    function runStop() {
      if (runT) { clearTimeout(runT); runT = null; }
      if (runF) { clearInterval(runF); runF = 0; }
      runDir = 0;
    }
    /*@3.NOAJ.249*/
    function runTick() {
      var box = els.docBody;
      if (!box || !runDir) { runStop(); return; }
      var t = Date.now();
      var dt = Math.min(120, t - runLast);
      runLast = t;
      runSped = Math.min(1, runSped + dt / 900);
      box.scrollTop += runDir * Math.min(1900, 620 + runSped * 900) * dt / 1000;
      runOn = true;
    }
    function runStart() {
      runLast = Date.now();
      runSped = 0;
      if (runF) clearInterval(runF);
      runF = setInterval(runTick, 16);
    }
    nav.addEventListener('pointerdown', function (e) {
      var go = e.target && e.target.closest ? e.target.closest('[data-go]') : null;
      if (!go) return;
      var d = go.getAttribute('data-go');
      if (d !== '1' && d !== '-1') return;
      runStop();
      runOn = false;
      runDir = Number(d);
      runT = setTimeout(function () {
        runT = null;
        if (!runDir) return;
        runStart();
      }, 420);
    });
    function runEnd() { runStop(); }
    nav.addEventListener('pointerup', runEnd);
    nav.addEventListener('pointercancel', runEnd);
    nav.addEventListener('pointerleave', runEnd);
    window.addEventListener('blur', runEnd);

    nav.addEventListener('click', function (e) {
      var go = e.target && e.target.closest ? e.target.closest('[data-go]') : null;
      /*@3.NOAJ.247*/
      if (runOn) { runOn = false; return; }
      if (go) {
        var d = go.getAttribute('data-go');
        if (d === 'first') pgGoto(1);
        else if (d === 'last') pgGoto(pgTotal());
        /*@3.NOAJ.236*/
        else if (pdfOn()) { pdfUi.step(Number(d)); updatePgNav(); }
        else pgGoto(pgCurPage() + Number(d));
        return;
      }
      var cur = e.target && e.target.closest ? e.target.closest('#na-pgnav-cur') : null;
      if (cur) {
        var open = ask.hidden;
        ask.hidden = !open;
        nav.setAttribute('data-ask', open ? '1' : '0');
        if (open) {
          inp.max = String(pages);
          inp.value = String(pgCurPage());
          inp.focus();
          inp.select();
        }
      }
    });
    var closeAsk = function () {
      if (ask.hidden) return;
      ask.hidden = true;
      nav.setAttribute('data-ask', '0');
    };
    /*@3.NOAJ.109*/
    document.addEventListener('pointerdown', function (e) {
      if (ask.hidden) return;
      if (nav.contains(e.target)) return;
      closeAsk();
    }, true);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { pgGoto(Number(inp.value)); closeAsk(); }
      if (e.key === 'Escape') { closeAsk(); }
      e.stopPropagation();
    });
    inp.addEventListener('change', function () {
      pgGoto(Number(inp.value));
      updatePgNav();
    });
    var tk = 0;
    els.docBody.addEventListener('scroll', function () {
      rememberPos();
      if (tk) return;
      tk = requestAnimationFrame(function () { tk = 0; updatePgNav(); });
    }, { passive: true });
    updatePgNav();
  }

  function paintDelPage() {
    var del = document.getElementById('na-delpg');
    if (!del) return;
    del.disabled = pages <= 1;
    del.removeAttribute('data-armed');
    var sp = del.querySelector('span');
    if (sp) sp.textContent = L('احذف الصفحة ' + pages, 'Delete page ' + pages);
    var t = L('احذف الصفحة الأخيرة', 'Delete the last page');
    del.setAttribute('aria-label', t);
    del.setAttribute('title', t);
  }

/*@3.NOAJ.32*/
  function lastPageBand() {
    var sheet = document.getElementById('na-sheet');
    if (!sheet) return null;
    var h = pageH();
    return { x: 0, y: Math.max(0, (pages - 1) * h - covH()),
             w: sheet.offsetWidth || sheet.getBoundingClientRect().width, h: h };
  }

  function addPage() {
    var want = Math.min(PAGE_MAX, pages + 1);
    setManualPages(want);
    applyPages(Math.max(want, neededPages()));
  }

  function delPage(btn) {
    if (pages <= 1) return;
    var band = lastPageBand();
    if (!band) return;
    var busy = contentBottom() > band.y + 2;
    if (busy && btn.getAttribute('data-armed') !== '1') {
      btn.setAttribute('data-armed', '1');
      var sp = btn.querySelector('span');
      if (sp) sp.textContent = L('فيها محتوى — اضغط للتأكيد', 'It has content — press to confirm');
      return;
    }
    if (busy) {
      var rb = toRootRect(band);
      if (ed && rb) { ed.blocksInRect(rb); ed.deleteBlocks(); }
      if (overlay && overlay.clearBand) { try { overlay.clearBand(band); } catch (e) {} }
    }
    setManualPages(pages - 1);
    applyPages(Math.max(1, Math.max(neededPages(), manualPages())));
  }

  /*@3.NOAJ.25*/
  function growPages(min) {
    /*@3.NOAJ.92*/
    var guard = 0, want;
    do {
      want = Math.max(neededPages(), manualPages(), min || 1);
      if (want === pages) break;
      applyPages(want);
    } while (++guard < 6);
    return pages;
  }

  var PDF_VIEWS = [
    { m: 1, o: 'row', icon: 'fa-file',              ar: 'صفحةٌ واحدة',            en: 'Single page' },
    { m: 2, o: 'row', icon: 'fa-book-open',         ar: 'صفحتان متجاورتان',       en: 'Two pages' },
    { m: 4, o: 'row', icon: 'fa-table-cells-large', ar: 'أربعٌ — صفّاً بعد صفّ',  en: 'Four — row by row' },
    { m: 4, o: 'col', icon: 'fa-table-columns',     ar: 'أربعٌ — عموداً بعد عمود', en: 'Four — column by column' }
  ];

  function pdfViewIx() {
    if (!pdfOn()) return 0;
    var m = pdfUi.mode(), o = pdfUi.order();
    for (var i = 0; i < PDF_VIEWS.length; i++) {
      if (PDF_VIEWS[i].m === m && (m !== 4 || PDF_VIEWS[i].o === o)) return i;
    }
    return 0;
  }

  /*@3.NOAJ.221*/
  function paintSideBtn() {
    var sb = document.getElementById('na-pdf-side');
    if (!sb) return;
    /*@3.NOAJ.228*/
    var live = pdfOn();
    var on = live && pdfUi.mode() !== 1;
    sb.hidden = !live;
    if (live && !on) {
      sb.setAttribute('data-idle', '1');
      sb.setAttribute('aria-hidden', 'true');
      sb.setAttribute('tabindex', '-1');
      sb.disabled = true;
      return;
    }
    sb.removeAttribute('data-idle');
    sb.removeAttribute('aria-hidden');
    sb.removeAttribute('tabindex');
    sb.disabled = false;
    if (!on) return;
    var rtl = pdfUi.side() === 'rtl';
    sb.innerHTML = '<i class="fa-solid ' +
      (rtl ? 'fa-arrow-right-long' : 'fa-arrow-left-long') + '" aria-hidden="true"></i>';
    var ar = rtl ? 'البدايةُ من اليمين' : 'البدايةُ من اليسار';
    var en = rtl ? 'Starts from the right' : 'Starts from the left';
    sb.setAttribute('aria-pressed', rtl ? 'true' : 'false');
    sb.setAttribute('aria-label', L(ar, en));
    sb.setAttribute('title', L(ar, en));
    sb.setAttribute('data-ar-title', ar);
    sb.setAttribute('data-en-title', en);
  }

  /*@3.NOAJ.211*/
  /*@3.NOAJ.233*/
  function paintDrawBtn() {
    var on = pdfOn();
    var arm = on && !!pdfUi.drawing();
    var ar = arm ? 'أغلقِ القلم — عُد إلى القراءة' : 'القلم — ارسم فوق الصفحة';
    var en = arm ? 'Put the pen down — back to reading' : 'Pen — draw on the page';
    ['na-pdf-draw', 'na-draw-top'].forEach(function (k) {
      var b = document.getElementById(k);
      if (!b) return;
      b.hidden = !on;
      if (!on) return;
      b.classList.toggle('on', arm);
      b.setAttribute('aria-pressed', arm ? 'true' : 'false');
      b.setAttribute('aria-label', L(ar, en));
      b.setAttribute('title', L(ar, en));
      b.setAttribute('data-ar-title', ar);
      b.setAttribute('data-en-title', en);
    });
  }

  /*@3.NOAJ.234*/
  function pdfDraw(on) {
    if (!pdfOn() || !pdfUi.ink()) return false;
    var arm = pdfUi.draw(on);
    if (arm && !pdfDial && window.GardenNotesDial) {
      pdfDial = GardenNotesDial.mount({
        canvas: function () {
          return (pdfUi && pdfUi.ink()) ? pdfUi.ink().bar() : null;
        },
        onExit: function () { pdfDraw(false); },
        favHost: document.getElementById('na-favs')
      });
    }
    if (pdfDial) pdfDial.show(arm, arm);
    paintDrawBtn();
    return arm;
  }

  function paintPdfBtns() {
    paintSideBtn();
    paintDrawBtn();
    var vb = document.getElementById('na-pdf-view');
    var fb = document.getElementById('na-pdf-flow');
    var on = pdfOn();
    if (vb) {
      vb.hidden = !on;
      if (on) {
        var v = PDF_VIEWS[pdfViewIx()];
        vb.innerHTML = '<i class="fa-solid ' + v.icon + '" aria-hidden="true"></i>';
        var t = L(v.ar, v.en);
        vb.setAttribute('aria-label', t);
        vb.setAttribute('title', t);
        vb.setAttribute('data-ar-title', v.ar);
        vb.setAttribute('data-en-title', v.en);
      }
    }
    if (fb) {
      fb.hidden = !on;
      if (on) {
        var paged = pdfUi.flow() === 'page';
        fb.innerHTML = '<i class="fa-solid ' +
          (paged ? 'fa-square-caret-down' : 'fa-arrows-up-down') + '" aria-hidden="true"></i>';
        var ar = paged ? 'التنقّل صفحةً صفحة' : 'التمرير المتّصل';
        var en = paged ? 'Page by page' : 'Continuous scrolling';
        fb.setAttribute('aria-pressed', paged ? 'true' : 'false');
        fb.setAttribute('aria-label', L(ar, en));
        fb.setAttribute('title', L(ar, en));
        fb.setAttribute('data-ar-title', ar);
        fb.setAttribute('data-en-title', en);
      }
    }
  }

  function paintWidthBtn() {
    var wb = document.getElementById('na-width');
    if (!wb) return;
    var eff = effWidth();
    var lab = WIDTH_LABEL[S.width] || WIDTH_LABEL.a4;
    if (pdfOn()) {
      /*@3.NOAJ.222*/
      var zm = pdfUi.zoomMode();
      lab = zm === 'page' ? ['ملء العرض', 'Fit width']
          : (zm === 'fit' ? ['المقاسُ الأصليّ', 'Actual size']
                          : ['الصفحةُ كاملةً', 'Whole page']);
      eff = zm === 'page' ? 'a4' : (zm === 'fit' ? 'full' : 'wide');
    }
    wb.setAttribute('aria-label', L(lab[0], lab[1]));
    wb.setAttribute('data-ar-title', lab[0]);
    wb.setAttribute('data-en-title', lab[1]);
    wb.setAttribute('title', L(lab[0], lab[1]));
    wb.setAttribute('data-w', eff);
  }

  /*@3.NOAJ.30*/
  function alignRules() {
    var page = document.getElementById('na-page');
    var sheet = document.getElementById('na-sheet');
    if (!page || !sheet) return;
    if (page.getAttribute('data-bgp') !== 'line') {
      page.style.removeProperty('--na-ruleoff');
      return;
    }
    var t = sheet.querySelector('.ne-text, .ne-li');
    if (!t) { page.style.removeProperty('--na-ruleoff'); return; }
    var rule = parseFloat(getComputedStyle(t).lineHeight);
    if (!isFinite(rule) || rule < 6) { page.style.removeProperty('--na-ruleoff'); return; }
    var cs = getComputedStyle(sheet);
    var origin = sheet.getBoundingClientRect().top + (parseFloat(cs.borderTopWidth) || 0);
    var delta = (t.getBoundingClientRect().top - origin) / stageZoom();
    var off = ((delta % rule) + rule) % rule;
    page.style.setProperty('--na-ruleoff', Math.round(off) + 'px');
  }

  function applyRail() {
    var root = els.docBody && els.docBody.querySelector('.ne-root');
    if (root) root.setAttribute('data-rail', 'out');
  }

  /*@3.NOAJ.33*/
  function applyWidth() {
    var eff = effWidth();
    if (els.app) els.app.setAttribute('data-width', eff);
    paintWidthBtn();
    if (pdfOn()) { applyFs(); return; }
    applyRail();
    alignRules();
    applyFs();
    if (ed && ed.layoutFree) { try { ed.layoutFree(); } catch (e) {} }
    applyPages(Math.max(1, neededPages()));
    if (overlay && overlay.fit) { try { overlay.fit(); } catch (e) {} }
  }

  /*@3.NOAJ.96*/
  function viewAnchor() {
    var sc = els.docBody, sheet = document.getElementById('na-sheet');
    if (!sc || !sheet) return null;
    var z = stageZoom() || 1;
    var shR = sheet.getBoundingClientRect(), scR = sc.getBoundingClientRect();
    return (scR.top + scR.height / 2 - shR.top) / z;
  }

  function restoreAnchor(anchor) {
    var sc = els.docBody, sheet = document.getElementById('na-sheet');
    if (anchor == null || !sc || !sheet) return;
    var z = stageZoom() || 1;
    var shR = sheet.getBoundingClientRect(), scR = sc.getBoundingClientRect();
    sc.scrollTop += (shR.top - scR.top) + anchor * z - scR.height / 2;
    if (overlay && overlay.syncWindow) { try { overlay.syncWindow(); } catch (e) {} }
    updatePgNav();
  }

  function setWidth(mode) {
    var anchor = viewAnchor();
    if (WIDTHS.indexOf(mode) < 0) mode = 'a4';
    S.width = mode;
    uiSet('fs', VIEW_FS[mode]);
    applyWidth();
    restoreAnchor(anchor);
  }

  function nextWidth() {
    var i = WIDTHS.indexOf(effWidth());
    if (i < 0) i = 0;
    return WIDTHS[(i + 1) % WIDTHS.length];
  }

  function syncIcons() {
    var l = document.getElementById('na-go-list');
    if (l) l.setAttribute('aria-pressed', S.panel ? 'true' : 'false');
  }

  function showPanel(which) {
    /*@3.NOAJ.103*/
    /*@3.NOAJ.223*/
    if (isPhone()) {
      var openNow = els.app && els.app.getAttribute('data-mob') === 'list';
      if (openNow && (edId || pdfOn())) { setMob('doc'); return; }
      setMob('list'); setAcc(which); setPanel(true);
      return;
    }
    if (S.panel && S.acc === which) { setPanel(false); return; }
    setAcc(which);
    setPanel(true);
  }


  function reload(opts) {
    var M = window.GardenNotesModel;
    if (!M) return;
    S.all = M.all({ withArchived: true }).map(function (n) {
      if (n.src === 'rich') {
        var rec = idxFind(n.id);
        n.folder = (rec && rec.f) || null;
      } else { n.folder = null; }
      return n;
    });
    renderRail();
    renderList();
    renderQuota();
    if (!(opts && opts.keepOpen) && edId && !idxFind(edId)) closeNote();
  }


  var NOTE_DRAG_PX = 6;

  /*@3.NOAJ.12*/
  function bindNoteDrag() {
    if (!els.items || !els.tree) return;
    var D = null;

    function clearDrop() {
      [].forEach.call(els.tree.querySelectorAll('.na-f-row.drop-in'), function (n) {
        n.classList.remove('drop-in');
      });
    }

    function aim(x, y) {
      clearDrop();
      D.fid = null;
      var rows = els.tree.querySelectorAll('.na-f-row');
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          rows[i].classList.add('drop-in');
          D.fid = rows[i].closest('.na-f').getAttribute('data-fid');
          return;
        }
      }
    }

    bindRowSwipe(els.items);

    els.items.addEventListener('pointerdown', function (e) {
      /*@3.NOAJ.108*/
      if (e.pointerType === 'touch') return;
      var row = e.target.closest('.na-row');
      if (!row) return;
      var uid = row.getAttribute('data-uid');
      var n = null;
      for (var i = 0; i < S.list.length; i++) if (S.list[i].uid === uid) { n = S.list[i]; break; }
      if (!n || n.src !== 'rich') return;
      D = { id: n.id, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId, row: row, fid: null };
      try { row.setPointerCapture(e.pointerId); } catch (x) {}
    });

    els.items.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      if (!D.on) {
        if (Math.abs(e.clientX - D.x) < NOTE_DRAG_PX && Math.abs(e.clientY - D.y) < NOTE_DRAG_PX) return;
        D.on = true;
        D.row.classList.add('na-row--drag');
        setAcc('folders');
        setPanel(true);
      }
      e.preventDefault();
      aim(e.clientX, e.clientY);
    });

    function finish(commit) {
      if (!D) return;
      var d = D; D = null;
      try { d.row.releasePointerCapture(d.pid); } catch (x) {}
      clearDrop();
      d.row.classList.remove('na-row--drag');
      if (!d.on || !commit || !d.fid) return;
      var rec = idxFind(d.id);
      if (!rec || rec.f === d.fid) return;
      rec.f = d.fid;
      rec.updated_at = Date.now();
      idxPut(rec);
      reload({ keepOpen: true });
    }

    els.items.addEventListener('pointerup', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      var was = D.on;
      finish(true);
      if (was) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    els.items.addEventListener('pointercancel', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      finish(false);
    });
  }

  function onTreeClick(e) {
    var add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); e.stopPropagation(); newFolder(''); return; }

    var tog = e.target.closest('[data-ftog]');
    if (tog) {
      e.preventDefault(); e.stopPropagation();
      var fid = tog.getAttribute('data-ftog');
      var box = tog.closest('.na-f');
      var isOpen = box.getAttribute('data-open') === '1';
      box.setAttribute('data-open', isOpen ? '0' : '1');
      tog.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      uiSet('f_' + fid, isOpen ? 0 : 1);
      renderRail();
      return;
    }

    var nt = e.target.closest('[data-ntog]');
    if (nt) {
      e.preventDefault(); e.stopPropagation();
      var nk = nt.getAttribute('data-ntog');
      uiSet(nk, ui()[nk] === 1 ? 0 : 1);
      renderRail();
      return;
    }

    var fm = e.target.closest('[data-fmenu]');
    if (fm) { e.preventDefault(); e.stopPropagation(); editFolder(fm.getAttribute('data-fmenu')); return; }

    var gh = e.target.closest('.na-grp-h');
    if (gh) {
      var g = gh.getAttribute('data-grp');
      var box = gh.parentNode;
      var open = box.getAttribute('data-open') === '1';
      box.setAttribute('data-open', open ? '0' : '1');
      gh.setAttribute('aria-expanded', open ? 'false' : 'true');
      uiSet('g_' + g, open ? 0 : 1);
      return;
    }

    var it = e.target.closest('.na-item');
    if (!it) return;
    var v;
    try { v = JSON.parse(it.getAttribute('data-v')); } catch (e2) { return; }
    S.view = v;
    uiSet('view', v);
    S.q = '';
    if (els.find) els.find.value = '';
    setAcc('list');
    renderRail();
    renderList();
  }

  /*@3.NOAJ.50*/
  function pasteNotes(intoFolder) {
    var clip = S.clip;
    if (!clip || !clip.ids || !clip.ids.length) return;
    var target = (intoFolder !== undefined && intoFolder !== null)
      ? intoFolder
      : ((S.view && S.view.k === 'folder') ? S.view.id : null);
    var n = 0;
    clip.ids.forEach(function (id) {
      var rec = idxFind(id);
      if (!rec) return;
      if (clip.cut) {
        rec.f = target;
        rec.updated_at = Date.now();
        idxPut(rec);
        n++;
        return;
      }
      /*@3.NOAJ.53*/
      var nid = newId('rn');
      var copy = Object.assign({}, rec, {
        id: nid, f: target,
        t: (rec.t || '') + L(' — نسخة', ' — copy'),
        ca: Date.now(), updated_at: Date.now()
      });
      idxPut(copy);
      var St = window.GardenNotesStore;
      if (St && St.getDoc && St.putDoc) {
        St.getDoc(id).then(function (row) {
          if (row && row.doc) return St.putDoc(nid, row.doc, Date.now());
          return null;
        }).then(function () { reload({ keepOpen: true }); })
          .catch(function () {});
      }
      n++;
    });
    if (clip.cut) S.clip = null;
    clearPicked();
    saveState('', L('أُلصقت ' + n, 'Pasted ' + n));
    reload({ keepOpen: true });
  }

  /*@3.NOAJ.51*/
  function moveMany() {
    var ids = S.moveMany || [];
    if (!ids.length) return;
    var dlg = document.getElementById('na-move');
    if (!dlg) return;
    var box = dlg.querySelector('[data-role="list"]');
    var T = folderTree();
    function row(id, icon, label) {
      return '<button type="button" class="gsf-row" data-fmany="' + esc(id) + '">' +
        '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
        '<span>' + esc(label) + '</span></button>';
    }
    var h = row('', 'fa-inbox', L('بلا مجلّد', 'No folder'));
    (function walk(parent) {
      var list = T.kids[parent] || [];
      for (var i = 0; i < list.length; i++) {
        h += row(list[i].id, 'fa-folder', folderPath(list[i].id).join(' / '));
        walk(list[i].id);
      }
    })('');
    box.innerHTML = h;
    i18n(box);
    try { dlg.showModal(); } catch (e) {}
  }

  /*@3.NOAJ.52*/
  function confirmDeleteMany(recs) {
    var dlg = document.getElementById('na-confirm');
    if (!dlg) return;
    pendMany = recs.map(function (r) { return r.id; });
    pendDelete = null;
    var t = dlg.querySelector('[data-role="what"]');
    if (t) {
      t.textContent = L(recs.length + ' ملاحظةً محدَّدة',
                        recs.length + ' selected notes');
    }
    try { dlg.showModal(); } catch (e) {}
  }

  /*@3.NOAJ.48*/
  function closeCtx() {
    var m = document.getElementById('na-ctx');
    if (m) m.remove();
  }

  function ctxItem(act, icon, label, danger) {
    return '<button type="button" class="na-ctx-i' + (danger ? ' na-ctx-i--danger' : '') +
      '" data-cact="' + act + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + esc(label) + '</span></button>';
  }

  /*@3.NOAJ.246*/
  function openMenuAt(x, y, html, onAct) {
    closeCtx();
    var m = document.createElement('div');
    m.className = 'na-ctx';
    m.id = 'na-ctx';
    m.setAttribute('role', 'menu');
    m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    m.innerHTML = html;
    m.style.insetBlockStart = '0px';
    m.style.left = '0px';
    document.body.appendChild(m);
    var r = m.getBoundingClientRect();
    var pad = 8;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    m.style.insetBlockStart = Math.max(pad, Math.min(y, vh - r.height - pad)) + 'px';
    m.style.left = Math.max(pad, Math.min(x, vw - r.width - pad)) + 'px';
    m.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-cact]') : null;
      if (!b) return;
      closeCtx();
      onAct(b.getAttribute('data-cact'), b);
    });
    setTimeout(function () {
      document.addEventListener('pointerdown', onCtxAway, true);
      document.addEventListener('keydown', onCtxKey, true);
    }, 0);
    return m;
  }

  function openCtx(x, y, uid) {
    closeCtx();
    var many = pickedIds();
    if (uid && many.indexOf(uid) < 0) { clearPicked(); many = []; }
    var n = many.length || (uid ? 1 : 0);
    if (!n) return;
    var plural = n > 1 ? (' (' + n + ')') : '';
    openMenuAt(x, y,
      ctxItem('open', 'fa-up-right-from-square', L('افتحْها', 'Open')) +
      ctxItem('pick', 'fa-square-check', L('حدِّدْ/ألغِ التحديد', 'Select / deselect')) +
      ctxItem('copy', 'fa-copy', L('انسخْ', 'Copy') + plural) +
      ctxItem('cut', 'fa-scissors', L('قُصَّ', 'Cut') + plural) +
      ctxItem('paste', 'fa-paste', L('ألصِقْ هنا', 'Paste here')) +
      ctxItem('move', 'fa-folder-open', L('انقلْ إلى مجلّد', 'Move to folder') + plural) +
      ctxItem('del', 'fa-trash', L('احذفْ', 'Delete') + plural, 1),
      function (act) { ctxAct(act, uid); });
  }

  function onCtxAway(e) {
    if (e.target.closest && e.target.closest('.na-ctx')) return;
    closeCtx();
    document.removeEventListener('pointerdown', onCtxAway, true);
    document.removeEventListener('keydown', onCtxKey, true);
  }

  function onCtxKey(e) {
    if (e.key !== 'Escape') return;
    closeCtx();
    document.removeEventListener('pointerdown', onCtxAway, true);
    document.removeEventListener('keydown', onCtxKey, true);
  }

  /*@3.NOAJ.49*/
  function ctxTargets(uid) {
    var many = pickedIds();
    if (many.length) return many;
    return uid ? [uid] : [];
  }

  function openFolderCtx(x, y, fid) {
    closeCtx();
    var T = folderTree();
    var f = T.byId[fid];
    if (!f) return;
    var canPaste = !!(S.clip && S.clip.ids && S.clip.ids.length);
    var m = document.createElement('div');
    m.className = 'na-ctx';
    m.id = 'na-ctx';
    m.setAttribute('role', 'menu');
    m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    m.innerHTML =
      ctxItem('fopen', 'fa-folder-open', L('افتحْه', 'Open')) +
      ctxItem('fnew', 'fa-folder-plus', L('مجلّدٌ بداخله', 'New folder inside')) +
      ctxItem('frename', 'fa-pen', L('أعِدْ تسميتَه أو انقلْه', 'Rename or move')) +
      (canPaste ? ctxItem('fpaste', 'fa-paste',
        L('ألصِقِ الملاحظاتِ هنا', 'Paste notes here')) : '') +
      ctxItem('fdel', 'fa-trash', L('احذفِ المجلّد', 'Delete folder'), 1);
    document.body.appendChild(m);
    var r = m.getBoundingClientRect();
    var pad = 8;
    m.style.insetBlockStart = Math.max(pad, Math.min(y, innerHeight - r.height - pad)) + 'px';
    m.style.left = Math.max(pad, Math.min(x, innerWidth - r.width - pad)) + 'px';
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cact]');
      if (!b) return;
      closeCtx();
      folderCtxAct(b.getAttribute('data-cact'), fid);
    });
    setTimeout(function () {
      document.addEventListener('pointerdown', onCtxAway, true);
      document.addEventListener('keydown', onCtxKey, true);
    }, 0);
  }

  function folderCtxAct(act, fid) {
    if (act === 'fopen') { goView({ k: 'folder', id: fid }); return; }
    if (act === 'fnew') { newFolder(fid); return; }
    if (act === 'frename') { editFolder(fid); return; }
    if (act === 'fpaste') { pasteNotes(fid); return; }
    if (act === 'fdel') { confirmFolderDelete(fid); }
  }

  function goView(v) {
    S.view = v;
    uiSet('view', v);
    S.q = '';
    if (els.find) els.find.value = '';
    setAcc('list');
    renderRail();
    renderList();
  }

  function confirmSub(ar, en) {
    var dlg = document.getElementById('na-confirm');
    var sub = dlg && dlg.querySelector('[data-role="sub"]');
    if (!sub) return;
    sub.textContent = L(ar, en);
    sub.setAttribute('data-ar', ar);
    sub.setAttribute('data-en', en);
  }

  function confirmTitle(ar, en) {
    var dlg = document.getElementById('na-confirm');
    var t = dlg && dlg.querySelector('#na-confirm-t');
    if (!t) return;
    t.textContent = L(ar, en);
    t.setAttribute('data-ar', ar);
    t.setAttribute('data-en', en);
  }

  function confirmOkLabel(ar, en) {
    var dlg = document.getElementById('na-confirm');
    var b = dlg && dlg.querySelector('[data-role="ok"]');
    if (!b) return;
    b.textContent = L(ar, en);
    b.setAttribute('data-ar', ar);
    b.setAttribute('data-en', en);
  }

  function confirmFolderDelete(fid) {
    var T = folderTree();
    var f = T.byId[fid];
    if (!f) return;
    var kids = (T.kids[fid] || []).length;
    var dlg = document.getElementById('na-confirm');
    if (!dlg) return;
    pendFolder = fid;
    pendDelete = null;
    pendMany = null;
    confirmTitle(FOLD_T_AR, FOLD_T_EN);
    confirmSub(FOLD_SUB_AR + (kids ? FOLD_KIDS_AR : ''),
               FOLD_SUB_EN + (kids ? FOLD_KIDS_EN : ''));
    confirmOkLabel(FOLD_OK_AR, FOLD_OK_EN);
    var w = dlg.querySelector('[data-role="what"]');
    if (w) w.textContent = f.n || '';
    try { dlg.showModal(); } catch (e) {}
  }

  function resetConfirm() {
    confirmTitle(NOTE_T_AR, NOTE_T_EN);
    confirmSub(NOTE_SUB_AR, NOTE_SUB_EN);
    confirmOkLabel(NOTE_OK_AR, NOTE_OK_EN);
  }

  function ctxAct(act, uid) {
    var ids = ctxTargets(uid);
    var recs = ids.map(richOf).filter(Boolean);
    if (act === 'open') {
      if (recs[0]) openNote(recs[0].id);
      return;
    }
    if (act === 'pick') { if (uid) togglePick(uid); return; }
    if (act === 'copy' || act === 'cut') {
      S.clip = { cut: act === 'cut', ids: recs.map(function (r) { return r.id; }) };
      saveState('', L(
        (act === 'cut' ? 'قُصَّت ' : 'نُسخت ') + recs.length + (recs.length === 1 ? ' ملاحظة' : ' ملاحظات'),
        (act === 'cut' ? 'Cut ' : 'Copied ') + recs.length + ' note' + (recs.length === 1 ? '' : 's')));
      return;
    }
    if (act === 'paste') { pasteNotes(); return; }
    if (act === 'move') {
      if (recs.length === 1) { openNote(recs[0].id, { silent: 1 }); moveNote(); return; }
      S.moveMany = recs.map(function (r) { return r.id; });
      moveMany();
      return;
    }
    if (act === 'del') {
      if (recs.length === 1) { confirmDelete(recs[0].id, recs[0].title); return; }
      confirmDeleteMany(recs);
    }
  }

  /*@3.NOAJ.107*/
  var SWIPE_GO = 64;

  function rowRec(row) {
    return row ? richOf(row.getAttribute('data-uid')) : null;
  }

  function setNotePinned(rec, on) {
    var r = idxFind(rec.id);
    if (!r) return;
    r.p = on ? 1 : 0;
    r.updated_at = Date.now();
    idxPut(r);
    if (r.id === edId) syncPinBtn(r);
    reload({ keepOpen: true });
  }

  function setArchived(rec, on) {
    var r = idxFind(rec.id);
    if (!r) return;
    r.a = on ? 1 : 0;
    r.updated_at = Date.now();
    idxPut(r);
    reload({ keepOpen: true });
  }

  var swipeAte = 0;
  function bindRowSwipe(host) {
    if (!host || host._swBound) return;
    host._swBound = 1;
    var st = null;
    host.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') { st = null; return; }
      var row = e.target.closest ? e.target.closest('.na-row') : null;
      if (!row || !rowRec(row)) { st = null; return; }
      st = { row: row, x: e.clientX, y: e.clientY, live: 0, dead: 0 };
    }, true);
    host.addEventListener('pointermove', function (e) {
      if (!st) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.live) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { st.dead = 1; st = null; return; }
        if (Math.abs(dx) < 10) return;
        st.live = 1;
      }
      st.row.style.transform = 'translateX(' + Math.round(dx) + 'px)';
      st.row.setAttribute('data-sw', dx > 0 ? 'r' : 'l');
      st.row.setAttribute('data-swgo', Math.abs(dx) >= SWIPE_GO ? '1' : '0');
    }, true);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (evn) {
      host.addEventListener(evn, function (e) {
        if (!st) return;
        var row = st.row, dx = (e.clientX || st.x) - st.x, live = st.live;
        st = null;
        row.style.transform = '';
        row.removeAttribute('data-sw');
        row.removeAttribute('data-swgo');
        /*@3.NOAJ.128*/
        if (live) {
          swipeAte = 1;
          setTimeout(function () { swipeAte = 0; }, 350);
        }
        if (!live || Math.abs(dx) < SWIPE_GO) return;
        var rec = rowRec(row);
        if (!rec) return;
        var rtl = (document.documentElement.getAttribute('dir') || 'rtl') !== 'ltr';
        var toStart = rtl ? dx > 0 : dx < 0;
        if (toStart) {
          setNotePinned(rec, !rec.pinned);
          saveState('saved', rec.pinned ? L('أُلغي التثبيت', 'Unpinned') : L('ثُبِّتت', 'Pinned'));
          setTimeout(function () { saveState('', ''); }, 1600);
        } else {
          var wasArchived = !!rec.archived;
          setArchived(rec, !wasArchived);
          undoBar(wasArchived
            ? L('أُعيدت من الأرشيف', 'Restored from archive')
            : L('أُرشفت', 'Archived'), function () { setArchived(rec, wasArchived); });
        }
      }, true);
    });
  }

  function undoBar(msg, undo) {
    var old = document.getElementById('na-undo');
    if (old) old.remove();
    var b = document.createElement('div');
    b.className = 'na-undo';
    b.id = 'na-undo';
    b.innerHTML = '<span></span><button type="button">' + esc(L('تراجَع', 'Undo')) + '</button>';
    b.querySelector('span').textContent = msg;
    b.querySelector('button').addEventListener('click', function () {
      b.remove();
      try { undo(); } catch (e) {}
    });
    document.body.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.remove(); }, 5000);
  }

  /*@3.NOAJ.46*/
  function pickedIds() {
    return Object.keys(S.picked || {}).filter(function (k) { return S.picked[k]; });
  }

  function paintPicked() {
    var ids = S.picked || {};
    var rows = els.items ? els.items.querySelectorAll('.na-row') : [];
    for (var i = 0; i < rows.length; i++) {
      var on = !!ids[rows[i].getAttribute('data-uid')];
      if (on) rows[i].setAttribute('data-picked', '1');
      else rows[i].removeAttribute('data-picked');
    }
    var bar = document.getElementById('na-pickbar');
    var n = pickedIds().length;
    if (bar) {
      bar.hidden = !n;
      var lbl = bar.querySelector('[data-role="n"]');
      if (lbl) lbl.textContent = String(n);
    }
  }

  function clearPicked() {
    S.picked = {};
    paintPicked();
  }

  function togglePick(uid) {
    S.picked = S.picked || {};
    if (S.picked[uid]) delete S.picked[uid]; else S.picked[uid] = 1;
    paintPicked();
  }

  function richOf(uid) {
    for (var i = 0; i < S.list.length; i++) {
      if (S.list[i].uid === uid && S.list[i].src === 'rich') return S.list[i];
    }
    return null;
  }

  function onListClick(e) {
    /*@3.NOAJ.127*/
    if (swipeAte) { swipeAte = 0; e.preventDefault(); return; }
    var sw = e.target.closest('[data-role="sweep"],[data-role="sweep-x"]');
    if (sw) {
      e.preventDefault();
      if (sw.getAttribute('data-role') === 'sweep') sweepBlanks();
      else { S.blanksHid = true; renderList(); }
      return;
    }
    var row = e.target.closest('.na-row');
    if (!row) return;
    var uid = row.getAttribute('data-uid');
    var n = null;
    for (var i = 0; i < S.list.length; i++) if (S.list[i].uid === uid) { n = S.list[i]; break; }
    if (!n) return;
    /*@3.NOAJ.47*/
    if (e.ctrlKey || e.metaKey || pickedIds().length) {
      e.preventDefault();
      if (n.src === 'rich') togglePick(uid);
      return;
    }
    if (n.src === 'rich') { openNote(n.id); }
    else if (n.href) location.href = n.href;
  }

  function onQuota(e) {
    var d = (e && e.detail) || {};
    if (!els.quota) return;
    els.quota.hidden = false;
    els.quota.setAttribute('data-warn', '2');
    /*@3.NOAJ.37*/
    var msg = (window.GardenSync && GardenSync.quotaMessage)
      ? GardenSync.quotaMessage(d)
      : L('امتلأت مساحة المزامنة — أرشِف أو صدّر قديمك.',
          'Sync storage is full — archive or export older notes.');
    els.quota.innerHTML = '<div>' + esc(msg) + '</div>';
  }


  function inkCv() { return (overlay && overlay.cv) ? overlay.cv : null; }

  /*@3.NOAJ.61*/
  function inkHidden() { return ui().inkOff === 1; }

  function applyInkHidden() {
    var off = inkHidden();
    var host = document.querySelector('.nov-host');
    if (host) host.setAttribute('data-off', off ? '1' : '0');
    var gwrap = document.querySelector('.gpv');
    if (gwrap) gwrap.setAttribute('data-inkoff', off ? '1' : '0');
    var b = document.getElementById('na-inkhide');
    if (b) {
      b.setAttribute('aria-pressed', off ? 'true' : 'false');
      var ar = off ? 'أظهرِ الرسم' : 'أخفِ الرسم';
      var en = off ? 'Show drawings' : 'Hide drawings';
      b.setAttribute('aria-label', L(ar, en));
      b.setAttribute('data-ar-title', ar);
      b.setAttribute('data-en-title', en);
      b.setAttribute('title', L(ar, en));
      var ic = b.querySelector('i');
      if (ic) ic.className = 'fa-solid ' + (off ? 'fa-eye-slash' : 'fa-eye');
    }
    if (off) {
      if (overlay && overlay.on) overlay.toggle(false);
      if (overlay && overlay.pick && overlay.setPick) overlay.setPick(false);
    }
    if (ribbon && ribbon.setInkHidden) ribbon.setInkHidden(off);
  }

  function toggleInkHidden() {
    uiSet('inkOff', inkHidden() ? 0 : 1);
    applyInkHidden();
  }

  function selectEverything() {
    var n = 0;
    var cv = inkCv();
    /*@3.NOAJ.62*/
    var drawing = !!(overlay && overlay.on);
    if (!drawing && ed) { ed.selectAllBlocks(); n += Object.keys(ed.blockSel()).length; }
    if (!inkHidden() && cv && cv.els.length) {
      if (!overlay.on && !overlay.pick) overlay.setPick(true);
      if (cv.tool !== 'sel' && cv.tool !== 'lasso') cv.setTool('sel');
      cv.selectAll();
      n += cv.selected().length;
    }
    if (ribbon && ed) ribbon.setState(ed.selState());
    return n;
  }

  function anyPick() {
    var cv = inkCv();
    return (ed && Object.keys(ed.blockSel()).length > 0) ||
           !!(cv && cv.selected().length);
  }

  function fullyPicked(node) {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    var txt = (node.textContent || '').replace(/\s+$/, '');
    var got = sel.toString().replace(/\s+$/, '');
    return txt.length > 0 && got.length >= txt.length;
  }

  var _fitQ = 0;
  var _pageRO = null;

  var _growQ = 0;
  function queueGrow() {
    if (_growQ) return;
    _growQ = requestAnimationFrame(function () {
      _growQ = 0;
      growPages();
    });
  }

  function queueFit() {
    if (_fitQ) return;
    _fitQ = requestAnimationFrame(function () {
      _fitQ = 0;
      sizeStage();
      if (overlay && overlay.fit) { try { overlay.fit(); } catch (e) {} }
    });
  }

  var _roomW = -1;
  var _roomRO = null;
  var _covRO = null;

  function queueZoom() {
    var r = Math.round(widthRoom());
    if (!isFinite(r) || r === _roomW) return;
    _roomW = r;
    applyFs();
  }

  function watchPage() {
    if (typeof ResizeObserver !== 'function') return;
    try {
      if (_pageRO) _pageRO.disconnect();
      _pageRO = new ResizeObserver(function () { queueFit(); });
      var page = document.getElementById('na-page');
      var sheet = document.getElementById('na-sheet');
      if (page) _pageRO.observe(page);
      if (sheet) _pageRO.observe(sheet);
      var cov = document.getElementById('na-cover');
      if (cov) _pageRO.observe(cov);
      if (_covRO) _covRO.disconnect();
      _covRO = new ResizeObserver(function () { setCovVar(); growPages(); });
      if (cov) _covRO.observe(cov);
      if (_roomRO) _roomRO.disconnect();
      _roomRO = new ResizeObserver(queueZoom);
      if (els.docBody) _roomRO.observe(els.docBody);
    } catch (e) {}
  }

  function keyOf(e) {
    var I = window.GardenInkInput;
    return (I && I.keyOf) ? I.keyOf(e) : String(e.key || '').toLowerCase();
  }

  /*@3.NOAJ.213*/
  function onPdfKey(e) {
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
    if (t && t.closest && (t.closest('dialog[open]') || t.closest('[contenteditable="true"]'))) return false;
    var mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_' || e.key === '0')) {
      e.preventDefault();
      if (e.key === '0') resetFs(); else stepFs((e.key === '-' || e.key === '_') ? -1 : 1);
      return true;
    }
    /*@3.NOAJ.225*/
    /*@3.NOAJ.230*/
    if (e.key === 'Escape' && pdfUi.focused && pdfUi.focused()) {
      e.preventDefault();
      pdfUi.unfocus();
      return true;
    }
    if (mod && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
      if (pdfUi.selectPage && pdfUi.selectPage()) { e.preventDefault(); return true; }
      return false;
    }
    if (mod) return false;
    var paged = pdfUi.flow() === 'page';
    if (e.key === 'Home') { e.preventDefault(); pgGoto(1); return true; }
    if (e.key === 'End') { e.preventDefault(); pgGoto(pgTotal()); return true; }
    if (e.key === 'PageDown') { e.preventDefault(); pdfUi.step(1); return true; }
    if (e.key === 'PageUp') { e.preventDefault(); pdfUi.step(-1); return true; }
    if (!paged) return false;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); pdfUi.step(1); return true;
    }
    if (e.key === 'ArrowUp') { e.preventDefault(); pdfUi.step(-1); return true; }
    return false;
  }

  function onDocKey(e) {
    if (e.defaultPrevented) return;
    if (pdfOn()) { onPdfKey(e); return; }
    if (!ed || !edId) return;
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (t && t.closest && t.closest('dialog[open]')) return;
    var mod = e.ctrlKey || e.metaKey;
    var k = keyOf(e);

    if (mod && !e.shiftKey && k === 'z') {
      e.preventDefault();
      if (hist) hist.undo(); else ed.doUndo();
      return;
    }
    if (mod && (k === 'y' || (e.shiftKey && k === 'z'))) {
      e.preventDefault();
      if (hist) hist.redo(); else ed.doRedo();
      return;
    }
    if (mod && (k === '+' || k === '=' || k === '-' || k === '_' || k === '0')) {
      e.preventDefault();
      if (k === '0') resetFs(); else stepFs((k === '-' || k === '_') ? -1 : 1);
      return;
    }
    /*@3.NOAJ.75*/
    if (mod && k === 'a') {
      /*@3.NOAJ.77*/
      var ce = t && t.closest ? t.closest('[contenteditable="true"]') : null;
      var txt = ce ? (ce.textContent || '').trim() : '';
      if (ce && txt && !fullyPicked(ce)) return;
      e.preventDefault();
      /*@3.NOAJ.87*/
      var bidN = ce && ce.closest ? ce.closest('[data-bid]') : null;
      if (ce && txt && bidN && !ed.blockSel()[bidN.getAttribute('data-bid')]) {
        ed.toggleBlockSel(bidN.getAttribute('data-bid'), true);
        try { ce.blur(); } catch (eB) {}
        try { window.getSelection().removeAllRanges(); } catch (eS) {}
        if (ribbon) ribbon.setState(ed.selState());
        return;
      }
      selectEverything();
      return;
    }
    /*@3.NOAJ.38*/
    if (e.key === 'Escape' && !mod) {
      var cvE = inkCv();
      if (ed.dropProv && ed.dropProv()) { e.preventDefault(); return; }
      /*@3.NOAJ.94*/
      var ceEsc = t && t.closest ? t.closest('[contenteditable="true"]') : null;
      if (ceEsc) {
        var bidEsc = ceEsc.closest('[data-bid]');
        e.preventDefault();
        try { ceEsc.blur(); } catch (eB2) {}
        try { window.getSelection().removeAllRanges(); } catch (eS2) {}
        if (bidEsc && ed.blockAt && ed.blockAt(bidEsc.getAttribute('data-bid'))) {
          ed.toggleBlockSel(bidEsc.getAttribute('data-bid'), true);
          if (ribbon) ribbon.setState(ed.selState());
        }
        return;
      }
      /*@3.NOAJ.88*/
      if (ed._selMode || (overlay && overlay.pick)) {
        e.preventDefault();
        ed.clearBlockSel();
        if (cvE && cvE.deselect) cvE.deselect();
        ed.setSelectMode(false);
        if (overlay && overlay.setPick) overlay.setPick(false);
        if (ribbon) ribbon.setState(ed.selState());
        return;
      }
      if (anyPick()) {
        e.preventDefault();
        ed.clearBlockSel();
        if (cvE && cvE.deselect) cvE.deselect();
        if (ribbon) ribbon.setState(ed.selState());
        return;
      }
      if (overlay && overlay.on) {
        e.preventDefault();
        var stillOn = overlay.toggle();
        if (ribbon) ribbon.setDrawing(stillOn);
        return;
      }
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
      if (!anyPick()) return;
      var ce2 = t && t.closest ? t.closest('[contenteditable="true"]') : null;
      if (ce2 && !window.getSelection().isCollapsed) return;
      e.preventDefault();
      if (ribbon) ribbon.clipAct('erase');
      return;
    }
    /*@3.NOAJ.89*/
    if (mod && (k === 'c' || k === 'x') && anyPick()) {
      var ceK = t && t.closest ? t.closest('[contenteditable="true"]') : null;
      if (ceK && !window.getSelection().isCollapsed) return;
      e.preventDefault();
      if (ribbon) ribbon.clipAct(k === 'c' ? 'copy' : 'cut');
      return;
    }
    if (mod && k === 'v') {
      var ceP = t && t.closest ? t.closest('[contenteditable="true"]') : null;
      if (ceP) return;
      var cvP = inkCv();
      /*@3.NOAJ.179*/
      var hasI = !!(cvP && cvP.clip && cvP.clip.length);
      if (!hasI) return;
      e.preventDefault();
      if (ribbon) ribbon.clipAct('paste');
      return;
    }
  }

  /*@3.NOAJ.115*/
  var idxSynced = false;
  var lastRecon = 0;
  var reconRetries = 0;
  function runReconcile(authority) {
    if (!window.GardenNotesSync) return;
    lastRecon = Date.now();
    window.GardenNotesSync.reconcile({
      liveIds: idxRead().map(function (x) { return x.id; }),
      tombs: readJSON(LS_TOMB, {}),
      authority: !!authority
    }).then(function (r) {
      if (r && r.ok && r.failedPulls > 0 && reconRetries < 3) {
        reconRetries++;
        setTimeout(function () { runReconcile(authority); }, 30000 * reconRetries);
      } else if (r && r.ok) {
        reconRetries = 0;
      }
    });
  }

  function init() {
    els.app = document.getElementById('na');
    if (!els.app) return;
    /*@3.NOAJ.98*/
    if (window.GardenTint && GardenTint.fontSheet) { try { GardenTint.fontSheet(); } catch (eF) {} }
    warmSheetFont(0);
    /*@3.NOAJ.191*/
    if (window.GardenNotesFind) {
      GardenNotesFind.bind({
        editor: function () { return ed; },
        /*@3.NOAJ.224*/
        pdf: function () { return pdfOn() ? pdfUi.find() : null; }
      });
    }
    els.tree = document.getElementById('na-tree');
    els.quota = document.getElementById('na-quota');
    els.items = document.getElementById('na-items');
    els.find = document.getElementById('na-find');
    var vmb = document.getElementById('na-vm');
    if (vmb) vmb.addEventListener('click', function () {
      uiSet('vm', vmode() === 'cards' ? 'rows' : 'cards');
      syncVm();
      renderList();
    });
    els.vname = document.getElementById('na-view-name');
    els.count = document.getElementById('na-count');
    els.docTitle = document.getElementById('na-doc-title');
    els.docBody = document.getElementById('na-doc-body');
    els.origin = document.getElementById('na-doc-origin');
    els.save = document.getElementById('na-save');
    els.saveDot = document.getElementById('na-savedot');
    els.naDel = document.getElementById('na-del');
    els.naPin = document.getElementById('na-pin');
    els.naMove = document.getElementById('na-move-btn');
    els.naPage = document.getElementById('na-page-btn');
    els.naPdf = document.getElementById('na-export');
    els.ribbonHost = document.getElementById('na-ribbon');
    buildPgNav();
    document.addEventListener('keydown', onDocKey);
    syncToneClass();
    try {
      new MutationObserver(syncToneClass).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme'] });
    } catch (e) {}
    var zi = document.getElementById('na-zoom-in');
    if (zi) zi.addEventListener('click', function () { stepFs(1); });
    var zo = document.getElementById('na-zoom-out');
    if (zo) zo.addEventListener('click', function () { stepFs(-1); });
    var zl = document.getElementById('na-zoom-lbl');
    if (zl) zl.addEventListener('click', resetFs);
    document.addEventListener('wheel', function (e) {
      if (!edId || !(e.ctrlKey || e.metaKey)) return;
      if (!ed && !pdfOn()) return;
      if (!e.target.closest || !e.target.closest('.na-doc-body')) return;
      e.preventDefault();
      stepFs(e.deltaY < 0 ? 1 : -1, { cx: e.clientX, cy: e.clientY });
    }, { passive: false });
    if (els.ribbonHost && window.GardenNotesRibbon) {
      ribbon = GardenNotesRibbon.mount(els.ribbonHost, {
        onDraw: function () {
          if (!overlay) return;
          /*@3.NOAJ.64*/
          if (inkHidden()) { uiSet('inkOff', 0); applyInkHidden(); }
          if (overlay.pick) {
            if (ed) ed.setSelectMode(false);
            overlay.setPick(false);
          }
          var on = overlay.toggle();
          if (on) autoCollapse();
          /*@3.NOAJ.39*/
          if (on && ed) {
            ed.closeMenu();
            ed.dropAllEmptyFree();
            var ae = document.activeElement;
            if (ae && ae.blur && els.docBody && els.docBody.contains(ae)) ae.blur();
          }
          ribbon.setDrawing(on);
        },
        overlay: function () { return overlay; }
      });
      els.ribbonHost.hidden = true;
    }
    buildPageDlg();
    bindPageSliders();
    var impFile = document.getElementById('na-imp-file');
    if (impFile) {
      impFile.addEventListener('change', function () {
        if (impFile.files && impFile.files[0]) runImport(impFile.files[0]);
        impFile.value = '';
      });
    }
    if (els.naPage) els.naPage.addEventListener('click', openPageDlg);
    if (els.naPdf) els.naPdf.addEventListener('click', openExport);
    var xDlg = document.getElementById('na-exp');
    if (xDlg) xDlg.addEventListener('click', function (e) {
      /*@3.NOAJ.142*/
      var tb = e.target.closest('[data-xtab]');
      if (tb) { setExpTab(tb.getAttribute('data-xtab')); return; }
      var im = e.target.closest('[data-imp]');
      if (im) {
        if (im.getAttribute('data-imp') === 'md') {
          try { xDlg.close(); } catch (eI) {}
          importMarkdown();
        } else if (impFile) {
          impFile.click();
        }
        return;
      }
      var sc = e.target.closest('[data-scope]');
      if (sc) { EXP_SCOPE = sc.getAttribute('data-scope'); syncExport(); return; }
      var rg = e.target.closest('[data-rng]');
      if (rg) { EXP_RNG.on = rg.getAttribute('data-rng') === 'pick'; syncRange(); return; }
      var ft = e.target.closest('[data-fmt]');
      if (ft && !ft.disabled) runExport(ft.getAttribute('data-fmt'));
    });

    var expDlg = document.getElementById('na-exp');
    if (expDlg) {
      expDlg.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || (t.id !== 'na-rng-a' && t.id !== 'na-rng-b')) return;
        var v = parseInt(t.value, 10);
        if (!isFinite(v)) return;
        if (t.id === 'na-rng-a') EXP_RNG.a = v; else EXP_RNG.b = v;
      });
      expDlg.addEventListener('change', function (e) {
        var t = e.target;
        if (t && (t.id === 'na-rng-a' || t.id === 'na-rng-b')) syncRange();
      });
    }

    /*@3.NOAJ.153*/
    var fillLinkPick = function () {
      var sel = document.querySelector('#na-link [data-role="lpick"]');
      if (!sel) return;
      var html = '<option value="" data-gs-name-ar="\u0631\u0627\u0628\u0637\u064c \u062e\u0627\u0631\u062c\u064a\u0651" ' +
                 'data-gs-name-en="External link">' + esc(L('\u0631\u0627\u0628\u0637\u064c \u062e\u0627\u0631\u062c\u064a\u0651 (\u0627\u0643\u062a\u0628\u0647 \u0628\u0646\u0641\u0633\u0643)',
                                              'External link (type it below)')) + '</option>';
      var anc = (ed && ed.anchors) ? ed.anchors() : [];
      if (anc.length) {
        html += '<optgroup label="' + esc(L('\u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629', 'In this note')) + '">';
        anc.forEach(function (a) {
          var pad = new Array(Math.max(0, (a.lv || 1) - 1) + 1).join('\u2003');
          html += '<option value="#' + esc(a.a) + '">' + pad + esc(a.t) + '</option>';
        });
        html += '</optgroup>';
      }
      var others = idxRead().filter(function (r) { return r.id !== edId && !r.a; })
        .sort(function (x, y) { return (y.updated_at || 0) - (x.updated_at || 0); }).slice(0, 60);
      if (others.length) {
        html += '<optgroup label="' + esc(L('\u0645\u0644\u0627\u062d\u0638\u0627\u062a\u064f\u0643', 'Your notes')) + '">';
        others.forEach(function (r) {
          html += '<option value="note:' + esc(r.id) + '">' +
                  esc(r.t || L('\u0628\u0644\u0627 \u0639\u0646\u0648\u0627\u0646', 'Untitled')) + '</option>';
        });
        html += '</optgroup>';
      }
      sel.innerHTML = html;
      sel.value = '';
      if (window.GardenSelect && GardenSelect.enhance) {
        try { GardenSelect.enhance(sel.parentNode || document); } catch (e) {}
      }
    };

    /*@3.NOAJ.154*/
    var rDlg = document.getElementById('na-remind');
    var rBtn = document.getElementById('na-remind-btn');
    if (rDlg) {
      var rIn = rDlg.querySelector('[data-role="rwhen"]');
      var openRemind = function () {
        if (!edId) return;
        var rec = idxFind(edId);
        if (rIn) rIn.value = (rec && rec.r) ? String(rec.r).slice(0, 16) : '';
        var w = rDlg.querySelector('[data-role="rwarn"]');
        if (w) { w.textContent = ''; w.hidden = true; }
        try { rDlg.showModal(); } catch (e) {}
      };
      if (rBtn) rBtn.addEventListener('click', openRemind);
      rDlg.querySelector('[data-role="rok"]').addEventListener('click', function () {
        var v = (rIn && rIn.value || '').trim();
        var w = rDlg.querySelector('[data-role="rwarn"]');
        if (!v) {
          if (w) { w.textContent = L('اختَرْ موعداً أوّلاً، أو امسحِ التنبيه.',
                                     'Pick a time first, or clear the reminder.'); w.hidden = false; }
          return;
        }
        setRemind(edId, v);
        try { rDlg.close(); } catch (e) {}
        saveState('saved', L('ثُبِّت التنبيه', 'Reminder set'));
      });
      rDlg.querySelector('[data-role="rclear"]').addEventListener('click', function () {
        setRemind(edId, '');
        try { rDlg.close(); } catch (e) {}
        saveState('saved', L('مُسِح التنبيه', 'Reminder cleared'));
      });
    }

    var lDlg = document.getElementById('na-link');
    if (lDlg) {
      /*@3.NOAJ.59*/
      var linkWarn = function (msg) {
        var w = lDlg.querySelector('[data-role="lwarn"]');
        if (!w) return;
        w.textContent = msg || '';
        w.hidden = !msg;
      };
      var applyLink = function () {
        var inp = lDlg.querySelector('[data-role="url"]');
        var lab = lDlg.querySelector('[data-role="ltext"]');
        var raw = (inp && inp.value || '').trim();
        var t = (lab && lab.value || '').trim();
        var ctx = lDlg.__ctx || null;
        var B0 = window.GardenNotesBlocks;
        var Md = window.GardenNotesMd;
        var v = raw
          ? ((raw.charAt(0) === '#' || /^note:/i.test(raw)) && Md
              ? Md.anyUrl(raw)
              : (B0 && B0.normUrl ? B0.normUrl(raw) : raw))
          : '';
        if (raw && !v) {
          linkWarn(L('عنوانٌ غيرُ مقبول — اكتبْ عنواناً مثل example.com أو https://example.com',
                     'Not a usable address — write something like example.com or https://example.com'));
          if (inp) inp.focus();
          return;
        }
        if (!ed) { try { lDlg.close(); } catch (e0) {} return; }
        var done = ed.applyLink ? ed.applyLink(ctx, v, t) : ed.exec('link', v);
        if (!done) {
          linkWarn(L('ضعِ المؤشّرَ في نصٍّ أوّلاً، أو حدّدْ كلمةً ليصير رابطاً.',
                     'Put the caret in some text first, or select a word to link.'));
          return;
        }
        linkWarn('');
        try { lDlg.close(); } catch (e1) {}
      };
      lDlg.addEventListener('garden:notesLinkOpen', fillLinkPick);
      /*@3.NOAJ.155*/
      var pick = lDlg.querySelector('[data-role="lpick"]');
      if (pick) pick.addEventListener('change', function () {
        if (!pick.value) return;
        var inp2 = lDlg.querySelector('[data-role="url"]');
        if (inp2) { inp2.value = pick.value; inp2.focus(); }
        linkWarn('');
      });
      lDlg.querySelector('[data-role="ok"]').addEventListener('click', applyLink);
      lDlg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (!e.target.closest('[data-role="url"], [data-role="ltext"]')) return;
        e.preventDefault(); applyLink();
      });
    }

    var u = ui();
    if (u.view && u.view.k) S.view = u.view;
    docEmpty();
    S.width = (WIDTHS.indexOf(u.width) >= 0) ? u.width : 'a4';
    applyWidth();
    setAcc(u.acc === 'list' ? 'list' : 'folders');
    applyPanelW();
    bindPanelResize();
    bindShare();
    setPanel(true);
    setReading(false);
    setPinned(panelPinned());
    /*@3.NOAJ.45*/
    var pinBtn = document.getElementById('na-pin-panel');
    if (pinBtn) pinBtn.addEventListener('click', function () { setPinned(!panelPinned()); });
    if (els.docBody) {
      var wantFold = 0;
      var foldLater = function () {
        if (!wantFold) return;
        wantFold = 0;
        setTimeout(function () { autoCollapse(); }, 0);
      };
      els.docBody.addEventListener('pointerdown', function () { wantFold = 1; }, true);
      window.addEventListener('pointerup', foldLater, true);
      window.addEventListener('pointercancel', foldLater, true);
      /*@3.NOAJ.90*/
      els.docBody.addEventListener('click', function (e) {
        if (e.target !== els.docBody || !ed) return;
        var cvD = inkCv();
        ed.clearBlockSel();
        if (ed._selMode) ed.setSelectMode(false);
        if (cvD && cvD.deselect) cvD.deselect();
        if (overlay && overlay.pick && overlay.setPick) overlay.setPick(false);
        if (ribbon) ribbon.setState(ed.selState());
      });
    }

    /*@3.NOAJ.152*/
    document.addEventListener('pointerdown', function (e) {
      if (!ed || !ribbon) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (ed.root.contains(t)) return;
      if (t.closest('.nr, .ne-menu, .ne-selhint, .nov-host, .nc-wrap, dialog[open], .nd, .gsf')) return;
      setTimeout(function () { if (ed && ribbon) ribbon.setState(ed.selState()); }, 0);
    }, true);

    els.tree.addEventListener('click', onTreeClick);
    els.items.addEventListener('click', onListClick);
    /*@3.NOAJ.55*/
    els.items.addEventListener('contextmenu', function (e) {
      var row = e.target.closest('.na-row');
      if (!row) return;
      var uid = row.getAttribute('data-uid');
      if (!richOf(uid)) return;
      e.preventDefault();
      openCtx(e.clientX, e.clientY, uid);
    });
    if (els.tree) {
      els.tree.addEventListener('contextmenu', function (e) {
        var f = e.target.closest('.na-f');
        if (!f) return;
        e.preventDefault();
        openFolderCtx(e.clientX, e.clientY, f.getAttribute('data-fid'));
      });
    }
    els.items.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !pickedIds().length) return;
      e.preventDefault();
      clearPicked();
    });
    bindNoteDrag();

    /*@3.NOAJ.13*/
    document.addEventListener('garden:languageChanged', function () {
      renderRail();
      renderList();
      renderQuota();
      /*@3.NOAJ.111*/
      syncTitleDir();
      syncTitleWord();
    });

    var nw = document.getElementById('na-new');
    if (nw) nw.addEventListener('click', function (e) { e.stopPropagation(); newMenu(nw); });
    var nw2 = document.getElementById('na-new-2');
    if (nw2) nw2.addEventListener('click', function () { createNote(); });
    /*@3.NOAJ.71*/
    var np = document.getElementById('na-new-pdf');
    if (np) np.addEventListener('click', function () { createPdf(); });
    bindDrop();

    /*@3.NOAJ.78*/
    if (els.docBody) els.docBody.addEventListener('click', function (e) {
      if (edId) return;
      if (e.target.closest && e.target.closest('.na-empty-new')) createNote();
    });
    var top = document.querySelector('.na-doc-top');
    if (top) top.addEventListener('click', function (e) {
      if (edId) return;
      if (e.target.closest('button')) return;
      createNote();
    });

    var back = document.getElementById('na-back');
    if (back) back.addEventListener('click', function () { closeNote(); });

    /*@3.NOAJ.101*/
    els.app.setAttribute('data-bars', '1');
    var barsBtn = document.getElementById('na-bars');
    if (barsBtn) barsBtn.addEventListener('click', function () {
      var two = els.app.getAttribute('data-bars') === '2';
      els.app.setAttribute('data-bars', two ? '1' : '2');
      barsBtn.setAttribute('aria-pressed', two ? 'false' : 'true');
    });

    if (els.docBody) {
      var sw = null;
      els.docBody.addEventListener('pointerdown', function (e) {
        if (!isPhone() || e.pointerType !== 'touch') { sw = null; return; }
        var rtl = (document.documentElement.getAttribute('dir') || 'rtl') !== 'ltr';
        var vw = window.innerWidth;
        var near = rtl ? (e.clientX >= vw - 28) : (e.clientX <= 28);
        sw = near ? { x: e.clientX, y: e.clientY, rtl: rtl } : null;
      }, true);
      els.docBody.addEventListener('pointermove', function (e) {
        if (!sw) return;
        var dx = e.clientX - sw.x, dy = Math.abs(e.clientY - sw.y);
        var inward = sw.rtl ? -dx : dx;
        if (inward > 44 && dy < 40) { sw = null; setMob('list'); setPanel(true); }
        else if (dy >= 60 || inward < -20) sw = null;
      }, true);
      ['pointerup', 'pointercancel'].forEach(function (evn) {
        els.docBody.addEventListener(evn, function () { sw = null; }, true);
      });
    }

    setMob(edId ? 'doc' : 'list');

    var scrim = document.getElementById('na-scrim');
    if (scrim) scrim.addEventListener('click', function () { setPanel(false); });

    var gl = document.getElementById('na-go-list');
    if (gl) gl.addEventListener('click', function () { showPanel(S.acc || 'list'); });
    var gs = document.getElementById('na-go-search');
    if (gs) gs.addEventListener('click', function () {
      /*@3.NOAJ.212*/
      var fb2 = document.getElementById('na-find-btn');
      if (edId && fb2 && !fb2.disabled) { setMob('doc'); fb2.click(); return; }
      if (isPhone()) setMob('list');
      setAcc('list'); setPanel(true);
      setTimeout(function () { if (els.find) els.find.focus(); }, 60);
    });
    var pv = document.getElementById('na-pdf-view');
    if (pv) pv.addEventListener('click', function () {
      if (!pdfOn()) return;
      var v = PDF_VIEWS[(pdfViewIx() + 1) % PDF_VIEWS.length];
      pdfUi.setView(v.m, v.o);
    });
    var pf = document.getElementById('na-pdf-flow');
    if (pf) pf.addEventListener('click', function () {
      if (!pdfOn()) return;
      pdfUi.setFlow(pdfUi.flow() === 'page' ? 'cont' : 'page');
    });
    ['na-pdf-draw', 'na-draw-top'].forEach(function (k) {
      var b = document.getElementById(k);
      if (b) b.addEventListener('click', function () { pdfDraw(); });
    });
    var ps = document.getElementById('na-pdf-side');
    if (ps) ps.addEventListener('click', function () {
      if (!pdfOn()) return;
      pdfUi.setSide(pdfUi.side() === 'rtl' ? 'ltr' : 'rtl');
      paintSideBtn();
    });
    var wb = document.getElementById('na-width');
    if (wb) wb.addEventListener('click', function () {
      /*@3.NOAJ.207*/
      if (pdfOn()) {
        var zm2 = pdfUi.zoomMode();
        if (zm2 === 'page') pdfUi.refit('fit');
        else if (zm2 === 'fit') pdfUi.setScale(1);
        else pdfUi.refit('page');
        applyFs();
        return;
      }
      setWidth(nextWidth());
    });

    var mb = document.getElementById('na-more');
    if (mb) mb.addEventListener('click', function (e) {
      e.stopPropagation();
      if (moreMenu) closeMore(); else openMore(mb);
    });
    document.addEventListener('click', function (e) {
      if (moreMenu && !e.target.closest('.ne-menu') && !e.target.closest('#na-more')) closeMore();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && moreMenu) closeMore();
    });

    var panel = document.getElementById('na-panel');
    if (panel) panel.addEventListener('click', function (e) {
      var h = e.target.closest('[data-acc]');
      /*@3.NOAJ.185*/
      if (h) {
        var wnt = h.getAttribute('data-acc');
        setAcc(S.acc === wnt ? (wnt === 'list' ? 'folders' : 'list') : wnt);
      }
    });
    if (els.naDel) els.naDel.addEventListener('click', function () {
      if (edId) confirmDelete(edId, (els.docTitle && els.docTitle.value) || '');
    });
    if (els.naPin) els.naPin.addEventListener('click', togglePin);
    if (els.naMove) els.naMove.addEventListener('click', moveNote);

    /*@3.NOAJ.1*/
    var cDlg = document.getElementById('na-confirm');
    if (cDlg) {
      cDlg.querySelector('[data-role="ok"]').addEventListener('click', function () {
        var id = pendDelete;
        var many = pendMany;
        var fid = pendFolder;
        var mk = pendMake;
        pendDelete = null;
        pendMany = null;
        pendFolder = null;
        pendMake = null;
        try { cDlg.close(); } catch (e) {}
        /*@3.NOAJ.151*/
        if (mk) { resetConfirm(); createNamed(mk); return; }
        if (fid) {
          folderDrop(fid);
          if (S.view.k === 'folder' && S.view.id === fid) {
            S.view = { k: 'recent' };
            uiSet('view', S.view);
          }
          reload({ keepOpen: true });
          return;
        }
        /*@3.NOAJ.54*/
        if (many && many.length) {
          var Sy = window.GardenNotesSync;
          many.forEach(function (mid) {
            idxDrop(mid);
            if (Sy) Sy.remove(mid);
            else if (window.GardenNotesStore) window.GardenNotesStore.delDoc(mid);
          });
          clearPicked();
          if (edId && many.indexOf(edId) > -1) {
            dropEditor(); edId = null; docEmpty();
            history.replaceState(null, '', location.pathname);
            setReading(false); showPanel('list');
          }
          reload();
          return;
        }
        if (id) doDelete(id);
      });
      cDlg.addEventListener('cancel', function () { pendDelete = null; pendMany = null; pendFolder = null; pendMake = null; resetConfirm(); });
      cDlg.addEventListener('click', function (e) {
        if (e.target.closest('form[method="dialog"]')) { pendDelete = null; pendMany = null; }
      });
    }
    var fDlg = document.getElementById('na-folder');
    if (fDlg) {
      fDlg.querySelector('[data-role="ok"]').addEventListener('click', commitFolder);
      var fIn = fDlg.querySelector('[data-role="name"]');
      if (fIn) fIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commitFolder(); }
      });
      var fDel = fDlg.querySelector('[data-role="del"]');
      if (fDel) fDel.addEventListener('click', function () { deleteFolderStep(fDel); });
      fDlg.addEventListener('close', function () { fEdit = null; });
    }
    var mDlg = document.getElementById('na-move');
    if (mDlg) mDlg.querySelector('[data-role="list"]').addEventListener('click', onMovePick);

    if (els.find) {
      els.find.addEventListener('input', function () {
        clearTimeout(findT);
        findT = setTimeout(function () { S.q = els.find.value; renderList(); }, 140);
      });
    }

    if (els.docTitle) {
      els.docTitle.addEventListener('input', function () {
        clearTimeout(edSaveT);
        saveState('saving', L('يُحفظ…', 'Saving…'));
        /*@3.NOAJ.28*/
        var forId = edId;
        var text = els.docTitle.value.trim();
        edSaveT = setTimeout(function () {
          if (!forId) return;
          var rec = idxFind(forId);
          if (rec) { rec.t = text; rec.updated_at = Date.now(); idxPut(rec); }
          saveState('saved', L('محفوظة', 'Saved'));
          setTimeout(function () {
            if (els.save && els.save.getAttribute('data-s') === 'saved') saveState('', '');
          }, 1800);
          renderList();
        }, 600);
      });
    }

    bindDocPinch();

    var rzT = null;
    window.addEventListener('resize', function () {
      clearTimeout(rzT);
      rzT = setTimeout(function () {
        applyWidth();
        if (overlay && overlay.fit) { try { overlay.fit(); } catch (e) {} }
      }, 120);
    });

    window.addEventListener('beforeunload', function () {
      if (ed && !leaveProvisional(edId, ed.doc)) { try { ed.save(); } catch (e) {} }
    });
    window.addEventListener('garden:syncQuota', onQuota);
    window.addEventListener('garden:notesQuota', onQuota);
    window.addEventListener('garden:syncCompleted', function () {
      reload({ keepOpen: true });
      /*@3.NOAJ.114*/
      idxSynced = true;
      runReconcile(true);
    });
    window.addEventListener('garden:notesReconciled', function () {
      reload({ keepOpen: true });
      scanBlanks();
    });
    window.addEventListener('garden:notesPulled', function (e) {
      /*@3.NOAJ.120*/
      if (e.detail && e.detail.id === edId && !ed) openNote(edId, { remount: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRecon > 30000) runReconcile(idxSynced);
    });
    window.addEventListener('garden:notesPushed', function (e) {
      if (!e.detail || e.detail.id !== edId) return;
      saveState('saved', L('مُزامَنة', 'Synced'));
      setTimeout(function () {
        if (els.save && els.save.getAttribute('data-s') === 'saved') saveState('', '');
      }, 1800);
    });
    window.addEventListener('garden:notesPushFailed', function (e) {
      if (!e.detail || e.detail.id !== edId) return;
      if (e.detail.local) {
        saveState('saved', L('محفوظة محليّاً', 'Saved locally'));
        setTimeout(function () {
          if (els.save && els.save.getAttribute('data-s') === 'saved') saveState('', '');
        }, 1800);
      } else if (!e.detail.quota) {
        saveState('pend', L('بانتظار الرفع', 'Waiting to upload'));
      }
    });

    reload();

    var M = window.GardenNotesModel;
    if (M && M.ready) M.ready().then(function () { reload({ keepOpen: true }); });

    try {
      var qs = new URLSearchParams(location.search);
      var sid = qs.get('s');
      if (sid) { openShared(sid); return; }
      var adopt = qs.get('adopt');
      var wanted = qs.get('id');
      if (adopt) {
        history.replaceState(null, '', location.pathname);
        adoptQuick(adopt);
      } else if (wanted && idxFind(wanted)) openNote(wanted);
      else if (qs.get('new') === '1') createNote();
      /*@3.NOAJ.202*/
      else if (!idxRead().length) createNote();
    } catch (e) {}

    runReconcile(false);
    setTimeout(scanBlanks, 1500);
  }

  window.GardenNotesApp = {
    editor: function () { return ed; },
    pdfMeta: pdfMeta,
    reload: reload,
    open: openNote,
    create: createNote,
    state: S,
    folders: foldersRead
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
