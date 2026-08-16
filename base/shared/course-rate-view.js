/*@3.CORVJ.1*/
;(function () {
  'use strict';
  if (window.GardenCourseView) return;

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function flag(k, def) {
    var F = window.GardenFlags;
    var v = F && F.get(k);
    return v === undefined || v === null ? def : v;
  }

  var FIELDS = [
    { k: 'difficulty',   ar: 'الصعوبة',                    en: 'Difficulty' },
    { k: 'weekly_hours', ar: 'ساعاتٌ أسبوعياً خارج المحاضرة', en: 'Weekly hours outside class' },
    { k: 'study_rhythm', ar: 'إيقاعُ المذاكرة',             en: 'Study rhythm' },
    { k: 'load_shape',   ar: 'تكدُّسُ العبء',                en: 'Load shape' },
    { k: 'nature',       ar: 'طبيعةُ المادة',               en: 'Nature', multi: true },
    { k: 'grade_weight', ar: 'أين تكمن الدرجة',            en: 'Where the grade sits' },
    { k: 'q_style',      ar: 'نمطُ الأسئلة',                en: 'Question style', multi: true },
    { k: 'q_source',     ar: 'مصدرُ الأسئلة',               en: 'Question source' },
    { k: 'q_vs_ex',      ar: 'مقارنةً بالتمارين',           en: 'Versus the exercises' },
    { k: 'helped',       ar: 'أنفعُ ما فعله من سبقك',       en: 'What helped them most', multi: true },
  ];

  /*@3.CORVJ.3*/
  function bars(d, multi) {
    return '<div class="cv-bars">' + d.items.map(function (x) {
      return '<div class="cv-bar">' +
        '<span class="cv-bar-l">' + esc(x.v) + '</span>' +
        '<span class="cv-bar-t"><i style="inline-size:' + x.pct + '%"></i></span>' +
        '<span class="cv-bar-p">' + x.pct + '%</span>' +
      '</div>';
    }).join('') +
    '<p class="cv-den">' + esc(t('من ' + d.n + ' أجابوا عن هذا السؤال', 'of ' + d.n + ' who answered this')) +
      (multi ? ' · ' + esc(t('اختيارٌ متعدّد — المجموعُ يتجاوز ١٠٠٪', 'Multi-select — total exceeds 100%')) : '') +
    '</p></div>';
  }

  /*@3.CORVJ.14*/
  var WHYS = [
    ['spam', 'إعلانٌ أو تكرار', 'Spam'],
    ['wrong', 'معلومةٌ خاطئة', 'Wrong'],
    ['rude', 'إساءة', 'Abusive'],
    ['personal', 'يكشف هويّة', 'Doxxing'],
    ['broken', 'رابطٌ معطوب', 'Broken link'],
  ];

  /*@3.CORVJ.15*/
  function repBtn(kind, i) {
    if (flag('ratings.course.reportsOn', true) === false) return '';
    return '<button type="button" class="gsf-btn gsf-btn--ghost cv-rep" ' +
      'data-rep-k="' + esc(kind) + '" data-rep-i="' + i + '" ' +
      'title="' + esc(t('أبلغْ عن هذا', 'Report this')) + '" ' +
      'aria-label="' + esc(t('أبلغْ عن هذا', 'Report this')) + '">' +
      '<i class="fa-solid fa-flag" aria-hidden="true"></i></button>';
  }

  function texts(list, title, cls, kind) {
    if (!list || !list.length) return '';
    return '<div class="cv-block">' +
      '<h4 class="cv-h4">' + esc(title) + '</h4>' +
      list.slice(0, 12).map(function (x, i) {
        return '<blockquote class="cv-q ' + cls + '">' + esc(x.t) +
          repBtn(kind, i) + '</blockquote>';
      }).join('') + '</div>';
  }

  function links(list) {
    if (!list || !list.length) return '';
    return '<div class="cv-block"><h4 class="cv-h4">' +
      esc(t('مصادرُ رشّحها من درسها', 'Resources recommended by past students')) + '</h4>' +
      '<ul class="cv-links">' + list.slice(0, 20).map(function (x, i) {
        return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer nofollow">' +
          '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ' +
          esc(x.title || x.url) + '</a>' +
          (x.kind ? ' <span class="cv-kind">' + esc(x.kind) + '</span>' : '') +
          repBtn('resource', i) +
          (x.why ? '<p class="cv-why">' + esc(x.why) + '</p>' : '') + '</li>';
      }).join('') + '</ul></div>';
  }

  /*@3.CORVJ.2*/
  function verdict(agg, min) {
    var d = agg.difficulty;
    if (!d || !d.items.length) return '';
    if (agg.n < min) {
      return '<div class="cv-verdict is-soft">' +
        '<span class="cv-verdict-n">' + esc(t('لم تُعلَن بعد', 'Not declared yet')) + '</span>' +
        '<p>' + esc(t(
          'الصعوبةُ لا تُعلَن قبل ' + min + ' تقييماً — وعندنا ' + agg.n + '. وما تحت يُقرأ كآراءٍ لا كحكم.',
          'Difficulty is not declared below ' + min + ' ratings — we have ' + agg.n +
          '. What follows reads as opinions, not a verdict.')) + '</p></div>';
    }
    return '<div class="cv-verdict">' +
      '<span class="cv-verdict-n">' + esc(d.items[0].v) + '</span>' +
      '<p>' + esc(t(
        d.items[0].pct + '٪ من ' + d.n + ' قالوها',
        d.items[0].pct + '% of ' + d.n + ' said so')) + '</p></div>';
  }

  function render(box, code, agg) {
    var min = Number(flag('ratings.course.publicMin', 50)) || 50;
    var can = flag('ratings.course.enabled', true) !== false;
    var btn = can
      ? '<button type="button" class="gsf-btn gsf-btn--go" data-cv-rate="' + esc(code) + '">' +
          '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> ' +
          esc(t('شاركْ رأيك', 'Add your take')) + '</button>'
      : '';

    if (!agg || !agg.n) {
      box.innerHTML = '<div class="cv cv-empty">' +
        '<p>' + esc(t('لا أحدَ قيّم هذه المادةَ بعد. كنْ أوّلَ من يكتب لمن يأتي بعدك.',
                      'Nobody has rated this course yet. Be the first for whoever comes next.')) + '</p>' +
        btn + '</div>';
      return;
    }

    var body = verdict(agg, min) +
      (agg.small ? '<p class="cv-small"><i class="fa-solid fa-flask-vial" aria-hidden="true"></i> ' +
        esc(t('عيّنةٌ صغيرة (' + agg.n + ' من ' + agg.small_at + ') — النسبُ تُقرأ بحذر.',
              'Small sample (' + agg.n + ' of ' + agg.small_at + ') — read the percentages with care.')) +
        '</p>' : '');

    FIELDS.forEach(function (f) {
      var d = agg[f.k];
      if (!d || !d.items || !d.items.length) return;
      body += '<div class="cv-block"><h4 class="cv-h4">' + esc(isAr() ? f.ar : f.en) + '</h4>' +
        bars(d, !!f.multi) + '</div>';
    });

    body += texts(agg.explains, t('ما هذه المادةُ فعلاً؟', 'What is this course really?'), 'is-explain', 'explain');
    body += texts(agg.advices, t('نصائحُ من سبقك', 'Advice from past students'), 'is-advice', 'advice');
    body += links(agg.resources);

    box.innerHTML = '<div class="cv">' + body + '<div class="cv-foot">' + btn + '</div></div>';
    /*@3.CORVJ.21*/
    box.__cvAgg = agg;
  }

  function load(box, code, term) {
    if (!API || !box) return;
    box.innerHTML = '<p class="cv-load">' + esc(t('يُحمَّل…', 'Loading…')) + '</p>';
    fetch(API + '/v1/courses/' + encodeURIComponent(code) + '/rating' +
          (term ? '?term=' + encodeURIComponent(term) : ''), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.ok) throw new Error('bad');
        render(box, code, j);
      })
      .catch(function () {
        box.innerHTML = '<p class="cv-err">' +
          esc(t('تعذّر تحميلُ آراء الطلاب.', 'Could not load student takes.')) + '</p>';
      });
  }

  function mount(o) {
    o = o || {};
    var box = typeof o.into === 'string' ? document.getElementById(o.into) : o.into;
    var code = String(o.code || '').toUpperCase();
    if (!box || !code) return;
    box.setAttribute('data-cv-box', code);
    if (o.term) box.setAttribute('data-cv-term', o.term);
    load(box, code, o.term);
    return { reload: function () { load(box, code, o.term); } };
  }

  /*@3.CORVJ.16*/
  function fp(s) {
    var enc = new TextEncoder().encode(String(s == null ? '' : s).trim());
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      var a = Array.prototype.map.call(new Uint8Array(buf), function (x) {
        return ('0' + x.toString(16)).slice(-2);
      });
      return a.join('').slice(0, 32);
    });
  }

  /*@3.CORVJ.17*/
  function repContent(box, kind, i) {
    var agg = box && box.__cvAgg;
    if (!agg) return null;
    if (kind === 'resource') {
      var r = (agg.resources || [])[i];
      return r ? r.url : null;
    }
    var l = (kind === 'explain' ? agg.explains : agg.advices) || [];
    return l[i] ? l[i].t : null;
  }

  /*@3.CORVJ.18*/
  function repRow(btn) {
    var host = btn.parentNode;
    var old = host.querySelector('.cv-repbox');
    if (old) { old.parentNode.removeChild(old); return; }
    var d = document.createElement('div');
    d.className = 'cv-repbox';
    d.innerHTML = '<span class="cv-repq">' + esc(t('ما الخطب؟', 'What is wrong?')) + '</span>' +
      WHYS.map(function (w) {
        return '<button type="button" class="gsf-chip cv-repw" data-w="' + esc(w[0]) + '">' +
          esc(isAr() ? w[1] : w[2]) + '</button>';
      }).join('');
    host.appendChild(d);
  }

  /*@3.CORVJ.19*/
  function repSend(box, kind, i, why, host) {
    var code = box.getAttribute('data-cv-box');
    var text = repContent(box, kind, i);
    if (!text || !API) return;
    var say = function (msg) {
      host.innerHTML = '<span class="cv-repdone">' + esc(msg) + '</span>';
    };
    say(t('يُرسَل…', 'Sending…'));
    fp(text).then(function (h) {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      return fetch(API + '/v1/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: kind, code: code, target: h, why: why,
          vault: (k && /^v[0-9a-f]{32}$/.test(k)) ? k : undefined,
        }),
      });
    }).then(function (r) {
      say(r && r.ok ? t('وصل بلاغُك — يُراجَع يدوياً.', 'Report received — reviewed by a human.')
                    : t('تعذّر الإرسال.', 'Could not send.'));
    }).catch(function () { say(t('تعذّر الإرسال.', 'Could not send.')); });
  }

  document.addEventListener('click', function (e) {
    /*@3.CORVJ.20*/
    var rb = e.target.closest && e.target.closest('.cv-rep');
    if (rb) { repRow(rb); return; }
    var rw = e.target.closest && e.target.closest('.cv-repw');
    if (rw) {
      var host = rw.parentNode;
      var owner = host.parentNode.querySelector('.cv-rep');
      var box2 = rw.closest('[data-cv-box]');
      if (owner && box2) {
        repSend(box2, owner.getAttribute('data-rep-k'),
                Number(owner.getAttribute('data-rep-i')), rw.getAttribute('data-w'), host);
      }
      return;
    }

    var b = e.target.closest && e.target.closest('[data-cv-rate]');
    if (!b || !window.GardenCourseRate) return;
    var code = b.getAttribute('data-cv-rate');
    GardenCourseRate.open({
      code: code,
      name: (window.GardenData && GardenData.courseInfo && GardenData.courseInfo(code) &&
             (isAr() ? GardenData.courseInfo(code).name_ar : GardenData.courseInfo(code).name_en)) || code,
      onSaved: function () {
        document.querySelectorAll('[data-cv-box]').forEach(function (el) {
          load(el, el.getAttribute('data-cv-box'), el.getAttribute('data-cv-term'));
        });
      },
    });
  });

  /*@3.CORVJ.7*/
  /*@3.CORVJ.4*/
  var _brief = {}, _briefWait = {};
  function brief(codes) {
    var want = [], out = {};
    (codes || []).forEach(function (c) {
      c = String(c || '').toUpperCase();
      if (!/^[A-Z]{2,4}[0-9]{2,4}$/.test(c)) return;
      if (_brief[c]) out[c] = _brief[c];
      else if (!_briefWait[c]) want.push(c);
    });
    var pend = Object.keys(_briefWait).filter(function (c) { return codes.indexOf(c) >= 0; })
      .map(function (c) { return _briefWait[c]; });
    if (!want.length) return Promise.all(pend).then(function () { return pick(codes); });

    var p = fetch(API + '/v1/courses/ratings/brief?codes=' + encodeURIComponent(want.join(',')),
                  { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        /*@3.CORVJ.8*/
        want.forEach(function (c) {
          _brief[c] = (j && j.rows && j.rows[c]) || { n: 0, small: true, declared: false, top: null, pct: 0 };
          delete _briefWait[c];
        });
      })
      .catch(function () { want.forEach(function (c) { delete _briefWait[c]; }); });
    want.forEach(function (c) { _briefWait[c] = p; });
    return Promise.all(pend.concat([p])).then(function () { return pick(codes); });
  }
  function pick(codes) {
    var out = {};
    (codes || []).forEach(function (c) {
      c = String(c || '').toUpperCase();
      if (_brief[c]) out[c] = _brief[c];
    });
    return out;
  }

  /*@3.CORVJ.9*/
  /*@3.CORVJ.10*/
  /*@3.CORVJ.5*/
  function takes(n) {
    if (!isAr()) return n + (n === 1 ? ' take' : ' takes');
    if (n === 1) return 'رأيٌ واحد';
    if (n === 2) return 'رأيان';
    if (n <= 10) return n + ' آراء';
    return n + ' رأياً';
  }

  function chip(code, b, opts) {
    b = b || _brief[String(code || '').toUpperCase()];
    if (!b || !b.n) return '';
    /*@3.CORVJ.11*/
    var flat = !!(opts && opts.flat);
    var txt = b.declared ? esc(b.top) + ' · ' + b.pct + '%' : esc(takes(b.n));
    var tip = b.declared
      ? t(b.pct + '٪ من ' + b.n + ' قالوا «' + b.top + '»', b.pct + '% of ' + b.n + ' said “' + b.top + '”')
      /*@3.CORVJ.12*/
      : (flat ? t('لم تُعلَن الصعوبةُ بعد — التفصيلُ في صفحة المادة',
                  'Difficulty not declared yet — details on the course page')
              : t('لم تُعلَن الصعوبةُ بعد — اضغط لتقرأ ما قالوه بمقاماته',
                  'Difficulty not declared yet — tap to read the takes with their denominators'));
    var inner = '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>' + txt;
    var cls = 'cv-chip' + (b.declared ? ' is-on' : '') + (flat ? ' is-flat' : '');
    return flat
      ? '<span class="' + cls + '" title="' + esc(tip) + '">' + inner + '</span>'
      : '<button type="button" class="' + cls + '" data-cv-open="' + esc(code) +
        '" title="' + esc(tip) + '">' + inner + '</button>';
  }

  /*@3.CORVJ.13*/
  /*@3.CORVJ.6*/
  var vdlg = null;
  function openDetail(code) {
    code = String(code || '').toUpperCase();
    if (!vdlg) {
      vdlg = document.createElement('dialog');
      vdlg.className = 'gsf cvx';
      vdlg.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div><form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
        esc(t('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></form>' +
        '<header class="cvx-head gsf-head"><h2></h2><p class="cvx-sub gsf-sub"></p></header>' +
        '<div class="cvx-body gsf-body"></div>';
      document.body.appendChild(vdlg);
    }
    vdlg.querySelector('.cvx-head h2').textContent = t('كيف هي المادة؟', 'How is this course?');
    var nm = (window.GardenData && GardenData.courseInfo && GardenData.courseInfo(code)) || null;
    vdlg.querySelector('.cvx-sub').innerHTML = '<span class="gsf-code">' + esc(code) + '</span> ' +
      esc(nm ? (isAr() ? nm.name_ar : (nm.name_en || nm.name_ar)) : '');
    var box = vdlg.querySelector('.cvx-body');
    box.setAttribute('data-cv-box', code);
    if (!vdlg.open) vdlg.showModal();
    load(box, code);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cv-open]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    openDetail(b.getAttribute('data-cv-open'));
  });

  document.addEventListener('garden:languageChanged', function () {
    document.querySelectorAll('[data-cv-box]').forEach(function (el) {
      load(el, el.getAttribute('data-cv-box'), el.getAttribute('data-cv-term'));
    });
  });

  window.GardenCourseView = {
    mount: mount, brief: brief, chip: chip, open: openDetail,
  };
})();
