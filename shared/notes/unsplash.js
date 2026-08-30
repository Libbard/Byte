;(function () {
  'use strict';

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

  function base() {
    var E = window.GardenEndpoints;
    return (E && E.unsplash) || '';
  }

  var dlg = null, onPick = null, page = 1, term = '', busy = false, more = true;

  /*@3.NOUJ.1*/
  function build() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'gsf gsf--wide na-dlg na-uns';
    dlg.id = 'na-uns';
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x">' +
      '<button class="gsf-close" type="submit" aria-label="' + esc(L('إغلاق', 'Close')) + '"' +
      ' data-ar-title="إغلاق" data-en-title="Close">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body">' +
      '<div class="gsf-head">' +
      '<h2 class="gsf-title">' + esc(L('صورةٌ من أنسبلاش', 'A photo from Unsplash')) + '</h2>' +
      '<p class="gsf-sub">' +
      esc(L('اكتبْ كلمةً بالإنجليزيّة — الصورةُ تبقى على أنسبلاش ولا تُحفَظ عندنا.',
            'Type a word in English — the photo stays on Unsplash and is not stored here.')) +
      '</p></div>' +
      '<form class="na-uns-bar" data-role="form">' +
      '<input class="gsf-in" data-role="q" type="search" dir="ltr" spellcheck="false"' +
      ' placeholder="mountain, library, code…"' +
      ' aria-label="' + esc(L('كلمةُ البحث', 'Search term')) + '">' +
      '<button class="gsf-btn gsf-btn--go" type="submit">' +
      esc(L('ابحثْ', 'Search')) + '</button>' +
      '</form>' +
      '<p class="na-uns-note" data-role="note" role="status"></p>' +
      '<div class="na-uns-grid" data-role="grid"></div>' +
      '<button type="button" class="gsf-btn na-uns-more" data-role="more" hidden>' +
      esc(L('المزيد', 'Load more')) + '</button>' +
      '</div>';
    document.body.appendChild(dlg);

    dlg.querySelector('[data-role="form"]').addEventListener('submit', function (e) {
      e.preventDefault();
      term = (dlg.querySelector('[data-role="q"]').value || '').trim();
      page = 1; more = true;
      dlg.querySelector('[data-role="grid"]').innerHTML = '';
      load();
    });
    dlg.querySelector('[data-role="more"]').addEventListener('click', function () {
      page += 1;
      load();
    });
    dlg.querySelector('[data-role="grid"]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-uns]');
      if (!b) return;
      var p = null;
      try { p = JSON.parse(b.getAttribute('data-uns')); } catch (x) { p = null; }
      if (!p) return;
      /*@3.NOUJ.2*/
      if (p.dl && base()) {
        try { fetch(base() + '/d?u=' + encodeURIComponent(p.dl), { mode: 'cors' }); } catch (x2) {}
      }
      if (onPick) onPick(p);
      try { dlg.close(); } catch (x3) {}
    });
    return dlg;
  }

  function note(msg, kind) {
    var n = dlg.querySelector('[data-role="note"]');
    n.textContent = msg || '';
    n.setAttribute('data-kind', kind || '');
  }

  /*@3.NOUJ.3*/
  function load() {
    if (busy || !more) return;
    var b = base();
    if (!b) { note(L('خدمةُ الصور غيرُ مضبوطة.', 'The photo service is not configured.'), 'err'); return; }
    busy = true;
    note(L('يُبحث…', 'Searching…'), '');
    var url = b + (term ? ('/s?q=' + encodeURIComponent(term) + '&') : '/r?') + 'page=' + page;
    fetch(url, { mode: 'cors' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (d) {
      busy = false;
      var list = (d && d.photos) || [];
      if (!list.length && page === 1) {
        note(L('لا نتائج — جرّبْ كلمةً أخرى بالإنجليزيّة.',
               'Nothing found — try another English word.'), '');
        more = false;
        return;
      }
      if (!list.length) { more = false; }
      note('', '');
      paint(list);
    })['catch'](function () {
      busy = false;
      note(L('تعذّر الوصولُ إلى خدمة الصور — تحقّقْ من اتّصالك.',
             'The photo service is unreachable — check your connection.'), 'err');
    });
  }

  function paint(list) {
    var grid = dlg.querySelector('[data-role="grid"]');
    var h = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var meta = JSON.stringify({ url: p.full, alt: p.alt, by: p.by, byLink: p.byLink, dl: p.dl });
      h += '<figure class="na-uns-c">' +
        '<button type="button" class="na-uns-b" data-uns="' + esc(meta) + '"' +
        ' style="background:' + esc(p.color || '#333') + '"' +
        ' aria-label="' + esc(p.alt || L('صورة', 'Photo')) + '">' +
        '<img src="' + esc(p.thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
        '</button>' +
        '<figcaption class="na-uns-by">' +
        (p.byLink
          ? '<a href="' + esc(p.byLink) + '" target="_blank" rel="noopener noreferrer nofollow">' +
            esc(p.by) + '</a>'
          : esc(p.by)) +
        '</figcaption></figure>';
    }
    grid.insertAdjacentHTML('beforeend', h);
    dlg.querySelector('[data-role="more"]').hidden = !more;
  }

  function open(cb) {
    build();
    onPick = cb || null;
    page = 1; more = true; busy = false;
    dlg.querySelector('[data-role="grid"]').innerHTML = '';
    note('', '');
    try { dlg.showModal(); } catch (e) {}
    var q = dlg.querySelector('[data-role="q"]');
    setTimeout(function () { if (q) q.focus(); }, 40);
    if (!term) load();
  }

  window.GardenUnsplash = { open: open };
})();
