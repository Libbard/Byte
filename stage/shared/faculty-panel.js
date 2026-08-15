/*@3.FAPJ.1*/
(function () {
  'use strict';

  var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var AR_RE = /[؀-ۿݐ-ݿ]/;
  function hasAr(s) { return AR_RE.test(String(s || '')); }
  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[ً-ْٰـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /*@3.FAPJ.65*/
  function skey(s) { return norm(s).replace(/[^ء-يa-z0-9]+/g, ' ').trim(); }
  function qwords(s) { return skey(s).split(' ').filter(Boolean); }

  /*@3.FAPJ.2*/
  var DATA = null, LOADING = null, WAIT = [], FRESH = false, DATA_FAILED = false;

  function load(cb) {
    if (DATA) { cb && cb(DATA); return; }
    if (cb) WAIT.push(cb);
    if (LOADING) return;
    LOADING = true;
    /*@3.FAPJ.16*/
    var want = FRESH; FRESH = false;
    (want ? fetch(API + '/v1/faculty.json', { cache: 'reload' })
          : GardenFetch('/v1/faculty.json', { cache: 'default' }))
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (d) {
        DATA = d; LOADING = false;
        (d.faculty || []).forEach(function (f) {
          f._k = norm(f.name);
          f._e = f.link && f.link.e ? String(f.link.e).toLowerCase() : null;
          /*@3.FAPJ.66*/
          f._s = skey([f.name, f.en || '', (f.link && f.link.n) || '', f._e || '',
                       (f.alias || []).join(' ')].join(' '));
        });
        WAIT.splice(0).forEach(function (fn) { fn(d); });
      })
      .catch(function () {
        LOADING = false; DATA_FAILED = true;
        WAIT.splice(0).forEach(function (fn) { fn(null); });
      });
  }

  /*@3.FAPJ.21*/
  var DIR = null, DIR_LOADING = false, DIR_WAIT = [], DIR_FAILED = false;

  function loadDir(cb) {
    if (DIR) { cb && cb(DIR); return; }
    if (DIR_FAILED) { cb && cb(null); return; }
    if (cb) DIR_WAIT.push(cb);
    if (DIR_LOADING) return;
    DIR_LOADING = true;
    GardenFetch('/v1/faculty/directory.json')
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (d) {
        DIR = d; DIR_LOADING = false;
        /*@3.FAPJ.22*/
        (d.people || []).forEach(function (p) {
          var em = String(p.e || '').toLowerCase();
          p._k = norm(p.a || '') + ' ' +
                 String(p.n || '').toLowerCase() + ' ' +
                 em + ' ' + em.replace(/[._@-]/g, ' ');
        });
        DIR_WAIT.splice(0).forEach(function (fn) { fn(d); });
      })
      .catch(function () {
        DIR_LOADING = false; DIR_FAILED = true;
        DIR_WAIT.splice(0).forEach(function (fn) { fn(null); });
      });
  }

  /*@3.FAPJ.31*/
  function searchDir(q, take) {
    if (!DIR) return [];
    /*@3.FAPJ.35*/
    /*@3.FAPJ.69*/
    var w = qwords(q);
    if (!w.length) return [];
    var out = [];
    var people = DIR.people || [];
    for (var i = 0; i < people.length && out.length < (take || 8) * 4; i++) {
      var p = people[i];
      /*@3.FAPJ.23*/
      if (p.id) continue;
      var all = true;
      for (var j = 0; j < w.length; j++) {
        if (p._k.indexOf(w[j]) < 0) { all = false; break; }
      }
      if (all) out.push(p);
    }
    return out.slice(0, take || 8);
  }

  function dirByName(bannerName) {
    if (!DIR || !bannerName) return null;
    var k = String(bannerName).toLowerCase().replace(/[^a-z]/g, '');
    if (!k) return null;
    return (DIR.people || []).filter(function (p) {
      return String(p.n || '').toLowerCase().replace(/[^a-z]/g, '') === k;
    })[0] || null;
  }
  function dirByEmail(email) {
    if (!DIR || !email) return null;
    var e = String(email).toLowerCase();
    return (DIR.people || []).filter(function (p) { return p.e === e; })[0] || null;
  }

  /*@3.FAPJ.24*/
  var SRC_AR = { r: 'كما كتبه الطلاب', m: 'اسمٌ مُثبَت', ai: 'ترجمة آلية' };
  var SRC_EN = { r: 'as students wrote it', m: 'verified', ai: 'auto-transliterated' };
  /*@3.FAPJ.43*/
  function dirSendName(p) {
    if (!p) return '';
    return (p.a && p.s !== 'ai') ? p.a : (p.n || p.a || '');
  }
  /*@3.FAPJ.62*/
  /*@3.FAPJ.64*/
  function arLine(p) {
    if (!p) return '';
    var alt = dirAltOf(p);
    if (!alt) return '';
    var tag = (alt === String(p.a || '').trim())
      ? '<span class="fc-dir-src">' + esc(t(SRC_AR[p.s] || '', SRC_EN[p.s] || '')) + '</span>'
      : '';
    return '<div class="fc-dir-ar' + (hasAr(alt) ? '' : ' ltr') + '">' + esc(alt) + tag + '</div>';
  }

  /*@3.FAPJ.37*/
  function nudge(n) {
    n = Number(n) || 0;
    if (n === 0) return { ar: 'كن أوّل من يقيّمه', en: 'Be the first to rate them' };
    if (n === 1) return { ar: 'رأيُك الثاني', en: 'Be the second voice' };
    if (n === 2) return { ar: 'رأيُك الثالث يُخرجه من «عيّنة صغيرة»',
                          en: 'A third rating lifts them out of “small sample”' };
    return null;
  }
  function nudgeT(n) { var x = nudge(n); return x ? t(x.ar, x.en) : ''; }

  function byEmail(email) {
    if (!DATA || !email) return null;
    var e = String(email).toLowerCase();
    return DATA.faculty.filter(function (f) { return f._e === e; })[0] || null;
  }
  function byId(id) {
    if (!DATA || !id) return null;
    return DATA.faculty.filter(function (f) { return f.id === id; })[0] ||
           DATA.faculty.filter(function (f) { return (f.alias || []).indexOf(id) >= 0; })[0] || null;
  }
  /*@3.FAPJ.3*/
  function byBannerName(name) {
    if (!DATA || !name) return null;
    var k = String(name).toLowerCase().replace(/[^a-z]/g, '');
    if (!k) return null;
    return DATA.faculty.filter(function (f) {
      return f.link && f.link.n &&
        String(f.link.n).toLowerCase().replace(/[^a-z]/g, '') === k;
    })[0] || null;
  }

  function tone(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return '#10b981';
    if (v >= 60) return '#f59e0b';
    if (v >= 40) return '#f97316';
    return '#ef4444';
  }

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

  /*@3.FAPJ.57*/
  /*@3.FAPJ.63*/
  function pickName(o) {
    o = o || {};
    var lat = String(o.latin || '').trim();
    var ar = String(o.ar || '').trim();
    return isAr() ? (ar || lat) : (lat || ar);
  }
  /*@3.FAPJ.58*/
  function otherName(o) {
    o = o || {};
    var main = pickName(o);
    var lat = String(o.latin || '').trim();
    var ar = String(o.ar || '').trim();
    var alt = (main === ar) ? lat : ar;
    return alt && alt !== main ? alt : '';
  }
  function latinOf(f) { return (f && (f.en || (f.link && f.link.n) || f.ln)) || ''; }
  function nameOf(f) {
    if (!f) return '';
    return pickName({ ar: f.name, machine: !!f.mn, latin: latinOf(f) });
  }
  function altNameOf(f) {
    if (!f) return '';
    return otherName({ ar: f.name, machine: !!f.mn, latin: latinOf(f) });
  }
  /*@3.FAPJ.59*/
  function dirNameOf(p) {
    if (!p) return '';
    return pickName({ ar: p.a, machine: p.s === 'ai', latin: p.n });
  }
  function dirAltOf(p) {
    if (!p) return '';
    return otherName({ ar: p.a, machine: p.s === 'ai', latin: p.n });
  }

  /*@3.FAPJ.4*/
  function detailHtml(f, o) {
    o = o || {};
    var W = (DATA && DATA.weights) || [];
    var axes = W.map(function (w) { return axisBar(w.w, t(w.ar, w.en), f.ax && f.ax[w.k]); }).join('');
    var codes = Object.keys(f.courses || {})
      .sort(function (a, b) { return f.courses[b] - f.courses[a]; });
    var ambSet = {};
    (f.amb || []).forEach(function (c) { ambSet[c] = 1; });

    var peers = (DATA.faculty || []).filter(function (x) { return x.n >= 3 && x.rk != null; });
    var below = peers.filter(function (x) { return (x.rk || 0) < (f.rk || 0); }).length;
    var pct = (peers.length > 1 && f.rk != null && f.n >= 3)
      ? Math.round(below * 100 / (peers.length - 1)) : null;

    var head = '<div class="fc-d-head">' + ring(f.idx, 76) +
      '<div class="fc-d-h-t">' +
        '<div class="fc-d-idx" style="color:' + tone(f.idx) + '">' + (f.idx == null ? '—' : f.idx + '٪') + '</div>' +
        '<div class="fc-d-sub">' + t('المؤشّر المركّب · ', 'Composite score · ') +
          t(f.n + ' تقييماً', f.n + ' ratings') + '</div>' +
        (pct != null ? '<div class="fc-d-pct">' +
          t('أعلى من ' + pct + '٪ من الأساتذة المقيَّمين (' + peers.length + ')',
            'Above ' + pct + '% of rated instructors (' + peers.length + ')') + '</div>' : '') +
        (f.n < 3 ? '<div class="fc-warn fc-warn--big">' +
          t('عيّنةٌ صغيرة — اقرأه على أنه انطباعٌ لا حكم.',
            'Small sample — read it as an impression, not a verdict.') + '</div>' +
          (nudgeT(f.n) ? '<div class="fc-nudge"><i class="fa-solid fa-seedling"></i>' +
            esc(nudgeT(f.n)) + '</div>' : '') : '') +
      '</div></div>';

    /*@3.FAPJ.5*/
    var mail = (f.link && f.link.e)
      ? '<div class="fc-d-mail">' +
          '<button class="fc-go fc-mail-copy" data-copy="' + esc(f.link.e) + '">' +
            '<i class="fa-regular fa-copy"></i>' + t('انسخ البريد', 'Copy email') +
            '<span class="fc-go-n ltr">' + esc(f.link.e) + '</span></button>' +
          '<a class="fc-go" href="mailto:' + esc(f.link.e) + '">' +
            '<i class="fa-regular fa-envelope"></i>' + t('راسله', 'Email') + '</a>' +
        '</div>'
      : '';

    var taught = codes.length
      ? '<div class="fc-d-sec"><h4>' + t('المواد التي قُيِّم فيها', 'Courses rated in') + '</h4>' +
        '<div class="fc-chips">' + codes.map(function (c) {
          return '<a class="fc-chip mono fc-chip--go' + (ambSet[c] ? ' fc-chip--amb' : '') +
            '" href="' + (o.base || '') + 'sections.html?q=' + encodeURIComponent(c) + '">' +
            esc(c) + '<span class="fc-chip-n">' + f.courses[c] + '</span></a>';
        }).join('') + '</div></div>'
      : '';

    var banner = f.link
      ? '<div class="fc-d-sec"><h4>' + t('في كتالوج الشعب', 'In the sections catalog') + '</h4>' +
        '<a class="fc-go" href="' + (o.base || '') + 'sections.html?q=' +
          encodeURIComponent(f.link.n || f.name) + '">' +
          '<i class="fa-solid fa-layer-group"></i>' + t('اعرض شُعبه', 'Show their sections') +
          (f.link.n ? '<span class="fc-go-n ltr">' + esc(f.link.n) + '</span>' : '') + '</a></div>'
      : '<div class="fc-d-sec"><div class="fc-note"><i class="fa-solid fa-circle-info"></i>' +
        t('لم نتمكّن من ربطه بسجلّ بانر بثقةٍ كافية، فلا تُعرض شُعبه هنا.',
          'We could not link them to a Banner record confidently, so their sections are not shown.') +
        '</div></div>';

    var cm = (f.cm || []);
    var comments = cm.length
      ? '<div class="fc-d-sec"><h4>' + t('ما كتبه الطلاب', 'What students wrote') +
        '<span class="fc-d-n">' + cm.length + '</span></h4>' +
        '<div class="fc-cms">' + cm.map(function (c) {
          var tag = c.cs ? c.cs.map(function (x) {
                      return '<span class="fc-cm-tag mono">' + esc(x) + '</span>'; }).join('')
                  : c.c ? '<span class="fc-cm-tag mono">' + esc(c.c) + '</span>'
                  : c.r ? '<span class="fc-cm-tag fc-cm-tag--raw">' + esc(c.r) + '</span>' : '';
          return '<div class="fc-cm">' + tag +
            '<p class="' + (hasAr(c.t) ? '' : 'ltr') + '">' + esc(c.t) + '</p></div>';
        }).join('') + '</div></div>'
      : '<div class="fc-d-sec"><div class="fc-note"><i class="fa-solid fa-comment-slash"></i>' +
        t('لا تعليقاتٍ مكتوبة — الأرقامُ وحدها.', 'No written comments — numbers only.') + '</div></div>';

    /*@3.FAPJ.6*/
    var canRate = !window.GardenFlags || window.GardenFlags.get('ratings.faculty.enabled');

    var acts = '<div class="fc-d-acts">' +
      (canRate ? '<button class="sx-primary fc-rate" data-rate="' + esc(f.id) + '">' +
        '<i class="fa-solid fa-pen-to-square"></i>' + t('قيّم هذا الأستاذ', 'Rate this instructor') +
      '</button>' : '') +
      (o.full ? '<a class="fc-go" href="' + (o.base || '') + 'faculty.html#' +
        encodeURIComponent(f.id) + '"><i class="fa-solid fa-arrow-up-right-from-square"></i>' +
        t('صفحة التقييمات', 'Ratings page') + '</a>' : '') +
    '</div>';

    return head + mail +
      '<div class="fc-d-sec"><h4>' + t('المحاور', 'Axes') + '</h4>' + axes + '</div>' +
      taught + banner + comments + acts;
  }

  /*@3.FAPJ.29*/
  function dirDetailHtml(p, o) {
    o = o || {};
    var canRate = !window.GardenFlags || window.GardenFlags.get('ratings.faculty.enabled');
    return '<div class="fc-d-head fc-d-head--empty">' +
        '<i class="fa-solid fa-user-plus fc-empty-i"></i>' +
        '<div class="fc-d-h-t">' +
          /*@3.FAPJ.60*/
          '<div class="fc-d-name' + (hasAr(dirNameOf(p)) ? '' : ' ltr') + '">' +
            esc(dirNameOf(p)) + '</div>' +
          arLine(p) +
          '<div class="fc-d-sub">' +
            t('لا تقييماتِ له بعد — رأيُك سيكون الأوّل.',
              'No ratings yet — yours would be the first.') + '</div>' +
        '</div></div>' +
      /*@3.FAPJ.30*/
      (p.c ? '<div class="fc-d-sec"><div class="fc-note">' +
        '<i class="fa-solid fa-layer-group"></i>' +
        t('درّس ' + p.c + ' شعبةً في كتالوج البانر.',
          'Taught ' + p.c + ' sections in the Banner catalog.') + '</div></div>' : '') +
      (p.e ? '<div class="fc-d-mail">' +
        '<button class="fc-go fc-mail-copy" data-copy="' + esc(p.e) + '">' +
          '<i class="fa-regular fa-copy"></i>' + t('انسخ البريد', 'Copy email') +
          '<span class="fc-go-n ltr">' + esc(p.e) + '</span></button>' +
        '<a class="fc-go" href="mailto:' + esc(p.e) + '">' +
          '<i class="fa-regular fa-envelope"></i>' + t('راسله', 'Email') + '</a></div>' : '') +
      '<div class="fc-d-sec"><a class="fc-go" href="' + (o.base || '') + 'sections.html?q=' +
        encodeURIComponent(p.n) + '"><i class="fa-solid fa-layer-group"></i>' +
        t('اعرض شُعبه', 'Show their sections') + '</a></div>' +
      (canRate ? '<div class="fc-d-acts">' +
        '<button class="sx-primary fc-rate" data-rate-dir="' + esc(p.n) + '">' +
        '<i class="fa-solid fa-pen-to-square"></i>' +
        esc(nudgeT(0)) + '</button></div>' : '');
  }

  /*@3.FAPJ.7*/
  var RATE_Q = [
    { k: 'ov', ar: 'كيف كانت تجربتك عموماً؟', en: 'Overall experience?',
      opts: [['ايجابية', 'Positive', 'ok'], ['سلبية', 'Negative', 'bad']] },
    { k: 'cl', ar: 'كانت طريقة الشرح واضحة', en: 'The explanation was clear',
      opts: [['اتفق', 'Agree', 'ok'], ['لا اتفق', 'Disagree', 'bad']] },
    { k: 'fg', ar: 'تصحيح الدرجات كان عادلاً', en: 'Grading was fair',
      opts: [['اتفق', 'Agree', 'ok'], ['لا اتفق', 'Disagree', 'bad']] },
    { k: 'em', ar: 'سرعة الرد والتجاوب', en: 'Response speed',
      opts: [['دائمًا', 'Always', 'ok'], ['احيانًا', 'Sometimes', 'mid'], ['لم يتم الرد أبدًا', 'Never', 'bad']] },
    { k: 'gt', ar: 'رصد الدرجات في وقته', en: 'Grades posted on time',
      opts: [['نعم', 'Yes', 'ok'], ['احيانًا', 'Sometimes', 'mid'], ['كان متأخر جدًا', 'Very late', 'bad']] }
  ];

  /*@3.FAPJ.44*/
  var DKEY = null, DTIMER = null;

  function draftKey(f, o) {
    if (o.editId) return 'f:e' + o.editId;
    if (f) return 'f:' + (f.fkey || f.id);
    if (o.dir) return 'f:d' + (o.dir.e || o.dir.n);
    return 'f:new';
  }
  function draftGet(k) {
    try { return (window.GardenDraft && GardenDraft.get(k)) || null; } catch (e) { return null; }
  }
  function draftDrop(k) {
    try { if (window.GardenDraft) GardenDraft.clear(k); } catch (e) {}
  }
  /*@3.FAPJ.45*/
  function draftSave(root) {
    if (!DKEY || !window.GardenDraft) return;
    clearTimeout(DTIMER);
    DTIMER = setTimeout(function () {
      if (!root || !root.isConnected) return;
      var cm = $('#fc-r-cm', root), nm = $('#fc-r-name', root);
      var ml = $('#fc-r-mail', root), bn = $('#fc-r-banner', root);
      var d = {
        vals: vals,
        courses: $$('.fc-crs.on', root).map(function (x) { return x.getAttribute('data-crs'); }),
        comment: cm ? cm.value : '',
        name: nm ? nm.value : '',
        mail: ml ? ml.value : '',
        banner: bn ? bn.value : ''
      };
      var empty = !Object.keys(d.vals).length && !d.courses.length &&
                  !d.comment.trim() && !d.name && !d.mail;
      try { GardenDraft.set(DKEY, empty ? null : d); } catch (e) {}
    }, 350);
  }

  function rateHtml(f, o) {
    o = o || {};
    /*@3.FAPJ.8*/
    var codes = f ? Object.keys(f.courses || {})
      .sort(function (a, b) { return f.courses[b] - f.courses[a]; }) : [];
    var pre = o.course && codes.indexOf(o.course) < 0 ? [o.course] : [];
    var dp = o.dir || null;
    /*@3.FAPJ.40*/
    var fx = o.fixed || null;
    /*@3.FAPJ.41*/
    var pv = (o.pre && o.pre.vals) || {};
    var pcrs = (o.pre && o.pre.courses) || [];
    var pcm = (o.pre && o.pre.comment) || '';
    /*@3.FAPJ.46*/
    DKEY = draftKey(f, o);
    var dft = draftGet(DKEY), kept = false;
    if (dft) {
      kept = true;
      if (dft.vals && Object.keys(dft.vals).length) pv = dft.vals;
      if (dft.courses) pcrs = dft.courses;
      if (typeof dft.comment === 'string') pcm = dft.comment;
    }
    resetVals();
    Object.keys(pv).forEach(function (k) { if (pv[k]) vals[k] = pv[k]; });

    var who = fx
      ? '<div class="fc-r-who"><i class="fa-solid fa-chalkboard-user"></i>' +
        '<b>' + esc(fx.name || '') + '</b>' +
        '<span class="fc-r-new">' + esc(t('تعديل', 'editing')) + '</span>' +
        '<input type="hidden" id="fc-r-name" value="' + esc(fx.name || '') + '">' +
        '<input type="hidden" id="fc-r-banner" value="">' +
        '<input type="hidden" id="fc-r-mail" value="' + esc(fx.email || '') + '"></div>'
      : f
      ? '<div class="fc-r-who"><i class="fa-solid fa-chalkboard-user"></i>' +
        '<b>' + esc(nameOf(f)) + '</b>' +
        (f.link && f.link.e ? '<span class="fc-go-n ltr">' + esc(f.link.e) + '</span>' : '') +
        '<input type="hidden" id="fc-r-name" value="' + esc(f.name) + '">' +
        '<input type="hidden" id="fc-r-banner" value="' + esc((f.link && f.link.n) || '') + '">' +
        '<input type="hidden" id="fc-r-mail" value="' + esc((f.link && f.link.e) || '') + '"></div>'
      : dp
      ? '<div class="fc-r-who"><i class="fa-solid fa-chalkboard-user"></i>' +
        '<b>' + esc(dirNameOf(dp)) + '</b>' +
        (dirAltOf(dp) ? '<span class="fc-go-n' + (hasAr(dirAltOf(dp)) ? '' : ' ltr') +
          '">' + esc(dirAltOf(dp)) + '</span>' : '') +
        '<span class="fc-r-new">' + esc(t('أوّل تقييم', 'first rating')) + '</span>' +
        '<input type="hidden" id="fc-r-name" value="' + esc(dirSendName(dp)) + '">' +
        '<input type="hidden" id="fc-r-banner" value="' + esc(dp.n) + '">' +
        '<input type="hidden" id="fc-r-mail" value="' + esc(dp.e || '') + '"></div>'
      : '<div class="fc-f"><label>' + t('اسم الأستاذ', 'Instructor name') + '</label>' +
        '<input class="sx-search fc-in" id="fc-r-who" autocomplete="off" value="' +
        esc((dft && dft.name) || '') + '" placeholder="' +
        esc(t('اكتب اسمه كما تعرفه', 'Type their name')) + '">' +
        /*@3.FAPJ.27*/
        /*@3.FAPJ.36*/
        '<div class="fc-hint"><i class="fa-solid fa-circle-info"></i><span>' +
        esc(t('لم تجده؟ الأساتذةُ الذين لم يُقيَّموا بعدُ يظهرون أسفلَ القائمة — والأسرعُ أن تكتب اسمه كما في البانر ⁦(Alqahtani, Hassan)⁩ أو بريده.',
              'Not there? Instructors with no ratings yet appear at the bottom — fastest is to type the name exactly as Banner shows it (Alqahtani, Hassan) or their email.')) +
        '</span></div>' +
        '<div class="fc-sug" id="fc-r-sug" hidden></div>' +
        '<div class="fc-r-who" id="fc-r-chosen" hidden></div>' +
        '<input type="hidden" id="fc-r-name" value="' + esc((dft && dft.name) || '') + '">' +
        '<input type="hidden" id="fc-r-banner" value="' + esc((dft && dft.banner) || '') + '">' +
        '<input type="hidden" id="fc-r-mail" value="' + esc((dft && dft.mail) || '') + '"></div>';

    var seen = {};
    var chips = pcrs.concat(pre, codes).filter(function (c) {
      if (!c || seen[c]) return false;
      seen[c] = 1;
      return true;
    }).map(function (c) {
      var on = o.course === c || pcrs.indexOf(c) > -1;
      return '<button type="button" class="fc-crs' + (on ? ' on' : '') +
        '" data-crs="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    return '<div class="fc-form">' + who +
      '<div class="fc-f"><label>' + t('المواد (يمكن اختيار أكثر من واحدة)',
        'Courses (you may pick more than one)') + '</label>' +
      /*@3.FAPJ.17*/
      '<div class="fc-crs-row" id="fc-r-crs"' + (chips ? '' : ' hidden') + '>' + chips + '</div>' +
      /*@3.FAPJ.47*/
      '<div class="fc-more-row">' +
        '<input class="sx-search fc-in" id="fc-r-more" autocomplete="off" inputmode="text" placeholder="' +
          esc(t('أو اكتب رمزاً آخر — CS241', 'or type another code — CS241')) + '">' +
        '<button type="button" class="fc-more-add" id="fc-r-add" aria-label="' +
          esc(t('أضفِ المادة', 'Add course')) + '"><i class="fa-solid fa-plus"></i>' +
          '<span>' + esc(t('أضف', 'Add')) + '</span></button>' +
      '</div></div>' +
      RATE_Q.map(function (q) {
        return '<div class="fc-q"><div class="fc-q-t">' + esc(t(q.ar, q.en)) + '</div>' +
          '<div class="fc-q-o">' + q.opts.map(function (op) {
            return '<button type="button" class="fc-opt is-' + op[2] +
              (vals[q.k] === op[0] ? ' on' : '') + '" data-k="' + q.k +
              '" data-v="' + esc(op[0]) + '">' + esc(t(op[0], op[1])) + '</button>';
          }).join('') + '</div></div>';
      }).join('') +
      '<div class="fc-f"><label>' + t('تعليقك (اختياريّ)', 'Your comment (optional)') + '</label>' +
        '<textarea class="fc-in fc-ta" id="fc-r-cm" rows="3" maxlength="1200" placeholder="' +
        esc(t('ما الذي يجب أن يعرفه زميلُك قبل أن يسجّل معه؟',
              'What should a classmate know before registering?')) + '">' +
        esc(pcm) + '</textarea></div>' +
      '<div class="fc-note"><i class="fa-solid fa-shield-halved"></i>' +
        t('لا نحفظ اسمك ولا بريدك — رأيُك وحدَه، ويظهر فوراً.',
          'We store no name or email — only your answer, and it appears immediately.') + '</div>' +
      /*@3.FAPJ.48*/
      (kept ? '<div class="fc-kept"><i class="fa-solid fa-clock-rotate-left"></i>' +
        esc(t('أعدنا ما كتبتَه ولم تُرسله بعد.', 'We brought back what you had not sent yet.')) +
        '</div>' : '') +
      '<div class="fc-r-foot">' +
        '<button class="sx-primary" id="fc-r-send">' +
          (o.editId
            ? '<i class="fa-solid fa-floppy-disk"></i>' + t('احفظِ التعديل', 'Save changes')
            : '<i class="fa-solid fa-paper-plane"></i>' + t('أرسل التقييم', 'Send rating')) +
        '</button>' +
        /*@3.FAPJ.49*/
        '<button type="button" class="fc-r-clear" id="fc-r-clear">' +
          '<i class="fa-solid fa-eraser"></i>' + esc(t('ابدأ من جديد', 'Start over')) + '</button>' +
        '<span class="fc-r-msg" id="fc-r-msg"></span>' +
      '</div></div>';
  }

  /*@3.FAPJ.9*/
  var vals = {}, noCrsWarned = false;

  /*@3.FAPJ.10*/
  /*@3.FAPJ.50*/
  function addTyped(root) {
    var inp = $('#fc-r-more', root);
    if (!inp) return 0;
    var raw = String(inp.value || '').toUpperCase();
    var row = $('#fc-r-crs', root);
    if (!row) return 0;
    var added = 0;
    raw.split(/[^A-Z0-9]+/).join(' ')
      .replace(/([A-Z]{2,6})\s*(\d{3})/g, function (_, s, d) { return ' ' + s + d + ' '; })
      .split(/\s+/).filter(function (v) { return /^[A-Z]{2,6}\d{3}$/.test(v); })
      .forEach(function (v) {
        row.hidden = false;
        var have = $('[data-crs="' + v + '"]', row);
        if (have) { have.classList.add('on'); return; }
        row.insertAdjacentHTML('beforeend',
          '<button type="button" class="fc-crs on" data-crs="' + esc(v) + '">' + esc(v) + '</button>');
        added++;
      });
    if (added || /^[A-Z]{2,6}\d{3}$/.test(raw.replace(/[^A-Z0-9]/g, ''))) {
      inp.value = '';
      noCrsWarned = false;
    }
    return added;
  }

  /*@3.FAPJ.51*/
  function clearForm(root) {
    draftDrop(DKEY);
    resetVals();
    $$('.fc-opt.on', root).forEach(function (x) { x.classList.remove('on'); });
    $$('.fc-crs.on', root).forEach(function (x) { x.classList.remove('on'); });
    var cm = $('#fc-r-cm', root); if (cm) cm.value = '';
    var more = $('#fc-r-more', root); if (more) more.value = '';
    var kept = root.querySelector('.fc-kept'); if (kept) kept.remove();
    var msg = $('#fc-r-msg', root);
    if (msg) { msg.className = 'fc-r-msg'; msg.textContent = ''; }
    if ($('#fc-r-who', root)) clearPick(root);
  }

  function wire(root, o) {
    o = o || {};
    /*@3.FAPJ.70*/
    if (!DATA && !DATA_FAILED && $('#fc-r-who', root)) load();
    /*@3.FAPJ.39*/
    root.__gfOpts = o;
    if (root.__gfWired) return;
    root.__gfWired = true;
    root.addEventListener('click', function (e) {
      var cp = e.target.closest('[data-copy]');
      if (cp) { copyText(cp.getAttribute('data-copy'), cp); return; }
      var crs = e.target.closest('[data-crs]');
      if (crs) { crs.classList.toggle('on'); noCrsWarned = false; draftSave(root); return; }
      if (e.target.closest('[data-gf-unpick]')) { clearPick(root); draftSave(root); return; }
      if (e.target.closest('#fc-r-add')) { addTyped(root); draftSave(root); return; }
      if (e.target.closest('#fc-r-clear')) { clearForm(root); return; }
      var op = e.target.closest('.fc-opt');
      if (op) {
        var k = op.getAttribute('data-k'), on = op.classList.contains('on');
        $$('.fc-opt[data-k="' + k + '"]', root).forEach(function (x) { x.classList.remove('on'); });
        if (on) delete vals[k];
        else { op.classList.add('on'); vals[k] = op.getAttribute('data-v'); }
        draftSave(root);
        return;
      }
      var sg = e.target.closest('.fc-sug-i');
      if (sg) {
        var dn = sg.getAttribute('data-dir');
        if (dn) applyDirPick(root, dirByName(dn));
        else applyPick(root, byId(sg.getAttribute('data-id')));
        draftSave(root);
        return;
      }
      if (e.target.closest('#fc-r-send')) send(root, root.__gfOpts || o);
    });
    root.addEventListener('input', function (e) {
      if (e.target.id === 'fc-r-who') suggest(root);
      if (/^fc-r-(who|cm|more)$/.test(e.target.id || '')) draftSave(root);
    });
    /*@3.FAPJ.52*/
    root.addEventListener('focusout', function (e) {
      if (e.target && e.target.id === 'fc-r-more') { addTyped(root); draftSave(root); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.id !== 'fc-r-more') return;
      if (e.key !== 'Enter' && e.key !== ',' && e.key !== '،') return;
      e.preventDefault();
      addTyped(root);
      draftSave(root);
    });
  }
  /*@3.FAPJ.11*/
  function copyText(v, btn) {
    function ok() { flash(btn, t('نُسخ ✓', 'Copied ✓')); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = v;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var done = document.execCommand('copy');
        document.body.removeChild(ta);
        if (done) ok(); else flash(btn, t('انسخه يدوياً', 'Copy manually'));
      } catch (_) { flash(btn, t('انسخه يدوياً', 'Copy manually')); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(ok, fallback);
    } else fallback();
  }

  function flash(el, msg) {
    var old = el.innerHTML;
    el.innerHTML = '<i class="fa-solid fa-check"></i>' + esc(msg);
    setTimeout(function () { el.innerHTML = old; }, 1400);
  }
  function resetVals() { vals = {}; noCrsWarned = false; }

  function suggest(root) {
    var box = $('#fc-r-sug', root), inp = $('#fc-r-who', root);
    if (!box || !inp) return;
    /*@3.FAPJ.18*/
    var nm = $('#fc-r-name', root);
    if (nm && nm.value) clearPick(root, true);
    var q = norm(inp.value);
    if (q.length < 2) { box.hidden = true; return; }
    /*@3.FAPJ.67*/
    if (!DATA) {
      box.hidden = false;
      box.innerHTML = '<div class="fc-sug-none">' + esc(DATA_FAILED
        ? t('تعذّر جلبُ قائمة الأساتذة. تحقّقْ من اتّصالك.',
            'Could not load the instructor list. Check your connection.')
        : t('تُجلب قائمةُ الأساتذة…', 'Loading the instructor list…')) + '</div>';
      if (!DATA_FAILED) {
        load(function () {
          if ($('#fc-r-who', root) === inp && norm(inp.value) === q) suggest(root);
        });
      }
      return;
    }
    /*@3.FAPJ.25*/
    if (!DIR && !DIR_FAILED) {
      /*@3.FAPJ.32*/
      loadDir(function () {
        if ($('#fc-r-who', root) === inp && norm(inp.value) === q) suggest(root);
      });
    }
    /*@3.FAPJ.68*/
    var w = qwords(inp.value);
    var hit = (w.length ? DATA.faculty.filter(function (f) {
      var s = f._s || f._k;
      for (var i = 0; i < w.length; i++) if (s.indexOf(w[i]) < 0) return false;
      return true;
    }) : []).slice(0, 8);
    var dir = searchDir(inp.value, hit.length ? 5 : 8);
    if (!hit.length && !dir.length) {
      /*@3.FAPJ.33*/
      box.hidden = false;
      box.innerHTML = '<div class="fc-sug-none">' +
        (DIR || DIR_FAILED
          ? t('لا أحدَ بهذا الاسم. اكتبه كما في البانر ⁦(Alqahtani, Hassan)⁩ أو اكتب بريده.',
              'No one by that name. Type it as Banner shows it (Alqahtani, Hassan) or type their email.')
          : t('يُبحث في دليل الأساتذة…', 'Searching the instructor directory…')) + '</div>';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      hit.map(function (f) {
        /*@3.FAPJ.61*/
        var alt = altNameOf(f);
        return '<button type="button" class="fc-sug-i" data-id="' + esc(f.id) + '"' +
          ' data-nm="' + esc(f.name) + '">' +
          esc(nameOf(f)) +
          (alt ? '<span class="fc-sug-en' + (hasAr(alt) ? '' : ' ltr') + '">' +
            esc(alt) + '</span>' : '') +
          '<span class="fc-sug-n">' + f.n + '</span></button>';
      }).join('') +
      (dir.length
        ? '<div class="fc-sug-h">' +
            t('من دليل البانر — لا تقييماتِ لهم بعد',
              'From the Banner directory — not rated yet') + '</div>' +
          dir.map(function (p) {
            var da = dirAltOf(p);
            return '<button type="button" class="fc-sug-i is-dir" data-dir="' + esc(p.n) + '">' +
              '<span' + (hasAr(dirNameOf(p)) ? '' : ' class="ltr"') + '>' +
                esc(dirNameOf(p)) + '</span>' +
              (da ? '<span class="fc-sug-en' + (hasAr(da) ? '' : ' ltr') + '">' +
                esc(da) + '</span>' : '') +
              '<span class="fc-sug-n fc-sug-n--new">' + t('جديد', 'new') + '</span></button>';
          }).join('')
        : '');
  }

  /*@3.FAPJ.14*/
  function applyPick(root, f) {
    var chosen = $('#fc-r-chosen', root);
    if (!f || !chosen) return;
    var box = $('#fc-r-sug', root), inp = $('#fc-r-who', root);
    if (box) { box.hidden = true; box.innerHTML = ''; }
    if (inp) { inp.value = f.name; inp.hidden = true; }
    $('#fc-r-name', root).value = f.name;
    $('#fc-r-mail', root).value = (f.link && f.link.e) || '';
    chosen.hidden = false;
    chosen.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i>' +
      '<b>' + esc(nameOf(f)) + '</b>' +
      (f.link && f.link.e ? '<span class="fc-go-n ltr">' + esc(f.link.e) + '</span>' : '') +
      '<button type="button" class="fc-r-swap" data-gf-unpick="1">' +
        '<i class="fa-solid fa-rotate-left"></i>' + esc(t('غيّر', 'Change')) + '</button>';
    fillCourses(root, f);
  }

  /*@3.FAPJ.26*/
  function applyDirPick(root, p) {
    var chosen = $('#fc-r-chosen', root);
    if (!p || !chosen) return;
    var box = $('#fc-r-sug', root), inp = $('#fc-r-who', root);
    if (box) { box.hidden = true; box.innerHTML = ''; }
    if (inp) { inp.value = dirNameOf(p); inp.hidden = true; }
    /*@3.FAPJ.53*/
    $('#fc-r-name', root).value = dirSendName(p);
    $('#fc-r-mail', root).value = p.e || '';
    var bn = $('#fc-r-banner', root);
    if (bn) bn.value = p.n;
    chosen.hidden = false;
    chosen.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i>' +
      '<b>' + esc(dirNameOf(p)) + '</b>' +
      (dirAltOf(p) ? '<span class="fc-go-n' + (hasAr(dirAltOf(p)) ? '' : ' ltr') +
        '">' + esc(dirAltOf(p)) + '</span>' : '') +
      '<span class="fc-r-new">' + esc(t('أوّل تقييم', 'first rating')) + '</span>' +
      '<button type="button" class="fc-r-swap" data-gf-unpick="1">' +
        '<i class="fa-solid fa-rotate-left"></i>' + esc(t('غيّر', 'Change')) + '</button>';
  }

  function clearPick(root, keepText) {
    var chosen = $('#fc-r-chosen', root), inp = $('#fc-r-who', root);
    var nm = $('#fc-r-name', root), ml = $('#fc-r-mail', root);
    var bn = $('#fc-r-banner', root);
    if (nm) nm.value = '';
    if (ml) ml.value = '';
    /*@3.FAPJ.34*/
    if (bn) bn.value = '';
    if (chosen) { chosen.hidden = true; chosen.innerHTML = ''; }
    if (inp) {
      inp.hidden = false;
      if (!keepText) { inp.value = ''; try { inp.focus(); } catch (e) {} }
    }
    /*@3.FAPJ.19*/
    var row = $('#fc-r-crs', root);
    if (row) {
      $$('.fc-crs[data-src="f"]', row).forEach(function (x) { x.remove(); });
      row.hidden = !row.children.length;
    }
  }

  function fillCourses(root, f) {
    var row = $('#fc-r-crs', root);
    if (!row) return;
    var have = {};
    $$('.fc-crs', row).forEach(function (x) { have[x.getAttribute('data-crs')] = 1; });
    var cs = f.courses || {};
    var add = Object.keys(cs)
      .sort(function (a, b) { return cs[b] - cs[a]; })
      .filter(function (c) { return !have[c]; })
      .map(function (c) {
        return '<button type="button" class="fc-crs" data-src="f" data-crs="' +
          esc(c) + '">' + esc(c) + '</button>';
      }).join('');
    if (add) row.insertAdjacentHTML('afterbegin', add);
    row.hidden = !row.children.length;
  }

  function send(root, o) {
    var msg = $('#fc-r-msg', root), btn = $('#fc-r-send', root);
    /*@3.FAPJ.54*/
    addTyped(root);
    var nameEl = $('#fc-r-name', root), whoEl = $('#fc-r-who', root);
    /*@3.FAPJ.20*/
    var name = (nameEl && nameEl.value.trim()) || (whoEl ? whoEl.value.trim() : '');
    var mailEl = $('#fc-r-mail', root);
    var email = mailEl ? mailEl.value.trim() : '';
    if (!name && !email) {
      msg.className = 'fc-r-msg is-err';
      msg.textContent = t('اكتب اسم الأستاذ أوّلاً', 'Enter the instructor name first');
      return;
    }
    if (!Object.keys(vals).length) {
      msg.className = 'fc-r-msg is-err';
      msg.textContent = t('أجب عن سؤالٍ واحدٍ على الأقلّ', 'Answer at least one question');
      return;
    }
    var courses = $$('.fc-crs.on', root).map(function (x) { return x.getAttribute('data-crs'); });
    /*@3.FAPJ.15*/
    if (!courses.length && !noCrsWarned) {
      noCrsWarned = true;
      msg.className = 'fc-r-msg is-err';
      msg.textContent = t('لم تختر مادّة — اختر واحدةً، أو اضغط «أرسل» ثانيةً للإرسال بلا مادّة.',
                          'No course picked — pick one, or press Send again to send without it.');
      return;
    }
    /*@3.FAPJ.28*/
    var bnEl = $('#fc-r-banner', root);
    var body = { name: name, email: email, banner: (bnEl && bnEl.value.trim()) || '',
                 courses: courses, comment: $('#fc-r-cm', root).value.trim() };

    /*@3.FAPJ.12*/
    /*@3.FAPJ.38*/
    try {
      if (window.GardenRaterId) Object.assign(body, GardenRaterId.identity());
      else {
        var vk = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
        if (vk && /^v[0-9a-f]{32}$/.test(vk)) body.vault_id = vk;
      }
    } catch (e) { }
    Object.keys(vals).forEach(function (k) { body[k] = vals[k]; });

    /*@3.FAPJ.42*/
    var editing = !!o.editId;
    if (editing) body.id = Number(o.editId);

    btn.disabled = true;
    msg.className = 'fc-r-msg';
    msg.textContent = t('يُرسَل…', 'Sending…');
    window.GardenEv(editing ? 'edit_faculty_rating' : 'rate_faculty', {});
    fetch(API + (editing ? '/v1/faculty/rate/edit' : '/v1/faculty/rate'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        btn.disabled = false;
        if (!x.ok) {
          msg.className = 'fc-r-msg is-err';
          msg.textContent = x.j && x.j.error === 'rate_limited'
            ? t('أرسلتَ تقييماتٍ كثيرةً اليوم — جرّب لاحقاً.', 'Too many ratings today — try later.')
            : t('تعذّر الإرسال، حاول مرّةً أخرى.', 'Could not send, try again.');
          return;
        }
        msg.className = 'fc-r-msg is-ok';
        /*@3.FAPJ.55*/
        var kept = String((x.j && x.j.codes) || '').split('+').filter(Boolean);
        var lost = courses.filter(function (c) { return kept.indexOf(c) < 0; });
        var note = (kept.length || courses.length === 0) && lost.length
          ? ' ' + t('(لم نتعرّف على ' + lost.join('، ') + ' فبقيت كما كتبتَها)',
                    '(we did not recognise ' + lost.join(', ') + ', kept as you wrote it)')
          : '';
        msg.textContent = (editing
          ? t('حُفظ التعديل.', 'Changes saved.')
          : (x.j.duplicate
            ? t('هذا التقييم مُسجَّلٌ سلفاً.', 'This rating was already recorded.')
            : t('شكراً — سُجِّل رأيُك.', 'Thanks — your rating is in.'))) + note;
        DATA = null; FRESH = true;         /*@3.FAPJ.13*/
        /*@3.FAPJ.56*/
        draftDrop(DKEY);
        resetVals();
        setTimeout(function () { o.onSent && o.onSent(); }, 1100);
      })
      .catch(function () {
        btn.disabled = false;
        msg.className = 'fc-r-msg is-err';
        msg.textContent = t('لا اتصال بالخدمة.', 'Service unreachable.');
      });
  }

  window.GardenFaculty = {
    load: load, byEmail: byEmail, byId: byId, byBannerName: byBannerName,
    detailHtml: detailHtml, rateHtml: rateHtml, wire: wire,
    resetVals: resetVals, nameOf: nameOf, tone: tone, ring: ring,
    pickName: pickName, otherName: otherName, altNameOf: altNameOf,
    dirNameOf: dirNameOf, dirAltOf: dirAltOf, latinOf: latinOf,
    data: function () { return DATA; },
    loadDir: loadDir, searchDir: searchDir, dirByName: dirByName,
    dirByEmail: dirByEmail, dirDetailHtml: dirDetailHtml, arLine: arLine,
    nudge: nudge, nudgeT: nudgeT,
    dir: function () { return DIR; }
  };
})();
