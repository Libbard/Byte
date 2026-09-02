/*@3.REPJ.1*/

(function () {
  'use strict';

  var HTML = `
<div id="rem-panel">

  <!--@3.REPJ.3-->
  <div class="rem-status" id="rem-status" data-state="off">
    <span class="rem-status-icon" id="rem-status-icon"><i class="fa-solid fa-bell-slash"></i></span>
    <div class="rem-status-body">
      <div class="rem-status-title" id="rem-status-title">—</div>
      <div class="rem-status-note" id="rem-status-note">—</div>
      <div class="rem-status-actions" id="rem-status-actions"></div>
    </div>
  </div>

  <!--@3.REPJ.4-->
  <div class="rem-master">
    <div>
      <div class="rem-master-label" data-ar="تفعيل التنبيهات" data-en="Enable reminders">تفعيل التنبيهات</div>
      <div class="rem-master-sub" data-ar="تصلك على كل أجهزتك حتى والموقع مغلق — خلال دقيقة إلى دقيقتين من موعدها."
           data-en="Delivered to all your devices even when the site is closed — within one to two minutes of the time.">تصلك على كل أجهزتك حتى والموقع مغلق — خلال دقيقة إلى دقيقتين من موعدها.</div>
    </div>
    <button class="rem-switch" id="rem-master" role="switch" aria-checked="false"
            aria-label="تفعيل التنبيهات"></button>
  </div>

  <!--@3.REPJ.5-->
  <div class="rem-help rem-help-warn" id="rem-perm-hint" hidden>
    <span class="rem-help-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
    <div>
      <div class="rem-help-title" data-ar="حين يسألك المتصفح: اختر «السماح» لا «هذه المرة فقط»"
           data-en="When your browser asks: choose “Allow”, not “Allow this time”">حين يسألك المتصفح: اختر «السماح» لا «هذه المرة فقط»</div>
      <div class="rem-help-body" data-ar="خيار «السماح هذه المرة فقط» (أو «أثناء الزيارة») ينتهي فور إغلاق المتصفح، فتبدو التنبيهات مفعّلة عندنا ولا يصلك شيءٌ إطلاقاً والموقع مغلق — ثم تجدها كل مرة «مفعّلة والإذن ناقص». اختر «السماح» أو «السماح دائماً» ليبقى الإذن بعد الإغلاق."
           data-en="“Allow this time” (or “Allow while visiting”) expires the moment you close the browser: reminders look enabled here, yet nothing ever arrives while the site is closed — and you keep finding it “enabled, permission missing”. Choose “Allow” or “Always allow” so the permission survives closing.">خيار «السماح هذه المرة فقط» (أو «أثناء الزيارة») ينتهي فور إغلاق المتصفح، فتبدو التنبيهات مفعّلة عندنا ولا يصلك شيءٌ إطلاقاً والموقع مغلق — ثم تجدها كل مرة «مفعّلة والإذن ناقص». اختر «السماح» أو «السماح دائماً» ليبقى الإذن بعد الإغلاق.</div>
    </div>
  </div>

  <!--@3.REPJ.6-->
  <details class="rem-tshoot" id="rem-tshoot">
    <summary class="rem-tshoot-sum">
      <i class="fa-solid fa-circle-question rem-tshoot-icon"></i>
      <span data-ar="لا تصلك التنبيهات؟" data-en="Not receiving notifications?">لا تصلك التنبيهات؟</span>
      <span class="rem-tshoot-hint" data-ar="أسئلة وأجوبة" data-en="Q&amp;A">أسئلة وأجوبة</span>
      <i class="fa-solid fa-chevron-down rem-tshoot-caret"></i>
    </summary>

    <!--@3.REPJ.7-->
    <div class="rem-tshoot-body">

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="كيف تصل التنبيهات فعلاً؟" data-en="How does delivery actually work?">كيف تصل التنبيهات فعلاً؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="حين تُضيف محاضرةً أو اختباراً أو مهمةً أو تذكيرَ ملاحظة، يحسب جهازك موعد التنبيه ويرفع الوقت وحده إلى خادم صغير لنا. الخادم لا يعرف عنوان الحدث ولا محتواه ولا اسمك — يعرف رقماً مجهولاً للخزنة ولحظةً في التقويم، لا أكثر."
             data-en="When you add a lecture, exam, task, or note reminder, your device computes the alert time and uploads the time alone to a small server of ours. The server never learns the event title, its contents, or who you are — only an anonymous vault number and a moment on the clock.">حين تُضيف محاضرةً أو اختباراً أو مهمةً أو تذكيرَ ملاحظة، يحسب جهازك موعد التنبيه ويرفع الوقت وحده إلى خادم صغير لنا. الخادم لا يعرف عنوان الحدث ولا محتواه ولا اسمك — يعرف رقماً مجهولاً للخزنة ولحظةً في التقويم، لا أكثر.</p>
          <p class="rem-ts-p" data-ar="في تلك اللحظة يوقظ الخادمُ أجهزتك بنبضةٍ فارغة، فيقرأ جهازك نصَّ التنبيه من ذاكرته هو ويعرضه. ولهذا يصلك التنبيه كاملاً وأنت مطمئنٌّ أن لا شيء من بياناتك غادر جهازك."
             data-en="At that moment the server wakes your devices with an empty ping; your device then reads the reminder text from its own storage and shows it. That is why the notification arrives complete while none of your data ever leaves your device.">في تلك اللحظة يوقظ الخادمُ أجهزتك بنبضةٍ فارغة، فيقرأ جهازك نصَّ التنبيه من ذاكرته هو ويعرضه. ولهذا يصلك التنبيه كاملاً وأنت مطمئنٌّ أن لا شيء من بياناتك غادر جهازك.</p>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="لماذا يتأخّر التنبيه دقيقة أو دقيقتين؟" data-en="Why is the notification one or two minutes late?">لماذا يتأخّر التنبيه دقيقة أو دقيقتين؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="لأنه لا يصل في نفس الثانية — وهذا تصميمٌ لا عطل. ساعةُ الخادم تفحص المواعيد المستحقّة مرةً كل دقيقة، ثم تسلكُ النبضةُ خدمةَ الدفع في متصفحك (جوجل لكروم وبريف وأندرويد · آبل لسفاري) وقد تؤخّرها ثوانيَ أخرى — خاصةً والجهاز نائم."
             data-en="Because it is not instant — and that is by design, not a fault. Our server clock scans due times once a minute, then the ping travels through your browser’s push service (Google for Chrome/Brave/Android, Apple for Safari), which may add a few more seconds — especially while the device sleeps.">لأنه لا يصل في نفس الثانية — وهذا تصميمٌ لا عطل. ساعةُ الخادم تفحص المواعيد المستحقّة مرةً كل دقيقة، ثم تسلكُ النبضةُ خدمةَ الدفع في متصفحك (جوجل لكروم وبريف وأندرويد · آبل لسفاري) وقد تؤخّرها ثوانيَ أخرى — خاصةً والجهاز نائم.</p>
          <p class="rem-ts-p" data-ar="فتأخّرُ دقيقةٍ إلى دقيقتين طبيعيّ تماماً. وإن تأخّر أكثر من خمس دقائق فالمشكلة حقيقية، وأجوبتُها في الأسئلة التالية."
             data-en="So one to two minutes late is entirely normal. Beyond five minutes something is genuinely wrong — the questions below cover it.">فتأخّرُ دقيقةٍ إلى دقيقتين طبيعيّ تماماً. وإن تأخّر أكثر من خمس دقائق فالمشكلة حقيقية، وأجوبتُها في الأسئلة التالية.</p>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="كيف أختبر أنها تعمل فعلاً؟" data-en="How do I test that it really works?">كيف أختبر أنها تعمل فعلاً؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <ol class="rem-ts-list">
            <li data-ar="«الخيارات ← تجربةٌ حقيقية ← هذا الجهاز»: يعرض إشعاراً في هذا الجهاز وحده. إن لم يظهر فالعطل في إذن المتصفح أو في «عدم الإزعاج» بنظامك — ولا علاقة له بالخادم."
                data-en="“Options → A real test → This device”: shows a notification on this device only. If nothing appears, the problem is the browser permission or your system’s Do-Not-Disturb — nothing to do with the server.">«الخيارات ← تجربةٌ حقيقية ← هذا الجهاز»: يعرض إشعاراً في هذا الجهاز وحده. إن لم يظهر فالعطل في إذن المتصفح أو في «عدم الإزعاج» بنظامك — ولا علاقة له بالخادم.</li>
            <li data-ar="«الخيارات ← تجربةٌ حقيقية ← كلُّ أجهزتي»: يمرّ بالسلسلة كاملة ويوقظ كل جهازٍ فعّلت التنبيهات فيه. أغلق الموقع في جوالك ثم اضغطه من الحاسب وانتظر دقيقتين — هذه هي التجربة الحقيقية."
                data-en="“Options → A real test → All my devices”: goes through the whole chain and wakes every device where you enabled reminders. Close the site on your phone, press it on your computer, and wait two minutes — this is the real test.">«الخيارات ← تجربةٌ حقيقية ← كلُّ أجهزتي»: يمرّ بالسلسلة كاملة ويوقظ كل جهازٍ فعّلت التنبيهات فيه. أغلق الموقع في جوالك ثم اضغطه من الحاسب وانتظر دقيقتين — هذه هي التجربة الحقيقية.</li>
            <li data-ar="وصل لجهازٍ دون آخر؟ الجهاز الصامت لم يشترك: افتح الموقع فيه، فعّل التنبيهات، وتأكد أن مفتاح المزامنة هو نفسه في الجهازين."
                data-en="Arrived on one device but not another? The silent one is not subscribed: open the site there, turn reminders on, and confirm both devices use the same sync key.">وصل لجهازٍ دون آخر؟ الجهاز الصامت لم يشترك: افتح الموقع فيه، فعّل التنبيهات، وتأكد أن مفتاح المزامنة هو نفسه في الجهازين.</li>
            <li data-ar="للتجربة حدٌّ: خمس مرات في الساعة — لأنها توقظ أجهزتك كلها في كل ضغطة. وتجاوزُ الحدّ ليس عطلاً."
                data-en="The test is capped at five per hour — each press wakes all your devices. Hitting the cap is not a fault.">للتجربة حدٌّ: خمس مرات في الساعة — لأنها توقظ أجهزتك كلها في كل ضغطة. وتجاوزُ الحدّ ليس عطلاً.</li>
          </ol>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="جوالي أندرويد ولا يصلني شيء — ماذا أفعل؟" data-en="I use Android and get nothing — what do I do?">جوالي أندرويد ولا يصلني شيء — ماذا أفعل؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <ol class="rem-ts-list">
            <li data-ar="ثبّت الموقع كتطبيق: قائمة المتصفح ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». التطبيق المثبَّت يبقى مؤهَّلاً للإيقاظ أطولَ بكثير من تبويبٍ عابر."
                data-en="Install the site as an app: browser menu → “Install app” or “Add to Home screen”. An installed app stays eligible for wake-ups far longer than a stray tab.">ثبّت الموقع كتطبيق: قائمة المتصفح ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». التطبيق المثبَّت يبقى مؤهَّلاً للإيقاظ أطولَ بكثير من تبويبٍ عابر.</li>
            <li data-ar="أوقف توفير البطارية عنه: إعدادات النظام ← التطبيقات ← (المتصفح أو أيقونة الحديقة) ← البطارية ← «غير مُقيَّد». وهذا أشهر سببٍ لاختفاء التنبيهات في أندرويد، وفي أجهزة شاومي وأوبو وهواوي بالذات."
                data-en="Exempt it from battery optimisation: System Settings → Apps → (your browser or the Garden icon) → Battery → “Unrestricted”. This is the single most common cause of vanishing notifications on Android — especially Xiaomi, Oppo, and Huawei.">أوقف توفير البطارية عنه: إعدادات النظام ← التطبيقات ← (المتصفح أو أيقونة الحديقة) ← البطارية ← «غير مُقيَّد». وهذا أشهر سببٍ لاختفاء التنبيهات في أندرويد، وفي أجهزة شاومي وأوبو وهواوي بالذات.</li>
            <li data-ar="تأكد أن إشعارات المتصفح مسموحة في إعدادات النظام نفسه، لا في المتصفح وحده."
                data-en="Make sure the browser’s notifications are allowed in the system settings too, not only inside the browser.">تأكد أن إشعارات المتصفح مسموحة في إعدادات النظام نفسه، لا في المتصفح وحده.</li>
          </ol>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="آيفوني أو آيبادي لا يصله شيء — ماذا أفعل؟" data-en="My iPhone or iPad gets nothing — what do I do?">آيفوني أو آيبادي لا يصله شيء — ماذا أفعل؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="التثبيت شرطٌ لا خيار: آبل تمنع إشعارات المواقع في سفاري العادي منعاً تاماً."
             data-en="Installing is mandatory, not optional: Apple blocks web notifications in ordinary Safari entirely.">التثبيت شرطٌ لا خيار: آبل تمنع إشعارات المواقع في سفاري العادي منعاً تاماً.</p>
          <ol class="rem-ts-list">
            <li data-ar="افتح الموقع في سفاري ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»."
                data-en="Open the site in Safari → Share → “Add to Home Screen”.">افتح الموقع في سفاري ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية».</li>
            <li data-ar="افتحه بعدها من الأيقونة لا من سفاري، ثم فعّل التنبيهات من هذه اللوحة. تفعيلُها داخل سفاري لن ينفع مهما تكرّر."
                data-en="Then open it from the icon, not from Safari, and enable reminders here. Enabling inside Safari will never work, however many times you try.">افتحه بعدها من الأيقونة لا من سفاري، ثم فعّل التنبيهات من هذه اللوحة. تفعيلُها داخل سفاري لن ينفع مهما تكرّر.</li>
            <li data-ar="يلزم iOS 16.4 أو أحدث. وتأكد أن «التركيز» أو «عدم الإزعاج» غير مُفعَّل."
                data-en="iOS 16.4 or newer is required. Also check that Focus / Do Not Disturb is off.">يلزم iOS 16.4 أو أحدث. وتأكد أن «التركيز» أو «عدم الإزعاج» غير مُفعَّل.</li>
          </ol>
        </div>
      </details>

      <details class="rem-qa" id="rem-ts-brave">
        <summary class="rem-qa-q"><span data-ar="أستعمل Brave ولا يصلني إلا والصفحة مفتوحة؟" data-en="I use Brave and only get them while the page is open?">أستعمل Brave ولا يصلني إلا والصفحة مفتوحة؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="لأن إعدادَي Brave اثنان لا واحد: يوقف خدمة الدفع افتراضياً، ولا يُبقي نفسه حياً بعد الإغلاق. ومن يضبط الأول وحده يرى كل شيء أخضر في هذه اللوحة ولا يصله شيءٌ والنافذة مغلقة."
             data-en="Because Brave has two settings, not one: it disables the push service by default and does not keep itself alive after closing. If you set only the first, everything here looks green yet nothing arrives once the window is closed.">لأن إعدادَي Brave اثنان لا واحد: يوقف خدمة الدفع افتراضياً، ولا يُبقي نفسه حياً بعد الإغلاق. ومن يضبط الأول وحده يرى كل شيء أخضر في هذه اللوحة ولا يصله شيءٌ والنافذة مغلقة.</p>
          <ol class="rem-ts-list">
            <li data-ar="brave://settings/privacy ← فعّل «Use Google services for push messaging». بدونها لا يُنشأ اشتراك التنبيهات أصلاً."
                data-en="brave://settings/privacy → enable “Use Google services for push messaging”. Without it, no push subscription is created at all.">brave://settings/privacy ← فعّل «Use Google services for push messaging». بدونها لا يُنشأ اشتراك التنبيهات أصلاً.</li>
            <li data-ar="brave://settings/system ← فعّل «Continue running background apps when Brave is closed». بدونها لا يصلك شيء إلا والمتصفح مفتوح."
                data-en="brave://settings/system → enable “Continue running background apps when Brave is closed”. Without it nothing arrives unless the browser is open.">brave://settings/system ← فعّل «Continue running background apps when Brave is closed». بدونها لا يصلك شيء إلا والمتصفح مفتوح.</li>
            <li data-ar="أعد تشغيل Brave، ثم أعد تجربةَ «كلُّ أجهزتي»."
                data-en="Restart Brave, then run “All my devices” again.">أعد تشغيل Brave، ثم أعد تجربةَ «كلُّ أجهزتي».</li>
          </ol>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="حاسبي (كروم · إيدج · فايرفوكس) لا يصله والنافذة مغلقة؟" data-en="My computer (Chrome · Edge · Firefox) gets nothing when the window is closed?">حاسبي (كروم · إيدج · فايرفوكس) لا يصله والنافذة مغلقة؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <ol class="rem-ts-list">
            <li data-ar="لا بدّ أن يبقى المتصفح يعمل — ولو بلا أي نافذة مفتوحة. إغلاقه كلياً من شريط المهام يوقف كل إشعارات المواقع، وهذا سلوك النظام لا الموقع."
                data-en="The browser must keep running — even with no window open. Quitting it entirely from the taskbar stops all web notifications; that is the operating system, not this site.">لا بدّ أن يبقى المتصفح يعمل — ولو بلا أي نافذة مفتوحة. إغلاقه كلياً من شريط المهام يوقف كل إشعارات المواقع، وهذا سلوك النظام لا الموقع.</li>
            <li data-ar="في ويندوز: الإعدادات ← النظام ← الإشعارات — تأكد أن متصفحك مسموح، وأن «مساعد التركيز» أو «عدم الإزعاج» مطفأ."
                data-en="On Windows: Settings → System → Notifications — confirm your browser is allowed and that Focus Assist / Do Not Disturb is off.">في ويندوز: الإعدادات ← النظام ← الإشعارات — تأكد أن متصفحك مسموح، وأن «مساعد التركيز» أو «عدم الإزعاج» مطفأ.</li>
            <li data-ar="ثبّت الموقع كتطبيق (أيقونة التثبيت في شريط العنوان) — يجعله أثبتَ وأسرعَ استيقاظاً."
                data-en="Install the site as an app (the install icon in the address bar) — it makes wake-ups more reliable and faster.">ثبّت الموقع كتطبيق (أيقونة التثبيت في شريط العنوان) — يجعله أثبتَ وأسرعَ استيقاظاً.</li>
          </ol>
        </div>
      </details>

      <!--@3.REPJ.8-->
      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="سجلّي فارغ مع أن التنبيهات تصلني — لماذا؟" data-en="My history is empty although alerts do arrive — why?">سجلّي فارغ مع أن التنبيهات تصلني — لماذا؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="لأن السجلّ شهادةٌ لا تنبّؤ: لا يُكتب فيه سطرٌ إلا عن تنبيهٍ يشهد الخادمُ أو جهازُك بإرساله فعلاً. فلو ملأناه بما «كان مُقرّراً أن يُرسل» لصار وعداً لا سجلاً — وهو أسوأ من الفراغ."
             data-en="Because the history is a witness, not a prediction: a line appears only for an alert the server or your device confirms it actually sent. Filling it with what was “scheduled to send” would make it a promise, not a record — worse than empty.">لأن السجلّ شهادةٌ لا تنبّؤ: لا يُكتب فيه سطرٌ إلا عن تنبيهٍ يشهد الخادمُ أو جهازُك بإرساله فعلاً. فلو ملأناه بما «كان مُقرّراً أن يُرسل» لصار وعداً لا سجلاً — وهو أسوأ من الفراغ.</p>
          <p class="rem-ts-p" data-ar="وسجلُّ الجهاز محليٌّ لا يُزامَن: ما وصلك على الجوّال لا يظهر في سجلّ الحاسب. أما سجلُّ الخادم فيُحفظ ستين يوماً ثم يُمسح. وما وصلك قبل هذا التحديث لم يكن يُسجَّل أصلاً، فسجلُّك يبدأ من اليوم."
             data-en="And the device history is local, never synced: what arrived on your phone will not show on your computer. Server history is kept for sixty days, then erased. Anything delivered before this update was not recorded at all, so your history starts today.">وسجلُّ الجهاز محليٌّ لا يُزامَن: ما وصلك على الجوّال لا يظهر في سجلّ الحاسب. أما سجلُّ الخادم فيُحفظ ستين يوماً ثم يُمسح. وما وصلك قبل هذا التحديث لم يكن يُسجَّل أصلاً، فسجلُّك يبدأ من اليوم.</p>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="ما الفرق بين «من الخادم» و«من هذا الجهاز» في السجل؟" data-en="What is the difference between “from the server” and “this device”?">ما الفرق بين «من الخادم» و«من هذا الجهاز» في السجل؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <p class="rem-ts-p" data-ar="«من الخادم» يعني أن خادمنا هو الذي أطلقه ووصل كلَّ أجهزتك: مقعدٌ شغر في شعبة، فصلٌ جديد نزل، موعدٌ من تقويم البلاك بورد. وهذه تصلك ولو لم تفتح الموقعَ منذ أسبوع."
             data-en="“From the server” means our server fired it and it reached all your devices: a seat opened, a new term was published, a Blackboard date came due. These reach you even if you have not opened the site in a week.">«من الخادم» يعني أن خادمنا هو الذي أطلقه ووصل كلَّ أجهزتك: مقعدٌ شغر في شعبة، فصلٌ جديد نزل، موعدٌ من تقويم البلاك بورد. وهذه تصلك ولو لم تفتح الموقعَ منذ أسبوع.</p>
          <p class="rem-ts-p" data-ar="و«من هذا الجهاز» يعني أن جهازك جدوله وعرضه بنفسه من ذاكرته: محاضراتك واختباراتك ومهامّك. وهو أقوى وأخصّ — لأن نصَّ التنبيه لا يغادر جهازك — لكنه لا يظهر إلا في سجلّ الجهاز الذي عرضه."
             data-en="“This device” means your own device scheduled and showed it from its own storage: your lectures, exams and tasks. That is stronger and more private — the text never leaves your device — but it appears only in the history of the device that showed it.">و«من هذا الجهاز» يعني أن جهازك جدوله وعرضه بنفسه من ذاكرته: محاضراتك واختباراتك ومهامّك. وهو أقوى وأخصّ — لأن نصَّ التنبيه لا يغادر جهازك — لكنه لا يظهر إلا في سجلّ الجهاز الذي عرضه.</p>
          <p class="rem-ts-p" data-ar="ولهذا يبقى نصُّ كلِّ سطرٍ بلغة إرساله: لو بدّلتَ لغةَ الموقع بعد وصوله فلن يُترجَم، لأنه يعرض ما قرأتَه أنت على شاشة قفلك لا ترجمةً له."
             data-en="That is also why each line keeps the language it was sent in: switching the site language afterwards will not translate it, because it shows what you actually read on your lock screen — not a translation of it.">ولهذا يبقى نصُّ كلِّ سطرٍ بلغة إرساله: لو بدّلتَ لغةَ الموقع بعد وصوله فلن يُترجَم، لأنه يعرض ما قرأتَه أنت على شاشة قفلك لا ترجمةً له.</p>
        </div>
      </details>

      <details class="rem-qa">
        <summary class="rem-qa-q"><span data-ar="جرّبت كل ما سبق وما زال لا يعمل؟" data-en="I tried everything above and it still does not work?">جرّبت كل ما سبق وما زال لا يعمل؟</span><i class="fa-solid fa-chevron-down rem-qa-caret"></i></summary>
        <div class="rem-qa-a">
          <ol class="rem-ts-list">
            <li data-ar="حاجب الإعلانات أو VPN قد يحجب خدمة الدفع (googleapis.com). جرّب في نافذة تصفّح خفيّ بلا إضافات."
                data-en="An ad blocker or VPN may block the push service (googleapis.com). Try an incognito window with extensions disabled.">حاجب الإعلانات أو VPN قد يحجب خدمة الدفع (googleapis.com). جرّب في نافذة تصفّح خفيّ بلا إضافات.</li>
            <li data-ar="أطفئ مفتاح التنبيهات وأشعله من جديد — يُنشئ اشتراكاً جديداً بديلاً عن أيّ اشتراكٍ أبطلَه المتصفح."
                data-en="Turn the reminders switch off and on again — this creates a fresh subscription to replace one the browser may have invalidated.">أطفئ مفتاح التنبيهات وأشعله من جديد — يُنشئ اشتراكاً جديداً بديلاً عن أيّ اشتراكٍ أبطلَه المتصفح.</li>
            <li data-ar="افتح الموقع مرةً في كل جهاز بعد إضافة أحداثٍ جديدة: نصُّ التنبيه يُقرأ من ذاكرة الجهاز نفسه، فالجهاز الذي لم يرَ الحدث بعد يستيقظ ولا يجد ما يعرضه."
                data-en="Open the site once on each device after adding new events: the text is read from that device’s own storage, so a device that has not seen the event yet wakes up with nothing to show.">افتح الموقع مرةً في كل جهاز بعد إضافة أحداثٍ جديدة: نصُّ التنبيه يُقرأ من ذاكرة الجهاز نفسه، فالجهاز الذي لم يرَ الحدث بعد يستيقظ ولا يجد ما يعرضه.</li>
          </ol>
        </div>
      </details>

    </div>
  </details>

  <!--@3.REPJ.9-->
  <div class="rem-chans" id="rem-chans">
    <div class="rem-chan" data-chan="lectures">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-chalkboard-user"></i></span>
        <div class="rem-chan-name" data-ar="قبل المحاضرة" data-en="Before lectures">قبل المحاضرة</div>
        <button class="rem-switch" role="switch" data-chan-switch="lectures" aria-checked="true"></button>
      </div>
      <div class="rem-chan-lead" data-lead-for="lectures"></div>
    </div>

    <div class="rem-chan" data-chan="exams">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-file-pen"></i></span>
        <div class="rem-chan-name" data-ar="قبل الاختبار" data-en="Before exams">قبل الاختبار</div>
        <button class="rem-switch" role="switch" data-chan-switch="exams" aria-checked="true"></button>
      </div>
      <div class="rem-chan-lead" data-lead-for="exams"></div>
    </div>

    <div class="rem-chan" data-chan="tasks">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-list-check"></i></span>
        <div class="rem-chan-name" data-ar="المهام والمواعيد" data-en="Tasks & deadlines">المهام والمواعيد</div>
        <button class="rem-switch" role="switch" data-chan-switch="tasks" aria-checked="true"></button>
      </div>
      <div class="rem-chan-lead" data-lead-for="tasks"></div>
    </div>

    <!--@3.REPJ.14-->
    <div class="rem-chan" data-chan="study">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-book-open"></i></span>
        <div class="rem-chan-name" data-ar="قبل المذاكرة وجلسات الخطّة" data-en="Before study &amp; plan sessions">قبل المذاكرة وجلسات الخطّة</div>
        <button class="rem-switch" role="switch" data-chan-switch="study" aria-checked="true"></button>
      </div>
      <div class="rem-chan-lead" data-lead-for="study"></div>
    </div>

    <div class="rem-chan" data-chan="events">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-bookmark"></i></span>
        <div class="rem-chan-name" data-ar="قبل الأحداث العامّة" data-en="Before events">قبل الأحداث العامّة</div>
        <button class="rem-switch" role="switch" data-chan-switch="events" aria-checked="true"></button>
      </div>
      <div class="rem-chan-lead" data-lead-for="events"></div>
    </div>

    <!--@3.REPJ.10-->

    <div class="rem-chan" data-chan="review">
      <div class="rem-chan-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-seedling"></i></span>
        <div class="rem-chan-name" data-ar="نداء المراجعة اليومي" data-en="Daily review nudge">نداء المراجعة اليومي</div>
        <button class="rem-switch" role="switch" data-chan-switch="review" aria-checked="false"></button>
      </div>
      <div class="rem-chan-lead">
        <label for="rem-review-time" data-ar="كل يوم الساعة" data-en="Every day at">كل يوم الساعة</label>
        <input type="time" class="rem-time" id="rem-review-time" value="20:00">
      </div>
    </div>
  </div>

  <!--@3.REPJ.11-->
  <div class="rem-cards">
    <div class="rem-card">
      <div class="rem-card-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-clock-rotate-left"></i></span>
        <div class="rem-chan-name" data-ar="أزرار الغفوة" data-en="Snooze buttons">أزرار الغفوة</div>
      </div>
      <div class="rem-snooze-opts" id="rem-snooze-opts">
        <button class="rem-snooze-chip" data-snooze="5" aria-pressed="false" data-ar="5 د" data-en="5m">5 د</button>
        <button class="rem-snooze-chip" data-snooze="10" aria-pressed="true" data-ar="10 د" data-en="10m">10 د</button>
        <button class="rem-snooze-chip" data-snooze="30" aria-pressed="false" data-ar="30 د" data-en="30m">30 د</button>
        <button class="rem-snooze-chip" data-snooze="60" aria-pressed="true" data-ar="ساعة" data-en="1h">ساعة</button>
        <button class="rem-snooze-chip" data-snooze="180" aria-pressed="false" data-ar="3 ساعات" data-en="3h">3 ساعات</button>
      </div>
      <div class="rem-card-hint" id="rem-snooze-hint"
           data-ar="تظهر على الإشعار نفسه لتأجيله بلمسة."
           data-en="They appear on the notification itself to postpone it in one tap.">
        تظهر على الإشعار نفسه لتأجيله بلمسة.
      </div>
    </div>

    <div class="rem-card">
      <div class="rem-card-head">
        <span class="rem-chan-icon"><i class="fa-solid fa-moon"></i></span>
        <div class="rem-chan-name" data-ar="ساعات الهدوء" data-en="Quiet hours">ساعات الهدوء</div>
        <button class="rem-switch" id="rem-quiet" role="switch" aria-checked="false"
                aria-label="ساعات الهدوء"></button>
      </div>
      <div class="rem-row">
        <input type="time" class="rem-time" id="rem-quiet-from" value="00:00">
        <span class="rem-sep" data-ar="إلى" data-en="to">إلى</span>
        <input type="time" class="rem-time" id="rem-quiet-to" value="07:00">
      </div>
      <div class="rem-card-hint"
           data-ar="ما يقع داخلها يُؤجَّل إلى نهايتها — لا يُلغى."
           data-en="Anything falling inside is delayed to the end — never dropped.">
        ما يقع داخلها يُؤجَّل إلى نهايتها — لا يُلغى.
      </div>
    </div>
  </div>

  <!--@3.REPJ.12-->
  <details class="rem-up-wrap">
    <summary class="rem-up-summary">
      <span data-ar="التنبيهات القادمة" data-en="Upcoming reminders">التنبيهات القادمة</span>
      <span class="rem-up-count" id="rem-up-count"></span>
      <i class="fa-solid fa-chevron-down rem-up-caret"></i>
    </summary>
    <div class="rem-up" id="rem-upcoming"></div>
  </details>

  <div style="display:flex;gap:.5rem;flex-wrap:wrap">
    <button class="dash-btn" data-act="rem-test">
      <i class="fa-solid fa-bell"></i><span data-ar="جرّب تنبيهاً الآن" data-en="Send a test">جرّب تنبيهاً الآن</span>
    </button>
    <button class="dash-btn" data-act="rem-refresh">
      <i class="fa-solid fa-rotate"></i><span data-ar="أعد الحساب" data-en="Recompute">أعد الحساب</span>
    </button>
    <!--@3.REPJ.13-->
    <button class="dash-btn" data-act="rem-test-server">
      <i class="fa-solid fa-tower-broadcast"></i><span data-ar="جرّب على كل أجهزتي" data-en="Test all my devices">جرّب على كل أجهزتي</span>
    </button>
  </div>
</div>
`;

  function mount(host) {
    if (!host || host.getAttribute('data-rem-mounted') === '1') return false;
    host.innerHTML = HTML;
    host.setAttribute('data-rem-mounted', '1');
    return true;
  }

  function mountAll() {
    var n = 0;
    Array.prototype.forEach.call(document.querySelectorAll('[data-rem-panel]'), function (h) {
      if (mount(h)) n++;
    });
    return n;
  }

  window.RemindersPanel = { mount: mount, mountAll: mountAll, html: HTML };

  /*@3.REPJ.2*/
  mountAll();
})();
