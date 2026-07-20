 
;(function () {
  'use strict';

  function lang() {
    return document.documentElement.getAttribute('lang')
      || localStorage.getItem('garden_lang') || 'ar';
  }
  function tx(ar, en) { return lang() === 'ar' ? ar : en; }
  function el(id) { return document.getElementById(id); }

  var panel = null;

   
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
    } else if (cap.permission !== 'granted') {
      state = 'off'; ic = 'fa-bell';
      tt = tx('التنبيهات غير مفعَّلة', 'Reminders are off');
      nn = tx('فعّل المفتاح أدناه وسيطلب المتصفح إذنك مرة واحدة.',
              'Turn on the switch below — your browser will ask permission once.');
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
      state = 'partial'; ic = 'fa-bell';
      tt = tx('تعمل — عند فتح الموقع', 'Working — while the site is open');
      nn = tx('متصفحك لا يدعم التسليم المسبق، فالتنبيه يصل ما دام الموقع أو التطبيق مفتوحاً. وما يفوتك يُعرض لك ملخصاً عند أول فتح — لا يضيع.',
              'Your browser doesn\'t support scheduled delivery, so reminders arrive while the site or app is open. Anything missed is summarized for you next time — nothing is lost.');
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

   
  function fmtLead(min) {
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

   
  function setLead(sel, value) {
    var v = String(parseInt(value) || 0);
    var found = Array.prototype.some.call(sel.options, function (o) {
      return o.value === v && !o.hasAttribute('data-custom');
    });
    var existingCustom = sel.querySelector('[data-custom]');

     
    if (!found && existingCustom && existingCustom.value === v) {
      existingCustom.textContent = fmtLead(parseInt(v));
      sel.value = v;
      return;
    }

    if (!found) {
      if (existingCustom) existingCustom.remove();
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = fmtLead(parseInt(v));
      opt.setAttribute('data-custom', '1');
       
      var before = Array.prototype.find.call(sel.options, function (o) {
        return parseInt(o.value) > parseInt(v);
      });
      sel.insertBefore(opt, before || null);
    } else {
       
      Array.prototype.slice.call(sel.querySelectorAll('[data-custom]')).forEach(function (o) {
        if (o.value !== v) o.remove();
      });
    }
    sel.value = v;
  }

   
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

    ['lectures', 'exams', 'tasks'].forEach(function (k) {
      var sel = document.querySelector('[data-lead="' + k + '"]');
      if (sel) setLead(sel, s.lead[k]);
    });

    var rt = el('rem-review-time'); if (rt) rt.value = s.reviewTime || '20:00';
    var q = el('rem-quiet'); if (q) q.setAttribute('aria-checked', s.quiet.on ? 'true' : 'false');
    var qf = el('rem-quiet-from'); if (qf) qf.value = s.quiet.from || '00:00';
    var qt = el('rem-quiet-to'); if (qt) qt.value = s.quiet.to || '07:00';

    document.querySelectorAll('[data-snooze]').forEach(function (chip) {
      var v = parseInt(chip.getAttribute('data-snooze'));
      chip.setAttribute('aria-pressed', (s.snooze || []).indexOf(v) >= 0 ? 'true' : 'false');
    });

     
    var hint = el('rem-snooze-hint');
    if (hint) {
      var slots = Math.max(0, (cap.maxActions || 2) - 1);
      hint.textContent = slots <= 1
        ? tx('نظامك يعرض زرّ غفوة واحداً مع زر «تم» — أول مدة مختارة هي المستخدَمة.',
             'Your system shows one snooze button plus “Done” — the first selected duration is used.')
        : tx('نظامك يعرض ' + slots + ' أزرار غفوة مع زر «تم».',
             'Your system shows ' + slots + ' snooze buttons plus “Done”.');
    }
  }

   
  function renderUpcoming() {
    var R = window.Reminders;
    var box = el('rem-upcoming');
    if (!R || !box) return;

    R.upcoming(8).then(function (list) {
      box.innerHTML = '';
      if (!list.length) {
        var e = document.createElement('div');
        e.className = 'rem-up-empty';
        e.textContent = R.settings().enabled
          ? tx('لا تنبيهات قادمة خلال أسبوعين — أضف محاضرات أو مهام أو مواعيد.',
               'No reminders in the next two weeks — add lectures, tasks, or deadlines.')
          : tx('فعّل التنبيهات لترى ما سيصلك.', 'Turn reminders on to see what\'s coming.');
        box.appendChild(e);
        return;
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
        t.textContent = it.title;                       
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

  function renderAll() { renderStatus(); renderControls(); renderUpcoming(); }

   
  function bind() {
    panel = el('rem-panel');
    if (!panel || !window.Reminders) return;
    var R = window.Reminders;

     
    var master = el('rem-master');
    if (master) master.addEventListener('click', function () {
      var on = master.getAttribute('aria-checked') === 'true';
      if (on) { R.save({ enabled: false }).then(renderAll); return; }

      R.requestPermission().then(function (p) {
        if (p === 'granted') return R.save({ enabled: true });
        R.save({ enabled: false });
      }).then(renderAll).then(renderUpcoming);
    });

     
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
        R.settings().snooze = cur;          
        R.save().then(renderAll);
        return;
      }

      var q = e.target.closest('#rem-quiet');
      if (q) {
        var qon = q.getAttribute('aria-checked') === 'true';
        R.save({ quiet: { on: !qon } }).then(renderAll).then(renderUpcoming);
      }
    });

     
    panel.addEventListener('change', function (e) {
      var lead = e.target.closest('[data-lead]');
      if (lead) {
        var patch = { lead: {} };
        patch.lead[lead.getAttribute('data-lead')] = parseInt(lead.value) || 0;
        R.save(patch).then(renderUpcoming);
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
          renderAll();
        });
      } else if (act === 'rem-refresh') {
        R.sync().then(renderAll);
      }
    });

    document.addEventListener('reminders:synced', renderUpcoming);
    document.addEventListener('reminders:snoozed', function () {
      renderUpcoming();
    });
    document.addEventListener('garden:languageChanged', renderAll);

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else { bind(); }
})();
