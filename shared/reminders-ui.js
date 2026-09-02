/*@3.REUJ.1*/
;(function () {
  'use strict';

  function lang() {
    return document.documentElement.getAttribute('lang')
      || localStorage.getItem('garden_lang') || 'ar';
  }
  function tx(ar, en) { return lang() === 'ar' ? ar : en; }
  function el(id) { return document.getElementById(id); }

  var panel = null;

  /*@3.REUJ.2*/
  function renderStatus() {
    var R = window.Reminders;
    if (!R) return;
    var cap = R.capability();
    var s = R.settings();
    var box = el('rem-status');
    var icon = el('rem-status-icon');
    var title = el('rem-status-title');
    var note = el('rem-status-note');
    var acts = el('rem-status-actions');
    if (!box) return;

    acts.innerHTML = '';
    var state = 'off', ic = 'fa-bell-slash', tt = '', nn = '';

    if (!cap.supported) {
      state = 'blocked'; ic = 'fa-circle-exclamation';
      tt = tx('متصفحك لا يدعم التنبيهات', 'Your browser doesn\'t support notifications');
      nn = tx('جرّب Chrome أو Edge أو Safari حديثاً.', 'Try a recent Chrome, Edge, or Safari.');
    } else if (cap.needsInstall) {
      state = 'partial'; ic = 'fa-mobile-screen';
      tt = tx('ثبّت التطبيق أولاً', 'Install the app first');
      nn = tx('على الآيفون والآيباد لا تصل التنبيهات إلا بعد تثبيت الموقع كتطبيق: شارك ← «إضافة إلى الشاشة الرئيسية»، ثم افتحه من الأيقونة.',
              'On iPhone/iPad, notifications only work after installing the site as an app: Share ← “Add to Home Screen”, then open it from the icon.');
    } else if (cap.permission === 'denied') {
      state = 'blocked'; ic = 'fa-ban';
      tt = tx('الإشعارات محظورة', 'Notifications are blocked');
      nn = tx('حظرتَ الإشعارات لهذا الموقع سابقاً. افتح إعدادات الموقع في المتصفح (أيقونة القفل بجانب العنوان) واسمح بالإشعارات.',
              'You previously blocked notifications for this site. Open site settings in your browser (the lock icon by the address bar) and allow notifications.');
    } else if (cap.permission !== 'granted' && s.enabled) {
      /*@3.REUJ.3*/
      state = 'partial'; ic = 'fa-clock-rotate-left';
      tt = tx('انتهى إذن الإشعارات بإغلاق المتصفح', 'The notification permission expired when you closed the browser');
      nn = tx('تنبيهاتك مفعّلة هنا، لكن المتصفح لم يعد يسمح بها — وهذا يحدث حين يُمنح الإذن بخيار «السماح هذه المرة فقط». اضغط الزرّ أدناه واختر هذه المرة «السماح» أو «السماح دائماً» ليبقى بعد الإغلاق.',
              'Reminders are on here, but the browser no longer allows them — this happens when permission was granted with “Allow this time”. Press the button below and choose “Allow” or “Always allow” so it survives closing.');
      var pb = document.createElement('button');
      pb.className = 'dash-btn';
      pb.textContent = tx('اسمح بالإشعارات دائماً', 'Allow notifications always');
      pb.addEventListener('click', function () {
        R.requestPermission().then(function () { renderAll(); renderUpcoming(); });
      });
      acts.appendChild(pb);
    } else if (cap.permission !== 'granted') {
      state = 'off'; ic = 'fa-bell';
      tt = tx('التنبيهات غير مفعَّلة', 'Reminders are off');
      nn = tx('فعّل المفتاح أدناه وسيطلب المتصفح إذنك مرة واحدة — اختر «السماح» لا «هذه المرة فقط».',
              'Turn on the switch below — your browser will ask once. Choose “Allow”, not “Allow this time”.');
    } else if (!s.enabled) {
      state = 'off'; ic = 'fa-bell';
      tt = tx('الإذن ممنوح — التنبيهات متوقفة', 'Permission granted — reminders paused');
      nn = tx('فعّل المفتاح أدناه لاستئنافها.', 'Turn the switch on to resume.');
    } else if (cap.background) {
      state = 'on'; ic = 'fa-bell';
      tt = tx('تعمل — وتصلك والموقع مغلق', 'Working — delivered even when closed');
      nn = tx('جهازك يدعم التسليم المسبق، فتصل التنبيهات في وقتها حتى لو لم يكن الموقع مفتوحاً.',
              'Your device supports scheduled delivery, so reminders arrive on time even with the site closed.');
    } else {
      /*@3.REUJ.4*/
      state = 'partial'; ic = 'fa-triangle-exclamation';
      tt = tx('تعمل — لكن فقط والموقع مفتوح', 'Working — but only while the site is open');
      nn = tx('لا يصلك شيء والموقع مغلق. ليس خللاً في إعدادك: المتصفحات أزالت الواجهة التي كانت تسمح بذلك، فلا سبيل إليه إلا بتنبيهات الدفع من خادم — وهي قيد الإنجاز. حتى ذلك الحين: التنبيه يصل ما دام تبويب الموقع مفتوحاً، وما يفوتك يُعرض ملخصاً عند أول فتح فلا يضيع.',
              'Nothing arrives while the site is closed. This is not a misconfiguration: browsers removed the API that allowed it, so it now requires server push — which is being built. Until then, reminders arrive while a tab is open, and anything missed is summarized next time, so nothing is lost.');
      if (!cap.installed) {
        var b = document.createElement('button');
        b.className = 'dash-btn';
        b.textContent = tx('ثبّته كتطبيق ليبقى نشطاً أطول', 'Install as an app to stay active longer');
        b.addEventListener('click', function () {
          alert(tx('من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
                   'From your browser menu choose “Install app” or “Add to Home Screen”.'));
        });
        acts.appendChild(b);
      }
    }

    box.setAttribute('data-state', state);
    icon.innerHTML = '<i class="fa-solid ' + ic + '"></i>';
    title.textContent = tt;
    note.textContent = nn;
  }

  /*@3.REUJ.5*/
  function fmtLead(min) {
    /*@3.REUJ.6*/
    if (!min) return tx('في وقتها تماماً', 'at the time');
    if (min % 1440 === 0 && min >= 1440) {
      var d = min / 1440;
      return (window.Garden && Garden.smartCount)
        ? Garden.smartCount(d, ['يوم', 'يومان', 'أيام'], ['day', 'days'])
        : tx(d + ' يوم', d + ' days');
    }
    if (min % 60 === 0 && min >= 60) {
      var h = min / 60;
      return (window.Garden && Garden.smartCount)
        ? Garden.smartCount(h, ['ساعة', 'ساعتان', 'ساعات'], ['hour', 'hours'])
        : tx(h + ' ساعة', h + ' hours');
    }
    return (window.Garden && Garden.smartCount)
      ? Garden.smartCount(min, ['دقيقة', 'دقيقتان', 'دقائق'], ['minute', 'minutes'])
      : tx(min + ' دقيقة', min + ' min');
  }

  /*@3.REUJ.7*/
  function markBrave() {
    var sec = el('rem-ts-brave');
    if (!sec || !navigator.brave || !navigator.brave.isBrave) return;
    navigator.brave.isBrave().then(function (yes) {
      /*@3.REUJ.8*/
      if (!yes) return;
      sec.classList.add('is-yours');
      /*@3.REUJ.9*/
      var d = el('rem-tshoot');
      if (d && !d.open && window.Reminders && Reminders.capability().permission !== 'granted') {
        d.open = true;
        sec.open = true;
      }
    }).catch(function () {});
  }

  /*@3.REUJ.10*/
  function renderPermHint() {
    var box = el('rem-perm-hint');
    if (!box || !window.Reminders) return;
    box.hidden = Reminders.capability().permission === 'granted';
  }

  function serverTest(btn) {
    /*@3.REUJ.11*/
    var R = window.Reminders;
    if (!R) return;
    if (!window.GardenPush || !GardenPush.supported()) {
      alert(tx('الدفع من الخادم غير مهيّأ في هذا المتصفح (أو العنوان غير مضبوط في endpoints.js).',
               'Server push is not available in this browser (or the endpoint is unset in endpoints.js).'));
      return;
    }
    var label = btn ? btn.querySelector('span') : null;
    var was = label ? label.textContent : '';
    if (label) label.textContent = tx('جارٍ الإرسال…', 'Sending…');
    if (btn) btn.disabled = true;

    R.requestPermission().then(function (p) {
      if (p !== 'granted') {
        alert(p === 'needs-install'
          ? tx('ثبّت الموقع كتطبيق أولاً (شارك ← إضافة إلى الشاشة الرئيسية).',
               'Install the site as an app first (Share ← Add to Home Screen).')
          : tx('لا إذن بالإشعارات على هذا الجهاز — اسمح بها من إعدادات المتصفح.',
               'Notification permission is missing on this device — allow it in browser settings.'));
        return null;
      }
      return GardenPush.serverTest();
    }).then(function (r) {
      if (!r) return;
      if (r.ok) {
        var n = r.devices || 1;
        /*@3.REUJ.12*/
        alert(tx('أُرسل الطلب ✓ — تصل النبضة خلال دقيقة إلى دقيقتين إلى ' + n + ' جهاز مشترك.\n\n'
               + 'التأخّر طبيعي: الخادم يفحص المواعيد كل دقيقة، ثم تمرّ النبضة بخدمة الدفع في متصفحك.\n\n'
               + 'إن وصلت لجهازٍ دون آخر، فالجهاز الآخر لم يشترك: افتح الموقع فيه وفعّل التنبيهات '
               + 'وتأكد أن مفتاح المزامنة نفسه.',
                 'Sent ✓ — the wake reaches ' + n + ' subscribed device(s) within one to two minutes.\n\n'
               + 'The delay is normal: the server scans due times every minute, then the ping travels through your browser’s push service.\n\n'
               + 'If one device gets it and another does not, that device is not subscribed: open the site there, '
               + 'turn reminders on, and confirm it uses the same sync key.'));
        return;
      }
      var why = String(r.reason || '');
      var msg;
      if (why === 'no_devices') {
        msg = tx('لا جهاز مشترك في هذه الخزنة بعد. فعّل التنبيهات في هذا الجهاز أولاً ثم أعد المحاولة.',
                 'No subscribed devices in this vault yet. Turn reminders on here first, then retry.');
      } else if (why === 'test_rate_limited' || why === 'http-429' || why === 'rate_limited') {
        /*@3.REUJ.13*/
        var sec = r.retryAfter || 0;
        var when = sec > 60
          ? tx('بعد نحو ' + Math.ceil(sec / 60) + ' دقيقة', 'in about ' + Math.ceil(sec / 60) + ' minutes')
          : (sec ? tx('بعد ' + sec + ' ثانية', 'in ' + sec + ' seconds') : tx('بعد قليل', 'shortly'));
        msg = tx('حدُّ التجربة خمس مرات في الساعة، وقد استُهلك — ليست هذه علامةَ عطل.\n\n'
               + 'أعد المحاولة ' + when + '.\n\n'
               + 'الحدُّ موجود لأن كل ضغطةٍ توقظ أجهزتك كلها فعلاً. ولاختبار الجهاز الحالي وحده '
               + 'استعمل «جرّب تنبيهاً الآن» — فهو بلا حدّ.',
                 'The test is capped at five per hour and the cap is used up — this is not a fault.\n\n'
               + 'Try again ' + when + '.\n\n'
               + 'The cap exists because every press really does wake all your devices. To test this device alone, '
               + 'use “Send a test” — it has no cap.');
      } else if (/Registration failed|push service|AbortError/i.test(why)) {
        /*@3.REUJ.14*/
        msg = tx('متصفحك لم يستطع التسجيل لدى خدمة الدفع — والعطل خارج موقعنا تماماً.\n\n'
               + 'الأسباب بترتيب الاحتمال:\n'
               + '١) متصفح Brave: خدمة الدفع مُعطّلة فيه افتراضياً. افتح brave://settings/privacy '
               + 'وفعّل «Use Google services for push messaging» ثم أعد تشغيل المتصفح.\n'
               + '٢) إضافة مانعة للإعلانات تحجب googleapis.com — وهي نفسها التي تحجب فايربيس عندك.\n'
               + '٣) جدار حماية أو VPN يحجب fcmregistrations.googleapis.com.\n\n'
               + 'جرّب في نافذة تصفّح خفيّ بلا إضافات للتأكد.',
                 'Your browser could not register with the push service — this failure is outside our site.\n\n'
               + 'Most likely causes:\n'
               + '1) Brave: push messaging is off by default. Open brave://settings/privacy and enable '
               + '"Use Google services for push messaging", then restart the browser.\n'
               + '2) An ad blocker blocking googleapis.com — the same one blocking Firebase for you.\n'
               + '3) A firewall or VPN blocking fcmregistrations.googleapis.com.\n\n'
               + 'Try an incognito window with extensions disabled to confirm.');
      } else if (why === 'http-403') {
        msg = tx('رفض الخادم الأصل — تأكد أن ALLOWED_ORIGINS في كلاودفلير يطابق نطاق الموقع تماماً.',
                 'The server rejected the origin — check ALLOWED_ORIGINS in Cloudflare matches the site origin exactly.');
      } else if (why === 'http-404') {
        msg = tx('مسار غير موجود على الخادم — الغالب شرطة مائلة زائدة في endpoints.js أو ووركر قديم.',
                 'Path not found on the server — likely a trailing slash in endpoints.js or an outdated Worker.');
      } else {
        msg = tx('تعذّرت التجربة: ', 'Test failed: ') + why;
      }
      alert(msg);
    }).catch(function (e) {
      alert(tx('تعذّرت التجربة: ', 'Test failed: ') + String(e && e.message || e));
    }).then(function () {
      if (label) label.textContent = was;
      if (btn) btn.disabled = false;
    });
  }

  /*@3.REUJ.15*/

  var LEAD_PRESETS = [
    { v: 0,     ar: 'في وقتها تماماً',   en: 'At the time' },
    { v: 15,    ar: 'قبلها بـ 15 دقيقة', en: '15 minutes before' },
    { v: 30,    ar: 'قبلها بـ 30 دقيقة', en: '30 minutes before' },
    { v: 60,    ar: 'قبلها بساعة',       en: '1 hour before' },
    { v: 180,   ar: 'قبلها بـ 3 ساعات',  en: '3 hours before' },
    { v: 720,   ar: 'قبلها بـ 12 ساعة',  en: '12 hours before' },
    { v: 1440,  ar: 'قبلها بيوم',        en: '1 day before' },
    { v: 10080, ar: 'قبلها بأسبوع',      en: '1 week before' }
  ];

  /*@3.REUJ.16*/
  var LEAD_UNITS = [
    { v: 10080, ar: 'أسبوع',  en: 'weeks' },
    { v: 1440,  ar: 'يوم',    en: 'days' },
    { v: 60,    ar: 'ساعة',   en: 'hours' },
    { v: 1,     ar: 'دقيقة',  en: 'minutes' }
  ];

  var LEAD_MAX = 60 * 24 * 60;   /*@3.REUJ.17*/

  function isPreset(min) {
    return LEAD_PRESETS.some(function (p) { return p.v === min; });
  }

  function splitLead(min) {
    for (var i = 0; i < LEAD_UNITS.length; i++) {
      var u = LEAD_UNITS[i];
      if (min >= u.v && min % u.v === 0) return { n: min / u.v, unit: u.v };
    }
    return { n: min || 1, unit: 1 };
  }

  function opt(value, ar, en) {
    var o = document.createElement('option');
    o.value = String(value);
    /*@3.REUJ.18*/
    o.setAttribute('data-ar', ar);
    o.setAttribute('data-en', en);
    o.textContent = tx(ar, en);
    return o;
  }

  function buildLeadControl(host, ch) {
    host.textContent = '';

    var lab = document.createElement('label');
    lab.setAttribute('data-ar', 'ينبّهني');
    lab.setAttribute('data-en', 'Notify me');
    lab.textContent = tx('ينبّهني', 'Notify me');
    lab.htmlFor = 'rem-lead-' + ch;
    host.appendChild(lab);

    var sel = document.createElement('select');
    sel.className = 'rem-lead-select';
    sel.id = 'rem-lead-' + ch;
    sel.setAttribute('data-lead', ch);
    LEAD_PRESETS.forEach(function (p) { sel.appendChild(opt(p.v, p.ar, p.en)); });
    sel.appendChild(opt('custom', 'مخصّص…', 'Custom…'));
    host.appendChild(sel);

    /*@3.REUJ.19*/
    var wrap = document.createElement('span');
    wrap.className = 'rem-lead-custom';
    wrap.setAttribute('data-lead-custom', ch);
    wrap.hidden = true;

    var pre = document.createElement('span');
    pre.className = 'rem-lead-pre';
    pre.setAttribute('data-ar', 'قبلها بـ');
    pre.setAttribute('data-en', 'before by');
    pre.textContent = tx('قبلها بـ', 'before by');
    wrap.appendChild(pre);

    var num = document.createElement('input');
    num.type = 'number'; num.min = '1'; num.max = '999'; num.step = '1';
    num.className = 'rem-lead-num';
    num.setAttribute('data-lead-num', ch);
    num.setAttribute('aria-label', tx('عدد', 'Amount'));
    wrap.appendChild(num);

    var unit = document.createElement('select');
    unit.className = 'rem-lead-unit';
    unit.setAttribute('data-lead-unit', ch);
    unit.setAttribute('aria-label', tx('الوحدة', 'Unit'));
    LEAD_UNITS.forEach(function (u) { unit.appendChild(opt(u.v, u.ar, u.en)); });
    wrap.appendChild(unit);

    host.appendChild(wrap);

    /*@3.REUJ.20*/
  }

  function renderLead(ch, minutes) {
    var host = document.querySelector('[data-lead-for="' + ch + '"]');
    if (!host) return;
    if (!host.querySelector('[data-lead]')) buildLeadControl(host, ch);

    var min = Math.max(0, Math.min(LEAD_MAX, parseInt(minutes) || 0));
    var sel = host.querySelector('[data-lead]');
    var wrap = host.querySelector('[data-lead-custom]');
    var num = host.querySelector('[data-lead-num]');
    var unit = host.querySelector('[data-lead-unit]');

    if (isPreset(min)) {
      sel.value = String(min);
      wrap.hidden = true;
      /*@3.REUJ.21*/
      var seed = splitLead(min || 60);
      num.value = String(seed.n);
      unit.value = String(seed.unit);
      return;
    }

    /*@3.REUJ.22*/
    sel.value = 'custom';
    wrap.hidden = false;
    var d = splitLead(min);
    num.value = String(d.n);
    unit.value = String(d.unit);
  }

  /*@3.REUJ.23*/
  function saveLead(ch, min, rerender) {
    var patch = { lead: {} };
    patch.lead[ch] = min;
    return window.Reminders.save(patch).then(function () {
      if (rerender) renderLead(ch, min);
      renderUpcoming();
    });
  }

  /*@3.REUJ.24*/
  function readCustom(ch) {
    var host = document.querySelector('[data-lead-for="' + ch + '"]');
    if (!host) return null;
    var n = parseInt(host.querySelector('[data-lead-num]').value);
    var u = parseInt(host.querySelector('[data-lead-unit]').value) || 1;
    if (!isFinite(n) || n < 1) return null;
    return Math.min(LEAD_MAX, n * u);
  }

  /*@3.REUJ.25*/
  function renderControls() {
    var R = window.Reminders;
    if (!R) return;
    var s = R.settings();
    var cap = R.capability();

    var master = el('rem-master');
    if (master) {
      master.setAttribute('aria-checked', s.enabled ? 'true' : 'false');
      master.disabled = !cap.supported || cap.needsInstall || cap.permission === 'denied';
    }

    Object.keys(s.channels).forEach(function (k) {
      var sw = document.querySelector('[data-chan-switch="' + k + '"]');
      if (sw) sw.setAttribute('aria-checked', s.channels[k] ? 'true' : 'false');
      var row = document.querySelector('.rem-chan[data-chan="' + k + '"]');
      if (row) row.setAttribute('data-off', s.channels[k] ? '0' : '1');
    });

    /*@3.REUJ.26*/
    /*@3.REUJ.46*/
    ['lectures', 'exams', 'tasks', 'study', 'events'].forEach(function (k) {
      renderLead(k, s.lead[k]);
    });

    var rt = el('rem-review-time'); if (rt) rt.value = s.reviewTime || '20:00';
    var q = el('rem-quiet'); if (q) q.setAttribute('aria-checked', s.quiet.on ? 'true' : 'false');
    var qf = el('rem-quiet-from'); if (qf) qf.value = s.quiet.from || '00:00';
    var qt = el('rem-quiet-to'); if (qt) qt.value = s.quiet.to || '07:00';

    document.querySelectorAll('[data-snooze]').forEach(function (chip) {
      var v = parseInt(chip.getAttribute('data-snooze'));
      chip.setAttribute('aria-pressed', (s.snooze || []).indexOf(v) >= 0 ? 'true' : 'false');
    });

    /*@3.REUJ.27*/
    var hint = el('rem-snooze-hint');
    if (hint) {
      var slots = Math.max(0, (cap.maxActions || 2) - 1);
      hint.textContent = slots <= 1
        ? tx('نظامك يُظهر زرّ غفوة واحداً — تُستخدَم أول مدة مختارة.',
             'Your system shows one snooze button — the first selected duration is used.')
        : tx('نظامك يُظهر ' + slots + ' أزرار غفوة.',
             'Your system shows ' + slots + ' snooze buttons.');
    }
  }

  /*@3.REUJ.28*/

  /*@3.REUJ.29*/
  var EMPTY_MSG = {
    unsupported: function () {
      return tx('متصفحك لا يدعم التنبيهات.', 'Your browser doesn\'t support notifications.');
    },
    'needs-install': function () {
      return tx('ثبّت الموقع على الشاشة الرئيسية أولاً — الآيفون لا يسمح بالإشعارات قبل ذلك.',
                'Install the site to your Home Screen first — iOS won\'t allow notifications otherwise.');
    },
    denied: function () {
      return tx('الإشعارات محظورة لهذا الموقع من إعدادات المتصفح — اسمح بها ثم أعد الحساب.',
                'Notifications are blocked in your browser settings — allow them, then recalculate.');
    },
    'not-granted': function () {
      return tx('فعّل المفتاح أعلاه ليطلب المتصفح إذنك مرة واحدة.',
                'Turn on the switch above — your browser will ask permission once.');
    },
    disabled: function () {
      return tx('لا أحداث خلال أسبوعين — أضف محاضرة أو مهمة أو موعداً وستظهر هنا فوراً.',
                'No events in the next two weeks — add a lecture, task, or deadline and it appears here.');
    },
    'no-events': function () {
      return tx('لا أحداث خلال أسبوعين — أضف محاضرة أو مهمة أو موعداً وستظهر هنا فوراً.',
                'No events in the next two weeks — add a lecture, task, or deadline and it appears here.');
    }
  };

  function renderUpcoming() {
    var R = window.Reminders;
    var box = el('rem-upcoming');
    if (!R || !box) return;

    R.upcoming(8).then(function (list) {
      box.innerHTML = '';
      var dg = R.diagnose ? R.diagnose() : { reason: 'ok' };

      /*@3.REUJ.30*/
      var cnt = el('rem-up-count');
      if (cnt) cnt.textContent = list.length ? String(list.length) : '—';

      if (!list.length) {
        var e = document.createElement('div');
        e.className = 'rem-up-empty';
        /*@3.REUJ.31*/
        e.textContent = EMPTY_MSG[dg.reason] ? EMPTY_MSG[dg.reason]()
          : tx('لا تنبيهات قادمة خلال أسبوعين — أضف محاضرات أو مهام أو مواعيد.',
               'No reminders in the next two weeks — add lectures, tasks, or deadlines.');
        box.appendChild(e);
        return;
      }

      /*@3.REUJ.32*/
      if (dg.reason !== 'ok') {
        var pv = document.createElement('div');
        pv.className = 'rem-up-preview';
        pv.textContent = tx('معاينة — هذه ما سيصلك بعد التفعيل. لا يُسلَّم شيء الآن.',
                            'Preview — this is what you\'d get once enabled. Nothing is delivered yet.');
        box.appendChild(pv);
      }
      list.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'rem-up-item';
        row.setAttribute('data-kind', it.kind);

        var dot = document.createElement('span');
        dot.className = 'rem-up-dot';

        var main = document.createElement('div');
        main.className = 'rem-up-main';
        var t = document.createElement('div');
        t.className = 'rem-up-title';
        t.textContent = it.title;                       /*@3.REUJ.33*/
        var w = document.createElement('div');
        w.className = 'rem-up-when';
        w.textContent = R.fmtWhen(it.fireAt);
        main.appendChild(t); main.appendChild(w);

        row.appendChild(dot); row.appendChild(main);
        if (it.snoozedTo) {
          var s = document.createElement('span');
          s.className = 'rem-up-snoozed';
          s.textContent = tx('مؤجَّل', 'snoozed');
          row.appendChild(s);
        }
        box.appendChild(row);
      });
    });
  }

  function renderAll() { renderStatus(); renderPermHint(); renderControls(); renderUpcoming(); }

  /*@3.REUJ.34*/
  function bind() {
    panel = el('rem-panel');
    if (!panel || !window.Reminders) return;
    var R = window.Reminders;

    /*@3.REUJ.35*/
    var master = el('rem-master');
    if (master) master.addEventListener('click', function () {
      var on = master.getAttribute('aria-checked') === 'true';
      if (on) { R.save({ enabled: false }).then(renderAll); return; }

      R.requestPermission().then(function (p) {
        if (p === 'granted') return R.save({ enabled: true });
        R.save({ enabled: false });
      }).then(renderAll).then(renderUpcoming);
    });

    /*@3.REUJ.36*/
    panel.addEventListener('click', function (e) {
      var sw = e.target.closest('[data-chan-switch]');
      if (sw) {
        var k = sw.getAttribute('data-chan-switch');
        var on = sw.getAttribute('aria-checked') === 'true';
        var patch = { channels: {} };
        patch.channels[k] = !on;
        R.save(patch).then(renderAll);
        return;
      }

      var chip = e.target.closest('[data-snooze]');
      if (chip) {
        var v = parseInt(chip.getAttribute('data-snooze'));
        var cur = (R.settings().snooze || []).slice();
        var i = cur.indexOf(v);
        if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); }
        else cur.push(v);
        cur.sort(function (a, b) { return a - b; });
        R.settings().snooze = cur;          /*@3.REUJ.37*/
        R.save().then(renderAll);
        return;
      }

      var q = e.target.closest('#rem-quiet');
      if (q) {
        var qon = q.getAttribute('aria-checked') === 'true';
        R.save({ quiet: { on: !qon } }).then(renderAll).then(renderUpcoming);
      }
    });

    /*@3.REUJ.38*/
    panel.addEventListener('change', function (e) {
      /*@3.REUJ.39*/
      var lead = e.target.closest('[data-lead]');
      if (lead) {
        var ch = lead.getAttribute('data-lead');
        if (lead.value === 'custom') {
          /*@3.REUJ.40*/
          var host = lead.closest('[data-lead-for]');
          host.querySelector('[data-lead-custom]').hidden = false;
          host.querySelector('[data-lead-num]').focus();
          var seeded = readCustom(ch);
          if (seeded !== null) saveLead(ch, seeded, false);
          return;
        }
        saveLead(ch, parseInt(lead.value) || 0, true);
        return;
      }

      /*@3.REUJ.41*/
      var custom = e.target.closest('[data-lead-num], [data-lead-unit]');
      if (custom) {
        var ck = custom.getAttribute('data-lead-num') || custom.getAttribute('data-lead-unit');
        var val = readCustom(ck);
        if (val !== null) saveLead(ck, val, false);
        return;
      }
      if (e.target.id === 'rem-review-time') {
        R.save({ reviewTime: e.target.value || '20:00' }).then(renderUpcoming);
      }
      if (e.target.id === 'rem-quiet-from' || e.target.id === 'rem-quiet-to') {
        R.save({ quiet: {
          from: el('rem-quiet-from').value || '00:00',
          to: el('rem-quiet-to').value || '07:00'
        } }).then(renderUpcoming);
      }
    });

    /*@3.REUJ.42*/
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'rem-test') {
        R.test().then(function (p) {
          if (p === 'denied') alert(tx('الإشعارات محظورة لهذا الموقع — اسمح بها من إعدادات المتصفح.',
                                       'Notifications are blocked for this site — allow them in browser settings.'));
          else if (p === 'needs-install') alert(tx('ثبّت الموقع كتطبيق أولاً (شارك ← إضافة إلى الشاشة الرئيسية).',
                                                   'Install the site as an app first (Share ← Add to Home Screen).'));
          /*@3.REUJ.43*/
          else if (p === 'granted' && !R.settings().enabled) {
            if (confirm(tx('وصلك الإشعار التجريبي — لكن التنبيهات ما زالت مطفأة، فلن يصلك شيء في مواعيده. أفعّلها الآن؟',
                           'The test arrived — but reminders are still off, so nothing scheduled will reach you. Turn them on now?'))) {
              R.save({ enabled: true }).then(renderAll);
              return;
            }
          }
          renderAll();
        });
      } else if (act === 'rem-refresh') {
        /*@3.REUJ.44*/
        R.refresh().then(renderAll);
      } else if (act === 'rem-test-server') {
        serverTest(b);
      }
    });

    document.addEventListener('reminders:synced', renderUpcoming);
    document.addEventListener('reminders:snoozed', function () {
      renderUpcoming();
    });
    document.addEventListener('garden:languageChanged', renderAll);
    /*@3.REUJ.45*/
    document.addEventListener('reminders:synced', markBrave);

    renderAll();
    markBrave();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else { bind(); }
})();
