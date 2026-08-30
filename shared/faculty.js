/*@3.FACJ.1*/
(function () {
  'use strict';

  var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  /*@3.FACJ.2*/
  var GF = window.GardenFaculty;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    data: null, view: [], shown: 0, PAGE: 48,
    q: '', subject: '', college: '', major: '', gender: 'all', gap: '',
    /*@3.FACJ.49*/
    sort: 'new', min: 'off'
  };

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var AR_RE = /[؀-ۿݐ-ݿ]/;
  function hasAr(s) { return AR_RE.test(String(s || '')); }

  /*@3.FACJ.4*/
  function tone(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return '#10b981';
    if (v >= 60) return '#f59e0b';
    if (v >= 40) return '#f97316';
    return '#ef4444';
  }

  /*@3.FACJ.5*/
  function ring(v, size) {
    var s = size || 54, r = (s / 2) - 5, c = 2 * Math.PI * r;
    var p = v == null ? 0 : Math.max(0, Math.min(100, v));
    var col = tone(v);
    return '<svg class="fc-ring" viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '" fill="none" stroke="var(--border-color)" stroke-width="4"/>' +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="4"' +
        ' stroke-linecap="round" stroke-dasharray="' + (c * p / 100).toFixed(1) + ' ' + c.toFixed(1) + '"' +
        ' transform="rotate(-90 ' + (s / 2) + ' ' + (s / 2) + ')"/>' +
      '<text x="' + (s / 2) + '" y="' + (s / 2) + '" text-anchor="middle" dominant-baseline="central"' +
        ' fill="' + col + '" font-size="' + (s * 0.32).toFixed(0) + '" font-weight="800"' +
        ' font-family="JetBrains Mono, monospace">' + (v == null ? '—' : v) + '</text>' +
    '</svg>';
  }

  /*@3.FACJ.6*/
  function axisBar(w, label, pair) {
    var v = pair ? Math.round(pair[0] * 100) : null;
    var n = pair ? pair[1] : 0;
    return '<div class="fc-ax">' +
      '<div class="fc-ax-h"><span class="fc-ax-l">' + esc(label) + '</span>' +
        '<span class="fc-ax-w">' + Math.round(w * 100) + '٪</span>' +
        '<span class="fc-ax-v" style="color:' + tone(v) + '">' +
          (v == null ? t('لا بيانات', 'no data') : v + '٪') + '</span>' +
        '<span class="fc-ax-n">' + (n ? t('من ' + n, 'of ' + n) : '') + '</span></div>' +
      '<div class="fc-ax-bar"><i style="width:' + (v == null ? 0 : v) + '%;background:' + tone(v) + '"></i></div>' +
    '</div>';
  }

  /*@3.FACJ.51*/
  document.addEventListener('garden:facultyRefreshed', function () {
    var d = GF.data && GF.data();
    if (!d) return;
    state.data = d;
    (d.faculty || []).forEach(function (f) {
      f._sx = (f._s || GF.hayPerson(f)) + ' ' +
              GF.normPerson(Object.keys(f.courses || {}).join(' ') + ' ' +
                            (f.other || []).join(' '));
    });
    buildFilters();
    paintStats();
    paintHow();
    apply();
  });

  /*@3.FACJ.7*/
  function load() {
    var g = $('#fc-grid');
    g.innerHTML = '<div class="sx-state"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    GF.load(function (d) {
      try {
        if (!d) throw new Error('load_failed');
        state.data = d;
        (d.faculty || []).forEach(function (f) {
          /*@3.FACJ.8*/
          f._sx = (f._s || GF.hayPerson(f)) + ' ' +
                  GF.normPerson(Object.keys(f.courses || {}).join(' ') + ' ' +
                                (f.other || []).join(' '));
        });
        buildFilters();
        paintStats();
        paintHow();
        apply();
        openFromHash();
        openFromQuery();
      } catch (e) {
        g.innerHTML = '<div class="sx-state sx-state--err">' +
          '<i class="fa-solid fa-triangle-exclamation"></i>' +
          t('تعذّر جلب التقييمات — حاول بعد قليل.',
            'Could not load ratings — try again shortly.') +
          '<div class="sx-state-d">' + esc(String(e && e.message || e)) + '</div></div>';
      }
    });
  }

  function paintStats() {
    var d = state.data, el = $('#fc-stats');
    if (!d) return;
    /*@3.FACJ.9*/
    var when = d.updated_at ? new Date(d.updated_at) : null;
    el.hidden = false;
    el.innerHTML =
      stat('fa-chalkboard-user', d.faculty.length, t('أستاذاً مقيَّماً', 'instructors rated')) +
      stat('fa-comment-dots', d.rows, t('تقييماً من الطلاب', 'student ratings')) +
      stat('fa-scale-balanced', Math.round(d.prior) + '٪', t('متوسّط الجامعة', 'university average')) +
      stat('fa-link', d.linked, t('مربوطاً بشُعبه في بانر', 'linked to Banner sections')) +
      (when ? '<div class="fc-stat fc-stat--when"><i class="fa-solid fa-clock-rotate-left"></i>' +
        '<span>' + t('آخر تقييم ', 'last rating ') +
        when.toLocaleDateString(isAr() ? 'ar-SA' : 'en-GB') + '</span></div>' : '') +
      /*@3.FACJ.10*/
      (!window.GardenFlags || window.GardenFlags.get('ratings.faculty.enabled')
        ? '<button class="fc-stat fc-stat--go" id="fc-rate-open">' +
            '<i class="fa-solid fa-pen-to-square"></i>' +
            '<span>' + t('قيّم أستاذاً', 'Rate an instructor') + '</span></button>'
        : '');
    var b = $('#fc-rate-open');
    if (b) b.addEventListener('click', function () { openRate(null); });
  }
  function stat(icon, n, label) {
    return '<div class="fc-stat"><i class="fa-solid ' + icon + '"></i>' +
      '<b>' + esc(String(n)) + '</b><span>' + esc(label) + '</span></div>';
  }

  function paintHow() {
    var d = state.data;
    if (!d) return;
    $('#fc-how-b').innerHTML =
      '<p>' + t(
        'لكل تقييمٍ خمسةُ أسئلة. تُحوَّل الإجابةُ إلى نسبةٍ (نعم = ١٠٠٪ · أحياناً = ٥٠٪ · لا = ٠٪) ثم تُجمع بأوزانٍ ثابتة:',
        'Each rating has five questions. Answers become percentages (yes = 100% · sometimes = 50% · no = 0%), then combine with fixed weights:') +
      '</p><ul class="fc-how-l">' +
      (d.weights || []).map(function (w) {
        return '<li><b>' + Math.round(w.w * 100) + '٪</b> ' + esc(t(w.ar, w.en)) + '</li>';
      }).join('') + '</ul>' +
      '<p class="fc-how-note">' + t(
        'وسؤالٌ لم يُجَب لا يُحسب صفراً — يُستبعَد ويُعاد توزيع وزنه. ' +
        'أمّا الترتيبُ فبمرتبةٍ مشدودةٍ نحو متوسّط الجامعة (' + Math.round(d.prior) + '٪) ' +
        'حتى لا يتصدّر مؤشّرٌ كاملٌ من ثلاثة تقييماتٍ آخرَ بُني على ثلاثين.',
        'An unanswered question is not counted as zero — it is dropped and its weight redistributed. ' +
        'Ranking uses a score pulled toward the university average (' + Math.round(d.prior) + '%) ' +
        'so a perfect score from three ratings does not outrank one built on thirty.') +
      '</p>';
  }

  /*@3.FACJ.11*/
  function opt(v, cur, label, n, mono) {
    return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') +
      (n != null ? ' data-meta="' + n + '"' : '') + (mono ? ' data-mono' : '') +
      '>' + esc(label) + '</option>';
  }

  function buildFilters() {
    /*@3.FACJ.40*/
    var d = state.data || {}, F = d.faculty || [];
    var cSub = {}, cCo = {}, cPg = {};
    F.forEach(function (f) {
      (f.sj || []).forEach(function (s) { cSub[s] = (cSub[s] || 0) + 1; });
      (f.co || []).forEach(function (c) { cCo[c] = (cCo[c] || 0) + 1; });
      (f.pg || []).forEach(function (p) { cPg[p] = (cPg[p] || 0) + 1; });
    });

    /*@3.FACJ.12*/
    var subs = Object.keys(cSub).sort(function (a, b) { return cSub[b] - cSub[a] || (a < b ? -1 : 1); });
    $('#fc-subject').innerHTML =
      opt('', state.subject, t('كل الرموز', 'All subjects')) +
      subs.map(function (s) { return opt(s, state.subject, s, cSub[s], true); }).join('');

    var cos = Object.keys(cCo).sort(function (a, b) { return cCo[b] - cCo[a]; });
    $('#fc-college').innerHTML =
      opt('', state.college, t('كل الكليات', 'All colleges')) +
      cos.map(function (c) {
        var nm = d.colleges[c] || {};
        return opt(c, state.college, t(nm.ar || c, nm.en || c), cCo[c]);
      }).join('');

    /*@3.FACJ.13*/
    var pgs = Object.keys(cPg).filter(function (p) {
      if (!state.college) return true;
      var pr = d.programs[p];
      return pr && pr.co === state.college;
    }).sort(function (a, b) { return cPg[b] - cPg[a]; });
    $('#fc-major').innerHTML =
      opt('', state.major, t('كل التخصصات', 'All programs')) +
      pgs.map(function (p) {
        var pr = d.programs[p] || {};
        return opt(p, state.major, t(pr.ar || p, pr.en || p), cPg[p]);
      }).join('');

    $('#fc-gender').innerHTML =
      opt('all', state.gender, t('كلا الجنسين', 'Both')) +
      opt('M', state.gender, t('يدرّس طلاباً', 'Teaches men')) +
      opt('F', state.gender, t('يدرّس طالبات', 'Teaches women'));

    /*@3.FACJ.14*/
    var nNoLink = 0, nNoCourse = 0, nAmb = 0, nAny = 0;
    F.forEach(function (f) {
      var a = !f.link, b = !Object.keys(f.courses || {}).length;
      if (a) nNoLink++;
      if (b) nNoCourse++;
      if (a || b) nAny++;
      if ((f.amb || []).length) nAmb++;
    });
    $('#fc-gap').innerHTML =
      opt('', state.gap, t('الكل', 'All')) +
      opt('linked', state.gap, t('مربوطٌ ببانر', 'Linked to Banner'), F.length - nNoLink) +
      opt('nolink', state.gap, t('بلا رابطِ بانر', 'No Banner link'), nNoLink) +
      opt('nocourse', state.gap, t('بلا مقرَّرٍ معروف', 'No known course'), nNoCourse) +
      opt('amb', state.gap, t('مقرَّرٌ غيرُ محسوم', 'Uncertain course'), nAmb) +
      opt('any', state.gap, t('ناقصٌ في أحدهما', 'Missing either'), nAny);

    paintFilterBtns();
  }

  /*@3.FACJ.15*/
  function paintFilterBtns() {
    var mark = function (sel, on) {
      var el = $(sel);
      if (!el) return;
      var host = el.closest ? el.closest('.gs') : null;
      (host || el).classList.toggle('is-filtering', !!on);
    };
    mark('#fc-subject', state.subject);
    mark('#fc-college', state.college);
    mark('#fc-major', state.major);
    mark('#fc-gender', state.gender !== 'all');
    mark('#fc-gap', !!state.gap);
  }

  /*@3.FACJ.48*/
  var SORTS = [
    { v: 'new',  ar: 'الأحدثُ تقييماً',  en: 'Recently rated', i: 'fa-clock' },
    { v: 'old',  ar: 'الأقدمُ تقييماً',  en: 'Longest ago',    i: 'fa-clock-rotate-left' },
    { v: 'rk',   ar: 'الأعلى تقييماً',   en: 'Highest rated',  i: 'fa-star' },
    { v: 'n',    ar: 'الأكثر تقييماً',   en: 'Most rated',     i: 'fa-comment-dots' },
    { v: 'low',  ar: 'الأدنى تقييماً',   en: 'Lowest rated',   i: 'fa-arrow-down' },
    { v: 'name', ar: 'أبجدياً',          en: 'Alphabetical',   i: 'fa-arrow-down-a-z' }
  ];
  /*@3.FACJ.16*/
  function paintSort() {
    var host = $('#fc-sort');
    host.innerHTML = SORTS.map(function (s) {
      return '<option value="' + s.v + '"' + (state.sort === s.v ? ' selected' : '') + '>' +
        t('ترتيب: ', 'Sort: ') + esc(t(s.ar, s.en)) + '</option>';
    }).join('');
  }

  function apply() {
    /*@3.FACJ.45*/
    var qw = GF.qPerson(state.q);
    var list = ((state.data && state.data.faculty) || []).filter(function (f) {
      /*@3.FACJ.47*/
      if (state.min === 'on' && !(window.GardenRating
            ? GardenRating.facultyShown(f) : f.n >= 3)) return false;
      if (state.gap) {
        var noCourse = !Object.keys(f.courses || {}).length;
        if (state.gap === 'linked' && !f.link) return false;
        if (state.gap === 'nolink' && f.link) return false;
        if (state.gap === 'nocourse' && !noCourse) return false;
        if (state.gap === 'amb' && !(f.amb || []).length) return false;
        if (state.gap === 'any' && f.link && !noCourse) return false;
      }
      if (state.subject && (f.sj || []).indexOf(state.subject) < 0) return false;
      if (state.college && (f.co || []).indexOf(state.college) < 0) return false;
      if (state.major && (f.pg || []).indexOf(state.major) < 0) return false;
      /*@3.FACJ.17*/
      if (state.gender !== 'all' && String(f.g || '').indexOf(state.gender) < 0) return false;
      if (qw.length && !GF.hitPerson(f._sx, qw)) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === 'new' || state.sort === 'old') {
        var la = a.lr || '', lb = b.lr || '';
        /*@3.FACJ.50*/
        if (!la !== !lb) return la ? -1 : 1;
        if (la !== lb) return state.sort === 'new'
          ? (la < lb ? 1 : -1) : (la > lb ? 1 : -1);
        return b.n - a.n;
      }
      if (state.sort === 'n') return b.n - a.n || (b.rk || 0) - (a.rk || 0);
      if (state.sort === 'low') return (a.rk || 0) - (b.rk || 0) || b.n - a.n;
      if (state.sort === 'name') return a.name.localeCompare(b.name, 'ar');
      return (b.rk || 0) - (a.rk || 0) || b.n - a.n;
    });
    state.view = list;
    state.shown = 0;
    $('#fc-grid').innerHTML = '';
    more();

    paintDir();

    $('#fc-count').textContent = list.length
      ? t(list.length + ' أستاذاً', list.length + ' instructors')
      : '';
    $('#fc-clear').hidden = !(state.q || state.subject || state.college || state.major ||
      state.gender !== 'all' || state.gap || state.min !== 'off');
    if (!list.length) {
      $('#fc-grid').innerHTML = '<div class="sx-state">' +
        '<i class="fa-solid fa-user-slash"></i>' +
        t('لا أستاذ يطابق بحثك.', 'No instructor matches your search.') + '</div>';
    }
  }

  /*@3.FACJ.32*/
  function paintDir() {
    var host = $('#fc-dir');
    if (!host) return;
    var q = String(state.q || '').trim();
    /*@3.FACJ.33*/
    var filtered = state.subject || state.college || state.major ||
                   state.gender !== 'all' || state.gap;
    if (q.length < 2 || filtered) { host.hidden = true; host.innerHTML = ''; return; }

    if (!GF.dir()) {
      host.hidden = false;
      host.innerHTML = '<div class="fc-dir-h"><i class="fa-solid fa-spinner fa-spin"></i>' +
        t('يُبحث في دليل البانر…', 'Searching the Banner directory…') + '</div>';
      GF.loadDir(function () { if (state.q === q) paintDir(); });
      return;
    }
    var hit = GF.searchDir(q, 12);
    if (!hit.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML =
      '<div class="fc-dir-h"><i class="fa-solid fa-user-plus"></i>' +
        t('من دليل البانر · لا تقييماتِ لهم بعد', 'From the Banner directory · not rated yet') +
        '<span class="fc-dir-n">' + hit.length + '</span></div>' +
      '<div class="fc-grid">' + hit.map(dirCard).join('') + '</div>';
  }

  function dirCard(p) {
    return '<article class="fc-card fc-card--dir" data-dir="' + esc(p.n) + '" tabindex="0">' +
      '<div class="fc-c-top">' +
        '<div class="fc-dir-ring"><i class="fa-solid fa-user-plus"></i></div>' +
        '<div class="fc-c-id">' +
          /*@3.FACJ.43*/
          '<div class="fc-name' + (hasAr(GF.dirNameOf(p)) ? '' : ' ltr') + '">' +
            esc(GF.dirNameOf(p)) + '</div>' +
          (GF.dirAltOf(p) ? '<div class="fc-dir-ar' +
            (hasAr(GF.dirAltOf(p)) ? '' : ' ltr') + '">' + esc(GF.dirAltOf(p)) + '</div>' : '') +
          '<div class="fc-n"><i class="fa-solid fa-layer-group"></i>' +
            t(p.c + ' شعبة', p.c + ' sections') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="fc-dir-cta"><i class="fa-solid fa-pen-to-square"></i>' +
        t('كن أوّل من يقيّمه', 'Be the first to rate them') + '</div>' +
    '</article>';
  }

  function openDir(bannerName) {
    var p = GF.dirByName(bannerName);
    if (!p) return;
    $('#fc-modal').classList.add('on');
    $('#fc-modal-title').textContent = GF.dirNameOf(p);
    var sub = $('#fc-modal-sub');
    sub.textContent = GF.dirAltOf(p) || t('لا تقييماتِ له بعد', 'No ratings yet');
    sub.hidden = false;
    $('#fc-modal-body').innerHTML = GF.dirDetailHtml(p, { base: '' });
    GF.wire($('#fc-modal'), {});
  }

  function more() {
    var next = state.view.slice(state.shown, state.shown + state.PAGE);
    $('#fc-grid').insertAdjacentHTML('beforeend', next.map(card).join(''));
    state.shown += next.length;
    var b = $('#fc-more');
    b.hidden = state.shown >= state.view.length;
    if (!b.hidden) {
      b.innerHTML = '<i class="fa-solid fa-chevron-down"></i>' +
        t('عرض المزيد (' + (state.view.length - state.shown) + ')',
          'Show more (' + (state.view.length - state.shown) + ')');
    }
  }

  /*@3.FACJ.18*/
  function card(f) {
    var codes = Object.keys(f.courses || {})
      .sort(function (a, b) { return f.courses[b] - f.courses[a]; });
    /*@3.FACJ.19*/
    var ambSet = {};
    (f.amb || []).forEach(function (c) { ambSet[c] = 1; });
    var chips = codes.slice(0, 4).map(function (c) {
      return '<span class="fc-chip mono' + (ambSet[c] ? ' fc-chip--amb' : '') + '"' +
        (ambSet[c] ? ' title="' + esc(t('مقرَّرٌ مشترك — لم يتّضح أيُّ برنامجٍ منه',
          'Shared course — the program is not certain')) + '"' : '') +
        '>' + esc(c) + '</span>';
    }).join('') + (codes.length > 4 ? '<span class="fc-chip fc-chip--n">+' + (codes.length - 4) + '</span>' : '');
    /*@3.FACJ.20*/
    if (!codes.length && (f.other || []).length) {
      chips = f.other.slice(0, 2).map(function (o) {
        return '<span class="fc-chip fc-chip--raw">' + esc(o) + '</span>';
      }).join('');
    }
    /*@3.FACJ.46*/
    var shown = window.GardenRating ? GardenRating.facultyShown(f) : (f.idx != null);
    var small = !shown;
    var main = nameOf(f), sub = subNameOf(f);
    return '<article class="fc-card' + (small ? ' is-small' : '') + '" data-id="' + esc(f.id) + '" tabindex="0">' +
      '<div class="fc-c-top">' +
        ring(shown ? f.idx : null) +
        '<div class="fc-c-id">' +
          '<div class="fc-name' + (hasAr(main) ? '' : ' ltr') + '">' + esc(main) + '</div>' +
          '<div class="fc-n"><i class="fa-solid fa-comment-dots"></i>' +
            t(f.n + ' تقييماً', f.n + ' ratings') +
            (small ? '<span class="fc-warn">' + t('لم يُعلَن بعد', 'not declared yet') + '</span>' : '') +
          '</div>' +
          (sub ? '<div class="fc-link' + (hasAr(sub) ? '' : ' ltr') + '">' +
            '<i class="fa-solid fa-link"></i>' + esc(sub) + '</div>' : '') +
        '</div>' +
      '</div>' +
      (chips ? '<div class="fc-chips">' + chips + '</div>' : '') +
    '</article>';
  }

  /*@3.FACJ.21*/
  /*@3.FACJ.22*/
  /*@3.FACJ.42*/
  function nameOf(f) { return GF.nameOf(f); }
  function subNameOf(f) { return GF.altNameOf(f); }

  /*@3.FACJ.23*/
  function openId(id) {
    /*@3.FACJ.41*/
    var F = (state.data && state.data.faculty) || [];
    /*@3.FACJ.24*/
    var f = F.filter(function (x) { return x.id === id; })[0] ||
            F.filter(function (x) { return (x.alias || []).indexOf(id) >= 0; })[0];
    if (!f) return;
    $('#fc-modal').classList.add('on');
    $('#fc-modal-title').textContent = nameOf(f);
    var sub = $('#fc-modal-sub');
    /*@3.FACJ.44*/
    var alt = subNameOf(f);
    sub.textContent = (alt ? alt + ' · ' : '') +
      t(f.n + ' تقييماً من الطلاب', f.n + ' student ratings');
    sub.hidden = false;
    detail($('#fc-modal-body'), f);
    /*@3.FACJ.35*/
    GF.wire($('#fc-modal'), {});
    if (history.replaceState) history.replaceState(null, '', '#' + encodeURIComponent(f.id));
  }
  function closeModal() {
    $('#fc-modal').classList.remove('on');
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }

  /*@3.FACJ.25*/
  function detail(host, f) { GF.renderDetail(host, f, { base: '' }); }

  function openRate(id, dirName) {
    var f = id ? GF.byId(id) : null;
    var p = dirName ? GF.dirByName(dirName) : null;
    GF.resetVals();
    $('#fc-rate').classList.add('on');
    $('#fc-rate-sub').textContent = f
      ? GF.nameOf(f)
      : p ? (p.a || p.n)
      : t('اختر الأستاذ ثم أجب عمّا تعرفه', 'Pick the instructor, then answer what you know');
    $('#fc-rate-body').innerHTML = GF.rateHtml(f, { dir: p });
    /*@3.FACJ.37*/
    if (!f && !p && dirName) {
      var w = $('#fc-r-who', $('#fc-rate'));
      if (w) w.value = dirName;
    }
    GF.wire($('#fc-rate'), { onSent: function () {
      $('#fc-rate').classList.remove('on');
      load();
    } });
  }

  function openFromHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (h) openId(h);
  }

  /*@3.FACJ.36*/
  function openFromQuery() {
    var m = /[?&]rate=([^&]+)/.exec(location.search || '');
    if (!m) return;
    var v = decodeURIComponent(m[1].replace(/\+/g, ' '));
    if (!v) return;
    var f = GF.byId(v);
    if (f) { openRate(f.id); return; }
    GF.loadDir(function () { openRate(null, v); });
  }

  /*@3.FACJ.26*/
  function closePops() { if (window.GardenSelect) GardenSelect.closeAll(); }
  function wireSingle(sel, onPick) {
    var host = $(sel);
    if (!host) return;
    host.addEventListener('change', function () { onPick(this.value); });
  }

  function boot() {
    paintSort();
    wireSingle('#fc-sort', function (v) { state.sort = v; paintSort(); apply(); });
    wireSingle('#fc-subject', function (v) { state.subject = v || ''; buildFilters(); apply(); });
    wireSingle('#fc-gender',  function (v) { state.gender = v || 'all'; buildFilters(); apply(); });
    /*@3.FACJ.27*/
    wireSingle('#fc-college', function (v) {
      state.college = v || '';
      var PR = (state.data && state.data.programs) || {};
      if (state.major && PR[state.major] &&
          PR[state.major].co !== state.college && state.college) state.major = '';
      buildFilters(); apply();
    });
    wireSingle('#fc-major', function (v) { state.major = v || ''; buildFilters(); apply(); });
    wireSingle('#fc-gap', function (v) { state.gap = v || ''; buildFilters(); apply(); });

    document.addEventListener('click', function (e) {
      /*@3.FACJ.28*/
      if (!e.target.closest('.gs') && !e.target.closest('.gs-pop')) closePops();
      var rd = e.target.closest('[data-rate-dir]');
      if (rd) { closeModal(); openRate(null, rd.getAttribute('data-rate-dir')); return; }
      var rb = e.target.closest('[data-rate]');
      if (rb) { closeModal(); openRate(rb.getAttribute('data-rate')); return; }
      if (e.target.closest('#fc-rate-x') || e.target.id === 'fc-rate') {
        $('#fc-rate').classList.remove('on'); return;
      }
      /*@3.FACJ.34*/
      var dc = e.target.closest('.fc-card--dir');
      if (dc) { openDir(dc.getAttribute('data-dir')); return; }
      var c = e.target.closest('.fc-card');
      if (c) { openId(c.getAttribute('data-id')); return; }
      if (e.target.closest('#fc-x') || e.target.id === 'fc-modal') closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closePops(); $('#fc-rate').classList.remove('on'); }
      /*@3.FACJ.29*/
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); $('#fc-q').focus();
      }
      if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('fc-card')) {
        openId(document.activeElement.getAttribute('data-id'));
      }
    });

    var qt = null;
    $('#fc-q').addEventListener('input', function () {
      clearTimeout(qt);
      qt = setTimeout(function () { state.q = $('#fc-q').value; apply(); }, 120);
    });
    /*@3.FACJ.38*/
    window.GardenHint.wire($('#fc-hint'));

    $('#fc-more').addEventListener('click', more);
    $('#fc-min').addEventListener('click', function () {
      state.min = state.min === 'on' ? 'off' : 'on';
      $('#fc-min').classList.toggle('on', state.min === 'on');
      apply();
    });
    $('#fc-clear').addEventListener('click', function () {
      state.q = ''; $('#fc-q').value = '';
      state.subject = ''; state.college = ''; state.major = ''; state.gender = 'all';
      state.gap = ''; state.min = 'off';
      $('#fc-min').classList.remove('on');
      buildFilters(); apply();
    });
    $('#fc-min').classList.toggle('on', state.min === 'on');

    /*@3.FACJ.30*/
    document.addEventListener('garden:languageChanged', function () {
      if (!state.data) return;
      paintStats(); paintHow(); paintSort(); buildFilters(); apply();
      /*@3.FACJ.31*/
      if ($('#fc-modal').classList.contains('on')) {
        var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
        if (h) openId(h);
      }
    });
    window.addEventListener('hashchange', openFromHash);

    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
