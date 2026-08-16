/*@3.DUCJ.1*/
(function () {
  'use strict';

  if (window.GardenDue) return;

  /*@3.DUCJ.2*/
  var self = document.currentScript;
  var ROOT = (self && self.src) ? self.src.replace(/shared\/due-cards\.js.*$/, '') : '';

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') !== 'en'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /*@3.DUCJ.3*/
  function nOf(n, ar, en) {
    if (!isAr()) return n + ' ' + (n === 1 ? en[0] : en[1]);
    if (n === 1) return ar[0];
    if (n === 2) return ar[1];
    return n + ' ' + (n <= 10 ? ar[2] : ar[0]);
  }

  /*@3.DUCJ.4*/
  function placeholder(s) {
    var t = String(s == null ? '' : s).trim();
    return /^\[[A-Z][A-Z_]*\]$/.test(t) || t === 'null' || t === 'undefined';
  }
  function txt(s) { return placeholder(s) ? '' : String(s == null ? '' : s); }

  /*@3.DUCJ.5*/
  var GRADES = [
    { g: 0, q: 0.00, ar: 'لم أتذكّر', en: 'Blackout' },
    { g: 2, q: 0.32, ar: 'صعب',      en: 'Hard' },
    { g: 3, q: 0.58, ar: 'جيّد',      en: 'Good' },
    { g: 4, q: 0.80, ar: 'ممتاز',    en: 'Very good' },
    { g: 5, q: 1.00, ar: 'سهل',      en: 'Easy' }
  ];
  function gradeColor(q) {
    return (window.GardenData && GardenData.qualityColor01)
      ? GardenData.qualityColor01(q) : 'var(--st-accent, #a78bfa)';
  }

  /*@3.DUCJ.6*/
  function sm2Calc(card, grade) {
    var n = card.n || 0, ef = card.ef || 2.5, interval = card.interval || 0;
    if (grade >= 3) {
      interval = n === 0 ? 1 : n === 1 ? 6 : Math.round(interval * ef);
      n++;
    } else { n = 0; interval = 1; }
    ef = Math.max(1.3, ef + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    return { n: n, ef: ef, interval: interval,
             nextReview: Date.now() + interval * 86400000, lastGrade: grade };
  }

  function retrieval(st) {
    if (!st || !st.n || !st.interval || st.interval <= 0) return null;
    var last = st.nextReview - st.interval * 86400000;
    var t = (Date.now() - last) / 86400000;
    if (t < 0) return 100;
    return Math.max(0, Math.min(100, Math.round(Math.pow(0.9, t / st.interval) * 100)));
  }

  /*@3.DUCJ.7*/
  var cache = {};        /*@3.DUCJ.8*/

  function modUrl(code, mod) {
    var info = window.GardenData && GardenData.courseInfo(code);
    if (!info || !info.path) return null;
    return ROOT + info.path + 'M' + String(mod).padStart(2, '0') + '.html';
  }

  /*@3.DUCJ.9*/
  function cardIdx(k) {
    var m = /(\d+)\s*$/.exec(String(k));
    return m ? Number(m[1]) : -1;
  }

  function loadModule(code, mod) {
    var key = code + '|' + mod;
    if (cache[key] !== undefined) return Promise.resolve(cache[key]);
    var url = modUrl(code, mod);
    if (!url) { cache[key] = null; return Promise.resolve(null); }
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var tag = doc.getElementById('flashcard-data');
      var arr = tag ? JSON.parse(tag.textContent) : null;
      cache[key] = Array.isArray(arr) ? arr : null;
      return cache[key];
    }).catch(function () { cache[key] = null; return null; });
  }

  /*@3.DUCJ.10*/
  function ghostsHTML(remaining, nextRow) {
    var n = Math.max(0, Math.min(3, (remaining | 0) - 1));
    var out = '';
    for (var i = 0; i < n; i++) {
      /*@3.DUCJ.11*/
      if (i === 0 && nextRow && nextRow.card) {
        var fr = nextRow.card.front || {};
        var t = txt(fr[isAr() ? 'ar' : 'en'] || fr.ar || fr.en || '');
        out += '<i class="fc-ghost fc-ghost--next" aria-hidden="true">' +
          '<span class="fc-g-pill">' + esc(nextRow.code + ' · M' +
            String(nextRow.module).padStart(2, '0')) + '</span>' +
          '<span class="fc-g-term">' + esc(t) + '</span></i>';
        continue;
      }
      out += '<i class="fc-ghost" aria-hidden="true"></i>';
    }
    return out;
  }

  /*@3.DUCJ.12*/
  var TAP_SEEN = 'garden_fc_tap_seen';
  function tapSeen() { try { return localStorage.getItem(TAP_SEEN) === '1'; } catch (e) { return false; } }
  function markTapSeen() { try { localStorage.setItem(TAP_SEEN, '1'); } catch (e) {} }

  /*@3.DUCJ.13*/
  function sync3d(btn) {
    if (!btn) return;
    var on = window._gardenGetMobile3D ? window._gardenGetMobile3D() : true;
    btn.classList.toggle('active', on);
    btn.title = on
      ? L('تأثيرُ القلب 3D مفعّل — اضغط لإيقافه', '3D flip ON — tap to disable')
      : L('تأثيرُ القلب 3D معطّل — اضغط لتفعيله', '3D flip OFF — tap to enable');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  /*@3.DUCJ.14*/
  var dlg = null, S = null;

  function build() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'dcx-dlg';
    dlg.id = 'dcx-dlg';
    dlg.innerHTML =
      '<div class="dcx-in">' +
        '<div class="dcx-h">' +
          '<span class="dcx-h-ico"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></span>' +
          '<div class="dcx-h-b"><h3 class="dcx-t" id="dcx-t"></h3><span class="dcx-s" id="dcx-s"></span></div>' +
          /*@3.DUCJ.15*/
          '<button class="fc-3d-btn" id="dcx-3d" type="button">3D</button>' +
          '<button class="dcx-x" id="dcx-x" type="button"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '<span class="dcx-rail"><i id="dcx-rail" style="inline-size:0"></i></span>' +
        '<div class="dcx-b" id="dcx-b"></div>' +
        '<div class="dcx-f" id="dcx-f"></div>' +
      '</div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#dcx-x').addEventListener('click', function () { close(); });
    /*@3.DUCJ.16*/
    var b3d = dlg.querySelector('#dcx-3d');
    sync3d(b3d);
    b3d.addEventListener('click', function () {
      if (window._gardenToggle3D) window._gardenToggle3D();
      sync3d(b3d);
    });
    dlg.addEventListener('close', function () { detach(); });
    /*@3.DUCJ.17*/
    dlg.addEventListener('click', function (ev) {
      if (ev.target === dlg) close();
    });
    return dlg;
  }

  function close() { if (dlg && dlg.open) dlg.close(); }

  function detach() {
    document.removeEventListener('keydown', onKey, true);
    if (S && S.graded > 0) {
      /*@3.DUCJ.18*/
      document.dispatchEvent(new CustomEvent('garden:cardsReviewed',
        { detail: { graded: S.graded, right: S.right } }));
    }
  }

  /*@3.DUCJ.19*/
  function onKey(ev) {
    if (!dlg || !dlg.open || !S || S.phase !== 'review') return;
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); flip(); return; }
    if (!S.flipped) return;
    if (['0', '2', '3', '4', '5'].indexOf(ev.key) !== -1) {
      ev.preventDefault();
      grade(parseInt(ev.key, 10));
    }
  }

  /*@3.DUCJ.20*/
  function open(opts) {
    opts = opts || {};
    build();
    /*@3.DUCJ.21*/
    var outOfScope = !!(opts.code && window.GardenData && !GardenData.courseIsActive(opts.code));
    var rows = outOfScope ? [] : (opts.code
      ? (window.GardenData ? GardenData.dueList(opts.code) : [])
      : (window.GardenData ? GardenData.dueListForSemester() : []))
      .slice();
    if (opts.code) rows.sort(function (a, b) { return a.due - b.due; });

    S = {
      code: opts.code || null, rows: rows, pos: 0, flipped: false, revealed: false,
      graded: 0, right: 0, total: rows.length, phase: 'load', missing: {},
      outOfScope: outOfScope
    };

    document.addEventListener('keydown', onKey, true);
    if (!dlg.open) dlg.showModal();
    renderHead();

    if (!rows.length) { S.phase = outOfScope ? 'parked' : 'empty'; render(); return; }

    /*@3.DUCJ.22*/
    var need = {};
    rows.forEach(function (r) { need[r.code + '|' + r.module] = r; });
    var keys = Object.keys(need);
    S.phase = 'load';
    render();
    Promise.all(keys.map(function (k) {
      return loadModule(need[k].code, need[k].module);
    })).then(function () {
      if (!dlg.open || !S) return;
      /*@3.DUCJ.23*/
      S.rows = rows.filter(function (r) {
        var arr = cache[r.code + '|' + r.module];
        var card = arr && arr[cardIdx(r.idx)];
        if (!card) { S.missing[r.code + '|' + r.module] = 1; return false; }
        r.card = card;
        return true;
      });
      S.total = S.rows.length;
      S.phase = S.rows.length ? 'review' : (Object.keys(S.missing).length ? 'broken' : 'empty');
      render();
    });
  }

  /*@3.DUCJ.24*/
  function courseName(code) {
    var info = window.GardenData && GardenData.courseInfo(code);
    if (!info) return code;
    return isAr() ? (info.name_ar || info.name_en || code)
                  : (info.name_en || info.name_ar || code);
  }
  function tint(code) {
    var info = window.GardenData && GardenData.courseInfo(code);
    return (info && info.brand_color) || 'var(--st-accent, #a78bfa)';
  }

  function renderHead() {
    dlg.querySelector('#dcx-t').textContent =
      S.code ? L('بطاقاتُ هذه المادة', 'This course’s cards')
             : L('بطاقاتُك المستحقّة', 'Your due cards');
    var sub = dlg.querySelector('#dcx-s');
    if (S.phase === 'review') {
      sub.textContent = L('راجِعها هنا — التقييمُ يُحفظ في وحدتها فوراً',
                          'Review here — grades save to their module instantly');
    } else if (S.code) {
      sub.textContent = courseName(S.code);
    } else {
      sub.textContent = L('من موادّ فصلك النشط وحدَها', 'From your active semester only');
    }
  }

  function setRail(f) {
    dlg.querySelector('#dcx-rail').style.inlineSize = Math.round(f * 100) + '%';
  }

  function render() {
    var b = dlg.querySelector('#dcx-b');
    var f = dlg.querySelector('#dcx-f');
    renderHead();

    if (S.phase === 'load') {
      setRail(0);
      b.innerHTML = '<div class="dcx-state"><span class="dcx-spin"></span><p>' +
        esc(L('أجلب بطاقاتِك من وحداتها…', 'Fetching your cards from their modules…')) +
        '</p></div>';
      f.innerHTML = '';
      return;
    }

    /*@3.DUCJ.25*/
    if (S.phase === 'parked') {
      setRail(1);
      b.innerHTML = '<div class="dcx-state">' +
        '<i class="fa-solid fa-box-archive" aria-hidden="true"></i>' +
        '<h4>' + esc(L('هذه المادةُ خارجَ فصلك النشط', 'This course is not in your active term')) + '</h4>' +
        '<p>' + esc(L('فلا تطالبك ببطاقاتها. وتقدّمُك فيها محفوظٌ كما هو — أعِدها إلى فصلك فتعود بطاقاتُك من حيث توقّفت.',
                      'So it no longer asks for reviews. Your progress is kept exactly as it was — add it back to your term and the cards resume where you left off.')) + '</p>' +
        '</div>';
      f.innerHTML = '<span class="dcx-f-sp"></span>' +
        '<button class="dcx-btn dcx-btn--primary" type="button" data-dcx="close">' +
        esc(L('فهمت', 'Got it')) + '</button>';
      bindFoot();
      return;
    }

    if (S.phase === 'empty') {
      setRail(1);
      b.innerHTML = '<div class="dcx-state">' +
        '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
        '<h4>' + esc(L('لا بطاقةَ مستحقّةً الآن', 'Nothing due right now')) + '</h4>' +
        '<p>' + esc(L('راجعتَ كلَّ ما حان موعدُه. البطاقةُ تعود وحدَها حين يحين وقتُها.',
                      'You are caught up. Each card comes back on its own schedule.')) + '</p>' +
        '</div>';
      f.innerHTML = '<span class="dcx-f-sp"></span>' +
        '<button class="dcx-btn dcx-btn--primary" type="button" data-dcx="close">' +
        esc(L('تمام', 'Done')) + '</button>';
      bindFoot();
      return;
    }

    if (S.phase === 'broken') {
      setRail(0);
      b.innerHTML = '<div class="dcx-state">' +
        '<i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>' +
        '<h4>' + esc(L('تعذّر تحميلُ نصوصِ البطاقات', 'Could not load the card text')) + '</h4>' +
        '<p>' + esc(L('تقدّمُك سليمٌ ومحفوظ — لكنّ صفحاتِ الوحدات لم تصل (اتصالٌ منقطع غالباً). افتح الوحدةَ مباشرةً أو أعِد المحاولة.',
                      'Your progress is safe — the module pages did not load (likely offline). Open the module directly or retry.')) + '</p>' +
        missingHTML() +
        '</div>';
      f.innerHTML = '<span class="dcx-f-sp"></span>' +
        '<button class="dcx-btn" type="button" data-dcx="close">' + esc(L('إغلاق', 'Close')) + '</button>';
      bindFoot();
      return;
    }

    if (S.phase === 'done') {
      setRail(1);
      var pct = S.graded ? Math.round(S.right / S.graded * 100) : 0;
      b.innerHTML = '<div class="dcx-state">' +
        '<i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>' +
        '<h4>' + esc(L('انتهت الجلسة', 'Session complete')) + '</h4>' +
        '<div class="dcx-sum">' +
          '<span><b>' + S.graded + '</b>' +
            esc(L(S.graded === 1 ? 'بطاقة' : S.graded === 2 ? 'بطاقتان' : 'بطاقات',
                  S.graded === 1 ? 'card' : 'cards')) + '</span>' +
          '<span><b>' + esc(isAr() ? pct + '٪' : pct + '%') + '</b>' +
            esc(L('تذكّرتَها', 'recalled')) + '</span>' +
        '</div>' +
        '<p>' + esc(L('كلُّ تقييمٍ كُتب في وحدتِه، ومواعيدُ العودة أُعيد حسابُها.',
                      'Every grade was written to its module and the next review dates recomputed.')) + '</p>' +
        missingHTML() +
        '</div>';
      f.innerHTML = '<span class="dcx-f-sp"></span>' +
        '<button class="dcx-btn dcx-btn--primary" type="button" data-dcx="close">' +
        esc(L('تمام', 'Done')) + '</button>';
      bindFoot();
      return;
    }

    /*@3.DUCJ.26*/
    var r = S.rows[S.pos];
    var card = r.card;
    var ret = retrieval(r.state);
    var retTone = ret == null ? '' : (ret >= 80 ? 'ok' : ret >= 50 ? 'mid' : 'bad');
    setRail(S.total ? S.graded / S.total : 0);

    var front = txt((card.front && (card.front[isAr() ? 'ar' : 'en'] || card.front.ar || card.front.en)) || '');
    var def = txt((card.back && card.back.definition &&
      (card.back.definition[isAr() ? 'ar' : 'en'] || card.back.definition.ar || card.back.definition.en)) || '');
    var enTerm = txt((card.front && card.front.en) || '');
    var exm = txt((card.back && card.back.example &&
      (card.back.example[isAr() ? 'ar' : 'en'] || card.back.example.ar || card.back.example.en)) || '');

    var pos = String(S.graded + 1).padStart(2, '0') + ' / ' + String(S.total).padStart(2, '0');

    /*@3.DUCJ.27*/
    function faceTop(isBack) {
      return '<div class="fc-top">' +
        '<span class="fc-pos">' + esc(pos) + '</span>' +
        '<span class="fc-pill">' +
          '<i class="fa-solid fa-layer-group" aria-hidden="true"></i>' +
          '<span class="ltr">' + esc(r.code) + ' · M' + String(r.module).padStart(2, '0') + '</span>' +
        '</span>' +
        (isBack
          ? '<span class="fc-ans"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
            esc(L('الإجابة', 'Answer')) + '</span>'
          : '<span></span>') +
      '</div>';
    }
    var RULE = '<div class="fc-rule" aria-hidden="true"><i></i><b></b><i></i></div>';

    b.innerHTML =
      chipsHTML() +
      '<div class="flashcard-scene" style="--brand-500:' + esc(tint(r.code)) + '">' +
        ghostsHTML(S.total - S.graded, S.rows[S.pos + 1]) +
        '<div class="flashcard-card' + (S.flipped ? ' flipped' : '') + '" id="dcx-card" ' +
          'tabindex="0" role="button" aria-pressed="' + (S.flipped ? 'true' : 'false') + '" ' +
          'aria-label="' + esc(L('اقلب البطاقة', 'Flip the card')) + '">' +
          '<div class="flashcard-face flashcard-front">' +
            faceTop(false) +
            '<div class="fc-body">' +
              '<span class="dcx-ret"' + (ret == null ? ' hidden' : ' data-tone="' + retTone + '"') + '>' +
                (ret == null ? '' : esc(L('تذكّر', 'Recall')) + ' <span class="n">' +
                  esc(isAr() ? ret + '٪' : ret + '%') + '</span>') + '</span>' +
              '<div class="fc-term">' + esc(front) + '</div>' +
              '<div class="fc-term-en">' + esc(isAr() ? enTerm : '') + '</div>' +
            '</div>' +
            RULE +
            (tapSeen() ? '' :
              '<div class="fc-tap"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i>' +
              '<span>' + esc(L('اضغط البطاقة لقلبها', 'Tap the card to flip')) + '</span></div>') +
          '</div>' +
          '<div class="flashcard-face flashcard-back">' +
            faceTop(true) +
            '<div class="fc-body"><div class="fc-definition">' + esc(def) + '</div></div>' +
            RULE +
            (exm ? '<div class="fc-example">' + esc(exm) + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      /*@3.DUCJ.28*/
      '<div class="sm2-grades"' + (S.flipped ? '' : ' hidden') + ' id="dcx-grades">' +
        GRADES.map(function (g) {
          return '<button class="sm2-btn sm2-btn--' + g.g + '" type="button" data-g="' + g.g + '" ' +
            'title="' + esc(L(g.ar + ' — المفتاح ' + g.g, g.en + ' — key ' + g.g)) + '">' +
            esc(L(g.ar, g.en)) + '</button>';
        }).join('') +
      '</div>' +
      missingHTML();

    f.innerHTML =
      '<span class="dcx-count">' +
        esc(L((S.graded + 1) + ' من ' + S.total, (S.graded + 1) + ' of ' + S.total)) + '</span>' +
      '<span class="dcx-f-sp"></span>' +
      (modUrl(r.code, r.module)
        ? '<a class="dcx-btn" href="' + esc(modUrl(r.code, r.module)) + '">' +
          '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>' +
          '<span>' + esc(L('افتح الوحدة', 'Open module')) + '</span></a>'
        : '') +
      '<button class="dcx-btn" type="button" data-dcx="skip">' +
        esc(L('تخطَّ', 'Skip')) + '</button>';

    /*@3.DUCJ.29*/
    if (window.GardenMath) GardenMath.typeset(b);

    dlg.querySelector('#dcx-card').addEventListener('click', flip);
    dlg.querySelector('#dcx-card').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); flip(); }
    });
    dlg.querySelector('#dcx-grades').addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('[data-g]');
      if (btn) grade(parseInt(btn.getAttribute('data-g'), 10));
    });
    bindFoot();
  }

  function bindFoot() {
    dlg.querySelectorAll('[data-dcx]').forEach(function (el) {
      el.addEventListener('click', function () {
        var a = el.getAttribute('data-dcx');
        if (a === 'close') close();
        else if (a === 'skip') next();
        else if (a === 'flip') flip();
      });
    });
  }

  function missingHTML() {
    var keys = Object.keys(S.missing);
    if (!keys.length) return '';
    var names = keys.map(function (k) {
      var p = k.split('|');
      return p[0] + '·M' + String(p[1]).padStart(2, '0');
    }).join(' · ');
    return '<div class="dcx-warn">' +
      esc(L('وحداتٌ لم تصل نصوصُها فلم تُعرض بطاقاتُها: ',
            'Modules whose text did not load, so their cards were skipped: ')) +
      '<span class="ltr" style="direction:ltr;unicode-bidi:isolate">' + esc(names) + '</span>' +
      '</div>';
  }

  /*@3.DUCJ.30*/
  function chipsHTML() {
    if (S.code) return '';
    var left = {};
    for (var i = S.pos; i < S.rows.length; i++) {
      left[S.rows[i].code] = (left[S.rows[i].code] || 0) + 1;
    }
    var codes = Object.keys(left);
    if (codes.length < 2) return '';
    var cur = S.rows[S.pos] && S.rows[S.pos].code;
    return '<div class="dcx-chips">' + codes.map(function (c) {
      return '<span class="dcx-chip"' + (c === cur ? ' data-on="1"' : '') +
        ' style="--dot:' + esc(tint(c)) + '" title="' + esc(courseName(c)) + '">' +
        '<span class="dcx-chip-d" aria-hidden="true"></span><span class="ltr">' + esc(c) + '</span>' +
        '<b>' + left[c] + '</b></span>';
    }).join('') + '</div>';
  }

  /*@3.DUCJ.31*/
  function flip() {
    if (S.phase !== 'review') return;
    var card = dlg.querySelector('#dcx-card');
    if (!card) return;
    S.flipped = !S.flipped;
    card.classList.toggle('flipped', S.flipped);
    card.setAttribute('aria-pressed', S.flipped ? 'true' : 'false');
    if (S.flipped) {
      S.revealed = true;
      /*@3.DUCJ.32*/
      if (!tapSeen()) {
        markTapSeen();
        var t = dlg.querySelector('.fc-tap');
        if (t) t.remove();
      }
    }
    var g = dlg.querySelector('#dcx-grades');
    if (g) g.hidden = !S.flipped;
  }

  function next() {
    S.flipped = false;
    S.revealed = false;
    S.pos++;
    if (S.pos >= S.rows.length) { S.phase = 'done'; }
    render();
  }

  /*@3.DUCJ.33*/
  function exitClassFor(g) {
    return g >= 4 ? 'fc-exit-away' : g === 3 ? 'fc-exit-slide' : 'fc-exit-back';
  }
  var EXIT_MS = 420;
  function reducedMotion() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function grade(g) {
    if (S.phase !== 'review' || !S.flipped) return;
    var c = dlg.querySelector('#dcx-card');
    if (c && c.getAttribute('data-exiting') === '1') return;
    if (!c || reducedMotion()) { gradeNow(g); next(); return; }

    /*@3.DUCJ.34*/
    c.setAttribute('data-exiting', '1');
    c.classList.add(exitClassFor(g));
    var gr = dlg.querySelector('#dcx-grades');
    if (gr) gr.style.pointerEvents = 'none';
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (S && dlg.open) next();
    }
    c.addEventListener('animationend', finish, { once: true });
    gradeNow(g);
    setTimeout(finish, EXIT_MS + 140);
  }

  function gradeNow(g) {
    if (S.phase !== 'review') return;
    var r = S.rows[S.pos];
    var key = 'garden_' + r.code + '_m' + r.module + '_fc';
    var cur = {};
    try { cur = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { cur = {}; }
    if (!cur || typeof cur !== 'object') cur = {};

    /*@3.DUCJ.35*/
    var base = (cur[r.idx] && typeof cur[r.idx] === 'object') ? cur[r.idx] : r.state;
    var up = sm2Calc(base, g);
    var prevFail = base.failCount || 0;

    if (g >= 3) {
      /*@3.DUCJ.36*/
      if (up.interval >= 21) up.failCount = 0;
      else if (prevFail > 0 && up.n > 2) up.failCount = prevFail - 1;
      else up.failCount = prevFail;
      S.right++;
    } else {
      /*@3.DUCJ.37*/
      up.nextReview = Date.now();
      up.failCount = prevFail + 1;
    }
    up.buriedUntil = 0;
    cur[r.idx] = up;

    try { localStorage.setItem(key, JSON.stringify(cur)); }
    catch (e) { /*@3.DUCJ.38*/ }

    /*@3.DUCJ.39*/
    S.graded++;
  }

  /*@3.DUCJ.40*/
  document.addEventListener('garden:languageChanged', function () {
    if (dlg && dlg.open && S) render();
  });

  window.GardenDue = {
    open: open,
    close: close,
    count: function () {
      return (window.GardenData && GardenData.dueForSemester) ? GardenData.dueForSemester() : 0;
    }
  };
})();
