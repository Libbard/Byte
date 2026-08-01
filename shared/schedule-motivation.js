 
;(function () {
  'use strict';

   
  var MOTIVATION_AR = [
    'على قدر العزم',
    'فإن مع العسر',
    'تؤخذ الدنيا غلابا',
    'لا يفلّ الحديد إلا الحديد',
    'من جدّ وجد',
    'إذا غامرت في شرف',
    'فاصبر لها صبرا جميلا',
    'كن جبلا',
    'إنّ الأمور بآخرها',
    'فلا الجبل العالي ينام',
    'من سار وصل',
    'بلغت السماء',
    'وللصبر آخرٌ حلو',
    'دقيقةٌ الآن خيرٌ من ساعةٍ غدا',
    'ابدأ صغيراً ودُم',
    'الطريق يُقطع خطوةً خطوة',
    'ما بعد الجهد إلا الفرج',
    'اليقين يسبق الوصول'
  ];
  var MOTIVATION_EN = [
    'Per Aspera ad Astra',
    'Fortune Favors the Bold',
    'Carpe Diem',
    'Festina Lente',
    'Veni Vidi Vici',
    'Ad Astra',
    'Audaces Fortuna Iuvat',
    'Hold The Line',
    'This Too Shall Pass',
    'Nil Desperandum',
    'Dum Spiro Spero',
    'Sic Itur ad Astra',
    'Labor Omnia Vincit',
    'Vincit Qui Se Vincit',
    'Alis Volat Propriis',
    'Non Ducor, Duco',
    'Paulatim Ergo Certe',
    'Age Quod Agis'
  ];

   
  var FOOTER_QUOTES_AR = [
    'وما نيلُ المطالبِ بالتمنّي · ولكن تُؤخذُ الدنيا غلابا',
    'على قدر أهل العزمِ تأتي العزائم · وتأتي على قدر الكرامِ المكارم',
    'إذا كنتَ ذا رأيٍ فكن ذا عزيمة · فإن فسادَ الرأي أن تترددا',
    'بقدرِ الكدِّ تكتسبُ المعالي · ومن طلبَ العُلى سهرَ الليالي',
    'إذا غامرتَ في شرفٍ مرومٍ · فلا تقنعْ بما دونَ النجومِ',
    'ومن يتهيبْ صعودَ الجبالِ · يعشْ أبدَ الدهرِ بين الحفرِ',
    'إذا كانتِ النفوسُ كبارًا · تعبتْ في مرادِها الأجسامُ',
    'لا تحسبنَّ المجدَ تمرًا أنتَ آكلُهُ · لن تبلغَ المجدَ حتى تلعقَ الصبرَا',
    'ومن طلبَ العُلا من غيرِ كدٍّ · أضاعَ العمرَ في طلبِ المحالِ',
    'ولم أرَ في عيوبِ الناسِ شيئًا · كنقصِ القادرينَ على التمامِ',
    'وما الجمالُ لأثوابٍ تزيّننا · إنّ الجمالَ جمالُ العلمِ والأدبِ',
    'اصبرْ على مضضِ الإدلاجِ في السحرِ · وفي الرواحِ إلى الحاجاتِ والبُكرِ',
    'تعلّمْ فليس المرءُ يولدُ عالمًا · وليس أخو علمٍ كمن هو جاهلُ',
    'بقدرِ لغاتِ المرءِ يكثرُ نفعُهُ · وتلك له عندَ الملمّاتِ أعوانُ'
  ];
  var FOOTER_QUOTES_EN = [
    'It always seems impossible until it’s done — Nelson Mandela',
    'The journey of a thousand miles begins with a single step — Lao Tzu',
    'Success is not final, failure is not fatal: it is the courage to continue that counts — Winston Churchill',
    'What lies behind us and what lies before us are tiny matters compared to what lies within us — R.W. Emerson',
    'Fall seven times, stand up eight — Japanese Proverb',
    'We are what we repeatedly do. Excellence, then, is not an act but a habit — Aristotle',
    'The secret of getting ahead is getting started — Mark Twain',
    'Little strokes fell great oaks — Benjamin Franklin',
    'It does not matter how slowly you go as long as you do not stop — Confucius',
    'Discipline is choosing between what you want now and what you want most — Abraham Lincoln'
  ];

   
  var STUDY_METHODS_AR = [
    ['بومودورو', ['٢٥ دقيقة تركيز ثم ٥ راحة', 'بعد أربع جلسات استرح ٢٠ دقيقة', 'ابدأ بالأصعب وأنت في قمّة تركيزك']],
    ['تقنية فاينمان', ['اشرح الموضوع بكلماتك أنت', 'عند التعثّر ارجع للمصدر', 'بسّط حتى لا يبقى غموض']],
    ['التكرار المتباعد', ['راجع بعد ساعة', 'ثم بعد يوم ثم بعد أسبوع', 'الذاكرة تثبت بالتباعد لا بالتكرار المتقارب']],
    ['الجلسات المركّزة', ['٩٠ دقيقة بلا مقاطعة', 'أغلق الإشعارات تماماً', 'الذهن يبلغ ذروته بعد ٢٠ دقيقة']],
    ['الاسترجاع النشط', ['أغلق الملزمة واستدعِ ما تذكر', 'اكتب ما استدعيته ثم قارن', 'الفجوة التي تجدها هي درسك القادم']],
    ['التشذير (Interleaving)', ['نوّع بين مادّتين في الجلسة', 'لا تُنهِ نوعاً واحداً دفعةً واحدة', 'الخلط يُبطئ اليوم ويُثبّت غداً']]
  ];
  var STUDY_METHODS_EN = [
    ['Pomodoro', ['25 min focus, then 5 min rest', 'After four rounds, take 20 min', 'Tackle the hardest task at peak focus']],
    ['Feynman Technique', ['Explain it in your own words', 'When stuck, return to the source', 'Simplify until nothing is fuzzy']],
    ['Spaced Repetition', ['Review after one hour', 'Then after a day, then a week', 'Memory consolidates by spacing']],
    ['Deep Focus', ['90 minutes uninterrupted', 'Silence every notification', 'Peak focus arrives after 20 minutes']],
    ['Active Recall', ['Close the book and retrieve', 'Write what you recalled, then compare', 'The gap you find is your next lesson']],
    ['Interleaving', ['Alternate two subjects per session', 'Do not finish one in a single block', 'Mixing slows today, secures tomorrow']]
  ];

   
  var SMART_TIPS_AR = [
    ['الاسترجاع النشط أقوى من القراءة', 'حلّ مسائل بعد كل وحدة', 'راجع قبل النوم لتثبيت المعلومة', 'يوم الاختبار مراجعةٌ فقط'],
    ['اشرح الدرس لنفسك كأنك معلّم', 'اربط الجديد بمعلومةٍ قديمة', 'نوّع المكان للتغلّب على الملل', 'النوم الجيّد خيرٌ من السهر'],
    ['اختبر نفسك بأسئلةٍ سابقة', 'اكتب الملخّصات بخطّ يدك', 'تجنّب تعدّد المهام تماماً', 'استخدم البطاقات للمفاهيم'],
    ['افهم الفكرة قبل الحفظ', 'رتّب أولوياتك من الأصعب للأسهل', 'خصّص وقتاً للراحة لا تتنازل عنه', 'اشرب الماء بانتظام'],
    ['ابدأ بأصعب مادّة في أنشط ساعاتك', 'قسّم الوحدة الكبيرة إلى ثلاث جلسات', 'ضع هاتفك في غرفةٍ أخرى', 'راجع أخطاءك لا إجاباتك الصحيحة'],
    ['اكتب سؤالاً واحداً قبل كل جلسة', 'أنهِ الجلسة وأنت تعرف بدايةَ التالية', 'خمس دقائق مشي بين الجلستين', 'قِس تقدّمك بالمُنجَز لا بالساعات']
  ];
  var SMART_TIPS_EN = [
    ['Active recall beats rereading', 'Solve problems after each module', 'Review before sleep to lock it in', 'Exam day is for review only'],
    ['Teach the topic to yourself', 'Connect new material to old', 'Vary your study spot', 'Good sleep beats late cramming'],
    ['Test yourself with past papers', 'Hand-write your summaries', 'Avoid multitasking entirely', 'Use flashcards for concepts'],
    ['Understand before memorizing', 'Order tasks hardest first', 'Protect rest time fiercely', 'Stay hydrated'],
    ['Start the hardest subject at your sharpest hour', 'Split a big module into three sittings', 'Leave your phone in another room', 'Review your mistakes, not your correct answers'],
    ['Write one question before each session', 'End knowing where the next one starts', 'Walk five minutes between sessions', 'Measure progress by output, not hours']
  ];

   
  function pick(arr, seed, salt) {
    return arr[Math.abs(Math.floor(seed * 9301 + salt * 49297) % arr.length)];
  }

   
  function forDoc(ar) {
    var seed = Date.now() % 233280;
    return {
      badge:  pick(ar ? MOTIVATION_AR : MOTIVATION_EN, seed, 1),
      quote:  pick(ar ? FOOTER_QUOTES_AR : FOOTER_QUOTES_EN, seed, 2),
      method: pick(ar ? STUDY_METHODS_AR : STUDY_METHODS_EN, seed, 3),
      tips:   pick(ar ? SMART_TIPS_AR : SMART_TIPS_EN, seed, 4)
    };
  }

  window.GardenScheduleMotivation = { forDoc: forDoc };
})();
