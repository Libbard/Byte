/*@3.ICPJ.1*/
;(function () {
  'use strict';

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  var host = null;
  var busy = false;

  /*@3.ICPJ.21*/
  var picks = {};

  /*@3.ICPJ.2*/
  var STEPS = [
    { i: 'fa-right-to-bracket', ar: 'ادخل إلى البلاك بورد بحسابك الجامعي.', en: 'Sign in to Blackboard with your university account.' },
    { i: 'fa-calendar-days',    ar: 'افتح <b>التقويم</b> من القائمة.', en: 'Open <b>Calendar</b> from the menu.' },
    { i: 'fa-gear',             ar: 'اضغط أيقونة <b>الترس</b> أعلى الصفحة على اليمين.', en: 'Click the <b>gear</b> icon at the top right.' },
    { i: 'fa-ellipsis',         ar: 'اضغط النقاط الثلاث <b>…</b> ثم اختر <span class="ltr">Share Calendar</span> — ينسخ لك رابطاً ينتهي بـ<span class="ltr">learn.ics</span>.', en: 'Click the three dots <b>…</b> and choose <span class="ltr">Share Calendar</span> — you get a link ending in <span class="ltr">learn.ics</span>.' }
  ];

  var KIND_AR = {
    quiz: 'كويز', exam: 'اختبار', midterm: 'نصفي', final: 'نهائي',
    assignment: 'واجب', project: 'مشروع', discussion: 'مناقشة', other: 'عنصر'
  };
  var KIND_EN = {
    quiz: 'Quiz', exam: 'Exam', midterm: 'Midterm', final: 'Final',
    assignment: 'Assignment', project: 'Project', discussion: 'Discussion', other: 'Item'
  };
  function kindName(k) { return isAr() ? (KIND_AR[k] || KIND_AR.other) : (KIND_EN[k] || KIND_EN.other); }

  function ago(ms) {
    if (!ms) return L('لم تتم بعد', 'never');
    var d = Date.now() - ms;
    if (d < 60000) return L('الآن', 'just now');
    if (d < 3600e3) return L('قبل ' + Math.round(d / 60000) + ' دقيقة', Math.round(d / 60000) + ' min ago');
    if (d < 86400e3) return L('قبل ' + Math.round(d / 3600e3) + ' ساعة', Math.round(d / 3600e3) + ' h ago');
    return L('قبل ' + Math.round(d / 86400e3) + ' يوم', Math.round(d / 86400e3) + ' d ago');
  }

  /*@3.ICPJ.3*/
  function why(code) {
    var m = {
      bad_url:       L('هذا ليس رابطَ تقويمٍ من البلاك بورد. الرابطُ الصحيح ينتهي بـlearn.ics', 'Not a Blackboard calendar link. It must end with learn.ics'),
      not_calendar:  L('الرابطُ لم يعد صالحاً — أعد استخراجَه من البلاك بورد (يبطل إذا أعدتَ المشاركة).', 'The link is no longer valid — get a fresh one from Blackboard.'),
      too_large:     L('التغذيةُ أكبر من الحدّ المسموح.', 'The feed is larger than allowed.'),
      no_endpoint:   L('خدمةُ المزامنة غير متاحة الآن.', 'Sync service unavailable right now.'),
      rate_limited:  L('حاولتَ كثيراً في وقتٍ قصير — انتظر دقيقة.', 'Too many attempts — wait a minute.'),
      no_url:        L('لم تربط تقويماً بعد.', 'No calendar connected yet.')
    };
    if (m[code]) return m[code];
    if (/^http_/.test(code || '')) return L('البلاك بورد لم يستجب (' + code.slice(5) + ').', 'Blackboard did not respond (' + code.slice(5) + ').');
    return L('تعذّرت المزامنة.', 'Sync failed.');
  }

  /*@3.ICPJ.4*/

  function render() {
    if (!host) return;
    var ICS = window.GardenICS;
    if (!ICS) { host.innerHTML = ''; return; }
    var s = ICS.state();
    /*@3.ICPJ.22*/
    var live = {};
    (s.inbox || []).forEach(function (it) { live[it.uid] = 1; });
    Object.keys(picks).forEach(function (k) { if (!live[k]) delete picks[k]; });
    host.innerHTML = s.url ? viewOn(s) : viewOff(s);
    wire();
    batchBar();
  }

  /*@3.ICPJ.5*/
  function viewOff(s) {
    var steps = STEPS.map(function (st, i) {
      return '<li class="ics-step">' +
        '<span class="ics-step-n">' + (i + 1) + '</span>' +
        '<i class="fa-solid ' + st.i + '"></i>' +
        '<span>' + (isAr() ? st.ar : st.en) + '</span>' +
      '</li>';
    }).join('');

    return '' +
    '<div class="set-note"><i class="fa-solid fa-wand-magic-sparkles"></i><div>' +
      '<b>' + L('اربط تقويمك مرّةً واحدة.', 'Connect once.') + '</b> ' +
      esc(L('بعدها تصل كويزاتُك وواجباتُك ومواعيدُ تسليمها إلى جدولك وصفحاتِ موادّك تلقائياً — وتتحدّث كلَّ يوم.',
            'After that your quizzes, assignments and due dates flow into your schedule and course pages automatically — refreshed daily.')) +
    '</div></div>' +

    '<ol class="ics-steps">' + steps + '</ol>' +

    '<div class="set-row is-stack">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('الصق الرابط هنا', 'Paste the link here')) + '</div>' +
        '<div class="set-row-h">' + esc(L('يبدأ بـ lms.seu.edu.sa وينتهي بـ learn.ics — ولا يُشارَك مع أحد: من ملكه قرأ تقويمك.',
                                          'Starts with lms.seu.edu.sa and ends with learn.ics — never share it: anyone holding it can read your calendar.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c ics-connect">' +
        '<input type="url" class="set-in ltr" id="ics-url" spellcheck="false" autocomplete="off"' +
               ' placeholder="https://lms.seu.edu.sa/webapps/calendar/calendarFeed/…/learn.ics">' +
        '<button class="set-btn set-btn--primary" id="ics-connect">' +
          '<i class="fa-solid fa-link"></i><span>' + esc(L('اربط', 'Connect')) + '</span></button>' +
      '</div>' +
    '</div>' +
    '<p class="ics-msg" id="ics-msg"></p>';
  }

  /*@3.ICPJ.6*/
  function viewOn(s) {
    var okDot = s.last_ok && !s.last_err;
    var out = '';

    out +=
    '<div class="set-state">' +
      '<span class="set-dot' + (okDot ? ' is-on' : '') + '"></span>' +
      '<span class="set-state-t">' + esc(okDot
        ? L('متّصل', 'Connected')
        : (s.last_err ? L('توقّف', 'Stopped') : L('بانتظار أول مزامنة', 'Awaiting first sync'))) + '</span>' +
      '<span class="set-state-s">' +
        esc(L('آخر مزامنة: ', 'Last sync: ') + ago(s.last_ok)) +
        (s.count ? esc(' · ' + s.count + L(' عنصراً', ' items')) : '') +
      '</span>' +
    '</div>';

    if (s.last_err) {
      out += '<div class="set-note" data-kind="warn"><i class="fa-solid fa-triangle-exclamation"></i>' +
             '<div>' + esc(why(s.last_err)) + '</div></div>';
    }

    out +=
    '<div class="set-btns">' +
      '<button class="set-btn" id="ics-sync"><i class="fa-solid fa-rotate"></i><span>' +
        esc(L('زامن الآن', 'Sync now')) + '</span></button>' +
      '<button class="set-btn" id="ics-guide"><i class="fa-solid fa-circle-question"></i><span>' +
        esc(L('من أين أجيب الرابط؟', 'Where is the link?')) + '</span></button>' +
      '<button class="set-btn set-btn--danger" id="ics-off"><i class="fa-solid fa-link-slash"></i><span>' +
        esc(L('افصل', 'Disconnect')) + '</span></button>' +
    '</div>' +
    '<p class="ics-msg" id="ics-msg"></p>' +
    '<ol class="ics-steps" id="ics-steps" hidden>' + STEPS.map(function (st, i) {
      return '<li class="ics-step"><span class="ics-step-n">' + (i + 1) + '</span>' +
             '<i class="fa-solid ' + st.i + '"></i><span>' + (isAr() ? st.ar : st.en) + '</span></li>';
    }).join('') + '</ol>';

    out += inboxView(s);
    out += alertsView(s);
    return out;
  }

  /*@3.ICPJ.7*/
  function inboxView(s) {
    if (!s.inbox.length) {
      return '<div class="ics-empty"><i class="fa-solid fa-inbox"></i><p>' +
        esc(L('لا شيء ينتظر — كلُّ ما وصل رُبط بمادّته.', 'Nothing waiting — everything landed in its course.')) +
        '</p></div>';
    }

    /*@3.ICPJ.23*/
    var groups = window.GardenICS.groupInbox(s.inbox);
    var codes = window.GardenICS.myCourses();

    var body = groups.map(function (g) {
      var head = g.items.length > 1
        ? L(g.items.length + ' عناصرَ متجاورة', g.items.length + ' adjacent items')
        : L('عنصرٌ واحد', 'One item');
      var sug = g.guess && codes.indexOf(g.guess) > -1 ? g.guess : '';
      var key = g.items[0].uid;
      /*@3.ICPJ.24*/
      var chosen = picks[key] !== undefined ? picks[key] : sug;
      if (chosen && codes.indexOf(chosen) < 0) chosen = '';

      var rows = g.items.map(function (it) {
        return '<li class="ics-item">' +
          '<span class="ics-badge" data-k="' + esc(it.kind) + '">' + esc(kindName(it.kind)) + '</span>' +
          '<span class="ics-item-t">' + esc(it.raw) + '</span>' +
          '<span class="ics-item-d ltr">' + esc(it.date) + '</span>' +
        '</li>';
      }).join('');

      var opts = ['<option value="">' + esc(L('اختر المادة…', 'Pick a course…')) + '</option>']
        .concat(codes.map(function (c) {
          return '<option value="' + esc(c) + '"' + (c === chosen ? ' selected' : '') + '>' + esc(c) + '</option>';
        })).join('');

      return '<div class="ics-group" data-uid="' + esc(key) + '"' +
          (picks[key] ? ' data-picked="1"' : '') + '>' +
        '<div class="ics-group-h">' +
          '<span class="ics-group-n">' + esc(head) + '</span>' +
          (sug ? '<span class="ics-guess"><i class="fa-solid fa-lightbulb"></i>' +
                 esc(L('نرجّح ', 'Likely ')) + '<b class="ltr">' + esc(sug) + '</b>' +
                 (g.score ? ' <span class="ics-score">' + g.score + '%</span>' : '') + '</span>' : '') +
        '</div>' +
        '<ul class="ics-items">' + rows + '</ul>' +
        '<div class="ics-group-a">' +
          '<select class="set-in ics-pick">' + opts + '</select>' +
          '<button class="set-btn set-btn--primary ics-ok"><i class="fa-solid fa-check"></i><span>' +
            esc(L('اربط', 'Assign')) + '</span></button>' +
          '<button class="set-btn ics-no"><i class="fa-solid fa-eye-slash"></i><span>' +
            esc(L('تجاهل', 'Ignore')) + '</span></button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="ics-inbox">' +
      '<div class="ics-inbox-h"><i class="fa-solid fa-inbox"></i>' +
        '<span>' + esc(L('بانتظار مادّتها', 'Waiting for a course')) + '</span>' +
        '<span class="ics-count">' + s.inbox.length + '</span></div>' +
      '<p class="set-row-h">' + esc(L(
        'البلاك بورد لا يذكر اسمَ المادة في هذه العناصر، ولا نُدخلها جدولَك بالتخمين. اربط المجموعةَ مرّةً — وما يأتي بعدها من المادة نفسِها يُربط وحدَه.',
        'Blackboard does not name the course on these, and we will not guess. Assign a group once — later items from the same course land on their own.')) + '</p>' +
      body +
      /*@3.ICPJ.25*/
      '<div class="ics-batch" id="ics-batch" hidden>' +
        '<span class="ics-batch-t"><i class="fa-solid fa-layer-group"></i>' +
          esc(L('اخترتَ موادَّ لعدّة مجموعات', 'You picked courses for several groups')) + '</span>' +
        '<button class="set-btn" id="ics-batch-clear">' +
          '<i class="fa-solid fa-eraser"></i><span>' + esc(L('امسح الاختيارات', 'Clear')) + '</span></button>' +
        '<button class="set-btn set-btn--primary" id="ics-batch-go">' +
          '<i class="fa-solid fa-check-double"></i><span>' + esc(L('اربطها كلَّها', 'Assign them all')) +
          ' <b class="ics-batch-n" id="ics-batch-n"></b></span></button>' +
      '</div>' +
    '</div>';
  }

  /*@3.ICPJ.10*/
  function alertsView(s) {
    return '' +
    '<div class="set-row">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('نبّهني قبل الاستحقاق', 'Remind me before due')) + '</div>' +
        '<div class="set-row-h">' + esc(L('بكم يوماً قبل موعد التسليم يصلك التنبيه.',
                                          'How many days before the deadline you get notified.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c">' +
        '<div class="set-step">' +
          '<button id="ics-lead-m" aria-label="' + esc(L('أنقص', 'Less')) + '">−</button>' +
          '<span class="set-step-v" id="ics-lead-v">' + s.lead_days + '</span>' +
          '<button id="ics-lead-p" aria-label="' + esc(L('زد', 'More')) + '">+</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="set-row">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('حدّث تلقائياً عند فتح الموقع', 'Refresh when I open the site')) + '</div>' +
        '<div class="set-row-h">' + esc(L('مزامنةٌ صامتةٌ كلَّ ست ساعات على هذا الجهاز.',
                                          'A silent sync every six hours on this device.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c"><div class="set-seg" id="ics-auto">' +
        '<button data-v="1"' + (s.auto ? ' class="is-on"' : '') + '>' + esc(L('نعم', 'Yes')) + '</button>' +
        '<button data-v="0"' + (!s.auto ? ' class="is-on"' : '') + '>' + esc(L('لا', 'No')) + '</button>' +
      '</div></div>' +
    '</div>' +

    /*@3.ICPJ.11*/
    '<div class="set-row is-stack">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('نبّهني والموقع مغلق', 'Notify me while the site is closed')) +
          '<span class="set-tag">' + esc(L('اختياري', 'Optional')) + '</span></div>' +
        '<div class="set-row-h">' + esc(L(
          'التنبيهُ قبل التسليم لا ينطلق إلا من خادمنا، وهذا يستلزم أن نحفظ رابطك عندنا ونقرأه مرّتين يومياً. والرابطُ مفتاحٌ حامل: من ملكه قرأ تقويمك — فخادمنا سيستطيع قراءته. بدون هذا يبقى كلُّ شيء يعمل حين تفتح الموقع، ويسقط التنبيهُ وحدَه.',
          'Deadline reminders can only fire from our server, which means storing your link with us and reading it twice a day. That link is a bearer key: whoever holds it can read your calendar — so our server will be able to. Without this, everything still works when you open the site; only the reminder is lost.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c">' +
        (s.on_server
          ? '<button class="set-btn set-btn--danger" id="ics-unreg"><i class="fa-solid fa-server"></i><span>' +
              esc(L('أوقف التنبيه واحذف رابطي من الخادم', 'Stop and delete my link from the server')) + '</span></button>'
          : '<button class="set-btn" id="ics-reg"><i class="fa-solid fa-bell"></i><span>' +
              esc(L('فعّل التنبيه (يحفظ رابطي)', 'Enable (stores my link)')) + '</span></button>') +
      '</div>' +
    '</div>';
  }

  /*@3.ICPJ.12*/

  function msg(text, kind) {
    var el = $('ics-msg');
    if (!el) return;
    el.textContent = text || '';
    el.setAttribute('data-kind', kind || '');
  }

  /*@3.ICPJ.26*/
  function batchBar() {
    if (!host) return;
    var bar = $('ics-batch');
    if (!bar) return;
    var n = 0;
    host.querySelectorAll('.ics-group').forEach(function (g) {
      var on = !!picks[g.getAttribute('data-uid')];
      if (on) n++;
      if (on) g.setAttribute('data-picked', '1'); else g.removeAttribute('data-picked');
    });
    bar.hidden = n < 2;
    var nEl = $('ics-batch-n');
    if (nEl) nEl.textContent = n < 2 ? '' : String(n);
    /*@3.ICPJ.27*/
    host.querySelectorAll('.ics-ok').forEach(function (b) {
      b.classList.toggle('set-btn--primary', n < 2);
    });
  }

  function work(on) {
    busy = on;
    host.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
  }

  function doSync() {
    if (busy) return;
    work(true);
    msg(L('نقرأ تقويمك…', 'Reading your calendar…'), '');
    window.GardenICS.sync().then(function (r) {
      work(false);
      if (!r.ok) { msg(why(r.error), 'bad'); render(); return; }
      var bits = [];
      if (r.added)   bits.push(L(r.added + ' جديد', r.added + ' new'));
      if (r.updated) bits.push(L(r.updated + ' محدَّث', r.updated + ' updated'));
      if (r.pending) bits.push(L(r.pending + ' بانتظار مادّتها', r.pending + ' awaiting a course'));
      /*@3.ICPJ.13*/
      if (!bits.length) bits.push(L('لا جديد — كلُّ شيءٍ محدَّث', 'Nothing new — all up to date'));
      if (r.touched) bits.push(L(r.touched + ' عدّلتَها بيدك فلم نلمسها', r.touched + ' you edited — left untouched'));
      /*@3.ICPJ.28*/
      if (r.blocked) bits.push(L(r.blocked + ' تعذّر إدراجُها — أعد المحاولة',
                                 r.blocked + ' could not be filed — try again'));
      msg(bits.join(' · '), r.blocked ? 'bad' : 'ok');
      render();
      if (window.GardenSchedule && GardenSchedule.reload) GardenSchedule.reload();
    });
  }

  function wire() {
    var ICS = window.GardenICS;

    var con = $('ics-connect');
    if (con) con.addEventListener('click', function () {
      var v = ($('ics-url').value || '').trim();
      if (!ICS.setUrl(v)) { msg(why('bad_url'), 'bad'); return; }
      doSync();
    });
    var inp = $('ics-url');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); con.click(); } });

    var sy = $('ics-sync'); if (sy) sy.addEventListener('click', doSync);

    var gd = $('ics-guide');
    if (gd) gd.addEventListener('click', function () {
      var st = $('ics-steps'); if (st) st.hidden = !st.hidden;
    });

    var off = $('ics-off');
    if (off) off.addEventListener('click', function () {
      /*@3.ICPJ.14*/
      var wipe = confirm(L(
        'سنفصل التقويم ونحذف رابطك من الخادم.\n\nاضغط «موافق» لحذف ما استوردناه أيضاً، أو «إلغاء» للإبقاء عليه في جدولك.',
        'We will disconnect and delete your link from the server.\n\nOK also deletes what was imported; Cancel keeps it in your schedule.'));
      work(true);
      ICS.disconnect(wipe).then(function () {
        work(false); render();
        if (window.GardenSchedule && GardenSchedule.reload) GardenSchedule.reload();
      });
    });

    var lm = $('ics-lead-m'), lp = $('ics-lead-p');
    function lead(d) {
      var v = ICS.setLead(ICS.state().lead_days + d);
      $('ics-lead-v').textContent = v;
      if (ICS.state().on_server) ICS.register();
    }
    if (lm) lm.addEventListener('click', function () { lead(-1); });
    if (lp) lp.addEventListener('click', function () { lead(1); });

    var au = $('ics-auto');
    if (au) au.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      ICS.setAuto(b.getAttribute('data-v') === '1');
      au.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    });

    var reg = $('ics-reg');
    if (reg) reg.addEventListener('click', function () {
      work(true);
      msg(L('نسجّل تقويمك…', 'Registering…'), '');
      /*@3.ICPJ.19*/
      ICS.register().then(function (ok) {
        work(false);
        var text;
        if (ok === true) {
          text = L('فعّلناه — سنقرأ تقويمك مرّتين يومياً وننبّهك قبل التسليم.',
                   'Enabled — we will read your calendar twice a day and remind you before deadlines.');
        } else if (ok === 'no-vault') {
          text = L('لا يمكن تفعيلُه قبل تشغيل المزامنة: التنبيهُ يخرج من خادمنا، والخادمُ يحتاج مفتاحَ خزنتك ليعرف لمن يرسل. فعّل المزامنةَ من الإعدادات ثمّ عُد إلى هنا.',
                   'This needs sync on first: the reminder comes from our server, and the server needs your vault key to know who to notify. Turn on sync in Settings, then come back.');
        } else {
          text = L('تعذّر التسجيل. تأكّد أن الرابط يعمل ثمّ جرّب ثانيةً.',
                   'Could not register. Check the link works, then try again.');
        }
        msg(text, ok === true ? 'ok' : 'bad');
        render();
      });
    });

    var un = $('ics-unreg');
    if (un) un.addEventListener('click', function () {
      work(true);
      ICS.unregister().then(function () {
        var s = ICS.state(); s.on_server = false; ICS.save();
        work(false);
        msg(L('حُذف رابطك من الخادم. المزامنةُ ما زالت تعمل حين تفتح الموقع.',
              'Your link was deleted from the server. Syncing still works when you open the site.'), 'ok');
        render();
      });
    });

    host.querySelectorAll('.ics-group').forEach(function (g) {
      var key = g.getAttribute('data-uid');
      var pick = g.querySelector('.ics-pick');
      /*@3.ICPJ.29*/
      pick.addEventListener('change', function () {
        if (pick.value) picks[key] = pick.value; else delete picks[key];
        batchBar();
      });
      g.querySelector('.ics-ok').addEventListener('click', function () {
        var code = pick.value;
        if (!code) { msg(L('اختر المادة أولاً.', 'Pick a course first.'), 'bad'); return; }
        delete picks[key];
        ICS.assign(key, code, true);
        doSync();
      });
      /*@3.ICPJ.15*/
      g.querySelector('.ics-no').addEventListener('click', function () {
        /*@3.ICPJ.30*/
        delete picks[key];
        var mine = null;
        ICS.groupInbox(ICS.state().inbox).forEach(function (x) {
          if (x.items[0] && x.items[0].uid === key) mine = x;
        });
        (mine ? mine.items : [{ uid: key }]).forEach(function (it) { ICS.skip(it.uid); });
        doSync();
      });
    });

    /*@3.ICPJ.31*/
    var bgo = $('ics-batch-go');
    if (bgo) bgo.addEventListener('click', function () {
      if (busy) return;
      var pairs = [];
      host.querySelectorAll('.ics-group').forEach(function (g) {
        var k = g.getAttribute('data-uid');
        if (picks[k]) pairs.push([k, picks[k]]);
      });
      if (pairs.length < 2) return;
      pairs.forEach(function (pr) { ICS.assign(pr[0], pr[1], true); });
      picks = {};
      doSync();
    });
    var bcl = $('ics-batch-clear');
    if (bcl) bcl.addEventListener('click', function () {
      picks = {};
      host.querySelectorAll('.ics-pick').forEach(function (el) { el.value = ''; });
      batchBar();
    });
  }

  /*@3.ICPJ.16*/

  window.GardenICSPanel = {
    mount: function (el) { host = el; render(); },
    refresh: render
  };

  /*@3.ICPJ.17*/
  document.addEventListener('garden:languageChanged', render);
  window.addEventListener('ics:sync', function () { /*@3.ICPJ.18*/ });
  /*@3.ICPJ.20*/
  window.addEventListener('garden:syncCompleted', function () { render(); });
})();
