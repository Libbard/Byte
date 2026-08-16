/*@3.CORJ.1*/
;(function () {
  'use strict';
  if (window.GardenCourseRate) return;

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.CORJ.2*/
  var TOK_KEY = 'gd_crate_tok';
  function localToken() {
    var v = '';
    try { v = localStorage.getItem(TOK_KEY) || ''; } catch (e) { }
    if (/^[A-Za-z0-9_-]{20,80}$/.test(v)) return v;
    var a = new Uint8Array(24);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a)
      : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    v = btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try { localStorage.setItem(TOK_KEY, v); } catch (e) { }
    return v;
  }
  /*@3.CORJ.57*/
  function identity() {
    if (window.GardenRaterId) return GardenRaterId.identity();
    var out = {};
    try {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      if (k && /^v[0-9a-f]{32}$/.test(k)) { out.vault_id = k; return out; }
    } catch (e) { }
    out.local_token = localToken();
    return out;
  }
  function synced() { return !!identity().vault_id; }

  function post(sub, body) {
    return fetch(API + sub, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); });
  }

  /*@3.CORJ.3*/
  var TERM_AR = { First: 'الفصل الأول', Second: 'الفصل الثاني', Third: 'الفصل الثالث', Summer: 'الصيفي' };
  function termLabel(x) {
    var d = String(x.description || '');
    var m = d.match(/(First|Secon(?:d)?|Third|Summer)\s*Term\s*(\d{4})\s*-\s*(\d{4})/i);
    if (!m) return x.term;
    var kind = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    if (kind === 'Secon') kind = 'Second';
    return (isAr() ? TERM_AR[kind] : kind + ' Term') + ' · ' + m[2] + '–' + m[3];
  }
  function fallbackTerms() {
    var y = new Date().getFullYear(), out = [];
    for (var i = 0; i < 3; i++) {
      for (var s = 3; s >= 1; s--) {
        out.push({ term: String(y - i) + s + '0',
                   label: t('الفصل ', 'Term ') + s + ' · ' + (y - i) });
      }
    }
    return out;
  }
  var _terms = null;
  function loadTerms() {
    if (_terms) return Promise.resolve(_terms);
    return fetch(API + '/v1/terms', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var ts = (j && (j.terms || j.rows)) || [];
        _terms = ts.length
          ? ts.map(function (x) { return { term: x.term, label: termLabel(x) }; })
          : fallbackTerms();
        return _terms;
      })
      .catch(function () { _terms = fallbackTerms(); return _terms; });
  }

  /*@3.CORJ.4*/
  var _opts = null;
  function loadOpts() {
    if (_opts) return Promise.resolve(_opts);
    return fetch(API + '/v1/courses/opts', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (!j || !j.ok) throw new Error('opts'); _opts = j; return j; });
  }

  /*@3.CORJ.5*/
  var EN = {
    'سهلة جدا': 'Very easy', 'سهلة': 'Easy', 'متوسطة': 'Moderate', 'صعبة': 'Hard', 'صعبة جدا': 'Very hard',
    '<2': '< 2 h', '2-4': '2–4 h', '5-8': '5–8 h', '9-12': '9–12 h', '>12': '> 12 h',
    'اول باول': 'Keep up weekly', 'اسبوعيا': 'Weekly is enough', 'مكثفة قبل الاختبار': 'Cram before exams',
    'يتوزع بانتظام': 'Evenly spread', 'يتكدس قليلا': 'Slightly bunched', 'يتكدس قبل الاختبارات': 'Bunched before exams',
    'النهائي يحسمها': 'Final decides', 'الاعمال والتسليمات': 'Coursework', 'الكويزات المتكررة': 'Frequent quizzes', 'موزعة بعدل': 'Evenly weighted',
    'من الشرائح': 'From slides', 'من الكتاب': 'From the book', 'بنك اسئلة متكرر': 'Recurring bank', 'جديدة كل فصل': 'New each term', 'لا اعرف': "Don't know",
    'اسهل': 'Easier', 'مثلها': 'Same', 'اصعب': 'Harder',
    'فهم وتحليل': 'Understanding', 'حفظ واستظهار': 'Memorization', 'تطبيق وبرمجة': 'Coding', 'حسابات ورياضيات': 'Math',
    'مشاريع وتسليمات': 'Projects', 'مفاهيم جديدة تحتاج وقتا': 'New concepts', 'قراءة كثيرة': 'Heavy reading',
    'اختيار من متعدد': 'Multiple choice', 'صح وخطا': 'True/False', 'مسائل حسابية': 'Calculations',
    'كتابة كود': 'Write code', 'تتبع مخرجات': 'Trace output', 'تحليل ومقالي': 'Essay',
    'حل اسئلة سابقة': 'Past papers', 'تلخيص الشرائح': 'Summarizing', 'شروحات مرئية': 'Video explainers',
    'تطبيق عملي': 'Hands-on', 'مجموعة دراسة': 'Study group', 'قراءة الكتاب': 'Reading the book', 'حل التمارين مرتين': 'Exercises twice',
    'فيديو': 'Video', 'كتاب': 'Book', 'موقع': 'Site', 'ملخص': 'Summary', 'قناة': 'Channel'
  };
  function lbl(v) { return isAr() ? v : (EN[v] || v); }

  /*@3.CORJ.32*/
  function tone(i, n) {
    if (n < 2) return 0;
    return 1 + Math.round((i / (n - 1)) * 4);
  }

  /*@3.CORJ.6*/
  function chips(name, list, multi, cur, scale) {
    var sel = multi ? (cur || []) : (cur ? [cur] : []);
    var n = list.length;
    return '<div class="gsf-chips" data-f="' + esc(name) + '" data-multi="' + (multi ? '1' : '') + '">' +
      list.map(function (v, i) {
        var on = sel.indexOf(v) >= 0;
        var tn = scale ? tone(i, n) : 0;
        return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" ' +
          (tn ? 'data-tone="' + tn + '" ' : '') +
          'data-v="' + esc(v) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          esc(lbl(v)) + '</button>';
      }).join('') + '</div>';
  }

  function field(label, inner, hint, req) {
    return '<div class="crx-f">' +
      '<label class="crx-l">' + esc(label) +
        (req ? '<span class="crx-req" title="' + esc(t('إلزاميّ', 'Required')) + '"><i class="fa-solid fa-asterisk" aria-hidden="true"></i></span>' : '') +
      '</label>' +
      (hint ? '<p class="crx-hint">' + hint + '</p>' : '') + inner + '</div>';
  }
  /*@3.CORJ.33*/
  function sec(title, body, note, icon) {
    return '<section class="gsf-card crx-sec">' +
      '<h3 class="gsf-card-h">' +
        (icon ? '<i class="fa-solid fa-' + icon + '" aria-hidden="true"></i>' : '') +
        esc(title) + '</h3>' +
      (note ? '<p class="crx-note">' + note + '</p>' : '') + body + '</section>';
  }

  /*@3.CORJ.7*/
  var dlg = null, ctx = null, state = null, _armed = false;

  /*@3.CORJ.58*/
  var DKEY = null, DTIMER = null;
  var DFIELDS = ['term', 'instructor', 'advice', 'explain', 'difficulty', 'weekly_hours',
                 'study_rhythm', 'load_shape', 'grade_weight', 'q_source', 'q_vs_ex',
                 'grade', 'nature', 'q_style', 'helped', 'took_it'];

  function draftGet() {
    try { return (window.GardenDraft && DKEY && GardenDraft.get(DKEY)) || null; } catch (e) { return null; }
  }
  function draftDrop() {
    try { if (window.GardenDraft && DKEY) GardenDraft.clear(DKEY); } catch (e) {}
  }
  /*@3.CORJ.59*/
  function draftSave() {
    if (!DKEY || !window.GardenDraft) return;
    clearTimeout(DTIMER);
    DTIMER = setTimeout(function () {
      if (!dlg || !state || !dlg.querySelector('.crx-foot') ||
          dlg.querySelector('.crx-foot').hidden) return;
      var b;
      try { readRes(); b = collect(); } catch (e) { return; }
      var v = {}, any = false;
      DFIELDS.forEach(function (k) {
        var x = b[k];
        if (x === null || x === undefined || x === '') return;
        if (Array.isArray(x) && !x.length) return;
        v[k] = x; any = true;
      });
      var res = (b.resources || []).filter(function (r) { return r.url; });
      try { GardenDraft.set(DKEY, (any || res.length) ? { vals: v, res: res } : null); } catch (e) {}
    }, 350);
  }

  function outside(e) {
    var r = dlg.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    return e.clientX < r.left || e.clientX > r.right ||
           e.clientY < r.top  || e.clientY > r.bottom;
  }

  /*@3.CORJ.24*/
  /*@3.CORJ.60*/
  function flushDraft() {
    if (!state || !state.dirty) return;
    clearTimeout(DTIMER);
    DTIMER = null;
    if (!DKEY || !window.GardenDraft) return;
    var b;
    try { readRes(); b = collect(); } catch (e) { return; }
    var v = {}, any = false;
    DFIELDS.forEach(function (k) {
      var x = b[k];
      if (x === null || x === undefined || x === '') return;
      if (Array.isArray(x) && !x.length) return;
      v[k] = x; any = true;
    });
    var res = (b.resources || []).filter(function (r) { return r.url; });
    try { GardenDraft.set(DKEY, (any || res.length) ? { vals: v, res: res } : null); } catch (e) {}
  }

  function ensureDlg() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'gsf crx';
    /*@3.CORJ.8*/
    /*@3.CORJ.61*/
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
        esc(t('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></form>' +
      '<div class="crx-body gsf-body"></div>' +
      /*@3.CORJ.37*/
      '<footer class="gsf-foot crx-foot" hidden></footer>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', onClick);
    /*@3.CORJ.21*/
    dlg.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute('data-f') === 'term') drawInsRes();
    });
    /*@3.CORJ.52*/
    dlg.addEventListener('pointerdown', function (e) {
      var box = dlg.querySelector('.crx-ins-box');
      if (!box || !e.target || box.contains(e.target)) return;
      insShut();
    });
    /*@3.CORJ.43*/
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !e.target || !e.target.hasAttribute) return;
      if (!e.target.hasAttribute('data-ins-free-in')) return;
      e.preventDefault();
      pickFree(e.target.value);
    });
    /*@3.CORJ.9*/
    /*@3.CORJ.23*/
    /*@3.CORJ.62*/
    dlg.addEventListener('mousedown', function (e) { _armed = (e.button === 0 && outside(e)); }, true);
    dlg.addEventListener('click', function (e) {
      var was = _armed; _armed = false;
      if (!was || !outside(e)) return;
      flushDraft();
      dlg.close();
    }, true);
    dlg.addEventListener('close', flushDraft);
    return dlg;
  }

  /*@3.CORJ.63*/
  function baseState() {
    var mine = state.existing;
    if (mine) {
      state.vals = {
        term: mine.term, difficulty: mine.difficulty, weekly_hours: mine.weekly_hours,
        study_rhythm: mine.study_rhythm, load_shape: mine.load_shape, nature: mine.nature || [],
        grade_weight: mine.grade_weight, q_style: mine.q_style || [], q_source: mine.q_source,
        q_vs_ex: mine.q_vs_ex, helped: mine.helped || [], grade: mine.grade,
        instructor: mine.instructor, took_it: mine.took_it,
        advice: mine.advice, explain: mine.explain,
      };
      state.res = (mine.resources || []).map(function (x) {
        return { title: x.title, url: x.url, kind: x.kind, why: x.why };
      });
    } else {
      /*@3.CORJ.70*/
      state.vals = { term: validTerm(ctx.term), nature: [], q_style: [], helped: [],
                     instructor: ctx.instructor || '' };
      state.res = [];
    }
  }

  /*@3.CORJ.71*/
  function validTerm(v) {
    if (!v || !_terms) return v || '';
    for (var i = 0; i < _terms.length; i++) if (_terms[i].term === v) return v;
    return '';
  }

  /*@3.CORJ.64*/
  function resetForm() {
    draftDrop();
    clearTimeout(DTIMER);
    state.kept = false;
    state.dirty = false;
    baseState();
    if (_opts && _terms) render(_opts, _terms);
  }

  function open(o) {
    o = o || {};
    if (!API) { alert(t('الخدمةُ غير متاحة الآن.', 'Service unavailable.')); return; }
    ctx = { code: String(o.code || '').toUpperCase(), name: o.name || o.code, term: o.term || '',
            instructor: o.instructor || '', onSaved: o.onSaved };
    state = { dirty: false, vals: {}, res: [], existing: null, kept: false };
    DKEY = 'c:' + ctx.code;
    var d = ensureDlg();
    d.querySelector('.crx-foot').hidden = true;
    d.querySelector('.crx-body').innerHTML = '<p class="crx-load">' + esc(t('يُحمَّل…', 'Loading…')) + '</p>';
    if (!d.open) d.showModal();

    Promise.all([loadOpts(), loadTerms(), post('/v1/courses/rate/mine',
      Object.assign({ course_code: ctx.code }, identity()))])
      .then(function (r) {
        var mine = r[2] && r[2].j && r[2].j.rating;
        state.existing = mine || null;
        baseState();
        /*@3.CORJ.65*/
        var dft = draftGet();
        if (dft) {
          if (dft.vals) Object.assign(state.vals, dft.vals);
          if (dft.res && dft.res.length) state.res = dft.res;
          state.kept = true;
        }
        render(r[0], r[1]);
      })
      .catch(function () {
        d.querySelector('.crx-body').innerHTML =
          '<p class="crx-err">' + esc(t('تعذّر التحميل. جرّب لاحقاً.', 'Could not load. Try later.')) + '</p>';
      });
  }

  function render(opts, terms) {
    var v = state.vals, O = opts.one, M = opts.multi;
    var body =
      '<header class="crx-head">' +
        '<h2>' + esc(t('كيف هي المادة؟', 'How is this course?')) + '</h2>' +
        '<p class="crx-sub"><span class="gsf-code">' + esc(ctx.code) + '</span> ' + esc(ctx.name) + '</p>' +
        (state.existing
          ? '<p class="crx-edit">' + esc(t('تعدّل تقييمَك السابق — ويمكنك سحبُه في أيِّ وقت.',
              'Editing your earlier rating — you can withdraw it any time.')) + '</p>'
          : '') +
      '</header>' +

      sec(t('متى ومع من', 'When and with whom'),
        field(t('الفصل الذي درستَها فيه', 'Term you took it'),
          '<select class="gsf-in" data-gs data-f="term">' +
            '<option value="">' + esc(t('اختر…', 'Choose…')) + '</option>' +
            terms.map(function (x) {
              return '<option value="' + esc(x.term) + '"' +
                (v.term === x.term ? ' selected' : '') + '>' + esc(x.label) + '</option>';
            }).join('') + '</select>',
          t('به تشيخ التقييمات — فرأيُ فصلٍ مضى لا يُقرأ كرأي هذا الفصل.',
            'Ratings age by term — an old term is not read as today.'), true) +

        field(t('الدكتور (اختياريّ)', 'Instructor (optional)'),
          '<div class="crx-ins" data-ins>' +
            '<input class="gsf-in" type="hidden" data-f="instructor" value="' + esc(v.instructor || '') + '">' +
            '<div class="crx-ins-box"></div>' +
          '</div>',
          /*@3.CORJ.10*/
          t('<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>لا يدخل مؤشّرَ الصعوبة إطلاقاً.</b> «صعبةٌ مع فلان» ليست صعوبةَ مادّة — وللأساتذة صفحتُهم.',
            '<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>Never affects the difficulty score.</b> Instructors have their own page.')),
        '', 'calendar-day') +

      sec(t('أنهيتَها ودرجتُك', 'Finished it & your grade'),
        field(t('أنهيتَها؟', 'Finished it?'),
          chips('took_it', ['نعم', 'لا زلت فيها'], false,
            v.took_it === true ? 'نعم' : v.took_it === false ? 'لا زلت فيها' : null)) +

        field(t('درجتُك (اختياريّة)', 'Your grade (optional)'),
          chips('grade', O.grade, false, v.grade, true),
          /*@3.CORJ.11*/
          t('<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>تُخزَّن ولا تُعرض أبداً — لا لك ولا لغيرك.</b> حضورُها وحدَه يرفع وزنَ تقييمك، وقيمتُها لا تُقرأ ولا تُجمَّع.',
            '<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>Stored, never shown.</b> Its presence raises your weight; its value is never read.')),
        '', 'flag-checkered') +

      sec(t('الصعوبة والعبء', 'Difficulty & load'),
        field(t('الصعوبة', 'Difficulty'), chips('difficulty', O.difficulty, false, v.difficulty, true), '', true) +
        field(t('ساعاتٌ أسبوعياً خارج المحاضرة', 'Weekly hours outside class'),
          chips('weekly_hours', O.weekly_hours, false, v.weekly_hours, true)) +
        field(t('إيقاعُ المذاكرة', 'Study rhythm'),
          chips('study_rhythm', O.study_rhythm, false, v.study_rhythm, true),
          t('أنفعُ سؤالٍ هنا: <b>توزُّعُ</b> العبء يقول عن الصعوبة أكثرَ من <b>مجموع</b> الساعات.',
            'The most useful question: how work is <b>spread</b> matters more than total hours.')) +
        field(t('تكدُّسُ العبء', 'Load shape'), chips('load_shape', O.load_shape, false, v.load_shape, true)),
        '', 'gauge-high') +

      sec(t('طبيعةُ المادة', 'Nature'),
        field(t('اختر حتى ثلاثة', 'Pick up to three'),
          chips('nature', M.nature.opts, true, v.nature)),
        '', 'shapes') +

      sec(t('الاختبارات والدرجة', 'Exams & grading'),
        field(t('أين تكمن الدرجة', 'Where the grade sits'),
          chips('grade_weight', O.grade_weight, false, v.grade_weight)) +
        field(t('نمطُ الأسئلة', 'Question style'), chips('q_style', M.q_style.opts, true, v.q_style)) +
        field(t('مصدرُ الأسئلة', 'Question source'), chips('q_source', O.q_source, false, v.q_source)) +
        field(t('صعوبتُها مقارنةً بالتمارين', 'Versus the exercises'),
          chips('q_vs_ex', O.q_vs_ex, false, v.q_vs_ex, true)),
        '', 'file-pen') +

      sec(t('كيف تُذاكَر', 'How to study it'),
        field(t('أنفعُ ما فعلتَ', 'What helped most'), chips('helped', M.helped.opts, true, v.helped)) +
        field(t('نصيحةٌ لمن سيأخذها', 'Advice for the next student'),
          '<textarea class="gsf-in gsf-ta" data-f="advice" rows="3" maxlength="300">' +
            esc(v.advice || '') + '</textarea>'),
        '', 'lightbulb') +

      sec(t('اشرح المادةَ بكلماتك', 'Explain it in your words'),
        field(t('ما هذه المادةُ فعلاً؟', 'What is this course really?'),
          '<textarea class="gsf-in gsf-ta" data-f="explain" rows="4" maxlength="500">' +
            esc(v.explain || '') + '</textarea>',
          t('أوّلُ ما يقرؤه زميلُك.', 'The first thing your classmate reads.')),
        '', 'comment-dots') +

      sec(t('مصادرُ التعلّم', 'Learning resources'),
        '<div class="crx-res"></div>' +
        '<button type="button" class="crx-addres">+ ' + esc(t('أضف مصدراً', 'Add a resource')) + '</button>',
        t('يوتيوب يظهر مباشرةً، وما عداه ينتظر مراجعةً قبل أن يراه غيرُك.',
          'YouTube appears immediately; other links await review.'), 'link');

    /*@3.CORJ.44*/
    var foot =
        '<p class="crx-msg" aria-live="polite"></p>' +
        (synced() ? '' :
          '<p class="crx-warn">' + esc(t(
            'لا مزامنةَ على هذا الجهاز — تقييمُك يُحفظ، ولكنّ تعديلَه لاحقاً مرتبطٌ بهذا المتصفّح وحدَه.',
            'No sync on this device — your rating saves, but editing it later works only in this browser.')) +
          '</p>') +
        /*@3.CORJ.66*/
        (state.kept
          ? '<p class="crx-kept"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>' +
            esc(t('أعدنا ما كتبتَه ولم تُرسله بعد.',
                  'We brought back what you had not sent yet.')) + '</p>'
          : '') +
        '<div class="gsf-acts">' +
          (state.existing
            ? '<button type="button" class="gsf-btn gsf-btn--danger" data-a="withdraw">' +
                esc(t('اسحبْ تقييمي', 'Withdraw')) + '</button>' : '') +
          /*@3.CORJ.67*/
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="reset">' +
            esc(t('ابدأ من جديد', 'Start over')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-a="save">' +
            esc(state.existing ? t('احفظِ التعديل', 'Save changes') : t('أرسلْ تقييمي', 'Send')) +
          '</button>' +
        '</div>';

    dlg.querySelector('.crx-body').innerHTML = body;
    var fx = dlg.querySelector('.crx-foot');
    fx.innerHTML = foot;
    fx.hidden = false;
    drawRes();
    loadIns();
    gsEnhance();
  }

  /*@3.CORJ.27*/
  function gsEnhance() {
    if (window.GardenSelect && GardenSelect.enhance) GardenSelect.enhance(dlg);
  }

  /*@3.CORJ.22*/
  /*@3.CORJ.20*/
  var _ins = null;
  function loadIns() {
    var box = dlg.querySelector('.crx-ins-box');
    if (!box) return;
    if (_ins && _ins.code === ctx.code) { drawIns(); return; }
    box.innerHTML = '<p class="crx-ins-load">' + esc(t('يُجلب أساتذةُ المادة…', 'Loading instructors…')) + '</p>';
    fetch(API + '/v1/course/' + encodeURIComponent(ctx.code) + '/faculty', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        _ins = { code: ctx.code, list: (j && j.faculty) || [], terms: (j && j.terms) || {} };
        drawIns();
      })
      .catch(function () { _ins = { code: ctx.code, list: [], terms: {} }; drawIns(); });
  }

  /*@3.CORJ.45*/
  var _dir = null, _dirBusy = false;
  /*@3.CORJ.54*/
  function loadDir(then) {
    if (_dir) { then && then(); return; }
    if (_dirBusy) return;
    _dirBusy = true;
    var rated = null, banner = null;
    function join() {
      if (rated === null || banner === null) return;
      _dirBusy = false;
      var out = [], seen = {};
      rated.forEach(function (f) {
        var e = { n: (f.link && f.link.n) || f.en || f.name, a: f.name || '',
                  e: f.en || '', c: 0, t: [], dir: 1 };
        seen[dirKey(e)] = 1;
        out.push(e);
      });
      banner.forEach(function (p) {
        var e = { n: p.n, a: p.a || '', e: '', c: p.c || 0, t: [], dir: 1 };
        var k = dirKey(e);
        if (k && seen[k]) return;
        if (k) seen[k] = 1;
        out.push(e);
      });
      _dir = out;
      then && then();
    }
    var takeRated = function (d) { rated = (d && d.faculty) || []; join(); };
    if (window.GardenFaculty && GardenFaculty.load) GardenFaculty.load(takeRated);
    else {
      /*@3.CORJ.75*/
      fetch(API + '/v1/faculty/cards.json', { cache: 'default' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(takeRated).catch(function () { takeRated(null); });
    }
    /*@3.CORJ.55*/
    fetch(API + '/v1/faculty/directory.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { banner = (d && d.people) || []; join(); })
      .catch(function () { banner = []; join(); });
  }

  /*@3.CORJ.46*/
  function dirKey(f) { return lat(f.n) || lat(tr(f.a)); }

  function insTermOf(f) {
    var out = {};
    (f.t || []).forEach(function (r) { out[r[0]] = 1; });
    return out;
  }

  /*@3.CORJ.25*/
  var TR = { 'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
             'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
             'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
             'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': '', 'و': 'w', 'ي': 'y',
             'ى': 'y', 'ئ': 'y', 'ؤ': 'w', 'ء': '' };
  function hasAr(s) { return /[؀-ۿ]/.test(String(s || '')); }
  /*@3.CORJ.30*/
  function tr(s) {
    return String(s || '').replace(/[ً-ْـ]/g, '').replace(/[هة](?=\s|$)/g, '').split('')
      .map(function (c) { return TR[c] !== undefined ? TR[c] : c; }).join('');
  }
  function lat(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
  function skel(s) { return lat(s).replace(/[aeiouwy]/g, '').replace(/(.)\1+/g, '$1'); }
  /*@3.CORJ.35*/
  function words(s) {
    return String(s || '').split(/[^A-Za-z؀-ۿ]+/).filter(function (x) { return x.length > 1; });
  }
  function keysOf(f) {
    if (f._k) return f._k;
    var out = [];
    [f.n, f.a, f.k, f.e].forEach(function (src) {
      words(src).forEach(function (w) {
        var L = hasAr(w) ? tr(w) : w;
        var l = lat(L);
        if (l.length > 1) out.push({ l: l, s: skel(L), a: hasAr(w) ? w : '' });
      });
    });
    f._k = out;
    return out;
  }

  /*@3.CORJ.28*/
  /*@3.CORJ.34*/
  function insScore(f, q) {
    if (!q) return 1;
    var qw = words(q);
    if (!qw.length) return 0;
    var keys = keysOf(f);
    var total = 0;
    for (var i = 0; i < qw.length; i++) {
      var w = qw[i];
      var isAr_ = hasAr(w);
      var L = isAr_ ? tr(w) : w;
      var ql = lat(L), qs = skel(L);
      if (ql.length < 2) return 0;
      var best = 0;
      for (var j = 0; j < keys.length && best < 4; j++) {
        var k = keys[j];
        if (isAr_ && k.a && k.a.indexOf(w) >= 0) { best = 4; break; }
        if (k.l === ql) { best = Math.max(best, 4); continue; }
        if (k.l.indexOf(ql) >= 0) { best = Math.max(best, 3); continue; }
        if (qs && k.s === qs) { best = Math.max(best, 2); continue; }
        if (qs.length >= 2 && k.s.indexOf(qs) >= 0) best = Math.max(best, 1);
      }
      if (!best) return 0;
      total += best;
    }
    return total;
  }

  function drawIns() {
    var box = dlg.querySelector('.crx-ins-box');
    if (!box || !_ins) return;
    var picked = readIn('instructor');

    if (picked) {
      var src = box.getAttribute('data-src');
      /*@3.CORJ.72*/
      var arch = insFind(_ins.list, picked);
      var rec = arch || insFind(_dir || [], picked);
      var free = src === 'typed' || (src !== 'archive' && !arch);
      box.innerHTML = '<div class="crx-ins-on' + (free ? ' is-free' : '') + '">' +
        '<i class="fa-solid ' + (free ? 'fa-user-pen' : 'fa-chalkboard-user') + '" aria-hidden="true"></i>' +
        '<b>' + esc(rec ? insLead(rec) : picked) + '</b>' +
        (rec && insSub(rec) ? '<span class="crx-ins-ar">' + esc(insSub(rec)) + '</span>' : '') +
        (free ? '<span class="crx-ins-tag">' +
            esc(t('غيرُ مؤكَّدٍ من الأرشيف', 'Not matched in archive')) + '</span>' : '') +
        '<button type="button" class="crx-ins-x" data-a="ins-clear" aria-label="' +
          esc(t('أزلْ', 'Clear')) + '"><i class="fa-solid fa-xmark"></i></button></div>';
      return;
    }

    /*@3.CORJ.38*/
    if (!_ins.list.length) {
      box.innerHTML = '<p class="crx-ins-none">' + esc(t(
        'لا أرشيفَ شعبٍ لهذه المادة.', 'No section archive for this course.')) + '</p>' +
        insFree(box, (box.getAttribute('data-q') || '').trim());
      return;
    }

    box.innerHTML =
      '<input class="gsf-in crx-ins-q" type="search" data-ins-q value="' +
        esc(box.getAttribute('data-q') || '') +
        '" placeholder="' + esc(t('ابحث باسم الدكتور…', 'Search by instructor name…')) + '" ' +
        'autocomplete="off" spellcheck="false">' +
      '<div class="crx-ins-res"></div>';

    bindIns(box);
    drawInsRes();
  }

  /*@3.CORJ.73*/
  function insKey(n) { return String(n || '').replace(/[\s,.]+/g, '').toLowerCase(); }
  function insFind(list, name) {
    var k = insKey(name);
    if (!k) return null;
    for (var i = 0; i < (list || []).length; i++) {
      if (insKey(list[i].n) === k) return list[i];
    }
    return null;
  }
  /*@3.CORJ.74*/
  function enDisp(n) {
    var p = String(n || '').split(',');
    var s = p.length < 2 ? String(n || '').trim()
          : (p[1].trim() + ' ' + p.slice(0, 1).join('').trim());
    return s.replace(/\s+/g, ' ').trim().toLowerCase()
      .replace(/(^|[\s'-])([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); })
      .replace(/\bAl\s+/g, 'Al');
  }
  function insLead(f) { return (isAr() && f.a) ? f.a : enDisp(f.n); }
  function insSub(f)  { return (isAr() && f.a) ? enDisp(f.n) : (f.a || ''); }

  /*@3.CORJ.36*/
  function insRows(list) {
    return list.slice(0, 40).map(function (f) {
      var last = (f.t && f.t[0]) ? (_ins.terms[f.t[0][0]] || f.t[0][0]) : '';
      var lead = insLead(f);
      var sub  = insSub(f);
      /*@3.CORJ.47*/
      var meta = f.dir
        ? t('من دليل الأساتذة', 'From the directory')
        : (esc(String(f.c || 0)) + ' ' + esc(t('شعبة', 'sections')) + (last ? ' · ' + esc(last) : ''));
      return '<button type="button" class="crx-ins-i' + (f.dir ? ' is-dir' : '') +
          '" data-a="ins-pick" data-n="' + esc(f.n) + '">' +
        '<span class="crx-ins-n">' + esc(lead) + '</span>' +
        (sub ? '<span class="crx-ins-ar">' + esc(sub) + '</span>' : '') +
        '<span class="crx-ins-m">' + (f.dir ? esc(meta) : meta) + '</span>' +
      '</button>';
    }).join('');
  }

  /*@3.CORJ.26*/
  function insFree(box, q) {
    return box.getAttribute('data-free') === '1'
      ? '<div class="crx-ins-free">' +
          '<input class="gsf-in" data-ins-free-in maxlength="120" value="' + esc(q) + '" ' +
            'placeholder="' + esc(t('اسمُ الدكتور كما تعرفه', 'Instructor name as you know it')) + '">' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-a="ins-free-ok">' +
            esc(t('أثبتْه', 'Use it')) + '</button>' +
        '</div>'
      : '<div class="crx-ins-free">' +
          '<p>' + esc(t('لم تجدْه؟ قد يكون درّسها ولم تُسجَّل شعبتُه في بانر.',
                        'Not there? He may have taught it without a Banner record.')) + '</p>' +
          '<button type="button" class="gsf-btn" data-a="ins-free">' +
            esc(t('اكتبِ الاسمَ يدويّاً', 'Type the name')) + '</button>' +
        '</div>';
  }

  /*@3.CORJ.39*/
  function drawInsRes() {
    var box = dlg.querySelector('.crx-ins-box');
    var res = box && box.querySelector('.crx-ins-res');
    if (!res || !_ins) return;

    var q = (box.getAttribute('data-q') || '').trim();
    var term = readIn('term');
    var here = [], past = [];
    _ins.list.forEach(function (f) {
      var sc = insScore(f, q);
      if (!sc) return;
      f._sc = sc;
      (term && insTermOf(f)[term] ? here : past).push(f);
    });
    /*@3.CORJ.29*/
    if (q) {
      var byScore = function (a, b) { return b._sc - a._sc; };
      here.sort(byScore); past.sort(byScore);
    }

    /*@3.CORJ.48*/
    var other = [];
    if (q && _dir) {
      var seen = {};
      here.concat(past).forEach(function (f) { seen[dirKey(f)] = 1; });
      _dir.forEach(function (f) {
        if (seen[dirKey(f)]) return;
        var sc = insScore(f, q);
        if (!sc) return;
        f._sc = sc; other.push(f);
      });
      other.sort(function (a, b) { return b._sc - a._sc; });
    }

    /*@3.CORJ.40*/
    /*@3.CORJ.53*/
    var list;
    if (box.getAttribute('data-open') !== '1') {
      list = '<p class="crx-ins-shut">' + (q
        ? esc(t('بحثُك «', 'Your search “')) + esc(q) +
          esc(t('» — اضغطِ الحقلَ لتعودَ إلى النتائج.', '” — tap the field to see the results again.'))
        : esc(t('اضغطِ الحقلَ أعلاه لتبحثَ في ', 'Tap the field above to search ')) +
          esc(String(_ins.list.length)) +
          esc(t(' اسماً درّسوا هذه المادة — وفي دليل القسم كلِّه.',
                ' who taught this course — and the whole directory.'))) + '</p>';
    } else {
      list =
        (here.length
          ? '<p class="crx-ins-h">' + esc(t('درّسها في الفصل الذي اخترتَه', 'Taught it in your chosen term')) +
            '</p><div class="crx-ins-l">' + insRows(here) + '</div>'
          : '') +
        (past.length
          ? '<p class="crx-ins-h">' + esc(term && here.length
              ? t('ودرّسها في فصولٍ أخرى', 'And taught it in other terms')
              : t('من درّسها سابقاً', 'Taught it previously')) +
            '</p><div class="crx-ins-l">' + insRows(past) + '</div>'
          : '') +
        (other.length
          ? '<p class="crx-ins-h">' + esc(t('ومن دليل الأساتذة (لم تُسجَّل له شعبةٌ في هذه المادة)',
              'From the directory (no section recorded for this course)')) +
            '</p><div class="crx-ins-l">' + insRows(other) + '</div>'
          : '') +
        (!here.length && !past.length && !other.length
          ? '<p class="crx-ins-none">' + esc(q && !_dir
              ? t('يُبحث في دليل القسم…', 'Searching the directory…')
              : t('لا اسمَ يطابق بحثَك.', 'No name matches.')) + '</p>'
          : '');
    }

    res.innerHTML = list + insFree(box, q);
  }

  /*@3.CORJ.41*/
  function bindIns(box) {
    var qi = box.querySelector('[data-ins-q]');
    if (!qi) return;
    /*@3.CORJ.49*/
    var open = function () {
      loadDir(function () { if (dlg.querySelector('.crx-ins-box') === box) drawInsRes(); });
      box.setAttribute('data-open', '1');
      drawInsRes();
    };
    qi.addEventListener('input', function () {
      box.setAttribute('data-q', qi.value);
      open();
    });
    qi.addEventListener('focus', function () {
      if (box.getAttribute('data-open') === '1') return;
      open();
    });
    /*@3.CORJ.51*/
    qi.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      insShut();
      qi.blur();
    });
  }

  /*@3.CORJ.50*/
  function insShut() {
    var box = dlg && dlg.querySelector('.crx-ins-box');
    if (!box || box.getAttribute('data-open') !== '1') return false;
    box.removeAttribute('data-open');
    drawInsRes();
    return true;
  }

  function pickFree(name) {
    var v = String(name || '').trim().replace(/\s+/g, ' ');
    if (v.length < 3) return;
    var box = dlg.querySelector('.crx-ins-box');
    var el = dlg.querySelector('[data-f="instructor"]');
    if (el) el.value = v;
    if (box) { box.setAttribute('data-src', 'typed'); box.removeAttribute('data-free'); }
    state.dirty = true; draftSave();
    drawIns();
  }

  /*@3.CORJ.56*/
  function readRes() {
    if (!dlg) return;
    var rows = dlg.querySelectorAll('.crx-r');
    for (var i = 0; i < rows.length; i++) {
      var r = state.res[i];
      if (!r) continue;
      var g = function (row, k) {
        var el = row.querySelector('[data-rf="' + k + '"]');
        return el ? el.value : '';
      };
      r.url = g(rows[i], 'url');
      r.title = g(rows[i], 'title');
      r.kind = g(rows[i], 'kind');
      r.why = g(rows[i], 'why');
    }
  }

  /*@3.CORJ.12*/
  function drawRes() {
    var box = dlg.querySelector('.crx-res');
    if (!box) return;
    box.innerHTML = state.res.map(function (r, i) {
      return '<div class="crx-r" data-i="' + i + '">' +
        '<input class="gsf-in" type="url" data-rf="url" placeholder="https://…" value="' + esc(r.url || '') + '">' +
        '<input class="gsf-in" type="text" data-rf="title" maxlength="120" placeholder="' +
          esc(t('العنوان', 'Title')) + '" value="' + esc(r.title || '') + '">' +
        '<select class="gsf-in" data-gs data-rf="kind">' +
          (_opts.resKind || []).map(function (k) {
            return '<option value="' + esc(k) + '"' + (r.kind === k ? ' selected' : '') + '>' + esc(lbl(k)) + '</option>';
          }).join('') + '</select>' +
        '<input class="gsf-in" type="text" data-rf="why" maxlength="160" placeholder="' +
          esc(t('لماذا نفعك؟', 'Why it helped')) + '" value="' + esc(r.why || '') + '">' +
        '<button type="button" class="crx-rdel" data-a="delres">✕</button>' +
        '</div>';
    }).join('');
    var add = dlg.querySelector('.crx-addres');
    /*@3.CORJ.13*/
    if (add) add.hidden = state.res.length >= 3;
    gsEnhance();
  }

  /*@3.CORJ.14*/
  function onClick(e) {
    var chip = e.target.closest && e.target.closest('.gsf-chip');
    if (chip) { toggleChip(chip); return; }
    var b = e.target.closest && e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'delres') {
      readRes();
      state.res.splice(Number(b.closest('.crx-r').getAttribute('data-i')), 1);
      state.dirty = true; draftSave(); drawRes(); return;
    }
    if (a === 'ins-pick') {
      var el = dlg.querySelector('[data-f="instructor"]');
      if (el) el.value = b.getAttribute('data-n') || '';
      var bx = dlg.querySelector('.crx-ins-box');
      if (bx) bx.setAttribute('data-src', 'archive');
      state.dirty = true; draftSave();
      drawIns();
      return;
    }
    if (a === 'ins-clear') {
      var el2 = dlg.querySelector('[data-f="instructor"]');
      if (el2) el2.value = '';
      var bx2 = dlg.querySelector('.crx-ins-box');
      if (bx2) { bx2.removeAttribute('data-src'); bx2.removeAttribute('data-free'); }
      state.dirty = true; draftSave();
      drawIns();
      return;
    }
    if (a === 'ins-free') {
      var bx3 = dlg.querySelector('.crx-ins-box');
      if (bx3) bx3.setAttribute('data-free', '1');
      /*@3.CORJ.42*/
      if (bx3 && bx3.querySelector('.crx-ins-res')) drawInsRes(); else drawIns();
      var fi3 = dlg.querySelector('[data-ins-free-in]');
      if (fi3) fi3.focus();
      return;
    }
    if (a === 'ins-free-ok') {
      var fin = dlg.querySelector('[data-ins-free-in]');
      pickFree(fin ? fin.value : '');
      return;
    }
    /*@3.CORJ.68*/
    if (a === 'reset') { resetForm(); return; }
    if (a === 'save') { save(b); return; }
    if (a === 'withdraw') { withdraw(b); return; }
  }

  function toggleChip(chip) {
    var box = chip.parentNode, f = box.getAttribute('data-f'), multi = !!box.getAttribute('data-multi');
    var on = chip.classList.contains('on');
    if (!multi) {
      /*@3.CORJ.15*/
      [].forEach.call(box.children, function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
      if (!on) { chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true'); }
    } else {
      var max = (_opts.multi[f] || {}).max || 99;
      var n = box.querySelectorAll('.gsf-chip.on').length;
      if (!on && n >= max) { flash(t('حتى ' + max + ' خيارات', 'Up to ' + max)); return; }
      chip.classList.toggle('on', !on);
      chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    }
    state.dirty = true; draftSave();
  }

  function readChips(f) {
    var box = dlg.querySelector('.gsf-chips[data-f="' + f + '"]');
    if (!box) return null;
    var on = [].map.call(box.querySelectorAll('.gsf-chip.on'), function (c) { return c.getAttribute('data-v'); });
    return box.getAttribute('data-multi') ? on : (on[0] || null);
  }
  function readIn(f) {
    var el = dlg.querySelector('[data-f="' + f + '"]');
    return el && el.value != null ? String(el.value).trim() : '';
  }
  function flash(msg, bad) {
    var m = dlg.querySelector('.crx-msg');
    if (!m) return;
    m.textContent = msg;
    m.className = 'crx-msg' + (bad ? ' is-err' : '');
  }

  function collect() {
    var b = Object.assign({ course_code: ctx.code }, identity());
    b.term = readIn('term');
    b.instructor = readIn('instructor') || null;
    b.advice = readIn('advice') || null;
    b.explain = readIn('explain') || null;
    b.difficulty = readChips('difficulty');
    ['weekly_hours', 'study_rhythm', 'load_shape', 'grade_weight', 'q_source', 'q_vs_ex', 'grade']
      .forEach(function (f) { b[f] = readChips(f); });
    ['nature', 'q_style', 'helped'].forEach(function (f) { b[f] = readChips(f) || []; });
    var tk = readChips('took_it');
    b.took_it = tk === 'نعم' ? true : tk === 'لا زلت فيها' ? false : null;

    /*@3.CORJ.16*/
    b.resources = [].map.call(dlg.querySelectorAll('.crx-r'), function (row) {
      var g = function (k) { var el = row.querySelector('[data-rf="' + k + '"]'); return el ? el.value.trim() : ''; };
      return { url: g('url'), title: g('title'), kind: g('kind'), why: g('why') };
    }).filter(function (r) { return r.url; });

    /*@3.CORJ.17*/
    try {
      var mine = JSON.parse(localStorage.getItem('my_semester') || 'null');
      var list = (mine && (mine.courses || mine)) || [];
      b.verified = Array.isArray(list) && list.some(function (c) {
        return String((c && (c.code || c.course_code)) || c).toUpperCase() === ctx.code;
      });
    } catch (e) { b.verified = false; }
    return b;
  }

  var FIELD_AR = {
    bad_term: 'اختر الفصل', bad_difficulty: 'اختر الصعوبة', bad_code: 'رمزُ المادة',
    bad_resource: 'رابطُ مصدرٍ غيرُ صالح (يجب أن يبدأ بـhttps)',
    bad_instructor: 'اختر الدكتورَ من القائمة',
  };

  function save(btn) {
    var b = collect();
    /*@3.CORJ.18*/
    if (!b.term) { flash(t('اختر الفصلَ أوّلاً — وهو إلزاميّ.', 'Choose the term first.'), true); return; }
    if (!b.difficulty) { flash(t('اختر الصعوبة — وهي إلزاميّة.', 'Choose the difficulty.'), true); return; }

    btn.disabled = true;
    flash(t('يُرسَل…', 'Sending…'));
    window.GardenEv('rate_course', { s: b && b.course, has_grade: b && b.grade ? 1 : 0 });
    post('/v1/courses/rate', b).then(function (x) {
      btn.disabled = false;
      if (x.s === 403) { flash(t('التقييمُ مغلقٌ حالياً.', 'Ratings are closed right now.'), true); return; }
      if (x.s === 429) { flash(t('أرسلتَ كثيراً اليوم — جرّب لاحقاً.', 'Too many today — try later.'), true); return; }
      if (x.s !== 200) {
        var f = (x.j && x.j.fields) || [];
        flash(f.length ? (FIELD_AR[f[0]] || t('راجعِ الحقولَ المميّزة', 'Check the fields')) + ''
                       : t('تعذّر الإرسال.', 'Could not send.'), true);
        return;
      }
      state.dirty = false;
      /*@3.CORJ.69*/
      draftDrop();
      var pend = x.j.pending_links;
      flash(t('شكراً — حُفظ رأيُك.', 'Thanks — saved.') +
        (pend ? ' ' + t('و' + pend + ' رابطاً ينتظر المراجعة.', pend + ' link(s) awaiting review.') : ''));
      if (ctx.onSaved) { try { ctx.onSaved(); } catch (e) { } }
      setTimeout(function () { if (dlg.open) dlg.close(); }, 1200);
    }).catch(function () {
      btn.disabled = false;
      flash(t('تعذّر الاتصال.', 'Connection failed.'), true);
    });
  }

  function withdrawCode(code) {
    return post('/v1/courses/rate/withdraw',
      Object.assign({ course_code: String(code || '').toUpperCase() }, identity()))
      .then(function (x) { return x.s === 200 && !!(x.j && x.j.ok); })
      .catch(function () { return false; });
  }

  function withdraw(btn) {
    if (!confirm(t('يُحذف تقييمُك نهائياً. متابعة؟', 'Your rating will be deleted. Continue?'))) return;
    btn.disabled = true;
    withdrawCode(ctx.code).then(function (ok) {
      btn.disabled = false;
      if (!ok) { flash(t('تعذّر السحب.', 'Could not withdraw.'), true); return; }
      state.dirty = false;
      draftDrop();
      flash(t('سُحب تقييمُك.', 'Withdrawn.'));
      if (ctx.onSaved) { try { ctx.onSaved(); } catch (e) { } }
      setTimeout(function () { if (dlg.open) dlg.close(); }, 900);
    });
  }

  /*@3.CORJ.19*/
  /*@3.CORJ.31*/
  document.addEventListener('input', function (e) {
    if (!state || !dlg || !dlg.contains(e.target)) return;
    var el = e.target;
    if (!el.hasAttribute) return;
    if (!el.hasAttribute('data-f') && !el.hasAttribute('data-rf')) return;
    state.dirty = true; draftSave();
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.crx-addres');
    if (!b || !state) return;
    if (state.res.length >= 3) return;
    readRes();
    state.res.push({ url: '', title: '', kind: (_opts.resKind || [''])[0], why: '' });
    state.dirty = true; draftSave();
    drawRes();
  });

  window.GardenCourseRate = {
    open: open, identity: identity, synced: synced, withdraw: withdrawCode,
  };
})();
